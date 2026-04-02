// netlify/functions/afropoints-verify.js
// Consensus verification — confirms contributions when enough independent reports agree

const SUPABASE_URL = process.env.SUPABASE_AUTH_URL || 'https://zpclagtgczsygrgztlts.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;

function cors(event) {
  const origin = event.headers?.origin || '';
  const ok = origin === 'https://afrotools.com' || origin === 'https://www.afrotools.com' || origin.endsWith('.netlify.app') || origin.startsWith('http://localhost') || origin.startsWith('http://127.0.0.1');
  return { 'Access-Control-Allow-Origin': ok ? origin : 'https://afrotools.com', 'Access-Control-Allow-Headers': 'Content-Type, Authorization', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Content-Type': 'application/json', 'Vary': 'Origin' };
}

function reply(s, b, h) { return { statusCode: s, headers: h, body: JSON.stringify(b) }; }

// Category consensus rules
const RULES = {
  product_price:  { min: 2, days: 7,  pct: 0.20 },
  forex_rate:     { min: 3, days: 1,  pct: 0.05 },
  fuel_price:     { min: 2, days: 7,  pct: 0.20 },
  rent:           { min: 3, days: 30, pct: 0.30 },
  transport:      { min: 3, days: 14, pct: 0.20 },
  salary:         { min: 5, days: 90, pct: 0 },
  business_cost:  { min: 3, days: 30, pct: 0.30 },
  meal_price:     { min: 2, days: 14, pct: 0.20 },
  fintech_fee:    { min: 3, days: 30, pct: 0.20 },
  education_cost: { min: 3, days: 90, pct: 0.30 }
};

const BONUS = { product_price: 3, forex_rate: 5, fuel_price: 3, rent: 5, transport: 3, salary: 0, business_cost: 5, meal_price: 3, fintech_fee: 5, education_cost: 3 };

async function sbFetch(path, opts) {
  const res = await fetch(SUPABASE_URL + '/rest/v1/' + path, {
    ...opts,
    headers: { apikey: SUPABASE_KEY, Authorization: 'Bearer ' + SUPABASE_KEY, 'Content-Type': 'application/json', ...(opts?.headers || {}) }
  });
  const text = await res.text();
  try { return JSON.parse(text); } catch { return text; }
}

function getNumericValue(payload, category) {
  switch (category) {
    case 'product_price': case 'meal_price': return payload.price;
    case 'forex_rate': return payload.buy_rate;
    case 'fuel_price': return payload.price_per_unit;
    case 'rent': return payload.rent_amount;
    case 'transport': return payload.fare;
    case 'salary': return payload.monthly_gross;
    case 'business_cost': return payload.monthly_amount;
    case 'fintech_fee': return payload.fee_amount;
    case 'education_cost': return payload.amount;
    default: return null;
  }
}

function median(arr) {
  const sorted = arr.slice().sort(function (a, b) { return a - b; });
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

exports.handler = async function (event) {
  const headers = cors(event);
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers, body: '' };
  if (event.httpMethod !== 'POST') return reply(405, { error: 'Method not allowed' }, headers);
  if (!SUPABASE_KEY) return reply(500, { error: 'Server not configured' }, headers);

  try {
    let confirmed = 0, flagged = 0;

    for (const category of Object.keys(RULES)) {
      const rule = RULES[category];
      const cutoff = new Date(Date.now() - rule.days * 86400000).toISOString();

      // Get pending contributions grouped by city
      const pending = await sbFetch(
        'contributions?status=eq.pending&data_category=eq.' + category + '&submitted_at=gte.' + cutoff + '&order=country_code,city&select=*'
      );
      if (!Array.isArray(pending) || pending.length === 0) continue;

      // Group by country+city
      const groups = {};
      for (const c of pending) {
        const key = c.country_code + '|' + c.city.toLowerCase();
        if (!groups[key]) groups[key] = [];
        groups[key].push(c);
      }

      for (const key of Object.keys(groups)) {
        const group = groups[key];
        // Deduplicate by user_id (one per user)
        const byUser = {};
        for (const c of group) { if (!byUser[c.user_id]) byUser[c.user_id] = c; }
        const unique = Object.values(byUser);

        if (unique.length < rule.min) continue;

        // Extract numeric values
        const values = unique.map(function (c) { return getNumericValue(c.payload, category); }).filter(function (v) { return v != null && v > 0; });
        if (values.length < rule.min) continue;

        const med = median(values);
        if (med === 0) continue;

        // Salary category: just confirm by count, no threshold check
        if (rule.pct === 0) {
          for (const c of unique) {
            await sbFetch('contributions?id=eq.' + c.id, {
              method: 'PATCH',
              headers: { Prefer: 'return=minimal' },
              body: JSON.stringify({ status: 'confirmed', confidence_score: 80, confirmed_by_count: unique.length, confirmed_at: new Date().toISOString() })
            });
            confirmed++;
          }
          continue;
        }

        // Check consensus
        const withinThreshold = unique.filter(function (c) {
          var v = getNumericValue(c.payload, category);
          return v && Math.abs(v - med) / med <= rule.pct;
        });

        if (withinThreshold.length >= rule.min) {
          const score = Math.min(100, Math.round((withinThreshold.length / unique.length) * 100));

          for (const c of withinThreshold) {
            await sbFetch('contributions?id=eq.' + c.id, {
              method: 'PATCH',
              headers: { Prefer: 'return=minimal' },
              body: JSON.stringify({ status: 'confirmed', confidence_score: score, confirmed_by_count: withinThreshold.length, bonus_awarded: true, confirmed_at: new Date().toISOString() })
            });

            // Award confirmation bonus
            const bonus = BONUS[category] || 3;
            if (bonus > 0) {
              await sbFetch('points_ledger', {
                method: 'POST',
                body: JSON.stringify({ user_id: c.user_id, amount: bonus, reason: 'confirmation_bonus', contribution_id: c.id, description: 'Consensus confirmed: ' + category.replace(/_/g, ' ') })
              });

              // Update profile balance
              await sbFetch('points_profiles?user_id=eq.' + c.user_id, {
                method: 'PATCH',
                headers: { Prefer: 'return=minimal' },
                body: JSON.stringify({
                  total_earned: undefined, // Would need RPC for atomic increment
                  confirmations_count: undefined,
                  updated_at: new Date().toISOString()
                })
              });
            }
            confirmed++;
          }

          // Flag outliers
          const outliers = unique.filter(function (c) {
            var v = getNumericValue(c.payload, category);
            return v && Math.abs(v - med) / med > 0.5;
          });
          for (const c of outliers) {
            await sbFetch('contributions?id=eq.' + c.id, {
              method: 'PATCH',
              headers: { Prefer: 'return=minimal' },
              body: JSON.stringify({ status: 'flagged' })
            });
            flagged++;
          }
        }
      }
    }

    return reply(200, { success: true, confirmed: confirmed, flagged: flagged }, headers);
  } catch (err) {
    console.error('AfroPoints verify error:', err);
    return reply(500, { error: 'Internal server error' }, headers);
  }
};
