"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");
const rows = {
  "creator-carousel": ["carousel-ya-mitandao", { words: 76, h2: 2, links: 3, schema: 1 }],
  "creator-clip": ["kukata-video-za-mtayarishi", { words: 235, h2: 0, links: 4, schema: 1 }],
  "creator-desk": ["dawati-la-mtayarishi", { words: 93, h2: 0, links: 1, schema: 1 }],
  "creator-hashtags": ["hashtag-za-maudhui", { words: 86, h2: 0, links: 1, schema: 1 }],
  "creator-hooks": ["hook-za-video", { words: 69, h2: 2, links: 3, schema: 1 }],
  "creator-kit": ["media-kit-ya-mtayarishi", { words: 116, h2: 2, links: 3, schema: 1 }],
  "creator-mail": ["barua-ya-mtayarishi", { words: 71, h2: 2, links: 3, schema: 1 }],
  "creator-mind": ["mawazo-ya-mtayarishi", { words: 75, h2: 2, links: 3, schema: 1 }],
  "creator-money": ["mapato-ya-mtayarishi", { words: 75, h2: 2, links: 3, schema: 1 }],
  "creator-page": ["ukurasa-wa-mtayarishi", { words: 69, h2: 2, links: 3, schema: 1 }],
  "creator-polish": ["boresha-maudhui-ya-mtayarishi", { words: 69, h2: 2, links: 3, schema: 1 }],
};

function read(rel) {
  return fs.readFileSync(path.join(ROOT, rel), "utf8");
}

function metrics(html) {
  const visible = html
    .replace(/<script\b[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&[a-z#0-9]+;/gi, " ");
  return {
    words: (visible.match(/[\p{L}\p{N}][\p{L}\p{N}'’.-]*/gu) || []).length,
    h2: (html.match(/<h2\b/gi) || []).length,
    links: (html.match(/<a\b[^>]*href=(['"])(?!https?:\/\/|mailto:|tel:|#)/gi) || []).length,
    schema: (html.match(/application\/ld\+json/gi) || []).length,
  };
}

for (const [owner, [slug, before]] of Object.entries(rows)) {
  const english = metrics(read(`tools/${owner}/index.html`));
  const sw = read(`sw/zana/${slug}/index.html`);
  const after = metrics(sw);
  assert.ok(after.words >= Math.ceil(english.words * 0.6), `${owner}: Sw word floor ${after.words}/${english.words}`);
  assert.ok(after.words >= before.words + 250, `${owner}: visible depth did not materially improve`);
  assert.ok(after.h2 >= english.h2, `${owner}: H2 floor ${after.h2}/${english.h2}`);
  assert.ok(after.links >= english.links, `${owner}: internal-link floor ${after.links}/${english.links}`);
  assert.ok(after.schema >= english.schema, `${owner}: schema floor ${after.schema}/${english.schema}`);
  assert.match(sw, new RegExp(`data-swfa-depth=["']${owner}["']`));
  for (const marker of [
    "Mbinu ya kufanya kazi",
    "Jinsi ya kutafsiri matokeo",
    "Chanzo na mpaka wa matokeo",
    "Faragha na hifadhi",
    "Kabla ya kutumia au kuchapisha",
    "Maswali yanayoulizwa mara kwa mara",
  ]) assert.ok(sw.includes(marker), `${owner}: missing ${marker}`);
  assert.match(sw, /"@type":"FAQPage"/);
  assert.match(sw, /"@type":"BreadcrumbList"/);
  assert.equal((sw.match(/SW_CREATIVE_DEPTH_START/g) || []).length, 1, `${owner}: depth source must be idempotent`);
  assert.doesNotMatch(sw, /Fungua zana kamili ya Kiingereza|Open the full English|AI-powered|reach ya uhakika/i);
}

console.log("Swahili Creative A content-depth floors passed: 11/11 routes exceed prior visible depth and English semantic structure floors.");
