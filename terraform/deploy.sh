#!/bin/bash

# Automated OCI Infrastructure Deployment Script
# This script automates the entire infrastructure creation process

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}   Job Tracker - Automated OCI Infrastructure Deployment${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
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

# Check if Terraform is installed
check_terraform() {
    if ! command -v terraform &> /dev/null; then
        print_error "Terraform is not installed"
        echo ""
        echo "Install Terraform:"
        echo "  macOS:   brew install terraform"
        echo "  Linux:   https://learn.hashicorp.com/tutorials/terraform/install-cli"
        echo "  Windows: https://learn.hashicorp.com/tutorials/terraform/install-cli"
        exit 1
    fi

    TERRAFORM_VERSION=$(terraform version -json | grep -o '"terraform_version":"[^"]*' | cut -d'"' -f4)
    print_success "Terraform installed (version $TERRAFORM_VERSION)"
}

# Check if OCI CLI is installed
check_oci_cli() {
    if ! command -v oci &> /dev/null; then
        print_warning "OCI CLI is not installed (optional but recommended)"
        echo ""
        echo "Install OCI CLI:"
        echo "  bash -c \"\$(curl -L https://raw.githubusercontent.com/oracle/oci-cli/master/scripts/install/install.sh)\""
        echo ""
        read -p "Continue without OCI CLI? (yes/no): " CONTINUE
        if [ "$CONTINUE" != "yes" ]; then
            exit 1
        fi
    else
        print_success "OCI CLI installed"
    fi
}

# Check if terraform.tfvars exists
check_tfvars() {
    if [ ! -f "$SCRIPT_DIR/terraform.tfvars" ]; then
        print_warning "terraform.tfvars not found"

        if [ -f "$SCRIPT_DIR/terraform.tfvars.example" ]; then
            print_info "Creating terraform.tfvars from example..."
            cp "$SCRIPT_DIR/terraform.tfvars.example" "$SCRIPT_DIR/terraform.tfvars"
            print_success "Created terraform.tfvars"
            echo ""
            print_warning "IMPORTANT: Edit terraform.tfvars with your OCI credentials"
            echo ""
            echo "Required values:"
            echo "  - tenancy_ocid"
            echo "  - user_ocid"
            echo "  - fingerprint"
            echo "  - compartment_ocid"
            echo "  - region"
            echo ""
            echo "Run this script again after updating terraform.tfvars"
            exit 1
        else
            print_error "terraform.tfvars.example not found"
            exit 1
        fi
    else
        print_success "terraform.tfvars found"
    fi
}

# Validate terraform.tfvars
validate_tfvars() {
    print_info "Validating terraform.tfvars..."

    # Check if required variables are set (not just example values)
    if grep -q "aaaaaaaaxxxxxxxxxxxx" "$SCRIPT_DIR/terraform.tfvars"; then
        print_error "terraform.tfvars contains example values"
        echo ""
        echo "Please update terraform.tfvars with your actual OCI credentials"
        echo "Edit: $SCRIPT_DIR/terraform.tfvars"
        exit 1
    fi

    print_success "terraform.tfvars appears valid"
}

# Create necessary directories
create_directories() {
    print_info "Creating necessary directories..."

    mkdir -p "$SCRIPT_DIR/generated-keys"
    mkdir -p "$SCRIPT_DIR/outputs"

    print_success "Directories created"
}

# Initialize Terraform
terraform_init() {
    print_section "Initializing Terraform"

    cd "$SCRIPT_DIR"
    terraform init

    print_success "Terraform initialized"
}

# Validate Terraform configuration
terraform_validate() {
    print_section "Validating Terraform Configuration"

    cd "$SCRIPT_DIR"
    terraform validate

    print_success "Terraform configuration valid"
}

# Plan Terraform changes
terraform_plan() {
    print_section "Planning Infrastructure Changes"

    cd "$SCRIPT_DIR"
    terraform plan -out=tfplan

    echo ""
    print_warning "Review the plan above carefully"
    echo ""
    read -p "Do you want to proceed with creating the infrastructure? (yes/no): " PROCEED

    if [ "$PROCEED" != "yes" ]; then
        print_info "Deployment cancelled"
        rm -f tfplan
        exit 0
    fi
}

# Apply Terraform changes
terraform_apply() {
    print_section "Creating Infrastructure"

    cd "$SCRIPT_DIR"
    terraform apply tfplan
    rm -f tfplan

    print_success "Infrastructure created successfully!"
}

# Display outputs
display_outputs() {
    print_section "Deployment Information"

    cd "$SCRIPT_DIR"
    terraform output deployment_summary

    echo ""
    print_info "SSH Private Key: $(terraform output -raw ssh_private_key_path)"
    print_info "GitHub Secrets: $(terraform output -raw github_secrets_file)"
    print_info "Environment File: $(terraform output -raw env_file)"
    print_info "Connect Script: $(terraform output -raw connect_script)"
}

# Main execution
main() {
    print_section "Pre-flight Checks"

    check_terraform
    check_oci_cli
    check_tfvars
    validate_tfvars
    create_directories

    terraform_init
    terraform_validate
    terraform_plan
    terraform_apply
    display_outputs

    echo ""
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}   Deployment Complete! 🎉${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    print_info "Next steps:"
    echo "  1. Wait 10-15 minutes for cloud-init to complete"
    echo "  2. Connect: ./outputs/connect.sh"
    echo "  3. Check cloud-init: sudo cloud-init status"
    echo "  4. Add GitHub secrets from: ./outputs/github-secrets.txt"
    echo "  5. Deploy application: docker-compose up -d"
    echo ""
}

# Handle Ctrl+C
trap 'echo ""; print_warning "Deployment cancelled by user"; exit 130' INT

# Run main function
main
