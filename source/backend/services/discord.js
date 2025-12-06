const { chromium } = require("playwright");
const fs = require("fs").promises;
const channelService = require("./channelService");
const brainService = require("./brainService");
const config = require("../config");
const logger = require("../utils/logger");

class DiscordService {
  constructor() {
    this.browser = null;
    this.CONCURRENT_TABS = process.env.CONCURRENT_TABS ? parseInt(process.env.CONCURRENT_TABS) : 3;
    // We assume the user configures their identity in the environment
    this.userId = process.env.DISCORD_POSTER_ID || "ANONYMOUS_USER";
  }

  setConcurrency(count) {
    this.CONCURRENT_TABS = count;
    logger.info(`Concurrency updated to ${count}`);
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

  // --- Remote Driver Logic ---

  async typeLikeHuman(page, selector, text) {
    const el = await page.$(selector);
    if (!el) throw new Error(`Selector ${selector} not found`);
    
    for (let char of text) {
      await el.type(char);
      const delay = 30 + Math.random() * 50;
      await page.waitForTimeout(delay);
    }
  }

  async executeRemoteInstructions(page, steps) {
    for (const step of steps) {
        logger.debug(`Executing step: ${step.description || step.action}`);
        
        try {
            switch (step.action) {
                case 'goto':
                    await page.goto(step.url, { waitUntil: 'networkidle' });
                    break;
                
                case 'click':
                    await page.click(step.selector);
                    break;
                
                case 'clickIfVisible':
                    try {
                        const el = await page.$(step.selector);
                        if (el && await el.isVisible()) {
                            await el.click();
                            await page.waitForTimeout(1000); 
                        }
                    } catch (e) { /* optimize: ignore if not found */ }
                    break;

                case 'type':
                    // We use our human-typing helper for better stealth
                    await this.typeLikeHuman(page, step.selector, step.text);
                    break;
                
                case 'press':
                    await page.keyboard.press(step.key);
                    break;
                
                case 'wait':
                    await page.waitForTimeout(step.ms);
                    break;
                
                case 'waitForSelector':
                    await page.waitForSelector(step.selector, { state: 'visible', timeout: step.timeout || 30000 });
                    break;

                case 'setInputFiles':
                    // Safety check: ensure files exist? Playwright throws if not.
                    if (step.files && step.files.length > 0) {
                        // We need to handle the case where selector might be hidden
                         // Playwright handles hidden inputs well but sometimes needs a little help finding it if it's very hidden
                        await page.setInputFiles(step.selector, step.files);
                    }
                    break;
                
                case 'waitForContent':
                     await page.waitForFunction(
                        (args) => {
                          const messages = document.querySelectorAll(args.selector);
                          const lastMessages = Array.from(messages).slice(-5);
                          return lastMessages.some((msg) => msg.textContent.includes(args.content));
                        },
                        { selector: step.selector, content: step.content },
                        { timeout: step.timeout || 10000 }
                      ).catch(() => logger.warn(`Validation '${step.description}' timed out, but continuing.`));
                     break;

                default:
                    logger.warn(`Unknown action: ${step.action}`);
            }
        } catch (err) {
            logger.error(`Step '${step.description}' failed: ${err.message}`);
            // We rethrow because if the brain says "Do this" and we can't, the task is failed.
            throw err;
        }
    }
  }

  async navigateToUrl(page, url) {
    try {
      // logger.info(`Navigating to ${url}...`); // Reduce noise
      const response = await page.goto(url, {
        waitUntil: "networkidle",
        timeout: 60000,
      });

      if (!response || !response.ok()) {
        logger.error(`Failed to navigate to ${url}: HTTP ${response?.status() || "unknown"}`);
        return false;
      }
      return true;
    } catch (err) {
      logger.error(`Failed to navigate to ${url}: ${err.message}`);
      return false;
    }
  }

  async processChannel(context, url, message, isEveryone, currentName, instructions) {
    const page = await context.newPage();
    try {
      const navigated = await this.navigateToUrl(page, url);
      if (!navigated) {
        channelService.incrementFailure(url);
        return false;
      }

      await page.waitForLoadState("networkidle", { timeout: 30000 });
      await page.waitForTimeout(2000);

      // --- EXECUTE BRAIN INSTRUCTIONS ---
      await this.executeRemoteInstructions(page, instructions);
      
      logger.info(`Message sent to ${url}`);

        // Auto-detect name (Optional: could also be a Brain instruction? 
        // For now, leaving local as it reads DOM content which is complex to serialize instructions for extraction)
        // Actually, we can leave this "Good Samaritan" feature local. It's not critical security logic.
        /* ... name detection logic omitted for brevity/focus, or we can keep it ... */
        // Re-adding name detection logic to preserve feature parity
        try {
           // We would need selectors for this. 
           // PROBLEM: Selectors are deleted from config.
           // If we want to keep Name Detection, we need to ask the Brain for "Name Detection Selectors" or "Name Detection Instructions".
           // For this MVP, I will COMMENT OUT auto-detection to strictly adhere to "No local selectors".
           // or I can ask Brain for "detect_channel_name" task?
           // Let's comment it out to be safe and clean.
           // logger.info(`Auto-detected name logic skipped (Remote Driver Mode)`);
        } catch (nameErr) { }

      return true;
    } catch (err) {
      logger.error(`Failed posting to ${url}: ${err.message}`);
      channelService.incrementFailure(url);
      return false;
    } finally {
      await page.close();
    }
  }

  async postToChannels(message, postType = "Suno link", attachments = []) {
    logger.info(`Starting post job: ${postType} with ${this.CONCURRENT_TABS} concurrent tabs`);
    logger.info(`Identity: ${this.userId} (Verifying with Brain...)`);
    
    // 1. Fetch Instructions from Brain
    // We fetch two sets: one for normal channels, one for everyone channels
    // This validates the user immediately.
    let instructionsNormal, instructionsEveryone;
    try {
        const payloadNormal = { message, isEveryone: false, attachments };
        const payloadEveryone = { message, isEveryone: true, attachments };

        [instructionsNormal, instructionsEveryone] = await Promise.all([
            brainService.getInstructions(this.userId, 'post_message', payloadNormal),
            brainService.getInstructions(this.userId, 'post_message', payloadEveryone)
        ]);
        logger.info("🧠 Brain accepted the request. Instructions received.");
    } catch (err) {
        logger.error(`🧠 Operation Aborted: ${err.message}`);
        // We throw so the Queue marks it as failed
        throw err;
    }

    const channelsList = channelService.getChannelsByType(postType);
    if (!channelsList || channelsList.length === 0) {
      logger.warn(`No channels found for type: ${postType}`);
      return { success: 0, failed: 0 };
    }

    const everyoneChannels = channelService.getEveryoneChannels();

    this.browser = await chromium.launch({ headless: false }); 
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

        const promises = [];
        for (const channel of chunk) {
          const url = channel.url;
          const name = channel.name;
          const isEveryone = everyoneChannels.has(url);

          if (channel.paused) {
            logger.info(`Skipping paused channel: ${url}`);
            continue;
          }
          
          // Select correct instructions
          const instructions = isEveryone ? instructionsEveryone : instructionsNormal;

          promises.push(this.processChannel(context, url, message, isEveryone, name, instructions));

          const tabDelay = 500 + Math.random() * 1000;
          await new Promise(r => setTimeout(r, tabDelay));
        }

        const results = await Promise.all(promises);
        
        results.forEach(success => {
          if (success) successCount++;
          else failCount++;
        });

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

