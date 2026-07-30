const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const { normalizeBuildManagedHtml } = require("../scripts/lib/shared-asset-references");

const ROOT = path.resolve(__dirname, "..");
const engine = require("../engines/src/creator-final-wave-engine.js");

const OWNERS = {
  "creator-carousel": "createur-de-carrousel",
  "creator-club": "club-des-createurs",
  "creator-course": "cours-pour-createurs",
  "creator-page": "page-createur",
  "creator-research": "recherche-de-contenu-pour-createur",
  "creator-thumb": "miniature-pour-createur",
};

function read(relativePath) {
  return fs.readFileSync(path.join(ROOT, relativePath), "utf8");
}

function assertSurface(owner) {
  const slug = OWNERS[owner];
  const surfaces = {
    englishLauncher: read(`tools/${owner}/index.html`),
    englishApp: read(`tools/${owner}/app.html`),
    frenchLauncher: read(`fr/tools/${slug}/index.html`),
    frenchApp: read(`fr/tools/${slug}/app.html`),
  };
  assert.match(surfaces.englishLauncher, new RegExp(`https://afrotools\\.com/tools/${owner}/`));
  assert.match(surfaces.frenchLauncher, new RegExp(`https://afrotools\\.com/fr/tools/${slug}/`));
  assert.match(surfaces.englishLauncher, new RegExp(`hreflang="fr" href="https://afrotools\\.com/fr/tools/${slug}/"`));
  assert.match(surfaces.frenchLauncher, new RegExp(`hreflang="en" href="https://afrotools\\.com/tools/${owner}/"`));
  assert.match(surfaces.englishApp, /noindex, follow/);
  assert.match(surfaces.frenchApp, /noindex, follow/);
  assert.doesNotMatch(surfaces.englishApp, /<link rel="alternate" hreflang=/);
  assert.doesNotMatch(surfaces.frenchApp, /<link rel="alternate" hreflang=/);
  assert.match(surfaces.englishApp, /creator-final-wave-engine\.js/);
  assert.match(surfaces.frenchApp, /creator-final-wave-engine\.js/);
  const productApps = normalizeBuildManagedHtml(surfaces.englishApp + surfaces.frenchApp);
  assert.doesNotMatch(productApps, /\bfetch\s*\(|XMLHttpRequest|WebSocket|EventSource|sendBeacon|supabase|ai-advisor|lazy-analytics/i);
  assert.doesNotMatch(productApps, /<script\b[^>]*\bsrc=["']https?:\/\//i);
  assert.doesNotMatch(surfaces.frenchLauncher + surfaces.frenchApp, /<iframe\b/i);
  assert.match(surfaces.frenchLauncher, /lang="fr"/);
  assert.match(surfaces.frenchLauncher, new RegExp(`assets/img/tools/${owner}\\.webp`));
  assert.ok(fs.existsSync(path.join(ROOT, `assets/img/tools/${owner}.webp`)));
  assert.match(read("scripts/lib/french-tool-route-map.js"), new RegExp(`"${slug}":\\s*"${owner}"`));
}

test("creator-carousel has deterministic local slide parity", () => {
  const result = engine.calculate("creator-carousel", {
    headline: "Five useful lessons",
    audience: "Independent creators",
    points: "Start with evidence\nShow the practical step\nClose with one action",
    callToAction: "Save this",
    handle: "@afrotools",
  });
  assert.equal(result.slides.length, 5);
  assert.deepEqual(result.dimensions, { width: 1080, height: 1350 });
  assert.throws(() => engine.calculate("creator-carousel", {
    headline: "Valid headline", audience: "Creators", points: "Only one",
  }), /between two and eight/);
  assertSurface("creator-carousel");
});

test("creator-club calculates fees, net revenue and break-even members", () => {
  const result = engine.calculate("creator-club", {
    clubName: "Studio Circle", members: 100, monthlyPrice: 10,
    feePct: 5, monthlyCosts: 150,
  });
  assert.equal(result.grossMonthly, 1000);
  assert.equal(result.platformFees, 50);
  assert.equal(result.netMonthly, 800);
  assert.equal(result.breakEvenMembers, 16);
  assert.throws(() => engine.calculate("creator-club", {
    clubName: "Studio", members: 1, monthlyPrice: 1, feePct: 101, monthlyCosts: 0,
  }), /cannot exceed/);
  assertSurface("creator-club");
});

test("creator-course keeps module and revenue calculations deterministic", () => {
  const result = engine.calculate("creator-course", {
    courseTitle: "Mobile video", audience: "Creators", modules: "Plan\nRecord\nEdit",
    price: 25, students: 40, feePct: 5, costs: 250,
  });
  assert.equal(result.modules.length, 3);
  assert.equal(result.grossRevenue, 1000);
  assert.equal(result.platformFees, 50);
  assert.equal(result.netRevenue, 700);
  assertSurface("creator-course");
});

test("creator-page validates portable HTTP(S) links", () => {
  const result = engine.calculate("creator-page", {
    displayName: "Amina Studio",
    bio: "Documentary filmmaker sharing practical production notes.",
    links: "Portfolio | https://example.com\nChannel | https://youtube.com",
  });
  assert.equal(result.links.length, 2);
  assert.throws(() => engine.calculate("creator-page", {
    displayName: "Amina", bio: "A sufficiently useful local creator biography.",
    links: "Unsafe | javascript:alert(1)",
  }), /https/);
  assertSurface("creator-page");
});

test("creator-research produces a source-led verification plan without fetching", () => {
  const result = engine.calculate("creator-research", {
    topic: "Music distribution", audience: "Musicians",
    questions: "What is fixed?\nWhat changes?",
    sources: "Publisher | https://example.com\nRegulator | https://example.org",
  });
  assert.equal(result.sources.length, 2);
  assert.equal(result.verificationChecklist.length, 4);
  assert.match(result.boundary, /does not fetch/);
  assertSurface("creator-research");
});

test("creator-thumb returns exact platform output dimensions", () => {
  const result = engine.calculate("creator-thumb", {
    headline: "Build better videos", kicker: "Creator guide", format: "linkedin",
  });
  assert.equal(result.width, 1200);
  assert.equal(result.height, 627);
  assert.equal(result.platform, "LinkedIn");
  assertSurface("creator-thumb");
});
