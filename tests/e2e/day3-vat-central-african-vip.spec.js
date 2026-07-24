const { test, expect } = require("@playwright/test");
const fs = require("fs");
const pdfParse = require("pdf-parse");
const routes = [
  { lang: "en", path: "/car/cf-vat", button: "Calculate" },
  { lang: "fr", path: "/fr/centrafrique/calculateur-tva", button: "Calculer" },
  {
    lang: "sw",
    path: "/sw/central-african-republic/kikokotoo-vat/",
    button: "Kokotoa",
  },
];
for (const route of routes)
  test(`${route.lang} CAR VAT parity and PDF`, async ({ page }) => {
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
      await page.evaluate(() => window.CFVatApp.getResult()),
    ).toMatchObject({ net: 10000, vat: 1900, gross: 11900 });
    await page.locator('[data-cfv-mode="extract"]').click();
    await page.locator("#cfvAmount").fill("119000");
    expect(
      await page.evaluate(() => window.CFVatApp.getResult()),
    ).toMatchObject({ net: 100000, vat: 19000, gross: 119000 });
    await page.locator('[data-cfv-mode="add"]').click();
    await page.locator('[data-cfv-rate="listed-goods-confirmed"]').click();
    await page.locator("#cfvAmount").fill("100000");
    expect(
      await page.evaluate(() => window.CFVatApp.getResult()),
    ).toMatchObject({ rate: 5, vat: 5000, gross: 105000 });
    await page.locator("#cfvTurnover").fill("30000000");
    await page.locator("#cfvTurnoverForm").evaluate((f) => f.requestSubmit());
    await expect(page.locator("#cfvTurnoverResult")).toContainText(/30|IGU/);
    await page.locator("#cfvTurnover").fill("30000001");
    await page.locator("#cfvTurnoverForm").evaluate((f) => f.requestSubmit());
    await expect(page.locator("#cfvTurnoverResult")).toContainText(/VAT|DGID/);
    await page.locator('[data-cfv-rate="standard"]').click();
    await page.locator("#cfvAmount").fill("100000");
    const download = page.waitForEvent("download");
    await page.locator("#cfvPdf").click();
    const parsed = await pdfParse(
      fs.readFileSync(await (await download).path()),
    );
    expect(parsed.text).toContain("19000.00");
    expect(
      await page.evaluate(
        () =>
          document.documentElement.scrollWidth -
          document.documentElement.clientWidth,
      ),
    ).toBeLessThanOrEqual(0);
    expect(
      await page.evaluate(() =>
        Object.keys(localStorage).filter((k) => /cfv|cf-vat/i.test(k)),
      ),
    ).toEqual([]);
    expect(nonGet).toEqual([]);
    expect(errors).toEqual([]);
  });
test("manual dark, 320/360/375 and 200% reflow", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "light", reducedMotion: "reduce" });
  for (const width of [320, 360, 375]) {
    await page.setViewportSize({ width, height: 720 });
    await page.goto("/car/cf-vat", { waitUntil: "domcontentloaded" });
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
        .locator(".cfv-card")
        .first()
        .evaluate((el) => getComputedStyle(el).backgroundColor),
    ).not.toBe("rgb(255, 255, 255)");
  }
  await page.setViewportSize({ width: 640, height: 720 });
  await page.goto("/car/cf-vat", { waitUntil: "domcontentloaded" });
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
for (const alias of ["/fr/car/cf-vat.html", "/fr/car/cf-vat/"])
  test(`alias ${alias} redirects`, async ({ page }) => {
    await page.goto(alias, { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/\/fr\/centrafrique\/calculateur-tva\/?$/);
  });
