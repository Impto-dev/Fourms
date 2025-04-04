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

log "Starting rollback process..."

# Load environment variables
if [ -f .env ]; then
    source .env || handle_error "Failed to load .env file"
fi

# Default values
DB_HOST=${MONGODB_URI:-"mongodb://localhost:27017"}
DB_NAME="forum"
BACKUP_DIR="./backups"
LOG_FILE="$BACKUP_DIR/rollback_$(date +%Y%m%d_%H%M%S).log"

# Check if backup file is provided
if [ -z "$1" ]; then
    handle_error "Please provide a backup file to restore from\nUsage: ./rollback.sh <backup_file>"
fi

BACKUP_FILE="$1"

# Verify backup file exists
if [ ! -f "$BACKUP_FILE" ]; then
    handle_error "Backup file not found: $BACKUP_FILE"
fi

# Verify backup file integrity
log "Verifying backup file integrity..."
if ! tar -tzf "$BACKUP_FILE" > /dev/null 2>&1; then
    handle_error "Backup file is corrupted or invalid"
fi

# Check MongoDB connection
if ! mongosh --eval "db.version()" > /dev/null 2>&1; then
    handle_error "MongoDB is not running or not accessible"
fi

# Check Redis connection
if ! redis-cli ping > /dev/null 2>&1; then
    handle_error "Redis is not running or not accessible"
fi

log "Stopping application..."
if ! pm2 stop all >> "$LOG_FILE" 2>&1; then
    log "Warning: Failed to stop all PM2 processes"
fi

log "Extracting backup..."
TEMP_DIR=$(mktemp -d) || handle_error "Failed to create temporary directory"
if ! tar -xzf "$BACKUP_FILE" -C "$TEMP_DIR" >> "$LOG_FILE" 2>&1; then
    handle_error "Failed to extract backup file"
fi

# Verify extracted files
if [ ! -d "$TEMP_DIR/db" ] || [ ! -f "$TEMP_DIR/redis.rdb" ] || [ ! -f "$TEMP_DIR/app.tar.gz" ]; then
    handle_error "Backup is missing required files"
fi

log "Restoring database..."
if ! mongorestore --uri="$DB_HOST/$DB_NAME" --drop "$TEMP_DIR/db" >> "$LOG_FILE" 2>&1; then
    handle_error "Failed to restore database"
fi

log "Restoring Redis data..."
if ! sudo systemctl stop redis >> "$LOG_FILE" 2>&1; then
    handle_error "Failed to stop Redis service"
fi

if ! cp "$TEMP_DIR/redis.rdb" /var/lib/redis/dump.rdb >> "$LOG_FILE" 2>&1; then
    handle_error "Failed to copy Redis dump file"
fi

if ! sudo systemctl start redis >> "$LOG_FILE" 2>&1; then
    handle_error "Failed to start Redis service"
fi

log "Restoring application files..."
if ! tar -xzf "$TEMP_DIR/app.tar.gz" -C . >> "$LOG_FILE" 2>&1; then
    handle_error "Failed to restore application files"
fi

log "Cleaning up..."
if ! rm -rf "$TEMP_DIR" >> "$LOG_FILE" 2>&1; then
    log "Warning: Failed to clean up temporary directory"
fi

log "Starting application..."
if ! pm2 start all >> "$LOG_FILE" 2>&1; then
    handle_error "Failed to start application"
fi

# Verify application is running
if ! pm2 list | grep -q "online"; then
    handle_error "Application failed to start properly"
fi

log "Rollback completed successfully!"
log "Application has been restored from backup: $BACKUP_FILE"
log "Log file: $LOG_FILE" 