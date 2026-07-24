const { test, expect } = require("@playwright/test");
const fs = require("fs");
const pdfParse = require("pdf-parse");

const routes = [
  ["/tools/forex-profit/", "en"],
  ["/fr/tools/profit-forex/", "fr"],
  ["/sw/zana/kikokotoo-faida-forex/", "sw"],
];

async function fillTrade(page) {
  await page.locator("#fx-base").fill("AAA");
  await page.locator("#fx-quote").fill("BBB");
  await page.locator("#fx-reporting").fill("CCC");
  await page.locator("#fx-direction").selectOption("buy");
  await page.locator("#fx-entry").fill("1.2");
  await page.locator("#fx-exit").fill("1.21");
  await page.locator("#fx-units").fill("10000");
  await page.locator("#fx-pip").fill("0.0001");
  await page.locator("#fx-conversion").fill("2");
  await page.locator("#fx-costs").fill("5");
  await page.locator("#fx-form button[type=submit]").click();
}

for (const [route, lang] of routes) {
  test(`${lang} native statement worksheet stays user-entered and local`, async ({ page }) => {
    const errors = [], unexpectedExternal = [], rateRequests = [];
    page.on("console", message => { if (message.type() === "error") errors.push(message.text()); });
    page.on("pageerror", error => errors.push(error.message));
    page.on("request", request => {
      const url = new URL(request.url());
      const sharedShell = /fonts\.googleapis|fonts\.gstatic/.test(url.hostname) || url.href.includes("twemoji");
      if (/\/api\/forex|\/data\/forex|\/api\/fx-rates/.test(url.pathname)) rateRequests.push(url.href);
      if (url.origin !== "http://127.0.0.1:4173" && !sharedShell) unexpectedExternal.push(url.href);
    });
    await page.goto(route);
    await expect(page.locator("html")).toHaveAttribute("lang", lang);
    for (const id of ["#fx-base", "#fx-quote", "#fx-reporting", "#fx-entry", "#fx-exit", "#fx-units", "#fx-pip", "#fx-conversion"]) {
      await expect(page.locator(id)).toHaveValue("");
    }
    await expect(page.locator("#fx-net-reporting")).toHaveText("—");
    const navbarText = await page.evaluate(() => document.querySelector("afro-navbar").shadowRoot.textContent);
    expect(navbarText).toMatch(/Fran.{1,2}ais/);
    const storageBefore = await page.evaluate(() => JSON.stringify(Object.keys(localStorage).sort().map(key => [key, localStorage.getItem(key)])));
    await fillTrade(page);
    await expect(page.locator("#fx-net-reporting")).toContainText("190");
    await expect(page.locator("#fx-net")).toContainText("95");
    await expect(page.locator("#fx-gross")).toContainText("100");
    await expect(page.locator("#fx-pips")).toContainText("100");
    await page.locator("#fx-direction").selectOption("sell");
    await page.locator("#fx-exit").fill("1.19");
    await page.locator("#fx-form button[type=submit]").click();
    await expect(page.locator("#fx-gross")).toContainText("100");
    await page.locator("#fx-direction").selectOption("buy");
    await page.locator("#fx-form button[type=submit]").click();
    await expect(page.locator("#fx-net-reporting")).toContainText("-210");
    await expect(page.locator("#fx-primary")).toHaveAttribute("data-tone", "loss");
    await page.locator("#fx-entry").fill("1.3");
    await expect(page.locator("#fx-net-reporting")).toHaveText("—");
    const storageAfter = await page.evaluate(() => JSON.stringify(Object.keys(localStorage).sort().map(key => [key, localStorage.getItem(key)])));
    expect(storageAfter).toBe(storageBefore);
    await page.locator("#fx-theme").click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    expect(errors).toEqual([]);
    expect(unexpectedExternal).toEqual([]);
    expect(rateRequests).toEqual([]);
  });
}

test("copy, JSON, formula-safe CSV and parsed PDF stay local", async ({ page, context }, testInfo) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/tools/forex-profit/");
  await fillTrade(page);
  await page.locator("#fx-note").fill("=SYNTHETIC");
  await page.locator("#fx-form button[type=submit]").click();

  const jsonEvent = page.waitForEvent("download");
  await page.locator("#fx-json").click();
  const json = JSON.parse(fs.readFileSync(await (await jsonEvent).path(), "utf8"));
  expect(json.result.netPnlReporting).toBeCloseTo(190);
  expect(json.note).toBe("=SYNTHETIC");

  const csvEvent = page.waitForEvent("download");
  await page.locator("#fx-csv").click();
  const csv = fs.readFileSync(await (await csvEvent).path(), "utf8");
  expect(csv).toContain("190");
  expect(csv).toContain("'=SYNTHETIC");

  const pdfEvent = page.waitForEvent("download");
  await page.locator("#fx-pdf").click();
  const parsed = await pdfParse(fs.readFileSync(await (await pdfEvent).path()));
  expect(parsed.text.length).toBeGreaterThan(100);
  expect(parsed.text).not.toMatch(/undefined|NaN/);

  await page.locator("#fx-copy").click();
  await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toContain("Net P&L");
  const summary = await page.evaluate(() => navigator.clipboard.readText());
  expect(summary).toContain("1 BBB = 2 CCC");
  expect(summary).not.toMatch(/undefined|NaN/);

  await testInfo.attach("forex-light-375.png", { body: await page.screenshot({ fullPage: true }), contentType: "image/png" });
  await page.locator("#fx-theme").click();
  await testInfo.attach("forex-dark-375.png", { body: await page.screenshot({ fullPage: true }), contentType: "image/png" });
});

for (const width of [320, 375, 768]) {
  test(`forex statement has no overflow and 44px targets at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 920 });
    await page.goto("/tools/forex-profit/");
    const d = await page.evaluate(() => ({
      scroll: document.documentElement.scrollWidth,
      client: document.documentElement.clientWidth,
      minTarget: Math.min(...Array.from(document.querySelectorAll("button,input,select"), node => node.getBoundingClientRect().height)),
    }));
    expect(d.scroll).toBeLessThanOrEqual(d.client + 1);
    expect(d.minTarget).toBeGreaterThanOrEqual(44);
  });
}

test("forex controls stay inside viewport at 200 percent zoom", async ({ page }) => {
  await page.setViewportSize({ width: 640, height: 900 });
  await page.goto("/tools/forex-profit/");
  await page.evaluate(() => { document.body.style.zoom = "200%"; });
  const d = await page.evaluate(() => ({
    client: document.documentElement.clientWidth,
    right: Math.max(...Array.from(document.querySelectorAll("button,input,select"), node => node.getBoundingClientRect().right)),
  }));
  expect(d.right).toBeLessThanOrEqual(d.client + 1);
});

test("system dark preference is respected before manual override", async ({ browser }) => {
  const context = await browser.newContext({ colorScheme: "dark" });
  const page = await context.newPage();
  await page.goto("/tools/forex-profit/");
  await expect(page.locator("body")).toHaveAttribute("data-fx-theme", "dark");
  await context.close();
});
