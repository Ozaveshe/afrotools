'use strict';

const { randomUUID } = require('crypto');
const { getStore } = require('@netlify/blobs');

const SUPABASE_URL = process.env.SUPABASE_AUTH_URL || 'https://zpclagtgczsygrgztlts.supabase.co';
const SUPABASE_SERVICE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_DATA_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SERVICE_KEY;

const COMMUNITY_STORE = 'afrokitchen-community';

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
  return /^[0-9a-f-]{36}$/i.test(id) ? id : null;
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
  } catch (error) {
    console.log('[afrokitchen-community] Blob list failed:', error.message);
    return [];
  }
}

exports.handler = async function (event) {
  const headers = getCorsHeaders(event);
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers, body: '' };

  if (!SUPABASE_SERVICE_KEY) {
    return json(500, headers, { error: 'SUPABASE_SERVICE_KEY not configured' });
  }

  try {
    if (event.httpMethod === 'GET') {
      const params = event.queryStringParameters || {};
      const recipeId = cleanRecipeId(params.recipeId);
      const limit = Math.min(Math.max(parseInt(params.limit || '12', 10) || 12, 1), 20);

      if (!recipeId) return json(400, headers, { error: 'Valid recipeId is required' });

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

    let body = {};
    try {
      body = event.body ? JSON.parse(event.body) : {};
    } catch (error) {
      return json(400, headers, { error: 'Invalid JSON body' });
    }
    const action = body.action;
    const recipeId = cleanRecipeId(body.recipeId);

    if (!recipeId) return json(400, headers, { error: 'Valid recipeId is required' });

    if (action === 'review') {
      const rating = Math.max(1, Math.min(parseInt(body.rating, 10) || 0, 5));
      if (!rating) return json(400, headers, { error: 'A rating between 1 and 5 is required' });

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
  } catch (error) {
    console.error('[afrokitchen-community] Error:', error.message);
    return json(500, headers, { error: error.message || 'Unexpected error' });
  }
};
