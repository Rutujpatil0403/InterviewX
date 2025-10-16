const logger = {
  info: (message, metadata = {}) => {
    console.log(`[INFO] ${new Date().toISOString()} - ${message}`, metadata);
  },
  
  error: (message, metadata = {}) => {
    console.error(`[ERROR] ${new Date().toISOString()} - ${message}`, metadata);
  },
  
  warn: (message, metadata = {}) => {
    console.warn(`[WARN] ${new Date().toISOString()} - ${message}`, metadata);
  },
  
  debug: (message, metadata = {}) => {
    if (process.env.NODE_ENV === 'development') {
      console.debug(`[DEBUG] ${new Date().toISOString()} - ${message}`, metadata);
    }
  }
};

module.exports = logger;