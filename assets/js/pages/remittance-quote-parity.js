(function(){
  'use strict';
  const root=document.querySelector('[data-remittance-parity]');
  if(!root||!window.RemittanceQuoteComparatorEngine)return;
  const sw=root.dataset.locale==='sw';
  const form=document.getElementById('rm-form');
  const output=document.getElementById('rm-result-list');
  const status=document.getElementById('rm-status');
  const error=document.getElementById('rm-error');
  let last=null;
  const t=sw?{
    invalid:'Jaza nukuu zote kwa thamani halali.',updated:'Ulinganisho umekokotolewa kwenye kifaa hiki.',copied:'Muhtasari umenakiliwa.',downloaded:'JSON imepakuliwa.',highest:'Kiasi kikubwa zaidi cha mpokeaji',none:'Hakuna nukuu halali zinazolingana.',debit:'Jumla inayokatwa',recipient:'Kiasi cha mpokeaji',rate:'Kiwango halisi',fee:'Ada iliyoandikwa',checked:'Ilikaguliwa',expiry:'Hali ya muda',difference:'Tofauti na kiwango cha juu',boundary:'Kiasi kikubwa si pendekezo. Kagua nukuu, uhalali, njia ya kupokea, usalama na mipaka kabla ya kutuma.'
  }:{
    invalid:'Complete every quote with valid values.',updated:'Comparison calculated on this device.',copied:'Summary copied.',downloaded:'JSON downloaded.',highest:'Highest recipient amount',none:'No eligible comparable quotes.',debit:'Total debit',recipient:'Recipient amount',rate:'Effective rate',fee:'Stated fee',checked:'Checked',expiry:'Expiry state',difference:'Difference from highest',boundary:'Highest recipient amount is not a recommendation. Recheck the quote, expiry, payout route, safety and limits before sending.'
  };
  function value(id){return document.getElementById(id).value.trim();}
  function quote(letter){return{label:value(`rm-${letter}-label`),sendCurrency:value(`rm-${letter}-send`),totalDebit:value(`rm-${letter}-debit`),receiveCurrency:value(`rm-${letter}-receive`),recipientAmount:value(`rm-${letter}-recipient`),statedFee:value(`rm-${letter}-fee`),payoutMethod:value(`rm-${letter}-payout`),deliveryMinutes:value(`rm-${letter}-delivery`),observedAt:value(`rm-${letter}-observed`),expiresAt:value(`rm-${letter}-expires`)};}
  function clear(){last=null;output.replaceChildren();document.getElementById('rm-primary-value').textContent='—';status.textContent='';}
  function calculate(event){
    if(event)event.preventDefault();
    if(!form.checkValidity()){error.textContent=t.invalid;form.reportValidity();clear();return null;}
    const quotes=[quote('a'),quote('b')];if(document.getElementById('rm-third').checked)quotes.push(quote('c'));
    try{last=window.RemittanceQuoteComparatorEngine.calculate({asOf:new Date().toISOString(),quotes});}
    catch(exception){error.textContent=t.invalid;clear();return null;}
    error.textContent='';render(last);status.textContent=t.updated;return last;
  }
  function metric(label,text){const wrap=document.createElement('div');wrap.className='rm-metric';const name=document.createElement('span');name.textContent=label;const value=document.createElement('strong');value.textContent=text;wrap.append(name,value);return wrap;}
  function fmt(number,currency){return `${Number(number).toLocaleString(sw?'sw-TZ':'en',{maximumFractionDigits:8})} ${currency}`;}
  function render(result){
    const primary=result.hasEligibleComparison?result.groups.map((group)=>fmt(group.highestRecipientAmount,group.receiveCurrency)).join(' · '):t.none;
    document.getElementById('rm-primary-label').textContent=result.hasEligibleComparison?t.highest:'';
    document.getElementById('rm-primary-value').textContent=primary;
    output.replaceChildren();
    result.quotes.forEach((row)=>{const card=document.createElement('article');card.className='rm-result';card.dataset.highest=String(row.highestAmongEligibleComparable);const head=document.createElement('strong');head.textContent=row.label;const metrics=document.createElement('div');metrics.className='rm-metrics';metrics.append(metric(t.debit,fmt(row.totalDebit,row.sendCurrency)),metric(t.recipient,fmt(row.recipientAmount,row.receiveCurrency)),metric(t.rate,`${row.effectiveRate.toLocaleString(sw?'sw-TZ':'en',{maximumFractionDigits:8})} ${row.receiveCurrency}/${row.sendCurrency}`),metric(t.fee,row.statedFee===null?'—':fmt(row.statedFee,row.sendCurrency)),metric(t.checked,new Date(row.observedAt).toLocaleString(sw?'sw-TZ':'en')),metric(t.expiry,row.expiryState),metric(t.difference,row.differenceFromHighestRecipient===null?'—':fmt(row.differenceFromHighestRecipient,row.receiveCurrency)));card.append(head,metrics);output.appendChild(card);});
  }
  function summary(result){return [t.highest+': '+(result.hasEligibleComparison?result.groups.map((group)=>fmt(group.highestRecipientAmount,group.receiveCurrency)).join('; '):t.none),...result.quotes.map((row)=>`${row.label}: ${t.debit} ${fmt(row.totalDebit,row.sendCurrency)}; ${t.recipient} ${fmt(row.recipientAmount,row.receiveCurrency)}; ${t.expiry} ${row.expiryState}`),t.boundary].join('\n');}
  function ensure(){return last||calculate();}
  document.getElementById('rm-copy').addEventListener('click',()=>{const result=ensure();if(result&&navigator.clipboard)navigator.clipboard.writeText(summary(result)).then(()=>{status.textContent=t.copied;});});
  document.getElementById('rm-json').addEventListener('click',()=>{const result=ensure();if(!result)return;const blob=new Blob([JSON.stringify({schemaVersion:1,methodology:result.methodology,result},null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const anchor=document.createElement('a');anchor.href=url;anchor.download=`${root.dataset.tool}-quote-comparison.json`;document.body.appendChild(anchor);anchor.click();anchor.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);status.textContent=t.downloaded;});
  document.getElementById('rm-third').addEventListener('change',function(){const section=document.getElementById('rm-quote-c');section.hidden=!this.checked;section.querySelectorAll('input,select').forEach((control)=>{control.disabled=!this.checked;});clear();});
  form.addEventListener('submit',calculate);form.addEventListener('input',clear);form.addEventListener('reset',()=>setTimeout(clear,0));
}());
