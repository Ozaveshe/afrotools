(function(){
  'use strict';
  var engine=window.MortgageBudgetBoundary;if(!engine)return;
  var copy={
    en:{invalid:'Enter a monthly budget above zero and non-negative costs up to 1,000,000,000,000.',confirm:'Confirm that this ceiling is your own household planning choice.',title:'Monthly payment boundary',summary:'This is the amount left inside your chosen housing budget after the costs and cushion you entered. It is not a loan amount, approval result or lender rule.',budget:'Chosen housing budget',costs:'Recurring costs reserved',cushion:'Cushion retained',shortfall:'Your reserved costs exceed the chosen budget by',copied:'Budget summary copied.',downloaded:'Text summary downloaded.',pdfReady:'Private PDF downloaded.',pdfError:'PDF could not be created.',filename:'mortgage-budget-boundary'},
    fr:{invalid:'Saisissez un budget mensuel supérieur à zéro et des montants positifs jusqu’à 1 000 000 000 000.',confirm:'Confirmez que ce plafond est votre propre choix de budget.',title:'Plafond de mensualité',summary:'C’est le montant restant dans votre budget logement après les coûts et la marge saisis. Ce n’est ni un montant de prêt, ni un accord, ni une règle bancaire.',budget:'Budget logement choisi',costs:'Coûts récurrents réservés',cushion:'Marge conservée',shortfall:'Les coûts réservés dépassent le budget choisi de',copied:'Résumé du budget copié.',downloaded:'Résumé texte téléchargé.',pdfReady:'PDF privé téléchargé.',pdfError:'Le PDF n’a pas pu être créé.',filename:'cadre-budget-immobilier'},
    sw:{invalid:'Weka bajeti ya mwezi iliyo juu ya sifuri na gharama zisizo hasi hadi 1,000,000,000,000.',confirm:'Thibitisha kuwa kikomo hiki ni chaguo lako la bajeti ya kaya.',title:'Kikomo cha malipo ya mwezi',summary:'Hiki ndicho kiasi kilichobaki ndani ya bajeti ya nyumba uliyochagua baada ya gharama na akiba uliyoweka. Si kiasi cha mkopo, idhini wala sheria ya benki.',budget:'Bajeti ya nyumba uliyochagua',costs:'Gharama za kawaida zilizotengwa',cushion:'Akiba iliyobakizwa',shortfall:'Gharama ulizotenga zinazidi bajeti uliyochagua kwa',copied:'Muhtasari wa bajeti umenakiliwa.',downloaded:'Muhtasari wa maandishi umepakuliwa.',pdfReady:'PDF binafsi imepakuliwa.',pdfError:'PDF haikuweza kutengenezwa.',filename:'kikomo-bajeti-nyumba'}
  };
  function init(){
    var form=document.getElementById('mb-form');if(!form)return;
    var lang=(document.documentElement.lang||'en').slice(0,2),text=copy[lang]||copy.en,last=null;
    var result=document.getElementById('mb-result'),error=document.getElementById('mb-error'),live=document.getElementById('mb-live');
    function money(value){
      var currency=document.getElementById('mb-currency').value;
      try{return new Intl.NumberFormat(lang==='sw'?'sw-KE':lang==='fr'?'fr-FR':'en',{style:'currency',currency:currency,maximumFractionDigits:2}).format(value);}
      catch(e){return currency+' '+Number(value).toLocaleString();}
    }
    function calculate(event){
      if(event)event.preventDefault();
      if(!document.getElementById('mb-confirm').checked){last=null;result.classList.remove('on');error.textContent=text.confirm;error.classList.add('on');error.focus();return;}
      var values=engine.calculate({monthlyBudget:document.getElementById('mb-budget').value,recurringCosts:document.getElementById('mb-costs').value,cushion:document.getElementById('mb-cushion').value});
      if(!values.valid){last=null;result.classList.remove('on');error.textContent=text.invalid;error.classList.add('on');error.focus();return;}
      last={values:values,currency:document.getElementById('mb-currency').value};error.classList.remove('on');
      document.getElementById('mb-boundary').textContent=money(values.paymentBoundary);
      document.getElementById('mb-budget-out').textContent=money(values.monthlyBudget);
      document.getElementById('mb-costs-out').textContent=money(values.recurringCosts);
      document.getElementById('mb-cushion-out').textContent=money(values.cushion);
      var warning=document.getElementById('mb-warning');
      warning.textContent=values.shortfall>0?text.shortfall+' '+money(values.shortfall)+'.':text.summary;
      result.classList.add('on');result.focus();live.textContent=text.title+': '+money(values.paymentBoundary);
    }
    function exportText(){
      if(!last)calculate();if(!last)return '';
      var value=last.values;
      return [document.title,text.title+': '+money(value.paymentBoundary),text.budget+': '+money(value.monthlyBudget),text.costs+': '+money(value.recurringCosts),text.cushion+': '+money(value.cushion),'',text.summary].join('\n');
    }
    function downloadText(){
      var value=exportText();if(!value)return;
      var blob=new Blob([value],{type:'text/plain;charset=utf-8'}),link=document.createElement('a');link.href=URL.createObjectURL(blob);link.download=text.filename+'.txt';link.click();setTimeout(function(){URL.revokeObjectURL(link.href);},0);live.textContent=text.downloaded;
    }
    function downloadPdf(){
      var value=exportText();if(!value)return;
      try{
        var Pdf=window.jspdf&&window.jspdf.jsPDF;if(!Pdf)throw new Error('missing PDF library');
        var pdf=new Pdf({unit:'pt',format:'a4'}),lines=pdf.splitTextToSize(value,500);
        pdf.setFont('helvetica','bold');pdf.setFontSize(17);pdf.text(document.title,46,54);
        pdf.setFont('helvetica','normal');pdf.setFontSize(11);pdf.text(lines.slice(1),46,84,{lineHeightFactor:1.45});
        pdf.save(text.filename+'.pdf');live.textContent=text.pdfReady;
      }catch(e){live.textContent=text.pdfError;}
    }
    form.addEventListener('submit',calculate);
    form.addEventListener('input',function(){if(last){last=null;result.classList.remove('on');live.textContent='';}});
    document.getElementById('mb-copy').addEventListener('click',function(){var value=exportText();if(!value)return;var done=function(){live.textContent=text.copied;};if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(value).then(done).catch(function(){window.prompt('',value);});else window.prompt('',value);});
    document.getElementById('mb-download').addEventListener('click',downloadText);
    document.getElementById('mb-pdf').addEventListener('click',downloadPdf);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
