const { test, expect } = require("@playwright/test");
const fs = require("fs");
const pdfParse = require("pdf-parse");
const routes = [
  {
    lang: "en",
    path: "/comoros/km-vat",
    button: "Calculate",
    pdfTitle: "Comoros consumption-tax estimate",
  },
  {
    lang: "fr",
    path: "/fr/comores/calculateur-tva",
    button: "Calculer",
    pdfTitle: "Estimation de taxe sur la consommation aux Comores",
  },
  {
    lang: "sw",
    path: "/sw/comoros/kikokotoo-vat/",
    button: "Kokotoa",
    pdfTitle: "Makadirio ya kodi ya matumizi Comoro",
  },
];
for (const route of routes)
  test(`${route.lang} Comoros TC parity and PDF`, async ({ page }) => {
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
    await page.goto(route.path, { waitUntil: "domcontentloaded" });
    await expect(page.locator("html")).toHaveAttribute("lang", route.lang);
    await expect(
      page.getByRole("button", { name: route.button, exact: true }),
    ).toBeVisible();
    await expect(page.locator(".kmv-answer")).toContainText("50");
    await expect(page.locator("[data-tool-verification-panel]")).toHaveAttribute(
      "data-tool-id",
      "km-vat",
    );
    expect(
      await page.locator("main input, main select, main button").evaluateAll(
        (controls) =>
          controls
            .filter((control) => {
              if (control.closest("[hidden]")) return false;
              const label = control.id
                ? document.querySelector(`label[for="${control.id}"]`)
                : null;
              return !(
                label ||
                control.closest("label") ||
                control.getAttribute("aria-label") ||
                control.getAttribute("aria-labelledby") ||
                control.textContent.trim()
              );
            })
            .map((control) => control.id || control.outerHTML),
      ),
    ).toEqual([]);
    expect(
      await page.evaluate(() => window.KMConsumptionTaxApp.getResult()),
    ).toMatchObject({ net: 100000, tax: 10000, gross: 110000 });
    await page.locator('[data-km-mode="extract"]').click();
    await page.locator("#kmAmount").fill("110000");
    expect(
      await page.evaluate(() => window.KMConsumptionTaxApp.getResult()),
    ).toMatchObject({ net: 100000, tax: 10000, gross: 110000 });
    await page.locator('[data-km-mode="add"]').click();
    await page
      .locator("#kmRateChoice")
      .selectOption("article-152-mobile-recharge-confirmed");
    await page.locator("#kmAmount").fill("100000");
    await expect(page.locator("#kmEvidenceGate")).toBeVisible();
    await expect(page.locator("#kmEvidenceConfirmed")).toHaveAttribute(
      "required",
      "",
    );
    expect(
      await page.evaluate(() => window.KMConsumptionTaxApp.getResult()),
    ).toBeNull();
    await expect(page.locator("#kmError")).not.toBeEmpty();
    await page.locator("#kmEvidenceConfirmed").check();
    expect(
      await page.evaluate(() => window.KMConsumptionTaxApp.getResult()),
    ).toMatchObject({ rate: 7.5, tax: 7500, gross: 107500 });
    await page.locator("#kmImporter").check();
    await page.locator("#kmTurnover").fill("15000000");
    await page
      .locator("#kmThresholdForm")
      .evaluate((form) => form.requestSubmit());
    await expect(page.locator("#kmThresholdResult")).not.toContainText(
      "importer-exception-review",
    );
    await page.locator("#kmTurnover").fill("20000000");
    await page
      .locator("#kmThresholdForm")
      .evaluate((form) => form.requestSubmit());
    await expect(page.locator("#kmThresholdResult")).toContainText(/20|TC|DGI/);
    await page.locator("#kmRateChoice").selectOption("standard");
    await page.locator("#kmAmount").fill("100000");
    const download = page.waitForEvent("download");
    await page.locator("#kmPdf").click();
    const parsed = await pdfParse(
      fs.readFileSync(await (await download).path()),
    );
    expect(parsed.text).toContain(route.pdfTitle);
    expect(parsed.text).toContain("10000.00");
    expect(parsed.text).toContain("DGI");
    expect(
      await page.evaluate(
        () =>
          document.documentElement.scrollWidth -
          document.documentElement.clientWidth,
      ),
    ).toBeLessThanOrEqual(0);
    expect(
      await page.evaluate(() =>
        Object.keys(localStorage).filter((key) =>
          /km-vat|km-tax|consumption-tax/i.test(key),
        ),
      ),
    ).toEqual([]);
    expect(nonGet).toEqual([]);
    expect(errors).toEqual([]);
  });
test("manual dark, phone, tablet, desktop and 200% reflow", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "light", reducedMotion: "reduce" });
  for (const width of [320, 360, 375, 768, 1366]) {
    await page.setViewportSize({ width, height: 720 });
    await page.goto("/comoros/km-vat", { waitUntil: "domcontentloaded" });
    await page.locator("html").evaluate((element) => {
      element.dataset.theme = "dark";
    });
    await expect(
      page.getByRole("button", { name: "Calculate", exact: true }),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () =>
          document.documentElement.scrollWidth -
          document.documentElement.clientWidth,
      ),
    ).toBeLessThanOrEqual(0);
    expect(
      await page
        .locator(".kmv-card")
        .first()
        .evaluate((element) => getComputedStyle(element).backgroundColor),
    ).not.toBe("rgb(255, 255, 255)");
  }
  await page.setViewportSize({ width: 640, height: 720 });
  await page.goto("/comoros/km-vat", { waitUntil: "domcontentloaded" });
  await page.locator("body").evaluate((element) => {
    element.style.zoom = "2";
  });
  expect(
    await page.evaluate(
      () =>
        document.documentElement.scrollWidth -
        document.documentElement.clientWidth,
    ),
  ).toBeLessThanOrEqual(0);
});
test("French alias redirects to canonical", async ({ page }) => {
  await page.goto("/fr/comoros/km-vat.html", { waitUntil: "domcontentloaded" });
  await expect(page).toHaveURL(/\/fr\/comores\/calculateur-tva\/?$/);
  await page.goto("/fr/comoros/km-vat", { waitUntil: "domcontentloaded" });
  await expect(page).toHaveURL(/\/fr\/comores\/calculateur-tva\/?$/);
});
