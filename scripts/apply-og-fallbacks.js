#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const vm = require("vm");
const { renameSyncWithRetry, writeFileSyncWithRetry } = require("./lib/safe-write");
const { imageSizeFromUrl } = require("./lib/image-size");
const { decodeHtml } = require("./audit-search-snippets");

const ROOT = path.resolve(__dirname, "..");
const SITE_ORIGIN = "https://afrotools.com";
const DEFAULT_IMAGE = SITE_ORIGIN + "/assets/img/og-default.png";
const DEFAULT_WIDTH = "1200";
const DEFAULT_HEIGHT = "630";
const TOOL_REGISTRY_PATH = path.join(ROOT, "assets", "js", "components", "tool-registry.js");
const TOOL_IMAGE_EXTENSIONS = [".webp", ".png", ".jpg", ".jpeg"];
const { loadBindings, resolveReviewedToolArtwork } = require('./lib/reviewed-tool-image-bindings');
// Preserve the explicit measured dimensions promised by reviewed same-tool artwork.
// Other routes retain the existing policy of leaving absent dimensions undeclared.
const REVIEWED_TOOL_SOCIAL_IMAGES = new Map(loadBindings()
  .filter(binding => binding.status === 'reviewed_same_tool_binding' && binding.placement_group === 'sw-practical-tool-artwork-2026-10-16')
  .map(binding => [binding.route, SITE_ORIGIN + resolveReviewedToolArtwork(binding.route, binding.path)]));
const REVIEWED_BLOG_SOCIAL_IMAGES = new Map(
  require('../data/image-generation/blog-artwork-bindings.json').images
    .filter(row => row.placement === 'article-hero' && row.update_social)
    .map(row => [row.file, SITE_ORIGIN + row.path])
);
const IGNORE_DIRS = new Set([
  ".git",
  ".claude",
  ".jamb",
  ".jamb-tools",
  "node_modules",
  "afrotools-deploy",
  "dist",
]);

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Make any og:image:width/height a page *already declares* agree with the real image.
 *
 * These were historically stamped as a hardcoded 1200x630 (see scripts/fix-og-tags.js), which lied
 * on every page whose og:image was a different size — e.g. the 600x400 tool thumbnails this script
 * itself swaps in. Social platforms lay the card out from these hints before fetching the file, so
 * a wrong hint mis-renders it.
 *
 * Except for explicitly reviewed same-tool artwork, only correct declarations that already exist. Adding dimensions to the thousands of
 * pages that omit them is not a correctness fix (platforms measure the image themselves) and would
 * churn the whole site. If the image cannot be measured, the claim is dropped rather than guessed.
 */
function syncOgImageDimensions(html, imageUrl, requireReviewedDimensions = false) {
  const hasWidth = getMetaContent(html, "property", "og:image:width");
  const hasHeight = getMetaContent(html, "property", "og:image:height");
  if (hasWidth === null && hasHeight === null && !requireReviewedDimensions) return html;

  const size = imageSizeFromUrl(imageUrl, ROOT);
  let next = html;

  if (!size) {
    next = removeMeta(next, "property", "og:image:width");
    next = removeMeta(next, "property", "og:image:height");
    return next;
  }

  if (hasWidth !== String(size.w)) {
    next = upsertMetaContent(next, "property", "og:image:width", String(size.w), "property", "og:image");
  }
  if (getMetaContent(next, "property", "og:image:height") !== String(size.h)) {
    next = upsertMetaContent(next, "property", "og:image:height", String(size.h), "property", "og:image:width");
  }
  return next;
}

function writeFileAtomic(filePath, contents) {
  const tempPath = filePath + ".tmp-" + process.pid + "-" + Date.now();
  writeFileSyncWithRetry(tempPath, contents, "utf8");
  renameSyncWithRetry(tempPath, filePath);
}

function escapeHtmlAttribute(value) {
  return String(value).replace(/&/g, "&amp;").replace(/"/g, "&quot;");
}

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
  const stripped = String(value).replace(/\/index\.html$/i, "/").replace(/\/$/, "");
  return stripped || "/";
}

function fileToPathname(filePath) {
  const rel = path.relative(ROOT, filePath).replace(/\\/g, "/");
  if (rel === "index.html") return "/";
  if (rel.endsWith("/index.html")) return "/" + rel.slice(0, -"/index.html".length) + "/";
  return "/" + rel.replace(/\.html$/i, "");
}

function hrefToPathname(href) {
  if (!href) return null;

  try {
    return normalizePathname(new URL(href, SITE_ORIGIN).pathname);
  } catch (error) {
    return normalizePathname(href);
  }
}

function getCanonicalPath(html) {
  const canonicalUrl = getCanonicalUrl(html);
  if (!canonicalUrl) return null;

  try {
    return normalizePathname(new URL(canonicalUrl, SITE_ORIGIN).pathname);
  } catch (error) {
    return normalizePathname(canonicalUrl);
  }
}

function getCanonicalUrl(html) {
  const canonicalTag = html.match(/<link\b(?=[^>]*\brel=["']canonical["'])[^>]*>/i);
  if (!canonicalTag) return null;
  const href = canonicalTag[0].match(/\bhref=["']([^"']+)["']/i);
  if (!href) return null;

  try {
    return new URL(href[1], SITE_ORIGIN).href;
  } catch (error) {
    return href[1];
  }
}

function isRedirectLike(html, filePath) {
  const currentPath = normalizePathname(fileToPathname(filePath));
  const canonicalPath = getCanonicalPath(html);

  return (
    /<meta[^>]+http-equiv=["']refresh["']/i.test(html) ||
    Boolean(canonicalPath && canonicalPath !== currentPath)
  );
}

function findMetaTag(html, attrName, attrValue) {
  const pattern = new RegExp(
    "<meta\\b(?=[^>]*\\b" + attrName + "=[\"']" + escapeRegExp(attrValue) + "[\"'])[^>]*>",
    "i"
  );
  const match = html.match(pattern);
  return match ? match[0] : null;
}

function hasMeta(html, attrName, attrValue) {
  return Boolean(findMetaTag(html, attrName, attrValue));
}

function getMetaContent(html, attrName, attrValue) {
  const tag = findMetaTag(html, attrName, attrValue);
  if (!tag) return null;

  const contentMatch = tag.match(/\bcontent\s*=\s*(["'])([\s\S]*?)\1/i);
  return contentMatch ? decodeHtml(contentMatch[2]) : null;
}

function getPageTitle(html) {
  const match = html.match(/<title>([\s\S]*?)<\/title>/i);
  if (!match) return null;

  return decodeHtml(String(match[1] || ""))
    .replace(/<[^>]*>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function insertBeforeHeadEnd(html, lines) {
  return html.replace("</head>", lines.join("\n") + "\n</head>");
}

function addAfterMeta(html, attrName, attrValue, lines) {
  const pattern = new RegExp(
    "(<meta\\b(?=[^>]*\\b" + attrName + "=[\"']" + escapeRegExp(attrValue) + "[\"'])[^>]*>)",
    "i"
  );

  if (!pattern.test(html)) {
    return insertBeforeHeadEnd(html, lines);
  }

  return html.replace(pattern, "$1\n" + lines.join("\n"));
}

function upsertMetaContent(html, attrName, attrValue, content, afterAttrName, afterAttrValue) {
  const line = '<meta ' + attrName + '="' + attrValue + '" content="' + escapeHtmlAttribute(content) + '">';
  const pattern = new RegExp(
    "<meta\\b(?=[^>]*\\b" + attrName + "=[\"']" + escapeRegExp(attrValue) + "[\"'])[^>]*>",
    "i"
  );

  if (pattern.test(html)) {
    return html.replace(pattern, line);
  }

  if (afterAttrName && afterAttrValue) {
    return addAfterMeta(html, afterAttrName, afterAttrValue, [line]);
  }

  return insertBeforeHeadEnd(html, [line]);
}

function removeMeta(html, attrName, attrValue) {
  const pattern = new RegExp(
    "\\s*<meta\\b(?=[^>]*\\b" + attrName + "=[\"']" + escapeRegExp(attrValue) + "[\"'])[^>]*>",
    "ig"
  );
  return html.replace(pattern, "");
}

function getHtmlLang(html) {
  const match = html.match(/<html[^>]*\slang=["']([^"']+)["']/i);
  return (match ? match[1] : "en").toLowerCase();
}

function loadRegistryTools() {
  if (!fs.existsSync(TOOL_REGISTRY_PATH)) {
    return [];
  }

  try {
    const code = fs.readFileSync(TOOL_REGISTRY_PATH, "utf8");
    const sandbox = {
      console,
      window: {},
      document: undefined,
      CustomEvent: function CustomEvent() {},
    };

    vm.createContext(sandbox);
    vm.runInContext(code, sandbox, { filename: TOOL_REGISTRY_PATH });

    return Array.isArray(sandbox.AFRO_TOOLS) ? sandbox.AFRO_TOOLS : [];
  } catch (error) {
    console.warn("Could not load tool registry for OG fallbacks:", error.message);
    return [];
  }
}

function buildToolPathIndex(tools) {
  const index = new Map();

  for (const tool of tools) {
    const pathname = hrefToPathname(tool && tool.href);
    if (!pathname) continue;

    const list = index.get(pathname) || [];
    list.push(tool);
    index.set(pathname, list);
  }

  return index;
}

function getToolImageIds(tool) {
  return [tool && tool.imageId, tool && tool.sourceId, tool && tool.id]
    .map(function (value) {
      return String(value || "").trim();
    })
    .filter(Boolean)
    .filter(function (value, index, values) {
      return values.indexOf(value) === index;
    });
}

function findToolAssetRelativePath(tool) {
  for (const toolId of getToolImageIds(tool)) {
    for (const ext of TOOL_IMAGE_EXTENSIONS) {
      const relativePath = "/assets/img/tools/" + toolId + ext;
      const absolutePath = path.join(ROOT, "assets", "img", "tools", toolId + ext);

      if (fs.existsSync(absolutePath)) {
        return relativePath;
      }
    }
  }

  return null;
}

function scoreToolCandidate(tool, pageLang) {
  const toolLang = String(tool && tool.lang ? tool.lang : "en").toLowerCase();
  let score = 0;

  if (toolLang === pageLang) score += 4;
  if (pageLang.startsWith("fr") && /-fr$/i.test(tool.id || "")) score += 2;
  if (pageLang.startsWith("sw") && /-sw$/i.test(tool.id || "")) score += 2;
  if (toolLang === "en" && pageLang === "en") score += 1;

  return score;
}

const TOOLS_BY_PATH = buildToolPathIndex(loadRegistryTools());

function getPreferredToolImage(filePath, html) {
  const pathname = normalizePathname(getCanonicalPath(html) || fileToPathname(filePath));
  const reviewed = require('./lib/french-document-seo').reviewedArtwork(ROOT, pathname,
    require('../data/localization/fr-document-pdf-parity.json'), require('../data/localization/fr-document-pdf-artwork.json'));
  if (reviewed && getHtmlLang(html).startsWith('fr')) return {relativePath: reviewed, absoluteUrl: SITE_ORIGIN + reviewed};
  const tools = TOOLS_BY_PATH.get(pathname) || [];

  if (!tools.length) {
    return null;
  }

  const pageLang = getHtmlLang(html);
  const candidates = tools
    .map(function (tool) {
      const relativePath = findToolAssetRelativePath(tool);
      return relativePath
        ? {
            tool,
            relativePath,
            absoluteUrl: SITE_ORIGIN + relativePath,
            score: scoreToolCandidate(tool, pageLang),
          }
        : null;
    })
    .filter(Boolean)
    .sort(function (a, b) {
      if (b.score !== a.score) return b.score - a.score;
      return String(a.tool.id || "").localeCompare(String(b.tool.id || ""));
    });

  return candidates[0] || null;
}

function mutateSchemaImage(schema, imageUrl) {
  if (!schema || typeof schema !== "object") {
    return false;
  }

  let changed = false;

  if (Array.isArray(schema["@graph"])) {
    schema["@graph"].forEach(function (entry) {
      changed = mutateSchemaImage(entry, imageUrl) || changed;
    });
  }

  const types = Array.isArray(schema["@type"]) ? schema["@type"] : [schema["@type"]];
  const supportsImage = types.some(function (type) {
    return /WebApplication|SoftwareApplication|WebPage|CollectionPage/i.test(String(type || ""));
  });

  if (!supportsImage || schema.image === imageUrl) {
    return changed;
  }

  schema.image = imageUrl;
  return true;
}

function syncStructuredDataImage(html, imageUrl) {
  return html.replace(
    /<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi,
    function (match, jsonText) {
      const raw = jsonText.trim();
      let parsed;

      try {
        parsed = JSON.parse(raw);
      } catch (error) {
        return match;
      }

      let changed = false;

      if (Array.isArray(parsed)) {
        parsed.forEach(function (schema) {
          changed = mutateSchemaImage(schema, imageUrl) || changed;
        });
      } else {
        changed = mutateSchemaImage(parsed, imageUrl);
      }

      if (!changed) {
        return match;
      }

      return '<script type="application/ld+json">\n' + JSON.stringify(parsed, null, 2) + "\n</script>";
    }
  );
}

function normalizeToolImagePath(value) {
  if (!value) return null;
  return String(value).startsWith(SITE_ORIGIN) ? String(value).slice(SITE_ORIGIN.length) : String(value);
}

function syncVisibleToolImage(html, relativePath) {
  const pattern = /<img\b(?=[^>]*\bclass=["'][^"']*tool-info-img[^"']*["'])(?=[^>]*\bsrc=["'][^"']*\/assets\/img\/tools\/[^"']+["'])[^>]*>/i;
  const match = html.match(pattern);

  if (!match) {
    return { html, changed: false };
  }

  const tag = match[0];
  const srcMatch = tag.match(/\bsrc=["']([^"']+)["']/i);

  if (!srcMatch) {
    return { html, changed: false };
  }

  if (normalizeToolImagePath(srcMatch[1]) === relativePath) {
    return { html, changed: false };
  }

  const nextTag = tag.replace(/\bsrc=["'][^"']+["']/i, 'src="' + escapeHtmlAttribute(relativePath) + '"');
  return {
    html: html.replace(tag, nextTag),
    changed: nextTag !== tag,
  };
}

// Type-only repairs require route-contract context: a filename alone cannot establish
// indexability, locale availability or semantic type. Existing declarations always win.
function applyMissingOgType(html, filePath, record) {
  const unchanged = { html, changed: false, usedToolImage: false };
  if (!record || record.state !== "page" || record.indexability !== "indexable") return unchanged;
  if (record.localeCoverage && (record.localeCoverage.indexableEligible === false || record.localeCoverage.state === "unavailable")) return unchanged;
  if (/^\/(?:fr\/|sw\/|yo\/|ha\/)?(?:auth|admin|private|api)(?:\/|$)/i.test(record.route || "")) return unchanged;
  const relative = path.relative(ROOT, filePath).replace(/\\/g, "/");
  if (!record.source || record.source.file !== relative || relative.startsWith("../")) return unchanged;
  const head = /<head\b[^>]*>([\s\S]*?)<\/head\s*>/i.exec(html);
  if (!head) return unchanged;
  const content = head[1].replace(/<!--[\s\S]*?-->|<script\b[^>]*>[\s\S]*?<\/script\s*>|<style\b[^>]*>[\s\S]*?<\/style\s*>/gi, "");
  const attribute = (tag, name) => {
    const match = new RegExp("(?:^|\\s)" + name + "\\s*=\\s*(?:\"([^\"]*)\"|'([^']*)'|([^\\s>]+))", "i").exec(tag);
    return match ? decodeHtml(match[1] ?? match[2] ?? match[3]) : "";
  };
  const metas = content.match(/<meta\b[^>]*>/gi) || [];
  if (metas.some(tag => [attribute(tag, "name"), attribute(tag, "property")].some(value => value.toLowerCase() === "og:type"))) return unchanged;
  if (metas.some(tag => /^(?:robots|googlebot|bingbot)$/i.test(attribute(tag, "name")) && /(?:^|[,\s])(?:noindex|none)(?:[,\s]|$)/i.test(attribute(tag, "content")))) return unchanged;
  if (metas.some(tag => /^refresh$/i.test(attribute(tag, "http-equiv")))) return unchanged;
  const canonicals = (content.match(/<link\b[^>]*>/gi) || []).filter(tag => /(?:^|\s)canonical(?:\s|$)/i.test(attribute(tag, "rel")));
  if (canonicals.length !== 1) return unchanged;
  const canonicalHref = attribute(canonicals[0], "href");
  if (!canonicalHref) return unchanged;
  let canonical;
  try { canonical = new URL(canonicalHref, SITE_ORIGIN); } catch (_) { return unchanged; }
  if (canonical.origin !== SITE_ORIGIN || canonical.search || canonical.hash || canonical.username || canonical.password) return unchanged;
  if (normalizePathname(canonical.pathname) !== normalizePathname(fileToPathname(filePath)) || normalizePathname(canonical.pathname) !== normalizePathname(record.route)) return unchanged;
  if (!["page", "country-tool", "category", "tool"].includes(record.pageType)) {
    throw new Error("Missing og:type needs semantic classification review: " + relative + " (" + record.pageType + ")");
  }
  const isArticle = value => {
    if (!value || typeof value !== "object") return false;
    const types = [].concat(value["@type"] || []);
    // Schema URL/CURIE forms share the local type name. Only the documented
    // Article posting family conflicts here; JobPosting is not an Article.
    return types.some(type => /Article$|^(?:BlogPosting|LiveBlogPosting|SocialMediaPosting|DiscussionForumPosting|Report|APIReference)$/i.test(String(type).trim().replace(/[\/#]+$/, "").split(/[\/#:]/).pop())) || Object.values(value).some(child => Array.isArray(child) ? child.some(isArticle) : isArticle(child));
  };
  for (const script of head[1].replace(/<!--[\s\S]*?-->/g, "").matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi)) {
    if (attribute(script[1], "type").toLowerCase() !== "application/ld+json") continue;
    let schema;
    try { schema = JSON.parse(script[2]); } catch (_) {
      throw new Error("Missing og:type needs classification review: malformed JSON-LD in " + relative);
    }
    if (isArticle(schema)) throw new Error("Missing og:type needs article semantics review: " + relative);
  }
  const closing = /<\/head\s*>$/i.exec(head[0]);
  const offset = head.index + head[0].length - closing[0].length;
  return { html: html.slice(0, offset) + '<meta property="og:type" content="website">\n' + html.slice(offset), changed: true, usedToolImage: false };
}

// Complete validation precedes the first write, including unknown classifications.
function planOgTypeRepairs(records, readHtml = record => fs.readFileSync(path.join(ROOT, record.source.file), "utf8")) {
  const planned = [];
  const seen = new Set();
  for (const record of records) {
    if (record.state !== "page" || record.indexability !== "indexable") continue;
    const file = path.resolve(ROOT, record.source.file);
    if (!file.startsWith(ROOT + path.sep)) throw new Error("OG owner outside source root");
    if (seen.has(file)) throw new Error("Duplicate OG owner requires review: " + record.source.file);
    seen.add(file);
    const result = applyMissingOgType(readHtml(record), file, record);
    if (result.changed) planned.push({ file, html: result.html });
  }
  return planned;
}

function applyFallbacks(html, filePath, options = {}) {
  if (options.typeOnly) return applyMissingOgType(html, filePath, options.routeRecord);
  if (!html.includes("</head>")) return { html, changed: false, usedToolImage: false };
  const robots = getMetaContent(html, "name", "robots");
  if (robots && /(?:^|[,\s])noindex(?:[,\s]|$)/i.test(robots)) {
    return { html, changed: false, usedToolImage: false };
  }
  if (isRedirectLike(html, filePath)) return { html, changed: false, usedToolImage: false };

  const typed = applyMissingOgType(html, filePath, options.routeRecord).html;
  let next = getHtmlLang(html).startsWith('fr')
    ? require('./lib/french-document-seo').repairDocumentBreadcrumbs(typed,
      normalizePathname(getCanonicalPath(html) || fileToPathname(filePath)),
      require('../data/localization/fr-document-pdf-parity.json')) : typed;
  let changed = next !== html;

  const canonicalUrl = getCanonicalUrl(next);
  const existingOgUrl = getMetaContent(next, "property", "og:url");
  if (canonicalUrl && existingOgUrl !== canonicalUrl) {
    next = upsertMetaContent(next, "property", "og:url", canonicalUrl, "property", "og:description");
    changed = true;
  }

  // A reviewed article hero owns its social image even when the article embeds a tool.
  const reviewedBlogImage = REVIEWED_BLOG_SOCIAL_IMAGES.get(path.relative(ROOT, filePath).replace(/\\/g, '/'));
  const retainsReviewedBlogImage = reviewedBlogImage && getMetaContent(next, "property", "og:image") === reviewedBlogImage;
  const preferredToolImage = retainsReviewedBlogImage ? null : getPreferredToolImage(filePath, html);
  const targetImage = preferredToolImage ? preferredToolImage.absoluteUrl : DEFAULT_IMAGE;
  const existingOgImage = getMetaContent(next, "property", "og:image");
  const existingTwitterImage = getMetaContent(next, "name", "twitter:image");
  const pageTitle = getPageTitle(next);
  const pageDescription = getMetaContent(next, "name", "description");

  // Institutional, author, locale hub and country pages also need complete cards.
  // The image registry determines artwork, not whether a public page gets metadata.
  {
    if (pageTitle && !getMetaContent(next, "property", "og:title")) {
      next = upsertMetaContent(next, "property", "og:title", pageTitle, "name", "description");
      changed = true;
    }

    if (pageDescription && !getMetaContent(next, "property", "og:description")) {
      next = upsertMetaContent(next, "property", "og:description", pageDescription, "property", "og:title");
      changed = true;
    }

    if (!getMetaContent(next, "name", "twitter:card")) {
      next = upsertMetaContent(next, "name", "twitter:card", "summary_large_image", "property", "og:site_name");
      changed = true;
    }

    // An existing card or image choice does not provide explicit Twitter copy.
    if (pageTitle && !getMetaContent(next, "name", "twitter:title")) {
      next = upsertMetaContent(next, "name", "twitter:title", pageTitle, "name", "twitter:card");
      changed = true;
    }

    if (pageDescription && !getMetaContent(next, "name", "twitter:description")) {
      next = upsertMetaContent(next, "name", "twitter:description", pageDescription, "name", "twitter:title");
      changed = true;
    }
  }

  if (preferredToolImage || !existingOgImage) {
    next = upsertMetaContent(next, "property", "og:image", targetImage, "property", "og:description");
    changed = existingOgImage !== targetImage || changed;
  }

  if (preferredToolImage || !existingTwitterImage) {
    const twitterImage = preferredToolImage ? targetImage : (existingOgImage || targetImage);
    next = upsertMetaContent(next, "name", "twitter:image", twitterImage, "name", "twitter:description");
    changed = existingTwitterImage !== twitterImage || changed;
  }

  if (preferredToolImage) {
    const dimsSync = syncOgImageDimensions(next, targetImage, REVIEWED_TOOL_SOCIAL_IMAGES.get(fileToPathname(filePath)) === targetImage);
    if (dimsSync !== next) {
      next = dimsSync;
      changed = true;
    }

    const syncedStructuredData = syncStructuredDataImage(next, targetImage);
    if (syncedStructuredData !== next) {
      next = syncedStructuredData;
      changed = true;
    }

    const visibleImageSync = syncVisibleToolImage(next, preferredToolImage.relativePath);
    if (visibleImageSync.changed) {
      next = visibleImageSync.html;
      changed = true;
    }
  } else {
    const usingDefaultImage = !existingOgImage || existingOgImage === DEFAULT_IMAGE;
    if (usingDefaultImage) {
      const widthBefore = getMetaContent(next, "property", "og:image:width");
      if (widthBefore !== DEFAULT_WIDTH) {
        next = upsertMetaContent(next, "property", "og:image:width", DEFAULT_WIDTH, "property", "og:image");
        changed = true;
      }

      const heightBefore = getMetaContent(next, "property", "og:image:height");
      if (heightBefore !== DEFAULT_HEIGHT) {
        next = upsertMetaContent(next, "property", "og:image:height", DEFAULT_HEIGHT, "property", "og:image:width");
        changed = true;
      }
    } else {
      // Page carries its own og:image. Only correct dimensions it already declares; do not add
      // them where absent (that would rewrite thousands of pages for no correctness gain).
      const dimsSync = syncOgImageDimensions(next, existingOgImage, REVIEWED_TOOL_SOCIAL_IMAGES.get(fileToPathname(filePath)) === existingOgImage);
      if (dimsSync !== next) {
        next = dimsSync;
        changed = true;
      }
    }
  }

  return {
    html: next,
    changed,
    usedToolImage: Boolean(preferredToolImage),
  };
}

function main() {
  const args = process.argv.slice(2);
  if (args.some(arg => !["--type-only", "--check"].includes(arg)) || (args.includes("--check") && !args.includes("--type-only"))) throw new Error("Usage: apply-og-fallbacks.js [--type-only [--check]]");
  const records = require('./lib/route-contract').buildRouteGraph().routes
    .filter(record => record.state === 'page' && record.indexability === 'indexable');
  const typePlan = planOgTypeRepairs(records);
  if (args.includes("--type-only")) {
    const planned = typePlan;
    if (!args.includes("--check")) planned.forEach(row => writeFileAtomic(row.file, row.html));
    console.log("Missing OG types " + (args.includes("--check") ? "pending:" : "patched:"), planned.length);
    if (args.includes("--check") && planned.length) process.exitCode = 1;
    return;
  }
  const patched = [];
  let toolImagePages = 0;

  for (const record of records) {
    const file = path.join(ROOT, record.source.file);
    const html = fs.readFileSync(file, "utf8");
    const result = applyFallbacks(html, file, { routeRecord: record });

    if (!result.changed) continue;

    writeFileAtomic(file, result.html);
    patched.push(path.relative(ROOT, file).replace(/\\/g, "/"));
    if (result.usedToolImage) {
      toolImagePages += 1;
    }
  }

  console.log("OG pages patched:", patched.length);
  console.log("Pages switched to tool images:", toolImagePages);
  patched.slice(0, 20).forEach((file) => console.log("  " + file));
  if (patched.length > 20) {
    console.log("  ... and " + (patched.length - 20) + " more");
  }
}

if (require.main === module) main();

module.exports = { applyFallbacks, planOgTypeRepairs, getMetaContent, getPageTitle };
