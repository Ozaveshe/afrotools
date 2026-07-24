const { test, expect } = require("@playwright/test");
const fs = require("node:fs");

const pages = [
  { path: "/eritrea/er-vat", lang: "en", heading: /Eritrea sales tax/i },
  { path: "/fr/eritrea/er-vat", lang: "fr", heading: /taxe sur les ventes en Érythrée/i },
  { path: "/sw/eritrea/kikokotoo-vat/", lang: "sw", heading: /Kodi ya mauzo Eritrea/i },
];

for (const item of pages) {
  test(item.lang + " canonical route fails closed then calculates at 320px", async ({ page }) => {
    const errors = [];
    const posted = [];
    page.on("console", message => { if (message.type() === "error") errors.push(message.text()); });
    page.on("pageerror", error => errors.push(error.message));
    page.on("request", request => { if (request.method() === "POST") posted.push(request.url()); });
    await page.setViewportSize({ width: 320, height: 800 });
    await page.goto(item.path);
    await expect(page.locator("html")).toHaveAttribute("lang", item.lang);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(item.heading);
    await expect(page.locator("#ervResult")).not.toHaveClass(/on/);
    await page.locator("#ervEvidence").check();
    await expect(page.locator("#ervMain")).toContainText(/10[,.\s]?500/);
    await expect(page.locator("#ervRate")).toHaveText("5%");
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
    expect(overflow).toBe(false);
    expect(posted).toEqual([]);
    expect(errors).toEqual([]);
  });
}

for (const width of [375, 768]) {
  test("responsive and reduced-motion check at " + width + "px", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/eritrea/er-vat");
    expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1)).toBe(false);
    const transition = await page.locator(".erv-button").first().evaluate(element => getComputedStyle(element).transitionDuration);
    expect(transition).toBe("0s");
  });
}

test("dark 200% view remains usable and private", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "dark", reducedMotion: "reduce" });
  await page.setViewportSize({ width: 640, height: 900 });
  await page.goto("/eritrea/er-vat");
  await page.addStyleTag({ content: "html{font-size:200%!important}" });
  const colors = await page.locator(".erv-card").first().evaluate(element => ({ bg: getComputedStyle(element).backgroundColor, color: getComputedStyle(element).color }));
  expect(colors.bg).not.toBe("rgb(255, 255, 255)");
  expect(colors.bg).not.toBe(colors.color);
  expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1)).toBe(false);
  expect(await page.evaluate(() => ({ local: Object.keys(localStorage).filter(key => /erv|er-vat/i.test(key)), session: Object.keys(sessionStorage).filter(key => /erv|er-vat/i.test(key)), url: location.href }))).toEqual({ local: [], session: [], url: "http://127.0.0.1:4173/eritrea/er-vat" });
  await page.screenshot({ path: "artifacts/eritrea-sales-tax-mobile-dark-200.png", fullPage: true });
});

test("local PDF contains a production-shaped result", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 900 });
  await page.goto("/eritrea/er-vat");
  await page.locator("#ervEvidence").check();
  const downloadPromise = page.waitForEvent("download");
  await page.locator("#ervPdf").click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe("eritrea-sales-tax-reference.pdf");
  const path = await download.path();
  expect(fs.statSync(path).size).toBeGreaterThan(1000);
  await page.screenshot({ path: "artifacts/eritrea-sales-tax-375.png", fullPage: true });
});
