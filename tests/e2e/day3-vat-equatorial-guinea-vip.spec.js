const { test, expect } = require("@playwright/test");
const fs = require("node:fs");

const pages = [
  { path: "/eq-guinea/gq-vat", lang: "en", heading: /Equatorial Guinea IVA/i },
  { path: "/fr/eq-guinea/gq-vat/", lang: "fr", heading: /TVA Guinée équatoriale/i },
  { path: "/sw/equatorial-guinea/kikokotoo-vat/", lang: "sw", heading: /VAT ya Guinea ya Ikweta/i },
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
    await expect(page.locator("#gqvMain")).toContainText(/115[\s,.]?000/);
    expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1)).toBe(false);
    expect(errors).toEqual([]);
  });
}

test("375px and 768px layouts stay overflow-free", async ({ page }) => {
  for (const width of [375, 768]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/eq-guinea/gq-vat");
    expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1)).toBe(false);
  }
});

test("special rates fail closed and require exact evidence", async ({ page }) => {
  await page.goto("/eq-guinea/gq-vat");
  await page.getByRole("button", { name: /Confirmed Article 13 import: 5%/i }).click();
  await expect(page.locator("#gqvError")).toContainText(/Confirm the exact Article 13 product line/i);
  await page.locator("#gqvEvidence").check();
  await expect(page.locator("#gqvMain")).toContainText(/105[\s,.]?000/);
  await expect(page.locator("#gqvRate")).toHaveText("5%");
});

test("dark theme, reduced motion and 200% text remain usable", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "dark", reducedMotion: "reduce" });
  await page.setViewportSize({ width: 640, height: 900 });
  await page.goto("/eq-guinea/gq-vat");
  await page.addStyleTag({ content: "html{font-size:200%!important}" });
  const card = await page.locator(".gqv-card").first().evaluate((element) => ({ bg: getComputedStyle(element).backgroundColor, color: getComputedStyle(element).color }));
  expect(card.bg).not.toBe("rgb(255, 255, 255)");
  expect(card.color).not.toBe(card.bg);
  expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1)).toBe(false);
  expect(await page.locator(".gqv-button").first().evaluate((element) => getComputedStyle(element).transitionDuration)).toBe("0s");
  await page.screenshot({ path: "artifacts/equatorial-guinea-vat-mobile-dark-200.png", fullPage: true });
});

test("amounts stay out of network, URL and browser storage", async ({ page }) => {
  const posts = [];
  page.on("request", (request) => { if (request.method() !== "GET") posts.push({ method: request.method(), url: request.url(), body: request.postData() }); });
  await page.goto("/eq-guinea/gq-vat");
  await page.locator("#gqvAmount").fill("987654");
  await page.getByRole("button", { name: "Calculate" }).click();
  const persisted = await page.evaluate(() => ({ local: Object.keys(localStorage).filter((key) => /gqv|gq-vat/i.test(key)), session: Object.keys(sessionStorage).filter((key) => /gqv|gq-vat/i.test(key)), url: location.href }));
  expect(posts).toEqual([]);
  expect(persisted.local).toEqual([]);
  expect(persisted.session).toEqual([]);
  expect(persisted.url).not.toContain("987654");
});

test("keyboard focus, visible labels, desktop visual and local PDF work", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/eq-guinea/gq-vat");
  await expect(page.locator('label[for="gqvAmount"]')).toBeVisible();
  await page.screenshot({ path: "artifacts/equatorial-guinea-vat-desktop.png", fullPage: true });
  await page.keyboard.press("Tab");
  await expect(page.locator(".gqv-skip")).toBeFocused();
  const downloadPromise = page.waitForEvent("download");
  await page.locator("#gqvPdf").click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe("equatorial-guinea-iva-estimate.pdf");
  expect(fs.statSync(await download.path()).size).toBeGreaterThan(1000);
});
