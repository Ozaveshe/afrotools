const assert = require("assert");
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const data = require("../data/ai/vertical-landing-pages.json");

function readRoute(routePath) {
  const file = path.join(ROOT, routePath.replace(/^\//, ""), "index.html");
  assert.ok(fs.existsSync(file), `Expected ${file} to exist`);
  return fs.readFileSync(file, "utf8");
}

function canonicalFor(routePath) {
  return `https://afrotools.com${routePath}`;
}

function escapeHtml(value) {
  return String(value == null ? "" : value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function parseJsonLdBlocks(routePath, html) {
  const blocks = [];
  const pattern = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi;
  let match;
  while ((match = pattern.exec(html))) {
    try {
      blocks.push(JSON.parse(match[1]));
    } catch (err) {
      assert.fail(`${routePath} has invalid JSON-LD: ${err.message}`);
    }
  }
  return blocks;
}

function flattenJsonLdNodes(blocks) {
  const nodes = [];
  blocks.forEach((block) => {
    if (Array.isArray(block)) {
      nodes.push(...block);
    } else if (block && Array.isArray(block["@graph"])) {
      nodes.push(...block["@graph"]);
    } else if (block) {
      nodes.push(block);
    }
  });
  return nodes;
}

function hasSchemaType(node, type) {
  const schemaTypes = Array.isArray(node && node["@type"]) ? node["@type"] : [node && node["@type"]];
  return schemaTypes.some((schemaType) => schemaType === type);
}

function assertBreadcrumbSchema(routePath, html) {
  const nodes = flattenJsonLdNodes(parseJsonLdBlocks(routePath, html));
  const breadcrumbs = nodes.filter((node) => hasSchemaType(node, "BreadcrumbList"));
  assert.ok(breadcrumbs.length, `${routePath} should include BreadcrumbList schema`);
  breadcrumbs.forEach((breadcrumb) => {
    assert.ok(String(breadcrumb["@id"] || "").endsWith("#breadcrumb"), `${routePath} BreadcrumbList should use a dedicated #breadcrumb id`);
    assert.ok(Array.isArray(breadcrumb.itemListElement), `${routePath} BreadcrumbList should include itemListElement`);
    breadcrumb.itemListElement.forEach((item, index) => {
      assert.ok(item.item, `${routePath} breadcrumb item ${index + 1} (${item.name || "unnamed"}) should include item`);
      assert.match(String(item.item), /^https:\/\/afrotools\.com\//, `${routePath} breadcrumb item ${index + 1} should use an AfroTools URL`);
    });
  });
}

function assertAiListItemsHaveItem(routePath, html) {
  const nodes = flattenJsonLdNodes(parseJsonLdBlocks(routePath, html));
  nodes
    .filter((node) => hasSchemaType(node, "ItemList") || hasSchemaType(node, "BreadcrumbList"))
    .forEach((node) => {
      if (!Array.isArray(node.itemListElement)) return;
      node.itemListElement.forEach((item, index) => {
        assert.ok(item.item, `${routePath} ${node["@type"]} item ${index + 1} should include item`);
      });
    });
}

function assertSeoPage(routePath, html) {
  assert.match(html, /<title>[^<]{20,}<\/title>/i, `${routePath} should have a useful title`);
  assert.match(html, /<meta name="description" content="[^"]{80,}"/i, `${routePath} should have a useful meta description`);
  assert.ok(html.includes(`<link rel="canonical" href="${canonicalFor(routePath)}"`), `${routePath} should self-canonicalize`);
  assert.ok(!/<meta[^>]+name=["']robots["'][^>]+noindex/i.test(html), `${routePath} must be indexable`);
  assert.ok(html.includes('property="og:title"'), `${routePath} should include OG metadata`);
  assert.ok(html.includes('type="application/ld+json"'), `${routePath} should include structured data`);
  assertBreadcrumbSchema(routePath, html);
  assertAiListItemsHaveItem(routePath, html);
}

function assertVertical(page) {
  const html = readRoute(page.path);
  assertSeoPage(page.path, html);
  assert.ok(html.includes("FAQPage"), `${page.path} should include FAQ schema`);
  assert.ok(html.includes(page.primaryPrompt), `${page.path} should include its primary example prompt`);
  assert.ok(html.includes(`/ai/?q=${encodeURIComponent(page.primaryPrompt)}`), `${page.path} should link the primary prompt into /ai/`);
  page.tools.forEach((tool) => {
    assert.ok(html.includes(`href="${tool.href}"`), `${page.path} should link ${tool.href}`);
  });
  page.limitations.forEach((item) => {
    assert.ok(html.includes(escapeHtml(item)), `${page.path} should include limitation: ${item}`);
  });
}

function assertHub() {
  const html = readRoute(data.hub.path);
  assertSeoPage(data.hub.path, html);
  assert.ok(html.includes("Ask AfroTools AI FAQ"), "/ai/ should include FAQ content");
  data.verticals.forEach((page) => {
    assert.ok(html.includes(`href="${page.path}"`), `/ai/ should link ${page.path}`);
  });
  [
    "/tools/scholarship-finder/",
    "/tools/cv-builder/",
    "/tools/paye-calculator/",
    "/tools/import-duty/",
    "/tools/solar-roi/",
    "/engineering/floor-planner/"
  ].forEach((href) => {
    assert.ok(html.includes(`href="${href}"`), `/ai/ should link ${href}`);
  });
}

assert.equal(data.verticals.length, 7, "Expected seven AI vertical pages");
assertHub();
data.verticals.forEach(assertVertical);

console.log("ai-vertical-landing-pages tests passed");
