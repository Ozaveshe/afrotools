const { test, expect } = require("@playwright/test");
const fs = require("node:fs");

const ROUTE = "/sw/zana/caption-za-maudhui/app";
const origin = new URL(`http://127.0.0.1:${Number(process.env.SW_CREATOR_CAPTIONS_PORT || 4442)}`).origin;

async function guard(page, observed) {
  page.on("console", (message) => { if (message.type() === "error") observed.errors.push(message.text()); });
  page.on("pageerror", (error) => observed.errors.push(error.message));
  page.on("request", (request) => {
    const url = new URL(request.url());
    if (url.origin !== origin) observed.external.push(request.url());
    if (!["GET", "HEAD", "OPTIONS"].includes(request.method())) observed.writes.push(`${request.method()} ${request.url()}`);
  });
  await page.route("**/*", (route) => {
    const url = new URL(route.request().url());
    if (url.origin === origin) return route.continue();
    if (url.hostname === "www.googletagmanager.com") return route.fulfill({ status: 204, contentType: "application/javascript", body: "" });
    return route.abort("blockedbyclient");
  });
  await page.addInitScript(() => {
    window.__sharedCaption = null;
    window.__copiedCaption = null;
    Object.defineProperty(navigator, "share", { configurable: true, value: async (payload) => { window.__sharedCaption = payload; } });
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText: async (text) => { window.__copiedCaption = text; } } });
  });
}

async function open(page) {
  await page.goto(ROUTE, { waitUntil: "domcontentloaded" });
  await expect(page.locator("html")).toHaveAttribute("lang", "sw");
  await expect(page.locator("#langSelect")).toHaveValue("swahili");
}

async function downloadText(page) {
  const pending = page.waitForEvent("download");
  await page.locator("#exportAllBtn").click();
  const download = await pending;
  return fs.readFileSync(await download.path(), "utf8");
}

async function expectNoOverflow(page) {
  const sizes = await page.evaluate(() => [document.documentElement.clientWidth, document.documentElement.scrollWidth]);
  expect(sizes[1], JSON.stringify(sizes)).toBeLessThanOrEqual(sizes[0] + 1);
}

async function contrastRatio(page, foregroundSelector, backgroundSelector, colorProperty = "color") {
  return page.evaluate(({ foregroundSelector, backgroundSelector, colorProperty }) => {
    function rgba(value) {
      const values = String(value).match(/[\d.]+/g).map(Number);
      return { r: values[0], g: values[1], b: values[2], a: values.length > 3 ? values[3] : 1 };
    }
    function composite(foreground, background) {
      return {
        r: foreground.r * foreground.a + background.r * (1 - foreground.a),
        g: foreground.g * foreground.a + background.g * (1 - foreground.a),
        b: foreground.b * foreground.a + background.b * (1 - foreground.a),
        a: 1,
      };
    }
    function luminance(color) {
      const channels = [color.r, color.g, color.b].map((value) => {
        const channel = value / 255;
        return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
      });
      return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
    }
    function effectiveBackground(element) {
      const layers = [];
      for (let current = element; current; current = current.parentElement) {
        layers.push(rgba(getComputedStyle(current).backgroundColor));
      }
      let result = { r: 255, g: 255, b: 255, a: 1 };
      layers.reverse().forEach((layer) => { result = composite(layer, result); });
      return result;
    }
    const foreground = document.querySelector(foregroundSelector);
    const background = document.querySelector(backgroundSelector);
    const backgroundColor = effectiveBackground(background);
    const textColor = composite(rgba(getComputedStyle(foreground)[colorProperty]), backgroundColor);
    const low = Math.min(luminance(textColor), luminance(backgroundColor));
    const high = Math.max(luminance(textColor), luminance(backgroundColor));
    return (high + 0.05) / (low + 0.05);
  }, { foregroundSelector, backgroundSelector, colorProperty });
}

test("local generation, TXT reopen, history, favorite, copy and share stay private", async ({ page }) => {
  const observed = { errors: [], external: [], writes: [] };
  await guard(page, observed);
  await open(page);
  await expect(page.locator("#aiGenerateConsent")).not.toBeChecked();
  await page.locator("#topicInput").fill("uzinduzi wa sabuni ya asili");
  await page.locator("#generateBtn").click();
  await expect(page.locator("#writeOutput .ccr-output-card")).toHaveCount(3);
  await expect(page.locator("#writeOutput")).toContainText("Toleo lililo wazi");
  await expect(page.locator("#writeOutput")).toContainText("Hifadhi chapisho hili");

  await page.locator('[data-action="copy"]').first().click();
  await expect.poll(() => page.evaluate(() => window.__copiedCaption)).toContain("uzinduzi wa sabuni ya asili");
  await page.locator('[data-action="share"]').first().click();
  await expect.poll(() => page.evaluate(() => window.__sharedCaption && window.__sharedCaption.text)).toContain("uzinduzi wa sabuni ya asili");

  await page.locator('[data-action="favorite"]').first().click();
  await page.locator('.ccr-topbar-v2-tab[data-tab="favorites"]').click();
  await expect(page.locator("#favList .ccr-fav-card")).toHaveCount(1);
  await expect(page.locator("#favList")).toContainText("uzinduzi wa sabuni ya asili");
  await page.locator("#favSearchInput").fill("sabuni");
  await expect(page.locator("#favList .ccr-fav-card")).toBeVisible();
  await page.evaluate(() => { window.__copiedCaption = null; window.__sharedCaption = null; });
  await page.locator('[data-action="fav-copy"]').click();
  await expect.poll(() => page.evaluate(() => window.__copiedCaption)).toContain("uzinduzi wa sabuni ya asili");
  await page.locator('[data-action="fav-share"]').click();
  await expect.poll(() => page.evaluate(() => window.__sharedCaption && window.__sharedCaption.text)).toContain("uzinduzi wa sabuni ya asili");
  await expect(page.locator(".ccr-fav-remove")).toHaveAttribute("aria-label", "Ondoa kipendwa");
  await page.locator(".ccr-fav-remove").click();
  await expect(page.locator("#favList .ccr-fav-card")).toHaveCount(0);
  await expect(page.locator("#favList")).toContainText("Hakuna kipendwa bado");
  await page.locator('.ccr-topbar-v2-tab[data-tab="history"]').click();
  await expect(page.locator("#historyList .ccr-history-item")).toHaveCount(1);
  await expect(page.locator("#historyList .ccr-history-tone")).toHaveText("Ya kawaida");
  await expect(page.locator("#historyList .ccr-history-time")).toHaveText("Sasa hivi");
  await page.locator("#historyList .ccr-history-item").focus();
  await page.locator("#historyList .ccr-history-item").press("Enter");
  await expect(page.locator("#topicInput")).toHaveValue("uzinduzi wa sabuni ya asili");

  await page.locator('[data-action="compare"]').nth(0).click();
  await page.locator('[data-action="compare"]').nth(1).click();
  await expect(page.locator("#compareRunBtn")).toBeVisible();
  await page.locator("#compareRunBtn").click();
  await expect(page.locator("#compareGrid .ccr-compare-col")).toHaveCount(2);
  await page.locator("#compareClearBtn").click();
  await expect(page.locator("#compareView")).toBeHidden();

  const text = await downloadText(page);
  expect(text).toContain("Pakua CaptionCraft - Instagram");
  expect(text).toContain("Imetengenezwa:");
  expect(text).toContain("uzinduzi wa sabuni ya asili");
  expect(text).toContain("Herufi:");
  expect((text.match(/^--- .+ ---$/gm) || [])).toHaveLength(3);
  expect(observed).toEqual({ errors: [], external: [], writes: [] });
});

test("invalid input and local rewrite fail safely without network egress", async ({ page }) => {
  const observed = { errors: [], external: [], writes: [] };
  await guard(page, observed);
  await open(page);
  await page.locator("#generateBtn").click();
  await expect(page.locator("#writeOutput .ccr-output-card")).toHaveCount(0);
  await expect(page.locator("#toast")).toContainText("Eleza chapisho lako kwanza");
  await page.locator('.ccr-topbar-v2-tab[data-tab="rewrite"]').click();
  await page.locator("#rewriteInput").fill("Ushirika wetu unafungua duka jipya Jumamosi.");
  await page.locator("#rewriteBtn").click();
  await expect(page.locator("#rewriteOutput .ccr-output-card")).toHaveCount(3);
  await expect(page.locator("#rewriteOutput")).toContainText("Una maoni gani");
  expect(observed).toEqual({ errors: [], external: [], writes: [] });
});

test("AI transport is fail-closed until the exact consent box is selected", async ({ page }) => {
  const observed = { errors: [], external: [], writes: [] };
  await guard(page, observed);
  const requests = [];
  await page.route("**/.netlify/functions/creator-captions/generate", async (route) => {
    requests.push(route.request().postDataJSON());
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ output: JSON.stringify({ captions: [
        { variation: 1, label: "AI 1", text: "Caption ya AI 1", charCount: 15, withinLimit: true, hashtags: [], cta: "", firstLinePreview: "Caption ya AI 1" },
        { variation: 2, label: "AI 2", text: "Caption ya AI 2", charCount: 15, withinLimit: true, hashtags: [], cta: "", firstLinePreview: "Caption ya AI 2" },
        { variation: 3, label: "AI 3", text: "Caption ya AI 3", charCount: 15, withinLimit: true, hashtags: [], cta: "", firstLinePreview: "Caption ya AI 3" }
      ], platformTip: "Hakiki kabla ya kuchapisha." }) })
    });
  });
  await open(page);
  await page.locator("#topicInput").fill("tangazo lenye ridhaa");
  await page.locator("#generateBtn").click();
  expect(requests).toHaveLength(0);
  await page.locator("#aiGenerateConsent").check();
  await page.locator("#generateBtn").click();
  await expect.poll(() => requests.length).toBe(1);
  expect(requests[0].brief).toBe("tangazo lenye ridhaa");
  expect(requests[0].platform).toBe("instagram");
  expect(requests[0].prompt).toContain("Write the captions in Swahili");
  expect(observed.external).toEqual([]);
  expect(observed.errors).toEqual([]);
  expect(observed.writes).toHaveLength(1);
});

test("AI failure leaves the deterministic local fallback usable without another write", async ({ page }) => {
  const observed = { errors: [], external: [], writes: [] };
  await guard(page, observed);
  await page.route("**/.netlify/functions/creator-captions/generate", (route) => route.fulfill({
    status: 503,
    contentType: "application/json",
    body: JSON.stringify({ error: "Huduma haipatikani" }),
  }));
  await open(page);
  await page.locator("#topicInput").fill("mpango wa soko wa ndani");
  await page.locator("#aiGenerateConsent").check();
  await page.locator("#generateBtn").click();
  await expect(page.locator("#writeOutput")).toContainText("Huduma haipatikani");
  expect(observed.writes).toHaveLength(1);
  await page.locator("#aiGenerateConsent").uncheck();
  await page.locator("#generateBtn").click();
  await expect(page.locator("#writeOutput .ccr-output-card")).toHaveCount(3);
  await expect(page.locator("#writeOutput")).toContainText("mpango wa soko wa ndani");
  expect(observed.writes).toHaveLength(1);
  expect(observed.external).toEqual([]);
  expect(page.url()).not.toContain("mpango");
});

test("metadata, artwork, mobile, 200% reflow, themes and keyboard semantics", async ({ page }) => {
  const observed = { errors: [], external: [], writes: [] };
  await guard(page, observed);
  await page.emulateMedia({ colorScheme: "dark" });
  await page.setViewportSize({ width: 375, height: 900 });
  await open(page);
  const visibleText = await page.locator("body").innerText();
  expect(visibleText).not.toMatch(/Guest mode|Write New|No history yet|No favorites yet|Generate Captions|Optional AI assist|Export All|\bCopy\b|\bShare\b|\bSave\b/);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", "https://afrotools.com/sw/zana/caption-za-maudhui/app");
  await expect(page.locator('link[hreflang="en"]')).toHaveAttribute("href", "https://afrotools.com/tools/creator-captions/app");
  await expect(page.locator('link[hreflang="fr"]')).toHaveAttribute("href", "https://afrotools.com/fr/tools/legendes-createur/app");
  const schema = JSON.parse(await page.locator('script[type="application/ld+json"]').textContent());
  expect(schema.inLanguage).toBe("sw");
  expect((await page.request.get("/assets/img/tools/creator-captions.webp")).ok()).toBeTruthy();
  await expectNoOverflow(page);
  await page.setViewportSize({ width: 320, height: 900 });
  await expectNoOverflow(page);
  await page.setViewportSize({ width: 640, height: 900 });
  await page.evaluate(() => { document.body.style.zoom = "2"; });
  await expectNoOverflow(page);
  await page.evaluate(() => { document.body.style.zoom = ""; });
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  expect(await contrastRatio(page, ".ccr-sidebar-section-title", ".ccr-sidebar")).toBeGreaterThanOrEqual(4.5);
  const darkBorder = await page.evaluate(() => ({
    border: getComputedStyle(document.querySelector("#topicInput")).borderTopColor,
    sidebar: getComputedStyle(document.querySelector(".ccr-sidebar")).backgroundColor,
    body: getComputedStyle(document.body).backgroundColor,
    swOwner: document.body.hasAttribute("data-sw-creator-captions"),
  }));
  expect(await contrastRatio(page, "#topicInput", ".ccr-sidebar", "borderTopColor"), JSON.stringify(darkBorder)).toBeGreaterThanOrEqual(3);
  await page.locator("#topicInput").focus();
  expect(await contrastRatio(page, "#topicInput", ".ccr-sidebar", "outlineColor")).toBeGreaterThanOrEqual(3);
  await page.evaluate(() => { localStorage.setItem("aft_theme", "light"); location.reload(); });
  await page.waitForLoadState("domcontentloaded");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  expect(await contrastRatio(page, ".ccr-sidebar-section-title", ".ccr-sidebar")).toBeGreaterThanOrEqual(4.5);
  expect(await contrastRatio(page, "#topicInput", ".ccr-sidebar", "borderTopColor")).toBeGreaterThanOrEqual(3);
  await page.locator("#topicInput").focus();
  expect(await contrastRatio(page, "#topicInput", ".ccr-sidebar", "outlineColor")).toBeGreaterThanOrEqual(3);
  const activePill = page.locator("#platformPills .ccr-pill-v2.active");
  await expect(activePill).toHaveAttribute("role", "radio");
  await expect(activePill).toHaveAttribute("tabindex", "0");
  await activePill.focus();
  await expect(activePill).toBeFocused();
  await page.locator('#platformPills .ccr-pill-v2[data-val="x"]').evaluate((node) => node.focus());
  await page.locator('#platformPills .ccr-pill-v2[data-val="x"]').press("Space");
  await expect(page.locator('#platformPills .ccr-pill-v2[data-val="x"]')).toHaveAttribute("aria-checked", "true");
  await expect(page.locator("#aiGenerateConsent")).not.toBeChecked();
  expect(observed).toEqual({ errors: [], external: [], writes: [] });
});

test("landing page discovers the full workspace at 320px", async ({ page }) => {
  const observed = { errors: [], external: [], writes: [] };
  await guard(page, observed);
  await page.setViewportSize({ width: 320, height: 900 });
  await page.goto("/sw/zana/caption-za-maudhui/", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("link", { name: "Fungua sehemu kamili ya caption" })).toHaveAttribute("href", "/sw/zana/caption-za-maudhui/app");
  await expectNoOverflow(page);
  expect(observed.errors).toEqual([]);
});
