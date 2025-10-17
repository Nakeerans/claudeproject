#!/bin/bash

# Autonomous AI System Setup Script
# This script helps you set up the project for the first time

set -e

echo "=========================================="
echo "Autonomous AI System - Setup"
echo "=========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check Node.js version
echo "Checking prerequisites..."
if ! command -v node &> /dev/null; then
    echo -e "${RED}Error: Node.js is not installed${NC}"
    echo "Please install Node.js 20 or higher from https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo -e "${RED}Error: Node.js version must be 18 or higher${NC}"
    echo "Current version: $(node -v)"
    exit 1
fi

echo -e "${GREEN}✓ Node.js $(node -v) found${NC}"

# Check npm
if ! command -v npm &> /dev/null; then
    echo -e "${RED}Error: npm is not installed${NC}"
    exit 1
fi

echo -e "${GREEN}✓ npm $(npm -v) found${NC}"

# Install dependencies
echo ""
echo "Installing dependencies..."
npm install

echo -e "${GREEN}✓ Dependencies installed${NC}"

# Setup environment
echo ""
echo "Setting up environment..."

if [ ! -f .env ]; then
    cp .env.example .env
    echo -e "${YELLOW}⚠ Created .env file${NC}"
    echo "Please edit .env and add your API keys:"
    echo "  - ANTHROPIC_API_KEY"
    echo "  - AWS_ACCESS_KEY_ID (for deployment)"
    echo "  - AWS_SECRET_ACCESS_KEY (for deployment)"
else
    echo -e "${GREEN}✓ .env file already exists${NC}"
fi

# Create logs directory
mkdir -p logs
echo -e "${GREEN}✓ Logs directory created${NC}"

# Install Playwright browsers
echo ""
echo "Installing Playwright browsers (this may take a few minutes)..."
npx playwright install
echo -e "${GREEN}✓ Playwright browsers installed${NC}"

# Build browser extension
echo ""
echo "Building browser extension..."
npm run build:extension
echo -e "${GREEN}✓ Browser extension built${NC}"

# Check optional tools
echo ""
echo "Checking optional tools..."

if command -v terraform &> /dev/null; then
    echo -e "${GREEN}✓ Terraform $(terraform -v | head -1) found${NC}"
else
    echo -e "${YELLOW}⚠ Terraform not found (required for AWS deployment)${NC}"
fi

if command -v aws &> /dev/null; then
    echo -e "${GREEN}✓ AWS CLI $(aws --version | cut -d' ' -f1) found${NC}"
else
    echo -e "${YELLOW}⚠ AWS CLI not found (required for AWS deployment)${NC}"
fi

if command -v docker &> /dev/null; then
    echo -e "${GREEN}✓ Docker $(docker --version | cut -d' ' -f3 | tr -d ',') found${NC}"
else
    echo -e "${YELLOW}⚠ Docker not found (optional)${NC}"
fi

# Summary
echo ""
echo "=========================================="
echo "Setup Complete!"
echo "=========================================="
echo ""
echo "Next steps:"
echo ""
echo "1. Edit .env file with your API keys:"
echo "   ${YELLOW}nano .env${NC}"
echo ""
echo "2. Start the development server:"
echo "   ${GREEN}npm run dev${NC}"
echo ""
echo "3. Run tests:"
echo "   ${GREEN}npm test${NC}"
echo ""
echo "4. Build browser extension (already done):"
echo "   ${GREEN}npm run build:extension${NC}"
echo ""
echo "5. Deploy to AWS (after configuring terraform.tfvars):"
echo "   ${GREEN}cd infrastructure/terraform${NC}"
echo "   ${GREEN}terraform init${NC}"
echo "   ${GREEN}terraform apply${NC}"
echo ""
echo "For more information, see:"
echo "  - README.md"
echo "  - docs/API.md"
echo "  - docs/DEPLOYMENT.md"
echo ""
