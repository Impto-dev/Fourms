# Deployment Guide

This guide provides detailed instructions for deploying the forum project on a Virtual Private Server (VPS).

## Table of Contents
1. [Server Requirements](#server-requirements)
2. [Initial Server Setup](#initial-server-setup)
3. [Installing Dependencies](#installing-dependencies)
4. [Database Setup](#database-setup)
5. [Application Deployment](#application-deployment)
6. [Nginx Configuration](#nginx-configuration)
7. [SSL Configuration](#ssl-configuration)
8. [Process Management](#process-management)
9. [Monitoring Setup](#monitoring-setup)
10. [Backup Configuration](#backup-configuration)

## Server Requirements

- Ubuntu 20.04 LTS or higher
- Minimum 2GB RAM
- 2 CPU cores
- 20GB SSD storage
- Root access or sudo privileges

## Initial Server Setup

1. Update system packages:
```bash
sudo apt update
sudo apt upgrade -y
```

2. Create a non-root user:
```bash
sudo adduser forum_user
sudo usermod -aG sudo forum_user
```

3. Configure SSH:
```bash
# Edit SSH config
sudo nano /etc/ssh/sshd_config

# Set these values
PermitRootLogin no
PasswordAuthentication no

# Restart SSH service
sudo systemctl restart sshd
```

4. Configure firewall:
```bash
sudo ufw allow OpenSSH
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
```

## Installing Dependencies

1. Install Node.js:
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
```

2. Install MongoDB:
```bash
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt update
sudo apt install -y mongodb-org
sudo systemctl start mongod
sudo systemctl enable mongod
```

3. Install Redis:
```bash
sudo apt install redis-server
sudo systemctl start redis-server
sudo systemctl enable redis-server
```

4. Install Nginx:
```bash
sudo apt install nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

5. Install PM2:
```bash
sudo npm install -g pm2
```

## Database Setup

1. Secure MongoDB:
```bash
# Create admin user
mongosh
use admin
db.createUser({
  user: "admin",
  pwd: "your_secure_password",
  roles: [ { role: "userAdminAnyDatabase", db: "admin" } ]
})

# Enable authentication
sudo nano /etc/mongod.conf

# Add/modify these lines:
security:
  authorization: enabled

# Restart MongoDB
sudo systemctl restart mongod
```

2. Create application database:
```bash
mongosh -u admin -p your_secure_password
use forum_db
db.createUser({
  user: "forum_user",
  pwd: "your_app_password",
  roles: [ { role: "readWrite", db: "forum_db" } ]
})
```

## Application Deployment

1. Clone repository:
```bash
cd /var/www
sudo git clone https://github.com/yourusername/forum-project.git
sudo chown -R forum_user:forum_user forum-project
```

2. Configure environment variables:
```bash
cd forum-project/backend
cp .env.example .env
nano .env

# Add production values:
NODE_ENV=production
MONGODB_URI=mongodb://forum_user:your_app_password@localhost:27017/forum_db
REDIS_URL=redis://localhost:6379
# ... other environment variables
```

3. Install dependencies and build:
```bash
# Backend
cd /var/www/forum-project/backend
npm install
npm run build

# Frontend
cd /var/www/forum-project/frontend
npm install
npm run build
```

## Nginx Configuration

1. Create Nginx configuration:
```bash
sudo nano /etc/nginx/sites-available/forum
```

2. Add configuration:
```nginx
upstream backend {
    server 127.0.0.1:5000;
}

server {
    listen 80;
    server_name your-domain.com;

    # Frontend
    location / {
        root /var/www/forum-project/frontend/build;
        try_files $uri $uri/ /index.html;
        expires 30d;
        add_header Cache-Control "public, no-transform";
    }

    # Backend API
    location /api {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # WebSocket support
    location /socket.io {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
}
```

3. Enable site:
```bash
sudo ln -s /etc/nginx/sites-available/forum /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## SSL Configuration

1. Install Certbot:
```bash
sudo apt install certbot python3-certbot-nginx
```

2. Obtain SSL certificate:
```bash
sudo certbot --nginx -d your-domain.com
```

## Process Management

1. Create PM2 ecosystem file:
```bash
cd /var/www/forum-project/backend
pm2 ecosystem.config.js
```

2. Configure PM2:
```javascript
module.exports = {
  apps: [{
    name: 'forum-backend',
    script: 'dist/index.js',
    instances: 'max',
    exec_mode: 'cluster',
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production'
    }
  }]
};
```

3. Start application:
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

## Monitoring Setup

1. Configure PM2 monitoring:
```bash
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

2. Set up application monitoring:
```bash
# Install monitoring tools
npm install -g node-clinic

# Monitor performance
clinic doctor -- node dist/index.js
```

## Backup Configuration

1. Create backup script:
```bash
sudo nano /usr/local/bin/backup-forum.sh
```

2. Add backup logic:
```bash
#!/bin/bash
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="/var/backups/forum"

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup MongoDB
mongodump --uri="mongodb://forum_user:your_app_password@localhost:27017/forum_db" --out="$BACKUP_DIR/mongo_$TIMESTAMP"

# Backup uploads
tar -czf "$BACKUP_DIR/uploads_$TIMESTAMP.tar.gz" /var/www/forum-project/backend/uploads

# Backup Redis
redis-cli save
cp /var/lib/redis/dump.rdb "$BACKUP_DIR/redis_$TIMESTAMP.rdb"

# Remove backups older than 7 days
find $BACKUP_DIR -type f -mtime +7 -exec rm {} \;
```

3. Configure backup schedule:
```bash
sudo chmod +x /usr/local/bin/backup-forum.sh
sudo crontab -e

# Add daily backup at 2 AM
0 2 * * * /usr/local/bin/backup-forum.sh
```

## Maintenance

1. Regular updates:
```bash
# Update system packages
sudo apt update
sudo apt upgrade -y

# Update Node.js packages
cd /var/www/forum-project/backend
npm update

cd /var/www/forum-project/frontend
npm update
```

2. Log rotation:
```bash
sudo nano /etc/logrotate.d/forum
```

Add configuration:
```
/var/www/forum-project/backend/logs/*.log {
    daily
    rotate 7
    compress
    delaycompress
    notifempty
    create 0640 forum_user forum_user
}
```

## Troubleshooting

Common issues and solutions:

1. Application not starting:
- Check PM2 logs: `pm2 logs`
- Verify environment variables: `cat .env`
- Check system resources: `htop`

2. Database connection issues:
- Verify MongoDB status: `sudo systemctl status mongod`
- Check MongoDB logs: `tail -f /var/log/mongodb/mongod.log`
- Test connection: `mongosh -u forum_user -p your_app_password forum_db`

3. Nginx issues:
- Check Nginx status: `sudo systemctl status nginx`
- Verify configuration: `sudo nginx -t`
- Check error logs: `sudo tail -f /var/log/nginx/error.log`

## Security Checklist

- [ ] Configure firewall rules
- [ ] Set up SSL certificates
- [ ] Secure MongoDB access
- [ ] Configure Redis password
- [ ] Set up regular security updates
- [ ] Configure backup system
- [ ] Set up monitoring alerts
- [ ] Review application logs
- [ ] Test backup restoration
- [ ] Document emergency procedures 