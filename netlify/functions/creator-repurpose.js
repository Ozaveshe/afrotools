// netlify/functions/creator-repurpose.js
// AI content repurposing — one source → multiple platform-ready outputs

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

const SYSTEM_PROMPT = `You are Repurpose, a content repurposing expert for African content creators.

RULES:
- Take the source content and create GENUINELY DIFFERENT versions for each requested platform
- Do NOT just copy-paste and shorten. Each platform version should feel NATIVE to that platform.
- Adapt tone: LinkedIn is more professional, TikTok is casual and fast, Instagram is visual-first
- Preserve the core message and key points but present them differently
- For X threads: each tweet must stand alone AND flow as a sequence. Hard 280-char limit per tweet.
- For TikTok: write actual SCRIPTS (what to SAY), not captions. 3 scripts, different angles.
- For LinkedIn: restructure as thought leadership, not a casual share
- For Newsletter: include subject line, opening hook, bullet takeaways, CTA
- Include platform-specific elements (hashtags for IG, thread numbering for X, etc.)
- African context preservation — if the source mentions African specifics, keep them natural
- If the source is about a topic with African relevance, lean into it

OUTPUT FORMAT — Return ONLY valid JSON, no markdown code fences:
{
  "source": {
    "wordCount": 2450,
    "keyPoints": ["Point 1", "Point 2", "Point 3"]
  },
  "outputs": [
    {
      "platform": "instagram",
      "text": "Full caption with line breaks",
      "charCount": 1200,
      "hashtags": ["#tag1", "#tag2"],
      "format": "caption"
    },
    {
      "platform": "twitter",
      "tweets": [
        { "number": 1, "text": "First tweet hook..." },
        { "number": 2, "text": "Second tweet..." }
      ],
      "format": "thread"
    },
    {
      "platform": "linkedin",
      "text": "Professional post...",
      "charCount": 800,
      "hashtags": ["#tag1"],
      "format": "post"
    },
    {
      "platform": "tiktok",
      "scripts": [
        { "angle": "Hot Take", "text": "Script text...", "duration": "30s" },
        { "angle": "Tutorial", "text": "Script text...", "duration": "45s" },
        { "angle": "Storytime", "text": "Script text...", "duration": "60s" }
      ],
      "format": "scripts"
    },
    {
      "platform": "newsletter",
      "subjectLine": "Subject line here",
      "text": "Opening hook...\\n\\nKey takeaways:\\n- Point 1\\n- Point 2\\n\\nCTA text",
      "format": "snippet"
    },
    {
      "platform": "facebook",
      "text": "Longer narrative post...",
      "charCount": 600,
      "format": "post"
    },
    {
      "platform": "blog",
      "text": "Meta: 160-char description\\n\\nKey Takeaways:\\n- Point 1\\n- Point 2\\n\\nShare: Social snippet",
      "format": "summary"
    }
  ],
  "timeSaved": "~4 hours",
  "contentMultiplier": "1 → 5"
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
  if (!SUPABASE_KEY) return { allowed: false, remaining: 0, serviceUnavailable: true };
  var today = new Date().toISOString().split('T')[0];
  var res = await fetch(
    SUPABASE_URL + '/rest/v1/creator_repurpose_history?user_id=eq.' + userId +
    '&created_at=gte.' + today + 'T00:00:00Z&select=id',
    { headers: { 'apikey': SUPABASE_KEY, 'Authorization': 'Bearer ' + SUPABASE_KEY } }
  );
  if (!res.ok) return { allowed: true, remaining: DAILY_LIMIT_FREE };
  var items = await res.json();
  var used = items.length;
  return { allowed: used < DAILY_LIMIT_FREE, remaining: Math.max(0, DAILY_LIMIT_FREE - used), used: used, limit: DAILY_LIMIT_FREE };
}

async function saveGeneration(userId, sourceType, sourceText, platforms, outputs) {
  if (!SUPABASE_KEY) return;
  await fetch(SUPABASE_URL + '/rest/v1/creator_repurpose_history', {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_KEY, 'Authorization': 'Bearer ' + SUPABASE_KEY,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      user_id: userId,
      source_type: sourceType || 'youtube_script',
      source_text: (sourceText || '').substring(0, 5000),
      target_platforms: platforms || [],
      outputs: outputs
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
      return { statusCode: 401, headers, body: JSON.stringify({ error: 'Authentication required. Sign in to repurpose content.' }) };
    }

    var path = event.path.replace('/.netlify/functions/creator-repurpose', '').replace(/^\//, '');
    var body = JSON.parse(event.body || '{}');

    // -- GENERATE --
    if (path === 'generate' || path === '') {
      var rateCheck = await checkRateLimit(user.id);
      if (!rateCheck.allowed) {
        return {
          statusCode: 429, headers,
          body: JSON.stringify({ error: 'Daily limit reached (' + rateCheck.limit + ' generations). Resets at midnight.', remaining: 0 })
        };
      }

      var prompt = safeAnthropicText(body.prompt || '', 'Creator repurpose prompt', 180000);
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
          max_tokens: 3000,
          system: safeAnthropicText(SYSTEM_PROMPT, 'Creator repurpose system prompt', 120000),
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
      saveGeneration(user.id, body.sourceType, body.source, body.platforms, outputText).catch(function() {});

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
    console.error('creator-repurpose error:', err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
