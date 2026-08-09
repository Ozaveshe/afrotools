const { test, expect } = require("@playwright/test");

const route = "/sw/zana/takwimu-za-mtayarishi/app";
const baseOrigin = new URL(`http://127.0.0.1:${Number(process.env.SW_CREATOR_ANALYTICS_PORT || 4437)}`).origin;

function diagnostics(page) {
  const errors = [];
  const external = [];
  const writes = [];
  page.on("console", (message) => {
    if (message.type() === "error" && !/favicon\.ico|ERR_BLOCKED_BY_CLIENT/i.test(message.text())) errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("request", (request) => {
    const url = new URL(request.url());
    if (url.origin !== baseOrigin) external.push(`${request.method()} ${request.url()}`);
    if (!["GET", "HEAD", "OPTIONS"].includes(request.method())) writes.push(`${request.method()} ${request.url()}`);
  });
  return { errors, external, writes };
}

async function blockExternal(page) {
  await page.route("**/*", async (requestRoute) => {
    const url = new URL(requestRoute.request().url());
    if (url.origin !== baseOrigin) return requestRoute.abort("blockedbyclient");
    return requestRoute.continue();
  });
}

async function readDownload(download) {
  const stream = await download.createReadStream();
  const chunks = [];
  for await (const chunk of stream) chunks.push(chunk);
  return Buffer.concat(chunks).toString("utf8");
}

async function assertNoOverflow(page) {
  const report = await page.evaluate(() => ({
    client: document.documentElement.clientWidth,
    scroll: document.documentElement.scrollWidth,
    offenders: Array.from(document.querySelectorAll("body *")).filter((node) => {
      const rect = node.getBoundingClientRect();
      const style = getComputedStyle(node);
      return style.display !== "none" && style.visibility !== "hidden" && (rect.right > document.documentElement.clientWidth + 1 || rect.left < -1);
    }).slice(0, 12).map((node) => `${node.tagName.toLowerCase()}${node.id ? `#${node.id}` : ""}${node.className ? `.${String(node.className).trim().replace(/\s+/g, ".")}` : ""}`)
  }));
  expect(report.scroll, JSON.stringify(report)).toBeLessThanOrEqual(report.client + 1);
}

test.beforeEach(async ({ page }) => {
  await blockExternal(page);
});

test("native metadata, artwork, labels, themes and reflow", async ({ page }) => {
  const observed = diagnostics(page);
  await page.setViewportSize({ width: 375, height: 900 });
  const response = await page.goto(route, { waitUntil: "domcontentloaded" });
  expect(response && response.ok()).toBeTruthy();
  await expect(page.locator("html")).toHaveAttribute("lang", "sw");
  await expect(page.locator('meta[name="afrotools-sw-native-owner"]')).toHaveAttribute("content", "creator-analytics");
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", "https://afrotools.com/sw/zana/takwimu-za-mtayarishi/app");
  await expect(page.locator('link[hreflang="en"]')).toHaveAttribute("href", "https://afrotools.com/tools/creator-analytics/app");
  await expect(page.locator('link[hreflang="fr"]')).toHaveAttribute("href", "https://afrotools.com/fr/tools/stats-createur/app");
  await expect(page.locator('link[hreflang="sw"]')).toHaveAttribute("href", "https://afrotools.com/sw/zana/takwimu-za-mtayarishi/app");
  const schema = JSON.parse(await page.locator('script[type="application/ld+json"]').textContent());
  expect(schema.inLanguage).toBe("sw");
  expect(schema.isBasedOn).toBe("https://afrotools.com/tools/creator-analytics/app");
  expect(await page.locator("iframe").count()).toBe(0);
  expect(await page.locator("[data-creator-analytics-app] input, [data-creator-analytics-app] select").count()).toBe(await page.locator("[data-creator-analytics-app] label input, [data-creator-analytics-app] label select").count());
  expect((await page.request.get("/assets/img/tools/creator-analytics.webp")).ok()).toBeTruthy();
  await assertNoOverflow(page);

  await page.setViewportSize({ width: 320, height: 900 });
  await assertNoOverflow(page);
  await page.setViewportSize({ width: 640, height: 900 });
  await page.evaluate(() => { document.body.style.zoom = "2"; });
  await assertNoOverflow(page);
  await page.evaluate(() => { document.body.style.zoom = ""; });

  for (const theme of ["light", "dark"]) {
    await page.evaluate((value) => document.documentElement.setAttribute("data-theme", value), theme);
    const colors = await page.locator(".cb-card").first().evaluate((node) => {
      const style = getComputedStyle(node);
      return { color: style.color, background: style.backgroundColor };
    });
    expect(colors.color).not.toBe(colors.background);
  }

  await page.locator(".cb-back").focus();
  await page.locator(".cb-back").press("Tab");
  const focusVisible = await page.evaluate(() => {
    const active = document.activeElement;
    if (!active || !active.closest("[data-creator-analytics-app]")) return false;
    const style = getComputedStyle(active);
    return style.outlineStyle !== "none" || style.boxShadow !== "none";
  });
  expect(focusVisible).toBeTruthy();
  expect(observed.errors).toEqual([]);
  expect(observed.external).toEqual([]);
  expect(observed.writes).toEqual([]);
});

test("invalid state, deterministic result, persistence, CSV and JSON reopen", async ({ page }) => {
  const observed = diagnostics(page);
  await page.goto(route, { waitUntil: "domcontentloaded" });

  await page.locator("#caDate").fill("");
  await page.locator("#caReach").fill("0");
  await page.locator('[data-creator-analytics-app] button[type="submit"]').click();
  await expect(page.locator("#caError")).toContainText("Weka tarehe");
  expect(await page.evaluate(() => localStorage.getItem("afrotools.creatorAnalytics.local.v2"))).toBeNull();

  await page.locator("#caDate").fill("2026-08-09");
  await page.locator("#caReach").fill("10000");
  await page.locator("#caImpressions").fill("15000");
  await page.locator("#caLikes").fill("600");
  await page.locator("#caComments").fill("50");
  await page.locator("#caShares").fill("30");
  await page.locator("#caSaves").fill("120");
  await page.locator("#caFollowers").fill("18");
  await page.locator("#caLabel").fill("Jaribio la kampeni");
  await page.locator('[data-creator-analytics-app] button[type="submit"]').click();
  await expect(page.locator("#caPosts")).toHaveText("1");
  await expect(page.locator("#caReachTotal")).toHaveText("10,000");
  await expect(page.locator("#caEngagement")).toHaveText("8.00%");
  await expect(page.locator("#caBrief")).toContainText("1 chapisho");

  const csvEvent = page.waitForEvent("download");
  await page.locator("#caCsv").click();
  const csv = await readDownload(await csvEvent);
  const csvLines = csv.split(/\r?\n/);
  expect(csvLines).toHaveLength(2);
  expect(csvLines[0]).toContain("engagement_rate_percent");
  expect(csvLines[1]).toContain("Jaribio la kampeni,15000,10000,600,50,30,120,18,800,8.00");

  const jsonEvent = page.waitForEvent("download");
  await page.locator("#caJson").click();
  const parsed = JSON.parse(await readDownload(await jsonEvent));
  expect(parsed.posts).toHaveLength(1);
  expect(parsed.posts[0].interactions).toBe(800);
  expect(parsed.summary.engagementRate).toBe(8);

  await page.reload({ waitUntil: "domcontentloaded" });
  await expect(page.locator("#caPosts")).toHaveText("1");
  await page.locator("#caClear").click();
  await expect(page.locator("#caPosts")).toHaveText("0");
  expect(await page.evaluate(() => localStorage.getItem("afrotools.creatorAnalytics.local.v2"))).toBeNull();
  expect(observed.errors).toEqual([]);
  expect(observed.external).toEqual([]);
  expect(observed.writes).toEqual([]);
});

test("landing route discovers the complete local workspace", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 900 });
  await page.goto("/sw/zana/takwimu-za-mtayarishi/", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("link", { name: "Fungua workspace kamili ya takwimu" })).toHaveAttribute("href", "/sw/zana/takwimu-za-mtayarishi/app");
  await assertNoOverflow(page);
});
