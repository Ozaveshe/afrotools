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
  for (var s = 0; s < secrets.length; s++) {
    var res = await fetch('https://id.kick.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: 'grant_type=client_credentials' +
            '&client_id=' + KICK_CLIENT_ID +
            '&client_secret=' + secrets[s]
    });
    if (res.ok) {
      var data = await res.json();
      return data.access_token;
    }
  }
  throw new Error('Kick auth failed with all secret variants');
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

          await upsertStream(creator.name, {
            creator_name: creator.name,
            title: stream.title || 'Live on Twitch',
            platform: 'Twitch',
            category: stream.game_name || '',
            country: creator.country || '',
            stream_date: new Date().toISOString(),
            url: 'https://twitch.tv/' + stream.user_login,
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

// ── Kick live check ───────────────────────────────────────────────
async function checkKick(allCreators) {
  var results = { live: 0, errors: [] };

  if (!KICK_CLIENT_ID || !KICK_CLIENT_SECRET) {
    results.errors.push('Kick credentials not configured');
    return results;
  }

  var creators = allCreators.filter(function(c) { return c.kick_url; });
  if (!creators.length) return results;

  var token;
  try {
    token = await getKickToken();
  } catch (e) {
    results.errors.push('Kick auth: ' + e.message);
    return results;
  }

  // Clear all Kick live streams first
  await sb('PATCH', 'as_streams?platform=eq.Kick&is_live=eq.true', { is_live: false });

  for (var i = 0; i < creators.length; i++) {
    var creator = creators[i];
    var slug = extractKickSlug(creator.kick_url);
    if (!slug) continue;

    try {
      var res = await fetch('https://api.kick.com/public/v1/channels?slug=' + encodeURIComponent(slug), {
        headers: { 'Authorization': 'Bearer ' + token }
      });
      if (!res.ok) continue;

      var data = await res.json();
      var ch = data.data && data.data[0] ? data.data[0] : data.data || data;

      var isLive = ch.is_live || (ch.livestream && ch.livestream.is_live);
      if (isLive) {
        var title = (ch.livestream && ch.livestream.session_title) || ch.stream_title || 'Live on Kick';
        var viewers = (ch.livestream && ch.livestream.viewer_count) || ch.viewer_count || 0;
        var category = (ch.livestream && ch.livestream.categories && ch.livestream.categories[0] && ch.livestream.categories[0].name) || '';

        await upsertStream(creator.name, {
          creator_name: creator.name,
          title: title,
          platform: 'Kick',
          category: category,
          country: creator.country || '',
          stream_date: new Date().toISOString(),
          url: 'https://kick.com/' + slug,
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

// ── YouTube live check ────────────────────────────────────────────
async function checkYouTube(allCreators) {
  var results = { live: 0, errors: [] };

  if (!YOUTUBE_API_KEY) {
    results.errors.push('YouTube API key not configured');
    return results;
  }

  var creators = allCreators.filter(function(c) { return c.youtube_url; });
  if (!creators.length) return results;

  // Clear all YouTube live streams first
  await sb('PATCH', 'as_streams?platform=eq.YouTube&is_live=eq.true', { is_live: false });

  // Resolve channel IDs
  var channelMap = {};
  var channelIds = [];

  for (var i = 0; i < creators.length; i++) {
    var parsed = extractYoutubeChannelId(creators[i].youtube_url);
    if (!parsed) continue;

    if (parsed.type === 'id') {
      channelMap[parsed.value] = creators[i];
      channelIds.push(parsed.value);
    } else {
      // Resolve handle to channel ID
      try {
        var hRes = await fetch('https://www.googleapis.com/youtube/v3/channels?part=id&forHandle=' + encodeURIComponent(parsed.value) + '&key=' + YOUTUBE_API_KEY);
        if (hRes.ok) {
          var hData = await hRes.json();
          if (hData.items && hData.items.length > 0) {
            channelMap[hData.items[0].id] = creators[i];
            channelIds.push(hData.items[0].id);
          }
        }
      } catch (e) {
        results.errors.push('YT resolve/' + parsed.value + ': ' + e.message);
      }
    }
  }

  if (!channelIds.length) return results;

  // Check each channel for live streams (search API, 1 call per channel)
  for (var li = 0; li < channelIds.length; li++) {
    var cId = channelIds[li];
    var creator = channelMap[cId];
    if (!creator) continue;

    try {
      var liveRes = await fetch('https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=' + cId + '&type=video&eventType=live&maxResults=1&key=' + YOUTUBE_API_KEY);
      if (!liveRes.ok) continue;

      var liveData = await liveRes.json();
      if (liveData.items && liveData.items.length > 0) {
        var liveItem = liveData.items[0];
        var videoId = liveItem.id.videoId;

        // Fetch viewer count from video details
        var viewers = 0;
        try {
          var vidRes = await fetch('https://www.googleapis.com/youtube/v3/videos?part=liveStreamingDetails&id=' + videoId + '&key=' + YOUTUBE_API_KEY);
          if (vidRes.ok) {
            var vidData = await vidRes.json();
            if (vidData.items && vidData.items[0] && vidData.items[0].liveStreamingDetails) {
              viewers = parseInt(vidData.items[0].liveStreamingDetails.concurrentViewers, 10) || 0;
            }
          }
        } catch (e) { /* viewer count is non-critical */ }

        await upsertStream(creator.name, {
          creator_name: creator.name,
          title: liveItem.snippet.title || 'Live on YouTube',
          platform: 'YouTube',
          category: '',
          country: creator.country || '',
          stream_date: new Date().toISOString(),
          url: 'https://youtube.com/watch?v=' + videoId,
          viewer_count: viewers,
          is_live: true,
          is_published: true
        });
        results.live++;
      }
    } catch (e) {
      results.errors.push('YT live/' + creator.name + ': ' + e.message);
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
