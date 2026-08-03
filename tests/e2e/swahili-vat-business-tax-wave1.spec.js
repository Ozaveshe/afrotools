const { test, expect } = require("@playwright/test");
const fs = require("node:fs");
const path = require("node:path");
const { execFileSync } = require("node:child_process");
const { assertProcessIdentity, assertResponseIdentity, sha256 } = require("../support/swahili-vat-proof-identity");

const manifestPath = path.resolve(__dirname, "../fixtures/swahili-vat-business-tax-wave1.json");
const manifest = require(manifestPath);
const ROOT = path.resolve(__dirname, "..", "..");
const expectedFixtureSha256 = "880d943305f3c8288036327ee26856d6d2d9d9ab505f80e9006ab06c7ffd87d3";
const expectedRootIdentity = "sw-vat-business-tax-clean-respin-8354e321-20260802";
const pdfParserPath = path.resolve(__dirname, "../support/parse-pdf-file.py");
test.setTimeout(120_000);

async function proofGoto(page, route) {
  const response = await page.goto(route, { waitUntil: "domcontentloaded" });
  assertResponseIdentity(response);
}

function parsePdfFile(file) {
  return JSON.parse(execFileSync(process.env.AFROTOOLS_PYTHON || "python", [pdfParserPath, file], {
    encoding: "utf8",
    maxBuffer: 10 * 1024 * 1024
  })).text;
}

function numberPattern(value) {
  const digits = String(value).replace(/\D/g, "");
  if (!digits || Number(value) === 0) return /(?:^|\D)0(?:\D|$)/;
  return new RegExp(digits.split("").join("[\\s,.\\u00a0\\u202f]*"));
}

function runtimeRecorder(page) {
  const failures = [];
  page.on("pageerror", (error) => failures.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") failures.push(message.text());
  });
  return failures;
}

function requestRecorder(page) {
  const requests = [];
  page.on("request", (request) => {
    requests.push({
      method: request.method(),
      url: request.url(),
      resourceType: request.resourceType()
    });
  });
  return requests;
}

async function schemaLanguages(page) {
  return page.locator('script[type="application/ld+json"]').evaluateAll((scripts) => {
    const values = [];
    const visit = (value) => {
      if (!value || typeof value !== "object") return;
      if (Array.isArray(value)) {
        value.forEach(visit);
        return;
      }
      if (value.inLanguage) values.push(value.inLanguage);
      if (value["@graph"]) visit(value["@graph"]);
    };
    scripts.forEach((script) => {
      try { visit(JSON.parse(script.textContent)); } catch (_) {}
    });
    return values;
  });
}

async function assertSeo(page, fixture, locale) {
  const route = locale === "sw" ? fixture.swahiliRoute : fixture.englishRoute;
  const canonical = await page.locator('link[rel="canonical"]').getAttribute("href");
  const ogUrl = await page.locator('meta[property="og:url"]').getAttribute("content");
  expect(new URL(canonical).pathname.replace(/\/$/, "")).toBe(route.replace(/\/$/, ""));
  expect(new URL(ogUrl).pathname.replace(/\/$/, "")).toBe(route.replace(/\/$/, ""));
  const languages = await schemaLanguages(page);
  expect(languages.length, `${fixture.id} must declare schema inLanguage`).toBeGreaterThan(0);
  expect(languages.every((value) => String(value).toLowerCase().startsWith(locale))).toBe(true);
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute("content", /^https:\/\/afrotools\.com\/assets\//);
}

async function assertSwahiliShell(page, label) {
  const visibleText = await page.locator("main").innerText();
  expect(
    visibleText,
    `${label} visible English shell residue`
  ).not.toMatch(/Download local PDF|Download CSV|Download JSON|Share safe link|Sources? & verification|Report (?:a )?calculation error|Planning estimate only|Amount before (?:VAT|GST)|Calculate daily profit|Saved only in this browser/i);
}

async function assertNoOverflow(page, label) {
  const report = await page.evaluate(() => {
    const width = document.documentElement.clientWidth;
    const pageOverflow = Math.max(
      document.documentElement.scrollWidth,
      document.body ? document.body.scrollWidth : 0
    ) - width;
    if (pageOverflow <= 1) return [];
    return Array.from(document.querySelectorAll("main *"))
      .filter((node) => {
        const style = getComputedStyle(node);
        if (style.position === "fixed" || style.display === "none") return false;
        const rect = node.getBoundingClientRect();
        if (!(rect.left < -1 || rect.right > width + 1)) return false;
        let ancestor = node.parentElement;
        while (ancestor && ancestor !== document.body) {
          const ancestorStyle = getComputedStyle(ancestor);
          if (/(auto|scroll)/.test(ancestorStyle.overflowX) && ancestor.scrollWidth > ancestor.clientWidth) {
            return false;
          }
          ancestor = ancestor.parentElement;
        }
        return true;
      })
      .slice(0, 8)
      .map((node) => ({
        tag: node.tagName,
        id: node.id,
        className: String(node.className || ""),
        rect: node.getBoundingClientRect().toJSON()
      }));
  });
  expect(report, `${label} overflow`).toEqual([]);
}

async function contrastReport(page) {
  return page.evaluate(() => {
    function rgba(value) {
      const match = String(value).match(/rgba?\(([\d.]+)[ ,]+([\d.]+)[ ,]+([\d.]+)(?:[ ,/]+([\d.]+))?\)/);
      return match ? [Number(match[1]), Number(match[2]), Number(match[3]), match[4] == null ? 1 : Number(match[4])] : null;
    }
    function blend(foreground, background) {
      const alpha = foreground[3];
      return [
        foreground[0] * alpha + background[0] * (1 - alpha),
        foreground[1] * alpha + background[1] * (1 - alpha),
        foreground[2] * alpha + background[2] * (1 - alpha),
        1
      ];
    }
    function backgroundFor(node) {
      let current = node;
      let color = [255, 255, 255, 1];
      const layers = [];
      while (current) {
        const parsed = rgba(getComputedStyle(current).backgroundColor);
        if (parsed && parsed[3] > 0) layers.push(parsed);
        current = current.parentElement;
      }
      layers.reverse().forEach((layer) => { color = blend(layer, color); });
      return color;
    }
    function luminance(rgb) {
      const channels = rgb.slice(0, 3).map((value) => {
        const channel = value / 255;
        return channel <= 0.03928 ? channel / 12.92 : Math.pow((channel + 0.055) / 1.055, 2.4);
      });
      return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
    }
    function ratio(a, b) {
      const first = luminance(a);
      const second = luminance(b);
      return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05);
    }
    function visible(node) {
      const style = getComputedStyle(node);
      return node.getClientRects().length > 0 && style.visibility !== "hidden" && style.display !== "none";
    }
    function textEntry(node) {
      const background = backgroundFor(node);
      const parsed = rgba(getComputedStyle(node).color);
      const foreground = parsed ? blend(parsed, background) : null;
      return {
        selector: node.id || node.tagName,
        className: String(node.className || ""),
        text: String(node.textContent || "").trim().slice(0, 80),
        foreground,
        background,
        ratio: foreground ? ratio(foreground, background) : 0
      };
    }
    const text = Array.from(document.querySelectorAll("main h1,main h2,main h3,main legend,main label,main dt,main dd,main p,.gav-kicker,.gnv-kicker,.bnw-factor,.msp-eyebrow"))
      .filter((node) => visible(node) && String(node.textContent || "").trim())
      .map(textEntry);
    const controls = Array.from(document.querySelectorAll("main input,main select,main button,main textarea"))
      .filter((node) => visible(node) && !node.disabled)
      .map((node) => {
        const style = getComputedStyle(node);
        const parentBackground = backgroundFor(node.parentElement || node);
        const controlBackground = backgroundFor(node);
        const border = rgba(node.type === "checkbox" ? style.accentColor : style.borderTopColor);
        const borderColor = border ? blend(border, parentBackground) : null;
        const textColor = rgba(style.color);
        const foreground = textColor ? blend(textColor, controlBackground) : null;
        return {
          selector: node.id || node.className || node.tagName,
          textRequired: node.type !== "checkbox",
          borderColor,
          controlBackground,
          parentBackground,
          textRatio: foreground ? ratio(foreground, controlBackground) : 0,
          boundaryRatio: Math.max(
            borderColor ? ratio(borderColor, parentBackground) : 0,
            ratio(controlBackground, parentBackground)
          )
        };
      });
    return { text, controls };
  });
}

function assertComputedContrast(report, label) {
  expect(report.text.length, `${label} text samples`).toBeGreaterThanOrEqual(3);
  expect(report.controls.length, `${label} control samples`).toBeGreaterThanOrEqual(2);
  expect(report.text.every((item) => item.ratio >= 4.5), `${label} text ${JSON.stringify(report.text)}`).toBe(true);
  expect(report.controls.every((item) => !item.textRequired || item.textRatio >= 4.5), `${label} control text ${JSON.stringify(report.controls)}`).toBe(true);
  expect(report.controls.every((item) => item.boundaryRatio >= 3), `${label} boundaries ${JSON.stringify(report.controls)}`).toBe(true);
}

async function assertFocusContrast(page, selectors, label) {
  for (const selector of selectors) {
    const locator = page.locator(selector).first();
    await page.keyboard.press("Tab");
    await locator.focus();
    const report = await locator.evaluate((node) => {
      function rgb(value) {
        const match = String(value).match(/rgba?\((\d+(?:\.\d+)?)[ ,]+(\d+(?:\.\d+)?)[ ,]+(\d+(?:\.\d+)?)/);
        return match ? match.slice(1, 4).map(Number) : null;
      }
      function luminance(color) {
        const values = color.map((value) => {
          const channel = value / 255;
          return channel <= 0.03928 ? channel / 12.92 : Math.pow((channel + 0.055) / 1.055, 2.4);
        });
        return 0.2126 * values[0] + 0.7152 * values[1] + 0.0722 * values[2];
      }
      function ratio(first, second) {
        const a = luminance(first), b = luminance(second);
        return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
      }
      let parent = node.parentElement;
      let background = null;
      while (parent && !background) {
        const color = getComputedStyle(parent).backgroundColor;
        if (!/rgba\([^)]*,\s*0\s*\)$/.test(color) && color !== "transparent") background = rgb(color);
        parent = parent.parentElement;
      }
      const style = getComputedStyle(node);
      const indicator = rgb(style.outlineColor);
      return {
        focusVisible: node.matches(":focus-visible"),
        outlineStyle: style.outlineStyle,
        outlineWidth: parseFloat(style.outlineWidth) || 0,
        ratio: indicator && background ? ratio(indicator, background) : 0
      };
    });
    expect(report.focusVisible, `${label} ${selector} focus-visible`).toBe(true);
    expect(report.outlineStyle, `${label} ${selector} outline`).not.toBe("none");
    expect(report.outlineWidth, `${label} ${selector} outline width`).toBeGreaterThanOrEqual(2);
    expect(report.ratio, `${label} ${selector} focus contrast`).toBeGreaterThanOrEqual(3);
  }
}

async function assertKeyboardFocus(page, fixture) {
  const firstMainControl = page.locator("main button:not([disabled]), main input:not([disabled]), main select:not([disabled])").first();
  await firstMainControl.focus();
  const reached = [];
  for (let index = 0; index < 70; index += 1) {
    await page.keyboard.press("Tab");
    const state = await page.evaluate(() => {
      const node = document.activeElement;
      if (!node || node === document.body) return null;
      const style = getComputedStyle(node);
      return {
        id: node.id || "",
        mode: node.getAttribute("data-mode") || "",
        inMain: Boolean(node.closest("main")),
        visible: node.matches(":focus-visible"),
        indicator: style.outlineStyle !== "none" || style.boxShadow !== "none"
      };
    });
    if (state && state.inMain) reached.push(state);
    if (state && state.id === fixture.selectors.pdf.slice(1)) break;
  }
  expect(reached.some((state) => state.id === fixture.selectors.amount.slice(1))).toBe(true);
  expect(reached.some((state) => state.mode === "extract")).toBe(true);
  expect(reached.some((state) => state.id === fixture.selectors.pdf.slice(1))).toBe(true);
  expect(
    reached.every((state) => state.visible && state.indicator),
    JSON.stringify(reached)
  ).toBe(true);
}

async function assertKeyboardTargets(page, requiredSelectors) {
  await page.locator("main button:not([disabled]), main input:not([disabled]), main select:not([disabled])").first().focus();
  const reached = new Set();
  const focusStates = [];
  for (let index = 0; index < 120 && reached.size < requiredSelectors.length; index += 1) {
    await page.keyboard.press("Tab");
    const state = await page.evaluate((selectors) => {
      const node = document.activeElement;
      if (!node || node === document.body || !node.closest("main")) return null;
      const style = getComputedStyle(node);
      return {
        matched: selectors.filter((selector) => node.matches(selector)),
        visible: node.matches(":focus-visible"),
        indicator: style.outlineStyle !== "none" || style.boxShadow !== "none"
      };
    }, requiredSelectors);
    if (!state) continue;
    state.matched.forEach((selector) => reached.add(selector));
    focusStates.push(state);
  }
  expect([...reached].sort()).toEqual([...requiredSelectors].sort());
  expect(
    focusStates.filter((state) => state.matched.length).every((state) => state.visible && state.indicator),
    JSON.stringify(focusStates.filter((state) => state.matched.length))
  ).toBe(true);
}

async function assertDisplayedResult(page, fixture) {
  await expect(page.locator(fixture.selectors.result)).toBeVisible();
  await expect(page.locator(fixture.selectors.net)).toContainText(numberPattern(fixture.expected.net));
  await expect(page.locator(fixture.selectors.tax)).toContainText(
    numberPattern(fixture.expected.vat ?? fixture.expected.gst)
  );
  await expect(page.locator(fixture.selectors.gross)).toContainText(numberPattern(fixture.expected.gross));
  if (fixture.selectors.base) {
    await expect(page.locator(fixture.selectors.base)).toContainText(
      numberPattern(fixture.expected.taxableBase)
    );
  }
}

async function assertVatPdf(page, fixture, locale) {
  if (fixture.evidenceBoundary) {
    await page.locator(fixture.evidenceBoundary.rateSelector).selectOption("standard");
  }
  await page.locator(fixture.selectors.amount).fill(String(fixture.input.amount));
  await assertDisplayedResult(page, fixture);
  const pending = page.waitForEvent("download");
  await page.locator(fixture.selectors.pdf).click();
  const download = await pending;
  const downloadPath = await download.path();
  const buffer = fs.readFileSync(downloadPath);
  expect(buffer.subarray(0, 5).toString(), `${fixture.id} ${locale} PDF header`).toBe("%PDF-");
  const pdfText = parsePdfFile(downloadPath).replace(/\0/g, "");
  const normalizedPdfText = pdfText.replace(/\s+/g, " ");
  const [title, source] = fixture.pdfProvenance[locale];
  expect(normalizedPdfText, `${fixture.id} ${locale} PDF title`).toContain(title);
  expect(normalizedPdfText, `${fixture.id} ${locale} PDF provenance`).toContain(source);
  const pdfCurrency = fixture.pdfCurrency && typeof fixture.pdfCurrency === "object"
    ? fixture.pdfCurrency[locale]
    : fixture.pdfCurrency || fixture.currency;
  expect(normalizedPdfText).toContain(pdfCurrency);
  expect(pdfText).toMatch(numberPattern(fixture.expected.net));
  if (fixture.expected.taxableBase != null) expect(pdfText).toMatch(numberPattern(fixture.expected.taxableBase));
  expect(pdfText).toMatch(numberPattern(fixture.expected.gross));
  expect(pdfText).toMatch(numberPattern(fixture.expected.vat ?? fixture.expected.gst));
  if (locale === "sw") {
    expect(pdfText).not.toMatch(/Sources? reviewed|Official (?:standard|general) rate|Currency:/i);
  } else {
    expect(pdfText).not.toMatch(/Vyanzo vimekaguliwa|Chanzo kimekaguliwa|Sarafu:/i);
  }
}

async function engineScriptCount(page, fixture) {
  const expectedPath = `/${fixture.engine.replace(/\\/g, "/")}`;
  return page.locator("script[src]").evaluateAll((scripts, target) =>
    scripts.filter((script) => {
      try {
        return new URL(script.src, document.baseURI).pathname === target;
      } catch (_) {
        return false;
      }
    }).length, expectedPath);
}

async function runVatWorkflow(page, fixture) {
  if (fixture.selectors.currency) {
    await page.locator(fixture.selectors.currency).selectOption(fixture.input.currency);
  }
  await page.locator(fixture.selectors.amount).fill(String(fixture.input.amount));
  await assertDisplayedResult(page, fixture);

  await page.getByRole("button", { name: /extract|toa vat|toa gst/i }).click();
  await page.locator(fixture.selectors.amount).fill(String(fixture.extractInput));
  await expect(page.locator(fixture.selectors.net)).toContainText(numberPattern(fixture.expected.net));
  await expect(page.locator(fixture.selectors.gross)).toContainText(numberPattern(fixture.extractInput));

  await page.locator(fixture.selectors.amount).fill("-1");
  await expect(page.locator(fixture.selectors.result)).not.toHaveClass(/(?:^|\s)on(?:\s|$)/);
  await expect(page.locator(fixture.selectors.error)).not.toBeEmpty();

  await page.getByRole("button", { name: /add|ongeza/i }).click();
  await page.locator(fixture.selectors.amount).fill(String(fixture.input.amount));
  await assertDisplayedResult(page, fixture);

  if (fixture.evidenceBoundary) {
    const boundary = fixture.evidenceBoundary;
    await page.locator(boundary.rateSelector).selectOption(boundary.rateValue);
    await expect(page.locator(fixture.selectors.result)).not.toHaveClass(/(?:^|\s)on(?:\s|$)/);
    await expect(page.locator(fixture.selectors.error)).not.toBeEmpty();
    await page.locator(boundary.evidenceSelector).check();
    await expect(page.locator(fixture.selectors.tax)).toContainText(numberPattern(boundary.expectedTax));
  }
}

test.beforeAll(async ({ request }) => {
  expect(manifest.rootIdentity).toBe(expectedRootIdentity);
  expect(sha256(manifestPath)).toBe(expectedFixtureSha256);
  assertProcessIdentity({
    rootIdentity: expectedRootIdentity,
    fixturePath: manifestPath,
    fixtureSha256: expectedFixtureSha256,
    fixtureEnv: "AFROTOOLS_SW_VAT_WAVE1_FIXTURE_SHA256"
  });
  const response = await request.get("/tests/fixtures/swahili-vat-business-tax-wave1.json");
  expect(response.ok()).toBe(true);
  assertResponseIdentity(response);
  const served = await response.json();
  expect(served.rootIdentity).toBe(manifest.rootIdentity);
  expect(path.resolve(ROOT)).toBe(path.resolve(process.cwd()));
});

for (const fixture of manifest.routes) {
  test(`${fixture.id} exact EN/SW formula, invalid boundary, PDF, a11y and metadata`, async ({ page }) => {
    const failures = runtimeRecorder(page);
    const requests = requestRecorder(page);

    await proofGoto(page, fixture.englishRoute);
    await assertSeo(page, fixture, "en");
    await runVatWorkflow(page, fixture);
    await assertVatPdf(page, fixture, "en");
    const englishScripts = await engineScriptCount(page, fixture);
    expect(englishScripts).toBe(1);

    await page.setViewportSize({ width: 320, height: 900 });
    await page.emulateMedia({ colorScheme: "light", reducedMotion: "reduce" });
    await proofGoto(page, fixture.swahiliRoute);
    await expect(page.locator("html")).toHaveAttribute("lang", "sw");
    await assertSeo(page, fixture, "sw");
    await runVatWorkflow(page, fixture);
    await assertSwahiliShell(page, fixture.id);
    const resultLabel = await page.locator(fixture.selectors.result).getAttribute("aria-label");
    expect(resultLabel, `${fixture.id} Swahili result region label`).toMatch(/^(?:Matokeo ya (?:VAT|GST)|Kokotoa)$/);
    const swahiliScripts = await engineScriptCount(page, fixture);
    expect(swahiliScripts).toBe(1);
    await assertNoOverflow(page, `${fixture.id} 320px`);
    await page.evaluate(() => { document.documentElement.style.fontSize = "200%"; });
    await assertNoOverflow(page, `${fixture.id} 200%`);

    await page.setViewportSize({ width: 375, height: 900 });
    await page.evaluate(() => {
      document.documentElement.style.fontSize = "";
      document.documentElement.dataset.theme = "dark";
    });
    const countryFocusSelectors = [
      fixture.selectors.amount,
      'main [data-mode="extract"]',
      'main form button[type="submit"]',
      fixture.selectors.pdf
    ];
    if (fixture.evidenceBoundary) {
      countryFocusSelectors.push(fixture.evidenceBoundary.rateSelector, fixture.evidenceBoundary.evidenceSelector);
    }
    await assertNoOverflow(page, `${fixture.id} 375px dark`);
    const darkContrast = await contrastReport(page);
    assertComputedContrast(darkContrast, `${fixture.id} dark`);
    await assertFocusContrast(page, countryFocusSelectors, `${fixture.id} dark`);
    await page.locator(fixture.selectors.amount).fill("-1");
    await expect(page.locator(fixture.selectors.error)).not.toBeEmpty();
    assertComputedContrast(await contrastReport(page), `${fixture.id} dark invalid`);
    await page.locator(fixture.selectors.amount).fill(String(fixture.input.amount));

    await page.evaluate(() => { document.documentElement.dataset.theme = "light"; });
    const lightContrast = await contrastReport(page);
    assertComputedContrast(lightContrast, `${fixture.id} light`);
    await page.locator(fixture.selectors.amount).fill("-1");
    await expect(page.locator(fixture.selectors.error)).not.toBeEmpty();
    assertComputedContrast(await contrastReport(page), `${fixture.id} light invalid`);
    await page.locator(fixture.selectors.amount).fill(String(fixture.input.amount));
    await assertFocusContrast(page, countryFocusSelectors, `${fixture.id} light`);

    if (fixture.evidenceBoundary) {
      await page.locator(fixture.evidenceBoundary.rateSelector).selectOption("standard");
    }
    await page.locator(fixture.selectors.amount).fill(String(fixture.input.amount));
    await assertDisplayedResult(page, fixture);
    await assertKeyboardFocus(page, fixture);
    await assertVatPdf(page, fixture, "sw");

    expect(requests.filter((request) => request.method !== "GET")).toEqual([]);
    const sensitiveTokens = [
      String(fixture.input.amount),
      String(fixture.extractInput)
    ];
    expect(
      requests.filter((request) =>
        sensitiveTokens.some((token) => new URL(request.url).search.includes(token))
      )
    ).toEqual([]);
    expect(failures).toEqual([]);
  });
}

async function fillBusinessName(page, keywords = "trust, payments, quick") {
  await page.locator("#keywords").fill(keywords);
  await page.locator(".bnw-form button[type=submit]").click();
}

test("business-name-gen exact EN/SW output, invalid/stale states and all local exports", async ({ page }) => {
  const fixture = manifest.businessRoutes.find((route) => route.id === "business-name-gen");
  const failures = runtimeRecorder(page);
  const requests = requestRecorder(page);

  for (const [route, locale] of [[fixture.englishRoute, "en"], [fixture.swahiliRoute, "sw"]]) {
    await page.setViewportSize({ width: 320, height: 900 });
    await page.emulateMedia({ colorScheme: "light", reducedMotion: "reduce" });
    await proofGoto(page, route);
    await expect(page.locator("html")).toHaveAttribute("lang", locale);
    await assertSeo(page, fixture, locale);
    await fillBusinessName(page);
    await expect(page.locator(".bnw-name")).toHaveCount(fixture.expected.count);
    await expect(page.locator(".bnw-name h3").first()).toHaveText(fixture.expected.firstName);
    await expect(page.locator(".bnw-name").first()).toContainText(String(fixture.expected.firstScore));
    await assertNoOverflow(page, `business-name ${locale} 320px`);
    if (locale === "sw") await assertSwahiliShell(page, fixture.id);
    if (locale === "en") {
      let englishPending = page.waitForEvent("download");
      await page.locator('[data-export="csv"]').click();
      expect(fs.readFileSync(await (await englishPending).path(), "utf8")).toContain('"Trust Tech"');
      englishPending = page.waitForEvent("download");
      await page.locator('[data-export="json"]').click();
      const englishJson = JSON.parse(fs.readFileSync(await (await englishPending).path(), "utf8"));
      expect(englishJson.suggestions[0].name).toBe("Trust Tech");
      expect(englishJson.engineVersion || englishJson.version).toBe(fixture.expected.version);
      englishPending = page.waitForEvent("download");
      await page.locator('[data-export="pdf"]').click();
      const englishPdf = parsePdfFile(await (await englishPending).path());
      expect(englishPdf).toContain("African Business Name Shortlist Workshop");
      expect(englishPdf).toContain("Trust Tech");
      await page.evaluate(() => { window.__printCalled = false; window.print = () => { window.__printCalled = true; }; });
      await page.locator('[data-export="print"]').click();
      expect(await page.evaluate(() => window.__printCalled)).toBe(true);
    }
  }

  await page.locator("#keywords").fill("");
  await page.locator(".bnw-form button[type=submit]").click();
  await expect(page.locator(".bnw-name")).toHaveCount(0);
  await expect(page.locator("[data-export]:disabled")).toHaveCount(4);

  await fillBusinessName(page, "<img src=x onerror=alert(1)>, trust, payments");
  await expect(page.locator(".bnw-name")).toHaveCount(20);
  await expect(page.locator(".bnw-name img,.bnw-name script")).toHaveCount(0);
  await page.locator("#keywords").fill("new brief");
  await expect(page.locator(".bnw-name")).toHaveCount(0);
  await expect(page.locator("[data-export]:disabled")).toHaveCount(4);
  await fillBusinessName(page);
  await assertKeyboardTargets(page, [
    "#keywords",
    ".bnw-form button[type=submit]",
    '[data-export="csv"]',
    '[data-export="pdf"]'
  ]);
  await assertFocusContrast(page, ["#keywords", ".bnw-form button[type=submit]", '[data-export="pdf"]'], "business-name light");

  let pending = page.waitForEvent("download");
  await page.locator('[data-export="csv"]').click();
  const csv = fs.readFileSync(await (await pending).path(), "utf8");
  expect(csv).toContain('"Trust Tech"');
  expect(csv).toContain(fixture.expected.version);
  expect(csv.split(/\r?\n/).filter((line) => /"Trust Tech"|^\d+[,;]/.test(line)).length).toBeGreaterThan(0);

  pending = page.waitForEvent("download");
  await page.locator('[data-export="json"]').click();
  const json = JSON.parse(fs.readFileSync(await (await pending).path(), "utf8"));
  expect(json.suggestions).toHaveLength(20);
  expect(json.suggestions[0].name).toBe("Trust Tech");
  expect(json.engineVersion || json.version).toBe(fixture.expected.version);

  pending = page.waitForEvent("download");
  await page.locator('[data-export="pdf"]').click();
  const parsedText = parsePdfFile(await (await pending).path());
  expect(parsedText).toContain("Trust Tech");
  expect(parsedText).toMatch(/Warsha|Majina ya Biashara/);

  await page.evaluate(() => {
    window.__printCalled = false;
    window.print = () => { window.__printCalled = true; };
  });
  await page.locator('[data-export="print"]').click();
  expect(await page.evaluate(() => window.__printCalled)).toBe(true);

  await page.evaluate(() => { document.documentElement.style.fontSize = "200%"; });
  await assertNoOverflow(page, "business-name 200%");
  await page.setViewportSize({ width: 375, height: 900 });
  await page.evaluate(() => { document.documentElement.style.fontSize = ""; });
  const lightContrast = await contrastReport(page);
  assertComputedContrast(lightContrast, "business-name light");
  await page.evaluate(() => {
    document.documentElement.dataset.theme = "dark";
  });
  const contrast = await contrastReport(page);
  assertComputedContrast(contrast, "business-name dark");
  await assertFocusContrast(page, ["#keywords", ".bnw-form button[type=submit]", '[data-export="pdf"]'], "business-name dark");
  expect(requests.filter((request) => request.method !== "GET")).toEqual([]);
  expect(requests.filter((request) => new URL(request.url).search.includes("trust"))).toEqual([]);
  expect(failures).toEqual([]);
});

async function fillMarket(page, name = "Tomatoes") {
  await page.locator(".js-currency").fill("KES");
  await page.locator(".js-days").fill("20");
  await page.locator(".js-reinvest").fill("30");
  await page.locator(".js-name").first().fill(name);
  await page.locator(".js-cost").first().fill("50");
  await page.locator(".js-price").first().fill("80");
  await page.locator(".js-sold").first().fill("10");
  await page.locator(".js-lost").first().fill("2");
  await page.locator(".js-expense-amount").first().fill("100");
  await page.locator(".js-expense-amount").nth(1).fill("50");
}

test("market-stall-profit exact EN/SW formula, invalid/stale states and all local exports", async ({ page }) => {
  const fixture = manifest.businessRoutes.find((route) => route.id === "market-stall-profit");
  const failures = runtimeRecorder(page);
  const requests = requestRecorder(page);

  for (const [route, locale, button] of [
    [fixture.englishRoute, "en", /calculate daily profit/i],
    [fixture.swahiliRoute, "sw", /kokotoa faida ya siku/i]
  ]) {
    await page.setViewportSize({ width: 320, height: 900 });
    await page.emulateMedia({ colorScheme: "light", reducedMotion: "reduce" });
    await proofGoto(page, route);
    await expect(page.locator("html")).toHaveAttribute("lang", locale);
    await assertSeo(page, fixture, locale);
    await fillMarket(page);
    await page.getByRole("button", { name: button }).click();
    await expect(page.locator("[data-results]")).toBeVisible();
    await expect(page.locator("[data-results]")).toContainText(numberPattern(fixture.expected.revenue));
    await expect(page.locator("[data-results]")).toContainText(numberPattern(fixture.expected.netDailyProfit));
    await expect(page.locator("[data-results]")).toContainText(numberPattern(fixture.expected.breakEvenRevenue));
    await assertNoOverflow(page, `market ${locale} 320px`);
    if (locale === "sw") await assertSwahiliShell(page, fixture.id);
    if (locale === "en") {
      let englishPending = page.waitForEvent("download");
      await page.locator('[data-action="csv"]').click();
      const englishCsv = fs.readFileSync(await (await englishPending).path(), "utf8");
      expect(englishCsv).toContain(String(fixture.expected.netDailyProfit));
      expect(englishCsv).toContain(fixture.expected.version);
      englishPending = page.waitForEvent("download");
      await page.locator('[data-action="json"]').click();
      const englishJson = JSON.parse(fs.readFileSync(await (await englishPending).path(), "utf8"));
      expect(englishJson.engineVersion).toBe(fixture.expected.version);
      expect(englishJson.outputs.netDailyProfit).toBe(fixture.expected.netDailyProfit);
      englishPending = page.waitForEvent("download");
      await page.locator('[data-action="pdf"]').click();
      const englishPdf = parsePdfFile(await (await englishPending).path());
      expect(englishPdf).toMatch(/Market Stall|Daily Profit/i);
      expect(englishPdf).toMatch(numberPattern(fixture.expected.netDailyProfit));
      await page.evaluate(() => { window.__printCalled = false; window.print = () => { window.__printCalled = true; }; });
      await page.locator('[data-action="print"]').click();
      expect(await page.evaluate(() => window.__printCalled)).toBe(true);
    }
  }

  await page.locator(".js-lost").first().fill("-1");
  await page.getByRole("button", { name: /kokotoa faida ya siku/i }).click();
  await expect(page.locator("[data-results]")).toBeHidden();
  await expect(page.locator("[data-error]")).toBeVisible();
  await expect(page.locator("[data-error]")).not.toBeEmpty();

  await page.locator(".js-lost").first().fill("2");
  await page.getByRole("button", { name: /kokotoa faida ya siku/i }).click();
  await page.locator(".js-sold").first().fill("11");
  await expect(page.locator("[data-results]")).toBeHidden();
  await fillMarket(page, "=CMD");
  await page.getByRole("button", { name: /kokotoa faida ya siku/i }).click();
  await assertKeyboardTargets(page, [
    ".js-name",
    ".msp-submit",
    '[data-action="csv"]',
    '[data-action="pdf"]'
  ]);
  await assertFocusContrast(page, [".js-name", ".msp-submit", '[data-action="pdf"]'], "market-stall light");

  let pending = page.waitForEvent("download");
  await page.getByRole("button", { name: /pakua csv/i }).click();
  const csv = fs.readFileSync(await (await pending).path(), "utf8");
  expect(csv).toContain("'=CMD");
  expect(csv).toContain(String(fixture.expected.netDailyProfit));
  expect(csv).toContain(fixture.expected.version);

  pending = page.waitForEvent("download");
  await page.getByRole("button", { name: /pakua json/i }).click();
  const json = JSON.parse(fs.readFileSync(await (await pending).path(), "utf8"));
  expect(json.engineVersion).toBe(fixture.expected.version);
  expect(json.outputs.netDailyProfit).toBe(fixture.expected.netDailyProfit);
  expect(json.outputs.breakEvenRevenue).toBe(fixture.expected.breakEvenRevenue);
  expect(json.outputs.monthlyScenario.netProfit).toBe(fixture.expected.monthlyNetProfit);

  pending = page.waitForEvent("download");
  await page.getByRole("button", { name: /pakua pdf/i }).click();
  const parsedText = parsePdfFile(await (await pending).path());
  expect(parsedText).toContain("Kipangaji cha Faida ya Siku ya Kibanda");
  expect(parsedText).toMatch(numberPattern(fixture.expected.netDailyProfit));
  expect(parsedText).toMatch(numberPattern(fixture.expected.revenue));
  expect(parsedText).toMatch(numberPattern(fixture.expected.monthlyNetProfit));
  expect(parsedText).not.toMatch(/Engine:|Formula:|Break-even:|Assumptions:|Items|revenue|sold-stock cost|stock-loss cost/i);

  await page.evaluate(() => {
    window.__printCalled = false;
    window.print = () => { window.__printCalled = true; };
  });
  await page.getByRole("button", { name: /chapisha/i }).click();
  expect(await page.evaluate(() => window.__printCalled)).toBe(true);

  await page.evaluate(() => { document.documentElement.style.fontSize = "200%"; });
  await assertNoOverflow(page, "market 200%");
  await page.setViewportSize({ width: 375, height: 900 });
  await page.evaluate(() => { document.documentElement.style.fontSize = ""; });
  const lightContrast = await contrastReport(page);
  assertComputedContrast(lightContrast, "market-stall light");
  await page.evaluate(() => {
    document.documentElement.dataset.theme = "dark";
  });
  const contrast = await contrastReport(page);
  assertComputedContrast(contrast, "market-stall dark");
  await assertFocusContrast(page, [".js-name", ".msp-submit", '[data-action="pdf"]'], "market-stall dark");
  expect(requests.filter((request) => request.method !== "GET")).toEqual([]);
  expect(requests.filter((request) => new URL(request.url).search.includes("CMD"))).toEqual([]);
  expect(failures).toEqual([]);
});
