const { test, expect } = require("@playwright/test");

const routes = [
  { name: "en", path: "/tools/cnps-guide/", lang: "en", canonical: "https://afrotools.com/tools/cnps-guide/", heading: "Understand the contribution branches, then declare only through CNPS", width: 320, unicode: ["Côte d’Ivoire", "2%-5%"] },
  { name: "fr", path: "/fr/tools/guide-de-la-cnps-en-cote-d-ivoire/", lang: "fr", canonical: "https://afrotools.com/fr/tools/guide-de-la-cnps-en-cote-d-ivoire/", heading: "Comprenez les branches de cotisation, puis déclarez uniquement auprès de la CNPS", width: 360, unicode: ["Déclarez chaque salarié", "Aucune déclaration"] },
  { name: "sw", path: "/sw/zana/mwongozo-wa-cnps/", lang: "sw", canonical: "https://afrotools.com/sw/zana/mwongozo-wa-cnps/", heading: "Elewa matawi ya michango, kisha wasilisha taarifa kupitia CNPS pekee", width: 375, unicode: ["Tangaza kila mfanyakazi", "Hakuna tamko"] },
];

for (const route of routes) {
  test(`${route.name} CNPS guide is native, safe and usable in dark mobile`, async ({ page }) => {
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
    for (const phrase of route.unicode) expect(renderedText).toContain(phrase);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", route.canonical);
    expect(await page.locator('link[rel="alternate"]').count()).toBe(4);
    const official = page.locator(".cg-official");
    await expect(official).toHaveAttribute("href", "https://e.cnps.ci/connexion");
    await expect(official).toHaveAttribute("rel", /noopener/);
    await official.focus();
    const focus = await official.evaluate((node) => getComputedStyle(node));
    expect(focus.outlineStyle).toBe("solid");
    expect(parseFloat(focus.outlineWidth)).toBeGreaterThanOrEqual(3);
    await page.locator('a[href="#ceilings"]').click();
    await expect(page.locator("#ceilings")).toBeInViewport();
    expect(await page.locator(".cg-main input,.cg-main textarea,.cg-main select,.cg-main form").count()).toBe(0);
    expect(await page.locator('a[href^="https://www.cnps.ci/"]').count()).toBeGreaterThanOrEqual(6);
    await expect(page.locator('[data-tool-verification-panel][data-tool-id="cnps-guide"]')).toBeVisible();
    await page.evaluate(() => { if (!document.querySelector("afro-site-assistant")) document.body.appendChild(document.createElement("afro-site-assistant")); });
    await expect(page.locator("afro-site-assistant")).toBeHidden();
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);
    const html = await page.locator("html").evaluate((node) => node.outerHTML);
    expect(html).not.toMatch(/type=["'](?:password|file)|fetch\(|XMLHttpRequest|\.netlify\/functions|calculate official contribution|submit your DISA/i);
    expect(nonGet).toEqual([]);
    expect(errors).toEqual([]);
    await page.screenshot({ path: `artifacts/day3-finance-cnps-guide/cnps-guide-${route.name}-${route.width}-dark.png`, fullPage: true });
  });
}

test("English CNPS guide remains readable in light mode at 360px", async ({ page }) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
  await page.emulateMedia({ colorScheme: "light", reducedMotion: "reduce" });
  await page.setViewportSize({ width: 360, height: 780 });
  await page.goto("/tools/cnps-guide/", { waitUntil: "networkidle" });
  const colors = await page.locator(".cg-card").first().evaluate((node) => { const style = getComputedStyle(node); return { background: style.backgroundColor, color: style.color }; });
  expect(colors.background).toBe("rgb(255, 255, 255)");
  expect(colors.color).toBe("rgb(24, 48, 40)");
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);
  expect(errors).toEqual([]);
  await page.screenshot({ path: "artifacts/day3-finance-cnps-guide/cnps-guide-en-360-light.png", fullPage: true });
});
