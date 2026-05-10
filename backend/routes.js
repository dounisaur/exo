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

    db.get('SELECT * FROM users WHERE username = ?', [username], (err, user) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      if (!user || !bcrypt.compareSync(password, user.password_hash)) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
      res.json({ token, user: { id: user.id, username: user.username, role: user.role } });
    });
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

    const passwordHash = bcrypt.hashSync(password, 10);
    db.run(
      'INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)',
      [username, passwordHash, 'admin'],
      function(err) {
        if (err) {
          if (err.message.includes('UNIQUE')) {
            return res.status(400).json({ error: 'Username already exists' });
          }
          return res.status(500).json({ error: err.message });
        }
        res.status(201).json({ id: this.lastID, username });
      }
    );
  });

  // Get current user
  app.get('/api/auth/me', authenticateToken, (req, res) => {
    db.get('SELECT id, username, role FROM users WHERE id = ?', [req.user.id], (err, user) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json(user);
    });
  });

  // ===== CATEGORY ENDPOINTS =====

  // Get all categories with subcategories (public)
  app.get('/api/categories', (req, res) => {
    db.all('SELECT * FROM categories ORDER BY name', [], (err, categories) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      if (!categories.length) {
        return res.json([]);
      }

      // Fetch subcategories for each category
      let processed = 0;
      const result = categories.map(cat => ({ ...cat, subcategories: [] }));

      categories.forEach((cat, idx) => {
        db.all(
          'SELECT * FROM subcategories WHERE category_id = ? ORDER BY name',
          [cat.id],
          (err, subcats) => {
            if (!err && subcats) {
              result[idx].subcategories = subcats;
            }
            processed++;
            if (processed === categories.length) {
              res.json(result);
            }
          }
        );
      });
    });
  });

  // Create category (admin)
  app.post('/api/categories', authenticateToken, (req, res) => {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Name required' });
    }

    const slug = name.toLowerCase().replace(/\s+/g, '-');

    db.run(
      'INSERT INTO categories (name, slug) VALUES (?, ?)',
      [name, slug],
      function(err) {
        if (err) {
          if (err.message.includes('UNIQUE')) {
            return res.status(400).json({ error: 'Category already exists' });
          }
          return res.status(500).json({ error: err.message });
        }
        res.status(201).json({ id: this.lastID, name, slug, subcategories: [] });
      }
    );
  });

  // Update category (admin)
  app.put('/api/categories/:id', authenticateToken, (req, res) => {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Name required' });
    }

    const slug = name.toLowerCase().replace(/\s+/g, '-');

    db.run(
      'UPDATE categories SET name = ?, slug = ? WHERE id = ?',
      [name, slug, req.params.id],
      function(err) {
        if (err) {
          if (err.message.includes('UNIQUE')) {
            return res.status(400).json({ error: 'Category name already exists' });
          }
          return res.status(500).json({ error: err.message });
        }
        if (this.changes === 0) {
          return res.status(404).json({ error: 'Category not found' });
        }
        res.json({ id: req.params.id, name, slug });
      }
    );
  });

  // Delete category (admin)
  app.delete('/api/categories/:id', authenticateToken, (req, res) => {
    db.run('DELETE FROM categories WHERE id = ?', [req.params.id], function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Category not found' });
      }
      res.json({ success: true });
    });
  });

  // ===== SUBCATEGORY ENDPOINTS =====

  // Create subcategory (admin)
  app.post('/api/categories/:id/subcategories', authenticateToken, (req, res) => {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Name required' });
    }

    const slug = name.toLowerCase().replace(/\s+/g, '-');

    db.run(
      'INSERT INTO subcategories (category_id, name, slug) VALUES (?, ?, ?)',
      [req.params.id, name, slug],
      function(err) {
        if (err) {
          if (err.message.includes('UNIQUE')) {
            return res.status(400).json({ error: 'Subcategory already exists for this category' });
          }
          return res.status(500).json({ error: err.message });
        }
        res.status(201).json({ id: this.lastID, category_id: parseInt(req.params.id), name, slug });
      }
    );
  });

  // Update subcategory (admin)
  app.put('/api/subcategories/:id', authenticateToken, (req, res) => {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Name required' });
    }

    const slug = name.toLowerCase().replace(/\s+/g, '-');

    db.run(
      'UPDATE subcategories SET name = ?, slug = ? WHERE id = ?',
      [name, slug, req.params.id],
      function(err) {
        if (err) {
          if (err.message.includes('UNIQUE')) {
            return res.status(400).json({ error: 'Subcategory name already exists for this category' });
          }
          return res.status(500).json({ error: err.message });
        }
        if (this.changes === 0) {
          return res.status(404).json({ error: 'Subcategory not found' });
        }
        res.json({ id: req.params.id, name, slug });
      }
    );
  });

  // Delete subcategory (admin)
  app.delete('/api/subcategories/:id', authenticateToken, (req, res) => {
    db.run('DELETE FROM subcategories WHERE id = ?', [req.params.id], function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Subcategory not found' });
      }
      res.json({ success: true });
    });
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
    db.all('SELECT * FROM venues ORDER BY created_at DESC', [], (err, rows) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json(rows);
    });
  });

  // Get published venues with optional filters (public API)
  app.get('/api/venues', (req, res) => {
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

    db.all(query, params, (err, rows) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json(rows);
    });
  });

  // Get single venue
  app.get('/api/venues/:id', (req, res) => {
    db.get('SELECT * FROM venues WHERE id = ?', [req.params.id], (err, row) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (!row) {
        return res.status(404).json({ error: 'Venue not found' });
      }
      res.json(row);
    });
  });

  // Lookup venue from Google Maps URL or search by name (admin)
  app.post('/api/venues/lookup', authenticateToken, async (req, res) => {
    const { type, query } = req.body;
    const apiKey = process.env.GOOGLE_PLACES_API_KEY;

    if (!query) {
      return res.status(400).json({ error: 'Query required' });
    }

    if (!apiKey) {
      return res.status(500).json({ error: 'API key not configured' });
    }

    try {
      let placeId = null;

      // If URL type, extract place_id
      if (type === 'url') {
        // Try to extract from long URL first
        let urlToUse = query;
        let match = query.match(/1s(ChIJ[^!]+)!/);
        placeId = match?.[1];

        // If no place_id found, try to follow redirect (for short URLs like maps.app.goo.gl)
        if (!placeId) {
          try {
            const response = await fetch(query, { redirect: 'follow' });
            const fullUrl = response.url;
            match = fullUrl.match(/1s(ChIJ[^!]+)!/);
            placeId = match?.[1];
          } catch (err) {
            // If redirect fails, return no results
          }
        }

        if (!placeId) {
          return res.json({ results: [] });
        }
      }

      // If search type, use Text Search API to find place_id
      if (type === 'search' && !placeId) {
        const textSearchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&type=restaurant&fields=place_id,name,formatted_address,geometry,website,formatted_phone_number&key=${apiKey}`;
        const searchResponse = await fetch(textSearchUrl);
        const searchData = await searchResponse.json();

        if (!searchData.results || searchData.results.length === 0) {
          return res.json({ results: [] });
        }

        // Return all results for the search type
        const results = searchData.results.map(place => ({
          place_id: place.place_id,
          name: place.name || '',
          address: place.formatted_address || '',
          latitude: place.geometry?.location?.lat || null,
          longitude: place.geometry?.location?.lng || null,
          website_url: place.website || '',
          phone: place.formatted_phone_number || ''
        }));

        return res.json({ results });
      }

      // For URL type or if we have a place_id, fetch full details
      if (placeId) {
        const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,formatted_address,geometry,website,formatted_phone_number&key=${apiKey}`;
        const response = await fetch(detailsUrl);
        const data = await response.json();

        if (!data.result || data.status !== 'OK') {
          return res.json({ results: [] });
        }

        const result = data.result;
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

      res.json({ results: [] });
    } catch (error) {
      console.error('Places API error:', error);
      res.json({ results: [] });
    }
  });

  // Create venue (admin)
  app.post('/api/venues', authenticateToken, (req, res) => {
    const { name, category, subcategory_id, latitude, longitude, address, image_url, website_url, reservation_link } = req.body;

    if (!name || !category || latitude === undefined || longitude === undefined || !address) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    db.run(
      `INSERT INTO venues (name, category, subcategory_id, latitude, longitude, address, image_url, website_url, reservation_link)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, category, subcategory_id || null, latitude, longitude, address, image_url, website_url, reservation_link],
      function(err) {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        res.status(201).json({ id: this.lastID });
      }
    );
  });

  // Update venue (admin)
  app.put('/api/venues/:id', authenticateToken, (req, res) => {
    const { name, category, subcategory_id, latitude, longitude, address, image_url, website_url, reservation_link } = req.body;

    db.run(
      `UPDATE venues SET name=?, category=?, subcategory_id=?, latitude=?, longitude=?, address=?, image_url=?, website_url=?, reservation_link=?, updated_at=CURRENT_TIMESTAMP
       WHERE id = ?`,
      [name, category, subcategory_id || null, latitude, longitude, address, image_url, website_url, reservation_link, req.params.id],
      function(err) {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        if (this.changes === 0) {
          return res.status(404).json({ error: 'Venue not found' });
        }
        res.json({ id: req.params.id });
      }
    );
  });

  // Delete venue (admin)
  app.delete('/api/venues/:id', authenticateToken, (req, res) => {
    db.run('DELETE FROM venues WHERE id = ?', [req.params.id], function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Venue not found' });
      }
      res.json({ success: true });
    });
  });

  // Update venue status (admin)
  app.patch('/api/venues/:id/status', authenticateToken, (req, res) => {
    const { status } = req.body;
    if (!['published', 'draft'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    db.run(
      'UPDATE venues SET status=?, updated_at=CURRENT_TIMESTAMP WHERE id=?',
      [status, req.params.id],
      function(err) {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        if (this.changes === 0) {
          return res.status(404).json({ error: 'Venue not found' });
        }
        res.json({ id: req.params.id, status });
      }
    );
  });
}
