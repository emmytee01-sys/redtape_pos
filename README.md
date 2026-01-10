# POS & Inventory Management System

A complete Point of Sale (POS) and Inventory Management System built with Node.js, MySQL, TypeScript, and React.

## Features

- **Role-Based Access Control**: Admin, Manager, Sales Representative, and Accountant roles
- **Product Management**: Add products manually or via CSV upload
- **Order Management**: Create and manage customer orders
- **Payment Processing**: Confirm payments and generate receipts
- **Inventory Tracking**: Real-time stock updates and low stock alerts
- **Reporting**: Sales reports, product performance, and analytics
- **Receipt Generation**: Automatic PDF receipt generation
- **Modern UI**: Beautiful, responsive interface with dashboard widgets

## Tech Stack

### Backend
- Node.js with Express
- TypeScript
- MySQL
- JWT Authentication
- PDF Generation (PDFKit)
- CSV Parsing

### Frontend
- React 18
- TypeScript
- Vite
- React Router
- Axios
- Recharts (for data visualization)
- Lucide React (icons)

## Prerequisites

- Node.js (v18 or higher)
- MySQL (v8.0 or higher)
- npm or yarn

## Setup Instructions

### 1. Database Setup

1. Create a MySQL database:
```sql
mysql -u root -p
CREATE DATABASE pos_system;
```

2. Run the schema:
```bash
mysql -u root -p pos_system < database/schema.sql
```

### 2. Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the `backend` directory:
```env
PORT=3000
NODE_ENV=development

DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=pos_system

JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRES_IN=7d

CORS_ORIGIN=http://localhost:5173
```

4. Seed the database with sample data:
```bash
npm run seed
```

5. Start the backend server:
```bash
npm run dev
```

The backend will run on `http://localhost:3000`

### 3. Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The frontend will run on `http://localhost:5173`

## Default Login Credentials

After seeding the database, you can login with:

- **Admin**: `admin` / `password123`
- **Manager**: `manager` / `password123`
- **Sales Representative**: `sales1` / `password123`
- **Accountant**: `accountant` / `password123`

## Project Structure

```
pos-system/
├── backend/
│   ├── src/
│   │   ├── controllers/     # Request handlers
│   │   ├── routes/          # API routes
│   │   ├── services/        # Business logic
│   │   ├── models/          # Database models
│   │   ├── middlewares/     # Auth & RBAC
│   │   ├── utils/           # Utilities
│   │   ├── app.ts           # Express app
│   │   └── server.ts        # Server entry
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── pages/           # Page components
│   │   ├── components/      # Reusable components
│   │   ├── layouts/         # Layout components
│   │   ├── services/        # API services
│   │   ├── styles/          # Global styles
│   │   └── main.tsx         # Entry point
│   └── package.json
│
└── database/
    └── schema.sql           # Database schema
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login
- `GET /api/auth/profile` - Get current user profile

### Users (Admin only)
- `GET /api/users` - Get all users
- `POST /api/users` - Create user
- `PUT /api/users/:id` - Update user

### Products
- `GET /api/products` - Get all products
- `GET /api/products/:id` - Get product by ID
- `POST /api/products` - Create product (Manager/Admin)
- `PUT /api/products/:id` - Update product (Manager/Admin)
- `POST /api/products/upload-csv` - Upload CSV (Manager/Admin)
- `GET /api/products/low-stock` - Get low stock items

### Orders
- `GET /api/orders` - Get all orders
- `GET /api/orders/:id` - Get order by ID
- `POST /api/orders` - Create order (Sales Rep/Admin/Manager)
- `POST /api/orders/:id/submit` - Submit order for payment

### Payments
- `GET /api/payments` - Get all payments
- `GET /api/payments/:id` - Get payment by ID
- `POST /api/payments` - Create payment (Accountant/Admin)
- `POST /api/payments/:id/confirm` - Confirm payment (Accountant/Admin)
- `GET /api/payments/receipt/:payment_id` - Get receipt

### Reports
- `GET /api/reports/dashboard` - Get dashboard statistics
- `GET /api/reports/sales` - Get sales report
- `GET /api/reports/products` - Get product sales report

## Role Permissions

### Admin
- Full system access
- User management
- All operations

### Manager
- Product management (create, update, CSV upload)
- View orders and payments
- View reports

### Sales Representative
- Create orders
- Submit orders for payment
- View own orders
- View products and stock

### Accountant
- View submitted orders
- Create and confirm payments
- Generate receipts
- View payment records and reports

## CSV Upload Format

When uploading products via CSV, use the following format:

```csv
product_name,sku,category,price,quantity
Laptop Computer,PROD-001,Electronics,999.99,50
Wireless Mouse,PROD-002,Electronics,29.99,100
```

Required columns:
- `product_name` - Product name
- `sku` - Unique SKU code
- `category` - Product category
- `price` - Product price (decimal)
- `quantity` - Initial stock quantity (integer)

## Development

### Backend Development
```bash
cd backend
npm run dev  # Runs with ts-node-dev (auto-reload)
```

### Frontend Development
```bash
cd frontend
npm run dev  # Runs Vite dev server
```

### Building for Production

Backend:
```bash
cd backend
npm run build
npm start
```

Frontend:
```bash
cd frontend
npm run build
npm run preview
```

## Notes

- Receipts are generated as PDF files and stored in the `backend/receipts` directory
- CSV uploads are temporarily stored in `backend/uploads` and cleaned up after processing
- JWT tokens expire after 7 days (configurable in `.env`)
- The system uses a 10% tax rate (configurable in the order controller)

## Troubleshooting

1. **Database Connection Error**: Ensure MySQL is running and credentials in `.env` are correct
2. **Port Already in Use**: Change the PORT in `.env` or kill the process using the port
3. **CORS Errors**: Ensure `CORS_ORIGIN` in backend `.env` matches your frontend URL
4. **Receipt Generation Fails**: Ensure the `receipts` directory exists or is writable

## License

ISC

