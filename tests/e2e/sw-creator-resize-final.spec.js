"use strict";

const { test, expect } = require("@playwright/test");
const fs = require("node:fs/promises");
const path = require("node:path");
const JSZip = require(path.join(process.cwd(), "assets/vendor/jszip/jszip.min.js"));

const route = "/sw/zana/resize-ya-mtayarishi/";
const dimensions = new Map([
  ["instagram-square.png", [1080, 1080]], ["instagram-portrait.png", [1080, 1350]], ["instagram-story.png", [1080, 1920]],
  ["x-post.png", [1200, 675]], ["x-header.png", [1500, 500]], ["youtube-thumbnail.png", [1280, 720]],
  ["youtube-banner.png", [2560, 1440]], ["linkedin-post.png", [1200, 627]], ["facebook-cover.png", [820, 312]],
  ["facebook-post.png", [1200, 630]], ["pinterest-pin.png", [1000, 1500]], ["whatsapp-status.png", [1080, 1920]]
]);

function readPng(buffer) {
  expect([...buffer.subarray(0, 8)]).toEqual([137, 80, 78, 71, 13, 10, 26, 10]);
  return [buffer.readUInt32BE(16), buffer.readUInt32BE(20)];
}

async function syntheticPng(page) {
  const dataUrl = await page.evaluate(() => {
    const canvas = document.createElement("canvas"); canvas.width = 160; canvas.height = 100;
    const context = canvas.getContext("2d"); context.fillStyle = "#0d9488"; context.fillRect(0, 0, 160, 100);
    context.fillStyle = "#f59e0b"; context.fillRect(80, 0, 80, 100); context.fillStyle = "#fff";
    context.font = "bold 24px sans-serif"; context.fillText("AFRO", 45, 58); return canvas.toDataURL("image/png");
  });
  return Buffer.from(dataUrl.split(",")[1], "base64");
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("afrotools_cookie_consent", "declined");
    localStorage.setItem("aft_theme", "light");
    localStorage.removeItem("crz-preset"); localStorage.removeItem("crz-fill-mode");
  });
});

test("Swahili CreatorResize preserves the planning calculator", async ({ page }) => {
  await page.goto(route);
  await page.locator("#preset").selectOption("yt-thumb");
  await page.locator("#originalW").fill("1920"); await page.locator("#originalH").fill("1080");
  await page.locator("#calculate").click();
  await expect(page.locator("#results")).toContainText("1280 x 720 px");
  await page.locator("#reset").click();
  await expect(page.locator("#preset")).toHaveValue("ig-square");
  await expect(page.locator("#originalW")).toHaveValue("2400");
});

test("Swahili CreatorResize rejects invalid files and resets locally", async ({ page }) => {
  await page.goto(route);
  const input = page.locator("#crzFileInput");
  await input.setInputFiles({ name: "not-image.txt", mimeType: "text/plain", buffer: Buffer.from("not an image") });
  await expect(page.locator("#crzToast")).toContainText("Chagua picha ya PNG, JPEG au WebP");
  await expect(page.locator("#crzEditor")).toBeHidden();
  await input.setInputFiles({ name: "synthetic-afro.png", mimeType: "image/png", buffer: await syntheticPng(page) });
  await expect(page.locator("#crzEditor")).toBeVisible();
  await page.getByRole("button", { name: "Chagua picha nyingine" }).click();
  await expect(page.locator("#crzUploadState")).toBeVisible();
  await expect(page.locator("#crzEditor")).toBeHidden();
  await expect(input).toHaveValue("");
});

test("Swahili CreatorResize reopens all 12 individual PNGs and all 12 ZIP entries", async ({ page }) => {
  test.setTimeout(300000);
  const external = [], errors = [];
  page.on("request", (request) => { const host = new URL(request.url()).hostname; if (!["127.0.0.1", "localhost"].includes(host)) external.push(request.url()); });
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
  await page.goto(route);
  await page.locator("#crzFileInput").setInputFiles({ name: "synthetic-afro.png", mimeType: "image/png", buffer: await syntheticPng(page) });
  await expect(page.locator(".crz-size-card")).toHaveCount(12);
  await expect(page.locator(".crz-size-name").first()).toHaveText("Mraba wa Instagram");
  for (let index = 0; index < 12; index += 1) {
    const pending = page.waitForEvent("download");
    await page.locator(".crz-size-card").nth(index).locator(".crz-size-dl").click();
    const download = await pending;
    const name = download.suggestedFilename();
    expect(dimensions.has(name)).toBeTruthy();
    expect(readPng(await fs.readFile(await download.path()))).toEqual(dimensions.get(name));
  }
  const zipPending = page.waitForEvent("download");
  await page.locator("#crzDownloadAll").click();
  const zipDownload = await zipPending;
  expect(zipDownload.suggestedFilename()).toBe("synthetic-afro-all-sizes.zip");
  const zipBuffer = await fs.readFile(await zipDownload.path());
  expect(zipBuffer.subarray(0, 4).toString("ascii")).toBe("PK\u0003\u0004");
  const zip = await JSZip.loadAsync(zipBuffer);
  const entries = Object.values(zip.files).filter((entry) => !entry.dir && entry.name.endsWith(".png"));
  expect(entries).toHaveLength(12);
  for (const entry of entries) {
    const name = entry.name.split("/").pop();
    expect(dimensions.has(name)).toBeTruthy();
    expect(readPng(await entry.async("nodebuffer"))).toEqual(dimensions.get(name));
  }
  expect(external).toEqual([]); expect(errors).toEqual([]);
});

test("Swahili CreatorResize selection, focal point and modal keyboard flow work", async ({ page }) => {
  await page.goto(route);
  await page.locator("#crzFileInput").setInputFiles({ name: "synthetic-afro.png", mimeType: "image/png", buffer: await syntheticPng(page) });
  await page.locator("#crzOriginalImg").click({ position: { x: 120, y: 40 } });
  await expect(page.locator("#crzFocalLabel")).not.toContainText("50%, 50%");
  await page.getByRole("button", { name: "Rudisha sehemu kuu katikati" }).click();
  await expect(page.locator("#crzFocalLabel")).toContainText("50%, 50%");
  await page.getByRole("button", { name: "Chaguo langu", exact: true }).click();
  await page.locator(".crz-size-toggle").first().click();
  await expect(page.locator(".crz-size-card.active")).toHaveCount(11);
  await page.getByRole("button", { name: "Mitandao yote", exact: true }).click();
  const first = page.locator(".crz-size-card").first(); await first.focus(); await page.keyboard.press("Enter");
  await expect(page.locator("#crzModal")).toHaveClass(/open/); await expect(page.locator("#crzModalClose")).toBeFocused();
  await page.keyboard.press("Escape"); await expect(page.locator("#crzModal")).not.toHaveClass(/open/); await expect(first).toBeFocused();
});

for (const size of [{ width: 320, zoom: 1 }, { width: 375, zoom: 1 }, { width: 640, zoom: 2 }]) {
  test(`Swahili CreatorResize reflows at ${size.width}px and ${size.zoom}x`, async ({ page }) => {
    await page.setViewportSize({ width: size.width, height: 900 }); await page.goto(route);
    if (size.zoom > 1) await page.evaluate((zoom) => { document.documentElement.style.zoom = String(zoom); }, size.zoom);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
    await expect(page.locator("#crzDropZone")).toBeVisible();
  });
}

test("Swahili CreatorResize metadata, artwork, labels and themes are complete", async ({ page }) => {
  await page.goto(route);
  await expect(page.locator("html")).toHaveAttribute("lang", "sw");
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", "https://afrotools.com/sw/zana/resize-ya-mtayarishi/");
  await expect(page.locator('link[hreflang="en"]')).toHaveAttribute("href", "https://afrotools.com/tools/creator-resize/");
  await expect(page.locator('link[hreflang="fr"]')).toHaveAttribute("href", "https://afrotools.com/fr/tools/redimensionnement-pour-createur/");
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute("content", /creator-resize\.webp$/);
  expect((await page.locator('script[type="application/ld+json"]').allTextContents()).map(JSON.parse).some((schema) => schema.inLanguage === "sw")).toBeTruthy();
  await expect(page.locator("#crzFileInput")).toHaveAttribute("aria-label", "Chagua picha kwenye kifaa");
  await expect(page.locator("#crzDropZone")).toHaveAccessibleName(/Weka picha yako hapa/);
  await expect(page.locator("#crzFillSelect")).toHaveAccessibleName("Namna ya kujaza nafasi");
  await page.evaluate(() => document.documentElement.setAttribute("data-theme", "light"));
  const light = await page.locator("#crzApp").evaluate((node) => getComputedStyle(node).backgroundColor);
  await page.evaluate(() => document.documentElement.setAttribute("data-theme", "dark"));
  const dark = await page.locator("#crzApp").evaluate((node) => getComputedStyle(node).backgroundColor);
  expect(dark).not.toBe(light);
  await page.locator("#crzDropZone").focus(); expect(await page.locator("#crzDropZone").evaluate((node) => getComputedStyle(node).outlineStyle)).not.toBe("none");
});
