#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');

function hasMatch(html, search) {
  if (typeof search === 'string') return html.includes(search);
  if (search instanceof RegExp) {
    const flags = search.flags.replace(/g/g, '');
    return new RegExp(search.source, flags).test(html);
  }
  return false;
}

function replaceOne(html, search, replacement, label, misses) {
  if (!hasMatch(html, search)) {
    misses.push(label);
    return html;
  }
  return html.replace(search, replacement);
}

function removeJsonLdByType(html, type) {
  return html.replace(
    new RegExp(`<script type="application/ld\\+json">[\\s\\S]*?"@type"\\s*:\\s*"${type}"[\\s\\S]*?<\\/script>\\s*`, 'gi'),
    ''
  );
}

function buildJsonLdBlock(data) {
  return `<script type="application/ld+json">${JSON.stringify(data)}</script>`;
}

function insertSchemaBundle(html, bundle, label, misses) {
  const block = `${bundle.join('\n')}\n`;
  const twitterDescriptionPattern = /(<meta name="twitter:description" content="[^"]*">)/i;

  if (twitterDescriptionPattern.test(html)) {
    return html.replace(twitterDescriptionPattern, `$1\n${block}`);
  }

  misses.push(label);
  return html;
}

function pageUrlFor(file) {
  return `https://afrotools.com/${file.replace(/index\.html$/, '').replace(/\.html$/, '/')}`;
}

function countryUrlFor(file) {
  return `https://afrotools.com/${path.posix.dirname(file)}/`;
}

function imageUrlFor(file) {
  return `https://afrotools.com/assets/img/tools/${path.posix.basename(file, '.html')}.webp`;
}

const pages = [
  {
    file: 'fr/benin/bj-paye.html',
    title: 'Calculateur PAYE Bénin 2026 | AfroTools',
    ogTitle: 'Calculateur PAYE Bénin 2025/26 | AfroTools',
    description: 'Calculateur PAYE Bénin 2025/26. Barème progressif DGI de 0 % à 25 %, CNPS 2,5 % salarié / 9,5 % employeur et estimation nette mensuelle. PDF gratuit.',
    ogDescription: 'Calculateur PAYE Bénin 2025/26 avec barème DGI 0 % à 25 %, CNPS 2,5 % / 9,5 % et export PDF gratuit.',
    countryName: 'Bénin',
    faqSchema: [
      { q: 'Quelles sont les tranches DGI du Bénin en 2025/26 ?', a: "Le barème annuel comprend sept tranches : 0 % jusqu'à XOF 300 000, puis 2 %, 5 %, 10 %, 15 %, 20 % et enfin 25 % au-dessus de XOF 9 600 000. Le calcul s'applique au revenu imposable après déduction de la CNPS salariale." },
      { q: "La cotisation CNPS est-elle déductible avant l'impôt ?", a: "Oui. La cotisation salariale obligatoire de 2,5 % est déduite du salaire brut avant calcul de la DGI. La part employeur de 9,5 % reste un coût supplémentaire pour l'entreprise." },
      { q: 'Quand le PAYE est-il calculé et reversé au Bénin ?', a: "Le barème est annuel, mais l'employeur effectue la retenue chaque mois sur la paie puis reverse l'impôt à la DGI selon les échéances déclaratives applicables." },
      { q: 'Quel est le taux total de CNPS au Bénin ?', a: 'Le taux global retenu ici est de 12 % du salaire brut : 2,5 % pour le salarié et 9,5 % pour l’employeur.' },
    ],
  },
  {
    file: 'fr/djibouti/dj-paye.html',
    title: 'Calculateur PAYE Djibouti 2026 | AfroTools',
    ogTitle: 'Calculateur PAYE Djibouti 2025/26 | AfroTools',
    description: 'Calculateur PAYE Djibouti 2025/26. IRPP progressif de 0 % à 30 %, sécurité sociale 4 % salarié / 15,7 % employeur et estimation nette mensuelle. PDF gratuit.',
    ogDescription: 'Calculateur PAYE Djibouti avec IRPP 0 % à 30 %, sécurité sociale 4 % / 15,7 % et export PDF gratuit.',
    countryName: 'Djibouti',
    faqSchema: [
      { q: 'Quelles sont les tranches IRPP à Djibouti ?', a: "Le barème mensuel comprend six tranches : 0 % jusqu'à DJF 50 000, puis 2 %, 15 %, 18 %, 20 % et 30 % au-dessus de DJF 2 000 000 de revenu imposable mensuel." },
      { q: "La sécurité sociale est-elle déductible avant l'IRPP ?", a: "Oui. La cotisation salariale de 4 % est retirée du salaire brut avant calcul de l'IRPP." },
      { q: 'Quel est le taux total de sécurité sociale ?', a: 'Le total retenu ici est de 19,7 % : 4 % à la charge du salarié et 15,7 % à la charge de l’employeur.' },
      { q: "À quel moment l'impôt est-il calculé à Djibouti ?", a: "L'IRPP est calculé chaque mois sur le revenu imposable mensuel. L'employeur effectue la retenue sur la paie puis reverse l'impôt à l'administration fiscale." },
    ],
  },
  {
    file: 'fr/ethiopia/et-paye.html',
    title: 'Calculateur PAYE Éthiopie 2026 | AfroTools',
    ogTitle: 'Calculateur PAYE Éthiopie 2025/26 | AfroTools',
    description: 'Calculateur PAYE Éthiopie 2025/26. Barème ERCA de 0 % à 35 %, pension salariale 7 % déductible, pension employeur 11 % et estimation nette mensuelle. PDF gratuit.',
    ogDescription: 'Calculateur PAYE Éthiopie avec barème ERCA 0 % à 35 %, pension 7 % déductible et export PDF gratuit.',
    countryName: 'Éthiopie',
    faqSchema: [
      { q: 'Quelles sont les tranches PAYE en Éthiopie pour 2025/26 ?', a: "Le barème mensuel issu de la proclamation n° 1395/2025 prévoit 0 % sur les premiers ETB 2 000, puis 15 %, 20 %, 25 %, 30 % et 35 % au-dessus de ETB 14 000." },
      { q: 'La cotisation pension est-elle déductible avant le PAYE ?', a: "Oui. La cotisation salariale obligatoire de 7 % est retirée du salaire brut avant calcul de l'impôt, tandis que la part employeur de 11 % n'est pas prélevée sur le net du salarié." },
      { q: "Quand l'employeur doit-il verser les cotisations de pension ?", a: 'Les cotisations de pension sont généralement attendues au plus tard le 10 du mois suivant la paie, en parallèle des obligations mensuelles PAYE auprès de l’ERCA.' },
      { q: "Qu'est-ce qui a changé avec la proclamation n° 1395/2025 ?", a: "La réforme a simplifié le barème en six tranches et relevé le seuil exonéré à ETB 2 000 par mois, ce qui allège l'impôt pour une large partie des salariés." },
    ],
  },
  {
    file: 'fr/liberia/lr-paye.html',
    title: 'Calculateur PAYE Libéria 2026 | AfroTools',
    ogTitle: 'Calculateur PAYE Libéria 2025/26 | AfroTools',
    description: 'Calculateur PAYE Libéria 2025/26. Barème annuel LRA, NASSCORP 4 % salarié / 6 % employeur et estimation mensuelle du salaire net. PDF gratuit.',
    ogDescription: 'Calculateur PAYE Libéria avec barème annuel LRA, NASSCORP 4 % / 6 % et export PDF gratuit.',
    countryName: 'Libéria',
    faqSchema: [
      { q: 'Quelles sont les tranches LRA du Liberia en 2025/26 ?', a: 'Le barème des personnes physiques est annuel : 0 % jusqu’à LRD 70 000, 5 % de LRD 70 001 à 200 000, puis 15 % jusqu’à LRD 800 000 et 25 % au-dessus.' },
      { q: 'Comment NASSCORP est-il traité dans ce calculateur ?', a: 'NASSCORP apparaît comme retenue salariale et comme coût employeur distinct. AfroTools applique ici la version actualisée du guide employeur : 4 % salarié et 6 % employeur.' },
      { q: "Comment l'impôt sur le revenu est-il estimé au Liberia ?", a: "Le calculateur annualise d'abord le salaire, applique le barème LRA annuel, puis répartit la charge d'impôt sur 12 mois pour afficher une estimation mensuelle." },
      { q: 'Le Liberia utilise-t-il le USD ou le LRD pour les impôts ?', a: 'Les deux devises coexistent. Ce calculateur travaille en LRD afin de rester cohérent avec le barème fiscal affiché.' },
    ],
  },
  {
    file: 'fr/madagascar/mg-paye.html',
    title: 'Calculateur PAYE Madagascar 2026 | AfroTools',
    ogTitle: 'Calculateur PAYE Madagascar 2025/26 | AfroTools',
    description: 'Calculateur PAYE Madagascar 2025/26. Barème IRSA mensuel, CNaPS 1 % salarié / 13 % employeur, plafond du régime général et allègement pour personnes à charge. PDF gratuit.',
    ogDescription: 'Calculateur PAYE Madagascar avec barème IRSA mensuel, CNaPS 1 % / 13 % et export PDF gratuit.',
    countryName: 'Madagascar',
    faqSchema: [
      { q: 'Comment fonctionne la structure PAYE à Madagascar ?', a: "L'IRSA est mensuel et progressif : 0 % jusqu'à MGA 350 000, puis 5 %, 10 %, 15 % et 20 % au-dessus de MGA 600 000. Un minimum de MGA 3 000 s'applique dès qu'un IRSA devient dû." },
      { q: "La CNaPS est-elle déductible avant l'IRSA ?", a: "Oui. La cotisation salariale de 1 % est déduite du salaire brut avant calcul de l'IRSA, dans la limite du plafond du régime général retenu ici." },
      { q: 'À quoi correspond le plafond CNaPS ?', a: 'Le plafond utilisé ici est de MGA 2 101 440 par mois. Les cotisations CNaPS ne continuent pas d’augmenter au-delà de cette base couverte dans le régime standard.' },
      { q: 'Comment le PAYE est-il calculé à Madagascar ?', a: "Le calculateur déduit d'abord la CNaPS salariale, applique ensuite le barème IRSA mensuel, impose le minimum légal lorsque nécessaire, puis prend en compte l'allègement pour personnes à charge." },
    ],
  },
  {
    file: 'fr/sierra-leone/sl-paye.html',
    title: 'Calculateur PAYE Sierra Leone 2026 | AfroTools',
    ogTitle: 'Calculateur PAYE Sierra Leone 2025/26 | AfroTools',
    description: 'Calculateur PAYE Sierra Leone 2025/26. Impôt progressif NRA, NASSIT 5 % salarié / 10 % employeur et estimation nette mensuelle. PDF gratuit.',
    ogDescription: 'Calculateur PAYE Sierra Leone avec barème NRA, NASSIT 5 % / 10 % et export PDF gratuit.',
    countryName: 'Sierra Leone',
    faqSchema: [
      { q: 'Quelles sont les tranches PAYE en Sierra Leone pour 2025/26 ?', a: 'Pour les résidents, le barème mensuel est progressif : 0 % sur les premiers SLE 600, puis 15 %, 20 %, 25 % et 30 % au-dessus de SLE 2 400.' },
      { q: "Qu'est-ce que la NASSIT et combien le salarié paie-t-il ?", a: 'La National Social Security and Insurance Trust est le régime obligatoire de sécurité sociale. Le salarié cotise à hauteur de 5 % du salaire et l’employeur à 10 %, soit 15 % au total.' },
      { q: 'Qui administre le PAYE en Sierra Leone ?', a: "Le PAYE est administré par la National Revenue Authority, qui reçoit les retenues mensuelles opérées sur la paie par les employeurs." },
      { q: "Quand l'employeur doit-il payer le PAYE à la NRA ?", a: 'Le PAYE doit généralement être déclaré et payé avant le 15 du mois suivant. Des pénalités et intérêts peuvent s’appliquer en cas de retard.' },
    ],
  },
  {
    file: 'fr/uganda/ug-paye.html',
    title: 'Calculateur PAYE Ouganda 2026 | AfroTools',
    ogTitle: 'Calculateur PAYE Ouganda 2025/26 | AfroTools',
    description: 'Calculateur PAYE Ouganda 2025/26. Barème URA de 0 % à 40 %, NSSF 5 % non déductible et Local Service Tax officielle selon le salaire net mensuel. PDF gratuit.',
    ogDescription: 'Calculateur PAYE Ouganda avec barème URA, NSSF 5 % non déductible, Local Service Tax et export PDF gratuit.',
    countryName: 'Ouganda',
    faqSchema: [
      { q: 'Quelles sont les tranches PAYE en Ouganda pour 2025/26 ?', a: 'Pour les résidents, le barème mensuel est de 0 % jusqu’à UGX 235 000, puis 10 %, 20 %, 30 % et 40 % au-dessus de UGX 10 000 000. Les non-résidents sont imposés à 30 % forfaitaires.' },
      { q: "La NSSF est-elle déductible avant le PAYE en Ouganda ?", a: "Non. La cotisation salariale NSSF de 5 % n'est pas déductible de la base PAYE ; l'impôt est calculé sur le brut." },
      { q: "Qu'est-ce que la Local Service Tax (LST) en Ouganda ?", a: 'La LST est une taxe annuelle supplémentaire appliquée lorsque le salaire net mensuel après PAYE dépasse certains seuils. Pour les salariés, elle varie généralement entre UGX 5 000 et UGX 100 000 par an.' },
      { q: 'Comment les revenus des non-résidents sont-ils imposés ?', a: "Les non-résidents paient un taux forfaitaire de 30 % sur les revenus d'emploi de source ougandaise et ne bénéficient pas des tranches progressives des résidents." },
    ],
  },
];

const misses = [];

for (const page of pages) {
  const filePath = path.join(repoRoot, page.file);
  let html = fs.readFileSync(filePath, 'utf8');
  const pageUrl = pageUrlFor(page.file);
  const countryUrl = countryUrlFor(page.file);
  const imageUrl = imageUrlFor(page.file);
  const schemaName = page.ogTitle.replace(' | AfroTools', '');

  html = replaceOne(html, /<title>[\s\S]*?<\/title>/, `<title>${page.title}</title>`, `${page.file}: title`, misses);
  html = replaceOne(html, /<meta name="description" content="[^"]*">/i, `<meta name="description" content="${page.description}">`, `${page.file}: meta description`, misses);
  html = replaceOne(html, /<meta property="og:title" content="[^"]*">/i, `<meta property="og:title" content="${page.ogTitle}">`, `${page.file}: og:title`, misses);
  html = replaceOne(html, /<meta property="og:description" content="[^"]*">/i, `<meta property="og:description" content="${page.ogDescription}">`, `${page.file}: og:description`, misses);
  html = replaceOne(html, /<meta name="twitter:title" content="[^"]*">/i, `<meta name="twitter:title" content="${page.ogTitle}">`, `${page.file}: twitter:title`, misses);
  html = replaceOne(html, /<meta name="twitter:description" content="[^"]*">/i, `<meta name="twitter:description" content="${page.ogDescription}">`, `${page.file}: twitter:description`, misses);

  html = removeJsonLdByType(html, 'BreadcrumbList');
  html = removeJsonLdByType(html, 'WebApplication');
  html = removeJsonLdByType(html, 'WebPage');
  html = removeJsonLdByType(html, 'FAQPage');

  html = insertSchemaBundle(
    html,
    [
      buildJsonLdBlock({
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'AfroTools', item: 'https://afrotools.com/fr/' },
          { '@type': 'ListItem', position: 2, name: page.countryName, item: countryUrl },
          { '@type': 'ListItem', position: 3, name: schemaName, item: pageUrl },
        ],
      }),
      buildJsonLdBlock({
        '@context': 'https://schema.org',
        '@type': 'WebApplication',
        name: schemaName,
        description: page.description,
        url: pageUrl,
        inLanguage: 'fr',
        applicationCategory: 'FinanceApplication',
        operatingSystem: 'Web',
        browserRequirements: 'Requires JavaScript',
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
        author: { '@type': 'Organization', name: 'AfroTools', url: 'https://afrotools.com' },
        image: imageUrl,
      }),
      buildJsonLdBlock({
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        name: schemaName,
        url: pageUrl,
        description: page.description,
        inLanguage: 'fr',
        isPartOf: { '@type': 'WebSite', name: 'AfroTools', url: 'https://afrotools.com' },
        image: imageUrl,
      }),
      buildJsonLdBlock({
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: page.faqSchema.map((entry) => ({
          '@type': 'Question',
          name: entry.q,
          acceptedAnswer: { '@type': 'Answer', text: entry.a },
        })),
      }),
    ],
    `${page.file}: schema bundle`,
    misses
  );

  fs.writeFileSync(filePath, html);
}

if (misses.length) {
  console.warn('SEO polish completed with some unmatched replacements:');
  for (const miss of misses) console.warn(`- ${miss}`);
} else {
  console.log('French PAYE SEO polish completed without misses.');
}
