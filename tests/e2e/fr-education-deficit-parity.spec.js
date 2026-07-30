const { test, expect } = require("@playwright/test");
const pdfParse = require("pdf-parse");
const manifest = require("../../data/localization/fr-education-parity.json");

const deficit = manifest.routes.filter((route) => route.owner !== "existing-native-owner");

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: async (text) => { window.__copiedEducation = text; } }
    });
    window.print = () => { window.__printedEducation = true; };
  });
});

for (const route of deficit) {
  test(`${route.id}: valid owner workflow and every rendered action`, async ({ page }) => {
    const errors = [];
    page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
    page.on("pageerror", (error) => errors.push(error.message));
    const response = await page.goto(route.french, { waitUntil: "networkidle" });
    expect(response && response.ok()).toBeTruthy();
    await expect(page.locator("body")).toHaveAttribute("data-education-parity-ready", "true");
    await page.locator("[data-education-form] button[type=submit]").click();
    await expect(page.locator("[data-education-result]")).toHaveClass(/show/);
    await expect(page.locator("[data-education-metrics] .metric")).toHaveCount(
      await page.locator("[data-education-metrics] .metric").count()
    );
    expect(await page.locator("[data-education-metrics] .metric").count()).toBeGreaterThanOrEqual(3);
    const metricText = await page.locator("[data-education-metrics]").innerText();
    expect(metricText).not.toMatch(/Bachelor's minimum|Timed practice|upcoming|within-half-band|admission or further study|Area per learner|APA 7 draft|Strong Match|Good Match/);

    await page.locator('[data-action="copy"]').click();
    expect(await page.evaluate(() => window.__copiedEducation || "")).toContain("Résultat local");

    for (const action of ["json", "csv", "txt"]) {
      const downloadPromise = page.waitForEvent("download");
      await page.locator(`[data-action="${action}"]`).click();
      const download = await downloadPromise;
      const stream = await download.createReadStream();
      const chunks = [];
      for await (const chunk of stream) chunks.push(chunk);
      const content = Buffer.concat(chunks).toString("utf8");
      expect(content.length).toBeGreaterThan(40);
      if (action === "json") expect(() => JSON.parse(content)).not.toThrow();
      if (action === "csv") expect(content).toContain("Champ,Valeur");
    }

    const pdfPromise = page.waitForEvent("download");
    await page.locator('[data-action="pdf"]').click();
    const pdfDownload = await pdfPromise;
    const pdfStream = await pdfDownload.createReadStream();
    const pdfChunks = [];
    for await (const chunk of pdfStream) pdfChunks.push(chunk);
    const parsed = await pdfParse(Buffer.concat(pdfChunks));
    expect(parsed.text.length).toBeGreaterThan(60);

    await page.locator('[data-action="save"]').click();
    expect(await page.evaluate((id) => localStorage.getItem(`afrotools:fr-education:${id}`), route.id)).toBeTruthy();
    await page.locator('[data-action="print"]').click();
    expect(await page.evaluate(() => window.__printedEducation)).toBe(true);
    expect(errors).toEqual([]);
  });

  test(`${route.id}: invalid input fails closed`, async ({ page }) => {
    await page.goto(route.french, { waitUntil: "networkidle" });
    await page.locator("[data-education-form]").evaluate((form) => { form.noValidate = true; });
    const target = page.locator("[data-education-form] [name]").first();
    await target.evaluate((field) => { field.value = ""; });
    await page.locator("[data-education-form] button[type=submit]").click();
    await expect(page.locator("[data-education-status]")).toHaveClass(/error/);
    await expect(page.locator("[data-education-result]")).not.toHaveClass(/show/);
  });
}
