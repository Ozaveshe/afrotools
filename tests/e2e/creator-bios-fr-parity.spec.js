const { test, expect } = require("@playwright/test");
const fs = require("node:fs/promises");

const owners = [
  {
    locale: "en",
    route: "/tools/creator-bios/app.html",
    canonical: "https://afrotools.com/tools/creator-bios/app",
    who: "Amina Studio",
    what: "documentary portraits for African founders",
    ready: /Seven platform-ready/
  },
  {
    locale: "fr",
    route: "/fr/tools/bio-createur/app.html",
    canonical: "https://afrotools.com/fr/tools/bio-createur/app",
    who: "Studio Amina",
    what: "portraits documentaires pour les entreprises africaines",
    ready: /Sept brouillons/
  }
];

for (const owner of owners) {
  test(`${owner.locale} BioForge shares local generation, mutation and reopened exports`, async ({ page }) => {
    const profileSends = [];
    page.on("request", (request) => {
      const payload = `${request.url()} ${request.postData() || ""}`;
      if (/Amina Studio|Studio Amina|documentary portraits|portraits documentaires/i.test(payload)) {
        profileSends.push({ method: request.method(), url: request.url() });
      }
    });
    await page.goto(owner.route);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", owner.canonical);
    await expect(page.locator('link[rel="alternate"][hreflang="' + (owner.locale === "en" ? "fr" : "en") + '"]')).toHaveCount(1);

    await page.locator("form button[type=submit]").click();
    await expect(page.locator("[data-status]")).toHaveClass(/is-error/);
    await expect(page.locator("[data-results]")).toBeHidden();

    await page.locator("[name=who]").fill(owner.who);
    await page.locator("[name=what]").fill(owner.what);
    await page.locator("[name=location]").fill("Dakar");
    await page.locator("form button[type=submit]").click();
    await expect(page.locator("[data-status]")).toContainText(owner.ready);
    await expect(page.locator(".bio-result")).toHaveCount(7);
    if (owner.locale === "fr") {
      await expect(page.locator("body")).not.toContainText("Creator details");
      await expect(page.locator('[data-platform="linkedin_headline"] h2')).toHaveText("Titre LinkedIn");
    }
    const instagram = page.locator('[data-bio="instagram"]');
    await instagram.fill("A deliberately edited platform bio.");
    await expect(page.locator('[data-count="instagram"]')).toHaveText("35");

    const jsonDownload = page.waitForEvent("download");
    await page.locator("[data-export-json]").click();
    const json = JSON.parse(await fs.readFile(await (await jsonDownload).path(), "utf8"));
    expect(json.bios).toHaveLength(7);
    expect(json.bios[0].text).toBe("A deliberately edited platform bio.");

    const txtDownload = page.waitForEvent("download");
    await page.locator("[data-export-txt]").click();
    const txt = await fs.readFile(await (await txtDownload).path(), "utf8");
    expect(txt).toContain("A deliberately edited platform bio.");
    expect(profileSends).toEqual([]);
  });
}

test("French BioForge reflows at 320, 375 and 200 percent and supports keyboard focus", async ({ page }) => {
  for (const route of ["/fr/tools/bio-createur/", "/fr/tools/bio-createur/app.html"]) {
    for (const width of [320, 375]) {
      await page.setViewportSize({ width, height: 760 });
      await page.goto(route);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
    }
    await page.evaluate(() => { document.body.style.zoom = "200%"; });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  }
  await page.keyboard.press("Tab");
  await expect(page.locator(":focus")).toBeVisible();
});

test("French BioForge follows system dark mode and honors manual light mode", async ({ browser }) => {
  const system = await browser.newContext({ colorScheme: "dark" });
  const systemPage = await system.newPage();
  await systemPage.goto("/fr/tools/bio-createur/app.html");
  await expect(systemPage.locator("html")).toHaveAttribute("data-theme", "dark");
  await system.close();

  const manual = await browser.newContext({ colorScheme: "dark" });
  const manualPage = await manual.newPage();
  await manualPage.addInitScript(() => localStorage.setItem("aft_theme", "light"));
  await manualPage.goto("/fr/tools/bio-createur/app.html");
  await expect(manualPage.locator("html")).toHaveAttribute("data-theme", "light");
  await manual.close();
});
