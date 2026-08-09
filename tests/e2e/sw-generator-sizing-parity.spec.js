const { test, expect } = require("@playwright/test"),
  fs = require("node:fs"),
  path = require("node:path"),
  { execFileSync } = require("node:child_process");
async function artifact(page, kind) {
  const [d] = await Promise.all([
      page.waitForEvent("download"),
      page.locator(`[data-swg-export="${kind}"]`).click(),
    ]),
    file = await d.path();
  return { file, buffer: fs.readFileSync(file) };
}
test("native Swahili generator flow proves oracle exports privacy and interaction", async ({
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
  await page.route(/^https?:\/\/(?!127\.0\.0\.1:43158)/, (r) => r.abort());
  await page.goto("/sw/zana/ukubwa-wa-generator/");
  await expect(page.locator("#swgPreset")).toContainText("Jokofu dogo");
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
  await page.getByRole("button", { name: "Kokotoa ukubwa" }).click();
  await expect(page.locator("#swgMetrics")).toContainText("0.61 kW");
  await expect(page.locator("#swgMetrics")).toContainText("0.91 kW");
  await expect(page.locator("#swgMetrics")).toContainText("2.5 kVA");
  const json = await artifact(page, "json"),
    record = JSON.parse(json.buffer.toString("utf8"));
  expect(record.result.sourceStatus).toBe("manufacturer-nameplate-required");
  await page
    .locator("#swgImport")
    .setInputFiles({
      name: "generator.json",
      mimeType: "application/json",
      buffer: json.buffer,
    });
  await expect(page.locator("#swgStatus")).toContainText("imefunguliwa");
  expect((await artifact(page, "csv")).buffer.toString("utf8")).toContain(
    '"recommended_kva","2.5"',
  );
  expect((await artifact(page, "txt")).buffer.toString("utf8")).toContain(
    "uhakika ni mdogo",
  );
  const pdf = await artifact(page, "pdf");
  expect(pdf.buffer.subarray(0, 4).toString()).toBe("%PDF");
  expect(
    JSON.parse(
      execFileSync(
        process.execPath,
        [path.resolve(__dirname, "../support/parse-pdf-download.js"), pdf.file],
        { encoding: "utf8" },
      ),
    ).numpages,
  ).toBeGreaterThan(0);
  await page.getByRole("button", { name: "Weka upya" }).click();
  while (await page.getByRole("button", { name: /^Ondoa / }).count())
    await page
      .getByRole("button", { name: /^Ondoa / })
      .first()
      .click();
  await page.getByRole("button", { name: "Kokotoa ukubwa" }).click();
  await expect(page.locator("#swgError")).toBeVisible();
  await expect(page.locator("#swgResult")).toBeHidden();
  const light = await page
    .locator("body")
    .evaluate((el) => getComputedStyle(el).backgroundColor);
  await page.evaluate(() => document.documentElement.classList.add("dark"));
  expect(
    await page
      .locator("body")
      .evaluate((el) => getComputedStyle(el).backgroundColor),
  ).not.toBe(light);
  await page.locator("#swgPreset").focus();
  await page.keyboard.press("Tab");
  await expect(page.locator("#swgName")).toBeFocused();
  expect(errors).toEqual([]);
  expect(requests.join(" ")).not.toContain("generator.json");
});
test("English route shares exact engine and remains functional", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("dialog", (d) => d.accept());
  await page.route(/^https?:\/\/(?!127\.0\.0\.1:43158)/, (r) => r.abort());
  await page.goto("/tools/generator-sizing/");
  expect(
    await page.evaluate(() =>
      Boolean(
        window.GeneratorSizingEngine && window.GeneratorSizingEngine.calculate,
      ),
    ),
  ).toBe(true);
  await page.getByRole("button", { name: "Calculate Generator Size" }).click();
  await expect(page.locator("#results")).toBeVisible();
  await expect(page.locator("#rRunning")).toHaveText("0.6 kW");
  await expect(page.locator("#rKVA")).toHaveText("2.5 kVA");
  expect(errors).toEqual([]);
});
test("metadata artwork schema and reciprocal hreflang are exact", async ({
  page,
}) => {
  for (const route of [
    "/tools/generator-sizing/",
    "/fr/tools/dimensionnement-generateur/",
    "/sw/zana/ukubwa-wa-generator/",
  ]) {
    await page.goto(route);
    await expect(
      page.locator('link[rel="alternate"][hreflang="sw"]'),
    ).toHaveAttribute(
      "href",
      "https://afrotools.com/sw/zana/ukubwa-wa-generator/",
    );
  }
  await page.goto("/sw/zana/ukubwa-wa-generator/");
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
    "content",
    /generator-sizing\.webp$/,
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
