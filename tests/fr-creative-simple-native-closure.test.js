"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const ROOT = path.resolve(__dirname, "..");
const owners = [
  ["book-publishing-cost", "cout-publication-livre"],
  ["engagement-rate", "taux-engagement"],
  ["personal-brand-audit", "audit-marque-personnelle"],
  ["photography-pricing", "prix-seance-photo"],
  ["podcast-monetization", "monetisation-podcast"],
];

function read(relative) {
  return fs.readFileSync(path.join(ROOT, relative), "utf8");
}

test("five native owners retain reciprocal SEO, discovery, AI and artwork contracts", () => {
  const registry = read("assets/js/components/tool-registry.js");
  const routeMap = read("assets/js/ai/french-route-map.generated.js");
  const catalog = read("data/ai/tool-catalog-pack.json");
  for (const [id, slug] of owners) {
    const english = read(`tools/${id}/index.html`);
    const french = read(`fr/tools/${slug}/index.html`);
    assert.match(
      english,
      new RegExp(`hreflang="fr" href="https://afrotools.com/fr/tools/${slug}/"`)
    );
    assert.match(
      french,
      new RegExp(`hreflang="en" href="https://afrotools.com/tools/${id}/"`)
    );
    assert.match(
      french,
      new RegExp(
        `<link rel="canonical" href="https://afrotools.com/fr/tools/${slug}/">`
      )
    );
    assert.match(french, /"@type"\s*:\s*"SoftwareApplication"/);
    assert.match(
      french,
      new RegExp(`/assets/img/tools/${id}\\.webp`)
    );
    assert.ok(
      fs.statSync(path.join(ROOT, "assets", "img", "tools", `${id}.webp`))
        .size > 1000
    );
    assert.match(
      registry,
      new RegExp(
        `href: '/fr/tools/${slug}/'.*sourceId: '${id}'.*imageId: '${id}'`
      )
    );
    assert.ok(routeMap.includes(`"/tools/${id}/":"/fr/tools/${slug}/"`));
    assert.ok(catalog.includes(`/tools/${id}/`));
    assert.ok(french.includes("/assets/js/pages/creative/creative-result-tools.js"));
    assert.ok(english.includes("/assets/js/pages/creative/creative-result-tools.js"));
  }
});

test("shared result helper is local-only and exports UTF-8 text", () => {
  const helper = read(
    "assets/js/pages/creative/creative-result-tools.js"
  );
  assert.match(helper, /new Blob/);
  assert.match(helper, /text\/plain;charset=utf-8/);
  assert.doesNotMatch(helper, /\bfetch\s*\(|XMLHttpRequest|sendBeacon/);
});
