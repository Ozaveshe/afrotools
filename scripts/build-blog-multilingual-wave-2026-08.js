'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const root = path.resolve(__dirname, '..');
const sourcePath = path.join(root, 'data', 'content', 'blog-multilingual-wave-2026-08.json');
const frenchManifestPath = path.join(root, 'data', 'localization', 'fr-blog-manifest.json');
const reportPath = path.join(root, 'reports', 'blog-multilingual-wave-2026-08.md');
const write = process.argv.includes('--write');
const data = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));

const HUB_MARKERS = {
  en: ['<!-- BLOG-MULTILINGUAL-WAVE-2026-08:START -->', '<!-- BLOG-MULTILINGUAL-WAVE-2026-08:END -->'],
  sw: ['<!-- BLOGU-MULTILINGUAL-WAVE-2026-08:START -->', '<!-- BLOGU-MULTILINGUAL-WAVE-2026-08:END -->']
};

const localeConfig = {
  en: {
    dir: 'blog', hub: '/blog/', home: '/', language: 'en', ogLocale: 'en_US',
    team: 'AfroTools Team', reviewed: 'Reviewed', minutes: 'min read',
    guide: 'Guide', quick: 'Quick answer', inputs: 'Inputs to verify', steps: 'Step-by-step workflow',
    checks: 'Checks before you rely on the result', sources: 'Sources and verification', related: 'Related AfroTools guides',
    faq: 'Frequently asked questions', open: 'Open the AfroTools workflow', evidence: 'Evidence to keep',
    input: 'Input or decision', status: 'What to verify',
    sourceIntro: 'These sources explain the underlying standard or decision process. Reopen the live source and the relevant authority or institution before acting because requirements can change.',
    shared: [
      'Start with the exact job you need to complete. A useful result is tied to a real application, meeting, agreement, trip, electricity purchase, job application, image export or academic record. Write down the destination, deadline and acceptance rule before changing any settings.',
      'Keep the original file or record unchanged. Work on a copy, label the output with the date and purpose, and compare it with the source before sending or uploading it. This makes mistakes reversible and gives another person enough context to review the decision.',
      'Treat any estimate as a planning aid. Fees, entry rules, grading scales, document clauses, upload limits and utility deductions can vary by provider, country and date. The receiving institution or official authority remains the final source of truth.'
    ],
    privacy: 'Privacy and safety',
    privacyText: 'Use the minimum information needed. Do not paste identity numbers, private commercial terms, academic records or personal contact details into an untrusted service. AfroTools workflows described here are designed for practical preparation, but you should still review the page notice and export before sharing it.',
    reviewTitle: 'Create a review trail',
    review: [
      'Record the source, date and version beside the result. If another person reviews the work, ask them to check the inputs and acceptance rule rather than only the final appearance. Save their correction separately so the original decision remains traceable.',
      'When the receiving portal, authority, employer, utility or institution rejects the output, keep the rejection message and compare it with the rule you recorded. Correct the identified mismatch first. Repeating the same export with random settings makes the problem harder to diagnose and can create conflicting copies.'
    ],
    noGuarantee: 'The tool organises your inputs and produces a planning output. It does not guarantee acceptance, legal enforceability, admission, visa approval, electricity supply, employment or a particular grade.'
  },
  fr: {
    dir: 'fr/blog', hub: '/fr/blog/', home: '/fr/', language: 'fr', ogLocale: 'fr_FR',
    team: 'Équipe AfroTools', reviewed: 'Relu le', minutes: 'min de lecture',
    guide: 'Guide', quick: 'Réponse rapide', inputs: 'Données à vérifier', steps: 'Méthode étape par étape',
    checks: 'Contrôles avant de retenir le résultat', sources: 'Sources et vérification', related: 'Guides AfroTools associés',
    faq: 'Questions fréquentes', open: 'Ouvrir le workflow AfroTools', evidence: 'Preuve à conserver',
    input: 'Donnée ou décision', status: 'Point à vérifier',
    sourceIntro: 'Ces sources expliquent la norme ou la méthode de décision. Rouvrez la source en ligne ainsi que le site de l’autorité ou de l’établissement concerné avant d’agir, car les exigences peuvent changer.',
    shared: [
      'Commencez par définir la tâche exacte. Un résultat utile correspond à une demande réelle, une réunion, un accord, un voyage, une recharge d’électricité, une candidature, un export d’image ou un relevé universitaire. Notez la destination, l’échéance et la règle d’acceptation avant de modifier les réglages.',
      'Conservez le fichier ou le relevé original sans le modifier. Travaillez sur une copie, nommez la sortie avec la date et l’objectif, puis comparez-la à la source avant l’envoi. Cette méthode rend les erreurs réversibles et facilite la relecture.',
      'Traitez toute estimation comme une aide à la planification. Les frais, règles d’entrée, barèmes de notes, clauses, limites de téléversement et retenues du fournisseur peuvent varier selon le pays, le prestataire et la date. L’autorité ou l’établissement destinataire reste la source finale.'
    ],
    privacy: 'Confidentialité et sécurité',
    privacyText: 'Utilisez le minimum d’informations nécessaire. Ne copiez pas de numéro d’identité, de conditions commerciales privées, de relevé universitaire ou de coordonnées personnelles dans un service non fiable. Relisez toujours la notice de la page et le fichier exporté avant de le partager.',
    reviewTitle: 'Créer une trace de relecture',
    review: [
      'Consignez la source, la date et la version avec le résultat. Demandez au relecteur de contrôler les données et la règle d’acceptation, pas seulement l’apparence finale. Conservez sa correction séparément afin que la décision initiale reste traçable.',
      'Si le portail, l’autorité, l’employeur, le fournisseur ou l’établissement refuse la sortie, gardez le message de refus et comparez-le à la règle notée. Corrigez d’abord l’écart identifié au lieu de multiplier des réglages aléatoires et des copies contradictoires.'
    ],
    noGuarantee: 'L’outil organise vos données et produit un résultat de planification. Il ne garantit ni acceptation, ni validité juridique, ni admission, ni visa, ni fourniture d’électricité, ni emploi, ni note particulière.'
  },
  sw: {
    dir: 'sw/blogu', hub: '/sw/blogu/', home: '/sw/', language: 'sw', ogLocale: 'sw_KE',
    team: 'Timu ya AfroTools', reviewed: 'Imepitiwa', minutes: 'dakika za kusoma',
    guide: 'Mwongozo', quick: 'Jibu la haraka', inputs: 'Taarifa za kuthibitisha', steps: 'Hatua kwa hatua',
    checks: 'Ukaguzi kabla ya kutumia matokeo', sources: 'Vyanzo na uthibitishaji', related: 'Miongozo mingine ya AfroTools',
    faq: 'Maswali yanayoulizwa mara kwa mara', open: 'Fungua zana ya AfroTools', evidence: 'Ushahidi wa kuhifadhi',
    input: 'Taarifa au uamuzi', status: 'Kitu cha kuthibitisha',
    sourceIntro: 'Vyanzo hivi vinaeleza kiwango au njia ya kufanya uamuzi. Fungua tena chanzo hai pamoja na tovuti ya mamlaka au taasisi husika kabla ya kuchukua hatua, kwa sababu masharti yanaweza kubadilika.',
    shared: [
      'Anza kwa kufafanua kazi halisi unayotaka kukamilisha. Matokeo yenye maana yahusishwe na ombi, mkutano, makubaliano, safari, ununuzi wa umeme, maombi ya kazi, picha au rekodi ya masomo. Andika mahali pa kuwasilisha, tarehe ya mwisho na sharti la kukubalika kabla ya kubadilisha mipangilio.',
      'Hifadhi faili au rekodi ya awali bila kuibadilisha. Fanyia kazi nakala, ipe jina lenye tarehe na kusudi, kisha ilinganishe na chanzo kabla ya kuituma. Hii hurahisisha kurekebisha kosa na kumpa mkaguzi muktadha wa kutosha.',
      'Chukulia makadirio kama msaada wa kupanga. Ada, masharti ya kuingia, mizani ya alama, vifungu vya mkataba, mipaka ya kupakia faili na makato ya huduma yanaweza kutofautiana kwa nchi, mtoa huduma na tarehe. Taasisi au mamlaka inayopokea ndiyo chanzo cha mwisho.'
    ],
    privacy: 'Faragha na usalama',
    privacyText: 'Tumia taarifa chache zinazohitajika. Usiweke namba za utambulisho, masharti ya siri ya biashara, rekodi za masomo au mawasiliano binafsi kwenye huduma usiyoamini. Soma maelezo ya ukurasa na ukague faili iliyopakuliwa kabla ya kuishiriki.',
    reviewTitle: 'Tengeneza rekodi ya ukaguzi',
    review: [
      'Andika chanzo, tarehe na toleo pamoja na matokeo. Mtu mwingine akikagua, mwombe athibitishe taarifa na sharti la kukubalika, si muonekano wa mwisho pekee. Hifadhi marekebisho kando ili uamuzi wa awali ufuatiliwe.',
      'Ikiwa tovuti, mamlaka, mwajiri, kampuni au taasisi imekataa matokeo, hifadhi ujumbe wa kukataa na ulinganishe na sharti uliloandika. Rekebisha tofauti iliyotajwa kwanza badala ya kubadilisha mipangilio bila mpango na kutengeneza nakala nyingi zinazopingana.'
    ],
    noGuarantee: 'Zana hupanga taarifa zako na kutoa matokeo ya kupanga. Haihakikishi kukubaliwa, uhalali wa kisheria, udahili, visa, upatikanaji wa umeme, ajira au alama fulani.'
  }
};

function esc(value) {
  return String(value).replace(/[&<>\"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '\"': '&quot;' }[char]));
}

function normalizeBuildOwnedArticleHtml(html) {
  let normalized = String(html)
    .replace(/\r\n/g, '\n')
    .replace(/\s+data-chat-bundle="[^"]*"/, '')
    .replace(/\?v=[a-f0-9]{8}(?=["'])/g, '')
    .replace(/^[ \t]*<link rel="stylesheet" href="\/blog\/assets\/css\/blog-typography\.css">[ \t]*\n?/gm, '')
    .replace(/^[ \t]*<script src="\/assets\/js\/analytics-bootstrap\.js"[^>]*><\/script>[ \t]*\n?/gm, '')
    .replace(/^[ \t]*<script src="\/assets\/js\/lib\/sw-accessibility\.js" defer><\/script>[ \t]*\n?/gm, '')
    .replace(/^[ \t]*<script src="\/assets\/js\/lazy-analytics\.js" defer><\/script>[ \t]*\n?/gm, '');

  const routeLinks = [];
  normalized = normalized.replace(/^[ \t]*<link rel="(?:canonical|alternate)"[^>]*>[ \t]*\n?/gm, (link) => {
    routeLinks.push(link.trim());
    return '';
  });
  if (routeLinks.length) {
    normalized = normalized.replace(/(<meta name="author"[^>]*>\n)/, `$1${routeLinks.join('\n')}\n`);
  }
  return normalized.replace(/\n{3,}/g, '\n\n');
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

function replaceBlock(text, start, end, body, gridClass = 'blog-grid') {
  const block = `${start}\n${body}\n${end}`;
  const startAt = text.indexOf(start);
  const endAt = text.indexOf(end);
  if (startAt >= 0 && endAt > startAt) return `${text.slice(0, startAt)}${block}${text.slice(endAt + end.length)}`;
  const anchor = text.indexOf(`<div class="${gridClass}"`);
  if (anchor < 0) throw new Error('Blog hub grid not found');
  const openEnd = text.indexOf('>', anchor);
  return `${text.slice(0, openEnd + 1)}\n${block}${text.slice(openEnd + 1)}`;
}

function localized(topic, locale) {
  const value = topic.locales[locale];
  if (!value) throw new Error(`Missing ${locale} localization for ${topic.id}`);
  return value;
}

function renderBody(topic, locale) {
  const c = localeConfig[locale];
  const item = localized(topic, locale);
  const shared = item.shared || c.shared;
  const review = item.review || c.review;
  const privacyText = item.privacyText || c.privacyText;
  const noGuarantee = item.noGuarantee || c.noGuarantee;
  const rows = item.inputs.map(([input, evidence]) => `<tr><td>${esc(input)}</td><td>${esc(evidence)}</td></tr>`).join('');
  const steps = item.steps.map((step) => `<li>${esc(step)}</li>`).join('');
  const checks = item.checks.map((check) => `<li>${esc(check)}</li>`).join('');
  const faqs = item.faq.map(([question, answer]) => `<div class="faq-item"><button class="faq-question" type="button" onclick="this.parentElement.classList.toggle('open')">${esc(question)} <span class="faq-chevron">&#9660;</span></button><div class="faq-answer"><div class="faq-answer-inner"><p>${esc(answer)}</p></div></div></div>`).join('');
  const sources = topic.sources.map(([href, label]) => `<li><a href="${href}" target="_blank" rel="noopener">${esc(label)}</a></li>`).join('');
  const related = item.related.map(([href, label]) => `<li><a href="${href}">${esc(label)}</a></li>`).join('');
  return `<p>${esc(item.opening)}</p>
<p>${esc(item.answer)}</p>
<p><a href="${item.tool[0]}">${esc(item.tool[1])}</a> ${esc(item.toolIntro)}</p>

<h2 id="quick-answer">${c.quick}</h2>
<p>${esc(item.quick)}</p>
<p>${esc(shared[0])}</p>

<h2 id="inputs">${c.inputs}</h2>
<div class="table-wrapper"><table><thead><tr><th>${c.input}</th><th>${c.evidence}</th></tr></thead><tbody>${rows}</tbody></table></div>
<p>${esc(item.inputNote)}</p>

<h2 id="workflow">${c.steps}</h2>
<ol>${steps}</ol>
<p>${esc(shared[1])}</p>

<h2 id="details">${esc(item.detailTitle)}</h2>
${item.details.map((paragraph) => `<p>${esc(paragraph)}</p>`).join('\n')}

<h2 id="checks">${c.checks}</h2>
<ul>${checks}</ul>
<p>${esc(shared[2])}</p>

<h2 id="review">${c.reviewTitle}</h2>
${review.map((paragraph) => `<p>${esc(paragraph)}</p>`).join('\n')}

<h2 id="privacy">${c.privacy}</h2>
<p>${esc(privacyText)}</p>
<p>${esc(item.safety)}</p>

<h2 id="tool">${c.open}</h2>
<p><a class="btn" href="${item.tool[0]}">${esc(item.tool[1])} &#8594;</a></p>
<p>${esc(item.toolUse)}</p>
<p>${esc(noGuarantee)}</p>

<h2 id="sources">${c.sources}</h2>
<p>${esc(c.sourceIntro)}</p>
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
  const wordCount = body.replace(/<[^>]+>/g, ' ').replace(/&[a-z0-9#]+;/gi, ' ').replace(/\s+/g, ' ').trim().split(' ').filter(Boolean).length;
  const readMinutes = Math.max(6, Math.ceil(wordCount / 190));
  const modified = item.modified || data.published;
  const reviewedLabel = item.reviewedLabel || data.reviewedLabel;
  const articleSchema = {
    '@context': 'https://schema.org', '@type': 'Article', headline: item.title, description: item.description,
    author: { '@type': 'Organization', name: 'AfroTools Team', url: 'https://afrotools.com/' },
    publisher: { '@type': 'Organization', name: 'AfroTools', url: 'https://afrotools.com/', logo: { '@type': 'ImageObject', url: 'https://afrotools.com/assets/img/logo-mark.svg' } },
    datePublished: data.published, dateModified: modified, mainEntityOfPage: canonical,
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
<meta name="afrotools-source-owner" content="scripts/build-blog-multilingual-wave-2026-08.js">
<meta name="content-language" content="${c.language}">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(item.title)} | AfroTools</title>
<meta name="description" content="${esc(item.description)}">
<meta name="robots" content="index, follow">
<meta name="author" content="AfroTools">
<link rel="canonical" href="${canonical}">
${alternates}
<link rel="alternate" hreflang="x-default" href="https://afrotools.com${routeFor('en', localized(topic, 'en').slug)}">
<meta property="og:type" content="article"><meta property="og:url" content="${canonical}"><meta property="og:title" content="${esc(item.title)}"><meta property="og:description" content="${esc(item.description)}"><meta property="og:image" content="https://afrotools.com/assets/img/tools/${topic.image}.webp"><meta property="og:site_name" content="AfroTools"><meta property="og:locale" content="${c.ogLocale}"><meta property="article:published_time" content="${data.published}"><meta property="article:modified_time" content="${modified}"><meta property="article:section" content="${esc(item.category)}">
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${esc(item.title)}"><meta name="twitter:description" content="${esc(item.description)}"><meta name="twitter:image" content="https://afrotools.com/assets/img/tools/${topic.image}.webp">
<link rel="icon" type="image/svg+xml" href="/assets/img/logo-mark.svg">
<link rel="stylesheet" href="/assets/css/tokens.min.css"><link rel="stylesheet" href="/assets/css/global.min.css"><link rel="stylesheet" href="/blog/assets/css/blog.css"><link rel="stylesheet" href="/blog/assets/css/blog-platform.css"><link rel="stylesheet" href="/assets/css/top-level-page-ui-refresh.css">
<script src="/assets/js/components/navbar.min.js" defer></script><script src="/assets/js/components/footer.min.js" defer></script>
<script type="application/ld+json">${JSON.stringify(articleSchema)}</script>
<script type="application/ld+json">${JSON.stringify(breadcrumb)}</script>
<script type="application/ld+json">${JSON.stringify(faqSchema)}</script>
</head>
<body class="top-level-page-ui-refresh">
<div class="reading-progress" id="readingProgress"></div><afro-navbar></afro-navbar>
<section class="article-hero"><div class="article-hero-inner"><nav class="breadcrumb" aria-label="Breadcrumb"><a href="${c.home}">${locale === 'en' ? 'Home' : locale === 'fr' ? 'Accueil' : 'Mwanzo'}</a> <span class="sep">&#8250;</span> <a href="${c.hub}">${locale === 'sw' ? 'Blogu' : 'Blog'}</a></nav><span class="category-badge">${esc(item.category)}</span><h1>${esc(item.title)}</h1><div class="article-meta-hero"><span>${c.team}</span><span class="dot"></span><time datetime="${modified}">${c.reviewed} ${reviewedLabel}</time><span class="dot"></span><span>${readMinutes} ${c.minutes}</span></div></div></section>
<div class="article-featured-img"><div class="article-featured-img-inner"><img width="600" height="400" src="/assets/img/tools/${topic.image}.webp" alt="${esc(item.imageAlt)}" loading="eager"></div></div>
<main class="article-layout"><nav class="article-toc" aria-label="${c.guide}"><div class="article-toc-title">${c.guide}</div><ol><li><a href="#quick-answer">${c.quick}</a></li><li><a href="#inputs">${c.inputs}</a></li><li><a href="#workflow">${c.steps}</a></li><li><a href="#checks">${c.checks}</a></li><li><a href="#sources">${c.sources}</a></li><li><a href="#faq">${c.faq}</a></li></ol></nav><article class="article-body">${body}</article></main>
<afro-footer></afro-footer><script src="/blog/assets/js/blog-reading.js" defer></script><script src="/assets/js/lazy-analytics.js" defer></script>
</body></html>
`;
}

function card(topic, locale) {
  const item = localized(topic, locale);
  return `<article class="article-card" data-locale="${locale}" data-cat="${esc(item.cardCategory)}"><a class="article-card-image" href="${routeFor(locale, item.slug)}"><img src="/assets/img/tools/${topic.image}.webp" alt="${esc(item.imageAlt)}" loading="lazy" width="400" height="240"></a><div class="article-card-body"><span class="category-badge">${esc(item.category)}</span><h3><a href="${routeFor(locale, item.slug)}">${esc(item.title)}</a></h3><p class="article-card-excerpt">${esc(item.description)}</p><span class="featured-read-more">${locale === 'en' ? 'Read the guide' : locale === 'fr' ? 'Lire le guide' : 'Soma mwongozo'} &#8594;</span></div></article>`;
}

function swCard(topic) {
  const item = localized(topic, 'sw');
  return `<a class="post-card" href="${routeFor('sw', item.slug)}"><div class="post-thumb">SW</div><div class="post-body"><div class="post-meta"><span class="post-tag">${esc(item.category)}</span><span class="post-date">Ago 2026</span></div><h3 class="post-title">${esc(item.title)}</h3><p class="post-desc">${esc(item.description)}</p><span class="post-link">Soma mwongozo &#8594;</span></div></a>`;
}

function existingEnglishCard(item) {
  return `<article class="article-card" data-locale="en" data-cat="${esc(item.cardCategory)}"><a class="article-card-image" href="/blog/${item.slug}/"><img src="/assets/img/tools/${item.image}.webp" alt="${esc(item.title)}" loading="lazy" width="400" height="240"></a><div class="article-card-body"><span class="category-badge">${esc(item.category)}</span><h3><a href="/blog/${item.slug}/">${esc(item.title)}</a></h3><p class="article-card-excerpt">${esc(item.description)}</p><span class="featured-read-more">Read the guide &#8594;</span></div></article>`;
}

function expectedFrenchManifest(current) {
  const rows = data.topics.map((topic) => {
    const item = localized(topic, 'fr');
    return { slug: item.slug, category: item.category, description: item.description, image: topic.image, published: data.published };
  });
  const replacements = new Map(rows.map((row) => [row.slug, row]));
  const existingSlugs = new Set(current.articles.map((row) => row.slug));
  const additions = rows.filter((row) => !existingSlugs.has(row.slug)).sort((a, b) => a.slug.localeCompare(b.slug));
  return { ...current, articles: [...additions, ...current.articles.map((row) => replacements.get(row.slug) || row)] };
}

function renderReport() {
  const rows = data.topics.map((topic, index) => `| ${index + 1} | ${topic.locales.en.keyword} | ${topic.locales.fr.keyword} | ${topic.locales.sw.keyword} | ${topic.intent} | ${topic.image} |`).join('\n');
  return `# Multilingual blog keyword wave, August 2026\n\nGenerated from \`data/content/blog-multilingual-wave-2026-08.json\`.\n\n## Scope\n\n- Ten new search-intent clusters.\n- Thirty publishable pages: English, French and Swahili for each cluster.\n- Selection is based on live-tool fit and a repository-wide duplicate-title check. It is a prioritisation hypothesis, not a traffic or ranking promise.\n- Every language version has a canonical URL, reciprocal EN/FR/SW hreflang links, Article, Breadcrumb and FAQ structured data, and a direct tool handoff.\n\n| # | English keyword | French keyword | Swahili keyword | Search job | Existing image |\n| ---: | --- | --- | --- | --- | --- |\n${rows}\n\n## Editorial controls\n\nThe articles avoid fixed fees, tariff values, visa promises, grading assumptions and legal guarantees. Readers are directed to verify changing requirements with the receiving institution, utility, immigration authority or qualified adviser. Existing tool artwork is reused, so this wave adds no unlicensed media.\n`;
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

for (const topic of data.topics) for (const locale of ['en', 'fr', 'sw']) {
  const item = localized(topic, locale);
  sync(fileFor(locale, item.slug), renderArticle(topic, locale));
}

for (const locale of ['en', 'sw']) {
  const hubFile = locale === 'en' ? 'blog/index.html' : 'sw/blogu/index.html';
  const hub = fs.readFileSync(path.join(root, hubFile), 'utf8');
  if (locale === 'sw' && hub.includes('content="scripts/build-localized-blog-hubs.js"')) {
    if (!write) {
      const missingRoutes = data.topics
        .map((topic) => routeFor('sw', localized(topic, 'sw').slug))
        .filter((route) => !hub.includes(`href="${route}"`));
      if (missingRoutes.length) {
        mismatches += 1;
        console.error(`out of date: ${hubFile} is missing ${missingRoutes.join(', ')}`);
      }
    }
    continue;
  }
  const [start, end] = HUB_MARKERS[locale];
  const cards = locale === 'en'
    ? [...data.topics.map((topic) => card(topic, locale)), ...data.existingEnglishHubCards.map(existingEnglishCard)]
    : data.topics.map(swCard);
  sync(hubFile, replaceBlock(hub, start, end, cards.join('\n'), locale === 'en' ? 'blog-grid' : 'posts-grid'));
}

const frenchManifest = JSON.parse(fs.readFileSync(frenchManifestPath, 'utf8'));
sync('data/localization/fr-blog-manifest.json', `${JSON.stringify(expectedFrenchManifest(frenchManifest), null, 2)}\n`);
sync('reports/blog-multilingual-wave-2026-08.md', renderReport());

if (mismatches && !write) process.exitCode = 1;
console.log(`${write ? 'built' : 'checked'} ${data.topics.length * 3} multilingual blog pages; ${mismatches} file(s) ${write ? 'updated' : 'out of date'}`);
