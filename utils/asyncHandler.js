/**
 * Async handler wrapper
 * Wraps async route handlers to automatically catch errors and pass them to the error handler
 * Eliminates the need for try-catch blocks in every controller
 *
 * Usage:
 *   const asyncHandler = require('../utils/asyncHandler');
 *   router.get('/endpoint', asyncHandler(async (req, res) => {
 *     const data = await SomeModel.find();
 *     res.json({ success: true, data });
 *   }));
 */

const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
