# Claudie AI Workspace - Installation Guide

## Panduan Instalasi Lengkap untuk Ubuntu VPS

### Prasyarat
- Ubuntu Server 20.04+ 
- Minimal 2GB RAM
- Minimal 10GB storage
- Akses root atau sudo

## 1. Update System & Install Dependencies

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install Python 3.11 dan pip
sudo apt install -y python3.11 python3.11-pip python3.11-venv

# Install MongoDB
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt update
sudo apt install -y mongodb-org

# Install Yarn
npm install -g yarn

# Install Supervisor
sudo apt install -y supervisor

# Install Nginx (optional untuk production)
sudo apt install -y nginx
```

## 2. MongoDB Setup

```bash
# Start MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod

# Verify MongoDB is running
sudo systemctl status mongod

# Test MongoDB connection
mongo --eval "db.adminCommand('ismaster')"
```

## 3. Clone & Setup Application

```bash
# Clone repository (atau upload files)
cd /opt
sudo mkdir claudie-ai
sudo chown $USER:$USER claudie-ai
cd claudie-ai

# Copy all application files here
# Your file structure should be:
# /opt/claudie-ai/
# ├── backend/
# ├── frontend/
# ├── README.md
# └── install.md
```

## 4. Backend Setup

```bash
cd /opt/claudie-ai/backend

# Create Python virtual environment
python3.11 -m venv venv
source venv/bin/activate

# Install Python dependencies
pip install -r requirements.txt

# Create .env file
cat > .env << EOF
MONGO_URL="mongodb://localhost:27017"
DB_NAME="claudie_ai_production"
CORS_ORIGINS="*"
EMERGENT_LLM_KEY=your-emergent-llm-key-here
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
EOF

# Test backend
python server.py
# Should start on http://0.0.0.0:8001
# Press Ctrl+C to stop
```

## 5. Frontend Setup

```bash
cd /opt/claudie-ai/frontend

# Install dependencies
yarn install

# Create production .env
cat > .env << EOF
REACT_APP_BACKEND_URL=http://your-server-ip:8001
REACT_APP_GOOGLE_CLIENT_ID=your_google_client_id_here
EOF

# Build for production
yarn build

# Test frontend (development mode)
yarn start
# Should start on http://localhost:3000
# Press Ctrl+C to stop
```

## 6. Supervisor Configuration

```bash
# Create supervisor configs
sudo tee /etc/supervisor/conf.d/claudie-backend.conf > /dev/null << EOF
[program:claudie-backend]
command=/opt/claudie-ai/backend/venv/bin/python server.py
directory=/opt/claudie-ai/backend
user=www-data
autostart=true
autorestart=true
stderr_logfile=/var/log/claudie-backend.err.log
stdout_logfile=/var/log/claudie-backend.out.log
environment=PATH="/opt/claudie-ai/backend/venv/bin"
EOF

sudo tee /etc/supervisor/conf.d/claudie-frontend.conf > /dev/null << EOF
[program:claudie-frontend]
command=/usr/bin/yarn start
directory=/opt/claudie-ai/frontend
user=www-data
autostart=true
autorestart=true
stderr_logfile=/var/log/claudie-frontend.err.log
stdout_logfile=/var/log/claudie-frontend.out.log
environment=PATH="/usr/bin:/bin",PORT="3000"
EOF

# Reload supervisor
sudo supervisorctl reread
sudo supervisorctl update

# Start services
sudo supervisorctl start claudie-backend
sudo supervisorctl start claudie-frontend

# Check status
sudo supervisorctl status
```

## 7. Nginx Configuration (Production)

```bash
# Create Nginx config
sudo tee /etc/nginx/sites-available/claudie-ai << EOF
server {
    listen 80;
    server_name your-domain.com;  # Replace with your domain

    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:8001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

# Enable site
sudo ln -s /etc/nginx/sites-available/claudie-ai /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default

# Test and restart Nginx
sudo nginx -t
sudo systemctl restart nginx
sudo systemctl enable nginx
```

## 8. Firewall Setup

```bash
# Enable UFW
sudo ufw enable

# Allow SSH
sudo ufw allow ssh

# Allow HTTP and HTTPS
sudo ufw allow 80
sudo ufw allow 443

# For development/testing (remove in production)
sudo ufw allow 3000
sudo ufw allow 8001

# Check status
sudo ufw status
```

## 9. SSL/HTTPS Setup (Optional tapi Recommended)

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d your-domain.com

# Test auto-renewal
sudo certbot renew --dry-run
```

## 10. Environment Variables Configuration

Update your environment variables:

**Backend (.env):**
```bash
cd /opt/claudie-ai/backend
nano .env
```

```env
MONGO_URL="mongodb://localhost:27017"
DB_NAME="claudie_ai_production"
CORS_ORIGINS="https://your-domain.com"
EMERGENT_LLM_KEY=your-actual-emergent-llm-key
JWT_SECRET="your-very-secure-jwt-secret-key-minimum-32-characters"
```

**Frontend (.env):**
```bash
cd /opt/claudie-ai/frontend
nano .env
```

```env
REACT_APP_BACKEND_URL=https://your-domain.com
REACT_APP_GOOGLE_CLIENT_ID=your_google_oauth_client_id
```

## 11. Service Management Commands

```bash
# Check all services status
sudo supervisorctl status

# Restart services
sudo supervisorctl restart claudie-backend
sudo supervisorctl restart claudie-frontend

# View logs
sudo tail -f /var/log/claudie-backend.out.log
sudo tail -f /var/log/claudie-frontend.out.log

# MongoDB status
sudo systemctl status mongod

# Nginx status  
sudo systemctl status nginx
```

## 12. Monitoring & Maintenance

```bash
# Check disk usage
df -h

# Check memory usage
free -h

# Check running processes
htop

# MongoDB logs
sudo tail -f /var/log/mongodb/mongod.log

# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

## 13. Backup Strategy

```bash
# Create backup script
sudo tee /opt/claudie-ai/backup.sh << EOF
#!/bin/bash
DATE=\$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/opt/backups/claudie-ai"

# Create backup directory
mkdir -p \$BACKUP_DIR

# Backup MongoDB
mongodump --db claudie_ai_production --out \$BACKUP_DIR/mongo_\$DATE

# Backup application files
tar -czf \$BACKUP_DIR/app_\$DATE.tar.gz /opt/claudie-ai

# Keep only last 7 days of backups
find \$BACKUP_DIR -type f -mtime +7 -delete

echo "Backup completed: \$DATE"
EOF

chmod +x /opt/claudie-ai/backup.sh

# Add to crontab (daily backup at 2 AM)
(crontab -l 2>/dev/null; echo "0 2 * * * /opt/claudie-ai/backup.sh") | crontab -
```

## 14. Troubleshooting

### Backend Issues:
```bash
# Check backend logs
sudo tail -f /var/log/claudie-backend.err.log

# Test backend directly
curl http://localhost:8001/api/

# Check Python dependencies
cd /opt/claudie-ai/backend
source venv/bin/activate
pip list
```

### Frontend Issues:
```bash
# Check frontend logs
sudo tail -f /var/log/claudie-frontend.err.log

# Rebuild frontend
cd /opt/claudie-ai/frontend
yarn build

# Check Node.js version
node --version
yarn --version
```

### MongoDB Issues:
```bash
# Check MongoDB status
sudo systemctl status mongod

# Restart MongoDB
sudo systemctl restart mongod

# Check MongoDB logs
sudo tail -f /var/log/mongodb/mongod.log
```

## 15. Performance Optimization

```bash
# Enable gzip compression in Nginx
sudo nano /etc/nginx/nginx.conf

# Add inside http block:
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_types text/plain text/css text/xml text/javascript application/javascript application/json;

# Restart Nginx
sudo systemctl restart nginx
```

## 16. Security Checklist

- ✅ Change default JWT secret
- ✅ Use strong database passwords
- ✅ Enable firewall (UFW)
- ✅ Setup SSL/HTTPS
- ✅ Regular system updates
- ✅ Monitor logs for suspicious activity
- ✅ Backup regularly
- ✅ Use non-root user for applications

## Support

Jika ada masalah:
1. Cek logs di `/var/log/`
2. Pastikan semua services running
3. Verify environment variables
4. Check firewall settings
5. Verify domain DNS settings

**Service URLs:**
- Frontend: `http://your-server-ip:3000` atau `https://your-domain.com`
- Backend API: `http://your-server-ip:8001/api` atau `https://your-domain.com/api`

**Default Login:**
Buat akun baru melalui register page, tidak ada default admin account.