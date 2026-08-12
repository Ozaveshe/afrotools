'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const root = path.resolve(__dirname, '..');
const sourceRelative = 'data/content/blog-multilingual-wave2-2026-08.json';
const sourcePath = path.join(root, sourceRelative);
const frenchManifestPath = path.join(root, 'data/localization/fr-blog-manifest.json');
const contentManifestPath = path.join(root, 'data/content/blog-article-manifest.json');
const reportRelative = 'reports/blog-multilingual-wave2-2026-08.md';
const write = process.argv.includes('--write');
const data = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));

const LINK_FIXES = new Map([
  ['/sw/blogu/kumbukumbu-za-mkutano-maamuzi-hatua/', '/sw/blogu/mfano-kumbukumbu-za-mkutano-afrika/'],
  ['/fr/tools/meta-tags/', '/fr/tools/generateur-meta-tags/'],
  ['/sw/blogu/hesabu-gpa-cgpa-wanafunzi-afrika/', '/sw/blogu/kukokotoa-gpa-cgpa-wanafunzi-afrika/'],
  ['/sw/zana/mpangaji-wa-masomo/', '/sw/zana/mpango-masomo/'],
  ['/fr/tools/calcul-poids-expedition/', '/fr/tools/calculateur-de-poids-d-expedition/'],
  ['/sw/zana/kigeuzi-ukubwa-wa-ardhi/', '/sw/zana/ukubwa-wa-ardhi/']
]);

const HUB_MARKERS = {
  en: ['<!-- BLOG-MULTILINGUAL-WAVE2-2026-08:START -->', '<!-- BLOG-MULTILINGUAL-WAVE2-2026-08:END -->'],
  sw: ['<!-- BLOGU-MULTILINGUAL-WAVE2-2026-08:START -->', '<!-- BLOGU-MULTILINGUAL-WAVE2-2026-08:END -->']
};

const localeConfig = {
  en: {
    dir: 'blog', hub: '/blog/', home: '/', language: 'en', ogLocale: 'en_US',
    team: 'AfroTools Team', reviewed: 'Reviewed', minutes: 'min read', guide: 'Guide',
    quick: 'Practical answer', inputs: 'Inputs to verify', workflow: 'Step-by-step workflow',
    details: 'How to make the result dependable', pitfalls: 'Common mistakes',
    verification: 'Verification and decision record', privacy: 'Privacy and safe use',
    sources: 'Sources and further verification', related: 'Related AfroTools guides',
    faq: 'Frequently asked questions', toolCta: 'Open the AfroTools tool',
    input: 'Input', evidence: 'What to verify', read: 'Read the guide',
    shared: [
      'Start with the receiving decision, not the calculator. Write down who will use the result, which document or workflow it supports, the date it is needed and the rule that decides whether it is acceptable. A technically correct number or file can still fail when it answers the wrong question, uses the wrong period or arrives in a format the recipient cannot use.',
      'Keep the source evidence beside the inputs. That may be a contract, calendar, design token, source document, account rule, style guide, price list or measurement note. Record the date and version where a rule can change. If an input is an estimate, label it as an estimate instead of presenting it as an observed fact.',
      'Run the first result as a baseline, then change one important assumption at a time. This makes the sensitivity visible and helps another person understand why the answer moved. Do not silently adjust several inputs until the output looks convenient. Save the rejected scenario too when it explains a risk or boundary.',
      'Reopen every downloaded file and recalculate any high-impact result independently. Check labels, units, page order, dates, signs, rounding and the intended destination. A browser preview or successful download proves only that an action completed. It does not prove that the result is complete, accepted or suitable for the next step.',
      'Create a short decision record with the source, inputs, assumptions, result, reviewer and next action. When the situation changes, make a new dated version rather than overwriting the only record. This gives teams, students and households a practical audit trail without turning an everyday tool into a claim of official approval.',
      'Use the minimum personal or confidential information needed. Prefer local processing for identity, financial, employment, academic and business documents. Never place passwords, identity numbers, private contracts or raw personal records into an untrusted service. The relevant authority, institution, employer, client or qualified professional remains the final decision maker.',
      'Before closing the task, compare the result with the real-world constraint it is supposed to satisfy. Ask whether a different country, institution, device, unit, document version or audience would change the answer. When two reasonable interpretations exist, record both and explain which one you selected. A good handoff includes enough context for a colleague, client, lecturer or family member to challenge the assumptions without repeating the whole exercise. If an external rule matters, reopen the official source on the day of action. If the source is unavailable or unclear, pause the irreversible step and seek confirmation rather than presenting the draft as final.',
      'Finally, distinguish the calculation or file from the decision made with it. The output is evidence for a conversation, approval or next action. It is not the approval itself.'
    ],
    disclaimer: 'This guide and tool support planning and checking. They do not guarantee acceptance, compliance, profit, security, accessibility, academic marks or a particular operational outcome.',
    toolNote: 'Open the tool with the verified inputs already beside you. Complete one baseline run, name or download the result clearly, and compare it with the acceptance rule you recorded at the start. If the tool exposes optional settings, change them deliberately and document why. Keep the original source material available so a reviewer can reproduce the result without guessing which values or version you used.'
  },
  fr: {
    dir: 'fr/blog', hub: '/fr/blog/', home: '/fr/', language: 'fr', ogLocale: 'fr_FR',
    team: 'Équipe AfroTools', reviewed: 'Relu le', minutes: 'min de lecture', guide: 'Guide',
    quick: 'Réponse pratique', inputs: 'Données à vérifier', workflow: 'Méthode étape par étape',
    details: 'Rendre le résultat fiable', pitfalls: 'Erreurs fréquentes',
    verification: 'Vérification et trace de décision', privacy: 'Confidentialité et usage sûr',
    sources: 'Sources et vérification complémentaire', related: 'Guides AfroTools associés',
    faq: 'Questions fréquentes', toolCta: 'Ouvrir l’outil AfroTools',
    input: 'Donnée', evidence: 'Point à vérifier', read: 'Lire le guide',
    shared: [
      'Commencez par la décision à servir, pas par le calculateur. Notez qui utilisera le résultat, quel dossier ou processus il soutient, la date attendue et la règle d’acceptation. Un nombre ou un fichier techniquement correct peut échouer s’il répond à la mauvaise question, couvre une mauvaise période ou arrive dans un format inutilisable.',
      'Conservez les preuves avec les données saisies: contrat, calendrier, jeton de design, document source, règle de compte, guide de style, tarif ou note de mesure. Ajoutez la date et la version quand la règle peut évoluer. Une hypothèse doit rester présentée comme telle et ne pas devenir un fait observé dans la sortie.',
      'Produisez d’abord un scénario de référence, puis modifiez une hypothèse importante à la fois. Vous verrez ainsi la sensibilité du résultat et pourrez expliquer son évolution. Ne changez pas plusieurs données en silence jusqu’à obtenir une réponse commode. Gardez aussi un scénario écarté s’il met en évidence un risque.',
      'Rouvrez chaque fichier téléchargé et refaites séparément tout calcul important. Contrôlez libellés, unités, ordre des pages, dates, signes, arrondis et destination. Un aperçu ou un téléchargement réussi prouve seulement que l’action a abouti, pas que le résultat est complet, accepté ou adapté.',
      'Créez une courte trace avec source, données, hypothèses, résultat, relecteur et prochaine action. Si la situation change, créez une nouvelle version datée au lieu d’écraser l’unique copie. Cette discipline apporte une piste de contrôle pratique sans transformer un outil courant en promesse d’approbation officielle.',
      'Utilisez le minimum d’informations personnelles ou confidentielles. Préférez le traitement local pour les pièces d’identité, données financières, dossiers professionnels et travaux universitaires. Ne placez jamais mots de passe, numéros d’identité, contrats privés ou dossiers personnels dans un service non fiable.',
      'Avant de terminer, confrontez le résultat à la contrainte réelle qu’il doit satisfaire. Demandez-vous si un autre pays, établissement, appareil, unité, document ou public modifierait la réponse. Lorsque deux interprétations sont raisonnables, conservez les deux et expliquez le choix retenu. Une bonne transmission donne assez de contexte à un collègue, client, enseignant ou proche pour contester les hypothèses sans recommencer tout le travail. Si une règle externe compte, rouvrez la source officielle le jour de l’action. Si elle reste indisponible ou ambiguë, suspendez l’étape irréversible et demandez confirmation plutôt que de présenter le brouillon comme définitif.',
      'Enfin, distinguez le calcul ou le fichier de la décision qui s’appuie dessus. La sortie nourrit une discussion, une validation ou une prochaine étape; elle ne constitue pas elle-même cette validation.'
    ],
    disclaimer: 'Ce guide et cet outil aident à planifier et contrôler. Ils ne garantissent ni acceptation, ni conformité, ni bénéfice, ni sécurité, ni accessibilité, ni résultat universitaire ou opérationnel.',
    toolNote: 'Ouvrez l’outil avec les données vérifiées à portée de main. Produisez un premier résultat de référence, nommez ou téléchargez le fichier clairement, puis comparez-le avec la règle d’acceptation notée au départ. Si des options sont disponibles, modifiez-les volontairement et consignez la raison. Gardez les sources afin qu’une autre personne puisse reproduire le résultat sans deviner les valeurs ou la version utilisée.'
  },
  sw: {
    dir: 'sw/blogu', hub: '/sw/blogu/', home: '/sw/', language: 'sw', ogLocale: 'sw_KE',
    team: 'Timu ya AfroTools', reviewed: 'Imepitiwa', minutes: 'dakika za kusoma', guide: 'Mwongozo',
    quick: 'Jibu la vitendo', inputs: 'Taarifa za kuthibitisha', workflow: 'Hatua kwa hatua',
    details: 'Jinsi ya kufanya matokeo yaaminike', pitfalls: 'Makosa ya kawaida',
    verification: 'Uthibitishaji na rekodi ya uamuzi', privacy: 'Faragha na matumizi salama',
    sources: 'Vyanzo na uthibitishaji zaidi', related: 'Miongozo mingine ya AfroTools',
    faq: 'Maswali yanayoulizwa mara kwa mara', toolCta: 'Fungua zana ya AfroTools',
    input: 'Taarifa', evidence: 'Kitu cha kuthibitisha', read: 'Soma mwongozo',
    shared: [
      'Anza na uamuzi unaotakiwa, si kikokotoo. Andika nani atatumia matokeo, nyaraka au workflow inayosaidiwa, tarehe inayohitajika na sharti la kukubalika. Namba au faili inaweza kuwa sahihi lakini ikakataliwa ikiwa inajibu swali tofauti, imetumia kipindi kisicho sahihi au iko katika format isiyokubalika.',
      'Hifadhi ushahidi pamoja na taarifa ulizoingiza. Ushahidi unaweza kuwa mkataba, kalenda, design token, source document, sheria ya akaunti, style guide, orodha ya bei au kipimo. Weka tarehe na version ikiwa sharti linaweza kubadilika. Taarifa ya makisio iitwe makisio na isigeuzwe kuwa ukweli bila ushahidi.',
      'Tengeneza matokeo ya kwanza kama baseline, kisha badilisha jambo moja muhimu kwa wakati. Hii inaonyesha sensitivity na kumsaidia mtu mwingine kuelewa kwa nini jibu limebadilika. Usibadilishe taarifa nyingi kimya kimya hadi upate jibu unalotaka. Hifadhi pia scenario iliyokataliwa ikiwa inaonyesha hatari.',
      'Fungua tena kila faili uliyopakua na rudia hesabu muhimu kwa njia tofauti. Kagua labels, units, mpangilio wa kurasa, tarehe, alama, rounding na sehemu ya kuwasilisha. Preview au download iliyofanikiwa inaonyesha hatua imekamilika tu, si kwamba matokeo yamekubaliwa au yanafaa.',
      'Tengeneza rekodi fupi yenye source, taarifa, makisio, matokeo, mkaguzi na hatua inayofuata. Hali ikibadilika, tengeneza version mpya yenye tarehe badala ya kufuta rekodi pekee. Hii huwapa timu, wanafunzi na familia audit trail ya vitendo bila kudai idhini rasmi.',
      'Tumia taarifa binafsi au za siri kwa kiwango cha chini. Pendelea processing ya ndani kwa ID, fedha, ajira, masomo na nyaraka za biashara. Usiweke nenosiri, namba ya utambulisho, mkataba wa siri au rekodi binafsi kwenye huduma usiyoamini. Mamlaka, taasisi, mwajiri, mteja au mtaalamu husika ndiye wa mwisho kuamua.',
      'Kabla ya kumaliza, linganisha matokeo na sharti halisi linalotakiwa kutimizwa. Jiulize kama nchi, taasisi, kifaa, unit, toleo la hati au kundi la watumiaji lingebadilisha jibu. Ikiwa kuna tafsiri mbili zinazowezekana, hifadhi zote na eleza uliyochagua na sababu. Handoff nzuri ina maelezo ya kutosha ili mwenzako, mteja, mwalimu au mtu wa familia akague makisio bila kurudia kazi yote. Sheria ya nje ikiwa muhimu, fungua tena source rasmi siku ya kuchukua hatua. Source ikiwa haipatikani au haiko wazi, simamisha hatua isiyoweza kurudishwa na omba uthibitisho. Usibadilishe draft kuwa jibu la mwisho kwa sababu tu zana imetoa namba au faili. Tenganisha wazi data uliyoona, makisio uliyochagua na uamuzi wa mtu mwenye mamlaka.',
      'Mwisho, tenga namba au faili na uamuzi unaofanywa kwa kuitumia. Output ni ushahidi wa mazungumzo, approval au hatua inayofuata; si approval yenyewe. Mtu anayekabidhi kazi aeleze nani anapaswa kukagua, kitu gani bado hakijathibitishwa na tarehe gani source itakaguliwa tena. Hifadhi jina la file au version iliyotumika ili matokeo ya baadaye yasichanganywe na draft ya zamani. Ikiwa mteja, taasisi au mamlaka inatoa maelekezo mapya, anza version mpya kutoka source hiyo badala ya kubadilisha hitimisho pekee.'
    ],
    disclaimer: 'Mwongozo na zana hii husaidia kupanga na kukagua. Haitoi dhamana ya kukubaliwa, compliance, faida, usalama, accessibility, alama za masomo au matokeo fulani ya kazi.',
    toolNote: 'Fungua zana ukiwa na taarifa ulizothibitisha karibu nawe. Fanya hesabu au mchakato wa kwanza kama baseline, ipe result jina linaloeleweka, kisha ilinganishe na sharti la kukubalika uliloandika mwanzoni. Zana ikiwa na settings za ziada, zibadilishe kwa makusudi na uandike sababu. Hifadhi source ya kila input ili mkaguzi aweze kurudia kazi bila kubahatisha value, unit, tarehe au version uliyotumia. Ukipata tofauti, usifute result ya kwanza; hifadhi zote mbili na eleza input iliyobadilika.'
  }
};

function esc(value) {
  return String(value).replace(/[&<>\"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '\"': '&quot;' }[char]));
}

function normalizeBuildOwnedArticleHtml(html) {
  return String(html)
    .replace(/\r\n/g, '\n')
    .replace(/\s+data-chat-bundle="[^"]*"/, '')
    .replace(/\?v=[a-f0-9]{8}(?=["'])/g, '')
    .replace(/^[ \t]*<link rel="stylesheet" href="\/blog\/assets\/css\/blog-typography\.css">[ \t]*\n?/gm, '')
    .replace(/^[ \t]*<script src="\/assets\/js\/analytics-bootstrap\.js"[^>]*><\/script>[ \t]*\n?/gm, '')
    .replace(/^[ \t]*<script src="\/assets\/js\/lib\/sw-accessibility\.js" defer><\/script>[ \t]*\n?/gm, '')
    .replace(/^[ \t]*<script src="\/assets\/js\/lazy-analytics\.js" defer><\/script>[ \t]*\n?/gm, '')
    .replace(/\n{3,}/g, '\n\n');
}

function contentId(locale, file) {
  return `blog:${locale}:${crypto.createHash('sha1').update(file).digest('hex').slice(0, 14)}`;
}

function routeFor(locale, slug) {
  return locale === 'en' ? `/blog/${slug}/` : locale === 'fr' ? `/fr/blog/${slug}/` : `/sw/blogu/${slug}/`;
}

function fileFor(locale, slug) {
  return `${localeConfig[locale].dir}/${slug}/index.html`;
}

function localized(topic, locale) {
  const value = topic.locales[locale];
  if (!value) throw new Error(`Missing ${locale} localization for ${topic.id}`);
  return value;
}

function resolvedLink(href) {
  return LINK_FIXES.get(href) || href;
}

function replaceBlock(text, start, end, body, gridClass) {
  const block = `${start}\n${body}\n${end}`;
  const startAt = text.indexOf(start);
  const endAt = text.indexOf(end);
  if (startAt >= 0 && endAt > startAt) return `${text.slice(0, startAt)}${block}${text.slice(endAt + end.length)}`;
  const anchor = text.indexOf(`<div class="${gridClass}"`);
  if (anchor < 0) throw new Error(`Blog hub grid not found: ${gridClass}`);
  const openEnd = text.indexOf('>', anchor);
  return `${text.slice(0, openEnd + 1)}\n${block}${text.slice(openEnd + 1)}`;
}

function visibleWordCount(html) {
  return html.replace(/<[^>]+>/g, ' ').replace(/&[a-z0-9#]+;/gi, ' ').replace(/\s+/g, ' ').trim().split(' ').filter(Boolean).length;
}

function renderBody(topic, locale) {
  const c = localeConfig[locale];
  const item = localized(topic, locale);
  const rows = item.inputs.map(([input, evidence]) => `<tr><td>${esc(input)}</td><td>${esc(evidence)}</td></tr>`).join('');
  const steps = item.steps.map((step) => `<li>${esc(step)}</li>`).join('');
  const specifics = item.specifics.map((paragraph) => `<p>${esc(paragraph)}</p>`).join('\n');
  const pitfalls = item.pitfalls.map((pitfall) => `<li>${esc(pitfall)}</li>`).join('');
  const sources = topic.sources.map(([href, label]) => `<li><a href="${href}" target="_blank" rel="noopener">${esc(label)}</a></li>`).join('');
  const related = item.related.map(([href, label]) => `<li><a href="${resolvedLink(href)}">${esc(label)}</a></li>`).join('');
  const faqs = item.faq.map(([question, answer]) => `<div class="faq-item"><button class="faq-question" type="button" onclick="this.parentElement.classList.toggle('open')">${esc(question)} <span class="faq-chevron">&#9660;</span></button><div class="faq-answer"><div class="faq-answer-inner"><p>${esc(answer)}</p></div></div></div>`).join('');
  return `<p>${esc(item.lead)}</p>
<p>${esc(item.plan)}</p>
<p><a href="${item.tool[0]}">${esc(item.tool[1])}</a> ${locale === 'en' ? 'opens the practical workflow in your browser.' : locale === 'fr' ? 'ouvre le workflow pratique dans votre navigateur.' : 'hufungua workflow ya vitendo ndani ya browser.'}</p>

<h2 id="quick-answer">${c.quick}</h2>
<p>${esc(c.shared[0])}</p>

<h2 id="inputs">${c.inputs}</h2>
<div class="table-wrapper"><table><thead><tr><th>${c.input}</th><th>${c.evidence}</th></tr></thead><tbody>${rows}</tbody></table></div>
<p>${esc(c.shared[1])}</p>

<h2 id="workflow">${c.workflow}</h2>
<ol>${steps}</ol>
<p>${esc(c.shared[2])}</p>

<h2 id="details">${c.details}</h2>
${specifics}
<p>${esc(c.shared[3])}</p>

<h2 id="pitfalls">${c.pitfalls}</h2>
<ul>${pitfalls}</ul>

<h2 id="verification">${c.verification}</h2>
<p>${esc(c.shared[4])}</p>
<p>${esc(c.shared[6])}</p>
<p>${esc(c.shared[7])}</p>
<p>${esc(c.disclaimer)}</p>

<h2 id="privacy">${c.privacy}</h2>
<p>${esc(c.shared[5])}</p>

<h2 id="tool">${c.toolCta}</h2>
<p><a class="btn" href="${item.tool[0]}">${esc(item.tool[1])} &#8594;</a></p>
<p>${esc(c.toolNote)}</p>

<h2 id="sources">${c.sources}</h2>
<ul>${sources}</ul>

<h2 id="related">${c.related}</h2>
<ul>${related}</ul>

<section class="faq-section" id="faq"><h2 class="faq-section-title">${c.faq}</h2>${faqs}</section>`;
}

function renderArticle(topic, locale) {
  const c = localeConfig[locale];
  const item = localized(topic, locale);
  const route = routeFor(locale, item.slug);
  const canonical = `https://afrotools.com${route}`;
  const alternates = ['en', 'fr', 'sw'].map((lang) => `<link rel="alternate" hreflang="${lang}" href="https://afrotools.com${routeFor(lang, localized(topic, lang).slug)}">`).join('\n');
  const body = renderBody(topic, locale);
  const wordCount = visibleWordCount(body);
  const readMinutes = Math.max(6, Math.ceil(wordCount / 190));
  const articleSchema = {
    '@context': 'https://schema.org', '@type': 'Article', headline: item.title, description: item.description,
    author: { '@type': 'Organization', name: 'AfroTools Team', url: 'https://afrotools.com/' },
    publisher: { '@type': 'Organization', name: 'AfroTools', url: 'https://afrotools.com/', logo: { '@type': 'ImageObject', url: 'https://afrotools.com/assets/img/logo-mark.svg' } },
    datePublished: data.published, dateModified: data.published, mainEntityOfPage: canonical,
    image: `https://afrotools.com/assets/img/tools/${topic.image}.webp`, inLanguage: locale, wordCount
  };
  const breadcrumb = { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
    { '@type': 'ListItem', position: 1, name: locale === 'en' ? 'Home' : locale === 'fr' ? 'Accueil' : 'Mwanzo', item: `https://afrotools.com${c.home}` },
    { '@type': 'ListItem', position: 2, name: locale === 'sw' ? 'Blogu' : 'Blog', item: `https://afrotools.com${c.hub}` },
    { '@type': 'ListItem', position: 3, name: item.title }
  ] };
  const faqSchema = { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: item.faq.map(([name, answer]) => ({ '@type': 'Question', name, acceptedAnswer: { '@type': 'Answer', text: answer } })) };
  const file = fileFor(locale, item.slug);
  return `<!DOCTYPE html>
<html lang="${c.language}">
<head>
<meta charset="UTF-8">
<meta name="afrotools-content-id" content="${contentId(locale, file)}">
<meta name="afrotools-source-owner" content="scripts/build-blog-multilingual-wave2-2026-08.js">
<meta name="content-language" content="${c.language}">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(item.title)} | AfroTools</title>
<meta name="description" content="${esc(item.description)}">
<meta name="robots" content="index, follow">
<meta name="author" content="AfroTools">
<link rel="canonical" href="${canonical}">
${alternates}
<link rel="alternate" hreflang="x-default" href="https://afrotools.com${routeFor('en', localized(topic, 'en').slug)}">
<meta property="og:type" content="article"><meta property="og:url" content="${canonical}"><meta property="og:title" content="${esc(item.title)}"><meta property="og:description" content="${esc(item.description)}"><meta property="og:image" content="https://afrotools.com/assets/img/tools/${topic.image}.webp"><meta property="og:site_name" content="AfroTools"><meta property="og:locale" content="${c.ogLocale}"><meta property="article:published_time" content="${data.published}"><meta property="article:modified_time" content="${data.published}"><meta property="article:section" content="${esc(item.category)}">
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${esc(item.title)}"><meta name="twitter:description" content="${esc(item.description)}"><meta name="twitter:image" content="https://afrotools.com/assets/img/tools/${topic.image}.webp">
<link rel="icon" type="image/svg+xml" href="/assets/img/logo-mark.svg">
<link rel="stylesheet" href="/assets/css/tokens.min.css"><link rel="stylesheet" href="/assets/css/global.min.css"><link rel="stylesheet" href="/blog/assets/css/blog.css"><link rel="stylesheet" href="/blog/assets/css/blog-platform.css"><link rel="stylesheet" href="/assets/css/top-level-page-ui-refresh.css">
<script src="/assets/js/components/navbar.min.js" defer></script><script src="/assets/js/components/footer.min.js" defer></script>
<script type="application/ld+json">${JSON.stringify(articleSchema)}</script>
<script type="application/ld+json">${JSON.stringify(breadcrumb)}</script>
<script type="application/ld+json">${JSON.stringify(faqSchema)}</script>
<link rel="stylesheet" href="/blog/assets/css/blog-typography.css">
</head>
<body class="top-level-page-ui-refresh">
<div class="reading-progress" id="readingProgress"></div><afro-navbar></afro-navbar>
<section class="article-hero"><div class="article-hero-inner"><nav class="breadcrumb" aria-label="Breadcrumb"><a href="${c.home}">${locale === 'en' ? 'Home' : locale === 'fr' ? 'Accueil' : 'Mwanzo'}</a> <span class="sep">&#8250;</span> <a href="${c.hub}">${locale === 'sw' ? 'Blogu' : 'Blog'}</a></nav><span class="category-badge">${esc(item.category)}</span><h1>${esc(item.title)}</h1><div class="article-meta-hero"><span>${c.team}</span><span class="dot"></span><time datetime="${data.published}">${c.reviewed} ${data.reviewedLabel[locale]}</time><span class="dot"></span><span>${readMinutes} ${c.minutes}</span></div></div></section>
<div class="article-featured-img"><div class="article-featured-img-inner"><img width="600" height="400" src="/assets/img/tools/${topic.image}.webp" alt="${esc(item.imageAlt)}" loading="eager"></div></div>
<main class="article-layout"><nav class="article-toc" aria-label="${c.guide}"><div class="article-toc-title">${c.guide}</div><ol><li><a href="#quick-answer">${c.quick}</a></li><li><a href="#inputs">${c.inputs}</a></li><li><a href="#workflow">${c.workflow}</a></li><li><a href="#pitfalls">${c.pitfalls}</a></li><li><a href="#sources">${c.sources}</a></li><li><a href="#faq">${c.faq}</a></li></ol></nav><article class="article-body">${body}</article></main>
<afro-footer></afro-footer><script src="/blog/assets/js/blog-reading.js" defer></script><script src="/assets/js/lazy-analytics.js" defer></script>
</body></html>
`;
}

function card(topic, locale) {
  const item = localized(topic, locale);
  return `<article class="article-card" data-locale="${locale}" data-cat="${esc(item.cardCategory)}"><a class="article-card-image" href="${routeFor(locale, item.slug)}"><img src="/assets/img/tools/${topic.image}.webp" alt="${esc(item.imageAlt)}" loading="lazy" width="400" height="240"></a><div class="article-card-body"><span class="category-badge">${esc(item.category)}</span><h3><a href="${routeFor(locale, item.slug)}">${esc(item.title)}</a></h3><p class="article-card-excerpt">${esc(item.description)}</p><span class="featured-read-more">${localeConfig[locale].read} &#8594;</span></div></article>`;
}

function swCard(topic) {
  const item = localized(topic, 'sw');
  return `<a class="post-card" href="${routeFor('sw', item.slug)}"><div class="post-thumb">SW</div><div class="post-body"><div class="post-meta"><span class="post-tag">${esc(item.category)}</span><span class="post-date">Ago 2026</span></div><h3 class="post-title">${esc(item.title)}</h3><p class="post-desc">${esc(item.description)}</p><span class="post-link">Soma mwongozo &#8594;</span></div></a>`;
}

function expectedFrenchManifest(current) {
  const rows = data.topics.map((topic) => {
    const item = localized(topic, 'fr');
    return { slug: item.slug, category: item.category, description: item.description, image: topic.image, published: data.published };
  });
  const slugs = new Set(rows.map((row) => row.slug));
  const articles = [...rows, ...current.articles.filter((row) => !slugs.has(row.slug))]
    .sort((a, b) => String(b.published || '').localeCompare(String(a.published || '')) || a.slug.localeCompare(b.slug));
  return { ...current, articles };
}

function expectedContentManifest(current) {
  const rows = [];
  for (const topic of data.topics) for (const locale of ['en', 'fr']) {
    const item = localized(topic, locale);
    const file = fileFor(locale, item.slug);
    rows.push({ contentId: contentId(locale, file), file, slug: item.slug, locale, category: item.cardCategory, publicationStatus: 'published' });
  }
  const files = new Set(rows.map((row) => row.file));
  return { ...current, articles: [...current.articles.filter((row) => !files.has(row.file)), ...rows].sort((a, b) => a.file.localeCompare(b.file)) };
}

function validateSource() {
  const errors = [];
  const slugs = new Set();
  const keywords = new Set();
  if (data.topics.length !== 10) errors.push(`Expected 10 topics, found ${data.topics.length}`);
  const raw = fs.readFileSync(sourcePath, 'utf8');
  if (/[—–]/.test(raw)) errors.push('Publishable source contains an em dash or en dash');
  if (/Ã.|â€|ï¿½/.test(raw)) errors.push('Publishable source contains likely mojibake');
  for (const topic of data.topics) {
    if (!Array.isArray(topic.sources) || topic.sources.length < 2) errors.push(`${topic.id}: fewer than two sources`);
    for (const locale of ['en', 'fr', 'sw']) {
      const item = localized(topic, locale);
      const slugKey = `${locale}:${item.slug}`;
      const keyword = item.keyword.toLocaleLowerCase(locale).trim();
      if (slugs.has(slugKey)) errors.push(`${topic.id}: duplicate ${slugKey}`);
      if (keywords.has(keyword)) errors.push(`${topic.id}: duplicate keyword ${item.keyword}`);
      slugs.add(slugKey);
      keywords.add(keyword);
      if (item.description.length < 100 || item.description.length > 180) errors.push(`${topic.id}/${locale}: description length ${item.description.length}`);
      if (item.title.length > 68) errors.push(`${topic.id}/${locale}: title length ${item.title.length}`);
      if (item.inputs.length < 5 || item.steps.length < 5 || item.specifics.length < 3 || item.pitfalls.length < 4 || item.faq.length < 3) errors.push(`${topic.id}/${locale}: incomplete editorial fields`);
      const words = visibleWordCount(renderBody(topic, locale));
      if (words < 800) errors.push(`${topic.id}/${locale}: only ${words} article-body words`);
    }
  }
  if (errors.length) throw new Error(`Multilingual wave two validation failed:\n- ${errors.join('\n- ')}`);
}

function renderReport() {
  const rows = data.topics.map((topic, index) => `| ${index + 1} | ${topic.locales.en.keyword} | ${topic.locales.fr.keyword} | ${topic.locales.sw.keyword} | ${topic.intent} | ${topic.image} |`).join('\n');
  return `# Multilingual blog keyword wave two, August 2026\n\nGenerated from \`${sourceRelative}\`.\n\n## Scope\n\n- Ten new search-intent clusters.\n- Thirty publishable pages: English, French and Swahili for each cluster.\n- Every locale version is a native editorial rewrite with a canonical URL, reciprocal EN/FR/SW hreflang, Article, Breadcrumb and FAQ structured data, at least 800 article-body words and a direct live-tool handoff.\n- Opportunity selection uses current repository overlap, tool fit, authoritative source availability and sampled web research. It does not claim measured search volume, keyword difficulty or guaranteed rankings.\n\n| # | English keyword | French keyword | Swahili keyword | Search job | Existing image |\n| ---: | --- | --- | --- | --- | --- |\n${rows}\n\n## Editorial controls\n\nThe source rejects em dashes, likely mojibake, duplicate locale keywords, thin bodies and incomplete topic fields. The guides avoid fixed prices, legal promises, security guarantees and automatic acceptance claims. Existing registry-backed tools and artwork are reused.\n`;
}

let mismatches = 0;
function sync(file, expected) {
  const target = path.join(root, file);
  const current = fs.existsSync(target) ? fs.readFileSync(target, 'utf8') : '';
  const isOwnedArticle = /(?:^|\/)(?:blog|blogu)\/[^/]+\/index\.html$/.test(file) && current.includes('afrotools-source-owner');
  if ((isOwnedArticle ? normalizeBuildOwnedArticleHtml(current) === normalizeBuildOwnedArticleHtml(expected) : current === expected)) return;
  mismatches += 1;
  if (write) {
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, expected, 'utf8');
  } else console.error(`out of date: ${file}`);
}

validateSource();

for (const topic of data.topics) for (const locale of ['en', 'fr', 'sw']) {
  const item = localized(topic, locale);
  sync(fileFor(locale, item.slug), renderArticle(topic, locale));
}

for (const locale of ['en', 'sw']) {
  const hubFile = locale === 'en' ? 'blog/index.html' : 'sw/blogu/index.html';
  const hub = fs.readFileSync(path.join(root, hubFile), 'utf8');
  const [start, end] = HUB_MARKERS[locale];
  const cards = locale === 'en' ? data.topics.map((topic) => card(topic, locale)) : data.topics.map(swCard);
  sync(hubFile, replaceBlock(hub, start, end, cards.join('\n'), locale === 'en' ? 'blog-grid' : 'posts-grid'));
}

const frenchManifest = JSON.parse(fs.readFileSync(frenchManifestPath, 'utf8'));
sync('data/localization/fr-blog-manifest.json', `${JSON.stringify(expectedFrenchManifest(frenchManifest), null, 2)}\n`);
const contentManifest = JSON.parse(fs.readFileSync(contentManifestPath, 'utf8'));
sync('data/content/blog-article-manifest.json', `${JSON.stringify(expectedContentManifest(contentManifest), null, 2)}\n`);
sync(reportRelative, renderReport());

if (mismatches && !write) process.exitCode = 1;
console.log(`${write ? 'built' : 'checked'} ${data.topics.length * 3} multilingual blog pages; ${mismatches} file(s) ${write ? 'updated' : 'out of date'}`);
