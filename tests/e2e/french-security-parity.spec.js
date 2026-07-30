const { test, expect } = require("@playwright/test");
const HOME_SECURITY = require("../../assets/js/engines/home-security-cost.js");

const APPS = [
  { id: "cctv-cost", route: "/fr/tools/cout-cctv/", submit: "Calculer le coût CCTV" },
  { id: "cybersecurity-assessment", route: "/fr/tools/evaluation-risque-cybersecurite/", submit: "Lancer l’évaluation" },
  { id: "data-breach-cost", route: "/fr/tools/cout-violation-donnees/", submit: "Estimer le coût" },
  { id: "fire-safety-checklist", route: "/fr/tools/checklist-securite-incendie/", submit: "Évaluer la préparation" },
  { id: "home-security-cost", route: "/fr/tools/cout-securite-maison/", submit: "Calculer les coûts" },
  { id: "password-strength", route: "/fr/tools/force-mot-de-passe/", submit: "Analyser" },
  { id: "phishing-quiz", route: "/fr/tools/quiz-phishing/" },
];

function observePage(page) {
  const consoleErrors = [];
  const pageErrors = [];
  const dataRequests = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("request", (request) => {
    if (/^https:\/\/(?:www\.google-analytics\.com|pagead2\.googlesyndication\.com)\//.test(request.url())) return;
    if (["xhr", "fetch"].includes(request.resourceType()) || !["GET", "HEAD"].includes(request.method())) {
      dataRequests.push({
        method: request.method(),
        type: request.resourceType(),
        url: request.url(),
        body: request.postData() || "",
      });
    }
  });
  return { consoleErrors, pageErrors, dataRequests };
}

test("hub Sécurité français: sept cartes, routes et illustrations canoniques", async ({ page }) => {
  const observed = observePage(page);
  await page.setViewportSize({ width: 375, height: 900 });
  await page.goto("/fr/all-tools/?category=security", { waitUntil: "domcontentloaded" });
  const cards = page.locator("#toolsGrid .tool-card");
  await expect(cards).toHaveCount(7);
  const hrefs = await cards.evaluateAll((nodes) => nodes.map((node) => node.getAttribute("href")).sort());
  expect(hrefs).toEqual(APPS.map((app) => app.route).sort());
  for (const app of APPS) {
    const card = cards.filter({ has: page.locator(`img[src*="/${app.id}.webp"]`) });
    await expect(card, `${app.id} artwork card`).toHaveCount(1);
    await expect(card.locator("img")).toHaveJSProperty("complete", true);
  }
  await expect(page.locator("link[rel=canonical]")).toHaveAttribute("href", /\/fr\/all-tools\/$/);
  await page.keyboard.press("Tab");
  expect(await page.evaluate(() => document.activeElement && document.activeElement !== document.body)).toBe(true);
  expect(observed.dataRequests).toEqual([]);
  expect(observed.consoleErrors).toEqual([]);
  expect(observed.pageErrors).toEqual([]);
});

async function expectBaseContract(page, app, width, zoom) {
  await page.setViewportSize({ width: Math.ceil(width / zoom), height: Math.ceil(900 / zoom) });
  const observed = observePage(page);
  await page.goto(app.route, { waitUntil: "domcontentloaded" });
  await expect(page.locator("html")).toHaveAttribute("lang", "fr");
  await expect(page.locator("link[rel=canonical]")).toHaveAttribute("href", new RegExp(`${app.route.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`));
  await expect(page.locator("h1")).toBeVisible();
  await expect(page.locator(`[data-fr-security-app="${app.id}"]`)).toBeVisible();
  if (app.id === "home-security-cost") {
    const controls = await page.locator('[data-fr-security-app="home-security-cost"] form').evaluate((form) =>
      Array.from(form.querySelectorAll("select")).map((control) => ({
        id: control.id,
        defaultValue: control.value,
        values: Array.from(control.options, (option) => option.value),
      }))
    );
    expect(controls).toEqual(HOME_SECURITY.CONTROL_CONTRACT);
    await expect(page.locator('[data-fr-security-app="home-security-cost"] form input:not([type="file"])')).toHaveCount(0);
  }
  await expect(page.locator('a[href="/fr/all-tools/?category=security"]')).toHaveCount(1);
  await expect(page.locator("body")).not.toContainText(/\b(Calculate|Copy summary|Print or save|Start Quiz|Question \d+ of)\b/);

  const overflow = await page.evaluate(() => ({
    root: document.documentElement.scrollWidth - window.innerWidth,
    body: document.body.scrollWidth - window.innerWidth,
  }));
  expect(overflow.root, `root overflow at ${width}px / ${zoom * 100}%`).toBeLessThanOrEqual(2);
  expect(overflow.body, `body overflow at ${width}px / ${zoom * 100}%`).toBeLessThanOrEqual(2);

  await page.locator("html").evaluate((node) => node.setAttribute("data-theme", "dark"));
  const dark = await page.locator("body").evaluate((node) => getComputedStyle(node).backgroundColor);
  await page.locator("html").evaluate((node) => node.setAttribute("data-theme", "light"));
  const light = await page.locator("body").evaluate((node) => getComputedStyle(node).backgroundColor);
  expect(dark).not.toBe(light);

  await page.keyboard.press("Tab");
  expect(await page.evaluate(() => document.activeElement && document.activeElement !== document.body)).toBe(true);
  const unlabeled = await page.locator("[data-fr-security-app] input:not([type=hidden]), [data-fr-security-app] select, [data-fr-security-app] textarea").evaluateAll((controls) =>
    controls.filter((control) => {
      const id = control.id;
      return !control.getAttribute("aria-label") &&
        !control.getAttribute("aria-labelledby") &&
        !(id && document.querySelector(`label[for="${CSS.escape(id)}"]`)) &&
        !control.closest("label");
    }).map((control) => control.outerHTML)
  );
  expect(unlabeled).toEqual([]);
  expect(observed.consoleErrors).toEqual([]);
  expect(observed.pageErrors).toEqual([]);
  return observed;
}

for (const app of APPS) {
  test(`${app.id}: 320px, thèmes, clavier, a11y et réseau privé`, async ({ page }) => {
    const observed = await expectBaseContract(page, app, 320, 1);
    if (app.id === "password-strength") {
      await page.locator("#password").fill("Longue-Phrase-Unique-2026!");
      await expect(page.locator(".frs-results")).toHaveAttribute("data-visible", "true");
      await expect(page.locator("[data-export]")).toHaveCount(0);
      await expect(page.locator("[data-copy]")).toHaveCount(0);
    } else if (app.id === "phishing-quiz") {
      await page.getByRole("button", { name: "Commencer le quiz" }).focus();
      await page.keyboard.press("Enter");
      await expect(page.locator("[data-question]")).toBeVisible();
    } else {
      await page.getByRole("button", { name: app.submit }).focus();
      await page.keyboard.press("Enter");
      await expect(page.locator(".frs-results")).toHaveAttribute("data-visible", "true");
    }
    expect(observed.dataRequests).toEqual([]);
  });

  test(`${app.id}: 375px et contraste des deux thèmes`, async ({ page }) => {
    const observed = await expectBaseContract(page, app, 375, 1);
    expect(observed.dataRequests).toEqual([]);
  });

  test(`${app.id}: reflow à 200%`, async ({ page }) => {
    const observed = await expectBaseContract(page, app, 375, 2);
    expect(observed.dataRequests).toEqual([]);
  });
}

for (const app of APPS.filter((item) => !["password-strength", "phishing-quiz"].includes(item.id))) {
  test(`${app.id}: export JSON réel, validation et réouverture locale`, async ({ page }) => {
    const observed = observePage(page);
    await page.goto(app.route, { waitUntil: "domcontentloaded" });

    if (app.id === "cctv-cost") {
      await page.locator("#cameraType").selectOption("analog");
      await page.locator("#recorder").selectOption("nvr");
      await page.getByRole("button", { name: app.submit }).click();
      await expect(page.locator(".frs-status")).toContainText("DVR");
      await page.locator("#recorder").selectOption("dvr");
    } else if (app.id === "data-breach-cost") {
      await page.locator("#records").fill("0");
      await page.getByRole("button", { name: app.submit }).click();
      await expect(page.locator(".frs-status")).toContainText("compris entre 1");
      await page.locator("#records").fill("10000");
    } else if (app.id === "fire-safety-checklist") {
      await page.locator("#area").fill("0");
      await page.getByRole("button", { name: app.submit }).click();
      await expect(page.locator(".frs-status")).toContainText("surface");
      await page.locator("#area").fill("500");
    }

    await page.getByRole("button", { name: app.submit }).click();
    await expect(page.locator(".frs-results")).toHaveAttribute("data-visible", "true");

    await page.locator("[data-import-file]").setInputFiles({
      name: "scenario-invalide.json",
      mimeType: "application/json",
      buffer: Buffer.from(JSON.stringify({
        schemaVersion: 1,
        app: app.id,
        locale: "fr",
        data: { country: "XX" },
      })),
    });
    await expect(page.locator(".frs-status")).toContainText("option inconnue");

    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("button", { name: "Exporter JSON" }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe(`afrotools-${app.id}-fr.json`);
    const downloadPath = await download.path();
    expect(downloadPath).toBeTruthy();

    await page.locator("[data-import-file]").setInputFiles(downloadPath);
    await expect(page.locator(".frs-status")).toContainText("rouvert");
    await expect(page.locator(".frs-results")).toHaveAttribute("data-visible", "true");
    expect(observed.dataRequests).toEqual([]);
    expect(observed.consoleErrors).toEqual([]);
    expect(observed.pageErrors).toEqual([]);
  });
}

test("password-strength: aucun secret ne sort du champ", async ({ page }) => {
  const observed = observePage(page);
  const sentinel = "Secret-Synthetique-Ne-Jamais-Transmettre-2026!";
  await page.goto("/fr/tools/force-mot-de-passe/", { waitUntil: "domcontentloaded" });
  await page.locator("#password").fill(sentinel);
  await expect(page.locator(".frs-results")).toHaveAttribute("data-visible", "true");
  await expect(page.locator("body")).not.toContainText(sentinel);
  expect(observed.dataRequests.some((request) => request.body.includes(sentinel) || request.url.includes(encodeURIComponent(sentinel)))).toBe(false);
  expect(observed.dataRequests).toEqual([]);
  expect(observed.consoleErrors).toEqual([]);
  expect(observed.pageErrors).toEqual([]);
});

test("phishing-quiz: 10 scénarios, navigation clavier et export non sensible", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  const observed = observePage(page);
  await page.goto("/fr/tools/quiz-phishing/", { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: "Commencer le quiz" }).click();
  const answers = [1, 1, 2, 1, 1, 1, 1, 1, 1, 1];
  for (let index = 0; index < answers.length; index += 1) {
    const option = page.locator(`[data-answer="${answers[index]}"]`);
    await option.focus();
    await page.keyboard.press("Enter");
    await expect(page.locator("[data-explanation]")).toBeVisible();
    await page.locator("[data-next]").focus();
    await page.keyboard.press("Enter");
  }
  await expect(page.locator(".frs-results")).toHaveAttribute("data-visible", "true");
  await expect(page.locator(".frs-result-value")).toHaveText("10/10");
  await page.getByRole("button", { name: "Copier le résumé non sensible" }).click();
  const copied = await page.evaluate(() => navigator.clipboard.readText());
  expect(copied).toContain("Score : 10/10");
  expect(copied).not.toMatch(/gtbank|paypa1|numéro de compte/i);
  expect(observed.dataRequests).toEqual([]);
  expect(observed.consoleErrors).toEqual([]);
  expect(observed.pageErrors).toEqual([]);
});
