#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const WRITE = process.argv.includes('--write');

const ROUTES = [
  ['ride-fare', 'sw/zana/nauli-za-ride-hailing/index.html', 'rideFare'],
  ['boda-income', 'sw/zana/mapato-ya-boda-boda/index.html', 'bodaIncome'],
  ['matatu-fare', 'sw/zana/nauli-za-matatu-danfo-trotro/index.html', 'matatuFare'],
  ['delivery-cost', 'sw/zana/gharama-ya-delivery/index.html', 'deliveryCost'],
  ['car-loan-vs-cash', 'sw/zana/mkopo-wa-gari-dhidi-ya-fedha-taslimu/index.html', 'loanVsCash'],
  ['vehicle-registration', 'sw/zana/usajili-na-nyaraka-za-gari/index.html', 'vehicleRegistration'],
  ['roadworthiness', 'sw/zana/ukaguzi-wa-roadworthiness/index.html', 'roadworthiness'],
  ['vehicle-depreciation', 'sw/zana/kushuka-thamani-ya-gari/index.html', 'vehicleDepreciation'],
  ['last-mile-delivery', 'sw/zana/gharama-last-mile-delivery/index.html', 'lastMileDelivery'],
  ['parking-fee', 'sw/zana/ada-za-maegesho/index.html', 'parkingFee'],
  ['route-cost', 'sw/zana/gharama-njia-za-logistics/index.html', 'routeCost'],
  ['toll-calc', 'sw/zana/ada-za-toll/index.html', 'tollCalc'],
  ['vehicle-tracker-roi', 'sw/zana/faida-ya-tracker-ya-gari/index.html', 'trackerRoi']
];

const TRANSLATIONS = [
  ['Requires JavaScript', 'Inahitaji JavaScript'],
  ['daily, kila mwezi na kila mwaka', 'kila siku, kila mwezi na kila mwaka'],
  ['CBD, suburb, mall au airport', 'katikati ya jiji, nje ya katikati, kituo cha biashara au uwanja wa ndege'],
  ['Hours kwa siku', 'Saa kwa siku'],
  ['Penalties/extra fees', 'Adhabu na ada za ziada'],
  ['Vehicle class', 'Daraja la gari'],
  ['Number of toll (ada ya barabara) points', 'Idadi ya vituo vya ada ya barabara'],
  ['Average fee per toll (ada ya barabara)', 'Ada ya wastani kwa kila kituo'],
  ['Trips per month', 'Safari kwa mwezi'],
  ['Return multiplier', 'Kizidishi cha kwenda na kurudi'],
  ['E-tag/discount (%)', 'Punguzo la lebo ya kielektroniki (%)'],
  ['tracker (kifuatiliaji cha GPS) installation cost', 'Gharama ya kufunga kifuatiliaji cha GPS'],
  ['kila mwezi subscription', 'Ada ya usajili wa kila mwezi'],
  ['bima discount per year', 'Punguzo la bima kwa mwaka'],
  ['Dereva/crew cost', 'Gharama ya dereva na wafanyakazi'],
  ['Maintenance allocation', 'Bajeti ya matengenezo'],
  ['Vehicle', 'Chombo cha usafiri'],
  ['Distance (km)', 'Umbali (km)'],
  ['Base fee', 'Ada ya kuanzia'],
  ['Platform/commission (%)', 'Ada ya jukwaa au kamisheni (%)'],
  ['Maintenance kwa siku', 'Matengenezo kwa siku'],
  ['Base nauli', 'Nauli ya kuanzia'],
  ['Nunua kwa cash au finance', 'Nunua kwa pesa taslimu au mkopo'],
  ['Return ya pesa ikibaki (%)', 'Faida ya pesa ikibaki (%)'],
  ['Ada ya inspection rasmi', 'Ada ya ukaguzi rasmi'],
  ['Tyres zina tread ya kutosha', 'Matairi yana kina salama cha michoro'],
  ['Emissions/smoke imekaguliwa', 'Moshi na hewa chafu vimekaguliwa'],
  ['Plates/card/document fees', 'Ada za namba, kadi na nyaraka'],
  ['Badilisha assumptions kulingana na route, fuel price, nukuu ya bei, daraja la gari, operator au nyaraka zako.', 'Badilisha makadirio kulingana na njia, bei ya mafuta, nukuu ya bei, daraja la gari, mtoa huduma au nyaraka zako.'],
  ['Badilisha assumptions kulingana na route, fuel price, quote, vehicle class, operator au documents zako.', 'Badilisha makadirio kulingana na njia, bei ya mafuta, nukuu ya bei, daraja la gari, mtoa huduma au nyaraka zako.'],
  ['Badilisha assumptions kulingana na route, bei ya mafuta, quote, aina ya gari, operator au documents zako.', 'Badilisha makadirio kulingana na njia, bei ya mafuta, nukuu ya bei, aina ya gari, mtoa huduma au nyaraka zako.'],
  ['Badilisha assumptions kulingana na route, bei ya mafuta, nukuu ya bei, daraja la gari, operator au nyaraka zako.', 'Badilisha makadirio kulingana na njia, bei ya mafuta, nukuu ya bei, daraja la gari, mtoa huduma au nyaraka zako.'],
  ['Magari, mafuta, routes, fleet (kundi la magari ya kazi) na logistics.', 'Magari, mafuta, njia, kundi la magari ya kazi na usafirishaji.'],
  ['Magari, mafuta, routes, fleet na logistics.', 'Magari, mafuta, njia, kundi la magari ya kazi na usafirishaji.'],
  ['Safari, consumption, toll (ada ya barabara) na cost sharing.', 'Safari, matumizi ya mafuta, ada ya barabara na kugawana gharama.'],
  ['Safari, consumption, toll na cost sharing.', 'Safari, matumizi ya mafuta, ada ya barabara na kugawana gharama.'],
  ['Net income baada ya fuel na owner payment.', 'Mapato halisi baada ya mafuta na malipo ya mmiliki.'],
  ['Cost per kifurushi kwa delivery (ufikishaji).', 'Gharama kwa kifurushi kwa ufikishaji.'],
  ['Cost per package kwa delivery.', 'Gharama kwa kifurushi kwa ufikishaji.'],
  ['Cost per kifurushi kwa ufikishaji.', 'Gharama kwa kifurushi kwa ufikishaji.'],
  ['Forodha, shipping, landed cost na trade finance.', 'Forodha, usafirishaji, gharama iliyofika na ufadhili wa biashara.'],
  ['Forodha, usafirishaji, landed cost na trade finance.', 'Forodha, usafirishaji, gharama iliyofika na ufadhili wa biashara.'],
  ['Landed cost kutoka FOB hadi ghala.', 'Gharama iliyofika kutoka FOB hadi ghala.']
];

function build(html, id, kind) {
  let output = html.replace(/<body([^>]*)>/i, (match, attrs) => {
    const clean = attrs
      .replace(/\sdata-sw-transport-owner=["'][^"']*["']/i, '')
      .replace(/\sdata-sw-transport-kind=["'][^"']*["']/i, '');
    return `<body${clean} data-sw-transport-owner="${id}" data-sw-transport-kind="${kind}">`;
  });
  output = output.replace(/onclick=["']swtCalc\([^)]*\)["']/i, `onclick="swtCalc('${kind}')"`);
  output = output.replaceAll('https://afrotools.com/assets/img/og-default.png', `https://afrotools.com/assets/img/tools/${id}.webp`);
  for (const [english, swahili] of TRANSLATIONS) output = output.replaceAll(english, swahili);
  output = output.replace(/<script>\s*var SWT_SYMBOLS=[\s\S]*?<\/script>\s*/i, '');
  const tags = '<script src="/assets/js/engines/sw-transport-planning-engine.js" defer></script>\n' +
    '<script src="/assets/js/pages/sw-transport-remaining-controller.js" defer></script>\n';
  if (!output.includes('/assets/js/engines/sw-transport-planning-engine.js')) {
    output = output.replace(/(<script[^>]+lazy-analytics\.js[^>]*><\/script>)/i, `${tags}$1`);
  }
  return output;
}

let stale = 0;
for (const [id, relative, kind] of ROUTES) {
  const file = path.join(ROOT, relative);
  const current = fs.readFileSync(file, 'utf8');
  const expected = build(current, id, kind);
  if (expected !== current) {
    stale += 1;
    if (WRITE) fs.writeFileSync(file, expected, 'utf8');
  }
}

if (!WRITE && stale) {
  console.error(`${stale} Swahili transport owners are stale. Run this script with --write.`);
  process.exitCode = 1;
} else {
  console.log(`Swahili transport remaining owners ${WRITE ? 'generated' : 'verified'}: ${ROUTES.length}/13.`);
}

module.exports = { ROUTES, build };
