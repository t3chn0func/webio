const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { v4: uuidv4 } = require('uuid');
const database = require('../../../db/database');
const { getSBCConfig } = require('../../../sip-config');

// Call validation middleware
const validateCall = [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('phone').trim().notEmpty().matches(/^\+?[1-9]\d{1,14}$/).withMessage('Valid phone number is required'),
    body('callType').isIn(['audio', 'video']).withMessage('Call type must be audio or video'),
    body('sbcType').trim().notEmpty().withMessage('SBC type is required')
];

// Active calls storage
const activeCalls = new Map();

// Initialize a new call
router.post('/', validateCall, async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            error: {
                code: 'VALIDATION_ERROR',
                message: 'Invalid request parameters',
                details: errors.array()
            }
        });
    }

    try {
        const { name, phone, callType, sbcType } = req.body;
        const callId = uuidv4();

        // Get SBC configuration
        let sbcConfig;
        try {
            sbcConfig = getSBCConfig(sbcType);
        } catch (error) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'INVALID_SBC_TYPE',
                    message: error.message
                }
            });
        }

        // Store call information
        const startTime = new Date().toISOString();
        const callInfo = {
            id: callId,
            name,
            phone,
            callType,
            sbcType,
            sbcConfig,
            status: 'initializing',
            startTime,
            wsUrl: `${sbcConfig.sipServer.wsUrl}/calls/${callId}`
        };
        
        activeCalls.set(callId, callInfo);

        // Log call to database
        await database.logCall({
            callId,
            customerName: name,
            ani: phone,
            callType,
            sbcType,
            startTime,
            status: 'initializing',
            actions: [{
                type: 'initialize',
                timestamp: startTime,
                status: 'initializing'
            }]
        });

        res.status(201).json({
            success: true,
            data: {
                callId,
                status: 'initializing',
                wsUrl: callInfo.wsUrl,
                sbcConfig: {
                    wsUrl: sbcConfig.sipServer.wsUrl,
                    domain: sbcConfig.sipServer.domain,
                    iceServers: sbcConfig.iceServers
                }
            },
            meta: {
                timestamp: new Date().toISOString(),
                requestId: req.requestId
            }
        });
    } catch (error) {
        console.error('Call initialization error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Failed to initialize call'
            },
            meta: {
                timestamp: new Date().toISOString(),
                requestId: req.requestId
            }
        });
    }
});

// Get call status
router.get('/:callId', (req, res) => {
    const { callId } = req.params;
    const call = activeCalls.get(callId);

    if (!call) {
        return res.status(404).json({
            success: false,
            error: {
                code: 'NOT_FOUND',
                message: 'Call not found'
            },
            meta: {
                timestamp: new Date().toISOString(),
                requestId: req.requestId
            }
        });
    }

    res.json({
        success: true,
        data: {
            callId: call.id,
            status: call.status,
            duration: call.startTime ? Math.floor((Date.now() - new Date(call.startTime)) / 1000) : 0
        },
        meta: {
            timestamp: new Date().toISOString(),
            requestId: req.requestId
        }
    });
});

// Call control actions
router.post('/:callId/actions', [
    body('action').isIn(['mute', 'unmute', 'hangup', 'dtmf']).withMessage('Invalid action'),
    body('dtmfDigit').optional().matches(/^[0-9*#]$/).withMessage('Invalid DTMF digit')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            error: {
                code: 'VALIDATION_ERROR',
                message: 'Invalid action parameters',
                details: errors.array()
            }
        });
    }

    const { callId } = req.params;
    const { action, dtmfDigit } = req.body;
    const call = activeCalls.get(callId);

    if (!call) {
        return res.status(404).json({
            success: false,
            error: {
                code: 'NOT_FOUND',
                message: 'Call not found'
            }
        });
    }

    try {
        // Handle different actions
        switch (action) {
            case 'mute':
            case 'unmute':
                call.isMuted = action === 'mute';
                break;
            case 'dtmf':
                if (!dtmfDigit) {
                    return res.status(400).json({
                        success: false,
                        error: {
                            code: 'VALIDATION_ERROR',
                            message: 'DTMF digit is required for dtmf action'
                        }
                    });
                }
                // Handle DTMF
                break;
            case 'hangup':
                call.status = 'ended';
                await database.updateCallStatus(callId, 'ended', 'hangup');
                activeCalls.delete(callId);
                break;
        }

        res.json({
            success: true,
            data: {
                callId,
                status: call.status,
                action: action,
                actionSuccess: true
            },
            meta: {
                timestamp: new Date().toISOString(),
                requestId: req.requestId
            }
        });
    } catch (error) {
        console.error(`Error performing action ${action} on call ${callId}:`, error);
        res.status(500).json({
            success: false,
            error: {
                code: 'ACTION_FAILED',
                message: `Failed to perform action: ${action}`
            },
            meta: {
                timestamp: new Date().toISOString(),
                requestId: req.requestId
            }
        });
    }
});

module.exports = router;