# Deployment Guide for WebRTC-SIP API Solution

## Prerequisites

- Node.js >= 18.0.0
- Docker and Docker Compose
- Access to cloud platforms (AWS/Azure/GCP) if deploying to cloud
- SSL certificates for secure WebSocket connections

## Local Development Setup

1. Clone the repository and install dependencies:
```bash
git clone <repository-url>
cd webrtc-sip-api
npm install
```

2. Configure environment variables:
```bash
cp .env.example .env
```

Edit `.env` file with your configuration:
```env
NODE_ENV=development
PORT=3000
API_KEY=your_api_key
API_SECRET=your_api_secret
SIP_DOMAIN=your.sip.domain
SIP_WSS_URL=wss://your.sip.domain:5061
```

3. Start the development server:
```bash
npm run dev
```

## Docker Deployment

1. Build and run using Docker Compose:
```bash
docker-compose up -d
```

2. Monitor logs:
```bash
docker-compose logs -f
```

## Cloud Deployment

### AWS ECS Fargate

1. Configure AWS CLI and authenticate:
```bash
aws configure
```

2. Create ECR repository and push image:
```bash
aws ecr create-repository --repository-name webrtc-sip-api
aws ecr get-login-password | docker login --username AWS --password-stdin $AWS_ACCOUNT.dkr.ecr.$REGION.amazonaws.com
docker build -t webrtc-sip-api .
docker tag webrtc-sip-api:latest $AWS_ACCOUNT.dkr.ecr.$REGION.amazonaws.com/webrtc-sip-api:latest
docker push $AWS_ACCOUNT.dkr.ecr.$REGION.amazonaws.com/webrtc-sip-api:latest
```

3. Deploy using task definition:
```bash
aws ecs create-cluster --cluster-name webrtc-cluster
aws ecs register-task-definition --cli-input-json file://cloud/aws-task-definition.json
aws ecs create-service --service-name webrtc-service --task-definition webrtc-sip-api --desired-count 2
```

### Azure Container Apps

1. Login to Azure:
```bash
az login
```

2. Create container app:
```bash
az containerapp create --resource-group your-rg --name webrtc-sip-api --yaml cloud/azure-container-app.yaml
```

### Google Cloud Run

1. Configure gcloud:
```bash
gcloud auth login
gcloud config set project your-project-id
```

2. Deploy to Cloud Run:
```bash
gcloud run deploy --source . --config cloud/cloudrun-service.yaml
```

## Health Monitoring

- Health check endpoint: `/health`
- Metrics endpoint: `/metrics`
- Call logs: `/api/v1/call-logs`

## Security Configuration

1. Configure API authentication:
- Use API key and secret in headers
- Enable rate limiting
- Set up CORS policies

2. SSL/TLS configuration:
- Enable HTTPS
- Configure WebSocket secure (WSS)
- Set up SSL certificates

## Scaling Configuration

1. Container scaling:
- Set resource limits (CPU/Memory)
- Configure auto-scaling rules
- Set min/max instances

2. Database scaling:
- Monitor SQLite performance
- Consider migration to managed database for high load

## Maintenance

1. Logging:
- Configure log retention
- Set up log aggregation
- Monitor error rates

2. Backup:
- Schedule regular database backups
- Store configuration backups

3. Updates:
- Regular security updates
- Dependency updates
- Version control

## Troubleshooting

1. Common issues:
- Connection timeouts
- WebSocket errors
- Database locks

2. Debug tools:
- Enable debug logging
- Use monitoring dashboards
- Check container logs

## Support

For additional support:
- Check documentation
- Review issue tracker
- Contact support team