const { test, expect } = require("@playwright/test");
const manifest = require("../../data/localization/sw-education-parity.json");

test("Swahili Education discovery hub exposes every assigned route", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 900 });
  const response = await page.goto("/sw/zana-za-elimu/", { waitUntil: "networkidle" });
  expect(response && response.ok()).toBeTruthy();
  await expect(page.locator("html")).toHaveAttribute("lang", "sw");
  const links = await page.locator("[data-sw-education-assigned-directory] a").evaluateAll((nodes) => nodes.map((node) => new URL(node.href).pathname));
  expect(new Set(links)).toEqual(new Set(manifest.routes.map((route) => route.swahili)));
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)).toBe(true);
});

for (const route of manifest.routes) {
  test(`${route.id}: Swahili shell, metadata, responsive reflow and themes`, async ({ page }) => {
    const errors = [];
    const documentRequests = [];
    const local404s = [];
    page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("request", (request) => {
      if (request.resourceType() === "document") documentRequests.push(new URL(request.url()).pathname);
    });
    page.on("response", (response) => {
      const url = new URL(response.url());
      if (url.origin === "http://127.0.0.1:4173" && response.status() === 404) local404s.push(url.pathname);
    });

    await page.setViewportSize({ width: 320, height: 900 });
    const response = await page.goto(route.swahili, { waitUntil: "networkidle" });
    expect(response && response.ok()).toBeTruthy();
    await expect(page.locator("html")).toHaveAttribute("lang", "sw");
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", `https://afrotools.com${route.swahili}`);
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute("content", /\/assets\/img\/tools\/.+\.webp$/);
    expect(await page.locator('script[type="application/ld+json"]').count()).toBeGreaterThan(0);
    expect(await page.locator("iframe").count()).toBe(0);
    expect(documentRequests).toEqual([route.swahili]);
    const overflow320 = await page.evaluate(() => ({
      documentWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
      elements: [...document.querySelectorAll("body *")]
        .filter((element) => element.getBoundingClientRect().right > document.documentElement.clientWidth + 1)
        .slice(0, 8)
        .map((element) => ({
          tag: element.tagName,
          id: element.id,
          className: String(element.className || ""),
          right: Math.round(element.getBoundingClientRect().right),
          width: Math.round(element.getBoundingClientRect().width)
        }))
    }));
    expect(overflow320.documentWidth, JSON.stringify(overflow320.elements)).toBeLessThanOrEqual(overflow320.clientWidth + 1);

    await page.setViewportSize({ width: 375, height: 900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)).toBe(true);

    await page.evaluate(() => { document.documentElement.dataset.theme = "light"; });
    const light = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    await page.evaluate(() => { document.documentElement.dataset.theme = "dark"; });
    const dark = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    expect(dark).not.toBe(light);

    await page.setViewportSize({ width: 640, height: 900 });
    await page.evaluate(() => { document.documentElement.style.fontSize = "200%"; });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)).toBe(true);
    await page.evaluate(() => { document.documentElement.style.fontSize = ""; });
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
    expect(local404s).toEqual([]);
  });
}

test("Education planner changes with inputs and reopens its advertised TXT export", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: async (text) => { window.__educationPlannerCopy = text; } }
    });
  });
  await page.goto("/sw/zana/kituo-elimu/", { waitUntil: "networkidle" });
  const before = await page.locator("#fitScore").textContent();
  await page.locator("#currentScore").fill("20");
  await page.locator("#calculateBtn").click();
  const after = await page.locator("#fitScore").textContent();
  expect(after).not.toBe(before);
  await page.locator("#copyBtn").click();
  expect(await page.evaluate(() => window.__educationPlannerCopy || "")).toContain("Alama ya utayari");
  const downloadPromise = page.waitForEvent("download");
  await page.locator("#downloadBtn").click();
  const download = await downloadPromise;
  const stream = await download.createReadStream();
  const chunks = [];
  for await (const chunk of stream) chunks.push(chunk);
  expect(Buffer.concat(chunks).toString("utf8")).toContain("Muhtasari wa mpango wa elimu");
});
