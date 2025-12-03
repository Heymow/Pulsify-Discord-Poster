const queueService = require('../services/queue');
const fs = require('fs');

jest.mock('fs', () => ({
  existsSync: jest.fn().mockReturnValue(false),
  readFileSync: jest.fn(),
  writeFileSync: jest.fn(),
  join: jest.fn(),
}));

jest.mock('../services/discord', () => ({
  postToChannels: jest.fn(),
}));

describe('QueueService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset queue state if needed (queueService is a singleton/module with internal state)
    // Since we can't easily reset module state without reloading, we'll rely on public methods
    // or just test the behavior assuming empty start if possible.
    // However, queueService loads from file on require.
    // We might need to mock readFileSync before requiring, but it's already required.
    // Let's just test the public interface.
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('addJob adds a job to the queue', () => {
    fs.writeFileSync.mockImplementation(() => {});
    // Prevent processQueue from running to keep job in queue
    jest.spyOn(queueService, 'processQueue').mockImplementation(() => {});
    
    const jobData = { message: "Test Message", type: "Suno link" };
    const jobId = queueService.addJob(jobData);

    expect(jobId).toBeDefined();
    expect(typeof jobId).toBe('string');
    expect(queueService.queue[0].message).toBe(jobData.message);
    expect(queueService.queue[0].type).toBe(jobData.type);
    expect(queueService.queue[0].status).toBe('pending');
    expect(fs.writeFileSync).toHaveBeenCalled();
    expect(queueService.processQueue).toHaveBeenCalled();
  });

  test('addJob triggers processQueue', async () => {
    const jobData = { message: "Process Job", type: "discord_post", postType: "Suno link" };
    const discordService = require('../services/discord');
    
    queueService.addJob(jobData);
    
    // processQueue is async. We need to wait for it to likely complete.
    // Or we can just check if postToChannels was called.
    // Since we mocked postToChannels, we can check calls.
    
    // Allow microtasks to complete
    await new Promise(resolve => setTimeout(resolve, 100));

    expect(discordService.postToChannels).toHaveBeenCalled();
  });
});
