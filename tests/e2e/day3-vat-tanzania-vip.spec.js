const { test, expect } = require("@playwright/test");
const fs = require("fs");
const pdfParse = require("pdf-parse");
const routes = [
  {
    name: "en",
    path: "/tanzania/tz-vat",
    calc: "Calculate Tanzania VAT",
    pdf: "Tanzania",
  },
  {
    name: "fr",
    path: "/fr/tanzania/tz-vat",
    calc: "Calculer la TVA Tanzanie",
    pdf: "Tanzanie",
  },
  {
    name: "sw",
    path: "/sw/tanzania/kikokotoo-vat/",
    calc: "Kokotoa VAT ya Tanzania",
    pdf: "Tanzania",
  },
];
for (const route of routes)
  test(`${route.name} Tanzania VAT VIP parity`, async ({ page }) => {
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
      await page
        .locator(".source-confidence-card")
        .evaluate((e) => getComputedStyle(e).backgroundColor),
    ).not.toBe("rgb(248, 251, 255)");
    expect(
      await page.evaluate(() => window.TZVatApp.getResult()),
    ).toMatchObject({ net: 1000, vat: 180, gross: 1180 });
    await page.locator('[data-mode="extract"]').click();
    await page.locator("#tzvAmount").fill("1180");
    expect(
      await page.evaluate(() => window.TZVatApp.getResult()),
    ).toMatchObject({ net: 1000, vat: 180, gross: 1180 });
    await page.locator('[data-rate-kind="epayment"]').click();
    await page.locator('[data-mode="add"]').click();
    await page.locator("#tzvAmount").fill("1000");
    expect(
      await page.evaluate(() => window.TZVatApp.getResult()),
    ).toMatchObject({ rate: 16, vat: 160, gross: 1160 });
    await page.locator('[data-rate-kind="scenario"]').click();
    await page.locator("#tzvCustomRate").fill("12");
    expect(
      await page.evaluate(() => window.TZVatApp.getResult()),
    ).toMatchObject({ rate: 12, vat: 120, gross: 1120 });
    await page.locator('[data-rate-kind="standard"]').click();
    await page.locator("#tzvInvoiceQty").fill("2");
    await page.locator("#tzvInvoiceUnit").fill("500");
    await page.locator("#tzvInvoiceForm").evaluate((f) => f.requestSubmit());
    await expect(page.locator("#tzvInvoiceVat")).toContainText("180");
    await page
      .locator("#tzvClassification")
      .selectOption("confirmed-withholding");
    await expect(page.locator("#tzvClassificationResult")).toContainText("3");
    await page.locator("#tzvPrior6").fill("100000000");
    await expect(page.locator("#tzvRegistrationResult")).toContainText(
      route.name === "fr"
        ? "6 mois"
        : route.name === "sw"
          ? "miezi 6"
          : "prior 6",
    );
    await page
      .locator("#tzvWithholdingForm")
      .evaluate((f) => f.requestSubmit());
    await expect(page.locator("#tzvWithholdingVat")).toContainText("180");
    await expect(page.locator("#tzvWithholdingRetained")).toContainText("30");
    expect(
      (await page.locator("#tzvWithholdingSupplier").textContent()).replace(
        /\D/g,
        "",
      ),
    ).toContain("115000");
    await page.locator("#tzvAmount").fill("1000");
    const promise = page.waitForEvent("download");
    await page.locator("#tzvPdf").click();
    const parsed = await pdfParse(
      fs.readFileSync(await (await promise).path()),
    );
    expect(parsed.text).toContain(route.pdf);
    expect(parsed.text).toContain("1000.00");
    expect(parsed.text).toContain("180.00");
    expect(
      await page.evaluate(
        () =>
          document.documentElement.scrollWidth -
          document.documentElement.clientWidth,
      ),
    ).toBeLessThanOrEqual(0);
    expect(
      await page.evaluate(() =>
        Object.keys(localStorage).filter((k) => /tzv|vat/i.test(k)),
      ),
    ).toEqual([]);
    expect(nonGet).toEqual([]);
    expect(errors).toEqual([]);
    await expect(page.locator("afro-site-assistant")).toBeHidden();
    await page
      .locator("afro-navbar")
      .evaluate((e) => e.style.setProperty("display", "none", "important"));
    await page.screenshot({
      path: `artifacts/tanzania-vat-${route.name}-375-dark.png`,
      fullPage: true,
    });
  });
test("Tanzania VAT widget 320 dark", async ({ page }) => {
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
  await page.goto("/widgets/iframe/financial-tanzania-vat.html?theme=dark", {
    waitUntil: "networkidle",
  });
  await page.locator("#awTzAmount").fill("1000");
  await expect(page.locator('[data-ref="vat"]')).toContainText("180");
  await page.locator('[data-m="extract"]').click();
  await page.locator("#awTzAmount").fill("1180");
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
    path: "artifacts/tanzania-vat-widget-320-dark.png",
    fullPage: true,
  });
});
test("Tanzania VAT English 375 light", async ({ page }) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  await page.emulateMedia({ colorScheme: "light", reducedMotion: "reduce" });
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/tanzania/tz-vat", { waitUntil: "networkidle" });
  await expect(page.getByRole("button", { name: "Calculate Tanzania VAT" })).toBeVisible();
  await expect(page.locator(".source-confidence-card")).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);
  expect(errors).toEqual([]);
  await page.locator("afro-navbar").evaluate((element) => element.style.setProperty("display", "none", "important"));
  await page.screenshot({ path: "artifacts/tanzania-vat-en-375-light.png", fullPage: true });
});
test("Tanzania VAT widget 320 light", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 640 });
  await page.goto("/widgets/iframe/financial-tanzania-vat.html?theme=light", { waitUntil: "networkidle" });
  await expect(page.locator('[data-ref="vat"]')).toContainText("180");
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);
  await page.screenshot({ path: "artifacts/tanzania-vat-widget-320-light.png", fullPage: true });
});
for (const width of [320, 360])
  test(`Tanzania VAT compact ${width}px`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: "dark", reducedMotion: "reduce" });
    await page.setViewportSize({ width, height: 720 });
    await page.goto("/tanzania/tz-vat", { waitUntil: "networkidle" });
    await expect(
      page.getByRole("button", { name: "Calculate Tanzania VAT" }),
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
