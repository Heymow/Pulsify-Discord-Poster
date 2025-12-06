const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

const SETTINGS_FILE = path.join(__dirname, '../settings.json');

class SettingsService {
  constructor() {
    this.settings = this.loadSettings();
  }

  loadSettings() {
    try {
      if (!fs.existsSync(SETTINGS_FILE)) {
        return {
          brainApiKey: process.env.BRAIN_API_KEY || ''
        };
      }
      const data = fs.readFileSync(SETTINGS_FILE, 'utf8');
      return JSON.parse(data);
    } catch (err) {
      logger.error(`Failed to load settings: ${err.message}`);
      return { brainApiKey: process.env.BRAIN_API_KEY || '' };
    }
  }

  saveSettings(newSettings) {
    try {
      this.settings = { ...this.settings, ...newSettings };
      fs.writeFileSync(SETTINGS_FILE, JSON.stringify(this.settings, null, 2), 'utf8');
      return this.settings;
    } catch (err) {
      logger.error(`Failed to save settings: ${err.message}`);
      throw err;
    }
  }

  getBrainApiKey() {
    // Priority: Settings file > Environment Variable
    return this.settings.brainApiKey || process.env.BRAIN_API_KEY || '';
  }

  setBrainApiKey(key) {
    this.saveSettings({ brainApiKey: key });
  }

  getDiscordPosterId() {
    return this.settings.discordPosterId || process.env.DISCORD_POSTER_ID || 'ANONYMOUS_USER';
  }

  setDiscordPosterId(id) {
    this.saveSettings({ discordPosterId: id });
  }
}

module.exports = new SettingsService();
