#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

const TARGETS = [
  {
    rel: 'sw/gambia/kikokotoo-kodi-mshahara/index.html',
    toolName: 'Kikokotoo cha Kodi ya Mshahara Gambia',
    context: 'Gambia PAYE, SSHFC na mshahara halisi',
  },
  {
    rel: 'sw/south-sudan/kikokotoo-kodi-mshahara/index.html',
    toolName: 'Kikokotoo cha Kodi ya Mshahara Sudani Kusini',
    context: 'Sudani Kusini PAYE, NSIF na mshahara halisi',
  },
  {
    rel: 'sw/liberia/kikokotoo-kodi-mshahara/index.html',
    toolName: 'Kikokotoo cha Kodi ya Mshahara Liberia',
    context: 'Liberia PAYE, NASSCORP na mshahara halisi',
  },
  {
    rel: 'sw/sierra-leone/kikokotoo-kodi-mshahara/index.html',
    toolName: 'Kikokotoo cha Kodi ya Mshahara Sierra Leone',
    context: 'Sierra Leone PAYE, NASSIT na mshahara halisi',
  },
  {
    rel: 'sw/zana/kikokotoo-mfuko-wa-nyumba/index.html',
    toolName: 'Kikokotoo cha Mfuko wa Nyumba Afrika',
    context: 'michango ya nyumba, ruzuku, ustahiki na uwezo wa kumudu',
  },
];

function read(rel) {
  return fs.readFileSync(path.join(ROOT, rel), 'utf8');
}

function write(rel, html) {
  fs.writeFileSync(path.join(ROOT, rel), html, 'utf8');
}

function ensureBusinessCtaScript(html) {
  if (/components\/business-cta(?:\.min)?\.js/i.test(html)) return html;
  const script = '<script src="/assets/js/components/business-cta.js" defer></script>';
  if (/<script src="\/assets\/js\/components\/footer[^"]*" defer><\/script>/i.test(html)) {
    return html.replace(/(<script src="\/assets\/js\/components\/footer[^"]*" defer><\/script>)/i, `$1\n${script}`);
  }
  return html.replace(/<\/head>/i, `${script}\n</head>`);
}

function insertBeforeFooter(html, marker, block) {
  if (html.includes(marker)) return html;
  if (!/<afro-footer\b/i.test(html)) {
    throw new Error(`Unable to find footer for marker ${marker}`);
  }
  return html.replace(/<afro-footer\b/i, `${block}\n<afro-footer`);
}

function trustPanel(toolName, context) {
  return `<!-- localized-tax-trust-panel -->
<section class="section panel localized-trust-panel" data-tool-verification-panel style="max-width:1100px;margin:24px auto;padding:18px 20px;border:1px solid #dbeafe;background:#fff;border-radius:14px;box-shadow:0 10px 28px rgba(15,23,42,.06);">
  <h2 style="margin:0 0 10px;color:#0f172a;">Methodology / Mbinu, sources and freshness</h2>
  <p style="margin:0 0 10px;color:#334155;line-height:1.65;"><strong>Methodology:</strong> ${toolName} hutumia kiasi ulichoingiza, muktadha wa ${context}, na breakdown inayoonekana kwenye ukurasa huu ili kutoa planning estimate inayoweza kunakiliwa, kupakuliwa au kuhifadhiwa.</p>
  <p style="margin:0 0 10px;color:#334155;line-height:1.65;"><strong>Sources and freshness 2026:</strong> Hakiki viwango vya sasa, thresholds, deadlines, employer contributions, regulator guidance na forms kwenye official revenue authority, social-security authority, employer payroll policy au mshauri mwenye sifa kabla ya kulipa au kuwasilisha.</p>
  <p style="margin:0;color:#7c2d12;line-height:1.65;"><strong>Disclaimer:</strong> This is not official filing, not tax advice, not legal advice and not a guarantee. Ni makadirio ya kupanga tu; verify with the relevant authority before acting.</p>
</section>`;
}

function businessCta(toolName, note) {
  return `<!-- localized-tax-business-cta -->
<afro-business-cta tool-name="${toolName}" save-note="${note}"></afro-business-cta>`;
}

function upgradePayeLikePages() {
  let changed = 0;
  for (const target of TARGETS) {
    let html = read(target.rel);
    const before = html;
    html = ensureBusinessCtaScript(html);
    html = insertBeforeFooter(
      html,
      '<!-- localized-tax-trust-panel -->',
      trustPanel(target.toolName, target.context),
    );
    html = insertBeforeFooter(
      html,
      '<!-- localized-tax-business-cta -->',
      businessCta(target.toolName, 'Hifadhi scenario, pakua PDF/TXT au tumia matokeo haya kuomba dashboard ya payroll, tax au finance kwa timu yako.'),
    );
    if (html !== before) {
      write(target.rel, html);
      changed += 1;
      console.log(`UPDATED ${target.rel}`);
    }
  }
  return changed;
}

function upgradeBusinessTaxHub() {
  const rel = 'sw/mshahara-na-kodi/business-tax/index.html';
  let html = read(rel);
  const before = html;
  html = ensureBusinessCtaScript(html);
  if (!html.includes('data-sw-business-tax-overflow-style')) {
    html = html.replace(
      '</head>',
      '<style data-sw-business-tax-overflow-style>.shub-hero-stats{min-width:0}.shub-hero-stats .shub-stat-pill{white-space:normal;overflow-wrap:anywhere;max-width:100%}@media(max-width:640px){.shub-hero-stats{align-items:stretch}.shub-hero-stats .shub-stat-pill{width:100%;justify-content:flex-start}}</style>\n</head>',
    );
  }
  html = html.replace(
    '<section data-sw-finance-planner style="max-width:1120px;margin:24px auto;padding:0 20px;">',
    '<section data-sw-finance-planner data-tool-verification-panel style="max-width:1120px;margin:24px auto;padding:0 20px;">',
  );
  html = html.replace(
    '<p style="margin:0 0 14px;color:#475569;line-height:1.65;"><strong>Mbinu:</strong>',
    '<p style="margin:0 0 14px;color:#475569;line-height:1.65;"><strong>Methodology / Mbinu:</strong>',
  );
  html = html.replace(
    '<button type="button" data-sw-fin-button style="border:0;border-radius:999px;background:#0369a1;color:#fff;font-weight:900;padding:10px 15px;cursor:pointer;">Tengeneza muhtasari</button><span data-sw-fin-status aria-live="polite" style="align-self:center;color:#64748b;"></span>',
    '<button type="button" data-sw-fin-button style="border:0;border-radius:999px;background:#0369a1;color:#fff;font-weight:900;padding:10px 15px;cursor:pointer;">Tengeneza muhtasari</button><button type="button" data-sw-fin-copy style="border:0;border-radius:999px;background:#0f172a;color:#fff;font-weight:900;padding:10px 15px;cursor:pointer;">Nakili</button><button type="button" data-sw-fin-download style="border:0;border-radius:999px;background:#166534;color:#fff;font-weight:900;padding:10px 15px;cursor:pointer;">Download TXT</button><span data-sw-fin-status aria-live="polite" style="align-self:center;color:#64748b;"></span>',
  );
  html = html.replace(
    '<p style="margin:12px 0 0;color:#475569;line-height:1.65;"><strong>Kanusho:</strong>',
    '<p style="margin:12px 0 0;color:#475569;line-height:1.65;"><strong>Sources and freshness 2026:</strong> hakiki viwango, exemptions, thresholds na forms na official revenue authority au mshauri mwenye sifa. <strong>Disclaimer / Kanusho:</strong>',
  );
  html = insertBeforeFooter(
    html,
    '<!-- localized-tax-business-cta -->',
    businessCta('Kodi za Biashara na Mtaji Afrika', 'Nakili au pakua muhtasari wa kodi za biashara, kisha tumia CTA hii kwa calculator, widget au API inayofaa timu yako.'),
  );
  if (!html.includes('data-sw-fin-copy')) {
    throw new Error('Business tax copy controls were not inserted');
  }
  if (!html.includes('swFinanceDownload')) {
    const financeExportScript = `<script>
(function(){
  const root = document.querySelector('[data-sw-finance-planner]');
  if (!root) return;
  const output = root.querySelector('[data-sw-fin-output]');
  const status = root.querySelector('[data-sw-fin-status]');
  function currentText(){
    const text = output ? output.textContent.trim() : '';
    return text || 'Ongeza maelezo ili kupata muhtasari wa kuthibitisha.';
  }
  function setStatus(text){ if (status) status.textContent = text; }
  root.querySelector('[data-sw-fin-copy]')?.addEventListener('click', function(){
    const text = currentText();
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function(){ setStatus('Muhtasari umenakiliwa.'); }).catch(function(){ setStatus('Nakili kwa mkono ikiwa ruhusa imezuiwa.'); });
    } else {
      setStatus(text);
    }
  });
  root.querySelector('[data-sw-fin-download]')?.addEventListener('click', function swFinanceDownload(){
    const blob = new Blob([currentText() + '\\n\\nAfroTools - planning estimate only. Verify with the official authority before acting.'], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'muhtasari-kodi-biashara-afrotools.txt';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    setStatus('Faili ya TXT imepakuliwa.');
  });
})();
</script>`;
    html = html.replace(/<\/body>/i, `${financeExportScript}\n</body>`);
  }
  if (html !== before) {
    write(rel, html);
    console.log(`UPDATED ${rel}`);
    return 1;
  }
  return 0;
}

function upgradeSwTinGuide() {
  const rel = 'sw/zana/mwongozo-tin/index.html';
  let html = read(rel);
  const before = html;
  const tinControls = '<div class="sw-actions"><button type="button" class="sw-button" data-tin-copy>Nakili brief</button><button type="button" class="sw-button" data-tin-download>Download TXT</button><span id="tinExportStatus" aria-live="polite" class="sw-muted"></span></div>';
  const tinCta = businessCta('Mwongozo wa TIN Afrika', 'Nakili au pakua brief ya nchi, kisha tumia AfroTools kwa VAT, ankara, PAYE au usajili wa biashara.');
  html = ensureBusinessCtaScript(html);
  if (!html.includes('data-tin-copy')) {
    html = html.replace(
      '<div class="sw-result" id="tinResult" aria-live="polite"></div>',
      `<div class="sw-result" id="tinResult" aria-live="polite"></div>${tinControls}`,
    );
  }
  html = html.split(`${tinControls}${tinControls}`).join(tinControls);
  html = html.replace(
    '<h2>Mbinu, vyanzo na mipaka</h2>',
    '<h2>Methodology / Mbinu, sources and freshness 2026</h2>',
  );
  html = html.replace(
    /<p>(?:Methodology: matokeo hutumia nchi uliyochagua, jina la TIN\/PIN\/TRN, authority abbreviation, processing time na viungo vya nchi\. )*Matokeo hutumia namba ulizoingiza kwenye ukurasa huu\. Tumia kama makadirio ya kupanga, kulinganisha au kuandaa maswali, si kama uamuzi wa mwisho wa kodi, mkopo, mshahara, uwekezaji, usajili au compliance\.<\/p>/,
    '<p>Methodology: matokeo hutumia nchi uliyochagua, jina la TIN/PIN/TRN, authority abbreviation, processing time na viungo vya nchi. Matokeo hutumia namba ulizoingiza kwenye ukurasa huu. Tumia kama makadirio ya kupanga, kulinganisha au kuandaa maswali, si kama uamuzi wa mwisho wa kodi, mkopo, mshahara, uwekezaji, usajili au compliance.</p>',
  );
  html = html.replace(
    'Thibitisha viwango, ada, tarehe, masharti, minimum wage, PAYE, VAT, TIN, riba au nyaraka',
    'Sources and freshness 2026: thibitisha viwango, ada, tarehe, masharti, minimum wage, PAYE, VAT, TIN, riba au nyaraka',
  );
  if (!html.includes('<!-- localized-tax-business-cta -->')) {
    html = html.replace(
      '</main>\n<script src="/data/legal/tin-guide-data.js',
      `${tinCta}
</main>
<script src="/data/legal/tin-guide-data.js`,
    );
  }
  html = html.split(`${tinCta}\n${tinCta}`).join(tinCta);
  if (!html.includes('swTinDownload')) {
    html = html.replace(
      '</script>\n<afro-footer>',
      `</script>
<script>
(function(){
  function selectedTin(){
    var select = document.getElementById('tinCountry');
    var item = select && window.TIN_COUNTRIES ? TIN_COUNTRIES.find(function(c){ return c.slug === select.value; }) : null;
    if (!item) return 'Chagua nchi kwanza kwenye Mwongozo wa TIN Afrika.';
    return 'Mwongozo wa TIN AfroTools\\nNchi: ' + item.sw + '\\nTIN: ' + item.tinName + '\\nMamlaka: ' + item.authorityAbbr + '\\nGharama: ' + item.cost + '\\nMuda: ' + item.processingTime + '\\n\\nDisclaimer: planning estimate only. Verify with the official revenue authority before acting.';
  }
  function status(text){ var el = document.getElementById('tinExportStatus'); if (el) el.textContent = text; }
  document.querySelector('[data-tin-copy]')?.addEventListener('click', function(){
    var text = selectedTin();
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function(){ status('Brief imenakiliwa.'); }).catch(function(){ status('Nakili kwa mkono ikiwa ruhusa imezuiwa.'); });
    } else {
      status(text);
    }
  });
  document.querySelector('[data-tin-download]')?.addEventListener('click', function swTinDownload(){
    var blob = new Blob([selectedTin()], { type: 'text/plain' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'mwongozo-tin-afrotools.txt';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    status('Faili ya TXT imepakuliwa.');
  });
})();
</script>
<afro-footer>`,
    );
  }
  if (html !== before) {
    write(rel, html);
    console.log(`UPDATED ${rel}`);
    return 1;
  }
  return 0;
}

function upgradeSwSimChecker() {
  const rel = 'sw/zana/ukaguzi-usajili-wa-sim/index.html';
  let html = read(rel);
  const before = html;
  html = ensureBusinessCtaScript(html);
  html = html.replace(
    '<h2 style="margin:0 0 8px;color:#0f172a;">Muhtasari wa SIM na chanzo</h2><p data-methodology style="margin:0 0 10px;">Chagua nchi, kagua mahitaji ya KYC/SIM, kisha nakili checklist ya hatua inayofuata.</p><p data-official-source data-disclaimer style="margin:0 0 12px;"><strong>Chanzo cha mwisho:</strong>',
    '<h2 style="margin:0 0 8px;color:#0f172a;">Methodology / Mbinu, SIM sources and freshness 2026</h2><p data-methodology style="margin:0 0 10px;"><strong>Methodology:</strong> chagua nchi, kagua mahitaji ya KYC/SIM, deadline, check code na operator list, kisha nakili au pakua checklist ya hatua inayofuata.</p><p data-official-source data-disclaimer style="margin:0 0 12px;"><strong>Sources and freshness 2026:</strong>',
  );
  html = html.replace(
    '<button type="button" id="simCopyBrief" style="border:0;border-radius:10px;background:#1d4ed8;color:#fff;font-weight:900;padding:10px 14px;cursor:pointer">Nakili checklist</button> <span id="simCopyStatus"',
    '<button type="button" id="simCopyBrief" style="border:0;border-radius:10px;background:#1d4ed8;color:#fff;font-weight:900;padding:10px 14px;cursor:pointer">Nakili checklist</button> <button type="button" id="simDownloadBrief" style="border:0;border-radius:10px;background:#166534;color:#fff;font-weight:900;padding:10px 14px;cursor:pointer">Download TXT</button> <span id="simCopyStatus"',
  );
  if (!html.includes('not telecom advice')) {
    html = html.replace(
      'Mahitaji ya SIM, biometric, NIN, ID na deadlines hubadilika.',
      'Mahitaji ya SIM, biometric, NIN, ID na deadlines hubadilika. <strong>Disclaimer:</strong> not official, not legal advice, not telecom advice; verify with the regulator or operator before acting.',
    );
  }
  const simDisclaimer = '<strong>Disclaimer:</strong> not official, not legal advice, not telecom advice; verify with the regulator or operator before acting.';
  html = html.split(`${simDisclaimer} ${simDisclaimer}`).join(simDisclaimer);
  html = insertBeforeFooter(
    html,
    '<!-- localized-tax-business-cta -->',
    businessCta('Ukaguzi Usajili wa SIM', 'Pakia brief ya SIM/KYC kwa operesheni ya agent, field team au customer onboarding workflow.'),
  );
  html = html.replace(
    "var btn=document.getElementById('simCopyBrief'), status=document.getElementById('simCopyStatus');",
    "var btn=document.getElementById('simCopyBrief'), download=document.getElementById('simDownloadBrief'), status=document.getElementById('simCopyStatus');",
  );
  if (!html.includes('simDownloadFile')) {
    html = html.replace(
      "if(btn) btn.addEventListener('click', function(){ var text=swSimBrief(); if(navigator.clipboard&&navigator.clipboard.writeText){ navigator.clipboard.writeText(text).then(function(){ if(status) status.textContent='Checklist imenakiliwa.'; }).catch(function(){ if(status) status.textContent='Nakili kwa mkono ikiwa ruhusa imezuiwa.'; }); } });",
      "if(btn) btn.addEventListener('click', function(){ var text=swSimBrief(); if(navigator.clipboard&&navigator.clipboard.writeText){ navigator.clipboard.writeText(text).then(function(){ if(status) status.textContent='Checklist imenakiliwa.'; }).catch(function(){ if(status) status.textContent='Nakili kwa mkono ikiwa ruhusa imezuiwa.'; }); } });\n  if(download) download.addEventListener('click', function simDownloadFile(){ var blob=new Blob([swSimBrief()],{type:'text/plain'}); var url=URL.createObjectURL(blob); var a=document.createElement('a'); a.href=url; a.download='ukaguzi-sim-afrotools.txt'; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url); if(status) status.textContent='Faili ya TXT imepakuliwa.'; });",
    );
  }
  if (html !== before) {
    write(rel, html);
    console.log(`UPDATED ${rel}`);
    return 1;
  }
  return 0;
}

function upgradeHausaTin() {
  const rel = 'ha/kayan-aiki/jagorar-tin-najeriya/index.html';
  let html = read(rel);
  const before = html;
  html = ensureBusinessCtaScript(html);
  html = html.replace(
    '<button type="button" data-action-copy>Kwafi takaitawa</button><span class="ha-action-status"',
    '<button type="button" data-action-copy>Kwafi takaitawa</button><button type="button" data-action-download>Download TXT</button><span class="ha-action-status"',
  );
  html = insertBeforeFooter(
    html,
    '<!-- localized-tax-trust-panel -->',
    `<!-- localized-tax-trust-panel -->
<section class="section panel localized-trust-panel" data-tool-verification-panel style="max-width:1080px;margin:24px auto;padding:18px 20px;border:1px solid #dbeafe;background:#fff;border-radius:14px;box-shadow:0 10px 28px rgba(15,23,42,.06);">
  <h2 style="margin:0 0 10px;color:#0f172a;">Methodology / Hanya, sources and freshness 2026</h2>
  <p style="margin:0 0 10px;color:#334155;line-height:1.65;"><strong>Methodology:</strong> wannan shafi yana tattara takardun TIN, hukumomin FIRS/SIRS/CAC/JTB, lokacin aiki da gargadi domin ka shirya tambayoyi ko checklist kafin ka je official portal.</p>
  <p style="margin:0 0 10px;color:#334155;line-height:1.65;"><strong>Sources and freshness 2026:</strong> tabbatar da bukatun yanzu, kudade, forms, deadlines da matakan compliance da official revenue authority, CAC, JTB ko kwararren mai haraji.</p>
  <p style="margin:0;color:#7c2d12;line-height:1.65;"><strong>Disclaimer:</strong> not official, not tax advice and not legal advice. Wannan planning estimate ne kawai; verify with the relevant authority before acting.</p>
</section>`,
  );
  html = insertBeforeFooter(
    html,
    '<!-- localized-tax-business-cta -->',
    businessCta('Jagorar TIN Najeriya', 'Kwafi ko sauke takaitawar TIN, sannan ka hade ta da VAT, invoice ko business-registration workflow.'),
  );
  if (!html.includes('haTinDownload')) {
    html = html.replace(
      '</script>\n</body>',
      `</script>
<script>
(function(){
  document.querySelectorAll('[data-ha-action-planner]').forEach(function(panel){
    var status = panel.querySelector('[data-action-status]');
    var output = panel.querySelector('[data-action-output]');
    var button = panel.querySelector('[data-action-download]');
    if (!button) return;
    button.addEventListener('click', function haTinDownload(){
      var text = output && output.textContent ? output.textContent.trim() : 'Jagorar TIN Najeriya - planning estimate only.';
      var blob = new Blob([text + '\\n\\nAfroTools: not official, not tax advice, not legal advice. Verify with FIRS, SIRS, CAC or JTB before acting.'], { type: 'text/plain' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = 'jagorar-tin-najeriya-afrotools.txt';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      if (status) status.textContent = 'An sauke TXT.';
    });
  });
})();
</script>
</body>`,
    );
  }
  if (html !== before) {
    write(rel, html);
    console.log(`UPDATED ${rel}`);
    return 1;
  }
  return 0;
}

function run() {
  let changed = 0;
  changed += upgradePayeLikePages();
  changed += upgradeBusinessTaxHub();
  changed += upgradeSwTinGuide();
  changed += upgradeSwSimChecker();
  changed += upgradeHausaTin();
  console.log(`Done. Updated ${changed} localized tax/TIN/SIM pages.`);
}

run();
