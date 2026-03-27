// netlify/functions/conflict-worldbank.js
// World Bank Open Data API proxy + normalize
// No API key required
// Fetches GDP growth, military expenditure, poverty for conflict countries

const WB_BASE = 'https://api.worldbank.org/v2';

// Conflict-affected country ISO2 codes
const CONFLICT_COUNTRIES = ['SD','CD','ET','SO','NG','MZ','ML','BF','CF','SS','CM','LY','NE','KE','UA','PS'];

async function fetchIndicator(countryIso, indicator, year) {
  var url = `${WB_BASE}/country/${countryIso.toLowerCase()}/indicator/${indicator}?date=${year - 2}:${year}&format=json&per_page=5`;
  try {
    var res = await fetch(url);
    if (!res.ok) return null;
    var json = await res.json();
    var data = json[1] || [];
    // Return most recent non-null value
    for (var item of data) {
      if (item.value !== null) return { value: item.value, year: item.date };
    }
    return null;
  } catch (e) {
    return null;
  }
}

exports.handler = async function (event) {
  var headers = { 'Content-Type': 'application/json' };
  var params = event.queryStringParameters || {};
  var year = parseInt(params.year, 10) || new Date().getFullYear() - 1;
  var country = params.country;

  var countries = country ? [country] : CONFLICT_COUNTRIES;

  try {
    var results = [];

    for (var iso of countries) {
      var [gdp, milSpend, poverty] = await Promise.all([
        fetchIndicator(iso, 'NY.GDP.MKTP.KD.ZG', year),     // GDP growth %
        fetchIndicator(iso, 'MS.MIL.XPND.GD.ZS', year),     // Military exp % GDP
        fetchIndicator(iso, 'SI.POV.DDAY', year)             // Poverty headcount
      ]);

      results.push({
        country: iso,
        year: year,
        gdp_growth_pct: gdp?.value ? parseFloat(gdp.value.toFixed(2)) : null,
        gdp_year: gdp?.year || null,
        military_spend_gdp_pct: milSpend?.value ? parseFloat(milSpend.value.toFixed(2)) : null,
        military_spend_year: milSpend?.year || null,
        poverty_headcount_pct: poverty?.value ? parseFloat(poverty.value.toFixed(1)) : null,
        poverty_year: poverty?.year || null,
        source: 'World Bank Open Data'
      });
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        data: results,
        meta: { count: results.length, year, source: 'World Bank Open Data' }
      })
    };

  } catch (err) {
    console.error('[conflict-worldbank] Error:', err.message);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'World Bank fetch failed', detail: err.message, data: [] })
    };
  }
};
