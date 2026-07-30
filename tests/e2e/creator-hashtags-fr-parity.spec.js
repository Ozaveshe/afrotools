const { test, expect } = require("@playwright/test");
const fs = require("node:fs/promises");

const routes = [
  { locale: "en", route: "/tools/creator-hashtags/app.html", canonical: "https://afrotools.com/tools/creator-hashtags/app", other: "fr" },
  { locale: "fr", route: "/fr/tools/hashtags-createur/app.html", canonical: "https://afrotools.com/fr/tools/hashtags-createur/app", other: "en" }
];

for (const owner of routes) {
  test(`${owner.locale} Creator Hashtags shares local workflow and reopened exports`, async ({ page }) => {
    const errors = [];
    let posts = 0;
    page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
    await page.route("**/.netlify/functions/creator-hashtags/**", async (route) => { posts += 1; await route.abort(); });
    await page.goto(owner.route);
    await expect(page.locator("html")).toHaveAttribute("lang", owner.locale);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", owner.canonical);
    await expect(page.locator(`link[rel="alternate"][hreflang="${owner.other}"]`)).toHaveCount(1);

    await page.locator("#generateBtn").click();
    await expect(page.locator("#topicInput")).toHaveAttribute("aria-invalid", "true");
    await expect(page.locator(".cht-set-card")).toHaveCount(0);

    await page.locator("#topicInput").fill(owner.locale === "fr" ? "coulisses photo mariage à Dakar" : "wedding photo behind the scenes in Lagos");
    await page.locator("#generateBtn").click();
    await expect(page.locator(".cht-set-card")).toHaveCount(3);
    await expect(page.locator(".cht-tag")).toHaveCount(45);
    expect(posts).toBe(0);

    const jsonEvent = page.waitForEvent("download");
    await page.locator("#downloadJson").click();
    const json = JSON.parse(await fs.readFile(await (await jsonEvent).path(), "utf8"));
    expect(json.sets).toHaveLength(3);
    expect(json.sets[0].tags).toHaveLength(15);

    const txtEvent = page.waitForEvent("download");
    await page.locator("#downloadTxt").click();
    const txt = await fs.readFile(await (await txtEvent).path(), "utf8");
    expect((txt.match(/^#\S+/gm) || []).length).toBeGreaterThan(0);
    expect(errors).toEqual([]);
  });
}

test("French AI transport is fail-closed until exact explicit consent", async ({ page }) => {
  const requests = [];
  await page.route("**/.netlify/functions/creator-hashtags/generate", async (route) => {
    requests.push(route.request().postDataJSON());
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ output: { sets: [
        { name: "IA 1", strategy: "Test", tags: [{ tag: "#Dakar", reach: "niche" }] },
        { name: "IA 2", strategy: "Test", tags: [{ tag: "#Createurs", reach: "mid" }] },
        { name: "IA 3", strategy: "Test", tags: [{ tag: "#Afrique", reach: "niche" }] }
      ] } })
    });
  });
  await page.goto("/fr/tools/hashtags-createur/app.html");
  await page.locator("#topicInput").fill("annonce consentie à Dakar");
  await page.locator("#generationMode").selectOption("ai");
  await page.locator("#generateBtn").click();
  expect(requests).toHaveLength(0);
  await expect(page.locator("#aiConsentWrap")).toBeVisible();
  await page.locator("#aiConsent").check();
  await page.locator("#generateBtn").click();
  await expect.poll(() => requests.length).toBe(1);
  expect(requests[0].topic).toBe("annonce consentie à Dakar");
  expect(requests[0].platform).toBe("instagram");
  expect(requests[0].consent).toBe(true);
  await expect(page.locator(".cht-set-card")).toHaveCount(3);
});

for (const width of [320, 375]) {
  test(`French Creator Hashtags reflows at ${width}px with keyboard controls`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/fr/tools/hashtags-createur/app.html");
    await page.locator("#topicInput").fill("atelier mobile à Dakar");
    await page.locator("#generateBtn").click();
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
    await page.keyboard.press("Tab");
    await expect(page.locator(":focus")).toBeVisible();
    await page.locator(".cht-tag").first().focus();
    await page.keyboard.press("Enter");
    await expect(page.locator(".cht-tag").first()).toHaveAttribute("aria-pressed", "true");
  });
}

test("French launcher and workspace honor manual/system dark mode and 200 percent reflow", async ({ browser }) => {
  const system = await browser.newContext({ colorScheme: "dark", viewport: { width: 640, height: 900 } });
  const page = await system.newPage();
  for (const route of ["/fr/tools/hashtags-createur/", "/fr/tools/hashtags-createur/app.html"]) {
    await page.goto(route);
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    await page.evaluate(() => { document.body.style.zoom = "200%"; });
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
  }
  await system.close();

  const manual = await browser.newContext({ colorScheme: "dark" });
  const manualPage = await manual.newPage();
  await manualPage.addInitScript(() => localStorage.setItem("aft_theme", "light"));
  await manualPage.goto("/fr/tools/hashtags-createur/app.html");
  await expect(manualPage.locator("html")).toHaveAttribute("data-theme", "light");
  await manual.close();
});

test("French launcher exposes aligned SEO, schema, artwork and reciprocal discovery", async ({ page }) => {
  await page.goto("/fr/tools/hashtags-createur/");
  await expect(page.locator("html")).toHaveAttribute("lang", "fr");
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", "https://afrotools.com/fr/tools/hashtags-createur/");
  await expect(page.locator('link[hreflang="en"]')).toHaveAttribute("href", "https://afrotools.com/tools/creator-hashtags/");
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute("content", /creator-hashtags\.webp$/);
  const schema = JSON.parse(await page.locator('script[type="application/ld+json"]').textContent());
  expect(schema.inLanguage).toBe("fr");
  expect(schema.isBasedOn).toBe("https://afrotools.com/tools/creator-hashtags/");
  await expect(page.getByRole("link", { name: /Créer mes jeux/ })).toHaveAttribute("href", "/fr/tools/hashtags-createur/app");
});
