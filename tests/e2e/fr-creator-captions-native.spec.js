const { test, expect } = require("@playwright/test");

const ROUTE = "/fr/tools/legendes-createur/app";

async function openFrenchApp(page) {
  const consoleErrors = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  await page.goto(ROUTE);
  await expect(page.locator("html")).toHaveAttribute("lang", "fr");
  await expect(page.locator("#langSelect")).toHaveValue("french");
  return consoleErrors;
}

test("French Creator Captions generates locally, exports parseable TXT, and sends no request", async ({ page }) => {
  let aiPosts = 0;
  await page.route("**/.netlify/functions/creator-captions/**", async (route) => {
    aiPosts += 1;
    await route.abort();
  });
  const consoleErrors = await openFrenchApp(page);

  await page.locator("#topicInput").fill("lancement de notre atelier créatif à Dakar");
  await page.locator("#generateBtn").click();
  await expect(page.locator("#writeOutput .ccr-output-card")).toHaveCount(3);
  await expect(page.locator("#writeOutput")).toContainText("La version claire");
  await expect(page.locator("#writeOutput")).toContainText("Enregistrez");
  expect(aiPosts).toBe(0);

  const downloadPromise = page.waitForEvent("download");
  await page.locator("#writeOutput #exportAllBtn").click();
  const download = await downloadPromise;
  const text = require("node:fs").readFileSync(await download.path(), "utf8");
  expect(text).toContain("lancement de notre atelier créatif");
  expect(text).toContain("Instagram");
  expect((text.match(/^--- .+ ---$/gm) || []).length).toBe(3);
  expect(consoleErrors).toEqual([]);
});

test("French Creator Captions fails safely and local rewrite remains private", async ({ page }) => {
  let aiPosts = 0;
  await page.route("**/.netlify/functions/creator-captions/**", async (route) => {
    aiPosts += 1;
    await route.abort();
  });
  const consoleErrors = await openFrenchApp(page);

  await page.locator("#generateBtn").click();
  await expect(page.locator("#writeOutput .ccr-output-card")).toHaveCount(0);
  await page.getByRole("button", { name: /Réécrire/ }).first().click();
  await page.locator("#rewriteInput").fill("Notre coopérative ouvre un atelier samedi.");
  await page.locator("#rewriteBtn").click();
  await expect(page.locator("#rewriteOutput .ccr-output-card")).toHaveCount(3);
  await expect(page.locator("#rewriteOutput")).toContainText("Qu’en pensez-vous");
  expect(aiPosts).toBe(0);
  expect(consoleErrors).toEqual([]);
});

test("AI transport is fail-closed until explicit consent and exposes the exact payload", async ({ page }) => {
  const requests = [];
  await page.route("**/.netlify/functions/creator-captions/generate", async (route) => {
    requests.push(route.request().postDataJSON());
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        output: JSON.stringify({
          captions: [
            { variation: 1, label: "IA 1", text: "Texte IA 1", charCount: 10, withinLimit: true, hashtags: [], cta: "", firstLinePreview: "Texte IA 1" },
            { variation: 2, label: "IA 2", text: "Texte IA 2", charCount: 10, withinLimit: true, hashtags: [], cta: "", firstLinePreview: "Texte IA 2" },
            { variation: 3, label: "IA 3", text: "Texte IA 3", charCount: 10, withinLimit: true, hashtags: [], cta: "", firstLinePreview: "Texte IA 3" }
          ],
          platformTip: "Relisez avant publication."
        })
      })
    });
  });
  await openFrenchApp(page);
  await page.locator("#topicInput").fill("annonce consentie");
  await page.locator("#generateBtn").click();
  expect(requests).toHaveLength(0);

  await page.locator("#aiGenerateConsent").check();
  await page.locator("#generateBtn").click();
  await expect.poll(() => requests.length).toBe(1);
  expect(requests[0].brief).toBe("annonce consentie");
  expect(requests[0].platform).toBe("instagram");
  expect(requests[0].prompt).toContain("Write the captions in French");
});

for (const width of [320, 375]) {
  test(`French Creator Captions reflows at ${width}px and keeps keyboard focus visible`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await openFrenchApp(page);
    await page.locator("#topicInput").fill("atelier mobile");
    await page.locator("#generateBtn").click();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(1);
    await page.locator("#topicInput").focus();
    expect(await page.locator("#topicInput").evaluate((node) => getComputedStyle(node).outlineStyle !== "none" || getComputedStyle(node).boxShadow !== "none")).toBe(true);
    await expect(page.locator("#aiGenerateConsent")).not.toBeChecked();
  });
}

test("French Creator Captions supports manual and system dark mode at 200% reflow", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await page.setViewportSize({ width: 640, height: 900 });
  await openFrenchApp(page);
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
  await page.evaluate(() => {
    localStorage.setItem("aft_theme", "light");
    location.reload();
  });
  await page.waitForLoadState("domcontentloaded");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", "https://afrotools.com/fr/tools/legendes-createur/app");
  await expect(page.locator('link[hreflang="en"]')).toHaveAttribute("href", "https://afrotools.com/tools/creator-captions/app");
});
