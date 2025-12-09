# Cloud-Init Scripts for Oracle Cloud Instance Creation

Automate your Oracle Cloud instance setup with cloud-init scripts! These scripts configure everything automatically when you create the instance.

---

## 📋 Available Scripts

### 1. **basic-setup.yml** (Recommended for Beginners)
Installs essential software and configures the server.

**What it does:**
- ✅ Installs Docker & Docker Compose
- ✅ Installs Git
- ✅ Configures firewall (ports 22, 80, 443, 3000)
- ✅ Creates application directories
- ✅ Sets up swap space
- ✅ Configures user permissions

**Time saved:** ~10-15 minutes of manual setup

### 2. **full-setup.yml** (Recommended for Production)
Complete automated setup including environment configuration.

**What it does (everything from basic-setup.yml PLUS):**
- ✅ Creates environment template
- ✅ Generates secure secrets automatically
- ✅ Configures logging and rotation
- ✅ Installs monitoring tools
- ✅ Sets up helpful aliases
- ✅ Configures system optimizations
- ✅ Optional: Clone your repository automatically

**Time saved:** ~20-30 minutes of manual setup

---

## 🚀 How to Use Cloud-Init When Creating Instance

### Method 1: Using Oracle Cloud Web Console (Easiest)

#### Step 1: Start Instance Creation
1. Go to: https://cloud.oracle.com
2. Navigate: ☰ Menu → Compute → Instances
3. Click: **Create Instance**

#### Step 2: Basic Configuration
Fill in the instance details:
- **Name**: `jobtracker-app`
- **Compartment**: Select your compartment
- **Availability Domain**: Select any
- **Image**: Oracle Linux 8 or Ubuntu 22.04
- **Shape**: Click "Change shape"
  - Choose: `VM.Standard.E4.Flex`
  - OCPU: `2`
  - Memory (GB): `8`

#### Step 3: Networking
- **VCN**: Select your VCN or create new
- **Subnet**: Select public subnet
- **Public IP**: ✅ **Assign a public IPv4 address**

#### Step 4: **Add SSH Keys**
- Upload your SSH public key OR
- Generate a key pair (download the private key!)

#### Step 5: **Boot Volume** (Leave default)
- Keep default settings

#### Step 6: **IMPORTANT - Add Cloud-Init Script**

Scroll down to **"Advanced options"** and click **"Show"**

You'll see tabs at the top. Click on the **"Management"** tab.

Under **"Initialization script"**:

**Option A - Paste Script Directly:**
1. Select "Paste cloud-init script"
2. Open the file: `cloud-init/basic-setup.yml` or `cloud-init/full-setup.yml`
3. Copy the ENTIRE contents
4. Paste into the text box

**Option B - Upload Script File:**
1. Select "Choose cloud-init script files (.yml, .yaml)"
2. Click "Choose files"
3. Upload: `cloud-init/basic-setup.yml` or `cloud-init/full-setup.yml`

#### Step 7: Create Instance
1. Review your configuration
2. Click **"Create"**
3. Wait ~2-3 minutes for instance to provision
4. Wait ~5-10 more minutes for cloud-init to complete

#### Step 8: Verify Cloud-Init Completed

```bash
# SSH to your instance
ssh -i ~/.ssh/your-key.pem opc@<INSTANCE_IP>

# Check cloud-init status
sudo cloud-init status

# Should show: status: done

# View cloud-init log
sudo cat /var/log/cloud-init-output.log | tail -50

# Verify Docker is installed
docker --version

# Verify Docker Compose is installed
docker-compose --version

# Check application directory
ls -la /opt/jobtracker
```

---

### Method 2: Using Oracle Cloud CLI

If you prefer command line:

```bash
# Save cloud-init script to a variable
CLOUD_INIT_FILE="cloud-init/basic-setup.yml"

# Create instance with cloud-init
oci compute instance launch \
  --availability-domain "<AD-NAME>" \
  --compartment-id "<COMPARTMENT_OCID>" \
  --shape "VM.Standard.E4.Flex" \
  --shape-config '{"ocpus":2,"memoryInGBs":8}' \
  --image-id "<IMAGE_OCID>" \
  --subnet-id "<SUBNET_OCID>" \
  --display-name "jobtracker-app" \
  --assign-public-ip true \
  --ssh-authorized-keys-file ~/.ssh/id_rsa.pub \
  --user-data-file "$CLOUD_INIT_FILE"
```

---

## 📝 Customizing Cloud-Init Scripts

### For Private GitHub Repositories

If your repository is private, you need to add authentication.

Edit `cloud-init/full-setup.yml` and find this line (around line 237):

```yaml
# - sudo -u opc git clone https://github.com/Nakeerans/claudeproject.git /opt/jobtracker
```

**Option A - Using Personal Access Token:**

Uncomment and update with your token:
```yaml
- sudo -u opc git clone https://YOUR_GITHUB_TOKEN@github.com/Nakeerans/claudeproject.git /opt/jobtracker
```

**How to get GitHub token:**
1. GitHub → Settings → Developer Settings → Personal Access Tokens
2. Generate new token (classic)
3. Select scope: `repo` (full control of private repositories)
4. Copy the token

**Option B - Using SSH (More Secure):**

Add your SSH key to the server:

```yaml
# Add this to the runcmd section before git clone
- |
  sudo -u opc ssh-keygen -t ed25519 -f /home/opc/.ssh/id_ed25519 -N ""
  sudo -u opc cat /home/opc/.ssh/id_ed25519.pub
  # Copy this public key and add it to GitHub → Settings → SSH Keys
```

### Adding Your API Keys

Edit `cloud-init/full-setup.yml` and update the `.env.template` section:

Find this line:
```yaml
ANTHROPIC_API_KEY=your_anthropic_api_key_here
```

Replace with your actual key:
```yaml
ANTHROPIC_API_KEY=sk-ant-api03-your-actual-key-here
```

**⚠️ SECURITY WARNING:**
- Only do this for test/development environments
- For production, add keys manually after instance creation
- Never commit cloud-init files with real keys to public repositories

---

## 🎯 Quick Comparison

| Feature | No Cloud-Init | basic-setup.yml | full-setup.yml |
|---------|--------------|-----------------|----------------|
| **Docker** | Manual install | ✅ Auto-installed | ✅ Auto-installed |
| **Docker Compose** | Manual install | ✅ Auto-installed | ✅ Auto-installed |
| **Git** | Manual install | ✅ Auto-installed | ✅ Auto-installed |
| **Firewall** | Manual config | ✅ Auto-configured | ✅ Auto-configured |
| **Directories** | Manual creation | ✅ Auto-created | ✅ Auto-created |
| **Environment File** | Manual creation | ❌ | ✅ Auto-created |
| **Secure Secrets** | Manual generation | ❌ | ✅ Auto-generated |
| **Swap Space** | Manual setup | ✅ 2GB created | ✅ 2GB created |
| **Monitoring Tools** | Manual install | ❌ | ✅ Auto-installed |
| **Helpful Aliases** | Manual setup | ❌ | ✅ Auto-configured |
| **Log Rotation** | Manual setup | ❌ | ✅ Auto-configured |
| **Clone Repository** | Manual | ❌ | ⚙️ Optional |
| **Setup Time** | 30-45 min | ~10 min | ~15 min |

---

## 🔍 Monitoring Cloud-Init Progress

### Real-Time Monitoring

While cloud-init is running (first 5-10 minutes after instance creation):

```bash
# SSH to instance
ssh -i ~/.ssh/your-key.pem opc@<INSTANCE_IP>

# Watch cloud-init progress in real-time
sudo tail -f /var/log/cloud-init-output.log

# Press Ctrl+C to stop watching
```

### Check Completion Status

```bash
# Check if cloud-init is done
sudo cloud-init status

# Possible outputs:
# status: running  - Still in progress
# status: done     - Completed successfully
# status: error    - Failed (check logs)

# If status is "done", check the final message
sudo cat /var/log/cloud-init-output.log | grep -A 20 "Final message"
```

### Verify Installation

```bash
# Check all installations
docker --version           # Should show Docker 20.x or higher
docker-compose --version   # Should show 2.x or higher
git --version             # Should show git 2.x

# Check directories
ls -la /opt/jobtracker
ls -la /opt/backups

# Check firewall
sudo firewall-cmd --list-all

# Check if user can run docker
docker ps
```

---

## 🐛 Troubleshooting

### Cloud-Init Doesn't Run

**Symptom**: Docker not installed after 10 minutes

**Solution:**
1. Check cloud-init status: `sudo cloud-init status`
2. View errors: `sudo cat /var/log/cloud-init.log`
3. Re-run manually: `sudo cloud-init init`

### Docker Installation Failed

**Check logs:**
```bash
sudo cat /var/log/cloud-init-output.log | grep -i "docker"
```

**Manual fix:**
```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker opc
```

### Firewall Rules Not Applied

**Check current rules:**
```bash
sudo firewall-cmd --list-all
```

**Apply manually:**
```bash
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --permanent --add-port=3000/tcp
sudo firewall-cmd --reload
```

### Script Syntax Error

**Symptom**: `cloud-init status` shows error

**Solution:**
1. Validate YAML syntax before pasting
2. Use a YAML validator: https://www.yamllint.com/
3. Check for correct indentation (spaces, not tabs)
4. Ensure no special characters in copy-paste

---

## 📚 What Happens After Cloud-Init

Once cloud-init completes (status: done), your server is ready!

### Next Steps:

1. **SSH to Server:**
   ```bash
   ssh -i ~/.ssh/your-key.pem opc@<INSTANCE_IP>
   ```

2. **Clone Your Repository:**
   ```bash
   cd /opt/jobtracker
   git clone https://github.com/Nakeerans/claudeproject.git .
   ```

3. **Configure Environment:**
   ```bash
   cp .env.template .env
   nano .env
   # Add your ANTHROPIC_API_KEY and other secrets
   ```

4. **Deploy Application:**
   ```bash
   docker-compose up -d
   ```

5. **Verify Deployment:**
   ```bash
   docker-compose ps
   curl http://localhost:3000/health
   ```

6. **Access Application:**
   - Open browser: `http://<INSTANCE_IP>:3000`

---

## 💡 Pro Tips

### 1. Save Your Cloud-Init Script

After creating an instance successfully, save the cloud-init script you used:

```bash
# On the instance, view what cloud-init script was used
sudo cat /var/lib/cloud/instance/user-data.txt
```

### 2. Test Cloud-Init Locally

Before using in production, test with a temporary instance:

1. Create test instance with cloud-init
2. Verify everything works
3. Terminate test instance
4. Use same script for production

### 3. Version Control Your Cloud-Init

Keep cloud-init scripts in version control:

```bash
cd /Users/nakeeransaravanan/Devops_practise/claudeproject
git add cloud-init/
git commit -m "Add cloud-init automation scripts"
git push
```

### 4. Create Multiple Variants

Create different cloud-init scripts for different purposes:
- `cloud-init/dev-setup.yml` - Development environment
- `cloud-init/staging-setup.yml` - Staging environment
- `cloud-init/prod-setup.yml` - Production environment

---

## ✅ Recommended Workflow

**For First-Time Setup:**
1. Use `basic-setup.yml`
2. Create instance
3. Wait for cloud-init to complete
4. SSH and verify everything
5. Manually clone repository and deploy
6. Once comfortable, use `full-setup.yml` for future instances

**For Experienced Users:**
1. Customize `full-setup.yml` with your repository URL and keys
2. Create instance
3. Wait 10-15 minutes
4. SSH and deploy (everything pre-configured!)

---

## 🎉 Summary

**Cloud-Init saves you 30-45 minutes of manual setup!**

**With cloud-init:**
- ✅ Create instance → Wait 10 minutes → SSH → Deploy
- ✅ No manual Docker installation
- ✅ No manual firewall configuration
- ✅ No manual directory creation
- ✅ Consistent setup every time

**Without cloud-init:**
- ❌ Create instance → SSH → Install Docker → Install Docker Compose → Configure firewall → Create directories → Configure git → Deploy
- ❌ 30-45 minutes of manual work
- ❌ Easy to forget steps
- ❌ Inconsistent setups

---

**Ready to create your instance with cloud-init? Copy one of the scripts and paste it into the Oracle Cloud console!**
