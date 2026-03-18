// netlify/functions/afrokitchen-costs.js
// Ingredient cost lookup for AfroKitchen recipes

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

exports.handler = async function (event) {
  const headers = getCorsHeaders(event);
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers, body: '' };

  if (!SUPABASE_KEY) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'SUPABASE_KEY not configured' }) };
  }

  const params = event.queryStringParameters || {};
  const recipeId = params.recipe_id;
  const countryCode = params.country;

  if (!recipeId || !countryCode) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'recipe_id and country required' }) };
  }

  try {
    // Get ingredient IDs for this recipe
    const ingRes = await fetch(
      `${SUPABASE_URL}/rest/v1/recipe_ingredients?recipe_id=eq.${recipeId}&select=ingredient_id`,
      { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } }
    );
    const ingredients = await ingRes.json();
    const ingIds = ingredients.map(i => i.ingredient_id).filter(Boolean);

    if (!ingIds.length) {
      return { statusCode: 200, headers, body: JSON.stringify([]) };
    }

    // Get prices for these ingredients in the specified country
    const priceRes = await fetch(
      `${SUPABASE_URL}/rest/v1/ingredient_prices?ingredient_id=in.(${ingIds.join(',')})&country_code=eq.${countryCode}`,
      { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } }
    );
    const prices = await priceRes.json();

    return { statusCode: 200, headers, body: JSON.stringify(prices) };
  } catch (err) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
