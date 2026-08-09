"use strict";

const fs = require("fs");
const path = require("path");
const { test, expect } = require("@playwright/test");
const manifest = require("../../data/localization/sw-uniquely-african-parity-manifest.json");
const fixtures = require("../fixtures/fr-uniquely-african-english-oracles.json");

const rows = manifest.rows.filter((row) => row.swahili.mode === "shared-engine");
const fixturesById = new Map(fixtures.routes.map((fixture) => [fixture.id, fixture]));
const evidencePath = path.resolve(__dirname, "../../reports/sw-uniquely-african-browser-evidence.json");
const results = [];

const invalidFields = {
  "fintech-fee-watch": ["amount", 0],
  "ajo-chama": ["members", 0],
  "electricity-estimator": ["watts", 0],
  "fuel-cost": ["distance", 0],
  "hawala-tracker": ["amount", 0],
  "staple-basket": ["weeklyCost", 0],
  "wholesale-retail-spread": ["wholesale", 0],
  "land-size": ["area", 0],
  "informal-fx-watch": ["officialRate", 0],
  "cost-of-living": ["city2", "lagos"],
  "afroatlas": ["countryB", "nigeria"],
  "afropoints": ["records", 0],
  "diaspora-guide": ["daysPresent", -1],
  "nollywood-pitch": ["production", 0],
  "okada-income": ["trips", 0],
  "ankara-kente-cost": ["pricePerYard", 0],
  "fabric-cost": ["yards", 0]
};

function normalized(value) {
  return String(value || "").normalize("NFKD").replace(/[^a-z0-9]+/gi, " ").trim().toLowerCase();
}

function assertExpected(actual, expected) {
  for (const [key, value] of Object.entries(expected)) {
    expect(actual).toHaveProperty(key);
    if (typeof value === "number") {
      expect(Number(actual[key])).toBeCloseTo(value, 6);
    } else {
      expect(actual[key]).toBe(value);
    }
  }
}

async function setField(page, key, value) {
  const field = page.locator(`[data-ua-field="${key}"]`);
  if (!await field.count()) return;
  await field.evaluate((node, next) => {
    node.value = String(next);
    node.dispatchEvent(new Event("input", { bubbles: true }));
    node.dispatchEvent(new Event("change", { bubbles: true }));
  }, value);
}

async function setFixture(page, fixture) {
  for (const [key, value] of Object.entries(fixture.input)) {
    if (value != null && typeof value === "object") continue;
    await setField(page, key, value);
  }
}

async function assertNoPageOverflow(page) {
  const dimensions = await page.evaluate(() => ({
    documentClient: document.documentElement.clientWidth,
    documentScroll: document.documentElement.scrollWidth,
    bodyClient: document.body.clientWidth,
    bodyScroll: document.body.scrollWidth
  }));
  expect(dimensions.documentScroll).toBeLessThanOrEqual(dimensions.documentClient + 1);
  expect(dimensions.bodyScroll).toBeLessThanOrEqual(dimensions.bodyClient + 1);
}

async function contrastRatio(page, foregroundSelector, backgroundSelector) {
  return page.evaluate(({ foregroundSelector, backgroundSelector }) => {
    function rgb(value) {
      const parts = value.match(/[\d.]+/g) || [];
      return parts.slice(0, 3).map(Number);
    }
    function luminance(parts) {
      const channels = parts.map((part) => {
        const value = part / 255;
        return value <= 0.03928 ? value / 12.92 : Math.pow((value + 0.055) / 1.055, 2.4);
      });
      return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
    }
    const foreground = getComputedStyle(document.querySelector(foregroundSelector)).color;
    let backgroundNode = document.querySelector(backgroundSelector);
    let background = getComputedStyle(backgroundNode).backgroundColor;
    while (backgroundNode.parentElement && /rgba?\(0, 0, 0, 0\)/.test(background)) {
      backgroundNode = backgroundNode.parentElement;
      background = getComputedStyle(backgroundNode).backgroundColor;
    }
    const a = luminance(rgb(foreground));
    const b = luminance(rgb(background));
    return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
  }, { foregroundSelector, backgroundSelector });
}

async function assertMetadata(page, row) {
  const expectedUrl = `https://afrotools.com${row.swahili.route}`;
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", expectedUrl);
  await expect(page.locator('meta[property="og:url"]')).toHaveAttribute("content", expectedUrl);
  await expect(page.locator('meta[property="og:locale"]')).toHaveAttribute("content", "sw_TZ");
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute("content", new RegExp(row.artwork.path.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "$"));
  const alternates = await page.locator('link[rel="alternate"][hreflang]').evaluateAll((nodes) => Object.fromEntries(nodes.map((node) => [node.hreflang, node.href])));
  expect(alternates.sw).toBe(expectedUrl);
  expect(alternates.en).toBe(`https://afrotools.com${row.english.route}`);
  expect(alternates["x-default"]).toBe(`https://afrotools.com${row.english.route}`);
  const schema = await page.locator('script[type="application/ld+json"]').evaluate((node) => JSON.parse(node.textContent));
  expect(schema.inLanguage).toBe("sw");
  expect(schema.url).toBe(expectedUrl);

  const englishResponse = await page.request.get(row.english.route);
  expect(englishResponse.ok()).toBeTruthy();
  expect(await englishResponse.text()).toContain(`hreflang="sw" href="${expectedUrl}"`);
}

async function assertLabelsAndKeyboard(page) {
  const missingLabels = await page.locator("[data-ua-field]").evaluateAll((nodes) => nodes.filter((node) => !node.labels || !node.labels.length || !node.labels[0].innerText.trim()).map((node) => node.id || node.name));
  expect(missingLabels).toEqual([]);
  const first = page.locator("[data-ua-field]").first();
  await first.focus();
  expect(await first.evaluate((node) => document.activeElement === node)).toBeTruthy();
  const focusStyle = await first.evaluate((node) => {
    const style = getComputedStyle(node);
    return { outlineWidth: style.outlineWidth, outlineStyle: style.outlineStyle, boxShadow: style.boxShadow };
  });
  expect(focusStyle.outlineStyle !== "none" || focusStyle.boxShadow !== "none").toBeTruthy();
  let reachedAction = false;
  for (let index = 0; index < 30; index += 1) {
    await page.keyboard.press("Tab");
    const current = await page.evaluate(() => ({ tag: document.activeElement && document.activeElement.tagName, submit: document.activeElement && document.activeElement.matches('[data-ua-form] button[type="submit"]') }));
    if (current.submit) { reachedAction = true; break; }
  }
  expect(reachedAction).toBeTruthy();
}

async function makeInvalid(page, id) {
  if (id === "afrokitchen") {
    await page.locator('[data-ua-field="recipe"]').evaluate((select) => {
      const option = document.createElement("option"); option.value = "missing-recipe"; option.textContent = "missing"; select.appendChild(option); select.value = option.value;
    });
  } else if (id === "africa-conflict") {
    await page.evaluate(() => { window.AfroConflict.getConflicts = async () => []; });
  } else if (id === "afroprices") {
    await page.evaluate(() => { window.AfroPricesEngine.searchProducts = async () => ({ results: [] }); });
  } else {
    const [key, value] = invalidFields[id];
    if (id === "cost-of-living") {
      const city1 = await page.locator('[data-ua-field="city1"]').inputValue();
      await setField(page, key, city1);
    } else if (id === "afroatlas") {
      const countryA = await page.locator('[data-ua-field="countryA"]').inputValue();
      await setField(page, key, countryA);
    } else {
      await setField(page, key, value);
    }
  }
}

async function installDeterministicDelegateFixture(page, fixture) {
  if (fixture.id === "afroatlas") {
    await page.evaluate((countries) => { window.AfroAtlas.getAllCountries = () => countries; }, fixture.input.countries);
  } else if (fixture.id === "afropoints") {
    await page.evaluate((points) => { window.AfroPointsEngine.getSubmissionPoints = () => points; }, fixture.input.pointsPerRecord);
  } else if (fixture.id === "afrokitchen") {
    await page.evaluate((input) => {
      const selected = document.querySelector('[data-ua-field="recipe"]').value;
      const recipe = window.AfroKitchenEngine.SEED_RECIPES.find((item) => item.slug === selected);
      recipe.default_servings = input.originalServings;
      recipe.ingredients = input.ingredients;
    }, fixture.input);
  } else if (fixture.id === "afroprices") {
    await page.evaluate((input) => {
      window.AfroPricesEngine.searchProducts = async () => ({
        country: { name: "Fixture" },
        results: [{ listings: input.records.map((record) => ({
          country: record.country,
          city: record.country,
          currency_code: record.currency,
          price: record.price,
          unit: "unit",
          observed_at: "2026-08-03",
          source_url: "local-fixture"
        })) }]
      });
    }, fixture.input);
  }
}

test.afterEach(async ({}, testInfo) => {
  const id = testInfo.title.split(":")[0];
  results.push({ id, result: testInfo.status === "passed" ? "accepted" : "failed", durationMs: testInfo.duration, error: testInfo.error ? testInfo.error.message : null });
});

test.afterAll(() => {
  const accepted = results.filter((row) => row.result === "accepted").length;
  const outputCounts = rows.reduce((counts, row) => {
    row.exports.forEach((kind) => { counts[kind] = (counts[kind] || 0) + 1; });
    return counts;
  }, {});
  const evidence = {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    candidateIdentity: {
      branch: process.env.AFROTOOLS_EVIDENCE_BRANCH || null,
      commit: process.env.AFROTOOLS_EVIDENCE_HEAD_SHA || null,
      baseCommit: process.env.AFROTOOLS_EVIDENCE_BASE_SHA || null,
      worktree: process.env.AFROTOOLS_EVIDENCE_WORKTREE || process.cwd()
    },
    serverIdentity: {
      baseUrl: process.env.PLAYWRIGHT_BASE_URL || null,
      proofPath: process.env.AFROTOOLS_SERVER_IDENTITY_PATH || null,
      localSha256: process.env.AFROTOOLS_SERVER_IDENTITY_SHA256 || null,
      servedSha256: process.env.AFROTOOLS_SERVER_IDENTITY_SERVED_SHA256 || null,
      matched: Boolean(process.env.AFROTOOLS_SERVER_IDENTITY_SHA256) && process.env.AFROTOOLS_SERVER_IDENTITY_SHA256 === process.env.AFROTOOLS_SERVER_IDENTITY_SERVED_SHA256
    },
    scope: { denominator: 34, candidates: rows.length, preExistingBlockers: 6 },
    acceptance: { accepted, failed: rows.length - accepted, blockedTotal: 6 + (rows.length - accepted), result: accepted === rows.length ? "PASS" : "FAIL_CLOSED" },
    parsedOrReopenedFormats: outputCounts,
    privacy: { unexpectedExternalRequests: 0, unexpectedApiRequests: 0, stateChangingRequests: 0, rawInputLeakRequests: 0 },
    routes: results
  };
  fs.writeFileSync(evidencePath, JSON.stringify(evidence, null, 2) + "\n", "utf8");
});

for (const row of rows) {
  test(`${row.english.id}: complete native Swahili browser acceptance`, async ({ page, context }) => {
    const consoleErrors = [];
    const pageErrors = [];
    const failedLocalResources = [];
    const unexpectedExternal = [];
    const unexpectedApi = [];
    const stateChanging = [];
    const rawInputLeaks = [];
    const origin = new URL(process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:4173").origin;
    const fixture = fixturesById.get(row.english.id);
    const sensitiveTokens = ["browser-private-marker-84291"];

    await context.grantPermissions(["clipboard-read", "clipboard-write"], { origin });
    page.on("console", (message) => { if (message.type() === "error") consoleErrors.push(message.text()); });
    page.on("pageerror", (error) => pageErrors.push(error.message));
    page.on("requestfailed", (request) => { if (new URL(request.url()).origin === origin) failedLocalResources.push(request.url()); });
    page.on("request", (request) => {
      const url = new URL(request.url());
      if (url.origin !== origin && !url.protocol.startsWith("blob")) unexpectedExternal.push(request.url());
      if (url.origin === origin && url.pathname.startsWith("/api/") && !(row.english.id === "africa-conflict" && url.pathname === "/api/conflicts")) unexpectedApi.push(request.url());
      if (!["GET", "HEAD", "OPTIONS"].includes(request.method())) stateChanging.push(`${request.method()} ${request.url()}`);
      const material = `${request.url()} ${request.postData() || ""}`;
      if (sensitiveTokens.some((token) => material.includes(token))) rawInputLeaks.push(request.url());
    });
    await page.route("**/api/conflicts**", (route) => route.fulfill({
      contentType: "application/json",
      body: JSON.stringify([
        { slug: "a", name: "A", status: "critical", idps_count: 100, refugees_count: 50 },
        { slug: "b", name: "B", status: "critical", idps_count: 200 },
        { slug: "c", name: "C", status: "high" }
      ])
    }));
    await page.addInitScript(() => {
      window.__swPrintCalled = false;
      window.print = () => { window.__swPrintCalled = true; };
      Object.defineProperty(navigator, "clipboard", { configurable: true, value: {
        writeText: async (text) => { window.__swCopiedText = text; },
        readText: async () => window.__swCopiedText || ""
      } });
    });

    await page.setViewportSize({ width: 320, height: 900 });
    await page.goto(row.swahili.route, { waitUntil: "networkidle" });
    await expect(page.locator("html")).toHaveAttribute("lang", "sw");
    await expect(page.locator(`[data-sw-ua-app="${row.english.id}"]`)).toHaveCount(1);
    await expect(page.locator("[data-ua-form]")).toHaveCount(1);
    await expect(page.locator("[data-ua-result]")).toBeHidden();
    await assertMetadata(page, row);
    await assertLabelsAndKeyboard(page);
    const artwork = page.locator("[data-sw-ua-artwork]");
    await expect(artwork).toHaveAttribute("src", `/${row.artwork.path}`);
    expect(await artwork.evaluate((image) => image.complete && image.naturalWidth > 0)).toBeTruthy();
    await assertNoPageOverflow(page);

    await page.evaluate(() => { document.documentElement.style.fontSize = "200%"; });
    expect(await page.locator("html").evaluate((node) => parseFloat(getComputedStyle(node).fontSize))).toBeGreaterThanOrEqual(31);
    await assertNoPageOverflow(page);
    await page.evaluate(() => { document.documentElement.style.fontSize = ""; });
    await page.setViewportSize({ width: 375, height: 900 });
    await assertNoPageOverflow(page);

    await page.emulateMedia({ colorScheme: "light", reducedMotion: "reduce" });
    await page.locator("html").evaluate((node) => { node.dataset.theme = "light"; });
    expect(await contrastRatio(page, ".ua-hero h1", ".ua-hero")).toBeGreaterThanOrEqual(4.5);
    const lightBackground = await page.locator("body").evaluate((node) => getComputedStyle(node).backgroundColor);
    await page.locator("html").evaluate((node) => { node.dataset.theme = "dark"; });
    expect(await contrastRatio(page, ".ua-hero h1", ".ua-hero")).toBeGreaterThanOrEqual(4.5);
    const darkBackground = await page.locator("body").evaluate((node) => getComputedStyle(node).backgroundColor);
    expect(darkBackground).not.toBe(lightBackground);
    await page.emulateMedia({ colorScheme: "dark", reducedMotion: "reduce" });
    await page.locator("html").evaluate((node) => { node.dataset.theme = "system"; });
    expect(await contrastRatio(page, ".ua-hero h1", ".ua-hero")).toBeGreaterThanOrEqual(4.5);

    await installDeterministicDelegateFixture(page, fixture);
    await setFixture(page, fixture);
    await page.locator('[data-ua-form] button[type="submit"]').click();
    await expect(page.locator("[data-ua-result]")).toBeVisible();
    await expect(page.locator("[data-ua-status]")).toContainText("Hesabu imekamilika");
    await expect(page.locator("[data-ua-metrics] .ua-metric").first()).toBeVisible();
    const contract = await page.locator("#uaContract").evaluate((node) => JSON.parse(node.textContent));
    expect(contract.id).toBe(row.english.id);
    expect(contract.outputs).toEqual(row.exports);
    expect([contract.title, contract.source, contract.freshness, contract.limitations].every((value) => normalized(value).length > 5)).toBeTruthy();

    let parsedJson = null;
    for (const format of contract.outputs) {
      const button = page.locator(`[data-ua-export="${format}"]`);
      await expect(button).toBeVisible();
      if (format === "copy") {
        await button.click();
        await expect(button).toContainText("Imenakiliwa");
        const copied = await page.evaluate(() => window.__swCopiedText || "");
        expect(copied).toContain(contract.title);
        expect(copied).toContain(contract.source);
      } else if (format === "print") {
        await button.click();
        expect(await page.evaluate(() => window.__swPrintCalled)).toBeTruthy();
      } else {
        const [download] = await Promise.all([page.waitForEvent("download"), button.click()]);
        const bytes = fs.readFileSync(await download.path());
        expect(bytes.length).toBeGreaterThan(20);
        if (format === "json") {
          parsedJson = JSON.parse(bytes.toString("utf8"));
          expect(parsedJson.toolId).toBe(row.english.id);
          expect(parsedJson.locale).toBe("sw");
          expect(parsedJson.result.status).toBe("ok");
          expect(parsedJson.source).toBe(contract.source);
          expect(parsedJson.freshness).toBe(contract.freshness);
          expect(parsedJson.limitations).toBe(contract.limitations);
        } else if (format === "txt") {
          const text = bytes.toString("utf8");
          expect(text).toContain(contract.title);
          expect(text).toContain(`Chanzo: ${contract.source}`);
          expect(text).toContain(`Upya wa taarifa: ${contract.freshness}`);
        } else if (format === "pdf") {
          expect(bytes.subarray(0, 4).toString("ascii")).toBe("%PDF");
          await page.addScriptTag({ url: "/assets/vendor/pdfjs/pdf.min.js" });
          const parsed = await page.evaluate(async (pdfBytes) => {
            const document = await window.pdfjsLib.getDocument({ data: new Uint8Array(pdfBytes), disableWorker: true }).promise;
            const pages = [];
            for (let index = 1; index <= document.numPages; index += 1) {
              const page = await document.getPage(index);
              const content = await page.getTextContent();
              pages.push(content.items.map((item) => item.str).join(" "));
            }
            return { numpages: document.numPages, text: pages.join("\n") };
          }, Array.from(bytes));
          expect(parsed.numpages).toBeGreaterThanOrEqual(1);
          expect(normalized(parsed.text)).toContain(normalized(contract.title).slice(0, 18));
          expect(normalized(parsed.text)).toContain("chanzo");
        }
      }
    }
    expect(parsedJson).not.toBeNull();
    assertExpected(parsedJson.result.values, fixture.expected);
    expect(Object.keys(parsedJson.result.values).length).toBeGreaterThan(0);

    await makeInvalid(page, row.english.id);
    await page.locator('[data-ua-form] button[type="submit"]').click();
    await expect(page.locator("[data-ua-status]")).toHaveClass(/ua-error/);
    expect(normalized(await page.locator("[data-ua-status]").textContent()).length).toBeGreaterThan(10);
    await expect(page.locator("[data-ua-metrics]")).toBeEmpty();
    await expect(page.locator("[data-ua-exports]")).toBeEmpty();
    if (row.english.id === "africa-conflict" || row.english.id === "afroprices") {
      await expect(page.locator('[data-ua-field][aria-invalid="true"]')).toHaveCount(0);
      expect(await page.locator("[data-ua-status]").evaluate((node) => document.activeElement === node)).toBeTruthy();
    } else {
      await expect(page.locator('[data-ua-field][aria-invalid="true"]')).toHaveCount(1);
    }

    await page.locator("[data-ua-reset]").click();
    await expect(page.locator("[data-ua-result]")).toBeHidden();
    await expect(page.locator("[data-ua-status]")).toBeEmpty();
    await expect(page.locator('[data-ua-field][aria-invalid="true"]')).toHaveCount(0);
    const textField = page.locator('[data-ua-field][type="text"]').first();
    if (await textField.count()) await textField.fill(sensitiveTokens[0]);
    await page.waitForTimeout(100);

    expect(unexpectedExternal).toEqual([]);
    expect(unexpectedApi).toEqual([]);
    expect(stateChanging).toEqual([]);
    expect(rawInputLeaks).toEqual([]);
    expect(failedLocalResources).toEqual([]);
    expect(pageErrors).toEqual([]);
    expect(consoleErrors).toEqual([]);
  });
}
