-- Add description field to games table
-- Run this migration to add the description field

USE poorboy_gaming;

-- Add description column to games table
ALTER TABLE games ADD COLUMN description TEXT NULL AFTER image_url;

-- Update existing games with sample descriptions
UPDATE games SET description = 'Counter-Strike 2 adalah game FPS kompetitif terbaru dari Valve. Game ini menampilkan grafis yang ditingkatkan dan mekanik gameplay yang diperbarui.' WHERE name LIKE '%Counter-Strike%' OR name LIKE '%CS2%';

UPDATE games SET description = 'Dota 2 adalah game MOBA yang sangat populer dengan lebih dari 100 hero yang unik. Game ini membutuhkan strategi tim dan skill individu yang tinggi.' WHERE name LIKE '%Dota%';

UPDATE games SET description = 'Grand Theft Auto V adalah game open-world yang menampilkan cerita kriminal di Los Santos. Game ini memiliki grafis yang memukau dan gameplay yang mendalam.' WHERE name LIKE '%GTA%' OR name LIKE '%Grand Theft%';

UPDATE games SET description = 'Cyberpunk 2077 adalah RPG aksi yang berlatar di Night City. Game ini menampilkan cerita yang kompleks dan dunia yang detail dengan grafis next-gen.' WHERE name LIKE '%Cyberpunk%';

UPDATE games SET description = 'The Witcher 3: Wild Hunt adalah RPG aksi yang dianggap sebagai salah satu game terbaik sepanjang masa. Game ini menampilkan cerita yang epik dan dunia yang luas.' WHERE name LIKE '%Witcher%'; 