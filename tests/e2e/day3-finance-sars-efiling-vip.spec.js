const { test, expect } = require("@playwright/test");

const routes = [
  { name: "en", path: "/tools/sars-efiling/", lang: "en", canonical: "https://afrotools.com/tools/sars-efiling/", heading: "Prepare your records, then complete every action on official SARS systems", width: 320 },
  { name: "fr", path: "/fr/tools/guide-de-sars-efiling/", lang: "fr", canonical: "https://afrotools.com/fr/tools/guide-de-sars-efiling/", heading: "Préparez vos justificatifs, puis réalisez chaque action sur les systèmes officiels de SARS", width: 375 },
];

for (const route of routes) {
  test(`${route.name} SARS guide is safe and usable in dark mobile`, async ({ page }) => {
    const errors = [];
    const nonGet = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
    page.on("request", (request) => { if (request.method() !== "GET") nonGet.push(`${request.method()} ${request.url()}`); });
    await page.emulateMedia({ colorScheme: "dark", reducedMotion: "reduce" });
    await page.setViewportSize({ width: route.width, height: 812 });
    await page.goto(route.path, { waitUntil: "networkidle" });
    await expect(page.locator("html")).toHaveAttribute("lang", route.lang);
    await expect(page.locator("h1")).toHaveText(route.heading);
    const renderedText = await page.locator("body").innerText();
    expect(renderedText).not.toMatch(/\uFFFD|\u00C3.|\u00C2.|\u00E2\u20AC/);
    if (route.lang === "fr") {
      expect(renderedText).toContain("Préparez vos justificatifs");
      expect(renderedText).toContain("auto-évaluation");
      expect(renderedText).toContain("Aucun téléversement");
    }
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", route.canonical);
    expect(await page.locator('link[rel="alternate"]').count()).toBe(3);
    const official = page.locator(".se-official");
    await expect(official).toHaveAttribute("href", "https://secure.sarsefiling.co.za/");
    await expect(official).toHaveAttribute("rel", /noopener/);
    await official.focus();
    const focus = await official.evaluate((node) => getComputedStyle(node));
    expect(focus.outlineStyle).toBe("solid");
    expect(parseFloat(focus.outlineWidth)).toBeGreaterThanOrEqual(3);
    await page.locator('a[href="#auto"]').click();
    await expect(page.locator("#auto")).toBeInViewport();
    expect(await page.locator(".se-main input,.se-main textarea,.se-main select,.se-main form").count()).toBe(0);
    expect(await page.locator('a[href^="https://www.sars.gov.za/"]').count()).toBeGreaterThanOrEqual(7);
    await expect(page.locator('[data-tool-verification-panel][data-tool-id="sars-efiling"]')).toBeVisible();
    await page.evaluate(() => { if (!document.querySelector("afro-site-assistant")) document.body.appendChild(document.createElement("afro-site-assistant")); });
    await expect(page.locator("afro-site-assistant")).toBeHidden();
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);
    const html = await page.locator("html").evaluate((node) => node.outerHTML);
    expect(html).not.toMatch(/type=["'](?:password|file)|fetch\(|XMLHttpRequest|\.netlify\/functions|submit your return here|pay SARS here/i);
    expect(nonGet).toEqual([]);
    expect(errors).toEqual([]);
    await page.screenshot({ path: `artifacts/day3-finance-sars-efiling/sars-efiling-${route.name}-${route.width}-dark.png`, fullPage: true });
  });
}

test("English SARS guide remains readable in light mode at 360px", async ({ page }) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
  await page.emulateMedia({ colorScheme: "light", reducedMotion: "reduce" });
  await page.setViewportSize({ width: 360, height: 780 });
  await page.goto("/tools/sars-efiling/", { waitUntil: "networkidle" });
  const colors = await page.locator(".se-card").first().evaluate((node) => { const style = getComputedStyle(node); return { background: style.backgroundColor, color: style.color }; });
  expect(colors.background).toBe("rgb(255, 255, 255)");
  expect(colors.color).toBe("rgb(35, 39, 44)");
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);
  expect(errors).toEqual([]);
  await page.screenshot({ path: "artifacts/day3-finance-sars-efiling/sars-efiling-en-360-light.png", fullPage: true });
});
