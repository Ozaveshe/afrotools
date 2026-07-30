const { test, expect } = require("@playwright/test");

const route = "/fr/tools/kit-media-pour-createur/app";

test("French CreatorKit is native, reciprocal, and uses reviewed artwork", async ({ page }) => {
  await page.goto(route);
  await expect(page.locator("html")).toHaveAttribute("lang", "fr");
  await expect(page.locator("h1")).toContainText("carte tarifaire");
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", "https://afrotools.com/fr/tools/kit-media-pour-createur/app");
  await expect(page.locator('link[hreflang="en"]')).toHaveAttribute("href", "https://afrotools.com/tools/creator-kit/app");
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute("content", /creator-kit\.webp$/);
  await expect(page.locator("iframe")).toHaveCount(0);
});

test("French CreatorKit builds locally and reopens JSON and TXT exports", async ({ page }) => {
  const requests = [];
  page.on("request", request => {
    if (!request.url().startsWith("http://127.0.0.1") && ["fetch", "xhr"].includes(request.resourceType())) requests.push(request.url());
  });
  await page.goto(route);
  await page.getByLabel("Nom du créateur ou studio").fill("Studio Kora");
  await page.getByLabel("Service", { exact: true }).fill("Séance photo");
  await page.getByLabel("Prix").fill("125000");
  await page.getByLabel("Devise").selectOption("XOF");
  await page.getByRole("button", { name: "Créer la carte" }).click();
  await expect(page.locator("[data-output]")).toContainText("Studio Kora");
  await expect(page.locator("[data-output]")).toContainText("Séance photo");

  const jsonDownload = page.waitForEvent("download");
  await page.getByRole("button", { name: "Télécharger JSON" }).click();
  const json = JSON.parse(await require("node:fs/promises").readFile(await (await jsonDownload).path(), "utf8"));
  expect(json.name).toBe("Studio Kora");
  expect(json.currency).toBe("XOF");
  expect(json.services[0].price).toBe(125000);

  const textDownload = page.waitForEvent("download");
  await page.getByRole("button", { name: "Télécharger TXT" }).click();
  const text = await require("node:fs/promises").readFile(await (await textDownload).path(), "utf8");
  expect(text).toContain("Studio Kora");
  expect(text).toContain("Séance photo");
  expect(requests).toEqual([]);
});

test("French CreatorKit fails closed for an invalid price", async ({ page }) => {
  await page.goto(route);
  await page.getByLabel("Prix").evaluate(input => {
    input.removeAttribute("min");
    input.value = "-5";
  });
  await page.getByRole("button", { name: "Créer la carte" }).click();
  await expect(page.locator("[data-status]")).toContainText("Vérifiez");
  await expect(page.locator("[data-output]")).toBeHidden();
});

test("French CreatorKit reflows at 320px and 200 percent zoom", async ({ page }) => {
  await page.setViewportSize({ width: 640, height: 900 });
  await page.goto(route);
  await page.evaluate(() => { document.documentElement.style.zoom = "2"; });
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
  expect(overflow).toBe(false);
  await expect(page.getByRole("button", { name: "Créer la carte" })).toBeVisible();
});

test("French CreatorKit supports theme and keyboard focus", async ({ page }) => {
  await page.goto(route);
  await page.evaluate(() => document.documentElement.setAttribute("data-theme", "dark"));
  await page.keyboard.press("Tab");
  const focused = await page.evaluate(() => document.activeElement && document.activeElement !== document.body);
  expect(focused).toBe(true);
  await expect(page.locator("body")).toBeVisible();
});
