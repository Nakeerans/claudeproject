#!/bin/bash

# Automated Backup Script for Job Tracker
# Backs up both database and uploaded files

set -e

# Configuration
BACKUP_DIR="/opt/backups"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=7
LOG_FILE="/var/log/jobtracker_backup.log"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Logging function
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

error_log() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1" | tee -a "$LOG_FILE"
}

# Create backup directory
mkdir -p "$BACKUP_DIR"

log "=== Starting backup process ==="

# Database backup
log "Backing up database..."
if docker-compose exec -T postgres pg_dump -U jobtracker_user huntr_clone > "$BACKUP_DIR/db_backup_$DATE.sql"; then
    log "✓ Database backed up: db_backup_$DATE.sql"
    DB_SIZE=$(du -h "$BACKUP_DIR/db_backup_$DATE.sql" | cut -f1)
    log "  Size: $DB_SIZE"
else
    error_log "✗ Database backup failed"
    exit 1
fi

# Compress database backup
log "Compressing database backup..."
gzip "$BACKUP_DIR/db_backup_$DATE.sql"
log "✓ Database backup compressed"

# Backup uploaded files
log "Backing up uploaded files..."
if [ -d "./uploads" ]; then
    tar -czf "$BACKUP_DIR/uploads_backup_$DATE.tar.gz" -C . uploads
    log "✓ Uploads backed up: uploads_backup_$DATE.tar.gz"
    UPLOAD_SIZE=$(du -h "$BACKUP_DIR/uploads_backup_$DATE.tar.gz" | cut -f1)
    log "  Size: $UPLOAD_SIZE"
else
    log "⚠ No uploads directory found, skipping..."
fi

# Backup environment file (without sensitive data)
log "Backing up configuration..."
if [ -f ".env" ]; then
    grep -v -E "(PASSWORD|SECRET|API_KEY)" .env > "$BACKUP_DIR/env_backup_$DATE.txt" || true
    log "✓ Configuration backed up (secrets excluded)"
fi

# Remove old backups
log "Cleaning up old backups (older than $RETENTION_DAYS days)..."
REMOVED=$(find "$BACKUP_DIR" -name "db_backup_*.sql.gz" -mtime +$RETENTION_DAYS -delete -print | wc -l)
REMOVED_UPLOADS=$(find "$BACKUP_DIR" -name "uploads_backup_*.tar.gz" -mtime +$RETENTION_DAYS -delete -print | wc -l)
log "✓ Removed $REMOVED old database backups"
log "✓ Removed $REMOVED_UPLOADS old upload backups"

# Calculate total backup size
TOTAL_SIZE=$(du -sh "$BACKUP_DIR" | cut -f1)
log "Total backup directory size: $TOTAL_SIZE"

log "=== Backup completed successfully ==="

# Optional: Upload to Object Storage (uncomment if using OCI Object Storage)
# log "Uploading to OCI Object Storage..."
# oci os object put --bucket-name jobtracker-backups \
#     --file "$BACKUP_DIR/db_backup_$DATE.sql.gz" \
#     --name "db_backup_$DATE.sql.gz"
# log "✓ Uploaded to Object Storage"

exit 0
