const EventEmitter = require('events');

class Logger extends EventEmitter {
  info(message, ...args) {
    console.log(`[INFO] ${message}`, ...args);
    this.emit('log', { message, type: 'info', timestamp: new Date().toISOString() });
  }

  warn(message, ...args) {
    console.warn(`[WARN] ${message}`, ...args);
    this.emit('log', { message, type: 'warning', timestamp: new Date().toISOString() });
  }

  error(message, ...args) {
    console.error(`[ERROR] ${message}`, ...args);
    this.emit('log', { message, type: 'error', timestamp: new Date().toISOString() });
  }

  debug(message, ...args) {
    if (process.env.DEBUG) {
      console.debug(`[DEBUG] ${message}`, ...args);
      this.emit('log', { message, type: 'debug', timestamp: new Date().toISOString() });
    }
  }
}

module.exports = new Logger();
