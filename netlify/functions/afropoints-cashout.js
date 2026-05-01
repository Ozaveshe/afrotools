// netlify/functions/afropoints-cashout.js
// Handle cashout requests, Pro-credit activation, and crypto payouts.

const SUPABASE_URL = process.env.SUPABASE_AUTH_URL || 'https://zpclagtgczsygrgztlts.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;

const MIN_CASHOUT = 2000;
const PRO_COST = 500;
const PAYOUT_METHODS = ['mobile_money', 'bank_transfer', 'crypto_wallet', 'pro_credit'];
const CRYPTO_ASSETS = ['USDT', 'USDC', 'BTC', 'ETH'];
const CRYPTO_NETWORKS = ['TRON', 'Ethereum', 'Polygon', 'Solana', 'Bitcoin'];

function cors(event) {
  const origin = event.headers?.origin || '';
  const ok = origin === 'https://afrotools.com' ||
    origin === 'https://www.afrotools.com' ||
    origin.endsWith('.netlify.app') ||
    origin.startsWith('http://localhost') ||
    origin.startsWith('http://127.0.0.1');

  return {
    'Access-Control-Allow-Origin': ok ? origin : 'https://afrotools.com',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json',
    'Vary': 'Origin'
  };
}

function reply(statusCode, body, headers) {
  return { statusCode, headers, body: JSON.stringify(body) };
}

function cleanText(value) {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function mergeBadges(existing, next) {
  const merged = new Set(Array.isArray(existing) ? existing : []);
  (next || []).forEach(function (badgeId) {
    if (badgeId) merged.add(badgeId);
  });
  return Array.from(merged);
}

async function getUser(event) {
  const auth = event.headers?.authorization || '';
  if (!auth.startsWith('Bearer ')) return null;

  const token = auth.slice(7);
  try {
    const response = await fetch(SUPABASE_URL + '/auth/v1/user', {
      headers: { apikey: SUPABASE_KEY, Authorization: 'Bearer ' + token }
    });
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}

async function sbFetch(path, options) {
  const response = await fetch(SUPABASE_URL + '/rest/v1/' + path, {
    ...options,
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: 'Bearer ' + SUPABASE_KEY,
      'Content-Type': 'application/json',
      Prefer: options?.method === 'POST' ? 'return=representation' : 'return=minimal',
      ...(options?.headers || {})
    }
  });

  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

async function fetchPointsProfile(userId) {
  const profiles = await sbFetch('points_profiles?user_id=eq.' + userId);
  return Array.isArray(profiles) && profiles[0] ? profiles[0] : null;
}

async function fetchPublicProfile(userId) {
  const profiles = await sbFetch('profiles?id=eq.' + userId);
  return Array.isArray(profiles) && profiles[0] ? profiles[0] : null;
}

async function savePublicProfile(userId, payload) {
  const existing = await fetchPublicProfile(userId);
  if (existing) {
    await sbFetch('profiles?id=eq.' + userId, {
      method: 'PATCH',
      headers: { Prefer: 'return=minimal' },
      body: JSON.stringify(payload)
    });
    return;
  }

  await sbFetch('profiles', {
    method: 'POST',
    headers: { Prefer: 'return=minimal' },
    body: JSON.stringify({
      id: userId,
      created_at: new Date().toISOString(),
      ...payload
    })
  });
}

function validateDetails(method, details) {
  if (method === 'mobile_money') {
    const provider = cleanText(details.provider);
    const phone = cleanText(details.phone);
    if (!provider || !phone) return { error: 'Provider and phone number are required' };
    return { value: { provider, phone } };
  }

  if (method === 'bank_transfer') {
    const bank = cleanText(details.bank);
    const account = cleanText(details.account);
    const holder = cleanText(details.holder);
    if (!bank || !account || !holder) return { error: 'All bank details are required' };
    return { value: { bank, account, holder } };
  }

  if (method === 'crypto_wallet') {
    const asset = cleanText(details.asset);
    const network = cleanText(details.network);
    const address = cleanText(details.address);
    const walletLabel = cleanText(details.wallet_label);

    if (!asset || !CRYPTO_ASSETS.includes(asset)) return { error: 'Choose a supported crypto asset' };
    if (!network || !CRYPTO_NETWORKS.includes(network)) return { error: 'Choose a supported payout network' };
    if (!address || address.length < 12) return { error: 'Wallet address looks incomplete' };

    return {
      value: {
        asset,
        network,
        address,
        wallet_label: walletLabel
      }
    };
  }

  if (method === 'pro_credit') {
    return { value: {} };
  }

  return { error: 'Invalid payout method' };
}

exports.handler = async function (event) {
  const headers = cors(event);

  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers, body: '' };
  if (!SUPABASE_KEY) return reply(500, { error: 'Server not configured' }, headers);

  const user = await getUser(event);
  if (!user) return reply(401, { error: 'Authentication required' }, headers);

  if (event.httpMethod === 'GET') {
    const history = await sbFetch('cashout_requests?user_id=eq.' + user.id + '&order=created_at.desc&limit=20');
    return reply(200, Array.isArray(history) ? history : [], headers);
  }

  if (event.httpMethod !== 'POST') return reply(405, { error: 'Method not allowed' }, headers);

  let body;
  try {
    body = JSON.parse(event.body);
  } catch {
    return reply(400, { error: 'Invalid JSON' }, headers);
  }

  const method = cleanText(body.method);
  const details = body.details && typeof body.details === 'object' ? body.details : {};
  const pointsAmount = Number(body.points_amount);

  if (!method || !PAYOUT_METHODS.includes(method)) return reply(400, { error: 'Invalid payout method' }, headers);
  if (!Number.isFinite(pointsAmount) || pointsAmount <= 0) return reply(400, { error: 'Invalid points amount' }, headers);

  const minRequired = method === 'pro_credit' ? PRO_COST : MIN_CASHOUT;
  if (pointsAmount < minRequired) return reply(400, { error: 'Minimum ' + minRequired + ' points required' }, headers);

  if (method === 'pro_credit' && pointsAmount % PRO_COST !== 0) {
    return reply(400, { error: 'AfroTools Pro credit must be redeemed in 500-point blocks' }, headers);
  }

  try {
    const profile = await fetchPointsProfile(user.id);
    if (!profile) return reply(400, { error: 'No points profile found' }, headers);
    if ((profile.current_balance || 0) < pointsAmount) return reply(400, { error: 'Insufficient balance' }, headers);

    const savedDetails = profile.payout_preference === method && profile.payout_details && typeof profile.payout_details === 'object'
      ? profile.payout_details
      : {};
    const detailsForValidation = Object.keys(details).length > 0 ? details : savedDetails;
    const validation = validateDetails(method, detailsForValidation);
    if (validation.error) return reply(400, { error: validation.error }, headers);

    if (method !== 'pro_credit') {
      const pending = await sbFetch('cashout_requests?user_id=eq.' + user.id + '&status=eq.pending');
      if (Array.isArray(pending) && pending.length > 0) {
        return reply(400, { error: 'You already have a pending cashout request' }, headers);
      }
    }

    const priorCashouts = await sbFetch('cashout_requests?select=id&user_id=eq.' + user.id + '&limit=1');
    const isFirstCashout = !Array.isArray(priorCashouts) || priorCashouts.length === 0;
    const cashAmount = pointsAmount / 100;
    const nowIso = new Date().toISOString();
    const requestStatus = method === 'pro_credit' ? 'completed' : 'pending';

    const requestRows = await sbFetch('cashout_requests', {
      method: 'POST',
      body: JSON.stringify({
        user_id: user.id,
        points_amount: pointsAmount,
        cash_amount: cashAmount,
        cash_currency: 'USD',
        payout_method: method,
        payout_details: validation.value,
        status: requestStatus,
        processed_at: requestStatus === 'completed' ? nowIso : null
      })
    });

    await sbFetch('points_ledger', {
      method: 'POST',
      body: JSON.stringify({
        user_id: user.id,
        amount: -pointsAmount,
        reason: method === 'pro_credit' ? 'pro_credit' : 'cashout',
        description: method === 'pro_credit'
          ? 'Converted to AfroTools Pro credit'
          : 'Cashout request via ' + method.replace(/_/g, ' ')
      })
    });

    const nextBadges = isFirstCashout
      ? mergeBadges(profile.badges, ['first_cashout'])
      : (Array.isArray(profile.badges) ? profile.badges : []);

    await sbFetch('points_profiles?user_id=eq.' + user.id, {
      method: 'PATCH',
      body: JSON.stringify({
        total_spent: (profile.total_spent || 0) + pointsAmount,
        current_balance: (profile.current_balance || 0) - pointsAmount,
        badges: nextBadges,
        updated_at: nowIso
      })
    });

    let proMonthsGranted = 0;
    if (method === 'pro_credit') {
      proMonthsGranted = Math.floor(pointsAmount / PRO_COST);
      const publicProfile = await fetchPublicProfile(user.id);
      const baseDate = publicProfile?.subscription_expires_at && new Date(publicProfile.subscription_expires_at) > new Date()
        ? new Date(publicProfile.subscription_expires_at)
        : new Date();
      baseDate.setUTCDate(baseDate.getUTCDate() + (30 * proMonthsGranted));

      await savePublicProfile(user.id, {
        tier: 'pro',
        subscription_tier: 'pro',
        subscription_expires_at: baseDate.toISOString(),
        updated_at: nowIso
      });
    }

    return reply(200, {
      success: true,
      request_id: Array.isArray(requestRows) && requestRows[0] ? requestRows[0].id : null,
      status: requestStatus,
      points_deducted: pointsAmount,
      cash_amount: cashAmount,
      method,
      pro_months_granted: proMonthsGranted,
      review_eta: method === 'pro_credit' ? 'Immediate' : '24-72 hours'
    }, headers);
  } catch (error) {
    console.error('AfroPoints cashout error:', error);
    return reply(500, { error: 'Internal server error' }, headers);
  }
};
