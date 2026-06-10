export const version = 9;
export const name = 'populate_canonical_cities';

// Helper function to get canonical city from Google Reverse Geocoding API
async function getCanonicalCity(latitude, longitude) {
  try {
    const apiKey = process.env.GOOGLE_PLACES_API_KEY;
    if (!apiKey) {
      console.warn('  ⚠️  Google API key not configured, skipping city lookup');
      return null;
    }

    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${apiKey}`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.results && data.results.length > 0) {
      let city = null;

      // Priority 1: Look for actual city/locality names (e.g., "Athens", "Aegina")
      for (const component of data.results[0].address_components) {
        if (component.types.includes('locality')) {
          city = component.long_name;
          break;
        }
      }

      // Priority 2: Look for administrative area level 2 (prefecture/municipality)
      if (!city) {
        for (const component of data.results[0].address_components) {
          if (component.types.includes('administrative_area_level_2')) {
            city = component.long_name;
            break;
          }
        }
      }

      // Priority 3: Look for administrative area level 3 (smaller districts)
      if (!city) {
        for (const component of data.results[0].address_components) {
          if (component.types.includes('administrative_area_level_3')) {
            city = component.long_name;
            break;
          }
        }
      }

      // Priority 4: Fallback to administrative area level 1 (region/state)
      if (!city) {
        for (const component of data.results[0].address_components) {
          if (component.types.includes('administrative_area_level_1')) {
            city = component.long_name;
            break;
          }
        }
      }

      // Post-processing: Map known Athens suburbs to "Athina"
      if (city === 'Kesariani') {
        city = 'Athina';
      }

      // Post-processing: Map known island districts to island names
      if (city === 'Portes') {
        city = 'Aegina';
      }

      // Normalize Greek spellings to English
      if (city === 'Egina') {
        city = 'Aegina';
      }

      return city;
    }
    return null;
  } catch (error) {
    console.error('  ❌ Error calling Google Geocoding API:', error.message);
    return null;
  }
}

export async function up(client) {
  console.log('  [MIGRATE 009] Starting to populate canonical cities from Google API...');

  // Get all venues with NULL canonical_city
  const { rows: venues } = await client.query(
    'SELECT id, name, latitude, longitude FROM venues WHERE canonical_city IS NULL ORDER BY id'
  );

  if (venues.length === 0) {
    console.log('  ✓ No venues to update - all already have canonical_city');
    return;
  }

  console.log(`  [MIGRATE 009] Found ${venues.length} venue(s) to update`);

  let successCount = 0;
  let failureCount = 0;

  for (const venue of venues) {
    try {
      const canonicalCity = await getCanonicalCity(venue.latitude, venue.longitude);

      if (canonicalCity) {
        await client.query(
          'UPDATE venues SET canonical_city = $1 WHERE id = $2',
          [canonicalCity, venue.id]
        );
        console.log(`  ✓ ${venue.name}: ${canonicalCity}`);
        successCount++;
      } else {
        console.log(`  ⚠️  ${venue.name}: No city found (id=${venue.id})`);
        failureCount++;
      }

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      console.error(`  ❌ ${venue.name} (id=${venue.id}): ${error.message}`);
      failureCount++;
    }
  }

  console.log(`  [MIGRATE 009] Complete: ${successCount} updated, ${failureCount} failed`);

  if (failureCount > 0) {
    console.warn(`  ⚠️  ${failureCount} venue(s) were not updated. They can be manually edited to populate canonical_city.`);
  }
}

export async function down(client) {
  // Rollback: set all canonical_city back to NULL
  await client.query('UPDATE venues SET canonical_city = NULL WHERE canonical_city IS NOT NULL');
  console.log('  ✓ Migration 009 rolled back: Reset all canonical_city to NULL');
}
