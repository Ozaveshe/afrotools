const { test, expect } = require("@playwright/test");
const fs = require("fs");
const pdfParse = require("pdf-parse");

const routes = [
  {
    name: "en",
    path: "/uganda/ug-vat",
    calc: "Calculate Uganda VAT",
    pdf: "Uganda",
    zeroSource: "Third Schedule",
    withholdingCopy: "6% of taxable value",
  },
  {
    name: "fr",
    path: "/fr/uganda/ug-vat",
    calc: "Calculer la TVA Ouganda",
    pdf: "Ouganda",
    zeroSource: "troisième annexe",
    withholdingCopy: "6 % de la valeur taxable",
  },
  {
    name: "sw",
    path: "/sw/uganda/kikokotoo-vat/",
    calc: "Kokotoa VAT ya Uganda",
    pdf: "Uganda",
    zeroSource: "Jedwali la Tatu",
    withholdingCopy: "6% ya thamani inayotozwa",
  },
];

for (const route of routes)
  test(`${route.name} Uganda VAT VIP parity`, async ({ page }) => {
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
        .locator("main input, main select, main button")
        .evaluateAll((controls) =>
          controls
            .filter((control) => {
              const explicitLabel = control.id
                ? document.querySelector(`label[for="${control.id}"]`)
                : null;
              return !(
                explicitLabel ||
                control.getAttribute("aria-label") ||
                control.textContent.trim()
              );
            })
            .map((control) => control.id || control.outerHTML),
        ),
    ).toEqual([]);
    expect(
      await page.locator('main [aria-live="polite"]').count(),
    ).toBeGreaterThan(2);
    expect(
      await page
        .locator(".source-confidence-card")
        .evaluate((element) => getComputedStyle(element).backgroundColor),
    ).not.toBe("rgb(248, 251, 255)");
    expect(
      await page.evaluate(() => window.UGVatApp.getResult()),
    ).toMatchObject({ net: 1000, vat: 180, gross: 1180 });
    await page.locator('[data-mode="extract"]').click();
    await page.locator("#ugvAmount").fill("1180");
    expect(
      await page.evaluate(() => window.UGVatApp.getResult()),
    ).toMatchObject({ net: 1000, vat: 180, gross: 1180 });
    await page.locator('[data-rate-kind="scenario"]').click();
    await page.locator('[data-mode="add"]').click();
    await page.locator("#ugvAmount").fill("1000");
    await page.locator("#ugvCustomRate").fill("12");
    expect(
      await page.evaluate(() => window.UGVatApp.getResult()),
    ).toMatchObject({ rate: 12, vat: 120, gross: 1120 });
    await page.locator('[data-rate-kind="zero"]').click();
    expect(
      await page.evaluate(() => window.UGVatApp.getResult()),
    ).toMatchObject({ rate: 0, vat: 0, gross: 1000 });
    await page.locator('[data-rate-kind="standard"]').click();
    await page
      .locator("#ugvInvoiceForm")
      .evaluate((form) => form.requestSubmit());
    await expect(page.locator("#ugvInvoiceVat")).toContainText("180");
    await page.locator("#ugvClassification").selectOption("confirmed-zero");
    await expect(page.locator("#ugvClassificationResult")).toContainText(
      route.zeroSource,
    );
    await page
      .locator("#ugvClassification")
      .selectOption("confirmed-designated-withholding");
    await expect(page.locator("#ugvClassificationResult")).toContainText(
      route.withholdingCopy,
    );
    await expect(page.locator("#ugvClassificationResult")).toContainText(
      route.name === "fr"
        ? "Aucun montant"
        : route.name === "sw"
          ? "Hakuna kiasi"
          : "No amount",
    );
    await page.locator("#ugvPastThree").fill("37500000");
    await page.locator("#ugvExpectedThree").fill("37500000");
    await expect(page.locator("#ugvRegistrationResult")).toContainText(
      route.name === "fr" ? "Sous" : route.name === "sw" ? "Chini" : "Below",
    );
    await page.locator("#ugvExpectedThree").fill("37500001");
    await expect(page.locator("#ugvRegistrationResult")).toContainText(
      route.name === "fr"
        ? "Seuil"
        : route.name === "sw"
          ? "Kizingiti"
          : "test met",
    );
    await page.locator("#ugvAmount").fill("1000");
    const download = page.waitForEvent("download");
    await page.locator("#ugvPdf").click();
    const parsed = await pdfParse(
      fs.readFileSync(await (await download).path()),
    );
    expect(parsed.text).toContain(route.pdf);
    expect(parsed.text).toContain("1000.00");
    expect(parsed.text).toContain("180.00");
    expect(parsed.text).toContain("6%");
    expect(
      await page.evaluate(
        () =>
          document.documentElement.scrollWidth -
          document.documentElement.clientWidth,
      ),
    ).toBeLessThanOrEqual(0);
    expect(
      await page.evaluate(() =>
        Object.keys(localStorage).filter((key) => /ugv|vat/i.test(key)),
      ),
    ).toEqual([]);
    expect(nonGet).toEqual([]);
    expect(errors).toEqual([]);
    if (route.name !== "en") {
      const visibleCopy = await page.locator("body").innerText();
      expect(visibleCopy).not.toMatch(
        /Calculation mode|Price one line|Professional service|Check past and expected|Planning estimate only|Report calculation error|Formally designated VAT withholding|rated supply/,
      );
      const structuredCopy = (
        await page
          .locator('script[type="application/ld+json"]')
          .allTextContents()
      ).join(" ");
      expect(structuredCopy).not.toMatch(
        /What is Uganda's standard VAT rate|When is VAT registration required|Does zero-rated mean exempt|Add or extract Uganda VAT/,
      );
    }
    await expect(page.locator("afro-site-assistant")).toBeHidden();
    await page
      .locator("afro-navbar")
      .evaluate((element) =>
        element.style.setProperty("display", "none", "important"),
      );
    await page.screenshot({
      path: `artifacts/uganda-vat-${route.name}-375-dark.png`,
      fullPage: true,
    });
  });

for (const theme of ["dark", "light"])
  test(`Uganda VAT widget 320 ${theme}`, async ({ page }) => {
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
      `/widgets/iframe/financial-uganda-vat.html?theme=${theme}`,
      { waitUntil: "networkidle" },
    );
    await page.locator("#awUgAmount").fill("1000");
    await expect(page.locator('[data-ref="vat"]')).toContainText("180");
    await page.locator('[data-m="extract"]').click();
    await page.locator("#awUgAmount").fill("1180");
    expect(
      (await page.locator('[data-ref="net"]').textContent()).replace(/\D/g, ""),
    ).toContain("100000");
    await page.evaluate(() => {
      document.documentElement.lang = "fr";
    });
    await page.locator("#awUgAmount").fill("");
    await expect(page.locator(".aw-result")).toBeHidden();
    await expect(page.locator("#awUgError")).toHaveText(
      "Saisissez un montant positif ou nul.",
    );
    await expect(page.locator("#awUgAmount")).toHaveAttribute(
      "aria-invalid",
      "true",
    );
    await expect(page.locator('[data-ref="net"]')).toHaveText("");
    await expect(page.locator('[data-ref="vat"]')).toHaveText("");
    await expect(page.locator('[data-ref="total"]')).toHaveText("");
    await page.evaluate(() => {
      document.documentElement.lang = "sw";
    });
    await page.locator("#awUgAmount").fill("-1");
    await expect(page.locator("#awUgError")).toHaveText(
      "Ingiza kiasi kisicho hasi.",
    );
    await expect(page.locator(".aw-result")).toBeHidden();
    await page.locator("#awUgAmount").fill("1000");
    await expect(page.locator(".aw-result")).toBeVisible();
    await expect(page.locator("#awUgError")).toBeHidden();
    await expect(page.locator("#awUgAmount")).not.toHaveAttribute(
      "aria-invalid",
      "true",
    );
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
      path: `artifacts/uganda-vat-widget-320-${theme}.png`,
      fullPage: true,
    });
  });

test("Uganda VAT English 375 light", async ({ page }) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  await page.emulateMedia({ colorScheme: "light", reducedMotion: "reduce" });
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/uganda/ug-vat", { waitUntil: "networkidle" });
  await expect(
    page.getByRole("button", { name: "Calculate Uganda VAT" }),
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
    path: "artifacts/uganda-vat-en-375-light.png",
    fullPage: true,
  });
});

for (const width of [320, 360])
  test(`Uganda VAT compact ${width}px`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: "dark", reducedMotion: "reduce" });
    await page.setViewportSize({ width, height: 720 });
    await page.goto("/uganda/ug-vat", { waitUntil: "networkidle" });
    await expect(
      page.getByRole("button", { name: "Calculate Uganda VAT" }),
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
