"use strict";

const { test, expect } = require("@playwright/test");
const fs = require("node:fs/promises");
const { PDFDocument } = require("../../assets/vendor/pdf-lib/pdf-lib.min.js");
const route = "/sw/zana/kitengeneza-cheti/";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => { localStorage.setItem("afrotools_cookie_consent", "declined"); localStorage.setItem("aft_theme", "light"); });
});

function pngDimensions(buffer) {
  expect(buffer.subarray(1, 4).toString("ascii")).toBe("PNG"); return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
}

test("Swahili CertificateMaker preserves four templates and exports exact PNG/PDF", async ({ page }) => {
  const external = [], errors = []; page.on("request", (request) => { const url = new URL(request.url()); if (["http:", "https:"].includes(url.protocol) && !["127.0.0.1", "localhost"].includes(url.hostname)) external.push(request.url()); });
  page.on("pageerror", (error) => errors.push(error.message)); page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
  await page.goto(route); const studio = page.locator("[data-certificate-maker-native]"); const canvas = studio.locator("canvas");
  await expect(canvas).toHaveAttribute("width", "1400"); await expect(canvas).toHaveAttribute("height", "990");
  const cases = [
    ["Tuzo ya shule", "school-award", "CHETI CHA UBORA", "Tuzo za ufaulu wa sekondari"],
    ["Mafunzo", "bootcamp", "CHETI CHA KUKAMILISHA", "Kundi la ujuzi wa kidijitali"],
    ["Huduma ya kanisa", "church-service", "CHETI CHA HUDUMA", "Uongozi wa vijana na mafunzo ya huduma"],
    ["Shukrani ya jamii", "community", "CHETI CHA SHUKRANI", "Mpango wa maendeleo ya jamii"]
  ];
  for (const [button, id, title, course] of cases) {
    await studio.getByRole("button", { name: button }).click(); await expect(studio).toHaveAttribute("data-current-template", id); await expect(canvas).toHaveAttribute("aria-label", new RegExp(title)); await expect(studio.locator('[name="course"]')).toHaveValue(course);
  }
  await studio.locator('[name="course"]').fill("Kozi maalum ya jamii"); await studio.locator('[name="organization"]').fill("Shirika Maalum"); await studio.getByRole("button", { name: "Tuzo ya shule" }).click();
  await expect(studio.locator('[name="course"]')).toHaveValue("Kozi maalum ya jamii"); await expect(studio.locator('[name="organization"]')).toHaveValue("Shirika Maalum");
  await studio.locator('[name="recipient"]').fill("Asha, Baraka"); await studio.locator('[name="date"]').fill("2026-08-09"); await studio.getByRole("button", { name: "Tengeneza cheti" }).click(); await expect(studio.locator("[data-status]")).toContainText("limesasishwa");
  const pngPending = page.waitForEvent("download"); await studio.getByRole("button", { name: "Pakua PNG" }).click(); const pngDownload = await pngPending; expect(pngDownload.suggestedFilename()).toBe("cheti.png");
  const png = await fs.readFile(await pngDownload.path()); expect(pngDimensions(png)).toEqual({ width: 1400, height: 990 });
  const pdfPending = page.waitForEvent("download"); await studio.getByRole("button", { name: "Pakua PDF" }).click(); const pdfDownload = await pdfPending; expect(pdfDownload.suggestedFilename()).toBe("cheti.pdf");
  const pdfBytes = await fs.readFile(await pdfDownload.path()); expect(pdfBytes.subarray(0, 5).toString("ascii")).toBe("%PDF-"); const pdf = await PDFDocument.load(pdfBytes); expect(pdf.getPageCount()).toBe(1); const size = pdf.getPage(0).getSize(); expect(size.width).toBe(1400); expect(size.height).toBe(990);
  expect(external).toEqual([]); expect(errors).toEqual([]);
});

test("Swahili CertificateMaker fails closed and resets", async ({ page }) => {
  await page.goto(route); const studio = page.locator("[data-certificate-maker-native]"); await studio.locator('[name="recipient"]').fill(""); await studio.locator('[name="course"]').fill(""); await studio.locator('[name="organization"]').fill("");
  await studio.getByRole("button", { name: "Pakua PNG" }).click(); await expect(studio.locator("[data-status]")).toContainText("jina la mpokeaji, kozi au tukio, shirika"); await expect(studio.locator('[name="recipient"]')).toBeFocused();
  await studio.getByRole("button", { name: "Rejesha mfano" }).click(); await expect(studio).toHaveAttribute("data-current-template", "school-award"); await expect(studio.locator('[name="recipient"]')).toHaveValue("Amina Bello"); await expect(studio.locator('[name="course"]')).toHaveValue("Tuzo za ufaulu wa sekondari"); await expect(studio.locator('[name="recipient"]')).toBeFocused();
});

test("English CertificateMaker four-template and PNG/PDF regression", async ({ page }) => {
  await page.goto("/tools/certificate-maker/"); await expect(page.locator(".template-btn")).toHaveCount(4); await expect(page.locator("#recipientName")).toBeVisible(); await expect(page.locator("#courseName")).toBeVisible(); await expect(page.locator("#certDate")).toBeVisible(); await expect(page.locator("#organization")).toBeVisible(); await expect(page.locator("#downloadPngBtn")).toBeVisible(); await expect(page.locator("#downloadPdfBtn")).toBeVisible(); await expect(page.locator('input[type="file"]')).toHaveCount(0);
});

for (const size of [{ width: 320, zoom: 1 }, { width: 375, zoom: 1 }, { width: 640, zoom: 2 }]) {
  test(`Swahili CertificateMaker reflows at ${size.width}px and ${size.zoom}x`, async ({ page }) => {
    await page.setViewportSize({ width: size.width, height: 900 }); await page.goto(route); if (size.zoom > 1) await page.evaluate((zoom) => { document.documentElement.style.zoom = String(zoom); }, size.zoom);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1); await expect(page.getByRole("button", { name: "Tengeneza cheti" })).toBeVisible();
  });
}

test("Swahili CertificateMaker themes, labels and keyboard focus work", async ({ page }) => {
  await page.goto(route); const studio = page.locator("[data-certificate-maker-native]"); await expect(studio.locator('[name="recipient"]')).toHaveAccessibleName("Jina la mpokeaji"); await expect(studio.locator("canvas")).toHaveAccessibleName(/CHETI CHA UBORA/);
  await page.evaluate(() => document.documentElement.setAttribute("data-theme", "light")); const light = await studio.locator(".cert-card").first().evaluate((node) => getComputedStyle(node).backgroundColor); await page.evaluate(() => document.documentElement.setAttribute("data-theme", "dark")); const dark = await studio.locator(".cert-card").first().evaluate((node) => getComputedStyle(node).backgroundColor); expect(dark).not.toBe(light);
  await studio.getByRole("button", { name: "Tuzo ya shule" }).focus(); await page.keyboard.press("Tab"); await expect(studio.getByRole("button", { name: "Mafunzo" })).toBeFocused(); expect(await studio.getByRole("button", { name: "Mafunzo" }).evaluate((node) => getComputedStyle(node).outlineStyle)).not.toBe("none");
});

test("Swahili CertificateMaker SEO, hreflang, artwork and privacy are complete", async ({ page }) => {
  await page.goto(route); await expect(page.locator("html")).toHaveAttribute("lang", "sw"); await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", "https://afrotools.com/sw/zana/kitengeneza-cheti/"); await expect(page.locator('link[hreflang="en"]')).toHaveAttribute("href", "https://afrotools.com/tools/certificate-maker/"); await expect(page.locator('link[hreflang="fr"]')).toHaveAttribute("href", "https://afrotools.com/fr/tools/createur-certificat/");
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute("content", /certificate-maker\.webp$/); const schemas = (await page.locator('script[type="application/ld+json"]').allTextContents()).map(JSON.parse); expect(schemas.some((schema) => JSON.stringify(schema).includes('"inLanguage":"sw"'))).toBeTruthy(); await expect(page.locator(".cert-guides")).toContainText("Hayatumwi kwa seva au AI"); await expect(page.locator("iframe")).toHaveCount(0);
});
