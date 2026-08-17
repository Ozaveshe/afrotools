#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { writeFileSyncWithRetry } = require('./lib/safe-write');

const ROOT = path.resolve(__dirname, '..');
const PAGE_REL = 'fr/blog/mobile-money-fees-africa-compared/index.html';
const BODY_REL = 'lang/pages/blog/mobile-money-fees-africa-compared/fr.body.html';
const PAGE_PATH = path.join(ROOT, PAGE_REL);
const BODY_PATH = path.join(ROOT, BODY_REL);
const WRITE = process.argv.includes('--write');

const TITLE = 'Frais mobile money en Afrique : comparatif 2026 | AfroTools';
const DESCRIPTION = 'Comparez les frais mobile money par pays à partir des grilles officielles Orange Money, MTN MoMo, Airtel Money et M-PESA vérifiées en août 2026.';
const OG_TITLE = 'Frais mobile money en Afrique : comparatif 2026';
const OG_DESCRIPTION = 'Comparatif par pays fondé sur les grilles officielles Orange Money, MTN MoMo, Airtel Money et M-PESA.';
const CANONICAL = 'https://afrotools.com/fr/blog/mobile-money-fees-africa-compared/';

function replaceRequired(html, pattern, replacement, label) {
  if (!pattern.test(html)) throw new Error(`Missing ${label}`);
  pattern.lastIndex = 0;
  return html.replace(pattern, replacement);
}

function setMeta(html, attribute, value, content) {
  const escaped = value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = new RegExp(`<meta\\s+${attribute}=["']${escaped}["']\\s+content=["'][^"']*["']\\s*\\/?\\s*>`, 'i');
  const tag = `<meta ${attribute}="${value}" content="${content}">`;
  if (pattern.test(html)) return html.replace(pattern, tag);
  return html.replace('</head>', `${tag}\n</head>`);
}

function findMatchingClosingTag(html, openStart, tagName) {
  const escaped = tagName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const tagPattern = new RegExp(`<\\/?${escaped}\\b[^>]*>`, 'gi');
  const openingPattern = new RegExp(`^<${escaped}\\b`, 'i');
  tagPattern.lastIndex = openStart;
  let depth = 0;
  let match;
  while ((match = tagPattern.exec(html))) {
    if (openingPattern.test(match[0])) depth += 1;
    else if (--depth === 0) return match.index;
  }
  return -1;
}

function replaceClassContent(html, className, content) {
  const openingTagPattern = /<([a-z][\w:-]*)\b[^>]*>/gi;
  let match;
  while ((match = openingTagPattern.exec(html))) {
    const classMatch = match[0].match(/\bclass=(["'])(.*?)\1/i);
    if (!classMatch || !classMatch[2].split(/\s+/).includes(className)) continue;
    const contentStart = match.index + match[0].length;
    const closeStart = findMatchingClosingTag(html, match.index, match[1]);
    if (closeStart < contentStart) throw new Error(`Unclosed .${className}`);
    return `${html.slice(0, contentStart)}\n${content.trim()}\n${html.slice(closeStart)}`;
  }
  throw new Error(`Missing .${className}`);
}

function schemaScript(value) {
  return `<script type="application/ld+json">${JSON.stringify(value)}</script>`;
}

function replaceJsonLd(html, types, value) {
  const acceptedTypes = Array.isArray(types) ? types : [types];
  const pattern = /<script\s+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let replaced = false;
  const output = html.replace(pattern, (full, body) => {
    if (replaced) return full;
    let parsed = null;
    try { parsed = JSON.parse(body.trim()); } catch (_) { /* keep unrelated malformed data */ }
    if (!parsed || !acceptedTypes.includes(parsed['@type'])) return full;
    replaced = true;
    return schemaScript(value);
  });
  if (!replaced) throw new Error(`Missing ${acceptedTypes.join('/')} JSON-LD`);
  return output;
}

function transform(source) {
  const body = fs.readFileSync(BODY_PATH, 'utf8').trim();
  let html = source;

  html = replaceRequired(html, /<title>[\s\S]*?<\/title>/i, `<title>${TITLE}</title>`, 'title');
  html = setMeta(html, 'name', 'description', DESCRIPTION);
  html = setMeta(html, 'property', 'og:title', OG_TITLE);
  html = setMeta(html, 'property', 'og:description', OG_DESCRIPTION);
  html = setMeta(html, 'name', 'twitter:title', OG_TITLE);
  html = setMeta(html, 'name', 'twitter:description', OG_DESCRIPTION);
  html = setMeta(html, 'property', 'article:modified_time', '2026-08-16');
  html = setMeta(html, 'name', 'afrotools-source-owner', 'scripts/build-french-mobile-money-editorial.js');
  html = setMeta(html, 'name', 'content-language', 'fr');
  html = setMeta(html, 'name', 'afrotools-content-id', 'blog:fr:706924defe7edd');
  html = html.replace(/(["'])\/fr\/blog\/assets\//g, '$1/blog/assets/');

  if (!html.includes('/blog/assets/css/blog-platform.css')) {
    html = html.replace(
      /(<link rel="stylesheet" href="\/blog\/assets\/css\/blog\.css[^>]*>)/i,
      '$1\n<link rel="stylesheet" href="/blog/assets/css/blog-platform.css?v=e61e94a2">'
    );
  }

  html = replaceJsonLd(html, ['Article', 'BlogPosting'], {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: 'Frais mobile money en Afrique : comparatif par pays',
    description: DESCRIPTION,
    inLanguage: 'fr',
    author: { '@type': 'Organization', name: 'AfroTools', url: 'https://afrotools.com/' },
    publisher: {
      '@type': 'Organization',
      name: 'AfroTools',
      url: 'https://afrotools.com/',
      logo: { '@type': 'ImageObject', url: 'https://afrotools.com/assets/img/logo-mark.svg' }
    },
    datePublished: '2026-03-10',
    dateModified: '2026-08-16',
    mainEntityOfPage: CANONICAL,
    image: 'https://afrotools.com/assets/img/tools/mobile-money-fees.webp'
  });

  html = replaceJsonLd(html, 'FAQPage', {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'Quel service mobile money est le moins cher en Afrique ?',
        acceptedAnswer: { '@type': 'Answer', text: 'Aucun opérateur n’est le moins cher partout. Il faut comparer le pays, le montant, le réseau du destinataire, le type d’opération, les taxes et la date de la grille.' }
      },
      {
        '@type': 'Question',
        name: 'MTN MoMo est-il moins cher qu’Airtel Money ?',
        acceptedAnswer: { '@type': 'Answer', text: 'Cela dépend du pays et de la tranche. En Ouganda, les grilles officielles vérifiées affichent les mêmes frais de base pour plusieurs petites tranches ; les taxes et d’autres opérations peuvent différer.' }
      },
      {
        '@type': 'Question',
        name: 'Comment vérifier les frais avant un retrait ?',
        acceptedAnswer: { '@type': 'Answer', text: 'Consultez la grille officielle de l’opérateur dans le bon pays, puis contrôlez le montant affiché dans l’application ou le menu USSD avant de saisir votre code secret.' }
      },
      {
        '@type': 'Question',
        name: 'Peut-on comparer les frais dans des monnaies différentes ?',
        acceptedAnswer: { '@type': 'Answer', text: 'Une conversion donne un ordre de grandeur, mais elle ne suffit pas pour classer les opérateurs : le pouvoir d’achat, les taxes, les tranches et le taux de change varient.' }
      }
    ]
  });

  html = replaceJsonLd(html, 'BreadcrumbList', {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Accueil', item: 'https://afrotools.com/fr/' },
      { '@type': 'ListItem', position: 2, name: 'Blog', item: 'https://afrotools.com/fr/blog/' },
      { '@type': 'ListItem', position: 3, name: 'Frais mobile money en Afrique', item: CANONICAL }
    ]
  });

  html = replaceClassContent(html, 'breadcrumb', `
    <a href="/fr/">Accueil</a> <span class="sep">&rsaquo;</span>
    <a href="/fr/blog/">Blog</a> <span class="sep">&rsaquo;</span>
    Frais mobile money
  `);
  html = replaceRequired(html, /<span class="category-badge category-badge--currency">[\s\S]*?<\/span>/i, '<span class="category-badge category-badge--currency">Mobile money</span>', 'category badge');
  html = replaceRequired(html, /<h1>[\s\S]*?<\/h1>/i, '<h1>Frais mobile money en Afrique : comparatif par pays</h1>', 'h1');
  html = replaceClassContent(html, 'article-meta-hero', `
    <span>Par l’équipe AfroTools</span>
    <span class="dot"></span>
    <span>Mis à jour le 16 août 2026</span>
    <span class="dot"></span>
    <span>9 min de lecture</span>
  `);
  html = replaceClassContent(html, 'article-meta', `
    <span>Équipe AfroTools</span>
    <span class="dot"></span>
    <span>Publié le 10 mars 2026</span>
    <span class="dot"></span>
    <span class="last-updated">Mis à jour le 16 août 2026</span>
    <span class="dot"></span>
    <span>9 min de lecture</span>
  `);
  html = html.replace(/alt="Mobile Money Fees Comparison"/i, 'alt="Comparaison des frais mobile money par pays"');
  html = replaceClassContent(html, 'article-body', body);

  html = replaceClassContent(html, 'related-articles', `
    <h2 class="related-articles-title">Guides associés</h2>
    <div class="related-grid">
      <a class="related-card" href="/fr/blog/frais-orange-money-guide-2026/">
        <span class="category-badge category-badge--currency">Mobile money</span>
        <h3>Frais Orange Money 2026 par pays</h3>
        <p>Grilles officielles pour le Cameroun, le Sénégal, le Mali et la Côte d’Ivoire.</p>
      </a>
      <a class="related-card" href="/fr/blog/wave-vs-orange-money-senegal-2026/">
        <span class="category-badge category-badge--currency">Sénégal</span>
        <h3>Wave ou Orange Money au Sénégal</h3>
        <p>Points à vérifier avant de choisir un portefeuille ou un retrait.</p>
      </a>
      <a class="related-card" href="/fr/blog/frais-transfert-argent-senegal/">
        <span class="category-badge category-badge--currency">Transfert</span>
        <h3>Frais de transfert d’argent au Sénégal</h3>
        <p>Comparez frais, change et montant reçu avant l’envoi.</p>
      </a>
    </div>
  `);

  html = replaceClassContent(html, 'author-box', `
    <div class="author-box-avatar">AT</div>
    <div class="author-box-info">
      <h4>Équipe AfroTools</h4>
      <p>Nous construisons des outils pratiques et des guides sourcés pour les décisions du quotidien en Afrique.</p>
    </div>
  `);

  html = replaceClassContent(html, 'faq-section', `
    <h2 class="faq-section-title">Questions fréquentes</h2>
    <details class="faq-item">
      <summary>Quel service mobile money est le moins cher en Afrique ?</summary>
      <div class="faq-answer"><p>Aucun opérateur n’est le moins cher partout. Comparez le pays, le montant, le réseau, l’opération, les taxes et la date de la grille.</p></div>
    </details>
    <details class="faq-item">
      <summary>MTN MoMo est-il moins cher qu’Airtel Money ?</summary>
      <div class="faq-answer"><p>Cela dépend du pays et de la tranche. En Ouganda, plusieurs petites tranches officielles ont les mêmes frais de base ; d’autres opérations et les taxes peuvent différer.</p></div>
    </details>
    <details class="faq-item">
      <summary>Comment vérifier les frais avant un retrait ?</summary>
      <div class="faq-answer"><p>Consultez la grille officielle du bon pays, puis contrôlez le coût affiché dans l’application ou le menu USSD avant de saisir votre code secret.</p></div>
    </details>
    <details class="faq-item">
      <summary>Peut-on comparer des frais dans des monnaies différentes ?</summary>
      <div class="faq-answer"><p>Une conversion donne un ordre de grandeur, mais elle ne suffit pas pour classer les opérateurs : pouvoir d’achat, taxes, tranches et taux de change varient.</p></div>
    </details>
  `);

  html = replaceClassContent(html, 'seo-cluster-shell', `
    <div class="seo-cluster seo-cluster--article" data-seo-cluster="/blog/mobile-money-fees-africa-compared/">
      <div class="seo-cluster__inner">
        <div class="seo-cluster__eyebrow">Comparer avec les sources</div>
        <h2 class="seo-cluster__title">Vérifiez le pays, l’opération et la tranche</h2>
        <div class="seo-cluster__answer">
          <span class="seo-cluster__answer-label">Réponse rapide</span>
          <p>Les frais publiés varient selon le pays, l’opérateur, le montant et l’opération. Un retrait et un envoi ne doivent pas être comparés comme s’il s’agissait du même service.</p>
        </div>
        <div class="seo-cluster__grid">
          <div class="seo-cluster__card seo-cluster__card--cta">
            <span class="seo-cluster__kicker">Utiliser l’outil</span>
            <h3 class="seo-cluster__card-title">Comparer des frais mobile money</h3>
            <p>Obtenez une estimation uniquement lorsqu’une combinaison est reliée à une grille officielle.</p>
            <a class="seo-cluster__cta" href="/fr/tools/frais-mobile-money/">Ouvrir le calculateur</a>
          </div>
          <div class="seo-cluster__card">
            <h3>Guides utiles</h3>
            <ul class="seo-cluster__list">
              <li><a href="/fr/blog/frais-orange-money-guide-2026/"><span class="seo-cluster__item-title">Tarifs Orange Money</span><span class="seo-cluster__item-reason">Quatre pays, quatre grilles officielles.</span></a></li>
              <li><a href="/fr/blog/wave-vs-orange-money-senegal-2026/"><span class="seo-cluster__item-title">Wave ou Orange Money</span><span class="seo-cluster__item-reason">Comparaison centrée sur le Sénégal.</span></a></li>
            </ul>
          </div>
          <div class="seo-cluster__card">
            <h3>Contrôle final</h3>
            <ul class="seo-cluster__list">
              <li><span class="seo-cluster__item-title">Vérifiez la date</span><span class="seo-cluster__item-reason">Une ancienne grille peut rester visible dans les résultats de recherche.</span></li>
              <li><span class="seo-cluster__item-title">Lisez le récapitulatif</span><span class="seo-cluster__item-reason">Ne confirmez pas si le coût affiché diffère.</span></li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  `);
  html = html.replace(/aria-label="Helpful suivant steps"/i, 'aria-label="Étapes utiles"');

  if (/data-explicit-language-fallback|\slang="en"/.test(html)) {
    throw new Error('English fallback marker remains on the French mobile-money guide');
  }
  return html;
}

const current = fs.readFileSync(PAGE_PATH, 'utf8');
const expected = transform(current);

if (current === expected) {
  console.log(`French mobile-money editorial surface is current: ${PAGE_REL}`);
  process.exit(0);
}

if (!WRITE) {
  console.error(`STALE ${PAGE_REL}`);
  process.exit(1);
}

writeFileSyncWithRetry(PAGE_PATH, expected, 'utf8');
console.log(`Updated source-backed French mobile-money editorial surface: ${PAGE_REL}`);
