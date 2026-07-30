#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { localizeVisibleLanguage } = require('./lib/french-visible-language');

const root = path.resolve(__dirname, '..');
const translationsFile = path.join(root, 'data/localization/fr-developer-native-translations.json');
const translations = fs.existsSync(translationsFile)
  ? JSON.parse(fs.readFileSync(translationsFile, 'utf8')).routes
  : {};
const configs = [
  ['data-converter', 'convertisseur-donnees', 'Convertisseur de données'],
  ['regex-tester', 'testeur-regex', 'Testeur d’expressions régulières'],
  ['cron-builder', 'constructeur-cron', 'Constructeur d’expressions cron'],
  ['diff-checker', 'comparateur-texte', 'Comparateur de textes'],
  ['sql-playground', 'bac-a-sable-sql', 'Bac à sable SQL'],
  ['css-gradient', 'generateur-degrade-css', 'Générateur de dégradés CSS'],
  ['sitemap-gen', 'generateur-sitemap', 'Générateur de sitemap'],
  ['african-api-directory', 'annuaire-api-africaines', 'Annuaire des API africaines'],
  ['african-domains', 'verificateur-domaines-africains', 'Vérificateur de domaines africains'],
  ['commit-message-gen', 'generateur-message-commit', 'Générateur de messages de commit'],
  ['docker-compose-gen', 'generateur-docker-compose', 'Générateur Docker Compose'],
  ['hosting-compare', 'comparateur-hebergement', 'Comparateur d’hébergement'],
  ['pwa-manifest', 'generateur-manifest-pwa', 'Générateur de manifeste PWA'],
  ['ussd-flow-builder', 'constructeur-flux-ussd', 'Constructeur de flux USSD']
];

const commonTerms = [
  ['Developer Tools', 'Outils développeur'],
  ['All Tools', 'Tous les outils'],
  ['Input Format', 'Format d’entrée'],
  ['Output Format', 'Format de sortie'],
  ['Input Data', 'Données source'],
  ['Converted Output', 'Sortie convertie'],
  ['Load Sample', 'Charger un exemple'],
  ['Choose File', 'Choisir un fichier'],
  ['Upload File', 'Importer un fichier'],
  ['Download Result', 'Télécharger le résultat'],
  ['Copy Result', 'Copier le résultat'],
  ['Run Query', 'Exécuter la requête'],
  ['Clear All', 'Tout effacer'],
  ['Generate', 'Générer'],
  ['Download', 'Télécharger'],
  ['Copy', 'Copier'],
  ['Copied', 'Copié'],
  ['Paste', 'Coller'],
  ['Clear', 'Effacer'],
  ['Reset', 'Réinitialiser'],
  ['Save', 'Enregistrer'],
  ['Saved', 'Enregistré'],
  ['Share', 'Partager'],
  ['Export', 'Exporter'],
  ['Import', 'Importer'],
  ['Preview', 'Aperçu'],
  ['Settings', 'Paramètres'],
  ['Options', 'Options'],
  ['Results', 'Résultats'],
  ['Result', 'Résultat'],
  ['Error', 'Erreur'],
  ['Example', 'Exemple'],
  ['Search', 'Rechercher'],
  ['Input', 'Entrée'],
  ['Output', 'Sortie'],
  ['File', 'Fichier'],
  ['Format', 'Format'],
  ['No results', 'Aucun résultat'],
  ['Frequently Asked Questions', 'Questions fréquentes'],
  ['Related tools', 'Outils associés'],
  ['Import review', 'Vérification de l’importation'],
  ['Export or save path', 'Chemin d’exportation ou d’enregistrement'],
  ['Select All TLDs', 'Sélectionner tous les TLD'],
  ['Select TLDs to compare:', 'Sélectionnez les TLD à comparer :'],
  ['Return plain text beginning with', 'Renvoyez du texte brut commençant par'],
  ['Ready', 'Prêt'],
  ['What:', 'Quoi :'],
  ['Where:', 'Où :'],
  ['and', 'et'],
  ['For validation, anchor with ^ and $ if the entire value must match.', 'Pour une validation complète, utilisez les ancres ^ et $ si toute la valeur doit correspondre.'],
  ['No common sensitive field names detected. Still review output before sharing.', 'Aucun nom courant de champ sensible détecté. Vérifiez tout de même le résultat avant de le partager.'],
  ['Query ran. Choose a challenge for scoring feedback.', 'Requête exécutée. Choisissez un défi pour obtenir une évaluation.']
  ,['Payment fit: confirm card, billing currency, tax/VAT and failed-payment recovery for this market.', 'Compatibilité de paiement : confirmez la carte, la devise de facturation, les taxes/TVA et la récupération après échec de paiement pour ce marché.']
  ,['Re-open the official pricing page.', 'Rouvrez la page officielle des tarifs.']
  ,['Set spend alerts or billing caps where the platform supports them.', 'Définissez des alertes de dépense ou des plafonds de facturation lorsque la plateforme les prend en charge.']
  ,['Keep domain registration separate from hosting when possible.', 'Séparez si possible l’enregistrement du domaine de l’hébergement.']
  ,['If using a VPS, plan backups, patching, firewall rules, uptime monitoring and restore tests.', 'Si vous utilisez un VPS, prévoyez les sauvegardes, correctifs, règles de pare-feu, la surveillance de disponibilité et les tests de restauration.']
];

function metaContent(html, name) {
  const match = html.match(new RegExp(`<meta[^>]+name=["']${name}["'][^>]+content=["']([^"']*)`, 'i'));
  return match ? match[1] : '';
}

function wrapperTerms(html) {
  const match = html.match(/var terms\s*=\s*(\[[\s\S]*?\]);/);
  if (!match) return [];
  try { return JSON.parse(match[1]); } catch (_) { return []; }
}

function uniqueTerms(items) {
  const seen = new Set();
  return items.filter(pair => {
    if (!pair[0] || seen.has(pair[0])) return false;
    seen.add(pair[0]);
    return true;
  }).sort((a, b) => b[0].length - a[0].length);
}

function translationLookup(pairs) {
  return new Map(pairs.map(([english, french]) => [String(english).replace(/\s+/g, ' ').trim(), french]));
}

function translatedValue(value, lookup) {
  const text = String(value);
  if (/^(?:https?:\/\/|\/)/i.test(text)) return text;
  return lookup.get(text.replace(/\s+/g, ' ').trim()) || text;
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function exactVisibleTransforms(lookup) {
  return [...lookup.entries()]
    .filter(([english, french]) => english && french && english !== french)
    .sort(([left], [right]) => right.length - left.length)
    .map(([english, french]) => [
      new RegExp(`^(\\s*)${escapeRegExp(english)}(\\s*)$`),
      (match, leading, trailing) => `${leading}${french}${trailing}`
    ]);
}

function localizeStructuredData(html, lookup) {
  return html.replace(/<script([^>]*type=["']application\/ld\+json["'][^>]*)>([\s\S]*?)<\/script>/gi, (match, attributes, source) => {
    try {
      const visit = (value, key = '') => {
        if (Array.isArray(value)) return value.map(item => visit(item, key));
        if (value && typeof value === 'object') {
          return Object.fromEntries(Object.entries(value).map(([childKey, childValue]) => [childKey, visit(childValue, childKey)]));
        }
        if (typeof value !== 'string') return value;
        if (key.startsWith('@') || /^(?:url|image|item|sameAs|contentUrl|mainEntityOfPage)$/i.test(key)) return value;
        return translatedValue(value, lookup);
      };
      return `<script${attributes}>${JSON.stringify(visit(JSON.parse(source)))}</script>`;
    } catch (_) {
      return match;
    }
  });
}

function localizeSearchMetadata(html, lookup) {
  return html.replace(/<meta\b([^>]*\b(?:name|property)=["'](?:og:title|og:description|twitter:title|twitter:description)["'][^>]*)>/gi, (match, attributes) => {
    return `<meta${attributes.replace(/(\bcontent=["'])([^"']*)(["'])/i, (contentMatch, prefix, value, suffix) => `${prefix}${translatedValue(value, lookup)}${suffix}`)}>`;
  });
}

for (const [englishSlug, frenchSlug, title] of configs) {
  const englishRel = `tools/${englishSlug}/index.html`;
  const frenchRel = `fr/tools/${frenchSlug}/index.html`;
  const english = fs.readFileSync(path.join(root, englishRel), 'utf8').replace(/\r\n/g, '\n');
  const wrapperFile = path.join(root, frenchRel);
  const wrapper = fs.existsSync(wrapperFile) ? fs.readFileSync(wrapperFile, 'utf8').replace(/\r\n/g, '\n') : '';
  const routeTerms = Object.entries(translations[englishSlug] || {}).filter(([english]) => /\s/.test(english));
  const terms = uniqueTerms([
    [englishSlug.split('-').map(word => word[0].toUpperCase() + word.slice(1)).join(' '), title],
    ...routeTerms,
    ...wrapperTerms(wrapper),
    ...commonTerms
  ]);
  const lookup = translationLookup([
    [englishSlug.split('-').map(word => word[0].toUpperCase() + word.slice(1)).join(' '), title],
    ...Object.entries(translations[englishSlug] || {}),
    ...commonTerms
  ]);
  const exportTerms = [...lookup.entries()];
  const description = metaContent(wrapper, 'description') || `${title} gratuit, local et privé dans votre navigateur.`;
  const frenchUrl = `https://afrotools.com/fr/tools/${frenchSlug}/`;
  const englishUrl = `https://afrotools.com/tools/${englishSlug}/`;
  const hash = crypto.createHash('sha256').update(english).digest('hex').slice(0, 16);
  const localizer = `<script data-fr-native-localizer>
(function(){
  var terms=new Map(${JSON.stringify(terms)});
  var exportTerms=new Map(${JSON.stringify(exportTerms)});
  var linePrefixes=[
    ['Checked:','Vérifié :'],['Project type:','Type de projet :'],['Market:','Marché :'],['Ops comfort:','Aisance opérationnelle :'],
    ['Budget:','Budget :'],['Estimated transfer:','Transfert estimé :'],['Recommended provider:','Fournisseur recommandé :'],
    ['Entry price:','Prix d’entrée :'],['Why:','Pourquoi :'],['Risk note:','Note de risque :'],['Official source:','Source officielle :'],
    ['Risk flags:','Indicateurs de risque :'],['Shortlist alternatives:','Autres options présélectionnées :'],['Before buying:','Avant l’achat :']
  ];
  function translateLine(value){
    var leading=(value.match(/^\\s*/)||[''])[0],trailing=(value.match(/\\s*$/)||[''])[0],text=value.trim(),bullet='';
    if(text.startsWith('- ')){bullet='- ';text=text.slice(2);}
    if(terms.has(text))return leading+bullet+terms.get(text)+trailing;
    if(bullet&&text.includes(': ')){var colon=text.indexOf(': '),label=text.slice(0,colon+1),detail=text.slice(colon+2);return leading+bullet+label+' '+(terms.get(detail)||detail)+trailing;}
    for(var i=0;i<linePrefixes.length;i++){var pair=linePrefixes[i];if(text.startsWith(pair[0])){var remainder=text.slice(pair[0].length).trim();return leading+bullet+pair[1]+' '+(terms.get(remainder)||remainder)+trailing;}}
    return value;
  }
  function swap(value){
    var original=String(value||''), leading=(original.match(/^\\s*/)||[''])[0], trailing=(original.match(/\\s*$/)||[''])[0], key=original.trim().replace(/\\s+/g,' ');
    if(terms.has(key))return leading+terms.get(key)+trailing;
    var preview=key.match(/^Previewing (.+) across (\\d+) selected TLDs\\. This is not a live availability check\\.$/);
    if(preview)return leading+'Aperçu de '+preview[1]+' sur '+preview[2]+' TLD sélectionnés. Il ne s’agit pas d’un contrôle de disponibilité en direct.'+trailing;
    var sitemap=key.match(/^(\\d+) same-host URLs generated\\. Add lastmod only when you have actual page modified dates\\.$/);
    if(sitemap)return leading+sitemap[1]+' URL du même hôte générées. Ajoutez lastmod uniquement si vous disposez des dates réelles de modification des pages.'+trailing;
    if(original.includes('\\n'))return original.split('\\n').map(translateLine).join('\\n');
    return original;
  }
  function localize(root){
    if(!root)return;
    var walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,{acceptNode:function(node){var parent=node.parentElement;if(!node.nodeValue||!node.nodeValue.trim()||(parent&&(/^(script|style|code|pre|textarea)$/i.test(parent.tagName)||parent.closest('[data-fr-preserve],code,pre,textarea,#codeOutput,.code-text,.code-output,.generated-code,.syntax-output'))))return NodeFilter.FILTER_REJECT;return NodeFilter.FILTER_ACCEPT;}});
    var nodes=[];while(walker.nextNode())nodes.push(walker.currentNode);nodes.forEach(function(node){node.nodeValue=swap(node.nodeValue);});
    root.querySelectorAll('[placeholder],[aria-label],[title],[alt],input[type="button"],input[type="submit"]').forEach(function(el){['placeholder','aria-label','title','alt','value'].forEach(function(attr){if(el.hasAttribute(attr))el.setAttribute(attr,swap(el.getAttribute(attr)));});});
  }
  localize(document);
  (function localizeJsonDownloads(){
    var NativeBlob=window.Blob;
    var preservedKeys=new Set(['id','type','provider','country','ops','risk','supports','tags','source','url','serviceCode','home','next','variable','key','project','localPay','countries']);
    function visit(value,key){
      if(Array.isArray(value))return value.map(function(item){return visit(item,key);});
      if(value&&typeof value==='object'){Object.keys(value).forEach(function(childKey){value[childKey]=visit(value[childKey],childKey);});return value;}
      if(typeof value!=='string'||preservedKeys.has(key)||/^(?:https?:\\/\\/|\\/)/i.test(value))return value;
      var normalized=value.replace(/\\s+/g,' ').trim();
      return exportTerms.has(normalized)?exportTerms.get(normalized):value;
    }
    function FrenchBlob(parts,options){
      var nextParts=parts;
      if(options&&/application\\/json/i.test(options.type||'')&&Array.isArray(parts)&&parts.length===1&&typeof parts[0]==='string'){
        try{nextParts=[JSON.stringify(visit(JSON.parse(parts[0]),''),null,parts[0].includes('\\n')?2:0)];}catch(_){}
      }
      return new NativeBlob(nextParts,options);
    }
    FrenchBlob.prototype=NativeBlob.prototype;
    Object.setPrototypeOf(FrenchBlob,NativeBlob);
    window.Blob=FrenchBlob;
  })();
  new MutationObserver(function(records){records.forEach(function(record){record.addedNodes.forEach(function(node){if(node.nodeType===1)localize(node);else if(node.nodeType===3&&node.parentElement&&!/^(script|style|code|pre|textarea)$/i.test(node.parentElement.tagName)&&!node.parentElement.closest('[data-fr-preserve],code,pre,textarea,#codeOutput,.code-text,.code-output,.generated-code,.syntax-output'))node.nodeValue=swap(node.nodeValue);});});}).observe(document.body,{childList:true,subtree:true});
})();
</script>`;

  let output = english
    .replace(/(<html\b[^>]*\blang=")en(")/i, '$1fr$2')
    .replace(/<title>[\s\S]*?<\/title>/i, `<title>${title} | AfroTools</title>`)
    .replace(/<meta\b(?=[^>]*name=["']description["'])[^>]*>/i, `<meta name="description" content="${description}">`)
    .replace(new RegExp(englishUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), frenchUrl)
    .replace(/(<link rel="alternate" hreflang="en" href=")[^"]+(">)/, `$1${englishUrl}$2`)
    .replace(/(<link rel="alternate" hreflang="x-default" href=")[^"]+(">)/, `$1${englishUrl}$2`)
    .replace(/<h1([^>]*)>[\s\S]*?<\/h1>/i, `<h1$1>${title}</h1>`)
    .replace('<head>', `<head>\n<meta name="afrotools-content-id" content="fr-developer:${englishSlug}">\n<meta name="afrotools-source-owner" content="scripts/build-french-developer-native-clones.js">\n<meta name="afrotools-source-input" content="${englishRel}">\n<meta name="afrotools-source-hash" content="${hash}">`)
    .replace('</body>', `${localizer}\n</body>`);
  output = localizeSearchMetadata(localizeStructuredData(output, lookup), lookup);
  output = localizeVisibleLanguage(output, exactVisibleTransforms(lookup));

  const target = path.join(root, frenchRel);
  if (process.argv.includes('--check')) {
    if (fs.readFileSync(target, 'utf8').replace(/\r\n/g, '\n') !== output) {
      console.error(`${frenchRel} is stale`);
      process.exitCode = 1;
    }
  } else {
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, output, 'utf8');
    console.log(`wrote ${frenchRel}`);
  }
}
