#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execFile } = require('child_process');
const { promisify } = require('util');

const ROOT = path.resolve(__dirname, '..');
const DATA_PATH = path.join(ROOT, 'data', 'government', 'africa-election-tracker.json');
const STRICT_LATEST = process.argv.includes('--strict-latest');
const TIMEOUT_MS = 30000;
const execFileAsync = promisify(execFile);

function decodeEntities(value) {
  return String(value || '')
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&#8217;/g, "'")
    .replace(/&#8211;/g, '-')
    .replace(/&#8212;/g, '-')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

function tag(block, name) {
  const match = block.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)<\\/${name}>`, 'i'));
  return match ? decodeEntities(match[1]) : '';
}

function atomLink(block) {
  const hrefMatch = block.match(/<link\b[^>]*href=["']([^"']+)["'][^>]*>/i);
  return hrefMatch ? decodeEntities(hrefMatch[1]) : '';
}

function extractItems(xml) {
  const rssItems = Array.from(String(xml).matchAll(/<item\b[\s\S]*?<\/item>/gi)).map((match) => {
    const block = match[0];
    return {
      title: tag(block, 'title'),
      link: tag(block, 'link'),
      publishedAt: tag(block, 'pubDate'),
    };
  });

  if (rssItems.length) return rssItems;

  return Array.from(String(xml).matchAll(/<entry\b[\s\S]*?<\/entry>/gi)).map((match) => {
    const block = match[0];
    return {
      title: tag(block, 'title'),
      link: atomLink(block) || tag(block, 'id'),
      publishedAt: tag(block, 'updated') || tag(block, 'published'),
    };
  });
}

async function fetchWithNode(feed) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(feed.feedUrl, {
      headers: {
        'accept': 'application/rss+xml, application/atom+xml, application/xml, text/xml;q=0.9, */*;q=0.8',
        'user-agent': 'AfroTools election tracker feed checker',
      },
      signal: controller.signal,
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return await response.text();
  } finally {
    clearTimeout(timer);
  }
}

async function fetchWithCurl(feed) {
  const curlBin = process.platform === 'win32' ? 'curl.exe' : 'curl';
  const { stdout } = await execFileAsync(curlBin, [
    '-fsSL',
    '--max-time',
    String(Math.ceil(TIMEOUT_MS / 1000)),
    '-A',
    'AfroTools election tracker feed checker',
    feed.feedUrl,
  ], {
    maxBuffer: 5 * 1024 * 1024,
  });
  return stdout;
}

async function fetchFeed(feed) {
  try {
    return await fetchWithNode(feed);
  } catch (error) {
    try {
      return await fetchWithCurl(feed);
    } catch (curlError) {
      throw new Error(`${error.message}; curl fallback failed: ${curlError.message}`);
    }
  }
}

async function main() {
  const data = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));
  const feeds = (data.newsFeeds || []).filter((feed) => feed.feedUrl);
  const failures = [];

  if (!feeds.length) {
    failures.push('No RSS feeds are configured in data/government/africa-election-tracker.json');
  }

  for (const feed of feeds) {
    try {
      const xml = await fetchFeed(feed);
      const items = extractItems(xml);
      if (!items.length) {
        failures.push(`${feed.id}: no RSS/Atom items found`);
        continue;
      }

      const first = items[0];
      if (!first.title || !first.link) {
        failures.push(`${feed.id}: first item is missing a title or link`);
        continue;
      }

      if (STRICT_LATEST && feed.latestItem && feed.latestItem.title !== first.title) {
        failures.push(`${feed.id}: latest item changed from "${feed.latestItem.title}" to "${first.title}"`);
        continue;
      }

      console.log(`${feed.id}: ok - ${first.title}`);
    } catch (error) {
      failures.push(`${feed.id}: ${error.message}`);
    }
  }

  if (failures.length) {
    console.error('Africa election tracker feed check failed:');
    for (const failure of failures) console.error(`- ${failure}`);
    process.exit(1);
  }

  console.log(`Africa election tracker feed check passed: ${feeds.length} RSS feeds reachable.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
