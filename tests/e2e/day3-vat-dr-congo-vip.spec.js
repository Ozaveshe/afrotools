const { test, expect } = require("@playwright/test");
const fs = require("node:fs");
const pages = [
  { path: "/dr-congo/cd-vat", lang: "en", heading: /DR Congo TVA/i },
  { path: "/fr/rdc/calculateur-tva", lang: "fr", heading: /TVA RDC/i },
  {
    path: "/sw/dr-congo/kikokotoo-vat/",
    lang: "sw",
    heading: /VAT ya DR Congo/i,
  },
];
for (const item of pages) {
  test(item.lang + " canonical calculator works at 320px", async ({ page }) => {
    const errors = [];
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });
    page.on("pageerror", (error) => errors.push(error.message));
    await page.setViewportSize({ width: 320, height: 800 });
    await page.goto(item.path);
    await expect(page.locator("html")).toHaveAttribute("lang", item.lang);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      item.heading,
    );
    await expect(page.locator("#cdvMain")).toContainText(/116[\s,.]?000/);
    expect(
      await page.evaluate(
        () =>
          document.documentElement.scrollWidth >
          document.documentElement.clientWidth + 1,
      ),
    ).toBe(false);
    expect(errors).toEqual([]);
  });
}
test("reduced treatment fails closed then calculates with evidence", async ({
  page,
}) => {
  await page.goto("/dr-congo/cd-vat");
  await page.getByRole("button", { name: /Confirmed reduced item/i }).click();
  await expect(page.locator("#cdvError")).toContainText(
    /Confirm the exact legal evidence/i,
  );
  await page.locator("#cdvEvidence").check();
  await expect(page.locator("#cdvMain")).toContainText(/108[\s,.]?000/);
  await expect(page.locator("#cdvRate")).toHaveText("8%");
});
test("registration boundary and liberal profession remain review-only", async ({
  page,
}) => {
  await page.goto("/dr-congo/cd-vat");
  await page.locator("#cdvTurnover").fill("80000000");
  await page
    .getByRole("button", { name: /Review registration context/i })
    .click();
  await expect(page.locator("#cdvRegistrationResult")).toContainText(
    /At least CDF 80m/i,
  );
  await page.locator("#cdvLiberalProfession").check();
  await page
    .getByRole("button", { name: /Review registration context/i })
    .click();
  await expect(page.locator("#cdvRegistrationResult")).toContainText(
    /regardless of turnover/i,
  );
});
test("dark, 200% text and privacy surfaces hold", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await page.setViewportSize({ width: 640, height: 900 });
  await page.goto("/dr-congo/cd-vat");
  await page.addStyleTag({ content: "html{font-size:200%!important}" });
  const colors = await page
    .locator(".cdv-card")
    .first()
    .evaluate((element) => ({
      bg: getComputedStyle(element).backgroundColor,
      color: getComputedStyle(element).color,
    }));
  expect(colors.bg).not.toBe("rgb(255, 255, 255)");
  expect(colors.color).not.toBe(colors.bg);
  expect(
    await page.evaluate(
      () =>
        document.documentElement.scrollWidth >
        document.documentElement.clientWidth + 1,
    ),
  ).toBe(false);
  const persisted = await page.evaluate(() => ({
    local: Object.keys(localStorage).filter((key) => /cdv|cd-vat/i.test(key)),
    session: Object.keys(sessionStorage).filter((key) =>
      /cdv|cd-vat/i.test(key),
    ),
    url: location.href,
  }));
  expect(persisted.local).toEqual([]);
  expect(persisted.session).toEqual([]);
  expect(persisted.url).not.toContain("100000");
  await page.screenshot({
    path: "artifacts/dr-congo-vat-mobile-dark-200.png",
    fullPage: true,
  });
});
test("desktop visual and local PDF are production-shaped", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/dr-congo/cd-vat");
  await page.screenshot({
    path: "artifacts/dr-congo-vat-desktop.png",
    fullPage: true,
  });
  const downloadPromise = page.waitForEvent("download");
  await page.locator("#cdvPdf").click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe("dr-congo-tva-estimate.pdf");
  expect(fs.statSync(await download.path()).size).toBeGreaterThan(1000);
});
