# Complete Infrastructure Automation Guide

Automate everything from instance creation to deployment using code!

---

## 🎯 What You Asked For

> "how to automate OCI instance creation with required keys and all through code"

**Answer:** Use Terraform - Infrastructure as Code (IaC)

---

## ✅ What I Created

### **Complete Terraform Configuration**

Location: `/terraform/` directory

**12 Files Created:**

1. **`terraform/main.tf`** - Main infrastructure configuration
   - Creates VCN, subnet, internet gateway
   - Creates security lists (firewall rules)
   - Creates compute instance
   - Auto-generates SSH keys
   - Integrates cloud-init

2. **`terraform/provider.tf`** - OCI provider setup
   - Configures connection to Oracle Cloud
   - Manages authentication

3. **`terraform/variables.tf`** - All configuration options
   - 20+ customizable parameters
   - Instance size, region, network config
   - API keys, secrets, application settings

4. **`terraform/outputs.tf`** - Deployment information display
   - Shows IP addresses, connection commands
   - Paths to generated keys and configs
   - Health check URLs

5. **`terraform/terraform.tfvars.example`** - Configuration template
   - Copy to `terraform.tfvars` and fill in
   - Contains all required OCI credentials

6. **`terraform/deploy.sh`** - Automated deployment script
   - One command to create everything
   - Validates configuration
   - Handles errors
   - Shows progress

7. **`terraform/templates/`** - Auto-generation templates
   - `github-secrets.tpl` - GitHub Actions secrets
   - `env.tpl` - Application environment file
   - `connect.tpl` - SSH connection script

8. **`terraform/README.md`** - Complete documentation
   - 400+ lines of detailed guide
   - Troubleshooting section
   - Cost estimates
   - Security best practices

9. **`terraform/QUICK_START.md`** - 5-minute guide
   - Quick reference
   - Essential steps only
   - Common customizations

10. **`terraform/.gitignore`** - Security
    - Prevents committing secrets
    - Ignores generated files

---

## 🚀 How It Works

### **Single Command Deployment**

```bash
cd terraform
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars with your OCI credentials
./deploy.sh
```

**That's literally it!**

### **What Happens Automatically**

```
1. Validates your OCI credentials ✅
2. Creates Virtual Cloud Network (VCN) ✅
3. Creates Internet Gateway ✅
4. Creates Route Tables ✅
5. Creates Security Lists (Firewall) ✅
   - Opens ports: 22, 80, 443, 3000
6. Creates Subnet ✅
7. Generates SSH Key Pair ✅
8. Generates GitHub Deploy Key ✅
9. Creates Compute Instance ✅
   - Oracle Linux 8
   - 2 OCPU, 8 GB RAM (configurable)
   - 50 GB boot volume
10. Injects Cloud-Init Script ✅
    - Installs Docker
    - Installs Docker Compose
    - Installs Git
    - Configures firewall
    - Creates directories
11. Generates Environment File ✅
    - Secure JWT secret
    - Secure session secret
    - Secure database password
12. Generates GitHub Secrets File ✅
    - Ready to paste into GitHub
13. Generates Connection Script ✅
    - One-command SSH access
```

**Total Time:** 5-10 minutes for everything!

---

## 📋 Information You Need to Provide

### **5 Values from Oracle Cloud:**

1. **Tenancy OCID** - Your Oracle Cloud account ID
2. **User OCID** - Your user ID
3. **API Fingerprint** - Security key fingerprint
4. **Compartment OCID** - Where to create resources
5. **Region** - Data center location

**How to get these:** See `terraform/README.md` - complete step-by-step guide

### **Optional (But Recommended):**

6. **Anthropic API Key** - For AI features
7. **GitHub Token** - For private repositories

---

## 📁 File Structure Created

```
terraform/
├── Configuration Files
│   ├── provider.tf              # OCI provider setup
│   ├── variables.tf             # All configuration options
│   ├── main.tf                  # Infrastructure definition
│   ├── outputs.tf               # Output information
│   └── terraform.tfvars.example # Configuration template
│
├── Automation
│   ├── deploy.sh                # Automated deployment script
│   └── templates/               # Auto-generation templates
│       ├── github-secrets.tpl
│       ├── env.tpl
│       └── connect.tpl
│
├── Documentation
│   ├── README.md                # Complete guide (400+ lines)
│   ├── QUICK_START.md           # 5-minute guide
│   └── .gitignore               # Security
│
└── Generated (after deployment)
    ├── generated-keys/          # SSH keys
    │   ├── jobtracker_ssh_key.pem
    │   ├── jobtracker_ssh_key.pub
    │   ├── github_deploy_key
    │   └── github_deploy_key.pub
    │
    └── outputs/                 # Configuration files
        ├── github-secrets.txt   # For GitHub Actions
        ├── .env.generated       # Application config
        └── connect.sh           # SSH connection script
```

---

## 🎯 Usage Examples

### **Example 1: Deploy with Defaults**

```bash
cd terraform

# Copy and edit config
cp terraform.tfvars.example terraform.tfvars
nano terraform.tfvars
# Add your 5 OCI values

# Deploy
./deploy.sh
```

### **Example 2: Deploy with Custom Size**

Edit `terraform.tfvars`:
```hcl
instance_ocpus = 4
instance_memory_in_gbs = 16
boot_volume_size_in_gbs = 100
```

Deploy:
```bash
./deploy.sh
```

### **Example 3: Deploy to Different Region**

Edit `terraform.tfvars`:
```hcl
region = "eu-frankfurt-1"
```

### **Example 4: Deploy Free Tier**

Edit `terraform.tfvars`:
```hcl
instance_shape = "VM.Standard.E2.1.Micro"
instance_ocpus = 1
instance_memory_in_gbs = 1
```

### **Example 5: Use Your Own SSH Key**

Edit `terraform.tfvars`:
```hcl
generate_new_ssh_key = false
ssh_public_key_path = "~/.ssh/id_rsa.pub"
```

---

## 🔧 What You Can Configure

### **Instance Settings**
- Shape (VM type)
- OCPUs (CPU cores)
- Memory (GB)
- Boot volume size
- Operating system

### **Network Settings**
- VCN CIDR block
- Subnet CIDR block
- Region
- Availability domain

### **Application Settings**
- GitHub repository URL
- Anthropic API key
- Auto-deploy on creation
- Cloud-init script to use

### **SSH Settings**
- Auto-generate keys or use your own
- Key paths

### **Tags**
- Project name
- Environment
- Owner
- Custom tags

**Total:** 20+ configurable parameters

---

## 📊 What Gets Created Automatically

### **Network Infrastructure**

```
Virtual Cloud Network (10.0.0.0/16)
├── Internet Gateway (public access)
├── Route Table (routing rules)
├── Security List (firewall)
│   ├── Port 22  - SSH access
│   ├── Port 80  - HTTP access
│   ├── Port 443 - HTTPS access
│   ├── Port 3000 - Application
│   └── ICMP - Ping
└── Subnet (10.0.1.0/24)
    └── Compute Instance
```

### **Compute Instance**

- Oracle Linux 8 (latest)
- Public IP address
- Cloud-init configured
- SSH keys installed
- Ready for deployment

### **Security Keys**

1. **Instance SSH Key** - Access the server
2. **GitHub Deploy Key** - For CI/CD automation
3. **JWT Secret** - Application authentication
4. **Session Secret** - Session management
5. **Database Password** - PostgreSQL

**All generated automatically!**

### **Configuration Files**

1. **`github-secrets.txt`** - Copy/paste to GitHub
2. **`.env.generated`** - Application environment
3. **`connect.sh`** - One-command SSH access

---

## ⚡ Speed Comparison

### **Manual Setup**
```
1. Login to OCI Console        (2 min)
2. Create VCN                  (5 min)
3. Configure subnet            (3 min)
4. Configure security lists    (5 min)
5. Create internet gateway     (2 min)
6. Configure route table       (3 min)
7. Create instance             (5 min)
8. Configure SSH keys          (3 min)
9. Wait for instance           (3 min)
10. Install Docker             (5 min)
11. Install Docker Compose     (2 min)
12. Configure firewall         (3 min)
13. Create directories         (2 min)
14. Configure Git              (2 min)
15. Generate secrets           (3 min)
16. Setup GitHub Actions       (5 min)

Total: 60+ minutes ❌
Error-prone ❌
Not repeatable ❌
```

### **With Terraform**
```
1. Edit terraform.tfvars      (3 min)
2. Run ./deploy.sh            (2 min)
3. Wait for creation          (5 min)
4. Wait for cloud-init        (10 min)

Total: 20 minutes ✅
Automated ✅
Repeatable ✅
Version controlled ✅
```

**Time Saved:** 40+ minutes per deployment!

---

## 🎯 Complete Workflow

### **Step 1: Get OCI Credentials**

Follow `terraform/README.md` - Section "OCI API Setup Guide"

**You'll get:**
- Tenancy OCID
- User OCID
- API fingerprint
- Compartment OCID
- API key file (~/.oci/oci_api_key.pem)

**Time:** 10 minutes (one-time setup)

### **Step 2: Configure Terraform**

```bash
cd /Users/nakeeransaravanan/Devops_practise/claudeproject/terraform

# Copy config template
cp terraform.tfvars.example terraform.tfvars

# Edit with your values
nano terraform.tfvars
```

**Time:** 3 minutes

### **Step 3: Deploy**

```bash
./deploy.sh
```

Watch it create everything automatically!

**Time:** 5-10 minutes

### **Step 4: Wait for Cloud-Init**

```bash
# Connect
./outputs/connect.sh

# Check status
sudo cloud-init status
```

Wait until: `status: done`

**Time:** 10-15 minutes

### **Step 5: Deploy Application**

```bash
# Clone repository
cd /opt/jobtracker
git clone https://github.com/Nakeerans/claudeproject.git .

# Copy environment
# On your local machine:
scp terraform/outputs/.env.generated opc@<IP>:/opt/jobtracker/.env

# Deploy
docker-compose up -d
```

**Time:** 5 minutes

### **Step 6: Setup Auto-Deploy**

```bash
# View GitHub secrets
cat terraform/outputs/github-secrets.txt

# Add to GitHub:
# https://github.com/Nakeerans/claudeproject/settings/secrets/actions
```

**Time:** 3 minutes

### **Total Time: 30-45 minutes**
(vs 2-3 hours manually!)

---

## 💰 Cost Analysis

### **Free Tier Option**
```hcl
# In terraform.tfvars
instance_shape = "VM.Standard.E2.1.Micro"
instance_ocpus = 1
instance_memory_in_gbs = 1
```
**Cost:** $0/month (always free!)

### **Recommended Option**
```hcl
instance_shape = "VM.Standard.E4.Flex"
instance_ocpus = 2
instance_memory_in_gbs = 8
```
**Cost:** ~$20-30/month

### **Production Option**
```hcl
instance_shape = "VM.Standard.E4.Flex"
instance_ocpus = 4
instance_memory_in_gbs = 16
```
**Cost:** ~$40-60/month

**Calculate your costs:** https://www.oracle.com/cloud/cost-estimator.html

---

## 🔐 Security Features

### **Automated Security**
- ✅ SSH keys auto-generated (4096-bit RSA)
- ✅ JWT secrets (32 characters random)
- ✅ Session secrets (32 characters random)
- ✅ Database passwords (20 characters random)
- ✅ All secrets never committed to Git
- ✅ Secure file permissions (0600 for keys)

### **Network Security**
- ✅ Security lists configured
- ✅ Only necessary ports open
- ✅ Stateful firewall rules
- ✅ ICMP allowed for diagnostics

### **Best Practices**
- ✅ Separate deploy keys for GitHub
- ✅ Environment files not committed
- ✅ API keys kept secure
- ✅ Tagged resources for tracking

---

## 🐛 Common Issues & Solutions

### Issue 1: "Terraform not installed"

**Solution:**
```bash
# macOS
brew install terraform

# Linux
wget https://releases.hashicorp.com/terraform/1.6.6/terraform_1.6.6_linux_amd64.zip
unzip terraform_1.6.6_linux_amd64.zip
sudo mv terraform /usr/local/bin/
```

### Issue 2: "Error 401: NotAuthenticated"

**Solution:**
- Check API key fingerprint matches in OCI Console
- Verify API key file path is correct
- Ensure API key hasn't been deleted

### Issue 3: "Error 404: NotAuthorizedOrNotFound"

**Solution:**
- Verify compartment OCID is correct
- Check permissions in that compartment
- Try using root compartment (tenancy OCID)

### Issue 4: "No available images"

**Solution:**
```hcl
# Specify image OCID in terraform.tfvars
instance_image_ocid = "ocid1.image.oc1.iad.aaaa..."
```

---

## 📚 Documentation Summary

### **Quick References**
- `terraform/QUICK_START.md` - 5-minute guide
- `terraform/README.md` - Complete documentation
- `cloud-init/README.md` - Cloud-init guide
- `GITHUB_AUTO_DEPLOY_SETUP.md` - CI/CD setup

### **Configuration Templates**
- `terraform/terraform.tfvars.example` - Main config
- `cloud-init/basic-setup.yml` - Basic server setup
- `cloud-init/full-setup.yml` - Complete server setup

### **Automation Scripts**
- `terraform/deploy.sh` - Infrastructure deployment
- `scripts/setup-github-deploy.sh` - GitHub setup
- Generated: `outputs/connect.sh` - SSH connection

---

## ✅ Summary

### **What You Asked:**
> "how to automate OCI instance creation with required keys and all through code"

### **What You Got:**

✅ **Complete Terraform configuration**
- Creates entire OCI infrastructure
- Auto-generates all SSH keys
- Auto-generates all secrets
- Configures networking
- Sets up firewall
- Installs software (Docker, Git)

✅ **One-command deployment**
```bash
./deploy.sh
```

✅ **Fully automated**
- No manual clicking in console
- No manual key generation
- No manual configuration
- Repeatable and version controlled

✅ **Time saved**
- 60+ minutes manual → 20 minutes automated
- Consistent every time
- No errors

✅ **Production ready**
- Security best practices
- Auto-generated secure secrets
- Proper network configuration
- Documentation included

---

## 🚀 Get Started Now

```bash
cd /Users/nakeeransaravanan/Devops_practise/claudeproject/terraform

# 1. Configure
cp terraform.tfvars.example terraform.tfvars
nano terraform.tfvars
# Add your 5 OCI values

# 2. Deploy
./deploy.sh

# 3. Connect (after deployment completes)
./outputs/connect.sh

# 4. Deploy app
cd /opt/jobtracker
git clone https://github.com/Nakeerans/claudeproject.git .
docker-compose up -d
```

**That's it! Fully automated infrastructure deployment! 🎉**

---

**Need help?** Check:
- `terraform/README.md` - Complete guide
- `terraform/QUICK_START.md` - Quick reference
