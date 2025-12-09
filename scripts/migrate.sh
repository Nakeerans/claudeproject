#!/bin/bash

# Database Migration Script for Job Tracker
# This script handles database migrations in production

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Job Tracker Database Migration ===${NC}\n"

# Check if .env file exists
if [ ! -f .env ]; then
    echo -e "${RED}Error: .env file not found${NC}"
    echo "Please create .env file with DATABASE_URL"
    exit 1
fi

# Load environment variables
source .env

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo -e "${RED}Error: DATABASE_URL not set in .env file${NC}"
    exit 1
fi

echo -e "${YELLOW}Database URL: ${DATABASE_URL//:*@/:****@}${NC}\n"

# Function to run migrations
run_migrations() {
    echo -e "${GREEN}Running Prisma migrations...${NC}"
    npx prisma migrate deploy

    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Migrations completed successfully${NC}"
    else
        echo -e "${RED}✗ Migrations failed${NC}"
        exit 1
    fi
}

# Function to generate Prisma client
generate_client() {
    echo -e "${GREEN}Generating Prisma Client...${NC}"
    npx prisma generate

    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Prisma Client generated${NC}"
    else
        echo -e "${RED}✗ Failed to generate Prisma Client${NC}"
        exit 1
    fi
}

# Function to seed database (optional)
seed_database() {
    if [ -f "prisma/seed.js" ]; then
        echo -e "${GREEN}Seeding database...${NC}"
        node prisma/seed.js

        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✓ Database seeded${NC}"
        else
            echo -e "${YELLOW}⚠ Seeding failed or skipped${NC}"
        fi
    else
        echo -e "${YELLOW}No seed file found, skipping...${NC}"
    fi
}

# Function to verify database connection
verify_connection() {
    echo -e "${GREEN}Verifying database connection...${NC}"
    npx prisma db pull --force --schema=./prisma/schema.prisma > /dev/null 2>&1

    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Database connection verified${NC}"
    else
        echo -e "${RED}✗ Cannot connect to database${NC}"
        exit 1
    fi
}

# Main execution
main() {
    verify_connection
    echo ""

    generate_client
    echo ""

    run_migrations
    echo ""

    # Uncomment to enable seeding
    # seed_database
    # echo ""

    echo -e "${GREEN}=== Migration Complete ===${NC}"
    echo -e "Database is ready for use!"
}

# Run main function
main
