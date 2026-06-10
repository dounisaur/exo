export const version = 5;
export const name = 'seed_initial_data';

export function up(db) {
  // Only seed if venues table is empty
  const venueCount = db.prepare('SELECT COUNT(*) as count FROM venues').get().count;

  if (venueCount > 0) {
    console.log('[MIGRATE] Venues table already has data, skipping seed');
    return;
  }

  // Seed categories
  db.prepare('INSERT INTO categories (id, name, slug) VALUES (?, ?, ?)').run(1, 'Food', 'food');
  db.prepare('INSERT INTO categories (id, name, slug) VALUES (?, ?, ?)').run(2, 'Drinks', 'drinks');
  db.prepare('INSERT INTO categories (id, name, slug) VALUES (?, ?, ?)').run(3, 'Concert', 'concert');
  db.prepare('INSERT INTO categories (id, name, slug) VALUES (?, ?, ?)').run(4, 'Cafe', 'cafe');

  // Seed venues
  db.prepare(`
    INSERT INTO venues (id, name, category, subcategory_id, latitude, longitude, address, image_url, website_url, phone_number, reservation_link, rating, status, created_at, updated_at, opening_hours)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(1, 'Garum Athens', 'food', 4, 37.9632263, 23.734458, 'Kelsou 10, Athina 116 36, Greece', null, 'https://www.garumathens.gr/', '21 0923 6798', null, 4.8, 'published', '2026-06-03 06:47:08', '2026-06-03 06:47:27', null);

  db.prepare(`
    INSERT INTO venues (id, name, category, subcategory_id, latitude, longitude, address, image_url, website_url, phone_number, reservation_link, rating, status, created_at, updated_at, opening_hours)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(2, 'φιλινγκς | more feelings', 'food', 4, 37.9632177, 23.7238395, 'Anastasiou Zinni 34, Athina 117 41, Greece', null, null, '21 0923 3637', null, 2.6, 'published', '2026-06-03 07:16:18', '2026-06-03 07:17:08', null);

  db.prepare(`
    INSERT INTO venues (id, name, category, subcategory_id, latitude, longitude, address, image_url, website_url, phone_number, reservation_link, rating, status, created_at, updated_at, opening_hours)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(3, 'CTC Urban Gastronomy', 'food', 2, 37.9804945, 23.7168896, 'Plateon 15, Athina 104 35, Greece', null, 'http://www.ctc-restaurant.com/', '21 0722 8812', null, 4.7, 'published', '2026-06-03 07:16:55', '2026-06-03 08:53:41', null);

  db.prepare(`
    INSERT INTO venues (id, name, category, subcategory_id, latitude, longitude, address, image_url, website_url, phone_number, reservation_link, rating, status, created_at, updated_at, opening_hours)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(5, 'GOUR gour', 'food', 9, 37.9723126, 23.7551885, 'Efroniou 71, Kesariani 161 21, Greece', null, 'https://www.facebook.com/pages/category/Barbecue-Restaurant/%CE%93%CE%9F%CE%A5%CE%A1-%CE%B3%CE%BF%CF%85%CF%81-566462037076062/', '21 0724 5004', null, null, 'published', '2026-06-03 12:07:17', '2026-06-03 12:07:24', null);

  db.prepare(`
    INSERT INTO venues (id, name, category, subcategory_id, latitude, longitude, address, image_url, website_url, phone_number, reservation_link, rating, status, created_at, updated_at, opening_hours)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(6, 'Hippy3', 'drinks', 10, 37.9699505, 23.747711, 'Spirou Merkouri 22A, Athina 116 34', null, null, '2107251154', null, 4.0, 'published', '2026-06-03 12:25:39', '2026-06-03 12:45:07', null);

  db.prepare(`
    INSERT INTO venues (id, name, category, subcategory_id, latitude, longitude, address, image_url, website_url, phone_number, reservation_link, rating, status, created_at, updated_at, opening_hours)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(7, 'PONY CLUB', 'drinks', 10, 37.9744509, 23.7508946, 'Leof. Vasileos Alexandrou 5-7, Athina 115 28, Greece', null, null, '21 0723 3071', null, 4.3, 'published', '2026-06-03 13:04:26', '2026-06-03 13:04:28', null);

  db.prepare(`
    INSERT INTO venues (id, name, category, subcategory_id, latitude, longitude, address, image_url, website_url, phone_number, reservation_link, rating, status, created_at, updated_at, opening_hours)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(8, 'Ohh Boy', 'cafe', 11, 37.9724154, 23.7455671, 'Archelaou 32, Athina 116 35, Greece', null, 'https://mymenuweb.com/int/restaurants/1762631/?utm_source=google_profile&utm_medium=google_profile&utm_campaign=admin', '21 1183 8340', null, 3.9, 'published', '2026-06-03 13:31:36', '2026-06-03 13:32:24', '{"0":"09:00-23:00","1":"08:00-23:00","2":"08:00-23:30","3":"08:00-23:00","4":"09:00-23:00","5":"08:00-23:00","6":"09:00-23:00"}');

  console.log('[MIGRATE] Seeded 4 categories and 7 venues');
}
