"use strict";
const { test, expect } = require("@playwright/test");
const fs = require("node:fs");
const pdfParse = require("pdf-parse");
const fixtures = require("../fixtures/health-quote-reports/expected.json");

test.use({ viewport: { width: 390, height: 844 }, serviceWorkers: "block", timezoneId: "UTC", locale: "en-US" });
const normalizedPdf = (value) => value.replace(/\s+/g, " ").trim();

for (const fixture of fixtures) {
  test(`${fixture.id} ${fixture.lang}: native quote exports and recalculation`, async ({ page }, testInfo) => {
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.addInitScript(() => localStorage.setItem("afrotools_cookie_consent", "declined"));
    await page.clock.setFixedTime(new Date("2026-10-10T12:00:00Z"));
    await page.goto(fixture.route, { waitUntil: "load" });
    await page.evaluate((name) => {
      const calculate = window[name].calculate;
      window[name].calculate = function (...args) {
        const result = calculate.apply(this, args);
        window.__quoteResult = result;
        return result;
      };
    }, fixture.engine);
    for (const [id, value] of Object.entries(fixture.fields)) await page.locator(`#${id}`).fill(value);
    const submit = page.locator("#form button[type=submit]");
    await submit.click();
    await expect(page.locator("#result")).toBeVisible();
    await expect(page.locator("#status")).toBeEmpty();
    const result = await page.evaluate(() => window.__quoteResult);
    expect(result).toEqual(fixture.result);
    expect(result[fixture.independentTotal.field]).toBe(fixture.independentTotal.value);
    expect(await page.evaluate((api) => window[api].buildReportText(), fixture.api)).toBe(fixture.txt);
    for (const extension of ["txt", "pdf"]) {
      const downloaded = page.waitForEvent("download");
      await page.locator(`#${extension}`).click();
      const download = await downloaded;
      const file = testInfo.outputPath(`${fixture.id}-${fixture.lang}.${extension}`);
      await download.saveAs(file);
      const bytes = fs.readFileSync(file);
      if (extension === "txt") expect(bytes.toString("utf8")).toBe(fixture.txt);
      else expect(normalizedPdf((await pdfParse(bytes)).text)).toBe(normalizedPdf(fixture.pdf));
    }
    await page.locator(`#${fixture.clear}`).fill("");
    await submit.click();
    await expect(page.locator("#result")).toBeHidden();
    await expect(page.locator("#error")).toBeVisible();
    expect(await page.evaluate((api) => window[api].buildReportText(), fixture.api)).toBe("");
    await page.locator(`#${fixture.clear}`).fill(fixture.fields[fixture.clear]);
    await submit.click();
    await expect(page.locator("#result")).toBeVisible();
    await expect(page.locator("#status")).toBeEmpty();
    expect(await page.evaluate((api) => window[api].buildReportText(), fixture.api)).toBe(fixture.txt);
    await page.locator(`#${fixture.clear}`).fill("SYNTHETIC_EDIT");
    await expect(page.locator("#result")).toBeHidden();
    expect(await page.evaluate((api) => window[api].buildReportText(), fixture.api)).toBe("");
    await page.locator(`#${fixture.clear}`).fill(fixture.fields[fixture.clear]);
    await submit.click();
    await expect(page.locator("#status")).toBeEmpty();
    expect(await page.evaluate(() => window.__quoteResult)).toEqual(fixture.result);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBe(0);
    expect(errors).toEqual([]);
  });
}
