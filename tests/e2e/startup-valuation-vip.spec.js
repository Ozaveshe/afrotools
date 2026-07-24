const { test, expect } = require("@playwright/test");
const pdfParse = require("pdf-parse");

const routes = ["/tools/startup-valuation/", "/fr/tools/evaluation-startup/", "/sw/zana/thamani-ya-startup/"];
async function bytes(download) {
  const chunks = [];
  for await (const chunk of await download.createReadStream()) chunks.push(chunk);
  return Buffer.concat(chunks);
}
async function fillSynthetic(page) {
  const values = {
    currencyUnit: "TEST", uncertaintyPct: "20", annualRevenue: "100000", multipleLow: "2", multipleBase: "3", multipleHigh: "4",
    revenueEvidence: "=Synthetic comparable note, checked 2026-07-23", comparableBaseline: "500000", scorecardEvidence: "Synthetic baseline note",
    teamScore: "110", productScore: "100", tractionScore: "90", marketScore: "100", executionScore: "100",
    teamWeight: "30", productWeight: "20", tractionWeight: "20", marketWeight: "15", executionWeight: "15",
    productEvidence: "50000", teamEvidence: "75000", tractionEvidence: "100000", relationshipsEvidence: "25000", riskReductionEvidence: "50000",
    milestoneNote: "Synthetic milestone note"
  };
  for (const [name, value] of Object.entries(values)) await page.locator(`[name="${name}"]`).fill(value);
}

for (const route of routes) {
  test(route + " native private evidence workflow", async ({ page }) => {
    const errors = [], external = [];
    page.on("console", m => { if (m.type() === "error") errors.push(m.text()); });
    page.on("pageerror", e => errors.push(e.message));
    page.on("request", r => { if (!r.url().startsWith("http://127.0.0.1:4173")) external.push(r.url()); });
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(route);
    await expect(page.locator("iframe")).toHaveCount(0);
    await expect(page.locator("afro-navbar")).toHaveCount(1);
    await expect(page.locator("afro-footer")).toHaveCount(1);
    expect(await page.locator("afro-navbar").evaluate(el => !!(el.shadowRoot && el.shadowRoot.querySelector(".lang-btn")))).toBe(true);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", new RegExp(route.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "$"));
    await expect(page.locator('meta[property="og:title"]')).toHaveCount(1);
    await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute("content", "summary_large_image");
    await expect(page.locator('link[rel="icon"]')).toHaveAttribute("href", "/favicon.ico");
    expect(await page.locator('script[type="application/ld+json"]').evaluateAll(nodes => nodes.some(node => JSON.parse(node.textContent)["@type"] === "WebApplication"))).toBe(true);
    const storageBefore = await page.evaluate(() => ({ local: { ...localStorage }, session: { ...sessionStorage } }));
    await fillSynthetic(page);
    await page.locator("#sv-calc").click();
    await expect(page.locator("#sv-results")).toHaveClass(/on/);
    await expect(page.locator("#sv-result-grid .sv-card")).toHaveCount(3);
    await expect(page.locator("#sv-span")).toContainText("TEST");
    await page.locator('[name="annualRevenue"]').fill("120000");
    await expect(page.locator("#sv-results")).not.toHaveClass(/on/);
    await page.locator("#sv-calc").click();
    const pdfWait = page.waitForEvent("download");
    await page.locator("#sv-pdf").click();
    const pdf = await pdfWait, pdfBytes = await bytes(pdf);
    expect(pdfBytes.subarray(0, 4).toString()).toBe("%PDF");
    const pdfText = (await pdfParse(pdfBytes)).text;
    expect(pdfText).toContain("Currency / unit: TEST");
    expect(pdfText).toContain("Each method is independent");
    for (const id of ["#sv-csv", "#sv-json"]) {
      const wait = page.waitForEvent("download");
      await page.locator(id).click();
      const exported = await wait;
      const text = (await bytes(exported)).toString();
      expect(text).toContain("TEST");
      expect(text).toContain("Synthetic");
      if (id === "#sv-csv") expect(text).toContain("'=Synthetic");
    }
    expect(await page.evaluate(() => ({ local: { ...localStorage }, session: { ...sessionStorage } }))).toEqual(storageBefore);
    expect(JSON.stringify(storageBefore)).not.toContain("Synthetic");
    expect(await page.evaluate(() => ({ search: location.search, hash: location.hash }))).toEqual({ search: "", hash: "" });
    await page.locator(".sv-theme-toggle").click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    expect(await page.locator("body").evaluate(el => getComputedStyle(el).backgroundColor)).not.toBe("rgb(245, 247, 247)");
    await page.evaluate(() => { document.documentElement.dataset.theme = "light"; delete document.documentElement.dataset.svTheme; });
    expect(await page.locator("body").evaluate(el => getComputedStyle(el).backgroundColor)).toBe("rgb(245, 247, 247)");
    await page.setViewportSize({ width: 640, height: 812 });
    await page.evaluate(() => { document.documentElement.style.zoom = "2"; });
    const overflow = await page.evaluate(() => Array.from(document.querySelectorAll("body *")).filter(el => {
      const rect = el.getBoundingClientRect();
      return rect.right > window.innerWidth + 1 || rect.left < -1;
    }).slice(0, 12).map(el => ({ tag: el.tagName, id: el.id, className: String(el.className || ""), right: Math.round(el.getBoundingClientRect().right) })));
    expect(overflow).toEqual([]);
    const unexpectedExternal = external.filter(url => !url.startsWith("https://fonts.googleapis.com/") && !url.startsWith("https://cdn.jsdelivr.net/gh/twitter/twemoji@"));
    expect(unexpectedExternal).toEqual([]);
    expect(errors).toEqual([]);
  });
}

test("invalid, blank and zero-weight paths fail clearly", async ({ page }) => {
  await page.goto(routes[0]);
  await page.locator("#sv-calc").click();
  await expect(page.locator("#sv-results")).not.toHaveClass(/on/);
  await fillSynthetic(page);
  await page.locator('[name="multipleLow"]').fill("5");
  await page.locator("#sv-calc").click();
  await expect(page.locator("#sv-results")).not.toHaveClass(/on/);
  await page.locator('[name="multipleLow"]').fill("2");
  await page.locator('[name="teamWeight"]').fill("0");
  await page.locator('[name="teamScore"]').fill("");
  await page.locator("#sv-calc").click();
  await expect(page.locator("#sv-results")).toHaveClass(/on/);
  for (const input of await page.locator('[name$="Weight"]').all()) await input.fill("0");
  await page.locator("#sv-calc").click();
  await expect(page.locator("#sv-results")).not.toHaveClass(/on/);
});

test("capture synthetic row 107 screenshots", async ({ browser }) => {
  const captures = [{ name: "en-375-light.png", width: 375, height: 1000, colorScheme: "light" }, { name: "en-768-dark.png", width: 768, height: 1050, colorScheme: "dark" }];
  for (const capture of captures) {
    const context = await browser.newContext({ viewport: { width: capture.width, height: capture.height }, colorScheme: capture.colorScheme });
    const page = await context.newPage();
    await page.goto(routes[0]);
    await fillSynthetic(page);
    await page.locator("#sv-calc").click();
    await expect(page.locator("#sv-results")).toHaveClass(/on/);
    await expect(page.locator(".sv-theme-toggle")).toHaveText(capture.colorScheme === "dark" ? /light|clair|mwanga/i : /dark|sombre|giza/i);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({ path: `artifacts/day3-row-107-startup-valuation/stable/${capture.name}`, fullPage: true });
    await context.close();
  }
});
