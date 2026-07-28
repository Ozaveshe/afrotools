'use strict';

/**
 * English country name -> French name and French locative phrase.
 *
 * The locative form matters: French takes "en Algerie", "au Cameroun",
 * "aux Comores", "a Djibouti". Gluing a preposition onto the name produces
 * wrong grammar, so each row carries the phrase it needs.
 *
 * Extracted from scripts/repair-fr-solar-country-pages.js, which held the only
 * copy, so the French page repairs can share one table.
 */
const COUNTRIES = [
  ["Algeria", "Algérie", "en Algérie"],
  ["Angola", "Angola", "en Angola"],
  ["Benin", "Bénin", "au Bénin"],
  ["Botswana", "Botswana", "au Botswana"],
  ["Burkina Faso", "Burkina Faso", "au Burkina Faso"],
  ["Burundi", "Burundi", "au Burundi"],
  ["Cameroon", "Cameroun", "au Cameroun"],
  ["Cape Verde", "Cap-Vert", "au Cap-Vert"],
  ["Central African Republic", "République centrafricaine", "en République centrafricaine"],
  ["Chad", "Tchad", "au Tchad"],
  ["Comoros", "Comores", "aux Comores"],
  ["Cote d'Ivoire", "Côte d'Ivoire", "en Côte d'Ivoire"],
  ["Cote d’Ivoire", "Côte d’Ivoire", "en Côte d’Ivoire"],
  ["Côte d'Ivoire", "Côte d'Ivoire", "en Côte d'Ivoire"],
  ["DR Congo", "RD Congo", "en RD Congo"],
  ["Djibouti", "Djibouti", "à Djibouti"],
  ["Egypt", "Égypte", "en Égypte"],
  ["Equatorial Guinea", "Guinée équatoriale", "en Guinée équatoriale"],
  ["Eritrea", "Érythrée", "en Érythrée"],
  ["Eswatini", "Eswatini", "en Eswatini"],
  ["Ethiopia", "Éthiopie", "en Éthiopie"],
  ["Gabon", "Gabon", "au Gabon"],
  ["Gambia", "Gambie", "en Gambie"],
  ["Ghana", "Ghana", "au Ghana"],
  ["Guinea", "Guinée", "en Guinée"],
  ["Guinea-Bissau", "Guinée-Bissau", "en Guinée-Bissau"],
  ["Kenya", "Kenya", "au Kenya"],
  ["Lesotho", "Lesotho", "au Lesotho"],
  ["Liberia", "Liberia", "au Liberia"],
  ["Libya", "Libye", "en Libye"],
  ["Madagascar", "Madagascar", "à Madagascar"],
  ["Malawi", "Malawi", "au Malawi"],
  ["Mali", "Mali", "au Mali"],
  ["Mauritania", "Mauritanie", "en Mauritanie"],
  ["Mauritius", "Maurice", "à Maurice"],
  ["Morocco", "Maroc", "au Maroc"],
  ["Mozambique", "Mozambique", "au Mozambique"],
  ["Namibia", "Namibie", "en Namibie"],
  ["Niger", "Niger", "au Niger"],
  ["Nigeria", "Nigeria", "au Nigeria"],
  ["Republic of Congo", "République du Congo", "en République du Congo"],
  ["Rwanda", "Rwanda", "au Rwanda"],
  ["Sao Tome", "São Tomé-et-Príncipe", "à São Tomé-et-Príncipe"],
  ["Sao Tome and Principe", "São Tomé-et-Príncipe", "à São Tomé-et-Príncipe"],
  ["Senegal", "Sénégal", "au Sénégal"],
  ["Seychelles", "Seychelles", "aux Seychelles"],
  ["Sierra Leone", "Sierra Leone", "en Sierra Leone"],
  ["Somalia", "Somalie", "en Somalie"],
  ["South Africa", "Afrique du Sud", "en Afrique du Sud"],
  ["South Sudan", "Soudan du Sud", "au Soudan du Sud"],
  ["Sudan", "Soudan", "au Soudan"],
  ["São Tomé & Príncipe", "São Tomé-et-Príncipe", "à São Tomé-et-Príncipe"],
  ["São Tomé &amp; Príncipe", "São Tomé-et-Príncipe", "à São Tomé-et-Príncipe"],
  ["São Tomé-et-Príncipe and Principe", "São Tomé-et-Príncipe", "à São Tomé-et-Príncipe"],
  ["Sénégal", "Sénégal", "au Sénégal"],
  ["Tanzania", "Tanzanie", "en Tanzanie"],
  ["Togo", "Togo", "au Togo"],
  ["Tunisia", "Tunisie", "en Tunisie"],
  ["Uganda", "Ouganda", "en Ouganda"],
  ["Zambia", "Zambie", "en Zambie"],
  ["Zimbabwe", "Zimbabwe", "au Zimbabwe"]
];

const BY_EN = new Map(COUNTRIES.map(function (row) {
  return [row[0].toLowerCase(), { fr: row[1], loc: row[2] }];
}));

function slugify(value) {
  return String(value).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

// URL slugs the site uses that do not slugify to the table's English name.
const ALIAS = {
  'cabo-verde': 'Cape Verde',
  'cote-divoire': "Cote d'Ivoire",
  'cote-d-ivoire': "Cote d'Ivoire",
  'ivory-coast': "Cote d'Ivoire",
  'congo': 'Republic of Congo',
  'congo-brazzaville': 'Republic of Congo',
  'republic-of-congo': 'Republic of Congo',
  'dr-congo': 'DR Congo',
  'drc': 'DR Congo'
};

/** Look up by English name or by URL slug. Returns null when unknown. */
function frCountry(key) {
  if (!key) return null;
  const direct = BY_EN.get(String(key).toLowerCase());
  if (direct) return direct;
  const slug = slugify(key);
  for (const row of COUNTRIES) {
    if (slugify(row[0]) === slug) return { fr: row[1], loc: row[2] };
  }
  const aliased = ALIAS[slug];
  return aliased ? BY_EN.get(aliased.toLowerCase()) || null : null;
}

module.exports = { COUNTRIES, frCountry };
