(function(){
  'use strict';
  const root=document.querySelector('[data-mobile-money-parity]');if(!root||!window.MobileMoneyQuoteEngine)return;
  const locale=root.dataset.locale||'en',sw=locale==='sw',fr=locale==='fr',form=document.getElementById('mm-form'),output=document.getElementById('mm-result-list'),status=document.getElementById('mm-status'),error=document.getElementById('mm-error');let last=null;
  const t=sw?{invalid:'Jaza nukuu zote kwa thamani halali.',updated:'Ulinganisho umekokotolewa kwenye kifaa hiki.',copied:'Muhtasari umenakiliwa.',downloaded:'JSON imepakuliwa.',lowest:'Ada ya chini iliyoingizwa',none:'Hakuna nukuu halali zinazolingana.',amount:'Kiasi cha muamala',send:'Ada ya mtumaji',receive:'Ada ya kupokea/kutoa',total:'Jumla ya ada',percent:'Asilimia ya ada',checked:'Ilikaguliwa',expiry:'Hali ya muda',difference:'Tofauti na ada ya chini',boundary:'Ada ndogo si pendekezo la mtoa huduma. Thibitisha nukuu, muda, mipaka, usalama na masharti kabla ya muamala.'}:fr?{invalid:'Renseignez chaque devis avec des valeurs valides.',updated:'Comparaison calculée sur cet appareil.',copied:'Résumé copié.',downloaded:'JSON téléchargé.',lowest:'Frais totaux saisis les plus bas',none:'Aucun devis admissible et comparable.',amount:'Montant de la transaction',send:'Frais d’envoi',receive:'Frais de réception ou de retrait',total:'Frais totaux',percent:'Pourcentage des frais',checked:'Vérifié le',expiry:'État d’expiration',difference:'Écart par rapport au moins cher',boundary:'Les frais les plus bas ne constituent pas une recommandation. Revérifiez le devis, son expiration, les limites, la sécurité et les conditions avant la transaction.'}:{invalid:'Complete every quote with valid values.',updated:'Comparison calculated on this device.',copied:'Summary copied.',downloaded:'JSON downloaded.',lowest:'Lowest entered total fee',none:'No eligible comparable quotes.',amount:'Transaction amount',send:'Sender fee',receive:'Recipient/cash-out fee',total:'Total fee',percent:'Fee percentage',checked:'Checked',expiry:'Expiry state',difference:'Difference from lowest',boundary:'Lowest fee is not a provider recommendation. Recheck the quote, expiry, limits, safety and terms before transacting.'};
  const contextCopy=fr?{
    action:'Opération',comparison:'Participation à la comparaison',asOf:'Comparaison calculée le',expires:'Expire le',noExpiry:'Non renseignée',
    included:'Inclus dans cette comparaison',expired:'Exclu : devis expiré',unmatched:'Exclu : aucun autre devis non expiré ne correspond au marché, à la devise, à l’opération et au montant.',
    actions:{send:'Envoi',withdraw:'Retrait',merchant:'Paiement marchand',bill:'Paiement de facture',other:'Autre'}
  }:sw?{
    action:'Aina ya muamala',comparison:'Kushiriki katika ulinganisho',asOf:'Ilikokotolewa',expires:'Muda wa mwisho',noExpiry:'Haujawekwa',
    included:'Imejumuishwa katika ulinganisho huu',expired:'Haijajumuishwa: muda wa nukuu umeisha',unmatched:'Haijajumuishwa: hakuna nukuu nyingine ambayo muda wake haujaisha yenye soko, sarafu, aina ya muamala na kiasi sawa.',
    actions:{send:'Kutuma',withdraw:'Kutoa',merchant:'Kulipa mfanyabiashara',bill:'Kulipa bili',other:'Nyingine'}
  }:{
    action:'Transaction type',comparison:'Comparison participation',asOf:'Comparison calculated at',expires:'Expires at',noExpiry:'Not provided',
    included:'Included in this comparison',expired:'Excluded: quote expired',unmatched:'Excluded: no other unexpired quote matches the market, currency, transaction type and amount.',
    actions:{send:'Send',withdraw:'Withdraw',merchant:'Merchant payment',bill:'Bill payment',other:'Other'}
  };
  function timestamp(value){return new Intl.DateTimeFormat(localeTag(),{year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false,timeZoneName:'shortOffset'}).format(new Date(value));}
  function participation(row){return row.expiryState==='expired'?contextCopy.expired:row.comparable?contextCopy.included:contextCopy.unmatched;}
  const frenchExpiry = {expired:'Expiré', unknown:'Expiration non renseignée', 'not-expired':'Non expiré'};
  const frenchErrors = {
    OBSERVED_AT_FUTURE:['La date de vérification ne peut pas être dans le futur.', 'observed'],
    EXPIRY_BEFORE_OBSERVED:['L’expiration doit suivre la date de vérification.', 'expires'],
    INVALID_EXPIRY:['Renseignez une date d’expiration valide.', 'expires'],
    AMOUNT_REQUIRED:['Renseignez un montant positif, inférieur ou égal à 1 000 000 000 000 000.', 'amount'],
    SENDER_FEE_REQUIRED:['Renseignez des frais d’envoi valides, supérieurs ou égaux à zéro.', 'sender'],
    RECIPIENT_FEE_REQUIRED:['Renseignez des frais de réception ou de retrait valides, supérieurs ou égaux à zéro.', 'recipient']
  };
  const fieldErrors=fr?frenchErrors:sw?{
    OBSERVED_AT_FUTURE:['Tarehe ya ukaguzi haiwezi kuwa ya baadaye.','observed'],EXPIRY_BEFORE_OBSERVED:['Muda wa mwisho lazima ufuate tarehe ya ukaguzi.','expires'],INVALID_EXPIRY:['Weka tarehe halali ya mwisho.','expires'],AMOUNT_REQUIRED:['Weka kiasi chanya kisichozidi 1 000 000 000 000 000.','amount'],SENDER_FEE_REQUIRED:['Weka ada halali ya kutuma, sifuri au zaidi.','sender'],RECIPIENT_FEE_REQUIRED:['Weka ada halali ya kupokea au kutoa, sifuri au zaidi.','recipient']
  }:{OBSERVED_AT_FUTURE:['The checked date cannot be in the future.','observed'],EXPIRY_BEFORE_OBSERVED:['Expiry must follow the checked date.','expires'],INVALID_EXPIRY:['Enter a valid expiry date.','expires'],AMOUNT_REQUIRED:['Enter a positive amount no greater than 1 000 000 000 000 000.','amount'],SENDER_FEE_REQUIRED:['Enter a valid sender fee of zero or more.','sender'],RECIPIENT_FEE_REQUIRED:['Enter a valid recipient or cash-out fee of zero or more.','recipient']};
  Object.assign(fieldErrors,{
    OBSERVED_AT_REQUIRED:[fr?'Renseignez une date de vérification valide.':sw?'Weka tarehe halali ya ukaguzi.':'Enter a valid checked date.','observed'],
    LABEL_REQUIRED:[fr?'Renseignez un libellé valide pour ce devis.':sw?'Weka jina halali la nukuu hii.':'Enter a valid quote label.','label'],
    MARKET_REQUIRED:[fr?'Renseignez un pays valide.':sw?'Weka soko au nchi halali.':'Enter a valid market or country.','market'],
    CURRENCY_REQUIRED:[fr?'Renseignez un code de devise valide.':sw?'Weka msimbo halali wa sarafu.':'Enter a valid currency code.','currency']
  });
  function normalizeMarket(value){return value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('fr-FR').replace(/[^a-z0-9]/g,'');}
  function marketIdentifier(value){const key=normalizeMarket(value);const countries=(window.MobileMoneyTariffCopy||{}).marketCountries||[];const country=countries.find(country=>[country.id,...country.names].some(name=>normalizeMarket(name)===key));return country?country.id:null;}
  function expiryLabel(state){return (fr?frenchExpiry:sw?{expired:'Muda umeisha',unknown:'Muda wa mwisho haujawekwa','not-expired':'Muda haujaisha'}:{expired:'Expired',unknown:'Expiry not provided','not-expired':'Not expired'})[state]||t.expiry;}
  function fieldError(message,fields){
    clear();error.textContent=message;error.dataset.show='true';status.textContent=message;
    fields.forEach(field=>field.setAttribute('aria-invalid','true'));
    if(fields[0])fields[0].focus();
  }
  function value(id){return document.getElementById(id).value.trim();}function quote(letter){return{label:value(`mm-${letter}-label`),market:value(`mm-${letter}-market`),currency:value(`mm-${letter}-currency`),transactionType:value(`mm-${letter}-type`),amount:value(`mm-${letter}-amount`),senderFee:value(`mm-${letter}-sender`),recipientFee:value(`mm-${letter}-recipient`),observedAt:value(`mm-${letter}-observed`),expiresAt:value(`mm-${letter}-expires`)};}
  function clear(){last=null;output.replaceChildren();document.getElementById('mm-primary-label').textContent='';document.getElementById('mm-primary-value').textContent='—';status.textContent='';error.textContent='';error.dataset.show='false';form.querySelectorAll('[aria-invalid="true"]').forEach(node=>node.removeAttribute('aria-invalid'));}
  function localeTag(){return sw?'sw-TZ':fr?'fr-FR':'en';}
  function fmt(number,currency){return `${Number(number).toLocaleString(localeTag(),{maximumFractionDigits:8})} ${currency}`;}function metric(label,text){const box=document.createElement('div');box.className='rm-metric';const name=document.createElement('span');name.textContent=label;const strong=document.createElement('strong');strong.textContent=text;box.append(name,strong);return box;}
  function render(result){
    document.getElementById('mm-primary-label').textContent=result.hasEligibleComparison?t.lowest:'';
    document.getElementById('mm-primary-value').textContent=result.hasEligibleComparison?result.groups.map(group=>fmt(group.lowestTotalFee,group.currency)).join(' · '):t.none;
    output.replaceChildren();
    result.quotes.forEach(row=>{
      const card=document.createElement('article');card.className='rm-result';card.dataset.highest=String(row.lowestAmongEligibleComparable);card.dataset.expiry=row.expiryState;
      const head=document.createElement('strong');head.textContent=`${row.label} — ${row.market}`;
      const metrics=document.createElement('div');metrics.className='rm-metrics';
      metrics.append(metric(contextCopy.action,contextCopy.actions[row.transactionType]),metric(contextCopy.comparison,participation(row)),metric(t.amount,fmt(row.amount,row.currency)),metric(t.send,fmt(row.senderFee,row.currency)),metric(t.receive,fmt(row.recipientFee,row.currency)),metric(t.total,fmt(row.totalFee,row.currency)),metric(t.percent,`${row.feePercent.toLocaleString(localeTag(),{maximumFractionDigits:4})}%`),metric(t.checked,timestamp(row.observedAt)),metric(contextCopy.asOf,timestamp(result.asOf)),metric(contextCopy.expires,row.expiresAt?timestamp(row.expiresAt):contextCopy.noExpiry),metric(t.expiry,expiryLabel(row.expiryState)),metric(t.difference,row.differenceFromLowest===null?'—':fmt(row.differenceFromLowest,row.currency)));
      card.append(head,metrics);output.appendChild(card);
    });
  }
  function calculate(event){if(event)event.preventDefault();if(!form.checkValidity()){
    const fields=Array.from(form.querySelectorAll('input:invalid,select:invalid')),field=fields[0],suffix=field&&field.id.split('-').pop(),detail=fieldErrors[{observed:'OBSERVED_AT_REQUIRED',expires:'INVALID_EXPIRY',label:'LABEL_REQUIRED',market:'MARKET_REQUIRED',currency:'CURRENCY_REQUIRED',amount:'AMOUNT_REQUIRED',sender:'SENDER_FEE_REQUIRED',recipient:'RECIPIENT_FEE_REQUIRED'}[suffix]];fieldError(detail?detail[0]:t.invalid,fields);return null;
  }const quotes=[quote('a'),quote('b')];if(document.getElementById('mm-third').checked)quotes.push(quote('c'));
    quotes.forEach(row=>{const id=marketIdentifier(row.market);if(id)row.marketId=id;});
    const asOf=new Date().toISOString();
    for(let index=0;index<quotes.length;index++){
      try{window.MobileMoneyQuoteEngine.calculate({asOf,quotes:[quotes[index],quotes[index]]});}
      catch(exception){const detail=fieldErrors[exception.message],field=document.getElementById('mm-'+['a','b','c'][index]+'-'+(detail?detail[1]:'label'));fieldError(detail?detail[0]:t.invalid,[field]);return null;}
    }
    try{last=window.MobileMoneyQuoteEngine.calculate({asOf,quotes});}
    catch(exception){fieldError(t.invalid,[]);return null;}
    error.textContent='';error.dataset.show='false';render(last);status.textContent=t.updated;return last;}
  function summary(result){return [
    t.lowest+': '+(result.hasEligibleComparison?result.groups.map(group=>fmt(group.lowestTotalFee,group.currency)).join('; '):t.none),
    contextCopy.asOf+': '+timestamp(result.asOf),
    ...result.quotes.map(row=>`${row.label} (${row.market}): ${contextCopy.action} ${contextCopy.actions[row.transactionType]}; ${contextCopy.comparison} ${participation(row)}; ${t.amount} ${fmt(row.amount,row.currency)}; ${t.send} ${fmt(row.senderFee,row.currency)}; ${t.receive} ${fmt(row.recipientFee,row.currency)}; ${t.total} ${fmt(row.totalFee,row.currency)}; ${t.checked} ${timestamp(row.observedAt)}; ${contextCopy.expires} ${row.expiresAt?timestamp(row.expiresAt):contextCopy.noExpiry}; ${t.expiry} ${expiryLabel(row.expiryState)}`),
    t.boundary
  ].join('\n');}
  function ensure(){return calculate();}
  const copyFeedback=sw?{unavailable:'Kunakili hakupatikani katika kivinjari hiki. Pakua faili ya JSON ili kuhifadhi muhtasari.',denied:'Kunakili kumekataliwa. Pakua faili ya JSON ili kuhifadhi muhtasari.'}:fr?{unavailable:'La copie est indisponible dans ce navigateur. Téléchargez le fichier JSON pour conserver le résumé.',denied:'La copie a été refusée. Téléchargez le fichier JSON pour conserver le résumé.'}:{unavailable:'Copy is unavailable in this browser. Download the JSON file to save the summary.',denied:'Copy was denied. Download the JSON file to save the summary.'};
  document.getElementById('mm-copy').addEventListener('click',async()=>{const result=ensure();if(!result)return;
    if(!navigator.clipboard||typeof navigator.clipboard.writeText!=='function'){status.textContent=copyFeedback.unavailable;return;}
    try{await navigator.clipboard.writeText(summary(result));status.textContent=t.copied;}catch(_error){status.textContent=copyFeedback.denied;}
  });document.getElementById('mm-json').addEventListener('click',()=>{const result=ensure();if(!result)return;const blob=new Blob([JSON.stringify(fr?{schemaVersion:1,locale:'fr',resume:summary(result),methode:'Comparaison locale de devis saisis par l’utilisateur',methodology:result.methodology,result}: {schemaVersion:1,locale,summary:summary(result),methodology:result.methodology,result},null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),anchor=document.createElement('a');anchor.href=url;anchor.download=fr?'comparaison-devis-mobile-money.json':'mobile-money-quote-comparison.json';document.body.appendChild(anchor);anchor.click();anchor.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);status.textContent=t.downloaded;});
  document.getElementById('mm-third').addEventListener('change',function(){const section=document.getElementById('mm-quote-c');section.hidden=!this.checked;section.querySelectorAll('input,select').forEach(control=>{control.disabled=!this.checked;});clear();});form.addEventListener('submit',calculate);form.addEventListener('input',clear);form.addEventListener('reset',()=>setTimeout(()=>{clear();const section=document.getElementById('mm-quote-c');section.hidden=true;section.querySelectorAll('input,select').forEach(control=>{control.disabled=true;});},0));
  if(window.MobileMoneyReadiness)window.MobileMoneyReadiness.ready(form);
  // Only public country/action context is accepted; amounts, fees and dates remain user-entered.
  if(fr){
    const parameters=new URLSearchParams(location.search),country=(window.MobileMoneyTariffCopy.marketCountries||[]).find(row=>row.id===parameters.get('market')),operation=parameters.get('operation');
    if(country&&['send','withdraw','merchant','bill','other'].includes(operation)){
      for(const letter of ['a','b','c']){document.getElementById('mm-'+letter+'-market').value=country.names[0];document.getElementById('mm-'+letter+'-currency').value=country.currency;document.getElementById('mm-'+letter+'-type').value=operation;}
      status.textContent='Pays, devise et opération préremplis. Saisissez les montants, frais et dates que vous avez vérifiés ; aucun tarif Orange Money n’est calculé automatiquement.';
    }
  }

}());
(function(){
  'use strict';
  const root=document.querySelector('[data-mobile-money-tariffs]');
  if(!root||!window.MobileMoneyQuoteEngine)return;
  const form=document.getElementById('mm-tariff-form'),providerSelect=document.getElementById('mm-provider'),actionSelect=document.getElementById('mm-action'),amountInput=document.getElementById('mm-amount'),currency=document.getElementById('mm-currency'),resultNode=document.getElementById('mm-tariff-result'),status=document.getElementById('mm-tariff-status'),copy=window.MobileMoneyTariffCopy||{};
  form.noValidate=true;
  amountInput.max=String(window.MobileMoneyQuoteEngine.MAX_AMOUNT);
  let catalog=null;
  function localized(map,value){return map&&map[value]||value;}
  function localizedRule(quote){const exact=localized(copy.ruleLabels,quote.rule);if(exact!==quote.rule)return exact;if(copy.publishedBand&&/^Published\s+\w+\s+fee for this amount band$/.test(quote.rule))return copy.publishedBand;return quote.rule;}
  function provider(){return catalog&&catalog.providers.find(function(item){return item.id===providerSelect.value;});}
  function format(value,code){return Number(value).toLocaleString(root.dataset.locale||'en',{maximumFractionDigits:2})+' '+code;}
  function metric(label,value){const box=document.createElement('div'),name=document.createElement('span'),strong=document.createElement('strong');box.className='rm-metric';name.textContent=label;strong.textContent=value;box.append(name,strong);return box;}
  function updateActions(){const selected=provider();actionSelect.replaceChildren();if(!selected)return;Object.keys(selected.actions).forEach(function(action){const option=document.createElement('option');option.value=action;option.textContent=copy[action]||action;actionSelect.appendChild(option);});currency.textContent=selected.currency;amountInput.min=String(Math.min.apply(null,Object.keys(selected.actions).map(function(action){return selected.actions[action][0].min;})));}
  function renderUnavailable(quote){const box=document.createElement('div'),heading=document.createElement('strong'),detail=document.createElement('p');box.className='mm-unavailable';heading.textContent=copy.unavailable||'Unavailable';detail.textContent=localized(copy.reasonLabels,quote.reason);box.append(heading,detail);if(quote.source){const link=document.createElement('a');link.href=quote.source.url;link.rel='noopener';link.textContent=localized(copy.sourceTitles,quote.source.title);box.append(link);}resultNode.replaceChildren(box);}
  function render(quote){
    if(!quote.available){renderUnavailable(quote);return;}
    const article=document.createElement('article'),heading=document.createElement('h3'),metrics=document.createElement('div'),source=document.createElement('a');
    heading.textContent=localized(copy.countryLabels,quote.country)+' - '+quote.provider+' - '+(copy[quote.action]||quote.action);metrics.className='rm-metrics';
    metrics.append(metric(copy.amount||'Amount',format(quote.amount,quote.currency)),metric(copy.fee||'Fee',format(quote.fee,quote.currency)),metric(copy.receive||'Recipient receives',format(quote.recipientReceives,quote.currency)),metric(quote.totalIncludesAllCharges===false?(copy.subtotalTaxExcluded||'Amount + published fee (tax excluded)'):(copy.debit||'Total debited'),format(quote.totalIncludesAllCharges===false?quote.amountPlusPublishedFee:quote.totalDebited,quote.currency)),metric(copy.band||'Band',quote.band.label),metric(copy.effective||'Effective date',quote.effectiveDate||copy.unknown),metric(copy.verified||'Last verified',quote.lastVerified));
    article.append(heading,metrics);
    const rule=document.createElement('p');rule.textContent=localizedRule(quote);article.append(rule);
    if(quote.feeComponents){const components=document.createElement('p');components.textContent=Object.keys(quote.feeComponents).map(function(key){return localized(copy.feeComponentLabels,key)+': '+format(quote.feeComponents[key],quote.currency);}).join(' · ');article.append(components);}
    source.href=quote.source.url;source.rel='noopener';source.className='mm-source';source.textContent=(copy.source||'Official source')+': '+localized(copy.sourceTitles,quote.source.title);article.append(source);
    if(quote.caveats.length){const list=document.createElement('ul');quote.caveats.forEach(function(value){const item=document.createElement('li');item.textContent=localized(copy.caveatLabels,value);list.appendChild(item);});article.append(list);}
    resultNode.replaceChildren(article);
  }
  function clearResult(){resultNode.replaceChildren();amountInput.removeAttribute('aria-invalid');if(!form.dataset.readiness||form.dataset.readiness==='ready')status.textContent=copy.ready;}
  form.addEventListener('submit',function(event){
    event.preventDefault();resultNode.replaceChildren();
    if(!catalog){status.textContent=copy.catalogUnavailable;return;}
    if(!form.checkValidity()){
      status.textContent=copy.invalidAmount;amountInput.setAttribute('aria-invalid','true');amountInput.focus();return;
    }
    amountInput.removeAttribute('aria-invalid');
    try{const quote=window.MobileMoneyQuoteEngine.quoteTariff(catalog,{providerId:providerSelect.value,action:actionSelect.value,amount:amountInput.value});render(quote);status.textContent=quote.available?(copy.calculated||'Calculated locally from the published tariff catalog.'):copy.unavailable;}
    catch(error){resultNode.replaceChildren();status.textContent=copy.calculationFailed;}
  });
  providerSelect.addEventListener('change',updateActions);
  form.addEventListener('input',clearResult);
  form.addEventListener('change',clearResult);
  form.addEventListener('reset',function(){queueMicrotask(function(){updateActions();clearResult();});});
  fetch('/data/fintech/mobile-money-tariffs.json').then(function(response){if(!response.ok)throw new Error('CATALOG_UNAVAILABLE');return response.json();}).then(function(data){window.MobileMoneyQuoteEngine.validateCatalog(data);catalog=data;updateActions();if(window.MobileMoneyReadiness)window.MobileMoneyReadiness.ready(form);status.textContent='';}).catch(function(){catalog=null;resultNode.replaceChildren();if(window.MobileMoneyReadiness)window.MobileMoneyReadiness.fail(form);status.textContent=copy.catalogUnavailable||copy.unavailable||'Tariff catalog unavailable.';form.querySelectorAll('input,select,button').forEach(function(control){control.disabled=true;});});
}());
