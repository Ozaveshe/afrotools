/**
 * afrowork-whatsapp.js
 * AfroTools WhatsApp Bot — Meta Cloud API Webhook Handler
 *
 * Handles incoming WhatsApp messages and sends payroll/HR responses.
 *
 * ── Environment variables required (set in Netlify dashboard) ───────────────
 *   WHATSAPP_TOKEN          — Meta Cloud API access token
 *   WHATSAPP_PHONE_ID       — WhatsApp Business phone number ID (not the number itself)
 *   WHATSAPP_APP_SECRET     — Meta app secret for webhook signature verification
 *   WHATSAPP_GRAPH_VERSION  — Explicit verified Graph API version, e.g. v23.0
 *   WHATSAPP_VERIFY_TOKEN   — Webhook verification token you chose in Meta dashboard
 *   SUPABASE_DATA_URL       — https://zpclagtgczsygrgztlts.supabase.co
 *   SUPABASE_DATA_SERVICE_ROLE_KEY — service role key for data project
 *
 * Activation, migration and recovery: docs/WHATSAPP-DELIVERY-RUNBOOK.md.
 * Apply the receipt migration before enabling delivery. Operational usage logs
 * do not store phone hashes or message bodies.
 */

'use strict';

const crypto       = require('crypto');
const { createDeliveryStore, withDeliveryReceipt } = require('./_shared/whatsapp-delivery-store');
const payeEngines  = require('./_engines/index');
const hrRuntime = require('./_shared/whatsapp-hr-runtime');
const BotEngine    = require('../../engines/whatsapp-bot-engine');

// ── Config ───────────────────────────────────────────────────────────────────
const WA_TOKEN        = process.env.WHATSAPP_TOKEN;
const WA_PHONE_ID     = process.env.WHATSAPP_PHONE_ID;
const VERIFY_TOKEN    = process.env.WHATSAPP_VERIFY_TOKEN;
const SUPABASE_URL    = process.env.SUPABASE_DATA_URL    || 'https://zpclagtgczsygrgztlts.supabase.co';
const SUPABASE_KEY    = process.env.SUPABASE_DATA_SERVICE_ROLE_KEY;
const SITE_URL        = 'https://afrotools.com';
// Verify provider support before activation; syntax alone does not establish support.
const WA_GRAPH_VERSION = process.env.WHATSAPP_GRAPH_VERSION || '';
const WA_API_BASE = /^v[1-9]\d*\.0$/.test(WA_GRAPH_VERSION)
  ? 'https://graph.facebook.com/' + WA_GRAPH_VERSION : null;
const deliveryStore = createDeliveryStore({ url: SUPABASE_URL, key: SUPABASE_KEY, fetchImpl: (url, options) => fetch(url, options) });

// ── Main handler ─────────────────────────────────────────────────────────────
exports.handler = async function (event) {
  // 1. GET — Meta webhook verification challenge
  if (event.httpMethod === 'GET') {
    if (!VERIFY_TOKEN) return { statusCode: 503, body: 'Webhook verification is not configured' };
    var params = event.queryStringParameters || {};
    if (params['hub.mode'] !== 'subscribe' || typeof params['hub.challenge'] !== 'string' || !params['hub.challenge']) {
      return { statusCode: 400, body: 'Invalid verification request' };
    }
    if (params['hub.verify_token'] === VERIFY_TOKEN) {
      return { statusCode: 200, body: params['hub.challenge'] || '' };
    }
    return { statusCode: 403, body: 'Forbidden' };
  }

  // 2. POST — Incoming message payload
  if (event.httpMethod === 'POST') {
    if (!WA_TOKEN || !WA_PHONE_ID || !process.env.WHATSAPP_APP_SECRET || !WA_API_BASE) {
      return { statusCode: 503, body: 'Webhook delivery is not configured' };
    }
    if (typeof event.body !== 'string') return { statusCode: 400, body: 'Invalid request body' };
    var rawBody = event.isBase64Encoded ? Buffer.from(event.body, 'base64').toString('utf8') : event.body;
    var signatureEvent = Object.assign({}, event, { body: rawBody });
    // Verify Meta webhook signature
    if (!verifySignature(signatureEvent)) {
      console.warn('[wa-bot] Signature mismatch — ignoring');
      return { statusCode: 403, body: 'Forbidden' };
    }

    var body;
    try {
      body = JSON.parse(rawBody);
    } catch (e) {
      return { statusCode: 200, body: 'OK' };
    }

    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return { statusCode: 400, body: 'Invalid payload' };
    }

    var messages = [];
    for (var entry of (Array.isArray(body.entry) ? body.entry : [])) {
      for (var change of (entry && Array.isArray(entry.changes) ? entry.changes : [])) {
        var value = change && change.value;
        for (var message of (value && Array.isArray(value.messages) ? value.messages : [])) {
          if (!message || message.type !== 'text') continue;
          if (typeof message.id !== 'string' || !message.id.trim() || message.id.length > 512 ||
              typeof message.from !== 'string' || !/^\d{5,20}$/.test(message.from) ||
              !message.text || typeof message.text.body !== 'string') {
            return { statusCode: 400, body: 'Invalid text message' };
          }
          if (message.text.body.trim()) messages.push(message);
        }
      }
    }
    if (messages.length && !deliveryStore.configured) {
      return { statusCode: 503, body: 'Delivery receipt store is not configured' };
    }
    var deliveryFailed = false;
    for (var textMessage of messages) {
      try { await withDeliveryReceipt(deliveryStore, textMessage.id, beforeSend => processTextMessage(textMessage, beforeSend)); }
      catch (_) {
        console.warn('[wa-bot] Message delivery incomplete');
        deliveryFailed = true;
      }
    }
    if (deliveryFailed) return { statusCode: 503, body: 'Delivery incomplete' };

    return { statusCode: 200, body: 'OK' };
  }

  return { statusCode: 405, body: 'Method Not Allowed' };
};

async function processTextMessage(message, beforeSend) {
    var from      = message.from;                   // Meta phone number format
    var msgText   = message.text.body.trim();
    if (!msgText) return;
    var startTime = Date.now();

    // 3. Detect intent
    // Consent is per request and must be an explicit command, never inferred from the question.
    var aiConsentCommand = /^AI CONSENT:\s*([\s\S]+)$/i.exec(msgText);
    var requestText = aiConsentCommand ? aiConsentCommand[1].trim() : msgText;
    var intent = BotEngine.detectIntent(requestText);
    if (aiConsentCommand && requestText) {
      intent.type = 'law';
      intent.aiConsent = true;
    }

    // 4. Build response
    var responseText;
    var success = true;
    try {
      responseText = await handleIntent(intent, requestText);
    } catch (err) {
      console.error('[wa-bot] Response generation failed');
      responseText = '⚠️ Something went wrong. Please try again or type HELP for commands.';
      success = false;
    }

    // 5. Send reply via WhatsApp Cloud API
    await beforeSend();
    await sendWhatsAppMessage(from, responseText);

    // 6. Complete the bounded usage request before this serverless invocation ends
    await logUsage(intent, success, Date.now() - startTime).catch(function () {
      console.warn('[wa-bot] Usage recording failed');
    });

}

// ── Intent router ─────────────────────────────────────────────────────────────
async function handleIntent(intent, rawText) {
  switch (intent.type) {
    case 'help':
      return BotEngine.buildHelpMessage();

    case 'paye':
      return handlePaye(intent);

    case 'minwage':
      return handleMinwage(intent);

    case 'overtime':
      return handleOvertime(intent, rawText);

    case 'leave':
      return handleLeave(intent);

    case 'pension':
      return handlePension(intent);

    case 'deadline':
      return handleDeadline(intent);

    case 'salary':
      return handleSalaryBenchmark(intent, rawText);

    case 'law':
    case 'natural-language':
      return handleLabourLaw(intent, rawText);

    default:
      return ambiguousResponse();
  }
}

// ── PAYE handler ──────────────────────────────────────────────────────────────
function handlePaye(intent) {
  var cc = String(intent.country || '').toUpperCase();
  var gross = Number(intent.salary);
  if (!cc) return 'Which country? Include the country name. Example: PAYE Nigeria 450000';
  if (!Number.isFinite(gross) || gross <= 0 || !Number.isFinite(gross * 12)) {
    return 'Enter a finite, positive gross monthly salary. Example: PAYE ' + countryName(cc) + ' 300000';
  }
  var engine = payeEngines.get(cc);
  if (!engine) return 'No payroll model is available for this country. Browse ' + SITE_URL + '/salary-tax/';
  try {
    var calculation = engine.calculate({ grossAnnual: gross * 12 });
    var result = calculation && calculation.result;
    var tax = calculation && calculation.tax;
    var net = result && result.netMonthly;
    var annualTax = tax && tax.netTax;
    if (!result || !tax || !Number.isFinite(net) || !Number.isFinite(annualTax)) {
      throw new Error('Payroll model returned an incomplete result');
    }
    var sym = (BotEngine.CURRENCIES[cc] || {}).symbol || engine.currency + ' ';
    var metadata = calculation.meta || {};
    var effectiveOn = new Date().toISOString().slice(0, 10);
    var coverage = payeEngines.resolve(cc, effectiveOn);
    var lines = [
      BotEngine.getFlag(cc) + ' *' + countryName(cc) + ' payroll estimate*',
      'Monthly gross: ' + sym + BotEngine.fmtNum(gross),
      'Annual income tax: ' + sym + BotEngine.fmtNum(annualTax),
      'Total employee deductions per month: ' + sym + BotEngine.fmtNum(gross - net),
      '*Estimated net pay: ' + sym + BotEngine.fmtNum(net) + '*',
      'Effective income-tax rate: ' + (annualTax / (gross * 12) * 100).toFixed(2) + '%',
      '',
      'Uses the country model default settings; personal reliefs and optional deductions may change your result.',
      'Monthly net uses the default pay-month; seasonal deductions can differ from an annual average.',
      'Model: ' + (metadata.regime || 'default settings'),
      'Model updated: ' + (metadata.lastUpdated || engine.lastUpdated || 'not recorded')
    ];
    if (!coverage.ok) {
      lines.push('Current-date coverage is not verified. Check the applicable tax year and official rules before using this estimate for payroll.');
    } else {
      lines.push('Model period: ' + (coverage.formula.effectiveFrom || 'not date-specific') + ' to ' + (coverage.formula.effectiveTo || 'no end date recorded') + '. Verify applicable rules and inputs before filing.');
    }
    lines.push('Adjust assumptions and review sources: ' + SITE_URL + '/salary-tax/');
    lines.push('_Type HELP for more commands_');
    return lines.join('\n');
  } catch (_) {
    return 'Could not produce a valid payroll estimate. Review the country calculator at ' + SITE_URL + '/salary-tax/';
  }
}

// ── Minimum wage handler ──────────────────────────────────────────────────────
function handleMinwage(intent) {
  var cc = intent.country;
  if (!cc) {
    return (
      '🌍 Which country? Include the country name.\n\n' +
      '*Examples:*\nMINWAGE Nigeria\nminimum wage Kenya\nmin wage South Africa'
    );
  }

  var record = hrRuntime.minimumWages[cc];
  if (!record) return 'No wage reference is available for this country. Check the applicable official sources: ' + SITE_URL + '/tools/minimum-wage/';
  var national = record.nationalMinimum || {};
  var symbol = record.symbol || record.currency || cc;
  var lines = [BotEngine.getFlag(cc) + ' *' + countryName(cc) + ' wage reference*', ''];
  function addRates(data, prefix) {
    var count = 0;
    ['monthly', 'daily', 'hourly'].forEach(function (unit) {
      if (Number.isFinite(data[unit]) && data[unit] > 0) {
        lines.push(prefix + unit + ': ' + (data.currency || symbol) + ' ' + data[unit].toLocaleString('en-US', { maximumFractionDigits: 2 }));
        count++;
      }
    });
    return count;
  }
  var sectors = Array.isArray(record.sectorRates) ? record.sectorRates : [];
  if (sectors.length) {
    lines.push('Rates depend on sector, occupation or location. These are recorded examples, not a single rate for every worker.');
    sectors.forEach(function (sector) {
      lines.push('');
      lines.push(sector.sector + ':');
      if (!addRates(sector, 'Recorded ')) lines.push('No single numeric rate is recorded; review the applicable schedule.');
      if (sector.notes) lines.push('Reference note: ' + sector.notes);
    });
  } else if (!addRates(national, 'Recorded ')) {
    lines.push('No single numeric national rate is available in this reference. This does not establish that no legal minimum applies.');
  }
  if (national.effectiveDate) lines.push('Recorded effective date: ' + national.effectiveDate);
  if (record.lastVerified) lines.push('Dataset verification date: ' + record.lastVerified);
  if (national.notes) lines.push('Basis: ' + national.notes);
  if (national.law) lines.push('Recorded legal reference: ' + national.law);
  (record.sources || []).forEach(function (source) {
    if (typeof source.url === 'string' && /^https:\/\//.test(source.url)) lines.push('Source: ' + source.url);
  });
  lines.push('');
  lines.push('Current-date coverage is not verified. Check the effective period, worker category and official source. Daily or monthly equivalents may use planning assumptions.');
  lines.push('Review the full reference: ' + SITE_URL + '/tools/minimum-wage/');
  lines.push('_Type HELP for more commands_');
  return lines.join('\n');
}

// ── Overtime handler ──────────────────────────────────────────────────────────
function handleOvertime(intent, rawText) {
  var cc = intent.country;
  var gross = intent.salary;
  var otParams = BotEngine.parseOvertimeParams(rawText);

  if (!cc) {
    return (
      '🌍 Which country? Include in your message.\n\n' +
      '*Example:* OT Nigeria 200000 8 hours weekday'
    );
  }
  if (!Number.isFinite(gross) || gross <= 0) {
    return (
      '💰 Include your monthly salary.\n\n' +
      '*Example:* OT ' + countryName(cc) + ' 200000 8 hours weekday'
    );
  }
  if (!Number.isFinite(otParams.hours) || otParams.hours <= 0) {
    return (
      '⏰ How many overtime hours?\n\n' +
      '*Example:* OT ' + countryName(cc) + ' ' + BotEngine.fmtNum(gross) + ' 8 hours weekday'
    );
  }

  var rule = hrRuntime.overtimeRules[cc];
  var category = { weekday: 'weekday', weekend: 'weekend', public_holiday: 'publicHoliday' }[otParams.dayType];
  var aliases = { weekday: ['weekday', 'daytime', 'day'], weekend: ['weekend'], publicHoliday: ['publicHoliday'] };
  var rates = rule && rule.overtimeRate;
  var tiered = rates && Object.keys(rates).some(function (key) { return /first|next|beyond/i.test(key); });
  if (!rates || !category || tiered || !aliases[category].some(function (key) { return Number.isFinite(rates[key]) && rates[key] > 0; })) {
    return 'This country and overtime category are not supported by the WhatsApp estimate. Tiered rates and rest-day eligibility need additional inputs. Review the applicable rules: ' + SITE_URL + '/tools/overtime-calc/';
  }
  var result = hrRuntime.calculateOvertime({ country: cc, monthlySalary: gross, overtimeHours: otParams.hours, dayType: category });
  if (!result || !Number.isFinite(result.overtimePay) || !Number.isFinite(result.hourlyRate) || !Number.isFinite(result.totalPay)) {
    return 'The salary or overtime hours are too large to calculate. Enter smaller positive values.';
  }
  var multiplier = result.otMultiplier;
  var hourlyRate = result.hourlyRate;
  var otPay = result.overtimePay;
  var sym = result.symbol;
  var weeklyHours = result.standardHours.weekly;
  var dayTypeLabel = { weekday: 'Weekday', weekend: 'Weekend', public_holiday: 'Public Holiday' }[otParams.dayType];

  return (
    BotEngine.getFlag(cc) + ' *' + countryName(cc) + ' Overtime Estimate*\n\n' +
    'Monthly salary: ' + sym + BotEngine.fmtNum(gross) + '\n' +
    'Hourly rate: ' + sym + hourlyRate.toFixed(2) + '\n' +
    'Overtime type: ' + dayTypeLabel + ' (' + multiplier + '×)\n' +
    'Hours worked: ' + otParams.hours + ' hrs\n\n' +
    '*Overtime Pay: ' + sym + BotEngine.fmtNum(otPay) + '*\n\n' +
    'Uses the web calculator model: ' + weeklyHours + ' hours/week × 4.33 weeks/month. The multiplier is an unverified reference assumption, not confirmation of your statutory entitlement. Check your contract, eligibility and current official rules.\n\n' +
    '🔗 Detailed calc: ' + SITE_URL + '/tools/overtime-calc/\n\n' +
    '_Type HELP for more commands_'
  );
}

// ── Leave entitlements handler ────────────────────────────────────────────────
function handleLeave(intent) {
  var cc = intent.country;
  if (!cc) {
    return (
      '🌍 Which country? Include in your message.\n\n' +
      '*Examples:*\nLEAVE Nigeria\nmaternity leave Kenya\nleave South Africa'
    );
  }

  var record = hrRuntime.leaveEntitlements[cc];
  if (!record) return 'No leave reference is available for this country. Review the applicable rules: ' + SITE_URL + '/tools/leave-calculator/';
  var lines = [BotEngine.getFlag(cc) + ' *' + countryName(cc) + ' leave reference*'];
  var categories = [['annualLeave', 'Annual leave'], ['sickLeave', 'Sick leave'], ['maternityLeave', 'Maternity leave'], ['paternityLeave', 'Paternity leave'], ['compassionateLeave', 'Compassionate leave'], ['familyResponsibility', 'Family responsibility']];
  categories.forEach(function (category) {
    var data = record[category[0]];
    if (!data) return;
    lines.push('');
    lines.push('*' + category[1] + '*');
    var numeric = false;
    ['days', 'weeks'].forEach(function (unit) {
      if (Number.isFinite(data[unit]) && data[unit] > 0) {
        lines.push('Recorded duration: ' + data[unit] + ' ' + unit);
        numeric = true;
      }
    });
    if (!numeric) lines.push('No positive duration is recorded; check current law and employer policy.');
    [['per', 'Period'], ['accrual', 'Accrual / basis'], ['pay', 'Recorded pay terms'], ['eligibility', 'Eligibility'], ['law', 'Legal reference'], ['notes', 'Reference note']].forEach(function (field) {
      if (data[field[0]]) lines.push(field[1] + ': ' + data[field[0]]);
    });
  });
  if (record.lastVerified) lines.push('Dataset verification date: ' + record.lastVerified);
  lines.push('');
  lines.push('Current-date coverage is not verified. Working and calendar days, service periods and pay conditions differ. Confirm the applicable official rules and your contract.');
  lines.push('Review the full reference: ' + SITE_URL + '/tools/leave-calculator/');
  lines.push('_Type HELP for more commands_');
  return lines.join('\n');
}

// ── Pension / social security handler ─────────────────────────────────────────
function calculateKenyaNssfYear4(monthlyPensionableEarnings) {
  var earnings = Math.max(0, Number(monthlyPensionableEarnings) || 0);
  var capped = Math.min(earnings, 108000);
  var tier1 = Math.min(capped, 9000) * 0.06;
  var tier2 = Math.max(0, capped - 9000) * 0.06;
  return { employee: tier1 + tier2, employer: tier1 + tier2 };
}

function calculateSouthAfricaGepf(monthlyPensionableSalary, servicesMember) {
  var salary = Math.max(0, Number(monthlyPensionableSalary) || 0);
  return { employee: salary * 0.075, employer: salary * (servicesMember ? 0.16 : 0.13) };
}

function handlePension(intent) {
  var cc = intent.country;
  var gross = intent.salary;

  if (!cc) {
    return (
      '🌍 Which country? Include in your message.\n\n' +
      '*Examples:*\nPENSION Nigeria 300000\nNSSF Kenya 120000\nGEPF South Africa 25000'
    );
  }
  if (!Number.isFinite(gross) || gross <= 0) {
    return (
      '💰 Include a positive monthly pensionable salary.\n\n' +
      '*Example:* PENSION ' + countryName(cc) + ' 300000'
    );
  }

  var schemes = {
    NG: { name: 'CPS (Contributory Pension)', ee: 0.08, er: 0.10, body: 'PENCOM', law: 'Pension Reform Act 2014', link: '/tools/ng-pension/' },
    KE: { name: 'NSSF Year 4 (National Social Security Fund)', ee: 0.06, er: 0.06, tiered: true, body: 'NSSF Kenya', law: 'NSSF Act 2013 - Year 4 rates from February 2026', link: '/tools/ke-nssf/' },
    ZA: { name: 'GEPF (Government Employees Pension Fund)', ee: 0.075, er: 0.13, gepf: true, body: 'GEPF', law: 'Government Employees Pension Law and Rules', link: '/tools/za-gepf/' },
    GH: { name: 'SSNIT (Social Security)', ee: 0.055, er: 0.13, body: 'SSNIT', law: 'National Pensions Act 766 (2008)', link: '/tools/gh-ssnit/' },
    TZ: { name: 'NSSF Tanzania', ee: 0.10, er: 0.10, body: 'NSSF Tanzania', law: 'Social Security Regulatory Authority Act 2008', link: '/tools/social-security/' },
    UG: { name: 'NSSF Uganda', ee: 0.05, er: 0.10, body: 'NSSF Uganda', law: 'NSSF Act Cap 222', link: '/tools/social-security/' }
  };

  var s = schemes[cc];
  if (!s) {
    return (
      BotEngine.getFlag(cc) + ' Pension data for ' + countryName(cc) + ' is coming soon.\n' +
      '🔗 Check: ' + SITE_URL + '/tools/social-security/'
    );
  }

  var sym = (BotEngine.CURRENCIES[cc] || {}).symbol || cc + ' ';
  var eeContrib, erContrib;
  if (s.tiered && cc === 'KE') {
    var kenyaNssf = calculateKenyaNssfYear4(gross);
    eeContrib = kenyaNssf.employee;
    erContrib = kenyaNssf.employer;
  } else if (s.gepf && cc === 'ZA') {
    var southAfricaGepf = calculateSouthAfricaGepf(gross, false);
    eeContrib = southAfricaGepf.employee;
    erContrib = southAfricaGepf.employer;
  } else if (s.flat) {
    eeContrib = s.ee;
    erContrib = s.er;
  } else {
    eeContrib = gross * s.ee;
    erContrib = gross * s.er;
  }
  var total = eeContrib + erContrib;
  if (![eeContrib, erContrib, total].every(Number.isFinite)) {
    return 'The contribution inputs are too large to calculate. Check your pensionable earnings.';
  }

  return (
    BotEngine.getFlag(cc) + ' *' + countryName(cc) + ' Pension / Social Security estimate*\n\n' +
    'Scheme: ' + s.name + '\n' +
    'Monthly salary: ' + sym + BotEngine.fmtNum(gross) + '\n\n' +
    '*Contributions:*\n' +
    'Employee: ' + sym + BotEngine.fmtNum(eeContrib) + (s.tiered ? ' (Year 4 tiered rate)' : s.flat ? ' (flat rate)' : ' (' + (s.ee * 100).toFixed(1) + '%)') + '\n' +
    'Employer: ' + sym + BotEngine.fmtNum(erContrib) + (s.tiered ? ' (Year 4 tiered rate)' : s.flat ? ' (flat rate)' : ' (' + (s.er * 100).toFixed(1) + '%)') + '\n' +
    'Total: *' + sym + BotEngine.fmtNum(total) + '*\n\n' +
    (s.tiered ? '_Uses the entered salary as pensionable earnings; confirm the payroll basis._\n\n' : '') +
    (s.gepf ? '_Uses pensionable salary and the 13% other-member employer rate. Services employers contribute 16%; use the full calculator to select that category._\n\n' : '') +
    'Uses entered pay as pensionable earnings. Current-period scheme coverage, thresholds and eligibility are not verified here. Confirm your earnings basis and official scheme rules in the linked tool.\n\n' +
    '🏦 Regulator: ' + s.body + '\n' +
    '📋 Law: ' + s.law + '\n' +
    '🔗 Full calc: ' + SITE_URL + s.link + '\n\n' +
    '_Type HELP for more commands_'
  );
}

// ── Compliance deadline handler ───────────────────────────────────────────────
exports._test = Object.assign(exports._test || {}, { calculateKenyaNssfYear4: calculateKenyaNssfYear4, calculateSouthAfricaGepf: calculateSouthAfricaGepf });

function handleDeadline(intent) {
  var cc = intent.country;
  if (!cc) {
    return (
      '🌍 Which country?\n\n' +
      '*Examples:*\nDEADLINE Nigeria\ndeadlines Kenya\nPAYE deadline Ghana'
    );
  }

  var deadlines = {
    NG: [
      { label: 'PAYE remittance', day: 10, note: '10th of following month' },
      { label: 'Pension (CPS)', day: 7, note: '7 working days after payday' },
      { label: 'NHF remittance', day: 10, note: '10th of following month' },
      { label: 'VAT return', day: 21, note: '21st of following month' }
    ],
    KE: [
      { label: 'PAYE (P9A)', day: 9, note: '9th of following month' },
      { label: 'NSSF contribution', day: 9, note: '9th of following month' },
      { label: 'NHIF contribution', day: 9, note: '9th of following month' },
      { label: 'NITA levy', day: 20, note: '20th of following month' }
    ],
    ZA: [
      { label: 'PAYE (EMP201)', day: 7, note: '7th of following month' },
      { label: 'UIF contribution', day: 7, note: '7th of following month' },
      { label: 'SDL (Skills Levy)', day: 7, note: '7th of following month' },
      { label: 'VAT return (monthly)', day: 25, note: '25th of following month' }
    ],
    GH: [
      { label: 'PAYE (P11D)', day: 15, note: '15th of following month' },
      { label: 'SSNIT contribution', day: 14, note: '14th of following month' },
      { label: 'Withholding tax', day: 15, note: '15th of following month' }
    ]
  };

  var dd = deadlines[cc];
  if (!dd) {
    return (
      BotEngine.getFlag(cc) + ' Deadline data for ' + countryName(cc) + ' is coming soon.\n' +
      '🔗 Check: ' + SITE_URL + '/tools/compliance-calendar/'
    );
  }

  var lines = [
    BotEngine.getFlag(cc) + ' *' + countryName(cc) + ' — Deadline reference rules*',
    ''
  ];

  dd.forEach(function (d) {
    lines.push('📅 *' + d.label + '*');
    lines.push('   Reference rule: ' + d.note);
    if (/payday/i.test(d.note)) lines.push('   Exact date requires your payday and the applicable working-day calendar.');
  });

  lines.push('');
  lines.push('These reference rules have not been verified for the current filing period. Confirm the obligation, reporting period, holiday adjustments and any official extensions.');
  lines.push('🔗 Full calendar: ' + SITE_URL + '/tools/compliance-calendar/');
  lines.push('');
  lines.push('_Type HELP for more commands_');

  return lines.join('\n');
}

// ── Salary benchmark handler ──────────────────────────────────────────────────
async function handleSalaryBenchmark(intent, rawText) {
  var cc = intent.country;

  // Strip command keyword + country from text to get job title
  var jobText = rawText
    .replace(/^salary\s+/i, '')
    .replace(new RegExp(Object.keys(BotEngine.COUNTRIES).join('|'), 'gi'), '')
    .replace(/\s+/g, ' ')
    .trim();

  if (!jobText && !cc) {
    return (
      '📊 What role and country?\n\n' +
      '*Examples:*\nSALARY software engineer Lagos\nsalary nurse Nairobi\nwhat does a data analyst earn in South Africa'
    );
  }

  var locationNote = cc ? (BotEngine.getFlag(cc) + ' ' + countryName(cc)) : '🌍 Africa';

  return (
    '📊 *Salary Benchmark — ' + (jobText || 'your role') + '*\n' +
    '_' + locationNote + '_\n\n' +
    '🔍 For live salary data from our crowdsourced database:\n' +
    '🔗 ' + SITE_URL + '/tools/afrosalary-db/?q=' + encodeURIComponent(jobText || '') + (cc ? '&country=' + cc : '') + '\n\n' +
    '💡 The AfroSalary Database has benchmarks for 500+ roles across 54 countries — contribute your salary and earn AfroPoints.\n\n' +
    '_Type HELP for more commands_'
  );
}

// ── Labour law / natural language handler ──────────────────────────────────────
async function handleLabourLaw(intent, rawText) {
  if (intent.aiConsent !== true) {
    return [
      'Optional AI help: your question and country would be sent to the AfroTools AI service and its configured AI provider.',
      'Do not include names, identity numbers, employer records or other unnecessary personal details.',
      'To agree for one question, send: AI CONSENT: followed by your question.',
      'This agreement applies only to that message. Ordinary messages do not enable AI.',
      'Local alternative: use the calculators and source links at ' + SITE_URL + '/afrowork/',
      'Privacy notice: ' + SITE_URL + '/privacy/'
    ].join('\n\n');
  }

  if (!WA_TOKEN) {
    // Fallback without AI (no token in dev)
    return (
      '⚖️ *Labour Law Question*\n\n' +
      'For a detailed legal answer with citations:\n' +
      '🔗 ' + SITE_URL + '/tools/labour-law-advisor/\n\n' +
      'Ask your question there and get a Claude-powered answer with the exact law reference.\n\n' +
      '_Type HELP for more commands_'
    );
  }

  // Route to ai-advisor function with labour law context
  try {
    var aiRes = await fetch(SITE_URL + '/.netlify/functions/ai-advisor', {
      method: 'POST',
      signal: AbortSignal.timeout(12000),
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tool: 'labour-law-advisor',
        message: rawText,
        country: intent.country,
        channel: 'whatsapp',
        aiConsent: 'accepted',
        aiContentConsent: 'accepted'
      })
    });

    if (!aiRes.ok) throw new Error('AI advisor returned ' + aiRes.status);

    var aiData = await aiRes.json();
    var answer = aiData.reply || aiData.message || '';

    if (!answer) throw new Error('Empty AI response');

    // WhatsApp formatting: trim to ~1500 chars max
    if (answer.length > 1400) {
      answer = answer.slice(0, 1400) + '...\n\n🔗 Full answer: ' + SITE_URL + '/tools/labour-law-advisor/';
    }

    return (
      '⚖️ *Labour Law Answer*\n' +
      (intent.country ? '_' + BotEngine.getFlag(intent.country) + ' ' + countryName(intent.country) + '_\n' : '') +
      '\n' + answer + '\n\n' +
      '_Type HELP for more commands_'
    );
  } catch (err) {
    console.warn('[wa-bot] AI advisor request failed');
    return (
      '⚖️ *Labour Law Advisor*\n\n' +
      'Get a detailed legal answer at:\n' +
      '🔗 ' + SITE_URL + '/tools/labour-law-advisor/\n\n' +
      '_Type HELP for more commands_'
    );
  }
}

// ── Ambiguous / no intent response ───────────────────────────────────────────
function ambiguousResponse() {
  return (
    'I can help! What do you need?\n\n' +
    '1️⃣ Calculate net pay after tax\n' +
    '2️⃣ Check minimum wage for a country\n' +
    '3️⃣ Calculate overtime pay\n' +
    '4️⃣ Check leave entitlements\n' +
    '5️⃣ Ask a labour law question\n\n' +
    'Reply with a number, or ask directly.\n' +
    '_Or type *HELP* for all commands._'
  );
}

// ── Send WhatsApp message via Meta Cloud API ──────────────────────────────────
async function sendWhatsAppMessage(to, text) {
  if (!WA_TOKEN || !WA_PHONE_ID || !WA_API_BASE) {
    throw new Error('WhatsApp delivery is not configured');
  }
  var url = WA_API_BASE + '/' + WA_PHONE_ID + '/messages';
  var res = await fetch(url, {
    method: 'POST',
    signal: AbortSignal.timeout(8000),
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + WA_TOKEN
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: to,
      type: 'text',
      text: { preview_url: false, body: text }
    })
  });
  if (!res.ok) {
    console.error('[wa-bot] Meta API request failed', { status: res.status });
    var rejected = new Error('WhatsApp delivery rejected');
    rejected.deliveryRejected = true;
    throw rejected;
  }
  var accepted = await res.json();
  if (!accepted || !Array.isArray(accepted.messages) || typeof accepted.messages[0]?.id !== 'string' || !accepted.messages[0].id) {
    throw new Error('WhatsApp delivery acknowledgement is uncertain');
  }

}

// ── Log non-identifying operational usage to Supabase ───────────────────────────────────────
async function logUsage(intent, success, responseTimeMs) {
  if (!SUPABASE_KEY) return;
  if (SUPABASE_URL !== 'https://zpclagtgczsygrgztlts.supabase.co') {
    console.warn('[wa-bot] Usage recording project is not configured for AfroTools');
    return;
  }
  // Operational event only: no phone, stable phone hash, message or salary is retained.
  var response = await fetch(SUPABASE_URL + '/rest/v1/wb_usage_log', {
    method: 'POST',
    signal: AbortSignal.timeout(4000),
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: 'Bearer ' + SUPABASE_KEY,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal'
    },
    body: JSON.stringify({
      conversation_id: null,
      intent_type: intent.type,
      country_code: intent.country,
      success: success,
      response_time_ms: responseTimeMs
    })
  });
  if (!response.ok) console.warn('[wa-bot] Usage recording rejected', { status: response.status });
}

// ── Verify Meta webhook signature ──────────────────────────────────────────────
function verifySignature(event) {
  var appSecret = process.env.WHATSAPP_APP_SECRET;
  if (!appSecret) return false;
  var headers = event.headers || {};
  var key = Object.keys(headers).find(function (name) { return name.toLowerCase() === 'x-hub-signature-256'; });
  var sig = key && headers[key];
  if (typeof sig !== 'string' || !/^sha256=[a-f0-9]{64}$/i.test(sig)) return false;
  var expected = crypto.createHmac('sha256', appSecret).update(event.body || '').digest();
  return crypto.timingSafeEqual(Buffer.from(sig.slice(7), 'hex'), expected);
}

// ── Utility: country code → name ──────────────────────────────────────────────
function countryName(code) {
  var names = {
    NG:'Nigeria', KE:'Kenya', ZA:'South Africa', GH:'Ghana', TZ:'Tanzania',
    UG:'Uganda', ET:'Ethiopia', EG:'Egypt', MA:'Morocco', SN:'Senegal',
    CI:'Ivory Coast', CM:'Cameroon', AO:'Angola', MZ:'Mozambique', ZM:'Zambia',
    ZW:'Zimbabwe', RW:'Rwanda', BW:'Botswana', NA:'Namibia', ML:'Mali',
    BF:'Burkina Faso', NE:'Niger', TD:'Chad', SD:'Sudan', SS:'South Sudan',
    SO:'Somalia', ER:'Eritrea', DJ:'Djibouti', MG:'Madagascar', MW:'Malawi',
    MU:'Mauritius', MR:'Mauritania', GN:'Guinea', GW:'Guinea-Bissau',
    GQ:'Equatorial Guinea', GA:'Gabon', CG:'Congo (Republic)', CD:'DR Congo',
    CF:'Central African Republic', BJ:'Benin', TG:'Togo', SL:'Sierra Leone',
    LR:'Liberia', GM:'Gambia', CV:'Cabo Verde', ST:'São Tomé & Príncipe',
    KM:'Comoros', SC:'Seychelles', LS:'Lesotho', SZ:'Eswatini',
    TN:'Tunisia', DZ:'Algeria', LY:'Libya', BI:'Burundi'
  };
  return names[code] || code;
}
