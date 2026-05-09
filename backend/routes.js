import { getDb } from './db.js';

export function setupRoutes(app) {
  const db = getDb();

  // Get all venues with optional filters
  app.get('/api/venues', (req, res) => {
    const { category, lat, lng, radius = 50 } = req.query;
    let query = 'SELECT * FROM venues WHERE 1=1';
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
        res.status(500).json({ error: err.message });
        return;
      }
      res.json(rows);
    });
  });

  // Get single venue
  app.get('/api/venues/:id', (req, res) => {
    db.get('SELECT * FROM venues WHERE id = ?', [req.params.id], (err, row) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      if (!row) {
        res.status(404).json({ error: 'Venue not found' });
        return;
      }
      res.json(row);
    });
  });

  // Create venue (admin)
  app.post('/api/venues', (req, res) => {
    const { name, category, latitude, longitude, address, image_url, website_url, reservation_link } = req.body;

    if (!name || !category || latitude === undefined || longitude === undefined || !address) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    db.run(
      `INSERT INTO venues (name, category, latitude, longitude, address, image_url, website_url, reservation_link)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, category, latitude, longitude, address, image_url, website_url, reservation_link],
      function(err) {
        if (err) {
          res.status(500).json({ error: err.message });
          return;
        }
        res.status(201).json({ id: this.lastID });
      }
    );
  });

  // Update venue (admin)
  app.put('/api/venues/:id', (req, res) => {
    const { name, category, latitude, longitude, address, image_url, website_url, reservation_link } = req.body;

    db.run(
      `UPDATE venues SET name=?, category=?, latitude=?, longitude=?, address=?, image_url=?, website_url=?, reservation_link=?, updated_at=CURRENT_TIMESTAMP
       WHERE id = ?`,
      [name, category, latitude, longitude, address, image_url, website_url, reservation_link, req.params.id],
      function(err) {
        if (err) {
          res.status(500).json({ error: err.message });
          return;
        }
        if (this.changes === 0) {
          res.status(404).json({ error: 'Venue not found' });
          return;
        }
        res.json({ id: req.params.id });
      }
    );
  });

  // Delete venue (admin)
  app.delete('/api/venues/:id', (req, res) => {
    db.run('DELETE FROM venues WHERE id = ?', [req.params.id], function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      if (this.changes === 0) {
        res.status(404).json({ error: 'Venue not found' });
        return;
      }
      res.json({ success: true });
    });
  });
}
