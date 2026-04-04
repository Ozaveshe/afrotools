// netlify/functions/afrowork-api.js
// AfroTools Payroll API — B2B computation endpoint
// All 7 routes: paye, social-security, minimum-wage, payslip, overtime, leave, staff-cost
// Auth: Bearer API key via Netlify Blobs store ('payroll-api-keys')
// Rate limit: 100 calls/month (free), tracked in Blobs

'use strict';

const { createHash, randomBytes } = require('crypto');
const { getStore } = require('@netlify/blobs');

// ── PAYE engines index ───────────────────────────────────────────────
const engines = require('./_engines/index.js');

// ── CORS ────────────────────────────────────────────────────────────
const ALLOWED = ['https://afrotools.com', 'https://www.afrotools.com'];
function corsHeaders(event) {
  const origin = event.headers.origin || '';
  return {
    'Access-Control-Allow-Origin': ALLOWED.includes(origin) ? origin : ALLOWED[0],
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json'
  };
}

function json(status, body, hdrs) {
  return { statusCode: status, headers: hdrs, body: JSON.stringify(body) };
}

// ── API key helpers ──────────────────────────────────────────────────
function hashKey(key) {
  return createHash('sha256').update(key).digest('hex');
}

async function validateApiKey(raw) {
  if (!raw || !raw.startsWith('afro_')) return null;
  try {
    const store = getStore('payroll-api-keys');
    const hash = hashKey(raw);
    const data = await store.get(hash, { type: 'json' });
    if (!data || data.active === false) return null;
    return data;
  } catch {
    return null;
  }
}

async function incrementUsage(hash) {
  try {
    const store = getStore('payroll-api-keys');
    const data = await store.get(hash, { type: 'json' });
    if (!data) return;
    const now = new Date();
    const month = now.toISOString().slice(0, 7); // "2026-04"
    if (data.usageMonth !== month) {
      data.callsThisMonth = 0;
      data.usageMonth = month;
    }
    data.callsThisMonth = (data.callsThisMonth || 0) + 1;
    data.lastUsedAt = now.toISOString();
    await store.set(hash, JSON.stringify(data));
  } catch { /* non-fatal */ }
}

// ── Plans ────────────────────────────────────────────────────────────
const PLAN_LIMITS = { free: 100, starter: 5000, growth: 25000, pro: 100000, enterprise: Infinity };

// ── Minimum wage data (current as of 2026) ──────────────────────────
const MINIMUM_WAGE = {
  NG: {
    general:      { hourly: null, monthly: 70000,  currency: 'NGN', effectiveDate: '2024-07-29', law: 'National Minimum Wage Act (Amended 2024)', authority: 'Federal Ministry of Labour' },
  },
  KE: {
    general:      { hourly: 95.17, monthly: 15201,  currency: 'KES', effectiveDate: '2025-05-01', law: 'Regulation of Wages (General) Order', authority: 'Ministry of Labour' },
    domestic:     { hourly: 53.43, monthly: 8548,   currency: 'KES', effectiveDate: '2025-05-01', law: 'Regulation of Wages (Domestic) Order', authority: 'Ministry of Labour' },
  },
  ZA: {
    general:      { hourly: 28.79, monthly: 4984,   currency: 'ZAR', effectiveDate: '2025-03-01', law: 'National Minimum Wage Act 9 of 2018', authority: 'Dept of Employment and Labour' },
    domestic:     { hourly: 28.79, monthly: 4984,   currency: 'ZAR', effectiveDate: '2025-03-01', law: 'National Minimum Wage Act 9 of 2018', authority: 'Dept of Employment and Labour' },
    farm:         { hourly: 28.79, monthly: 4984,   currency: 'ZAR', effectiveDate: '2025-03-01', law: 'National Minimum Wage Act 9 of 2018', authority: 'Dept of Employment and Labour' },
    'expanded-public-works': { hourly: 15.16, monthly: 2628, currency: 'ZAR', effectiveDate: '2025-03-01', law: 'National Minimum Wage Act 9 of 2018', authority: 'Dept of Employment and Labour' },
  },
  GH: {
    general:      { hourly: null,  daily: 18.15, monthly: null, currency: 'GHS', effectiveDate: '2024-01-01', law: 'Labour Act 651 of 2003', authority: 'National Labour Commission' },
  },
  EG: {
    general:      { hourly: null,  monthly: 7000,  currency: 'EGP', effectiveDate: '2024-07-01', law: 'Labour Law No. 12 of 2003', authority: 'Ministry of Manpower' },
  },
  TZ: {
    general:      { hourly: null,  monthly: 400000, currency: 'TZS', effectiveDate: '2023-07-01', law: 'Employment and Labour Relations Act 2004', authority: 'Ministry of Labour' },
    domestic:     { hourly: null,  monthly: 200000, currency: 'TZS', effectiveDate: '2023-07-01', law: 'Employment and Labour Relations Act 2004', authority: 'Ministry of Labour' },
  },
  UG: {
    general:      { hourly: null,  monthly: 200000, currency: 'UGX', effectiveDate: '2022-07-01', law: 'Employment Act 2006', authority: 'Ministry of Gender, Labour and Social Development' },
  },
  RW: {
    general:      { hourly: 100,   monthly: 16000,  currency: 'RWF', effectiveDate: '2022-01-01', law: 'Labour Code of Rwanda', authority: 'Ministry of Public Service and Labour' },
  },
  ET: {
    general:      { hourly: null,  monthly: null, currency: 'ETB', effectiveDate: null, note: 'Ethiopia has no statutory national minimum wage for the private sector.' },
  },
  MA: {
    general:      { hourly: 17.1,  monthly: null, currency: 'MAD', effectiveDate: '2024-07-01', law: 'Labour Code (Code du Travail)', authority: 'Ministry of Labour' },
  },
  SN: {
    general:      { hourly: null,  monthly: 58900, currency: 'XOF', effectiveDate: '2023-01-01', law: 'Labour Code', authority: 'Ministry of Labour' },
  },
  CI: {
    general:      { hourly: 900,   monthly: null, currency: 'XOF', effectiveDate: '2023-01-01', law: "Code du Travail de Côte d'Ivoire", authority: 'Ministry of Labour' },
  },
  CM: {
    general:      { hourly: null,  monthly: 41875, currency: 'XAF', effectiveDate: '2024-07-01', law: 'Labour Code', authority: 'Ministry of Labour' },
  },
  AO: {
    general:      { hourly: null,  monthly: 70000, currency: 'AOA', effectiveDate: '2024-04-01', law: 'Lei Geral do Trabalho', authority: 'Ministry of Public Administration Labour and Social Security' },
  },
  ZM: {
    general:      { hourly: null,  monthly: 1400200, currency: 'ZMW', effectiveDate: '2023-11-01', law: 'Employment Code Act 2019', authority: 'Ministry of Labour' },
  },
  ZW: {
    general:      { hourly: null, monthly: 475,     currency: 'USD', effectiveDate: '2024-01-01', law: 'Labour Act Chapter 28:01', authority: 'Ministry of Public Service, Labour and Social Welfare' },
  },
  MU: {
    general:      { hourly: 85,    monthly: 14250,  currency: 'MUR', effectiveDate: '2024-01-01', law: 'Workers Rights Act 2019', authority: 'Ministry of Labour' },
  },
  BW: {
    general:      { hourly: null,  monthly: 1000,   currency: 'BWP', effectiveDate: '2024-04-01', law: 'Employment Act (Cap 47:01)', authority: 'Ministry of Labour' },
  },
  NA: {
    general:      { hourly: null,  monthly: 1767.45, currency: 'NAD', effectiveDate: '2024-03-01', law: 'Labour Act 11 of 2007', authority: 'Ministry of Labour' },
  },
};

// ── Social security data ─────────────────────────────────────────────
function calcSocialSecurity(country, grossMonthly) {
  country = (country || '').toUpperCase();
  const r = { country, grossMonthly, contributions: [], totalEmployeeDeductions: 0, totalEmployerContributions: 0 };

  if (country === 'NG') {
    // Pension Reform Act 2014: Employee 8%, Employer 10% of monthly emoluments (basic+housing+transport)
    // Approximate pensionable as 70% of gross when not broken down
    const pensionable = grossMonthly * 0.70;
    const emp = Math.round(pensionable * 0.08);
    const er = Math.round(pensionable * 0.10);
    // NHIS: 1.75% employee, 1.75% employer (suspended 2023, shown as voluntary)
    const nsitf = Math.round(grossMonthly * 0.01); // employer only
    r.contributions = [
      { scheme: 'CPS Pension (Employee)', employee: emp, employer: 0, note: '8% of pensionable emoluments' },
      { scheme: 'CPS Pension (Employer)', employee: 0, employer: er, note: '10% of pensionable emoluments' },
      { scheme: 'NSITF', employee: 0, employer: nsitf, note: '1% of gross (employer only)' },
    ];
    r.currency = 'NGN';
    r.totalEmployeeDeductions = emp;
    r.totalEmployerContributions = er + nsitf;
    r.law = 'Pension Reform Act 2014, NSITF Act (Amended 2011)';

  } else if (country === 'KE') {
    // NSSF Tier I: 6% of first KES 9,000; Tier II: 6% of KES 9,001–108,000 (both sides)
    const t1 = Math.min(grossMonthly, 9000) * 0.06;
    const t2 = Math.max(0, Math.min(grossMonthly, 108000) - 9000) * 0.06;
    // SHIF: 2.75% of gross, min 300 (employee only)
    const shif = Math.max(300, grossMonthly * 0.0275);
    // Affordable Housing Levy: 1.5% of gross (both sides)
    const ahl = grossMonthly * 0.015;
    r.contributions = [
      { scheme: 'NSSF Tier I', employee: Math.round(t1), employer: Math.round(t1) },
      { scheme: 'NSSF Tier II', employee: Math.round(t2), employer: Math.round(t2) },
      { scheme: 'SHIF (Social Health Insurance)', employee: Math.round(shif), employer: 0, note: 'min KES 300/month' },
      { scheme: 'Affordable Housing Levy', employee: Math.round(ahl), employer: Math.round(ahl) },
    ];
    r.currency = 'KES';
    r.totalEmployeeDeductions = Math.round(t1 + t2 + shif + ahl);
    r.totalEmployerContributions = Math.round(t1 + t2 + ahl);
    r.law = 'NSSF Act 2013, SHIF Act 2023, Housing Levy Finance Act 2023';

  } else if (country === 'ZA') {
    // UIF: 1% employee + 1% employer, capped at ZAR 17,712/month (ceiling 2024)
    const uifBase = Math.min(grossMonthly, 17712);
    const uifEe = Math.round(uifBase * 0.01);
    const uifEr = Math.round(uifBase * 0.01);
    // Skills Development Levy: 1% employer only
    const sdl = Math.round(grossMonthly * 0.01);
    r.contributions = [
      { scheme: 'UIF (Employee)', employee: uifEe, employer: 0, note: '1% of remuneration, max ZAR 177.12' },
      { scheme: 'UIF (Employer)', employee: 0, employer: uifEr, note: '1% of remuneration, max ZAR 177.12' },
      { scheme: 'Skills Development Levy', employee: 0, employer: sdl, note: '1% of gross (employer only)' },
    ];
    r.currency = 'ZAR';
    r.totalEmployeeDeductions = uifEe;
    r.totalEmployerContributions = uifEr + sdl;
    r.law = 'Unemployment Insurance Act 63 of 2001, Skills Development Levies Act 9 of 1999';

  } else if (country === 'GH') {
    // SSNIT: 5.5% employee + 13% employer (of gross); Tier 3 occupational pension at 5% optional
    const eeSSNIT = Math.round(grossMonthly * 0.055);
    const erSSNIT = Math.round(grossMonthly * 0.13); // 13%: 2.5% NHIS + 10.5% SSNIT
    r.contributions = [
      { scheme: 'SSNIT (Employee Tier 1+2)', employee: eeSSNIT, employer: 0, note: '5.5% of gross' },
      { scheme: 'SSNIT (Employer)', employee: 0, employer: Math.round(grossMonthly * 0.105), note: '10.5% to SSNIT' },
      { scheme: 'NHIS Levy (via Employer)', employee: 0, employer: Math.round(grossMonthly * 0.025), note: '2.5% employer contribution to NHIS' },
    ];
    r.currency = 'GHS';
    r.totalEmployeeDeductions = eeSSNIT;
    r.totalEmployerContributions = erSSNIT;
    r.law = 'National Pensions Act 766 of 2008';

  } else if (country === 'TZ') {
    // NSSF: 10% employee + 10% employer of gross
    const emp = Math.round(grossMonthly * 0.10);
    const er = Math.round(grossMonthly * 0.10);
    r.contributions = [
      { scheme: 'NSSF (Employee)', employee: emp, employer: 0, note: '10% of gross salary' },
      { scheme: 'NSSF (Employer)', employee: 0, employer: er, note: '10% of gross salary' },
    ];
    r.currency = 'TZS';
    r.totalEmployeeDeductions = emp;
    r.totalEmployerContributions = er;
    r.law = 'National Social Security Fund Act 2018';

  } else if (country === 'UG') {
    // NSSF: 5% employee + 10% employer
    const emp = Math.round(grossMonthly * 0.05);
    const er = Math.round(grossMonthly * 0.10);
    r.contributions = [
      { scheme: 'NSSF (Employee)', employee: emp, employer: 0, note: '5% of gross' },
      { scheme: 'NSSF (Employer)', employee: 0, employer: er, note: '10% of gross' },
    ];
    r.currency = 'UGX';
    r.totalEmployeeDeductions = emp;
    r.totalEmployerContributions = er;
    r.law = 'National Social Security Fund Act, Cap 222';

  } else if (country === 'RW') {
    // RSSB Pension: 3% employee + 5% employer; Maternity: 0.3% employer; CBHI: 0% (flat fee)
    const emp = Math.round(grossMonthly * 0.03);
    const er = Math.round(grossMonthly * 0.05);
    const maternity = Math.round(grossMonthly * 0.003);
    r.contributions = [
      { scheme: 'RSSB Pension (Employee)', employee: emp, employer: 0, note: '3% of gross' },
      { scheme: 'RSSB Pension (Employer)', employee: 0, employer: er, note: '5% of gross' },
      { scheme: 'Maternity Leave Fund (Employer)', employee: 0, employer: maternity, note: '0.3% of gross' },
    ];
    r.currency = 'RWF';
    r.totalEmployeeDeductions = emp;
    r.totalEmployerContributions = er + maternity;
    r.law = 'Law No. 45/2010 Establishing Rwanda Social Security Board';

  } else if (country === 'ET') {
    // PFSS: 7% employee + 11% employer
    const emp = Math.round(grossMonthly * 0.07);
    const er = Math.round(grossMonthly * 0.11);
    r.contributions = [
      { scheme: 'PFSS Pension (Employee)', employee: emp, employer: 0, note: '7% of gross' },
      { scheme: 'PFSS Pension (Employer)', employee: 0, employer: er, note: '11% of gross' },
    ];
    r.currency = 'ETB';
    r.totalEmployeeDeductions = emp;
    r.totalEmployerContributions = er;
    r.law = 'Private Organization Employees Pension Proclamation No. 715/2011';

  } else if (country === 'MA') {
    // CNSS: 4.48% employee + 8.98% employer (long-term); AMO health: 2.26% employee + 3.28% employer
    const cnssEe = Math.round(grossMonthly * 0.0448);
    const cnssEr = Math.round(grossMonthly * 0.0898);
    const amoEe = Math.round(grossMonthly * 0.0226);
    const amoEr = Math.round(grossMonthly * 0.0328);
    r.contributions = [
      { scheme: 'CNSS Pension (Employee)', employee: cnssEe, employer: 0, note: '4.48%' },
      { scheme: 'CNSS Pension (Employer)', employee: 0, employer: cnssEr, note: '8.98%' },
      { scheme: 'AMO Health (Employee)', employee: amoEe, employer: 0, note: '2.26%' },
      { scheme: 'AMO Health (Employer)', employee: 0, employer: amoEr, note: '3.28%' },
    ];
    r.currency = 'MAD';
    r.totalEmployeeDeductions = cnssEe + amoEe;
    r.totalEmployerContributions = cnssEr + amoEr;
    r.law = 'Code du Travail Marocain (Dahir No. 1-03-194)';

  } else {
    // Generic: 5% employee + 10% employer (placeholder for unlisted countries)
    const emp = Math.round(grossMonthly * 0.05);
    const er = Math.round(grossMonthly * 0.10);
    r.contributions = [
      { scheme: 'Social Security (Employee)', employee: emp, employer: 0, note: '~5% of gross (estimated)' },
      { scheme: 'Social Security (Employer)', employee: 0, employer: er, note: '~10% of gross (estimated)' },
    ];
    r.currency = null;
    r.totalEmployeeDeductions = emp;
    r.totalEmployerContributions = er;
    r.note = 'Rates estimated. Full calculation for this country coming soon.';
  }

  return r;
}

// ── Leave entitlements ───────────────────────────────────────────────
const LEAVE_DATA = {
  NG: { annualLeaveDays: 6, sickLeaveDays: 12, maternityLeaveDays: 84, maternityPayPct: 100, maternityPaySource: 'employer', paternityLeaveDays: 0, publicHolidays: 12, law: 'Labour Act Cap L1 LFN 2004' },
  KE: { annualLeaveDays: 21, sickLeaveDays: 30, maternityLeaveDays: 91, maternityPayPct: 100, maternityPaySource: 'employer', paternityLeaveDays: 14, publicHolidays: 14, law: 'Employment Act 2007 (Amended 2022)' },
  ZA: { annualLeaveDays: 15, sickLeaveDays: 30, maternityLeaveDays: 120, maternityPayPct: 0, maternityPaySource: 'UIF', paternityLeaveDays: 10, publicHolidays: 12, law: 'Basic Conditions of Employment Act 75 of 1997' },
  GH: { annualLeaveDays: 15, sickLeaveDays: 12, maternityLeaveDays: 84, maternityPayPct: 100, maternityPaySource: 'employer', paternityLeaveDays: 5, publicHolidays: 13, law: 'Labour Act 651 of 2003' },
  TZ: { annualLeaveDays: 28, sickLeaveDays: 126, maternityLeaveDays: 84, maternityPayPct: 100, maternityPaySource: 'employer', paternityLeaveDays: 3, publicHolidays: 16, law: 'Employment and Labour Relations Act 2004' },
  UG: { annualLeaveDays: 21, sickLeaveDays: 21, maternityLeaveDays: 60, maternityPayPct: 100, maternityPaySource: 'employer', paternityLeaveDays: 4, publicHolidays: 14, law: 'Employment Act 2006' },
  RW: { annualLeaveDays: 18, sickLeaveDays: 14, maternityLeaveDays: 84, maternityPayPct: 100, maternityPaySource: 'employer/RSSB', paternityLeaveDays: 4, publicHolidays: 12, law: 'Labour Code 2018' },
  ET: { annualLeaveDays: 14, sickLeaveDays: 45, maternityLeaveDays: 90, maternityPayPct: 100, maternityPaySource: 'employer', paternityLeaveDays: 3, publicHolidays: 13, law: 'Labour Proclamation No. 1156/2019' },
  EG: { annualLeaveDays: 21, sickLeaveDays: 180, maternityLeaveDays: 90, maternityPayPct: 100, maternityPaySource: 'employer', paternityLeaveDays: 0, publicHolidays: 14, law: 'Labour Law No. 12 of 2003' },
  MA: { annualLeaveDays: 18, sickLeaveDays: 26, maternityLeaveDays: 98, maternityPayPct: 100, maternityPaySource: 'CNSS', paternityLeaveDays: 3, publicHolidays: 14, law: "Code du Travail (Dahir No. 1-03-194)" },
  SN: { annualLeaveDays: 24, sickLeaveDays: 6, maternityLeaveDays: 98, maternityPayPct: 100, maternityPaySource: 'employer', paternityLeaveDays: 3, publicHolidays: 14, law: 'Labour Code (Law No. 97-17)' },
  CI: { annualLeaveDays: 26, sickLeaveDays: 6, maternityLeaveDays: 98, maternityPayPct: 100, maternityPaySource: 'employer', paternityLeaveDays: 10, publicHolidays: 14, law: "Code du Travail de Côte d'Ivoire" },
  CM: { annualLeaveDays: 18, sickLeaveDays: 90, maternityLeaveDays: 98, maternityPayPct: 100, maternityPaySource: 'CNPS', paternityLeaveDays: 10, publicHolidays: 14, law: 'Labour Code (Loi No. 92/007)' },
  AO: { annualLeaveDays: 22, sickLeaveDays: 52, maternityLeaveDays: 84, maternityPayPct: 100, maternityPaySource: 'INSS', paternityLeaveDays: 1, publicHolidays: 12, law: 'Lei Geral do Trabalho No. 7/15' },
  MZ: { annualLeaveDays: 21, sickLeaveDays: 30, maternityLeaveDays: 60, maternityPayPct: 100, maternityPaySource: 'employer', paternityLeaveDays: 1, publicHolidays: 11, law: 'Labour Law No. 23/2007' },
  ZM: { annualLeaveDays: 24, sickLeaveDays: 26, maternityLeaveDays: 84, maternityPayPct: 100, maternityPaySource: 'employer', paternityLeaveDays: 5, publicHolidays: 13, law: 'Employment Code Act No. 3 of 2019' },
  ZW: { annualLeaveDays: 30, sickLeaveDays: 90, maternityLeaveDays: 98, maternityPayPct: 80, maternityPaySource: 'NSSA', paternityLeaveDays: 0, publicHolidays: 11, law: 'Labour Act Chapter 28:01' },
  BW: { annualLeaveDays: 15, sickLeaveDays: 0, maternityLeaveDays: 84, maternityPayPct: 25, maternityPaySource: 'employer', paternityLeaveDays: 5, publicHolidays: 12, law: 'Employment Act Cap 47:01' },
  NA: { annualLeaveDays: 24, sickLeaveDays: 30, maternityLeaveDays: 84, maternityPayPct: 100, maternityPaySource: 'employer', paternityLeaveDays: 5, publicHolidays: 12, law: 'Labour Act 11 of 2007' },
  MU: { annualLeaveDays: 20, sickLeaveDays: 21, maternityLeaveDays: 84, maternityPayPct: 100, maternityPaySource: 'employer', paternityLeaveDays: 5, publicHolidays: 15, law: 'Workers Rights Act 2019' },
};

// ── Overtime multipliers by country ─────────────────────────────────
const OT_RULES = {
  NG: { weekday: 1.5, weekend: 2.0, publicHoliday: 2.0, nightShift: 1.25, law: 'Labour Act Cap L1, Section 13' },
  KE: { weekday: 1.5, weekend: 2.0, publicHoliday: 3.0, nightShift: 1.5, law: 'Employment Act 2007, Section 27' },
  ZA: { weekday: 1.5, weekend: 2.0, publicHoliday: 2.0, nightShift: 1.25, law: 'Basic Conditions of Employment Act 75 of 1997, Section 17' },
  GH: { weekday: 1.5, weekend: 2.0, publicHoliday: 2.0, nightShift: 1.25, law: 'Labour Act 651 of 2003, Section 33' },
  TZ: { weekday: 1.5, weekend: 2.0, publicHoliday: 2.0, nightShift: 1.5, law: 'Employment and Labour Relations Act 2004, Section 27' },
  UG: { weekday: 1.5, weekend: 2.0, publicHoliday: 2.0, nightShift: 1.25, law: 'Employment Act 2006, Section 51' },
  RW: { weekday: 1.5, weekend: 2.0, publicHoliday: 2.0, nightShift: 1.3,  law: 'Labour Code 2018, Article 65' },
  ET: { weekday: 1.25, weekend: 2.0, publicHoliday: 2.5, nightShift: 1.25, law: 'Labour Proclamation No. 1156/2019, Article 67' },
  EG: { weekday: 1.35, weekend: 2.0, publicHoliday: 2.0, nightShift: 1.35, law: 'Labour Law No. 12 of 2003, Article 130' },
  MA: { weekday: 1.25, weekend: 1.5, publicHoliday: 2.0, nightShift: 1.25, law: "Code du Travail Article 201" },
};
const OT_DEFAULT = { weekday: 1.5, weekend: 2.0, publicHoliday: 2.0, nightShift: 1.25, law: 'Labour Code' };

// ── Calculations ─────────────────────────────────────────────────────

function calcPAYE(body) {
  const country = (body.country || '').toUpperCase();
  const engine = engines.get(country);
  if (!engine) return { error: `Country '${country}' not supported for PAYE`, supported: engines.listCountries().map(c => c.code) };

  let grossAnnual = body.gross_salary;
  if (body.frequency === 'monthly') grossAnnual = grossAnnual * 12;

  const regime = body.regime || (engine.regimes && engine.regimes[0]) || 'STANDARD';
  const result = engine.calculate({ grossAnnual, regime });

  // Normalise to a consistent API response shape
  return {
    country,
    gross_salary: body.gross_salary,
    frequency: body.frequency || 'annual',
    currency: engine.currency,
    tax_year: 2026,
    regime,
    paye_annual: result.paye || result.annualTax || result.tax,
    paye_monthly: Math.round((result.paye || result.annualTax || result.tax) / 12),
    net_annual: result.netAnnual || result.net,
    net_monthly: Math.round((result.netAnnual || result.net || 0) / 12),
    effective_rate: result.effectiveRate,
    law_reference: engine.source,
    last_updated: engine.lastUpdated,
    _raw: result,
  };
}

function calcSocialSecurityEndpoint(body) {
  const country = (body.country || '').toUpperCase();
  const grossMonthly = body.frequency === 'annual' ? body.gross_salary / 12 : (body.gross_salary || 0);
  return calcSocialSecurity(country, grossMonthly);
}

function calcMinimumWage(body) {
  const country = (body.country || '').toUpperCase();
  const sector = (body.sector || 'general').toLowerCase();
  const data = MINIMUM_WAGE[country];
  if (!data) return { error: `Country '${country}' not in minimum wage database`, note: 'Coverage expanding. Contact support.' };
  const sector_data = data[sector] || data['general'] || Object.values(data)[0];
  if (!sector_data) return { error: `Sector '${sector}' not found for '${country}'` };

  const result = { country, sector, ...sector_data };

  // Compliance check if proposed salary provided
  if (body.proposed_salary != null && sector_data.monthly) {
    const ref = body.proposed_salary;
    result.proposed_salary = ref;
    result.is_compliant = ref >= sector_data.monthly;
    result.margin = Math.round(ref - sector_data.monthly);
    result.margin_pct = +(( (ref - sector_data.monthly) / sector_data.monthly)).toFixed(4);
  } else {
    result.is_compliant = null;
  }

  return result;
}

function calcPayslip(body) {
  const country = (body.country || '').toUpperCase();
  const earnings = body.earnings || {};
  const basic = earnings.basic || 0;
  const housing = earnings.housing || 0;
  const transport = earnings.transport || 0;
  const other = earnings.other || 0;
  const grossMonthly = basic + housing + transport + other;
  const grossAnnual = grossMonthly * 12;

  const engine = engines.get(country);
  let paye_monthly = 0;
  let payeRaw = {};
  if (engine) {
    const r = engine.calculate({ grossAnnual });
    paye_monthly = Math.round((r.paye || r.annualTax || r.tax || 0) / 12);
    payeRaw = r;
  }

  const ss = calcSocialSecurity(country, grossMonthly);
  const eeDeductions = ss.totalEmployeeDeductions || 0;
  const erContributions = ss.totalEmployerContributions || 0;

  const totalDeductions = paye_monthly + eeDeductions;
  const netPay = grossMonthly - totalDeductions;

  const period = body.period || {};
  const monthNames = ['', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const periodLabel = period.month ? `${monthNames[period.month] || period.month} ${period.year || 2026}` : 'Current Period';

  return {
    country,
    period: periodLabel,
    employee: body.employee || {},
    earnings: { basic, housing, transport, other, gross: grossMonthly },
    deductions: {
      paye: paye_monthly,
      social_security: eeDeductions,
      total: totalDeductions,
      breakdown: ss.contributions.filter(c => c.employee > 0).map(c => ({ scheme: c.scheme, amount: c.employee })),
    },
    employer_contributions: {
      total: erContributions,
      breakdown: ss.contributions.filter(c => c.employer > 0).map(c => ({ scheme: c.scheme, amount: c.employer })),
    },
    net_pay: Math.round(netPay),
    currency: engine ? engine.currency : ss.currency,
  };
}

function calcOvertime(body) {
  const country = (body.country || '').toUpperCase();
  const monthlyGross = body.monthly_salary || 0;
  const hours = body.overtime_hours || 0;
  const dayType = (body.day_type || 'weekday').toLowerCase().replace(/-/g, '');
  const rules = OT_RULES[country] || OT_DEFAULT;

  // Working hours: standard is 8hrs/day × 5 days × 4.33 weeks = 173.33 hrs/month
  const hoursPerMonth = body.working_hours_per_month || 173.33;
  const baseHourly = monthlyGross / hoursPerMonth;

  let multiplier = rules.weekday;
  let multiplierLabel = 'Standard Overtime';
  if (dayType === 'weekend')          { multiplier = rules.weekend;       multiplierLabel = 'Weekend Premium'; }
  else if (dayType === 'publicholiday') { multiplier = rules.publicHoliday; multiplierLabel = 'Public Holiday'; }
  else if (dayType === 'nightshift')  { multiplier = rules.nightShift;    multiplierLabel = 'Night Shift'; }

  const overtimePay = baseHourly * multiplier * hours;

  return {
    country,
    monthly_salary: monthlyGross,
    overtime_hours: hours,
    day_type: body.day_type || 'weekday',
    base_hourly_rate: +baseHourly.toFixed(2),
    multiplier,
    multiplier_label: multiplierLabel,
    overtime_pay: +overtimePay.toFixed(2),
    total_monthly_pay: +(monthlyGross + overtimePay).toFixed(2),
    law_reference: rules.law,
  };
}

function calcLeave(body) {
  const country = (body.country || '').toUpperCase();
  const data = LEAVE_DATA[country];
  if (!data) return { error: `Country '${country}' not in leave database`, note: 'Coverage expanding.' };
  return { country, ...data, totalDaysOffPerYear: data.annualLeaveDays + data.publicHolidays };
}

function calcStaffCost(body) {
  const country = (body.country || '').toUpperCase();
  const grossMonthly = body.frequency === 'annual' ? body.gross_salary / 12 : (body.gross_salary || 0);
  const ss = calcSocialSecurity(country, grossMonthly);
  const erContributions = ss.totalEmployerContributions || 0;
  const totalMonthly = grossMonthly + erContributions;

  return {
    country,
    gross_monthly: grossMonthly,
    employer_contributions: erContributions,
    employer_breakdown: ss.contributions.filter(c => c.employer > 0).map(c => ({ scheme: c.scheme, amount: c.employer })),
    total_monthly_cost: Math.round(totalMonthly),
    cost_premium_pct: +( erContributions / grossMonthly ).toFixed(4),
    currency: ss.currency,
    note: 'Does not include PAYE withheld from employee (employer cash flow item only)',
  };
}

// ── Main handler ─────────────────────────────────────────────────────
exports.handler = async (event) => {
  const hdrs = corsHeaders(event);

  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: hdrs };

  // ── API key auth ────────────────────────────────────────────────
  const authHeader = event.headers['authorization'] || '';
  const rawKey = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;

  if (!rawKey) return json(401, { error: 'Missing API key. Set Authorization: Bearer afro_...', docs: 'https://afrotools.com/afrowork/api/' }, hdrs);

  const keyData = await validateApiKey(rawKey);
  if (!keyData) return json(401, { error: 'Invalid or revoked API key', docs: 'https://afrotools.com/afrowork/api/' }, hdrs);

  // ── Rate limit ──────────────────────────────────────────────────
  const plan = keyData.plan || 'free';
  const limit = PLAN_LIMITS[plan] || 100;
  const now = new Date();
  const thisMonth = now.toISOString().slice(0, 7);

  let callsThisMonth = (keyData.usageMonth === thisMonth) ? (keyData.callsThisMonth || 0) : 0;
  if (callsThisMonth >= limit) {
    return json(429, {
      error: 'Monthly rate limit exceeded',
      plan, limit, calls_used: callsThisMonth,
      resets: new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString(),
      upgrade: 'https://afrotools.com/afrowork/api/#pricing',
    }, { ...hdrs, 'X-RateLimit-Limit': limit, 'X-RateLimit-Remaining': 0 });
  }

  // ── Route ───────────────────────────────────────────────────────
  const path = event.path || '';
  const route = path.split('/v1/payroll/').pop().split('?')[0].replace(/\/$/, '');

  if (event.httpMethod !== 'POST') return json(405, { error: 'Use POST', allowed: 'POST' }, hdrs);

  let body;
  try { body = JSON.parse(event.body || '{}'); } catch { return json(400, { error: 'Invalid JSON body' }, hdrs); }

  const ROUTES = {
    'paye': calcPAYE,
    'social-security': calcSocialSecurityEndpoint,
    'minimum-wage': calcMinimumWage,
    'payslip': calcPayslip,
    'overtime': calcOvertime,
    'leave': calcLeave,
    'staff-cost': calcStaffCost,
  };

  if (!ROUTES[route]) {
    return json(404, {
      error: `Unknown route '${route}'`,
      available_routes: Object.keys(ROUTES).map(r => `POST /v1/payroll/${r}`),
    }, hdrs);
  }

  let result;
  try {
    result = ROUTES[route](body);
  } catch (err) {
    console.error(`[afrowork-api] Route ${route} error:`, err.message);
    return json(500, { error: 'Calculation error', message: err.message }, hdrs);
  }

  if (result && result.error) {
    return json(400, result, { ...hdrs, 'X-RateLimit-Remaining': limit - callsThisMonth });
  }

  // ── Log usage (async, non-blocking) ────────────────────────────
  const keyHash = hashKey(rawKey);
  incrementUsage(keyHash).catch(() => {});

  return json(200, {
    ...result,
    _meta: {
      route: `/v1/payroll/${route}`,
      plan,
      calls_used: callsThisMonth + 1,
      calls_remaining: limit - callsThisMonth - 1,
      resets: new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString().slice(0, 10),
    }
  }, {
    ...hdrs,
    'X-RateLimit-Limit': limit,
    'X-RateLimit-Remaining': limit - callsThisMonth - 1,
  });
};

// ── Key generation helper (called from /afrowork/api/ page) ─────────
// Also exported for use by a separate key-management function if needed
exports.generateApiKey = function() {
  return 'afro_' + randomBytes(24).toString('hex');
};
exports.hashKey = hashKey;
