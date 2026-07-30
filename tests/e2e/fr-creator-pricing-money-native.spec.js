const { test, expect } = require("@playwright/test");

const routes = [
  {
    name: "pricing",
    launcher: "/fr/tools/tarification-pour-createur/",
    app: "/fr/tools/tarification-pour-createur/app",
    canonical: "https://afrotools.com/fr/tools/tarification-pour-createur/app",
    artwork: "creator-pricing.webp",
    calculate: async (page) => {
      await page.selectOption('[name="craft"]', "design");
      await page.selectOption('[name="country"]', "SN");
      await page.selectOption('[name="experience"]', "established");
      await page.click('button[type="submit"]');
      await expect(page.locator("[data-results]")).toBeVisible();
      await expect(page.locator("[data-results]")).toContainText("Tarif journalier");
    }
  },
  {
    name: "money",
    launcher: "/fr/tools/revenus-du-createur/",
    app: "/fr/tools/revenus-du-createur/app",
    canonical: "https://afrotools.com/fr/tools/revenus-du-createur/app",
    artwork: "creator-money.webp",
    calculate: async (page) => {
      await page.fill('[name="income"]', "500000");
      await page.fill('[name="expenses"]', "180000");
      await page.fill('[name="monthlyHours"]', "120");
      await page.fill('[name="taxRate"]', "10");
      await page.fill('[name="ownerPayRate"]', "50");
      await page.fill('[name="reinvestmentRate"]', "20");
      await page.click('button[type="submit"]');
      await expect(page.locator("[data-results]")).toBeVisible();
      await expect(page.locator("[data-results]")).toContainText("320");
    }
  }
];

for (const route of routes) {
  test(`${route.name}: native workflow, exports, privacy and metadata`, async ({ page }) => {
    const errors = [];
    const sensitiveRequests = [];
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("request", (request) => {
      if (
        /supabase|netlify|\/api\/|openai|anthropic|ai-advisor|generate/i.test(request.url()) &&
        (
          !["GET", "HEAD"].includes(request.method()) ||
          ["fetch", "xhr"].includes(request.resourceType())
        )
      ) {
        sensitiveRequests.push(request.url());
      }
    });

    await page.setViewportSize({ width: 320, height: 900 });
    await page.goto(route.launcher);
    await expect(page.locator("html")).toHaveAttribute("lang", "fr");
    await expect(page.locator('a[href="' + route.app + '"]')).toBeVisible();
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute("content", new RegExp(route.artwork));
    await expect(page.locator("body")).not.toContainText("Open the full calculator");
    let overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(1);

    await page.goto(route.app);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", route.canonical);
    await expect(page.locator('link[hreflang="en"]')).toHaveCount(1);
    await expect(page.locator('link[hreflang="fr"]')).toHaveCount(1);
    await route.calculate(page);
    overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(1);

    await page.emulateMedia({ colorScheme: "dark" });
    let darkBg = await page.locator(".cf-card").first().evaluate((el) => getComputedStyle(el).backgroundColor);
    expect(darkBg).not.toBe("rgb(255, 255, 255)");
    await page.emulateMedia({ colorScheme: "light" });
    await page.evaluate(() => { document.documentElement.dataset.theme = "dark"; });
    darkBg = await page.locator(".cf-card").first().evaluate((el) => getComputedStyle(el).backgroundColor);
    expect(darkBg).not.toBe("rgb(255, 255, 255)");
    await page.evaluate(() => { delete document.documentElement.dataset.theme; });

    await page.setViewportSize({ width: 640, height: 900 });
    await page.evaluate(() => { document.documentElement.style.zoom = "2"; });
    overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(1);
    await page.evaluate(() => { document.documentElement.style.zoom = ""; });

    await page.emulateMedia({ colorScheme: "dark" });
    darkBg = await page.locator(".cf-card").first().evaluate((el) => getComputedStyle(el).backgroundColor);
    expect(darkBg).not.toBe("rgb(255, 255, 255)");
    await page.emulateMedia({ colorScheme: "light" });

    await page.keyboard.press("Tab");
    await expect(page.locator(":focus")).toBeVisible();

    const jsonDownload = page.waitForEvent("download");
    await page.click("[data-json]");
    const json = await jsonDownload;
    const jsonText = await require("fs").promises.readFile(await json.path(), "utf8");
    const parsed = JSON.parse(jsonText);
    expect(parsed.tool).toBe("creator-" + route.name);
    expect(parsed.locale).toBe("fr");

    const txtDownload = page.waitForEvent("download");
    await page.click("[data-txt]");
    const txt = await txtDownload;
    const txtText = await require("fs").promises.readFile(await txt.path(), "utf8");
    expect(txtText.length).toBeGreaterThan(80);

    await page.click("[data-copy]");
    await expect(page.locator("[data-status]")).not.toBeEmpty();
    expect(sensitiveRequests).toEqual([]);
    expect(errors).toEqual([]);
  });

  test(`${route.name}: 375px and forced French copy`, async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(route.app);
    await route.calculate(page);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(1);
    const text = await page.locator("main").innerText();
    expect(text).not.toMatch(/Calculate my rates|Build my monthly plan|Suggested daily rate|Operating profit|Download JSON|Copy summary/);
  });
}
