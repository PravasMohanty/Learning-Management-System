const fs = require('fs');
const path = require('path');

const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir);

const isDev = process.env.NODE_ENV !== 'production';

const logger = {
  info: (msg, context = {}) => {
    const timestamp = new Date().toISOString();
    const log = { timestamp, level: 'INFO', message: msg, ...context };
    console.log(JSON.stringify(log));
    if (!isDev) fs.appendFileSync(path.join(logsDir, 'app.log'), JSON.stringify(log) + '\n');
  },

  error: (msg, error, context = {}) => {
    const timestamp = new Date().toISOString();
    const log = {
      timestamp,
      level: 'ERROR',
      message: msg,
      error: { message: error?.message, stack: isDev ? error?.stack : undefined },
      ...context,
    };
    console.error(JSON.stringify(log));
    fs.appendFileSync(path.join(logsDir, 'error.log'), JSON.stringify(log) + '\n');
  },

  warn: (msg, context = {}) => {
    const timestamp = new Date().toISOString();
    const log = { timestamp, level: 'WARN', message: msg, ...context };
    console.warn(JSON.stringify(log));
    if (!isDev) fs.appendFileSync(path.join(logsDir, 'app.log'), JSON.stringify(log) + '\n');
  },

  debug: (msg, context = {}) => {
    if (isDev) console.log(JSON.stringify({ timestamp: new Date().toISOString(), level: 'DEBUG', message: msg, ...context }));
  },
};

module.exports = logger;
