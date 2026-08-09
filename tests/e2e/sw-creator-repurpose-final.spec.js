"use strict";

const { test, expect } = require("@playwright/test");
const fs = require("node:fs");

const route = "/sw/zana/kubadilisha-maudhui-kwa-majukwaa/";

test("Swahili CreatorRepurpose preserves the manual planner", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto(route);
  await expect(page.locator("html")).toHaveAttribute("lang", "sw");
  await page.locator("#idea").fill("Makala kuhusu biashara ndogo ya ubunifu Afrika Mashariki");
  await page.locator("#platforms").fill("TikTok, LinkedIn");
  await page.locator("#calculate").click();
  await expect(page.locator("#results")).toContainText("Majukwaa");
  await expect(page.locator("#detail")).toContainText("TikTok");
  await page.locator("#copyPlan").click();
  await expect(page.locator("#copyStatus")).toContainText("Brief imenakiliwa");
  await page.locator("#reset").click();
  await expect(page.locator("#idea")).toHaveValue("Video moja kuhusu jinsi ya kupanga brand kit kwa SME");
});

test("Swahili CreatorRepurpose generates and reopens every advertised export", async ({ page }) => {
  const errors = [];
  const egress = [];
  page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
  page.on("request", (request) => {
    if (request.method() !== "GET" || /supabase|netlify|\/api\/|ai-advisor|generate/i.test(request.url())) egress.push(`${request.method()} ${request.url()}`);
  });
  await page.goto(route);
  const workspace = page.locator("[data-creator-repurpose-native]");
  await workspace.locator('textarea[name="source"]').fill("Biashara nzuri ya ubunifu inahitaji huduma iliyo wazi, kazi ya kuaminika na mawasiliano ya uaminifu na wateja.");
  await workspace.locator('input[value="newsletter"]').check();
  await workspace.getByRole("button", { name: "Unda rasimu kwenye kifaa" }).click();
  await expect(workspace.locator(".crn-result")).toHaveCount(3);
  await expect(workspace.locator("[data-status]")).toContainText("Rasimu zimeundwa");

  const jsonEvent = page.waitForEvent("download");
  await workspace.getByRole("button", { name: "Pakua JSON" }).click();
  const jsonDownload = await jsonEvent;
  expect(jsonDownload.suggestedFilename()).toBe("creator-repurpose.json");
  const parsed = JSON.parse(fs.readFileSync(await jsonDownload.path(), "utf8"));
  expect(parsed.language).toBe("sw");
  expect(parsed.outputs).toHaveLength(3);
  expect(parsed.outputs.map((item) => item.platform)).toEqual(["instagram", "twitter", "newsletter"]);
  expect(parsed.outputs.every((item) => item.text.length > 20)).toBeTruthy();

  const txtEvent = page.waitForEvent("download");
  await workspace.getByRole("button", { name: "Pakua TXT" }).click();
  const txtDownload = await txtEvent;
  expect(txtDownload.suggestedFilename()).toBe("creator-repurpose.txt");
  const txt = fs.readFileSync(await txtDownload.path(), "utf8");
  expect(txt).toContain("Instagram");
  expect(txt).toContain("Jarida la barua pepe");
  expect(txt.split("---")).toHaveLength(3);
  expect(egress).toEqual([]);
  expect(errors).toEqual([]);
});

test("Swahili CreatorRepurpose fails closed and resets", async ({ page }) => {
  await page.goto(route);
  const workspace = page.locator("[data-creator-repurpose-native]");
  await workspace.locator('textarea[name="source"]').fill("fupi sana");
  await workspace.getByRole("button", { name: "Unda rasimu kwenye kifaa" }).click();
  await expect(workspace.locator("[data-status]")).toContainText("herufi 20");
  await expect(workspace.locator("[data-actions]")).toBeHidden();
  await workspace.locator('textarea[name="source"]').fill("Maudhui haya yana urefu wa kutosha kwa jaribio la majukwaa.");
  for (const checkbox of await workspace.locator('input[name="platform"]').all()) await checkbox.uncheck();
  await workspace.getByRole("button", { name: "Unda rasimu kwenye kifaa" }).click();
  await expect(workspace.locator("[data-status]")).toContainText("jukwaa moja");
  await workspace.getByRole("button", { name: "Rejesha mfano" }).click();
  await expect(workspace.locator('textarea[name="source"]')).toHaveValue(/Biashara nzuri/);
  await expect(workspace.locator('textarea[name="source"]')).toBeFocused();
  await expect(workspace.locator("[data-output]")).toBeHidden();
});

for (const size of [{ width: 320, zoom: 1 }, { width: 375, zoom: 1 }, { width: 640, zoom: 2 }]) {
  test(`Swahili CreatorRepurpose reflows at ${size.width}px and ${size.zoom}x`, async ({ page }) => {
    await page.setViewportSize({ width: size.width, height: 900 });
    await page.goto(route);
    if (size.zoom > 1) await page.evaluate((zoom) => { document.documentElement.style.zoom = String(zoom); }, size.zoom);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
    await expect(page.getByRole("button", { name: "Unda rasimu kwenye kifaa" })).toBeVisible();
  });
}

test("Swahili CreatorRepurpose metadata, themes, labels and keyboard are complete", async ({ page }) => {
  await page.goto(route);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", "https://afrotools.com/sw/zana/kubadilisha-maudhui-kwa-majukwaa/");
  await expect(page.locator('link[hreflang="en"]')).toHaveAttribute("href", "https://afrotools.com/tools/creator-repurpose/");
  await expect(page.locator('link[hreflang="fr"]')).toHaveAttribute("href", "https://afrotools.com/fr/tools/reutilisation-de-contenu-pour-createur/");
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute("content", /creator-repurpose\.webp$/);
  const schemas = await page.locator('script[type="application/ld+json"]').allTextContents();
  expect(schemas.map(JSON.parse).some((schema) => schema.inLanguage === "sw")).toBeTruthy();
  const workspace = page.locator("[data-creator-repurpose-native]");
  await expect(workspace.locator('textarea[name="source"]')).toHaveAccessibleName("Maudhui ya chanzo");
  await expect(workspace.locator('select[name="sourceType"]')).toHaveAccessibleName("Aina ya chanzo");
  await page.evaluate(() => document.documentElement.setAttribute("data-theme", "light"));
  const lightBackground = await page.locator("body").evaluate((node) => getComputedStyle(node).backgroundColor);
  expect(await workspace.evaluate((node) => getComputedStyle(node).color)).not.toBe("rgb(229, 231, 235)");
  await page.evaluate(() => document.documentElement.setAttribute("data-theme", "dark"));
  expect(await page.locator("body").evaluate((node) => getComputedStyle(node).backgroundColor)).not.toBe(lightBackground);
  await workspace.locator('textarea[name="source"]').focus();
  await page.keyboard.press("Tab");
  await expect(workspace.locator('select[name="sourceType"]')).toBeFocused();
  expect(await workspace.locator('select[name="sourceType"]').evaluate((node) => getComputedStyle(node).outlineStyle)).not.toBe("none");
});
