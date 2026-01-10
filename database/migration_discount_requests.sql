-- Migration: Add Discount Requests Table
-- Run this to add discount request functionality

USE pos_system;

-- Discount requests table
CREATE TABLE IF NOT EXISTS discount_requests (
    id INT PRIMARY KEY AUTO_INCREMENT,
    order_id INT NOT NULL,
    requested_by INT NOT NULL,
    discount_amount DECIMAL(10, 2) NOT NULL,
    reason TEXT NOT NULL,
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    reviewed_by INT NULL,
    reviewed_at TIMESTAMP NULL,
    admin_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (requested_by) REFERENCES users(id) ON DELETE RESTRICT,
    FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_order (order_id),
    INDEX idx_requested_by (requested_by),
    INDEX idx_status (status)
);

