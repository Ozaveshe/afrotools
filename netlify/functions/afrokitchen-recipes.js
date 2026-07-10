// netlify/functions/afrokitchen-recipes.js
// Supabase CRUD for AfroKitchen recipes
// Handles recipe fetching, filtering, and view count incrementing

// AfroKitchen uses the Auth/Kitchen Supabase instance (zpclagtgczsygrgztlts),
// NOT the generic SUPABASE_URL env var which points to the Data instance (jbmhfpkzbgyeodsqhprx)
function cleanEnvValue(value) {
  return String(value || '').trim().replace(/^['"]|['"]$/g, '');
}

const SUPABASE_URL = cleanEnvValue(process.env.SUPABASE_AUTH_URL) || 'https://zpclagtgczsygrgztlts.supabase.co';
const SUPABASE_KEY = cleanEnvValue(
  process.env.SUPABASE_AUTH_SERVICE_KEY ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SERVICE_KEY ||
  process.env.SUPABASE_ANON_KEY_AUTH ||
  process.env.SUPABASE_ANON_KEY
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
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
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
  const action = params.action || 'list';

  try {
    if (action === 'list') {
      let url = `${SUPABASE_URL}/rest/v1/recipes?select=*&is_verified=eq.true&order=is_featured.desc,view_count.desc`;
      // Validate + encode filter values before interpolating into the PostgREST query
      // to prevent operator/filter injection. Invalid values silently skip the filter.
      if (params.country && /^[A-Za-z]{2}$/.test(params.country)) url += `&country_code=eq.${encodeURIComponent(params.country)}`;
      if (params.category && /^[a-z0-9 _-]{1,40}$/i.test(params.category)) url += `&category=eq.${encodeURIComponent(params.category)}`;
      if (params.difficulty && /^[a-z0-9 _-]{1,40}$/i.test(params.difficulty)) url += `&difficulty=eq.${encodeURIComponent(params.difficulty)}`;
      if (params.featured) url += `&is_featured=eq.true`;
      if (params.slug && /^[a-z0-9-]+$/.test(params.slug)) url += `&slug=eq.${params.slug}`;
      if (params.limit) url += `&limit=${parseInt(params.limit, 10) || 20}`;

      const res = await fetch(url, {
        headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` }
      });
      if (!res.ok) throw new Error('Upstream ' + res.status);
      const data = await res.json();
      return { statusCode: 200, headers, body: JSON.stringify(data) };
    }

    if (action === 'get' && params.slug && /^[a-z0-9-]+$/.test(params.slug)) {
      // Get recipe with ingredients, steps, and reviews
      const recipeRes = await fetch(
        `${SUPABASE_URL}/rest/v1/recipes?slug=eq.${params.slug}&is_verified=eq.true&select=*&limit=1`,
        { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } }
      );
      if (!recipeRes.ok) throw new Error('Upstream ' + recipeRes.status);
      const recipes = await recipeRes.json();
      if (!recipes.length) return { statusCode: 404, headers, body: JSON.stringify({ error: 'Recipe not found' }) };

      const recipe = recipes[0];

      // Fetch ingredients, steps, reviews in parallel
      const [ingRes, stepsRes, reviewsRes] = await Promise.all([
        fetch(`${SUPABASE_URL}/rest/v1/recipe_ingredients?recipe_id=eq.${recipe.id}&order=sort_order`, { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } }),
        fetch(`${SUPABASE_URL}/rest/v1/recipe_steps?recipe_id=eq.${recipe.id}&order=step_number`, { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } }),
        fetch(`${SUPABASE_URL}/rest/v1/recipe_reviews?recipe_id=eq.${recipe.id}&order=created_at.desc&limit=20`, { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } })
      ]);

      recipe.ingredients = await ingRes.json();
      recipe.steps = await stepsRes.json();
      recipe.reviews = await reviewsRes.json();

      return { statusCode: 200, headers, body: JSON.stringify(recipe) };
    }

    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid action' }) };
  } catch (err) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
