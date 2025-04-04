const { Sequelize } = require('sequelize');
const path = require('path');
const fs = require('fs');

const sqliteConfig = {
  connect: async () => {
    try {
      const dbPath = path.join(__dirname, '../../data/forum.sqlite');
      const dataDir = path.dirname(dbPath);
      
      // Ensure data directory exists
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      const sequelize = new Sequelize({
        dialect: 'sqlite',
        storage: dbPath,
        // Logging
        logging: process.env.NODE_ENV === 'development' ? console.log : false,
        // Query optimization
        benchmark: process.env.NODE_ENV === 'development',
        // Transaction settings
        transactionType: 'IMMEDIATE',
        // Query timeout
        queryTimeout: 30000,
        // Connection timeout
        connectTimeout: 10000,
        // Journal mode (WAL for better concurrency)
        dialectOptions: {
          mode: 'WAL',
          // Cache size
          cacheSize: -2000, // 2MB
          // Synchronous mode
          synchronous: 'NORMAL',
          // Temp store
          temp_store: 'MEMORY',
          // Page size
          page_size: 4096,
          // Auto vacuum
          auto_vacuum: 'INCREMENTAL'
        },
        // Retry settings
        retry: {
          max: 3,
          match: [
            /SQLITE_BUSY/,
            /SQLITE_LOCKED/,
            /TimeoutError/
          ]
        },
        // Query caching
        cache: {
          enabled: true,
          ttl: 30000,
          max: 1000
        },
        // Performance monitoring
        monitor: {
          enabled: true,
          slowQueryThreshold: 100,
          logSlowQueries: true
        }
      });

      // Test the connection
      await sequelize.authenticate();
      console.log('SQLite connected successfully');

      // Set up performance monitoring
      if (process.env.NODE_ENV === 'development') {
        sequelize.afterQuery((sql, timing) => {
          if (timing > 100) { // Log slow queries
            console.log(`Slow query detected (${timing}ms):`, sql);
          }
        });
      }

      // Optimize database
      await sequelize.query('PRAGMA optimize;');
      await sequelize.query('PRAGMA cache_size = -2000;');
      await sequelize.query('PRAGMA temp_store = MEMORY;');
      await sequelize.query('PRAGMA synchronous = NORMAL;');
      await sequelize.query('PRAGMA journal_mode = WAL;');
      await sequelize.query('PRAGMA auto_vacuum = INCREMENTAL;');

      return sequelize;
    } catch (error) {
      console.error('SQLite connection error:', error);
      process.exit(1);
    }
  },

  // Query optimization settings
  querySettings: {
    // Transaction isolation level
    isolationLevel: Sequelize.Transaction.ISOLATION_LEVELS.SERIALIZABLE,
    // Lock mode
    lock: Sequelize.Transaction.LOCK.EXCLUSIVE,
    // Query timeout
    timeout: 30000,
    // Query caching
    cache: true,
    // Query optimization
    explain: process.env.NODE_ENV === 'development'
  },

  // Bulk operation settings
  bulkSettings: {
    // Batch size for bulk operations
    batchSize: 1000,
    // Ignore duplicate keys
    ignoreDuplicates: true,
    // Update on duplicate
    updateOnDuplicate: true,
    // Transaction settings
    transaction: true,
    // Error handling
    rollbackOnError: true
  },

  // Index settings
  indexSettings: {
    // Index type
    type: 'BTREE',
    // Index method
    method: 'BTREE',
    // Index options
    options: {
      // Index compression
      compression: 'LZ4',
      // Index visibility
      visible: true
    }
  },

  // Vacuum settings (for database optimization)
  vacuumSettings: {
    // Auto-vacuum mode
    autoVacuum: 'INCREMENTAL',
    // Page size
    pageSize: 4096,
    // Cache size
    cacheSize: -2000, // 2MB
    // Synchronous mode
    synchronous: 'NORMAL',
    // Journal mode
    journalMode: 'WAL',
    // Temp store
    tempStore: 'MEMORY'
  },

  // Performance monitoring
  monitor: {
    // Enable slow query logging
    slowQueryThreshold: 100, // ms
    // Enable query profiling
    profile: process.env.NODE_ENV === 'development',
    // Enable index usage tracking
    trackIndexUsage: true,
    // Enable database size monitoring
    size: {
      enabled: true,
      interval: 3600000 // Check every hour
    }
  }
};

module.exports = sqliteConfig; 