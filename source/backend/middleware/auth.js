const basicAuth = require("basic-auth");

const USERNAME = process.env.AUTH_USERNAME || 'admin';
const PASSWORD = process.env.AUTH_PASSWORD || 'password';
const ENABLE_AUTH = process.env.ENABLE_AUTH === 'true';

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

module.exports = auth;
