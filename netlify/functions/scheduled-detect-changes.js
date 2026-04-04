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
        detected_at: new Date().toISOString(),
      });
    }
  });

  return alerts;
}

/**
 * Save alerts to Supabase
 */
async function saveAlerts(alerts) {
  if (!alerts.length || !SUPABASE_KEY) return;

  try {
    var res = await fetch(SUPABASE_URL + '/rest/v1/alerts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_KEY,
        'Authorization': 'Bearer ' + SUPABASE_KEY,
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify(alerts),
    });

    if (!res.ok) {
      console.warn('[change-detect] Alert save failed: ' + res.status);
    } else {
      console.log('[change-detect] Saved ' + alerts.length + ' alerts to Supabase');
    }
  } catch (err) {
    console.warn('[change-detect] Alert save error: ' + err.message);
  }
}

/**
 * Send high-severity alert email via Resend
 */
async function sendAlertEmail(alerts) {
  var highAlerts = alerts.filter(function(a) { return a.severity === 'high'; });
  if (!highAlerts.length || !RESEND_KEY) return;

  var body = highAlerts.map(function(a) {
    var emoji = a.direction === 'up' ? '\u2B06\uFE0F' : '\u2B07\uFE0F';
    return emoji + ' ' + (a.country_name || '') + ' ' + a.metric + ': ' +
      a.change_pct + '% (' + a.old_value + ' \u2192 ' + a.new_value + ')';
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
        to: ['momohozaveshe@gmail.com'],
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
    await saveAlerts(allAlerts);
    await sendAlertEmail(allAlerts);
    console.log('[change-detect] Total: ' + allAlerts.length + ' alert(s) fired');
  } else {
    console.log('[change-detect] No significant changes detected across all categories');
  }

  return {
    statusCode: 200,
    body: JSON.stringify({
      alerts_count: allAlerts.length,
      categories_checked: categories.length,
      timestamp: new Date().toISOString(),
    }),
  };
};
