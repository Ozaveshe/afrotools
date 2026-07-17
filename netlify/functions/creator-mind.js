// netlify/functions/creator-mind.js
// AI generation function for CreatorMind — higher token limits, model routing
// Uses Anthropic Claude API directly (not through ai-advisor) for streaming & control

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

const SYSTEM_PROMPT = `You are a creative writing assistant specialized in African creator culture. You write content that sounds human, culturally aware, and platform-native — never robotic or generic.

CORE PRINCIPLES:
1. VOICE MATCHING: When a voice profile is provided, match it exactly. The creator's audience follows them for THEIR voice — any AI-generated content must be indistinguishable from what they'd write themselves. If no voice profile, default to warm, confident, African-millennial tone.

2. CULTURAL INTELLIGENCE: You deeply understand African cultural contexts:
   - Nigerian English (pidgin when appropriate, Yoruba/Igbo/Hausa sprinkles)
   - East African English (Sheng for Kenyan content, Swahili phrases)
   - South African English (township slang, Afrikaans phrases)
   - Pan-African references (shared experiences across the continent)
   - Diaspora awareness (London/US African communities)
   NEVER force cultural references. Only include them when natural.

3. PLATFORM MASTERY:
   - Instagram: Visual storytelling, line breaks, strong first line, natural CTA. 2000 chars ideal.
   - TikTok: Conversational, hook in first 2 seconds, pattern interrupts. Under 150 chars for on-screen.
   - X/Twitter: Wit, insight, strong opinions. 280 chars. Threads: each tweet standalone but flowing.
   - YouTube: Titles under 60 chars, descriptions SEO-first, scripts with hook-value-CTA.
   - LinkedIn: Professional authority, insight-leading, formatted paragraphs.

4. HOOK MASTERY: First line determines everything. Adapt hooks for African audiences.

5. CONTENT REPURPOSING: Transform across platforms while adapting length, tone, CTAs, and visual direction.

6. BUSINESS WRITING: Pitches, emails, responses — professional but human.

ALWAYS:
- Generate multiple options when appropriate (3 for captions/hooks)
- Label each option with what makes it different
- Include platform-specific formatting
- Be concise — creators want the content itself, not essays about it`;

const TOKEN_LIMITS = {
  caption: 500, hook: 300, hashtag: 200, bio: 400,
  script: 2000, thread: 1500, pitch: 800, brief_decode: 1000,
  response: 600, product_desc: 500, repurpose: 1500, campaign: 1000,
  freeform: 1000
};

const MODEL_ROUTING = {
  hook: 'claude-haiku-4-5-20251001',
  hashtag: 'claude-haiku-4-5-20251001',
  caption: 'claude-haiku-4-5-20251001',
  bio: 'claude-haiku-4-5-20251001',
  response: 'claude-haiku-4-5-20251001',
  product_desc: 'claude-haiku-4-5-20251001',
  script: 'claude-sonnet-4-6',
  thread: 'claude-sonnet-4-6',
  pitch: 'claude-sonnet-4-6',
  brief_decode: 'claude-sonnet-4-6',
  repurpose: 'claude-sonnet-4-6',
  campaign: 'claude-sonnet-4-6',
  freeform: 'claude-haiku-4-5-20251001',
  voice_analysis: 'claude-sonnet-4-6'
};

const DAILY_LIMIT_FREE = 5;
const DAILY_LIMIT_PRO = 30;

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
    SUPABASE_URL + '/rest/v1/creator_mind_projects?user_id=eq.' + userId +
    '&created_at=gte.' + today + 'T00:00:00Z&select=id',
    { headers: { 'apikey': SUPABASE_KEY, 'Authorization': 'Bearer ' + SUPABASE_KEY } }
  );
  if (!res.ok) return { allowed: true, remaining: DAILY_LIMIT_FREE };
  var items = await res.json();
  var used = items.length;
  var limit = DAILY_LIMIT_FREE;
  return { allowed: used < limit, remaining: Math.max(0, limit - used), used: used, limit: limit };
}

async function getVoiceProfile(userId) {
  if (!SUPABASE_KEY) return null;
  var res = await fetch(
    SUPABASE_URL + '/rest/v1/creator_voice_profiles?user_id=eq.' + userId + '&is_active=eq.true&limit=1',
    { headers: { 'apikey': SUPABASE_KEY, 'Authorization': 'Bearer ' + SUPABASE_KEY } }
  );
  if (!res.ok) return null;
  var profiles = await res.json();
  return profiles.length ? profiles[0].voice_data : null;
}

async function saveGeneration(userId, type, inputData, platform, outputs) {
  if (!SUPABASE_KEY) return;
  var projectRes = await fetch(SUPABASE_URL + '/rest/v1/creator_mind_projects', {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_KEY, 'Authorization': 'Bearer ' + SUPABASE_KEY,
      'Content-Type': 'application/json', 'Prefer': 'return=representation'
    },
    body: JSON.stringify({
      user_id: userId,
      project_type: type,
      input_data: inputData,
      platform: platform || null
    })
  });
  if (!projectRes.ok) return;
  var project = await projectRes.json();
  var projectId = (project[0] || project).id;

  if (outputs && outputs.length) {
    var outputRows = outputs.map(function(o, i) {
      return { project_id: projectId, content: o.text || o, variant_label: o.label || ('Option ' + (i + 1)) };
    });
    await fetch(SUPABASE_URL + '/rest/v1/creator_mind_outputs', {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY, 'Authorization': 'Bearer ' + SUPABASE_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(outputRows)
    });
  }
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

    var path = event.path.replace('/.netlify/functions/creator-mind', '').replace(/^\//, '');
    var body = JSON.parse(event.body || '{}');

    // ── VOICE ANALYSIS ──
    if (path === 'analyze-voice') {
      var examples = Array.isArray(body.examples) ? body.examples.slice(0, 8).map(function(example) {
        return safeAnthropicText(example, 'Voice example', 40000);
      }) : [];
      if (!examples.length) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Provide at least one writing example' }) };
      }

      var voicePrompt = safeAnthropicText('Analyze these writing examples and extract the author\'s voice profile. Return a JSON object with these fields:\n' +
        '- tone (string): overall tone description\n' +
        '- sentence_style (string): how they structure sentences\n' +
        '- vocabulary (array of strings): notable slang, terms, or phrases they use\n' +
        '- emoji_usage (string): how they use emojis\n' +
        '- signature_patterns (array of strings): recurring patterns in their writing\n' +
        '- avoid (array of strings): things this writer would never do\n' +
        '- cultural_context (string): cultural background inferred from writing\n\n' +
        'WRITING EXAMPLES:\n' + examples.map(function(e, i) { return '--- Example ' + (i + 1) + ' ---\n' + e; }).join('\n\n') +
        '\n\nReturn ONLY valid JSON, no markdown code fences.',
        'Voice analysis prompt',
        180000
      );

      var aiRes = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          model: MODEL_ROUTING.voice_analysis,
          max_tokens: 800,
          messages: [{ role: 'user', content: voicePrompt }]
        })
      });

      if (!aiRes.ok) {
        var errText = await aiRes.text();
        throw new Error('AI API error: ' + errText);
      }

      var aiData = await aiRes.json();
      var voiceText = aiData.content[0].text;
      var voiceData;
      try { voiceData = JSON.parse(voiceText); } catch (e) {
        var match = voiceText.match(/\{[\s\S]*\}/);
        voiceData = match ? JSON.parse(match[0]) : { tone: voiceText };
      }

      // Save voice profile
      await fetch(SUPABASE_URL + '/rest/v1/creator_voice_profiles', {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_KEY, 'Authorization': 'Bearer ' + SUPABASE_KEY,
          'Content-Type': 'application/json',
          'Prefer': 'resolution=merge-duplicates'
        },
        body: JSON.stringify({
          user_id: user.id,
          voice_data: voiceData,
          example_texts: examples,
          is_active: true,
          updated_at: new Date().toISOString()
        })
      });

      return { statusCode: 200, headers, body: JSON.stringify({ voiceProfile: voiceData }) };
    }

    // ── GENERATE CONTENT ──
    if (path === 'generate' || path === '') {
      var rateCheck = await checkRateLimit(user.id);
      if (!rateCheck.allowed) {
        return {
          statusCode: 429, headers,
          body: JSON.stringify({ error: 'Daily limit reached (' + rateCheck.limit + ' generations). Resets at midnight.', remaining: 0 })
        };
      }

      var genType = body.type || 'freeform';
      var prompt = safeAnthropicText(body.prompt || '', 'CreatorMind prompt', 180000);
      if (!prompt) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Prompt is required' }) };
      }

      var voiceProfile = await getVoiceProfile(user.id);
      var systemPrompt = SYSTEM_PROMPT;
      if (voiceProfile) {
        systemPrompt += '\n\nCREATOR VOICE PROFILE:\n' + JSON.stringify(voiceProfile) +
          '\nIMPORTANT: Match this voice exactly. Every output must sound like this specific creator.';
      }
      systemPrompt = safeAnthropicText(systemPrompt, 'CreatorMind system prompt', 160000);

      var model = MODEL_ROUTING[genType] || MODEL_ROUTING.freeform;
      var maxTokens = TOKEN_LIMITS[genType] || TOKEN_LIMITS.freeform;

      var aiRes2 = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          model: model,
          max_tokens: maxTokens,
          system: systemPrompt,
          messages: [{ role: 'user', content: prompt }]
        })
      });

      if (!aiRes2.ok) {
        var errText2 = await aiRes2.text();
        throw new Error('AI API error: ' + errText2);
      }

      var aiData2 = await aiRes2.json();
      var outputText = aiData2.content[0].text;

      // Save to DB (fire and forget)
      saveGeneration(user.id, genType, body, body.platform || null, [{ text: outputText, label: genType }]).catch(function() {});

      return {
        statusCode: 200, headers,
        body: JSON.stringify({
          output: outputText,
          type: genType,
          model: model.includes('haiku') ? 'haiku' : 'sonnet',
          remaining: rateCheck.remaining - 1
        })
      };
    }

    // ── GET HISTORY ──
    if (path === 'history') {
      // Handled via GET but we accept POST with filters too
      var limit = body.limit || 20;
      var offset = body.offset || 0;
      var typeFilter = body.typeFilter || '';
      var query = SUPABASE_URL + '/rest/v1/creator_mind_projects?user_id=eq.' + user.id +
        '&order=created_at.desc&limit=' + limit + '&offset=' + offset;
      if (typeFilter) query += '&project_type=eq.' + typeFilter;

      var histRes = await fetch(query, {
        headers: { 'apikey': SUPABASE_KEY, 'Authorization': 'Bearer ' + SUPABASE_KEY }
      });
      if (!histRes.ok) throw new Error('Failed to fetch history');
      var history = await histRes.json();
      return { statusCode: 200, headers, body: JSON.stringify(history) };
    }

    // ── GET VOICE PROFILE ──
    if (path === 'voice') {
      var vp = await getVoiceProfile(user.id);
      return { statusCode: 200, headers, body: JSON.stringify({ voiceProfile: vp }) };
    }

    return { statusCode: 404, headers, body: JSON.stringify({ error: 'Not found' }) };

  } catch (err) {
    console.error('creator-mind error:', err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
