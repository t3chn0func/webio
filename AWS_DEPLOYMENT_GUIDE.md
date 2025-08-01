# WebRTC SIP API - AWS Deployment Guide

This comprehensive guide covers deploying the WebRTC SIP API on Amazon Web Services (AWS) using various services and deployment methods.

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [AWS Services Overview](#aws-services-overview)
3. [Deployment Methods](#deployment-methods)
4. [Elastic Beanstalk Deployment](#elastic-beanstalk-deployment)
5. [ECS/Fargate Deployment](#ecsfargate-deployment)
6. [EKS (Kubernetes) Deployment](#eks-kubernetes-deployment)
7. [EC2 Instance Deployment](#ec2-instance-deployment)
8. [Lambda + API Gateway (Serverless)](#lambda--api-gateway-serverless)
9. [AWS App Runner](#aws-app-runner)
10. [Infrastructure as Code](#infrastructure-as-code)
11. [Monitoring and Logging](#monitoring-and-logging)
12. [Security Configuration](#security-configuration)
13. [Cost Optimization](#cost-optimization)
14. [Troubleshooting](#troubleshooting)

## Prerequisites

### AWS Account Setup
- Active AWS account with appropriate permissions
- AWS CLI installed and configured
- AWS CDK or Terraform (for IaC deployments)
- Docker installed (for container deployments)

### Required AWS Permissions
```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "elasticbeanstalk:*",
                "ecs:*",
                "eks:*",
                "ec2:*",
                "iam:*",
                "logs:*",
                "cloudformation:*",
                "s3:*",
                "rds:*",
                "elasticache:*",
                "route53:*",
                "acm:*",
                "cloudfront:*"
            ],
            "Resource": "*"
        }
    ]
}
```

### Install AWS CLI
```bash
# Install AWS CLI v2
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install

# Configure AWS CLI
aws configure
# Enter your Access Key ID, Secret Access Key, Region, and Output format
```

## AWS Services Overview

| Service | Use Case | Complexity | Cost | Scalability |
|---------|----------|------------|------|-------------|
| **Elastic Beanstalk** | Quick deployment, managed platform | Low | Medium | High |
| **ECS/Fargate** | Container orchestration, serverless containers | Medium | Medium | Very High |
| **EKS** | Kubernetes, complex microservices | High | High | Very High |
| **EC2** | Full control, custom configurations | Medium | Low-High | High |
| **Lambda + API Gateway** | Serverless, event-driven | Medium | Low | Auto |
| **App Runner** | Simple container deployment | Low | Medium | High |

## Deployment Methods

### Method 1: Elastic Beanstalk Deployment

**Best for**: Quick deployment, managed infrastructure, automatic scaling

#### Step 1: Prepare Application
```bash
# Create deployment package
zip -r webrtc-sip-api.zip . -x "*.git*" "node_modules/*" "logs/*" "data/*"
```

#### Step 2: Create Elastic Beanstalk Application
```bash
# Create application
aws elasticbeanstalk create-application \
    --application-name webrtc-sip-api \
    --description "WebRTC SIP API Application"

# Create application version
aws s3 cp webrtc-sip-api.zip s3://your-deployment-bucket/
aws elasticbeanstalk create-application-version \
    --application-name webrtc-sip-api \
    --version-label v1.0.0 \
    --source-bundle S3Bucket=your-deployment-bucket,S3Key=webrtc-sip-api.zip
```

#### Step 3: Create Environment
```bash
# Create environment
aws elasticbeanstalk create-environment \
    --application-name webrtc-sip-api \
    --environment-name webrtc-sip-api-prod \
    --solution-stack-name "64bit Amazon Linux 2 v5.8.0 running Node.js 18" \
    --version-label v1.0.0 \
    --option-settings file://eb-options.json
```

#### Step 4: Environment Configuration (`eb-options.json`)
```json
[
    {
        "Namespace": "aws:autoscaling:launchconfiguration",
        "OptionName": "InstanceType",
        "Value": "t3.medium"
    },
    {
        "Namespace": "aws:autoscaling:asg",
        "OptionName": "MinSize",
        "Value": "2"
    },
    {
        "Namespace": "aws:autoscaling:asg",
        "OptionName": "MaxSize",
        "Value": "10"
    },
    {
        "Namespace": "aws:elasticbeanstalk:environment",
        "OptionName": "EnvironmentType",
        "Value": "LoadBalanced"
    },
    {
        "Namespace": "aws:elasticbeanstalk:application:environment",
        "OptionName": "NODE_ENV",
        "Value": "production"
    },
    {
        "Namespace": "aws:elasticbeanstalk:application:environment",
        "OptionName": "PORT",
        "Value": "3000"
    },
    {
        "Namespace": "aws:elbv2:listener:443",
        "OptionName": "Protocol",
        "Value": "HTTPS"
    },
    {
        "Namespace": "aws:elbv2:listener:443",
        "OptionName": "SSLCertificateArns",
        "Value": "arn:aws:acm:region:account:certificate/certificate-id"
    }
]
```

#### Step 5: Deploy Application
```bash
# Deploy new version
aws elasticbeanstalk update-environment \
    --environment-name webrtc-sip-api-prod \
    --version-label v1.0.0

# Check deployment status
aws elasticbeanstalk describe-environments \
    --environment-names webrtc-sip-api-prod
```

### Method 2: ECS/Fargate Deployment

**Best for**: Container orchestration, serverless containers, microservices

#### Step 1: Create ECR Repository
```bash
# Create ECR repository
aws ecr create-repository --repository-name webrtc-sip-api

# Get login token
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 123456789012.dkr.ecr.us-east-1.amazonaws.com
```

#### Step 2: Build and Push Docker Image
```bash
# Build image
docker build -t webrtc-sip-api .

# Tag image
docker tag webrtc-sip-api:latest 123456789012.dkr.ecr.us-east-1.amazonaws.com/webrtc-sip-api:latest

# Push image
docker push 123456789012.dkr.ecr.us-east-1.amazonaws.com/webrtc-sip-api:latest
```

#### Step 3: Create ECS Cluster
```bash
# Create cluster
aws ecs create-cluster --cluster-name webrtc-cluster
```

#### Step 4: Create Task Definition (`task-definition.json`)
```json
{
    "family": "webrtc-sip-api",
    "networkMode": "awsvpc",
    "requiresCompatibilities": ["FARGATE"],
    "cpu": "1024",
    "memory": "2048",
    "executionRoleArn": "arn:aws:iam::123456789012:role/ecsTaskExecutionRole",
    "taskRoleArn": "arn:aws:iam::123456789012:role/ecsTaskRole",
    "containerDefinitions": [
        {
            "name": "webrtc-sip-api",
            "image": "123456789012.dkr.ecr.us-east-1.amazonaws.com/webrtc-sip-api:latest",
            "portMappings": [
                {
                    "containerPort": 3000,
                    "protocol": "tcp"
                },
                {
                    "containerPort": 8080,
                    "protocol": "tcp"
                }
            ],
            "environment": [
                {
                    "name": "NODE_ENV",
                    "value": "production"
                },
                {
                    "name": "PORT",
                    "value": "3000"
                },
                {
                    "name": "WS_PORT",
                    "value": "8080"
                }
            ],
            "secrets": [
                {
                    "name": "JWT_SECRET",
                    "valueFrom": "arn:aws:secretsmanager:us-east-1:123456789012:secret:webrtc/jwt-secret"
                }
            ],
            "logConfiguration": {
                "logDriver": "awslogs",
                "options": {
                    "awslogs-group": "/ecs/webrtc-sip-api",
                    "awslogs-region": "us-east-1",
                    "awslogs-stream-prefix": "ecs"
                }
            },
            "healthCheck": {
                "command": [
                    "CMD-SHELL",
                    "curl -f http://localhost:3000/api/v1/health || exit 1"
                ],
                "interval": 30,
                "timeout": 5,
                "retries": 3,
                "startPeriod": 60
            }
        }
    ]
}
```

#### Step 5: Register Task Definition
```bash
aws ecs register-task-definition --cli-input-json file://task-definition.json
```

#### Step 6: Create ECS Service
```bash
# Create service
aws ecs create-service \
    --cluster webrtc-cluster \
    --service-name webrtc-sip-api-service \
    --task-definition webrtc-sip-api:1 \
    --desired-count 3 \
    --launch-type FARGATE \
    --network-configuration "awsvpcConfiguration={subnets=[subnet-12345,subnet-67890],securityGroups=[sg-abcdef],assignPublicIp=ENABLED}" \
    --load-balancers "targetGroupArn=arn:aws:elasticloadbalancing:us-east-1:123456789012:targetgroup/webrtc-tg/1234567890123456,containerName=webrtc-sip-api,containerPort=3000"
```

### Method 3: EKS (Kubernetes) Deployment

**Best for**: Complex microservices, advanced orchestration, multi-environment

#### Step 1: Create EKS Cluster
```bash
# Install eksctl
curl --silent --location "https://github.com/weaveworks/eksctl/releases/latest/download/eksctl_$(uname -s)_amd64.tar.gz" | tar xz -C /tmp
sudo mv /tmp/eksctl /usr/local/bin

# Create cluster
eksctl create cluster \
    --name webrtc-cluster \
    --version 1.28 \
    --region us-east-1 \
    --nodegroup-name webrtc-nodes \
    --node-type t3.medium \
    --nodes 3 \
    --nodes-min 2 \
    --nodes-max 10 \
    --managed
```

#### Step 2: Configure kubectl
```bash
# Update kubeconfig
aws eks update-kubeconfig --region us-east-1 --name webrtc-cluster

# Verify connection
kubectl get nodes
```

#### Step 3: Deploy Application
```bash
# Apply Kubernetes manifests
kubectl apply -f k8s-deployment.yaml

# Check deployment status
kubectl get pods -n webrtc-sip-api
kubectl get services -n webrtc-sip-api
```

#### Step 4: Install AWS Load Balancer Controller
```bash
# Install AWS Load Balancer Controller
kubectl apply -k "github.com/aws/eks-charts/stable/aws-load-balancer-controller//crds?ref=master"

helm repo add eks https://aws.github.io/eks-charts
helm install aws-load-balancer-controller eks/aws-load-balancer-controller \
    -n kube-system \
    --set clusterName=webrtc-cluster \
    --set serviceAccount.create=false \
    --set serviceAccount.name=aws-load-balancer-controller
```

### Method 4: EC2 Instance Deployment

**Best for**: Full control, custom configurations, legacy applications

#### Step 1: Launch EC2 Instance
```bash
# Create security group
aws ec2 create-security-group \
    --group-name webrtc-sg \
    --description "Security group for WebRTC SIP API"

# Add inbound rules
aws ec2 authorize-security-group-ingress \
    --group-name webrtc-sg \
    --protocol tcp \
    --port 22 \
    --cidr 0.0.0.0/0

aws ec2 authorize-security-group-ingress \
    --group-name webrtc-sg \
    --protocol tcp \
    --port 3000 \
    --cidr 0.0.0.0/0

aws ec2 authorize-security-group-ingress \
    --group-name webrtc-sg \
    --protocol tcp \
    --port 8080 \
    --cidr 0.0.0.0/0

# Launch instance
aws ec2 run-instances \
    --image-id ami-0abcdef1234567890 \
    --count 1 \
    --instance-type t3.medium \
    --key-name your-key-pair \
    --security-groups webrtc-sg \
    --user-data file://user-data.sh
```

#### Step 2: User Data Script (`user-data.sh`)
```bash
#!/bin/bash
yum update -y
yum install -y git nodejs npm

# Install PM2
npm install -g pm2

# Clone repository
cd /opt
git clone https://github.com/your-org/webrtc-sip-api.git
cd webrtc-sip-api

# Install dependencies
npm install --production

# Create directories
mkdir -p data logs backups

# Set up environment
cp .env.example .env
# Configure .env file with production values

# Start application with PM2
pm2 start ecosystem.config.js --env production
pm2 startup
pm2 save

# Configure firewall
systemctl enable firewalld
systemctl start firewalld
firewall-cmd --permanent --add-port=3000/tcp
firewall-cmd --permanent --add-port=8080/tcp
firewall-cmd --reload
```

#### Step 3: Connect and Configure
```bash
# Connect to instance
ssh -i your-key-pair.pem ec2-user@your-instance-ip

# Check application status
pm2 status
pm2 logs

# Test application
curl http://localhost:3000/api/v1/health
```

### Method 5: Lambda + API Gateway (Serverless)

**Best for**: Event-driven, cost-effective, automatic scaling

#### Step 1: Install Serverless Framework
```bash
npm install -g serverless
serverless plugin install -n serverless-offline
```

#### Step 2: Create Serverless Configuration (`serverless.yml`)
```yaml
service: webrtc-sip-api

provider:
  name: aws
  runtime: nodejs18.x
  region: us-east-1
  stage: ${opt:stage, 'dev'}
  environment:
    NODE_ENV: production
    JWT_SECRET: ${ssm:/webrtc/jwt-secret}
    DB_PATH: /tmp/calls.db
  iamRoleStatements:
    - Effect: Allow
      Action:
        - logs:CreateLogGroup
        - logs:CreateLogStream
        - logs:PutLogEvents
      Resource: "*"

functions:
  api:
    handler: src/lambda.handler
    events:
      - http:
          path: /{proxy+}
          method: ANY
          cors: true
      - http:
          path: /
          method: ANY
          cors: true
    timeout: 30
    memorySize: 1024

  websocket:
    handler: src/websocket-lambda.handler
    events:
      - websocket:
          route: $connect
      - websocket:
          route: $disconnect
      - websocket:
          route: $default

plugins:
  - serverless-offline

package:
  exclude:
    - .git/**
    - .github/**
    - docs/**
    - tests/**
    - "*.md"
```

#### Step 3: Create Lambda Handler (`src/lambda.js`)
```javascript
const serverless = require('serverless-http');
const app = require('./api-server');

module.exports.handler = serverless(app);
```

#### Step 4: Deploy Serverless Application
```bash
# Deploy to AWS
serverless deploy --stage prod

# Test deployment
serverless invoke --function api --stage prod

# View logs
serverless logs --function api --stage prod
```

### Method 6: AWS App Runner

**Best for**: Simple container deployment, automatic scaling, minimal configuration

#### Step 1: Create App Runner Service
```bash
# Create apprunner.yaml configuration
cat > apprunner.yaml << EOF
version: 1.0
runtime: docker
build:
  commands:
    build:
      - echo "Build started on `date`"
      - docker build -t webrtc-sip-api .
run:
  runtime-version: latest
  command: node src/api-server.js
  network:
    port: 3000
    env:
      - NODE_ENV=production
      - PORT=3000
EOF
```

#### Step 2: Deploy with App Runner
```bash
# Create App Runner service
aws apprunner create-service \
    --service-name webrtc-sip-api \
    --source-configuration '{
        "ImageRepository": {
            "ImageIdentifier": "123456789012.dkr.ecr.us-east-1.amazonaws.com/webrtc-sip-api:latest",
            "ImageConfiguration": {
                "Port": "3000",
                "RuntimeEnvironmentVariables": {
                    "NODE_ENV": "production",
                    "PORT": "3000"
                }
            },
            "ImageRepositoryType": "ECR"
        },
        "AutoDeploymentsEnabled": true
    }' \
    --instance-configuration '{
        "Cpu": "1 vCPU",
        "Memory": "2 GB"
    }'
```

## Infrastructure as Code

### AWS CDK Deployment

#### Step 1: Install AWS CDK
```bash
npm install -g aws-cdk
cdk --version
```

#### Step 2: Create CDK Stack (`lib/webrtc-stack.ts`)
```typescript
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ecsPatterns from 'aws-cdk-lib/aws-ecs-patterns';
import * as elasticache from 'aws-cdk-lib/aws-elasticache';
import * as rds from 'aws-cdk-lib/aws-rds';

export class WebRTCStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // VPC
    const vpc = new ec2.Vpc(this, 'WebRTCVPC', {
      maxAzs: 2,
      natGateways: 1
    });

    // ECS Cluster
    const cluster = new ecs.Cluster(this, 'WebRTCCluster', {
      vpc: vpc
    });

    // Redis Cache
    const redis = new elasticache.CfnCacheCluster(this, 'WebRTCRedis', {
      cacheNodeType: 'cache.t3.micro',
      engine: 'redis',
      numCacheNodes: 1
    });

    // Fargate Service
    const fargateService = new ecsPatterns.ApplicationLoadBalancedFargateService(this, 'WebRTCService', {
      cluster: cluster,
      cpu: 1024,
      memoryLimitMiB: 2048,
      desiredCount: 3,
      taskImageOptions: {
        image: ecs.ContainerImage.fromRegistry('your-account.dkr.ecr.region.amazonaws.com/webrtc-sip-api:latest'),
        containerPort: 3000,
        environment: {
          NODE_ENV: 'production',
          PORT: '3000',
          WS_PORT: '8080'
        }
      },
      publicLoadBalancer: true
    });

    // Auto Scaling
    const scaling = fargateService.service.autoScaleTaskCount({
      minCapacity: 2,
      maxCapacity: 10
    });

    scaling.scaleOnCpuUtilization('CpuScaling', {
      targetUtilizationPercent: 70
    });

    // Output
    new cdk.CfnOutput(this, 'LoadBalancerDNS', {
      value: fargateService.loadBalancer.loadBalancerDnsName
    });
  }
}
```

#### Step 3: Deploy CDK Stack
```bash
# Initialize CDK project
cdk init app --language typescript

# Install dependencies
npm install

# Bootstrap CDK
cdk bootstrap

# Deploy stack
cdk deploy
```

### Terraform Deployment

#### Step 1: Create Terraform Configuration (`main.tf`)
```hcl
provider "aws" {
  region = var.aws_region
}

# VPC
resource "aws_vpc" "webrtc_vpc" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name = "webrtc-vpc"
  }
}

# Internet Gateway
resource "aws_internet_gateway" "webrtc_igw" {
  vpc_id = aws_vpc.webrtc_vpc.id

  tags = {
    Name = "webrtc-igw"
  }
}

# Subnets
resource "aws_subnet" "webrtc_public_subnet" {
  count             = 2
  vpc_id            = aws_vpc.webrtc_vpc.id
  cidr_block        = "10.0.${count.index + 1}.0/24"
  availability_zone = data.aws_availability_zones.available.names[count.index]

  map_public_ip_on_launch = true

  tags = {
    Name = "webrtc-public-subnet-${count.index + 1}"
  }
}

# ECS Cluster
resource "aws_ecs_cluster" "webrtc_cluster" {
  name = "webrtc-cluster"

  setting {
    name  = "containerInsights"
    value = "enabled"
  }
}

# ECS Task Definition
resource "aws_ecs_task_definition" "webrtc_task" {
  family                   = "webrtc-sip-api"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = "1024"
  memory                   = "2048"
  execution_role_arn       = aws_iam_role.ecs_execution_role.arn
  task_role_arn           = aws_iam_role.ecs_task_role.arn

  container_definitions = jsonencode([
    {
      name  = "webrtc-sip-api"
      image = "${var.ecr_repository_url}:latest"
      portMappings = [
        {
          containerPort = 3000
          protocol      = "tcp"
        },
        {
          containerPort = 8080
          protocol      = "tcp"
        }
      ]
      environment = [
        {
          name  = "NODE_ENV"
          value = "production"
        },
        {
          name  = "PORT"
          value = "3000"
        },
        {
          name  = "WS_PORT"
          value = "8080"
        }
      ]
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.webrtc_logs.name
          "awslogs-region"        = var.aws_region
          "awslogs-stream-prefix" = "ecs"
        }
      }
    }
  ])
}

# ECS Service
resource "aws_ecs_service" "webrtc_service" {
  name            = "webrtc-sip-api-service"
  cluster         = aws_ecs_cluster.webrtc_cluster.id
  task_definition = aws_ecs_task_definition.webrtc_task.arn
  desired_count   = 3
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = aws_subnet.webrtc_public_subnet[*].id
    security_groups  = [aws_security_group.webrtc_sg.id]
    assign_public_ip = true
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.webrtc_tg.arn
    container_name   = "webrtc-sip-api"
    container_port   = 3000
  }

  depends_on = [aws_lb_listener.webrtc_listener]
}

# Application Load Balancer
resource "aws_lb" "webrtc_alb" {
  name               = "webrtc-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.webrtc_alb_sg.id]
  subnets            = aws_subnet.webrtc_public_subnet[*].id

  enable_deletion_protection = false
}

# Variables
variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "ecr_repository_url" {
  description = "ECR repository URL"
  type        = string
}

# Outputs
output "load_balancer_dns" {
  value = aws_lb.webrtc_alb.dns_name
}

output "ecs_cluster_name" {
  value = aws_ecs_cluster.webrtc_cluster.name
}
```

#### Step 2: Deploy with Terraform
```bash
# Initialize Terraform
terraform init

# Plan deployment
terraform plan -var="ecr_repository_url=123456789012.dkr.ecr.us-east-1.amazonaws.com/webrtc-sip-api"

# Apply deployment
terraform apply -var="ecr_repository_url=123456789012.dkr.ecr.us-east-1.amazonaws.com/webrtc-sip-api"
```

## Monitoring and Logging

### CloudWatch Setup
```bash
# Create log group
aws logs create-log-group --log-group-name /aws/ecs/webrtc-sip-api

# Create custom metrics
aws cloudwatch put-metric-data \
    --namespace "WebRTC/API" \
    --metric-data MetricName=ActiveConnections,Value=10,Unit=Count
```

### X-Ray Tracing
```bash
# Enable X-Ray tracing in task definition
"environment": [
    {
        "name": "_X_AMZN_TRACE_ID",
        "value": "Root=1-5e1b4151-5ac6c58b1fdf2f33c4e6b5e4"
    }
]
```

### CloudWatch Alarms
```bash
# Create CPU alarm
aws cloudwatch put-metric-alarm \
    --alarm-name "WebRTC-High-CPU" \
    --alarm-description "High CPU utilization" \
    --metric-name CPUUtilization \
    --namespace AWS/ECS \
    --statistic Average \
    --period 300 \
    --threshold 80 \
    --comparison-operator GreaterThanThreshold \
    --evaluation-periods 2
```

## Security Configuration

### IAM Roles and Policies
```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "ecr:GetAuthorizationToken",
                "ecr:BatchCheckLayerAvailability",
                "ecr:GetDownloadUrlForLayer",
                "ecr:BatchGetImage",
                "logs:CreateLogStream",
                "logs:PutLogEvents",
                "secretsmanager:GetSecretValue"
            ],
            "Resource": "*"
        }
    ]
}
```

### Secrets Manager
```bash
# Store JWT secret
aws secretsmanager create-secret \
    --name "webrtc/jwt-secret" \
    --description "JWT secret for WebRTC SIP API" \
    --secret-string "your-super-secret-jwt-key"

# Store database credentials
aws secretsmanager create-secret \
    --name "webrtc/db-credentials" \
    --description "Database credentials" \
    --secret-string '{"username":"admin","password":"your-password"}'
```

### Security Groups
```bash
# Create security group for ALB
aws ec2 create-security-group \
    --group-name webrtc-alb-sg \
    --description "Security group for WebRTC ALB"

# Allow HTTP/HTTPS traffic
aws ec2 authorize-security-group-ingress \
    --group-name webrtc-alb-sg \
    --protocol tcp \
    --port 80 \
    --cidr 0.0.0.0/0

aws ec2 authorize-security-group-ingress \
    --group-name webrtc-alb-sg \
    --protocol tcp \
    --port 443 \
    --cidr 0.0.0.0/0
```

### SSL/TLS Certificate
```bash
# Request certificate from ACM
aws acm request-certificate \
    --domain-name api.yourdomain.com \
    --subject-alternative-names "*.yourdomain.com" \
    --validation-method DNS

# List certificates
aws acm list-certificates
```

## Cost Optimization

### Reserved Instances
```bash
# Purchase reserved instances for predictable workloads
aws ec2 describe-reserved-instances-offerings \
    --instance-type t3.medium \
    --product-description "Linux/UNIX"
```

### Spot Instances
```bash
# Use spot instances for development/testing
aws ec2 request-spot-instances \
    --spot-price "0.05" \
    --instance-count 1 \
    --type "one-time" \
    --launch-specification file://spot-specification.json
```

### Auto Scaling Policies
```bash
# Create scaling policy
aws application-autoscaling put-scaling-policy \
    --policy-name webrtc-scale-up \
    --service-namespace ecs \
    --resource-id service/webrtc-cluster/webrtc-sip-api-service \
    --scalable-dimension ecs:service:DesiredCount \
    --policy-type TargetTrackingScaling \
    --target-tracking-scaling-policy-configuration file://scaling-policy.json
```

## Troubleshooting

### Common Issues

#### 1. ECS Task Fails to Start
```bash
# Check task definition
aws ecs describe-task-definition --task-definition webrtc-sip-api

# Check service events
aws ecs describe-services \
    --cluster webrtc-cluster \
    --services webrtc-sip-api-service

# Check CloudWatch logs
aws logs get-log-events \
    --log-group-name /aws/ecs/webrtc-sip-api \
    --log-stream-name ecs/webrtc-sip-api/task-id
```

#### 2. Load Balancer Health Check Failures
```bash
# Check target group health
aws elbv2 describe-target-health \
    --target-group-arn arn:aws:elasticloadbalancing:region:account:targetgroup/webrtc-tg/id

# Check security group rules
aws ec2 describe-security-groups --group-ids sg-12345678
```

#### 3. WebSocket Connection Issues
```bash
# Test WebSocket connection
wscat -c wss://your-domain.com/ws

# Check ALB configuration for WebSocket
aws elbv2 describe-listeners \
    --load-balancer-arn arn:aws:elasticloadbalancing:region:account:loadbalancer/app/webrtc-alb/id
```

#### 4. High Latency Issues
```bash
# Check CloudWatch metrics
aws cloudwatch get-metric-statistics \
    --namespace AWS/ApplicationELB \
    --metric-name TargetResponseTime \
    --dimensions Name=LoadBalancer,Value=app/webrtc-alb/id \
    --start-time 2023-01-01T00:00:00Z \
    --end-time 2023-01-01T23:59:59Z \
    --period 300 \
    --statistics Average
```

### Debug Commands
```bash
# ECS debugging
aws ecs list-tasks --cluster webrtc-cluster
aws ecs describe-tasks --cluster webrtc-cluster --tasks task-id

# CloudWatch logs
aws logs describe-log-groups
aws logs describe-log-streams --log-group-name /aws/ecs/webrtc-sip-api

# Load balancer debugging
aws elbv2 describe-load-balancers
aws elbv2 describe-target-groups

# Security group debugging
aws ec2 describe-security-groups --group-names webrtc-sg
```

### Performance Monitoring
```bash
# Enable detailed monitoring
aws ecs put-account-setting \
    --name containerInsights \
    --value enabled

# Create custom dashboard
aws cloudwatch put-dashboard \
    --dashboard-name WebRTC-Dashboard \
    --dashboard-body file://dashboard.json
```

## Best Practices

### 1. **Multi-AZ Deployment**
- Deploy across multiple Availability Zones
- Use Application Load Balancer for high availability
- Configure auto-scaling policies

### 2. **Security**
- Use IAM roles with least privilege
- Store secrets in AWS Secrets Manager
- Enable VPC Flow Logs
- Use AWS WAF for web application protection

### 3. **Monitoring**
- Set up CloudWatch alarms
- Enable X-Ray tracing
- Use AWS Config for compliance
- Implement health checks

### 4. **Cost Optimization**
- Use appropriate instance types
- Implement auto-scaling
- Consider Reserved Instances for predictable workloads
- Monitor costs with AWS Cost Explorer

### 5. **Backup and Recovery**
- Automate database backups
- Use versioned S3 buckets
- Implement disaster recovery procedures
- Test backup restoration regularly

---

## Quick Reference

### Essential AWS CLI Commands
```bash
# ECS
aws ecs list-clusters
aws ecs list-services --cluster cluster-name
aws ecs describe-services --cluster cluster-name --services service-name

# ECR
aws ecr get-login-password --region region | docker login --username AWS --password-stdin account.dkr.ecr.region.amazonaws.com
aws ecr describe-repositories

# CloudWatch
aws logs describe-log-groups
aws cloudwatch list-metrics --namespace AWS/ECS

# Secrets Manager
aws secretsmanager list-secrets
aws secretsmanager get-secret-value --secret-id secret-name
```

### Useful Resources
- [AWS ECS Documentation](https://docs.aws.amazon.com/ecs/)
- [AWS Fargate Documentation](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/AWS_Fargate.html)
- [AWS Load Balancer Documentation](https://docs.aws.amazon.com/elasticloadbalancing/)
- [AWS CDK Documentation](https://docs.aws.amazon.com/cdk/)
- [Terraform AWS Provider](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)

This comprehensive guide covers all major AWS deployment methods for the WebRTC SIP API. Choose the method that best fits your requirements, team expertise, and infrastructure needs.