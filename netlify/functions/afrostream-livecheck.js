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

// ── Kick channel data helper (tries multiple endpoints with logging) ────
async function fetchKickChannel(slug, token) {
  var attempts = [];

  // 1. Try official API v1 channels endpoint (requires token)
  if (token) {
    try {
      var r1 = await fetch('https://api.kick.com/public/v1/channels?slug=' + encodeURIComponent(slug), {
        headers: { 'Authorization': 'Bearer ' + token, 'Accept': 'application/json' }
      });
      if (r1.ok) {
        var d1 = await r1.json();
        var ch1 = d1.data && d1.data[0] ? d1.data[0] : null;
        if (ch1) return ch1;
        attempts.push('v1-channels: ok but no data');
      } else {
        attempts.push('v1-channels: ' + r1.status);
      }
    } catch(e) { attempts.push('v1-channels: ' + e.message); }
  }

  // 2. Try official API v1 livestreams endpoint (live status check)
  try {
    var headers3 = { 'Accept': 'application/json' };
    if (token) headers3['Authorization'] = 'Bearer ' + token;
    var r3 = await fetch('https://api.kick.com/public/v1/video/livestreams?channel_name=' + encodeURIComponent(slug), {
      headers: headers3
    });
    if (r3.ok) {
      var d3 = await r3.json();
      if (d3.data && d3.data.length > 0) {
        var ls = d3.data[0];
        return {
          is_live: true,
          livestream: {
            is_live: true,
            session_title: ls.title || ls.session_title || 'Live on Kick',
            viewer_count: ls.viewer_count || ls.viewers || 0,
            categories: ls.categories || [],
            thumbnail: ls.thumbnail || null
          },
          _v1_livestreams: true
        };
      }
      attempts.push('v1-livestreams: ok but empty');
    } else {
      attempts.push('v1-livestreams: ' + r3.status);
    }
  } catch(e) { attempts.push('v1-livestreams: ' + e.message); }

  // 3. Try unofficial v2 API (used by Kick web client — may be geo-blocked)
  try {
    var r2 = await fetch('https://kick.com/api/v2/channels/' + encodeURIComponent(slug), {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    if (r2.ok) {
      var d2 = await r2.json();
      return {
        is_live: !!(d2.livestream && d2.livestream.is_live),
        follower_count: d2.following_count || 0,
        profile_image: d2.user && d2.user.profile_pic,
        livestream: d2.livestream || null,
        _v2: true
      };
    }
    attempts.push('v2-channels: ' + r2.status);
  } catch(e) { attempts.push('v2-channels: ' + e.message); }

  // 4. Try Kick channel page and look for live indicator in HTML
  try {
    var r4 = await fetch('https://kick.com/' + encodeURIComponent(slug), {
      headers: {
        'Accept': 'text/html',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    if (r4.ok) {
      var html = await r4.text();
      // Kick SSR includes JSON state with livestream info
      var stateMatch = html.match(/"is_live"\s*:\s*(true|false)/);
      if (stateMatch && stateMatch[1] === 'true') {
        var titleMatch = html.match(/"session_title"\s*:\s*"([^"]+)"/);
        var viewerMatch = html.match(/"viewer_count"\s*:\s*(\d+)/);
        return {
          is_live: true,
          livestream: {
            is_live: true,
            session_title: titleMatch ? titleMatch[1] : 'Live on Kick',
            viewer_count: viewerMatch ? parseInt(viewerMatch[1], 10) : 0
          },
          _html_scrape: true
        };
      }
      attempts.push('html-scrape: ok but not live');
    } else {
      attempts.push('html-scrape: ' + r4.status);
    }
  } catch(e) { attempts.push('html-scrape: ' + e.message); }

  // Log all attempts for debugging
  if (attempts.length) {
    console.log('[Kick/' + slug + '] all attempts failed:', attempts.join(', '));
  }

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

// ── YouTube live check (two-phase: free RSS pre-filter + paid API confirm) ─────
// PHASE 1: YouTube RSS feeds are FREE (no quota). Check ALL creators via RSS
//   to find who MIGHT be live (RSS includes recent uploads + sometimes live).
// PHASE 2: Only spend API quota on creators that RSS flagged as potentially live.
//   This turns 306 creators × 100 units = disaster into ~5-15 API calls/run.
//
// QUOTA MATH (after optimization):
//   Phase 1: 0 units (RSS is free, unlimited)
//   Phase 2: ~5-15 live candidates × 102 units = ~500-1500 units/run
//   Time gate: every 1h = 24 runs/day × ~1000 units = ~24,000 → still tight
//   Keep 2h gate: 12 runs/day × ~1000 = ~12,000 units (safe with 10K buffer)
//   Smart: DON'T clear existing live data if quota is exceeded — preserve last known state

// Helper: resolve YouTube handle → channel ID (cached in DB column yt_channel_id)
async function resolveYTChannelId(creator) {
  // 1. Check if we already stored the channel ID
  if (creator.yt_channel_id) return creator.yt_channel_id;

  var parsed = extractYoutubeChannelId(creator.youtube_url);
  if (!parsed) return null;

  if (parsed.type === 'id') {
    // Cache it for next time
    try { await sb('PATCH', 'as_creators?id=eq.' + creator.id, { yt_channel_id: parsed.value }); } catch(e) {}
    return parsed.value;
  }

  // Resolve handle → channel ID via API (1 unit)
  var hRes = await fetch('https://www.googleapis.com/youtube/v3/channels?part=id&forHandle=' + encodeURIComponent(parsed.value) + '&key=' + YOUTUBE_API_KEY);
  if (!hRes.ok) return null;
  var hData = await hRes.json();
  if (hData.items && hData.items.length > 0) {
    var cid = hData.items[0].id;
    // Cache for future runs
    try { await sb('PATCH', 'as_creators?id=eq.' + creator.id, { yt_channel_id: cid }); } catch(e) {}
    return cid;
  }
  return null;
}

// Phase 1: Free RSS check for all YouTube creators
async function checkYouTubeRSS(creators) {
  var candidates = [];
  var checked = 0;

  // Process in parallel batches of 20 (RSS is free but we don't want 306 concurrent fetches)
  for (var batch = 0; batch < creators.length; batch += 20) {
    var chunk = creators.slice(batch, batch + 20);
    var promises = chunk.map(async function(creator) {
      var parsed = extractYoutubeChannelId(creator.youtube_url);
      if (!parsed) return null;

      // Build RSS URL — works for both channel IDs and handles
      var rssUrl;
      if (parsed.type === 'id') {
        rssUrl = 'https://www.youtube.com/feeds/videos.xml?channel_id=' + parsed.value;
      } else {
        // For handles, we need channel ID. Try cached first.
        if (creator.yt_channel_id) {
          rssUrl = 'https://www.youtube.com/feeds/videos.xml?channel_id=' + creator.yt_channel_id;
        } else {
          // Skip RSS for un-resolved handles — they'll get resolved in Phase 2 API batch
          return { creator: creator, reason: 'unresolved_handle' };
        }
      }

      try {
        var res = await fetch(rssUrl, { headers: { 'User-Agent': 'AfroStream/1.0' } });
        if (!res.ok) return null;
        var text = await res.text();

        // Check for live indicators in RSS/page
        // YouTube RSS doesn't directly show live status, but we can check the channel page
        // Alternative: check yt:videoId entries published in last 2 hours (likely live)
        var recentMatch = text.match(/<published>([^<]+)<\/published>/);
        if (recentMatch) {
          var pubDate = new Date(recentMatch[1]);
          var ageMs = Date.now() - pubDate.getTime();
          // If most recent video published < 6 hours ago, flag as candidate
          if (ageMs < 6 * 3600 * 1000) {
            return { creator: creator, reason: 'recent_activity' };
          }
        }
        return null;
      } catch(e) {
        return null;
      }
    });

    var results = await Promise.allSettled(promises);
    results.forEach(function(r) {
      if (r.status === 'fulfilled' && r.value) candidates.push(r.value);
    });
    checked += chunk.length;
  }

  return { candidates: candidates, checked: checked };
}

async function checkYouTube(allCreators) {
  var results = { live: 0, errors: [], phase1: 0, phase2: 0 };

  if (!YOUTUBE_API_KEY) {
    results.errors.push('YouTube API key not configured');
    return results;
  }

  // ── QUOTA TIME GATE ────────────────────────────────────────────
  // Only run YouTube checks every 2 hours to stay within 10K units/day.
  var thirtyMinSlot = Math.floor(Date.now() / 1800000);
  if (thirtyMinSlot % 4 !== 0) {
    results.skipped = true;
    results.reason = 'YouTube gated to every 2h (quota preservation)';
    return results;
  }

  var creators = allCreators.filter(function(c) { return c.youtube_url; });
  if (!creators.length) return results;

  // ── PHASE 1: RSS pre-filter (FREE, all creators) ──────────────
  var rssResult = await checkYouTubeRSS(creators);
  results.phase1 = rssResult.checked;
  var candidates = rssResult.candidates;

  // Also include a small rotating batch of unchecked creators to catch missed ones
  var MAX_EXTRA = 6;
  var batchOffset = Math.floor(Date.now() / 7200000) % Math.ceil(creators.length / MAX_EXTRA);
  var extraBatch = creators.slice(batchOffset * MAX_EXTRA, (batchOffset + 1) * MAX_EXTRA);
  // Add extras that aren't already candidates
  var candidateNames = {};
  candidates.forEach(function(c) { candidateNames[c.creator.name] = true; });
  extraBatch.forEach(function(c) {
    if (!candidateNames[c.name]) {
      candidates.push({ creator: c, reason: 'rotating_batch' });
      candidateNames[c.name] = true;
    }
  });

  results.candidates = candidates.length;
  results.totalCreators = creators.length;

  if (!candidates.length) return results;

  // ── QUOTA PROBE ───────────────────────────────────────────────
  var quotaOk = true;
  try {
    var probeRes = await fetch('https://www.googleapis.com/youtube/v3/i18nRegions?part=snippet&key=' + YOUTUBE_API_KEY);
    if (!probeRes.ok) {
      var probeData = await probeRes.json();
      var reason = probeData.error && probeData.error.errors && probeData.error.errors[0] && probeData.error.errors[0].reason;
      if (reason === 'quotaExceeded' || reason === 'dailyLimitExceeded' || probeRes.status === 429) {
        results.errors.push('YouTube quota exceeded — preserving existing live data');
        results.quotaExceeded = true;
        quotaOk = false;
      }
    }
  } catch(e) { /* probe failed, assume ok */ }

  if (!quotaOk) return results;

  // ── PHASE 2: API check only for candidates (PAID, targeted) ───
  // Clear only these candidates' live status
  for (var bn = 0; bn < candidates.length; bn++) {
    await sb('PATCH', 'as_streams?platform=eq.YouTube&is_live=eq.true&creator_name=eq.' + encodeURIComponent(candidates[bn].creator.name), { is_live: false });
  }

  for (var bi = 0; bi < candidates.length; bi++) {
    var creator = candidates[bi].creator;
    results.phase2++;

    try {
      var channelId = await resolveYTChannelId(creator);
      if (!channelId) continue;

      // Search for live streams on this channel (100 units each)
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
    var allCreators = await sb('GET', 'as_creators?is_published=eq.true&select=id,name,country,twitch_url,kick_url,youtube_url,subscribers,yt_channel_id');
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
