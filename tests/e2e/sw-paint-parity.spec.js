const { test, expect } = require("@playwright/test");
const fs = require("node:fs"),
  path = require("node:path"),
  { execFileSync } = require("node:child_process");
async function artifact(page, kind) {
  const [d] = await Promise.all([
    page.waitForEvent("download"),
    page.locator(`[data-swp-export="${kind}"]`).click(),
  ]);
  const file = await d.path();
  return { file, buffer: fs.readFileSync(file) };
}
test("native Swahili paint workflow proves geometry exports privacy and interaction", async ({
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
  await page.route(/^https?:\/\/(?!127\.0\.0\.1:43155)/, (r) => r.abort());
  await page.goto("/sw/zana/kikokotoo-rangi/");
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
  await page.getByRole("button", { name: "Kokotoa rangi" }).click();
  await expect(page.locator("#swpMetrics")).toContainText("49.44 m²");
  await expect(page.locator("#swpMetrics")).toContainText("11 L");
  await page.getByRole("button", { name: "Weka upya" }).click();
  await page.locator("#swpShape").selectOption("lshape");
  await page
    .getByRole("button", { name: "Ongeza chumba kwenye orodha" })
    .click();
  await page.locator("#swpShape").selectOption("custom");
  await page
    .getByRole("button", { name: "Ongeza chumba kwenye orodha" })
    .click();
  await page.locator("#swpSurface").selectOption("new");
  await page.locator("#swpPrice").fill("100");
  await page.getByRole("button", { name: "Kokotoa rangi" }).click();
  await expect(page.locator("#swpMetrics")).toContainText("112.88 m²");
  await expect(page.locator("#swpMetrics")).toContainText("42 L");
  const json = await artifact(page, "json"),
    record = JSON.parse(json.buffer.toString("utf8"));
  expect(record.format).toBe("afrotools-paint");
  expect(record.rooms).toHaveLength(2);
  await page.locator("#swpImport").setInputFiles({
    name: "paint.json",
    mimeType: "application/json",
    buffer: json.buffer,
  });
  await expect(page.locator("#swpStatus")).toContainText("imefunguliwa");
  expect((await artifact(page, "csv")).buffer.toString("utf8")).toContain(
    '"rangi_lita","42"',
  );
  expect((await artifact(page, "txt")).buffer.toString("utf8")).toContain(
    "maelekezo ya usalama",
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
  await page.getByRole("button", { name: "Weka upya" }).click();
  await page.locator("#swpLength").fill("0");
  await page.getByRole("button", { name: "Kokotoa rangi" }).click();
  await expect(page.locator("#swpError")).toBeVisible();
  await expect(page.locator("#swpResult")).toBeHidden();
  const light = await page
    .locator("body")
    .evaluate((el) => getComputedStyle(el).backgroundColor);
  await page.evaluate(() => document.documentElement.classList.add("dark"));
  expect(
    await page
      .locator("body")
      .evaluate((el) => getComputedStyle(el).backgroundColor),
  ).not.toBe(light);
  await page.locator("#swpShape").focus();
  await page.keyboard.press("Tab");
  await expect(page.locator("#swpUnit")).toBeFocused();
  expect(errors).toEqual([]);
  expect(requests.join(" ")).not.toContain("paint.json");
});
test("English route uses the shared geometry and paint engine", async ({
  page,
}) => {
  await page.route(/^https?:\/\/(?!127\.0\.0\.1:43155)/, (r) => r.abort());
  page.on("dialog", (d) => d.accept());
  await page.goto("/tools/paint-calculator/");
  expect(
    await page.evaluate(() =>
      Boolean(
        window.EngineeringMaterialsEngine &&
        window.EngineeringMaterialsEngine.paint,
      ),
    ),
  ).toBe(true);
  await page.locator("#length").fill("5");
  await page.locator("#width").fill("4");
  await page.locator("#height").fill("3");
  await page.getByRole("button", { name: "Calculate Paint Needed" }).click();
  await expect(page.locator("#results")).toBeVisible();
  await expect(page.locator("#rLitres")).not.toHaveText("");
});
test("canonical artwork schema and reciprocal hreflang remain exact", async ({
  page,
}) => {
  for (const route of [
    "/tools/paint-calculator/",
    "/fr/tools/calculateur-peinture/",
    "/sw/zana/kikokotoo-rangi/",
  ]) {
    await page.goto(route);
    await expect(
      page.locator('link[rel="alternate"][hreflang="sw"]'),
    ).toHaveAttribute("href", "https://afrotools.com/sw/zana/kikokotoo-rangi/");
  }
  await page.goto("/sw/zana/kikokotoo-rangi/");
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
    "content",
    /paint-calc\.webp$/,
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
