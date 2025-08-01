const express = require('express');
const router = express.Router();
const { query, validationResult } = require('express-validator');
const database = require('../../../db/database');

// Validation middleware for call history filters
const validateFilters = [
    query('customerName').optional().trim().escape(),
    query('ani').optional().trim().matches(/^\+?[1-9]\d{1,14}$/).withMessage('Invalid phone number format'),
    query('startDate').optional().isDate().withMessage('Invalid start date format'),
    query('endDate').optional().isDate().withMessage('Invalid end date format')
];

// Get call history with filters
router.get('/', validateFilters, async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            error: {
                code: 'VALIDATION_ERROR',
                message: 'Invalid filter parameters',
                details: errors.array()
            }
        });
    }

    try {
        const filters = {
            customerName: req.query.customerName,
            ani: req.query.ani,
            startDate: req.query.startDate,
            endDate: req.query.endDate
        };

        const callHistory = await database.getCallHistory(filters);

        res.json({
            success: true,
            data: {
                calls: callHistory.map(call => ({
                    ...call,
                    actions: JSON.parse(call.actions || '[]')
                })),
                total: callHistory.length
            },
            meta: {
                filters,
                timestamp: new Date().toISOString()
            }
        });
    } catch (error) {
        console.error('Error fetching call history:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'DATABASE_ERROR',
                message: 'Failed to fetch call history'
            }
        });
    }
});

// Get specific call details
router.get('/:callId', async (req, res) => {
    try {
        const callHistory = await database.getCallHistory({
            callId: req.params.callId
        });

        if (callHistory.length === 0) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'NOT_FOUND',
                    message: 'Call record not found'
                }
            });
        }

        const call = callHistory[0];
        call.actions = JSON.parse(call.actions || '[]');

        res.json({
            success: true,
            data: call,
            meta: {
                timestamp: new Date().toISOString()
            }
        });
    } catch (error) {
        console.error('Error fetching call details:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'DATABASE_ERROR',
                message: 'Failed to fetch call details'
            }
        });
    }
});

// Export statistics for date range
router.get('/stats/export', validateFilters, async (req, res) => {
    try {
        const filters = {
            startDate: req.query.startDate,
            endDate: req.query.endDate
        };

        const callHistory = await database.getCallHistory(filters);

        // Calculate statistics
        const stats = {
            totalCalls: callHistory.length,
            averageDuration: 0,
            callsByStatus: {},
            callsByType: {},
            timeDistribution: {
                morning: 0,    // 6-12
                afternoon: 0,  // 12-17
                evening: 0,    // 17-22
                night: 0       // 22-6
            }
        };

        let totalDuration = 0;

        callHistory.forEach(call => {
            // Status distribution
            stats.callsByStatus[call.status] = (stats.callsByStatus[call.status] || 0) + 1;

            // Call type distribution
            stats.callsByType[call.call_type] = (stats.callsByType[call.call_type] || 0) + 1;

            // Duration
            if (call.duration) {
                totalDuration += call.duration;
            }

            // Time distribution
            const hour = new Date(call.start_time).getHours();
            if (hour >= 6 && hour < 12) stats.timeDistribution.morning++;
            else if (hour >= 12 && hour < 17) stats.timeDistribution.afternoon++;
            else if (hour >= 17 && hour < 22) stats.timeDistribution.evening++;
            else stats.timeDistribution.night++;
        });

        stats.averageDuration = callHistory.length ? Math.round(totalDuration / callHistory.length) : 0;

        res.json({
            success: true,
            data: stats,
            meta: {
                filters,
                timestamp: new Date().toISOString()
            }
        });
    } catch (error) {
        console.error('Error generating call statistics:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'PROCESSING_ERROR',
                message: 'Failed to generate call statistics'
            }
        });
    }
});

module.exports = router;