// netlify/functions/afrokitchen-costs.js
// Ingredient cost lookup for AfroKitchen recipes

// AfroKitchen recipes, recipe ingredients, and ingredient prices live on the
// Auth/Kitchen Supabase instance, not the generic data instance.
function cleanEnvValue(value) {
  return String(value || '').trim().replace(/^['"]|['"]$/g, '');
}

const SUPABASE_URL = cleanEnvValue(process.env.SUPABASE_AUTH_URL) || 'https://zpclagtgczsygrgztlts.supabase.co';
const SUPABASE_KEY = cleanEnvValue(
  process.env.SUPABASE_AUTH_SERVICE_KEY ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SERVICE_KEY ||
  process.env.SUPABASE_ANON_KEY_AUTH ||
  process.env.SUPABASE_ANON_KEY ||
  process.env.SUPABASE_KEY
);

function getCorsHeaders(event) {
  const origin = event.headers?.origin || '';
  const isAllowed =
    origin === 'https://afrotools.com' ||
    origin === 'https://www.afrotools.com' ||
    // Only our own afrotools.netlify.app site + branch/deploy-preview subdomains,
    // not every *.netlify.app tenant.
    /^https:\/\/([a-z0-9-]+--)?afrotools[a-z0-9-]*\.netlify\.app$/.test(origin) ||
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

exports.handler = async function (event) {
  const headers = getCorsHeaders(event);
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers, body: '' };

  if (!SUPABASE_KEY) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'SUPABASE_KEY not configured' }) };
  }

  const params = event.queryStringParameters || {};
  const recipeId = String(params.recipe_id || '').trim();
  const countryCode = String(params.country || '').trim().toUpperCase();

  if (!/^[0-9a-f-]{36}$/i.test(recipeId) || !/^[A-Z]{2}$/.test(countryCode)) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'recipe_id and country required' }) };
  }

  try {
    // Get ingredient IDs for this recipe
    const ingRes = await fetch(
      `${SUPABASE_URL}/rest/v1/recipe_ingredients?recipe_id=eq.${encodeURIComponent(recipeId)}&select=ingredient_id`,
      { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } }
    );
    if (!ingRes.ok) throw new Error(`Ingredient lookup failed with ${ingRes.status}`);
    const ingredients = await ingRes.json();
    const ingIds = ingredients
      .map(i => String(i.ingredient_id || '').trim())
      .filter(id => /^[0-9a-f-]{36}$/i.test(id));

    if (!ingIds.length) {
      return { statusCode: 200, headers, body: JSON.stringify([]) };
    }

    // Get prices for these ingredients in the specified country
    const priceRes = await fetch(
      `${SUPABASE_URL}/rest/v1/ingredient_prices?ingredient_id=in.(${ingIds.map(encodeURIComponent).join(',')})&country_code=eq.${encodeURIComponent(countryCode)}`,
      { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } }
    );
    if (!priceRes.ok) throw new Error(`Price lookup failed with ${priceRes.status}`);
    const prices = await priceRes.json();

    return { statusCode: 200, headers, body: JSON.stringify(prices) };
  } catch (err) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
