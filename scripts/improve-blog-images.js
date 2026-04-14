const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const BLOG_DIR = path.join(ROOT, 'blog');
const TOOLS_IMG_DIR = path.join(ROOT, 'assets', 'img', 'tools');
const SITE_ROOT = 'https://afrotools.com';

const ROUTE_IMAGE_MAP = {
  'ng-salary-tax': 'ng-paye',
  'ke-paye': 'ke-paye',
  'gh-paye': 'gh-paye',
  'za-paye': 'za-paye',
  'import-duty': 'import-duty',
  'currency-converter': 'currency-converter',
  'salary-compare': 'salary-compare',
  'job-offer-evaluator': 'job-offer-evaluator',
  'staff-cost': 'staff-cost',
  'budget-planner': 'budget-planner',
  'compound-interest': 'compound-interest',
  'flyer-maker': 'flyer-maker',
  'gpa-calculator': 'gpa-calculator',
  'thumbnail-maker': 'thumbnail-maker',
  'whatsapp-link': 'whatsapp-link',
  'mortgage-calculator': 'mortgage-calculator',
  'car-loan': 'car-loan',
  'rental-yield': 'rental-yield',
  'property-tax': 'property-tax',
  'cost-of-living': 'cost-of-living',
  'bmi-calculator': 'bmi-calculator',
  'boq-generator': 'boq-generator',
  'waec-calculator': 'waec-calculator',
  'pdf-editor': 'pdf-editor',
  'pdf-compress': 'pdf-compress',
  'pdf-ocr': 'pdf-ocr',
  'afrocuisine': 'afrokitchen',
  'afroprix': 'afroprices',
  'afroatlas': 'afroatlas'
};

const KEYWORD_IMAGE_MAP = [
  { match: ['domiciliary', 'diaspora'], image: 'diaspora-guide' },
  { match: ['send-money', 'remittance', 'hawala', 'money', 'transfert-argent'], image: 'remittance-compare' },
  { match: ['salary-negotiation'], image: 'salary-compare' },
  { match: ['gratuity', 'severance', 'staff-cost'], image: 'staff-cost' },
  { match: ['salary', 'payslip', 'average-salary', 'salary-after-tax'], image: 'salary-compare' },
  { match: ['salaire-net', 'salaires', 'irpp', 'impot-revenu', 'barème', 'francophone'], image: 'french-african' },
  { match: ['import-duty', 'afcfta', 'customs'], image: 'import-duty' },
  { match: ['car-import'], image: 'import-duty' },
  { match: ['budget', 'emergency-fund'], image: 'budget-planner' },
  { match: ['savings', 'compound-interest'], image: 'compound-interest' },
  { match: ['cost-of-living', 'rent'], image: 'cost-of-living' },
  { match: ['boq', 'construction-material'], image: 'boq-generator' },
  { match: ['gpa'], image: 'gpa-calculator' },
  { match: ['waec'], image: 'waec-calculator' },
  { match: ['thumbnail', 'youtube'], image: 'thumbnail-maker' },
  { match: ['whatsapp-link'], image: 'whatsapp-link' },
  { match: ['mortgage', 'house-can-i-afford'], image: 'mortgage-calculator' },
  { match: ['car-loan'], image: 'car-loan' },
  { match: ['rental-yield'], image: 'rental-yield' },
  { match: ['property-tax'], image: 'property-tax' },
  { match: ['bmi'], image: 'bmi-calculator' },
  { match: ['startup-funding'], image: 'startup-valuation' },
  { match: ['crypto-tax'], image: 'crypto-tax' },
  { match: ['crypto-scam'], image: 'crypto-tax-africa' },
  { match: ['bitcoin', 'stablecoin', 'usdt', 'usdc', 'p2p crypto'], image: 'crypto-tax-africa' },
  { match: ['event-flyer'], image: 'flyer-maker' },
  { match: ['json-formatter', 'developer-tools'], image: 'code-playground' },
  { match: ['crop-yield'], image: 'crop-yield-estimator' },
  { match: ['bride-price'], image: 'bride-price' },
  { match: ['lobola'], image: 'lobola-calculator' },
  { match: ['funeral'], image: 'burial-cost' },
  { match: ['wedding-cost'], image: 'bride-price' },
  { match: ['best-countries-business', 'doing-business', 'business in africa'], image: 'afroatlas' },
  { match: ['business-name'], image: 'business-name-gen' },
  { match: ['invoice'], image: 'invoice-generator' },
  { match: ['nysc', 'corps member'], image: 'budget-planner' },
  { match: ['paystack', 'charges', 'bank fees'], image: 'bank-charges' },
  { match: ['register-business-south-africa', 'cipc'], image: 'cipc-cost' },
  { match: ['register-business-nigeria', 'cac'], image: 'cac-cost' },
  { match: ['register-business-ghana', 'register-business-kenya', 'business registration', 'creation-entreprise'], image: 'business-plan' },
  { match: ['relocate', 'move to germany', 'visa'], image: 'visa-cost' },
  { match: ['stokvel', 'ajo', 'chama'], image: 'ajo-chama' },
  { match: ['vat'], image: 'vat-calculator' },
  { match: ['whatsapp-business'], image: 'whatsapp-link' }
];

function read(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function write(filePath, content) {
  fs.writeFileSync(filePath, content);
}

function existsImage(baseName) {
  for (const ext of ['.webp', '.svg', '.png']) {
    const candidate = path.join(TOOLS_IMG_DIR, `${baseName}${ext}`);
    if (fs.existsSync(candidate)) {
      return `/assets/img/tools/${baseName}${ext}`;
    }
  }
  return '';
}

function getCandidateFromHref(href) {
  const clean = href.replace(/^https?:\/\/[^/]+/i, '').replace(/^\/+|\/+$/g, '');
  const parts = clean.split('/').filter(Boolean);
  if (!parts.length) return '';
  const last = parts[parts.length - 1];
  const mapped = ROUTE_IMAGE_MAP[last];
  if (mapped) {
    return existsImage(mapped);
  }
  return existsImage(last);
}

function getImageFromKeywords(slug, title) {
  const haystack = `${slug} ${title}`.toLowerCase();
  for (const rule of KEYWORD_IMAGE_MAP) {
    if (rule.match.some((keyword) => haystack.includes(keyword))) {
      const image = existsImage(rule.image);
      if (image) return image;
    }
  }
  return '';
}

function findBestImage(raw, slug, title) {
  const hrefRegex = /href="([^"]+)"/gi;
  let match;
  while ((match = hrefRegex.exec(raw)) !== null) {
    const href = match[1];
    if (!href.startsWith('/')) continue;
    const candidate = getCandidateFromHref(href);
    if (candidate) return candidate;
  }
  return getImageFromKeywords(slug, title);
}

function updateMetaImage(raw, relativeImage) {
  const absoluteImage = `${SITE_ROOT}${relativeImage}`;
  return raw
    .replace(/(<meta property="og:image" content=")[^"]+(")/i, `$1${absoluteImage}$2`)
    .replace(/(<meta name="twitter:image" content=")[^"]+(")/i, `$1${absoluteImage}$2`)
    .replace(/("image"\s*:\s*")[^"]+(")/i, `$1${absoluteImage}$2`)
    .replace(/(<div class="article-featured-img"[\s\S]*?<img src=")[^"]+(")/i, `$1${relativeImage}$2`);
}

function normalizeImagePath(image) {
  if (!image) return '';
  return image.replace(new RegExp(`^${SITE_ROOT.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`), '');
}

function isDefaultImage(image) {
  return !image || image.includes('og-default');
}

function isUsableImage(image) {
  return Boolean(normalizeImagePath(image)) && !isDefaultImage(image);
}

function improvePostImage(filePath) {
  let raw = read(filePath);
  const slug = path.relative(BLOG_DIR, path.dirname(filePath)).replace(/\\/g, '/');
  const titleMatch = raw.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i) || raw.match(/<title>([\s\S]*?)<\/title>/i);
  const title = titleMatch ? titleMatch[1].replace(/<[^>]+>/g, ' ').trim() : slug;
  const currentOg = (raw.match(/<meta property="og:image" content="([^"]+)"/i) || [])[1] || '';
  const currentFeatured = (raw.match(/<div class="article-featured-img"[\s\S]*?<img src="([^"]+)"/i) || [])[1] || '';
  const needsImage = isDefaultImage(currentOg) || isDefaultImage(currentFeatured);
  if (!needsImage) {
    return { updated: false, image: currentFeatured || currentOg };
  }

  const existingImage = [currentFeatured, currentOg].find(isUsableImage);
  const replacement = normalizeImagePath(existingImage) || findBestImage(raw, slug, title);
  if (!replacement) {
    return { updated: false, image: currentFeatured || currentOg };
  }

  raw = updateMetaImage(raw, replacement);
  write(filePath, raw);
  return { updated: true, image: replacement };
}

function syncHubImages(postImages) {
  const hubPath = path.join(BLOG_DIR, 'index.html');
  let raw = read(hubPath);
  let updated = 0;

  raw = raw.replace(/<article class="article-card"[\s\S]*?<\/article>/gi, (block) => {
    const href = (block.match(/<h3>\s*<a href="(\/blog\/[^"]+\/)"/i) || [])[1];
    const currentImage = (block.match(/<img src="([^"]+)"/i) || [])[1];
    if (!href || !currentImage) {
      return block;
    }

    const slug = href.replace(/^\/blog\/|\/$/g, '');
    const replacement = postImages.get(slug);
    if (!replacement || replacement === currentImage) {
      return block;
    }

    updated += 1;
    return block.replace(/(<img src=")[^"]+(")/i, `$1${replacement}$2`);
  });

  write(hubPath, raw);
  return updated;
}

function main() {
  const postDirs = fs
    .readdirSync(BLOG_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && entry.name !== 'assets');

  const postImages = new Map();
  let updatedPosts = 0;

  for (const entry of postDirs) {
    const filePath = path.join(BLOG_DIR, entry.name, 'index.html');
    if (!fs.existsSync(filePath)) continue;
    const result = improvePostImage(filePath);
    const currentRaw = read(filePath);
    const finalImage = (currentRaw.match(/<div class="article-featured-img"[\s\S]*?<img src="([^"]+)"/i) || [])[1]
      || (currentRaw.match(/<meta property="og:image" content="https:\/\/afrotools\.com([^"]+)"/i) || [])[1]
      || result.image;
    if (finalImage) {
      postImages.set(entry.name, finalImage);
    }
    if (result.updated) {
      updatedPosts += 1;
    }
  }

  const updatedCards = syncHubImages(postImages);
  console.log(`Updated ${updatedPosts} post images.`);
  console.log(`Synced ${updatedCards} hub card images.`);
}

main();
