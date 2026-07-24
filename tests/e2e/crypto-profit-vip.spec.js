const { test, expect } = require("@playwright/test");

async function enterTrade(page, route, currency) {
  await page.goto(route);
  await page.fill("#currencyCode", currency);
  await page.fill("#buyPrice", "100");
  await page.fill("#sellPrice", "150");
  await page.fill("#quantity", "2");
  await page.fill("#buyFeeValue", "10");
  await page.fill("#sellFeeValue", "10");
  await page.selectOption("#buyFeeType", "percent");
  await page.selectOption("#sellFeeType", "percent");
  await page.fill("#scenarioPrice1", "200");
  await page.click(".profit-submit");
}

test("English worksheet is local, responsive and recomputes percentage scenario fees", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 900 });
  await page.emulateMedia({ colorScheme: "dark", reducedMotion: "reduce" });
  const external = [];
  page.on("request", (request) => {
    const url = new URL(request.url());
    if (url.hostname !== "127.0.0.1") external.push(request.url());
  });
  await enterTrade(page, "/crypto/profit-calculator/", "NGN");
  await expect(page.locator("#cryptoProfitResults")).toContainText("NGN 50.00");
  await expect(page.locator("#cryptoProfitResults")).toContainText("22.73% ROI");
  await expect(page.locator("#cryptoProfitResults")).toContainText("NGN 122.22");
  await expect(page.locator("#cryptoProfitScenarioBody")).toContainText("NGN 60.00");
  await expect(page.locator("#cryptoProfitScenarioBody")).toContainText("NGN 140.00");
  await expect(page.locator("#cryptoProfitResults")).toHaveAttribute("data-result-settled", "true");
  const overlaps = await page.evaluate(() => {
    const cookie = document.querySelector("#afro-cookie-consent");
    const assistant = document.querySelector("afro-site-assistant");
    const critical = [
      document.querySelector(".profit-submit"),
      document.querySelector("#cryptoProfitStatus"),
      document.querySelector(".profit-result-hero"),
      document.querySelector(".profit-result-list"),
      document.querySelector(".profit-method"),
      ...document.querySelectorAll(".profit-actions button")
    ].filter(Boolean);
    const intersects = (a, b) => {
      const x = a.getBoundingClientRect();
      const y = b.getBoundingClientRect();
      return x.left < y.right && x.right > y.left && x.top < y.bottom && x.bottom > y.top;
    };
    return {
      cookieCritical: cookie ? critical.some((element) => intersects(cookie, element)) : false,
      assistantCritical: assistant ? critical.some((element) => intersects(assistant, element)) : false,
      cookieAssistant: cookie && assistant ? intersects(cookie, assistant) : false,
      assistantSuppressed: cookie && assistant ? assistant.getBoundingClientRect().width === 0 : true
    };
  });
  expect(overlaps).toEqual({ cookieCritical: false, assistantCritical: false, cookieAssistant: false, assistantSuppressed: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBe(0);
  expect(external.some((url) => /coingecko|chart\.js/i.test(url))).toBeFalsy();
});

test("French page is native parity and rejects unsafe fee percentages", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await enterTrade(page, "/fr/crypto/profit-calculator/", "XOF");
  await expect(page.locator("html")).toHaveAttribute("lang", "fr");
  await expect(page.locator("#cryptoProfitResults")).toContainText("XOF 50,00");
  await expect(page.locator("#cryptoProfitScenarioBody")).toContainText("XOF 140,00");
  await page.fill("#sellFeeValue", "100");
  await page.click(".profit-submit");
  await expect(page.locator("#cryptoProfitStatus")).toContainText("inférieur à 100");
  await expect(page.locator("[data-profit-export=pdf]")).toBeDisabled();
  expect(await page.locator("iframe").count()).toBe(0);
});

test("CSV, JSON and PDF are local downloads and print remains available", async ({ page }) => {
  await enterTrade(page, "/crypto/profit-calculator/", "NGN");
  const csvDownload = page.waitForEvent("download");
  await page.click("[data-profit-export=csv]");
  const csv = await csvDownload;
  expect(await csv.suggestedFilename()).toBe("crypto-profit-ngn.csv");

  const jsonDownload = page.waitForEvent("download");
  await page.click("[data-profit-export=json]");
  const json = await jsonDownload;
  expect(await json.suggestedFilename()).toBe("crypto-profit-ngn.json");

  const pdfDownload = page.waitForEvent("download");
  await page.click("[data-profit-export=pdf]");
  const pdf = await pdfDownload;
  expect(await pdf.suggestedFilename()).toBe("crypto-profit-ngn.pdf");
  const stream = await pdf.createReadStream();
  const chunks = [];
  for await (const chunk of stream) chunks.push(chunk);
  expect(Buffer.concat(chunks).subarray(0, 4).toString()).toBe("%PDF");

  await page.evaluate(() => {
    window.__printCalled = false;
    window.print = () => { window.__printCalled = true; };
  });
  await page.click("[data-profit-export=print]");
  expect(await page.evaluate(() => window.__printCalled)).toBe(true);
});

test("widget is an accessible method CTA in English and French", async ({ page }) => {
  await page.goto("/widgets/iframe/crypto-crypto-profit-loss.html?theme=dark");
  await expect(page.locator("#widget-root h1")).toHaveText("Crypto profit or loss");
  await expect(page.locator("#widget-root input")).toHaveCount(0);
  await expect(page.locator("#widget-root a")).toHaveAttribute("href", "/crypto/profit-calculator/");
  await page.goto("/widgets/iframe/crypto-crypto-profit-loss.html?lang=fr");
  await expect(page.locator("html")).toHaveAttribute("lang", "fr");
  await expect(page.locator("#widget-root h1")).toHaveText("Profit ou perte crypto");
  await expect(page.locator("#widget-root a")).toHaveAttribute("href", "/fr/crypto/profit-calculator/");
});
