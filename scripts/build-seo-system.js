#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const { writeFileSyncWithRetry } = require("./lib/safe-write");

const ROOT = path.resolve(__dirname, "..");
const DATA_PATH = path.join(ROOT, "data", "seo", "priority-pages.json");

const STYLE_TAG = '<link rel="stylesheet" href="/assets/css/seo-clusters.css">';

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeFile(filePath, content) {
  writeFileSyncWithRetry(filePath, content, "utf8");
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function ensureHeadTag(html, tag) {
  if (tag === STYLE_TAG) {
    const seoStylePattern = /<link\b[^>]*href=["']\/assets\/css\/seo-clusters\.css(?:\?v=[a-f0-9]{8})?["'][^>]*>\s*/gi;
    let seen = false;
    html = html.replace(seoStylePattern, function (match) {
      if (seen) {
        return "";
      }
      seen = true;
      return match.endsWith("\n") ? match : match + "\n";
    });
    if (seen) {
      return html;
    }
  }

  if (html.includes(tag)) {
    return html;
  }
  return html.replace("</head>", tag + "\n</head>");
}

function removeHeadTag(html, tag) {
  return html.replace(new RegExp("\\s*" + tag.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi"), "");
}

function upsertTitle(html, title) {
  if (!title) {
    return html;
  }

  if (/<title>[\s\S]*?<\/title>/i.test(html)) {
    return html.replace(/<title>[\s\S]*?<\/title>/i, "<title>" + title + "</title>");
  }

  return html.replace("</head>", "<title>" + title + "</title>\n</head>");
}

function upsertMetaTag(html, attributeName, attributeValue, content) {
  if (!content) {
    return html;
  }

  const matcher = new RegExp(
    "<meta\\s+" + attributeName + '="' + attributeValue.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + '"\\s+content="[^"]*"[^>]*>',
    "i"
  );
  const replacement = '<meta ' + attributeName + '="' + attributeValue + '" content="' + content + '">';

  if (matcher.test(html)) {
    return html.replace(matcher, replacement);
  }

  return html.replace("</head>", replacement + "\n</head>");
}

function stripBrand(title) {
  return String(title || "").replace(/\s*\|\s*AfroTools\s*$/i, "").trim();
}

function buildAbsoluteUrl(pagePath) {
  return "https://afrotools.com" + pagePath;
}

function buildSchemaNames(pageConfig) {
  const cleanTitle = stripBrand(pageConfig.title);
  const shortTitle = cleanTitle.split(" | ")[0].trim() || cleanTitle;

  return {
    headline: pageConfig.schemaHeadline || cleanTitle,
    pageName: pageConfig.schemaPageName || cleanTitle,
    toolName: pageConfig.schemaName || shortTitle,
    breadcrumbName: pageConfig.breadcrumbName || shortTitle
  };
}

function mergeCards(baseCard, overrideCard) {
  if (!baseCard && !overrideCard) {
    return null;
  }
  return Object.assign({}, baseCard || {}, overrideCard || {});
}

function mergeLists(baseList, overrideList) {
  return Array.isArray(overrideList) && overrideList.length ? overrideList : baseList || [];
}

function renderList(items) {
  if (!Array.isArray(items) || !items.length) {
    return "";
  }

  return items
    .map(function (item) {
      return (
        "      <li>\n" +
        '        <a href="' + escapeHtml(item.href) + '">\n' +
        '          <span class="seo-cluster__item-title">' + escapeHtml(item.title) + "</span>\n" +
        '          <span class="seo-cluster__item-reason">' + escapeHtml(item.reason) + "</span>\n" +
        "        </a>\n" +
        "      </li>"
      );
    })
    .join("\n");
}

function renderFaq(items) {
  if (!Array.isArray(items) || !items.length) {
    return "";
  }

  return (
    '  <div class="seo-cluster__faq">\n' +
    items
      .map(function (item) {
        return (
          "    <details>\n" +
          "      <summary>" + escapeHtml(item.question) + "</summary>\n" +
          '      <div class="seo-cluster__faq-body">' + escapeHtml(item.answer) + "</div>\n" +
          "    </details>"
        );
      })
      .join("\n") +
    "\n  </div>"
  );
}

function buildClusterBlock(pagePath, pageConfig, data) {
  const cluster = (data.clusters || {})[pageConfig.cluster];
  const role = pageConfig.role || "article";

  if (!cluster) {
    return "";
  }

  const quickAnswer = mergeCards(cluster.quickAnswer, pageConfig.quickAnswer);
  const primaryCta = mergeCards(cluster.primaryCta, pageConfig.primaryCta);
  const relatedTools = mergeLists(cluster.relatedTools, pageConfig.relatedTools);
  const relatedGuides = mergeLists(cluster.relatedGuides, pageConfig.relatedGuides);
  const followUpQuestions = mergeLists(cluster.followUpQuestions, pageConfig.followUpQuestions);
  const sectionTitle =
    pageConfig.sectionTitle ||
    cluster.sectionTitle ||
    (role === "tool" ? "Use this tool with better context" : "Use the right tool next");
  const eyebrow =
    pageConfig.eyebrow ||
    cluster.eyebrow ||
    (role === "tool" ? "Useful next steps" : "Related actions");

  const introHtml = quickAnswer
    ? [
        '  <div class="seo-cluster__answer">',
        '    <span class="seo-cluster__answer-label">' + escapeHtml(quickAnswer.title || "Quick answer") + "</span>",
        "    <p>" + escapeHtml(quickAnswer.body) + "</p>",
        "  </div>"
      ].join("\n")
    : "";

  const ctaHtml = primaryCta
    ? [
        '    <div class="seo-cluster__card seo-cluster__card--cta">',
        '      <span class="seo-cluster__kicker">' + escapeHtml(primaryCta.kicker || "Use the tool") + "</span>",
        '      <h3 class="seo-cluster__card-title">' + escapeHtml(primaryCta.title || "Open the tool") + "</h3>",
        "      <p>" + escapeHtml(primaryCta.body || "") + "</p>",
        '      <a class="seo-cluster__cta" href="' + escapeHtml(primaryCta.href || "#") + '">' + escapeHtml(primaryCta.label || "Open tool") + "</a>",
        "    </div>"
      ].join("\n")
    : "";

  const guidesHtml = relatedGuides.length
    ? [
        '    <div class="seo-cluster__card">',
        "      <h3>Related guides</h3>",
        '      <ul class="seo-cluster__list">',
        renderList(relatedGuides),
        "      </ul>",
        "    </div>"
      ].join("\n")
    : "";

  const toolsHtml = relatedTools.length
    ? [
        '    <div class="seo-cluster__card">',
        "      <h3>Related tools</h3>",
        '      <ul class="seo-cluster__list">',
        renderList(relatedTools),
        "      </ul>",
        "    </div>"
      ].join("\n")
    : "";

  return [
    "<!-- seo-cluster-block:start -->",
    '<section class="seo-cluster-shell" aria-label="Helpful next steps">',
    '  <div class="seo-cluster seo-cluster--' + escapeHtml(role) + '" data-seo-cluster="' + escapeHtml(pagePath) + '">',
    '    <div class="seo-cluster__inner">',
    '      <div class="seo-cluster__eyebrow">' + escapeHtml(eyebrow) + "</div>",
    '      <h2 class="seo-cluster__title">' + escapeHtml(sectionTitle) + "</h2>",
    introHtml,
    '      <div class="seo-cluster__grid">',
    ctaHtml,
    guidesHtml,
    toolsHtml,
    "      </div>",
    renderFaq(followUpQuestions),
    "    </div>",
    "  </div>",
    "</section>",
    "<!-- seo-cluster-block:end -->"
  ]
    .filter(Boolean)
    .join("\n");
}

function replaceOrInsertBlock(html, block, anchors) {
  const markerPattern = /<!-- seo-cluster-block:start -->[\s\S]*?<!-- seo-cluster-block:end -->/i;

  if (markerPattern.test(html)) {
    return html.replace(markerPattern, block);
  }

  for (const anchor of anchors) {
    if (html.includes(anchor)) {
      return html.replace(anchor, block + "\n" + anchor);
    }
  }

  return html.replace("</body>", block + "\n</body>");
}

function updateBreadcrumbNames(schema, pageConfig) {
  if (!Array.isArray(schema.itemListElement) || !schema.itemListElement.length) {
    return false;
  }

  const lastItem = schema.itemListElement[schema.itemListElement.length - 1];
  const names = buildSchemaNames(pageConfig);

  if (lastItem && lastItem.name !== names.breadcrumbName) {
    lastItem.name = names.breadcrumbName;
    return true;
  }

  return false;
}

function mutateSchemaObject(schema, pagePath, pageConfig) {
  if (!schema || typeof schema !== "object") {
    return false;
  }

  const names = buildSchemaNames(pageConfig);
  const types = Array.isArray(schema["@type"]) ? schema["@type"] : [schema["@type"]];
  const absoluteUrl = buildAbsoluteUrl(pagePath);
  let changed = false;

  if (types.some(function (type) { return /Article$/i.test(String(type || "")); })) {
    if (schema.headline !== names.headline) {
      schema.headline = names.headline;
      changed = true;
    }
    if (schema.description !== pageConfig.description) {
      schema.description = pageConfig.description;
      changed = true;
    }
    if (schema.name && schema.name !== names.headline) {
      schema.name = names.headline;
      changed = true;
    }
    if (!schema.mainEntityOfPage) {
      schema.mainEntityOfPage = { "@type": "WebPage", "@id": absoluteUrl };
      changed = true;
    }
  }

  if (types.some(function (type) { return /WebApplication|SoftwareApplication/i.test(String(type || "")); })) {
    if (schema.name !== names.toolName) {
      schema.name = names.toolName;
      changed = true;
    }
    if (schema.description !== pageConfig.description) {
      schema.description = pageConfig.description;
      changed = true;
    }
  }

  if (types.some(function (type) { return /WebPage|CollectionPage/i.test(String(type || "")); })) {
    if (schema.name !== names.pageName) {
      schema.name = names.pageName;
      changed = true;
    }
    if (schema.description !== pageConfig.description) {
      schema.description = pageConfig.description;
      changed = true;
    }
    if (schema.url && schema.url !== absoluteUrl) {
      schema.url = absoluteUrl;
      changed = true;
    }
  }

  if (types.some(function (type) { return /BreadcrumbList/i.test(String(type || "")); })) {
    changed = updateBreadcrumbNames(schema, pageConfig) || changed;
  }

  return changed;
}

function syncStructuredData(html, pagePath, pageConfig) {
  return html.replace(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi, function (match, jsonText) {
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
        changed = mutateSchemaObject(schema, pagePath, pageConfig) || changed;
      });
    } else {
      changed = mutateSchemaObject(parsed, pagePath, pageConfig);
    }

    if (!changed) {
      return match;
    }

    return '<script type="application/ld+json">\n' + JSON.stringify(parsed, null, 2) + "\n</script>";
  });
}

function getAnchors(role) {
  if (role === "article") {
    return ["<!-- Related Articles -->", '<div class="article-share">', "</article>", "</main>"];
  }

  if (role === "tool") {
    return ["<afro-related-tools", "<afro-footer>", "</main>", "</body>"];
  }

  return ["<afro-footer>", "</main>", "</body>"];
}

function applyPageConfig(data) {
  let patchedPages = 0;

  Object.keys(data.pages || {}).forEach(function (pagePath) {
    const pageConfig = data.pages[pagePath];
    const filePath = path.join(ROOT, pageConfig.file);

    if (!fs.existsSync(filePath)) {
      throw new Error("Missing priority-page file: " + pageConfig.file);
    }

    let html = fs.readFileSync(filePath, "utf8");

    html = ensureHeadTag(html, STYLE_TAG);
    html = removeHeadTag(html, '<script src="/assets/js/components/seo-cluster-config.js" defer></script>');
    html = removeHeadTag(html, '<script src="/assets/js/components/seo-cluster-blocks.js" defer></script>');

    html = upsertTitle(html, pageConfig.title);
    html = upsertMetaTag(html, "name", "description", pageConfig.description);
    html = upsertMetaTag(html, "property", "og:title", pageConfig.title);
    html = upsertMetaTag(html, "property", "og:description", pageConfig.description);
    html = upsertMetaTag(html, "name", "twitter:title", pageConfig.title);
    html = upsertMetaTag(html, "name", "twitter:description", pageConfig.description);
    html = syncStructuredData(html, pagePath, pageConfig);

    const block = buildClusterBlock(pagePath, pageConfig, data);
    html = replaceOrInsertBlock(html, block, getAnchors(pageConfig.role));

    writeFile(filePath, html);
    patchedPages += 1;
  });

  return patchedPages;
}

function main() {
  const data = readJson(DATA_PATH);
  const patchedPages = applyPageConfig(data);
  console.log("Priority pages patched:", patchedPages);
}

main();
