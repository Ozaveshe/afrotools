const {test, expect} = require("@playwright/test");
const fs = require("node:fs");

test("French CreatorCalendar builds and reopens JSON and CSV", async ({page}) => {
  const sensitive = [];
  const errors = [];
  page.on("request", request => { if (/supabase|netlify|\/api\/|ai-advisor|generate/i.test(request.url())) sensitive.push(request.url()); });
  page.on("console", message => { if (message.type() === "error") errors.push(message.text()); });
  await page.goto("/fr/tools/calendrier-createur/app");
  await expect(page.locator("html")).toHaveAttribute("lang", "fr");
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", "https://afrotools.com/fr/tools/calendrier-createur/app");
  await expect(page.locator('link[rel="alternate"][hreflang="en"]')).toHaveAttribute("href", "https://afrotools.com/tools/creator-calendar/app");
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute("content", /creator-calendar\.webp$/);
  expect(await page.locator('script[type="application/ld+json"]').evaluateAll(nodes => nodes.every(node => {
    try { JSON.parse(node.textContent); return true; } catch (_) { return false; }
  }))).toBe(true);
  await page.keyboard.press("Tab");
  expect(await page.evaluate(() => document.activeElement !== document.body)).toBe(true);
  await page.locator('[name="topic"]').fill("Mode durable");
  await page.locator('[name="days"]').fill("5");
  await page.getByRole("button", {name: "Créer le calendrier"}).click();
  await expect(page.locator("[data-output] tbody tr")).toHaveCount(5);
  const jsonEvent = page.waitForEvent("download");
  await page.getByRole("button", {name: "Télécharger JSON"}).click();
  const json = JSON.parse(fs.readFileSync(await (await jsonEvent).path(), "utf8"));
  expect(json.topic).toBe("Mode durable");
  expect(json.posts).toHaveLength(5);
  const csvEvent = page.waitForEvent("download");
  await page.getByRole("button", {name: "Télécharger CSV"}).click();
  const csv = fs.readFileSync(await (await csvEvent).path(), "utf8");
  expect(csv).toContain('"Jour","Date","Plateforme","Heure","Angle"');
  expect(csv.split(/\r?\n/)).toHaveLength(6);
  expect(sensitive).toEqual([]);
  expect(errors).toEqual([]);
});

test("French CreatorCalendar supports explicit light and dark themes", async ({page}) => {
  await page.goto("/fr/tools/calendrier-createur/app");
  await page.evaluate(() => document.documentElement.setAttribute("data-theme", "light"));
  expect(await page.locator("body").evaluate(node => getComputedStyle(node).backgroundColor)).toBe("rgb(248, 250, 252)");
  await page.evaluate(() => document.documentElement.setAttribute("data-theme", "dark"));
  expect(await page.locator("body").evaluate(node => getComputedStyle(node).backgroundColor)).not.toBe("rgb(248, 250, 252)");
});

test("French CreatorCalendar fails closed without a platform", async ({page}) => {
  await page.goto("/fr/tools/calendrier-createur/app");
  for (const checkbox of await page.locator('[name="platform"]').all()) await checkbox.uncheck();
  await page.getByRole("button", {name: "Créer le calendrier"}).click();
  await expect(page.locator("[data-status]")).toContainText("plateforme");
  await expect(page.locator("[data-export-actions]")).toBeHidden();
});

for (const entry of [{width: 320, zoom: 1}, {width: 640, zoom: 2}]) {
  test(`French CreatorCalendar reflows at ${entry.width}px viewport and ${entry.zoom}x zoom`, async ({page}) => {
    await page.setViewportSize({width: entry.width, height: 900});
    await page.goto("/fr/tools/calendrier-createur/app");
    if (entry.zoom !== 1) await page.evaluate(zoom => { document.documentElement.style.zoom = String(zoom); }, entry.zoom);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
    await expect(page.getByRole("button", {name: "Créer le calendrier"})).toBeVisible();
  });
}
