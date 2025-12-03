const { chromium } = require("playwright");
const fs = require("fs").promises;
const channelService = require("./channelService");
const config = require("../config");
const selectors = require("../config/selectors");
const logger = require("../utils/logger");

class DiscordService {
  constructor() {
    this.browser = null;
    this.CONCURRENT_TABS = process.env.CONCURRENT_TABS ? parseInt(process.env.CONCURRENT_TABS) : 3;
  }

  async checkSession() {
    try {
      await fs.access(config.discord.sessionFile);
      return true;
    } catch {
      return false;
    }
  }

  async logout() {
    try {
      await fs.unlink(config.discord.sessionFile);
      logger.info("Session file deleted.");
      return true;
    } catch (err) {
      if (err.code === 'ENOENT') return true; // Already deleted
      logger.error(`Failed to delete session file: ${err.message}`);
      throw err;
    }
  }

  async login() {
    logger.info("Starting Discord login flow...");
    const browser = await chromium.launch({ headless: false });
    const context = await browser.newContext();
    const page = await context.newPage();

    try {
      await page.goto("https://discord.com/login");
      logger.info("Please log in to Discord in the opened browser window.");

      // Wait for navigation to the main app (indicating successful login)
      // We look for the URL to contain '/channels/@me' or similar
      await page.waitForURL("**/channels/**", { timeout: 300000 }); // 5 minutes timeout

      logger.info("Login detected! Saving session...");
      await context.storageState({ path: config.discord.sessionFile });
      logger.info("Session saved successfully.");
      
      return true;
    } catch (err) {
      logger.error(`Login failed or timed out: ${err.message}`);
      throw err;
    } finally {
      await browser.close();
    }
  }

  async typeLikeHuman(page, selector, text) {
    const el = await page.$(selector);
    if (!el) throw new Error(`Selector ${selector} not found`);
    
    for (let char of text) {
      await el.type(char);
      const delay = 30 + Math.random() * 50;
      await page.waitForTimeout(delay);
    }
  }

  async navigateToUrl(page, url) {
    try {
      logger.info(`Navigating to ${url}...`);
      const response = await page.goto(url, {
        waitUntil: "networkidle",
        timeout: 60000,
      });

      if (!response || !response.ok()) {
        logger.error(`Failed to navigate to ${url}: HTTP ${response?.status() || "unknown"}`);
        return false;
      }

      await Promise.race([
        page.waitForSelector(selectors.textbox, { timeout: 15000 }).catch(() => {}),
        page.waitForSelector(selectors.chatContent, { timeout: 15000 }).catch(() => {}),
        page.waitForSelector(selectors.messageContent, { timeout: 15000 }).catch(() => {}),
      ]);

      logger.info(`Navigated to ${url}`);
      return true;
    } catch (err) {
      logger.error(`Failed to navigate to ${url}: ${err.message}`);
      return false;
    }
  }

  async postMessageToChannel(page, message, isEveryone) {
    try {
      // logger.info("Waiting for textbox..."); // Reduce noise
      await page.waitForSelector(selectors.textbox, { state: "visible", timeout: 20000 });

      const fullMessage = isEveryone ? `@everyone ${message}` : message;
      const textbox = await page.$(selectors.textbox);
      await textbox.focus();

      await this.typeLikeHuman(page, selectors.textbox, fullMessage);
      
      const textContent = await textbox.textContent();
      if (!textContent || !textContent.includes(message.substring(0, 20))) {
        logger.warn("Message may not be fully typed, retrying with fill...");
        await page.fill(selectors.textbox, fullMessage);
      }

      await page.keyboard.press("Enter");
      
      // Wait for confirmation or message appearance
      try {
        await Promise.race([
          page.waitForFunction(
            (selector) => {
              const messages = document.querySelectorAll(selector);
              const lastMessages = Array.from(messages).slice(-5);
              return lastMessages.some((msg) => msg.textContent.includes("suno.com/song/"));
            },
            selectors.messageContent,
            { timeout: 5000 }
          ),
          page.waitForSelector(selectors.sendNowButton, { timeout: 3000 }),
        ]);
      } catch (e) {
        // logger.debug("Could not detect message sent, but continuing...");
      }

      await this.handleEveryoneConfirmation(page);
      logger.info("Message sent.");
    } catch (err) {
      logger.error(`Could not post message: ${err.message}`);
      throw err;
    }
  }

  async handleEveryoneConfirmation(page) {
    try {
      const confirmButton = await page.waitForSelector(selectors.sendNowButton, {
        timeout: 3000,
        state: "visible",
      });

      if (confirmButton) {
        await confirmButton.waitForElementState("stable");
        await confirmButton.click();
        logger.info("Clicked @everyone confirmation");
        await page.waitForSelector(selectors.sendNowButton, { state: "detached", timeout: 3000 }).catch(() => {});
      }
    } catch (popupErr) {
      // No popup, normal behavior
    }
  }

  async processChannel(context, url, message, isEveryone, currentName) {
    const page = await context.newPage();
    try {
      const navigated = await this.navigateToUrl(page, url);
      if (!navigated) {
        channelService.incrementFailure(url);
        return false;
      }

      await page.waitForLoadState("networkidle", { timeout: 30000 });
      await page.waitForTimeout(2000);

      await this.postMessageToChannel(page, message, isEveryone);
      
      // Auto-detect name if missing or default
      try {
        const guildNameEl = await page.$(selectors.guildName);
        const channelNameEl = await page.$(selectors.channelName);
        
        if (guildNameEl && channelNameEl) {
          const guildName = await guildNameEl.textContent();
          const channelName = await channelNameEl.textContent();
          
          if (guildName && channelName) {
            const fullName = `${guildName.trim()}: ${channelName.trim()}`;
            
            // Only update if current name is "Unnamed Channel" or empty
            if (!currentName || currentName === "Unnamed Channel") {
              logger.info(`Auto-detected name for ${url}: ${fullName}`);
              channelService.updateChannelName(url, fullName);
            }
          }
        }
      } catch (nameErr) {
        // Ignore name detection errors
        // logger.debug(`Failed to auto-detect name: ${nameErr.message}`);
      }

      return true;
    } catch (err) {
      logger.error(`Failed posting to ${url}: ${err.message}`);
      channelService.incrementFailure(url);
      return false;
    } finally {
      await page.close();
    }
  }

  async postToChannels(message, postType = "Suno link") {
    logger.info(`Starting post job: ${postType} with ${this.CONCURRENT_TABS} concurrent tabs`);
    
    const channelsList = channelService.getChannelsByType(postType);
    if (!channelsList || channelsList.length === 0) {
      logger.warn(`No channels found for type: ${postType}`);
      return { success: 0, failed: 0 };
    }

    const everyoneChannels = channelService.getEveryoneChannels();

    this.browser = await chromium.launch({ headless: false }); // Keep false for now to debug, user can change
    let successCount = 0;
    let failCount = 0;

    try {
      const context = await this.browser.newContext({
        storageState: config.discord.sessionFile,
      });

    // Split channels into chunks
      for (let i = 0; i < channelsList.length; i += this.CONCURRENT_TABS) {
        const chunk = channelsList.slice(i, i + this.CONCURRENT_TABS);
        logger.info(`Processing chunk ${Math.floor(i / this.CONCURRENT_TABS) + 1}/${Math.ceil(channelsList.length / this.CONCURRENT_TABS)}`);

        const promises = chunk.map(channel => {
          // Channel is now an object { name, url, failures }
          const url = channel.url;
          const name = channel.name;
          const isEveryone = everyoneChannels.has(url);
          return this.processChannel(context, url, message, isEveryone, name);
        });

        const results = await Promise.all(promises);
        
        results.forEach(success => {
          if (success) successCount++;
          else failCount++;
        });

        // Delay between chunks
        if (i + this.CONCURRENT_TABS < channelsList.length) {
          const delay = 5000 + Math.random() * 5000;
          logger.info(`Waiting ${Math.round(delay / 1000)}s before next chunk...`);
          await new Promise(r => setTimeout(r, delay));
        }
      }
      
      logger.info(`Summary: Posted to ${successCount} channels, failed on ${failCount} channels`);

    } catch (err) {
      logger.error(`Critical error in postToChannels: ${err.message}`);
      throw err;
    } finally {
      if (this.browser) {
        await this.browser.close();
        this.browser = null;
      }
    }

    return { success: successCount, failed: failCount };
  }
}

module.exports = new DiscordService();
