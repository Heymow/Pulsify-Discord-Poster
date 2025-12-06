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
  promises: {
    access: jest.fn(),
    unlink: jest.fn()
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

    // Default BrainService mock behavior
    brainService.getInstructions.mockResolvedValue([
        { action: 'type', selector: 'mock_selector', text: 'hello' }
    ]);
  });

  test('postToChannels fetches instructions from Brain', async () => {
    const mockChannels = [{ name: "C1", url: "http://c1" }];
    channelService.getChannelsByType.mockReturnValue(mockChannels);
    channelService.getEveryoneChannels.mockReturnValue(new Set());

    await discordService.postToChannels("Test Message", "Suno link");

    expect(brainService.getInstructions).toHaveBeenCalledTimes(2); // Normal + Everyone
    expect(brainService.getInstructions).toHaveBeenCalledWith(expect.any(String), 'post_message', expect.objectContaining({ message: "Test Message", isEveryone: false }));
  });

  test('postToChannels executes remote instructions', async () => {
    const mockChannels = [{ name: "C1", url: "http://c1" }];
    channelService.getChannelsByType.mockReturnValue(mockChannels);
    channelService.getEveryoneChannels.mockReturnValue(new Set());

    brainService.getInstructions.mockResolvedValue([
        { action: 'goto', url: 'http://test.com' },
        { action: 'click', selector: '#btn' },
        { action: 'type', selector: '#input', text: 'hello' }
    ]);

    await discordService.postToChannels("Test Message", "Suno link");

    // Verify actions on page
    // Note: navigateToUrl is called before instructions 
    expect(mockPage.click).toHaveBeenCalledWith('#btn');
    expect(mockPage.$).toHaveBeenCalledWith('#input'); // Called by typeLikeHuman
  });

  test('postToChannels handles Brain Forbidden error', async () => {
    brainService.getInstructions.mockRejectedValue(new Error('FORBIDDEN_ACCESS'));

    await expect(discordService.postToChannels("Test Message")).rejects.toThrow('FORBIDDEN_ACCESS');
    expect(chromium.launch).not.toHaveBeenCalled(); // Should assume it stops before launching browser? 
    // Actually, in current implementation it stops before launching browser if instructions fail.
    // Let's verify that.
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
});

