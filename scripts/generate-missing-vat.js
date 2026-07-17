#!/usr/bin/env node
/**
 * Generate missing VAT calculator pages from template
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

// Template: use Sudan's page (18% VAT, simple) as base
const TEMPLATE = fs.readFileSync(path.join(ROOT, 'sudan/sd-vat.html'), 'utf8');

const COUNTRIES = [
  {
    name: 'South Sudan', slug: 'south-sudan', code: 'ss', currency: 'SSP', symbol: 'SSP',
    rate: 18, authority: 'NRA', continent: 'East Africa',
    exemptions: 'Basic food staples, Medical services, Educational materials',
    zeroRated: 'Exports',
    faq: [
      { q: 'What is the South Sudan VAT rate?', a: 'South Sudan applies an 18% standard VAT rate on most goods and services.' },
      { q: 'What is exempt from VAT in South Sudan?', a: 'Basic food staples, medical services, and educational materials are exempt from VAT in South Sudan.' },
      { q: 'Who administers VAT in South Sudan?', a: 'The National Revenue Authority (NRA) administers VAT collection in South Sudan.' }
    ]
  },
  {
    name: 'Libya', slug: 'libya', code: 'ly', currency: 'LYD', symbol: 'LD',
    rate: 0, authority: 'TDA', continent: 'North Africa',
    exemptions: 'N/A — Libya currently has no VAT system',
    zeroRated: 'N/A',
    faq: [
      { q: 'Does Libya have VAT?', a: 'No. Libya does not currently impose a Value Added Tax. Revenue is primarily from oil exports.' },
      { q: 'Is there any sales tax in Libya?', a: 'Libya has no general sales tax or VAT. Some customs duties apply on imports.' },
      { q: 'Will Libya introduce VAT?', a: 'There have been discussions but no VAT has been formally enacted as of 2026.' }
    ]
  },
  {
    name: 'Somalia', slug: 'somalia', code: 'so', currency: 'SOS', symbol: 'Sh',
    rate: 0, authority: 'MoF', continent: 'East Africa',
    exemptions: 'N/A — Somalia currently has no VAT system',
    zeroRated: 'N/A',
    faq: [
      { q: 'Does Somalia have VAT?', a: 'Somalia does not currently impose a formal Value Added Tax. Some regional administrations collect sales taxes.' },
      { q: 'Is there any sales tax in Somalia?', a: 'Mogadishu and some regions collect informal sales taxes, but there is no nationwide VAT.' },
      { q: 'Will Somalia introduce VAT?', a: 'The Federal Government has discussed VAT implementation but no formal system exists as of 2026.' }
    ]
  },
  {
    name: 'Eritrea', slug: 'eritrea', code: 'er', currency: 'ERN', symbol: 'Nfk',
    rate: 0, authority: 'IRD', continent: 'East Africa',
    exemptions: 'N/A — Eritrea uses a sales tax system, not VAT',
    zeroRated: 'N/A',
    faq: [
      { q: 'Does Eritrea have VAT?', a: 'Eritrea does not have a VAT system. It uses a sales tax on selected goods and services at rates of 4-12%.' },
      { q: 'What sales tax does Eritrea charge?', a: 'Eritrea applies a sales tax ranging from 4% to 12% depending on the category of goods or services.' },
      { q: 'Who collects taxes in Eritrea?', a: 'The Inland Revenue Department (IRD) under the Ministry of Finance administers tax collection in Eritrea.' }
    ]
  }
];

COUNTRIES.forEach(c => {
  const dir = path.join(ROOT, c.slug);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  let page = TEMPLATE;

  // Replace Sudan-specific content
  page = page.replace(/Sudan/g, c.name);
  page = page.replace(/sudan/g, c.slug);
  page = page.replace(/sd-vat/g, c.code + '-vat');
  page = page.replace(/\/sd\//g, '/' + c.code + '/');
  page = page.replace(/\/sd"/g, '/' + c.code + '"');
  page = page.replace(/SDG/g, c.currency);
  page = page.replace(/17%/g, c.rate + '%');
  page = page.replace(/17\b/g, String(c.rate));
  page = page.replace(/TCA/g, c.authority);

  // Fix the VAT rate in the calculator JS
  page = page.replace(/vatRate\s*=\s*\d+(\.\d+)?/g, 'vatRate = ' + c.rate);
  page = page.replace(/STANDARD_RATE\s*=\s*\d+(\.\d+)?/g, 'STANDARD_RATE = ' + c.rate);

  const outPath = path.join(dir, c.code + '-vat.html');
  fs.writeFileSync(outPath, page);
  console.log('Created: ' + outPath);
});

console.log('Done! Created ' + COUNTRIES.length + ' VAT pages.');
