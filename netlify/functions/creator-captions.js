// netlify/functions/creator-captions.js
// AI caption generation for CaptionCraft — platform-specific, 3 variations per generation

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

const SYSTEM_PROMPT = `You are CaptionCraft, a social media caption expert for African content creators.

RULES:
- Generate exactly 3 caption variations, each with a different approach
- Follow platform-specific formatting rules EXACTLY (line breaks, character limits, hashtag placement)
- Each variation should have a different energy: one safe/reliable, one creative/bold, one unique/unexpected
- African cultural context when natural — don't force it, but don't sanitize it either
- Include the requested elements (CTA, hashtags, emoji, question) when toggled on
- Hashtags must be relevant — mix of high-traffic and niche-specific
- First line is ALWAYS a hook — never start with "Hey everyone" or "Good morning"
- Captions should sound like a REAL PERSON wrote them, not an AI

OUTPUT FORMAT — Return ONLY valid JSON, no markdown code fences:
{
  "captions": [
    {
      "variation": 1,
      "label": "The Reliable One",
      "text": "Full caption text with proper line breaks",
      "charCount": 245,
      "withinLimit": true,
      "hashtags": ["#AfricanCreator", "#ContentTips"],
      "cta": "Save this for later",
      "firstLinePreview": "First 125 chars of the caption..."
    },
    { "variation": 2, "label": "The Bold One", ... },
    { "variation": 3, "label": "The Creative One", ... }
  ],
  "platformTip": "On Instagram, your first 125 characters appear before 'more'. This caption's hook fits perfectly."
}`;

const DAILY_LIMIT_FREE = 10;

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
    SUPABASE_URL + '/rest/v1/creator_captions_history?user_id=eq.' + userId +
    '&created_at=gte.' + today + 'T00:00:00Z&select=id',
    { headers: { 'apikey': SUPABASE_KEY, 'Authorization': 'Bearer ' + SUPABASE_KEY } }
  );
  if (!res.ok) return { allowed: true, remaining: DAILY_LIMIT_FREE };
  var items = await res.json();
  var used = items.length;
  return { allowed: used < DAILY_LIMIT_FREE, remaining: Math.max(0, DAILY_LIMIT_FREE - used), used: used, limit: DAILY_LIMIT_FREE };
}

async function saveGeneration(userId, brief, platform, tone, captions) {
  if (!SUPABASE_KEY) return;
  await fetch(SUPABASE_URL + '/rest/v1/creator_captions_history', {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_KEY, 'Authorization': 'Bearer ' + SUPABASE_KEY,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      user_id: userId,
      brief: brief,
      platform: platform || 'instagram',
      tone: tone || 'casual',
      captions: captions
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
    var user = await getUser(event);
    var path = event.path.replace('/.netlify/functions/creator-captions', '').replace(/^\//, '');
    var body = JSON.parse(event.body || '{}');

    // -- GENERATE --
    if (path === 'generate' || path === '') {
      var rateCheck = user ? await checkRateLimit(user.id) : { allowed: true, remaining: null };
      if (user && !rateCheck.allowed) {
        return {
          statusCode: 429, headers,
          body: JSON.stringify({ error: 'Daily limit reached (' + rateCheck.limit + ' generations). Resets at midnight.', remaining: 0 })
        };
      }

      var prompt = safeAnthropicText(body.prompt || '', 'Creator caption prompt', 160000);
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
          system: safeAnthropicText(SYSTEM_PROMPT, 'Creator caption system prompt', 120000),
          messages: [{ role: 'user', content: prompt }]
        })
      });

      if (!aiRes.ok) {
        var errText = await aiRes.text();
        throw new Error('AI API error: ' + errText);
      }

      var aiData = await aiRes.json();
      var outputText = aiData.content[0].text;

      // Save (fire and forget)
      if (user) {
        saveGeneration(user.id, body.brief || prompt.substring(0, 200), body.platform || 'instagram', body.tone || 'casual', outputText).catch(function() {});
      }

      var responseBody = { output: outputText };
      if (user && rateCheck.remaining !== null && rateCheck.remaining !== undefined) {
        responseBody.remaining = rateCheck.remaining - 1;
      }

      return { statusCode: 200, headers, body: JSON.stringify(responseBody) };
    }

    // -- REWRITE --
    if (path === 'rewrite') {
      var rateCheck2 = user ? await checkRateLimit(user.id) : { allowed: true, remaining: null };
      if (user && !rateCheck2.allowed) {
        return {
          statusCode: 429, headers,
          body: JSON.stringify({ error: 'Daily limit reached. Resets at midnight.', remaining: 0 })
        };
      }

      var existingCaption = safeAnthropicText(body.caption || '', 'Caption rewrite input', 140000);
      var rewritePlatform = body.platform || 'instagram';
      if (!existingCaption) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Paste a caption to rewrite' }) };
      }

      var rewritePrompt = safeAnthropicText(
        'Rewrite and improve this existing ' + rewritePlatform + ' caption. Generate 3 improved variations:\n\n"' + existingCaption + '"',
        'Caption rewrite prompt',
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
          max_tokens: 1200,
          system: safeAnthropicText(SYSTEM_PROMPT, 'Creator caption system prompt', 120000),
          messages: [{ role: 'user', content: rewritePrompt }]
        })
      });

      if (!aiRes2.ok) {
        var errText2 = await aiRes2.text();
        throw new Error('AI API error: ' + errText2);
      }

      var aiData2 = await aiRes2.json();
      var outputText2 = aiData2.content[0].text;

      if (user) {
        saveGeneration(user.id, 'Rewrite: ' + existingCaption.substring(0, 150), rewritePlatform, 'rewrite', outputText2).catch(function() {});
      }

      var rewriteResponse = { output: outputText2 };
      if (user && rateCheck2.remaining !== null && rateCheck2.remaining !== undefined) {
        rewriteResponse.remaining = rateCheck2.remaining - 1;
      }

      return { statusCode: 200, headers, body: JSON.stringify(rewriteResponse) };
    }

    return { statusCode: 404, headers, body: JSON.stringify({ error: 'Not found' }) };

  } catch (err) {
    console.error('creator-captions error:', err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
