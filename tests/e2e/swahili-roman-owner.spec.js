const { test, expect } = require("@playwright/test");
const fs = require("fs");
const pdfParse = require("pdf-parse");

function relativeLuminance(color) {
  const channels = color.match(/[\d.]+/g).slice(0, 3).map(Number).map((value) => {
    const channel = value / 255;
    return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

function contrastRatio(first, second) {
  const lighter = Math.max(relativeLuminance(first), relativeLuminance(second));
  const darker = Math.min(relativeLuminance(first), relativeLuminance(second));
  return (lighter + 0.05) / (darker + 0.05);
}

function expectContrast(first, second, minimum, label) {
  expect(contrastRatio(first, second), `${label}: ${first} on ${second}`).toBeGreaterThanOrEqual(minimum);
}

async function controlSnapshot(locator) {
  return locator.evaluate((element) => {
    const style = getComputedStyle(element);
    const cardStyle = getComputedStyle(element.closest(".card"));
    const placeholderStyle = ["INPUT", "TEXTAREA"].includes(element.tagName)
      ? getComputedStyle(element, "::placeholder")
      : null;
    const optionStyle = element.tagName === "SELECT" && element.options.length
      ? getComputedStyle(element.options[0])
      : null;
    return {
      background: style.backgroundColor,
      color: style.color,
      border: style.borderTopColor,
      outline: style.outlineColor,
      outlineStyle: style.outlineStyle,
      outlineWidth: parseFloat(style.outlineWidth),
      cardBackground: cardStyle.backgroundColor,
      placeholder: placeholderStyle && placeholderStyle.color,
      optionBackground: optionStyle && optionStyle.backgroundColor,
      optionColor: optionStyle && optionStyle.color
    };
  });
}

async function assertRomanControlContrast(page, theme) {
  await page.emulateMedia({ colorScheme: theme === "system-dark" ? "dark" : "light" });
  await page.evaluate((selectedTheme) => {
    if (selectedTheme === "system-dark") document.documentElement.removeAttribute("data-theme");
    else document.documentElement.setAttribute("data-theme", selectedTheme);
  }, theme === "manual-dark" ? "dark" : theme);
  await page.waitForTimeout(400);

  const controls = [
    { selector: "#romanInput", type: "input" },
    { selector: "#quizDifficulty", type: "select" },
    { selector: "#batchInput", type: "textarea" },
    { selector: "#convertButton", type: "button-primary" },
    { selector: "#skipQuizButton", type: "button-secondary" }
  ];

  for (const control of controls) {
    const locator = page.locator(control.selector);
    const normal = await controlSnapshot(locator);
    expectContrast(normal.color, normal.background, 4.5, `${theme} ${control.type} text`);
    expectContrast(
      normal.border,
      control.type.startsWith("button") ? normal.cardBackground : normal.background,
      3,
      `${theme} ${control.type} boundary`
    );
    if (normal.placeholder) {
      expectContrast(normal.placeholder, normal.background, 4.5, `${theme} ${control.type} placeholder`);
    }
    if (normal.optionColor) {
      expectContrast(normal.optionColor, normal.optionBackground, 4.5, `${theme} select option`);
    }

    await locator.focus();
    const focused = await controlSnapshot(locator);
    expect(focused.outlineStyle, `${theme} ${control.type} focus style`).not.toBe("none");
    expect(focused.outlineWidth, `${theme} ${control.type} focus width`).toBeGreaterThanOrEqual(2);
    expectContrast(focused.outline, focused.cardBackground, 3, `${theme} ${control.type} focus outline`);
    expectContrast(
      focused.border,
      control.type.startsWith("button") ? focused.cardBackground : focused.background,
      3,
      `${theme} ${control.type} focus boundary`
    );

    const wasDisabled = await locator.isDisabled();
    await locator.evaluate((element) => { element.disabled = true; });
    const disabled = await controlSnapshot(locator);
    expectContrast(disabled.color, disabled.background, 4.5, `${theme} ${control.type} disabled text`);
    expectContrast(disabled.border, disabled.background, 3, `${theme} ${control.type} disabled boundary`);
    await locator.evaluate((element, restoreDisabled) => { element.disabled = restoreDisabled; }, wasDisabled);

    if (control.type.startsWith("button")) {
      await locator.hover();
      const hovered = await controlSnapshot(locator);
      expectContrast(hovered.color, hovered.background, 4.5, `${theme} ${control.type} hover text`);
      expectContrast(hovered.border, hovered.cardBackground, 3, `${theme} ${control.type} hover boundary`);
    }
  }
}

test("Clean-base Swahili Roman owner matches English workflows and fails closed", async ({ browser }) => {
  test.setTimeout(150000);
  const context = await browser.newContext({
    viewport: { width: 320, height: 820 },
    colorScheme: "light",
    serviceWorkers: "block"
  });
  await context.addInitScript(() => {
    window.__copy = "";
    window.__print = false;
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: async (text) => {
          window.__copy = text;
        }
      }
    });
    window.print = () => {
      window.__print = true;
    };
  });

  const page = await context.newPage();
  const consoleErrors = [];
  const pageErrors = [];
  const notFound = [];
  const requests = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("response", (response) => {
    if (new URL(response.url()).hostname === "127.0.0.1" && response.status() === 404) {
      notFound.push(new URL(response.url()).pathname);
    }
  });
  page.on("request", (request) => requests.push(request.url() + "\n" + (request.postData() || "")));

  const response = await page.goto("/sw/zana/namba-za-kirumi/", { waitUntil: "networkidle" });
  expect(response.status()).toBe(200);
  await expect(page.locator("html")).toHaveAttribute("lang", "sw");
  await expect(page.locator("html")).toHaveAttribute("data-sw-roman-ready", "true");
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    "https://afrotools.com/sw/zana/namba-za-kirumi/"
  );
  await expect(page.locator('link[hreflang="en"]')).toHaveAttribute(
    "href",
    "https://afrotools.com/tools/roman-numerals/"
  );
  await expect(page.locator('link[hreflang="fr"]')).toHaveAttribute(
    "href",
    "https://afrotools.com/fr/tools/chiffres-romains/"
  );

  const schemas = (await page.locator('script[type="application/ld+json"]').allTextContents()).map(JSON.parse);
  const types = schemas.flatMap((schema) => Array.isArray(schema["@type"]) ? schema["@type"] : [schema["@type"]]);
  expect(types).toEqual(expect.arrayContaining(["WebApplication", "WebPage", "BreadcrumbList", "FAQPage", "HowTo"]));
  expect(
    schemas
      .filter((schema) => ["WebApplication", "WebPage", "FAQPage", "HowTo"].some(
        (type) => Array.isArray(schema["@type"]) ? schema["@type"].includes(type) : schema["@type"] === type
      ))
      .every((schema) => schema.inLanguage === "sw")
  ).toBe(true);

  await expect.poll(() => page.evaluate(() => Boolean(document.querySelector("afro-navbar")?.shadowRoot))).toBe(true);
  await expect.poll(() => page.evaluate(() => Boolean(document.querySelector("afro-footer")?.shadowRoot))).toBe(true);
  await expect(page.locator("iframe")).toHaveCount(0);
  await expect(page.locator("afro-related-tools, afro-newsletter-cta")).toHaveCount(0);
  await expect(page.locator('main [data-ai], main button:has-text("AI")')).toHaveCount(0);
  await expect(page.locator("body")).not.toContainText("Related tools");

  const artwork = page.locator('img[src="/assets/img/tools/roman-numerals.svg"]');
  await expect(artwork).toBeVisible();
  expect((await artwork.evaluate((image) => ({ width: image.naturalWidth, height: image.naturalHeight }))).width).toBeGreaterThan(0);

  await page.locator("#romanInput").fill("2024");
  await page.locator("#romanInput").press("Enter");
  await expect(page.locator("#singleEquation")).toHaveText("2024 = MMXXIV");
  await expect(page.locator("#singleSteps")).toContainText("2000 = MM");

  await page.locator("#romanInput").fill("IL");
  await page.locator("#convertButton").click();
  await expect(page.locator("#singleError")).not.toBeEmpty();
  await expect(page.locator("#romanInput")).toHaveAttribute("aria-invalid", "true");
  await page.locator("#romanInput").fill("49");
  await expect(page.locator("#singleError")).toBeEmpty();
  await expect(page.locator("#romanInput")).not.toHaveAttribute("aria-invalid", "true");
  await expect(page.locator("#singleResult")).toBeHidden();
  await expect(page.locator("#copyResultButton")).toBeDisabled();
  await expect(page.locator("#romanStatus")).toContainText("Thamani imebadilika");

  await page.locator("#convertButton").click();
  await expect(page.locator("#singleEquation")).toHaveText("49 = XLIX");
  await page.locator("#swapResultButton").click();
  await expect(page.locator("#romanInput")).toHaveValue("XLIX");
  await expect(page.locator("#singleEquation")).toHaveText("XLIX = 49");
  await page.locator("#swapResultButton").click();
  await expect(page.locator("#romanInput")).toHaveValue("49");
  await expect(page.locator("#singleEquation")).toHaveText("49 = XLIX");

  await page.locator("#copyResultButton").click();
  await expect.poll(() => page.evaluate(() => window.__copy)).toContain("49 = XLIX");
  const singleDownloadEvent = page.waitForEvent("download");
  await page.locator("#downloadResultButton").click();
  const singleDownload = await singleDownloadEvent;
  expect(fs.readFileSync(await singleDownload.path(), "utf8")).toContain("49 = XLIX");
  await page.locator("#printResultButton").click();
  expect(await page.evaluate(() => window.__print)).toBe(true);
  const pdf = await page.pdf({ format: "A4", printBackground: true });
  const parsedPdf = await pdfParse(pdf);
  expect(parsedPdf.text).toContain("49 = XLIX");

  for (const value of ["0", "4000", "IIII", "IL", "12.5"]) {
    await page.locator("#romanInput").fill(value);
    await page.locator("#convertButton").click();
    await expect(page.locator("#singleError")).not.toBeEmpty();
    await expect(page.locator("#singleResult")).toBeHidden();
    await expect(page.locator("#romanInput")).toHaveAttribute("aria-invalid", "true");
  }

  await page.locator("#batchInput").fill("");
  await page.locator("#batchButton").click();
  await expect(page.locator("#batchError")).toHaveText("Weka angalau mstari mmoja.");
  await page.locator("#batchInput").fill("49");
  await expect(page.locator("#batchError")).toBeEmpty();
  await expect(page.locator("#batchResult")).toBeHidden();

  await page.locator("#batchInput").fill("49\nMMXXIV\nIL");
  await page.locator("#batchButton").click();
  await expect(page.locator("#batchResult")).toContainText("49 → XLIX");
  await expect(page.locator("#batchResult")).toContainText("MMXXIV → 2024");
  await expect(page.locator("#batchResult")).toContainText("IL → Huo si mwandiko");
  await page.locator("#copyBatchButton").click();
  await expect.poll(() => page.evaluate(() => window.__copy)).toContain("MMXXIV → 2024");

  await page.locator("#batchInput").fill("944");
  await expect(page.locator("#batchResult")).toBeHidden();
  await expect(page.locator("#copyBatchButton")).toBeDisabled();
  await page.locator("#batchButton").click();
  const batchDownloadEvent = page.waitForEvent("download");
  await page.locator("#downloadBatchButton").click();
  const batchDownload = await batchDownloadEvent;
  expect(fs.readFileSync(await batchDownload.path(), "utf8")).toContain("944 → CMXLIV");

  await page.evaluate(() => {
    const values = [0.48, 0.9];
    Math.random = () => values.shift() ?? 0.9;
  });
  await page.locator("#quizDifficulty").selectOption("easy");
  await expect(page.locator("#quizPrompt")).toHaveText("48");
  await expect(page.locator("#quizDirection")).toContainText("Kirumi");
  await page.locator("#quizAnswer").fill("XLVIII");
  await page.locator("#checkQuizButton").click();
  await expect(page.locator("#quizFeedback")).toHaveText("Sahihi.");
  await expect(page.locator("#quizScore")).toHaveText("1");
  await expect(page.locator("#quizTotal")).toHaveText("1");
  await expect(page.locator("#quizStreak")).toHaveText("1");
  await expect(page.locator("#quizAnswer")).toBeDisabled();
  await expect(page.locator("#checkQuizButton")).toBeDisabled();
  await expect(page.locator("#nextQuizButton")).toBeVisible();

  await page.evaluate(() => {
    const values = [0.01, 0.1];
    Math.random = () => values.shift() ?? 0.1;
  });
  await page.locator("#nextQuizButton").click();
  await expect(page.locator("#quizPrompt")).toHaveText("I");
  await page.locator("#quizAnswer").fill("2");
  await page.locator("#checkQuizButton").click();
  await expect(page.locator("#quizFeedback")).toContainText("Jibu ni 1");
  await expect(page.locator("#quizScore")).toHaveText("1");
  await expect(page.locator("#quizTotal")).toHaveText("2");
  await expect(page.locator("#quizStreak")).toHaveText("0");

  await page.evaluate(() => {
    const values = [0.75, 0.9];
    Math.random = () => values.shift() ?? 0.9;
  });
  await page.locator("#skipQuizButton").click();
  await expect(page.locator("#quizPrompt")).toHaveText("75");
  await expect(page.locator("#quizTotal")).toHaveText("2");
  await expect(page.locator("#quizAnswer")).toBeEnabled();
  await expect(page.locator("#nextQuizButton")).toBeHidden();

  await page.evaluate(() => {
    const values = [0, 0.9];
    Math.random = () => values.shift() ?? 0.9;
  });
  await page.locator("#quizDifficulty").selectOption("large");
  await expect(page.locator("#quizPrompt")).toHaveText("1000");
  await page.locator("#checkQuizButton").click();
  await expect(page.locator("#quizAnswer")).toHaveAttribute("aria-invalid", "true");
  await page.locator("#quizAnswer").fill("M");
  await expect(page.locator("#quizAnswer")).not.toHaveAttribute("aria-invalid", "true");
  await expect(page.locator("#quizFeedback")).toBeEmpty();
  await page.locator("#checkQuizButton").click();
  await expect(page.locator("#quizScore")).toHaveText("2");
  await expect(page.locator("#quizTotal")).toHaveText("3");
  await expect(page.locator("#quizStreak")).toHaveText("1");

  const marker = "PRIVATE987654321098765432109876543210";
  await page.locator("#batchInput").fill(marker);
  await page.locator("#batchButton").click();
  expect(requests.join("\n")).not.toContain(marker);

  await page.locator("#romanInput").fill("49");
  await page.locator("#convertButton").click();
  await page.evaluate(() => {
    navigator.clipboard.writeText = () => Promise.reject(new Error("blocked by test"));
    document.execCommand = () => false;
  });
  await page.locator("#copyResultButton").click();
  await expect(page.locator("#romanStatus")).toContainText("Kunakili kumezuiwa");

  for (const width of [320, 375]) {
    await page.setViewportSize({ width, height: 820 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
  }
  await page.setViewportSize({ width: 640, height: 900 });
  await page.evaluate(() => { document.body.style.zoom = "2"; });
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
  await page.evaluate(() => { document.body.style.zoom = ""; });

  await page.setViewportSize({ width: 1280, height: 900 });
  for (const theme of ["light", "manual-dark", "system-dark"]) {
    await assertRomanControlContrast(page, theme);
  }
  await page.emulateMedia({ colorScheme: "light" });
  await page.evaluate(() => { document.documentElement.setAttribute("data-theme", "light"); });
  await page.getByRole("button", { name: "Badili kwenda giza" }).first().click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.getByRole("button", { name: "Badili kwenda mwanga" }).first().click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await page.locator("#romanInput").focus();
  await expect(page.locator("#romanInput")).toBeFocused();
  await expect(page.getByRole("button", { name: "Badili mwelekeo" })).toBeVisible();
  await expect(page.getByLabel("Ugumu")).toBeVisible();

  expect(consoleErrors).toEqual([]);
  expect(pageErrors).toEqual([]);
  expect(notFound).toEqual([]);
  await context.close();
});
