"use strict";

const { test, expect } = require("@playwright/test");
const fs = require("node:fs/promises");
const route = "/sw/zana/mgawanyo-wa-mapato-ya-watayarishi/";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => { localStorage.setItem("afrotools_cookie_consent", "declined"); localStorage.setItem("aft_theme", "light"); });
});

async function setMember(row, name, role, share) {
  await row.locator('[name="member-name"]').fill(name);
  await row.locator('[name="member-role"]').fill(role);
  await row.locator('[name="member-share"]').fill(String(share));
}

test("Swahili CreatorSplit mutates collaborators and reopens exact JSON/TXT", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  const external = [], errors = [];
  page.on("request", (request) => { const host = new URL(request.url()).hostname; if (!["127.0.0.1", "localhost"].includes(host)) external.push(request.url()); });
  page.on("pageerror", (error) => errors.push(error.message)); page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
  await page.goto(route); const workspace = page.locator("[data-creator-split]");
  await expect(workspace.locator(".cs-calc-member")).toHaveCount(2);
  await workspace.getByRole("button", { name: "Ongeza mshiriki" }).click();
  await expect(workspace.locator(".cs-calc-member")).toHaveCount(3);
  const rows = workspace.locator(".cs-calc-member");
  await setMember(rows.nth(0), "Asha", "Mkurugenzi", 33.33);
  await setMember(rows.nth(1), "Baraka", "Mhariri", 33.33);
  await setMember(rows.nth(2), "Chiku", "Mwandishi", 33.34);
  await workspace.locator('[name="project"]').fill("Video ya pamoja");
  await workspace.locator('[name="currency"]').selectOption("USD");
  await workspace.locator('[name="revenue"]').fill("100.01");
  await workspace.getByRole("button", { name: "Hesabu mgao" }).click();
  await expect(workspace.locator("[data-output]")).toContainText("100%");
  await expect(workspace.locator(".cs-calc-results article")).toHaveCount(3);
  const jsonPending = page.waitForEvent("download"); await workspace.getByRole("button", { name: "Pakua JSON" }).click();
  const jsonDownload = await jsonPending; expect(jsonDownload.suggestedFilename()).toBe("creator-split.json");
  const json = JSON.parse(await fs.readFile(await jsonDownload.path(), "utf8"));
  expect(json.totalPercentage).toBe(100); expect(json.revenue).toBe(100.01);
  expect(json.shares.map((share) => share.amount)).toEqual([33.33, 33.33, 33.35]);
  expect(Number(json.shares.reduce((total, share) => total + share.amount, 0).toFixed(2))).toBe(100.01);
  const txtPending = page.waitForEvent("download"); await workspace.getByRole("button", { name: "Pakua TXT" }).click();
  const txtDownload = await txtPending; expect(txtDownload.suggestedFilename()).toBe("creator-split.txt");
  const txt = await fs.readFile(await txtDownload.path(), "utf8");
  expect(txt).toContain("MAKUBALIANO YA MGAO WA MAPATO"); expect(txt).toContain("Mradi: Video ya pamoja");
  expect(txt).toContain("Asha (Mkurugenzi): 33.33%"); expect(txt).toContain("Chiku (Mwandishi): 33.34%");
  await workspace.getByRole("button", { name: "Nakili makubaliano" }).click();
  await expect(workspace.locator("[data-status]")).toContainText("yamenakiliwa");
  expect(await page.evaluate(() => navigator.clipboard.readText())).toContain("Video ya pamoja");
  await rows.nth(2).getByRole("button", { name: "Ondoa mshiriki huyu" }).click();
  await expect(workspace.locator(".cs-calc-member")).toHaveCount(2);
  await setMember(workspace.locator(".cs-calc-member").nth(0), "Asha", "Mkurugenzi", 50);
  await setMember(workspace.locator(".cs-calc-member").nth(1), "Baraka", "Mhariri", 50);
  await workspace.getByRole("button", { name: "Hesabu mgao" }).click();
  await expect(workspace.locator(".cs-calc-results article")).toHaveCount(2);
  expect(external).toEqual([]); expect(errors).toEqual([]);
});

test("Swahili CreatorSplit fails closed and resets", async ({ page }) => {
  await page.goto(route); const workspace = page.locator("[data-creator-split]"); const rows = workspace.locator(".cs-calc-member");
  await rows.nth(1).locator('[name="member-share"]').fill("40");
  await workspace.getByRole("button", { name: "Hesabu mgao" }).click();
  await expect(workspace.locator("[data-status]")).toContainText("100% kamili");
  await expect(workspace.locator("[data-actions]")).toBeHidden();
  await rows.nth(0).getByRole("button", { name: "Ondoa mshiriki huyu" }).click();
  await expect(workspace.locator(".cs-calc-member")).toHaveCount(2);
  await workspace.getByRole("button", { name: "Rejesha mfano" }).click();
  await expect(workspace.locator(".cs-calc-member")).toHaveCount(2);
  await expect(workspace.locator('[name="member-name"]').first()).toHaveValue("Mtayarishi 1");
  await expect(workspace.locator('[name="member-share"]').first()).toHaveValue("50");
  await expect(workspace.locator('[name="project"]')).toHaveValue("Mradi mpya wa ubunifu");
  await expect(workspace.locator('[name="project"]')).toBeFocused();
});

test("English CreatorSplit regression preserves totals and exports", async ({ page }) => {
  await page.goto("/tools/creator-split/app");
  await page.getByRole("button", { name: "Calculate split" }).click();
  await expect(page.locator("[data-output]")).toContainText("100%");
  const pending = page.waitForEvent("download"); await page.getByRole("button", { name: "Download JSON" }).click();
  const json = JSON.parse(await fs.readFile(await (await pending).path(), "utf8"));
  expect(json.shares.map((share) => share.amount)).toEqual([500, 500]);
  expect(json.shares.reduce((total, share) => total + share.amount, 0)).toBe(1000);
});

for (const size of [{ width: 320, zoom: 1 }, { width: 375, zoom: 1 }, { width: 640, zoom: 2 }]) {
  test(`Swahili CreatorSplit reflows at ${size.width}px and ${size.zoom}x`, async ({ page }) => {
    await page.setViewportSize({ width: size.width, height: 900 }); await page.goto(route);
    if (size.zoom > 1) await page.evaluate((zoom) => { document.documentElement.style.zoom = String(zoom); }, size.zoom);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
    await expect(page.getByRole("button", { name: "Hesabu mgao" })).toBeVisible();
  });
}

test("Swahili CreatorSplit themes, labels and keyboard focus work", async ({ page }) => {
  await page.goto(route); const workspace = page.locator("[data-creator-split]");
  await expect(workspace.locator('[name="project"]')).toHaveAccessibleName("Jina la mradi");
  await expect(workspace.locator('[name="revenue"]')).toHaveAccessibleName("Mapato ya kugawa");
  await expect(workspace.locator('[name="member-name"]').first()).toHaveAccessibleName("Jina");
  await page.evaluate(() => document.documentElement.setAttribute("data-theme", "light")); const light = await workspace.evaluate((node) => getComputedStyle(node).color);
  await page.evaluate(() => document.documentElement.setAttribute("data-theme", "dark")); const dark = await workspace.evaluate((node) => getComputedStyle(node).color); expect(dark).not.toBe(light);
  await workspace.locator('[name="project"]').focus(); await page.keyboard.press("Tab"); await expect(workspace.locator('[name="projectType"]')).toBeFocused();
  expect(await workspace.locator('[name="projectType"]').evaluate((node) => getComputedStyle(node).outlineStyle)).not.toBe("none");
});

test("Swahili CreatorSplit SEO, artwork and privacy are complete", async ({ page }) => {
  await page.goto(route);
  await expect(page.locator("html")).toHaveAttribute("lang", "sw");
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", "https://afrotools.com/sw/zana/mgawanyo-wa-mapato-ya-watayarishi/");
  await expect(page.locator('link[hreflang="en"]')).toHaveAttribute("href", "https://afrotools.com/tools/creator-split/");
  await expect(page.locator('link[hreflang="fr"]')).toHaveAttribute("href", "https://afrotools.com/fr/tools/repartition-des-revenus-entre-createurs/");
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute("content", /creator-split\.webp$/);
  const schemas = (await page.locator('script[type="application/ld+json"]').allTextContents()).map(JSON.parse);
  expect(schemas.some((schema) => JSON.stringify(schema).includes('"inLanguage":"sw"'))).toBeTruthy();
  await expect(page.locator("[data-creator-split] .cs-calc-note")).toContainText("hazitumwi kwa seva au AI");
  await expect(page.locator("iframe")).toHaveCount(0);
});
