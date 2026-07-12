// netlify/functions/creator-titles.js
// TitleSmith — AI Title & Headline Generator
// Uses Anthropic Claude API directly for fast title generation

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const { safeAnthropicText } = require('./_shared/anthropic-request');
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://zpclagtgczsygrgztlts.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_DATA_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const AUTH_SUPABASE_URL = 'https://zpclagtgczsygrgztlts.supabase.co';
const AUTH_SUPABASE_KEY = process.env.SUPABASE_ANON_KEY_AUTH || process.env.SUPABASE_ANON_KEY;

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Content-Type': 'application/json'
};

const SYSTEM_PROMPT = `You are TitleSmith, a title generation expert for African content creators.

RULES:
- Generate exactly 8 titles, one per style: Clickbait, SEO, Storyteller, Listicle, Question, Bold Claim, How-To, Viral
- Each title must be for the specified platform with appropriate length
- Use African context naturally — don't force it, but reference when relevant (Lagos, Nairobi, Accra, SA, African creator culture)
- Never use generic Western references when African ones work better
- Include character count for each title
- Make EVERY title genuinely interesting — no filler titles
- Vary sentence structure across the 8 — don't repeat patterns
- For YouTube: use brackets like [2026 Guide] or (Watch This) sparingly but effectively

OUTPUT FORMAT (JSON only, no markdown fences):
{"titles":[{"style":"clickbait","title":"...","charCount":58,"whyItWorks":"Curiosity gap + personal angle"},...],"abTest":{"titleA":0,"titleB":1,"winner":"A","reason":"Stronger emotional hook and more specific claim"}}`;

const DAILY_LIMIT_FREE = 10;
const DAILY_LIMIT_PRO = 50;

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
  if (!SUPABASE_KEY) return { allowed: true, remaining: null, serviceUnavailable: true };
  var today = new Date().toISOString().split('T')[0];
  var res = await fetch(
    SUPABASE_URL + '/rest/v1/creator_titles_history?user_id=eq.' + userId +
    '&created_at=gte.' + today + 'T00:00:00Z&select=id',
    { headers: { 'apikey': SUPABASE_KEY, 'Authorization': 'Bearer ' + SUPABASE_KEY } }
  );
  if (!res.ok) return { allowed: true, remaining: DAILY_LIMIT_FREE };
  var items = await res.json();
  var used = items.length;
  var limit = DAILY_LIMIT_FREE;
  return { allowed: used < limit, remaining: Math.max(0, limit - used), used: used, limit: limit };
}

async function saveGeneration(userId, topic, platform, titles) {
  if (!SUPABASE_KEY) return;
  await fetch(SUPABASE_URL + '/rest/v1/creator_titles_history', {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_KEY, 'Authorization': 'Bearer ' + SUPABASE_KEY,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      user_id: userId,
      topic: topic,
      platform: platform || 'youtube',
      titles: titles,
      favorited: []
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

  if (!ANTHROPIC_API_KEY) {
    return { statusCode: 503, headers, body: JSON.stringify({ error: 'AI service not configured' }) };
  }

  try {
    var body = JSON.parse(event.body || '{}');
    var path = event.path.replace('/.netlify/functions/creator-titles', '').replace(/^\//, '');

    // ── GENERATE TITLES ──
    if (path === 'generate' || path === '') {
      var topic = safeAnthropicText(body.topic || '', 'Creator title topic', 80000);
      var platform = body.platform || 'youtube';
      var prompt = safeAnthropicText(body.prompt || '', 'Creator title prompt', 160000);

      if (!topic && !prompt) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Topic is required' }) };
      }

      // Auth is optional for titles — allow anonymous with stricter limits
      var user = await getUser(event);
      var remaining = DAILY_LIMIT_FREE;

      if (user) {
        var rateCheck = await checkRateLimit(user.id);
        if (!rateCheck.allowed) {
          return {
            statusCode: 429, headers,
            body: JSON.stringify({ error: 'Daily limit reached (' + rateCheck.limit + ' generations). Resets at midnight.', remaining: 0 })
          };
        }
        remaining = rateCheck.remaining === null || rateCheck.remaining === undefined
          ? null
          : rateCheck.remaining - 1;
      }

      var aiRes = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 1200,
          system: safeAnthropicText(SYSTEM_PROMPT, 'Creator title system prompt', 120000),
          messages: [{ role: 'user', content: prompt || topic }]
        })
      });

      if (!aiRes.ok) {
        var errText = await aiRes.text();
        throw new Error('AI API error: ' + errText);
      }

      var aiData = await aiRes.json();
      var outputText = aiData.content[0].text;

      // Save to DB for logged-in users (fire and forget)
      if (user) {
        saveGeneration(user.id, topic || prompt, platform, outputText).catch(function() {});
      }

      return {
        statusCode: 200, headers,
        body: JSON.stringify({ output: outputText, remaining: remaining })
      };
    }

    // ── MORE LIKE THIS ──
    if (path === 'variations') {
      var style = body.style || '';
      var topic2 = safeAnthropicText(body.topic || '', 'Creator title topic', 80000);
      var platform2 = body.platform || 'youtube';

      if (!style || !topic2) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Style and topic required' }) };
      }

      var variationPrompt = safeAnthropicText('Generate 3 more title variations in the "' + style + '" style for this topic:\n\n' +
        'Topic: ' + topic2 + '\nPlatform: ' + platform2 + '\n\n' +
        'Return ONLY valid JSON, no markdown:\n' +
        '{"titles":[{"style":"' + style + '","title":"...","charCount":55,"whyItWorks":"..."},{"style":"' + style + '","title":"...","charCount":48,"whyItWorks":"..."},{"style":"' + style + '","title":"...","charCount":62,"whyItWorks":"..."}]}',
        'Title variation prompt',
        160000
      );

      var aiRes2 = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 600,
          system: safeAnthropicText(SYSTEM_PROMPT, 'Creator title system prompt', 120000),
          messages: [{ role: 'user', content: variationPrompt }]
        })
      });

      if (!aiRes2.ok) {
        var errText2 = await aiRes2.text();
        throw new Error('AI API error: ' + errText2);
      }

      var aiData2 = await aiRes2.json();
      return { statusCode: 200, headers, body: JSON.stringify({ output: aiData2.content[0].text }) };
    }

    return { statusCode: 404, headers, body: JSON.stringify({ error: 'Not found' }) };

  } catch (err) {
    console.error('creator-titles error:', err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
