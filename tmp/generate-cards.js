const fs = require('fs');
const path = require('path');

// ── Config ──────────────────────────────────────────────────────
const REPO_ROOT = path.resolve(__dirname, '..');
const REGISTRY_PATH = path.join(REPO_ROOT, 'assets', 'js', 'components', 'tool-registry.js');
const OUTPUT_DIR = path.join(REPO_ROOT, 'assets', 'img', 'tools');

const EXISTING_WEBP = new Set([
  'ao-paye','bf-paye','bi-paye','bj-paye','bmi-calculator','bw-paye','cf-paye',
  'cg-paye','ci-paye','cm-paye','currency-converter','cv-builder','cv-paye',
  'dj-paye','dz-paye','eg-paye','er-paye','et-paye','fuel-cost','ga-paye',
  'gh-paye','gm-paye','gn-paye','gq-paye','gw-paye','image-compress',
  'import-duty','invoice-generator','japa-calculator','ke-paye','km-paye',
  'mobile-money-fees','ng-paye','pdf-workspace','qr-generator',
  'remittance-compare','rw-paye','sz-paye','td-paye','tz-paye',
  'vat-calculator','waec-calculator','za-paye'
]);

// ── Category gradients ──────────────────────────────────────────
const GRADIENTS = {
  'financial':         { c1: '#0A1628', c2: '#1E3A5F' },
  'document-pdf':      { c1: '#1a1a2e', c2: '#2d3561' },
  'image-design':      { c1: '#2d1b4e', c2: '#4a2580' },
  'developer':         { c1: '#0f172a', c2: '#1e293b' },
  'education':         { c1: '#1a1a2e', c2: '#2c2a5a' },
  'health':            { c1: '#1a0f0f', c2: '#3d1c1c' },
  'ecommerce':         { c1: '#1a1505', c2: '#3d2f0a' },
  'legal':             { c1: '#0a1628', c2: '#1b3a5c' },
  'data-productivity': { c1: '#0f1029', c2: '#1e2256' },
  'language':          { c1: '#1a0f2e', c2: '#35205e' },
  'african':           { c1: '#1a0a0a', c2: '#3d1a1a' },
  'engineering':       { c1: '#1a1a1a', c2: '#333333' },
};

const CATEGORY_LABELS = {
  'financial':         'Financial',
  'document-pdf':      'Document & PDF',
  'image-design':      'Image & Design',
  'developer':         'Developer',
  'education':         'Education',
  'health':            'Health',
  'ecommerce':         'E-Commerce',
  'legal':             'Legal',
  'data-productivity': 'Data & Productivity',
  'language':          'Language',
  'african':           'African',
  'engineering':       'Engineering',
};

// ── Parse tool-registry.js ──────────────────────────────────────
function parseRegistry(filePath) {
  const src = fs.readFileSync(filePath, 'utf8');
  const tools = [];
  // Match each object literal in the array (handles both single and double-quoted name)
  const re = /\{\s*id:\s*'([^']+)'\s*,\s*name:\s*(?:'([^']*?)'|"([^"]*?)")\s*,\s*icon:\s*'([^']*?)'\s*,[^}]*?category:\s*'([^']+)'/g;
  let m;
  while ((m = re.exec(src)) !== null) {
    tools.push({ id: m[1], name: m[2] || m[3], icon: m[4], category: m[5] });
  }
  return tools;
}

// ── Escape XML entities ─────────────────────────────────────────
function esc(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

// ── Word-wrap helper (returns array of lines) ───────────────────
function wrapText(text, maxChars) {
  if (text.length <= maxChars) return [text];
  const words = text.split(' ');
  const lines = [];
  let current = '';
  for (const w of words) {
    if (current && (current.length + 1 + w.length) > maxChars) {
      lines.push(current);
      current = w;
    } else {
      current = current ? current + ' ' + w : w;
    }
    if (lines.length === 2) break; // max 2 lines
  }
  if (current && lines.length < 2) lines.push(current);
  return lines;
}

// ── Generate SVG ────────────────────────────────────────────────
function generateSVG(tool) {
  const grad = GRADIENTS[tool.category] || GRADIENTS['financial'];
  const catLabel = CATEGORY_LABELS[tool.category] || tool.category;
  const nameLines = wrapText(tool.name, 28);

  // Compute vertical center for name text
  const lineHeight = 36;
  const baseY = nameLines.length === 1 ? 230 : 212;

  const nameElements = nameLines.map((line, i) =>
    `    <text x="40" y="${baseY + i * lineHeight}" fill="white" font-family="'DM Sans', 'Segoe UI', system-ui, sans-serif" font-size="28" font-weight="700">${esc(line)}</text>`
  ).join('\n');

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 400" width="600" height="400">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${grad.c1}"/>
      <stop offset="100%" stop-color="${grad.c2}"/>
    </linearGradient>
    <radialGradient id="glow" cx="85%" cy="15%" r="45%">
      <stop offset="0%" stop-color="white" stop-opacity="0.06"/>
      <stop offset="100%" stop-color="white" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <!-- Background -->
  <rect width="600" height="400" rx="16" ry="16" fill="url(#bg)"/>
  <!-- Decorative glow -->
  <rect width="600" height="400" rx="16" ry="16" fill="url(#glow)"/>
  <!-- Icon -->
  <text x="40" y="90" font-size="60" font-family="'Segoe UI Emoji', 'Apple Color Emoji', 'Noto Color Emoji', sans-serif">${tool.icon}</text>
  <!-- Tool name -->
${nameElements}
  <!-- Category badge -->
  <rect x="40" y="332" rx="12" ry="12" width="${catLabel.length * 10 + 24}" height="28" fill="white" fill-opacity="0.12"/>
  <text x="52" y="351" fill="white" fill-opacity="0.8" font-family="'DM Sans', 'Segoe UI', system-ui, sans-serif" font-size="13" font-weight="500">${esc(catLabel)}</text>
  <!-- Branding -->
  <text x="560" y="380" fill="white" fill-opacity="0.25" font-family="'DM Sans', 'Segoe UI', system-ui, sans-serif" font-size="14" font-weight="600" text-anchor="end">AfroTools</text>
</svg>`;
}

// ── Main ────────────────────────────────────────────────────────
function main() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const tools = parseRegistry(REGISTRY_PATH);
  console.log(`Parsed ${tools.length} tools from registry.`);

  let created = 0;
  let skipped = 0;

  for (const tool of tools) {
    // Skip if webp already exists
    if (EXISTING_WEBP.has(tool.id)) {
      skipped++;
      continue;
    }
    // Skip if SVG already exists
    const svgPath = path.join(OUTPUT_DIR, `${tool.id}.svg`);
    if (fs.existsSync(svgPath)) {
      skipped++;
      continue;
    }

    const svg = generateSVG(tool);
    fs.writeFileSync(svgPath, svg, 'utf8');
    created++;
  }

  console.log(`Done. Created: ${created} SVGs, Skipped: ${skipped} (already had image).`);
  console.log(`Output dir: ${OUTPUT_DIR}`);
}

main();
