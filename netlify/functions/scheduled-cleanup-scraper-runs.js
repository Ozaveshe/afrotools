/**
 * AfroTools — Scraper Runs Cleanup
 * Runs monthly (1st of month, 6am) — deletes scraper_runs older than 90 days.
 */

var SUPABASE_URL = 'https://zpclagtgczsygrgztlts.supabase.co';
var SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ||
                   process.env.SUPABASE_DATA_SERVICE_ROLE_KEY ||
                   process.env.SUPABASE_SERVICE_KEY;

exports.handler = async function(event) {
  if (!SUPABASE_KEY) return { statusCode: 200, body: 'No Supabase key — skipping' };

  var cutoff = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
  console.log('[cleanup] Deleting scraper_runs before ' + cutoff);

  try {
    var res = await fetch(SUPABASE_URL + '/rest/v1/scraper_runs?fetched_at=lt.' + cutoff, {
      method: 'DELETE',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': 'Bearer ' + SUPABASE_KEY,
        'Prefer': 'return=representation',
      },
    });

    var deleted = res.ok ? await res.json() : [];
    console.log('[cleanup] Deleted ' + (Array.isArray(deleted) ? deleted.length : 0) + ' old scraper_runs');

    // Also clean old data_confidence entries
    var confRes = await fetch(SUPABASE_URL + '/rest/v1/data_confidence?created_at=lt.' + cutoff, {
      method: 'DELETE',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': 'Bearer ' + SUPABASE_KEY,
        'Prefer': 'return=representation',
      },
    });
    var confDeleted = confRes.ok ? await confRes.json() : [];
    console.log('[cleanup] Deleted ' + (Array.isArray(confDeleted) ? confDeleted.length : 0) + ' old data_confidence');

    // Clean resolved review queue items older than 90 days
    var reviewRes = await fetch(SUPABASE_URL + '/rest/v1/review_queue?status=neq.pending&created_at=lt.' + cutoff, {
      method: 'DELETE',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': 'Bearer ' + SUPABASE_KEY,
        'Prefer': 'return=representation',
      },
    });
    var reviewDeleted = reviewRes.ok ? await reviewRes.json() : [];
    console.log('[cleanup] Deleted ' + (Array.isArray(reviewDeleted) ? reviewDeleted.length : 0) + ' resolved review items');

    return { statusCode: 200, body: 'Cleanup complete' };
  } catch (err) {
    console.error('[cleanup] Failed: ' + err.message);
    return { statusCode: 500, body: err.message };
  }
};
