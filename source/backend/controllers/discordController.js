const queueService = require("../services/queue");
const discordService = require("../services/discord");

async function login(req, res, next) {
  try {
    console.log("🚀 Discord login trigger received");
    // We don't queue this, as it requires user interaction in a browser window
    // and we want to await the result to tell the frontend it's done.
    // However, this will block the request for a long time (up to 5 mins).
    // Frontend should handle the timeout or we should return immediately and use SSE/Polling.
    // Given the simple architecture, let's try awaiting it but frontend might timeout.
    // Ideally, we start it and return "Browser opened", then user confirms.
    // But the current frontend waits for the response.
    
    // Let's await it. If it times out on frontend, it's fine, the backend process continues.
    // But for a local tool, usually the user is there.
    
    await discordService.login();
    res.json({ success: true, message: "Session saved successfully!" });
  } catch (err) {
    next(err);
  }
}

async function postToDiscordChannels(req, res, next) {
  try {
    console.log("🚀 Discord trigger received");
    const { message, postType = "Suno link" } = req.body;

    // Add job to queue
    const jobId = queueService.addJob({
      type: "discord_post",
      message,
      postType,
    });

    res.json({ 
      success: true, 
      message: "Job accepted! Posting to Discord Channels will happen in the background.",
      jobId 
    });
  } catch (err) {
    next(err);
  }
}

async function checkSession(req, res, next) {
  try {
    const connected = await discordService.checkSession();
    res.json({ connected });
  } catch (err) {
    next(err);
  }
}

async function logout(req, res, next) {
  try {
    await discordService.logout();
    res.json({ success: true, message: "Logged out successfully" });
  } catch (err) {
    next(err);
  }
}

async function updateConcurrency(req, res, next) {
  try {
    const { concurrency } = req.body;
    if (!concurrency || concurrency < 1 || concurrency > 5) {
      return res.status(400).json({ error: "Concurrency must be between 1 and 5" });
    }
    discordService.setConcurrency(concurrency);
    res.json({ success: true, message: `Concurrency set to ${concurrency}` });
  } catch (err) {
    next(err);
  }
}

module.exports = { postToDiscordChannels, login, checkSession, logout, updateConcurrency };
