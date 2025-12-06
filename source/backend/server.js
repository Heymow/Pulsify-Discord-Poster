require("dotenv").config();
const express = require("express");
const basicAuth = require("basic-auth");
const queueService = require("./services/queue"); // Ensure queue is loaded
const cors = require("cors");
const logger = require("./utils/logger");
const errorHandler = require("./middleware/errorHandler");

const app = express();

// Enable CORS for frontend
app.use(cors());
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

const discordRoutes = require("./routes/discord.js");
const channelRoutes = require("./routes/channels.js");
const settingsRoutes = require("./routes/settings.js");



// Set username and password
const auth = require("./middleware/auth");

const upload = require("./middleware/upload");
const { uploadFiles } = require("./controllers/discordController");

// Upload endpoint
app.post("/api/upload", auth, upload.array("files", 10), uploadFiles);

// Apply auth to existing routes
app.use("/discord", auth, discordRoutes);
app.use("/api/channels", auth, channelRoutes);
app.use("/api/settings", auth, settingsRoutes);

// SSE Endpoint for logs
app.get("/api/logs", auth, (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  const sendLog = (data) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  logger.on('log', sendLog);

  req.on("close", () => {
    logger.removeListener('log', sendLog);
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🟢 Server listening at http://localhost:${PORT}`);
    console.log(`🔒 Auth is ${process.env.ENABLE_AUTH === 'true' ? 'ENABLED' : 'DISABLED'}`);
  });
}

module.exports = app;
