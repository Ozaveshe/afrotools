const { test, expect } = require("@playwright/test");
const fs = require("fs");
const path = require("path");
const pdfParse = require("pdf-parse");

const routes = [
  ["/crypto/p2p-rates/", "en"],
  ["/fr/crypto/p2p-rates/", "fr"],
];

async function fillComparison(page) {
  await page.locator("#p2-asset").fill("USDT");
  await page.locator("#p2-fiat").fill("NGN");
  await page.locator("#p2-amount").fill("100");
  await page.locator("#p2-a-time").fill("2026-07-23T12:00");
  await page.locator("#p2-a-price").fill("1600");
  await page.locator("#p2-a-pct").fill("1");
  await page.locator("#p2-a-fixed").fill("500");
  await page.locator("#p2-b-time").fill("2026-07-23T12:01");
  await page.locator("#p2-b-price").fill("1610");
  await page.locator("#p2-b-pct").fill("0");
  await page.locator("#p2-b-fixed").fill("0");
  await page.locator("#p2-form button[type=submit]").click();
}

for (const [route, lang] of routes) {
  test(`${lang} P2P worksheet is native, user-entered and local`, async ({ page }) => {
    const errors = [], unexpectedExternal = [], p2pRequests = [];
    page.on("console", message => { if (message.type() === "error") errors.push(message.text()); });
    page.on("pageerror", error => errors.push(error.message));
    page.on("request", request => {
      const url = new URL(request.url());
      const sharedShell = /fonts\.googleapis|fonts\.gstatic/.test(url.hostname) || url.href.includes("twemoji");
      if (/crypto-p2p|api\/crypto\/p2p|binance|bybit/i.test(url.href)) p2pRequests.push(url.href);
      if (url.origin !== "http://127.0.0.1:4173" && !sharedShell) unexpectedExternal.push(url.href);
    });
    await page.goto(route);
    await expect(page.locator("html")).toHaveAttribute("lang", lang);
    await expect(page.locator("iframe")).toHaveCount(0);
    for (const id of ["#p2-asset","#p2-fiat","#p2-amount","#p2-a-time","#p2-a-price","#p2-a-pct","#p2-a-fixed","#p2-b-time","#p2-b-price","#p2-b-pct","#p2-b-fixed"]) {
      await expect(page.locator(id)).toHaveValue("");
    }
    const navbarText = await page.evaluate(() => document.querySelector("afro-navbar").shadowRoot.textContent);
    expect(navbarText).toMatch(/Fran.{1,2}ais/);
    const storageBefore = await page.evaluate(() => JSON.stringify(Object.keys(localStorage).sort().map(key => [key, localStorage.getItem(key)])));
    await fillComparison(page);
    await expect(page.locator("#p2-primary-value")).toContainText("161");
    await expect(page.locator(".p2-result[data-observed=true]")).toHaveCount(1);
    await expect(page.locator(".p2-result").nth(0)).toContainText("162");
    await page.locator("#p2-side").selectOption("sell");
    await page.locator("#p2-form button[type=submit]").click();
    await expect(page.locator("#p2-primary-value")).toContainText("161");
    await expect(page.locator(".p2-result").nth(0)).toContainText("157");
    await page.locator("#p2-third").check();
    await expect(page.locator("#p2-quote-c")).toBeVisible();
    await page.locator("#p2-c-time").fill("2026-07-23T12:02");
    await page.locator("#p2-c-price").fill("1620");
    await page.locator("#p2-c-pct").fill("0");
    await page.locator("#p2-c-fixed").fill("0");
    await page.locator("#p2-form button[type=submit]").click();
    await expect(page.locator(".p2-result")).toHaveCount(3);
    await expect(page.locator("#p2-primary-value")).toContainText("162");
    await page.locator("#p2-a-price").fill("1700");
    await expect(page.locator("#p2-primary-value")).toHaveText("—");
    const storageAfter = await page.evaluate(() => JSON.stringify(Object.keys(localStorage).sort().map(key => [key, localStorage.getItem(key)])));
    expect(storageAfter).toBe(storageBefore);
    expect(errors).toEqual([]);
    expect(unexpectedExternal).toEqual([]);
    expect(p2pRequests).toEqual([]);
  });
}

test("copy, JSON, formula-safe CSV and parsed PDF stay local", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/crypto/p2p-rates/");
  await fillComparison(page);
  await page.locator("#p2-a-ref").fill("=SYNTHETIC");
  await page.locator("#p2-form button[type=submit]").click();

  const jsonEvent = page.waitForEvent("download");
  await page.locator("#p2-json").click();
  const json = JSON.parse(fs.readFileSync(await (await jsonEvent).path(), "utf8"));
  expect(json.observedTargetFiat).toBe(161000);
  expect(json.quotes[0].reference).toBe("=SYNTHETIC");

  const csvEvent = page.waitForEvent("download");
  await page.locator("#p2-csv").click();
  const csv = fs.readFileSync(await (await csvEvent).path(), "utf8");
  expect(csv).toContain("161000");
  expect(csv).toContain("'=SYNTHETIC");

  const pdfEvent = page.waitForEvent("download");
  await page.locator("#p2-pdf").click();
  const pdfBuffer = fs.readFileSync(await (await pdfEvent).path());
  const parsed = await pdfParse(pdfBuffer);
  expect(parsed.text.length).toBeGreaterThan(150);
  expect(parsed.text).not.toMatch(/undefined|NaN/);

  await page.locator("#p2-copy").click();
  await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toContain("P2P executable quote comparison");
});

for (const width of [320, 375, 768]) {
  test(`P2P comparator has no overflow and 44px targets at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 920 });
    await page.goto("/crypto/p2p-rates/");
    const layout = await page.evaluate(() => ({
      scroll: document.documentElement.scrollWidth,
      client: document.documentElement.clientWidth,
      minTarget: Math.min(...Array.from(document.querySelectorAll("button,input,select"), node => node.getBoundingClientRect()).filter(rect => rect.width > 0 && rect.height > 0).map(rect => rect.height)),
    }));
    expect(layout.scroll).toBeLessThanOrEqual(layout.client + 1);
    expect(layout.minTarget).toBeGreaterThanOrEqual(44);
  });
}

test("P2P controls remain inside viewport at 200 percent zoom", async ({ page }) => {
  await page.setViewportSize({ width: 640, height: 900 });
  await page.goto("/crypto/p2p-rates/");
  await page.evaluate(() => { document.body.style.zoom = "200%"; });
  const layout = await page.evaluate(() => ({
    client: document.documentElement.clientWidth,
    right: Math.max(...Array.from(document.querySelectorAll("button,input,select"), node => node.getBoundingClientRect().right)),
  }));
  expect(layout.right).toBeLessThanOrEqual(layout.client + 1);
});

test("system dark preference and manual dark preview work", async ({ browser }) => {
  const context = await browser.newContext({ colorScheme: "dark" });
  const page = await context.newPage();
  await page.goto("/crypto/p2p-rates/");
  await expect(page.locator("body")).toHaveAttribute("data-p2-theme", "dark");
  await page.locator("#p2-theme").click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await context.close();
});

test("durable EN mobile light and dark evidence", async ({ page }) => {
  const out = path.resolve("artifacts/day3-finance/p2p-row110");
  fs.mkdirSync(out, { recursive: true });
  await page.setViewportSize({ width: 375, height: 900 });
  await page.goto("/crypto/p2p-rates/");
  await fillComparison(page);
  await page.screenshot({ path: path.join(out, "en-375-results-light.png"), fullPage: true });
  await page.locator("#p2-theme").click();
  await page.screenshot({ path: path.join(out, "en-375-results-dark.png"), fullPage: true });
});
