#!/bin/bash
# Azure VM Deployment Script for JobTracker

set -e

VM_IP="4.157.253.229"
VM_USER="azureuser"
REPO_URL="https://github.com/Nakeerans/claudeproject.git"
APP_DIR="/opt/jobtracker"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🚀 Deploying JobTracker to Azure VM"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Step 1: Check cloud-init status
echo "📋 Step 1: Checking cloud-init status..."
ssh -o StrictHostKeyChecking=no ${VM_USER}@${VM_IP} "sudo cloud-init status --wait"
echo "✅ Cloud-init completed"
echo ""

# Step 2: Verify Docker installation
echo "🐳 Step 2: Verifying Docker installation..."
ssh ${VM_USER}@${VM_IP} "docker --version && docker-compose --version"
echo "✅ Docker verified"
echo ""

# Step 3: Create app directory and clone repository
echo "📦 Step 3: Setting up application directory..."
ssh ${VM_USER}@${VM_IP} << 'ENDSSH'
    # Create directory
    sudo mkdir -p /opt/jobtracker
    sudo chown -R azureuser:azureuser /opt/jobtracker

    # Clone repository
    if [ -d "/opt/jobtracker/.git" ]; then
        echo "Repository exists, pulling latest changes..."
        cd /opt/jobtracker
        git pull
    else
        echo "Cloning repository..."
        git clone https://github.com/Nakeerans/claudeproject.git /opt/jobtracker
    fi

    cd /opt/jobtracker
    echo "Current directory: $(pwd)"
    echo "Repository cloned/updated successfully"
ENDSSH
echo "✅ Repository ready"
echo ""

# Step 4: Create environment file
echo "⚙️  Step 4: Setting up environment variables..."
echo ""
echo "You need to provide the following values:"
echo "1. ANTHROPIC_API_KEY (required)"
echo "2. JWT_SECRET (will generate if not provided)"
echo "3. SESSION_SECRET (will generate if not provided)"
echo "4. DB_PASSWORD (will generate if not provided)"
echo ""

read -p "Enter ANTHROPIC_API_KEY: " ANTHROPIC_API_KEY
read -p "Enter JWT_SECRET (press Enter to auto-generate): " JWT_SECRET
read -p "Enter SESSION_SECRET (press Enter to auto-generate): " SESSION_SECRET
read -p "Enter DB_PASSWORD (press Enter to auto-generate): " DB_PASSWORD

# Generate secrets if not provided
JWT_SECRET=${JWT_SECRET:-$(openssl rand -base64 32)}
SESSION_SECRET=${SESSION_SECRET:-$(openssl rand -base64 32)}
DB_PASSWORD=${DB_PASSWORD:-$(openssl rand -base64 20)}

# Create .env file on remote server
ssh ${VM_USER}@${VM_IP} "cat > /opt/jobtracker/.env" << EOF
# Database Configuration
DB_NAME=huntr_clone
DB_USER=jobtracker_user
DB_PASSWORD=${DB_PASSWORD}
DB_PORT=5432

# Application Configuration
NODE_ENV=production
APP_PORT=3000
CLIENT_URL=http://${VM_IP}:3000
LOG_LEVEL=info

# Authentication Secrets
JWT_SECRET=${JWT_SECRET}
SESSION_SECRET=${SESSION_SECRET}

# AI Features - Anthropic Claude
ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}

# Google OAuth (Optional - leave empty for now)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_CALLBACK_URL=
EOF

echo "✅ Environment variables configured"
echo ""

# Step 5: Deploy with Docker Compose
echo "🚀 Step 5: Deploying application..."
ssh ${VM_USER}@${VM_IP} << 'ENDSSH'
    cd /opt/jobtracker

    # Stop existing containers
    docker-compose down 2>/dev/null || true

    # Pull latest images
    docker-compose pull

    # Build and start services
    docker-compose up -d --build

    echo "Waiting for services to be healthy..."
    sleep 10

    # Check status
    docker-compose ps
ENDSSH
echo "✅ Application deployed"
echo ""

# Step 6: Verify deployment
echo "🔍 Step 6: Verifying deployment..."
sleep 5
ssh ${VM_USER}@${VM_IP} << 'ENDSSH'
    cd /opt/jobtracker

    echo "Container status:"
    docker-compose ps

    echo ""
    echo "Application logs (last 20 lines):"
    docker-compose logs --tail=20 app
ENDSSH
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Deployment Complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🌐 Application URL: http://${VM_IP}:3000"
echo ""
echo "📝 Useful commands:"
echo "   ssh ${VM_USER}@${VM_IP}"
echo "   cd /opt/jobtracker"
echo "   docker-compose ps              # Check status"
echo "   docker-compose logs -f app     # View logs"
echo "   docker-compose restart         # Restart services"
echo "   docker-compose down            # Stop services"
echo ""
