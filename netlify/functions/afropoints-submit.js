// netlify/functions/afropoints-submit.js
// Handle data submissions — validate, store, award points, check badges

const SUPABASE_URL = process.env.SUPABASE_AUTH_URL || 'https://zpclagtgczsygrgztlts.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;

function cors(event) {
  const origin = event.headers?.origin || '';
  const ok = origin === 'https://afrotools.com' || origin === 'https://www.afrotools.com' || origin.endsWith('.netlify.app') || origin.startsWith('http://localhost') || origin.startsWith('http://127.0.0.1');
  return { 'Access-Control-Allow-Origin': ok ? origin : 'https://afrotools.com', 'Access-Control-Allow-Headers': 'Content-Type, Authorization', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Content-Type': 'application/json', 'Vary': 'Origin' };
}

function reply(status, body, headers) { return { statusCode: status, headers: headers, body: JSON.stringify(body) }; }

async function sbQuery(method, path, body, token) {
  const opts = { method, headers: { apikey: SUPABASE_KEY, Authorization: 'Bearer ' + (token || SUPABASE_KEY), 'Content-Type': 'application/json', Prefer: method === 'POST' ? 'return=representation' : undefined } };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(SUPABASE_URL + '/rest/v1/' + path, opts);
  const text = await res.text();
  try { return JSON.parse(text); } catch { return text; }
}

// Points per category
const POINTS = { product_price: 5, forex_rate: 8, fuel_price: 5, rent: 10, transport: 5, salary: 15, business_cost: 10, meal_price: 5, fintech_fee: 8, education_cost: 8 };
const VALID_CATEGORIES = Object.keys(POINTS);

// Validate JWT and extract user_id
async function getUser(event) {
  const auth = event.headers?.authorization || '';
  if (!auth.startsWith('Bearer ')) return null;
  const token = auth.slice(7);
  try {
    const res = await fetch(SUPABASE_URL + '/auth/v1/user', { headers: { apikey: SUPABASE_KEY, Authorization: 'Bearer ' + token } });
    if (!res.ok) return null;
    const user = await res.json();
    return { id: user.id, token: token };
  } catch { return null; }
}

exports.handler = async function (event) {
  const headers = cors(event);
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers, body: '' };
  if (event.httpMethod !== 'POST') return reply(405, { error: 'Method not allowed' }, headers);
  if (!SUPABASE_KEY) return reply(500, { error: 'Server not configured' }, headers);

  const user = await getUser(event);
  if (!user) return reply(401, { error: 'Authentication required' }, headers);

  let body;
  try { body = JSON.parse(event.body); } catch { return reply(400, { error: 'Invalid JSON' }, headers); }

  const { category, country_code, city, currency_code, payload, photo_url } = body;

  // Validate required fields
  if (!category || !VALID_CATEGORIES.includes(category)) return reply(400, { error: 'Invalid category' }, headers);
  if (!country_code || country_code.length !== 2) return reply(400, { error: 'Invalid country_code' }, headers);
  if (!city || city.trim().length < 2) return reply(400, { error: 'City is required' }, headers);
  if (!currency_code || currency_code.length !== 3) return reply(400, { error: 'Invalid currency_code' }, headers);
  if (!payload || typeof payload !== 'object') return reply(400, { error: 'Payload is required' }, headers);

  try {
    // Rate limiting: max 20/day per category
    const today = new Date().toISOString().slice(0, 10);
    const countRes = await fetch(
      SUPABASE_URL + '/rest/v1/contributions?select=id&user_id=eq.' + user.id + '&data_category=eq.' + category + '&submitted_at=gte.' + today + 'T00:00:00Z',
      { headers: { apikey: SUPABASE_KEY, Authorization: 'Bearer ' + SUPABASE_KEY } }
    );
    const countData = await countRes.json();
    if (Array.isArray(countData) && countData.length >= 20) {
      return reply(429, { error: 'Daily limit reached for this category (20/day)' }, headers);
    }

    // Insert contribution
    const contribution = {
      user_id: user.id,
      data_category: category,
      country_code: country_code.toUpperCase(),
      city: city.trim(),
      currency_code: currency_code.toUpperCase(),
      payload: payload,
      photo_url: photo_url || null,
      status: 'pending',
      points_awarded: POINTS[category] || 5
    };

    const inserted = await sbQuery('POST', 'contributions', contribution, SUPABASE_KEY);
    if (!inserted || !Array.isArray(inserted) || !inserted[0]) {
      return reply(500, { error: 'Failed to save contribution' }, headers);
    }
    const contrib = inserted[0];

    // Award points
    const pointsAmount = POINTS[category] || 5;
    const photoBonus = photo_url ? 2 : 0;
    const totalPoints = pointsAmount + photoBonus;

    await sbQuery('POST', 'points_ledger', {
      user_id: user.id,
      amount: totalPoints,
      reason: 'submission',
      contribution_id: contrib.id,
      description: category.replace(/_/g, ' ') + ' in ' + city + ', ' + country_code.toUpperCase()
    }, SUPABASE_KEY);

    // Upsert points_profile
    const profileRes = await fetch(
      SUPABASE_URL + '/rest/v1/points_profiles?user_id=eq.' + user.id,
      { headers: { apikey: SUPABASE_KEY, Authorization: 'Bearer ' + SUPABASE_KEY } }
    );
    const profiles = await profileRes.json();

    if (Array.isArray(profiles) && profiles.length > 0) {
      const p = profiles[0];
      const newEarned = (p.total_earned || 0) + totalPoints;
      const newBalance = (p.current_balance || 0) + totalPoints;
      const newCount = (p.contributions_count || 0) + 1;

      // Streak logic
      const lastSub = p.last_submission_at ? new Date(p.last_submission_at) : null;
      const now = new Date();
      let streak = p.current_streak || 0;
      if (lastSub) {
        const diffH = (now - lastSub) / 3600000;
        if (diffH > 24 && diffH <= 48) streak += 1;
        else if (diffH > 48) streak = 1;
      } else { streak = 1; }
      const longestStreak = Math.max(p.longest_streak || 0, streak);

      // Rank
      const trust = p.trust_score || 50;
      let rank = 'newcomer';
      if (newEarned >= 10000 && trust >= 90) rank = 'legend';
      else if (newEarned >= 2000 && trust >= 85) rank = 'expert';
      else if (newEarned >= 500 && trust >= 70) rank = 'trusted';
      else if (newEarned >= 100) rank = 'contributor';

      // Streak bonus
      let streakBonus = 0;
      if (streak >= 30 && p.current_streak < 30) streakBonus = 100;
      else if (streak >= 7 && p.current_streak < 7) streakBonus = 20;
      else if (streak >= 3 && p.current_streak < 3) streakBonus = 5;

      if (streakBonus > 0) {
        await sbQuery('POST', 'points_ledger', {
          user_id: user.id, amount: streakBonus, reason: 'streak_bonus',
          description: streak + '-day streak bonus'
        }, SUPABASE_KEY);
      }

      await fetch(
        SUPABASE_URL + '/rest/v1/points_profiles?user_id=eq.' + user.id,
        {
          method: 'PATCH',
          headers: { apikey: SUPABASE_KEY, Authorization: 'Bearer ' + SUPABASE_KEY, 'Content-Type': 'application/json', Prefer: 'return=representation' },
          body: JSON.stringify({
            total_earned: newEarned + streakBonus,
            current_balance: newBalance + streakBonus,
            contributions_count: newCount,
            current_streak: streak,
            longest_streak: longestStreak,
            rank: rank,
            primary_country: country_code.toUpperCase(),
            primary_city: city.trim(),
            last_submission_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
        }
      );

      return reply(200, {
        success: true,
        contribution_id: contrib.id,
        points_awarded: totalPoints,
        streak_bonus: streakBonus,
        new_balance: newBalance + streakBonus,
        rank: rank,
        streak: streak
      }, headers);

    } else {
      // First-time profile creation
      await sbQuery('POST', 'points_profiles', {
        user_id: user.id,
        total_earned: totalPoints,
        current_balance: totalPoints,
        contributions_count: 1,
        current_streak: 1,
        longest_streak: 1,
        rank: 'newcomer',
        primary_country: country_code.toUpperCase(),
        primary_city: city.trim(),
        last_submission_at: new Date().toISOString()
      }, SUPABASE_KEY);

      return reply(200, {
        success: true,
        contribution_id: contrib.id,
        points_awarded: totalPoints,
        streak_bonus: 0,
        new_balance: totalPoints,
        rank: 'newcomer',
        streak: 1,
        badges_earned: [{ id: 'first_blood', name: 'First Blood', emoji: '🎯', bonus: 10 }]
      }, headers);
    }

  } catch (err) {
    console.error('AfroPoints submit error:', err);
    return reply(500, { error: 'Internal server error' }, headers);
  }
};
