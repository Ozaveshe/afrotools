const { test, expect } = require("@playwright/test");
const fs = require("fs");
const path = require("path");
const pdfParse = require("pdf-parse");

const ROOT = path.resolve(__dirname, "../..");
const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || `http://127.0.0.1:${Number(process.env.PORT || 4173)}`;
const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, "data/localization/fr-hr-payroll-parity.json"), "utf8"));
const fieldContracts = JSON.parse(fs.readFileSync(path.join(ROOT, "data/localization/fr-hr-payroll-field-contracts.json"), "utf8"));
const TODAY = new Date().toISOString().slice(0, 10);
const PRIVATE_JURISDICTION = "Juridiction privee 8731";
const PRIVATE_SOURCE = "Source officielle synthetique 8731";
const PRIVATE_PATTERN = /Juridiction privee 8731|Source officielle synthetique 8731|Scenario prive synthetique 8731|Complement employeur a confirmer 8731/i;

const FIXTURES = {
  "contractor-vs-employee": {
    input: { employeeBase: 1000, employeeAddons: 200, employeeOther: 50, contractorQuote: 1400, contractorOther: 0 },
    key: "difference", value: 150, pdfNeedle: "TST 150.00"
  },
  "domestic-worker": {
    input: {
      country: "senegal", role: "nanny", basePay: 300, payPeriod: "weekly", legalFloor: 250,
      floorPeriod: "weekly", hoursPerWeek: 40, daysPerWeek: 5, overtimeHours: 10,
      overtimeMultiplier: 1.5, allowances: 50, inKind: 30, employerPct: 5, leavePct: 4,
      adminCost: 20, annualBonus: 600, setupCost: 120, retentionBuffer: 10,
      contractStatus: "draft", payRecord: "yes", restDays: "partial",
      notes: "Scenario prive synthetique 8731"
    },
    key: "monthlyCost", value: 1704.125, pdfNeedle: "TST 1704.13",
    workflowNeedles: ["Sénégal", "Garde d'enfants", "Plan avec marge de fidélisation", "Scenario prive synthetique 8731"]
  },
  "employee-cost": {
    input: { salary: 1000, obligations: 100, benefits: 50, allowances: 100, other: 50, oneOff: 0, allocationMonths: 12 },
    key: "recurring", value: 1300, pdfNeedle: "TST 1300.00"
  },
  "gratuity-calculator": {
    input: { monthlyPay: 3000, years: 5, months: 6, daysPerYear: 15, divisor: 30, additions: 500, deductions: 250 },
    key: "net", value: 8500, pdfNeedle: "TST 8500.00"
  },
  "maternity-leave": {
    input: {
      country: "/tools/maternity-leave/senegal/", leaveType: "both",
      compareCountry: "/tools/maternity-leave/cote-divoire/",
      leaveNotes: "Complement employeur a confirmer 8731",
      monthlySalary: 3043.75, startDate: "2026-08-01", officialDays: 90, requestedDays: 100,
      officialRate: 80, companyDays: 112, companyRate: 100
    },
    key: "requestedValue", value: 8000, pdfNeedle: "TST 8000.00",
    workflowNeedles: ["Comparer les deux", "Côte d’Ivoire", "Complement employeur a confirmer 8731"]
  },
  "retrenchment-calculator": {
    input: {
      monthlyPay: 7800, years: 7, months: 4, weeksPerYear: 1, noticeMonths: 1,
      leaveDays: 10, divisor: 39, other: 1000, deductions: 500
    },
    key: "net", value: 23500, pdfNeedle: "TST 23500.00"
  }
};

async function waitForComponents(page) {
  await page.waitForFunction(() => {
    const navbar = document.querySelector("afro-navbar");
    const footer = document.querySelector("afro-footer");
    return navbar && navbar.shadowRoot && navbar.hasAttribute("data-styles-ready") && footer && footer.shadowRoot;
  });
}

async function setField(page, name, value) {
  const field = page.locator(`[name="${name}"]`);
  await expect(field, name).toHaveCount(1);
  const tag = await field.evaluate((node) => node.tagName);
  if (tag === "SELECT") await field.selectOption(String(value));
  else await field.fill(String(value));
}

async function prepare(page, tool, options = {}) {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  const response = await page.goto(tool.route);
  expect(response.status(), tool.id).toBe(200);
  await waitForComponents(page);
  await page.waitForLoadState("networkidle");
  await setField(page, "jurisdiction", PRIVATE_JURISDICTION);
  await setField(page, "currency", "TST");
  for (const [name, value] of Object.entries(FIXTURES[tool.id].input)) await setField(page, name, value);
  await setField(page, "sourceLabel", PRIVATE_SOURCE);
  await setField(page, "sourceDate", TODAY);
  if (options.calculate !== false) {
    await page.getByRole("button", { name: "Calculer l'estimation" }).click();
    await expect(page.locator("#fr-hr-payroll-result")).toBeVisible();
  }
  return errors;
}

async function scanVisibleGeometry(page, label) {
  const result = await page.evaluate(() => {
    const viewportWidth = document.documentElement.clientWidth;
    const offenders = [];
    const roots = [{ root: document, prefix: "document" }];
    const seenRoots = new Set();
    function selector(node) {
      if (node.id) return "#" + node.id;
      const classes = Array.from(node.classList || []).slice(0, 2).join(".");
      return node.localName + (classes ? "." + classes : "");
    }
    function visible(node) {
      if (!(node instanceof Element) || node.hidden) return false;
      const style = getComputedStyle(node);
      if (style.display === "none" || style.visibility === "hidden" || Number(style.opacity) === 0) return false;
      const rect = node.getBoundingClientRect();
      return rect.width > 0.5 && rect.height > 0.5;
    }
    while (roots.length) {
      const entry = roots.shift();
      if (seenRoots.has(entry.root)) continue;
      seenRoots.add(entry.root);
      const elements = Array.from(entry.root.querySelectorAll("*"));
      for (const node of elements) {
        if (node.shadowRoot) roots.push({ root: node.shadowRoot, prefix: entry.prefix + " > " + selector(node) + "::shadow" });
        if (!visible(node)) continue;
        const rect = node.getBoundingClientRect();
        if (rect.left < -1 || rect.right > viewportWidth + 1 || rect.width > viewportWidth + 1) {
          offenders.push({
            selector: entry.prefix + " > " + selector(node),
            left: Number(rect.left.toFixed(1)),
            right: Number(rect.right.toFixed(1)),
            width: Number(rect.width.toFixed(1))
          });
        }
        Array.from(node.childNodes).filter((child) =>
          child.nodeType === Node.TEXT_NODE && child.textContent.trim()
        ).forEach((textNode, textIndex) => {
          const range = document.createRange();
          range.selectNodeContents(textNode);
          Array.from(range.getClientRects()).forEach((textRect, lineIndex) => {
            if (textRect.width > 0.5 && (
              textRect.left < -1 || textRect.right > viewportWidth + 1 || textRect.width > viewportWidth + 1
            )) {
              offenders.push({
                selector: entry.prefix + " > " + selector(node) + `::text(${textIndex},${lineIndex})`,
                left: Number(textRect.left.toFixed(1)),
                right: Number(textRect.right.toFixed(1)),
                width: Number(textRect.width.toFixed(1))
              });
            }
          });
        });
      }
    }
    return {
      viewportWidth,
      rootFontSize: getComputedStyle(document.documentElement).fontSize,
      documentScrollWidth: document.documentElement.scrollWidth,
      offenders: offenders.slice(0, 40)
    };
  });
  expect(result.documentScrollWidth, `${label}: document scroll ${JSON.stringify(result)}`).toBeLessThanOrEqual(result.viewportWidth + 1);
  expect(result.offenders, `${label}: visible light/open-shadow geometry`).toEqual([]);
  return result;
}

function attachPrivacyAudit(context) {
  const audit = { requests: [], responses: [], console: [], pageErrors: [] };
  const auditedPages = new WeakSet();
  const attachPage = (page) => {
    if (auditedPages.has(page)) return;
    auditedPages.add(page);
    page.on("console", (message) => {
      audit.console.push({ type: message.type(), text: message.text() });
    });
    page.on("pageerror", (error) => audit.pageErrors.push(error.message));
  };
  context.on("page", attachPage);
  for (const page of context.pages()) attachPage(page);
  context.on("request", (request) => {
    const url = new URL(request.url());
    audit.requests.push({
      method: request.method(),
      url: url.href,
      query: url.search,
      hash: url.hash,
      body: request.postData() || "",
      headers: request.headers()
    });
  });
  context.on("response", (response) => {
    const url = new URL(response.url());
    audit.responses.push({
      url: url.href,
      query: url.search,
      hash: url.hash,
      status: response.status(),
      headers: response.headers()
    });
  });
  return audit;
}

async function capturePrivacyState(page) {
  return page.evaluate(async () => {
    const storageEntries = (storage) => Array.from({ length: storage.length }, (_, index) => {
      const key = storage.key(index);
      return [key, storage.getItem(key)];
    });
    const indexedDb = [];
    if (indexedDB.databases) {
      for (const databaseInfo of await indexedDB.databases()) {
        if (!databaseInfo.name) continue;
        const database = await new Promise((resolve, reject) => {
          const request = indexedDB.open(databaseInfo.name);
          request.onerror = () => reject(request.error);
          request.onsuccess = () => resolve(request.result);
        });
        const stores = {};
        for (const storeName of Array.from(database.objectStoreNames)) {
          stores[storeName] = await new Promise((resolve, reject) => {
            const transaction = database.transaction(storeName, "readonly");
            const request = transaction.objectStore(storeName).getAll();
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);
          });
        }
        indexedDb.push({ name: databaseInfo.name, version: databaseInfo.version, stores });
        database.close();
      }
    }
    const cacheStorage = [];
    if ("caches" in window) {
      for (const cacheName of await caches.keys()) {
        const cache = await caches.open(cacheName);
        const entries = [];
        for (const request of await cache.keys()) {
          const response = await cache.match(request);
          entries.push({
            request: { method: request.method, url: request.url, headers: Array.from(request.headers.entries()) },
            response: response ? { status: response.status, headers: Array.from(response.headers.entries()) } : null
          });
        }
        cacheStorage.push({ name: cacheName, entries });
      }
    }
    return {
      location: { href: location.href, search: location.search, hash: location.hash },
      cookie: document.cookie,
      localStorage: storageEntries(localStorage),
      sessionStorage: storageEntries(sessionStorage),
      indexedDb,
      cacheStorage
    };
  });
}

function expectPrivacyClean(label, audits, states) {
  const payload = JSON.stringify({ audits, states });
  let decoded = payload;
  for (let index = 0; index < 3; index += 1) {
    try {
      const next = decodeURIComponent(decoded);
      if (next === decoded) break;
      decoded = next;
    } catch (_) {
      break;
    }
  }
  expect(PRIVATE_PATTERN.test(decoded), `${label}: no private fixture in method/URL/query/hash/body/header/storage/console`).toBe(false);
  expect(
    audits.flatMap((audit) => audit.requests).filter((request) =>
      !["GET", "HEAD"].includes(request.method)
      || request.body
      || /\/(?:api|\.netlify\/functions)\//i.test(request.url)
      || /ai-advisor/i.test(request.url)
    ),
    `${label}: every captured request method and body remains local/read-only`
  ).toEqual([]);
  expect(
    states.filter((state) => state.location.search || state.location.hash),
    `${label}: route query and hash remain empty`
  ).toEqual([]);
  expect(audits.flatMap((audit) => audit.pageErrors), `${label}: page errors`).toEqual([]);
  expect(
    audits.flatMap((audit) => audit.console).filter((entry) => entry.type === "error"),
    `${label}: console errors`
  ).toEqual([]);
}

async function scanVisibleContrast(page, label) {
  const result = await page.evaluate(() => {
    const roots = [{ root: document, prefix: "document" }];
    const seenRoots = new Set();
    const samples = [];
    const footerCtas = [];
    function selector(node) {
      if (node.id) return "#" + node.id;
      const classes = Array.from(node.classList || []).slice(0, 2).join(".");
      return node.localName + (classes ? "." + classes : "");
    }
    function visible(node) {
      if (!(node instanceof Element) || node.hidden || node.matches(":disabled")) return false;
      const style = getComputedStyle(node);
      if (style.display === "none" || style.visibility === "hidden" || Number(style.opacity) === 0) return false;
      const rect = node.getBoundingClientRect();
      return rect.width > 0.5 && rect.height > 0.5;
    }
    function rgba(value) {
      const parts = String(value).match(/[\d.]+/g);
      if (!parts || parts.length < 3) return { r: 0, g: 0, b: 0, a: 0 };
      return {
        r: Number(parts[0]),
        g: Number(parts[1]),
        b: Number(parts[2]),
        a: parts.length > 3 ? Number(parts[3]) : 1
      };
    }
    function blend(top, bottom) {
      const alpha = top.a + bottom.a * (1 - top.a);
      if (!alpha) return { r: 255, g: 255, b: 255, a: 1 };
      return {
        r: (top.r * top.a + bottom.r * bottom.a * (1 - top.a)) / alpha,
        g: (top.g * top.a + bottom.g * bottom.a * (1 - top.a)) / alpha,
        b: (top.b * top.a + bottom.b * bottom.a * (1 - top.a)) / alpha,
        a: alpha
      };
    }
    function composedParent(node) {
      if (node.parentElement) return node.parentElement;
      const root = node.getRootNode();
      return root instanceof ShadowRoot ? root.host : null;
    }
    function background(node) {
      const layers = [];
      for (let current = node; current; current = composedParent(current)) {
        layers.push(rgba(getComputedStyle(current).backgroundColor));
      }
      let result = { r: 255, g: 255, b: 255, a: 1 };
      for (const layer of layers.reverse()) result = blend(layer, result);
      return result;
    }
    function luminance(color) {
      return [color.r, color.g, color.b].map((channel) => channel / 255).map((channel) =>
        channel <= 0.03928 ? channel / 12.92 : Math.pow((channel + 0.055) / 1.055, 2.4)
      ).reduce((sum, channel, index) => sum + channel * [0.2126, 0.7152, 0.0722][index], 0);
    }
    function contrast(foreground, backgroundColor) {
      const one = luminance(foreground), two = luminance(backgroundColor);
      return (Math.max(one, two) + 0.05) / (Math.min(one, two) + 0.05);
    }
    function colorString(color) {
      return `rgb(${Math.round(color.r)}, ${Math.round(color.g)}, ${Math.round(color.b)})`;
    }
    while (roots.length) {
      const entry = roots.shift();
      if (seenRoots.has(entry.root)) continue;
      seenRoots.add(entry.root);
      for (const node of Array.from(entry.root.querySelectorAll("*"))) {
        if (node.shadowRoot) roots.push({ root: node.shadowRoot, prefix: entry.prefix + " > " + selector(node) + "::shadow" });
        if (!visible(node)) continue;
        const directText = Array.from(node.childNodes)
          .filter((child) => child.nodeType === Node.TEXT_NODE)
          .map((child) => child.textContent.trim())
          .filter(Boolean)
          .join(" ");
        const isControl = node.matches("input:not([type=hidden]), textarea, select");
        const sampleText = directText
          || (node.matches("input, textarea") ? node.value || node.getAttribute("placeholder") || "" : "")
          || (node.matches("select") ? node.selectedOptions[0]?.textContent.trim() || "" : "");
        if (!sampleText && !node.matches("afro-footer")) continue;
        if (node.closest(".logo") || (sampleText && !/[\p{L}\p{N}]/u.test(sampleText))) continue;
        const style = getComputedStyle(node);
        const backgroundColor = background(node);
        const foreground = blend(rgba(style.color), backgroundColor);
        const ratio = contrast(foreground, backgroundColor);
        const fontSize = Number.parseFloat(style.fontSize);
        const fontWeight = Number.parseInt(style.fontWeight, 10) || 400;
        const threshold = fontSize >= 24 || (fontSize >= 18.66 && fontWeight >= 700) ? 3 : 4.5;
        const record = {
          selector: entry.prefix + " > " + selector(node),
          text: sampleText.slice(0, 80),
          foreground: colorString(foreground),
          background: colorString(backgroundColor),
          ratio: Number(ratio.toFixed(2)),
          threshold,
          fontSize,
          fontWeight
        };
        if (sampleText && ratio + 0.01 < threshold) samples.push(record);
        if (node.matches(".nl-btn")) footerCtas.push(record);
      }
    }
    return {
      theme: document.documentElement.dataset.theme,
      themeChoice: document.documentElement.dataset.themeChoice,
      prefersDark: matchMedia("(prefers-color-scheme: dark)").matches,
      offenders: samples,
      footerCtas
    };
  });
  expect(result.offenders, `${label}: all visible light/open-shadow text meets WCAG contrast`).toEqual([]);
  expect(result.footerCtas, `${label}: visible footer CTA found`).toHaveLength(1);
  expect(result.footerCtas[0].foreground, `${label}: footer CTA foreground`).toBe("rgb(255, 255, 255)");
  expect(result.footerCtas[0].background, `${label}: footer CTA background`).toBe("rgb(0, 98, 204)");
  expect(result.footerCtas[0].ratio, `${label}: footer CTA contrast`).toBeGreaterThanOrEqual(4.5);
  return result;
}

async function assertArtworkAndOg(page, selector) {
  const images = await page.locator(selector).evaluateAll((nodes) => nodes.map((image) => {
    const rect = image.getBoundingClientRect();
    return {
      currentSrc: image.currentSrc,
      naturalWidth: image.naturalWidth,
      naturalHeight: image.naturalHeight,
      renderedWidth: rect.width,
      renderedHeight: rect.height,
      ratio: rect.width / rect.height
    };
  }));
  expect(images.length).toBeGreaterThan(0);
  for (const image of images) {
    expect(image.currentSrc).toMatch(/\/assets\/img\/tools\/[^/?]+\.webp/);
    expect(image.naturalWidth).toBeGreaterThan(0);
    expect(image.naturalHeight).toBeGreaterThan(0);
    expect(image.renderedWidth).toBeGreaterThan(0);
    expect(image.renderedHeight).toBeGreaterThan(0);
    expect(image.ratio).toBeCloseTo(16 / 9, 2);
  }
  const ogUrl = await page.locator('meta[property="og:image"]').getAttribute("content");
  expect(ogUrl).toBeTruthy();
  const ogPath = new URL(ogUrl).pathname;
  const response = await page.request.get(ogPath);
  expect(response.status()).toBe(200);
  expect(response.headers()["content-type"]).toMatch(/^image\//);
}

test.describe("French HR & Payroll parity 6/6", () => {
  test.describe.configure({ mode: "serial" });

  test("server identity is the isolated HR/Payroll worktree", async ({ page }) => {
    const response = await page.goto("/fr/tools/contractant-vs-salarie/");
    expect(response.status()).toBe(200);
    const html = await page.content();
    expect(html).toContain("Generated by scripts/build-french-hr-payroll-parity.js from data/localization/fr-hr-payroll-parity.json.");
    expect(html).toContain("Prestataire ou salarié : comparer le coût");
  });

  test("all six rendered French control contracts match their actual English owners field for field", async ({ page }) => {
    test.setTimeout(180000);
    const attributeNames = fieldContracts.attributes.filter((attribute) => attribute !== "required");
    async function snapshot(controls, french) {
      return page.evaluate(({ controls, french, attributeNames }) => controls.map((contract) => {
        const locator = french
          ? `[name="${contract.french}"]`
          : `[${contract.english.by}="${contract.english.value}"]`;
        const node = document.querySelector(locator);
        if (!node) return { french: contract.french, missing: true };
        const attributes = {};
        attributeNames.forEach((attribute) => { attributes[attribute] = node.getAttribute(attribute); });
        return {
          french: contract.french,
          element: node.localName,
          required: node.hasAttribute("required"),
          attributes,
          label: node.labels && node.labels[0] ? node.labels[0].textContent.trim() : "",
          options: node.localName === "select" ? Array.from(node.options).map((option) => option.value) : null,
          selected: node.localName === "select" ? node.value : null
        };
      }), { controls, french, attributeNames });
    }
    for (const toolContract of fieldContracts.tools) {
      const mapped = toolContract.controls.filter((contract) => !contract.extension);
      await page.goto("/" + toolContract.englishOwner.replace(/\/index\.html$/, "/"));
      if (mapped.some((contract) => contract.options === "country-cards")) {
        await expect(page.locator("#countrySelect option")).toHaveCount(54);
        await expect(page.locator("#compareCountry option")).toHaveCount(54);
      }
      const english = await snapshot(mapped, false);
      expect(english.filter((control) => control.missing), `${toolContract.id} English controls`).toEqual([]);

      const tool = manifest.tools.find((entry) => entry.id === toolContract.id);
      await page.goto(tool.route);
      const french = await snapshot(toolContract.controls, true);
      expect(french.filter((control) => control.missing), `${toolContract.id} French controls`).toEqual([]);
      for (const contract of toolContract.controls) {
        const actual = french.find((control) => control.french === contract.french);
        expect(actual.label, `${toolContract.id}/${contract.french} label`).not.toBe("");
        expect(actual.element, `${toolContract.id}/${contract.french} element`).toBe(contract.element);
        expect(actual.required, `${toolContract.id}/${contract.french} required`).toBe(Boolean(contract.required));
        for (const attribute of attributeNames) {
          const expected = Object.prototype.hasOwnProperty.call(contract, attribute) ? String(contract[attribute]) : null;
          expect(actual.attributes[attribute], `${toolContract.id}/${contract.french} ${attribute}`).toBe(expected);
        }
        if (contract.extension) continue;
        const owner = english.find((control) => control.french === contract.french);
        expect(actual.element, `${toolContract.id}/${contract.french} owner element`).toBe(owner.element);
        expect(actual.required, `${toolContract.id}/${contract.french} owner required`).toBe(owner.required);
        expect(actual.attributes, `${toolContract.id}/${contract.french} owner attributes`).toEqual(owner.attributes);
        if (contract.options) {
          expect(actual.options, `${toolContract.id}/${contract.french} selector values`).toEqual(owner.options);
          expect(actual.selected, `${toolContract.id}/${contract.french} selector default`).toBe(owner.selected);
        }
      }
    }
  });

  test("English domestic and parental owners match the expanded French workflow contracts", async ({ page }) => {
    await page.goto("/tools/domestic-worker/");
    for (const name of [
      "country", "role", "legalFloor", "floorPeriod", "retentionBuffer", "contractStatus",
      "payRecord", "restDays", "notes"
    ]) await expect(page.locator(`[name="${name}"]`), `English domestic ${name}`).toHaveCount(1);
    await expect(page.locator('[name="overtimeHours"]')).toHaveAttribute("max", "160");
    await expect(page.locator('[name="employerContribution"]')).toHaveAttribute("max", "40");
    await expect(page.locator('[name="leaveReserve"]')).toHaveAttribute("max", "30");
    const englishDomestic = {
      ...FIXTURES["domestic-worker"].input,
      inKindValue: FIXTURES["domestic-worker"].input.inKind,
      employerContribution: FIXTURES["domestic-worker"].input.employerPct,
      leaveReserve: FIXTURES["domestic-worker"].input.leavePct,
      currency: "TST", sourceLabel: PRIVATE_SOURCE, sourceDate: TODAY
    };
    delete englishDomestic.inKind;
    delete englishDomestic.employerPct;
    delete englishDomestic.leavePct;
    for (const [name, value] of Object.entries(englishDomestic)) await setField(page, name, value);
    await page.getByRole("button", { name: "Calculate salary plan" }).click();
    await expect(page.locator("#monthlyCost")).toContainText("1,704");
    await expect(page.locator("#readinessScore")).toContainText("87");
    await expect(page.locator("#scenarioRows")).toContainText("retention buffer");

    await page.goto("/fr/tools/salaire-employe-maison/");
    await prepare(page, manifest.tools.find((tool) => tool.id === "domestic-worker"));
    await expect(page.locator("#fr-hr-payroll-workflow")).toContainText("Plan avec marge de fidélisation");
    await expect(page.locator("#fr-hr-payroll-workflow")).toContainText("Scenario prive synthetique 8731");

    await page.goto("/tools/maternity-leave/");
    for (const id of ["countrySelect", "leaveType", "compareCountry", "leaveNotes"]) {
      await expect(page.locator("#" + id), `English leave ${id}`).toHaveCount(1);
    }
    await page.locator("#leaveType").selectOption("both");
    await page.locator("#monthlySalary").fill("3043.75");
    await page.locator("#currencyLabel").fill("TST");
    await page.locator("#startDate").fill("2026-08-01");
    await page.locator("#plannedDays").fill("90");
    await page.locator("#requestedDays").fill("100");
    await page.locator("#payRate").fill("80");
    await page.locator("#companyDays").fill("112");
    await page.locator("#companyRate").fill("100");
    await page.locator("#leaveSource").fill(PRIVATE_SOURCE);
    await page.locator("#leaveSourceDate").fill(TODAY);
    await page.locator("#leaveNotes").fill("Complement employeur a confirmer 8731");
    await page.locator("#calculateLeave").click();
    await expect(page.locator("#leaveResults")).toContainText("TST 8,000.00");
    await expect(page.locator("#leaveResults")).toContainText("Compare both");

    await page.goto("/fr/tools/conge-maternite-paternite/");
    await prepare(page, manifest.tools.find((tool) => tool.id === "maternity-leave"));
    await expect(page.locator("#fr-hr-payroll-workflow")).toContainText("Comparer les deux");
    await expect(page.locator("#fr-hr-payroll-workflow")).toContainText("Complement employeur a confirmer 8731");
  });

  for (const tool of manifest.tools) {
    test(`${tool.id}: varied result, invalid focus/reset, JSON reopen, exact TXT and parsed PDF`, async ({ page }) => {
      const requestsFromNavigation = [];
      page.on("request", (request) => {
        requestsFromNavigation.push({
          method: request.method(), url: request.url(), postData: request.postData() || ""
        });
      });
      const errors = await prepare(page, tool, { calculate: false });
      await page.getByRole("button", { name: "Calculer l'estimation" }).click();
      await expect(page.locator("#fr-hr-payroll-result")).toBeVisible();
      await expect(page.locator("#fr-hr-payroll-result-body tr")).not.toHaveCount(0);
      await expect(page.locator("#fr-hr-payroll-source-used")).toContainText(PRIVATE_SOURCE);
      if (FIXTURES[tool.id].workflowNeedles) {
        await expect(page.locator("#fr-hr-payroll-workflow")).toBeVisible();
        for (const needle of FIXTURES[tool.id].workflowNeedles) {
          await expect(page.locator("#fr-hr-payroll-workflow")).toContainText(needle);
        }
      }

      const jsonDownloadPromise = page.waitForEvent("download");
      await page.getByRole("button", { name: "Enregistrer JSON" }).click();
      const jsonPath = await (await jsonDownloadPromise).path();
      const saved = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
      expect(saved.toolId).toBe(tool.id);
      expect(saved.input.jurisdiction).toBe(PRIVATE_JURISDICTION);
      expect(saved.result[FIXTURES[tool.id].key]).toBeCloseTo(FIXTURES[tool.id].value, 8);
      if (FIXTURES[tool.id].workflowNeedles) expect(saved.workflow).toBeTruthy();

      await page.locator('[name="jurisdiction"]').fill("");
      await expect(page.locator("#fr-hr-payroll-result")).toBeHidden();
      await expect(page.locator('[data-export="pdf"]')).toBeDisabled();
      await page.getByRole("button", { name: "Calculer l'estimation" }).click();
      await expect(page.locator("#fr-hr-payroll-errors")).toBeVisible();
      await expect(page.locator("#fr-hr-payroll-errors")).toContainText("juridiction");
      await expect(page.locator("#fr-hr-payroll-errors")).toBeFocused();

      await page.locator("#fr-hr-payroll-reset").click();
      await expect(page.locator("#fr-hr-payroll-result")).toBeHidden();
      await expect(page.locator("#fr-hr-payroll-errors")).toBeHidden();
      await expect(page.locator('[name="jurisdiction"]')).toHaveValue("");
      await expect(page.locator("#fr-hr-payroll-status")).toContainText("réinitialisé");

      await page.locator("#fr-hr-payroll-import").setInputFiles({
        name: "scenario.json",
        mimeType: "application/json",
        buffer: Buffer.from(JSON.stringify(saved))
      });
      await expect(page.locator("#fr-hr-payroll-result")).toBeVisible();
      await expect(page.locator("#fr-hr-payroll-status")).toContainText("rouvert");

      const txtDownloadPromise = page.waitForEvent("download");
      await page.getByRole("button", { name: "Télécharger TXT" }).click();
      const txt = fs.readFileSync(await (await txtDownloadPromise).path(), "utf8");
      expect(txt).toContain(PRIVATE_SOURCE);
      expect(txt).toContain(FIXTURES[tool.id].pdfNeedle);
      for (const needle of FIXTURES[tool.id].workflowNeedles || []) expect(txt).toContain(needle);

      const pdfDownloadPromise = page.waitForEvent("download");
      await page.getByRole("button", { name: "Télécharger PDF" }).click();
      const pdf = fs.readFileSync(await (await pdfDownloadPromise).path());
      expect(pdf.subarray(0, 5).toString()).toBe("%PDF-");
      const reopenedPdf = await pdfParse(pdf);
      expect(reopenedPdf.numpages).toBeGreaterThan(0);
      expect(reopenedPdf.text).toContain(PRIVATE_SOURCE);
      expect(reopenedPdf.text).toContain(FIXTURES[tool.id].pdfNeedle);
      for (const needle of FIXTURES[tool.id].workflowNeedles || []) {
        expect(reopenedPdf.text).toContain(
          needle.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[’]/g, "'")
        );
      }

      const privacyFailures = requestsFromNavigation.filter((request) => {
        const raw = request.url + "\n" + request.postData;
        let decoded = raw;
        try { decoded = decodeURIComponent(raw); } catch (_) {}
        return /Juridiction privee 8731|Source officielle synthetique 8731|Scenario prive synthetique 8731|Complement employeur a confirmer 8731/i.test(decoded)
          || !["GET", "HEAD"].includes(request.method)
          || /\/(?:api|\.netlify\/functions)\//i.test(request.url)
          || /ai-advisor/i.test(request.url);
      });
      expect(privacyFailures, `${tool.id}: every method and GET URL/body is free of private HR inputs`).toEqual([]);
      expect(errors, tool.id).toEqual([]);
    });
  }

  test("all six keep private HR data out of network, URLs, headers, storage and console across fresh contexts", async ({ browser }) => {
    test.setTimeout(300000);
    for (const tool of manifest.tools) {
      const firstContext = await browser.newContext({ baseURL: BASE_URL, serviceWorkers: "block" });
      const firstAudit = attachPrivacyAudit(firstContext);
      const firstPage = await firstContext.newPage();
      const firstErrors = await prepare(firstPage, tool, { calculate: false });
      await firstPage.getByRole("button", { name: "Calculer l'estimation" }).click();
      await expect(firstPage.locator("#fr-hr-payroll-result")).toBeVisible();
      const jsonDownloadPromise = firstPage.waitForEvent("download");
      await firstPage.getByRole("button", { name: "Enregistrer JSON" }).click();
      const saved = JSON.parse(fs.readFileSync(await (await jsonDownloadPromise).path(), "utf8"));
      const firstState = await capturePrivacyState(firstPage);
      await firstContext.close();

      const secondContext = await browser.newContext({ baseURL: BASE_URL, serviceWorkers: "block" });
      const secondAudit = attachPrivacyAudit(secondContext);
      const secondPage = await secondContext.newPage();
      const response = await secondPage.goto(tool.route);
      expect(response.status(), `${tool.id}: fresh-context route`).toBe(200);
      await waitForComponents(secondPage);
      await secondPage.waitForLoadState("networkidle");
      await secondPage.locator("#fr-hr-payroll-import").setInputFiles({
        name: "scenario.json",
        mimeType: "application/json",
        buffer: Buffer.from(JSON.stringify(saved))
      });
      await expect(secondPage.locator("#fr-hr-payroll-result")).toBeVisible();
      await expect(secondPage.locator("#fr-hr-payroll-status")).toContainText("rouvert");
      await expect(secondPage.locator("#fr-hr-payroll-source-used")).toContainText(PRIVATE_SOURCE);
      const secondState = await capturePrivacyState(secondPage);
      await secondContext.close();

      expect(firstErrors, `${tool.id}: workflow errors`).toEqual([]);
      expectPrivacyClean(tool.id, [firstAudit, secondAudit], [firstState, secondState]);
    }
  });

  test("owner-bound invalid maxima and zero-service states reject in the browser", async ({ page }) => {
    test.setTimeout(180000);
    const cases = [
      ["domestic-worker", { overtimeHours: 161 }, "160"],
      ["domestic-worker", { employerPct: 41 }, "40"],
      ["domestic-worker", { leavePct: 31 }, "30"],
      ["gratuity-calculator", { years: 0, months: 0 }, "supérieur"],
      ["gratuity-calculator", { daysPerYear: 0 }, "supérieur"],
      ["retrenchment-calculator", { years: 0, months: 0 }, "supérieur"]
    ];
    for (const [toolId, overrides, message] of cases) {
      const tool = manifest.tools.find((entry) => entry.id === toolId);
      await prepare(page, tool, { calculate: false });
      for (const [name, value] of Object.entries(overrides)) await setField(page, name, value);
      await page.getByRole("button", { name: "Calculer l'estimation" }).click();
      await expect(page.locator("#fr-hr-payroll-result"), `${toolId} ${JSON.stringify(overrides)}`).toBeHidden();
      await expect(page.locator("#fr-hr-payroll-errors")).toContainText(message);
      await expect(page.locator("#fr-hr-payroll-errors")).toBeFocused();
    }
  });

  test("fixed 320px reflow measures real 16px to 32px root sizing in light DOM and open shadow DOM", async ({ page }) => {
    test.setTimeout(180000);
    await page.setViewportSize({ width: 320, height: 900 });
    const routes = [{ id: "hub", route: "/fr/hr-payroll/" }, ...manifest.tools];
    for (const route of routes) {
      await page.goto(route.route);
      await waitForComponents(page);
      await page.evaluate(() => { document.documentElement.style.fontSize = "16px"; });
      expect((await scanVisibleGeometry(page, `${route.id} initial root16`)).rootFontSize).toBe("16px");
      await page.evaluate(() => { document.documentElement.style.fontSize = "32px"; });
      expect((await scanVisibleGeometry(page, `${route.id} initial root32`)).rootFontSize).toBe("32px");
      if (route.id !== "hub") {
        await prepare(page, route);
        await page.evaluate(() => { document.documentElement.style.fontSize = "32px"; });
        expect((await scanVisibleGeometry(page, `${route.id} rendered root32`)).rootFontSize).toBe("32px");
      }
    }
  });

  test("all six plus hub reflow at 375px in initial and rendered states", async ({ page }) => {
    test.setTimeout(120000);
    await page.setViewportSize({ width: 375, height: 900 });
    await page.goto("/fr/hr-payroll/");
    await waitForComponents(page);
    await scanVisibleGeometry(page, "hub 375 initial");
    for (const tool of manifest.tools) {
      await prepare(page, tool);
      await scanVisibleGeometry(page, `${tool.id} 375 rendered`);
    }
  });

  test("mobile navbar keeps redundant controls in the keyboard-operable drawer", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 900 });
    await page.goto("/fr/hr-payroll/");
    await waitForComponents(page);
    await page.evaluate(() => { document.documentElement.style.fontSize = "32px"; });
    const closed = await page.locator("afro-navbar").evaluate((host) => {
      const root = host.shadowRoot;
      const value = (selector, property) => getComputedStyle(root.querySelector(selector))[property];
      const burger = root.querySelector(".burger").getBoundingClientRect();
      return {
        searchDisplay: value(".search-btn", "display"),
        themeDisplay: value(".theme-toggle", "display"),
        burgerRight: burger.right,
        burgerVisible: value(".burger", "display")
      };
    });
    expect(closed.searchDisplay).toBe("none");
    expect(closed.themeDisplay).toBe("none");
    expect(closed.burgerVisible).toBe("flex");
    expect(closed.burgerRight).toBeLessThanOrEqual(321);
    const burger = page.locator("afro-navbar").locator(".burger");
    await burger.focus();
    await expect(burger).toBeFocused();
    await burger.press("Enter");
    await expect(page.locator("afro-navbar").locator(".mob")).toHaveClass(/open/);
    await expect(page.locator("afro-navbar").locator(".mob-search-input")).toBeVisible();
    await expect(page.locator("afro-navbar").locator(".mob-theme-toggle")).toBeVisible();
    await scanVisibleGeometry(page, "hub root32 navbar drawer open");
    await page.keyboard.press("Escape");
    await expect(page.locator("afro-navbar").locator(".mob")).not.toHaveClass(/open/);
    await expect(burger).toBeFocused();
  });

  test("all six expose labels, landmarks, focus visibility, SEO, AI consent and artwork", async ({ page }) => {
    for (const tool of manifest.tools) {
      await page.goto(tool.route);
      await waitForComponents(page);
      const accessibility = await page.evaluate(() => {
        const fields = Array.from(document.querySelectorAll("#fr-hr-payroll-form input:not([type=file]), #fr-hr-payroll-form select, #fr-hr-payroll-form textarea"));
        const missingLabels = fields.filter((field) => !field.id || !document.querySelector(`label[for="${field.id}"]`)).map((field) => field.name);
        const buttons = Array.from(document.querySelectorAll("button")).filter((button) => !button.textContent.trim() && !button.getAttribute("aria-label"));
        return {
          missingLabels,
          unnamedButtons: buttons.length,
          main: document.querySelectorAll("main").length,
          h1: document.querySelectorAll("h1").length,
          live: Boolean(document.querySelector('[role="status"][aria-live]')),
          consent: document.querySelector("[data-ai-consent-notice]")?.getAttribute("data-consent-mode"),
          canonical: document.querySelector('link[rel="canonical"]')?.href,
          hreflangs: Array.from(document.querySelectorAll('link[rel="alternate"][hreflang]')).map((node) => node.hreflang)
        };
      });
      expect(accessibility.missingLabels, tool.id).toEqual([]);
      expect(accessibility.unnamedButtons, tool.id).toBe(0);
      expect(accessibility.main, tool.id).toBe(1);
      expect(accessibility.h1, tool.id).toBe(1);
      expect(accessibility.live, tool.id).toBe(true);
      expect(accessibility.consent, tool.id).toBe("browser_local_only");
      expect(accessibility.canonical, tool.id).toBe("https://afrotools.com" + tool.route);
      expect(accessibility.hreflangs, tool.id).toEqual(expect.arrayContaining(["fr", "en", "x-default"]));

      await page.keyboard.press("Tab");
      const focus = page.locator(":focus");
      await expect(focus).toBeVisible();
      const outline = await focus.evaluate((node) => getComputedStyle(node).outlineStyle);
      expect(outline, `${tool.id} focus outline`).not.toBe("none");

      await assertArtworkAndOg(page, ".fr-hr-hero img");
    }
  });

  test("full visible surface meets contrast in settled manual light, manual dark and system dark states", async ({ browser }) => {
    test.setTimeout(480000);
    const modes = [
      { id: "manual-light", colorScheme: "light", preference: "light", theme: "light", choice: "light", prefersDark: false },
      { id: "manual-dark", colorScheme: "light", preference: "dark", theme: "dark", choice: "dark", prefersDark: false },
      { id: "system-dark", colorScheme: "dark", preference: null, theme: "dark", choice: "auto", prefersDark: true }
    ];
    const routes = [{ id: "hub", route: "/fr/hr-payroll/" }, ...manifest.tools];
    for (const mode of modes) {
      const context = await browser.newContext({
        baseURL: BASE_URL,
        colorScheme: mode.colorScheme,
        serviceWorkers: "block",
        viewport: { width: 375, height: 900 }
      });
      if (mode.preference) {
        await context.addInitScript((preference) => localStorage.setItem("aft_theme", preference), mode.preference);
      }
      const page = await context.newPage();
      for (const route of routes) {
        const response = await page.goto(route.route);
        expect(response.status(), `${mode.id}/${route.id}`).toBe(200);
        await waitForComponents(page);
        await page.waitForLoadState("networkidle");
        const initial = await scanVisibleContrast(page, `${mode.id}/${route.id} initial`);
        expect(initial.theme, `${mode.id}/${route.id}: settled theme`).toBe(mode.theme);
        expect(initial.themeChoice, `${mode.id}/${route.id}: settled theme choice`).toBe(mode.choice);
        expect(initial.prefersDark, `${mode.id}/${route.id}: system preference`).toBe(mode.prefersDark);
        if (route.id === "hub") continue;
        for (const [name, value] of Object.entries(FIXTURES[route.id].input)) await setField(page, name, value);
        await setField(page, "jurisdiction", PRIVATE_JURISDICTION);
        await setField(page, "currency", "TST");
        await setField(page, "sourceLabel", PRIVATE_SOURCE);
        await setField(page, "sourceDate", TODAY);
        await page.getByRole("button", { name: "Calculer l'estimation" }).click();
        await expect(page.locator("#fr-hr-payroll-result")).toBeVisible();
        const rendered = await scanVisibleContrast(page, `${mode.id}/${route.id} result`);
        expect(rendered.theme, `${mode.id}/${route.id}: rendered theme`).toBe(mode.theme);
        expect(rendered.themeChoice, `${mode.id}/${route.id}: rendered theme choice`).toBe(mode.choice);
      }
      await context.close();
    }
  });

  test("hub exposes six semantic owners with true 16:9 artwork, currentSrc, natural dimensions and OG response", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 900 });
    await page.goto("/fr/hr-payroll/");
    await waitForComponents(page);
    await expect(page.locator("#fr-hr-payroll-grid .fr-hr-tool-card")).toHaveCount(6);
    await expect(page.locator('link[rel="alternate"][hreflang="en"]')).toHaveAttribute("href", "https://afrotools.com/hr-payroll/");
    await assertArtworkAndOg(page, "#fr-hr-payroll-grid .fr-hr-tool-card img");
  });
});
