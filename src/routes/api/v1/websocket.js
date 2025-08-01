const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');
const { getSBCConfig } = require('../../../sip-config');

class CallWebSocketHandler {
    constructor() {
        this.connections = new Map();
    }

    // Initialize WebSocket server
    initialize(server) {
        this.wss = new WebSocket.Server({
            server,
            path: '/api/v1/ws/calls'
        });

        this.wss.on('connection', (ws, req) => this.handleConnection(ws, req));
    }

    // Handle new WebSocket connection
    handleConnection(ws, req) {
        const connectionId = uuidv4();
        const { callId, sbcType } = this.extractConnectionInfo(req.url);

        if (!callId || !sbcType) {
            ws.close(4000, 'Invalid connection parameters');
            return;
        }

        // Get SBC configuration
        let sbcConfig;
        try {
            sbcConfig = getSBCConfig(sbcType);
        } catch (error) {
            ws.close(4001, 'Invalid SBC type');
            return;
        }

        this.connections.set(connectionId, {
            ws,
            callId,
            sbcType,
            sbcConfig,
            connected: new Date()
        });

        // Send initial connection success message
        this.sendMessage(ws, {
            type: 'connection_established',
            data: {
                connectionId,
                callId,
                sbcType,
                timestamp: new Date().toISOString(),
                config: {
                    wsUrl: sbcConfig.sipServer.wsUrl,
                    domain: sbcConfig.sipServer.domain,
                    iceServers: sbcConfig.iceServers
                }
            }
        });

        // Handle incoming messages
        ws.on('message', (message) => this.handleMessage(connectionId, message));

        // Handle connection close
        ws.on('close', () => this.handleClose(connectionId));

        // Handle errors
        ws.on('error', (error) => this.handleError(connectionId, error));
    }

    // Extract connection info from WebSocket URL
    extractConnectionInfo(url) {
        const match = url.match(/\/calls\/([\w-]+)\/([\w-]+)$/);
        return match ? { callId: match[1], sbcType: match[2] } : { callId: null, sbcType: null };
    }

    // Handle incoming WebSocket messages
    handleMessage(connectionId, message) {
        const connection = this.connections.get(connectionId);
        if (!connection) return;

        try {
            const data = JSON.parse(message);
            
            switch (data.type) {
                case 'dtmf':
                    this.handleDTMF(connection, data);
                    break;
                case 'status_update':
                    this.handleStatusUpdate(connection, data);
                    break;
                case 'media_request':
                    this.handleMediaRequest(connection, data);
                    break;
                default:
                    console.warn(`Unknown message type: ${data.type}`);
            }
        } catch (error) {
            console.error('Error processing message:', error);
            this.sendError(connection.ws, 'Invalid message format');
        }
    }

    // Handle DTMF signals
    handleDTMF(connection, data) {
        if (!data.digit || !/^[0-9*#]$/.test(data.digit)) {
            this.sendError(connection.ws, 'Invalid DTMF digit');
            return;
        }

        // Process DTMF based on SBC type
        const dtmfConfig = connection.sbcConfig.media.audio.dtmfType;
        this.sendMessage(connection.ws, {
            type: 'dtmf_processed',
            data: {
                digit: data.digit,
                method: dtmfConfig,
                timestamp: new Date().toISOString()
            }
        });
    }

    // Handle media requests
    handleMediaRequest(connection, data) {
        const mediaConfig = connection.sbcConfig.media;
        this.sendMessage(connection.ws, {
            type: 'media_config',
            data: {
                audio: mediaConfig.audio,
                video: mediaConfig.video,
                timestamp: new Date().toISOString()
            }
        });
    }

    // Handle call status updates
    handleStatusUpdate(connection, data) {
        if (!data.status) {
            this.sendError(connection.ws, 'Invalid status update');
            return;
        }

        // Broadcast status update to all connections for this call
        this.broadcastToCall(connection.callId, {
            type: 'call_status',
            data: {
                status: data.status,
                sbcType: connection.sbcType,
                timestamp: new Date().toISOString()
            }
        });
    }

    // Handle WebSocket connection close
    handleClose(connectionId) {
        const connection = this.connections.get(connectionId);
        if (connection) {
            // Cleanup connection
            this.connections.delete(connectionId);
            console.log(`WebSocket connection closed: ${connectionId}`);
        }
    }

    // Handle WebSocket errors
    handleError(connectionId, error) {
        console.error(`WebSocket error for connection ${connectionId}:`, error);
        const connection = this.connections.get(connectionId);
        if (connection) {
            this.sendError(connection.ws, 'Internal server error');
        }
    }

    // Send message to WebSocket client
    sendMessage(ws, message) {
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify(message));
        }
    }

    // Send error message to WebSocket client
    sendError(ws, message) {
        this.sendMessage(ws, {
            type: 'error',
            data: {
                message,
                timestamp: new Date().toISOString()
            }
        });
    }

    // Broadcast message to all connections for a specific call
    broadcastToCall(callId, message) {
        for (const [_, connection] of this.connections) {
            if (connection.callId === callId) {
                this.sendMessage(connection.ws, message);
            }
        }
    }

    // Get all active connections for a call
    getCallConnections(callId) {
        return Array.from(this.connections.values())
            .filter(connection => connection.callId === callId);
    }
}

module.exports = new CallWebSocketHandler();