const fs = require('fs');
const path = require('path');

const CHANNELS_FILE = path.join(__dirname, '../channels.json');

// Helper to read channels
class DuplicateChannelError extends Error {
  constructor(message) {
    super(message);
    this.name = "DuplicateChannelError";
  }
}

function readChannels() {
  if (!fs.existsSync(CHANNELS_FILE)) {
    return {
      "Suno link": [],
      "Playlist link": [],
      "Riffusion link": [],
      "YouTube link": [],
      "Spotify link": [],
      "SoundCloud link": [],
      "Twitter link": [],
      "Instagram link": [],
      "TikTok link": [],
      "Facebook link": [],
      "everyone": []
    };
  }
  const data = fs.readFileSync(CHANNELS_FILE, 'utf8');
  const parsed = JSON.parse(data);
  
  // Migration: Convert old string arrays to objects if necessary
  let migrated = false;
  for (const key in parsed) {
    if (Array.isArray(parsed[key])) {
      parsed[key] = parsed[key].map(item => {
        if (typeof item === 'string') {
          migrated = true;
          return { name: "Unnamed Channel", url: item, failures: 0 };
        }
        return item;
      });
    }
  }
  
  if (migrated) {
    writeChannels(parsed);
  }
  
  return parsed;
}

// Helper to write channels
function writeChannels(data) {
  fs.writeFileSync(CHANNELS_FILE, JSON.stringify(data, null, 2), 'utf8');
}

const channelService = {
  getAllChannels: () => {
    return readChannels();
  },

  getChannelsByType: (type) => {
    const data = readChannels();
    // Return just URLs for compatibility with existing consumers if they expect strings?
    // No, consumers (DiscordService) need to be updated to handle objects or extract URLs.
    // Let's return the full objects so DiscordService can access failures/names.
    return data[type] || [];
  },

  getEveryoneChannels: () => {
    const data = readChannels();
    // Return a Set of URLs for easy lookup
    return new Set((data.everyone || []).map(c => c.url));
  },

  addChannel: (type, url, name) => {
    const data = readChannels();
    if (!data[type]) {
      throw new Error(`Invalid channel type: ${type}`);
    }
    
    // Check if URL already exists
    const exists = data[type].some(c => c.url === url);
    if (exists) {
      throw new DuplicateChannelError(`Channel already exists in ${type}`);
    }
    
    data[type].push({ 
      name: name || "Unnamed Channel", 
      url, 
      failures: 0 
    });
    writeChannels(data);
    return data;
  },

  removeChannel: (type, url) => {
    const data = readChannels();
    if (!data[type]) {
      throw new Error(`Invalid channel type: ${type}`);
    }
    data[type] = data[type].filter(c => c.url !== url);
    
    // Also remove from everyone if it exists there
    if (data.everyone) {
      data.everyone = data.everyone.filter(c => c.url !== url);
    }
    
    writeChannels(data);
    return data;
  },

  toggleEveryone: (url) => {
    const data = readChannels();
    if (!data.everyone) data.everyone = [];
    
    const exists = data.everyone.some(c => c.url === url);
    
    if (exists) {
      data.everyone = data.everyone.filter(c => c.url !== url);
    } else {
      // Find the channel name from other lists to keep consistency
      let name = "Unnamed Channel";
      for (const key in data) {
        if (key === 'everyone') continue;
        const found = data[key].find(c => c.url === url);
        if (found) {
          name = found.name;
          break;
        }
      }
      data.everyone.push({ name, url, failures: 0 });
    }
    writeChannels(data);
    return data;
  },
  
  incrementFailure: (url) => {
    const data = readChannels();
    let changed = false;
    
    for (const key in data) {
      data[key].forEach(c => {
        if (c.url === url) {
          c.failures = (c.failures || 0) + 1;
          changed = true;
        }
      });
    }
    
    if (changed) writeChannels(data);
  },

  updateChannelName: (url, name) => {
    const data = readChannels();
    let changed = false;
    
    for (const key in data) {
      data[key].forEach(c => {
        if (c.url === url && c.name !== name) {
          c.name = name;
          changed = true;
        }
      });
    }
    
    if (changed) writeChannels(data);
  },
  
  resetFailure: (url) => {
    const data = readChannels();
    let changed = false;
    
    for (const key in data) {
      data[key].forEach(c => {
        if (c.url === url) {
          c.failures = 0;
          changed = true;
        }
      });
    }
    
    if (changed) writeChannels(data);
  },

  importChannels: (importData) => {
    const currentData = readChannels();
    let added = 0;
    let updated = 0;
    let skipped = 0;

    for (const type in importData) {
      if (!currentData[type]) continue; // Skip unknown types
      if (!Array.isArray(importData[type])) continue;

      importData[type].forEach(importedChannel => {
        // Handle both string URLs (legacy) and objects
        const url = typeof importedChannel === 'string' ? importedChannel : importedChannel.url;
        const name = typeof importedChannel === 'string' ? "Unnamed Channel" : importedChannel.name;
        
        if (!url) return;

        const existingChannel = currentData[type].find(c => c.url === url);

        if (existingChannel) {
          // Update name if provided and different
          if (name && name !== "Unnamed Channel" && existingChannel.name !== name) {
            existingChannel.name = name;
            updated++;
          } else {
            skipped++;
          }
        } else {
          // Add new channel
          currentData[type].push({
            name: name || "Unnamed Channel",
            url: url,
            failures: 0
          });
          added++;
        }
      });
    }

    writeChannels(currentData);
    return { added, updated, skipped };
  },

  DuplicateChannelError
};

module.exports = channelService;
