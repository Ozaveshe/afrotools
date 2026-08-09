const { test, expect } = require("@playwright/test");
const fs = require("node:fs"),
  path = require("node:path"),
  { execFileSync } = require("node:child_process");
async function artifact(page, kind) {
  const [d] = await Promise.all([
    page.waitForEvent("download"),
    page.locator(`[data-swss-export="${kind}"]`).click(),
  ]);
  const file = await d.path();
  return { file, buffer: fs.readFileSync(file) };
}
test("native Swahili structural screen proves four oracles, exports and privacy", async ({
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
  await page.route(/^https?:\/\/(?!127\.0\.0\.1:43151)/, (r) => r.abort());
  await page.goto("/sw/zana/kikokotoo-miundo-ya-ujenzi/");
  expect(
    await page
      .locator("#swssForm input,#swssForm select")
      .evaluateAll((els) =>
        els.every((el) =>
          Boolean(el.id && document.querySelector(`label[for="${el.id}"]`)),
        ),
      ),
  ).toBe(true);
  for (const [width, size] of [
    [320, "100%"],
    [375, "100%"],
    [640, "200%"],
  ]) {
    await page.setViewportSize({ width, height: 820 });
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
  await page.getByRole("button", { name: "Chunguza" }).click();
  await expect(page.locator("#swssMetrics")).toContainText("250 × 475 mm");
  for (const [mode, text] of [
    ["column", "225x225 mm"],
    ["slab", "175 mm"],
    ["footing", "2100 × 2100 mm"],
  ]) {
    await page.locator("#swssMode").selectOption(mode);
    await page.getByRole("button", { name: "Chunguza" }).click();
    await expect(page.locator("#swssMetrics")).toContainText(text);
  }
  const json = await artifact(page, "json"),
    record = JSON.parse(json.buffer.toString("utf8"));
  expect(record).toMatchObject({
    mode: "footing",
    dataStatus: "legacy_undated_stale",
    confidence: "low",
  });
  expect(record.output.side).toBe(2100);
  await page
    .locator("#swssImport")
    .setInputFiles({
      name: "structural.json",
      mimeType: "application/json",
      buffer: json.buffer,
    });
  await expect(page.locator("#swssStatus")).toContainText("imefunguliwa");
  expect((await artifact(page, "csv")).buffer.toString("utf8")).toContain(
    '"Ukubwa wa msingi","2100 × 2100 mm"',
  );
  expect((await artifact(page, "txt")).buffer.toString("utf8")).toContain(
    "Mhandisi wa miundo aliyesajiliwa",
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
  await page.locator("#footingSbc").fill("0");
  await page.getByRole("button", { name: "Chunguza" }).click();
  await expect(page.locator("#swssError")).toBeVisible();
  await expect(page.locator("#swssResult")).toBeHidden();
  await page.getByRole("button", { name: "Weka upya" }).click();
  await expect(page.locator("#swssMode")).toHaveValue("beam");
  await expect(page.locator("#swssResult")).toBeHidden();
  const light = await page
    .locator("body")
    .evaluate((el) => getComputedStyle(el).backgroundColor);
  await page.evaluate(() =>
    document.documentElement.setAttribute("data-theme", "dark"),
  );
  expect(
    await page
      .locator("body")
      .evaluate((el) => getComputedStyle(el).backgroundColor),
  ).not.toBe(light);
  await page.locator("#swssMode").focus();
  await page.keyboard.press("Tab");
  await expect(page.locator("#beamSpan")).toBeFocused();
  expect(errors).toEqual([]);
  expect(requests.join(" ")).not.toContain("structural.json");
});
test("English beam column slab and footing use the shared engine", async ({
  page,
}) => {
  page.on("dialog", (d) => d.accept());
  await page.route(/^https?:\/\/(?!127\.0\.0\.1:43151)/, (r) => r.abort());
  await page.goto("/tools/structural-calc/");
  expect(
    await page.evaluate(() => Boolean(window.StructuralScreeningEngine)),
  ).toBe(true);
  for (const [tab, item, result] of [
    ["beam", "calcBeam()", "#beam-results"],
    ["column", "calcColumn()", "#col-results"],
    ["slab", "calcSlab()", "#slab-results"],
    ["footing", "calcFooting()", "#foot-results"],
  ]) {
    await page.evaluate(({ tab, item }) => {
      window.switchTab(tab, document.querySelector(`[onclick*="'${tab}'"]`));
      window.eval(item);
    }, { tab, item });
    await expect(page.locator(result)).toBeVisible();
  }
});
test("canonical schema artwork and reciprocal hreflang remain exact", async ({
  page,
}) => {
  for (const route of [
    "/tools/structural-calc/",
    "/fr/tools/calcul-structure/",
    "/sw/zana/kikokotoo-miundo-ya-ujenzi/",
  ]) {
    await page.goto(route);
    await expect(
      page.locator('link[rel="alternate"][hreflang="sw"]'),
    ).toHaveAttribute(
      "href",
      "https://afrotools.com/sw/zana/kikokotoo-miundo-ya-ujenzi/",
    );
  }
  await page.goto("/sw/zana/kikokotoo-miundo-ya-ujenzi/");
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
    "content",
    /structural-calc\.webp$/,
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
