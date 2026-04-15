const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const SITE = 'https://afrotools.com';

const TARGETS = [
  'angola',
  'benin',
  'botswana',
  'burkina-faso',
  'cameroon',
  'central-african-republic',
  'chad',
  'comoros',
  'cote-divoire',
  'djibouti',
  'egypt',
  'equatorial-guinea',
  'eritrea',
  'eswatini',
  'ethiopia',
  'gabon',
  'ghana',
  'guinea',
  'lesotho',
  'madagascar',
  'malawi',
  'mali',
  'mauritius',
  'morocco',
  'mozambique',
  'namibia',
  'niger',
  'nigeria',
  'sao-tome',
  'senegal',
  'seychelles',
  'south-africa',
  'togo',
  'zambia',
  'zimbabwe',
];

function read(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function write(filePath, content) {
  fs.writeFileSync(filePath, content, 'utf8');
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function ensure(value, label, filePath) {
  if (!value) {
    throw new Error(`Missing ${label} in ${filePath}`);
  }
  return value;
}

function matchOne(html, regex) {
  const match = html.match(regex);
  return match ? match[1].trim() : '';
}

function matchAll(html, regex) {
  return [...html.matchAll(regex)].map((match) => match[1].trim());
}

function matchMetaContent(html, attr) {
  const regex = new RegExp(`<meta\\s+${escapeRegExp(attr)}\\s+content="([^"]*)"\\s*\\/?>`);
  const match = html.match(regex);
  return match ? match[1].trim() : '';
}

function stripTags(value) {
  return value
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function decodeEntities(value) {
  return value
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&middot;/g, '·')
    .replace(/&mdash;/g, '—')
    .replace(/&ndash;/g, '–')
    .replace(/&rsquo;/g, "'")
    .replace(/&lsquo;/g, "'")
    .replace(/&ldquo;/g, '"')
    .replace(/&rdquo;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"');
}

function cleanSentence(value) {
  return decodeEntities(stripTags(value)).replace(/\s+/g, ' ').trim();
}

function relToPosix(filePath) {
  return path.relative(ROOT, filePath).replace(/\\/g, '/');
}

function readGitHead(filePath) {
  try {
    return execFileSync('git', ['show', `HEAD:${relToPosix(filePath)}`], {
      cwd: ROOT,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    });
  } catch (error) {
    return '';
  }
}

function urlToSource(url) {
  const raw = url.replace(SITE, '').replace(/^\/+/, '');
  if (!raw) return null;
  const trimmed = raw.replace(/\/+$/, '');
  if (!trimmed) return path.join(ROOT, 'index.html');
  if (fs.existsSync(path.join(ROOT, raw))) {
    return path.join(ROOT, raw);
  }
  if (fs.existsSync(path.join(ROOT, trimmed))) {
    return path.join(ROOT, trimmed);
  }
  if (fs.existsSync(path.join(ROOT, `${trimmed}.html`))) {
    return path.join(ROOT, `${trimmed}.html`);
  }
  if (fs.existsSync(path.join(ROOT, trimmed, 'index.html'))) {
    return path.join(ROOT, trimmed, 'index.html');
  }
  return null;
}

function extractJsonLd(html, type) {
  const blocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
  for (const block of blocks) {
    if (block[1].includes(`"@type":"${type}"`) || block[1].includes(`"@type": "${type}"`)) {
      return `<script type="application/ld+json">\n${block[1].trim()}\n</script>`;
    }
  }
  return '';
}

function extractCanonical(html) {
  return matchOne(html, /<link rel="canonical" href="([^"]+)"\s*\/?>/);
}

function extractAlternateLinks(html) {
  return [...html.matchAll(/<link rel="alternate" hreflang="([^"]+)" href="([^"]+)"\s*\/?>/g)].map(
    (match) => ({
      hreflang: match[1].trim(),
      href: match[2].trim(),
    }),
  );
}

function buildAlternateLinks(swCanonical, enCanonical, enAlternates) {
  const entries = new Map();
  const order = [];

  const upsert = (hreflang, href) => {
    if (!hreflang || !href) return;
    const normalizedHref = href.replace(/\/+$/, '/') || href;
    if (!entries.has(hreflang)) {
      order.push(hreflang);
    }
    entries.set(hreflang, normalizedHref);
  };

  for (const alt of enAlternates) {
    if (alt.hreflang === 'sw') continue;
    upsert(alt.hreflang, alt.href);
  }

  upsert('en', enCanonical);
  upsert('sw', swCanonical);
  upsert('x-default', entries.get('x-default') || enCanonical);

  const preferredOrder = ['en', 'fr', 'sw', 'x-default'];
  const finalOrder = [
    ...preferredOrder.filter((hreflang) => entries.has(hreflang)),
    ...order.filter((hreflang) => !preferredOrder.includes(hreflang) && entries.has(hreflang)),
  ];

  return finalOrder.map(
    (hreflang) => `<link rel="alternate" hreflang="${hreflang}" href="${entries.get(hreflang)}">`,
  );
}

function extractHero(swHtml) {
  return {
    breadcrumb: matchOne(swHtml, /<nav class="breadcrumb"[^>]*>([\s\S]*?)<\/nav>/),
    flag: matchOne(swHtml, /<div class="hero-flag">([\s\S]*?)<\/div>/),
    title: matchOne(swHtml, /<h1(?: class="hero-h1")?>([\s\S]*?)<\/h1>/),
    sub: matchOne(swHtml, /<p class="hero-sub">([\s\S]*?)<\/p>/),
    badges: matchOne(swHtml, /<div class="hero-badges">([\s\S]*?)<\/div>/),
    meta:
      matchOne(swHtml, /<p class="hero-meta">([\s\S]*?)<\/p>/) ||
      matchOne(swHtml, /<p style="font-size:0\.78rem[^"]*">([\s\S]*?)<\/p>/),
  };
}

function extractCountryName(swHtml, swRel) {
  const breadcrumbMatch = swHtml.match(
    /<nav class="breadcrumb"[^>]*>[\s\S]*?<a href="\/sw\/">[\s\S]*?<\/a>\s*\/\s*<a href="\/sw\/[^"]+\/">([\s\S]*?)<\/a>/,
  );
  if (breadcrumbMatch) return cleanSentence(breadcrumbMatch[1]);
  const title = matchOne(swHtml, /<title>([\s\S]*?)<\/title>/);
  const countryMatch = title.match(/Kikokotoo cha Kodi ya Mshahara\s+(.+?)\s+\d/);
  if (countryMatch) return countryMatch[1].trim();
  return swRel.split('/')[1];
}

function extractGuide(swHtml) {
  const title =
    matchOne(swHtml, /<section class="seo-sec">[\s\S]*?<h2 class="seo-title">([\s\S]*?)<\/h2>/) ||
    matchOne(swHtml, /<section class="sec">[\s\S]*?<h2 class="sec-title">([\s\S]*?)<\/h2>/);
  const body =
    matchOne(swHtml, /<div class="seo-body">([\s\S]*?)<\/div>\s*<div class="faq-list">/) ||
    matchOne(swHtml, /<div class="content-body">([\s\S]*?)<\/div>\s*<div class="back-links">/) ||
    matchOne(swHtml, /<div class="content-body">([\s\S]*?)<\/div>/);

  const blocks = body.match(/<(?:h2|h3|p)[^>]*>[\s\S]*?<\/(?:h2|h3|p)>/g) || [];
  return { title, blocks };
}

function extractFaq(swHtml) {
  const items = [];
  const faqMatch = swHtml.match(/<div class="faq-list">([\s\S]*?)<\/div>\s*<(?:div class="back-links"|\/section>)/);
  const source = faqMatch ? faqMatch[1] : swHtml;

  for (const match of source.matchAll(/<div class="faq-item">[\s\S]*?<div class="faq-q">([\s\S]*?)<\/div>[\s\S]*?<div class="faq-a">([\s\S]*?)<\/div>[\s\S]*?<\/div>/g)) {
    const question = match[1].replace(/\s*<span>.*?<\/span>\s*/g, '').trim();
    const answer = match[2].trim();
    items.push({ question, answer });
  }

  return items;
}

function extractSummary(swHtml) {
  const facts = [];

  for (const match of swHtml.matchAll(/<div class="info-card">[\s\S]*?<div class="info-card-label">([\s\S]*?)<\/div>[\s\S]*?<div class="info-card-value">([\s\S]*?)<\/div>[\s\S]*?<div class="info-card-note">([\s\S]*?)<\/div>/g)) {
    facts.push({
      label: cleanSentence(match[1]),
      value: cleanSentence(match[2]),
      note: cleanSentence(match[3]),
    });
  }

  if (!facts.length) {
    for (const match of swHtml.matchAll(/<div class="stat-item">[\s\S]*?<div class="stat-val">([\s\S]*?)<\/div>[\s\S]*?<div class="stat-lbl">([\s\S]*?)<\/div>/g)) {
      facts.push({
        label: cleanSentence(match[2]),
        value: cleanSentence(match[1]),
        note: '',
      });
    }
  }

  return facts.slice(0, 4);
}

function styleGuideBlock(block) {
  if (block.startsWith('<h2') || block.startsWith('<h3')) {
    return block.replace(
      /<h[23][^>]*>/,
      '<h3 style="font-size:0.96rem;font-weight:800;color:#0f172a;line-height:1.4;margin-bottom:0.6rem;">',
    ).replace(/<\/h[23]>/, '</h3>');
  }
  if (block.startsWith('<p')) {
    return block.replace(
      /<p[^>]*>/,
      '<p style="font-size:0.85rem;color:#475569;line-height:1.72;margin-bottom:0;">',
    );
  }
  return block;
}

function buildGuideSection(guideTitle, blocks) {
  const safeTitle = guideTitle || 'Mwongozo wa Kodi ya Mshahara';
  const styledBlocks = blocks.map(styleGuideBlock);
  const midpoint = Math.ceil(styledBlocks.length / 2);
  const left = styledBlocks.slice(0, midpoint);
  const right = styledBlocks.slice(midpoint);

  const renderColumn = (items) =>
    items
      .map((block) => `        <div class="ng-guide-card">\n          ${block}\n        </div>`)
      .join('\n');

  return `<!-- SW GUIDE -->\n<section class="ng-guide-sec">\n  <div class="container">\n    <div class="ng-guide-header">\n      <h2 class="ng-guide-title">${safeTitle}</h2>\n    </div>\n    <div class="ng-guide-grid">\n      <div class="ng-guide-col">\n${renderColumn(left)}\n      </div>\n      <div class="ng-guide-col">\n${renderColumn(right)}\n      </div>\n    </div>\n  </div>\n</section>`;
}

function buildFaqSection(countryName, items) {
  const midpoint = Math.ceil(items.length / 2);
  const left = items.slice(0, midpoint);
  const right = items.slice(midpoint);

  const renderColumn = (column, openFirst) =>
    column
      .map((item, index) => {
        const openAttr = openFirst && index === 0 ? ' open' : '';
        return `        <details class="ng-faq-item"${openAttr}>\n          <summary>${item.question}</summary>\n          <p>${item.answer}</p>\n        </details>`;
      })
      .join('\n');

  return `<!-- SW FAQ -->\n<section class="ng-faq-sec">\n  <div class="container">\n    <div class="ng-faq-header">\n      <span class="eyebrow">${countryName} Maswali ya Kodi</span>\n      <h2 class="ng-faq-title">Maswali ya Kawaida ya PAYE</h2>\n    </div>\n    <div class="ng-faq-grid">\n      <div class="ng-faq-col">\n${renderColumn(left, true)}\n      </div>\n      <div class="ng-faq-col">\n${renderColumn(right, false)}\n      </div>\n    </div>\n  </div>\n</section>`;
}

function buildUpdateBar(heroSub, facts) {
  if (facts.length) {
    const summary = facts
      .map((fact) => {
        const note = fact.note ? ` — ${fact.note}` : '';
        return `${fact.label}: <strong>${fact.value}</strong>${note}`;
      })
      .join('; ');
    return `<p><strong>Muhtasari:</strong> ${summary}.</p>`;
  }
  const cleanHeroSub = cleanSentence(heroSub);
  return `<p><strong>Muhtasari:</strong> ${cleanHeroSub}</p>`;
}

function replaceSection(html, className, replacement) {
  const regex = new RegExp(`<section class="${escapeRegExp(className)}">[\\s\\S]*?<\\/section>`);
  return regex.test(html) ? html.replace(regex, replacement) : html;
}

function replaceFirst(html, regex, replacement, label, filePath) {
  if (!regex.test(html)) {
    throw new Error(`Missing ${label} in ${filePath}`);
  }
  return html.replace(regex, replacement);
}

function swapMeta(html, name, content) {
  const regex = new RegExp(`<meta\\s+${escapeRegExp(name)}\\s+content="[^"]*"\\s*\\/?>`);
  return regex.test(html) ? html.replace(regex, `<meta ${name} content="${content}">`) : html;
}

function normalizeSwLocale(locale) {
  if (!locale) return 'sw_KE';
  if (/^sw_[A-Z]{2}$/.test(locale)) return locale;
  const countryCodeMatch = locale.match(/^[a-z]{2}_([A-Z]{2})$/);
  return countryCodeMatch ? `sw_${countryCodeMatch[1]}` : 'sw_KE';
}

function replaceJsonLdByType(html, type, replacement) {
  const pattern = new RegExp(
    `<script type="application\\/ld\\+json">[\\s\\S]*?"@type"\\s*:\\s*"${escapeRegExp(type)}"[\\s\\S]*?<\\/script>`,
  );
  return pattern.test(html) ? html.replace(pattern, replacement) : html.replace(/<\/head>/, `${replacement}\n</head>`);
}

function buildFaqJson(items) {
  const json = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: cleanSentence(item.question),
      acceptedAnswer: {
        '@type': 'Answer',
        text: cleanSentence(item.answer),
      },
    })),
  };

  return `<script type="application/ld+json">\n${JSON.stringify(json)}\n</script>`;
}

function translateMonthNames(value) {
  return value
    .replace(/\bJan\b/g, 'Jan')
    .replace(/\bJanuary\b/g, 'Januari')
    .replace(/\bFeb\b/g, 'Feb')
    .replace(/\bFebruary\b/g, 'Februari')
    .replace(/\bMar\b/g, 'Machi')
    .replace(/\bMarch\b/g, 'Machi')
    .replace(/\bApr\b/g, 'Aprili')
    .replace(/\bApril\b/g, 'Aprili')
    .replace(/\bMay\b/g, 'Mei')
    .replace(/\bJun\b/g, 'Juni')
    .replace(/\bJune\b/g, 'Juni')
    .replace(/\bJul\b/g, 'Julai')
    .replace(/\bJuly\b/g, 'Julai')
    .replace(/\bAug\b/g, 'Agosti')
    .replace(/\bAugust\b/g, 'Agosti')
    .replace(/\bSep\b/g, 'Septemba')
    .replace(/\bSept\b/g, 'Septemba')
    .replace(/\bSeptember\b/g, 'Septemba')
    .replace(/\bOct\b/g, 'Oktoba')
    .replace(/\bOctober\b/g, 'Oktoba')
    .replace(/\bNov\b/g, 'Novemba')
    .replace(/\bNovember\b/g, 'Novemba')
    .replace(/\bDec\b/g, 'Desemba')
    .replace(/\bDecember\b/g, 'Desemba');
}

function buildAiCard(countryName) {
  return `      <div class="ai-card">
        <div class="ai-head">
          <div class="ai-dot"></div>
          <span class="ai-head-title">Mshauri wa Kodi wa AI</span>
          <span class="ai-head-by">Imeendeshwa na Claude</span>
        </div>
        <div class="ai-body">
          <p class="ai-status" id="aiStatus">Kokotoa mshahara wako kwanza &mdash; nitachambua hali yako ya kodi ya ${countryName} na kukupa mapendekezo ya vitendo.</p>
          <div class="ai-response" id="aiResp"></div>
          <button class="ai-btn" id="aiBtn" onclick="getAI()" disabled>Kokotoa kwanza ili kufungua &rarr;</button>
          <div class="ai-chat" id="aiChat">
            <div class="chat-msgs" id="chatMsgs"></div>
            <div class="chat-row">
              <input class="chat-in" id="chatIn" placeholder="Uliza swali la kufuatilia..." onkeydown="if(event.key==='Enter')sendChat()">
              <button class="chat-send" onclick="sendChat()">&rarr;</button>
            </div>
          </div>
        </div>
      </div>`;
}

function buildSaveSection(countryName) {
  return `<section class="ng-save-sec">
  <div class="container">
    <div class="ng-save-card">
      <div class="ng-save-left">
        <div class="ng-save-icon">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
        </div>
        <div>
          <h3 class="ng-save-title">Hifadhi kikokotoo hiki</h3>
          <p class="ng-save-desc">Weka alama ya PAYE ya ${countryName} kwenye dashibodi yako binafsi ili uifikie haraka wakati wowote.</p>
        </div>
      </div>
      <div class="ng-save-actions">
        <button class="ng-save-btn" id="inlineSaveBtn" onclick="toggleSaveTool()">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
          Hifadhi kwenye Zana Zangu
        </button>
        <button class="ng-save-btn ng-save-btn-ghost" onclick="typeof shareCalc==='function'?shareCalc():navigator.share?.({title:document.title,url:location.href})">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
          Shiriki
        </button>
      </div>
    </div>
  </div>
</section>`;
}

function applyStructuralTranslations(html, countryName) {
  let result = html;

  result = result.replace(
    /(<button class="calc-btn"[^>]*>)[\s\S]*?(<\/button>)/,
    '$1Kokotoa Mshahara Halisi &rarr;$2',
  );
  result = result.replace(
    /(<span class="slider-label">)[\s\S]*?(<\/span>)/,
    '$1Mshahara Ghafi wa Mwaka$2',
  );
  result = result.replace(
    /(<div class="res-hero-label">)[\s\S]*?(<\/div>)/,
    '$1Mshahara Halisi kwa Mwaka$2',
  );
  result = result.replace(
    /(<div class="res-hero-period">)[\s\S]*?(<\/div>)/,
    '$1Baada ya PAYE$2',
  );
  result = result.replace(
    /(<button class="act-btn act-pdf"[^>]*>[\s\S]*?<\/svg>\s*)[\s\S]*?(\s*<\/button>)/,
    '$1Pakua PDF$2',
  );
  result = result.replace(
    /(<button class="act-btn act-share"[^>]*>[\s\S]*?<\/svg>\s*)[\s\S]*?(\s*<\/button>)/,
    '$1Shiriki Matokeo$2',
  );
  result = result.replace(
    /<!-- AI ADVISOR -->[\s\S]*?(<!-- [\s\S]*?TAX BANDS -->)/,
    `<!-- AI ADVISOR -->\n${buildAiCard(countryName)}\n\n$1`,
  );
  result = result.replace(
    /<div class="disclaimer">[\s\S]*?<\/div>/,
    `      <div class="disclaimer">\n        <strong>Kanusho:</strong> Kwa madhumuni ya taarifa tu. Si ushauri rasmi wa kodi au kisheria. Thibitisha viwango vya sasa na mamlaka husika au mshauri wa kodi mwenye sifa wa ${countryName}.\n      </div>`,
  );
  result = result.replace(
    /(<div id="modalForm">[\s\S]*?<h3>)[\s\S]*?(<\/h3>)/,
    '$1📄 Pakua Muhtasari wako wa PAYE$2',
  );
  result = result.replace(
    /(<div id="modalForm">[\s\S]*?<p[^>]*>)[\s\S]*?(<\/p>)/,
    `$1Ingiza barua pepe yako ili upate PDF yenye maelezo — tutakujulisha viwango vya kodi vya ${countryName} vikibadilika.$2`,
  );
  result = result.replace(
    /(<button class="modal-cancel"[^>]*>)[\s\S]*?(<\/button>)/,
    '$1Hapana, asante$2',
  );
  result = result.replace(
    /(<button onclick="closePdfModal\(\)"[^>]*aria-label=")[^"]*(")/,
    '$1Funga$2',
  );
  result = result.replace(
    /(<div class="modal-success"[\s\S]*?<h4>)[\s\S]*?(<\/h4>)/,
    '$1PDF inafunguliwa sasa$2',
  );
  result = result.replace(
    /(<div class="modal-success"[\s\S]*?<p>)[\s\S]*?(<\/p>)/,
    '$1Bofya <strong>Save as PDF</strong> kwenye dirisha la kuchapisha.$2',
  );
  result = result.replace(
    /(<div class="modal-success"[\s\S]*?<button class="modal-submit"[^>]*>)[\s\S]*?(<\/button>)/,
    '$1Sawa &rarr;$2',
  );
  result = replaceSection(result, 'ng-save-sec', buildSaveSection(countryName));
  result = result.replace(
    /(<span class="tool-info-updated">)([\s\S]*?)(<\/span>)/,
    (match, open, text, close) => `${open}${translateMonthNames(text)}${close}`,
  );

  return result;
}

function applyCommonTranslations(html) {
  let result = html;

  const exactPairs = [
    ['Skip to main content', 'Ruka hadi maudhui makuu'],
    ['Enter Your Details', 'Weka Taarifa Zako'],
    ['Or type exact annual amount', 'Au andika kiasi halisi cha mwaka'],
    ['Or type exact amount', 'Au andika kiasi halisi'],
    ['Before any deductions', 'Kabla ya makato yoyote'],
    ['Download PDF', 'Pakua PDF'],
    ['Share Result', 'Shiriki Matokeo'],
    ['Annual Bands', 'Mabanda ya Mwaka'],
    ['Monthly Bands', 'Mabanda ya Mwezi'],
    ['Tax Bands', 'Mabanda ya Kodi'],
    ['Employer Cost', 'Gharama ya Mwajiri'],
    ['Common PAYE Questions', 'Maswali ya Kawaida ya PAYE'],
    ['Save to My Tools', 'Hifadhi kwenye Zana Zangu'],
    ['Sign in to Save', 'Ingia ili Uhifadhi'],
    ['Sign in to save this calculator', 'Ingia ili kuhifadhi kikokotoo hiki'],
    ['Create a free account to bookmark tools, track calculations, and access your dashboard.', 'Fungua akaunti ya bure ili kuhifadhi zana, kufuatilia mahesabu, na kufikia dashibodi yako.'],
    ['Powered by Claude', 'Imeendeshwa na Claude'],
    ['AI Tax Advisor', 'Mshauri wa Kodi wa AI'],
    ['All Countries', 'Nchi Zote'],
    ['Tax &amp; Finance', 'Kodi na Fedha'],
    ['Calculations', 'Mahesabu'],
    ['Rating', 'Ukadiriaji'],
    ['Free', 'Bure'],
    ['Forever', 'Daima'],
    ['PDF Export', 'PDF'],
    ['Annual Take-Home Pay', 'Mshahara Halisi kwa Mwaka'],
    ['Monthly Take-Home Pay', 'Mshahara Halisi kwa Mwezi'],
    ['Take-Home Pay', 'Mshahara Halisi'],
    ['Annual Gross Salary', 'Mshahara Ghafi wa Mwaka'],
    ['Gross Salary', 'Mshahara Ghafi'],
    ['Effective Tax Rate', 'Kiwango Halisi cha Kodi'],
    ['Total Deductions', 'Jumla ya Makato'],
    ['Medical tax credit', 'Mkopo wa Kodi ya Matibabu'],
    ['Medical Tax Credits', 'Mikopo ya Kodi ya Matibabu'],
    ['Total Employer Cost', 'Jumla ya Gharama ya Mwajiri'],
    ['For informational purposes only.', 'Kwa madhumuni ya taarifa tu.'],
    ['Not professional tax or legal advice.', 'Si ushauri rasmi wa kodi au kisheria.'],
    ['Not professional tax advice.', 'Si ushauri rasmi wa kodi.'],
    ['Net Pay Calc', 'Hesabu ya Mshahara Halisi'],
    ['AI Advisor', 'Mshauri wa AI'],
    ['Deductions', 'Makato'],
    ['Includes AI Advisor', 'Inajumuisha Mshauri wa AI'],
    ['No Mandatory Pension', 'Hakuna Pensheni ya Lazima'],
    ['No Mandatory Social Security', 'Hakuna Hifadhi ya Jamii ya Lazima'],
    ['Save this calculator', 'Hifadhi kikokotoo hiki'],
    ['Your name (optional)', 'Jina lako (hiari)'],
    ['Your email address', 'Barua pepe yako'],
    ['Also see:', 'Tazama pia:'],
    ['Last verified:', 'Ilithibitishwa mwisho:'],
    ['Last updated:', 'Imesasishwa mwisho:'],
    ['Updated: ', 'Imesasishwa: '],
    ['No thanks', 'Hapana, asante'],
    ['PDF opening now', 'PDF inafunguliwa sasa'],
    ['Done →', 'Sawa →'],
    ['Done &rarr;', 'Sawa &rarr;'],
    ['PAYE Calculator', 'Kikokotoo cha PAYE'],
    ['PAYE Tax', 'Kodi ya PAYE'],
    ['Employer Contributions', 'Michango ya Mwajiri'],
    ['Amount', 'Kiasi'],
    ['Take-Home', 'Halisi'],
    ['on excess above', 'kwa kinachozidi'],
    ['exempt', 'msamaha'],
    ['Above ', 'Zaidi ya '],
    ['Verified', 'Imethibitishwa'],
  ];

  for (const [from, to] of exactPairs) {
    result = result.split(from).join(to);
  }

  const regexPairs = [
    [/>\s*Breakdown\s*</g, '>Muhtasari<'],
    [/>\s*Annual\s*</g, '>Kwa Mwaka<'],
    [/>\s*Monthly\s*</g, '>Kwa Mwezi<'],
    [/>\s*Gross &rarr; Net\s*</g, '>Ghafi &rarr; Halisi<'],
    [/>\s*Net &rarr; Gross\s*</g, '>Halisi &rarr; Ghafi<'],
    [/>\s*Share\s*</g, '>Shiriki<'],
    [/placeholder="Ask a follow-up[^"]*"/g, 'placeholder="Uliza swali la kufuatilia..."'],
    [/Calculate salary to unlock ([^.]+?) tax analysis\./g, 'Kokotoa mshahara ili kufungua uchambuzi wa kodi wa $1.'],
    [/Calculate first to unlock analysis\./g, 'Kokotoa kwanza ili kufungua uchambuzi.'],
    [/Calculate your salary first for personalised Ghana tax advice\./g, 'Kokotoa mshahara wako kwanza ili upate ushauri wa kodi wa Ghana unaokufaa.'],
    [/Calculate your salary first &mdash; then I'll analyse your position, show legal ways to reduce your tax, and tell you which regime wins for you\./g, 'Kokotoa mshahara wako kwanza &mdash; kisha nitachambua hali yako, kukuonyesha njia za kisheria za kupunguza kodi yako, na kukuambia mpango gani unakufaa zaidi.'],
    [/Calculate your salary first/g, 'Kokotoa mshahara wako kwanza'],
    [/I'll analyse/g, 'nitachambua'],
    [/show legal ways to reduce your tax/g, 'nitaonyesha njia za kisheria za kupunguza kodi yako'],
    [/provide optimisation tips for/g, 'na kutoa vidokezo vya kuboresha kodi kwa'],
    [/give specific optimisation tips for/g, 'na kutoa vidokezo maalum vya kuboresha kodi kwa'],
    [/explain/g, 'kueleza'],
    [/Enter your annual gross salary\. Monthly equivalent shown in slider\./g, 'Ingiza mshahara wako ghafi wa mwaka. Kiasi cha mwezi kinaonyeshwa kwenye slaida.'],
    [/Enter your monthly gross salary\./g, 'Ingiza mshahara wako ghafi wa mwezi.'],
    [/Adjust with slider for quick estimates\./g, 'Rekebisha kwa slaida ili upate makadirio ya haraka.'],
    [/No mandatory employee contributions\./g, 'Hakuna michango ya lazima ya mfanyakazi.'],
    [/This calculator shows the standard payroll case with PAYE as the only automatic deduction; approved superannuation relief may apply separately when claimed under BURS rules\./g, 'Kikokotoo hiki kinaonyesha hali ya kawaida ya payroll ambapo PAYE ndiyo punguzo la moja kwa moja pekee; unafuu wa pensheni uliokubaliwa unaweza kutumika kando ukidaiwa chini ya sheria za BURS.'],
    [/Calculated annually on gross income for the standard payroll case\./g, 'Imehesabiwa kwa mwaka kwa mapato ghafi katika hali ya kawaida ya payroll.'],
    [/Approved superannuation deductions may apply separately when properly claimed\./g, 'Makato ya pensheni yaliyoidhinishwa yanaweza kutumika kando yakidaiwa ipasavyo.'],
    [/Calculated annually on taxable income/gi, 'Imehesabiwa kwa mwaka kwa mapato yanayotozwa kodi'],
    [/Calculated monthly on taxable income/gi, 'Imehesabiwa kwa mwezi kwa mapato yanayotozwa kodi'],
    [/Tax-free threshold/gi, 'Kizingiti kisichotozwa kodi'],
    [/deductible from taxable income/gi, 'unakubaliwa kama punguzo kutoka mapato yanayotozwa kodi'],
    [/additional cost shown in employer chart/gi, 'ni gharama ya ziada inayoonyeshwa kwenye chati ya mwajiri'],
    [/additional cost to employer/gi, 'ni gharama ya ziada kwa mwajiri'],
    [/No mandatory employer contributions in ([^.]+)\. Employer cost equals gross salary\./g, 'Hakuna michango ya lazima ya mwajiri nchini $1. Gharama ya mwajiri ni sawa na mshahara ghafi.'],
    [/My ([^`]+?) PAYE breakdown:/g, 'Muhtasari wa PAYE wa $1:'],
    [/My ([^`]+?) tax breakdown:/g, 'Muhtasari wa kodi wa $1:'],
    [/My ([^`]+?) salary breakdown:/g, 'Muhtasari wa mshahara wa $1:'],
    [/Take-home/g, 'Halisi'],
    [/Plain English summary/gi, 'Muhtasari wa wazi kwa Kiswahili'],
    [/effective rate/gi, 'kiwango halisi'],
    [/Calculated at/gi, 'Imehesabiwa kwenye'],
    [/Analysing…/g, 'Inachambua...'],
    [/Plain-English summary/gi, 'muhtasari wa wazi kwa Kiswahili'],
    [/No markdown, no asterisks, no dashes as bullets\./g, 'Jibu kwa Kiswahili. Bila markdown, nyota, au vistari vya orodha.'],
    [/No markdown, no asterisks\./g, 'Jibu kwa Kiswahili. Bila markdown wala nyota.'],
    [/No markdown, no bullet symbols, no asterisks\./g, 'Jibu kwa Kiswahili. Bila markdown, alama za orodha, wala nyota.'],
    [/No markdown\./g, 'Jibu kwa Kiswahili. Bila markdown.'],
    [/Give:\s*/g, 'Toa: '],
    [/Under (\d+) words/gi, 'Chini ya maneno $1'],
    [/Two specific legal ways to reduce [^.]+/gi, 'Njia mbili maalum za kisheria za kupunguza kodi'],
    [/Two ways to optimize [^.]+/gi, 'Njia mbili za kuboresha mpango wa kodi'],
    [/One [^.]+ compliance point/gi, 'Jambo moja muhimu la uzingatiaji'],
    [/One thing most [^.]+ misunderstand/gi, 'Jambo moja ambalo wafanyakazi wengi hulielewa vibaya'],
    [/Unable to generate analysis\./g, 'Imeshindikana kutengeneza uchambuzi.'],
    [/Unable to respond\./g, 'Imeshindikana kujibu.'],
    [/Network error\. Please try again\./g, 'Hitilafu ya mtandao. Tafadhali jaribu tena.'],
    [/AI analysis temporarily unavailable\./g, 'Uchambuzi wa AI haupatikani kwa sasa.'],
  ];

  for (const [pattern, text] of regexPairs) {
    result = result.replace(pattern, text);
  }

  return result;
}

function buildSwFromRich(swHtml, swPath, enPath) {
  const enHtml = read(enPath);
  const swRel = relToPosix(swPath);

  const title = ensure(matchOne(swHtml, /<title>([\s\S]*?)<\/title>/), 'title', swRel);
  const description = ensure(matchMetaContent(swHtml, 'name="description"'), 'description', swRel);
  const ogTitle = matchMetaContent(swHtml, 'property="og:title"') || title.replace(/\s+\|\s+AfroTools$/, '');
  const ogDescription = matchMetaContent(swHtml, 'property="og:description"') || description;
  const ogLocale = normalizeSwLocale(
    matchMetaContent(swHtml, 'property="og:locale"') || matchMetaContent(enHtml, 'property="og:locale"'),
  );
  const twitterTitle = ogTitle;
  const twitterDescription = ogDescription;

  const swCanonical = extractCanonical(swHtml);
  const enCanonical = extractCanonical(enHtml);
  const alternateLinks = buildAlternateLinks(swCanonical, enCanonical, extractAlternateLinks(enHtml));
  const hero = extractHero(swHtml);
  const countryName = extractCountryName(swHtml, swRel);
  const guide = extractGuide(swHtml);
  const faqItems = extractFaq(swHtml);
  const facts = extractSummary(swHtml);
  const webAppJson = extractJsonLd(swHtml, 'WebApplication');
  const breadcrumbJson = extractJsonLd(swHtml, 'BreadcrumbList');
  const faqJson = faqItems.length ? buildFaqJson(faqItems) : extractJsonLd(swHtml, 'FAQPage');

  let html = enHtml;

  html = html.replace(/<html([^>]*)lang="en"/, '<html$1lang="sw"');
  html = html.replace(/<html([^>]*)lang='en'/, "<html$1lang='sw'");
  html = swapMeta(html, 'name="description"', description);
  html = swapMeta(html, 'property="og:title"', ogTitle);
  html = swapMeta(html, 'property="og:description"', ogDescription);
  html = swapMeta(html, 'property="og:locale"', ogLocale);
  html = swapMeta(html, 'property="og:url"', swCanonical);
  html = swapMeta(html, 'name="twitter:title"', twitterTitle);
  html = swapMeta(html, 'name="twitter:description"', twitterDescription);
  html = replaceFirst(html, /<title>[\s\S]*?<\/title>/, `<title>${title}</title>`, 'en title', swRel);

  html = replaceFirst(
    html,
    /<link rel="canonical" href="[^"]+"\s*\/?>/,
    `<link rel="canonical" href="${swCanonical}">`,
    'canonical',
    swRel,
  );
  html = html.replace(/\s*<link rel="alternate" hreflang="[^"]+" href="[^"]+"\s*\/?>/g, '');
  if (alternateLinks.length) {
    const insertion = alternateLinks.join('\n');
    if (/<meta\s+property="og:locale"\s+content="[^"]*"\s*\/?>/.test(html)) {
      html = html.replace(/(<meta\s+property="og:locale"\s+content="[^"]*"\s*\/?>)/, `$1\n${insertion}`);
    } else if (/<meta\s+property="og:description"\s+content="[^"]*"\s*\/?>/.test(html)) {
      html = html.replace(/(<meta\s+property="og:description"\s+content="[^"]*"\s*\/?>)/, `$1\n${insertion}`);
    } else {
      html = html.replace(/<\/head>/, `${insertion}\n</head>`);
    }
  }

  if (webAppJson) {
    html = replaceJsonLdByType(html, 'WebApplication', webAppJson);
  }
  if (breadcrumbJson) {
    html = replaceJsonLdByType(html, 'BreadcrumbList', breadcrumbJson);
  }
  if (faqJson) {
    html = replaceJsonLdByType(html, 'FAQPage', faqJson);
  }

  if (hero.breadcrumb) {
    if (/<nav class="breadcrumb"[\s\S]*?<\/nav>/.test(html)) {
      html = html.replace(
        /<nav class="breadcrumb"[\s\S]*?<\/nav>/,
        `<nav class="breadcrumb" aria-label="Njia ya kurudi">${hero.breadcrumb}</nav>`,
      );
    } else if (/<div class="tool-hero-inner">/.test(html)) {
      html = html.replace(
        /<div class="tool-hero-inner">/,
        `<div class="tool-hero-inner">\n    <nav class="breadcrumb" aria-label="Njia ya kurudi">${hero.breadcrumb}</nav>`,
      );
    }
  }
  if (hero.flag) {
    html = html.replace(/(<div class="hero-flag">)([\s\S]*?)(<\/div>)/, `$1${hero.flag}$3`);
  }
  if (hero.title) {
    if (/<h1[^>]*>[\s\S]*?<\/h1>/.test(html)) {
      html = html.replace(/(<h1[^>]*>)[\s\S]*?(<\/h1>)/, `$1${hero.title}$2`);
    }
  }
  if (hero.sub) {
    if (/<p class="tool-hero-sub">[\s\S]*?<\/p>|<p class="hero-sub">[\s\S]*?<\/p>/.test(html)) {
      html = html.replace(
        /<p class="tool-hero-sub">[\s\S]*?<\/p>|<p class="hero-sub">[\s\S]*?<\/p>/,
        `<p class="tool-hero-sub">${hero.sub}</p>`,
      );
    } else if (/<h1[^>]*>[\s\S]*?<\/h1>/.test(html)) {
      html = html.replace(/(<h1[^>]*>[\s\S]*?<\/h1>)/, `$1\n    <p class="tool-hero-sub">${hero.sub}</p>`);
    }
  }
  if (hero.badges) {
    if (/<div class="hero-badges">[\s\S]*?<\/div>/.test(html)) {
      html = html.replace(/<div class="hero-badges">[\s\S]*?<\/div>/, `<div class="hero-badges">${hero.badges}</div>`);
    } else if (/<p class="tool-hero-sub">[\s\S]*?<\/p>/.test(html)) {
      html = html.replace(/(<p class="tool-hero-sub">[\s\S]*?<\/p>)/, `$1\n    <div class="hero-badges">${hero.badges}</div>`);
    }
  }
  if (hero.meta) {
    if (/<p class="hero-meta">[\s\S]*?<\/p>|<p style="font-size:0\.8rem[^"]*">[\s\S]*?<\/p>/.test(html)) {
      html = html.replace(
        /<p class="hero-meta">[\s\S]*?<\/p>|<p style="font-size:0\.8rem[^"]*">[\s\S]*?<\/p>/,
        `<p class="hero-meta">${hero.meta}</p>`,
      );
    } else if (/<div class="hero-badges">[\s\S]*?<\/div>/.test(html)) {
      html = html.replace(/(<div class="hero-badges">[\s\S]*?<\/div>)/, `$1\n    <p class="hero-meta">${hero.meta}</p>`);
    }
  }

  if (/class="amendment-bar-inner"/.test(html)) {
    html = html.replace(
      /<div class="amendment-bar-inner">\s*<p>[\s\S]*?<\/p>\s*<\/div>/,
      `<div class="amendment-bar-inner">\n    ${buildUpdateBar(hero.sub, facts)}\n  </div>`,
    );
  }

  if (guide.blocks.length) {
    html = replaceSection(html, 'ng-guide-sec', buildGuideSection(guide.title, guide.blocks));
  }
  if (faqItems.length) {
    html = replaceSection(html, 'ng-faq-sec', buildFaqSection(countryName, faqItems));
  }

  html = applyCommonTranslations(html);
  html = applyStructuralTranslations(html, countryName);
  html = translateMonthNames(html);
  html = html.replace(/<html([^>]*)lang="sw"([^>]*)data-chat-bundle="[^"]+"/, '<html$1lang="sw"$2 data-chat-bundle="/assets/js/bundles/chat.aa4062f1.min.js"');
  html = html.replace(/\n{3,}/g, '\n\n');

  return html;
}

function resolveSwPage(countrySlug) {
  return path.join(ROOT, 'sw', countrySlug, 'kikokotoo-kodi-mshahara', 'index.html');
}

function resolveEnPageFromSw(swHtml, swPath) {
  const enHref = matchOne(swHtml, /<link rel="alternate" hreflang="en" href="([^"]+)"/);
  const enPath = urlToSource(enHref);
  if (!enPath || !fs.existsSync(enPath)) {
    throw new Error(`Unable to resolve EN source for ${relToPosix(swPath)} from ${enHref}`);
  }
  return enPath;
}

function run() {
  const only = process.argv[2] || '';
  const targets = TARGETS.filter((country) => !only || country === only);
  let changed = 0;

  for (const country of targets) {
    const swPath = resolveSwPage(country);
    if (!fs.existsSync(swPath)) {
      console.log(`SKIP ${country}: missing SW page`);
      continue;
    }

    let swHtml = read(swPath);
    if (/bundles\/tool-page|salary-benchmark|save-result-button|auto-email-gate\.js/.test(swHtml)) {
      const headVersion = readGitHead(swPath);
      if (headVersion) swHtml = headVersion;
    }
    const enPath = resolveEnPageFromSw(swHtml, swPath);
    const upgraded = buildSwFromRich(swHtml, swPath, enPath);

    if (upgraded !== swHtml) {
      write(swPath, upgraded);
      changed += 1;
      console.log(`UPDATED ${relToPosix(swPath)} <= ${relToPosix(enPath)}`);
    } else {
      console.log(`NOCHANGE ${relToPosix(swPath)}`);
    }
  }

  console.log(`\nDone. Updated ${changed} Swahili PAYE pages.`);
}

run();
