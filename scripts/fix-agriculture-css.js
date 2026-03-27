#!/usr/bin/env node
/**
 * Fix agriculture tool pages — CSS issues
 *
 * Fixes:
 * 1. Hero subtitle text legibility — boost opacity from 0.65/0.85 to 0.95
 * 2. Hero badge visibility — boost badge bg from 0.15 to 0.22
 * 3. Container z-index — ensure cards overlap hero properly
 * 4. Flag emoji fallback on Windows — add Twemoji CDN for cross-platform flags
 *
 * Run: node scripts/fix-agriculture-css.js
 */

const fs = require('fs');
const path = require('path');

const AGRI_DIR = path.join(__dirname, '..', 'agriculture');
let filesFixed = 0;
let totalFiles = 0;
let changes = { opacity: 0, zindex: 0, badge: 0, twemoji: 0 };

function getAllHtmlFiles(dir) {
  let results = [];
  const items = fs.readdirSync(dir, { withFileTypes: true });
  for (const item of items) {
    const full = path.join(dir, item.name);
    if (item.isDirectory()) {
      results = results.concat(getAllHtmlFiles(full));
    } else if (item.name.endsWith('.html')) {
      results.push(full);
    }
  }
  return results;
}

function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  const original = content;
  totalFiles++;

  // ═══ FIX 1: Hero subtitle text legibility ═══
  // Pattern: opacity: 0.85 on hero subtitle/paragraph elements
  // Match lines like: .ir-hero-sub { ... opacity: 0.85 ... }
  // or: .hub-hero p { ... opacity: 0.85 ... }
  // or: .tool-hero-sub { ... color: rgba(255,255,255,0.65) ... }

  // Fix opacity: 0.85 in hero subtitle contexts
  content = content.replace(
    /(\.(ir-hero-sub|hub-hero\s+p|tool-hero-sub|hero-sub)[^}]*?)opacity:\s*0\.85/g,
    (match, prefix) => {
      changes.opacity++;
      return prefix + 'opacity: 1';
    }
  );

  // Fix rgba(255,255,255,0.65) hero subtitle color
  content = content.replace(
    /(\.(tool-hero-sub|hero-sub)[^}]*?)color:\s*rgba\(255,\s*255,\s*255,\s*0\.65\)/g,
    (match, prefix) => {
      changes.opacity++;
      return prefix + 'color: rgba(255,255,255,0.92)';
    }
  );

  // Fix breadcrumb opacity too (0.7 is too low)
  content = content.replace(
    /(\.(ir-breadcrumb|hub-hero\s+\.breadcrumb|breadcrumb)[^}]*?)opacity:\s*0\.7([;\s}])/g,
    (match, prefix, cls, after) => {
      changes.opacity++;
      return prefix + 'opacity: 0.85' + after;
    }
  );

  // ═══ FIX 2: Hero badge/pill visibility ═══
  // Pattern: background: rgba(255,255,255,0.15) on stat pills and badges
  content = content.replace(
    /(\.(hub-badge|ir-stat-pill|stat-pill|hero-badge)[^}]*?)background:\s*rgba\(255,\s*255,\s*255,\s*0\.15\)/g,
    (match, prefix) => {
      changes.badge++;
      return prefix + 'background: rgba(255,255,255,0.22)';
    }
  );

  // ═══ FIX 3: Container z-index for hero overlap ═══
  // Patterns: .ir-main, .hub-main, .tool-main without z-index
  // Add position: relative; z-index: 2; if not already present

  const mainSelectors = ['.ir-main', '.hub-main', '.tool-main'];
  for (const sel of mainSelectors) {
    // Escape the dot for regex
    const escaped = sel.replace('.', '\\.');
    const regex = new RegExp('(' + escaped + '\\s*\\{[^}]*?)\\}', 'g');
    content = content.replace(regex, (match, inner) => {
      let modified = false;
      let result = inner;

      if (!inner.includes('position:') && !inner.includes('position :')) {
        result += ' position: relative;';
        modified = true;
      }
      if (!inner.includes('z-index:') && !inner.includes('z-index :')) {
        result += ' z-index: 2;';
        modified = true;
      }

      if (modified) changes.zindex++;
      return result + '}';
    });
  }

  // ═══ FIX 4: Twemoji for cross-platform flag rendering ═══
  // Add Twemoji script before </body> if not already present
  if (!content.includes('twemoji') && content.includes('class="flag"')) {
    const twemojiSnippet = `\n<script src="https://cdn.jsdelivr.net/npm/@twemoji/api@latest/dist/twemoji.min.js" crossorigin="anonymous"></script>\n<script>if(typeof twemoji!=='undefined')twemoji.parse(document.body,{folder:'svg',ext:'.svg'});</script>\n`;
    content = content.replace('</body>', twemojiSnippet + '</body>');
    changes.twemoji++;
  }

  // Write if changed
  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    filesFixed++;
  }
}

// Run
console.log('Scanning agriculture HTML files...');
const files = getAllHtmlFiles(AGRI_DIR);
console.log('Found ' + files.length + ' HTML files');

files.forEach(fixFile);

console.log('\n✅ Done!');
console.log('  Files scanned: ' + totalFiles);
console.log('  Files modified: ' + filesFixed);
console.log('  Opacity fixes: ' + changes.opacity);
console.log('  Z-index fixes: ' + changes.zindex);
console.log('  Badge fixes: ' + changes.badge);
console.log('  Twemoji added: ' + changes.twemoji);
