const request = require('supertest');
const express = require('express');
const settingsRoutes = require('../routes/settings');
const settingsService = require('../services/settingsService');

// Mock settings service
jest.mock('../services/settingsService');

const app = express();
app.use(express.json());
// Mount routes directly to minimal app to test logic independently of authentication middleware if desired,
// OR mock auth middleware if we use the real server. 
// Using a minimal app is usually cleaner for unit testing routes.
app.use('/api/settings', settingsRoutes);

describe('Settings Routes', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('GET /api/settings', () => {
        test('should return masked api key', async () => {
            settingsService.getBrainApiKey.mockReturnValue('1234567890abcdef');

            const res = await request(app).get('/api/settings');

            expect(res.status).toBe(200);
            expect(res.body.brainApiKey).toBe('1234...cdef');
            expect(res.body.isSet).toBe(true);
        });

        test('should return empty if no key set', async () => {
            settingsService.getBrainApiKey.mockReturnValue('');

            const res = await request(app).get('/api/settings');

            expect(res.status).toBe(200);
            expect(res.body.brainApiKey).toBe('');
            expect(res.body.isSet).toBe(false);
        });
    });

    describe('POST /api/settings', () => {
        test('should update api key', async () => {
            const res = await request(app)
                .post('/api/settings')
                .send({ brainApiKey: 'new-key' });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(settingsService.setBrainApiKey).toHaveBeenCalledWith('new-key');
        });

        test('should handle validation (optional)', async () => {
             // If we add validation later, test it here.
             // Currently it accepts any string.
        });
    });
});
