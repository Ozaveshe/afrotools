'use strict';

const { randomUUID } = require('crypto');
const { getStore } = require('@netlify/blobs');
const { checkPublicRecipe, isRecipeId } = require('./_shared/afrokitchen-publication');
const { checkRateLimit } = require('./_shared/rate-limit');

function cleanEnvValue(value) {
  return String(value || '').trim().replace(/^['"]|['"]$/g, '');
}

const SUPABASE_URL = process.env.SUPABASE_AUTH_URL || 'https://zpclagtgczsygrgztlts.supabase.co';
const SUPABASE_SERVICE_KEY = cleanEnvValue(
  process.env.SUPABASE_AUTH_SERVICE_KEY ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SERVICE_KEY
);

const COMMUNITY_STORE = 'afrokitchen-community';
const SUBMISSION_ORIGIN = 'https://zpclagtgczsygrgztlts.supabase.co';
const SUBMISSION_COUNTRIES = new Set('NG GH KE ZA EG ET TZ SN MA CM CI UG RW MZ MG ZM ZW MW SO DZ TN LY SD AO NA BW LS SZ ML BF GN NE TG BJ SL LR GM GW CV MR CD CG TD CF GA GQ ST BI DJ ER KM SC MU SS'.split(' '));
const SUBMISSION_LIMITS = {
  name: 160, description: 500, ingredients_text: 12000, steps_text: 18000,
  story: 8000, submitted_by: 80, email: 254, region_community: 160,
  contributor_type: 80, occasion: 160, total_time: 160, serve_with: 500,
  photo_links: 2000, variations: 2000
};

// Submission ingestion is separate from the published-parent review/photo flows.
// No readback, publication, notification, user-selected table or ownership claim.
async function submitRecipe(event, body, headers) {
  const requestHeaders = event.headers || {};
  const origin = requestHeaders.origin || '';
  const allowedOrigin = origin === 'https://afrotools.com' || origin === 'https://www.afrotools.com' ||
    /^https:\/\/[a-z0-9-]+--afrotools\.netlify\.app$/.test(origin) ||
    origin === 'https://afrotools.netlify.app' ||
    /^http:\/\/(localhost|127\.0\.0\.1)(:\d{1,5})?$/.test(origin);
  if (!allowedOrigin) return json(403, headers, { error: 'Submission origin is not allowed' });
  if (!/^application\/json(?:\s*;|$)/i.test(requestHeaders['content-type'] || '')) {
    return json(415, headers, { error: 'Use a JSON submission' });
  }
  const allowed = new Set(['action', 'country_code', 'consent', 'photo_permission', 'website', ...Object.keys(SUBMISSION_LIMITS)]);
  if (Object.keys(body).some(key => !allowed.has(key))) return json(400, headers, { error: 'Unsupported submission field' });
  if (typeof body.website !== 'string' || body.website.trim()) return json(400, headers, { error: 'Submission could not be accepted' });
  if (body.consent !== true) return json(400, headers, { error: 'Confirm the private editorial submission', field: 'consent' });
  if (typeof body.photo_permission !== 'boolean') return json(400, headers, { error: 'Confirm photo permission', field: 'photo_permission' });
  const values = {};
  for (const [field, limit] of Object.entries(SUBMISSION_LIMITS)) {
    const value = body[field] === undefined ? '' : body[field];
    if (typeof value !== 'string' || value.length > limit || /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(value)) {
      return json(400, headers, { error: 'Check this field and its length', field });
    }
    values[field] = value.replace(/\r\n?/g, '\n').trim();
  }
  for (const field of ['name', 'ingredients_text', 'steps_text']) {
    if (!values[field]) return json(400, headers, { error: 'Complete this required field', field });
  }
  if (typeof body.country_code !== 'string' || !SUBMISSION_COUNTRIES.has(body.country_code)) {
    return json(400, headers, { error: 'Choose a listed country', field: 'country_code' });
  }
  if (values.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) return json(400, headers, { error: 'Check the email address', field: 'email' });
  if (values.photo_links && !body.photo_permission) return json(400, headers, { error: 'Confirm photo permission or remove the links', field: 'photo_permission' });
  const context = [
    ['Region or community', values.region_community], ['Contributor type', values.contributor_type],
    ['Best occasion', values.occasion], ['Approx total time', values.total_time],
    ['Serve with', values.serve_with], ['Photo links', values.photo_links],
    ['Photo permission', body.photo_permission ? 'yes' : 'not confirmed'],
    ['Regional variations or substitutions', values.variations]
  ].filter(entry => entry[1]).map(entry => entry[0] + ': ' + entry[1]);
  const story = [values.story, 'Editorial context\n' + context.join('\n')].filter(Boolean).join('\n\n');
  if (story.length > 12000) return json(400, headers, { error: 'Shorten the story and editorial context', field: 'story' });
  // This shared limiter is bounded per warm instance, not a distributed quota.
  const ip = String(requestHeaders['x-nf-client-connection-ip'] || requestHeaders['client-ip'] || requestHeaders['x-forwarded-for'] || 'unknown').split(',')[0].trim().slice(0, 128);
  if (!checkRateLimit('afrokitchen:submission:' + ip, 5)) return json(429, { ...headers, 'Retry-After': '86400' }, { error: 'Submission limit reached. Keep your draft and try later' });
  if (cleanEnvValue(SUPABASE_URL) !== SUBMISSION_ORIGIN || !SUPABASE_SERVICE_KEY) {
    return json(503, headers, { error: 'Recipe submission is temporarily unavailable' });
  }
  const record = {
    name: values.name, country_code: body.country_code, description: values.description || null,
    ingredients_text: values.ingredients_text, steps_text: values.steps_text, story,
    submitted_by: values.submitted_by || null, email: values.email || null, status: 'pending'
  };
  const controller = new AbortController();
  let timer;
  try {
    const response = await Promise.race([
      fetch(SUBMISSION_ORIGIN + '/rest/v1/recipe_submissions', {
        method: 'POST', signal: controller.signal,
        headers: { apikey: SUPABASE_SERVICE_KEY, Authorization: 'Bearer ' + SUPABASE_SERVICE_KEY,
          'Content-Type': 'application/json', Prefer: 'return=minimal' },
        body: JSON.stringify(record)
      }),
      new Promise((resolve, reject) => { timer = setTimeout(() => { controller.abort(); reject(new Error('Submission timeout')); }, 8000); })
    ]);
    // PostgREST return=minimal INSERT confirms persistence with 201. Do not echo PII.
    if (response.status !== 201 || !response.ok) throw new Error('Submission unconfirmed');
    return json(201, headers, { success: true, status: 'pending' });
  } catch {
    return json(503, headers, { error: 'We could not confirm your recipe was saved. Keep your draft before trying again' });
  } finally {
    clearTimeout(timer);
    controller.abort();
  }
}

function getCorsHeaders(event) {
  const origin = event.headers && event.headers.origin ? event.headers.origin : '';
  const isAllowed =
    origin === 'https://afrotools.com' ||
    origin === 'https://www.afrotools.com' ||
    origin.endsWith('.netlify.app') ||
    origin.startsWith('http://localhost') ||
    origin.startsWith('http://127.0.0.1');

  return {
    'Access-Control-Allow-Origin': isAllowed ? origin : 'https://afrotools.com',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json',
    Vary: 'Origin'
  };
}

function json(statusCode, headers, body) {
  return {
    statusCode,
    headers,
    body: JSON.stringify(body)
  };
}

function cleanText(value, maxLength) {
  return String(value || '')
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength || 1000);
}

function cleanCountryCode(value) {
  const code = String(value || '').trim().toUpperCase();
  return /^[A-Z]{2}$/.test(code) ? code : null;
}

function cleanRecipeId(value) {
  const id = String(value || '').trim();
  return isRecipeId(id) ? id : null;
}

function cleanStorageSegment(value) {
  return String(value || 'cook')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48) || 'cook';
}

function encodeStoragePath(path) {
  return String(path || '')
    .split('/')
    .map(encodeURIComponent)
    .join('/');
}

function averageRating(reviews) {
  if (!reviews.length) return null;
  const total = reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0);
  return Math.round((total / reviews.length) * 10) / 10;
}

async function rest(method, path, body, extraHeaders) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method,
    headers: Object.assign({
      apikey: SUPABASE_SERVICE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation'
    }, extraHeaders || {}),
    body: body === undefined ? undefined : JSON.stringify(body)
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    throw new Error((data && (data.message || data.error || JSON.stringify(data))) || `Supabase ${response.status}`);
  }

  return data;
}

async function uploadCooksnap(objectPath, base64Data) {
  const response = await fetch(`${SUPABASE_URL}/storage/v1/object/news-images/${encodeStoragePath(objectPath)}`, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_SERVICE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
      'Content-Type': 'image/webp',
      'x-upsert': 'false'
    },
    body: Buffer.from(base64Data, 'base64')
  });

  const text = await response.text();
  if (!response.ok) {
    throw new Error(text || `Storage upload failed with ${response.status}`);
  }

  return `${SUPABASE_URL}/storage/v1/object/public/news-images/${encodeStoragePath(objectPath)}`;
}

async function listCooksnaps(recipeId, limit) {
  try {
    const store = getStore(COMMUNITY_STORE);
    const result = await store.list({ prefix: `recipe/${recipeId}/`, paginate: false });
    const entries = await Promise.all((result.blobs || []).map(async (blob) => store.get(blob.key, { type: 'json' })));
    return entries
      .filter(Boolean)
      .sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')))
      .slice(0, limit);
  } catch {
    console.log('[afrokitchen-community] Blob list unavailable');
    return [];
  }
}

exports.handler = async function (event) {
  const headers = getCorsHeaders(event);
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers, body: '' };

  if (!SUPABASE_SERVICE_KEY && event.httpMethod !== 'POST') {
    return json(500, headers, { error: 'SUPABASE_SERVICE_KEY not configured' });
  }

  try {
    if (event.httpMethod === 'GET') {
      const params = event.queryStringParameters || {};
      const recipeId = cleanRecipeId(params.recipeId);
      const limit = Math.min(Math.max(parseInt(params.limit || '12', 10) || 12, 1), 20);

      if (!recipeId) return json(400, headers, { error: 'Valid recipeId is required' });

      const publication = await checkPublicRecipe(recipeId, SUPABASE_URL, SUPABASE_SERVICE_KEY);
      if (publication.kind === 'not-found') return json(404, headers, { error: 'Recipe not found' });
      if (publication.kind !== 'eligible') return json(503, headers, { error: 'Recipe availability could not be checked' });

      const reviews = await rest(
        'GET',
        `recipe_reviews?recipe_id=eq.${encodeURIComponent(recipeId)}&select=author_name,country_code,comment,modifications,rating,created_at&order=created_at.desc&limit=${limit}`
      );
      const cooksnaps = await listCooksnaps(recipeId, Math.min(limit, 8));

      return json(200, headers, {
        success: true,
        data: {
          reviews,
          cooksnaps,
          reviewCount: reviews.length,
          averageRating: averageRating(reviews)
        }
      });
    }

    if (event.httpMethod !== 'POST') {
      return json(405, headers, { error: 'Use GET or POST' });
    }

    // Bound JSON parsing for POSTs before inspecting an action. Existing photo
    // uploads retain their earlier 10MB cap; submission JSON has a 64KiB cap.
    const rawBody = typeof event.body === 'string' ? event.body : '';
    if (event.isBase64Encoded || Buffer.byteLength(rawBody, 'utf8') > 10_100_000) return json(413, headers, { error: 'Request body is too large or unsupported' });
    let body = {};
    try {
      body = event.body ? JSON.parse(event.body) : {};
    } catch (error) {
      return json(400, headers, { error: 'Invalid JSON body' });
    }
    if (!body || typeof body !== 'object' || Array.isArray(body)) return json(400, headers, { error: 'Use a JSON object' });
    const action = body.action;
    if (action === 'submit-recipe') {
      if (Buffer.byteLength(rawBody, 'utf8') > 65536) return json(413, headers, { error: 'Recipe submission is too large' });
      return await submitRecipe(event, body, headers);
    }
    if (!SUPABASE_SERVICE_KEY) return json(500, headers, { error: 'SUPABASE_SERVICE_KEY not configured' });
    const recipeId = cleanRecipeId(body.recipeId);

    if (!recipeId) return json(400, headers, { error: 'Valid recipeId is required' });

    if (action === 'review') {
      const rating = Math.max(1, Math.min(parseInt(body.rating, 10) || 0, 5));
      if (!rating) return json(400, headers, { error: 'A rating between 1 and 5 is required' });

      const publication = await checkPublicRecipe(recipeId, SUPABASE_URL, SUPABASE_SERVICE_KEY);
      if (publication.kind === 'not-found') return json(404, headers, { error: 'Recipe not found' });
      if (publication.kind !== 'eligible') return json(503, headers, { error: 'Recipe availability could not be checked' });

      const inserted = await rest('POST', 'recipe_reviews', {
        recipe_id: recipeId,
        rating,
        comment: cleanText(body.comment, 700) || null,
        author_name: cleanText(body.authorName, 80) || 'Anonymous cook',
        country_code: cleanCountryCode(body.countryCode),
        modifications: cleanText(body.modifications, 180) || null
      });

      return json(201, headers, { success: true, data: inserted && inserted[0] ? inserted[0] : null });
    }

    if (action === 'cooksnap') {
      const dataUrl = String(body.photoDataUrl || '');
      if (!/^data:image\/webp;base64,/i.test(dataUrl)) {
        return json(400, headers, { error: 'Cook photos must be uploaded as WebP data URLs' });
      }
      if (dataUrl.length > 10_000_000) {
        return json(400, headers, { error: 'Cook photo is too large' });
      }

      const publication = await checkPublicRecipe(recipeId, SUPABASE_URL, SUPABASE_SERVICE_KEY);
      if (publication.kind === 'not-found') return json(404, headers, { error: 'Recipe not found' });
      if (publication.kind !== 'eligible') return json(503, headers, { error: 'Recipe availability could not be checked' });

      const createdAt = new Date().toISOString();
      const id = randomUUID();
      const base64Data = dataUrl.split(',')[1] || '';
      const objectPath = `afrokitchen/cooksnaps/${recipeId}/${Date.now()}-${cleanStorageSegment(body.photoName || body.authorName || 'cook')}.webp`;
      const photoUrl = await uploadCooksnap(objectPath, base64Data);
      const metadata = {
        id,
        recipeId,
        authorName: cleanText(body.authorName, 80) || 'Community cook',
        countryCode: cleanCountryCode(body.countryCode),
        note: cleanText(body.note, 320) || '',
        photoUrl,
        createdAt
      };

      const store = getStore(COMMUNITY_STORE);
      await store.setJSON(`recipe/${recipeId}/${createdAt.slice(0, 10)}-${id}.json`, metadata);

      return json(201, headers, { success: true, data: metadata });
    }

    return json(400, headers, { error: 'Unsupported action' });
  } catch {
    console.error('[afrokitchen-community] Request unavailable');
    return json(500, headers, { error: 'Community request unavailable' });
  }
};
