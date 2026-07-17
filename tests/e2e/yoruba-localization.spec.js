const { test, expect } = require("@playwright/test");

const DESKTOP = { width: 1366, height: 900 };
const MOBILE = { width: 390, height: 844 };
const LOCAL_BASE = "http://127.0.0.1:4173";

const TARGET_ROUTES = [
  {
    name: "Yoruba PAYE salary tax",
    path: "/yo/naijiria/owo-ori-owo-osu/",
    async exercise(page) {
      await page.locator("#salary").fill("4800000");
      await page.locator("#calcBtn").click();
      await expect(page.locator("#resultBox strong").first()).not.toHaveText(/--|NaN/);
    },
  },
  {
    name: "Yoruba VAT calculator",
    path: "/yo/awon-ise/kalkuletan-vat/",
    async exercise(page) {
      await page.locator("#amount").fill("250000");
      await page.locator("#calcSingle").click();
      const resultText = await page.locator("#result strong").first().innerText();
      expect(resultText).not.toMatch(/--|NaN/);
      expect(resultText).toMatch(/[1-9]/);
    },
  },
  {
    name: "Yoruba invoice generator",
    path: "/yo/awon-ise/kiriiro-invoice/",
    async exercise(page) {
      await page.locator("#seller").fill("Afro Market Ventures");
      await page.locator("#build").click();
      await expect(page.locator("#paper")).toContainText("Afro Market Ventures");
      await expect(page.locator("#paper")).toContainText(/INV-YO-001|INV/i);
    },
  },
  {
    name: "Yoruba PDF merge and split",
    path: "/yo/awon-ise/hada-ati-pin-pdf/",
    pdfRelatedCards: true,
    async exercise(page) {
      await expect(page.locator("#mergeFileInput")).toBeAttached();
      await expect(page.locator("#mergeBtn")).toBeDisabled();
      await page.locator('[data-mode="split"]').click();
      await expect(page.locator("#split-card")).toBeVisible();
      await expect(page.locator("#splitFileInput")).toBeAttached();
    },
  },
  {
    name: "Yoruba PDF compress",
    path: "/yo/awon-ise/din-iwon-pdf/",
    pdfRelatedCards: true,
    async exercise(page) {
      await expect(page.locator("#pdfFileInput")).toBeAttached();
      await expect(page.locator("#compressBtn")).toBeDisabled();
      await page.locator('[data-preset="custom"]').click();
      await expect(page.locator("#customPanel")).toBeVisible();
    },
  },
  {
    name: "Yoruba JAMB calculator",
    path: "/yo/awon-ise/kalkuletan-jamb/",
    async exercise(page) {
      await page.locator("#utme").fill("300");
      await page.locator("#postUtme").fill("70");
      await page.locator("#calcBtn").click();
      await expect(page.locator("#result strong").first()).not.toHaveText(/--|NaN/);
    },
  },
  {
    name: "Yoruba USSD directory",
    path: "/yo/awon-ise/lambobin-ussd/",
    async exercise(page) {
      await expect.poll(async () => page.locator("#countrySelect option").count()).toBeGreaterThan(1);
      const firstCountry = await page.locator("#countrySelect option").nth(1).getAttribute("value");
      expect(firstCountry).toBeTruthy();
      await page.locator("#countrySelect").selectOption(firstCountry);
      await expect.poll(async () => page.locator("#codesArea .code-card, #codesArea article, #codesArea button.copy").count()).toBeGreaterThan(0);
      await page.locator("#searchInput").fill("MTN");
      await expect(page.locator("#codesArea")).toContainText(/MTN|USSD/i);
    },
  },
  {
    name: "Yoruba genotype checker",
    path: "/yo/awon-ise/duba-genotype/",
    async exercise(page) {
      await page.locator("#geno1").selectOption("AA");
      await page.locator("#geno2").selectOption("AS");
      await page.locator("#genoBtn").click();
      await expect(page.locator("#results")).toBeVisible();
      await expect(page.locator("#resultsBody")).toContainText(/AA|AS/);
    },
  },
  {
    name: "Yoruba farm budget",
    path: "/yo/awon-ise/isuna-ogbin/",
    async exercise(page) {
      await page.locator("#calcBtn").click();
      await expect(page.locator("#budgetResult")).toBeVisible();
      await expect(page.locator("#totalBudget")).not.toHaveText(/--|NaN/);
    },
  },
  {
    name: "Yoruba phrase translator",
    path: "/yo/awon-ise/olufassara-yoruba/",
    async exercise(page) {
      await expect(page.locator("#phraseGrid .phrase").first()).toBeVisible();
      await page.locator("#phraseGrid .phrase").first().click();
      await expect(page.locator("#phraseResult strong")).toBeVisible();
      await page.locator("#writing button").first().click();
      await expect(page.locator("#draftResult")).not.toHaveText(/^Yan /);
    },
  },
];

function toLocalPath(href) {
  if (!href || href.startsWith("#")) return null;
  if (/^(mailto|tel|javascript|whatsapp):/i.test(href)) return null;
  let url;
  try {
    url = new URL(href, LOCAL_BASE);
  } catch {
    return null;
  }
  const isLocal = url.hostname === "127.0.0.1" && url.port === "4173";
  const isProduction = url.hostname === "afrotools.com" || url.hostname === "www.afrotools.com";
  if (!isLocal && !isProduction) return null;
  if (url.pathname.startsWith("/api/")) return null;
  if (url.pathname.startsWith("/.netlify/functions/")) return null;
  return `${url.pathname}${url.search}`;
}

function createToolImageTracker(page) {
  const state = {
    localizedToolImageRequests: [],
    missingToolImages: [],
  };
  const onRequest = (request) => {
    const path = toLocalPath(request.url());
    if (path && /\/assets\/img\/tools\/[^/]+-yo\.(webp|png|jpg|jpeg|svg)$/i.test(path)) {
      state.localizedToolImageRequests.push(path);
    }
  };
  const onResponse = (response) => {
    const path = toLocalPath(response.url());
    if (path && path.startsWith("/assets/img/tools/") && response.status() >= 400) {
      state.missingToolImages.push(`${path} -> ${response.status()}`);
    }
  };
  page.on("request", onRequest);
  page.on("response", onResponse);
  return {
    state,
    dispose() {
      page.off("request", onRequest);
      page.off("response", onResponse);
    },
  };
}

async function assertRouteStatus(request, path) {
  const response = await request.get(path, { failOnStatusCode: false });
  expect(response.status(), `${path} should resolve`).toBe(200);
}

async function gotoRoute(page, path) {
  const response = await page.goto(path, { waitUntil: "domcontentloaded" });
  expect(response && response.status(), `${path} should load in browser`).toBe(200);
  await expect(page.locator("h1").first()).toBeVisible();
  await expect(page.locator("main").first()).toBeVisible();
}

async function assertMainControlsVisible(page) {
  await expect(
    page.locator('main input:not([type="hidden"]), main select, main textarea, main button').first(),
  ).toBeVisible();
}

async function assertNoHorizontalOverflow(page) {
  await expect.poll(async () => page.evaluate(() => {
    const doc = document.documentElement;
    const body = document.body;
    const scrollWidth = Math.max(doc.scrollWidth, body ? body.scrollWidth : 0);
    return scrollWidth <= window.innerWidth + 2;
  })).toBe(true);
}

async function documentHrefs(page) {
  return page.evaluate(() => Array.from(document.querySelectorAll("a[href]"), (anchor) => anchor.getAttribute("href")));
}

async function navbarHrefs(page) {
  return page.evaluate(() => {
    const nav = document.querySelector("afro-navbar");
    const root = nav && nav.shadowRoot;
    if (!root) return [];
    return Array.from(root.querySelectorAll("a[href]"), (anchor) => anchor.getAttribute("href"));
  });
}

async function assertLocalPathsResolve(request, hrefs, label) {
  const paths = Array.from(new Set(hrefs.map(toLocalPath).filter(Boolean)));
  expect(paths.length, `${label} should expose local links`).toBeGreaterThan(0);
  const missing = [];
  for (const path of paths) {
    const response = await request.get(path, { failOnStatusCode: false });
    if (response.status() >= 400) missing.push(`${path} -> ${response.status()}`);
  }
  expect(missing, `${label} should not include broken same-site hrefs`).toEqual([]);
}

async function assertYorubaLinksResolve(request, hrefs, label) {
  const paths = Array.from(new Set(hrefs.map(toLocalPath).filter((path) => path && path.startsWith("/yo/"))));
  expect(paths.length, `${label} should expose Yoruba links`).toBeGreaterThan(0);
  const missing = [];
  for (const path of paths) {
    const response = await request.get(path, { failOnStatusCode: false });
    if (response.status() >= 400) missing.push(`${path} -> ${response.status()}`);
  }
  expect(missing, `${label} should not include broken Yoruba hrefs`).toEqual([]);
}

async function relatedCardCount(page) {
  return page.evaluate(() => Array.from(document.querySelectorAll("afro-related-tools")).reduce((total, host) => {
    const root = host.shadowRoot;
    return total + (root ? root.querySelectorAll("a[href]").length : 0);
  }, 0));
}

async function assertPdfRelatedCards(page, tracker) {
  await expect.poll(async () => relatedCardCount(page)).toBeGreaterThan(0);
  expect(tracker.state.localizedToolImageRequests, "PDF related cards should not request localized -yo tool images").toEqual([]);
  expect(tracker.state.missingToolImages, "PDF related-card tool images should not 404").toEqual([]);
}

async function waitForNavbar(page) {
  await expect.poll(async () => page.evaluate(() => {
    const nav = document.querySelector("afro-navbar");
    return Boolean(nav && nav.shadowRoot && nav.shadowRoot.querySelector(".burger"));
  })).toBe(true);
}

test.describe("Yoruba localized route browser fixtures", () => {
  for (const route of TARGET_ROUTES) {
    test(`${route.name} is stable on desktop and mobile`, async ({ page, request }) => {
      await assertRouteStatus(request, route.path);

      await page.setViewportSize(DESKTOP);
      const desktopTracker = createToolImageTracker(page);
      try {
        await gotoRoute(page, route.path);
        await assertMainControlsVisible(page);
        await route.exercise(page);
        const hrefs = await documentHrefs(page);
        await assertYorubaLinksResolve(request, hrefs, `${route.path} document`);
        await assertLocalPathsResolve(request, hrefs, `${route.path} document`);
        if (route.pdfRelatedCards) await assertPdfRelatedCards(page, desktopTracker);
      } finally {
        desktopTracker.dispose();
      }

      await page.setViewportSize(MOBILE);
      const mobileTracker = createToolImageTracker(page);
      try {
        await gotoRoute(page, route.path);
        await assertMainControlsVisible(page);
        await assertNoHorizontalOverflow(page);
        if (route.pdfRelatedCards) await assertPdfRelatedCards(page, mobileTracker);
      } finally {
        mobileTracker.dispose();
      }
    });
  }

  test("Yoruba mobile navbar opens and language links stay resolvable", async ({ page, request }) => {
    await page.setViewportSize(MOBILE);
    await gotoRoute(page, "/yo/awon-ise/kalkuletan-vat/");
    await waitForNavbar(page);

    await page.evaluate(() => {
      const nav = document.querySelector("afro-navbar");
      nav.shadowRoot.querySelector(".burger").click();
    });

    await expect.poll(async () => page.evaluate(() => {
      const root = document.querySelector("afro-navbar").shadowRoot;
      return {
        expanded: root.querySelector(".burger").getAttribute("aria-expanded"),
        mobileOpen: root.querySelector(".mob").classList.contains("open"),
      };
    })).toEqual({ expanded: "true", mobileOpen: true });

    const hrefs = await navbarHrefs(page);
    const languageHrefs = await page.evaluate(() => {
      const root = document.querySelector("afro-navbar").shadowRoot;
      return Array.from(root.querySelectorAll(".lang-opt[href], .mob-lang-opt[href]"), (anchor) => anchor.getAttribute("href"));
    });
    expect(languageHrefs.length, "language switch should expose alternate links").toBeGreaterThan(0);
    await assertLocalPathsResolve(request, languageHrefs, "Yoruba language switch");
    await assertYorubaLinksResolve(request, hrefs, "Yoruba navbar");
  });
});
