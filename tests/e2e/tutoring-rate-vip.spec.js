const { test, expect } = require("@playwright/test");
const fs = require("node:fs");
const route = "/tools/tutoring-rate/";

test.describe("Tutoring rate VIP", () => {
  test("calculates from user-entered costs without benchmark claims", async ({ page }) => {
    const errors = [];
    page.on("pageerror", error => errors.push(error.message));
    await page.goto(route, { waitUntil: "commit" });
    await page.waitForFunction(() => window.AFROTOOLS_TUTORING_RATE_VIP === true);
    await page.locator("#weeksPerMonth").fill("4");
    await page.locator("#sessionCost").fill("1000");
    await page.getByRole("button", { name: "Calculate cost-based quote" }).click();
    await expect(page.locator("#metricGrid")).toContainText("NGN 11,875");
    await expect(page.locator("#metricGrid")).toContainText("NGN 475,000");
    await expect(page.locator("body")).not.toContainText("Nigeria secondary sciences");
    fs.mkdirSync("artifacts/day5-tutoring-rate-vip", { recursive: true });
    await page.screenshot({ path: "artifacts/day5-tutoring-rate-vip/desktop-result.png", fullPage: true });
    expect(errors).toEqual([]);
  });

  test("validates reserve assumptions", async ({ page }) => {
    await page.goto(route, { waitUntil: "commit" });
    await page.waitForFunction(() => window.AFROTOOLS_TUTORING_RATE_VIP === true);
    await page.locator("#taxReserve").fill("50");
    await page.locator("#riskReserve").fill("30");
    await page.getByRole("button", { name: "Calculate cost-based quote" }).click();
    await expect(page.locator("#tutoringError")).toContainText("below 80%");
    await expect(page.locator("#tutoringResults")).toBeHidden();
  });

  test("exports TXT and PDF without transmitting entries", async ({ page }) => {
    const writes = [];
    page.on("request", request => {
      if (!["GET", "HEAD", "OPTIONS"].includes(request.method())) writes.push(request.url() + " " + (request.postData() || ""));
    });
    await page.goto(route, { waitUntil: "commit" });
    await page.waitForFunction(() => window.AFROTOOLS_TUTORING_RATE_VIP === true);
    await page.locator("#currency").fill("PRIVATE85413");
    await page.getByRole("button", { name: "Calculate cost-based quote" }).click();
    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("button", { name: "Download TXT" }).click();
    const download = await downloadPromise;
    const text = fs.readFileSync(await download.path(), "utf8");
    expect(text).toContain("PRIVATE85413");
    expect(text).toContain("not a market benchmark");
    await page.evaluate(() => { window.__tutorPrint = false; window.print = () => { window.__tutorPrint = true; }; });
    await page.getByRole("button", { name: "Print / save PDF" }).click();
    await expect.poll(() => page.evaluate(() => window.__tutorPrint)).toBe(true);
    const pdf = await page.pdf({ format: "A4", printBackground: true });
    expect(pdf.subarray(0, 4).toString()).toBe("%PDF");
    expect(pdf.length).toBeGreaterThan(20000);
    expect(writes.every(item => !decodeURIComponent(item).includes("PRIVATE85413"))).toBe(true);
  });

  for (const width of [320, 360]) {
    test(`has no horizontal overflow at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 850 });
      await page.goto(route, { waitUntil: "commit" });
      await page.waitForFunction(() => window.AFROTOOLS_TUTORING_RATE_VIP === true);
      await page.getByRole("button", { name: "Calculate cost-based quote" }).click();
      const size = await page.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.clientWidth]);
      expect(size[0]).toBeLessThanOrEqual(size[1] + 1);
      if (width === 360) {
        fs.mkdirSync("artifacts/day5-tutoring-rate-vip", { recursive: true });
        await page.screenshot({ path: "artifacts/day5-tutoring-rate-vip/mobile-360.png", fullPage: true });
      }
    });
  }

  test("supports dark mode and 200 percent text zoom", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 900 });
    await page.goto(route, { waitUntil: "commit" });
    await page.waitForFunction(() => window.AfroTools && window.AfroTools.darkMode);
    await page.evaluate(() => { window.AfroTools.darkMode.set("dark"); document.documentElement.style.fontSize = "200%"; });
    const state = await page.evaluate(() => {
      const panel = document.querySelector(".tr-panel");
      return [document.documentElement.scrollWidth, document.documentElement.clientWidth, getComputedStyle(panel).backgroundColor, getComputedStyle(panel).color];
    });
    expect(state[0]).toBeLessThanOrEqual(state[1] + 1);
    expect(state[2]).not.toBe(state[3]);
    fs.mkdirSync("artifacts/day5-tutoring-rate-vip", { recursive: true });
    await page.screenshot({ path: "artifacts/day5-tutoring-rate-vip/mobile-dark-375-200.png", fullPage: true });
  });

  test("gives every main control an accessible name", async ({ page }) => {
    await page.goto(route, { waitUntil: "commit" });
    await page.waitForFunction(() => window.AFROTOOLS_TUTORING_RATE_VIP === true);
    const unnamed = await page.evaluate(() => Array.from(document.querySelectorAll("main input, main button"))
      .filter(element => !element.closest("label") && !element.getAttribute("aria-label") && !element.textContent.trim()).length);
    expect(unnamed).toBe(0);
  });
});
