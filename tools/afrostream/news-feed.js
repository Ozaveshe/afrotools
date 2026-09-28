(function () {
  'use strict';
  var U = window.AfroStreamNewsUtils;
  var articles = [], offset = 0, total = 0, visible = 9, remainingMatches = 0, category = 'all', kind = 'all', query = '', loading = false;
  var status = document.getElementById('feedStatus');
  var cover = document.getElementById('heroGrid');
  var grid = document.getElementById('newsGrid');
  var more = document.getElementById('loadMoreBtn');
  var error = document.getElementById('feedError');
  var boot = document.getElementById('as-news-bootstrap');
  function track(name, props) {
    if (window.AfroTools && AfroTools.analytics && AfroTools.analytics.track) AfroTools.analytics.track(name, props || {});
  }
  function render() {
    var matches = articles.filter(function (row) {
      return (category === 'all' || row.category === category) &&
        (kind === 'all' || (kind === 'original' ? !U.isNewswire(row) : U.isNewswire(row))) &&
        (!query || (row.title + ' ' + row.excerpt + ' ' + row.source_name).toLowerCase().includes(query));
    });
    var filtering = category !== 'all' || kind !== 'all' || !!query;
    var lead = matches.find(function (row) { return row.is_featured && !U.isNewswire(row); }) || matches[0];
    var rest = lead ? matches.filter(function (row) { return row.id !== lead.id; }) : [];
    remainingMatches = rest.length;
    var side = rest.slice(0, 2);
    if (!matches.length) {
      cover.innerHTML = '<div class="scene-empty"><h2>' + (filtering ? 'No stories match these filters' : 'Stories are on their way') + '</h2><p>' +
        (filtering ? 'Try a different topic, clear your search, or load older stories below.' : 'Browse the creator directory while we prepare the next edition.') + '</p>' +
        (filtering ? '<button type="button" class="scene-button scene-button-secondary" id="clearFilters">Clear filters</button>' : '<a href="/tools/afrostream/directory/">Explore creators →</a>') + '</div>';
      grid.innerHTML = '';
    } else {
      cover.innerHTML = U.storyCard(lead, { className: 'as-story-lead', headingLevel: 2, eager: true }) +
        '<div class="scene-cover-side">' + side.map(function (row) { return U.storyCard(row, { className: 'as-story-side', excerpt: false }); }).join('') +
        '<div class="scene-note"><strong>Good stories. Clear receipts.</strong>Newswire briefs point to their original publishers. Our own reports add context. <a href="/tools/afrostream/editorial/">How we cover the scene →</a></div></div>';
      grid.innerHTML = rest.slice(2, visible + 2).map(function (row) { return U.storyCard(row); }).join('');
    }
    status.textContent = matches.length + ' matching stories in ' + articles.length + ' loaded. ' + (total > articles.length ? 'Load more to search older coverage.' : 'You have reached the end of the archive.');
    more.hidden = articles.length >= total && rest.length <= visible + 2;
    more.disabled = loading;
    more.textContent = loading ? 'Loading stories…' : (rest.length > visible + 2 ? 'Show more stories' : 'Load older stories');
    document.querySelectorAll('[data-filter-category]').forEach(function (btn) { btn.setAttribute('aria-pressed', String(btn.dataset.filterCategory === category)); });
    document.querySelectorAll('[data-filter-kind]').forEach(function (btn) { btn.setAttribute('aria-pressed', String(btn.dataset.filterKind === kind)); });
  }
  async function load() {
    if (loading) return;
    loading = true; error.hidden = true; more.disabled = true; more.textContent = 'Loading stories…';
    try {
      var response = await fetch('/api/afrostream/news?limit=50&offset=' + offset, { signal: AbortSignal.timeout(12000) });
      if (!response.ok) throw new Error('News unavailable');
      var payload = await response.json();
      if (!payload.success || !Array.isArray(payload.data)) throw new Error('Invalid news response');
      var ids = new Set(articles.map(function (row) { return row.id; }));
      payload.data.forEach(function (row) { if (!ids.has(row.id)) { articles.push(row); ids.add(row.id); } });
      offset += payload.data.length;
      total = Number(payload.count == null ? articles.length : payload.count);
      if (!payload.data.length) total = articles.length;
      loading = false; render();
    } catch (_) {
      loading = false; error.hidden = false;
      if (!articles.length) {
        cover.innerHTML = '<div class="scene-empty" role="status"><h2>The news feed is temporarily unavailable</h2><p>Try again shortly, or explore African creators in the directory.</p><a href="/tools/afrostream/directory/">Explore creators →</a></div>';
        grid.innerHTML = ''; status.textContent = 'News could not be loaded.';
      }
      more.hidden = false; more.disabled = false; more.textContent = 'Retry loading stories';
    }
  }
  document.addEventListener('click', function (event) {
    var cat = event.target.closest('[data-filter-category]');
    var type = event.target.closest('[data-filter-kind]');
    if (cat) { category = cat.dataset.filterCategory; visible = 9; render(); track('afrostream_news_filter', { topic: category }); }
    if (type) { kind = type.dataset.filterKind; visible = 9; render(); track('afrostream_news_kind', { kind: kind }); }
    if (event.target.closest('#clearFilters')) { category = kind = 'all'; query = ''; document.getElementById('newsSearch').value = ''; render(); }
    if (event.target.closest('.as-story')) track('afrostream_story_opened', { location: 'news' });
  });
  document.getElementById('newsSearch').addEventListener('input', function () { query = this.value.trim().toLowerCase(); visible = 9; render(); });
  more.addEventListener('click', function () {
    var canRevealLoadedStories = remainingMatches > visible + 2;
    visible += 9;
    if (canRevealLoadedStories || articles.length >= total) render(); else load();
  });
  if (boot) {
    try { var data = JSON.parse(boot.textContent); articles = data.data || []; total = Number(data.count || articles.length); offset = articles.length; render(); }
    catch (_) { load(); }
  } else load();
})();
