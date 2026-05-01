/**
 * AfroTools — Scheduled Change Detection Engine
 * Runs every 6 hours. Compares current vs previous data and fires alerts
 * when significant price/rate changes are detected.
 *
 * Detects:
 *  - Fuel price changes > 5%
 *  - Forex rate changes > 3%
 *  - Electricity tariff changes > 10%
 *  - Commodity price changes > 8%
 *
 * Writes alerts to Supabase `alerts` table and optionally sends email via Resend.
 */

const { getData, setData } = require('./_shared/data-store');

var SUPABASE_URL = 'https://zpclagtgczsygrgztlts.supabase.co';
var SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ||
                   process.env.SUPABASE_DATA_SERVICE_ROLE_KEY ||
                   process.env.SUPABASE_SERVICE_KEY;

var RESEND_KEY = process.env.RESEND_API_KEY;
var ALERT_EXPIRY_DAYS = Math.max(1, Math.min(180, Number(process.env.AFROALERTS_EXPIRY_DAYS || 30)));
var ALERT_EMAIL_TO = String(process.env.AFROALERTS_EMAIL_TO || 'momohozaveshe@gmail.com')
  .split(',')
  .map(function(email) { return email.trim(); })
  .filter(Boolean);

// Change thresholds per category (percent)
var THRESHOLDS = {
  fuel:        { field: 'petrol.usd', pct: 5, label: 'Fuel Price' },
  forex:       { field: 'rate',       pct: 3, label: 'Exchange Rate' },
  electricity: { field: 'residential.price_kwh_usd', pct: 10, label: 'Electricity Tariff' },
  commodities: { field: 'price',      pct: 8, label: 'Commodity Price' },
};

/**
 * Get nested value from object by dot-separated path
 */
function getNestedValue(obj, path) {
  var parts = path.split('.');
  var current = obj;
  for (var i = 0; i < parts.length; i++) {
    if (current == null) return undefined;
    current = current[parts[i]];
  }
  return current;
}

function addDaysIsoDate(dateInput, days) {
  var date = dateInput ? new Date(dateInput) : new Date();
  if (!Number.isFinite(date.getTime())) date = new Date();
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function formatAlertValue(value) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return String(value);
  if (Math.abs(value) >= 1000) return String(Math.round(value * 100) / 100);
  if (Math.abs(value) >= 10) return String(Math.round(value * 1000) / 1000);
  return String(Math.round(value * 10000) / 10000);
}

function isReferenceCommoditySnapshot(snapshot) {
  if (!snapshot || !Array.isArray(snapshot.commodities) || snapshot.commodities.length === 0) return false;
  if (snapshot.source === 'reference-fallback') return true;
  return snapshot.commodities.every(function(commodity) {
    return commodity && commodity.source === 'reference-fallback';
  });
}

function sourceSuffix(alert) {
  var parts = [];
  if (alert.period) parts.push('period ' + alert.period);
  if (alert.source) parts.push('source ' + alert.source);
  return parts.length ? ' (' + parts.join(', ') + ')' : '';
}

/**
 * Detect changes in a country-based dataset
 */
function detectCountryChanges(category, newData, oldData, config) {
  var alerts = [];
  if (!newData || !newData.countries || !oldData || !oldData.countries) return alerts;

  var oldMap = {};
  oldData.countries.forEach(function(c) { oldMap[c.code || c.country] = c; });

  newData.countries.forEach(function(c) {
    var code = c.code || c.country;
    var old = oldMap[code];
    if (!old) return;

    var newVal = getNestedValue(c, config.field);
    var oldVal = getNestedValue(old, config.field);

    if (typeof newVal !== 'number' || typeof oldVal !== 'number' || oldVal === 0) return;

    var changePct = ((newVal - oldVal) / oldVal) * 100;

    if (Math.abs(changePct) >= config.pct) {
      alerts.push({
        category: category,
        country_code: code,
        country_name: c.name || code,
        metric: config.label,
        old_value: oldVal,
        new_value: newVal,
        change_pct: Math.round(changePct * 10) / 10,
        direction: changePct > 0 ? 'up' : 'down',
        severity: Math.abs(changePct) >= config.pct * 2 ? 'high' : 'medium',
        detected_at: new Date().toISOString(),
      });
    }
  });

  return alerts;
}

/**
 * Detect changes in commodity prices
 */
function detectCommodityChanges(newData, oldData) {
  var alerts = [];
  if (!newData || !newData.commodities || !oldData || !oldData.commodities) return alerts;

  if (isReferenceCommoditySnapshot(oldData)) {
    console.log('[change-detect] commodities: previous snapshot is reference fallback; seeding baseline without alerts');
    return alerts;
  }

  var oldMap = {};
  oldData.commodities.forEach(function(c) { oldMap[c.id] = c; });

  newData.commodities.forEach(function(c) {
    var old = oldMap[c.id];
    if (!old || !old.price || old.price === 0) return;

    var changePct = ((c.price - old.price) / old.price) * 100;

    if (Math.abs(changePct) >= THRESHOLDS.commodities.pct) {
      alerts.push({
        category: 'commodities',
        country_code: null,
        country_name: null,
        metric: c.name,
        old_value: old.price,
        new_value: c.price,
        change_pct: Math.round(changePct * 10) / 10,
        direction: changePct > 0 ? 'up' : 'down',
        severity: Math.abs(changePct) >= 20 ? 'high' : 'medium',
        source: c.source || newData.source || null,
        source_url: c.source_url || newData.source_url || null,
        period: c.period || newData.period || null,
        detected_at: new Date().toISOString(),
      });
    }
  });

  return alerts;
}

async function alertAlreadyExists(row) {
  if (!SUPABASE_KEY) return false;
  try {
    var url = SUPABASE_URL + '/rest/v1/alerts?select=id&limit=1' +
      '&title=eq.' + encodeURIComponent(row.title) +
      '&effective_date=eq.' + encodeURIComponent(row.effective_date) +
      '&active=eq.true';
    var res = await fetch(url, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': 'Bearer ' + SUPABASE_KEY,
      },
    });
    if (!res.ok) return false;
    var rows = await res.json();
    return Array.isArray(rows) && rows.length > 0;
  } catch (err) {
    console.warn('[change-detect] Alert duplicate check failed: ' + err.message);
    return false;
  }
}

/**
 * Save alerts to Supabase
 */
async function saveAlerts(alerts) {
  if (!alerts.length || !SUPABASE_KEY) return [];

  try {
    var entries = alerts.map(function(alert) {
      var countryLabel = alert.country_name || alert.country_code || 'Regional';
      var title = countryLabel + ' ' + alert.metric + ' change';
      var description = alert.metric + ' changed ' + alert.change_pct + '% (' +
        formatAlertValue(alert.old_value) + ' -> ' + formatAlertValue(alert.new_value) + ')' +
        sourceSuffix(alert);
      if (alert.direction === 'up') description += ' Increase detected';
      if (alert.direction === 'down') description += ' Decrease detected';
      var effectiveDate = (alert.detected_at || new Date().toISOString()).slice(0, 10);

      return {
        alert: alert,
        row: {
          country_codes: [alert.country_code || 'ALL'],
          title: title,
          description: description,
          severity: alert.severity || 'medium',
          effective_date: effectiveDate,
          expires_at: addDaysIsoDate(effectiveDate, ALERT_EXPIRY_DAYS),
          active: true,
        },
      };
    });

    var newEntries = [];
    for (var i = 0; i < entries.length; i++) {
      if (await alertAlreadyExists(entries[i].row)) {
        console.log('[change-detect] Skipping duplicate alert: ' + entries[i].row.title);
      } else {
        newEntries.push(entries[i]);
      }
    }

    if (!newEntries.length) {
      console.log('[change-detect] All alerts already exist; no rows inserted');
      return [];
    }

    var res = await fetch(SUPABASE_URL + '/rest/v1/alerts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_KEY,
        'Authorization': 'Bearer ' + SUPABASE_KEY,
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify(newEntries.map(function(entry) { return entry.row; })),
    });

    if (!res.ok) {
      console.warn('[change-detect] Alert save failed: ' + res.status);
      return [];
    } else {
      console.log('[change-detect] Saved ' + newEntries.length + ' alerts to Supabase');
      return newEntries.map(function(entry) { return entry.alert; });
    }
  } catch (err) {
    console.warn('[change-detect] Alert save error: ' + err.message);
    return [];
  }
}

/**
 * Send high-severity alert email via Resend
 */
async function sendAlertEmail(alerts) {
  var highAlerts = alerts.filter(function(a) { return a.severity === 'high'; });
  if (!highAlerts.length || !RESEND_KEY || ALERT_EMAIL_TO.length === 0) return;

  var body = highAlerts.map(function(a) {
    var emoji = a.direction === 'up' ? '\u2B06\uFE0F' : '\u2B07\uFE0F';
    var label = [a.country_name, a.metric].filter(Boolean).join(' ');
    return emoji + ' ' + label + ': ' +
      a.change_pct + '% (' + formatAlertValue(a.old_value) + ' \u2192 ' + formatAlertValue(a.new_value) + ')' +
      sourceSuffix(a);
  }).join('\n');

  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + RESEND_KEY,
      },
      body: JSON.stringify({
        from: 'AfroTools Alerts <alerts@afrotools.com>',
        to: ALERT_EMAIL_TO,
        subject: 'AfroAlerts: ' + highAlerts.length + ' significant price change' + (highAlerts.length > 1 ? 's' : '') + ' detected',
        text: 'AfroTools Change Detection Report\n' +
          new Date().toISOString() + '\n\n' +
          body + '\n\n' +
          'View details: https://afrotools.com/admin/alerts',
      }),
    });
    console.log('[change-detect] Alert email sent for ' + highAlerts.length + ' high-severity changes');
  } catch (err) {
    console.warn('[change-detect] Email failed: ' + err.message);
  }
}

exports.handler = async function(event) {
  console.log('[change-detect] Starting change detection scan...');

  var allAlerts = [];
  var savedAlerts = [];

  // Compare current snapshots against stored previous snapshots
  // Previous snapshots are stored as 'prev-{key}' in blobs by this function

  var categories = [
    { key: 'fuel-latest', prev: 'prev-fuel', category: 'fuel', type: 'country' },
    { key: 'electricity-latest', prev: 'prev-electricity', category: 'electricity', type: 'country' },
    { key: 'commodity-prices-latest', prev: 'prev-commodities', category: 'commodities', type: 'commodity' },
  ];

  for (var i = 0; i < categories.length; i++) {
    var cat = categories[i];
    var current = await getData(cat.key);
    var previous = await getData(cat.prev);

    if (!current) {
      console.log('[change-detect] No current data for ' + cat.category);
      continue;
    }

    var config = THRESHOLDS[cat.category];
    var alerts;

    if (cat.type === 'commodity') {
      alerts = detectCommodityChanges(current, previous);
    } else {
      alerts = detectCountryChanges(cat.category, current, previous, config);
    }

    if (alerts.length > 0) {
      console.log('[change-detect] ' + cat.category + ': ' + alerts.length + ' change(s) detected');
      allAlerts = allAlerts.concat(alerts);
    } else {
      console.log('[change-detect] ' + cat.category + ': no significant changes');
    }

    // Store current as previous for next comparison
    await setData(cat.prev, current);
  }

  // Save all alerts
  if (allAlerts.length > 0) {
    savedAlerts = await saveAlerts(allAlerts);
    await sendAlertEmail(savedAlerts);
    console.log('[change-detect] Total: ' + savedAlerts.length + ' new alert(s) fired from ' + allAlerts.length + ' detection(s)');
  } else {
    console.log('[change-detect] No significant changes detected across all categories');
  }

  return {
    statusCode: 200,
    body: JSON.stringify({
      alerts_count: savedAlerts.length,
      detected_count: allAlerts.length,
      categories_checked: categories.length,
      timestamp: new Date().toISOString(),
    }),
  };
};
