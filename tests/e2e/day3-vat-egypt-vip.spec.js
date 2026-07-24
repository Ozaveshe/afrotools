const { test, expect } = require("@playwright/test");
const fs = require("fs");
const pdfParse = require("pdf-parse");
const routes = [
  {
    name: "en",
    path: "/egypt/eg-vat",
    calc: "Calculate Egypt VAT",
    pdf: "Egypt",
  },
  {
    name: "fr",
    path: "/fr/egypt/eg-vat",
    calc: "Calculer la TVA Égypte",
    pdf: "Égypte",
  },
  {
    name: "sw",
    path: "/sw/egypt/kikokotoo-vat/",
    calc: "Kokotoa VAT ya Misri",
    pdf: "Misri",
  },
];
for (const route of routes)
  test(`${route.name} Egypt VAT VIP parity`, async ({ page }) => {
    const errors = [],
      nonGet = [];
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("console", (m) => {
      if (m.type() === "error") errors.push(m.text());
    });
    page.on("request", (r) => {
      if (r.method() !== "GET") nonGet.push(`${r.method()} ${r.url()}`);
    });
    await page.emulateMedia({ colorScheme: "dark", reducedMotion: "reduce" });
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(route.path, { waitUntil: "networkidle" });
    await expect(page.locator("html")).toHaveAttribute("lang", route.name);
    await expect(page.getByRole("button", { name: route.calc })).toBeVisible();
    await expect(page.locator(".source-confidence-card")).toBeVisible();
    expect(
      await page.locator(".source-confidence-card").evaluate((element) =>
        getComputedStyle(element).backgroundColor,
      ),
    ).not.toBe("rgb(248, 251, 255)");
    expect(
      await page.evaluate(() => window.EGVatApp.getResult()),
    ).toMatchObject({ net: 1000, vat: 140, gross: 1140 });
    await page.locator('[data-mode="extract"]').click();
    await page.locator("#egvAmount").fill("1140");
    expect(
      await page.evaluate(() => window.EGVatApp.getResult()),
    ).toMatchObject({ net: 1000, vat: 140, gross: 1140 });
    await page.locator('[data-rate-kind="scenario"]').click();
    await page.locator("#egvCustomRate").fill("12");
    await page.locator('[data-mode="add"]').click();
    await page.locator("#egvAmount").fill("1000");
    expect(
      await page.evaluate(() => window.EGVatApp.getResult()),
    ).toMatchObject({ rate: 12, vat: 120, gross: 1120 });
    await page.locator('[data-rate-kind="zero"]').click();
    expect(
      await page.evaluate(() => window.EGVatApp.getResult()),
    ).toMatchObject({ rate: 0, vat: 0, gross: 1000 });
    await page.locator('[data-rate-kind="standard"]').click();
    await page.locator("#egvInvoiceQty").fill("2");
    await page.locator("#egvInvoiceUnit").fill("500");
    await page.locator("#egvInvoiceForm").evaluate((f) => f.requestSubmit());
    await expect(page.locator("#egvInvoiceVat")).toContainText("140");
    await page.locator("#egvClassification").selectOption("confirmed-zero");
    await expect(page.locator("#egvClassificationResult")).toContainText(
      "VAT Law",
    );
    await page.locator("#egvRegistration").fill("500000");
    await expect(page.locator("#egvRegistrationResult")).toContainText("500");
    await page.locator("#egvAmount").fill("1000");
    const promise = page.waitForEvent("download");
    await page.locator("#egvPdf").click();
    const parsed = await pdfParse(
      fs.readFileSync(await (await promise).path()),
    );
    expect(parsed.text).toContain(route.pdf);
    expect(parsed.text).toContain("1000.00");
    expect(parsed.text).toContain("140.00");
    expect(
      await page.evaluate(
        () =>
          document.documentElement.scrollWidth -
          document.documentElement.clientWidth,
      ),
    ).toBeLessThanOrEqual(0);
    expect(
      await page.evaluate(() =>
        Object.keys(localStorage).filter((k) => /egv|vat/i.test(k)),
      ),
    ).toEqual([]);
    expect(nonGet).toEqual([]);
    expect(errors).toEqual([]);
    await expect(page.locator("afro-site-assistant")).toBeHidden();
    await page
      .locator("afro-navbar")
      .evaluate((e) => e.style.setProperty("display", "none", "important"));
    await page.screenshot({
      path: `artifacts/egypt-vat-${route.name}-375-dark.png`,
      fullPage: true,
    });
  });
test("Egypt VAT widget 320 dark", async ({ page }) => {
  const errors = [],
    nonGet = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
  page.on("request", (r) => {
    if (r.method() !== "GET") nonGet.push(`${r.method()} ${r.url()}`);
  });
  await page.setViewportSize({ width: 320, height: 640 });
  await page.goto("/widgets/iframe/financial-egypt-vat.html?theme=dark", {
    waitUntil: "networkidle",
  });
  await page.locator("#awEgAmount").fill("1000");
  await expect(page.locator('[data-ref="vat"]')).toContainText("140");
  await page.locator('[data-m="extract"]').click();
  await page.locator("#awEgAmount").fill("1140");
  expect(
    (await page.locator('[data-ref="net"]').textContent()).replace(/\D/g, ""),
  ).toContain("100000");
  expect(
    await page.evaluate(
      () =>
        document.documentElement.scrollWidth -
        document.documentElement.clientWidth,
    ),
  ).toBeLessThanOrEqual(0);
  expect(nonGet).toEqual([]);
  expect(errors).toEqual([]);
  await page.screenshot({
    path: "artifacts/egypt-vat-widget-320-dark.png",
    fullPage: true,
  });
});
for (const width of [320, 360])
  test(`Egypt VAT compact ${width}px`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: "dark", reducedMotion: "reduce" });
    await page.setViewportSize({ width, height: 720 });
    await page.goto("/egypt/eg-vat", { waitUntil: "networkidle" });
    await expect(
      page.getByRole("button", { name: "Calculate Egypt VAT" }),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () =>
          document.documentElement.scrollWidth -
          document.documentElement.clientWidth,
      ),
    ).toBeLessThanOrEqual(0);
    await expect(page.locator("afro-site-assistant")).toBeHidden();
  });
