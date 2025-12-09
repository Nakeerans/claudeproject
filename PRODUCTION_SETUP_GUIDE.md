# Production Setup Guide - Job Tracker Application

Complete step-by-step guide to deploy Job Tracker to production on Oracle Cloud Infrastructure.

---

## Table of Contents
1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Quick Start Deployment](#quick-start-deployment)
3. [Environment Configuration](#environment-configuration)
4. [Security Hardening](#security-hardening)
5. [Monitoring Setup](#monitoring-setup)
6. [Backup Strategy](#backup-strategy)
7. [CI/CD Setup](#cicd-setup)
8. [Performance Optimization](#performance-optimization)
9. [Troubleshooting](#troubleshooting)

---

## Pre-Deployment Checklist

### ✅ Required Items

- [ ] Oracle Cloud account created
- [ ] Domain name registered (optional but recommended)
- [ ] SSL certificate ready (Let's Encrypt is free)
- [ ] Anthropic API key obtained for AI features
- [ ] SSH key pair generated
- [ ] Git repository setup (GitHub, GitLab, etc.)
- [ ] Strong passwords generated for:
  - [ ] Database password
  - [ ] JWT secret
  - [ ] Session secret

### ✅ Optional Items

- [ ] Google OAuth credentials (for Google sign-in)
- [ ] AWS credentials (for S3 file storage)
- [ ] SMTP credentials (for email notifications)
- [ ] Monitoring service account (DataDog, New Relic, etc.)

---

## Quick Start Deployment

### Step 1: Create OCI Compute Instance

```bash
# Using OCI CLI (fastest method)
oci compute instance launch \
  --availability-domain <AD> \
  --compartment-id <COMPARTMENT_OCID> \
  --shape VM.Standard.E4.Flex \
  --shape-config '{"ocpus": 2, "memoryInGBs": 8}' \
  --image-id <IMAGE_OCID> \
  --subnet-id <SUBNET_OCID> \
  --display-name jobtracker-app \
  --ssh-authorized-keys-file ~/.ssh/id_rsa.pub
```

**Or use the web console:**
1. Navigate to: Compute → Instances → Create Instance
2. Choose shape: `VM.Standard.E4.Flex` (2 OCPU, 8GB RAM)
3. Upload SSH key
4. Note the public IP address

### Step 2: Configure Security

```bash
# Add ingress rules (via CLI or console)
oci network security-list update \
  --security-list-id <SECURITY_LIST_OCID> \
  --ingress-security-rules '[
    {"source": "0.0.0.0/0", "protocol": "6", "tcpOptions": {"destinationPortRange": {"min": 80, "max": 80}}},
    {"source": "0.0.0.0/0", "protocol": "6", "tcpOptions": {"destinationPortRange": {"min": 443, "max": 443}}},
    {"source": "<YOUR_IP>/32", "protocol": "6", "tcpOptions": {"destinationPortRange": {"min": 22, "max": 22}}}
  ]'
```

### Step 3: Connect and Setup

```bash
# Connect to instance
ssh -i ~/.ssh/your-key.pem opc@<PUBLIC_IP>

# Run automated setup script
curl -fsSL https://raw.githubusercontent.com/yourusername/jobtracker/main/scripts/setup-server.sh | bash
```

### Step 4: Deploy Application

```bash
# Clone repository
cd /opt
sudo git clone https://github.com/yourusername/jobtracker.git
sudo chown -R $USER:$USER jobtracker
cd jobtracker

# Configure environment
cp .env.production .env
nano .env  # Edit with your values

# Deploy with Docker Compose
docker-compose up -d

# Check status
docker-compose ps
docker-compose logs -f
```

### Step 5: Verify Deployment

```bash
# Check health
curl http://localhost:3000/health

# Check from outside
curl http://<PUBLIC_IP>:3000/health
```

**Expected response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-12-08T...",
  "service": "huntr-clone-api"
}
```

---

## Environment Configuration

### Production Environment Variables

Create `.env` file with the following:

```bash
# ============================================
# DATABASE CONFIGURATION
# ============================================
DB_NAME=huntr_clone
DB_USER=jobtracker_user
DB_PASSWORD=<GENERATE_STRONG_PASSWORD>
DB_PORT=5432

# ============================================
# APPLICATION CONFIGURATION
# ============================================
NODE_ENV=production
APP_PORT=3000
CLIENT_URL=https://yourdomain.com
LOG_LEVEL=info

# ============================================
# AUTHENTICATION SECRETS
# ============================================
# Generate with: openssl rand -base64 32
JWT_SECRET=<RANDOM_32_CHAR_STRING>
SESSION_SECRET=<RANDOM_32_CHAR_STRING>

# ============================================
# AI FEATURES
# ============================================
ANTHROPIC_API_KEY=sk-ant-api...

# ============================================
# OPTIONAL: GOOGLE OAUTH
# ============================================
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_CALLBACK_URL=https://yourdomain.com/api/auth/google/callback

# ============================================
# OPTIONAL: AWS S3 STORAGE
# ============================================
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_S3_BUCKET=jobtracker-uploads

# ============================================
# OPTIONAL: MONITORING
# ============================================
CLOUDWATCH_LOG_GROUP=/aws/app/huntr-clone
SENTRY_DSN=
```

### Generate Secure Secrets

```bash
# Generate JWT secret
openssl rand -base64 32

# Generate session secret
openssl rand -base64 32

# Generate database password
openssl rand -base64 24 | tr -d "=+/" | cut -c1-20
```

### Validate Configuration

```bash
# Test database connection
docker-compose exec postgres psql -U jobtracker_user -d huntr_clone -c "SELECT 1"

# Test application
curl http://localhost:3000/health

# Check environment variables loaded
docker-compose exec app printenv | grep -E "(NODE_ENV|DATABASE_URL|JWT_SECRET)"
```

---

## Security Hardening

### 1. Firewall Configuration

**Oracle Linux:**
```bash
# Configure firewalld
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --permanent --add-port=22/tcp
sudo firewall-cmd --reload

# Remove temporary app port access
sudo firewall-cmd --permanent --remove-port=3000/tcp
sudo firewall-cmd --reload
```

**Ubuntu:**
```bash
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw deny 3000/tcp  # App should only be accessible via nginx
sudo ufw enable
```

### 2. SSH Hardening

```bash
# Edit SSH config
sudo nano /etc/ssh/sshd_config

# Set these values:
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes
Port 22  # Or change to custom port

# Restart SSH
sudo systemctl restart sshd
```

### 3. SSL Certificate Setup

```bash
# Install Certbot
sudo yum install certbot -y  # Oracle Linux
sudo apt install certbot -y  # Ubuntu

# Stop nginx temporarily (if running)
docker-compose stop nginx

# Obtain certificate
sudo certbot certonly --standalone \
  -d yourdomain.com \
  -d www.yourdomain.com \
  --email your@email.com \
  --agree-tos \
  --no-eff-email

# Copy certificates to project
mkdir -p ssl
sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem ssl/
sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem ssl/
sudo chown $USER:$USER ssl/*

# Update nginx.conf with your domain
sed -i 's/yourdomain.com/your-actual-domain.com/g' nginx.conf

# Start nginx
docker-compose --profile production up -d

# Setup auto-renewal
echo "0 0 * * * certbot renew --quiet && docker-compose restart nginx" | sudo crontab -
```

### 4. Database Security

```bash
# Connect to database
docker-compose exec postgres psql -U postgres

# Create dedicated user with limited privileges
CREATE USER jobtracker_user WITH PASSWORD 'strong_password';
CREATE DATABASE huntr_clone OWNER jobtracker_user;
GRANT ALL PRIVILEGES ON DATABASE huntr_clone TO jobtracker_user;

# Restrict network access (in docker-compose.yml)
# Remove ports mapping for postgres service:
# ports:
#   - "5432:5432"  # REMOVE THIS LINE
```

### 5. Application Security Headers

Already configured in `nginx.conf`:
- Strict-Transport-Security (HSTS)
- X-Frame-Options
- X-Content-Type-Options
- X-XSS-Protection
- Referrer-Policy

### 6. Rate Limiting

Configured in `nginx.conf`:
- API endpoints: 100 requests/minute
- Login endpoints: 5 requests/minute

### 7. File Upload Security

Configured in application:
- Maximum file size: 10MB
- Allowed types: PDF, DOCX, TXT, PNG, JPG
- Files stored outside web root

---

## Monitoring Setup

### 1. Application Logging

```bash
# View live logs
docker-compose logs -f app

# Save logs to file
docker-compose logs app > /var/log/jobtracker/app.log

# Setup log rotation
sudo nano /etc/logrotate.d/jobtracker
```

Add:
```
/var/log/jobtracker/*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 $USER $USER
    sharedscripts
}
```

### 2. Health Monitoring Script

Create `/opt/jobtracker/scripts/healthcheck.sh`:
```bash
#!/bin/bash

HEALTH_URL="http://localhost:3000/health"
LOG_FILE="/var/log/jobtracker/health.log"

response=$(curl -s -o /dev/null -w "%{http_code}" $HEALTH_URL)

if [ "$response" != "200" ]; then
    echo "$(date): UNHEALTHY - HTTP $response" >> $LOG_FILE
    # Restart application
    cd /opt/jobtracker
    docker-compose restart app
    echo "$(date): Application restarted" >> $LOG_FILE
else
    echo "$(date): HEALTHY" >> $LOG_FILE
fi
```

Schedule it:
```bash
chmod +x /opt/jobtracker/scripts/healthcheck.sh
echo "*/5 * * * * /opt/jobtracker/scripts/healthcheck.sh" | crontab -
```

### 3. OCI Monitoring Integration

```bash
# Install OCI monitoring agent
wget https://objectstorage.us-ashburn-1.oraclecloud.com/...
# Follow OCI documentation for your region
```

### 4. Disk Space Monitoring

```bash
# Create monitoring script
cat > /opt/jobtracker/scripts/disk-monitor.sh << 'EOF'
#!/bin/bash
THRESHOLD=80
CURRENT=$(df / | grep / | awk '{ print $5}' | sed 's/%//g')

if [ "$CURRENT" -gt "$THRESHOLD" ]; then
    echo "Disk usage critical: ${CURRENT}%"
    # Clean up Docker
    docker system prune -af --volumes
fi
EOF

chmod +x /opt/jobtracker/scripts/disk-monitor.sh
echo "0 */6 * * * /opt/jobtracker/scripts/disk-monitor.sh" | crontab -
```

---

## Backup Strategy

### 1. Automated Daily Backups

```bash
# Setup automated backups
crontab -e

# Add:
0 2 * * * /opt/jobtracker/scripts/backup.sh >> /var/log/jobtracker/backup.log 2>&1
```

### 2. OCI Object Storage Backup

```bash
# Configure OCI CLI
oci setup config

# Create bucket
oci os bucket create \
  --compartment-id <COMPARTMENT_OCID> \
  --name jobtracker-backups

# Update backup script to upload to OCI
nano /opt/jobtracker/scripts/backup.sh

# Add at the end:
oci os object put \
  --bucket-name jobtracker-backups \
  --file "$BACKUP_DIR/db_backup_$DATE.sql.gz" \
  --name "db_backup_$DATE.sql.gz"
```

### 3. Backup Verification

```bash
# Test backup script
/opt/jobtracker/scripts/backup.sh

# List backups
ls -lh /opt/backups/

# Test restore (on test instance!)
/opt/jobtracker/scripts/restore.sh db_backup_YYYYMMDD_HHMMSS.sql.gz
```

### 4. Disaster Recovery Plan

1. **Backup Retention**: 7 days local, 30 days in Object Storage
2. **Recovery Time Objective (RTO)**: 1 hour
3. **Recovery Point Objective (RPO)**: 24 hours
4. **Backup Verification**: Weekly restore tests

---

## CI/CD Setup

### 1. GitHub Actions Setup

Configure secrets in GitHub repository:

**Settings → Secrets and variables → Actions → New repository secret**

Required secrets:
```
OCI_REGISTRY: phx.ocir.io (or your region)
OCI_NAMESPACE: your-tenancy-namespace
OCI_USERNAME: oracleidentitycloudservice/your-email
OCI_AUTH_TOKEN: <generated-auth-token>
OCI_HOST: <public-ip-of-compute-instance>
OCI_USER: opc
OCI_SSH_PRIVATE_KEY: <paste-private-key>
PRODUCTION_URL: yourdomain.com
```

### 2. Generate OCI Auth Token

1. OCI Console → User Settings → Auth Tokens
2. Generate Token
3. Copy and save (won't be shown again)
4. Add to GitHub Secrets

### 3. Setup SSH for Deployments

```bash
# On your compute instance
cd /opt/jobtracker
sudo chown -R opc:opc .

# Allow password-less Docker commands
sudo usermod -aG docker opc
newgrp docker
```

### 4. Test CI/CD Pipeline

```bash
# Push to main branch
git add .
git commit -m "Test deployment"
git push origin main

# Check GitHub Actions tab in repository
# Monitor deployment progress
```

### 5. Manual Deployment (Alternative)

```bash
# SSH to server
ssh opc@<PUBLIC_IP>

# Pull latest changes
cd /opt/jobtracker
git pull origin main

# Rebuild and restart
docker-compose build app
docker-compose up -d

# Run migrations
docker-compose exec app npx prisma migrate deploy

# Check status
docker-compose ps
curl http://localhost:3000/health
```

---

## Performance Optimization

### 1. Database Optimization

```sql
-- Connect to database
docker-compose exec postgres psql -U jobtracker_user huntr_clone

-- Create indexes for common queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_jobs_user_stage ON "Job"("userId", "stage");
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_jobs_created ON "Job"("createdAt" DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_interviews_date ON "Interview"("scheduledAt");
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_activities_user ON "Activity"("userId", "createdAt" DESC);

-- Analyze tables
ANALYZE "Job";
ANALYZE "Interview";
ANALYZE "Document";
ANALYZE "Activity";

-- Check index usage
SELECT schemaname, tablename, indexname, idx_scan
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;
```

### 2. Application Optimization

```bash
# Enable Node.js production optimizations
# Already set in .env: NODE_ENV=production

# Increase Node.js memory limit if needed
# In docker-compose.yml:
environment:
  - NODE_OPTIONS=--max-old-space-size=2048
```

### 3. Nginx Caching

Add to `nginx.conf`:
```nginx
# Cache static files
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}

# Cache uploaded files
location /uploads/ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

### 4. Connection Pooling

Update Prisma configuration (already optimized in schema):
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  // Connection pool settings
  // Add to DATABASE_URL: ?connection_limit=10&pool_timeout=20
}
```

### 5. Monitoring Performance

```bash
# Monitor application performance
docker stats jobtracker-app

# Check database performance
docker-compose exec postgres pg_stat_statements

# Monitor nginx access logs
docker-compose logs nginx | grep -E "GET|POST" | tail -100
```

---

## Troubleshooting

### Application Won't Start

```bash
# Check logs
docker-compose logs app

# Common issues:
# 1. Database not ready
docker-compose exec postgres pg_isready

# 2. Environment variables missing
docker-compose exec app printenv

# 3. Port already in use
sudo lsof -i :3000
sudo kill -9 <PID>

# 4. Permission issues
sudo chown -R $USER:$USER /opt/jobtracker
```

### Database Connection Errors

```bash
# Check database is running
docker-compose ps postgres

# Check connection string
echo $DATABASE_URL

# Test connection
docker-compose exec postgres psql -U jobtracker_user -d huntr_clone -c "SELECT 1"

# Reset database (CAREFUL!)
docker-compose down -v
docker-compose up -d postgres
docker-compose exec app npx prisma migrate deploy
```

### SSL Certificate Issues

```bash
# Check certificate validity
sudo certbot certificates

# Renew certificate manually
sudo certbot renew

# Fix permissions
sudo chmod 644 ssl/fullchain.pem
sudo chmod 600 ssl/privkey.pem
```

### High Memory Usage

```bash
# Check memory
free -h
docker stats

# Restart application
docker-compose restart app

# Check for memory leaks
docker-compose exec app node --inspect src/server/index.js
```

### Slow Performance

```bash
# Check system resources
htop

# Check database queries
docker-compose exec postgres psql -U jobtracker_user -d huntr_clone \
  -c "SELECT pid, query, state FROM pg_stat_activity WHERE state != 'idle';"

# Check slow queries log
docker-compose logs postgres | grep "duration"

# Analyze database
docker-compose exec postgres psql -U jobtracker_user -d huntr_clone \
  -c "VACUUM ANALYZE;"
```

---

## Maintenance Tasks

### Weekly Tasks
- [ ] Review application logs
- [ ] Check disk space
- [ ] Verify backups are running
- [ ] Review security logs
- [ ] Check SSL certificate expiration

### Monthly Tasks
- [ ] Update dependencies
- [ ] Review and optimize database queries
- [ ] Test backup restore process
- [ ] Review monitoring alerts
- [ ] Update documentation

### Quarterly Tasks
- [ ] Security audit
- [ ] Performance review
- [ ] Cost optimization review
- [ ] Disaster recovery drill

---

## Support & Resources

### Official Documentation
- **Oracle Cloud**: https://docs.oracle.com/en-us/iaas/
- **Docker**: https://docs.docker.com/
- **Prisma**: https://www.prisma.io/docs/
- **Anthropic Claude**: https://docs.anthropic.com/

### Getting Help
- Create issue on GitHub repository
- Check logs: `docker-compose logs`
- Review this guide
- Contact OCI support

---

## Quick Command Reference

```bash
# Start application
docker-compose up -d

# Stop application
docker-compose down

# Restart application
docker-compose restart app

# View logs
docker-compose logs -f app

# Check status
docker-compose ps

# Run migrations
docker-compose exec app npx prisma migrate deploy

# Backup database
/opt/jobtracker/scripts/backup.sh

# Restore database
/opt/jobtracker/scripts/restore.sh <backup-file>

# Check health
curl http://localhost:3000/health

# Update application
git pull origin main
docker-compose build app
docker-compose up -d
```

---

## Conclusion

Your Job Tracker application is now deployed to Oracle Cloud Infrastructure with:

✅ Docker containerization
✅ SSL/HTTPS encryption
✅ Automated backups
✅ Monitoring and logging
✅ CI/CD pipeline
✅ Security hardening
✅ Production-ready configuration

**Next Steps:**
1. Test all features thoroughly
2. Setup monitoring alerts
3. Document any custom configurations
4. Train team on deployment process
5. Implement remaining Phase 2 features

**Need help?** Refer to [ORACLE_CLOUD_DEPLOYMENT.md](./ORACLE_CLOUD_DEPLOYMENT.md) for detailed deployment options.
