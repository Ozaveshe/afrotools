const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const pdfParse = require("pdf-parse");
const { test, expect } = require("@playwright/test");

const ROOT = path.resolve(__dirname, "../..");
const manifest = require("../../data/localization/sw-agriculture-parity-manifest.json");
const aiRouteMap = require("../../assets/js/ai/swahili-agriculture-route-map.generated.js");

const ROWS = manifest.rows.filter(row => row.family === "fertilizer");
const COUNTRY_ROWS = ROWS.filter(row => row.country);
const HUB = ROWS.find(row => !row.country);
const browserEvidence = new Map();

function loadScript(sandbox, relativeFile) {
  vm.runInContext(fs.readFileSync(path.join(ROOT, relativeFile), "utf8"), sandbox, {
    filename: relativeFile
  });
}

function oracleFor(row) {
  const code = row.country.code;
  const sandbox = { window: { AfroTools: {} } };
  vm.createContext(sandbox);
  loadScript(sandbox, "data/agriculture/crop-database.js");
  loadScript(sandbox, `data/agriculture/${code.toLowerCase()}-agri-data.js`);
  loadScript(sandbox, "engines/src/fertilizer-engine.js");
  const runtime = sandbox.window.AfroTools;
  const data = runtime.countryData;
  const crop = data.crops.find(item => (
    item.nutrientUptake
    || runtime.cropDatabase.crops[item.id]
    && runtime.cropDatabase.crops[item.id].nutrientUptake
  ));
  const region = data.regions[0];
  const input = {
    cropId: crop.id,
    regionId: region.id,
    farmSizeHa: data.agriStats.avgFarmSizeHa || 1,
    targetYieldPerHa: null,
    soilType: region.soilTypes[0],
    previousCrop: "none",
    soilTest: null
  };
  return {
    input,
    result: JSON.parse(JSON.stringify(
      runtime.FertilizerEngine.calculate(input, data, runtime.cropDatabase)
    ))
  };
}

function watchRuntime(page) {
  const errors = [];
  const writes = [];
  page.on("console", message => {
    if (message.type() === "error") errors.push(`console:${message.text()}`);
  });
  page.on("pageerror", error => errors.push(`pageerror:${error.message}`));
  page.on("requestfailed", request => {
    errors.push(`requestfailed:${request.url()} ${request.failure() && request.failure().errorText}`);
  });
  page.on("response", response => {
    if (response.status() >= 400) errors.push(`http:${response.status()} ${response.url()}`);
  });
  page.on("request", request => {
    if (!["GET", "HEAD", "OPTIONS"].includes(request.method())) {
      writes.push(`${request.method()} ${request.url()}`);
    }
  });
  return { errors, writes };
}

async function downloadBuffer(page, action) {
  const pending = page.waitForEvent("download");
  await page.locator(`[data-action="${action}"]`).click();
  const download = await pending;
  return {
    filename: download.suggestedFilename(),
    buffer: fs.readFileSync(await download.path())
  };
}

async function expectNoOverflow(page, label) {
  expect(await page.evaluate(() => (
    document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1
  )), label).toBe(true);
}

async function setTheme(page, theme) {
  await page.evaluate(value => {
    document.documentElement.dataset.theme = value;
    localStorage.setItem("afrotools-theme", value);
    document.getElementById("themeToggle").setAttribute("aria-pressed", value === "dark" ? "true" : "false");
  }, theme);
  const expected = theme === "dark" ? "rgb(13, 22, 36)" : "rgb(245, 248, 252)";
  expect(await page.locator("body").evaluate(element => getComputedStyle(element).backgroundColor)).toBe(expected);
}

test.afterAll(() => {
  const outputDir = path.join(ROOT, "reports", "sw-agriculture-acceptance");
  fs.mkdirSync(outputDir, { recursive: true });
  const evidenceRows = ROWS.map(row => (
    browserEvidence.get(row.swahili.routeKey)
    || {
      id: row.english.id,
      route: row.swahili.routeKey,
      countryCode: row.country && row.country.code || null,
      state: "blocked",
      reason: "No completed Chromium route receipt."
    }
  ));
  fs.writeFileSync(
    path.join(outputDir, "fertilizer-browser.json"),
    `${JSON.stringify({
      schemaVersion: 1,
      family: "fertilizer",
      browser: "chromium",
      expectedRows: 55,
      acceptedRows: evidenceRows.filter(row => row.state === "passed").length,
      failClosed: true,
      rows: evidenceRows
    }, null, 2)}\n`,
    "utf8"
  );
});

test("fertilizer hub proves all 54 routes at both mobile widths and themes", async ({ page }) => {
  const runtime = watchRuntime(page);
  await page.emulateMedia({ colorScheme: "light", reducedMotion: "reduce" });
  await page.setViewportSize({ width: 375, height: 900 });
  await page.goto(HUB.swahili.routeKey, { waitUntil: "domcontentloaded" });
  await expect(page.locator("html")).toHaveAttribute("lang", "sw");
  await expect(page.locator(".country-list a")).toHaveCount(54);
  await expect(page.locator("iframe")).toHaveCount(0);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", `https://afrotools.com${HUB.swahili.routeKey}`);
  await expect(page.locator('link[rel="alternate"][hreflang="en"]')).toHaveAttribute("href", `https://afrotools.com${HUB.english.route}`);
  await expect(page.locator('link[rel="alternate"][hreflang="sw"]')).toHaveAttribute("href", `https://afrotools.com${HUB.swahili.routeKey}`);
  await expect(page.locator('meta[property="og:url"]')).toHaveAttribute("content", `https://afrotools.com${HUB.swahili.routeKey}`);
  await expect(page.locator(".hero-art")).toHaveAttribute("src", `/${HUB.artwork.file}`);
  const schema = await page.locator('script[type="application/ld+json"]').first().evaluate(node => JSON.parse(node.textContent));
  expect(schema.inLanguage).toBe("sw");
  expect(aiRouteMap.routes[HUB.english.routeKey]).toBe(HUB.swahili.routeKey);
  await expect(page.getByText(/Hakuna ingizo linalotumwa kwa seva au AI/)).toBeVisible();
  await expect(page.getByText(/kiungo cha Msaidizi ni cha hiari/)).toBeVisible();
  await page.getByRole("link", { name: "Msaidizi" }).focus();
  await expect(page.getByRole("link", { name: "Msaidizi" })).toBeFocused();
  await setTheme(page, "light");
  await expectNoOverflow(page, "hub 375px light");
  await setTheme(page, "dark");
  await page.setViewportSize({ width: 320, height: 900 });
  await expectNoOverflow(page, "hub 320px dark");
  await setTheme(page, "light");
  await page.evaluate(() => { document.documentElement.style.fontSize = "200%"; });
  await expectNoOverflow(page, "hub 320px 200% reflow");
  await expect(page.locator('a[href^="/"]:not([href^="/sw/"])')).toHaveCount(0);
  expect(runtime.writes).toEqual([]);
  expect(runtime.errors).toEqual([]);
  browserEvidence.set(HUB.swahili.routeKey, {
    id: HUB.english.id,
    route: HUB.swahili.routeKey,
    countryCode: null,
    state: "passed",
    viewports: [320, 375],
    textReflowPercent: 200,
    themes: ["light", "dark"],
    countryLinks: 54,
    metadata: true,
    artwork: true,
    aiConsentBoundary: true,
    consoleNetworkClean: true
  });
});

for (const row of COUNTRY_ROWS) {
  test(`${row.english.id}: native parity, exports and per-route mobile acceptance`, async ({ page, context }) => {
    const code = row.country.code;
    const oracle = oracleFor(row);
    const runtime = watchRuntime(page);
    await page.addInitScript(() => {
      Object.defineProperty(navigator, "share", { configurable: true, value: undefined });
    });
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.emulateMedia({ colorScheme: "light", reducedMotion: "reduce" });
    await page.setViewportSize({ width: 375, height: 900 });
    await page.goto(row.swahili.routeKey, { waitUntil: "domcontentloaded" });

    await expect(page.locator("html")).toHaveAttribute("lang", "sw");
    await expect(page.locator("iframe")).toHaveCount(0);
    await expect(page.locator('meta[name="afrotools-country-id"]')).toHaveAttribute("content", code);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", `https://afrotools.com${row.swahili.routeKey}`);
    await expect(page.locator('link[rel="alternate"][hreflang="en"]')).toHaveAttribute("href", `https://afrotools.com${row.english.route}`);
    await expect(page.locator('link[rel="alternate"][hreflang="sw"]')).toHaveAttribute("href", `https://afrotools.com${row.swahili.routeKey}`);
    await expect(page.locator('meta[property="og:url"]')).toHaveAttribute("content", `https://afrotools.com${row.swahili.routeKey}`);
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute("content", `https://afrotools.com/${row.artwork.file}`);
    await expect(page.locator(".hero-art")).toHaveAttribute("src", `/${row.artwork.file}`);
    const schema = await page.locator('script[type="application/ld+json"]').first().evaluate(node => JSON.parse(node.textContent));
    expect(schema.inLanguage).toBe("sw");
    expect(schema.spatialCoverage.identifier).toBe(code);
    expect(aiRouteMap.routes[row.english.routeKey]).toBe(row.swahili.routeKey);

    const controls = page.locator("input:not([type=hidden]), select");
    for (let index = 0; index < await controls.count(); index += 1) {
      const id = await controls.nth(index).getAttribute("id");
      await expect(page.locator(`label[for="${id}"]`)).toHaveCount(1);
    }
    await expect(page.getByText(/Hakuna ingizo linalotumwa kwa seva/)).toBeVisible();
    await expect(page.getByText(/kikokotoo hiki hakitumi AI/)).toBeVisible();
    await expect(page.getByRole("link", { name: "Msaidizi wa AfroTools" })).toHaveAttribute("href", "/sw/ai/");

    await setTheme(page, "light");
    await expectNoOverflow(page, `${code} 375px light`);
    const submit = page.getByRole("button", { name: "Kokotoa mahitaji ya NPK" });
    await submit.focus();
    await expect(submit).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page.locator("#resultPanel")).toBeVisible();

    const proof = await page.evaluate(() => ({
      latest: window.__SW_AGRI_TEST__.latest,
      report: window.__SW_AGRI_TEST__.reportObject(),
      data: {
        countryCode: window.__SW_AGRI_TEST__.data.countryCode,
        currency: window.__SW_AGRI_TEST__.data.currency
      },
      engineCalculate: typeof window.__SW_AGRI_TEST__.engine.calculate
    }));
    expect(proof.engineCalculate).toBe("function");
    expect(proof.data.countryCode).toBe(code);
    expect(proof.latest.input).toEqual(oracle.input);
    expect(proof.latest.result).toEqual(oracle.result);
    expect(proof.report.language).toBe("sw");
    expect(proof.report.country.code).toBe(code);
    expect(proof.report.result.currency).toBe(proof.data.currency);
    expect(proof.report.sources.live).toBe(false);
    expect(proof.report.privacy).toEqual({
      localOnly: true,
      sentToServer: false,
      sentToAI: false,
      modelConsentRequiredForThisCalculator: false
    });

    const json = await downloadBuffer(page, "json");
    expect(json.filename).toMatch(new RegExp(`${code.toLowerCase()}.*\\.json$`));
    const parsedJson = JSON.parse(json.buffer.toString("utf8"));
    expect(parsedJson.country.code).toBe(code);
    expect(parsedJson.result).toEqual(oracle.result);

    const txt = await downloadBuffer(page, "txt");
    expect(txt.filename).toMatch(/\.txt$/i);
    expect(txt.buffer.toString("utf8")).toContain("makadirio ya mahitaji ya mbolea");
    expect(txt.buffer.toString("utf8")).toContain("Faragha: hesabu ya ndani");

    const csv = await downloadBuffer(page, "csv");
    expect(csv.filename).toMatch(/\.csv$/i);
    expect(csv.buffer.toString("utf8")).toContain("n_kg_hekta");
    expect(csv.buffer.toString("utf8")).toContain(code);

    const pdf = await downloadBuffer(page, "pdf");
    expect(pdf.filename).toMatch(/\.pdf$/i);
    expect(pdf.buffer.subarray(0, 4).toString("ascii")).toBe("%PDF");
    const parsedPdf = await pdfParse(pdf.buffer);
    expect(parsedPdf.text).toContain("makadirio ya mahitaji ya mbolea");
    expect(parsedPdf.text).toContain("Faragha: hesabu ya ndani");

    await page.locator('[data-action="save"]').click();
    const saved = JSON.parse(await page.evaluate(storageKey => localStorage.getItem(storageKey), `afrotools:sw-agriculture:fertilizer:${code}`));
    expect(saved.country.code).toBe(code);
    expect(saved.result).toEqual(oracle.result);
    await page.locator('[data-action="copy"]').click();
    await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toContain("mahitaji ya mbolea");
    await page.locator('[data-action="share"]').click();
    await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toContain(row.swahili.routeKey);

    await setTheme(page, "dark");
    await page.setViewportSize({ width: 320, height: 900 });
    await expectNoOverflow(page, `${code} 320px dark`);
    await setTheme(page, "light");
    await page.evaluate(() => { document.documentElement.style.fontSize = "200%"; });
    await expectNoOverflow(page, `${code} 320px 200% reflow`);
    await expect(page.locator(".fertilizer-products-mobile")).toBeVisible();

    await page.getByRole("button", { name: "Weka upya" }).click();
    await page.locator("#farmSize").fill("0");
    await submit.click();
    await expect(page.getByRole("alert")).toContainText("angalau hekta 0.1");
    await expect(page.locator("#farmSize")).toBeFocused();
    await expect(page.locator("#resultPanel")).toBeHidden();

    await page.locator("#farmSize").fill("1");
    await page.locator("#soilTestToggle").click();
    await page.locator("#soilPh").fill("15");
    await submit.click();
    await expect(page.getByRole("alert")).toContainText("kati ya 0 na 14");
    await expect(page.locator("#soilPh")).toBeFocused();
    await expect(page.locator("#resultPanel")).toBeHidden();

    expect(await page.evaluate(() => {
      const ids = [...document.querySelectorAll("[id]")].map(element => element.id);
      return ids.filter((id, index) => ids.indexOf(id) !== index);
    })).toEqual([]);
    await expect(page.locator('a[href^="/"]:not([href^="/sw/"])')).toHaveCount(0);
    expect(runtime.writes).toEqual([]);
    expect(runtime.errors).toEqual([]);

    browserEvidence.set(row.swahili.routeKey, {
      id: row.english.id,
      route: row.swahili.routeKey,
      countryCode: code,
      state: "passed",
      viewports: [320, 375],
      textReflowPercent: 200,
      themes: ["light", "dark"],
      deterministicOracle: "engines/src/fertilizer-engine.js",
      metadata: true,
      artwork: true,
      aiConsentBoundary: true,
      invalidStates: ["farmSize", "soilPh"],
      exportsParsed: ["json", "txt", "csv", "pdf"],
      localSaveReopened: true,
      copyShare: true,
      consoleNetworkClean: true
    });
  });
}
