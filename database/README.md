# Database Setup Guide

This guide will help you set up the MySQL database for the POS System.

## Option 1: Using Docker Compose (Recommended)

The easiest way to set up the database is using Docker Compose:

```bash
# Start MySQL container
docker-compose up -d

# Check if the container is running
docker-compose ps

# View logs
docker-compose logs mysql
```

The database will be automatically initialized with the schema when the container starts.

### Docker Compose Database Credentials:
- **Host**: localhost
- **Port**: 3306
- **Database**: pos_system
- **Root Password**: rootpassword
- **User**: pos_user
- **Password**: pos_password

## Option 2: Manual MySQL Setup

If you have MySQL installed locally, you can set it up manually:

### Step 1: Create the database and run the schema

```bash
# From the project root
cd database
mysql -u root -p < schema.sql
```

Or use the interactive setup script:

```bash
# Make the script executable (Unix/Mac)
chmod +x setup.sh
./setup.sh

# Or use the Node.js version
node setup.js
```

### Step 2: Configure environment variables

1. Copy the environment template:
   ```bash
   cd ../backend
   cp .env.example .env
   ```

2. Update `backend/.env` with your database credentials:
   ```env
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=your_mysql_password
   DB_NAME=pos_system
   ```

### Step 3: Seed the database with sample data

```bash
cd backend
npm run seed
```

This will create:
- Default roles (admin, manager, sales_rep, accountant)
- Sample users with password: `password123`
- Sample products

## Database Schema

The database includes the following tables:

- **roles** - User roles (admin, manager, sales_rep, accountant)
- **users** - System users with authentication
- **products** - Product catalog with inventory tracking
- **orders** - Customer orders
- **order_items** - Items in each order
- **payments** - Payment records
- **receipts** - Generated receipt information
- **activity_logs** - System activity tracking

## Default Users

After seeding, you can log in with:

| Username | Password | Role |
|----------|----------|------|
| admin | password123 | Admin |
| manager | password123 | Manager |
| sales1 | password123 | Sales Representative |
| accountant | password123 | Accountant |

⚠️ **Important**: Change these passwords in production!

## Troubleshooting

### Connection refused
- Make sure MySQL is running
- Check that the port (3306) is correct
- Verify firewall settings

### Access denied
- Verify username and password in `.env`
- Ensure the database user has proper permissions

### Database not found
- Run the schema.sql file first
- Check that DB_NAME matches the created database

### Docker issues
- Make sure Docker is running
- Try `docker-compose down -v` to remove volumes and restart
- Check logs: `docker-compose logs mysql`

## Resetting the Database

To reset the database:

```bash
# If using Docker
docker-compose down -v
docker-compose up -d

# If using local MySQL
mysql -u root -p -e "DROP DATABASE IF EXISTS pos_system;"
mysql -u root -p < schema.sql
cd ../backend && npm run seed
```


