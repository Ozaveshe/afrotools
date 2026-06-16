const fs = require('fs');
const path = require('path');
const vm = require('vm');

const repoRoot = path.resolve(__dirname, '..');
const registryPath = path.join(repoRoot, 'assets/js/components/tool-registry.js');

const SINGLETON_ROUTES = [
  { route: '/fr/tools/afroatlas', source: 'tools/afroatlas' },
  { route: '/fr/tools/afrocuisine', source: 'tools/afrokitchen' },
  { route: '/fr/tools/afroprix', source: 'tools/afroprices' },
  { route: '/fr/tools/ajo-chama', source: 'tools/ajo-chama' },
  { route: '/fr/tools/calculateur-dime', source: 'tools/tithe-calculator' },
  { route: '/fr/tools/calculateur-engrais', source: 'tools/fertilizer-calc' },
  { route: '/fr/tools/calculateur-lobola', source: 'tools/lobola-calculator' },
  { route: '/fr/tools/calculateur-offrande', source: 'tools/tithe-offering-calculator' },
  { route: '/fr/tools/calendrier-semis', source: 'tools/planting-calendar' },
  { route: '/fr/tools/carte-conflits-afrique', source: 'tools/africa-conflict' },
  { route: '/fr/tools/chiffres-arabes', source: 'tools/arabic-numerals' },
  { route: '/fr/tools/conseiller-dot', source: 'tools/brideprice-advisor' },
  { route: '/fr/tools/generateur-boq', source: 'tools/boq-generator' },
  { route: '/fr/tools/generateur-degrade-css', source: 'tools/css-gradient' },
  { route: '/fr/tools/generateur-favicon', source: 'tools/favicon-generator' },
  { route: '/fr/tools/generateur-hash', source: 'tools/hash-generator' },
  { route: '/fr/tools/generateur-htaccess', source: 'tools/htaccess-gen' },
  { route: '/fr/tools/generateur-memes', source: 'tools/meme-generator' },
  { route: '/fr/tools/generateur-meta', source: 'tools/meta-tag-gen' },
  { route: '/fr/tools/generateur-meta-tags', source: 'tools/meta-tag-generator' },
  { route: '/fr/tools/generateur-qr', source: 'tools/qr-generator' },
  { route: '/fr/tools/generateur-recu', source: 'tools/receipt-generator' },
  { route: '/fr/tools/interet-tontine', source: 'tools/ajo-interest' },
  { route: '/fr/tools/jours-marche', source: 'tools/market-days' },
  { route: '/fr/tools/ke-plus-value', source: 'tools/ke-cgt' },
  { route: '/fr/tools/lien-whatsapp', source: 'tools/whatsapp-link' },
  { route: '/fr/tools/naira-en-lettres', source: 'tools/naira-to-words' },
  { route: '/fr/tools/ng-plus-value', source: 'tools/ng-cgt' },
  { route: '/fr/tools/recadrer-image', source: 'tools/image-crop' },
  { route: '/fr/tools/redimensionner-image', source: 'tools/image-resize' },
  { route: '/fr/tools/regles-origine-sadc', source: 'tools/sadc-roo' },
  { route: '/fr/tools/revenu-boda', source: 'tools/boda-income' },
  { route: '/fr/tools/revenu-okada', source: 'tools/okada-income' },
  { route: '/fr/tools/selecteur-couleur', source: 'tools/color-picker' },
  { route: '/fr/tools/suivi-hawala', source: 'tools/hawala-tracker' },
  { route: '/fr/tools/suivi-matieres-premieres', source: 'tools/commodity-tracker' },
  { route: '/fr/tools/suivi-susu', source: 'tools/susu-tracker' },
  { route: '/fr/tools/supprimer-arriere-plan', source: 'tools/background-remover' },
  { route: '/fr/tools/tec-eac', source: 'tools/eac-cet' },
  { route: '/fr/tools/za-plus-value', source: 'tools/za-cgt' },
  { route: '/fr/tools/francais-africain', source: 'tools/french-african' },
  { route: '/fr/tools/guide-diaspora', source: 'tools/diaspora-guide' },
  { route: '/fr/tools/montant-lettres-gh', source: 'tools/amount-words-gh' },
  { route: '/fr/tools/montant-lettres-ke', source: 'tools/amount-words-ke' },
  { route: '/fr/tools/photo-identite', source: 'tools/passport-photo' },
  { route: '/fr/tools/pitch-nollywood', source: 'tools/nollywood-pitch' },
  { route: '/fr/tools/signification-prenoms-africains', source: 'tools/african-name-meaning' },
  { route: '/fr/tools/traducteur-amharique', source: 'tools/amharic-translator' },
  { route: '/fr/tools/traducteur-haoussa', source: 'tools/hausa-translator' },
  { route: '/fr/tools/traducteur-igbo', source: 'tools/igbo-translator' },
  { route: '/fr/tools/traducteur-pidgin', source: 'tools/pidgin-translator' },
  { route: '/fr/tools/traducteur-swahili', source: 'tools/swahili-translator' },
  { route: '/fr/tools/traducteur-yoruba', source: 'tools/yoruba-translator' },
  { route: '/fr/tools/traducteur-zoulou', source: 'tools/zulu-translator' },
  { route: '/fr/tools/translitteration', source: 'tools/transliterate' },
];

const COUNTRIES = [
  { code: 'NG', name: 'Nigeria', slug: 'nigeria' },
  { code: 'KE', name: 'Kenya', slug: 'kenya' },
  { code: 'ZA', name: 'South Africa', slug: 'south-africa' },
  { code: 'GH', name: 'Ghana', slug: 'ghana' },
  { code: 'EG', name: 'Egypt', slug: 'egypt' },
  { code: 'ET', name: 'Ethiopia', slug: 'ethiopia' },
  { code: 'TZ', name: 'Tanzania', slug: 'tanzania' },
  { code: 'UG', name: 'Uganda', slug: 'uganda' },
  { code: 'RW', name: 'Rwanda', slug: 'rwanda' },
  { code: 'CI', name: "Cote d'Ivoire", slug: 'cote-divoire' },
  { code: 'CM', name: 'Cameroon', slug: 'cameroon' },
  { code: 'SN', name: 'Senegal', slug: 'senegal' },
  { code: 'MA', name: 'Morocco', slug: 'morocco' },
  { code: 'TN', name: 'Tunisia', slug: 'tunisia' },
  { code: 'AO', name: 'Angola', slug: 'angola' },
  { code: 'ZM', name: 'Zambia', slug: 'zambia' },
  { code: 'ZW', name: 'Zimbabwe', slug: 'zimbabwe' },
  { code: 'MZ', name: 'Mozambique', slug: 'mozambique' },
  { code: 'MW', name: 'Malawi', slug: 'malawi' },
  { code: 'MG', name: 'Madagascar', slug: 'madagascar' },
  { code: 'BW', name: 'Botswana', slug: 'botswana' },
  { code: 'NA', name: 'Namibia', slug: 'namibia' },
  { code: 'LS', name: 'Lesotho', slug: 'lesotho' },
  { code: 'SZ', name: 'Eswatini', slug: 'eswatini' },
  { code: 'MU', name: 'Mauritius', slug: 'mauritius' },
  { code: 'SC', name: 'Seychelles', slug: 'seychelles' },
  { code: 'DJ', name: 'Djibouti', slug: 'djibouti' },
  { code: 'ER', name: 'Eritrea', slug: 'eritrea' },
  { code: 'SO', name: 'Somalia', slug: 'somalia' },
  { code: 'SS', name: 'South Sudan', slug: 'south-sudan' },
  { code: 'SD', name: 'Sudan', slug: 'sudan' },
  { code: 'LY', name: 'Libya', slug: 'libya' },
  { code: 'DZ', name: 'Algeria', slug: 'algeria' },
  { code: 'CD', name: 'DR Congo', slug: 'dr-congo' },
  { code: 'CG', name: 'Republic of Congo', slug: 'republic-of-congo' },
  { code: 'TD', name: 'Chad', slug: 'chad' },
  { code: 'CF', name: 'Central African Republic', slug: 'central-african-republic' },
  { code: 'GA', name: 'Gabon', slug: 'gabon' },
  { code: 'GQ', name: 'Equatorial Guinea', slug: 'equatorial-guinea' },
  { code: 'ST', name: 'Sao Tome and Principe', slug: 'sao-tome' },
  { code: 'KM', name: 'Comoros', slug: 'comoros' },
  { code: 'BI', name: 'Burundi', slug: 'burundi' },
  { code: 'BJ', name: 'Benin', slug: 'benin' },
  { code: 'BF', name: 'Burkina Faso', slug: 'burkina-faso' },
  { code: 'CV', name: 'Cape Verde', slug: 'cape-verde' },
  { code: 'GM', name: 'Gambia', slug: 'gambia' },
  { code: 'GN', name: 'Guinea', slug: 'guinea' },
  { code: 'GW', name: 'Guinea-Bissau', slug: 'guinea-bissau' },
  { code: 'LR', name: 'Liberia', slug: 'liberia' },
  { code: 'ML', name: 'Mali', slug: 'mali' },
  { code: 'NE', name: 'Niger', slug: 'niger' },
  { code: 'SL', name: 'Sierra Leone', slug: 'sierra-leone' },
  { code: 'TG', name: 'Togo', slug: 'togo' },
  { code: 'MR', name: 'Mauritania', slug: 'mauritania' },
];

const FAMILIES = [
  {
    slug: 'tarifs-electricite',
    parentId: 'tarifs-electricite-fr',
    name: 'Tarifs electricite',
    desc: 'Estimez facture, kWh, tarif et frais fixes',
    category: 'energy',
    tier: 'T3',
    sourceId: 'electricity-tariff',
    imageId: 'electricity-tariff',
    priority: 58,
  },
  {
    slug: 'compteur-prepaye',
    parentId: 'compteur-prepaye-fr',
    name: 'Compteur prepaye',
    desc: 'Estimez unites kWh, recharge et cout prepaye',
    category: 'energy',
    tier: 'T3',
    sourceId: 'prepaid-meter',
    imageId: 'prepaid-meter',
    priority: 57,
  },
  {
    slug: 'roi-solaire',
    parentId: 'roi-solaire-fr',
    name: 'ROI solaire',
    desc: 'Estimez investissement, economies et amortissement solaire',
    category: 'energy',
    tier: 'T3',
    sourceId: 'solar-roi',
    imageId: 'solar-roi',
    priority: 59,
  },
  {
    slug: 'assurance-auto',
    parentId: 'assurance-auto-fr',
    name: 'Assurance auto',
    desc: 'Estimez prime, franchise, tiers et tous risques',
    category: 'insurance',
    tier: 'T2',
    sourceId: 'car-insurance',
    imageId: 'car-insurance',
    priority: 55,
    slugOverrides: {
      CI: 'cote-d-ivoire',
      CG: 'congo-brazzaville',
      ST: 'sao-tome-and-principe',
      CV: 'cabo-verde',
    },
  },
  {
    slug: 'comparateur-assurance-sante',
    parentId: 'comparateur-assurance-sante-fr',
    name: 'Comparateur assurance sante',
    desc: 'Comparez primes, reseaux, plafonds et exclusions',
    category: 'insurance',
    tier: 'T2',
    sourceId: 'health-insurance-compare',
    imageId: 'health-insurance-compare',
    priority: 54,
    slugOverrides: {
      CI: 'cote-d-ivoire',
    },
  },
  {
    slug: 'assurance-vie',
    parentId: 'assurance-vie-fr',
    name: 'Assurance vie',
    desc: 'Estimez couverture, famille, dettes et revenus a proteger',
    category: 'insurance',
    tier: 'T2',
    sourceId: 'life-insurance-calc',
    imageId: 'life-insurance-calc',
    priority: 53,
    slugOverrides: {
      CI: 'cote-d-ivoire',
    },
  },
  {
    slug: 'assurance-obseques',
    parentId: 'assurance-obseques-fr',
    name: 'Assurance obseques',
    desc: 'Estimez frais funeraires et couverture de preparation',
    category: 'insurance',
    tier: 'T2',
    sourceId: 'funeral-insurance',
    imageId: 'funeral-insurance',
    priority: 52,
    slugOverrides: {
      CI: 'cote-d-ivoire',
    },
  },
  {
    slug: 'contrat-bail',
    parentId: 'contrat-bail-fr',
    name: 'Contrat de bail',
    desc: 'Preparez un projet de bail a relire localement',
    category: 'legal',
    tier: 'T1',
    sourceId: 'tenancy-agreement',
    imageId: 'tenancy-agreement',
    priority: 56,
    slugOverrides: {
      CI: 'cote-d-ivoire',
      CG: 'congo-brazzaville',
      ST: 'sao-tome-and-principe',
      CV: 'cabo-verde',
    },
  },
  {
    slug: 'contrat-travail',
    parentId: 'contrat-travail-fr',
    name: 'Contrat de travail',
    desc: 'Structurez un projet de contrat de travail',
    category: 'legal',
    tier: 'T2',
    sourceId: 'employment-contract',
    imageId: 'employment-contract',
    priority: 54,
    slugOverrides: {
      CI: 'cote-d-ivoire',
      CG: 'congo-brazzaville',
      ST: 'sao-tome-and-principe',
      CV: 'cabo-verde',
    },
  },
  {
    slug: 'suivi-carburant',
    parentId: 'suivi-carburant-fr',
    name: 'Suivi carburant',
    desc: 'Suivez prix, litres, depenses et cout au kilometre',
    category: 'financial',
    tier: 'T2',
    sourceId: 'fuel-tracker',
    imageId: 'fuel-tracker',
    priority: 54,
    slugOverrides: {
      CG: 'congo',
      ST: 'sao-tome-and-principe',
      CV: 'cabo-verde',
    },
  },
];

function escapeSingleQuoted(value) {
  return value.replace(/'/g, "\\'");
}

function decodeBasicEntities(value) {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&rsquo;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

function normalizeText(value) {
  return decodeBasicEntities(String(value || '').replace(/\s+/g, ' ').trim());
}

function shorten(value, maxLength) {
  const text = normalizeText(value);
  if (text.length <= maxLength) return text;
  const trimmed = text.slice(0, maxLength - 1);
  const lastSpace = trimmed.lastIndexOf(' ');
  return `${trimmed.slice(0, lastSpace > 80 ? lastSpace : trimmed.length).trim()}.`;
}

function fileForRoute(route) {
  const relativeRoute = route.replace(/^\//, '');
  const indexFile = path.join(repoRoot, relativeRoute, 'index.html');
  const flatFile = path.join(repoRoot, `${relativeRoute}.html`);
  if (fs.existsSync(indexFile)) return indexFile;
  if (fs.existsSync(flatFile)) return flatFile;
  return null;
}

function pageMetadata(route) {
  const file = fileForRoute(route);
  if (!file) return null;

  const html = fs.readFileSync(file, 'utf8');
  const titleMatch = html.match(/<title>([\s\S]*?)<\/title>/i);
  const descMatch =
    html.match(/<meta\s+[^>]*name=["']description["'][^>]*content=(["'])([\s\S]*?)\1/i) ||
    html.match(/<meta\s+[^>]*content=(["'])([\s\S]*?)\1[^>]*name=["']description["']/i);

  const title = normalizeText(titleMatch ? titleMatch[1].replace(/\s*\|\s*AfroTools\s*$/i, '') : route.split('/').pop());
  const desc = descMatch ? shorten(descMatch[2], 180) : `Surface francaise pour ${title}.`;

  return { title, desc };
}

function loadRegistryTools(source) {
  const context = {
    console,
    CustomEvent: function CustomEvent(type, init) {
      return { type, ...(init || {}) };
    },
    document: {
      readyState: 'loading',
      getElementById: function getElementById() { return null; },
      createElement: function createElement() { return {}; },
      head: { appendChild: function appendChild() {} },
      addEventListener: function addEventListener() {},
      removeEventListener: function removeEventListener() {},
      dispatchEvent: function dispatchEvent() {},
    },
  };

  vm.createContext(context);
  vm.runInContext(source, context);
  return context.AFRO_TOOLS || [];
}

function normalizeRegistryHref(href) {
  return String(href || '').replace(/^\//, '').replace(/\/$/, '').replace(/\/index\.html$/, '');
}

function findEnglishTool(tools, source) {
  const sourceKey = source.replace(/\/$/, '');
  const sourceSlug = sourceKey.replace(/^tools\//, '');
  const byId = new Map(tools.map((tool) => [tool.id, tool]));
  const byHref = new Map(tools.map((tool) => [normalizeRegistryHref(tool.href), tool]));
  return byId.get(sourceSlug) || byHref.get(sourceKey) || null;
}

function singletonId(route) {
  return `${route.split('/').filter(Boolean).pop()}-fr`;
}

function rowForSingleton(entry, englishTool) {
  const metadata = pageMetadata(entry.route);
  if (!metadata) {
    throw new Error(`Missing French page for ${entry.route}`);
  }

  const countries = Array.isArray(englishTool.countries) && englishTool.countries.length
    ? englishTool.countries
    : ['ALL'];
  const priority = Math.max(45, Math.min(62, (englishTool.priority || 65) - 18));
  const imageId = englishTool.imageId || englishTool.id;

  return `  { id: '${singletonId(entry.route)}', name: '${escapeSingleQuoted(metadata.title)}', icon: 'FR', desc: '${escapeSingleQuoted(metadata.desc)}', href: '${entry.route}', category: '${englishTool.category}', tier: '${englishTool.tier || 'T3'}', status: 'live', phase: 'LIVE', countries: [${countries.map((country) => `'${country}'`).join(', ')}], lang: 'fr', sourceId: '${englishTool.id}', priority: ${priority}, imageId: '${imageId}' },`;
}

function routeSlugFor(family, country) {
  return (family.slugOverrides && family.slugOverrides[country.code]) || country.slug;
}

function routeFor(family, country) {
  return `/fr/tools/${family.slug}/${routeSlugFor(family, country)}`;
}

function routeExists(family, country) {
  const slug = routeSlugFor(family, country);
  return (
    fs.existsSync(path.join(repoRoot, 'fr/tools', family.slug, slug, 'index.html')) ||
    fs.existsSync(path.join(repoRoot, 'fr/tools', family.slug, `${slug}.html`))
  );
}

function rowFor(family, country) {
  const countryName = escapeSingleQuoted(country.name);
  return `  { id: '${family.slug}-${routeSlugFor(family, country)}-fr', name: '${escapeSingleQuoted(family.name)} - ${countryName}', icon: '${country.code}', desc: '${escapeSingleQuoted(family.desc)} pour ${countryName}.', href: '${routeFor(family, country)}', category: '${family.category}', tier: '${family.tier}', status: 'live', phase: 'LIVE', countries: ['${country.code}'], lang: 'fr', sourceId: '${family.sourceId}', priority: ${family.priority}, imageId: '${family.imageId}' },`;
}

function insertRowsAfterParent(source, family, missingCountries) {
  const anchor = `id: '${family.parentId}'`;
  const anchorIndex = source.indexOf(anchor);

  if (anchorIndex === -1) {
    throw new Error(`Could not find the ${family.parentId} registry row.`);
  }

  const insertAfter = source.indexOf('\n', anchorIndex);
  const block = [
    '',
    `  // French generated country pages: ${family.slug}`,
    ...missingCountries.map((country) => rowFor(family, country)),
  ].join('\n');

  return `${source.slice(0, insertAfter)}${block}${source.slice(insertAfter)}`;
}

function removeManagedRows(source, family) {
  const lines = source.split(/\r?\n/);
  const filtered = lines.filter((line) => {
    const isManagedComment =
      line.includes(`French generated country pages: ${family.slug}`) ||
      (family.slug === 'tarifs-electricite' && line.includes('French generated energy country pages: electricity tariff'));
    const isManagedRow =
      line.includes(`id: '${family.slug}-`) &&
      line.includes(`href: '/fr/tools/${family.slug}/`) &&
      line.includes(`sourceId: '${family.sourceId}'`);
    return !isManagedComment && !isManagedRow;
  });
  return filtered.join('\n');
}

function removeManagedSingletonRows(source) {
  const singletonIds = new Set(SINGLETON_ROUTES.map((entry) => singletonId(entry.route)));
  const lines = source.split(/\r?\n/);
  const filtered = lines.filter((line) => {
    if (line.includes('French singleton registry wave')) return false;
    for (const id of singletonIds) {
      if (line.includes(`id: '${id}'`) && line.includes("lang: 'fr'")) return false;
    }
    return true;
  });
  return filtered.join('\n');
}

function insertSingletonRows(source, tools) {
  const rows = [];

  for (const entry of SINGLETON_ROUTES) {
    if (!fileForRoute(entry.route)) continue;
    const englishTool = findEnglishTool(tools, entry.source);
    if (!englishTool) {
      throw new Error(`Missing English registry owner for ${entry.route} -> ${entry.source}`);
    }
    rows.push(rowForSingleton(entry, englishTool));
  }

  if (!rows.length) return { source, count: 0 };

  const anchor = "id: 'roi-biogaz-fr'";
  const anchorIndex = source.indexOf(anchor);
  if (anchorIndex === -1) {
    throw new Error('Could not find the French registry insertion anchor.');
  }

  const insertAfter = source.indexOf('\n', anchorIndex);
  const block = ['', '  // French singleton registry wave', ...rows].join('\n');
  return {
    source: `${source.slice(0, insertAfter)}${block}${source.slice(insertAfter)}`,
    count: rows.length,
  };
}

function main() {
  let source = fs.readFileSync(registryPath, 'utf8');
  const tools = loadRegistryTools(source);
  const inserted = [];

  for (const family of FAMILIES) {
    source = removeManagedRows(source, family);
    const missingCountries = COUNTRIES.filter((country) => routeExists(family, country));

    if (!missingCountries.length) {
      continue;
    }

    source = insertRowsAfterParent(source, family, missingCountries);
    inserted.push(`${family.slug}: ${missingCountries.length}`);
  }

  source = removeManagedSingletonRows(source);
  const singletonResult = insertSingletonRows(source, tools);
  source = singletonResult.source;
  if (singletonResult.count) {
    inserted.push(`singletons: ${singletonResult.count}`);
  }

  if (!inserted.length) {
    console.log('French generated country registry rows already present.');
    return;
  }

  fs.writeFileSync(registryPath, source);

  console.log(`Inserted French country registry rows: ${inserted.join(', ')}.`);
}

main();
