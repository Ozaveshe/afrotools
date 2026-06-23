const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

const tools = [
  {
    slug: 'site-clearing',
    id: 'site-clearance',
    file: 'tools/site-clearing/index.html',
    title: 'Site Clearing Cost Estimator',
    resultSelector: '#sc-results',
    primary: '#sc-total',
    source: 'Planning rates built into the calculator plus current contractor quotes, disposal rules, surveys, and site access checks.',
    freshness: 'Rates are static planning assumptions. Recheck equipment hire, fuel, disposal, tree permits, and rainy-season access before awarding work.',
    methodology: 'Combines site area, vegetation density, terrain, tree count, topsoil, demolition, and waste handling into a local budget range.',
    limitations: 'Not a survey, environmental approval, demolition permit, contractor quote, or safety plan.'
  },
  {
    slug: 'road-construction-cost',
    id: 'road-construction-cost',
    file: 'tools/road-construction-cost/index.html',
    title: 'Road Construction Cost Estimator',
    resultSelector: '#rc-results',
    primary: '#rc-grand',
    source: 'Planning pavement rates built into the calculator plus engineer estimates, contractor quotes, geotechnical notes, and drainage designs.',
    freshness: 'Rates are static planning assumptions. Recheck bitumen, cement, aggregate, fuel, haulage, drainage, and traffic-control costs before procurement.',
    methodology: 'Combines length, width, surface type, terrain, location, drainage, lighting, and country cost tables into a project estimate.',
    limitations: 'Not a civil engineering design, tender award, public works estimate, road authority approval, or guaranteed quote.'
  },
  {
    slug: 'scaffolding-calc',
    id: 'scaffolding-calc',
    file: 'tools/scaffolding-calc/index.html',
    title: 'Scaffolding Calculator',
    resultSelector: '#sg-results',
    primary: '#sg-total',
    source: 'Planning component rates built into the calculator plus supplier hire sheets, competent-person inspection notes, and temporary-works requirements.',
    freshness: 'Rates are static planning assumptions. Recheck hire duration, damaged-item charges, erection labour, safety tags, and site rules before use.',
    methodology: 'Estimates scaffold area, tubes, boards, couplers, labour, and rental or purchase cost from perimeter, height, type, and duration.',
    limitations: 'Not a scaffold design, load certificate, safety inspection, temporary-works signoff, or permission to work at height.'
  },
  {
    slug: 'window-door-sizing',
    id: 'window-door-sizing',
    file: 'tools/window-door-sizing/index.html',
    title: 'Window & Door Sizing Guide',
    resultSelector: '#wd-results',
    primary: '#wd-total',
    source: 'Planning size and cost assumptions built into the calculator plus drawings, supplier schedules, security requirements, and local building rules.',
    freshness: 'Rates are static planning assumptions. Recheck aluminium, timber, glass, hardware, fabrication, delivery, and building-code requirements before ordering.',
    methodology: 'Combines room counts, room area, openings, material choices, glazing, ventilation, and fitting allowance into a schedule and budget.',
    limitations: 'Not an architect schedule, code approval, fire-escape ruling, fabrication drawing, or guaranteed supplier quote.'
  },
  {
    slug: 'plumbing-material',
    id: 'plumbing-material',
    file: 'tools/plumbing-material/index.html',
    title: 'Plumbing Material Calculator',
    resultSelector: '#pm-results',
    primary: '#pm-grand',
    source: 'Planning pipe and fixture rates built into the calculator plus drawings, plumber takeoffs, supplier quotes, pressure tests, and local code checks.',
    freshness: 'Rates are static planning assumptions. Recheck pipe class, fittings, valves, tanks, pumps, sanitaryware, labour, and pressure-test costs before buying.',
    methodology: 'Combines building type, pipe material, bathrooms, tank size, labour choice, and cost tables into a bill of materials.',
    limitations: 'Not a plumbing design, public-health approval, pressure-test certificate, warranty, or guaranteed supplier quote.'
  }
];

const css = `
.qe-workflow { margin: 1.5rem 0; }
.qe-card { background:#fff; border:1px solid #d6d3d1; border-radius:8px; padding:1.2rem; box-shadow:0 8px 24px rgba(15,23,42,.06); }
.qe-card h2 { margin:0 0 .45rem; color:#292524; font-size:1.25rem; }
.qe-card p { color:#57534e; line-height:1.6; margin:.35rem 0; }
.qe-actions { display:flex; gap:.75rem; flex-wrap:wrap; margin-top:1rem; }
.qe-actions button { border:1px solid #a8a29e; background:#fff; color:#292524; border-radius:8px; padding:.7rem 1rem; font-weight:800; cursor:pointer; font-family:inherit; }
.qe-actions button:first-child { background:#44403c; color:#fff; border-color:#44403c; }
.qe-actions button:focus-visible { outline:2px solid #78716c; outline-offset:2px; }
.qe-status { min-height:1.25rem; color:#57534e; font-size:.84rem; margin:.7rem 0 0; }
.qe-verification { margin-top:1rem; display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:.75rem; }
.qe-verification div { background:#fafaf9; border:1px solid #e7e5e4; border-radius:8px; padding:.85rem; }
.qe-verification strong { display:block; color:#292524; margin-bottom:.35rem; }
.qe-verification span { color:#57534e; font-size:.86rem; line-height:1.5; }
@media (max-width: 760px) { .qe-verification { grid-template-columns:1fr; } .qe-actions button { width:100%; } }
`;

function escapeAttr(value) {
  return String(value).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

function panel(tool) {
  return `
    <section class="qe-workflow" data-queued-engineering-upgrade="${tool.slug}" data-tool-verification-panel data-tool-id="${tool.id}" aria-labelledby="${tool.slug}-workflow-title">
      <div class="qe-card">
        <h2 id="${tool.slug}-workflow-title">Exportable planning brief</h2>
        <p>Run the calculator, then copy or download a local project brief for quote comparison, client review, or site notes. Nothing is sent to a server by these actions.</p>
        <div class="qe-actions">
          <button type="button" data-qe-copy="${tool.slug}">Copy brief</button>
          <button type="button" data-qe-download="${tool.slug}" data-no-gate="true">Download TXT</button>
        </div>
        <p class="qe-status" id="${tool.slug}-qe-status" role="status" aria-live="polite"></p>
        <div class="qe-verification" aria-label="${escapeAttr(tool.title)} verification notes">
          <div><strong>Source</strong><span>${escapeAttr(tool.source)}</span></div>
          <div><strong>Freshness</strong><span>${escapeAttr(tool.freshness)}</span></div>
          <div><strong>Methodology</strong><span>${escapeAttr(tool.methodology)}</span></div>
          <div><strong>Limitations</strong><span>${escapeAttr(tool.limitations)}</span></div>
        </div>
      </div>
    </section>`;
}

function script(tool) {
  return `
<script>
(function(){
  var config = {
    title: ${JSON.stringify(tool.title)},
    slug: ${JSON.stringify(tool.slug)},
    resultSelector: ${JSON.stringify(tool.resultSelector)},
    primary: ${JSON.stringify(tool.primary)}
  };
  function clean(text){ return String(text || '').replace(/\\s+/g, ' ').trim(); }
  function labelFor(field){
    if (!field) return '';
    if (field.id) {
      var direct = document.querySelector('label[for="' + field.id + '"]');
      if (direct) return clean(direct.textContent);
    }
    var wrap = field.closest && field.closest('.en-field');
    var label = wrap && wrap.querySelector('label, .en-label');
    return clean(label ? label.textContent : (field.getAttribute('aria-label') || field.id || field.name || 'Input'));
  }
  function valueFor(field){
    if (!field) return '';
    if (field.tagName && field.tagName.toLowerCase() === 'select') {
      return clean(field.options[field.selectedIndex] ? field.options[field.selectedIndex].text : field.value);
    }
    return clean(field.value);
  }
  function captureInputs(){
    return Array.prototype.slice.call(document.querySelectorAll('.en-field input, .en-field select')).map(function(field){
      return '- ' + labelFor(field) + ': ' + valueFor(field);
    }).filter(function(line){ return line.indexOf(':') !== line.length - 1; }).slice(0, 18);
  }
  function captureResults(){
    var result = document.querySelector(config.resultSelector);
    if (!result || !result.classList.contains('on')) {
      var button = document.querySelector('button[onclick*="calc"], .en-btn');
      if (button) button.click();
      result = document.querySelector(config.resultSelector);
    }
    var primary = clean(document.querySelector(config.primary) && document.querySelector(config.primary).textContent);
    var stats = Array.prototype.slice.call(document.querySelectorAll(config.resultSelector + ' .en-stat-card')).map(function(card){
      var label = clean(card.querySelector('.en-stat-label') && card.querySelector('.en-stat-label').textContent);
      var value = clean(card.querySelector('.en-stat-value') && card.querySelector('.en-stat-value').textContent);
      return label && value ? '- ' + label + ': ' + value : '';
    }).filter(Boolean).slice(0, 12);
    return { primary: primary, stats: stats };
  }
  function buildBrief(){
    var result = captureResults();
    var lines = [
      config.title + ' - AfroTools planning brief',
      'Generated locally in this browser.',
      '',
      'Headline result: ' + (result.primary || 'Run the calculator to refresh the result.'),
      '',
      'Inputs:',
      captureInputs().join('\\n') || '- No inputs captured.',
      '',
      'Results:',
      result.stats.join('\\n') || '- No result values captured.',
      '',
      'Assumptions and checks:',
      '- Planning estimate only; confirm current supplier, contractor, professional, permit, safety, and site conditions before acting.',
      '- The calculator does not send project details to a server when copying or downloading.',
      '- Keep a quote pack with drawings, photos, measurements, and supplier terms beside this estimate.'
    ];
    return lines.join('\\n');
  }
  function status(message){
    var el = document.getElementById(config.slug + '-qe-status');
    if (el) el.textContent = message;
  }
  function copyBrief(){
    var text = buildBrief();
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function(){ status('Brief copied.'); }).catch(function(){ fallbackCopy(text); });
    } else {
      fallbackCopy(text);
    }
  }
  function fallbackCopy(text){
    var area = document.createElement('textarea');
    area.value = text;
    document.body.appendChild(area);
    area.select();
    try { document.execCommand('copy'); status('Brief selected and copied.'); }
    catch (err) { status('Brief selected. Press Ctrl+C to copy.'); }
    document.body.removeChild(area);
  }
  function downloadBrief(){
    var text = buildBrief();
    var blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var link = document.createElement('a');
    link.href = url;
    link.download = config.slug + '-planning-brief.txt';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(function(){ URL.revokeObjectURL(url); }, 1000);
    status('TXT brief downloaded.');
  }
  document.addEventListener('click', function(event){
    if (event.target.closest('[data-qe-copy="' + config.slug + '"]')) copyBrief();
    if (event.target.closest('[data-qe-download="' + config.slug + '"]')) downloadBrief();
  });
}());
</script>`;
}

let changed = 0;

for (const tool of tools) {
  const filePath = path.join(ROOT, tool.file);
  let html = fs.readFileSync(filePath, 'utf8');
  let next = html;

  if (!next.includes('data-queued-engineering-upgrade="' + tool.slug + '"')) {
    next = next.replace('</style>', css + '\n</style>');
    next = next.replace(/(\r?\n<div style="padding: 0 20px; max-width: 760px; margin: 0 auto;">)/, panel(tool) + '$1');
    next = next.replace(/(\r?\n  <script src="\/assets\/js\/engineering-toolkit\.js[^"]*" defer><\/script>)/, script(tool) + '$1');
  }

  next = next.replace(/(<\/script>\r?\n)\(function\(\)\{\r?\n  var config = \{/g, '$1<script>\n(function(){\n  var config = {');
  next = next.replace(/(\r?\n\}\(\)\);\r?\n)(\s*<script src="\/assets\/js\/engineering-toolkit\.js[^"]*" defer><\/script>)/g, '$1</script>\n$2');

  if (next !== html) {
    fs.writeFileSync(filePath, next);
    changed += 1;
    console.log('upgraded', tool.file);
  }
}

const registryPath = path.join(ROOT, 'assets/js/components/tool-registry.js');
let registry = fs.readFileSync(registryPath, 'utf8');
let nextRegistry = registry;
nextRegistry = nextRegistry.replace(
  "{ id: 'site-clearance', name: 'Site Utoaji wa freight Cost Estimator', icon: '🌿', desc: 'Estimate land clearance, excavation and levelling costs per hectare or plot. African labour rates and equipment hire.', href: '/tools/site-clearing/', category: 'engineering', tier: 'T2', status: 'queued', phase: 'QUEUED'",
  "{ id: 'site-clearance', name: 'Site Clearing Cost Estimator', icon: '🌿', desc: 'Estimate land clearance, excavation and levelling costs per hectare or plot. African labour rates and equipment hire.', href: '/tools/site-clearing/', category: 'engineering', tier: 'T2', status: 'new', phase: 'NEW'"
);
for (const tool of tools.filter((item) => item.id !== 'site-clearance')) {
  const queued = `id: '${tool.id}'`;
  nextRegistry = nextRegistry.replace(
    new RegExp(`(\\{ ${queued}[^\\n]+?)status: 'queued', phase: 'QUEUED'`),
    `$1status: 'new', phase: 'NEW'`
  );
}
if (nextRegistry !== registry) {
  fs.writeFileSync(registryPath, nextRegistry);
  changed += 1;
  console.log('promoted queued engineering registry rows');
}

console.log(`Changed ${changed} file group(s).`);
