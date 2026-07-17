#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const {
  extractCanonicalPath,
  fileToPublicRoute,
  isRedirectLike,
  relativeHtmlPath,
} = require("./lib/canonical-aliases");

const ROOT = path.resolve(__dirname, "..");
const SITE = "https://afrotools.com";
const REDIRECTS = path.join(ROOT, "_redirects");
const REPORT_JSON = path.join(ROOT, "reports", "french-route-ownership-report.json");
const REPORT_MD = path.join(ROOT, "reports", "french-route-ownership-report.md");

function normalizeRoute(route) {
  if (!route) return "/";
  let value = route.trim();
  try {
    if (/^https?:/i.test(value)) value = new URL(value).pathname;
  } catch {
    return route;
  }
  value = value.split("?")[0].split("#")[0];
  if (!value.startsWith("/")) value = `/${value}`;
  value = value.replace(/\/index\.html$/i, "/").replace(/\/index\/?$/i, "/");
  if (value !== "/" && value.endsWith("/")) value = value.slice(0, -1);
  return value || "/";
}

function resolveRouteFile(route) {
  const normalized = normalizeRoute(route);
  const clean = normalized.replace(/^\/+/, "");
  if (!clean) return path.join(ROOT, "index.html");

  const asHtml = path.join(ROOT, `${clean}.html`);
  const asIndex = path.join(ROOT, clean, "index.html");
  const asRaw = path.join(ROOT, clean);

  if (route.endsWith("/")) {
    if (fs.existsSync(asIndex)) return asIndex;
    if (fs.existsSync(asHtml)) return asHtml;
  } else {
    if (fs.existsSync(asHtml)) return asHtml;
    if (fs.existsSync(asIndex)) return asIndex;
  }
  if (fs.existsSync(asRaw) && fs.statSync(asRaw).isFile()) return asRaw;
  return null;
}

function htmlEscape(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function redirectStub(targetRoute) {
  const target = normalizeRoute(targetRoute);
  const targetAbs = SITE + target + (targetRoute.endsWith("/") && !target.endsWith("/") ? "/" : "");
  const displayTarget = htmlEscape(targetRoute.endsWith("/") && !target.endsWith("/") ? `${target}/` : target);
  const jsTarget = JSON.stringify(targetRoute.endsWith("/") && !target.endsWith("/") ? `${target}/` : target);
  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex, follow">
<title>Cette adresse a changé | AfroTools</title>
<meta name="description" content="Cette ancienne adresse vous redirige vers la page française actuelle d'AfroTools.">
<link rel="canonical" href="${targetAbs}">
<meta http-equiv="refresh" content="0; url=${displayTarget}">
<link rel="icon" type="image/svg+xml" href="/assets/img/logo-mark.svg">
<style>
body{font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;margin:0;background:#f8fafc;color:#111827;display:grid;min-height:100vh;place-items:center}
main{max-width:520px;padding:32px;text-align:center}
h1{font-size:1.5rem;margin:0 0 12px}
p{color:#4b5563;line-height:1.6;margin:0 0 20px}
a{display:inline-flex;align-items:center;justify-content:center;padding:10px 16px;border-radius:8px;background:#1d4ed8;color:#fff;text-decoration:none;font-weight:700}
a:focus,a:hover{background:#1e40af}
</style>
<script>window.location.replace(${jsTarget});</script>
</head>
<body>
<main>
<h1>Cette adresse a changé</h1>
<p>Vous allez être redirigé vers la page française actuelle.</p>
<a href="${displayTarget}">Continuer vers la page</a>
</main>
</body>
</html>
`;
}

function parseFrenchRedirectAliases() {
  const lines = fs.readFileSync(REDIRECTS, "utf8").split(/\r?\n/);
  const aliases = [];
  for (const raw of lines) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const parts = line.split(/\s+/);
    if (parts.length < 3) continue;
    const [source, target, status] = parts;
    if (status !== "301") continue;
    if (!source.startsWith("/fr/") || !target.startsWith("/fr/")) continue;
    if (source.includes(".html")) continue;

    const sourceRoute = normalizeRoute(source);
    const targetRoute = normalizeRoute(target);
    if (sourceRoute === targetRoute) continue;
    aliases.push({ source, sourceRoute, target, targetRoute });
  }
  return aliases;
}

function walkFrenchHtml(dir = path.join(ROOT, "fr"), out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walkFrenchHtml(full, out);
    else if (entry.isFile() && entry.name.endsWith(".html")) out.push(full);
  }
  return out;
}

function duplicateCanonicalGroups() {
  const groups = new Map();
  const competingGroups = new Map();
  let aliasLikeSkipped = 0;

  for (const filePath of walkFrenchHtml()) {
    const html = fs.readFileSync(filePath, "utf8");
    const canonical = normalizeRoute(extractCanonicalPath(html));
    if (!canonical || !canonical.startsWith("/fr/")) continue;
    const route = normalizeRoute(fileToPublicRoute(filePath));
    if (!groups.has(canonical)) groups.set(canonical, new Set());
    groups.get(canonical).add(route);

    const noindex = /<meta\s[^>]*name=["']robots["'][^>]*content=["'][^"']*noindex/i.test(html);
    if (noindex || isRedirectLike(html)) {
      aliasLikeSkipped++;
      continue;
    }
    if (!competingGroups.has(canonical)) competingGroups.set(canonical, new Set());
    competingGroups.get(canonical).add(route);
  }

  const all = [...groups.entries()]
    .filter(([, routes]) => routes.size > 1)
    .map(([canonical, routes]) => ({ canonical, routes: [...routes].sort(), count: routes.size }))
    .sort((a, b) => b.count - a.count || a.canonical.localeCompare(b.canonical));
  const competing = [...competingGroups.entries()]
    .filter(([, routes]) => routes.size > 1)
    .map(([canonical, routes]) => ({ canonical, routes: [...routes].sort(), count: routes.size }))
    .sort((a, b) => b.count - a.count || a.canonical.localeCompare(b.canonical));

  return { all, competing, aliasLikeSkipped };
}

function main() {
  fs.mkdirSync(path.join(ROOT, "reports"), { recursive: true });
  const before = duplicateCanonicalGroups();
  const aliases = parseFrenchRedirectAliases();
  const changed = [];
  const alreadyStable = [];
  const deferred = [];

  for (const alias of aliases) {
    const sourceFile = resolveRouteFile(alias.source);
    const targetFile = resolveRouteFile(alias.target);
    if (!sourceFile || !targetFile) {
      deferred.push({ ...alias, reason: !sourceFile ? "source file missing" : "target file missing" });
      continue;
    }
    if (path.resolve(sourceFile) === path.resolve(targetFile)) {
      deferred.push({ ...alias, reason: "source and target resolve to same file" });
      continue;
    }

    const current = fs.readFileSync(sourceFile, "utf8");
    const next = redirectStub(alias.target);
    const entry = {
      file: relativeHtmlPath(sourceFile),
      source: alias.source,
      target: alias.target,
    };
    if (current === next) {
      alreadyStable.push(entry);
      continue;
    }
    fs.writeFileSync(sourceFile, next, "utf8");
    changed.push(entry);
  }

  const after = duplicateCanonicalGroups();
  const stabilizedAliases = [...changed, ...alreadyStable]
    .sort((a, b) => a.source.localeCompare(b.source) || a.target.localeCompare(b.target));
  const stabilizedAliasFiles = [...new Set(stabilizedAliases.map((item) => item.file))].sort();
  const report = {
    generatedAt: new Date().toISOString(),
    preferredUrlRule: "French-owned country and money pages use /fr/<French-country-slug>/ for country hubs, /fr/<French-country-slug>/calculateur-salaire-net for PAYE/salary, /fr/<French-country-slug>/calculateur-tva for VAT, and /fr/document-pdf/ for the French PDF hub. Country-code and English-country French paths are aliases only.",
    stabilizedAliases,
    stabilizedAliasFiles,
    changedAliases: changed,
    alreadyStableAliases: alreadyStable,
    deferredRoutes: deferred,
    duplicateCanonicalGroupsBefore: before.all.length,
    duplicateCanonicalGroupsAfter: after.all.length,
    competingDuplicateCanonicalGroupsBefore: before.competing.length,
    competingDuplicateCanonicalGroupsAfter: after.competing.length,
    remainingDuplicateCanonicalGroups: after.all,
    remainingCompetingDuplicateCanonicalGroups: after.competing,
  };

  fs.writeFileSync(REPORT_JSON, `${JSON.stringify(report, null, 2)}\n`, "utf8");

  const md = [
    "# French Route Ownership Report",
    "",
    `Generated: ${new Date().toISOString().slice(0, 10)}`,
    "",
    `Preferred URL rule: ${report.preferredUrlRule}`,
    "",
    `- Alias route rules currently stabilized: ${stabilizedAliases.length}`,
    `- Unique alias files currently stabilized: ${stabilizedAliasFiles.length}`,
    `- Alias files rewritten this run: ${changed.length}`,
    `- Duplicate canonical groups before, including noindex aliases: ${report.duplicateCanonicalGroupsBefore}`,
    `- Duplicate canonical groups after, including noindex aliases: ${report.duplicateCanonicalGroupsAfter}`,
    `- Competing duplicate canonical groups before: ${report.competingDuplicateCanonicalGroupsBefore}`,
    `- Competing duplicate canonical groups after: ${report.competingDuplicateCanonicalGroupsAfter}`,
    `- Deferred alias routes: ${deferred.length}`,
    "",
    "## Rewritten Aliases",
    "",
    ...changed.slice(0, 80).map((item) => `- ${item.source} -> ${item.target} (${item.file})`),
    changed.length > 80 ? `- ... ${changed.length - 80} more in reports/french-route-ownership-report.json` : "",
    changed.length === 0 ? "- None on this run" : "",
    "",
    "## Stable Alias Files",
    "",
    ...stabilizedAliases.slice(0, 80).map((item) => `- ${item.source} -> ${item.target} (${item.file})`),
    stabilizedAliases.length > 80 ? `- ... ${stabilizedAliases.length - 80} more in reports/french-route-ownership-report.json` : "",
    "",
    "## Deferred Routes",
    "",
    ...(deferred.length ? deferred.map((item) => `- ${item.source} -> ${item.target}: ${item.reason}`) : ["- None"]),
    "",
    "## Remaining Duplicate Canonical Groups",
    "",
    ...(after.all.length ? after.all.map((item) => `- ${item.canonical}: ${item.routes.join(", ")}`) : ["- None"]),
    "",
    "## Remaining Competing Duplicate Canonical Groups",
    "",
    ...(after.competing.length ? after.competing.map((item) => `- ${item.canonical}: ${item.routes.join(", ")}`) : ["- None"]),
    "",
  ].filter((line) => line !== "").join("\n");
  fs.writeFileSync(REPORT_MD, `${md}\n`, "utf8");

  console.log(JSON.stringify({
    aliasRouteRulesStabilized: stabilizedAliases.length,
    uniqueAliasFilesStabilized: stabilizedAliasFiles.length,
    aliasesChanged: changed.length,
    deferred: deferred.length,
    duplicateCanonicalGroupsBefore: report.duplicateCanonicalGroupsBefore,
    duplicateCanonicalGroupsAfter: report.duplicateCanonicalGroupsAfter,
    competingDuplicateCanonicalGroupsBefore: report.competingDuplicateCanonicalGroupsBefore,
    competingDuplicateCanonicalGroupsAfter: report.competingDuplicateCanonicalGroupsAfter,
  }, null, 2));
}

main();
