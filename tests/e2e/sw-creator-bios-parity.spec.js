const { test, expect } = require("@playwright/test");

const appRoute = "/sw/zana/bio-za-mitandao/app";
const origin = new URL(`http://127.0.0.1:${Number(process.env.SW_CREATOR_BIOS_PORT || 4438)}`).origin;

async function blockExternal(page, observed) {
  page.on("console", (message) => { if (message.type() === "error") observed.errors.push(message.text()); });
  page.on("pageerror", (error) => observed.errors.push(error.message));
  page.on("request", (request) => {
    const target = new URL(request.url());
    if (target.origin !== origin) observed.external.push(request.url());
    if (!["GET", "HEAD", "OPTIONS"].includes(request.method())) observed.writes.push(`${request.method()} ${request.url()}`);
  });
  await page.route("**/*", (route) => new URL(route.request().url()).origin === origin ? route.continue() : route.abort("blockedbyclient"));
}

async function downloadText(page, selector) {
  const pending = page.waitForEvent("download");
  await page.locator(selector).click();
  const stream = await (await pending).createReadStream();
  const chunks = [];
  for await (const chunk of stream) chunks.push(chunk);
  return Buffer.concat(chunks).toString("utf8");
}

async function noOverflow(page) {
  const size = await page.evaluate(() => ({ client: document.documentElement.clientWidth, scroll: document.documentElement.scrollWidth }));
  expect(size.scroll, JSON.stringify(size)).toBeLessThanOrEqual(size.client + 1);
}

test("native metadata, artwork, mobile, themes and keyboard", async ({ page }) => {
  const observed = { errors: [], external: [], writes: [] };
  await blockExternal(page, observed);
  await page.setViewportSize({ width: 375, height: 900 });
  await page.goto(appRoute, { waitUntil: "domcontentloaded" });
  await expect(page.locator("html")).toHaveAttribute("lang", "sw");
  await expect(page.locator('meta[name="afrotools-sw-native-owner"]')).toHaveAttribute("content", "creator-bios");
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", "https://afrotools.com/sw/zana/bio-za-mitandao/app");
  const schema = JSON.parse(await page.locator('script[type="application/ld+json"]').textContent());
  expect(schema.inLanguage).toBe("sw");
  expect(schema.isBasedOn).toBe("https://afrotools.com/tools/creator-bios/app");
  expect((await page.request.get("/assets/img/tools/creator-bios.webp")).ok()).toBeTruthy();
  expect(await page.locator("iframe").count()).toBe(0);
  await noOverflow(page);
  await page.setViewportSize({ width: 320, height: 900 });
  await noOverflow(page);
  await page.setViewportSize({ width: 640, height: 900 });
  await page.evaluate(() => { document.body.style.zoom = "2"; });
  await noOverflow(page);
  await page.evaluate(() => { document.body.style.zoom = ""; });
  for (const theme of ["light", "dark"]) {
    await page.evaluate((value) => document.documentElement.setAttribute("data-theme", value), theme);
    const colors = await page.locator(".bf-panel").evaluate((node) => { const style = getComputedStyle(node); return [style.color, style.backgroundColor]; });
    expect(colors[0]).not.toBe(colors[1]);
  }
  await page.locator("[name=who]").focus();
  await page.locator("[name=who]").press("Tab");
  expect(await page.evaluate(() => !!document.activeElement.closest("[data-bioforge-app]"))).toBeTruthy();
  expect(observed).toEqual({ errors: [], external: [], writes: [] });
});

test("invalid and clear states plus edited JSON and TXT reopen", async ({ page }) => {
  const observed = { errors: [], external: [], writes: [] };
  await blockExternal(page, observed);
  await page.goto(appRoute, { waitUntil: "domcontentloaded" });
  await page.locator('[data-bioforge-app] button[type="submit"]').click();
  await expect(page.locator("[data-status]")).toContainText("Weka jina");
  await expect(page.locator("[data-results]")).toBeHidden();
  await page.locator("[name=who]").fill("Asha Studio");
  await page.locator("[name=location]").fill("Dar es Salaam");
  await page.locator("[name=what]").fill("video za biashara ndogo za Afrika Mashariki");
  await page.locator("[name=achievement]").fill("kampeni 40 zilizokamilika");
  await page.locator('[data-bioforge-app] button[type="submit"]').click();
  await expect(page.locator("[data-results]")).toBeVisible();
  await expect(page.locator("article.bio-result")).toHaveCount(7);
  const instagram = page.locator('[data-bio="instagram"]');
  await instagram.fill("Asha Studio — video za biashara ndogo.");
  const json = JSON.parse(await downloadText(page, "[data-export-json]"));
  expect(json.locale).toBe("sw");
  expect(json.bios).toHaveLength(7);
  expect(json.bios.find((bio) => bio.platform === "instagram").text).toBe("Asha Studio — video za biashara ndogo.");
  const txt = await downloadText(page, "[data-export-txt]");
  expect(txt).toContain("Asha Studio — video za biashara ndogo.");
  expect(txt).toContain("Kichwa cha LinkedIn");
  await page.locator("[data-clear]").click();
  await expect(page.locator("[data-results]")).toBeHidden();
  await expect(page.locator("[name=who]")).toHaveValue("");
  expect(await page.evaluate(() => Object.keys(localStorage).filter((key) => /bioforge|creator-bios/i.test(key)))).toEqual([]);
  expect(observed).toEqual({ errors: [], external: [], writes: [] });
});

test("landing page exposes the complete native workspace", async ({ page }) => {
  const observed = { errors: [], external: [], writes: [] };
  await blockExternal(page, observed);
  await page.setViewportSize({ width: 320, height: 900 });
  await page.goto("/sw/zana/bio-za-mitandao/", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("link", { name: "Fungua workspace kamili ya bio" })).toHaveAttribute("href", "/sw/zana/bio-za-mitandao/app");
  await noOverflow(page);
});
