const {test, expect} = require("@playwright/test");
const fs = require("node:fs");

test("French CreatorTitles generates and reopens JSON/TXT locally", async ({page}) => {
  const sensitive = [], errors = [];
  page.on("request", request => { if (/supabase|netlify|\/api\/|ai-advisor|generate/i.test(request.url())) sensitive.push(request.url()); });
  page.on("console", message => { if (message.type() === "error") errors.push(message.text()); });
  await page.goto("/fr/tools/titres-de-contenu-pour-createur/app");
  await expect(page.locator("html")).toHaveAttribute("lang", "fr");
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", "https://afrotools.com/fr/tools/titres-de-contenu-pour-createur/app");
  await expect(page.locator('link[hreflang="en"]')).toHaveAttribute("href", "https://afrotools.com/tools/creator-titles/app");
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute("content", /creator-titles\.webp$/);
  await page.locator('[name="topic"]').fill("mode durable");
  await page.getByRole("button", {name: "Créer les titres"}).click();
  await expect(page.locator(".ctn-result")).toHaveCount(8);
  await expect(page.locator(".ctn-result").first()).toContainText("mode durable");
  const jsonEvent = page.waitForEvent("download");
  await page.getByRole("button", {name: "Télécharger JSON"}).click();
  const json = JSON.parse(fs.readFileSync(await (await jsonEvent).path(), "utf8"));
  expect(json.titles).toHaveLength(8);
  expect(json.language).toBe("fr");
  const txtEvent = page.waitForEvent("download");
  await page.getByRole("button", {name: "Télécharger TXT"}).click();
  const txt = fs.readFileSync(await (await txtEvent).path(), "utf8");
  expect(txt.split(/\r?\n/)).toHaveLength(8);
  expect(sensitive).toEqual([]);
  expect(errors).toEqual([]);
});

test("French CreatorTitles fails closed without a topic", async ({page}) => {
  await page.goto("/fr/tools/titres-de-contenu-pour-createur/app");
  await page.locator('[name="topic"]').fill("");
  await page.getByRole("button", {name: "Créer les titres"}).click();
  await expect(page.locator("[data-status]")).toContainText("Ajoutez un sujet");
  await expect(page.locator("[data-actions]")).toBeHidden();
});

for (const entry of [{width: 320, zoom: 1}, {width: 640, zoom: 2}]) {
  test(`French CreatorTitles reflows at ${entry.width}px and ${entry.zoom}x`, async ({page}) => {
    await page.setViewportSize({width: entry.width, height: 900});
    await page.goto("/fr/tools/titres-de-contenu-pour-createur/app");
    if (entry.zoom > 1) await page.evaluate(zoom => document.documentElement.style.zoom = String(zoom), entry.zoom);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
  });
}

test("French CreatorTitles supports light and dark themes and keyboard focus", async ({page}) => {
  await page.goto("/fr/tools/titres-de-contenu-pour-createur/app");
  await page.evaluate(() => document.documentElement.setAttribute("data-theme", "light"));
  expect(await page.locator("body").evaluate(node => getComputedStyle(node).backgroundColor)).toBe("rgb(248, 250, 252)");
  await page.evaluate(() => document.documentElement.setAttribute("data-theme", "dark"));
  expect(await page.locator("body").evaluate(node => getComputedStyle(node).backgroundColor)).not.toBe("rgb(248, 250, 252)");
  await page.locator('[name="topic"]').focus();
  expect(await page.evaluate(() => document.activeElement && document.activeElement.getAttribute("name"))).toBe("topic");
});
