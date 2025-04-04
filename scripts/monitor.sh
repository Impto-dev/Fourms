#!/bin/bash

# Function to log messages with timestamp
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

# Function to check service status
check_service() {
    local service=$1
    local command=$2
    local check=$3
    
    if ! $command $check > /dev/null 2>&1; then
        log "ERROR: $service is not running or not accessible"
        return 1
    fi
    log "OK: $service is running"
    return 0
}

# Function to check file existence and age
check_file() {
    local file=$1
    local max_age=$2 # in minutes
    
    if [ ! -f "$file" ]; then
        log "ERROR: File not found: $file"
        return 1
    fi
    
    local file_age=$(( ($(date +%s) - $(stat -c %Y "$file")) / 60 ))
    if [ $file_age -gt $max_age ]; then
        log "WARNING: File is older than $max_age minutes: $file"
        return 2
    fi
    
    log "OK: File exists and is recent: $file"
    return 0
}

# Function to check disk space
check_disk_space() {
    local path=$1
    local threshold=$2 # percentage
    
    local usage=$(df -h "$path" | awk 'NR==2 {print $5}' | sed 's/%//')
    if [ $usage -gt $threshold ]; then
        log "WARNING: Disk usage is above $threshold%: $usage%"
        return 1
    fi
    log "OK: Disk usage is $usage%"
    return 0
}

# Function to check memory usage
check_memory() {
    local threshold=$1 # percentage
    
    local usage=$(free | awk '/Mem/ {printf("%.0f", $3/$2 * 100)}')
    if [ $usage -gt $threshold ]; then
        log "WARNING: Memory usage is above $threshold%: $usage%"
        return 1
    fi
    log "OK: Memory usage is $usage%"
    return 0
}

# Function to check CPU load
check_cpu_load() {
    local threshold=$1 # load average
    
    local load=$(uptime | awk '{print $(NF-2)}' | sed 's/,//')
    if (( $(echo "$load > $threshold" | bc -l) )); then
        log "WARNING: CPU load is above $threshold: $load"
        return 1
    fi
    log "OK: CPU load is $load"
    return 0
}

# Function to check PM2 processes
check_pm2() {
    if ! pm2 list > /dev/null 2>&1; then
        log "ERROR: PM2 is not running"
        return 1
    fi
    
    local offline_processes=$(pm2 list | grep -c "offline")
    if [ $offline_processes -gt 0 ]; then
        log "WARNING: $offline_processes PM2 processes are offline"
        return 2
    fi
    
    log "OK: All PM2 processes are running"
    return 0
}

# Function to check recent logs for errors
check_logs() {
    local log_dir=$1
    local hours=$2
    
    local error_count=$(find "$log_dir" -type f -mmin -$((hours * 60)) -exec grep -i "error\|failed\|exception" {} \; | wc -l)
    if [ $error_count -gt 0 ]; then
        log "WARNING: Found $error_count errors in logs from the last $hours hours"
        return 1
    fi
    log "OK: No errors found in recent logs"
    return 0
}

# Main monitoring function
monitor() {
    local status=0
    
    log "Starting system health check..."
    
    # Check services
    check_service "MongoDB" "mongosh" "--eval 'db.version()'" || status=1
    check_service "Redis" "redis-cli" "ping" || status=1
    check_pm2 || status=1
    
    # Check system resources
    check_disk_space "/" 90 || status=1
    check_memory 90 || status=1
    check_cpu_load 5.0 || status=1
    
    # Check recent backups
    check_file "./backups/backup_$(date +%Y%m%d)*.tar.gz" 1440 || status=1 # 24 hours
    
    # Check recent logs
    check_logs "./backups" 24 || status=1
    
    # Check deployment status
    if [ -f "./deploy_status" ]; then
        local deploy_status=$(cat "./deploy_status")
        if [ "$deploy_status" != "success" ]; then
            log "ERROR: Last deployment was not successful: $deploy_status"
            status=1
        else
            log "OK: Last deployment was successful"
        fi
    else
        log "WARNING: No deployment status file found"
        status=1
    fi
    
    if [ $status -eq 0 ]; then
        log "All checks passed successfully"
    else
        log "Some checks failed. Please review the logs above."
    fi
    
    return $status
}

# Run monitoring
monitor
exit $? 