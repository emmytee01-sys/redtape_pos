-- Migration: Add Settings Tables
-- Run this if you already have the main schema

USE pos_system;

-- Account numbers table
CREATE TABLE IF NOT EXISTS account_numbers (
    id INT PRIMARY KEY AUTO_INCREMENT,
    account_number VARCHAR(50) NOT NULL,
    account_name VARCHAR(255) NOT NULL,
    bank_name VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_active (is_active)
);

-- System settings table
CREATE TABLE IF NOT EXISTS system_settings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insert default system settings (if not exists)
INSERT INTO system_settings (setting_key, setting_value) 
SELECT 'receipt_name', 'Store Receipt'
WHERE NOT EXISTS (SELECT 1 FROM system_settings WHERE setting_key = 'receipt_name');

INSERT INTO system_settings (setting_key, setting_value) 
SELECT 'logo_path', ''
WHERE NOT EXISTS (SELECT 1 FROM system_settings WHERE setting_key = 'logo_path');

