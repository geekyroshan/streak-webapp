// api/utils/logging.js - Logging utilities

/**
 * Log levels
 */
export const LogLevel = {
  DEBUG: 'debug',
  INFO: 'info',
  WARN: 'warn',
  ERROR: 'error'
};

/**
 * Whether debug logging is enabled
 */
const isDebugEnabled = process.env.DEBUG === 'true';

/**
 * Log a message with a prefix
 * @param {string} prefix - The log prefix
 * @param {string} message - The log message
 * @param {Object} data - Additional data to log
 * @param {string} level - The log level
 */
export function log(prefix, message, data = null, level = LogLevel.INFO) {
  const timestamp = new Date().toISOString();
  const formattedPrefix = `[${prefix}]`;
  
  // Skip debug logs unless debug is enabled
  if (level === LogLevel.DEBUG && !isDebugEnabled) {
    return;
  }
  
  switch (level) {
    case LogLevel.ERROR:
      console.error(timestamp, formattedPrefix, message, data || '');
      break;
    case LogLevel.WARN:
      console.warn(timestamp, formattedPrefix, message, data || '');
      break;
    case LogLevel.DEBUG:
      console.debug(timestamp, formattedPrefix, message, data || '');
      break;
    case LogLevel.INFO:
    default:
      console.log(timestamp, formattedPrefix, message, data || '');
      break;
  }
}

/**
 * Create a logger for a specific module
 * @param {string} module - The module name
 * @returns {Object} Logger object with methods for each log level
 */
export function createLogger(module) {
  return {
    debug: (message, data) => log(module, message, data, LogLevel.DEBUG),
    info: (message, data) => log(module, message, data, LogLevel.INFO),
    warn: (message, data) => log(module, message, data, LogLevel.WARN),
    error: (message, data) => log(module, message, data, LogLevel.ERROR)
  };
} 