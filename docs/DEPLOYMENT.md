# Deployment Guide

## Prerequisites

- AWS Account with appropriate permissions
- Terraform 1.5+
- AWS CLI configured
- Anthropic API key
- GitHub repository (for CI/CD)

## Local Deployment

### 1. Setup Environment

```bash
# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your keys
```

### 2. Run Locally

```bash
# Development mode with hot reload
npm run dev

# Production mode
NODE_ENV=production npm start
```

### 3. Test

```bash
# Run all tests
npm test

# Run specific test suite
npm run test:e2e
```

## AWS Deployment with Terraform

### 1. Configure AWS Credentials

```bash
aws configure
# Enter your AWS Access Key ID
# Enter your AWS Secret Access Key
# Enter your default region (e.g., us-east-1)
```

### 2. Initialize Terraform

```bash
cd infrastructure/terraform

# Initialize
terraform init

# Create tfvars file
cat > terraform.tfvars << EOF
aws_region = "us-east-1"
environment = "prod"
instance_type = "t3.medium"
anthropic_api_key = "your-api-key-here"
EOF
```

### 3. Deploy Infrastructure

```bash
# Preview changes
terraform plan

# Apply infrastructure
terraform apply

# Get outputs
terraform output

# Expected outputs:
# instance_public_ip = "54.123.45.67"
# application_url = "http://54.123.45.67:3000"
```

### 4. Verify Deployment

```bash
# Get application URL
APP_URL=$(terraform output -raw application_url)

# Check health
curl $APP_URL/health

# Expected response:
# {"status":"healthy","timestamp":"...","modules":{...}}
```

## GitHub Actions CI/CD

### 1. Setup Repository Secrets

Navigate to GitHub repository settings > Secrets and variables > Actions

Add the following secrets:
- `ANTHROPIC_API_KEY`: Your Claude AI API key
- `AWS_ACCESS_KEY_ID`: AWS access key
- `AWS_SECRET_ACCESS_KEY`: AWS secret key
- `SNYK_TOKEN`: (Optional) Snyk security token

### 2. Workflow Triggers

The CI/CD pipeline is triggered on:
- Push to `main` branch → Deploy to production
- Push to `develop` branch → Deploy to development
- Pull requests → Run tests and Terraform plan

### 3. Manual Deployment

Trigger manual deployment via GitHub Actions:
1. Go to Actions tab
2. Select "CI/CD Pipeline"
3. Click "Run workflow"
4. Select branch and environment

## Docker Deployment (Optional)

### Create Dockerfile

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --production

COPY . .

EXPOSE 3000

CMD ["node", "src/index.js"]
```

### Build and Run

```bash
# Build image
docker build -t autonomous-ai-system .

# Run container
docker run -d \
  -p 3000:3000 \
  -e ANTHROPIC_API_KEY=your_key \
  -e NODE_ENV=production \
  --name autonomous-ai \
  autonomous-ai-system

# Check logs
docker logs -f autonomous-ai
```

## AWS ECS Deployment

### 1. Create ECS Task Definition

```json
{
  "family": "autonomous-ai-task",
  "containerDefinitions": [
    {
      "name": "autonomous-ai",
      "image": "your-ecr-repo/autonomous-ai:latest",
      "memory": 2048,
      "cpu": 1024,
      "essential": true,
      "portMappings": [
        {
          "containerPort": 3000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        }
      ],
      "secrets": [
        {
          "name": "ANTHROPIC_API_KEY",
          "valueFrom": "arn:aws:secretsmanager:..."
        }
      ]
    }
  ]
}
```

### 2. Create ECS Service

```bash
aws ecs create-service \
  --cluster your-cluster \
  --service-name autonomous-ai-service \
  --task-definition autonomous-ai-task \
  --desired-count 2 \
  --launch-type FARGATE
```

## Monitoring Setup

### CloudWatch Dashboard

```bash
# Create CloudWatch dashboard
aws cloudwatch put-dashboard \
  --dashboard-name AutonomousAI \
  --dashboard-body file://cloudwatch-dashboard.json
```

### CloudWatch Alarms

```bash
# CPU utilization alarm
aws cloudwatch put-metric-alarm \
  --alarm-name autonomous-ai-high-cpu \
  --alarm-description "Alert when CPU exceeds 80%" \
  --metric-name CPUUtilization \
  --namespace AWS/EC2 \
  --statistic Average \
  --period 300 \
  --evaluation-periods 2 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold
```

## Rollback Procedure

### Terraform Rollback

```bash
cd infrastructure/terraform

# View state history
terraform state list

# Rollback to previous state
# (restore from backup)
mv terraform.tfstate.backup terraform.tfstate

# Apply previous state
terraform apply
```

### Application Rollback

```bash
# Via GitHub Actions
# 1. Go to Actions tab
# 2. Find successful previous deployment
# 3. Click "Re-run all jobs"

# Manual rollback
ssh ec2-user@your-instance
cd /opt/autonomous-ai
git checkout <previous-commit>
npm install
sudo systemctl restart autonomous-ai
```

## Scaling

### Vertical Scaling (EC2)

```bash
# Update instance type in terraform
cd infrastructure/terraform

# Edit variables
cat >> terraform.tfvars << EOF
instance_type = "t3.large"  # or t3.xlarge
EOF

# Apply changes
terraform apply
```

### Horizontal Scaling (Load Balancer + Auto Scaling)

Modify Terraform configuration:

```hcl
# Add Application Load Balancer
resource "aws_lb" "app" {
  name               = "autonomous-ai-lb"
  internal           = false
  load_balancer_type = "application"
  subnets            = aws_subnet.public[*].id
}

# Add Auto Scaling Group
resource "aws_autoscaling_group" "app" {
  min_size         = 2
  max_size         = 10
  desired_capacity = 2
  # ... other configuration
}
```

## Security Best Practices

1. **Secrets Management**
   - Use AWS Secrets Manager or Parameter Store
   - Never commit secrets to Git
   - Rotate credentials regularly

2. **Network Security**
   - Use VPC with private subnets
   - Implement security groups properly
   - Enable AWS Shield for DDoS protection

3. **Application Security**
   - Keep dependencies updated
   - Run security scans (npm audit, Snyk)
   - Implement rate limiting
   - Add authentication/authorization

4. **Monitoring**
   - Enable CloudWatch logging
   - Set up alerts for errors
   - Monitor API usage and costs

## Troubleshooting

### Deployment Fails

```bash
# Check Terraform logs
terraform apply -debug

# Check AWS CloudWatch logs
aws logs tail /aws/app/autonomous-ai-prod --follow

# SSH into instance
ssh -i your-key.pem ec2-user@instance-ip
journalctl -u autonomous-ai -f
```

### Application Not Responding

```bash
# Check service status
sudo systemctl status autonomous-ai

# Check logs
tail -f /opt/autonomous-ai/logs/combined.log

# Restart service
sudo systemctl restart autonomous-ai
```

### High Memory Usage

```bash
# Check memory
free -m

# Check Node.js heap
node --max-old-space-size=4096 src/index.js

# Update systemd service with memory limit
sudo systemctl edit autonomous-ai
```

## Cost Optimization

1. **Use Reserved Instances** for production
2. **Enable Auto Scaling** to match demand
3. **Use S3 lifecycle policies** for logs
4. **Monitor API costs** (Claude AI, AWS services)
5. **Implement caching** to reduce API calls

## Backup and Recovery

### Backup

```bash
# Backup Terraform state
aws s3 cp s3://your-bucket/terraform.tfstate ./backup/

# Backup application data
rsync -avz ec2-user@instance:/opt/autonomous-ai ./backup/
```

### Recovery

```bash
# Restore from backup
terraform init
terraform import aws_instance.app i-1234567890abcdef0
terraform apply
```
