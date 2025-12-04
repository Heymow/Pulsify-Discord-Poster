const { chromium } = require('playwright');
const path = require('path');

async function loginToDiscord(req, res) {
  console.log("🚀 Starting Discord Login flow");
  
  // Send response immediately so frontend doesn't timeout, 
  // or use SSE to update status. 
  // For now, let's keep the connection open but it might timeout if user takes too long.
  // Better to send "Browser opened" and let user interact.
  
  try {
    const browser = await chromium.launch({ headless: false });
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto('https://discord.com/login');

    // Wait for login to complete
    // We wait for the URL to change to something indicating we are logged in
    // e.g. https://discord.com/channels/@me or https://discord.com/channels/*
    console.log("Waiting for user to login...");
    await page.waitForURL('**/channels/**/*', { timeout: 300000 }); // 5 minutes timeout

    // Save session
    await context.storageState({ path: path.join(__dirname, '../discord-session.json') });
    console.log("Session saved!");

    await browser.close();
    res.send({ success: true, message: "Session saved successfully!" });
  } catch (err) {
    console.error("❌ Login failed or timed out", err);
    res.status(500).send({ success: false, error: "Login failed or timed out: " + err.message });
  }
}

module.exports = { loginToDiscord };
