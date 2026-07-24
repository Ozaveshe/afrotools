const { test, expect } = require("@playwright/test");

const pages = [
  { path: "/cote-divoire/ci-vat", lang: "en", heading: /Côte d'Ivoire VAT/i },
  {
    path: "/fr/cote-divoire/calculateur-tva",
    lang: "fr",
    heading: /TVA ivoirienne/i,
  },
  {
    path: "/sw/cote-divoire/kikokotoo-vat/",
    lang: "sw",
    heading: /VAT ya Côte d'Ivoire/i,
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
    await expect(page.locator("#civMain")).toContainText(/118[\s,.]?000/);
    const overflow = await page.evaluate(
      () =>
        document.documentElement.scrollWidth >
        document.documentElement.clientWidth + 1,
    );
    expect(overflow).toBe(false);
    expect(errors).toEqual([]);
  });
}

test("special rate fails closed then calculates with evidence", async ({
  page,
}) => {
  await page.goto("/cote-divoire/ci-vat");
  await page.getByRole("button", { name: /2026 ordinance/i }).click();
  await expect(page.locator("#civError")).toContainText(
    /Confirm the exact legal item/i,
  );
  await page.locator("#civEvidence").check();
  await expect(page.locator("#civMain")).toContainText(/109[\s,.]?000/);
  await expect(page.locator("#civRate")).toHaveText("9%");
});

test("dark, 200% text and privacy surfaces hold", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await page.setViewportSize({ width: 640, height: 900 });
  await page.goto("/cote-divoire/ci-vat");
  await page.addStyleTag({ content: "html{font-size:200%!important}" });
  const colors = await page
    .locator(".civ-card")
    .first()
    .evaluate((element) => ({
      bg: getComputedStyle(element).backgroundColor,
      color: getComputedStyle(element).color,
    }));
  expect(colors.bg).not.toBe("rgb(255, 255, 255)");
  expect(colors.color).not.toBe(colors.bg);
  const overflow = await page.evaluate(
    () =>
      document.documentElement.scrollWidth >
      document.documentElement.clientWidth + 1,
  );
  expect(overflow).toBe(false);
  const persisted = await page.evaluate(() => ({
    local: Object.keys(localStorage).filter((key) => /civ|ci-vat/i.test(key)),
    session: Object.keys(sessionStorage).filter((key) =>
      /civ|ci-vat/i.test(key),
    ),
    url: location.href,
  }));
  expect(persisted.local).toEqual([]);
  expect(persisted.session).toEqual([]);
  expect(persisted.url).not.toContain("100000");
  await page.screenshot({
    path: "artifacts/cote-divoire-vat-dark-200.png",
    fullPage: true,
  });
});

test("PDF is generated locally and has content", async ({ page }) => {
  await page.goto("/cote-divoire/ci-vat");
  const downloadPromise = page.waitForEvent("download");
  await page.locator("#civPdf").click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe("cote-divoire-vat-estimate.pdf");
  const path = await download.path();
  const fs = require("node:fs");
  expect(fs.statSync(path).size).toBeGreaterThan(1000);
});
