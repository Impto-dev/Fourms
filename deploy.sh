#!/bin/bash

# Exit on error
set -e

echo "Starting deployment process..."

# Install dependencies
echo "Installing backend dependencies..."
cd backend
npm install --production
cd ..

echo "Installing frontend dependencies..."
cd frontend
npm install --production
npm run build
cd ..

# Start MongoDB if not running
echo "Checking MongoDB..."
if ! mongod --version > /dev/null 2>&1; then
    echo "MongoDB is not installed. Please install MongoDB first."
    exit 1
fi

# Start Redis if not running
echo "Checking Redis..."
if ! redis-cli ping > /dev/null 2>&1; then
    echo "Redis is not running. Please start Redis first."
    exit 1
fi

# Start the application using PM2
echo "Starting application with PM2..."
pm2 start ecosystem.config.js --env production

# Save PM2 process list
pm2 save

echo "Deployment completed successfully!"
echo "Application is running on http://localhost:3000" 