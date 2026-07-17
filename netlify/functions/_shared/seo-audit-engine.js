'use strict';

/**
 * AfroSEO Studio audit engine.
 * Pure analysis of a fetched HTML document plus fetch metadata.
 * Every check is computed from the actual page — no invented metrics.
 */

var MAX_TITLE = 60;
var MIN_TITLE = 15;
var MAX_DESCRIPTION = 160;
var MIN_DESCRIPTION = 70;
var THIN_CONTENT_WORDS = 250;

function decodeEntities(value) {
  return String(value == null ? '' : value)
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&nbsp;/g, ' ');
}

function stripTags(html) {
  return decodeEntities(
    String(html || '')
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
  ).replace(/\s+/g, ' ').trim();
}

function parseAttributes(tag) {
  var attrs = {};
  var re = /([a-zA-Z0-9_:-]+)\s*=\s*("([^"]*)"|'([^']*)'|([^\s"'>]+))/g;
  var match;
  while ((match = re.exec(tag)) !== null) {
    attrs[match[1].toLowerCase()] = decodeEntities(match[3] != null ? match[3] : (match[4] != null ? match[4] : match[5] || ''));
  }
  return attrs;
}

function collectTags(html, tagName) {
  var re = new RegExp('<' + tagName + '\\b[^>]*>', 'gi');
  var tags = [];
  var match;
  while ((match = re.exec(html)) !== null) {
    tags.push(parseAttributes(match[0]));
  }
  return tags;
}

function collectHeadings(html) {
  var re = /<h([1-6])\b[^>]*>([\s\S]*?)<\/h\1>/gi;
  var headings = [];
  var match;
  while ((match = re.exec(html)) !== null) {
    headings.push({ level: Number(match[1]), text: stripTags(match[2]).slice(0, 160) });
  }
  return headings;
}

function collectJsonLd(html) {
  var re = /<script\b[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  var blocks = [];
  var match;
  while ((match = re.exec(html)) !== null) {
    var raw = match[1].trim();
    try {
      var parsed = JSON.parse(raw);
      var items = Array.isArray(parsed) ? parsed : (parsed && Array.isArray(parsed['@graph']) ? parsed['@graph'] : [parsed]);
      blocks.push({
        valid: true,
        types: items.map(function (item) { return item && item['@type'] ? String(item['@type']) : 'Unknown'; })
      });
    } catch (error) {
      blocks.push({ valid: false, error: 'JSON parse failed: ' + String(error.message || error).slice(0, 120), types: [] });
    }
  }
  return blocks;
}

function getTitle(html) {
  var match = /<title\b[^>]*>([\s\S]*?)<\/title>/i.exec(html);
  return match ? stripTags(match[1]) : '';
}

function metaByName(metas, name) {
  name = name.toLowerCase();
  for (var i = 0; i < metas.length; i += 1) {
    if (String(metas[i].name || '').toLowerCase() === name) return metas[i].content || '';
  }
  return '';
}

function metaByProperty(metas, property) {
  property = property.toLowerCase();
  for (var i = 0; i < metas.length; i += 1) {
    if (String(metas[i].property || '').toLowerCase() === property) return metas[i].content || '';
  }
  return '';
}

function linksByRel(links, rel) {
  rel = rel.toLowerCase();
  return links.filter(function (link) {
    return String(link.rel || '').toLowerCase().split(/\s+/).indexOf(rel) >= 0;
  });
}

function safeHostname(url) {
  try {
    return new URL(url).hostname.toLowerCase();
  } catch (error) {
    return '';
  }
}

function check(id, label, status, detail, fix) {
  return { id: id, label: label, status: status, detail: detail || '', fix: status === 'pass' ? '' : (fix || '') };
}

function gradeFromChecks(checks) {
  if (!checks.length) return { grade: 'A', score: 100 };
  var points = 0;
  checks.forEach(function (item) {
    if (item.status === 'pass') points += 1;
    else if (item.status === 'warn') points += 0.5;
  });
  var score = Math.round((points / checks.length) * 100);
  var grade = score >= 90 ? 'A' : score >= 75 ? 'B' : score >= 60 ? 'C' : score >= 40 ? 'D' : 'F';
  return { grade: grade, score: score };
}

function buildCategory(id, label, checks) {
  var graded = gradeFromChecks(checks);
  return { id: id, label: label, grade: graded.grade, score: graded.score, checks: checks };
}

function analyzeMetadata(page) {
  var checks = [];
  var title = page.title;
  if (!title) {
    checks.push(check('title-missing', 'Page title', 'fail', 'No <title> tag found.', 'Add a unique, descriptive <title> of ' + MIN_TITLE + '-' + MAX_TITLE + ' characters.'));
  } else if (title.length > MAX_TITLE) {
    checks.push(check('title-long', 'Page title', 'warn', 'Title is ' + title.length + ' characters; Google typically shows about ' + MAX_TITLE + '.', 'Shorten the title to roughly ' + MAX_TITLE + ' characters, front-loading the main keyword.'));
  } else if (title.length < MIN_TITLE) {
    checks.push(check('title-short', 'Page title', 'warn', 'Title is only ' + title.length + ' characters.', 'Expand the title to describe the page more fully (' + MIN_TITLE + '-' + MAX_TITLE + ' characters).'));
  } else {
    checks.push(check('title-ok', 'Page title', 'pass', 'Title is ' + title.length + ' characters.'));
  }

  var description = page.metaDescription;
  if (!description) {
    checks.push(check('desc-missing', 'Meta description', 'fail', 'No meta description found.', 'Add a meta description of ' + MIN_DESCRIPTION + '-' + MAX_DESCRIPTION + ' characters that earns the click.'));
  } else if (description.length > MAX_DESCRIPTION) {
    checks.push(check('desc-long', 'Meta description', 'warn', 'Description is ' + description.length + ' characters and will be cut off.', 'Trim the description to about ' + MAX_DESCRIPTION + ' characters.'));
  } else if (description.length < MIN_DESCRIPTION) {
    checks.push(check('desc-short', 'Meta description', 'warn', 'Description is only ' + description.length + ' characters.', 'Use the full space (' + MIN_DESCRIPTION + '-' + MAX_DESCRIPTION + ' characters) to sell the click.'));
  } else {
    checks.push(check('desc-ok', 'Meta description', 'pass', 'Description is ' + description.length + ' characters.'));
  }

  if (page.charset) checks.push(check('charset-ok', 'Character encoding', 'pass', 'Charset declared (' + page.charset + ').'));
  else checks.push(check('charset-missing', 'Character encoding', 'warn', 'No charset meta tag found.', 'Add <meta charset="utf-8"> as the first element in <head>.'));

  if (page.lang) checks.push(check('lang-ok', 'Language attribute', 'pass', 'html lang="' + page.lang + '".'));
  else checks.push(check('lang-missing', 'Language attribute', 'warn', 'The <html> tag has no lang attribute.', 'Add lang="en" (or the page language) to the <html> tag for accessibility and SEO.'));

  if (page.favicon) checks.push(check('favicon-ok', 'Favicon', 'pass', 'Favicon link found.'));
  else checks.push(check('favicon-missing', 'Favicon', 'warn', 'No favicon link found.', 'Add <link rel="icon" ...> — browsers and SERP features use it.'));

  return buildCategory('metadata', 'Titles & metadata', checks);
}

function analyzeIndexing(page, fetchMeta) {
  var checks = [];
  var robotsMeta = String(page.robotsMeta || '').toLowerCase();
  var xRobots = String(fetchMeta && fetchMeta.xRobotsTag || '').toLowerCase();
  if (robotsMeta.indexOf('noindex') >= 0 || xRobots.indexOf('noindex') >= 0) {
    checks.push(check('noindex', 'Indexability', 'fail', 'The page carries a noindex directive (' + (robotsMeta.indexOf('noindex') >= 0 ? 'meta robots' : 'X-Robots-Tag header') + ').', 'Remove noindex if this page should appear in search results.'));
  } else {
    checks.push(check('indexable', 'Indexability', 'pass', 'No noindex directive found.'));
  }

  if (!page.canonical) {
    checks.push(check('canonical-missing', 'Canonical URL', 'warn', 'No canonical link found.', 'Add <link rel="canonical"> pointing to the preferred URL to prevent duplicate-content splits.'));
  } else if (safeHostname(page.canonical) && safeHostname(page.url) && safeHostname(page.canonical) !== safeHostname(page.url)) {
    checks.push(check('canonical-cross', 'Canonical URL', 'warn', 'Canonical points to a different host: ' + page.canonical, 'Confirm the cross-domain canonical is intentional — it hands ranking signals to that host.'));
  } else {
    checks.push(check('canonical-ok', 'Canonical URL', 'pass', 'Canonical: ' + page.canonical));
  }

  if (page.isHttps) checks.push(check('https-ok', 'HTTPS', 'pass', 'Page served over HTTPS.'));
  else checks.push(check('https-missing', 'HTTPS', 'fail', 'Page is not served over HTTPS.', 'Move the site to HTTPS — it is a ranking signal and a trust requirement.'));

  if (fetchMeta && fetchMeta.robotsTxt) {
    if (fetchMeta.robotsTxt.found) checks.push(check('robotstxt-ok', 'robots.txt', 'pass', 'robots.txt is reachable.'));
    else checks.push(check('robotstxt-missing', 'robots.txt', 'warn', 'No robots.txt found.', 'Add a robots.txt — even a permissive one — so crawlers get explicit rules and your sitemap location.'));
  }
  if (fetchMeta && fetchMeta.sitemap) {
    if (fetchMeta.sitemap.found) checks.push(check('sitemap-ok', 'XML sitemap', 'pass', 'Sitemap reachable at ' + (fetchMeta.sitemap.url || '/sitemap.xml') + '.'));
    else checks.push(check('sitemap-missing', 'XML sitemap', 'warn', 'No sitemap found at /sitemap.xml or in robots.txt.', 'Publish an XML sitemap and reference it from robots.txt.'));
  }
  if (fetchMeta && fetchMeta.llmsTxt) {
    if (fetchMeta.llmsTxt.found) checks.push(check('llms-ok', 'llms.txt', 'pass', 'llms.txt found — AI crawlers get guidance.'));
    else checks.push(check('llms-missing', 'llms.txt', 'warn', 'No llms.txt file found.', 'Add /llms.txt describing your key pages — AI search tools (ChatGPT, Perplexity) use it to cite you.'));
  }

  if (page.hreflangs.length) {
    var badHreflang = page.hreflangs.filter(function (item) { return !item.href || !item.hreflang; });
    if (badHreflang.length) checks.push(check('hreflang-bad', 'Hreflang', 'warn', badHreflang.length + ' hreflang links are missing href or language codes.', 'Every hreflang link needs both hreflang and href attributes.'));
    else checks.push(check('hreflang-ok', 'Hreflang', 'pass', page.hreflangs.length + ' hreflang alternates declared.'));
  }

  if (page.viewport) checks.push(check('viewport-ok', 'Mobile viewport', 'pass', 'Viewport meta present.'));
  else checks.push(check('viewport-missing', 'Mobile viewport', 'fail', 'No viewport meta tag.', 'Add <meta name="viewport" content="width=device-width, initial-scale=1"> — mobile-first indexing requires it.'));

  return buildCategory('indexing', 'Crawling & indexing', checks);
}

function analyzeContent(page) {
  var checks = [];
  var h1s = page.headings.filter(function (heading) { return heading.level === 1; });
  if (h1s.length === 0) checks.push(check('h1-missing', 'H1 heading', 'fail', 'No H1 found.', 'Add exactly one H1 that states what the page is about.'));
  else if (h1s.length > 1) checks.push(check('h1-multiple', 'H1 heading', 'warn', h1s.length + ' H1 tags found.', 'Keep one H1; demote the others to H2/H3.'));
  else checks.push(check('h1-ok', 'H1 heading', 'pass', 'One H1: "' + h1s[0].text.slice(0, 80) + '"'));

  var skipped = 0;
  var lastLevel = 0;
  page.headings.forEach(function (heading) {
    if (lastLevel && heading.level > lastLevel + 1) skipped += 1;
    lastLevel = heading.level;
  });
  if (skipped) checks.push(check('heading-order', 'Heading structure', 'warn', skipped + ' heading level jumps (e.g. H2 to H4).', 'Keep heading levels sequential so the outline reads cleanly.'));
  else if (page.headings.length) checks.push(check('heading-ok', 'Heading structure', 'pass', page.headings.length + ' headings in a clean hierarchy.'));

  if (page.wordCount < THIN_CONTENT_WORDS) {
    checks.push(check('thin-content', 'Content depth', 'warn', 'Only about ' + page.wordCount + ' words of visible text.', 'Pages under ~' + THIN_CONTENT_WORDS + ' words rarely rank for competitive queries. Add genuinely useful detail, not padding.'));
  } else {
    checks.push(check('content-ok', 'Content depth', 'pass', 'About ' + page.wordCount + ' words of visible text.'));
  }

  var images = page.images;
  var missingAlt = images.filter(function (img) { return !String(img.alt || '').trim() && String(img.role || '') !== 'presentation'; });
  if (!images.length) checks.push(check('img-none', 'Image alt text', 'pass', 'No images on the page.'));
  else if (missingAlt.length) checks.push(check('img-alt-missing', 'Image alt text', missingAlt.length > images.length / 2 ? 'fail' : 'warn', missingAlt.length + ' of ' + images.length + ' images have no alt text.', 'Describe each meaningful image in its alt attribute; use alt="" only for decoration.'));
  else checks.push(check('img-alt-ok', 'Image alt text', 'pass', 'All ' + images.length + ' images have alt text.'));

  var lazyCandidates = images.length >= 4 ? images.filter(function (img) { return String(img.loading || '').toLowerCase() !== 'lazy'; }).length : 0;
  if (images.length >= 4 && lazyCandidates > images.length / 2) {
    checks.push(check('img-lazy', 'Image lazy loading', 'warn', lazyCandidates + ' of ' + images.length + ' images load eagerly.', 'Add loading="lazy" to below-the-fold images to speed up first paint.'));
  }

  return buildCategory('content', 'Content & headings', checks);
}

function analyzeLinks(page) {
  var checks = [];
  if (!page.links.total) {
    checks.push(check('links-none', 'Links', 'warn', 'No links found on the page.', 'Link to your related pages — internal links are how crawlers and users find the rest of the site.'));
  } else {
    checks.push(check('links-count', 'Links', 'pass', page.links.internal + ' internal and ' + page.links.external + ' external links.'));
    if (!page.links.internal) {
      checks.push(check('links-no-internal', 'Internal linking', 'warn', 'Every link on the page points off-site.', 'Add internal links to related pages so authority flows through your site.'));
    }
  }
  if (page.links.emptyAnchors) {
    checks.push(check('links-empty-text', 'Link anchor text', 'warn', page.links.emptyAnchors + ' links have no anchor text.', 'Give links descriptive text (or aria-label) — "click here" and empty anchors waste relevance signals.'));
  }
  if (page.mixedContent.length) {
    checks.push(check('mixed-content', 'Mixed content', 'fail', page.mixedContent.length + ' http:// resources load on an https page.', 'Serve every script, style, and image over HTTPS; browsers block or downgrade mixed content.'));
  } else if (page.isHttps) {
    checks.push(check('mixed-ok', 'Mixed content', 'pass', 'No insecure http:// resources found.'));
  }
  return buildCategory('links', 'Links', checks);
}

function analyzeSocial(page) {
  var checks = [];
  if (page.og.title) checks.push(check('og-title-ok', 'Open Graph title', 'pass', 'og:title present.'));
  else checks.push(check('og-title-missing', 'Open Graph title', 'warn', 'No og:title.', 'Add og:title — WhatsApp, Facebook, and LinkedIn previews depend on it.'));
  if (page.og.description) checks.push(check('og-desc-ok', 'Open Graph description', 'pass', 'og:description present.'));
  else checks.push(check('og-desc-missing', 'Open Graph description', 'warn', 'No og:description.', 'Add og:description for share previews.'));
  if (page.og.image) checks.push(check('og-image-ok', 'Share image', 'pass', 'og:image present.'));
  else checks.push(check('og-image-missing', 'Share image', 'warn', 'No og:image.', 'Add a 1200x630 og:image — shares without an image get dramatically fewer clicks, especially on WhatsApp.'));
  if (page.twitterCard) checks.push(check('tw-ok', 'Twitter/X card', 'pass', 'twitter:card = ' + page.twitterCard + '.'));
  else checks.push(check('tw-missing', 'Twitter/X card', 'warn', 'No twitter:card meta.', 'Add <meta name="twitter:card" content="summary_large_image">.'));
  return buildCategory('social', 'Social sharing', checks);
}

function analyzeStructuredData(page) {
  var checks = [];
  if (!page.jsonLd.length) {
    checks.push(check('jsonld-missing', 'Structured data', 'warn', 'No JSON-LD blocks found.', 'Add Schema.org JSON-LD (Organization, LocalBusiness, FAQ, Product...) to qualify for rich results.'));
  } else {
    var broken = page.jsonLd.filter(function (block) { return !block.valid; });
    var types = [];
    page.jsonLd.forEach(function (block) { types = types.concat(block.types || []); });
    if (broken.length) checks.push(check('jsonld-broken', 'Structured data validity', 'fail', broken.length + ' JSON-LD block(s) fail to parse: ' + broken[0].error, 'Fix the JSON syntax — broken blocks are ignored entirely by search engines.'));
    else checks.push(check('jsonld-valid', 'Structured data validity', 'pass', page.jsonLd.length + ' valid JSON-LD block(s).'));
    if (types.length) checks.push(check('jsonld-types', 'Schema types', 'pass', 'Types found: ' + types.slice(0, 6).join(', ') + '.'));
  }
  return buildCategory('structuredData', 'Structured data', checks);
}

function analyzePerformanceSignals(page, fetchMeta) {
  var checks = [];
  var htmlKb = Math.round(page.htmlBytes / 1024);
  if (page.htmlBytes > 400 * 1024) checks.push(check('html-huge', 'HTML size', 'fail', 'HTML document is ' + htmlKb + 'KB.', 'Move inline scripts/styles to cached external files and trim markup — heavy HTML delays every render.'));
  else if (page.htmlBytes > 150 * 1024) checks.push(check('html-large', 'HTML size', 'warn', 'HTML document is ' + htmlKb + 'KB.', 'Consider externalizing inline CSS/JS; under ~150KB of HTML keeps first paint fast on 3G.'));
  else checks.push(check('html-ok', 'HTML size', 'pass', 'HTML document is ' + htmlKb + 'KB.'));

  if (fetchMeta && Number.isFinite(fetchMeta.responseTimeMs)) {
    var ms = Math.round(fetchMeta.responseTimeMs);
    if (ms > 3000) checks.push(check('ttfb-slow', 'Server response', 'fail', 'Document responded in ' + ms + 'ms.', 'Aim for under 800ms — check hosting, caching, and redirects.'));
    else if (ms > 1200) checks.push(check('ttfb-warn', 'Server response', 'warn', 'Document responded in ' + ms + 'ms.', 'Aim for under 800ms with caching or a CDN.'));
    else checks.push(check('ttfb-ok', 'Server response', 'pass', 'Document responded in ' + ms + 'ms.'));
  }

  if (fetchMeta && fetchMeta.contentEncoding) {
    checks.push(check('compression-ok', 'Compression', 'pass', 'Response compressed with ' + fetchMeta.contentEncoding + '.'));
  } else if (fetchMeta) {
    checks.push(check('compression-missing', 'Compression', 'warn', 'No content-encoding header seen.', 'Enable gzip or brotli compression on the server or CDN.'));
  }

  if (page.scriptCount > 25) checks.push(check('scripts-many', 'Script count', 'warn', page.scriptCount + ' script tags on the page.', 'Audit third-party scripts; each one costs main-thread time on low-end phones.'));
  else checks.push(check('scripts-ok', 'Script count', 'pass', page.scriptCount + ' script tags.'));

  if (fetchMeta && Array.isArray(fetchMeta.redirects) && fetchMeta.redirects.length > 1) {
    checks.push(check('redirect-chain', 'Redirect chain', 'warn', fetchMeta.redirects.length + ' redirects before the final URL.', 'Link and canonicalize directly to the final URL; every hop adds latency and leaks signals.'));
  }

  return buildCategory('performanceSignals', 'Speed signals', checks);
}

function extractPage(html, url, fetchMeta) {
  html = String(html || '');
  var metas = collectTags(html, 'meta');
  var links = collectTags(html, 'link');
  var images = collectTags(html, 'img');
  var isHttps = /^https:/i.test(url || '');
  var host = safeHostname(url);

  var anchors = [];
  var anchorRe = /<a\b[^>]*>([\s\S]*?)<\/a>/gi;
  var anchorMatch;
  var guard = 0;
  while ((anchorMatch = anchorRe.exec(html)) !== null && guard < 5000) {
    guard += 1;
    var attrs = parseAttributes(anchorMatch[0].slice(0, anchorMatch[0].indexOf('>') + 1));
    anchors.push({ href: attrs.href || '', text: stripTags(anchorMatch[1]), ariaLabel: attrs['aria-label'] || '' });
  }

  var internal = 0;
  var external = 0;
  var emptyAnchors = 0;
  anchors.forEach(function (anchor) {
    var href = anchor.href;
    if (!href || href.indexOf('#') === 0 || /^(javascript|mailto|tel):/i.test(href)) return;
    var linkHost = safeHostname(/^https?:/i.test(href) ? href : 'https://' + host + (href.charAt(0) === '/' ? href : '/' + href));
    if (!linkHost || linkHost === host) internal += 1;
    else external += 1;
    if (!anchor.text && !anchor.ariaLabel) emptyAnchors += 1;
  });

  var mixedContent = [];
  if (isHttps) {
    var srcRe = /(?:src|href)\s*=\s*["'](http:\/\/[^"']+)["']/gi;
    var srcMatch;
    while ((srcMatch = srcRe.exec(html)) !== null && mixedContent.length < 50) {
      if (!/^http:\/\/www\.w3\.org/i.test(srcMatch[1])) mixedContent.push(srcMatch[1]);
    }
  }

  var charsetMeta = metas.filter(function (meta) { return meta.charset; })[0];
  var contentTypeMeta = metas.filter(function (meta) {
    return String(meta['http-equiv'] || '').toLowerCase() === 'content-type';
  })[0];
  var langMatch = /<html\b[^>]*\blang\s*=\s*["']?([a-zA-Z-]+)/i.exec(html);
  var canonicalLinks = linksByRel(links, 'canonical');
  var iconLinks = linksByRel(links, 'icon').concat(linksByRel(links, 'shortcut icon'));
  var hreflangs = linksByRel(links, 'alternate').filter(function (link) { return link.hreflang; });

  var textContent = stripTags(html);

  return {
    url: url || '',
    isHttps: isHttps,
    htmlBytes: Buffer.byteLength(html, 'utf8'),
    title: getTitle(html),
    metaDescription: metaByName(metas, 'description'),
    robotsMeta: metaByName(metas, 'robots'),
    viewport: metaByName(metas, 'viewport'),
    charset: charsetMeta ? charsetMeta.charset : (contentTypeMeta ? contentTypeMeta.content : ''),
    lang: langMatch ? langMatch[1] : '',
    canonical: canonicalLinks.length ? canonicalLinks[0].href : '',
    favicon: iconLinks.length ? iconLinks[0].href : '',
    hreflangs: hreflangs,
    headings: collectHeadings(html),
    images: images,
    links: { total: internal + external, internal: internal, external: external, emptyAnchors: emptyAnchors },
    mixedContent: mixedContent,
    og: {
      title: metaByProperty(metas, 'og:title'),
      description: metaByProperty(metas, 'og:description'),
      image: metaByProperty(metas, 'og:image')
    },
    twitterCard: metaByName(metas, 'twitter:card') || metaByProperty(metas, 'twitter:card'),
    jsonLd: collectJsonLd(html),
    wordCount: textContent ? textContent.split(/\s+/).length : 0,
    scriptCount: (html.match(/<script\b/gi) || []).length
  };
}

function analyzeHtml(input) {
  var html = input && input.html || '';
  var url = input && input.url || '';
  var fetchMeta = input && input.fetchMeta || null;
  var page = extractPage(html, url, fetchMeta);

  var categories = [
    analyzeMetadata(page),
    analyzeIndexing(page, fetchMeta),
    analyzeContent(page),
    analyzeLinks(page),
    analyzeSocial(page),
    analyzeStructuredData(page),
    analyzePerformanceSignals(page, fetchMeta)
  ];

  var totalScore = 0;
  categories.forEach(function (category) { totalScore += category.score; });
  var score = Math.round(totalScore / categories.length);
  var grade = score >= 90 ? 'A' : score >= 75 ? 'B' : score >= 60 ? 'C' : score >= 40 ? 'D' : 'F';

  var issues = [];
  categories.forEach(function (category) {
    category.checks.forEach(function (item) {
      if (item.status !== 'pass') {
        issues.push({ category: category.label, label: item.label, status: item.status, detail: item.detail, fix: item.fix });
      }
    });
  });
  issues.sort(function (a, b) {
    return (a.status === 'fail' ? 0 : 1) - (b.status === 'fail' ? 0 : 1);
  });

  return {
    url: url,
    score: score,
    grade: grade,
    categories: categories,
    issues: issues,
    page: {
      title: page.title,
      titleLength: page.title.length,
      metaDescription: page.metaDescription,
      descriptionLength: page.metaDescription.length,
      canonical: page.canonical,
      wordCount: page.wordCount,
      h1Count: page.headings.filter(function (heading) { return heading.level === 1; }).length,
      imageCount: page.images.length,
      internalLinks: page.links.internal,
      externalLinks: page.links.external,
      jsonLdTypes: page.jsonLd.reduce(function (types, block) { return types.concat(block.types || []); }, []),
      htmlBytes: page.htmlBytes
    }
  };
}

module.exports = {
  analyzeHtml: analyzeHtml,
  extractPage: extractPage,
  stripTags: stripTags,
  parseAttributes: parseAttributes,
  collectJsonLd: collectJsonLd,
  gradeFromChecks: gradeFromChecks
};
