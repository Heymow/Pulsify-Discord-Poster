const discordService = require("./discord");
const logger = require("../utils/logger");
const fs = require("fs");
const path = require("path");
const { v4: uuidv4 } = require("uuid");

const QUEUE_FILE = path.join(__dirname, "../queue.json");

class QueueService {
  constructor() {
    this.queue = [];
    this.isProcessing = false;
    this.loadQueue();
  }

  loadQueue() {
    try {
      if (fs.existsSync(QUEUE_FILE)) {
        const data = fs.readFileSync(QUEUE_FILE, "utf8");
        this.queue = JSON.parse(data);
        logger.info(`Loaded ${this.queue.length} jobs from queue file.`);
        // Resume processing if there are jobs
        if (this.queue.length > 0) {
          this.processQueue();
        }
      }
    } catch (err) {
      logger.error(`Failed to load queue file: ${err.message}`);
      this.queue = [];
    }
  }

  saveQueue() {
    try {
      fs.writeFileSync(QUEUE_FILE, JSON.stringify(this.queue, null, 2));
    } catch (err) {
      logger.error(`Failed to save queue file: ${err.message}`);
    }
  }

  addJob(jobData) {
    const job = {
      id: uuidv4(),
      addedAt: new Date().toISOString(),
      status: "pending",
      ...jobData,
    };
    this.queue.push(job);
    this.saveQueue();
    logger.info(`Job ${job.id} added to queue. Queue size: ${this.queue.length}`);
    this.processQueue();
    return job.id;
  }

  async processQueue() {
    if (this.isProcessing) return;
    if (this.queue.length === 0) return;

    this.isProcessing = true;
    
    while (this.queue.length > 0) {
      const job = this.queue[0]; // Peek
      logger.info(`Processing job ${job.id}: ${job.type}`);
      
      try {
        if (job.type === "discord_post") {
          await discordService.postToChannels(job.message, job.postType, job.attachments);
        }
        
        // Remove job only after success
        this.queue.shift();
        this.saveQueue();
        logger.info(`Job ${job.id} completed and removed from queue.`);
        
      } catch (err) {
        logger.error(`Job ${job.id} failed: ${err.message}`);
        // Decide what to do with failed jobs. For now, remove them to prevent blocking.
        // In a real system, we might want a retry count or a "dead letter queue".
        this.queue.shift();
        this.saveQueue();
      } finally {
        // Cleanup attachments
        if (job.attachments && job.attachments.length > 0) {
          job.attachments.forEach(file => {
            try {
              if (fs.existsSync(file.path)) {
                fs.unlinkSync(file.path);
                logger.info(`Deleted attachment: ${file.path}`);
              }
            } catch (cleanupErr) {
              logger.error(`Failed to delete attachment ${file.path}: ${cleanupErr.message}`);
            }
          });
        }
      }
    }

    this.isProcessing = false;
    logger.info("Queue processing complete.");
  }
}

module.exports = new QueueService();
