const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const BLOG_DIR = path.join(ROOT, 'blog');
const OUTPUT_DIR = path.join(ROOT, 'output');
const OUTPUT_JSON = path.join(OUTPUT_DIR, 'blog-audit.json');
const OUTPUT_MD = path.join(OUTPUT_DIR, 'blog-audit.md');
const CURRENT_YEAR = 2026;

const AI_TERMS = [
  'delve',
  'landscape',
  'crucial',
  'vital',
  'pivotal',
  'leverage',
  'robust',
  'comprehensive',
  'holistic',
  'foster',
  'facilitate',
  'navigate',
  'ensure',
  'utilize',
  'furthermore',
  'moreover',
  'innovative',
  'cutting-edge',
  'seamless',
  'empower',
  'streamline',
  'cultivate',
  'in conclusion',
  'in summary'
];

const HEDGING_TERMS = [
  'it is important to note',
  "it's important to note",
  'it is worth mentioning',
  "it's worth mentioning",
  'in many cases',
  'in most cases',
  'results may vary',
  'one might argue',
  'there are many',
  'it can be argued'
];

const FACT_KEYWORDS = [
  'tax',
  'duty',
  'rate',
  'salary',
  'fees',
  'cost',
  'import',
  'registration',
  'allowance',
  'vat',
  'paye',
  'uif',
  'interest',
  'bank',
  'today',
  '2026'
];

const OFFICIAL_PATTERNS = [
  /\.gov(?:\.[a-z]{2})?/i,
  /sars\.gov\.za/i,
  /cbn\.gov\.ng/i,
  /customs\.gov\.ng/i,
  /kra\.go\.ke/i,
  /gra\.gov\.gh/i,
  /firs\.gov\.ng/i,
  /ura\.go\.ug/i,
  /tra\.go\.tz/i,
  /bank/i
];

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function read(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function stripHtml(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&ndash;|&#8211;/g, '-')
    .replace(/&mdash;|&#8212;/g, '--')
    .replace(/&rsquo;|&#8217;/g, "'")
    .replace(/&lsquo;|&#8216;/g, "'")
    .replace(/&ldquo;|&#8220;/g, '"')
    .replace(/&rdquo;|&#8221;/g, '"')
    .replace(/&#8358;/g, 'NGN ')
    .replace(/&#8373;/g, 'GHS ')
    .replace(/\s+/g, ' ')
    .trim();
}

function matchFirst(raw, regex) {
  const match = raw.match(regex);
  return match ? match[1].trim() : '';
}

function countMatches(text, phraseList) {
  const lower = text.toLowerCase();
  return phraseList.reduce((total, phrase) => {
    const regex = new RegExp(`\\b${escapeRegExp(phrase)}\\b`, 'gi');
    const matches = lower.match(regex);
    return total + (matches ? matches.length : 0);
  }, 0);
}

function countBadEncoding(raw) {
  const badPatterns = [
    /\u00c3\u0192/g,
    /\u00c3\u00a2\u00e2\u201a\u00ac/g,
    /\u00c2(?:\u00a0|\u00a3|\u00a9|\u00ae|\u00b0|\u00b7)/g,
    /\uFFFD/g
  ];

  return badPatterns.reduce((count, pattern) => count + ((raw.match(pattern) || []).length), 0);
}

function wordCount(text) {
  const words = text.match(/\b[\w'-]+\b/g);
  return words ? words.length : 0;
}

function extractLinks(raw) {
  const links = [];
  const regex = /href="([^"]+)"/gi;
  let match;
  while ((match = regex.exec(raw)) !== null) {
    links.push(match[1]);
  }
  return links;
}

function isExternalLink(href) {
  return /^https?:\/\//i.test(href) && !/afrotools\.com/i.test(href);
}

function countOfficialLinks(links) {
  return links.filter((href) => OFFICIAL_PATTERNS.some((pattern) => pattern.test(href))).length;
}

function slugToTopic(slug, title) {
  const text = `${slug} ${title}`.toLowerCase();
  return FACT_KEYWORDS.some((keyword) => text.includes(keyword));
}

function extractBodyHtml(raw) {
  const candidates = [
    /<(?:article|div)\b[^>]*class="[^"]*\barticle-body\b[^"]*"[^>]*>([\s\S]*?)<\/(?:article|div)>/i,
    /<article\b[^>]*class="[^"]*\bcar-import-section\b[^"]*"[^>]*>([\s\S]*?)<\/article>/i,
    /<article\b[^>]*class="[^"]*\bblog-post\b[^"]*"[^>]*>([\s\S]*?)<\/article>/i,
    /<main\b[^>]*>([\s\S]*?)<\/main>/i,
    /<body\b[^>]*>([\s\S]*?)<\/body>/i
  ];

  for (const pattern of candidates) {
    const body = matchFirst(raw, pattern);
    if (body) return body;
  }

  return '';
}

function extractReadTime(raw) {
  const match = raw.match(/(\d+)\s*min read/i);
  return match ? Number(match[1]) : 0;
}

function extractCards(raw) {
  const cards = [];
  const regex = /<article class="article-card"[\s\S]*?<\/article>/gi;
  let match;
  while ((match = regex.exec(raw)) !== null) {
    const block = match[0];
    const href = matchFirst(block, /<h3>\s*<a href="([^"]+)"/i);
    const title = stripHtml(matchFirst(block, /<h3>([\s\S]*?)<\/h3>/i));
    const excerpt = stripHtml(matchFirst(block, /<p class="article-card-excerpt">([\s\S]*?)<\/p>/i));
    const image = matchFirst(block, /<img\b[^>]*\bsrc="([^"]+)"/i);
    const category = matchFirst(block, /data-cat="([^"]+)"/i);
    cards.push({ href, title, excerpt, image, category });
  }
  return cards;
}

function parseHub() {
  const hubPath = path.join(BLOG_DIR, 'index.html');
  const raw = read(hubPath);
  const cards = extractCards(raw);
  const featuredCount = (raw.match(/class="featured-card"/g) || []).length;
  const defaultImageCards = cards.filter((card) => card.image.includes('og-default')).length;
  const categoryCounts = cards.reduce((acc, card) => {
    acc[card.category] = (acc[card.category] || 0) + 1;
    return acc;
  }, {});

  return {
    path: hubPath,
    totalCards: cards.length,
    featuredCount,
    defaultImageCards,
    categoryCounts,
    cards
  };
}

function parsePost(filePath) {
  const raw = read(filePath);
  const relativePath = path.relative(ROOT, filePath).replace(/\\/g, '/');
  const slug = relativePath.replace(/^blog\//, '').replace(/\/index\.html$/, '');
  const title = stripHtml(matchFirst(raw, /<h1[^>]*>([\s\S]*?)<\/h1>/i) || matchFirst(raw, /<title>([\s\S]*?)<\/title>/i));
  const description = matchFirst(raw, /<meta name="description" content="([^"]*)"/i);
  const ogImage = matchFirst(raw, /<meta property="og:image" content="([^"]+)"/i);
  const featuredImage = matchFirst(raw, /<div class="article-featured-img"[\s\S]*?<img src="([^"]+)"/i);
  const bodyHtml = extractBodyHtml(raw);
  const bodyText = stripHtml(bodyHtml);
  const words = wordCount(bodyText);
  const expectedReadTime = Math.max(1, Math.ceil(words / 220));
  const declaredReadTime = extractReadTime(raw);
  const links = extractLinks(raw);
  const externalLinks = links.filter(isExternalLink);
  const officialLinks = countOfficialLinks(externalLinks);
  const aiHits = countMatches(bodyText, AI_TERMS);
  const hedgeHits = countMatches(bodyText, HEDGING_TERMS);
  const badEncodingHits = countBadEncoding(raw);
  const isRedirect = /<meta\b[^>]*http-equiv=["']refresh["']/i.test(raw)
    || /\b(?:window\.)?location\.(?:replace|assign)\s*\(/i.test(raw)
    || /\bthis article now lives\b|\bredirecting\b/i.test(title);
  const defaultImage = [ogImage, featuredImage].some((value) => value.includes('og-default'));
  const factHeavy = slugToTopic(slug, title);
  const staleRisk = /\btoday\b/i.test(slug) || /\btoday\b/i.test(title);
  const missingSources = !isRedirect && factHeavy && officialLinks === 0 && externalLinks.length === 0;
  const readTimeMismatch = declaredReadTime > 0 ? Math.abs(declaredReadTime - expectedReadTime) : 0;

  let qualityScore = 100;
  qualityScore -= Math.min(aiHits * 2, 20);
  qualityScore -= Math.min(hedgeHits * 2, 12);
  qualityScore -= defaultImage ? 12 : 0;
  qualityScore -= badEncodingHits > 0 ? 12 : 0;
  qualityScore -= missingSources ? 14 : 0;
  qualityScore -= staleRisk && officialLinks === 0 ? 10 : 0;
  qualityScore -= readTimeMismatch >= 4 ? 6 : 0;
  qualityScore = Math.max(0, qualityScore);

  let priority = 0;
  priority += defaultImage ? 3 : 0;
  priority += missingSources ? 4 : 0;
  priority += staleRisk ? 3 : 0;
  priority += badEncodingHits > 0 ? 3 : 0;
  priority += aiHits >= 8 ? 2 : aiHits >= 4 ? 1 : 0;
  priority += readTimeMismatch >= 4 ? 1 : 0;

  return {
    path: relativePath,
    slug,
    title,
    description,
    isRedirect,
    ogImage,
    featuredImage,
    defaultImage,
    wordCount: words,
    declaredReadTime,
    expectedReadTime,
    readTimeMismatch,
    externalLinks: externalLinks.length,
    officialLinks,
    aiHits,
    hedgeHits,
    badEncodingHits,
    staleRisk,
    missingSources,
    qualityScore,
    priority
  };
}

function getPostFiles() {
  return fs
    .readdirSync(BLOG_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && entry.name !== 'assets')
    .map((entry) => path.join(BLOG_DIR, entry.name, 'index.html'))
    .filter((filePath) => fs.existsSync(filePath));
}

function average(values) {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function buildMarkdown(summary) {
  const lines = [];
  lines.push('# Blog Audit');
  lines.push('');
  lines.push(`Generated: ${new Date().toISOString()}`);
  lines.push('');
  lines.push('## Summary');
  lines.push(`- Posts audited: ${summary.totalPosts}`);
  lines.push(`- Hub cards: ${summary.hub.totalCards} (${summary.hub.defaultImageCards} still using default imagery before cleanup)`);
  lines.push(`- Posts using default images: ${summary.defaultImagePosts}`);
  lines.push(`- Posts with no external sources on fact-heavy topics: ${summary.missingSourcesPosts}`);
  lines.push(`- Posts with obvious encoding issues: ${summary.badEncodingPosts}`);
  lines.push(`- Average quality score: ${summary.averageQualityScore.toFixed(1)}/100`);
  lines.push(`- Average word count: ${Math.round(summary.averageWordCount)}`);
  lines.push(`- Average AI-pattern hits: ${summary.averageAiHits.toFixed(1)}`);
  lines.push('');
  lines.push('## Category Counts');
  Object.entries(summary.hub.categoryCounts)
    .sort((a, b) => b[1] - a[1])
    .forEach(([category, count]) => {
      lines.push(`- ${category}: ${count}`);
    });
  lines.push('');
  lines.push('## Highest-Priority Posts');
  summary.topPriority.forEach((post) => {
    lines.push(`- ${post.slug}: score ${post.qualityScore}, priority ${post.priority}, defaultImage=${post.defaultImage}, missingSources=${post.missingSources}, aiHits=${post.aiHits}, badEncoding=${post.badEncodingHits}`);
  });
  lines.push('');
  lines.push('## Notes');
  lines.push(`- "Missing sources" means a fact-heavy post had no outbound sources at all. It does not automatically mean the content is wrong, but it does mean trust is weaker.`);
  lines.push(`- "Priority" is a practical cleanup signal, not an editorial grade.`);
  return `${lines.join('\n')}\n`;
}

function main() {
  const hub = parseHub();
  const routes = getPostFiles().map(parsePost);
  const posts = routes.filter((post) => !post.isRedirect);

  const summary = {
    generatedAt: new Date().toISOString(),
    totalPosts: posts.length,
    totalRoutes: routes.length,
    redirectCount: routes.length - posts.length,
    hub: {
      totalCards: hub.totalCards,
      featuredCount: hub.featuredCount,
      defaultImageCards: hub.defaultImageCards,
      categoryCounts: hub.categoryCounts
    },
    defaultImagePosts: posts.filter((post) => post.defaultImage).length,
    missingSourcesPosts: posts.filter((post) => post.missingSources).length,
    badEncodingPosts: posts.filter((post) => post.badEncodingHits > 0).length,
    staleRiskPosts: posts.filter((post) => post.staleRisk).length,
    averageQualityScore: average(posts.map((post) => post.qualityScore)),
    averageWordCount: average(posts.map((post) => post.wordCount)),
    averageAiHits: average(posts.map((post) => post.aiHits)),
    topPriority: posts
      .slice()
      .sort((a, b) => {
        if (b.priority !== a.priority) return b.priority - a.priority;
        return a.qualityScore - b.qualityScore;
      })
      .slice(0, 20),
    posts
  };

  ensureDir(OUTPUT_DIR);
  fs.writeFileSync(OUTPUT_JSON, JSON.stringify(summary, null, 2));
  fs.writeFileSync(OUTPUT_MD, buildMarkdown(summary));

  console.log(`Audited ${summary.totalPosts} blog posts.`);
  console.log(`Hub cards: ${summary.hub.totalCards}`);
  console.log(`Posts with default images: ${summary.defaultImagePosts}`);
  console.log(`Fact-heavy posts with no outbound sources: ${summary.missingSourcesPosts}`);
  console.log(`Audit written to ${path.relative(ROOT, OUTPUT_JSON)}`);
}

main();
