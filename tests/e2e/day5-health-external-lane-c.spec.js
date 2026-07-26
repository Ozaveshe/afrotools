const { test, expect } = require("@playwright/test");
const fs = require("fs");
const path = require("path");

const screenshotRoot = path.resolve(__dirname, "../../artifacts/day5-health-external-lane-c/screenshots");

const scenarios = [
  { slug: "calorie-diary", route: "/health/calorie-counter/", submit: "Add to diary", txt: "#download-txt", pdf: "#download-pdf", fill: async p => { await p.fill("#food-name", "Synthetic stew"); await p.fill("#amount", "250"); await p.fill("#reference-calories", "180"); await p.fill("#source-note", "Synthetic label 2026-07-26"); }, result: "450 kcal", report: "Daily Food Calorie Diary" },
  { slug: "single-calorie", route: "/tools/calorie-counter/", submit: "Calculate portion", txt: "#download-txt", pdf: "#download-pdf", fill: async p => { await p.fill("#food-name", "Synthetic food"); await p.fill("#amount-eaten", "75"); await p.fill("#label-calories", "240"); await p.fill("#source", "Synthetic label 2026-07-26"); }, result: "180 kcal", report: "Single-Food Calorie Estimate" },
  { slug: "meal-plan", route: "/tools/african-meal-plan/", submit: "Build plan totals", txt: "#txt", pdf: "#pdf", fill: async p => { await p.fill("#people", "2"); await p.fill("#daily-budget", "1000"); }, result: "NGN 15,400", report: "Meal Logistics Plan" },
  { slug: "home-workout", route: "/tools/home-workout/", submit: "Calculate schedule", txt: "#txt", pdf: "#pdf", fill: async p => { await p.fill("#activity", "Synthetic routine"); }, result: "12 sessions", report: "Home Activity Schedule" },
  { slug: "gym-cost", route: "/tools/gym-cost-compare/", submit: "Compare quoted costs", txt: "#txt", pdf: "#pdf", fill: async p => { await p.fill("#months", "2"); await p.fill("#visits", "4"); await p.fill("#a-name", "Provider A"); await p.fill("#a-monthly", "1000"); await p.fill("#a-joining", "500"); await p.fill("#a-transport", "100"); await p.fill("#b-name", "Provider B"); await p.fill("#b-monthly", "1200"); await p.fill("#b-transport", "50"); await p.fill("#b-extras", "100"); }, result: "NGN 3,300", report: "Gym Quote Cost Comparison" },
  { slug: "hospital-cost", route: "/tools/hospital-cost/", submit: "Calculate episode budget", txt: "#txt", pdf: "#pdf", fill: async p => { await p.fill("#facility", "Synthetic quote"); await p.fill("#consultation", "100"); await p.fill("#facility-fee", "200"); await p.fill("#procedure", "500"); await p.fill("#tests", "100"); await p.fill("#medicines", "50"); await p.fill("#travel", "50"); await p.fill("#insurance", "200"); }, result: "NGN 880", report: "Hospital Quote Episode Budget" },
  { slug: "clinic-costs", route: "/tools/clinic-costs/", submit: "Calculate outpatient budget", txt: "#txt", pdf: "#pdf", fill: async p => { await p.fill("#provider", "Synthetic clinic"); await p.fill("#followups", "2"); await p.fill("#initial", "1000"); await p.fill("#followup-cost", "500"); await p.fill("#tests", "200"); await p.fill("#medicines", "300"); await p.fill("#transport", "100"); await p.fill("#insurance", "500"); }, result: "NGN 2,530", report: "Clinic Visit and Follow-up Budget" },
  { slug: "pharmacy-price", route: "/tools/pharmacy-prices/", submit: "Normalize quote", txt: "#txt", pdf: "#pdf", fill: async p => { await p.fill("#medicine", "Synthetic exact label"); await p.fill("#strength", "500 mg"); await p.fill("#form-type", "tablet"); await p.fill("#pharmacy", "Synthetic pharmacy"); await p.fill("#pack-size", "10"); await p.fill("#pack-price", "1200"); await p.fill("#quantity", "24"); await p.fill("#fee", "100"); }, result: "NGN 3,700", report: "Pharmacy Package Quote" },
  { slug: "drug-price", route: "/tools/drug-price-compare/", submit: "Compare exact-product quotes", txt: "#txt", pdf: "#pdf", fill: async p => { await p.fill("#medicine", "Synthetic exact label"); await p.fill("#strength", "5 mg"); await p.fill("#dosage-form", "tablet"); await p.fill("#quantity", "25"); await p.fill("#a-provider", "Pharmacy A"); await p.fill("#a-size", "10"); await p.fill("#a-price", "50"); await p.fill("#b-provider", "Pharmacy B"); await p.fill("#b-size", "30"); await p.fill("#b-price", "130"); await p.fill("#b-fee", "5"); }, result: "NGN 150", report: "Exact Medicine Quote Comparison" },
  { slug: "dental-cost", route: "/tools/dental-cost/", submit: "Calculate dental budget", txt: "#txt", pdf: "#pdf", fill: async p => { await p.fill("#provider", "Synthetic dentist"); await p.fill("#service", "Provider-quoted service"); await p.fill("#quantity", "2"); await p.fill("#unit-price", "10000"); await p.fill("#consultation", "1000"); await p.fill("#imaging", "2000"); await p.fill("#followup", "1000"); await p.fill("#medicines", "500"); await p.fill("#travel", "500"); await p.fill("#insurance", "5000"); }, result: "NGN 22,000", report: "Dental Provider Quote Budget" },
  { slug: "eye-care", route: "/tools/eye-care-cost/", submit: "Calculate eye-care budget", txt: "#txt", pdf: "#pdf", fill: async p => { await p.fill("#provider", "Synthetic optometry quote"); await p.fill("#exam", "100"); await p.fill("#tests", "50"); await p.fill("#lenses", "300"); await p.fill("#frames", "200"); await p.fill("#fitting", "50"); await p.fill("#followup", "50"); await p.fill("#travel", "50"); await p.fill("#insurance", "100"); }, result: "NGN 770", report: "Eye Care Provider Quote Budget" },
  { slug: "mental-health", route: "/tools/mental-health-cost/", submit: "Calculate support budget", txt: "#txt", pdf: "#pdf", fill: async p => { await p.fill("#provider", "Synthetic provider"); await p.fill("#assessment", "1000"); await p.fill("#session-fee", "2000"); await p.fill("#transport", "200"); await p.fill("#insurance", "1000"); }, result: "NGN 9,680", report: "Mental Health Support Cost Plan" },
  { slug: "care-plan", route: "/tools/traditional-vs-western/", submit: "Compare entered logistics", txt: "#txt", pdf: "#pdf", fill: async p => { await p.fill("#a-name", "Plan A"); await p.fill("#a-provider", "Provider A"); await p.fill("#a-initial", "1000"); await p.fill("#a-visits", "2"); await p.fill("#a-follow", "500"); await p.fill("#a-travel", "100"); await p.fill("#a-other", "200"); await p.fill("#b-name", "Plan B"); await p.fill("#b-provider", "Provider B"); await p.fill("#b-initial", "2000"); await p.fill("#b-visits", "1"); await p.fill("#b-follow", "200"); await p.fill("#b-travel", "50"); }, result: "NGN 2,500", report: "Care Plan Cost and Logistics Comparison" },
  { slug: "medical-travel", route: "/tools/medical-tourism/", submit: "Calculate travel budget", txt: "#txt", pdf: "#pdf", fill: async p => { await p.fill("#destination", "Synthetic destination"); await p.fill("#provider", "Synthetic provider"); await p.fill("#clinical", "5000"); await p.fill("#tests", "500"); await p.fill("#aftercare", "500"); await p.fill("#transport", "1000"); await p.fill("#visa", "200"); await p.fill("#nights", "10"); await p.fill("#nightly", "100"); await p.fill("#local", "300"); await p.fill("#companion", "500"); await p.fill("#insurance", "1000"); await p.fill("#contingency", "10"); await p.fill("#local-quote", "6000"); }, result: "USD 8,800", report: "Medical Travel Quote Budget" },
];

test.describe.configure({ mode: "serial" });

for (const scenario of scenarios) {
  test(scenario.slug + " desktop light, mobile dark, privacy and exports", async ({ page }) => {
    const pageErrors = [];
    const thirdParty = [];
    page.on("pageerror", error => pageErrors.push(error.message));
    page.on("request", request => {
      const url = new URL(request.url());
      if (!["127.0.0.1", "localhost"].includes(url.hostname)) thirdParty.push(request.url());
    });

    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(scenario.route);
    await expect(page.locator("h1")).toBeVisible();
    let mainFocusFound = false;
    for (let index = 0; index < 40; index += 1) {
      await page.keyboard.press("Tab");
      mainFocusFound = await page.evaluate(() => {
        const active = document.activeElement;
        if (!active || !active.closest("main")) return false;
        const style = getComputedStyle(active);
        return parseFloat(style.outlineWidth) > 0 || style.boxShadow !== "none";
      });
      if (mainFocusFound) break;
    }
    expect(mainFocusFound).toBe(true);
    await scenario.fill(page);
    await page.getByRole("button", { name: scenario.submit }).click();
    await expect(page.getByText(scenario.result, { exact: false }).first()).toBeVisible();

    const txtDownloadPromise = page.waitForEvent("download");
    await page.locator(scenario.txt).click();
    const txtDownload = await txtDownloadPromise;
    const txtPath = await txtDownload.path();
    const txt = fs.readFileSync(txtPath, "utf8");
    expect(txt).toContain("AfroTools");
    expect(txt).toContain(scenario.report);
    expect(txt).toMatch(/Boundary|Meaning/);

    const pdfDownloadPromise = page.waitForEvent("download");
    await page.locator(scenario.pdf).click();
    const pdfDownload = await pdfDownloadPromise;
    const pdfPath = await pdfDownload.path();
    const pdf = fs.readFileSync(pdfPath);
    expect(pdf.subarray(0, 4).toString("ascii")).toBe("%PDF");
    expect(pdf.length).toBeGreaterThan(1000);
    expect(pdf.toString("latin1")).toContain("AfroTools");

    fs.mkdirSync(screenshotRoot, { recursive: true });
    await page.evaluate(() => {
      if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
      document.documentElement.style.setProperty("scroll-behavior", "auto", "important");
      document.body.style.setProperty("scroll-behavior", "auto", "important");
      window.scrollTo(0, 0);
    });
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
    await page.screenshot({ path: path.join(screenshotRoot, scenario.slug + "-desktop-light.png"), fullPage: false });

    await page.setViewportSize({ width: 375, height: 812 });
    await page.evaluate(() => { document.documentElement.dataset.theme = "dark"; });
    await page.evaluate(() => window.scrollTo(0, 0));
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
    const lowContrast = await page.evaluate(() => {
      function rgb(value) {
        const match = value.match(/rgba?\((\d+)[,\s]+(\d+)[,\s]+(\d+)/);
        return match ? match.slice(1, 4).map(Number) : null;
      }
      function channel(value) {
        value /= 255;
        return value <= 0.04045 ? value / 12.92 : Math.pow((value + 0.055) / 1.055, 2.4);
      }
      function luminance(color) {
        return 0.2126 * channel(color[0]) + 0.7152 * channel(color[1]) + 0.0722 * channel(color[2]);
      }
      function ratio(a, b) {
        const first = luminance(a), second = luminance(b);
        return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05);
      }
      function background(element) {
        let node = element;
        while (node) {
          const value = getComputedStyle(node).backgroundColor;
          if (value && !/rgba?\(\s*0[,\s]+0[,\s]+0(?:[,\s]+0)?\s*\)/.test(value) && value !== "transparent") return rgb(value);
          node = node.parentElement;
        }
        return [255, 255, 255];
      }
      return Array.from(document.querySelectorAll("main h1,main h2,main h3,main p,main label,main button,main input,main select,main textarea,main a,main output"))
        .filter(element => {
          const box = element.getBoundingClientRect();
          const style = getComputedStyle(element);
          return box.width > 0 && box.height > 0 && style.visibility !== "hidden" && style.display !== "none" && !element.disabled;
        })
        .map(element => {
          const style = getComputedStyle(element);
          const foreground = rgb(style.color);
          const back = background(element);
          const size = parseFloat(style.fontSize);
          const weight = parseInt(style.fontWeight, 10) || 400;
          const threshold = size >= 24 || (size >= 18.66 && weight >= 700) ? 3 : 4.5;
          return { tag: element.tagName, id: element.id, foreground, background: back, value: foreground && back ? ratio(foreground, back) : 99, threshold };
        })
        .filter(item => item.value + 0.05 < item.threshold);
    });
    expect(lowContrast).toEqual([]);
    await page.screenshot({ path: path.join(screenshotRoot, scenario.slug + "-mobile-dark.png"), fullPage: false });

    await page.setViewportSize({ width: 320, height: 800 });
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);

    await page.setViewportSize({ width: 640, height: 800 });
    await page.evaluate(() => { document.documentElement.style.fontSize = "200%"; });
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);

    expect(pageErrors).toEqual([]);
    const unexpectedThirdParty = thirdParty.filter(url => !/^https:\/\/cdn\.jsdelivr\.net\/gh\/twitter\/twemoji@14\.0\.2\/assets\/svg\//.test(url));
    expect(unexpectedThirdParty).toEqual([]);
    expect(thirdParty.join("\n")).not.toMatch(/Synthetic|medicine|provider|quote/i);
  });
}
