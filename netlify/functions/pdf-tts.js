/**
 * PDF text-to-speech gateway.
 *
 * Browser voice mode stays fully local. This endpoint is only used when the
 * user explicitly selects AI voices on /tools/pdf-to-audio/.
 *
 * Environment:
 *   ELEVENLABS_API_KEY             required for AI audio generation
 *   ELEVENLABS_TTS_MODEL           optional, defaults to eleven_multilingual_v2
 *   ELEVENLABS_TTS_VOICES_JSON     optional array of { voice_id, name, language, description }
 */

const { corsHeaders, corsResponse } = require('./utils/cors');

const DEFAULT_MODEL = 'eleven_multilingual_v2';
const MAX_TEXT_LENGTH = 2800;

const FALLBACK_VOICES = [
  { voice_id: 'JBFqnCBsd6RMkjVDRZzb', name: 'Warm Narrator', language: 'multilingual', description: 'balanced document voice' },
  { voice_id: 'EXAVITQu4vr4xnSDxMaL', name: 'Clear Female', language: 'multilingual', description: 'bright study voice' },
  { voice_id: 'pNInz6obpgDQGcFmaJgB', name: 'Deep Male', language: 'multilingual', description: 'calm long-form voice' },
  { voice_id: 'ErXwobaYiN019PkySvjV', name: 'Professional Male', language: 'multilingual', description: 'business document voice' },
  { voice_id: 'MF3mGyEYCl7XYWbV9V6O', name: 'Soft Female', language: 'multilingual', description: 'gentle learning voice' },
];

const rateLimit = new Map();
const LIMIT = 80;
const WINDOW_MS = 24 * 60 * 60 * 1000;

exports.handler = async function handler(event) {
  const headers = corsHeaders(event);

  if (event.httpMethod === 'OPTIONS') return corsResponse(event);

  if (event.httpMethod === 'GET') {
    return listVoices(event, headers);
  }

  if (event.httpMethod !== 'POST') {
    return json(405, headers, { error: 'Method not allowed. Use GET for voices or POST for speech.' });
  }

  const apiKey = process.env.ELEVENLABS_API_KEY || '';
  if (!apiKey) {
    return json(501, headers, {
      error: 'AI voice provider is not configured. Add ELEVENLABS_API_KEY to enable modern voices.',
      configured: false,
      provider: 'elevenlabs',
    });
  }

  const ip = getIp(event);
  const check = checkRate(ip);
  if (!check.allowed) {
    return json(429, { ...headers, 'Retry-After': '3600' }, {
      error: 'Daily AI voice generation limit reached. Try again later.',
      limit: LIMIT,
    });
  }

  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch (err) {
    return json(400, headers, { error: 'Invalid JSON body.' });
  }

  const text = String(body.text || '').replace(/\s+/g, ' ').trim();
  const firstVoice = getConfiguredVoiceCatalog()[0] || FALLBACK_VOICES[0];
  const voiceId = sanitizeVoiceId(body.voiceId) || firstVoice.voice_id;
  const modelId = String(body.modelId || process.env.ELEVENLABS_TTS_MODEL || DEFAULT_MODEL);

  if (!text) return json(400, headers, { error: 'Missing text.' });
  if (text.length > MAX_TEXT_LENGTH) {
    return json(400, headers, { error: `Text too long. Maximum ${MAX_TEXT_LENGTH} characters per audio request.` });
  }

  const payload = {
    text,
    model_id: modelId,
    voice_settings: {
      stability: clamp(body.stability, 0, 1, 0.48),
      similarity_boost: clamp(body.similarityBoost, 0, 1, 0.78),
      style: clamp(body.style, 0, 1, 0.18),
      use_speaker_boost: true,
    },
  };

  try {
    const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId)}?output_format=mp3_44100_128`, {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json',
        Accept: 'audio/mpeg',
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errorText = await res.text().catch(() => '');
      return json(res.status, headers, {
        error: `Voice provider returned HTTP ${res.status}.`,
        detail: safeDetail(errorText),
        provider: 'elevenlabs',
      });
    }

    const audioBuffer = Buffer.from(await res.arrayBuffer());
    return json(200, {
      ...headers,
      'Cache-Control': 'no-store',
      'X-RateLimit-Remaining': String(check.remaining),
    }, {
      configured: true,
      provider: 'elevenlabs',
      voiceId,
      modelId,
      mimeType: 'audio/mpeg',
      characters: text.length,
      audioBase64: audioBuffer.toString('base64'),
    });
  } catch (err) {
    return json(502, headers, {
      error: 'AI voice generation failed. Try browser voice mode or retry later.',
      detail: err.message,
      provider: 'elevenlabs',
    });
  }
};

async function listVoices(event, headers) {
  const apiKey = process.env.ELEVENLABS_API_KEY || '';
  const configuredCatalog = getConfiguredVoiceCatalog();

  if (!apiKey) {
    return json(200, headers, {
      configured: false,
      provider: 'elevenlabs',
      voices: configuredCatalog.length ? configuredCatalog : FALLBACK_VOICES,
      message: 'Add ELEVENLABS_API_KEY to enable AI voice generation.',
    });
  }

  if (configuredCatalog.length) {
    return json(200, headers, {
      configured: true,
      provider: 'elevenlabs',
      voices: configuredCatalog,
      message: 'Using ELEVENLABS_TTS_VOICES_JSON voice catalog.',
    });
  }

  try {
    const res = await fetch('https://api.elevenlabs.io/v2/voices', {
      headers: {
        'xi-api-key': apiKey,
        Accept: 'application/json',
      },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const voices = (data.voices || []).slice(0, 60).map(function mapVoice(voice) {
      const labels = voice.labels || {};
      return {
        voice_id: voice.voice_id,
        name: voice.name || 'AI Voice',
        language: labels.language || labels.accent || '',
        description: labels.description || voice.category || 'AI voice',
      };
    }).filter(function validVoice(voice) {
      return voice.voice_id && voice.name;
    });
    return json(200, headers, {
      configured: true,
      provider: 'elevenlabs',
      voices: voices.length ? voices : FALLBACK_VOICES,
    });
  } catch (err) {
    return json(200, headers, {
      configured: true,
      provider: 'elevenlabs',
      voices: FALLBACK_VOICES,
      warning: `Could not load account voices: ${err.message}`,
    });
  }
}

function getConfiguredVoiceCatalog() {
  const raw = process.env.ELEVENLABS_TTS_VOICES_JSON || '';
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map(function normalize(voice) {
      return {
        voice_id: sanitizeVoiceId(voice.voice_id || voice.voiceId),
        name: String(voice.name || 'AI Voice').slice(0, 80),
        language: String(voice.language || '').slice(0, 40),
        description: String(voice.description || '').slice(0, 120),
      };
    }).filter(function valid(voice) {
      return voice.voice_id;
    });
  } catch (err) {
    return [];
  }
}

function sanitizeVoiceId(value) {
  const id = String(value || '').trim();
  return /^[A-Za-z0-9_-]{8,80}$/.test(id) ? id : '';
}

function clamp(value, min, max, fallback) {
  const num = Number(value);
  if (!Number.isFinite(num)) return fallback;
  return Math.max(min, Math.min(max, num));
}

function getIp(event) {
  return (event.headers && (event.headers['x-forwarded-for'] || event.headers['client-ip'])) || 'unknown';
}

function checkRate(ip) {
  const now = Date.now();
  const record = rateLimit.get(ip);
  if (!record || now - record.start > WINDOW_MS) {
    rateLimit.set(ip, { start: now, count: 1 });
    return { allowed: true, remaining: LIMIT - 1 };
  }
  record.count += 1;
  return { allowed: record.count <= LIMIT, remaining: Math.max(0, LIMIT - record.count) };
}

function safeDetail(text) {
  return String(text || '').replace(/\s+/g, ' ').slice(0, 500);
}

function json(statusCode, headers, data) {
  return {
    statusCode,
    headers,
    body: JSON.stringify(data),
  };
}
