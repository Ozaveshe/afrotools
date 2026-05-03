// netlify/functions/creator-hashtags.js
// AI hashtag generation for TagWave — uses Anthropic Claude API

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const { safeAnthropicText } = require('./_shared/anthropic-request');
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://jbmhfpkzbgyeodsqhprx.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_DATA_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const AUTH_SUPABASE_URL = 'https://zpclagtgczsygrgztlts.supabase.co';
const AUTH_SUPABASE_KEY = process.env.SUPABASE_ANON_KEY_AUTH || process.env.SUPABASE_ANON_KEY;

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Content-Type': 'application/json'
};

const SYSTEM_PROMPT = `You are TagWave, a hashtag strategy expert for African content creators.

RULES:
- Generate exactly 3 hashtag sets with different strategies (Broad Reach, Niche Play, Community)
- Each set should have the right number of tags for the specified platform
- Categorize each tag by reach level (high/mid/niche) with estimated post count
- Include African creator community tags when relevant (#NaijaCreative, #KenyanCreator, #SACreatives, etc.)
- Include local/cultural tags when relevant (#Owambe, #Amapiano, #Jollof, etc.)
- NO banned or shadowbanned hashtags
- NO irrelevant tags just to fill the count
- Tags must be ACTUALLY USED on the platform — don't invent tags nobody searches
- For Instagram: aim for 10-15 tags per set
- For TikTok: aim for 5-8 tags per set
- For X: aim for 1-3 tags per set
- For LinkedIn: aim for 3-5 tags per set
- For YouTube: aim for 8-12 SEO tags per set
- Include trending/seasonal tags when applicable

OUTPUT FORMAT (JSON only, no markdown fences):
{
  "sets": [
    {
      "name": "THE BROAD REACH",
      "strategy": "Maximum impressions with competitive tags",
      "tags": [
        { "tag": "#Photography", "reach": "high", "estimatedPosts": "420M" }
      ],
      "totalTags": 10,
      "estimatedReach": "45M"
    }
  ],
  "trendingNote": "optional trending tip or empty string",
  "avoidList": ["#FollowForFollow — attracts bots, not real engagement"]
}`;

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
  if (!SUPABASE_KEY) return { allowed: false, remaining: 0, serviceUnavailable: true };
  var today = new Date().toISOString().split('T')[0];
  var res = await fetch(
    SUPABASE_URL + '/rest/v1/creator_hashtags_history?user_id=eq.' + userId +
    '&created_at=gte.' + today + 'T00:00:00Z&select=id',
    { headers: { 'apikey': SUPABASE_KEY, 'Authorization': 'Bearer ' + SUPABASE_KEY } }
  );
  if (!res.ok) return { allowed: true, remaining: DAILY_LIMIT_FREE };
  var items = await res.json();
  var used = items.length;
  return { allowed: used < DAILY_LIMIT_FREE, remaining: Math.max(0, DAILY_LIMIT_FREE - used), used: used, limit: DAILY_LIMIT_FREE };
}

async function saveGeneration(userId, topic, platform, sets, customMix) {
  if (!SUPABASE_KEY) return;
  await fetch(SUPABASE_URL + '/rest/v1/creator_hashtags_history', {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_KEY, 'Authorization': 'Bearer ' + SUPABASE_KEY,
      'Content-Type': 'application/json', 'Prefer': 'return=minimal'
    },
    body: JSON.stringify({
      user_id: userId,
      topic: topic,
      platform: platform || 'instagram',
      sets: sets,
      custom_mix: customMix || []
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
  if (!SUPABASE_KEY) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Server config error' }) };
  }

  try {
    var user = await getUser(event);
    if (!user) {
      return { statusCode: 401, headers, body: JSON.stringify({ error: 'Sign in to generate hashtags' }) };
    }

    var path = event.path.replace('/.netlify/functions/creator-hashtags', '').replace(/^\//, '');
    var body = JSON.parse(event.body || '{}');

    if (path === 'generate' || path === '') {
      var rateCheck = await checkRateLimit(user.id);
      if (!rateCheck.allowed) {
        return {
          statusCode: 429, headers,
          body: JSON.stringify({ error: 'Daily limit reached (' + rateCheck.limit + ' generations). Resets at midnight.', remaining: 0 })
        };
      }

      var prompt = safeAnthropicText(body.prompt || '', 'Creator hashtag prompt', 160000);
      if (!prompt) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Prompt is required' }) };
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
          system: safeAnthropicText(SYSTEM_PROMPT, 'Creator hashtag system prompt', 120000),
          messages: [{ role: 'user', content: prompt }]
        })
      });

      if (!aiRes.ok) {
        var errText = await aiRes.text();
        throw new Error('AI API error: ' + errText);
      }

      var aiData = await aiRes.json();
      var outputText = aiData.content[0].text;

      // Try to parse as JSON
      var parsed = null;
      try {
        var match = outputText.match(/\{[\s\S]*\}/);
        if (match) parsed = JSON.parse(match[0]);
      } catch(e) {}

      // Save to DB (fire and forget)
      if (parsed && parsed.sets) {
        saveGeneration(user.id, body.topic || '', body.platform || 'instagram', parsed.sets, []).catch(function() {});
      }

      return {
        statusCode: 200, headers,
        body: JSON.stringify({
          output: parsed || outputText,
          remaining: rateCheck.remaining - 1
        })
      };
    }

    return { statusCode: 404, headers, body: JSON.stringify({ error: 'Not found' }) };

  } catch (err) {
    console.error('creator-hashtags error:', err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
