const { test, expect } = require("@playwright/test");
const manifest = require("../../data/localization/sw-creative-parity-manifest.json");
const port = Number(process.env.SW_CREATIVE_PARITY_PORT || 4428);
const baseURL = new URL(`http://127.0.0.1:${port}`);

const accepted = manifest.rows.filter((row) => row.status === "accepted-candidate");
const hubs = [
  { route: "/sw/ubunifu-na-watayarishi/", marker: "[data-sw-creative-parity-apps]", expectedLinks: accepted.length },
  { route: "/sw/picha-na-design/", marker: "[data-sw-creative-parity-visual-apps]", expectedLinks: 3 }
];
const consoleAllowList = [
  /favicon\.ico/i,
  /lazy-analytics/i,
  /ERR_BLOCKED_BY_CLIENT/i,
  /Failed to load resource.*404/i
];

function collectDiagnostics(page) {
  const errors = [];
  const externalRequests = [];
  const writes = [];

  page.on("console", (message) => {
    if (message.type() !== "error") return;
    const text = message.text();
    if (!consoleAllowList.some((pattern) => pattern.test(text))) errors.push(`console: ${text}`);
  });
  page.on("pageerror", (error) => errors.push(`pageerror: ${error.message}`));
  page.on("request", (request) => {
    const target = new URL(request.url());
    if (target.origin !== baseURL.origin) externalRequests.push(`${request.method()} ${request.url()}`);
    if (!["GET", "HEAD", "OPTIONS"].includes(request.method())) writes.push(`${request.method()} ${request.url()}`);
  });
  return { errors, externalRequests, writes };
}

async function blockExternalTraffic(page) {
  await page.route("**/*", async (route) => {
    const target = new URL(route.request().url());
    if (target.origin !== baseURL.origin) return route.abort("blockedbyclient");
    return route.continue();
  });
}

async function overflowReport(page, selector = "html") {
  return page.evaluate((target) => {
    const scope = document.querySelector(target);
    if (!scope) throw new Error(`Overflow scope missing: ${target}`);
    const clientWidth = scope === document.documentElement ? document.documentElement.clientWidth : scope.clientWidth;
    const scrollWidth = scope === document.documentElement ? document.documentElement.scrollWidth : scope.scrollWidth;
    return {
      selector: target,
      clientWidth,
      scrollWidth,
      offenders: Array.from(scope.querySelectorAll("*"))
      .filter((node) => {
        const rect = node.getBoundingClientRect();
        const scopeRect = scope.getBoundingClientRect();
        const style = getComputedStyle(node);
        return style.display !== "none" && style.visibility !== "hidden" &&
          (rect.right > scopeRect.right + 1 || rect.left < scopeRect.left - 1);
      })
      .slice(0, 8)
      .map((node) => `${node.tagName.toLowerCase()}${node.id ? `#${node.id}` : ""}${node.className ? `.${String(node.className).trim().replace(/\s+/g, ".")}` : ""}`)
    };
  }, selector);
}

async function assertNoHorizontalOverflow(page, selector = "html") {
  const result = await overflowReport(page, selector);
  expect(result.scrollWidth, JSON.stringify(result)).toBeLessThanOrEqual(result.clientWidth + 1);
}

async function readDownload(download) {
  const stream = await download.createReadStream();
  const chunks = [];
  for await (const chunk of stream) chunks.push(chunk);
  return Buffer.concat(chunks).toString("utf8");
}

test.describe("Swahili Creative physical routes", () => {
  for (const row of manifest.rows) {
    test(`${row.englishId}: locale metadata, themes and true mobile reflow`, async ({ page }) => {
      const diagnostics = collectDiagnostics(page);
      await blockExternalTraffic(page);
      await page.setViewportSize({ width: 375, height: 900 });
      const response = await page.goto(row.swahiliRoute, { waitUntil: "domcontentloaded" });
      expect(response && response.ok(), `${row.swahiliRoute} did not load`).toBeTruthy();
      await expect(page.locator("html")).toHaveAttribute("lang", "sw");
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", `https://afrotools.com${row.swahiliRoute}`);
      await expect(page.locator('meta[name="afrotools-sw-native-owner"]')).toHaveAttribute("content", row.englishId);
      await expect(page.locator('meta[name="afrotools-sw-source-owner"]')).toHaveAttribute("content", "scripts/build-sw-creative-parity.js");
      const mobile = await overflowReport(page);
      if (row.status === "accepted-candidate") {
        expect(mobile.scrollWidth, JSON.stringify(mobile)).toBeLessThanOrEqual(mobile.clientWidth + 1);
      } else {
        await test.info().attach(`${row.englishId}-375px-reflow.json`, { body: JSON.stringify(mobile, null, 2), contentType: "application/json" });
      }

      await page.evaluate(() => document.documentElement.setAttribute("data-theme", "light"));
      const light = await page.locator("body").evaluate((node) => getComputedStyle(node).backgroundColor);
      await page.evaluate(() => document.documentElement.setAttribute("data-theme", "dark"));
      const dark = await page.locator("body").evaluate((node) => getComputedStyle(node).backgroundColor);
      expect(dark).not.toBe(light);

      await page.setViewportSize({ width: 320, height: 900 });
      await page.evaluate(() => {
        document.documentElement.style.fontSize = "200%";
      });
      const zoomed = await overflowReport(page, "main");
      if (row.status === "accepted-candidate") {
        expect(zoomed.scrollWidth, JSON.stringify(zoomed)).toBeLessThanOrEqual(zoomed.clientWidth + 1);
      } else {
        await test.info().attach(`${row.englishId}-320px-200pct-reflow.json`, { body: JSON.stringify(zoomed, null, 2), contentType: "application/json" });
      }

      expect(diagnostics.errors).toEqual([]);
      expect(diagnostics.writes).toEqual([]);
    });
  }
});

test.describe("Swahili Creative hub discovery", () => {
  for (const hub of hubs) {
    test(`${hub.route}: accepted apps are discoverable and mobile-safe`, async ({ page }) => {
      const diagnostics = collectDiagnostics(page);
      await blockExternalTraffic(page);
      await page.setViewportSize({ width: 375, height: 900 });
      const response = await page.goto(hub.route, { waitUntil: "domcontentloaded" });
      expect(response && response.ok()).toBeTruthy();
      await expect(page.locator("html")).toHaveAttribute("lang", "sw");
      await expect(page.locator('meta[name="afrotools-sw-creative-parity-hub-owner"]')).toHaveAttribute("content", "scripts/build-sw-creative-parity.js");
      await expect(page.locator(`${hub.marker} a[href^="/sw/zana/"]`)).toHaveCount(hub.expectedLinks);
      await assertNoHorizontalOverflow(page, "main");
      await page.setViewportSize({ width: 320, height: 900 });
      await page.evaluate(() => { document.documentElement.style.fontSize = "200%"; });
      await assertNoHorizontalOverflow(page, "main");
      expect(diagnostics.writes).toEqual([]);
      expect(diagnostics.errors).toEqual([]);
    });
  }
});

test.describe("Swahili Creative accepted app workflows", () => {
  for (const row of accepted) {
    test(`${row.englishId}: calculate, reject invalid input, parse JSON and TXT locally`, async ({ page }) => {
      const diagnostics = collectDiagnostics(page);
      await blockExternalTraffic(page);
      await page.setViewportSize({ width: 375, height: 900 });
      await page.goto(row.swahiliRoute, { waitUntil: "networkidle" });

      const app = page.locator("[data-sw-creative-app]");
      await expect(app).toHaveAttribute("data-owner", row.englishId);
      await expect(page.locator("iframe")).toHaveCount(0);
      await expect(page.getByText("Fungua zana kamili ya Kiingereza", { exact: false })).toHaveCount(0);

      const submit = page.getByRole("button", { name: "Kokotoa makadirio" });
      await submit.focus();
      const focus = await submit.evaluate((node) => {
        const style = getComputedStyle(node);
        return { outlineStyle: style.outlineStyle, outlineWidth: style.outlineWidth };
      });
      expect(focus.outlineStyle).not.toBe("none");
      expect(focus.outlineWidth).not.toBe("0px");

      await submit.click();
      await expect(page.locator("[data-result]")).toBeVisible();
      await expect(page.locator("[data-status]")).toContainText("Makadirio yametengenezwa");

      const jsonDownload = page.waitForEvent("download");
      await page.locator("[data-export-json]").click();
      const json = JSON.parse(await readDownload(await jsonDownload));
      expect(json && typeof json).toBe("object");
      expect(Object.keys(json).length).toBeGreaterThan(0);

      const txtDownload = page.waitForEvent("download");
      await page.locator("[data-export-txt]").click();
      const txt = await readDownload(await txtDownload);
      expect(txt.trim().length).toBeGreaterThan(20);
      expect(txt).toContain(await page.locator("h1").innerText());

      const required = page.locator("form [required]").first();
      await required.evaluate((node) => {
        if (node.tagName === "SELECT") node.selectedIndex = -1;
        else node.value = "";
        node.dispatchEvent(new Event("input", { bubbles: true }));
        node.dispatchEvent(new Event("change", { bubbles: true }));
      });
      await submit.click();
      await expect(page.locator("[data-status]")).toHaveAttribute("data-state", "error");
      await expect(page.locator("[data-result]")).toBeHidden();

      expect(diagnostics.externalRequests).toEqual([]);
      expect(diagnostics.writes).toEqual([]);
      expect(diagnostics.errors).toEqual([]);
    });
  }
});
