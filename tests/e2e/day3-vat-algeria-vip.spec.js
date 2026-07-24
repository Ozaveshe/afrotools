const { test, expect } = require("@playwright/test");
const fs = require("fs");
const pdfParse = require("pdf-parse");

const routes = [
  {
    name: "en",
    path: "/algeria/dz-vat",
    calc: "Calculate Algeria VAT",
    pdf: "Algeria",
    reduced: "article 23",
    ifu: "not concerned",
  },
  {
    name: "fr",
    path: "/fr/algerie/calculateur-tva",
    calc: "Calculer la TVA Algérie",
    pdf: "Algérie",
    reduced: "article 23",
    ifu: "pas concernés",
  },
  {
    name: "sw",
    path: "/sw/algeria/kikokotoo-vat/",
    calc: "Kokotoa VAT ya Algeria",
    pdf: "Algeria",
    reduced: "kifungu cha 23",
    ifu: "hawahusiki",
  },
];

for (const route of routes)
  test(`${route.name} Algeria VAT VIP parity`, async ({ page }) => {
    const errors = [],
      nonGet = [],
      calculationNetwork = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });
    page.on("request", (request) => {
      if (request.method() !== "GET")
        nonGet.push(`${request.method()} ${request.url()}`);
      if (
        /cdnjs\.cloudflare|chart(\.umd)?\.min|ai-advisor|\.netlify\/functions/i.test(
          request.url(),
        )
      )
        calculationNetwork.push(request.url());
    });
    await page.emulateMedia({ colorScheme: "dark", reducedMotion: "reduce" });
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(route.path, { waitUntil: "networkidle" });
    await expect(page.locator("html")).toHaveAttribute("lang", route.name);
    await expect(page.getByRole("button", { name: route.calc })).toBeVisible();
    await expect(page.locator(".source-confidence-card")).toBeVisible();
    expect(
      await page.evaluate(() => window.DZVatApp.getResult()),
    ).toMatchObject({ net: 1000, vat: 190, gross: 1190 });
    await page.locator('[data-mode="extract"]').click();
    await page.locator("#dzvAmount").fill("1190");
    expect(
      await page.evaluate(() => window.DZVatApp.getResult()),
    ).toMatchObject({ net: 1000, vat: 190, gross: 1190 });
    await page.locator('[data-rate-kind="reduced"]').click();
    await page.locator('[data-mode="add"]').click();
    await page.locator("#dzvAmount").fill("1000");
    expect(
      await page.evaluate(() => window.DZVatApp.getResult()),
    ).toMatchObject({ rate: 9, vat: 90, gross: 1090 });
    await page.locator('[data-rate-kind="scenario"]').click();
    await page.locator("#dzvCustomRate").fill("7");
    expect(
      await page.evaluate(() => window.DZVatApp.getResult()),
    ).toMatchObject({ rate: 7, vat: 70, gross: 1070 });
    await page.locator('[data-rate-kind="standard"]').click();
    await page
      .locator("#dzvInvoiceForm")
      .evaluate((form) => form.requestSubmit());
    await expect(page.locator("#dzvInvoiceVat")).toContainText("190");
    await page.locator("#dzvClassification").selectOption("confirmed-reduced");
    await expect(page.locator("#dzvClassificationResult")).toContainText(
      route.reduced,
    );
    await page.locator("#dzvRegime").selectOption("ifu");
    await expect(page.locator("#dzvRegimeResult")).toContainText(route.ifu);
    const download = page.waitForEvent("download");
    await page.locator("#dzvPdf").click();
    const parsed = await pdfParse(
      fs.readFileSync(await (await download).path()),
    );
    expect(parsed.text).toContain(route.pdf);
    expect(parsed.text).toContain("1000.00");
    expect(parsed.text).toContain("190.00");
    expect(
      await page.evaluate(
        () =>
          document.documentElement.scrollWidth -
          document.documentElement.clientWidth,
      ),
    ).toBeLessThanOrEqual(0);
    expect(
      await page.evaluate(() =>
        Object.keys(localStorage).filter((key) => /dzv|vat/i.test(key)),
      ),
    ).toEqual([]);
    expect(nonGet).toEqual([]);
    expect(calculationNetwork).toEqual([]);
    expect(errors).toEqual([]);
    expect(
      await page
        .locator("main input, main select, main button")
        .evaluateAll((controls) =>
          controls
            .filter((control) => {
              const label = control.id
                ? document.querySelector(`label[for="${control.id}"]`)
                : null;
              return !(
                label ||
                control.getAttribute("aria-label") ||
                control.textContent.trim()
              );
            })
            .map((control) => control.id || control.outerHTML),
        ),
    ).toEqual([]);
    expect(
      await page.locator('main [aria-live="polite"]').count(),
    ).toBeGreaterThan(3);
    if (route.name !== "en") {
      const copy = await page.locator("body").innerText();
      expect(copy).not.toMatch(
        /Calculation mode|Professional service|Planning scenario only|Needs review|Check before filing|Download local PDF/,
      );
      const structured = (
        await page
          .locator('script[type="application/ld+json"]')
          .allTextContents()
      ).join(" ");
      expect(structured).not.toMatch(
        /What are Algeria's current VAT rates|Does this calculator decide|Does this tool send/,
      );
    }
    await expect(page.locator("afro-site-assistant")).toBeHidden();
    await page
      .locator("afro-navbar")
      .evaluate((element) =>
        element.style.setProperty("display", "none", "important"),
      );
    await page.screenshot({
      path: `artifacts/algeria-vat-${route.name}-375-dark.png`,
      fullPage: true,
    });
  });

test("Algeria VAT English 375 light", async ({ page }) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  await page.emulateMedia({ colorScheme: "light", reducedMotion: "reduce" });
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/algeria/dz-vat", { waitUntil: "networkidle" });
  await expect(
    page.getByRole("button", { name: "Calculate Algeria VAT" }),
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
    path: "artifacts/algeria-vat-en-375-light.png",
    fullPage: true,
  });
});

for (const width of [320, 360])
  test(`Algeria VAT compact ${width}px`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: "dark", reducedMotion: "reduce" });
    await page.setViewportSize({ width, height: 720 });
    await page.goto("/algeria/dz-vat", { waitUntil: "networkidle" });
    await expect(
      page.getByRole("button", { name: "Calculate Algeria VAT" }),
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

test("legacy French Algeria VAT alias redirects to the launched canonical", async ({
  page,
}) => {
  await page.goto("/fr/algeria/dz-vat", { waitUntil: "domcontentloaded" });
  await expect(page).toHaveURL(/\/fr\/algerie\/calculateur-tva$/);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    "https://afrotools.com/fr/algerie/calculateur-tva",
  );
});
