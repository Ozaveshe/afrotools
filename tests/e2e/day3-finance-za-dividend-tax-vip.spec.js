const { test, expect } = require("@playwright/test");

const route = "/tools/za-dividend-tax/";

test("calculates the standard SARS example without console errors", async ({ page }) => {
  const errors = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (failure) => errors.push(failure.message));
  await page.goto(route);
  await page.getByLabel(/in-scope cash-dividend/i).check();
  await page.getByRole("button", { name: "Calculate dividends tax estimate" }).click();
  await expect(page.locator("[data-tax]")).toContainText(/20.*000,00/);
  await expect(page.locator("[data-net]")).toContainText(/80.*000,00/);
  await expect(page.locator("[data-rate]")).toHaveText("20.00%");
  await expect(page.locator("[data-due-date]")).toContainText("31 August 2026");
  expect(errors).toEqual([]);
});

test("reduced and exempt treatments require declaration evidence", async ({ page }) => {
  await page.goto(route);
  await page.getByLabel(/in-scope cash-dividend/i).check();
  await page.getByLabel("Withholding treatment").selectOption("reduced");
  await page.getByLabel(/verified effective dta rate/i).fill("12.5");
  await page.getByRole("button", { name: "Calculate dividends tax estimate" }).click();
  await expect(page.locator("[data-error]")).toContainText("required exemption or reduced-rate declaration");
  await page.getByLabel(/confirmation of the exemption/i).check();
  await page.getByRole("button", { name: "Calculate dividends tax estimate" }).click();
  await expect(page.locator("[data-rate]")).toHaveText("12.50%");
  await expect(page.locator("[data-tax]")).toContainText(/12.*500,00/);
  await page.getByLabel("Withholding treatment").selectOption("exempt");
  await page.getByRole("button", { name: "Calculate dividends tax estimate" }).click();
  await expect(page.locator("[data-rate]")).toHaveText("0.00%");
});

test("scope fails closed and no treaty-country shortcut is present", async ({ page }) => {
  await page.goto(route);
  await page.getByRole("button", { name: "Calculate dividends tax estimate" }).click();
  await expect(page.locator("[data-error]")).toContainText("in-scope cash-dividend estimate");
  await expect(
    page.locator('[data-za-dividend-tax-app] select[name*="country" i]'),
  ).toHaveCount(0);
  await expect(page.getByText(/STC credits are not part/)).toBeVisible();
  await expect(page.getByText(/foreign company for a share listed on a South African exchange/i)).toBeVisible();
});

test("TXT and print-to-PDF actions remain local and clearly labelled", async ({ page }) => {
  await page.goto(route);
  await page.getByLabel(/in-scope cash-dividend/i).check();
  await page.getByRole("button", { name: "Calculate dividends tax estimate" }).click();
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download TXT" }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe("south-africa-dividends-tax-estimate.txt");
  await page.evaluate(() => {
    window.print = () => {
      document.documentElement.dataset.printInvoked = "yes";
    };
  });
  await page.getByRole("button", { name: "Print / save PDF" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-print-invoked", "yes");
  await expect(page.locator("[data-result]")).toContainText(
    /not a SARS return, tax certificate, declaration/i,
  );
});

test("360px mobile and manual dark mode keep controls usable", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto(route);
  const width = await page.evaluate(() => ({
    scroll: document.documentElement.scrollWidth,
    client: document.documentElement.clientWidth,
  }));
  expect(width.scroll).toBeLessThanOrEqual(width.client + 1);
  await expect(page.getByRole("button", { name: "Calculate dividends tax estimate" })).toHaveCSS("min-height", "44px");
  await page.evaluate(() => {
    document.documentElement.dataset.theme = "dark";
  });
  const colors = await page.locator("[data-za-dividend-tax-app] .za-dt-card").first().evaluate((node) => ({
    background: getComputedStyle(node).backgroundColor,
    color: getComputedStyle(node).color,
  }));
  expect(colors.background).toBe("rgb(21, 33, 25)");
  expect(colors.color).not.toBe(colors.background);
  await expect(page.locator('[data-tool-verification-panel] a[href*="sars.gov.za"]')).toBeVisible();
});

test("native French sibling uses the same fail-closed engine without an iframe", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/fr/tools/za-impot-dividendes/");
  await expect(page.locator("html")).toHaveAttribute("lang", "fr");
  await expect(page.locator("iframe")).toHaveCount(0);
  await expect(page.getByText(/R23\s?000|exemption étrangère/i)).toHaveCount(0);
  await page.getByLabel(/dans le périmètre/i).check();
  await page.getByRole("button", { name: "Calculer l’estimation" }).click();
  await expect(page.locator("[data-tax]")).toContainText(/20.*000,00/);
  await page.getByLabel("Traitement de la retenue").selectOption("reduced");
  await page.getByLabel(/taux conventionnel effectif vérifié/i).fill("7.5");
  await page.getByRole("button", { name: "Calculer l’estimation" }).click();
  await expect(page.locator("[data-error]")).toContainText(/déclaration d’exonération ou de taux réduit/i);
  const width = await page.evaluate(() => ({
    scroll: document.documentElement.scrollWidth,
    client: document.documentElement.clientWidth,
  }));
  expect(width.scroll).toBeLessThanOrEqual(width.client + 1);
});
