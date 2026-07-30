'use strict';

const VERIFIED_EXISTING_ALTERNATES = Object.freeze({
  'crop-yield-estimator': [{ hreflang: 'sw', route: '/sw/zana/makisio-ya-mavuno/' }],
  'crop-yield-burundi': [{ hreflang: 'sw', route: '/sw/kilimo/mavuno/burundi/' }],
  'crop-yield-kenya': [{ hreflang: 'sw', route: '/sw/kilimo/mavuno/kenya/' }],
  'crop-yield-rwanda': [{ hreflang: 'sw', route: '/sw/kilimo/mavuno/rwanda/' }],
  'crop-yield-tanzania': [{ hreflang: 'sw', route: '/sw/kilimo/mavuno/tanzania/' }],
  'crop-yield-uganda': [{ hreflang: 'sw', route: '/sw/kilimo/mavuno/uganda/' }],
  'crop-yield-nigeria': [{ hreflang: 'ha', route: '/ha/noma/amfanin-gona-najeriya/' }],
  'fertilizer-calculator': [{ hreflang: 'sw', route: '/sw/zana/kikokotoo-mbolea/' }],
  'fertilizer-burundi': [{ hreflang: 'sw', route: '/sw/kilimo/mbolea/burundi/' }],
  'fertilizer-kenya': [{ hreflang: 'sw', route: '/sw/kilimo/mbolea/kenya/' }],
  'fertilizer-rwanda': [{ hreflang: 'sw', route: '/sw/kilimo/mbolea/rwanda/' }],
  'fertilizer-tanzania': [{ hreflang: 'sw', route: '/sw/kilimo/mbolea/tanzania/' }],
  'fertilizer-uganda': [{ hreflang: 'sw', route: '/sw/kilimo/mbolea/uganda/' }],
  'fertilizer-nigeria': [{ hreflang: 'ha', route: '/ha/noma/taki-najeriya/' }],
  'irrigation-calculator': [{ hreflang: 'sw', route: '/sw/zana/kikokotoo-umwagiliaji/' }],
  'irrigation-burundi': [{ hreflang: 'sw', route: '/sw/kilimo/umwagiliaji/burundi/' }],
  'irrigation-kenya': [{ hreflang: 'sw', route: '/sw/kilimo/umwagiliaji/kenya/' }],
  'irrigation-rwanda': [{ hreflang: 'sw', route: '/sw/kilimo/umwagiliaji/rwanda/' }],
  'irrigation-tanzania': [{ hreflang: 'sw', route: '/sw/kilimo/umwagiliaji/tanzania/' }],
  'irrigation-uganda': [{ hreflang: 'sw', route: '/sw/kilimo/umwagiliaji/uganda/' }],
  'irrigation-nigeria': [{ hreflang: 'ha', route: '/ha/noma/ban-ruwa-najeriya/' }],
  'farm-profit-calculator': [{ hreflang: 'sw', route: '/sw/zana/faida-na-hasara-ya-shamba/' }],
  'farm-profit-nigeria': [{ hreflang: 'ha', route: '/ha/kayan-aiki/ribar-gona/' }],
  'seed-rate-calculator': [{ hreflang: 'sw', route: '/sw/zana/kikokotoo-idadi-ya-mbegu/' }],
  'seed-rate-ng': [{ hreflang: 'ha', route: '/ha/noma/yawan-iri-najeriya/' }],
  'fish-farming-roi': [{ hreflang: 'sw', route: '/sw/zana/faida-ya-ufugaji-samaki/' }],
  'fish-farming-nigeria': [{ hreflang: 'ha', route: '/ha/kayan-aiki/ribar-kiwon-kifi/' }],
  'cassava-processing-calculator': [{ hreflang: 'sw', route: '/sw/zana/faida-ya-usindikaji-mihogo/' }],
  'cassava-processing-nigeria': [{ hreflang: 'ha', route: '/ha/kayan-aiki/sarrafa-rogo/' }],
  'greenhouse-cost-estimator': [{ hreflang: 'sw', route: '/sw/zana/gharama-za-greenhouse/' }],
  'livestock-feed-calculator': [{ hreflang: 'sw', route: '/sw/zana/kikokotoo-chakula-cha-mifugo/' }],
  'livestock-feed-nigeria': [{ hreflang: 'ha', route: '/ha/kayan-aiki/abincin-dabbobi/' }],
  'farm-loans-hub': [{ hreflang: 'sw', route: '/sw/zana/ustahiki-wa-mkopo-wa-shamba/' }],
  'farm-payroll-calculator': [{ hreflang: 'sw', route: '/sw/zana/mishahara-ya-wafanyakazi-wa-shamba/' }],
  'input-prices': [{ hreflang: 'sw', route: '/sw/zana/kilinganisha-bei-za-pembejeo/' }],
  'commodity-prices': [{ hreflang: 'ha', route: '/ha/kayan-aiki/farashin-kayayyakin-gona/' }],
  'poultry-roi-calculator': [{ hreflang: 'sw', route: '/sw/zana/faida-ya-ufugaji-kuku/' }],
  'export-docs': [{ hreflang: 'sw', route: '/sw/zana/nyaraka-za-usafirishaji-mazao/' }],
  'harvest-date-estimator': [{ hreflang: 'sw', route: '/sw/zana/makisio-tarehe-ya-mavuno/' }],
  'planting-calendar': [
    { hreflang: 'sw', route: '/sw/zana/kalenda-ya-kupanda-mazao/' },
    { hreflang: 'ha', route: '/ha/noma/kalandar-shuka/' },
  ],
  'agric-profit': [{ hreflang: 'sw', route: '/sw/zana/faida-ya-kilimo/' }],
  'crop-yield': [{ hreflang: 'sw', route: '/sw/zana/mavuno-ya-mazao/' }],
});

function alternateEntries(row) {
  return [
    { hreflang: 'en', route: row.english.route },
    { hreflang: 'fr', route: row.french.route },
    ...(VERIFIED_EXISTING_ALTERNATES[row.english.id] || []),
    { hreflang: 'x-default', route: row.english.route },
  ];
}

function desiredBlock(row) {
  return alternateEntries(row)
    .map(({ hreflang, route }) => (
      `<link rel="alternate" hreflang="${hreflang}" href="https://afrotools.com${route}">`
    ))
    .join('\n');
}

function synchronizeHtml(html, row) {
  const block = desiredBlock(row);
  const alternatePattern = /(?:[ \t]*<link rel="alternate" hreflang="[^"]+" href="[^"]+">[ \t]*\r?\n?)+/;
  const match = html.match(alternatePattern);
  if (!match) throw new Error(`No hreflang block found in ${row.english.file || row.english.route}.`);
  const current = match[0].trim();
  if (current === block) return html;
  return html.replace(alternatePattern, `${block}\n`);
}

module.exports = {
  VERIFIED_EXISTING_ALTERNATES,
  alternateEntries,
  desiredBlock,
  synchronizeHtml,
};
