const { test, expect } = require("@playwright/test");
const fs = require("node:fs"),
  path = require("node:path"),
  { execFileSync } = require("node:child_process");
async function artifact(page, kind) {
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.locator(`[data-swel-export="${kind}"]`).click(),
  ]);
  const file = await download.path();
  return { file, buffer: fs.readFileSync(file) };
}
test("native Swahili electrical workflow proves oracle exports privacy and interaction", async ({
  page,
}) => {
  const errors = [],
    requests = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => {
    if (m.type() === "error" && !/ERR_FAILED/.test(m.text()))
      errors.push(m.text());
  });
  page.on("request", (r) =>
    requests.push(r.url() + " " + (r.postData() || "")),
  );
  await page.route(/^https?:\/\/(?!127\.0\.0\.1:43153)/, (r) => r.abort());
  await page.goto("/sw/zana/kikokotoo-mzigo-wa-umeme/");
  for (const [width, size] of [
    [320, "100%"],
    [375, "100%"],
    [640, "200%"],
  ]) {
    await page.setViewportSize({ width, height: 900 });
    await page.evaluate(
      (s) => (document.documentElement.style.fontSize = s),
      size,
    );
    await expect
      .poll(() =>
        page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth + 1,
        ),
      )
      .toBe(true);
  }
  await page.evaluate(() => (document.documentElement.style.fontSize = ""));
  await page.getByRole("button", { name: "Kokotoa makisio" }).click();
  await expect(page.locator("#swelMetrics")).toContainText("0.47 kW");
  await expect(page.locator("#swelMetrics")).toContainText("1.43 A");
  await expect(page.locator("#swelCost")).toContainText("13,219");
  const json = await artifact(page, "json"),
    record = JSON.parse(json.buffer.toString("utf8"));
  expect(record.format).toBe("afrotools-electrical-load");
  expect(record.result.monthlyKwh).toBe(194.4);
  await page
    .locator("#swelImport")
    .setInputFiles({
      name: "electrical.json",
      mimeType: "application/json",
      buffer: json.buffer,
    });
  await expect(page.locator("#swelStatus")).toContainText("imefunguliwa");
  expect((await artifact(page, "csv")).buffer.toString("utf8")).toContain(
    '"mzigo_kw","0.47"',
  );
  expect((await artifact(page, "txt")).buffer.toString("utf8")).toContain(
    "fundi umeme mwenye leseni",
  );
  const pdf = await artifact(page, "pdf");
  expect(pdf.buffer.subarray(0, 4).toString()).toBe("%PDF");
  const parsed = JSON.parse(
    execFileSync(
      process.execPath,
      [path.resolve(__dirname, "../support/parse-pdf-download.js"), pdf.file],
      { encoding: "utf8" },
    ),
  );
  expect(parsed.numpages).toBeGreaterThan(0);
  await page.locator('.swel-row [name="hours"]').first().fill("25");
  await page.getByRole("button", { name: "Kokotoa makisio" }).click();
  await expect(page.locator("#swelError")).toBeVisible();
  await expect(page.locator("#swelResult")).toBeHidden();
  await page.getByRole("button", { name: "Weka upya" }).click();
  await expect(page.locator("#swelResult")).toBeHidden();
  const light = await page
    .locator("body")
    .evaluate((el) => getComputedStyle(el).backgroundColor);
  await page.evaluate(() => document.documentElement.classList.add("dark"));
  expect(
    await page
      .locator("body")
      .evaluate((el) => getComputedStyle(el).backgroundColor),
  ).not.toBe(light);
  await page.locator("#swelCountry").focus();
  await page.keyboard.press("Tab");
  await expect(page.locator("#swelPhases")).toBeFocused();
  expect(errors).toEqual([]);
  expect(requests.join(" ")).not.toContain("electrical.json");
});
test("English route uses shared engine and preserves its complete home calculation", async ({
  page,
}) => {
  await page.route(/^https?:\/\/(?!127\.0\.0\.1:43153)/, (r) => r.abort());
  await page.goto("/tools/electrical-load/");
  expect(
    await page.evaluate(() => Boolean(window.AfroToolsElectricalLoadEngine)),
  ).toBe(true);
  await page.getByRole("button", { name: "Calculate Load" }).click();
  await expect(page.locator("#resultGrid")).toContainText("6.2 kW");
  await expect(page.locator("#electricalStatus")).toContainText(
    "Planning estimate ready",
  );
});
test("canonical artwork schema and reciprocal hreflang remain exact", async ({
  page,
}) => {
  for (const route of [
    "/tools/electrical-load/",
    "/fr/tools/charge-electrique/",
    "/sw/zana/kikokotoo-mzigo-wa-umeme/",
  ]) {
    await page.goto(route);
    await expect(
      page.locator('link[rel="alternate"][hreflang="sw"]'),
    ).toHaveAttribute(
      "href",
      "https://afrotools.com/sw/zana/kikokotoo-mzigo-wa-umeme/",
    );
  }
  await page.goto("/sw/zana/kikokotoo-mzigo-wa-umeme/");
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
    "content",
    /electrical-load\.webp$/,
  );
  expect(
    await page
      .locator('script[type="application/ld+json"]')
      .evaluateAll((nodes) =>
        nodes
          .map((n) => JSON.parse(n.textContent))
          .some(
            (x) => x["@type"] === "WebApplication" && x.inLanguage === "sw",
          ),
      ),
  ).toBe(true);
});
