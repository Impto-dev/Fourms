const { Sequelize } = require('sequelize');
const path = require('path');
const fs = require('fs');

// Get database configuration
const dbType = process.env.DB_TYPE || 'mongodb';

if (dbType === 'mongodb') {
  console.log('MongoDB does not require migrations');
  process.exit(0);
}

// Create Sequelize instance based on database type
let sequelize;
if (dbType === 'mysql') {
  sequelize = new Sequelize(
    process.env.MYSQL_DATABASE || 'forum',
    process.env.MYSQL_USER || 'root',
    process.env.MYSQL_PASSWORD || '',
    {
      host: process.env.MYSQL_HOST || 'localhost',
      port: process.env.MYSQL_PORT || 3306,
      dialect: 'mysql'
    }
  );
} else if (dbType === 'sqlite') {
  const dbPath = path.join(__dirname, '../../../data/forum.sqlite');
  const dataDir = path.dirname(dbPath);
  
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: dbPath
  });
}

// Import migrations
const createTables = require('./createTables');

async function runMigrations() {
  try {
    // Run migrations
    await createTables.up(sequelize.getQueryInterface(), Sequelize);
    console.log('Migrations completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

runMigrations(); 