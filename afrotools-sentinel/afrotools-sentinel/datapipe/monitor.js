#!/usr/bin/env node
/**
 * AfroTools DataPipe — Passive Data Monitor
 * ==========================================
 * Monitors official government and institutional sources for data changes.
 * Runs daily via GitHub Actions. Creates Issues when changes are detected.
 *
 * Usage:
 *   node monitor.js                  # Check all sources
 *   node monitor.js --source ng-vat  # Check specific source
 *   node monitor.js --dry-run        # Show what would be checked
 */

const fs = require("fs");
const path = require("path");
const https = require("https");
const http = require("http");

// ==================== CONFIGURATION ====================

const SOURCES_FILE = path.join(__dirname, "sources.json");
const VALUES_FILE = path.join(__dirname, "current-values.json");
const CHANGES_LOG = path.join(__dirname, "changes.log");

// ==================== SOURCE DEFINITIONS ====================

const DEFAULT_SOURCES = [
  {
    id: "ng-vat-rate",
    name: "Nigeria VAT Standard Rate",
    country: "NG",
    authority: "FIRS",
    url: "https://firs.gov.ng",
    checkPath: "/tax-types/value-added-tax",
    extractionType: "keyword-search",
    keywords: ["7.5%", "VAT rate"],
    currentValue: "7.5",
    valueType: "percentage",
    checkFrequency: "daily",
    secondarySources: [
      "https://pwcnigeria.typepad.com/tax_matters_nigeria/",
      "https://www.deloitte.com/ng/en/services/tax.html"
    ],
    lastChecked: null,
    confidence: 0.8
  },
  {
    id: "gh-vat-rate",
    name: "Ghana VAT Standard Rate",
    country: "GH",
    authority: "GRA",
    url: "https://gra.gov.gh",
    checkPath: "/domestic-tax/tax-types/value-added-tax/",
    extractionType: "keyword-search",
    keywords: ["15%", "21.9%", "VAT rate", "standard rate"],
    currentValue: "21.9",
    valueType: "percentage",
    checkFrequency: "daily",
    secondarySources: [],
    lastChecked: null,
    confidence: 0.7
  },
  {
    id: "ke-vat-rate",
    name: "Kenya VAT Standard Rate",
    country: "KE",
    authority: "KRA",
    url: "https://www.kra.go.ke",
    checkPath: "/domestic-taxes/value-added-tax/",
    extractionType: "keyword-search",
    keywords: ["16%", "VAT rate"],
    currentValue: "16",
    valueType: "percentage",
    checkFrequency: "daily",
    secondarySources: [],
    lastChecked: null,
    confidence: 0.8
  },
  {
    id: "za-vat-rate",
    name: "South Africa VAT Standard Rate",
    country: "ZA",
    authority: "SARS",
    url: "https://www.sars.gov.za",
    checkPath: "/types-of-tax/value-added-tax/",
    extractionType: "keyword-search",
    keywords: ["15%", "VAT rate"],
    currentValue: "15",
    valueType: "percentage",
    checkFrequency: "daily",
    secondarySources: [],
    lastChecked: null,
    confidence: 0.9
  },
  {
    id: "ng-paye-bands",
    name: "Nigeria PAYE Tax Bands",
    country: "NG",
    authority: "FIRS",
    url: "https://firs.gov.ng",
    checkPath: "/tax-types/personal-income-tax",
    extractionType: "keyword-search",
    keywords: ["800,000", "NTA", "personal income", "tax band", "7%", "11%", "15%", "19%", "21%", "24%"],
    currentValue: "NTA2025",
    valueType: "regime",
    checkFrequency: "weekly",
    secondarySources: [
      "https://pwcnigeria.typepad.com/files/ng-tax-card.pdf"
    ],
    lastChecked: null,
    confidence: 0.7
  },
  {
    id: "exchange-rate-ngn-usd",
    name: "NGN/USD Exchange Rate (CBN)",
    country: "NG",
    authority: "CBN",
    url: "https://www.cbn.gov.ng",
    checkPath: "/rates/exchange-rate",
    extractionType: "api",
    apiEndpoint: "https://open.er-api.com/v6/latest/USD",
    extractField: "rates.NGN",
    currentValue: null,
    valueType: "exchange-rate",
    checkFrequency: "hourly",
    tolerance: 0.02,
    secondarySources: [],
    lastChecked: null,
    confidence: 0.9
  }
];

// ==================== FETCH UTILITY ====================

function fetchUrl(url, timeout = 15000) {
  return new Promise((resolve, reject) => {
    const proto = url.startsWith("https") ? https : http;
    const req = proto.get(
      url,
      {
        headers: {
          "User-Agent": "AfroTools-DataPipe/1.0 (contact@afrotools.com)",
          Accept: "text/html,application/json",
        },
        timeout,
      },
      (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          return fetchUrl(res.headers.location, timeout).then(resolve).catch(reject);
        }
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () =>
          resolve({ status: res.statusCode, body: data, headers: res.headers })
        );
      }
    );
    req.on("error", reject);
    req.on("timeout", () => {
      req.destroy();
      reject(new Error(`Timeout fetching ${url}`));
    });
  });
}

// ==================== EXTRACTION METHODS ====================

async function checkKeywordSearch(source) {
  const url = source.url + (source.checkPath || "");
  try {
    const { status, body } = await fetchUrl(url);
    if (status >= 400) {
      return {
        status: "error",
        message: `HTTP ${status} from ${url}`,
        changed: false,
      };
    }

    const foundKeywords = source.keywords.filter((kw) =>
      body.toLowerCase().includes(kw.toLowerCase())
    );
    const keywordRatio = foundKeywords.length / source.keywords.length;

    return {
      status: "ok",
      foundKeywords,
      keywordRatio,
      changed: keywordRatio < 0.5,
      message:
        keywordRatio >= 0.5
          ? `${foundKeywords.length}/${source.keywords.length} keywords found — data likely unchanged`
          : `Only ${foundKeywords.length}/${source.keywords.length} keywords found — POSSIBLE DATA CHANGE`,
      confidence: source.confidence * keywordRatio,
    };
  } catch (err) {
    return {
      status: "error",
      message: `Fetch failed: ${err.message}`,
      changed: false,
    };
  }
}

async function checkAPI(source) {
  try {
    const { status, body } = await fetchUrl(source.apiEndpoint);
    if (status >= 400) {
      return {
        status: "error",
        message: `API returned HTTP ${status}`,
        changed: false,
      };
    }

    const data = JSON.parse(body);

    // Navigate to the extraction field (e.g., "rates.NGN")
    const fields = source.extractField.split(".");
    let value = data;
    for (const field of fields) {
      value = value?.[field];
    }

    if (value === undefined || value === null) {
      return {
        status: "error",
        message: `Field ${source.extractField} not found in API response`,
        changed: false,
      };
    }

    const newValue = parseFloat(value);
    const oldValue = source.currentValue
      ? parseFloat(source.currentValue)
      : null;

    if (oldValue !== null && !isNaN(newValue) && !isNaN(oldValue)) {
      const diff = Math.abs(newValue - oldValue) / oldValue;
      const tolerance = source.tolerance || 0.05;

      return {
        status: "ok",
        newValue,
        oldValue,
        diff: (diff * 100).toFixed(2) + "%",
        changed: diff > tolerance,
        message:
          diff > tolerance
            ? `VALUE CHANGED: ${oldValue} → ${newValue} (${(diff * 100).toFixed(2)}% change, tolerance: ${tolerance * 100}%)`
            : `Value stable: ${newValue} (${(diff * 100).toFixed(2)}% change, within ${tolerance * 100}% tolerance)`,
        confidence: source.confidence,
      };
    }

    return {
      status: "ok",
      newValue,
      oldValue,
      changed: oldValue === null,
      message: oldValue === null
        ? `First reading: ${newValue}`
        : `Value: ${newValue}`,
      confidence: source.confidence,
    };
  } catch (err) {
    return {
      status: "error",
      message: `API check failed: ${err.message}`,
      changed: false,
    };
  }
}

// ==================== MAIN MONITOR LOOP ====================

async function checkSource(source) {
  const result = {
    id: source.id,
    name: source.name,
    country: source.country,
    authority: source.authority,
    timestamp: new Date().toISOString(),
  };

  switch (source.extractionType) {
    case "keyword-search":
      Object.assign(result, await checkKeywordSearch(source));
      break;
    case "api":
      Object.assign(result, await checkAPI(source));
      break;
    default:
      result.status = "error";
      result.message = `Unknown extraction type: ${source.extractionType}`;
      result.changed = false;
  }

  return result;
}

async function main() {
  const args = process.argv.slice(2);
  const isDryRun = args.includes("--dry-run");
  const sourceFilter = args.find((a, i) => args[i - 1] === "--source");

  // Load or initialize sources
  let sources;
  if (fs.existsSync(SOURCES_FILE)) {
    sources = JSON.parse(fs.readFileSync(SOURCES_FILE, "utf-8"));
  } else {
    sources = DEFAULT_SOURCES;
    fs.writeFileSync(SOURCES_FILE, JSON.stringify(sources, null, 2));
    console.log(`📝 Created default sources file: ${SOURCES_FILE}`);
  }

  if (sourceFilter) {
    sources = sources.filter((s) => s.id.includes(sourceFilter));
  }

  console.log(`\n📡 AfroTools DataPipe — Passive Monitor`);
  console.log(`${"=".repeat(50)}`);
  console.log(`Checking ${sources.length} source(s)...\n`);

  if (isDryRun) {
    for (const s of sources) {
      console.log(`  [${s.checkFrequency}] ${s.name} — ${s.url}`);
    }
    return;
  }

  const results = [];
  const changes = [];

  for (const source of sources) {
    process.stdout.write(`  Checking ${source.name}... `);

    // Rate limiting: 1 second between requests
    await new Promise((r) => setTimeout(r, 1000));

    const result = await checkSource(source);
    results.push(result);

    if (result.status === "error") {
      console.log(`⚠️  ERROR: ${result.message}`);
    } else if (result.changed) {
      console.log(`🔴 CHANGE DETECTED: ${result.message}`);
      changes.push(result);
    } else {
      console.log(`✅ ${result.message}`);
    }

    // Update lastChecked
    source.lastChecked = result.timestamp;
  }

  // Save updated sources
  fs.writeFileSync(SOURCES_FILE, JSON.stringify(sources, null, 2));

  // Log changes
  if (changes.length > 0) {
    const logEntry = changes
      .map(
        (c) =>
          `[${c.timestamp}] ${c.id} (${c.country}): ${c.message}`
      )
      .join("\n");
    fs.appendFileSync(CHANGES_LOG, logEntry + "\n\n");

    console.log(`\n${"=".repeat(50)}`);
    console.log(`🔴 ${changes.length} CHANGE(S) DETECTED`);
    console.log(`${"=".repeat(50)}`);

    // Generate GitHub Issue body (for CI integration)
    const issueBody = generateIssueBody(changes);
    fs.writeFileSync(
      path.join(__dirname, "pending-issue.md"),
      issueBody
    );
    console.log(`\n📋 Issue body saved to datapipe/pending-issue.md`);
    console.log(`   Create a GitHub Issue with this content for review.\n`);

    // In CI, this would use the GitHub API to create an issue
    if (process.env.GITHUB_TOKEN) {
      console.log(
        `   (GitHub token detected — issue creation would happen here in production)`
      );
    }
  } else {
    console.log(`\n✅ All ${sources.length} sources stable. No changes detected.\n`);
  }

  // Summary report
  const report = {
    timestamp: new Date().toISOString(),
    sourcesChecked: sources.length,
    changesDetected: changes.length,
    errors: results.filter((r) => r.status === "error").length,
    results,
  };
  fs.writeFileSync(
    path.join(__dirname, "monitor-report.json"),
    JSON.stringify(report, null, 2)
  );
}

function generateIssueBody(changes) {
  const lines = [
    "## 🔴 Data Change Detected — Review Required",
    "",
    `**Detected at:** ${new Date().toISOString()}`,
    `**Changes:** ${changes.length}`,
    "",
    "---",
    "",
  ];

  for (const change of changes) {
    lines.push(`### ${change.name} (${change.country})`);
    lines.push("");
    lines.push(`- **Source ID:** ${change.id}`);
    lines.push(`- **Authority:** ${change.authority}`);
    lines.push(`- **Detection:** ${change.message}`);
    if (change.oldValue !== undefined) {
      lines.push(`- **Old value:** ${change.oldValue}`);
    }
    if (change.newValue !== undefined) {
      lines.push(`- **New value:** ${change.newValue}`);
    }
    lines.push(`- **Confidence:** ${((change.confidence || 0) * 100).toFixed(0)}%`);
    lines.push("");
    lines.push("**Action required:**");
    lines.push("1. Verify the change against the official source");
    lines.push("2. Cross-check with a secondary source");
    lines.push("3. Update the fixture file and tool calculation logic");
    lines.push("4. Run Sentinel on the affected tool(s)");
    lines.push("5. Close this issue once deployed");
    lines.push("");
    lines.push("---");
    lines.push("");
  }

  lines.push(
    "> Generated by AfroTools DataPipe v1.0. Do not edit — create a new issue for discussion."
  );

  return lines.join("\n");
}

main().catch((err) => {
  console.error("DataPipe monitor crashed:", err);
  process.exit(1);
});
