const { test, expect } = require("@playwright/test");
const fs = require("node:fs/promises");
const route = "/fr/tools/equipe-du-createur/app";
test("French CreatorTeam is native, reciprocal, and uses artwork", async ({ page }) => {
  await page.goto(route);
  await expect(page.locator("html")).toHaveAttribute("lang", "fr");
  await expect(page.locator("iframe")).toHaveCount(0);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", "https://afrotools.com/fr/tools/equipe-du-createur/app");
  await expect(page.locator('link[hreflang="en"]')).toHaveAttribute("href", "https://afrotools.com/tools/creator-team/app");
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute("content", /creator-team\.webp$/);
});
test("French CreatorTeam builds a local board and reopens JSON and CSV", async ({ page }) => {
  const outbound = [];
  page.on("request", request => { if (!request.url().startsWith("http://127.0.0.1") && ["fetch","xhr"].includes(request.resourceType())) outbound.push(request.url()); });
  await page.goto(route);
  await page.getByLabel("Tâche").fill("Monter la vidéo");
  await page.getByLabel("Responsable").fill("Amina");
  await page.getByLabel("Statut").selectOption("review");
  await page.getByRole("button", { name: "Ajouter la tâche" }).click();
  await expect(page.locator("[data-list]")).toContainText("Monter la vidéo");
  const jd = page.waitForEvent("download"); await page.getByRole("button", { name: "Télécharger JSON" }).click();
  const json = JSON.parse(await fs.readFile(await (await jd).path(), "utf8")); expect(json.tasks[0].status).toBe("review");
  const cd = page.waitForEvent("download"); await page.getByRole("button", { name: "Télécharger CSV" }).click();
  const csv = await fs.readFile(await (await cd).path(), "utf8"); expect(csv).toContain("Monter la vidéo");
  expect(outbound).toEqual([]);
});
test("French CreatorTeam fails closed without a task", async ({ page }) => {
  await page.goto(route);
  await page.getByLabel("Tâche").evaluate(input => { input.removeAttribute("required"); input.value = ""; });
  await page.getByRole("button", { name: "Ajouter la tâche" }).click();
  await expect(page.locator("[data-status]")).toContainText("Ajoutez");
  await expect(page.locator("[data-actions]")).toBeHidden();
});
test("French CreatorTeam reflows at mobile and 200 percent", async ({ page }) => {
  await page.setViewportSize({ width: 640, height: 900 }); await page.goto(route); await page.evaluate(() => { document.documentElement.style.zoom = "2"; });
  expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1)).toBe(false);
});
test("French CreatorTeam supports dark theme and focus", async ({ page }) => {
  await page.goto(route); await page.evaluate(() => document.documentElement.setAttribute("data-theme","dark")); await page.keyboard.press("Tab");
  expect(await page.evaluate(() => document.activeElement !== document.body)).toBe(true);
});
