const request = require('supertest');
const apiServer = require('../api-server');

describe('API Endpoints', () => {
    beforeAll(async () => {
        await apiServer.start(0); // Use random port for testing
    });

    afterAll(async () => {
        await apiServer.stop();
    });

    describe('Health Check', () => {
        it('should return healthy status', async () => {
            const response = await request(apiServer.app)
                .get('/api/health')
                .expect(200);

            expect(response.body).toHaveProperty('status', 'healthy');
            expect(response.body).toHaveProperty('timestamp');
        });
    });

    describe('Call Management', () => {
        it('should create a new call', async () => {
            const callData = {
                name: 'Test User',
                phone: '+1234567890',
                callType: 'audio'
            };

            const response = await request(apiServer.app)
                .post('/api/v1/calls')
                .send(callData)
                .expect(201);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('callId');
            expect(response.body.data).toHaveProperty('status', 'initializing');
            expect(response.body.data).toHaveProperty('wsUrl');
        });

        it('should validate call request parameters', async () => {
            const invalidCallData = {
                name: '',
                phone: 'invalid',
                callType: 'invalid'
            };

            const response = await request(apiServer.app)
                .post('/api/v1/calls')
                .send(invalidCallData)
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
            expect(response.body.error.details).toBeInstanceOf(Array);
        });

        it('should get call status', async () => {
            // First create a call
            const createResponse = await request(apiServer.app)
                .post('/api/v1/calls')
                .send({
                    name: 'Status Test',
                    phone: '+1234567890',
                    callType: 'audio'
                });

            const callId = createResponse.body.data.callId;

            const response = await request(apiServer.app)
                .get(`/api/v1/calls/${callId}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('callId', callId);
            expect(response.body.data).toHaveProperty('status');
            expect(response.body.data).toHaveProperty('duration');
        });

        it('should handle call actions', async () => {
            // First create a call
            const createResponse = await request(apiServer.app)
                .post('/api/v1/calls')
                .send({
                    name: 'Action Test',
                    phone: '+1234567890',
                    callType: 'audio'
                });

            const callId = createResponse.body.data.callId;

            const actions = ['mute', 'unmute', 'dtmf', 'hangup'];

            for (const action of actions) {
                const actionData = {
                    action,
                    ...(action === 'dtmf' ? { dtmfDigit: '1' } : {})
                };

                const response = await request(apiServer.app)
                    .post(`/api/v1/calls/${callId}/actions`)
                    .send(actionData)
                    .expect(200);

                expect(response.body.success).toBe(true);
                expect(response.body.data).toHaveProperty('action', action);
                expect(response.body.data).toHaveProperty('actionSuccess', true);
            }
        });
    });

    describe('Error Handling', () => {
        it('should handle 404 not found', async () => {
            const response = await request(apiServer.app)
                .get('/api/nonexistent')
                .expect(404);

            expect(response.body.success).toBe(false);
            expect(response.body.error).toHaveProperty('code', 'NOT_FOUND');
        });

        it('should handle invalid call ID', async () => {
            const response = await request(apiServer.app)
                .get('/api/v1/calls/invalid-id')
                .expect(404);

            expect(response.body.success).toBe(false);
            expect(response.body.error).toHaveProperty('code', 'NOT_FOUND');
        });
    });
});