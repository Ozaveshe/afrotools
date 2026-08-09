const { test, expect } = require("@playwright/test");
const route = "/sw/zana/kalenda-ya-mtayarishi/app";
const origin = new URL(`http://127.0.0.1:${Number(process.env.SW_CREATOR_CALENDAR_PORT || 4440)}`).origin;

async function guard(page, observed) {
  page.on("console", message => { if (message.type() === "error") observed.errors.push(message.text()); });
  page.on("pageerror", error => observed.errors.push(error.message));
  page.on("request", request => {
    const url = new URL(request.url());
    if (url.origin !== origin) observed.external.push(request.url());
    if (!["GET", "HEAD", "OPTIONS"].includes(request.method())) observed.writes.push(`${request.method()} ${request.url()}`);
  });
  await page.route("**/*", request => new URL(request.request().url()).origin === origin ? request.continue() : request.abort("blockedbyclient"));
}

async function downloadText(page, selector) {
  const pending = page.waitForEvent("download");
  await page.locator(selector).click();
  const stream = await (await pending).createReadStream();
  const chunks = [];
  for await (const chunk of stream) chunks.push(chunk);
  return Buffer.concat(chunks).toString("utf8");
}

async function expectNoOverflow(page) {
  const sizes = await page.evaluate(() => [document.documentElement.clientWidth, document.documentElement.scrollWidth]);
  expect(sizes[1], JSON.stringify(sizes)).toBeLessThanOrEqual(sizes[0] + 1);
}

test("metadata mobile themes artwork and keyboard", async ({ page }) => {
  const observed = { errors: [], external: [], writes: [] };
  await guard(page, observed);
  await page.setViewportSize({ width: 375, height: 900 });
  await page.goto(route, { waitUntil: "domcontentloaded" });
  await expect(page.locator("html")).toHaveAttribute("lang", "sw");
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", "https://afrotools.com/sw/zana/kalenda-ya-mtayarishi/app");
  const schema = JSON.parse(await page.locator('script[type="application/ld+json"]').textContent());
  expect(schema.inLanguage).toBe("sw");
  expect((await page.request.get("/assets/img/tools/creator-calendar.webp")).ok()).toBeTruthy();
  await expectNoOverflow(page);
  await page.setViewportSize({ width: 320, height: 900 });
  await expectNoOverflow(page);
  await page.setViewportSize({ width: 640, height: 900 });
  await page.evaluate(() => { document.body.style.zoom = "2"; });
  await expectNoOverflow(page);
  await page.evaluate(() => { document.body.style.zoom = ""; });
  for (const theme of ["light", "dark"]) {
    await page.evaluate(value => { document.documentElement.dataset.theme = value; }, theme);
    const colors = await page.locator(".ccn-card").evaluate(node => { const style = getComputedStyle(node); return [style.color, style.backgroundColor]; });
    expect(colors[0]).not.toBe(colors[1]);
  }
  await page.locator('[name="topic"]').focus();
  await page.locator('[name="topic"]').press("Tab");
  expect(await page.evaluate(() => Boolean(document.activeElement.closest("[data-creator-calendar-native]")))).toBeTruthy();
  expect(observed).toEqual({ errors: [], external: [], writes: [] });
});

test("invalid calculate and reopen JSON CSV", async ({ page }) => {
  const observed = { errors: [], external: [], writes: [] };
  await guard(page, observed);
  await page.goto(route, { waitUntil: "domcontentloaded" });
  await page.locator('[name="platform"]:checked').evaluateAll(inputs => inputs.forEach(input => { input.checked = false; }));
  await page.locator('[data-creator-calendar-native] button[type="submit"]').click();
  await expect(page.locator("[data-status]")).toContainText("Hakiki mada");
  await expect(page.locator("[data-export-actions]")).toBeHidden();
  await page.locator('[name="platform"][value="instagram"]').check();
  await page.locator('[name="platform"][value="tiktok"]').check();
  await page.locator('[name="topic"]').fill("Biashara za ubunifu");
  await page.locator('[name="days"]').fill("5");
  await page.locator('[data-creator-calendar-native] button[type="submit"]').click();
  await expect(page.locator("tbody tr")).toHaveCount(5);
  await expect(page.locator("tbody tr").first()).toContainText("2026-08-01");
  await expect(page.locator("tbody tr").first()).toContainText("06:30");
  const json = await downloadText(page, "[data-json]");
  const parsed = JSON.parse(json);
  expect(parsed.posts).toHaveLength(5);
  expect(parsed.country).toBe("TZ");
  const csv = await downloadText(page, "[data-csv]");
  expect(csv.charCodeAt(0)).toBe(0xfeff);
  expect(csv).toContain('"Siku","Tarehe","Jukwaa","Saa ya kukadiria","Lengo"');
  expect(csv).toContain('"1","2026-08-01","instagram","06:30","Elimisha"');
  expect(observed).toEqual({ errors: [], external: [], writes: [] });
});

test("landing discovers workspace", async ({ page }) => {
  const observed = { errors: [], external: [], writes: [] };
  await guard(page, observed);
  await page.setViewportSize({ width: 320, height: 900 });
  await page.goto("/sw/zana/kalenda-ya-mtayarishi/", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("link", { name: "Fungua kalenda kamili ya maudhui" })).toHaveAttribute("href", "/sw/zana/kalenda-ya-mtayarishi/app");
  await expectNoOverflow(page);
});
