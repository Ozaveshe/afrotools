const {test, expect} = require("@playwright/test");
const fs = require("node:fs");
test("French CreatorHooks creates and reopens JSON/TXT locally", async ({page}) => {
  const sensitive = [], errors = [];
  page.on("request", request => { if (/supabase|netlify|\/api\/|ai-advisor|generate/i.test(request.url())) sensitive.push(request.url()); });
  page.on("console", message => { if (message.type() === "error") errors.push(message.text()); });
  await page.goto("/fr/tools/accroches-de-contenu-pour-createur/app");
  await expect(page.locator("html")).toHaveAttribute("lang", "fr");
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", "https://afrotools.com/fr/tools/accroches-de-contenu-pour-createur/app");
  await expect(page.locator('link[hreflang="en"]')).toHaveAttribute("href", "https://afrotools.com/tools/creator-hooks/app");
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute("content", /creator-hooks\.webp$/);
  await page.locator('[name="topic"]').fill("mode durable");
  await page.getByRole("button", {name: "Créer les accroches"}).click();
  await expect(page.locator(".ctn-result")).toHaveCount(6);
  const jsonEvent = page.waitForEvent("download");
  await page.getByRole("button", {name: "Télécharger JSON"}).click();
  const json = JSON.parse(fs.readFileSync(await (await jsonEvent).path(), "utf8"));
  expect(json.hooks).toHaveLength(6);
  expect(json.hooks.find(hook => hook.category === "statistic").text).toContain("vérifiez sa source");
  const txtEvent = page.waitForEvent("download");
  await page.getByRole("button", {name: "Télécharger TXT"}).click();
  expect(fs.readFileSync(await (await txtEvent).path(), "utf8").split(/\r?\n/)).toHaveLength(6);
  expect(sensitive).toEqual([]); expect(errors).toEqual([]);
});
test("French CreatorHooks fails closed without a topic", async ({page}) => {
  await page.goto("/fr/tools/accroches-de-contenu-pour-createur/app");
  await page.locator('[name="topic"]').fill("");
  await page.getByRole("button", {name: "Créer les accroches"}).click();
  await expect(page.locator("[data-status]")).toContainText("Ajoutez un sujet");
  await expect(page.locator("[data-actions]")).toBeHidden();
});
for (const entry of [{width:320,zoom:1},{width:640,zoom:2}]) test(`French CreatorHooks reflows ${entry.width}px ${entry.zoom}x`, async ({page}) => {
  await page.setViewportSize({width:entry.width,height:900}); await page.goto("/fr/tools/accroches-de-contenu-pour-createur/app");
  if (entry.zoom > 1) await page.evaluate(zoom => document.documentElement.style.zoom=String(zoom), entry.zoom);
  expect(await page.evaluate(() => document.documentElement.scrollWidth-document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
});
test("French CreatorHooks themes and focus", async ({page}) => {
  await page.goto("/fr/tools/accroches-de-contenu-pour-createur/app");
  await page.evaluate(() => document.documentElement.setAttribute("data-theme","light"));
  expect(await page.locator("body").evaluate(node => getComputedStyle(node).backgroundColor)).toBe("rgb(248, 250, 252)");
  await page.evaluate(() => document.documentElement.setAttribute("data-theme","dark"));
  expect(await page.locator("body").evaluate(node => getComputedStyle(node).backgroundColor)).not.toBe("rgb(248, 250, 252)");
  await page.locator('[name="topic"]').focus(); expect(await page.evaluate(() => document.activeElement.getAttribute("name"))).toBe("topic");
});
