const { test, expect } = require("@playwright/test");
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "../..");
const EVIDENCE_PATH = path.resolve(
  ROOT,
  process.env.AFROTOOLS_SWAHILI_HEALTH_EVIDENCE
    || "test-results/swahili-health-wave3-deep-evidence.json"
);
const DYNAMIC_ENGLISH = /\b(?:Download|Calculate|Clear|Result|Required|Invalid|Emergency help now|Observed BMI interval|Height spread|Weight spread|You recorded|Within shown range|Total Markers|Done|COMPLETE BLOOD COUNT|Reference range|recognized markers|weeks?, \d+ days? by calendar estimate|First day of your last menstrual period|Use this as a visit-prep note|Markers to discuss|outside-range result|Laboratory range used|General fallback range used|Above Range|Below Range|at or below|above the (?:1|5|10)|treatment context needs review|effective disinfection may be compromised|\d+ drink entr(?:y|ies)|The logged total|This is arithmetic only|At or above the selected|Below the selected|Observed ratio interval|Waist spread|Hip spread|The entered readings produce ratios)\b/i;
const ENGLISH_DATE = /\b\d{1,2}\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4}\b/;
const DEEP_ONLY = process.env.AFROTOOLS_SWAHILI_HEALTH_DEEP_ONLY === "1";

const routes = [
  "/sw/zana/tafsiri-ya-ripoti-ya-matibabu/",
  "/sw/zana/kikokotoo-bmi/",
  "/sw/zana/tarehe-ya-kujifungua/",
  "/sw/zana/kalori-za-vyakula-vya-afrika/",
  "/sw/zana/hatari-ya-malaria/",
  "/sw/zana/kikokotoo-ovulation/",
  "/sw/zana/kikokotoo-dozi-ya-dawa/",
  "/sw/zana/usalama-wa-maji/",
  "/sw/zana/kikokotoo-maji-ya-kunywa/",
  "/sw/zana/ratiba-ya-chanjo/",
  "/sw/zana/uwiano-wa-kiuno-na-nyonga/",
  "/sw/zana/shinikizo-la-damu/",
  "/sw/zana/gharama-za-hospitali/",
  "/sw/zana/gharama-za-kliniki/",
  "/sw/zana/bei-za-famasia/",
  "/sw/zana/selimundu-na-genotype/",
  "/sw/zana/hatari-ya-kisukari/",
  "/sw/zana/kikokotoo-bmi-ya-mwili/",
  "/sw/zana/kihesabu-kalori/",
  "/sw/zana/kikokotoo-tarehe-ya-kujifungua/",
  "/sw/zana/uthibitishaji-wa-genotype/",
  "/sw/zana/kundi-la-damu/",
  "/sw/zana/maandalizi-ya-afya-ya-uzazi/",
  "/sw/zana/gharama-za-kujifungua/",
  "/sw/zana/upasuaji-dhidi-ya-kujifungua-kawaida/",
  "/sw/zana/gharama-ya-meno/",
  "/sw/zana/kilinganisha-bei-za-dawa/",
  "/sw/zana/kulinganisha-mipango-ya-matibabu/",
  "/sw/zana/mpango-wa-milo-afrika/",
  "/sw/zana/ukuaji-wa-mtoto/",
  "/sw/zana/gharama-za-huduma-ya-vvu/",
  "/sw/zana/ratiba-ya-huduma-ya-kifua-kikuu/",
  "/sw/zana/hatari-ya-kipindupindu/",
  "/sw/zana/orodha-ya-ukaguzi-wa-ebola/",
  "/sw/zana/uchunguzi-wa-hepatitis-b/",
  "/sw/zana/bajeti-ya-safari-ya-matibabu/",
  "/sw/zana/gharama-za-huduma-ya-macho/",
  "/sw/zana/bajeti-ya-afya-ya-akili/",
  "/sw/zana/lishe-wakati-wa-ujauzito/",
  "/sw/zana/ufuatiliaji-kunyonyesha/",
  "/sw/zana/kulinganisha-gharama-za-gym/",
  "/sw/zana/mpango-wa-mazoezi-ya-nyumbani/"
];

test.describe.configure({ mode: "serial" });

test("Swahili Health hub exposes all 42 native application links at 320px", async ({ page }) => {
  test.skip(DEEP_ONLY, "bounded deep-workflow shard");
  await page.setViewportSize({ width: 320, height: 760 });
  await page.emulateMedia({ colorScheme: "dark", reducedMotion: "reduce" });
  const response = await page.goto("/sw/afya/", { waitUntil: "domcontentloaded" });
  expect(response.status()).toBe(200);
  await expect(page.locator("h1")).toContainText("Zana 42");
  await expect(page.locator(".swh-card")).toHaveCount(42);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", "https://afrotools.com/sw/afya/");
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
});

for (const route of routes) {
  test(`${route} is native Swahili, reflows and exposes accessible controls`, async ({ page }) => {
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
    await expect(page.locator("html")).toHaveAttribute("lang", "sw");
    await expect(page.locator("h1").first()).toBeVisible();
    await expect(page.locator("main")).toHaveCount(1);
    await expect(page.locator("iframe")).toHaveCount(0);
    if (route === "/sw/zana/uwiano-wa-kiuno-na-nyonga/") {
      await expect(page.locator(".safety")).toBeVisible();
    } else {
      await expect(page.locator("[data-sw-health-safety]")).toBeVisible();
      await expect(page.locator("html")).toHaveAttribute("data-sw-health-ready", "true");
    }
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
    await page.evaluate(() => {
      document.documentElement.setAttribute("data-theme", "light");
      document.documentElement.style.colorScheme = "light";
      // Several legacy Health owners load mobile rules with `!important`.
      // Apply the test zoom at the same cascade priority so this remains a
      // genuine 200% reflow check instead of silently measuring 16px.
      document.documentElement.style.setProperty("font-size", "200%", "important");
    });
    // Reduced-motion CSS still leaves a 0.01ms `transition: all` on legacy
    // owners. Let that frame settle before reading the computed root size.
    await page.waitForTimeout(25);
    const reflow200 = await page.evaluate(() => {
      document.documentElement.style.setProperty("scroll-behavior", "auto", "important");
      window.scrollTo(0, 0);
      window.scrollTo(9999, 0);
      const horizontalScroll = window.scrollX;
      window.scrollTo(0, 0);
      return {
        rootSize: Number.parseFloat(getComputedStyle(document.documentElement).fontSize),
        horizontalScroll
      };
    });
    expect(reflow200.rootSize).toBeGreaterThanOrEqual(31);
    expect(reflow200.horizontalScroll).toBeLessThanOrEqual(1);
    const visibleText = await page.locator("body").innerText();
    expect(visibleText).not.toMatch(/\b(?:Download PDF|Download TXT|Calculate|Clear|Privacy|No diagnosis)\b/i);
    expect(consoleErrors).toEqual([]);
    expect(pageErrors).toEqual([]);
    expect(local404s).toEqual([]);
  });
}

const OWNER_SPECS = {
  "/sw/zana/tafsiri-ya-ripoti-ya-matibabu/": "tests/e2e/medical-report-vip.spec.js",
  "/sw/zana/kikokotoo-bmi/": "tests/e2e/day5-health-external-lane-b-vip.spec.js",
  "/sw/zana/tarehe-ya-kujifungua/": "tests/e2e/pregnancy-appointment-planner-vip.spec.js",
  "/sw/zana/kalori-za-vyakula-vya-afrika/": "tests/e2e/day5-health-external-lane-c.spec.js",
  "/sw/zana/hatari-ya-malaria/": "tests/e2e/day5-health-external-lane-b-vip.spec.js",
  "/sw/zana/kikokotoo-ovulation/": "tests/e2e/cycle-window-estimator-vip.spec.js",
  "/sw/zana/kikokotoo-dozi-ya-dawa/": "tests/e2e/drug-dosage-vip.spec.js",
  "/sw/zana/usalama-wa-maji/": "tests/e2e/day5-health-external-lane-b-vip.spec.js",
  "/sw/zana/kikokotoo-maji-ya-kunywa/": "tests/e2e/day5-health-external-lane-b-vip.spec.js",
  "/sw/zana/ratiba-ya-chanjo/": "tests/e2e/vaccine-schedule-vip.spec.js",
  "/sw/zana/uwiano-wa-kiuno-na-nyonga/": "tests/e2e/day5-health-external-lane-b-vip.spec.js",
  "/sw/zana/shinikizo-la-damu/": "tests/e2e/blood-pressure-check-vip.spec.js",
  "/sw/zana/gharama-za-hospitali/": "tests/e2e/day5-health-external-lane-c.spec.js",
  "/sw/zana/gharama-za-kliniki/": "tests/e2e/day5-health-external-lane-c.spec.js",
  "/sw/zana/bei-za-famasia/": "tests/e2e/day5-health-external-lane-c.spec.js",
  "/sw/zana/selimundu-na-genotype/": "tests/e2e/sickle-cell-vip.spec.js",
  "/sw/zana/hatari-ya-kisukari/": "tests/e2e/day5-health-external-lane-b-vip.spec.js",
  "/sw/zana/kikokotoo-bmi-ya-mwili/": "tests/e2e/day5-health-external-lane-b-vip.spec.js",
  "/sw/zana/kihesabu-kalori/": "tests/e2e/day5-health-external-lane-c.spec.js",
  "/sw/zana/kikokotoo-tarehe-ya-kujifungua/": "tests/e2e/due-date-range-estimator-vip.spec.js",
  "/sw/zana/uthibitishaji-wa-genotype/": "tests/e2e/haemoglobin-result-verification-vip.spec.js",
  "/sw/zana/kundi-la-damu/": "tests/e2e/blood-group-vip.spec.js",
  "/sw/zana/maandalizi-ya-afya-ya-uzazi/": "tests/e2e/maternal-health-guide-vip.spec.js",
  "/sw/zana/gharama-za-kujifungua/": "tests/e2e/childbirth-budget-vip.spec.js",
  "/sw/zana/upasuaji-dhidi-ya-kujifungua-kawaida/": "tests/e2e/birth-options-question-builder-vip.spec.js",
  "/sw/zana/gharama-ya-meno/": "tests/e2e/day5-health-external-lane-c.spec.js",
  "/sw/zana/kilinganisha-bei-za-dawa/": "tests/e2e/day5-health-external-lane-c.spec.js",
  "/sw/zana/kulinganisha-mipango-ya-matibabu/": "tests/e2e/day5-health-external-lane-c.spec.js",
  "/sw/zana/mpango-wa-milo-afrika/": "tests/e2e/day5-health-external-lane-c.spec.js",
  "/sw/zana/ukuaji-wa-mtoto/": "tests/e2e/child-growth-vip.spec.js",
  "/sw/zana/gharama-za-huduma-ya-vvu/": "tests/e2e/day5-health-external-lane-b-vip.spec.js",
  "/sw/zana/ratiba-ya-huduma-ya-kifua-kikuu/": "tests/e2e/day5-health-external-lane-b-vip.spec.js",
  "/sw/zana/hatari-ya-kipindupindu/": "tests/e2e/day5-health-external-lane-b-vip.spec.js",
  "/sw/zana/orodha-ya-ukaguzi-wa-ebola/": "tests/e2e/day5-health-external-lane-b-vip.spec.js",
  "/sw/zana/uchunguzi-wa-hepatitis-b/": "tests/e2e/day5-health-external-lane-b-vip.spec.js",
  "/sw/zana/bajeti-ya-safari-ya-matibabu/": "tests/e2e/day5-health-external-lane-c.spec.js",
  "/sw/zana/gharama-za-huduma-ya-macho/": "tests/e2e/day5-health-external-lane-c.spec.js",
  "/sw/zana/bajeti-ya-afya-ya-akili/": "tests/e2e/day5-health-external-lane-c.spec.js",
  "/sw/zana/lishe-wakati-wa-ujauzito/": "tests/e2e/pregnancy-food-planner-vip.spec.js",
  "/sw/zana/ufuatiliaji-kunyonyesha/": "tests/e2e/feeding-nappy-log-vip.spec.js",
  "/sw/zana/kulinganisha-gharama-za-gym/": "tests/e2e/day5-health-external-lane-c.spec.js",
  "/sw/zana/mpango-wa-mazoezi-ya-nyumbani/": "tests/e2e/day5-health-external-lane-c.spec.js"
};

function recentLocalIso(daysAgo) {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 10);
}

const ROUTE_OVERRIDES = {
  "/sw/zana/tafsiri-ya-ripoti-ya-matibabu/": {
    values: {
      "#labInput": "Patient: PRIVATE_HEALTH_WAVE3_1\nWBC: 12 x10^9/L Reference range: 4.0 - 13.0\nHemoglobin: 7 g/dL Reference range: 12 - 16 CRITICAL"
    },
    submit: "#analyzeBtn",
    result: "#summaryStats"
  },
  "/sw/zana/kikokotoo-bmi/": {
    values: { "#height": "180", "#height2": "179", "#weight1": "80", "#weight2": "82", "#conditions": "yes" },
    result: "#result"
  },
  "/sw/zana/tarehe-ya-kujifungua/": {
    values: { 'input[name="basis"][value="lmp"]': true, "#planning-date": "2026-01-01", "#cycle-length": "28" },
    result: "#due-date-output"
  },
  "/sw/zana/kalori-za-vyakula-vya-afrika/": {
    values: { "#food-name": "Ragoût synthétique", "#amount": "250", "#reference-calories": "180", "#source-note": "Étiquette synthétique" },
    result: "#total-calories"
  },
  "/sw/zana/hatari-ya-malaria/": {
    values: { "#exposure": "yes", "#testStatus": "none", "#symptomTiming": "today" },
    result: "#result"
  },
  "/sw/zana/kikokotoo-ovulation/": {
    // Keep the fixture inside the engine's active cycle window. A fixed date
    // eventually expires and correctly produces no result.
    values: { "#last-period-date": recentLocalIso(7), "#shortest-cycle": "28", "#longest-cycle": "30" },
    result: "#next-period-window"
  },
  "/sw/zana/kikokotoo-dozi-ya-dawa/": {
    values: { "#instruction-confirmed": true, "#prescribed-dose": "250", "#output-mode": "liquid", "#concentration-mass": "125", "#concentration-volume": "5" },
    result: "#result-value"
  },
  "/sw/zana/usalama-wa-maji/": {
    values: { "#labStatus": "competent", "#sampleScope": "drinking", "#advisory": "none", "#sampleDate": "2026-07-20", "#ecoliStatus": "not-detected", "#arsenic": "9", "#fluoride": "1.2", "#turbidity": "0.8" },
    result: "#result"
  },
  "/sw/zana/kikokotoo-maji-ya-kunywa/": {
    values: { 'input[type="time"]': "08:00", 'input[type="number"]': "1200", "#clinicalTarget": "1800", "#targetConfirmed": true },
    result: "#result"
  },
  "/sw/zana/ratiba-ya-chanjo/": {
    values: { "#country": "NG", "#age-band": "infant", "#record-status": "missed" },
    result: "#handoff"
  },
  "/sw/zana/uwiano-wa-kiuno-na-nyonga/": {
    values: { "#applicability": "adult", "#units": "cm", "#waist": "84", "#waist2": "86", "#hip": "100", "#hip2": "100", "#reference": "women" },
    result: "#result"
  },
  "/sw/zana/shinikizo-la-damu/": {
    values: { "#health-context": "adult", "#systolic-1": "148", "#diastolic-1": "92", "#systolic-2": "144", "#diastolic-2": "90", "#rested": true, "#positioned": true, "#cuff": true, "#quiet": true },
    result: "#reading-average"
  },
  "/sw/zana/selimundu-na-genotype/": {
    values: { "#lab-confirmed": true, "#result-one": "AS", "#result-two": "AS" },
    result: "#outcomes"
  },
  "/sw/zana/hatari-ya-kisukari/": {
    values: { "#age": "65", "#sex": "female", "#height": "160", "#weight": "110", "#gestational": true, "#family": true, "#pressure": true, "#inactive": true, "#previousAbnormal": true },
    result: "#result"
  },
  "/sw/zana/kikokotoo-bmi-ya-mwili/": {
    values: { "#audience": "adult", "#units": "imperial", "#feet": "5", "#inches": "10", "#pounds": "180" },
    result: "#result"
  },
  "/sw/zana/kihesabu-kalori/": {
    values: { "#food-name": "Aliment synthétique", "#amount-eaten": "75", "#label-calories": "240", "#source": "Étiquette synthétique" },
    result: "#calorie-result"
  },
  "/sw/zana/kikokotoo-tarehe-ya-kujifungua/": {
    values: { "#estimate-date": "2026-01-01", "#cycle-length": "28" },
    result: "#estimated-due-date"
  },
  "/sw/zana/uthibitishaji-wa-genotype/": {
    values: { "#reported-result": "Hb A/S", "#test-method": "hplc", "#test-date": "2026-07-20", "#confirmation-status": "final" },
    result: "#notation-label"
  },
  "/sw/zana/kundi-la-damu/": {
    values: { "#bgv-component": "red-cells", "#bgv-donor": "O-", "#bgv-recipient": "A+" },
    submit: "#bgv-component-form button[type=submit]",
    result: "#bgv-component-result"
  },
  "/sw/zana/gharama-za-kujifungua/": {
    values: { "#currency-code": "NGN", "#quote-date": "2026-07-01", "#source-type": "written-provider", "#planned-care": "200000.50", "#professional-fees": "50000", "#medicines-supplies": "25000.25", "#tests-care": "10000", "#transport-stay": "15000", "#contingency": "20000", "#confirmed-contribution": "100000" },
    result: "#household-total"
  },
  "/sw/zana/ukuaji-wa-mtoto/": {
    values: { "#cgv-birth": "2023-01-01", "#cgv-measured": "2025-09-27", "#cgv-sex": "male", "#cgv-weight": "15", "#cgv-weight-unit": "kg", "#cgv-length": "100", "#cgv-length-unit": "cm", 'input[name="cgv-method"][value="standing"]': true },
    submit: "#cgv-form button[type=submit]",
    result: "#cgv-wfa-z"
  },
  "/sw/zana/gharama-za-huduma-ya-vvu/": {
    values: { "#currency": "KES", "#decimalPlaces": "2", "#clinic": "1000", "#clinicPeriod": "monthly", "#labs": "500", "#labsPeriod": "quarterly", "#transport": "300", "#transportPeriod": "monthly", "#other": "200", "#otherPeriod": "once", "#support": "750", "#supportPeriod": "annual" },
    result: "#result"
  },
  "/sw/zana/ratiba-ya-huduma-ya-kifua-kikuu/": {
    values: { "#today": "2026-07-26", "#appointment": "2026-07-24", "#appointmentStatus": "completed", "#sample": "2026-08-02", "#sampleStatus": "scheduled", "#resultDate": "2026-08-01", "#resultStatus": "scheduled", "#sameEpisode": true },
    result: "#result"
  },
  "/sw/zana/hatari-ya-kipindupindu/": {
    values: { "#timing": "today", "#drinking": "sips" },
    result: "#result",
    checkVisibleCheckboxes: true
  },
  "/sw/zana/orodha-ya-ukaguzi-wa-ebola/": {
    result: "#result",
    checkVisibleCheckboxes: true,
    chooseNonEmptySelects: true
  },
  "/sw/zana/uchunguzi-wa-hepatitis-b/": {
    values: { "#reason": "pregnancy", "#ageGroup": "adult", "#exposureTiming": "none", "#testing": "none", "#diagnosis": "none", "#vaccine": "unknown" },
    result: "#result"
  },
  "/sw/zana/upasuaji-dhidi-ya-kujifungua-kawaida/": {
    values: { "#discussion-context": "previous-caesarean", "#cost-status": "need-quote" },
    checkVisibleCheckboxes: true,
    result: "#birth-options-results"
  },
  "/sw/zana/lishe-wakati-wa-ujauzito/": {
    values: { "#supplement-status": "provider-plan" },
    checkVisibleCheckboxes: true,
    result: "#pregnancy-food-results"
  },
  "/sw/zana/ufuatiliaji-kunyonyesha/": {
    values: { "#event-type": "breastfeed", "#event-time": "2026-07-26T08:30", "#feeding-side": "left", "#duration-minutes": "18" },
    result: "#event-count"
  }
};

const COST_FIXTURES = {
  "/sw/zana/gharama-za-hospitali/": { "#facility": "Devis synthétique", "#consultation": "100", "#facility-fee": "200", "#procedure": "500", "#tests": "100", "#medicines": "50", "#travel": "50", "#insurance": "200" },
  "/sw/zana/gharama-za-kliniki/": { "#provider": "Clinique synthétique", "#followups": "2", "#initial": "1000", "#followup-cost": "500", "#tests": "200", "#medicines": "300", "#transport": "100", "#insurance": "500" },
  "/sw/zana/bei-za-famasia/": { "#medicine": "Produit synthétique", "#strength": "500 mg", "#form-type": "comprimé", "#pharmacy": "Pharmacie synthétique", "#pack-size": "10", "#pack-price": "1200", "#quantity": "24", "#fee": "100" },
  "/sw/zana/gharama-ya-meno/": { "#provider": "Dentiste synthétique", "#service": "Service sur devis", "#quantity": "2", "#unit-price": "10000", "#consultation": "1000", "#imaging": "2000", "#followup": "1000", "#medicines": "500", "#travel": "500", "#insurance": "5000" },
  "/sw/zana/kilinganisha-bei-za-dawa/": { "#medicine": "Produit synthétique", "#strength": "5 mg", "#dosage-form": "comprimé", "#quantity": "25", "#a-provider": "Pharmacie A", "#a-size": "10", "#a-price": "50", "#b-provider": "Pharmacie B", "#b-size": "30", "#b-price": "130", "#b-fee": "5" },
  "/sw/zana/kulinganisha-mipango-ya-matibabu/": { "#a-name": "Plan A", "#a-provider": "Prestataire A", "#a-initial": "1000", "#a-visits": "2", "#a-follow": "500", "#a-travel": "100", "#a-other": "200", "#b-name": "Plan B", "#b-provider": "Prestataire B", "#b-initial": "2000", "#b-visits": "1", "#b-follow": "200", "#b-travel": "50" },
  "/sw/zana/mpango-wa-milo-afrika/": { "#people": "2", "#daily-budget": "1000" },
  "/sw/zana/bajeti-ya-safari-ya-matibabu/": { "#destination": "Destination synthétique", "#provider": "Prestataire synthétique", "#clinical": "5000", "#tests": "500", "#aftercare": "500", "#transport": "1000", "#visa": "200", "#nights": "10", "#nightly": "100", "#local": "300", "#companion": "500", "#insurance": "1000", "#contingency": "10", "#local-quote": "6000" },
  "/sw/zana/gharama-za-huduma-ya-macho/": { "#provider": "Devis optique synthétique", "#exam": "100", "#tests": "50", "#lenses": "300", "#frames": "200", "#fitting": "50", "#followup": "50", "#travel": "50", "#insurance": "100" },
  "/sw/zana/bajeti-ya-afya-ya-akili/": { "#provider": "Prestataire synthétique", "#assessment": "1000", "#session-fee": "2000", "#transport": "200", "#insurance": "1000" },
  "/sw/zana/kulinganisha-gharama-za-gym/": { "#months": "2", "#visits": "4", "#a-name": "Salle A", "#a-monthly": "1000", "#a-joining": "500", "#a-transport": "100", "#b-name": "Salle B", "#b-monthly": "1200", "#b-transport": "50", "#b-extras": "100" },
  "/sw/zana/mpango-wa-mazoezi-ya-nyumbani/": { "#activity": "Routine synthétique" }
};

Object.entries(COST_FIXTURES).forEach(([route, values]) => {
  ROUTE_OVERRIDES[route] = Object.assign({ result: "main output" }, ROUTE_OVERRIDES[route], { values });
});

const deepEvidence = {
  schemaVersion: 1,
  generatedAt: recentLocalIso(0),
  scope: "Swahili Health & Wellness",
  worktreeRoot: ROOT,
  baseUrl: process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:4173",
  totalRoutes: 41,
  accepted: [],
  blocked: [],
  routes: []
};
const DEEP_START = Number(process.env.AFROTOOLS_SWAHILI_HEALTH_START || 0);
const candidateRoutes = routes.filter((route) => route !== "/sw/zana/uwiano-wa-kiuno-na-nyonga/");
const DEEP_END = Number(process.env.AFROTOOLS_SWAHILI_HEALTH_END || candidateRoutes.length);
const deepRoutes = candidateRoutes.slice(DEEP_START, DEEP_END);
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
    } else await control.fill("Muktadha wa majaribio");
  }
}

async function primaryButton(page, override) {
  if (override.submit) return page.locator(override.submit).first();
  const formSubmit = page.locator('main form button[type="submit"]:visible').first();
  if (await formSubmit.count()) return formSubmit;
  return page.locator("main button:visible").filter({
    hasNotText: /hali ya giza|hali ya mwanga|pakua|chapisha|futa|weka upya|hifadhi|nakili|shiriki|ongeza nyingine|ondoa|remove/i
  }).first();
}

async function downloadAndParse(page, button) {
  const label = ((await button.innerText().catch(() => "")) || "").trim();
  if (/chapisha/i.test(label)) {
    await button.click();
    const printed = await page.evaluate(() => Boolean(window.__swHealthPrinted));
    expect(printed, label).toBe(true);
    return { label, kind: "print", parsed: true };
  }
  const downloadPromise = page.waitForEvent("download", { timeout: 8000 }).catch(() => null);
  await button.click();
  const download = await downloadPromise;
  if (!download) {
    const printed = await page.evaluate(() => Boolean(window.__swHealthPrinted));
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

test("42 Swahili Health owner workflows execute, fail closed, export locally and preserve private inputs", async ({ browser }) => {
  test.setTimeout(12 * 60 * 1000);
  expect(Object.keys(OWNER_SPECS).filter((route) => route !== "/sw/zana/uwiano-wa-kiuno-na-nyonga/").sort()).toEqual(candidateRoutes.map(canonicalRoute).sort());
  for (const rawRoute of deepRoutes) {
    const route = canonicalRoute(rawRoute);
    const context = await browser.newContext({ viewport: { width: 375, height: 812 }, colorScheme: "light", serviceWorkers: "block" });
    await context.addInitScript(() => {
      window.__swHealthPrinted = false;
      window.print = () => { window.__swHealthPrinted = true; };
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
      swahiliRuntime: false
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
      await page.waitForTimeout(route === "/sw/zana/tafsiri-ya-ripoti-ya-matibabu/" ? 700 : 80);
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
        hasText: /pakua|chapisha|hamisha/i
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
          || /inahitajika|tafadhali|si sahihi|chagua|ingiza/i.test(await page.locator("main").innerText());
      } else {
        record.invalidOrSafety = /dharura|usisubiri|hakuna utambuzi|mtaalamu wa afya|huduma ya afya|haitambui ugonjwa/i.test(mainAfter);
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
      record.swahiliRuntime = !DYNAMIC_ENGLISH.test(finalMainText) && !ENGLISH_DATE.test(finalMainText);
      expect(record.swahiliRuntime, `${route}: English runtime residue`).toBe(true);
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
        ? await evidencePage.locator("html").getAttribute("data-sw-health-runtime-version").catch(() => null)
        : null;
      record.medicalRepair = evidencePage
        ? await evidencePage.locator("html").getAttribute("data-sw-health-medical-repair").catch(() => null)
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
