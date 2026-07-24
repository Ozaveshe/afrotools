const { test, expect } = require("@playwright/test");
const fs = require("fs");
const pdfParse = require("pdf-parse");

const routes = [
  {
    name: "en",
    path: "/rwanda/rw-vat",
    calc: "Calculate Rwanda VAT",
    pdf: "Rwanda",
  },
  {
    name: "fr",
    path: "/fr/rwanda/rw-vat",
    calc: "Calculer la TVA Rwanda",
    pdf: "Rwanda",
  },
  {
    name: "sw",
    path: "/sw/rwanda/kikokotoo-vat/",
    calc: "Kokotoa VAT ya Rwanda",
    pdf: "Rwanda",
  },
];

for (const route of routes)
  test(`${route.name} Rwanda VAT VIP parity`, async ({ page }) => {
    const errors = [],
      nonGet = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });
    page.on("request", (request) => {
      if (request.method() !== "GET")
        nonGet.push(`${request.method()} ${request.url()}`);
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
        .evaluate((element) => getComputedStyle(element).backgroundColor),
    ).not.toBe("rgb(248, 251, 255)");
    expect(
      await page.evaluate(() => window.RWVatApp.getResult()),
    ).toMatchObject({ net: 1000, vat: 180, gross: 1180 });
    await page.locator('[data-mode="extract"]').click();
    await page.locator("#rwvAmount").fill("1180");
    expect(
      await page.evaluate(() => window.RWVatApp.getResult()),
    ).toMatchObject({ net: 1000, vat: 180, gross: 1180 });
    await page.locator('[data-rate-kind="scenario"]').click();
    await page.locator('[data-mode="add"]').click();
    await page.locator("#rwvAmount").fill("1000");
    await page.locator("#rwvCustomRate").fill("12");
    expect(
      await page.evaluate(() => window.RWVatApp.getResult()),
    ).toMatchObject({ rate: 12, vat: 120, gross: 1120 });
    await page.locator('[data-rate-kind="zero"]').click();
    expect(
      await page.evaluate(() => window.RWVatApp.getResult()),
    ).toMatchObject({ rate: 0, vat: 0, gross: 1000 });
    await page.locator('[data-rate-kind="standard"]').click();
    await page
      .locator("#rwvInvoiceForm")
      .evaluate((form) => form.requestSubmit());
    await expect(page.locator("#rwvInvoiceVat")).toContainText("180");
    await page.locator("#rwvClassification").selectOption("confirmed-zero");
    await expect(page.locator("#rwvClassificationResult")).toContainText(
      "Article 7",
    );
    await page.locator("#rwvAnnual").fill("20000000");
    await page.locator("#rwvQuarter").fill("5000000");
    await expect(page.locator("#rwvRegistrationResult")).toContainText(
      route.name === "fr" ? "Sous" : route.name === "sw" ? "Chini" : "Below",
    );
    await page.locator("#rwvQuarter").fill("5000001");
    await expect(page.locator("#rwvRegistrationResult")).toContainText(
      route.name === "fr"
        ? "Seuil"
        : route.name === "sw"
          ? "Kizingiti"
          : "threshold",
    );
    await page.locator("#rwvAmount").fill("1000");
    const download = page.waitForEvent("download");
    await page.locator("#rwvPdf").click();
    const parsed = await pdfParse(
      fs.readFileSync(await (await download).path()),
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
        Object.keys(localStorage).filter((key) => /rwv|vat/i.test(key)),
      ),
    ).toEqual([]);
    expect(nonGet).toEqual([]);
    expect(errors).toEqual([]);
    await expect(page.locator("afro-site-assistant")).toBeHidden();
    await page
      .locator("afro-navbar")
      .evaluate((element) =>
        element.style.setProperty("display", "none", "important"),
      );
    await page.screenshot({
      path: `artifacts/rwanda-vat-${route.name}-375-dark.png`,
      fullPage: true,
    });
  });

for (const theme of ["dark", "light"])
  test(`Rwanda VAT widget 320 ${theme}`, async ({ page }) => {
    const errors = [],
      nonGet = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });
    page.on("request", (request) => {
      if (request.method() !== "GET")
        nonGet.push(`${request.method()} ${request.url()}`);
    });
    await page.setViewportSize({ width: 320, height: 640 });
    await page.goto(
      `/widgets/iframe/financial-rwanda-vat.html?theme=${theme}`,
      { waitUntil: "networkidle" },
    );
    await page.locator("#awRwAmount").fill("1000");
    await expect(page.locator('[data-ref="vat"]')).toContainText("180");
    await page.locator('[data-m="extract"]').click();
    await page.locator("#awRwAmount").fill("1180");
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
      path: `artifacts/rwanda-vat-widget-320-${theme}.png`,
      fullPage: true,
    });
  });

test("Rwanda VAT English 375 light", async ({ page }) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  await page.emulateMedia({ colorScheme: "light", reducedMotion: "reduce" });
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/rwanda/rw-vat", { waitUntil: "networkidle" });
  await expect(
    page.getByRole("button", { name: "Calculate Rwanda VAT" }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () =>
        document.documentElement.scrollWidth -
        document.documentElement.clientWidth,
    ),
  ).toBeLessThanOrEqual(0);
  expect(errors).toEqual([]);
  await page
    .locator("afro-navbar")
    .evaluate((element) =>
      element.style.setProperty("display", "none", "important"),
    );
  await page.screenshot({
    path: "artifacts/rwanda-vat-en-375-light.png",
    fullPage: true,
  });
});

for (const width of [320, 360])
  test(`Rwanda VAT compact ${width}px`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: "dark", reducedMotion: "reduce" });
    await page.setViewportSize({ width, height: 720 });
    await page.goto("/rwanda/rw-vat", { waitUntil: "networkidle" });
    await expect(
      page.getByRole("button", { name: "Calculate Rwanda VAT" }),
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
