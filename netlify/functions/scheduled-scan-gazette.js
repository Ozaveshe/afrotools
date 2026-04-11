/**
 * AfroTools — Government Gazette Scanner
 * Runs daily at 5am via Netlify Scheduled Functions.
 *
 * Scans for regulatory changes that affect PAYE calculators, minimum wage,
 * VAT rates, pension contributions, and tax brackets across Africa.
 *
 * Detection methods:
 *  1. Official government RSS feeds / press release pages
 *  2. World Bank / IMF tax policy indicators
 *  3. News API search for "minimum wage" + "tax reform" + country
 *  4. ILO wage database changes
 *
 * When a change is detected:
 *  - Logs to Supabase gazette_changes table
 *  - Adds to review_queue for manual verification
 *  - Sends high-priority email alert
 *
 * This is CRITICAL infrastructure — undetected PAYE changes break 54 country calculators.
 */

const { fetchWithRetry } = require('./_shared/scraper-base');
const { getData, setData, updateMeta } = require('./_shared/data-store');

var SUPABASE_URL = 'https://zpclagtgczsygrgztlts.supabase.co';
var SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ||
                   process.env.SUPABASE_DATA_SERVICE_ROLE_KEY ||
                   process.env.SUPABASE_SERVICE_KEY;
var RESEND_KEY = process.env.RESEND_API_KEY;

// Country-specific tax authority websites and search patterns
var TAX_AUTHORITIES = {
  NG: { name: 'Nigeria', authority: 'FIRS', keywords: ['minimum wage', 'PAYE', 'personal income tax', 'NHF', 'pension contribution'], currency: 'NGN' },
  KE: { name: 'Kenya', authority: 'KRA', keywords: ['PAYE', 'income tax', 'NHIF', 'NSSF', 'housing levy', 'minimum wage'], currency: 'KES' },
  ZA: { name: 'South Africa', authority: 'SARS', keywords: ['PAYE', 'income tax', 'UIF', 'national minimum wage', 'tax bracket', 'SDL'], currency: 'ZAR' },
  GH: { name: 'Ghana', authority: 'GRA', keywords: ['PAYE', 'income tax', 'SSNIT', 'minimum wage', 'tax bracket'], currency: 'GHS' },
  EG: { name: 'Egypt', authority: 'ETA', keywords: ['income tax', 'social insurance', 'minimum wage'], currency: 'EGP' },
  TZ: { name: 'Tanzania', authority: 'TRA', keywords: ['PAYE', 'income tax', 'NSSF', 'minimum wage'], currency: 'TZS' },
  UG: { name: 'Uganda', authority: 'URA', keywords: ['PAYE', 'income tax', 'NSSF', 'minimum wage'], currency: 'UGX' },
  RW: { name: 'Rwanda', authority: 'RRA', keywords: ['PAYE', 'income tax', 'RSSB', 'minimum wage'], currency: 'RWF' },
  ET: { name: 'Ethiopia', authority: 'ERCA', keywords: ['income tax', 'employment tax', 'pension', 'minimum wage'], currency: 'ETB' },
  CI: { name: "Côte d'Ivoire", authority: 'DGI', keywords: ['impôt sur le revenu', 'SMIG', 'CNPS', 'salaire minimum'], currency: 'XOF' },
  SN: { name: 'Senegal', authority: 'DGID', keywords: ['impôt sur le revenu', 'SMIG', 'CSS', 'salaire minimum'], currency: 'XOF' },
  CM: { name: 'Cameroon', authority: 'DGI', keywords: ['impôt sur le revenu', 'SMIG', 'CNPS', 'salaire minimum'], currency: 'XAF' },
  MA: { name: 'Morocco', authority: 'DGI', keywords: ['impôt sur le revenu', 'SMIG', 'CNSS', 'AMO', 'salaire minimum'], currency: 'MAD' },
  TN: { name: 'Tunisia', authority: 'DGI', keywords: ['impôt sur le revenu', 'SMIG', 'CNSS', 'salaire minimum'], currency: 'TND' },
  ZM: { name: 'Zambia', authority: 'ZRA', keywords: ['PAYE', 'income tax', 'NAPSA', 'minimum wage'], currency: 'ZMW' },
  ZW: { name: 'Zimbabwe', authority: 'ZIMRA', keywords: ['PAYE', 'income tax', 'NSSA', 'minimum wage'], currency: 'ZWL' },
  BW: { name: 'Botswana', authority: 'BURS', keywords: ['income tax', 'minimum wage', 'tax bracket'], currency: 'BWP' },
  NA: { name: 'Namibia', authority: 'NamRA', keywords: ['PAYE', 'income tax', 'social security', 'minimum wage'], currency: 'NAD' },
  MU: { name: 'Mauritius', authority: 'MRA', keywords: ['income tax', 'CSG', 'NPF', 'minimum wage'], currency: 'MUR' },
  MW: { name: 'Malawi', authority: 'MRA', keywords: ['PAYE', 'income tax', 'minimum wage'], currency: 'MWK' },
};

/**
 * Scan news sources for regulatory change signals.
 * Uses a search approach to detect recent announcements.
 */
async function scanForChanges() {
  var changes = [];
  var now = new Date();
  var thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  // Method 1: Search major news aggregators for tax/wage changes
  var countryCodes = Object.keys(TAX_AUTHORITIES);

  for (var i = 0; i < countryCodes.length; i++) {
    var code = countryCodes[i];
    var config = TAX_AUTHORITIES[code];

    // Search for recent changes using Google News RSS-like approach
    // We use a simple keyword search against known news APIs
    try {
      // Try NewsAPI.org (free tier: 100 req/day)
      var newsKey = process.env.NEWS_API_KEY;
      if (newsKey) {
        var searchTerms = config.name + ' ' + config.keywords.slice(0, 2).join(' OR ');
        var newsUrl = 'https://newsapi.org/v2/everything?q=' + encodeURIComponent(searchTerms) +
          '&from=' + thirtyDaysAgo + '&sortBy=relevancy&pageSize=5&apiKey=' + newsKey;

        var res = await fetchWithRetry(newsUrl, { retries: 1 });
        var json = await res.json();

        if (json.articles && json.articles.length > 0) {
          json.articles.forEach(function(article) {
            var title = (article.title || '').toLowerCase();
            var desc = (article.description || '').toLowerCase();
            var combined = title + ' ' + desc;

            // Detect specific change types
            var changeType = detectChangeType(combined, config.keywords);
            if (changeType) {
              changes.push({
                country_code: code,
                country_name: config.name,
                change_type: changeType,
                description: article.title,
                source_url: article.url,
                source_name: article.source ? article.source.name : 'News',
                confidence: 0.6,
                detected_at: new Date().toISOString(),
              });
            }
          });
        }
      }
    } catch (e) {
      // Silently continue — individual country failures shouldn't stop the scan
    }

    // Rate limit: don't hammer the news API
    if (i < countryCodes.length - 1 && process.env.NEWS_API_KEY) {
      await new Promise(function(r) { setTimeout(r, 500); });
    }
  }

  // Method 2: Check ILO minimum wage database for updates
  try {
    var iloUrl = 'https://www.ilo.org/ilostat/api/v1/data/EAR_XEES_SEX_ECO_CUR_NB_A?format=json&limit=100';
    var iloRes = await fetchWithRetry(iloUrl, { retries: 1 });
    var iloJson = await iloRes.json();

    if (iloJson && iloJson.data) {
      var lastScan = await getData('gazette-last-ilo');
      var lastIloIds = (lastScan && lastScan.ids) || [];

      var newEntries = iloJson.data.filter(function(d) {
        return !lastIloIds.includes(d.ref_area + '_' + d.time_period);
      });

      newEntries.forEach(function(d) {
        if (TAX_AUTHORITIES[d.ref_area]) {
          changes.push({
            country_code: d.ref_area,
            country_name: TAX_AUTHORITIES[d.ref_area].name,
            change_type: 'minimum_wage',
            description: 'ILO wage data updated for ' + d.ref_area + ' (' + d.time_period + ')',
            old_value: null,
            new_value: d.obs_value ? String(d.obs_value) : null,
            source_url: 'https://ilostat.ilo.org',
            source_name: 'ILO STAT',
            confidence: 0.8,
            detected_at: new Date().toISOString(),
          });
        }
      });

      // Save current IDs for next comparison
      await setData('gazette-last-ilo', {
        ids: iloJson.data.map(function(d) { return d.ref_area + '_' + d.time_period; }),
        checked_at: new Date().toISOString(),
      });
    }
  } catch (e) {
    console.log('[gazette] ILO check failed: ' + e.message);
  }

  // Method 3: World Bank tax revenue indicators (slow-moving but authoritative)
  try {
    var wbUrl = 'https://api.worldbank.org/v2/country/ALL/indicator/GC.TAX.TOTL.GD.ZS?date=2023:2025&format=json&per_page=500';
    var wbRes = await fetchWithRetry(wbUrl, { retries: 1 });
    var wbJson = await wbRes.json();

    if (wbJson && wbJson[1]) {
      var prevTaxRevenue = await getData('gazette-last-wb-tax');
      var prevMap = (prevTaxRevenue && prevTaxRevenue.data) || {};

      wbJson[1].forEach(function(entry) {
        if (!entry.value || !entry.country || !TAX_AUTHORITIES[entry.country.id]) return;
        var prev = prevMap[entry.country.id];
        if (prev && Math.abs(entry.value - prev) > 2) {
          changes.push({
            country_code: entry.country.id,
            country_name: entry.country.value,
            change_type: 'other',
            description: 'Tax revenue as % of GDP changed significantly: ' + prev.toFixed(1) + '% → ' + entry.value.toFixed(1) + '%',
            old_value: String(prev),
            new_value: String(entry.value),
            source_url: 'https://data.worldbank.org',
            source_name: 'World Bank',
            confidence: 0.7,
            detected_at: new Date().toISOString(),
          });
        }
      });

      changes = changes.filter(function(change) {
        return change.source_name !== 'World Bank';
      });

      // Store latest year + value so we compare like-for-like on the next scan
      var newMap = {};
      wbJson[1].forEach(function(e) {
        if (e.value == null || !e.country || !TAX_AUTHORITIES[e.country.id]) return;
        var current = newMap[e.country.id];
        if (!current || String(e.date) > String(current.year)) {
          newMap[e.country.id] = {
            country_name: e.country.value,
            year: String(e.date),
            value: e.value,
          };
        }
      });
      Object.keys(newMap).forEach(function(countryCode) {
        var latest = newMap[countryCode];
        var prevEntry = prevMap[countryCode];
        var prevValue = typeof prevEntry === 'number'
          ? prevEntry
          : (prevEntry && typeof prevEntry.value === 'number' ? prevEntry.value : null);
        var prevYear = prevEntry && prevEntry.year ? String(prevEntry.year) : null;
        if (prevValue !== null && prevYear !== latest.year && Math.abs(latest.value - prevValue) > 2) {
          console.log(
            '[gazette] World Bank macro context for ' + countryCode + ': tax revenue/GDP ' +
            prevValue.toFixed(1) + '% -> ' + latest.value.toFixed(1) + '% (' + latest.year + '), not creating PAYE alert'
          );
        }
      });
      await setData('gazette-last-wb-tax', { data: newMap, checked_at: new Date().toISOString() });
    }
  } catch (e) {
    console.log('[gazette] WB tax check failed: ' + e.message);
  }

  return changes;
}

/**
 * Detect change type from text content
 */
function detectChangeType(text, keywords) {
  if (/minimum.wage|salaire.minimum|smig/i.test(text)) return 'minimum_wage';
  if (/paye.bracket|tax.bracket|income.tax.*rate|impôt.*revenu.*taux/i.test(text)) return 'paye_bracket';
  if (/vat.*rate|tva.*taux/i.test(text)) return 'vat_rate';
  if (/pension.*rate|pension.*contribution|cnps|nssf|napsa|rssb/i.test(text)) return 'pension_rate';
  if (/nhif|nhis|health.*insurance.*levy|amo/i.test(text)) return 'nhif_rate';
  if (/tax.relief|tax.*exemption|personal.*allowance/i.test(text)) return 'tax_relief';
  // Check if any of the country-specific keywords match
  for (var i = 0; i < keywords.length; i++) {
    if (text.includes(keywords[i].toLowerCase())) return 'other';
  }
  return null;
}

/**
 * Save detected changes to Supabase and trigger alerts
 */
async function saveChanges(changes) {
  if (!changes.length || !SUPABASE_KEY) return;

  // Deduplicate against existing recent changes
  try {
    var existingRes = await fetch(
      SUPABASE_URL + '/rest/v1/gazette_changes?select=country_code,change_type,description&detected_at=gte.' +
        new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      { headers: { 'apikey': SUPABASE_KEY, 'Authorization': 'Bearer ' + SUPABASE_KEY } }
    );
    var existing = existingRes.ok ? await existingRes.json() : [];

    var existingSet = {};
    existing.forEach(function(e) {
      existingSet[e.country_code + ':' + e.change_type + ':' + (e.description || '').slice(0, 50)] = true;
    });

    // Filter out duplicates
    var newChanges = changes.filter(function(c) {
      var key = c.country_code + ':' + c.change_type + ':' + (c.description || '').slice(0, 50);
      return !existingSet[key];
    });

    if (newChanges.length === 0) {
      console.log('[gazette] All detected changes are duplicates — skipping');
      return;
    }

    // Insert new changes
    var insertRes = await fetch(SUPABASE_URL + '/rest/v1/gazette_changes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_KEY,
        'Authorization': 'Bearer ' + SUPABASE_KEY,
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify(newChanges),
    });

    if (insertRes.ok) {
      console.log('[gazette] Saved ' + newChanges.length + ' new change(s)');
    }

    // Also add to review queue
    var reviewItems = newChanges.map(function(c) {
      return {
        category: 'gazette',
        country_code: c.country_code,
        metric: c.change_type,
        reason: 'gazette_detected',
        status: 'pending',
        notes: c.description + ' (source: ' + c.source_name + ')',
      };
    });

    await fetch(SUPABASE_URL + '/rest/v1/review_queue', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_KEY,
        'Authorization': 'Bearer ' + SUPABASE_KEY,
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify(reviewItems),
    });

    // Send email alert for high-confidence changes
    var highConf = newChanges.filter(function(c) { return c.confidence >= 0.7; });
    if (highConf.length > 0 && RESEND_KEY) {
      var body = highConf.map(function(c) {
        return '- ' + c.country_name + ' [' + c.change_type + ']: ' + c.description +
          '\n  Source: ' + c.source_name + (c.source_url ? ' (' + c.source_url + ')' : '') +
          '\n  Confidence: ' + Math.round(c.confidence * 100) + '%';
      }).join('\n\n');

      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + RESEND_KEY,
        },
        body: JSON.stringify({
          from: 'AfroTools Gazette <alerts@afrotools.com>',
          to: ['momohozaveshe@gmail.com'],
          subject: 'GAZETTE ALERT: ' + highConf.length + ' regulatory change(s) detected',
          text: 'AfroTools Government Gazette Scanner\n' +
            new Date().toISOString() + '\n\n' +
            'The following regulatory changes were detected and need review:\n\n' +
            body + '\n\n' +
            'ACTION REQUIRED: Review and update affected tool data.\n' +
            'Review queue: https://afrotools.com/admin/review',
        }),
      });
      console.log('[gazette] Alert email sent for ' + highConf.length + ' change(s)');
    }

    return newChanges;
  } catch (err) {
    console.warn('[gazette] Save failed: ' + err.message);
  }
}

exports.handler = async function(event) {
  console.log('[gazette] Starting government gazette scan...');

  var changes = await scanForChanges();
  console.log('[gazette] Detected ' + changes.length + ' potential change(s)');

  if (changes.length > 0) {
    await saveChanges(changes);
  }

  await updateMeta('gazette', {
    last_fetch: new Date().toISOString(),
    status: 'ok',
    changes_detected: changes.length,
  });

  return {
    statusCode: 200,
    body: JSON.stringify({
      changes_detected: changes.length,
      countries_scanned: Object.keys(TAX_AUTHORITIES).length,
      timestamp: new Date().toISOString(),
    }),
  };
};
