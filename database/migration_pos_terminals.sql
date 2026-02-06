-- Migration: Add POS Terminals and update Payments table
-- Run this to support multiple POS terminals and detailed payment tracking

USE pos_system;

-- 1. Create POS Terminals table
CREATE TABLE IF NOT EXISTS pos_terminals (
    id INT PRIMARY KEY AUTO_INCREMENT,
    bank_name VARCHAR(255) NOT NULL,
    terminal_id VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_active (is_active)
);

-- 2. Add columns to payments table (Checking if they exist first for safety)
-- Adding pos_terminal_id
SET @dbname = DATABASE();
SET @tablename = 'payments';
SET @columnname = 'pos_terminal_id';
SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
   WHERE TABLE_SCHEMA = @dbname
     AND TABLE_NAME = @tablename
     AND COLUMN_NAME = @columnname) > 0,
  'SELECT 1',
  'ALTER TABLE payments ADD COLUMN pos_terminal_id INT NULL'
));
PREPARE stmt FROM @preparedStatement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Adding bank_account_id
SET @columnname = 'bank_account_id';
SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
   WHERE TABLE_SCHEMA = @dbname
     AND TABLE_NAME = @tablename
     AND COLUMN_NAME = @columnname) > 0,
  'SELECT 1',
  'ALTER TABLE payments ADD COLUMN bank_account_id INT NULL'
));
PREPARE stmt FROM @preparedStatement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 3. Add foreign key constraints
-- These will only be added if they don't already exist
SET @dbname = DATABASE();
SET @tablename = 'payments';
SET @fkname = 'fk_payment_pos_terminal';
SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
   WHERE TABLE_SCHEMA = @dbname
     AND TABLE_NAME = @tablename
     AND CONSTRAINT_NAME = @fkname) > 0,
  'SELECT 1',
  'ALTER TABLE payments ADD CONSTRAINT fk_payment_pos_terminal FOREIGN KEY (pos_terminal_id) REFERENCES pos_terminals(id) ON DELETE SET NULL'
));
PREPARE stmt FROM @preparedStatement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @fkname = 'fk_payment_bank_account';
SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
   WHERE TABLE_SCHEMA = @dbname
     AND TABLE_NAME = @tablename
     AND CONSTRAINT_NAME = @fkname) > 0,
  'SELECT 1',
  'ALTER TABLE payments ADD CONSTRAINT fk_payment_bank_account FOREIGN KEY (bank_account_id) REFERENCES account_numbers(id) ON DELETE SET NULL'
));
PREPARE stmt FROM @preparedStatement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
