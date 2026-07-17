const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const estimatePath = path.join(root, "data", "cars", "import-duty-vehicle-estimates.csv");
const evidencePath = path.join(root, "data", "cars", "import-duty-online-price-evidence.json");
const userAgent = "Mozilla/5.0 AfroToolsPriceResearch/1.0 (+https://afrotools.com/contact)";
const requestTimeoutMs = Number(process.env.PRICE_MATCH_TIMEOUT_MS || 14000);
const concurrency = Number(process.env.PRICE_MATCH_CONCURRENCY || 4);
const limit = Number(process.env.PRICE_MATCH_LIMIT || 0);

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];
    if (inQuotes) {
      if (char === '"' && next === '"') {
        cell += '"';
        index += 1;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        cell += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      row.push(cell);
      cell = "";
    } else if (char === "\n") {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else if (char !== "\r") {
      cell += char;
    }
  }
  if (cell || row.length) {
    row.push(cell);
    rows.push(row);
  }
  const headers = rows.shift();
  return rows
    .filter((line) => line.some((value) => String(value || "").trim()))
    .map((line) => Object.fromEntries(headers.map((header, index) => [header, line[index] || ""])));
}

function stringifyCsv(headers, records) {
  return [headers]
    .concat(records.map((record) => headers.map((header) => record[header] || "")))
    .map((row) =>
      row
        .map((value) => {
          const text = String(value == null ? "" : value);
          return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
        })
        .join(",")
    )
    .join("\n");
}

function toNumber(value) {
  const number = Number(String(value || "").replace(/[^0-9.]/g, ""));
  return Number.isFinite(number) ? number : 0;
}

function median(values) {
  const sorted = values.filter((value) => Number.isFinite(value) && value > 0).sort((a, b) => a - b);
  if (!sorted.length) return 0;
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

function rounded(value) {
  const step = value >= 20000 ? 500 : 100;
  return Math.max(900, Math.round(value / step) * step);
}

function normalizeSlug(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/\+/g, "plus")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function modelSlugForUrl(row) {
  return normalizeSlug(String(row.model || "").split("/")[0].trim() || row.model_slug);
}

async function fetchText(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), requestTimeoutMs);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "user-agent": userAgent,
        accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
      }
    });
    const text = await response.text();
    return { ok: response.ok, status: response.status, text, url };
  } catch (error) {
    return { ok: false, status: 0, text: "", url, error: error.message };
  } finally {
    clearTimeout(timeout);
  }
}

function extractUsdPricesFromDubicars(html) {
  const prices = new Set();
  let match;
  const exportPricePattern = /(?:price_export|item_export_price|price&quot;)\s*(?::|&quot;:)\s*([0-9]{3,7})/gi;
  while ((match = exportPricePattern.exec(html))) {
    const value = toNumber(match[1]);
    if (value >= 900 && value <= 250000) prices.add(value);
  }
  const jsonLdPattern = /"price"\s*:\s*"?([0-9]{3,7})"?\s*,\s*"priceCurrency"\s*:\s*"USD"/gi;
  while ((match = jsonLdPattern.exec(html))) {
    const value = toNumber(match[1]);
    if (value >= 900 && value <= 250000) prices.add(value);
  }
  return Array.from(prices);
}

function extractLocalPricesFromAutochek(html) {
  const prices = new Set();
  let match;
  const pricePattern = /class=["'][^"']*price[^"']*["'][^>]*>\s*[^0-9<]*([0-9][0-9,.\s]{4,})/gi;
  while ((match = pricePattern.exec(html))) {
    const value = toNumber(match[1]);
    if (value >= 100000 && value <= 1000000000) prices.add(value);
  }
  return Array.from(prices);
}

async function collectForRow(row) {
  const makeSlug = normalizeSlug(row.make_slug || row.make);
  const modelSlug = modelSlugForUrl(row);
  const year = row.year;
  const evidence = [];

  const dubicarsUrl = `https://www.dubicars.com/uae/used/${makeSlug}/${modelSlug}/${year}`;
  const dubicars = await fetchText(dubicarsUrl);
  if (dubicars.ok) {
    const prices = extractUsdPricesFromDubicars(dubicars.text);
    if (prices.length) {
      evidence.push({
        sourceType: "market_estimate",
        sourceName: "DubiCars UAE used listings",
        sourceUrl: dubicarsUrl,
        market: "UAE",
        currency: "USD",
        prices,
        sampleCount: prices.length,
        medianPrice: median(prices),
        reliability: prices.length >= 2 ? "source_backed_sample" : "single_market_sample"
      });
    }
  }

  const autochekUrl = `https://autochek.africa/ng/cars-for-sale/${makeSlug}/${modelSlug}/${year}`;
  const autochek = await fetchText(autochekUrl);
  if (autochek.ok) {
    const prices = extractLocalPricesFromAutochek(autochek.text);
    if (prices.length) {
      evidence.push({
        sourceType: "market_estimate",
        sourceName: "Autochek Nigeria listings",
        sourceUrl: autochekUrl,
        market: "Nigeria",
        currency: "NGN",
        prices,
        sampleCount: prices.length,
        medianPrice: median(prices),
        reliability: prices.length >= 2 ? "source_backed_sample" : "single_market_sample"
      });
    }
  }

  return {
    vehicleId: row.vehicle_id,
    make: row.make,
    model: row.model,
    year: row.year,
    collectedAt: new Date().toISOString(),
    evidence
  };
}

async function mapLimit(items, worker) {
  const results = new Array(items.length);
  let cursor = 0;
  async function runWorker() {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      results[index] = await worker(items[index], index);
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, runWorker));
  return results;
}

function applyEvidence(records, evidenceRows) {
  const byVehicle = new Map(evidenceRows.map((entry) => [entry.vehicleId, entry]));
  return records.map((record) => {
    const entry = byVehicle.get(record.vehicle_id);
    if (!entry || !entry.evidence.length) return record;
    const usdEvidence = entry.evidence.find((item) => item.currency === "USD" && item.sampleCount >= 1);
    const localEvidence = entry.evidence.find((item) => item.currency !== "USD");
    const evidenceForPrice = usdEvidence;
    const next = { ...record };
    if (evidenceForPrice) {
      next.price_min_usd = String(rounded(Math.min(...evidenceForPrice.prices)));
      next.price_median_usd = String(rounded(evidenceForPrice.medianPrice));
      next.price_max_usd = String(Math.max(rounded(Math.max(...evidenceForPrice.prices)), Number(next.price_median_usd)));
      next.confidence = evidenceForPrice.sampleCount >= 2 ? "online_market_sample" : "single_online_market_sample";
      next.price_source_type = "market_sample";
      next.price_source_name = evidenceForPrice.sourceName;
      next.price_source_url = evidenceForPrice.sourceUrl;
      next.price_source_count = String(evidenceForPrice.sampleCount);
      next.price_notes = "Planning estimate refreshed from online marketplace evidence. Not a customs assessed value.";
    }
    if (localEvidence) {
      next.tags = Array.from(new Set(String(next.tags || "").split("|").concat(["local-market-observed"]).filter(Boolean))).join("|");
      next.price_notes = `${next.price_notes || "Planning estimate."} Local-market corroboration: ${localEvidence.sourceName} ${localEvidence.sampleCount} listing(s) in ${localEvidence.currency}.`;
    }
    next.last_updated = new Date().toISOString().slice(0, 10);
    return next;
  });
}

async function main() {
  const raw = fs.readFileSync(estimatePath, "utf8");
  const headers = raw.slice(0, raw.indexOf("\n")).replace(/\r/g, "").split(",");
  const records = parseCsv(raw);
  const targetRows = limit > 0 ? records.slice(0, limit) : records;
  console.log(`Refreshing online vehicle price evidence for ${targetRows.length} of ${records.length} estimate rows...`);
  const evidenceRows = await mapLimit(targetRows, (row, index) =>
    collectForRow(row).then((result) => {
      if ((index + 1) % 25 === 0 || index === targetRows.length - 1) {
        console.log(`  checked ${index + 1}/${targetRows.length}`);
      }
      return result;
    })
  );
  const existing = fs.existsSync(evidencePath) ? JSON.parse(fs.readFileSync(evidencePath, "utf8")) : { entries: [] };
  const byId = new Map((existing.entries || []).map((entry) => [entry.vehicleId, entry]));
  evidenceRows.forEach((entry) => byId.set(entry.vehicleId, entry));
  const entries = Array.from(byId.values()).sort((a, b) => a.vehicleId.localeCompare(b.vehicleId));
  fs.writeFileSync(
    evidencePath,
    `${JSON.stringify({
      schemaVersion: 1,
      generatedAt: new Date().toISOString(),
      policy: {
        officialClaim: false,
        note: "Marketplace observations are planning estimates only. They are not official customs values, dealer guarantees, or final payable costs."
      },
      sourcePriority: ["manufacturer/dealer MSRP for new vehicles", "export marketplace USD listing samples", "local African marketplace listing samples", "forums and Reddit as weak corroboration only"],
      entries
    }, null, 2)}\n`,
    "utf8"
  );

  const updated = applyEvidence(records, evidenceRows);
  fs.writeFileSync(estimatePath, `${stringifyCsv(headers, updated)}\n`, "utf8");
  const matched = evidenceRows.filter((entry) => entry.evidence.length).length;
  const usdMatched = evidenceRows.filter((entry) => entry.evidence.some((item) => item.currency === "USD")).length;
  console.log(`Online evidence refreshed: ${matched}/${targetRows.length} rows matched, ${usdMatched} with USD source-market samples.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
