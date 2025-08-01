# WebRTC SIP API - Complete Deployment Guide

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Local Development Setup](#local-development-setup)
3. [Production Deployment](#production-deployment)
4. [Cloud Deployment Options](#cloud-deployment-options)
5. [Environment Configuration](#environment-configuration)
6. [Troubleshooting](#troubleshooting)
7. [Security Considerations](#security-considerations)

## Prerequisites

### System Requirements
- **Node.js**: Version 18.x or higher (LTS recommended)
- **npm**: Version 8.x or higher (comes with Node.js)
- **Operating System**: Windows 10/11, macOS 10.15+, or Linux (Ubuntu 20.04+)
- **Memory**: Minimum 2GB RAM (4GB recommended)
- **Storage**: At least 1GB free space

### Required Software
1. **Node.js & npm**
   - Download from: https://nodejs.org/
   - Choose the LTS (Long Term Support) version
   - Verify installation:
     ```bash
     node --version
     npm --version
     ```

2. **Git** (for cloning repository)
   - Download from: https://git-scm.com/
   - Verify installation:
     ```bash
     git --version
     ```

3. **Code Editor** (recommended)
   - Visual Studio Code: https://code.visualstudio.com/
   - WebStorm: https://www.jetbrains.com/webstorm/

## Local Development Setup

### Step 1: Clone the Repository
```bash
# Clone the repository
git clone <repository-url>
cd Webpage

# Or if you have the files locally, navigate to the project directory
cd path/to/Webpage
```

### Step 2: Install Dependencies
```bash
# Install all project dependencies
npm install

# Verify installation
npm list --depth=0
```

### Step 3: Environment Configuration
```bash
# Copy environment template
cp .env.example .env

# Edit the .env file with your configuration
# Use your preferred text editor
notepad .env  # Windows
# or
nano .env     # Linux/macOS
```

**Required Environment Variables:**
```env
# Server Configuration
PORT=3000
NODE_ENV=development

# CORS Configuration
ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000

# SIP Configuration (Update with your SBC details)
SIP_DOMAIN=your-sip-domain.com
SIP_WSS_URL=wss://your-sip-server.com:8089/ws
SIP_USERNAME=your_sip_username
SIP_PASSWORD=your_sip_password

# API Security
API_KEY=generate_a_secure_random_key_here
JWT_SECRET=generate_a_secure_jwt_secret_here

# Database Configuration
DB_PATH=./data/calls.db

# Logging
LOG_LEVEL=debug
LOG_FILE=./logs/app.log
```

### Step 4: Create Required Directories
```bash
# Create data and logs directories
mkdir -p data logs

# Set appropriate permissions (Linux/macOS)
chmod 755 data logs
```

### Step 5: Run Tests (Optional but Recommended)
```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage
```

### Step 6: Start Development Server
```bash
# Start in development mode with auto-reload
npm run dev

# Or start normally
npm start
```

### Step 7: Verify Installation
1. **Check Server Status**
   - Open browser: http://localhost:3000
   - Should see the Banking App UI

2. **Test API Endpoints**
   ```bash
   # Health check
   curl http://localhost:3000/api/v1/health
   
   # Should return: {"status":"ok","timestamp":"..."}
   ```

3. **Test WebSocket Connection**
   - Open browser developer tools
   - Check console for WebSocket connection logs

## Production Deployment

### Step 1: Production Environment Setup
```bash
# Set production environment
export NODE_ENV=production

# Or in .env file
NODE_ENV=production
```

### Step 2: Install Production Dependencies
```bash
# Install only production dependencies
npm ci --only=production

# Or if using npm install
npm install --production
```

### Step 3: Build and Optimize
```bash
# If you have a build script
npm run build

# Optimize for production
npm prune --production
```

### Step 4: Process Management (Recommended)

#### Option A: Using PM2 (Recommended)
```bash
# Install PM2 globally
npm install -g pm2

# Create PM2 ecosystem file
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'webrtc-sip-api',
    script: 'src/api-server.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
};
EOF

# Start with PM2
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 startup script
pm2 startup
```

#### Option B: Using systemd (Linux)
```bash
# Create systemd service file
sudo cat > /etc/systemd/system/webrtc-sip-api.service << EOF
[Unit]
Description=WebRTC SIP API Service
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/path/to/your/app
Environment=NODE_ENV=production
ExecStart=/usr/bin/node src/api-server.js
Restart=on-failure
RestartSec=10
KillMode=mixed
KillSignal=SIGTERM

[Install]
WantedBy=multi-user.target
EOF

# Enable and start service
sudo systemctl enable webrtc-sip-api
sudo systemctl start webrtc-sip-api
sudo systemctl status webrtc-sip-api
```

### Step 5: Reverse Proxy Setup (Nginx)
```bash
# Install Nginx
sudo apt update
sudo apt install nginx

# Create Nginx configuration
sudo cat > /etc/nginx/sites-available/webrtc-sip-api << EOF
server {
    listen 80;
    server_name your-domain.com;
    
    # Redirect HTTP to HTTPS
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;
    
    # SSL Configuration
    ssl_certificate /path/to/your/certificate.crt;
    ssl_certificate_key /path/to/your/private.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;
    
    # Proxy to Node.js app
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
    
    # WebSocket support
    location /api/v1/ws/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF

# Enable site
sudo ln -s /etc/nginx/sites-available/webrtc-sip-api /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## Cloud Deployment Options

### Option 1: Docker Deployment

#### Step 1: Build Docker Image
```bash
# Build the image
docker build -t webrtc-sip-api .

# Run container
docker run -d \
  --name webrtc-sip-api \
  -p 3000:3000 \
  --env-file .env \
  -v $(pwd)/data:/app/data \
  -v $(pwd)/logs:/app/logs \
  webrtc-sip-api
```

#### Step 2: Docker Compose (Recommended)
```bash
# Start with docker-compose
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Option 2: AWS Deployment

#### Using AWS ECS
```bash
# Install AWS CLI
pip install awscli

# Configure AWS credentials
aws configure

# Create ECS cluster
aws ecs create-cluster --cluster-name webrtc-sip-api-cluster

# Register task definition
aws ecs register-task-definition --cli-input-json file://cloud/aws-task-definition.json

# Create service
aws ecs create-service \
  --cluster webrtc-sip-api-cluster \
  --service-name webrtc-sip-api-service \
  --task-definition webrtc-sip-api:1 \
  --desired-count 2
```

#### Using AWS Elastic Beanstalk
```bash
# Install EB CLI
pip install awsebcli

# Initialize Elastic Beanstalk
eb init

# Create environment
eb create production

# Deploy
eb deploy
```

### Option 3: Google Cloud Platform

#### Using Cloud Run
```bash
# Install Google Cloud SDK
# Follow: https://cloud.google.com/sdk/docs/install

# Authenticate
gcloud auth login

# Set project
gcloud config set project YOUR_PROJECT_ID

# Build and deploy
gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/webrtc-sip-api
gcloud run deploy --image gcr.io/YOUR_PROJECT_ID/webrtc-sip-api --platform managed
```

### Option 4: Microsoft Azure

#### Using Container Instances
```bash
# Install Azure CLI
# Follow: https://docs.microsoft.com/en-us/cli/azure/install-azure-cli

# Login
az login

# Create resource group
az group create --name webrtc-sip-api-rg --location eastus

# Deploy container
az container create \
  --resource-group webrtc-sip-api-rg \
  --name webrtc-sip-api \
  --image webrtc-sip-api:latest \
  --dns-name-label webrtc-sip-api \
  --ports 3000
```

### Option 5: Heroku

```bash
# Install Heroku CLI
# Follow: https://devcenter.heroku.com/articles/heroku-cli

# Login
heroku login

# Create app
heroku create your-app-name

# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set SIP_DOMAIN=your-domain.com
# ... set other environment variables

# Deploy
git push heroku main
```

## Environment Configuration

### Development Environment
```env
NODE_ENV=development
PORT=3000
LOG_LEVEL=debug
ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

### Staging Environment
```env
NODE_ENV=staging
PORT=3000
LOG_LEVEL=info
ALLOWED_ORIGINS=https://staging.yourdomain.com
```

### Production Environment
```env
NODE_ENV=production
PORT=3000
LOG_LEVEL=warn
ALLOWED_ORIGINS=https://yourdomain.com
```

## Troubleshooting

### Common Issues

#### 1. Port Already in Use
```bash
# Find process using port 3000
lsof -i :3000  # macOS/Linux
netstat -ano | findstr :3000  # Windows

# Kill process
kill -9 <PID>  # macOS/Linux
taskkill /PID <PID> /F  # Windows
```

#### 2. Permission Denied
```bash
# Fix file permissions
chmod 755 src/api-server.js
chown -R $USER:$USER .
```

#### 3. Database Connection Issues
```bash
# Check database directory permissions
ls -la data/

# Recreate database
rm data/calls.db
npm start  # Will recreate database
```

#### 4. WebSocket Connection Failed
- Check firewall settings
- Verify WebSocket URL in configuration
- Check browser console for errors

#### 5. SIP Registration Failed
- Verify SIP credentials in .env
- Check SBC configuration
- Test network connectivity to SIP server

### Logging and Monitoring

#### View Logs
```bash
# Application logs
tail -f logs/combined.log

# Error logs only
tail -f logs/error.log

# PM2 logs
pm2 logs webrtc-sip-api

# Docker logs
docker logs webrtc-sip-api
```

#### Health Monitoring
```bash
# Check application health
curl http://localhost:3000/api/v1/health

# Check system resources
top
htop
df -h
```

## Security Considerations

### 1. Environment Variables
- Never commit .env files to version control
- Use strong, unique passwords and API keys
- Rotate credentials regularly

### 2. HTTPS/TLS
- Always use HTTPS in production
- Use valid SSL certificates
- Configure proper TLS settings

### 3. Firewall Configuration
```bash
# Allow only necessary ports
sudo ufw allow 22    # SSH
sudo ufw allow 80    # HTTP
sudo ufw allow 443   # HTTPS
sudo ufw enable
```

### 4. Rate Limiting
- Configure appropriate rate limits
- Monitor for suspicious activity
- Implement IP whitelisting if needed

### 5. Database Security
- Regular backups
- Encrypt sensitive data
- Limit database access

## Performance Optimization

### 1. Node.js Optimization
```bash
# Set NODE_OPTIONS for production
export NODE_OPTIONS="--max-old-space-size=4096"
```

### 2. Database Optimization
- Regular VACUUM operations for SQLite
- Index optimization
- Connection pooling

### 3. Caching
- Implement Redis for session storage
- Use CDN for static assets
- Enable gzip compression

### 4. Load Balancing
- Use multiple instances with PM2 cluster mode
- Implement sticky sessions for WebSocket
- Use external load balancer (Nginx, HAProxy)

## Backup and Recovery

### Database Backup
```bash
# Create backup script
cat > backup.sh << EOF
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
cp data/calls.db backups/calls_\$DATE.db
find backups/ -name "calls_*.db" -mtime +7 -delete
EOF

chmod +x backup.sh

# Schedule with cron
crontab -e
# Add: 0 2 * * * /path/to/backup.sh
```

### Application Backup
```bash
# Create full backup
tar -czf app_backup_$(date +%Y%m%d).tar.gz \
  --exclude=node_modules \
  --exclude=logs \
  --exclude=.git \
  .
```

## Maintenance

### Regular Tasks
1. **Update Dependencies**
   ```bash
   npm audit
   npm update
   npm audit fix
   ```

2. **Log Rotation**
   ```bash
   # Configure logrotate
   sudo cat > /etc/logrotate.d/webrtc-sip-api << EOF
   /path/to/app/logs/*.log {
       daily
       missingok
       rotate 30
       compress
       notifempty
       create 644 www-data www-data
   }
   EOF
   ```

3. **Security Updates**
   - Monitor security advisories
   - Update Node.js regularly
   - Review and update dependencies

4. **Performance Monitoring**
   - Monitor CPU and memory usage
   - Check response times
   - Review error rates

## Support and Documentation

- **Project Repository**: [Repository URL]
- **Issue Tracker**: [Issues URL]
- **Documentation**: [Docs URL]
- **API Documentation**: Available at `/api/docs` when running

For additional support, please refer to the project's README.md and create issues in the project repository.