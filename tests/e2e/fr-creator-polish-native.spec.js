const { test, expect } = require("@playwright/test");
const fs = require("node:fs/promises");
const route = "/fr/tools/amelioration-de-contenu-pour-createur/app";

test("French CreatorPolish is native with reciprocal metadata and artwork", async ({ page }) => {
  await page.goto(route);
  await expect(page.locator("html")).toHaveAttribute("lang", "fr");
  await expect(page.locator("iframe")).toHaveCount(0);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", "https://afrotools.com/fr/tools/amelioration-de-contenu-pour-createur/app");
  await expect(page.locator('link[hreflang="en"]')).toHaveAttribute("href", "https://afrotools.com/tools/creator-polish/app");
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute("content", /creator-polish\.webp$/);
});

test("French CreatorPolish analyses locally and reopens JSON and TXT", async ({ page }) => {
  const outbound = [];
  page.on("request", request => {
    if (!request.url().startsWith("http://127.0.0.1") && ["fetch", "xhr"].includes(request.resourceType())) outbound.push(request.url());
  });
  await page.goto(route);
  await page.getByLabel("Brouillon à réviser").fill("Le travail reste clair.  Le travail reste local.. Le travail doit ensuite être relu attentivement par une personne.");
  await page.getByRole("button", { name: "Réviser le brouillon" }).click();
  await expect(page.locator("[data-output]")).toContainText("Version nettoyée");
  const jsonDownload = page.waitForEvent("download");
  await page.getByRole("button", { name: "Télécharger JSON" }).click();
  const json = JSON.parse(await fs.readFile(await (await jsonDownload).path(), "utf8"));
  expect(json.language).toBe("fr");
  expect(json.cleaned).not.toContain("..");
  const txtDownload = page.waitForEvent("download");
  await page.getByRole("button", { name: "Télécharger TXT" }).click();
  const txt = await fs.readFile(await (await txtDownload).path(), "utf8");
  expect(txt).toContain("VERSION NETTOYÉE");
  expect(outbound).toEqual([]);
});

test("French CreatorPolish fails closed for short text", async ({ page }) => {
  await page.goto(route);
  await page.getByLabel("Brouillon à réviser").evaluate(input => { input.removeAttribute("minlength"); input.value = "Court"; });
  await page.getByRole("button", { name: "Réviser le brouillon" }).click();
  await expect(page.locator("[data-status]")).toContainText("20 caractères");
  await expect(page.locator("[data-output]")).toBeHidden();
});

test("French CreatorPolish reflows at mobile and 200 percent", async ({ page }) => {
  await page.setViewportSize({ width: 640, height: 900 });
  await page.goto(route);
  await page.evaluate(() => { document.documentElement.style.zoom = "2"; });
  expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1)).toBe(false);
});

test("French CreatorPolish supports theme and keyboard focus", async ({ page }) => {
  await page.goto(route);
  await page.evaluate(() => document.documentElement.setAttribute("data-theme", "dark"));
  await page.keyboard.press("Tab");
  expect(await page.evaluate(() => document.activeElement !== document.body)).toBe(true);
});
