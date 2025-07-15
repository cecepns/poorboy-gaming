-- Category Management and Game Reports Migration
-- Add this to your MySQL database

USE poorboy_gaming;

-- Game categories table
CREATE TABLE game_categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    color VARCHAR(7) DEFAULT '#6366f1', -- Hex color for UI
    icon VARCHAR(50) DEFAULT 'gamepad', -- Icon name for UI
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Add category_id to games table
ALTER TABLE games ADD COLUMN category_id INT NULL AFTER name;
ALTER TABLE games ADD FOREIGN KEY (category_id) REFERENCES game_categories(id) ON DELETE SET NULL;

-- Game reports table
CREATE TABLE game_reports (
    id INT AUTO_INCREMENT PRIMARY KEY,
    game_id INT NOT NULL,
    user_id INT NOT NULL,
    report_type ENUM('login_error', 'password_error', 'account_locked', 'game_not_working', 'other') NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    status ENUM('pending', 'investigating', 'resolved', 'rejected') DEFAULT 'pending',
    admin_notes TEXT,
    resolved_by INT NULL,
    resolved_at DATETIME NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (resolved_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Insert default game categories
INSERT INTO game_categories (name, description, color, icon, sort_order) VALUES 
('FPS Games', 'First Person Shooter games like CS2, Valorant, etc.', '#ef4444', 'target', 1),
('MOBA Games', 'Multiplayer Online Battle Arena games like Dota 2, League of Legends', '#3b82f6', 'swords', 2),
('RPG Games', 'Role Playing Games like The Witcher, Cyberpunk 2077', '#8b5cf6', 'crown', 3),
('Action Games', 'Action and Adventure games like GTA V, Red Dead Redemption', '#f59e0b', 'zap', 4),
('Strategy Games', 'Strategy and Simulation games', '#10b981', 'chess', 5),
('Sports Games', 'Sports and Racing games', '#06b6d4', 'trophy', 6),
('Indie Games', 'Independent and smaller games', '#84cc16', 'star', 7),
('Other Games', 'Miscellaneous games', '#6b7280', 'gamepad', 8);

-- Update existing games with categories
UPDATE games SET category_id = 1 WHERE name LIKE '%Counter-Strike%' OR name LIKE '%CS2%';
UPDATE games SET category_id = 2 WHERE name LIKE '%Dota%' OR name LIKE '%League%';
UPDATE games SET category_id = 3 WHERE name LIKE '%Witcher%' OR name LIKE '%Cyberpunk%';
UPDATE games SET category_id = 4 WHERE name LIKE '%GTA%' OR name LIKE '%Grand Theft%';
UPDATE games SET category_id = 8 WHERE category_id IS NULL; 