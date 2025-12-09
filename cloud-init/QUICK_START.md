# Cloud-Init Quick Start Guide

## 🎯 Where to Paste the Cloud-Init Script

When creating an Oracle Cloud instance, follow these exact steps:

---

## Step-by-Step Visual Guide

### 1. Create Instance Page

```
Oracle Cloud Console → Compute → Instances → Create Instance
```

### 2. Scroll Down to "Advanced options"

After filling in:
- ✅ Name
- ✅ Image & shape
- ✅ Networking
- ✅ SSH keys

**Scroll down** until you see:

```
┌─────────────────────────────────────────────────────┐
│  ▼ Advanced options                    [Show]       │
└─────────────────────────────────────────────────────┘
```

**Click [Show]**

### 3. Click the "Management" Tab

You'll see tabs at the top:

```
┌────────────┬────────────┬────────────┬────────────┐
│ Management │   Oracle   │  Networking│ Boot volume│
└────────────┴────────────┴────────────┴────────────┘
```

**Click "Management"**

### 4. Find "Initialization script"

Scroll down in the Management tab until you see:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Initialization script
────────────────────────────────────────────────────

○ Paste cloud-init script
○ Choose cloud-init script files (.yml, .yaml)

┌─────────────────────────────────────────────────┐
│                                                 │
│  [Paste your cloud-init script here]           │
│                                                 │
│                                                 │
└─────────────────────────────────────────────────┘

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### 5. Paste the Script

**Option A - Paste directly:**
1. Select ○ "Paste cloud-init script"
2. Open file: `cloud-init/basic-setup.yml`
3. Copy ALL contents (Ctrl+A, Ctrl+C)
4. Paste in the text box (Ctrl+V)

**Option B - Upload file:**
1. Select ○ "Choose cloud-init script files"
2. Click "Choose files"
3. Navigate to: `claudeproject/cloud-init/`
4. Select: `basic-setup.yml` or `full-setup.yml`
5. Click "Open"

### 6. Create the Instance

**Scroll to bottom** and click:

```
┌──────────────────┐
│  Create          │
└──────────────────┘
```

### 7. Wait for Setup

**Instance Creation:** ~2-3 minutes
**Cloud-Init Setup:** ~5-10 minutes

**Total wait time:** ~10-15 minutes for fully configured server!

---

## 🚀 What to Copy

### For Basic Setup (Recommended First Time):

**File:** `cloud-init/basic-setup.yml`

```bash
# From your project directory
cat /Users/nakeeransaravanan/Devops_practise/claudeproject/cloud-init/basic-setup.yml
```

**Copy everything from:**
```yaml
#cloud-config
# Job Tracker - Basic Oracle Cloud Instance Setup
...
(all lines)
...
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### For Full Setup (Advanced):

**File:** `cloud-init/full-setup.yml`

```bash
# From your project directory
cat /Users/nakeeransaravanan/Devops_practise/claudeproject/cloud-init/full-setup.yml
```

---

## ✅ Verification After Creation

### Wait for Instance to be "Running"

```
OCI Console → Compute → Instances → Your Instance

Status: ● Running  ← Wait for this
```

### Note Your Public IP

```
Instance Details
────────────────
Public IP address: 129.80.123.45  ← Copy this!
```

### Wait for Cloud-Init (5-10 more minutes)

**SSH to instance:**
```bash
ssh -i ~/.ssh/your-key.pem opc@<PUBLIC_IP>
```

**Check cloud-init status:**
```bash
sudo cloud-init status
```

**Wait until you see:**
```
status: done
```

**View completion message:**
```bash
sudo cat /var/log/cloud-init-output.log | tail -50
```

**You should see:**
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Job Tracker Server Setup Complete!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Installed:
- ✅ Docker
- ✅ Docker Compose
- ✅ Git
- ✅ Firewall configured
...
```

### Quick Verification Commands

```bash
# All these should work without errors:

docker --version
# Output: Docker version 24.0.x

docker-compose --version
# Output: docker-compose version 2.23.x

git --version
# Output: git version 2.x

ls -la /opt/jobtracker
# Output: Should show directory with files

docker ps
# Output: Should show "no running containers" (not an error)
```

**✅ If all commands work → Cloud-init succeeded!**

---

## 🎯 Next Steps After Cloud-Init Completes

### 1. Clone Your Repository

```bash
cd /opt/jobtracker
git clone https://github.com/Nakeerans/claudeproject.git .
```

### 2. Configure Environment

```bash
cp .env.production .env
nano .env

# Update these values:
# - ANTHROPIC_API_KEY=your_actual_key
# - CLIENT_URL=http://<YOUR_PUBLIC_IP>
# - JWT_SECRET and SESSION_SECRET (generate with: openssl rand -base64 32)
```

### 3. Deploy Application

```bash
docker-compose up -d
```

### 4. Check Status

```bash
docker-compose ps
docker-compose logs -f app
```

### 5. Access Application

Open browser:
```
http://<YOUR_PUBLIC_IP>:3000
```

---

## 🎨 Visual Summary

```
┌─────────────────────────────────────────────────────┐
│  1. Create Instance Page                            │
├─────────────────────────────────────────────────────┤
│  Fill in: Name, Image, Shape, Network, SSH key     │
└─────────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────┐
│  2. Click "Advanced options" → [Show]               │
└─────────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────┐
│  3. Click "Management" tab                          │
└─────────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────┐
│  4. Find "Initialization script" section            │
└─────────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────┐
│  5. Paste cloud-init script content                 │
│     OR upload .yml file                             │
└─────────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────┐
│  6. Click "Create" button at bottom                 │
└─────────────────────────────────────────────────────┘
                      ↓
         Wait 10-15 minutes
                      ↓
┌─────────────────────────────────────────────────────┐
│  ✅ Server ready with Docker, Git, everything!      │
└─────────────────────────────────────────────────────┘
```

---

## 💡 Pro Tips

### Tip 1: Open Script in Text Editor First

Before creating instance:
```bash
# Open the script to review
code /Users/nakeeransaravanan/Devops_practise/claudeproject/cloud-init/basic-setup.yml

# Or
nano /Users/nakeeransaravanan/Devops_practise/claudeproject/cloud-init/basic-setup.yml
```

### Tip 2: Keep Script File Ready

Have the `.yml` file ready to upload instead of copy-paste:
- Less error-prone
- Preserves formatting
- Faster

### Tip 3: Save Public IP Immediately

As soon as instance is created:
1. Copy the Public IP
2. Save it somewhere
3. You'll need it for:
   - SSH access
   - Auto-deploy setup
   - Accessing application

### Tip 4: Monitor Cloud-Init in Real-Time

SSH to instance immediately after creation:
```bash
ssh -i ~/.ssh/your-key.pem opc@<IP>

# Watch cloud-init progress live
sudo tail -f /var/log/cloud-init-output.log
```

---

## ❓ FAQs

**Q: Can I use cloud-init with Ubuntu instead of Oracle Linux?**

A: Yes! The scripts work with both. Change firewall commands:
```yaml
# For Ubuntu, replace firewall-cmd commands with:
- sudo ufw allow 22/tcp
- sudo ufw allow 80/tcp
- sudo ufw allow 443/tcp
- sudo ufw allow 3000/tcp
- sudo ufw enable
```

**Q: What if I forgot to add cloud-init script?**

A: You can run it manually after creation:
```bash
# SSH to instance
# Download script
wget https://raw.githubusercontent.com/Nakeerans/claudeproject/main/cloud-init/basic-setup.yml

# Run cloud-init with the script
sudo cloud-init init
sudo cloud-init modules --mode=config
sudo cloud-init modules --mode=final
```

**Q: Can I see what cloud-init did?**

A: Yes, check the logs:
```bash
sudo cat /var/log/cloud-init-output.log
sudo cat /var/log/cloud-init.log
```

**Q: How do I know if cloud-init failed?**

A: Check status:
```bash
sudo cloud-init status

# If shows "status: error"
# View error details:
sudo cat /var/log/cloud-init.log | grep -i error
```

---

## 🎉 You're Ready!

**Just remember:**
1. Advanced options → Show
2. Management tab
3. Initialization script
4. Paste or upload cloud-init script
5. Create instance
6. Wait 10-15 minutes
7. Fully configured server! ✅

**Files to use:**
- Beginners: `cloud-init/basic-setup.yml`
- Advanced: `cloud-init/full-setup.yml`

**Happy deploying! 🚀**
