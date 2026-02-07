/**
 * HTTP Parameter Pollution (HPP) protection middleware
 * Prevents parameter pollution attacks by picking the last value for duplicated params
 */

const hpp = (options = {}) => {
  const whitelist = new Set(options.whitelist || []);

  return (req, res, next) => {
    if (req.query) {
      for (const [key, value] of Object.entries(req.query)) {
        if (Array.isArray(value) && !whitelist.has(key)) {
          // Pick the last value for duplicated params
          req.query[key] = value[value.length - 1];
        }
      }
    }
    next();
  };
};

module.exports = { hpp };
