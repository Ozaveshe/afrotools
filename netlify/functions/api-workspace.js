/**
 * AfroTools - Workspace API
 *
 * GET    /api/workspace                       -> list workspace items
 * GET    /api/workspace?item_type=cv&item_key=current
 * POST   /api/workspace                       -> upsert a workspace item
 * DELETE /api/workspace?id=<uuid>
 * DELETE /api/workspace?item_type=cv&item_key=abc
 *
 * Auth is verified with the user's Supabase access token.
 * Data is written with the service role key so browser fallback paths can stay simple.
 */

const SUPABASE_AUTH_URL = process.env.SUPABASE_AUTH_URL || 'https://zpclagtgczsygrgztlts.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY_AUTH;
const { getAllowedOrigin } = require('./utils/cors');

if (!SUPABASE_ANON_KEY) {
  console.warn('[api-workspace] Missing SUPABASE_ANON_KEY_AUTH env var');
}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': 'https://afrotools.com',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Content-Type': 'application/json',
  Vary: 'Origin',
};

function jsonResponse(statusCode, body) {
  return {
    statusCode: statusCode,
    headers: CORS_HEADERS,
    body: JSON.stringify(body),
  };
}

function sanitizeText(value, maxLength) {
  if (value === null || value === undefined) return '';
  var text = String(value).trim();
  if (!text) return '';
  return text.slice(0, maxLength);
}

function parseListParam(value, maxItems) {
  if (!value) return [];
  return String(value)
    .split(',')
    .map(function (part) { return part.trim(); })
    .filter(Boolean)
    .slice(0, maxItems || 20);
}

function clampNumber(value, fallback, min, max) {
  var number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.max(min, Math.min(max, Math.floor(number)));
}

function normalizeJson(value, fallback) {
  if (value === null || value === undefined) return fallback;
  if (typeof value === 'object') return value;
  return fallback;
}

function payloadSizeBytes(payload, meta) {
  try {
    return Buffer.byteLength(JSON.stringify({ payload: payload, meta: meta }), 'utf8');
  } catch (error) {
    return Infinity;
  }
}

async function getUserFromToken(authHeader) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;

  var token = authHeader.replace('Bearer ', '');
  var response = await fetch(SUPABASE_AUTH_URL + '/auth/v1/user', {
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: 'Bearer ' + token,
    },
  });

  if (!response.ok) return null;

  var user = await response.json();
  return user && user.id ? user : null;
}

exports.handler = async function (event) {
  CORS_HEADERS['Access-Control-Allow-Origin'] = getAllowedOrigin(event);

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS_HEADERS, body: '' };
  }

  var user = await getUserFromToken(event.headers.authorization || event.headers.Authorization);
  if (!user) {
    return jsonResponse(401, { error: 'Unauthorized' });
  }

  var serviceKey = process.env.SUPABASE_AUTH_SERVICE_KEY || process.env.SUPABASE_SERVICE_KEY;
  if (!serviceKey) {
    return jsonResponse(500, { error: 'Server config error' });
  }

  var restHeaders = {
    apikey: serviceKey,
    Authorization: 'Bearer ' + serviceKey,
    'Content-Type': 'application/json',
  };

  var params = event.queryStringParameters || {};

  if (event.httpMethod === 'GET') {
    var limit = clampNumber(params.limit, 50, 1, 200);
    var select = params.summary === '1'
      ? 'id,item_type,item_key,tool_slug,title,summary,href,meta,created_at,updated_at'
      : 'id,item_type,item_key,tool_slug,title,summary,href,payload,meta,created_at,updated_at';

    var url = SUPABASE_AUTH_URL + '/rest/v1/workspace_items?user_id=eq.' + user.id +
      '&select=' + encodeURIComponent(select) +
      '&order=' + encodeURIComponent('updated_at.desc') +
      '&limit=' + limit;

    var itemId = sanitizeText(params.id, 64);
    var itemType = sanitizeText(params.item_type, 64);
    var itemKey = sanitizeText(params.item_key, 120);
    var itemTypes = parseListParam(params.types, 20).map(function (type) {
      return sanitizeText(type, 64);
    }).filter(Boolean);

    if (itemId) {
      url += '&id=eq.' + encodeURIComponent(itemId);
    }

    if (itemType) {
      url += '&item_type=eq.' + encodeURIComponent(itemType);
    } else if (itemTypes.length) {
      url += '&item_type=in.(' + itemTypes.map(function (type) {
        return encodeURIComponent(type);
      }).join(',') + ')';
    }

    if (itemKey) {
      url += '&item_key=eq.' + encodeURIComponent(itemKey);
    }

    var getResponse = await fetch(url, { headers: restHeaders });
    var getText = await getResponse.text();
    var getData = [];

    try {
      getData = JSON.parse(getText);
    } catch (error) {
      getData = [];
    }

    if (!getResponse.ok) {
      return jsonResponse(getResponse.status, { error: 'Workspace fetch failed', detail: getText });
    }

    return jsonResponse(200, { data: Array.isArray(getData) ? getData : [] });
  }

  if (event.httpMethod === 'POST') {
    var body;
    try {
      body = JSON.parse(event.body || '{}');
    } catch (error) {
      return jsonResponse(400, { error: 'Invalid JSON' });
    }

    var bodyItemType = sanitizeText(body.item_type, 64);
    var bodyItemKey = sanitizeText(body.item_key, 120);
    var title = sanitizeText(body.title, 160) || 'Untitled item';
    var summary = sanitizeText(body.summary, 320);
    var href = sanitizeText(body.href, 240);
    var toolSlug = sanitizeText(body.tool_slug, 120);
    var payload = normalizeJson(body.payload, {});
    var meta = normalizeJson(body.meta, {});

    if (!bodyItemType || !bodyItemKey) {
      return jsonResponse(400, { error: 'Missing item_type or item_key' });
    }

    if (payloadSizeBytes(payload, meta) > 750000) {
      return jsonResponse(400, { error: 'Workspace item is too large' });
    }

    var row = {
      user_id: user.id,
      item_type: bodyItemType,
      item_key: bodyItemKey,
      tool_slug: toolSlug || null,
      title: title,
      summary: summary || null,
      href: href || null,
      payload: payload,
      meta: meta,
      updated_at: new Date().toISOString(),
    };

    var postResponse = await fetch(
      SUPABASE_AUTH_URL + '/rest/v1/workspace_items?on_conflict=' + encodeURIComponent('user_id,item_type,item_key'),
      {
        method: 'POST',
        headers: Object.assign({}, restHeaders, {
          Prefer: 'return=representation,resolution=merge-duplicates',
        }),
        body: JSON.stringify(row),
      }
    );

    var postText = await postResponse.text();
    var postData = null;

    try {
      postData = JSON.parse(postText);
    } catch (error) {
      postData = null;
    }

    if (!postResponse.ok) {
      return jsonResponse(postResponse.status, { error: 'Workspace save failed', detail: postText });
    }

    return jsonResponse(200, {
      ok: true,
      item: Array.isArray(postData) ? (postData[0] || null) : postData,
    });
  }

  if (event.httpMethod === 'DELETE') {
    var deleteId = sanitizeText(params.id, 64);
    var deleteType = sanitizeText(params.item_type, 64);
    var deleteKey = sanitizeText(params.item_key, 120);

    if (!deleteId && (!deleteType || !deleteKey)) {
      return jsonResponse(400, { error: 'Missing id or item_type/item_key' });
    }

    var deleteUrl = SUPABASE_AUTH_URL + '/rest/v1/workspace_items?user_id=eq.' + user.id;

    if (deleteId) {
      deleteUrl += '&id=eq.' + encodeURIComponent(deleteId);
    } else {
      deleteUrl += '&item_type=eq.' + encodeURIComponent(deleteType);
      deleteUrl += '&item_key=eq.' + encodeURIComponent(deleteKey);
    }

    var deleteResponse = await fetch(deleteUrl, {
      method: 'DELETE',
      headers: Object.assign({}, restHeaders, {
        Prefer: 'return=representation',
      }),
    });

    var deleteText = await deleteResponse.text();
    var deleteData = null;

    try {
      deleteData = JSON.parse(deleteText);
    } catch (error) {
      deleteData = null;
    }

    if (!deleteResponse.ok) {
      return jsonResponse(deleteResponse.status, { error: 'Workspace delete failed', detail: deleteText });
    }

    return jsonResponse(200, {
      deleted: true,
      item: Array.isArray(deleteData) ? (deleteData[0] || null) : deleteData,
    });
  }

  return jsonResponse(405, { error: 'Method not allowed' });
};
