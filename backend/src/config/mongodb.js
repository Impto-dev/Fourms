const mongoose = require('mongoose');

const mongodbConfig = {
  connect: async () => {
    try {
      const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/forum';
      
      const options = {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        // Connection pool settings
        maxPoolSize: 10,
        minPoolSize: 5,
        // Timeout settings
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        // Write concern
        w: 'majority',
        // Retry settings
        retryWrites: true,
        retryReads: true,
        // Index settings
        autoIndex: process.env.NODE_ENV !== 'production',
        // Compression
        compressors: ['zlib'],
        zlibCompressionLevel: 7,
        // Query caching
        cacheSize: 1000,
        cacheTimeout: 30000,
        // Performance monitoring
        monitorCommands: true
      };

      await mongoose.connect(uri, options);

      // Connection events
      mongoose.connection.on('connected', () => {
        console.log('MongoDB connected successfully');
      });

      mongoose.connection.on('error', (err) => {
        console.error('MongoDB connection error:', err);
      });

      mongoose.connection.on('disconnected', () => {
        console.log('MongoDB disconnected');
      });

      // Performance monitoring
      mongoose.connection.on('commandStarted', (event) => {
        if (process.env.NODE_ENV === 'development') {
          console.log(`MongoDB Command Started: ${event.commandName}`);
        }
      });

      mongoose.connection.on('commandSucceeded', (event) => {
        if (process.env.NODE_ENV === 'development') {
          console.log(`MongoDB Command Succeeded: ${event.commandName} in ${event.duration}ms`);
        }
      });

      // Graceful shutdown
      process.on('SIGINT', async () => {
        await mongoose.connection.close();
        process.exit(0);
      });

    } catch (error) {
      console.error('MongoDB connection error:', error);
      process.exit(1);
    }
  },

  // Index creation helper
  createIndexes: async (model, indexes) => {
    try {
      await model.createIndexes(indexes);
      console.log(`Indexes created for ${model.modelName}`);
    } catch (error) {
      console.error(`Error creating indexes for ${model.modelName}:`, error);
    }
  },

  // Query optimization settings
  querySettings: {
    // Maximum time to wait for query execution
    maxTimeMS: 30000,
    // Use indexes for sorting
    hint: { $natural: 1 },
    // Projection to limit returned fields
    projection: { __v: 0 },
    // Query caching
    cache: true,
    cacheTimeout: 30000,
    // Explain query execution
    explain: process.env.NODE_ENV === 'development'
  },

  // Aggregation settings
  aggregationSettings: {
    allowDiskUse: true,
    maxTimeMS: 60000,
    batchSize: 1000,
    // Aggregation pipeline optimization
    explain: process.env.NODE_ENV === 'development',
    // Memory limits
    maxMemoryUsageBytes: 100 * 1024 * 1024 // 100MB
  },

  // Bulk operation settings
  bulkSettings: {
    ordered: false,
    writeConcern: { w: 'majority' },
    // Batch size optimization
    batchSize: 1000,
    // Error handling
    continueOnError: true
  },

  // Performance monitoring
  monitor: {
    // Enable slow query logging
    slowQueryThreshold: 100, // ms
    // Enable query profiling
    profile: process.env.NODE_ENV === 'development',
    // Enable index usage tracking
    trackIndexUsage: true
  }
};

module.exports = mongodbConfig; 