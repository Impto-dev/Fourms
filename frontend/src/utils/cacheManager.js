class CacheManager {
  constructor(options = {}) {
    this.defaultTTL = options.defaultTTL || 3600000; // 1 hour in milliseconds
    this.maxSize = options.maxSize || 100; // Maximum number of items
    this.storage = new Map();
    this.cleanupInterval = options.cleanupInterval || 300000; // 5 minutes
    this.startCleanupInterval();
  }

  set(key, value, ttl = this.defaultTTL) {
    const now = Date.now();
    const item = {
      value,
      expiry: now + ttl,
      lastAccessed: now,
    };

    // Remove oldest item if cache is full
    if (this.storage.size >= this.maxSize) {
      const oldestKey = this.getOldestKey();
      this.storage.delete(oldestKey);
    }

    this.storage.set(key, item);
    return value;
  }

  get(key) {
    const item = this.storage.get(key);
    if (!item) return null;

    const now = Date.now();
    if (now > item.expiry) {
      this.storage.delete(key);
      return null;
    }

    // Update last accessed time
    item.lastAccessed = now;
    this.storage.set(key, item);

    return item.value;
  }

  delete(key) {
    return this.storage.delete(key);
  }

  clear() {
    this.storage.clear();
  }

  getOldestKey() {
    let oldestKey = null;
    let oldestTime = Infinity;

    for (const [key, item] of this.storage.entries()) {
      if (item.lastAccessed < oldestTime) {
        oldestTime = item.lastAccessed;
        oldestKey = key;
      }
    }

    return oldestKey;
  }

  cleanup() {
    const now = Date.now();
    for (const [key, item] of this.storage.entries()) {
      if (now > item.expiry) {
        this.storage.delete(key);
      }
    }
  }

  startCleanupInterval() {
    setInterval(() => this.cleanup(), this.cleanupInterval);
  }

  getSize() {
    return this.storage.size;
  }

  getKeys() {
    return Array.from(this.storage.keys());
  }

  has(key) {
    return this.storage.has(key);
  }
}

// Create a singleton instance
const cacheManager = new CacheManager();

export default cacheManager; 