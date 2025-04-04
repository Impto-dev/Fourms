#!/bin/bash

# Exit on error
set -e

# Function to log messages with timestamp
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

# Function to handle errors
handle_error() {
    log "ERROR: $1"
    log "Stack trace:"
    local i=0
    while caller $i; do
        i=$((i+1))
    done
    exit 1
}

# Trap errors
trap 'handle_error "An error occurred on line $LINENO"' ERR

log "Starting database migration process..."

# Load environment variables
if [ -f .env ]; then
    source .env || handle_error "Failed to load .env file"
fi

# Default values
DB_HOST=${MONGODB_URI:-"mongodb://localhost:27017"}
DB_NAME="forum"
BACKUP_DIR="./backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_PATH="$BACKUP_DIR/backup_$TIMESTAMP"
LOG_FILE="$BACKUP_DIR/migration_$TIMESTAMP.log"

# Create backup directory if it doesn't exist
mkdir -p $BACKUP_DIR || handle_error "Failed to create backup directory"

# Check MongoDB connection
if ! mongosh --eval "db.version()" > /dev/null 2>&1; then
    handle_error "MongoDB is not running or not accessible"
fi

log "Creating database backup..."
if ! mongodump --uri="$DB_HOST/$DB_NAME" --out="$BACKUP_PATH" >> "$LOG_FILE" 2>&1; then
    handle_error "Failed to create database backup"
fi

log "Running migrations..."
cd backend || handle_error "Failed to change to backend directory"

# Check if migration script exists
if [ ! -f "package.json" ]; then
    handle_error "package.json not found in backend directory"
fi

# Check if migrate script exists
if ! grep -q "\"migrate\":" package.json; then
    handle_error "migrate script not found in package.json"
fi

# Run database migrations
log "Executing migration script..."
if ! npm run migrate >> "../$LOG_FILE" 2>&1; then
    log "Migration failed! Restoring from backup..."
    if ! mongorestore --uri="$DB_HOST/$DB_NAME" "$BACKUP_PATH/$DB_NAME" >> "../$LOG_FILE" 2>&1; then
        handle_error "Failed to restore from backup"
    fi
    log "Database restored from backup"
    exit 1
fi

cd ..

# Verify database after migration
log "Verifying database after migration..."
if ! mongosh --eval "db.getSiblingDB('$DB_NAME').stats()" > /dev/null 2>&1; then
    handle_error "Database verification failed after migration"
fi

log "Migration completed successfully!"
log "Backup stored in: $BACKUP_PATH"
log "Log file: $LOG_FILE" 