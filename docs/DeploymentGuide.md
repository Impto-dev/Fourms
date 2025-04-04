# Deployment Guide for Forum Project on Ubuntu 22.04 with Apache

## Prerequisites
- A VPS with Ubuntu 22.04
- A domain name pointing to your VPS
- Basic command line knowledge
- SSH access to the server

## Step 1: Initial Server Setup
1. **Connect to your VPS:**
   ```bash
   ssh root@your-server-ip
   ```
2. **Update system packages:**
   ```bash
   apt update && apt upgrade -y
   ```
3. **Create a new user:**
   ```bash
   adduser deployer
   usermod -aG sudo deployer
   ```
4. **Configure SSH:**
   - Edit the SSH configuration file:
     ```bash
     nano /etc/ssh/sshd_config
     ```
   - Disable root login and password authentication:
     ```
     PermitRootLogin no
     PasswordAuthentication no
     ```
   - Restart SSH service:
     ```bash
     systemctl restart ssh
     ```
5. **Set up a firewall:**
   ```bash
   ufw allow OpenSSH
   ufw enable
   ```

## Step 2: Install Required Software
1. **Install Node.js and npm:**
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_16.x | bash -
   apt install -y nodejs
   ```
2. **Install MongoDB:**
   ```bash
   apt install -y mongodb
   systemctl start mongodb
   systemctl enable mongodb
   ```
3. **Install Redis:**
   ```bash
   apt install -y redis-server
   systemctl enable redis-server
   ```
4. **Install Apache:**
   ```bash
   apt install -y apache2
   ```
5. **Install PM2:**
   ```bash
   npm install pm2@latest -g
   ```

## Step 3: Configure Apache
1. **Enable necessary modules:**
   ```bash
   a2enmod proxy proxy_http rewrite headers ssl
   ```
2. **Create a virtual host file:**
   ```bash
   nano /etc/apache2/sites-available/forum.conf
   ```
3. **Add the following configuration:**
   ```apache
   <VirtualHost *:80>
       ServerName your-domain.com
       DocumentRoot /var/www/forum-project/frontend/build

       ProxyPass /api http://localhost:5000/api
       ProxyPassReverse /api http://localhost:5000/api

       <Directory /var/www/forum-project/frontend/build>
           Options Indexes FollowSymLinks
           AllowOverride All
           Require all granted
       </Directory>

       ErrorLog ${APACHE_LOG_DIR}/error.log
       CustomLog ${APACHE_LOG_DIR}/access.log combined
   </VirtualHost>
   ```
4. **Enable the site and restart Apache:**
   ```bash
   a2ensite forum.conf
   systemctl restart apache2
   ```

## Step 4: Deploy Application
1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-repo/forum-project.git /var/www/forum-project
   ```
2. **Install backend dependencies and build:**
   ```bash
   cd /var/www/forum-project/backend
   npm install
   npm run build
   ```
3. **Install frontend dependencies and build:**
   ```bash
   cd /var/www/forum-project/frontend
   npm install
   npm run build
   ```
4. **Start the backend with PM2:**
   ```bash
   pm2 start dist/index.js --name forum-backend
   pm2 save
   pm2 startup
   ```

## Step 5: Secure the Server
1. **Install Certbot for SSL:**
   ```bash
   apt install -y certbot python3-certbot-apache
   certbot --apache -d your-domain.com
   ```
2. **Set up automatic renewal:**
   ```bash
   echo "0 0 * * * /usr/bin/certbot renew --quiet" | crontab -
   ```

## Step 6: Monitoring and Maintenance
1. **Set up log rotation:**
   ```bash
   nano /etc/logrotate.d/forum
   ```
2. **Add the following configuration:**
   ```
   /var/log/apache2/*.log {
       daily
       missingok
       rotate 14
       compress
       delaycompress
       notifempty
       create 640 root adm
       sharedscripts
       postrotate
           /etc/init.d/apache2 reload > /dev/null
       endscript
   }
   ```
3. **Regularly update your system:**
   ```bash
   apt update && apt upgrade -y
   ``` 