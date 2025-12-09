# Auto-Deploy Setup Checklist

This is everything you need to configure auto-deployment from GitHub to Oracle Cloud.

---

## ✅ Information You Need to Provide

### 1. Oracle Cloud Server Information

#### **SERVER_IP** (Required)
- **What**: Your Oracle Cloud compute instance public IP address
- **Where to find it**:
  - OCI Console → Compute → Instances → Your Instance
  - Look for "Public IP Address"
- **Example**: `129.80.123.45`
- **Your value**: `___________________________`

#### **SSH_USER** (Required)
- **What**: Username to SSH into your server
- **Common values**:
  - `opc` (for Oracle Linux)
  - `ubuntu` (for Ubuntu)
- **Your value**: `___________________________`

#### **PRODUCTION_URL** (Required)
- **What**: Domain name or IP where users will access your app
- **Options**:
  - Your domain: `jobtracker.yourdomain.com`
  - Or just use server IP: Same as SERVER_IP above
- **Your value**: `___________________________`

---

## 📋 Pre-Deployment Requirements

### 2. Oracle Cloud Server Setup

Before auto-deploy works, your server must have:

- [ ] **Server is running and accessible**
  ```bash
  # Test: Can you SSH to it?
  ssh <SSH_USER>@<SERVER_IP>
  ```

- [ ] **Docker installed**
  ```bash
  # Test: SSH to server and run:
  docker --version
  # Should show: Docker version 20.x or higher
  ```

- [ ] **Docker Compose installed**
  ```bash
  # Test: SSH to server and run:
  docker-compose --version
  # Should show: docker-compose version 2.x or higher
  ```

- [ ] **Git installed**
  ```bash
  # Test: SSH to server and run:
  git --version
  # Should show: git version 2.x or higher
  ```

- [ ] **Application directory exists**
  ```bash
  # Test: SSH to server and run:
  ls -la /opt/jobtracker
  # Should exist or be created
  ```

- [ ] **Firewall ports open**
  - Port 22 (SSH) - for deployment
  - Port 80 (HTTP) - for website access
  - Port 443 (HTTPS) - for secure access (if using SSL)
  - Port 3000 (App) - temporary for testing

---

## 🔑 GitHub Information

### 3. GitHub Repository Access

- [ ] **GitHub repository exists**
  - URL: `https://github.com/Nakeerans/claudeproject`
  - You have admin access to this repository

- [ ] **You can push to the repository**
  ```bash
  # Test from your local machine:
  git push claude main
  ```

---

## 🚀 Quick Setup Path

### Option A: Use Automated Setup Script (Easiest!)

**Run this command and it will collect everything for you:**

```bash
cd /Users/nakeeransaravanan/Devops_practise/claudeproject
./scripts/setup-github-deploy.sh
```

**The script will ask you for:**
1. Oracle Cloud server IP address
2. SSH username
3. Production domain/URL

**Then it will automatically:**
- ✅ Generate SSH keys
- ✅ Install them on your server
- ✅ Test the connection
- ✅ Verify server setup
- ✅ Generate all GitHub secrets for you

**You just need to copy the secrets to GitHub!**

---

### Option B: Manual Setup

If you prefer manual setup, you need to provide these values in GitHub:

#### GitHub Secrets to Add

Go to: https://github.com/Nakeerans/claudeproject/settings/secrets/actions

| Secret Name | Description | How to Get It |
|-------------|-------------|---------------|
| `OCI_HOST` | Server IP address | From OCI Console |
| `OCI_USER` | SSH username | Usually `opc` or `ubuntu` |
| `PRODUCTION_URL` | Your domain or IP | Your domain or same as OCI_HOST |
| `OCI_SSH_PRIVATE_KEY` | SSH private key | Generate with setup script |

---

## 📝 Step-by-Step: What You Need to Do RIGHT NOW

### Step 1: Get Your Server Information

**Do you have an Oracle Cloud server?**

- **YES** → Fill in the information above
- **NO** → You need to create one first!

#### If NO - Create Oracle Cloud Server:

Follow these guides:
1. `ORACLE_CLOUD_DEPLOYMENT.md` - How to create OCI server
2. `PRODUCTION_SETUP_GUIDE.md` - How to set it up

**Quick Create:**
```
1. Go to: https://cloud.oracle.com
2. Compute → Instances → Create Instance
3. Name: jobtracker-app
4. Shape: VM.Standard.E4.Flex (2 OCPU, 8GB RAM)
5. Upload your SSH key
6. Create instance
7. Note the Public IP address
```

### Step 2: Run the Setup Script

```bash
cd /Users/nakeeransaravanan/Devops_practise/claudeproject

# Run the automated setup
./scripts/setup-github-deploy.sh
```

**What it will ask:**
```
Enter your Oracle Cloud server IP address: [Type your server IP]
Enter your SSH username: [Type 'opc' or 'ubuntu']
Enter your production domain or IP: [Type your domain or IP]
```

### Step 3: Copy Secrets to GitHub

The script will output something like this:

```
SECRET NAME: OCI_HOST
VALUE:
129.80.123.45

SECRET NAME: OCI_USER
VALUE:
opc

SECRET NAME: PRODUCTION_URL
VALUE:
jobtracker.example.com

SECRET NAME: OCI_SSH_PRIVATE_KEY
VALUE:
-----BEGIN OPENSSH PRIVATE KEY-----
b3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQAAAAAAAAABAAAAMwAAAAtzc2gtZW
...
-----END OPENSSH PRIVATE KEY-----
```

**Add each secret:**
1. Go to: https://github.com/Nakeerans/claudeproject/settings/secrets/actions
2. Click "New repository secret"
3. Name: Copy from "SECRET NAME" above
4. Value: Copy from "VALUE" above
5. Click "Add secret"
6. Repeat for all 4 secrets

### Step 4: Push to GitHub

```bash
# Make sure all changes are committed
git status

# If there are uncommitted changes:
git add .
git commit -m "Ready for auto-deployment"

# Push to GitHub
git push claude main
```

### Step 5: Watch Deployment

1. Go to: https://github.com/Nakeerans/claudeproject/actions
2. You should see "Deploy to Oracle Cloud (Simple)" running
3. Click on it to watch live logs
4. Wait for ✅ success!

---

## 🎯 Summary: What You Need RIGHT NOW

Fill in these 3 values:

```
1. Oracle Cloud Server IP:  _______________________

2. SSH Username:           _______________________

3. Production URL:         _______________________
```

**Once you have these, run:**
```bash
./scripts/setup-github-deploy.sh
```

**That's it!** The script does the rest!

---

## ❓ Don't Have This Information?

### Scenario 1: "I don't have an Oracle Cloud server yet"

**Action**: Create one first
- Follow: `ORACLE_CLOUD_DEPLOYMENT.md` → Option 1 (Quick Start)
- Takes ~15 minutes
- Then come back here

### Scenario 2: "I have a server but don't know the IP"

**Action**: Find it in OCI Console
```
1. Go to: https://cloud.oracle.com
2. Compute → Instances
3. Click on your instance
4. Look for "Public IP Address"
```

### Scenario 3: "I don't know my SSH username"

**Common usernames by OS:**
- Oracle Linux → `opc`
- Ubuntu → `ubuntu`
- CentOS → `centos`

**Test it:**
```bash
ssh opc@<YOUR_IP>
# If that doesn't work, try:
ssh ubuntu@<YOUR_IP>
```

### Scenario 4: "I want to test locally first"

**Action**: Deploy locally with Docker
```bash
cd /Users/nakeeransaravanan/Devops_practise/claudeproject

# Copy environment file
cp .env.production .env

# Edit with your settings
nano .env

# Start with Docker Compose
docker-compose up -d

# Check if it works
curl http://localhost:3000/health
```

---

## 🚨 Common Issues

### "I ran the script but it failed at SSH connection"

**Fix:**
1. Check server IP is correct
2. Check server is running (OCI Console)
3. Check firewall allows SSH (port 22)
4. Try SSH manually: `ssh <user>@<ip>`

### "Script says Docker is not installed"

**Fix:**
```bash
# SSH to your server
ssh <user>@<server-ip>

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
newgrp docker

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.23.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### "GitHub Actions says 'Permission denied (publickey)'"

**Fix:**
1. Make sure you added `OCI_SSH_PRIVATE_KEY` to GitHub secrets
2. Copy the ENTIRE key including `-----BEGIN` and `-----END` lines
3. Don't add extra spaces or newlines

---

## ✅ Quick Validation

Before running setup, verify you can answer YES to all:

- [ ] I have an Oracle Cloud server running
- [ ] I know the server's public IP address
- [ ] I can SSH to the server: `ssh <user>@<ip>`
- [ ] Docker is installed on the server
- [ ] I have admin access to GitHub repository
- [ ] I can push code to GitHub

**All YES?** → Run the setup script!
**Any NO?** → Follow the guides to set those up first

---

## 🎉 Ready to Start?

**Just run this:**

```bash
cd /Users/nakeeransaravanan/Devops_practise/claudeproject
./scripts/setup-github-deploy.sh
```

**The script will guide you through everything!**

---

## 📞 Need Help?

If stuck, check these guides:
- `ORACLE_CLOUD_DEPLOYMENT.md` - Creating OCI server
- `PRODUCTION_SETUP_GUIDE.md` - Server setup
- `GITHUB_AUTO_DEPLOY_SETUP.md` - Detailed auto-deploy guide
- `GIT_DEPLOYMENT_GUIDE.md` - Git setup

Or review the server requirements:
- Docker installed? `docker --version`
- Docker Compose installed? `docker-compose --version`
- Git installed? `git --version`
- Server accessible? `ssh <user>@<ip>`
