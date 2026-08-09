const { test, expect } = require("@playwright/test");

const route = "/sw/zana/bei-za-mtayarishi/";

test.describe.configure({ mode: "serial" });

test("native benchmark, invalid/reset, and parsed JSON/TXT exports", async ({ page }) => {
  const external = [];
  const errors = [];
  page.on("request", (request) => {
    const url = new URL(request.url());
    if (!['127.0.0.1', 'localhost'].includes(url.hostname)) external.push(request.url());
  });
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
  await page.goto(route);
  await expect(page.locator("html")).toHaveAttribute("lang", "sw");
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", "https://afrotools.com/sw/zana/bei-za-mtayarishi/");
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute("content", "https://afrotools.com/assets/img/tools/creator-pricing.webp");
  expect(await page.locator('script[type="application/ld+json"]').first().textContent()).toContain("WebApplication");

  await page.selectOption("#cp-craft", "photography");
  await page.selectOption("#cp-specialty", "Wedding");
  await page.selectOption("#cp-country", "TZ");
  await page.selectOption("#cp-city", "Dar es Salaam");
  await page.selectOption("#cp-experience", "established");
  await page.locator('[data-creator-pricing] form button[type="submit"]').click();
  await expect(page.locator("[data-status]")).toContainText("Makadirio yamekokotolewa");
  await expect(page.locator("[data-metrics]")).toContainText("TZS");

  const jsonPromise = page.waitForEvent("download");
  await page.locator("[data-json]").click();
  const jsonDownload = await jsonPromise;
  const json = JSON.parse(await require("fs").promises.readFile(await jsonDownload.path(), "utf8"));
  expect(json.tool).toBe("creator-pricing");
  expect(json.locale).toBe("sw");
  expect(json.input.country).toBe("TZ");
  expect(json.rate.daily.median).toBe(510000);
  expect(json.breakdown).toHaveLength(5);

  const txtPromise = page.waitForEvent("download");
  await page.locator("[data-txt]").click();
  const txtDownload = await txtPromise;
  const txt = await require("fs").promises.readFile(await txtDownload.path(), "utf8");
  expect(txt).toContain("Makadirio ya bei ya mtayarishi");
  expect(txt).toContain("Soko: Tanzania");

  await page.locator("#cp-country").evaluate((node) => { node.innerHTML += '<option value="">—</option>'; node.value = ""; });
  await page.locator('[data-creator-pricing] form button[type="submit"]').click();
  await expect(page.locator("[data-status]")).toContainText("Chagua aina ya kazi na soko halali");
  await expect(page.locator("[data-results]")).toBeHidden();
  await page.locator("[data-reset]").click();
  await expect(page.locator("#cp-country")).toHaveValue("TZ");
  await expect(page.locator("[data-status]")).toContainText("imerudishwa");
  expect(external).toEqual([]);
  expect(errors).toEqual([]);
});

test("preserved manual quotation and workspace TXT reopen", async ({ page }) => {
  await page.goto(route);
  await page.fill("#quote-hours", "10");
  await page.fill("#quote-hourly", "100");
  await page.fill("#quote-costs", "200");
  await page.fill("#quote-revisions", "2");
  await page.fill("#quote-margin", "20");
  await page.selectOption("#quote-usage", "paid");
  await page.selectOption("#quote-currency", "KES");
  await page.locator("[data-quote-calculate]").click();
  await expect(page.locator("[data-quote-results]")).toContainText("Ksh");
  await expect(page.locator("[data-quote-status]")).toContainText("imekokotolewa");
  await page.fill("#creatorBriefText", "Kampeni ya elimu ya kifedha kwa vijana wa Afrika Mashariki.");

  const downloadPromise = page.waitForEvent("download");
  await page.locator("#creatorDownloadPlan").click();
  const download = await downloadPromise;
  const reopened = await require("fs").promises.readFile(await download.path(), "utf8");
  expect(reopened).toContain("Mpango wa bei ya mtayarishi");
  expect(reopened).toContain("Kampeni ya elimu ya kifedha");
  expect(reopened).toContain('"recommended": 2340');

  await page.fill("#quote-hourly", "0");
  await page.locator("[data-quote-calculate]").click();
  await expect(page.locator("[data-quote-status]")).toContainText("juu ya sifuri");
  await page.locator("[data-quote-reset]").click();
  await expect(page.locator("#quote-hours")).toHaveValue("8");
});

for (const entry of [{ width: 320, zoom: 1 }, { width: 375, zoom: 1 }, { width: 640, zoom: 2 }]) {
  test(`mobile and 200 percent reflow, theme and keyboard at ${entry.width}px ${entry.zoom}x`, async ({ page }) => {
    await page.setViewportSize({ width: entry.width, height: 900 });
    await page.emulateMedia({ colorScheme: "dark", reducedMotion: "reduce" });
    await page.goto(route);
    if (entry.zoom > 1) await page.evaluate((zoom) => { document.documentElement.style.zoom = String(zoom); }, entry.zoom);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(2);
    for (const id of ["cp-craft", "cp-specialty", "cp-country", "cp-city", "cp-experience", "cp-currency", "quote-hours", "creatorBriefText"]) {
      await expect(page.locator(`#${id}`)).toHaveAccessibleName(/.+/);
    }
    await page.locator("#cp-craft").focus();
    await expect(page.locator("#cp-craft")).toBeFocused();
    expect(await page.locator("#cp-craft").evaluate((node) => getComputedStyle(node).outlineStyle)).not.toBe("none");
    await page.evaluate(() => { document.documentElement.dataset.theme = "dark"; document.documentElement.dataset.themeChoice = "dark"; document.documentElement.classList.remove("theme-light"); document.documentElement.classList.add("theme-dark"); });
    const darkBackground = await page.locator(".cf-card").first().evaluate((node) => getComputedStyle(node).backgroundColor);
    await page.keyboard.press("Tab");
    expect(await page.evaluate(() => document.activeElement && document.activeElement.tagName !== "BODY")).toBe(true);
    await page.evaluate(() => { document.documentElement.dataset.theme = "light"; document.documentElement.dataset.themeChoice = "light"; document.documentElement.classList.remove("theme-dark"); document.documentElement.classList.add("theme-light"); });
    const lightBackground = await page.locator(".cf-card").first().evaluate((node) => getComputedStyle(node).backgroundColor);
    expect(lightBackground).not.toBe(darkBackground);
    await expect(page.locator("h1")).toBeVisible();
  });
}
