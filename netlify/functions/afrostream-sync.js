// netlify/functions/afrostream-sync.js
// AfroStream — Twitch + Kick + YouTube API Data Sync
// Fetches follower counts, avatars, and live status from Twitch Helix + Kick + YouTube Data v3 APIs
// Updates as_creators and as_streams in Supabase
//
// Trigger: POST /api/afrostream/sync (manual, requires ADMIN_SECRET)
// Schedule: Can be configured as Netlify Scheduled Function (every 6 hours)

var SUPABASE_URL = 'https://zpclagtgczsygrgztlts.supabase.co';
var SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_DATA_SERVICE_ROLE_KEY;
var ADMIN_SECRET = process.env.ADMIN_SECRET;
var TWITCH_CLIENT_ID = process.env.TWITCH_CLIENT_ID;
var TWITCH_CLIENT_SECRET = process.env.TWITCH_CLIENT_SECRET;
var KICK_CLIENT_ID = process.env.KICK_CLIENT_ID;
var KICK_CLIENT_SECRET = process.env.KICK_CLIENT_SECRET;
var YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
var BACKGROUND_SYNC_PATH = '/.netlify/functions/afrostream-sync-background';

// ── Helpers ──────────────────────────────────────────────────────

function getCorsHeaders(event) {
  var origin = (event.headers && event.headers.origin) || '';
  var isAllowed =
    origin === 'https://afrotools.com' ||
    origin === 'https://www.afrotools.com' ||
    origin.endsWith('.netlify.app') ||
    origin.startsWith('http://localhost') ||
    origin.startsWith('http://127.0.0.1');
  return {
    'Access-Control-Allow-Origin': isAllowed ? origin : 'https://afrotools.com',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
    'Vary': 'Origin'
  };
}

function getHeader(event, headerName) {
  var headers = (event && event.headers) || {};
  var expected = String(headerName || '').toLowerCase();
  var keys = Object.keys(headers);
  for (var i = 0; i < keys.length; i++) {
    if (String(keys[i]).toLowerCase() === expected) return headers[keys[i]];
  }
  return '';
}

function isAuthorized(event) {
  if (!ADMIN_SECRET) return false;
  var auth = getHeader(event, 'authorization');
  return auth === 'Bearer ' + ADMIN_SECRET;
}

function getSiteBaseUrl(event) {
  var headers = event.headers || {};
  var forwardedProto = headers['x-forwarded-proto'] || headers['X-Forwarded-Proto'];
  var host = headers.host || headers.Host;
  if (forwardedProto && host) return forwardedProto + '://' + host;
  if (host) return 'https://' + host;
  return process.env.URL || 'https://afrotools.com';
}

function getManualSyncMode(event) {
  var params = event.queryStringParameters || {};
  return params.mode === 'inline' ? 'inline' : 'background';
}

async function sb(method, path, body, upsert) {
  var opts = {
    method: method,
    headers: {
      apikey: SUPABASE_SERVICE_KEY,
      Authorization: 'Bearer ' + SUPABASE_SERVICE_KEY,
      'Content-Type': 'application/json',
      'Prefer': upsert ? 'return=representation,resolution=merge-duplicates' : 'return=representation'
    }
  };
  if (body) opts.body = JSON.stringify(body);
  var res = await fetch(SUPABASE_URL + '/rest/v1/' + path, opts);
  var text = await res.text();
  var parsed = null;
  try { parsed = text ? JSON.parse(text) : null; } catch (e) { parsed = text; }
  if (!res.ok) {
    var detail = parsed && parsed.message ? parsed.message : text;
    throw new Error('Supabase ' + method + ' ' + path + ' failed: ' + res.status + (detail ? ' ' + detail : ''));
  }
  return parsed;
}

function summarizeErrors(value, out) {
  out = out || [];
  if (!value || out.length >= 20) return out;
  if (Array.isArray(value)) {
    value.forEach(function(item) { summarizeErrors(item, out); });
    return out;
  }
  if (typeof value === 'object') {
    if (Array.isArray(value.errors)) summarizeErrors(value.errors, out);
    if (value.rpc_error) out.push('RPC fallback: ' + value.rpc_error);
    ['twitch', 'kick', 'youtube', 'scoring'].forEach(function(key) {
      if (value[key]) summarizeErrors(value[key], out);
    });
    return out;
  }
  if (typeof value !== 'string') return out;
  var message = String(value || '').trim();
  if (message) out.push(message);
  return out;
}

function snapshotCountFromScoring(scoring) {
  if (!scoring) return 0;
  if (Array.isArray(scoring)) {
    return scoring.reduce(function(total, row) {
      return total + snapshotCountFromScoring(row && (row.refresh_afrostream_creator_snapshots || row));
    }, 0);
  }
  if (typeof scoring.snapshots === 'number') return scoring.snapshots;
  if (typeof scoring.snapshots === 'string') return parseInt(scoring.snapshots, 10) || 0;
  return 0;
}

async function recordScraperRun(scraperId, status, source, recordsCount, errorMessage, durationMs) {
  try {
    await sb('POST', 'scraper_runs', {
      scraper_id: scraperId,
      status: status,
      source: source,
      records_count: recordsCount || 0,
      error_message: errorMessage || null,
      duration_ms: durationMs || 0,
      fetched_at: new Date().toISOString()
    });
  } catch (e) {
    console.error('AfroStream scraper run logging failed:', e.message);
  }
}

async function refreshSnapshotsViaRpc(snapshotDate) {
  var body = {};
  if (snapshotDate) body.p_snapshot_date = snapshotDate;
  return sb('POST', 'rpc/refresh_afrostream_creator_snapshots', body);
}

async function triggerBackgroundSync(event) {
  var backgroundUrl = getSiteBaseUrl(event).replace(/\/$/, '') + BACKGROUND_SYNC_PATH;
  var res = await fetch(backgroundUrl, {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + ADMIN_SECRET,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      triggered_at: new Date().toISOString(),
      requested_by: 'manual-sync-endpoint'
    })
  });
  if (res.status !== 202 && !res.ok) {
    var text = await res.text();
    throw new Error('Background sync trigger failed: ' + res.status + (text ? ' ' + text : ''));
  }
  return {
    accepted: true,
    trigger_status: res.status,
    background_path: BACKGROUND_SYNC_PATH
  };
}

// ── Twitch API ───────────────────────────────────────────────────

async function getTwitchToken() {
  var res = await fetch('https://id.twitch.tv/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'client_id=' + TWITCH_CLIENT_ID +
          '&client_secret=' + TWITCH_CLIENT_SECRET +
          '&grant_type=client_credentials'
  });
  if (!res.ok) throw new Error('Twitch auth failed: ' + res.status);
  var data = await res.json();
  return data.access_token;
}

function twitchHeaders(token) {
  return {
    'Client-ID': TWITCH_CLIENT_ID,
    'Authorization': 'Bearer ' + token
  };
}

async function twitchGet(endpoint, token) {
  var res = await fetch('https://api.twitch.tv/helix/' + endpoint, {
    headers: twitchHeaders(token)
  });
  if (!res.ok) {
    var text = await res.text();
    throw new Error('Twitch API error ' + res.status + ': ' + text);
  }
  return res.json();
}

function extractTwitchUsername(url) {
  if (!url) return null;
  // Handle: https://twitch.tv/name, https://www.twitch.tv/name, twitch.tv/name
  var match = url.match(/twitch\.tv\/([a-zA-Z0-9_]+)/i);
  return match ? match[1].toLowerCase() : null;
}

function extractKickSlug(url) {
  if (!url) return null;
  var match = url.match(/kick\.com\/([a-zA-Z0-9_-]+)/i);
  return match ? match[1] : null;
}

function normalizeThumbnailUrl(value) {
  if (!value) return '';

  if (Array.isArray(value)) {
    for (var ai = 0; ai < value.length; ai++) {
      var arrUrl = normalizeThumbnailUrl(value[ai]);
      if (arrUrl) return arrUrl;
    }
    return '';
  }

  if (typeof value === 'object') {
    var keys = ['url', 'src', 'secure_url', 'thumbnail_url', 'thumbnailUrl', 'image', 'thumbnail', 'poster', 'original', 'large', 'medium', 'small', 'sm'];
    for (var ki = 0; ki < keys.length; ki++) {
      var next = normalizeThumbnailUrl(value[keys[ki]]);
      if (next) return next;
    }
    return '';
  }

  var str = String(value).trim();
  if (!str || str === 'null' || str === 'undefined' || str === '[object Object]') return '';

  if ((str.charAt(0) === '{' || str.charAt(0) === '[') && str.indexOf('http') !== 0) {
    try {
      return normalizeThumbnailUrl(JSON.parse(str));
    } catch (e) {
      // fall through to string cleanup
    }
  }

  str = str
    .replace(/\\u0026/g, '&')
    .replace(/\\\//g, '/')
    .replace(/&amp;/g, '&')
    .replace(/^\/\//, 'https://')
    .replace(/^http:\/\//i, 'https://')
    .replace(/\{width\}/g, '440')
    .replace(/\{height\}/g, '248');

  return /^https?:\/\//i.test(str) ? str : '';
}

// ── Kick API ─────────────────────────────────────────────────────

async function getKickToken() {
  var secrets = [KICK_CLIENT_SECRET];
  if (KICK_CLIENT_SECRET && KICK_CLIENT_SECRET.startsWith('0x')) {
    secrets.push(KICK_CLIENT_SECRET.slice(2));
  }
  var scopes = ['public', ''];
  for (var s = 0; s < secrets.length; s++) {
    for (var sc = 0; sc < scopes.length; sc++) {
      var body = 'grant_type=client_credentials' +
        '&client_id=' + encodeURIComponent(KICK_CLIENT_ID) +
        '&client_secret=' + encodeURIComponent(secrets[s]);
      if (scopes[sc]) body += '&scope=' + scopes[sc];
      try {
        var res = await fetch('https://id.kick.com/oauth/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: body
        });
        if (res.ok) {
          var data = await res.json();
          if (data.access_token) return data.access_token;
        }
      } catch(e) { /* try next variant */ }
    }
  }
  throw new Error('Kick auth failed with all secret/scope variants');
}

async function syncKick() {
  var results = { creators_synced: 0, live_count: 0, errors: [] };

  if (!KICK_CLIENT_ID || !KICK_CLIENT_SECRET) {
    results.errors.push('Kick API credentials not configured, skipping');
    return results;
  }

  // 1. Get Kick token
  var token;
  try {
    token = await getKickToken();
  } catch (e) {
    results.errors.push('Kick auth failed: ' + e.message);
    return results;
  }

  // 2. Query creators with kick_url
  var creators = await sb('GET', 'as_creators?kick_url=not.is.null&kick_url=not.eq.&select=id,name,slug,kick_url,subscribers,avatar,country&is_published=eq.true');
  if (!Array.isArray(creators) || creators.length === 0) {
    results.errors.push('No creators with Kick URLs found');
    return results;
  }

  // 3. For each Kick creator, fetch channel data

  for (var i = 0; i < creators.length; i++) {
    var creator = creators[i];
    var slug = extractKickSlug(creator.kick_url);
    if (!slug) { results.errors.push('Bad Kick URL: ' + creator.kick_url); continue; }

    try {
      var res = await fetch('https://api.kick.com/public/v1/channels?slug=' + encodeURIComponent(slug), {
        headers: { 'Authorization': 'Bearer ' + token }
      });
      if (!res.ok) {
        results.errors.push('Kick API error for ' + slug + ': ' + res.status);
        continue;
      }
      var data = await res.json();
      var channelData = data.data && data.data[0] ? data.data[0] : data.data || data;

      var updates = { updated_at: new Date().toISOString() };
      var kickFollowers = channelData.follower_count || channelData.followers_count || 0;

      // Store per-platform follower count
      if (kickFollowers > 0) {
        updates.kick_followers = kickFollowers;
      }

      // Update avatar if available and no existing avatar
      var kickAvatar = normalizeThumbnailUrl(channelData.profile_image || channelData.profile_pic || channelData.avatar);
      if (kickAvatar && (!creator.avatar || creator.avatar.includes('ui-avatars.com'))) {
        updates.avatar = kickAvatar;
      }

      await sb('PATCH', 'as_creators?id=eq.' + creator.id, updates);
      results.creators_synced++;

      // Check if live
      var isLive = channelData.is_live || (channelData.livestream && channelData.livestream.is_live);
      if (isLive) {
        var streamTitle = (channelData.livestream && channelData.livestream.session_title) || channelData.stream_title || 'Live on Kick';
        var kickThumb = normalizeThumbnailUrl((channelData.livestream && channelData.livestream.thumbnail) || channelData.banner_image);
        var streamData = {
          creator_name: creator.name,
          title: streamTitle,
          platform: 'Kick',
          category: (channelData.livestream && channelData.livestream.categories && channelData.livestream.categories[0] && channelData.livestream.categories[0].name) || '',
          country: creator.country || '',
          stream_date: new Date().toISOString(),
          url: 'https://kick.com/' + slug,
          is_live: true,
          is_published: true
        };
        if (kickThumb) streamData.thumbnail = kickThumb;

        var existing = await sb('GET', 'as_streams?creator_name=eq.' + encodeURIComponent(creator.name) + '&platform=eq.Kick&limit=1&order=stream_date.desc');
        if (Array.isArray(existing) && existing.length > 0) {
          await sb('PATCH', 'as_streams?id=eq.' + existing[0].id, streamData);
        } else {
          await sb('POST', 'as_streams', streamData);
        }
        results.live_count++;
      } else {
        await sb('PATCH', 'as_streams?platform=eq.Kick&is_live=eq.true&creator_name=eq.' + encodeURIComponent(creator.name), {
          is_live: false
        });
      }
    } catch (e) {
      results.errors.push('Kick sync failed for ' + creator.name + ': ' + e.message);
    }
  }

  return results;
}

// ── YouTube API ─────────────────────────────────────────────────

function extractYoutubeId(url) {
  if (!url) return null;
  // Handle: /channel/UCxxxx, /c/name, /@handle, /user/name
  var channelMatch = url.match(/youtube\.com\/channel\/(UC[a-zA-Z0-9_-]+)/i);
  if (channelMatch) return { type: 'id', value: channelMatch[1] };
  var handleMatch = url.match(/youtube\.com\/@([a-zA-Z0-9_.-]+)/i);
  if (handleMatch) return { type: 'handle', value: handleMatch[1] };
  var customMatch = url.match(/youtube\.com\/(?:c|user)\/([a-zA-Z0-9_.-]+)/i);
  if (customMatch) return { type: 'handle', value: customMatch[1] };
  return null;
}

async function ytGet(endpoint) {
  var res = await fetch('https://www.googleapis.com/youtube/v3/' + endpoint + '&key=' + YOUTUBE_API_KEY);
  if (!res.ok) {
    var text = await res.text();
    throw new Error('YouTube API error ' + res.status + ': ' + text);
  }
  return res.json();
}

async function syncYouTube() {
  var results = { creators_synced: 0, live_count: 0, errors: [] };

  if (!YOUTUBE_API_KEY) {
    results.errors.push('YouTube API key not configured, skipping');
    return results;
  }

  // Get creators with youtube_url
  var creators = await sb('GET', 'as_creators?youtube_url=not.is.null&youtube_url=not.eq.&select=id,name,slug,youtube_url,yt_channel_id,subscribers,total_views,avatar,country&is_published=eq.true');
  if (!Array.isArray(creators) || creators.length === 0) {
    results.errors.push('No creators with YouTube URLs found');
    return results;
  }

  // Rotate through creators in larger batches while staying inside YouTube quota.
  // Cached yt_channel_id values avoid repeated handle resolution; channel stats cost 1 unit per 50 IDs.
  // Live checking is handled by afrostream-livecheck.js separately.
  var maxPerRun = Math.min(parseInt(process.env.AFROSTREAM_YOUTUBE_SYNC_BATCH_SIZE, 10) || 200, 500);
  var syncBatch = Math.floor(Date.now() / 7200000) % Math.ceil(creators.length / maxPerRun);
  var batchCreators = creators.slice(syncBatch * maxPerRun, (syncBatch + 1) * maxPerRun);
  results.batch = syncBatch + 1;
  results.batchSize = batchCreators.length;
  results.totalCreators = creators.length;

  // Resolve channel IDs
  var channelMap = {}; // channelId -> creator
  var channelIds = [];

  for (var i = 0; i < batchCreators.length; i++) {
    var parsed = extractYoutubeId(batchCreators[i].youtube_url);
    if (!parsed) { results.errors.push('Bad YouTube URL: ' + batchCreators[i].youtube_url); continue; }

    if (batchCreators[i].yt_channel_id) {
      channelMap[batchCreators[i].yt_channel_id] = batchCreators[i];
      channelIds.push(batchCreators[i].yt_channel_id);
    } else if (parsed.type === 'id') {
      channelMap[parsed.value] = batchCreators[i];
      channelIds.push(parsed.value);
      try { await sb('PATCH', 'as_creators?id=eq.' + batchCreators[i].id, { yt_channel_id: parsed.value }); } catch (e) {}
    } else {
      try {
        var searchData = await ytGet('channels?part=id&forHandle=' + encodeURIComponent(parsed.value));
        if (searchData.items && searchData.items.length > 0) {
          var cid = searchData.items[0].id;
          channelMap[cid] = batchCreators[i];
          channelIds.push(cid);
          try { await sb('PATCH', 'as_creators?id=eq.' + batchCreators[i].id, { yt_channel_id: cid }); } catch (e) {}
        } else {
          var searchRes = await ytGet('search?part=snippet&type=channel&q=' + encodeURIComponent(parsed.value) + '&maxResults=1');
          if (searchRes.items && searchRes.items.length > 0) {
            var cid2 = searchRes.items[0].snippet.channelId;
            channelMap[cid2] = batchCreators[i];
            channelIds.push(cid2);
            try { await sb('PATCH', 'as_creators?id=eq.' + batchCreators[i].id, { yt_channel_id: cid2 }); } catch (e) {}
          } else {
            results.errors.push('YouTube channel not found for handle: ' + parsed.value);
          }
        }
      } catch (e) {
        results.errors.push('YouTube resolve failed for ' + parsed.value + ': ' + e.message);
      }
    }
  }

  if (channelIds.length === 0) {
    results.errors.push('No valid YouTube channel IDs resolved');
    return results;
  }

  // Batch fetch channel stats (max 50 per request, 1 unit per 50)
  for (var batch = 0; batch < channelIds.length; batch += 50) {
    var chunk = channelIds.slice(batch, batch + 50);
    try {
      var channelsData = await ytGet('channels?part=statistics,snippet&id=' + chunk.join(','));
      if (channelsData.items) {
        for (var j = 0; j < channelsData.items.length; j++) {
          var ch = channelsData.items[j];
          var creator = channelMap[ch.id];
          if (!creator) continue;

          var ytSubs = parseInt(ch.statistics.subscriberCount, 10) || 0;
          var ytViews = parseInt(ch.statistics.viewCount, 10) || 0;
          var updates = { updated_at: new Date().toISOString() };

          // Store per-platform data
          if (ytSubs > 0) {
            updates.yt_subscribers = ytSubs;
          }
          if (ytViews > 0) {
            updates.yt_views = ytViews;
            updates.total_views = ytViews;
          }

          // Update avatar if available and no real avatar
          var ytAvatar = ch.snippet && ch.snippet.thumbnails && ch.snippet.thumbnails.high && ch.snippet.thumbnails.high.url;
          if (ytAvatar && (!creator.avatar || creator.avatar.includes('ui-avatars.com'))) {
            updates.avatar = ytAvatar;
          }

          await sb('PATCH', 'as_creators?id=eq.' + creator.id, updates);
          results.creators_synced++;
        }
      }
    } catch (e) {
      results.errors.push('YouTube batch error: ' + e.message);
    }
  }

  // NOTE: Live checking is done by afrostream-livecheck.js (every 30 min).
  // No live search calls here to save quota.

  return results;
}

// ── Main sync logic ──────────────────────────────────────────────

async function syncTwitch() {
  var startTime = Date.now();
  var results = { creators_synced: 0, live_count: 0, errors: [], skipped: 0 };

  // 1. Get Twitch OAuth token
  var token = await getTwitchToken();

  // 2. Query Supabase for creators with twitch_url
  var creators = await sb('GET', 'as_creators?twitch_url=not.is.null&twitch_url=not.eq.&select=id,name,slug,twitch_url,subscribers,avatar,country&is_published=eq.true');
  if (!Array.isArray(creators) || creators.length === 0) {
    results.errors.push('No creators with Twitch URLs found');
    results.duration_ms = Date.now() - startTime;
    return results;
  }

  // 3. Extract usernames and map to creators
  var usernameMap = {}; // username -> creator
  var usernames = [];
  for (var i = 0; i < creators.length; i++) {
    var username = extractTwitchUsername(creators[i].twitch_url);
    if (username) {
      usernameMap[username] = creators[i];
      usernames.push(username);
    } else {
      results.skipped++;
    }
  }

  if (usernames.length === 0) {
    results.errors.push('No valid Twitch usernames extracted');
    results.duration_ms = Date.now() - startTime;
    return results;
  }

  // 4. Batch fetch Twitch user profiles (max 100 per request)
  var twitchUsers = {}; // login -> {id, login, display_name, profile_image_url}
  for (var batch = 0; batch < usernames.length; batch += 100) {
    var chunk = usernames.slice(batch, batch + 100);
    var query = chunk.map(function(u) { return 'login=' + u; }).join('&');
    try {
      var usersData = await twitchGet('users?' + query, token);
      if (usersData.data) {
        for (var j = 0; j < usersData.data.length; j++) {
          var u = usersData.data[j];
          twitchUsers[u.login.toLowerCase()] = u;
        }
      }
    } catch (e) {
      results.errors.push('Users batch error: ' + e.message);
    }
  }

  // 5. Get follower counts (parallelize in chunks of 10)
  var followerCounts = {}; // twitch user id -> count
  var broadcasterIds = Object.values(twitchUsers).map(function(u) { return u.id; });

  for (var fc = 0; fc < broadcasterIds.length; fc += 10) {
    var fcChunk = broadcasterIds.slice(fc, fc + 10);
    var followerPromises = fcChunk.map(function(bid) {
      return twitchGet('channels/followers?broadcaster_id=' + bid + '&first=1', token)
        .then(function(data) { return { id: bid, total: data.total || 0 }; })
        .catch(function(e) { return { id: bid, total: 0, error: e.message }; });
    });
    var followerResults = await Promise.allSettled(followerPromises);
    for (var fr = 0; fr < followerResults.length; fr++) {
      if (followerResults[fr].status === 'fulfilled') {
        var val = followerResults[fr].value;
        followerCounts[val.id] = val.total;
        if (val.error) results.errors.push('Follower count error for ' + val.id + ': ' + val.error);
      }
    }
  }

  // 6. Check live status (batch)
  var liveStreams = {}; // username -> stream data
  for (var lb = 0; lb < usernames.length; lb += 100) {
    var liveChunk = usernames.slice(lb, lb + 100);
    var liveQuery = liveChunk.map(function(u) { return 'user_login=' + u; }).join('&');
    try {
      var streamsData = await twitchGet('streams?' + liveQuery, token);
      if (streamsData.data) {
        for (var ls = 0; ls < streamsData.data.length; ls++) {
          var stream = streamsData.data[ls];
          liveStreams[stream.user_login.toLowerCase()] = stream;
        }
      }
    } catch (e) {
      results.errors.push('Live check error: ' + e.message);
    }
  }

  // 7. Update Supabase as_creators
  for (var un = 0; un < usernames.length; un++) {
    var uname = usernames[un];
    var creator = usernameMap[uname];
    var twitchUser = twitchUsers[uname];

    if (!twitchUser) {
      results.errors.push('Twitch user not found: ' + uname);
      continue;
    }

    var twitchFollowers = followerCounts[twitchUser.id] || 0;
    var updates = { updated_at: new Date().toISOString() };

    // Store per-platform follower count
    if (twitchFollowers > 0) {
      updates.twitch_followers = twitchFollowers;
    }

    // Always update avatar from Twitch if available and no YouTube avatar
    if (twitchUser.profile_image_url && (!creator.avatar || creator.avatar.includes('ui-avatars.com'))) {
      updates.avatar = twitchUser.profile_image_url;
    }

    try {
      await sb('PATCH', 'as_creators?id=eq.' + creator.id, updates);
      results.creators_synced++;
    } catch (e) {
      results.errors.push('Update failed for ' + creator.name + ': ' + e.message);
    }
  }

  // 8. Update as_streams for live status
  // First, set all Twitch streams to not live
  await sb('PATCH', 'as_streams?platform=eq.Twitch&is_live=eq.true', { is_live: false });

  // Then upsert live streams
  var liveUsernames = Object.keys(liveStreams);
  for (var li = 0; li < liveUsernames.length; li++) {
    var liveUname = liveUsernames[li];
    var liveCreator = usernameMap[liveUname];
    var liveStream = liveStreams[liveUname];

    if (!liveCreator) continue;

    var twitchThumb = normalizeThumbnailUrl(liveStream.thumbnail_url);
    var streamData = {
      creator_name: liveCreator.name,
      title: liveStream.title || 'Live on Twitch',
      platform: 'Twitch',
      category: liveStream.game_name || '',
      country: liveCreator.country || '',
      stream_date: new Date().toISOString(),
      url: 'https://twitch.tv/' + liveUname,
      is_live: true,
      is_published: true
    };
    if (twitchThumb) streamData.thumbnail = twitchThumb;

    try {
      // Check if a live stream record already exists for this creator
      var existing = await sb('GET', 'as_streams?creator_name=eq.' + encodeURIComponent(liveCreator.name) + '&platform=eq.Twitch&limit=1&order=stream_date.desc');
      if (Array.isArray(existing) && existing.length > 0) {
        await sb('PATCH', 'as_streams?id=eq.' + existing[0].id, streamData);
      } else {
        await sb('POST', 'as_streams', streamData);
      }
      results.live_count++;
    } catch (e) {
      results.errors.push('Live stream update failed for ' + liveCreator.name + ': ' + e.message);
    }
  }

  results.duration_ms = Date.now() - startTime;
  return results;
}

// ── AfroStream Score Computation ─────────────────────────────────
// Score (0-100) = weighted composite of:
//   Total Followers (25%) — log-scaled
//   Total Views (20%) — log-scaled
//   Growth Rate (20%) — week-over-week follower change
//   Streaming Consistency (15%) — streams in last 30 days
//   Engagement (10%) — views-per-follower ratio
//   Multi-Platform (10%) — bonus for presence on 3+ platforms
//
// Tiers: Rising (0-19), Trending (20-39), Established (40-59), Elite (60-79), Legend (80-100)

function logScore(value, max) {
  // Log-scale a value to 0-100 range. max = value that maps to 100.
  if (value <= 0) return 0;
  return Math.min(100, Math.round(Math.log10(value) / Math.log10(max) * 100));
}

function getTier(score) {
  if (score >= 80) return 'legend';
  if (score >= 60) return 'elite';
  if (score >= 40) return 'established';
  if (score >= 20) return 'trending';
  return 'rising';
}

function parseMetricValue(value) {
  if (value == null || value === '') return 0;
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  var raw = String(value).trim().toLowerCase();
  var multiplier = raw.endsWith('b') ? 1000000000 : (raw.endsWith('m') ? 1000000 : (raw.endsWith('k') ? 1000 : 1));
  var cleaned = raw.replace(/[$,\s]/g, '').replace(/[bmk]$/, '');
  var parsed = Number(cleaned) * multiplier;
  return Number.isFinite(parsed) ? parsed : 0;
}

async function computeScores() {
  var results = { scored: 0, snapshots: 0, errors: [] };

  try {
    // Fetch all creators with their per-platform data
    var creators = await sb('GET', 'as_creators?is_published=eq.true&select=id,name,primary_platform,subscribers,yt_subscribers,twitch_followers,kick_followers,tiktok_followers,ig_followers,fb_followers,total_views,yt_views,net_worth,frequency,youtube_url,twitch_url,kick_url,tiktok_url,instagram_url,twitter_url');
    if (!Array.isArray(creators) || !creators.length) return results;

    // Fetch stream activity (last 30 days)
    var thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString();
    var streams = await sb('GET', 'as_streams?is_published=eq.true&stream_date=gte.' + thirtyDaysAgo + '&select=creator_name');
    var streamCounts = {};
    if (Array.isArray(streams)) {
      streams.forEach(function(s) {
        var key = String(s.creator_name || '').trim().toLowerCase();
        if (key) streamCounts[key] = (streamCounts[key] || 0) + 1;
      });
    }

    // Fetch last week's snapshot for growth calc
    var oneWeekAgo = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
    var prevSnapshots = await sb('GET', 'as_creator_snapshots?snapshot_date=eq.' + oneWeekAgo + '&select=creator_id,total_followers');
    var prevFollowers = {};
    if (Array.isArray(prevSnapshots)) {
      prevSnapshots.forEach(function(s) { prevFollowers[s.creator_id] = s.total_followers; });
    }

    var today = new Date().toISOString().slice(0, 10);

    for (var i = 0; i < creators.length; i++) {
      var cr = creators[i];
      var baseSubscribers = Number(cr.subscribers || 0) || 0;
      var ytSubscribers = Number(cr.yt_subscribers || 0) || 0;
      var twitchFollowers = Number(cr.twitch_followers || 0) || 0;
      var kickFollowers = Number(cr.kick_followers || 0) || 0;
      var tiktokFollowers = Number(cr.tiktok_followers || 0) || 0;
      var igFollowers = Number(cr.ig_followers || 0) || 0;
      var fbFollowers = Number(cr.fb_followers || 0) || 0;

      // 1. Compute total followers
      var platformFollowerTotal = ytSubscribers + twitchFollowers + kickFollowers + tiktokFollowers + igFollowers + fbFollowers;
      var totalFollowers = Math.max(platformFollowerTotal, baseSubscribers);

      // 2. Total views
      var totalViews = Math.max(Number(cr.total_views || 0) || 0, Number(cr.yt_views || 0) || 0);

      // 3. Growth rate (week-over-week)
      var prev = prevFollowers[cr.id] || 0;
      var growthPct = (prev > 0 && totalFollowers > 0) ? ((totalFollowers - prev) / prev * 100) : 0;
      growthPct = Math.max(-100, Math.min(500, growthPct)); // clamp

      // 4. Platform count
      var platformCount = 0;
      if (cr.youtube_url) platformCount++;
      if (cr.twitch_url) platformCount++;
      if (cr.kick_url) platformCount++;
      if (cr.tiktok_url) platformCount++;
      if (cr.instagram_url) platformCount++;
      if (cr.twitter_url) platformCount++;

      // 5. Engagement (views per follower)
      var engagement = totalFollowers > 0 ? totalViews / totalFollowers : 0;

      // 6. Stream consistency (streams in last 30 days — not easily tied by ID here, skip for now)

      // ── SCORE CALCULATION ──
      var streamCount30d = streamCounts[String(cr.name || '').trim().toLowerCase()] || 0;
      var followerScore = logScore(totalFollowers, 200000000); // 200M = max (Khaby-level)
      var viewScore = logScore(totalViews, 10000000000);       // 10B = max
      var growthScore = Math.min(100, Math.max(0, growthPct * 5)); // 20% growth = 100
      var consistencyScore = Math.min(100, streamCount30d * 10); // 10 streams/month = 100
      var engagementScore = logScore(engagement, 100);         // 100 views/follower = max
      var multiPlatScore = Math.min(100, Math.round(platformCount / 4 * 100)); // 4+ = 100

      var afroScore = Math.round(
        followerScore * 0.25 +
        viewScore * 0.20 +
        growthScore * 0.20 +
        consistencyScore * 0.15 +
        engagementScore * 0.10 +
        multiPlatScore * 0.10
      );
      afroScore = Math.max(0, Math.min(100, afroScore));

      var tier = getTier(afroScore);

      // Update creator
      try {
        await sb('PATCH', 'as_creators?id=eq.' + cr.id, {
          total_followers: totalFollowers,
          afro_score: afroScore,
          afro_tier: tier,
          growth_pct: Math.round(growthPct * 100) / 100,
          updated_at: new Date().toISOString()
        });
        results.scored++;
      } catch (e) {
        results.errors.push('Score update/' + cr.id + ': ' + e.message);
      }

      // Save daily snapshot (upsert)
      try {
        await sb('POST', 'as_creator_snapshots?on_conflict=creator_id,snapshot_date', {
          creator_id: cr.id,
          total_followers: totalFollowers,
          yt_subscribers: ytSubscribers,
          twitch_followers: twitchFollowers,
          kick_followers: kickFollowers,
          tiktok_followers: tiktokFollowers,
          ig_followers: igFollowers,
          total_views: totalViews,
          afro_score: afroScore,
          net_worth_value: parseMetricValue(cr.net_worth),
          stream_cadence: cr.frequency || '',
          stream_count_30d: streamCount30d,
          source_status: 'automated',
          source_quality: totalFollowers || totalViews ? 80 : 50,
          snapshot_date: today
        }, true);
        results.snapshots++;
      } catch (e) {
        results.errors.push('Snapshot/' + cr.id + ': ' + e.message);
      }
    }
  } catch (e) {
    results.errors.push('Score compute: ' + e.message);
  }

  return results;
}

// ── Handler ──────────────────────────────────────────────────────

async function runManualSync(options) {
  var runStart = Date.now();
  var runSource = (options && options.source) || 'Manual sync endpoint';
  var shouldLog = !options || options.log !== false;
  var twitchResults = { creators_synced: 0, live_count: 0, errors: ['Twitch credentials not configured'] };
  var kickResults = { creators_synced: 0, live_count: 0, errors: ['Kick credentials not configured'] };
  var youtubeResults = { creators_synced: 0, live_count: 0, errors: ['YouTube API key not configured'] };

  try {
    if (TWITCH_CLIENT_ID && TWITCH_CLIENT_SECRET) {
      twitchResults = await syncTwitch();
    }
    if (KICK_CLIENT_ID && KICK_CLIENT_SECRET) {
      kickResults = await syncKick();
    }
    if (YOUTUBE_API_KEY) {
      youtubeResults = await syncYouTube();
    }

    var scoreResults;
    try {
      scoreResults = await refreshSnapshotsViaRpc();
    } catch (rpcError) {
      scoreResults = await computeScores();
      scoreResults.rpc_error = rpcError.message;
    }

    var syncResults = {
      twitch: twitchResults,
      kick: kickResults,
      youtube: youtubeResults,
      scoring: scoreResults
    };

    var snapshotCount = snapshotCountFromScoring(scoreResults);
    var errors = summarizeErrors(syncResults).slice(0, 12);
    if (shouldLog) {
      await recordScraperRun(
        'afrostream-sync',
        snapshotCount > 0 ? 'ok' : 'error',
        runSource,
        snapshotCount,
        errors.length ? errors.join(' | ').slice(0, 1000) : null,
        Date.now() - runStart
      );
    }

    return syncResults;
  } catch (e) {
    if (shouldLog) {
      await recordScraperRun(
        'afrostream-sync',
        'error',
        runSource,
        0,
        (e.message || 'Sync failed').slice(0, 1000),
        Date.now() - runStart
      );
    }
    throw e;
  }
}

exports.handler = async function(event) {
  var cors = getCorsHeaders(event);

  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: cors, body: '' };
  }

  if (!SUPABASE_SERVICE_KEY) {
    return {
      statusCode: 500,
      headers: cors,
      body: JSON.stringify({ success: false, error: 'Supabase service key not configured' })
    };
  }

  // Scheduled invocations (Netlify Scheduled Functions)
  var isScheduled = event.httpMethod === 'GET' && getHeader(event, 'x-nf-event') === 'schedule';

  // Manual trigger requires auth
  if (!isScheduled && !isAuthorized(event)) {
    return {
      statusCode: 401,
      headers: cors,
      body: JSON.stringify({ success: false, error: 'Unauthorized' })
    };
  }

  try {
    if (isScheduled) {
      var scheduledSync = await runManualSync({ source: 'Netlify Scheduled Function' });
      return {
        statusCode: 200,
        headers: cors,
        body: JSON.stringify({
          success: true,
          message: 'Scheduled AfroStream sync completed',
          data: scheduledSync
        })
      };
    }

    if (getManualSyncMode(event) !== 'inline') {
      var backgroundTrigger = await triggerBackgroundSync(event);
      return {
        statusCode: 202,
        headers: cors,
        body: JSON.stringify({
          success: true,
          accepted: true,
          message: 'AfroStream sync accepted and running in the background',
          data: backgroundTrigger
        })
      };
    }

    var syncResults = await runManualSync({ source: 'Manual inline sync endpoint' });
    return {
      statusCode: 200,
      headers: cors,
      body: JSON.stringify({
        success: true,
        message: 'Sync completed',
        data: syncResults
      })
    };

    var twitchResults = { creators_synced: 0, live_count: 0, errors: ['Twitch credentials not configured'] };
    var kickResults = { creators_synced: 0, live_count: 0, errors: ['Kick credentials not configured'] };
    var youtubeResults = { creators_synced: 0, live_count: 0, errors: ['YouTube API key not configured'] };

    if (TWITCH_CLIENT_ID && TWITCH_CLIENT_SECRET) {
      twitchResults = await syncTwitch();
    }
    if (KICK_CLIENT_ID && KICK_CLIENT_SECRET) {
      kickResults = await syncKick();
    }
    if (YOUTUBE_API_KEY) {
      youtubeResults = await syncYouTube();
    }

    // ── Compute scores + snapshots after all syncs ──
    var scoreResults;
    try {
      scoreResults = await refreshSnapshotsViaRpc();
    } catch (rpcError) {
      scoreResults = await computeScores();
      scoreResults.rpc_error = rpcError.message;
    }

    return {
      statusCode: 200,
      headers: cors,
      body: JSON.stringify({
        success: true,
        message: 'Sync completed',
        data: {
          twitch: twitchResults,
          kick: kickResults,
          youtube: youtubeResults,
          scoring: scoreResults
        }
      })
    };
  } catch (e) {
    return {
      statusCode: 500,
      headers: cors,
      body: JSON.stringify({
        success: false,
        error: e.message || 'Sync failed'
      })
    };
  }
};

exports.runManualSync = runManualSync;
