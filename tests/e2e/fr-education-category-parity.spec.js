const { test, expect } = require("@playwright/test");
const manifest = require("../../data/localization/fr-education-parity.json");

test("French Education category hub exposes the exact 42-route programme", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 900 });
  const response = await page.goto("/fr/education/", { waitUntil: "networkidle" });
  expect(response && response.ok()).toBeTruthy();
  await expect(page.locator("html")).toHaveAttribute("lang", "fr");
  const links = await page.locator(".tools a").evaluateAll((nodes) => nodes.map((node) => new URL(node.href).pathname));
  expect(links).toEqual(manifest.routes.map((route) => route.french));
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)).toBe(true);
});

for (const route of manifest.routes) {
  test(`${route.id}: French shell, metadata, responsive reflow and themes`, async ({ page }) => {
    const errors = [];
    const documentRequests = [];
    page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("request", (request) => {
      if (request.resourceType() === "document") documentRequests.push(new URL(request.url()).pathname);
    });

    await page.setViewportSize({ width: 320, height: 900 });
    const response = await page.goto(route.french, { waitUntil: "networkidle" });
    expect(response && response.ok()).toBeTruthy();
    await expect(page.locator("html")).toHaveAttribute("lang", "fr");
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", `https://afrotools.com${route.french}`);
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute("content", /\/assets\/img\/tools\/.+\.webp$/);
    expect(await page.locator('script[type="application/ld+json"]').count()).toBeGreaterThan(0);
    expect(await page.locator("iframe").count()).toBe(0);
    expect(documentRequests).toEqual([route.french]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)).toBe(true);

    await page.setViewportSize({ width: 375, height: 900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)).toBe(true);

    await page.evaluate(() => { document.documentElement.dataset.theme = "light"; });
    const light = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    await page.evaluate(() => { document.documentElement.dataset.theme = "dark"; });
    const dark = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    expect(dark).not.toBe(light);

    await page.setViewportSize({ width: 640, height: 900 });
    await page.evaluate(() => { document.documentElement.dataset.theme = "light"; });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)).toBe(true);
    await page.evaluate(() => {
      delete document.documentElement.dataset.theme;
    });
    await page.emulateMedia({ colorScheme: "dark" });
    const systemDark = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    expect(systemDark).not.toBe(light);

    const focusable = page.locator("main a,main button,main input,main select,main textarea").first();
    await focusable.focus();
    expect(await focusable.evaluate((node) => node === document.activeElement)).toBe(true);
    expect(errors).toEqual([]);
  });
}

test("Education planner changes with inputs and reopens its advertised TXT export", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: async (text) => { window.__educationPlannerCopy = text; } }
    });
  });
  await page.goto("/fr/tools/hub-education/", { waitUntil: "networkidle" });
  const before = await page.locator("#readinessScore").textContent();
  await page.locator("#currentScore").fill("20");
  await page.locator("#edu-form button[type=submit]").click();
  const after = await page.locator("#readinessScore").textContent();
  expect(after).not.toBe(before);
  await page.locator("#copy-summary").click();
  expect(await page.evaluate(() => window.__educationPlannerCopy || "")).toContain("Score de préparation");
  const downloadPromise = page.waitForEvent("download");
  await page.locator("#export-summary").click();
  const download = await downloadPromise;
  const stream = await download.createReadStream();
  const chunks = [];
  for await (const chunk of stream) chunks.push(chunk);
  expect(Buffer.concat(chunks).toString("utf8")).toContain("Résumé Hub éducation Afrique");
});
