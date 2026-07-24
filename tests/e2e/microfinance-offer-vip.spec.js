const { test, expect } = require("@playwright/test");
const fs = require("fs");
const pdfParse = require("pdf-parse");

const routes = [
  ["/tools/microfinance-calc/", "en"],
  ["/fr/tools/calculateur-microfinance/", "fr"],
  ["/sw/zana/microfinance-riba-tambarare-dhidi-ya-salio/", "sw"],
];

async function fillOffer(page) {
  await page.locator("#mf-currency").fill("TEST");
  await page.locator("#mf-principal").fill("1000");
  await page.locator("#mf-rate").fill("12");
  await page.locator("#mf-rate-basis").selectOption("annual");
  await page.locator("#mf-method").selectOption("reducing");
  await page.locator("#mf-frequency").selectOption("12");
  await page.locator("#mf-count").fill("12");
  await page.locator("#mf-form button[type=submit]").click();
}

for (const [route, lang] of routes) {
  test(`${lang} native offer worksheet is empty, functional and local`, async ({ page }) => {
    const errors = [];
    const unexpectedExternal = [];
    page.on("console", message => { if (message.type() === "error") errors.push(message.text()); });
    page.on("pageerror", error => errors.push(error.message));
    page.on("request", request => {
      const url = new URL(request.url());
      const sharedShellRequest = /fonts\.googleapis|fonts\.gstatic/.test(url.hostname) || url.href.includes("twemoji");
      if (url.origin !== "http://127.0.0.1:4173" && !sharedShellRequest) unexpectedExternal.push(url.href);
    });
    await page.goto(route);
    await expect(page.locator("html")).toHaveAttribute("lang", lang);
    await expect(page.locator("#mf-currency")).toHaveValue("");
    await expect(page.locator("#mf-principal")).toHaveValue("");
    await expect(page.locator("#mf-rate")).toHaveValue("");
    await expect(page.locator("#mf-payment")).toHaveText("—");
    await expect(page.locator("#mf-schedule tr")).toHaveCount(0);
    const navbarText = await page.evaluate(() => document.querySelector("afro-navbar").shadowRoot.textContent);
    expect(navbarText).toMatch(/Fran.{1,2}ais/);
    await fillOffer(page);
    await expect(page.locator("#mf-payment")).toContainText(/88[.,]85/);
    await expect(page.locator("#mf-schedule tr")).toHaveCount(12);
    await page.locator("#mf-method").selectOption("flat");
    await page.locator("#mf-form button[type=submit]").click();
    await expect(page.locator("#mf-payment")).toContainText(/93[.,]33/);
    await page.locator("#mf-principal").fill("1001");
    await expect(page.locator("#mf-payment")).toHaveText("—");
    await expect(page.locator("#mf-schedule tr")).toHaveCount(0);
    await page.locator("#mf-theme").click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    expect(errors).toEqual([]);
    expect(unexpectedExternal).toEqual([]);
  });
}

test("local exports include a parsed PDF and finite requested principal", async ({ page, context }, testInfo) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/tools/microfinance-calc/");
  await fillOffer(page);
  await page.locator("#mf-note").fill("=SYNTHETIC");
  await page.locator("#mf-form button[type=submit]").click();

  const jsonEvent = page.waitForEvent("download");
  await page.locator("#mf-json").click();
  const json = JSON.parse(fs.readFileSync(await (await jsonEvent).path(), "utf8"));
  expect(json.principal).toBe(1000);
  expect(json.note).toBe("=SYNTHETIC");

  const csvEvent = page.waitForEvent("download");
  await page.locator("#mf-csv").click();
  const csv = fs.readFileSync(await (await csvEvent).path(), "utf8");
  expect(csv).toContain("1000.00");
  expect(csv).not.toContain("=SYNTHETIC");

  const pdfEvent = page.waitForEvent("download");
  await page.locator("#mf-pdf").click();
  const parsed = await pdfParse(fs.readFileSync(await (await pdfEvent).path()));
  expect(parsed.text.length).toBeGreaterThan(100);
  expect(parsed.text).not.toMatch(/undefined|NaN/);

  await page.locator("#mf-copy").click();
  await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toContain("Requested amount");
  const summary = await page.evaluate(() => navigator.clipboard.readText());
  expect(summary).not.toMatch(/undefined|NaN/);

  await testInfo.attach("microfinance-light-375.png", { body: await page.screenshot({ fullPage: true }), contentType: "image/png" });
  await page.locator("#mf-theme").click();
  await testInfo.attach("microfinance-dark-375.png", { body: await page.screenshot({ fullPage: true }), contentType: "image/png" });
});

for (const width of [320, 375, 768]) {
  test(`no overflow and 44px targets at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 920 });
    await page.goto("/tools/microfinance-calc/");
    const diagnostics = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
      minTarget: Math.min(...Array.from(document.querySelectorAll("button,input,select"), node => node.getBoundingClientRect().height)),
    }));
    expect(diagnostics.scrollWidth).toBeLessThanOrEqual(diagnostics.clientWidth + 1);
    expect(diagnostics.minTarget).toBeGreaterThanOrEqual(44);
  });
}

test("controls remain inside the viewport at 200 percent zoom", async ({ page }) => {
  await page.setViewportSize({ width: 640, height: 900 });
  await page.goto("/tools/microfinance-calc/");
  await page.evaluate(() => { document.body.style.zoom = "200%"; });
  const diagnostics = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    right: Math.max(...Array.from(document.querySelectorAll("button,input,select"), node => node.getBoundingClientRect().right)),
  }));
  expect(diagnostics.right).toBeLessThanOrEqual(diagnostics.clientWidth + 1);
});
