const express = require('express');
const router = express.Router();
const channelService = require('../services/channelService');
const { validate, schemas } = require("../middleware/validate");

// Get all channels
router.get('/', (req, res, next) => {
  try {
    const channels = channelService.getAllChannels();
    res.json(channels);
  } catch (err) {
    next(err);
  }
});

// Add a channel
router.post('/add', validate(schemas.channelAdd), (req, res, next) => {
  const { type, url, name } = req.body;
  try {
    const updatedChannels = channelService.addChannel(type, url, name);
    res.json(updatedChannels);
  } catch (err) {
    if (err.name === 'DuplicateChannelError') {
      return res.status(409).json({ error: err.message });
    }
    next(err);
  }
});

// Remove a channel
router.post('/remove', validate(schemas.channelRemove), (req, res, next) => {
  const { type, url } = req.body;
  try {
    const updatedChannels = channelService.removeChannel(type, url);
    res.json(updatedChannels);
  } catch (err) {
    next(err);
  }
});

// Toggle everyone status for a channel
router.post('/toggle-everyone', validate(schemas.channelToggle), (req, res, next) => {
  const { url } = req.body;
  try {
    const updatedChannels = channelService.toggleEveryone(url);
    res.json(updatedChannels);
  } catch (err) {
    next(err);
  }

});

// Toggle pause status for a channel
router.post('/toggle-pause', validate(schemas.channelToggle), (req, res, next) => {
  const { url } = req.body;
  try {
    const updatedChannels = channelService.togglePause(url);
    res.json(updatedChannels);
  } catch (err) {
    next(err);
  }
});

// Update channel
router.post('/update', validate(schemas.channelUpdate), (req, res, next) => {
  const { oldUrl, newUrl, name } = req.body;
  try {
    const updatedChannels = channelService.updateChannel(oldUrl, newUrl, name);
    res.json(updatedChannels);
  } catch (err) {
    if (err.name === 'DuplicateChannelError') {
      return res.status(409).json({ error: err.message });
    }
    next(err);
  }
});

// Import channels
router.post('/import', (req, res, next) => {
  try {
    const importData = req.body;
    const stats = channelService.importChannels(importData);
    res.json(stats);
  } catch (err) {
    next(err);
  }
});

// Reset failure count
router.post('/reset-failure', validate(schemas.channelResetFailure), (req, res, next) => {
  const { url } = req.body;
  try {
    channelService.resetFailure(url);
    const channels = channelService.getAllChannels();
    res.json(channels);
  } catch (err) {
    next(err);
  }
});

// Add channel type
router.post('/types/add', validate(schemas.typeAdd), (req, res, next) => {
  const { type } = req.body;
  try {
    const updatedChannels = channelService.addType(type);
    res.json(updatedChannels);
  } catch (err) {
    next(err);
  }
});

// Remove channel type
router.post('/types/remove', validate(schemas.typeRemove), (req, res, next) => {
  const { type } = req.body;
  try {
    const updatedChannels = channelService.removeType(type);
    res.json(updatedChannels);
  } catch (err) {
    next(err);
  }
});

// Rename channel type
router.post('/types/rename', validate(schemas.typeRename), (req, res, next) => {
  const { oldType, newType } = req.body;
  try {
    const updatedChannels = channelService.renameType(oldType, newType);
    res.json(updatedChannels);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
