const express = require("express");
const router = express.Router();
const { postToDiscordChannels, login, checkSession, logout } = require("../controllers/discordController");
const { validate, schemas } = require("../middleware/validate");

router.post("/post", validate(schemas.discordPost), postToDiscordChannels);
router.post("/login", login);

// Session management
router.get("/session", checkSession);
router.delete("/session", logout);

module.exports = router;
