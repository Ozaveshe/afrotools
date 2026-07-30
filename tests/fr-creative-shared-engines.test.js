const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const ROOT = path.resolve(__dirname, "..");

function loadBrowserEngine(relativePath, namespace) {
  const window = {};
  const context = vm.createContext({ window, globalThis: window });
  vm.runInContext(
    fs.readFileSync(path.join(ROOT, relativePath), "utf8"),
    context,
    { filename: relativePath }
  );
  return window.AfroTools[namespace];
}

test("Art Commission shared engine preserves the frozen English default oracle", () => {
  const engine = loadBrowserEngine(
    "engines/src/art-commission-engine.js",
    "ArtCommissionEngine"
  );
  const result = engine.calculate({
    country: "NG",
    artType: "digital_portrait",
    size: "A3",
    complexity: "detailed",
    rights: "personal",
    revisions: "2",
    timeline: "standard",
    hours: "8",
  });

  assert.equal(result.base, 29000);
  assert.equal(result.price, 29000);
  assert.equal(result.minPrice, 15000);
  assert.equal(result.maxPrice, 50000);
  assert.equal(result.hourlyRate, 3625);
  assert.equal(result.symbol, "₦");
});

test("Art Commission shared engine preserves commercial, revision, and rush multipliers", () => {
  const engine = loadBrowserEngine(
    "engines/src/art-commission-engine.js",
    "ArtCommissionEngine"
  );
  const result = engine.calculate({
    country: "KE",
    artType: "oil_landscape",
    size: "A2",
    complexity: "very_detailed",
    rights: "commercial",
    revisions: "unlimited",
    timeline: "rush",
    hours: "12",
  });

  const base = 3000 + (35000 - 3000) * 0.4;
  assert.equal(result.base, base);
  assert.equal(result.price, base * 1.4 * 1.5 * 1.5 * 1.2 * 1.3);
  assert.equal(result.minPrice, 3000 * 1.4 * 1.5);
  assert.equal(result.maxPrice, 35000 * 1.4 * 1.5);
  assert.equal(result.hourlyRate, result.price / 12);
});

test("Art Commission shared engine preserves the original hours fallback", () => {
  const engine = loadBrowserEngine(
    "engines/src/art-commission-engine.js",
    "ArtCommissionEngine"
  );
  const result = engine.calculate({
    country: "GH",
    artType: "logo",
    size: "A4",
    complexity: "simple",
    rights: "personal",
    revisions: "1",
    timeline: "standard",
    hours: "",
  });

  assert.equal(result.hours, 8);
  assert.equal(result.hourlyRate, result.price / 8);
});

test("Book Publishing Cost shared engine preserves the frozen English default oracle", () => {
  const engine = loadBrowserEngine(
    "engines/src/book-publishing-cost-engine.js",
    "BookPublishingCostEngine"
  );
  const result = engine.calculate({
    country: "NG",
    retailPrice: "12",
    monthlySales: "50",
    devEdit: "300",
    copyEdit: "200",
    proofread: "100",
    coverDesign: "250",
    layout: "150",
    isbn: "0",
    printQty: "100",
    printCost: "2",
  });

  assert.equal(result.editingTotal, 600);
  assert.equal(result.setupTotal, 1000);
  assert.equal(result.printTotal, 200);
  assert.equal(result.totalUSD, 1200);
  assert.equal(result.totalLocal, 1992000);
  assert.equal(result.breakEven, 286);
  assert.equal(result.platforms.length, 5);
  assert.deepEqual(
    Array.from(result.projections, (item) => item.copies),
    [600, 780, 960]
  );
});

test("Book Publishing Cost shared engine preserves the original zero-value fallbacks", () => {
  const engine = loadBrowserEngine(
    "engines/src/book-publishing-cost-engine.js",
    "BookPublishingCostEngine"
  );
  const result = engine.calculate({
    country: "KE",
    retailPrice: "",
    monthlySales: "",
    devEdit: "",
    copyEdit: "",
    proofread: "",
    coverDesign: "",
    layout: "",
    isbn: "",
    printQty: "",
    printCost: "",
  });

  assert.equal(result.retailUSD, 12);
  assert.equal(result.monthlySales, 50);
  assert.equal(result.totalUSD, 0);
  assert.equal(result.breakEven, 0);
});

test("Photography Pricing shared engine preserves the frozen English default oracle", () => {
  const engine = loadBrowserEngine(
    "engines/src/photography-pricing-engine.js",
    "PhotographyPricingEngine"
  );
  const result = engine.calculate({
    country: "NG",
    speciality: "portrait",
    experience: "mid",
    equipment: "mid",
    shootHours: "4",
    editHours: "3",
    studioRent: "0",
    workDays: "20",
    equipmentValue: "500000",
    prints: "no",
  });
  assert.equal(result.sessionPrice, 100000);
  assert.equal(result.dayRate, 200000);
  assert.equal(result.monthly, 400000);
  assert.equal(result.annual, 4800000);
});

test("Podcast Monetization shared engine preserves the frozen English default oracle", () => {
  const engine = loadBrowserEngine(
    "engines/src/podcast-monetization-engine.js",
    "PodcastMonetizationEngine"
  );
  const result = engine.calculate({
    country: "NG",
    audience: "mixed",
    niche: "entertainment",
    downloads: "5000",
    episodes: "4",
    patrons: "0",
    patronFee: "5",
  });
  assert.equal(result.downloadsPerEpisode, 1250);
  assert.equal(result.adTotal, 110);
  assert.equal(result.sponsorship, 187.5);
  assert.equal(result.total, 372.5);
});

test("Self-Publishing Royalty shared engine preserves the frozen English default oracle", () => {
  const engine = loadBrowserEngine(
    "engines/src/self-publishing-royalty-engine.js",
    "SelfPublishingRoyaltyEngine"
  );
  const result = engine.calculate({
    country: "NG",
    format: "ebook",
    price: "9.99",
    pages: "250",
    monthly: "80",
  });
  assert.ok(Math.abs(result.best.perCopy - 6.993) < 1e-9);
  assert.ok(Math.abs(result.best.perCopy * result.monthly - 559.44) < 1e-9);
});

test("Engagement Rate shared engine preserves the frozen English 3.6 percent oracle", () => {
  const engine = loadBrowserEngine(
    "engines/src/engagement-rate-engine.js",
    "EngagementRateEngine"
  );
  const result = engine.calculate({
    platform: "instagram",
    followers: "25000",
    likes: "700",
    comments: "100",
    shares: "50",
    saves: "50",
  });
  assert.equal(result.interactions, 900);
  assert.ok(Math.abs(result.rate - 3.6) < 1e-9);
  assert.equal(result.grade, "B");
});

test("Personal Brand Audit shared engine preserves the frozen English low-input oracle", () => {
  const engine = loadBrowserEngine(
    "engines/src/personal-brand-audit-engine.js",
    "PersonalBrandAuditEngine"
  );
  const result = engine.calculate({
    liConnections: "1",
    liPosting: "1",
    twFollowers: "0",
    igFollowers: "0",
    website: "0",
    googleResult: "0",
    articles: "0",
    book: "0",
    podcast: "0",
    speaking: "0",
    awards: "0",
    education: "0",
    certs: "0",
    yearsExp: "0",
    industry: "other",
  });
  assert.equal(result.total, 2);
  assert.equal(result.grade, "F");
});

test("Social Media Calendar shared engine preserves deterministic January schedule", () => {
  const engine = loadBrowserEngine(
    "engines/src/social-media-calendar-engine.js",
    "SocialMediaCalendarEngine"
  );
  const result = engine.generate({
    niche: "fashion",
    platform: "instagram",
    frequency: "3x",
    timezone: "WAT",
    month: "0",
    year: "2026",
  });
  assert.equal(result.monthName, "January");
  assert.equal(result.daysInMonth, 31);
  assert.equal(result.totalPosts, 13);
  assert.equal(result.posts.length, 13);
});

test("Wedding Photo Package shared engine preserves the frozen English default oracle", () => {
  const engine = loadBrowserEngine(
    "engines/src/wedding-photo-package-engine.js",
    "WeddingPhotoPackageEngine"
  );
  const result = engine.calculate({
    country: "NG",
    hours: "8",
    experience: "mid",
    addons: [],
  });
  assert.equal(result.total, 200000);
  assert.equal(result.deposit, 100000);
  assert.equal(result.items.length, 1);
  assert.equal(result.comparisons.length, 4);
});

test("Music Royalty Splitter shared engine preserves the frozen English split oracle", () => {
  const engine = loadBrowserEngine(
    "engines/src/music-royalty-splitter-engine.js",
    "MusicRoyaltySplitterEngine"
  );
  const result = engine.calculate({
    title: "Synthetic fixture",
    country: "NG",
    totalRoyalties: "10000",
    period: "1",
    collaborators: [
      { name: "Writer", role: "Songwriter", pct: "40" },
      { name: "Producer", role: "Producer", pct: "30" },
      { name: "Artist", role: "Lead Artist", pct: "30" },
    ],
  });
  assert.equal(result.ok, true);
  assert.equal(result.splitTotal, 100);
  assert.equal(result.totalLocal, 16600000);
  assert.equal(result.shares[0].shareUSD, 4000);
  assert.equal(result.shares[0].quarterly, 12000);
  assert.equal(result.shares[0].annual, 48000);
});

test("Music Royalty Splitter shared engine fails closed for incomplete splits", () => {
  const engine = loadBrowserEngine(
    "engines/src/music-royalty-splitter-engine.js",
    "MusicRoyaltySplitterEngine"
  );
  const result = engine.calculate({
    country: "NG",
    totalRoyalties: "10000",
    period: "1",
    collaborators: [{ name: "Writer", role: "Songwriter", pct: "40" }],
  });
  assert.equal(result.ok, false);
  assert.equal(result.error, "invalid_split");
  assert.equal(result.splitTotal, 40);
});

test("African Palette shared engine preserves palette and contrast oracles", () => {
  const engine = loadBrowserEngine(
    "engines/src/african-palette-engine.js",
    "AfricanPaletteEngine"
  );
  const kente = engine.getPalette("kente");
  assert.equal(kente.name, "Kente");
  assert.equal(kente.colors.length, 5);
  assert.equal(kente.colors[0].hex, "#FFC107");
  assert.deepEqual(
    Object.assign({}, engine.hexToRgb("#FFC107")),
    { r: 255, g: 193, b: 7 }
  );
  assert.ok(engine.contrastRatio("#0A0A0A", "#F8F5F0") > 15);
  assert.equal(engine.isDark("#0A0A0A"), true);
  assert.equal(engine.getPalette("missing"), null);
});
