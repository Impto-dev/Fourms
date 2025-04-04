class Cache {
    constructor() {
        this.cache = new Map();
        this.timeouts = new Map();
    }

    /**
     * Set a value in the cache
     * @param {String} key - Cache key
     * @param {*} value - Value to cache
     * @param {Number} ttl - Time to live in seconds
     */
    set(key, value, ttl = 300) {
        // Clear existing timeout if any
        if (this.timeouts.has(key)) {
            clearTimeout(this.timeouts.get(key));
        }

        // Set the value
        this.cache.set(key, value);

        // Set timeout for expiration
        if (ttl > 0) {
            const timeout = setTimeout(() => {
                this.delete(key);
            }, ttl * 1000);
            this.timeouts.set(key, timeout);
        }
    }

    /**
     * Get a value from the cache
     * @param {String} key - Cache key
     * @returns {*} Cached value or undefined
     */
    get(key) {
        return this.cache.get(key);
    }

    /**
     * Delete a value from the cache
     * @param {String} key - Cache key
     */
    delete(key) {
        this.cache.delete(key);
        if (this.timeouts.has(key)) {
            clearTimeout(this.timeouts.get(key));
            this.timeouts.delete(key);
        }
    }

    /**
     * Clear the entire cache
     */
    clear() {
        this.cache.clear();
        this.timeouts.forEach(timeout => clearTimeout(timeout));
        this.timeouts.clear();
    }

    /**
     * Check if a key exists in the cache
     * @param {String} key - Cache key
     * @returns {Boolean} Whether the key exists
     */
    has(key) {
        return this.cache.has(key);
    }

    /**
     * Get all keys in the cache
     * @returns {Array<String>} Array of cache keys
     */
    keys() {
        return Array.from(this.cache.keys());
    }

    /**
     * Get all values in the cache
     * @returns {Array<*>} Array of cached values
     */
    values() {
        return Array.from(this.cache.values());
    }

    /**
     * Get the size of the cache
     * @returns {Number} Number of items in the cache
     */
    size() {
        return this.cache.size;
    }
}

// Create a singleton instance
const cache = new Cache();

export { cache }; 