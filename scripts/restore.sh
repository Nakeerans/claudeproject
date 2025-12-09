#!/bin/bash

# Database Restore Script for Job Tracker
# Restores database from backup file

set -e

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

BACKUP_DIR="/opt/backups"

echo -e "${YELLOW}=== Job Tracker Database Restore ===${NC}\n"

# Check if backup directory exists
if [ ! -d "$BACKUP_DIR" ]; then
    echo -e "${RED}Error: Backup directory not found: $BACKUP_DIR${NC}"
    exit 1
fi

# List available backups
echo -e "${GREEN}Available backups:${NC}"
echo ""
ls -lh "$BACKUP_DIR"/db_backup_*.sql.gz 2>/dev/null | awk '{print $9, "(" $5 ")"}'

if [ $? -ne 0 ]; then
    echo -e "${RED}No backups found in $BACKUP_DIR${NC}"
    exit 1
fi

echo ""

# Get backup file from user
if [ -z "$1" ]; then
    echo -e "${YELLOW}Usage: $0 <backup_file>${NC}"
    echo "Example: $0 db_backup_20241208_120000.sql.gz"
    exit 1
fi

BACKUP_FILE="$BACKUP_DIR/$1"

# Check if backup file exists
if [ ! -f "$BACKUP_FILE" ]; then
    echo -e "${RED}Error: Backup file not found: $BACKUP_FILE${NC}"
    exit 1
fi

echo -e "${YELLOW}Backup file: $BACKUP_FILE${NC}"
echo -e "${YELLOW}Size: $(du -h "$BACKUP_FILE" | cut -f1)${NC}"
echo ""

# Confirmation
echo -e "${RED}WARNING: This will replace the current database!${NC}"
read -p "Are you sure you want to continue? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo "Restore cancelled."
    exit 0
fi

echo ""
echo -e "${GREEN}Starting restore process...${NC}"

# Create a safety backup of current database
echo -e "${YELLOW}Creating safety backup of current database...${NC}"
docker-compose exec -T postgres pg_dump -U jobtracker_user huntr_clone > "$BACKUP_DIR/pre_restore_backup_$(date +%Y%m%d_%H%M%S).sql"
echo -e "${GREEN}✓ Safety backup created${NC}"

# Drop existing connections
echo -e "${YELLOW}Terminating active connections...${NC}"
docker-compose exec -T postgres psql -U jobtracker_user -d postgres -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname='huntr_clone' AND pid <> pg_backend_pid();" > /dev/null 2>&1 || true

# Drop and recreate database
echo -e "${YELLOW}Recreating database...${NC}"
docker-compose exec -T postgres psql -U jobtracker_user -d postgres -c "DROP DATABASE IF EXISTS huntr_clone;" > /dev/null
docker-compose exec -T postgres psql -U jobtracker_user -d postgres -c "CREATE DATABASE huntr_clone;" > /dev/null
echo -e "${GREEN}✓ Database recreated${NC}"

# Restore from backup
echo -e "${YELLOW}Restoring database...${NC}"
if [[ "$BACKUP_FILE" == *.gz ]]; then
    # Decompress and restore
    gunzip -c "$BACKUP_FILE" | docker-compose exec -T postgres psql -U jobtracker_user huntr_clone > /dev/null
else
    # Restore directly
    docker-compose exec -T postgres psql -U jobtracker_user huntr_clone < "$BACKUP_FILE" > /dev/null
fi

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Database restored successfully${NC}"
else
    echo -e "${RED}✗ Database restore failed${NC}"
    echo -e "${YELLOW}Attempting to restore from safety backup...${NC}"
    # Restore safety backup
    docker-compose exec -T postgres psql -U jobtracker_user huntr_clone < "$BACKUP_DIR/pre_restore_backup_"*.sql
    exit 1
fi

# Verify restore
echo -e "${YELLOW}Verifying restore...${NC}"
TABLES=$(docker-compose exec -T postgres psql -U jobtracker_user -d huntr_clone -c "\dt" | grep -c "public" || echo "0")
echo -e "${GREEN}✓ Found $TABLES tables${NC}"

# Restart application
echo -e "${YELLOW}Restarting application...${NC}"
docker-compose restart app
echo -e "${GREEN}✓ Application restarted${NC}"

echo ""
echo -e "${GREEN}=== Restore completed successfully ===${NC}"
echo -e "Database has been restored from: $1"
echo -e "Safety backup saved at: pre_restore_backup_*.sql"

exit 0
