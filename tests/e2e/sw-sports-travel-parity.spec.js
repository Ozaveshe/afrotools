const { test, expect } = require("@playwright/test");
const fs = require("fs");
const path = require("path");
const pdf = require("pdf-parse");
const pdfjs = require("pdf-parse/lib/pdf.js/v1.10.100/build/pdf.js");
const manifest = require("../../data/localization/sw-sports-travel-parity-manifest.json");
const { OWNER_CONTRACTS } = require("../../scripts/lib/swahili-travel-pages.js");

const ROOT = path.resolve(__dirname, "../..");

function englishOwnerReciprocates(row) {
  const ownerPath = path.join(ROOT, row.englishRoute.replace(/^\//, ""), "index.html");
  const html = fs.readFileSync(ownerPath, "utf8");
  return html.includes(`<link rel="alternate" hreflang="sw" href="https://afrotools.com${row.swahiliRoute}">`);
}

const SPORTS_ORACLES = {
  "betting-odds":"NGN 7,500",
  "afcon-predictor":"8.0%",
  "fantasy-football":"10 pts",
  "betting-tax":"NGN 7,125",
  "streaming-royalties":"USD 250.74",
  "nollywood-box-office":"NGN 75,870,000",
  "dj-booking-rate":"NGN 564,750",
  "concert-budget":"NGN -14,200,240",
  "gym-roi-business":"NGN 6,260,000",
  "event-ticket-revenue":"NGN 13,213,400",
  "match-tickets":"NGN 30,060",
  "sports-scholarship":"89/100",
  "athlete-earnings":"NGN 99,676,248",
  "gaming-pc-build":"1080p balanced",
  "photo-video-pricing":"NGN 1,260,896"
};

const SPORTS_VISIBLE_ORACLES = {
  ...SPORTS_ORACLES,
  "fantasy-football":"10 alama",
  "gaming-pc-build":"1080p iliyosawazika"
};

const TRAVEL_VISIBLE_ORACLES = {
  "africa-flight":"R 1,300",
  "airbnb-vs-hotel":"₦98,000",
  "airport-transfer":"₦ 3,000 – ₦ 5,000",
  "beach-holiday-budget":"$2,955",
  "festival-travel-budget":"$1,580",
  "hotel-star-guide":"₦ 50,000 – ₦ 120,000",
  "safari-cost":"$5,738",
  "travel-packing-list":"48",
  "travel-vaccination-cost":"$300"
};

const MULTIPAGE_TRAVEL_PDFS = new Set([
  "airbnb-vs-hotel",
  "beach-holiday-budget",
  "festival-travel-budget",
  "hotel-star-guide",
  "safari-cost",
  "travel-packing-list"
]);

const DARK_CONTRAST_SELECTORS = {
  "africa-flight": [".card label", ".airline-card .airline-name", ".price-tips", ".rd-box .rd-val", "select"],
  "airport-transfer": [".en-card-title", ".en-results-table td", ".en-tip-text", ".en-select"],
  "beach-holiday-budget": [".en-card-title", ".en-results-table td", ".en-tip-text", ".en-select"],
  "festival-travel-budget": [".en-card-title", ".en-results-table td", ".en-tip-text", ".en-select"],
  "hotel-star-guide": [".en-card-title", ".en-results-table td", "#tipsArea", ".en-select"],
  "safari-cost": [".en-card-title", ".en-results-table td", ".en-tip-text", ".en-select"],
  "travel-packing-list": [".en-card-title", ".pack-item", ".pack-category h3", ".en-select"]
};

const SPORTS_INVALID = {
  "betting-odds": [["oddsValue", "1"]],
  "afcon-predictor": [["formBoost", "11"]],
  "fantasy-football": [["fixtureDifficulty", "6"]],
  "betting-tax": [["grossPayout", "0"]],
  "streaming-royalties": [
    ["spotifyStreams", "0"], ["appleStreams", "0"], ["boomplayStreams", "0"],
    ["audiomackStreams", "0"], ["youtubeStreams", "0"], ["deezerStreams", "0"], ["tidalStreams", "0"]
  ],
  "nollywood-box-office": [["admissions", "0"]],
  "dj-booking-rate": [["hours", "0"]],
  "concert-budget": [["capacity", "0"]],
  "gym-roi-business": [["members", "0"]],
  "event-ticket-revenue": [
    ["vipTickets", "0"], ["regularTickets", "0"], ["studentTickets", "0"], ["earlyBirdTickets", "0"]
  ],
  "match-tickets": [["quantity", "0"]],
  "sports-scholarship": [["gpa", "5"]],
  "athlete-earnings": [["yearsRemaining", "0"]],
  "gaming-pc-build": [["budget", "0"]],
  "photo-video-pricing": [["shootDays", "0"], ["editDays", "0"]]
};

const ENGLISH_RESIDUE = /\b(the|and|for|with|from|your|per|days?|nights?|total|estimate|range|best time|book|class|after|included|none|group|people|share|needed|similar|wins|revenue|cost|profit|market|fee|gross|net|monthly|annual|ticket price|planning|recommended|current|average|base|expected|actual|salary|budget|travel|accommodation|activities|shared|normal season|approx|package|choice|documents|money|clothing|medical|safety|security|checked|strong fit|readiness)\b/i;

async function assertNoOverflow(page, label) {
  const dimensions = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth
  }));
  expect(dimensions.scrollWidth, `${label} horizontal overflow`).toBeLessThanOrEqual(dimensions.clientWidth + 1);
}

async function pageConfig(page) {
  return page.evaluate(() => JSON.parse(document.getElementById("sw-tool-config").textContent));
}

async function inspectPdfLayout(buffer) {
  const documentPdf = await pdfjs.getDocument({ data: new Uint8Array(buffer) }).promise;
  const pages = [];
  for (let index = 1; index <= documentPdf.numPages; index += 1) {
    const page = await documentPdf.getPage(index);
    const viewport = page.getViewport(1);
    const content = await page.getTextContent();
    pages.push({
      width: viewport.width,
      height: viewport.height,
      items: content.items.filter((item) => String(item.str || "").trim()).map((item) => ({
        text: item.str,
        x: item.transform[4],
        y: item.transform[5],
        width: item.width
      }))
    });
  }
  return pages;
}

async function assertDarkContrast(page, toolId) {
  const selectors = DARK_CONTRAST_SELECTORS[toolId];
  if (!selectors) return;
  const samples = await page.evaluate((requested) => {
    function rgba(value) {
      const match = String(value).match(/rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([\d.]+))?\)/);
      return match ? [Number(match[1]), Number(match[2]), Number(match[3]), match[4] == null ? 1 : Number(match[4])] : null;
    }
    function background(node) {
      for (let current = node; current; current = current.parentElement) {
        const parsed = rgba(getComputedStyle(current).backgroundColor);
        if (parsed && parsed[3] > 0) return parsed;
      }
      return [17, 23, 19, 1];
    }
    function blend(foreground, backdrop) {
      return foreground.slice(0, 3).map((channel, index) =>
        channel * foreground[3] + backdrop[index] * (1 - foreground[3])
      );
    }
    function luminance(rgb) {
      const channels = rgb.map((channel) => {
        const value = channel / 255;
        return value <= 0.03928 ? value / 12.92 : Math.pow((value + 0.055) / 1.055, 2.4);
      });
      return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
    }
    return requested.map((selector) => {
      const node = Array.from(document.querySelectorAll(selector)).find((candidate) => {
        const rect = candidate.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0;
      });
      if (!node) return { selector, missing: true };
      const backdrop = background(node);
      const foreground = rgba(getComputedStyle(node).color) || [255, 255, 255, 1];
      const backgroundLuminance = luminance(backdrop);
      const foregroundLuminance = luminance(blend(foreground, backdrop));
      return {
        selector,
        backgroundLuminance,
        contrast: (Math.max(backgroundLuminance, foregroundLuminance) + 0.05) /
          (Math.min(backgroundLuminance, foregroundLuminance) + 0.05)
      };
    });
  }, selectors);
  for (const sample of samples) {
    expect(sample.missing, `${toolId} missing contrast target ${sample.selector}`).not.toBe(true);
    expect(sample.backgroundLuminance, `${toolId} retained a light surface at ${sample.selector}`).toBeLessThan(0.35);
    expect(sample.contrast, `${toolId} contrast at ${sample.selector}`).toBeGreaterThanOrEqual(4.5);
  }
}

async function invokeTravelOwner(page, action) {
  await page.evaluate((ownerAction) => {
    if (typeof window[ownerAction] !== "function") throw new Error(`Missing owner action ${ownerAction}`);
    window[ownerAction]();
  }, action);
}

for (const row of manifest.rows) {
  test(`${row.toolId}: route-specific invalid/valid oracle, parsed export, reflow and a11y`, async ({ page }) => {
    const consoleErrors = [];
    const failedResources = [];
    const externalRequests = [];
    page.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(message.text());
    });
    page.on("requestfailed", (request) => failedResources.push(`${request.url()} ${request.failure() && request.failure().errorText}`));
    page.on("request", (request) => {
      const url = new URL(request.url());
      if (!["127.0.0.1", "localhost"].includes(url.hostname) && !["data:", "blob:"].includes(url.protocol)) {
        externalRequests.push(request.url());
      }
    });
    await page.addInitScript(() => {
      window.__swPrintCalls = 0;
      window.__swCopiedText = "";
      window.print = () => { window.__swPrintCalls += 1; };
      Object.defineProperty(navigator, "clipboard", {
        configurable: true,
        value: { writeText: async (text) => { window.__swCopiedText = text; } }
      });
    });

    await page.setViewportSize({ width: 375, height: 820 });
    await page.goto(row.swahiliRoute, { waitUntil:"domcontentloaded" });
    await expect(page.locator("html")).toHaveAttribute("lang", "sw");
    await expect(page.locator("h1")).toBeVisible();
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", `https://afrotools.com${row.swahiliRoute}`);
    const englishAlternate = page.locator('link[rel="alternate"][hreflang="en"]');
    if (englishOwnerReciprocates(row)) {
      await expect(englishAlternate).toHaveAttribute("href", `https://afrotools.com${row.englishRoute}`);
    } else {
      await expect(englishAlternate).toHaveCount(0);
    }
    await expect(page.locator('link[rel="alternate"][hreflang="sw"]')).toHaveAttribute("href", `https://afrotools.com${row.swahiliRoute}`);
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute("content", `https://afrotools.com${row.artwork}`);
    const schemaText = await page.locator('script[type="application/ld+json"]').first().textContent();
    expect(schemaText).toContain('"inLanguage":"sw"');
    expect(schemaText).not.toMatch(/\b(Home|Frequently Asked Questions|How do I|Results are|English)\b/);
    if (row.category === "travel-tourism") {
      const initialText = await page.locator("[data-sw-owner-workflow]").innerText();
      const initialResidueCandidate = initialText
        .replace(/THE GEORGE HOTELI?, ORIENTAL HOTELI?/gi, "")
        .replace(/IATA Travel Centre/gi, "");
      expect(initialResidueCandidate).not.toMatch(ENGLISH_RESIDUE);
    }

    if (row.category === "sports") {
      const form = page.locator(".sw-sports-form");
      const invalidCase = SPORTS_INVALID[row.toolId];
      expect(invalidCase, `${row.toolId} needs a route-specific invalid oracle`).toBeTruthy();
      for (const [field, value] of invalidCase) await form.locator(`[name="${field}"]`).fill(value);
      const invalidField = form.locator(`[name="${invalidCase[0][0]}"]`);
      await form.locator('button[type="submit"]').focus();
      await expect(form.locator('button[type="submit"]')).toBeFocused();
      expect(await form.locator('button[type="submit"]').evaluate((node) => getComputedStyle(node).outlineStyle)).not.toBe("none");
      await page.keyboard.press("Enter");
      await expect(form.locator('[role="alert"]')).not.toHaveText("");
      await expect(invalidField).toHaveAttribute("aria-invalid", "true");
    } else {
      const config = await pageConfig(page);
      const invalid = config.owner.invalid;
      const invalidId = (invalid.numbers && invalid.numbers[0]) || invalid.select;
      await page.locator(`#${invalidId}`).evaluate((node) => {
        node.value = node.tagName === "SELECT" ? "" : "0";
      });
      const primaryAction = page.locator(`[data-sw-owner-workflow] button[onclick*="${config.owner.action}"]`).first();
      await primaryAction.focus();
      await expect(primaryAction).toBeFocused();
      expect(await primaryAction.evaluate((node) => getComputedStyle(node).outlineStyle)).not.toBe("none");
      await page.keyboard.press("Enter");
      await expect(page.locator("[data-sw-owner-error]")).not.toHaveText("");
      await expect(page.locator(`#${invalidId}`)).toHaveAttribute("aria-invalid", "true");
    }

    await page.reload({ waitUntil:"domcontentloaded" });
    const config = await pageConfig(page);
    if (row.category === "sports") {
      await page.locator(".sw-sports-form button[type=submit]").click();
      await expect(page.locator("[data-sw-sport-result]")).toContainText(SPORTS_VISIBLE_ORACLES[row.toolId]);
      await expect(page.locator("[data-sw-sport-result] .sw-insights li")).toHaveCount(4);
      await expect(page.locator("[data-sw-sport-result] .sw-result-source")).toContainText(config.sourceReview.reviewedAt);
      await expect(page.locator("[data-sw-sport-result] .sw-result-source")).toContainText("live=false");
      await expect(page.locator("[data-sw-sport-result] .sw-result-source")).toContainText(config.sourceReview.asOf);
      await expect(page.locator("[data-sw-sport-result] .sw-result-source li")).toHaveCount(
        config.sourceReview.assumptions.length + config.sourceReview.sources.length
      );
      await expect(page.locator(".sw-boundary")).not.toHaveText("");
      const resultText = await page.locator("[data-sw-sport-result]").innerText();
      expect(resultText).not.toMatch(/\b(?:NaN|undefined|Infinity)\b/i);
      expect(resultText.replace(/https?:\/\/\S+/g, "")).not.toMatch(ENGLISH_RESIDUE);
      const firstNumber = page.locator('.sw-sports-form input[type="number"]').first();
      const original = await firstNumber.inputValue();
      await firstNumber.fill(String(Number(original || 0) + 1));
      await expect(page.locator("[data-sw-sport-result]")).toBeEmpty();
      await page.locator("[data-sw-sport-reset]").click();
      await page.locator(".sw-sports-form button[type=submit]").click();
    } else {
      await invokeTravelOwner(page, config.owner.action);
      const result = page.locator(`#${config.owner.resultId}`);
      await expect(result).toBeVisible();
      await expect(result).toContainText(TRAVEL_VISIBLE_ORACLES[row.toolId]);
      const resultText = await result.innerText();
      expect(resultText).not.toMatch(/\b(?:NaN|undefined|null|Infinity)\b/i);
      const residueCandidate = resultText
        .replace(/THE GEORGE HOTELI?, ORIENTAL HOTELI?/gi, "")
        .replace(/IATA Travel Centre/gi, "");
      expect(residueCandidate).not.toMatch(ENGLISH_RESIDUE);
      if (row.toolId === "travel-vaccination-cost") {
        expect(resultText).toContain("Homa ya manjano");
        expect(resultText).toContain("Wiki 6");
        expect(resultText).toContain("Hayapendekezi chanjo");
      } else {
        expect(resultText).toContain(OWNER_CONTRACTS[row.toolId].planningNote);
      }
      expect(config.owner.source.live).toBe(false);
      expect(config.owner.source.reviewedAt).toBe("2026-07-31");
      await expect(page.locator(".sw-source")).toContainText(config.owner.source.asOf);
      const firstNumber = page.locator('[data-sw-owner-workflow] input[type="number"]').first();
      if (await firstNumber.count()) {
        const original = await firstNumber.inputValue();
        await firstNumber.fill(String(Number(original || 0) + 1));
        await firstNumber.blur();
      } else {
        const firstSelect = page.locator("[data-sw-owner-workflow] select").first();
        const options = await firstSelect.locator("option").evaluateAll((nodes) => nodes.map((node) => node.value));
        const current = await firstSelect.inputValue();
        const next = options.find((value) => value && value !== current);
        expect(next, `${row.toolId} needs a stale-state boundary value`).toBeTruthy();
        await firstSelect.selectOption(next);
      }
      await expect(result).toBeHidden();
      await invokeTravelOwner(page, config.owner.action);
      await expect(result).toBeVisible();
    }

    const jsonDownload = page.waitForEvent("download");
    await page.locator("[data-sw-json]").click();
    const json = await jsonDownload;
    const jsonPath = await json.path();
    const payload = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
    expect(payload.toolId).toBe(row.toolId);
    if (row.category === "sports") {
      expect(payload.schemaVersion).toBe(1);
      expect(payload.locale).toBe("sw");
      expect(payload.privacy).toBe("local-export");
      expect(payload.result.heroValue).toBe(SPORTS_VISIBLE_ORACLES[row.toolId]);
      expect(payload.sourceReview.reviewedAt).toBe(config.sourceReview.reviewedAt);
      expect(payload.result.insights).toHaveLength(4);
      expect(JSON.stringify(payload.result)).not.toMatch(ENGLISH_RESIDUE);
    } else {
      expect(payload.schema).toBe("afrotools.sw.travel-owner.v2");
      expect(payload.ownerHash).toBe(config.owner.ownerHash);
      expect(payload.localOnly).toBe(true);
      expect(payload.resultText).not.toMatch(/\b(?:NaN|undefined|null|Infinity)\b/i);
      expect(payload.source.live).toBe(false);
      expect(payload.source.reviewedAt).toBe("2026-07-31");
    }

    const importButton = page.getByRole("button", { name: "Fungua JSON" });
    await expect(page.locator("[data-sw-json]")).toBeFocused();
    await page.keyboard.press("Tab");
    if (row.category === "travel-tourism") await page.keyboard.press("Tab");
    await expect(importButton).toBeFocused();
    expect(await importButton.evaluate((node) => getComputedStyle(node).outlineStyle)).not.toBe("none");
    const fileChooserEvent = page.waitForEvent("filechooser");
    await page.keyboard.press("Enter");
    const fileChooser = await fileChooserEvent;
    await fileChooser.setFiles(jsonPath);
    await expect(page.locator(row.category === "sports" ? "[data-sw-status]" : "[data-sw-export-status]")).toContainText("imefunguliwa");

    await page.locator("[data-sw-copy]").click();
    await expect.poll(() => page.evaluate(() => window.__swCopiedText.length)).toBeGreaterThan(40);

    if (row.category === "travel-tourism") {
      const pdfDownload = page.waitForEvent("download");
      await page.locator("[data-sw-pdf]").click();
      const pdfFile = await pdfDownload;
      const pdfBuffer = fs.readFileSync(await pdfFile.path());
      const parsed = await pdf(pdfBuffer);
      const pages = await inspectPdfLayout(pdfBuffer);
      expect(parsed.numpages).toBeGreaterThanOrEqual(1);
      expect(parsed.text.trim().length).toBeGreaterThan(40);
      expect(pages).toHaveLength(parsed.numpages);
      if (MULTIPAGE_TRAVEL_PDFS.has(row.toolId)) expect(pages.length).toBeGreaterThan(1);
      for (const [pageIndex, pdfPage] of pages.entries()) {
        expect(pdfPage.items.length, `${row.toolId} PDF page ${pageIndex + 1} is empty`).toBeGreaterThan(0);
        for (const item of pdfPage.items) {
          expect(item.x, `${row.toolId} PDF text starts left of page`).toBeGreaterThanOrEqual(0);
          expect(item.y, `${row.toolId} PDF text falls below page`).toBeGreaterThanOrEqual(0);
          expect(item.y, `${row.toolId} PDF text exceeds page height`).toBeLessThanOrEqual(pdfPage.height);
          expect(item.x + item.width, `${row.toolId} PDF text exceeds page width`).toBeLessThanOrEqual(pdfPage.width + 1);
        }
      }
      expect(pages.at(-1).items.map((item) => item.text).join(" ")).toContain("Faragha");
    } else {
      const printAction = page.locator("[data-sw-print]");
      await expect(printAction).toHaveText("Chapisha kupitia kivinjari");
      await expect(printAction).not.toContainText("PDF");
      await printAction.click();
      expect(await page.evaluate(() => window.__swPrintCalls)).toBe(1);
    }

    await expect(page.locator("[data-ai-prompt]")).toBeDisabled();
    await page.locator("[data-ai-consent]").check();
    await expect(page.locator("[data-ai-prompt]")).toBeEnabled();
    await page.locator("[data-ai-prompt]").click();
    await expect(page.locator("[data-ai-output]")).toContainText("halijatumwa");

    const originalTheme = await page.locator("html").getAttribute("data-theme");
    await page.locator("[data-theme-toggle]").click();
    await expect(page.locator("html")).not.toHaveAttribute("data-theme", originalTheme);
    if (row.category === "travel-tourism") {
      await assertDarkContrast(page, row.toolId);
      await page.locator("[data-sw-owner-reset]").click();
      await expect(page.locator("[data-sw-owner-workflow] input, [data-sw-owner-workflow] select, [data-sw-owner-workflow] textarea, [data-sw-owner-workflow] button").first()).toBeFocused();
      await expect(page.locator(`#${config.owner.resultId}`)).toBeHidden();
    }

    await assertNoOverflow(page, `${row.toolId} 375px`);
    await page.setViewportSize({ width:320, height:780 });
    await assertNoOverflow(page, `${row.toolId} 320px`);
    await page.setViewportSize({ width:640, height:780 });
    await page.evaluate(() => { document.documentElement.style.fontSize = "200%"; });
    await assertNoOverflow(page, `${row.toolId} 200% text reflow`);

    const unlabeled = await page.locator("input:not([type=hidden]), select, textarea").evaluateAll((nodes) => nodes.filter((node) => {
      if (node.type === "file") return false;
      return !node.labels?.length && !node.getAttribute("aria-label") && !node.getAttribute("aria-labelledby");
    }).map((node) => node.name || node.id || node.type));
    expect(unlabeled).toEqual([]);
    expect(consoleErrors).toEqual([]);
    expect(failedResources).toEqual([]);
    expect(externalRequests).toEqual([]);
  });
}

for (const hub of [
  { route:"/sw/michezo/", count:15, label:"Michezo" },
  { route:"/sw/usafiri-utalii/", count:9, label:"Usafiri" }
]) {
  test(`${hub.label} hub: exact cards, responsive reflow, theme, keyboard and console`, async ({ page }) => {
    const consoleErrors = [];
    const failedResources = [];
    const externalRequests = [];
    page.on("console", (message) => { if (message.type() === "error") consoleErrors.push(message.text()); });
    page.on("requestfailed", (request) => failedResources.push(request.url()));
    page.on("request", (request) => {
      const url = new URL(request.url());
      if (!["127.0.0.1", "localhost"].includes(url.hostname) && !["data:", "blob:"].includes(url.protocol)) {
        externalRequests.push(request.url());
      }
    });
    await page.setViewportSize({ width:375, height:820 });
    await page.goto(hub.route, { waitUntil:"domcontentloaded" });
    await expect(page.locator("html")).toHaveAttribute("lang", "sw");
    await expect(page.locator(".sw-hub-card")).toHaveCount(hub.count);
    await expect(page.locator(".sw-hub-card img")).toHaveCount(hub.count);
    const firstLink = page.locator(".sw-hub-card:is(a), .sw-hub-card a").first();
    await firstLink.focus();
    await expect(firstLink).toBeFocused();
    expect(await firstLink.evaluate((node) => getComputedStyle(node).outlineStyle)).not.toBe("none");
    const originalTheme = await page.locator("html").getAttribute("data-theme");
    await page.locator("[data-theme-toggle]").click();
    await expect(page.locator("html")).not.toHaveAttribute("data-theme", originalTheme);
    await assertNoOverflow(page, `${hub.label} hub 375px`);
    await page.setViewportSize({ width:320, height:780 });
    await assertNoOverflow(page, `${hub.label} hub 320px`);
    await page.setViewportSize({ width:640, height:780 });
    await page.evaluate(() => { document.documentElement.style.fontSize = "200%"; });
    await assertNoOverflow(page, `${hub.label} hub 200% text reflow`);
    expect(consoleErrors).toEqual([]);
    expect(failedResources).toEqual([]);
    expect(externalRequests).toEqual([]);
  });
}
