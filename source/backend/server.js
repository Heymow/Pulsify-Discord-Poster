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

const discordRoutes = require("./routes/discord.js");
const channelRoutes = require("./routes/channels.js");



// Set username and password
const USERNAME = process.env.AUTH_USERNAME || 'admin';
const PASSWORD = process.env.AUTH_PASSWORD || 'password';
const ENABLE_AUTH = process.env.ENABLE_AUTH === 'true';

// Auth middleware
function auth(req, res, next) {
  if (!ENABLE_AUTH) return next();
  
  // Skip auth for OPTIONS requests (CORS preflight)
  if (req.method === 'OPTIONS') return next();
  
  const user = basicAuth(req);
  if (!user || user.name !== USERNAME || user.pass !== PASSWORD) {
    res.set("WWW-Authenticate", 'Basic realm="Suno Automation"');
    return res.status(401).send("Access denied");
  }
  next();
}

// Apply auth to existing routes
app.use("/discord", auth, discordRoutes);
app.use("/api/channels", auth, channelRoutes);

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
app.listen(PORT, () => {
  console.log(`🟢 Server listening at http://localhost:${PORT}`);
  console.log(`🔒 Auth is ${ENABLE_AUTH ? 'ENABLED' : 'DISABLED'}`);
});

module.exports = app;
