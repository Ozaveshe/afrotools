const { test, expect } = require("@playwright/test");
const fs = require("node:fs");
const pdfParse = require("pdf-parse");

const routes = [
  { url: "/tools/market-stall-profit/", button: /calculate daily profit/i },
  { url: "/fr/tools/profit-stand-marche/", button: /calculer le profit journalier/i },
  { url: "/sw/zana/faida-ya-kibanda-sokoni/", button: /kokotoa faida ya siku/i }
];

async function fill(page, name = "Tomatoes") {
  await page.locator(".js-name").first().fill(name);
  await page.locator(".js-cost").first().fill("50");
  await page.locator(".js-price").first().fill("80");
  await page.locator(".js-sold").first().fill("10");
  await page.locator(".js-lost").first().fill("2");
  await page.locator(".js-expense-amount").first().fill("100");
  await page.locator(".js-expense-amount").nth(1).fill("50");
}

for (const route of routes) {
  test(`${route.url} calculates safely on mobile`, async ({ page }) => {
    const errors = [];
    page.on("pageerror", error => errors.push(error.message));
    page.on("dialog", dialog => { errors.push("dialog:" + dialog.message()); dialog.dismiss(); });
    await page.setViewportSize({ width: 320, height: 760 });
    await page.goto(route.url, { waitUntil: "domcontentloaded" });
    await expect(page.locator("html")).toHaveAttribute("lang", /en|fr|sw/);
    expect(await page.evaluate(() => localStorage.getItem("afrotools:market-stall-profit:history:v1"))).toBeNull();
    await fill(page, '<img src=x onerror="alert(1)"> Tomatoes');
    await page.getByRole("button", { name: route.button }).click();
    await expect(page.locator("[data-results]")).toBeVisible();
    await expect(page.locator("[data-results]")).toContainText(/50/);
    await expect(page.locator("[data-results] img")).toHaveCount(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)).toBe(true);
    expect(errors).toEqual([]);
    await page.locator(".js-sold").first().fill("11");
    await expect(page.locator("[data-results]")).toBeHidden();
  });
}

test("history is opt-in, currency-isolated and survives corrupt storage", async ({ page }) => {
  await page.goto("/tools/market-stall-profit/");
  await page.evaluate(() => localStorage.setItem("afrotools:market-stall-profit:history:v1", "{broken"));
  await page.getByRole("button", { name: /load local history/i }).click();
  await expect(page.locator("[data-status]")).toContainText(/could not be read/i);
  await page.evaluate(() => localStorage.removeItem("afrotools:market-stall-profit:history:v1"));
  await fill(page);
  await page.getByRole("button", { name: /calculate daily profit/i }).click();
  await page.getByRole("button", { name: /save locally/i }).click();
  await expect(page.locator("[data-history]")).toContainText("KES");
  await page.locator(".js-currency").fill("GHS");
  await page.getByRole("button", { name: /load local history/i }).click();
  await expect(page.locator("[data-history]")).toContainText(/no saved results/i);
});

test("CSV, JSON and PDF exports preserve formulas and scope", async ({ page }) => {
  await page.goto("/tools/market-stall-profit/");
  await fill(page, "=CMD");
  await page.getByRole("button", { name: /calculate daily profit/i }).click();

  let pending = page.waitForEvent("download");
  await page.getByRole("button", { name: /download csv/i }).click();
  const csv = fs.readFileSync(await (await pending).path(), "utf8");
  expect(csv).toContain("'=CMD");
  expect(csv).toContain("Engine version");
  expect(csv).toContain("net daily profit = revenue - sold-stock cost");

  pending = page.waitForEvent("download");
  await page.getByRole("button", { name: /download json/i }).click();
  const json = JSON.parse(fs.readFileSync(await (await pending).path(), "utf8"));
  expect(json.engineVersion).toBe("market-stall-profit-2026-07-23");
  expect(json.formulas.breakEvenRevenue).toContain("contribution ratio");
  expect(json.assumptions.currencyDisplayOnly).toBe(true);

  pending = page.waitForEvent("download");
  await page.getByRole("button", { name: /download pdf/i }).click();
  const parsed = await pdfParse(fs.readFileSync(await (await pending).path()));
  expect(parsed.text).toContain("Market Stall Daily Profit Planner");
  expect(parsed.text).toMatch(/display\s+currency only/);
  expect(parsed.text).toContain("net daily profit = revenue");
});

test("200 percent zoom equivalent and dark mode remain contained", async ({ page }) => {
  await page.setViewportSize({ width: 188, height: 800 });
  await page.emulateMedia({ colorScheme: "dark", reducedMotion: "reduce" });
  await page.goto("/tools/market-stall-profit/");
  await page.evaluate(() => { document.documentElement.dataset.theme = "dark"; });
  const overflowing = await page.evaluate(() => Array.from(document.querySelectorAll("*")).map(element => {
    const rect = element.getBoundingClientRect();
    return { tag: element.tagName, cls: element.className || "", left: rect.left, right: rect.right, width: rect.width };
  }).filter(item => item.left < -1 || item.right > document.documentElement.clientWidth + 1).slice(0, 12));
  expect(overflowing).toEqual([]);
});

for (const viewport of [
  { width: 320, dark: true, url: "/sw/zana/faida-ya-kibanda-sokoni/", button: /kokotoa faida ya siku/i, locale: "sw" },
  { width: 375, dark: true, url: "/tools/market-stall-profit/", button: /calculate daily profit/i, locale: "en" },
  { width: 768, dark: false, url: "/fr/tools/profit-stand-marche/", button: /calculer le profit journalier/i, locale: "fr" }
]) {
  test(`site assistant cannot intersect ${viewport.locale} result or history surfaces at ${viewport.width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width: viewport.width, height: 900 });
    await page.emulateMedia({ colorScheme: viewport.dark ? "dark" : "light" });
    await page.goto(viewport.url);
    await page.evaluate(dark => { document.documentElement.dataset.theme = dark ? "dark" : "light"; }, viewport.dark);
    await fill(page);
    await page.getByRole("button", { name: viewport.button }).click();
    await expect(page.locator("[data-results]")).toBeVisible();
    await expect(page.locator("body")).toHaveClass(/msp-has-result/);

    const geometry = await page.evaluate(() => {
      const assistant = document.querySelector("afro-site-assistant");
      const targets = Array.from(document.querySelectorAll(
        ".msp-metric,.msp-table-wrap,[data-results] .msp-actions .msp-button,.msp-history .msp-actions .msp-button"
      ));
      const assistantRect = assistant ? assistant.getBoundingClientRect() : null;
      const assistantVisible = Boolean(assistant && assistantRect.width > 0 && assistantRect.height > 0 &&
        getComputedStyle(assistant).display !== "none" && getComputedStyle(assistant).visibility !== "hidden");
      const intersects = (a, b) => a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
      return {
        assistantPresent: Boolean(assistant),
        assistantVisible,
        targetCount: targets.length,
        overlaps: targets.map((target, index) => ({
          index,
          className: target.className,
          intersects: assistantVisible && intersects(assistantRect, target.getBoundingClientRect())
        })).filter(item => item.intersects)
      };
    });
    expect(geometry.targetCount).toBeGreaterThanOrEqual(22);
    expect(geometry.overlaps).toEqual([]);
    if (geometry.assistantPresent) expect(geometry.assistantVisible).toBe(false);

    const capture = testInfo.outputPath(`market-stall-${viewport.locale}-${viewport.width}-${viewport.dark ? "dark" : "light"}.png`);
    await page.screenshot({ path: capture, fullPage: true });
    await testInfo.attach("result-state capture", { path: capture, contentType: "image/png" });
  });
}
