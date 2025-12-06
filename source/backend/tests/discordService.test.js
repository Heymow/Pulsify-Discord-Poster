const discordService = require('../services/discord');
const channelService = require('../services/channelService');
const brainService = require('../services/brainService');
const { chromium } = require('playwright');

// Mock Playwright
jest.mock('playwright', () => ({
  chromium: {
    launch: jest.fn()
  }
}));

// Mock ChannelService
jest.mock('../services/channelService');

// Mock BrainService
jest.mock('../services/brainService');

// Mock Config
jest.mock('../config', () => ({
  discord: {
    sessionFile: 'mock-session.json'
  }
}));

// Mock Logger to avoid clutter
jest.mock('../utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn()
}));

// Mock fs
const fs = require('fs');
jest.mock('fs', () => ({
  existsSync: jest.fn(),
  promises: {
    access: jest.fn(),
    unlink: jest.fn(),
    readFile: jest.fn()
  }
}));

describe('DiscordService', () => {
  let mockBrowser, mockContext, mockPage;

  beforeEach(() => {
    // Mock setTimeout to be instant
    jest.spyOn(global, 'setTimeout').mockImplementation((cb) => {
      if (typeof cb === 'function') cb();
      return 123;
    });
    jest.clearAllMocks();

    // Setup Playwright mocks
    const mockElement = {
      type: jest.fn(),
      focus: jest.fn(),
      textContent: jest.fn().mockResolvedValue(''),
      click: jest.fn(),
      fill: jest.fn(),
      waitForElementState: jest.fn(),
      isVisible: jest.fn().mockResolvedValue(true)
    };

    mockPage = {
      goto: jest.fn().mockResolvedValue({ ok: () => true, status: () => 200 }),
      waitForSelector: jest.fn().mockResolvedValue(mockElement),
      $: jest.fn().mockResolvedValue(mockElement),
      type: jest.fn(),
      fill: jest.fn(),
      click: jest.fn(),
      keyboard: { press: jest.fn() },
      waitForFunction: jest.fn(),
      waitForTimeout: jest.fn(),
      waitForLoadState: jest.fn(),
      waitForURL: jest.fn().mockResolvedValue(true),
      close: jest.fn(),
      setInputFiles: jest.fn()
    };

    mockContext = {
      newPage: jest.fn().mockResolvedValue(mockPage),
      storageState: jest.fn()
    };

    mockBrowser = {
      newContext: jest.fn().mockResolvedValue(mockContext),
      close: jest.fn()
    };

    chromium.launch.mockResolvedValue(mockBrowser);

    brainService.getInstructions.mockResolvedValue({
        steps: [{ action: 'type', selector: 'mock_selector', text: 'hello' }],
        logId: 'log-123'
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('postToChannels fetches instructions from Brain for EACH channel', async () => {
    jest.spyOn(discordService, 'getUserId').mockResolvedValue('user-test');
    
    const mockChannels = [{ name: "C1", url: "http://c1" }, { name: "C2", url: "http://c2" }];
    channelService.getChannelsByType.mockReturnValue(mockChannels);
    channelService.getEveryoneChannels.mockReturnValue(new Set());

    await discordService.postToChannels("Test Message", "Suno link");

    // Expect 2 calls (one per channel)
    expect(brainService.getInstructions).toHaveBeenCalledTimes(2);
    
    // Verify first call
    expect(brainService.getInstructions).toHaveBeenCalledWith(
        'user-test', 
        'post_message', 
        expect.objectContaining({ channelName: "C1", channelUrl: "http://c1" })
    );
  });

  test('postToChannels executes remote instructions and updates log', async () => {
    jest.spyOn(discordService, 'getUserId').mockResolvedValue('user-test');

    const mockChannels = [{ name: "C1", url: "http://c1" }];
    channelService.getChannelsByType.mockReturnValue(mockChannels);
    channelService.getEveryoneChannels.mockReturnValue(new Set());

    brainService.getInstructions.mockResolvedValue({
        steps: [
            { action: 'type', selector: '#input', text: 'hello' }, // Changed to simpler action
            { action: 'click', selector: '#btn' }
        ],
        logId: 'log-123'
    });

    await discordService.postToChannels("Test Message", "Suno link");

    // Verify actions
    expect(mockPage.click).toHaveBeenCalledWith('#btn');
    
    // Verify success log update
    expect(brainService.updateLog).toHaveBeenCalledWith('log-123', 'success');
  });

  test('postToChannels handles Brain Forbidden error (Log Failure)', async () => {
    brainService.getInstructions.mockRejectedValue(new Error('FORBIDDEN_ACCESS'));
    const mockChannels = [{ name: "C1", url: "http://c1" }];
    channelService.getChannelsByType.mockReturnValue(mockChannels);
    channelService.getEveryoneChannels.mockReturnValue(new Set());
    
    // Should NOT throw, but resolve with failures
    await expect(discordService.postToChannels("Test Message")).resolves.not.toThrow();
    
    // Since logId is not returned when getInstructions fails, we can't update log status.
    // However, the catch block in processChannel catches "FORBIDDEN_ACCESS".
    // Does it try to update log? 
    // "if (logId) await brainService.updateLog(logId, 'failed', err.message);"
    // If getInstructions threw, logId is null. So updateLog is NOT called.
    expect(brainService.updateLog).not.toHaveBeenCalled();
  });

  test('login launches browser and saves state', async () => {
    await discordService.login();

    expect(chromium.launch).toHaveBeenCalledWith({ headless: false });
    expect(mockPage.goto).toHaveBeenCalledWith("https://discord.com/login");
    expect(mockPage.waitForURL).toHaveBeenCalled();
    expect(mockContext.storageState).toHaveBeenCalled();
    expect(mockBrowser.close).toHaveBeenCalled();
  });

  // Re-added session tests
  test('checkSession returns true if file exists', async () => {
    fs.promises.access.mockResolvedValue(undefined);
    const result = await discordService.checkSession();
    expect(result).toBe(true);
  });

  test('checkSession returns false if file missing', async () => {
    fs.promises.access.mockRejectedValue(new Error('ENOENT'));
    const result = await discordService.checkSession();
    expect(result).toBe(false);
  });

  test('postToChannels skips paused channels', async () => {
    const mockChannels = [
      { name: "Active Channel", url: "http://active", paused: false },
      { name: "Paused Channel", url: "http://paused", paused: true }
    ];
    channelService.getChannelsByType.mockReturnValue(mockChannels);
    channelService.getEveryoneChannels.mockReturnValue(new Set());

    const logger = require('../utils/logger'); // Get the mocked logger

    await discordService.postToChannels("Test Message", "Suno link");

    // Expect navigation for active channel
    expect(mockPage.goto).toHaveBeenCalledWith("http://active", expect.any(Object));
    // Expect NO navigation for paused channel
    expect(mockPage.goto).not.toHaveBeenCalledWith("http://paused", expect.any(Object));

    // Verify logger info message
    expect(logger.info).toHaveBeenCalledWith(expect.stringContaining("Skipping paused channel: http://paused"));
  });

  describe('User ID Extraction', () => {
      beforeEach(() => {
          discordService._cachedUserId = null; // Reset cache
          jest.resetModules(); // Reset to clear require cache if needed, but manual variable reset is safer
      });

      test('getUserId extracts ID from Valid Token', async () => {
          // Mock valid token format: "Base64ID.Timestamp.HMAC"
          // "123456" in base64 is "MTIzNDU2"
          const mockFileContent = JSON.stringify({
              origins: [
                  {
                      origin: "https://discord.com",
                      localStorage: [
                          { name: "token", value: '"MTIzNDU2.Timestamp.HMAC"' }
                      ]
                  }
              ]
          });

          // Mock file read
          const fs = require('fs');
          fs.existsSync = jest.fn().mockReturnValue(true);
          fs.promises.readFile = jest.fn().mockResolvedValue(mockFileContent);

          const userId = await discordService.getUserId();
          expect(userId).toBe("123456");
      });

      test('getUserId falls back to Cache if Token is invalid', async () => {
          const mockFileContent = JSON.stringify({
              origins: [
                  {
                      origin: "https://discord.com",
                      localStorage: [
                          { name: "token", value: '"InvalidToken"' },
                          { name: "user_id_cache", value: '"987654"' }
                      ]
                  }
              ]
          });

          const fs = require('fs');
          fs.existsSync = jest.fn().mockReturnValue(true);
          fs.promises.readFile = jest.fn().mockResolvedValue(mockFileContent);

          const userId = await discordService.getUserId();
          expect(userId).toBe("987654");
      });

      test('getUserId returns ANONYMOUS_USER on failure', async () => {
          const fs = require('fs');
          fs.existsSync = jest.fn().mockReturnValue(false); // No file

          const userId = await discordService.getUserId();
          expect(userId).toBe("ANONYMOUS_USER");
      });

      test('getUserId handles BOM in session file', async () => {
          const mockContent = '\uFEFF' + JSON.stringify({
              origins: [
                  {
                      origin: "https://discord.com",
                      localStorage: [
                          { name: "user_id_cache", value: '"111222"' }
                      ]
                  }
              ]
          });

          const fs = require('fs');
          fs.existsSync = jest.fn().mockReturnValue(true);
          fs.promises.readFile = jest.fn().mockResolvedValue(mockContent);

          const userId = await discordService.getUserId();
          expect(userId).toBe("111222");           
      });
  });
});

