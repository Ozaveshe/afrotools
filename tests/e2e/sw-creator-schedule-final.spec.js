"use strict";

const { test, expect } = require("@playwright/test");
const fs = require("node:fs/promises");
const route = "/sw/zana/ratiba-ya-mtayarishi/";

function parseCsv(text) {
  return text.trim().split(/\r?\n/).map((line) => {
    const cells = []; let value = ""; let quoted = false;
    for (let index = 0; index < line.length; index += 1) {
      const char = line[index];
      if (char === '"' && quoted && line[index + 1] === '"') { value += '"'; index += 1; }
      else if (char === '"') quoted = !quoted;
      else if (char === "," && !quoted) { cells.push(value); value = ""; }
      else value += char;
    }
    cells.push(value); return cells;
  });
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => { localStorage.setItem("afrotools_cookie_consent", "declined"); localStorage.setItem("aft_theme", "light"); });
});

async function addPost(page, values) {
  const workspace = page.locator("[data-creator-schedule-native]");
  await workspace.locator('[name="title"]').fill(values.title);
  await workspace.locator('[name="platform"]').selectOption(values.platform);
  await workspace.locator('[name="scheduled"]').fill(values.scheduled);
  await workspace.locator('[name="note"]').fill(values.note || "");
  await workspace.getByRole("button", { name: "Ongeza kwenye ratiba" }).click();
}

test("Swahili CreatorSchedule reopens sorted JSON and escaped CSV", async ({ page }) => {
  const external = [], errors = [];
  page.on("request", (request) => { const host = new URL(request.url()).hostname; if (!["127.0.0.1", "localhost"].includes(host)) external.push(request.url()); });
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
  await page.goto(route);
  await addPost(page, { title: 'Chapisho "la pili"', platform: "instagram", scheduled: "2026-08-02T10:00", note: "Caption, picha na CTA" });
  await addPost(page, { title: "Chapisho la kwanza", platform: "linkedin", scheduled: "2026-08-01T09:00", note: "Limehakikiwa" });
  await expect(page.locator("[data-list] .crn-result").first()).toContainText("Chapisho la kwanza");
  const jsonPending = page.waitForEvent("download");
  await page.getByRole("button", { name: "Pakua JSON" }).click();
  const jsonDownload = await jsonPending; expect(jsonDownload.suggestedFilename()).toBe("creator-schedule.json");
  const json = JSON.parse(await fs.readFile(await jsonDownload.path(), "utf8"));
  expect(json.posts.map((post) => post.title)).toEqual(["Chapisho la kwanza", 'Chapisho "la pili"']);
  expect(json.posts[1].note).toBe("Caption, picha na CTA");
  expect(json.boundary).toBe("Ratiba ya kifaa chako pekee; hakuna uchapishaji wa moja kwa moja.");
  const csvPending = page.waitForEvent("download");
  await page.getByRole("button", { name: "Pakua CSV" }).click();
  const csvDownload = await csvPending; expect(csvDownload.suggestedFilename()).toBe("creator-schedule.csv");
  const csvText = await fs.readFile(await csvDownload.path(), "utf8");
  expect(csvText).toContain("\r\n");
  const rows = parseCsv(csvText);
  expect(rows[0]).toEqual(["title", "platform", "scheduled_at", "status", "note"]);
  expect(rows[1]).toEqual(["Chapisho la kwanza", "linkedin", "2026-08-01T09:00", "planned", "Limehakikiwa"]);
  expect(rows[2]).toEqual(['Chapisho "la pili"', "instagram", "2026-08-02T10:00", "planned", "Caption, picha na CTA"]);
  expect(external).toEqual([]); expect(errors).toEqual([]);
});

test("Swahili CreatorSchedule fails closed and resets the complete plan", async ({ page }) => {
  await page.goto(route); const workspace = page.locator("[data-creator-schedule-native]");
  await workspace.locator('[name="title"]').evaluate((input) => { input.removeAttribute("required"); input.value = ""; });
  await workspace.getByRole("button", { name: "Ongeza kwenye ratiba" }).click();
  await expect(workspace.locator("[data-status]")).toContainText("jina la chapisho");
  await expect(workspace.locator("[data-actions]")).toBeHidden();
  await workspace.locator('[name="title"]').fill("Chapisho la majaribio");
  await workspace.locator('[name="scheduled"]').fill("2026-08-03T12:00");
  await workspace.getByRole("button", { name: "Ongeza kwenye ratiba" }).click();
  await expect(workspace.locator("[data-actions]")).toBeVisible();
  await workspace.getByRole("button", { name: "Futa ratiba" }).click();
  await expect(workspace.locator("[data-actions]")).toBeHidden();
  await expect(workspace.locator("[data-list]")).toBeEmpty();
  await expect(workspace.locator('[name="scheduled"]')).toHaveValue("2026-08-01T10:00");
  await expect(workspace.locator('[name="title"]')).toBeFocused();
});

test("English CreatorSchedule controller regression remains intact", async ({ page }) => {
  await page.goto("/tools/creator-schedule/app");
  await page.getByLabel("Post title").fill("English regression post");
  await page.getByRole("button", { name: "Add to plan" }).click();
  await expect(page.locator("[data-status]")).toContainText("Post added to the local plan");
  const pending = page.waitForEvent("download"); await page.getByRole("button", { name: "Download JSON" }).click();
  const json = JSON.parse(await fs.readFile(await (await pending).path(), "utf8"));
  expect(json.boundary).toBe("Local plan only; no automatic publishing.");
});

for (const size of [{ width: 320, zoom: 1 }, { width: 375, zoom: 1 }, { width: 640, zoom: 2 }]) {
  test(`Swahili CreatorSchedule reflows at ${size.width}px and ${size.zoom}x`, async ({ page }) => {
    await page.setViewportSize({ width: size.width, height: 900 }); await page.goto(route);
    if (size.zoom > 1) await page.evaluate((zoom) => { document.documentElement.style.zoom = String(zoom); }, size.zoom);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
    await expect(page.getByRole("button", { name: "Ongeza kwenye ratiba" })).toBeVisible();
  });
}

test("Swahili CreatorSchedule themes, labels and keyboard focus work", async ({ page }) => {
  await page.goto(route); const workspace = page.locator("[data-creator-schedule-native]");
  await expect(workspace.locator('[name="title"]')).toHaveAccessibleName("Jina la chapisho");
  await expect(workspace.locator('[name="platform"]')).toHaveAccessibleName("Jukwaa");
  await expect(workspace.locator('[name="scheduled"]')).toHaveAccessibleName("Tarehe na saa iliyopangwa");
  await page.evaluate(() => document.documentElement.setAttribute("data-theme", "light"));
  const light = await workspace.evaluate((node) => getComputedStyle(node).color);
  await page.evaluate(() => document.documentElement.setAttribute("data-theme", "dark"));
  const dark = await workspace.evaluate((node) => getComputedStyle(node).color); expect(dark).not.toBe(light);
  await workspace.locator('[name="title"]').focus(); await page.keyboard.press("Tab");
  await expect(workspace.locator('[name="platform"]')).toBeFocused();
  expect(await workspace.locator('[name="platform"]').evaluate((node) => getComputedStyle(node).outlineStyle)).not.toBe("none");
});

test("Swahili CreatorSchedule SEO, artwork and local-only claims are complete", async ({ page }) => {
  await page.goto(route);
  await expect(page.locator("html")).toHaveAttribute("lang", "sw");
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", "https://afrotools.com/sw/zana/ratiba-ya-mtayarishi/");
  await expect(page.locator('link[hreflang="en"]')).toHaveAttribute("href", "https://afrotools.com/tools/creator-schedule/");
  await expect(page.locator('link[hreflang="fr"]')).toHaveAttribute("href", "https://afrotools.com/fr/tools/planning-du-createur/");
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute("content", /creator-schedule\.webp$/);
  const schemas = (await page.locator('script[type="application/ld+json"]').allTextContents()).map(JSON.parse);
  expect(schemas.some((schema) => JSON.stringify(schema).includes('"inLanguage":"sw"'))).toBeTruthy();
  await expect(page.locator("[data-creator-schedule-native] .ctn-note")).toContainText("haitumi machapisho kwa seva au AI");
  await expect(page.locator("iframe")).toHaveCount(0);
});
