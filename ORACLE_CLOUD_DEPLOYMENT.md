# Oracle Cloud Infrastructure (OCI) Deployment Guide
## Job Tracker Application

This guide covers deploying the Job Tracker application to Oracle Cloud Infrastructure using multiple deployment options.

---

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Deployment Option 1: OCI Compute Instance (Recommended)](#option-1-oci-compute-instance)
3. [Deployment Option 2: OCI Container Instances](#option-2-oci-container-instances)
4. [Deployment Option 3: OCI Kubernetes Engine (OKE)](#option-3-oci-kubernetes-engine)
5. [Database Setup](#database-setup)
6. [Domain & SSL Configuration](#domain--ssl-configuration)
7. [Monitoring & Logging](#monitoring--logging)

---

## Prerequisites

### 1. Oracle Cloud Account
- Sign up at: https://cloud.oracle.com
- Free tier available with generous limits

### 2. Required Tools
```bash
# Install OCI CLI
bash -c "$(curl -L https://raw.githubusercontent.com/oracle/oci-cli/master/scripts/install/install.sh)"

# Verify installation
oci --version

# Configure OCI CLI
oci setup config
```

### 3. Local Requirements
- Docker installed
- Git
- SSH key pair for server access

---

## Option 1: OCI Compute Instance (Recommended)

This is the simplest and most cost-effective option for small to medium deployments.

### Step 1: Create Compute Instance

1. **Login to OCI Console**: https://cloud.oracle.com
2. **Navigate to**: Compute → Instances → Create Instance

**Instance Configuration:**
- **Name**: `jobtracker-app`
- **Image**: Oracle Linux 8 or Ubuntu 22.04
- **Shape**:
  - Free Tier: `VM.Standard.E2.1.Micro` (1 OCPU, 1GB RAM)
  - Recommended: `VM.Standard.E4.Flex` (2 OCPU, 8GB RAM)
- **Networking**:
  - Create new VCN or use existing
  - Assign public IP
- **Add SSH Keys**: Upload your public SSH key

3. **Note the Public IP** after instance creation

### Step 2: Configure Security Rules

1. **Navigate to**: Networking → Virtual Cloud Networks → Your VCN → Security Lists
2. **Add Ingress Rules**:

```
Port 22   (SSH)        - Your IP only
Port 80   (HTTP)       - 0.0.0.0/0
Port 443  (HTTPS)      - 0.0.0.0/0
Port 3000 (App - temp) - Your IP only (for testing)
Port 5432 (PostgreSQL) - VCN CIDR only
```

### Step 3: Connect to Instance

```bash
ssh -i ~/.ssh/your-key.pem opc@<PUBLIC_IP>
# For Ubuntu: ssh ubuntu@<PUBLIC_IP>
```

### Step 4: Install Dependencies

```bash
# Update system
sudo yum update -y  # Oracle Linux
# OR
sudo apt update && sudo apt upgrade -y  # Ubuntu

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
newgrp docker

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.23.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Install Git
sudo yum install git -y  # Oracle Linux
# OR
sudo apt install git -y  # Ubuntu

# Verify installations
docker --version
docker-compose --version
git --version
```

### Step 5: Setup Firewall (Oracle Linux)

```bash
# Open HTTP and HTTPS ports
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --permanent --add-port=3000/tcp
sudo firewall-cmd --reload
```

**For Ubuntu:**
```bash
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 3000/tcp
sudo ufw enable
```

### Step 6: Clone and Configure Application

```bash
# Create application directory
sudo mkdir -p /opt/jobtracker
sudo chown $USER:$USER /opt/jobtracker
cd /opt/jobtracker

# Clone repository (replace with your repo)
git clone <your-git-repo-url> .
# OR upload your code using scp:
# scp -r -i ~/.ssh/your-key.pem ./claudeproject opc@<PUBLIC_IP>:/opt/jobtracker/

# Create production environment file
cp .env.production .env

# Edit environment variables
nano .env
```

**Configure `.env` file:**
```bash
# Database
DB_NAME=huntr_clone
DB_USER=jobtracker_user
DB_PASSWORD=<GENERATE_STRONG_PASSWORD>
DB_PORT=5432

# Application
NODE_ENV=production
APP_PORT=3000
CLIENT_URL=http://<YOUR_PUBLIC_IP>
LOG_LEVEL=info

# Generate secrets (run these commands):
# JWT_SECRET=$(openssl rand -base64 32)
# SESSION_SECRET=$(openssl rand -base64 32)
JWT_SECRET=<PASTE_GENERATED_SECRET>
SESSION_SECRET=<PASTE_GENERATED_SECRET>

# AI Features
ANTHROPIC_API_KEY=<YOUR_CLAUDE_API_KEY>
```

### Step 7: Deploy Application

```bash
# Build and start containers
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f app

# Wait for database migrations to complete
docker-compose logs app | grep "Migration"
```

### Step 8: Verify Deployment

```bash
# Check health endpoint
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

### Step 9: Access Application

Open browser: `http://<YOUR_PUBLIC_IP>:3000`

---

## Option 2: OCI Container Instances

Oracle Cloud Container Instances provide serverless container deployment.

### Step 1: Build and Push Docker Image

```bash
# Login to OCI Container Registry (OCIR)
docker login <region-key>.ocir.io
# Username: <tenancy-namespace>/<username>
# Password: <auth-token>

# Build image
docker build -t jobtracker:latest .

# Tag for OCIR
docker tag jobtracker:latest <region-key>.ocir.io/<tenancy-namespace>/jobtracker:latest

# Push to registry
docker push <region-key>.ocir.io/<tenancy-namespace>/jobtracker:latest
```

### Step 2: Create Container Instance

1. **Navigate to**: Developer Services → Container Instances → Create Container Instance
2. **Configuration**:
   - Name: `jobtracker-app`
   - Shape: `CI.Standard.E4.Flex` (1 OCPU, 8GB RAM)
   - Image: Select from OCIR
   - Environment Variables: Add all from `.env.production`
   - Networking: Public IP, open ports 3000

### Step 3: Create Database Instance

See [Database Setup](#database-setup) section below.

---

## Option 3: OCI Kubernetes Engine (OKE)

For production-grade, scalable deployments.

### Step 1: Create OKE Cluster

```bash
# Create cluster using OCI CLI
oci ce cluster create \
  --compartment-id <compartment-ocid> \
  --name jobtracker-cluster \
  --kubernetes-version v1.28.2 \
  --vcn-id <vcn-ocid>

# Get cluster ID
CLUSTER_ID=<cluster-ocid>

# Create node pool
oci ce node-pool create \
  --cluster-id $CLUSTER_ID \
  --name jobtracker-nodes \
  --node-shape VM.Standard.E4.Flex \
  --node-shape-config '{"ocpus": 2, "memoryInGBs": 16}' \
  --size 2
```

### Step 2: Configure kubectl

```bash
# Setup kubeconfig
oci ce cluster create-kubeconfig \
  --cluster-id $CLUSTER_ID \
  --file $HOME/.kube/config

# Verify connection
kubectl get nodes
```

### Step 3: Create Kubernetes Manifests

Create `k8s/deployment.yaml`:
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: jobtracker-app
spec:
  replicas: 3
  selector:
    matchLabels:
      app: jobtracker
  template:
    metadata:
      labels:
        app: jobtracker
    spec:
      containers:
      - name: app
        image: <region>.ocir.io/<tenancy>/jobtracker:latest
        ports:
        - containerPort: 3000
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: jobtracker-secrets
              key: database-url
        - name: JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: jobtracker-secrets
              key: jwt-secret
        - name: ANTHROPIC_API_KEY
          valueFrom:
            secretKeyRef:
              name: jobtracker-secrets
              key: anthropic-key
        resources:
          requests:
            memory: "512Mi"
            cpu: "250m"
          limits:
            memory: "1Gi"
            cpu: "500m"
---
apiVersion: v1
kind: Service
metadata:
  name: jobtracker-service
spec:
  type: LoadBalancer
  ports:
  - port: 80
    targetPort: 3000
  selector:
    app: jobtracker
```

### Step 4: Create Secrets

```bash
# Create secrets
kubectl create secret generic jobtracker-secrets \
  --from-literal=database-url='postgresql://user:pass@host:5432/db' \
  --from-literal=jwt-secret='your-jwt-secret' \
  --from-literal=anthropic-key='your-api-key'
```

### Step 5: Deploy

```bash
# Apply configurations
kubectl apply -f k8s/deployment.yaml

# Check status
kubectl get pods
kubectl get services

# Get LoadBalancer IP
kubectl get service jobtracker-service
```

---

## Database Setup

### Option 1: Autonomous Database (Managed)

1. **Navigate to**: Oracle Database → Autonomous Database → Create
2. **Configuration**:
   - Workload: Transaction Processing
   - Database name: `jobtracker_db`
   - Auto-scaling: Enabled
   - Free tier: Available

3. **Download Wallet** for connection

4. **Create User**:
```sql
CREATE USER jobtracker_user IDENTIFIED BY "<strong_password>";
GRANT CONNECT, RESOURCE TO jobtracker_user;
ALTER USER jobtracker_user QUOTA UNLIMITED ON DATA;
```

### Option 2: PostgreSQL on Compute Instance (Co-located)

Already configured in `docker-compose.yml` - PostgreSQL runs alongside the app.

### Option 3: External PostgreSQL (Self-managed)

1. Create separate compute instance
2. Install PostgreSQL:
```bash
sudo yum install postgresql-server -y
sudo postgresql-setup initdb
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

3. Configure for remote access in `/var/lib/pgsql/data/postgresql.conf`:
```
listen_addresses = '*'
```

4. Update `/var/lib/pgsql/data/pg_hba.conf`:
```
host    all    all    10.0.0.0/16    md5
```

---

## Domain & SSL Configuration

### Step 1: Configure Domain

1. **Register Domain** or use existing
2. **Add A Record**:
   - Host: `@` (or `jobtracker`)
   - Value: `<YOUR_PUBLIC_IP>`
   - TTL: 300

### Step 2: Install SSL Certificate (Let's Encrypt)

```bash
# SSH to server
ssh opc@<PUBLIC_IP>

# Install Certbot
sudo yum install certbot python3-certbot-nginx -y  # Oracle Linux
# OR
sudo apt install certbot python3-certbot-nginx -y  # Ubuntu

# Stop app temporarily
cd /opt/jobtracker
docker-compose stop nginx

# Obtain certificate
sudo certbot certonly --standalone -d yourdomain.com -d www.yourdomain.com

# Certificates will be saved to:
# /etc/letsencrypt/live/yourdomain.com/fullchain.pem
# /etc/letsencrypt/live/yourdomain.com/privkey.pem

# Create SSL directory
mkdir -p ssl
sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem ssl/
sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem ssl/
sudo chown $USER:$USER ssl/*

# Update nginx.conf with your domain
nano nginx.conf
# Replace 'yourdomain.com' with your actual domain

# Update docker-compose.yml to enable nginx
# Uncomment or set profile for nginx service

# Restart with nginx
docker-compose --profile production up -d

# Auto-renewal
echo "0 0 * * * certbot renew --quiet && docker-compose restart nginx" | sudo crontab -
```

### Step 3: Update Environment

Update `.env`:
```bash
CLIENT_URL=https://yourdomain.com
GOOGLE_CALLBACK_URL=https://yourdomain.com/api/auth/google/callback
```

Restart app:
```bash
docker-compose restart app
```

---

## Monitoring & Logging

### Application Logs

```bash
# View all logs
docker-compose logs -f

# View app logs only
docker-compose logs -f app

# View last 100 lines
docker-compose logs --tail=100 app

# Follow specific container
docker logs -f jobtracker-app
```

### System Monitoring

```bash
# Check resource usage
docker stats

# Check disk space
df -h

# Check memory
free -h

# Check processes
htop  # Install: sudo yum install htop -y
```

### OCI Monitoring Service

1. **Navigate to**: Observability & Management → Monitoring
2. **Create Alarms** for:
   - CPU usage > 80%
   - Memory usage > 80%
   - Disk usage > 85%

### Setup Log Analytics

1. **Navigate to**: Observability & Management → Logging → Log Groups
2. **Create Log Group**: `jobtracker-logs`
3. **Enable logs** for compute instance

---

## Backup & Recovery

### Database Backup

```bash
# Create backup script
cat > /opt/jobtracker/backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/opt/backups"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

# Backup database
docker-compose exec -T postgres pg_dump -U jobtracker_user huntr_clone > "$BACKUP_DIR/db_backup_$DATE.sql"

# Keep only last 7 days of backups
find $BACKUP_DIR -name "db_backup_*.sql" -mtime +7 -delete

echo "Backup completed: db_backup_$DATE.sql"
EOF

chmod +x /opt/jobtracker/backup.sh

# Schedule daily backups
echo "0 2 * * * /opt/jobtracker/backup.sh >> /var/log/backup.log 2>&1" | crontab -
```

### Restore from Backup

```bash
# Restore database
docker-compose exec -T postgres psql -U jobtracker_user huntr_clone < /opt/backups/db_backup_YYYYMMDD_HHMMSS.sql
```

---

## Scaling & Performance

### Vertical Scaling (Compute Instance)

1. **Stop instance**
2. **Edit Shape**: Change OCPU and memory
3. **Start instance**

### Horizontal Scaling (Load Balancer)

1. **Create multiple compute instances**
2. **Setup OCI Load Balancer**:
   - Navigate to: Networking → Load Balancers
   - Create backend set with all instances
   - Configure health checks

### Database Performance

```sql
-- Create indexes (if not already present from Prisma)
CREATE INDEX IF NOT EXISTS idx_jobs_user_id ON "Job"("userId");
CREATE INDEX IF NOT EXISTS idx_jobs_stage ON "Job"("stage");
CREATE INDEX IF NOT EXISTS idx_interviews_user_id ON "Interview"("userId");
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON "Document"("userId");
```

---

## Security Checklist

- [ ] Strong database passwords
- [ ] JWT_SECRET and SESSION_SECRET are random and secure
- [ ] Firewall configured (ports 22, 80, 443 only)
- [ ] SSH key-based authentication only
- [ ] SSL certificate installed
- [ ] Security groups properly configured
- [ ] Database not publicly accessible
- [ ] Regular backups configured
- [ ] Monitoring and alerts setup
- [ ] Application logs reviewed regularly
- [ ] Dependencies kept up to date

---

## Troubleshooting

### App won't start

```bash
# Check logs
docker-compose logs app

# Check if database is ready
docker-compose exec postgres pg_isready

# Restart everything
docker-compose down
docker-compose up -d
```

### Database connection errors

```bash
# Check DATABASE_URL in .env
cat .env | grep DATABASE_URL

# Test connection
docker-compose exec postgres psql -U jobtracker_user -d huntr_clone -c "SELECT 1"

# Check database logs
docker-compose logs postgres
```

### Port already in use

```bash
# Check what's using the port
sudo lsof -i :3000

# Kill the process
sudo kill -9 <PID>
```

### Out of memory

```bash
# Check memory usage
free -h
docker stats

# Increase swap
sudo dd if=/dev/zero of=/swapfile bs=1G count=2
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

---

## Cost Optimization

### Free Tier Resources (Always Free)
- 2 AMD Compute Instances (1/8 OCPU, 1GB RAM each)
- 2 Oracle Autonomous Databases (20GB each)
- 10GB Object Storage
- 10TB/month outbound data transfer

### Cost-Effective Configuration
- Use Always Free compute instances for development/testing
- Use Flexible Shapes to pay only for what you need
- Setup auto-scaling to reduce costs during low usage
- Use OCI Cost Analysis tools

---

## Support & Resources

- **OCI Documentation**: https://docs.oracle.com/en-us/iaas/
- **OCI Support**: https://support.oracle.com
- **Community**: https://community.oracle.com/cloud/
- **Pricing Calculator**: https://www.oracle.com/cloud/cost-estimator.html

---

## Quick Reference Commands

```bash
# Application Management
docker-compose up -d              # Start application
docker-compose down               # Stop application
docker-compose restart app        # Restart app only
docker-compose logs -f app        # View logs
docker-compose ps                 # Check status

# Database Management
docker-compose exec postgres psql -U jobtracker_user -d huntr_clone  # Connect to DB
docker-compose exec postgres pg_dump -U jobtracker_user huntr_clone > backup.sql  # Backup

# System Management
docker system prune -a            # Clean up Docker
df -h                            # Check disk space
free -h                          # Check memory
htop                             # Process monitor
```

---

## Next Steps After Deployment

1. **Test all features** thoroughly
2. **Setup monitoring alerts**
3. **Configure automated backups**
4. **Document custom configurations**
5. **Setup CI/CD pipeline** (see next section)
6. **Implement remaining Phase 2 features**
7. **Performance testing and optimization**

