const { test, expect } = require("@playwright/test");
const fs = require("fs");
const pdfParse = require("pdf-parse");

const routes = [
  { lang: "en", path: "/cameroon/cm-vat", button: "Calculate Cameroon VAT", pdf: "Cameroon" },
  { lang: "fr", path: "/fr/cameroun/calculateur-tva", button: "Calculer la TVA Cameroun", pdf: "Cameroun" },
  { lang: "sw", path: "/sw/cameroon/kikokotoo-vat/", button: "Kokotoa VAT ya Kameruni", pdf: "Kameruni" },
];

for (const route of routes) {
  test(`${route.lang} Cameroon VAT VIP parity`, async ({ page }) => {
    const errors = [];
    const nonGet = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });
    page.on("request", (request) => {
      if (request.method() !== "GET") nonGet.push(`${request.method()} ${request.url()}`);
    });
    await page.emulateMedia({ colorScheme: "dark", reducedMotion: "reduce" });
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(route.path, { waitUntil: "networkidle" });
    await expect(page.locator("html")).toHaveAttribute("lang", route.lang);
    await expect(page.getByRole("button", { name: route.button })).toBeVisible();
    await expect(page.locator('[data-source-meta-id="vat-cm-source"]')).toBeVisible();
    expect(await page.evaluate(() => window.CMVatApp.getResult())).toMatchObject({ net: 10000, vat: 1925, gross: 11925 });
    await page.locator('[data-cmv-mode="extract"]').click();
    await page.locator("#cmvAmount").fill("11925");
    expect(await page.evaluate(() => window.CMVatApp.getResult())).toMatchObject({ net: 10000, vat: 1925, gross: 11925 });
    await page.locator('[data-cmv-rate="social-housing"]').click();
    await page.locator("#cmvAmount").fill("11000");
    expect(await page.evaluate(() => window.CMVatApp.getResult())).toMatchObject({ rate: 10, net: 10000, vat: 1000, gross: 11000 });
    await page.locator('[data-cmv-mode="add"]').click();
    await page.locator('[data-cmv-rate="standard"]').click();
    await page.locator("#cmvAmount").fill("10000");
    await page.locator("#cmvInvoiceForm").evaluate((form) => form.requestSubmit());
    await expect(page.locator("#cmvInvoiceVat")).not.toBeEmpty();
    await page.locator("#cmvTurnoverForm").evaluate((form) => form.requestSubmit());
    await expect(page.locator("#cmvTurnoverResult")).toContainText("50");
    await expect(page.locator("#cmvWithheld")).toContainText("0");
    await page.locator("#cmvAuthorizedBuyer").check();
    await expect(page.locator("#cmvWithheld")).not.toContainText(/^0/);
    const download = page.waitForEvent("download");
    await page.locator("#cmvPdf").click();
    const parsed = await pdfParse(fs.readFileSync(await (await download).path()));
    expect(parsed.text).toContain(route.pdf);
    expect(parsed.text).toContain("10000.00");
    expect(parsed.text).toContain("1925.00");
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);
    expect(await page.evaluate(() => Object.keys(localStorage).filter((key) => /cmv|cm-vat/i.test(key)))).toEqual([]);
    expect(nonGet).toEqual([]);
    expect(errors).toEqual([]);
  });
}

test("Cameroon VAT manual dark theme and compact widths", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "light", reducedMotion: "reduce" });
  for (const width of [320, 360, 390]) {
    await page.setViewportSize({ width, height: 720 });
    await page.goto("/cameroon/cm-vat", { waitUntil: "networkidle" });
    await page.locator("html").evaluate((element) => { element.dataset.theme = "dark"; });
    await expect(page.getByRole("button", { name: "Calculate Cameroon VAT" })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);
    const colors = await page.locator(".cmv-card").first().evaluate((element) => ({ background: getComputedStyle(element).backgroundColor, color: getComputedStyle(element).color }));
    expect(colors.background).not.toBe("rgb(255, 255, 255)");
    expect(colors.color).not.toBe("rgb(21, 33, 31)");
  }
});

test("legacy French route redirects to the canonical French product", async ({ page }) => {
  await page.goto("/fr/cameroon/cm-vat", { waitUntil: "networkidle" });
  await expect(page).toHaveURL(/\/fr\/cameroun\/calculateur-tva\/?$/);
  await expect(page.locator("link[rel=canonical]")).toHaveAttribute("href", "https://afrotools.com/fr/cameroun/calculateur-tva");
});
