const fs = require("fs");
const path = require("path");

const DISCOVERY_URL = "https://launchdirectories.com/dofollow-directories";
const EXCLUDED_HOSTS = new Set([
  "launchdirectories.com",
  "www.launchdirectories.com",
  "dirstarter.com",
  "coveragepush.com",
  "twitter.com",
  "x.com"
]);

function decodeEntities(value) {
  return String(value || "")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function stripTags(value) {
  return decodeEntities(String(value || "").replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();
}

function extractTitle(html) {
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return match ? stripTags(match[1]) : "";
}

function extractCandidateHosts(html) {
  const hosts = new Set();
  const hrefPattern = /\bhref=["'](https?:\/\/[^"'#\s]+)["']/gi;
  let match;

  while ((match = hrefPattern.exec(html))) {
    try {
      const host = new URL(decodeEntities(match[1])).hostname.toLowerCase();
      if (!EXCLUDED_HOSTS.has(host)) hosts.add(host);
    } catch (_) {
      // Ignore malformed discovery links.
    }
  }

  return Array.from(hosts).sort();
}

function extractActionLinks(html, baseUrl) {
  const links = [];
  const anchorPattern = /<a\b([^>]*)>([\s\S]*?)<\/a>/gi;
  let match;

  while ((match = anchorPattern.exec(html))) {
    const hrefMatch = match[1].match(/\bhref=["']([^"']+)["']/i);
    if (!hrefMatch) continue;
    const label = stripTags(match[2]);
    const rawHref = decodeEntities(hrefMatch[1]);
    if (!/(submit|add|list|launch|join|claim|create)[^\s]*/i.test(`${label} ${rawHref}`)) continue;

    try {
      const href = new URL(rawHref, baseUrl).toString();
      if (!/^https?:/i.test(href)) continue;
      links.push({ label, href });
    } catch (_) {
      // Ignore malformed action links.
    }
  }

  return Array.from(new Map(links.map((link) => [link.href, link])).values()).slice(0, 12);
}

async function fetchPage(url, timeoutMs) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "user-agent": "Mozilla/5.0 (compatible; AfroToolsDirectoryResearch/1.0; +https://afrotools.com/)"
      }
    });
    const html = await response.text();
    return { response, html };
  } finally {
    clearTimeout(timeout);
  }
}

async function inspectHost(host, timeoutMs) {
  const url = `https://${host}/`;
  try {
    const { response, html } = await fetchPage(url, timeoutMs);
    return {
      domain: host,
      source_url: url,
      final_url: response.url,
      http_status: response.status,
      title: extractTitle(html),
      existing_afrotools_mention: /afrotools\.com|\bafrotools\b/i.test(html),
      action_links: extractActionLinks(html, response.url),
      checked_at: new Date().toISOString()
    };
  } catch (error) {
    return {
      domain: host,
      source_url: url,
      final_url: "",
      http_status: 0,
      title: "",
      existing_afrotools_mention: false,
      action_links: [],
      error: `${error.name}: ${error.message}`,
      checked_at: new Date().toISOString()
    };
  }
}

async function inspectAll(hosts, concurrency, timeoutMs) {
  const results = new Array(hosts.length);
  let cursor = 0;

  async function worker() {
    while (cursor < hosts.length) {
      const index = cursor;
      cursor += 1;
      results[index] = await inspectHost(hosts[index], timeoutMs);
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, hosts.length) }, worker));
  return results;
}

async function main() {
  const root = path.join(__dirname, "..");
  const outputArgIndex = process.argv.indexOf("--output");
  const outputPath = outputArgIndex >= 0 ? process.argv[outputArgIndex + 1] : "";
  const concurrency = Math.max(1, Number(process.env.BACKLINK_QUALIFY_CONCURRENCY) || 10);
  const timeoutMs = Math.max(1000, Number(process.env.BACKLINK_QUALIFY_TIMEOUT_MS) || 12000);
  const discovery = await fetchPage(DISCOVERY_URL, timeoutMs);
  const hosts = extractCandidateHosts(discovery.html);
  const candidates = await inspectAll(hosts, concurrency, timeoutMs);
  const report = {
    generated_at: new Date().toISOString(),
    discovery_url: DISCOVERY_URL,
    discovered_domains: hosts.length,
    reachable_domains: candidates.filter((candidate) => candidate.http_status > 0).length,
    domains_with_action_links: candidates.filter((candidate) => candidate.action_links.length > 0).length,
    existing_afrotools_mentions: candidates.filter((candidate) => candidate.existing_afrotools_mention),
    candidates
  };
  const output = `${JSON.stringify(report, null, 2)}\n`;

  if (outputPath) {
    const absoluteOutput = path.resolve(root, outputPath);
    fs.mkdirSync(path.dirname(absoluteOutput), { recursive: true });
    fs.writeFileSync(absoluteOutput, output, "utf8");
  }
  process.stdout.write(output);
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exitCode = 1;
});
