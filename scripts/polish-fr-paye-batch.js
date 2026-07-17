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

function replaceAllExact(html, pairs) {
  for (const [search, replacement] of pairs) {
    html = html.split(search).join(replacement);
  }
  return html;
}

function setHeadMeta(html, page, misses) {
  html = replaceOne(
    html,
    /<title>[\s\S]*?<\/title>/,
    `<title>${page.title}</title>`,
    `${page.file}: <title>`,
    misses
  );

  html = replaceOne(
    html,
    /<meta name="description" content="[^"]*">/i,
    `<meta name="description" content="${page.description}">`,
    `${page.file}: meta description`,
    misses
  );

  html = replaceOne(
    html,
    /<meta property="og:title" content="[^"]*">/i,
    `<meta property="og:title" content="${page.ogTitle}">`,
    `${page.file}: og:title`,
    misses
  );

  if (/<meta property="og:description" content="[^"]*">/i.test(html)) {
    html = replaceOne(
      html,
      /<meta property="og:description" content="[^"]*">/i,
      `<meta property="og:description" content="${page.ogDescription}">`,
      `${page.file}: og:description`,
      misses
    );
  } else {
    html = replaceOne(
      html,
      /<meta property="og:title" content="[^"]*">/i,
      `<meta property="og:title" content="${page.ogTitle}"><meta property="og:description" content="${page.ogDescription}">`,
      `${page.file}: inject og:description`,
      misses
    );
  }

  return html;
}

function replaceLastFaqSection(html, replacement, label, misses) {
  const pattern = /<!-- FAQ -->[\s\S]*?<\/section>/g;
  const matches = [...html.matchAll(pattern)];
  if (!matches.length) {
    misses.push(label);
    return html;
  }

  let updated = html;
  for (let i = matches.length - 1; i >= 0; i--) {
    const match = matches[i];
    const start = match.index;
    const end = start + match[0].length;
    updated = updated.slice(0, start) + (i === matches.length - 1 ? replacement.trim() : '') + updated.slice(end);
  }
  return updated;
}

function replaceJsonLdByType(html, type, data, label, misses) {
  const block = `<script type="application/ld+json">${JSON.stringify(data)}</script>`;
  return replaceOne(
    html,
    new RegExp(`<script type="application/ld\\\\+json">[\\\\s\\\\S]*?"@type"\\\\s*:\\\\s*"${type}"[\\\\s\\\\S]*?<\\\\/script>`, 'i'),
    block,
    label,
    misses
  );
}

function setSeoMeta(html, page, seo, misses) {
  const pageUrl = `https://afrotools.com/${page.file.replace(/index\\.html$/, '').replace(/\\.html$/, '/')}`;
  const countryDir = path.posix.dirname(page.file).replace(/\\/g, '/');
  const countryUrl = `https://afrotools.com/${countryDir}/`;
  const schemaName = (seo.schemaName || page.ogTitle).replace(' | AfroTools', '');
  const imageName = `${path.posix.basename(page.file, '.html')}.webp`;
  const imageUrl = `https://afrotools.com/assets/img/tools/${imageName}`;

  html = replaceOne(
    html,
    /<meta name="twitter:title" content="[^"]*">/i,
    `<meta name="twitter:title" content="${seo.twitterTitle || page.ogTitle}">`,
    `${page.file}: twitter:title`,
    misses
  );

  html = replaceOne(
    html,
    /<meta name="twitter:description" content="[^"]*">/i,
    `<meta name="twitter:description" content="${seo.twitterDescription || page.ogDescription}">`,
    `${page.file}: twitter:description`,
    misses
  );

  html = replaceJsonLdByType(
    html,
    'BreadcrumbList',
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'AfroTools', item: 'https://afrotools.com/fr/' },
        { '@type': 'ListItem', position: 2, name: seo.countryNameFr, item: countryUrl },
        { '@type': 'ListItem', position: 3, name: schemaName, item: pageUrl },
      ],
    },
    `${page.file}: BreadcrumbList`,
    misses
  );

  html = replaceJsonLdByType(
    html,
    'WebApplication',
    {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: schemaName,
      description: seo.schemaDescription || page.description,
      url: pageUrl,
      inLanguage: 'fr',
      applicationCategory: 'FinanceApplication',
      operatingSystem: 'Web',
      browserRequirements: 'Requires JavaScript',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      author: { '@type': 'Organization', name: 'AfroTools', url: 'https://afrotools.com' },
      image: imageUrl,
    },
    `${page.file}: WebApplication`,
    misses
  );

  html = replaceJsonLdByType(
    html,
    'WebPage',
    {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: schemaName,
      url: pageUrl,
      description: seo.schemaDescription || page.description,
      inLanguage: 'fr',
      isPartOf: { '@type': 'WebSite', name: 'AfroTools', url: 'https://afrotools.com' },
      image: imageUrl,
    },
    `${page.file}: WebPage`,
    misses
  );

  if (seo.faqSchema) {
    html = replaceJsonLdByType(
      html,
      'FAQPage',
      {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: seo.faqSchema.map((entry) => ({
          '@type': 'Question',
          name: entry.q,
          acceptedAnswer: { '@type': 'Answer', text: entry.a },
        })),
      },
      `${page.file}: FAQPage`,
      misses
    );
  }

  return html;
}

const commonPairs = [
  ['Skip to main content', 'Aller au contenu principal'],
  ['Home</a>', 'Accueil</a>'],
  ['Save to My Tools', 'Enregistrer dans Mes outils'],
  ['Save this calculator', 'Enregistrer ce calculateur'],
  ['Download PDF', 'Télécharger le PDF'],
  ['Download Your PAYE Summary', 'Téléchargez votre récapitulatif PAYE'],
  ['Get My PDF →', 'Obtenir mon PDF →'],
  ['No thanks', 'Non merci'],
  ['PDF opening', 'Ouverture du PDF'],
  ['PDF opening now', 'Ouverture du PDF'],
  ['Tax &amp; Finance', 'Impôts &amp; finance'],
  ['Calculations', 'Calculs'],
  ['Rating', 'Note'],
  ['Free', 'Gratuit'],
  ['Forever', 'Toujours'],
  ['<!DOCTYPE html><html lang="en"', '<!DOCTYPE html><html lang="fr"'],
  ['Link copied to clipboard', 'Lien copié dans le presse-papiers'],
  ['Link copied!', 'Lien copié !'],
  ['My Result', 'Mon résultat'],
  ['Calculate yours FREE 👇', 'Calculez le vôtre GRATUITEMENT 👇'],
  ['Click <strong>Save as PDF</strong> in the print dialog.', 'Cliquez sur <strong>Enregistrer en PDF</strong> dans la boîte d’impression.'],
  ['Done →', 'Fermer →'],
  ['Monthly Gross', 'Salaire brut mensuel'],
  ['Monthly gross:', 'Salaire brut mensuel :'],
  ['Calculate first →', 'Calculez d’abord →'],
  ['Click <strong>Save as PDF</strong>.', 'Cliquez sur <strong>Enregistrer en PDF</strong>.'],
  ['✓ Copied!', '✓ Copié !'],
  ['Summary 2025/26', 'Résumé 2025/26'],
  ['A titre informatif uniquement', 'À titre informatif uniquement'],
  ['For informational purposes only.', 'À titre informatif uniquement.'],
  ['Not professional tax or legal advice.', 'Ceci ne constitue pas un conseil fiscal ou juridique professionnel.'],
  ['Not professional tax advice.', 'Ceci ne constitue pas un conseil fiscal professionnel.'],
  ['Give: 1)', 'Donnez : 1)'],
  ['Plain English summary', 'Résumé clair en français'],
  ['Under 200 words.', 'Moins de 200 mots.'],
  ['Under 150 words, no markdown.', 'Moins de 150 mots. Pas de markdown.'],
  ['No markdown, no asterisks, no bullet symbols.', 'Pas de markdown, pas d’astérisques, pas de puces.'],
  ['No markdown, no asterisks.', 'Pas de markdown, pas d’astérisques.'],
  ['No markdown.', 'Pas de markdown.'],
  ['You are AfroTools AI Tax Advisor specialising in', 'Vous êtes le conseiller fiscal IA d’AfroTools spécialisé dans'],
  ['AfroTools AI Tax Advisor, ', 'Conseiller fiscal IA AfroTools, '],
  ['Be concise, specific, practical.', 'Soyez concis, précis et pratique.'],
  ['Answer concisely.', 'Répondez avec concision.'],
  ['Concise. No markdown.', 'Réponse concise. Pas de markdown.'],
  ['AI temporarily unavailable.', 'IA temporairement indisponible.'],
  ['Try Again', 'Réessayer'],
  ['Analysing…', 'Analyse…'],
  ['Ask below ↓', 'Posez votre question ci-dessous ↓'],
  ['Unable to generate.', 'Impossible de générer une réponse.'],
  ['Unable to respond.', 'Impossible de répondre pour le moment.'],
  ['Network error.', 'Erreur réseau.'],
  ['Verify with official sources.', 'Vérifiez avec les sources officielles.'],
  ['Take-home', 'Net'],
  ['effective rate', 'taux effectif'],
  ['All Countries', 'Tous les pays'],
  ['Get AI Tax Analysis →', 'Obtenir l’analyse fiscale IA →'],
  ['Enter a valid salary', 'Entrez un salaire valide'],
  ['Brut Salary', 'Salaire brut'],
  ['Net taxable income', 'Revenu imposable'],
  ['Total Deductions', 'Total des déductions'],
  ['Deductions', 'Déductions'],
  ['Monthly PAYE', 'PAYE mensuel'],
  ['Effective Rate', 'Taux effectif'],
  ['Income tax (PAYE)', 'Impôt sur le revenu (PAYE)'],
  ['Monthly Taxable Income', 'Revenu imposable mensuel'],
  ['Income in 0% band', 'Revenu dans la tranche à 0 %'],
  ['Monthly Taxable Income (gross less NASSIT)', 'Revenu imposable mensuel (brut moins NASSIT)'],
  ['Income in 0% band — no PAYE due', 'Revenu dans la tranche à 0 % — aucun PAYE dû'],
  ['Section 2 — PAYE Computation (NRA 2025/26)', 'Section 2 — Calcul PAYE (NRA 2025/26)'],
  ['Section 1 — Monthly Income &amp; Deductions', 'Section 1 — Revenus mensuels et déductions'],
  ['Section 1 — Annual Income &amp; Deductions', 'Section 1 — Revenus annuels et déductions'],
  ['After PAYE, Pension &amp; all deductions', 'Après PAYE, pension et toutes les déductions'],
  ['After PAYE, NASSIT &amp; all deductions', 'Après PAYE, NASSIT et toutes les déductions'],
  ['Secondary Employment', 'Emploi secondaire'],
  ['Taux fixe 30% no deductions', 'Taux fixe 30 % sans déductions'],
  ['monthly take-home salary after PAYE', 'salaire net mensuel après PAYE'],
  ['Section 3 — Monthly Salaire Net Summary', 'Section 3 — Synthèse mensuelle du salaire net'],
  ['Section 3 — Annual Salaire Net Summary', 'Section 3 — Synthèse annuelle du salaire net'],
  ['Total Monthly Deductions', 'Total mensuel des déductions'],
  ['Total Annual Deductions', 'Total annuel des déductions'],
  ['Unable to generate analysis.', 'Impossible de générer l’analyse.'],
  ['AI analysis temporarily unavailable.', 'Analyse IA temporairement indisponible.'],
  ['Analysing...', 'Analyse…'],
  ['Analysis complete', 'Analyse terminée'],
  ['Thinking...', 'Réflexion…'],
  ['No response.', 'Pas de réponse.'],
  ['Calculated at afrotools.com/', 'Calculé sur afrotools.com/'],
  ['My PAYE', 'Mon PAYE'],
  [' breakdown:', ' récapitulatif :'],
  ['Gross ', 'Brut '],
  ['Partager le resultat', 'Partager le résultat'],
  ['Benin PAYE', 'PAYE Bénin'],
  ['Djibouti PAYE', 'PAYE Djibouti'],
  ['Ethiopia PAYE', 'PAYE Éthiopie'],
  ['Liberia PAYE', 'PAYE Libéria'],
  ['Madagascar PAYE', 'PAYE Madagascar'],
  ['Sierra Leone PAYE', 'PAYE Sierra Leone'],
  ['Uganda PAYE', 'PAYE Ouganda'],
  ['Above MGA 600,000/mo', 'Au-dessus de MGA 600,000/mo'],
  ['afrotools.com/benin/bj-paye', 'afrotools.com/fr/benin/bj-paye'],
  ['https://afrotools.com/benin/bj-paye', 'https://afrotools.com/fr/benin/bj-paye'],
  ['afrotools.com/djibouti/dj-paye', 'afrotools.com/fr/djibouti/dj-paye'],
  ['https://afrotools.com/djibouti/dj-paye', 'https://afrotools.com/fr/djibouti/dj-paye'],
  ['afrotools.com/ethiopia/et-paye', 'afrotools.com/fr/ethiopia/et-paye'],
  ['https://afrotools.com/ethiopia/et-paye', 'https://afrotools.com/fr/ethiopia/et-paye'],
  ['afrotools.com/liberia/lr-paye', 'afrotools.com/fr/liberia/lr-paye'],
  ['https://afrotools.com/liberia/lr-paye', 'https://afrotools.com/fr/liberia/lr-paye'],
  ['afrotools.com/madagascar/mg-paye', 'afrotools.com/fr/madagascar/mg-paye'],
  ['https://afrotools.com/madagascar/mg-paye', 'https://afrotools.com/fr/madagascar/mg-paye'],
  ['afrotools.com/sierra-leone/sl-paye', 'afrotools.com/fr/sierra-leone/sl-paye'],
  ['https://afrotools.com/sierra-leone/sl-paye', 'https://afrotools.com/fr/sierra-leone/sl-paye'],
  ['afrotools.com/uganda/ug-paye', 'afrotools.com/fr/uganda/ug-paye'],
  ['https://afrotools.com/uganda/ug-paye', 'https://afrotools.com/fr/uganda/ug-paye'],
  ['Calculate →', 'Calculer →'],
  ['Monthly Take-Home', 'Net mensuel'],
  ['Monthly take-home', 'Net mensuel'],
  ['Employer Cost:', 'Coût employeur :'],
  ['/year', '/an'],
  ['/month', '/mois'],
  ['Employee gross salary', 'Salaire brut du salarié'],
  ['Total Employer Monthly Cost', 'Coût total employeur mensuel'],
  ['Total Employer Annual Cost', 'Coût total employeur annuel'],
  ['Employee NSSF contribution', 'Cotisation NSSF salariale'],
  ['Employer NSSF contribution', 'Cotisation NSSF employeur'],
  ['Local Service Tax (LST)', 'Taxe locale sur les services (LST)'],
  ['Employee NASSIT contribution', 'Cotisation NASSIT salariale'],
  ['Employer NASSIT contribution', 'Cotisation NASSIT employeur'],
  ['Employee NASSCORP', 'NASSCORP salarié'],
  ['Employer NASSCORP', 'NASSCORP employeur'],
  ['Employee Pension (all sectors)', 'Pension salariale (tous secteurs)'],
  ['Employer Pension (all sectors)', 'Pension employeur (tous secteurs)'],
  ['Pension Fund (7%)', 'Caisse de pension (7 %)'],
  ['Employee — tax-deductible', 'Salarié — déductible fiscalement'],
  ['5% employee — deductible before PAYE', '5 % salarié — déductible avant PAYE'],
  ['Calculated monthly on taxable income after the employee pension deduction. Pension is tax-deductible. Per Proclamation 1395/2025.', 'Calcul mensuel sur le revenu imposable après déduction de la pension salariale. La pension est déductible fiscalement. Selon la proclamation 1395/2025.'],
  ['Pension employee contribution (7%) is fully deductible from taxable income before PAYE is calculated. Employer Pension (11%) is an additional cost shown in employer chart. This reduces your tax liability.', 'La cotisation salariale de pension (7 %) est entièrement déductible du revenu imposable avant le calcul du PAYE. La pension employeur (11 %) est un coût supplémentaire affiché dans le graphique employeur. Cela réduit votre charge fiscale.'],
  ['Pension Fund contributions are mandatory. Employee contribution IS fully deductible from taxable income before PAYE calculation. Remit by 10th of following month. Per Proclamation 1395/2025, first ETB 2,000/month of taxable income is exempt.', 'Les cotisations à la caisse de pension sont obligatoires. La part salariale est entièrement déductible du revenu imposable avant le calcul du PAYE. Le versement doit intervenir au plus tard le 10 du mois suivant. Selon la proclamation 1395/2025, les premiers ETB 2,000/mois de revenu imposable sont exonérés.'],
  ["NASSCORP's current employer guide states a combined 10% contribution: 6% funded by the employer and 4% withheld from the employee. No separate SDL or WCF was modeled in this Liberia calculator.", "Le guide employeur actuel de la NASSCORP retient une cotisation totale de 10 % : 6 % financés par l’employeur et 4 % retenus sur le salarié. Aucun SDL ni WCF séparé n’est modélisé dans ce calculateur du Libéria."],
  ["NASSIT employee contribution (5%) is deducted before PAYE is calculated. Employer NASSIT (10%) is an additional cost shown in the employer chart. This page uses Sierra Leone's post-redenomination SLE amounts.", "La cotisation salariale NASSIT (5 %) est déduite avant le calcul du PAYE. La NASSIT employeur (10 %) est un coût supplémentaire affiché dans le graphique employeur. Cette page utilise les montants SLE post-redénomination de Sierra Leone."],
  ['Monthly bands shown in post-redenomination SLE. Employee NASSIT is deducted before PAYE is computed, in line with NRA guidance.', 'Les tranches mensuelles ci-dessus sont exprimées en SLE après la redénomination. La NASSIT salariale est déduite avant le calcul du PAYE, conformément aux indications de la NRA.'],
  ['Net income in Uganda depends on your gross salary, NSSF (5%), PAYE tax bands, and Local Service Tax annual bands based on monthly take-home after PAYE.', 'Le revenu net en Ouganda dépend de votre salaire brut, de la NSSF (5 %), des tranches PAYE et des tranches annuelles de Local Service Tax calculées sur le salaire net mensuel après PAYE.'],
  ["Entrez votre email pour obtenir un PDF détaillé — we'll notify you when Uganda tax rates change.", "Entrez votre email pour obtenir un PDF détaillé — nous vous préviendrons lorsque les taux fiscaux en Ouganda changeront."],
  ['Bookmark PAYE Djibouti to your personal dashboard for quick access anytime.', 'Ajoutez PAYE Djibouti à votre tableau de bord personnel pour y revenir rapidement à tout moment.'],
  ['Bookmark PAYE Éthiopie to your personal dashboard for quick access anytime.', 'Ajoutez PAYE Éthiopie à votre tableau de bord personnel pour y revenir rapidement à tout moment.'],
  ['Bookmark PAYE Ouganda to your personal dashboard for quick access anytime.', 'Ajoutez PAYE Ouganda à votre tableau de bord personnel pour y revenir rapidement à tout moment.'],
  ['Create a free account to bookmark tools, track calculations, and access your dashboard.', 'Créez un compte gratuit pour enregistrer des outils, suivre vos calculs et accéder à votre tableau de bord.'],
  ['Rates based on ', 'Taux basés sur '],
  ['Verify with ', 'Vérifiez auprès de '],
  ['qualified Beninese tax advisor', 'conseiller fiscal qualifié au Bénin'],
  ['qualified Ethiopian tax advisor', 'conseiller fiscal qualifié en Éthiopie'],
  ['qualified Liberian tax advisor', 'conseiller fiscal qualifié au Libéria'],
  ['qualified Sierra Leonean tax advisor', 'conseiller fiscal qualifié en Sierra Leone'],
  ['qualified Ugandan tax advisor (CPA)', 'conseiller fiscal qualifié en Ouganda (CPA)'],
  ['qualified Ugandan tax advisor', 'conseiller fiscal qualifié en Ouganda'],
];

const postPolishPairsByFile = {
  'fr/benin/bj-paye.html': [
    [
      "<p class=\"f-note\">CNPS employee contribution (2.5%) is fully deductible from taxable income before DGI is calculated. Employer CNPS (9.5%) is an additional cost shown in employer chart.</p>",
      "<p class=\"f-note\">La cotisation CNPS salariale (2,5 %) est entièrement déductible du revenu imposable avant le calcul de la DGI. La CNPS employeur (9,5 %) constitue un coût supplémentaire présenté dans le graphique employeur.</p>",
    ],
    [
      "<span class=\"card-title\">CNPS Contribution Rates</span>",
      "<span class=\"card-title\">Taux de cotisation CNPS</span>",
    ],
    [
      "<div class=\"band-row\"><span class=\"band-range\">Employee CNPS</span><span class=\"band-rate\">2.5% of gross (no cap)</span></div>",
      "<div class=\"band-row\"><span class=\"band-range\">CNPS salarié</span><span class=\"band-rate\">2,5 % du brut (sans plafond)</span></div>",
    ],
    [
      "<div class=\"band-row\"><span class=\"band-range\">Employer CNPS</span><span class=\"band-rate\">9.5% of gross (no cap)</span></div>",
      "<div class=\"band-row\"><span class=\"band-range\">CNPS employeur</span><span class=\"band-rate\">9,5 % du brut (sans plafond)</span></div>",
    ],
    [
      "<strong>Disclaimer:</strong> For informational purposes only. Not professional tax or legal advice. Rates based on Beninese DGI regulations and CNPS Act. Verify with DGI (impots.finances.gouv.bj) or a qualified Beninese tax advisor.",
      "<strong>Clause de non-responsabilité :</strong> À titre informatif uniquement. Ceci ne constitue pas un conseil fiscal ou juridique professionnel. Taux basés sur la réglementation de la DGI béninoise et les règles CNPS. Vérifiez avec la DGI (impots.finances.gouv.bj) ou un conseiller fiscal qualifié au Bénin.",
    ],
    [
      "  strip.innerHTML = `<strong>Cout total employeur : ${fmt(RESULT.totalEmployerCostAnnual)}/year</strong><br>Gross + employer CNPS ${fmt(empCNPSCost)}/year (9.5%). VPS and other employer payroll items are excluded from this estimate.`;",
      "  strip.innerHTML = `<strong>Coût total employeur : ${fmt(RESULT.totalEmployerCostAnnual)}/an</strong><br>Brut + CNPS employeur ${fmt(empCNPSCost)}/an (9,5 %). Le VPS et les autres charges patronales ne sont pas inclus dans cette estimation.`;",
    ],
    [
      "    <tr><td>Employer CNPS (9.5%)</td><td class=\"num red\">XOF ${Math.round(R.empCNPSCost).toLocaleString()}</td></tr>",
      "    <tr><td>CNPS employeur (9,5 %)</td><td class=\"num red\">XOF ${Math.round(R.empCNPSCost).toLocaleString()}</td></tr>",
    ],
    [
      "      <div style=\"font-size:6.5pt;color:#9ca3af;max-width:440px;line-height:1.4;margin-top:4px\">À titre informatif uniquement. Not professional tax advice. Verify with DGI (impots.finances.gouv.bj) or a qualified Beninese tax advisor.</div>",
      "      <div style=\"font-size:6.5pt;color:#9ca3af;max-width:440px;line-height:1.4;margin-top:4px\">À titre informatif uniquement. Ceci ne constitue pas un conseil fiscal professionnel. Vérifiez avec la DGI (impots.finances.gouv.bj) ou un conseiller fiscal qualifié au Bénin.</div>",
    ],
  ],
  'fr/djibouti/dj-paye.html': [
    [
      "                <div><div class=\"tog-label\">Social Security</div><div class=\"tog-rate\">4% salarie — deductible fiscalement</div></div>",
      "                <div><div class=\"tog-label\">Sécurité sociale</div><div class=\"tog-rate\">4 % salarié — déductible fiscalement</div></div>",
    ],
    [
      "          <div class=\"res-hero-period\">After IRPP, social security &amp; deductions</div>",
      "          <div class=\"res-hero-period\">Après IRPP, sécurité sociale et déductions</div>",
    ],
    [
      "        <div class=\"card-head\" onclick=\"toggleBands(this)\"><span class=\"card-title\">Social Security Rates</span><span class=\"tog-arrow\">▾</span></div>",
      "        <div class=\"card-head\" onclick=\"toggleBands(this)\"><span class=\"card-title\">Taux de sécurité sociale</span><span class=\"tog-arrow\">▾</span></div>",
    ],
    [
      "        <strong>Disclaimer:</strong> For informational purposes. Not professional tax advice. Verify with official sources.",
      "        <strong>Clause de non-responsabilité :</strong> À titre informatif uniquement. Ceci ne constitue pas un conseil fiscal professionnel. Vérifiez avec les sources officielles.",
    ],
  ],
  'fr/ethiopia/et-paye.html': [
    [
      "      <a href=\"/fr/\">Accueil</a> / <a href=\"/fr/ethiopia/\">🇪🇹 Ethiopia</a> / <span>Calculateur PAYE</span>",
      "      <a href=\"/fr/\">Accueil</a> / <a href=\"/fr/ethiopia/\">🇪🇹 Éthiopie</a> / <span>Calculateur PAYE</span>",
    ],
    [
      "          <span class=\"card-sub\">Ethiopian Birr · ETB</span>",
      "          <span class=\"card-sub\">Birr éthiopien · ETB</span>",
    ],
    [
      "            <div class=\"f-label\"><span class=\"f-label-text\">Employment Sector</span><span class=\"f-hint\">Determines pension fund type</span></div>",
      "            <div class=\"f-label\"><span class=\"f-label-text\">Secteur d’emploi</span><span class=\"f-hint\">Détermine le type de caisse de pension</span></div>",
    ],
    [
      "              <button class=\"sec-btn on\" id=\"btnPrivate\" onclick=\"setSector('private',this)\">Private Sector</button>",
      "              <button class=\"sec-btn on\" id=\"btnPrivate\" onclick=\"setSector('private',this)\">Secteur privé</button>",
    ],
    [
      "              <button class=\"sec-btn\" id=\"btnPublic\" onclick=\"setSector('public',this)\">Public Sector</button>",
      "              <button class=\"sec-btn\" id=\"btnPublic\" onclick=\"setSector('public',this)\">Secteur public</button>",
    ],
    [
      "          <p class=\"ai-status\" id=\"aiStatus\">Calculez d'abord votre salaire — I'll analyse your ERCA PAYE position, explain pension deductibility, and give specific tips for Ethiopian tax optimisation.</p>",
      "          <p class=\"ai-status\" id=\"aiStatus\">Calculez d’abord votre salaire — j’analyserai ensuite votre situation PAYE auprès de l’ERCA, la déductibilité de la pension et les points d’optimisation fiscale utiles en Éthiopie.</p>",
    ],
    [
      "        <strong>Disclaimer:</strong> For informational purposes only. Not professional tax or legal advice. Rates based on Ethiopia Impôt sur le Revenu Proclamation No. 1395/2025, Cotisation de Pension Regulations. Verify with ERCA (erca.gov.et) or a qualified Ethiopian tax advisor.",
      "        <strong>Clause de non-responsabilité :</strong> À titre informatif uniquement. Ceci ne constitue pas un conseil fiscal ou juridique professionnel. Taux basés sur la proclamation éthiopienne d’impôt sur le revenu n° 1395/2025 et les règles de pension. Vérifiez avec l’ERCA (erca.gov.et) ou un conseiller fiscal qualifié en Éthiopie.",
    ],
    [
      "      <p>Entrez votre email pour obtenir un PDF détaillé — we'll notify you when Ethiopia tax rates change.</p>",
      "      <p>Entrez votre email pour obtenir un PDF détaillé — nous vous préviendrons lorsque les taux fiscaux éthiopiens changeront.</p>",
    ],
    [
      "          <p class=\"ng-save-desc\">Bookmark Ethiopia PAYE to your personal dashboard for quick access anytime.</p>",
      "          <p class=\"ng-save-desc\">Ajoutez le calculateur PAYE Éthiopie à votre tableau de bord personnel pour y revenir rapidement à tout moment.</p>",
    ],
    [
      "      <div style=\"font-size:6.5pt;color:#9ca3af;max-width:440px;line-height:1.4;margin-top:4px\">À titre informatif uniquement. Not professional tax advice. Verify with ERCA (erca.gov.et) or a qualified Ethiopian tax advisor. Proclamation 1395/2025 status pending.</div>",
      "      <div style=\"font-size:6.5pt;color:#9ca3af;max-width:440px;line-height:1.4;margin-top:4px\">À titre informatif uniquement. Ceci ne constitue pas un conseil fiscal professionnel. Vérifiez avec l’ERCA (erca.gov.et) ou un conseiller fiscal qualifié en Éthiopie. Statut de la proclamation 1395/2025 à confirmer.</div>",
    ],
  ],
  'fr/liberia/lr-paye.html': [
    [
      "            <div class=\"f-label\"><span class=\"f-label-text\">Sector</span><span class=\"f-hint\">Determines social security fund</span></div>",
      "            <div class=\"f-label\"><span class=\"f-label-text\">Secteur</span><span class=\"f-hint\">Détermine le régime de sécurité sociale</span></div>",
    ],
    [
      "              <button class=\"sec-btn on\" id=\"btnPrivate\" onclick=\"setSector('private',this)\">Private (NASSCORP)</button>",
      "              <button class=\"sec-btn on\" id=\"btnPrivate\" onclick=\"setSector('private',this)\">Privé (NASSCORP)</button>",
    ],
    [
      "    <tr><td><span class=\"src\">NASSCORP</span>Social Security</td><td style=\"color:#6b7280;font-size:8pt\">Current employer guide states a combined 10% contribution: 6% employer and 4% employee. No upper cap modeled here.</td></tr>",
      "    <tr><td><span class=\"src\">NASSCORP</span>Sécurité sociale</td><td style=\"color:#6b7280;font-size:8pt\">Le guide employeur actuel retient une cotisation totale de 10 % : 6 % employeur et 4 % salarié. Aucun plafond supérieur n’est modélisé ici.</td></tr>",
    ],
    [
      "        <strong>Disclaimer:</strong> For informational purposes only. Not professional tax or legal advice. Rates based on the Liberia Revenue Code and NASSCORP employer guidance. Verify with LRA or a qualified Liberian tax advisor.",
      "        <strong>Clause de non-responsabilité :</strong> À titre informatif uniquement. Ceci ne constitue pas un conseil fiscal ou juridique professionnel. Taux basés sur le Liberia Revenue Code et le guide employeur NASSCORP. Vérifiez avec la LRA ou un conseiller fiscal qualifié au Libéria.",
    ],
    [
      "      <div style=\"font-size:6.5pt;color:#9ca3af;max-width:440px;line-height:1.4;margin-top:4px\">À titre informatif uniquement. Not professional tax advice. Verify with LRA (lra.gov.lr) or a qualified Liberian tax advisor.</div>",
      "      <div style=\"font-size:6.5pt;color:#9ca3af;max-width:440px;line-height:1.4;margin-top:4px\">À titre informatif uniquement. Ceci ne constitue pas un conseil fiscal professionnel. Vérifiez avec la LRA (lra.gov.lr) ou un conseiller fiscal qualifié au Libéria.</div>",
    ],
    [
      "- Sector: ${R.sector === 'private' ? 'Private (NASSCORP)' : 'Public (NASSCORP)'}",
      "- Secteur : ${R.sector === 'private' ? 'Privé (NASSCORP)' : 'Public (NASSCORP)'}",
    ],
  ],
  'fr/sierra-leone/sl-paye.html': [
    [
      "            <div class=\"f-label\"><span class=\"f-label-text\">Sector</span><span class=\"f-hint\">Determines social security fund</span></div>",
      "            <div class=\"f-label\"><span class=\"f-label-text\">Secteur</span><span class=\"f-hint\">Détermine le régime de sécurité sociale</span></div>",
    ],
    [
      "              <button class=\"sec-btn on\" id=\"btnPrivate\" onclick=\"setSector('private',this)\">Private (NASSIT)</button>",
      "              <button class=\"sec-btn on\" id=\"btnPrivate\" onclick=\"setSector('private',this)\">Privé (NASSIT)</button>",
    ],
    [
      "          <span class=\"card-title\">NASSIT Social Security Rates 2025</span>",
      "          <span class=\"card-title\">Taux NASSIT 2025</span>",
    ],
    [
      "          <p class=\"band-note\">NASSIT (National Social Security and Insurance Trust) covers all formal sector workers. The employee 5% contribution is deductible before PAYE is computed. NASSIT and PAYE are remitted separately.</p>",
      "          <p class=\"band-note\">La NASSIT (National Social Security and Insurance Trust) couvre les travailleurs du secteur formel. La cotisation salariale de 5 % est déductible avant le calcul du PAYE. Les versements NASSIT et PAYE sont effectués séparément.</p>",
    ],
    [
      "    <tr><td><span class=\"src\">NASSIT Act</span>NASSIT</td><td style=\"color:#6b7280;font-size:8pt\">Total 15% of gross: 5% employee + 10% employer. No upper cap. National Social Security and Insurance Trust. Due monthly.</td></tr>",
      "    <tr><td><span class=\"src\">NASSIT Act</span>NASSIT</td><td style=\"color:#6b7280;font-size:8pt\">Total de 15 % du brut : 5 % salarié + 10 % employeur. Aucun plafond supérieur. National Social Security and Insurance Trust. Paiement mensuel.</td></tr>",
    ],
    [
      "        <strong>Disclaimer:</strong> For informational purposes only. Not professional tax or legal advice. Rates based on Sierra Leone Impôt sur le Revenu Act 2000. Verify with NRA (nra.gov.sl) or a qualified Sierra Leonean tax advisor.",
      "        <strong>Clause de non-responsabilité :</strong> À titre informatif uniquement. Ceci ne constitue pas un conseil fiscal ou juridique professionnel. Taux basés sur la loi fiscale de Sierra Leone et les règles PAYE en vigueur. Vérifiez avec la NRA (nra.gov.sl) ou un conseiller fiscal qualifié en Sierra Leone.",
    ],
    [
      "      <div style=\"font-size:6.5pt;color:#9ca3af;max-width:440px;line-height:1.4;margin-top:4px\">À titre informatif uniquement. Not professional tax advice. Verify with NRA (nra.gov.sl) or a qualified Sierra Leonean tax advisor.</div>",
      "      <div style=\"font-size:6.5pt;color:#9ca3af;max-width:440px;line-height:1.4;margin-top:4px\">À titre informatif uniquement. Ceci ne constitue pas un conseil fiscal professionnel. Vérifiez avec la NRA (nra.gov.sl) ou un conseiller fiscal qualifié en Sierra Leone.</div>",
    ],
    [
      "- Sector: ${R.sector === 'private' ? 'Private' : 'Public'}",
      "- Secteur : ${R.sector === 'private' ? 'Privé' : 'Public'}",
    ],
  ],
  'fr/uganda/ug-paye.html': [
    [
      "          <p class=\"band-note\">NSSF employee contribution is NOT deductible from taxable income before PAYE calculation. This means you pay both NSSF and PAYE on the full gross salary. NSSF is paid to the National Social Security Fund (NSSF Uganda). For employees, Local Service Tax is based on monthly take-home salary after PAYE, not a flat percentage of gross pay. The annual charge ranges from UGX 5,000 to UGX 100,000 and is typically collected in four equal instalments in the first four months of the financial year.</p>",
      "          <p class=\"band-note\">La cotisation salariale NSSF n’est PAS déductible du revenu imposable avant le calcul du PAYE. Vous payez donc à la fois la NSSF et le PAYE sur le salaire brut complet. La NSSF est versée au National Social Security Fund (NSSF Uganda). Pour les salariés, la Local Service Tax est calculée sur le salaire net mensuel après PAYE, et non comme un pourcentage fixe du brut. La taxe annuelle varie généralement de UGX 5,000 à UGX 100,000 et est souvent prélevée en quatre versements égaux pendant les quatre premiers mois de l’exercice.</p>",
    ],
    [
      "        <strong>Disclaimer:</strong> For informational purposes only. Not professional tax or legal advice. Rates based on Uganda Revenue Authority (URA) Impôt sur le Revenu Act, 2000 (as amended), and 2025/26 statutory schedules. Verify with URA (ura.go.ug) or a qualified Ugandan tax advisor.",
      "        <strong>Clause de non-responsabilité :</strong> À titre informatif uniquement. Ceci ne constitue pas un conseil fiscal ou juridique professionnel. Taux basés sur l’Uganda Revenue Authority (URA), l’Income Tax Act 2000 tel que modifié, et les barèmes 2025/26. Vérifiez avec l’URA (ura.go.ug) ou un conseiller fiscal qualifié en Ouganda.",
    ],
    [
      "      <div style=\"font-size:6.5pt;color:#9ca3af;max-width:440px;line-height:1.4;margin-top:4px\">À titre informatif uniquement. Not professional tax advice. Verify with URA (ura.go.ug) or a qualified Ugandan tax advisor (CPA).</div>",
      "      <div style=\"font-size:6.5pt;color:#9ca3af;max-width:440px;line-height:1.4;margin-top:4px\">À titre informatif uniquement. Ceci ne constitue pas un conseil fiscal professionnel. Vérifiez avec l’URA (ura.go.ug) ou un conseiller fiscal qualifié en Ouganda (CPA).</div>",
    ],
    [
      "    <tr><td><span class=\"src\">NSSF UG</span>NSSF</td><td style=\"color:#6b7280;font-size:8pt\">National Social Security Fund: 5% employee + 10% employer = 15% total. No upper cap. Paid to NSSF Uganda. Not tax-deductible.</td></tr>",
      "    <tr><td><span class=\"src\">NSSF UG</span>NSSF</td><td style=\"color:#6b7280;font-size:8pt\">National Social Security Fund : 5 % salarié + 10 % employeur = 15 % au total. Aucun plafond supérieur. Paiement à la NSSF Uganda. Non déductible fiscalement.</td></tr>",
    ],
  ],
};

const postPolishWave2ByFile = {
  'fr/benin/bj-paye.html': [
    [
      "          <p class=\"band-note\">Calculated annually on taxable income (gross minus CNPS). CNPS employee contribution (2.5%) is fully deductible from gross before DGI is applied.</p>",
      "          <p class=\"band-note\">Calcul annuel sur le revenu imposable (brut moins CNPS). La cotisation CNPS salariale (2,5 %) est entièrement déductible du brut avant application de la DGI.</p>",
    ],
    [
      "          <p class=\"band-note\">Total CNPS contribution: 12% (2.5% employee + 9.5% employer). Employee contribution is deductible from taxable income before DGI calculation. Paid to CNPS via employer.</p>",
      "          <p class=\"band-note\">Cotisation CNPS totale : 12 % (2,5 % salarié + 9,5 % employeur). La part salariale est déductible du revenu imposable avant calcul de la DGI. Paiement à la CNPS via l’employeur.</p>",
    ],
    [
      "        <strong>Disclaimer:</strong> À titre informatif uniquement. Ceci ne constitue pas un conseil fiscal ou juridique professionnel. Taux basés sur Beninese DGI regulations and CNPS Act. Vérifiez auprès de DGI (impots.finances.gouv.bj) or a conseiller fiscal qualifié au Bénin.",
      "        <strong>Clause de non-responsabilité :</strong> À titre informatif uniquement. Ceci ne constitue pas un conseil fiscal ou juridique professionnel. Taux basés sur la réglementation de la DGI béninoise et les règles CNPS. Vérifiez auprès de la DGI (impots.finances.gouv.bj) ou d’un conseiller fiscal qualifié au Bénin.",
    ],
    [
      "  strip.innerHTML = `<strong>Cout total employeur : ${fmt(RESULT.totalEmployerCostAnnual)}/an</strong><br>Brut + employer CNPS ${fmt(empCNPSCost)}/an (9.5%). VPS and other employer payroll items are excluded from this estimate.`;",
      "  strip.innerHTML = `<strong>Coût total employeur : ${fmt(RESULT.totalEmployerCostAnnual)}/an</strong><br>Brut + CNPS employeur ${fmt(empCNPSCost)}/an (9,5 %). Le VPS et les autres charges patronales sont exclus de cette estimation.`;",
    ],
    [
      "        labels: ['Take-Home', 'DGI Tax', 'CNPS'],",
      "        labels: ['Net', 'Impôt DGI', 'CNPS'],",
    ],
    [
      "        labels: ['Take-Home', 'DGI', 'CNPS', 'Emp CNPS'],",
      "        labels: ['Net', 'DGI', 'CNPS', 'CNPS employeur'],",
    ],
    [
      "    ${R.cnps > 0 ? `<tr><td style=\"padding-left:14px;color:#4b5563\">CNPS employee contribution (${pct(R.cnpsRate)}, no cap)</td><td class=\"num red\">(XOF ${Math.round(R.cnps).toLocaleString()})</td></tr>` : ''}",
      "    ${R.cnps > 0 ? `<tr><td style=\"padding-left:14px;color:#4b5563\">Cotisation CNPS salariale (${pct(R.cnpsRate)}, sans plafond)</td><td class=\"num red\">(XOF ${Math.round(R.cnps).toLocaleString()})</td></tr>` : ''}",
    ],
    [
      "    <tr><td><span class=\"src\">CNPS / DGI form</span>Payroll withholding</td><td style=\"color:#6b7280;font-size:8pt\">This page estimates employee DGI and CNPS take-home only. Official employer payroll forms can also include VPS and other employer-side items that are excluded from the employer-cost figure shown here.</td></tr>",
      "    <tr><td><span class=\"src\">CNPS / formulaire DGI</span>Retenue sur paie</td><td style=\"color:#6b7280;font-size:8pt\">Cette page estime uniquement la DGI salariale et le net après CNPS. Les formulaires officiels de paie employeur peuvent aussi inclure le VPS et d’autres charges patronales non comptabilisées dans le coût employeur affiché ici.</td></tr>",
    ],
    [
      "      <div style=\"font-size:6.5pt;color:#9ca3af;max-width:440px;line-height:1.4;margin-top:4px\">À titre informatif uniquement. Ceci ne constitue pas un conseil fiscal professionnel. Vérifiez auprès de DGI (impots.finances.gouv.bj) or a conseiller fiscal qualifié au Bénin.</div>",
      "      <div style=\"font-size:6.5pt;color:#9ca3af;max-width:440px;line-height:1.4;margin-top:4px\">À titre informatif uniquement. Ceci ne constitue pas un conseil fiscal professionnel. Vérifiez auprès de la DGI (impots.finances.gouv.bj) ou d’un conseiller fiscal qualifié au Bénin.</div>",
    ],
  ],
  'fr/djibouti/dj-paye.html': [
    [
      "          <p class=\"band-note\">Monthly IRPP applied to taxable income (gross minus social security).</p>",
      "          <p class=\"band-note\">IRPP mensuel appliqué au revenu imposable (brut moins sécurité sociale).</p>",
    ],
    [
      "          <p class=\"band-note\">Employee contribution fully deductible from IRPP taxable income.</p>",
      "          <p class=\"band-note\">La cotisation salariale est entièrement déductible du revenu imposable à l’IRPP.</p>",
    ],
    [
      "        <strong>Disclaimer:</strong> For informational purposes. Ceci ne constitue pas un conseil fiscal professionnel. Vérifiez avec les sources officielles.",
      "        <strong>Clause de non-responsabilité :</strong> À titre informatif uniquement. Ceci ne constitue pas un conseil fiscal professionnel. Vérifiez avec les sources officielles.",
    ],
    [
      "  return `<div class=\"res-section\"><div class=\"res-section-title\">Gross</div>${row(`Salary${lbl}`,fmt(gross))}</div><div class=\"res-section\"><div class=\"res-section-title\">Deductions</div>${R.social>0?row(`Social (${pct(R.socialRate)})`,fmt(social),'c-red'):''}${row(`Taxable${lbl}`,fmt(isAnnual?R.annualGross-R.annualSocial:R.gross-R.social),'c-mut')}</div><div class=\"res-section\"><div class=\"res-section-title\">IRPP</div>${row(`Tax${lbl}`,fmt(tax),'c-red')}</div><div class=\"res-section\">${row('Total Deductions',fmt(social+tax),'c-red')}<div class=\"res-row total\"><span class=\"res-row-lbl\">Take-Home</span><span class=\"res-row-val c-grn\">${fmt(net)}</span></div></div>`;",
      "  return `<div class=\"res-section\"><div class=\"res-section-title\">Brut</div>${row(`Salaire${lbl}`,fmt(gross))}</div><div class=\"res-section\"><div class=\"res-section-title\">Déductions</div>${R.social>0?row(`Sécurité sociale (${pct(R.socialRate)})`,fmt(social),'c-red'):''}${row(`Imposable${lbl}`,fmt(isAnnual?R.annualGross-R.annualSocial:R.gross-R.social),'c-mut')}</div><div class=\"res-section\"><div class=\"res-section-title\">IRPP</div>${row(`Impôt${lbl}`,fmt(tax),'c-red')}</div><div class=\"res-section\">${row('Total des déductions',fmt(social+tax),'c-red')}<div class=\"res-row total\"><span class=\"res-row-lbl\">Net</span><span class=\"res-row-val c-grn\">${fmt(net)}</span></div></div>`;",
    ],
    [
      "  if(type==='donut'){CHART=new Chart(canvas,{type:'doughnut',data:{labels:['Take-Home','IRPP','Social'],datasets:[{data:[R.net,R.irpp,R.social],backgroundColor: AfroChartColors.doughnut.slice(0, 3),borderWidth:2,borderColor:'#fff'}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{position:'bottom',labels:{font:{size:11,weight:'600'},padding:12}}}}});}",
      "  if(type==='donut'){CHART=new Chart(canvas,{type:'doughnut',data:{labels:['Net','IRPP','Sécurité sociale'],datasets:[{data:[R.net,R.irpp,R.social],backgroundColor: AfroChartColors.doughnut.slice(0, 3),borderWidth:2,borderColor:'#fff'}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{position:'bottom',labels:{font:{size:11,weight:'600'},padding:12}}}}});}",
    ],
    [
      "  else if(type==='employer'){CHART=new Chart(canvas,{type:'bar',data:{labels:['Take-Home','IRPP','Social','Emp Social'],datasets:[{label:'DJF',data:[R.net,R.irpp,R.social,R.empSocial],backgroundColor: AfroChartColors.doughnut.slice(0, 4),borderRadius:5}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{y:{ticks:{callback:v=>'DJF'+(v/1000).toFixed(0)+'k',font:{size:10,weight:'600'}},grid: { color: AfroChartColors.grid}},x:{ticks:{font:{size:9,weight:'600'}}}}}});}",
      "  else if(type==='employer'){CHART=new Chart(canvas,{type:'bar',data:{labels:['Net','IRPP','Sécurité sociale','Social employeur'],datasets:[{label:'DJF',data:[R.net,R.irpp,R.social,R.empSocial],backgroundColor: AfroChartColors.doughnut.slice(0, 4),borderRadius:5}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{y:{ticks:{callback:v=>'DJF'+(v/1000).toFixed(0)+'k',font:{size:10,weight:'600'}},grid: { color: AfroChartColors.grid}},x:{ticks:{font:{size:9,weight:'600'}}}}}});}",
    ],
  ],
  'fr/ethiopia/et-paye.html': [
    [
      "          <div class=\"band-row\"><span class=\"band-range\">Total Cotisation de Pension</span><span class=\"band-rate\">18% (7% employee + 11% employer)</span></div>",
      "          <div class=\"band-row\"><span class=\"band-range\">Cotisation totale de pension</span><span class=\"band-rate\">18 % (7 % salarié + 11 % employeur)</span></div>",
    ],
    [
      "          <p class=\"band-note\">Pension Fund contributions are mandatory. Employee contribution IS fully deductible from taxable income before PAYE calculation. Remit by 10th of following month. Per Proclamation 1395/2025, first ETB 2,000/mois of taxable income is exempt.</p>",
      "          <p class=\"band-note\">Les cotisations à la caisse de pension sont obligatoires. La part salariale est entièrement déductible du revenu imposable avant le calcul du PAYE. Le versement doit intervenir au plus tard le 10 du mois suivant. Selon la proclamation 1395/2025, les premiers ETB 2,000/mois de revenu imposable sont exonérés.</p>",
    ],
    [
      "        <strong>Disclaimer:</strong> À titre informatif uniquement. Ceci ne constitue pas un conseil fiscal ou juridique professionnel. Taux basés sur Ethiopia Impôt sur le Revenu Proclamation No. 1395/2025, Cotisation de Pension Regulations. Vérifiez auprès de ERCA (erca.gov.et) or a conseiller fiscal qualifié en Éthiopie.",
      "        <strong>Clause de non-responsabilité :</strong> À titre informatif uniquement. Ceci ne constitue pas un conseil fiscal ou juridique professionnel. Taux basés sur la proclamation éthiopienne d’impôt sur le revenu n° 1395/2025 et les règles de pension. Vérifiez auprès de l’ERCA (erca.gov.et) ou d’un conseiller fiscal qualifié en Éthiopie.",
    ],
    [
      "  strip.innerHTML = `<strong>Cout total employeur : ${fmt(RESULT.totalEmployerCostMonthly)}/mois</strong><br>Brut + Employer Pension ${fmt(empPension)}/mo (11%).`;",
      "  strip.innerHTML = `<strong>Coût total employeur : ${fmt(RESULT.totalEmployerCostMonthly)}/mois</strong><br>Brut + pension employeur ${fmt(empPension)}/mo (11 %).`;",
    ],
    [
      "        labels: ['Take-Home', 'PAYE Tax', 'Pension Fund'],",
      "        labels: ['Net', 'Impôt PAYE', 'Caisse de pension'],",
    ],
    [
      "        labels: ['Take-Home', 'PAYE', 'Emp Pension', 'Employee Pension'],",
      "        labels: ['Net', 'PAYE', 'Pension employeur', 'Pension salariale'],",
    ],
    [
      "    ${R.pension > 0 ? `<tr><td style=\"padding-left:14px;color:#4b5563\">Pension Fund employee contribution (${pct(R.pensionRate)})</td><td class=\"num red\">(ETB ${Math.round(R.pension).toLocaleString()})</td></tr>` : ''}",
      "    ${R.pension > 0 ? `<tr><td style=\"padding-left:14px;color:#4b5563\">Cotisation salariale à la pension (${pct(R.pensionRate)})</td><td class=\"num red\">(ETB ${Math.round(R.pension).toLocaleString()})</td></tr>` : ''}",
    ],
    [
      "    <tr><td>Employer Pension Fund (11%)</td><td class=\"num red\">ETB ${Math.round(R.empPension).toLocaleString()}</td></tr>",
      "    <tr><td>Caisse de pension employeur (11 %)</td><td class=\"num red\">ETB ${Math.round(R.empPension).toLocaleString()}</td></tr>",
    ],
    [
      "    <tr><td><span class=\"src\">Pension Regs</span>Employee Pension Fund</td><td style=\"color:#6b7280;font-size:8pt\">Total 18% of salary: 7% employee + 11% employer. Remit by 10th of following month.</td></tr>",
      "    <tr><td><span class=\"src\">Règles de pension</span>Caisse de pension salariale</td><td style=\"color:#6b7280;font-size:8pt\">Total de 18 % du salaire : 7 % salarié + 11 % employeur. Paiement au plus tard le 10 du mois suivant.</td></tr>",
    ],
    [
      "      <div style=\"font-size:6.5pt;color:#9ca3af;max-width:440px;line-height:1.4;margin-top:4px\">À titre informatif uniquement. Ceci ne constitue pas un conseil fiscal professionnel. Vérifiez auprès de ERCA (erca.gov.et) or a conseiller fiscal qualifié en Éthiopie. Proclamation 1395/2025 status pending.</div>",
      "      <div style=\"font-size:6.5pt;color:#9ca3af;max-width:440px;line-height:1.4;margin-top:4px\">À titre informatif uniquement. Ceci ne constitue pas un conseil fiscal professionnel. Vérifiez auprès de l’ERCA (erca.gov.et) ou d’un conseiller fiscal qualifié en Éthiopie. Statut de la proclamation 1395/2025 à confirmer.</div>",
    ],
  ],
  'fr/liberia/lr-paye.html': [
    [
      "                <div><div class=\"tog-label\" id=\"nssfLabel\">NASSCORP</div><div class=\"tog-rate\">4% employee contribution</div></div>",
      "                <div><div class=\"tog-label\" id=\"nssfLabel\">NASSCORP</div><div class=\"tog-rate\">Cotisation salariale de 4 %</div></div>",
    ],
    [
      "            <p class=\"f-note\">NASSCORP employee contribution is 4% of gross remuneration and the employer contribution is 6%, based on the current NASSCORP employer guide. This calculator shows NASSCORP separately from LRA PAYE and annualizes salary to estimate monthly withholding.</p>",
      "            <p class=\"f-note\">La cotisation salariale NASSCORP est de 4 % de la rémunération brute et la part employeur de 6 %, selon le guide employeur NASSCORP actuel. Ce calculateur présente la NASSCORP séparément du PAYE LRA et annualise le salaire pour estimer la retenue mensuelle.</p>",
    ],
    [
      "          <div class=\"res-hero-period\">After PAYE, NASSCORP &amp; employee deductions</div>",
      "          <div class=\"res-hero-period\">Après PAYE, NASSCORP et déductions salariales</div>",
    ],
    [
      "          <div class=\"band-row\"><span class=\"band-range\">NASSCORP salarié</span><span class=\"band-rate\">4% of gross remuneration</span></div>",
      "          <div class=\"band-row\"><span class=\"band-range\">NASSCORP salarié</span><span class=\"band-rate\">4 % de la rémunération brute</span></div>",
    ],
    [
      "          <div class=\"band-row\"><span class=\"band-range\">NASSCORP employeur</span><span class=\"band-rate\">6% of gross remuneration</span></div>",
      "          <div class=\"band-row\"><span class=\"band-range\">NASSCORP employeur</span><span class=\"band-rate\">6 % de la rémunération brute</span></div>",
    ],
    [
      "        <strong>Disclaimer:</strong> À titre informatif uniquement. Ceci ne constitue pas un conseil fiscal ou juridique professionnel. Taux basés sur the Liberia Revenue Code and NASSCORP employer guidance. Vérifiez auprès de LRA or a conseiller fiscal qualifié au Libéria.",
      "        <strong>Clause de non-responsabilité :</strong> À titre informatif uniquement. Ceci ne constitue pas un conseil fiscal ou juridique professionnel. Taux basés sur le Liberia Revenue Code et le guide employeur NASSCORP. Vérifiez auprès de la LRA ou d’un conseiller fiscal qualifié au Libéria.",
    ],
    [
      "        labels: ['Take-Home', 'PAYE Tax', 'NASSCORP'],",
      "        labels: ['Net', 'Impôt PAYE', 'NASSCORP'],",
    ],
    [
      "        labels: ['Take-Home', 'PAYE', 'NASSCORP (employee)', 'NASSCORP (employer)'],",
      "        labels: ['Net', 'PAYE', 'NASSCORP salarié', 'NASSCORP employeur'],",
    ],
    [
      "    ${R.social > 0 ? `<tr><td style=\"padding-left:14px;color:#4b5563\">NASSCORP employee contribution (${pct(R.socialRate)}, no cap)</td><td class=\"num red\">(LRD ${Math.round(R.social).toLocaleString()})</td></tr>` : ''}",
      "    ${R.social > 0 ? `<tr><td style=\"padding-left:14px;color:#4b5563\">Cotisation salariale NASSCORP (${pct(R.socialRate)}, sans plafond)</td><td class=\"num red\">(LRD ${Math.round(R.social).toLocaleString()})</td></tr>` : ''}",
    ],
    [
      "      <div style=\"font-size:6.5pt;color:#9ca3af;max-width:440px;line-height:1.4;margin-top:4px\">À titre informatif uniquement. Ceci ne constitue pas un conseil fiscal professionnel. Vérifiez auprès de LRA (lra.gov.lr) or a conseiller fiscal qualifié au Libéria.</div>",
      "      <div style=\"font-size:6.5pt;color:#9ca3af;max-width:440px;line-height:1.4;margin-top:4px\">À titre informatif uniquement. Ceci ne constitue pas un conseil fiscal professionnel. Vérifiez auprès de la LRA (lra.gov.lr) ou d’un conseiller fiscal qualifié au Libéria.</div>",
    ],
  ],
  'fr/madagascar/mg-paye.html': [
    [
      "  if (empStrip) { empStrip.classList.add('on'); empStrip.innerHTML = '<strong>Cout total employeur : ' + fmt(RESULT.totalEmployerCost) + '/mois</strong><br>Brut salary + employer CNaPS (13%) ' + fmt(RESULT.employerCNaPS) + '/mois on salary up to the MGA 2,101,440 general-regime ceiling.'; }",
      "  if (empStrip) { empStrip.classList.add('on'); empStrip.innerHTML = '<strong>Coût total employeur : ' + fmt(RESULT.totalEmployerCost) + '/mois</strong><br>Brut + CNaPS employeur (13 %) ' + fmt(RESULT.employerCNaPS) + '/mois sur le salaire couvert jusqu’au plafond du régime général de MGA 2,101,440.'; }",
    ],
    [
      "    <div class=\"res-section\">${row('Total Deductions', fmt(cnaps + tax), 'c-red')}<div class=\"res-row total\"><span class=\"res-row-lbl\">Take-Home</span><span class=\"res-row-val c-grn\">${fmt(net)}</span></div></div>`;",
      "    <div class=\"res-section\">${row('Total des déductions', fmt(cnaps + tax), 'c-red')}<div class=\"res-row total\"><span class=\"res-row-lbl\">Net</span><span class=\"res-row-val c-grn\">${fmt(net)}</span></div></div>`;",
    ],
    [
      "    CHART = new Chart(canvas, { type: 'doughnut', data: { labels: ['Take-Home', 'IRSA', 'CNaPS'], datasets: [{ data: [R.net, R.tax, R.cnaps], backgroundColor: AfroChartColors.doughnut.slice(0, 3), borderWidth: 2, borderColor: '#333' }] }, options: { responsive:true, maintainAspectRatio:false, plugins:{ legend:{ position:'bottom', labels:{ font:{size:11,weight:'600'}, padding:12 } } } } });",
      "    CHART = new Chart(canvas, { type: 'doughnut', data: { labels: ['Net', 'IRSA', 'CNaPS'], datasets: [{ data: [R.net, R.tax, R.cnaps], backgroundColor: AfroChartColors.doughnut.slice(0, 3), borderWidth: 2, borderColor: '#333' }] }, options: { responsive:true, maintainAspectRatio:false, plugins:{ legend:{ position:'bottom', labels:{ font:{size:11,weight:'600'}, padding:12 } } } } });",
    ],
    [
      "    CHART = new Chart(canvas, { type: 'bar', data: { labels: ['Take-Home','IRSA','CNaPS (Employee)','CNaPS (Employer)'], datasets: [{ label:'Amount', data: [R.net, R.tax, R.cnaps, R.employerCNaPS], backgroundColor: AfroChartColors.doughnut.slice(0,4), borderRadius:5 }] }, options: { responsive:true, maintainAspectRatio:false, indexAxis:'y', plugins:{ legend:{display:false} }, scales:{ x:{ ticks:{callback:v=>'MGA'+(v/1000).toFixed(0)+'k',font:{size:10,weight:'600'}},grid:{color:AfroChartColors.grid} }, y:{ticks:{font:{size:10,weight:'600'}}} } } });",
      "    CHART = new Chart(canvas, { type: 'bar', data: { labels: ['Net','IRSA','CNaPS salarié','CNaPS employeur'], datasets: [{ label:'Montant', data: [R.net, R.tax, R.cnaps, R.employerCNaPS], backgroundColor: AfroChartColors.doughnut.slice(0,4), borderRadius:5 }] }, options: { responsive:true, maintainAspectRatio:false, indexAxis:'y', plugins:{ legend:{display:false} }, scales:{ x:{ ticks:{callback:v=>'MGA'+(v/1000).toFixed(0)+'k',font:{size:10,weight:'600'}},grid:{color:AfroChartColors.grid} }, y:{ticks:{font:{size:10,weight:'600'}}} } } });",
    ],
    [
      "    const res=await fetch('/.netlify/functions/ai-advisor',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({system:'AfroTools AI Tax Advisor specialising in Madagascar IRSA and CNaPS payroll. Concise, specific, practical. Pas de markdown.',messages:[{role:'user',content:prompt}]})});",
      "    const res=await fetch('/.netlify/functions/ai-advisor',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({system:'Vous êtes le conseiller fiscal IA d’AfroTools spécialisé dans la paie IRSA et CNaPS à Madagascar. Soyez concis, précis et pratique. Pas de markdown.',messages:[{role:'user',content:prompt}]})});",
    ],
  ],
  'fr/sierra-leone/sl-paye.html': [
    [
      "          <p class=\"ai-status\" id=\"aiStatus\">Calculez d'abord votre salaire — I'll analyse your NRA PAYE position, explain NASSIT contributions (5% employee / 10% employer), and give specific optimisation tips for Sierra Leone.</p>",
      "          <p class=\"ai-status\" id=\"aiStatus\">Calculez d’abord votre salaire — j’analyserai ensuite votre situation PAYE auprès de la NRA, les cotisations NASSIT (5 % salarié / 10 % employeur) et les points d’optimisation utiles pour la Sierra Leone.</p>",
    ],
    [
      "        <strong>Disclaimer:</strong> À titre informatif uniquement. Ceci ne constitue pas un conseil fiscal ou juridique professionnel. Taux basés sur Sierra Leone Impôt sur le Revenu Act 2000. Vérifiez auprès de NRA (nra.gov.sl) or a conseiller fiscal qualifié en Sierra Leone.",
      "        <strong>Clause de non-responsabilité :</strong> À titre informatif uniquement. Ceci ne constitue pas un conseil fiscal ou juridique professionnel. Taux basés sur la législation fiscale de Sierra Leone et les règles PAYE en vigueur. Vérifiez auprès de la NRA (nra.gov.sl) ou d’un conseiller fiscal qualifié en Sierra Leone.",
    ],
    [
      "  strip.innerHTML = `<strong>Cout total employeur : ${fmt(RESULT.totalEmployerCostMonthly)}/mois</strong><br>Brut + NASSIT employer (10%) ${fmt(empSocial)}/mo.`;",
      "  strip.innerHTML = `<strong>Coût total employeur : ${fmt(RESULT.totalEmployerCostMonthly)}/mois</strong><br>Brut + NASSIT employeur (10 %) ${fmt(empSocial)}/mo.`;",
    ],
    [
      "        labels: ['Take-Home', 'PAYE Tax', 'NASSIT'],",
      "        labels: ['Net', 'Impôt PAYE', 'NASSIT'],",
    ],
    [
      "        labels: ['Take-Home', 'PAYE', 'NASSIT (employee)', 'NASSIT (employer)'],",
      "        labels: ['Net', 'PAYE', 'NASSIT salariée', 'NASSIT employeur'],",
    ],
    [
      "    ${R.social > 0 ? `<tr><td style=\"padding-left:14px;color:#4b5563\">NASSIT employee contribution (${pct(R.socialRate)}, no cap)</td><td class=\"num red\">(SLE ${Math.round(R.social).toLocaleString()})</td></tr>` : ''}",
      "    ${R.social > 0 ? `<tr><td style=\"padding-left:14px;color:#4b5563\">Cotisation salariale NASSIT (${pct(R.socialRate)}, sans plafond)</td><td class=\"num red\">(SLE ${Math.round(R.social).toLocaleString()})</td></tr>` : ''}",
    ],
    [
      "    <tr><td>Employer NASSIT (10%)</td><td class=\"num red\">SLE ${Math.round(R.empSocial).toLocaleString()}</td></tr>",
      "    <tr><td>NASSIT employeur (10 %)</td><td class=\"num red\">SLE ${Math.round(R.empSocial).toLocaleString()}</td></tr>",
    ],
    [
      "    <tr><td style=\"width:30%\"><span class=\"src\">ITA 2000</span>Impôt sur le Revenu Act</td><td style=\"color:#6b7280;font-size:8pt\">Progressive PAYE on employment income, expressed here in post-redenomination SLE monthly thresholds. Employee NASSIT is deducted before PAYE in line with NRA examples and guides.</td></tr>",
      "    <tr><td style=\"width:30%\"><span class=\"src\">ITA 2000</span>Loi sur l’impôt sur le revenu</td><td style=\"color:#6b7280;font-size:8pt\">PAYE progressif sur les revenus d’emploi, exprimé ici en seuils mensuels SLE post-redénomination. La NASSIT salariale est déduite avant PAYE conformément aux exemples et guides de la NRA.</td></tr>",
    ],
    [
      "      <div style=\"font-size:6.5pt;color:#9ca3af;max-width:440px;line-height:1.4;margin-top:4px\">À titre informatif uniquement. Ceci ne constitue pas un conseil fiscal professionnel. Vérifiez auprès de NRA (nra.gov.sl) or a conseiller fiscal qualifié en Sierra Leone.</div>",
      "      <div style=\"font-size:6.5pt;color:#9ca3af;max-width:440px;line-height:1.4;margin-top:4px\">À titre informatif uniquement. Ceci ne constitue pas un conseil fiscal professionnel. Vérifiez auprès de la NRA (nra.gov.sl) ou d’un conseiller fiscal qualifié en Sierra Leone.</div>",
    ],
  ],
  'fr/uganda/ug-paye.html': [
    [
      "          <button class=\"calc-btn\" onclick=\"calculate()\">Calculate Salaire Net →</button>",
      "          <button class=\"calc-btn\" onclick=\"calculate()\">Calculer le salaire net →</button>",
    ],
    [
      "          <p class=\"band-note\">Calculated monthly on gross salary for residents. NSSF contribution (5% of gross) is NOT deductible from PAYE taxable income in Uganda — this is a key difference from neighbouring countries. Non-residents pay flat 30% on employment income.</p>",
      "          <p class=\"band-note\">Calcul mensuel sur le salaire brut pour les résidents. La cotisation NSSF (5 % du brut) n’est PAS déductible du revenu imposable PAYE en Ouganda — c’est une différence importante avec plusieurs pays voisins. Les non-résidents paient un taux forfaitaire de 30 % sur les revenus d’emploi.</p>",
    ],
    [
      "          <div class=\"band-row\"><span class=\"band-range\">Taxe locale sur les services (LST)</span><span class=\"band-rate\">UGX 5,000–100,000/yr by take-home band</span></div>",
      "          <div class=\"band-row\"><span class=\"band-range\">Taxe locale sur les services (LST)</span><span class=\"band-rate\">UGX 5,000–100,000/an selon la tranche de net</span></div>",
    ],
    [
      "        <strong>Disclaimer:</strong> À titre informatif uniquement. Ceci ne constitue pas un conseil fiscal ou juridique professionnel. Taux basés sur Uganda Revenue Authority (URA) Impôt sur le Revenu Act, 2000 (as amended), and 2025/26 statutory schedules. Vérifiez auprès de URA (ura.go.ug) or a conseiller fiscal qualifié en Ouganda.",
      "        <strong>Clause de non-responsabilité :</strong> À titre informatif uniquement. Ceci ne constitue pas un conseil fiscal ou juridique professionnel. Taux basés sur l’Uganda Revenue Authority (URA), l’Income Tax Act 2000 tel que modifié et les barèmes 2025/26. Vérifiez auprès de l’URA (ura.go.ug) ou d’un conseiller fiscal qualifié en Ouganda.",
    ],
    [
      "  strip.innerHTML = `<strong>Cout total employeur : ${fmt(RESULT.totalEmployerCostMonthly)}/mois</strong><br>Brut salary + employer NSSF ${fmt(empNSSF)}/mo.`;",
      "  strip.innerHTML = `<strong>Coût total employeur : ${fmt(RESULT.totalEmployerCostMonthly)}/mois</strong><br>Brut + NSSF employeur ${fmt(empNSSF)}/mo.`;",
    ],
    [
      "    const labels = ['Take-Home', 'PAYE Tax', 'NSSF'];",
      "    const labels = ['Net', 'Impôt PAYE', 'NSSF'];",
    ],
    [
      "    ${R.nssf > 0 ? `<tr><td style=\"padding-left:14px;color:#4b5563\">NSSF employee contribution (5%, not tax-deductible)</td><td class=\"num red\">(UGX ${Math.round(R.nssf).toLocaleString()})</td></tr>` : ''}",
      "    ${R.nssf > 0 ? `<tr><td style=\"padding-left:14px;color:#4b5563\">Cotisation salariale NSSF (5 %, non déductible fiscalement)</td><td class=\"num red\">(UGX ${Math.round(R.nssf).toLocaleString()})</td></tr>` : ''}",
    ],
    [
      "    <tr><td>Employer NSSF (10%, no cap)</td><td class=\"num red\">UGX ${Math.round(R.empNSSF).toLocaleString()}</td></tr>",
      "    <tr><td>NSSF employeur (10 %, sans plafond)</td><td class=\"num red\">UGX ${Math.round(R.empNSSF).toLocaleString()}</td></tr>",
    ],
    [
      "    <tr><td><span class=\"src\">LST Act</span>Local Service Tax</td><td style=\"color:#6b7280;font-size:8pt\">Annual levy for employees whose monthly take-home salary after PAYE exceeds UGX 100,000. Employee bands range from UGX 5,000 to UGX 100,000 per year and are typically collected in four equal instalments in the first four months of the financial year.</td></tr>",
      "    <tr><td><span class=\"src\">LST Act</span>Local Service Tax</td><td style=\"color:#6b7280;font-size:8pt\">Prélèvement annuel pour les salariés dont le salaire net mensuel après PAYE dépasse UGX 100,000. Les tranches vont de UGX 5,000 à UGX 100,000 par an et sont généralement collectées en quatre versements égaux pendant les quatre premiers mois de l’exercice.</td></tr>",
    ],
    [
      "      <div style=\"font-size:6.5pt;color:#9ca3af;max-width:440px;line-height:1.4;margin-top:4px\">À titre informatif uniquement. Ceci ne constitue pas un conseil fiscal professionnel. Vérifiez auprès de URA (ura.go.ug) or a conseiller fiscal qualifié en Ouganda (CPA).</div>",
      "      <div style=\"font-size:6.5pt;color:#9ca3af;max-width:440px;line-height:1.4;margin-top:4px\">À titre informatif uniquement. Ceci ne constitue pas un conseil fiscal professionnel. Vérifiez auprès de l’URA (ura.go.ug) ou d’un conseiller fiscal qualifié en Ouganda (CPA).</div>",
    ],
  ],
};

const postPolishWave3ByFile = {
  'fr/benin/bj-paye.html': [
    [
      "Calculez d'abord votre salaire — I'll analyse your DGI PAYE position, explain CNPS deductibility, and give specific optimisation tips for Benin.",
      "Calculez d’abord votre salaire — j’analyserai ensuite votre situation PAYE auprès de la DGI, la déductibilité CNPS et les pistes d’optimisation utiles au Bénin.",
    ],
    ['Tax (XOF)', 'Impôt (XOF)'],
    ['CNPS (employee)', 'CNPS (salarié)'],
    ['PAYE Bénin analysis (2025/26, DGI):', 'Analyse PAYE Bénin (2025/26, DGI) :'],
    ['- Annual gross:', '- Brut annuel :'],
    ['- CNPS employee (', '- CNPS salarié ('],
    ['- Taxable income after CNPS:', '- Revenu imposable après CNPS :'],
    ['- Annual DGI:', '- DGI annuelle :'],
    ['- Annual take-home:', '- Net annuel :'],
    ['- Effective tax rate:', '- Taux effectif :'],
    ['- Employer CNPS (9.5%):', '- CNPS employeur (9,5 %) :'],
    ['- Total employer cost:', '- Coût total employeur :'],
    ['Résumé clair en français of PAYE Bénin position', 'Résumé clair en français de la situation PAYE au Bénin'],
    ['Two specific legal ways to reduce DGI tax liability', 'Deux moyens légaux précis de réduire la charge DGI'],
    ['One DGI compliance point to know', 'Un point de conformité DGI à connaître'],
    ['One thing most Beninese employees get wrong about CNPS.', 'Un point que beaucoup de salariés béninois comprennent mal à propos de la CNPS.'],
    ['Conseiller fiscal IA AfroTools, Benin. User: annual gross XOF', 'Conseiller fiscal IA AfroTools, Bénin. Utilisateur : brut annuel XOF'],
    [', take-home XOF ', ', net annuel XOF '],
    ['. Concise. Pas de markdown.', '. Réponse concise. Pas de markdown.'],
  ],
  'fr/djibouti/dj-paye.html': [
    ["Calculez d'abord pour débloquer analysis.", "Calculez d’abord pour débloquer l’analyse."],
    [
      "<div class=\"band-row\"><span class=\"band-range\">Employee</span><span class=\"band-rate\">4% of gross</span></div>",
      "<div class=\"band-row\"><span class=\"band-range\">Salarié</span><span class=\"band-rate\">4 % du brut</span></div>",
    ],
    ['Mon PAYE Djibouti: Brut DJF ', 'Mon PAYE Djibouti : Brut DJF '],
    [' effective)', ' effectif)'],
    [
      "<strong>Coût employeur : ${fmt(RESULT.totalEmployerCost)}/mo</strong><br>Brut + social ${fmt(empSocial)}/mo (15.7%).",
      "<strong>Coût employeur : ${fmt(RESULT.totalEmployerCost)}/mo</strong><br>Brut + cotisations employeur ${fmt(empSocial)}/mo (15,7 %).",
    ],
    [
      "PAYE Djibouti analysis: Brut ${fmt(R.gross)}/mo, social ${fmt(R.social)}, IRPP ${fmt(R.irpp)}, take-home ${fmt(R.net)}, rate ${pct(R.effRate)}. Donnez : 1) PAYE summary 2) Two tax reduction strategies 3) One compliance point 4) Common mistake. Moins de 200 mots.",
      "Analyse PAYE Djibouti : brut ${fmt(R.gross)}/mo, cotisations ${fmt(R.social)}, IRPP ${fmt(R.irpp)}, net ${fmt(R.net)}, taux ${pct(R.effRate)}. Donnez : 1) un résumé PAYE clair 2) deux pistes légales de réduction de charge fiscale 3) un point de conformité à connaître 4) une erreur fréquente. Moins de 200 mots.",
    ],
    [
      "AI Tax Advisor for PAYE Djibouti. Concise, practical. Pas de markdown.",
      "Vous êtes le conseiller fiscal IA d’AfroTools spécialisé dans le PAYE à Djibouti. Soyez concis, précis et pratique. Pas de markdown.",
    ],
    [
      "Djibouti advisor for gross ${fmt(R.gross)}, take-home ${fmt(R.net)}, rate ${pct(R.effRate)}. Concise.",
      "Conseiller Djibouti : brut ${fmt(R.gross)}, net ${fmt(R.net)}, taux ${pct(R.effRate)}. Réponse concise.",
    ],
  ],
  'fr/ethiopia/et-paye.html': [
    [
      "<div><div class=\"tog-label\">Secondary Income</div><div class=\"tog-rate\">Full salary included in tax</div></div>",
      "<div><div class=\"tog-label\">Revenu secondaire</div><div class=\"tog-rate\">Salaire intégral inclus dans l’impôt</div></div>",
    ],
    ['7% of gross salary', '7 % du salaire brut'],
    ['11% of gross salary (separate cost)', '11 % du salaire brut (coût distinct)'],
    ['Tax (ETB)', 'Impôt (ETB)'],
    ['PAYE Éthiopie analysis (2025/26, ERCA):', 'Analyse PAYE Éthiopie (2025/26, ERCA) :'],
    ["- Sector: ${R.sector === 'private' ? 'Private' : 'Public'}", "- Secteur : ${R.sector === 'private' ? 'Privé' : 'Public'}"],
    ['- Pension Fund employee (', '- Pension salariale ('],
    ['- Taxable income after pension deduction:', '- Revenu imposable après déduction de la pension :'],
    ['- Monthly PAYE:', '- PAYE mensuel :'],
    ['- Effective tax rate:', '- Taux effectif :'],
    ['- Employer Pension (11%):', '- Pension employeur (11 %) :'],
    ['- Total employer cost:', '- Coût total employeur :'],
    ['Résumé clair en français of PAYE position', 'Résumé clair en français de la situation PAYE'],
    ['Two specific legal ways to reduce Ethiopia tax liability (pension deductibility, sector-specific benefits)', 'Deux moyens légaux précis de réduire la charge fiscale en Éthiopie (déductibilité de la pension, avantages sectoriels)'],
    ['One ERCA compliance point to know', 'Un point de conformité ERCA à connaître'],
    ['One thing most Ethiopian employees get wrong about pension contributions.', 'Un point que beaucoup de salariés éthiopiens comprennent mal à propos des cotisations de pension.'],
    [
      'Vous êtes le conseiller fiscal IA d’AfroTools spécialisé dans Ethiopian PAYE — ERCA progressive tax (Proclamation 1395/2025, 6 bands 0%–35%, tax-free threshold ETB 2000/mo), Pension Fund 7%. Soyez concis, précis et pratique. Pas de markdown, pas d’astérisques.',
      'Vous êtes le conseiller fiscal IA d’AfroTools spécialisé dans le PAYE en Éthiopie — barème progressif ERCA (proclamation 1395/2025, 6 tranches de 0 % à 35 %, seuil exonéré ETB 2000/mois), pension salariale à 7 %. Soyez concis, précis et pratique. Pas de markdown, pas d’astérisques.',
    ],
    ['Conseiller fiscal IA AfroTools, Ethiopia. User: ${R.sector} sector, gross ETB', "Conseiller fiscal IA AfroTools, Éthiopie. Utilisateur : secteur ${R.sector === 'private' ? 'privé' : 'public'}, brut ETB"],
    [', take-home ETB ', ', net ETB '],
    ['. Concise. Pas de markdown.', '. Réponse concise. Pas de markdown.'],
  ],
  'fr/liberia/lr-paye.html': [
    [
      '<a href="/fr/">Accueil</a> / <a href="/fr/liberia/">🇱🇷 Liberia</a> / <span>Calculateur PAYE</span>',
      '<a href="/fr/">Accueil</a> / <a href="/fr/liberia/">🇱🇷 Libéria</a> / <span>Calculateur PAYE</span>',
    ],
    ['<h1>Calculateur PAYE Liberia<br><em>2025/26</em></h1>', '<h1>Calculateur PAYE Libéria<br><em>2025/26</em></h1>'],
    ['<span class="badge b-grey">LRD · Liberia</span>', '<span class="badge b-grey">LRD · Libéria</span>'],
    ['Calculateur TVA Liberia', 'Calculateur TVA Libéria'],
    [
      "Calculez d'abord votre salaire — I'll analyse your LRA PAYE position, explain NASSCORP deductibility, and give specific optimisation tips for Liberia.",
      "Calculez d’abord votre salaire — j’analyserai ensuite votre situation PAYE auprès de la LRA, la déductibilité NASSCORP et les points d’optimisation utiles au Libéria.",
    ],
    ['Tax (LRD)', 'Impôt (LRD)'],
    [
      '<tr><td style="width:30%"><span class="src">LRA</span>Liberia Revenue Code / Tax Education</td><td style="color:#6b7280;font-size:8pt">Resident natural person tax is imposed annually using the 0%, 5%, 15%, and 25% schedule published by the LRA.</td></tr>',
      '<tr><td style="width:30%"><span class="src">LRA</span>Liberia Revenue Code / information fiscale</td><td style="color:#6b7280;font-size:8pt">L’impôt sur les personnes physiques résidentes est appliqué sur une base annuelle selon les taux de 0 %, 5 %, 15 % et 25 % publiés par la LRA.</td></tr>',
    ],
    [
      '<p class="band-note">LRA tax is legislated on annual taxable income. This calculator annualizes your salary, applies the official resident natural person table, then spreads the annual tax across 12 months for an estimated monthly PAYE.</p>',
      '<p class="band-note">L’impôt LRA est défini sur le revenu imposable annuel. Ce calculateur annualise votre salaire, applique le barème officiel des personnes physiques résidentes, puis répartit l’impôt annuel sur 12 mois pour estimer le PAYE mensuel.</p>',
    ],
    ['PAYE Libéria analysis (2025/26, LRA):', 'Analyse PAYE Libéria (2025/26, LRA) :'],
    ['- NASSCORP employee (', '- NASSCORP salarié ('],
    ['- Annualized LRA taxable income:', '- Revenu imposable LRA annualisé :'],
    ['- Monthly PAYE:', '- PAYE mensuel :'],
    ['- Effective tax rate:', '- Taux effectif :'],
    ['- Total employer cost (gross + NASSCORP 6%):', '- Coût total employeur (brut + NASSCORP 6 %) :'],
    ['Résumé clair en français of PAYE position', 'Résumé clair en français de la situation PAYE'],
    ['Two practical payroll planning points', 'Deux points pratiques de planification de paie'],
    ['One LRA compliance point to know', 'Un point de conformité LRA à connaître'],
    ['One thing most Liberian employees get wrong about NASSCORP.', 'Un point que beaucoup de salariés libériens comprennent mal à propos de la NASSCORP.'],
    [
      'Vous êtes le conseiller fiscal IA d’AfroTools spécialisé dans Liberian PAYE — LRA annual resident natural person tax and NASSCORP social security at 4% employee / 6% employer. Soyez concis, précis et pratique. Pas de markdown, pas d’astérisques.',
      'Vous êtes le conseiller fiscal IA d’AfroTools spécialisé dans le PAYE au Libéria — impôt annuel LRA des personnes physiques résidentes et sécurité sociale NASSCORP à 4 % salarié / 6 % employeur. Soyez concis, précis et pratique. Pas de markdown, pas d’astérisques.',
    ],
    ['Conseiller fiscal IA AfroTools, Liberia. User: ${R.sector} sector, gross LRD', "Conseiller fiscal IA AfroTools, Libéria. Utilisateur : secteur ${R.sector === 'private' ? 'privé' : 'public'}, brut LRD"],
    [', take-home LRD ', ', net LRD '],
    ['. Concise. Pas de markdown.', '. Réponse concise. Pas de markdown.'],
  ],
  'fr/madagascar/mg-paye.html': [
    ['CNaPS Pension (1%, capped MGA 2,101,440/mo)', 'Pension CNaPS (1 %, plafond MGA 2,101,440/mo)'],
    ['Brut : ${fmt(gross)}/mo · ${fmt(gross * 12)}/yr', 'Brut : ${fmt(gross)}/mo · ${fmt(gross * 12)}/an'],
    [
      "<div class=\"res-section\"><div class=\"res-section-title\">Revenu brut</div>${row(`Gross${lbl}`, fmt(gross))}${row(`Taxable after CNaPS${lbl}`, fmt(taxable), 'c-mut')}</div>",
      "<div class=\"res-section\"><div class=\"res-section-title\">Revenu brut</div>${row(`Brut${lbl}`, fmt(gross))}${row(`Imposable après CNaPS${lbl}`, fmt(taxable), 'c-mut')}</div>",
    ],
    [
      "<div class=\"res-section\"><div class=\"res-section-title\">Déductions</div>${cnaps > 0 ? row(`CNaPS (1%)${lbl}`, fmt(cnaps), 'c-red') : ''}${row(`IRSA before relief${lbl}`, fmt(baseTax), 'c-red')}${relief > 0 ? row(`Dependent relief (${R.dependents})${lbl}`, fmt(relief), 'c-grn') : ''}${row(`IRSA due${lbl}`, fmt(tax), 'c-red')}</div>",
      "<div class=\"res-section\"><div class=\"res-section-title\">Déductions</div>${cnaps > 0 ? row(`CNaPS (1 %)${lbl}`, fmt(cnaps), 'c-red') : ''}${row(`IRSA avant allègement${lbl}`, fmt(baseTax), 'c-red')}${relief > 0 ? row(`Allègement personnes à charge (${R.dependents})${lbl}`, fmt(relief), 'c-grn') : ''}${row(`IRSA dû${lbl}`, fmt(tax), 'c-red')}</div>",
    ],
    [
      "document.getElementById('aiStatus').textContent = `Brut : ${fmt(gross)}/mo · Net : ${fmt(net)}/mo · IRSA: ${fmt(tax)}/mo${dependentRelief > 0 ? ' · Relief: ' + fmt(dependentRelief) : ''}`;",
      "document.getElementById('aiStatus').textContent = `Brut : ${fmt(gross)}/mo · Net : ${fmt(net)}/mo · IRSA : ${fmt(tax)}/mo${dependentRelief > 0 ? ' · Allègement : ' + fmt(dependentRelief) : ''}`;",
    ],
    [
      "const text = `PAYE Madagascar: Brut MGA ${Math.round(RESULT.gross).toLocaleString()}/mo → Net MGA ${Math.round(RESULT.net).toLocaleString()}/mo after IRSA and CNaPS. afrotools.com/fr/madagascar/mg-paye`;",
      "const text = `PAYE Madagascar : brut MGA ${Math.round(RESULT.gross).toLocaleString()}/mo → net MGA ${Math.round(RESULT.net).toLocaleString()}/mo après IRSA et CNaPS. afrotools.com/fr/madagascar/mg-paye`;",
    ],
    [
      "const prompt='PAYE Madagascar: Brut MGA '+Math.round(RESULT.gross).toLocaleString()+'/mo, taxable MGA '+Math.round(RESULT.taxable).toLocaleString()+'/mo, IRSA MGA '+Math.round(RESULT.tax).toLocaleString()+'/mo, CNaPS MGA '+Math.round(RESULT.cnaps).toLocaleString()+'/mo, dependents '+RESULT.dependents+', relief MGA '+Math.round(RESULT.dependentRelief).toLocaleString()+'/mo, Net MGA '+Math.round(RESULT.net).toLocaleString()+'/mo. Give 1) summary 2) two tax planning tips 3) one compliance point. Moins de 150 mots. Pas de markdown.';",
      "const prompt='Analyse PAYE Madagascar : brut MGA '+Math.round(RESULT.gross).toLocaleString()+'/mo, imposable MGA '+Math.round(RESULT.taxable).toLocaleString()+'/mo, IRSA MGA '+Math.round(RESULT.tax).toLocaleString()+'/mo, CNaPS MGA '+Math.round(RESULT.cnaps).toLocaleString()+'/mo, personnes à charge '+RESULT.dependents+', allègement MGA '+Math.round(RESULT.dependentRelief).toLocaleString()+'/mo, net MGA '+Math.round(RESULT.net).toLocaleString()+'/mo. Donnez 1) un résumé clair 2) deux conseils d’optimisation fiscale 3) un point de conformité. Moins de 150 mots. Pas de markdown.';",
    ],
    [
      'AfroTools AI Tax Advisor for Madagascar IRSA and CNaPS. Répondez avec concision. Pas de markdown.',
      'Vous êtes le conseiller fiscal IA d’AfroTools spécialisé dans l’IRSA et la CNaPS à Madagascar. Répondez avec concision. Pas de markdown.',
    ],
    ["data.text||'Unable to generate analysis.'", "data.text||'Impossible de générer l’analyse.'"],
    [
      "e.message==='rate-limit'?'Too many requests — try again in a minute.':'AI analysis temporarily unavailable.'",
      "e.message==='rate-limit'?'Trop de demandes — réessayez dans une minute.':'Analyse IA temporairement indisponible.'",
    ],
  ],
  'fr/sierra-leone/sl-paye.html': [
    ['30% flat', '30 % fixe'],
    ['Tax (SLE)', 'Impôt (SLE)'],
    ['NASSIT (employee)', 'NASSIT (salarié)'],
    [
      '⚠ Secondary employment: flat 30% applied to full gross — no tax-free band, no NASSIT deduction for PAYE purposes.',
      '⚠ Emploi secondaire : taux fixe de 30 % appliqué à l’intégralité du brut — aucune tranche exonérée et aucune déduction NASSIT pour le PAYE.',
    ],
    [
      '⚠ Secondary employment — flat 30% applied to gross SLE ${Math.round(R.gross).toLocaleString()}',
      '⚠ Emploi secondaire — taux fixe de 30 % appliqué au brut SLE ${Math.round(R.gross).toLocaleString()}',
    ],
    ['PAYE Sierra Leone analysis (2025/26, NRA):', 'Analyse PAYE Sierra Leone (2025/26, NRA) :'],
    ['- NASSIT employee (', '- NASSIT salarié ('],
    ['- PAYE taxable income (gross less NASSIT):', '- Revenu imposable PAYE (brut moins NASSIT) :'],
    ['- Monthly PAYE:', '- PAYE mensuel :'],
    ['- Effective tax rate:', '- Taux effectif :'],
    ["- Secondary employment: ${R.isSecondary ? 'YES — flat 30% applied' : 'No'}", "- Emploi secondaire : ${R.isSecondary ? 'OUI — taux fixe de 30 % appliqué' : 'Non'}"],
    ['- Employer NASSIT (10%):', '- NASSIT employeur (10 %) :'],
    ['- Total employer cost:', '- Coût total employeur :'],
    ['Résumé clair en français of PAYE position', 'Résumé clair en français de la situation PAYE'],
    ['Two specific legal ways to reduce Sierra Leone tax liability (approved pension deductions, benefits in kind, allowances)', 'Deux moyens légaux précis de réduire la charge fiscale en Sierra Leone (déductions de pension approuvées, avantages en nature, indemnités)'],
    ['One NRA compliance point employers need to know', 'Un point de conformité NRA que les employeurs doivent connaître'],
    ['One thing most Sierra Leonean employees get wrong about NASSIT or PAYE.', 'Un point que beaucoup de salariés sierra-léonais comprennent mal à propos de la NASSIT ou du PAYE.'],
    [
      'Vous êtes le conseiller fiscal IA d’AfroTools spécialisé dans PAYE Sierra Leone — NRA progressive tax, NASSIT social security, Impot sur le revenu Act 2000. Soyez concis, précis et pratique. Pas de markdown, pas d’astérisques.',
      'Vous êtes le conseiller fiscal IA d’AfroTools spécialisé dans le PAYE en Sierra Leone — barème progressif NRA, sécurité sociale NASSIT et Income Tax Act 2000. Soyez concis, précis et pratique. Pas de markdown, pas d’astérisques.',
    ],
    ['Conseiller fiscal IA AfroTools, Sierra Leone. User: ${R.sector} sector, gross SLE', "Conseiller fiscal IA AfroTools, Sierra Leone. Utilisateur : secteur ${R.sector === 'private' ? 'privé' : 'public'}, brut SLE"],
    [', take-home SLE ', ', net SLE '],
    ['. Concise. Pas de markdown.', '. Réponse concise. Pas de markdown.'],
  ],
  'fr/uganda/ug-paye.html': [
    [
      '<div class="tog-label">Resident<div class="tog-rate">Impot progressif</div></div>',
      '<div class="tog-label">Résident<div class="tog-rate">Impôt progressif</div></div>',
    ],
    [
      '<div class="tog-label">Non-resident<div class="tog-rate">Taux fixe 30%</div></div>',
      '<div class="tog-label">Non-résident<div class="tog-rate">Taux fixe 30 %</div></div>',
    ],
    [
      "const lstLabel = isAnnual ? 'Local Service Tax (annual)' : 'Local Service Tax (annual avg.; paid in 4 instalments)';",
      "const lstLabel = isAnnual ? 'Local Service Tax (annuelle)' : 'Local Service Tax (moyenne annuelle ; payée en 4 versements)';",
    ],
    [
      '⚠ Non-resident: flat 30% applied to full gross. No progressive bands, no deductions allowed.',
      '⚠ Non-résident : taux fixe de 30 % appliqué à l’intégralité du brut. Pas de tranches progressives ni de déductions autorisées.',
    ],
    ['Tax (UGX)', 'Impôt (UGX)'],
    ['Local Service Tax (annual average; paid in 4 instalments)', 'Local Service Tax (moyenne annuelle ; payée en 4 versements)'],
    ['⚠ Non-resident — flat 30% applied to gross UGX ${Math.round(R.gross).toLocaleString()}', '⚠ Non-résident — taux fixe de 30 % appliqué au brut UGX ${Math.round(R.gross).toLocaleString()}'],
    ['Resident taxpayer — progressive bands apply to gross salary', 'Contribuable résident — les tranches progressives s’appliquent au salaire brut'],
    ['NSSF (5%, employee)', 'NSSF (5 %, salarié)'],
    ['<tr><td>Salaire Brut Mensuel (Resident)</td><td class="num">UGX ${Math.round(R.gross).toLocaleString()}</td></tr>', '<tr><td>Salaire brut mensuel (résident)</td><td class="num">UGX ${Math.round(R.gross).toLocaleString()}</td></tr>'],
    ['PAYE Ouganda analysis (2025/26, URA):', 'Analyse PAYE Ouganda (2025/26, URA) :'],
    ["- Status: ${R.isNonRes ? 'Non-resident (30% flat)' : 'Resident (progressive)'}", "- Statut : ${R.isNonRes ? 'Non-résident (taux fixe 30 %)' : 'Résident (barème progressif)'}"],
    ['- NSSF employee (5%, NOT deductible):', '- NSSF salariale (5 %, non déductible) :'],
    ['- Monthly PAYE:', '- PAYE mensuel :'],
    ['- Effective tax rate:', '- Taux effectif :'],
    ["- Local Service Tax: ${R.hasLST ? 'Included (official annual band averaged monthly)' : 'Excluded'}", "- Local Service Tax : ${R.hasLST ? 'Incluse (tranche annuelle officielle moyennée par mois)' : 'Exclue'}"],
    ['- Employer NSSF (10%):', '- NSSF employeur (10 %) :'],
    ['- Total employer cost:', '- Coût total employeur :'],
    ['Résumé clair en français of PAYE Ouganda position', 'Résumé clair en français de la situation PAYE en Ouganda'],
    ['Two specific legal ways to reduce Uganda tax liability (life insurance relief, capital allowances, mortgage interest deduction)', 'Deux moyens légaux précis de réduire la charge fiscale en Ouganda (allègement assurance-vie, amortissements, déduction des intérêts hypothécaires)'],
    ['One URA compliance point to know', 'Un point de conformité URA à connaître'],
    ['One thing most Ugandan employees get wrong about NSSF deductibility.', 'Un point que beaucoup de salariés ougandais comprennent mal à propos de la déductibilité NSSF.'],
    [
      'Vous êtes le conseiller fiscal IA d’AfroTools spécialisé dans PAYE Ouganda — URA progressive tax, NSSF, Local Service Tax, Impot sur le revenu Act 2000. Soyez concis, précis et pratique. Pas de markdown, pas d’astérisques.',
      'Vous êtes le conseiller fiscal IA d’AfroTools spécialisé dans le PAYE en Ouganda — barème progressif URA, NSSF, Local Service Tax et Income Tax Act 2000. Soyez concis, précis et pratique. Pas de markdown, pas d’astérisques.',
    ],
    ["Conseiller fiscal IA AfroTools, Uganda. User: ${R.isNonRes?'Non-resident':'Resident'}, gross UGX", "Conseiller fiscal IA AfroTools, Ouganda. Utilisateur : ${R.isNonRes?'non-résident':'résident'}, brut UGX"],
    [', take-home UGX ', ', net UGX '],
    ['. Concise. Pas de markdown.', '. Réponse concise. Pas de markdown.'],
  ],
};

const pages = [];

pages.push({
  file: 'fr/benin/bj-paye.html',
  title: 'Calculateur PAYE Bénin 2026 | AfroTools',
  description: 'Calculateur PAYE Bénin 2025/26. Barème progressif DGI de 0 % à 25 %, CNPS 2,5 % salarié / 9,5 % employeur et estimation nette mensuelle. PDF gratuit.',
  ogTitle: 'Calculateur PAYE Bénin 2025/26 | AfroTools',
  ogDescription: 'Calculateur PAYE Bénin 2025/26 avec barème DGI 0 % à 25 %, CNPS 2,5 % / 9,5 % et export PDF gratuit.',
  pairs: [
    ['<div class="breadcrumb"><a href="https://afrotools.com">AfroTools</a> / <a href="/fr/benin/">Benin</a> / <span>Calculateur PAYE</span></div>', '<div class="breadcrumb"><a href="https://afrotools.com">AfroTools</a> / <a href="/fr/benin/">Bénin</a> / <span>Calculateur PAYE</span></div>'],
    ['<h1>Calculateur PAYE Benin <em>2025/26</em></h1>', '<h1>Calculateur PAYE Bénin <em>2025/26</em></h1>'],
    [`<p class="hero-sub">Calculez votre salaire net mensuel avec DGI progressive tax rates (0%–25%), CNPS contributions, and Benin employment law. Precis, gratuit et instantane. Generated for the Beninese employment market.</p>`, `<p class="hero-sub">Calculez votre salaire net mensuel au Bénin avec le barème progressif de la DGI (0 % à 25 %), la CNPS et les principales règles de paie locales. Estimation rapide, claire et gratuite pour le marché béninois.</p>`],
    [`<div class="hero-meta">Mis a jour 10 March 2026 · Source: DGI (impots.finances.gouv.bj), CNPS. A titre informatif uniquement.</div>`, `<div class="hero-meta">Mis à jour le 10 mars 2026 · Sources : DGI (impots.finances.gouv.bj) et CNPS · À titre informatif uniquement.</div>`],
    ['Calculateur TVA Benin', 'Calculateur TVA Bénin'],
    ['const dateStr= new Date().toLocaleDateString(\'en-BJ\',{day:\'numeric\',month:\'long\',year:\'numeric\'});', 'const dateStr= new Date().toLocaleDateString(\'fr-FR\',{day:\'numeric\',month:\'long\',year:\'numeric\'});'],
    ['<title>AfroTools Benin PAYE — ${refNo}</title>', '<title>AfroTools Calculateur PAYE Bénin — ${refNo}</title>'],
    ['Rate ${(b.rate*100)}% on XOF ${Math.round(b.income).toLocaleString()}', 'Taux ${(b.rate*100)} % sur XOF ${Math.round(b.income).toLocaleString()}'],
    ['Calculateur PAYE Benin', 'Calculateur PAYE Bénin'],
    ['"name": "Benin PAYE Calculator 2025/26"', '"name": "Calculateur PAYE Bénin 2025/26"'],
  ],
  guideSection: `
<!-- TWO-COLUMN GUIDE -->
<section class="ng-guide-sec">
  <div class="container">
    <div class="ng-guide-header">
      <h2 class="ng-guide-title">Guide PAYE Bénin 2025/26</h2>
    </div>
    <div class="ng-guide-grid">
      <div class="ng-guide-col">
        <div class="ng-guide-card">
          <p style="font-size:0.85rem;color:#475569;line-height:1.65;margin-bottom:0;">Au Bénin, le PAYE est administré par la <strong>DGI</strong> (Direction Générale des Impôts) au moyen d'un barème progressif annuel en <strong>sept tranches</strong>, de 0 % à 25 %. Le seuil exonéré est fixé à <strong>XOF 300&nbsp;000 par an</strong>, soit XOF 25&nbsp;000 par mois. Le pays utilise le franc CFA BCEAO (XOF), partagé avec d'autres États de l'UEMOA.</p>
        </div>
        <div class="ng-guide-card">
          <p style="font-size:0.85rem;color:#475569;line-height:1.65;margin-bottom:0;">Les salariés cotisent à la <strong>CNPS</strong> à hauteur de <strong>2,5 %</strong> du salaire brut, tandis que l'employeur verse <strong>9,5 %</strong> en complément. La part salariale est déductible avant application du barème DGI, ce qui réduit la base imposable. Les retenues sont ensuite reversées mensuellement par l'employeur.</p>
        </div>
      </div>
      <div class="ng-guide-col">
        <div class="ng-guide-card ng-guide-card-table">
          <h3>Barème DGI du Bénin</h3>
          <div class="ng-bands-table-wrap"><table class="ng-bands-table">
      <thead><tr><th>Revenu annuel imposable (XOF)</th><th>Taux</th><th>Impôt par tranche</th></tr></thead>
      <tbody>
        <tr><td>XOF 0 – 300,000</td><td>0%</td><td>XOF 0</td></tr>
        <tr><td>XOF 300,001 – 600,000</td><td>2%</td><td>Jusqu'à XOF 6,000</td></tr>
        <tr><td>XOF 600,001 – 1,200,000</td><td>5%</td><td>Jusqu'à XOF 36,000</td></tr>
        <tr><td>XOF 1,200,001 – 2,400,000</td><td>10%</td><td>Jusqu'à XOF 156,000</td></tr>
        <tr><td>XOF 2,400,001 – 4,800,000</td><td>15%</td><td>Jusqu'à XOF 516,000</td></tr>
        <tr><td>XOF 4,800,001 – 9,600,000</td><td>20%</td><td>Jusqu'à XOF 1,476,000</td></tr>
        <tr><td>Au-dessus de XOF 9,600,000</td><td>25%</td><td>25 % sur l'excédent au-dessus de XOF 9,600,000</td></tr>
      </tbody>
    </table></div>
        </div>
      </div>
    </div>
    <div class="ng-guide-footer-note">
      <p>Le tableau ci-dessus reprend le barème annuel 2025/26 de la DGI. Le taux marginal maximal du Bénin reste à 25 %, un niveau plus modéré que dans plusieurs autres marchés ouest-africains.</p>
    </div>
  </div>
</section>`,
  faqSection: `
<!-- FAQ -->
<section class="ng-faq-sec">
  <div class="container">
    <div class="ng-faq-header">
      <span class="eyebrow">FAQ fiscale Bénin</span>
      <h2 class="ng-faq-title">Questions fréquentes sur le PAYE</h2>
    </div>
    <div class="ng-faq-grid">
      <div class="ng-faq-col">
        <details class="ng-faq-item" open>
          <summary>Quelles sont les tranches DGI du Bénin en 2025/26 ?</summary>
          <p>Le barème annuel comprend sept tranches : 0 % jusqu'à XOF 300&nbsp;000, puis 2 %, 5 %, 10 %, 15 %, 20 % et enfin 25 % au-dessus de XOF 9,600,000. Le calcul s'applique au revenu imposable après déduction de la CNPS salariale.</p>
        </details>
        <details class="ng-faq-item">
          <summary>La cotisation CNPS est-elle déductible avant l'impôt ?</summary>
          <p>Oui. La cotisation salariale obligatoire de 2,5 % est déduite du brut avant calcul de la DGI. La part employeur de 9,5 % constitue un coût supplémentaire pour l'entreprise et n'est pas retirée du salaire net du salarié.</p>
        </details>
        <details class="ng-faq-item">
          <summary>Quand le PAYE est-il calculé et reversé au Bénin ?</summary>
          <p>Le barème est annuel, mais l'employeur retient l'impôt chaque mois sur la paie et le reverse ensuite à la DGI selon les échéances de déclaration. Une régularisation peut intervenir en fin d'exercice si nécessaire.</p>
        </details>
      </div>
      <div class="ng-faq-col">
        <details class="ng-faq-item">
          <summary>Quel est le taux total de CNPS au Bénin ?</summary>
          <p>Le taux global retenu ici est de 12 % du salaire brut : 2,5 % pour le salarié et 9,5 % pour l'employeur. Cette ventilation correspond au schéma standard appliqué pour l'estimation AfroTools.</p>
        </details>
        <details class="ng-faq-item">
          <summary>Y a-t-il d'autres retenues obligatoires à prévoir ?</summary>
          <p>Selon l'employeur, la paie peut aussi inclure d'autres rubriques administratives ou avantages contractuels. Ce calculateur se concentre sur la DGI, la CNPS salariée et le coût CNPS employeur afin de rester comparable d'une entreprise à l'autre.</p>
        </details>
        <details class="ng-faq-item">
          <summary>À quoi sert l'équivalent mensuel affiché ?</summary>
          <p>Votre salaire annuel est divisé par 12 pour donner un repère mensuel simple. En revanche, l'impôt béninois reste calculé sur l'année complète, pas sur un barème mensuel indépendant.</p>
        </details>
      </div>
    </div>
  </div>
</section>`,
});

pages.push({
  file: 'fr/djibouti/dj-paye.html',
  title: 'Calculateur PAYE Djibouti 2026 | AfroTools',
  description: 'Calculateur PAYE Djibouti 2025/26. IRPP progressif de 0 % à 30 %, sécurité sociale 4 % salarié / 15,7 % employeur et estimation nette mensuelle. PDF gratuit.',
  ogTitle: 'Calculateur PAYE Djibouti 2025/26 | AfroTools',
  ogDescription: 'Calculateur PAYE Djibouti avec IRPP 0 % à 30 %, sécurité sociale 4 % / 15,7 % et export PDF gratuit.',
  pairs: [
    [`<p class="hero-sub">Estimate your monthly take-home pay using Djibouti IRPP progressive tax rates (0%–30%), social security contributions, and standard payroll assumptions.</p>`, `<p class="hero-sub">Estimez votre salaire net mensuel à Djibouti avec l'IRPP progressif (0 % à 30 %), la sécurité sociale et les principales hypothèses de paie locales.</p>`],
    ['<div class="badge b-blue">Social Security 4% / 15.7%</div>', '<div class="badge b-blue">Sécurité sociale 4 % / 15,7 %</div>'],
    ['<div class="badge b-red">Monthly Bands</div>', '<div class="badge b-red">Tranches mensuelles</div>'],
    ['<div class="hero-meta">Mis a jour 6 April 2026 · Informational estimate.</div>', '<div class="hero-meta">Mis à jour le 6 avril 2026 · Estimation informative.</div>'],
    ['<div class="card-head"><span class="card-title">Saisie du salaire</span><span class="card-sub">Monthly gross</span></div>', '<div class="card-head"><span class="card-title">Saisie du salaire</span><span class="card-sub">Brut mensuel</span></div>'],
    ['<div class="f-label"><span class="f-label-text">Salaire Brut Mensuel</span><span class="f-hint">DJF per month</span></div>', '<div class="f-label"><span class="f-label-text">Salaire brut mensuel</span><span class="f-hint">DJF par mois</span></div>'],
    ['<p class="f-note">Enter your monthly gross salary.</p>', '<p class="f-note">Saisissez votre salaire brut mensuel.</p>'],
  ],
  guideSection: `
<!-- TWO-COLUMN GUIDE -->
<section class="ng-guide-sec">
  <div class="container">
    <div class="ng-guide-header">
      <h2 class="ng-guide-title">Comment l'IRPP de Djibouti est calculé en 2025/26</h2>
    </div>
    <div class="ng-guide-grid">
      <div class="ng-guide-col">
        <div class="ng-guide-card">
          <p style="font-size:0.85rem;color:#475569;line-height:1.65;margin-bottom:0;">L'impôt sur les revenus d'emploi à Djibouti relève de l'<strong>IRPP</strong> (Impôt sur le Revenu des Personnes Physiques) et est administré par la <strong>Direction Générale des Impôts et des Domaines (DGID)</strong>. Le calcul est effectué sur une <strong>base mensuelle</strong>, après déduction de la cotisation salariale de sécurité sociale.</p>
        </div>
        <div class="ng-guide-card">
          <p style="font-size:0.85rem;color:#475569;line-height:1.65;margin-bottom:0;">Le salarié verse <strong>4 %</strong> de son salaire brut à la sécurité sociale. Cette part est déductible avant application des tranches IRPP. L'employeur verse en parallèle <strong>15,7 %</strong>, ce qui porte le coût total de sécurité sociale à 19,7 % dans le modèle standard utilisé ici.</p>
        </div>
        <div class="ng-guide-card">
          <p style="font-size:0.85rem;color:#475569;line-height:1.65;margin-bottom:0;">Le barème mensuel comporte <strong>six tranches</strong> : 0 % sur les premiers DJF 50&nbsp;000, puis 2 %, 15 %, 18 %, 20 % et 30 % au-dessus de DJF 2,000,000. Les employeurs retiennent l'IRPP chaque mois et le reversent ensuite à l'administration fiscale.</p>
        </div>
        <div class="ng-guide-card">
          <p style="font-size:0.85rem;color:#475569;line-height:1.65;margin-bottom:0;">Djibouti est un hub régional logistique et portuaire, ce qui explique la présence d'une main-d'œuvre locale et internationale importante. Vérifiez toujours la version la plus récente des taux auprès de la DGID ou du ministère des Finances pour une paie de production.</p>
        </div>
      </div>
      <div class="ng-guide-col">
        <div class="ng-guide-card ng-guide-card-table">
          <h3>Barème IRPP de Djibouti 2025/26</h3>
          <div class="ng-bands-table-wrap"><div>
    <table class="ng-bands-table">
      <thead><tr>
        <th>Revenu mensuel imposable (DJF)</th>
        <th>Taux</th>
      </tr></thead>
      <tbody>
        <tr><td>0 – 50,000</td><td>0%</td></tr>
        <tr><td>50,001 – 150,000</td><td>2%</td></tr>
        <tr><td>150,001 – 500,000</td><td>15%</td></tr>
        <tr><td>500,001 – 1,000,000</td><td>18%</td></tr>
        <tr><td>1,000,001 – 2,000,000</td><td>20%</td></tr>
        <tr><td>Au-dessus de 2,000,000</td><td>30%</td></tr>
      </tbody>
    </table>
  </div></div>
        </div>
      </div>
    </div>
    <div class="ng-guide-footer-note">
      <p>Cotisation salariale : 4 % déductibles. Cotisation employeur : 15,7 %. L'IRPP est appliqué mensuellement sur la base de la rémunération imposable après sécurité sociale.</p>
    </div>
  </div>
</section>`,
  faqSection: `
<!-- FAQ -->
<section class="ng-faq-sec">
  <div class="container">
    <div class="ng-faq-header">
      <span class="eyebrow">FAQ fiscale Djibouti</span>
      <h2 class="ng-faq-title">Questions fréquentes sur le PAYE</h2>
    </div>
    <div class="ng-faq-grid">
      <div class="ng-faq-col">
        <details class="ng-faq-item" open>
          <summary>Quelles sont les tranches IRPP à Djibouti ?</summary>
          <p>Le barème mensuel comporte six tranches : 0 % jusqu'à DJF 50&nbsp;000, puis 2 %, 15 %, 18 %, 20 % et 30 % au-dessus de DJF 2,000,000 de revenu imposable mensuel.</p>
        </details>
        <details class="ng-faq-item">
          <summary>La sécurité sociale est-elle déductible avant l'IRPP ?</summary>
          <p>Oui. La cotisation salariale de 4 % est retirée du salaire brut avant calcul de l'IRPP, ce qui réduit la base imposable retenue sur la paie.</p>
        </details>
        <details class="ng-faq-item">
          <summary>Quel est le taux total de sécurité sociale ?</summary>
          <p>Le total retenu ici est de 19,7 % : 4 % à la charge du salarié et 15,7 % à la charge de l'employeur.</p>
        </details>
      </div>
      <div class="ng-faq-col">
        <details class="ng-faq-item">
          <summary>À quel moment l'impôt est-il calculé à Djibouti ?</summary>
          <p>L'IRPP est calculé chaque mois sur le revenu imposable mensuel. L'employeur effectue la retenue sur la paie et reverse ensuite l'impôt à l'administration fiscale.</p>
        </details>
        <details class="ng-faq-item">
          <summary>Y a-t-il d'autres retenues obligatoires ?</summary>
          <p>Au-delà de l'IRPP et de la sécurité sociale, d'autres retenues peuvent exister selon le contrat de travail ou les avantages gérés par l'employeur. Elles ne sont pas incluses dans ce calculateur standard.</p>
        </details>
        <details class="ng-faq-item">
          <summary>Comment gérer plusieurs emplois à Djibouti ?</summary>
          <p>En pratique, le revenu total reste soumis au barème progressif. Si vous cumulez plusieurs employeurs, vérifiez la coordination des retenues afin d'éviter un sous-prélèvement ou un trop-perçu sur l'année.</p>
        </details>
      </div>
    </div>
  </div>
</section>`,
});

pages.push({
  file: 'fr/ethiopia/et-paye.html',
  title: 'Calculateur PAYE Éthiopie 2026 | AfroTools',
  description: "Calculateur PAYE Éthiopie 2025/26. Barème ERCA de 0 % à 35 %, pension salariale 7 % déductible, pension employeur 11 % et estimation nette mensuelle. PDF gratuit.",
  ogTitle: 'Calculateur PAYE Éthiopie 2025/26 | AfroTools',
  ogDescription: "Calculateur PAYE Éthiopie avec barème ERCA 0 % à 35 %, pension 7 % déductible et export PDF gratuit.",
  pairs: [
    ['<h1>Ethiopia PAYE<br><em>Calculator 2025/26</em></h1>', '<h1>Calculateur PAYE Éthiopie<br><em>2025/26</em></h1>'],
    [`<p class="hero-sub">ERCA progressive tax (0%–35%), Employee Pension Fund 7% (tax-deductible), Employer 11% (18% total). Monthly computation per ERCA bands.</p>`, `<p class="hero-sub">Barème progressif ERCA (0 % à 35 %), pension salariale de 7 % déductible et pension employeur de 11 %. Calcul mensuel aligné sur les tranches officielles en Éthiopie.</p>`],
    ['<span class="badge b-green">ERCA 2025/26 Verified</span>', '<span class="badge b-green">ERCA 2025/26 vérifié</span>'],
    ['<span class="badge b-blue">Pension Fund · Deductible</span>', '<span class="badge b-blue">Fonds de pension · déductible</span>'],
    ['<span class="badge b-grey">ETB · Ethiopian Birr</span>', '<span class="badge b-grey">ETB · birr éthiopien</span>'],
    ['<p class="hero-meta">Last verified: Apr 2026 · Source: ERCA (erca.gov.et) · Impôt sur le Revenu Proclamation No. 1395/2025 · Cotisation de Pension Regulations</p>', '<p class="hero-meta">Mis à jour : avril 2026 · Sources : ERCA (erca.gov.et), Proclamation n° 1395/2025 sur l’impôt sur le revenu et règles de pension</p>'],
    ['Calculateur TVA Ethiopia', 'Calculateur TVA Éthiopie'],
    ['<strong>2025/26 Key Facts (Proclamation 1395/2025):</strong> PAYE bands: <strong>0% on first ETB 2,000/month</strong>, then 15%–35% across six brackets. Top rate <strong>35% above ETB 14,000/month</strong>. Employee Pension <strong>7% of gross salary and fully tax-deductible</strong>. Employer Pension <strong>11% of salary</strong> (separate cost). Total: <strong>18%</strong>. Remit by <strong>10th of following month</strong>.', '<strong>Faits clés 2025/26 (Proclamation 1395/2025) :</strong> 0 % sur les premiers ETB 2,000 par mois, puis 15 % à 35 % sur six tranches. Le taux maximal est de <strong>35 % au-dessus de ETB 14,000/mois</strong>. La pension salariale de <strong>7 %</strong> est entièrement déductible ; l’employeur verse <strong>11 %</strong> en plus, soit <strong>18 %</strong> au total. Les versements sont attendus au plus tard le <strong>10 du mois suivant</strong>.'],
    ['<title>AfroTools Ethiopia PAYE — ${refNo}</title>', '<title>AfroTools Calculateur PAYE Éthiopie — ${refNo}</title>'],
    ['Calculateur PAYE Ethiopia', 'Calculateur PAYE Éthiopie'],
    ['Rate ${(b.rate*100)}% on ETB ${Math.round(b.income).toLocaleString()}', 'Taux ${(b.rate*100)} % sur ETB ${Math.round(b.income).toLocaleString()}'],
    ['"name": "Ethiopia PAYE Calculator 2025/26"', '"name": "Calculateur PAYE Éthiopie 2025/26"'],
  ],
  guideSection: `
<!-- TWO-COLUMN GUIDE -->
<section class="ng-guide-sec">
  <div class="container">
    <div class="ng-guide-header">
      <h2 class="ng-guide-title">Comment le PAYE en Éthiopie est calculé en 2025/26</h2>
    </div>
    <div class="ng-guide-grid">
      <div class="ng-guide-col">
        <div class="ng-guide-card">
          <p style="font-size:0.85rem;color:#475569;line-height:1.65;margin-bottom:0;">Le PAYE éthiopien est administré par l'<strong>ERCA</strong> (Ethiopian Revenue and Customs Authority). Tous les employeurs doivent retenir l'impôt chaque mois, puis le reverser au plus tard le 10 du mois suivant. Sont imposables les salaires, primes, avantages en nature et autres revenus liés à l'emploi.</p>
        </div>
        <div class="ng-guide-card">
          <p style="font-size:0.85rem;color:#475569;line-height:1.65;margin-bottom:0;">Depuis la proclamation <strong>n° 1395/2025</strong>, le barème mensuel comprend six tranches : 0 % jusqu'à ETB 2,000, puis 15 %, 20 %, 25 %, 30 % et 35 % au-dessus de ETB 14,000. Chaque taux ne s'applique qu'à la part de revenu comprise dans sa tranche.</p>
        </div>
        <div class="ng-guide-card">
          <p style="font-size:0.85rem;color:#475569;line-height:1.65;margin-bottom:0;">La principale déduction avant impôt est la <strong>cotisation salariale au fonds de pension</strong>. Le salarié verse <strong>7 %</strong> du salaire brut et cette part est entièrement déductible avant calcul du PAYE. L'employeur verse en parallèle <strong>11 %</strong> en coût supplémentaire.</p>
        </div>
        <div class="ng-guide-card">
          <p style="font-size:0.85rem;color:#475569;line-height:1.65;margin-bottom:0;">L'année fiscale suit le calendrier budgétaire éthiopien. Les employeurs doivent déposer une déclaration mensuelle même lorsque l'impôt dû est nul. Pour une paie opérationnelle, vérifiez toujours la réglementation la plus récente publiée par l'ERCA.</p>
        </div>
      </div>
      <div class="ng-guide-col">
        <div class="ng-guide-card ng-guide-card-table">
          <h3>Barème PAYE Éthiopie 2025/26</h3>
          <div class="ng-bands-table-wrap"><div>
    <table class="ng-bands-table">
      <thead>
        <tr>
          <th>Tranche mensuelle (ETB)</th>
          <th>Taux</th>
        </tr>
      </thead>
      <tbody>
        <tr><td>0 – 2,000</td><td>0%</td></tr>
        <tr><td>2,001 – 4,000</td><td>15%</td></tr>
        <tr><td>4,001 – 7,000</td><td>20%</td></tr>
        <tr><td>7,001 – 10,000</td><td>25%</td></tr>
        <tr><td>10,001 – 14,000</td><td>30%</td></tr>
        <tr><td>Au-dessus de 14,000</td><td>35%</td></tr>
      </tbody>
    </table>
  </div></div>
        </div>
      </div>
    </div>
  </div>
</section>`,
  faqSection: `
<!-- FAQ -->
<section class="ng-faq-sec">
  <div class="container">
    <div class="ng-faq-header">
      <span class="eyebrow">FAQ fiscale Éthiopie</span>
      <h2 class="ng-faq-title">Questions fréquentes sur le PAYE</h2>
    </div>
    <div class="ng-faq-grid">
      <div class="ng-faq-col">
        <details class="ng-faq-item" open>
          <summary>Quelles sont les tranches PAYE en Éthiopie pour 2025/26 ?</summary>
          <p>Le barème mensuel issu de la proclamation n° 1395/2025 prévoit 0 % sur les premiers ETB 2,000, puis 15 %, 20 %, 25 %, 30 % et 35 % au-dessus de ETB 14,000. Le calcul se fait sur le revenu imposable après déduction de la pension salariée.</p>
        </details>
        <details class="ng-faq-item">
          <summary>La cotisation pension est-elle déductible avant le PAYE ?</summary>
          <p>Oui. La cotisation salariale obligatoire de 7 % est retirée du salaire brut avant calcul de l'impôt. La part employeur de 11 % n'est pas prélevée sur le salaire net du salarié.</p>
        </details>
        <details class="ng-faq-item">
          <summary>Comment la pension est-elle traitée pour les hauts salaires ?</summary>
          <p>Le calculateur applique les pourcentages statutaires puis calcule le PAYE sur le revenu restant après déduction de la pension salariale. Si votre employeur applique des règles spécifiques de fonds ou de plafond, il faut les confirmer auprès de la paie ou de l'organisme de pension.</p>
        </details>
      </div>
      <div class="ng-faq-col">
        <details class="ng-faq-item">
          <summary>Quand l'employeur doit-il verser les cotisations de pension ?</summary>
          <p>Les cotisations de pension sont généralement attendues au plus tard le 10 du mois suivant la paie. L'employeur doit aussi déposer la déclaration PAYE mensuelle séparément auprès de l'ERCA.</p>
        </details>
        <details class="ng-faq-item">
          <summary>Qu'est-ce qui a changé avec la proclamation n° 1395/2025 ?</summary>
          <p>La réforme a simplifié le barème en six tranches et relevé le seuil exonéré à ETB 2,000 par mois, ce qui allège l'impôt pour une large partie des salariés. Le calculateur tient compte de cette structure actualisée.</p>
        </details>
        <details class="ng-faq-item">
          <summary>Le revenu d'un second emploi est-il imposé en Éthiopie ?</summary>
          <p>Oui. Les revenus d'emploi multiples restent imposables et doivent être intégrés dans l'analyse de votre situation fiscale. Si vous cumulez plusieurs sources salariales, validez toujours le traitement final avec un conseiller local.</p>
        </details>
      </div>
    </div>
  </div>
</section>`,
});

pages.push({
  file: 'fr/liberia/lr-paye.html',
  title: 'Calculateur PAYE Liberia 2026 | AfroTools',
  description: 'Calculateur PAYE Liberia 2025/26. Barème annuel LRA, NASSCORP 4 % salarié / 6 % employeur et estimation mensuelle du salaire net. PDF gratuit.',
  ogTitle: 'Calculateur PAYE Liberia 2025/26 | AfroTools',
  ogDescription: 'Calculateur PAYE Liberia avec barème annuel LRA, NASSCORP 4 % / 6 % et export PDF gratuit.',
  pairs: [
    ['<nav class="breadcrumb" aria-label="Breadcrumb">', '<nav class="breadcrumb" aria-label="Fil d’Ariane">'],
    ['<h1>Liberia PAYE<br><em>Calculator 2025/26</em></h1>', '<h1>Calculateur PAYE Liberia<br><em>2025/26</em></h1>'],
    [`<p class="hero-sub">Progressive income tax via LRA (Liberia Revenue Authority), with NASSCORP social security at 4.0% employee and 6.0% employer. Monthly take-home is estimated from the official annual LRA schedule.</p>`, `<p class="hero-sub">Impôt progressif administré par la LRA, avec NASSCORP à 4 % côté salarié et 6 % côté employeur. Le net mensuel est estimé à partir du barème annuel officiel du Liberia.</p>`],
    ['<span class="badge b-green">LRA (Liberia Revenue Authority) 2025/26 Verified</span>', '<span class="badge b-green">LRA 2025/26 vérifié</span>'],
    ['<p class="hero-meta">Last verified: April 2026 · Source: LRA Revenue Code · LRA tax education · NASSCORP employer guide</p>', '<p class="hero-meta">Mis à jour : avril 2026 · Sources : Liberia Revenue Code, guide fiscal LRA et guide employeur NASSCORP</p>'],
    ['<strong>2025/26 Key Facts: LRA resident natural person tax uses annual bands from 0% to 25%. NASSCORP: employee 4%, employer 6%. Monthly PAYE is estimated by annualizing salary and prorating the annual liability.</strong>', '<strong>Faits clés 2025/26 : le barème LRA des personnes physiques résidentes va de 0 % à 25 % sur une base annuelle. NASSCORP est modélisé à 4 % salarié et 6 % employeur. Le PAYE mensuel est estimé en annualisant le salaire puis en répartissant l’impôt sur 12 mois.</strong>'],
    ['<title>AfroTools Liberia PAYE — ${refNo}</title>', '<title>AfroTools Calculateur PAYE Liberia — ${refNo}</title>'],
    ['Rate ${(b.rate*100)}% on LRD ${Math.round(b.income).toLocaleString()}', 'Taux ${(b.rate*100)} % sur LRD ${Math.round(b.income).toLocaleString()}'],
    ['"name": "Liberia PAYE Calculator 2025/26"', '"name": "Calculateur PAYE Liberia 2025/26"'],
    ["LRA monthly gross base", "base brute mensuelle LRA"],
  ],
  guideSection: `
<!-- TWO-COLUMN GUIDE -->
<section class="ng-guide-sec">
  <div class="container">
    <div class="ng-guide-header">
      <h2 class="ng-guide-title">Comment l'impôt sur le revenu au Liberia est calculé en 2025/26</h2>
    </div>
    <div class="ng-guide-grid">
      <div class="ng-guide-col">
        <div class="ng-guide-card">
          <p style="font-size:0.85rem;color:#475569;line-height:1.65;margin-bottom:0;">L'impôt sur le revenu d'emploi au Liberia est administré par la <strong>Liberia Revenue Authority (LRA)</strong>. Le barème des personnes physiques résidentes est défini sur une <strong>base annuelle</strong>, puis la retenue PAYE opérée en paie est estimée chaque mois à partir de cette charge annuelle.</p>
        </div>
        <div class="ng-guide-card">
          <p style="font-size:0.85rem;color:#475569;line-height:1.65;margin-bottom:0;">La protection sociale obligatoire relève de la <strong>NASSCORP</strong>. Le schéma retenu ici applique <strong>4 %</strong> côté salarié et <strong>6 %</strong> côté employeur, soit <strong>10 %</strong> au total. Cette structure remplace l'ancien partage 3 % / 3 % que l'on trouve encore sur certaines pages anciennes.</p>
        </div>
        <div class="ng-guide-card">
          <p style="font-size:0.85rem;color:#475569;line-height:1.65;margin-bottom:0;">Le barème annuel LRA actuellement modélisé est de 0 % jusqu'à LRD 70,000, puis 5 % sur la tranche suivante, 15 % jusqu'à LRD 800,000, et 25 % au-dessus. Le calculateur annualise donc votre salaire, calcule l'impôt annuel, puis le ramène en équivalent mensuel.</p>
        </div>
        <div class="ng-guide-card">
          <p style="font-size:0.85rem;color:#475569;line-height:1.65;margin-bottom:0;">Le Liberia utilise à la fois le <strong>dollar libérien (LRD)</strong> et le <strong>dollar américain (USD)</strong>. Si votre salaire est libellé en USD, il faut d'abord le convertir dans la devise fiscale retenue pour la paie avant d'appliquer le barème LRA.</p>
        </div>
      </div>
      <div class="ng-guide-col">
        <div class="ng-guide-card ng-guide-card-table">
          <h3>Contributions NASSCORP 2025/26</h3>
          <div class="ng-bands-table-wrap"><div>
    <table class="ng-bands-table">
      <thead><tr>
        <th>Contribution</th>
        <th>Taux</th>
        <th>Notes</th>
      </tr></thead>
      <tbody>
        <tr><td>NASSCORP salarié</td><td>4%</td><td>Retenue sur la rémunération brute</td></tr>
        <tr><td>NASSCORP employeur</td><td>6%</td><td>Versée en plus du salaire brut</td></tr>
        <tr><td>Impôt LRA</td><td>0%–25%</td><td>Barème progressif annuel</td></tr>
      </tbody>
    </table>
  </div></div>
        </div>
      </div>
    </div>
    <div class="ng-guide-footer-note">
      <p>Devise : LRD / USD. Le calcul AfroTools annualise la rémunération pour estimer un PAYE mensuel comparable, mais il reste recommandé de confirmer les règles exactes avec la LRA ou votre service paie.</p>
    </div>
  </div>
</section>`,
  faqSection: `
<!-- FAQ -->
<section class="ng-faq-sec">
  <div class="container">
    <div class="ng-faq-header">
      <span class="eyebrow">FAQ fiscale Liberia</span>
      <h2 class="ng-faq-title">Questions fréquentes sur le PAYE</h2>
    </div>
    <div class="ng-faq-grid">
      <div class="ng-faq-col">
        <details class="ng-faq-item" open>
          <summary>Quelles sont les tranches LRA du Liberia en 2025/26 ?</summary>
          <p>Le barème des personnes physiques est annuel : 0 % jusqu'à LRD 70,000, 5 % de LRD 70,001 à 200,000, puis 15 % jusqu'à LRD 800,000 et 25 % au-dessus. Le calculateur annualise votre salaire puis répartit l'impôt sur 12 mois pour afficher un net mensuel.</p>
        </details>
        <details class="ng-faq-item">
          <summary>Comment NASSCORP est-il traité dans ce calculateur ?</summary>
          <p>NASSCORP apparaît comme retenue salariale et comme coût employeur séparé. AfroTools applique ici la version actualisée du guide employeur : 4 % salarié et 6 % employeur.</p>
        </details>
        <details class="ng-faq-item">
          <summary>Qu'est-ce que NASSCORP au Liberia ?</summary>
          <p>La National Social Security and Welfare Corporation est l'organisme obligatoire de protection sociale du Liberia. Elle couvre principalement les prestations de retraite et de protection sociale des salariés du secteur formel.</p>
        </details>
      </div>
      <div class="ng-faq-col">
        <details class="ng-faq-item">
          <summary>Le Liberia utilise-t-il le USD ou le LRD pour les impôts ?</summary>
          <p>Les deux devises coexistent. La paie de certaines entreprises est exprimée en USD, mais l'impôt doit être calculé selon la base monétaire retenue par l'employeur et la réglementation applicable. Ce calculateur travaille en LRD pour rester cohérent avec le barème affiché.</p>
        </details>
        <details class="ng-faq-item">
          <summary>Quand l'employeur doit-il reverser le PAYE à la LRA ?</summary>
          <p>Les retenues PAYE sont en principe reversées chaque mois à la LRA. Les cotisations NASSCORP suivent aussi une logique mensuelle. Vérifiez les échéances exactes et les pénalités auprès de la LRA ou d'un conseiller fiscal local.</p>
        </details>
      </div>
    </div>
  </div>
</section>`,
});

pages.push({
  file: 'fr/madagascar/mg-paye.html',
  title: 'Calculateur PAYE Madagascar 2026 | AfroTools',
  description: 'Calculateur PAYE Madagascar 2025/26. Barème IRSA mensuel, CNaPS 1 % salarié / 13 % employeur, plafond du régime général et allègement pour personnes à charge. PDF gratuit.',
  ogTitle: 'Calculateur PAYE Madagascar 2025/26 | AfroTools',
  ogDescription: 'Calculateur PAYE Madagascar avec barème IRSA mensuel, CNaPS 1 % / 13 % et export PDF gratuit.',
  pairs: [
    ['<section class="tool-hero"><div class="tool-hero-inner"><nav class="breadcrumb"><a href="/fr/">Home</a> / <a href="/fr/madagascar/">🇲🇬 Madagascar</a> / <span>Calculateur PAYE</span></nav><h1>Madagascar PAYE<br><em>Calculator 2025/26</em></h1><p class="hero-sub">Official monthly IRSA bands with CNaPS pension (1% employee, 13% employer), the current general-regime contribution ceiling, and dependent relief.</p><div class="hero-badges"><span class="badge b-white">✦ Inclut le Conseiller IA</span><span class="badge b-white">MGA · Malagasy Ariary</span></div>', '<section class="tool-hero"><div class="tool-hero-inner"><nav class="breadcrumb"><a href="/fr/">Accueil</a> / <a href="/fr/madagascar/">🇲🇬 Madagascar</a> / <span>Calculateur PAYE</span></nav><h1>Calculateur PAYE Madagascar<br><em>2025/26</em></h1><p class="hero-sub">Barème mensuel officiel de l’IRSA, CNaPS à 1 % côté salarié et 13 % côté employeur, plafond du régime général et allègement pour personnes à charge.</p><div class="hero-badges"><span class="badge b-white">✦ Inclut le Conseiller IA</span><span class="badge b-white">MGA · ariary malgache</span></div>'],
    ['<div class="amendment-bar"><div class="amendment-bar-inner"><p><strong>2025/26 Key Facts:</strong> IRSA bands: <strong>0%, 5%, 10%, 15%, 20%</strong> with a <strong>MGA 3,000</strong> minimum tax once IRSA is due. CNaPS: <strong>1% employee + 13% employer</strong>, capped at <strong>MGA 2,101,440/mo</strong> in the standard general regime. Relief: <strong>MGA 2,000 per eligible dependent</strong>.</p></div></div>', '<div class="amendment-bar"><div class="amendment-bar-inner"><p><strong>Faits clés 2025/26 :</strong> barème IRSA à <strong>0 %, 5 %, 10 %, 15 % et 20 %</strong> avec un impôt minimum de <strong>MGA 3,000</strong> dès qu’un IRSA est dû. CNaPS : <strong>1 % salarié + 13 % employeur</strong>, plafonnée à <strong>MGA 2,101,440/mois</strong> dans le régime général standard. Allègement : <strong>MGA 2,000 par personne à charge éligible</strong>.</p></div></div>'],
    ['Eligible Dependents', 'Personnes à charge éligibles'],
    ['MGA 2,000 relief each', 'Allègement de MGA 2,000 chacune'],
    ['After tax &amp; CNaPS', 'Après impôt et CNaPS'],
    ['Monthly</button><button class="per-btn" onclick="setPeriod(\'annual\',this)">Annual</button>', 'Mensuel</button><button class="per-btn" onclick="setPeriod(\'annual\',this)">Annuel</button>'],
    ['Breakdown</button><button class="chart-tab" onclick="setChart(\'employer\',this)">Coût Employeur</button>', 'Répartition</button><button class="chart-tab" onclick="setChart(\'employer\',this)">Coût employeur</button>'],
    ['Calculate salary to unlock Madagascar tax analysis.', 'Calculez votre salaire pour débloquer l’analyse fiscale IA Madagascar.'],
    ['Minimum IRSA when tax is due: MGA 3,000/month. CNaPS: 1% employee + 13% employer on salary up to MGA 2,101,440/month in the standard general regime.', 'IRSA minimum dès qu’un impôt est dû : MGA 3,000/mois. CNaPS : 1 % salarié + 13 % employeur sur le salaire couvert jusqu’à MGA 2,101,440/mois dans le régime général standard.'],
    ['<strong>Disclaimer:</strong> A titre informatif uniquement. Verify with local tax authority.', '<strong>Clause de non-responsabilité :</strong> à titre informatif uniquement. Vérifiez toujours avec l’administration fiscale locale.'],
    ['Bookmark Madagascar PAYE to your personal dashboard for quick access anytime.', 'Ajoutez ce calculateur Madagascar à votre tableau de bord personnel pour y revenir rapidement.'],
    ['<a class="tool-info-action" href="/fr/salary-tax/">All Countries</a>', '<a class="tool-info-action" href="/fr/salary-tax/">Tous les pays</a>'],
    ['Salaire Net Calc', 'Salaire net'],
    ['PDF Export', 'Export PDF'],
    ['<div class="tool-stat"><div class="tool-stat-val">Free</div><div class="tool-stat-lbl">Forever</div></div>', '<div class="tool-stat"><div class="tool-stat-val">Gratuit</div><div class="tool-stat-lbl">Toujours</div></div>'],
    ['<h4>PDF opening</h4>', '<h4>Ouverture du PDF</h4>'],
  ],
  guideSection: `
<!-- TWO-COLUMN GUIDE -->
<section class="ng-guide-sec">
  <div class="container">
    <div class="ng-guide-header">
      <h2 class="ng-guide-title">Guide PAYE Madagascar 2025/26</h2>
    </div>
    <div class="ng-guide-grid">
      <div class="ng-guide-col">
        <div class="ng-guide-card">
          <p style="font-size:0.85rem;color:#475569;line-height:1.65;margin-bottom:0;">À Madagascar, l'impôt sur les salaires est administré par la DGID via l'<strong>IRSA</strong>. Le barème utilisé ici est un véritable barème mensuel progressif : 0 % jusqu'à MGA 350,000, puis 5 %, 10 %, 15 % et 20 % au-dessus de MGA 600,000 de revenu imposable mensuel.</p>
        </div>
        <div class="ng-guide-card">
          <p style="font-size:0.85rem;color:#475569;line-height:1.65;margin-bottom:0;">Dans le <strong>régime général</strong> retenu par ce calculateur, la cotisation <strong>CNaPS</strong> est de 1 % côté salarié et 13 % côté employeur, avec un plafond de salaire couvert de <strong>MGA 2,101,440 par mois</strong>. Au-delà de ce plafond, aucune cotisation supplémentaire n'est appliquée dans ce régime standard.</p>
        </div>
        <div class="ng-guide-card">
          <p style="font-size:0.85rem;color:#475569;line-height:1.65;margin-bottom:0;">Madagascar prévoit aussi un <strong>allègement IRSA de MGA 2,000 par personne à charge éligible</strong>. Cet avantage ne peut toutefois pas faire descendre l'impôt en dessous du minimum légal lorsque l'IRSA devient exigible.</p>
        </div>
        <div class="ng-guide-card">
          <p style="font-size:0.85rem;color:#475569;line-height:1.65;margin-bottom:0;">Le pays utilise l'<strong>ariary malgache (MGA)</strong>. Pour une estimation fiable, il faut donc tenir compte à la fois du barème IRSA, du plafond CNaPS, de l'impôt minimum et de la situation familiale, même si cette dernière a un effet limité dans la plupart des cas.</p>
        </div>
      </div>
      <div class="ng-guide-col">
        <div class="ng-guide-card ng-guide-card-table">
          <h3>Barème IRSA Madagascar</h3>
          <div class="ng-bands-table-wrap"><table class="ng-bands-table">
    <thead><tr><th>Revenu mensuel imposable (MGA)</th><th>Taux</th></tr></thead>
    <tbody>
      <tr><td>0 – 350,000</td><td>0%</td></tr>
      <tr><td>350,001 – 400,000</td><td>5%</td></tr>
      <tr><td>400,001 – 500,000</td><td>10%</td></tr>
      <tr><td>500,001 – 600,000</td><td>15%</td></tr>
      <tr><td>Au-dessus de 600,000</td><td>20%</td></tr>
    </tbody>
  </table></div>
        </div>
      </div>
    </div>
    <div class="ng-guide-footer-note">
      <p>CNaPS salarié : 1 % ; CNaPS employeur : 13 %, avec plafond à MGA 2,101,440/mois dans le régime général. L'IRSA minimum retenu ici est de MGA 3,000 dès qu'un impôt est dû.</p>
    </div>
  </div>
</section>`,
  faqSection: `
<!-- FAQ -->
<section class="ng-faq-sec">
  <div class="container">
    <div class="ng-faq-header">
      <span class="eyebrow">FAQ fiscale Madagascar</span>
      <h2 class="ng-faq-title">Questions fréquentes sur le PAYE</h2>
    </div>
    <div class="ng-faq-grid">
      <div class="ng-faq-col">
        <details class="ng-faq-item" open>
          <summary>Comment fonctionne la structure PAYE à Madagascar ?</summary>
          <p>L'IRSA est mensuel et progressif : 0 % jusqu'à MGA 350,000, puis 5 %, 10 %, 15 % et 20 % au-dessus de MGA 600,000. Dès qu'un IRSA devient dû, un minimum de MGA 3,000 par mois s'applique.</p>
        </details>
        <details class="ng-faq-item">
          <summary>La CNaPS est-elle déductible avant l'IRSA ?</summary>
          <p>Oui. La cotisation salariale de 1 % est déduite du salaire brut avant calcul de l'IRSA, dans la limite du plafond du régime général pris en compte par le calculateur.</p>
        </details>
        <details class="ng-faq-item">
          <summary>À quoi correspond le plafond CNaPS ?</summary>
          <p>Le plafond utilisé ici est de MGA 2,101,440 par mois. Cela signifie que les cotisations CNaPS ne continuent pas d'augmenter au-delà de cette base couverte dans le régime standard.</p>
        </details>
        <details class="ng-faq-item">
          <summary>Comment le PAYE est-il calculé à Madagascar ?</summary>
          <p>Le calculateur déduit d'abord la CNaPS salariée, applique ensuite le barème IRSA mensuel, impose le minimum de MGA 3,000 lorsque nécessaire, puis prend en compte l'allègement pour personnes à charge sans passer sous le minimum légal.</p>
        </details>
      </div>
      <div class="ng-faq-col">
        <details class="ng-faq-item">
          <summary>Quel est le seuil non imposable à Madagascar ?</summary>
          <p>Les premiers MGA 350,000 de revenu mensuel imposable après CNaPS sont taxés à 0 %. Un salarié dont le revenu imposable reste sous ce seuil ne paie pas d'IRSA.</p>
        </details>
        <details class="ng-faq-item">
          <summary>Quel est le coût employeur total à Madagascar ?</summary>
          <p>L'employeur supporte le salaire brut plus 13 % de CNaPS sur la partie couverte. À titre d'exemple, un salaire mensuel de MGA 2,000,000 génère MGA 260,000 de CNaPS employeur dans le régime général standard.</p>
        </details>
        <details class="ng-faq-item">
          <summary>Que couvre la CNaPS à Madagascar ?</summary>
          <p>La Caisse Nationale de Prévoyance Sociale couvre principalement la retraite, l'invalidité et les prestations aux ayants droit. Le taux global modélisé ici est de 14 % de la rémunération couverte : 1 % salarié et 13 % employeur.</p>
        </details>
        <details class="ng-faq-item">
          <summary>Le calculateur PAYE Madagascar AfroTools est-il gratuit ?</summary>
          <p>Oui. Le calculateur est gratuit, sans compte obligatoire, et inclut le calcul du net, la ventilation des retenues, le coût employeur, l'analyse IA et le téléchargement PDF.</p>
        </details>
      </div>
    </div>
  </div>
</section>`,
});

pages.push({
  file: 'fr/sierra-leone/sl-paye.html',
  title: 'Calculateur PAYE Sierra Leone 2026 | AfroTools',
  description: 'Calculateur PAYE Sierra Leone 2025/26. Impôt progressif NRA, NASSIT 5 % salarié / 10 % employeur et estimation nette mensuelle. PDF gratuit.',
  ogTitle: 'Calculateur PAYE Sierra Leone 2025/26 | AfroTools',
  ogDescription: 'Calculateur PAYE Sierra Leone avec barème NRA, NASSIT 5 % / 10 % et export PDF gratuit.',
  pairs: [
    ['<h1>Sierra Leone PAYE<br><em>Calculator 2025/26</em></h1>', '<h1>Calculateur PAYE Sierra Leone<br><em>2025/26</em></h1>'],
    [`<p class="hero-sub">Progressive income tax via NRA (National Revenue Authority), NASSIT social security (5.0% employee, 10.0% employer). Annual/monthly calculations per local bands.</p>`, `<p class="hero-sub">Impôt progressif administré par la NRA, avec NASSIT à 5 % côté salarié et 10 % côté employeur. Estimation mensuelle fidèle aux tranches locales après redénomination.</p>`],
    ['<span class="badge b-green">NRA (National Revenue Authority) 2025/26 Verified</span>', '<span class="badge b-green">NRA 2025/26 vérifié</span>'],
    ['<p class="hero-meta">Last verified: April 2026 · Source: NRA (nra.gov.sl) · Impôt sur le Revenu Act 2000 · Finance Act 2024/25</p>', '<p class="hero-meta">Mis à jour : avril 2026 · Sources : NRA (nra.gov.sl), Income Tax Act 2000 et Finance Act 2024/25</p>'],
    ['<strong>2025/26 key facts: first SLE 600/month is exempt, then 15% / 20% / 25% / 30% progressive PAYE applies. Employee NASSIT is 5% and deductible before PAYE; employer NASSIT is 10%.</strong>', '<strong>Faits clés 2025/26 : les premiers SLE 600/mois sont exonérés, puis le PAYE progresse à 15 %, 20 %, 25 % et 30 %. La cotisation NASSIT salariée est de 5 % et reste déductible avant impôt ; la part employeur est de 10 %.</strong>'],
    ['<title>AfroTools Sierra Leone PAYE — ${refNo}</title>', '<title>AfroTools Calculateur PAYE Sierra Leone — ${refNo}</title>'],
    ['${b.isFlat ? \'Taux fixe 30% (secondary employment)\' : \'Rate \' + (b.rate*100) + \'% on SLE \' + Math.round(b.income).toLocaleString()}', '${b.isFlat ? \'Taux fixe 30 % (emploi secondaire)\' : \'Taux \' + (b.rate*100) + \' % sur SLE \' + Math.round(b.income).toLocaleString()}'],
    ['"name": "Sierra Leone PAYE Calculator 2025/26"', '"name": "Calculateur PAYE Sierra Leone 2025/26"'],
  ],
  guideSection: `
<!-- TWO-COLUMN GUIDE -->
<section class="ng-guide-sec">
  <div class="container">
    <div class="ng-guide-header">
      <h2 class="ng-guide-title">Guide PAYE Sierra Leone 2025/26</h2>
    </div>
    <div class="ng-guide-grid">
      <div class="ng-guide-col">
        <div class="ng-guide-card">
          <p style="font-size:0.85rem;color:#475569;line-height:1.65;margin-bottom:0;">Le PAYE en Sierra Leone est administré par la <strong>National Revenue Authority (NRA)</strong>. Après la redénomination monétaire, le seuil d'exonération résident est de <strong>SLE 600 par mois</strong>, puis l'impôt progresse à 15 %, 20 %, 25 % et 30 % sur les tranches successives.</p>
        </div>
        <div class="ng-guide-card">
          <p style="font-size:0.85rem;color:#475569;line-height:1.65;margin-bottom:0;">En plus de l'impôt sur le revenu, les salariés du secteur formel cotisent à la <strong>NASSIT</strong> à hauteur de <strong>5 %</strong> du salaire. L'employeur ajoute <strong>10 %</strong>. La part salariale est déduite avant calcul du PAYE, conformément aux exemples actuels de la NRA.</p>
        </div>
      </div>
      <div class="ng-guide-col">
        <div class="ng-guide-card ng-guide-card-table">
          <h3>Barème PAYE Sierra Leone</h3>
          <div class="ng-bands-table-wrap"><table class="ng-bands-table">
      <thead>
        <tr>
          <th>Revenu mensuel (SLE)</th>
          <th>Taux</th>
          <th>Impôt cumulé</th>
        </tr>
      </thead>
      <tbody>
        <tr><td>SLE 0 – 600</td><td>0%</td><td>SLE 0</td></tr>
        <tr><td>SLE 600.01 – 1,200</td><td>15%</td><td>Jusqu'à SLE 90</td></tr>
        <tr><td>SLE 1,200.01 – 1,800</td><td>20%</td><td>Jusqu'à SLE 210</td></tr>
        <tr><td>SLE 1,800.01 – 2,400</td><td>25%</td><td>Jusqu'à SLE 360</td></tr>
        <tr><td>Au-dessus de SLE 2,400</td><td>30%</td><td>30 % sur l'excédent au-dessus de SLE 2,400</td></tr>
      </tbody>
    </table></div>
        </div>
      </div>
    </div>
    <div class="ng-guide-footer-note">
      <p>Les employeurs reversent généralement le PAYE à la NRA avant le 15 du mois suivant. Le calcul AfroTools utilise les seuils SLE post-redénomination et déduit la part salariale NASSIT avant l'impôt.</p>
    </div>
  </div>
</section>`,
  faqSection: `
<!-- FAQ -->
<section class="ng-faq-sec">
  <div class="container">
    <div class="ng-faq-header">
      <span class="eyebrow">FAQ fiscale Sierra Leone</span>
      <h2 class="ng-faq-title">Questions fréquentes sur le PAYE</h2>
    </div>
    <div class="ng-faq-grid">
      <div class="ng-faq-col">
        <details class="ng-faq-item" open>
          <summary>Quelles sont les tranches PAYE en Sierra Leone pour 2025/26 ?</summary>
          <p>Pour les résidents, le barème mensuel est progressif : 0 % sur les premiers SLE 600, puis 15 %, 20 %, 25 % et 30 % au-dessus de SLE 2,400.</p>
        </details>
        <details class="ng-faq-item">
          <summary>Qu'est-ce que la NASSIT et combien le salarié paie-t-il ?</summary>
          <p>La National Social Security and Insurance Trust est le régime obligatoire de sécurité sociale. Le salarié cotise à hauteur de 5 % du salaire et l'employeur à 10 %, soit 15 % au total.</p>
        </details>
        <details class="ng-faq-item">
          <summary>Qui administre le PAYE en Sierra Leone ?</summary>
          <p>Le PAYE est administré par la NRA. Les employeurs doivent s'y enregistrer, retenir l'impôt sur la paie et déposer les déclarations correspondantes. Les cotisations NASSIT suivent un circuit séparé.</p>
        </details>
      </div>
      <div class="ng-faq-col">
        <details class="ng-faq-item">
          <summary>Quand l'employeur doit-il payer le PAYE à la NRA ?</summary>
          <p>Le PAYE doit généralement être déclaré et payé avant le 15 du mois suivant. Des pénalités et intérêts peuvent s'appliquer en cas de retard.</p>
        </details>
        <details class="ng-faq-item">
          <summary>Quel est le seuil non imposable en Sierra Leone ?</summary>
          <p>Le seuil exonéré est de SLE 600 par mois après redénomination. Au-dessus de ce niveau, le revenu entre progressivement dans les tranches à 15 %, 20 %, 25 % puis 30 %.</p>
        </details>
        <details class="ng-faq-item">
          <summary>Les cotisations NASSIT sont-elles déductibles ?</summary>
          <p>Oui. La part salariale de 5 % est déduite avant calcul du PAYE dans le modèle retenu ici, conformément aux exemples récents de la NRA.</p>
        </details>
      </div>
    </div>
  </div>
</section>`,
});

pages.push({
  file: 'fr/uganda/ug-paye.html',
  title: 'Calculateur PAYE Ouganda 2026 | AfroTools',
  description: 'Calculateur PAYE Ouganda 2025/26. Barème URA de 0 % à 40 %, NSSF 5 % non déductible et Local Service Tax officielle selon le salaire net mensuel. PDF gratuit.',
  ogTitle: 'Calculateur PAYE Ouganda 2025/26 | AfroTools',
  ogDescription: "Calculateur PAYE Ouganda avec barème URA, NSSF 5 % non déductible, Local Service Tax et export PDF gratuit.",
  pairs: [
    ['<div class="breadcrumb"><a href="https://afrotools.com">AfroTools</a> › <a href="/fr/uganda/">Uganda</a> › <span>Calculateur PAYE</span></div>', '<div class="breadcrumb"><a href="https://afrotools.com">AfroTools</a> › <a href="/fr/uganda/">Ouganda</a> › <span>Calculateur PAYE</span></div>'],
    ['<h1>Calculateur PAYE Uganda <em>2025/26</em></h1>', '<h1>Calculateur PAYE Ouganda <em>2025/26</em></h1>'],
    [`<p class="hero-sub">Calculez votre salaire net en Uganda using URA progressive income tax bands (0%–40%), NSSF contributions (5%, not tax-deductible), and official Local Service Tax annual bands based on take-home pay after PAYE.</p>`, `<p class="hero-sub">Calculez votre salaire net en Ouganda avec le barème progressif URA (0 % à 40 %), la cotisation NSSF de 5 % non déductible et la Local Service Tax officielle basée sur le net après PAYE.</p>`],
    ['<div class="hero-meta">Mis a jour 2025 · Based on Uganda Revenue Authority (URA) Impôt sur le Revenu Act</div>', '<div class="hero-meta">Mis à jour 2025 · Basé sur l’Uganda Revenue Authority (URA) et l’Income Tax Act</div>'],
    ['Calculateur TVA Uganda', 'Calculateur TVA Ouganda'],
    ['<strong>2025/26 Tax Year:</strong> Progressive PAYE bands updated. NSSF remains 5% employee contribution (NOT tax-deductible). Non-resident rate: 30% flat on employment income. Local Service Tax uses fixed annual bands based on monthly take-home after PAYE and is typically collected in the first four months of the financial year.', '<strong>Année fiscale 2025/26 :</strong> les tranches PAYE progressives sont à jour. La NSSF reste fixée à 5 % côté salarié et n’est <strong>pas déductible</strong>. Le taux non-résident demeure de 30 % forfaitaire sur les revenus d’emploi. La Local Service Tax repose sur des tranches annuelles fixes calculées à partir du net mensuel après PAYE, généralement collectées sur les quatre premiers mois de l’exercice.'],
    ['<title>AfroTools Uganda PAYE — ${refNo}</title>', '<title>AfroTools Calculateur PAYE Ouganda — ${refNo}</title>'],
    ['${b.isFlat ? \'Non-resident Taux fixe 30%\' : \'Rate \' + (b.rate*100) + \'% on UGX \' + Math.round(b.income).toLocaleString()}', '${b.isFlat ? \'Non-résident : taux fixe 30 %\' : \'Taux \' + (b.rate*100) + \' % sur UGX \' + Math.round(b.income).toLocaleString()}'],
    ['Calculateur PAYE Uganda', 'Calculateur PAYE Ouganda'],
    ['"name": "Uganda PAYE Calculator 2025/26"', '"name": "Calculateur PAYE Ouganda 2025/26"'],
    ['Per month in Uganda', 'Par mois en Ouganda'],
  ],
  guideSection: `
<!-- TWO-COLUMN GUIDE -->
<section class="ng-guide-sec">
  <div class="container">
    <div class="ng-guide-header">
      <h2 class="ng-guide-title">Comment le PAYE en Ouganda est calculé en 2025/26</h2>
    </div>
    <div class="ng-guide-grid">
      <div class="ng-guide-col">
        <div class="ng-guide-card">
          <p style="font-size:0.85rem;color:#475569;line-height:1.65;margin-bottom:0;">Le PAYE ougandais est administré par la <strong>Uganda Revenue Authority (URA)</strong>. Les employeurs doivent retenir l'impôt chaque mois puis le reverser avant le 15 du mois suivant. L'année fiscale suit le calendrier budgétaire national, du 1er juillet au 30 juin.</p>
        </div>
        <div class="ng-guide-card">
          <p style="font-size:0.85rem;color:#475569;line-height:1.65;margin-bottom:0;">Le barème mensuel pour les résidents comprend cinq tranches : 0 % jusqu'à UGX 235,000, puis 10 %, 20 %, 30 % et 40 % au-dessus de UGX 10,000,000. Les non-résidents sont imposés à un <strong>taux forfaitaire de 30 %</strong> sur les revenus d'emploi de source ougandaise.</p>
        </div>
        <div class="ng-guide-card">
          <p style="font-size:0.85rem;color:#475569;line-height:1.65;margin-bottom:0;">Point important : la cotisation salariale <strong>NSSF de 5 % n'est pas déductible</strong> avant calcul du PAYE. L'impôt est donc calculé sur le brut, puis la NSSF est retenue ensuite sur le net. L'employeur ajoute 10 % supplémentaires au titre de la NSSF employeur.</p>
        </div>
        <div class="ng-guide-card">
          <p style="font-size:0.85rem;color:#475569;line-height:1.65;margin-bottom:0;">L'<strong>Local Service Tax (LST)</strong> est une taxe annuelle distincte fondée sur le salaire net mensuel après PAYE. Pour les salariés, elle va de UGX 5,000 à UGX 100,000 par an et est souvent étalée sur les quatre premiers mois de l'exercice.</p>
        </div>
      </div>
      <div class="ng-guide-col">
        <div class="ng-guide-card ng-guide-card-table">
          <h3>Barème PAYE Ouganda 2025/26</h3>
          <div class="ng-bands-table-wrap"><div>
    <table class="ng-bands-table">
      <thead>
        <tr>
          <th>Tranche mensuelle (UGX)</th>
          <th>Taux</th>
        </tr>
      </thead>
      <tbody>
        <tr><td>0 – 235,000</td><td>0%</td></tr>
        <tr><td>235,001 – 335,000</td><td>10%</td></tr>
        <tr><td>335,001 – 410,000</td><td>20%</td></tr>
        <tr><td>410,001 – 10,000,000</td><td>30%</td></tr>
        <tr><td>Au-dessus de 10,000,000</td><td>40%</td></tr>
      </tbody>
    </table>
  </div></div>
        </div>
      </div>
    </div>
  </div>
</section>`,
  faqSection: `
<!-- FAQ -->
<section class="ng-faq-sec">
  <div class="container">
    <div class="ng-faq-header">
      <span class="eyebrow">FAQ fiscale Ouganda</span>
      <h2 class="ng-faq-title">Questions fréquentes sur le PAYE</h2>
    </div>
    <div class="ng-faq-grid">
      <div class="ng-faq-col">
        <details class="ng-faq-item" open>
          <summary>Quelles sont les tranches PAYE en Ouganda pour 2025/26 ?</summary>
          <p>Pour les résidents, le barème mensuel est de 0 % jusqu'à UGX 235,000, puis 10 %, 20 %, 30 % et 40 % au-dessus de UGX 10,000,000. Les non-résidents sont imposés à 30 % forfaitaires sans tranche exonérée.</p>
        </details>
        <details class="ng-faq-item">
          <summary>La NSSF est-elle déductible avant le PAYE en Ouganda ?</summary>
          <p>Non. La cotisation salariale NSSF de 5 % n'est pas déductible de la base PAYE. L'impôt est calculé sur le brut, puis la NSSF est prélevée séparément sur le salaire net.</p>
        </details>
        <details class="ng-faq-item">
          <summary>Qu'est-ce que la Local Service Tax (LST) en Ouganda ?</summary>
          <p>La LST est une taxe annuelle supplémentaire appliquée lorsque le salaire net mensuel après PAYE dépasse certains seuils. Pour les salariés, elle varie généralement entre UGX 5,000 et UGX 100,000 par an.</p>
        </details>
      </div>
      <div class="ng-faq-col">
        <details class="ng-faq-item">
          <summary>Comment les revenus des non-résidents sont-ils imposés ?</summary>
          <p>Les non-résidents paient un taux forfaitaire de 30 % sur les revenus d'emploi de source ougandaise. Ils ne bénéficient pas des tranches progressives ni du seuil exonéré des résidents.</p>
        </details>
        <details class="ng-faq-item">
          <summary>Quand l'employeur doit-il reverser le PAYE à l'URA ?</summary>
          <p>Le PAYE est généralement reversé à l'Uganda Revenue Authority avant le 15 du mois suivant la paie. La LST et les cotisations NSSF suivent des circuits de reversement distincts.</p>
        </details>
        <details class="ng-faq-item">
          <summary>Peut-on réduire son impôt sur le revenu en Ouganda ?</summary>
          <p>Les possibilités sont limitées dans le régime PAYE standard. Comme la NSSF salariale n'est pas déductible, l'effet d'optimisation est plus faible que dans plusieurs pays voisins. Pour un cas complexe, il est préférable de consulter un conseiller fiscal local.</p>
        </details>
      </div>
    </div>
  </div>
</section>`,
});

const seoByFile = {
  'fr/benin/bj-paye.html': {
    countryNameFr: 'Bénin',
    faqSchema: [
      {
        q: 'Quelles sont les tranches DGI du Bénin en 2025/26 ?',
        a: "Le barème annuel comprend sept tranches : 0 % jusqu'à XOF 300 000, puis 2 %, 5 %, 10 %, 15 %, 20 % et enfin 25 % au-dessus de XOF 9 600 000. Le calcul s'applique au revenu imposable après déduction de la CNPS salariale.",
      },
      {
        q: "La cotisation CNPS est-elle déductible avant l'impôt ?",
        a: "Oui. La cotisation salariale obligatoire de 2,5 % est déduite du salaire brut avant calcul de la DGI. La part employeur de 9,5 % reste un coût supplémentaire pour l'entreprise.",
      },
      {
        q: 'Quand le PAYE est-il calculé et reversé au Bénin ?',
        a: "Le barème est annuel, mais l'employeur effectue la retenue chaque mois sur la paie puis reverse l'impôt à la DGI selon les échéances déclaratives applicables.",
      },
      {
        q: 'Quel est le taux total de CNPS au Bénin ?',
        a: 'Le taux global retenu ici est de 12 % du salaire brut : 2,5 % pour le salarié et 9,5 % pour l’employeur.',
      },
    ],
  },
  'fr/djibouti/dj-paye.html': {
    countryNameFr: 'Djibouti',
    faqSchema: [
      {
        q: 'Quelles sont les tranches IRPP à Djibouti ?',
        a: "Le barème mensuel comprend six tranches : 0 % jusqu'à DJF 50 000, puis 2 %, 15 %, 18 %, 20 % et 30 % au-dessus de DJF 2 000 000 de revenu imposable mensuel.",
      },
      {
        q: "La sécurité sociale est-elle déductible avant l'IRPP ?",
        a: "Oui. La cotisation salariale de 4 % est retirée du salaire brut avant calcul de l'IRPP.",
      },
      {
        q: 'Quel est le taux total de sécurité sociale ?',
        a: 'Le total retenu ici est de 19,7 % : 4 % à la charge du salarié et 15,7 % à la charge de l’employeur.',
      },
      {
        q: "À quel moment l'impôt est-il calculé à Djibouti ?",
        a: "L'IRPP est calculé chaque mois sur le revenu imposable mensuel. L'employeur effectue la retenue sur la paie puis reverse l'impôt à l'administration fiscale.",
      },
    ],
  },
  'fr/ethiopia/et-paye.html': {
    countryNameFr: 'Éthiopie',
    faqSchema: [
      {
        q: 'Quelles sont les tranches PAYE en Éthiopie pour 2025/26 ?',
        a: "Le barème mensuel issu de la proclamation n° 1395/2025 prévoit 0 % sur les premiers ETB 2 000, puis 15 %, 20 %, 25 %, 30 % et 35 % au-dessus de ETB 14 000.",
      },
      {
        q: 'La cotisation pension est-elle déductible avant le PAYE ?',
        a: "Oui. La cotisation salariale obligatoire de 7 % est retirée du salaire brut avant calcul de l'impôt, tandis que la part employeur de 11 % n'est pas prélevée sur le net du salarié.",
      },
      {
        q: "Quand l'employeur doit-il verser les cotisations de pension ?",
        a: 'Les cotisations de pension sont généralement attendues au plus tard le 10 du mois suivant la paie, en parallèle des obligations mensuelles PAYE auprès de l’ERCA.',
      },
      {
        q: "Qu'est-ce qui a changé avec la proclamation n° 1395/2025 ?",
        a: "La réforme a simplifié le barème en six tranches et relevé le seuil exonéré à ETB 2 000 par mois, ce qui allège l'impôt pour une large partie des salariés.",
      },
    ],
  },
  'fr/liberia/lr-paye.html': {
    countryNameFr: 'Liberia',
    faqSchema: [
      {
        q: 'Quelles sont les tranches LRA du Liberia en 2025/26 ?',
        a: 'Le barème des personnes physiques est annuel : 0 % jusqu’à LRD 70 000, 5 % de LRD 70 001 à 200 000, puis 15 % jusqu’à LRD 800 000 et 25 % au-dessus.',
      },
      {
        q: 'Comment NASSCORP est-il traité dans ce calculateur ?',
        a: 'NASSCORP apparaît comme retenue salariale et comme coût employeur distinct. AfroTools applique ici la version actualisée du guide employeur : 4 % salarié et 6 % employeur.',
      },
      {
        q: "Comment l'impôt sur le revenu est-il estimé au Liberia ?",
        a: "Le calculateur annualise d'abord le salaire, applique le barème LRA annuel, puis répartit la charge d'impôt sur 12 mois pour afficher une estimation mensuelle.",
      },
      {
        q: 'Le Liberia utilise-t-il le USD ou le LRD pour les impôts ?',
        a: 'Les deux devises coexistent. Ce calculateur travaille en LRD afin de rester cohérent avec le barème fiscal affiché.',
      },
    ],
  },
  'fr/madagascar/mg-paye.html': {
    countryNameFr: 'Madagascar',
    faqSchema: [
      {
        q: 'Comment fonctionne la structure PAYE à Madagascar ?',
        a: "L'IRSA est mensuel et progressif : 0 % jusqu'à MGA 350 000, puis 5 %, 10 %, 15 % et 20 % au-dessus de MGA 600 000. Un minimum de MGA 3 000 s'applique dès qu'un IRSA devient dû.",
      },
      {
        q: "La CNaPS est-elle déductible avant l'IRSA ?",
        a: "Oui. La cotisation salariale de 1 % est déduite du salaire brut avant calcul de l'IRSA, dans la limite du plafond du régime général retenu ici.",
      },
      {
        q: 'À quoi correspond le plafond CNaPS ?',
        a: 'Le plafond utilisé ici est de MGA 2 101 440 par mois. Les cotisations CNaPS ne continuent pas d’augmenter au-delà de cette base couverte dans le régime standard.',
      },
      {
        q: 'Comment le PAYE est-il calculé à Madagascar ?',
        a: "Le calculateur déduit d'abord la CNaPS salariale, applique ensuite le barème IRSA mensuel, impose le minimum légal lorsque nécessaire, puis prend en compte l'allègement pour personnes à charge.",
      },
    ],
  },
  'fr/sierra-leone/sl-paye.html': {
    countryNameFr: 'Sierra Leone',
    faqSchema: [
      {
        q: 'Quelles sont les tranches PAYE en Sierra Leone pour 2025/26 ?',
        a: 'Pour les résidents, le barème mensuel est progressif : 0 % sur les premiers SLE 600, puis 15 %, 20 %, 25 % et 30 % au-dessus de SLE 2 400.',
      },
      {
        q: "Qu'est-ce que la NASSIT et combien le salarié paie-t-il ?",
        a: 'La National Social Security and Insurance Trust est le régime obligatoire de sécurité sociale. Le salarié cotise à hauteur de 5 % du salaire et l’employeur à 10 %, soit 15 % au total.',
      },
      {
        q: 'Qui administre le PAYE en Sierra Leone ?',
        a: "Le PAYE est administré par la National Revenue Authority, qui reçoit les retenues mensuelles opérées sur la paie par les employeurs.",
      },
      {
        q: "Quand l'employeur doit-il payer le PAYE à la NRA ?",
        a: 'Le PAYE doit généralement être déclaré et payé avant le 15 du mois suivant. Des pénalités et intérêts peuvent s’appliquer en cas de retard.',
      },
    ],
  },
  'fr/uganda/ug-paye.html': {
    countryNameFr: 'Ouganda',
    faqSchema: [
      {
        q: 'Quelles sont les tranches PAYE en Ouganda pour 2025/26 ?',
        a: 'Pour les résidents, le barème mensuel est de 0 % jusqu’à UGX 235 000, puis 10 %, 20 %, 30 % et 40 % au-dessus de UGX 10 000 000. Les non-résidents sont imposés à 30 % forfaitaires.',
      },
      {
        q: "La NSSF est-elle déductible avant le PAYE en Ouganda ?",
        a: "Non. La cotisation salariale NSSF de 5 % n'est pas déductible de la base PAYE ; l'impôt est calculé sur le brut.",
      },
      {
        q: "Qu'est-ce que la Local Service Tax (LST) en Ouganda ?",
        a: 'La LST est une taxe annuelle supplémentaire appliquée lorsque le salaire net mensuel après PAYE dépasse certains seuils. Pour les salariés, elle varie généralement entre UGX 5 000 et UGX 100 000 par an.',
      },
      {
        q: 'Comment les revenus des non-résidents sont-ils imposés ?',
        a: "Les non-résidents paient un taux forfaitaire de 30 % sur les revenus d'emploi de source ougandaise et ne bénéficient pas des tranches progressives des résidents.",
      },
    ],
  },
};

const misses = [];

for (const page of pages) {
  const filePath = path.join(repoRoot, page.file);
  let html = fs.readFileSync(filePath, 'utf8');

  html = setHeadMeta(html, page, misses);

  if (page.pairs) {
    html = replaceAllExact(html, page.pairs);
  }

  if (page.guideSection) {
    html = replaceOne(
      html,
      /<!-- TWO-COLUMN GUIDE -->[\s\S]*?<\/section>/,
      page.guideSection.trim(),
      `${page.file}: guide section`,
      misses
    );
  }

  if (page.faqSection) {
    html = replaceLastFaqSection(html, page.faqSection, `${page.file}: faq section`, misses);
  }

  html = replaceAllExact(html, postPolishPairsByFile[page.file] || []);
  html = replaceAllExact(html, commonPairs);
  html = replaceAllExact(html, postPolishWave2ByFile[page.file] || []);
  html = replaceAllExact(html, postPolishWave3ByFile[page.file] || []);
  fs.writeFileSync(filePath, html);
}

if (misses.length) {
  console.warn('Polish pass completed with some unmatched replacements:');
  for (const miss of misses) console.warn(`- ${miss}`);
} else {
  console.log('French PAYE polish pass completed without misses.');
}
