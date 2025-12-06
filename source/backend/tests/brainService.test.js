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

    beforeEach(() => {
        jest.clearAllMocks();
        settingsService.getBrainApiKey.mockReturnValue('mock-api-key');
    });

    describe('getInstructions', () => {
        test('should call API with correct URL, headers and data', async () => {
            axios.post.mockResolvedValue({ data: { steps: mockSteps } });

            const steps = await brainService.getInstructions(mockDiscordId, mockTaskType, mockData);

            expect(steps).toEqual(mockSteps);
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
            expect(settingsService.getBrainApiKey).toHaveBeenCalled();
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
});
