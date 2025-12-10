// Structured JSON logging for ELK Stack integration
const fs = require('fs');
const path = require('path');

const LOG_LEVELS = {
  DEBUG: 'DEBUG',
  INFO: 'INFO',
  WARN: 'WARN',
  ERROR: 'ERROR',
  CRITICAL: 'CRITICAL'
};

function log(level, message, metadata = {}) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...metadata,
    hostname: require('os').hostname(),
    service: 'school-fees-manager',
    env: process.env.NODE_ENV || 'development'
  };

  // Output as JSON (compatible with ELK, CloudWatch, Datadog, etc.)
  console.log(JSON.stringify(logEntry));

  // Optionally write to file for local debugging
  if (process.env.LOG_FILE_ENABLED === 'true') {
    const logFile = path.join(__dirname, '../logs/application.log');
    fs.appendFileSync(logFile, JSON.stringify(logEntry) + '\n', { flag: 'a' });
  }
}

module.exports = {
  LOG_LEVELS,
  debug: (msg, meta) => log(LOG_LEVELS.DEBUG, msg, meta),
  info: (msg, meta) => log(LOG_LEVELS.INFO, msg, meta),
  warn: (msg, meta) => log(LOG_LEVELS.WARN, msg, meta),
  error: (msg, meta) => log(LOG_LEVELS.ERROR, msg, meta),
  critical: (msg, meta) => log(LOG_LEVELS.CRITICAL, msg, meta),
  log
};
