// netlify/functions/conflict-data.js
// AfroConflict — Public Read API (no auth required)
// GET /api/conflicts                     → list all published conflicts
// GET /api/conflicts/:slug               → single conflict full detail
// GET /api/conflicts/:slug/events        → ACLED events for conflict
// GET /api/conflicts/:slug/displacement  → displacement timeseries
// GET /api/conflicts/:slug/economy       → economic impact data
// GET /api/conflicts/:slug/actors        → conflict actors + economy actors
// GET /api/conflicts/:slug/forecast      → scenario forecasts
// GET /api/conflicts/:slug/timeline      → milestone timeline
// GET /api/stats                         → global KPIs for dashboard
// GET /api/events/recent                 → last 30 days events across all conflicts

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://jbmhfpkzbgyeodsqhprx.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY;

function getCorsHeaders(event) {
  const origin = event.headers?.origin || '';
  const isAllowed =
    origin === 'https://afrotools.com' ||
    origin === 'https://www.afrotools.com' ||
    origin.endsWith('.netlify.app') ||
    origin.startsWith('http://localhost') ||
    origin.startsWith('http://127.0.0.1');
  return {
    'Access-Control-Allow-Origin': isAllowed ? origin : 'https://afrotools.com',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': 'application/json',
    'Vary': 'Origin'
  };
}

async function sbFetch(path, key) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json'
    }
  });
  if (!res.ok) throw new Error(`Supabase error: ${res.status} ${res.statusText}`);
  return res.json();
}

function slugOk(slug) { return /^[a-z0-9-]+$/.test(slug); }

exports.handler = async function (event) {
  const headers = getCorsHeaders(event);
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers, body: '' };
  if (event.httpMethod !== 'GET') return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  if (!SUPABASE_KEY) return { statusCode: 500, headers, body: JSON.stringify({ error: 'SUPABASE_KEY not configured' }) };

  const path = event.path.replace(/^\/api\//, '').replace(/^\.netlify\/functions\/conflict-data\/?/, '');
  const params = event.queryStringParameters || {};

  try {
    // ─── GET /api/stats ──────────────────────────────────────────
    if (path === 'stats' || path === '') {
      const conflicts = await sbFetch(
        'ac_conflicts?select=id,status,escalation_risk,spillover_risk,spillover_countries,fatalities_min,fatalities_max,idps_count,refugees_count,military_spend_usd_m,economic_loss_min_usd_b,economic_loss_max_usd_b,updated_at&is_published=eq.true',
        SUPABASE_KEY
      );

      const now = new Date();
      const thirtyDaysAgo = new Date(now - 30 * 24 * 3600 * 1000);
      const activeStatuses = ['active', 'escalating', 'emerging'];

      var activeCount = 0, criticalCount = 0, spilloverSet = new Set();
      var totalIdps = 0, totalRefugees = 0;
      var totalFatMin = 0, totalFatMax = 0;
      var totalMilSpend = 0, totalEconMin = 0, totalEconMax = 0;
      var newEscalations = 0;

      for (var c of conflicts) {
        if (activeStatuses.includes(c.status)) activeCount++;
        if (c.escalation_risk === 'critical') criticalCount++;
        if (c.spillover_countries) c.spillover_countries.forEach(function(cc) { spilloverSet.add(cc); });
        totalIdps += (c.idps_count || 0);
        totalRefugees += (c.refugees_count || 0);
        totalFatMin += (c.fatalities_min || 0);
        totalFatMax += (c.fatalities_max || 0);
        totalMilSpend += (c.military_spend_usd_m || 0);
        totalEconMin += (c.economic_loss_min_usd_b || 0);
        totalEconMax += (c.economic_loss_max_usd_b || 0);
        if (c.status === 'escalating' && new Date(c.updated_at) > thirtyDaysAgo) newEscalations++;
      }

      var stats = {
        active_conflicts: activeCount,
        total_displaced: totalIdps + totalRefugees,
        total_idps: totalIdps,
        total_refugees: totalRefugees,
        fatalities_min: totalFatMin,
        fatalities_max: totalFatMax,
        military_spend_usd_m: Math.round(totalMilSpend),
        economic_loss_min_usd_b: Math.round(totalEconMin * 10) / 10,
        economic_loss_max_usd_b: Math.round(totalEconMax * 10) / 10,
        critical_risk_count: criticalCount,
        spillover_threat_countries: spilloverSet.size,
        new_escalations_30d: newEscalations,
        total_conflicts: conflicts.length,
        last_updated: new Date().toISOString()
      };

      return {
        statusCode: 200,
        headers: { ...headers, 'Cache-Control': 'max-age=300' },
        body: JSON.stringify({ data: stats, meta: { source: 'ACLED/UCDP/UNHCR/Manual', last_updated: stats.last_updated } })
      };
    }

    // ─── GET /api/events/recent ───────────────────────────────────
    if (path === 'events/recent') {
      var thirtyAgo = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString().slice(0,10);
      var events = await sbFetch(
        `ac_events?select=*,ac_conflicts(name,short_name,slug)&event_date=gte.${thirtyAgo}&order=event_date.desc&limit=50`,
        SUPABASE_KEY
      );
      return {
        statusCode: 200,
        headers: { ...headers, 'Cache-Control': 'max-age=300' },
        body: JSON.stringify({ data: events, meta: { count: events.length, source: 'ACLED/Manual' } })
      };
    }

    // ─── GET /api/conflicts ───────────────────────────────────────
    if (path === 'conflicts') {
      var qs = 'ac_conflicts?select=*&is_published=eq.true&order=escalation_risk.desc,fatalities_max.desc';
      if (params.region) qs += `&regions=cs.{${params.region}}`;
      if (params.status) qs += `&status=eq.${params.status}`;
      if (params.type) qs += `&conflict_type=eq.${params.type}`;
      if (params.risk) qs += `&escalation_risk=eq.${params.risk}`;
      if (params.african === 'true') qs += '&is_african=eq.true';
      if (params.featured === 'true') qs += '&is_featured=eq.true';
      if (params.limit) qs += `&limit=${parseInt(params.limit, 10) || 20}`;
      var list = await sbFetch(qs, SUPABASE_KEY);
      return {
        statusCode: 200,
        headers: { ...headers, 'Cache-Control': 'max-age=3600' },
        body: JSON.stringify({ data: list, meta: { count: list.length, source: 'AfroConflict Database' } })
      };
    }

    // ─── /api/conflicts/:slug/* ───────────────────────────────────
    var conflictMatch = path.match(/^conflicts\/([a-z0-9-]+)(?:\/(.+))?$/);
    if (conflictMatch) {
      var slug = conflictMatch[1];
      var sub = conflictMatch[2] || '';
      if (!slugOk(slug)) return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid slug' }) };

      // Get conflict ID first
      var conflictRows = await sbFetch(
        `ac_conflicts?slug=eq.${slug}&is_published=eq.true&select=id&limit=1`,
        SUPABASE_KEY
      );
      if (!conflictRows.length) return { statusCode: 404, headers, body: JSON.stringify({ error: 'Conflict not found' }) };
      var conflictId = conflictRows[0].id;

      if (!sub) {
        // Full conflict detail
        var detail = await sbFetch(
          `ac_conflicts?slug=eq.${slug}&is_published=eq.true&select=*&limit=1`,
          SUPABASE_KEY
        );
        return {
          statusCode: 200,
          headers: { ...headers, 'Cache-Control': 'max-age=3600' },
          body: JSON.stringify({ data: detail[0] || null, meta: { source: detail[0]?.data_source || 'Manual' } })
        };
      }

      if (sub === 'events') {
        var evtQs = `ac_events?conflict_id=eq.${conflictId}&order=event_date.desc`;
        if (params.type) evtQs += `&event_type=eq.${params.type}`;
        if (params.from) evtQs += `&event_date=gte.${params.from}`;
        if (params.to) evtQs += `&event_date=lte.${params.to}`;
        evtQs += `&limit=${parseInt(params.limit, 10) || 20}&offset=${parseInt(params.offset, 10) || 0}`;
        var evts = await sbFetch(evtQs, SUPABASE_KEY);
        return {
          statusCode: 200,
          headers: { ...headers, 'Cache-Control': 'max-age=300' },
          body: JSON.stringify({ data: evts, meta: { count: evts.length, source: 'ACLED/Manual' } })
        };
      }

      if (sub === 'displacement') {
        var disp = await sbFetch(
          `ac_displacement?conflict_id=eq.${conflictId}&order=record_date.desc&limit=50`,
          SUPABASE_KEY
        );
        return {
          statusCode: 200,
          headers: { ...headers, 'Cache-Control': 'max-age=3600' },
          body: JSON.stringify({ data: disp, meta: { source: 'UNHCR/IDMC' } })
        };
      }

      if (sub === 'economy') {
        var econ = await sbFetch(
          `ac_economic_impact?conflict_id=eq.${conflictId}&order=year.desc`,
          SUPABASE_KEY
        );
        return {
          statusCode: 200,
          headers: { ...headers, 'Cache-Control': 'max-age=3600' },
          body: JSON.stringify({ data: econ, meta: { source: 'World Bank/SIPRI/Manual' } })
        };
      }

      if (sub === 'actors') {
        var [conflictActors, econActors] = await Promise.all([
          sbFetch(
            `ac_conflict_actors?conflict_id=eq.${conflictId}&select=*,ac_actors(*)`,
            SUPABASE_KEY
          ),
          sbFetch(
            `ac_economy_actors?conflict_id=eq.${conflictId}&is_active=eq.true&order=confidence_score.desc`,
            SUPABASE_KEY
          )
        ]);
        return {
          statusCode: 200,
          headers: { ...headers, 'Cache-Control': 'max-age=3600' },
          body: JSON.stringify({ data: { conflict_actors: conflictActors, economy_actors: econActors }, meta: { source: 'AfroConflict Research' } })
        };
      }

      if (sub === 'forecast') {
        var fc = await sbFetch(
          `ac_forecasts?conflict_id=eq.${conflictId}&order=forecast_date.desc&limit=1`,
          SUPABASE_KEY
        );
        return {
          statusCode: 200,
          headers: { ...headers, 'Cache-Control': 'max-age=3600' },
          body: JSON.stringify({ data: fc[0] || null, meta: { source: 'AfroConflict Analysis' } })
        };
      }

      if (sub === 'timeline') {
        var tl = await sbFetch(
          `ac_timeline?conflict_id=eq.${conflictId}&order=event_date.desc`,
          SUPABASE_KEY
        );
        return {
          statusCode: 200,
          headers: { ...headers, 'Cache-Control': 'max-age=3600' },
          body: JSON.stringify({ data: tl, meta: { count: tl.length, source: 'AfroConflict Research' } })
        };
      }
    }

    return { statusCode: 404, headers, body: JSON.stringify({ error: 'Endpoint not found' }) };

  } catch (err) {
    console.error('[conflict-data]', err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Internal server error', detail: err.message }) };
  }
};
