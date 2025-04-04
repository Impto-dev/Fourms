# IP Configuration Guide

## Network Configuration

### Backend Server
- Main Application: `127.0.0.1:5000` (Internal)
- WebSocket Server: `127.0.0.1:5001` (Internal)
- Admin Panel: `127.0.0.1:5002` (Internal)

### Database Servers
- MongoDB: `127.0.0.1:27017` (Internal)
- Redis: `127.0.0.1:6379` (Internal)

### Load Balancer Configuration
```nginx
upstream forum_backend {
    server 127.0.0.1:5000 weight=3;  # Main application server
    server 127.0.0.1:5001;           # WebSocket server
    server 127.0.0.1:5002;           # Admin panel
}
```

## Security Zones

### Public Zone (Internet-Facing)
- HTTP: Port 80
- HTTPS: Port 443
- SSH: Port 22 (Configurable)

### Application Zone
- Backend API: `10.0.1.0/24`
- WebSocket: `10.0.1.0/24`
- Admin Panel: `10.0.1.0/24`

### Database Zone
- MongoDB Network: `10.0.2.0/24`
- Redis Network: `10.0.2.0/24`

## Firewall Rules

### External Access (UFW)
```bash
# Allow SSH
sudo ufw allow 22/tcp

# Allow HTTP/HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Allow specific IPs for admin access
sudo ufw allow from 192.168.1.100 to any port 5002  # Admin panel access
sudo ufw allow from 192.168.1.0/24 to any port 27017  # MongoDB access
```

### Internal Network Rules
```bash
# Allow internal application communication
sudo iptables -A INPUT -s 10.0.1.0/24 -j ACCEPT
sudo iptables -A OUTPUT -d 10.0.1.0/24 -j ACCEPT

# Allow database access only from application servers
sudo iptables -A INPUT -s 10.0.1.0/24 -d 10.0.2.0/24 -p tcp --dport 27017 -j ACCEPT
sudo iptables -A INPUT -s 10.0.1.0/24 -d 10.0.2.0/24 -p tcp --dport 6379 -j ACCEPT
```

## Rate Limiting Configuration

### Nginx Rate Limiting
```nginx
# Define rate limiting zones
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
limit_req_zone $binary_remote_addr zone=auth_limit:10m rate=5r/s;

# Apply rate limiting to specific endpoints
location /api/ {
    limit_req zone=api_limit burst=20 nodelay;
    proxy_pass http://forum_backend;
}

location /api/auth/ {
    limit_req zone=auth_limit burst=5 nodelay;
    proxy_pass http://forum_backend;
}
```

## IP Whitelisting

### Admin Access
```nginx
# Admin panel access restriction
location /admin {
    allow 192.168.1.100;  # Admin IP
    allow 10.0.1.0/24;    # Internal network
    deny all;             # Deny all other IPs
    
    proxy_pass http://127.0.0.1:5002;
}
```

### Database Access
```bash
# MongoDB configuration (/etc/mongod.conf)
net:
  bindIp: 127.0.0.1,10.0.2.1  # Listen on localhost and internal network
  port: 27017

security:
  authorization: enabled

# Redis configuration (/etc/redis/redis.conf)
bind 127.0.0.1 10.0.2.1
protected-mode yes
```

## Monitoring Configuration

### IP Monitoring
```javascript
// monitoring-config.js
module.exports = {
    monitoredNetworks: [
        '10.0.1.0/24',  // Application network
        '10.0.2.0/24',  // Database network
    ],
    alertThresholds: {
        requestRate: 1000,    // Requests per second
        errorRate: 50,        // Errors per minute
        responseTime: 500,    // milliseconds
    },
    whitelistedIPs: [
        '192.168.1.100',     // Admin IP
        '192.168.1.101',     // Monitoring system
    ]
};
```

## Geographic Restrictions

### Nginx Geo Module
```nginx
# Define allowed countries
geo $allowed_country {
    default no;
    US yes;
    CA yes;
    GB yes;
    # Add more countries as needed
}

# Apply restriction
if ($allowed_country = no) {
    return 403;
}
```

## Load Balancer Health Checks

```nginx
# Health check configuration
location /health {
    access_log off;
    return 200;
    add_header Content-Type text/plain;
}

# Upstream configuration with health checks
upstream forum_backend {
    server 127.0.0.1:5000 max_fails=3 fail_timeout=30s;
    server 127.0.0.1:5001 max_fails=3 fail_timeout=30s;
    server 127.0.0.1:5002 max_fails=3 fail_timeout=30s;
    
    check interval=3000 rise=2 fall=5 timeout=1000 type=http;
    check_http_send "HEAD / HTTP/1.0\r\n\r\n";
    check_http_expect_alive http_2xx http_3xx;
}
```

## Environment Variables

```bash
# .env configuration
NODE_ENV=production
HOST=0.0.0.0
PORT=5000
WEBSOCKET_PORT=5001
ADMIN_PORT=5002

# Database connections
MONGODB_URI=mongodb://forum_user:password@10.0.2.1:27017/forum_db
REDIS_URL=redis://10.0.2.1:6379

# Security
ALLOWED_ORIGINS=https://your-domain.com,https://admin.your-domain.com
ADMIN_IPS=192.168.1.100,192.168.1.101
RATE_LIMIT_WINDOW=900000
RATE_LIMIT_MAX=100
```

## Backup Server Configuration

```bash
# Backup server IP: 10.0.3.1
# Backup network: 10.0.3.0/24

# Allow backup server access
sudo iptables -A INPUT -s 10.0.3.0/24 -j ACCEPT
sudo iptables -A OUTPUT -d 10.0.3.0/24 -j ACCEPT

# MongoDB backup configuration
BACKUP_SERVER=10.0.3.1
BACKUP_PORT=27018
BACKUP_USER=backup_user
```

## Emergency Access

```bash
# Emergency admin IPs (in case of security incident)
EMERGENCY_IPS=(
    "192.168.1.200"  # Emergency admin 1
    "192.168.1.201"  # Emergency admin 2
)

# Emergency access script
for IP in "${EMERGENCY_IPS[@]}"; do
    sudo ufw allow from $IP to any port 22
    sudo ufw allow from $IP to any port 5002
done
``` 