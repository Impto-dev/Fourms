const { redis } = require('../config/redis');
const logger = require('../utils/logger');

class QueryOptimizer {
    /**
     * Optimize a MongoDB query with caching and indexing
     * @param {Object} model - Mongoose model
     * @param {Object} query - Query object
     * @param {Object} options - Query options
     * @returns {Promise<Object>} Query result
     */
    static async optimizeQuery(model, query, options = {}) {
        const cacheKey = this.generateCacheKey(model.modelName, query, options);
        
        // Try to get from cache first
        const cachedResult = await this.getFromCache(cacheKey);
        if (cachedResult) {
            logger.debug(`Cache hit for ${cacheKey}`);
            return cachedResult;
        }

        // Apply query optimizations
        const optimizedQuery = this.applyQueryOptimizations(model, query, options);
        
        // Execute query
        const result = await model.find(optimizedQuery.query)
            .select(optimizedQuery.select)
            .sort(optimizedQuery.sort)
            .skip(optimizedQuery.skip)
            .limit(optimizedQuery.limit)
            .lean();

        // Cache the result
        await this.cacheResult(cacheKey, result, options.cacheTTL || 300);

        return result;
    }

    /**
     * Generate a cache key for the query
     * @param {String} modelName - Model name
     * @param {Object} query - Query object
     * @param {Object} options - Query options
     * @returns {String} Cache key
     */
    static generateCacheKey(modelName, query, options) {
        const queryString = JSON.stringify(query);
        const optionsString = JSON.stringify(options);
        return `query:${modelName}:${queryString}:${optionsString}`;
    }

    /**
     * Get result from cache
     * @param {String} cacheKey - Cache key
     * @returns {Promise<Object|null>} Cached result
     */
    static async getFromCache(cacheKey) {
        try {
            const cached = await redis.get(cacheKey);
            return cached ? JSON.parse(cached) : null;
        } catch (error) {
            logger.error('Error getting from cache:', error);
            return null;
        }
    }

    /**
     * Cache query result
     * @param {String} cacheKey - Cache key
     * @param {Object} result - Query result
     * @param {Number} ttl - Time to live in seconds
     * @returns {Promise<void>}
     */
    static async cacheResult(cacheKey, result, ttl) {
        try {
            await redis.set(cacheKey, JSON.stringify(result), 'EX', ttl);
        } catch (error) {
            logger.error('Error caching result:', error);
        }
    }

    /**
     * Apply query optimizations
     * @param {Object} model - Mongoose model
     * @param {Object} query - Query object
     * @param {Object} options - Query options
     * @returns {Object} Optimized query
     */
    static applyQueryOptimizations(model, query, options) {
        const optimized = {
            query: {},
            select: {},
            sort: {},
            skip: 0,
            limit: 10
        };

        // Apply field selection
        if (options.select) {
            optimized.select = this.optimizeFieldSelection(options.select);
        }

        // Apply sorting
        if (options.sort) {
            optimized.sort = this.optimizeSorting(options.sort);
        }

        // Apply pagination
        if (options.skip) {
            optimized.skip = parseInt(options.skip);
        }
        if (options.limit) {
            optimized.limit = parseInt(options.limit);
        }

        // Apply query conditions
        optimized.query = this.optimizeQueryConditions(query);

        return optimized;
    }

    /**
     * Optimize field selection
     * @param {Object|String} select - Field selection
     * @returns {Object} Optimized field selection
     */
    static optimizeFieldSelection(select) {
        if (typeof select === 'string') {
            return select.split(' ').reduce((acc, field) => {
                acc[field] = 1;
                return acc;
            }, {});
        }
        return select;
    }

    /**
     * Optimize sorting
     * @param {Object|String} sort - Sort criteria
     * @returns {Object} Optimized sort criteria
     */
    static optimizeSorting(sort) {
        if (typeof sort === 'string') {
            return sort.split(' ').reduce((acc, field) => {
                const direction = field.startsWith('-') ? -1 : 1;
                acc[field.replace(/^-/, '')] = direction;
                return acc;
            }, {});
        }
        return sort;
    }

    /**
     * Optimize query conditions
     * @param {Object} query - Query conditions
     * @returns {Object} Optimized query conditions
     */
    static optimizeQueryConditions(query) {
        const optimized = { ...query };

        // Convert $or to $in where possible
        if (optimized.$or) {
            optimized.$or = optimized.$or.map(condition => {
                const keys = Object.keys(condition);
                if (keys.length === 1) {
                    const [key, value] = Object.entries(condition)[0];
                    if (Array.isArray(value)) {
                        return { [key]: { $in: value } };
                    }
                }
                return condition;
            });
        }

        // Optimize date ranges
        if (optimized.createdAt) {
            if (optimized.createdAt.$gte && optimized.createdAt.$lte) {
                optimized.createdAt = {
                    $gte: new Date(optimized.createdAt.$gte),
                    $lte: new Date(optimized.createdAt.$lte)
                };
            }
        }

        return optimized;
    }

    /**
     * Clear cache for a model
     * @param {String} modelName - Model name
     * @returns {Promise<void>}
     */
    static async clearModelCache(modelName) {
        try {
            const keys = await redis.keys(`query:${modelName}:*`);
            if (keys.length > 0) {
                await redis.del(keys);
            }
        } catch (error) {
            logger.error('Error clearing model cache:', error);
        }
    }
}

module.exports = QueryOptimizer; 