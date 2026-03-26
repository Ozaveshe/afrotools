#!/usr/bin/env node
/**
 * AfroTools Sentinel — QA Testing Agent
 * ======================================
 * Single-agent test runner that validates all AfroTools functionality.
 * Uses Puppeteer for browser automation against the live Netlify deployment.
 *
 * Usage:
 *   node sentinel.js                    # Test all tools
 *   node sentinel.js --tool ng-paye     # Test single tool by slug fragment
 *   node sentinel.js --category tax     # Test all tools in a category
 *   node sentinel.js --tier 1           # Test all Tier 1 tools
 *   node sentinel.js --dry-run          # List what would be tested without running
 *
 * Output:
 *   sentinel/reports/sentinel-report.json   — Machine-readable results
 *   sentinel/reports/sentinel-report.html   — Human-readable dashboard
 */

const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");

// ==================== CONFIGURATION ====================

const CONFIG = {
  baseUrl: process.env.AFROTOOLS_BASE_URL || "https://afrotools.com",
  timeout: 30000,
  viewports: {
    desktop: { width: 1280, height: 800 },
    tablet: { width: 768, height: 1024 },
    mobile: { width: 375, height: 812 },
  },
  concurrency: 3, // parallel browser tabs
  retries: 2,
  reportDir: path.join(__dirname, "reports"),
};

// ==================== REGISTRY LOADER ====================

function loadRegistry(filters = {}) {
  const registry = JSON.parse(
    fs.readFileSync(path.join(__dirname, "tool-registry.json"), "utf-8")
  );
  let tools = registry.tools.filter((t) => t.status === "live");

  if (filters.tool) {
    tools = tools.filter((t) => t.slug.includes(filters.tool));
  }
  if (filters.category) {
    tools = tools.filter((t) => t.category.includes(filters.category));
  }
  if (filters.tier) {
    tools = tools.filter((t) => t.tier === parseInt(filters.tier));
  }
  return { ...registry, tools };
}

// ==================== TEST MODULES ====================

/**
 * Each test module exports an async function that receives:
 *   - page: Puppeteer Page instance
 *   - tool: Tool registry entry
 *   - config: Global config
 *
 * Returns: { name, status: 'PASS'|'FAIL'|'WARN'|'SKIP', message, details? }
 */

const testSEO = async (page, tool) => {
  const results = [];

  // Title tag
  const title = await page.title();
  const hasYear = /202[4-9]/.test(title);
  const hasAfroTools = /afrotools/i.test(title);
  const titleLength = title.length;

  results.push({
    name: "seo:title-exists",
    status: title && titleLength > 10 ? "PASS" : "FAIL",
    message: title
      ? `Title: "${title}" (${titleLength} chars)`
      : "Missing or empty title tag",
  });

  results.push({
    name: "seo:title-has-year",
    status: hasYear ? "PASS" : "WARN",
    message: hasYear
      ? "Title includes current year"
      : "Title missing year — add 2026 for SEO freshness",
  });

  results.push({
    name: "seo:title-has-brand",
    status: hasAfroTools ? "PASS" : "WARN",
    message: hasAfroTools
      ? "Title includes AfroTools brand"
      : "Title missing AfroTools brand name",
  });

  // Meta description
  const metaDesc = await page.$eval(
    'meta[name="description"]',
    (el) => el.content
  ).catch(() => null);

  results.push({
    name: "seo:meta-description",
    status: metaDesc && metaDesc.length >= 80 && metaDesc.length <= 160
      ? "PASS"
      : metaDesc
        ? "WARN"
        : "FAIL",
    message: metaDesc
      ? `Meta description: ${metaDesc.length} chars ${metaDesc.length < 80 ? "(too short)" : metaDesc.length > 160 ? "(too long)" : "(good)"}`
      : "Missing meta description",
  });

  // Canonical
  const canonical = await page.$eval(
    'link[rel="canonical"]',
    (el) => el.href
  ).catch(() => null);

  results.push({
    name: "seo:canonical",
    status: canonical ? "PASS" : "FAIL",
    message: canonical
      ? `Canonical: ${canonical}`
      : "Missing canonical URL — critical for avoiding duplicate content",
  });

  // Open Graph
  const ogTitle = await page.$eval(
    'meta[property="og:title"]',
    (el) => el.content
  ).catch(() => null);
  const ogDesc = await page.$eval(
    'meta[property="og:description"]',
    (el) => el.content
  ).catch(() => null);
  const ogImage = await page.$eval(
    'meta[property="og:image"]',
    (el) => el.content
  ).catch(() => null);

  results.push({
    name: "seo:og-tags",
    status: ogTitle && ogDesc ? "PASS" : ogTitle || ogDesc ? "WARN" : "FAIL",
    message: `OG tags: title=${!!ogTitle}, desc=${!!ogDesc}, image=${!!ogImage}`,
  });

  // Schema.org JSON-LD
  const schemaScripts = await page.$$eval(
    'script[type="application/ld+json"]',
    (scripts) => scripts.map((s) => s.textContent)
  );
  let schemaValid = false;
  for (const script of schemaScripts) {
    try {
      const parsed = JSON.parse(script);
      if (parsed["@type"] === "WebApplication" || parsed["@type"] === "FAQPage") {
        schemaValid = true;
      }
    } catch (e) {
      // malformed JSON-LD
    }
  }

  const tierRequiresSchema = tool.tier <= 2;
  results.push({
    name: "seo:schema-jsonld",
    status: schemaValid
      ? "PASS"
      : tierRequiresSchema
        ? "FAIL"
        : "WARN",
    message: schemaValid
      ? `Found ${schemaScripts.length} JSON-LD block(s)`
      : `Missing Schema.org JSON-LD${tierRequiresSchema ? " — required for Tier " + tool.tier : ""}`,
  });

  // Internal links
  const internalLinks = await page.$$eval(
    'a[href^="/"], a[href*="afrotools.com"]',
    (links) => links.map((l) => l.href)
  );
  const uniqueInternalLinks = [...new Set(internalLinks)].length;
  const minLinks = tool.tier === 1 ? 5 : tool.tier === 2 ? 3 : 2;

  results.push({
    name: "seo:internal-links",
    status: uniqueInternalLinks >= minLinks ? "PASS" : "WARN",
    message: `${uniqueInternalLinks} internal links (minimum ${minLinks} for Tier ${tool.tier})`,
  });

  // H1 tag
  const h1 = await page.$eval("h1", (el) => el.textContent.trim()).catch(
    () => null
  );
  results.push({
    name: "seo:h1-exists",
    status: h1 ? "PASS" : "FAIL",
    message: h1 ? `H1: "${h1}"` : "Missing H1 tag",
  });

  return results;
};

const testMobile = async (page, tool) => {
  const results = [];

  // Set mobile viewport
  await page.setViewport({ width: 375, height: 812, isMobile: true });
  await page.waitForTimeout(1000);

  // Check for horizontal overflow
  const hasHorizontalScroll = await page.evaluate(() => {
    return document.documentElement.scrollWidth > document.documentElement.clientWidth;
  });

  results.push({
    name: "mobile:no-horizontal-scroll",
    status: hasHorizontalScroll ? "FAIL" : "PASS",
    message: hasHorizontalScroll
      ? "Page has horizontal scroll at 375px — content overflowing"
      : "No horizontal overflow at 375px",
  });

  // Check touch target sizes
  const smallTargets = await page.evaluate(() => {
    const interactive = document.querySelectorAll(
      'button, a, input, select, [role="button"], .btn'
    );
    const small = [];
    for (const el of interactive) {
      const rect = el.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        if (rect.width < 44 || rect.height < 44) {
          small.push({
            tag: el.tagName,
            text: el.textContent?.slice(0, 30),
            width: Math.round(rect.width),
            height: Math.round(rect.height),
          });
        }
      }
    }
    return small;
  });

  results.push({
    name: "mobile:touch-targets",
    status: smallTargets.length === 0
      ? "PASS"
      : smallTargets.length <= 3
        ? "WARN"
        : "FAIL",
    message: `${smallTargets.length} interactive elements below 44px touch target`,
    details: smallTargets.length > 0 ? smallTargets.slice(0, 5) : undefined,
  });

  // Check viewport meta
  const viewportMeta = await page.$eval(
    'meta[name="viewport"]',
    (el) => el.content
  ).catch(() => null);

  results.push({
    name: "mobile:viewport-meta",
    status: viewportMeta && viewportMeta.includes("width=device-width")
      ? "PASS"
      : "FAIL",
    message: viewportMeta
      ? `Viewport: ${viewportMeta}`
      : "Missing viewport meta tag",
  });

  // Check font sizes (nothing below 14px)
  const smallFonts = await page.evaluate(() => {
    const allText = document.querySelectorAll("p, span, td, th, li, a, label");
    let count = 0;
    for (const el of allText) {
      const style = getComputedStyle(el);
      const size = parseFloat(style.fontSize);
      if (size > 0 && size < 14 && el.textContent.trim().length > 0) {
        count++;
      }
    }
    return count;
  });

  results.push({
    name: "mobile:font-size",
    status: smallFonts === 0 ? "PASS" : smallFonts <= 5 ? "WARN" : "FAIL",
    message: `${smallFonts} text elements with font-size < 14px on mobile`,
  });

  // Reset viewport
  await page.setViewport(CONFIG.viewports.desktop);

  return results;
};

const testPDFExport = async (page, tool) => {
  const results = [];

  // Check if print/PDF button exists
  const printButton = await page.$(
    'button[onclick*="print"], [data-action="print"], .print-btn, button:has-text("PDF"), button:has-text("Print")'
  ).catch(() => null);

  // Broader search
  const printButtonAlt = await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll("button, a"));
    return buttons.some(
      (b) =>
        /pdf|print|save|download/i.test(b.textContent) ||
        /pdf|print/i.test(b.className)
    );
  });

  if (!tool.features.includes("pdf")) {
    results.push({
      name: "pdf:feature-check",
      status: "SKIP",
      message: "PDF export not in tool features list",
    });
    return results;
  }

  results.push({
    name: "pdf:button-exists",
    status: printButton || printButtonAlt ? "PASS" : "FAIL",
    message: printButton || printButtonAlt
      ? "PDF/Print button found"
      : "No PDF/Print button found — check button selector or text",
  });

  // Check @media print CSS exists
  const hasPrintCSS = await page.evaluate(() => {
    for (const sheet of document.styleSheets) {
      try {
        for (const rule of sheet.cssRules) {
          if (rule.type === CSSRule.MEDIA_RULE && rule.conditionText?.includes("print")) {
            return true;
          }
        }
      } catch (e) {
        // cross-origin stylesheet
      }
    }
    return false;
  });

  results.push({
    name: "pdf:print-css",
    status: hasPrintCSS ? "PASS" : "WARN",
    message: hasPrintCSS
      ? "@media print CSS rules found"
      : "No @media print CSS detected — PDF output may include navigation/footer",
  });

  return results;
};

const testShareCopy = async (page, tool) => {
  const results = [];

  if (!tool.features.includes("share")) {
    results.push({
      name: "share:feature-check",
      status: "SKIP",
      message: "Share not in tool features list",
    });
    return results;
  }

  // Check share button exists
  const shareExists = await page.evaluate(() => {
    const els = Array.from(document.querySelectorAll("button, a"));
    return els.some((e) => /share|copy/i.test(e.textContent));
  });

  results.push({
    name: "share:button-exists",
    status: shareExists ? "PASS" : "FAIL",
    message: shareExists
      ? "Share/Copy button found"
      : "No Share/Copy button found",
  });

  // Check clipboard API usage in scripts
  const hasClipboardAPI = await page.evaluate(() => {
    const scripts = Array.from(document.querySelectorAll("script"));
    return scripts.some(
      (s) =>
        s.textContent.includes("navigator.clipboard") ||
        s.textContent.includes("execCommand")
    );
  });

  results.push({
    name: "share:clipboard-api",
    status: hasClipboardAPI ? "PASS" : "WARN",
    message: hasClipboardAPI
      ? "Clipboard API or execCommand found in page scripts"
      : "No clipboard integration detected — share may not work on desktop",
  });

  return results;
};

const testAIAdvisor = async (page, tool) => {
  const results = [];

  if (!tool.features.includes("ai")) {
    results.push({
      name: "ai:feature-check",
      status: "SKIP",
      message: "AI Advisor not in tool features list",
    });
    return results;
  }

  // Check AI advisor UI exists
  const aiSection = await page.evaluate(() => {
    const els = Array.from(document.querySelectorAll("*"));
    return els.some(
      (e) =>
        /ai.*advisor|ask.*claude|ai.*assistant|powered.*claude/i.test(
          e.textContent
        ) && e.textContent.length < 200
    );
  });

  results.push({
    name: "ai:ui-exists",
    status: aiSection ? "PASS" : "FAIL",
    message: aiSection
      ? "AI Advisor section found"
      : "AI Advisor UI not found on page",
  });

  // Check for input field
  const hasInput = await page.$(
    'input[placeholder*="ask"], textarea[placeholder*="ask"], .ai-input, .advisor-input'
  ).catch(() => null);

  const hasInputAlt = await page.evaluate(() => {
    const inputs = Array.from(
      document.querySelectorAll("input, textarea")
    );
    return inputs.some((i) => /ask|question|advisor/i.test(i.placeholder || ""));
  });

  results.push({
    name: "ai:input-field",
    status: hasInput || hasInputAlt ? "PASS" : "WARN",
    message:
      hasInput || hasInputAlt
        ? "AI input field found"
        : "AI input field not found — check selector",
  });

  return results;
};

const testEmailCapture = async (page, tool) => {
  const results = [];

  if (!tool.features.includes("email")) {
    results.push({
      name: "email:feature-check",
      status: "SKIP",
      message: "Email capture not in tool features list",
    });
    return results;
  }

  // Check for email modal or form
  const hasEmailForm = await page.evaluate(() => {
    const scripts = Array.from(document.querySelectorAll("script"));
    const htmlContent = document.body.innerHTML;
    return (
      htmlContent.includes("email") &&
      (htmlContent.includes("modal") ||
        htmlContent.includes("google.com/forms") ||
        scripts.some((s) => s.textContent.includes("forms.google.com")))
    );
  });

  results.push({
    name: "email:form-exists",
    status: hasEmailForm ? "PASS" : "WARN",
    message: hasEmailForm
      ? "Email capture form/modal detected"
      : "Email capture integration not detected in page source",
  });

  // Check localStorage usage
  const hasLocalStorage = await page.evaluate(() => {
    const scripts = Array.from(document.querySelectorAll("script"));
    return scripts.some(
      (s) =>
        s.textContent.includes("localStorage") &&
        s.textContent.includes("email")
    );
  });

  results.push({
    name: "email:localstorage-prefill",
    status: hasLocalStorage ? "PASS" : "WARN",
    message: hasLocalStorage
      ? "localStorage integration for email prefill detected"
      : "No localStorage email prefill — returning users must re-enter email",
  });

  return results;
};

const testLiveData = async (page, tool) => {
  const results = [];

  if (!tool.liveData) {
    results.push({
      name: "livedata:feature-check",
      status: "SKIP",
      message: "Not a live data tool",
    });
    return results;
  }

  // Monitor network requests for API calls
  const apiCalls = [];
  page.on("response", (response) => {
    const url = response.url();
    if (
      url.includes("api") ||
      url.includes("exchange") ||
      url.includes("rates")
    ) {
      apiCalls.push({
        url,
        status: response.status(),
      });
    }
  });

  // Wait for potential API calls
  await page.waitForTimeout(5000);

  results.push({
    name: "livedata:api-calls",
    status: apiCalls.length > 0 ? "PASS" : "WARN",
    message: `${apiCalls.length} API call(s) detected`,
    details:
      apiCalls.length > 0
        ? apiCalls.map((c) => `${c.status} ${c.url.slice(0, 80)}`)
        : undefined,
  });

  // Check for staleness indicator
  const hasFreshnessIndicator = await page.evaluate(() => {
    const text = document.body.textContent;
    return /last.*updated|as.*of|refreshed|live/i.test(text);
  });

  results.push({
    name: "livedata:freshness-indicator",
    status: hasFreshnessIndicator ? "PASS" : "WARN",
    message: hasFreshnessIndicator
      ? "Data freshness indicator found"
      : "No 'last updated' or freshness indicator — users cannot judge data age",
  });

  return results;
};

const testCalculation = async (page, tool) => {
  const results = [];

  if (!tool.referenceFixture) {
    results.push({
      name: "calc:fixture-check",
      status: "SKIP",
      message: "No reference fixture for this tool",
    });
    return results;
  }

  const fixturePath = path.join(
    __dirname,
    "fixtures",
    tool.referenceFixture
  );

  if (!fs.existsSync(fixturePath)) {
    results.push({
      name: "calc:fixture-missing",
      status: "WARN",
      message: `Reference fixture file not found: ${tool.referenceFixture}`,
    });
    return results;
  }

  const fixture = JSON.parse(fs.readFileSync(fixturePath, "utf-8"));

  for (const testCase of fixture.testCases || []) {
    try {
      // Fill in inputs
      for (const [selector, value] of Object.entries(testCase.inputs || {})) {
        await page.evaluate(
          (sel, val) => {
            const el = document.querySelector(sel);
            if (el) {
              el.value = val;
              el.dispatchEvent(new Event("input", { bubbles: true }));
              el.dispatchEvent(new Event("change", { bubbles: true }));
            }
          },
          selector,
          value
        );
      }

      // Click calculate if there's a button
      const calcBtn = await page.$(
        'button[type="submit"], .calculate-btn, button:has-text("Calculate")'
      );
      if (calcBtn) await calcBtn.click();

      await page.waitForTimeout(1000);

      // Check outputs
      for (const [selector, expected] of Object.entries(
        testCase.expectedOutputs || {}
      )) {
        const actual = await page
          .$eval(selector, (el) => el.textContent.trim())
          .catch(() => null);

        if (actual === null) {
          results.push({
            name: `calc:${testCase.name}:${selector}`,
            status: "FAIL",
            message: `Output element not found: ${selector}`,
          });
          continue;
        }

        // Extract numeric value for comparison
        const actualNum = parseFloat(actual.replace(/[^0-9.-]/g, ""));
        const expectedNum = parseFloat(
          String(expected).replace(/[^0-9.-]/g, "")
        );

        if (isNaN(actualNum) || isNaN(expectedNum)) {
          results.push({
            name: `calc:${testCase.name}:${selector}`,
            status: "WARN",
            message: `Could not parse numeric values — actual: "${actual}", expected: "${expected}"`,
          });
        } else {
          const tolerance = fixture.tolerance || 0.01;
          const diff = Math.abs(actualNum - expectedNum) / Math.max(Math.abs(expectedNum), 1);

          results.push({
            name: `calc:${testCase.name}:${selector}`,
            status: diff <= tolerance ? "PASS" : "FAIL",
            message:
              diff <= tolerance
                ? `Match: ${actualNum} ≈ ${expectedNum} (${(diff * 100).toFixed(4)}% diff)`
                : `MISMATCH: got ${actualNum}, expected ${expectedNum} (${(diff * 100).toFixed(2)}% diff, tolerance: ${tolerance * 100}%)`,
          });
        }
      }
    } catch (err) {
      results.push({
        name: `calc:${testCase.name}`,
        status: "FAIL",
        message: `Test case error: ${err.message}`,
      });
    }
  }

  return results;
};

const testAccessibility = async (page, tool) => {
  const results = [];

  // Check for alt text on images
  const imagesWithoutAlt = await page.evaluate(() => {
    const imgs = Array.from(document.querySelectorAll("img"));
    return imgs.filter((i) => !i.alt || i.alt.trim() === "").length;
  });

  results.push({
    name: "a11y:img-alt",
    status: imagesWithoutAlt === 0 ? "PASS" : "WARN",
    message: `${imagesWithoutAlt} image(s) missing alt text`,
  });

  // Check for form labels
  const inputsWithoutLabels = await page.evaluate(() => {
    const inputs = Array.from(
      document.querySelectorAll("input, select, textarea")
    );
    return inputs.filter((i) => {
      if (i.type === "hidden") return false;
      const hasLabel = i.labels && i.labels.length > 0;
      const hasAriaLabel = i.getAttribute("aria-label");
      const hasAriaLabelledBy = i.getAttribute("aria-labelledby");
      const hasTitle = i.title;
      return !hasLabel && !hasAriaLabel && !hasAriaLabelledBy && !hasTitle;
    }).length;
  });

  results.push({
    name: "a11y:form-labels",
    status: inputsWithoutLabels === 0
      ? "PASS"
      : inputsWithoutLabels <= 2
        ? "WARN"
        : "FAIL",
    message: `${inputsWithoutLabels} form input(s) without labels or ARIA attributes`,
  });

  // Check color contrast (basic check: text on background)
  const lowContrast = await page.evaluate(() => {
    function luminance(r, g, b) {
      const [rs, gs, bs] = [r, g, b].map((c) => {
        c = c / 255;
        return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
      });
      return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
    }
    function parseColor(c) {
      const m = c.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
      return m ? [+m[1], +m[2], +m[3]] : null;
    }

    let issues = 0;
    const textEls = document.querySelectorAll("p, span, h1, h2, h3, h4, a, li, td");
    for (const el of Array.from(textEls).slice(0, 50)) {
      const style = getComputedStyle(el);
      const fg = parseColor(style.color);
      const bg = parseColor(style.backgroundColor);
      if (fg && bg && bg[0] + bg[1] + bg[2] > 0) {
        const l1 = luminance(...fg);
        const l2 = luminance(...bg);
        const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
        if (ratio < 4.5) issues++;
      }
    }
    return issues;
  });

  results.push({
    name: "a11y:color-contrast",
    status: lowContrast === 0 ? "PASS" : lowContrast <= 3 ? "WARN" : "FAIL",
    message: `${lowContrast} element(s) with contrast ratio < 4.5:1 (sampled first 50 text elements)`,
  });

  // Check focus visibility
  const hasFocusStyles = await page.evaluate(() => {
    for (const sheet of document.styleSheets) {
      try {
        for (const rule of sheet.cssRules) {
          if (rule.selectorText && rule.selectorText.includes(":focus")) {
            return true;
          }
        }
      } catch (e) {}
    }
    return false;
  });

  results.push({
    name: "a11y:focus-styles",
    status: hasFocusStyles ? "PASS" : "WARN",
    message: hasFocusStyles
      ? "Focus styles detected in CSS"
      : "No :focus styles found — keyboard users cannot see current element",
  });

  // Check lang attribute
  const hasLang = await page.evaluate(() => {
    return !!document.documentElement.getAttribute("lang");
  });

  results.push({
    name: "a11y:html-lang",
    status: hasLang ? "PASS" : "FAIL",
    message: hasLang
      ? `HTML lang attribute set: ${document.documentElement?.lang}`
      : "Missing lang attribute on <html> — screen readers need this",
  });

  return results;
};

const testPerformance = async (page, tool) => {
  const results = [];

  // Page weight
  const metrics = await page.evaluate(() => {
    const entries = performance.getEntriesByType("resource");
    let totalSize = 0;
    let jsSize = 0;
    let cssSize = 0;
    let imgSize = 0;
    for (const entry of entries) {
      const size = entry.transferSize || 0;
      totalSize += size;
      if (/\.js(\?|$)/.test(entry.name)) jsSize += size;
      if (/\.css(\?|$)/.test(entry.name)) cssSize += size;
      if (/\.(png|jpg|jpeg|webp|gif|svg)(\?|$)/.test(entry.name)) imgSize += size;
    }
    return {
      totalKB: Math.round(totalSize / 1024),
      jsKB: Math.round(jsSize / 1024),
      cssKB: Math.round(cssSize / 1024),
      imgKB: Math.round(imgSize / 1024),
      resourceCount: entries.length,
    };
  });

  results.push({
    name: "perf:page-weight",
    status: metrics.totalKB <= 150 ? "PASS" : metrics.totalKB <= 300 ? "WARN" : "FAIL",
    message: `Total: ${metrics.totalKB}KB (JS: ${metrics.jsKB}KB, CSS: ${metrics.cssKB}KB, Images: ${metrics.imgKB}KB, ${metrics.resourceCount} resources)`,
  });

  // Load timing
  const timing = await page.evaluate(() => {
    const nav = performance.getEntriesByType("navigation")[0];
    if (!nav) return null;
    return {
      domContentLoaded: Math.round(nav.domContentLoadedEventEnd),
      loadComplete: Math.round(nav.loadEventEnd),
      ttfb: Math.round(nav.responseStart),
    };
  });

  if (timing) {
    results.push({
      name: "perf:load-time",
      status: timing.loadComplete <= 3000
        ? "PASS"
        : timing.loadComplete <= 5000
          ? "WARN"
          : "FAIL",
      message: `Load: ${timing.loadComplete}ms, DOMContentLoaded: ${timing.domContentLoaded}ms, TTFB: ${timing.ttfb}ms`,
    });
  }

  return results;
};

// ==================== TEST ORCHESTRATOR ====================

const TEST_MODULES = [
  { name: "SEO", fn: testSEO, always: true },
  { name: "Mobile", fn: testMobile, always: true },
  { name: "Accessibility", fn: testAccessibility, always: true },
  { name: "Performance", fn: testPerformance, always: true },
  { name: "PDF Export", fn: testPDFExport, feature: "pdf" },
  { name: "Share/Copy", fn: testShareCopy, feature: "share" },
  { name: "AI Advisor", fn: testAIAdvisor, feature: "ai" },
  { name: "Email Capture", fn: testEmailCapture, feature: "email" },
  { name: "Live Data", fn: testLiveData, liveData: true },
  { name: "Calculation", fn: testCalculation, fixture: true },
];

async function testTool(browser, tool) {
  const url = `${CONFIG.baseUrl}${tool.slug}`;
  const toolResults = {
    tool: tool.name,
    slug: tool.slug,
    country: tool.country,
    tier: tool.tier,
    category: tool.category,
    url,
    timestamp: new Date().toISOString(),
    tests: [],
    summary: { pass: 0, fail: 0, warn: 0, skip: 0 },
  };

  let page;
  try {
    page = await browser.newPage();
    await page.setViewport(CONFIG.viewports.desktop);

    // Navigate
    const response = await page.goto(url, {
      waitUntil: "networkidle2",
      timeout: CONFIG.timeout,
    });

    if (!response || response.status() >= 400) {
      toolResults.tests.push({
        name: "http:status",
        status: "FAIL",
        message: `HTTP ${response?.status() || "no response"} for ${url}`,
      });
      toolResults.summary.fail++;
      return toolResults;
    }

    toolResults.tests.push({
      name: "http:status",
      status: "PASS",
      message: `HTTP ${response.status()}`,
    });
    toolResults.summary.pass++;

    // Run applicable test modules
    for (const mod of TEST_MODULES) {
      const shouldRun =
        mod.always ||
        (mod.feature && tool.features.includes(mod.feature)) ||
        (mod.liveData && tool.liveData) ||
        (mod.fixture && tool.referenceFixture);

      if (!shouldRun) continue;

      try {
        const moduleResults = await mod.fn(page, tool);
        for (const r of moduleResults) {
          toolResults.tests.push(r);
          toolResults.summary[r.status.toLowerCase()]++;
        }
      } catch (err) {
        toolResults.tests.push({
          name: `${mod.name.toLowerCase()}:error`,
          status: "FAIL",
          message: `Module error: ${err.message}`,
        });
        toolResults.summary.fail++;
      }
    }
  } catch (err) {
    toolResults.tests.push({
      name: "runtime:error",
      status: "FAIL",
      message: `Tool test failed: ${err.message}`,
    });
    toolResults.summary.fail++;
  } finally {
    if (page) await page.close().catch(() => {});
  }

  return toolResults;
}

// ==================== REPORT GENERATOR ====================

function generateHTMLReport(report) {
  const totalTools = report.results.length;
  const totalTests = report.results.reduce(
    (sum, r) => sum + r.tests.length,
    0
  );
  const totalPass = report.results.reduce(
    (sum, r) => sum + r.summary.pass,
    0
  );
  const totalFail = report.results.reduce(
    (sum, r) => sum + r.summary.fail,
    0
  );
  const totalWarn = report.results.reduce(
    (sum, r) => sum + r.summary.warn,
    0
  );

  const toolRows = report.results
    .map((r) => {
      const overall =
        r.summary.fail > 0 ? "fail" : r.summary.warn > 0 ? "warn" : "pass";
      const testCells = r.tests
        .map(
          (t) =>
            `<span class="badge badge-${t.status.toLowerCase()}" title="${t.message}">${t.name}</span>`
        )
        .join(" ");

      return `
      <tr class="row-${overall}">
        <td><strong>${r.tool}</strong><br><small>${r.slug}</small></td>
        <td>Tier ${r.tier}</td>
        <td>${r.country}</td>
        <td class="status-${overall}">${overall.toUpperCase()}</td>
        <td>${r.summary.pass}/${r.tests.length}</td>
        <td class="test-badges">${testCells}</td>
      </tr>`;
    })
    .join("\n");

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>AfroTools Sentinel Report — ${report.timestamp}</title>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background:#f5f5f5; color:#333; }
  .header { background:#008751; color:#fff; padding:24px 32px; }
  .header h1 { font-size:24px; font-weight:700; }
  .header p { opacity:0.8; margin-top:4px; }
  .stats { display:flex; gap:16px; padding:24px 32px; background:#fff; border-bottom:1px solid #e0e0e0; }
  .stat { flex:1; text-align:center; padding:16px; border-radius:8px; }
  .stat-value { font-size:32px; font-weight:700; }
  .stat-label { font-size:13px; color:#666; margin-top:4px; }
  .stat-pass { background:#E8F5E9; color:#2E7D32; }
  .stat-fail { background:#FFEBEE; color:#C62828; }
  .stat-warn { background:#FFF8E1; color:#F57F17; }
  .stat-total { background:#E3F2FD; color:#1565C0; }
  .content { padding:24px 32px; }
  table { width:100%; border-collapse:collapse; background:#fff; border-radius:8px; overflow:hidden; box-shadow:0 1px 3px rgba(0,0,0,0.1); }
  th { background:#008751; color:#fff; padding:12px 16px; text-align:left; font-size:13px; text-transform:uppercase; letter-spacing:0.5px; }
  td { padding:10px 16px; border-bottom:1px solid #f0f0f0; font-size:14px; vertical-align:top; }
  tr:hover { background:#f9f9f9; }
  .status-pass { color:#2E7D32; font-weight:700; }
  .status-fail { color:#C62828; font-weight:700; }
  .status-warn { color:#F57F17; font-weight:700; }
  .row-fail { border-left:4px solid #C62828; }
  .row-warn { border-left:4px solid #F57F17; }
  .row-pass { border-left:4px solid #2E7D32; }
  .badge { display:inline-block; padding:2px 8px; border-radius:4px; font-size:11px; margin:2px; }
  .badge-pass { background:#E8F5E9; color:#2E7D32; }
  .badge-fail { background:#FFEBEE; color:#C62828; }
  .badge-warn { background:#FFF8E1; color:#F57F17; }
  .badge-skip { background:#F5F5F5; color:#9E9E9E; }
  .test-badges { max-width:400px; }
  .footer { text-align:center; padding:24px; color:#999; font-size:13px; }
</style>
</head>
<body>
  <div class="header">
    <h1>🛡️ AfroTools Sentinel Report</h1>
    <p>Generated: ${report.timestamp} | Duration: ${report.duration}ms | Base URL: ${report.baseUrl}</p>
  </div>
  <div class="stats">
    <div class="stat stat-total"><div class="stat-value">${totalTools}</div><div class="stat-label">Tools Tested</div></div>
    <div class="stat stat-total"><div class="stat-value">${totalTests}</div><div class="stat-label">Total Tests</div></div>
    <div class="stat stat-pass"><div class="stat-value">${totalPass}</div><div class="stat-label">Passed</div></div>
    <div class="stat stat-fail"><div class="stat-value">${totalFail}</div><div class="stat-label">Failed</div></div>
    <div class="stat stat-warn"><div class="stat-value">${totalWarn}</div><div class="stat-label">Warnings</div></div>
  </div>
  <div class="content">
    <table>
      <thead><tr><th>Tool</th><th>Tier</th><th>Country</th><th>Status</th><th>Score</th><th>Tests</th></tr></thead>
      <tbody>${toolRows}</tbody>
    </table>
  </div>
  <div class="footer">AfroTools Sentinel v1.0 — Built for Africa. By Africa.</div>
</body>
</html>`;
}

// ==================== MAIN ====================

async function main() {
  const args = process.argv.slice(2);
  const flags = {};
  for (let i = 0; i < args.length; i += 2) {
    flags[args[i].replace("--", "")] = args[i + 1];
  }

  if (args.includes("--dry-run")) {
    const registry = loadRegistry(flags);
    console.log(`\n🛡️  AfroTools Sentinel — Dry Run\n`);
    console.log(`Would test ${registry.tools.length} tools:\n`);
    for (const tool of registry.tools) {
      console.log(
        `  [Tier ${tool.tier}] ${tool.name} — ${tool.slug} (${tool.features.join(", ")})`
      );
    }
    return;
  }

  console.log(`\n🛡️  AfroTools Sentinel — Starting QA Run\n`);
  console.log(`Base URL: ${CONFIG.baseUrl}`);

  const registry = loadRegistry(flags);
  console.log(`Testing ${registry.tools.length} tools...\n`);

  const startTime = Date.now();

  const browser = await puppeteer.launch({
    headless: "new",
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
    ],
  });

  const results = [];

  // Process tools in batches
  for (let i = 0; i < registry.tools.length; i += CONFIG.concurrency) {
    const batch = registry.tools.slice(i, i + CONFIG.concurrency);
    const batchResults = await Promise.all(
      batch.map((tool) => testTool(browser, tool))
    );
    results.push(...batchResults);

    // Progress
    const done = Math.min(i + CONFIG.concurrency, registry.tools.length);
    const pct = Math.round((done / registry.tools.length) * 100);
    console.log(
      `  [${pct}%] ${done}/${registry.tools.length} tools tested`
    );
  }

  await browser.close();

  const duration = Date.now() - startTime;

  const report = {
    version: "1.0.0",
    timestamp: new Date().toISOString(),
    baseUrl: CONFIG.baseUrl,
    duration,
    toolCount: results.length,
    results,
  };

  // Write reports
  if (!fs.existsSync(CONFIG.reportDir)) {
    fs.mkdirSync(CONFIG.reportDir, { recursive: true });
  }

  const jsonPath = path.join(CONFIG.reportDir, "sentinel-report.json");
  const htmlPath = path.join(CONFIG.reportDir, "sentinel-report.html");

  fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2));
  fs.writeFileSync(htmlPath, generateHTMLReport(report));

  // Summary
  const totalPass = results.reduce((s, r) => s + r.summary.pass, 0);
  const totalFail = results.reduce((s, r) => s + r.summary.fail, 0);
  const totalWarn = results.reduce((s, r) => s + r.summary.warn, 0);
  const totalTests = totalPass + totalFail + totalWarn;

  console.log(`\n${"=".repeat(60)}`);
  console.log(`🛡️  SENTINEL REPORT SUMMARY`);
  console.log(`${"=".repeat(60)}`);
  console.log(`  Tools tested: ${results.length}`);
  console.log(`  Total tests:  ${totalTests}`);
  console.log(`  ✅ Passed:    ${totalPass}`);
  console.log(`  ❌ Failed:    ${totalFail}`);
  console.log(`  ⚠️  Warnings:  ${totalWarn}`);
  console.log(`  Duration:     ${(duration / 1000).toFixed(1)}s`);
  console.log(`\n  Reports saved to:`);
  console.log(`    ${jsonPath}`);
  console.log(`    ${htmlPath}`);
  console.log(`${"=".repeat(60)}\n`);

  // Exit with failure code if any FAIL
  if (totalFail > 0) {
    console.log(`⛔ ${totalFail} test(s) FAILED — see report for details`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Sentinel crashed:", err);
  process.exit(1);
});
