const { test, expect } = require("@playwright/test");
const fs = require("fs");
const pdfParse = require("pdf-parse");
const routes = [
  {
    lang: "en",
    path: "/cape-verde/cv-vat",
    button: "Calculate",
    pdf: "Cabo Verde",
  },
  {
    lang: "fr",
    path: "/fr/cape-verde/cv-vat/",
    button: "Calculer",
    pdf: "Cabo Verde",
  },
  {
    lang: "sw",
    path: "/sw/cape-verde/kikokotoo-vat/",
    button: "Kokotoa",
    pdf: "Cabo Verde",
  },
];
for (const route of routes)
  test(`${route.lang} Cabo Verde VAT parity`, async ({ page }) => {
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
    await page.goto(route.path, { waitUntil: "domcontentloaded" });
    await expect(page.locator("html")).toHaveAttribute("lang", route.lang);
    await expect(
      page.getByRole("button", { name: route.button, exact: true }),
    ).toBeVisible();
    expect(
      await page.evaluate(() => window.CVVatApp.getResult()),
    ).toMatchObject({ net: 10000, vat: 1500, gross: 11500 });
    await page.locator('[data-cvv-mode="extract"]').click();
    await page.locator("#cvvAmount").fill("1150");
    expect(
      await page.evaluate(() => window.CVVatApp.getResult()),
    ).toMatchObject({ net: 1000, vat: 150, gross: 1150 });
    await page.locator('[data-cvv-mode="add"]').click();
    await page.locator('[data-cvv-rate="water-electricity"]').click();
    await page.locator("#cvvAmount").fill("1000");
    expect(
      await page.evaluate(() => window.CVVatApp.getResult()),
    ).toMatchObject({ rate: 8, vat: 80, gross: 1080 });
    await page.locator("#cvvClassification").selectOption("tourism");
    await expect(page.locator("#cvvClassificationResult")).toContainText("15");
    await page.locator('[data-cvv-rate="standard"]').click();
    await page.locator("#cvvAmount").fill("1000");
    const download = page.waitForEvent("download");
    await page.locator("#cvvPdf").click();
    const parsed = await pdfParse(
      fs.readFileSync(await (await download).path()),
    );
    expect(parsed.text).toContain(route.pdf);
    expect(parsed.text).toContain("150.00");
    expect(
      await page.evaluate(
        () =>
          document.documentElement.scrollWidth -
          document.documentElement.clientWidth,
      ),
    ).toBeLessThanOrEqual(0);
    expect(
      await page.evaluate(() =>
        Object.keys(localStorage).filter((k) => /cvv|cv-vat/i.test(k)),
      ),
    ).toEqual([]);
    expect(nonGet).toEqual([]);
    expect(errors).toEqual([]);
  });
test("manual dark, compact widths and 200% reflow", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "light", reducedMotion: "reduce" });
  for (const width of [320, 360, 375]) {
    await page.setViewportSize({ width, height: 720 });
    await page.goto("/cape-verde/cv-vat", { waitUntil: "domcontentloaded" });
    await page.locator("html").evaluate((el) => {
      el.dataset.theme = "dark";
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
        .locator(".cvv-card")
        .first()
        .evaluate((el) => getComputedStyle(el).backgroundColor),
    ).not.toBe("rgb(255, 255, 255)");
  }
  await page.setViewportSize({ width: 640, height: 720 });
  await page.goto("/cape-verde/cv-vat", { waitUntil: "domcontentloaded" });
  await page.locator("body").evaluate((el) => {
    el.style.zoom = "2";
  });
  expect(
    await page.evaluate(
      () =>
        document.documentElement.scrollWidth -
        document.documentElement.clientWidth,
    ),
  ).toBeLessThanOrEqual(0);
});
test("legacy French file redirects to canonical product", async ({ page }) => {
  await page.goto("/fr/cape-verde/cv-vat.html", { waitUntil: "domcontentloaded" });
  await expect(page).toHaveURL(/\/fr\/cape-verde\/cv-vat\/?$/);
});
