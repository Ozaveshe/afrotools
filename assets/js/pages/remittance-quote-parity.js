(function(){
  'use strict';
  const root=document.querySelector('[data-remittance-parity]');
  if(!root||!window.RemittanceQuoteComparatorEngine)return;
  const locale=root.dataset.locale||'en';
  const numberLocale=locale==='sw'?'sw-TZ':locale==='fr'?'fr-FR':'en';
  const form=document.getElementById('rm-form');
  const output=document.getElementById('rm-result-list');
  const status=document.getElementById('rm-status');
  const error=document.getElementById('rm-error');
  let last=null;
  const translations={
    en:{payout:'Payout method',delivery:'Delivery (minutes)',expires:'Expires at',asOf:'Compared at',payouts:{bank:'Bank','mobile-wallet':'Mobile wallet',cash:'Cash','crypto-wallet':'Crypto wallet',other:'Other'},invalid:'Complete every quote with valid values.',updated:'Comparison calculated on this device.',copied:'Summary copied.',copyFailed:'Could not copy. Download JSON instead.',downloaded:'JSON downloaded.',highest:'Highest recipient amount',none:'No eligible comparable quotes.',debit:'Total debit',recipient:'Recipient amount',rate:'Effective rate',fee:'Stated fee',checked:'Checked',expiry:'Expiry state',difference:'Difference from highest',boundary:'Highest recipient amount is not a recommendation. Recheck the quote, expiry, payout route, safety and limits before sending.',expiryStates:{expired:'expired',unknown:'unknown','not-expired':'not expired'}},
    fr:{payout:'Mode de réception',delivery:'Délai (minutes)',expires:'Expire le',asOf:'Comparé le',payouts:{bank:'Banque','mobile-wallet':'Portefeuille mobile',cash:'Espèces','crypto-wallet':'Portefeuille crypto',other:'Autre'},invalid:'Remplissez chaque devis avec des valeurs valides.',updated:'Comparaison calculée sur cet appareil.',copied:'Résumé copié.',copyFailed:'Impossible de copier. Téléchargez le fichier JSON.',downloaded:'Fichier JSON téléchargé.',highest:'Montant reçu le plus élevé',none:'Aucun devis admissible et comparable.',debit:'Total débité',recipient:'Montant du bénéficiaire',rate:'Taux effectif',fee:'Frais indiqués',checked:'Vérifié',expiry:'État d’expiration',difference:'Écart par rapport au montant le plus élevé',boundary:'Le montant reçu le plus élevé n’est pas une recommandation. Vérifiez le devis, son expiration, le mode de réception, la sécurité et les limites avant l’envoi.',expiryStates:{expired:'expiré',unknown:'inconnue','not-expired':'non expiré'}},
    sw:{payout:'Njia ya kupokea',delivery:'Muda wa kufika (dakika)',expires:'Inaisha',asOf:'Ililinganishwa',payouts:{bank:'Benki','mobile-wallet':'Pochi ya simu',cash:'Taslimu','crypto-wallet':'Pochi ya kripto',other:'Nyingine'},invalid:'Jaza nukuu zote kwa thamani halali.',updated:'Ulinganisho umekokotolewa kwenye kifaa hiki.',copied:'Muhtasari umenakiliwa.',copyFailed:'Imeshindikana kunakili. Pakua JSON badala yake.',downloaded:'JSON imepakuliwa.',highest:'Kiasi kikubwa zaidi cha mpokeaji',none:'Hakuna nukuu halali zinazolingana.',debit:'Jumla inayokatwa',recipient:'Kiasi cha mpokeaji',rate:'Kiwango halisi',fee:'Ada iliyoandikwa',checked:'Ilikaguliwa',expiry:'Hali ya muda',difference:'Tofauti na kiwango cha juu',boundary:'Kiasi kikubwa si pendekezo. Kagua nukuu, uhalali, njia ya kupokea, usalama na mipaka kabla ya kutuma.',expiryStates:{expired:'imeisha',unknown:'haijulikani','not-expired':'haijaisha'}}
  };
  const t=translations[locale]||translations.en;
  function value(id){return document.getElementById(id).value.trim();}
  function quote(letter){return{label:value(`rm-${letter}-label`),sendCurrency:value(`rm-${letter}-send`),totalDebit:value(`rm-${letter}-debit`),receiveCurrency:value(`rm-${letter}-receive`),recipientAmount:value(`rm-${letter}-recipient`),statedFee:value(`rm-${letter}-fee`),payoutMethod:value(`rm-${letter}-payout`),deliveryMinutes:value(`rm-${letter}-delivery`),observedAt:value(`rm-${letter}-observed`),expiresAt:value(`rm-${letter}-expires`)};}
  function clear(preserveError){last=null;output.replaceChildren();document.getElementById('rm-primary-label').textContent='';document.getElementById('rm-primary-value').textContent='—';status.textContent='';if(!preserveError){error.textContent='';error.removeAttribute('data-show');}}
  const errorFields={OBSERVED_AT_REQUIRED:'observed',OBSERVED_AT_FUTURE:'observed',INVALID_EXPIRY:'expires',EXPIRY_BEFORE_OBSERVED:'expires',TOTAL_DEBIT_REQUIRED:'debit',RECIPIENT_AMOUNT_REQUIRED:'recipient',INVALID_STATED_FEE:'fee',FEE_EXCEEDS_DEBIT:'fee',INVALID_DELIVERY:'delivery',LABEL_REQUIRED:'label',SEND_CURRENCY_REQUIRED:'send',RECEIVE_CURRENCY_REQUIRED:'receive',INVALID_PAYOUT_METHOD:'payout'};
  function clearFieldErrors(){form.querySelectorAll('[aria-invalid="true"]').forEach(field=>{field.removeAttribute('aria-invalid');const ids=(field.getAttribute('aria-describedby')||'').split(' ').filter(id=>id&&id!=='rm-error');if(ids.length)field.setAttribute('aria-describedby',ids.join(' '));else field.removeAttribute('aria-describedby');});}
  function fail(field){clear(true);clearFieldErrors();const label=field&&form.querySelector('label[for="'+field.id+'"] span');error.textContent=(label?label.textContent+': ':'')+t.invalid;error.dataset.show='true';if(field){field.setAttribute('aria-invalid','true');field.setAttribute('aria-describedby',((field.getAttribute('aria-describedby')||'')+' rm-error').trim());field.focus();}return null;}
  function calculate(event){
    if(event)event.preventDefault();
    clearFieldErrors();const invalid=Array.from(form.elements).find(field=>field.willValidate&&!field.validity.valid);if(invalid)return fail(invalid);
    const quotes=[quote('a'),quote('b')];
    if(document.getElementById('rm-third').checked)quotes.push(quote('c'));
    const asOf=new Date().toISOString();
    for(let index=0;index<quotes.length;index++){try{window.RemittanceQuoteComparatorEngine.calculate({asOf,quotes:[quotes[index],quotes[index]]});}catch(exception){return fail(document.getElementById('rm-'+['a','b','c'][index]+'-'+(errorFields[exception.message]||'label')));}}
    try{last=window.RemittanceQuoteComparatorEngine.calculate({asOf,quotes});}
    catch(exception){error.textContent=t.invalid;error.dataset.show='true';clear(true);return null;}
    error.textContent='';error.removeAttribute('data-show');render(last);status.textContent=t.updated;return last;
  }
  function metric(label,text){const wrap=document.createElement('div');wrap.className='rm-metric';const name=document.createElement('span');name.textContent=label;const valueNode=document.createElement('strong');valueNode.textContent=text;wrap.append(name,valueNode);return wrap;}
  function fmt(number,currency){return `${Number(number).toLocaleString(numberLocale,{maximumFractionDigits:8})} ${currency}`;}
  function expiryLabel(value){return t.expiryStates[value]||value;}
  function render(result){
    const primary=result.hasEligibleComparison?result.groups.map((group)=>fmt(group.highestRecipientAmount,group.receiveCurrency)).join(' · '):t.none;
    document.getElementById('rm-primary-label').textContent=result.hasEligibleComparison?t.highest:'';
    document.getElementById('rm-primary-value').textContent=primary;
    output.replaceChildren();
    result.quotes.forEach((row)=>{
      const card=document.createElement('article');card.className='rm-result';card.dataset.highest=String(row.highestAmongEligibleComparable);card.dataset.expiry=row.expiryState;
      const head=document.createElement('strong');head.textContent=row.label;
      const metrics=document.createElement('div');metrics.className='rm-metrics';
      metrics.append(metric(t.debit,fmt(row.totalDebit,row.sendCurrency)),metric(t.recipient,fmt(row.recipientAmount,row.receiveCurrency)),metric(t.rate,`${row.effectiveRate.toLocaleString(numberLocale,{maximumFractionDigits:8})} ${row.receiveCurrency}/${row.sendCurrency}`),metric(t.fee,row.statedFee===null?'—':fmt(row.statedFee,row.sendCurrency)),metric(t.checked,new Date(row.observedAt).toLocaleString(numberLocale)),metric(t.expiry,expiryLabel(row.expiryState)),metric(t.expires,row.expiresAt||'—'),metric(t.payout,t.payouts[row.payoutMethod]||'—'),metric(t.delivery,row.deliveryMinutes===null?'—':String(row.deliveryMinutes)),metric(t.difference,row.differenceFromHighestRecipient===null?'—':fmt(row.differenceFromHighestRecipient,row.receiveCurrency)));
      card.append(head,metrics);output.appendChild(card);
    });
  }
  function summary(result){return [t.asOf+': '+result.asOf,t.highest+': '+(result.hasEligibleComparison?result.groups.map((group)=>fmt(group.highestRecipientAmount,group.receiveCurrency)).join('; '):t.none),...result.quotes.map((row)=>[
    row.label,t.debit+': '+fmt(row.totalDebit,row.sendCurrency),t.recipient+': '+fmt(row.recipientAmount,row.receiveCurrency),
    t.rate+': '+row.effectiveRate+' '+row.receiveCurrency+'/'+row.sendCurrency,t.fee+': '+(row.statedFee===null?'—':fmt(row.statedFee,row.sendCurrency)),
    t.payout+': '+(t.payouts[row.payoutMethod]||'—'),t.delivery+': '+(row.deliveryMinutes===null?'—':row.deliveryMinutes),
    t.checked+': '+row.observedAt,t.expires+': '+(row.expiresAt||'—'),t.expiry+': '+expiryLabel(row.expiryState)
  ].join('; ')),t.boundary].join('\n');}
  function ensure(){return calculate();}
  async function copyText(text){
    if(navigator.clipboard&&navigator.clipboard.writeText){try{await navigator.clipboard.writeText(text);return true;}catch(exception){/* Continue with the local fallback. */}}
    const area=document.createElement('textarea');area.value=text;area.setAttribute('readonly','');area.style.position='fixed';area.style.left='-9999px';document.body.appendChild(area);area.select();let copied=false;try{copied=document.execCommand('copy');}catch(exception){copied=false;}area.remove();return copied;
  }
  document.getElementById('rm-copy').addEventListener('click',async()=>{const result=ensure();if(!result)return;status.textContent=await copyText(summary(result))?t.copied:t.copyFailed;});
  document.getElementById('rm-json').addEventListener('click',()=>{const result=ensure();if(!result)return;const blob=new Blob([JSON.stringify({schemaVersion:1,methodology:result.methodology,result},null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const anchor=document.createElement('a');anchor.href=url;anchor.download=`${root.dataset.tool}-quote-comparison.json`;document.body.appendChild(anchor);anchor.click();anchor.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);status.textContent=t.downloaded;});
  document.getElementById('rm-third').addEventListener('change',function(){const section=document.getElementById('rm-quote-c');section.hidden=!this.checked;section.querySelectorAll('input,select').forEach((control)=>{control.disabled=!this.checked;});clear();});
  const theme=document.getElementById('rm-theme');
  if(theme){const applyTheme=(dark)=>{document.documentElement.dataset.theme=dark?'dark':'light';document.body.dataset.remitTheme=dark?'dark':'light';theme.setAttribute('aria-pressed',String(dark));theme.textContent=dark?'Aperçu clair':'Aperçu sombre';};applyTheme(window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches);theme.addEventListener('click',()=>applyTheme(document.documentElement.dataset.theme!=='dark'));}
  form.addEventListener('submit',calculate);
  form.addEventListener('input',()=>{clear();clearFieldErrors();});
  form.addEventListener('reset',()=>setTimeout(()=>{const third=document.getElementById('rm-third');const section=document.getElementById('rm-quote-c');clearFieldErrors();third.checked=false;section.hidden=true;section.querySelectorAll('input,select').forEach((control)=>{control.disabled=true;});error.textContent='';clear();},0));
}());
