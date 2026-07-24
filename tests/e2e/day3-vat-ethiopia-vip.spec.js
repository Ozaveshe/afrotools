const { test, expect } = require("@playwright/test");
const fs = require("node:fs");

const pages = [
  { path: "/ethiopia/et-vat", lang: "en", heading: /Ethiopia VAT with official/i },
  { path: "/fr/ethiopia/et-vat", lang: "fr", heading: /TVA en Éthiopie/i },
  { path: "/sw/ethiopia/kikokotoo-vat/", lang: "sw", heading: /VAT ya Ethiopia/i },
];

for (const item of pages) {
  test(item.lang + " calculator holds at 320px", async ({ page }) => {
    const errors = [];
    page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
    page.on("pageerror", (error) => errors.push(error.message));
    await page.setViewportSize({ width: 320, height: 800 });
    await page.goto(item.path);
    await expect(page.locator("html")).toHaveAttribute("lang", item.lang);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(item.heading);
    await expect(page.locator("#etvMain")).toContainText(/11[\s,.]?500/);
    expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1)).toBe(false);
    expect(errors).toEqual([]);
  });
}

test("375px, 768px and zero-rate failure paths stay usable", async ({ page }) => {
  for (const width of [375, 768]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/ethiopia/et-vat");
    expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1)).toBe(false);
  }
  await page.getByRole("button", { name: /Confirmed Schedule 1: 0%/i }).click();
  await expect(page.locator("#etvError")).toContainText(/Confirm the exact Schedule 1 match/i);
  await page.locator("#etvEvidence").check();
  await expect(page.locator("#etvMain")).toContainText(/10[\s,.]?000/);
  await expect(page.locator("#etvRate")).toHaveText("0%");
});

test("dark theme, reduced motion and 200% text remain usable", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "dark", reducedMotion: "reduce" });
  await page.setViewportSize({ width: 640, height: 900 });
  await page.goto("/ethiopia/et-vat");
  await page.addStyleTag({ content: "html{font-size:200%!important}" });
  const card = await page.locator(".etv-card").first().evaluate((element) => ({ bg: getComputedStyle(element).backgroundColor, color: getComputedStyle(element).color }));
  expect(card.bg).not.toBe("rgb(255, 255, 255)");
  expect(card.color).not.toBe(card.bg);
  expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1)).toBe(false);
  expect(await page.locator(".etv-button").first().evaluate((element) => getComputedStyle(element).transitionDuration)).toBe("0s");
  await page.screenshot({ path: "artifacts/ethiopia-vat-mobile-dark-200.png", fullPage: true });
});

test("amounts stay out of network, URL and browser storage", async ({ page }) => {
  const posts = [];
  page.on("request", (request) => { if (request.method() !== "GET") posts.push({ method: request.method(), url: request.url(), body: request.postData() }); });
  await page.goto("/ethiopia/et-vat");
  await page.locator("#etvAmount").fill("987654.32");
  await page.getByRole("button", { name: "Calculate" }).click();
  const persisted = await page.evaluate(() => ({ local: Object.keys(localStorage).filter((key) => /etv|et-vat/i.test(key)), session: Object.keys(sessionStorage).filter((key) => /etv|et-vat/i.test(key)), url: location.href }));
  expect(posts).toEqual([]);
  expect(persisted.local).toEqual([]);
  expect(persisted.session).toEqual([]);
  expect(persisted.url).not.toContain("987654");
});

test("labels, keyboard focus, desktop visual and local PDF work", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/ethiopia/et-vat");
  await expect(page.locator('label[for="etvAmount"]')).toBeVisible();
  await page.screenshot({ path: "artifacts/ethiopia-vat-desktop.png", fullPage: true });
  await page.keyboard.press("Tab");
  await expect(page.locator(".etv-skip")).toBeFocused();
  const downloadPromise = page.waitForEvent("download");
  await page.locator("#etvPdf").click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe("ethiopia-vat-estimate.pdf");
  expect(fs.statSync(await download.path()).size).toBeGreaterThan(1000);
});

test("embed widget uses the same engine and avoids unsupported filing claims", async ({ page }) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.setViewportSize({ width: 320, height: 720 });
  await page.goto("/widgets/iframe/financial-ethiopia-vat.html");
  await expect(page.locator("[data-main]")).toContainText(/11[\s,.]?500/);
  await page.getByRole("button", { name: "Extract VAT" }).click();
  await page.locator("#etWidgetAmount").fill("11500");
  await expect(page.locator("[data-main]")).toContainText(/10[\s,.]?000/);
  await expect(page.locator("body")).not.toContainText(/500K|Filing: Monthly|Food, health/i);
  expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1)).toBe(false);
  expect(errors).toEqual([]);
});
