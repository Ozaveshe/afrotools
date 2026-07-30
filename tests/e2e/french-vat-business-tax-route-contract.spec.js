const fs = require("node:fs");
const { test, expect } = require("@playwright/test");
const pdfParse = require("pdf-parse");

// Each physical-route contract performs two locale navigations, responsive and
// theme transitions, privacy/storage inspection, and every advertised export.
// Keep the timeout proportional to that complete proof rather than the default
// single-interaction budget.
test.setTimeout(120_000);
const {
  buildCategoryRows,
  normalizeRoute,
  routeTestTitle,
} = require("../../scripts/lib/french-vat-business-tax-live-contract");

const PRIVATE_SENTINEL = "FRVAT_PRIVATE_SENTINEL_7319";
const EXPORT_PATTERN =
  /\b(pdf|csv|json|txt|texte|export(?:er)?|télécharg(?:er|ement)|telecharg(?:er|ement)|download)\b/i;
const IMPORT_PATTERN = /\b(import(?:er)?|charger l['’]exemple)\b/i;
const CALCULATE_PATTERN =
  /\b(calcul(?:er|ez)|génér(?:er|ez)|gener(?:er|ez)|créer|creer|analyser|comparer|planifier|mettre à jour)\b/i;

const IDEA_EVIDENCE_FIXTURE = {
  id: "fr-vat-contract-idea",
  name: "Atelier solaire vérifié par scénario",
  country_code: "NG",
  country_name: "Nigeria",
  sector: "energy",
  risk: "medium",
  currency: "NGN",
  description: "Synthetic route-contract fixture.",
  startup_cost_min: 100,
  startup_cost_max: 200,
  monthly_revenue_min: 30,
  monthly_revenue_max: 50,
  breakeven_months_min: 8,
  breakeven_months_max: 14,
  created_at: "2026-07-28",
};

function runtimeFailures(page) {
  const failures = [];
  page.on("pageerror", (error) => failures.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") failures.push(message.text());
  });
  return failures;
}

function networkRecorder(page) {
  const writes = [];
  page.on("request", (request) => {
    if (request.method() !== "GET") {
      writes.push({
        method: request.method(),
        url: request.url(),
        body: request.postData() || "",
      });
    }
  });
  return writes;
}

async function fillSafeInputs(page) {
  const controls = page.locator(
    "main input:not([type=hidden]):not([type=file]):not([type=submit]):not([type=button]), main textarea",
  );
  for (let index = 0; index < (await controls.count()); index += 1) {
    const control = controls.nth(index);
    if (!(await control.isVisible()) || !(await control.isEnabled())) continue;
    const type = ((await control.getAttribute("type")) || "text").toLowerCase();
    if (["checkbox", "radio", "range", "color"].includes(type)) continue;
    const current = await control.inputValue();
    if (current.trim()) continue;
    const descriptor = [
      (await control.getAttribute("id")) || "",
      (await control.getAttribute("name")) || "",
      (await control.getAttribute("aria-label")) || "",
      (await control.evaluate((node) =>
        [...node.labels].map((label) => label.textContent || "").join(" "),
      )) || "",
    ].join(" ");
    if (type !== "number" && /devise|currency|unit(?:é|e)?/i.test(descriptor)) {
      await control.fill("XOF");
    } else if (type === "email") {
      await control.fill("synthetic@example.com");
    } else if (type === "url") {
      await control.fill("https://example.com");
    } else if (type === "date") {
      await control.fill("2026-07-28");
    } else if (type === "number" || /numeric|decimal/i.test(
      (await control.getAttribute("inputmode")) || "",
    )) {
      const minimum = Number((await control.getAttribute("min")) || "0");
      const maximum = Number((await control.getAttribute("max")) || "1000");
      const candidate = Number.isFinite(maximum)
        ? Math.min(Math.max(minimum > 0 ? minimum : 10, 10), maximum)
        : Math.max(minimum > 0 ? minimum : 1000, 1000);
      await control.fill(String(candidate));
    } else {
      await control.fill(PRIVATE_SENTINEL);
    }
  }
}

async function activateWorkflow(page) {
  await fillSafeInputs(page);
  const buttons = page.getByRole("button");
  for (let index = 0; index < (await buttons.count()); index += 1) {
    const button = buttons.nth(index);
    if (!(await button.isVisible()) || !(await button.isEnabled())) continue;
    if (
      await button.evaluate((node) =>
        Boolean(
          node.closest(
            "nav, afro-navbar, afro-footer, footer, [role=menu], .sug-btn, [class*=suggestion], [class*=chatbot]",
          ),
        ),
      )
    ) {
      continue;
    }
    const label = ((await button.innerText()) || "").trim();
    if (
      CALCULATE_PATTERN.test(label) &&
      !EXPORT_PATTERN.test(label) &&
      !/partager|share|enregistrer|save/i.test(label)
    ) {
      await button.click();
      await page.waitForTimeout(100);
      return;
    }
  }
  const form = page.locator("main form").first();
  if (await form.count()) {
    await form.evaluate((node) => node.requestSubmit());
    await page.waitForTimeout(100);
  }
}

async function visibleExportControls(page) {
  const candidates = page.locator("button, a[download]");
  const controls = [];
  for (let index = 0; index < (await candidates.count()); index += 1) {
    const control = candidates.nth(index);
    if (!(await control.isVisible())) continue;
    if (
      await control.evaluate((node) =>
        Boolean(
          node.closest(
            "nav, afro-navbar, afro-footer, footer, [role=menu], .related-tools, .sug-btn, [class*=suggestion], [class*=chatbot]",
          ),
        ),
      )
    ) {
      continue;
    }
    const diagnostics = await control.evaluate((node) => ({
      action: node.getAttribute("data-action") || "",
      exportKind: node.getAttribute("data-export") || "",
      rootHost:
        node.getRootNode() instanceof ShadowRoot
          ? node.getRootNode().host?.tagName || ""
          : "",
    }));
    if (/AFRO-(?:NAVBAR|FOOTER|SITE-ASSISTANT)/i.test(diagnostics.rootHost)) {
      continue;
    }
    const label = [
      (await control.innerText()) || "",
      (await control.getAttribute("aria-label")) || "",
      (await control.getAttribute("title")) || "",
      (await control.getAttribute("id")) || "",
      (await control.getAttribute("download")) || "",
      diagnostics.action,
      diagnostics.exportKind,
      diagnostics.rootHost,
    ].join(" ").replace(/\s+/g, " ").trim();
    if (EXPORT_PATTERN.test(label) && !IMPORT_PATTERN.test(label)) {
      const token = `fr-vat-export-${index}`;
      await control.evaluate(
        (node, value) => node.setAttribute("data-fr-vat-export-contract", value),
        token,
      );
      controls.push({
        control: page.locator(
          `[data-fr-vat-export-contract="${token}"]`,
        ),
        label,
      });
    }
  }
  return controls;
}

async function proveDownload(control, label, page) {
  await expect(control, `${label} must be enabled`).toBeEnabled();
  let download;
  try {
    const pending = page.waitForEvent("download", { timeout: 8000 });
    await control.click();
    download = await pending;
  } catch (error) {
    throw new Error(`${label} did not produce a download: ${error.message}`);
  }
  const file = await download.path();
  expect(file, `${label} must create a local download`).toBeTruthy();
  const buffer = fs.readFileSync(file);
  const filename = download.suggestedFilename().toLowerCase();
  const signature = buffer.subarray(0, 8).toString("latin1");

  if (/pdf/i.test(label) || filename.endsWith(".pdf")) {
    expect(signature.startsWith("%PDF-"), `${label} PDF signature`).toBe(true);
    const parsed = await pdfParse(buffer);
    expect(parsed.text.replace(/\s+/g, "").length, `${label} parsed PDF text`)
      .toBeGreaterThan(10);
    return "pdf";
  }
  const text = buffer.toString("utf8");
  if (/json/i.test(label) || filename.endsWith(".json")) {
    expect(() => JSON.parse(text), `${label} valid JSON`).not.toThrow();
    return "json";
  }
  if (/csv/i.test(label) || filename.endsWith(".csv")) {
    const rows = parseCsv(text);
    expect(rows.length, `${label} must contain at least one CSV record`)
      .toBeGreaterThanOrEqual(1);
    expect(rows[0].length, `${label} CSV header must expose fields`)
      .toBeGreaterThanOrEqual(2);
    return "csv";
  }
  expect(text.trim().length, `${label} non-empty export`).toBeGreaterThan(5);
  return filename.split(".").pop() || "text";
}

function parseCsv(value) {
  const rows = [[]];
  let field = "";
  let quoted = false;
  for (let index = 0; index < value.length; index += 1) {
    const character = value[index];
    if (quoted) {
      if (character === '"' && value[index + 1] === '"') {
        field += '"';
        index += 1;
      } else if (character === '"') {
        quoted = false;
      } else {
        field += character;
      }
    } else if (character === '"') {
      quoted = true;
    } else if (character === "," || character === ";") {
      rows[rows.length - 1].push(field);
      field = "";
    } else if (character === "\n") {
      rows[rows.length - 1].push(field.replace(/\r$/, ""));
      rows.push([]);
      field = "";
    } else {
      field += character;
    }
  }
  expect(quoted, "CSV quoted field must close").toBe(false);
  rows[rows.length - 1].push(field.replace(/\r$/, ""));
  return rows.filter((row) => row.some((item) => item.length));
}

async function assertAccessibleControls(page) {
  const failures = await page.evaluate(() => {
    function visible(node) {
      const style = getComputedStyle(node);
      const rect = node.getBoundingClientRect();
      return (
        style.display !== "none" &&
        style.visibility !== "hidden" &&
        rect.width > 0 &&
        rect.height > 0
      );
    }
    return [...document.querySelectorAll("input, select, textarea, button")]
      .filter((node) => visible(node) && !node.disabled)
      .filter((node) => {
        if (node.tagName === "BUTTON") {
          return !(
            (node.textContent || "").trim() ||
            node.getAttribute("aria-label") ||
            node.getAttribute("title")
          );
        }
        if (node.type === "hidden") return false;
        return !(
          node.labels?.length ||
          node.getAttribute("aria-label") ||
          node.getAttribute("aria-labelledby") ||
          node.getAttribute("title")
        );
      })
      .map((node) => `${node.tagName.toLowerCase()}#${node.id || node.name || "unnamed"}`);
  });
  expect(failures, "visible form controls need accessible names").toEqual([]);

  await page.keyboard.press("Control+Home");
  await page.keyboard.press("Tab");
  const focused = await page.evaluate(() => {
    const node = document.activeElement;
    return node && node !== document.body
      ? `${node.tagName.toLowerCase()}#${node.id || ""}.${node.className || ""}`
      : "";
  });
  expect(focused, "keyboard Tab must reach an interactive control").not.toBe("");
}

async function assertReflow(page) {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.evaluate(() => {
    document.documentElement.style.zoom = "2";
  });
  const documentOverflow = await page.evaluate(() => {
    const zoom =
      Number.parseFloat(getComputedStyle(document.documentElement).zoom) || 1;
    return (
      document.documentElement.scrollWidth / zoom -
      document.documentElement.clientWidth
    );
  });
  expect(documentOverflow, "320px at 200% must not overflow the document")
    .toBeLessThanOrEqual(1);
  await page.evaluate(() => {
    document.documentElement.style.zoom = "1";
  });
}

const rows = buildCategoryRows();

for (const row of rows) {
  test(routeTestTitle(row), async ({ page }, testInfo) => {
    const failures = runtimeFailures(page);
    const writes = networkRecorder(page);
    const route = normalizeRoute(row.primaryFrenchRoute);
    if (row.englishId === "idea-board") {
      await page.route("**/.netlify/functions/idea-evidence**", (request) =>
        request.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            rows: [IDEA_EVIDENCE_FIXTURE],
            reportedTotal: 1,
          }),
        }),
      );
    }
    await page.emulateMedia({ colorScheme: "dark", reducedMotion: "reduce" });
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(route, { waitUntil: "networkidle" });

    await expect(page.locator("html")).toHaveAttribute("lang", "fr");
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      "href",
      new RegExp(`${route.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}/?$`),
    );
    await expect(
      page.locator('link[rel="alternate"][hreflang="fr"]'),
    ).toHaveAttribute(
      "href",
      new RegExp(`${route.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}/?$`),
    );
    await expect(
      page.locator('link[rel="alternate"][hreflang="en"]'),
    ).toHaveAttribute(
      "href",
      new RegExp(
        `${normalizeRoute(row.englishRoute).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}/?$`,
      ),
    );
    const robots = await page.evaluate(
      () => document.querySelector('meta[name="robots"]')?.content || "",
    );
    expect(robots || "", "public route must not opt out of indexing").not.toMatch(
      /noindex/i,
    );
    await expect(page.locator("iframe")).toHaveCount(0);
    await expect(page.locator("afro-email-gate")).toHaveCount(0);

    await activateWorkflow(page);
    if (row.englishId === "idea-board") {
      await page.locator('[name="budget"]').fill("");
      await page.locator('[name="query"]').fill("");
      await page.locator("[data-search-form]").evaluate((form) =>
        form.requestSubmit(),
      );
      await expect(page.locator(".iee-card")).toHaveCount(1);
      await page.locator('[data-action^="add:"]').first().click();
      await expect(page.locator(".iee-compare-card")).toHaveCount(1);
      await expect
        .poll(() =>
          page.evaluate(() =>
            localStorage.getItem("afrotools:idea-evidence-shortlist:v1"),
          ),
        )
        .not.toBeNull();
    }
    if (row.englishId === "business-plan-builder") {
      await page.locator('[data-action="save"]').click();
      await expect
        .poll(() =>
          page.evaluate(() =>
            localStorage.getItem(
              "afrotools:business-plan-draft:v1:fr",
            ),
          ),
        )
        .not.toBeNull();
    }
    await assertAccessibleControls(page);
    await assertReflow(page);
    await page.evaluate(() =>
      document.documentElement.setAttribute("data-theme", "dark"),
    );
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");

    const exports = await visibleExportControls(page);
    if (process.env.FRVAT_DEBUG_EXPORTS === "1") {
      console.log(
        `FRVAT exports ${row.englishId}: ${exports.map((item) => item.label).join(" | ")}`,
      );
    }
    const exportFormats = [];
    for (const item of exports) {
      exportFormats.push(await proveDownload(item.control, item.label, page));
    }
    if (row.englishId === "business-plan-builder") {
      await page.locator('[data-action="clear"]').click();
    }

    const privacy = await page.evaluate((sentinel) => {
      const storage = [];
      for (const store of [localStorage, sessionStorage]) {
        for (let index = 0; index < store.length; index += 1) {
          const key = store.key(index);
          storage.push(`${key}=${store.getItem(key)}`);
        }
      }
      return {
        url: location.href,
        storage: storage.join("\n"),
        cookies: document.cookie,
        sentinel,
      };
    }, PRIVATE_SENTINEL);
    expect(privacy.url).not.toContain(PRIVATE_SENTINEL);
    expect(privacy.storage).not.toContain(PRIVATE_SENTINEL);
    expect(privacy.cookies).not.toContain(PRIVATE_SENTINEL);
    expect(
      writes.filter(
        (write) =>
          write.url.includes(PRIVATE_SENTINEL) ||
          write.body.includes(PRIVATE_SENTINEL),
      ),
      "synthetic private input must never leave the page",
    ).toEqual([]);
    expect(writes, "local-first routes must not perform network writes").toEqual([]);
    expect(failures, "console and page errors").toEqual([]);

    await page.goto(normalizeRoute(row.englishRoute), {
      waitUntil: "domcontentloaded",
    });
    await expect(
      page.locator('link[rel="alternate"][hreflang="fr"]'),
    ).toHaveAttribute(
      "href",
      new RegExp(`${route.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}/?$`),
    );

    testInfo.annotations.push({
      type: "fr-vat-route-contract",
      description: JSON.stringify({
        route,
        seo: true,
        reciprocalHreflang: true,
        mobile320: true,
        reflow200: true,
        systemDark: true,
        manualDark: true,
        keyboard: true,
        accessibleNames: true,
        privacy: true,
        noNetworkWrites: true,
        exportAdvertised: exports.length,
        exportsParsed: exportFormats.length,
        exportFormats,
      }),
    });
  });
}
