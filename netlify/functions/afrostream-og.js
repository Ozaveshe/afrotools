// netlify/functions/afrostream-og.js
// Dynamic SVG-based OG image for creator profiles
// Usage: /api/afrostream/og?name=CarterEfe&subs=560K&country=Nigeria&category=Gaming
exports.handler = async function(event) {
  var qs = event.queryStringParameters || {};
  var name = qs.name || 'Creator';
  var subs = qs.subs || '0';
  var country = qs.country || 'Africa';
  var category = qs.category || 'Creator';

  // Generate initials
  var initials = name.split(/\s+/).map(function(w){ return w.charAt(0).toUpperCase(); }).join('').slice(0,2);

  // Hash name to get a hue for the avatar gradient
  var h = 0;
  for (var i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  var hue = Math.abs(h) % 360;

  var svg = '<?xml version="1.0" encoding="UTF-8"?>' +
    '<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">' +
    '<defs>' +
      '<linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">' +
        '<stop offset="0%" stop-color="#001233"/>' +
        '<stop offset="100%" stop-color="#001845"/>' +
      '</linearGradient>' +
      '<linearGradient id="brand" x1="0" y1="0" x2="1" y2="0">' +
        '<stop offset="0%" stop-color="#007AFF"/>' +
        '<stop offset="100%" stop-color="#34AAFF"/>' +
      '</linearGradient>' +
      '<linearGradient id="avatar" x1="0" y1="0" x2="1" y2="1">' +
        '<stop offset="0%" stop-color="hsl(' + hue + ',80%,60%)"/>' +
        '<stop offset="100%" stop-color="hsl(' + ((hue+60)%360) + ',70%,50%)"/>' +
      '</linearGradient>' +
    '</defs>' +
    '<rect width="1200" height="630" fill="url(#bg)"/>' +
    // Subtle grid pattern
    '<rect x="0" y="0" width="1200" height="630" fill="none" stroke="rgba(255,255,255,0.03)" stroke-width="1">' +
      '<animate attributeName="opacity" values="0.5;1;0.5" dur="4s" repeatCount="indefinite"/>' +
    '</rect>' +
    // Avatar circle
    '<circle cx="200" cy="280" r="90" fill="url(#avatar)"/>' +
    '<text x="200" y="300" text-anchor="middle" font-family="Arial,sans-serif" font-size="56" font-weight="bold" fill="white">' + initials + '</text>' +
    // Creator name
    '<text x="340" y="250" font-family="Arial,sans-serif" font-size="52" font-weight="bold" fill="white">' + escapeXml(name) + '</text>' +
    // Category + Country
    '<text x="340" y="300" font-family="Arial,sans-serif" font-size="24" fill="rgba(255,255,255,0.6)">' + escapeXml(category) + ' · ' + escapeXml(country) + '</text>' +
    // Subscribers
    '<text x="340" y="360" font-family="Arial,sans-serif" font-size="36" font-weight="bold" fill="url(#brand)">' + escapeXml(subs) + ' followers</text>' +
    // AfroStream branding
    '<text x="60" y="580" font-family="Arial,sans-serif" font-size="22" fill="rgba(255,255,255,0.4)">&#9655; AfroStream by AfroTools</text>' +
    // Brand line
    '<rect x="0" y="610" width="1200" height="20" fill="url(#brand)" opacity="0.8"/>' +
    '</svg>';

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=86400'
    },
    body: svg
  };
};

function escapeXml(s) {
  return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
