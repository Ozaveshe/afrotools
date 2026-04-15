#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.resolve(__dirname, "..");
const SITE_ORIGIN = "https://afrotools.com";
const DEFAULT_IMAGE = SITE_ORIGIN + "/assets/img/og-default.png";
const DEFAULT_WIDTH = "1200";
const DEFAULT_HEIGHT = "630";
const TOOL_REGISTRY_PATH = path.join(ROOT, "assets", "js", "components", "tool-registry.js");
const TOOL_IMAGE_EXTENSIONS = [".webp", ".png", ".jpg", ".jpeg"];
const IGNORE_DIRS = new Set([
  ".git",
  ".claude",
  ".jamb",
  ".jamb-tools",
  "node_modules",
  "afrotools-deploy",
]);

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
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
  const canonicalMatch = html.match(/<link\s+rel=["']canonical["']\s+href=["']([^"']+)["']/i);
  if (!canonicalMatch) return null;

  try {
    return normalizePathname(new URL(canonicalMatch[1], SITE_ORIGIN).pathname);
  } catch (error) {
    return normalizePathname(canonicalMatch[1]);
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

  const contentMatch = tag.match(/\bcontent=["']([^"']+)["']/i);
  return contentMatch ? contentMatch[1] : null;
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

function findToolAssetRelativePath(toolId) {
  if (!toolId) return null;

  for (const ext of TOOL_IMAGE_EXTENSIONS) {
    const relativePath = "/assets/img/tools/" + toolId + ext;
    const absolutePath = path.join(ROOT, "assets", "img", "tools", toolId + ext);

    if (fs.existsSync(absolutePath)) {
      return relativePath;
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
  const tools = TOOLS_BY_PATH.get(pathname) || [];

  if (!tools.length) {
    return null;
  }

  const pageLang = getHtmlLang(html);
  const candidates = tools
    .map(function (tool) {
      const relativePath = findToolAssetRelativePath(tool.id);
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

  const types = Array.isArray(schema["@type"]) ? schema["@type"] : [schema["@type"]];
  const supportsImage = types.some(function (type) {
    return /WebApplication|SoftwareApplication|WebPage|CollectionPage/i.test(String(type || ""));
  });

  if (!supportsImage || schema.image === imageUrl) {
    return false;
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

function applyFallbacks(html, filePath) {
  if (!html.includes("</head>")) return { html, changed: false, usedToolImage: false };
  if (!/<meta\s+(property|name)=["']og:title["']/i.test(html)) return { html, changed: false, usedToolImage: false };
  if (isRedirectLike(html, filePath)) return { html, changed: false, usedToolImage: false };

  let next = html;
  let changed = false;

  const preferredToolImage = getPreferredToolImage(filePath, html);
  const targetImage = preferredToolImage ? preferredToolImage.absoluteUrl : DEFAULT_IMAGE;
  const existingOgImage = getMetaContent(next, "property", "og:image");
  const existingTwitterImage = getMetaContent(next, "name", "twitter:image");

  if (existingOgImage !== targetImage) {
    next = upsertMetaContent(next, "property", "og:image", targetImage, "property", "og:description");
    changed = true;
  }

  if (existingTwitterImage !== targetImage) {
    next = upsertMetaContent(next, "name", "twitter:image", targetImage, "name", "twitter:description");
    changed = true;
  }

  if (preferredToolImage) {
    const withoutWidth = removeMeta(next, "property", "og:image:width");
    if (withoutWidth !== next) {
      next = withoutWidth;
      changed = true;
    }

    const withoutHeight = removeMeta(next, "property", "og:image:height");
    if (withoutHeight !== next) {
      next = withoutHeight;
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
  }

  return {
    html: next,
    changed,
    usedToolImage: Boolean(preferredToolImage),
  };
}

function main() {
  const files = findHtmlFiles(ROOT);
  const patched = [];
  let toolImagePages = 0;

  for (const file of files) {
    const html = fs.readFileSync(file, "utf8");
    const result = applyFallbacks(html, file);

    if (!result.changed) continue;

    fs.writeFileSync(file, result.html, "utf8");
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

main();
