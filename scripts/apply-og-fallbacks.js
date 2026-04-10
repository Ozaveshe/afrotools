#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const DEFAULT_IMAGE = "https://afrotools.com/assets/img/og-default.png";
const DEFAULT_WIDTH = "1200";
const DEFAULT_HEIGHT = "630";
const IGNORE_DIRS = new Set([
  ".git",
  ".claude",
  ".jamb",
  ".jamb-tools",
  "node_modules",
  "afrotools-deploy",
]);

function findHtmlFiles(dir) {
  const files = [];
  let entries;

  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch (error) {
    return files;
  }

  for (const entry of entries) {
    if (IGNORE_DIRS.has(entry.name)) continue;
    if (entry.name.startsWith(".") && entry.name !== ".well-known") continue;

    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...findHtmlFiles(full));
    } else if (entry.isFile() && entry.name.endsWith(".html")) {
      files.push(full);
    }
  }

  return files;
}

function normalizePathname(value) {
  if (!value) return null;
  const stripped = value.replace(/\/index\.html$/i, "/").replace(/\/$/, "");
  return stripped || "/";
}

function fileToPathname(filePath) {
  const rel = path.relative(ROOT, filePath).replace(/\\/g, "/");
  if (rel === "index.html") return "/";
  if (rel.endsWith("/index.html")) return "/" + rel.slice(0, -"/index.html".length) + "/";
  return "/" + rel.replace(/\.html$/i, "");
}

function getCanonicalPath(html) {
  const canonicalMatch = html.match(/<link\s+rel=["']canonical["']\s+href=["']([^"']+)["']/i);
  if (!canonicalMatch) return null;

  try {
    return normalizePathname(new URL(canonicalMatch[1]).pathname);
  } catch (error) {
    return normalizePathname(canonicalMatch[1]);
  }
}

function isRedirectLike(html, filePath) {
  const currentPath = normalizePathname(fileToPathname(filePath));
  const canonicalPath = getCanonicalPath(html);

  return (
    /<meta[^>]+http-equiv=["']refresh["']/i.test(html) ||
    /window\.location\.(replace|href)|location\.replace\(/i.test(html) ||
    Boolean(canonicalPath && canonicalPath !== currentPath)
  );
}

function hasMeta(html, attrName, attrValue) {
  const pattern = new RegExp(
    "<meta\\s+" +
      attrName +
      "=[\"']" +
      attrValue.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") +
      "[\"'][^>]*>",
    "i"
  );
  return pattern.test(html);
}

function getMetaContent(html, attrName, attrValue) {
  const pattern = new RegExp(
    "<meta\\s+" +
      attrName +
      "=[\"']" +
      attrValue.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") +
      "[\"'][^>]*content=[\"']([^\"']+)[\"'][^>]*>",
    "i"
  );
  const match = html.match(pattern);
  return match ? match[1] : null;
}

function insertBeforeHeadEnd(html, lines) {
  return html.replace("</head>", lines.join("\n") + "\n</head>");
}

function addAfterMeta(html, attrName, attrValue, lines) {
  const pattern = new RegExp(
    "(<meta\\s+" +
      attrName +
      "=[\"']" +
      attrValue.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") +
      "[\"'][^>]*>)",
    "i"
  );

  if (!pattern.test(html)) {
    return insertBeforeHeadEnd(html, lines);
  }

  return html.replace(pattern, "$1\n" + lines.join("\n"));
}

function applyFallbacks(html, filePath) {
  if (!html.includes("</head>")) return { html, changed: false };
  if (!/<meta\s+(property|name)=["']og:title["']/i.test(html)) return { html, changed: false };
  if (isRedirectLike(html, filePath)) return { html, changed: false };

  let next = html;
  let changed = false;
  let ogImage = getMetaContent(next, "property", "og:image");

  if (!ogImage) {
    const ogLines = [
      '<meta property="og:image" content="' + DEFAULT_IMAGE + '">',
      '<meta property="og:image:width" content="' + DEFAULT_WIDTH + '">',
      '<meta property="og:image:height" content="' + DEFAULT_HEIGHT + '">',
    ];
    next = addAfterMeta(next, "property", "og:description", ogLines);
    ogImage = DEFAULT_IMAGE;
    changed = true;
  }

  if (ogImage === DEFAULT_IMAGE && !hasMeta(next, "property", "og:image:width")) {
    next = addAfterMeta(next, "property", "og:image", [
      '<meta property="og:image:width" content="' + DEFAULT_WIDTH + '">',
    ]);
    changed = true;
  }

  if (ogImage === DEFAULT_IMAGE && !hasMeta(next, "property", "og:image:height")) {
    next = addAfterMeta(next, "property", "og:image:width", [
      '<meta property="og:image:height" content="' + DEFAULT_HEIGHT + '">',
    ]);
    changed = true;
  }

  if (!hasMeta(next, "name", "twitter:image")) {
    const twitterLine = ['<meta name="twitter:image" content="' + ogImage + '">'];
    next = addAfterMeta(next, "name", "twitter:description", twitterLine);
    changed = true;
  }

  return { html: next, changed };
}

function main() {
  const files = findHtmlFiles(ROOT);
  const patched = [];

  for (const file of files) {
    const html = fs.readFileSync(file, "utf8");
    const result = applyFallbacks(html, file);

    if (!result.changed) continue;

    fs.writeFileSync(file, result.html, "utf8");
    patched.push(path.relative(ROOT, file).replace(/\\/g, "/"));
  }

  console.log("OG fallback pages patched:", patched.length);
  patched.slice(0, 20).forEach((file) => console.log("  " + file));
  if (patched.length > 20) {
    console.log("  ... and " + (patched.length - 20) + " more");
  }
}

main();
