// netlify/functions/afrostream-livecheck.js
// AfroStream — Lightweight live status check (runs every 30 min)
// Only checks Twitch + Kick live status — no subscriber/avatar updates
// Keeps Live Now section fresh without burning API quotas

var SUPABASE_URL = 'https://zpclagtgczsygrgztlts.supabase.co';
var SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_DATA_SERVICE_ROLE_KEY;
var TWITCH_CLIENT_ID = process.env.TWITCH_CLIENT_ID;
var TWITCH_CLIENT_SECRET = process.env.TWITCH_CLIENT_SECRET;

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

function extractTwitchUsername(url) {
  if (!url) return null;
  var match = url.match(/twitch\.tv\/([a-zA-Z0-9_]+)/i);
  return match ? match[1].toLowerCase() : null;
}

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

exports.handler = async function(event) {
  var results = { twitch_live: 0, streams_cleared: 0, errors: [], duration_ms: 0 };
  var start = Date.now();

  try {
    if (!TWITCH_CLIENT_ID || !TWITCH_CLIENT_SECRET) {
      results.errors.push('Twitch credentials not configured');
      results.duration_ms = Date.now() - start;
      return { statusCode: 200, body: JSON.stringify({ success: true, data: results }) };
    }

    // 1. Get all creators with twitch_url
    var creators = await sb('GET', 'as_creators?twitch_url=not.is.null&twitch_url=not.eq.&select=id,name,twitch_url&is_published=eq.true');
    if (!Array.isArray(creators) || creators.length === 0) {
      results.duration_ms = Date.now() - start;
      return { statusCode: 200, body: JSON.stringify({ success: true, data: results }) };
    }

    // 2. Extract usernames
    var usernameMap = {};
    var usernames = [];
    for (var i = 0; i < creators.length; i++) {
      var username = extractTwitchUsername(creators[i].twitch_url);
      if (username) {
        usernameMap[username] = creators[i];
        usernames.push(username);
      }
    }

    if (usernames.length === 0) {
      results.duration_ms = Date.now() - start;
      return { statusCode: 200, body: JSON.stringify({ success: true, data: results }) };
    }

    // 3. Get Twitch token
    var token = await getTwitchToken();

    // 4. Clear all Twitch live streams first
    await sb('PATCH', 'as_streams?platform=eq.Twitch&is_live=eq.true', { is_live: false });
    results.streams_cleared++;

    // 5. Batch check live status (single API call for up to 100 users)
    var liveQuery = usernames.map(function(u) { return 'user_login=' + u; }).join('&');
    var streamsRes = await fetch('https://api.twitch.tv/helix/' + 'streams?' + liveQuery, {
      headers: { 'Client-ID': TWITCH_CLIENT_ID, 'Authorization': 'Bearer ' + token }
    });

    if (streamsRes.ok) {
      var streamsData = await streamsRes.json();
      if (streamsData.data) {
        for (var j = 0; j < streamsData.data.length; j++) {
          var stream = streamsData.data[j];
          var creator = usernameMap[stream.user_login.toLowerCase()];
          if (!creator) continue;

          var streamData = {
            creator_name: creator.name,
            title: stream.title || 'Live on Twitch',
            platform: 'Twitch',
            category: stream.game_name || '',
            country: '',
            stream_date: new Date().toISOString(),
            url: 'https://twitch.tv/' + stream.user_login,
            is_live: true,
            is_published: true
          };

          // Upsert — update existing or create new
          var existing = await sb('GET', 'as_streams?creator_name=eq.' + encodeURIComponent(creator.name) + '&platform=eq.Twitch&limit=1&order=stream_date.desc');
          if (Array.isArray(existing) && existing.length > 0) {
            await sb('PATCH', 'as_streams?id=eq.' + existing[0].id, streamData);
          } else {
            await sb('POST', 'as_streams', streamData);
          }
          results.twitch_live++;
        }
      }
    }

    results.duration_ms = Date.now() - start;
    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, message: 'Live check done', data: results })
    };
  } catch (e) {
    results.errors.push(e.message);
    results.duration_ms = Date.now() - start;
    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, data: results })
    };
  }
};
