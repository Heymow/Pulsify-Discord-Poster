const channelService = require('../services/channelService');
const fs = require('fs');
const path = require('path');

// Mock fs to avoid writing to real file
jest.mock('fs');

describe('ChannelService', () => {
  const mockChannels = {
    "Suno link": [
      { name: "Test Channel", url: "https://discord.com/channels/123/456", failures: 0 }
    ],
    "everyone": []
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Default mock implementation for readFileSync
    fs.existsSync.mockReturnValue(true);
    fs.readFileSync.mockReturnValue(JSON.stringify(mockChannels));
  });

  test('getAllChannels returns channels', () => {
    const channels = channelService.getAllChannels();
    expect(channels).toEqual(mockChannels);
  });

  test('addChannel adds a new channel', () => {
    const newUrl = "https://discord.com/channels/123/789";
    const newName = "New Channel";
    
    // Mock writeFileSync to verify it's called with correct data
    fs.writeFileSync.mockImplementation(() => {});

    channelService.addChannel("Suno link", newUrl, newName);

    expect(fs.writeFileSync).toHaveBeenCalled();
    const writtenData = JSON.parse(fs.writeFileSync.mock.calls[0][1]);
    expect(writtenData["Suno link"]).toHaveLength(2);
    expect(writtenData["Suno link"][1].url).toBe(newUrl);
    expect(writtenData["Suno link"][1].name).toBe(newName);
  });

  test('addChannel throws error for duplicate channel', () => {
    const existingUrl = "https://discord.com/channels/123/456";
    
    expect(() => {
      channelService.addChannel("Suno link", existingUrl, "Duplicate");
    }).toThrow('Channel already exists in Suno link');
  });

  test('removeChannel removes a channel', () => {
    const urlToRemove = "https://discord.com/channels/123/456";
    
    fs.writeFileSync.mockImplementation(() => {});

    channelService.removeChannel("Suno link", urlToRemove);

    expect(fs.writeFileSync).toHaveBeenCalled();
    const writtenData = JSON.parse(fs.writeFileSync.mock.calls[0][1]);
    expect(writtenData["Suno link"]).toHaveLength(0);
  });

  test('importChannels adds new and updates existing', () => {
    const importData = {
      "Suno link": [
        { name: "Updated Channel", url: "https://discord.com/channels/123/456" }, // Existing
        { name: "Imported Channel", url: "https://discord.com/channels/999/999" }  // New
      ]
    };

    fs.writeFileSync.mockImplementation(() => {});

    const stats = channelService.importChannels(importData);

    expect(stats.added).toBe(1);
    expect(stats.updated).toBe(1);
    expect(stats.skipped).toBe(0);

    const writtenData = JSON.parse(fs.writeFileSync.mock.calls[0][1]);
    expect(writtenData["Suno link"]).toHaveLength(2);
    expect(writtenData["Suno link"][0].name).toBe("Updated Channel");
    expect(writtenData["Suno link"][1].name).toBe("Imported Channel");
    expect(writtenData["Suno link"][1].name).toBe("Imported Channel");
  });

  test('importChannels creates new channel type if it does not exist', () => {
    const importData = {
      "New Type": [
        { name: "New Channel", url: "https://discord.com/channels/999/999" }
      ]
    };

    fs.writeFileSync.mockImplementation(() => {});

    const stats = channelService.importChannels(importData);

    expect(stats.added).toBe(1);
    
    const writtenData = JSON.parse(fs.writeFileSync.mock.calls[0][1]);
    expect(writtenData["New Type"]).toBeDefined();
    expect(writtenData["New Type"]).toHaveLength(1);
    expect(writtenData["New Type"][0].name).toBe("New Channel");
  });

  test('toggleEveryone adds/removes channel from everyone list', () => {
    const url = "https://discord.com/channels/123/456";
    fs.writeFileSync.mockImplementation(() => {});

    // First toggle: Add
    channelService.toggleEveryone(url);
    let writtenData = JSON.parse(fs.writeFileSync.mock.calls[0][1]);
    expect(writtenData.everyone).toHaveLength(1);
    expect(writtenData.everyone[0].url).toBe(url);

    // Update mock data to reflect addition
    fs.readFileSync.mockReturnValue(JSON.stringify(writtenData));

    // Second toggle: Remove
    channelService.toggleEveryone(url);
    writtenData = JSON.parse(fs.writeFileSync.mock.calls[1][1]);
    expect(writtenData.everyone).toHaveLength(0);
  });

  test('updateChannel updates name and URL', () => {
    const oldUrl = "https://discord.com/channels/123/456";
    const newUrl = "https://discord.com/channels/123/789";
    const newName = "Updated Name";
    fs.writeFileSync.mockImplementation(() => {});

    channelService.updateChannel(oldUrl, newUrl, newName);

    expect(fs.writeFileSync).toHaveBeenCalled();
    const writtenData = JSON.parse(fs.writeFileSync.mock.calls[0][1]);
    expect(writtenData["Suno link"][0].name).toBe(newName);
    expect(writtenData["Suno link"][0].url).toBe(newUrl);
  });

  test('incrementFailure increments failure count', () => {
    const url = "https://discord.com/channels/123/456";
    fs.writeFileSync.mockImplementation(() => {});

    channelService.incrementFailure(url);

    expect(fs.writeFileSync).toHaveBeenCalled();
    const writtenData = JSON.parse(fs.writeFileSync.mock.calls[0][1]);
    expect(writtenData["Suno link"][0].failures).toBe(1);
  });

  test('resetFailure resets failure count to 0', () => {
    // Setup mock with failures
    const mockWithFailures = {
      "Suno link": [
        { name: "Test Channel", url: "https://discord.com/channels/123/456", failures: 5 }
      ]
    };
    fs.readFileSync.mockReturnValue(JSON.stringify(mockWithFailures));
    fs.writeFileSync.mockImplementation(() => {});

    channelService.resetFailure("https://discord.com/channels/123/456");

    expect(fs.writeFileSync).toHaveBeenCalled();
    const writtenData = JSON.parse(fs.writeFileSync.mock.calls[0][1]);
    expect(writtenData["Suno link"][0].failures).toBe(0);
  });

  test('addType adds a new channel type', () => {
    const newType = "New Type";
    fs.writeFileSync.mockImplementation(() => {});

    channelService.addType(newType);

    expect(fs.writeFileSync).toHaveBeenCalled();
    const writtenData = JSON.parse(fs.writeFileSync.mock.calls[0][1]);
    expect(writtenData[newType]).toEqual([]);
  });

  test('addType throws error if type exists', () => {
    expect(() => {
      channelService.addType("Suno link");
    }).toThrow("Channel type 'Suno link' already exists");
  });

  test('removeType removes a channel type', () => {
    const typeToRemove = "Suno link";
    fs.writeFileSync.mockImplementation(() => {});

    channelService.removeType(typeToRemove);

    expect(fs.writeFileSync).toHaveBeenCalled();
    const writtenData = JSON.parse(fs.writeFileSync.mock.calls[0][1]);
    expect(writtenData[typeToRemove]).toBeUndefined();
  });

  test('removeType throws error if type does not exist', () => {
    expect(() => {
      channelService.removeType("Nonexistent");
    }).toThrow("Channel type 'Nonexistent' does not exist");
  });

  test('removeType throws error if removing everyone', () => {
    expect(() => {
      channelService.removeType("everyone");
    }).toThrow("Cannot remove 'everyone' type");
  });

  test('renameType renames a channel type', () => {
    const oldType = "Suno link";
    const newType = "Renamed Type";
    fs.writeFileSync.mockImplementation(() => {});

    channelService.renameType(oldType, newType);

    expect(fs.writeFileSync).toHaveBeenCalled();
    const writtenData = JSON.parse(fs.writeFileSync.mock.calls[0][1]);
    expect(writtenData[oldType]).toBeUndefined();
    expect(writtenData[newType]).toBeDefined();
    expect(writtenData[newType]).toHaveLength(1); // Preserves content
  });

  test('renameType throws error if old type does not exist', () => {
    expect(() => {
      channelService.renameType("Nonexistent", "New");
    }).toThrow("Channel type 'Nonexistent' does not exist");
  });

  test('renameType throws error if new type exists', () => {
    expect(() => {
      channelService.renameType("Suno link", "everyone");
    }).toThrow("Channel type 'everyone' already exists");
  });
});
