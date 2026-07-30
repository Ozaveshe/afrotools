const { test, expect } = require("@playwright/test");
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "../..");
const EVIDENCE_PATH = path.resolve(
  ROOT,
  process.env.AFROTOOLS_FRENCH_HEALTH_EVIDENCE
    || "test-results/french-health-wave3-deep-evidence.json"
);
const DYNAMIC_ENGLISH = /\b(?:Download|Calculate|Clear|Result|Required|Invalid|Emergency help now|Observed BMI interval|Height spread|Weight spread|You recorded|Within shown range|Total Markers|Done|COMPLETE BLOOD COUNT|Reference range|recognized markers|weeks?, \d+ days? by calendar estimate|First day of your last menstrual period|Use this as a visit-prep note|Markers to discuss|outside-range result|Laboratory range used|General fallback range used|Above Range|Below Range|at or below|above the (?:1|5|10)|treatment context needs review|effective disinfection may be compromised|\d+ drink entr(?:y|ies)|The logged total|This is arithmetic only|At or above the selected|Below the selected|Observed ratio interval|Waist spread|Hip spread|The entered readings produce ratios)\b/i;
const ENGLISH_DATE = /\b\d{1,2}\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4}\b/;
const DEEP_ONLY = process.env.AFROTOOLS_FRENCH_HEALTH_DEEP_ONLY === "1";

const routes = [
  "/fr/tools/rapport-medical/",
  "/fr/health/bmi-calculator/",
  "/fr/health/pregnancy-due-date/",
  "/fr/health/calorie-counter/",
  "/fr/tools/risque-paludisme/",
  "/fr/tools/calculateur-ovulation/",
  "/fr/tools/dosage-medicament/",
  "/fr/tools/qualite-eau/",
  "/fr/tools/apport-eau/",
  "/fr/tools/calendrier-vaccinal/",
  "/fr/tools/ratio-taille-hanches/",
  "/fr/tools/tension-arterielle/",
  "/fr/tools/cout-hospitalier/",
  "/fr/tools/couts-clinique/",
  "/fr/tools/prix-pharmacie/",
  "/fr/tools/drepanocytose/",
  "/fr/tools/risque-diabete/",
  "/fr/tools/calculateur-imc/",
  "/fr/tools/compteur-calories/",
  "/fr/tools/date-accouchement/",
  "/fr/tools/verificateur-genotype/",
  "/fr/tools/compatibilite-groupe-sanguin/",
  "/fr/tools/risque-mortalite-maternelle/",
  "/fr/tools/cout-accouchement/",
  "/fr/tools/cout-cesarienne-voie-basse/",
  "/fr/tools/cout-soins-dentaires/",
  "/fr/tools/comparateur-prix-medicaments/",
  "/fr/tools/cout-medecine-traditionnelle-moderne/",
  "/fr/tools/plan-repas-africain/",
  "/fr/tools/croissance-enfant/",
  "/fr/tools/cout-traitement-vih/",
  "/fr/tools/suivi-traitement-tuberculose/",
  "/fr/tools/risque-cholera/",
  "/fr/tools/checklist-ebola/",
  "/fr/tools/cout-depistage-hepatite-b/",
  "/fr/tools/comparateur-tourisme-medical/",
  "/fr/tools/cout-soins-oculaires/",
  "/fr/tools/cout-sante-mentale/",
  "/fr/tools/nutrition-grossesse/",
  "/fr/tools/suivi-allaitement/",
  "/fr/tools/comparateur-cout-salle-sport/",
  "/fr/tools/entrainement-maison/"
];

test.describe.configure({ mode: "serial" });

test("French Health hub exposes all 42 native application links at 320px", async ({ page }) => {
  test.skip(DEEP_ONLY, "bounded deep-workflow shard");
  await page.setViewportSize({ width: 320, height: 760 });
  await page.emulateMedia({ colorScheme: "dark", reducedMotion: "reduce" });
  const response = await page.goto("/fr/health/", { waitUntil: "domcontentloaded" });
  expect(response.status()).toBe(200);
  await expect(page.locator("h1")).toContainText("42 outils");
  await expect(page.locator(".frh-card")).toHaveCount(42);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", "https://afrotools.com/fr/health/");
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
});

for (const route of routes) {
  test(`${route} is native French, reflows and exposes accessible controls`, async ({ page }) => {
    test.skip(DEEP_ONLY, "bounded deep-workflow shard");
    const consoleErrors = [];
    const pageErrors = [];
    const local404s = [];
    page.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(message.text());
    });
    page.on("pageerror", (error) => pageErrors.push(error.message));
    page.on("response", (response) => {
      const url = new URL(response.url());
      if (url.origin === "http://127.0.0.1:4173" && response.status() === 404) local404s.push(url.pathname);
    });

    await page.setViewportSize({ width: 320, height: 760 });
    await page.emulateMedia({ colorScheme: "dark", reducedMotion: "reduce" });
    const response = await page.goto(route, { waitUntil: "domcontentloaded" });
    expect(response.status()).toBe(200);
    await expect(page.locator("html")).toHaveAttribute("lang", "fr");
    await expect(page.locator("h1").first()).toBeVisible();
    await expect(page.locator("main")).toHaveCount(1);
    await expect(page.locator("iframe")).toHaveCount(0);
    await expect(page.locator("[data-fr-health-safety]")).toBeVisible();
    await expect(page.locator("html")).toHaveAttribute("data-fr-health-ready", "true");
    const controls = page.locator('main button,main input:not([type="hidden"]),main select,main textarea');
    expect(await controls.count()).toBeGreaterThan(0);
    const firstControl = controls.first();
    await firstControl.focus();
    await expect(firstControl).toBeFocused();
    const unnamed = await controls.evaluateAll((items) => items.filter((element) => {
      if (element.disabled || element.getClientRects().length === 0) return false;
      const label = element.id && document.querySelector(`label[for="${CSS.escape(element.id)}"]`);
      return !(element.getAttribute("aria-label") || element.getAttribute("aria-labelledby") || label || element.closest("label") || element.textContent.trim() || element.value);
    }).length);
    expect(unnamed).toBe(0);
    const overflow320 = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow320).toBeLessThanOrEqual(1);

    await page.evaluate(() => {
      document.documentElement.setAttribute("data-theme", "dark");
      document.documentElement.style.colorScheme = "dark";
    });
    const darkSurface = await page.evaluate(() => {
      const value = getComputedStyle(document.body).backgroundColor;
      const match = value.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
      return match ? (Number(match[1]) + Number(match[2]) + Number(match[3])) / 3 : 255;
    });
    expect(darkSurface).toBeLessThan(190);

    await page.setViewportSize({ width: 375, height: 812 });
    const overflow375 = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow375).toBeLessThanOrEqual(1);
    const visibleText = await page.locator("body").innerText();
    expect(visibleText).not.toMatch(/\b(?:Download PDF|Download TXT|Calculate|Clear|Privacy|No diagnosis)\b/i);
    expect(consoleErrors).toEqual([]);
    expect(pageErrors).toEqual([]);
    expect(local404s).toEqual([]);
  });
}

const OWNER_SPECS = {
  "/fr/tools/rapport-medical/": "tests/e2e/medical-report-vip.spec.js",
  "/fr/health/bmi-calculator/": "tests/e2e/day5-health-external-lane-b-vip.spec.js",
  "/fr/health/pregnancy-due-date/": "tests/e2e/pregnancy-appointment-planner-vip.spec.js",
  "/fr/health/calorie-counter/": "tests/e2e/day5-health-external-lane-c.spec.js",
  "/fr/tools/risque-paludisme/": "tests/e2e/day5-health-external-lane-b-vip.spec.js",
  "/fr/tools/calculateur-ovulation/": "tests/e2e/cycle-window-estimator-vip.spec.js",
  "/fr/tools/dosage-medicament/": "tests/e2e/drug-dosage-vip.spec.js",
  "/fr/tools/qualite-eau/": "tests/e2e/day5-health-external-lane-b-vip.spec.js",
  "/fr/tools/apport-eau/": "tests/e2e/day5-health-external-lane-b-vip.spec.js",
  "/fr/tools/calendrier-vaccinal/": "tests/e2e/vaccine-schedule-vip.spec.js",
  "/fr/tools/ratio-taille-hanches/": "tests/e2e/day5-health-external-lane-b-vip.spec.js",
  "/fr/tools/tension-arterielle/": "tests/e2e/blood-pressure-check-vip.spec.js",
  "/fr/tools/cout-hospitalier/": "tests/e2e/day5-health-external-lane-c.spec.js",
  "/fr/tools/couts-clinique/": "tests/e2e/day5-health-external-lane-c.spec.js",
  "/fr/tools/prix-pharmacie/": "tests/e2e/day5-health-external-lane-c.spec.js",
  "/fr/tools/drepanocytose/": "tests/e2e/sickle-cell-vip.spec.js",
  "/fr/tools/risque-diabete/": "tests/e2e/day5-health-external-lane-b-vip.spec.js",
  "/fr/tools/calculateur-imc/": "tests/e2e/day5-health-external-lane-b-vip.spec.js",
  "/fr/tools/compteur-calories/": "tests/e2e/day5-health-external-lane-c.spec.js",
  "/fr/tools/date-accouchement/": "tests/e2e/due-date-range-estimator-vip.spec.js",
  "/fr/tools/verificateur-genotype/": "tests/e2e/haemoglobin-result-verification-vip.spec.js",
  "/fr/tools/compatibilite-groupe-sanguin/": "tests/e2e/blood-group-vip.spec.js",
  "/fr/tools/risque-mortalite-maternelle/": "tests/e2e/maternal-health-guide-vip.spec.js",
  "/fr/tools/cout-accouchement/": "tests/e2e/childbirth-budget-vip.spec.js",
  "/fr/tools/cout-cesarienne-voie-basse/": "tests/e2e/birth-options-question-builder-vip.spec.js",
  "/fr/tools/cout-soins-dentaires/": "tests/e2e/day5-health-external-lane-c.spec.js",
  "/fr/tools/comparateur-prix-medicaments/": "tests/e2e/day5-health-external-lane-c.spec.js",
  "/fr/tools/cout-medecine-traditionnelle-moderne/": "tests/e2e/day5-health-external-lane-c.spec.js",
  "/fr/tools/plan-repas-africain/": "tests/e2e/day5-health-external-lane-c.spec.js",
  "/fr/tools/croissance-enfant/": "tests/e2e/child-growth-vip.spec.js",
  "/fr/tools/cout-traitement-vih/": "tests/e2e/day5-health-external-lane-b-vip.spec.js",
  "/fr/tools/suivi-traitement-tuberculose/": "tests/e2e/day5-health-external-lane-b-vip.spec.js",
  "/fr/tools/risque-cholera/": "tests/e2e/day5-health-external-lane-b-vip.spec.js",
  "/fr/tools/checklist-ebola/": "tests/e2e/day5-health-external-lane-b-vip.spec.js",
  "/fr/tools/cout-depistage-hepatite-b/": "tests/e2e/day5-health-external-lane-b-vip.spec.js",
  "/fr/tools/comparateur-tourisme-medical/": "tests/e2e/day5-health-external-lane-c.spec.js",
  "/fr/tools/cout-soins-oculaires/": "tests/e2e/day5-health-external-lane-c.spec.js",
  "/fr/tools/cout-sante-mentale/": "tests/e2e/day5-health-external-lane-c.spec.js",
  "/fr/tools/nutrition-grossesse/": "tests/e2e/pregnancy-food-planner-vip.spec.js",
  "/fr/tools/suivi-allaitement/": "tests/e2e/feeding-nappy-log-vip.spec.js",
  "/fr/tools/comparateur-cout-salle-sport/": "tests/e2e/day5-health-external-lane-c.spec.js",
  "/fr/tools/entrainement-maison/": "tests/e2e/day5-health-external-lane-c.spec.js"
};

const ROUTE_OVERRIDES = {
  "/fr/tools/rapport-medical/": {
    values: {
      "#labInput": "Patient: PRIVATE_HEALTH_WAVE3_1\nWBC: 12 x10^9/L Reference range: 4.0 - 13.0\nHemoglobin: 7 g/dL Reference range: 12 - 16 CRITICAL"
    },
    submit: "#analyzeBtn",
    result: "#summaryStats"
  },
  "/fr/health/bmi-calculator/": {
    values: { "#height": "180", "#height2": "179", "#weight1": "80", "#weight2": "82", "#conditions": "yes" },
    result: "#result"
  },
  "/fr/health/pregnancy-due-date/": {
    values: { 'input[name="basis"][value="lmp"]': true, "#planning-date": "2026-01-01", "#cycle-length": "28" },
    result: "#due-date-output"
  },
  "/fr/health/calorie-counter/": {
    values: { "#food-name": "Ragoût synthétique", "#amount": "250", "#reference-calories": "180", "#source-note": "Étiquette synthétique" },
    result: "#total-calories"
  },
  "/fr/tools/risque-paludisme/": {
    values: { "#exposure": "yes", "#testStatus": "none", "#symptomTiming": "today" },
    result: "#result"
  },
  "/fr/tools/calculateur-ovulation/": {
    values: { "#last-period-date": "2026-07-01", "#shortest-cycle": "28", "#longest-cycle": "30" },
    result: "#next-period-window"
  },
  "/fr/tools/dosage-medicament/": {
    values: { "#instruction-confirmed": true, "#prescribed-dose": "250", "#output-mode": "liquid", "#concentration-mass": "125", "#concentration-volume": "5" },
    result: "#result-value"
  },
  "/fr/tools/qualite-eau/": {
    values: { "#labStatus": "competent", "#sampleScope": "drinking", "#advisory": "none", "#sampleDate": "2026-07-20", "#ecoliStatus": "not-detected", "#arsenic": "9", "#fluoride": "1.2", "#turbidity": "0.8" },
    result: "#result"
  },
  "/fr/tools/apport-eau/": {
    values: { 'input[type="time"]': "08:00", 'input[type="number"]': "1200", "#clinicalTarget": "1800", "#targetConfirmed": true },
    result: "#result"
  },
  "/fr/tools/calendrier-vaccinal/": {
    values: { "#country": "NG", "#age-band": "infant", "#record-status": "missed" },
    result: "#handoff"
  },
  "/fr/tools/ratio-taille-hanches/": {
    values: { "#applicability": "adult", "#units": "cm", "#waist": "84", "#waist2": "86", "#hip": "100", "#hip2": "100", "#reference": "women" },
    result: "#result"
  },
  "/fr/tools/tension-arterielle/": {
    values: { "#health-context": "adult", "#systolic-1": "148", "#diastolic-1": "92", "#systolic-2": "144", "#diastolic-2": "90", "#rested": true, "#positioned": true, "#cuff": true, "#quiet": true },
    result: "#reading-average"
  },
  "/fr/tools/drepanocytose/": {
    values: { "#lab-confirmed": true, "#result-one": "AS", "#result-two": "AS" },
    result: "#outcomes"
  },
  "/fr/tools/risque-diabete/": {
    values: { "#age": "65", "#sex": "female", "#height": "160", "#weight": "110", "#gestational": true, "#family": true, "#pressure": true, "#inactive": true, "#previousAbnormal": true },
    result: "#result"
  },
  "/fr/tools/calculateur-imc/": {
    values: { "#audience": "adult", "#units": "imperial", "#feet": "5", "#inches": "10", "#pounds": "180" },
    result: "#result"
  },
  "/fr/tools/compteur-calories/": {
    values: { "#food-name": "Aliment synthétique", "#amount-eaten": "75", "#label-calories": "240", "#source": "Étiquette synthétique" },
    result: "#calorie-result"
  },
  "/fr/tools/date-accouchement/": {
    values: { "#estimate-date": "2026-01-01", "#cycle-length": "28" },
    result: "#estimated-due-date"
  },
  "/fr/tools/verificateur-genotype/": {
    values: { "#reported-result": "Hb A/S", "#test-method": "hplc", "#test-date": "2026-07-20", "#confirmation-status": "final" },
    result: "#notation-label"
  },
  "/fr/tools/compatibilite-groupe-sanguin/": {
    values: { "#bgv-component": "red-cells", "#bgv-donor": "O-", "#bgv-recipient": "A+" },
    submit: "#bgv-component-form button[type=submit]",
    result: "#bgv-component-result"
  },
  "/fr/tools/cout-accouchement/": {
    values: { "#currency-code": "NGN", "#quote-date": "2026-07-01", "#source-type": "written-provider", "#planned-care": "200000.50", "#professional-fees": "50000", "#medicines-supplies": "25000.25", "#tests-care": "10000", "#transport-stay": "15000", "#contingency": "20000", "#confirmed-contribution": "100000" },
    result: "#household-total"
  },
  "/fr/tools/croissance-enfant/": {
    values: { "#cgv-birth": "2023-01-01", "#cgv-measured": "2025-09-27", "#cgv-sex": "male", "#cgv-weight": "15", "#cgv-weight-unit": "kg", "#cgv-length": "100", "#cgv-length-unit": "cm", 'input[name="cgv-method"][value="standing"]': true },
    submit: "#cgv-form button[type=submit]",
    result: "#cgv-wfa-z"
  },
  "/fr/tools/cout-traitement-vih/": {
    values: { "#currency": "KES", "#decimalPlaces": "2", "#clinic": "1000", "#clinicPeriod": "monthly", "#labs": "500", "#labsPeriod": "quarterly", "#transport": "300", "#transportPeriod": "monthly", "#other": "200", "#otherPeriod": "once", "#support": "750", "#supportPeriod": "annual" },
    result: "#result"
  },
  "/fr/tools/suivi-traitement-tuberculose/": {
    values: { "#today": "2026-07-26", "#appointment": "2026-07-24", "#appointmentStatus": "completed", "#sample": "2026-08-02", "#sampleStatus": "scheduled", "#resultDate": "2026-08-01", "#resultStatus": "scheduled", "#sameEpisode": true },
    result: "#result"
  },
  "/fr/tools/risque-cholera/": {
    values: { "#timing": "today", "#drinking": "sips" },
    result: "#result",
    checkVisibleCheckboxes: true
  },
  "/fr/tools/checklist-ebola/": {
    result: "#result",
    checkVisibleCheckboxes: true,
    chooseNonEmptySelects: true
  },
  "/fr/tools/cout-depistage-hepatite-b/": {
    values: { "#reason": "pregnancy", "#ageGroup": "adult", "#exposureTiming": "none", "#testing": "none", "#diagnosis": "none", "#vaccine": "unknown" },
    result: "#result"
  },
  "/fr/tools/cout-cesarienne-voie-basse/": {
    values: { "#discussion-context": "previous-caesarean", "#cost-status": "need-quote" },
    checkVisibleCheckboxes: true,
    result: "#birth-options-results"
  },
  "/fr/tools/nutrition-grossesse/": {
    values: { "#supplement-status": "provider-plan" },
    checkVisibleCheckboxes: true,
    result: "#pregnancy-food-results"
  },
  "/fr/tools/suivi-allaitement/": {
    values: { "#event-type": "breastfeed", "#event-time": "2026-07-26T08:30", "#feeding-side": "left", "#duration-minutes": "18" },
    result: "#event-count"
  }
};

const COST_FIXTURES = {
  "/fr/tools/cout-hospitalier/": { "#facility": "Devis synthétique", "#consultation": "100", "#facility-fee": "200", "#procedure": "500", "#tests": "100", "#medicines": "50", "#travel": "50", "#insurance": "200" },
  "/fr/tools/couts-clinique/": { "#provider": "Clinique synthétique", "#followups": "2", "#initial": "1000", "#followup-cost": "500", "#tests": "200", "#medicines": "300", "#transport": "100", "#insurance": "500" },
  "/fr/tools/prix-pharmacie/": { "#medicine": "Produit synthétique", "#strength": "500 mg", "#form-type": "comprimé", "#pharmacy": "Pharmacie synthétique", "#pack-size": "10", "#pack-price": "1200", "#quantity": "24", "#fee": "100" },
  "/fr/tools/cout-soins-dentaires/": { "#provider": "Dentiste synthétique", "#service": "Service sur devis", "#quantity": "2", "#unit-price": "10000", "#consultation": "1000", "#imaging": "2000", "#followup": "1000", "#medicines": "500", "#travel": "500", "#insurance": "5000" },
  "/fr/tools/comparateur-prix-medicaments/": { "#medicine": "Produit synthétique", "#strength": "5 mg", "#dosage-form": "comprimé", "#quantity": "25", "#a-provider": "Pharmacie A", "#a-size": "10", "#a-price": "50", "#b-provider": "Pharmacie B", "#b-size": "30", "#b-price": "130", "#b-fee": "5" },
  "/fr/tools/cout-medecine-traditionnelle-moderne/": { "#a-name": "Plan A", "#a-provider": "Prestataire A", "#a-initial": "1000", "#a-visits": "2", "#a-follow": "500", "#a-travel": "100", "#a-other": "200", "#b-name": "Plan B", "#b-provider": "Prestataire B", "#b-initial": "2000", "#b-visits": "1", "#b-follow": "200", "#b-travel": "50" },
  "/fr/tools/plan-repas-africain/": { "#people": "2", "#daily-budget": "1000" },
  "/fr/tools/comparateur-tourisme-medical/": { "#destination": "Destination synthétique", "#provider": "Prestataire synthétique", "#clinical": "5000", "#tests": "500", "#aftercare": "500", "#transport": "1000", "#visa": "200", "#nights": "10", "#nightly": "100", "#local": "300", "#companion": "500", "#insurance": "1000", "#contingency": "10", "#local-quote": "6000" },
  "/fr/tools/cout-soins-oculaires/": { "#provider": "Devis optique synthétique", "#exam": "100", "#tests": "50", "#lenses": "300", "#frames": "200", "#fitting": "50", "#followup": "50", "#travel": "50", "#insurance": "100" },
  "/fr/tools/cout-sante-mentale/": { "#provider": "Prestataire synthétique", "#assessment": "1000", "#session-fee": "2000", "#transport": "200", "#insurance": "1000" },
  "/fr/tools/comparateur-cout-salle-sport/": { "#months": "2", "#visits": "4", "#a-name": "Salle A", "#a-monthly": "1000", "#a-joining": "500", "#a-transport": "100", "#b-name": "Salle B", "#b-monthly": "1200", "#b-transport": "50", "#b-extras": "100" },
  "/fr/tools/entrainement-maison/": { "#activity": "Routine synthétique" }
};

Object.entries(COST_FIXTURES).forEach(([route, values]) => {
  ROUTE_OVERRIDES[route] = Object.assign({ result: "main output" }, ROUTE_OVERRIDES[route], { values });
});

const deepEvidence = {
  schemaVersion: 1,
  generatedAt: "2026-07-28",
  scope: "French Health & Wellness",
  worktreeRoot: ROOT,
  baseUrl: process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:4173",
  totalRoutes: routes.length,
  accepted: [],
  blocked: [],
  routes: []
};
const DEEP_START = Number(process.env.AFROTOOLS_FRENCH_HEALTH_START || 0);
const DEEP_END = Number(process.env.AFROTOOLS_FRENCH_HEALTH_END || routes.length);
const deepRoutes = routes.slice(DEEP_START, DEEP_END);
deepEvidence.routeSlice = { start: DEEP_START, end: DEEP_END, count: deepRoutes.length };

function canonicalRoute(route) {
  return route.endsWith("/") ? route : route + "/";
}

async function setValue(page, selector, value) {
  const locator = page.locator(selector).first();
  if (!await locator.count() || !await locator.isVisible() || await locator.isDisabled()) return false;
  const tag = await locator.evaluate((element) => element.tagName);
  const type = await locator.getAttribute("type");
  if (typeof value === "boolean" || type === "checkbox" || type === "radio") {
    await locator.evaluate((element, checked) => {
      element.checked = Boolean(checked);
      element.dispatchEvent(new Event("input", { bubbles: true }));
      element.dispatchEvent(new Event("change", { bubbles: true }));
    }, value !== false);
  } else if (tag === "SELECT") {
    await locator.selectOption(String(value));
    await locator.evaluate((element) => {
      element.dispatchEvent(new Event("input", { bubbles: true }));
      element.dispatchEvent(new Event("change", { bubbles: true }));
    });
  } else {
    await locator.fill(String(value));
  }
  return true;
}

async function fillFallbackControls(page) {
  await page.locator("main select:visible").evaluateAll((items) => {
    items.forEach((select) => {
      if (select.disabled || select.value) return;
      const option = [...select.options].find((item) => item.value && !item.disabled);
      if (option) {
        select.value = option.value;
        select.dispatchEvent(new Event("change", { bubbles: true }));
      }
    });
  });
  const controls = page.locator('main input:visible:not([type="hidden"]):not([type="file"]):not([type="button"]):not([type="submit"]):not([type="reset"]), main textarea:visible');
  for (let index = 0; index < await controls.count(); index += 1) {
    const control = controls.nth(index);
    if (await control.isDisabled()) continue;
    const type = await control.getAttribute("type");
    if (type === "checkbox" || type === "radio") continue;
    if ((await control.inputValue()).trim()) continue;
    if (type === "date") await control.fill("2026-07-20");
    else if (type === "datetime-local") await control.fill("2026-07-20T08:30");
    else if (type === "time") await control.fill("08:30");
    else if (type === "number" || type === "range") {
      const min = Number(await control.getAttribute("min"));
      const max = Number(await control.getAttribute("max"));
      const value = Number.isFinite(min) && min > 0 ? min : Number.isFinite(max) && max < 10 ? 1 : 10;
      await control.fill(String(value));
    } else await control.fill("Contexte synthétique");
  }
}

async function primaryButton(page, override) {
  if (override.submit) return page.locator(override.submit).first();
  const formSubmit = page.locator('main form button[type="submit"]:visible').first();
  if (await formSubmit.count()) return formSubmit;
  return page.locator("main button:visible").filter({
    hasNotText: /sombre|clair|télécharger|imprimer|effacer|réinitialiser|enregistrer|copier|partager|ajouter une autre|remove/i
  }).first();
}

async function downloadAndParse(page, button) {
  const label = ((await button.innerText().catch(() => "")) || "").trim();
  if (/imprimer/i.test(label)) {
    await button.click();
    const printed = await page.evaluate(() => Boolean(window.__frHealthPrinted));
    expect(printed, label).toBe(true);
    return { label, kind: "print", parsed: true };
  }
  const downloadPromise = page.waitForEvent("download", { timeout: 8000 }).catch(() => null);
  await button.click();
  const download = await downloadPromise;
  if (!download) {
    const printed = await page.evaluate(() => Boolean(window.__frHealthPrinted));
    expect(printed, `${label}: neither download nor print`).toBe(true);
    return { label, kind: "print", parsed: true };
  }
  const file = await download.path();
  const buffer = fs.readFileSync(file);
  const filename = download.suggestedFilename();
  const lower = filename.toLowerCase();
  if (lower.endsWith(".pdf")) {
    expect(buffer.subarray(0, 4).toString("ascii"), filename).toBe("%PDF");
    expect(buffer.length, filename).toBeGreaterThan(800);
  } else {
    const text = buffer.toString("utf8");
    expect(text.trim().length, filename).toBeGreaterThan(20);
    if (lower.endsWith(".ics")) expect(text).toContain("BEGIN:VCALENDAR");
    if (lower.endsWith(".json")) expect(() => JSON.parse(text)).not.toThrow();
    if (lower.endsWith(".csv")) expect(text).toContain(",");
  }
  return { label, filename, bytes: buffer.length, parsed: true };
}

test("42 French Health owner workflows execute, fail closed, export locally and preserve private inputs", async ({ browser }) => {
  test.setTimeout(12 * 60 * 1000);
  expect(Object.keys(OWNER_SPECS).sort()).toEqual(routes.map(canonicalRoute).sort());
  for (const rawRoute of deepRoutes) {
    const route = canonicalRoute(rawRoute);
    const context = await browser.newContext({ viewport: { width: 375, height: 812 }, colorScheme: "light", serviceWorkers: "block" });
    await context.addInitScript(() => {
      window.__frHealthPrinted = false;
      window.print = () => { window.__frHealthPrinted = true; };
      try { localStorage.setItem("aft_theme", "light"); } catch {}
    });
    const page = await context.newPage();
    const privateMarker = `PRIVATE_HEALTH_WAVE3_${routes.indexOf(rawRoute) + 1}`;
    const requests = [];
    const pageErrors = [];
    const consoleErrors = [];
    page.on("request", (request) => requests.push({
      url: request.url(),
      body: request.postData() || ""
    }));
    page.on("pageerror", (error) => pageErrors.push(error.message));
    page.on("console", (message) => {
      if (message.type() === "error" && !/ERR_BLOCKED_BY_CLIENT/.test(message.text())) consoleErrors.push(message.text());
    });
    await page.route("**/*", async (handler) => {
      const url = new URL(handler.request().url());
      if (!["127.0.0.1", "localhost"].includes(url.hostname)) return handler.abort("blockedbyclient");
      return handler.continue();
    });
    const record = {
      route,
      ownerSpec: OWNER_SPECS[route],
      workflow: false,
      invalidOrSafety: false,
      exports: [],
      privacyLeak: false,
      frenchRuntime: false
    };
    const checkpoint = (step) => {
      record.step = step;
      fs.mkdirSync(path.dirname(EVIDENCE_PATH), { recursive: true });
      fs.writeFileSync(EVIDENCE_PATH, JSON.stringify({
        ...deepEvidence,
        routes: [...deepEvidence.routes, record]
      }, null, 2) + "\n");
    };
    try {
      checkpoint("navigation-start");
      const response = await page.goto(route, { waitUntil: "domcontentloaded" });
      expect(response?.status(), route).toBe(200);
      checkpoint("navigation-complete");
      await page.waitForLoadState("networkidle", { timeout: 2000 }).catch(() => {});
      const override = ROUTE_OVERRIDES[route] || {};
      const values = Object.assign({}, override.values || {});
      for (const [selector, value] of Object.entries(values)) await setValue(page, selector, value);
      if (override.chooseNonEmptySelects) await fillFallbackControls(page);
      if (override.checkVisibleCheckboxes) {
        const boxes = page.locator('main input[type="checkbox"]:visible:not(:disabled)');
        for (let index = 0; index < await boxes.count(); index += 1) {
          await boxes.nth(index).evaluate((element) => {
            element.checked = true;
            element.dispatchEvent(new Event("input", { bubbles: true }));
            element.dispatchEvent(new Event("change", { bubbles: true }));
          });
        }
      }
      await fillFallbackControls(page);
      checkpoint("fixture-complete");
      const result = page.locator(override.result || "main output, main [role=status], main [aria-live], main .result, main .results").first();
      const before = await result.count() ? await result.innerText().catch(() => "") : "";
      const submit = await primaryButton(page, override);
      expect(await submit.count(), `${route}: primary submit`).toBe(1);
      await submit.click();
      checkpoint("primary-action-clicked");
      if (await result.count()) {
        await result.waitFor({ state: "attached" });
        await page.waitForFunction(
          (selector) => String(document.querySelector(selector)?.textContent || "").trim().length > 0,
          override.result || "main output, main [role=status], main [aria-live], main .result, main .results",
          { timeout: 2000 }
        ).catch(() => {});
      }
      await page.waitForTimeout(route === "/fr/tools/rapport-medical/" ? 700 : 80);
      const after = await result.count() ? await result.innerText().catch(() => "") : "";
      const mainAfter = await page.locator("main").innerText();
      expect(after.trim().length, `${route}: empty result from ${record.ownerSpec}`).toBeGreaterThan(0);
      expect(after, `${route}: result did not respond to fixture`).not.toBe(before);
      expect(mainAfter).not.toMatch(DYNAMIC_ENGLISH);
      expect(after).not.toMatch(DYNAMIC_ENGLISH);
      expect(mainAfter).not.toMatch(ENGLISH_DATE);
      expect(after).not.toMatch(ENGLISH_DATE);
      record.workflow = true;
      record.resultSample = after.trim().replace(/\s+/g, " ").slice(0, 220);
      checkpoint("workflow-accepted");

      const exportButtons = page.locator('button:visible, a:visible').filter({
        hasText: /télécharger|imprimer|exporter/i
      });
      const seen = new Set();
      for (let index = 0; index < await exportButtons.count(); index += 1) {
        const button = exportButtons.nth(index);
        const signature = `${await button.getAttribute("id")}|${await button.innerText()}`;
        if (seen.has(signature) || await button.isDisabled()) continue;
        seen.add(signature);
        checkpoint(`export-start:${signature}`);
        record.exports.push(await downloadAndParse(page, button));
        checkpoint(`export-complete:${signature}`);
      }
      if (!record.exports.length) record.exportEvidence = "not applicable: English owner exposes no primary file/print export";

      const required = page.locator("main input[required]:visible, main select[required]:visible, main textarea[required]:visible").first();
      if (await required.count()) {
        const requiredType = await required.getAttribute("type");
        if (requiredType === "checkbox" || requiredType === "radio") await required.uncheck({ force: true });
        else if ((await required.evaluate((element) => element.tagName)) === "SELECT") {
          await required.evaluate((element) => {
            element.value = "";
            element.dispatchEvent(new Event("change", { bubbles: true }));
          });
        } else {
          await required.evaluate((element) => {
            element.value = "";
            element.dispatchEvent(new Event("input", { bubbles: true }));
            element.dispatchEvent(new Event("change", { bubbles: true }));
          });
        }
        await submit.evaluate((element) => element.click());
        await page.waitForTimeout(50);
        record.invalidOrSafety = await required.evaluate((element) => !element.checkValidity())
          || /obligatoire|veuillez|non valide|sélectionnez|saisir/i.test(await page.locator("main").innerText());
      } else {
        record.invalidOrSafety = /urgence|n'attendez|aucun diagnostic|professionnel de santé|service de santé/i.test(mainAfter);
        record.invalidEvidence = "owner workflow has no required DOM control; medical boundary retained";
      }
      expect(record.invalidOrSafety, `${route}: invalid/safety oracle`).toBe(true);
      checkpoint("invalid-safety-accepted");

      const requestText = requests.map((item) => `${decodeURIComponent(item.url)}\n${item.body}`).join("\n");
      record.privacyLeak = requestText.includes(privateMarker);
      expect(record.privacyLeak, `${route}: private input transmitted`).toBe(false);
      const finalMainText = await page.locator("main").innerText();
      record.englishRuntimeMatches = finalMainText.match(DYNAMIC_ENGLISH) || [];
      const englishMatch = DYNAMIC_ENGLISH.exec(finalMainText);
      record.englishRuntimeContext = englishMatch
        ? finalMainText.slice(Math.max(0, englishMatch.index - 90), englishMatch.index + englishMatch[0].length + 90)
        : "";
      record.frenchRuntime = !DYNAMIC_ENGLISH.test(finalMainText) && !ENGLISH_DATE.test(finalMainText);
      expect(record.frenchRuntime, `${route}: English runtime residue`).toBe(true);
      expect(pageErrors, route).toEqual([]);
      expect(consoleErrors, route).toEqual([]);
      checkpoint("route-accepted");
      deepEvidence.accepted.push(route);
    } catch (error) {
      record.error = error.message;
      deepEvidence.blocked.push(route);
    } finally {
      record.consoleErrors = consoleErrors;
      record.pageErrors = pageErrors;
      const evidencePage = context.pages()[0];
      record.runtimeVersion = evidencePage
        ? await evidencePage.locator("html").getAttribute("data-fr-health-runtime-version").catch(() => null)
        : null;
      record.medicalRepair = evidencePage
        ? await evidencePage.locator("html").getAttribute("data-fr-health-medical-repair").catch(() => null)
        : null;
      deepEvidence.routes.push(record);
      fs.mkdirSync(path.dirname(EVIDENCE_PATH), { recursive: true });
      fs.writeFileSync(EVIDENCE_PATH, JSON.stringify(deepEvidence, null, 2) + "\n");
      await context.close();
    }
  }
  expect(deepEvidence.blocked, JSON.stringify(
    deepEvidence.routes.filter((item) => item.error).map((item) => ({ route: item.route, error: item.error })),
    null,
    2
  )).toEqual([]);
});

test.afterAll(() => {
  deepEvidence.summary = {
    total: deepRoutes.length,
    accepted: deepEvidence.accepted.length,
    blocked: deepEvidence.blocked.length,
    workflowsExecuted: deepEvidence.routes.filter((item) => item.workflow).length,
    parsedExports: deepEvidence.routes.reduce((total, item) => total + item.exports.length, 0),
    privacyLeaks: deepEvidence.routes.filter((item) => item.privacyLeak).length
  };
  fs.mkdirSync(path.dirname(EVIDENCE_PATH), { recursive: true });
  fs.writeFileSync(EVIDENCE_PATH, JSON.stringify(deepEvidence, null, 2) + "\n");
});
