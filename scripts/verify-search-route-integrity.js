#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.resolve(__dirname, "..");
const REGISTRY_PATH = path.join(ROOT, "assets/js/components/tool-registry.js");
const NAVBAR_PATH = path.join(ROOT, "assets/js/components/navbar.js");
const SEARCH_INDEX_PATH = path.join(ROOT, "data/search-index.json");
const REDIRECTS_PATH = path.join(ROOT, "_redirects");

function read(relOrAbs) {
  return fs.readFileSync(path.isAbsolute(relOrAbs) ? relOrAbs : path.join(ROOT, relOrAbs), "utf8");
}

function toRel(filePath) {
  return path.relative(ROOT, filePath).replace(/\\/g, "/");
}

function normalizeRoute(href) {
  if (!href || typeof href !== "string") return "";
  const value = href.trim();
  if (!value || value === "#" || /^(https?:|mailto:|tel:)/i.test(value)) return "";
  const clean = value.split("#")[0].split("?")[0];
  if (!clean || clean === "/" || !clean.startsWith("/")) return clean.startsWith("/") ? clean : `/${clean}`;
  return clean;
}

function routeToCandidates(route) {
  const clean = route.replace(/\/$/, "");
  return [
    path.join(ROOT, clean, "index.html"),
    path.join(ROOT, `${clean}.html`),
  ];
}

function routeExists(route) {
  if (route === "/") return fs.existsSync(path.join(ROOT, "index.html"));
  return routeToCandidates(route).some((candidate) => fs.existsSync(candidate));
}

function parseRedirects() {
  const redirects = new Map();
  read(REDIRECTS_PATH).split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) return;
    const parts = trimmed.split(/\s+/);
    if (parts.length < 2) return;
    const source = normalizeRoute(parts[0]);
    const target = normalizeRoute(parts[1]);
    const status = parts[2] || "";
    if (!source || !target) return;
    redirects.set(source, { target, status });
  });
  return redirects;
}

function resolveRoute(route, redirects, seen = new Set()) {
  if (!route) return { ok: true, via: "ignored" };
  if (routeExists(route)) return { ok: true, via: "file", target: route };
  if (seen.has(route)) return { ok: false, via: "redirect-loop", target: route };
  seen.add(route);
  const rule = redirects.get(route) || redirects.get(route.endsWith("/") ? route.slice(0, -1) : `${route}/`);
  if (!rule) return { ok: false, via: "missing" };
  return resolveRoute(rule.target, redirects, seen);
}

function loadRegistry() {
  const code = read(REGISTRY_PATH);
  function FakeEvent() {}
  const sandbox = {
    window: {},
    CustomEvent: FakeEvent,
    document: {
      readyState: "complete",
      getElementById: () => null,
      createElement: () => ({ textContent: "", style: {}, appendChild() {} }),
      head: { appendChild() {} },
      addEventListener() {},
      removeEventListener() {},
      dispatchEvent() {},
      querySelector: () => null,
    },
  };
  sandbox.window = sandbox;
  vm.runInNewContext(code, sandbox, { filename: REGISTRY_PATH });
  return Array.isArray(sandbox.AFRO_TOOLS) ? sandbox.AFRO_TOOLS : [];
}

function collectSearchIndexRoutes() {
  if (!fs.existsSync(SEARCH_INDEX_PATH)) return [];
  const rows = JSON.parse(read(SEARCH_INDEX_PATH));
  return rows.map((row) => ({
    surface: "data/search-index.json",
    label: row[1] || row[0] || "search row",
    route: normalizeRoute(row[6]),
  }));
}

function collectRegistryRoutes() {
  return loadRegistry()
    .filter((tool) => tool && (tool.status === "live" || tool.status === "new"))
    .map((tool) => ({
      surface: "assets/js/components/tool-registry.js",
      label: tool.id || tool.name || "registry row",
      route: normalizeRoute(tool.href),
    }));
}

function collectNavbarToolRoutes() {
  const text = read(NAVBAR_PATH);
  const out = [];
  const hrefPattern = /href:\s*['"]([^'"]+)['"]/g;
  let match;
  while ((match = hrefPattern.exec(text))) {
    const route = normalizeRoute(match[1]);
    if (!route) continue;
    out.push({
      surface: "assets/js/components/navbar.js",
      label: `href at ${match.index}`,
      route,
    });
  }
  return out;
}

function collectSitemapToolRoutes() {
  const sitemapPath = path.join(ROOT, "sitemap-tools.xml");
  if (!fs.existsSync(sitemapPath)) return [];
  const text = read(sitemapPath);
  const out = [];
  const locPattern = /<loc>https:\/\/afrotools\.com([^<]+)<\/loc>/g;
  let match;
  while ((match = locPattern.exec(text))) {
    out.push({
      surface: "sitemap-tools.xml",
      label: match[1],
      route: normalizeRoute(match[1]),
    });
  }
  return out;
}

const redirects = parseRedirects();
const entries = [
  ...collectRegistryRoutes(),
  ...collectSearchIndexRoutes(),
  ...collectNavbarToolRoutes(),
  ...collectSitemapToolRoutes(),
];

const seen = new Set();
const failures = [];

for (const entry of entries) {
  if (!entry.route) continue;
  const key = `${entry.surface}|${entry.route}`;
  if (seen.has(key)) continue;
  seen.add(key);
  const result = resolveRoute(entry.route, redirects);
  if (!result.ok) failures.push(entry);
}

if (failures.length) {
  console.error(`Search route integrity failed: ${failures.length} broken route(s).`);
  failures.slice(0, 100).forEach((entry) => {
    console.error(`- ${entry.surface}: ${entry.label} -> ${entry.route}`);
  });
  process.exit(1);
}

console.log(`Search route integrity verified across ${seen.size} registry, search, navbar, and tool-sitemap routes.`);
