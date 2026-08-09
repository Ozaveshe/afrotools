"use strict";

const { test, expect } = require("@playwright/test");
const fs = require("node:fs/promises");
const route = "/sw/zana/ukaguzi-wa-personal-brand/";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => { localStorage.setItem("afrotools_cookie_consent", "declined"); localStorage.setItem("aft_theme", "light"); });
});

async function setMidCase(workspace) {
  const values = { industry: "tech", yearsExp: "7", liConnections: "13", liPosting: "8", twFollowers: "9", igFollowers: "7", website: "12", googleResult: "7", articles: "7", book: "5", podcast: "6", speaking: "7", awards: "5", education: "9", certs: "5" };
  for (const [id, value] of Object.entries(values)) {
    const node = workspace.locator("#" + id); if (id === "yearsExp") await node.fill(value); else await node.selectOption(value);
  }
}

test("Swahili PersonalBrandAudit preserves exact six-category oracle and reopens TXT", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]); const external = [], errors = [];
  page.on("request", (request) => { const host = new URL(request.url()).hostname; if (!["127.0.0.1", "localhost"].includes(host)) external.push(request.url()); });
  page.on("pageerror", (error) => errors.push(error.message)); page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
  await page.goto(route); const workspace = page.locator("[data-personal-brand-audit-sw]"); await setMidCase(workspace);
  await workspace.getByRole("button", { name: "Kokotoa alama ya chapa" }).click();
  await expect(workspace.locator("[data-results]")).toBeVisible();
  await expect(workspace.locator("[data-score]")).toHaveText("88"); await expect(workspace.locator("[data-grade]")).toHaveText("Daraja A");
  const breakdown = workspace.locator("[data-breakdown] .en-progress-item"); await expect(breakdown).toHaveCount(6);
  await expect(breakdown.nth(0)).toContainText("20/20"); await expect(breakdown.nth(1)).toContainText("9/15"); await expect(breakdown.nth(2)).toContainText("15/15");
  await expect(breakdown.nth(3)).toContainText("18/20"); await expect(breakdown.nth(4)).toContainText("12/15"); await expect(breakdown.nth(5)).toContainText("14/15");
  await expect(workspace.locator("[data-plan] .action-card")).toHaveCount(5); await expect(workspace.locator("[data-plan]")).toContainText("Imarisha Mitandao ya kijamii");
  await expect(workspace.locator("[data-readiness]")).toContainText("Utayari wa mapato: Juu");
  await workspace.getByRole("button", { name: "Nakili muhtasari" }).click(); await expect(workspace.locator("[data-status]")).toContainText("umenakiliwa");
  expect(await page.evaluate(() => navigator.clipboard.readText())).toContain("Alama: 88/100");
  const pending = page.waitForEvent("download"); await workspace.getByRole("button", { name: "Pakua TXT" }).click();
  const download = await pending; expect(download.suggestedFilename()).toBe("ukaguzi-wa-chapa-binafsi.txt");
  const text = await fs.readFile(await download.path(), "utf8"); const lines = text.split(/\r?\n/);
  expect(lines[0]).toBe("UKAGUZI WA CHAPA BINAFSI"); expect(lines).toContain("Alama: 88/100"); expect(lines).toContain("Mitandao ya kijamii: 9/15");
  expect(text).toContain("Siku 22–45 — Imarisha Mitandao ya kijamii"); expect(text).toContain("Ni tathmini binafsi ya kupanga");
  expect(external).toEqual([]); expect(errors).toEqual([]);
});

test("Swahili PersonalBrandAudit fails closed, reaches exact maximum and resets", async ({ page }) => {
  await page.goto(route); const workspace = page.locator("[data-personal-brand-audit-sw]");
  await workspace.getByRole("button", { name: "Kokotoa alama ya chapa" }).click(); await expect(workspace.locator("[data-status]")).toContainText("Chagua sekta");
  await expect(workspace.locator("#industry")).toBeFocused(); await expect(workspace.locator("[data-results]")).toBeHidden();
  const max = { industry: "media", liConnections: "20", liPosting: "10", twFollowers: "15", igFollowers: "10", website: "15", googleResult: "10", articles: "15", book: "15", podcast: "10", speaking: "12", awards: "8", education: "12", certs: "8" };
  for (const [id, value] of Object.entries(max)) await workspace.locator("#" + id).selectOption(value);
  await workspace.getByRole("button", { name: "Kokotoa alama ya chapa" }).click(); await expect(workspace.locator("[data-score]")).toHaveText("100"); await expect(workspace.locator("[data-grade]")).toHaveText("Daraja A+");
  await workspace.getByRole("button", { name: "Rejesha mfano" }).click(); await expect(workspace.locator("[data-results]")).toBeHidden(); await expect(workspace.locator("#industry")).toHaveValue(""); await expect(workspace.locator("#industry")).toBeFocused();
});

test("English PersonalBrandAudit shared-engine regression remains 88", async ({ page }) => {
  await page.goto("/tools/personal-brand-audit/"); const workspace = page.locator("body"); await setMidCase(workspace);
  await page.getByRole("button", { name: /Calculate Brand Score/ }).click(); await expect(page.locator("#scoreRing")).toContainText("88"); await expect(page.locator("#gradeBadge")).toContainText("Grade A");
  await expect(page.locator("#scoreBreakdown .en-progress-item")).toHaveCount(6); await expect(page.getByRole("button", { name: "Download result (TXT)" })).toBeVisible();
});

for (const size of [{ width: 320, zoom: 1 }, { width: 375, zoom: 1 }, { width: 640, zoom: 2 }]) {
  test(`Swahili PersonalBrandAudit reflows at ${size.width}px and ${size.zoom}x`, async ({ page }) => {
    await page.setViewportSize({ width: size.width, height: 900 }); await page.goto(route); if (size.zoom > 1) await page.evaluate((zoom) => { document.documentElement.style.zoom = String(zoom); }, size.zoom);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1); await expect(page.getByRole("button", { name: "Kokotoa alama ya chapa" })).toBeVisible();
  });
}

test("Swahili PersonalBrandAudit supports themes, labels and keyboard focus", async ({ page }) => {
  await page.goto(route); const workspace = page.locator("[data-personal-brand-audit-sw]"); await expect(workspace.locator("#industry")).toHaveAccessibleName("Sekta"); await expect(workspace.locator("#liConnections")).toHaveAccessibleName("Miunganisho ya LinkedIn");
  await page.evaluate(() => document.documentElement.setAttribute("data-theme", "light")); const light = await workspace.locator(".en-card").first().evaluate((node) => getComputedStyle(node).backgroundColor);
  await page.evaluate(() => document.documentElement.setAttribute("data-theme", "dark")); const dark = await workspace.locator(".en-card").first().evaluate((node) => getComputedStyle(node).backgroundColor); expect(dark).not.toBe(light);
  await workspace.locator("#industry").focus(); await page.keyboard.press("Tab"); await expect(workspace.locator("#yearsExp")).toBeFocused(); expect(await workspace.locator("#yearsExp").evaluate((node) => getComputedStyle(node).outlineStyle)).not.toBe("none");
});

test("Swahili PersonalBrandAudit SEO, hreflang, artwork and privacy are complete", async ({ page }) => {
  await page.goto(route); await expect(page.locator("html")).toHaveAttribute("lang", "sw"); await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", "https://afrotools.com/sw/zana/ukaguzi-wa-personal-brand/");
  await expect(page.locator('link[hreflang="en"]')).toHaveAttribute("href", "https://afrotools.com/tools/personal-brand-audit/"); await expect(page.locator('link[hreflang="fr"]')).toHaveAttribute("href", "https://afrotools.com/fr/tools/audit-marque-personnelle/");
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute("content", /personal-brand-audit\.webp$/); const schemas = (await page.locator('script[type="application/ld+json"]').allTextContents()).map(JSON.parse); expect(schemas.some((schema) => JSON.stringify(schema).includes('"inLanguage":"sw"'))).toBeTruthy();
  await expect(page.locator("[data-personal-brand-audit-sw]")).toContainText("Hayatumwi kwa seva au AI"); await expect(page.locator("iframe")).toHaveCount(0);
});
