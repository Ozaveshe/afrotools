// netlify/functions/creator-scripts.js
// AI generation function for ScriptPad — full video script generator
// Uses Anthropic Claude API directly for longer outputs

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

const SYSTEM_PROMPT = `You are ScriptPad, a video script writing expert for African content creators.

RULES:
- Generate a COMPLETE script, not an outline. Write every word the creator will say.
- Structure with clear sections, each with a timestamp estimate.
- Match the requested format (YouTube/Podcast/Voiceover/Educational/Storytime).
- Match the requested duration — a 5-8 min YouTube video = ~1200-1800 words.
- Include B-roll/visual suggestions in each section.
- Include transition phrases between sections.
- Write in SPOKEN language, not written. Short sentences. Contractions. Natural flow.
- African context where relevant — don't force it, but let it be natural.
- Hook must be compelling (use curiosity, controversy, or story techniques).
- CTA must be specific and natural, not "please like and subscribe" boilerplate.
- Include delivery notes: [PAUSE], [EMPHASIS], [SHOW SCREEN], [CUT TO B-ROLL].

CULTURAL INTELLIGENCE:
- Nigerian English (pidgin when appropriate, Yoruba/Igbo/Hausa sprinkles)
- East African English (Sheng for Kenyan content, Swahili phrases)
- South African English (township slang, Afrikaans phrases)
- Pan-African references (shared experiences across the continent)
- Diaspora awareness (London/US African communities)
NEVER force cultural references. Only include them when natural.

ALWAYS respond with valid JSON only. No markdown code fences.`;

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
    SUPABASE_URL + '/rest/v1/creator_scripts_history?user_id=eq.' + userId +
    '&created_at=gte.' + today + 'T00:00:00Z&select=id',
    { headers: { 'apikey': SUPABASE_KEY, 'Authorization': 'Bearer ' + SUPABASE_KEY } }
  );
  if (!res.ok) return { allowed: true, remaining: DAILY_LIMIT_FREE };
  var items = await res.json();
  var used = items.length;
  var limit = DAILY_LIMIT_FREE;
  return { allowed: used < limit, remaining: Math.max(0, limit - used), used: used, limit: limit };
}

async function saveScript(userId, topic, format, duration, platform, scriptData) {
  if (!SUPABASE_KEY) return;
  await fetch(SUPABASE_URL + '/rest/v1/creator_scripts_history', {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_KEY, 'Authorization': 'Bearer ' + SUPABASE_KEY,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      user_id: userId,
      topic: topic,
      format: format || 'youtube',
      duration: duration || '5-8min',
      platform: platform || 'youtube',
      script: scriptData
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
      return { statusCode: 401, headers, body: JSON.stringify({ error: 'Authentication required' }) };
    }

    var path = event.path.replace('/.netlify/functions/creator-scripts', '').replace(/^\//, '');
    var body = JSON.parse(event.body || '{}');

    // ── GENERATE FULL SCRIPT ──
    if (path === 'generate' || path === '') {
      var rateCheck = await checkRateLimit(user.id);
      if (!rateCheck.allowed) {
        return {
          statusCode: 429, headers,
          body: JSON.stringify({ error: 'Daily limit reached (' + rateCheck.limit + ' scripts). Resets at midnight.', remaining: 0 })
        };
      }

      var prompt = safeAnthropicText(body.prompt || '', 'Creator script prompt', 180000);
      if (!prompt) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Prompt is required' }) };
      }

      // Full scripts need Sonnet for quality + higher token budget
      var aiRes = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 4000,
          system: safeAnthropicText(SYSTEM_PROMPT, 'Creator script system prompt', 120000),
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
      var scriptData;
      try { scriptData = JSON.parse(outputText); } catch (e) {
        var match = outputText.match(/\{[\s\S]*\}/);
        if (match) {
          try { scriptData = JSON.parse(match[0]); } catch (e2) {
            scriptData = { title: body.topic || 'Untitled', sections: [], fullScript: outputText, rawText: true };
          }
        } else {
          scriptData = { title: body.topic || 'Untitled', sections: [], fullScript: outputText, rawText: true };
        }
      }

      // Save to DB (fire and forget)
      saveScript(user.id, body.topic || '', body.format || 'youtube', body.duration || '5-8min', body.platform || '', scriptData).catch(function() {});

      return {
        statusCode: 200, headers,
        body: JSON.stringify({
          script: scriptData,
          remaining: rateCheck.remaining - 1
        })
      };
    }

    // ── REGENERATE SINGLE SECTION ──
    if (path === 'regenerate-section') {
      var sectionPrompt = safeAnthropicText(body.prompt || '', 'Script section prompt', 120000);
      if (!sectionPrompt) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Prompt is required' }) };
      }

      // Section regen uses Haiku for speed
      var aiRes2 = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 800,
          system: safeAnthropicText(SYSTEM_PROMPT, 'Creator script system prompt', 120000),
          messages: [{ role: 'user', content: sectionPrompt }]
        })
      });

      if (!aiRes2.ok) {
        var errText2 = await aiRes2.text();
        throw new Error('AI API error: ' + errText2);
      }

      var aiData2 = await aiRes2.json();
      var sectionText = aiData2.content[0].text;

      var sectionData;
      try { sectionData = JSON.parse(sectionText); } catch (e) {
        var match2 = sectionText.match(/\{[\s\S]*\}/);
        if (match2) {
          try { sectionData = JSON.parse(match2[0]); } catch (e2) {
            sectionData = { text: sectionText, visualCues: [], deliveryNotes: '' };
          }
        } else {
          sectionData = { text: sectionText, visualCues: [], deliveryNotes: '' };
        }
      }

      return {
        statusCode: 200, headers,
        body: JSON.stringify({ section: sectionData })
      };
    }

    // ── GET HISTORY ──
    if (path === 'history') {
      var limit = body.limit || 20;
      var offset = body.offset || 0;
      var query = SUPABASE_URL + '/rest/v1/creator_scripts_history?user_id=eq.' + user.id +
        '&order=created_at.desc&limit=' + limit + '&offset=' + offset;

      var histRes = await fetch(query, {
        headers: { 'apikey': SUPABASE_KEY, 'Authorization': 'Bearer ' + SUPABASE_KEY }
      });
      if (!histRes.ok) throw new Error('Failed to fetch history');
      var history = await histRes.json();
      return { statusCode: 200, headers, body: JSON.stringify(history) };
    }

    return { statusCode: 404, headers, body: JSON.stringify({ error: 'Not found' }) };

  } catch (err) {
    console.error('creator-scripts error:', err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
