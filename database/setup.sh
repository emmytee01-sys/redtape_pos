#!/bin/bash

# Database Setup Script for POS System
# This script helps set up the MySQL database

set -e

echo "=========================================="
echo "POS System - Database Setup"
echo "=========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if MySQL is installed
if ! command -v mysql &> /dev/null; then
    echo -e "${RED}Error: MySQL client is not installed.${NC}"
    echo "Please install MySQL or use Docker Compose instead."
    echo ""
    echo "To use Docker Compose:"
    echo "  docker-compose up -d"
    exit 1
fi

# Get database credentials
read -p "Enter MySQL root password (or press Enter for no password): " -s MYSQL_PASSWORD
echo ""
read -p "Enter database host [localhost]: " DB_HOST
DB_HOST=${DB_HOST:-localhost}
read -p "Enter database port [3306]: " DB_PORT
DB_PORT=${DB_PORT:-3306}

echo ""
echo -e "${YELLOW}Setting up database...${NC}"

# Create database and run schema
if [ -z "$MYSQL_PASSWORD" ]; then
    mysql -h "$DB_HOST" -P "$DB_PORT" -u root < schema.sql
else
    mysql -h "$DB_HOST" -P "$DB_PORT" -u root -p"$MYSQL_PASSWORD" < schema.sql
fi

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Database setup completed successfully!${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Copy backend/.env.example to backend/.env"
    echo "2. Update the database credentials in backend/.env"
    echo "3. Run 'cd backend && npm run seed' to add sample data"
else
    echo -e "${RED}✗ Database setup failed.${NC}"
    exit 1
fi


