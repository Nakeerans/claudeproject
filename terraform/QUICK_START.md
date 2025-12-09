# Terraform Quick Start - 5 Minutes to Deployment

Deploy your entire Oracle Cloud infrastructure in minutes!

---

## 🎯 What You Need (5 Values)

From Oracle Cloud Console, get these 5 values:

1. **Tenancy OCID** - Your account ID
2. **User OCID** - Your user ID
3. **API Fingerprint** - Security key fingerprint
4. **Compartment OCID** - Where to create resources
5. **Region** - Data center location (e.g., us-ashburn-1)

**Don't have these?** Follow [Get OCI Credentials](#get-oci-credentials) below.

---

## 🚀 Deploy in 3 Steps

### Step 1: Configure

```bash
cd terraform
cp terraform.tfvars.example terraform.tfvars
nano terraform.tfvars
```

**Paste your 5 values:**
```hcl
tenancy_ocid     = "ocid1.tenancy.oc1..aaaa..."
user_ocid        = "ocid1.user.oc1..aaaa..."
fingerprint      = "xx:xx:xx:xx:xx:xx..."
compartment_ocid = "ocid1.compartment.oc1..aaaa..."
region           = "us-ashburn-1"
```

Save and exit (Ctrl+X, Y, Enter)

### Step 2: Deploy

```bash
./deploy.sh
```

**That's it!** The script will:
- ✅ Validate your config
- ✅ Show what will be created
- ✅ Ask for confirmation
- ✅ Create everything automatically

**Time:** 5-10 minutes

### Step 3: Access

```bash
# Connect to your server
./outputs/connect.sh

# Or view connection details
terraform output deployment_summary
```

---

## 📋 Get OCI Credentials

### 1. Tenancy OCID

```
OCI Console → Click your profile (top right) → Tenancy: <name>
Copy the OCID shown
```

### 2. User OCID

```
OCI Console → Profile → User Settings
Copy the OCID under "User Information"
```

### 3. API Key & Fingerprint

```bash
# Generate API key pair
mkdir -p ~/.oci
openssl genrsa -out ~/.oci/oci_api_key.pem 2048
openssl rsa -pubout -in ~/.oci/oci_api_key.pem -out ~/.oci/oci_api_key_public.pem

# Display public key
cat ~/.oci/oci_api_key_public.pem
```

**Add to OCI:**
```
1. OCI Console → User Settings → API Keys → Add API Key
2. Select "Paste Public Key"
3. Paste the content from above
4. Click "Add"
5. Copy the Fingerprint shown
```

### 4. Compartment OCID

```
OCI Console → Identity & Security → Compartments
Click your compartment name
Copy the OCID

OR use root compartment (same as Tenancy OCID)
```

### 5. Region

**Pick the closest region:**
- US East (Ohio): `us-ashburn-1`
- US West (Arizona): `us-phoenix-1`
- Europe (Germany): `eu-frankfurt-1`
- UK (London): `uk-london-1`
- Asia (India): `ap-mumbai-1`

Full list: https://docs.oracle.com/en-us/iaas/Content/General/Concepts/regions.htm

---

## ✅ What Gets Created

Your infrastructure will include:

- ✅ Compute Instance (Oracle Linux 8, 2 OCPU, 8 GB RAM)
- ✅ Virtual Cloud Network (VCN)
- ✅ Internet Gateway
- ✅ Security Rules (ports 22, 80, 443, 3000)
- ✅ Public IP Address
- ✅ SSH Keys (auto-generated)
- ✅ GitHub Deploy Keys (for CI/CD)
- ✅ Environment Configuration (with secrets)
- ✅ Cloud-Init Setup (Docker, Git, firewall)

**Total time to fully configured server:** 15-20 minutes

---

## 📦 After Deployment

### Files Generated

```
generated-keys/
├── jobtracker_ssh_key.pem      # SSH to your server
├── github_deploy_key           # For GitHub Actions

outputs/
├── github-secrets.txt          # Add to GitHub
├── .env.generated              # Application config
└── connect.sh                  # Quick SSH connection
```

### Next Steps

**1. Connect to Server:**
```bash
./outputs/connect.sh
```

**2. Wait for Cloud-Init (10-15 min):**
```bash
# Check if cloud-init is done
sudo cloud-init status
```

**3. Deploy Application:**
```bash
cd /opt/jobtracker
git clone https://github.com/Nakeerans/claudeproject.git .
docker-compose up -d
```

**4. Access Application:**
```
http://<YOUR_IP>:3000
```

**5. Setup Auto-Deploy:**
```bash
# Add secrets to GitHub from:
cat ../terraform/outputs/github-secrets.txt
```

---

## 🔧 Common Customizations

### Change Instance Size

Edit `terraform.tfvars`:
```hcl
instance_ocpus = 4
instance_memory_in_gbs = 16
```

### Use Free Tier

Edit `terraform.tfvars`:
```hcl
instance_shape = "VM.Standard.E2.1.Micro"
instance_ocpus = 1
instance_memory_in_gbs = 1
```

### Add Anthropic API Key

Edit `terraform.tfvars`:
```hcl
anthropic_api_key = "sk-ant-api03-your-key-here"
```

### Change Region

Edit `terraform.tfvars`:
```hcl
region = "eu-frankfurt-1"
```

Then re-deploy:
```bash
terraform apply
```

---

## 🐛 Troubleshooting

### "Error 401: NotAuthenticated"

**Fix:**
```bash
# Check API key fingerprint matches
cat ~/.oci/oci_api_key_public.pem | openssl md5 -c

# Compare with fingerprint in OCI Console
```

### "terraform: command not found"

**Fix:**
```bash
# macOS
brew install terraform

# Linux
wget https://releases.hashicorp.com/terraform/1.6.6/terraform_1.6.6_linux_amd64.zip
unzip terraform_*_linux_amd64.zip
sudo mv terraform /usr/local/bin/
```

### "Permission denied" when connecting

**Fix:**
```bash
chmod 600 generated-keys/jobtracker_ssh_key.pem
./outputs/connect.sh
```

### "No available images"

**Fix:** Specify image OCID in `terraform.tfvars`:
```hcl
instance_image_ocid = "ocid1.image.oc1.iad.aaaa..."
```

Get image OCID:
```bash
oci compute image list --compartment-id <compartment-ocid> --operating-system "Oracle Linux"
```

---

## 🗑️ Cleanup

To delete everything:

```bash
terraform destroy
# Type: yes
```

This removes all cloud resources. Generated local files remain (delete manually if needed).

---

## 💰 Cost

### Free Tier
- 2x VM.Standard.E2.1.Micro instances (always free)
- **Cost:** $0/month

### Recommended (2 OCPU, 8 GB)
- 1x VM.Standard.E4.Flex
- **Cost:** ~$20-30/month

**Calculate:** https://www.oracle.com/cloud/cost-estimator.html

---

## 📚 Full Documentation

For detailed information:
- **Complete Guide:** `README.md`
- **Cloud-Init Info:** `../cloud-init/README.md`
- **Auto-Deploy:** `../GITHUB_AUTO_DEPLOY_SETUP.md`

---

## ✅ Summary

**Deploy infrastructure:**
```bash
cd terraform
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars with your OCI credentials
./deploy.sh
```

**Connect:**
```bash
./outputs/connect.sh
```

**Deploy app:**
```bash
cd /opt/jobtracker
git clone https://github.com/Nakeerans/claudeproject.git .
docker-compose up -d
```

**That's it! 🚀**

---

Need help? Check `README.md` for detailed documentation.
