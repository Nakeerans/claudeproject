#!/bin/bash

# GitHub Auto-Deploy Setup Script
# This script helps you set up automatic deployment from GitHub to Oracle Cloud

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}   GitHub Auto-Deploy Setup Assistant${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Function to print section headers
print_section() {
    echo ""
    echo -e "${GREEN}━━━ $1 ━━━${NC}"
    echo ""
}

# Function to print info
print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Function to print success
print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

# Function to print warning
print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Function to print error
print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Step 1: Collect information
print_section "Step 1: Server Information"

read -p "Enter your Oracle Cloud server IP address: " SERVER_IP
read -p "Enter your SSH username (usually 'opc' or 'ubuntu'): " SSH_USER
read -p "Enter your production domain or IP (e.g., jobtracker.com or use server IP): " PRODUCTION_URL

# Validate inputs
if [ -z "$SERVER_IP" ] || [ -z "$SSH_USER" ] || [ -z "$PRODUCTION_URL" ]; then
    print_error "All fields are required!"
    exit 1
fi

print_success "Information collected"

# Step 2: Generate SSH key for GitHub Actions
print_section "Step 2: Generating SSH Key for GitHub Actions"

SSH_KEY_PATH="$HOME/.ssh/github_deploy_key"

if [ -f "$SSH_KEY_PATH" ]; then
    print_warning "SSH key already exists at $SSH_KEY_PATH"
    read -p "Do you want to overwrite it? (yes/no): " OVERWRITE
    if [ "$OVERWRITE" != "yes" ]; then
        print_info "Using existing key"
    else
        rm -f "$SSH_KEY_PATH" "$SSH_KEY_PATH.pub"
        print_info "Generating new SSH key..."
        ssh-keygen -t ed25519 -C "github-actions-deploy" -f "$SSH_KEY_PATH" -N ""
        print_success "New SSH key generated"
    fi
else
    print_info "Generating SSH key..."
    ssh-keygen -t ed25519 -C "github-actions-deploy" -f "$SSH_KEY_PATH" -N ""
    print_success "SSH key generated at $SSH_KEY_PATH"
fi

# Step 3: Copy SSH key to server
print_section "Step 3: Installing SSH Key on Server"

print_info "Copying public key to server..."
print_warning "You may be prompted for your server password"

if ssh-copy-id -i "$SSH_KEY_PATH.pub" "$SSH_USER@$SERVER_IP" 2>/dev/null; then
    print_success "SSH key copied to server"
else
    print_error "Failed to copy SSH key automatically"
    print_info "Please copy the key manually:"
    echo ""
    echo "Run this command:"
    echo "  ssh-copy-id -i $SSH_KEY_PATH.pub $SSH_USER@$SERVER_IP"
    echo ""
    read -p "Press Enter after copying the key manually..."
fi

# Test SSH connection
print_info "Testing SSH connection..."
if ssh -i "$SSH_KEY_PATH" -o ConnectTimeout=10 "$SSH_USER@$SERVER_IP" "echo 'SSH test successful'" > /dev/null 2>&1; then
    print_success "SSH connection successful!"
else
    print_error "SSH connection failed!"
    print_info "Please check your server IP and SSH configuration"
    exit 1
fi

# Step 4: Verify server setup
print_section "Step 4: Verifying Server Setup"

print_info "Checking if application directory exists..."
if ssh -i "$SSH_KEY_PATH" "$SSH_USER@$SERVER_IP" "[ -d /opt/jobtracker ]"; then
    print_success "Application directory found"
else
    print_warning "Application directory not found at /opt/jobtracker"
    print_info "Creating directory..."
    ssh -i "$SSH_KEY_PATH" "$SSH_USER@$SERVER_IP" "sudo mkdir -p /opt/jobtracker && sudo chown $SSH_USER:$SSH_USER /opt/jobtracker"
    print_success "Directory created"
fi

print_info "Checking Docker installation..."
if ssh -i "$SSH_KEY_PATH" "$SSH_USER@$SERVER_IP" "docker --version" > /dev/null 2>&1; then
    print_success "Docker is installed"
else
    print_error "Docker is not installed on the server"
    print_info "Please install Docker first: https://docs.docker.com/engine/install/"
    exit 1
fi

print_info "Checking Docker Compose installation..."
if ssh -i "$SSH_KEY_PATH" "$SSH_USER@$SERVER_IP" "docker-compose --version" > /dev/null 2>&1; then
    print_success "Docker Compose is installed"
else
    print_error "Docker Compose is not installed"
    print_info "Please install Docker Compose first"
    exit 1
fi

# Step 5: Setup Git on server
print_section "Step 5: Setting up Git on Server"

print_info "Configuring Git repository on server..."

ssh -i "$SSH_KEY_PATH" "$SSH_USER@$SERVER_IP" << 'REMOTE_SCRIPT'
cd /opt/jobtracker

# Initialize git if not already
if [ ! -d .git ]; then
    git init
fi

# Configure git
git config pull.rebase false
git config user.name "GitHub Actions"
git config user.email "actions@github.com"

echo "Git configured successfully"
REMOTE_SCRIPT

print_success "Git configured on server"

# Step 6: Generate secrets output
print_section "Step 6: GitHub Secrets Configuration"

print_info "Generating GitHub secrets values..."

PRIVATE_KEY=$(cat "$SSH_KEY_PATH")

# Create a temporary file with secrets
SECRETS_FILE="/tmp/github_secrets_$(date +%s).txt"

cat > "$SECRETS_FILE" << EOF
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
GitHub Secrets Configuration
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Add these secrets to your GitHub repository:
Settings → Secrets and variables → Actions → New repository secret

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECRET NAME: OCI_HOST
VALUE:
$SERVER_IP

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECRET NAME: OCI_USER
VALUE:
$SSH_USER

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECRET NAME: PRODUCTION_URL
VALUE:
$PRODUCTION_URL

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECRET NAME: OCI_SSH_PRIVATE_KEY
VALUE (ENTIRE CONTENT INCLUDING BEGIN/END LINES):
$PRIVATE_KEY

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

IMPORTANT:
- Copy each value exactly as shown (including all lines for the private key)
- Do NOT add extra spaces or newlines
- Keep this file secure and delete it after adding secrets to GitHub

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
EOF

print_success "Secrets configuration generated!"
print_info "Secrets saved to: $SECRETS_FILE"

echo ""
cat "$SECRETS_FILE"
echo ""

# Step 7: Instructions
print_section "Step 7: Next Steps"

echo -e "${YELLOW}📋 Follow these steps to complete setup:${NC}"
echo ""
echo "1. Open your GitHub repository: https://github.com/Nakeerans/claudeproject"
echo "2. Go to: Settings → Secrets and variables → Actions"
echo "3. Click 'New repository secret' for each secret above"
echo "4. Copy and paste the values exactly as shown in: $SECRETS_FILE"
echo ""
echo "5. Enable the simple deployment workflow:"
echo "   - Rename or disable .github/workflows/deploy.yml (the complex one)"
echo "   - The simple workflow is: .github/workflows/deploy-simple.yml"
echo ""
echo "6. Push your code to GitHub:"
echo "   cd /Users/nakeeransaravanan/Devops_practise/claudeproject"
echo "   git add ."
echo "   git commit -m 'Setup auto-deployment'"
echo "   git push claude main"
echo ""
echo "7. Watch the deployment:"
echo "   - Go to: https://github.com/Nakeerans/claudeproject/actions"
echo "   - You should see the workflow running!"
echo ""

print_warning "Security Note: Delete the secrets file after adding to GitHub:"
echo "  rm $SECRETS_FILE"
echo ""

print_success "Setup complete! 🎉"
print_info "Your auto-deployment is ready to use."

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}   Happy Deploying! 🚀${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
