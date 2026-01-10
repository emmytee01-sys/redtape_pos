-- Migration: Add Vendors Tables
-- Run this to add vendor functionality

USE pos_system;

-- Vendors table
CREATE TABLE IF NOT EXISTS vendors (
    id INT PRIMARY KEY AUTO_INCREMENT,
    vendor_name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(50),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_vendor_name (vendor_name),
    INDEX idx_active (is_active)
);

-- Vendor products relationship table (many-to-many)
CREATE TABLE IF NOT EXISTS vendor_products (
    id INT PRIMARY KEY AUTO_INCREMENT,
    vendor_id INT NOT NULL,
    product_id INT NOT NULL,
    vendor_sku VARCHAR(100),
    unit_price DECIMAL(10, 2),
    minimum_order_quantity INT DEFAULT 1,
    lead_time_days INT DEFAULT 0,
    is_primary_supplier BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    UNIQUE KEY unique_vendor_product (vendor_id, product_id),
    INDEX idx_vendor (vendor_id),
    INDEX idx_product (product_id)
);

-- Vendor invoices table
CREATE TABLE IF NOT EXISTS vendor_invoices (
    id INT PRIMARY KEY AUTO_INCREMENT,
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    vendor_id INT NOT NULL,
    status ENUM('draft', 'sent', 'confirmed', 'cancelled') DEFAULT 'draft',
    total_amount DECIMAL(10, 2) DEFAULT 0,
    notes TEXT,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE RESTRICT,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_vendor (vendor_id),
    INDEX idx_status (status),
    INDEX idx_invoice_number (invoice_number)
);

-- Vendor invoice items table
CREATE TABLE IF NOT EXISTS vendor_invoice_items (
    id INT PRIMARY KEY AUTO_INCREMENT,
    invoice_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL,
    total_price DECIMAL(10, 2) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (invoice_id) REFERENCES vendor_invoices(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT,
    INDEX idx_invoice (invoice_id),
    INDEX idx_product (product_id)
);

