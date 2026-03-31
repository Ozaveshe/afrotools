// netlify/functions/creator-bios.js
// AI generation function for BioForge — generates platform-optimized bios

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://jbmhfpkzbgyeodsqhprx.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;

const AUTH_SUPABASE_URL = 'https://zpclagtgczsygrgztlts.supabase.co';
const AUTH_SUPABASE_KEY = process.env.SUPABASE_ANON_KEY_AUTH || process.env.SUPABASE_ANON_KEY;

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Content-Type': 'application/json'
};

const SYSTEM_PROMPT = `You are BioForge, a bio writing expert for African content creators.

RULES:
- Generate bios for ALL platforms simultaneously: Instagram, TikTok, X/Twitter, LinkedIn (headline + about), YouTube, Threads
- Each bio MUST respect the platform's character limit EXACTLY
- Each bio should feel NATIVE to that platform:
  - Instagram: visual, emoji structure, line breaks, link reference
  - TikTok: ultra-short, trendy, Gen-Z energy if appropriate
  - X: witty, personality-first, no filler words
  - LinkedIn headline: professional keywords, searchable
  - LinkedIn about: storytelling, credibility, paragraphs
  - YouTube: discovery-focused, upload schedule mention, keywords
  - Threads: casual, conversational, personality
- Use the specified tone consistently across all bios
- African context natural — location, cultural references, local achievements
- Emoji usage should match platform norms (heavy on IG/TikTok, minimal on LinkedIn)
- NEVER use generic filler like "Passionate about..." or "Lover of..." — be specific
- Include ONE unique element that makes the creator memorable
- Return ONLY valid JSON, no markdown code fences`;

const DAILY_LIMIT_FREE = 5;

async function getUser(event) {
  var authHeader = event.headers.authorization || event.headers.Authorization || '';
  var token = authHeader.replace('Bearer ', '');
  if (!token) return null;

  var res = await fetch(AUTH_SUPABASE_URL + '/auth/v1/user', {
    headers: { 'apikey': AUTH_SUPABASE_KEY, 'Authorization': 'Bearer ' + token }
  });
  if (!res.ok) return null;
  var user = await res.json();
  return { id: user.id, token: token };
}

async function checkRateLimit(userId) {
  var today = new Date().toISOString().split('T')[0];
  var res = await fetch(
    SUPABASE_URL + '/rest/v1/creator_bios_history?user_id=eq.' + userId +
    '&created_at=gte.' + today + 'T00:00:00Z&select=id',
    { headers: { 'apikey': SUPABASE_KEY, 'Authorization': 'Bearer ' + SUPABASE_KEY } }
  );
  if (!res.ok) return { allowed: true, remaining: DAILY_LIMIT_FREE };
  var items = await res.json();
  var used = items.length;
  return { allowed: used < DAILY_LIMIT_FREE, remaining: Math.max(0, DAILY_LIMIT_FREE - used), used: used, limit: DAILY_LIMIT_FREE };
}

async function saveGeneration(userId, who, what, tone, bios) {
  await fetch(SUPABASE_URL + '/rest/v1/creator_bios_history', {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_KEY, 'Authorization': 'Bearer ' + SUPABASE_KEY,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      user_id: userId,
      who: who,
      what: what,
      tone: tone || 'professional',
      bios: bios
    })
  });
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    var user = await getUser(event);
    if (!user) {
      return { statusCode: 401, headers, body: JSON.stringify({ error: 'Authentication required. Please sign in to generate bios.' }) };
    }

    var path = event.path.replace('/.netlify/functions/creator-bios', '').replace(/^\//, '');
    var body = JSON.parse(event.body || '{}');

    if (path === 'generate' || path === '') {
      var rateCheck = await checkRateLimit(user.id);
      if (!rateCheck.allowed) {
        return {
          statusCode: 429, headers,
          body: JSON.stringify({ error: 'Daily limit reached (' + rateCheck.limit + ' generations). Resets at midnight.', remaining: 0 })
        };
      }

      var prompt = body.prompt || '';
      if (!prompt) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Prompt is required' }) };
      }

      var maxTokens = body.singlePlatform ? 500 : 2000;

      var aiRes = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: maxTokens,
          system: SYSTEM_PROMPT,
          messages: [{ role: 'user', content: prompt }]
        })
      });

      if (!aiRes.ok) {
        var errText = await aiRes.text();
        throw new Error('AI API error: ' + errText);
      }

      var aiData = await aiRes.json();
      var outputText = aiData.content[0].text;

      // Save to DB (fire and forget)
      if (!body.singlePlatform) {
        saveGeneration(user.id, body.who || '', body.what || '', body.tone || 'professional', outputText).catch(function() {});
      }

      return {
        statusCode: 200, headers,
        body: JSON.stringify({
          output: outputText,
          remaining: rateCheck.remaining - 1
        })
      };
    }

    return { statusCode: 404, headers, body: JSON.stringify({ error: 'Not found' }) };

  } catch (err) {
    console.error('creator-bios error:', err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
