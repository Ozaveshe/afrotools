const { test, expect } = require("@playwright/test");
const pdfParse = require("pdf-parse");

async function downloadBuffer(download) {
  const chunks = [];
  for await (const chunk of await download.createReadStream()) chunks.push(chunk);
  return Buffer.concat(chunks);
}

const routes = [
  "/tools/job-offer-evaluator/",
  "/fr/tools/evaluateur-offre-emploi/",
  "/sw/zana/tathmini-ya-ofa-ya-kazi/"
];

for (const route of routes) {
  test(route + " is native, private, responsive and exports PDF", async ({ page }) => {
    const errors = [], external = [], downloads = [];
    page.on("console", m => { if (m.type() === "error") errors.push(m.text()); });
    page.on("pageerror", e => errors.push(e.message));
    page.on("request", r => { if (!r.url().startsWith("http://127.0.0.1:4173")) external.push(r.url()); });
    page.on("download", d => downloads.push(d));
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(route);
    await page.locator('[name="currency"]').fill("TEST");
    await expect(page.locator("iframe")).toHaveCount(0);
    await expect(page.locator("body")).toHaveJSProperty("scrollWidth", 375);
    const offers = page.locator("[data-offer]");
    await offers.nth(0).locator('[name="monthlyPay"]').fill("1000");
    await offers.nth(1).locator('[name="monthlyPay"]').fill("1200");
    for (const box of [offers.nth(0), offers.nth(1)]) {
      for (const name of ["roleFit", "learning", "flexibility", "stability", "team"]) await box.locator(`[name="${name}"]`).fill("7");
    }
    await page.locator("#joe-calc").click();
    await expect(page.locator("#joe-results")).toHaveClass(/on/);
    await expect(page.locator("#joe-delta")).toContainText("TEST");
    await offers.nth(0).locator('[name="monthlyPay"]').fill("1100");
    await expect(page.locator("#joe-results")).not.toHaveClass(/on/);
    await page.locator("#joe-calc").click();
    const download = page.waitForEvent("download");
    await page.locator("#joe-pdf").click();
    const pdf = await download;
    expect(pdf.suggestedFilename()).toBe("job-offer-comparison.pdf");
    const pdfBytes = await downloadBuffer(pdf);
    expect(pdfBytes.subarray(0, 4).toString()).toBe("%PDF");
    expect((await pdfParse(pdfBytes)).text).toContain("Currency / unit: TEST");
    for (const id of ["#joe-csv", "#joe-json"]) {
      const exportDownload = page.waitForEvent("download");
      await page.locator(id).click();
      const exported = await exportDownload;
      expect(exported.suggestedFilename()).toMatch(/\.(csv|json)$/);
      expect((await downloadBuffer(exported)).toString()).toContain("TEST");
    }
    expect(await page.evaluate(() => ({ local: localStorage.length, session: sessionStorage.length, hash: location.hash, search: location.search }))).toEqual({ local: 0, session: 0, hash: "", search: "" });
    await page.emulateMedia({ colorScheme: "dark" });
    expect(await page.locator("body").evaluate(el => getComputedStyle(el).backgroundColor)).not.toBe("rgb(245, 247, 247)");
    await page.setViewportSize({ width: 640, height: 812 });
    await page.evaluate(() => { document.documentElement.style.zoom = "2"; });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    expect(external).toEqual([]);
    expect(errors).toEqual([]);
  });
}

test("zero weights fail clearly", async ({ page }) => {
  await page.goto(routes[0]);
  await page.locator('[name="currency"]').fill("TEST");
  for (const input of await page.locator("[data-weights] input").all()) await input.fill("0");
  await page.locator("#joe-calc").click();
  await expect(page.locator("#joe-status")).not.toBeEmpty();
  await expect(page.locator("#joe-results")).not.toHaveClass(/on/);
});

test("capture synthetic director screenshots", async ({ browser }) => {
  const fixtures = [
    { label: "Offer A", monthlyPay: "1000", monthlyCash: "100", monthlyBenefits: "80", monthlyCosts: "40", annualBonus: "500", oneOffCosts: "0", roleFit: "7", learning: "8", flexibility: "6", stability: "8", team: "7" },
    { label: "Offer B", monthlyPay: "1120", monthlyCash: "30", monthlyBenefits: "50", monthlyCosts: "90", annualBonus: "300", oneOffCosts: "250", roleFit: "9", learning: "9", flexibility: "8", stability: "6", team: "8" }
  ];
  const captures = [
    { name: "en-375-light.png", width: 375, height: 1000, colorScheme: "light" },
    { name: "en-768-dark.png", width: 768, height: 1050, colorScheme: "dark" }
  ];
  for (const capture of captures) {
    const context = await browser.newContext({ viewport: { width: capture.width, height: capture.height }, colorScheme: capture.colorScheme });
    const page = await context.newPage();
    await page.goto(routes[0]);
    await page.locator('[name="currency"]').fill("TEST");
    const offers = page.locator("[data-offer]");
    for (let index = 0; index < fixtures.length; index += 1) {
      for (const [name, value] of Object.entries(fixtures[index])) await offers.nth(index).locator(`[name="${name}"]`).fill(value);
    }
    await page.locator("#joe-calc").click();
    await expect(page.locator("#joe-results")).toHaveClass(/on/);
    await page.screenshot({ path: `artifacts/day3-row-106-job-offer-evaluator/${capture.name}`, fullPage: true });
    await context.close();
  }
});
