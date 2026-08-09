const { test, expect } = require("@playwright/test");

const route = "/sw/zana/boresha-linkedin/";
const localOrigin = new URL(process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:4173").origin;

function diagnostics(page) {
  const errors = [];
  const external = [];
  const writes = [];
  page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("request", (request) => {
    const url = new URL(request.url());
    if (url.origin !== localOrigin) external.push(request.url());
    if (!["GET", "HEAD", "OPTIONS"].includes(request.method())) writes.push(`${request.method()} ${request.url()}`);
  });
  return { errors, external, writes };
}

test("Swahili LinkedIn optimizer preserves the complete score and action-plan workflow", async ({ page, context }) => {
  const seen = diagnostics(page);
  await context.grantPermissions(["clipboard-read", "clipboard-write"], { origin: localOrigin });
  await page.setViewportSize({ width: 375, height: 844 });
  const response = await page.goto(route, { waitUntil: "domcontentloaded" });
  expect(response && response.ok()).toBeTruthy();
  await expect(page.locator("html")).toHaveAttribute("lang", "sw");
  await expect(page.locator('meta[name="afrotools-sw-source-owner"]')).toHaveAttribute("content", "scripts/build-sw-linkedin-optimizer-final.js");
  await expect(page.locator("#industry option")).toHaveCount(12);
  await expect(page.locator("#level option")).toHaveCount(6);
  await expect(page.locator('[id^="chk_"]')).toHaveCount(12);

  const invalid = await page.evaluate(() => window.AfroTools.LinkedInOptimizerEngine.calculate({
    industry: "__invalid__", level: "__invalid__", connections: "__invalid__", checks: { chk_photo: "yes" },
  }));
  expect(invalid).toMatchObject({ score: 0, input: { industry: "software", level: "student", connections: "0" } });

  await page.getByRole("button", { name: /Kagua wasifu wangu/i }).click();
  await expect(page.locator("#profileScore")).toHaveText("0%");
  await expect(page.locator("#checklistStatus .check-row")).toHaveCount(12);
  await expect(page.locator("#checklistStatus")).toContainText("Picha ya kitaalamu");
  await expect(page.locator("#checklistStatus")).not.toContainText("Professional photo");
  await expect(page.locator("#headlines .headline-card")).toHaveCount(6);
  await expect(page.locator("#growthStrategy")).toContainText("connections chini ya 100");

  await page.locator("#industry").selectOption("data");
  await page.locator("#level").selectOption("mid");
  await page.locator("#connections").selectOption("2");
  for (const id of ["chk_photo", "chk_headline", "chk_about", "chk_experience", "chk_education", "chk_skills", "chk_endorsements", "chk_recommendations", "chk_featured", "chk_creator", "chk_banner"]) await page.locator(`#${id}`).check();
  await page.getByRole("button", { name: /Kagua wasifu wangu/i }).click();
  await expect(page.locator("#profileScore")).toHaveText("90%");
  await expect(page.locator("#allStarBadge")).toContainText("WASIFU UMEKAMILIKA");
  await expect(page.locator("#headlines .headline-card")).toHaveCount(6);
  await expect(page.locator("#headlines")).toContainText("Mtaalamu wa data");
  await expect(page.locator("#keywords")).toContainText("Data Analyst");
  await expect(page.locator("#growthStrategy")).toContainText("connections 500 au zaidi");

  await page.locator("#planCountry").selectOption({ label: "Kenya" });
  await page.locator("#planScore").fill("62");
  await page.locator("#planGap").selectOption("sehemu ya About");
  await page.locator("#planOutreach").fill("7");
  await page.getByRole("button", { name: "Tengeneza mpango" }).click();
  const plan = await page.locator("#linkedinPlanResult").innerText();
  expect(plan).toContain("Mpango wa LinkedIn — Kenya");
  expect(plan).toContain("Score ya sasa: 62/100");
  expect(plan).toContain("mawasiliano 7");
  await page.locator("#copyLinkedInPlan").click();
  await expect(page.locator("#linkedinPlanStatus")).toHaveText("Mpango umenakiliwa.");
  const reopenedClipboard = await page.evaluate(() => navigator.clipboard.readText());
  expect(reopenedClipboard.replace(/\r\n/g, "\n")).toBe(plan.replace(/\r\n/g, "\n"));

  await page.locator("#planScore").fill("101");
  await page.evaluate(() => document.getElementById("linkedinPlanForm").dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })));
  await expect(page.locator("#linkedinPlanResult")).toHaveText("Weka score kati ya 0 na 100 na idadi ya mawasiliano isiyo hasi.");
  await expect(page.locator("#copyLinkedInPlan")).toBeDisabled();

  await page.locator("#resetLinkedIn").click();
  await expect(page.locator("#profileScore")).toHaveText("0%");
  await expect(page.locator('[id^="chk_"]:checked')).toHaveCount(0);
  await expect(page.locator("#results")).not.toHaveClass(/on/);
  await expect(page.locator("#planScore")).toHaveValue("55");
  await expect(page.locator("#linkedinPlanStatus")).toHaveText("Fomu imerudishwa mwanzo.");

  expect(seen.external).toEqual([]);
  expect(seen.writes).toEqual([]);
  expect(seen.errors).toEqual([]);
});

for (const width of [320, 375]) {
  test(`Swahili LinkedIn optimizer reflows at ${width}px and 200% text`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.goto(route, { waitUntil: "domcontentloaded" });
    await page.evaluate(() => { document.documentElement.style.fontSize = "200%"; });
    const audit = await page.evaluate(() => {
      const visible = (node) => { const style = getComputedStyle(node); const rect = node.getBoundingClientRect(); return style.display !== "none" && style.visibility !== "hidden" && rect.width > 0 && rect.height > 0; };
      const controls = Array.from(document.querySelectorAll("button,input,select,textarea")).filter(visible);
      return {
        overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        unnamed: controls.filter((node) => !((node.textContent || "").trim() || node.getAttribute("aria-label") || node.getAttribute("title") || (node.labels && Array.from(node.labels).some((label) => label.textContent.trim())))).length,
      };
    });
    expect(audit.overflow).toBeLessThanOrEqual(1);
    expect(audit.unnamed).toBe(0);
    for (const theme of ["light", "dark"]) {
      await page.evaluate((value) => document.documentElement.setAttribute("data-theme", value), theme);
      await expect(page.locator("#industry")).toBeVisible();
      await expect(page.locator("#linkedinPlanForm")).toBeVisible();
    }
    await page.locator("#industry").focus();
    expect(await page.locator("#industry").evaluate((node) => document.activeElement === node)).toBeTruthy();
  });
}

test("English LinkedIn optimizer retains frozen fixture labels and result oracle", async ({ page }) => {
  await page.goto("/tools/linkedin-optimizer/", { waitUntil: "domcontentloaded" });
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.getByRole("button", { name: /Optimise My Profile/i })).toBeVisible();
  await expect(page.locator("#industry option")).toHaveCount(12);
  await page.getByRole("button", { name: /Optimise My Profile/i }).click();
  await expect(page.locator("#profileScore")).toHaveText("0%");
  await expect(page.locator("#checklistStatus")).toContainText("Professional photo");
});
