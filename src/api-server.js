require('dotenv').config();
const express = require('express');
const http = require('http');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { v4: uuidv4 } = require('uuid');
const { body, validationResult } = require('express-validator');
const callsRouter = require('./routes/api/v1/calls');
const callLogsRouter = require('./routes/api/v1/call-logs');
const Database = require('./db/database');
const CallWebSocketHandler = require('./routes/api/v1/websocket');
const logger = require('./utils/logger');

class APIServer {
    constructor() {
        this.app = express();
        this.server = http.createServer(this.app);
        this.port = process.env.PORT || 3000;
        this.database = new Database();
        
        this.setupMiddleware();
        this.setupRoutes();
        this.setupWebSocket();
        this.setupErrorHandling();
    }

    setupMiddleware() {
        // Security middleware
        this.app.use(helmet({
            contentSecurityPolicy: {
                directives: {
                    defaultSrc: ["'self'"],
                    scriptSrc: ["'self'", "'unsafe-inline'", "https://unpkg.com"],
                    styleSrc: ["'self'", "'unsafe-inline'"],
                    connectSrc: ["'self'", "wss:", "ws:"]
                }
            }
        }));
        
        // CORS configuration using environment variables
        const allowedOrigins = process.env.ALLOWED_ORIGINS ? 
            process.env.ALLOWED_ORIGINS.split(',') : 
            ['http://localhost:3000', 'http://127.0.0.1:3000', 'https://ec2-52-221-184-153.ap-southeast-1.compute.amazonaws.com'];
            
        this.app.use(cors({
            origin: allowedOrigins,
            credentials: true,
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key']
        }));

        // Rate limiting with environment configuration
        const limiter = rateLimit({
            windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
            max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
            message: {
                success: false,
                error: {
                    code: 'RATE_LIMIT_EXCEEDED',
                    message: 'Too many requests from this IP, please try again later'
                }
            },
            standardHeaders: true,
            legacyHeaders: false
        });
        this.app.use('/api/', limiter);

        // Request parsing
        this.app.use(express.json({ limit: '10mb' }));
        this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

        // Request ID middleware
        this.app.use((req, res, next) => {
            req.requestId = uuidv4();
            next();
        });

        // Logging middleware using Winston
        this.app.use((req, res, next) => {
            const start = Date.now();
            res.on('finish', () => {
                const duration = Date.now() - start;
                logger.info('HTTP Request', {
                    requestId: req.requestId,
                    method: req.method,
                    url: req.url,
                    status: res.statusCode,
                    duration: `${duration}ms`,
                    ip: req.ip,
                    userAgent: req.get('User-Agent')
                });
            });
            next();
        });
    }

    setupRoutes() {
        // Health check endpoint
        this.app.get('/api/health', (req, res) => {
            res.json({
                status: 'healthy',
                timestamp: new Date().toISOString()
            });
        });

        // API version check endpoint
        this.app.get('/api/version', (req, res) => {
            res.json({
                version: process.env.API_VERSION || '1.0.0',
                timestamp: new Date().toISOString()
            });
        });

        // Mount API routes
        this.app.use('/api/v1/calls', callsRouter);
        this.app.use('/api/v1/call-logs', callLogsRouter);

        // Graceful shutdown handler
        process.on('SIGTERM', () => {
            console.log('Received SIGTERM signal. Closing database connection...');
            database.close().then(() => {
                console.log('Database connection closed.');
                process.exit(0);
            }).catch(err => {
                console.error('Error closing database:', err);
                process.exit(1);
            });
        });
    }

    setupWebSocket() {
        try {
            this.wsHandler = new CallWebSocketHandler(this.server);
            logger.info('WebSocket server initialized successfully');
        } catch (error) {
            logger.error('Failed to initialize WebSocket server:', error);
            throw error;
        }
    }

    setupErrorHandling() {
        // 404 handler
        this.app.use((req, res) => {
            res.status(404).json({
                success: false,
                error: {
                    code: 'NOT_FOUND',
                    message: 'Resource not found'
                },
                meta: {
                    timestamp: new Date().toISOString(),
                    requestId: req.requestId
                }
            });
        });

        // Global error handler
        this.app.use((error, req, res, next) => {
            console.error('Unhandled error:', error);

            res.status(error.status || 500).json({
                success: false,
                error: {
                    code: error.code || 'INTERNAL_ERROR',
                    message: process.env.NODE_ENV === 'production' 
                        ? 'An unexpected error occurred' 
                        : error.message
                },
                meta: {
                    timestamp: new Date().toISOString(),
                    requestId: req.requestId
                }
            });
        });
    }

    async start(port = process.env.PORT || 3000) {
        try {
            // Initialize database
            await this.database.initialize();
            logger.info('Database initialized successfully');
            
            // Start server
            this.server.listen(port, () => {
                logger.info(`API Server listening on port ${port}`);
                logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
            });
            
            // Graceful shutdown handling
            this.setupGracefulShutdown();
            
        } catch (error) {
            logger.error('Failed to start API server:', error);
            throw error;
        }
    }
    
    setupGracefulShutdown() {
        const shutdown = async (signal) => {
            logger.info(`Received ${signal}. Starting graceful shutdown...`);
            
            // Close server
            this.server.close(() => {
                logger.info('HTTP server closed');
            });
            
            // Close database connection
            if (this.database) {
                await this.database.close();
                logger.info('Database connection closed');
            }
            
            // Close WebSocket connections
            if (this.wsHandler) {
                this.wsHandler.close();
                logger.info('WebSocket connections closed');
            }
            
            logger.info('Graceful shutdown completed');
            process.exit(0);
        };
        
        process.on('SIGTERM', () => shutdown('SIGTERM'));
        process.on('SIGINT', () => shutdown('SIGINT'));
        
        process.on('uncaughtException', (error) => {
            logger.error('Uncaught Exception:', error);
            shutdown('uncaughtException');
        });
        
        process.on('unhandledRejection', (reason, promise) => {
            logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
            shutdown('unhandledRejection');
        });
    }

    stop() {
        return new Promise((resolve, reject) => {
            try {
                this.server.close(() => {
                    console.log('API Server stopped');
                    resolve();
                });
            } catch (error) {
                console.error('Failed to stop API server:', error);
                reject(error);
            }
        });
    }
}

module.exports = new APIServer();