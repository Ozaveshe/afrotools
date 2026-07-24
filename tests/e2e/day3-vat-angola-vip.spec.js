const { test, expect } = require("@playwright/test");
const fs = require("fs");
const pdfParse = require("pdf-parse");

const routes = [
  { name: "en", path: "/angola/ao-vat", calc: "Calculate Angola VAT", pdf: "Angola", regime: "Simplified regime" },
  { name: "fr", path: "/fr/angola/ao-vat", calc: "Calculer la TVA Angola", pdf: "Angola", regime: "Régime simplifié" },
  { name: "sw", path: "/sw/angola/kikokotoo-vat/", calc: "Kokotoa VAT ya Angola", pdf: "Angola", regime: "Mfumo rahisi" },
];

for (const route of routes) test(`${route.name} Angola VAT VIP parity`, async ({ page }) => {
  const errors = [], nonGet = [], calculationNetwork = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
  page.on("request", (request) => {
    if (request.method() !== "GET") nonGet.push(`${request.method()} ${request.url()}`);
    if (/cdnjs\.cloudflare|chart(\.umd)?\.min|ai-advisor|\.netlify\/functions/i.test(request.url())) calculationNetwork.push(request.url());
  });
  await page.emulateMedia({ colorScheme: "dark", reducedMotion: "reduce" });
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto(route.path, { waitUntil: "networkidle" });
  await expect(page.locator("html")).toHaveAttribute("lang", route.name);
  await expect(page.getByRole("button", { name: route.calc })).toBeVisible();
  await expect(page.locator(".source-confidence-card")).toBeVisible();
  expect(await page.evaluate(() => window.AOVatApp.getResult())).toMatchObject({ net: 100000, vat: 14000, gross: 114000 });
  await page.locator('[data-mode="extract"]').click(); await page.locator("#aovAmount").fill("114000");
  expect(await page.evaluate(() => window.AOVatApp.getResult())).toMatchObject({ net: 100000, vat: 14000, gross: 114000 });
  await page.locator('[data-rate-kind="food"]').click(); await page.locator('[data-mode="add"]').click(); await page.locator("#aovAmount").fill("100000");
  expect(await page.evaluate(() => window.AOVatApp.getResult())).toMatchObject({ rate: 5, vat: 5000, gross: 105000 });
  await page.locator('[data-rate-kind="standard"]').click(); await page.locator("#aovInvoiceForm").evaluate((form) => form.requestSubmit());
  await expect(page.locator("#aovInvoiceVat")).toContainText("14");
  await page.locator("#aovRegimeForm").evaluate((form) => form.requestSubmit());
  await expect(page.locator("#aovRegimeResult")).toContainText(route.regime);
  await page.locator("#aovCaptive").selectOption("article21-2");
  await expect(page.locator("#aovCaptiveResult")).toContainText("50%");
  const download = page.waitForEvent("download"); await page.locator("#aovPdf").click();
  const parsed = await pdfParse(fs.readFileSync(await (await download).path()));
  expect(parsed.text).toContain(route.pdf); expect(parsed.text).toContain("100000.00"); expect(parsed.text).toContain("14000.00");
  expect(await page.evaluate(() => [...document.querySelectorAll("main *")].filter((element) => element.getBoundingClientRect().left < -1 || element.getBoundingClientRect().right > document.documentElement.clientWidth + 1).map((element) => `${element.tagName}.${typeof element.className === "string" ? element.className : ""}#${element.id}`))).toEqual([]);
  expect(await page.evaluate(() => Object.keys(localStorage).filter((key) => /aov|vat/i.test(key)))).toEqual([]);
  expect(nonGet).toEqual([]); expect(calculationNetwork).toEqual([]); expect(errors).toEqual([]);
  expect(await page.locator("main input, main select, main button").evaluateAll((controls) => controls.filter((control) => { const label = control.id ? document.querySelector(`label[for="${control.id}"]`) : null; return !(label || control.closest("label") || control.getAttribute("aria-label") || control.textContent.trim()); }).map((control) => control.id || control.outerHTML))).toEqual([]);
  await expect(page.locator("afro-site-assistant")).toBeHidden();
  await page.locator("afro-navbar").evaluate((element) => element.style.setProperty("display", "none", "important"));
  await page.screenshot({ path: `artifacts/angola-vat-${route.name}-375-dark.png`, fullPage: true });
});

test("Angola VAT English light and 200% text", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "light", reducedMotion: "reduce" });
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/angola/ao-vat", { waitUntil: "networkidle" });
  await page.locator("html").evaluate((element) => { element.style.fontSize = "200%"; });
  await expect(page.getByRole("button", { name: "Calculate Angola VAT" })).toBeVisible();
  expect(await page.evaluate(() => [...document.querySelectorAll("main *")].filter((element) => element.getBoundingClientRect().left < -1 || element.getBoundingClientRect().right > document.documentElement.clientWidth + 1).map((element) => `${element.tagName}.${typeof element.className === "string" ? element.className : ""}#${element.id}`))).toEqual([]);
  await page.locator("afro-navbar").evaluate((element) => element.style.setProperty("display", "none", "important"));
  await page.screenshot({ path: "artifacts/angola-vat-en-375-light-200pct.png", fullPage: true });
});

for (const width of [320, 360, 390]) test(`Angola VAT compact ${width}px`, async ({ page }) => {
  await page.emulateMedia({ colorScheme: "dark", reducedMotion: "reduce" });
  await page.setViewportSize({ width, height: 720 });
  await page.goto("/angola/ao-vat", { waitUntil: "networkidle" });
  await expect(page.getByRole("button", { name: "Calculate Angola VAT" })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);
});
