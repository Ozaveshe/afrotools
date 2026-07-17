/**
 * AfroTools — Salary Benchmarks Aggregation
 * Scheduled function that aggregates anonymized PAYE calculation data
 * into the salary_benchmarks table.
 *
 * Trigger: manually or via cron (e.g. daily)
 * Reads from: calculation_history (canonical AfroTools Supabase)
 * Writes to:  salary_benchmarks   (canonical AfroTools Supabase)
 */

const SUPABASE_DATA_URL = 'https://zpclagtgczsygrgztlts.supabase.co';

// Country → currency mapping for PAYE tools
const COUNTRY_CURRENCY = {
  NG: 'NGN', KE: 'KES', ZA: 'ZAR', GH: 'GHS', EG: 'EGP',
  TZ: 'TZS', UG: 'UGX', RW: 'RWF', ET: 'ETB', CM: 'XAF',
  SN: 'XOF', CI: 'XOF', MA: 'MAD', TN: 'TND', DZ: 'DZD',
  MZ: 'MZN', ZM: 'ZMW', MW: 'MWK', BW: 'BWP', NA: 'NAD',
  MU: 'MUR', AO: 'AOA', CD: 'CDF', MG: 'MGA', BJ: 'XOF',
  BF: 'XOF', TD: 'XAF', CG: 'XAF', GA: 'XAF', GN: 'GNF',
  ML: 'XOF', NE: 'XOF', TG: 'XOF', GM: 'GMD', SL: 'SLE',
  LR: 'LRD', ER: 'ERN', SO: 'SOS', DJ: 'DJF', BI: 'BIF',
  SD: 'SDG', SS: 'SSP', LY: 'LYD', LS: 'LSL', SZ: 'SZL',
  SC: 'SCR', CV: 'CVE', ST: 'STN', MR: 'MRU', KM: 'KMF',
};

/**
 * Calculate percentiles from a sorted numeric array
 */
function percentiles(sorted) {
  const n = sorted.length;
  if (n === 0) return { p25: 0, median: 0, p75: 0 };
  return {
    p25: sorted[Math.floor(n * 0.25)],
    median: sorted[Math.floor(n * 0.5)],
    p75: sorted[Math.floor(n * 0.75)],
  };
}

/**
 * Supabase REST helper (service_role bypasses RLS)
 */
async function supabaseRest(path, { method = 'GET', body, headers = {} } = {}) {
  const key = process.env.SUPABASE_DATA_SERVICE_ROLE_KEY;
  if (!key) throw new Error('Missing SUPABASE_DATA_SERVICE_ROLE_KEY env var');

  const res = await fetch(`${SUPABASE_DATA_URL}/rest/v1/${path}`, {
    method,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      Prefer: undefined,
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Supabase ${method} ${path}: ${res.status} — ${text}`);
  }

  if (method === 'GET') return res.json();
  return null;
}

exports.handler = async function () {
  console.log('[salary-benchmarks] Starting aggregation...');

  try {
    // 1. Fetch all PAYE calculation history rows
    //    tool_slug LIKE '%-paye' catches ng-paye, ke-paye, za-paye, etc.
    //    We select only the fields we need (country_code + outputs)
    //    Paginate in batches of 1000
    let allRows = [];
    let offset = 0;
    const limit = 1000;

    while (true) {
      const rows = await supabaseRest(
        `calculation_history?tool_slug=like.*-paye&select=country_code,outputs&offset=${offset}&limit=${limit}&order=id.asc`
      );
      if (!rows || rows.length === 0) break;
      allRows = allRows.concat(rows);
      if (rows.length < limit) break;
      offset += limit;
    }

    console.log(`[salary-benchmarks] Fetched ${allRows.length} PAYE calculations`);

    if (allRows.length === 0) {
      return { statusCode: 200, body: 'No PAYE calculations found. Nothing to aggregate.' };
    }

    // 2. Group by country_code
    const grouped = {};
    for (const row of allRows) {
      const cc = row.country_code;
      if (!cc) continue;

      const outputs = typeof row.outputs === 'string' ? JSON.parse(row.outputs) : row.outputs;
      if (!outputs) continue;

      // Extract gross — may be stored as outputs.gross or outputs.grossSalary
      const gross = parseFloat(outputs.gross || outputs.grossSalary || outputs.grossMonthly * 12 || 0);
      if (!gross || gross <= 0) continue;

      // Net — prefer monthly, normalize to monthly
      let netMonthly = parseFloat(outputs.netMonthly || 0);
      if (!netMonthly && outputs.netAnnual) netMonthly = parseFloat(outputs.netAnnual) / 12;
      if (!netMonthly || netMonthly <= 0) continue;

      const effectiveRate = parseFloat(outputs.effectiveRate || 0);

      if (!grouped[cc]) grouped[cc] = [];
      grouped[cc].push({
        grossMonthly: gross / 12,
        netMonthly,
        effectiveRate,
      });
    }

    // 3. Aggregate per country
    const upserts = [];

    for (const [cc, entries] of Object.entries(grouped)) {
      const sampleSize = entries.length;

      // Sort arrays for percentile calculation
      const grossValues = entries.map(e => e.grossMonthly).sort((a, b) => a - b);
      const netValues = entries.map(e => e.netMonthly).sort((a, b) => a - b);
      const avgRate = entries.reduce((sum, e) => sum + e.effectiveRate, 0) / sampleSize;

      const grossP = percentiles(grossValues);
      const netP = percentiles(netValues);

      upserts.push({
        country_code: cc,
        currency: COUNTRY_CURRENCY[cc] || 'USD',
        role_category: null,
        experience_level: null,
        sample_size: sampleSize,
        median_gross: Math.round(grossP.median * 100) / 100,
        p25_gross: Math.round(grossP.p25 * 100) / 100,
        p75_gross: Math.round(grossP.p75 * 100) / 100,
        median_net: Math.round(netP.median * 100) / 100,
        p25_net: Math.round(netP.p25 * 100) / 100,
        p75_net: Math.round(netP.p75 * 100) / 100,
        avg_effective_tax_rate: Math.round(avgRate * 100) / 100,
        period: 'monthly',
        updated_at: new Date().toISOString(),
      });
    }

    console.log(`[salary-benchmarks] Aggregated ${upserts.length} countries`);

    // 4. Write aggregated benchmarks into salary_benchmarks.
    //    Standard UNIQUE constraints treat NULLs as distinct, so PostgREST
    //    ON CONFLICT won't merge rows with NULL role_category/experience_level.
    //    Use DELETE + INSERT per country instead.
    for (const row of upserts) {
      // Delete existing overall benchmark for this country
      await supabaseRest(
        `salary_benchmarks?country_code=eq.${row.country_code}&role_category=is.null&experience_level=is.null&period=eq.${row.period}`,
        { method: 'DELETE' }
      );
      // Insert fresh aggregated row
      await supabaseRest('salary_benchmarks', { method: 'POST', body: row });
    }

    const summary = upserts.map(u => `${u.country_code}: ${u.sample_size} samples`).join(', ');
    console.log(`[salary-benchmarks] Done. ${summary}`);

    return {
      statusCode: 200,
      body: JSON.stringify({ aggregated: upserts.length, details: summary }),
    };
  } catch (err) {
    console.error('[salary-benchmarks] Error:', err.message);
    return { statusCode: 500, body: `Aggregation error: ${err.message}` };
  }
};
