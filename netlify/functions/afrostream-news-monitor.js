// netlify/functions/afrostream-news-monitor.js
// Scheduled AfroStream RSS mention monitor.
// Reads configured RSS/Atom feeds, matches published AfroStream creators, and writes as_news rows.
var SUPABASE_URL = 'https://zpclagtgczsygrgztlts.supabase.co';
var SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_DATA_SERVICE_ROLE_KEY;
var ADMIN_SECRET = process.env.ADMIN_SECRET;
var ENV_FEEDS = process.env.AFROSTREAM_NEWS_RSS_FEEDS || '';

function headers() {
  return { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' };
}

function isScheduled(event) {
  return event.httpMethod === 'GET' && event.headers && event.headers['x-nf-event'] === 'schedule';
}

function isAuthorized(event) {
  if (isScheduled(event)) return true;
  if (!ADMIN_SECRET) return false;
  var auth = (event.headers && (event.headers.authorization || event.headers.Authorization)) || '';
  return auth === 'Bearer ' + ADMIN_SECRET;
}

function isTruthy(value) {
  return /^(1|true|yes)$/i.test(String(value || '').trim());
}

function isDryRun(event) {
  var qs = event.queryStringParameters || {};
  return isTruthy(qs.dry_run) || isTruthy(qs.dryRun) || isTruthy(qs.review_only);
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

async function recordSourceHealth(source, patch, summary) {
  if (!source || !source.id) return;
  try {
    await sb('PATCH', 'as_news_sources?id=eq.' + encodeURIComponent(source.id), Object.assign({
      updated_at: new Date().toISOString()
    }, patch));
    summary.source_health_updated++;
  } catch (e) {
    summary.errors.push((source.name || source.feed_url) + ' health update: ' + e.message);
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

function findCreatorMatches(item, creators) {
  var haystack = normalizeForMatch(item.title + ' ' + item.description);
  return creators.filter(function(creator) {
    return creatorAliases(creator.name).some(function(alias) {
      return aliasMatches(haystack, alias);
    });
  });
}

exports.handler = async function(event) {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: headers(), body: '' };
  if (!isAuthorized(event)) return { statusCode: 401, headers: headers(), body: JSON.stringify({ success: false, error: 'Unauthorized' }) };
  if (!SUPABASE_SERVICE_KEY) return { statusCode: 500, headers: headers(), body: JSON.stringify({ success: false, error: 'Supabase service key not configured' }) };

  var dryRun = isDryRun(event);
  var summary = {
    dry_run: dryRun,
    sources: 0,
    creators: 0,
    items_seen: 0,
    matched_items: 0,
    would_insert_news: 0,
    existing_news: 0,
    would_create_mentions: 0,
    skipped_matches: 0,
    source_health_updated: 0,
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
      return { statusCode: 200, headers: headers(), body: JSON.stringify({ success: true, message: 'No RSS sources configured', data: summary }) };
    }

    var creators = await sb('GET', 'as_creators?is_published=eq.true&select=id,name,slug');
    creators = Array.isArray(creators) ? creators : [];
    summary.creators = creators.length;

    for (var s = 0; s < sources.length; s++) {
      var source = sources[s];
      var sourceFetched = false;
      try {
        var res = await fetch(source.feed_url, {
          headers: {
            'Accept': 'application/rss+xml, application/atom+xml, application/xml, text/xml',
            'User-Agent': 'AfroStreamMentionMonitor/1.0'
          }
        });
        if (!res.ok) {
          summary.errors.push(source.name + ': HTTP ' + res.status);
          if (!dryRun) {
            await recordSourceHealth(source, {
              last_checked_at: new Date().toISOString(),
              last_status_code: res.status,
              last_error: 'HTTP ' + res.status
            }, summary);
          }
          continue;
        }
        var xml = await res.text();
        var items = parseFeed(xml).slice(0, 30);
        sourceFetched = true;
        summary.items_seen += items.length;
        if (!dryRun) {
          await recordSourceHealth(source, {
            last_checked_at: new Date().toISOString(),
            last_success_at: new Date().toISOString(),
            last_status_code: res.status,
            last_item_count: items.length,
            last_error: null
          }, summary);
        }

        for (var i = 0; i < items.length; i++) {
          var item = items[i];
          var matches = findCreatorMatches(item, creators);
          if (!matches.length) continue;
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
            continue;
          }

          var newsRows = await sb('POST', 'as_news?on_conflict=external_id', {
            title: item.title,
            slug: slugify(item.title) + '-' + externalId.slice(0, 6),
            category: source.category || 'creator-news',
            author: source.name || 'RSS source',
            excerpt: item.description || ('Creator mention from ' + (source.name || 'RSS source')),
            body: item.description || item.title,
            source_url: item.link || source.feed_url,
            source_name: source.name || 'RSS source',
            external_id: externalId,
            is_featured: false,
            is_published: true,
            published_at: item.published_at
          }, true);
          var news = Array.isArray(newsRows) ? newsRows[0] : null;
          if (!news || !news.id) continue;
          if (existingNews) summary.existing_news++;
          else summary.inserted_news++;

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
      } catch (e) {
        summary.errors.push((source.name || source.feed_url) + ': ' + e.message);
        if (!dryRun && !sourceFetched) {
          await recordSourceHealth(source, {
            last_checked_at: new Date().toISOString(),
            last_status_code: null,
            last_error: e.message
          }, summary);
        }
      }
    }

    return { statusCode: 200, headers: headers(), body: JSON.stringify({ success: true, data: summary }) };
  } catch (e) {
    return { statusCode: 500, headers: headers(), body: JSON.stringify({ success: false, error: e.message, data: summary }) };
  }
};
