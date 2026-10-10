const { test, expect } = require("@playwright/test");
const fs = require("fs");
const pdfParse = require("pdf-parse");
const { prepareText } = require("../../assets/js/lib/agriculture-report-pdf.js");
const { apps } = require("../../scripts/build-sw-agriculture-assigned-apps.js");

test.describe.configure({ mode: "serial" });
test.setTimeout(120000);

// These 13 applications expose native controls; the other seven retain JSON input.
const nativeInputs = {
  "planting-calendar": { key: "zone", value: "highland", selector: "#agri-zone", invalid: null },
  "fertilizer-calc": { key: "area", value: 3, selector: "#agri-area", invalid: "-1" },
  "farm-budget": { key: "crops.0.area", value: 3, selector: '[data-budget-field="area"]', invalid: "-1" },
  "soil-ph-calculator": { key: "ph", value: 8.2, selector: "#agri-ph", invalid: "2" },
  "farm-size-converter": { key: "amount", value: 3, selector: "#agri-amount", invalid: "-1" },
  "harvest-date-estimator": { key: "maturityDays", value: 180, selector: "#agri-maturityDays", invalid: "-1" },
  "storage-loss": { key: "quantityTonnes", value: 3, selector: "#agri-quantityTonnes", invalid: "-1" },
  "crop-rotation-planner": { key: "seasons", value: 3, selector: "#agri-seasons", invalid: "0" },
  "agric-profit": { key: "area", value: 3, selector: "#agri-profit-area", invalid: "-1" },
  "crop-yield": { key: "farmSize", value: 3, selector: "#agri-farmSize", invalid: "-1" },
  "export-docs": { key: "query", value: "Ghana", selector: "#agri-query", invalid: "no-such-country-987654" },
  "tractor-calculator": { key: "farmHa", value: 30, selector: "#agri-farmHa", invalid: "-1" },
  "crop-insurance": { key: "farmValue", value: 600000, selector: "#agri-farmValue", invalid: "-1" },
};
const rawInputs = {
  "poultry-roi-calculator": { key: "flockSize", value: 101 },
  "pesticide-dosage-calculator": { key: "areaHa", value: 2 },
  "coffee-calculator": { key: "farmHa", value: 2 },
  "cocoa-tracker": { key: "farmSizeHa", value: 2 },
  "commodity-prices": { key: "volumeTonnes", value: 2 },
  "cooperative-calculator": { key: "revenue", value: 110000 },
  "warehouse-receipt": { key: "quantityTonnes", value: 11 },
};
expect(Object.keys(nativeInputs)).toHaveLength(13);
expect([...Object.keys(nativeInputs), ...Object.keys(rawInputs)].sort()).toEqual(apps.map(app => app.id).sort());

async function downloadBytes(page, format) {
  const downloadPromise = page.waitForEvent("download");
  await page.locator(`[data-export=${format}]`).click();
  return fs.readFileSync(await (await downloadPromise).path());
}

for (const app of apps) {
  test(`${app.id}: native calculation, reset and exports`, async ({ page }) => {
    const errors = [];
    const networkWrites = [];
    page.on("request", request => { if (!["GET", "HEAD"].includes(request.method())) networkWrites.push(request.method() + " " + request.url()); });
    page.on("console", message => { if (message.type() === "error") errors.push(message.text()); });
    page.on("pageerror", error => errors.push(error.message));
    await page.goto(`/sw/zana/${app.slug}/`);
    await expect(page.locator("html")).toHaveAttribute("lang", "sw");
    await page.locator("[data-agri-form] button[type=submit]").click();
    await expect(page.locator("[data-result]")).toBeVisible();
    const result = JSON.parse(await page.locator("[data-output]").textContent());
    expect(result).toBeTruthy();
    const control = nativeInputs[app.id];
    const initialControlValue = control ? await page.locator(control.selector).inputValue() : null;
    let initialPayload;
    let textExport;
    if (control) {
      await expect(page.locator("#scenario")).toBeHidden();
      await expect(page.locator(control.selector)).toBeVisible();
      await expect(page.locator("[data-readable-result]")).toBeVisible();
    }

    for (const format of ["json", "txt", "csv", "pdf"]) {
      const downloadPromise = page.waitForEvent("download");
      await page.locator(`[data-export=${format}]`).click();
      const download = await downloadPromise;
      const file = await download.path();
      const bytes = fs.readFileSync(file);
      expect(bytes.length).toBeGreaterThan(20);
      if (format === "json") {
        const payload = JSON.parse(bytes.toString("utf8"));
        initialPayload = payload;
        expect(payload.tool).toBe(app.id);
        expect(payload.locale).toBe("sw");
        expect(payload.privacy).toBe("local-only");
        await page.locator("[data-import]").setInputFiles(file);
        await expect(page.locator("[data-status]")).toContainText("imefunguliwa");
      } else if (format === "csv") expect(bytes.toString("utf8")).toContain("sehemu,thamani");
      else if (format === "txt") {
        textExport = bytes.toString("utf8");
        expect(textExport).toContain(app.name);
      } else {
        expect(bytes.subarray(0, 4).toString("ascii")).toBe("%PDF");
        const parsed = await pdfParse(bytes);
        expect(parsed.numpages).toBeGreaterThan(0);
        const body = parsed.text.replace(/^\s*\d+\s*\/\s*\d+\s*$/gm, "").replace(/\s/g, "");
        expect(body).toContain(prepareText(textExport).replace(/\s/g, ""));
      }
    }

    // Reopen a different input with a forged saved result, then immediately download
    // again. This catches controls that still display the previous scenario.
    const imported = JSON.parse(JSON.stringify(initialPayload));
    const change = control || rawInputs[app.id];
    const keys = change.key.split(".");
    let target = imported.input;
    for (const key of keys.slice(0, -1)) target = target[key];
    target[keys.at(-1)] = change.value;
    imported.result = { forgedResultMustNotBeUsed: true };
    const expected = await page.evaluate(input => window.__SW_AGRI_TEST__.run(input), imported.input);
    await page.locator("[data-import]").setInputFiles({ name: "changed-input.json", mimeType: "application/json", buffer: Buffer.from(JSON.stringify(imported)) });
    await expect(page.locator("[data-status]")).toContainText("imefunguliwa");
    expect(JSON.parse(await page.locator("[data-output]").textContent())).toEqual(expected);
    if (control) await expect(page.locator(control.selector)).toHaveValue(String(change.value));
    const reopened = JSON.parse((await downloadBytes(page, "json")).toString("utf8"));
    expect(reopened.input).toEqual(imported.input);
    expect(reopened.result).toEqual(expected);
    expect(reopened.result).not.toHaveProperty("forgedResultMustNotBeUsed");

    // The visible file picker remains the invalid-JSON boundary for every app.
    await page.locator("[data-import]").setInputFiles({ name: "invalid.json", mimeType: "application/json", buffer: Buffer.from("{") });
    await expect(page.locator("[data-status]")).toContainText("Faili haikuweza");
    await expect(page.locator("[data-result]")).toBeHidden();
    expect(await page.evaluate(() => window.__SW_AGRI_TEST__.getLatest())).toBeNull();

    await page.locator("[data-agri-form] button[type=reset]").click();
    await expect(page.locator("[data-result]")).toBeHidden();
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    if (control) {
      await expect(page.locator(control.selector)).toHaveValue(initialControlValue);
      if (control.invalid === null) await page.locator(control.selector).selectOption([]);
      else await page.locator(control.selector).fill(control.invalid);
    } else await page.locator("#scenario").fill("{");
    await page.locator("[data-agri-form] button[type=submit]").click();
    if (app.id === "export-docs") {
      // Any bounded search text is valid; an unknown query has an honest empty state.
      await expect(page.locator("[data-result]")).toBeVisible();
      expect(JSON.parse(await page.locator("[data-output]").textContent()).count).toBe(0);
      await expect(page.locator("[data-readable-result]")).toContainText("Hakuna nchi inayolingana");
    } else await expect(page.locator("[data-result]")).toBeHidden();
    expect(errors).toEqual([]);
    expect(networkWrites, "calculation, import and export keep input local").toEqual([]);
  });
}

test("assigned Agriculture layout reflows at 320, 375 and 200%", async ({ page }) => {
  for (const width of [320, 375]) {
    await page.setViewportSize({ width, height: 800 });
    for (const app of apps) {
      await page.goto(`/sw/zana/${app.slug}/`);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    }
  }
  await page.setViewportSize({ width: 640, height: 800 });
  for (const app of apps) {
    await page.goto(`/sw/zana/${app.slug}/`);
    await page.evaluate(() => { document.documentElement.style.zoom = "2"; });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `${app.id}: 200% zoom`).toBe(true);
  }
});

for (const theme of ["light", "dark"]) {
  for (const width of [320, 390]) {
    test(`13 native Agriculture forms have labels, contrast and keyboard focus at ${width}px ${theme}`, async ({ page }, testInfo) => {
      const rows = [];
      await page.setViewportSize({ width, height: 900 });
      await page.emulateMedia({ colorScheme: theme, reducedMotion: "reduce" });
      for (const app of apps.filter(app => nativeInputs[app.id])) {
        await page.goto(`/sw/zana/${app.slug}/`);
        await page.evaluate(value => { document.documentElement.dataset.theme = value; }, theme);
        await page.addScriptTag({ path: require.resolve("axe-core/axe.min.js") });
        const violations = await page.evaluate(async () => (await window.axe.run("[data-sw-agriculture-app]", { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21aa"] } })).violations.map(row => ({ id: row.id, nodes: row.nodes.map(node => node.target) })));
        expect(violations, `${app.id}: labels and contrast`).toEqual([]);
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `${app.id}: viewport`).toBe(true);
        const control = page.locator("[data-agri-form] input:visible, [data-agri-form] select:visible").first();
        await control.focus();
        await page.keyboard.press("Tab");
        const focus = await page.evaluate(() => {
          const element = document.activeElement, style = getComputedStyle(element);
          return { inForm: Boolean(element.closest("[data-agri-form]")), outline: style.outlineStyle, width: Number.parseFloat(style.outlineWidth) };
        });
        expect(focus.inForm, `${app.id}: keyboard remains in input flow`).toBe(true);
        expect(focus.outline, `${app.id}: visible focus`).not.toBe("none");
        expect(focus.width, `${app.id}: visible focus width`).toBeGreaterThanOrEqual(2);
        rows.push({ tool: app.id, width, theme, violations, focus });
        if (width === 390 && ["soil-ph-calculator", "farm-budget", "tractor-calculator"].includes(app.id)) {
          await page.screenshot({ path: testInfo.outputPath(`${app.id}-${theme}.png`), fullPage: true });
        }
      }
      await testInfo.attach("native-form-accessibility.json", { body: Buffer.from(JSON.stringify(rows, null, 2)), contentType: "application/json" });
      expect(rows).toHaveLength(13);
    });
  }
}
