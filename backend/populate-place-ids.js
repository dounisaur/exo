import dotenv from 'dotenv';
import { pool } from './db.js';

dotenv.config();

const apiKey = process.env.GOOGLE_PLACES_API_KEY;

if (!apiKey) {
  console.error('GOOGLE_PLACES_API_KEY not configured');
  process.exit(1);
}

async function populatePlaceIds() {
  try {
    console.log('[POPULATE] Fetching venues without place_id...');
    const { rows: venues } = await pool.query(
      "SELECT id, name, latitude, longitude, address FROM venues WHERE place_id IS NULL"
    );

    console.log(`[POPULATE] Found ${venues.length} venues to update`);

    if (venues.length === 0) {
      console.log('[POPULATE] All venues already have place_id');
      process.exit(0);
    }

    let updated = 0;
    let failed = 0;

    for (const venue of venues) {
      try {
        console.log(`[POPULATE] Processing: ${venue.name}`);

        // Search by name and coordinates for accuracy
        const query = `${venue.name}${venue.address ? ' ' + venue.address : ''}`;
        const searchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${apiKey}`;

        const searchResponse = await fetch(searchUrl);
        const searchData = await searchResponse.json();

        if (!searchData.results || searchData.results.length === 0) {
          console.log(`[POPULATE] ❌ No results found for: ${venue.name}`);
          failed++;
          continue;
        }

        // Find best match (ideally closest by coordinates)
        const bestMatch = searchData.results[0];
        const placeId = bestMatch.place_id;

        await pool.query(
          'UPDATE venues SET place_id = $1 WHERE id = $2',
          [placeId, venue.id]
        );

        console.log(`[POPULATE] ✅ Updated ${venue.name} with place_id: ${placeId}`);
        updated++;

        // Rate limit: delay between requests
        await new Promise(resolve => setTimeout(resolve, 200));
      } catch (error) {
        console.error(`[POPULATE] Error processing venue ${venue.name}:`, error.message);
        failed++;
      }
    }

    console.log(`\n[POPULATE] Complete: ${updated} updated, ${failed} failed`);
    process.exit(0);
  } catch (error) {
    console.error('[POPULATE] Fatal error:', error);
    process.exit(1);
  }
}

populatePlaceIds();
