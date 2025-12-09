# Git Repository Setup & Deployment Guide

This guide will help you push your Job Tracker application to GitHub and set up the remote repository.

---

## ✅ Current Status

Your code has been committed locally with:
- **29 files changed**
- **6,585 insertions**
- Commit message includes all new features and deployment infrastructure

---

## 🚀 Quick Start - Push to GitHub

### Option 1: Create New Repository on GitHub

#### Step 1: Create Repository on GitHub
1. Go to https://github.com/new
2. **Repository name**: `job-tracker` (or your preferred name)
3. **Description**: "Full-stack job tracking application with AI-powered resume/cover letter generation"
4. **Visibility**:
   - ✅ **Private** (recommended initially)
   - Public (if you want to showcase it)
5. **DO NOT** initialize with README, .gitignore, or license (we already have these)
6. Click **"Create repository"**

#### Step 2: Add Remote and Push

```bash
# Add GitHub as remote origin
git remote add origin https://github.com/YOUR_USERNAME/job-tracker.git

# Verify remote was added
git remote -v

# Push to GitHub
git push -u origin main
```

**Replace `YOUR_USERNAME` with your actual GitHub username**

#### Step 3: Verify Upload
1. Visit your repository URL: `https://github.com/YOUR_USERNAME/job-tracker`
2. You should see all 29 files uploaded
3. Check the commit message is visible

---

### Option 2: Push to Existing Repository

If you already have a repository:

```bash
# Check if remote exists
git remote -v

# If no remote, add it
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git

# If remote exists but wrong URL, update it
git remote set-url origin https://github.com/YOUR_USERNAME/YOUR_REPO.git

# Push to main branch
git push -u origin main

# Or if you're on a different branch
git push -u origin $(git branch --show-current)
```

---

## 🔐 Authentication Methods

### Method 1: HTTPS with Personal Access Token (Recommended)

#### Create GitHub Personal Access Token:
1. GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Click "Generate new token (classic)"
3. **Note**: "Job Tracker Deployment"
4. **Expiration**: 90 days (or No expiration)
5. **Select scopes**:
   - ✅ `repo` (Full control of private repositories)
   - ✅ `workflow` (Update GitHub Actions workflows)
6. Click "Generate token"
7. **Copy the token immediately** (you won't see it again!)

#### Use Token for Push:
```bash
# When prompted for password, paste the token
git push -u origin main

# Username: your_github_username
# Password: ghp_xxxxxxxxxxxxxxxxxxxx (your token)
```

#### Cache Credentials (optional):
```bash
# Cache for 1 hour
git config --global credential.helper 'cache --timeout=3600'

# Or store permanently (macOS)
git config --global credential.helper osxkeychain

# Or store permanently (Linux)
git config --global credential.helper store
```

### Method 2: SSH (More Secure, No Password Needed)

#### Setup SSH Key:
```bash
# Generate SSH key (if you don't have one)
ssh-keygen -t ed25519 -C "your_email@example.com"

# Press Enter to accept default location
# Press Enter twice for no passphrase (or enter passphrase for extra security)

# Start SSH agent
eval "$(ssh-agent -s)"

# Add key to agent
ssh-add ~/.ssh/id_ed25519

# Copy public key
cat ~/.ssh/id_ed25519.pub
```

#### Add SSH Key to GitHub:
1. Copy the output from the `cat` command above
2. GitHub → Settings → SSH and GPG keys
3. Click "New SSH key"
4. **Title**: "Job Tracker Development"
5. **Key**: Paste the public key
6. Click "Add SSH key"

#### Use SSH Remote:
```bash
# Add SSH remote
git remote add origin git@github.com:YOUR_USERNAME/job-tracker.git

# Or change existing HTTPS to SSH
git remote set-url origin git@github.com:YOUR_USERNAME/job-tracker.git

# Test connection
ssh -T git@github.com

# Push
git push -u origin main
```

---

## 📋 Repository Setup Checklist

After pushing to GitHub, configure these settings:

### 1. Repository Settings

#### About Section (top right):
- ✅ Description: "Full-stack job tracking application with AI features"
- ✅ Website: (your deployed URL once live)
- ✅ Topics: `react`, `nodejs`, `postgresql`, `job-tracker`, `ai`, `claude-ai`, `oracle-cloud`

#### General Settings:
- ✅ Features:
  - ✅ Issues (for bug tracking)
  - ✅ Projects (for project management)
  - ❌ Wiki (not needed)
  - ❌ Discussions (optional)

### 2. Branch Protection (Recommended for Teams)

**Settings → Branches → Add branch protection rule**

For `main` branch:
- ✅ Require pull request reviews before merging
- ✅ Require status checks to pass before merging
- ✅ Require branches to be up to date before merging
- ✅ Include administrators

### 3. GitHub Actions Secrets

**Settings → Secrets and variables → Actions → New repository secret**

Add these secrets for CI/CD:

```
OCI_REGISTRY=phx.ocir.io
OCI_NAMESPACE=your-tenancy-namespace
OCI_USERNAME=oracleidentitycloudservice/your@email.com
OCI_AUTH_TOKEN=your-oci-auth-token
OCI_HOST=your-server-ip
OCI_USER=opc
OCI_SSH_PRIVATE_KEY=<paste-your-private-key>
PRODUCTION_URL=yourdomain.com
```

### 4. Create README Badges (Optional)

Add to top of README.md:

```markdown
![Build Status](https://github.com/YOUR_USERNAME/job-tracker/workflows/Deploy%20to%20Oracle%20Cloud/badge.svg)
![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)
![React](https://img.shields.io/badge/react-18.0.0-blue.svg)
```

---

## 🎯 Post-Push Tasks

### 1. Verify Files on GitHub
```bash
# Check what was pushed
git log --oneline -1
git diff origin/main

# See remote branches
git branch -r
```

### 2. Clone Test (Verify Repository Works)
```bash
# In a different directory
cd /tmp
git clone https://github.com/YOUR_USERNAME/job-tracker.git test-clone
cd test-clone
ls -la

# Verify all files are there
# Clean up
cd ..
rm -rf test-clone
```

### 3. Setup Collaborators (If Team Project)
**Settings → Collaborators → Add people**

---

## 🔄 Daily Git Workflow

### Making Changes
```bash
# Check status
git status

# Create feature branch (recommended)
git checkout -b feature/new-feature

# Make changes, then:
git add .
git commit -m "Add new feature"

# Push feature branch
git push origin feature/new-feature

# Create Pull Request on GitHub
# After approval, merge to main
```

### Pull Latest Changes
```bash
# Get latest from remote
git pull origin main

# Or if you have local changes
git stash
git pull origin main
git stash pop
```

### Common Commands
```bash
# View commit history
git log --oneline --graph --all

# See what changed
git diff

# Undo last commit (keep changes)
git reset --soft HEAD~1

# Discard all local changes
git reset --hard HEAD

# Create and switch to new branch
git checkout -b feature-name

# Switch branches
git checkout main

# Delete branch
git branch -d feature-name
```

---

## 🚨 Important - Never Commit These!

Already configured in `.gitignore`, but double-check:

❌ `.env` files with real credentials
❌ SSL certificates (`*.pem`, `*.key`)
❌ Database files
❌ `node_modules/`
❌ Upload directories with user files
❌ Backup files (`*.sql`, `*.tar.gz`)

✅ **DO commit**: `.env.example`, `.env.production` (template files)

---

## 🐛 Troubleshooting

### "Permission denied (publickey)"
```bash
# Test SSH connection
ssh -T git@github.com

# If fails, check SSH agent
eval "$(ssh-agent -s)"
ssh-add ~/.ssh/id_ed25519

# Add key to GitHub (see SSH setup above)
```

### "Repository not found"
```bash
# Check remote URL
git remote -v

# Fix URL
git remote set-url origin https://github.com/YOUR_USERNAME/correct-repo.git
```

### "Failed to push some refs"
```bash
# Pull first, then push
git pull origin main --rebase
git push origin main
```

### Large Files Error
```bash
# If you accidentally added large files
git rm --cached path/to/large/file
echo "path/to/large/file" >> .gitignore
git commit -m "Remove large file"
git push
```

### "Updates were rejected"
```bash
# Force push (CAREFUL - only if you're sure)
git push -f origin main

# Better: Pull and merge
git pull origin main
# Resolve conflicts if any
git push origin main
```

---

## 📊 Repository Statistics

After pushing, your repository will show:

- **Languages**:
  - JavaScript (React + Node.js)
  - CSS (Tailwind)
  - Shell (Deployment scripts)

- **Size**: ~15-20 MB

- **Files**: 100+ files
  - Backend: 10+ routes
  - Frontend: 15+ components/pages
  - Documentation: 5+ guides
  - Scripts: 3 automation scripts
  - CI/CD: 2 workflows

---

## 🎉 Next Steps After Pushing

1. ✅ Verify all files are on GitHub
2. ✅ Add repository description and topics
3. ✅ Configure GitHub Actions secrets (for CI/CD)
4. ✅ Set up branch protection (if team project)
5. ✅ Share repository URL with team/stakeholders
6. ✅ Deploy to Oracle Cloud (using deployment guides)
7. ✅ Set up monitoring and alerts

---

## 📞 Need Help?

- **Git Documentation**: https://git-scm.com/doc
- **GitHub Guides**: https://guides.github.com/
- **GitHub Actions**: https://docs.github.com/en/actions

---

## Quick Reference Commands

```bash
# Initial setup
git remote add origin https://github.com/USERNAME/REPO.git
git push -u origin main

# Daily workflow
git pull                    # Get latest
git add .                   # Stage changes
git commit -m "message"     # Commit
git push                    # Push to remote

# Branch management
git checkout -b feature-x   # Create branch
git checkout main           # Switch to main
git merge feature-x         # Merge branch

# Status & info
git status                  # Check status
git log                     # View history
git remote -v              # View remotes
git branch                 # List branches
```

---

**Your code is committed locally and ready to push! Follow Option 1 or Option 2 above to push to GitHub.**
