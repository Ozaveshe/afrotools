const { test, expect } = require("@playwright/test");
const fs = require("fs");
const pdfParse = require("pdf-parse");
const axeSource = require("axe-core").source;

const route = "/sw/zana/mzigo-wa-masomo/";
const residue = /\b(?:University Course Load|Course Load|Course name|Registered credits|Earned progress|Remaining before|Weekly hours|Below entered|Inside entered|Above entered|Add course|Remove course|Copy plan|Download TXT|Print \/ save PDF|Institutional audit|Related tools|Newsletter|All Tools|Search tools|Privacy Policy|Terms of Use|About Us|Contact Us)\b/i;
const themes = [
  { name: "manual-light", scheme: "light", attribute: "light" },
  { name: "manual-dark", scheme: "light", attribute: "dark" },
  { name: "system-light", scheme: "light", attribute: null },
  { name: "system-dark", scheme: "dark", attribute: null }
];

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
    const placeholder = element.matches("input,textarea") ? getComputedStyle(element, "::placeholder") : null;
    const panel = element.closest(".card,.toolbar") || document.body;
    return {
      color: style.color, background: style.backgroundColor, border: style.borderTopColor,
      outline: style.outlineColor, outlineStyle: style.outlineStyle,
      outlineWidth: parseFloat(style.outlineWidth), panel: getComputedStyle(panel).backgroundColor,
      placeholder: placeholder && placeholder.color,
      width: element.getBoundingClientRect().width, height: element.getBoundingClientRect().height,
      minHeight: parseFloat(style.minHeight)
    };
  });
}
async function assertControl(page, selector, theme, label, disabled, placeholder) {
  const locator = page.locator(selector).first();
  await expect(locator).toHaveCount(1);
  let style = await snapshot(locator);
  expect(contrast(style.color, style.background), theme + " " + label + " text " + JSON.stringify(style)).toBeGreaterThanOrEqual(4.5);
  expect(Math.max(contrast(style.border, style.panel), contrast(style.background, style.panel)), theme + " " + label + " boundary " + JSON.stringify(style)).toBeGreaterThanOrEqual(3);
  if (placeholder) expect(contrast(style.placeholder, style.background), theme + " " + label + " placeholder " + JSON.stringify(style)).toBeGreaterThanOrEqual(4.5);
  expect(Math.max(style.height, style.minHeight || 0), theme + " " + label + " target height").toBeGreaterThanOrEqual(44);
  if (!disabled) {
    await locator.focus(); style = await snapshot(locator);
    expect(style.outlineStyle).not.toBe("none");
    expect(style.outlineWidth).toBeGreaterThanOrEqual(2);
    expect(contrast(style.outline, style.panel), theme + " " + label + " focus " + JSON.stringify(style)).toBeGreaterThanOrEqual(3);
  }
}
async function assertCheckbox(page, theme) {
  const checkbox = page.locator("[data-audit]").first();
  let style = await snapshot(checkbox);
  expect(Math.max(contrast(style.border, style.panel), contrast(style.background, style.panel)), theme + " checkbox boundary " + JSON.stringify(style)).toBeGreaterThanOrEqual(3);
  expect(style.width).toBeGreaterThanOrEqual(24); expect(style.height).toBeGreaterThanOrEqual(24);
  await checkbox.focus(); style = await snapshot(checkbox);
  expect(style.outlineWidth).toBeGreaterThanOrEqual(2);
  expect(contrast(style.outline, style.panel), theme + " checkbox focus " + JSON.stringify(style)).toBeGreaterThanOrEqual(3);
}

async function fillScenario(page, privateValues = false) {
  await page.locator("#clearTool").click();
  const values = {
    programmeCredits: "120", earnedCredits: "72", minimumCredits: "12", maximumCredits: "18",
    ruleSource: privateValues ? "Waraka-Siri-482 wa idara" : "Mwongozo wa usajili 2026",
    ruleChecked: "2026-08-01", contactHours: "18", studyHours: "20", workHours: "15",
    commuteHours: "5", sleepHours: "7.5", personalHours: "14"
  };
  for (const [id, value] of Object.entries(values)) await page.locator("#" + id).fill(value);
  await page.locator(".course-name").nth(0).fill(privateValues ? "Kozi-Siri-927" : "BIO 201");
  await page.locator(".course-credits").nth(0).fill("3");
  await page.locator(".course-name").nth(1).fill("CHE 202");
  await page.locator(".course-credits").nth(1).fill("4");
  await page.locator("#addCourse").click();
  await page.locator(".course-name").nth(2).fill("MAT 203");
  await page.locator(".course-credits").nth(2).fill("5");
}
async function calculateScenario(page, privateValues = false) {
  await fillScenario(page, privateValues);
  await page.getByRole("button", { name: "Tengeneza mpango wa ukaguzi" }).click();
}
async function applyTheme(page, theme) {
  await page.emulateMedia({ colorScheme: theme.scheme });
  await page.evaluate((attribute) => {
    if (attribute) document.documentElement.setAttribute("data-theme", attribute);
    else document.documentElement.removeAttribute("data-theme");
  }, theme.attribute);
}
async function assertAxe(page, theme) {
  const violations = await page.evaluate(async () => {
    const result = await window.axe.run(document, { resultTypes: ["violations"] });
    return result.violations.map((violation) => ({
      id: violation.id,
      impact: violation.impact,
      targets: violation.nodes.map((node) => node.target.join(" "))
    }));
  });
  expect(violations, theme.name + " axe violations").toEqual([]);
}
async function themeProof(page, theme) {
  await applyTheme(page, theme);
  await page.waitForTimeout(80);
  await calculateScenario(page);
  await assertControl(page, "#ruleSource", theme.name, "text input", false, true);
  await assertControl(page, "#ruleChecked", theme.name, "date input", false, false);
  await assertControl(page, "#programmeCredits", theme.name, "number input", false, true);
  await assertControl(page, ".course-name", theme.name, "dynamic text input", false, true);
  await assertControl(page, 'button[type="submit"]', theme.name, "primary button", false, false);
  await assertControl(page, "#addCourse", theme.name, "add button", false, false);
  await assertControl(page, ".remove-course", theme.name, "remove button", false, false);
  await assertControl(page, "#downloadTxt", theme.name, "enabled export", false, false);
  await assertControl(page, "#themeToggle", theme.name, "theme button", false, false);
  await assertCheckbox(page, theme.name);
  await assertAxe(page, theme);
  await page.locator("#studyHours").fill("20.5");
  await assertControl(page, "#downloadTxt", theme.name, "disabled export", true, false);
}
async function overflowProof(page) {
  return page.evaluate(() => {
    const limit = document.documentElement.clientWidth;
    const offenders = Array.from(document.body.querySelectorAll("*")).filter((element) => {
      if (element.matches(".skip,.skip-link") || element.closest(".skip,.skip-link")) return false;
      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      if (style.display === "none" || style.visibility === "hidden" || rect.width === 0 || rect.height === 0) return false;
      return rect.left < -1 || rect.right > limit + 1;
    }).map((element) => {
      const rect = element.getBoundingClientRect();
      return { tag: element.tagName, id: element.id, className: String(element.className).slice(0, 100), left: rect.left, right: rect.right, limit };
    });
    return {
      viewport: window.innerWidth,
      root: parseFloat(getComputedStyle(document.documentElement).fontSize),
      zoom: getComputedStyle(document.body).zoom,
      documentOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      offenders
    };
  });
}
async function trueReflowProof(page, width) {
  await page.setViewportSize({ width, height: 900 });
  await page.evaluate(() => { document.documentElement.style.fontSize = ""; });
  const base = await page.evaluate(() => parseFloat(getComputedStyle(document.documentElement).fontSize));
  await page.evaluate((size) => { document.documentElement.style.fontSize = size + "px"; }, base * 2);
  await calculateScenario(page);
  await expect(page.locator("#resultCard")).toBeVisible();
  await expect(page.locator("#courseTotal")).toHaveText("12");
  expect(await page.locator("[data-export]").evaluateAll((buttons) => buttons.map((button) => button.disabled))).toEqual([false, false, false]);
  await page.evaluate(() => {
    window.__reflowCopied = "";
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText: async (text) => { window.__reflowCopied = text; } } });
  });
  await page.locator("#copyPlan").click();
  expect(await page.evaluate(() => window.__reflowCopied)).toContain("Jumla iliyoandikishwa: 12");
  const proof = await overflowProof(page);
  expect(proof.viewport).toBe(width);
  expect(proof.root).toBeCloseTo(base * 2, 5);
  expect(proof.zoom === "1" || proof.zoom === "normal").toBe(true);
  expect(proof.documentOverflow).toBeLessThanOrEqual(1);
  expect(proof.offenders).toEqual([]);
  await page.evaluate(() => { document.documentElement.style.fontSize = ""; });
}
async function sequentialKeyboardProof(page) {
  await page.locator("#clearTool").click();
  const sequence = [
    page.locator("#programmeCredits"), page.locator("#earnedCredits"), page.locator("#minimumCredits"), page.locator("#maximumCredits"),
    page.locator("#ruleSource"), page.locator("#ruleChecked"), page.locator(".course-name").nth(0), page.locator(".course-credits").nth(0),
    page.locator(".remove-course").nth(0), page.locator(".course-name").nth(1), page.locator(".course-credits").nth(1),
    page.locator(".remove-course").nth(1), page.locator("#addCourse"), page.locator("#contactHours"), page.locator("#studyHours"),
    page.locator("#workHours"), page.locator("#commuteHours"), page.locator("#sleepHours"), page.locator("#personalHours"),
    page.locator('#courseLoadForm button[type="submit"]'), page.locator("#clearTool")
  ];
  await sequence[0].focus();
  for (let index = 1; index < sequence.length; index += 1) {
    await page.keyboard.press("Tab");
    var dateSubStops = 0;
    while (index === 6 && dateSubStops < 8 && await page.locator("#ruleChecked").evaluate((element) => document.activeElement === element)) {
      await page.keyboard.press("Tab");
      dateSubStops += 1;
    }
    expect(await sequence[index].evaluate((element) => document.activeElement === element), "tab stop " + index).toBe(true);
    const focus = await sequence[index].evaluate((element) => {
      const style = getComputedStyle(element);
      return { style: style.outlineStyle, width: parseFloat(style.outlineWidth) };
    });
    expect(focus.style).not.toBe("none");
    expect(focus.width).toBeGreaterThanOrEqual(2);
  }
}

test("native Swahili course-load owner preserves calculation, invalid states, exports, privacy and UI proof", async ({ browser }) => {
  test.setTimeout(210000);
  const context = await browser.newContext({ viewport: { width: 320, height: 900 }, colorScheme: "light", serviceWorkers: "block" });
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await context.addInitScript(() => {
    window.__printed = false; window.__storageWrites = [];
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
  await page.addScriptTag({ content: axeSource });
  await expect(page.locator("html")).toHaveAttribute("lang", "sw");
  await expect(page.locator("html")).toHaveAttribute("data-sw-course-load-ready", "true");
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", "https://afrotools.com" + route);
  await expect(page.locator('link[rel="alternate"]')).toHaveCount(4);
  await expect(page.locator("[data-source-proof] time")).toHaveAttribute("datetime", "2026-08-02");
  await expect(page.locator("iframe,[data-ai-consent],[data-ai]")).toHaveCount(0);
  expect(await page.locator("[data-export]").evaluateAll((buttons) => buttons.map((button) => button.disabled))).toEqual([true, true, true]);
  const schemas = (await page.locator('script[type="application/ld+json"]').allTextContents()).map(JSON.parse);
  const types = schemas.flatMap((schema) => Array.isArray(schema["@type"]) ? schema["@type"] : [schema["@type"]]);
  expect(types).toEqual(expect.arrayContaining(["WebApplication", "WebPage", "BreadcrumbList", "FAQPage", "HowTo"]));
  schemas.forEach((schema) => expect(schema.inLanguage).toBe("sw"));
  const artwork = page.locator('img[src="/assets/img/tools/course-load.webp"]');
  await artwork.scrollIntoViewIfNeeded(); await expect(artwork).toBeVisible();
  expect(await artwork.evaluate((image) => ({ complete: image.complete, width: image.naturalWidth, height: image.naturalHeight }))).toEqual({ complete: true, width: 800, height: 450 });

  await expect(page.locator(".course-row")).toHaveCount(2);
  const controls = page.locator("#courseLoadForm input");
  expect(await controls.count()).toBe(16);
  for (let index = 0; index < await controls.count(); index += 1) expect(await controls.nth(index).evaluate((control) => Boolean(control.labels && control.labels.length))).toBe(true);
  await page.locator("#addCourse").click(); await expect(page.locator(".course-row")).toHaveCount(3);
  await expect(page.locator(".course-name").last()).toBeFocused();
  await page.locator(".remove-course").last().click(); await expect(page.locator(".course-row")).toHaveCount(2);
  await expect(page.locator("#addCourse")).toBeFocused();

  await page.getByRole("button", { name: "Tengeneza mpango wa ukaguzi" }).click();
  await expect(page.locator("#programmeCredits")).toHaveAttribute("aria-invalid", "true");
  await expect(page.locator("#formError")).toContainText("jumla ya krediti za programu");
  await expect(page.locator("#resultCard")).toBeHidden();
  await page.locator("#programmeCredits").fill("120");
  await expect(page.locator("#programmeCredits")).toHaveAttribute("aria-invalid", "false");
  await expect(page.locator("#formError")).toHaveText("");

  await fillScenario(page); await page.locator("#minimumCredits").fill("19");
  await page.getByRole("button", { name: "Tengeneza mpango wa ukaguzi" }).click();
  await expect(page.locator("#minimumCredits")).toHaveAttribute("aria-invalid", "true");
  await expect(page.locator("#formError")).toContainText("hakiwezi kuzidi");
  await page.locator("#minimumCredits").fill("12"); await expect(page.locator("#formError")).toHaveText("");

  await fillScenario(page); await page.locator(".course-credits").first().fill("0");
  await page.getByRole("button", { name: "Tengeneza mpango wa ukaguzi" }).click();
  await expect(page.locator(".course-credits").first()).toHaveAttribute("aria-invalid", "true");
  await expect(page.locator("#formError")).toContainText("kati ya 0.01 na 100");
  await page.locator(".course-credits").first().fill("3"); await expect(page.locator("#formError")).toHaveText("");

  await page.locator("#clearTool").click();
  while (await page.locator(".remove-course").count()) await page.locator(".remove-course").first().click();
  await page.locator("#programmeCredits").fill("120"); await page.locator("#earnedCredits").fill("72");
  await page.locator("#minimumCredits").fill("12"); await page.locator("#maximumCredits").fill("18");
  await page.getByRole("button", { name: "Tengeneza mpango wa ukaguzi" }).click();
  await expect(page.locator("#addCourse")).toHaveAttribute("aria-invalid", "true");
  await expect(page.locator("#formError")).toContainText("Ongeza angalau kozi moja");
  await page.locator("#addCourse").click(); await expect(page.locator("#formError")).toHaveText("");

  await fillScenario(page); await page.locator("#sleepHours").fill("24.1");
  await page.getByRole("button", { name: "Tengeneza mpango wa ukaguzi" }).click();
  await expect(page.locator("#sleepHours")).toHaveAttribute("aria-invalid", "true");
  await expect(page.locator("#formError")).toContainText("kati ya saa 0 na 24");
  await page.locator("#sleepHours").fill("7.5"); await expect(page.locator("#formError")).toHaveText("");

  await calculateScenario(page);
  await expect(page.locator("#resultCard")).toBeVisible();
  await expect(page.locator("#ruleResult")).toContainText("Ndani ya kiwango ulichoingiza");
  const metrics = await page.locator("#metricGrid").innerText();
  for (const expected of ["12", "60.0%", "48", "36", "124.5", "43.5"]) expect(metrics).toContain(expected);
  await expect(page.locator("#courseTotal")).toHaveText("12");
  await expect(page.locator("#auditList [data-audit]")).toHaveCount(6);

  await fillScenario(page); await page.locator(".course-name").first().fill("");
  await page.getByRole("button", { name: "Tengeneza mpango wa ukaguzi" }).click();
  await expect(page.locator("#courseResults tr").first()).toContainText("Kozi 1");
  await expect(page.locator("#courseResults")).not.toContainText("Course 1");
  await page.locator("#studyHours").fill("20.5");
  await expect(page.locator("#resultCard")).toBeHidden(); await expect(page.locator("#downloadTxt")).toBeDisabled();
  await expect(page.locator("#actionStatus")).toContainText("Matokeo ya zamani yamefutwa");

  await fillScenario(page);
  await page.locator(".course-credits").nth(2).fill("4");
  await page.getByRole("button", { name: "Tengeneza mpango wa ukaguzi" }).click();
  await expect(page.locator("#ruleResult")).toContainText("Chini ya kiwango cha chini");
  await expect(page.locator("#ruleResult")).toContainText("krediti 1 chini");
  await page.locator(".course-credits").nth(2).fill("12");
  await page.getByRole("button", { name: "Tengeneza mpango wa ukaguzi" }).click();
  await expect(page.locator("#ruleResult")).toContainText("Juu ya kiwango cha juu");
  await expect(page.locator("#ruleResult")).toContainText("krediti 1 juu");

  await fillScenario(page); await page.locator("#contactHours").fill("168"); await page.locator("#studyHours").fill("168");
  await page.getByRole("button", { name: "Tengeneza mpango wa ukaguzi" }).click();
  await expect(page.locator("#metricGrid")).toContainText("Saa zinazozidi 168");

  await calculateScenario(page, true);
  await page.locator("[data-audit]").nth(0).check(); await page.locator("[data-audit]").nth(5).check();
  await page.locator("#copyPlan").click(); await expect(page.locator("#actionStatus")).toHaveText("Mpango wa ukaguzi umenakiliwa.");
  expect(await page.evaluate(() => navigator.clipboard.readText())).toContain("Kozi-Siri-927");
  await page.evaluate(() => { navigator.clipboard.writeText = () => Promise.reject(new Error("denied")); });
  await page.locator("#copyPlan").click(); await expect(page.locator("#actionStatus")).toContainText("Pakua faili ya TXT badala yake");

  const downloadEvent = page.waitForEvent("download"); await page.locator("#downloadTxt").click();
  const download = await downloadEvent;
  expect(download.suggestedFilename()).toBe("ukaguzi-wa-mzigo-wa-kozi.txt");
  const text = fs.readFileSync(await download.path(), "utf8");
  for (const expected of ["Jumla iliyoandikishwa: 12", "Zilizobaki ikiwa kozi zote za sasa zitakamilika na kuhesabiwa: 36", "Kozi-Siri-927", "Waraka-Siri-482", "[x] Kila kozi ya sasa", "[x] GPA, mradi wa mwisho", "si idhini ya usajili"]) expect(text).toContain(expected);
  expect(text).not.toMatch(residue);
  await page.locator("#printPdf").click(); expect(await page.evaluate(() => window.__printed)).toBe(true);
  const pdf = await page.pdf({ format: "A4", printBackground: true }); const parsed = await pdfParse(pdf);
  expect(pdf.subarray(0, 4).toString("ascii")).toBe("%PDF");
  expect(parsed.text).toContain("Kagua mzigo wa kozi"); expect(parsed.text).toContain("Ndani ya kiwango ulichoingiza"); expect(parsed.text).toContain("Kozi-Siri-927");

  const network = requests.join("\n");
  expect(network).not.toContain("Kozi-Siri-927"); expect(network).not.toContain("Waraka-Siri-482");
  expect(requests.filter((request) => /\/api\/|\.netlify\/functions|ai-advisor/i.test(request))).toEqual([]);
  const writes = (await page.evaluate(() => window.__storageWrites)).join("\n");
  expect(writes).not.toContain("Kozi-Siri-927"); expect(writes).not.toContain("Waraka-Siri-482");

  await page.locator("#clearTool").click(); await expect(page.locator("#resultCard")).toBeHidden();
  await expect(page.locator(".course-row")).toHaveCount(2); await expect(page.locator("#programmeCredits")).toHaveValue(""); await expect(page.locator("#programmeCredits")).toBeFocused();
  for (const width of [320, 375]) await trueReflowProof(page, width);
  await page.setViewportSize({ width: 1280, height: 900 });
  for (const theme of themes) await themeProof(page, theme);

  await page.emulateMedia({ colorScheme: "light" }); await page.evaluate(() => document.documentElement.setAttribute("data-theme", "light"));
  await fillScenario(page); await page.getByRole("button", { name: "Tengeneza mpango wa ukaguzi" }).focus(); await page.keyboard.press("Enter");
  await expect(page.locator("#resultCard")).toBeVisible();
  await sequentialKeyboardProof(page);
  expect(await page.locator("body").innerText()).not.toMatch(residue);
  expect(consoleErrors).toEqual([]); expect(pageErrors).toEqual([]); expect(notFound).toEqual([]);
  await context.close();
});
