#!/usr/bin/env node
'use strict';

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { analyticsVersion, canonicalLoaderTag } = require('./inject-analytics-loader');

const root = path.resolve(__dirname, '..');
const write = process.argv.includes('--write');
const dataPath = path.join(root, 'data', 'content', 'blog-content-explosion-fr-wave1-2026-08.json');
const payrollExpansionPath = path.join(root, 'data', 'content', 'french-payroll-expansion-2026-08.json');
const frenchManifestPath = path.join(root, 'data', 'localization', 'fr-blog-manifest.json');
const contentManifestPath = path.join(root, 'data', 'content', 'blog-article-manifest.json');
const reportPath = path.join(root, 'reports', 'blog-seo-opportunities-fr-wave1-2026-08.md');
const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
const payrollExpansion = JSON.parse(fs.readFileSync(payrollExpansionPath, 'utf8'));

function buildPayrollExpansion(record) {
  const reviewed = payrollExpansion.reviewedLabel;
  const commonInputs = [
    ['Période contrôlée', 'Mois de paie, date de versement et version des règles consultées'],
    ['Rémunération brute', 'Salaire de base, primes, avantages, absences et régularisations'],
    [`Base ${record.taxName}`, `Éléments inclus dans la base ${record.taxName} et justification des exclusions`],
    [`Base ${record.socialName}`, `Assiette sociale, plafond éventuel et ventilation salarié-employeur`],
    ['Pièces de rapprochement', 'Contrat, bulletin, journal de paie, déclaration et preuve de paiement']
  ];
  const steps = [
    `Fixez le mois contrôlé et archivez les sources officielles relues le ${reviewed}.`,
    'Reconstituez le brut depuis le contrat, les variables et les absences au lieu de partir uniquement du net affiché.',
    `Documentez séparément la base ${record.taxName} et la base ${record.socialName}; une différence n'est pas automatiquement une erreur.`,
    `Saisissez le brut dans le ${record.tool[1]} et conservez le détail du scénario local.`,
    'Comparez chaque ligne au bulletin et au journal de paie, puis notez la cause des écarts de période ou d’arrondi.',
    'Rapprochez les totaux avec la déclaration et la preuve de paiement sans écraser la première estimation.',
    'Faites valider les exceptions, avantages, exonérations et régularisations avant toute déclaration.'
  ];
  const sections = [
    {
      title: `Identifier la période et la version des règles`,
      paragraphs: [
        `${record.specific} Commencez par écrire le mois de paie, la date de versement et le millésime du texte consulté. Une page officielle disponible aujourd'hui peut décrire une consolidation différente de celle applicable au bulletin contrôlé. Conservez le lien, le titre du document et la date de lecture dans le même dossier que le calcul.`,
        `Ne remplacez pas cette preuve par la mention vague « taux 2026 ». Une loi de finances, une note d'application ou une modification de plafond peut intervenir en cours d'année. Si le texte ne permet pas de confirmer un paramètre, marquez-le à vérifier et gardez l'estimation comme scénario de planification.`
      ],
      bullets: ['Mois de paie identifié', 'Document officiel nommé', 'Date de consultation conservée', 'Paramètres incertains signalés']
    },
    {
      title: `Reconstituer le brut et les deux assiettes`,
      paragraphs: [
        `Le brut du contrat n'explique pas toujours à lui seul le brut du bulletin. Relevez salaire de base, prime fixe, variable, avantage, indemnité, absence et rappel. Pour chaque élément, indiquez son traitement dans la base ${record.taxName} et dans la base ${record.socialName}. Le nom donné à une indemnité ne suffit pas à prouver son exclusion.`,
        `Travaillez dans une seule périodicité. Une prime annuelle rapprochée d'un calcul mensuel sans conversion crée un faux écart. Si le bulletin contient une régularisation, isolez le mois d'origine et le mois de correction. Le contrôle doit permettre à une autre personne de retrouver la même base sans demander une explication orale.`
      ],
      bullets: ['Salaire de base', 'Variables et rappels', `Assiette ${record.taxName}`, `Assiette ${record.socialName}`]
    },
    {
      title: `Comparer le calculateur au bulletin sans inventer une conformité`,
      paragraphs: [
        `Le calculateur AfroTools produit une estimation reproductible à partir des entrées saisies. Il ne connaît ni une convention particulière, ni une décision administrative individuelle, ni une régularisation absente de l'interface. Comparez donc les lignes une par une et classez chaque écart : entrée différente, règle différente, arrondi, plafond, période ou erreur à investiguer.`,
        `Un total proche ne suffit pas. Deux erreurs peuvent se compenser et donner un net apparemment correct. Vérifiez séparément le brut, ${record.taxName}, ${record.socialName}, les autres retenues et le net. Exportez le scénario uniquement comme feuille de contrôle; il ne devient ni bulletin officiel ni déclaration du seul fait qu'il est imprimé.`
      ],
      bullets: ['Entrées identiques', 'Retenues comparées ligne par ligne', 'Écarts classés', 'Limite de l’estimation visible']
    },
    {
      title: `Rapprocher déclaration, paiement et comptabilité`,
      paragraphs: [
        `La dernière étape n'est pas le net versé. ${record.decision}. Placez côte à côte le journal de paie, le total déclaré, le reçu ou ordre de paiement et l'écriture comptable. Un écart doit recevoir un propriétaire, une explication et une date de résolution.`,
        `Conservez les versions au lieu de corriger silencieusement le premier fichier. Le dossier doit montrer ce qui avait été estimé, ce qui a été déclaré et pourquoi les deux diffèrent. Cette traçabilité réduit le risque de reproduire le même écart au mois suivant et permet de revoir rapidement les paramètres lors d'un changement officiel.`
      ],
      bullets: ['Journal de paie', 'Déclaration', 'Preuve de paiement', 'Écriture et écart expliqués']
    },
    {
      title: `Installer une revue mensuelle courte`,
      paragraphs: [
        `Attribuez quatre responsabilités distinctes : préparer les variables, exécuter le calcul, vérifier les sources et approuver la déclaration. Dans une petite structure, une même personne peut tenir plusieurs rôles, mais les étapes doivent rester visibles. Une liste de contrôle datée vaut mieux qu'une validation informelle au moment du paiement.`,
        `Avant le cycle suivant, rouvrez les alertes de l'administration fiscale et de l'organisme social. Ne changez pas un taux parce que le contenu d'une page a bougé; lisez le texte ou l'avis qui décrit le changement et sa date d'effet. Testez ensuite un cas synthétique avant d'appliquer un nouveau paramètre aux dossiers réels.`
      ],
      bullets: ['Responsable des variables', 'Responsable du calcul', 'Relecteur des sources', 'Approbateur de la déclaration']
    }
  ];
  return {
    ...record,
    published: payrollExpansion.published,
    reviewedLabel: payrollExpansion.reviewedLabel,
    opportunityConfidence: 'élevée',
    cannibalization: `faible ; cette page traite ${record.intent} et transmet le calcul au propriétaire canonique au lieu de reproduire son moteur`,
    cluster: 'paie',
    category: 'Paie et contrôle mensuel',
    opening: `Un salaire net n'est pas suffisamment contrôlé lorsque seul le montant final paraît plausible. Pour ${record.country}, le dossier doit relier rémunération brute, ${record.taxName}, ${record.socialName}, autres retenues, déclaration et paiement. Cette méthode garde les sources et les limites visibles sans présenter l'estimation comme une paie officielle.`,
    quickAnswer: `Reconstituez d'abord le brut et la période. Séparez ensuite la base ${record.taxName} de la base ${record.socialName}, exécutez le calcul local AfroTools avec les mêmes entrées et expliquez chaque écart avec le bulletin. Rapprochez enfin la déclaration et le paiement. Les sources ci-dessous ont été relues le ${reviewed}, mais doivent être rouvertes avant une décision réelle.`,
    whyItMatters: `Une erreur d'assiette peut produire un net crédible tout en faussant la retenue, la dette envers l'organisme social ou la déclaration fiscale. Le contrôle détaillé protège le salarié et l'employeur, rend une correction explicable et évite qu'un ancien paramètre soit copié de mois en mois.`,
    inputs: commonInputs,
    steps,
    sections,
    toolUse: `Utilisez le ${record.tool[1]} avec un cas synthétique ou les données minimales nécessaires. Le calcul reste dans le navigateur. Conservez le détail comme pièce de rapprochement, puis remplacez toute hypothèse par le paramètre confirmé pour la période et le dossier concernés.`,
    mistakes: [
      'Valider le bulletin parce que le net paraît proche du résultat attendu.',
      `Confondre la base ${record.taxName} et la base ${record.socialName}.`,
      'Utiliser une source officielle sans noter son millésime ou sa date d’effet.',
      'Mélanger une prime annuelle avec une base mensuelle sans conversion.',
      'Corriger le fichier de paie sans conserver la version et la cause de l’écart.',
      'Présenter l’export AfroTools comme un bulletin ou une déclaration officielle.'
    ],
    sources: [record.taxSource, record.socialSource, record.processSource],
    related: [[record.tool[0], record.tool[1]], ['/fr/salary-tax/', 'Outils français de salaire et fiscalité'], ['/fr/blog/', 'Guides pratiques AfroTools en français']],
    faq: [
      [`Le calcul AfroTools remplace-t-il un bulletin officiel en ${record.country} ?`, 'Non. Il s’agit d’une estimation locale destinée au contrôle et à la planification.'],
      [`Pourquoi séparer ${record.taxName} et ${record.socialName} ?`, 'Les bases, plafonds, responsables du versement et règles de période peuvent différer.'],
      ['Que faire si le bulletin et le calculateur diffèrent ?', 'Vérifiez les entrées, la période, les assiettes, les plafonds et la version des règles avant de conclure à une erreur.'],
      ['Puis-je utiliser les taux affichés sans rouvrir les sources ?', 'Non. Rouvrez les publications officielles et confirmez leur date d’effet pour le mois contrôlé.'],
      ['Quelles preuves conserver ?', 'Gardez contrat ou avenant, variables, bulletin, sources datées, calcul, déclaration, paiement et explication des écarts.']
    ]
  };
}

data.articles.push(...payrollExpansion.articles.map(buildPayrollExpansion));
const analyticsLoader = canonicalLoaderTag(analyticsVersion());

const clusterMeta = {
  paie: { label: 'Paie et coût employeur', cat: 'tax' },
  tva: { label: 'TVA et facturation', cat: 'tax' },
  pme: { label: 'PME et trésorerie', cat: 'business' },
  commerce: { label: 'Commerce et rentabilité', cat: 'business' },
  energie: { label: 'Énergie et investissement', cat: 'energy' },
  telecom: { label: 'Télécom et forfaits data', cat: 'technology' }
};

function esc(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function normalizeBuildOwnedArticleHtml(html) {
  let normalized = String(html)
    .replace(/\r\n/g, '\n')
    .replace(/\s+data-chat-bundle="[^"]*"/, '')
    .replace(/\?v=[a-f0-9]{8}(?=["'])/g, '')
    .replace(/^[ \t]*<script src="\/assets\/js\/analytics-bootstrap\.js(?:\?v=[a-f0-9]{8})?"[^>]*><\/script>[ \t]*\n?/gm, '')
    .replace(/^[ \t]*<script src="\/assets\/js\/lazy-analytics\.js(?:\?v=[a-f0-9]{8})?" defer><\/script>[ \t]*\n?/gm, '')
    .replace(/^[ \t]*<link rel="stylesheet" href="\/blog\/assets\/css\/blog-typography\.css(?:\?v=[a-f0-9]{8})?">[ \t]*\n?/gm, '');

  const routeLinks = [];
  normalized = normalized.replace(/^[ \t]*<link rel="(?:canonical|alternate)"[^>]*>[ \t]*\n?/gm, (link) => {
    routeLinks.push(link.trim());
    return '';
  });

  if (routeLinks.length) {
    const routeLinkBlock = `${routeLinks.join('\n')}\n`;
    normalized = normalized.replace(/(<meta name="author"[^>]*>\n)/, `$1${routeLinkBlock}`);
  }

  return normalized.replace(/\n{3,}/g, '\n\n');
}

function contentId(record) {
  const file = `fr/blog/${record.slug}/index.html`;
  return `blog:fr:${crypto.createHash('sha1').update(file).digest('hex').slice(0, 14)}`;
}

function publicationDate(record) {
  return record.published || data.published;
}

function reviewedLabel(record) {
  return record.reviewedLabel || data.reviewedLabel;
}

function faqItems(record) {
  return record.faq.map(([name, answer]) => ({ name, answer }));
}

function renderFaq(record) {
  return faqItems(record).map(({ name, answer }) => `<details class="faq-item"><summary>${esc(name)}</summary><p>${esc(answer)}</p></details>`).join('');
}

function renderInputTable(record) {
  return `<div class="table-wrap"><table><thead><tr><th>Bloc à documenter</th><th>Ce qu’il faut conserver</th></tr></thead><tbody>${record.inputs.map(([label, detail]) => `<tr><td><strong>${esc(label)}</strong></td><td>${esc(detail)}</td></tr>`).join('')}</tbody></table></div>`;
}

function renderSections(record) {
  return record.sections.map((section, index) => `<section id="detail-${index + 1}"><h2>${esc(section.title)}</h2>${section.paragraphs.map((paragraph) => `<p>${esc(paragraph)}</p>`).join('')}<ul>${section.bullets.map((bullet) => `<li>${esc(bullet)}</li>`).join('')}</ul></section>`).join('\n');
}

function articleBody(record) {
  return `<div class="article-lead"><p>${esc(record.opening)}</p></div>
<div class="key-takeaway"><h2 id="reponse-rapide">Réponse rapide</h2><p>${esc(record.quickAnswer)}</p></div>
<aside class="source-note"><strong>Sources relues le ${reviewedLabel(record)}.</strong> Les règles, tarifs, offres et paramètres peuvent changer. Rouvrez les sources officielles avant une décision, une déclaration, une facture ou un paiement.</aside>

<h2 id="pourquoi">Pourquoi ce calcul mérite une méthode</h2>
<p>${esc(record.whyItMatters)}</p>
<p>Le mot-clé retenu correspond à une tâche précise : ${esc(record.intent)}. L’article ne promet ni classement, ni résultat financier, ni conformité automatique. Il aide à constituer un dossier daté, à rendre les hypothèses visibles et à passer ensuite vers l’outil français AfroTools adapté.</p>

<h2 id="donnees">Les données à rassembler</h2>
${renderInputTable(record)}
<p>Marquez chaque valeur comme confirmée, estimée ou à vérifier. Conservez la devise, la période, la date et la source. Cette petite discipline empêche un ancien tarif, un plafond ou une condition promotionnelle de rester dans le modèle après son expiration.</p>

<h2 id="methode">Méthode pas à pas</h2>
<ol>${record.steps.map((step) => `<li>${esc(step)}</li>`).join('')}</ol>
<p>À chaque étape, prévoyez un point d’arrêt. Si la classification, le taux, le contrat, la qualité de la donnée ou la disponibilité du service n’est pas confirmée, suspendez la décision concernée. Une estimation honnête avec une limite visible vaut mieux qu’un chiffre précis construit sur une hypothèse cachée.</p>

${renderSections(record)}

<h2 id="erreurs">Erreurs fréquentes à éviter</h2>
<ul>${record.mistakes.map((mistake) => `<li>${esc(mistake)}</li>`).join('')}</ul>
<p>Effectuez enfin un contrôle de reproductibilité : une autre personne doit pouvoir retrouver le résultat à partir des mêmes entrées et des mêmes sources. Si elle ne le peut pas, ajoutez la date, l’unité ou la règle manquante avant de partager ou d’utiliser le calcul.</p>

<h2 id="outil">Passer au calculateur AfroTools en français</h2>
<p>${esc(record.toolUse)}</p>
<p>Ouvrez le <a href="${record.tool[0]}">${esc(record.tool[1])}</a>, saisissez uniquement les données nécessaires et gardez une copie datée lorsque l’outil propose un export. AfroTools ne soumet pas de déclaration, ne valide pas un contrat, ne remplace pas une administration et ne garantit pas le résultat commercial ou financier.</p>

<h2 id="journal">Le journal de décision à conserver</h2>
<p>Pour ce dossier ${esc(record.country)}, écrivez la décision recherchée en toutes lettres : ${esc(record.intent)}. Ajoutez le nom de la personne qui prépare les données, celle qui les vérifie, la date limite et la condition qui imposerait une nouvelle revue. Cette trace évite qu’un calcul exploratoire soit repris plusieurs semaines plus tard comme s’il décrivait encore le contrat, le tarif, le taux, la facture ou l’offre disponible.</p>
<p>Le choix éditorial de ce guide repose sur le constat suivant : ${esc(record.why)} Cela n’est pas une mesure de volume de recherche et ne prouve pas qu’une page se classera. Après publication, la bonne suite consiste à suivre l’indexation, les impressions, les requêtes réelles et les passages vers l’app française. Une mise à jour doit répondre à une évolution observée ou à une source nouvelle, jamais à un calendrier artificiel.</p>

<h2 id="sources">Sources vérifiées</h2>
<ul>${record.sources.map(([href, label]) => `<li><a href="${href}" target="_blank" rel="noopener">${esc(label)}</a></li>`).join('')}</ul>

<div class="article-cta"><h3>${esc(record.title)}</h3><p>Transformez les hypothèses du guide en calcul daté, puis faites vérifier les paramètres à fort enjeu.</p><a class="btn" href="${record.tool[0]}">Ouvrir l’outil en français &#8594;</a></div>

<h2 id="a-lire">Guides et outils liés</h2>
<ul>${record.related.map(([href, label]) => `<li><a href="${href}">${esc(label)}</a></li>`).join('')}</ul>

<section class="faq-section" id="faq"><h2 class="faq-section-title">Questions fréquentes</h2>${renderFaq(record)}</section>`;
}

function renderArticle(record) {
  const cluster = clusterMeta[record.cluster];
  if (!cluster) throw new Error(`${record.slug}: cluster inconnu ${record.cluster}`);
  const canonical = `https://afrotools.com/fr/blog/${record.slug}/`;
  const image = `https://afrotools.com/assets/img/tools/${record.image}.webp`;
  const body = articleBody(record);
  const wordCount = body.replace(/<[^>]+>/g, ' ').replace(/&[a-z0-9#]+;/gi, ' ').replace(/\s+/g, ' ').trim().split(' ').filter(Boolean).length;
  const readMinutes = Math.max(8, Math.ceil(wordCount / 190));
  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: record.title,
    description: record.description,
    author: { '@type': 'Organization', name: 'Équipe AfroTools', url: 'https://afrotools.com/fr/' },
    publisher: { '@type': 'Organization', name: 'AfroTools', url: 'https://afrotools.com/', logo: { '@type': 'ImageObject', url: 'https://afrotools.com/assets/img/logo-mark.svg' } },
    datePublished: publicationDate(record),
    dateModified: publicationDate(record),
    mainEntityOfPage: canonical,
    image,
    inLanguage: 'fr',
    wordCount
  };
  const breadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Accueil', item: 'https://afrotools.com/fr/' },
      { '@type': 'ListItem', position: 2, name: 'Guides', item: 'https://afrotools.com/fr/blog/' },
      { '@type': 'ListItem', position: 3, name: record.title }
    ]
  };
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqItems(record).map(({ name, answer }) => ({ '@type': 'Question', name, acceptedAnswer: { '@type': 'Answer', text: answer } }))
  };
  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="afrotools-content-id" content="${contentId(record)}">
<meta name="content-language" content="fr">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(record.title)} | AfroTools</title>
<meta name="description" content="${esc(record.description)}">
<meta name="robots" content="index, follow">
<meta name="author" content="AfroTools">
<link rel="canonical" href="${canonical}">
<link rel="alternate" hreflang="fr" href="${canonical}">
<link rel="alternate" hreflang="x-default" href="${canonical}">
<meta property="og:type" content="article"><meta property="og:url" content="${canonical}"><meta property="og:title" content="${esc(record.title)}"><meta property="og:description" content="${esc(record.description)}"><meta property="og:image" content="${image}"><meta property="og:site_name" content="AfroTools"><meta property="og:locale" content="fr_FR"><meta property="article:published_time" content="${publicationDate(record)}"><meta property="article:modified_time" content="${publicationDate(record)}"><meta property="article:section" content="${esc(record.category)}">
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${esc(record.title)}"><meta name="twitter:description" content="${esc(record.description)}"><meta name="twitter:image" content="${image}">
<link rel="icon" type="image/svg+xml" href="/assets/img/logo-mark.svg">
<link rel="stylesheet" href="/assets/css/tokens.min.css"><link rel="stylesheet" href="/assets/css/global.min.css"><link rel="stylesheet" href="/blog/assets/css/blog.css"><link rel="stylesheet" href="/blog/assets/css/blog-platform.css"><link rel="stylesheet" href="/assets/css/top-level-page-ui-refresh.css">
<script src="/assets/js/components/navbar.min.js" defer></script><script src="/assets/js/components/footer.min.js" defer></script>
<script type="application/ld+json">${JSON.stringify(articleSchema)}</script>
<script type="application/ld+json">${JSON.stringify(breadcrumb)}</script>
<script type="application/ld+json">${JSON.stringify(faqSchema)}</script>
</head>
<body class="top-level-page-ui-refresh">
<div class="reading-progress" id="readingProgress"></div><afro-navbar></afro-navbar>
<section class="article-hero"><div class="article-hero-inner"><nav class="breadcrumb" aria-label="Fil d’Ariane"><a href="/fr/">Accueil</a> <span class="sep">&#8250;</span> <a href="/fr/blog/">Guides</a> <span class="sep">&#8250;</span> ${esc(record.country)}</nav><span class="category-badge category-badge--${cluster.cat}">${esc(cluster.label)}</span><h1>${esc(record.title)}</h1><div class="article-meta-hero"><span>Équipe AfroTools</span><span class="dot"></span><time datetime="${publicationDate(record)}">${reviewedLabel(record)}</time><span class="dot"></span><span>${readMinutes} min de lecture</span></div></div></section>
<div class="article-featured-img"><div class="article-featured-img-inner"><img width="600" height="400" src="/assets/img/tools/${record.image}.webp" alt="${esc(record.title)}" loading="eager"></div></div>
<main class="article-layout"><nav class="article-toc" aria-label="Sommaire"><div class="article-toc-title">Dans ce guide</div><ol><li><a href="#reponse-rapide">Réponse rapide</a></li><li><a href="#donnees">Données</a></li><li><a href="#methode">Méthode</a></li><li><a href="#detail-1">Analyse détaillée</a></li><li><a href="#sources">Sources</a></li><li><a href="#faq">Questions</a></li></ol></nav><article class="article-body">${body}</article></main>
<afro-footer></afro-footer><script src="/blog/assets/js/blog-reading.js" defer></script>
${analyticsLoader}
</body></html>
`;
}

function expectedFrenchManifest(current) {
  const waveRows = data.articles.map((record) => ({
    slug: record.slug,
    category: record.category,
    description: record.description,
    image: record.image,
    published: publicationDate(record)
  }));
  const slugs = new Set(waveRows.map((row) => row.slug));
  return { ...current, title: 'Guides AfroTools en français', description: 'Guides pratiques en français reliés aux calculateurs, sources et démarches AfroTools.', articles: [...waveRows, ...current.articles.filter((row) => !slugs.has(row.slug))] };
}

function expectedContentManifest(current) {
  const waveRows = data.articles.map((record) => ({
    contentId: contentId(record),
    file: `fr/blog/${record.slug}/index.html`,
    slug: record.slug,
    locale: 'fr',
    category: record.category,
    publicationStatus: 'published'
  }));
  const files = new Set(waveRows.map((row) => row.file));
  return { ...current, articles: [...current.articles.filter((row) => !files.has(row.file)), ...waveRows] };
}

function renderReport() {
  const rows = [...data.articles]
    .sort((a, b) => b.opportunityScore - a.opportunityScore || a.slug.localeCompare(b.slug))
    .map((record, index) => `| ${index + 1} | ${record.keyword.replace(/\|/g, '\\|')} | ${record.opportunityScore} | ${record.opportunityConfidence} | ${record.cluster} | ${record.cannibalization.replace(/\|/g, '\\|')} | ${record.tool[0]} |`)
    .join('\n');
  const imageRows = data.articles
    .map((record) => `| ${record.slug} | \`/assets/img/tools/${record.image}.webp\` | ${record.title.replace(/\|/g, '\\|')} |`)
    .join('\n');
  return `# Explosion de contenu SEO français, portefeuille août 2026\n\nGénéré depuis \`data/content/blog-content-explosion-fr-wave1-2026-08.json\` et \`data/content/french-payroll-expansion-2026-08.json\` le ${data.reviewedLabel}.\n\n## Méthode et limites\n\n- Type de score : ${data.method.scoreType}.\n- Limite des données : ${data.method.dataGap}\n- Règle de sélection : ${data.method.selectionRule}\n- Le score sert à prioriser. Il ne garantit ni position, ni trafic, ni revenu.\n\n## ${data.articles.length} intentions retenues\n\n| Rang | Mot-clé principal | Score | Confiance | Cluster | Risque de cannibalisation | App française |\n| ---: | --- | ---: | --- | --- | --- | --- |\n${rows}\n\n## Pack visuel\n\nLes ${data.articles.length} visuels existent déjà dans la bibliothèque AfroTools. Aucun nouveau fichier image n'est requis pour publier ce portefeuille.\n\n| Article | Fichier réutilisé | Texte alternatif |\n| --- | --- | --- |\n${imageRows}\n\n## Contrat éditorial\n\nChaque article est original en français, possède une tâche distincte, au moins trois sources nommées, une date de revue, une app française active, des liens internes, des schémas Article, Breadcrumb et FAQ, ainsi qu'une section de limites. Les faits changeants doivent être revérifiés avant toute actualisation.\n\n## Cadence recommandée\n\nPublier les cinq extensions paie comme un ensemble cohérent est acceptable parce que les pages répondent à des signaux Search Console distincts, documentent leurs limites et transmettent vers les calculateurs existants. Mesurer ensuite l'indexation, les impressions, les clics et les passages vers l'app avant une nouvelle extension.\n`;
}

let mismatches = 0;
for (const record of data.articles) {
  const outputPath = path.join(root, 'fr', 'blog', record.slug, 'index.html');
  const expected = renderArticle(record);
  const current = fs.existsSync(outputPath) ? fs.readFileSync(outputPath, 'utf8') : '';
  if (normalizeBuildOwnedArticleHtml(current) !== normalizeBuildOwnedArticleHtml(expected)) {
    mismatches += 1;
    if (write) {
      fs.mkdirSync(path.dirname(outputPath), { recursive: true });
      fs.writeFileSync(outputPath, expected, 'utf8');
    } else console.error(`out of date: ${path.relative(root, outputPath)}`);
  }
}

const currentFrenchManifestText = fs.readFileSync(frenchManifestPath, 'utf8');
const nextFrenchManifestText = `${JSON.stringify(expectedFrenchManifest(JSON.parse(currentFrenchManifestText)), null, 2)}\n`;
if (currentFrenchManifestText !== nextFrenchManifestText) {
  mismatches += 1;
  if (write) fs.writeFileSync(frenchManifestPath, nextFrenchManifestText, 'utf8');
  else console.error('out of date: data/localization/fr-blog-manifest.json');
}

const currentContentManifestText = fs.readFileSync(contentManifestPath, 'utf8');
const nextContentManifestText = `${JSON.stringify(expectedContentManifest(JSON.parse(currentContentManifestText)), null, 2)}\n`;
if (currentContentManifestText !== nextContentManifestText) {
  mismatches += 1;
  if (write) fs.writeFileSync(contentManifestPath, nextContentManifestText, 'utf8');
  else console.error('out of date: data/content/blog-article-manifest.json');
}

const expectedReport = renderReport();
const currentReport = fs.existsSync(reportPath) ? fs.readFileSync(reportPath, 'utf8') : '';
if (currentReport !== expectedReport) {
  mismatches += 1;
  if (write) fs.writeFileSync(reportPath, expectedReport, 'utf8');
  else console.error('out of date: reports/blog-seo-opportunities-fr-wave1-2026-08.md');
}

if (mismatches && !write) process.exitCode = 1;
console.log(`${write ? 'built' : 'checked'} ${data.articles.length} French wave-one articles; ${mismatches} file(s) ${write ? 'updated' : 'out of date'}`);
