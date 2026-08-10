"use strict";

const { test, expect } = require("@playwright/test");
const fs = require("node:fs/promises");
const route = "/sw/zana/script-za-video/";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => { localStorage.setItem("afrotools_cookie_consent", "declined"); localStorage.setItem("aft_theme", "light"); });
});

test("Swahili CreatorScripts preserves the broader planner and brief workspace", async ({ page }) => {
  await page.goto(route);
  await page.locator("#topic").fill("Biashara endelevu ya ubunifu");
  await page.locator("#context").fill("sekunde 90");
  await page.locator("#platform").selectOption("youtube");
  await page.locator("#calculate").click();
  await expect(page.locator("#results")).toContainText("YouTube");
  await expect(page.locator("#detail")).toContainText("Hook:");
  await page.locator("#reset").click();
  await expect(page.locator("#topic")).toHaveValue("Bei ya influencer na majadiliano");

  const workspace = page.locator("[data-sw-creator-workspace]");
  await workspace.locator("#creatorBriefFile").setInputFiles({ name: "brief.txt", mimeType: "text/plain", buffer: Buffer.from("Brand: Afro Studio\nHadhira: SMEs\nCTA: Omba bei") });
  await expect(workspace.locator("#creatorBriefText")).toHaveValue(/Afro Studio/);
  await page.locator("#calculate").click();
  const pending = page.waitForEvent("download");
  await workspace.locator("#creatorDownloadPlan").click();
  const download = await pending;
  expect(download.suggestedFilename()).toBe("afrotools-creator-workspace.txt");
  const text = await fs.readFile(await download.path(), "utf8");
  expect(text).toContain("Brand: Afro Studio"); expect(text).toContain("Matokeo ya zana:"); expect(text).toContain("Jukwaa");
});

test("Swahili CreatorScripts reopens native JSON and TXT without egress", async ({ page }) => {
  const external = [], errors = [];
  page.on("request", (request) => { const host = new URL(request.url()).hostname; if (!["127.0.0.1", "localhost"].includes(host)) external.push(request.url()); });
  page.on("pageerror", (error) => errors.push(error.message)); page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
  await page.goto(route); const native = page.locator("[data-creator-scripts-native]");
  await native.locator('[name="topic"]').fill("Biashara ya ubunifu yenye msingi mzuri");
  await native.locator('[name="format"]').selectOption("short");
  await native.locator('[name="keyPoints"]').fill("Huduma iliyo wazi\nFuatilia gharama\nHakiki mipaka ya kazi");
  await native.getByRole("button", { name: "Unda rasimu ya script" }).click();
  await expect(native.locator(".crn-result")).toHaveCount(4);
  await expect(native.locator("[data-status]")).toContainText("Rasimu imeundwa kwenye kifaa");
  const jsonPending = page.waitForEvent("download"); await native.getByRole("button", { name: "Pakua JSON" }).click();
  const jsonDownload = await jsonPending; expect(jsonDownload.suggestedFilename()).toBe("creator-script.json");
  const json = JSON.parse(await fs.readFile(await jsonDownload.path(), "utf8"));
  expect(json.language).toBe("sw"); expect(json.format).toBe("short"); expect(json.sections).toHaveLength(4);
  expect(json.sections.map((section) => section.label)).toEqual(["KIVUTIO", "MUKTADHA", "HOJA KUU", "HITIMISHO"]);
  expect(json.fullScript).toContain("Hakiki mipaka ya kazi");
  const txtPending = page.waitForEvent("download"); await native.getByRole("button", { name: "Pakua TXT ya script" }).click();
  const txtDownload = await txtPending; expect(txtDownload.suggestedFilename()).toBe("creator-script.txt");
  const txt = await fs.readFile(await txtDownload.path(), "utf8");
  expect(txt).toContain("Muundo: short | Muda:"); expect(txt).toContain("[KIVUTIO]"); expect(txt).toContain("[HITIMISHO]");
  expect(external).toEqual([]); expect(errors).toEqual([]);
});

test("Swahili CreatorScripts fails closed and resets", async ({ page }) => {
  await page.goto(route); const native = page.locator("[data-creator-scripts-native]");
  await native.locator('[name="keyPoints"]').fill("");
  await native.getByRole("button", { name: "Unda rasimu ya script" }).click();
  await expect(native.locator("[data-status]")).toContainText("hoja moja kuu");
  await expect(native.locator("[data-actions]")).toBeHidden();
  await native.locator('[name="keyPoints"]').fill("Hoja ya kujaribu");
  await native.getByRole("button", { name: "Unda rasimu ya script" }).click();
  await expect(native.locator("[data-actions]")).toBeVisible();
  await native.getByRole("button", { name: "Rejesha mfano" }).click();
  await expect(native.locator('[name="topic"]')).toHaveValue("Kujenga biashara endelevu ya ubunifu");
  await expect(native.locator('[name="topic"]')).toBeFocused(); await expect(native.locator("[data-output]")).toBeHidden();
});

test("English CreatorScripts regression remains byte-compatible", async ({ page }) => {
  await page.goto("/tools/creator-scripts/app");
  await page.getByRole("button", { name: "Build script draft" }).click();
  await expect(page.locator(".crn-result")).toHaveCount(4);
  await expect(page.locator("[data-status]")).toContainText("Local draft created");
  const pending = page.waitForEvent("download"); await page.getByRole("button", { name: "Download TXT" }).click();
  const text = await fs.readFile(await (await pending).path(), "utf8");
  expect(text).toContain("Format: youtube | Duration:"); expect(text).toContain("[HOOK]"); expect(text).toContain("[CLOSE]");
});

for (const size of [{ width: 320, zoom: 1 }, { width: 375, zoom: 1 }, { width: 640, zoom: 2 }]) {
  test(`Swahili CreatorScripts reflows at ${size.width}px and ${size.zoom}x`, async ({ page }) => {
    await page.setViewportSize({ width: size.width, height: 900 }); await page.goto(route);
    if (size.zoom > 1) await page.evaluate((zoom) => { document.documentElement.style.zoom = String(zoom); }, size.zoom);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
    await expect(page.getByRole("button", { name: "Unda rasimu ya script" })).toBeVisible();
  });
}

test("Swahili CreatorScripts themes, labels and keyboard focus work", async ({ page }) => {
  await page.goto(route); const native = page.locator("[data-creator-scripts-native]");
  await expect(native.locator('[name="topic"]')).toHaveAccessibleName("Mada ya video");
  await expect(native.locator('[name="format"]')).toHaveAccessibleName("Muundo");
  await expect(native.locator('[name="keyPoints"]')).toHaveAccessibleName("Hoja kuu, moja kwa kila mstari");
  await page.evaluate(() => document.documentElement.setAttribute("data-theme", "light")); const light = await native.evaluate((node) => getComputedStyle(node).color);
  await page.evaluate(() => document.documentElement.setAttribute("data-theme", "dark")); const dark = await native.evaluate((node) => getComputedStyle(node).color); expect(dark).not.toBe(light);
  await native.locator('[name="topic"]').focus(); await page.keyboard.press("Tab"); await expect(native.locator('[name="format"]')).toBeFocused();
  expect(await native.locator('[name="format"]').evaluate((node) => getComputedStyle(node).outlineStyle)).not.toBe("none");
});

test("Swahili CreatorScripts SEO, artwork and deterministic privacy are complete", async ({ page }) => {
  await page.goto(route);
  await expect(page.locator("html")).toHaveAttribute("lang", "sw");
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", "https://afrotools.com/sw/zana/script-za-video/");
  await expect(page.locator('link[hreflang="en"]')).toHaveAttribute("href", "https://afrotools.com/tools/creator-scripts/");
  await expect(page.locator('link[hreflang="fr"]')).toHaveAttribute("href", "https://afrotools.com/fr/tools/scripts-video-pour-createur/");
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute("content", /creator-scripts\.webp$/);
  const schemas = (await page.locator('script[type="application/ld+json"]').allTextContents()).map(JSON.parse);
  expect(schemas.some((schema) => schema.inLanguage === "sw")).toBeTruthy();
  await expect(page.locator("[data-creator-scripts-native] .ctn-note")).toContainText("Rasimu ya ndani, si AI");
  await expect(page.locator("iframe")).toHaveCount(0);
});
