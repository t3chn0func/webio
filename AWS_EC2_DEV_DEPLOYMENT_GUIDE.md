# AWS EC2 Development Deployment Guide

## WebRTC SIP API - Development Environment Setup

This guide provides step-by-step instructions for deploying the WebRTC SIP API application on AWS EC2 for **development purposes only**. This setup prioritizes simplicity and quick deployment over production-grade security and performance.

## Prerequisites

- AWS Account with EC2 access
- Basic knowledge of Linux commands
- SSH client (PuTTY for Windows, Terminal for Mac/Linux)

## Step 1: Launch EC2 Instance

### 1.1 Create EC2 Instance
1. Log into AWS Console
2. Navigate to EC2 Dashboard
3. Click "Launch Instance"
4. Configure instance:
   - **Name**: `webrtc-sip-api-dev`
   - **AMI**: Amazon Linux 2023
   - **Instance Type**: `t3.micro` (Free tier eligible)
   - **Key Pair**: Create new or select existing
   - **Security Group**: Create new with following rules:

### 1.2 Security Group Rules (Development)
```
Type            Protocol    Port Range    Source
SSH             TCP         22           0.0.0.0/0 (Your IP recommended)
HTTP            TCP         80           0.0.0.0/0
HTTPS           TCP         443          0.0.0.0/0
Custom TCP      TCP         3000         0.0.0.0/0 (App port)
Custom TCP      TCP         8080         0.0.0.0/0 (Alt port)
Custom TCP      TCP         8089         0.0.0.0/0 (WebSocket)
```

**Note**: For development, we're allowing broader access. In production, restrict sources to specific IPs.

## Step 2: Connect to Instance

### 2.1 SSH Connection
```bash
# Replace with your key file and instance IP
ssh -i "your-key.pem" ec2-user@your-instance-ip
```

### 2.2 Update System
```bash
sudo dnf update -y
```

## Step 3: Install Dependencies

### 3.1 Install Node.js
```bash
# Install Node.js 18.x
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo dnf install -y nodejs

# Verify installation
node --version
npm --version
```

### 3.2 Install Git
```bash
sudo dnf install -y git
```

### 3.3 Install Redis (Optional for development)
```bash
# Install Redis for session management
sudo dnf install -y redis6
sudo systemctl start redis6
sudo systemctl enable redis6

# Verify Redis
redis-cli ping
```

### 3.4 Install PM2 (Process Manager)
```bash
npm install -g pm2
```

## Step 4: Deploy Application

### 4.1 Clone Repository
```bash
# Navigate to home directory
cd /home/ec2-user

# Clone your repository (replace with your repo URL)
git clone https://github.com/your-username/webrtc-sip-api.git
cd webrtc-sip-api
```

### 4.2 Install Dependencies
```bash
npm install
```

### 4.3 Configure Environment
```bash
# Copy environment template
cp .env.example .env

# Edit environment variables
nano .env
```

### 4.4 Environment Configuration (.env)
```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Security (Development settings)
ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000,http://your-ec2-ip:3000
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=1000

# SIP Configuration
SIP_DOMAIN=your-ec2-ip
SIP_WSS_URL=ws://your-ec2-ip:8089/ws
SIP_USERNAME=your_dev_username
SIP_PASSWORD=your_dev_password

# Database (if using)
REDIS_URL=redis://localhost:6379

# Logging
LOG_LEVEL=debug
LOG_TO_FILE=true
```

## Step 5: Start Application (Development Mode)

### 5.1 Direct Node.js (for testing)
```bash
# Start in development mode
npm run dev

# Or start normally
node server.js
```

### 5.2 Using PM2 (recommended)
```bash
# Start with PM2
pm2 start server.js --name "webrtc-dev"

# View logs
pm2 logs webrtc-dev

# Monitor
pm2 monit

# Restart
pm2 restart webrtc-dev

# Stop
pm2 stop webrtc-dev
```

## Step 6: Access Application

### 6.1 Direct Access (No Nginx)
```
http://your-ec2-public-ip:3000
```

### 6.2 Test API Health
```bash
curl http://your-ec2-public-ip:3000/api/v1/health
```

## Step 7: Development Tools Setup

### 7.1 Install Development Utilities
```bash
# Install useful development tools
sudo dnf install -y htop tree wget curl vim

# Install netstat for port monitoring
sudo dnf install -y net-tools
```

### 7.2 Monitor Application
```bash
# Check running processes
ps aux | grep node

# Check port usage
netstat -tlnp | grep :3000

# Monitor system resources
htop
```

## Step 8: Quick Development Commands

### 8.1 Application Management
```bash
# Pull latest changes
git pull origin main

# Restart application
pm2 restart webrtc-dev

# View real-time logs
pm2 logs webrtc-dev --lines 50

# Check application status
pm2 status
```

### 8.2 Debugging
```bash
# Check if port is open
sudo firewall-cmd --list-all

# Test internal connectivity
curl http://localhost:3000/api/v1/health

# Check Redis connection
redis-cli ping

# View system logs
sudo journalctl -u redis6 -f
```

## Step 9: File Transfer (Development)

### 9.1 SCP for File Transfer
```bash
# Upload files to EC2
scp -i "your-key.pem" local-file.js ec2-user@your-ec2-ip:/home/ec2-user/webrtc-sip-api/

# Download files from EC2
scp -i "your-key.pem" ec2-user@your-ec2-ip:/home/ec2-user/webrtc-sip-api/logs/app.log ./
```

### 9.2 VS Code Remote Development
```bash
# Install Remote-SSH extension in VS Code
# Connect to: ec2-user@your-ec2-ip
# Use your .pem key for authentication
```

## Step 10: Development-Specific Configurations

### 10.1 Enable Debug Logging
```javascript
// In server.js or api-server.js
if (process.env.NODE_ENV === 'development') {
    app.use((req, res, next) => {
        console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
        next();
    });
}
```

### 10.2 Hot Reload Setup (Optional)
```bash
# Install nodemon for development
npm install -g nodemon

# Start with auto-reload
nodemon server.js

# Or add to package.json scripts
# "dev": "nodemon server.js"
```

## Troubleshooting

### Common Issues

1. **Port 3000 not accessible**
   ```bash
   # Check if application is running
   pm2 status
   
   # Check if port is listening
   netstat -tlnp | grep :3000
   
   # Check security group rules in AWS Console
   ```

2. **Redis connection failed**
   ```bash
   # Check Redis status
   sudo systemctl status redis6
   
   # Restart Redis
   sudo systemctl restart redis6
   ```

3. **Application crashes**
   ```bash
   # Check PM2 logs
   pm2 logs webrtc-dev
   
   # Check system logs
   sudo journalctl -f
   ```

4. **Permission issues**
   ```bash
   # Fix file permissions
   sudo chown -R ec2-user:ec2-user /home/ec2-user/webrtc-sip-api
   chmod +x server.js
   ```

## Development Best Practices

### 1. Version Control
```bash
# Always work on feature branches
git checkout -b feature/new-feature

# Commit frequently
git add .
git commit -m "Add new feature"

# Push to remote
git push origin feature/new-feature
```

### 2. Environment Management
- Keep `.env` file out of version control
- Use different configurations for dev/staging/prod
- Document all environment variables

### 3. Monitoring
```bash
# Set up log rotation
sudo logrotate -d /etc/logrotate.conf

# Monitor disk space
df -h

# Monitor memory usage
free -h
```

## Quick Reference

### Essential Commands
```bash
# Application
pm2 restart webrtc-dev
pm2 logs webrtc-dev
pm2 monit

# System
sudo systemctl status redis6
netstat -tlnp | grep :3000
htop

# Git
git pull origin main
git status
git log --oneline -10

# Files
tail -f logs/app.log
ls -la
du -sh *
```

### Useful Aliases (Add to ~/.bashrc)
```bash
alias ll='ls -la'
alias pm2logs='pm2 logs webrtc-dev'
alias pm2restart='pm2 restart webrtc-dev'
alias appdir='cd /home/ec2-user/webrtc-sip-api'
alias checkport='netstat -tlnp | grep :3000'
```

## Security Notes for Development

⚠️ **Important**: This guide is for development environments only. For production:

- Use proper SSL certificates
- Implement proper authentication
- Restrict security group access
- Use environment-specific configurations
- Enable CloudWatch monitoring
- Set up proper backup strategies
- Use IAM roles instead of access keys

## Next Steps

1. Set up automated deployments with GitHub Actions
2. Configure staging environment
3. Implement proper logging and monitoring
4. Set up database backups
5. Plan production deployment strategy

---

**Development Instance Details:**
- Instance Type: t3.micro
- OS: Amazon Linux 2023
- Node.js: 18.x
- PM2: Latest
- Redis: 6.x
- Access: HTTP (Port 3000)

For production deployment, refer to the main AWS EC2 deployment guide with proper security configurations.