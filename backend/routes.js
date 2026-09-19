import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from './db.js';
import { authenticateToken, requireAdmin, JWT_SECRET } from './auth.js';
import { generateItinerary } from './itinerary.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Helper function to get fresh photo URLs from Google Places API using place_id
async function getFreshPhotoUrls(placeId) {
  try {
    const apiKey = process.env.GOOGLE_PLACES_API_KEY;
    if (!apiKey || !placeId) {
      return [];
    }

    const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=photos&key=${apiKey}`;
    const response = await fetch(detailsUrl);
    const data = await response.json();

    if (!data.result || !data.result.photos || data.status !== 'OK') {
      return [];
    }

    const photoUrls = [];
    for (const photo of data.result.photos.slice(0, 5)) {
      const photoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${photo.photo_reference}&key=${apiKey}`;
      photoUrls.push(photoUrl);
    }
    return photoUrls;
  } catch (error) {
    console.error('Error fetching fresh photo URLs:', error);
    return [];
  }
}


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
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    cb(null, file.mimetype.startsWith('image/'));
  }
});

export function setupRoutes(app) {
  // ===== AUTH ENDPOINTS =====

  // Login endpoint
  app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    try {
      const { rows } = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
      const user = rows[0];

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
  app.post('/api/auth/register', authenticateToken, requireAdmin, async (req, res) => {
    const { username, password, role } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    if (!role || !['admin', 'creator'].includes(role)) {
      return res.status(400).json({ error: 'Role must be admin or creator' });
    }

    try {
      const passwordHash = bcrypt.hashSync(password, 10);
      const { rows } = await pool.query(
        'INSERT INTO users (username, password_hash, role) VALUES ($1, $2, $3) RETURNING id',
        [username, passwordHash, role]
      );
      res.status(201).json({ id: rows[0].id, username, role });
    } catch (err) {
      if (err.code === '23505') {
        return res.status(400).json({ error: 'Username already exists' });
      }
      res.status(500).json({ error: err.message });
    }
  });

  // Get current user
  app.get('/api/auth/me', authenticateToken, async (req, res) => {
    try {
      const { rows } = await pool.query('SELECT id, username, role FROM users WHERE id = $1', [req.user.id]);
      res.json(rows[0]);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // ===== USER MANAGEMENT ENDPOINTS (admin only) =====

  // List all users
  app.get('/api/users', authenticateToken, requireAdmin, async (req, res) => {
    try {
      const { rows: users } = await pool.query(
        'SELECT id, username, role, created_at FROM users ORDER BY created_at DESC'
      );
      res.json(users);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Delete a user (cannot delete yourself)
  app.delete('/api/users/:id', authenticateToken, requireAdmin, async (req, res) => {
    const targetId = parseInt(req.params.id);
    if (targetId === req.user.id) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }
    try {
      const { rowCount } = await pool.query('DELETE FROM users WHERE id = $1', [targetId]);
      if (rowCount === 0) {
        return res.status(404).json({ error: 'User not found' });
      }
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Update user password (admin only)
  app.put('/api/users/:id', authenticateToken, requireAdmin, async (req, res) => {
    const targetId = parseInt(req.params.id);
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ error: 'Password required' });
    }

    try {
      const passwordHash = bcrypt.hashSync(password, 10);
      const { rowCount } = await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [passwordHash, targetId]);
      if (rowCount === 0) {
        return res.status(404).json({ error: 'User not found' });
      }
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // ===== CATEGORY ENDPOINTS =====

  // Get all categories with subcategories (public)
  app.get('/api/categories', async (req, res) => {
    try {
      const { rows: categories } = await pool.query('SELECT * FROM categories ORDER BY name');

      const result = [];
      for (const cat of categories) {
        const { rows: subcategories } = await pool.query('SELECT * FROM subcategories WHERE category_id = $1 ORDER BY name', [cat.id]);
        result.push({ ...cat, subcategories });
      }

      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Create category (admin)
  app.post('/api/categories', authenticateToken, async (req, res) => {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Name required' });
    }

    const slug = name.toLowerCase().replace(/\s+/g, '-');

    try {
      const { rows } = await pool.query(
        'INSERT INTO categories (name, slug) VALUES ($1, $2) RETURNING id',
        [name, slug]
      );
      res.status(201).json({ id: rows[0].id, name, slug, subcategories: [] });
    } catch (err) {
      if (err.code === '23505') {
        return res.status(400).json({ error: 'Category already exists' });
      }
      res.status(500).json({ error: err.message });
    }
  });

  // Update category (admin)
  app.put('/api/categories/:id', authenticateToken, async (req, res) => {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Name required' });
    }

    const slug = name.toLowerCase().replace(/\s+/g, '-');

    try {
      const { rowCount } = await pool.query('UPDATE categories SET name = $1, slug = $2 WHERE id = $3', [name, slug, req.params.id]);
      if (rowCount === 0) {
        return res.status(404).json({ error: 'Category not found' });
      }
      res.json({ id: req.params.id, name, slug });
    } catch (err) {
      if (err.code === '23505') {
        return res.status(400).json({ error: 'Category name already exists' });
      }
      res.status(500).json({ error: err.message });
    }
  });

  // Delete category (admin)
  app.delete('/api/categories/:id', authenticateToken, async (req, res) => {
    try {
      const { rowCount } = await pool.query('DELETE FROM categories WHERE id = $1', [req.params.id]);
      if (rowCount === 0) {
        return res.status(404).json({ error: 'Category not found' });
      }
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // ===== COUNTRY & CITY ENDPOINTS =====

  // Get all countries (public)
  app.get('/api/countries', async (req, res) => {
    try {
      const { rows } = await pool.query('SELECT id, name, code FROM countries ORDER BY name');
      res.json(rows);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Get cities for a country (public)
  app.get('/api/cities', async (req, res) => {
    try {
      const { country_id } = req.query;

      if (!country_id) {
        return res.status(400).json({ error: 'country_id required' });
      }

      const { rows } = await pool.query(
        'SELECT id, name, country_id FROM cities WHERE country_id = $1 ORDER BY name',
        [country_id]
      );
      res.json(rows);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Create city (admin)
  app.post('/api/cities', authenticateToken, async (req, res) => {
    try {
      const { country_id, name } = req.body;

      if (!country_id || !name) {
        return res.status(400).json({ error: 'country_id and name required' });
      }

      // Check if city already exists
      const { rows: existing } = await pool.query(
        'SELECT id FROM cities WHERE country_id = $1 AND name = $2',
        [country_id, name]
      );

      if (existing.length > 0) {
        return res.json({ id: existing[0].id, name, country_id });
      }

      // Create new city
      const { rows } = await pool.query(
        'INSERT INTO cities (country_id, name) VALUES ($1, $2) RETURNING id, name, country_id',
        [country_id, name]
      );

      res.status(201).json(rows[0]);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // ===== SUBCATEGORY ENDPOINTS =====

  // Create subcategory (admin)
  app.post('/api/categories/:id/subcategories', authenticateToken, async (req, res) => {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Name required' });
    }

    const slug = name.toLowerCase().replace(/\s+/g, '-');

    try {
      const { rows } = await pool.query(
        'INSERT INTO subcategories (category_id, name, slug) VALUES ($1, $2, $3) RETURNING id',
        [req.params.id, name, slug]
      );
      res.status(201).json({ id: rows[0].id, category_id: parseInt(req.params.id), name, slug });
    } catch (err) {
      if (err.code === '23505') {
        return res.status(400).json({ error: 'Subcategory already exists for this category' });
      }
      res.status(500).json({ error: err.message });
    }
  });

  // Update subcategory (admin)
  app.put('/api/subcategories/:id', authenticateToken, async (req, res) => {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Name required' });
    }

    const slug = name.toLowerCase().replace(/\s+/g, '-');

    try {
      const { rowCount } = await pool.query('UPDATE subcategories SET name = $1, slug = $2 WHERE id = $3', [name, slug, req.params.id]);
      if (rowCount === 0) {
        return res.status(404).json({ error: 'Subcategory not found' });
      }
      res.json({ id: req.params.id, name, slug });
    } catch (err) {
      if (err.code === '23505') {
        return res.status(400).json({ error: 'Subcategory name already exists for this category' });
      }
      res.status(500).json({ error: err.message });
    }
  });

  // Update subcategory (admin)
  app.put('/api/subcategories/:id', authenticateToken, async (req, res) => {
    try {
      const { name } = req.body;
      if (!name || !name.trim()) {
        return res.status(400).json({ error: 'Name is required' });
      }

      const { rowCount } = await pool.query(
        'UPDATE subcategories SET name = $1 WHERE id = $2',
        [name.trim(), req.params.id]
      );

      if (rowCount === 0) {
        return res.status(404).json({ error: 'Subcategory not found' });
      }

      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Delete subcategory (admin)
  app.delete('/api/subcategories/:id', authenticateToken, async (req, res) => {
    try {
      await pool.query('UPDATE venues SET subcategory_id = NULL WHERE subcategory_id = $1', [req.params.id]);

      const { rowCount } = await pool.query('DELETE FROM subcategories WHERE id = $1', [req.params.id]);
      if (rowCount === 0) {
        return res.status(404).json({ error: 'Subcategory not found' });
      }
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // ===== GOOGLE MAPS PARSING =====

  // Parse Google Maps link to extract coordinates
  app.post('/api/parse-maps-link', async (req, res) => {
    const { url, address } = req.body

    if (!url) {
      return res.status(400).json({ error: 'URL required' })
    }

    try {
      console.log('[MAPS] Parsing URL:', url)

      // Function to extract coordinates from various Google Maps URL formats
      const extractCoordinates = (text) => {
        // Try various patterns
        const patterns = [
          /[?&@]q=(-?\d+\.?\d*),(-?\d+\.?\d*)/,
          /@(-?\d+\.?\d*),(-?\d+\.?\d*),\d+z/,
          /\/maps\/@(-?\d+\.?\d*),(-?\d+\.?\d*)/,
          /[\?&]center=(-?\d+\.?\d*),(-?\d+\.?\d*)/,
          /center["\s]*:\s*{[^}]*lat["\s]*:\s*(-?\d+\.?\d*)[^}]*lng["\s]*:\s*(-?\d+\.?\d*)/,
          /"lat"\s*:\s*(-?\d+\.?\d*)[^}]*"lng"\s*:\s*(-?\d+\.?\d*)/,
        ]

        for (const pattern of patterns) {
          const match = text.match(pattern)
          if (match) {
            const lat = parseFloat(match[1])
            const lng = parseFloat(match[2])
            if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
              console.log('[MAPS] Found coordinates:', { lat, lng }, 'via pattern:', pattern)
              return { lat, lng }
            }
          }
        }
        return null
      }

      // First try direct extraction
      let coords = extractCoordinates(url)
      if (coords) {
        console.log('[MAPS] Success: extracted from URL directly')
        return res.json(coords)
      }

      // If direct extraction failed, try to follow the redirect
      console.log('[MAPS] Direct extraction failed, following redirect...')

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000)

      try {
        const response = await fetch(url, {
          redirect: 'follow',
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          },
          signal: controller.signal
        })

        clearTimeout(timeoutId)
        console.log('[MAPS] Redirect response status:', response.status, 'URL:', response.url)

        const html = await response.text()

        // Extract from final URL
        coords = extractCoordinates(response.url)
        if (coords) {
          console.log('[MAPS] Success: extracted from final URL after redirect')
          return res.json(coords)
        }

        // Extract from HTML content
        coords = extractCoordinates(html)
        if (coords) {
          console.log('[MAPS] Success: extracted from HTML content')
          return res.json(coords)
        }

        console.log('[MAPS] Failed to extract coordinates from URL')

        res.status(400).json({ error: 'Could not extract coordinates from link. Try using a full Google Maps link instead of a shortened one, or enter the address and coordinates manually.' })
      } catch (fetchError) {
        clearTimeout(timeoutId)
        if (fetchError.name === 'AbortError') {
          console.error('[MAPS] Request timeout')
          return res.status(500).json({ error: 'Request timeout - server unable to reach Google Maps. Please try again or use coordinates instead.' })
        }
        throw fetchError
      }
    } catch (error) {
      console.error('[MAPS] Error parsing maps link:', error.message)
      res.status(500).json({ error: `Failed to parse link: ${error.message}` })
    }
  });

  // ===== ITINERARY ENDPOINTS =====

  app.post('/api/itinerary/generate', generateItinerary);

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
  app.get('/api/admin/venues', authenticateToken, async (req, res) => {
    try {
      const { rows } = await pool.query('SELECT * FROM venues ORDER BY created_at DESC');
      console.log('Fetched venues:', rows ? rows.length : 0, 'venues');
      res.json(rows || []);
    } catch (err) {
      console.error('Error fetching venues:', err);
      res.status(500).json({ error: err.message });
    }
  });

  // Get published venues with optional filters (public API)
  app.get('/api/venues', async (req, res) => {
    try {
      const { category, city_id, lat, lng } = req.query;
      let query = "SELECT * FROM venues WHERE status = 'published'";
      const params = [];
      let paramIndex = 1;

      if (category) {
        query += ` AND category = $${paramIndex++}`;
        params.push(category);
      }

      if (city_id) {
        query += ` AND city_id = $${paramIndex++}`;
        params.push(city_id);
      }

      const { rows } = await pool.query(query, params);

      // Regenerate fresh photo URLs from place_id if available
      const venuesWithFreshPhotos = await Promise.all(rows.map(async (venue) => {
        if (venue.place_id) {
          const freshPhotoUrls = await getFreshPhotoUrls(venue.place_id);
          return {
            ...venue,
            primary_photo_url: freshPhotoUrls[0] || venue.primary_photo_url,
            photo_urls: freshPhotoUrls.length > 0 ? freshPhotoUrls : venue.photo_urls
          };
        }
        return venue;
      }));

      res.json(venuesWithFreshPhotos);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Search venues via Google Places API (for admin lookup)
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
        const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,formatted_address,geometry,website,formatted_phone_number,opening_hours,price_level,photos&key=${apiKey}`;
        const detailsResponse = await fetch(detailsUrl);
        const detailsData = await detailsResponse.json();

        if (!detailsData.result || detailsData.status !== 'OK') {
          return res.json({ results: [] });
        }

        const result = detailsData.result;

        // Parse opening_hours from Google format to app format
        let openingHours = '';
        if (result.opening_hours && result.opening_hours.periods) {
          const hoursObj = {};
          // Initialize all days as CLOSED
          for (let i = 0; i < 7; i++) {
            hoursObj[i.toString()] = 'CLOSED';
          }

          // Map Google's periods to our format
          result.opening_hours.periods.forEach(period => {
            if (period.open && period.close && period.open.time && period.close.time) {
              const day = period.open.day;
              const openTime = period.open.time.padStart(4, '0').slice(0, 2) + ':' + period.open.time.padStart(4, '0').slice(2, 4);
              const closeTime = period.close.time.padStart(4, '0').slice(0, 2) + ':' + period.close.time.padStart(4, '0').slice(2, 4);
              hoursObj[day.toString()] = `${openTime}-${closeTime}`;
            }
          });

          openingHours = JSON.stringify(hoursObj);
        }

        // Convert Google price_level (1-4) to $ format
        let priceRange = '';
        if (result.price_level) {
          priceRange = '$'.repeat(result.price_level);
        }

        // Fetch photo URLs from photos array
        let photoUrls = [];
        if (result.photos && Array.isArray(result.photos)) {
          for (const photo of result.photos.slice(0, 5)) { // Limit to 5 photos
            try {
              const photoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${photo.photo_reference}&key=${apiKey}`;
              photoUrls.push(photoUrl);
            } catch (error) {
              console.error('Error processing photo:', error);
            }
          }
        }

        return res.json({
          results: [{
            place_id: placeId,
            name: result.name || '',
            address: result.formatted_address || '',
            latitude: result.geometry?.location?.lat || null,
            longitude: result.geometry?.location?.lng || null,
            website_url: result.website || '',
            phone: result.formatted_phone_number || '',
            price_range: priceRange,
            price_level: result.price_level?.toString() || '',
            opening_hours: openingHours,
            photo_urls: photoUrls
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

  // Get single venue
  app.get('/api/venues/:id', async (req, res) => {
    try {
      const { rows } = await pool.query('SELECT * FROM venues WHERE id = $1', [req.params.id]);
      if (rows.length === 0) {
        return res.status(404).json({ error: 'Venue not found' });
      }

      const venue = rows[0];
      // Regenerate fresh photo URLs from place_id if available
      if (venue.place_id) {
        const freshPhotoUrls = await getFreshPhotoUrls(venue.place_id);
        if (freshPhotoUrls.length > 0) {
          venue.primary_photo_url = freshPhotoUrls[0];
          venue.photo_urls = freshPhotoUrls;
        }
      }

      res.json(venue);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Create venue (admin)
  app.post('/api/venues', authenticateToken, async (req, res) => {
    try {
      const { name, category, subcategory_id, latitude, longitude, address, image_url, website_url, phone_number, reservation_link, rating, price_range, price_level, opening_hours, photo_urls, primary_photo_url, place_id, country_id, city_id, city_name } = req.body;

      if (!name || !category) {
        return res.status(400).json({ error: 'Name and category are required' });
      }

      const lat = parseFloat(latitude);
      const lng = parseFloat(longitude);

      if (isNaN(lat) || isNaN(lng)) {
        return res.status(400).json({ error: 'Invalid latitude or longitude' });
      }

      let parsedRating = null;
      if (rating !== undefined && rating !== null && rating !== '') {
        parsedRating = parseFloat(rating);
        if (isNaN(parsedRating) || parsedRating < 0 || parsedRating > 5) {
          return res.status(400).json({ error: 'Rating must be between 0 and 5' });
        }
      }

      // Handle city creation if city_name is provided
      let finalCityId = city_id || null;
      if (city_name && !finalCityId && country_id) {
        const { rows: existingCity } = await pool.query(
          'SELECT id FROM cities WHERE country_id = $1 AND name = $2',
          [country_id, city_name]
        );
        if (existingCity.length > 0) {
          finalCityId = existingCity[0].id;
        } else {
          const { rows: newCity } = await pool.query(
            'INSERT INTO cities (country_id, name) VALUES ($1, $2) RETURNING id',
            [country_id, city_name]
          );
          finalCityId = newCity[0].id;
        }
      }

      console.log('Creating venue:', name);
      const { rows } = await pool.query(
        `INSERT INTO venues (name, category, subcategory_id, latitude, longitude, address, image_url, website_url, phone_number, reservation_link, rating, price_range, price_level, opening_hours, photo_urls, primary_photo_url, place_id, country_id, city_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19) RETURNING id`,
        [name, category, subcategory_id || null, lat, lng, address || '', image_url || null, website_url || null, phone_number || null, reservation_link || null, parsedRating, price_range || null, price_level || null, opening_hours || null, photo_urls || [], primary_photo_url || null, place_id || null, country_id || null, finalCityId]
      );
      console.log('Venue created with ID:', rows[0].id);
      res.status(201).json({ id: rows[0].id });
    } catch (err) {
      console.error('Error inserting venue:', err);
      res.status(500).json({ error: err.message });
    }
  });

  // Update venue (admin)
  app.put('/api/venues/:id', authenticateToken, async (req, res) => {
    try {
      const { name, category, subcategory_id, latitude, longitude, address, image_url, website_url, phone_number, reservation_link, rating, price_range, price_level, opening_hours, photo_urls, primary_photo_url, place_id, country_id, city_id, city_name } = req.body;

      if (!name || !category) {
        return res.status(400).json({ error: 'Name and category are required' });
      }

      const lat = parseFloat(latitude);
      const lng = parseFloat(longitude);

      if (isNaN(lat) || isNaN(lng)) {
        return res.status(400).json({ error: 'Invalid latitude or longitude' });
      }

      let parsedRating = null;
      if (rating !== undefined && rating !== null && rating !== '') {
        parsedRating = parseFloat(rating);
        if (isNaN(parsedRating) || parsedRating < 0 || parsedRating > 5) {
          return res.status(400).json({ error: 'Rating must be between 0 and 5' });
        }
      }

      // Handle city creation if city_name is provided
      let finalCityId = city_id || null;
      if (city_name && !finalCityId && country_id) {
        const { rows: existingCity } = await pool.query(
          'SELECT id FROM cities WHERE country_id = $1 AND name = $2',
          [country_id, city_name]
        );
        if (existingCity.length > 0) {
          finalCityId = existingCity[0].id;
        } else {
          const { rows: newCity } = await pool.query(
            'INSERT INTO cities (country_id, name) VALUES ($1, $2) RETURNING id',
            [country_id, city_name]
          );
          finalCityId = newCity[0].id;
        }
      }

      const { rowCount } = await pool.query(
        `UPDATE venues SET name=$1, category=$2, subcategory_id=$3, latitude=$4, longitude=$5, address=$6, image_url=$7, website_url=$8, phone_number=$9, reservation_link=$10, rating=$11, price_range=$12, price_level=$13, opening_hours=$14, photo_urls=$15, primary_photo_url=$16, place_id=$17, country_id=$18, city_id=$19, updated_at=NOW()
         WHERE id = $20`,
        [name, category, subcategory_id || null, lat, lng, address || '', image_url || null, website_url || null, phone_number || null, reservation_link || null, parsedRating, price_range || null, price_level || null, opening_hours || null, photo_urls || [], primary_photo_url || null, place_id || null, country_id || null, finalCityId, req.params.id]
      );
      if (rowCount === 0) {
        return res.status(404).json({ error: 'Venue not found' });
      }
      res.json({ id: req.params.id });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Delete venue (admin)
  app.delete('/api/venues/:id', authenticateToken, async (req, res) => {
    try {
      const { rowCount } = await pool.query('DELETE FROM venues WHERE id = $1', [req.params.id]);
      if (rowCount === 0) {
        return res.status(404).json({ error: 'Venue not found' });
      }
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Update venue status (admin)
  app.patch('/api/venues/:id/status', authenticateToken, async (req, res) => {
    try {
      const { status } = req.body;
      if (!['published', 'draft'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
      }
      const { rowCount } = await pool.query('UPDATE venues SET status=$1, updated_at=NOW() WHERE id=$2', [status, req.params.id]);
      if (rowCount === 0) {
        return res.status(404).json({ error: 'Venue not found' });
      }
      res.json({ id: req.params.id, status });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Get venue comments (public)
  app.get('/api/venues/:id/comments', async (req, res) => {
    try {
      const { rows } = await pool.query(
        'SELECT id, venue_id, content, created_by, created_at FROM venue_comments WHERE venue_id = $1 ORDER BY created_at DESC',
        [req.params.id]
      );
      res.json(rows);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Add venue comment (admin)
  app.post('/api/venues/:id/comments', authenticateToken, async (req, res) => {
    try {
      const { content } = req.body;
      if (!content || !content.trim()) {
        return res.status(400).json({ error: 'Comment content is required' });
      }

      // Extract username from token (stored in req.user)
      const created_by = req.user.username || 'unknown';

      const { rows } = await pool.query(
        'INSERT INTO venue_comments (venue_id, content, created_by) VALUES ($1, $2, $3) RETURNING id, venue_id, content, created_by, created_at',
        [req.params.id, content.trim(), created_by]
      );
      res.status(201).json(rows[0]);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Delete venue comment (admin)
  app.delete('/api/venues/:id/comments/:commentId', authenticateToken, async (req, res) => {
    try {
      const { rowCount } = await pool.query(
        'DELETE FROM venue_comments WHERE id = $1 AND venue_id = $2',
        [req.params.commentId, req.params.id]
      );
      if (rowCount === 0) {
        return res.status(404).json({ error: 'Comment not found' });
      }
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
}
