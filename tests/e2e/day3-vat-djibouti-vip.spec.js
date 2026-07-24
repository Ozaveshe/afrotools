const { test, expect } = require("@playwright/test");
const fs = require("node:fs");

const pages = [
  { path: "/djibouti/dj-vat", lang: "en", heading: /Djibouti VAT/i },
  { path: "/fr/djibouti/dj-vat", lang: "fr", heading: /TVA.*Djibouti/i },
  {
    path: "/sw/djibouti/kikokotoo-vat/",
    lang: "sw",
    heading: /VAT.*Djibouti/i,
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
    await expect(page.locator("#djvMain")).toContainText(/110[\s,.]?000/);
    const overflow = await page.evaluate(
      () =>
        document.documentElement.scrollWidth >
        document.documentElement.clientWidth + 1,
    );
    expect(overflow).toBe(false);
    expect(errors).toEqual([]);
  });
}

test("0% fails closed then calculates with exact evidence", async ({
  page,
}) => {
  await page.goto("/djibouti/dj-vat");
  await page.getByRole("button", { name: /Confirmed export/i }).click();
  await expect(page.locator("#djvError")).toContainText(
    /Confirm the exact statutory evidence/i,
  );
  await page.locator("#djvEvidence").check();
  await expect(page.locator("#djvMain")).toContainText(/100[\s,.]?000/);
  await expect(page.locator("#djvRate")).toHaveText("0%");
});

test("turnover screen keeps exact Article 6 boundaries", async ({ page }) => {
  await page.goto("/djibouti/dj-vat");
  await page.locator("#djvTurnover").fill("80000000");
  await page.getByRole("button", { name: /Review threshold context/i }).click();
  await expect(page.locator("#djvTurnoverResult")).toContainText(
    /next-year VAT treatment/i,
  );
  await page.locator("#djvTurnover").fill("120000000");
  await page.getByRole("button", { name: /Review threshold context/i }).click();
  await expect(page.locator("#djvTurnoverResult")).toContainText(
    /crossing month/i,
  );
});

test("dark, 200% text and privacy surfaces hold", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await page.setViewportSize({ width: 640, height: 900 });
  await page.goto("/djibouti/dj-vat");
  await page.addStyleTag({ content: "html{font-size:200%!important}" });
  const colors = await page
    .locator(".djv-card")
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
    local: Object.keys(localStorage).filter((key) => /djv|dj-vat/i.test(key)),
    session: Object.keys(sessionStorage).filter((key) =>
      /djv|dj-vat/i.test(key),
    ),
    url: location.href,
  }));
  expect(persisted.local).toEqual([]);
  expect(persisted.session).toEqual([]);
  expect(persisted.url).not.toContain("100000");
  await page.screenshot({
    path: "artifacts/djibouti-vat-mobile-dark-200.png",
    fullPage: true,
  });
});

test("desktop visual and local PDF are production-shaped", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/djibouti/dj-vat");
  await page.screenshot({
    path: "artifacts/djibouti-vat-desktop.png",
    fullPage: true,
  });
  const downloadPromise = page.waitForEvent("download");
  await page.locator("#djvPdf").click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe("djibouti-vat-estimate.pdf");
  const path = await download.path();
  expect(fs.statSync(path).size).toBeGreaterThan(1000);
});
