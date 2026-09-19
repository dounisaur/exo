export const version = 14;
export const name = 'add_countries_and_cities';

export async function up(client) {
  // Create countries table
  await client.query(`
    CREATE TABLE countries (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      code TEXT NOT NULL UNIQUE
    )
  `);

  // Create cities table
  await client.query(`
    CREATE TABLE cities (
      id SERIAL PRIMARY KEY,
      country_id INTEGER NOT NULL REFERENCES countries(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      UNIQUE(country_id, name)
    )
  `);

  // Seed Greece
  const { rows: countryRows } = await client.query(
    "INSERT INTO countries (name, code) VALUES ($1, $2) RETURNING id",
    ['Greece', 'GR']
  );
  const countryId = countryRows[0].id;

  // Seed Greek cities (based on existing venues)
  const cities = [
    'Athina',
    'Aegina',
    'Euboea',
    'Glyfada',
    'Kifisia',
    'Piraeus'
  ];

  for (const cityName of cities) {
    await client.query(
      "INSERT INTO cities (country_id, name) VALUES ($1, $2) ON CONFLICT DO NOTHING",
      [countryId, cityName]
    );
  }

  // Add city_id and country_id columns to venues
  await client.query(`
    ALTER TABLE venues
    ADD COLUMN country_id INTEGER REFERENCES countries(id),
    ADD COLUMN city_id INTEGER REFERENCES cities(id)
  `);

  // Auto-populate city_id based on canonical_city mappings
  const cityMappings = {
    'Athina': 'Athina',
    'Kesariani': 'Athina',
    'Aegina': 'Aegina',
    'Egina': 'Aegina',
    'Portes': 'Aegina',
    'Euboea': 'Euboea',
    'Evia': 'Euboea',
    'Neohora': 'Euboea',
    'Glyfada': 'Glyfada',
    'Kifisia': 'Kifisia',
    'Piraeus': 'Piraeus',
    'Peiraeus': 'Piraeus'
  };

  // Get all city ids for quick lookup
  const { rows: cityRows } = await client.query(
    "SELECT id, name FROM cities WHERE country_id = $1",
    [countryId]
  );
  const cityIdMap = {};
  cityRows.forEach(row => {
    cityIdMap[row.name] = row.id;
  });

  // Update venues
  for (const [canonicalCityName, mappedCityName] of Object.entries(cityMappings)) {
    const cityId = cityIdMap[mappedCityName];
    if (cityId) {
      await client.query(
        "UPDATE venues SET city_id = $1, country_id = $2 WHERE canonical_city = $3",
        [cityId, countryId, canonicalCityName]
      );
    }
  }
}

export async function down(client) {
  // Drop foreign keys and columns from venues
  await client.query(`
    ALTER TABLE venues
    DROP COLUMN city_id,
    DROP COLUMN country_id
  `);

  // Drop cities table
  await client.query("DROP TABLE cities");

  // Drop countries table
  await client.query("DROP TABLE countries");
}
