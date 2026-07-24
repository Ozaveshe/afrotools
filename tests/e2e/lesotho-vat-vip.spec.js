const { test, expect } = require("@playwright/test");
const routes = [
  [
    "/lesotho/ls-vat",
    "Lesotho VAT calculator",
    "Sources & verification",
    "Report a calculation error",
  ],
  [
    "/fr/lesotho/ls-vat",
    "Calculateur TVA Lesotho",
    "Sources et vérification",
    "Signaler une erreur de calcul",
  ],
  [
    "/sw/lesotho/kikokotoo-vat/",
    "Kikokotoo cha VAT Lesotho",
    "Vyanzo na uthibitisho",
    "Ripoti hitilafu ya hesabu",
  ],
];
for (const [route, title, verification, report] of routes)
  test(`${route} shares RSL engine`, async ({ page }) => {
    const errors = [];
    page.on("console", (m) => {
      if (m.type() === "error") errors.push(m.text());
    });
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto(route);
    await expect(page.locator(".gnv-hero h1")).toHaveText(title);
    await expect(
      page.locator("[data-tool-verification-panel] h2").last(),
    ).toHaveText(verification);
    await expect(
      page.locator('[data-tool-verification-panel] a[href^="mailto:"]'),
    ).toHaveText(report);
    await expect(page.locator("#lsvGross")).toContainText(/1\D*150/);
    await page.locator("#lsvRate").selectOption("confirmed-electricity-ten");
    await expect(page.locator("#lsvResult")).not.toHaveClass(/on/);
    await page.locator("#lsvEvidence").check();
    await expect(page.locator("#lsvVat")).toContainText(/100/);
    expect(errors).toEqual([]);
  });
test("mobile dark zoom and reduced motion", async ({ page }) => {
  for (const width of [320, 375, 768]) {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ colorScheme: "dark", reducedMotion: "reduce" });
    await page.goto("/lesotho/ls-vat");
    if (width === 320)
      await page.evaluate(() => (document.documentElement.style.zoom = "2"));
    expect(
      await page
        .locator(".gnv-card")
        .first()
        .evaluate((n) => n.scrollWidth <= n.clientWidth),
    ).toBe(true);
  }
});
test("PDF and widget", async ({ page }) => {
  await page.goto("/lesotho/ls-vat");
  const d = page.waitForEvent("download");
  await page.locator("#lsvPdf").click();
  expect((await d).suggestedFilename()).toBe("lesotho-vat-estimate.pdf");
  await page.goto("/widgets/iframe/financial-lesotho-vat.html");
  await expect(page.locator("[data-gross]")).toContainText(/1\D*150/);
});
test("visual proof", async ({ page }) => {
  for (const item of [
    { width: 320, theme: "system-dark" },
    { width: 375, theme: "light" },
    { width: 768, theme: "manual-dark" },
  ]) {
    await page.setViewportSize({ width: item.width, height: 900 });
    await page.emulateMedia({
      colorScheme: item.theme === "system-dark" ? "dark" : "light",
    });
    await page.goto("/lesotho/ls-vat");
    if (item.theme === "manual-dark")
      await page.evaluate(() =>
        document.documentElement.setAttribute("data-theme", "dark"),
      );
    await page.screenshot({
      path: `test-results/lesotho-vat-${item.width}-${item.theme}.png`,
      fullPage: true,
    });
  }
});
