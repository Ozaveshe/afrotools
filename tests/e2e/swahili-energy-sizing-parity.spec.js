const { test, expect } = require("@playwright/test");

const ROUTES = {
  solar: "/sw/zana/ukubwa-wa-mfumo-wa-solar/",
  battery: "/sw/zana/ukubwa-wa-betri-na-inverter/",
  backup: "/sw/zana/muda-wa-backup-ya-betri/"
};

const TAB_ORDER = {
  solar: [
    "#countrySelect",
    "[data-field=name][data-index='0']",
    "[data-field=watts][data-index='0']",
    "[data-field=hours][data-index='0']",
    "[data-field=qty][data-index='0']",
    "[data-remove='0']"
  ],
  battery: ["#countrySelect", "#loadWatts", "#backupHours", "#batteryType", "#systemVoltage", "#calcBtn"],
  backup: ["#batteryKWh", "#batteryAh", "#systemVoltage", "#loadWatts", "#batteryType", "#calcBtn"]
};

function captureAudit(page) {
  const evidence = {
    failures: [],
    apiCalls: [],
    analyticsCalls: [],
    resourceFailures: []
  };
  page.on("pageerror", (error) => evidence.failures.push(`pageerror:${error.message}`));
  page.on("console", (message) => {
    if (message.type() === "error") evidence.failures.push(`console:${message.text()}`);
  });
  page.on("request", (request) => {
    const url = request.url();
    if (["fetch", "xhr"].includes(request.resourceType()) || /\.netlify\/functions|\/api\//.test(url)) {
      evidence.apiCalls.push(url);
    }
    const isLocalAnalyticsLibrary = /\/assets\/js\/lib\/analytics\.js(?:\?|$)/.test(url);
    if (!isLocalAnalyticsLibrary && /analytics|googletagmanager|google-analytics|gtag|plausible|posthog/i.test(url)) {
      evidence.analyticsCalls.push(url);
    }
  });
  page.on("requestfailed", (request) => {
    evidence.resourceFailures.push(`${request.url()}:${request.failure()?.errorText || "failed"}`);
  });
  page.on("response", (response) => {
    if (response.status() >= 400) evidence.resourceFailures.push(`${response.url()}:${response.status()}`);
  });
  return evidence;
}

async function assertAuditClean(evidence) {
  expect(evidence.apiCalls).toEqual([]);
  expect(evidence.analyticsCalls).toEqual([]);
  expect(evidence.resourceFailures).toEqual([]);
  expect(evidence.failures).toEqual([]);
}

async function activeSelector(page) {
  return page.evaluate(() => {
    let active = document.activeElement;
    while (active && active.shadowRoot && active.shadowRoot.activeElement) {
      active = active.shadowRoot.activeElement;
    }
    if (!active) return "";
    if (active.id) return `#${active.id}`;
    if (active.dataset.field) return `[data-field=${active.dataset.field}][data-index='${active.dataset.index}']`;
    if (active.dataset.remove) return `[data-remove='${active.dataset.remove}']`;
    return active.tagName.toLowerCase();
  });
}

async function assertSequentialTabOrder(page, expected) {
  await page.evaluate(() => {
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
    window.scrollTo(0, 0);
  });
  let firstFound = false;
  for (let index = 0; index < 80; index += 1) {
    await page.keyboard.press("Tab");
    if (await activeSelector(page) === expected[0]) {
      firstFound = true;
      break;
    }
  }
  expect(firstFound, `Sequential Tab never reached ${expected[0]}`).toBe(true);
  for (const selector of expected.slice(1)) {
    await page.keyboard.press("Tab");
    expect(await activeSelector(page)).toBe(selector);
  }
}

function parseRgb(value) {
  const parts = String(value).match(/[\d.]+/g);
  if (!parts || parts.length < 3) throw new Error(`Unable to parse color: ${value}`);
  return parts.slice(0, 3).map(Number);
}

function relativeLuminance(value) {
  const channels = parseRgb(value).map((channel) => {
    const normalized = channel / 255;
    return normalized <= 0.04045
      ? normalized / 12.92
      : Math.pow((normalized + 0.055) / 1.055, 2.4);
  });
  return (0.2126 * channels[0]) + (0.7152 * channels[1]) + (0.0722 * channels[2]);
}

function contrastRatio(first, second) {
  const luminances = [relativeLuminance(first), relativeLuminance(second)].sort((a, b) => b - a);
  return (luminances[0] + 0.05) / (luminances[1] + 0.05);
}

async function computedFocusContrastEvidence(page) {
  return page.evaluate(() => {
    const active = document.activeElement;
    const focus = getComputedStyle(active);
    let ancestor = active.parentElement;
    let background = "rgba(0, 0, 0, 0)";
    while (ancestor) {
      background = getComputedStyle(ancestor).backgroundColor;
      if (!/rgba?\([^)]*,\s*0(?:\.0+)?\)$/.test(background) && background !== "rgba(0, 0, 0, 0)") break;
      ancestor = ancestor.parentElement;
    }
    return {
      outlineColor: focus.outlineColor,
      outlineStyle: focus.outlineStyle,
      outlineWidth: focus.outlineWidth,
      focusBackground: background
    };
  });
}

async function visibleTextContrastEvidence(page) {
  return page.evaluate(() => {
    const roots = [
      ".sw-source-panel",
      "#formStatus",
      "#results.on",
      ".sw-export-panel"
    ];
    const candidates = new Set();
    for (const selector of roots) {
      for (const root of document.querySelectorAll(selector)) {
        candidates.add(root);
        for (const descendant of root.querySelectorAll("*")) candidates.add(descendant);
      }
    }

    function alpha(color) {
      const parts = String(color).match(/[\d.]+/g);
      return parts && parts.length > 3 ? Number(parts[3]) : 1;
    }

    function effectiveBackground(element) {
      let current = element;
      while (current) {
        const color = getComputedStyle(current).backgroundColor;
        if (alpha(color) >= 0.99) return color;
        current = current.parentElement;
      }
      return "rgb(255, 255, 255)";
    }

    function hasVisibleText(element) {
      if (["BUTTON", "INPUT", "SELECT", "OPTION"].includes(element.tagName)) return false;
      if (element.tagName === "TEXTAREA") return Boolean(element.value.trim());
      return Array.from(element.childNodes).some((node) => node.nodeType === Node.TEXT_NODE && node.textContent.trim());
    }

    return Array.from(candidates).filter((element) => {
      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return hasVisibleText(element)
        && style.display !== "none"
        && style.visibility !== "hidden"
        && Number(style.opacity) > 0
        && rect.width > 0
        && rect.height > 0;
    }).map((element) => {
      const style = getComputedStyle(element);
      const id = element.id ? `#${element.id}` : "";
      const classes = Array.from(element.classList).map((name) => `.${name}`).join("");
      return {
        element: `${element.tagName.toLowerCase()}${id}${classes}`,
        text: (element.tagName === "TEXTAREA" ? element.value : element.textContent).trim().replace(/\s+/g, " ").slice(0, 100),
        color: style.color,
        background: effectiveBackground(element)
      };
    });
  });
}

async function assertAllVisibleTextContrast(page, label) {
  const evidence = await visibleTextContrastEvidence(page);
  expect(evidence.length, `${label}: no visible source/assumption/error/result text was measured`).toBeGreaterThan(0);
  const failures = evidence.map((sample) => ({
    ...sample,
    ratio: contrastRatio(sample.color, sample.background)
  })).filter((sample) => sample.ratio <= 4.5);
  expect(failures, `${label}: visible normal text must exceed 4.5:1`).toEqual([]);
}

async function assertVisibleTextContrastBothThemes(page, label) {
  await page.evaluate(() => document.documentElement.classList.remove("dark"));
  await page.waitForTimeout(250);
  await assertAllVisibleTextContrast(page, `${label}:light`);
  await page.evaluate(() => document.documentElement.classList.add("dark"));
  await page.waitForTimeout(250);
  await assertAllVisibleTextContrast(page, `${label}:dark`);
  await page.evaluate(() => document.documentElement.classList.remove("dark"));
  await page.waitForTimeout(250);
}

async function assertResponsiveThemesAndContrast(page, tabOrder) {
  for (const width of [320, 375]) {
    await page.setViewportSize({ width, height: 780 });
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
  }
  await page.setViewportSize({ width: 640, height: 800 });
  await page.evaluate(() => {
    document.documentElement.style.fontSize = "200%";
  });
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
  await page.evaluate(() => {
    document.documentElement.style.fontSize = "";
    document.documentElement.classList.remove("dark");
  });

  await assertSequentialTabOrder(page, tabOrder);
  const light = await computedFocusContrastEvidence(page);
  expect(light.outlineStyle).toBe("solid");
  expect(parseFloat(light.outlineWidth)).toBeGreaterThanOrEqual(3);
  expect(contrastRatio(light.outlineColor, light.focusBackground)).toBeGreaterThanOrEqual(3);
  await assertAllVisibleTextContrast(page, "initial:light");

  await page.evaluate(() => document.documentElement.classList.add("dark"));
  await page.waitForTimeout(250);
  const dark = await computedFocusContrastEvidence(page);
  expect(contrastRatio(dark.outlineColor, dark.focusBackground)).toBeGreaterThanOrEqual(3);
  await assertAllVisibleTextContrast(page, "initial:dark");
  await page.evaluate(() => document.documentElement.classList.remove("dark"));
  await page.waitForTimeout(250);
}

async function assertLocalOnlyStorage(page) {
  const state = await page.evaluate(async () => ({
    localKeys: Object.keys(localStorage).filter((key) => key !== "afrotools_cookie_consent"),
    sessionKeys: Object.keys(sessionStorage),
    indexedDbNames: typeof indexedDB.databases === "function"
      ? (await indexedDB.databases()).map((database) => database.name).filter(Boolean)
      : []
  }));
  expect(state).toEqual({ localKeys: [], sessionKeys: [], indexedDbNames: [] });
}

async function reopenClipboard(page) {
  await page.reload();
  const reopened = await page.evaluate(() => navigator.clipboard.readText());
  const lines = reopened.split(/\r?\n/);
  expect(lines.length).toBeGreaterThan(10);
  return { reopened, lines };
}

for (const [app, route] of Object.entries(ROUTES)) {
  test(`${app} native owner proves SEO, sources, sequential keyboard, reflow, themes, contrast, privacy, and resources`, async ({ page }) => {
    const evidence = captureAudit(page);
    await page.goto(route);
    await expect(page.locator("html")).toHaveAttribute("lang", "sw");
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", `https://afrotools.com${route}`);
    await expect(page.locator('link[rel="alternate"][hreflang="en"]')).toHaveCount(1);
    await expect(page.locator('link[rel="alternate"][hreflang="fr"]')).toHaveCount(1);
    await expect(page.locator('link[rel="alternate"][hreflang="sw"]')).toHaveCount(1);
    await expect(page.locator('link[rel="alternate"][hreflang="x-default"]')).toHaveCount(1);
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute("content", /assets\/img\/tools\/.+\.webp$/);
    const artworkUrl = await page.locator('meta[property="og:image"]').getAttribute("content");
    const artwork = await page.evaluate((url) => new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve({ width: image.naturalWidth, height: image.naturalHeight });
      image.onerror = () => reject(new Error(`Artwork failed to load: ${url}`));
      image.src = new URL(url).pathname;
    }), artworkUrl);
    expect(artwork).toEqual({ width: 800, height: 450 });
    await expect(page.locator('meta[property="og:image:width"]')).toHaveAttribute("content", String(artwork.width));
    await expect(page.locator('meta[property="og:image:height"]')).toHaveAttribute("content", String(artwork.height));
    await expect(page.locator("#formStatus")).toHaveAttribute("role", "alert");
    await expect(page.locator(".sw-source-links a[href^='https://']")).toHaveCount(app === "solar" ? 2 : 1);
    await assertResponsiveThemesAndContrast(page, TAB_ORDER[app]);
    await assertLocalOnlyStorage(page);
    await assertAuditClean(evidence);
  });
}

test("solar blocks native-invalid bounds, clears corrected errors, preserves oracle output, and reopens a localized sourced brief", async ({ page, context }) => {
  const evidence = captureAudit(page);
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto(ROUTES.solar);

  await page.locator("#calcBtn").click();
  await expect(page.locator("#rPanels")).toHaveText("1.1 kW");
  await expect(page.locator("#rBattery")).toContainText("6.2 kWh");
  await expect(page.locator("#rInvSpec")).toHaveText("0.5 kVA");

  const qty = page.locator("[data-field=qty]").first();
  await qty.fill("1.5");
  expect(await qty.evaluate((input) => input.validity.stepMismatch)).toBe(true);
  expect(await qty.evaluate((input) => input.checkValidity())).toBe(false);
  await page.locator("#calcBtn").click();
  await expect(page.locator("#formStatus")).toContainText("namba kamili");
  await expect(page.locator("#results")).not.toHaveClass(/on/);
  await expect(page.locator("#copyResult")).toBeDisabled();
  await assertVisibleTextContrastBothThemes(page, "solar quantity error");
  await qty.fill("1");
  await expect(page.locator("#formStatus")).toHaveText("");

  const hours = page.locator("[data-field=hours]").first();
  await hours.fill("25");
  expect(await hours.evaluate((input) => input.validity.rangeOverflow)).toBe(true);
  expect(await hours.evaluate((input) => input.checkValidity())).toBe(false);
  await page.locator("#calcBtn").click();
  await expect(page.locator("#formStatus")).toContainText("0.5 na 24");
  await expect(page.locator("#results")).not.toHaveClass(/on/);
  await assertVisibleTextContrastBothThemes(page, "solar hours error");
  await hours.fill("6");
  await expect(page.locator("#formStatus")).toHaveText("");

  await page.locator("[data-field=watts]").evaluateAll((nodes) => nodes.forEach((node) => {
    node.value = "0";
    node.dispatchEvent(new Event("input", { bubbles: true }));
  }));
  await page.locator("#calcBtn").click();
  await expect(page.locator("#formStatus")).toContainText("Ongeza angalau");
  await assertVisibleTextContrastBothThemes(page, "solar appliance error");
  await page.locator("[data-field=watts]").first().fill("9");
  await expect(page.locator("#formStatus")).toHaveText("");

  await page.reload();
  await page.locator("#countrySelect").selectOption("ZA");
  await page.locator("#calcBtn").click();
  await expect(page.locator("#briefOutput")).toContainText("Nchi: Afrika Kusini (ZA)");
  await expect(page.locator("#briefOutput")).not.toContainText("Nchi: South Africa");
  await expect(page.locator("#briefOutput")).toContainText("USD 300 kwa kW");
  await expect(page.locator("#briefOutput")).toContainText("USD 200 kwa kWh");
  await expect(page.locator("#briefOutput")).toContainText("USD 150 kwa kVA");
  await expect(page.locator("#briefOutput")).toContainText("Ufungaji: 20%");
  await expect(page.locator("#briefOutput")).toContainText("https://globalsolaratlas.info/map");
  await expect(page.locator("#briefOutput")).toContainText("https://data.worldbank.org/indicator/PA.NUS.FCRF");
  await assertVisibleTextContrastBothThemes(page, "solar results and export");
  await page.locator("#copyResult").click();
  const parsed = await reopenClipboard(page);
  expect(parsed.lines.find((line) => line.startsWith("Nchi:"))).toBe("Nchi: Afrika Kusini (ZA)");
  expect(parsed.lines.find((line) => line.startsWith("Paneli zinazopendekezwa:"))).toBeTruthy();
  await assertLocalOnlyStorage(page);
  await assertAuditClean(evidence);
});

test("battery clears corrected errors, preserves both chemistry oracles, and reopens a localized sourced comparison", async ({ page, context }) => {
  const evidence = captureAudit(page);
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto(ROUTES.battery);

  await page.locator("#loadWatts").fill("1500.5");
  expect(await page.locator("#loadWatts").evaluate((input) => input.validity.stepMismatch)).toBe(true);
  await page.locator("#calcBtn").click();
  await expect(page.locator("#formStatus")).toContainText("namba kamili");
  await assertVisibleTextContrastBothThemes(page, "battery integer error");
  await page.locator("#loadWatts").fill("1500");
  await expect(page.locator("#formStatus")).toHaveText("");

  await page.locator("#loadWatts").fill("0");
  await page.locator("#calcBtn").click();
  await expect(page.locator("#formStatus")).toContainText("mzigo");
  await assertVisibleTextContrastBothThemes(page, "battery load error");
  await page.locator("#loadWatts").fill("1500");
  await expect(page.locator("#formStatus")).toHaveText("");

  await page.locator("#backupHours").fill("8");
  await page.locator("#countrySelect").selectOption("ZA");
  await page.locator("#calcBtn").click();
  await expect(page.locator("#rUsable")).toHaveText("13.33 kWh");
  await expect(page.locator("#rTotal")).toHaveText("15.7 kWh");
  await expect(page.locator("#rInverter")).toHaveText("2 kVA");
  await expect(page.locator("#rBattCost")).toHaveText("$1,200");
  await expect(page.locator("#rTotalCost")).toHaveText("$1,560 / R28,860");
  await expect(page.locator("#leadCapacity")).toContainText("26.7 kWh");
  await expect(page.locator("#lithiumCost")).toHaveText("$1,560 / R28,860");
  await expect(page.locator("#leadCost")).toHaveText("$960 / R17,760");
  await expect(page.locator(".sw-cost-assumptions")).toContainText("USD 300 kwa kila betri ya mfano ya LiFePO4 ya 12 V/200 Ah");
  await expect(page.locator(".sw-cost-assumptions")).toContainText("USD 100 kwa kila betri ya mfano ya lead-acid ya 12 V/200 Ah");
  await expect(page.locator(".sw-cost-assumptions")).toContainText("USD 180 kwa kila kVA");
  await expect(page.locator(".sw-source-panel")).toContainText("nakala ya Machi 2026");
  await expect(page.locator(".sw-source-panel")).toContainText("makadirio ya kupanga pekee");
  await expect(page.locator(".sw-source-panel a[href='/tools/battery-sizing/']")).toHaveCount(1);
  await expect(page.locator("#briefOutput")).toContainText("USD 300 kwa kila betri ya mfano ya LiFePO4 ya 12 V/200 Ah");
  await expect(page.locator("#briefOutput")).toContainText("USD 100 kwa kila betri ya mfano ya lead-acid ya 12 V/200 Ah");
  await expect(page.locator("#briefOutput")).toContainText("USD 180 kwa kila kVA");
  await expect(page.locator("#briefOutput")).toContainText("nakala ya Machi 2026");
  await expect(page.locator("#briefOutput")).toContainText("makadirio ya kupanga pekee");
  await assertVisibleTextContrastBothThemes(page, "battery results, assumptions, and export");
  await page.locator("#copyResult").click();
  const parsed = await reopenClipboard(page);
  expect(parsed.reopened).toContain("ULINGANISHO WA KEMIA YA BETRI");
  expect(parsed.reopened).toContain("Nchi: Afrika Kusini (ZA)");
  expect(parsed.reopened).not.toContain("Nchi: South Africa");
  expect(parsed.reopened).toContain("https://data.worldbank.org/indicator/PA.NUS.FCRF");
  expect(parsed.reopened).toContain("USD 300 kwa kila betri ya mfano ya LiFePO4 ya 12 V/200 Ah");
  expect(parsed.reopened).toContain("USD 100 kwa kila betri ya mfano ya lead-acid ya 12 V/200 Ah");
  expect(parsed.reopened).toContain("USD 180 kwa kila kVA");
  expect(parsed.reopened).toContain("nakala ya Machi 2026");
  expect(parsed.reopened).toContain("makadirio ya kupanga pekee");
  expect(parsed.lines.some((line) => line === "LiFePO4")).toBe(true);
  expect(parsed.lines.some((line) => line === "LEAD-ACID AGM/GEL")).toBe(true);
  await assertLocalOnlyStorage(page);
  await assertAuditClean(evidence);
});

test("backup clears corrected errors, preserves runtime oracles, and reopens the parsed local plan", async ({ page, context }) => {
  const evidence = captureAudit(page);
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto(ROUTES.backup);

  await page.locator("#loadWatts").fill("800.5");
  expect(await page.locator("#loadWatts").evaluate((input) => input.validity.stepMismatch)).toBe(true);
  await page.locator("#calcBtn").click();
  await expect(page.locator("#formStatus")).toContainText("namba kamili");
  await assertVisibleTextContrastBothThemes(page, "backup integer error");
  await page.locator("#loadWatts").fill("800");
  await expect(page.locator("#formStatus")).toHaveText("");

  await page.locator("#batteryKWh").fill("0");
  await page.locator("#batteryAh").fill("0");
  await page.locator("#calcBtn").click();
  await expect(page.locator("#formStatus")).toContainText("uwezo wa betri");
  await assertVisibleTextContrastBothThemes(page, "backup capacity error");
  await page.locator("#batteryKWh").fill("5.12");
  await expect(page.locator("#formStatus")).toHaveText("");

  await page.locator("#calcBtn").click();
  await expect(page.locator("#rHours")).toHaveText("4.9 saa");
  await expect(page.locator("#rCritical")).toContainText("12.2 saa");
  await expect(page.locator("#runtimeBody tr")).toHaveCount(5);
  await expect(page.locator("#runtimeBody tr").first()).toContainText("800 W");
  await expect(page.locator("#runtimeBody tr").last()).toContainText("200 W");
  await assertVisibleTextContrastBothThemes(page, "backup results and export");
  await page.locator("#copyResult").click();
  const parsed = await reopenClipboard(page);
  expect(parsed.reopened).toContain("MPANGO WA MUDA WA AKIBA");
  expect(parsed.reopened).toContain("Mzigo wa kuanzia: 800 W");
  expect(parsed.reopened).toContain("https://www.victronenergy.com/media/pg/The_Wiring_Unlimited_book/en/index-en.html");
  expect(parsed.lines.filter((line) => /^\d+\./.test(line))).toHaveLength(5);
  await assertLocalOnlyStorage(page);
  await assertAuditClean(evidence);
});
