// netlify/functions/conflict-sync.js
// AfroConflict — Scheduled ETL: fetch → normalize → upsert to Supabase
// Runs daily at 03:00 UTC
// DO NOT overwrite manually_overridden=true fields

export const config = { schedule: '0 3 * * *' };

const SUPABASE_URL = process.env.SUPABASE_AUTH_URL || 'https://zpclagtgczsygrgztlts.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_DATA_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
const BASE_URL = process.env.URL || 'https://afrotools.com';

async function sbUpsert(table, rows, onConflict, key) {
  if (!rows || !rows.length) return { upserted: 0 };
  var res = await fetch(
    `${SUPABASE_URL}/rest/v1/${table}?on_conflict=${onConflict}`,
    {
      method: 'POST',
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates,return=minimal'
      },
      body: JSON.stringify(rows)
    }
  );
  if (!res.ok) {
    var err = await res.text();
    throw new Error(`Supabase upsert error on ${table}: ${err}`);
  }
  return { upserted: rows.length };
}

async function sbFetch(path, key) {
  var res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` }
  });
  if (!res.ok) throw new Error(`Supabase GET error: ${res.status}`);
  return res.json();
}

async function sbPatch(path, body, key) {
  await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method: 'PATCH',
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });
}

export const handler = async function (event) {
  var headers = { 'Content-Type': 'application/json' };
  var params = event.queryStringParameters || {};
  var source = params.source || 'all';

  if (!SUPABASE_SERVICE_KEY) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'SUPABASE_SERVICE_KEY not configured' }) };
  }

  var log = [];
  var errors = [];

  function info(msg) { console.log('[conflict-sync]', msg); log.push(msg); }
  function warn(msg) { console.warn('[conflict-sync] WARN:', msg); log.push(`WARN: ${msg}`); }
  function error(msg) { console.error('[conflict-sync] ERROR:', msg); errors.push(msg); }

  info(`Sync started: source=${source} at ${new Date().toISOString()}`);

  // ─── Step 1: ACLED events ────────────────────────────────────────
  if (source === 'all' || source === 'acled') {
    try {
      var acledRes = await fetch(`${BASE_URL}/.netlify/functions/conflict-acled?days=7`);
      var acledData = await acledRes.json();

      if (acledData.error && acledData.error.includes('not configured')) {
        warn('ACLED API key not set — skipping ACLED sync');
      } else if (acledData.data && acledData.data.length > 0) {
        // Get all conflict IDs to match events to conflicts
        var conflicts = await sbFetch(
          'ac_conflicts?select=id,slug,primary_country,countries_involved&is_published=eq.true',
          SUPABASE_SERVICE_KEY
        );

        var eventsToUpsert = [];
        for (var evt of acledData.data) {
          // Find matching conflict by country
          var matchedConflict = conflicts.find(function(c) {
            return c.primary_country === evt.country ||
              (c.countries_involved && c.countries_involved.includes(evt.country));
          });
          if (matchedConflict && evt.acled_event_id) {
            eventsToUpsert.push({ ...evt, conflict_id: matchedConflict.id });
          }
        }

        if (eventsToUpsert.length) {
          var acledResult = await sbUpsert('ac_events', eventsToUpsert, 'acled_event_id', SUPABASE_SERVICE_KEY);
          info(`ACLED: upserted ${acledResult.upserted} events from ${acledData.data.length} fetched`);
        } else {
          info('ACLED: no matchable events to upsert');
        }
      } else {
        info('ACLED: no events returned');
      }
    } catch (e) {
      error(`ACLED sync failed: ${e.message}`);
    }
  }

  // ─── Step 2: UNHCR displacement ──────────────────────────────────
  if (source === 'all' || source === 'unhcr') {
    try {
      var unhcrRes = await fetch(`${BASE_URL}/.netlify/functions/conflict-unhcr?year=${new Date().getFullYear() - 1}`);
      var unhcrData = await unhcrRes.json();

      if (unhcrData.data && unhcrData.data.length > 0) {
        var conflicts2 = await sbFetch(
          'ac_conflicts?select=id,primary_country&is_published=eq.true',
          SUPABASE_SERVICE_KEY
        );

        var displToUpsert = [];
        for (var disp of unhcrData.data) {
          var match2 = conflicts2.find(function(c) {
            return c.primary_country === disp.country_origin;
          });
          if (match2) {
            displToUpsert.push({ ...disp, conflict_id: match2.id });
          }
        }

        if (displToUpsert.length) {
          var unhcrResult = await sbUpsert(
            'ac_displacement', displToUpsert,
            'conflict_id,record_date,country_origin,country_asylum',
            SUPABASE_SERVICE_KEY
          );
          info(`UNHCR: upserted ${unhcrResult.upserted} displacement records`);
        } else {
          info('UNHCR: no matchable records to upsert');
        }
      }
    } catch (e) {
      error(`UNHCR sync failed: ${e.message}`);
    }
  }

  // ─── Step 3: World Bank GDP data ─────────────────────────────────
  if (source === 'all' || source === 'worldbank') {
    try {
      var wbRes = await fetch(`${BASE_URL}/.netlify/functions/conflict-worldbank`);
      var wbData = await wbRes.json();

      if (wbData.data && wbData.data.length > 0) {
        var conflicts3 = await sbFetch(
          'ac_conflicts?select=id,primary_country,manually_overridden&is_published=eq.true',
          SUPABASE_SERVICE_KEY
        );

        var econToUpsert = [];
        for (var wb of wbData.data) {
          var match3 = conflicts3.find(function(c) {
            return c.primary_country === wb.country && !c.manually_overridden;
          });
          if (match3 && wb.gdp_growth_pct !== null) {
            econToUpsert.push({
              conflict_id: match3.id,
              year: wb.year,
              gdp_loss_pct: wb.gdp_growth_pct < 0 ? Math.abs(wb.gdp_growth_pct) : null,
              military_spend_usd_b: null, // from SIPRI separately
              source: wb.source
            });
          }
        }

        if (econToUpsert.length) {
          var wbResult = await sbUpsert('ac_economic_impact', econToUpsert, 'conflict_id,year', SUPABASE_SERVICE_KEY);
          info(`World Bank: upserted ${wbResult.upserted} economic impact records`);
        }
      }
    } catch (e) {
      error(`World Bank sync failed: ${e.message}`);
    }
  }

  // ─── Step 4: Recalculate monthly stats ───────────────────────────
  try {
    var recentEvents = await sbFetch(
      `ac_events?select=conflict_id,event_date,event_type,fatalities&event_date=gte.${new Date(Date.now() - 60*24*3600*1000).toISOString().slice(0,10)}`,
      SUPABASE_SERVICE_KEY
    );

    // Group by conflict + year + month
    var statsMap = {};
    for (var e of recentEvents) {
      if (!e.event_date || !e.conflict_id) continue;
      var d = new Date(e.event_date);
      var key = `${e.conflict_id}_${d.getFullYear()}_${d.getMonth() + 1}`;
      if (!statsMap[key]) {
        statsMap[key] = {
          conflict_id: e.conflict_id,
          year: d.getFullYear(),
          month: d.getMonth() + 1,
          event_count: 0, fatalities: 0, battles: 0, airstrikes: 0, civilian_violence: 0,
          source: 'ACLED'
        };
      }
      statsMap[key].event_count++;
      statsMap[key].fatalities += (e.fatalities || 0);
      if (e.event_type === 'battle') statsMap[key].battles++;
      if (e.event_type === 'airstrike') statsMap[key].airstrikes++;
      if (e.event_type === 'violence_against_civilians') statsMap[key].civilian_violence++;
    }

    var statsRows = Object.values(statsMap);
    if (statsRows.length) {
      await sbUpsert('ac_monthly_stats', statsRows, 'conflict_id,year,month', SUPABASE_SERVICE_KEY);
      info(`Monthly stats: recalculated ${statsRows.length} records`);
    }
  } catch (e) {
    error(`Monthly stats recalculation failed: ${e.message}`);
  }

  // ─── Step 5: Update last_api_sync timestamp ───────────────────────
  try {
    await sbPatch(
      'ac_conflicts?is_published=eq.true',
      { last_api_sync: new Date().toISOString() },
      SUPABASE_SERVICE_KEY
    );
    info('Updated last_api_sync timestamp on all conflicts');
  } catch (e) {
    error(`Failed to update last_api_sync: ${e.message}`);
  }

  var summary = {
    completed_at: new Date().toISOString(),
    source,
    log_lines: log.length,
    errors: errors.length,
    log: log.slice(-10), // last 10 lines
    error_details: errors
  };

  info(`Sync completed. ${errors.length} errors.`);

  return {
    statusCode: errors.length > 0 ? 207 : 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(summary)
  };
};
