const fs = require('fs');

const pages = [
  {
    file: 'fr/rdc/calculateur-salaire-net.html',
    toolName: 'Calculateur salaire net RDC',
    country: 'RD Congo',
    route: '/fr/rdc/calculateur-salaire-net',
    grossLabel: 'Salaire brut annuel',
    currency: 'CDF',
    grossField: 'grossSalary',
    resultField: 'resAmount',
    taxField: 'effRateDisplay',
    sourceHint: 'DGI, CNSS et references fiscales deja visibles sur la page',
    method: 'le calcul part du brut annuel, applique les cotisations salariales actives, calcule la base imposable puis applique les tranches IPR modelisees sur cette page.',
  },
  {
    file: 'fr/eq-guinea/gq-paye/index.html',
    toolName: 'Calculateur salaire net Guinee equatoriale',
    country: 'Guinee equatoriale',
    route: '/fr/eq-guinea/gq-paye',
    grossLabel: 'Salaire brut mensuel',
    currency: 'XAF',
    grossField: 'grossSalary',
    resultField: 'resAmount',
    taxField: 'effRateDisplay',
    sourceHint: 'IRPF, securite sociale et references de marche deja presentes dans le modele AfroTools',
    method: 'le calcul part du brut mensuel, annualise la base imposable, deduit la securite sociale employee puis applique les tranches IRPF modelisees.',
  },
  {
    file: 'fr/tchad/calculateur-salaire-net/index.html',
    toolName: 'Calculateur salaire net Tchad',
    country: 'Tchad',
    route: '/fr/tchad/calculateur-salaire-net',
    grossLabel: 'Salaire brut annuel',
    currency: 'XAF',
    grossField: 'grossSalary',
    resultField: 'resAmount',
    taxField: 'effRateDisplay',
    sourceHint: 'DGI, CNPS et references fiscales deja visibles sur la page',
    method: 'le calcul part du brut annuel, deduit la CNPS employee activee, applique les tranches IRPP modelisees et affiche le net ainsi que le cout employeur indicatif.',
  },
  {
    file: 'fr/tunisie/calculateur-salaire-net.html',
    toolName: 'Calculateur salaire net Tunisie',
    country: 'Tunisie',
    route: '/fr/tunisie/calculateur-salaire-net',
    grossLabel: 'Salaire brut annuel',
    currency: 'TND',
    grossField: 'grossSalary',
    resultField: 'resAmount',
    taxField: 'effRateDisplay',
    sourceHint: 'DGI Tunisie, CNSS et references fiscales deja visibles sur la page',
    method: 'le calcul part du brut annuel, deduit la CNSS salariale activee, applique les tranches IRPP modelisees et affiche le net ainsi que le cout employeur indicatif.',
  },
  {
    file: 'fr/tools/za-gepf/index.html',
    toolName: 'Calculateur GEPF Afrique du Sud',
    country: 'Afrique du Sud',
    route: '/fr/tools/za-gepf',
    grossLabel: 'Brief GEPF',
    currency: 'ZAR',
    grossField: null,
    resultField: null,
    taxField: null,
    sourceHint: 'GEPF et regles de pension visibles dans l outil source integre',
    method: 'la page prepare un brief local puis renvoie vers l outil complet pour estimer les prestations GEPF selon les champs et hypotheses de l outil source.',
  },
];

function read(file) {
  return fs.readFileSync(file, 'utf8');
}

function write(file, html) {
  fs.writeFileSync(file, html);
}

function insertBefore(html, marker, snippet, file) {
  if (!html.includes(marker)) {
    throw new Error(`Missing marker "${marker}" in ${file}`);
  }
  return html.replace(marker, `${snippet}\n${marker}`);
}

function insertBeforeLast(html, marker, snippet, file) {
  const idx = html.lastIndexOf(marker);
  if (idx === -1) {
    throw new Error(`Missing marker "${marker}" in ${file}`);
  }
  return `${html.slice(0, idx)}${snippet}\n${html.slice(idx)}`;
}

function removeExportScript(html) {
  return html.replace(
    /<script type="application\/json" data-fr-payroll-config>[\s\S]*?<\/script>\s*<script data-fr-payroll-batch="export-js">[\s\S]*?<\/script>\s*/g,
    ''
  );
}

function ensureHeadScript(html, src) {
  if (html.includes(src)) return html;
  const script = `<script src="${src}" defer></script>`;
  if (html.includes('<script src="/assets/js/components/footer.min.js')) {
    return html.replace(/(<script src="\/assets\/js\/components\/footer\.min\.js[^>]*><\/script>)/, `$1\n${script}`);
  }
  return html.replace('</head>', `${script}\n</head>`);
}

function ensureMobileGuard(html, file) {
  const style = `<style data-fr-payroll-batch="mobile-guard">
@media (max-width:640px){
  html{max-width:100%;overflow-x:hidden}
  .tool-main-inner{grid-template-columns:minmax(0,1fr)!important;overflow-x:hidden}
  .tool-main-inner>*{min-width:0;max-width:100%}
  .fr-payroll-trust{box-sizing:border-box;max-width:calc(100% - 24px)!important;margin-left:12px!important;margin-right:12px!important}
  .fr-payroll-trust [style*="display:flex"]{max-width:100%}
  .fr-payroll-trust button{white-space:normal}
}
</style>`;
  if (html.includes('data-fr-payroll-batch="mobile-guard"')) {
    return html.replace(/<style data-fr-payroll-batch="mobile-guard">[\s\S]*?<\/style>/, style);
  }
  return insertBefore(html, '</head>', style, file);
}

function panel(page) {
  return `<section class="fr-payroll-trust" data-tool-verification-panel data-fr-payroll-batch="trust" style="max-width:980px;margin:28px auto;padding:18px 20px;border:1px solid #bfdbfe;border-radius:14px;background:#fff;color:#334155;line-height:1.65">
  <h2 style="margin:0 0 10px;color:#0f172a;font-size:1.12rem">Methodology, sources et limites</h2>
  <p><strong>Source/reference:</strong> ${page.sourceHint}. Confirmez les taux, plafonds, exemptions, formulaires, dates d entree en vigueur et obligations de depot avec l administration fiscale, sociale ou le gestionnaire officiel avant paie finale.</p>
  <p><strong>Methodology:</strong> ${page.method} Les arrondis, seuils et options proviennent du modele local deja charge par cette page.</p>
  <p><strong>Derniere revue de cette page:</strong> 22 juin 2026. Les regles de paie, fiscalite, pension et securite sociale peuvent changer. Utilisez ce resultat comme estimation de preparation, pas comme bulletin officiel, declaration fiscale, conseil fiscal, legal ou RH.</p>
  <p><strong>Confidentialite locale:</strong> les champs saisis et le resume exporte restent dans votre navigateur pour cette page. Les fonctions IA existantes de la plateforme doivent demander le consentement avant tout envoi de contenu prive.</p>
</section>`;
}

function cta(page) {
  return `<div class="fr-payroll-trust" data-fr-payroll-batch="cta" style="max-width:980px;margin:22px auto;padding:0 20px">
  <afro-business-cta tool-name="${page.toolName}" save-note="Calculez, copiez ou telechargez un resume local, puis verifiez les taux officiels avant paie finale."></afro-business-cta>
</div>`;
}

function exportPanel(page) {
  return `<section class="fr-payroll-trust" data-fr-payroll-batch="export" style="max-width:980px;margin:22px auto;padding:18px 20px;border:1px solid #dbeafe;border-radius:14px;background:#f8fbff;color:#334155;line-height:1.65">
  <h2 style="margin:0 0 8px;color:#0f172a;font-size:1.05rem">Exporter un resume de travail</h2>
  <p style="margin:0 0 12px">Copiez ou telechargez un resume TXT pour comparer une offre, preparer une discussion RH/paie ou garder vos hypotheses. Le resume est genere localement.</p>
  <div style="display:flex;flex-wrap:wrap;gap:10px;align-items:center">
    <button type="button" class="btn btn-primary" data-fr-payroll-copy>Copier le resume</button>
    <button type="button" class="btn btn-secondary" data-fr-payroll-download>Telecharger TXT</button>
    <span data-fr-payroll-status aria-live="polite" style="color:#64748b;font-size:.9rem"></span>
  </div>
</section>`;
}

function exportScript(page) {
  const config = JSON.stringify({
    toolName: page.toolName,
    country: page.country,
    route: page.route,
    grossLabel: page.grossLabel,
    currency: page.currency,
    grossField: page.grossField,
    resultField: page.resultField,
    taxField: page.taxField,
  }).replace(/</g, '\\u003c');
  return `<script type="application/json" data-fr-payroll-config>${config}</script>
<script data-fr-payroll-batch="export-js">
!function(){
  "use strict";
  function textFrom(id){
    if(!id) return "";
    var el=document.getElementById(id);
    return el ? ((el.value || el.textContent || "").trim()) : "";
  }
  function buildBrief(config){
    var lines=[
      "AfroTools - resume paie / pension",
      "Outil: "+config.toolName,
      "Pays/contexte: "+config.country,
      "Date de preparation: 22 juin 2026",
      "Route: "+config.route,
      "",
      config.grossLabel+": "+(textFrom(config.grossField)||"non renseigne"),
      "Resultat principal: "+(textFrom(config.resultField)||"a calculer dans l outil"),
      "Taux effectif / indicateur: "+(textFrom(config.taxField)||"a verifier"),
      "Devise: "+config.currency,
      "",
      "A verifier: taux officiels, plafonds, exemptions, cotisations sociales, pension, formulaires, dates d effet et obligations de depot.",
      "Limite: estimation de preparation uniquement; pas un bulletin officiel, une declaration fiscale, un conseil fiscal, legal ou RH."
    ];
    return lines.join("\\n");
  }
  function download(name,text){
    var blob=new Blob([text],{type:"text/plain"});
    var a=document.createElement("a");
    a.href=URL.createObjectURL(blob);
    a.download=name;
    a.click();
    setTimeout(function(){URL.revokeObjectURL(a.href);},250);
  }
  function fallbackCopy(text,status){
    var ta=document.createElement("textarea");
    ta.value=text;
    ta.setAttribute("readonly","");
    ta.style.position="fixed";
    ta.style.left="0";
    ta.style.top="0";
    ta.style.width="1px";
    ta.style.height="1px";
    ta.style.opacity="0";
    ta.style.pointerEvents="none";
    document.body.appendChild(ta);
    ta.select();
    try{document.execCommand("copy");status.textContent="Resume copie.";}
    catch(e){status.textContent="Copie indisponible; utilisez le telechargement TXT.";}
    document.body.removeChild(ta);
  }
  document.addEventListener("DOMContentLoaded",function(){
    document.querySelectorAll("[data-fr-payroll-config]").forEach(function(node){
      var config=JSON.parse(node.textContent);
      var panel=node.previousElementSibling;
      while(panel && !panel.matches("[data-fr-payroll-batch='export']")) panel=panel.previousElementSibling;
      if(!panel) panel=document;
      var copy=panel.querySelector("[data-fr-payroll-copy]");
      var dl=panel.querySelector("[data-fr-payroll-download]");
      var status=panel.querySelector("[data-fr-payroll-status]") || { textContent: "" };
      if(copy) copy.addEventListener("click",function(){
        var brief=buildBrief(config);
        status.textContent="Copie en cours...";
        if(navigator.clipboard&&navigator.clipboard.writeText){
          navigator.clipboard.writeText(brief).then(function(){status.textContent="Resume copie.";},function(){fallbackCopy(brief,status);});
        } else {
          fallbackCopy(brief,status);
        }
      });
      if(dl) dl.addEventListener("click",function(){
        download(config.toolName.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"") + "-resume.txt", buildBrief(config));
        status.textContent="Fichier TXT prepare.";
      });
    });
  });
}();
</script>`;
}

let updated = 0;
for (const page of pages) {
  let html = read(page.file);
  const before = html;

  html = removeExportScript(html);
  html = ensureHeadScript(html, '/assets/js/components/business-cta.js');
  html = ensureMobileGuard(html, page.file);

  if (!html.includes('data-fr-payroll-batch="trust"')) {
    html = insertBefore(html, '<afro-footer></afro-footer>', panel(page), page.file);
  }
  if (!html.includes('data-fr-payroll-batch="export"')) {
    html = insertBefore(html, '<afro-footer></afro-footer>', exportPanel(page), page.file);
  }
  if (!html.includes('data-fr-payroll-batch="cta"')) {
    html = insertBefore(html, '<afro-footer></afro-footer>', cta(page), page.file);
  }
  html = insertBeforeLast(html, '</body>', exportScript(page), page.file);

  if (html !== before) {
    write(page.file, html);
    updated += 1;
  }
}

console.log(`Done. Updated ${updated} of ${pages.length} French payroll/pension pages.`);
