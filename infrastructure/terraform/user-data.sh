#!/bin/bash
set -e

# Update system
yum update -y

# Install Node.js 20
curl -fsSL https://rpm.nodesource.com/setup_20.x | bash -
yum install -y nodejs

# Install Git
yum install -y git

# Install CloudWatch agent
wget https://s3.amazonaws.com/amazoncloudwatch-agent/amazon_linux/amd64/latest/amazon-cloudwatch-agent.rpm
rpm -U ./amazon-cloudwatch-agent.rpm

# Create application directory
mkdir -p /opt/autonomous-ai
cd /opt/autonomous-ai

# Clone or copy application
# In production, you would pull from a repository
# git clone <your-repo-url> .

# Create .env file
cat > .env << EOL
ANTHROPIC_API_KEY=${anthropic_api_key}
NODE_ENV=${environment}
PORT=3000
LOG_LEVEL=info
CLOUDWATCH_LOG_GROUP=/aws/app/autonomous-ai-${environment}
EOL

# Install dependencies
# npm install

# Create systemd service
cat > /etc/systemd/system/autonomous-ai.service << EOL
[Unit]
Description=Autonomous AI System
After=network.target

[Service]
Type=simple
User=ec2-user
WorkingDirectory=/opt/autonomous-ai
Environment=NODE_ENV=${environment}
ExecStart=/usr/bin/node src/index.js
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
EOL

# Configure CloudWatch agent
cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json << EOL
{
  "logs": {
    "logs_collected": {
      "files": {
        "collect_list": [
          {
            "file_path": "/opt/autonomous-ai/logs/combined.log",
            "log_group_name": "/aws/app/autonomous-ai-${environment}",
            "log_stream_name": "{instance_id}/application"
          },
          {
            "file_path": "/opt/autonomous-ai/logs/error.log",
            "log_group_name": "/aws/app/autonomous-ai-${environment}",
            "log_stream_name": "{instance_id}/errors"
          }
        ]
      }
    }
  },
  "metrics": {
    "namespace": "AutonomousAI",
    "metrics_collected": {
      "cpu": {
        "measurement": [
          {
            "name": "cpu_usage_idle",
            "rename": "CPU_IDLE",
            "unit": "Percent"
          }
        ],
        "metrics_collection_interval": 60
      },
      "mem": {
        "measurement": [
          {
            "name": "mem_used_percent",
            "rename": "MEMORY_USED",
            "unit": "Percent"
          }
        ],
        "metrics_collection_interval": 60
      }
    }
  }
}
EOL

# Start CloudWatch agent
/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
  -a fetch-config \
  -m ec2 \
  -s \
  -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json

# Enable and start service
# systemctl enable autonomous-ai
# systemctl start autonomous-ai

echo "Setup complete!"
