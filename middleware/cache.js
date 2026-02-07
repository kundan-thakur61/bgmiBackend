const { cache } = require('../config/redis');

/**
 * Middleware to cache API responses
 * Usage: router.get('/endpoint', cacheMiddleware(300), controller)
 */
const cacheMiddleware = (ttl = 300) => {
    return async (req, res, next) => {
        // Skip caching if Redis is unavailable
        if (!cache) {
            return next();
        }

        // Generate cache key from request
        const cacheKey = generateCacheKey(req);

        try {
            // Try to get cached data
            const cachedData = await cache.get(cacheKey);

            if (cachedData) {
                // Cache hit
                return res.json({
                    ...cachedData,
                    cached: true,
                    cachedAt: new Date().toISOString()
                });
            }

            // Cache miss - continue to controller
            // Intercept res.json to cache the response
            const originalJson = res.json.bind(res);
            res.json = function (data) {
                // Only cache successful responses
                if (data.success !== false) {
                    cache.set(cacheKey, data, ttl).catch(err => {
                        console.error('Failed to cache response:', err);
                    });
                }
                return originalJson(data);
            };

            next();
        } catch (error) {
            console.error('Cache middleware error:', error);
            next();
        }
    };
};

/**
 * Generate cache key from request
 */
function generateCacheKey(req) {
    const { method, originalUrl, userId } = req;
    const queryString = JSON.stringify(req.query);

    // Include user ID for personalized endpoints
    const userPart = userId ? `:user:${userId}` : '';

    return `api:${method}:${originalUrl}${userPart}:${queryString}`;
}

/**
 * Clear cache by pattern
 */
const clearCache = (pattern) => {
    return async (req, res, next) => {
        try {
            await cache.delPattern(pattern);
            next();
        } catch (error) {
            console.error('Clear cache error:', error);
            next();
        }
    };
};

/**
 * Invalidate specific cache keys
 */
const invalidateCache = (...keys) => {
    return async (req, res, next) => {
        try {
            for (const key of keys) {
                await cache.del(key);
            }
            next();
        } catch (error) {
            console.error('Invalidate cache error:', error);
            next();
        }
    };
};

module.exports = {
    cacheMiddleware,
    clearCache,
    invalidateCache,
    generateCacheKey
};
