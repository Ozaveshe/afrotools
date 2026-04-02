// netlify/functions/afropoints-cashout.js
// Handle cashout requests and history

const SUPABASE_URL = process.env.SUPABASE_AUTH_URL || 'https://zpclagtgczsygrgztlts.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;
const MIN_CASHOUT = 2000;
const PRO_COST = 500;

function cors(event) {
  const origin = event.headers?.origin || '';
  const ok = origin === 'https://afrotools.com' || origin === 'https://www.afrotools.com' || origin.endsWith('.netlify.app') || origin.startsWith('http://localhost') || origin.startsWith('http://127.0.0.1');
  return { 'Access-Control-Allow-Origin': ok ? origin : 'https://afrotools.com', 'Access-Control-Allow-Headers': 'Content-Type, Authorization', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Content-Type': 'application/json', 'Vary': 'Origin' };
}

function reply(s, b, h) { return { statusCode: s, headers: h, body: JSON.stringify(b) }; }

async function getUser(event) {
  const auth = event.headers?.authorization || '';
  if (!auth.startsWith('Bearer ')) return null;
  const token = auth.slice(7);
  try {
    const res = await fetch(SUPABASE_URL + '/auth/v1/user', { headers: { apikey: SUPABASE_KEY, Authorization: 'Bearer ' + token } });
    if (!res.ok) return null;
    return await res.json();
  } catch { return null; }
}

async function sbFetch(path, opts) {
  const res = await fetch(SUPABASE_URL + '/rest/v1/' + path, {
    ...opts,
    headers: { apikey: SUPABASE_KEY, Authorization: 'Bearer ' + SUPABASE_KEY, 'Content-Type': 'application/json', Prefer: opts?.method === 'POST' ? 'return=representation' : 'return=minimal', ...(opts?.headers || {}) }
  });
  const text = await res.text();
  try { return JSON.parse(text); } catch { return text; }
}

exports.handler = async function (event) {
  const headers = cors(event);
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers, body: '' };
  if (!SUPABASE_KEY) return reply(500, { error: 'Server not configured' }, headers);

  const user = await getUser(event);
  if (!user) return reply(401, { error: 'Authentication required' }, headers);

  // GET — cashout history
  if (event.httpMethod === 'GET') {
    const history = await sbFetch('cashout_requests?user_id=eq.' + user.id + '&order=created_at.desc&limit=20');
    return reply(200, Array.isArray(history) ? history : [], headers);
  }

  // POST — new cashout request
  if (event.httpMethod !== 'POST') return reply(405, { error: 'Method not allowed' }, headers);

  let body;
  try { body = JSON.parse(event.body); } catch { return reply(400, { error: 'Invalid JSON' }, headers); }

  const { method, details, points_amount } = body;
  if (!method || !details || !points_amount) return reply(400, { error: 'Missing required fields' }, headers);

  const validMethods = ['mobile_money', 'bank_transfer', 'pro_credit'];
  if (!validMethods.includes(method)) return reply(400, { error: 'Invalid payout method' }, headers);

  const minRequired = method === 'pro_credit' ? PRO_COST : MIN_CASHOUT;
  if (points_amount < minRequired) return reply(400, { error: 'Minimum ' + minRequired + ' points required' }, headers);

  try {
    // Check balance
    const profiles = await sbFetch('points_profiles?user_id=eq.' + user.id);
    if (!Array.isArray(profiles) || profiles.length === 0) return reply(400, { error: 'No points profile found' }, headers);

    const profile = profiles[0];
    if (profile.current_balance < points_amount) return reply(400, { error: 'Insufficient balance' }, headers);

    // Check for pending cashout
    const pending = await sbFetch('cashout_requests?user_id=eq.' + user.id + '&status=eq.pending');
    if (Array.isArray(pending) && pending.length > 0) return reply(400, { error: 'You already have a pending cashout request' }, headers);

    const cashAmount = points_amount / 100;

    // Create cashout request
    await sbFetch('cashout_requests', {
      method: 'POST',
      body: JSON.stringify({
        user_id: user.id,
        points_amount: points_amount,
        cash_amount: cashAmount,
        cash_currency: 'USD',
        payout_method: method,
        payout_details: details,
        status: 'pending'
      })
    });

    // Deduct from balance
    await sbFetch('points_ledger', {
      method: 'POST',
      body: JSON.stringify({
        user_id: user.id,
        amount: -points_amount,
        reason: 'cashout',
        description: method === 'pro_credit' ? 'Converted to AfroTools Pro' : 'Cashout: $' + cashAmount.toFixed(2) + ' via ' + method.replace(/_/g, ' ')
      })
    });

    // Update profile
    await sbFetch('points_profiles?user_id=eq.' + user.id, {
      method: 'PATCH',
      body: JSON.stringify({
        total_spent: (profile.total_spent || 0) + points_amount,
        current_balance: profile.current_balance - points_amount,
        updated_at: new Date().toISOString()
      })
    });

    return reply(200, { success: true, points_deducted: points_amount, cash_amount: cashAmount, method: method }, headers);

  } catch (err) {
    console.error('AfroPoints cashout error:', err);
    return reply(500, { error: 'Internal server error' }, headers);
  }
};
