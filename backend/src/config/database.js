const { Sequelize } = require('sequelize');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const mongodbConfig = require('./mongodb');
const mysqlConfig = require('./mysql');
const sqliteConfig = require('./sqlite');

class Database {
  constructor() {
    this.type = process.env.DB_TYPE || 'mongodb';
    this.connections = {};
  }

  async connect() {
    try {
      switch (this.type) {
        case 'mongodb':
          await mongodbConfig.connect();
          this.connections.mongodb = mongoose.connection;
          break;
        case 'mysql':
          this.connections.mysql = await mysqlConfig.connect();
          break;
        case 'sqlite':
          this.connections.sqlite = await sqliteConfig.connect();
          break;
        default:
          throw new Error(`Unsupported database type: ${this.type}`);
      }
      console.log(`Connected to ${this.type} database successfully`);
    } catch (error) {
      console.error('Database connection error:', error);
      process.exit(1);
    }
  }

  getConnection(type = null) {
    const dbType = type || this.type;
    return this.connections[dbType];
  }

  getConfig(type = null) {
    const dbType = type || this.type;
    switch (dbType) {
      case 'mongodb':
        return mongodbConfig;
      case 'mysql':
        return mysqlConfig;
      case 'sqlite':
        return sqliteConfig;
      default:
        throw new Error(`Unsupported database type: ${dbType}`);
    }
  }

  async close() {
    for (const [type, connection] of Object.entries(this.connections)) {
      if (type === 'mongodb') {
        await connection.close();
      } else {
        await connection.close();
      }
    }
  }
}

module.exports = new Database(); 