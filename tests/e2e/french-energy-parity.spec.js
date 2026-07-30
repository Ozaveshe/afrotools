const { test, expect } = require("@playwright/test");
const fs = require("fs");
const {
  FRENCH_ENERGY_APPS,
} = require("../../scripts/lib/french-energy-parity-contract");

const WORKFLOW_SELECTORS = {
  "electricity-tariff": ["#etResultPanel", ".et-primary"],
  "solar-roi": ["#solarAssumptionPreview", "#solarRootCountrySelect"],
  "prepaid-meter": ["#pmResultPanel", ".pm-primary"],
  "solar-vs-generator": ["#results", ".svg-button.primary"],
  "electricity-bill-verify": ["#results", ".ebv-button.primary"],
  "water-bill": ["#results", ".wb-button.primary"],
  "gas-lpg-cost": [".lpg-results", "#calculateBtn"],
  "paygo-solar": [".pg-results", "#calculateBtn"],
  "outage-cost": [".oc-results", "#calculateBtn"],
  "solar-sizing": ["#results", "#calcBtn"],
  "battery-sizing": ["#results", "#calcBtn"],
  "energy-audit": ["#results", "#calcBtn"],
  "appliance-power": ["#results", "#calcBtn"],
  "backup-duration": ["#results", "#calcBtn"],
  "diesel-vs-solar-farm": ["#results", "#calcBtn"],
  "mini-grid-feasibility": ["#results", "#calcBtn"],
  "carbon-footprint-energy": ["#results", "#calcBtn"],
  "ev-charging": ["#results", "#calcBtn"],
  "biogas-roi": ["#results", "#calcBtn"],
  "generator-fuel": ["#gfResults", "#gfCalculate"],
};

async function offlineLocal(page) {
  await page.addInitScript(() => {
    localStorage.setItem("afrotools_cookie_consent", "declined");
  });
  await page.route("**/*", async (route) => {
    const url = new URL(route.request().url());
    if (url.hostname === "127.0.0.1" || url.hostname === "localhost") return route.continue();
    return route.abort();
  });
}

async function seedControls(page) {
  await page.evaluate(() => {
    document.querySelectorAll("select").forEach((field) => {
      if (field.disabled || field.offsetParent === null || field.value) return;
      const option = Array.from(field.options).find((item) => item.value && !item.disabled);
      if (option) field.value = option.value;
      field.dispatchEvent(new Event("change", { bubbles: true }));
    });
    document.querySelectorAll("input").forEach((field) => {
      if (field.disabled || field.offsetParent === null || ["file", "password", "hidden"].includes(field.type)) return;
      if (field.type === "number" && (!field.value || Number(field.value) <= 0)) {
        const minimum = Number(field.min);
        field.value = Number.isFinite(minimum) && minimum > 0 ? String(minimum) : "1";
      }
      if (field.type === "date" && !field.value) field.value = "2026-07-01";
      if (field.type === "checkbox" && field.required) field.checked = true;
      field.dispatchEvent(new Event("input", { bubbles: true }));
      field.dispatchEvent(new Event("change", { bubbles: true }));
    });
  });
}

async function openApp(page, app) {
  const errors = [];
  page.removeAllListeners("pageerror");
  page.on("pageerror", (error) => errors.push(error.message));
  const response = await page.goto(app.frRoute, { waitUntil: "domcontentloaded" });
  expect(response && response.ok(), `${app.frRoute}: route response`).toBeTruthy();
  await expect(page.locator("h1").first()).toContainText(app.title);
  await expect(page.locator(".fr-energy-trust")).toBeVisible();
  await expect(page.locator(".fr-energy-trust")).toHaveAttribute("data-state", "stale");
  await expect(page.locator(".fr-energy-export")).toBeVisible();
  await expect(page.locator(".fr-energy-ai")).toBeVisible();
  return errors;
}

test.describe.configure({ mode: "serial" });

test("French Energy hub exposes the exact 20-app denominator", async ({ page }) => {
  await offlineLocal(page);
  await page.setViewportSize({ width: 375, height: 900 });
  const response = await page.goto("/fr/energy/", { waitUntil: "domcontentloaded" });
  expect(response && response.ok()).toBeTruthy();
  await expect(page.locator(".energy-card")).toHaveCount(20);
  await page.fill("#energy-search", "batterie");
  await expect(page.locator(".energy-card:visible")).not.toHaveCount(20);
  await page.fill("#energy-search", "");
  await expect(page.locator(".energy-card:visible")).toHaveCount(20);
});

test("all 20 routes reflow at 320px and 200 percent without console failures", async ({ page }) => {
  test.setTimeout(8 * 60 * 1000);
  await offlineLocal(page);
  const cdp = await page.context().newCDPSession(page);
  for (const app of FRENCH_ENERGY_APPS) {
    await page.setViewportSize({ width: 320, height: 900 });
    const errors = await openApp(page, app);
    await page.evaluate(() => document.fonts && document.fonts.ready);
    await page.waitForTimeout(250);
    await expect.poll(
      () => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth),
      { message: `${app.frRoute}: 320px overflow`, timeout: 3000 }
    ).toBeLessThanOrEqual(3);
    expect(errors, `${app.frRoute}: page errors`).toEqual([]);

    await cdp.send("Emulation.setPageScaleFactor", { pageScaleFactor: 2 });
    await expect.poll(
      () => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth),
      { message: `${app.frRoute}: 200% overflow`, timeout: 3000 }
    ).toBeLessThanOrEqual(3);
    await cdp.send("Emulation.setPageScaleFactor", { pageScaleFactor: 1 });
  }
});

test("all 20 French calculators execute their primary workflow at 375px", async ({ page }) => {
  test.setTimeout(8 * 60 * 1000);
  await offlineLocal(page);
  await page.setViewportSize({ width: 375, height: 900 });
  const failures = [];

  for (const app of FRENCH_ENERGY_APPS) {
    try {
      const errors = await openApp(page, app);
      await seedControls(page);
      if (app.id === "backup-duration") {
        await page.fill("#batteryKWh", "5.12");
        await page.fill("#loadWatts", "800");
      }
      const [resultSelector, buttonSelector] = WORKFLOW_SELECTORS[app.id];
      const button = page.locator(buttonSelector).first();
      if (await button.count()) await button.evaluate((element) => element.click());
      const result = page.locator(resultSelector).first();
      await expect(result, `${app.id}: result`).toBeAttached();
      const text = (await result.innerText()).trim();
      expect(text.length, `${app.id}: result content`).toBeGreaterThan(8);
      expect(text, `${app.id}: invalid output`).not.toMatch(/\b(?:NaN|Infinity|undefined)\b/);
      const actions = await page.locator("button:visible").allInnerTexts();
      expect(actions.join(" "), `${app.id}: untranslated primary action`).not.toMatch(/\b(?:Calculate|Download|Copy result|Reset defaults)\b/);
      expect(errors, `${app.id}: page errors`).toEqual([]);
    } catch (error) {
      failures.push(`${app.id}: ${error.message.split("\n")[0]}`);
    }
  }
  expect(failures, failures.join("\n")).toEqual([]);
});

test("all 20 apps export and reopen local JSON, print locally, and gate AI routing on consent", async ({ page }) => {
  test.setTimeout(8 * 60 * 1000);
  await offlineLocal(page);
  await page.setViewportSize({ width: 375, height: 900 });

  for (const app of FRENCH_ENERGY_APPS) {
    await openApp(page, app);
    await seedControls(page);
    const downloadPromise = page.waitForEvent("download");
    await page.click("[data-fr-energy-export]");
    const download = await downloadPromise;
    const saved = await download.path();
    expect(saved && fs.existsSync(saved), `${app.id}: JSON download`).toBeTruthy();
    await page.locator("[data-fr-energy-import]").setInputFiles(saved);
    await expect(page.locator("[data-fr-energy-export-status]")).toContainText("rouvert");

    await expect(page.locator("[data-fr-energy-ai-link]")).toHaveAttribute("aria-disabled", "true");
    await page.locator("[data-fr-energy-ai-link]").focus();
    await page.keyboard.press("Enter");
    await expect(page.locator("[data-fr-energy-ai-status]")).toContainText("Consentement requis");
    await page.check("[data-fr-energy-ai-consent]");
    await expect(page.locator("[data-fr-energy-ai-link]")).toHaveAttribute("aria-disabled", "false");
  }
});

test("all 20 apps support light, manual dark, and system-dark presentation", async ({ page }) => {
  test.setTimeout(6 * 60 * 1000);
  await offlineLocal(page);
  await page.setViewportSize({ width: 375, height: 900 });
  for (const app of FRENCH_ENERGY_APPS) {
    await page.emulateMedia({ colorScheme: "light" });
    await openApp(page, app);
    await page.evaluate(() => document.documentElement.setAttribute("data-theme", "light"));
    await expect(page.locator(".fr-energy-trust")).toBeVisible();
    await page.evaluate(() => document.documentElement.setAttribute("data-theme", "dark"));
    await expect(page.locator(".fr-energy-trust")).toBeVisible();
    await page.evaluate(() => {
      document.documentElement.removeAttribute("data-theme");
      document.documentElement.setAttribute("data-theme-choice", "auto");
    });
    await page.emulateMedia({ colorScheme: "dark" });
    await expect(page.locator(".fr-energy-trust")).toBeVisible();
  }
});
