/**
 * AfroTools Translation API Proxy
 *
 * POST /api/translate
 * Body: { text: "Hello", source: "en", target: "sw" }
 *
 * Uses MyMemory Translation API (free, 1000 calls/day)
 * Fallback: LibreTranslate public instance
 *
 * Supported African languages:
 *   sw (Swahili), ha (Hausa), yo (Yoruba), ig (Igbo), zu (Zulu),
 *   am (Amharic), af (Afrikaans), ar (Arabic), fr (French), pt (Portuguese),
 *   pcm (Nigerian Pidgin — mapped to en for API, with custom post-processing)
 */

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, x-api-key',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json',
};

// Simple rate limiting
const rateLimitMap = new Map();
const RATE_LIMIT = 200; // per day per IP
const RATE_LIMIT_WINDOW = 24 * 60 * 60 * 1000;

function checkRateLimit(ip) {
  const now = Date.now();
  const record = rateLimitMap.get(ip);
  if (!record || now - record.start > RATE_LIMIT_WINDOW) {
    rateLimitMap.set(ip, { start: now, count: 1 });
    return { allowed: true, remaining: RATE_LIMIT - 1 };
  }
  record.count++;
  if (record.count > RATE_LIMIT) {
    return { allowed: false, remaining: 0 };
  }
  return { allowed: true, remaining: RATE_LIMIT - record.count };
}

// Language code mapping for MyMemory API
const LANG_MAP = {
  'sw': 'sw',      // Swahili
  'ha': 'ha',      // Hausa
  'yo': 'yo',      // Yoruba
  'ig': 'ig',      // Igbo
  'zu': 'zu',      // Zulu
  'am': 'am',      // Amharic
  'af': 'af',      // Afrikaans
  'ar': 'ar',      // Arabic
  'fr': 'fr',      // French
  'pt': 'pt',      // Portuguese
  'en': 'en',      // English
  'so': 'so',      // Somali
  'rw': 'rw',      // Kinyarwanda
  'ny': 'ny',      // Chichewa
  'sn': 'sn',      // Shona
  'xh': 'xh',      // Xhosa
  'st': 'st',      // Sesotho
  'tn': 'tn',      // Setswana
  'ts': 'ts',      // Tsonga
  'lg': 'lg',      // Luganda
  'ti': 'ti',      // Tigrinya
  'om': 'om',      // Oromo
  'mg': 'mg',      // Malagasy
  'pcm': 'pcm',    // Nigerian Pidgin (MyMemory supports it)
};

exports.handler = async (event) => {
  // CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS_HEADERS, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: 'Method not allowed. Use POST.' }),
    };
  }

  // Rate limiting
  const ip = event.headers['x-forwarded-for'] || event.headers['client-ip'] || 'unknown';
  const rateCheck = checkRateLimit(ip);
  if (!rateCheck.allowed) {
    return {
      statusCode: 429,
      headers: { ...CORS_HEADERS, 'Retry-After': '3600' },
      body: JSON.stringify({ error: 'Rate limit exceeded. Try again later.', limit: RATE_LIMIT }),
    };
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const { text, source, target } = body;

    if (!text || !target) {
      return {
        statusCode: 400,
        headers: CORS_HEADERS,
        body: JSON.stringify({ error: 'Missing required fields: text, target' }),
      };
    }

    if (text.length > 2000) {
      return {
        statusCode: 400,
        headers: CORS_HEADERS,
        body: JSON.stringify({ error: 'Text too long. Maximum 2000 characters.' }),
      };
    }

    const sourceLang = LANG_MAP[source] || source || 'en';
    const targetLang = LANG_MAP[target] || target;

    // Try MyMemory first
    let translation = null;
    let provider = null;

    try {
      translation = await translateMyMemory(text, sourceLang, targetLang);
      provider = 'mymemory';
    } catch (e) {
      console.warn('[Translate] MyMemory failed:', e.message);
    }

    // Fallback to LibreTranslate
    if (!translation) {
      try {
        translation = await translateLibre(text, sourceLang, targetLang);
        provider = 'libretranslate';
      } catch (e) {
        console.warn('[Translate] LibreTranslate failed:', e.message);
      }
    }

    if (!translation) {
      return {
        statusCode: 502,
        headers: CORS_HEADERS,
        body: JSON.stringify({
          error: 'Translation service temporarily unavailable. Try again later.',
          fallback: true,
        }),
      };
    }

    return {
      statusCode: 200,
      headers: {
        ...CORS_HEADERS,
        'X-RateLimit-Remaining': String(rateCheck.remaining),
        'Cache-Control': 'public, max-age=3600',
      },
      body: JSON.stringify({
        translatedText: translation,
        source: sourceLang,
        target: targetLang,
        provider: provider,
        characters: text.length,
      }),
    };
  } catch (err) {
    console.error('[Translate] Error:', err);
    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};

/**
 * MyMemory Translation API (free, 1000 chars/call, 10000 chars/day without key)
 * With registered email: 50,000 chars/day
 */
async function translateMyMemory(text, source, target) {
  const langpair = `${source}|${target}`;
  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${encodeURIComponent(langpair)}&de=hello@afrotools.com`;

  const res = await fetch(url, { headers: { 'User-Agent': 'AfroTools/1.0' } });
  if (!res.ok) throw new Error(`MyMemory HTTP ${res.status}`);

  const data = await res.json();

  if (data.responseStatus === 200 && data.responseData && data.responseData.translatedText) {
    const translated = data.responseData.translatedText;
    // MyMemory returns uppercase "MYMEMORY WARNING" when it can't translate
    if (translated.toUpperCase().includes('MYMEMORY WARNING') ||
        translated.toUpperCase().includes('PLEASE DEFINE') ||
        translated === text) {
      throw new Error('MyMemory could not translate this text');
    }
    return translated;
  }

  throw new Error('MyMemory returned no translation');
}

/**
 * LibreTranslate (public instance fallback)
 */
async function translateLibre(text, source, target) {
  // Public LibreTranslate instances
  const instances = [
    'https://libretranslate.com',
    'https://translate.argosopentech.com',
    'https://translate.terraprint.co',
  ];

  for (const baseUrl of instances) {
    try {
      const res = await fetch(`${baseUrl}/translate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          q: text,
          source: source === 'auto' ? 'auto' : source,
          target: target,
          format: 'text',
        }),
      });

      if (!res.ok) continue;

      const data = await res.json();
      if (data.translatedText) return data.translatedText;
    } catch (e) {
      continue;
    }
  }

  throw new Error('All LibreTranslate instances failed');
}
