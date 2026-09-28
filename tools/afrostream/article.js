(async function () {
  'use strict';
  var U = window.AfroStreamNewsUtils, main = document.getElementById('main-content');
  var boot = document.getElementById('as-article-bootstrap'), row;
  try {
    if (boot) row = JSON.parse(boot.textContent);
    else {
      var slug = U.slugFromLocation(window.location);
      if (!slug) { main.innerHTML = '<div class="scene-empty"><h1>Choose a story</h1><p>Visit the scene for our latest coverage.</p><a href="/tools/afrostream/news">Open the scene →</a></div>'; return; }
      var response = await fetch('/api/afrostream/news?slug=' + encodeURIComponent(slug), { signal: AbortSignal.timeout(12000) });
      if (response.status === 404) { main.innerHTML = '<div class="scene-empty"><h1>Story not found</h1><p>This story may have been removed or its link changed.</p><a href="/tools/afrostream/news">Back to the scene →</a></div>'; return; }
      if (!response.ok) throw new Error('Story unavailable');
      var payload = await response.json();
      if (!payload.success || !payload.data || Array.isArray(payload.data)) throw new Error('Story unavailable');
      row = payload.data;
      main.innerHTML = U.articleHTML(row);
      var meta = U.articleMetadata(row);
      document.title = meta.title;
      [['meta[name=description]','content',meta.description],['meta[name=robots]','content',meta.robots],['link[rel=canonical]','href',meta.canonical],
        ['meta[property="og:title"]','content',row.title],['meta[property="og:description"]','content',meta.description],['meta[property="og:url"]','content',meta.canonical],['meta[property="og:type"]','content',meta.type],['meta[property="og:image"]','content',meta.image],
        ['meta[name="twitter:title"]','content',row.title],['meta[name="twitter:description"]','content',meta.description],['meta[name="twitter:image"]','content',meta.image]].forEach(function (entry) { var el = document.querySelector(entry[0]); if (el) el.setAttribute(entry[1], entry[2]); });
      var ld = document.createElement('script'); ld.id = 'as-article-schema'; ld.type = 'application/ld+json'; ld.textContent = JSON.stringify(meta.jsonLd); document.head.appendChild(ld);
    }
  } catch (_) {
    if (!boot) main.innerHTML = '<div class="scene-empty" role="status"><h1>This story is temporarily unavailable</h1><p>Please try again shortly. You can still browse the scene.</p><a href="/tools/afrostream/news">Back to the scene →</a></div>';
    return;
  }
  var copy = document.getElementById('copyArticleLink');
  if (copy) copy.addEventListener('click', async function () {
    var status = document.getElementById('shareStatus');
    try { await navigator.clipboard.writeText(U.canonicalUrl(row.slug)); status.textContent = 'Link copied.'; }
    catch (_) { status.textContent = 'Copy this link: ' + U.canonicalUrl(row.slug); }
  });
  try {
    var relatedResponse = await fetch('/api/afrostream/news?limit=8&category=' + encodeURIComponent(row.category || 'milestones'), { signal: AbortSignal.timeout(10000) });
    if (!relatedResponse.ok) return;
    var relatedPayload = await relatedResponse.json();
    if (!relatedPayload.success || !Array.isArray(relatedPayload.data)) return;
    var related = relatedPayload.data.filter(function (item) { return item.slug !== row.slug; }).slice(0,3);
    var section = document.getElementById('relatedArticles');
    if (related.length && section) { section.innerHTML = '<h2>Keep following the scene</h2><div class="scene-grid">' + related.map(function (item) { return U.storyCard(item, { excerpt: false }); }).join('') + '</div>'; section.hidden = false; }
  } catch (_) { /* The current article remains readable if related coverage is unavailable. */ }
})();
