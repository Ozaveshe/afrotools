'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const U = require('../tools/afrostream/news-utils');
const server = require('../netlify/functions/afrostream-article');
const feed = require('../netlify/functions/afrostream-feed');
const live = require('../netlify/functions/_shared/afrostream-youtube-live');
const monitor = require('../netlify/functions/afrostream-news-monitor').__test;
const original = {id:42,slug:'a-real-report',title:'A creator report',category:'platform',author:'AfroStream editorial',external_id:'editorial:report:2026',source_name:'YouTube',source_url:'https://blog.youtube/example/',body:Array(150).fill('reporting').join(' '),excerpt:'A useful report.',image_url:'https://storage.googleapis.com/image.jpg',published_at:'2026-09-23T12:00:00Z',updated_at:'2026-09-24T12:00:00Z',is_featured:true};
const wire = {...original,id:43,slug:'a-publisher-brief',author:'A publisher',source_name:'A publisher',external_id:'9fjqpa',body:'Their short summary.'};
function player(broadcast, status='OK') {return {videoDetails:{videoId:'selected123',title:'Selected { "video" }',isLiveContent:true},playabilityStatus:{status},microformat:{playerMicroformatRenderer:{liveBroadcastDetails:broadcast}}};}
function html(value) {return '<script>var ytInitialPlayerResponse = '+JSON.stringify(value)+';</script><script>{"iconType":"LIVE","isLiveNow":true}</script>';}
test('an ended selected video is not made live by recommendations or isLiveContent',()=>{
  assert.equal(live.liveState(html(player({isLiveNow:false,endTimestamp:'2026-09-23T13:00:00Z'}))).is_live,false);
  assert.equal(live.liveState(html(player({isLiveNow:true,endTimestamp:'2026-09-23T13:00:00Z'}))).is_live,false);
});
test('only a playable selected broadcast with a current live state is live',()=>{
  assert.equal(live.liveState(html(player({isLiveNow:true,startTimestamp:'2026-09-28T12:00:00Z'}))).is_live,true);
  assert.equal(live.liveState(html(player({isLiveNow:true},'LOGIN_REQUIRED'))).is_live,false);
  assert.equal(live.liveState(html(player({isLiveNow:false,startTimestamp:'2027-01-01T12:00:00Z'}))).is_live,false);
  assert.equal(live.liveState('Consent required. {"isLiveNow":true}').checked,false);
  assert.equal(live.selectedPlayer(html(player({isLiveNow:true}))).videoDetails.title,'Selected { "video" }');
});
test('RSS and Atom parse image metadata without choosing video media or making up publication dates',()=>{
  const rss='<rss><item><title>A story</title><link>https://publisher.example/a</link><description>Useful news. The post A story appeared first on Publisher.</description><media:content url="https://cdn.example/a.mp4" type="video/mp4"/><media:thumbnail url="https://cdn.example/a.jpg"/><pubDate>Wed, 23 Sep 2026 12:00:00 GMT</pubDate></item></rss>';
  const parsed=monitor.parseFeed(rss)[0];
  assert.equal(parsed.image_url,'https://cdn.example/a.jpg');
  assert.equal(parsed.description,'Useful news.');
  assert.equal(parsed.published_at,'2026-09-23T12:00:00.000Z');
  assert.equal(monitor.parseFeed('<feed><entry><title>Untimed</title><link href="https://publisher.example/a"/><summary>Brief</summary></entry></feed>')[0].published_at,null);
  assert.equal(monitor.parseFeed(rss.replace(/<pubDate>.*?<\/pubDate>/,'').replace('https://cdn.example/a.jpg','javascript:alert(1)'))[0].image_url,null);
  assert.equal(monitor.isRecentEnough({published_at:null},new Date(Date.now()-86400000)),false);
  assert.equal(monitor.isRecentEnough({published_at:new Date(Date.now()+86400000).toISOString()},new Date(Date.now()-86400000)),false);
});
test('original deduplication IDs are not confused with syndicated news',()=>{
  assert.equal(U.isNewswire(original),false); assert.equal(U.isNewswire(wire),true);
  assert.equal(U.isIndexable(original),true); assert.equal(U.isIndexable(wire),false);
  assert.equal(U.isIndexable({...original,body:'A fragment.'}),false);
  assert.equal(U.isIndexable({...original,published_at:'2099-01-01T00:00:00Z'}),false);
});
test('server HTML contains correct article metadata and readable text before JavaScript runs',()=>{
  const result=server.__test.articlePage(original);
  assert.match(result,/<title>A creator report \| AfroStream<\/title>/);
  assert.match(result,/<h1>A creator report<\/h1>/);
  assert.match(result,/index,follow,max-image-preview:large/);
  assert.match(result,/"datePublished":"2026-09-23T12:00:00Z"/);
  assert.match(result,/"dateModified":"2026-09-24T12:00:00Z"/);
  assert.match(result,/"name":"AfroStream editorial"/);
  assert.equal((result.match(/id="as-article-schema"/g)||[]).length,1);
  assert.match(result,/<article class="scene-article-body"><p>reporting/);
});
test('syndication keeps its publisher, source CTA and noindex on the initial response',()=>{
  const result=server.__test.articlePage(wire);
  assert.match(result,/<meta name="robots" content="noindex,follow">/);
  assert.match(result,/Continue at A publisher/);
  assert.match(result,/"@type":"WebPage"/);
  assert.doesNotMatch(result,/"@type":"NewsArticle"/);
});
test('server collection cards do not duplicate a featured report when it is not the newest row',()=>{
  const rows=[wire,{...wire,id:44,slug:'another-brief'},original,{...wire,id:45,slug:'third-brief'}];
  const html=server.__test.collectionPage(rows,rows.length,'news');
  assert.equal((html.match(/href="\/tools\/afrostream\/news\/a-real-report"/g)||[]).length,1);
  assert.match(html,/third-brief/);
});
test('untrusted article text, URLs and bootstrap JSON cannot inject markup',()=>{
  const evil={...original,title:'</title><script>alert(1)</script>',excerpt:'" onmouseover="alert(1)',body:'<script>alert(1)</script>\n\n[bad](javascript:alert(1))',source_url:'javascript:alert(1)',image_url:'javascript:alert(1)'};
  const result=server.__test.articlePage(evil);
  assert.doesNotMatch(result,/<script>alert\(1\)<\/script>/);
  assert.doesNotMatch(result,/href="javascript:|src="javascript:/);
  assert.match(result,/\\u003c\/title\\u003e/);
  ['//evil.example/x','/\\evil.example','https://name:pass@example.com','https://a.example/\nfoo'].forEach(url=>assert.equal(U.safeHttpUrl(url),''));
});
test('source images use the own-origin endpoint, with an accessible failure fallback',()=>{
  const card=U.storyCard(original);
  assert.match(card,/src="\/api\/afrostream\/image\?id=42"/);
  assert.match(card,/width="1200" height="675"/);
  assert.match(card,/this.hidden=true/);
  assert.match(U.storyCard({...original,image_url:null}),/as-media-missing/);
  assert.match(U.storyCard(original,{location:{hostname:'localhost'}}),/article.html\?slug=a-real-report/);
});
test('RSS dates do not advance just because a reader requests the feed; attribution and images survive',()=>{
  const xml=feed.__test.rss([wire,original]);
  assert.match(xml,/<lastBuildDate>Wed, 23 Sep 2026 12:00:00 GMT<\/lastBuildDate>/);
  assert.match(xml,/Newswire brief; source: A publisher/);
  assert.match(xml,/media:content url="https:\/\/afrotools.com\/api\/afrostream\/image\?id=43"/);
  assert.match(xml,/<dc:source>https:\/\/blog.youtube\/example\/<\/dc:source>/);
});
test('article sitemap includes only publishable original reports, with actual modification dates',()=>{
  const xml=feed.__test.sitemap([wire,original,{...original,slug:'fragment',body:'Short.'}]);
  assert.match(xml,/news\/a-real-report/); assert.doesNotMatch(xml,/a-publisher-brief|fragment/);
  assert.match(xml,/<lastmod>2026-09-24T12:00:00.000Z<\/lastmod>/);
});
test('permalink handlers return real 404 and upstream-unavailable responses',async()=>{
  const previousFetch=global.fetch, previousKey=process.env.SUPABASE_DATA_SERVICE_ROLE_KEY;
  process.env.SUPABASE_DATA_SERVICE_ROLE_KEY='test-only';
  try {
    global.fetch=async()=>new Response('[]',{status:200});
    const missing=await server.handler({httpMethod:'GET',queryStringParameters:{slug:'missing'}});
    assert.equal(missing.statusCode,404);assert.match(missing.body,/Story not found/);
    global.fetch=async()=>new Response('no',{status:503});
    const failed=await server.handler({httpMethod:'GET',queryStringParameters:{slug:original.slug}});
    assert.equal(failed.statusCode,503);assert.equal(failed.headers['Cache-Control'],'no-store');
    const feedFailed=await feed.handler({httpMethod:'GET',queryStringParameters:{}}); assert.equal(feedFailed.statusCode,503);
  } finally {global.fetch=previousFetch;if(previousKey===undefined)delete process.env.SUPABASE_DATA_SERVICE_ROLE_KEY;else process.env.SUPABASE_DATA_SERVICE_ROLE_KEY=previousKey;}
});
