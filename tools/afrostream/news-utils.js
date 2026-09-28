(function (root, factory) {
  'use strict';
  var api = factory(root);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.AfroStreamNewsUtils = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (root) {
  'use strict';
  var ORIGIN = 'https://afrotools.com';
  var LABELS = { milestones: 'Music & culture', milestone: 'Music & culture', platform: 'Platforms',
    collabs: 'Collaborations', drama: 'What happened', business: 'Creator business',
    rising: 'On the rise', gaming: 'Gaming', industry: 'The industry', data: 'By the numbers' };
  function isLocal(loc) {
    loc = loc || root.location || {};
    return loc.protocol === 'file:' || /^(localhost|127\.0\.0\.1|\[?::1\]?)$/i.test(loc.hostname || '');
  }
  function slug(value) { return encodeURIComponent(String(value || '').trim()).replace(/%2F/gi, ''); }
  function prettyPath(value) { return '/tools/afrostream/news/' + slug(value); }
  function previewPath(value) { return '/tools/afrostream/article.html?slug=' + slug(value); }
  function escapeHTML(value) {
    return String(value == null ? '' : value).replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function safeHttpUrl(value) {
    var text = String(value || '').trim();
    if (!text || text.slice(0, 2) === '//' || /[\\\u0000-\u0020]/.test(text)) return '';
    if (text.charAt(0) === '/') return text;
    try {
      var url = new URL(text);
      return /^https?:$/.test(url.protocol) && !url.username && !url.password ? url.href : '';
    } catch (_) { return ''; }
  }
  function isPlaceholderImage(value) {
    return !value || /\/assets\/img\/og-default\.png|placeholder/i.test(String(value));
  }
  function cleanExcerpt(value) {
    return String(value || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ')
      .replace(/\s*The post\s+[\s\S]*?\s+(?:appeared first|first appeared) on\s+[\s\S]*$/i, '')
      .replace(/\s*\[\s*…?\s*\]\s*$/, '').trim();
  }
  function wordCount(value) { return cleanExcerpt(value).split(/\s+/).filter(Boolean).length; }
  function isNewswire(row) {
    row = row && row._raw || row || {};
    // Older original reports also have namespaced external IDs for deduplication.
    // The RSS monitor credits its publisher; editorial reports credit our team.
    return !/^Afro(?:Stream|Tools)(?:\s|$)/i.test(String(row.author || ''));
  }
  function isIndexable(row) {
    return !!(row && !isNewswire(row) && row.slug && row.title && safeHttpUrl(row.source_url) &&
      wordCount(row.body) >= 120 && Number.isFinite(Date.parse(row.published_at)) &&
      Date.parse(row.published_at) <= Date.now());
  }
  function categoryLabel(category) { return LABELS[String(category || '').toLowerCase()] || 'The scene'; }
  function dateLabel(value) {
    var date = new Date(value);
    return Number.isFinite(date.getTime()) ? date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }) : 'Date unavailable';
  }
  function story(row) {
    row = row || {};
    var raw = row._raw || row;
    return { id: raw.id || row.id, slug: raw.slug || row.slug, title: raw.title || row.headline || row.title || '',
      category: String(raw.category || row.cat || 'milestones').toLowerCase(),
      excerpt: cleanExcerpt(raw.excerpt || row.excerpt || ''),
      image_url: safeHttpUrl(raw.image_url || row.imageUrl || ''),
      published_at: raw.published_at || row.date || '', source: raw.source_name || raw.author || row.author || 'AfroStream',
      kind: isNewswire(raw) ? 'Newswire brief' : 'AfroStream report', body: raw.body || row.body || '' };
  }
  function media(row, eager) {
    var item = story(row);
    var image = !isPlaceholderImage(item.image_url) ? imageHref(row) : '';
    return '<div class="as-story-media' + (image ? '' : ' as-media-missing') + '" data-category="' + escapeHTML(item.category) + '">' +
      '<div class="as-story-art" aria-hidden="true"><span>AFROSTREAM</span><strong>' + escapeHTML(categoryLabel(item.category)) + '</strong><span>IN THE SCENE ↗</span></div>' +
      (image ? '<img src="' + escapeHTML(image) + '" alt="' + escapeHTML(item.title) + '" width="1200" height="675" loading="' + (eager ? 'eager' : 'lazy') + '"' + (eager ? ' fetchpriority="high"' : '') + ' onload="this.parentElement.classList.toggle(\'as-media-portrait\',this.naturalHeight>=this.naturalWidth)" onerror="this.hidden=true;this.parentElement.classList.add(\'as-media-missing\')">' : '') + '</div>';
  }
  function imageHref(row) {
    var item = story(row);
    return isPlaceholderImage(item.image_url) ? '' : (/^\d+$/.test(String(item.id || '')) ? '/api/afrostream/image?id=' + encodeURIComponent(item.id) : item.image_url);
  }
  function storyCard(row, options) {
    options = options || {};
    var item = story(row);
    var href = options.href || (isLocal(options.location) ? previewPath(item.slug) : prettyPath(item.slug));
    var read = Math.max(1, Math.ceil(wordCount(item.body || item.excerpt) / 200));
    var level = options.headingLevel || 3;
    return '<a class="as-story ' + escapeHTML(options.className || '') + '" href="' + escapeHTML(href) + '" data-slug="' + escapeHTML(item.slug) + '">' +
      media(row, options.eager) + '<div class="as-story-copy"><div class="as-story-kicker">' + escapeHTML(categoryLabel(item.category)) + '<span>' + escapeHTML(item.kind) + '</span></div>' +
      '<h' + level + '>' + escapeHTML(item.title) + '</h' + level + '>' +
      (options.excerpt === false ? '' : '<p>' + escapeHTML(item.excerpt) + '</p>') +
      '<div class="as-story-meta"><span>' + escapeHTML(item.source) + '</span><time datetime="' + escapeHTML(item.published_at) + '">' + escapeHTML(dateLabel(item.published_at)) + '</time><span>' + read + ' min read</span></div></div></a>';
  }
  function inlineMarkdown(text) {
    var links = [];
    text = String(text || '').replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, function (_, label, href) {
      var i = links.length;
      links.push('<a href="' + escapeHTML(safeHttpUrl(href)) + '" target="_blank" rel="noopener">' + escapeHTML(label) + '</a>');
      return '\u0000LINK' + i + '\u0000';
    });
    return escapeHTML(text).replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/\*([^*]+)\*/g, '<em>$1</em>')
      .replace(/\u0000LINK(\d+)\u0000/g, function (_, i) { return links[Number(i)] || ''; });
  }
  function renderMarkdown(text) {
    text = String(text || '').replace(/\r\n/g, '\n').replace(/<br\s*\/?>/gi, '\n')
      .replace(/\\n\\n/g, '\n\n')
      .replace(/<\/p>\s*<p[^>]*>/gi, '\n\n').replace(/<\/p>/gi, '\n\n')
      .replace(/<p[^>]*>/gi, '').replace(/<[^>]+>/g, '').trim();
    return text.split(/\n{2,}/).map(function (block) {
      block = block.trim();
      if (!block) return '';
      if (/^###\s/.test(block)) return '<h3>' + inlineMarkdown(block.replace(/^###\s+/, '')) + '</h3>';
      if (/^##\s/.test(block)) return '<h2>' + inlineMarkdown(block.replace(/^##\s+/, '')) + '</h2>';
      if (/^>\s/.test(block)) return '<blockquote>' + inlineMarkdown(block.replace(/^>\s+/gm, '').replace(/\n/g, ' ')) + '</blockquote>';
      if (/^(?:[-*]\s+.+\n?)+$/.test(block)) return '<ul>' + block.split('\n').map(function (line) { return '<li>' + inlineMarkdown(line.replace(/^[-*]\s+/, '')) + '</li>'; }).join('') + '</ul>';
      if (/^(?:\d+\.\s+.+\n?)+$/.test(block)) return '<ol>' + block.split('\n').map(function (line) { return '<li>' + inlineMarkdown(line.replace(/^\d+\.\s+/, '')) + '</li>'; }).join('') + '</ol>';
      return '<p>' + inlineMarkdown(block).replace(/\n/g, '<br>') + '</p>';
    }).join('');
  }
  var gradients = {milestones: 'linear-gradient(135deg,#2563eb,#1d4ed8)', platform: 'linear-gradient(135deg,#0891b2,#0f766e)', business: 'linear-gradient(135deg,#16a34a,#0f766e)'};
  function categoryGradient(category) { return gradients[String(category || '').toLowerCase()] || gradients.milestones; }
  function metadata(row) {
    var item = story(row), url = ORIGIN + prettyPath(item.slug), wire = isNewswire(row);
    var modified = Date.parse(row.updated_at) >= Date.parse(row.published_at) && Date.parse(row.updated_at) <= Date.now() ? row.updated_at : row.published_at;
    var image = imageHref(row);
    if (image.charAt(0) === '/') image = ORIGIN + image;
    var data = { '@context': 'https://schema.org', '@type': wire ? 'WebPage' : 'NewsArticle',
      headline: item.title, description: item.excerpt, url: url, mainEntityOfPage: url,
      datePublished: row.published_at, dateModified: modified,
      author: { '@type': 'Organization', name: wire ? item.source : (row.author || 'AfroStream editorial') },
      publisher: { '@type': 'Organization', name: 'AfroTools', url: ORIGIN + '/' },
      isPartOf: { '@type': 'WebSite', name: 'AfroStream', url: ORIGIN + '/tools/afrostream/' } };
    if (image) data.image = [image];
    if (safeHttpUrl(row.source_url)) data.citation = row.source_url;
    return { title: item.title + ' | AfroStream', description: item.excerpt || item.title,
      canonical: url, image: image || ORIGIN + '/assets/img/tools/afrostream.webp',
      robots: isIndexable(row) ? 'index,follow,max-image-preview:large' : 'noindex,follow',
      type: wire ? 'website' : 'article', jsonLd: data };
  }
  function articleHTML(row) {
    var item = story(row), wire = isNewswire(row), sourceUrl = safeHttpUrl(row.source_url);
    var brief = cleanExcerpt(row.excerpt || row.body).split(/\s+/).slice(0,65).join(' ');
    var body = wire ? '<p>' + escapeHTML(brief) + '</p>' : renderMarkdown(row.body || row.excerpt);
    var read = Math.max(1, Math.ceil(wordCount(row.body || row.excerpt) / 200));
    return '<a class="scene-back" href="/tools/afrostream/news">← Back to the scene</a>' +
      '<header class="scene-article-header"><div class="scene-eyebrow">' + escapeHTML(categoryLabel(item.category)) + ' · ' + escapeHTML(item.kind) + '</div>' +
      '<h1>' + escapeHTML(item.title) + '</h1>' + (!wire && item.excerpt ? '<p class="scene-deck">' + escapeHTML(item.excerpt) + '</p>' : '') +
      '<div class="as-story-meta"><span>' + escapeHTML(wire ? item.source : (row.author || 'AfroStream editorial')) + '</span><time datetime="' + escapeHTML(item.published_at) + '">' + escapeHTML(dateLabel(item.published_at)) + '</time><span>' + read + ' min read</span></div></header>' +
      (!isPlaceholderImage(item.image_url) ? '<figure class="scene-article-visual">' + media(row, true) + '</figure>' : '') +
      '<div class="scene-article-columns"><article class="scene-article-body">' + body +
      (wire && sourceUrl ? '<p><a class="scene-button" href="' + escapeHTML(sourceUrl) + '" target="_blank" rel="noopener">Continue at ' + escapeHTML(item.source) + ' ↗</a></p>' : '') + '</article>' +
      '<aside><section class="scene-source"><h2>' + (wire ? 'From the newswire' : 'Sources & context') + '</h2><p>' + escapeHTML(item.source) + '</p>' +
      (sourceUrl ? '<a href="' + escapeHTML(sourceUrl) + '" target="_blank" rel="noopener">Read the original source ↗</a>' : '') +
      '<p>' + (wire ? 'This is a brief from the publisher’s feed. Follow the source for their full reporting.' : 'This report adds AfroStream’s analysis to the linked source material. Availability and eligibility can vary by country.') + '</p><a href="/tools/afrostream/editorial/">Editorial & corrections →</a></section>' +
      '<div class="scene-share"><button type="button" id="copyArticleLink">Copy article link</button><a href="https://wa.me/?text=' + encodeURIComponent(item.title + ' ' + ORIGIN + prettyPath(item.slug)) + '" target="_blank" rel="noopener">Share on WhatsApp</a><a href="/tools/afrostream/university/">Creator Playbook →</a><span id="shareStatus" role="status" aria-live="polite"></span></div></aside></div>' +
      '<section class="scene-related" id="relatedArticles" hidden aria-label="Related stories"></section>';
  }
  return { isLocal: isLocal, articleHref: function (value, loc) { return isLocal(loc) ? previewPath(value) : prettyPath(value); },
    canonicalUrl: function (value) { return ORIGIN + prettyPath(value); }, prettyPath: prettyPath, previewPath: previewPath,
    slugFromLocation: function (loc) {
      loc = loc || root.location || {};
      var query = new URLSearchParams(loc.search || '');
      var match = String(loc.pathname || '').match(/\/tools\/afrostream\/news\/([^/?#]+)/);
      try { return query.get('slug') || query.get('article') || (match ? decodeURIComponent(match[1]) : ''); } catch (_) { return ''; }
    }, escapeHTML: escapeHTML, safeHttpUrl: safeHttpUrl, isPlaceholderImage: isPlaceholderImage,
    cleanExcerpt: cleanExcerpt, wordCount: wordCount, isNewswire: isNewswire, isIndexable: isIndexable,
    categoryLabel: categoryLabel, dateLabel: dateLabel, story: story, storyMedia: media, storyCard: storyCard, imageHref: imageHref,
    articleMetadata: metadata, articleHTML: articleHTML,
    categoryGradient: categoryGradient, imageStyle: function (row) {
      var image = safeHttpUrl(row.imageUrl || row.image_url || row.cover_url || '');
      return !isPlaceholderImage(image) ? 'background-image:url("' + image.replace(/["'()\\]/g, '\\$&') + '");background-size:cover;background-position:center;background-repeat:no-repeat' : 'background:' + categoryGradient(row.cat || row.category) + ';background-size:cover;background-position:center';
    }, renderMarkdown: renderMarkdown, placeholderImage: '/assets/img/og-default.png' };
});
