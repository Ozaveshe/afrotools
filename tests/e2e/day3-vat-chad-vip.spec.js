const { test, expect } = require("@playwright/test");
const fs = require("fs");
const pdfParse = require("pdf-parse");

const routes = [
  { lang: "en", path: "/chad/td-vat", button: "Calculate" },
  { lang: "fr", path: "/fr/tchad/calculateur-tva", button: "Calculer" },
  { lang: "sw", path: "/sw/chad/kikokotoo-vat/", button: "Kokotoa" },
];

for (const route of routes)
  test(`${route.lang} Chad VAT parity, boundaries and PDF`, async ({
    page,
  }) => {
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
      await page.evaluate(() => window.TDVatApp.getResult()),
    ).toMatchObject({ net: 100000, vat: 19250, gross: 119250 });
    await page.locator('[data-tdv-mode="extract"]').click();
    await page.locator("#tdvAmount").fill("119250");
    expect(
      await page.evaluate(() => window.TDVatApp.getResult()),
    ).toMatchObject({ net: 100000, vat: 19250, gross: 119250 });
    await page.locator('[data-tdv-mode="add"]').click();
    await page
      .locator('[data-tdv-rate="article-238-reduced-confirmed"]')
      .click();
    await page.locator("#tdvAmount").fill("100000");
    expect(
      await page.evaluate(() => window.TDVatApp.getResult()),
    ).toMatchObject({ rate: 9.9, vat: 9900, gross: 109900 });
    await page
      .locator("#tdvInvoiceForm")
      .evaluate((form) => form.requestSubmit());
    await expect(page.locator("#tdvInvoiceVat")).toContainText(/9[,.\s]?900/);
    await page.locator("#tdvIglConfirmed").check();
    await page.locator("#tdvOperation").fill("50000000");
    await page
      .locator("#tdvBoundaryForm")
      .evaluate((form) => form.requestSubmit());
    await expect(page.locator("#tdvOperationResult")).not.toHaveText(
      /no-large-operation-override/,
    );
    await page.locator("#tdvOperation").fill("50000001");
    await page
      .locator("#tdvBoundaryForm")
      .evaluate((form) => form.requestSubmit());
    await expect(page.locator("#tdvOperationResult")).toContainText(/229|VAT/);
    await page.locator('[data-tdv-rate="standard"]').click();
    await page.locator("#tdvAmount").fill("100000");
    const download = page.waitForEvent("download");
    await page.locator("#tdvPdf").click();
    const parsed = await pdfParse(
      fs.readFileSync(await (await download).path()),
    );
    expect(parsed.text).toContain("19250.00");
    expect(
      await page.evaluate(
        () =>
          document.documentElement.scrollWidth -
          document.documentElement.clientWidth,
      ),
    ).toBeLessThanOrEqual(0);
    expect(
      await page.evaluate(() =>
        Object.keys(localStorage).filter((k) => /tdv|td-vat/i.test(k)),
      ),
    ).toEqual([]);
    expect(nonGet).toEqual([]);
    expect(errors).toEqual([]);
  });

test("manual dark, mobile widths, 768px and 200% reflow", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "light", reducedMotion: "reduce" });
  for (const width of [320, 360, 375, 768]) {
    await page.setViewportSize({ width, height: 720 });
    await page.goto("/chad/td-vat", { waitUntil: "domcontentloaded" });
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
        .locator(".tdv-card")
        .first()
        .evaluate((el) => getComputedStyle(el).backgroundColor),
    ).not.toBe("rgb(255, 255, 255)");
  }
  await page.setViewportSize({ width: 640, height: 720 });
  await page.goto("/chad/td-vat", { waitUntil: "domcontentloaded" });
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

test("French alias redirects to the canonical route", async ({ page }) => {
  await page.goto("/fr/chad/td-vat.html", { waitUntil: "domcontentloaded" });
  await expect(page).toHaveURL(/\/fr\/tchad\/calculateur-tva\/?$/);
});
