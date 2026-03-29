#!/usr/bin/env node
/**
 * Batch fix script for AfroTools tool pages
 * Fixes: 1) Button visibility  2) afro-chat → AI sidebar  3) Share/save placement  4) Add Chart.js CDN
 */
const fs = require('fs');
const path = require('path');

const TOOLS_DIR = path.join(__dirname, '..', 'tools');
const ROOT_DIR = path.join(__dirname, '..');

// Stats
const stats = { buttons: 0, aichat: 0, sharesave: 0, chartjs: 0, files: 0 };

// ─── AI ADVISOR CARD HTML TEMPLATE ──────────────────────────────────────────
function aiAdvisorHTML(toolTitle, toolSlug) {
  return `
    <!-- AI Advisor -->
    <div class="ai-advisor-card" id="aiCard">
      <div class="ai-advisor-head">
        <span class="ai-dot"></span>
        <span class="ai-title">AI ${toolTitle} Advisor</span>
        <span class="ai-by">Powered by Claude</span>
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
    </div>`;
}

// ─── AI ADVISOR CSS ─────────────────────────────────────────────────────────
const AI_CSS = `
/* AI Advisor sidebar */
.ai-advisor-card{background:#fff;border-radius:16px;border:1px solid #DBEAFE;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.05);margin-bottom:16px}
.ai-advisor-head{padding:14px 18px;border-bottom:1px solid #EFF6FF;display:flex;align-items:center;gap:9px}
.ai-dot{width:8px;height:8px;border-radius:50%;background:#007AFF;animation:aiPulse 2s infinite;flex-shrink:0}
@keyframes aiPulse{0%,100%{opacity:1}50%{opacity:.3}}
.ai-title{font-size:.72rem;font-weight:700;letter-spacing:.06em;color:#0f172a}
.ai-by{font-size:.62rem;color:#6B8CAE;margin-left:auto}
.ai-advisor-body{padding:14px 18px}
.ai-status{font-size:.78rem;color:#0f172a;line-height:1.6;margin-bottom:10px}
.ai-msgs{max-height:280px;overflow-y:auto;display:flex;flex-direction:column;gap:8px;margin-bottom:10px}
.ai-msg-u{font-size:.76rem;padding:7px 10px;background:#007AFF;color:#fff;border-radius:6px;align-self:flex-end;max-width:90%;word-wrap:break-word}
.ai-msg-a{font-size:.76rem;padding:7px 10px;background:#EFF6FF;color:#0f172a;border-radius:6px;align-self:flex-start;max-width:90%;line-height:1.55;word-wrap:break-word}
.ai-thinking{font-size:.72rem;color:#9ca3af;font-style:italic;padding:4px 0}
.ai-input-row{display:flex;gap:6px}
.ai-input{flex:1;padding:9px 12px;border:1.5px solid #e5e7eb;border-radius:10px;font-family:inherit;font-size:.8rem;outline:none;background:#fafafa}
.ai-input:focus{border-color:#007AFF;background:#fff}
.ai-send{padding:9px 14px;background:#007AFF;color:#fff;border:none;border-radius:10px;font-family:inherit;font-size:.8rem;font-weight:700;cursor:pointer}
.ai-send:disabled{opacity:.5;cursor:not-allowed}`;

// ─── AI ADVISOR JS TEMPLATE ─────────────────────────────────────────────────
function aiAdvisorJS(toolSlug) {
  return `
<script>
var AI_MSGS=[];
async function sendAI(){
  var input=document.getElementById('aiInput');
  var msgsEl=document.getElementById('aiMsgs');
  var sendBtn=document.getElementById('aiSend');
  var q=input.value.trim();
  if(!q)return;
  AI_MSGS.push({role:'user',content:q});
  msgsEl.innerHTML+='<div class="ai-msg-u">'+q.replace(/</g,'&lt;').replace(/>/g,'&gt;')+'</div>';
  input.value='';sendBtn.disabled=true;
  var thinkEl=document.createElement('div');thinkEl.className='ai-thinking';thinkEl.textContent='Thinking\\u2026';
  msgsEl.appendChild(thinkEl);msgsEl.scrollTop=msgsEl.scrollHeight;
  try{
    var res=await fetch('/.netlify/functions/ai-advisor',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({tool:'${toolSlug}',messages:AI_MSGS.slice(-6),context:''})});
    var data=await res.json();
    if(thinkEl.parentNode)thinkEl.remove();
    var reply=data.reply||data.error||'Sorry, I could not get a response.';
    AI_MSGS.push({role:'assistant',content:reply});
    msgsEl.innerHTML+='<div class="ai-msg-a">'+reply.replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\\n/g,'<br>')+'</div>';
  }catch(e){
    if(thinkEl.parentNode)thinkEl.remove();
    msgsEl.innerHTML+='<div class="ai-msg-a">Sorry, the AI advisor is temporarily unavailable.</div>';
  }
  sendBtn.disabled=false;msgsEl.scrollTop=msgsEl.scrollHeight;input.focus();
}
<\/script>`;
}

// ─── HELPERS ────────────────────────────────────────────────────────────────
function slugFromPath(filePath) {
  // Extract tool slug from path like /tools/mortgage-calculator/index.html
  const parts = filePath.replace(/\\/g, '/').split('/');
  const toolsIdx = parts.indexOf('tools');
  if (toolsIdx >= 0 && parts[toolsIdx + 1]) return parts[toolsIdx + 1];
  return 'tool';
}

function titleFromSlug(slug) {
  return slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

function getAllHtmlFiles(dir) {
  const results = [];
  if (!fs.existsSync(dir)) return results;
  const items = fs.readdirSync(dir, { withFileTypes: true });
  for (const item of items) {
    const fullPath = path.join(dir, item.name);
    if (item.isDirectory()) {
      results.push(...getAllHtmlFiles(fullPath));
    } else if (item.name.endsWith('.html')) {
      results.push(fullPath);
    }
  }
  return results;
}

// ─── FIX 1: BUTTON VISIBILITY ──────────────────────────────────────────────
function fixButtons(content, filePath) {
  let changed = false;

  // Replace var(--color-accent) in .calc-btn background
  const patterns = [
    /background:var\(--color-accent\)/g,
    /background:var\(--color-primary\)/g,
    /background:var\(--afro-blue\)/g,
  ];

  for (const pat of patterns) {
    if (pat.test(content)) {
      content = content.replace(pat, 'background:linear-gradient(135deg,#007AFF,#0055D4);box-shadow:0 4px 14px rgba(0,122,255,.35)');
      changed = true;
    }
  }

  if (changed) stats.buttons++;
  return { content, changed };
}

// ─── FIX 2: REPLACE AFRO-CHAT WITH AI SIDEBAR ─────────────────────────────
function fixAIChat(content, filePath) {
  // Only process tools/ pages, not country VAT pages
  if (!filePath.replace(/\\/g, '/').includes('/tools/')) return { content, changed: false };

  // Skip if already has ai-advisor-card
  if (content.includes('ai-advisor-card')) return { content, changed: false };

  // Check if page has <afro-chat (as actual element, not in CSS/print rules)
  // Match patterns: <afro-chat ... ></afro-chat> or <afro-chat ...>
  const chatRegex = /<afro-chat[\s\S]*?(?:<\/afro-chat>|>\s*<\/afro-chat>)/g;
  if (!chatRegex.test(content)) return { content, changed: false };

  const slug = slugFromPath(filePath);
  const title = titleFromSlug(slug);

  // Extract tool slug from afro-chat attributes
  let toolSlug = slug;
  const toolMatch = content.match(/<afro-chat[^>]*\btool(?:-name)?="([^"]+)"/);

  // Remove the afro-chat element (but not CSS references to it)
  content = content.replace(/<afro-chat[\s\S]*?(?:<\/afro-chat>|>\s*<\/afro-chat>)\s*/g, '');
  // Also remove the chat-panel.min.js script if present (since we're replacing it)
  content = content.replace(/<script src="\/assets\/js\/components\/chat-panel\.min\.js" defer><\/script>\s*/g, '');

  // Add AI advisor CSS before </style>
  if (content.includes('</style>') && !content.includes('.ai-advisor-card')) {
    content = content.replace('</style>', AI_CSS + '\n</style>');
  }

  // Add AI advisor card into sidebar
  const sidebarCard = aiAdvisorHTML(title, toolSlug);

  // Try to insert at the beginning of the sidebar
  if (content.includes('class="sidebar"')) {
    content = content.replace(
      /(<div\s+class="sidebar">)\s*/,
      '$1\n' + sidebarCard + '\n\n'
    );
  }

  // Add AI advisor JS before </body> or before the GA script
  const aiJS = aiAdvisorJS(toolSlug);
  if (content.includes('googletagmanager.com')) {
    content = content.replace(
      /(<script\s+defer\s+src="https:\/\/www\.googletagmanager\.com)/,
      aiJS + '\n$1'
    );
  } else if (content.includes('</body>')) {
    content = content.replace('</body>', aiJS + '\n</body>');
  }

  stats.aichat++;
  return { content, changed: true };
}

// ─── FIX 3: SHARE/SAVE BUTTON PLACEMENT ────────────────────────────────────
function fixShareSave(content, filePath) {
  // Fix the inline style that causes bad spacing
  const oldStyle = "display:flex;gap:8px;margin-top:16px;flex-wrap:wrap;padding:0 22px 16px";
  if (content.includes(oldStyle)) {
    content = content.replace(
      new RegExp(oldStyle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'),
      'display:flex;gap:8px;margin-top:20px;flex-wrap:wrap'
    );
    stats.sharesave++;
    return { content, changed: true };
  }
  return { content, changed: false };
}

// ─── FIX 4: ADD CHART.JS CDN ───────────────────────────────────────────────
function addChartJS(content, filePath) {
  // Only for tools/ pages
  if (!filePath.replace(/\\/g, '/').includes('/tools/')) return { content, changed: false };

  // Skip if already has Chart.js
  if (content.includes('chart.js') || content.includes('Chart.js') || content.includes('chartjs')) {
    return { content, changed: false };
  }

  // Skip non-calculator pages (PDF tools, image tools, translators, etc.)
  const slug = slugFromPath(filePath);
  const skipPrefixes = ['pdf-', 'image-', 'colour-', 'color-', 'css-', 'json-', 'sql-', 'regex-',
    'markdown-', 'jwt-', 'uuid-', 'url-', 'base64', 'hash-', 'htaccess-', 'robots-', 'meta-tag',
    'html-', 'diff-', 'data-conv', 'data-comp', 'api-', 'cron-', 'sitemap-', 'social-card',
    'favicon-', 'flyer-', 'logo-', 'meme-', 'thumbnail-', 'watermark-', 'certificate-',
    'password-', 'qr-', 'zulu-', 'yoruba-', 'swahili-', 'pidgin-', 'igbo-', 'hausa-', 'amharic-',
    'meeting-minutes', 'document-pdf', 'cover-letter', 'employment-contract', 'contract-gen',
    'cv-builder', 'invoice-gen', 'payslip-gen', 'boq-builder', 'boq-gen', 'business-plan'];
  if (skipPrefixes.some(p => slug.startsWith(p))) return { content, changed: false };

  // Add Chart.js CDN before </head>
  const chartScript = '<script src="https://cdn.jsdelivr.net/npm/chart.js" defer></script>';
  if (content.includes('</head>')) {
    content = content.replace('</head>', chartScript + '\n</head>');
    stats.chartjs++;
    return { content, changed: true };
  }
  return { content, changed: false };
}

// ─── MAIN ───────────────────────────────────────────────────────────────────
function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let anyChanged = false;
  const changes = [];

  let r;

  r = fixButtons(content, filePath);
  if (r.changed) { content = r.content; anyChanged = true; changes.push('buttons'); }

  r = fixAIChat(content, filePath);
  if (r.changed) { content = r.content; anyChanged = true; changes.push('ai-chat'); }

  r = fixShareSave(content, filePath);
  if (r.changed) { content = r.content; anyChanged = true; changes.push('share-save'); }

  r = addChartJS(content, filePath);
  if (r.changed) { content = r.content; anyChanged = true; changes.push('chartjs'); }

  if (anyChanged) {
    fs.writeFileSync(filePath, content, 'utf8');
    stats.files++;
    const rel = path.relative(ROOT_DIR, filePath).replace(/\\/g, '/');
    console.log(`  [FIXED] ${rel} — ${changes.join(', ')}`);
  }
}

// Run on tools/ directory
console.log('=== AfroTools Batch Fix Script ===\n');
console.log('Scanning tools/ directory...\n');

const toolFiles = getAllHtmlFiles(TOOLS_DIR);
console.log(`Found ${toolFiles.length} HTML files in tools/\n`);

for (const file of toolFiles) {
  // Skip first-home-buyer (already fixed)
  if (file.replace(/\\/g, '/').includes('first-home-buyer')) continue;
  processFile(file);
}

// Also scan country VAT pages for share/save fix only
console.log('\nScanning country pages for share/save fix...\n');
const countryDirs = fs.readdirSync(ROOT_DIR, { withFileTypes: true })
  .filter(d => d.isDirectory() && !['node_modules', '.git', '.claude', 'assets', 'scripts', 'netlify', 'supabase', 'tools', 'fr', '.netlify'].includes(d.name))
  .map(d => path.join(ROOT_DIR, d.name));

for (const dir of countryDirs) {
  const files = getAllHtmlFiles(dir);
  for (const file of files) {
    let content = fs.readFileSync(file, 'utf8');
    const r = fixShareSave(content, file);
    if (r.changed) {
      fs.writeFileSync(file, r.content, 'utf8');
      stats.files++;
      const rel = path.relative(ROOT_DIR, file).replace(/\\/g, '/');
      console.log(`  [FIXED] ${rel} — share-save`);
    }
  }
}

// Fr pages too
const frDir = path.join(ROOT_DIR, 'fr');
if (fs.existsSync(frDir)) {
  console.log('\nScanning fr/ pages for share/save fix...\n');
  const frFiles = getAllHtmlFiles(frDir);
  for (const file of frFiles) {
    let content = fs.readFileSync(file, 'utf8');
    const r = fixShareSave(content, file);
    if (r.changed) {
      fs.writeFileSync(file, r.content, 'utf8');
      stats.files++;
      const rel = path.relative(ROOT_DIR, file).replace(/\\/g, '/');
      console.log(`  [FIXED] ${rel} — share-save`);
    }
  }
}

console.log('\n=== RESULTS ===');
console.log(`Files modified: ${stats.files}`);
console.log(`Button fixes: ${stats.buttons}`);
console.log(`AI chat replacements: ${stats.aichat}`);
console.log(`Share/save fixes: ${stats.sharesave}`);
console.log(`Chart.js added: ${stats.chartjs}`);
console.log('\nDone!');
