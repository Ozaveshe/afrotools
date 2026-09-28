'use strict';
const fs = require('node:fs');
const path = require('node:path');
const U = require('../../tools/afrostream/news-utils');
const PROJECT = 'https://zpclagtgczsygrgztlts.supabase.co';
const PUBLIC_FIELDS = 'id,title,slug,category,image_url,author,excerpt,body,is_featured,published_at,updated_at,source_url,source_name,external_id';
const templates = new Map();
function template(file) {
  if (!templates.has(file)) {
    const candidates = [path.join(process.cwd(), 'tools/afrostream', file), path.resolve(__dirname, '../../tools/afrostream', file)];
    const found = candidates.find(name => fs.existsSync(name));
    if (!found) throw new Error('Template unavailable');
    templates.set(file, fs.readFileSync(found, 'utf8'));
  }
  return templates.get(file);
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
function errorPage(statusCode) {
  const title = statusCode === 404 ? 'Story not found' : 'This story is temporarily unavailable';
  const body = '<div class="scene-empty"><h1>' + title + '</h1><p>' + (statusCode === 404 ? 'This story may have been removed or its link changed.' : 'Please try again shortly.') + '</p><a href="/tools/afrostream/news">Back to the scene →</a></div>';
  return template('article.html')
    .replace(/<!-- AS_ARTICLE_META_START -->[\s\S]*?<!-- AS_ARTICLE_META_END -->/, () => '<title>' + title + ' | AfroStream</title><meta name="robots" content="noindex,follow">')
    .replace(/<!-- AS_ARTICLE_BODY_START -->[\s\S]*?<!-- AS_ARTICLE_BODY_END -->/, () => body)
    .replace('<script src="/tools/afrostream/article.js" defer></script>', '');
}
exports.handler = async function (event) {
  if (!['GET','HEAD'].includes(event.httpMethod)) return {statusCode:405,headers:{Allow:'GET, HEAD'},body:''};
  const qs = event.queryStringParameters || {}, view = ['scene','news'].includes(qs.view) ? qs.view : '';
  const slug = qs.slug || '';
  if (!view && !/^[a-z0-9][a-z0-9-]{0,220}$/.test(slug)) return response(404,errorPage(404),'noindex,follow');
  const key = process.env.SUPABASE_DATA_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) return response(503,errorPage(503),'noindex,follow');
  try {
    let query = PROJECT + '/rest/v1/as_news?select=' + PUBLIC_FIELDS + '&is_published=eq.true&published_at=lte.' + encodeURIComponent(new Date().toISOString());
    query += view ? '&order=published_at.desc&limit=50' : '&slug=eq.' + encodeURIComponent(slug) + '&limit=1';
    const result = await fetch(query, { signal:AbortSignal.timeout(7000),headers:{apikey:key,Authorization:'Bearer '+key,Prefer:'count=exact'} });
    if (!result.ok) throw new Error('News unavailable');
    const rows = await result.json();
    if (!Array.isArray(rows)) throw new Error('Invalid news response');
    if (!view && !rows[0]) return response(404,errorPage(404),'noindex,follow');
    const count = Number((result.headers.get('content-range') || '').split('/')[1]) || rows.length;
    const html = view ? collectionPage(rows,count,view) : articlePage(rows[0]);
    const resultResponse = response(200,event.httpMethod === 'HEAD' ? '' : html,view ? '' : U.articleMetadata(rows[0]).robots);
    return resultResponse;
  } catch (_) { return response(503,errorPage(503),'noindex,follow'); }
};
exports.__test = { head, json, articlePage, collectionPage, cover };
