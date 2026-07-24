const { test, expect } = require("@playwright/test");

const routes = [
  {
    name: "en",
    path: "/tools/itax-guide/",
    lang: "en",
    canonical: "https://afrotools.com/tools/itax-guide/",
    heading: "Prepare carefully, then complete every tax action on official KRA systems",
    width: 320,
  },
  {
    name: "fr",
    path: "/fr/tools/guide-d-itax-de-la-kra/",
    lang: "fr",
    canonical: "https://afrotools.com/fr/tools/guide-d-itax-de-la-kra/",
    heading: "Préparez-vous avec soin, puis réalisez chaque démarche sur les systèmes officiels de la KRA",
    width: 375,
  },
];

for (const route of routes) {
  test(`${route.name} iTax guide is safe, native and usable in dark mobile`, async ({ page }) => {
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
    await expect(page.locator(".ix-official")).toHaveAttribute("href", "https://itax.kra.go.ke/KRA-Portal/");
    await expect(page.locator(".ix-official")).toHaveAttribute("rel", /noopener/);
    await page.locator(".ix-official").focus();
    const focus = await page.locator(".ix-official").evaluate((node) => getComputedStyle(node));
    expect(focus.outlineStyle).toBe("solid");
    expect(parseFloat(focus.outlineWidth)).toBeGreaterThanOrEqual(3);
    await expect(page.locator('a[href="#pin"]')).toBeVisible();
    await page.locator('a[href="#nil"]').click();
    await expect(page.locator("#nil")).toBeInViewport();
    expect(await page.locator(".ix-main input,.ix-main textarea,.ix-main select,.ix-main form").count()).toBe(0);
    expect(await page.locator('a[href^="https://www.kra.go.ke/"]').count()).toBeGreaterThanOrEqual(4);
    await expect(page.locator('[data-tool-verification-panel][data-tool-id="itax-guide"]')).toBeVisible();
    await page.evaluate(() => {
      if (!document.querySelector("afro-site-assistant")) document.body.appendChild(document.createElement("afro-site-assistant"));
    });
    await expect(page.locator("afro-site-assistant")).toBeHidden();
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);
    const html = await page.locator("html").evaluate((node) => node.outerHTML);
    expect(html).not.toMatch(/type=["'](?:password|file)|fetch\(|XMLHttpRequest|\.netlify\/functions|AI advisor|log in with AfroTools/i);
    expect(nonGet).toEqual([]);
    expect(errors).toEqual([]);
    await page.screenshot({ path: `test-results/itax-guide-${route.name}-${route.width}-dark.png`, fullPage: true });
  });
}

test("English iTax guide remains readable in light mode at 360px", async ({ page }) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  await page.emulateMedia({ colorScheme: "light", reducedMotion: "reduce" });
  await page.setViewportSize({ width: 360, height: 780 });
  await page.goto("/tools/itax-guide/", { waitUntil: "networkidle" });
  const colors = await page.locator(".ix-card").first().evaluate((node) => {
    const style = getComputedStyle(node);
    return { background: style.backgroundColor, color: style.color };
  });
  expect(colors.background).toBe("rgb(255, 255, 255)");
  expect(colors.color).toBe("rgb(23, 33, 45)");
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);
  expect(errors).toEqual([]);
  await page.screenshot({ path: "test-results/itax-guide-en-360-light.png", fullPage: true });
});
