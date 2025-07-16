const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const CryptoJS = require('crypto-js');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Database connection
const dbConfig = {
  host: "localhost",
  user: "root",
  password: "",
  database: "poorboy_gaming",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

const pool = mysql.createPool(dbConfig);

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, 'your-secret-key', (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// Middleware to verify admin role
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

// Encryption functions
const encryptGameToken = (tokenData) => {
  const jsonString = JSON.stringify(tokenData);
  const encrypted = CryptoJS.AES.encrypt(jsonString, 'your-secret-key').toString();
  return encrypted;
};

const decryptGameToken = (encryptedToken) => {
  try {
    const bytes = CryptoJS.AES.decrypt(encryptedToken, 'your-secret-key');
    const decryptedData = bytes.toString(CryptoJS.enc.Utf8);
    return JSON.parse(decryptedData);
  } catch (error) {
    throw new Error('Invalid token');
  }
};

// Routes

// Auth routes
app.post('/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    const [users] = await pool.execute(
      'SELECT * FROM users WHERE username = ? AND is_active = TRUE',
      [username]
    );

    if (users.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = users[0];
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check subscription expiry for users
    if (user.role === 'user' && user.subscription_expiry && new Date(user.subscription_expiry) <= new Date()) {
      return res.status(401).json({ error: 'Subscription expired' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      'your-secret-key',
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        subscription_expiry: user.subscription_expiry,
        is_active: user.is_active
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/auth/register', async (req, res) => {
  try {
    const { username, email, password, plan_id } = req.body;

    // Check if user exists
    const [existingUsers] = await pool.execute(
      'SELECT id FROM users WHERE username = ? OR email = ?',
      [username, email]
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({ error: 'Username or email already exists' });
    }

    // Get subscription plan
    const [plans] = await pool.execute(
      'SELECT * FROM subscription_plans WHERE id = ? AND is_active = TRUE',
      [plan_id]
    );

    if (plans.length === 0) {
      return res.status(400).json({ error: 'Invalid subscription plan' });
    }

    const plan = plans[0];
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Calculate subscription expiry
    const subscriptionExpiry = new Date();
    subscriptionExpiry.setDate(subscriptionExpiry.getDate() + plan.duration_days);

    // Create user
    const [result] = await pool.execute(
      'INSERT INTO users (username, email, password, subscription_expiry) VALUES (?, ?, ?, ?)',
      [username, email, hashedPassword, subscriptionExpiry]
    );

    // Create subscription record
    await pool.execute(
      'INSERT INTO user_subscriptions (user_id, plan_id, start_date, end_date, amount_paid, payment_status) VALUES (?, ?, NOW(), ?, ?, ?)',
      [result.insertId, plan_id, subscriptionExpiry, plan.price, 'paid']
    );

    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Subscription plans routes
app.get('/subscription-plans', async (req, res) => {
  try {
    const [plans] = await pool.execute(
      'SELECT * FROM subscription_plans WHERE is_active = TRUE ORDER BY duration_days ASC'
    );
    res.json(plans);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/admin/subscription-plans', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const search = req.query.search || '';
    
    let whereClause = '';
    let countWhereClause = '';
    let params = [];
    let countParams = [];
    
    if (search) {
      whereClause = 'WHERE name LIKE ? OR currency LIKE ?';
      countWhereClause = 'WHERE name LIKE ? OR currency LIKE ?';
      const searchParam = `%${search}%`;
      params = [searchParam, searchParam, limit, offset];
      countParams = [searchParam, searchParam];
    } else {
      params = [limit, offset];
    }
    
    // Get total count
    const [countResult] = await pool.execute(
      `SELECT COUNT(*) as total FROM subscription_plans ${countWhereClause}`,
      countParams
    );
    const total = countResult[0].total;
    
    // Get paginated data
    const [plans] = await pool.execute(
      `SELECT * FROM subscription_plans ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      params
    );
    
    res.json({
      data: plans,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/admin/subscription-plans', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { name, duration_days, price, currency, is_active } = req.body;
    
    await pool.execute(
      'INSERT INTO subscription_plans (name, duration_days, price, currency, is_active) VALUES (?, ?, ?, ?, ?)',
      [name, duration_days, price, currency || 'IDR', is_active !== false]
    );

    res.status(201).json({ message: 'Subscription plan created successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.put('/admin/subscription-plans/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, duration_days, price, currency, is_active } = req.body;
    
    await pool.execute(
      'UPDATE subscription_plans SET name = ?, duration_days = ?, price = ?, currency = ?, is_active = ? WHERE id = ?',
      [name, duration_days, price, currency, is_active, id]
    );

    res.json({ message: 'Subscription plan updated successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.delete('/admin/subscription-plans/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    await pool.execute('DELETE FROM subscription_plans WHERE id = ?', [id]);
    res.json({ message: 'Subscription plan deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// User management routes
app.get('/admin/users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const search = req.query.search || '';
    
    let whereClause = 'WHERE role = "user"';
    let countWhereClause = 'WHERE role = "user"';
    let params = [];
    let countParams = [];
    
    if (search) {
      whereClause += ' AND (username LIKE ? OR email LIKE ?)';
      countWhereClause += ' AND (username LIKE ? OR email LIKE ?)';
      const searchParam = `%${search}%`;
      params = [searchParam, searchParam, limit, offset];
      countParams = [searchParam, searchParam];
    } else {
      params = [limit, offset];
    }
    
    // Get total count
    const [countResult] = await pool.execute(
      `SELECT COUNT(*) as total FROM users ${countWhereClause}`,
      countParams
    );
    const total = countResult[0].total;
    
    // Get paginated data
    const [users] = await pool.execute(
      `SELECT id, username, email, role, subscription_expiry, is_active, created_at FROM users ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      params
    );
    
    res.json({
      data: users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/admin/users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { username, email, password, subscription_expiry, is_active } = req.body;
    
    const hashedPassword = await bcrypt.hash(password, 10);
    
    await pool.execute(
      'INSERT INTO users (username, email, password, subscription_expiry, is_active) VALUES (?, ?, ?, ?, ?)',
      [username, email, hashedPassword, subscription_expiry, is_active !== false]
    );

    res.status(201).json({ message: 'User created successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.put('/admin/users/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { username, email, password, subscription_expiry, is_active } = req.body;
    
    let query = 'UPDATE users SET username = ?, email = ?, subscription_expiry = ?, is_active = ?';
    let params = [username, email, subscription_expiry, is_active];
    
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      query += ', password = ?';
      params.push(hashedPassword);
    }
    
    query += ' WHERE id = ?';
    params.push(id);
    
    await pool.execute(query, params);
    res.json({ message: 'User updated successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.delete('/admin/users/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    await pool.execute('DELETE FROM users WHERE id = ?', [id]);
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/admin/users/:id/extend-subscription', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { days } = req.body;
    
    const [users] = await pool.execute('SELECT subscription_expiry FROM users WHERE id = ?', [id]);
    
    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const currentExpiry = users[0].subscription_expiry ? new Date(users[0].subscription_expiry) : new Date();
    const newExpiry = new Date(currentExpiry);
    newExpiry.setDate(newExpiry.getDate() + parseInt(days));
    
    await pool.execute(
      'UPDATE users SET subscription_expiry = ? WHERE id = ?',
      [newExpiry, id]
    );
    
    res.json({ message: 'Subscription extended successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Game management routes
app.get('/admin/games', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const search = req.query.search || '';
    
    let whereClause = '';
    let countWhereClause = '';
    let params = [];
    let countParams = [];
    
    if (search) {
      whereClause = 'WHERE g.name LIKE ? OR c.name LIKE ?';
      countWhereClause = 'WHERE g.name LIKE ? OR c.name LIKE ?';
      const searchParam = `%${search}%`;
      params = [searchParam, searchParam, limit, offset];
      countParams = [searchParam, searchParam];
    } else {
      params = [limit, offset];
    }
    
    // Get total count
    const [countResult] = await pool.execute(
      `SELECT COUNT(*) as total FROM games g LEFT JOIN game_categories c ON g.category_id = c.id ${countWhereClause}`,
      countParams
    );
    const total = countResult[0].total;
    
    // Get paginated data
    const [games] = await pool.execute(
      `SELECT g.*, c.name as category_name, c.color as category_color FROM games g LEFT JOIN game_categories c ON g.category_id = c.id ${whereClause} ORDER BY g.created_at DESC LIMIT ? OFFSET ?`,
      params
    );
    
    res.json({
      data: games,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/admin/games', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { name, image_url, username, password, category_id, description } = req.body;
    
    await pool.execute(
      'INSERT INTO games (name, image_url, username, password, category_id, description) VALUES (?, ?, ?, ?, ?, ?)',
      [name, image_url, username, password, category_id || null, description || null]
    );

    res.status(201).json({ message: 'Game added successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.put('/admin/games/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, image_url, username, password, category_id, description } = req.body;
    
    await pool.execute(
      'UPDATE games SET name = ?, image_url = ?, username = ?, password = ?, category_id = ?, description = ? WHERE id = ?',
      [name, image_url, username, password, category_id || null, description || null, id]
    );

    res.json({ message: 'Game updated successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.delete('/admin/games/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    await pool.execute('DELETE FROM games WHERE id = ?', [id]);
    res.json({ message: 'Game deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Category management routes
app.get('/admin/categories', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const search = req.query.search || '';
    
    let whereClause = '';
    let countWhereClause = '';
    let params = [];
    let countParams = [];
    
    if (search) {
      whereClause = 'WHERE name LIKE ? OR description LIKE ?';
      countWhereClause = 'WHERE name LIKE ? OR description LIKE ?';
      const searchParam = `%${search}%`;
      params = [searchParam, searchParam, limit, offset];
      countParams = [searchParam, searchParam];
    } else {
      params = [limit, offset];
    }
    
    // Get total count
    const [countResult] = await pool.execute(
      `SELECT COUNT(*) as total FROM game_categories ${countWhereClause}`,
      countParams
    );
    const total = countResult[0].total;
    
    // Get paginated data
    const [categories] = await pool.execute(
      `SELECT * FROM game_categories ${whereClause} ORDER BY sort_order ASC, name ASC LIMIT ? OFFSET ?`,
      params
    );
    
    res.json({
      data: categories,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/admin/categories', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { name, description, color, icon, is_active } = req.body;
    
    await pool.execute(
      'INSERT INTO game_categories (name, description, color, icon, is_active) VALUES (?, ?, ?, ?, ?)',
      [name, description, color || '#6366f1', icon || 'gamepad', is_active !== false]
    );

    res.status(201).json({ message: 'Category created successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.put('/admin/categories/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, color, icon, is_active } = req.body;
    
    await pool.execute(
      'UPDATE game_categories SET name = ?, description = ?, color = ?, icon = ?, is_active = ? WHERE id = ?',
      [name, description, color, icon, is_active, id]
    );

    res.json({ message: 'Category updated successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.delete('/admin/categories/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if category is being used by any games
    const [games] = await pool.execute('SELECT COUNT(*) as count FROM games WHERE category_id = ?', [id]);
    
    if (games[0].count > 0) {
      return res.status(400).json({ error: 'Cannot delete category that has games assigned to it' });
    }
    
    await pool.execute('DELETE FROM game_categories WHERE id = ?', [id]);
    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Game reports routes
app.get('/admin/reports', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const search = req.query.search || '';
    const status = req.query.status || '';
    
    let whereClause = '';
    let countWhereClause = '';
    let params = [];
    let countParams = [];
    
    if (search || status) {
      whereClause = 'WHERE';
      countWhereClause = 'WHERE';
      const conditions = [];
      
      if (search) {
        conditions.push('(g.name LIKE ? OR u.username LIKE ? OR r.title LIKE ?)');
        const searchParam = `%${search}%`;
        params.push(searchParam, searchParam, searchParam);
        countParams.push(searchParam, searchParam, searchParam);
      }
      
      if (status && status !== 'all') {
        conditions.push('r.status = ?');
        params.push(status);
        countParams.push(status);
      }
      
      whereClause += ' ' + conditions.join(' AND ');
      countWhereClause += ' ' + conditions.join(' AND ');
    }
    
    params.push(limit, offset);
    
    // Get total count
    const [countResult] = await pool.execute(`
      SELECT COUNT(*) as total 
      FROM game_reports r
      JOIN games g ON r.game_id = g.id
      JOIN users u ON r.user_id = u.id
      LEFT JOIN users a ON r.resolved_by = a.id
      ${countWhereClause}
    `, countParams);
    const total = countResult[0].total;
    
    // Get paginated data
    const [reports] = await pool.execute(`
      SELECT r.*, g.name as game_name, u.username as user_username, 
             a.username as admin_username
      FROM game_reports r
      JOIN games g ON r.game_id = g.id
      JOIN users u ON r.user_id = u.id
      LEFT JOIN users a ON r.resolved_by = a.id
      ${whereClause}
      ORDER BY r.created_at DESC
      LIMIT ? OFFSET ?
    `, params);
    
    res.json({
      data: reports,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.put('/admin/reports/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, admin_notes } = req.body;
    
    let query = 'UPDATE game_reports SET status = ?, admin_notes = ?';
    let params = [status, admin_notes];
    
    if (status === 'resolved') {
      query += ', resolved_by = ?, resolved_at = NOW()';
      params.push(req.user.id);
    }
    
    query += ' WHERE id = ?';
    params.push(id);
    
    await pool.execute(query, params);
    res.json({ message: 'Report updated successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.delete('/admin/reports/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    await pool.execute('DELETE FROM game_reports WHERE id = ?', [id]);
    res.json({ message: 'Report deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// User game access routes
app.get('/user/games', authenticateToken, async (req, res) => {
  try {
    // Check if user subscription is still valid
    const [users] = await pool.execute(
      'SELECT subscription_expiry FROM users WHERE id = ?',
      [req.user.id]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = users[0];
    if (user.subscription_expiry && new Date(user.subscription_expiry) <= new Date()) {
      return res.status(403).json({ error: 'Subscription expired' });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const search = req.query.search || '';
    const category = req.query.category || '';
    
    let whereClause = '';
    let countWhereClause = '';
    let params = [];
    let countParams = [];
    
    if (search || category) {
      whereClause = 'WHERE';
      countWhereClause = 'WHERE';
      const conditions = [];
      
      if (search) {
        conditions.push('g.name LIKE ?');
        const searchParam = `%${search}%`;
        params.push(searchParam);
        countParams.push(searchParam);
      }
      
      if (category) {
        conditions.push('c.name = ?');
        params.push(category);
        countParams.push(category);
      }
      
      whereClause += ' ' + conditions.join(' AND ');
      countWhereClause += ' ' + conditions.join(' AND ');
    }
    
    params.push(limit, offset);
    
    // Get total count
    const [countResult] = await pool.execute(
      `SELECT COUNT(*) as total FROM games g LEFT JOIN game_categories c ON g.category_id = c.id ${countWhereClause}`,
      countParams
    );
    const total = countResult[0].total;
    
    // Get paginated data with category info
    const [games] = await pool.execute(
      `SELECT g.id, g.name, g.image_url, g.description, c.name as category_name, c.color as category_color
       FROM games g
       LEFT JOIN game_categories c ON g.category_id = c.id
       ${whereClause}
       ORDER BY g.name ASC
       LIMIT ? OFFSET ?`,
      params
    );
    
    res.json({
      data: games,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/user/games/:id/token', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if user subscription is still valid
    const [users] = await pool.execute(
      'SELECT subscription_expiry FROM users WHERE id = ?',
      [req.user.id]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = users[0];
    if (user.subscription_expiry && new Date(user.subscription_expiry) <= new Date()) {
      return res.status(403).json({ error: 'Subscription expired' });
    }

    const [games] = await pool.execute(
      'SELECT username, password FROM games WHERE id = ?',
      [id]
    );

    if (games.length === 0) {
      return res.status(404).json({ error: 'Game not found' });
    }

    const game = games[0];
    const tokenData = {
      username: game.username,
      password: game.password,
      expired: user.subscription_expiry
    };

    const encryptedToken = encryptGameToken(tokenData);
    res.json({ token: encryptedToken });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// User game report routes
app.post('/user/games/:id/report', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { report_type, title, description } = req.body;
    
    // Check if user subscription is still valid
    const [users] = await pool.execute(
      'SELECT subscription_expiry FROM users WHERE id = ?',
      [req.user.id]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = users[0];
    if (user.subscription_expiry && new Date(user.subscription_expiry) <= new Date()) {
      return res.status(403).json({ error: 'Subscription expired' });
    }

    // Check if game exists
    const [games] = await pool.execute(
      'SELECT id FROM games WHERE id = ?',
      [id]
    );

    if (games.length === 0) {
      return res.status(404).json({ error: 'Game not found' });
    }

    // Create report
    await pool.execute(
      'INSERT INTO game_reports (game_id, user_id, report_type, title, description) VALUES (?, ?, ?, ?, ?)',
      [id, req.user.id, report_type, title, description]
    );

    res.status(201).json({ message: 'Report submitted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/user/reports', authenticateToken, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const search = req.query.search || '';
    const status = req.query.status || '';
    
    let whereClause = 'WHERE r.user_id = ?';
    let countWhereClause = 'WHERE r.user_id = ?';
    let params = [req.user.id];
    let countParams = [req.user.id];
    
    if (search || status) {
      if (search) {
        whereClause += ' AND (g.name LIKE ? OR r.title LIKE ?)';
        countWhereClause += ' AND (g.name LIKE ? OR r.title LIKE ?)';
        const searchParam = `%${search}%`;
        params.push(searchParam, searchParam);
        countParams.push(searchParam, searchParam);
      }
      
      if (status && status !== 'all') {
        whereClause += ' AND r.status = ?';
        countWhereClause += ' AND r.status = ?';
        params.push(status);
        countParams.push(status);
      }
    }
    
    params.push(limit, offset);
    
    // Get total count
    const [countResult] = await pool.execute(`
      SELECT COUNT(*) as total 
      FROM game_reports r
      JOIN games g ON r.game_id = g.id
      ${countWhereClause}
    `, countParams);
    const total = countResult[0].total;
    
    // Get paginated data
    const [reports] = await pool.execute(`
      SELECT r.*, g.name as game_name
      FROM game_reports r
      JOIN games g ON r.game_id = g.id
      ${whereClause}
      ORDER BY r.created_at DESC
      LIMIT ? OFFSET ?
    `, params);
    
    res.json({
      data: reports,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Dashboard stats
app.get('/admin/stats', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const [totalUsers] = await pool.execute('SELECT COUNT(*) as count FROM users WHERE role = "user"');
    const [activeUsers] = await pool.execute('SELECT COUNT(*) as count FROM users WHERE role = "user" AND is_active = TRUE');
    const [expiredUsers] = await pool.execute('SELECT COUNT(*) as count FROM users WHERE role = "user" AND subscription_expiry <= NOW()');
    const [totalGames] = await pool.execute('SELECT COUNT(*) as count FROM games');
    const [pendingReports] = await pool.execute('SELECT COUNT(*) as count FROM game_reports WHERE status = "pending"');
    const [totalCategories] = await pool.execute('SELECT COUNT(*) as count FROM game_categories WHERE is_active = TRUE');

    res.json({
      totalUsers: totalUsers[0].count,
      activeUsers: activeUsers[0].count,
      expiredUsers: expiredUsers[0].count,
      totalGames: totalGames[0].count,
      pendingReports: pendingReports[0].count,
      totalCategories: totalCategories[0].count
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/user/categories', authenticateToken, async (req, res) => {
  try {
    const [categories] = await pool.execute(
      'SELECT id, name, color, icon FROM game_categories WHERE is_active = TRUE ORDER BY sort_order ASC, name ASC'
    );
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});