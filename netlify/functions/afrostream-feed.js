// netlify/functions/afrostream-feed.js
// RSS 2.0 feed for AfroStream news articles
var SUPABASE_URL = 'https://zpclagtgczsygrgztlts.supabase.co';
var SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_DATA_SERVICE_ROLE_KEY;

function escapeXml(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

exports.handler = async function(event) {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: { 'Access-Control-Allow-Origin': '*' }, body: '' };
  }

  try {
    var res = await fetch(SUPABASE_URL + '/rest/v1/as_news?is_published=eq.true&order=published_at.desc&limit=30', {
      headers: { apikey: SUPABASE_KEY, Authorization: 'Bearer ' + SUPABASE_KEY }
    });
    var articles = await res.json();

    var items = '';
    (articles || []).forEach(function(a) {
      var pubDate = new Date(a.published_at).toUTCString();
      var link = 'https://afrotools.com/tools/afrostream/news.html#' + (a.slug || '');
      items += '    <item>\n' +
        '      <title>' + escapeXml(a.title) + '</title>\n' +
        '      <link>' + link + '</link>\n' +
        '      <description>' + escapeXml(a.excerpt || '') + '</description>\n' +
        '      <category>' + escapeXml(a.category || 'News') + '</category>\n' +
        '      <pubDate>' + pubDate + '</pubDate>\n' +
        '      <guid isPermaLink="true">' + link + '</guid>\n' +
        '    </item>\n';
    });

    var xml = '<?xml version="1.0" encoding="UTF-8"?>\n' +
      '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">\n' +
      '  <channel>\n' +
      '    <title>AfroStream — African Creator News</title>\n' +
      '    <link>https://afrotools.com/tools/afrostream/news.html</link>\n' +
      '    <description>Latest news from Africa\'s streaming and creator economy. Milestones, platform updates, collaborations, and rising stars.</description>\n' +
      '    <language>en</language>\n' +
      '    <lastBuildDate>' + new Date().toUTCString() + '</lastBuildDate>\n' +
      '    <atom:link href="https://afrotools.com/tools/afrostream/feed.xml" rel="self" type="application/rss+xml"/>\n' +
      items +
      '  </channel>\n' +
      '</rss>';

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/rss+xml; charset=utf-8',
        'Cache-Control': 'public, max-age=1800'
      },
      body: xml
    };
  } catch (e) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'text/plain' },
      body: 'RSS feed error: ' + e.message
    };
  }
};
