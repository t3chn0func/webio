# AWS EC2 UI Deployment Guide

## Complete Guide for Deploying WebRTC SIP API on Amazon EC2 using AWS Management Console

### Table of Contents
1. [Prerequisites](#prerequisites)
2. [Step 1: Launch EC2 Instance](#step-1-launch-ec2-instance)
3. [Step 2: Configure Security Groups](#step-2-configure-security-groups)
4. [Step 3: Connect to Your Instance](#step-3-connect-to-your-instance)
5. [Step 4: Install Dependencies](#step-4-install-dependencies)
6. [Step 5: Deploy Application](#step-5-deploy-application)
7. [Step 6: Configure Load Balancer](#step-6-configure-load-balancer)
8. [Step 7: Set Up Auto Scaling](#step-7-set-up-auto-scaling)
9. [Step 8: Configure Monitoring](#step-8-configure-monitoring)
10. [Step 9: Set Up SSL Certificate](#step-9-set-up-ssl-certificate)
11. [Troubleshooting](#troubleshooting)
12. [Best Practices](#best-practices)

---

## Prerequisites

### Required Items
- AWS Account with appropriate permissions
- Domain name (for SSL certificate)
- Basic understanding of web applications
- SSH client (PuTTY for Windows, Terminal for Mac/Linux)

### AWS Permissions Needed
- EC2 Full Access
- VPC Full Access
- IAM Read Access
- CloudWatch Read Access
- Certificate Manager Access
- Elastic Load Balancing Full Access

---

## Step 1: Launch EC2 Instance

### 1.1 Access EC2 Dashboard
1. Log in to [AWS Management Console](https://aws.amazon.com/console/)
2. Search for "EC2" in the services search bar
3. Click on "EC2" to open the EC2 Dashboard

### 1.2 Launch Instance
1. Click the **"Launch Instance"** button
2. Enter instance name: `webrtc-sip-api-server`

### 1.3 Choose AMI (Amazon Machine Image)
1. Select **"Amazon Linux 2023 AMI"** (Free tier eligible)
2. Architecture: **64-bit (x86)**

### 1.4 Choose Instance Type
1. Select **"t3.medium"** for production or **"t2.micro"** for testing
2. For production workloads, consider:
   - **t3.large** (2 vCPUs, 8 GB RAM)
   - **c5.large** (2 vCPUs, 4 GB RAM) for CPU-intensive tasks

### 1.5 Key Pair Configuration
1. Click **"Create new key pair"**
2. Key pair name: `webrtc-sip-api-key`
3. Key pair type: **RSA**
4. Private key file format: **`.pem`** (for SSH) or **`.ppk`** (for PuTTY)
5. Click **"Create key pair"**
6. **Important**: Download and save the key file securely

### 1.6 Network Settings
1. Click **"Edit"** next to Network settings
2. VPC: Select default VPC or create new one
3. Subnet: Choose a public subnet
4. Auto-assign public IP: **Enable**
5. Firewall (security groups): **Create security group**
   - Security group name: `webrtc-sip-api-sg`
   - Description: `Security group for WebRTC SIP API`

### 1.7 Configure Storage
1. Root volume:
   - Size: **20 GB** (minimum)
   - Volume type: **gp3** (General Purpose SSD)
   - IOPS: **3000**
   - Throughput: **125 MB/s**
2. Click **"Add new volume"** for application data:
   - Size: **10 GB**
   - Volume type: **gp3**
   - Mount point: `/data`

### 1.8 Advanced Details
1. Expand **"Advanced details"**
2. IAM instance profile: Create or select appropriate role
3. User data script (optional):
```bash
#!/bin/bash
yum update -y
yum install -y docker git
systemctl start docker
systemctl enable docker
usermod -a -G docker ec2-user
```

### 1.9 Launch Instance
1. Review all settings in the **Summary** panel
2. Click **"Launch instance"**
3. Wait for instance to reach **"Running"** state (2-3 minutes)

---

## Step 2: Configure Security Groups

### 2.1 Access Security Groups
1. In EC2 Dashboard, click **"Security Groups"** in the left sidebar
2. Find your security group: `webrtc-sip-api-sg`
3. Click on the security group ID

### 2.2 Configure Inbound Rules
1. Click **"Edit inbound rules"**
2. Add the following rules:

| Type | Protocol | Port Range | Source | Description |
|------|----------|------------|--------|--------------|
| SSH | TCP | 22 | My IP | SSH access |
| HTTP | TCP | 80 | 0.0.0.0/0 | HTTP traffic |
| HTTPS | TCP | 443 | 0.0.0.0/0 | HTTPS traffic |
| Custom TCP | TCP | 3000 | 0.0.0.0/0 | Node.js app |
| Custom TCP | TCP | 8080 | 0.0.0.0/0 | WebSocket |
| Custom UDP | UDP | 10000-20000 | 0.0.0.0/0 | RTP media |
| Custom TCP | TCP | 5060 | 0.0.0.0/0 | SIP signaling |
| Custom TCP | TCP | 5061 | 0.0.0.0/0 | SIP TLS |

3. Click **"Save rules"**

### 2.3 Configure Outbound Rules
1. Click **"Edit outbound rules"**
2. Ensure **"All traffic"** to **"0.0.0.0/0"** is allowed
3. Click **"Save rules"**

---

## Step 3: Connect to Your Instance

### 3.1 Get Connection Information
1. Select your instance in the EC2 Dashboard
2. Click **"Connect"**
3. Note the **Public IPv4 address**

### 3.2 Connect via SSH (Linux/Mac)
```bash
# Make key file secure
chmod 400 webrtc-sip-api-key.pem

# Connect to instance
ssh -i "webrtc-sip-api-key.pem" ec2-user@YOUR_PUBLIC_IP
```

### 3.3 Connect via PuTTY (Windows)
1. Open PuTTY
2. Host Name: `ec2-user@YOUR_PUBLIC_IP`
3. Port: `22`
4. Connection type: `SSH`
5. In left panel: **Connection > SSH > Auth > Credentials**
6. Browse and select your `.ppk` key file
7. Click **"Open"**

### 3.4 Connect via AWS Session Manager (Browser)
1. Select your instance
2. Click **"Connect"**
3. Choose **"Session Manager"** tab
4. Click **"Connect"**

---

## Step 4: Install Dependencies

### 4.1 Update System
```bash
sudo yum update -y
```

### 4.2 Install Node.js
```bash
# Install Node.js 18.x
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs

# Verify installation
node --version
npm --version
```

### 4.3 Install Git
```bash
sudo yum install -y git
```

### 4.4 Install PM2 (Process Manager)
```bash
sudo npm install -g pm2
```

### 4.5 Install Nginx
```bash
sudo yum install -y nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

### 4.6 Install Redis
```bash
sudo yum install -y redis6
sudo systemctl start redis6
sudo systemctl enable redis6
```

### 4.7 Install Docker (Optional)
```bash
sudo yum install -y docker
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -a -G docker ec2-user
```

---

## Step 5: Deploy Application

### 5.1 Create Application Directory
```bash
sudo mkdir -p /opt/webrtc-sip-api
sudo chown ec2-user:ec2-user /opt/webrtc-sip-api
cd /opt/webrtc-sip-api
```

### 5.2 Clone Repository
```bash
# Replace with your actual repository URL
git clone https://github.com/your-username/webrtc-sip-api.git .
```

### 5.3 Install Dependencies
```bash
npm install --production
```

### 5.4 Configure Environment
```bash
# Copy environment template
cp .env.example .env

# Edit environment variables
nano .env
```

**Required Environment Variables:**
```env
NODE_ENV=production
PORT=3000
WEBSOCKET_PORT=8080
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-super-secret-jwt-key
SIP_SERVER_HOST=your-sip-server.com
SIP_SERVER_PORT=5060
STUN_SERVER=stun:stun.l.google.com:19302
TURN_SERVER=turn:your-turn-server.com:3478
TURN_USERNAME=your-turn-username
TURN_PASSWORD=your-turn-password
LOG_LEVEL=info
DB_ENCRYPTION_KEY=your-32-character-encryption-key
```

### 5.5 Create PM2 Ecosystem File
```bash
nano ecosystem.config.js
```

```javascript
module.exports = {
  apps: [{
    name: 'webrtc-sip-api',
    script: 'server.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: '/var/log/webrtc-sip-api/error.log',
    out_file: '/var/log/webrtc-sip-api/out.log',
    log_file: '/var/log/webrtc-sip-api/combined.log',
    time: true,
    max_memory_restart: '1G',
    node_args: '--max-old-space-size=1024'
  }]
};
```

### 5.6 Create Log Directory
```bash
sudo mkdir -p /var/log/webrtc-sip-api
sudo chown ec2-user:ec2-user /var/log/webrtc-sip-api
```

### 5.7 Start Application
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### 5.8 Configure Nginx Reverse Proxy
```bash
sudo nano /etc/nginx/conf.d/webrtc-sip-api.conf
```

```nginx
upstream webrtc_api {
    server 127.0.0.1:3000;
}

upstream webrtc_websocket {
    server 127.0.0.1:8080;
}

server {
    listen 80;
    server_name ec2-52-221-184-153.ap-southeast-1.compute.amazonaws.com;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name ec2-54-255-190-212.ap-southeast-1.compute.amazonaws.com;
    
    # SSL Configuration (will be updated after certificate setup)
    ssl_certificate /etc/ssl/certs/your-domain.crt;
    ssl_certificate_key /etc/ssl/private/your-domain.key;
    
    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains";
    
    # API endpoints
    location /api/ {
        proxy_pass http://webrtc_api;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    # WebSocket endpoint
    location /ws {
        proxy_pass http://webrtc_websocket;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Static files
    location / {
        proxy_pass http://webrtc_api;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 5.9 Test Nginx Configuration
```bash
sudo nginx -t
sudo systemctl reload nginx
```

---

## Step 6: Configure Load Balancer

### 6.1 Create Application Load Balancer
1. In EC2 Dashboard, click **"Load Balancers"** in left sidebar
2. Click **"Create Load Balancer"**
3. Choose **"Application Load Balancer"**
4. Configure basic settings:
   - Name: `webrtc-sip-api-alb`
   - Scheme: **Internet-facing**
   - IP address type: **IPv4**

### 6.2 Configure Network Mapping
1. VPC: Select your VPC
2. Mappings: Select at least 2 Availability Zones
3. For each AZ, select a public subnet

### 6.3 Configure Security Groups
1. Create new security group: `webrtc-alb-sg`
2. Add inbound rules:
   - HTTP (80) from 0.0.0.0/0
   - HTTPS (443) from 0.0.0.0/0

### 6.4 Configure Listeners and Routing
1. **HTTP Listener (Port 80)**:
   - Default action: Redirect to HTTPS
   - Status code: 301
   - Port: 443
   - Protocol: HTTPS

2. **HTTPS Listener (Port 443)**:
   - Create new target group:
     - Name: `webrtc-sip-api-tg`
     - Protocol: HTTP
     - Port: 80
     - VPC: Your VPC
     - Health check path: `/health`

### 6.5 Register Targets
1. Select your EC2 instance
2. Port: 80
3. Click **"Include as pending below"**
4. Click **"Create target group"**

### 6.6 Create Load Balancer
1. Review all settings
2. Click **"Create load balancer"**
3. Wait for state to become **"Active"** (5-10 minutes)

---

## Step 7: Set Up Auto Scaling

### 7.1 Create Launch Template
1. In EC2 Dashboard, click **"Launch Templates"**
2. Click **"Create launch template"**
3. Configure template:
   - Name: `webrtc-sip-api-template`
   - AMI: Same as your current instance
   - Instance type: t3.medium
   - Key pair: webrtc-sip-api-key
   - Security groups: webrtc-sip-api-sg

### 7.2 Add User Data Script
```bash
#!/bin/bash
yum update -y

# Install Node.js
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
yum install -y nodejs git nginx redis6

# Install PM2
npm install -g pm2

# Start services
systemctl start nginx redis6
systemctl enable nginx redis6

# Clone and deploy application
cd /opt
git clone https://github.com/your-username/webrtc-sip-api.git
cd webrtc-sip-api
npm install --production

# Copy environment file
cp .env.example .env

# Start application
pm2 start ecosystem.config.js
pm2 save
pm2 startup

# Configure nginx
cp nginx.conf /etc/nginx/conf.d/webrtc-sip-api.conf
nginx -t && systemctl reload nginx
```

### 7.3 Create Auto Scaling Group
1. Click **"Auto Scaling Groups"** in left sidebar
2. Click **"Create Auto Scaling group"**
3. Configure:
   - Name: `webrtc-sip-api-asg`
   - Launch template: webrtc-sip-api-template
   - VPC: Your VPC
   - Subnets: Select multiple AZs
   - Load balancing: Attach to existing load balancer
   - Target group: webrtc-sip-api-tg

### 7.4 Configure Group Size
- Desired capacity: 2
- Minimum capacity: 1
- Maximum capacity: 5

### 7.5 Configure Scaling Policies
1. **Scale Out Policy**:
   - Metric: Average CPU Utilization
   - Target value: 70%
   - Scale out cooldown: 300 seconds

2. **Scale In Policy**:
   - Metric: Average CPU Utilization
   - Target value: 30%
   - Scale in cooldown: 300 seconds

---

## Step 8: Configure Monitoring

### 8.1 Enable CloudWatch Monitoring
1. In EC2 Dashboard, select your instance
2. Click **"Actions" > "Monitor and troubleshoot" > "Manage detailed monitoring"**
3. Enable **"Detailed monitoring"**

### 8.2 Create CloudWatch Dashboard
1. Go to CloudWatch service
2. Click **"Dashboards"** in left sidebar
3. Click **"Create dashboard"**
4. Name: `WebRTC-SIP-API-Dashboard`

### 8.3 Add Widgets
1. **CPU Utilization**:
   - Widget type: Line
   - Metric: EC2 > Per-Instance Metrics > CPUUtilization
   - Instance: Your instance ID

2. **Memory Utilization**:
   - Widget type: Line
   - Metric: CWAgent > InstanceId > mem_used_percent

3. **Network Traffic**:
   - Widget type: Line
   - Metrics: NetworkIn, NetworkOut

4. **Application Logs**:
   - Widget type: Logs table
   - Log group: /aws/ec2/webrtc-sip-api

### 8.4 Set Up Alarms
1. **High CPU Alarm**:
   - Metric: CPUUtilization
   - Threshold: > 80% for 2 consecutive periods
   - Action: Send SNS notification

2. **Low Disk Space Alarm**:
   - Metric: DiskSpaceUtilization
   - Threshold: > 85%
   - Action: Send SNS notification

3. **Application Health Alarm**:
   - Metric: TargetResponseTime
   - Threshold: > 5 seconds
   - Action: Send SNS notification

---

## Step 9: Set Up SSL Certificate

### 9.1 Request SSL Certificate
1. Go to **Certificate Manager** service
2. Click **"Request a certificate"**
3. Choose **"Request a public certificate"**
4. Domain names:
   - `ec2-52-221-184-153.ap-southeast-1.compute.amazonaws.com`
5. Validation method: **DNS validation**
6. Click **"Request"**

### 9.2 Validate Domain
1. Click on your certificate
2. For each domain, click **"Create record in Route 53"**
3. Wait for validation (5-30 minutes)

### 9.3 Update Load Balancer
1. Go back to Load Balancers
2. Select your ALB
3. Click **"Listeners"** tab
4. Edit HTTPS listener
5. Default SSL certificate: Choose your certificate
6. Save changes

### 9.4 Update DNS Records
1. Go to **Route 53** service
2. Click on your hosted zone
3. Create **A record**:
   - Name: ec2-52-221-184-153.ap-southeast-1.compute.amazonaws.com
   - Type: A
   - Alias: Yes
   - Alias target: Your ALB
4. Create **CNAME record**:
   - Name: www.ec2-52-221-184-153.ap-southeast-1.compute.amazonaws.com
- Type: CNAME
- Value: ec2-52-221-184-153.ap-southeast-1.compute.amazonaws.com

---

## Troubleshooting

### Common Issues

#### 1. Cannot Connect to Instance
**Symptoms**: SSH connection timeout
**Solutions**:
- Check security group allows SSH (port 22) from your IP
- Verify instance is in "running" state
- Ensure you're using correct key file
- Check if instance has public IP assigned

#### 2. Application Not Starting
**Symptoms**: PM2 shows app as "errored"
**Solutions**:
```bash
# Check PM2 logs
pm2 logs webrtc-sip-api

# Check application logs
tail -f /var/log/webrtc-sip-api/error.log

# Restart application
pm2 restart webrtc-sip-api

# Check environment variables
cat .env
```

#### 3. Load Balancer Health Check Failing
**Symptoms**: Targets showing as "unhealthy"
**Solutions**:
- Verify health check path `/health` returns 200
- Check security group allows traffic from ALB
- Ensure application is running on correct port
- Review target group health check settings

#### 4. SSL Certificate Issues
**Symptoms**: Browser shows "Not Secure"
**Solutions**:
- Verify certificate is validated and issued
- Check ALB listener configuration
- Ensure DNS points to ALB
- Clear browser cache

#### 5. High Memory Usage
**Symptoms**: Instance running out of memory
**Solutions**:
```bash
# Check memory usage
free -h
top

# Restart PM2 processes
pm2 restart all

# Increase instance size if needed
# Stop instance, change instance type, start instance
```

### Monitoring Commands

```bash
# Check application status
pm2 status
pm2 monit

# Check system resources
top
htop
df -h
free -h

# Check logs
tail -f /var/log/webrtc-sip-api/combined.log
journalctl -u nginx -f
journalctl -u redis -f

# Check network connections
netstat -tulpn
ss -tulpn

# Check processes
ps aux | grep node
ps aux | grep nginx
```

---

## Best Practices

### Security
1. **Regular Updates**:
   ```bash
   sudo yum update -y
   npm audit fix
   ```

2. **Firewall Configuration**:
   - Use security groups as primary firewall
   - Implement least privilege principle
   - Regular security group audits

3. **Key Management**:
   - Store SSH keys securely
   - Rotate keys regularly
   - Use IAM roles instead of access keys

4. **SSL/TLS**:
   - Use strong cipher suites
   - Enable HSTS headers
   - Regular certificate renewal

### Performance
1. **Instance Sizing**:
   - Monitor CPU and memory usage
   - Scale vertically or horizontally as needed
   - Use appropriate instance types

2. **Caching**:
   - Implement Redis caching
   - Use CloudFront CDN
   - Enable Nginx caching

3. **Database Optimization**:
   - Use RDS for production databases
   - Implement connection pooling
   - Regular database maintenance

### Backup and Recovery
1. **EBS Snapshots**:
   - Schedule daily snapshots
   - Test restore procedures
   - Cross-region backup for DR

2. **Application Backup**:
   ```bash
   # Create backup script
   #!/bin/bash
   DATE=$(date +%Y%m%d_%H%M%S)
   tar -czf /backup/webrtc-sip-api_$DATE.tar.gz /opt/webrtc-sip-api
   aws s3 cp /backup/webrtc-sip-api_$DATE.tar.gz s3://your-backup-bucket/
   ```

3. **Database Backup**:
   - Use RDS automated backups
   - Export configuration regularly
   - Test restore procedures

### Cost Optimization
1. **Right-sizing**:
   - Use AWS Compute Optimizer
   - Monitor unused resources
   - Schedule non-production instances

2. **Reserved Instances**:
   - Purchase RIs for predictable workloads
   - Use Savings Plans
   - Monitor RI utilization

3. **Storage Optimization**:
   - Use appropriate EBS volume types
   - Clean up old snapshots
   - Implement lifecycle policies

---

## Quick Reference

### Important URLs
- **AWS Console**: https://aws.amazon.com/console/
- **EC2 Dashboard**: https://console.aws.amazon.com/ec2/
- **CloudWatch**: https://console.aws.amazon.com/cloudwatch/
- **Certificate Manager**: https://console.aws.amazon.com/acm/
- **Route 53**: https://console.aws.amazon.com/route53/

### Key Commands
```bash
# Application management
pm2 start ecosystem.config.js
pm2 stop webrtc-sip-api
pm2 restart webrtc-sip-api
pm2 logs webrtc-sip-api
pm2 monit

# System monitoring
top
htop
df -h
free -h
netstat -tulpn

# Service management
sudo systemctl status nginx
sudo systemctl restart nginx
sudo systemctl status redis6
sudo systemctl restart redis6

# Log viewing
tail -f /var/log/webrtc-sip-api/combined.log
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### Support Resources
- **AWS Documentation**: https://docs.aws.amazon.com/
- **AWS Support**: https://aws.amazon.com/support/
- **AWS Forums**: https://forums.aws.amazon.com/
- **AWS Status**: https://status.aws.amazon.com/

---

**Note**: Replace placeholder values (repository URLs, etc.) with your actual values before deployment. Domain has been updated to use EC2 public DNS: ec2-52-221-184-153.ap-southeast-1.compute.amazonaws.com

This guide provides a complete production-ready deployment of the WebRTC SIP API on AWS EC2 using only the AWS Management Console UI.