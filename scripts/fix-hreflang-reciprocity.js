#!/usr/bin/env node
/**
 * Adds missing reciprocal hreflang tags for existing page pairs.
 *
 * This is intentionally conservative: it only repairs pages that already have
 * hreflang blocks and whose target page exists in the repo. It does not create
 * translations, invent route mappings, or touch noindex / redirect-source pages.
 */

"use strict";

const fs = require("fs");
const path = require("path");

const { fileToPublicRoute } = require("./lib/canonical-aliases");

const ROOT = path.resolve(__dirname, "..");
const BASE_URL = "https://afrotools.com";
const VALID_LANGS = new Set(["en", "fr", "sw", "yo", "ha"]);
const SKIP_DIRS = new Set([
  "node_modules",
  ".git",
  ".claude",
  ".codex",
  ".agents",
  "assets",
  "scripts",
  "lang",
  "data",
  "supabase",
  "netlify",
  ".netlify",
  "docs",
  "dist",
  "reports",
  "output",
  "test-results",
]);

function walkHtml(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (!SKIP_DIRS.has(entry.name)) walkHtml(path.join(dir, entry.name), out);
    } else if (entry.isFile() && entry.name.endsWith(".html")) {
      out.push(path.join(dir, entry.name));
    }
  }
  return out;
}

function normalizeUrl(url) {
  try {
    const parsed = new URL(url, BASE_URL);
    if (parsed.origin !== BASE_URL) return url;

    let pathname = parsed.pathname;
    if (pathname.endsWith("/index/")) {
      pathname = pathname.slice(0, -"/index/".length) + "/";
    } else if (pathname.endsWith("/index")) {
      pathname = pathname.slice(0, -"/index".length) + "/";
    }
    if (pathname.length > 1 && pathname.endsWith("/")) {
      pathname = pathname.slice(0, -1);
    }

    return `${parsed.origin}${pathname || "/"}`;
  } catch {
    return url;
  }
}

function normalizeRoute(route) {
  try {
    return new URL(normalizeUrl(route.startsWith("http") ? route : `${BASE_URL}${route}`)).pathname || "/";
  } catch {
    return route;
  }
}

function buildRedirectSources() {
  const redirectsPath = path.join(ROOT, "_redirects");
  const sources = new Set();
  if (!fs.existsSync(redirectsPath)) return sources;

  for (const line of fs.readFileSync(redirectsPath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || trimmed.startsWith("[[redirects]]")) continue;
    const [source, target, status] = trimmed.split(/\s+/);
    if (!source || !target) continue;
    if (!/^(?:301|302|307|308|410)!?$/.test(String(status || ""))) continue;
    sources.add(normalizeRoute(source));
  }

  return sources;
}

function extractHreflangTags(html) {
  const tags = [];
  const re = /<link\s[^>]*rel=["']alternate["'][^>]*>/gi;
  let match;
  while ((match = re.exec(html)) !== null) {
    const tag = match[0];
    const hreflangMatch = tag.match(/hreflang=["']([^"']+)["']/i);
    const hrefMatch = tag.match(/href=["']([^"']+)["']/i);
    if (hreflangMatch && hrefMatch) {
      tags.push({ lang: hreflangMatch[1], href: hrefMatch[1], raw: tag });
    }
  }
  return tags;
}

function extractHtmlLang(html) {
  const match = html.match(/<html[^>]*\slang=["']([^"']+)["']/i);
  return match ? match[1] : "";
}

function inferPageLang(filePath, html) {
  const rel = path.relative(ROOT, filePath).replace(/\\/g, "/");
  const htmlLang = extractHtmlLang(html);
  if (rel.startsWith("fr/")) return "fr";
  if (rel.startsWith("sw/")) return "sw";
  if (rel.startsWith("yo/")) return "yo";
  if (rel.startsWith("ha/")) return "ha";
  if (VALID_LANGS.has(htmlLang)) return htmlLang;
  return "en";
}

function hasNoindex(html) {
  const match = html.match(/<meta\s[^>]*name=["']robots["'][^>]*content=["']([^"']+)["']/i);
  return Boolean(match && /\bnoindex\b/i.test(match[1]));
}

function sleep(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

function writeFileWithRetry(filePath, html) {
  for (let attempt = 1; attempt <= 5; attempt++) {
    try {
      fs.writeFileSync(filePath, html, "utf8");
      return;
    } catch (error) {
      if (!["EBUSY", "EPERM", "UNKNOWN"].includes(error.code) || attempt === 5) {
        throw error;
      }
      sleep(100 * attempt);
    }
  }
}

function addAlternateTag(html, lang, href) {
  const line = `<link rel="alternate" hreflang="${lang}" href="${href}" />`;
  const xDefaultRe = /<link\s[^>]*rel=["']alternate["'][^>]*hreflang=["']x-default["'][^>]*>\s*/i;
  if (xDefaultRe.test(html)) {
    return html.replace(xDefaultRe, `${line}\n$&`);
  }
  return html.replace(/<\/head>/i, `${line}\n</head>`);
}

function ensureRequiredHreflangTags(html, page, filePatches) {
  const tags = extractHreflangTags(html);
  let next = html;
  let added = 0;

  const hasSelf = tags.some((tag) => (
    tag.lang === page.lang && normalizeUrl(tag.href) === page.normalizedUrl
  ));
  if (!hasSelf) {
    next = addAlternateTag(next, page.lang, page.url);
    added++;
  }

  const hasXDefault = tags.some((tag) => tag.lang === "x-default");
  if (!hasXDefault) {
    const englishPatch = filePatches.find((patch) => patch.lang === "en");
    const englishTag = tags.find((tag) => tag.lang === "en");
    const defaultHref = page.lang === "en"
      ? page.url
      : (englishPatch ? englishPatch.href : (englishTag ? englishTag.href : page.url));
    next = addAlternateTag(next, "x-default", defaultHref);
    added++;
  }

  return { html: next, added };
}

function chooseHreflangTag(page, group, pagesByUrl) {
  const self = group.find((tag) => tag.lang === page.lang && normalizeUrl(tag.href) === page.normalizedUrl);
  if (self) return self;

  const reciprocal = group.find((tag) => {
    const target = pagesByUrl.get(normalizeUrl(tag.href));
    if (!target) return false;
    return target.hreflangs.some((backRef) => (
      backRef.lang === page.lang && normalizeUrl(backRef.href) === page.normalizedUrl
    ));
  });
  if (reciprocal) return reciprocal;

  return group[0];
}

function removeDuplicateHreflangs(html, page, pagesByUrl) {
  const tags = extractHreflangTags(html);
  const byLang = new Map();
  for (const tag of tags) {
    const group = byLang.get(tag.lang) || [];
    group.push(tag);
    byLang.set(tag.lang, group);
  }

  let next = html;
  let removed = 0;
  for (const group of byLang.values()) {
    if (group.length < 2) continue;
    const keep = chooseHreflangTag(page, group, pagesByUrl);
    let kept = false;
    for (const tag of group) {
      if (!kept && tag.raw === keep.raw) {
        kept = true;
        continue;
      }
      next = next.replace(tag.raw, "");
      removed++;
    }
  }

  return { html: next.replace(/\n{3,}/g, "\n\n"), removed };
}

function main() {
  const redirectSources = buildRedirectSources();
  const pages = new Map();

  for (const filePath of walkHtml(ROOT)) {
    const route = normalizeRoute(fileToPublicRoute(filePath));
    if (redirectSources.has(route)) continue;

    const html = fs.readFileSync(filePath, "utf8");
    if (hasNoindex(html)) continue;

    const url = `${BASE_URL}${fileToPublicRoute(filePath)}`;
    const normalizedUrl = normalizeUrl(url);
    const hreflangs = extractHreflangTags(html);
    pages.set(normalizedUrl, {
      filePath,
      html,
      hreflangs,
      lang: inferPageLang(filePath, html),
      url,
      normalizedUrl,
    });
  }

  const patches = new Map();

  for (const [sourceUrl, source] of pages) {
    if (source.hreflangs.length === 0) continue;

    for (const alternate of source.hreflangs) {
      if (alternate.lang === "x-default") continue;
      const targetUrl = normalizeUrl(alternate.href);
      if (targetUrl === sourceUrl) continue;

      const target = pages.get(targetUrl);
      if (!target) continue;

      const hasBackRef = target.hreflangs.some((tag) => (
        tag.lang === source.lang && normalizeUrl(tag.href) === sourceUrl
      ));
      if (hasBackRef) continue;

      const filePatches = patches.get(target.filePath) || [];
      const alreadyQueued = filePatches.some((patch) => (
        patch.lang === source.lang && patch.href === source.url
      ));
      if (!alreadyQueued) {
        filePatches.push({ lang: source.lang, href: source.url });
        patches.set(target.filePath, filePatches);
      }
    }
  }

  let filesChanged = 0;
  let tagsAdded = 0;
  let requiredTagsAdded = 0;
  let duplicateTagsRemoved = 0;

  for (const [filePath, filePatches] of patches) {
    let html = fs.readFileSync(filePath, "utf8");
    const page = [...pages.values()].find((entry) => entry.filePath === filePath);
    if (page) {
      const result = ensureRequiredHreflangTags(html, page, filePatches);
      html = result.html;
      requiredTagsAdded += result.added;
    }
    for (const patch of filePatches.sort((a, b) => a.lang.localeCompare(b.lang))) {
      html = addAlternateTag(html, patch.lang, patch.href);
      tagsAdded++;
    }
    writeFileWithRetry(filePath, html);
    filesChanged++;
  }

  for (const [url, page] of pages) {
    const currentHtml = fs.readFileSync(page.filePath, "utf8");
    pages.set(url, {
      ...page,
      html: currentHtml,
      hreflangs: extractHreflangTags(currentHtml),
    });
  }

  for (const page of pages.values()) {
    let currentHtml = fs.readFileSync(page.filePath, "utf8");
    const currentPage = {
      ...page,
      html: currentHtml,
      hreflangs: extractHreflangTags(currentHtml),
    };
    const required = currentPage.hreflangs.length > 0
      ? ensureRequiredHreflangTags(currentHtml, currentPage, [])
      : { html: currentHtml, added: 0 };
    if (required.added > 0) {
      currentHtml = required.html;
      requiredTagsAdded += required.added;
    }

    const result = removeDuplicateHreflangs(currentHtml, {
      ...currentPage,
      html: currentHtml,
      hreflangs: extractHreflangTags(currentHtml),
    }, pages);
    if (required.added > 0 || result.removed > 0) {
      writeFileWithRetry(page.filePath, result.html);
      duplicateTagsRemoved += result.removed;
      if (!patches.has(page.filePath)) filesChanged++;
    }
  }

  console.log(`Hreflang reciprocity fixed: ${tagsAdded} reciprocal tags added, ${requiredTagsAdded} required tags added, ${duplicateTagsRemoved} duplicate tags removed across ${filesChanged} files.`);
}

main();
