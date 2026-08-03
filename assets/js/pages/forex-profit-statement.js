(function () {
  'use strict';

  var root = document.querySelector('[data-fx-statement]');
  var engine = window.ForexProfitStatementEngine;
  if (!root || !engine) return;

  var locale = ['en', 'fr', 'sw'].includes(root.dataset.locale) ? root.dataset.locale : 'en';
  var words = {
    en: {
      required:'Complete every required field with values from the same trade ticket or statement.', extreme:'These values produce an unbounded result. Check the prices, units and conversion.',
      updated:'Scenario updated locally.', changed:'Inputs changed. Calculate again.', copied:'Summary copied locally.', copyError:'Copy is unavailable. Use the displayed summary.', downloaded:'Local export created.', pdfError:'PDF export is unavailable.', estimate:'Forex trade statement estimate',
      labels:['Entry','Exit','Exposure','Pip size entered','Conversion entered','Gross P&L','Entered transaction costs','Net P&L','Net P&L in reporting unit','Statement note'], csv:['Field','Value','Unit'], fields:['Base currency','Quote currency','Direction','Entry price','Exit price','Base units','Pip size','Quote-to-reporting conversion','Transaction costs','Gross P&L','Net P&L','Net reporting P&L','Note'],
      boundary:'Reconciliation estimate only. Do not double-count spread or slippage already embedded in the entered prices.', privacy:'Local user-entered Forex reconciliation. No account or identity data.', files:['forex-statement.csv','forex-statement.json','forex-statement.pdf']
    },
    fr: {
      required:'Renseignez tous les champs obligatoires avec les valeurs du même ticket ou relevé.', extreme:'Ces valeurs produisent un résultat non borné. Vérifiez les prix, unités et la conversion.',
      updated:'Scénario mis à jour localement.', changed:'Champs modifiés. Recalculez.', copied:'Résumé copié localement.', copyError:'La copie est indisponible. Utilisez le résumé affiché.', downloaded:'Export local créé.', pdfError:'L’export PDF est indisponible.', estimate:'Estimation d’un relevé de trade Forex',
      labels:['Entrée','Sortie','Exposition','Taille du pip saisie','Conversion saisie','P&L brut','Coûts de transaction saisis','P&L net','P&L net dans l’unité de rapport','Note du relevé'], csv:['Champ','Valeur','Unité'], fields:['Devise de base','Devise de cotation','Direction','Prix d’entrée','Prix de sortie','Unités de base','Taille du pip','Conversion vers le rapport','Coûts de transaction','P&L brut','P&L net','P&L net du rapport','Note'],
      boundary:'Estimation de rapprochement uniquement. Ne comptez pas deux fois le spread ou le slippage déjà inclus dans les prix.', privacy:'Rapprochement Forex saisi et exporté localement. Aucune donnée de compte ou d’identité.', files:['releve-forex.csv','releve-forex.json','releve-forex.pdf']
    },
    sw: {
      required:'Jaza sehemu zote za lazima kwa thamani kutoka tiketi au taarifa moja.', extreme:'Thamani hizi zinaleta matokeo yasiyo na kikomo. Kagua bei, vipimo na ubadilishaji.',
      updated:'Hali imesasishwa kwenye kifaa.', changed:'Thamani zimebadilika. Kokotoa tena.', copied:'Muhtasari umenakiliwa kwenye kifaa.', copyError:'Kunakili hakupatikani. Tumia muhtasari unaoonekana.', downloaded:'Faili imeundwa kwenye kifaa.', pdfError:'Uundaji wa PDF haupatikani.', estimate:'Makadirio ya taarifa ya biashara ya Forex',
      labels:['Bei ya kuingia','Bei ya kutoka','Kiasi cha sarafu msingi','Ukubwa wa pip ulioingizwa','Ubadilishaji ulioingizwa','Faida au hasara ghafi','Gharama za muamala zilizoingizwa','Faida au hasara halisi','Faida au hasara katika kipimo cha ripoti','Dokezo la taarifa'], csv:['Sehemu','Thamani','Kipimo'], fields:['Sarafu msingi','Sarafu ya bei','Mwelekeo','Bei ya kuingia','Bei ya kutoka','Vipimo vya sarafu msingi','Ukubwa wa pip','Ubadilishaji wa ripoti','Gharama za muamala','Faida au hasara ghafi','Faida au hasara halisi','Faida au hasara ya ripoti','Dokezo'],
      boundary:'Makadirio ya kulinganisha pekee. Usihesabu mara mbili tofauti ya bei au utelezi uliomo tayari kwenye bei.', privacy:'Ulinganisho wa Forex ulioingizwa na kuhamishwa kwenye kifaa. Hakuna taarifa ya akaunti au utambulisho.', files:['taarifa-ya-forex.csv','taarifa-ya-forex.json','taarifa-ya-forex.pdf']
    }
  }[locale];

  var byId = function (id) { return document.getElementById(id); };
  var form = byId('fx-form');
  var error = byId('fx-error');
  var status = byId('fx-status');
  var actions = ['fx-copy', 'fx-csv', 'fx-json', 'fx-pdf'].map(byId);
  var last = null;
  var lastSignature = null;

  function num(id) { return Number(byId(id).value); }
  function text(id) { return byId(id).value.trim(); }
  function input() {
    return {
      baseCurrency:text('fx-base'), quoteCurrency:text('fx-quote'), reportingCurrencyUnit:text('fx-reporting'), direction:byId('fx-direction').value,
      entryPrice:byId('fx-entry').value, exitPrice:byId('fx-exit').value, baseUnits:byId('fx-units').value, pipSize:byId('fx-pip').value,
      quoteToReportingRate:byId('fx-conversion').value, transactionCostsQuote:byId('fx-costs').value, note:text('fx-note')
    };
  }
  function signature(value) { return JSON.stringify(value || input()); }
  function isCurrent() { return Boolean(last && lastSignature === signature()); }
  function number(value) { return new Intl.NumberFormat(locale === 'sw' ? 'sw-TZ' : locale === 'fr' ? 'fr-FR' : 'en', { maximumFractionDigits:6 }).format(value); }
  function amount(value, unit) { return number(value) + ' ' + unit; }
  function setActions(enabled) { actions.forEach(function (button) { button.disabled = !enabled; }); }
  function clear(message, errorMessage) {
    last = null; lastSignature = null; setActions(false);
    ['fx-net-reporting','fx-net','fx-gross','fx-cost-reporting','fx-pips','fx-pip-value','fx-notional','fx-conversion-result'].forEach(function (id) { byId(id).textContent = '\u2014'; });
    byId('fx-primary').removeAttribute('data-tone'); byId('fx-results').setAttribute('aria-busy', 'true');
    status.textContent = message || ''; error.textContent = errorMessage || ''; error.dataset.show = errorMessage ? 'true' : 'false';
  }
  function render(result) {
    byId('fx-net-reporting').textContent=amount(result.netPnlReporting,result.reportingCurrencyUnit); byId('fx-net').textContent=amount(result.netPnlQuote,result.quoteCurrency);
    byId('fx-gross').textContent=amount(result.grossPnlQuote,result.quoteCurrency); byId('fx-cost-reporting').textContent=amount(result.transactionCostsReporting,result.reportingCurrencyUnit);
    byId('fx-pips').textContent=number(result.signedPips); byId('fx-pip-value').textContent=amount(result.pipValueQuote,result.quoteCurrency); byId('fx-notional').textContent=amount(result.openingNotionalQuote,result.quoteCurrency);
    byId('fx-conversion-result').textContent='1 '+result.quoteCurrency+' = '+number(result.quoteToReportingRate)+' '+result.reportingCurrencyUnit;
    byId('fx-primary').dataset.tone=result.netPnlReporting<0?'loss':'gain'; byId('fx-results').removeAttribute('aria-busy'); setActions(true); status.textContent=words.updated;
    var title=byId('fx-results-title'); title.tabIndex=-1; title.focus();
  }
  function calculate(event) {
    if (event) event.preventDefault();
    if (!form.checkValidity()) { clear('', words.required); form.reportValidity(); return; }
    var value=input();
    try {
      var result=engine.calculate({baseCurrency:value.baseCurrency,quoteCurrency:value.quoteCurrency,reportingCurrencyUnit:value.reportingCurrencyUnit,direction:value.direction,entryPrice:num('fx-entry'),exitPrice:num('fx-exit'),baseUnits:num('fx-units'),pipSize:num('fx-pip'),quoteToReportingRate:num('fx-conversion'),transactionCostsQuote:num('fx-costs')});
      last={result:result,note:value.note,directionLabel:byId('fx-direction').selectedOptions[0].textContent}; lastSignature=signature(value); error.textContent=''; error.dataset.show='false'; render(result);
    } catch (caught) { clear('', String(caught.message)==='UNBOUNDED_RESULT' ? words.extreme : words.required); }
  }
  function summary(data) {
    var r=data.result, label=words.labels;
    return [words.estimate,r.baseCurrency+'/'+r.quoteCurrency+'; '+data.directionLabel,label[0]+': '+number(r.entryPrice)+' '+r.quoteCurrency+' / 1 '+r.baseCurrency,label[1]+': '+number(r.exitPrice)+' '+r.quoteCurrency+' / 1 '+r.baseCurrency,label[2]+': '+number(r.baseUnits)+' '+r.baseCurrency,label[3]+': '+number(r.pipSize),label[4]+': 1 '+r.quoteCurrency+' = '+number(r.quoteToReportingRate)+' '+r.reportingCurrencyUnit,label[5]+': '+amount(r.grossPnlQuote,r.quoteCurrency),label[6]+': '+amount(r.transactionCostsQuote,r.quoteCurrency),label[7]+': '+amount(r.netPnlQuote,r.quoteCurrency),label[8]+': '+amount(r.netPnlReporting,r.reportingCurrencyUnit),data.note?label[9]+': '+data.note:'',words.boundary].filter(Boolean).join('\n');
  }
  function cell(value) { var string=String(value==null?'':value); if (/^[\t\r ]*[=+\-@]/.test(string)) string="'"+string; return '"'+string.replace(/"/g,'""')+'"'; }
  function precise(value) { return Number(Number(value).toFixed(12)); }
  function download(name,type,content) { var url=URL.createObjectURL(new Blob([content],{type:type})), link=document.createElement('a'); link.href=url; link.download=name; document.body.appendChild(link); link.click(); link.remove(); setTimeout(function(){URL.revokeObjectURL(url);},0); status.textContent=words.downloaded; }
  function csv(data) {
    var r=data.result, f=words.fields;
    return [words.csv,[f[0],r.baseCurrency,''],[f[1],r.quoteCurrency,''],[f[2],data.directionLabel,''],[f[3],r.entryPrice,r.quoteCurrency+' / '+r.baseCurrency],[f[4],r.exitPrice,r.quoteCurrency+' / '+r.baseCurrency],[f[5],r.baseUnits,r.baseCurrency],[f[6],r.pipSize,''],[f[7],r.quoteToReportingRate,r.reportingCurrencyUnit+' / '+r.quoteCurrency],[f[8],r.transactionCostsQuote,r.quoteCurrency],[f[9],precise(r.grossPnlQuote),r.quoteCurrency],[f[10],precise(r.netPnlQuote),r.quoteCurrency],[f[11],precise(r.netPnlReporting),r.reportingCurrencyUnit],[f[12],data.note,'']].map(function(row){return row.map(cell).join(',');}).join('\r\n');
  }

  byId('fx-copy').addEventListener('click',function(){if(!isCurrent())return; if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(summary(last)).then(function(){status.textContent=words.copied;}).catch(function(){status.textContent=words.copyError;});else status.textContent=words.copyError;});
  byId('fx-csv').addEventListener('click',function(){if(!isCurrent())return;download(words.files[0],'text/csv;charset=utf-8','\uFEFF'+csv(last));});
  byId('fx-json').addEventListener('click',function(){if(!isCurrent())return;download(words.files[1],'application/json;charset=utf-8',JSON.stringify({schemaVersion:1,locale:locale,privacy:words.privacy,result:last.result,note:last.note},null,2));});
  byId('fx-pdf').addEventListener('click',function(){if(!isCurrent())return;try{var PDF=window.jspdf&&window.jspdf.jsPDF;if(!PDF)throw new Error('missing');var doc=new PDF(),lines=doc.splitTextToSize(summary(last),175);doc.setFontSize(17);doc.text(words.estimate,18,20);doc.setFontSize(10);doc.text(lines,18,30);doc.save(words.files[2]);status.textContent=words.downloaded;}catch(caught){status.textContent=words.pdfError;}});
  form.addEventListener('submit',calculate); form.addEventListener('input',function(){if(last)clear(words.changed);}); form.addEventListener('change',function(){if(last&&!isCurrent())clear(words.changed);});

  var theme=byId('fx-theme');
  function effective(){return document.documentElement.getAttribute('data-theme')||(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');}
  function sync(){document.body.dataset.fxTheme=effective();theme.setAttribute('aria-pressed',String(effective()==='dark'));}
  theme.addEventListener('click',function(){var next=effective()==='dark'?'light':'dark';document.documentElement.setAttribute('data-theme',next);try{localStorage.setItem('afrotools-theme',next);}catch(caught){}sync();});
  new MutationObserver(sync).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']}); sync(); clear();
}());
