const fs = require('fs');

const leasePages = [
  ['fr/tools/contrat-bail/cote-d-ivoire.html', "Cote d'Ivoire"],
  ['fr/tools/contrat-bail/algeria.html', 'Algeria'],
  ['fr/tools/contrat-bail/angola.html', 'Angola'],
  ['fr/tools/contrat-bail/botswana.html', 'Botswana'],
  ['fr/tools/contrat-bail/burkina-faso.html', 'Burkina Faso'],
  ['fr/tools/contrat-bail/comoros.html', 'Comoros'],
  ['fr/tools/contrat-bail/dr-congo.html', 'DR Congo'],
  ['fr/tools/contrat-bail/equatorial-guinea.html', 'Equatorial Guinea'],
  ['fr/tools/contrat-bail/eritrea.html', 'Eritrea'],
  ['fr/tools/contrat-bail/eswatini.html', 'Eswatini'],
  ['fr/tools/contrat-bail/ethiopia.html', 'Ethiopia'],
  ['fr/tools/contrat-bail/guinea-bissau.html', 'Guinea-Bissau'],
  ['fr/tools/contrat-bail/madagascar.html', 'Madagascar'],
  ['fr/tools/contrat-bail/mali.html', 'Mali'],
  ['fr/tools/contrat-bail/mauritania.html', 'Mauritania'],
  ['fr/tools/contrat-bail/mauritius.html', 'Mauritius'],
  ['fr/tools/contrat-bail/mozambique.html', 'Mozambique'],
  ['fr/tools/contrat-bail/niger.html', 'Niger'],
  ['fr/tools/contrat-bail/sao-tome-and-principe.html', 'Sao Tome and Principe'],
  ['fr/tools/contrat-bail/sierra-leone.html', 'Sierra Leone'],
  ['fr/tools/contrat-bail/somalia.html', 'Somalia'],
  ['fr/tools/contrat-bail/south-africa.html', 'South Africa'],
  ['fr/tools/contrat-bail/togo.html', 'Togo'],
  ['fr/tools/contrat-bail/tunisia.html', 'Tunisia'],
  ['fr/tools/contrat-bail/zambia.html', 'Zambia'],
  ['fr/tools/contrat-bail/zimbabwe.html', 'Zimbabwe'],
];

const pages = [
  ...leasePages.map(([file]) => file),
  'fr/tools/commission-agent/index.html',
  'fr/tools/assurance-auto/cote-d-ivoire.html',
];

const familyInsurancePages = [
  {
    file: 'fr/tools/comparateur-assurance-sante/ethiopia.html',
    country: 'Ethiopia',
    type: 'health',
    toolName: 'Comparateur assurance sante - Ethiopia',
  },
  {
    file: 'fr/tools/comparateur-assurance-sante/morocco.html',
    country: 'Morocco',
    type: 'health',
    toolName: 'Comparateur assurance sante - Morocco',
  },
  {
    file: 'fr/tools/comparateur-assurance-sante/rwanda.html',
    country: 'Rwanda',
    type: 'health',
    toolName: 'Comparateur assurance sante - Rwanda',
  },
  {
    file: 'fr/tools/assurance-obseques/ethiopia.html',
    country: 'Ethiopia',
    type: 'funeral',
    toolName: 'Assurance obseques - Ethiopia',
  },
  {
    file: 'fr/tools/assurance-obseques/morocco.html',
    country: 'Morocco',
    type: 'funeral',
    toolName: 'Assurance obseques - Morocco',
  },
  {
    file: 'fr/tools/assurance-obseques/rwanda.html',
    country: 'Rwanda',
    type: 'funeral',
    toolName: 'Assurance obseques - Rwanda',
  },
];

pages.push(...familyInsurancePages.map((page) => page.file));

const autoInsurancePages = [
  { file: 'fr/tools/assurance-auto/angola.html', country: 'Angola', slug: 'angola', toolName: 'Assurance auto - Angola' },
  { file: 'fr/tools/assurance-auto/cameroon.html', country: 'Cameroon', slug: 'cameroon', toolName: 'Assurance auto - Cameroon' },
  { file: 'fr/tools/assurance-auto/egypt.html', country: 'Egypt', slug: 'egypt', toolName: 'Assurance auto - Egypt' },
  { file: 'fr/tools/assurance-auto/eritrea.html', country: 'Eritrea', slug: 'eritrea', toolName: 'Assurance auto - Eritrea' },
  { file: 'fr/tools/assurance-auto/gambia.html', country: 'Gambia', slug: 'gambia', toolName: 'Assurance auto - Gambia' },
  { file: 'fr/tools/assurance-auto/kenya.html', country: 'Kenya', slug: 'kenya', toolName: 'Assurance auto - Kenya' },
  { file: 'fr/tools/assurance-auto/lesotho.html', country: 'Lesotho', slug: 'lesotho', toolName: 'Assurance auto - Lesotho' },
  { file: 'fr/tools/assurance-auto/liberia.html', country: 'Liberia', slug: 'liberia', toolName: 'Assurance auto - Liberia' },
  { file: 'fr/tools/assurance-auto/libya.html', country: 'Libya', slug: 'libya', toolName: 'Assurance auto - Libya' },
  { file: 'fr/tools/assurance-auto/nigeria.html', country: 'Nigeria', slug: 'nigeria', toolName: 'Assurance auto - Nigeria' },
  { file: 'fr/tools/assurance-auto/somalia.html', country: 'Somalia', slug: 'somalia', toolName: 'Assurance auto - Somalia' },
  { file: 'fr/tools/assurance-auto/south-africa.html', country: 'South Africa', slug: 'south-africa', toolName: 'Assurance auto - South Africa' },
  { file: 'fr/tools/assurance-auto/sudan.html', country: 'Sudan', slug: 'sudan', toolName: 'Assurance auto - Sudan' },
  { file: 'fr/tools/assurance-auto/uganda.html', country: 'Uganda', slug: 'uganda', toolName: 'Assurance auto - Uganda' },
  { file: 'fr/tools/assurance-auto/zambia.html', country: 'Zambia', slug: 'zambia', toolName: 'Assurance auto - Zambia' },
];

pages.push(...autoInsurancePages.map((page) => page.file));

function read(file) {
  return fs.readFileSync(file, 'utf8');
}

function write(file, html) {
  fs.writeFileSync(file, html);
}

function insertBefore(html, marker, snippet) {
  if (!html.includes(marker)) {
    throw new Error(`Missing marker: ${marker}`);
  }
  return html.replace(marker, `${snippet}\n${marker}`);
}

function ensureHeadScript(html, src) {
  if (html.includes(src)) return html;
  const script = `<script src="${src}" defer></script>`;
  if (html.includes('<script src="/assets/js/components/footer.min.js')) {
    return html.replace(/(<script src="\/assets\/js\/components\/footer\.min\.js[^>]+><\/script>)/, `$1${script}`);
  }
  return html.replace('</head>', `${script}\n</head>`);
}

function applyFamilyInsuranceCopy(html) {
  return html
    .replace(/Calculer Your Estimate/g, 'Calculer votre estimation')
    .replace(/Primary Member Age/g, 'Age du membre principal')
    .replace(/Number of Dependents/g, 'Nombre de personnes a charge')
    .replace(/Budget Level/g, 'Niveau de budget')
    .replace(/Pre-existing Conditions\?/g, 'Conditions preexistantes ?')
    .replace(/Annuel Premium Range/g, 'Fourchette de prime annuelle')
    .replace(/Mensuel Premium Range/g, 'Fourchette de prime mensuelle')
    .replace(/National scheme:/g, 'Regime national :')
    .replace(/Funeral Type/g, "Type d'obseques")
    .replace(/Desired Cover Amount/g, 'Montant de couverture souhaite')
    .replace(/Your Age/g, 'Votre age')
    .replace(/Family Members to Cover/g, 'Membres de famille a couvrir')
    .replace(/Average Funeral Cost/g, 'Cout funeraire moyen')
    .replace(/Cover Amount/g, 'Montant de couverture')
    .replace(/Waiting Period/g, "Delai d'attente")
    .replace(/Detail<\/th><th>Estimate/g, 'Detail</th><th>Estimation')
    .replace(/Provider<\/th><th>Annuel Range<\/th><th>Mensuel Range/g, 'Assureur</th><th>Fourchette annuelle</th><th>Fourchette mensuelle')
    .replace(/per month for /g, 'par mois pour ')
    .replace(/ family member\(s\)/g, ' membre(s) de famille');
}

function familyInsuranceResultActions(page) {
  return `<section class="ins-workbench" data-fr-insurance-family-batch="result-actions" aria-label="Exporter le resultat assurance">
<h2>Resume a emporter</h2>
<p>Copiez ou telechargez un brief local pour comparer des devis. Les donnees saisies restent dans votre browser; aucun age, membre de famille, budget ou condition de sante n'est envoye a un serveur.</p>
<div class="ins-wb-actions">
  <button class="ins-wb-btn" type="button" id="copyFamilyInsuranceBrief">Copier le resume</button>
  <button class="ins-wb-btn secondary" type="button" id="downloadFamilyInsuranceBrief">Telecharger TXT</button>
  <span class="ins-wb-status" id="familyInsuranceExportStatus" aria-live="polite"></span>
</div>
<p class="ins-wb-mini">A utiliser comme preparation de devis seulement. La police, les exclusions, les plafonds et la validation de l'assureur controlent la couverture finale.</p>
</section>`;
}

function familyInsuranceVerification(page) {
  const subject = page.type === 'health' ? 'assurance sante' : 'assurance obseques';
  const method = page.type === 'health'
    ? 'le moteur combine type de couverture, age, personnes a charge, niveau de budget et conditions preexistantes pour produire une fourchette annuelle, mensuelle et une liste de questions a poser au reseau de soins.'
    : "le moteur combine montant de couverture, age, taille de famille et type d'obseques pour estimer prime mensuelle, prime annuelle, cout funeraire indicatif et delai d'attente.";
  return `<section class="ins-seo" data-tool-verification-panel data-fr-insurance-family-batch="trust">
<h2>Methodologie, sources et limites</h2>
<p><strong>Source et fraicheur:</strong> cette page utilise le jeu de donnees assurance AfroTools charge depuis <code>/data/insurance/country-insurance-index.js</code>, avec verification de page le 22 juin 2026. Les primes, reseaux, exclusions, delais d'attente, taxes et exigences du regulateur peuvent changer.</p>
<p><strong>Methodologie:</strong> ${method}</p>
<p><strong>Verification:</strong> comparez ce resultat avec une police ecrite, un assureur ou courtier agree, le regulateur local et les documents de prestations avant paiement. Pour ${page.country}, traitez le resultat comme une estimation de preparation, pas comme un devis officiel.</p>
<p><strong>Local-first et limites:</strong> les champs restent dans le browser local. Cet outil ne remplace pas un avis medical, juridique, financier ou une decision officielle de couverture ${subject}.</p>
</section>`;
}

function familyInsuranceScript(page) {
  const title = page.type === 'health'
    ? `AfroTools - comparateur assurance sante ${page.country}`
    : `AfroTools - assurance obseques ${page.country}`;
  const fields = page.type === 'health'
    ? [
        ['Type de couverture', 'coverType'],
        ['Age du membre principal', 'age'],
        ['Personnes a charge', 'dependents'],
        ['Niveau de budget', 'budgetLevel'],
        ['Conditions preexistantes', 'preExisting'],
      ]
    : [
        ["Type d'obseques", 'funeralType'],
        ['Montant de couverture souhaite', 'coverAmount'],
        ['Age', 'age'],
        ['Membres de famille', 'familyMembers'],
      ];
  const resultLines = page.type === 'health'
    ? [
        ['Fourchette annuelle', 'resAmount'],
        ['Fourchette mensuelle', 'resSub'],
        ['Regime et assureurs', 'resScheme'],
      ]
    : [
        ['Prime mensuelle', 'resAmount'],
        ['Cout funeraire moyen', 'resFunCost'],
        ['Montant de couverture', 'resCover'],
        ['Prime annuelle', 'resAnnuel'],
        ["Delai d'attente", 'resWait'],
      ];
  return `
<script data-fr-insurance-family-batch="export-js">
!function(){
  "use strict";
  function value(id){var el=document.getElementById(id);return el?el.value:"";}
  function text(id){var el=document.getElementById(id);return el?(el.textContent||"").trim():"";}
  function line(label,id){return "- "+label+": "+(value(id)||"non renseigne");}
  function result(label,id){return "- "+label+": "+(text(id)||"non calcule");}
  function buildFamilyInsuranceBrief(){
    var lines=[
      ${JSON.stringify(title)},
      "Date de preparation: 22 juin 2026",
      "",
      "Champs saisis:"
    ];
    ${JSON.stringify(fields)}.forEach(function(item){lines.push(line(item[0],item[1]));});
    lines.push("", "Resultat:");
    ${JSON.stringify(resultLines)}.forEach(function(item){lines.push(result(item[0],item[1]));});
    lines.push("", "A verifier: police ecrite, exclusions, plafonds, delai d'attente, reseau/prestations, paiement officiel, regulateur local et documents de claim.");
    lines.push("Limite: estimation de preparation uniquement; pas un devis, pas une couverture active, pas un avis medical, juridique ou financier.");
    return lines.join("\\n");
  }
  function setStatus(msg){var el=document.getElementById("familyInsuranceExportStatus");if(el)el.textContent=msg;}
  function fallbackCopy(text){
    var ta=document.createElement("textarea");
    ta.value=text;
    ta.setAttribute("readonly","");
    ta.style.position="fixed";
    ta.style.left="-9999px";
    document.body.appendChild(ta);
    ta.select();
    try{document.execCommand("copy");setStatus("Resume copie.");}
    catch(e){setStatus("Copie indisponible; utilisez le telechargement TXT.");}
    document.body.removeChild(ta);
  }
  function copy(text){
    if(navigator.clipboard&&navigator.clipboard.writeText){
      navigator.clipboard.writeText(text).then(function(){setStatus("Resume copie.");},function(){fallbackCopy(text);});
    } else {
      fallbackCopy(text);
    }
  }
  function download(name,text){
    var blob=new Blob([text],{type:"text/plain"});
    var a=document.createElement("a");
    a.href=URL.createObjectURL(blob);
    a.download=name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function(){URL.revokeObjectURL(a.href);},250);
  }
  document.addEventListener("DOMContentLoaded",function(){
    var c=document.getElementById("copyFamilyInsuranceBrief");
    var d=document.getElementById("downloadFamilyInsuranceBrief");
    if(c)c.addEventListener("click",function(){copy(buildFamilyInsuranceBrief());});
    if(d)d.addEventListener("click",function(){download(${JSON.stringify(`${page.file.split('/').slice(-2).join('-').replace(/\.html$/, '')}-resume.txt`)},buildFamilyInsuranceBrief());setStatus("Fichier TXT prepare.");});
  });
}();
</script>`;
}

function upgradeFamilyInsurance(page) {
  let html = read(page.file);
  const before = html;

  html = ensureHeadScript(html, '/assets/js/components/business-cta.js');
  html = applyFamilyInsuranceCopy(html);
  if (page.type === 'funeral') {
    html = html.replace(/window\.AfroTools\.FuneralAssuranceEngine/g, 'window.AfroTools.FuneralInsuranceEngine');
  }

  if (!html.includes('data-fr-insurance-family-batch="result-actions"')) {
    html = insertBefore(html, '<section class="ins-seo">', `${familyInsuranceResultActions(page)}\n`);
  }

  if (!html.includes('data-fr-insurance-family-batch="trust"')) {
    html = insertBefore(html, '<afro-footer></afro-footer>', familyInsuranceVerification(page));
  }

  if (!html.includes('data-fr-insurance-family-batch="cta"')) {
    const cta = `<div class="ins-seo" data-fr-insurance-family-batch="cta">
<afro-business-cta tool-name="${page.toolName}" save-note="Copiez ou telechargez le brief local, puis comparez au moins deux devis formels avant paiement."></afro-business-cta>
</div>`;
    html = insertBefore(html, '<afro-footer></afro-footer>', cta);
  }

  if (!html.includes('data-fr-insurance-family-batch="export-js"')) {
    html = insertBefore(html, '</body>', familyInsuranceScript(page));
  }

  if (html !== before) {
    write(page.file, html);
    return true;
  }
  return false;
}

function upgradeLease(file, country) {
  let html = read(file);
  const before = html;

  html = ensureHeadScript(html, '/assets/js/components/business-cta.js');

  if (!html.includes('id="copyAgreementBtn"')) {
    html = html.replace(
      '<button type="button" class="btn btn-primary" onclick="window.print()">Print Agreement</button><button type="button" class="btn btn-outline" id="downloadBtn">Telecharger en texte</button>',
      '<button type="button" class="btn btn-primary" onclick="window.print()">Print Agreement</button><button type="button" class="btn btn-outline" id="copyAgreementBtn">Copier le texte</button><button type="button" class="btn btn-outline" id="downloadBtn">Telecharger en texte</button><span id="agreementCopyStatus" aria-live="polite" style="align-self:center;color:#475569;font-size:.9rem"></span>'
    );
  }

  if (!html.includes('data-tool-verification-panel')) {
    const verification = `<section class="seo-section" data-tool-verification-panel data-fr-legal-batch="lease-trust">
<h2>Verification, sources et limites</h2>
<p><strong>Source/reference:</strong> la reference juridique visible sur cette page est utilisee comme point de depart. Avant signature, confirmez le texte officiel, les frais d'enregistrement, les delais de preavis, le plafond de caution et la pratique locale avec le registre competent, un notaire, un avocat ou l'autorite du logement.</p>
<p><strong>Methodologie:</strong> le brouillon assemble les champs saisis pour le bien, le proprietaire, le locataire, le loyer, la caution, la duree, les charges et les clauses optionnelles. Le resultat reste un document de preparation a relire, corriger et faire valider.</p>
<p><strong>Derniere verification de la page:</strong> 22 juin 2026. Les regles de bail, taxes, timbres, eviction, depot et enregistrement peuvent changer. Cet outil est local-first et ne transmet pas vos noms, adresses, loyers ou clauses a un serveur.</p>
<p><strong>Avertissement:</strong> estimation documentaire uniquement; ce n'est pas un conseil juridique, un depot officiel, une garantie de conformite ni un remplacement d'un professionnel local.</p>
</section>`;
    html = insertBefore(html, '<afro-footer></afro-footer>', verification);
  }

  if (!html.includes('data-fr-legal-batch="lease-cta"')) {
    const cta = `<div class="seo-section" data-fr-legal-batch="lease-cta">
<afro-business-cta tool-name="Generateur de contrat de bail - ${country}" save-note="Copiez, imprimez ou telechargez le brouillon localement, puis faites valider le contrat avant signature."></afro-business-cta>
</div>`;
    html = insertBefore(html, '<afro-footer></afro-footer>', cta);
  }

  if (!html.includes('function copyAgreementText')) {
    const copyScript = `
<script data-fr-legal-batch="lease-copy">
!function(){
  "use strict";
  function agreementText(){
    var el=document.getElementById('agreementContent');
    return el ? (el.innerText||el.textContent||'').trim() : '';
  }
  function setStatus(msg){
    var el=document.getElementById('agreementCopyStatus');
    if(el) el.textContent=msg;
  }
  function fallbackCopy(text){
    var ta=document.createElement('textarea');
    ta.value=text;
    ta.setAttribute('readonly','');
    ta.style.position='fixed';
    ta.style.left='-9999px';
    document.body.appendChild(ta);
    ta.select();
    try{document.execCommand('copy');setStatus('Texte copie.');}
    catch(e){setStatus('Copie indisponible; utilisez le telechargement TXT.');}
    document.body.removeChild(ta);
  }
  function copyAgreementText(){
    var text=agreementText();
    if(!text){setStatus('Generez un brouillon avant de copier.');return;}
    if(navigator.clipboard&&navigator.clipboard.writeText){
      navigator.clipboard.writeText(text).then(function(){setStatus('Texte copie.');},function(){fallbackCopy(text);});
    } else {
      fallbackCopy(text);
    }
  }
  document.addEventListener('DOMContentLoaded',function(){
    var btn=document.getElementById('copyAgreementBtn');
    if(btn) btn.addEventListener('click',copyAgreementText);
  });
}();
</script>`;
    html = insertBefore(html, '</body>', copyScript);
  }

  html = html.replace(
    "if(!text){setStatus('Generez un brouillon avant de copier.');return;}\n    if(navigator.clipboard&&navigator.clipboard.writeText){",
    "if(!text){setStatus('Generez un brouillon avant de copier.');return;}\n    setStatus('Copie en cours...');\n    if(navigator.clipboard&&navigator.clipboard.writeText){"
  );

  if (html !== before) {
    write(file, html);
    return true;
  }
  return false;
}

function upgradeCommission() {
  const file = 'fr/tools/commission-agent/index.html';
  let html = read(file);
  const before = html;

  html = html
    .replace(/Analyse IA/g, 'Analyse du scenario')
    .replace(/conseils IA sur les commissions et la negociation/g, 'conseils locaux de preparation sur les commissions et la negociation')
    .replace(/conseils IA sur les commissions et la n(?:Ã©|e)gociation/g, 'conseils locaux de preparation sur les commissions et la negociation');

  if (!html.includes('data-fr-legal-batch="commission-export"')) {
    const exportPanel = `
  <section class="fr-caution-note" data-fr-legal-batch="commission-export" aria-label="Exporter le resume" style="max-width:1180px;margin:22px auto 0;padding:16px 18px;border:1px solid #dbeafe;border-radius:14px;background:#fff;color:#334155;line-height:1.65">
    <strong>Exporter le resume.</strong> Copiez ou telechargez un bref recapitulatif local pour comparer un mandat, discuter avec un agent ou garder une trace de vos hypotheses. Aucun prix, loyer ou pays selectionne n'est envoye a un serveur.
    <div style="display:flex;flex-wrap:wrap;gap:10px;margin-top:12px">
      <button class="fr-btn fr-btn-primary" type="button" id="copyCommissionBrief">Copier le resume</button>
      <button class="fr-btn fr-btn-secondary" type="button" id="downloadCommissionBrief" style="color:#0f172a;border-color:#cbd5e1">Telecharger TXT</button>
      <span id="commissionExportStatus" aria-live="polite" style="align-self:center;color:#475569;font-size:.9rem"></span>
    </div>
  </section>`;
    html = insertBefore(html, '<afro-footer></afro-footer>', exportPanel);
  }

  if (!html.includes('data-tool-verification-panel')) {
    const verification = `
  <section class="fr-caution-note" data-tool-verification-panel data-fr-legal-batch="commission-trust" aria-label="Methode, sources et limites" style="max-width:1180px;margin:22px auto 0;padding:16px 18px;border:1px solid #dbeafe;border-radius:14px;background:#fff;color:#334155;line-height:1.65">
    <strong>Sources et methode.</strong> Les taux de commission, TVA et usages affiches sont des reperes de preparation issus du jeu de donnees AfroTools et des references de marche visibles dans le tableau. Confirmez toujours le mandat officiel, le taux HT/TTC, la partie qui paie, les services inclus et la facture finale.
    <br><strong>Derniere verification de la page:</strong> 22 juin 2026. Les pratiques d'agence, taxes et obligations d'enregistrement peuvent changer selon ville, contrat et statut fiscal.
    <br><strong>Avertissement:</strong> estimation uniquement; ce n'est pas un conseil juridique, fiscal, immobilier ou une grille officielle.
  </section>`;
    html = insertBefore(html, '<afro-footer></afro-footer>', verification);
  }

  if (!html.includes('function buildCommissionBrief')) {
    const script = `
<script data-fr-legal-batch="commission-export-js">
!function(){
  "use strict";
  function value(id){var el=document.getElementById(id);return el?el.value:'';}
  function text(id){var el=document.getElementById(id);return el?(el.textContent||'').trim():'';}
  function countryName(id){
    var el=document.getElementById(id);
    return el&&el.options&&el.selectedIndex>=0?el.options[el.selectedIndex].textContent.trim():'';
  }
  function buildCommissionBrief(){
    var saleCountry=countryName('country-sale');
    var rentalCountry=countryName('country-rental');
    var lines=[
      'AfroTools - resume commission agent',
      'Date de preparation: 22 juin 2026',
      '',
      'Vente:',
      '- Pays: '+(saleCountry||'non selectionne'),
      '- Valeur du bien: '+(value('prop-value')||'non renseignee'),
      '- Taux de commission: '+(value('commission-pct')||'non renseigne')+'%',
      '- Commission totale estimee: '+(text('r-sale-total')||'non calculee'),
      '- TVA estimee: '+(text('r-sale-vat')||'non calculee'),
      '- Net vendeur estime: '+(text('r-sale-net')||'non calcule'),
      '',
      'Location:',
      '- Pays: '+(rentalCountry||'non selectionne'),
      '- Loyer mensuel: '+(value('monthly-rent')||'non renseigne'),
      '- Frais de location estimes: '+(text('r-rental-total')||'non calcule'),
      '- Frais de renouvellement: '+(text('r-rental-renewal')||'non calcule'),
      '',
      'A verifier: mandat ecrit, taux HT/TTC, partie qui paie, services inclus, facture, enregistrement local et obligations fiscales.',
      'Limite: estimation de preparation uniquement; pas un avis juridique, fiscal ou immobilier officiel.'
    ];
    return lines.join('\\n');
  }
  function setStatus(msg){var el=document.getElementById('commissionExportStatus');if(el)el.textContent=msg;}
  function download(name,text){
    var blob=new Blob([text],{type:'text/plain'});
    var a=document.createElement('a');
    a.href=URL.createObjectURL(blob);
    a.download=name;
    a.click();
    setTimeout(function(){URL.revokeObjectURL(a.href);},250);
  }
  function copy(text){
    if(navigator.clipboard&&navigator.clipboard.writeText){
      navigator.clipboard.writeText(text).then(function(){setStatus('Resume copie.');},function(){setStatus('Copie indisponible; utilisez le telechargement TXT.');});
    } else {
      setStatus('Copie indisponible; utilisez le telechargement TXT.');
    }
  }
  document.addEventListener('DOMContentLoaded',function(){
    var c=document.getElementById('copyCommissionBrief');
    var d=document.getElementById('downloadCommissionBrief');
    if(c)c.addEventListener('click',function(){copy(buildCommissionBrief());});
    if(d)d.addEventListener('click',function(){download('commission-agent-resume.txt',buildCommissionBrief());setStatus('Fichier TXT prepare.');});
  });
}();
</script>`;
    html = insertBefore(html, '</body>', script);
  }

  if (html !== before) {
    write(file, html);
    return true;
  }
  return false;
}

function upgradeInsurance() {
  const file = 'fr/tools/assurance-auto/cote-d-ivoire.html';
  let html = read(file);
  const before = html;

  html = ensureHeadScript(html, '/assets/js/components/business-cta.js');

  if (!html.includes('data-fr-legal-batch="insurance-actions"')) {
    const next = html.replace(
      /<div class="ins-tip" id="resTip">[^<]*<\/div><\/div>/,
      '<div class="ins-tip" id="resTip">-</div><div class="actions" data-fr-legal-batch="insurance-actions" style="display:flex;flex-wrap:wrap;gap:10px;justify-content:center;margin:16px 0"><button class="ins-calc-btn" type="button" id="copyInsuranceBrief" style="width:auto">Copier le resume</button><button class="ins-calc-btn" type="button" id="downloadInsuranceBrief" style="width:auto;background:#fff;color:#1d4ed8;border:1.5px solid #1d4ed8">Telecharger TXT</button><span id="insuranceExportStatus" aria-live="polite" style="align-self:center;color:#475569;font-size:.9rem"></span></div></div>'
    );
    if (next === html) {
      throw new Error(`Could not insert insurance export actions in ${file}`);
    }
    html = next;
  }

  if (!html.includes('data-tool-verification-panel')) {
    const verification = `<section class="ins-seo" data-tool-verification-panel data-fr-legal-batch="insurance-trust">
<h2>Methodologie, sources et limites</h2>
<p><strong>Source/reference:</strong> l'estimation utilise le jeu de donnees assurance AfroTools et les informations de marche visibles sur cette page. Confirmez toujours les tarifs officiels, garanties obligatoires, taxes, certificat, controle technique et exclusions avec un assureur ou courtier agree avant paiement.</p>
<p><strong>Methodologie:</strong> le moteur estime une fourchette a partir de la valeur du vehicule, de son age, du type de vehicule, de l'age du conducteur, de l'anciennete du permis et de l'historique de sinistres. Le resultat compare tiers obligatoire, tous risques et franchise typique.</p>
<p><strong>Derniere verification de la page:</strong> 22 juin 2026. Les primes, penalites, garanties, taxes et exigences de controle technique peuvent changer. Cet outil est local-first et ne transmet pas vos donnees de vehicule ou de conducteur a un serveur.</p>
<p><strong>Avertissement:</strong> estimation de preparation uniquement; ce n'est pas un devis, une police, une validation CIMA, un conseil juridique ou une garantie de couverture.</p>
</section>`;
    html = insertBefore(html, '<afro-footer></afro-footer>', verification);
  }

  if (!html.includes('data-fr-legal-batch="insurance-cta"')) {
    const cta = `<div class="ins-seo" data-fr-legal-batch="insurance-cta">
<afro-business-cta tool-name="Estimateur assurance auto - Cote d'Ivoire" save-note="Copiez ou telechargez l'estimation, puis demandez des devis formels aux assureurs agrees."></afro-business-cta>
</div>`;
    html = insertBefore(html, '<afro-footer></afro-footer>', cta);
  }

  if (!html.includes('function buildInsuranceBrief')) {
    const script = `
<script data-fr-legal-batch="insurance-export-js">
!function(){
  "use strict";
  function value(id){var el=document.getElementById(id);return el?el.value:'';}
  function text(id){var el=document.getElementById(id);return el?(el.textContent||'').trim():'';}
  function buildInsuranceBrief(){
    return [
      "AfroTools - estimation assurance auto Cote d'Ivoire",
      "Date de preparation: 22 juin 2026",
      "",
      "Vehicule:",
      "- Valeur: "+(value('vehicleValue')||'non renseignee'),
      "- Age du vehicule: "+(value('vehicleAge')||'non renseigne'),
      "- Type: "+(value('vehicleType')||'non renseigne'),
      "- Age conducteur: "+(value('driverAge')||'non renseigne'),
      "- Annees avec permis: "+(value('yearsLicensed')||'non renseigne'),
      "- Sinistres: "+(value('claimHistory')||'non renseigne'),
      "",
      "Resultat:",
      "- Prime annuelle estimee: "+(text('resAmount')||'non calculee'),
      "- Tiers obligatoire: "+(text('resTP')||'non calcule'),
      "- Tous risques: "+(text('resComp')||'non calcule'),
      "- Franchise typique: "+(text('resExcess')||'non calculee'),
      "- Assureurs a consulter: "+(text('resProviders')||'non calcule'),
      "- Note: "+(text('resTip')||'non calculee'),
      "",
      "A verifier: tarifs officiels, garanties, exclusions, controle technique, taxes, certificat et franchise avec un assureur ou courtier agree.",
      "Limite: estimation de preparation uniquement; pas un devis ni une garantie de couverture."
    ].join('\\n');
  }
  function setStatus(msg){var el=document.getElementById('insuranceExportStatus');if(el)el.textContent=msg;}
  function download(name,text){
    var blob=new Blob([text],{type:'text/plain'});
    var a=document.createElement('a');
    a.href=URL.createObjectURL(blob);
    a.download=name;
    a.click();
    setTimeout(function(){URL.revokeObjectURL(a.href);},250);
  }
  function copy(text){
    if(navigator.clipboard&&navigator.clipboard.writeText){
      navigator.clipboard.writeText(text).then(function(){setStatus('Resume copie.');},function(){setStatus('Copie indisponible; utilisez le telechargement TXT.');});
    } else {
      setStatus('Copie indisponible; utilisez le telechargement TXT.');
    }
  }
  document.addEventListener('DOMContentLoaded',function(){
    var c=document.getElementById('copyInsuranceBrief');
    var d=document.getElementById('downloadInsuranceBrief');
    if(c)c.addEventListener('click',function(){copy(buildInsuranceBrief());});
    if(d)d.addEventListener('click',function(){download('assurance-auto-cote-ivoire-resume.txt',buildInsuranceBrief());setStatus('Fichier TXT prepare.');});
  });
}();
</script>`;
    html = insertBefore(html, '</body>', script);
  }

  if (html !== before) {
    write(file, html);
    return true;
  }
  return false;
}

function applyAutoInsuranceCopy(html) {
  return html
    .replace(/Calculer Your Estimate/g, 'Calculer votre estimation')
    .replace(/Free car insurance premium estimator for /g, "Estimateur de prime d'assurance auto pour ")
    .replace(/Calculer third-party and comprehensive motor insurance costs with /g, 'Comparez tiers obligatoire et tous risques avec les donnees de ')
    .replace(/'s top providers/g, ' et des assureurs locaux.')
    .replace(/Use this free calculator to get a quick estimate before contacting insurance providers\./g, 'Utilisez ce calculateur pour preparer une demande de devis avant de contacter des assureurs.')
    .replace(/What You Need to Know/g, 'Ce qu il faut verifier')
    .replace(/Comprehensive cover/g, 'Couverture tous risques')
    .replace(/per year/g, 'par an')
    .replace(/Contact local providers/g, 'Contactez des assureurs locaux')
    .replace(/Actual premiums depend on individual circumstances, insurer assessment, and negotiation\./g, "Les primes finales dependent du vehicule, du conducteur, des exclusions, de l'assureur et du devis signe.")
    .replace(/Always get formal quotes from licensed providers\./g, 'Demandez toujours un devis ecrit a un assureur ou courtier agree avant paiement.');
}

function autoInsuranceResultActions() {
  return `<section class="ins-workbench" data-fr-auto-insurance-batch="result-actions" aria-label="Exporter le resultat assurance auto">
<h2>Resume de devis a emporter</h2>
<p>Copiez ou telechargez un brief local pour comparer plusieurs devis auto. Les valeurs de vehicule, conducteur, permis et sinistres restent dans votre browser; aucun champ n'est envoye a un serveur.</p>
<div class="ins-wb-actions">
  <button class="ins-wb-btn" type="button" id="copyAutoInsuranceBrief">Copier le resume</button>
  <button class="ins-wb-btn secondary" type="button" id="downloadAutoInsuranceBrief">Telecharger TXT</button>
  <span class="ins-wb-status" id="autoInsuranceExportStatus" aria-live="polite"></span>
</div>
<p class="ins-wb-mini">A utiliser pour preparer une discussion avec assureur, courtier, banque ou gestionnaire de flotte. Le contrat ecrit controle toujours la couverture finale.</p>
</section>`;
}

function autoInsuranceVerification(page) {
  return `<section class="ins-seo" data-tool-verification-panel data-fr-auto-insurance-batch="trust">
<h2>Methodologie, sources et limites</h2>
<p><strong>Source et fraicheur:</strong> cette page utilise le jeu de donnees assurance AfroTools charge depuis <code>/data/insurance/country-insurance-index.js</code>, avec verification de page le 22 juin 2026. Les primes, taxes, certificats, penalites, controle technique, exclusions et exigences du regulateur peuvent changer.</p>
<p><strong>Methodologie:</strong> le moteur estime une fourchette a partir de la valeur du vehicule, de son age, du type de vehicule, de l'age du conducteur, de l'anciennete du permis et de l'historique de sinistres. Le resultat compare tiers obligatoire, tous risques, franchise typique et assureurs a contacter.</p>
<p><strong>Verification:</strong> pour ${page.country}, comparez ce resultat avec une police ecrite, les limites de responsabilite, le certificat, la franchise, les exclusions et la preuve de paiement d'un assureur ou courtier agree.</p>
<p><strong>Local-first et limites:</strong> les champs restent dans le browser local. Cet outil ne constitue pas un devis, une police active, une validation officielle, un conseil juridique ou une garantie de couverture.</p>
</section>`;
}

function autoInsuranceScript(page) {
  const fileName = `assurance-auto-${page.slug}-resume.txt`;
  return `
<script data-fr-auto-insurance-batch="export-js">
!function(){
  "use strict";
  function value(id){var el=document.getElementById(id);return el?el.value:"";}
  function text(id){var el=document.getElementById(id);return el?(el.textContent||"").trim():"";}
  function buildAutoInsuranceBrief(){
    return [
      "AfroTools - assurance auto ${page.country}",
      "Date de preparation: 22 juin 2026",
      "",
      "Champs saisis:",
      "- Valeur du vehicule: "+(value("vehicleValue")||"non renseignee"),
      "- Age du vehicule: "+(value("vehicleAge")||"non renseigne"),
      "- Type de vehicule: "+(value("vehicleType")||"non renseigne"),
      "- Age du conducteur: "+(value("driverAge")||"non renseigne"),
      "- Annees avec permis: "+(value("yearsLicensed")||"non renseigne"),
      "- Sinistres sur 3 ans: "+(value("claimHistory")||"non renseigne"),
      "",
      "Resultat:",
      "- Tous risques estime: "+(text("resAmount")||"non calcule"),
      "- Tiers obligatoire: "+(text("resTP")||"non calcule"),
      "- Franchise typique: "+(text("resExcess")||"non calculee"),
      "- Assureurs a comparer: "+(text("resProviders")||"non calcule"),
      "- Note: "+(text("resTip")||"non calculee"),
      "",
      "A verifier: police ecrite, certificat, limites de responsabilite, franchise, exclusions, controle technique, preuve de paiement et regulateur local.",
      "Limite: estimation de preparation uniquement; pas un devis, pas une police active, pas une garantie de couverture."
    ].join("\\n");
  }
  function setStatus(msg){var el=document.getElementById("autoInsuranceExportStatus");if(el)el.textContent=msg;}
  function fallbackCopy(text){
    var ta=document.createElement("textarea");
    ta.value=text;
    ta.setAttribute("readonly","");
    ta.style.position="fixed";
    ta.style.left="-9999px";
    document.body.appendChild(ta);
    ta.select();
    try{document.execCommand("copy");setStatus("Resume copie.");}
    catch(e){setStatus("Copie indisponible; utilisez le telechargement TXT.");}
    document.body.removeChild(ta);
  }
  function copy(text){
    if(navigator.clipboard&&navigator.clipboard.writeText){
      navigator.clipboard.writeText(text).then(function(){setStatus("Resume copie.");},function(){fallbackCopy(text);});
    } else {
      fallbackCopy(text);
    }
  }
  function download(name,text){
    var blob=new Blob([text],{type:"text/plain"});
    var a=document.createElement("a");
    a.href=URL.createObjectURL(blob);
    a.download=name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function(){URL.revokeObjectURL(a.href);},250);
  }
  document.addEventListener("DOMContentLoaded",function(){
    var c=document.getElementById("copyAutoInsuranceBrief");
    var d=document.getElementById("downloadAutoInsuranceBrief");
    if(c)c.addEventListener("click",function(){copy(buildAutoInsuranceBrief());});
    if(d)d.addEventListener("click",function(){download(${JSON.stringify(fileName)},buildAutoInsuranceBrief());setStatus("Fichier TXT prepare.");});
  });
}();
</script>`;
}

function upgradeAutoInsurancePage(page) {
  let html = read(page.file);
  const before = html;

  html = ensureHeadScript(html, '/assets/js/components/business-cta.js');
  html = applyAutoInsuranceCopy(html);

  if (!html.includes('data-fr-auto-insurance-batch="result-actions"')) {
    html = insertBefore(html, '<section class="ins-seo">', `${autoInsuranceResultActions()}\n`);
  }

  if (!html.includes('data-fr-auto-insurance-batch="trust"')) {
    html = insertBefore(html, '<afro-footer></afro-footer>', autoInsuranceVerification(page));
  }

  if (!html.includes('data-fr-auto-insurance-batch="cta"')) {
    const cta = `<div class="ins-seo" data-fr-auto-insurance-batch="cta">
<afro-business-cta tool-name="${page.toolName}" save-note="Copiez ou telechargez le brief local, puis comparez au moins deux devis formels avant paiement."></afro-business-cta>
</div>`;
    html = insertBefore(html, '<afro-footer></afro-footer>', cta);
  }

  if (!html.includes('data-fr-auto-insurance-batch="export-js"')) {
    html = insertBefore(html, '</body>', autoInsuranceScript(page));
  }

  if (html !== before) {
    write(page.file, html);
    return true;
  }
  return false;
}

let updated = 0;
for (const [file, country] of leasePages) {
  if (upgradeLease(file, country)) updated += 1;
}
if (upgradeCommission()) updated += 1;
if (upgradeInsurance()) updated += 1;
for (const page of familyInsurancePages) {
  if (upgradeFamilyInsurance(page)) updated += 1;
}
for (const page of autoInsurancePages) {
  if (upgradeAutoInsurancePage(page)) updated += 1;
}

console.log(`Done. Updated ${updated} of ${pages.length} French legal/insurance pages.`);
