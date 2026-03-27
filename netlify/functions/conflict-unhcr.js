// netlify/functions/conflict-unhcr.js
// UNHCR Refugee Data Finder API proxy + normalize
// No API key required
// Called by conflict-sync.js

const UNHCR_BASE = 'https://api.unhcr.org/population/v1';

// Map ISO2 → country name (subset for conflict countries)
const ISO2_NAME = {
  SD:'Sudan', CD:'Dem. Rep. of the Congo', ET:'Ethiopia', SO:'Somalia',
  NG:'Nigeria', MZ:'Mozambique', ML:'Mali', BF:'Burkina Faso', CF:'Central African Republic',
  SS:'South Sudan', CM:'Cameroon', LY:'Libya', NE:'Niger', KE:'Kenya', MG:'Madagascar'
};

exports.handler = async function (event) {
  var headers = { 'Content-Type': 'application/json' };
  var params = event.queryStringParameters || {};
  var year = parseInt(params.year, 10) || new Date().getFullYear() - 1;

  try {
    // Fetch aggregate displacement data
    var [popRes, idpRes] = await Promise.all([
      fetch(`${UNHCR_BASE}/population/?year=${year}&coo_all=true&limit=100&sortBy=individuals&ascending=false`),
      fetch(`${UNHCR_BASE}/idps/?year=${year}&limit=100&sortBy=total&ascending=false`)
    ]);

    var popData = popRes.ok ? await popRes.json() : { items: [] };
    var idpData = idpRes.ok ? await idpRes.json() : { items: [] };

    // Normalize to ac_displacement schema
    var normalized = [];

    for (var item of (popData.items || [])) {
      if (!item.coo_iso) continue;
      normalized.push({
        record_date: `${year}-12-31`,
        country_origin: item.coo_iso,
        country_asylum: item.coa_iso || null,
        idps: 0,
        refugees: parseInt(item.refugees, 10) || 0,
        asylum_seekers: parseInt(item.asylum_seekers, 10) || 0,
        returnees: parseInt(item.returned_refugees, 10) || 0,
        stateless: parseInt(item.stateless, 10) || 0,
        source: 'UNHCR',
        unhcr_id: item.year ? `unhcr-${year}-${item.coo_iso}-${item.coa_iso}` : null
      });
    }

    for (var idpItem of (idpData.items || [])) {
      if (!idpItem.iso3) continue;
      normalized.push({
        record_date: `${year}-12-31`,
        country_origin: idpItem.iso3,
        country_asylum: idpItem.iso3, // IDPs stay in origin country
        idps: parseInt(idpItem.total, 10) || 0,
        refugees: 0,
        asylum_seekers: 0,
        returnees: parseInt(idpItem.returned_idps, 10) || 0,
        stateless: 0,
        source: 'UNHCR-IDMC',
        unhcr_id: `idp-${year}-${idpItem.iso3}`
      });
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        data: normalized,
        meta: { count: normalized.length, year, source: 'UNHCR Refugee Data Finder' }
      })
    };

  } catch (err) {
    console.error('[conflict-unhcr] Error:', err.message);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'UNHCR fetch failed', detail: err.message, data: [] })
    };
  }
};
