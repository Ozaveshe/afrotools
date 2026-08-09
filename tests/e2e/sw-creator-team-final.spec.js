"use strict";

const { test, expect } = require("@playwright/test");
const fs = require("node:fs/promises");
const route = "/sw/zana/timu-ya-watayarishi/";

function parseCsvRow(row) {
  const values = []; let current = ""; let quoted = false;
  for (let index = 0; index < row.length; index += 1) {
    const char = row[index];
    if (char === '"' && quoted && row[index + 1] === '"') { current += '"'; index += 1; }
    else if (char === '"') quoted = !quoted;
    else if (char === "," && !quoted) { values.push(current); current = ""; }
    else current += char;
  }
  values.push(current); return values;
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => { localStorage.setItem("afrotools_cookie_consent", "declined"); localStorage.setItem("aft_theme", "light"); });
});

test("Swahili CreatorTeam mutates tasks and reopens native JSON and CSV", async ({ page }) => {
  const external = [], errors = [];
  page.on("request", (request) => { const host = new URL(request.url()).hostname; if (!["127.0.0.1", "localhost"].includes(host)) external.push(request.url()); });
  page.on("pageerror", (error) => errors.push(error.message)); page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
  await page.goto(route); const workspace = page.locator("[data-creator-team-native]");
  await workspace.locator('[name="title"]').fill("Hariri video ya uzinduzi");
  await workspace.locator('[name="owner"]').fill("Amina");
  await workspace.locator('[name="taskStatus"]').selectOption("review");
  await workspace.locator('[name="due"]').fill("2026-08-20");
  await workspace.locator('[name="note"]').fill("Kagua manukuu, sauti");
  await workspace.getByRole("button", { name: "Ongeza jukumu" }).click();
  await expect(workspace.locator("[data-list]")).toContainText("Hariri video ya uzinduzi");
  await expect(workspace.locator("[data-list]")).toContainText("Linakaguliwa");
  await expect(workspace.locator("[data-summary]")).toContainText("Majukumu: 1");
  const jsonPending = page.waitForEvent("download"); await workspace.getByRole("button", { name: "Pakua JSON" }).click();
  const jsonDownload = await jsonPending; expect(jsonDownload.suggestedFilename()).toBe("creator-team-board.json");
  const json = JSON.parse(await fs.readFile(await jsonDownload.path(), "utf8"));
  expect(json.language).toBe("sw"); expect(json.tasks[0]).toEqual({ project: "Uzinduzi wa kampeni", title: "Hariri video ya uzinduzi", owner: "Amina", status: "review", dueDate: "2026-08-20", note: "Kagua manukuu, sauti" });
  expect(json.summary).toEqual({ total: 1, counts: { backlog: 0, doing: 0, review: 1, done: 0 } });
  const csvPending = page.waitForEvent("download"); await workspace.getByRole("button", { name: "Pakua CSV" }).click();
  const csvDownload = await csvPending; expect(csvDownload.suggestedFilename()).toBe("creator-team-board.csv");
  const csv = await fs.readFile(await csvDownload.path(), "utf8"); const rows = csv.trim().split(/\r?\n/);
  expect(rows[0]).toBe("mradi,jukumu,mhusika,hali,tarehe_ya_mwisho,maelezo");
  expect(parseCsvRow(rows[0])).toEqual(["mradi", "jukumu", "mhusika", "hali", "tarehe_ya_mwisho", "maelezo"]);
  expect(parseCsvRow(rows[1])).toEqual(["Uzinduzi wa kampeni", "Hariri video ya uzinduzi", "Amina", "Linakaguliwa", "2026-08-20", "Kagua manukuu, sauti"]);
  await workspace.getByRole("button", { name: "Ondoa" }).click();
  await expect(workspace.locator("[data-list] article")).toHaveCount(0); await expect(workspace.locator("[data-actions]")).toBeHidden();
  expect(external).toEqual([]); expect(errors).toEqual([]);
});

test("Swahili CreatorTeam fails closed and resets", async ({ page }) => {
  await page.goto(route); const workspace = page.locator("[data-creator-team-native]");
  await workspace.locator('[name="project"]').fill(""); await workspace.locator('[name="title"]').fill("");
  await workspace.getByRole("button", { name: "Ongeza jukumu" }).click();
  await expect(workspace.locator("[data-status]")).toContainText("Weka mradi na jukumu"); await expect(workspace.locator("[data-actions]")).toBeHidden();
  await workspace.locator('[name="project"]').fill("Mradi A"); await workspace.locator('[name="title"]').fill("Jukumu A");
  await workspace.getByRole("button", { name: "Ongeza jukumu" }).click(); await expect(workspace.locator("[data-list] article")).toHaveCount(1);
  await workspace.getByRole("button", { name: "Futa ubao" }).click(); await expect(workspace.locator("[data-list] article")).toHaveCount(0);
  await expect(workspace.locator('[name="project"]')).toHaveValue("Uzinduzi wa kampeni"); await expect(workspace.locator('[name="project"]')).toBeFocused();
});

test("English CreatorTeam regression preserves workflow and export headers", async ({ page }) => {
  await page.goto("/tools/creator-team/app"); await page.getByLabel("Task").fill("Edit launch video");
  await page.getByRole("button", { name: "Add task" }).click(); await expect(page.locator("[data-summary]")).toContainText("Tasks: 1");
  const jsonPending = page.waitForEvent("download"); await page.getByRole("button", { name: "Download JSON" }).click();
  const json = JSON.parse(await fs.readFile(await (await jsonPending).path(), "utf8")); expect(Object.keys(json)).toEqual(["tasks", "summary"]);
  const pending = page.waitForEvent("download"); await page.getByRole("button", { name: "Download CSV" }).click();
  const csv = await fs.readFile(await (await pending).path(), "utf8"); expect(csv.split(/\r?\n/)[0]).toBe("project,title,owner,status,due_date,note");
});

for (const size of [{ width: 320, zoom: 1 }, { width: 375, zoom: 1 }, { width: 640, zoom: 2 }]) {
  test(`Swahili CreatorTeam reflows at ${size.width}px and ${size.zoom}x`, async ({ page }) => {
    await page.setViewportSize({ width: size.width, height: 900 }); await page.goto(route);
    if (size.zoom > 1) await page.evaluate((zoom) => { document.documentElement.style.zoom = String(zoom); }, size.zoom);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
    await expect(page.getByRole("button", { name: "Ongeza jukumu" })).toBeVisible();
  });
}

test("Swahili CreatorTeam themes, labels and keyboard focus work", async ({ page }) => {
  await page.goto(route); const workspace = page.locator("[data-creator-team-native]");
  await expect(workspace.locator('[name="project"]')).toHaveAccessibleName("Mradi"); await expect(workspace.locator('[name="note"]')).toHaveAccessibleName("Maelezo ya kukabidhi");
  await page.evaluate(() => document.documentElement.setAttribute("data-theme", "light")); const light = await workspace.evaluate((node) => getComputedStyle(node).color);
  await page.evaluate(() => document.documentElement.setAttribute("data-theme", "dark")); const dark = await workspace.evaluate((node) => getComputedStyle(node).color); expect(dark).not.toBe(light);
  await workspace.locator('[name="project"]').focus(); await page.keyboard.press("Tab"); await expect(workspace.locator('[name="title"]')).toBeFocused();
  expect(await workspace.locator('[name="title"]').evaluate((node) => getComputedStyle(node).outlineStyle)).not.toBe("none");
});

test("Swahili CreatorTeam SEO, reciprocal artwork and privacy are complete", async ({ page }) => {
  await page.goto(route); await expect(page.locator("html")).toHaveAttribute("lang", "sw");
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", "https://afrotools.com/sw/zana/timu-ya-watayarishi/");
  await expect(page.locator('link[hreflang="en"]')).toHaveAttribute("href", "https://afrotools.com/tools/creator-team/");
  await expect(page.locator('link[hreflang="fr"]')).toHaveAttribute("href", "https://afrotools.com/fr/tools/equipe-du-createur/");
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute("content", /creator-team\.webp$/);
  const schemas = (await page.locator('script[type="application/ld+json"]').allTextContents()).map(JSON.parse);
  expect(schemas.some((schema) => JSON.stringify(schema).includes('"inLanguage":"sw"'))).toBeTruthy();
  await expect(page.locator("[data-creator-team-native] .ctn-note")).toContainText("hayatumwi kwa seva au AI"); await expect(page.locator("iframe")).toHaveCount(0);
});
