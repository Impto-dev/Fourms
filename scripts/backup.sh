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

log "Starting backup process..."

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
LOG_FILE="$BACKUP_DIR/backup_$TIMESTAMP.log"

# Create backup directory if it doesn't exist
mkdir -p $BACKUP_PATH || handle_error "Failed to create backup directory"

# Check MongoDB connection
if ! mongosh --eval "db.version()" > /dev/null 2>&1; then
    handle_error "MongoDB is not running or not accessible"
fi

# Check Redis connection
if ! redis-cli ping > /dev/null 2>&1; then
    handle_error "Redis is not running or not accessible"
fi

log "Backing up database..."
if ! mongodump --uri="$DB_HOST/$DB_NAME" --out="$BACKUP_PATH/db" >> "$LOG_FILE" 2>&1; then
    handle_error "Failed to backup database"
fi

log "Backing up Redis data..."
if ! redis-cli SAVE >> "$LOG_FILE" 2>&1; then
    handle_error "Failed to save Redis data"
fi

if [ ! -f "/var/lib/redis/dump.rdb" ]; then
    handle_error "Redis dump file not found"
fi

if ! cp /var/lib/redis/dump.rdb "$BACKUP_PATH/redis.rdb" >> "$LOG_FILE" 2>&1; then
    handle_error "Failed to copy Redis dump file"
fi

log "Backing up application files..."
if ! tar -czf "$BACKUP_PATH/app.tar.gz" \
    --exclude='node_modules' \
    --exclude='.git' \
    --exclude='backups' \
    . >> "$LOG_FILE" 2>&1; then
    handle_error "Failed to backup application files"
fi

log "Creating backup archive..."
cd $BACKUP_DIR || handle_error "Failed to change to backup directory"

if ! tar -czf "backup_$TIMESTAMP.tar.gz" "backup_$TIMESTAMP" >> "$LOG_FILE" 2>&1; then
    handle_error "Failed to create backup archive"
fi

if ! rm -rf "backup_$TIMESTAMP" >> "$LOG_FILE" 2>&1; then
    handle_error "Failed to clean up temporary backup directory"
fi

log "Cleaning up old backups (keeping last 7 days)..."
if ! find $BACKUP_DIR -name "backup_*.tar.gz" -mtime +7 -delete >> "$LOG_FILE" 2>&1; then
    log "Warning: Failed to clean up old backups"
fi

# Verify backup integrity
log "Verifying backup integrity..."
if ! tar -tzf "backup_$TIMESTAMP.tar.gz" > /dev/null 2>&1; then
    handle_error "Backup archive verification failed"
fi

log "Backup completed successfully!"
log "Backup stored in: $BACKUP_DIR/backup_$TIMESTAMP.tar.gz"
log "Log file: $LOG_FILE" 