/**
 * AfroTools — Crypto Portfolio AI Advisor
 *
 * POST /api/crypto-advisor
 * Body: { holdings, marketSummary, currency }
 * Returns: { advice, score, riskLevel }
 *
 * Requires auth (Bearer token) + ANTHROPIC_API_KEY
 * Rate limited: 5 calls/day per user
 */

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const SUPABASE_URL = process.env.SUPABASE_AUTH_URL || 'https://zpclagtgczsygrgztlts.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY_AUTH;
if (!SUPABASE_ANON_KEY) console.warn('[crypto-portfolio-advisor] Missing SUPABASE_ANON_KEY_AUTH env var');
const { getAllowedOrigin } = require('./utils/cors');

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': 'https://afrotools.com',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json',
};

function jsonResponse(statusCode, body) {
  return { statusCode, headers: CORS_HEADERS, body: JSON.stringify(body) };
}

async function getUserFromToken(authHeader) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.replace('Bearer ', '');
  const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return null;
  const user = await res.json();
  return user && user.id ? user : null;
}

// Simple in-memory rate limiting (resets on cold start)
const rateLimits = {};
function checkRate(userId) {
  const today = new Date().toISOString().slice(0, 10);
  const key = `${userId}_${today}`;
  rateLimits[key] = (rateLimits[key] || 0) + 1;
  return rateLimits[key] <= 5;
}

exports.handler = async function (event) {
  CORS_HEADERS['Access-Control-Allow-Origin'] = getAllowedOrigin(event);
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS_HEADERS, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return jsonResponse(405, { error: 'POST only' });
  }

  if (!ANTHROPIC_API_KEY) {
    return jsonResponse(500, { error: 'AI service not configured' });
  }

  const user = await getUserFromToken(event.headers['authorization'] || event.headers['Authorization']);
  if (!user) return jsonResponse(401, { error: 'Sign in to use the AI advisor' });

  if (!checkRate(user.id)) {
    return jsonResponse(429, { error: 'Daily limit reached (5 analyses per day). Try again tomorrow.' });
  }

  let body;
  try { body = JSON.parse(event.body); } catch { return jsonResponse(400, { error: 'Invalid JSON' }); }

  const { holdings, marketSummary, currency } = body;
  if (!holdings || !Array.isArray(holdings) || holdings.length === 0) {
    return jsonResponse(400, { error: 'Portfolio holdings required' });
  }

  // Build portfolio context for Claude
  const holdingsText = holdings
    .sort((a, b) => (b.allocation || 0) - (a.allocation || 0))
    .map(h => `${h.symbol}: ${(h.allocation || 0).toFixed(1)}% allocation, value ${h.value ? h.value.toFixed(0) : '?'} ${(currency || 'NGN').toUpperCase()}${h.pnl != null ? ', P/L ' + (h.pnl >= 0 ? '+' : '') + h.pnl.toFixed(0) : ''}`)
    .join('\n');

  const currencyUpper = (currency || 'ngn').toUpperCase();
  const totalValue = marketSummary?.totalValue || 0;
  const numCoins = marketSummary?.numCoins || holdings.length;

  const systemPrompt = `You are the AfroTools Crypto Portfolio Advisor. You analyze cryptocurrency portfolios for African investors. You are direct, practical, and data-driven.

Given the user's holdings and market data, provide:
1. **Portfolio Score** (0-100): Based on diversification (40%), risk management (30%), allocation balance (30%)
2. **Diversification Analysis**: Concentration risk, sector spread
3. **3 Actionable Suggestions**: Specific, practical advice (e.g. "Consider reducing BTC from 70% to 40%")
4. **Risk Warnings**: If any single coin > 40% allocation, if portfolio < 3 coins, or if too exposed to one sector

Rules:
- Keep response under 250 words
- Use ${currencyUpper} for all monetary values
- Reference specific coins by name
- Be direct with numbers
- Start with "**Score: XX/100**" on the first line
- Use bullet points for suggestions
- No markdown headers, just bold text with **
- Consider African market context (NGN volatility, P2P trading costs, stablecoin savings)`;

  const userMessage = `Analyze this portfolio:

Total Value: ${totalValue.toFixed(0)} ${currencyUpper}
Number of Coins: ${numCoins}

Holdings:
${holdingsText}

Provide your analysis.`;

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 500,
        system: systemPrompt,
        messages: [{ role: 'user', content: userMessage }],
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error('[portfolio-advisor] Anthropic error:', err);
      return jsonResponse(502, { error: 'AI service error' });
    }

    const data = await res.json();
    const advice = data.content?.[0]?.text || 'Unable to generate analysis.';

    // Extract score from response (looks for "Score: XX/100")
    let score = null;
    const scoreMatch = advice.match(/Score:\s*(\d+)\s*\/\s*100/i);
    if (scoreMatch) score = parseInt(scoreMatch[1]);

    const riskLevel = score >= 70 ? 'low' : score >= 40 ? 'medium' : 'high';

    return jsonResponse(200, { advice, score, riskLevel });
  } catch (err) {
    console.error('[portfolio-advisor] Error:', err.message);
    return jsonResponse(500, { error: 'Analysis failed' });
  }
};
