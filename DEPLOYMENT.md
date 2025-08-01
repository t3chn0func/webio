# Cloud Deployment Guide

## Prerequisites

### System Requirements
1. **Node.js**: Version 18.x or higher (LTS recommended)
2. **Docker**: Latest stable version
3. **Cloud platform account**: AWS, Azure, or GCP
4. **Cloud CLI tools**: Platform-specific CLI installed and configured
5. **Git**: For version control and deployment

### Pre-deployment Checklist
- [ ] All dependencies installed (`npm install`)
- [ ] Tests passing (`npm test`)
- [ ] Environment variables configured
- [ ] SSL certificates ready (for production)
- [ ] Database backup strategy in place
- [ ] Monitoring and logging configured

## Deployment Options

### 1. Docker Container (Recommended)

1. Build the Docker image:
```bash
docker build -t webrtc-sip-api .
```

2. Test locally:
```bash
docker run -p 3000:3000 --env-file .env webrtc-sip-api
```

3. Push to container registry:
```bash
# For AWS ECR
aws ecr get-login-password --region <region> | docker login --username AWS --password-stdin <aws-account-id>.dkr.ecr.<region>.amazonaws.com
docker tag webrtc-sip-api:latest <aws-account-id>.dkr.ecr.<region>.amazonaws.com/webrtc-sip-api:latest
docker push <aws-account-id>.dkr.ecr.<region>.amazonaws.com/webrtc-sip-api:latest

# For Azure Container Registry
az acr login --name <registry-name>
docker tag webrtc-sip-api:latest <registry-name>.azurecr.io/webrtc-sip-api:latest
docker push <registry-name>.azurecr.io/webrtc-sip-api:latest
```

### 2. Cloud Platform Specific Deployment

#### AWS

1. **Elastic Beanstalk**:
   - Create new application
   - Choose Docker platform
   - Upload source bundle or specify container image
   - Configure environment variables
   - Enable enhanced health monitoring
   - Set up auto-scaling

2. **ECS/Fargate**:
   - Create ECS cluster
   - Define task definition using container image
   - Create service with desired tasks
   - Configure load balancer
   - Set up service discovery

#### Azure

1. **Azure App Service**:
   - Create new Web App
   - Choose Docker Container
   - Configure container registry
   - Set environment variables
   - Enable application insights

2. **Azure Container Apps**:
   - Create container app environment
   - Deploy container image
   - Configure scaling rules
   - Set up ingress

#### Google Cloud Platform

1. **Cloud Run**:
   - Enable Cloud Run API
   - Deploy container image
   - Configure memory and CPU
   - Set environment variables
   - Configure domain mapping

## Management Interfaces

### 1. SBC Configuration UI

A web-based configuration interface is available for managing SBC settings:

1. Access the configuration UI:
```bash
http://your-domain:3000/sbc-config.html
```

### 2. Call Statistics Dashboard

A real-time dashboard for monitoring call statistics and system status:

1. Access the dashboard:
```bash
http://your-domain:3000/dashboard.html
```

2. Features:
   - Real-time call statistics
   - Call duration trends
   - Error rate monitoring
   - System alerts and notifications
   - Auto-refresh every 30 seconds

3. WebSocket Integration:
   - Real-time updates for statistics
   - Instant alert notifications
   - Automatic reconnection on connection loss

2. Available Configuration Options:
   - SBC Server Selection (Cisco CUBE, Ribbon, Oracle, Avaya, etc.)
   - Server Configuration (WebSocket URL, Domain, Proxy, Port)
   - Media Settings (Audio/Video codecs, DTMF)
   - Security Settings (TLS, DTLS, Certificate verification)
   - ICE Configuration (STUN/TURN servers)

3. Configuration Management:
   - Save configurations for different SBC types
   - Load existing configurations
   - Reset to default settings

## Environment Configuration

1. Create production environment file:
```bash
cp .env .env.production
```

2. Update production variables:
```env
NODE_ENV=production
PORT=3000
ALLOWED_ORIGINS=https://your-domain.com
API_KEY=your-secure-api-key
API_SECRET=your-secure-api-secret
SIP_DOMAIN=your-sip-domain.com
SIP_WSS_URL=wss://your-sip-domain.com:7443
```

## Security Considerations

1. **SSL/TLS**:
   - Enable HTTPS
   - Configure SSL certificates
   - Set up automatic certificate renewal

2. **Network Security**:
   - Configure firewall rules
   - Set up WAF (Web Application Firewall)
   - Enable DDoS protection

3. **Secrets Management**:
   - Use cloud platform's secret management service
   - Never commit sensitive data to version control
   - Rotate credentials regularly

## Monitoring and Logging

1. **Application Monitoring**:
   - Set up cloud platform's monitoring service
   - Configure alerts for critical metrics
   - Monitor WebRTC and SIP connection status

2. **Logging**:
   - Configure structured logging
   - Set up log retention policies
   - Enable log analysis tools

## Scaling Configuration

1. **Auto-scaling**:
   - Configure horizontal scaling rules
   - Set minimum and maximum instances
   - Define scaling metrics

2. **Load Balancing**:
   - Set up load balancer
   - Configure health checks
   - Enable SSL termination

## Backup and Disaster Recovery

1. **Backup Strategy**:
   - Regular database backups
   - Configuration backups
   - Cross-region replication

2. **Recovery Plan**:
   - Document recovery procedures
   - Test recovery process
   - Set up failover mechanisms

## Post-Deployment

1. **Verification**:
   - Test all API endpoints
   - Verify WebSocket connections
   - Check SIP integration
   - Monitor error rates

2. **Performance Testing**:
   - Load testing
   - Stress testing
   - Latency monitoring

## Maintenance

1. **Updates**:
   - Regular security updates
   - Dependency updates
   - Feature deployments

2. **Monitoring**:
   - Regular performance reviews
   - Cost optimization
   - Security audits