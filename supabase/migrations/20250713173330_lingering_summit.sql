-- Poorboy Gaming Database Schema
-- Import this file to your MySQL database

CREATE DATABASE IF NOT EXISTS poorboy_gaming;
USE poorboy_gaming;

-- Users table
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'user') DEFAULT 'user',
    subscription_expiry DATETIME NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Games table
CREATE TABLE games (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    image_url TEXT,
    username VARCHAR(100) NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Subscription plans table
CREATE TABLE subscription_plans (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    duration_days INT NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'IDR',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- User subscriptions history table
CREATE TABLE user_subscriptions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    plan_id INT NOT NULL,
    start_date DATETIME NOT NULL,
    end_date DATETIME NOT NULL,
    amount_paid DECIMAL(10, 2) NOT NULL,
    payment_status ENUM('pending', 'paid', 'failed') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (plan_id) REFERENCES subscription_plans(id) ON DELETE CASCADE
);

-- Insert default admin user (password: admin123)
INSERT INTO users (username, email, password, role) VALUES 
('admin', 'admin@poorboyGaming.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin');

-- Insert default subscription plans
INSERT INTO subscription_plans (name, duration_days, price, currency) VALUES 
('Basic', 30, 50000, 'IDR'),
('Premium', 90, 120000, 'IDR'),
('Ultimate', 180, 200000, 'IDR');

-- Insert sample games
INSERT INTO games (name, image_url, username, password) VALUES 
('Counter-Strike 2', 'https://images.pexels.com/photos/442576/pexels-photo-442576.jpeg', 'cs2_account', 'cs2_password123'),
('Dota 2', 'https://images.pexels.com/photos/1293261/pexels-photo-1293261.jpeg', 'dota2_account', 'dota2_password123'),
('Grand Theft Auto V', 'https://images.pexels.com/photos/1174746/pexels-photo-1174746.jpeg', 'gta5_account', 'gta5_password123'),
('Cyberpunk 2077', 'https://images.pexels.com/photos/2047905/pexels-photo-2047905.jpeg', 'cyberpunk_account', 'cyberpunk_password123'),
('The Witcher 3', 'https://images.pexels.com/photos/1298601/pexels-photo-1298601.jpeg', 'witcher3_account', 'witcher3_password123');