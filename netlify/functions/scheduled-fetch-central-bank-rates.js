/**
 * AfroTools Live Monitoring - Scheduled Central Bank Rates Fetcher
 * Runs every 12 hours via Netlify Scheduled Functions.
 *
 * Upgrade goals:
 *  1. Refresh policy-rate snapshots from official bank pages where we can verify them.
 *  2. Preserve maintained reference data for countries without a reliable machine-readable source yet.
 *  3. Enrich inflation data separately without pretending it refreshed policy rates.
 */

// Static import keeps reviewed source records in the deployed function bundle.
const manualPolicyOverrides = require('../../data/rates/manual-policy-overrides.json');
const { getData, setData, updateMeta } = require('./_shared/data-store');
const { storageDiagnostic } = require('./_shared/storage-diagnostics');

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
const USER_AGENT = 'Mozilla/5.0 AfroTools/1.0 (+https://afrotools.com)';

const COUNTRY_ISO3_MAP = {
  DZ: 'DZA', AO: 'AGO', BJ: 'BEN', BW: 'BWA', BF: 'BFA',
  BI: 'BDI', CV: 'CPV', CM: 'CMR', CF: 'CAF', TD: 'TCD',
  KM: 'COM', CG: 'COG', CD: 'COD', CI: 'CIV', DJ: 'DJI',
  EG: 'EGY', GQ: 'GNQ', ER: 'ERI', SZ: 'SWZ', ET: 'ETH',
  GA: 'GAB', GM: 'GMB', GH: 'GHA', GN: 'GIN', GW: 'GNB',
  KE: 'KEN', LS: 'LSO', LR: 'LBR', LY: 'LBY', MG: 'MDG',
  MW: 'MWI', ML: 'MLI', MR: 'MRT', MU: 'MUS', MA: 'MAR',
  MZ: 'MOZ', NA: 'NAM', NE: 'NER', NG: 'NGA', RW: 'RWA',
  ST: 'STP', SN: 'SEN', SC: 'SYC', SL: 'SLE', SO: 'SOM',
  ZA: 'ZAF', SS: 'SSD', SD: 'SDN', TZ: 'TZA', TG: 'TGO',
  TN: 'TUN', UG: 'UGA', ZM: 'ZMB', ZW: 'ZWE'
};

const MONTH_INDEX = {
  january: 1, february: 2, march: 3, april: 4, may: 5, june: 6,
  july: 7, august: 8, september: 9, october: 10, november: 11, december: 12,
  janvier: 1, fevrier: 2, mars: 3, avril: 4, mai: 5, juin: 6,
  juillet: 7, aout: 8, septembre: 9, octobre: 10, novembre: 11, decembre: 12
};

const BCEAO_CODES = ['BJ', 'BF', 'CI', 'GW', 'ML', 'NE', 'SN', 'TG'];
const BEAC_CODES = ['CM', 'CF', 'TD', 'CG', 'GQ', 'GA'];
const ENGLISH_MONTH_SLUGS = [
  'january', 'february', 'march', 'april', 'may', 'june',
  'july', 'august', 'september', 'october', 'november', 'december'
];

function stripAccents(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function cleanHtmlText(html) {
  return stripAccents(
    String(html || '')
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/gi, ' ')
      .replace(/&#0?39;/g, "'")
      .replace(/&amp;/gi, '&')
      .replace(/\s+/g, ' ')
      .trim()
  );
}

function parsePercent(raw) {
  if (raw === undefined || raw === null) return null;
  var normalized = String(raw).replace(',', '.').trim();
  var value = parseFloat(normalized);
  return Number.isFinite(value) ? Number(value.toFixed(2)) : null;
}

function isoDate(year, month, day) {
  var yyyy = String(year);
  var mm = String(month).padStart(2, '0');
  var dd = String(day).padStart(2, '0');
  return yyyy + '-' + mm + '-' + dd;
}

function parseSlashDate(value) {
  var match = String(value || '').match(/(\d{2})\/(\d{2})\/(\d{4})/);
  if (!match) return null;
  return isoDate(match[3], match[2], match[1]);
}

function parseLongDate(value) {
  var clean = stripAccents(String(value || '')).toLowerCase();
  var match = clean.match(/(\d{1,2})\s+([a-z]+)\s+(\d{4})/);
  if (!match) return null;
  var month = MONTH_INDEX[match[2]];
  if (!month) return null;
  return isoDate(match[3], month, match[1]);
}

function parseMonthSlugDate(year, slug) {
  var month = MONTH_INDEX[String(slug || '').toLowerCase()];
  if (!month) return null;
  return isoDate(year, month, 1);
}

function parseDayMonthWithFallbackYear(value, fallbackYear) {
  var clean = stripAccents(String(value || '')).toLowerCase();
  var match = clean.match(/(\d{1,2})\s+([a-z]+)(?:\s+(\d{4}))?/);
  if (!match) return null;
  var month = MONTH_INDEX[match[2]];
  var year = match[3] || fallbackYear;
  if (!month || !year) return null;
  return isoDate(year, month, match[1]);
}

function directionFromRates(fromRate, toRate) {
  if (fromRate === null || fromRate === undefined) return 'unknown';
  if (toRate > fromRate) return 'up';
  if (toRate < fromRate) return 'down';
  return 'unchanged';
}

async function fetchText(url, options = {}) {
  var res = await fetch(url, {
    signal: options.signal ? AbortSignal.any([options.signal, AbortSignal.timeout(5000)]) : AbortSignal.timeout(5000),
    headers: { 'user-agent': USER_AGENT, accept: 'text/html,application/xhtml+xml' }
  });
  if (!res.ok) throw new Error('Official policy source returned HTTP ' + res.status);
  return await res.text();
}

async function fetchWorldBankInflation() {
  var iso3Codes = Object.values(COUNTRY_ISO3_MAP).join(';');
  var currentYear = new Date().getFullYear();
  var url = 'https://api.worldbank.org/v2/country/' + iso3Codes +
    '/indicator/FP.CPI.TOTL.ZG?date=' + (currentYear - 2) + ':' + currentYear +
    '&format=json&per_page=500';

  console.log('[rates-fetch] Fetching World Bank inflation data...');

  var res = await fetch(url, { signal: AbortSignal.timeout(3000) });
  if (!res.ok) throw new Error('World Bank API: HTTP ' + res.status);

  var json = await res.json();
  if (!Array.isArray(json) || json.length < 2 || !Array.isArray(json[1])) {
    throw new Error('World Bank API: unexpected response format');
  }

  var inflationMap = {};
  var iso3ToIso2 = {};
  Object.keys(COUNTRY_ISO3_MAP).forEach(function(iso2) {
    iso3ToIso2[COUNTRY_ISO3_MAP[iso2]] = iso2;
  });

  json[1].forEach(function(entry) {
    if (entry.value === null) return;
    var iso3 = entry.countryiso3code || (entry.country && entry.country.id);
    var iso2 = iso3ToIso2[iso3];
    if (!iso2) return;

    if (!inflationMap[iso2] || entry.date > inflationMap[iso2].date) {
      inflationMap[iso2] = {
        headline: Math.round(entry.value * 10) / 10,
        date: entry.date
      };
    }
  });

  console.log('[rates-fetch] World Bank returned inflation data for ' + Object.keys(inflationMap).length + ' countries');
  return inflationMap;
}

function extractCbnPolicyRate(body) {
  var cleanBody = String(body || '');
  var patterns = [
    /(?:Monetary Policy Rate(?:\s*\(MPR\))?|MPR)[\s\S]{0,160}?(?:to|at)\s*(\d{1,2}(?:\.\d{1,2})?)/i,
    /(?:Monetary Policy Rate(?:\s*\(MPR\))?|MPR)[\s\S]{0,160}?from\s*(\d{1,2}(?:\.\d{1,2})?)\s*per cent[\s\S]{0,60}?to\s*(\d{1,2}(?:\.\d{1,2})?)/i
  ];

  for (var i = 0; i < patterns.length; i++) {
    var match = cleanBody.match(patterns[i]);
    if (!match) continue;
    var value = match[2] || match[1];
    var rate = parsePercent(value);
    if (rate !== null) return rate;
  }

  return null;
}

async function fetchCbnUpdate(options = {}) {
  var url = 'https://www.cbn.gov.ng/MonetaryPolicy/decisions.html';
  var text = cleanHtmlText(await fetchText(url, options));
  var sectionPattern = /Key Decisions of the Central Bank of Nigeria Monetary Policy Committee ([A-Za-z]+)\s+(\d{1,2})-(\d{1,2}),\s+(\d{4})([\s\S]*?)(?=Key Decisions of the Central Bank of Nigeria Monetary Policy Committee|$)/gi;
  var sections = [];
  var match;

  while ((match = sectionPattern.exec(text)) !== null) {
    var monthName = match[1];
    var endDay = parseInt(match[3], 10);
    var year = parseInt(match[4], 10);
    var body = match[5];
    var rate = extractCbnPolicyRate(body);
    if (rate === null) continue;

    sections.push({
      date: isoDate(year, MONTH_INDEX[monthName.toLowerCase()], endDay),
      rate: rate
    });
  }

  if (sections.length === 0) {
    throw new Error('CBN parser failed to find MPC decisions');
  }

  sections.sort(function(a, b) { return a.date.localeCompare(b.date); });
  var latest = sections[sections.length - 1];
  var previous = sections.length > 1 ? sections[sections.length - 2] : null;

  return [{
    code: 'NG',
    policy_rate: latest.rate,
    previous_rate: previous ? previous.rate : null,
    last_change_date: latest.date,
    policy_rate_name: 'Monetary Policy Rate (MPR)',
    source_name: 'CBN MPC decisions',
    source_url: url
  }];
}

async function fetchCbkUpdate(options = {}) {
  var url = 'https://www.centralbank.go.ke/central-bank-rate/';
  var text = cleanHtmlText(await fetchText(url, options));
  var anchor = text.indexOf('Central Bank Rate (CBR) % Date Rate');
  if (anchor >= 0) {
    text = text.slice(anchor);
  }

  var matches = Array.from(text.matchAll(/(\d{2}\/\d{2}\/\d{4})\s+(\d{1,2}(?:\.\d{1,2})?)/g))
    .map(function(item) {
      return { date: parseSlashDate(item[1]), rate: parsePercent(item[2]) };
    })
    .filter(function(item) { return item.date && item.rate !== null; });

  if (matches.length < 2) {
    throw new Error('CBK parser failed to find enough CBR history rows');
  }

  var deduped = [];
  var seen = new Set();
  matches.forEach(function(item) {
    var key = item.date + '|' + item.rate;
    if (!seen.has(key)) {
      seen.add(key);
      deduped.push(item);
    }
  });

  deduped.sort(function(a, b) { return a.date.localeCompare(b.date); });
  var latest = deduped[deduped.length - 1];
  var previous = deduped[deduped.length - 2];

  return [{
    code: 'KE',
    policy_rate: latest.rate,
    previous_rate: previous ? previous.rate : null,
    last_change_date: latest.date,
    policy_rate_name: 'Central Bank Rate (CBR)',
    source_name: 'CBK Central Bank Rate table',
    source_url: url
  }];
}

function rankSarbStatementPath(pathname) {
  var match = String(pathname || '').match(/monetary-policy-statements\/(\d{4})\/([a-z]+)/i);
  if (!match) return null;
  var month = MONTH_INDEX[match[2].toLowerCase()];
  if (!month) return null;
  return {
    pathname: pathname,
    year: parseInt(match[1], 10),
    month: month,
    slug: match[2].toLowerCase()
  };
}

function buildSarbCandidateUrls(homeHtml) {
  var currentYear = new Date().getFullYear();
  var years = [currentYear, currentYear - 1, currentYear - 2];
  var seen = new Set();
  var candidates = [];

  Array.from(String(homeHtml || '').matchAll(/href="([^"]*monetary-policy-statements\/\d{4}\/[a-z]+)"/gi))
    .map(function(item) {
      return item[1].startsWith('http') ? item[1] : 'https://www.resbank.co.za' + item[1];
    })
    .forEach(function(url) {
      var ranked = rankSarbStatementPath(url);
      if (!ranked) return;
      if (seen.has(ranked.pathname)) return;
      seen.add(ranked.pathname);
      candidates.push(ranked);
    });

  years.forEach(function(year) {
    ENGLISH_MONTH_SLUGS.forEach(function(slug) {
      var url = 'https://www.resbank.co.za/en/home/publications/publication-detail-pages/statements/monetary-policy-statements/' + year + '/' + slug;
      var ranked = rankSarbStatementPath(url);
      if (!ranked) return;
      if (seen.has(ranked.pathname)) return;
      seen.add(ranked.pathname);
      candidates.push(ranked);
    });
  });

  return candidates.sort(function(a, b) {
    return (b.year - a.year) || (b.month - a.month);
  });
}

async function fetchOptionalHtml(url, options = {}) {
  var res = await fetch(url, {
    signal: options.signal ? AbortSignal.any([options.signal, AbortSignal.timeout(5000)]) : AbortSignal.timeout(5000),
    headers: { 'user-agent': USER_AGENT, accept: 'text/html,application/xhtml+xml' }
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error('HTTP ' + res.status + ' from ' + url);
  return await res.text();
}

function extractSarbStatement(entry, text) {
  var actionMatch = text.match(/MPC(?:\s+has)?\s+(lowered|raised|kept|reduced|increased)\s+the\s+(?:repurchase|policy)\s+rate\s+(?:unchanged,\s+)?(?:to|at)\s*(\d{1,2}(?:\.\d{1,2})?)%/i);
  if (!actionMatch) return null;

  var effectiveDateMatch = text.match(/(?:with effect|effective) from\s+(\d{1,2}\s+[A-Za-z]+(?:\s+\d{4})?)/i);
  var action = actionMatch[1].toLowerCase();
  if (action === 'reduced') action = 'lowered';
  if (action === 'increased') action = 'raised';
  return {
    url: entry.pathname,
    date: entry.statement_date,
    effective_date: effectiveDateMatch ? parseDayMonthWithFallbackYear(effectiveDateMatch[1], entry.year) : null,
    action: action,
    rate: parsePercent(actionMatch[2])
  };
}

async function fetchSarbUpdates(options = {}) {
  var homeUrl = 'https://www.resbank.co.za/';
  var pages = await Promise.all([
    fetchText(homeUrl, options),
    fetchText('https://www.resbank.co.za/en/home/what-we-do/monetary-policy/MPC-announcement-webcasts', options)
  ]);
  var homeHtml = pages[0];
  var statementDates = Array.from(pages[1].matchAll(/\b(\d{4})\/(\d{2})\/(\d{2})\b/g)).map(function(match) {
    return match[1] + '-' + match[2] + '-' + match[3];
  });
  var now = new Date();
  var ranked = buildSarbCandidateUrls(homeHtml).map(function(entry) {
    entry.statement_date = statementDates.find(function(date) { return date.startsWith(String(entry.year) + '-' + String(entry.month).padStart(2, '0') + '-'); });
    return entry;
  }).filter(function(entry) {
    return entry.statement_date && entry.statement_date <= now.toISOString().slice(0, 10);
  });

  if (ranked.length === 0) {
    throw new Error('SARB parser failed to locate MPC statement links');
  }

  var parsed = [];
  for (var i = 0; i < ranked.length; i++) {
    if (options.signal && options.signal.aborted) break;
    var entry = ranked[i];
    try {
      var html = await fetchOptionalHtml(entry.pathname, options);
      if (!html) continue;
      var statement = extractSarbStatement(entry, cleanHtmlText(html));
      if (!statement) continue;
      parsed.push(statement);

      if (parsed.length >= 2) {
        var latestParsed = parsed[0];
        var hasDistinctPrior = parsed.slice(1).some(function(item) {
          return item.rate !== latestParsed.rate;
        });

        if (latestParsed.action !== 'kept' || hasDistinctPrior) {
          break;
        }
      }
    } catch (err) {
      if (!/HTTP 404/i.test(err.message)) {
        console.error('[rates-fetch] SARB statement fetch failed: ' + err.message);
      }
    }
  }

  if (parsed.length === 0) {
    throw new Error('SARB parser failed to extract repo rate');
  }

  parsed.sort(function(a, b) { return a.date.localeCompare(b.date); });
  var latest = parsed[parsed.length - 1];
  var previous = parsed.length > 1 ? parsed[parsed.length - 2] : null;
  var previousDistinct = null;
  for (var j = parsed.length - 2; j >= 0; j--) {
    if (parsed[j].rate !== latest.rate) {
      previousDistinct = parsed[j];
      break;
    }
  }
  var lastChangeDate = latest.effective_date || latest.date;
  var previousRate = previousDistinct ? previousDistinct.rate : (previous ? previous.rate : null);

  if (latest.action === 'kept') {
    var lastChangeStatement = null;
    for (var k = parsed.length - 2; k >= 0; k--) {
      if (parsed[k].action !== 'kept') {
        lastChangeStatement = parsed[k];
        break;
      }
    }

    if (lastChangeStatement) {
      lastChangeDate = lastChangeStatement.effective_date || lastChangeStatement.date;
      for (var m = parsed.indexOf(lastChangeStatement) - 1; m >= 0; m--) {
        if (parsed[m].rate !== lastChangeStatement.rate) {
          previousRate = parsed[m].rate;
          break;
        }
      }
    } else if (previousDistinct) {
      lastChangeDate = previousDistinct.date;
    }
  }

  return [{
    code: 'ZA',
    policy_rate: latest.rate,
    previous_rate: previousRate,
    last_change_date: lastChangeDate,
    source_statement_date: latest.date,
    policy_rate_name: 'Repo Rate',
    source_name: 'SARB MPC statement',
    source_url: latest.url,
    source_note: latest.action === 'kept' ? 'Latest statement kept the repo rate unchanged.' : null
  }];
}

async function fetchBceaoUpdates(options = {}) {
  var url = 'https://www.bceao.int/fr';
  var text = cleanHtmlText(await fetchText(url, options));
  var rateMatch = text.match(/Taux minimum de soumission\s*:\s*(\d{1,2}(?:[\.,]\d{1,2})?)\s*%/i);
  var dateMatch = text.match(/Effectifs depuis le\s+(\d{1,2}\s+[a-z]+\s+\d{4})/i);

  if (!rateMatch) {
    throw new Error('BCEAO parser failed to locate current minimum bid rate');
  }

  var effectiveDate = dateMatch ? parseLongDate(dateMatch[1]) : null;
  return BCEAO_CODES.map(function(code) {
    return {
      code: code,
      policy_rate: parsePercent(rateMatch[1]),
      previous_rate: null,
      last_change_date: effectiveDate,
      policy_rate_name: 'BCEAO Main Rate',
      source_name: 'BCEAO homepage',
      source_url: url
    };
  });
}

async function fetchBeacUpdates(options = {}) {
  var url = 'https://www.beac.int/';
  var text = cleanHtmlText(await fetchText(url, options));
  var rateMatch = text.match(/Taux d'interet des appels d'offres\s*(\d{1,2}(?:[\.,]\d{1,2})?)\s*%/i);
  var dateMatch = text.match(/Decision N°[^.]*du\s+(\d{1,2}\s+[a-z]+\s+\d{4})\s+portant fixation des taux directeurs/i);

  if (!rateMatch) {
    throw new Error('BEAC parser failed to locate auction rate');
  }

  var effectiveDate = dateMatch ? parseLongDate(dateMatch[1]) : null;
  return BEAC_CODES.map(function(code) {
    return {
      code: code,
      policy_rate: parsePercent(rateMatch[1]),
      previous_rate: null,
      last_change_date: effectiveDate,
      policy_rate_name: "BEAC TIAO Rate",
      source_name: 'BEAC homepage',
      source_url: url
    };
  });
}

async function fetchBogUpdate(options = {}) {
  var url = 'https://www.bog.gov.gh/monetary-policy/policy-rate-trends/';
  var html = await fetchText(url, options);
  if (/Radware Captcha Page/i.test(html)) throw new Error('BoG official page blocked by captcha');
  var rows = Array.from(html.matchAll(/<tr[\s\S]*?<\/tr>/gi)).map(function(match) {
    var cells = Array.from(match[0].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)).map(function(cell) { return cleanHtmlText(cell[1]); });
    if (cells.length !== 4 || !/^\d{1,2} [A-Za-z]{3} \d{4}$/.test(cells[2])) return null;
    var stamp = Date.parse(cells[2] + ' 00:00:00 GMT');
    return Number.isFinite(stamp) ? { date: new Date(stamp).toISOString().slice(0, 10), rate: parsePercent(cells[3]) } : null;
  }).filter(function(row) { return row && row.rate !== null && row.date <= new Date().toISOString().slice(0, 10); });
  rows.sort(function(a, b) { return a.date.localeCompare(b.date); });
  if (!rows.length) throw new Error('BoG parser failed to locate dated policy rate rows');
  var latest = rows[rows.length - 1];
  var changed = latest;
  var previous = null;
  for (var i = rows.length - 2; i >= 0; i--) {
    if (rows[i].rate !== latest.rate) { previous = rows[i].rate; break; }
    changed = rows[i];
  }
  return [{ code: 'GH', policy_rate: latest.rate, previous_rate: previous,
    last_change_date: changed.date, source_statement_date: latest.date,
    policy_rate_name: 'Monetary Policy Rate', source_name: 'Bank of Ghana policy rate history',
    source_url: url, source_note: 'Latest dated row in the official policy rate history; later reviewed MPC statements take precedence.' }];
}

async function fetchBkamUpdate(options = {}) {
  var url = 'https://www.bkam.ma/Politique-monetaire/Cadre-strategique/Decision-de-la-politique-monetaire/Historique-des-decisions';
  var text = cleanHtmlText(await fetchText(url, options));
  var rows = Array.from(text.matchAll(/(\d{2}\/\d{2}\/\d{4})\s+(\d{1,2}(?:,\d{1,2})?|\d{1,2}(?:\.\d{1,2})?)%/g))
    .map(function(match) {
      return {
        date: parseSlashDate(match[1]),
        rate: parsePercent(match[2])
      };
    })
    .filter(function(item) {
      return item.date && item.rate !== null;
    });

  if (rows.length < 2) {
    throw new Error('Bank Al-Maghrib parser failed to find enough decision rows');
  }

  var deduped = [];
  var seen = new Set();
  rows.forEach(function(item) {
    var key = item.date + '|' + item.rate;
    if (!seen.has(key)) {
      seen.add(key);
      deduped.push(item);
    }
  });

  deduped.sort(function(a, b) { return a.date.localeCompare(b.date); });
  var latest = deduped[deduped.length - 1];
  var previousMeeting = deduped.length > 1 ? deduped[deduped.length - 2] : null;
  var previousDistinct = null;
  var lastChangeDate = latest.date;
  for (var i = deduped.length - 2; i >= 0; i--) {
    if (deduped[i].rate !== latest.rate) {
      previousDistinct = deduped[i];
      if (deduped[i + 1]) lastChangeDate = deduped[i + 1].date;
      break;
    }
  }

  return [{
    code: 'MA',
    policy_rate: latest.rate,
    previous_rate: previousDistinct ? previousDistinct.rate : (previousMeeting ? previousMeeting.rate : null),
    last_change_date: lastChangeDate,
    policy_rate_name: 'Key Rate',
    source_name: 'Bank Al-Maghrib decision history',
    source_url: url,
    source_statement_date: latest.date,
    source_note: previousDistinct && previousDistinct.date !== latest.date
      ? 'Latest Bank Al-Maghrib meeting kept the key rate unchanged.'
      : null
  }];
}

async function fetchOfficialPolicyRateUpdates() {
  var fetchers = [
    fetchCbnUpdate,
    fetchCbkUpdate,
    fetchSarbUpdates,
    fetchBceaoUpdates,
    fetchBeacUpdates,
    fetchBogUpdate,
    fetchBkamUpdate
  ];
  var updates = [];
  var errors = [];

  var batches = await Promise.all(fetchers.map(async function(fn) {
    try {
      return await fn({ signal: AbortSignal.timeout(12000) });
    } catch (err) {
      errors.push(fn.name + ': ' + (err.name === 'TimeoutError' || err.name === 'AbortError' ? 'timeout' : 'source unavailable or unparseable'));
      return [];
    }
  }));
  batches.forEach(function(batch) { if (Array.isArray(batch)) updates = updates.concat(batch); });

  return { updates: updates, errors: errors };
}

function loadManualPolicyOverrides() {
  try {
    var parsed = manualPolicyOverrides;
    var countries = Array.isArray(parsed.countries) ? parsed.countries : [];
    var updates = countries
      .filter(function(item) {
        return item && item.code && item.policy_rate !== null && item.policy_rate !== undefined;
      })
      .map(function(item) {
        return Object.assign({}, item);
      });

    return {
      updates: updates,
      codes: updates.map(function(item) { return item.code; }).sort(),
      generated_at: parsed.generated_at || null
    };
  } catch (err) {
    console.error('[rates-fetch] Manual override load failed: ' + err.message);
    return { updates: [], codes: [], generated_at: null, error: err.message };
  }
}

function mergeInflationData(data, inflationMap) {
  data.countries.forEach(function(country) {
    var wbData = inflationMap[country.code];
    if (!wbData) return;
    if (!country.inflation) country.inflation = {};
    country.inflation.wb_headline = wbData.headline;
    country.inflation.wb_date = wbData.date;
  });
}

function mergePolicyUpdates(automatic, manual, nowIso) {
  var result = automatic.slice();
  manual.forEach(function(update) {
    var reviewed = Date.parse(update.reviewed_at || '');
    var age = Date.parse(nowIso) - reviewed;
    if (!Number.isFinite(age) || age < 0 || age > 7 * 86400000) return;
    var found = result.find(function(item) { return item.code === update.code; });
    if (found && String(found.source_statement_date || '') >= String(update.source_statement_date || '')) return;
    result = result.filter(function(item) { return item.code !== update.code; });
    result.push(Object.assign({}, update, { verification_kind: 'manual', verified_at: update.reviewed_at }));
  });
  return result;
}

function applyPolicyRateUpdates(data, updates, nowIso) {
  var nowDate = nowIso.slice(0, 10);
  var countryMap = {};
  data.countries.forEach(function(country) {
    countryMap[country.code] = country;
  });

  var verifiedCodes = [];
  updates.forEach(function(update) {
    var country = countryMap[update.code];
    if (!country || update.policy_rate === null || update.policy_rate === undefined) return;
    var sourceDate = update.source_statement_date || update.last_change_date;
    if (country.policy_rate_source_date && String(sourceDate || '') < country.policy_rate_source_date) return;

    var currentRate = parsePercent(update.policy_rate);
    if (currentRate === null || currentRate < 0 || currentRate > 100) return;
    var oldRate = country.policy_rate;
    var previousRate = update.previous_rate !== null && update.previous_rate !== undefined
      ? parsePercent(update.previous_rate)
      : oldRate;
    var effectiveDate = update.last_change_date || (Number(oldRate) === currentRate && country.last_rate_change && country.last_rate_change.date) || null;
    var statementDate = sourceDate || null;

    country.policy_rate = currentRate;
    if (update.policy_rate_name) country.policy_rate_name = update.policy_rate_name;
    country.last_updated = (update.verified_at || nowIso).slice(0, 10);
    country.policy_rate_source = update.source_name;
    country.policy_rate_source_url = update.source_url;
    country.policy_rate_verified_at = update.verified_at || nowIso;
    country.policy_rate_verification_kind = update.verification_kind || 'automatic';
    country.policy_rate_source_date = statementDate;
    if (update.source_note) {
      country.policy_rate_source_note = update.source_note;
    }

    if (oldRate === null || oldRate === undefined || Number(oldRate) !== Number(currentRate) ||
        (update.last_change_date && (!country.last_rate_change || country.last_rate_change.date !== update.last_change_date))) {
      country.last_rate_change = {
        date: effectiveDate,
        from: previousRate,
        to: currentRate,
        direction: directionFromRates(previousRate, currentRate)
      };
    }

    verifiedCodes.push(update.code);
  });

  return Array.from(new Set(verifiedCodes)).sort();
}

exports._private = {
  extractSarbStatement,
  mergePolicyUpdates,
  applyPolicyRateUpdates,
  fetchCbnUpdate,
  fetchCbkUpdate,
  fetchSarbUpdates,
  fetchBceaoUpdates,
  fetchBeacUpdates,
  fetchBogUpdate,
  fetchBkamUpdate,
  fetchOfficialPolicyRateUpdates,
  loadManualPolicyOverrides,
  parseSlashDate,
  parseLongDate,
  cleanHtmlText
};

exports.handler = async function () {
  console.log('[rates-fetch] Starting scheduled central bank rates check...');

  var now = new Date();
  var nowIso = now.toISOString();
  var data = await getData('rates-latest');

  if (!data || !data.countries) {
    console.log('[rates-fetch] No cached data - this will use seed data only.');
    await updateMeta('rates', {
      last_fetch: nowIso,
      source: 'seed-data',
      status: 'seed'
    });
    return { statusCode: 200, body: 'No cached rates data. Seed data will be used.' };
  }

  var officialResult = await fetchOfficialPolicyRateUpdates();
  var manualOverrides = loadManualPolicyOverrides();
  var mergedUpdates = mergePolicyUpdates(officialResult.updates, manualOverrides.updates, nowIso);

  var verifiedCodes = applyPolicyRateUpdates(data, mergedUpdates, nowIso);
  var manualCodes = mergedUpdates.filter(function(update) { return update.verification_kind === 'manual' && verifiedCodes.includes(update.code); })
    .map(function(update) { return update.code; }).sort();

  var worldBankSuccess = false;
  try {
    var inflationMap = await fetchWorldBankInflation();
    if (Object.keys(inflationMap).length > 0) {
      mergeInflationData(data, inflationMap);
      worldBankSuccess = true;
    }
  } catch (err) {
    console.error('[rates-fetch] World Bank fetch failed: ' + err.message);
  }

  var dataAge = data.timestamp ? now.getTime() - new Date(data.timestamp).getTime() : Infinity;
  var wasStale = dataAge > THIRTY_DAYS_MS;

  data.schemaVersion = 1;
  // A failed collection must not make the retained reference snapshot look fresh.
  data.timestamp = verifiedCodes.length > 0 ? nowIso : data.timestamp;
  data.inflation_enriched_at = worldBankSuccess ? nowIso : data.inflation_enriched_at || null;
  data._enriched = worldBankSuccess ? 'worldbank' : 'none';
  data._verification = {
    policy_rate_verified_at: verifiedCodes.length > 0 ? nowIso : null,
    verified_count: verifiedCodes.length,
    verified_codes: verifiedCodes,
    manual_official_count: manualCodes.length,
    manual_official_codes: manualCodes,
    manual_override_generated_at: manualOverrides.generated_at,
    official_source_failures: officialResult.errors,
    partial: verifiedCodes.length < data.countries.length
  };
  data._note = (verifiedCodes.length > 0)
    ? 'Policy rates were refreshed from official pages and dated statements reviewed manually. Remaining countries retain reference values and are withheld from the verified policy-rate API.'
    : 'Policy rate data remains on the maintained reference snapshot. Manual refresh recommended.';

  var written = await setData('rates-latest', data);
  if (!written) {
    console.error('[rates-fetch] Persistence failed; last-known-good data retained.');
    try {
      await updateMeta('rates', {
        status: 'write-failed',
        error: 'Persistence failed',
        last_attempt: nowIso,
      });
    } catch (err) {
      console.warn('[rates-fetch] ' + storageDiagnostic('failure-metadata', 'meta', err));
    }
    return { statusCode: 503, body: 'Rates persistence failed; last-known-good data retained.' };
  }

  var sourceParts = [];
  if (verifiedCodes.length > 0) sourceParts.push('official-policy-pages');
  if (manualCodes.length > 0) sourceParts.push('manual-official-overrides');
  if (worldBankSuccess) sourceParts.push('worldbank-inflation');
  if (sourceParts.length === 0) sourceParts.push('cache');

  var status = verifiedCodes.length > 0 ? 'ok' : (wasStale ? 'stale' : 'reference');
  await updateMeta('rates', {
    last_fetch: data.timestamp,
    last_attempt: nowIso,
    error: null,
    source: sourceParts.join('+'),
    status: status,
    countries_count: data.countries.length,
    wb_enriched: worldBankSuccess,
    verified_count: verifiedCodes.length,
    manual_official_count: manualCodes.length,
    verification_partial: verifiedCodes.length < data.countries.length,
    official_source_failures: officialResult.errors.slice(0, 5)
  });

  console.log('[rates-fetch] Complete. Verified ' + verifiedCodes.length + ' country records. WB enriched: ' + worldBankSuccess + '.');

  return {
    statusCode: 200,
    body: 'Rates data refreshed. Official policy-rate records verified: ' + verifiedCodes.length + '.'
  };
};
