const { test, expect } = require("@playwright/test");
const fs = require("fs");
const pdfParse = require("pdf-parse");
const manifest = require("../../data/localization/fr-business-roi-parity.json");

const cases = {
  "pomodoro": { values: { focusMinutes: "20", shortBreakMinutes: "4", longBreakMinutes: "12", sessions: "3" }, expected: ["20:00", "3", "80 min"], invalid: { focusMinutes: "1" }, boundary: "1:00" },
  "unit-converter": { values: { group: "area", value: "2", from: "plot_ng", to: "sqm" }, expected: ["929,0304", "sqm"], invalid: { group: "length", from: "kg", to: "m" } },
  "budget-planner": { values: { currency: "XOF", incomeMain: "1000", incomeOther: "500", housing: "400", food: "150", transport: "100", family: "50", wants: "200", savings: "100" }, expected: ["1 500", "1 000", "500"], invalid: { incomeMain: "0", incomeOther: "0" } },
  "countdown-timer": { values: { eventName: "Lancement synthétique", eventDate: "2026-08-05", eventTime: "09:00" }, expected: ["Lancement synthétique"], invalid: { eventDate: "" } },
  "time-zone": { values: { localDateTime: "2026-07-29T10:00", fromZone: "Africa/Abidjan", toZone: "Africa/Nairobi" }, expected: ["13:00", "2026-07-29T10:00:00.000Z"], invalid: { localDateTime: "" } },
  "public-holidays": { values: { country: "GH", name: "Journée civique synthétique", date: "2026-08-04", note: "Fixture" }, checks: ["confirmed"], expected: ["Ghana", "2026-08-04", "Ministry of the Interior"], invalid: { name: "" } },
  "working-days": { values: { start: "2026-07-27", end: "2026-08-02", holidays: "2026-07-29" }, expected: ["4", "7", "2", "1"], invalid: { start: "2026-08-02", end: "2026-07-27" } },
  "age-calculator": { values: { birthDate: "2000-02-29", atDate: "2026-07-29" }, expected: ["26", "5", "9 647"], invalid: { birthDate: "2030-01-01", atDate: "2026-07-29" } },
  "grade-tracker": { values: { scale: "5", course1: "Mathématiques", credits1: "3", points1: "4", course2: "Économie", credits2: "2", points2: "3", previousGpa: "3", previousCredits: "10", targetGpa: "3.5", futureCredits: "5" }, expected: ["3,6", "3,2", "4,4"], invalid: { scale: "4", points1: "5" } },
  "random-picker": { values: { items: "Amina\nKofi\nFatou\nThabo", mode: "pick", teamCount: "2" }, expected: ["Amina", "4"], invalid: { items: "" } },
  "meeting-cost": { values: { currency: "USD", attendees: "5", annualSalary: "52000", durationMinutes: "60", overhead: "1.5", annualFrequency: "52", workHoursPerYear: "2080" }, expected: ["187,50", "9 750", "260"], invalid: { attendees: "0" } },
  "tip-calculator": { values: { currency: "USD", bill: "100", tipRate: "10", taxRate: "5", people: "3", roundTo: "10" }, expected: ["105,00", "10,00", "120,00", "40,00"], invalid: { bill: "0" } }
};

async function setValues(page, values) {
  for (const [name, value] of Object.entries(values || {})) {
    const field = page.locator(`[name="${name}"]`);
    const tag = await field.evaluate((element) => element.tagName);
    if (tag === "SELECT") await field.selectOption(value);
    else await field.fill(value);
  }
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: async (text) => { window.__copiedText = text; } }
    });
    window.print = () => { window.__printed = true; };
    try {
      Object.defineProperty(window.crypto, "getRandomValues", {
        configurable: true,
        value: (array) => { for (let index = 0; index < array.length; index += 1) array[index] = 0; return array; }
      });
    } catch (_) {}
  });
});

for (const route of manifest.routes) {
  test(`${route.id}: owner-driven workflow and every advertised action`, async ({ page }) => {
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(route.french, { waitUntil: "domcontentloaded" });
    const scenario = cases[route.id];
    await setValues(page, scenario.values);
    for (const name of scenario.checks || []) await page.locator(`[name="${name}"]`).check();
    await page.locator("[data-business-form]").evaluate((form) => form.requestSubmit());
    await expect(page.locator("[data-business-result]")).toBeVisible();
    const resultText = await page.locator("[data-business-result]").innerText();
    for (const expected of scenario.expected) expect(resultText).toContain(expected);

    for (const format of ["json", "csv", "txt", "pdf"].concat(route.id === "public-holidays" ? ["ics"] : [])) {
      const downloadPromise = page.waitForEvent("download");
      await page.locator(`[data-export="${format}"]`).click();
      const download = await downloadPromise;
      const file = await download.path();
      const bytes = fs.readFileSync(file);
      if (format === "json") {
        const parsed = JSON.parse(bytes.toString("utf8"));
        expect(parsed.tool).toBe(route.id);
        expect(parsed.locale).toBe("fr");
        expect(parsed.report.metrics.length).toBeGreaterThan(0);
      } else if (format === "csv") {
        expect(bytes.toString("utf8")).toContain("Section");
        expect(bytes.toString("utf8")).toContain("Indicateur");
      } else if (format === "txt") {
        expect(bytes.toString("utf8")).toContain("AfroTools");
        expect(bytes.length).toBeGreaterThan(100);
      } else if (format === "ics") {
        expect(bytes.toString("utf8")).toContain("BEGIN:VCALENDAR");
        expect(bytes.toString("utf8")).toContain("DTSTART;VALUE=DATE:20260804");
      } else {
        expect(bytes.subarray(0, 5).toString("ascii")).toBe("%PDF-");
        const parsed = await pdfParse(bytes);
        expect(parsed.text).toContain("AfroTools");
        expect(parsed.text.length).toBeGreaterThan(80);
      }
    }

    await page.locator('[data-action="copy"]').click();
    await expect.poll(() => page.evaluate(() => window.__copiedText || "")).toContain("AfroTools");
    await page.locator('[data-action="save"]').click();
    expect(await page.evaluate((id) => Boolean(localStorage.getItem("afrotools-fr-business-" + id)), route.id)).toBe(true);
    await page.locator('[data-action="print"]').click();
    expect(await page.evaluate(() => window.__printed)).toBe(true);
    expect(errors).toEqual([]);
  });

  test(`${route.id}: invalid or boundary input fails closed`, async ({ page }) => {
    await page.goto(route.french, { waitUntil: "domcontentloaded" });
    const scenario = cases[route.id];
    await setValues(page, scenario.values);
    for (const name of scenario.checks || []) await page.locator(`[name="${name}"]`).check();
    await setValues(page, scenario.invalid);
    await page.locator("[data-business-form]").evaluate((form) => form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })));
    if (scenario.boundary) {
      await expect(page.locator("[data-business-result]")).toBeVisible();
      await expect(page.locator("[data-business-result]")).toContainText(scenario.boundary);
    } else {
      await expect(page.locator("[data-business-status]")).toHaveAttribute("data-state", "error");
      await expect(page.locator("[data-business-result]")).toBeHidden();
    }
  });

  test(`${route.id}: responsive, theme, a11y and SEO shell`, async ({ page }) => {
    const errors = [];
    page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
    page.on("pageerror", (error) => errors.push(error.message));
    await page.setViewportSize({ width: 320, height: 760 });
    await page.goto(route.french, { waitUntil: "domcontentloaded" });
    await expect(page.locator("html")).toHaveAttribute("lang", "fr");
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", `https://afrotools.com${route.french}`);
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute("content", `https://afrotools.com/${route.artwork}`);
    await expect(page.locator('link[rel="alternate"][hreflang="en"]')).toHaveAttribute("href", `https://afrotools.com${route.english}`);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
    await page.setViewportSize({ width: 375, height: 760 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
    await page.evaluate(() => document.documentElement.setAttribute("data-theme", "dark"));
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
    await page.evaluate(() => document.documentElement.removeAttribute("data-theme"));
    await page.emulateMedia({ colorScheme: "dark" });
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
    await page.setViewportSize({ width: 640, height: 900 });
    await page.evaluate(() => { document.documentElement.style.zoom = "2"; });
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
    await page.keyboard.press("Tab");
    expect(await page.evaluate(() => document.activeElement && document.activeElement !== document.body)).toBe(true);
    expect(errors).toEqual([]);
  });
}

test("French Business & ROI hub exposes the exact 12-owner programme", async ({ page }) => {
  await page.goto("/fr/business-roi/", { waitUntil: "networkidle" });
  const hrefs = await page.locator("#tool-grid a").evaluateAll((links) => links.map((link) => link.getAttribute("href")));
  expect(new Set(hrefs)).toEqual(new Set(manifest.routes.map((route) => route.french)));
});
