const fs = require("node:fs");
const { expect, test } = require("@playwright/test");

const APPS = [
  ["betting-odds", "cotes-paris-sportifs", "NGN 7,500"],
  ["afcon-predictor", "predicteur-can", "8.0%"],
  ["fantasy-football", "points-fantasy-football", "10 pts"],
  ["betting-tax", "taxe-paris-sportifs", "NGN 7,125"],
  ["streaming-royalties", "redevances-streaming-musical", "USD 250.74"],
  ["nollywood-box-office", "box-office-nollywood", "NGN 75,870,000"],
  ["dj-booking-rate", "tarif-dj", "NGN 564,750"],
  ["concert-budget", "budget-concert", "NGN -14,200,240"],
  ["gym-roi-business", "roi-salle-sport", "NGN 6,260,000"],
  ["event-ticket-revenue", "revenus-billetterie", "NGN 13,213,400"],
  ["match-tickets", "prix-billets-match", "NGN 30,060"],
  ["sports-scholarship", "eligibilite-bourse-sportive", "89/100"],
  ["athlete-earnings", "revenus-carriere-athlete", "NGN 99,676,248"],
  ["gaming-pc-build", "configuration-pc-gaming", "1080p équilibré"],
  ["photo-video-pricing", "prix-photo-video", "NGN 1,260,896"]
];
const UNSOURCED_SCENARIO_TOOLS = new Set([
  "athlete-earnings", "betting-odds", "concert-budget", "dj-booking-rate",
  "event-ticket-revenue", "gaming-pc-build", "gym-roi-business",
  "match-tickets", "photo-video-pricing"
]);

for (const [index, [id, slug, expectedValue]] of APPS.entries()) {
  test(`${id} completes a French local workflow, invalid state, JSON export and reopen`, async ({ page }) => {
    const consoleErrors = [];
    const forbiddenRequests = [];
    let actionPhase = false;
    await page.route("**/*", async (route) => {
      const url = new URL(route.request().url());
      if (url.hostname === "127.0.0.1" || url.hostname === "localhost") return route.continue();
      if (actionPhase && (
        route.request().method() !== "GET"
        || /(?:\/api\/|capture-lead|supabase\.co|\/rest\/v1\/|openai|anthropic|workspace)/i.test(route.request().url())
      )) {
        forbiddenRequests.push(`${route.request().method()} ${route.request().url()}`);
      }
      return route.fulfill({ status: 204, body: "" });
    });
    page.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(message.text());
    });
    page.on("pageerror", (error) => consoleErrors.push(error.message));

    await page.setViewportSize({ width: index % 2 ? 375 : 320, height: 844 });
    await page.emulateMedia({ colorScheme: "dark", reducedMotion: "reduce" });
    const response = await page.goto(`/fr/tools/${slug}/`, { waitUntil: "domcontentloaded" });
    expect(response && response.status()).toBe(200);

    await expect(page.locator(".sports-result-value")).toHaveText(expectedValue);
    actionPhase = true;
    await expect(page.locator("[data-fr-sports-boundary]")).toBeVisible();
    const sourceCard = page.locator("[data-fr-source-confidence]");
    await expect(sourceCard).toBeVisible();
    await expect(sourceCard).toContainText("Sources, fraîcheur et confiance");
    await expect(sourceCard).toContainText("Non temps réel · live=false");
    await expect(sourceCard).toContainText("Révisé le");
    await expect(sourceCard).toContainText("âge de la revue");
    await expect(sourceCard).toContainText("Cadence");
    await expect(sourceCard).toContainText(/Confiance[\s\S]*Grade [ABC]/);
    await expect(sourceCard.locator(".fr-sports-source-assumptions li")).toHaveCount(3);
    if (UNSOURCED_SCENARIO_TOOLS.has(id)) {
      await expect(sourceCard.locator("[data-fr-source-rationale]")).toBeVisible();
      await expect(sourceCard.locator(".fr-sports-source-list")).toHaveCount(0);
    } else {
      await expect(sourceCard.locator(".fr-sports-source-list li").first()).toBeVisible();
      await expect(sourceCard.locator(".fr-sports-source-list li span").first()).not.toBeEmpty();
    }
    await expect(page.locator("[data-fr-local-export]")).toBeVisible();
    await expect(page.locator("[data-fr-download]")).toBeVisible();
    await expect(page.locator("[data-fr-import]")).toHaveCount(1);
    await expect(page.locator(".sports-lead-form")).toHaveCount(0);
    await page.locator('#fr-sports-tool-form button[type="submit"]').focus();
    await page.keyboard.press("Enter");
    await expect(page.locator(".sports-result-value")).toHaveText(expectedValue);
    const resultCore = await page.locator(
      "#fr-sports-results .sports-result-hero, #fr-sports-results .sports-metrics, #fr-sports-results .sports-table, #fr-sports-results .sports-insights"
    ).allInnerTexts();
    expect(resultCore.join(" ")).not.toMatch(
      /\b(?:Potential profit|Total return|Most likely final path|Upset setting|Base score|Player value|Net payout|Gross payout|Expected|Estimated|Suggested|Break-even|Ready|Missing|Not applied|points per|before multiplier|chance someone)\b|using \d|FPS at|day\(s\)|hours over/i
    );

    const firstNumber = page.locator('#fr-sports-tool-form input[type="number"]').first();
    if (await firstNumber.count()) {
      await firstNumber.fill("");
      await firstNumber.dispatchEvent("change");
      await expect(page.locator("[data-fr-error]")).toContainText("Saisissez une valeur numérique");
      await expect(page.locator("#fr-sports-results")).not.toContainText(/\b(?:NaN|undefined|null)\b/);
      await page.locator("[data-fr-reset]").click();
      await expect(page.locator(".sports-result-value")).toHaveText(expectedValue);
    }

    const downloadPromise = page.waitForEvent("download");
    await page.locator("[data-fr-download]").click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe(`${slug}-scenario.json`);
    const downloadPath = await download.path();
    const payload = JSON.parse(fs.readFileSync(downloadPath, "utf8"));
    expect(payload.schema).toBe("afrotools.fr.sports-scenario.v1");
    expect(payload.toolId).toBe(id);
    expect(payload.privacy).toBe("local-export");
    expect(payload.inputs).toBeTruthy();
    expect(payload.sourceReview.live).toBe(false);
    expect(payload.sourceReview.reviewedAt).toBe("2026-07-29");
    expect(payload.sourceReview.asOf).toBeTruthy();
    expect(payload.sourceReview.cadence).toBeTruthy();
    expect(payload.sourceReview.confidence.grade).toMatch(/^[ABC]$/);
    expect(payload.sourceReview.assumptions.length).toBeGreaterThanOrEqual(3);
    expect(
      payload.sourceReview.sources.length > 0 || payload.sourceReview.sourceRationale
    ).toBeTruthy();

    await page.locator("[data-fr-import]").setInputFiles(downloadPath);
    await expect(page.locator("[data-fr-export-status]")).toHaveText("Scénario rouvert depuis le fichier local.");
    await expect(page.locator(".sports-result-value")).toHaveText(expectedValue);

    await page.evaluate(() => {
      document.documentElement.setAttribute("data-theme", "dark");
      document.documentElement.style.fontSize = "200%";
    });
    const audit = await page.evaluate(() => {
      const visible = (element) => {
        const style = getComputedStyle(element);
        const rect = element.getBoundingClientRect();
        return style.display !== "none" && style.visibility !== "hidden" && rect.width > 0 && rect.height > 0;
      };
      const controls = Array.from(document.querySelectorAll(
        "#fr-sports-tool-root button, #fr-sports-tool-root input, #fr-sports-tool-root select, #fr-sports-tool-root label.fr-sports-import"
      )).filter(visible);
      const interfaceText = [
        document.querySelector("#fr-sports-tool-form")?.innerText || "",
        document.querySelector(".sports-panel-title")?.innerText || "",
        document.querySelector(".sports-report-actions")?.innerText || ""
      ].join(" ");
      return {
        overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        unnamed: controls.filter((control) => !(
          (control.textContent || "").trim()
          || control.getAttribute("aria-label")
          || (control.labels && Array.from(control.labels).some((label) => label.textContent.trim()))
        )).length,
        minTarget: Math.min(...controls.map((control) => control.getBoundingClientRect().height)),
        interfaceText
      };
    });
    expect(audit.overflow).toBeLessThanOrEqual(1);
    expect(audit.unnamed).toBe(0);
    expect(audit.minTarget).toBeGreaterThanOrEqual(40);
    expect(audit.interfaceText).not.toMatch(/\b(?:Calculate|Reset|Results|Inputs|Download|Open dashboard|Unlock report)\b/i);
    expect(forbiddenRequests).toEqual([]);
    expect(consoleErrors).toEqual([]);
  });
}

test("French Sports hub exposes the reconciled 15-app catalog at narrow width", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 844 });
  const response = await page.goto("/fr/sports/", { waitUntil: "domcontentloaded" });
  expect(response && response.status()).toBe(200);
  await expect(page.locator(".fr-sports-grid a")).toHaveCount(15);
  await expect(page.locator("h1")).toContainText("15 applications");
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
});
