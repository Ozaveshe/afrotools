const { test, expect } = require("@playwright/test");

async function resetConsent(page) {
  await page.waitForFunction(() => window.AfroTools && window.AfroTools.AIConsent);
  await page.evaluate(() => {
    window.AfroTools.AIConsent.reset("ai_optional_prompt_only", "ai-advisor");
    window.AfroTools.AIConsent.reset("ai_optional_content_included", "cv-builder");
    window.AfroTools.AIConsent.reset();
  });
}

test("reusable AI consent notices render on sensitive workflow pages", async ({ page }) => {
  await page.goto("/tools/cv-builder/", { waitUntil: "domcontentloaded" });
  await expect(page.locator("[data-ai-consent-notice][data-tool-id='cv-builder']")).toContainText("AI help is optional for CV content");

  await page.goto("/tools/pdf-workspace/", { waitUntil: "domcontentloaded" });
  await expect(page.locator("[data-ai-consent-notice][data-tool-id='pdf-workspace']")).toContainText("PDF files stay local");

  await page.goto("/tools/scholarship-finder/", { waitUntil: "domcontentloaded" });
  await expect(page.locator("[data-ai-consent-notice][data-tool-id='scholarship-finder']")).toContainText("Scholarship profile control");
});

test("AI Advisor prompt-only requests require explicit consent before network send", async ({ page }) => {
  await page.goto("/tools/pdf-workspace/", { waitUntil: "domcontentloaded" });
  await resetConsent(page);

  let calls = 0;
  let consentHeader = "";
  await page.route("**/.netlify/functions/ai-advisor", async (route) => {
    calls += 1;
    consentHeader = route.request().headers()["x-afrotools-ai-consent"] || "";
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ reply: "ok", text: "ok" }),
    });
  });

  page.once("dialog", (dialog) => dialog.dismiss());
  const declined = await page.evaluate(async () => {
    const response = await fetch("/.netlify/functions/ai-advisor", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tool: "pdf-workspace", message: "Explain this local workflow" }),
    });
    return { status: response.status, body: await response.json() };
  });
  expect(declined.status).toBe(428);
  expect(declined.body.error).toBe("ai_consent_required");
  expect(calls).toBe(0);

  page.once("dialog", (dialog) => dialog.accept());
  const accepted = await page.evaluate(async () => {
    const response = await fetch("/.netlify/functions/ai-advisor", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tool: "pdf-workspace", message: "Explain this local workflow" }),
    });
    return { status: response.status, body: await response.json() };
  });
  expect(accepted.status).toBe(200);
  expect(accepted.body.reply).toBe("ok");
  expect(calls).toBe(1);
  expect(consentHeader).toBe("accepted");
});

test("AI Advisor document/profile payloads require explicit content consent before network send", async ({ page }) => {
  await page.goto("/tools/cv-builder/", { waitUntil: "domcontentloaded" });
  await resetConsent(page);

  let calls = 0;
  let contentConsentHeader = "";
  await page.route("**/.netlify/functions/ai-advisor", async (route) => {
    calls += 1;
    contentConsentHeader = route.request().headers()["x-afrotools-ai-content-consent"] || "";
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ reply: "ok", text: "ok" }),
    });
  });

  page.once("dialog", (dialog) => dialog.dismiss());
  const declined = await page.evaluate(async () => {
    const response = await fetch("/.netlify/functions/ai-advisor", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tool: "cv-builder",
        message: "Improve this CV",
        documentContent: "Synthetic CV fixture only",
      }),
    });
    return { status: response.status, body: await response.json() };
  });
  expect(declined.status).toBe(428);
  expect(declined.body.error).toBe("ai_content_consent_required");
  expect(calls).toBe(0);

  page.once("dialog", (dialog) => dialog.accept());
  const accepted = await page.evaluate(async () => {
    const response = await fetch("/.netlify/functions/ai-advisor", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tool: "cv-builder",
        message: "Improve this CV",
        documentContent: "Synthetic CV fixture only",
      }),
    });
    return { status: response.status, body: await response.json() };
  });
  expect(accepted.status).toBe(200);
  expect(calls).toBe(1);
  expect(contentConsentHeader).toBe("accepted");
});
