// netlify/functions/afrostream-news-monitor.js
// Scheduled AfroStream RSS mention monitor.
// Reads configured RSS/Atom feeds, matches published AfroStream creators, and writes as_news rows.
var { isScheduledEvent } = require('./_shared/scheduled-event');
var SUPABASE_URL = 'https://zpclagtgczsygrgztlts.supabase.co';
var SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_DATA_SERVICE_ROLE_KEY;
var ADMIN_SECRET = process.env.ADMIN_SECRET;
var ENV_FEEDS = process.env.AFROSTREAM_NEWS_RSS_FEEDS || '';
var MAX_CONCURRENT_FEEDS = 6;
var FEED_TIMEOUT_MS = 9000;
var DEFAULT_SCHEDULED_LOOKBACK_DAYS = 3;
var DEFAULT_MANUAL_LOOKBACK_DAYS = 10;
var DEFAULT_SCHEDULED_INSERT_LIMIT = 12;
var DEFAULT_MANUAL_INSERT_LIMIT = 30;

function headers() {
  return { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' };
}

function getHeader(event, headerName) {
  var headers = (event && event.headers) || {};
  var expected = String(headerName || '').toLowerCase();
  var keys = Object.keys(headers);
  for (var i = 0; i < keys.length; i++) {
    if (String(keys[i]).toLowerCase() === expected) return headers[keys[i]];
  }
  return '';
}

function isScheduled(event) {
  return isScheduledEvent(event);
}

function isAuthorized(event) {
  if (isScheduled(event)) return true;
  if (!ADMIN_SECRET) return false;
  var auth = getHeader(event, 'authorization');
  return auth === 'Bearer ' + ADMIN_SECRET;
}

function isTruthy(value) {
  return /^(1|true|yes)$/i.test(String(value || '').trim());
}

function isDryRun(event) {
  var qs = event.queryStringParameters || {};
  return isTruthy(qs.dry_run) || isTruthy(qs.dryRun) || isTruthy(qs.review_only);
}

function numberParam(event, keys, fallback, min, max) {
  var qs = event.queryStringParameters || {};
  for (var i = 0; i < keys.length; i++) {
    var value = Number(qs[keys[i]]);
    if (Number.isFinite(value)) {
      return Math.min(max, Math.max(min, value));
    }
  }
  return fallback;
}

async function sb(method, path, body, upsert) {
  var opts = {
    method: method,
    headers: {
      apikey: SUPABASE_SERVICE_KEY,
      Authorization: 'Bearer ' + SUPABASE_SERVICE_KEY,
      'Content-Type': 'application/json',
      'Prefer': upsert ? 'return=representation,resolution=merge-duplicates' : 'return=representation'
    }
  };
  if (body) opts.body = JSON.stringify(body);
  var res = await fetch(SUPABASE_URL + '/rest/v1/' + path, opts);
  var text = await res.text();
  var parsed = null;
  try { parsed = text ? JSON.parse(text) : null; } catch (e) { parsed = text; }
  if (!res.ok) {
    var message = parsed && parsed.message ? parsed.message : text;
    throw new Error('Supabase ' + method + ' ' + path + ' failed: ' + res.status + (message ? ' ' + message : ''));
  }
  return parsed;
}

function newsMonitorSource(event) {
  return isScheduled(event) ? 'Netlify Scheduled Function' : 'Manual news monitor endpoint';
}

async function recordNewsMonitorRun(status, source, recordsCount, errorMessage, durationMs, dryRun) {
  if (dryRun) return;
  try {
    await sb('POST', 'scraper_runs', {
      scraper_id: 'afrostream-news-monitor',
      status: status,
      source: source,
      records_count: recordsCount || 0,
      error_message: errorMessage || null,
      duration_ms: durationMs || 0,
      fetched_at: new Date().toISOString()
    });
  } catch (e) {
    console.error('AfroStream news monitor run logging failed:', e.message);
  }
}

async function updateSourceHealth(source, fields, dryRun) {
  if (dryRun || !source || !source.id) return;
  try {
    await sb('PATCH', 'as_news_sources?id=eq.' + source.id, fields);
  } catch (e) {
    console.error('AfroStream news source health update failed for', source.id, e.message);
  }
}

function decodeXml(value) {
  return String(value || '')
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function stripHtml(value) {
  return decodeXml(value).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function tag(block, name) {
  var re = new RegExp('<(?:[^:>]+:)?' + name + '[^>]*>([\\s\\S]*?)<\\/(?:[^:>]+:)?' + name + '>', 'i');
  var match = block.match(re);
  return match ? decodeXml(match[1]).trim() : '';
}

function attrTag(block, name, attr) {
  var re = new RegExp("<(?:[^:>]+:)?" + name + "[^>]*\\s" + attr + "=[\"']([^\"']+)[\"'][^>]*\\/?>", 'i');
  var match = block.match(re);
  return match ? decodeXml(match[1]).trim() : '';
}

function slugify(value) {
  var slug = String(value || '').toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 74);
  return slug || 'afrostream-mention';
}

function hash(value) {
  var h = 0;
  var str = String(value || '');
  for (var i = 0; i < str.length; i++) {
    h = ((h << 5) - h) + str.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h).toString(36);
}

function parseFeedsFromEnv() {
  if (!ENV_FEEDS.trim()) return [];
  try {
    var parsed = JSON.parse(ENV_FEEDS);
    if (Array.isArray(parsed)) {
      return parsed.map(function(item, idx) {
        if (typeof item === 'string') return { name: 'RSS source ' + (idx + 1), feed_url: item, category: 'creator-news' };
        return { name: item.name || ('RSS source ' + (idx + 1)), feed_url: item.feed_url || item.url, category: item.category || 'creator-news' };
      }).filter(function(item) { return item.feed_url; });
    }
  } catch (e) {}
  return ENV_FEEDS.split(/[\n,]+/).map(function(url, idx) {
    return { name: 'RSS source ' + (idx + 1), feed_url: url.trim(), category: 'creator-news' };
  }).filter(function(item) { return item.feed_url; });
}

function parseFeed(xml) {
  var items = [];
  var blocks = xml.match(/<item[\s\S]*?<\/item>/gi) || xml.match(/<entry[\s\S]*?<\/entry>/gi) || [];
  blocks.forEach(function(block) {
    var title = stripHtml(tag(block, 'title'));
    var link = stripHtml(tag(block, 'link')) || attrTag(block, 'link', 'href');
    var guid = stripHtml(tag(block, 'guid')) || stripHtml(tag(block, 'id')) || link || title;
    var description = stripHtml(tag(block, 'description') || tag(block, 'summary') || tag(block, 'content'));
    var publishedRaw = stripHtml(tag(block, 'pubDate') || tag(block, 'published') || tag(block, 'updated'));
    var publishedAt = publishedRaw ? new Date(publishedRaw) : new Date();
    if (!title || !guid) return;
    items.push({
      title: title,
      link: link,
      guid: guid,
      description: description,
      published_at: isNaN(publishedAt.getTime()) ? new Date().toISOString() : publishedAt.toISOString()
    });
  });
  return items;
}

function normalizeForMatch(value) {
  return stripHtml(value)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function creatorAliases(name) {
  var raw = String(name || '').trim();
  var aliases = [raw];
  var withoutParenthetical = raw.replace(/\s*\([^)]*\)\s*/g, ' ').trim();
  if (withoutParenthetical && withoutParenthetical !== raw) aliases.push(withoutParenthetical);
  var parenthetical = raw.match(/\(([^)]+)\)/);
  if (parenthetical && parenthetical[1]) aliases.push(parenthetical[1]);
  return aliases.filter(function(alias, idx, all) {
    return alias && all.indexOf(alias) === idx;
  });
}

function aliasMatches(haystack, alias) {
  var normalizedAlias = normalizeForMatch(alias);
  if (!normalizedAlias) return false;
  var tokens = normalizedAlias.split(' ').filter(Boolean);
  if (tokens.length === 1 && tokens[0].length < 4) return false;
  return (' ' + haystack + ' ').indexOf(' ' + normalizedAlias + ' ') !== -1;
}

function isEditoriallyRelevant(item, source) {
  var haystack = normalizeForMatch([
    source && source.category,
    item.title,
    item.description
  ].join(' '));
  var keywords = [
    'album', 'award', 'awards', 'business', 'chart', 'collaboration',
    'concert', 'creator', 'creators', 'creator economy', 'festival',
    'film', 'funding', 'game', 'gaming', 'launch', 'line up', 'lineup',
    'livestream', 'monetisation', 'monetization', 'music', 'partnership',
    'platform', 'podcast', 'payout', 'record', 'single', 'spotify',
    'streaming', 'studio', 'tiktok', 'tour', 'youtube'
  ];
  return keywords.some(function(keyword) {
    return (' ' + haystack + ' ').indexOf(' ' + keyword + ' ') !== -1;
  });
}

function hasAfricaSignal(item, source) {
  var haystack = normalizeForMatch([
    source && source.name,
    source && source.category,
    item.title,
    item.description
  ].join(' '));
  var signals = [
    'africa', 'african', 'afrobeats', 'afrobeat', 'afro', 'nigeria',
    'nigerian', 'ghana', 'ghanaian', 'kenya', 'kenyan', 'south africa',
    'south african', 'rwanda', 'rwandan', 'uganda', 'ugandan', 'tanzania',
    'ethiopia', 'morocco', 'zambia', 'zambian', 'lagos', 'nairobi',
    'accra', 'kigali', 'johannesburg', 'cape town'
  ];
  return signals.some(function(signal) {
    return (' ' + haystack + ' ').indexOf(' ' + signal + ' ') !== -1;
  });
}

function isRecentEnough(item, cutoffMs) {
  if (!cutoffMs) return true;
  var publishedAt = new Date(item.published_at).getTime();
  if (!Number.isFinite(publishedAt)) return true;
  return publishedAt >= cutoffMs;
}

function shouldPublishWithoutCreatorMatch(item, source, cutoffMs) {
  return isRecentEnough(item, cutoffMs) &&
    isEditoriallyRelevant(item, source) &&
    hasAfricaSignal(item, source);
}

function findCreatorMatches(item, creators) {
  var haystack = normalizeForMatch(item.title + ' ' + item.description);
  return creators.filter(function(creator) {
    return creatorAliases(creator.name).some(function(alias) {
      return aliasMatches(haystack, alias);
    });
  });
}

async function fetchFeed(source) {
  var controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
  var timeout = controller ? setTimeout(function() { controller.abort(); }, FEED_TIMEOUT_MS) : null;
  try {
    return await fetch(source.feed_url, {
      signal: controller ? controller.signal : undefined,
      headers: {
        'Accept': 'application/rss+xml, application/atom+xml, application/xml, text/xml, text/html, */*',
        'User-Agent': 'Mozilla/5.0 (compatible; AfroStreamNewsMonitor/1.1; +https://afrotools.com/tools/afrostream/)'
      }
    });
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}

async function mapWithConcurrency(items, limit, iterator) {
  var results = new Array(items.length);
  var cursor = 0;
  async function worker() {
    while (cursor < items.length) {
      var current = cursor++;
      results[current] = await iterator(items[current], current);
    }
  }
  var workers = [];
  var count = Math.min(limit, items.length);
  for (var i = 0; i < count; i++) workers.push(worker());
  await Promise.all(workers);
  return results;
}

async function processNewsCandidate(source, item, matches, summary, dryRun, insertBudget) {
  var externalId = hash(source.feed_url + '|' + item.guid);
  var existingRows = await sb('GET', 'as_news?external_id=eq.' + encodeURIComponent(externalId) + '&select=id,slug,external_id');
  var existingNews = Array.isArray(existingRows) && existingRows.length ? existingRows[0] : null;
  summary.matched_items++;

  if (dryRun) {
    if (existingNews) summary.existing_news++;
    else summary.would_insert_news++;
    summary.would_create_mentions += matches.length;
    if (summary.matches.length < 25) {
      summary.matches.push({
        source: source.name || 'RSS source',
        title: item.title,
        source_url: item.link || source.feed_url,
        external_id: externalId,
        existing_news_id: existingNews ? existingNews.id : null,
        matched_creators: matches.map(function(match) {
          return { id: match.id, name: match.name, slug: match.slug };
        })
      });
    }
    return;
  }

  if (!existingNews && insertBudget.remaining <= 0) {
    summary.skipped_matches++;
    if (summary.skipped.length < 25) {
      summary.skipped.push({
        source: source.name || 'RSS source',
        title: item.title,
        source_url: item.link || source.feed_url,
        reason: 'Run insert limit reached.'
      });
    }
    return;
  }

  var newsRows = await sb('POST', 'as_news?on_conflict=external_id', {
    title: item.title,
    slug: slugify(item.title) + '-' + externalId.slice(0, 6),
    category: source.category || 'creator-news',
    author: source.name || 'RSS source',
    excerpt: item.description || (matches.length ? 'Creator mention from ' : 'AfroStream source update from ') + (source.name || 'RSS source'),
    body: item.description || item.title,
    source_url: item.link || source.feed_url,
    source_name: source.name || 'RSS source',
    external_id: externalId,
    is_featured: false,
    is_published: true,
    published_at: item.published_at
  }, true);
  var news = Array.isArray(newsRows) ? newsRows[0] : null;
  if (!news || !news.id) return;
  if (existingNews) summary.existing_news++;
  else {
    summary.inserted_news++;
    insertBudget.remaining--;
  }

  for (var m = 0; m < matches.length; m++) {
    await sb('POST', 'as_news_creator_mentions?on_conflict=news_id,creator_id', {
      news_id: news.id,
      creator_id: matches[m].id,
      matched_name: matches[m].name,
      source_url: item.link || source.feed_url
    }, true);
    summary.mentions++;
  }
}

async function processSource(source, creators, summary, options) {
  var checkedAt = new Date().toISOString();
  var fetchedItemCount = 0;
  var fetchStatusCode = null;
  try {
    var res = await fetchFeed(source);
    fetchStatusCode = res.status;
    if (!res.ok) {
      await updateSourceHealth(source, {
        last_checked_at: checkedAt,
        last_status_code: res.status,
        last_item_count: 0,
        last_error: 'HTTP ' + res.status
      }, options.dryRun);
      summary.errors.push(source.name + ': HTTP ' + res.status);
      return;
    }
    var xml = await res.text();
    var items = parseFeed(xml).slice(0, 30);
    fetchedItemCount = items.length;
    summary.items_seen += items.length;

    for (var i = 0; i < items.length; i++) {
      var item = items[i];
      if (!isRecentEnough(item, options.cutoffMs)) continue;
      var matches = findCreatorMatches(item, creators);
      if (!matches.length && !shouldPublishWithoutCreatorMatch(item, source, options.cutoffMs)) continue;
      if (!matches.length) summary.editorial_backfill_matches++;
      if (!isEditoriallyRelevant(item, source)) {
        summary.skipped_matches++;
        if (summary.skipped.length < 25) {
          summary.skipped.push({
            source: source.name || 'RSS source',
            title: item.title,
            source_url: item.link || source.feed_url,
            reason: 'Matched a creator name but lacked a creator, platform, music, gaming, business, or milestone signal.'
          });
        }
        continue;
      }

      await processNewsCandidate(source, item, matches, summary, options.dryRun, options.insertBudget);
    }

    await updateSourceHealth(source, {
      last_checked_at: checkedAt,
      last_success_at: checkedAt,
      last_status_code: fetchStatusCode || 200,
      last_item_count: fetchedItemCount,
      last_error: null
    }, options.dryRun);
  } catch (e) {
    await updateSourceHealth(source, {
      last_checked_at: checkedAt,
      last_status_code: fetchStatusCode,
      last_item_count: fetchedItemCount,
      last_error: e.name === 'AbortError' ? 'feed timeout' : e.message
    }, options.dryRun);
    summary.errors.push((source.name || source.feed_url) + ': ' + (e.name === 'AbortError' ? 'feed timeout' : e.message));
  }
}

exports.handler = async function(event) {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: headers(), body: '' };
  if (!isAuthorized(event)) return { statusCode: 401, headers: headers(), body: JSON.stringify({ success: false, error: 'Unauthorized' }) };
  if (!SUPABASE_SERVICE_KEY) return { statusCode: 500, headers: headers(), body: JSON.stringify({ success: false, error: 'Supabase service key not configured' }) };

  var runStart = Date.now();
  var runSource = newsMonitorSource(event);
  var dryRun = isDryRun(event);
  var lookbackDays = numberParam(event, ['backfill_days', 'lookback_days'], isScheduled(event) ? DEFAULT_SCHEDULED_LOOKBACK_DAYS : DEFAULT_MANUAL_LOOKBACK_DAYS, 1, 21);
  var insertLimit = numberParam(event, ['max_insert_news', 'limit'], isScheduled(event) ? DEFAULT_SCHEDULED_INSERT_LIMIT : DEFAULT_MANUAL_INSERT_LIMIT, 1, 60);
  var cutoffMs = Date.now() - (lookbackDays * 24 * 60 * 60 * 1000);
  var insertBudget = { remaining: insertLimit };
  var summary = {
    dry_run: dryRun,
    lookback_days: lookbackDays,
    insert_limit: insertLimit,
    sources: 0,
    creators: 0,
    items_seen: 0,
    matched_items: 0,
    editorial_backfill_matches: 0,
    would_insert_news: 0,
    existing_news: 0,
    would_create_mentions: 0,
    skipped_matches: 0,
    mentions: 0,
    inserted_news: 0,
    matches: [],
    skipped: [],
    errors: []
  };

  try {
    var dbSources = await sb('GET', 'as_news_sources?is_active=eq.true&select=id,name,feed_url,category');
    var envSources = parseFeedsFromEnv();
    var sources = []
      .concat(Array.isArray(dbSources) ? dbSources : [])
      .concat(envSources)
      .filter(function(source, idx, all) {
        return source.feed_url && all.findIndex(function(other) { return other.feed_url === source.feed_url; }) === idx;
      });
    summary.sources = sources.length;
    if (!sources.length) {
      await recordNewsMonitorRun(
        'error',
        runSource,
        0,
        'No active RSS sources configured',
        Date.now() - runStart,
        dryRun
      );
      return { statusCode: 200, headers: headers(), body: JSON.stringify({ success: true, message: 'No RSS sources configured', data: summary }) };
    }

    var creators = await sb('GET', 'as_creators?is_published=eq.true&select=id,name,slug');
    creators = Array.isArray(creators) ? creators : [];
    summary.creators = creators.length;

    await mapWithConcurrency(sources, MAX_CONCURRENT_FEEDS, function(source) {
      return processSource(source, creators, summary, {
        dryRun: dryRun,
        cutoffMs: cutoffMs,
        insertBudget: insertBudget
      });
    });

    var usefulOutputCount = summary.inserted_news + summary.existing_news + summary.mentions;
    var runStatus = summary.errors.length && usefulOutputCount === 0 ? 'error' : 'ok';
    await recordNewsMonitorRun(
      runStatus,
      runSource,
      summary.inserted_news + summary.mentions,
      summary.errors.length ? summary.errors.slice(0, 12).join(' | ').slice(0, 1000) : null,
      Date.now() - runStart,
      dryRun
    );
    return { statusCode: 200, headers: headers(), body: JSON.stringify({ success: true, data: summary }) };
  } catch (e) {
    await recordNewsMonitorRun(
      'error',
      runSource,
      summary.inserted_news + summary.mentions,
      (e.message || 'News monitor failed').slice(0, 1000),
      Date.now() - runStart,
      dryRun
    );
    return { statusCode: 500, headers: headers(), body: JSON.stringify({ success: false, error: e.message, data: summary }) };
  }
};
