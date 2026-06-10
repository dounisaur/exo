-- Applied migrations marker table
CREATE TABLE IF NOT EXISTS applied_migrations (
  id SERIAL PRIMARY KEY,
  version INTEGER NOT NULL UNIQUE,
  name TEXT NOT NULL,
  applied_at TIMESTAMPTZ DEFAULT NOW()
);

-- Migration 1: initial_schema
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'admin',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS subcategories (
  id SERIAL PRIMARY KEY,
  category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  UNIQUE(category_id, slug)
);

CREATE TABLE IF NOT EXISTS venues (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  subcategory_id INTEGER REFERENCES subcategories(id),
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  address TEXT,
  image_url TEXT,
  website_url TEXT,
  phone_number TEXT,
  reservation_link TEXT,
  rating DOUBLE PRECISION,
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_category ON venues(category);

-- Migration 2: role_constraint
ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('admin', 'creator'));

-- Migration 3: add_opening_hours
ALTER TABLE venues ADD COLUMN IF NOT EXISTS opening_hours TEXT;

-- Migration 4: add_opening_hours_json (no schema changes, data migration only)

-- Mark migrations as applied
INSERT INTO applied_migrations (version, name) VALUES
  (1, 'initial_schema'),
  (2, 'role_constraint'),
  (3, 'add_opening_hours'),
  (4, 'add_opening_hours_json')
ON CONFLICT (version) DO NOTHING;
