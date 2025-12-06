const express = require('express');
const router = express.Router();
const settingsService = require('../services/settingsService');

// Get settings
router.get('/', (req, res, next) => {
  try {
    const key = settingsService.getBrainApiKey();
    const discordId = settingsService.getDiscordPosterId();
    
    // Return masked key for security
    let display = '';
    if (key.length > 8) {
        display = `${key.substring(0, 4)}...${key.substring(key.length - 4)}`;
    } else if (key.length > 0) {
        display = '********';
    }

    res.json({
      brainApiKey: display,
      discordPosterId: discordId,
      isSet: !!key
    });
  } catch (err) {
    next(err);
  }
});

// Update settings
router.post('/', (req, res, next) => {
  const { brainApiKey, discordPosterId } = req.body;
  try {
    if (typeof brainApiKey === 'string') {
        settingsService.setBrainApiKey(brainApiKey.trim());
    }
    if (typeof discordPosterId === 'string') {
        settingsService.setDiscordPosterId(discordPosterId.trim());
    }
    res.json({ success: true, message: 'Settings updated' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
