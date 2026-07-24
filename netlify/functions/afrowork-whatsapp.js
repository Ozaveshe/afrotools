/**
 * afrowork-whatsapp.js
 * AfroTools WhatsApp Bot — Meta Cloud API Webhook Handler
 *
 * Handles incoming WhatsApp messages and sends payroll/HR responses.
 *
 * ── Environment variables required (set in Netlify dashboard) ───────────────
 *   WHATSAPP_TOKEN          — Meta Cloud API access token
 *   WHATSAPP_PHONE_ID       — WhatsApp Business phone number ID (not the number itself)
 *   WHATSAPP_VERIFY_TOKEN   — Webhook verification token you chose in Meta dashboard
 *   SUPABASE_DATA_URL       — https://zpclagtgczsygrgztlts.supabase.co
 *   SUPABASE_DATA_SERVICE_ROLE_KEY — service role key for data project
 *
 * ── Meta API Setup (pre-requisites) ─────────────────────────────────────────
 *   1. Meta Business Account verified for AfroTools
 *   2. WhatsApp Business API access approved (apply at developers.facebook.com)
 *   3. Dedicated phone number registered (cannot be an existing WhatsApp number)
 *   4. Webhook URL: https://afrotools.com/.netlify/functions/afrowork-whatsapp
 *   5. Webhook subscribed to: messages, message_deliveries, message_reads
 *
 * ── Supabase schema (run migration once approved) ───────────────────────────
 *   See supabase/migrations/whatsapp-bot.sql
 *
 * ── Supabase schema SQL ──────────────────────────────────────────────────────
 * create table wb_conversations (
 *   id               uuid primary key default gen_random_uuid(),
 *   phone_hash       text not null unique,
 *   country_code     text,
 *   first_message_at timestamptz default now(),
 *   last_message_at  timestamptz default now(),
 *   message_count    integer default 1
 * );
 * create index on wb_conversations(phone_hash);
 *
 * create table wb_usage_log (
 *   id               uuid primary key default gen_random_uuid(),
 *   conversation_id  uuid references wb_conversations(id),
 *   intent_type      text,
 *   country_code     text,
 *   success          boolean default true,
 *   response_time_ms integer,
 *   created_at       timestamptz default now()
 * );
 * create index on wb_usage_log(created_at desc);
 * create index on wb_usage_log(intent_type);
 */

'use strict';

const crypto       = require('crypto');
const payeEngines  = require('./_engines/index');
const BotEngine    = require('../../engines/whatsapp-bot-engine');

// ── Config ───────────────────────────────────────────────────────────────────
const WA_TOKEN        = process.env.WHATSAPP_TOKEN;
const WA_PHONE_ID     = process.env.WHATSAPP_PHONE_ID;
const VERIFY_TOKEN    = process.env.WHATSAPP_VERIFY_TOKEN || 'afrotools-wa-verify';
const SUPABASE_URL    = process.env.SUPABASE_DATA_URL    || 'https://zpclagtgczsygrgztlts.supabase.co';
const SUPABASE_KEY    = process.env.SUPABASE_DATA_SERVICE_ROLE_KEY;
const SITE_URL        = 'https://afrotools.com';
const WA_API_BASE     = 'https://graph.facebook.com/v19.0';

// ── Main handler ─────────────────────────────────────────────────────────────
exports.handler = async function (event) {
  // 1. GET — Meta webhook verification challenge
  if (event.httpMethod === 'GET') {
    var params = event.queryStringParameters || {};
    if (params['hub.verify_token'] === VERIFY_TOKEN) {
      return { statusCode: 200, body: params['hub.challenge'] || '' };
    }
    return { statusCode: 403, body: 'Forbidden' };
  }

  // 2. POST — Incoming message payload
  if (event.httpMethod === 'POST') {
    // Verify Meta webhook signature
    if (!verifySignature(event)) {
      console.warn('[wa-bot] Signature mismatch — ignoring');
      return { statusCode: 200, body: 'OK' }; // Always 200 to Meta
    }

    var body;
    try {
      body = JSON.parse(event.body);
    } catch (e) {
      return { statusCode: 200, body: 'OK' };
    }

    // Extract message from Meta's nested payload
    var entry   = (body.entry  || [])[0];
    var change  = (entry && (entry.changes || [])[0]) || null;
    var value   = change && change.value;
    var message = value  && (value.messages || [])[0];

    // Ignore non-message webhooks (status updates, etc.)
    if (!message || message.type !== 'text') {
      return { statusCode: 200, body: 'OK' };
    }

    var from      = message.from;                   // E.164 phone number
    var msgText   = (message.text && message.text.body || '').trim();
    var startTime = Date.now();

    // 3. Detect intent
    var intent = BotEngine.detectIntent(msgText);

    // 4. Build response
    var responseText;
    var success = true;
    try {
      responseText = await handleIntent(intent, msgText);
    } catch (err) {
      console.error('[wa-bot] handleIntent error:', err.message);
      responseText = '⚠️ Something went wrong. Please try again or type HELP for commands.';
      success = false;
    }

    // 5. Send reply via WhatsApp Cloud API
    await sendWhatsAppMessage(from, responseText);

    // 6. Log usage to Supabase (non-blocking, don't await)
    logUsage(from, intent, success, Date.now() - startTime).catch(function (e) {
      console.warn('[wa-bot] Log failed:', e.message);
    });

    return { statusCode: 200, body: 'OK' };
  }

  return { statusCode: 405, body: 'Method Not Allowed' };
};

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
  var cc = intent.country;
  var gross = intent.salary;

  if (!cc) {
    return (
      '🌍 Which country? Include the country name in your message.\n\n' +
      '*Examples:*\nPAYE Nigeria 450000\nPAYE Kenya 120000\nPAYE Ghana 5000'
    );
  }
  if (!gross || gross <= 0) {
    return (
      '💰 How much is the gross monthly salary?\n\n' +
      '*Example:* PAYE ' + countryName(cc) + ' 300000'
    );
  }

  var engine = payeEngines.get(cc);
  if (!engine) {
    return (
      BotEngine.getFlag(cc) + ' PAYE calculation for ' + countryName(cc) + ' is coming soon.\n\n' +
      '_Try: PAYE Nigeria, Kenya, Ghana, South Africa, or Tanzania._'
    );
  }

  try {
    var result = engine.calculate({ gross: gross, frequency: 'monthly' });
    var sym = (BotEngine.CURRENCIES[cc] || {}).symbol || cc + ' ';

    var lines = [
      BotEngine.getFlag(cc) + ' *' + countryName(cc) + ' PAYE Calculation*',
      'Monthly Gross: ' + sym + BotEngine.fmtNum(gross),
      '',
      '*Deductions:*'
    ];

    var totalDeductions = 0;

    if (result.paye > 0) {
      lines.push('PAYE / Income Tax: ' + sym + BotEngine.fmtNum(result.paye));
      totalDeductions += result.paye;
    }
    if (result.pensionEmployee > 0) {
      lines.push('Pension (employee): ' + sym + BotEngine.fmtNum(result.pensionEmployee));
      totalDeductions += result.pensionEmployee;
    }
    if (result.nhf > 0) {
      lines.push('NHF (2.5%): ' + sym + BotEngine.fmtNum(result.nhf));
      totalDeductions += result.nhf;
    }
    if (result.socialSecurity > 0) {
      lines.push('Social Security: ' + sym + BotEngine.fmtNum(result.socialSecurity));
      totalDeductions += result.socialSecurity;
    }
    if (result.uif > 0) {
      lines.push('UIF (1%): ' + sym + BotEngine.fmtNum(result.uif));
      totalDeductions += result.uif;
    }
    if (totalDeductions > 0) {
      lines.push('Total deductions: ' + sym + BotEngine.fmtNum(totalDeductions));
    }

    var net = gross - totalDeductions;
    var effectiveRate = gross > 0 ? ((result.paye / gross) * 100).toFixed(1) : '0.0';

    lines.push('');
    lines.push('*Net Pay: ' + sym + BotEngine.fmtNum(net) + '*');
    lines.push('Effective tax rate: ' + effectiveRate + '%');
    lines.push('');
    lines.push('🔗 Full breakdown: ' + SITE_URL + '/salary-tax/payroll/');
    lines.push('');
    lines.push('_Type HELP for more commands_');

    return lines.join('\n');
  } catch (err) {
    console.error('[wa-bot] PAYE calc error:', err.message);
    return (
      '⚠️ Could not calculate PAYE for ' + countryName(cc) + ' right now.\n' +
      '🔗 Try the web tool: ' + SITE_URL + '/salary-tax/payroll/'
    );
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

  // Static minimum wage data for top 8 countries
  // TODO: expand via Supabase afrowork_regulatory_changes table
  var data = {
    NG: { monthly: 70000, daily: 3182, hourly: 397, currency: '₦', law: 'National Minimum Wage Act 2019 (amended 2024)', updated: 'Jul 2024' },
    KE: { monthly: 15120, daily: 504, hourly: 63, currency: 'KSh', law: 'Regulation of Wages (General) Order 2022', updated: 'May 2022' },
    ZA: { monthly: 4576, daily: 229, hourly: 28.79, currency: 'R', law: 'National Minimum Wage Act 9 of 2018', updated: 'Mar 2024' },
    GH: { monthly: 1902, daily: 63.4, hourly: 7.93, currency: 'GH₵', law: 'Labour Act 2003 (NLC review)', updated: 'Jan 2024' },
    TZ: { monthly: 80000, daily: 2667, hourly: 333, currency: 'TSh', law: 'Written Laws (Miscellaneous Amendments) Act 2022', updated: 'Jun 2022' },
    UG: { monthly: 136000, daily: 4533, hourly: 567, currency: 'USh', law: 'Employment Act 2006', updated: 'Jan 2020' },
    RW: { monthly: 30000, daily: 1000, hourly: 125, currency: 'RF', law: 'Labour Law No. 66/2018', updated: 'Jan 2019' },
    ET: { monthly: null, daily: null, hourly: null, currency: 'Br', law: 'No statutory minimum wage (Labour Proclamation 1156/2019)', updated: 'N/A', note: 'Ethiopia has no statutory minimum wage. Sector agreements apply.' }
  };

  var d = data[cc];
  if (!d) {
    return (
      BotEngine.getFlag(cc) + ' Minimum wage data for ' + countryName(cc) + ' is coming soon.\n' +
      '🔗 Check: ' + SITE_URL + '/tools/minimum-wage/'
    );
  }

  if (d.note) {
    return (
      BotEngine.getFlag(cc) + ' *' + countryName(cc) + ' Minimum Wage*\n\n' +
      '⚠️ ' + d.note + '\n\n' +
      '📋 Law: ' + d.law + '\n' +
      '🔗 More: ' + SITE_URL + '/tools/minimum-wage/\n\n' +
      '_Type HELP for more commands_'
    );
  }

  return (
    BotEngine.getFlag(cc) + ' *' + countryName(cc) + ' Minimum Wage*\n\n' +
    (d.monthly ? 'Monthly:  *' + d.currency + ' ' + BotEngine.fmtNum(d.monthly) + '*\n' : '') +
    (d.daily   ? 'Daily:    ' + d.currency + ' ' + BotEngine.fmtNum(d.daily) + '\n' : '') +
    (d.hourly  ? 'Hourly:   ' + d.currency + ' ' + d.hourly.toFixed(2) + '\n' : '') +
    '\n📋 Law: ' + d.law +
    '\n🗓️ Updated: ' + d.updated +
    '\n🔗 Full details: ' + SITE_URL + '/tools/minimum-wage/' +
    '\n\n_Type HELP for more commands_'
  );
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
  if (!gross) {
    return (
      '💰 Include your monthly salary.\n\n' +
      '*Example:* OT ' + countryName(cc) + ' 200000 8 hours weekday'
    );
  }
  if (!otParams.hours) {
    return (
      '⏰ How many overtime hours?\n\n' +
      '*Example:* OT ' + countryName(cc) + ' ' + BotEngine.fmtNum(gross) + ' 8 hours weekday'
    );
  }

  // Overtime multipliers by day type and country
  var multipliers = {
    NG: { weekday: 1.25, weekend: 1.5, public_holiday: 2.0 },
    KE: { weekday: 1.5,  weekend: 2.0, public_holiday: 3.0 },
    ZA: { weekday: 1.5,  weekend: 2.0, public_holiday: 2.0 },
    GH: { weekday: 1.5,  weekend: 2.0, public_holiday: 2.5 },
    TZ: { weekday: 1.5,  weekend: 2.0, public_holiday: 2.0 },
    UG: { weekday: 1.5,  weekend: 2.0, public_holiday: 2.0 }
  };

  var countryMultipliers = multipliers[cc] || { weekday: 1.5, weekend: 2.0, public_holiday: 2.0 };
  var multiplier = countryMultipliers[otParams.dayType] || 1.5;
  var sym = (BotEngine.CURRENCIES[cc] || {}).symbol || cc + ' ';

  // Hourly rate (assume 8hr/day × 22 working days)
  var hourlyRate = gross / (8 * 22);
  var otPay = hourlyRate * multiplier * otParams.hours;
  var dayTypeLabel = { weekday: 'Weekday', weekend: 'Weekend', public_holiday: 'Public Holiday' }[otParams.dayType];

  return (
    BotEngine.getFlag(cc) + ' *' + countryName(cc) + ' Overtime Calculation*\n\n' +
    'Monthly salary: ' + sym + BotEngine.fmtNum(gross) + '\n' +
    'Hourly rate: ' + sym + hourlyRate.toFixed(2) + '\n' +
    'Overtime type: ' + dayTypeLabel + ' (' + multiplier + '×)\n' +
    'Hours worked: ' + otParams.hours + ' hrs\n\n' +
    '*Overtime Pay: ' + sym + BotEngine.fmtNum(otPay) + '*\n\n' +
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

  var leave = {
    NG: { annual: 6, sick: 12, maternity: 12, maternityPay: '100%', paternity: 3, law: 'Labour Act Cap L1' },
    KE: { annual: 21, sick: 30, maternity: 13, maternityPay: '100%', paternity: 14, law: 'Employment Act 2007' },
    ZA: { annual: 15, sick: 30, maternity: 16, maternityPay: '0% (UIF claim)', paternity: 10, law: 'Basic Conditions of Employment Act 75 of 1997' },
    GH: { annual: 15, sick: 12, maternity: 12, maternityPay: '100%', paternity: 0, law: 'Labour Act 2003 (Act 651)' },
    TZ: { annual: 28, sick: 126, maternity: 12, maternityPay: '100%', paternity: 3, law: 'Employment and Labour Relations Act 2004' },
    UG: { annual: 21, sick: 30, maternity: 13, maternityPay: '100% for first 3 months', paternity: 4, law: 'Employment Act 2006' },
    RW: { annual: 18, sick: 15, maternity: 12, maternityPay: '100%', paternity: 4, law: 'Labour Law No. 66/2018' }
  };

  var d = leave[cc];
  if (!d) {
    return (
      BotEngine.getFlag(cc) + ' Leave data for ' + countryName(cc) + ' is coming soon.\n' +
      '🔗 Check: ' + SITE_URL + '/tools/leave-calculator/'
    );
  }

  return (
    BotEngine.getFlag(cc) + ' *' + countryName(cc) + ' Leave Entitlements*\n\n' +
    '🌴 Annual leave: *' + d.annual + ' working days*\n' +
    '🤒 Sick leave: ' + d.sick + ' days/year\n' +
    '🤱 Maternity: ' + d.maternity + ' weeks (' + d.maternityPay + ' pay)\n' +
    (d.paternity > 0 ? '👨 Paternity: ' + d.paternity + ' days\n' : '') +
    '\n📋 Law: ' + d.law +
    '\n🔗 Full details: ' + SITE_URL + '/tools/leave-calculator/' +
    '\n\n_Type HELP for more commands_'
  );
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
  if (!gross) {
    return (
      '💰 Include your monthly salary.\n\n' +
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

  return (
    BotEngine.getFlag(cc) + ' *' + countryName(cc) + ' Pension / Social Security*\n\n' +
    'Scheme: ' + s.name + '\n' +
    'Monthly salary: ' + sym + BotEngine.fmtNum(gross) + '\n\n' +
    '*Contributions:*\n' +
    'Employee: ' + sym + BotEngine.fmtNum(eeContrib) + (s.tiered ? ' (Year 4 tiered rate)' : s.flat ? ' (flat rate)' : ' (' + (s.ee * 100).toFixed(1) + '%)') + '\n' +
    'Employer: ' + sym + BotEngine.fmtNum(erContrib) + (s.tiered ? ' (Year 4 tiered rate)' : s.flat ? ' (flat rate)' : ' (' + (s.er * 100).toFixed(1) + '%)') + '\n' +
    'Total: *' + sym + BotEngine.fmtNum(total) + '*\n\n' +
    (s.tiered ? '_Uses the entered salary as pensionable earnings; confirm the payroll basis._\n\n' : '') +
    (s.gepf ? '_Uses pensionable salary and the 13% other-member employer rate. Services employers contribute 16%; use the full calculator to select that category._\n\n' : '') +
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

  var now = new Date();
  var month = now.toLocaleString('en-US', { month: 'long' });

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
    BotEngine.getFlag(cc) + ' *' + countryName(cc) + ' — ' + month + ' Deadlines*',
    ''
  ];

  dd.forEach(function (d) {
    lines.push('📅 *' + d.label + '*');
    lines.push('   Due: ' + month + ' ' + d.day + ' (' + d.note + ')');
  });

  lines.push('');
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
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tool: 'labour-law-advisor',
        message: rawText,
        country: intent.country,
        channel: 'whatsapp'
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
    console.warn('[wa-bot] AI advisor error:', err.message);
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
  if (!WA_TOKEN || !WA_PHONE_ID) {
    console.warn('[wa-bot] WA_TOKEN or WA_PHONE_ID not set — message not sent');
    return;
  }
  var url = WA_API_BASE + '/' + WA_PHONE_ID + '/messages';
  var res = await fetch(url, {
    method: 'POST',
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
    var errBody = await res.text();
    console.error('[wa-bot] Meta API error:', res.status, errBody);
  }
}

// ── Log conversation usage to Supabase ───────────────────────────────────────
async function logUsage(phone, intent, success, responseTimeMs) {
  if (!SUPABASE_KEY) return;

  var phoneHash = crypto.createHash('sha256').update(phone).digest('hex');
  var headers = {
    'apikey': SUPABASE_KEY,
    'Authorization': 'Bearer ' + SUPABASE_KEY,
    'Content-Type': 'application/json',
    'Prefer': 'resolution=merge-duplicates'
  };

  // Upsert conversation record (hash is unique key)
  var convRes = await fetch(SUPABASE_URL + '/rest/v1/wb_conversations', {
    method: 'POST',
    headers: Object.assign({}, headers, { 'Prefer': 'on_conflict=phone_hash' }),
    body: JSON.stringify({
      phone_hash: phoneHash,
      country_code: intent.country,
      last_message_at: new Date().toISOString()
    })
  });

  var convData = await convRes.json();
  var convId = Array.isArray(convData) ? (convData[0] && convData[0].id) : (convData && convData.id);

  // Insert usage log entry
  await fetch(SUPABASE_URL + '/rest/v1/wb_usage_log', {
    method: 'POST',
    headers: headers,
    body: JSON.stringify({
      conversation_id: convId || null,
      intent_type: intent.type,
      country_code: intent.country,
      success: success,
      response_time_ms: responseTimeMs
    })
  });
}

// ── Verify Meta webhook signature ──────────────────────────────────────────────
function verifySignature(event) {
  var appSecret = process.env.WHATSAPP_APP_SECRET;
  if (!appSecret) return true; // Skip in dev/when not configured

  var sig = (event.headers || {})['x-hub-signature-256'] || '';
  if (!sig.startsWith('sha256=')) return false;

  var expected = 'sha256=' + crypto
    .createHmac('sha256', appSecret)
    .update(event.body || '')
    .digest('hex');

  try {
    return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
  } catch (_) {
    return false;
  }
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
