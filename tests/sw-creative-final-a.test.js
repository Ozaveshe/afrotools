"use strict";
const assert = require("node:assert/strict"),
  fs = require("node:fs"),
  path = require("node:path"),
  vm = require("node:vm");
const ROOT = path.resolve(__dirname, "..");
const rows = [
  [
    "afrostream",
    "afrostream",
    "/fr/tools/afrostream-afrique-s-createur-streaming-hub/",
  ],
  [
    "creator-carousel",
    "carousel-ya-mitandao",
    "/fr/tools/createur-de-carrousel/",
  ],
  [
    "creator-clip",
    "kukata-video-za-mtayarishi",
    "/fr/tools/decoupe-de-video-pour-createur/",
  ],
  ["creator-desk", "dawati-la-mtayarishi", "/fr/tools/bureau-du-createur/"],
  ["creator-hashtags", "hashtag-za-maudhui", "/fr/tools/hashtags-createur/"],
  [
    "creator-hooks",
    "hook-za-video",
    "/fr/tools/accroches-de-contenu-pour-createur/",
  ],
  ["creator-invoice", "ankara-ya-mtayarishi", "/fr/tools/facture-createur/"],
  [
    "creator-kit",
    "media-kit-ya-mtayarishi",
    "/fr/tools/kit-media-pour-createur/",
  ],
  ["creator-mail", "barua-ya-mtayarishi", "/fr/tools/courriels-pour-createur/"],
  [
    "creator-mind",
    "mawazo-ya-mtayarishi",
    "/fr/tools/idees-de-contenu-pour-createur/",
  ],
  ["creator-money", "mapato-ya-mtayarishi", "/fr/tools/revenus-du-createur/"],
  ["creator-page", "ukurasa-wa-mtayarishi", "/fr/tools/page-createur/"],
  [
    "creator-polish",
    "boresha-maudhui-ya-mtayarishi",
    "/fr/tools/amelioration-de-contenu-pour-createur/",
  ],
];
function read(rel) {
  return fs.readFileSync(path.join(ROOT, rel), "utf8");
}
function routeFile(route) {
  return route.replace(/^\//, "").replace(/\/$/, "") + "/index.html";
}
function q(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
assert.equal(rows.length, 13);
for (const [id, slug, fr] of rows) {
  const swRoute = `/sw/zana/${slug}/`,
    enRoute = `/tools/${id}/`,
    sw = read(routeFile(swRoute)),
    en = read(routeFile(enRoute)),
    frHtml = read(routeFile(fr));
  assert.match(sw, /<html lang="sw">/);
  assert.match(
    sw,
    new RegExp(
      `<link rel="canonical" href="https://afrotools\\.com${q(swRoute)}">`,
    ),
  );
  assert.match(
    sw,
    new RegExp(`hreflang="en" href="https://afrotools\\.com${q(enRoute)}"`),
  );
  assert.match(
    sw,
    new RegExp(`hreflang="fr" href="https://afrotools\\.com${q(fr)}"`),
  );
  assert.match(
    sw,
    new RegExp(`hreflang="sw" href="https://afrotools\\.com${q(swRoute)}"`),
  );
  assert.match(
    en,
    new RegExp(`hreflang="sw" href="https://afrotools\\.com${q(swRoute)}"`),
  );
  assert.match(
    frHtml,
    new RegExp(`hreflang="sw" href="https://afrotools\\.com${q(swRoute)}"`),
  );
  assert.match(sw, /application\/ld\+json/);
  assert.match(sw, /name="geo.region" content="002"/);
  assert.match(sw, new RegExp(`assets/img/tools/${q(id)}\\.webp`));
  assert.ok(
    fs.statSync(path.join(ROOT, `assets/img/tools/${id}.webp`)).size > 1000,
  );
  assert.doesNotMatch(sw, /<iframe\b/i);
  assert.doesNotMatch(sw, /<script\b[^>]*src="https?:\/\//i);
  assert.doesNotMatch(sw, /[ÃÂ]|â(?:€”|€™|€œ|€˜)/);
}
const swClip = read("sw/zana/kukata-video-za-mtayarishi/index.html");
const enClip = read("tools/creator-clip/app.html");
for (const id of [
  "saveProjectBtn",
  "loadProjectBtn",
  "genCaptionsBtn",
  "addCaptionBtn",
  "customFont",
  "addOverlayBtn",
  "exportBtn",
  "brightnessSlider",
  "contrastSlider",
  "saturationSlider",
  "audioVolume",
]) {
  assert.match(enClip, new RegExp(`id=["']${id}["']`));
  assert.match(swClip, new RegExp(`id=["']${id}["']`), `Sw clip missing ${id}`);
}
assert.match(swClip, /creator-clip-app-controller\.js/);
assert.doesNotMatch(swClip, /sw-creator-clip-final-a\.js/);
const swCarousel = read("sw/zana/carousel-ya-mitandao/index.html");
for (const name of ["background", "accent"]) {
  assert.match(swCarousel, new RegExp(`"name":"${name}"`));
}
assert.match(swCarousel, /data-export="zip"/);
assert.match(swCarousel, /jszip\.min\.js/);
const swStreamController = read("assets/js/pages/creative/sw-afrostream-final-a.js");
assert.match(swStreamController, /name\.textContent = item\.name/);
assert.match(swStreamController, /Object\.keys\(engine\.COUNTRY_MAP/);
assert.doesNotMatch(swStreamController, /card\.innerHTML/);
const clip = require("../engines/src/creator-clip-engine.js");
assert.deepEqual(
  clip.createPlan({ title: "Klipu ya mfano", start: "00:01", end: "00:03.5" }),
  {
    title: "Klipu ya mfano",
    startSeconds: 1,
    endSeconds: 3.5,
    durationSeconds: 2.5,
    mimeType: "video/webm",
    boundary:
      "The browser records only the selected local media stream; codec support depends on this browser.",
  },
);
assert.equal(clip.isWebm(Uint8Array.from([0x1a, 0x45, 0xdf, 0xa3, 1])), true);
assert.throws(
  () => clip.createPlan({ title: "x", start: 2, end: 1 }),
  /title|end/,
);
const finalWave = require("../engines/src/creator-final-wave-engine.js");
assert.equal(
  finalWave.calculate("creator-carousel", {
    headline: "Mafunzo ya vitendo",
    audience: "Watayarishi",
    points: "Hoja ya kwanza\nHoja ya pili",
    callToAction: "Hifadhi",
  }).slides.length,
  4,
);
assert.equal(
  finalWave.calculate("creator-page", {
    displayName: "Amina Studio",
    bio: "Mtayarishi wa filamu anayeshiriki mafunzo ya vitendo.",
    links: "Portfolio | https://example.com",
  }).links.length,
  1,
);
const invoice = require("../engines/src/creator-invoice-engine.js");
const inv = invoice.createInvoice({
  issuerName: "Studio",
  clientName: "Mteja",
  invoiceNumber: "INV-1",
  currency: "KES",
  taxLabel: "Kodi",
  taxRate: 16,
  items: [{ description: "Video", quantity: 2, unitPrice: 5000 }],
});
assert.equal(inv.valid, true);
assert.equal(inv.total, 1160000);
function load(rel, globalPath) {
  const c = {
    console,
    Date,
    Math,
    Number,
    JSON,
    Intl,
    Set,
    Map,
    localStorage: {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
    },
  };
  c.window = c;
  c.globalThis = c;
  vm.createContext(c);
  vm.runInContext(read(rel), c);
  return globalPath.split(".").reduce((value, key) => value && value[key], c);
}
assert.equal(
  load(
    "engines/src/creator-desk-engine.js",
    "AfroTools.CreatorDeskEngine",
  ).buildProjectRecord({ name: "Mradi", client: "Mteja", value: 10 }).value,
  10,
);
assert.equal(
  load(
    "engines/src/creator-hashtags-engine.js",
    "AfroTools.TagWaveEngine",
  ).generateLocal("biashara ya picha", "instagram", "en").sets.length,
  3,
);
assert.equal(
  load(
    "engines/src/creator-hooks-engine.js",
    "AfroTools.engines.creatorHooks",
  ).generateLocalHooks("bei ya video", "tiktok", "en").hooks.length,
  6,
);
assert.equal(
  load(
    "engines/src/creator-kit-engine.js",
    "AfroTools.CreatorKitEngine",
  ).buildLocalRateCard({
    name: "Studio",
    service: "Video",
    price: 100,
    currency: "KES",
  }).services.length,
  1,
);
assert.equal(
  load(
    "engines/src/creator-mail-engine.js",
    "AfroTools.CreatorMailEngine",
  ).buildNewsletter({
    subject: "Habari",
    headline: "Kichwa",
    body: "Ujumbe huu una maneno ya kutosha kwa jaribio.",
  }).subject,
  "Habari",
);
assert.equal(
  load(
    "engines/src/creator-mind-engine.js",
    "AfroTools.CreatorMindEngine",
  ).generateLocalIdeas({ topic: "video", audience: "wafanyabiashara" }, "en")
    .ideas.length,
  10,
);
assert.equal(
  load(
    "engines/src/creator-money-engine.js",
    "CreatorMoneyEngine",
  ).calculatePlan({
    currency: "KES",
    income: 500,
    expenses: 100,
    monthlyHours: 10,
    taxRate: 10,
    ownerPayRate: 50,
    reinvestmentRate: 20,
  }).operatingProfit,
  400,
);
assert.equal(
  load(
    "engines/src/creator-polish-engine.js",
    "AfroTools.CreatorPolishEngine",
  ).analyze({
    text: "Maandishi haya yana urefu wa kutosha. Maandishi haya yanahitaji mapitio ya ndani.",
  }).metrics.sentences,
  2,
);
for (const rel of [
  "assets/css/sw-creative-final-a.css",
  "assets/js/pages/creative/sw-creative-final-a.js",
  "assets/js/pages/creative/sw-afrostream-final-a.js",
  "assets/js/pages/creative/sw-creator-clip-final-a.js",
  "scripts/build-sw-creative-final-a.js",
]) {
  assert.ok(fs.statSync(path.join(ROOT, rel)).size > 500, rel);
}
console.log(
  "Swahili Creative final A static proof passed: 13/13 native owners and deterministic engine oracles.",
);
