const { Sequelize } = require('sequelize');

const mysqlConfig = {
  connect: async () => {
    try {
      const sequelize = new Sequelize(
        process.env.MYSQL_DATABASE || 'forum',
        process.env.MYSQL_USER || 'root',
        process.env.MYSQL_PASSWORD || '',
        {
          host: process.env.MYSQL_HOST || 'localhost',
          port: process.env.MYSQL_PORT || 3306,
          dialect: 'mysql',
          // Connection pool settings
          pool: {
            max: 10,
            min: 0,
            acquire: 30000,
            idle: 10000,
            // Connection validation
            validate: true,
            // Connection eviction
            evict: 1000
          },
          // Logging
          logging: process.env.NODE_ENV === 'development' ? console.log : false,
          // Query optimization
          benchmark: process.env.NODE_ENV === 'development',
          // Timezone
          timezone: '+00:00',
          // Character set
          charset: 'utf8mb4',
          collate: 'utf8mb4_unicode_ci',
          // Transaction settings
          transactionType: 'IMMEDIATE',
          // Query timeout
          queryTimeout: 30000,
          // Connection timeout
          connectTimeout: 10000,
          // Retry settings
          retry: {
            max: 3,
            match: [
              /SequelizeConnectionError/,
              /SequelizeConnectionRefusedError/,
              /SequelizeHostNotFoundError/,
              /SequelizeHostNotReachableError/,
              /SequelizeInvalidConnectionError/,
              /SequelizeConnectionTimedOutError/,
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
        }
      );

      // Test the connection
      await sequelize.authenticate();
      console.log('MySQL connected successfully');

      // Set up performance monitoring
      if (process.env.NODE_ENV === 'development') {
        sequelize.afterQuery((sql, timing) => {
          if (timing > 100) { // Log slow queries
            console.log(`Slow query detected (${timing}ms):`, sql);
          }
        });
      }

      return sequelize;
    } catch (error) {
      console.error('MySQL connection error:', error);
      process.exit(1);
    }
  },

  // Query optimization settings
  querySettings: {
    // Transaction isolation level
    isolationLevel: Sequelize.Transaction.ISOLATION_LEVELS.REPEATABLE_READ,
    // Lock mode
    lock: Sequelize.Transaction.LOCK.UPDATE,
    // Query timeout
    timeout: 30000,
    // Query caching
    cache: true,
    // Query hints
    hints: ['USE INDEX (PRIMARY)'],
    // Query optimization
    optimizerHints: ['FORCE INDEX (PRIMARY)']
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

  // Performance monitoring
  monitor: {
    // Enable slow query logging
    slowQueryThreshold: 100, // ms
    // Enable query profiling
    profile: process.env.NODE_ENV === 'development',
    // Enable index usage tracking
    trackIndexUsage: true,
    // Enable connection pool monitoring
    pool: {
      enabled: true,
      interval: 60000 // Check every minute
    }
  }
};

module.exports = mysqlConfig; 