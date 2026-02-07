const Redis = require('ioredis');

// Create Redis client
const redis = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
    retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
    },
    maxRetriesPerRequest: 3
});

// Handle Redis connection events
redis.on('connect', () => {
    console.log('✅ Redis Connected');
});

redis.on('error', (err) => {
    console.error('❌ Redis Error:', err.message);
});

redis.on('reconnecting', () => {
    console.log('🔄 Redis Reconnecting...');
});

// Cache key generators
const cacheKeys = {
    tournament: (id) => `tournament:${id}`,
    tournamentList: (page, limit) => `tournaments:list:${page}:${limit}`,
    leaderboard: (tournamentId) => `leaderboard:${tournamentId}`,
    globalLeaderboard: (metric, limit) => `leaderboard:global:${metric}:${limit}`,
    playerStats: (userId) => `stats:player:${userId}`,
    match: (id) => `match:${id}`,
    userProfile: (userId) => `user:profile:${userId}`,
    referralStats: (userId) => `referral:stats:${userId}`
};

// Cache TTL (in seconds)
const cacheTTL = {
    short: 30, // 30 seconds - for frequently updated data
    medium: 300, // 5 minutes - for leaderboards
    long: 3600, // 1 hour - for static data
    veryLong: 86400 // 24 hours - for rarely changing data
};

// Helper functions
const cache = {
    // Get cached data
    get: async (key) => {
        try {
            const data = await redis.get(key);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('Cache get error:', error);
            return null;
        }
    },

    // Set cached data
    set: async (key, value, ttl = cacheTTL.medium) => {
        try {
            await redis.setex(key, ttl, JSON.stringify(value));
            return true;
        } catch (error) {
            console.error('Cache set error:', error);
            return false;
        }
    },

    // Delete cached data
    del: async (key) => {
        try {
            await redis.del(key);
            return true;
        } catch (error) {
            console.error('Cache delete error:', error);
            return false;
        }
    },

    // Delete multiple keys by pattern
    delPattern: async (pattern) => {
        try {
            const keys = await redis.keys(pattern);
            if (keys.length > 0) {
                await redis.del(...keys);
            }
            return true;
        } catch (error) {
            console.error('Cache pattern delete error:', error);
            return false;
        }
    },

    // Check if key exists
    exists: async (key) => {
        try {
            const result = await redis.exists(key);
            return result === 1;
        } catch (error) {
            console.error('Cache exists error:', error);
            return false;
        }
    },

    // Increment value
    incr: async (key) => {
        try {
            return await redis.incr(key);
        } catch (error) {
            console.error('Cache incr error:', error);
            return null;
        }
    },

    // Set with expiration
    expire: async (key, ttl) => {
        try {
            await redis.expire(key, ttl);
            return true;
        } catch (error) {
            console.error('Cache expire error:', error);
            return false;
        }
    }
};

module.exports = {
    redis,
    cache,
    cacheKeys,
    cacheTTL
};
