#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const WIDGETS_DIR = path.join(ROOT, "widgets", "iframe");
const SITE_ORIGIN = "https://afrotools.com";

function walkHtmlFiles(dir, files = []) {
  if (!fs.existsSync(dir)) return files;

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkHtmlFiles(fullPath, files);
    } else if (entry.isFile() && entry.name.endsWith(".html")) {
      files.push(fullPath);
    }
  }

  return files;
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function insertBeforeHeadEnd(html, lines) {
  return html.replace(/<\/head>/i, lines.join("\n") + "\n</head>");
}

function upsertCanonical(html, href) {
  const line = `<link rel="canonical" href="${href}">`;
  const pattern = /<link\b(?=[^>]*\brel=["']canonical["'])(?=[^>]*\bhref=["'][^"']+["'])[^>]*>/i;

  if (pattern.test(html)) {
    return html.replace(pattern, line);
  }

  return insertBeforeHeadEnd(html, [line]);
}

function upsertRobots(html, content) {
  const line = `<meta name="robots" content="${content}">`;
  const pattern = /<meta\b(?=[^>]*\bname=["']robots["'])(?=[^>]*\bcontent=["'][^"']+["'])[^>]*>/i;

  if (pattern.test(html)) {
    return html.replace(pattern, line);
  }

  return insertBeforeHeadEnd(html, [line]);
}

function extractFullToolHref(html) {
  const absoluteMatch = html.match(/<a\b[^>]*\bhref=["'](https:\/\/afrotools\.com\/[^"'#?]+\/?)["']/i);
  if (absoluteMatch) {
    return absoluteMatch[1];
  }

  const relativeMatch = html.match(/<a\b[^>]*\bhref=["'](\/[^"'#?]+\/?)["']/i);
  if (!relativeMatch) {
    return null;
  }

  try {
    return new URL(relativeMatch[1], SITE_ORIGIN).href;
  } catch (error) {
    return null;
  }
}

function normalizeCanonical(href) {
  if (!href) return null;

  try {
    const url = new URL(href, SITE_ORIGIN);
    url.hash = "";
    url.search = "";

    if (url.pathname.endsWith("/index.html")) {
      url.pathname = url.pathname.replace(/index\.html$/, "");
    } else if (url.pathname.endsWith(".html")) {
      url.pathname = url.pathname.replace(/\.html$/, "");
    }

    if (!url.pathname.endsWith("/")) {
      url.pathname += "/";
    }

    return url.href;
  } catch (error) {
    return href;
  }
}

function main() {
  const files = walkHtmlFiles(WIDGETS_DIR);
  let patched = 0;
  let skipped = 0;

  for (const filePath of files) {
    if (path.basename(filePath).toLowerCase() === "template.html") {
      skipped++;
      continue;
    }

    const original = fs.readFileSync(filePath, "utf8");
    const fullToolHref = normalizeCanonical(extractFullToolHref(original));

    if (!fullToolHref) {
      skipped++;
      continue;
    }

    let next = original;
    next = upsertCanonical(next, fullToolHref);
    next = upsertRobots(next, "noindex, follow");

    if (next !== original) {
      fs.writeFileSync(filePath, next, "utf8");
      patched++;
    }
  }

  console.log("Widget iframe SEO pages patched:", patched);
  console.log("Widget iframe pages skipped:", skipped);
}

main();
