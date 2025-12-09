# Terraform Automation for Oracle Cloud Infrastructure

Automate the complete creation of Oracle Cloud infrastructure for the Job Tracker application using Infrastructure as Code (IaC).

---

## 🎯 What This Does

This Terraform configuration **automatically creates**:

✅ **Virtual Cloud Network (VCN)** with internet gateway
✅ **Subnet** with proper routing
✅ **Security Lists** (firewall rules for ports 22, 80, 443, 3000)
✅ **Compute Instance** (configurable shape and size)
✅ **SSH Keys** (automatically generated)
✅ **GitHub Deploy Keys** (for CI/CD)
✅ **Environment Configuration** (with secure secrets)
✅ **Cloud-Init Setup** (Docker, Git, firewall)

**Time saved:** 45-60 minutes of manual configuration!

---

## 📋 Prerequisites

### 1. Install Terraform

**macOS:**
```bash
brew install terraform
```

**Linux:**
```bash
wget https://releases.hashicorp.com/terraform/1.6.6/terraform_1.6.6_linux_amd64.zip
unzip terraform_1.6.6_linux_amd64.zip
sudo mv terraform /usr/local/bin/
```

**Windows:**
Download from: https://www.terraform.io/downloads

**Verify installation:**
```bash
terraform --version
```

### 2. Oracle Cloud Account

- Sign up at: https://cloud.oracle.com
- Free tier available with generous limits

### 3. OCI API Credentials

You need 4 values from Oracle Cloud:

1. **Tenancy OCID**
2. **User OCID**
3. **API Key Fingerprint**
4. **Compartment OCID**

**How to get them:** See [OCI API Setup Guide](#oci-api-setup-guide) below.

---

## 🚀 Quick Start (3 Commands)

### Step 1: Configure Your Credentials

```bash
cd terraform

# Copy the example file
cp terraform.tfvars.example terraform.tfvars

# Edit with your credentials
nano terraform.tfvars
```

**Fill in these required values:**
```hcl
tenancy_ocid     = "ocid1.tenancy.oc1..aaaa..."  # Your tenancy OCID
user_ocid        = "ocid1.user.oc1..aaaa..."     # Your user OCID
fingerprint      = "xx:xx:xx:xx:xx:xx..."        # API key fingerprint
compartment_ocid = "ocid1.compartment.oc1..aaaa..." # Compartment OCID
region           = "us-ashburn-1"                # Your region
```

### Step 2: Run the Deployment Script

```bash
./deploy.sh
```

That's it! The script will:
- Validate your configuration
- Show you what will be created
- Ask for confirmation
- Create all infrastructure
- Generate all necessary keys and configs

### Step 3: Wait and Access

**Wait:** 10-15 minutes for cloud-init to complete

**Connect:**
```bash
./outputs/connect.sh
```

**Or manually:**
```bash
ssh -i generated-keys/jobtracker_ssh_key.pem opc@<IP_ADDRESS>
```

---

## 📚 OCI API Setup Guide

### Get Required OCIDs and API Key

#### 1. Get Tenancy OCID

1. OCI Console → Profile icon (top right) → Tenancy: `<name>`
2. Copy the **OCID** value
3. Paste into terraform.tfvars as `tenancy_ocid`

#### 2. Get User OCID

1. OCI Console → Profile icon → User Settings
2. Copy the **OCID** under User Information
3. Paste into terraform.tfvars as `user_ocid`

#### 3. Generate API Key

```bash
# Create directory for OCI keys
mkdir -p ~/.oci

# Generate API key pair
openssl genrsa -out ~/.oci/oci_api_key.pem 2048
chmod 600 ~/.oci/oci_api_key.pem

# Generate public key
openssl rsa -pubout -in ~/.oci/oci_api_key.pem -out ~/.oci/oci_api_key_public.pem

# Display public key (copy this)
cat ~/.oci/oci_api_key_public.pem
```

#### 4. Add API Key to OCI

1. OCI Console → User Settings → API Keys
2. Click **"Add API Key"**
3. Select **"Paste Public Key"**
4. Paste the content from `cat ~/.oci/oci_api_key_public.pem`
5. Click **"Add"**
6. **Copy the Fingerprint** shown in the dialog
7. Paste into terraform.tfvars as `fingerprint`

#### 5. Get Compartment OCID

1. OCI Console → Identity & Security → Compartments
2. Click on your compartment name
3. Copy the **OCID**
4. Paste into terraform.tfvars as `compartment_ocid`

**Tip:** You can use the root compartment (same as tenancy_ocid) for testing.

---

## 🔧 Configuration Options

### Basic Configuration (Required)

```hcl
# terraform.tfvars

tenancy_ocid     = "ocid1.tenancy..."
user_ocid        = "ocid1.user..."
fingerprint      = "xx:xx:xx..."
compartment_ocid = "ocid1.compartment..."
region           = "us-ashburn-1"
```

### Instance Customization (Optional)

```hcl
# Instance specifications
instance_name   = "jobtracker-app"
instance_shape  = "VM.Standard.E4.Flex"
instance_ocpus  = 2
instance_memory_in_gbs = 8
boot_volume_size_in_gbs = 50

# SSH configuration
generate_new_ssh_key = true  # Auto-generate SSH keys

# Cloud-init
use_cloud_init = true
cloud_init_script = "../cloud-init/full-setup.yml"

# Application
github_repository = "https://github.com/Nakeerans/claudeproject.git"
anthropic_api_key = "sk-ant-api03-..."  # Optional
```

### Available Instance Shapes

| Shape | OCPUs | Memory | Cost/hr | Use Case |
|-------|-------|--------|---------|----------|
| VM.Standard.E2.1.Micro | 1 | 1 GB | FREE | Development/Testing |
| VM.Standard.E4.Flex | 1-64 | 1-1024 GB | Flexible | Production (recommended) |
| VM.Standard.E3.Flex | 1-64 | 1-1024 GB | Flexible | Alternative |

**Free Tier includes:** 2x VM.Standard.E2.1.Micro instances (always free)

### Available Regions

Common regions:
- `us-ashburn-1` (US East - Ohio)
- `us-phoenix-1` (US West - Arizona)
- `eu-frankfurt-1` (Germany)
- `uk-london-1` (United Kingdom)
- `ap-mumbai-1` (India)
- `ap-tokyo-1` (Japan)

Full list: https://docs.oracle.com/en-us/iaas/Content/General/Concepts/regions.htm

---

## 📦 What Gets Created

### Network Resources

```
VCN (10.0.0.0/16)
├── Internet Gateway
├── Route Table
├── Security List (Firewall)
│   ├── Port 22 (SSH)
│   ├── Port 80 (HTTP)
│   ├── Port 443 (HTTPS)
│   └── Port 3000 (App)
└── Subnet (10.0.1.0/24)
```

### Compute Resources

```
Compute Instance
├── Oracle Linux 8
├── Shape: VM.Standard.E4.Flex (2 OCPU, 8 GB)
├── Boot Volume: 50 GB
├── Public IP Address
└── Cloud-Init (automatic setup)
```

### Generated Files

```
generated-keys/
├── jobtracker_ssh_key.pem      # SSH private key for instance
├── jobtracker_ssh_key.pub      # SSH public key
├── github_deploy_key           # GitHub Actions deploy key
└── github_deploy_key.pub       # GitHub deploy public key

outputs/
├── github-secrets.txt          # GitHub Actions secrets
├── .env.generated              # Application environment file
└── connect.sh                  # SSH connection script
```

---

## 🎯 Usage Examples

### Deploy with Default Settings

```bash
./deploy.sh
```

### Deploy with Custom Instance Size

Edit `terraform.tfvars`:
```hcl
instance_ocpus = 4
instance_memory_in_gbs = 16
```

Then deploy:
```bash
./deploy.sh
```

### Deploy Without Cloud-Init

Edit `terraform.tfvars`:
```hcl
use_cloud_init = false
```

### Use Your Own SSH Key

Edit `terraform.tfvars`:
```hcl
generate_new_ssh_key = false
ssh_public_key_path = "~/.ssh/id_rsa.pub"
```

### Deploy to Different Region

Edit `terraform.tfvars`:
```hcl
region = "eu-frankfurt-1"
```

---

## 🔍 Manual Terraform Commands

If you prefer manual control:

```bash
# Initialize
terraform init

# Validate configuration
terraform validate

# Preview changes
terraform plan

# Create infrastructure
terraform apply

# View outputs
terraform output

# Destroy infrastructure (when done)
terraform destroy
```

---

## 📊 After Deployment

### 1. Get Instance Information

```bash
# Get public IP
terraform output instance_public_ip

# Get SSH command
terraform output ssh_connection_command

# Get all information
terraform output deployment_summary
```

### 2. Connect to Instance

```bash
# Using generated script
./outputs/connect.sh

# Or manually
ssh -i generated-keys/jobtracker_ssh_key.pem opc@<IP>
```

### 3. Verify Cloud-Init Completed

```bash
# SSH to instance
./outputs/connect.sh

# Check cloud-init status
sudo cloud-init status
# Should show: status: done

# View cloud-init output
sudo cat /var/log/cloud-init-output.log | tail -50
```

### 4. Deploy Application

```bash
# SSH to instance
./outputs/connect.sh

# Clone repository
cd /opt/jobtracker
git clone https://github.com/Nakeerans/claudeproject.git .

# Copy environment file from your local machine
# On your local machine:
scp terraform/outputs/.env.generated opc@<IP>:/opt/jobtracker/.env

# Or create manually on server:
cp .env.production .env
nano .env
# Add your ANTHROPIC_API_KEY and other secrets

# Deploy
docker-compose up -d

# Check status
docker-compose ps
docker-compose logs -f app
```

### 5. Setup GitHub Auto-Deploy

```bash
# On your local machine

# View GitHub secrets
cat terraform/outputs/github-secrets.txt

# Add secrets to GitHub:
# 1. Go to: https://github.com/Nakeerans/claudeproject/settings/secrets/actions
# 2. Add each secret from github-secrets.txt
# 3. Push code to trigger deployment
```

### 6. Access Application

```bash
# Get application URL
terraform output application_url

# Check health
curl $(terraform output -raw health_check_url)

# Open in browser
open $(terraform output -raw application_url)
```

---

## 🔧 Troubleshooting

### "Error 401: NotAuthenticated"

**Problem:** Invalid API credentials

**Solution:**
1. Verify API key fingerprint matches in OCI Console
2. Check API key file path is correct
3. Ensure API key has not been deleted

```bash
# Test OCI CLI authentication
oci iam region list

# If that works, your credentials are correct
```

### "Error 404: NotAuthorizedOrNotFound"

**Problem:** Compartment OCID invalid or no permission

**Solution:**
1. Verify compartment OCID is correct
2. Check you have permission to create resources in that compartment
3. Try using root compartment (same as tenancy_ocid)

### "Error: No available images"

**Problem:** Image not available in selected region/shape

**Solution:**
```hcl
# In terraform.tfvars, specify image OCID manually
instance_image_ocid = "ocid1.image.oc1.iad.aaaa..."
```

Get image OCID:
```bash
oci compute image list --compartment-id <compartment-ocid> --operating-system "Oracle Linux"
```

### "Permission denied (publickey)"

**Problem:** SSH key permissions or path incorrect

**Solution:**
```bash
# Fix key permissions
chmod 600 generated-keys/jobtracker_ssh_key.pem

# Verify key exists
ls -la generated-keys/

# Test connection
ssh -i generated-keys/jobtracker_ssh_key.pem opc@<IP>
```

### "Cloud-init not completing"

**Problem:** Cloud-init script error or slow

**Solution:**
```bash
# SSH to instance
ssh -i generated-keys/jobtracker_ssh_key.pem opc@<IP>

# Check cloud-init status
sudo cloud-init status

# View logs
sudo cat /var/log/cloud-init.log
sudo cat /var/log/cloud-init-output.log

# If failed, re-run manually
sudo cloud-init init
sudo cloud-init modules --mode=config
sudo cloud-init modules --mode=final
```

---

## 🗑️ Cleanup

### Destroy Infrastructure

When you're done and want to delete everything:

```bash
cd terraform

# Preview what will be destroyed
terraform plan -destroy

# Destroy all resources
terraform destroy

# Confirm by typing: yes
```

This will delete:
- Compute instance
- VCN and all network resources
- All security lists and rules

**Note:** Generated keys and config files in `generated-keys/` and `outputs/` will remain. Delete manually if needed:

```bash
rm -rf generated-keys/
rm -rf outputs/
```

---

## 💰 Cost Estimate

### Free Tier (Always Free)

- 2x VM.Standard.E2.1.Micro (1 OCPU, 1 GB)
- 2x Block Volumes (100 GB total)
- 10 GB Object Storage
- 10 TB/month outbound data

**Cost:** $0/month

### Paid Tier (Recommended Config)

- 1x VM.Standard.E4.Flex (2 OCPU, 8 GB)
- 50 GB Boot Volume
- Public IP address

**Estimated Cost:** ~$20-30/month

**Calculate your costs:** https://www.oracle.com/cloud/cost-estimator.html

---

## 🔐 Security Best Practices

1. **Secure Your Keys**
   ```bash
   chmod 600 terraform.tfvars
   chmod 600 generated-keys/*
   chmod 600 outputs/.env.generated
   ```

2. **Don't Commit Secrets**
   - `terraform.tfvars` is in .gitignore
   - `generated-keys/` is in .gitignore
   - `outputs/` is in .gitignore

3. **Rotate API Keys Regularly**
   - Generate new API keys every 90 days
   - Delete old API keys after rotation

4. **Use Compartments**
   - Create dedicated compartment for job tracker
   - Limit access to that compartment only

5. **Enable MFA**
   - Enable multi-factor authentication on OCI account

---

## 📚 Additional Resources

- **Terraform Documentation:** https://www.terraform.io/docs
- **OCI Provider Docs:** https://registry.terraform.io/providers/oracle/oci/latest/docs
- **OCI Free Tier:** https://www.oracle.com/cloud/free/
- **OCI Regions:** https://docs.oracle.com/en-us/iaas/Content/General/Concepts/regions.htm

---

## ✅ Summary

**With this Terraform automation, you can:**

✅ Create complete OCI infrastructure with one command
✅ Auto-generate all SSH keys and secrets
✅ Configure networking and security automatically
✅ Setup cloud-init for automatic server configuration
✅ Get ready-to-use GitHub Actions secrets
✅ Deploy to production in minutes

**Total time:** 15-20 minutes (vs 1-2 hours manually)

---

**Ready to deploy? Run:**

```bash
cd terraform
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars with your OCI credentials
./deploy.sh
```

**That's it! Your infrastructure will be created automatically! 🚀**
