#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

const swConverterDarkBlock = `
/* V3 dark mode guardrails for the converter workbench */
@media (prefers-color-scheme:dark){
  :root{--bg:#0b1120;--card:#121f33;--border:#2d3f57;--text:#eaf2ff;--muted:#c2d0e4;--blue-light:rgba(96,165,250,.18)}
  .cat-pill{color:rgba(255,255,255,.84);border-color:rgba(255,255,255,.22)}
  .conv-card{box-shadow:0 18px 45px rgba(0,0,0,.28),0 0 0 1px rgba(255,255,255,.04)}
  .field-wrap input,.field-wrap select{background:#0f1b2d;color:var(--text);border-color:var(--border)}
  .field-wrap input.result{background:#172554;color:#bfdbfe;border-color:#1e40af}
  .swap-btn,.preset{background:#0f1b2d;color:#dbeafe;border-color:var(--border)}
  .conv-formula,.all-table th{background:#0f1b2d}
  .african-callout{color:#d1d9e8}
}
html[data-theme="dark"]{--bg:#0b1120;--card:#121f33;--border:#2d3f57;--text:#eaf2ff;--muted:#c2d0e4;--blue-light:rgba(96,165,250,.18)}
html[data-theme="dark"] .cat-pill{color:rgba(255,255,255,.84);border-color:rgba(255,255,255,.22)}
html[data-theme="dark"] .conv-card{box-shadow:0 18px 45px rgba(0,0,0,.28),0 0 0 1px rgba(255,255,255,.04)}
html[data-theme="dark"] .field-wrap input,
html[data-theme="dark"] .field-wrap select{background:#0f1b2d;color:var(--text);border-color:var(--border)}
html[data-theme="dark"] .field-wrap input.result{background:#172554;color:#bfdbfe;border-color:#1e40af}
html[data-theme="dark"] .swap-btn,
html[data-theme="dark"] .preset{background:#0f1b2d;color:#dbeafe;border-color:var(--border)}
html[data-theme="dark"] .conv-formula,
html[data-theme="dark"] .all-table th{background:#0f1b2d}
html[data-theme="dark"] .african-callout{color:#d1d9e8}
`;

const frenchInsuranceDarkBlock = `
/* V3 dark mode guardrails for the French car insurance calculator */
@media (prefers-color-scheme:dark){
  :root{--ca-ink:#eaf2ff;--ca-muted:#b8c6d9;--ca-line:#2d3f57;--ca-card:#111c2e;--ca-bg:#08111f;--ca-blue:#93c5fd;--ca-blue-2:#3b82f6;--ca-green:#86efac;--ca-amber:#facc15;--ca-red:#fca5a5}
  .ca-card,.ca-band,.ca-metric,.ca-source,.ca-links a,.ca-btn{background:#111c2e;color:var(--ca-ink);border-color:var(--ca-line)}
  .ca-field label,.ca-table th,.ca-source strong,.ca-source a{color:#dbeafe}
  .ca-field input,.ca-field select,.ca-summary textarea{background:#0f1b2d;color:var(--ca-ink);border-color:var(--ca-line)}
  .ca-status,.ca-chip{background:#172554;color:#bfdbfe;border-color:#1e3a8a}
  .ca-status[data-tone="warn"]{background:#3b2508;color:#facc15;border-color:#854d0e}
  .ca-status[data-tone="ok"]{background:#052e1b;color:#86efac;border-color:#166534}
  .ca-table th{background:#0f1b2d}
  .ca-table td{border-bottom-color:var(--ca-line)}
}
html[data-theme="dark"]{--ca-ink:#eaf2ff;--ca-muted:#b8c6d9;--ca-line:#2d3f57;--ca-card:#111c2e;--ca-bg:#08111f;--ca-blue:#93c5fd;--ca-blue-2:#3b82f6;--ca-green:#86efac;--ca-amber:#facc15;--ca-red:#fca5a5}
html[data-theme="dark"] .ca-card,
html[data-theme="dark"] .ca-band,
html[data-theme="dark"] .ca-metric,
html[data-theme="dark"] .ca-source,
html[data-theme="dark"] .ca-links a,
html[data-theme="dark"] .ca-btn{background:#111c2e;color:var(--ca-ink);border-color:var(--ca-line)}
html[data-theme="dark"] .ca-field label,
html[data-theme="dark"] .ca-table th,
html[data-theme="dark"] .ca-source strong,
html[data-theme="dark"] .ca-source a{color:#dbeafe}
html[data-theme="dark"] .ca-field input,
html[data-theme="dark"] .ca-field select,
html[data-theme="dark"] .ca-summary textarea{background:#0f1b2d;color:var(--ca-ink);border-color:var(--ca-line)}
html[data-theme="dark"] .ca-status,
html[data-theme="dark"] .ca-chip{background:#172554;color:#bfdbfe;border-color:#1e3a8a}
html[data-theme="dark"] .ca-status[data-tone="warn"]{background:#3b2508;color:#facc15;border-color:#854d0e}
html[data-theme="dark"] .ca-status[data-tone="ok"]{background:#052e1b;color:#86efac;border-color:#166534}
html[data-theme="dark"] .ca-table th{background:#0f1b2d}
html[data-theme="dark"] .ca-table td{border-bottom-color:var(--ca-line)}
`;

const nigeriaPayeDarkBlock = `
    /* V3 dark mode guardrails for PAYE helper and saved-scenario panels */
    @media (prefers-color-scheme: dark) {
      .regime-helper-v3 { background: #102138 !important; border-bottom-color: rgba(96,165,250,0.28) !important; }
      .regime-helper-v3 p { color: #dbeafe !important; }
      .regime-helper-v3 p:first-of-type { color: #f8fafc !important; }
      .regime-helper-v3 strong { color: #93c5fd !important; }
      .calc-save-shell, .calc-save-card { background: #111c2e !important; border-color: #2d3f57 !important; color: #eaf2ff !important; }
      .calc-save-head h3, .calc-save-card-head h3, .calc-save-empty strong { color: #f8fafc !important; }
      .calc-save-head p, .calc-save-card-head p, .calc-save-status, .calc-save-empty, .calc-save-card-meta { color: #b8c6d9 !important; }
      .calc-save-input, .calc-save-card-actions button { background: #0f1b2d !important; color: #eaf2ff !important; border-color: #2d3f57 !important; }
      .calc-save-input::placeholder { color: #93a4bc !important; }
      .calc-save-empty { background: rgba(15,27,45,0.78) !important; }
    }
    html[data-theme="dark"] .regime-helper-v3 { background: #102138 !important; border-bottom-color: rgba(96,165,250,0.28) !important; }
    html[data-theme="dark"] .regime-helper-v3 p { color: #dbeafe !important; }
    html[data-theme="dark"] .regime-helper-v3 p:first-of-type { color: #f8fafc !important; }
    html[data-theme="dark"] .regime-helper-v3 strong { color: #93c5fd !important; }
    html[data-theme="dark"] .calc-save-shell,
    html[data-theme="dark"] .calc-save-card { background: #111c2e !important; border-color: #2d3f57 !important; color: #eaf2ff !important; }
    html[data-theme="dark"] .calc-save-head h3,
    html[data-theme="dark"] .calc-save-card-head h3,
    html[data-theme="dark"] .calc-save-empty strong { color: #f8fafc !important; }
    html[data-theme="dark"] .calc-save-head p,
    html[data-theme="dark"] .calc-save-card-head p,
    html[data-theme="dark"] .calc-save-status,
    html[data-theme="dark"] .calc-save-empty,
    html[data-theme="dark"] .calc-save-card-meta { color: #b8c6d9 !important; }
    html[data-theme="dark"] .calc-save-input,
    html[data-theme="dark"] .calc-save-card-actions button { background: #0f1b2d !important; color: #eaf2ff !important; border-color: #2d3f57 !important; }
    html[data-theme="dark"] .calc-save-input::placeholder { color: #93a4bc !important; }
    html[data-theme="dark"] .calc-save-empty { background: rgba(15,27,45,0.78) !important; }
`;

const vatDataThemeDarkBlock = `
/* V3 dark mode guardrails for VAT calculator data-theme mode */
html[data-theme="dark"] .vat-card,
html[data-theme="dark"] .vat-results,
html[data-theme="dark"] .vat-compare-card,
html[data-theme="dark"] .vat-faq-item,
html[data-theme="dark"] .tool-info-card{background:#1e293b;border-color:#334155;color:#e2e8f0}
html[data-theme="dark"] .vat-card-title,
html[data-theme="dark"] .vat-faq h2,
html[data-theme="dark"] .vat-faq-item summary,
html[data-theme="dark"] .tool-info-name{color:#f8fafc}
html[data-theme="dark"] .vat-muted,
html[data-theme="dark"] .vat-field label,
html[data-theme="dark"] .vat-results-label,
html[data-theme="dark"] .vat-breakdown-label,
html[data-theme="dark"] .vat-breakdown-rate,
html[data-theme="dark"] .vat-faq-body,
html[data-theme="dark"] .vat-invoice-row,
html[data-theme="dark"] .vat-compare-row,
html[data-theme="dark"] .tool-info-cat,
html[data-theme="dark"] .tool-info-updated,
html[data-theme="dark"] .tool-stat-lbl{color:#cbd5e1}
html[data-theme="dark"] .vat-input,
html[data-theme="dark"] .vat-select,
html[data-theme="dark"] .vat-input-wrap,
html[data-theme="dark"] .vat-quick-btn,
html[data-theme="dark"] .vat-chip,
html[data-theme="dark"] .vat-btn--outline,
html[data-theme="dark"] .vat-line-rm,
html[data-theme="dark"] .tool-info-action{background:#0f172a;border-color:#334155;color:#e2e8f0}
html[data-theme="dark"] .vat-input:focus,
html[data-theme="dark"] .vat-select:focus,
html[data-theme="dark"] .vat-input-wrap:focus-within{border-color:#60a5fa;box-shadow:0 0 0 3px rgba(96,165,250,.15)}
html[data-theme="dark"] .vat-tab,
html[data-theme="dark"] .vat-mode{color:#cbd5e1;border-color:#334155}
html[data-theme="dark"] .vat-tab.active,
html[data-theme="dark"] .vat-tab:hover,
html[data-theme="dark"] .vat-mode:hover,
html[data-theme="dark"] .vat-quick-btn:hover,
html[data-theme="dark"] .vat-chip:hover{color:#93c5fd;border-color:#60a5fa;background:#172554}
html[data-theme="dark"] .vat-mode.active,
html[data-theme="dark"] .vat-quick-btn.active,
html[data-theme="dark"] .vat-chip.active{background:var(--color-primary);border-color:var(--color-primary);color:#fff}
html[data-theme="dark"] .vat-tabs,
html[data-theme="dark"] .vat-invoice-totals,
html[data-theme="dark"] .vat-invoice-row--total,
html[data-theme="dark"] .vat-compare-row--total{border-color:#334155}
html[data-theme="dark"] .vat-results-hero{background:linear-gradient(135deg,#1e293b 0%,#0f172a 100%);border-color:#334155}
html[data-theme="dark"] .vat-breakdown-item,
html[data-theme="dark"] .vat-stat,
html[data-theme="dark"] .vat-wh-item,
html[data-theme="dark"] .vat-country-detail{background:#0f172a;border-color:#334155}
html[data-theme="dark"] .vat-breakdown-value,
html[data-theme="dark"] .vat-wh-value,
html[data-theme="dark"] .vat-detail-row strong,
html[data-theme="dark"] .vat-history-country{color:#f8fafc}
html[data-theme="dark"] .vat-breakdown-item--accent{background:#2d1515;border-color:#7f1d1d}
html[data-theme="dark"] .vat-exemptions,
html[data-theme="dark"] .vat-compare-note,
html[data-theme="dark"] .vat-formula,
html[data-theme="dark"] .tool-feat{background:#172554;border-color:#1e3a5f;color:#dbeafe}
html[data-theme="dark"] .tool-info-header,
html[data-theme="dark"] .tool-info-footer{background:#0f172a;border-color:#334155}
`;

const vatDataThemeDarkTailBlock = `
/* V3 VAT dark detail contrast tail */
html[data-theme="dark"] .vat-badge{background:rgba(15,23,42,.42);border-color:rgba(147,197,253,.35);color:#f8fafc}
html[data-theme="dark"] .vat-detail-row span,
html[data-theme="dark"] .vat-rate-row span,
html[data-theme="dark"] .vat-compare-name,
html[data-theme="dark"] .vat-history-meta{color:#cbd5e1}
`;

let filesChanged = 0;

updateFile('sw/zana/kubadilisha-vipimo/index.html', (html) => {
  let out = html;
  if (!out.includes('V3 dark mode guardrails for the converter workbench')) {
    out = out.replace('\n/* Empty / hidden categories */', `${swConverterDarkBlock}\n/* Empty / hidden categories */`);
  }
  if (!out.includes('V3 dark style for Swahili inline links')) {
    out = out.replace('</style>\n<afro-footer>', `@media (prefers-color-scheme:dark){.sw-data-inline-links a{background:#111c2e!important;border-color:#2d3f57!important;color:#dbeafe!important}}html[data-theme="dark"] .sw-data-inline-links a{background:#111c2e!important;border-color:#2d3f57!important;color:#dbeafe!important}/* V3 dark style for Swahili inline links */</style>\n<afro-footer>`);
  }
  return out;
});

updateFile('fr/tools/assurance-auto/index.html', (html) => {
  if (html.includes('V3 dark mode guardrails for the French car insurance calculator')) return html;
  return html.replace('\n@media (max-width: 940px)', `${frenchInsuranceDarkBlock}\n@media (max-width: 940px)`);
});

updateFile('nigeria/ng-salary-tax.html', (html) => {
  let out = html;
  if (!out.includes('class="regime-helper-v3"')) {
    out = out.replace('<div style="background:rgba(0,122,255,0.06);border-bottom:1px solid rgba(0,122,255,0.12);padding:12px 0;">', '<div class="regime-helper-v3" style="background:rgba(0,122,255,0.06);border-bottom:1px solid rgba(0,122,255,0.12);padding:12px 0;">');
  }
  if (!out.includes('V3 dark mode guardrails for PAYE helper')) {
    out = out.replace('\n    @media (max-width: 720px) {', `${nigeriaPayeDarkBlock}\n    @media (max-width: 720px) {`);
  }
  return out;
});

updateFile('assets/css/design-system.css', (css) => {
  let out = css;
  out = out.replace('.vat-stat-label,\\n  .vat-prefix {\\n    color: #cbd5e1 !important;\\n  }', `.vat-stat-label,
  .vat-prefix {
    color: #cbd5e1 !important;
  }`);
  out = out.replace('html[data-theme="dark"] .vat-stat-label,\\nhtml[data-theme="dark"] .vat-prefix {\\n  color: #cbd5e1 !important;\\n}', `html[data-theme="dark"] .vat-stat-label,
html[data-theme="dark"] .vat-prefix {
  color: #cbd5e1 !important;
}`);
  out = out.replace(/\.vat-stat-label \{\n    color: #cbd5e1;\n  \}/, `.vat-stat-label,
  .vat-prefix {
    color: #cbd5e1 !important;
  }`);
  out = out.replace(/html\[data-theme="dark"\] \.vat-stat-label \{\n  color: #cbd5e1;\n\}/, `html[data-theme="dark"] .vat-stat-label,
html[data-theme="dark"] .vat-prefix {
  color: #cbd5e1 !important;
}`);
  return out;
});

updateFile('assets/css/vat-calculator.css', (css) => {
  let out = css;
  if (!out.includes('V3 VAT dark text guardrail')) {
    out = `${out}\n@media (prefers-color-scheme:dark){.vat-prefix,.vat-stat-label{color:#cbd5e1!important}}html[data-theme="dark"] .vat-prefix,html[data-theme="dark"] .vat-stat-label{color:#cbd5e1!important}/* V3 VAT dark text guardrail */\n`;
  }
  if (!out.includes('V3 dark mode guardrails for VAT calculator data-theme mode')) {
    out = `${out}\n${vatDataThemeDarkBlock}\n`;
  }
  if (!out.includes('V3 VAT dark detail contrast tail')) {
    out = `${out}\n${vatDataThemeDarkTailBlock}\n`;
  }
  return out;
});

console.log(`Files changed: ${filesChanged}`);

function updateFile(relativeFile, transform) {
  const file = path.join(ROOT, relativeFile);
  const before = fs.readFileSync(file, 'utf8');
  const after = transform(before);
  if (after === before) return;
  writeFileWithRetry(file, after);
  filesChanged += 1;
}

function writeFileWithRetry(file, content) {
  const tmp = `${file}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, content);
  let lastError = null;
  for (let attempt = 0; attempt < 8; attempt += 1) {
    try {
      fs.renameSync(tmp, file);
      return;
    } catch (error) {
      lastError = error;
      const waitUntil = Date.now() + 80 * (attempt + 1);
      while (Date.now() < waitUntil) {}
    }
  }
  try {
    fs.unlinkSync(tmp);
  } catch (_) {}
  throw lastError;
}
