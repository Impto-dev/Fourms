module.exports = {
  apps: [{
    name: 'forum-backend',
    script: 'backend/src/server.js',
    instances: 'max',
    exec_mode: 'cluster',
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'development',
      PORT: 3000,
      MONGODB_URI: 'mongodb://localhost:27017/forum',
      REDIS_URL: 'redis://localhost:6379'
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000,
      MONGODB_URI: 'mongodb://production-db:27017/forum',
      REDIS_URL: 'redis://production-redis:6379'
    }
  }]
}; 