const { test, expect } = require("@playwright/test");

const routes = [
  {
    name: "en",
    path: "/benin/bj-vat",
    amount: "#amount",
    net: "#resPretax",
    vat: "#resVat",
    total: "#resAmount",
  },
  {
    name: "fr",
    path: "/fr/benin/calculateur-tva",
    amount: "#amount",
    net: "#resContent",
    vat: "#resContent",
    total: "#resAmount",
  },
  {
    name: "sw",
    path: "/sw/benin/kikokotoo-vat/",
    amount: "#amount",
    net: "#netAmount",
    vat: "#vatAmount",
    total: "#totalAmount",
  },
];

for (const route of routes) {
  test(`${route.name} Benin VAT uses the reviewed engine`, async ({ page }) => {
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
    await page.locator(route.amount).fill("1000");
    if (route.name === "fr") {
      await page.getByRole("button", { name: /Calculer la TVA/i }).click();
    }
    await expect(page.locator(route.net)).toContainText("1");
    await expect(page.locator(route.vat)).toContainText("180");
    await expect(page.locator(route.total)).toContainText("1");
    expect(
      await page.evaluate(() =>
        window.AfroTools.BJVatEngine.calculate({
          amount: 1180,
          mode: "extract",
        }),
      ),
    ).toMatchObject({ net: 1000, vat: 180, gross: 1180 });
    await expect(
      page.locator('[data-tool-verification-panel][data-tool-id="bj-vat"]'),
    ).toBeVisible();
    await expect(
      page.getByText(/article 241|kifungu cha 241/i).first(),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () =>
          document.documentElement.scrollWidth -
          document.documentElement.clientWidth,
      ),
    ).toBeLessThanOrEqual(0);
    expect(nonGet).toEqual([]);
    expect(errors).toEqual([]);
    expect(
      await page.evaluate(() =>
        Object.keys(localStorage).filter((key) => /bj.?vat/i.test(key)),
      ),
    ).toEqual([]);
    await page.evaluate(() => {
      document.documentElement.dataset.theme = "dark";
    });
    const dark = await page.locator("body").evaluate((body) => {
      const style = getComputedStyle(body);
      return { background: style.backgroundColor, color: style.color };
    });
    expect(dark.background).not.toBe("rgb(255, 255, 255)");
    expect(dark.color).not.toBe(dark.background);
  });
}

test("Benin VAT print/PDF actions stay local", async ({ page }) => {
  await page.goto("/benin/bj-vat", { waitUntil: "networkidle" });
  await expect(
    page.getByRole("button", { name: /Print \/ Save PDF/i }),
  ).toBeEnabled();
  expect(await page.evaluate(() => window.printResult.toString())).toMatch(
    /window\.print\(\)/,
  );
});

test("legacy French Benin VAT alias redirects to the canonical", async ({
  page,
}) => {
  await page.goto("/fr/benin/bj-vat", { waitUntil: "domcontentloaded" });
  await expect(page).toHaveURL(/\/fr\/benin\/calculateur-tva$/);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    "https://afrotools.com/fr/benin/calculateur-tva",
  );
});
