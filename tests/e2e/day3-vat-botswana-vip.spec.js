const { test, expect } = require("@playwright/test");
const fs = require("fs");
const pdfParse = require("pdf-parse");

const routes = [
  {
    lang: "en",
    path: "/botswana/bw-vat",
    button: "Calculate Botswana VAT",
    pdfText: "Botswana",
  },
  {
    lang: "fr",
    path: "/fr/botswana/bw-vat",
    button: "Calculer la TVA Botswana",
    pdfText: "Botswana",
  },
  {
    lang: "sw",
    path: "/sw/botswana/kikokotoo-vat/",
    button: "Kokotoa VAT ya Botswana",
    pdfText: "Botswana",
  },
];

for (const route of routes) {
  test(`${route.lang} Botswana VAT VIP parity`, async ({ page }) => {
    const errors = [];
    const nonGet = [];
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
    await expect(page.locator("html")).toHaveAttribute("lang", route.lang);
    await expect(
      page.getByRole("button", { name: route.button }),
    ).toBeVisible();
    await expect(
      page.locator('[data-source-meta-id="vat-bw-source"]').first(),
    ).toBeVisible();
    expect(
      await page.evaluate(() => window.BWVatApp.getResult()),
    ).toMatchObject({ net: 10000, vat: 1400, gross: 11400 });
    await page.locator('[data-bwv-mode="extract"]').click();
    await page.locator("#bwvAmount").fill("11400");
    expect(
      await page.evaluate(() => window.BWVatApp.getResult()),
    ).toMatchObject({ net: 10000, vat: 1400, gross: 11400 });
    await page.locator('[data-bwv-rate="confirmed-zero"]').click();
    expect(
      await page.evaluate(() => window.BWVatApp.getResult()),
    ).toMatchObject({ rate: 0, vat: 0 });
    await page.locator('[data-bwv-rate="standard"]').click();
    await page
      .locator("#bwvInvoiceForm")
      .evaluate((form) => form.requestSubmit());
    await expect(page.locator("#bwvInvoiceVat")).toContainText("1");
    await page
      .locator("#bwvRegistrationForm")
      .evaluate((form) => form.requestSubmit());
    await expect(page.locator("#bwvRegistrationResult")).not.toBeEmpty();
    const download = page.waitForEvent("download");
    await page.locator("#bwvPdf").click();
    const parsed = await pdfParse(
      fs.readFileSync(await (await download).path()),
    );
    expect(parsed.text).toContain(route.pdfText);
    expect(parsed.text).toContain("10000.00");
    expect(parsed.text).toContain("1400.00");
    expect(
      await page.evaluate(
        () =>
          document.documentElement.scrollWidth -
          document.documentElement.clientWidth,
      ),
    ).toBeLessThanOrEqual(0);
    expect(
      await page.evaluate(() =>
        Object.keys(localStorage).filter((key) => /bwv|bw-vat/i.test(key)),
      ),
    ).toEqual([]);
    expect(nonGet).toEqual([]);
    expect(errors).toEqual([]);
    await page
      .locator("afro-navbar")
      .evaluate((element) =>
        element.style.setProperty("display", "none", "important"),
      );
    await page.screenshot({
      path: `artifacts/botswana-vat-${route.lang}-375-dark.png`,
      fullPage: true,
    });
  });
}

test("Botswana VAT manual dark theme and compact widths", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "light", reducedMotion: "reduce" });
  for (const width of [320, 360, 390]) {
    await page.setViewportSize({ width, height: 720 });
    await page.goto("/botswana/bw-vat", { waitUntil: "networkidle" });
    await page.locator("html").evaluate((element) => {
      element.dataset.theme = "dark";
    });
    await expect(
      page.getByRole("button", { name: "Calculate Botswana VAT" }),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () =>
          document.documentElement.scrollWidth -
          document.documentElement.clientWidth,
      ),
    ).toBeLessThanOrEqual(0);
    const colors = await page
      .locator(".bwv-card")
      .first()
      .evaluate((element) => ({
        background: getComputedStyle(element).backgroundColor,
        color: getComputedStyle(element).color,
      }));
    expect(colors.background).not.toBe("rgb(255, 255, 255)");
    expect(colors.color).not.toBe("rgb(17, 35, 31)");
  }
});
