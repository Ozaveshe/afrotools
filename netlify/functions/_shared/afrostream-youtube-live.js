'use strict';

// Read the selected video's player response. Recommendation cards can contain
// LIVE badges, and isLiveContent also describes recordings of ended broadcasts.
function selectedPlayer(html) {
  var text = String(html || '');
  var marker = /(?:var\s+)?ytInitialPlayerResponse\s*=\s*|["']ytInitialPlayerResponse["']\s*:\s*/g;
  var hit;
  while ((hit = marker.exec(text))) {
    var start = text.indexOf('{', marker.lastIndex);
    if (start < 0 || start - marker.lastIndex > 8) continue;
    var depth = 0, inString = false, escaped = false;
    for (var i = start; i < text.length; i++) {
      var char = text[i];
      if (inString) {
        if (escaped) escaped = false;
        else if (char === '\\') escaped = true;
        else if (char === '"') inString = false;
      } else if (char === '"') inString = true;
      else if (char === '{') depth++;
      else if (char === '}' && --depth === 0) {
        try { return JSON.parse(text.slice(start, i + 1)); } catch (_) { break; }
      }
    }
  }
  return null;
}

function liveState(html) {
  var player = selectedPlayer(html);
  if (!player || !player.videoDetails) return { checked: false, is_live: false };
  var details = player.microformat && player.microformat.playerMicroformatRenderer;
  var broadcast = details && details.liveBroadcastDetails;
  return {
    checked: true,
    is_live: !!(broadcast && broadcast.isLiveNow === true && !broadcast.endTimestamp &&
      player.playabilityStatus && player.playabilityStatus.status === 'OK'),
    video_id: player.videoDetails.videoId || '',
    title: player.videoDetails.title || '',
    thumbnails: player.videoDetails.thumbnail && player.videoDetails.thumbnail.thumbnails || [],
    broadcast: broadcast || null
  };
}

module.exports = { selectedPlayer: selectedPlayer, liveState: liveState };
