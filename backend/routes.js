import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getDb } from './db.js';
import { authenticateToken, JWT_SECRET } from './server.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Multer storage configuration
const storage = multer.diskStorage({
  destination: path.join(__dirname, 'uploads'),
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (_req, file, cb) => {
    cb(null, file.mimetype.startsWith('image/'));
  }
});

export function setupRoutes(app) {
  const db = getDb();

  // ===== AUTH ENDPOINTS =====

  // Login endpoint
  app.post('/api/auth/login', (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    try {
      const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);

      if (!user || !bcrypt.compareSync(password, user.password_hash)) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
      res.json({ token, user: { id: user.id, username: user.username, role: user.role } });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Register endpoint (admin only)
  app.post('/api/auth/register', authenticateToken, (req, res) => {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can register users' });
    }

    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    try {
      const passwordHash = bcrypt.hashSync(password, 10);
      const result = db.prepare('INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)').run(username, passwordHash, 'admin');
      res.status(201).json({ id: result.lastInsertRowid, username });
    } catch (err) {
      if (err.message.includes('UNIQUE')) {
        return res.status(400).json({ error: 'Username already exists' });
      }
      res.status(500).json({ error: err.message });
    }
  });

  // Get current user
  app.get('/api/auth/me', authenticateToken, (req, res) => {
    try {
      const user = db.prepare('SELECT id, username, role FROM users WHERE id = ?').get(req.user.id);
      res.json(user);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // ===== CATEGORY ENDPOINTS =====

  // Get all categories with subcategories (public)
  app.get('/api/categories', (req, res) => {
    try {
      const categories = db.prepare('SELECT * FROM categories ORDER BY name').all();

      const result = categories.map(cat => {
        const subcategories = db.prepare('SELECT * FROM subcategories WHERE category_id = ? ORDER BY name').all(cat.id);
        return { ...cat, subcategories };
      });

      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Create category (admin)
  app.post('/api/categories', authenticateToken, (req, res) => {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Name required' });
    }

    const slug = name.toLowerCase().replace(/\s+/g, '-');

    try {
      const result = db.prepare('INSERT INTO categories (name, slug) VALUES (?, ?)').run(name, slug);
      res.status(201).json({ id: result.lastInsertRowid, name, slug, subcategories: [] });
    } catch (err) {
      if (err.message.includes('UNIQUE')) {
        return res.status(400).json({ error: 'Category already exists' });
      }
      res.status(500).json({ error: err.message });
    }
  });

  // Update category (admin)
  app.put('/api/categories/:id', authenticateToken, (req, res) => {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Name required' });
    }

    const slug = name.toLowerCase().replace(/\s+/g, '-');

    try {
      const result = db.prepare('UPDATE categories SET name = ?, slug = ? WHERE id = ?').run(name, slug, req.params.id);
      if (result.changes === 0) {
        return res.status(404).json({ error: 'Category not found' });
      }
      res.json({ id: req.params.id, name, slug });
    } catch (err) {
      if (err.message.includes('UNIQUE')) {
        return res.status(400).json({ error: 'Category name already exists' });
      }
      res.status(500).json({ error: err.message });
    }
  });

  // Delete category (admin)
  app.delete('/api/categories/:id', authenticateToken, (req, res) => {
    try {
      const result = db.prepare('DELETE FROM categories WHERE id = ?').run(req.params.id);
      if (result.changes === 0) {
        return res.status(404).json({ error: 'Category not found' });
      }
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // ===== SUBCATEGORY ENDPOINTS =====

  // Create subcategory (admin)
  app.post('/api/categories/:id/subcategories', authenticateToken, (req, res) => {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Name required' });
    }

    const slug = name.toLowerCase().replace(/\s+/g, '-');

    try {
      const result = db.prepare('INSERT INTO subcategories (category_id, name, slug) VALUES (?, ?, ?)').run(req.params.id, name, slug);
      res.status(201).json({ id: result.lastInsertRowid, category_id: parseInt(req.params.id), name, slug });
    } catch (err) {
      if (err.message.includes('UNIQUE')) {
        return res.status(400).json({ error: 'Subcategory already exists for this category' });
      }
      res.status(500).json({ error: err.message });
    }
  });

  // Update subcategory (admin)
  app.put('/api/subcategories/:id', authenticateToken, (req, res) => {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Name required' });
    }

    const slug = name.toLowerCase().replace(/\s+/g, '-');

    try {
      const result = db.prepare('UPDATE subcategories SET name = ?, slug = ? WHERE id = ?').run(name, slug, req.params.id);
      if (result.changes === 0) {
        return res.status(404).json({ error: 'Subcategory not found' });
      }
      res.json({ id: req.params.id, name, slug });
    } catch (err) {
      if (err.message.includes('UNIQUE')) {
        return res.status(400).json({ error: 'Subcategory name already exists for this category' });
      }
      res.status(500).json({ error: err.message });
    }
  });

  // Delete subcategory (admin)
  app.delete('/api/subcategories/:id', authenticateToken, (req, res) => {
    try {
      // First, clear subcategory_id from venues that reference this subcategory
      db.prepare('UPDATE venues SET subcategory_id = NULL WHERE subcategory_id = ?').run(req.params.id);

      // Then delete the subcategory
      const result = db.prepare('DELETE FROM subcategories WHERE id = ?').run(req.params.id);
      if (result.changes === 0) {
        return res.status(404).json({ error: 'Subcategory not found' });
      }
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // ===== VENUE ENDPOINTS =====

  // Upload image endpoint
  app.post('/api/upload', upload.single('image'), (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    const url = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
    res.json({ url });
  });

  // Get all venues for admin (all statuses)
  app.get('/api/admin/venues', authenticateToken, (req, res) => {
    try {
      const rows = db.prepare('SELECT * FROM venues ORDER BY created_at DESC').all();
      console.log('Fetched venues:', rows ? rows.length : 0, 'venues');
      res.json(rows || []);
    } catch (err) {
      console.error('Error fetching venues:', err);
      res.status(500).json({ error: err.message });
    }
  });

  // Get published venues with optional filters (public API)
  app.get('/api/venues', (req, res) => {
    try {
      const { category, lat, lng, radius = 50 } = req.query;
      let query = "SELECT * FROM venues WHERE status = 'published'";
      const params = [];

      if (category) {
        query += ' AND category = ?';
        params.push(category);
      }

      if (lat && lng) {
        // Simple distance calculation (in km)
        const radiusKm = radius / 1000;
        query += ` AND (
          (latitude - ?) * (latitude - ?) +
          (longitude - ?) * (longitude - ?)
        ) < (? * ?)`;
        params.push(lat, lat, lng, lng, radiusKm, radiusKm);
      }

      const rows = db.prepare(query).all(...params);
      res.json(rows);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Get single venue
  app.get('/api/venues/:id', (req, res) => {
    try {
      const row = db.prepare('SELECT * FROM venues WHERE id = ?').get(req.params.id);
      if (!row) {
        return res.status(404).json({ error: 'Venue not found' });
      }
      res.json(row);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Search venue by name (admin)
  app.post('/api/venues/lookup', authenticateToken, async (req, res) => {
    const { query, placeId } = req.body;
    const apiKey = process.env.GOOGLE_PLACES_API_KEY;

    if (!query && !placeId) {
      return res.status(400).json({ error: 'Query required' });
    }

    if (!apiKey) {
      return res.status(500).json({ error: 'API key not configured' });
    }

    try {
      // If placeId is provided, fetch details for that specific place
      if (placeId) {
        const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,formatted_address,geometry,website,formatted_phone_number&key=${apiKey}`;
        const detailsResponse = await fetch(detailsUrl);
        const detailsData = await detailsResponse.json();

        if (!detailsData.result || detailsData.status !== 'OK') {
          return res.json({ results: [] });
        }

        const result = detailsData.result;
        return res.json({
          results: [{
            name: result.name || '',
            address: result.formatted_address || '',
            latitude: result.geometry?.location?.lat || null,
            longitude: result.geometry?.location?.lng || null,
            website_url: result.website || '',
            phone: result.formatted_phone_number || ''
          }]
        });
      }

      // Use Text Search API to find restaurants by name
      const textSearchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&type=restaurant&key=${apiKey}`;
      const searchResponse = await fetch(textSearchUrl);
      const searchData = await searchResponse.json();

      if (!searchData.results || searchData.results.length === 0) {
        return res.json({ results: [] });
      }

      // Return results with place_id for later detail fetching
      const results = searchData.results.map(place => ({
        place_id: place.place_id,
        name: place.name || '',
        address: place.formatted_address || '',
        latitude: place.geometry?.location?.lat || null,
        longitude: place.geometry?.location?.lng || null
      }));

      res.json({ results });
    } catch (error) {
      console.error('Places API error:', error);
      res.json({ results: [] });
    }
  });

  // Create venue (admin)
  app.post('/api/venues', authenticateToken, (req, res) => {
    try {
      const { name, category, subcategory_id, latitude, longitude, address, image_url, website_url, phone_number, reservation_link, rating } = req.body;

      // Validate required fields
      if (!name || !category) {
        return res.status(400).json({ error: 'Name and category are required' });
      }

      const lat = parseFloat(latitude);
      const lng = parseFloat(longitude);

      if (isNaN(lat) || isNaN(lng)) {
        return res.status(400).json({ error: 'Invalid latitude or longitude' });
      }

      // Validate rating if provided
      let parsedRating = null;
      if (rating !== undefined && rating !== null && rating !== '') {
        parsedRating = parseFloat(rating);
        if (isNaN(parsedRating) || parsedRating < 0 || parsedRating > 5) {
          return res.status(400).json({ error: 'Rating must be between 0 and 5' });
        }
      }

      console.log('Creating venue:', name);
      const result = db.prepare(
        `INSERT INTO venues (name, category, subcategory_id, latitude, longitude, address, image_url, website_url, phone_number, reservation_link, rating)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).run(name, category, subcategory_id || null, lat, lng, address || '', image_url || null, website_url || null, phone_number || null, reservation_link || null, parsedRating);
      console.log('Venue created with ID:', result.lastInsertRowid);
      res.status(201).json({ id: result.lastInsertRowid });
    } catch (err) {
      console.error('Error inserting venue:', err);
      res.status(500).json({ error: err.message });
    }
  });

  // Update venue (admin)
  app.put('/api/venues/:id', authenticateToken, (req, res) => {
    try {
      const { name, category, subcategory_id, latitude, longitude, address, image_url, website_url, phone_number, reservation_link, rating } = req.body;

      if (!name || !category) {
        return res.status(400).json({ error: 'Name and category are required' });
      }

      const lat = parseFloat(latitude);
      const lng = parseFloat(longitude);

      if (isNaN(lat) || isNaN(lng)) {
        return res.status(400).json({ error: 'Invalid latitude or longitude' });
      }

      // Validate rating if provided
      let parsedRating = null;
      if (rating !== undefined && rating !== null && rating !== '') {
        parsedRating = parseFloat(rating);
        if (isNaN(parsedRating) || parsedRating < 0 || parsedRating > 5) {
          return res.status(400).json({ error: 'Rating must be between 0 and 5' });
        }
      }

      const result = db.prepare(
        `UPDATE venues SET name=?, category=?, subcategory_id=?, latitude=?, longitude=?, address=?, image_url=?, website_url=?, phone_number=?, reservation_link=?, rating=?, updated_at=CURRENT_TIMESTAMP
         WHERE id = ?`
      ).run(name, category, subcategory_id || null, lat, lng, address || '', image_url || null, website_url || null, phone_number || null, reservation_link || null, parsedRating, req.params.id);
      if (result.changes === 0) {
        return res.status(404).json({ error: 'Venue not found' });
      }
      res.json({ id: req.params.id });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Delete venue (admin)
  app.delete('/api/venues/:id', authenticateToken, (req, res) => {
    try {
      const result = db.prepare('DELETE FROM venues WHERE id = ?').run(req.params.id);
      if (result.changes === 0) {
        return res.status(404).json({ error: 'Venue not found' });
      }
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Update venue status (admin)
  app.patch('/api/venues/:id/status', authenticateToken, (req, res) => {
    try {
      const { status } = req.body;
      if (!['published', 'draft'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
      }
      const result = db.prepare('UPDATE venues SET status=?, updated_at=CURRENT_TIMESTAMP WHERE id=?').run(status, req.params.id);
      if (result.changes === 0) {
        return res.status(404).json({ error: 'Venue not found' });
      }
      res.json({ id: req.params.id, status });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
}
