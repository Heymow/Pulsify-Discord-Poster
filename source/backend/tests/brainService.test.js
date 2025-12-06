const axios = require('axios');
const settingsService = require('../services/settingsService');
const brainService = require('../services/brainService');

jest.mock('axios');
jest.mock('../services/settingsService');
jest.mock('../utils/logger');

describe('BrainService', () => {
    const mockDiscordId = '123456789';
    const mockTaskType = 'post_message';
    const mockData = { message: 'hello' };
    const mockSteps = [{ id: 1, type: 'click' }];
    const mockLogId = 'log-101';

    beforeEach(() => {
        jest.clearAllMocks();
        settingsService.getBrainApiKey.mockReturnValue('mock-api-key');
    });

    describe('getInstructions', () => {
        test('should call API and return steps and logId', async () => {
            axios.post.mockResolvedValue({ 
                data: { 
                    steps: mockSteps,
                    logId: mockLogId 
                } 
            });

            const result = await brainService.getInstructions(mockDiscordId, mockTaskType, mockData);

            expect(result).toEqual({ steps: mockSteps, logId: mockLogId });
            expect(axios.post).toHaveBeenCalledWith(
                expect.stringContaining('/instructions'),
                {
                    discordId: mockDiscordId,
                    taskType: mockTaskType,
                    data: mockData
                },
                expect.objectContaining({
                    headers: expect.objectContaining({
                        'x-api-key': 'mock-api-key',
                        'Content-Type': 'application/json'
                    })
                })
            );
        });

        test('should handle missing logId gracefully', async () => {
            axios.post.mockResolvedValue({ data: { steps: mockSteps } }); // keys missing

            const result = await brainService.getInstructions(mockDiscordId, mockTaskType, mockData);

            expect(result.steps).toEqual(mockSteps);
            expect(result.logId).toBeUndefined();
        });

        test('should throw FORBIDDEN_ACCESS on 403', async () => {
            const error = {
                response: {
                    status: 403,
                    data: { error: 'Forbidden' }
                }
            };
            axios.post.mockRejectedValue(error);

            await expect(brainService.getInstructions(mockDiscordId, mockTaskType, mockData))
                .rejects.toThrow('FORBIDDEN_ACCESS');
        });

        test('should throw AUTH_FAILED on 401', async () => {
            const error = {
                response: {
                    status: 401,
                    data: { error: 'Unauthorized' }
                }
            };
            axios.post.mockRejectedValue(error);

            await expect(brainService.getInstructions(mockDiscordId, mockTaskType, mockData))
                .rejects.toThrow('AUTH_FAILED');
        });

        test('should rethrow generic errors', async () => {
             const error = new Error('Network Error');
            axios.post.mockRejectedValue(error);

            await expect(brainService.getInstructions(mockDiscordId, mockTaskType, mockData))
                .rejects.toThrow('Network Error');
        });
    });

    describe('updateLog', () => {
        it('should send PUT request to update log status', async () => {
            axios.put.mockResolvedValue({});

            await brainService.updateLog(mockLogId, 'success');

            expect(axios.put).toHaveBeenCalledWith(
                expect.stringContaining(`/logs/${mockLogId}`),
                { status: 'success', error: null },
                expect.objectContaining({
                    headers: expect.objectContaining({
                        'x-api-key': 'mock-api-key'
                    })
                })
            );
        });

        it('should include error message if failed', async () => {
            axios.put.mockResolvedValue({});

            await brainService.updateLog(mockLogId, 'failed', 'Something broke');

            expect(axios.put).toHaveBeenCalledWith(
                expect.stringContaining(`/logs/${mockLogId}`),
                { status: 'failed', error: 'Something broke' },
                expect.any(Object)
            );
        });

        it('should do nothing if logId is missing', async () => {
            await brainService.updateLog(null, 'success');
            expect(axios.put).not.toHaveBeenCalled();
        });
        
        it('should catch errors and log warning (not throw)', async () => {
            axios.put.mockRejectedValue(new Error('API Down'));
            
            // Should not throw
            await brainService.updateLog(mockLogId, 'success');
            
            // Should imply logger warn was called (logger is mocked)
            const logger = require('../utils/logger');
            expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining('Failed to update remote log'));
        });
    });
});
