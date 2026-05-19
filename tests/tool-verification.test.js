#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const EXCLUDED_DIRS = new Set([".git", ".netlify", ".cache", "audit-results", "dist", "node_modules", "playwright-report", "test-results"]);
const TARGET_RE = /(^|[\\/])(?:fr[\\/])?[^\\/]+[\\/](?:[a-z]{2}-(?:paye|vat)|ng-salary-tax)\.html$/i;
const REDIRECT_STATUS_RE = /^(?:301|302|307|308|410)!?$/;

function walk(start, out = []) {
  if (!fs.existsSync(start)) return out;
  for (const entry of fs.readdirSync(start, { withFileTypes: true })) {
    if (EXCLUDED_DIRS.has(entry.name)) continue;
    const fullPath = path.join(start, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath, out);
    } else if (entry.isFile() && entry.name.endsWith(".html")) {
      out.push(fullPath);
    }
  }
  return out;
}

function rel(filePath) {
  return path.relative(ROOT, filePath).replace(/\\/g, "/");
}

function normalizeRoute(route) {
  let clean = String(route || "/").split(/[?#]/)[0] || "/";
  if (!clean.startsWith("/")) clean = `/${clean}`;
  if (clean.length > 1 && clean.endsWith("/")) clean = clean.slice(0, -1);
  return clean;
}

function fileToPublicRoute(filePath) {
  const relative = rel(filePath);
  if (relative === "index.html") return "/";
  if (relative.endsWith("/index.html")) {
    return `/${relative.slice(0, -"index.html".length)}`;
  }
  if (relative.endsWith(".html")) {
    return `/${relative.slice(0, -".html".length)}`;
  }
  return `/${relative}`;
}

function buildRedirectSources() {
  const redirectsPath = path.join(ROOT, "_redirects");
  if (!fs.existsSync(redirectsPath)) return new Set();

  const sources = new Set();
  const lines = fs.readFileSync(redirectsPath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const parts = trimmed.split(/\s+/);
    if (parts.length < 3) continue;
    const status = parts.slice(2).find((part) => REDIRECT_STATUS_RE.test(part));
    if (!status) continue;
    const source = parts[0];
    if (source.includes("*") || source.includes(":")) continue;
    sources.add(normalizeRoute(source));
  }
  return sources;
}

function toolIdFor(filePath, html) {
  const match = html.match(/<meta\s+name=["']tool-id["']\s+content=["']([^"']+)/i);
  if (match) return match[1].trim();
  if (/ng-salary-tax\.html$/i.test(filePath)) return "ng-paye";
  return path.basename(filePath, ".html");
}

function assert(condition, message, failures) {
  if (!condition) failures.push(message);
}

const failures = [];
const manifestPath = path.join(ROOT, "data", "tool-verification.json");
assert(fs.existsSync(manifestPath), "data/tool-verification.json is missing", failures);

const manifest = fs.existsSync(manifestPath)
  ? JSON.parse(fs.readFileSync(manifestPath, "utf8"))
  : { tools: {} };

assert(
  manifest.tools && typeof manifest.tools === "object",
  "tool verification manifest is missing tools object",
  failures,
);

const redirectSources = buildRedirectSources();
const targetFiles = walk(ROOT)
  .filter((filePath) => TARGET_RE.test(rel(filePath)))
  .filter((filePath) => !redirectSources.has(normalizeRoute(fileToPublicRoute(filePath))))
  .sort((left, right) => rel(left).localeCompare(rel(right)));

assert(targetFiles.length >= 100, `expected at least 100 PAYE/VAT pages, found ${targetFiles.length}`, failures);

for (const filePath of targetFiles) {
  const html = fs.readFileSync(filePath, "utf8");
  const toolId = toolIdFor(filePath, html);
  const entry = manifest.tools[toolId];
  const relative = rel(filePath);

  assert(entry, `${relative} is missing tool verification entry for ${toolId}`, failures);
  if (!entry) continue;

  assert(entry.last_verified && /^\d{4}-\d{2}-\d{2}$/.test(entry.last_verified), `${toolId} is missing ISO last_verified`, failures);
  assert(Array.isArray(entry.source_urls) && entry.source_urls.some((url) => /^https?:\/\//.test(url)), `${toolId} is missing source_url`, failures);
  assert(Array.isArray(entry.source_titles) && entry.source_titles.length > 0, `${toolId} is missing source_titles`, failures);
  assert(entry.methodology_markdown && entry.methodology_markdown.length > 20, `${toolId} is missing methodology_markdown`, failures);
  assert(
    entry.risk_level === "high" || entry.risk_level === "critical" || entry.risk_level === "medium",
    `${toolId} has invalid risk_level`,
    failures,
  );
  assert(entry.disclaimer_type === "tax", `${toolId} should use tax disclaimer_type`, failures);
  assert(Array.isArray(entry.known_limitations) && entry.known_limitations.length > 0, `${toolId} is missing known_limitations`, failures);
  assert(Array.isArray(entry.change_history) && entry.change_history.length > 0, `${toolId} is missing change_history`, failures);
  assert(Array.isArray(entry.test_cases) && entry.test_cases.length > 0, `${toolId} is missing test_cases`, failures);
  assert(html.includes("data-tool-verification-panel"), `${relative} is missing rendered verification panel`, failures);
  assert(
    html.includes("Sources &amp; verification") || html.includes("Sources & verification"),
    `${relative} is missing Sources & verification heading`,
    failures,
  );
  assert(html.includes("Report calculation error"), `${relative} is missing report calculation error CTA`, failures);
  assert(html.includes("/assets/css/tool-verification.css"), `${relative} is missing tool verification stylesheet`, failures);
  assert(
    !/<span class="badge[^"]*">[^<]*(?:FIRS\s+)?Verified[^<]*<\/span>/i.test(html),
    `${relative} still has a non-clickable verified badge`,
    failures,
  );
  assert(
    !/<div class="tool-stat-lbl">\s*Rating\s*<\/div>/i.test(html),
    `${relative} still shows a rating without a review system`,
    failures,
  );
}

const payeEntries = Object.values(manifest.tools).filter((entry) => /-paye$/.test(entry.tool_id));
const vatEntries = Object.values(manifest.tools).filter((entry) => /-vat$/.test(entry.tool_id));

assert(payeEntries.length >= 50, `expected PAYE verification entries for all countries, found ${payeEntries.length}`, failures);
assert(vatEntries.length >= 50, `expected VAT verification entries for all countries, found ${vatEntries.length}`, failures);

if (failures.length) {
  console.error("Tool verification test failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`Tool verification metadata and panels verified for ${targetFiles.length} PAYE/VAT pages.`);
