// netlify/functions/afrostream-livecheck.js
// AfroStream — Lightweight live status check (runs every 30 min)
// Checks Twitch + Kick + YouTube live status and viewer counts
// Keeps Live Now section fresh without burning API quotas on full sync

var SUPABASE_URL = 'https://zpclagtgczsygrgztlts.supabase.co';
var SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_DATA_SERVICE_ROLE_KEY;
var TWITCH_CLIENT_ID = process.env.TWITCH_CLIENT_ID;
var TWITCH_CLIENT_SECRET = process.env.TWITCH_CLIENT_SECRET;
var KICK_CLIENT_ID = process.env.KICK_CLIENT_ID;
var KICK_CLIENT_SECRET = process.env.KICK_CLIENT_SECRET;
var YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

// ── Supabase helper ───────────────────────────────────────────────
async function sb(method, path, body) {
  var opts = {
    method: method,
    headers: {
      apikey: SUPABASE_SERVICE_KEY,
      Authorization: 'Bearer ' + SUPABASE_SERVICE_KEY,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    }
  };
  if (body) opts.body = JSON.stringify(body);
  var res = await fetch(SUPABASE_URL + '/rest/v1/' + path, opts);
  var text = await res.text();
  try { return JSON.parse(text); } catch (e) { return text; }
}

// ── URL extractors ────────────────────────────────────────────────
function extractTwitchUsername(url) {
  if (!url) return null;
  var match = url.match(/twitch\.tv\/([a-zA-Z0-9_]+)/i);
  return match ? match[1].toLowerCase() : null;
}

function extractKickSlug(url) {
  if (!url) return null;
  var match = url.match(/kick\.com\/([a-zA-Z0-9_-]+)/i);
  return match ? match[1] : null;
}

function extractYoutubeChannelId(url) {
  if (!url) return null;
  var match = url.match(/youtube\.com\/channel\/(UC[a-zA-Z0-9_-]+)/i);
  if (match) return { type: 'id', value: match[1] };
  var handleMatch = url.match(/youtube\.com\/@([a-zA-Z0-9_.-]+)/i);
  if (handleMatch) return { type: 'handle', value: handleMatch[1] };
  var customMatch = url.match(/youtube\.com\/(?:c|user)\/([a-zA-Z0-9_.-]+)/i);
  if (customMatch) return { type: 'handle', value: customMatch[1] };
  return null;
}

// ── Auth helpers ──────────────────────────────────────────────────
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

async function getKickToken() {
  var secrets = [KICK_CLIENT_SECRET];
  if (KICK_CLIENT_SECRET && KICK_CLIENT_SECRET.startsWith('0x')) {
    secrets.push(KICK_CLIENT_SECRET.slice(2));
  }
  // Try with and without scope=public (Kick requires scope in some environments)
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
      } catch(e) { /* try next */ }
    }
  }
  return null; // Don't throw — fall back to unofficial API
}

// ── Upsert stream helper ─────────────────────────────────────────
async function upsertStream(creatorName, streamData) {
  var existing = await sb('GET', 'as_streams?creator_name=eq.' + encodeURIComponent(creatorName) + '&platform=eq.' + streamData.platform + '&limit=1&order=stream_date.desc');
  if (Array.isArray(existing) && existing.length > 0) {
    await sb('PATCH', 'as_streams?id=eq.' + existing[0].id, streamData);
  } else {
    await sb('POST', 'as_streams', streamData);
  }
}

// ── Twitch live check ─────────────────────────────────────────────
async function checkTwitch(allCreators) {
  var results = { live: 0, errors: [] };

  if (!TWITCH_CLIENT_ID || !TWITCH_CLIENT_SECRET) {
    results.errors.push('Twitch credentials not configured');
    return results;
  }

  var creators = allCreators.filter(function(c) { return c.twitch_url; });
  if (!creators.length) return results;

  // Build username map
  var usernameMap = {};
  var usernames = [];
  for (var i = 0; i < creators.length; i++) {
    var username = extractTwitchUsername(creators[i].twitch_url);
    if (username) {
      usernameMap[username] = creators[i];
      usernames.push(username);
    }
  }
  if (!usernames.length) return results;

  try {
    var token = await getTwitchToken();

    // Clear all Twitch live streams first
    await sb('PATCH', 'as_streams?platform=eq.Twitch&is_live=eq.true', { is_live: false });

    // Batch check live status (up to 100 per call)
    for (var batch = 0; batch < usernames.length; batch += 100) {
      var chunk = usernames.slice(batch, batch + 100);
      var liveQuery = chunk.map(function(u) { return 'user_login=' + u; }).join('&');
      var streamsRes = await fetch('https://api.twitch.tv/helix/streams?' + liveQuery, {
        headers: { 'Client-ID': TWITCH_CLIENT_ID, 'Authorization': 'Bearer ' + token }
      });

      if (!streamsRes.ok) {
        results.errors.push('Twitch streams API: ' + streamsRes.status);
        continue;
      }

      var streamsData = await streamsRes.json();
      if (streamsData.data) {
        for (var j = 0; j < streamsData.data.length; j++) {
          var stream = streamsData.data[j];
          var creator = usernameMap[stream.user_login.toLowerCase()];
          if (!creator) continue;

          var thumb = stream.thumbnail_url ? stream.thumbnail_url.replace('{width}', '440').replace('{height}', '248') : null;
          await upsertStream(creator.name, {
            creator_name: creator.name,
            title: stream.title || 'Live on Twitch',
            platform: 'Twitch',
            category: stream.game_name || '',
            country: creator.country || '',
            stream_date: new Date().toISOString(),
            url: 'https://twitch.tv/' + stream.user_login,
            thumbnail: thumb,
            viewer_count: stream.viewer_count || 0,
            is_live: true,
            is_published: true
          });
          results.live++;
        }
      }
    }
  } catch (e) {
    results.errors.push('Twitch: ' + e.message);
  }

  return results;
}

// ── Kick channel data helper (tries official API, falls back to unofficial) ────
async function fetchKickChannel(slug, token) {
  // 1. Try official API v1 (requires token)
  if (token) {
    try {
      var r1 = await fetch('https://api.kick.com/public/v1/channels?slug=' + encodeURIComponent(slug), {
        headers: { 'Authorization': 'Bearer ' + token, 'Accept': 'application/json' }
      });
      if (r1.ok) {
        var d1 = await r1.json();
        var ch1 = d1.data && d1.data[0] ? d1.data[0] : null;
        if (ch1) return ch1;
      }
    } catch(e) { /* fall through */ }
  }

  // 2. Try unofficial v2 API (no auth required — used by Kick web client)
  try {
    var r2 = await fetch('https://kick.com/api/v2/channels/' + encodeURIComponent(slug), {
      headers: { 'Accept': 'application/json', 'User-Agent': 'Mozilla/5.0' }
    });
    if (r2.ok) {
      var d2 = await r2.json();
      // v2 response: { id, slug, is_banned, livestream: { is_live, viewer_count, session_title, ... }, following_count }
      return {
        is_live: !!(d2.livestream && d2.livestream.is_live),
        follower_count: d2.following_count || 0,
        profile_image: d2.user && d2.user.profile_pic,
        livestream: d2.livestream || null,
        _v2: true
      };
    }
  } catch(e) { /* fall through */ }

  // 3. Try official API v1 search endpoint
  try {
    var r3 = await fetch('https://api.kick.com/public/v1/video/livestreams?channel_name=' + encodeURIComponent(slug), {
      headers: token ? { 'Authorization': 'Bearer ' + token } : {}
    });
    if (r3.ok) {
      var d3 = await r3.json();
      if (d3.data) return { is_live: true, livestream: d3.data };
    }
  } catch(e) { /* fall through */ }

  return null;
}

// ── Kick live check ───────────────────────────────────────────────
async function checkKick(allCreators) {
  var results = { live: 0, errors: [] };

  var creators = allCreators.filter(function(c) { return c.kick_url; });
  if (!creators.length) return results;

  // Try to get OAuth token (optional — we have unofficial fallback)
  var token = null;
  if (KICK_CLIENT_ID && KICK_CLIENT_SECRET) {
    try { token = await getKickToken(); } catch(e) { /* use unofficial API */ }
  }

  // Clear all Kick live streams first
  await sb('PATCH', 'as_streams?platform=eq.Kick&is_live=eq.true', { is_live: false });

  for (var i = 0; i < creators.length; i++) {
    var creator = creators[i];
    var slug = extractKickSlug(creator.kick_url);
    if (!slug) continue;

    try {
      var ch = await fetchKickChannel(slug, token);
      if (!ch) { results.errors.push('Kick/' + slug + ': no data from any API'); continue; }

      var isLive = ch.is_live || (ch.livestream && ch.livestream.is_live);
      if (isLive) {
        var title = (ch.livestream && (ch.livestream.session_title || ch.livestream.slug)) || 'Live on Kick';
        var viewers = (ch.livestream && ch.livestream.viewer_count) || ch.viewer_count || 0;
        var category = (ch.livestream && ch.livestream.categories && ch.livestream.categories[0] && ch.livestream.categories[0].name) || '';
        var kickThumb = (ch.livestream && ch.livestream.thumbnail && (ch.livestream.thumbnail.url || ch.livestream.thumbnail)) || ch.banner_image || null;

        await upsertStream(creator.name, {
          creator_name: creator.name,
          title: title,
          platform: 'Kick',
          category: category,
          country: creator.country || '',
          stream_date: new Date().toISOString(),
          url: 'https://kick.com/' + slug,
          thumbnail: kickThumb,
          viewer_count: viewers,
          is_live: true,
          is_published: true
        });
        results.live++;
      }
    } catch (e) {
      results.errors.push('Kick/' + slug + ': ' + e.message);
    }
  }

  return results;
}

// ── YouTube live check (quota-safe) ───────────────────────────────
// QUOTA MATH:
//   Budget: 10,000 units/day
//   Per-channel live search = 100 units (the killer)
//   OLD: 30 channels × 100 = 3,000 units × 48 runs/day = 144,000 units → quota gone by 1:30am
//   NEW: 8 channels × 101 units = ~808 units × 12 runs/day (time-gated to every 2h) = ~9,700 units ✓
//   Smart: DON'T clear existing live data if quota is exceeded — preserve last known state
async function checkYouTube(allCreators) {
  var results = { live: 0, errors: [] };

  if (!YOUTUBE_API_KEY) {
    results.errors.push('YouTube API key not configured');
    return results;
  }

  // ── QUOTA TIME GATE ────────────────────────────────────────────
  // Only run YouTube checks every 2 hours (4 × 30-min slots per 2-hour window).
  // livecheck runs every 30 min → 48 runs/day → we gate to 12 YouTube runs/day.
  // thirtyMinSlot % 4 === 0 means: only the first slot of each 2-hour block runs.
  var thirtyMinSlot = Math.floor(Date.now() / 1800000);
  if (thirtyMinSlot % 4 !== 0) {
    results.skipped = true;
    results.reason = 'YouTube gated to every 2h (quota preservation)';
    return results;
  }

  var creators = allCreators.filter(function(c) { return c.youtube_url; });
  if (!creators.length) return results;

  // ── SMALL ROTATING BATCH ──────────────────────────────────────
  // 8 channels × ~101 units = ~808 units/run × 12 runs/day = ~9,700 units ✓
  var MAX_CHECKS = 8;
  var batchOffset = Math.floor(Date.now() / 7200000) % Math.ceil(creators.length / MAX_CHECKS);
  var batchStart = batchOffset * MAX_CHECKS;
  var batch = creators.slice(batchStart, batchStart + MAX_CHECKS);
  results.batch = batchOffset + 1;
  results.batchSize = batch.length;
  results.totalCreators = creators.length;

  // ── QUOTA PROBE — check before clearing ──────────────────────
  // Make one cheap call first. If quota is exceeded, abort WITHOUT clearing
  // existing live data (preserves last known state instead of showing 0 YouTube streams).
  var quotaOk = true;
  try {
    var probeRes = await fetch('https://www.googleapis.com/youtube/v3/i18nRegions?part=snippet&key=' + YOUTUBE_API_KEY);
    if (!probeRes.ok) {
      var probeData = await probeRes.json();
      var reason = probeData.error && probeData.error.errors && probeData.error.errors[0] && probeData.error.errors[0].reason;
      if (reason === 'quotaExceeded' || reason === 'dailyLimitExceeded' || probeRes.status === 429) {
        results.errors.push('YouTube quota exceeded — preserving existing live data, skipping clear');
        results.quotaExceeded = true;
        quotaOk = false;
      }
    }
  } catch(e) { /* probe failed, assume ok and continue */ }

  if (!quotaOk) return results;

  // Quota ok — safe to clear this batch's streams and re-check
  // Note: only clear streams for creators IN this batch (not all YouTube streams)
  // This way creators in other batches retain their last known live status
  var batchNames = batch.map(function(c) { return encodeURIComponent(c.name); });
  for (var bn = 0; bn < batch.length; bn++) {
    await sb('PATCH', 'as_streams?platform=eq.YouTube&is_live=eq.true&creator_name=eq.' + encodeURIComponent(batch[bn].name), { is_live: false });
  }

  for (var bi = 0; bi < batch.length; bi++) {
    var creator = batch[bi];
    var parsed = extractYoutubeChannelId(creator.youtube_url);
    if (!parsed) continue;

    try {
      var channelId = null;

      if (parsed.type === 'id') {
        channelId = parsed.value;
      } else {
        // Resolve handle → channel ID (1 unit)
        var hRes = await fetch('https://www.googleapis.com/youtube/v3/channels?part=id&forHandle=' + encodeURIComponent(parsed.value) + '&key=' + YOUTUBE_API_KEY);
        if (!hRes.ok) {
          var hErr = await hRes.json();
          var hReason = hErr.error && hErr.error.errors && hErr.error.errors[0] && hErr.error.errors[0].reason;
          if (hReason === 'quotaExceeded' || hReason === 'dailyLimitExceeded') {
            results.errors.push('YouTube quota exceeded mid-run, stopping');
            results.quotaExceeded = true;
            break;
          }
          continue;
        }
        var hData = await hRes.json();
        if (hData.items && hData.items.length > 0) channelId = hData.items[0].id;
      }
      if (!channelId) continue;

      // Search for live streams on this channel (100 units each — the expensive call)
      var liveRes = await fetch('https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=' + channelId + '&type=video&eventType=live&maxResults=1&key=' + YOUTUBE_API_KEY);
      if (!liveRes.ok) {
        var liveErr = await liveRes.json();
        var liveReason = liveErr.error && liveErr.error.errors && liveErr.error.errors[0] && liveErr.error.errors[0].reason;
        if (liveReason === 'quotaExceeded' || liveReason === 'dailyLimitExceeded') {
          results.errors.push('YouTube quota exceeded mid-run, stopping');
          results.quotaExceeded = true;
          break;
        }
        continue;
      }

      var liveData = await liveRes.json();
      if (liveData.items && liveData.items.length > 0) {
        var liveItem = liveData.items[0];
        var videoId = liveItem.id.videoId;

        // Fetch viewer count (1 unit)
        var viewers = 0;
        try {
          var vidRes = await fetch('https://www.googleapis.com/youtube/v3/videos?part=liveStreamingDetails&id=' + videoId + '&key=' + YOUTUBE_API_KEY);
          if (vidRes.ok) {
            var vidData = await vidRes.json();
            if (vidData.items && vidData.items[0] && vidData.items[0].liveStreamingDetails) {
              viewers = parseInt(vidData.items[0].liveStreamingDetails.concurrentViewers, 10) || 0;
            }
          }
        } catch (e) { /* non-critical */ }

        var ytThumb = (liveItem.snippet.thumbnails && (liveItem.snippet.thumbnails.high || liveItem.snippet.thumbnails.medium || liveItem.snippet.thumbnails.default || {}).url) || ('https://img.youtube.com/vi/' + videoId + '/hqdefault.jpg');
        await upsertStream(creator.name, {
          creator_name: creator.name,
          title: liveItem.snippet.title || 'Live on YouTube',
          platform: 'YouTube',
          category: '',
          country: creator.country || '',
          stream_date: new Date().toISOString(),
          url: 'https://youtube.com/watch?v=' + videoId,
          thumbnail: ytThumb,
          viewer_count: viewers,
          is_live: true,
          is_published: true
        });
        results.live++;
      }
    } catch (e) {
      results.errors.push('YT/' + creator.name + ': ' + e.message);
    }
  }

  return results;
}

// ── Main handler ──────────────────────────────────────────────────
exports.handler = async function(event) {
  var start = Date.now();
  var summary = { twitch: null, kick: null, youtube: null, errors: [], duration_ms: 0 };

  try {
    // Fetch all published creators once (shared across all platform checks)
    var allCreators = await sb('GET', 'as_creators?is_published=eq.true&select=id,name,country,twitch_url,kick_url,youtube_url,subscribers');
    if (!Array.isArray(allCreators) || allCreators.length === 0) {
      summary.duration_ms = Date.now() - start;
      return { statusCode: 200, body: JSON.stringify({ success: true, message: 'No creators found', data: summary }) };
    }

    // Run all platform checks in parallel
    var results = await Promise.allSettled([
      checkTwitch(allCreators),
      checkKick(allCreators),
      checkYouTube(allCreators)
    ]);

    summary.twitch = results[0].status === 'fulfilled' ? results[0].value : { live: 0, errors: [results[0].reason.message] };
    summary.kick = results[1].status === 'fulfilled' ? results[1].value : { live: 0, errors: [results[1].reason.message] };
    summary.youtube = results[2].status === 'fulfilled' ? results[2].value : { live: 0, errors: [results[2].reason.message] };

    summary.total_live = (summary.twitch.live || 0) + (summary.kick.live || 0) + (summary.youtube.live || 0);
    summary.duration_ms = Date.now() - start;

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, message: 'Live check done', data: summary })
    };
  } catch (e) {
    summary.errors.push(e.message);
    summary.duration_ms = Date.now() - start;
    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, data: summary })
    };
  }
};
