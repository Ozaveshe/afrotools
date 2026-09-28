'use strict';
const U = require('../../tools/afrostream/news-utils');
const ORIGIN = 'https://afrotools.com';
const PROJECT = 'https://zpclagtgczsygrgztlts.supabase.co';
function xml(value) { return U.escapeHTML(value).replace(/&#39;/g,'&apos;'); }
function rss(rows) {
  const valid = rows.filter(row => row.slug && row.title && Number.isFinite(Date.parse(row.published_at)) && Date.parse(row.published_at) <= Date.now()).slice(0,30);
  const items = valid.map(row => {
    const item = U.story(row), url = U.canonicalUrl(row.slug), image = U.imageHref(row);
    return '<item><title>' + xml(row.title) + '</title><link>' + xml(url) + '</link><guid isPermaLink="true">' + xml(url) + '</guid>' +
      '<description>' + xml(item.excerpt + ' [' + item.kind + '; source: ' + item.source + ']') + '</description><category>' + xml(U.categoryLabel(row.category)) + '</category><category>' + xml(item.kind) + '</category>' +
      '<pubDate>' + new Date(row.published_at).toUTCString() + '</pubDate>' +
      (U.safeHttpUrl(row.source_url) ? '<dc:source>' + xml(row.source_url) + '</dc:source>' : '') +
      '<dc:creator>' + xml(U.isNewswire(row) ? item.source : (row.author || 'AfroStream editorial')) + '</dc:creator>' +
      (image ? '<media:content url="' + xml(image.startsWith('/') ? ORIGIN + image : image) + '" medium="image"/>' : '') + '</item>';
  }).join('\n');
  return '<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:media="http://search.yahoo.com/mrss/"><channel>' +
    '<title>AfroStream: The Scene</title><link>' + ORIGIN + '/tools/afrostream/news</link><description>African creator news, music, gaming and streaming culture. Original reports and attributed newswire briefs.</description><language>en</language>' +
    (valid[0] ? '<lastBuildDate>' + new Date(valid[0].published_at).toUTCString() + '</lastBuildDate>' : '') +
    '<atom:link href="' + ORIGIN + '/tools/afrostream/feed.xml" rel="self" type="application/rss+xml"/>' + items + '</channel></rss>';
}
function sitemap(rows) {
  return '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' + rows.filter(U.isIndexable).map(row => {
    const modified = U.articleMetadata(row).jsonLd.dateModified;
    return '<url><loc>' + xml(U.canonicalUrl(row.slug)) + '</loc><lastmod>' + new Date(modified).toISOString() + '</lastmod></url>';
  }).join('\n') + '</urlset>';
}
exports.handler = async function (event) {
  if (!['GET','HEAD'].includes(event.httpMethod)) return {statusCode:405,headers:{Allow:'GET, HEAD'},body:''};
  const format = event.queryStringParameters?.format === 'sitemap' ? 'sitemap' : 'rss';
  const key = process.env.SUPABASE_DATA_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) return {statusCode:503,body:'Feed temporarily unavailable'};
  try {
    const fields = 'id,title,slug,category,image_url,author,excerpt,published_at,updated_at,source_url,source_name,external_id' + (format === 'sitemap' ? ',body' : '');
    const query = PROJECT + '/rest/v1/as_news?select=' + fields + '&is_published=eq.true&published_at=lte.' + encodeURIComponent(new Date().toISOString()) + '&order=published_at.desc&limit=' + (format === 'sitemap' ? '1000&or=(author.ilike.AfroStream*,author.ilike.AfroTools*)' : '30');
    const result = await fetch(query,{signal:AbortSignal.timeout(7000),headers:{apikey:key,Authorization:'Bearer '+key}});
    if (!result.ok) throw new Error('Feed unavailable');
    const rows = await result.json();
    if (!Array.isArray(rows)) throw new Error('Invalid feed');
    return {statusCode:200,headers:{'Content-Type':format === 'sitemap' ? 'application/xml; charset=utf-8' : 'application/rss+xml; charset=utf-8','Cache-Control':'public,max-age=600','X-Content-Type-Options':'nosniff'},body:event.httpMethod === 'HEAD' ? '' : (format === 'sitemap' ? sitemap(rows) : rss(rows))};
  } catch (_) { return {statusCode:503,headers:{'Content-Type':'text/plain; charset=utf-8','Cache-Control':'no-store'},body:'Feed temporarily unavailable'}; }
};
exports.__test = {rss,sitemap};
