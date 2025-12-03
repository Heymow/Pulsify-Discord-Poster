require("dotenv").config();

const config = {
  port: process.env.PORT || 3000,
  discord: {
    sessionFile: "discord-session.json",
  },
};

module.exports = config;
