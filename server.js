const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const { Web: SIP } = require('sip.js');
const winston = require('winston');
const path = require('path');

// Call statistics storage
let callStats = {
    activeCalls: 0,
    totalCalls: 0,
    successRate: 100,
    callDurations: Array(12).fill(0),
    errorRates: Array(6).fill(0),
    alerts: []
};

// Configure Winston logger
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.File({ 
            filename: path.join(__dirname, 'logs', 'error.log'), 
            level: 'error' 
        }),
        new winston.transports.File({ 
            filename: path.join(__dirname, 'logs', 'combined.log')
        })
    ]
});

// Add console transport in development
if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: winston.format.simple()
    }));
}

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Serve static files
app.use(express.static(__dirname));

// Store connected clients
const clients = new Map();

// Configure SIP connection to PBX
const sipConfig = {
    uri: 'sip:webrtc@ec2-52-221-184-153.ap-southeast-1.compute.amazonaws.com',
    transportOptions: {
        server: 'wss://ec2-52-221-184-153.ap-southeast-1.compute.amazonaws.com:8089/ws'
    },
    authorizationUsername: 'webrtc',
    password: 'your-password',
    logLevel: 'debug'
};

// Initialize SIP user agent
const userAgent = new SIP.SimpleUser(sipConfig);

wss.on('connection', (ws) => {
    const clientId = generateClientId();
    clients.set(ws, clientId);

    logger.info(`Client connected: ${clientId}`);

    ws.on('message', async (message) => {
        const data = JSON.parse(message);
        
        switch(data.type) {
            case 'register':
                // Store client info
                clients.set(ws, {
                    id: clientId,
                    name: data.name,
                    phone: data.phone
                });
                break;

            case 'call':
                // Initialize call to PBX
                try {
                    await userAgent.connect();
                    const session = await userAgent.call(`sip:${data.phone}@ec2-52-221-184-153.ap-southeast-1.compute.amazonaws.com`, {
                        media: {
                            constraints: {
                                audio: true,
                                video: false
                            }
                        }
                    });

                    session.stateChange.addListener((state) => {
                        switch (state) {
                            case SIP.SessionState.Establishing:
                                ws.send(JSON.stringify({
                                    type: 'callStatus',
                                    status: 'connecting'
                                }));
                                break;
                            case SIP.SessionState.Established:
                                ws.send(JSON.stringify({
                                    type: 'callStatus',
                                    status: 'connected'
                                }));
                                break;
                            case SIP.SessionState.Terminated:
                                ws.send(JSON.stringify({
                                    type: 'callStatus',
                                    status: 'failed'
                                }));
                                break;
                        }
                    });

                } catch (error) {
                    logger.error('Call establishment failed', {
                        error: error.message,
                        clientId,
                        phone: data.phone
                    });
                    ws.send(JSON.stringify({
                        type: 'error',
                        message: 'Failed to establish call'
                    }));
                }
                break;

            case 'ice':
                // Handle ICE candidates
                break;

            case 'offer':
                // Handle SDP offer
                break;

            case 'answer':
                // Handle SDP answer
                break;
        }
    });

    ws.on('close', () => {
        clients.delete(ws);
        logger.info(`Client disconnected: ${clientId}`);
    });
});

function generateClientId() {
    return Math.random().toString(36).substr(2, 9);
}

// API endpoints for dashboard
app.get('/api/call-statistics', (req, res) => {
    res.json(callStats);
});

// Example: Update call statistics periodically
setInterval(() => {
    // Simulate real-time updates
    updateCallStats({
        activeCalls: Math.floor(Math.random() * 10),
        totalCalls: Math.floor(Math.random() * 100),
        successRate: 95 + Math.floor(Math.random() * 5),
        callDurations: Array(12).fill(0).map(() => Math.floor(Math.random() * 10)),
        errorRates: Array(6).fill(0).map(() => Math.floor(Math.random() * 5))
    });
}, 30000);

// Example: Generate random alerts
setInterval(() => {
    const types = ['info', 'warning', 'error', 'success'];
    const messages = [
        'Call quality degraded',
        'Network latency increased',
        'Connection established successfully',
        'SIP registration renewed',
        'Media stream interrupted'
    ];
    
    addAlert({
        type: types[Math.floor(Math.random() * types.length)],
        message: messages[Math.floor(Math.random() * messages.length)],
        timestamp: new Date()
    });
}, 10000);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`);
    logger.info(`Dashboard available at http://localhost:${PORT}/dashboard.html`);
    
    // Ensure logs directory exists
    const fs = require('fs');
    const logsDir = path.join(__dirname, 'logs');
    if (!fs.existsSync(logsDir)) {
        fs.mkdirSync(logsDir);
    }
});