const fs = require("fs");
const path = require("path");

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];

    if (inQuotes) {
      if (char === '"' && next === '"') {
        cell += '"';
        index += 1;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        cell += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      row.push(cell);
      cell = "";
    } else if (char === "\n") {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else if (char !== "\r") {
      cell += char;
    }
  }

  if (cell.length || row.length) {
    row.push(cell);
    rows.push(row);
  }

  if (!rows.length) return [];
  const headers = rows.shift().map((header) => header.trim());
  return rows
    .filter((line) => line.some((value) => String(value || "").trim()))
    .map((line) => Object.fromEntries(headers.map((header, index) => [header, line[index] || ""])));
}

function parseArgs(argv) {
  const options = { files: [], output: "" };
  for (let index = 0; index < argv.length; index += 1) {
    if (argv[index] === "--output") {
      options.output = argv[index + 1] || "";
      index += 1;
    } else {
      options.files.push(argv[index]);
    }
  }
  return options;
}

function extractLinks(html) {
  const links = [];
  const anchorPattern = /<a\b[^>]*\bhref=["'](https?:\/\/(?:www\.)?afrotools\.com\/?[^"'#\s]*)["'][^>]*>/gi;
  let match;

  while ((match = anchorPattern.exec(html))) {
    const tag = match[0];
    const relMatch = tag.match(/\brel=["']([^"']*)["']/i);
    links.push({
      href: match[1],
      rel: relMatch ? relMatch[1].trim() : ""
    });
  }

  return Array.from(new Map(links.map((link) => [`${link.href}|${link.rel}`, link])).values());
}

async function inspectUrl(url, timeoutMs) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "user-agent": "Mozilla/5.0 (compatible; AfroToolsBacklinkVerifier/1.0; +https://afrotools.com/)"
      }
    });
    const html = await response.text();
    return {
      source_url: url,
      final_url: response.url,
      http_status: response.status,
      links: extractLinks(html),
      checked_at: new Date().toISOString()
    };
  } catch (error) {
    return {
      source_url: url,
      final_url: "",
      http_status: 0,
      links: [],
      error: `${error.name}: ${error.message}`,
      checked_at: new Date().toISOString()
    };
  } finally {
    clearTimeout(timeout);
  }
}

async function inspectAll(urls, concurrency, timeoutMs) {
  const results = new Array(urls.length);
  let cursor = 0;

  async function worker() {
    while (cursor < urls.length) {
      const index = cursor;
      cursor += 1;
      results[index] = await inspectUrl(urls[index], timeoutMs);
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, urls.length) }, worker));
  return results;
}

async function main() {
  const root = path.join(__dirname, "..");
  const options = parseArgs(process.argv.slice(2));
  if (!options.files.length) {
    throw new Error("Usage: node scripts/monitor-backlink-placements.js <queue.csv> [more.csv] [--output report.json]");
  }

  const urls = Array.from(new Set(options.files.flatMap((file) => {
    const filePath = path.resolve(root, file);
    return parseCsv(fs.readFileSync(filePath, "utf8"))
      .map((row) => row.source_url || row.submission_url || "")
      .filter((url) => /^https?:\/\//i.test(url));
  })));

  const concurrency = Math.max(1, Number(process.env.BACKLINK_MONITOR_CONCURRENCY) || 8);
  const timeoutMs = Math.max(1000, Number(process.env.BACKLINK_MONITOR_TIMEOUT_MS) || 15000);
  const results = await inspectAll(urls, concurrency, timeoutMs);
  const verified = results.filter((result) => result.links.length > 0);
  const statusCounts = results.reduce((counts, result) => {
    const key = String(result.http_status || "error");
    counts[key] = (counts[key] || 0) + 1;
    return counts;
  }, {});
  const report = {
    generated_at: new Date().toISOString(),
    source_files: options.files,
    checked_urls: results.length,
    verified_source_pages: verified.length,
    verified_links: verified.reduce((count, result) => count + result.links.length, 0),
    status_counts: statusCounts,
    verified,
    inconclusive: results.filter((result) => result.http_status !== 200 && !result.links.length)
  };
  const output = `${JSON.stringify(report, null, 2)}\n`;

  if (options.output) {
    const outputPath = path.resolve(root, options.output);
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, output, "utf8");
  }
  process.stdout.write(output);
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exitCode = 1;
});
