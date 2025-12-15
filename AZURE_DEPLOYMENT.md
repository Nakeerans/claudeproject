# Azure Deployment Guide

Deploy Job Tracker to Azure Free Tier (B1s VM) using GitHub Actions.

## Prerequisites

1. **Azure Account** with Free Tier (12 months free)
2. **Azure Service Principal** for authentication

## Setup Azure Service Principal

```bash
# Login to Azure
az login

# Create service principal
az ad sp create-for-rbac \
  --name "JobTracker-GitHub-Actions" \
  --role contributor \
  --scopes /subscriptions/<YOUR_SUBSCRIPTION_ID>
```

This outputs:
```json
{
  "appId": "xxxxx",
  "displayName": "JobTracker-GitHub-Actions",
  "password": "xxxxx",
  "tenant": "xxxxx"
}
```

## Add GitHub Secrets

Add these 4 secrets to GitHub:
- **Settings → Secrets → Actions → New repository secret**

```
ARM_CLIENT_ID = <appId from above>
ARM_CLIENT_SECRET = <password from above>
ARM_TENANT_ID = <tenant from above>
ARM_SUBSCRIPTION_ID = <your subscription ID>
```

Get subscription ID:
```bash
az account show --query id --output tsv
```

## Deploy Infrastructure

```bash
# Trigger workflow
gh workflow run azure-deploy-infrastructure.yml -f action=apply
```

Or via GitHub UI:
- Actions → Deploy to Azure → Run workflow → apply

## After Deployment

Workflow outputs:
- VM IP address
- SSH command
- GitHub secrets to add

Wait 5 minutes for cloud-init, then:

```bash
# SSH to VM
ssh azureuser@<VM_IP>

# Clone repo
cd /opt/jobtracker
git clone https://github.com/Nakeerans/claudeproject.git .

# Setup environment
cp .env.template .env
nano .env
# Add ANTHROPIC_API_KEY and update CLIENT_URL

# Deploy
docker-compose up -d

# Check status
docker-compose ps
```

Access: `http://<VM_IP>:3000`

## Cost

**Free Tier (12 months):**
- B1s VM: 750 hours/month
- 64 GB storage
- Public IP
- **Total: $0/month**

After 12 months: ~$10-15/month

## Destroy Infrastructure

```bash
gh workflow run azure-deploy-infrastructure.yml -f action=destroy
```

## Troubleshooting

**Cloud-init status:**
```bash
sudo cloud-init status
```

**Check Docker:**
```bash
docker --version
sudo systemctl status docker
```

**View cloud-init logs:**
```bash
sudo cat /var/log/cloud-init-output.log
```

## Benefits vs Oracle Cloud

- ✅ Ubuntu (more reliable than Oracle Linux)
- ✅ Faster cloud-init (no package_upgrade)
- ✅ Docker pre-installed from apt
- ✅ Simpler networking
- ✅ Better GitHub Actions integration
- ✅ 12 months free vs OCI issues
