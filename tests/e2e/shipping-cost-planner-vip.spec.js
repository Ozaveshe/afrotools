const { test, expect } = require("@playwright/test");
const pdfParse = require("pdf-parse");

const routes = [
  "/tools/shipping-calc/",
  "/fr/tools/calculateur-expedition/",
  "/sw/zana/gharama-usafirishaji/"
];

async function calculate(page) {
  await page.locator("#divisorChoice").selectOption("6000");
  await page.locator("#packageCount").fill("2");
  await page.locator("#actualKgPerPackage").fill("3");
  await page.locator("#lengthCm").fill("40");
  await page.locator("#widthCm").fill("30");
  await page.locator("#heightCm").fill("20");
  await page.locator("#ratePerKg").fill("5");
  await page.locator("#fixedFees").fill("10");
  await page.locator("#packagingFees").fill("4");
  await page.locator("#fuelPct").fill("10");
  await page.locator("#declaredValue").fill("200");
  await page.locator("#insurancePct").fill("2");
  await page.locator("#contingencyPct").fill("5");
  await page.locator("#scpForm button[type=submit]").click();
}

for (const route of routes) {
  for (const width of [320, 360, 375, 768]) {
    test(`${route} is parity-safe at ${width}px`, async ({ page }) => {
      const errors = []; page.on("pageerror", (error) => errors.push(error.message));
      await page.setViewportSize({ width, height: 820 });
      await page.emulateMedia({ colorScheme: width % 2 ? "light" : "dark", reducedMotion: "reduce" });
      await page.goto(route);
      await expect(page.locator("#scpForm")).toBeVisible();
      expect(await page.locator("[data-export]").evaluateAll((nodes) => nodes.every((node) => node.disabled))).toBe(true);
      await calculate(page);
      await expect(page.locator("#scpResult")).toContainText("8 kg");
      await expect(page.locator("#scpResult")).toContainText("65");
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
      expect(await page.locator("#scpForm input,#scpForm select").evaluateAll((nodes) => nodes.every((node) => node.labels.length > 0))).toBe(true);
      await page.evaluate(() => { document.documentElement.style.fontSize = "200%"; });
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
      expect(errors).toEqual([]);
    });
  }
}

test("invalid and stale results disable every export", async ({ page }) => {
  await page.goto(routes[0]);
  await page.locator("#scpForm button[type=submit]").click();
  await expect(page.locator("#scpStatus")).toContainText("highlighted");
  expect(await page.locator("[data-export]").evaluateAll((nodes) => nodes.every((node) => node.disabled))).toBe(true);
  await calculate(page);
  expect(await page.locator("[data-export]").evaluateAll((nodes) => nodes.every((node) => !node.disabled))).toBe(true);
  await page.locator("#ratePerKg").fill("6");
  expect(await page.locator("[data-export]").evaluateAll((nodes) => nodes.every((node) => node.disabled))).toBe(true);
  await expect(page.locator("#scpResult")).not.toHaveClass(/is-visible/);
});

test("local CSV, JSON and parser-readable PDF exports preserve formulas and scope", async ({ page }) => {
  await page.goto(routes[0]); await calculate(page);
  const csvDownload = page.waitForEvent("download"); await page.locator('[data-export="csv"]').click();
  const csvStream = await (await csvDownload).createReadStream(); let csv = ""; for await (const chunk of csvStream) csv += chunk;
  expect(csv).toContain('"chargeableKg","8"'); expect(csv).toContain('"scope_note"');
  const jsonDownload = page.waitForEvent("download"); await page.locator('[data-export="json"]').click();
  const jsonStream = await (await jsonDownload).createReadStream(); let json = ""; for await (const chunk of jsonStream) json += chunk;
  const parsedJson = JSON.parse(json); expect(parsedJson.result.outputs.total).toBe(65.1);
  const pdfDownload = page.waitForEvent("download"); await page.locator('[data-export="pdf"]').click();
  const pdfStream = await (await pdfDownload).createReadStream(); const chunks = []; for await (const chunk of pdfStream) chunks.push(chunk);
  const parsedPdf = await pdfParse(Buffer.concat(chunks));
  expect(parsedPdf.text).toContain("Shipping Cost & Chargeable Weight Plan");
  expect(parsedPdf.text).toContain("Chargeable weight: 8 kg");
  expect(parsedPdf.text).toContain("Customs");
});

test("widget at 320px uses the shared engine and canonical handoff", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 });
  await page.goto("/widgets/iframe/ecommerce-shipping-calc");
  await page.locator("select").selectOption("5000");
  await page.getByRole("button", { name: "Calculate" }).click();
  await expect(page.locator(".sw-result")).toContainText("Chargeable weight");
  await expect(page.locator(".sw-link")).toHaveAttribute("href", "/tools/shipping-calc/");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
});
