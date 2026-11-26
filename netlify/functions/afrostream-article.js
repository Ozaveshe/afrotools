'use strict';
const templates = require('./_shared/afrostream-templates.json');
const U = require('../../tools/afrostream/news-utils');
const PROJECT = 'https://zpclagtgczsygrgztlts.supabase.co';
const PUBLIC_FIELDS = 'id,title,slug,category,image_url,author,excerpt,body,is_featured,published_at,updated_at,source_url,source_name,external_id';
function template(file) {
  if (!templates[file]) throw new Error('Template unavailable');
  return templates[file];
}
function route(event) {
  const qs = event.queryStringParameters || {};
  const paths = [event.path, event.rawUrl].filter(Boolean).map(value => {
    try { return new URL(value, 'https://afrotools.com').pathname.replace(/\/+$/, ''); } catch (_) { return ''; }
  });
  if (paths.some(value => value === '/tools/afrostream' || value.endsWith('/afrostream-article/scene'))) return {view:'scene',slug:''};
  if (paths.some(value => value === '/tools/afrostream/news' || value.endsWith('/afrostream-article/news'))) return {view:'news',slug:''};
  const pretty = paths.map(value => /\/(?:tools\/afrostream\/news|\.netlify\/functions\/afrostream-article\/story)\/([^/]+)$/.exec(value)).find(Boolean);
  return {view:['scene','news'].includes(qs.view) ? qs.view : '',slug:pretty ? pretty[1] : (qs.slug || '')};
}
function json(value) { return JSON.stringify(value).replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029'); }
function head(row) {
  const m = U.articleMetadata(row), e = U.escapeHTML;
  return '<title>' + e(m.title) + '</title>\n<meta name="description" content="' + e(m.description) + '">\n' +
    '<meta name="robots" content="' + e(m.robots) + '"><link rel="canonical" href="' + e(m.canonical) + '">\n' +
    [['og:type',m.type],['og:title',row.title],['og:description',m.description],['og:url',m.canonical],['og:image',m.image],['og:site_name','AfroStream']].map(([key,value]) => '<meta property="' + key + '" content="' + e(value) + '">').join('\n') + '\n' +
    [['twitter:card','summary_large_image'],['twitter:title',row.title],['twitter:description',m.description],['twitter:image',m.image]].map(([key,value]) => '<meta name="' + key + '" content="' + e(value) + '">').join('\n') + '\n' +
    '<script type="application/ld+json" id="as-article-schema">' + json(m.jsonLd) + '</script>';
}
function cover(rows) {
  const lead = rows.find(row => row.is_featured && !U.isNewswire(row)) || rows[0];
  if (!lead) return '<div class="scene-empty"><h2>The scene is taking shape</h2><p>Explore the African creator directory while we prepare the next edition.</p><a href="/tools/afrostream/directory/">Explore creators →</a></div>';
  const side = rows.filter(row => row.id !== lead.id).slice(0,2);
  return U.storyCard(lead, { className: 'as-story-lead', headingLevel: 2, eager: true, location: {hostname:'afrotools.com'} }) +
    '<div class="scene-cover-side">' + side.map(row => U.storyCard(row, { className: 'as-story-side', excerpt: false, location: {hostname:'afrotools.com'} })).join('') +
    '<div class="scene-note"><strong>Good stories. Clear receipts.</strong>Newswire briefs link to their publishers. Our reports add context. <a href="/tools/afrostream/editorial/">How we cover the scene →</a></div></div>';
}
function articlePage(row) {
  return template('article.html')
    .replace(/<!-- AS_ARTICLE_META_START -->[\s\S]*?<!-- AS_ARTICLE_META_END -->/, () => head(row))
    .replace(/<!-- AS_ARTICLE_BODY_START -->[\s\S]*?<!-- AS_ARTICLE_BODY_END -->/, () => U.articleHTML(row))
    .replace('</body>', () => '<script type="application/json" id="as-article-bootstrap">' + json(row) + '</script></body>');
}
function collectionPage(rows, count, view) {
  let html = template(view === 'scene' ? 'index.html' : 'news.html');
  html = html.replace(/<!-- AS_SCENE_COVER_START -->[\s\S]*?<!-- AS_SCENE_COVER_END -->/, () => cover(rows));
  if (view === 'news') {
    html = html.replace(/(<section[^>]*id="heroGrid"[^>]*>)[\s\S]*?<\/section>/, (_, opening) => opening + cover(rows) + '</section>');
    const lead = rows.find(row => row.is_featured && !U.isNewswire(row)) || rows[0];
    const remaining = rows.filter(row => !lead || row.id !== lead.id).slice(2,11);
    html = html.replace(/(<section[^>]*id="newsGrid"[^>]*>)[\s\S]*?<\/section>/, (_, opening) => opening + remaining.map(row => U.storyCard(row, { location: {hostname:'afrotools.com'} })).join('') + '</section>');
    html = html.replace('</body>', () => '<script type="application/json" id="as-news-bootstrap">' + json({data:rows,count}) + '</script></body>');
  }
  return html;
}
function response(statusCode, body, robots) {
  return { statusCode, headers: {
    'Content-Type': 'text/html; charset=utf-8', 'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin', 'X-Frame-Options': 'DENY',
    'Cache-Control': statusCode === 200 ? 'public,max-age=60' : 'no-store',
    'Netlify-CDN-Cache-Control': statusCode === 200 ? 'public,max-age=120,stale-while-revalidate=300' : 'no-store',
    ...(robots ? {'X-Robots-Tag':robots} : {})
  }, body };
}
function unavailableCollection(view, method) {
  const news = view === 'news';
  const path = news ? '/tools/afrostream/news' : '/tools/afrostream/';
  const title = news ? 'AfroStream news' : 'AfroStream creator hub';
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title} | AfroTools</title><link rel="canonical" href="https://afrotools.com${path}">
<link rel="stylesheet" href="/tools/afrostream/editorial.css">
<style>body{margin:0;font-family:system-ui,sans-serif}.as-section-list{list-style:none;padding:0;margin:1rem 0}.as-section-list li+li{border-top:1px solid var(--scene-line,#ddd)}.as-section-list a{display:block;padding:.8rem 0;font-weight:700}.as-section-list small{display:block;font-weight:400;color:var(--scene-muted,#475569)}</style>
</head><body class="as-page as-editorial"><main class="scene-wrap scene-article">
<p><a class="scene-link" href="/">AfroTools</a> / AfroStream</p>
<section class="scene-empty"><h1>${title}</h1>
<p>News stories are temporarily unavailable. You can still explore these AfroStream sections.</p>
<nav aria-label="Available AfroStream sections"><ul class="as-section-list">
<li><a href="/tools/afrostream/directory/">Creator directory<small>Browse African creators by country and platform.</small></a></li>
<li><a href="/tools/afrostream/university/">Creator University<small>Explore guides for running and growing a creator business.</small></a></li>
<li><a href="/tools/afrostream/editorial/">Editorial policy<small>See how AfroStream sources stories and handles corrections.</small></a></li>
<li><a href="/tools/afrostream/methodology/">Ranking methodology<small>Read how creator rankings are calculated.</small></a></li>
</ul></nav>${news ? '<p><a class="scene-link" href="/tools/afrostream/news">Retry the news feed</a></p>' : ''}
</section></main></body></html>`;
  const result = response(news ? 503 : 200, method === 'HEAD' ? '' : html);
  result.headers['Cache-Control'] = 'no-store';
  result.headers['Netlify-CDN-Cache-Control'] = 'no-store';
  if (news) result.headers['Retry-After'] = '60';
  return result;
}
function unavailable(view, method) {
  if (view) return unavailableCollection(view, method);
  const result = response(503, method === 'HEAD' ? '' : errorPage(503), 'noindex,follow');
  result.headers['Retry-After'] = '60';
  return result;
}
function errorPage(statusCode) {
  const title = statusCode === 404 ? 'Story not found' : 'This story is temporarily unavailable';
  const body = '<div class="scene-empty"><h1>' + title + '</h1><p>' + (statusCode === 404 ? 'This story may have been removed or its link changed.' : 'Please try again shortly.') + '</p><a href="/tools/afrostream/news">Back to the scene →</a></div>';
  return template('article.html')
    .replace(/<!-- AS_ARTICLE_META_START -->[\s\S]*?<!-- AS_ARTICLE_META_END -->/, () => '<title>' + title + ' | AfroStream</title><meta name="robots" content="noindex,follow">')
    .replace(/<!-- AS_ARTICLE_BODY_START -->[\s\S]*?<!-- AS_ARTICLE_BODY_END -->/, () => body)
    .replace(/<script src="\/tools\/afrostream\/article\.js(?:\?[^"]*)?" defer><\/script>/, '');
}
exports.handler = async function (event) {
  if (!['GET','HEAD'].includes(event.httpMethod)) return {statusCode:405,headers:{Allow:'GET, HEAD'},body:''};
  const {view,slug} = route(event);
  if (!view && !/^[a-z0-9][a-z0-9-]{0,220}$/.test(slug)) return response(404,event.httpMethod === 'HEAD' ? '' : errorPage(404),'noindex,follow');
  const key = process.env.SUPABASE_DATA_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) return unavailable(view, event.httpMethod);
  try {
    let query = PROJECT + '/rest/v1/as_news?select=' + PUBLIC_FIELDS + '&is_published=eq.true&published_at=lte.' + encodeURIComponent(new Date().toISOString());
    query += view ? '&order=published_at.desc&limit=50' : '&slug=eq.' + encodeURIComponent(slug) + '&limit=1';
    const result = await fetch(query, { signal:AbortSignal.timeout(7000),headers:{apikey:key,Authorization:'Bearer '+key,Prefer:'count=exact'} });
    if (!result.ok) throw new Error('News unavailable');
    const rows = await result.json();
    if (!Array.isArray(rows)) throw new Error('Invalid news response');
    if (!view && !rows[0]) return response(404,event.httpMethod === 'HEAD' ? '' : errorPage(404),'noindex,follow');
    const count = Number((result.headers.get('content-range') || '').split('/')[1]) || rows.length;
    const html = view ? collectionPage(rows,count,view) : articlePage(rows[0]);
    const resultResponse = response(200,event.httpMethod === 'HEAD' ? '' : html,view ? '' : U.articleMetadata(rows[0]).robots);
    return resultResponse;
  } catch (_) { return unavailable(view, event.httpMethod); }
};
exports.__test = { head, json, articlePage, collectionPage, cover, route };
