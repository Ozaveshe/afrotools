(function () {
  'use strict';
  var engine = window.AfroTools && window.AfroTools.engines && window.AfroTools.engines.investmentReturn;
  var locale = document.documentElement.lang === 'fr' ? 'fr' : 'en';
  var t = locale === 'fr' ? {
    final:'Solde projeté', contributed:'Total versé', interest:'Intérêts projetés',
    effective:'Taux annuel effectif', period:'Période', tableContributed:'Versements cumulés',
    tableInterest:'Intérêts cumulés', tableBalance:'Solde projeté', year:'Année',
    assumptions:'Hypothèses utilisées', nominal:'taux annuel nominal saisi', compound:'capitalisations par an',
    timingBegin:'versement mensuel au début de chaque mois', timingEnd:'versement mensuel à la fin de chaque mois',
    excludes:'Aucun frais, impôt, inflation, défaut, retrait ou variation de taux n’est modélisé.',
    ready:'Projection créée localement.', txt:'Compte rendu texte téléchargé.', pdf:'PDF créé localement.',
    pdfFail:'La création du PDF est indisponible.', title:'Projection intérêts composés et épargne régulière',
    boundary:'Estimation de planification uniquement. Le taux saisi est une hypothèse, pas une prévision ni un rendement garanti.',
    method:'Méthode : moteur AfroTools Investment Return ; taux mensuel équivalent calculé à partir du taux nominal saisi et de la fréquence choisie.',
    invalid:'Vérifiez les montants, le taux, la durée et la fréquence. Les montants ne peuvent pas être négatifs.',
    labels:{initial:'Capital initial',monthly:'Versement mensuel',rate:'Taux annuel nominal',years:'Durée',frequency:'Fréquence de capitalisation',timing:'Moment du versement'}
  } : {
    final:'Projected balance', contributed:'Total contributed', interest:'Projected interest',
    effective:'Effective annual rate', period:'Period', tableContributed:'Cumulative contributions',
    tableInterest:'Cumulative interest', tableBalance:'Projected balance', year:'Year',
    assumptions:'Assumptions used', nominal:'entered nominal annual rate', compound:'compounding periods per year',
    timingBegin:'monthly contribution at the beginning of each month', timingEnd:'monthly contribution at the end of each month',
    excludes:'Fees, taxes, inflation, defaults, withdrawals and rate changes are not modelled.',
    ready:'Projection created locally.', txt:'Text review downloaded.', pdf:'PDF created locally.',
    pdfFail:'PDF creation is unavailable.', title:'Compound interest and regular savings projection',
    boundary:'Planning estimate only. The entered rate is an assumption, not a forecast or guaranteed return.',
    method:'Method: AfroTools Investment Return engine; monthly-equivalent rate derived from the entered nominal rate and selected compounding frequency.',
    invalid:'Check the amounts, rate, term and frequency. Amounts cannot be negative.',
    labels:{initial:'Initial amount',monthly:'Monthly contribution',rate:'Nominal annual rate',years:'Term',frequency:'Compounding frequency',timing:'Contribution timing'}
  };
  var result = null;
  var form = document.getElementById('ciForm');
  var status = document.getElementById('ciStatus');
  var resultPanel = document.getElementById('ciResult');
  var currency = document.getElementById('ciCurrency');
  function value(id) { return Number(document.getElementById(id).value); }
  function money(number) {
    return new Intl.NumberFormat(locale, { style:'currency', currency:currency.value, maximumFractionDigits:2 }).format(number);
  }
  function percent(number) { return new Intl.NumberFormat(locale, { style:'percent', minimumFractionDigits:2, maximumFractionDigits:2 }).format(number); }
  function clear(node) { while (node.firstChild) node.removeChild(node.firstChild); }
  function cell(tag, text) { var node=document.createElement(tag); node.textContent=text; return node; }
  function input() {
    return {
      initialInvestment:value('ciInitial'), monthlyContribution:value('ciMonthly'),
      annualRatePercent:value('ciRate'), years:value('ciYears'),
      compoundsPerYear:value('ciFrequency'), contributionTiming:document.getElementById('ciTiming').value,
      inflationRatePercent:0
    };
  }
  function assumptionText() {
    return result.input.annualRatePercent + '% ' + t.nominal + '; ' + result.input.compoundsPerYear + ' ' + t.compound + '; ' +
      (result.input.contributionTiming === 'beginning' ? t.timingBegin : t.timingEnd) + '. ' + t.excludes;
  }
  function renderTable() {
    var body=document.getElementById('ciTableBody'),cards=document.getElementById('ciYearCards'); clear(body);clear(cards);
    result.yearData.forEach(function (row) {
      var tr=document.createElement('tr');
      tr.appendChild(cell('td',t.year+' '+new Intl.NumberFormat(locale,{maximumFractionDigits:2}).format(row.year)));
      tr.appendChild(cell('td',money(row.totalContributed)));
      tr.appendChild(cell('td',money(row.projectedGain)));
      tr.appendChild(cell('td',money(row.balance)));
      body.appendChild(tr);
      var article=document.createElement('article');article.className='ci-year-card';
      article.appendChild(cell('h4',t.year+' '+new Intl.NumberFormat(locale,{maximumFractionDigits:2}).format(row.year)));
      var list=document.createElement('dl');
      [[t.tableContributed,row.totalContributed],[t.tableInterest,row.projectedGain],[t.tableBalance,row.balance]].forEach(function(item){
        var pair=document.createElement('div');pair.appendChild(cell('dt',item[0]));pair.appendChild(cell('dd',money(item[1])));list.appendChild(pair);
      });
      article.appendChild(list);cards.appendChild(article);
    });
  }
  function calculate(event) {
    if (event) event.preventDefault();
    try {
      if (!engine) throw new Error('Calculation engine unavailable.');
      var values=input();
      if(values.initialInvestment>1000000000000||values.monthlyContribution>1000000000000)throw new RangeError('Amounts must not exceed 1,000,000,000,000.');
      result=engine.project(values);
      document.getElementById('ciFinal').textContent=money(result.finalValue);
      document.getElementById('ciContributed').textContent=money(result.totalContributed);
      document.getElementById('ciInterest').textContent=money(result.projectedGain);
      document.getElementById('ciEffective').textContent=percent(result.effectiveAnnualRate);
      document.getElementById('ciAssumptions').textContent=assumptionText();
      renderTable();
      resultPanel.hidden=false;
      document.getElementById('ciTxt').disabled=false;
      document.getElementById('ciPdf').disabled=false;
      status.textContent=t.ready;
      document.getElementById('ciResultHeading').focus();
    } catch (error) {
      result=null; resultPanel.hidden=true;
      document.getElementById('ciTxt').disabled=true; document.getElementById('ciPdf').disabled=true;
      status.textContent=locale==='fr'?t.invalid:error.message;
    }
  }
  function reportText() {
    if (!result) throw new Error('A completed projection is required.');
    var lines=[t.title,t.labels.initial+': '+money(result.input.initialInvestment),t.labels.monthly+': '+money(result.input.monthlyContribution),
      t.labels.rate+': '+result.input.annualRatePercent+'%',t.labels.years+': '+result.input.years,
      t.labels.frequency+': '+result.input.compoundsPerYear,t.labels.timing+': '+(result.input.contributionTiming==='beginning'?t.timingBegin:t.timingEnd),'',
      t.final+': '+money(result.finalValue),t.contributed+': '+money(result.totalContributed),t.interest+': '+money(result.projectedGain),
      t.effective+': '+percent(result.effectiveAnnualRate),'',t.assumptions+': '+assumptionText(),'',
      t.method,
      t.boundary];
    return lines.join('\n');
  }
  document.getElementById('ciTxt').addEventListener('click',function(){
    if(!result)return;var blob=new Blob([reportText()],{type:'text/plain;charset=utf-8'});var link=document.createElement('a');
    link.href=URL.createObjectURL(blob);link.download='compound-interest-'+locale+'.txt';link.click();setTimeout(function(){URL.revokeObjectURL(link.href);},0);status.textContent=t.txt;
  });
  document.getElementById('ciPdf').addEventListener('click',function(){
    if(!result||!window.jspdf||!window.jspdf.jsPDF){status.textContent=t.pdfFail;return;}
    var doc=new window.jspdf.jsPDF({unit:'pt',format:'a4'});var safe=reportText().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[’‘]/g,"'").replace(/[—–]/g,'-').replace(/[^\x20-\x7E\n]/g,' ');
    var lines=doc.splitTextToSize(safe,495),y=54;lines.forEach(function(line){if(y>790){doc.addPage();y=54;}doc.text(line,50,y);y+=15;});
    doc.save('compound-interest-'+locale+'.pdf');status.textContent=t.pdf;
  });
  form.addEventListener('submit',calculate);
  form.addEventListener('reset',function(){result=null;resultPanel.hidden=true;status.textContent='';document.getElementById('ciTxt').disabled=true;document.getElementById('ciPdf').disabled=true;});
})();
