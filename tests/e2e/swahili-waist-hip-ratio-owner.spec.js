const { test, expect } = require("@playwright/test");
const fs = require("fs");
const pdfParse = require("pdf-parse");

const route = "/sw/zana/uwiano-wa-kiuno-na-nyonga/";
const residue = /\b(?:Waist[- ]hip ratio|Waist-to-height|screening only|First waist circumference|Second waist circumference|First hip circumference|Measurement context|Choose one|Calculate ratio|Download TXT|Print \/ save PDF|Observed ratio interval|Result|clinician|public-health authority)\b/i;

function luminance(color) {
  const channels = color.match(/[\d.]+/g).slice(0, 3).map(Number).map((value) => {
    value /= 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}
function contrast(a, b) {
  const x = luminance(a), y = luminance(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}
async function snapshot(locator) {
  return locator.evaluate((element) => {
    const style = getComputedStyle(element);
    const placeholder = element.matches("input") ? getComputedStyle(element, "::placeholder") : null;
    const panel = element.closest(".card,.toolbar") || document.body;
    return {
      color: style.color,
      background: style.backgroundColor,
      border: style.borderTopColor,
      outline: style.outlineColor,
      outlineStyle: style.outlineStyle,
      outlineWidth: parseFloat(style.outlineWidth),
      panel: getComputedStyle(panel).backgroundColor,
      placeholder: placeholder && placeholder.color
    };
  });
}
async function assertControl(page, selector, theme, label, disabled) {
  const locator = page.locator(selector).first();
  await expect(locator).toHaveCount(1);
  let style = await snapshot(locator);
  expect(contrast(style.color, style.background), theme + " " + label + " text " + JSON.stringify(style)).toBeGreaterThanOrEqual(4.5);
  expect(Math.max(contrast(style.border, style.panel), contrast(style.background, style.panel)), theme + " " + label + " boundary " + JSON.stringify(style)).toBeGreaterThanOrEqual(3);
  if (style.placeholder) expect(contrast(style.placeholder, style.background), theme + " " + label + " placeholder").toBeGreaterThanOrEqual(4.5);
  if (!disabled) {
    await locator.focus();
    style = await snapshot(locator);
    expect(style.outlineStyle).not.toBe("none");
    expect(style.outlineWidth).toBeGreaterThanOrEqual(2);
    expect(contrast(style.outline, style.panel), theme + " " + label + " focus").toBeGreaterThanOrEqual(3);
    await locator.hover();
    style = await snapshot(locator);
    expect(contrast(style.color, style.background), theme + " " + label + " hover").toBeGreaterThanOrEqual(4.5);
  }
}
async function fillScenario(page) {
  await page.selectOption("#applicability", "adult");
  await page.selectOption("#units", "cm");
  await page.locator("#waist").fill("84");
  await page.locator("#waist2").fill("86");
  await page.locator("#hip").fill("100");
  await page.locator("#hip2").fill("102");
  await page.selectOption("#reference", "women");
}
async function calculateScenario(page) {
  await fillScenario(page);
  await page.getByRole("button", { name: "Kokotoa uwiano" }).click();
}
async function themeProof(page, theme) {
  await page.emulateMedia({ colorScheme: theme === "system-dark" ? "dark" : "light" });
  await page.evaluate((name) => {
    if (name === "system-dark") document.documentElement.removeAttribute("data-theme");
    else document.documentElement.setAttribute("data-theme", name === "manual-dark" ? "dark" : "light");
  }, theme);
  await page.waitForTimeout(150);
  await calculateScenario(page);
  await assertControl(page, "#applicability", theme, "select", false);
  await assertControl(page, "#waist", theme, "number input", false);
  await assertControl(page, 'button[type="submit"]', theme, "primary button", false);
  await assertControl(page, "#downloadTxt", theme, "enabled export", false);
  const optionStyle = await page.locator("#applicability option").nth(1).evaluate((option) => {
    const style = getComputedStyle(option);
    return { color: style.color, background: style.backgroundColor };
  });
  expect(contrast(optionStyle.color, optionStyle.background), theme + " option text " + JSON.stringify(optionStyle)).toBeGreaterThanOrEqual(4.5);
  await page.locator("#waist").fill("84.1");
  await assertControl(page, "#downloadTxt", theme, "disabled export", true);
}

test("native Swahili waist-to-hip owner preserves calculation, clinical, export, privacy and UI proof", async ({ browser }) => {
  test.setTimeout(180000);
  const context = await browser.newContext({ viewport: { width: 320, height: 860 }, colorScheme: "light", serviceWorkers: "block" });
  await context.addInitScript(() => {
    window.__printed = false;
    window.__storageWrites = [];
    window.print = () => { window.__printed = true; };
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key, value) {
      window.__storageWrites.push(String(key) + "=" + String(value));
      return original.call(this, key, value);
    };
  });
  const page = await context.newPage();
  const consoleErrors = [], pageErrors = [], notFound = [], requests = [];
  page.on("console", (message) => { if (message.type() === "error") consoleErrors.push(message.text()); });
  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("response", (response) => {
    const url = new URL(response.url());
    if (url.hostname === "127.0.0.1" && response.status() === 404) notFound.push(url.pathname);
  });
  page.on("request", (request) => requests.push(decodeURIComponent(request.url()) + "\n" + (request.postData() || "")));

  const response = await page.goto(route, { waitUntil: "networkidle" });
  expect(response.status()).toBe(200);
  await expect(page.locator("html")).toHaveAttribute("lang", "sw");
  await expect(page.locator("html")).toHaveAttribute("data-sw-waist-hip-ready", "true");
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", "https://afrotools.com" + route);
  await expect(page.locator("[data-source-proof] time")).toHaveAttribute("datetime", "2026-08-02");
  await expect(page.locator("iframe,[data-ai-consent],[data-ai]")).toHaveCount(0);
  expect(await page.locator("[data-export]").evaluateAll((buttons) => buttons.map((button) => button.disabled))).toEqual([true, true]);
  const schemas = (await page.locator('script[type="application/ld+json"]').allTextContents()).map(JSON.parse);
  const types = schemas.flatMap((schema) => Array.isArray(schema["@type"]) ? schema["@type"] : [schema["@type"]]);
  expect(types).toEqual(expect.arrayContaining(["WebApplication", "WebPage", "BreadcrumbList", "FAQPage", "HowTo"]));
  schemas.forEach((schema) => expect(schema.inLanguage).toBe("sw"));
  const artwork = page.locator('img[src="/assets/img/tools/waist-hip-ratio.webp"]');
  await artwork.scrollIntoViewIfNeeded();
  await expect(artwork).toBeVisible();
  expect(await artwork.evaluate((image) => ({ complete: image.complete, width: image.naturalWidth, height: image.naturalHeight }))).toEqual({ complete: true, width: 800, height: 450 });

  const controls = page.locator("#waistHipForm input,#waistHipForm select");
  expect(await controls.count()).toBe(7);
  for (let index = 0; index < await controls.count(); index += 1) {
    expect(await controls.nth(index).evaluate((control) => Boolean(control.labels && control.labels.length))).toBe(true);
  }
  await page.getByRole("button", { name: "Kokotoa uwiano" }).click();
  await expect(page.locator("#formError")).toHaveText("Chagua muktadha wa kipimo.");
  await expect(page.locator("#applicability")).toHaveAttribute("aria-invalid", "true");
  await expect(page.locator("#resultCard")).toBeHidden();
  await page.selectOption("#applicability", "adult");
  await expect(page.locator("#applicability")).toHaveAttribute("aria-invalid", "false");
  await expect(page.locator("#formError")).toHaveText("");

  await calculateScenario(page);
  await expect(page.locator("#resultCard")).toBeVisible();
  await expect(page.locator("#resultValue")).toHaveText("0.842");
  await expect(page.locator("#referenceLabel")).toHaveText("Chini ya rejea iliyochaguliwa ya 0.85");
  const metrics = await page.locator("#metricGrid").innerText();
  expect(metrics).toContain("0.824–0.860");
  expect(metrics).toContain("85.0 cm");
  expect(metrics).toContain("101.0 cm");
  await expect(page.locator("#resultCopy")).toContainText("inavuka rejea ya 0.85");
  await expect(page.locator("#resultCopy")).toContainText("hauwezi kutambua unene, mafuta ya mwili, kisukari");

  await page.locator("#waist").fill("84.1");
  await expect(page.locator("#resultCard")).toBeHidden();
  await expect(page.locator("#downloadTxt")).toBeDisabled();
  await expect(page.locator("#actionStatus")).toContainText("Matokeo ya zamani yamefutwa");
  await calculateScenario(page);

  await page.selectOption("#applicability", "under18");
  await page.getByRole("button", { name: "Kokotoa uwiano" }).click();
  await expect(page.locator("#referenceLabel")).toHaveText("Uwiano pekee — hakuna rejea ya watu wengi iliyotumika");
  await expect(page.locator("#resultCopy")).toContainText("Rejea ya mtu mzima haikutumika");

  await page.selectOption("#applicability", "adult");
  await page.locator("#waist").fill("90");
  await page.locator("#waist2").fill("");
  await page.locator("#hip").fill("100");
  await page.locator("#hip2").fill("");
  await page.selectOption("#reference", "men");
  await page.getByRole("button", { name: "Kokotoa uwiano" }).click();
  await expect(page.locator("#resultValue")).toHaveText("0.900");
  await expect(page.locator("#referenceLabel")).toContainText("Sawa na au juu ya");

  await page.selectOption("#units", "in");
  await page.locator("#waist").fill("11.9");
  await page.locator("#hip").fill("40");
  await page.getByRole("button", { name: "Kokotoa uwiano" }).click();
  await expect(page.locator("#waist")).toHaveAttribute("aria-invalid", "true");
  await expect(page.locator("#formError")).toContainText("12 na 100 inchi");
  await page.locator("#waist").fill("12");
  await expect(page.locator("#waist")).toHaveAttribute("aria-invalid", "false");
  await expect(page.locator("#formError")).toHaveText("");

  await calculateScenario(page);
  let downloadEvent = page.waitForEvent("download");
  await page.locator("#downloadTxt").click();
  let download = await downloadEvent;
  const text = fs.readFileSync(await download.path(), "utf8");
  expect(text).toContain("Uwiano: 0.842");
  expect(text).toContain("Nafasi ya uwiano: 0.824–0.860");
  expect(text).toContain("Tarehe ya ukaguzi wa vyanzo: 2 Agosti 2026");
  expect(text).toContain("si nafasi ya uhakika wa kitabibu");
  expect(text).not.toMatch(residue);
  await page.locator("#printPdf").click();
  expect(await page.evaluate(() => window.__printed)).toBe(true);
  const pdf = await page.pdf({ format: "A4", printBackground: true });
  const parsed = await pdfParse(pdf);
  expect(pdf.subarray(0, 4).toString("ascii")).toBe("%PDF");
  expect(parsed.text).toContain("Uwiano wa kiuno na nyonga");
  expect(parsed.text).toContain("0.842");
  expect(parsed.text).toContain("Si utambuzi wala uamuzi wa matibabu");

  await page.locator("#waist").fill("199.7");
  await page.locator("#waist2").fill("");
  await page.locator("#hip").fill("203.9");
  await page.locator("#hip2").fill("");
  await page.selectOption("#reference", "none");
  await page.getByRole("button", { name: "Kokotoa uwiano" }).click();
  await expect(page.locator("#metricGrid")).toContainText("199.7 cm");
  expect(requests.join("\n")).not.toContain("199.7");
  expect(requests.filter((request) => /\/api\/|\.netlify\/functions|ai-advisor/i.test(request))).toEqual([]);
  expect((await page.evaluate(() => window.__storageWrites)).join("\n")).not.toContain("199.7");

  await page.locator("#clearTool").click();
  await expect(page.locator("#resultCard")).toBeHidden();
  await expect(page.locator("#applicability")).toHaveValue("");
  await expect(page.locator("#applicability")).toBeFocused();
  for (const width of [320, 375]) {
    await page.setViewportSize({ width, height: 860 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
  }
  await page.setViewportSize({ width: 640, height: 900 });
  await page.evaluate(() => { document.body.style.zoom = "2"; });
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
  await page.evaluate(() => { document.body.style.zoom = ""; });
  await page.setViewportSize({ width: 1280, height: 900 });
  for (const theme of ["light", "manual-dark", "system-dark"]) await themeProof(page, theme);
  await page.emulateMedia({ colorScheme: "light" });
  await page.evaluate(() => document.documentElement.setAttribute("data-theme", "light"));
  await calculateScenario(page);
  await page.getByRole("button", { name: "Kokotoa uwiano" }).focus();
  await page.keyboard.press("Enter");
  await expect(page.locator("#resultCard")).toBeVisible();
  expect(await page.locator("main").innerText()).not.toMatch(residue);
  expect(consoleErrors).toEqual([]);
  expect(pageErrors).toEqual([]);
  expect(notFound).toEqual([]);
  await context.close();
});
