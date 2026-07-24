const { test, expect } = require("@playwright/test");

const routes = [
  {
    name: "en",
    path: "/tools/etims-guide/",
    lang: "en",
    canonical: "https://afrotools.com/tools/etims-guide/",
    heading: "Understand the route, then invoice only on official KRA systems",
    width: 320,
  },
  {
    name: "fr",
    path: "/fr/tools/guide-d-etims-de-la-kra/",
    lang: "fr",
    canonical: "https://afrotools.com/fr/tools/guide-d-etims-de-la-kra/",
    heading: "Comprenez le parcours, puis facturez uniquement sur les systèmes officiels de la KRA",
    width: 375,
  },
];

for (const route of routes) {
  test(`${route.name} eTIMS guide is safe and usable in dark mobile`, async ({ page }) => {
    const errors = [];
    const nonGet = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });
    page.on("request", (request) => {
      if (request.method() !== "GET") nonGet.push(`${request.method()} ${request.url()}`);
    });
    await page.emulateMedia({ colorScheme: "dark", reducedMotion: "reduce" });
    await page.setViewportSize({ width: route.width, height: 812 });
    await page.goto(route.path, { waitUntil: "networkidle" });
    await expect(page.locator("html")).toHaveAttribute("lang", route.lang);
    await expect(page.locator("h1")).toHaveText(route.heading);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", route.canonical);
    expect(await page.locator('link[rel="alternate"]').count()).toBe(3);
    const official = page.locator(".et-official");
    await expect(official).toHaveAttribute("href", "https://etims.kra.go.ke/");
    await expect(official).toHaveAttribute("rel", /noopener/);
    await official.focus();
    const focus = await official.evaluate((node) => getComputedStyle(node));
    expect(focus.outlineStyle).toBe("solid");
    expect(parseFloat(focus.outlineWidth)).toBeGreaterThanOrEqual(3);
    await page.locator('a[href="#onboard"]').click();
    await expect(page.locator("#onboard")).toBeInViewport();
    expect(await page.locator(".et-main input,.et-main textarea,.et-main select,.et-main form").count()).toBe(0);
    expect(await page.locator('a[href^="https://www.kra.go.ke/"]').count()).toBeGreaterThanOrEqual(5);
    await expect(page.locator('[data-tool-verification-panel][data-tool-id="etims-guide"]')).toBeVisible();
    await page.evaluate(() => {
      if (!document.querySelector("afro-site-assistant")) document.body.appendChild(document.createElement("afro-site-assistant"));
    });
    await expect(page.locator("afro-site-assistant")).toBeHidden();
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);
    const html = await page.locator("html").evaluate((node) => node.outerHTML);
    expect(html).not.toMatch(/type=["'](?:password|file)|fetch\(|XMLHttpRequest|\.netlify\/functions|create your invoice|verify your invoice/i);
    expect(nonGet).toEqual([]);
    expect(errors).toEqual([]);
    await page.screenshot({ path: `artifacts/day3-finance-etims-guide/etims-guide-${route.name}-${route.width}-dark.png`, fullPage: true });
  });
}

test("English eTIMS guide remains readable in light mode at 360px", async ({ page }) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  await page.emulateMedia({ colorScheme: "light", reducedMotion: "reduce" });
  await page.setViewportSize({ width: 360, height: 780 });
  await page.goto("/tools/etims-guide/", { waitUntil: "networkidle" });
  const colors = await page.locator(".et-card").first().evaluate((node) => {
    const style = getComputedStyle(node);
    return { background: style.backgroundColor, color: style.color };
  });
  expect(colors.background).toBe("rgb(255, 255, 255)");
  expect(colors.color).toBe("rgb(23, 37, 31)");
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);
  expect(errors).toEqual([]);
  await page.screenshot({ path: "artifacts/day3-finance-etims-guide/etims-guide-en-360-light.png", fullPage: true });
});
