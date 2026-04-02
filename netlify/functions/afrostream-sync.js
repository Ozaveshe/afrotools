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

function isAuthorized(event) {
  if (!ADMIN_SECRET) return false;
  var auth = (event.headers && (event.headers.authorization || event.headers.Authorization)) || '';
  return auth === 'Bearer ' + ADMIN_SECRET;
}

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

// ── Kick API ─────────────────────────────────────────────────────

async function getKickToken() {
  // Try with the secret as-is first, then strip 0x prefix if it fails
  var secrets = [KICK_CLIENT_SECRET];
  if (KICK_CLIENT_SECRET && KICK_CLIENT_SECRET.startsWith('0x')) {
    secrets.push(KICK_CLIENT_SECRET.slice(2));
  }
  for (var s = 0; s < secrets.length; s++) {
    var res = await fetch('https://id.kick.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: 'grant_type=client_credentials' +
            '&client_id=' + encodeURIComponent(KICK_CLIENT_ID) +
            '&client_secret=' + encodeURIComponent(secrets[s])
    });
    if (res.ok) {
      var data = await res.json();
      return data.access_token;
    }
  }
  throw new Error('Kick auth failed with all secret variants');
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
  // Set all Kick streams to not live first
  await sb('PATCH', 'as_streams?platform=eq.Kick&is_live=eq.true', { is_live: false });

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

      // Only update if Kick followers > current (don't downgrade cross-platform)
      if (kickFollowers > 0 && (!creator.subscribers || kickFollowers > creator.subscribers)) {
        updates.subscribers = kickFollowers;
      }

      // Update avatar if available and no existing avatar
      var kickAvatar = channelData.profile_image || channelData.profile_pic || channelData.avatar;
      if (kickAvatar && (!creator.avatar || creator.avatar.includes('ui-avatars.com'))) {
        updates.avatar = kickAvatar;
      }

      await sb('PATCH', 'as_creators?id=eq.' + creator.id, updates);
      results.creators_synced++;

      // Check if live
      var isLive = channelData.is_live || (channelData.livestream && channelData.livestream.is_live);
      if (isLive) {
        var streamTitle = (channelData.livestream && channelData.livestream.session_title) || channelData.stream_title || 'Live on Kick';
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

        var existing = await sb('GET', 'as_streams?creator_name=eq.' + encodeURIComponent(creator.name) + '&platform=eq.Kick&limit=1&order=stream_date.desc');
        if (Array.isArray(existing) && existing.length > 0) {
          await sb('PATCH', 'as_streams?id=eq.' + existing[0].id, streamData);
        } else {
          await sb('POST', 'as_streams', streamData);
        }
        results.live_count++;
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
  var creators = await sb('GET', 'as_creators?youtube_url=not.is.null&youtube_url=not.eq.&select=id,name,slug,youtube_url,subscribers,total_views,avatar,country&is_published=eq.true');
  if (!Array.isArray(creators) || creators.length === 0) {
    results.errors.push('No creators with YouTube URLs found');
    return results;
  }

  // Rotate through creators in batches to stay within YouTube quota (10K/day).
  // Handle resolution: ~1 unit each. Channel stats: 1 unit per 50. Live search: 100 each.
  // Budget per sync run (~12 runs/day): ~800 units → resolve 50 handles + stats + 0 live checks.
  // Live checking is handled by afrostream-livecheck.js separately.
  var MAX_RESOLVE = 50;
  var syncBatch = Math.floor(Date.now() / 7200000) % Math.ceil(creators.length / MAX_RESOLVE);
  var batchCreators = creators.slice(syncBatch * MAX_RESOLVE, (syncBatch + 1) * MAX_RESOLVE);
  results.batch = syncBatch + 1;
  results.batchSize = batchCreators.length;
  results.totalCreators = creators.length;

  // Resolve channel IDs
  var channelMap = {}; // channelId -> creator
  var channelIds = [];

  for (var i = 0; i < batchCreators.length; i++) {
    var parsed = extractYoutubeId(batchCreators[i].youtube_url);
    if (!parsed) { results.errors.push('Bad YouTube URL: ' + batchCreators[i].youtube_url); continue; }

    if (parsed.type === 'id') {
      channelMap[parsed.value] = batchCreators[i];
      channelIds.push(parsed.value);
    } else {
      try {
        var searchData = await ytGet('channels?part=id&forHandle=' + encodeURIComponent(parsed.value));
        if (searchData.items && searchData.items.length > 0) {
          var cid = searchData.items[0].id;
          channelMap[cid] = batchCreators[i];
          channelIds.push(cid);
        } else {
          var searchRes = await ytGet('search?part=snippet&type=channel&q=' + encodeURIComponent(parsed.value) + '&maxResults=1');
          if (searchRes.items && searchRes.items.length > 0) {
            var cid2 = searchRes.items[0].snippet.channelId;
            channelMap[cid2] = batchCreators[i];
            channelIds.push(cid2);
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

          // Update subscribers — always use fresh API data
          if (ytSubs > 0) {
            updates.subscribers = ytSubs;
          }

          // Update total views — always use fresh API data
          if (ytViews > 0) {
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

    // Only update subscribers if Twitch followers > current (don't downgrade cross-platform)
    if (twitchFollowers > 0 && (!creator.subscribers || twitchFollowers > creator.subscribers)) {
      updates.subscribers = twitchFollowers;
    }

    // Always update avatar from Twitch if available
    if (twitchUser.profile_image_url) {
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

// ── Handler ──────────────────────────────────────────────────────

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
  var isScheduled = event.httpMethod === 'GET' && event.headers['x-nf-event'] === 'schedule';

  // Manual trigger requires auth
  if (!isScheduled && !isAuthorized(event)) {
    return {
      statusCode: 401,
      headers: cors,
      body: JSON.stringify({ success: false, error: 'Unauthorized' })
    };
  }

  try {
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

    return {
      statusCode: 200,
      headers: cors,
      body: JSON.stringify({
        success: true,
        message: 'Sync completed',
        data: {
          twitch: twitchResults,
          kick: kickResults,
          youtube: youtubeResults
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
