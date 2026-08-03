const { test, expect } = require("@playwright/test");
const fs = require("fs");
const pdf = require("pdf-parse");

const routes = [
  ["contractor-vs-employee", "/sw/zana/mkandarasi-dhidi-ya-mfanyakazi/", "/tools/contractor-vs-employee/"],
  ["domestic-worker", "/sw/zana/mshahara-wa-mfanyakazi-wa-nyumbani/", "/tools/domestic-worker/"],
  ["employee-cost", "/sw/zana/gharama-ya-mfanyakazi/", "/tools/employee-cost/"],
  ["gratuity-calculator", "/sw/zana/kikokotoo-kiinua-mgongo/", "/tools/gratuity-calculator/"],
  ["maternity-leave", "/sw/zana/kikokotoo-likizo-ya-uzazi/", "/tools/maternity-leave/"],
  ["retrenchment-calculator", "/sw/zana/kikokotoo-malipo-ya-kuachishwa-kazi/", "/tools/retrenchment-calculator/"]
];
const hubRoute = "/sw/mshahara-na-kodi/payroll/";
const restoredOutputs = {
  "domestic-worker": { key: "effectiveHourly", label: "Malipo halisi kwa saa" },
  "gratuity-calculator": { key: "dailyPay", label: "Malipo ya siku" }
};

function restoredEnglishOwnerValue(id, input) {
  if (id === "domestic-worker") {
    const hoursPerWeek = Number(input.hoursPerWeek);
    const daysPerWeek = Number(input.daysPerWeek);
    const basePay = Number(input.basePay);
    const baseMonthly = input.payPeriod === "hourly" ? basePay * hoursPerWeek * (52 / 12) : input.payPeriod === "daily" ? basePay * daysPerWeek * (52 / 12) : input.payPeriod === "weekly" ? basePay * (52 / 12) : basePay;
    return baseMonthly / (hoursPerWeek * 52 / 12);
  }
  if (id === "gratuity-calculator") return Number(input.monthlyPay) / Number(input.divisor);
  return null;
}

function rgba(value) {
  const srgb = String(value).match(/^color\(srgb\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*([\d.]+))?\)$/i);
  if (srgb) return { r: Number(srgb[1]) * 255, g: Number(srgb[2]) * 255, b: Number(srgb[3]) * 255, a: srgb[4] === undefined ? 1 : Number(srgb[4]) };
  const parts = String(value).match(/[\d.]+/g);
  if (!parts || parts.length < 3) throw new Error(`Unsupported computed color: ${value}`);
  return { r: Number(parts[0]), g: Number(parts[1]), b: Number(parts[2]), a: parts[3] === undefined ? 1 : Number(parts[3]) };
}

async function auditAllVisibleTextAndControls(page, label) {
  const result = await page.evaluate((modeLabel) => {
    function parseColor(value) {
      const srgb = String(value).match(/^color\(srgb\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*([\d.]+))?\)$/i);
      if (srgb) return [Number(srgb[1]) * 255, Number(srgb[2]) * 255, Number(srgb[3]) * 255, srgb[4] === undefined ? 1 : Number(srgb[4])];
      const parts = String(value).match(/[\d.]+/g);
      return parts && parts.length >= 3 ? [Number(parts[0]), Number(parts[1]), Number(parts[2]), parts[3] === undefined ? 1 : Number(parts[3])] : null;
    }
    function composite(foreground, background) {
      const alpha = foreground[3];
      return [foreground[0] * alpha + background[0] * (1 - alpha), foreground[1] * alpha + background[1] * (1 - alpha), foreground[2] * alpha + background[2] * (1 - alpha), 1];
    }
    function luminance(color) {
      const channels = color.slice(0, 3).map((value) => { const normalized = value / 255; return normalized <= 0.04045 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4; });
      return (0.2126 * channels[0]) + (0.7152 * channels[1]) + (0.0722 * channels[2]);
    }
    function ratio(a, b) { const values = [luminance(a), luminance(b)].sort((x, y) => y - x); return (values[0] + 0.05) / (values[1] + 0.05); }
    function parentOf(node) { if (node.parentElement) return node.parentElement; const root = node.getRootNode && node.getRootNode(); return root && root.host ? root.host : null; }
    function background(node) {
      const layers = [];
      for (let current = node; current; current = parentOf(current)) {
        const color = parseColor(getComputedStyle(current).backgroundColor);
        if (color && color[3] > 0) layers.push(color);
        if (color && color[3] >= 0.999) break;
      }
      let settled = [255, 255, 255, 1];
      for (let index = layers.length - 1; index >= 0; index -= 1) settled = composite(layers[index], settled);
      return settled;
    }
    function visible(node) {
      const style = getComputedStyle(node); const rect = node.getBoundingClientRect();
      if (style.display === "none" || style.visibility === "hidden" || Number(style.opacity) === 0 || rect.width === 0 || rect.height === 0) return false;
      for (let current = node; current; current = parentOf(current)) if (current.getAttribute && current.getAttribute("aria-hidden") === "true") return false;
      return true;
    }
    function id(node) { return node.tagName.toLowerCase() + (node.id ? `#${node.id}` : "") + (node.classList && node.classList.length ? `.${Array.from(node.classList).slice(0, 2).join(".")}` : ""); }
    function collect(root, output) {
      for (const node of root.querySelectorAll("*")) {
        output.push(node);
        if (node.shadowRoot) collect(node.shadowRoot, output);
      }
    }
    const nodes = [];
    for (const root of [document.querySelector("main"), document.querySelector(".shub-hero")].filter(Boolean)) { nodes.push(root); collect(root, nodes); }
    const textFailures = []; let minimumText = Infinity;
    for (const node of nodes) {
      if (!visible(node) || ["SCRIPT", "STYLE", "NOSCRIPT", "TEMPLATE", "SVG"].includes(node.tagName)) continue;
      const ownText = Array.from(node.childNodes).filter((child) => child.nodeType === Node.TEXT_NODE).map((child) => child.textContent.trim()).join(" ").trim();
      if (!ownText) continue;
      const style = getComputedStyle(node); const bg = background(node); const color = parseColor(style.color);
      if (!color) continue;
      const gradientFills = Array.from(String(style.backgroundImage).matchAll(/rgba?\([^)]*\)|color\(srgb\s+[^)]*\)/gi)).map((match) => parseColor(match[0])).filter(Boolean);
      const backgrounds = gradientFills.length ? gradientFills.map((fill) => composite(fill, background(parentOf(node) || node))) : [bg];
      const value = Math.min(...backgrounds.map((fill) => ratio(composite(color, fill), fill))); minimumText = Math.min(minimumText, value);
      if (value < 4.5) textFailures.push({ element: id(node), text: ownText.slice(0, 90), ratio: value });
    }
    const controlFailures = []; const focusFailures = []; let minimumBoundary = Infinity; let minimumFocus = Infinity;
    const controls = nodes.filter((node) => visible(node) && /^(INPUT|SELECT|TEXTAREA|BUTTON)$/.test(node.tagName) && !node.disabled && (node.closest("main") || node.closest(".shub-hero")));
    for (const node of controls) {
      const own = getComputedStyle(node); const surround = background(parentOf(node) || node); const border = parseColor(own.borderTopColor);
      if (border && border[3] > 0) {
        const value = ratio(composite(border, surround), surround); minimumBoundary = Math.min(minimumBoundary, value);
        if (value < 3) controlFailures.push({ element: id(node), ratio: value, border: own.borderTopColor });
      } else {
        const gradientFills = Array.from(String(own.backgroundImage).matchAll(/rgba?\([^)]*\)|color\(srgb\s+[^)]*\)/gi)).map((match) => parseColor(match[0])).filter(Boolean);
        for (const fill of gradientFills) {
          const value = ratio(composite(fill, surround), surround); minimumBoundary = Math.min(minimumBoundary, value);
          if (value < 3) controlFailures.push({ element: id(node), ratio: value, border: "gradient fill" });
        }
      }
      node.focus(); const focused = getComputedStyle(node); const outline = parseColor(focused.outlineColor);
      if (focused.outlineStyle === "none" || !outline) focusFailures.push({ element: id(node), ratio: 0, outline: focused.outlineStyle });
      else {
        const value = ratio(composite(outline, surround), surround); minimumFocus = Math.min(minimumFocus, value);
        if (value < 3) focusFailures.push({ element: id(node), ratio: value, outline: focused.outlineColor });
      }
    }
    return { modeLabel, minimumText, minimumBoundary, minimumFocus, textFailures, controlFailures, focusFailures };
  }, label);
  expect(result.textFailures, `${label} visible text contrast ${JSON.stringify(result.textFailures.slice(0, 8))}`).toEqual([]);
  expect(result.controlFailures, `${label} control boundary contrast ${JSON.stringify(result.controlFailures.slice(0, 8))}`).toEqual([]);
  expect(result.focusFailures, `${label} focus contrast ${JSON.stringify(result.focusFailures.slice(0, 8))}`).toEqual([]);
  return result;
}

async function clickRealThemeControl(page, target) {
  const navbar = page.locator("afro-navbar");
  await expect(navbar).toBeAttached();
  for (let attempt = 0; attempt < 3; attempt += 1) {
    if ((await page.locator("html").getAttribute("data-theme")) === target && (await page.evaluate(() => localStorage.getItem("aft_theme"))) === target) break;
    await navbar.evaluate((node) => node.shadowRoot.querySelector("#themeToggle").click());
    await page.waitForTimeout(120);
  }
  await expect(page.locator("html")).toHaveAttribute("data-theme", target);
  await expect(page.locator("html")).toHaveAttribute("data-theme-choice", target);
  expect(await page.evaluate(() => localStorage.getItem("aft_theme"))).toBe(target);
}

async function useSystemTheme(page, colorScheme) {
  await page.emulateMedia({ colorScheme });
  await page.evaluate(() => localStorage.removeItem("aft_theme"));
  await page.reload({ waitUntil: "networkidle" });
  await expect(page.locator("html")).toHaveAttribute("data-theme-choice", "auto");
  await expect(page.locator("html")).toHaveAttribute("data-theme", colorScheme);
}

function composite(foreground, background) {
  const fg = rgba(foreground);
  const bg = rgba(background);
  return {
    r: (fg.r * fg.a) + (bg.r * (1 - fg.a)),
    g: (fg.g * fg.a) + (bg.g * (1 - fg.a)),
    b: (fg.b * fg.a) + (bg.b * (1 - fg.a)),
    a: 1
  };
}

function luminance(color) {
  const channels = [color.r, color.g, color.b].map((value) => {
    const normalized = value / 255;
    return normalized <= 0.04045 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
  });
  return (0.2126 * channels[0]) + (0.7152 * channels[1]) + (0.0722 * channels[2]);
}

function contrast(foreground, background) {
  const bg = composite(background, "rgb(255, 255, 255)");
  const fg = composite(foreground, `rgb(${bg.r}, ${bg.g}, ${bg.b})`);
  const values = [luminance(fg), luminance(bg)].sort((a, b) => b - a);
  return (values[0] + 0.05) / (values[1] + 0.05);
}

function gradientColors(backgroundImage) {
  return [...String(backgroundImage).matchAll(/rgba?\([^)]*\)/g)].map((match) => match[0]);
}

async function auditComputedContrast(page, mode) {
  await page.emulateMedia({ colorScheme: mode.system || mode.theme });
  await page.locator("html").evaluate((node, theme) => {
    if (theme) node.setAttribute("data-theme", theme);
    else node.removeAttribute("data-theme");
  }, mode.theme || null);
  await page.waitForTimeout(350);

  const minima = { controlBoundary: Infinity, focus: Infinity, text: Infinity, buttonBoundary: Infinity };
  const snapshot = await page.evaluate(() => {
    const controls = [...document.querySelectorAll(".sw-hr-field input, .sw-hr-field select, .sw-hr-field textarea")].map((node) => {
      const own = getComputedStyle(node);
      const surround = getComputedStyle(node.closest(".sw-hr-card")).backgroundColor;
      const values = { border: own.borderTopColor, background: own.backgroundColor, color: own.color, surround };
      node.focus();
      values.outline = getComputedStyle(node).outlineColor;
      return values;
    });
    const actions = [...document.querySelectorAll(".sw-hr-actions button:not(:disabled)")].map((node) => {
      const own = getComputedStyle(node);
      const surround = getComputedStyle(node.closest(".sw-hr-card")).backgroundColor;
      const values = { border: own.borderTopColor, background: own.backgroundColor, image: own.backgroundImage, color: own.color, surround, primary: node.classList.contains("btn-primary") };
      node.focus();
      values.outline = getComputedStyle(node).outlineColor;
      return values;
    });
    return { controls, actions };
  });

  for (const [index, styles] of snapshot.controls.entries()) {
    const boundaryRatio = contrast(styles.border, styles.surround);
    const textRatio = contrast(styles.color, styles.background);
    minima.controlBoundary = Math.min(minima.controlBoundary, boundaryRatio);
    minima.text = Math.min(minima.text, textRatio);
    expect(boundaryRatio, `${mode.name} control ${index + 1} boundary ${JSON.stringify(styles)}`).toBeGreaterThanOrEqual(3);
    expect(textRatio, `${mode.name} control ${index + 1} text`).toBeGreaterThanOrEqual(4.5);
    const focusRatio = contrast(styles.outline, styles.surround);
    minima.focus = Math.min(minima.focus, focusRatio);
    expect(focusRatio, `${mode.name} control ${index + 1} focus`).toBeGreaterThanOrEqual(3);
  }

  for (const [index, styles] of snapshot.actions.entries()) {
    if (styles.primary) {
      const fills = gradientColors(styles.image);
      expect(fills.length, `${mode.name} primary button gradient`).toBeGreaterThan(0);
      for (const fill of fills) {
        const boundaryRatio = contrast(fill, styles.surround);
        const textRatio = contrast(styles.color, fill);
        minima.buttonBoundary = Math.min(minima.buttonBoundary, boundaryRatio);
        minima.text = Math.min(minima.text, textRatio);
        expect(boundaryRatio, `${mode.name} primary button fill boundary`).toBeGreaterThanOrEqual(3);
        expect(textRatio, `${mode.name} primary button text`).toBeGreaterThanOrEqual(4.5);
      }
    } else {
      const boundaryRatio = contrast(styles.border, styles.surround);
      const textRatio = contrast(styles.color, styles.background);
      minima.buttonBoundary = Math.min(minima.buttonBoundary, boundaryRatio);
      minima.text = Math.min(minima.text, textRatio);
      expect(boundaryRatio, `${mode.name} secondary button ${index + 1} boundary`).toBeGreaterThanOrEqual(3);
      expect(textRatio, `${mode.name} secondary button ${index + 1} text`).toBeGreaterThanOrEqual(4.5);
    }
    const focusRatio = contrast(styles.outline, styles.surround);
    minima.focus = Math.min(minima.focus, focusRatio);
    expect(focusRatio, `${mode.name} action ${index + 1} focus ${JSON.stringify(styles)}`).toBeGreaterThanOrEqual(3);
  }
  return minima;
}

async function auditNonColorLinkCues(page, modeName) {
  const links = page.locator(".sw-hr-breadcrumb a, .sw-hr-source a");
  const count = await links.count();
  expect(count, `${modeName}: breadcrumb/source links`).toBeGreaterThan(0);
  const styles = await links.evaluateAll((nodes) => nodes.map((node) => {
    const style = getComputedStyle(node);
    return {
      text: (node.textContent || "").trim(),
      decorationLine: style.textDecorationLine,
      decorationStyle: style.textDecorationStyle,
      decorationThickness: style.textDecorationThickness,
      underlineOffset: style.textUnderlineOffset
    };
  }));
  for (const [index, style] of styles.entries()) {
    expect(style.decorationLine, `${modeName}: link ${index + 1} ${style.text}`).toContain("underline");
    expect(style.decorationStyle, `${modeName}: link ${index + 1} decoration style`).not.toBe("none");
  }
  return styles;
}

async function fillEvidence(page) {
  await page.locator('[name="jurisdiction"]').fill("Kenya");
  await page.locator('[name="sourceLabel"]').fill("Kenya Ministry of Labour — synthetic QA");
  await page.locator('[name="sourceDate"]').fill(new Date().toISOString().slice(0, 10));
}

async function calculate(page) {
  await fillEvidence(page);
  await page.locator('[name="sourceDate"]').press("Enter");
  await expect(page.locator("#sw-hr-result")).toBeVisible();
  await expect(page.locator("#sw-hr-status")).toContainText("yamekokotolewa");
}

async function assertSequentialFocusAtTrueTextResize(page, scopeSelector, label) {
  const tokens = await page.locator(scopeSelector).evaluate((scope) => {
    const visible = (node) => {
      const style = getComputedStyle(node);
      const rect = node.getBoundingClientRect();
      return style.display !== "none" && style.visibility !== "hidden" && Number(style.opacity) !== 0 && rect.width > 0 && rect.height > 0;
    };
    return Array.from(scope.querySelectorAll('a[href],button,input:not([type="hidden"]),select,textarea,summary,[tabindex]:not([tabindex="-1"])'))
      .filter((node) => !node.disabled && node.tabIndex >= 0 && visible(node))
      .map((node, index) => {
        const token = `${index}`;
        node.setAttribute("data-sw-hr-reflow-focus", token);
        return token;
      });
  });
  expect(tokens.length, `${label}: focusable controls at 200%`).toBeGreaterThan(0);

  const firstFocusable = page.locator(`[data-sw-hr-reflow-focus="${tokens[0]}"]`);
  await firstFocusable.scrollIntoViewIfNeeded();
  await firstFocusable.focus();
  for (let index = 0; index < tokens.length; index += 1) {
    if (index > 0) {
      let activeToken = "";
      for (let tab = 0; tab < 5 && activeToken !== tokens[index]; tab += 1) {
        await page.keyboard.press("Tab");
        activeToken = await page.evaluate(() => document.activeElement && document.activeElement.getAttribute("data-sw-hr-reflow-focus"));
      }
    }
    const focused = await page.evaluate((token) => {
      const node = document.activeElement;
      if (!node) return null;
      const rect = node.getBoundingClientRect();
      return {
        token: node.getAttribute("data-sw-hr-reflow-focus"),
        width: rect.width,
        height: rect.height,
        left: rect.left,
        right: rect.right,
        viewportWidth: window.innerWidth
      };
    }, tokens[index]);
    expect(focused && focused.token, `${label}: sequential focus ${index + 1}`).toBe(tokens[index]);
    expect(focused.width, `${label}: focused control ${index + 1} width`).toBeGreaterThanOrEqual(24);
    expect(focused.height, `${label}: focused control ${index + 1} height`).toBeGreaterThanOrEqual(24);
    expect(focused.left, `${label}: focused control ${index + 1} left clipping`).toBeGreaterThanOrEqual(-1);
    expect(focused.right, `${label}: focused control ${index + 1} right clipping`).toBeLessThanOrEqual(focused.viewportWidth + 1);
  }
}

async function assertTrue200PercentTextReflow(page, id, width) {
  const label = `${id}: ${width}px true 200% text reflow`;
  await page.setViewportSize({ width, height: 1000 });
  const baseline = await page.evaluate(() => {
    document.documentElement.style.fontSize = "";
    return {
      root: parseFloat(getComputedStyle(document.documentElement).fontSize),
      body: parseFloat(getComputedStyle(document.body).fontSize),
      heading: parseFloat(getComputedStyle(document.querySelector("main h1, h1")).fontSize)
    };
  });
  await page.locator("html").evaluate((node, size) => { node.style.fontSize = `${size * 2}px`; }, baseline.root);
  await expect.poll(() => page.locator("html").evaluate((node) => parseFloat(getComputedStyle(node).fontSize)), { message: `${label}: root font size doubled` }).toBeCloseTo(baseline.root * 2, 5);

  const audit = await page.evaluate(() => {
    const root = document.documentElement;
    const scope = document.body;
    const visible = (node) => {
      const style = getComputedStyle(node);
      const rect = node.getBoundingClientRect();
      return style.display !== "none" && style.visibility !== "hidden" && Number(style.opacity) !== 0 && rect.width > 0 && rect.height > 0;
    };
    const describe = (node) => node.tagName.toLowerCase() + (node.id ? `#${node.id}` : "") + (node.classList.length ? `.${Array.from(node.classList).slice(0, 2).join(".")}` : "");
    const elementOverflow = [];
    const textClipping = [];
    const controlFailures = [];
    const candidates = scope ? [scope, ...scope.querySelectorAll("*")] : [];
    for (const node of candidates) {
      if (!visible(node) || ["SCRIPT", "STYLE", "SVG", "PATH", "OPTION", "INPUT", "SELECT", "TEXTAREA"].includes(node.tagName)) continue;
      if (node.clientWidth > 0 && node.scrollWidth > node.clientWidth + 1) elementOverflow.push({ element: describe(node), scrollWidth: node.scrollWidth, clientWidth: node.clientWidth });
      const ownText = Array.from(node.childNodes).filter((child) => child.nodeType === Node.TEXT_NODE).map((child) => child.textContent.trim()).join(" ").trim();
      if (ownText && !node.closest(".sr-only,[aria-hidden='true']")) {
        const rect = node.getBoundingClientRect();
        if (rect.left < -1 || rect.right > innerWidth + 1) textClipping.push({ element: describe(node), left: rect.left, right: rect.right, viewport: innerWidth, text: ownText.slice(0, 80) });
      }
    }
    for (const node of scope.querySelectorAll("input,select,textarea,button")) {
      if (!visible(node)) continue;
      const rect = node.getBoundingClientRect();
      if (rect.width < 24 || rect.height < 24 || rect.left < -1 || rect.right > innerWidth + 1) controlFailures.push({ element: describe(node), width: rect.width, height: rect.height, left: rect.left, right: rect.right, viewport: innerWidth });
    }
    return {
      rootSize: parseFloat(getComputedStyle(root).fontSize),
      bodySize: parseFloat(getComputedStyle(document.body).fontSize),
      headingSize: parseFloat(getComputedStyle(document.querySelector("main h1, h1")).fontSize),
      documentOverflow: root.scrollWidth - root.clientWidth,
      bodyOverflow: document.body.scrollWidth - document.body.clientWidth,
      elementOverflow,
      textClipping,
      controlFailures
    };
  });

  expect(audit.rootSize, `${label}: computed root font size`).toBeCloseTo(baseline.root * 2, 5);
  expect(audit.bodySize, `${label}: computed body text doubled`).toBeCloseTo(baseline.body * 2, 5);
  expect(audit.headingSize, `${label}: computed heading text doubled`).toBeCloseTo(baseline.heading * 2, 5);
  expect(audit.documentOverflow, `${label}: document horizontal overflow; elements=${JSON.stringify(audit.elementOverflow.slice(0, 8))}; text=${JSON.stringify(audit.textClipping.slice(0, 8))}; controls=${JSON.stringify(audit.controlFailures.slice(0, 8))}`).toBeLessThanOrEqual(1);
  expect(audit.bodyOverflow, `${label}: body horizontal overflow; elements=${JSON.stringify(audit.elementOverflow.slice(0, 8))}`).toBeLessThanOrEqual(1);
  expect(audit.elementOverflow, `${label}: element horizontal overflow ${JSON.stringify(audit.elementOverflow.slice(0, 8))}`).toEqual([]);
  expect(audit.textClipping, `${label}: visible text clipping ${JSON.stringify(audit.textClipping.slice(0, 8))}`).toEqual([]);
  expect(audit.controlFailures, `${label}: unusable controls ${JSON.stringify(audit.controlFailures.slice(0, 8))}`).toEqual([]);

  await assertSequentialFocusAtTrueTextResize(page, id === "hub" ? "main" : "#sw-hr-form", label);
  console.log(`[sw-hr-true-200] ${JSON.stringify({ id, width, baseline, enlarged: { root: audit.rootSize, body: audit.bodySize, heading: audit.headingSize }, overflow: { document: audit.documentOverflow, body: audit.bodyOverflow, elements: audit.elementOverflow.length }, controls: audit.controlFailures.length, textClipping: audit.textClipping.length })}`);
  await page.locator("html").evaluate((node) => { node.style.fontSize = ""; });
}

test("all six plus hub stay local-only beyond delayed auth bootstrap while a normal page keeps auth enabled", async ({ browser }, testInfo) => {
  test.setTimeout(240000);
  const baseURL = testInfo.project.use.baseURL;
  const localOnlyRoutes = routes.map(([id, route]) => [id, route]).concat([["hub", hubRoute]]);

  for (const [id, route] of localOnlyRoutes) {
    const context = await browser.newContext({ baseURL, serviceWorkers: "block" });
    const requests = [];
    const pageErrors = [];
    const consoleErrors = [];
    context.on("request", (request) => requests.push({ method: request.method(), url: request.url(), body: request.postData() || "", headers: request.headers() }));
    context.on("page", (page) => {
      page.on("pageerror", (error) => pageErrors.push(error.message));
      page.on("console", (message) => { if (message.type() === "error") consoleErrors.push(message.text()); });
    });
    const page = await context.newPage();
    const response = await page.goto(route, { waitUntil: "networkidle" });
    expect(response.status(), `${id}: route response`).toBe(200);
    expect(await page.evaluate(() => window.AfroLocalOnly === true), `${id}: explicit local-only flag`).toBe(true);
    expect(await page.evaluate(() => window.AfroDisableAssistant === true), `${id}: AI assistant disabled on local-only surface`).toBe(true);
    await expect(page.locator('meta[name="afrotools-network-policy"]')).toHaveAttribute("content", "local-only");
    await expect(page.locator('meta[name="afrotools-network-policy"]')).toHaveAttribute("data-source-owner", "scripts/build-swahili-hr-payroll-six.js");
    await page.waitForTimeout(16500);

    const external = requests.filter((request) => !["127.0.0.1", "localhost"].includes(new URL(request.url).hostname));
    const authBootstrap = requests.filter((request) => /\/assets\/js\/(?:afro-auth|auth-cookie-upgrade|auth-oauth-guard)\.js|\/assets\/js\/components\/auth-modal\.js/i.test(request.url));
    expect(external, `${id}: no external request after the 16-second auth delay`).toEqual([]);
    expect(authBootstrap, `${id}: no auth bootstrap after the 16-second delay`).toEqual([]);
    expect(await page.locator('script[src*="afro-auth.js"],script[src*="auth-cookie-upgrade.js"],script[src*="auth-oauth-guard.js"],script[src*="auth-modal.js"]').count(), `${id}: no injected auth script`).toBe(0);
    expect(pageErrors, `${id}: page errors`).toEqual([]);
    expect(consoleErrors, `${id}: console errors`).toEqual([]);
    await context.close();
  }

  const authContext = await browser.newContext({ baseURL, serviceWorkers: "block" });
  const authRequests = [];
  const authPageErrors = [];
  await authContext.route("https://cdn.jsdelivr.net/**", (route) => route.fulfill({
    contentType: "application/javascript",
    body: "window.supabase={createClient:function(){return{auth:{onAuthStateChange:function(){return{data:{subscription:{unsubscribe:function(){}}}}},getSession:function(){return Promise.resolve({data:{session:null}})},signOut:function(){return Promise.resolve({error:null})}}}}};"
  }));
  authContext.on("request", (request) => authRequests.push(request.url()));
  authContext.on("page", (page) => page.on("pageerror", (error) => authPageErrors.push(error.message)));
  const authPage = await authContext.newPage();
  const authResponse = await authPage.goto("/", { waitUntil: "networkidle" });
  expect(authResponse.status(), "normal page response").toBe(200);
  expect(await authPage.evaluate(() => window.AfroLocalOnly === true), "normal page is not local-only").toBe(false);
  await expect.poll(() => authRequests.some((url) => /\/assets\/js\/afro-auth\.js/i.test(url)), { timeout: 15000 }).toBe(true);
  await expect.poll(() => authPage.evaluate(() => Boolean(window.AfroAuth)), { timeout: 5000 }).toBe(true);
  await authPage.evaluate(() => new Promise((resolve) => window.AfroAuth.onReady(resolve)));
  const authState = await authPage.evaluate(() => {
    const client = window.AfroAuth.getSupabase();
    return { client: Boolean(client), getSession: Boolean(client && client.auth && typeof client.auth.getSession === "function") };
  });
  expect(authState, "normal page auth client remains usable").toEqual({ client: true, getSession: true });
  expect(authPageErrors, "normal auth-enabled page errors").toEqual([]);
  await authContext.close();
});

for (const [id, route, englishRoute] of routes) {
  test(`${id}: native workflow, invalidation, responsive, themes, SEO and resources`, async ({ page }) => {
    const consoleErrors = [];
    const pageErrors = [];
    const failedRequests = [];
    const externalRequests = [];
    const requestEvidence = [];
    page.on("console", (message) => { if (message.type() === "error") consoleErrors.push(message.text()); });
    page.on("pageerror", (error) => pageErrors.push(error.message));
    page.on("requestfailed", (request) => failedRequests.push(`${request.method()} ${request.url()}`));
    page.on("request", (request) => {
      const url = new URL(request.url());
      requestEvidence.push(JSON.stringify({ method: request.method(), url: request.url(), body: request.postData() || "", headers: request.headers() }));
      if (!["127.0.0.1", "localhost"].includes(url.hostname)) externalRequests.push(`${request.method()} ${request.url()}`);
    });

    await page.goto(route, { waitUntil: "networkidle" });
    await expect(page.locator("html")).toHaveAttribute("lang", "sw");
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", `https://afrotools.com${route}`);
    await expect(page.locator('link[rel="alternate"][hreflang="en"]')).toHaveAttribute("href", `https://afrotools.com${englishRoute}`);
    await expect(page.locator('meta[property="og:url"]')).toHaveAttribute("content", `https://afrotools.com${route}`);
    const artwork = page.locator(".sw-hr-hero img");
    await expect(artwork).toBeVisible();
    expect(await artwork.evaluate((node) => ({ complete: node.complete, width: node.naturalWidth, height: node.naturalHeight }))).toEqual(expect.objectContaining({ complete: true, width: expect.any(Number), height: expect.any(Number) }));
    expect((await artwork.evaluate((node) => node.naturalWidth)) > 0).toBeTruthy();
    await expect(page.locator('[role="status"]')).toHaveAttribute("aria-live", "polite");
    await expect(page.locator('[role="alert"]')).toHaveAttribute("tabindex", "-1");

    await calculate(page);
    expect(page.url()).not.toContain("synthetic");
    const browserStores = await page.evaluate(async () => {
      const local = Object.keys(localStorage).map((key) => [key, localStorage.getItem(key)]);
      const session = Object.keys(sessionStorage).map((key) => [key, sessionStorage.getItem(key)]);
      const databases = indexedDB.databases ? await indexedDB.databases() : [];
      const cacheNames = "caches" in window ? await caches.keys() : [];
      const cacheRequests = [];
      for (const name of cacheNames) {
        const cache = await caches.open(name);
        cacheRequests.push(...(await cache.keys()).map((request) => request.url));
      }
      return { local, session, databases, cacheRequests };
    });
    expect(JSON.stringify(browserStores)).not.toContain("Kenya Ministry of Labour");
    expect(requestEvidence.join("\n")).not.toContain("Kenya Ministry of Labour");
    const contrastResults = [];
    for (const mode of [
      { name: "light", theme: "light" },
      { name: "dark", theme: "dark" },
      { name: "system-light", system: "light" },
      { name: "system-dark", system: "dark" }
    ]) {
      const computed = await auditComputedContrast(page, mode);
      const linkCues = await auditNonColorLinkCues(page, mode.name);
      contrastResults.push({ mode: mode.name, ...computed, linkCues });
    }
    console.log(`[sw-hr-contrast] ${id} ${JSON.stringify(contrastResults)}`);
    const firstNumber = page.locator('input[type="number"]').first();
    await firstNumber.fill("-1");
    await expect(page.locator("#sw-hr-result")).toBeHidden();
    await expect(page.locator('[data-sw-export="json"]')).toBeDisabled();
    await page.locator('#sw-hr-form button[type="submit"]').click();
    await expect(page.locator("#sw-hr-errors")).toBeVisible();
    await expect(page.locator("#sw-hr-errors")).toBeFocused();

    const themeBackgrounds = [];
    for (const theme of ["light", "dark"]) {
      await page.locator("html").evaluate((node, value) => node.setAttribute("data-theme", value), theme);
      const colors = await page.locator(".sw-hr-card").first().evaluate((node) => { const style = getComputedStyle(node); return [style.color, style.backgroundColor]; });
      expect(colors[0]).not.toBe(colors[1]);
      themeBackgrounds.push(colors[1]);
    }
    expect(themeBackgrounds[0]).not.toBe(themeBackgrounds[1]);
    const submit = page.locator('#sw-hr-form button[type="submit"]');
    await submit.focus();
    expect(await submit.evaluate((node) => getComputedStyle(node).outlineStyle)).not.toBe("none");
    await page.reload({ waitUntil: "networkidle" });
    await calculate(page);
    for (const width of [320, 375]) await assertTrue200PercentTextReflow(page, id, width);
    expect(consoleErrors).toEqual([]);
    expect(pageErrors).toEqual([]);
    expect(failedRequests).toEqual([]);
    expect(externalRequests).toEqual([]);
  });

  test(`${id}: copy and parsed TXT, JSON, PDF exports reopen`, async ({ page, context }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.goto(route, { waitUntil: "networkidle" });
    await calculate(page);
    const restored = restoredOutputs[id] || null;
    if (restored) await expect(page.locator("#sw-hr-result")).toContainText(restored.label);

    await page.locator('[data-sw-export="copy"]').click();
    await expect(page.locator("#sw-hr-status")).toContainText("umenakiliwa");
    const clipboard = await page.evaluate(() => navigator.clipboard.readText());
    expect(clipboard).toContain("Mamlaka: Kenya");
    if (restored) expect(clipboard).toContain(restored.label);

    const txtDownload = page.waitForEvent("download");
    await page.locator('[data-sw-export="txt"]').click();
    const txt = await txtDownload;
    const txtBody = fs.readFileSync(await txt.path(), "utf8");
    expect(txtBody).toContain("Chanzo: Kenya Ministry of Labour");
    expect(txtBody.toLowerCase()).toContain("makadirio");
    if (restored) expect(txtBody).toContain(restored.label);

    const jsonDownload = page.waitForEvent("download");
    await page.locator('[data-sw-export="json"]').click();
    const json = await jsonDownload;
    const parsed = JSON.parse(fs.readFileSync(await json.path(), "utf8"));
    expect(parsed).toEqual(expect.objectContaining({ locale: "sw", toolId: id }));
    expect(parsed.evidence.jurisdiction).toBe("Kenya");
    if (restored) {
      expect(parsed.result[restored.key]).toBeCloseTo(restoredEnglishOwnerValue(id, parsed.input), 10);
      expect(parsed.rows.some(([label, amount]) => label === restored.label && Math.abs(amount - parsed.result[restored.key]) < 1e-10)).toBe(true);
    }
    await page.reload({ waitUntil: "networkidle" });
    await page.locator("#sw-hr-import").setInputFiles(await json.path());
    await expect(page.locator("#sw-hr-result")).toBeVisible();
    await expect(page.locator("#sw-hr-status")).toContainText("imefunguliwa tena");
    if (restored) await expect(page.locator("#sw-hr-result")).toContainText(restored.label);

    const pdfDownload = page.waitForEvent("download");
    await page.locator('[data-sw-export="pdf"]').click();
    const pdfFile = await pdfDownload;
    const pdfBuffer = fs.readFileSync(await pdfFile.path());
    expect(pdfBuffer.subarray(0, 5).toString()).toBe("%PDF-");
    const parsedPdf = await pdf(pdfBuffer);
    expect(parsedPdf.numpages).toBeGreaterThanOrEqual(1);
    expect(parsedPdf.text).toContain("Mamlaka: Kenya");
    if (restored) expect(parsedPdf.text).toContain(restored.label);
  });
}

test("exact six plus Swahili HR hub: all visible text, real themes, keyboard flow and hub discovery", async ({ page }) => {
  const requestedRoute = process.env.SW_HR_ALL_VISIBLE_ROUTE || "";
  const allRoutes = routes.map(([id, route]) => [id, route]).concat([["hub", hubRoute]]).filter(([id]) => !requestedRoute || id === requestedRoute);
  const contrastReceipts = [];

  for (const [id, route] of allRoutes) {
    await page.emulateMedia({ colorScheme: "light" });
    await page.goto(route, { waitUntil: "networkidle" });
    if (id === "hub") await expect(page.locator("#tool-grid .htc")).toHaveCount(18);
    else await calculate(page);

    const nativeSurface = await page.evaluate(() => {
      const attributes = Array.from(document.querySelectorAll("[aria-label],[title],[placeholder]")).map((node) => [node.getAttribute("aria-label"), node.getAttribute("title"), node.getAttribute("placeholder")].filter(Boolean).join(" ")).join(" ");
      return `${document.body.innerText} ${attributes}`;
    });
    expect(nativeSurface, `${id}: visible or accessibility English residue`).not.toMatch(/\b(browser|server|data|export|filing)\b/i);

    await clickRealThemeControl(page, "light");
    contrastReceipts.push({ id, mode: "explicit-light", ...(await auditAllVisibleTextAndControls(page, `${id} explicit-light`)) });
    await clickRealThemeControl(page, "dark");
    contrastReceipts.push({ id, mode: "explicit-dark", ...(await auditAllVisibleTextAndControls(page, `${id} explicit-dark`)) });

    await useSystemTheme(page, "dark");
    if (id !== "hub") await calculate(page);
    contrastReceipts.push({ id, mode: "system-dark", ...(await auditAllVisibleTextAndControls(page, `${id} system-dark`)) });
    await useSystemTheme(page, "light");
    if (id !== "hub") await calculate(page);
    contrastReceipts.push({ id, mode: "system-light", ...(await auditAllVisibleTextAndControls(page, `${id} system-light`)) });

    if (id === "hub") {
      for (const [, swRoute] of routes) await expect(page.locator(`a[href="${swRoute}"]`).first()).toBeVisible();
      expect(await page.locator("main").innerText()).not.toMatch(/kanuni rasmi za kila nchi|matokeo sahihi zaidi|kila kiwango.+hutokana na sheria|makato yote muhimu.+huhesabiwa kwa usahihi/is);
      await page.locator("#hub-search").focus();
      await page.keyboard.press("Tab");
      expect(await page.evaluate(() => document.activeElement && document.activeElement.tagName)).toBe("BUTTON");
    } else {
      const flow = await page.locator("#sw-hr-form").evaluate((form) => Array.from(form.querySelectorAll("input:not([type=hidden]),select,textarea,button")).map((node) => node.name || node.id || node.type));
      await page.locator("#sw-hr-form input, #sw-hr-form select, #sw-hr-form textarea, #sw-hr-form button").first().focus();
      for (let index = 1; index < flow.length; index += 1) {
        let active = "";
        for (let tab = 0; tab < 5 && active !== flow[index]; tab += 1) {
          await page.keyboard.press("Tab");
          active = await page.evaluate(() => { const node = document.activeElement; return node && (node.name || node.id || node.type); });
        }
        expect(active, `${id}: keyboard position ${index + 1}`).toBe(flow[index]);
      }
    }

    for (const width of [320, 375]) await assertTrue200PercentTextReflow(page, id, width);
    await page.setViewportSize({ width: 1280, height: 720 });
  }
  console.log(`[sw-hr-all-visible-contrast] ${JSON.stringify(contrastReceipts.map(({ id, mode, minimumText, minimumBoundary, minimumFocus }) => ({ id, mode, minimumText, minimumBoundary, minimumFocus })))}`);
});
