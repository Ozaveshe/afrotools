const fs = require("node:fs");
const { expect, test } = require("@playwright/test");

const apps = [
  { id: "africa-flight", slug: "prix-vols-afrique", valid: async (p) => { await p.locator('[name="quoteLow"]').fill("100"); await p.locator('[name="quoteHigh"]').fill("160"); } },
  { id: "airbnb-vs-hotel", slug: "airbnb-vs-hotel", valid: async (p) => { await p.locator('[name="city"]').fill("Dakar"); await p.locator('[name="hotelNight"]').fill("100"); await p.locator('[name="rentalNight"]').fill("80"); } },
  { id: "airport-transfer", slug: "transfert-aeroport", valid: async (p) => { await p.locator('[name="taxi"]').fill("40"); await p.locator('[name="rideHail"]').fill("30"); } },
  { id: "beach-holiday-budget", slug: "budget-vacances-plage", valid: async (p) => { await p.locator('[name="lodgingNight"]').fill("100"); } },
  { id: "festival-travel-budget", slug: "budget-voyage-festival", valid: async (p) => { await p.locator('[name="eventName"]').fill("Événement de test"); await p.locator('[name="destination"]').fill("Saint-Louis, Sénégal"); await p.locator('[name="eventDate"]').fill("2026-10-10"); await p.locator('[name="ticketEach"]').fill("20"); await p.locator('[name="scheduleConfirmed"]').check(); } },
  { id: "hotel-star-guide", slug: "guide-prix-hotels", valid: async (p) => { await p.locator('[name="city"]').fill("Yaoundé"); await p.locator('[name="offerAName"]').fill("Offre A"); await p.locator('[name="offerBName"]').fill("Offre B"); await p.locator('[name="offerANight"]').fill("100"); await p.locator('[name="offerBNight"]').fill("120"); } },
  { id: "safari-cost", slug: "calculateur-du-cout-d-un-safari", valid: async (p) => { await p.locator('[name="operatorDayEach"]').fill("200"); await p.locator('[name="officialFeesConfirmed"]').check(); } },
  { id: "travel-packing-list", slug: "liste-bagages-voyage", valid: async (p) => { await p.locator('[name="documentsChecked"]').check(); } },
  { id: "travel-vaccination-cost", slug: "preparer-consultation-sante-voyage", valid: async (p) => { await p.locator('[name="origin"]').fill("Sénégal"); await p.locator('[name="destination"]').fill("Cameroun"); await p.locator('[name="departureDate"]').fill("2026-10-10"); await p.locator('[name="clinicalBoundaryConfirmed"]').check(); } },
];

for (const app of apps) {
  test(`${app.id}: invalid, valid, JSON reopen, PDF, AI consent and 320/375/200% proof`, async ({ page }) => {
    const consoleErrors = [];
    const prohibited = [];
    page.on("console", (message) => { if (message.type() === "error") consoleErrors.push(message.text()); });
    page.on("pageerror", (error) => consoleErrors.push(error.message));
    page.on("request", (request) => {
      const method = request.method();
      const url = request.url();
      if (/capture-lead|workspace|\/api\/|ai-advisor/i.test(url) || (method !== "GET" && /supabase/i.test(url))) prohibited.push(`${method} ${url}`);
    });
    await page.setViewportSize({ width: 320, height: 800 });
    await page.emulateMedia({ colorScheme: "dark", reducedMotion: "reduce" });
    await page.goto(`/fr/tools/${app.slug}/`, { waitUntil: "domcontentloaded" });
    await page.evaluate(() => document.documentElement.setAttribute("data-theme", "dark"));

    await expect(page.locator("html")).toHaveAttribute("lang", "fr");
    await expect(page.locator("[data-fr-travel-boundary]")).toBeVisible();
    const darkTextColor = await page.locator("body").evaluate((node) => getComputedStyle(node).color);
    await page.locator('[data-fr-travel-form] [type="submit"]').click();
    await expect(page.locator("[data-fr-travel-error]")).not.toBeEmpty();

    await app.valid(page);
    await page.locator('[data-fr-travel-form] [type="submit"]').focus();
    await page.keyboard.press("Enter");
    await expect(page.locator("[data-fr-travel-result]")).toBeVisible();
    await expect(page.locator("[data-fr-travel-output]")).not.toContainText(/\b(?:NaN|undefined|null)\b/i);

    const jsonDownload = page.waitForEvent("download");
    await page.locator("[data-export-json]").click();
    const json = await jsonDownload;
    const jsonPath = await json.path();
    const payload = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
    expect(payload.toolId).toBe(app.id);
    expect(payload.schemaVersion).toBe(1);
    await page.locator("[data-import-file]").setInputFiles(jsonPath);
    await expect(page.locator("[data-fr-travel-status]")).toContainText("rouvert");

    const pdfDownload = page.waitForEvent("download");
    await page.locator("[data-export-pdf]").click();
    const pdf = await pdfDownload;
    const pdfPath = await pdf.path();
    const pdfBytes = fs.readFileSync(pdfPath);
    expect(pdfBytes.subarray(0, 5).toString("ascii")).toBe("%PDF-");
    expect(pdfBytes.length).toBeGreaterThan(1000);

    await expect(page.locator("[data-ai-prompt]")).toBeDisabled();
    await page.locator("[data-ai-consent]").check();
    await page.locator("[data-ai-prompt]").click();
    await expect(page.locator("[data-ai-output]")).toContainText("préparée localement");

    const unlabeled = await page.locator("[data-fr-travel-form] input:not([hidden]), [data-fr-travel-form] select, [data-fr-travel-form] textarea").evaluateAll((nodes) => nodes.filter((node) => {
      if (node.type === "hidden" || node.hidden) return false;
      return !node.closest("label") && !(node.id && document.querySelector(`label[for="${node.id}"]`));
    }).length);
    expect(unlabeled).toBe(0);

    await page.setViewportSize({ width: 375, height: 812 });
    await page.evaluate(() => document.documentElement.setAttribute("data-theme", "light"));
    const lightTextColor = await page.locator("body").evaluate((node) => getComputedStyle(node).color);
    expect(lightTextColor).not.toBe(darkTextColor);
    expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1)).toBeFalsy();
    await page.setViewportSize({ width: 188, height: 812 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1)).toBeFalsy();

    await page.locator("[data-fr-travel-reset]").click();
    await expect(page.locator("[data-fr-travel-result]")).toBeHidden();
    await expect(page.locator("form input:not([type=checkbox]), form select, form textarea").first()).toBeFocused();
    expect(prohibited).toEqual([]);
    expect(consoleErrors).toEqual([]);
  });
}

test("French Travel hub renders exactly nine artwork-backed routes without overflow", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto("/fr/travel/", { waitUntil: "domcontentloaded" });
  await expect(page.locator(".frt-tool-card")).toHaveCount(9);
  await expect(page.locator(".frt-tool-card img")).toHaveCount(9);
  expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1)).toBeFalsy();
  await page.setViewportSize({ width: 188, height: 800 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1)).toBeFalsy();
});

for (const surface of [
  { name: "English non-Travel app", route: "/tools/age-calculator/" },
  { name: "French homepage", route: "/fr/" },
]) {
  test(`${surface.name}: shared navigation and footer reflow at 320px and 200%`, async ({ page }) => {
    const sharedComponentsOverflow = () => page.evaluate(() => ["afro-navbar", "afro-footer"].filter((selector) => {
      const node = document.querySelector(selector);
      return node && node.scrollWidth > node.clientWidth + 1;
    }));
    await page.setViewportSize({ width: 320, height: 800 });
    await page.goto(surface.route, { waitUntil: "domcontentloaded" });
    expect(await sharedComponentsOverflow()).toEqual([]);
    await page.setViewportSize({ width: 188, height: 800 });
    expect(await sharedComponentsOverflow()).toEqual([]);
    const burger = page.locator("afro-navbar").locator(".burger");
    await expect(burger).toBeVisible();
    await burger.click();
    await expect(burger).toHaveAttribute("aria-expanded", "true");
    await expect(page.locator("afro-navbar").locator(".mob.open")).toBeVisible();
    await burger.click();
    await expect(burger).toHaveAttribute("aria-expanded", "false");
  });
}
