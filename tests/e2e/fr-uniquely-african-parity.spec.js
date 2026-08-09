const { test, expect } = require("@playwright/test");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const pdfParse = require("pdf-parse");
const manifest = require("../../data/localization/fr-uniquely-african-parity-manifest.json");
const engineFixtures = require("../fixtures/fr-uniquely-african-english-oracles.json");
const nativeFixtures = require("../fixtures/fr-uniquely-african-native-oracles.json");
const { getPresentation } = require("../../scripts/lib/fr-uniquely-african-presentations");

const root = path.resolve(__dirname, "../..");
const evidenceDir = path.join(root, "reports", "fr-uniquely-african-parity");
const pendingProofPath = path.join(evidenceDir, "browser-proof.pending.json");
const reflowDiagnosticsPath = path.join(evidenceDir, "reflow-diagnostics.pending.json");
const rootSentinelFiles = Object.freeze([
  "tests/fixtures/fr-uniquely-african-active-checkout-sentinel.txt",
  "data/localization/fr-uniquely-african-parity-manifest.json",
  "tests/e2e/fr-uniquely-african-parity.spec.js"
]);
let rootSentinelProof = {
  strategy: "active-checkout-content-fingerprint",
  files: [],
  sha256: "",
  validated: false
};
const proofRows = [];

const generatedMutation = {
  "fintech-fee-watch": ["amount", "8500"],
  "ajo-chama": ["contribution", "40000"],
  "electricity-estimator": ["hoursPerDay", "18"],
  "fuel-cost": ["distance", "220"],
  "hawala-tracker": ["amount", "900"],
  "staple-basket": ["householdSize", "8"],
  "wholesale-retail-spread": ["retail", "175"],
  "land-size": ["area", "5"],
  "informal-fx-watch": ["observedRate", "1750"],
  "cost-of-living": ["householdSize", "7"],
  afroatlas: ["countryB", "kenya"],
  afropoints: ["records", "25"],
  afrokitchen: ["targetServings", "18"],
  "africa-conflict": ["status", "critical"],
  "diaspora-guide": ["daysPresent", "170"],
  "nollywood-pitch": ["production", "12000000"],
  "okada-income": ["trips", "22"],
  afroprices: ["quantity", "3"],
  "ankara-kente-cost": ["yards", "18"],
  "fabric-cost": ["yards", "7"]
};

const generatedInvalid = {
  "fintech-fee-watch": ["amount", "0"],
  "ajo-chama": ["members", "0"],
  "electricity-estimator": ["watts", "0"],
  "fuel-cost": ["distance", "0"],
  "hawala-tracker": ["amount", "0"],
  "staple-basket": ["weeklyCost", "0"],
  "wholesale-retail-spread": ["wholesale", "0"],
  "land-size": ["area", "0"],
  "informal-fx-watch": ["officialRate", "0"],
  "cost-of-living": ["city2", "Dakar"],
  afroatlas: ["countryB", "nigeria"],
  afropoints: ["records", "0"],
  afrokitchen: ["targetServings", "0"],
  "africa-conflict": ["status", "unsupported"],
  "diaspora-guide": ["daysPresent", "-1"],
  "nollywood-pitch": ["production", "0"],
  "okada-income": ["trips", "0"],
  afroprices: ["quantity", "0"],
  "ankara-kente-cost": ["pricePerYard", "0"],
  "fabric-cost": ["yards", "0"]
};

const nativeCopySelectors = {
  "japa-calculator": '[data-native-export="copy"]',
  "mobile-money-fees": "#mm-copy",
  "burial-cost": "#copyBtn",
  "naira-to-words": "#copy-result",
  "amount-words-ke": "#copyBtn",
  "amount-words-gh": "#copyBtn",
  "susu-tracker": "#copySusu",
  "whatsapp-link": "#copyLink",
  "remittance-compare": "#frRemitCopy",
  "remittance-v2": "#copyMemo",
  "brideprice-advisor": "#ua-bp-copy",
  "ajo-interest": "#copyBtn",
  "market-days": "#copy-result",
  "ajo-chama-calc": "#copyBtn"
};
const nativeEnglishMutations = {
  "japa-calculator": { "#jb-monthly": "1200" },
  "mobile-money-fees": { "#mm-b-sender": "40" },
  "burial-cost": { "#guestSlider": "350" },
  "naira-to-words": { "#amount": "7800.50" },
  "amount-words-ke": { "#amount": "8200.25" },
  "amount-words-gh": { "#amount": "9250.25" },
  "susu-tracker": { "#contribution": "400" },
  "whatsapp-link": { "#phoneNumber": "7087654321" },
  "remittance-compare": { "#rcAmount": "900" },
  "remittance-v2": { "#amount": "900" },
  "brideprice-advisor": { "#bpSaved": "50000" },
  "ajo-interest": { "#contribution": "40000" },
  "market-days": {},
  "ajo-chama-calc": { "#contribution": "7500" }
};

function sha(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function activeCheckoutSentinelEntries() {
  return rootSentinelFiles.map((relativePath) => ({
    path: relativePath,
    sha256: sha(fs.readFileSync(path.join(root, relativePath)))
  }));
}

function activeCheckoutSentinelDigest(entries) {
  return sha(entries.map((entry) => `${entry.path}\0${entry.sha256}`).join("\n"));
}

function pdfComparable(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[\u00a0\u202f]/g, " ")
    .replace(/[^\x20-\x7E\n]/g, "?")
    .replace(/\s+/g, " ")
    .trim();
}

function generatedPdfExpectation(row) {
  if (row.english.id !== "ajo-chama") return null;
  const presentation = getPresentation(row.english.id);
  const input = Object.fromEntries(presentation.fields.map((field) => [field.key, field.value]));
  input.contribution = Number(generatedMutation[row.english.id][1]);
  const formatted = (value) => new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 2 }).format(value);
  return {
    title: presentation.title,
    exactResultLines: [
      `${presentation.metrics.pool}: ${formatted(input.members * input.contribution)}`,
      `${presentation.metrics.totalContributions}: ${formatted(input.rounds * input.members * input.contribution)}`,
      `${presentation.metrics.arrears}: ${formatted(input.missedPayments * (input.contribution + input.latePenalty))}`
    ],
    boundaryLines: [
      `Source: ${presentation.source}`,
      `Fraîcheur: ${presentation.freshness}`,
      `Confiance: ${presentation.confidence}`,
      `Limites: ${presentation.limitations}`
    ]
  };
}

function nativePdfExpectation(row, payload) {
  if (row.english.id !== "japa-calculator") return null;
  return {
    id: row.english.id,
    title: "Planificateur de budget Japa",
    exactResultLines: [
      `Budget total: ${payload.total}`,
      `Ecart de financement: ${payload.gap}`,
      `Epargne mensuelle cible: ${payload.target}`
    ],
    boundaryLines: [
      "Budget fonde uniquement sur vos montants verifies",
      "aucun conseil de visa"
    ]
  };
}

function alternateLinks(source) {
  const links = {};
  const tags = String(source || "").match(/<link\b[^>]*>/gi) || [];
  for (const tag of tags) {
    const rel = tag.match(/\brel=["']([^"']+)["']/i);
    const lang = tag.match(/\bhreflang=["']([^"']+)["']/i);
    const href = tag.match(/\bhref=["']([^"']+)["']/i);
    if (!rel || !lang || !href || rel[1].toLowerCase() !== "alternate") continue;
    links[lang[1].toLowerCase()] = href[1];
  }
  return links;
}

async function fillValues(page, values) {
  for (const [selector, raw] of Object.entries(values)) {
    const field = page.locator(selector);
    await expect(field, `${selector} exists`).toHaveCount(1);
    const tag = await field.evaluate((node) => node.tagName.toLowerCase());
    if (tag === "select") await field.selectOption(String(raw));
    else await field.fill(String(raw));
  }
}

async function clickAction(page, selector) {
  const action = page.locator(selector).first();
  await expect(action, `action ${selector}`).toBeVisible();
  await action.click();
}

async function installNetworkFixtures(page) {
  await page.route("https://www.googletagmanager.com/**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/javascript",
      body: "/* analytics disabled in local parity fixture */"
    });
  });
  await page.route(/https:\/\/(?:www\.)?(?:google-analytics\.com|google\.com|pagead2\.googlesyndication\.com)\/.*/, async (route) => {
    await route.fulfill({ status: 204, body: "" });
  });
  await page.route("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/javascript",
      body: `window.supabase={createClient:function(){return{auth:{
        onAuthStateChange:function(){return{data:{subscription:{unsubscribe:function(){}}}};},
        getSession:function(){return Promise.resolve({data:{session:null}});},
        signOut:function(){return Promise.resolve({error:null});}
      }};}};`
    });
  });
  await page.route("**/data/forex/latest.json", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        base: "USD",
        timestamp: "2026-07-01T00:00:00.000Z",
        source: "synthetic parity fixture",
        rates: { USD: 1, NGN: 1650 }
      })
    });
  });
  await page.route("**/api/**", async (route) => {
    const pathname = new URL(route.request().url()).pathname;
    const bodies = {
      "/api/conflicts": {
        conflicts: [
          { id: "synthetic-sahel", country: "Mali", region: "Sahel", status: "high", displaced: 12000, source: "Fixture locale de test", updatedAt: "2026-07-01" },
          { id: "synthetic-east", country: "Soudan", region: "Afrique de l’Est", status: "critical", displaced: 44000, source: "Fixture locale de test", updatedAt: "2026-07-02" }
        ]
      },
      "/api/fintech-fees": { fees: [] },
      "/api/afro-prices": { prices: [] }
    };
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(bodies[pathname] || {})
    });
  });
}

async function captureNativeSemantic(page, id, locale) {
  return page.evaluate(({ routeId, language }) => {
    function text(selector) {
      const node = document.querySelector(selector);
      return node ? node.textContent.trim() : "";
    }
    function words(value) {
      return String(value).toLowerCase().replace(/[.,]+$/g, "").replace(/\s+/g, " ").trim();
    }
    function numeric(value) {
      let cleaned = String(value).replace(/\s/g, "").replace(/[^\d,.-]/g, "");
      if (!cleaned || !/\d/.test(cleaned)) return 0;
      if (cleaned.includes(".") && cleaned.includes(",")) cleaned = cleaned.replace(/,/g, "");
      else if (cleaned.includes(",") && /,\d{1,2}$/.test(cleaned)) cleaned = cleaned.replace(",", ".");
      else cleaned = cleaned.replace(/,/g, "");
      return Number(cleaned);
    }
    function rounded(value, places) {
      const scale = Math.pow(10, places || 0);
      return Math.round(Number(value) * scale) / scale;
    }
    function cells(selector) {
      const row = document.querySelector(selector);
      return row ? Array.from(row.children).map((cell) => cell.textContent.trim()) : [];
    }
    if (routeId === "japa-calculator") {
      const source = window.RelocationBudgetEngine.calculate({
        currency: document.querySelector("#jb-currency").value,
        preDeparture: document.querySelector("#jb-pre").value,
        verifiedOfficialFees: document.querySelector("#jb-official").value,
        travel: document.querySelector("#jb-travel").value,
        housing: document.querySelector("#jb-housing").value,
        arrivalSetup: document.querySelector("#jb-arrival").value,
        monthlyLiving: document.querySelector("#jb-monthly").value,
        runwayMonths: document.querySelector("#jb-runway").value,
        bufferPercent: document.querySelector("#jb-buffer").value,
        availableSavings: document.querySelector("#jb-savings").value,
        savingMonths: document.querySelector("#jb-saving-months").value
      });
      return {
        total: rounded(source.total, 6),
        base: rounded(source.base, 6),
        runwayCost: rounded(source.runwayCost, 6),
        buffer: rounded(source.buffer, 6),
        gap: rounded(source.gap, 6),
        monthlySavingsTarget: rounded(source.monthlySavingsTarget, 6)
      };
    }
    if (routeId === "mobile-money-fees") {
      const read = (letter) => ({
        label: document.querySelector(`#mm-${letter}-label`).value,
        market: document.querySelector(`#mm-${letter}-market`).value,
        currency: document.querySelector(`#mm-${letter}-currency`).value,
        transactionType: document.querySelector(`#mm-${letter}-type`).value,
        amount: document.querySelector(`#mm-${letter}-amount`).value,
        senderFee: document.querySelector(`#mm-${letter}-sender`).value,
        recipientFee: document.querySelector(`#mm-${letter}-recipient`).value,
        observedAt: document.querySelector(`#mm-${letter}-observed`).value,
        expiresAt: document.querySelector(`#mm-${letter}-expires`).value
      });
      const result = window.MobileMoneyQuoteEngine.calculate({
        asOf: "2026-08-09T10:00:00.000Z",
        quotes: [read("a"), read("b")]
      });
      return {
        groups: result.groups.map((group) => ({ currency: group.currency, amount: rounded(group.amount), lowestTotalFee: rounded(group.lowestTotalFee) })),
        quotes: result.quotes.map((row) => ({ label: words(row.label), totalFee: rounded(row.totalFee), feePercent: rounded(row.feePercent), differenceFromLowest: rounded(row.differenceFromLowest || 0) }))
      };
    }
    if (routeId === "burial-cost") {
      if (language === "fr") {
        const result = window.AfroToolsFrenchBurialPayload;
        return {
          total: rounded(result.total),
          perGuest: rounded(result.perGuest),
          fundingGap: rounded(result.fundingGap),
          perHousehold: rounded(result.perHousehold),
          dailyTarget: rounded(result.dailyTarget),
          covered: rounded(result.covered)
        };
      }
      const funding = Array.from(document.querySelectorAll("#familyFundingPlan .fc-family-v")).map((node) => numeric(node.textContent));
      return {
        total: numeric(text("#resTotal")),
        perGuest: numeric(text("#resPerGuest")),
        fundingGap: funding[0],
        perHousehold: funding[1],
        dailyTarget: funding[2],
        covered: funding[3]
      };
    }
    if (routeId === "naira-to-words") {
      if (language === "fr") return { words: words(text("#english-output")) };
      const result = document.querySelector("#result");
      const label = result.querySelector(".currency-label");
      return { words: words(result.textContent.replace(label ? label.textContent : "", "")) };
    }
    if (routeId === "amount-words-ke" || routeId === "amount-words-gh") {
      const selector = language === "en"
        ? "#wordsResult"
        : (routeId === "amount-words-ke" ? "#result .aw-words" : "#wordsOutput");
      return { words: words(text(selector)) };
    }
    if (routeId === "susu-tracker") {
      if (language === "en") {
        const values = Array.from(document.querySelectorAll("#summaryGrid .num")).map((node) => node.textContent.trim());
        return { members: numeric(values[0]), payout: numeric(values[1]), contribution: numeric(document.querySelector("#contribution").value) };
      }
      return {
        members: document.querySelector("#members").value.split(/\r?\n/).filter((line) => line.trim()).length,
        payout: numeric(text("#potAmount")),
        contribution: numeric(document.querySelector("#contribution").value)
      };
    }
    if (routeId === "whatsapp-link") {
      const value = language === "en"
        ? document.querySelector("#linkDisplay a")?.href
        : text("#waLink");
      return { url: value || "" };
    }
    if (routeId === "remittance-compare") {
      if (language === "fr") {
        return window.frRemittancePayload.providers.map((provider) => ({
          provider: words(provider.name),
          fee: rounded(provider.fee, 2),
          rate: rounded(provider.effectiveRate, 2),
          recipientAmount: rounded(provider.received),
          costPercent: rounded(provider.totalCostPct, 1)
        })).sort((a, b) => a.provider.localeCompare(b.provider));
      }
      return Array.from(document.querySelectorAll(".rc-provider-card")).map((card) => {
        const values = Array.from(card.querySelectorAll(".rc-stat-value")).map((node) => node.textContent.trim());
        return {
          provider: words(card.querySelector(".rc-provider-name").textContent),
          fee: numeric(values[0]),
          rate: numeric(values[1]),
          recipientAmount: numeric(values[3]),
          costPercent: numeric(values[2])
        };
      }).sort((a, b) => a.provider.localeCompare(b.provider));
    }
    if (routeId === "remittance-v2") {
      if (language === "fr") {
        return window.AfroToolsFrenchRemittanceV2Payload.results.map((provider) => ({
          provider: words(provider.name),
          fee: rounded(provider.fee, 2),
          rate: rounded(provider.effectiveRate, 1),
          recipientAmount: rounded(provider.received),
          cost: rounded(provider.cost, 2)
        })).sort((a, b) => a.provider.localeCompare(b.provider));
      }
      return Array.from(document.querySelectorAll(".provider-card")).map((card) => {
        const values = Array.from(card.querySelectorAll(".provider-detail strong, .provider-detail .total-cost"))
          .map((node) => node.textContent.trim());
        const providerNode = card.querySelector(".provider-name, h3, h4");
        const providerName = providerNode
          ? Array.from(providerNode.childNodes)
            .filter((node) => node.nodeType === Node.TEXT_NODE)
            .map((node) => node.textContent)
            .join(" ")
          : "wise";
        return {
          provider: words(providerName),
          fee: numeric(values[0]),
          rate: numeric((values[1] || "").split("=")[1] || values[1]),
          recipientAmount: numeric(values[2]),
          cost: numeric((values[3] || "").split("(")[0])
        };
      }).filter((item) => item.recipientAmount > 0).sort((a, b) => a.provider.localeCompare(b.provider));
    }
    if (routeId === "brideprice-advisor") {
      if (language === "fr") {
        const result = window.AfroToolsFrenchBridePricePayload;
        return { target: result.target, gap: result.gap, monthly: result.monthly, perHome: result.perHome };
      }
      const cultures = window.AfroToolsBridePriceData[document.querySelector("#country").value];
      const culture = cultures[Number(document.querySelector("#culture").value) || 0];
      const result = window.BridePriceCultureEngine.calculate({
        culture,
        saved: Number(document.querySelector("#bpSaved").value),
        months: Number(document.querySelector("#bpMonths").value),
        homes: Number(document.querySelector("#bpHouseholds").value),
        tone: document.querySelector("#bpTone").value
      }).values;
      return { target: result.target, gap: result.gap, monthly: result.monthly, perHome: result.perHome };
    }
    if (routeId === "ajo-interest") {
      return language === "en"
        ? { pot: numeric(text("#rPool")), position: numeric(text("#rTurn").split("/")[0]), members: numeric(document.querySelector("#members").value) }
        : { pot: numeric(text("#potOut")), position: numeric(text("#rankOut").split("/")[0]), members: numeric(text("#rankOut").split("/")[1]) };
    }
    if (routeId === "market-days") {
      if (language === "fr") return window.AfroToolsFrenchMarketDaysPayload;
      const api = window.AfroTools.engines.igboMarketDays;
      const date = document.querySelector("#lookupDate").value;
      const day = api.getMarketDay(date);
      return {
        date,
        marketDayId: day.id,
        marketDayName: day.name,
        upcomingDates: api.getUpcomingDates(
          date,
          day.index,
          Number(window.__uaNativeScenarioCount || 4)
        ).map(api.toDateKey)
      };
    }
    if (routeId === "ajo-chama-calc") {
      if (language === "en") {
        const result = window._ajoData;
        return {
          members: result.members.length,
          pot: rounded(result.contribution * result.members.length),
          payout: rounded(result.poolPerRound)
        };
      }
      return { members: numeric(text("#memberCount")), pot: numeric(text("#potValue")), payout: numeric(text("#payoutValue")) };
    }
    throw new Error(`No exact semantic oracle for ${routeId}`);
  }, { routeId: id, language: locale });
}

async function assertMetadata(page, row) {
  await expect(page.locator('html[lang="fr"]')).toHaveCount(1);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", `https://afrotools.com${row.french.route}`);
  await expect(page.locator('meta[property="og:url"]')).toHaveAttribute("content", `https://afrotools.com${row.french.route}`);
  await expect(page.locator(`link[rel="alternate"][hreflang="en"]`)).toHaveAttribute("href", `https://afrotools.com${row.english.route}`);
  await expect(page.locator(`link[rel="alternate"][hreflang="fr"]`)).toHaveAttribute("href", `https://afrotools.com${row.french.route}`);
  const englishResponse = await page.request.get(row.english.route);
  expect(englishResponse.ok(), `${row.english.id}: English hreflang owner loads`).toBeTruthy();
  const englishAlternates = alternateLinks(await englishResponse.text());
  const frenchAlternates = await page.locator('link[rel="alternate"][hreflang]').evaluateAll((links) =>
    Object.fromEntries(links.map((link) => [link.getAttribute("hreflang").toLowerCase(), link.href])));
  for (const [lang, href] of Object.entries(englishAlternates)) {
    if (lang === "fr") continue;
    expect(frenchAlternates[lang], `${row.english.id}: French preserves ${lang} equivalent`).toBe(href);
    if (["en", "x-default"].includes(lang)) continue;
    const reciprocalResponse = await page.request.get(new URL(href).pathname);
    expect(reciprocalResponse.ok(), `${row.english.id}: ${lang} reciprocal owner loads`).toBeTruthy();
    const reciprocalAlternates = alternateLinks(await reciprocalResponse.text());
    expect(reciprocalAlternates.fr, `${row.english.id}: ${lang} reciprocal French link`)
      .toBe(`https://afrotools.com${row.french.route}`);
  }
  const schemas = await page.locator('script[type="application/ld+json"]').allTextContents();
  const parsed = schemas.map((source) => {
    try { return JSON.parse(source); } catch (_) { return null; }
  }).filter(Boolean);
  expect(parsed.some((schema) => schema.inLanguage === "fr" || (schema["@graph"] || []).some((item) => item.inLanguage === "fr")),
    `${row.english.id}: schema inLanguage`).toBeTruthy();
  await expect(page.locator(`a[href*="/fr/ai/"][href*="tool=${encodeURIComponent(row.english.id)}"]`).first()).toBeVisible();
  return Object.keys(frenchAlternates).sort();
}

async function assertArtwork(page, row) {
  const image = page.locator("img[data-fr-ua-artwork]");
  await expect(image, `${row.english.id}: manifest artwork is rendered`).toHaveCount(1);
  await expect(image).toBeVisible();
  const rendered = await image.evaluate((node) => ({
    path: new URL(node.currentSrc || node.src, location.href).pathname,
    naturalWidth: node.naturalWidth,
    naturalHeight: node.naturalHeight
  }));
  expect(rendered.path, `${row.english.id}: rendered manifest artwork path`)
    .toBe(`/${row.artwork.path}`);
  expect(rendered.naturalWidth, `${row.english.id}: artwork loaded`).toBeGreaterThan(0);
  expect(rendered.naturalHeight, `${row.english.id}: artwork loaded`).toBeGreaterThan(0);
  const expected = `https://afrotools.com/${row.artwork.path}`;
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute("content", expected);
  await expect(page.locator('meta[name="twitter:image"]')).toHaveAttribute("content", expected);
  return rendered;
}

async function assertRuntimeSafety(page, row, telemetry) {
  expect(await page.locator("iframe").count(), `${row.english.id}: no iframe`).toBe(0);
  expect(await page.locator('script[data-fr-utility-localizer]').count(), `${row.english.id}: no text localizer`).toBe(0);
  const source = await page.content();
  expect(source).not.toMatch(/fetch\s*\(\s*["'`]\/tools\/[^"'`]+(?:index\.html)?/i);
  const englishButtons = await page.locator("button:visible").allTextContents();
  expect(englishButtons.filter((label) => /\b(calculate|download|copy result|reset|save result|generate|compare now)\b/i.test(label)),
    `${row.english.id}: complete French action labels`).toEqual([]);
  expect(telemetry.mutations, `${row.english.id}: local-first no state-changing network`).toEqual([]);
  expect(telemetry.exfiltration, `${row.english.id}: no input exfiltration in method/path/query/headers/body`).toEqual([]);
  expect(telemetry.thirdPartyWrites, `${row.english.id}: no third-party non-analytics writes`).toEqual([]);
  expect(telemetry.successfulThirdPartyWrites,
    `${row.english.id}: no successful third-party non-analytics writes`).toEqual([]);
}

async function probePrivacyInputs(page, telemetry) {
  const marker = `UA34_PRIVACY_${crypto.randomBytes(8).toString("hex")}`;
  telemetry.privacyMarkers.push(marker, encodeURIComponent(marker), marker.toLowerCase());
  await page.evaluate((value) => {
    const candidates = Array.from(document.querySelectorAll("input, textarea"))
      .filter((node) => {
        const style = getComputedStyle(node);
        const rect = node.getBoundingClientRect();
        return style.display !== "none" && style.visibility !== "hidden" && rect.width > 0 && rect.height > 0;
      });
    candidates.forEach((node) => {
      if (node.disabled || node.readOnly || ["hidden", "file", "checkbox", "radio", "submit", "button"].includes(node.type)) return;
      const prior = node.value;
      if (["number", "range"].includes(node.type)) {
        const minimum = Number.isFinite(Number(node.min)) && node.min !== "" ? Number(node.min) : 0;
        const maximum = Number.isFinite(Number(node.max)) && node.max !== "" ? Number(node.max) : 29.123;
        node.value = String(Math.max(minimum, Math.min(maximum, 29.123)));
      } else node.value = value;
      node.dispatchEvent(new Event("input", { bubbles: true }));
      node.dispatchEvent(new Event("change", { bubbles: true }));
      node.value = prior;
    });
  }, marker);
  telemetry.privacyMarkers.push("29.123", "29123");
  await page.waitForTimeout(100);
}

async function assertA11y(page, row) {
  const unnamed = await page.locator("input:visible, select:visible, textarea:visible").evaluateAll((nodes) => nodes
    .filter((node) => node.type !== "hidden")
    .filter((node) => {
      const labels = node.labels && Array.from(node.labels).map((label) => label.textContent.trim()).join(" ");
      return !(labels || node.getAttribute("aria-label") || node.getAttribute("aria-labelledby") || node.title);
    })
    .map((node) => node.id || node.name || node.outerHTML.slice(0, 80)));
  expect(unnamed, `${row.english.id}: every visible field has an accessible name`).toEqual([]);
  const workflowStart = page.locator(
    "body[data-fr-ua-app] input:visible, body[data-fr-ua-app] select:visible, body[data-fr-ua-app] textarea:visible, body[data-fr-ua-app] button:visible, body[data-fr-ua-app] a[href]:visible"
  ).first();
  await expect(workflowStart, `${row.english.id}: workflow has a keyboard start`).toBeVisible();
  await workflowStart.focus();
  const sequence = [];
  for (let index = 0; index < 8; index += 1) {
    const focused = await page.evaluate(() => {
      let node = document.activeElement;
      while (node && node.shadowRoot && node.shadowRoot.activeElement) node = node.shadowRoot.activeElement;
      if (!node || node === document.body) return null;
      const style = getComputedStyle(node);
      const rect = node.getBoundingClientRect();
      if (style.visibility === "hidden" || style.display === "none" || rect.width <= 0 || rect.height <= 0) return null;
      return {
        tag: node.localName,
        id: node.id || "",
        role: node.getAttribute("role") || "",
        label: (node.getAttribute("aria-label") || node.textContent || node.value || "").trim().slice(0, 80),
        inMain: node.getRootNode() === document &&
          !Boolean(node.closest && node.closest("afro-navbar,afro-footer,afro-newsletter-cta")),
        focusVisible: (style.outlineStyle !== "none" && parseFloat(style.outlineWidth) > 0) ||
          style.boxShadow !== "none"
      };
    });
    if (focused) sequence.push(focused);
    await page.keyboard.press("Tab");
  }
  expect(sequence.length, `${row.english.id}: meaningful keyboard sequence`).toBeGreaterThanOrEqual(4);
  expect(sequence.filter((item) => item.inMain && !item.focusVisible),
    `${row.english.id}: every sampled workflow focus is visible`).toEqual([]);
  expect(sequence.some((item) => ["button", "input", "select", "textarea"].includes(item.tag)),
    `${row.english.id}: keyboard reaches workflow controls`).toBeTruthy();
  expect(sequence.some((item) => item.inMain && ["button", "input", "select", "textarea", "a"].includes(item.tag)),
    `${row.english.id}: keyboard reaches the main workflow, not only site chrome`).toBeTruthy();
  return sequence;
}

async function assertResultA11y(page, row, selector) {
  const proof = await page.locator(selector).evaluate((root) => {
    function rgb(value) {
      const match = String(value).match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?/);
      return match ? [Number(match[1]), Number(match[2]), Number(match[3]), match[4] == null ? 1 : Number(match[4])] : null;
    }
    function luminance(color) {
      return color.slice(0, 3).map((channel) => {
        const value = channel / 255;
        return value <= 0.03928 ? value / 12.92 : Math.pow((value + 0.055) / 1.055, 2.4);
      }).reduce((sum, value, index) => sum + value * [0.2126, 0.7152, 0.0722][index], 0);
    }
    function blend(foreground, backdrop) {
      const alpha = foreground[3] == null ? 1 : foreground[3];
      return [
        foreground[0] * alpha + backdrop[0] * (1 - alpha),
        foreground[1] * alpha + backdrop[1] * (1 - alpha),
        foreground[2] * alpha + backdrop[2] * (1 - alpha),
        1
      ];
    }
    function background(node) {
      const layers = [];
      let current = node;
      while (current) {
        const color = getComputedStyle(current).backgroundColor;
        const parsed = rgb(color);
        if (parsed && parsed[3] > 0) layers.push(parsed);
        current = current.parentElement || (current.getRootNode() instanceof ShadowRoot ? current.getRootNode().host : null);
      }
      return layers.reverse().reduce((backdrop, layer) => blend(layer, backdrop), [255, 255, 255, 1]);
    }
    const samples = [];
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let node;
    while ((node = walker.nextNode())) {
      if (!node.nodeValue.trim() || !node.parentElement) continue;
      const style = getComputedStyle(node.parentElement);
      const rect = node.parentElement.getBoundingClientRect();
      if (style.display === "none" || style.visibility === "hidden" || rect.width <= 0 || rect.height <= 0) continue;
      const fg = rgb(style.color);
      const bg = background(node.parentElement);
      if (!fg || !bg) continue;
      const effectiveFg = blend(fg, bg);
      const values = [luminance(effectiveFg), luminance(bg)].sort((a, b) => b - a);
      samples.push({
        text: node.nodeValue.trim().replace(/\s+/g, " ").slice(0, 80),
        contrast: (values[0] + 0.05) / (values[1] + 0.05),
        large: parseFloat(style.fontSize) >= 24 || (parseFloat(style.fontSize) >= 18.66 && Number(style.fontWeight) >= 700)
      });
    }
    const status = root.matches('[role="status"],[aria-live]') ||
      Boolean(root.querySelector('[role="status"],[aria-live]'));
    return { samples, status };
  });
  expect(proof.samples.length, `${row.english.id}: rendered result text contrast samples`).toBeGreaterThan(0);
  const failures = proof.samples.filter((item) => item.contrast + 0.01 < (item.large ? 3 : 4.5));
  expect(failures, `${row.english.id}: rendered result computed contrast`).toEqual([]);
  expect(proof.status, `${row.english.id}: rendered result status semantics`).toBeTruthy();
  return proof;
}

async function captureReflowDiagnostics(page, routeId, state) {
  await page.setViewportSize({ width: 320, height: 900 });
  const baselineRootFontSize = await page.evaluate(() =>
    Number.parseFloat(getComputedStyle(document.documentElement).fontSize)
  );
  expect(baselineRootFontSize, `${routeId}: baseline root text size`).toBe(16);
  const scaleStyle = await page.addStyleTag({
    content: "html { font-size: 32px !important; }"
  });
  await page.evaluate(() => new Promise((resolve) =>
    requestAnimationFrame(() => requestAnimationFrame(resolve))
  ));
  const diagnostics = await page.evaluate(({ id, proofState }) => {
    const viewportWidth = document.documentElement.clientWidth;
    const epsilon = 1;
    const composedParent = (node) => {
      if (node.parentElement) return node.parentElement;
      const root = node.getRootNode();
      return root instanceof ShadowRoot ? root.host : null;
    };
    const visible = (node) => {
      if (!(node instanceof Element)) return false;
      let current = node;
      while (current) {
        if (current.hasAttribute("hidden") || current.hasAttribute("inert") ||
            current.getAttribute("aria-hidden") === "true") return false;
        const currentStyle = getComputedStyle(current);
        if (currentStyle.display === "none" || currentStyle.visibility === "hidden" ||
            Number(currentStyle.opacity) === 0) return false;
        current = composedParent(current);
      }
      const rect = node.getBoundingClientRect();
      return rect.width > epsilon && rect.height > epsilon;
    };
    const nodePath = (node) => {
      const parts = [];
      let current = node;
      while (current && current instanceof Element) {
        let part = current.localName;
        if (current.id) part += `#${current.id}`;
        else if (current.classList.length) part += `.${Array.from(current.classList).slice(0, 2).join(".")}`;
        parts.unshift(part);
        const root = current.getRootNode();
        if (root instanceof ShadowRoot && current.parentElement === null) {
          current = root.host;
          parts.unshift("::shadow");
        } else {
          current = current.parentElement;
        }
      }
      return parts.join(" > ");
    };
    const textSample = (node) => String(node.textContent || "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 120);
    const rectangle = (rect) => ({
      left: Math.round(rect.left * 10) / 10,
      right: Math.round(rect.right * 10) / 10,
      top: Math.round(rect.top * 10) / 10,
      bottom: Math.round(rect.bottom * 10) / 10,
      width: Math.round(rect.width * 10) / 10,
      height: Math.round(rect.height * 10) / 10
    });
    const nodes = [];
    const roots = [document];
    const collect = (root) => {
      for (const node of root.querySelectorAll("*")) {
        nodes.push(node);
        if (node.shadowRoot) {
          roots.push(node.shadowRoot);
          collect(node.shadowRoot);
        }
      }
    };
    collect(document);
    const viewportLeaks = [];
    const clippedRectangles = [];
    for (const node of nodes) {
      if (!visible(node)) continue;
      const rect = node.getBoundingClientRect();
      const style = getComputedStyle(node);
      let ancestor = composedParent(node);
      let clippedBy = null;
      while (ancestor) {
        const ancestorStyle = getComputedStyle(ancestor);
        if (/(hidden|clip|auto|scroll)/.test(ancestorStyle.overflowX) && visible(ancestor)) {
          const ancestorRect = ancestor.getBoundingClientRect();
          if (rect.left < ancestorRect.left - epsilon || rect.right > ancestorRect.right + epsilon) {
            clippedBy = {
              node: nodePath(ancestor),
              rect: ancestorRect,
              overflowX: ancestorStyle.overflowX
            };
            break;
          }
        }
        ancestor = composedParent(ancestor);
      }
      const leaksViewport =
        rect.left < -epsilon || rect.right > viewportWidth + epsilon || rect.width > viewportWidth + epsilon;
      const clippingContainerIsInViewport = clippedBy &&
        clippedBy.rect.left >= -epsilon && clippedBy.rect.right <= viewportWidth + epsilon;
      if (leaksViewport && !clippingContainerIsInViewport) {
        viewportLeaks.push({
          node: nodePath(node),
          rect: rectangle(rect),
          display: style.display,
          overflowX: style.overflowX,
          whiteSpace: style.whiteSpace,
          text: textSample(node)
        });
      }
      if (clippedBy) {
        clippedRectangles.push({
          node: nodePath(node),
          rect: rectangle(rect),
          clippedBy: clippedBy.node,
          clippingRect: rectangle(clippedBy.rect),
          overflowX: clippedBy.overflowX,
          text: textSample(node)
        });
      }
    }
    const textRangeViewportLeaks = [];
    const textRangeClippedRectangles = [];
    for (const root of roots) {
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      let textNode;
      while ((textNode = walker.nextNode())) {
        const sample = String(textNode.nodeValue || "").replace(/\s+/g, " ").trim();
        const parent = textNode.parentElement;
        if (!sample || !parent || !visible(parent)) continue;
        const range = document.createRange();
        range.selectNodeContents(textNode);
        for (const rect of Array.from(range.getClientRects())) {
          if (rect.width <= epsilon || rect.height <= epsilon) continue;
          let ancestor = composedParent(parent);
          let clippedBy = null;
          while (ancestor) {
            const ancestorStyle = getComputedStyle(ancestor);
            if (/(hidden|clip|auto|scroll)/.test(ancestorStyle.overflowX) && visible(ancestor)) {
              const ancestorRect = ancestor.getBoundingClientRect();
              if (rect.left < ancestorRect.left - epsilon || rect.right > ancestorRect.right + epsilon) {
                clippedBy = {
                  node: nodePath(ancestor),
                  rect: ancestorRect,
                  overflowX: ancestorStyle.overflowX
                };
                break;
              }
            }
            ancestor = composedParent(ancestor);
          }
          const leaksViewport =
            rect.left < -epsilon || rect.right > viewportWidth + epsilon || rect.width > viewportWidth + epsilon;
          const clippingContainerIsInViewport = clippedBy &&
            clippedBy.rect.left >= -epsilon && clippedBy.rect.right <= viewportWidth + epsilon;
          const proof = {
            node: `${nodePath(parent)} > ::text`,
            rect: rectangle(rect),
            text: sample.slice(0, 120)
          };
          if (leaksViewport && !clippingContainerIsInViewport) textRangeViewportLeaks.push(proof);
          if (clippedBy) {
            textRangeClippedRectangles.push({
              ...proof,
              clippedBy: clippedBy.node,
              clippingRect: rectangle(clippedBy.rect),
              overflowX: clippedBy.overflowX
            });
          }
        }
        range.detach();
      }
    }
    return {
      id,
      state: proofState,
      viewport: { width: viewportWidth, height: window.innerHeight },
      rootFontSize: Number.parseFloat(getComputedStyle(document.documentElement).fontSize),
      documentOverflow: document.documentElement.scrollWidth - viewportWidth,
      bodyOverflow: document.body.scrollWidth - document.body.clientWidth,
      viewportLeaks,
      clippedRectangles,
      textRangeViewportLeaks,
      textRangeClippedRectangles
    };
  }, { id: routeId, proofState: state || "result" });
  await scaleStyle.evaluate((node) => node.remove());
  expect(diagnostics.rootFontSize, `${routeId}: exact 200% root text size`).toBe(32);
  return {
    baselineRootFontSize,
    ...diagnostics
  };
}

async function assertReflowAndThemes(page, row) {
  const viewports = [{ width: 320, height: 900 }, { width: 375, height: 900 }];
  for (const viewport of viewports) {
    await page.setViewportSize(viewport);
    const overflow = await page.evaluate(() => ({
      document: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      body: document.body.scrollWidth - document.body.clientWidth
    }));
    expect(Math.max(overflow.document, overflow.body), `${row.english.id}: ${viewport.width}px overflow`).toBeLessThanOrEqual(2);
  }
  const reflow = await captureReflowDiagnostics(page, row.english.id, "result");
  expect(Math.max(reflow.documentOverflow, reflow.bodyOverflow),
    `${row.english.id}: fixed 320px exact 16px to 32px reflow ${JSON.stringify({
      documentOverflow: reflow.documentOverflow,
      bodyOverflow: reflow.bodyOverflow,
      viewportLeaks: reflow.viewportLeaks
    })}`).toBeLessThanOrEqual(2);
  expect(reflow.viewportLeaks, `${row.english.id}: visible descendant viewport leaks`).toEqual([]);
  expect(reflow.textRangeViewportLeaks, `${row.english.id}: direct text-node Range viewport leaks`).toEqual([]);
  expect(reflow.clippedRectangles, `${row.english.id}: visible descendant clipped rectangles`).toEqual([]);
  expect(reflow.textRangeClippedRectangles,
    `${row.english.id}: direct text-node Range clipped rectangles`).toEqual([]);
  const themeSnapshot = () => page.evaluate(() => {
    function channels(value) {
      const match = String(value).match(/rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)/i);
      return match ? match.slice(1, 4).map(Number) : null;
    }
    function luminance(rgb) {
      return rgb.map((value) => {
        const channel = value / 255;
        return channel <= 0.03928 ? channel / 12.92 : Math.pow((channel + 0.055) / 1.055, 2.4);
      }).reduce((sum, value, index) => sum + value * [0.2126, 0.7152, 0.0722][index], 0);
    }
    const style = getComputedStyle(document.body);
    const foreground = channels(style.color);
    const background = channels(style.backgroundColor);
    const lighter = Math.max(luminance(foreground), luminance(background));
    const darker = Math.min(luminance(foreground), luminance(background));
    return {
      background: style.backgroundColor,
      color: style.color,
      contrast: (lighter + 0.05) / (darker + 0.05)
    };
  });
  await page.evaluate(() => document.documentElement.setAttribute("data-theme", "dark"));
  const manual = await themeSnapshot();
  expect(manual.background).not.toBe("rgba(0, 0, 0, 0)");
  expect(manual.contrast, `${row.english.id}: manual dark body contrast`).toBeGreaterThanOrEqual(4.5);
  await page.emulateMedia({ colorScheme: "dark" });
  await page.evaluate(() => document.documentElement.setAttribute("data-theme", "system"));
  const system = await themeSnapshot();
  expect(await page.evaluate(() => matchMedia("(prefers-color-scheme: dark)").matches)).toBeTruthy();
  expect(system.background).not.toBe("rgba(0, 0, 0, 0)");
  expect(system.contrast, `${row.english.id}: system dark body contrast`).toBeGreaterThanOrEqual(4.5);
  return { manual, system, reflow };
}

async function verifyDownload(page, selector, format, expectation) {
  const button = page.locator(selector).first();
  await expect(button, `${format} export`).toBeVisible();
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    button.click()
  ]);
  const diskPath = await download.path();
  expect(diskPath, `${format}: download path`).toBeTruthy();
  const bytes = fs.readFileSync(diskPath);
  expect(bytes.length, `${format}: non-empty download`).toBeGreaterThan(8);
  let pdfProof = null;
  if (format === "json") {
    const parsed = JSON.parse(bytes.toString("utf8"));
    expect(Object.keys(parsed).length).toBeGreaterThan(1);
  } else if (format === "pdf") {
    const parsed = await pdfParse(bytes);
    const parsedText = pdfComparable(parsed.text);
    expect(parsed.numpages, `${expectation.id}: parsed PDF pages`).toBeGreaterThanOrEqual(1);
    expect(parsedText, `${expectation.id}: route-specific PDF title`)
      .toContain(pdfComparable(expectation.title));
    for (const line of expectation.exactResultLines) {
      expect(parsedText, `${expectation.id}: exact PDF result line ${line}`)
        .toContain(pdfComparable(line));
    }
    for (const line of expectation.boundaryLines) {
      expect(parsedText, `${expectation.id}: PDF boundary/source line ${line}`)
        .toContain(pdfComparable(line));
    }
    pdfProof = {
      parsedPages: parsed.numpages,
      parsedTextSha256: sha(parsedText)
    };
  } else if (format === "csv") {
    expect(bytes.toString("utf8")).toMatch(/,|;/);
  } else if (format === "qr") {
    expect(Array.from(bytes.subarray(0, 8))).toEqual([137, 80, 78, 71, 13, 10, 26, 10]);
  } else {
    expect(bytes.toString("utf8").trim().length).toBeGreaterThan(10);
  }
  return {
    suggestedFilename: download.suggestedFilename(),
    bytes: bytes.length,
    sha256: sha(bytes),
    ...(pdfProof || {})
  };
}

async function verifyGeneratedExports(page, row) {
  const exports = {};
  for (const format of row.exports) {
    const selector = `[data-ua-export="${format}"]`;
    if (format === "copy") {
      await page.locator(selector).click();
      await expect(page.locator(selector)).toContainText(/Copi/i);
      exports.copy = { status: "clipboard-confirmed" };
    } else if (format === "print") {
      await page.evaluate(() => { window.print = () => { window.__uaPrintCalled = true; }; });
      await page.locator(selector).click();
      expect(await page.evaluate(() => window.__uaPrintCalled)).toBeTruthy();
      exports.print = { status: "dialog-hook-confirmed" };
    } else {
      exports[format] = await verifyDownload(page, selector, format, {
        id: row.english.id,
        ...generatedPdfExpectation(row)
      });
    }
  }
  return exports;
}

async function verifyNativeExports(page, row, pdfExpectation) {
  const exports = {};
  for (const format of row.exports) {
    if (format === "copy") {
      const selector = nativeCopySelectors[row.english.id];
      await expect(page.locator(selector).first()).toBeVisible();
      await page.locator(selector).first().click();
      exports.copy = { status: "copy-action-confirmed" };
    } else if (format === "print") {
      await page.evaluate(() => { window.print = () => { window.__uaPrintCalled = true; }; });
      await page.locator('[data-native-export="print"]').click();
      expect(await page.evaluate(() => window.__uaPrintCalled)).toBeTruthy();
      exports.print = { status: "dialog-hook-confirmed" };
    } else {
      const selector = format === "qr" ? "#downloadQr" :
        row.english.id === "ajo-chama-calc" && format === "csv" ? "#csvBtn" :
        row.english.id === "remittance-compare" && format === "json" ? "#frRemitJson" :
          `[data-native-export="${format}"]`;
      exports[format] = await verifyDownload(page, selector, format, pdfExpectation);
    }
  }
  return exports;
}

async function generatedWorkflow(page, row) {
  await clickAction(page, "[data-ua-form] button[type=submit]");
  const result = page.locator("[data-ua-result]");
  await expect(result).toBeVisible();
  const baseline = (await result.innerText()).trim();
  expect(baseline.length).toBeGreaterThan(20);
  const [fieldKey, mutation] = generatedMutation[row.english.id];
  const field = page.locator(`[data-ua-field="${fieldKey}"]`);
  if (await field.evaluate((node) => node.tagName.toLowerCase()) === "select") {
    await field.selectOption(mutation);
  } else {
    await field.fill(mutation);
  }
  await clickAction(page, "[data-ua-form] button[type=submit]");
  const changed = (await result.innerText()).trim();
  expect(changed, `${row.english.id}: meaningful result mutation`).not.toBe(baseline);
  const resultA11y = await assertResultA11y(page, row, "[data-ua-result]");
  const exports = await verifyGeneratedExports(page, row);
  if (row.english.id === "africa-conflict") {
    await page.evaluate(() => {
      window.AfroConflict.getConflicts = async function () { return []; };
    });
  }
  const [invalidKey, invalidValue] = generatedInvalid[row.english.id];
  const invalidField = page.locator(`[data-ua-field="${invalidKey}"]`);
  const invalidTag = await invalidField.evaluate((node) => node.tagName.toLowerCase());
  if (invalidTag === "select") {
    await invalidField.evaluate((node, value) => {
      if (!Array.from(node.options).some((option) => option.value === value)) {
        const option = document.createElement("option");
        option.value = value;
        option.textContent = value;
        node.appendChild(option);
      }
      node.value = value;
    }, invalidValue);
  } else {
    await invalidField.fill(invalidValue);
  }
  await clickAction(page, "[data-ua-form] button[type=submit]");
  await expect(page.locator("[data-ua-status]")).toHaveClass(/ua-error/);
  expect((await page.locator("[data-ua-status]").innerText()).trim().length,
    `${row.english.id}: explicit localized error`).toBeGreaterThan(8);
  expect(await page.locator("[data-ua-metrics]").innerText(), `${row.english.id}: invalid clears stale metrics`).toBe("");
  return { baselineHash: sha(baseline), mutationHash: sha(changed), resultA11y, exports };
}

async function nativeWorkflow(page, row, fixture) {
  await fillValues(page, fixture.fields);
  await clickAction(page, fixture.action);
  const result = page.locator(fixture.result);
  await expect(result).toBeVisible();
  const baseline = (await result.innerText()).trim();
  expect(baseline.length, `${row.english.id}: meaningful native result`).toBeGreaterThan(2);
  await page.evaluate(() => { window.__uaNativeScenarioCount = 4; });
  const baselineSemantic = await captureNativeSemantic(page, row.english.id, "fr");
  await fillValues(page, fixture.mutation);
  await page.evaluate(() => { window.__uaNativeScenarioCount = 7; });
  await clickAction(page, fixture.action);
  const changed = (await result.innerText()).trim();
  expect(changed, `${row.english.id}: native result mutation`).not.toBe(baseline);
  const mutationSemantic = await captureNativeSemantic(page, row.english.id, "fr");
  const resultA11y = await assertResultA11y(page, row, fixture.result);
  const nativePdfPayload = row.english.id === "japa-calculator"
    ? await page.evaluate(() => ({
      total: document.querySelector("#jb-primary-value").textContent.trim(),
      gap: document.querySelector("#jb-result-list .rm-result:nth-child(4) strong").textContent.trim(),
      target: document.querySelector("#jb-result-list .rm-result:nth-child(5) strong").textContent.trim()
    }))
    : null;
  const exports = await verifyNativeExports(page, row, nativePdfExpectation(row, nativePdfPayload));
  await fillValues(page, fixture.invalid);
  await clickAction(page, fixture.action);
  const errorText = await page.locator('[data-native-guard-status], [role="status"], #status, #susuStatus, #waLine, #remitStatus, #ua-bp-status').allTextContents();
  expect(errorText.join(" ").trim().length, `${row.english.id}: explicit invalid state`).toBeGreaterThan(8);
  const invalidSelector = Object.keys(fixture.invalid)[0];
  await expect(page.locator(invalidSelector), `${row.english.id}: invalid field state`).toHaveAttribute("aria-invalid", "true");
  return {
    baselineHash: sha(baseline),
    mutationHash: sha(changed),
    semanticScenarios: [baselineSemantic, mutationSemantic],
    resultA11y,
    exports
  };
}

async function captureEnglishOwnerOracle(page, row, fixture) {
  const owner = fixture.english || fixture;
  const semanticScenarios = [];
  const resultHashes = [];
  const scenarios = [
    owner.fields,
    { ...owner.fields, ...nativeEnglishMutations[row.english.id] }
  ];
  for (let index = 0; index < scenarios.length; index += 1) {
    await page.goto(row.english.route, { waitUntil: "domcontentloaded" });
    await fillValues(page, scenarios[index]);
    await page.evaluate((count) => { window.__uaNativeScenarioCount = count; }, index === 0 ? 4 : 7);
    if (owner.action) await clickAction(page, owner.action);
    const result = page.locator(owner.result);
    await expect(result).toBeVisible();
    const value = (await result.innerText()).trim();
    expect(value.length, `${row.english.id}: English owner oracle result scenario ${index + 1}`).toBeGreaterThan(2);
    resultHashes.push(sha(value));
    semanticScenarios.push(await captureNativeSemantic(page, row.english.id, "en"));
  }
  return {
    fixtureHashes: scenarios.map((scenario) => sha(JSON.stringify(scenario))),
    resultHashes,
    semanticScenarios
  };
}

test.describe.configure({ mode: "serial", timeout: 240000 });

test.beforeAll(async ({ request, baseURL }) => {
  expect(baseURL, "Playwright must provide its configured baseURL").toBeTruthy();
  const entries = activeCheckoutSentinelEntries();
  for (const entry of entries) {
    const response = await request.get(new URL(`/${entry.path}`, baseURL).href);
    expect(response.status(), `active-checkout sentinel response for ${entry.path}`).toBe(200);
    expect(sha(await response.body()), `served checkout fingerprint for ${entry.path}`).toBe(entry.sha256);
  }
  rootSentinelProof = {
    strategy: "active-checkout-content-fingerprint",
    files: entries,
    sha256: activeCheckoutSentinelDigest(entries),
    validated: true
  };
});

test.afterAll(() => {
  fs.mkdirSync(evidenceDir, { recursive: true });
  fs.writeFileSync(pendingProofPath, JSON.stringify({
    schemaVersion: 1,
    category: "uniquely-african",
    denominator: 34,
    status: proofRows.length === 34 ? "browser-proof-complete" : "incomplete",
    baseUrlSource: "playwright-config",
    rootSentinel: rootSentinelProof,
    fixtures: "synthetic local read-only API fixtures; no production or live-data claim",
    routes: proofRows
  }, null, 2) + "\n");
});

test("34 French routes plus hub have genuine 320px 200% text reflow", async ({ page }) => {
  test.setTimeout(480000);
  const routes = [];
  await installNetworkFixtures(page);
  for (const row of manifest.rows) {
    await page.goto(row.french.route, { waitUntil: "domcontentloaded" });
    const initial = await captureReflowDiagnostics(page, row.english.id, "initial");
    const fixture = nativeFixtures.routes.find((item) => item.id === row.english.id);
    if (fixture) {
      await fillValues(page, fixture.fields);
      await clickAction(page, fixture.action);
    } else {
      await clickAction(page, "[data-ua-form] button[type=submit]");
    }
    const result = await captureReflowDiagnostics(page, row.english.id, "result");
    routes.push({ id: row.english.id, initial, result });
  }
  await page.goto("/fr/uniquely-african/", { waitUntil: "domcontentloaded" });
  routes.push({
    id: "uniquely-african-hub",
    initial: await captureReflowDiagnostics(page, "uniquely-african-hub", "initial")
  });
  fs.mkdirSync(evidenceDir, { recursive: true });
  fs.writeFileSync(reflowDiagnosticsPath, JSON.stringify({
    schemaVersion: 1,
    viewport: "fixed 320 CSS px",
    textScale: "computed root 16px to exact 32px",
    routeCount: routes.length,
    routes
  }, null, 2) + "\n");
  const failures = routes.flatMap((route) =>
    ["initial", "result"].filter((state) => route[state]).map((state) => route[state])
  )
    .filter((proof) =>
      Math.max(proof.documentOverflow, proof.bodyOverflow) > 2 ||
      proof.viewportLeaks.length > 0 ||
      proof.textRangeViewportLeaks.length > 0 ||
      proof.clippedRectangles.length > 0 ||
      proof.textRangeClippedRectangles.length > 0
    )
    .map((proof) => ({
      id: proof.id,
      state: proof.state,
      documentOverflow: proof.documentOverflow,
      bodyOverflow: proof.bodyOverflow,
      viewportLeaks: proof.viewportLeaks,
      clippedRectangles: proof.clippedRectangles,
      textRangeViewportLeaks: proof.textRangeViewportLeaks,
      textRangeClippedRectangles: proof.textRangeClippedRectangles
    }));
  expect(failures, "all 34 routes plus hub fixed-viewport reflow diagnostics").toEqual([]);
});

for (const row of manifest.rows) {
  test(`${String(row.index).padStart(2, "0")} ${row.english.id} physical route acceptance`, async ({ page, context, baseURL }) => {
    expect(baseURL, "Playwright must provide its configured baseURL").toBeTruthy();
    const configuredOrigin = new URL(baseURL).origin;
    const fixture = nativeFixtures.routes.find((item) => item.id === row.english.id);
    let englishOracle = null;
    if (fixture) {
      const ownerPage = await context.newPage();
      await installNetworkFixtures(ownerPage);
      englishOracle = await captureEnglishOwnerOracle(ownerPage, row, fixture);
      await ownerPage.close();
    }

    const telemetry = {
      consoleErrors: [],
      pageErrors: [],
      requestFailures: [],
      mutations: [],
      analyticsPosts: [],
      privacyMarkers: [],
      exfiltration: [],
      thirdPartyWrites: [],
      successfulThirdPartyWrites: []
    };
    page.on("console", (message) => {
      if (message.type() === "error") telemetry.consoleErrors.push(message.text());
    });
    page.on("pageerror", (error) => telemetry.pageErrors.push(error.message));
    page.on("requestfailed", (request) => {
      const hostname = new URL(request.url()).hostname;
      if (!/google-analytics|googlesyndication|google\.com$/i.test(hostname)) {
        telemetry.requestFailures.push(`${request.method()} ${request.url()}`);
      }
    });
    page.on("request", (request) => {
      const url = new URL(request.url());
      const method = request.method().toUpperCase();
      const analytics = /google-analytics|googlesyndication|google\.com$/i.test(url.hostname);
      const firstParty = url.origin === configuredOrigin || /(?:^|\.)afrotools\.com$/i.test(url.hostname);
      const serialized = [
        method,
        request.url(),
        JSON.stringify(request.headers()),
        request.postData() || ""
      ].join("\n").toLowerCase();
      const leaked = telemetry.privacyMarkers.find((marker) => serialized.includes(String(marker).toLowerCase()));
      if (leaked) telemetry.exfiltration.push(`${method} ${request.url()} marker=${leaked}`);
      if (/^(POST|PUT|PATCH|DELETE)$/i.test(method) && firstParty) {
        telemetry.mutations.push(`${request.method()} ${request.url()}`);
      } else if (/^(POST|PUT|PATCH|DELETE)$/i.test(method) && analytics) {
        telemetry.analyticsPosts.push(`${request.method()} ${url.origin}${url.pathname}`);
      } else if (!firstParty && !analytics && !/^(GET|HEAD|OPTIONS)$/i.test(method)) {
        telemetry.thirdPartyWrites.push(`${method} ${request.url()}`);
      }
    });
    page.on("response", (response) => {
      const request = response.request();
      const url = new URL(request.url());
      const method = request.method().toUpperCase();
      const analytics = /google-analytics|googlesyndication|google\.com$/i.test(url.hostname);
      const firstParty = url.origin === configuredOrigin || /(?:^|\.)afrotools\.com$/i.test(url.hostname);
      if (!firstParty && !analytics && !/^(GET|HEAD|OPTIONS)$/i.test(method) && response.status() < 400) {
        telemetry.successfulThirdPartyWrites.push(`${method} ${request.url()} ${response.status()}`);
      }
    });
    await installNetworkFixtures(page);
    await context.grantPermissions(["clipboard-read", "clipboard-write"], { origin: configuredOrigin });
    await page.setViewportSize({ width: 375, height: 900 });
    await page.goto(row.french.route, { waitUntil: "domcontentloaded" });

    await expect(page.locator("body")).toHaveAttribute("data-fr-ua-app", row.english.id);
    const hreflangGroup = await assertMetadata(page, row);
    const artwork = await assertArtwork(page, row);
    await assertA11y(page, row);
    const workflow = fixture
      ? await nativeWorkflow(page, row, fixture)
      : await generatedWorkflow(page, row);

    if (englishOracle) {
      expect(workflow.semanticScenarios,
        `${row.english.id}: exact same-fixture English/French semantic result equality across varied complete results`)
        .toEqual(englishOracle.semanticScenarios);
    }

    await probePrivacyInputs(page, telemetry);
    await assertRuntimeSafety(page, row, telemetry);
    const themes = await assertReflowAndThemes(page, row);
    expect(telemetry.consoleErrors, `${row.english.id}: console errors`).toEqual([]);
    expect(telemetry.pageErrors, `${row.english.id}: page errors`).toEqual([]);
    expect(telemetry.requestFailures, `${row.english.id}: failed requests`).toEqual([]);

    proofRows.push({
      index: row.index,
      id: row.english.id,
      englishRoute: row.english.route,
      frenchRoute: row.french.route,
      accepted: true,
      ownerOracle: englishOracle || {
        fixture: engineFixtures.routes.find((item) => item.id === row.english.id) ? "captured-engine-fixture" : "missing"
      },
      outputOracle: workflow,
      browser: {
        widths: [320, 375],
        reflow: {
          viewport: 320,
          rootFontSize: [themes.reflow.baselineRootFontSize, themes.reflow.rootFontSize],
          documentOverflow: themes.reflow.documentOverflow,
          bodyOverflow: themes.reflow.bodyOverflow,
          visibleDescendantLeaks: themes.reflow.viewportLeaks,
          clippedRectangles: themes.reflow.clippedRectangles,
          textRangeViewportLeaks: themes.reflow.textRangeViewportLeaks,
          textRangeClippedRectangles: themes.reflow.textRangeClippedRectangles
        },
        keyboardAndLabels: "pass",
        manualDark: themes.manual,
        systemDark: themes.system,
        consoleErrors: 0,
        pageErrors: 0,
        requestFailures: 0,
        stateChangingNetworkRequests: 0,
        consentDeniedAnalyticsPosts: telemetry.analyticsPosts.length
      },
      seo: {
        canonical: row.french.route,
        reciprocalEnglish: row.english.route,
        hreflangGroup,
        inLanguage: "fr",
        aiRoute: row.english.id
      },
      privacy: "local-first; read-only synthetic fixtures only",
      artwork: { ...row.artwork, rendered: artwork }
    });
  });
}

test("hub exposes exactly 34 unique French physical routes", async ({ page }) => {
  await page.goto("/fr/uniquely-african/", { waitUntil: "domcontentloaded" });
  const hrefs = await page.locator("main a[href^='/fr/tools/']").evaluateAll((links) => links.map((link) => link.getAttribute("href")));
  expect(new Set(hrefs)).toEqual(new Set(manifest.rows.map((row) => row.french.route)));
  expect(hrefs.length).toBe(34);
});
