const { test, expect } = require("@playwright/test");
const fs = require("node:fs/promises");

const route = "/fr/tools/afrostream-afrique-s-createur-streaming-hub/";

async function noOverflow(page, width) {
  await page.setViewportSize({ width, height: 900 });
  await expect.poll(() => page.evaluate(() =>
    document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1
  )).toBe(true);
}

async function download(page, selector) {
  const pending = page.waitForEvent("download");
  await page.locator(selector).click();
  const item = await pending;
  return {
    name: item.suggestedFilename(),
    buffer: await fs.readFile(await item.path()),
  };
}

test("AfroStream French discovery is native, fresh, filter-local and exportable", async ({ page }) => {
  test.setTimeout(120000);
  const pageErrors = [];
  const consoleErrors = [];
  const apiRequests = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("request", (request) => {
    if (request.url().includes("/api/afrostream")) apiRequests.push(request.url());
  });
  await page.route("**/api/afrostream/creators", (requestRoute) => requestRoute.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({
      success: true,
      data: [
        {
          name: "Amina Studio",
          country: "Senegal",
          primary_platform: "youtube",
          categories: "Education",
          subscribers: 12000,
          afro_score: 88,
          slug: "amina-studio",
          updated_at: "2026-07-28T12:00:00Z",
        },
        {
          name: "Kofi Creates",
          country: "Nigeria",
          primary_platform: "instagram",
          categories: "Design",
          subscribers: 5400,
          afro_score: 71,
          slug: "kofi-creates",
          updated_at: "2026-07-27T08:00:00Z",
        },
      ],
    }),
  }));
  await page.route("**/api/afrostream/streams", (requestRoute) => requestRoute.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({ success: true, data: [] }),
  }));
  await page.route("**/api/afrostream/news", (requestRoute) => requestRoute.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({
      success: true,
      data: [{
        title: "Mise à jour des créateurs",
        category: "Actualité",
        excerpt: "Fixture éditoriale synthétique.",
        slug: "mise-a-jour",
        published_at: "2026-07-28T10:00:00Z",
      }],
    }),
  }));
  await page.addInitScript(() => {
    localStorage.setItem("afrotools_cookie_consent", "declined");
    localStorage.setItem("aft_theme", "light");
  });

  await page.goto(route);
  await expect(page.locator("html")).toHaveAttribute("lang", "fr");
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    "https://afrotools.com/fr/tools/afrostream-afrique-s-createur-streaming-hub/"
  );
  await expect(page.locator('link[hreflang="en"]')).toHaveAttribute(
    "href",
    "https://afrotools.com/tools/afrostream/"
  );
  await expect(page.locator('meta[name="geo.region"]')).toHaveAttribute("content", "002");
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
    "content",
    "https://afrotools.com/assets/img/tools/afrostream.webp"
  );
  await expect(page.locator("iframe")).toHaveCount(0);
  await expect(page.locator(".afs-creator")).toHaveCount(2);
  await expect(page.locator("#afsStatus")).toHaveText("2 profils affichés.");
  await expect(page.locator("#afsFreshness")).toContainText("2026");
  await expect(page.locator(".afs-news-item")).toHaveCount(1);
  expect(apiRequests).toHaveLength(3);
  expect(apiRequests.every((url) => !url.includes("Amina"))).toBe(true);

  await page.getByLabel("Rechercher dans les profils chargés").fill("Amina");
  await expect(page.locator(".afs-creator")).toHaveCount(1);
  await expect(page.locator(".afs-creator h3")).toHaveText("Amina Studio");
  expect(apiRequests).toHaveLength(3);

  const json = await download(page, "#afsExportJson");
  expect(json.name).toBe("afrostream-createurs-fr.json");
  const parsed = JSON.parse(json.buffer.toString("utf8"));
  expect(parsed.source).toBe("/api/afrostream/creators");
  expect(parsed.creators).toHaveLength(1);
  expect(parsed.creators[0].name).toBe("Amina Studio");

  const csv = await download(page, "#afsExportCsv");
  expect(csv.name).toBe("afrostream-createurs-fr.csv");
  expect(csv.buffer.toString("utf8")).toContain('"Amina Studio"');
  expect(csv.buffer.toString("utf8")).not.toContain('"Kofi Creates"');

  await page.getByLabel("Rechercher dans les profils chargés").focus();
  await expect(page.getByLabel("Rechercher dans les profils chargés")).toBeFocused();
  await noOverflow(page, 320);
  await noOverflow(page, 375);
  await page.setViewportSize({ width: 640, height: 900 });
  await page.evaluate(() => { document.documentElement.style.zoom = "2"; });
  await expect.poll(() => page.evaluate(() =>
    document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1
  )).toBe(true);
  await page.evaluate(() => {
    document.documentElement.style.zoom = "";
    document.documentElement.setAttribute("data-theme", "dark");
  });
  const dark = await page.locator(".afs-page").evaluate((element) => getComputedStyle(element).backgroundColor);
  await page.evaluate(() => document.documentElement.setAttribute("data-theme", "light"));
  const light = await page.locator(".afs-page").evaluate((element) => getComputedStyle(element).backgroundColor);
  expect(dark).not.toBe(light);
  expect(pageErrors).toEqual([]);
  expect(consoleErrors).toEqual([]);
});

test("AfroStream French route fails closed when public data is unavailable", async ({ page }) => {
  await page.route("**/api/afrostream/**", (requestRoute) => requestRoute.fulfill({
    status: 503,
    contentType: "application/json",
    body: JSON.stringify({ success: false }),
  }));
  await page.goto(route);
  await expect(page.locator("#afsStatus")).toHaveText(
    "Les données AfroStream sont indisponibles. Aucun profil fictif n’est affiché."
  );
  await expect(page.locator(".afs-creator")).toHaveCount(0);
  await expect(page.locator("#afsExportJson")).toBeDisabled();
  await expect(page.locator("#afsExportCsv")).toBeDisabled();
});
