const { test, expect } = require("@playwright/test"),
  fs = require("node:fs");
const route = "/sw/zana/marejeo-ya-stablecoin/";
function snap(currency = "ngn") {
  const t = new Date(Date.now() - 60000).toISOString();
  return {
    status: "fresh",
    source: { name: "CoinGecko", url: "https://www.coingecko.com/" },
    scope: "provider_reference_not_exchange_quote",
    currency,
    count: 3,
    fetchedAt: new Date().toISOString(),
    sourceUpdatedAt: t,
    latestSourceUpdatedAt: t,
    freshnessCeilingMinutes: 30,
    cache: "miss",
    data: ["USDT", "USDC", "DAI"].map((symbol, i) => ({
      id: symbol.toLowerCase(),
      symbol,
      name: symbol,
      usdPrice: 1,
      localPrice: currency === "ngn" ? 1370 + i : 16 + i / 100,
      usd24hChange: 0,
      local24hChange: 0,
      pegDistancePercent: 0,
      sourceUpdatedAt: t,
    })),
  };
}
async function open(page, w = 375, fail = false) {
  await page.setViewportSize({ width: w, height: 850 });
  await page.addInitScript(() =>
    localStorage.setItem("afrotools_cookie_consent", "declined"),
  );
  const req = [];
  page.on("request", (r) => {
    if (r.url().includes("/.netlify/functions/crypto-stablecoins")) req.push(r.url());
  });
  await page.route("**/.netlify/functions/crypto-stablecoins*", (r) => {
    const c = new URL(r.request().url()).searchParams.get("currency") || "ngn";
    return r.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(fail ? { status: "unavailable" } : snap(c)),
    });
  });
  await page.goto(route);
  await expect
    .poll(() => page.evaluate(() => window.__stablecoinSnapshotReady))
    .toBe(true);
  return req;
}
test("fresh-only rows and parsed exports", async ({ page }) => {
  const req = await open(page);
  await expect(page.locator("[data-status]")).toHaveText("Mpya");
  await expect(page.locator("[data-stablecoin-body] tr")).toHaveCount(3);
  expect(
    req.every(
      (u) =>
        new URL(u).pathname.endsWith("/crypto-stablecoins") &&
        ["ngn", "zar"].includes(new URL(u).searchParams.get("currency")),
    ),
  ).toBe(true);
  for (const [sel, type] of [
    ["[data-export-csv]", "csv"],
    ["[data-export-json]", "json"],
  ]) {
    const [d] = await Promise.all([
      page.waitForEvent("download"),
      page.click(sel),
    ]);
    const b = fs.readFileSync(await d.path(), "utf8");
    if (type === "csv")
      expect(b).toContain("provider_reference_not_exchange_quote");
    else expect(JSON.parse(b).data).toHaveLength(3);
  }
});
test("unavailable fails closed", async ({ page }) => {
  await open(page, 375, true);
  await expect(page.locator("[data-status]")).toHaveText("Haipatikani");
  await expect(page.locator("[data-stablecoin-body] tr")).toHaveCount(0);
});
for (const w of [320, 375])
  test(`${w}px dark keyboard no overflow`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: "dark", reducedMotion: "reduce" });
    await open(page, w);
    await page.locator("[data-refresh]").focus();
    await expect(page.locator("[data-refresh]")).toBeFocused();
    expect(
      await page.evaluate(
        () =>
          document.documentElement.scrollWidth <=
          document.documentElement.clientWidth,
      ),
    ).toBe(true);
  });
test("200 percent metadata artwork", async ({ page }) => {
  await open(page, 640);
  await page.evaluate(() => (document.documentElement.style.fontSize = "200%"));
  expect(
    await page.evaluate(
      () =>
        document.documentElement.scrollWidth <=
        document.documentElement.clientWidth,
    ),
  ).toBe(true);
  await expect(page.locator("link[rel=canonical]")).toHaveAttribute(
    "href",
    "https://afrotools.com/sw/zana/marejeo-ya-stablecoin/",
  );
  expect(
    (
      await page.request.get("/assets/img/tools/crypto-stablecoins.webp")
    ).status(),
  ).toBe(200);
});
