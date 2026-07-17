#!/usr/bin/env node
/**
 * Fix AI advisor cards for pages without sidebars.
 * Inserts a floating AI advisor section before <afro-related-tools>.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

const pages = [
  'tools/bank-charges', 'tools/fuel-cost', 'tools/gpa-calculator',
  'tools/land-title-check', 'tools/property-tax', 'tools/property-valuation',
  'tools/remittance-compare', 'tools/rent-affordability', 'tools/rental-agreement',
  'tools/salary-compare', 'tools/solar-calculator', 'tools/stamp-duty',
  'tools/tenant-screening', 'tools/vat-calculator', 'tools/waec-calculator'
];

function titleFromSlug(slug) {
  return slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

const AI_SECTION_CSS = `
/* AI Advisor floating section */
.ai-advisor-section{max-width:480px;margin:24px auto 32px;padding:0 20px}`;

function aiCardHTML(title, slug) {
  return `<div class="ai-advisor-section">
  <div class="ai-advisor-card" id="aiCard">
    <div class="ai-advisor-head">
      <span class="ai-dot"></span>
      <span class="ai-title">AI ${title} Advisor</span>
      <span class="ai-by">Optional AI · provider required</span>
    </div>
    <div class="ai-advisor-body">
      <div class="ai-status" id="aiStatus">Ask me anything about this tool &mdash; I can help explain results, suggest strategies, and answer questions.</div>
      <div class="ai-chat" id="aiChat">
        <div class="ai-msgs" id="aiMsgs"></div>
        <div class="ai-input-row">
          <input type="text" class="ai-input" id="aiInput" placeholder="Ask a question..." maxlength="300" onkeydown="if(event.key==='Enter')sendAI()">
          <button class="ai-send" id="aiSend" onclick="sendAI()">&#x2192;</button>
        </div>
      </div>
    </div>
  </div>
</div>`;
}

let fixed = 0;

for (const p of pages) {
  const filePath = path.join(ROOT, p, 'index.html');
  if (!fs.existsSync(filePath)) { console.log(`  SKIP ${p} (not found)`); continue; }

  let content = fs.readFileSync(filePath, 'utf8');

  // Skip if already has aiCard in HTML
  if (content.includes('id="aiCard"')) { console.log(`  SKIP ${p} (already has aiCard)`); continue; }

  const slug = path.basename(p);
  const title = titleFromSlug(slug);

  // Add section CSS if not already present
  if (!content.includes('.ai-advisor-section')) {
    content = content.replace('</style>', AI_SECTION_CSS + '\n</style>');
  }

  // Insert AI card before afro-related-tools
  if (content.includes('<afro-related-tools')) {
    content = content.replace(
      /(<afro-related-tools)/,
      aiCardHTML(title, slug) + '\n$1'
    );
    fixed++;
    console.log(`  FIXED ${p}`);
  } else {
    // Fallback: before afro-footer
    content = content.replace(
      /(<afro-footer)/,
      aiCardHTML(title, slug) + '\n$1'
    );
    fixed++;
    console.log(`  FIXED ${p} (before footer)`);
  }

  fs.writeFileSync(filePath, content, 'utf8');
}

console.log(`\nFixed ${fixed} pages.`);
