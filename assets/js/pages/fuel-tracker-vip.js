(function(){
 'use strict';
 var MAX_AGE_DAYS=45;
 document.addEventListener('DOMContentLoaded',function(){
  var root=document.querySelector('[data-fuel-market-locale]');if(!root)return;
  var engine=window.AfroTools.FuelTrackerEngine,copy=window.AfroTools.FuelMarketCopy,locale=root.dataset.fuelMarketLocale;
  var markets=[],payload=null,selected=null,record=null,reference=false,result=null,locationRequest=0;
  var byId=function(id){return root.querySelector('#'+id);};
  var t=function(key,values){return copy.get(locale,key,values);};
  var num=function(n){return Number(n).toLocaleString(locale,{maximumFractionDigits:4});};
  var money=function(n,currency){try{return new Intl.NumberFormat(locale,{style:'currency',currency:currency}).format(n);}catch(_){return currency+' '+num(n);}};
  function event(name,values){var data=Object.assign({tool_id:'fuel-tracker'},values||{});if(window.AfroTools.analytics&&typeof window.AfroTools.analytics.track==='function')window.AfroTools.analytics.track(name,data);else if(typeof window.gtag==='function')window.gtag('event',name,data);}
  function country(code,fallback){try{return new Intl.DisplayNames([locale],{type:'region'}).of(code);}catch(_){return fallback;}}
  function place(m){return m.granularity==='national'?country(m.country_code,m.country_name):m.locality_name;}
  function status(r){
   var now=new Date().toISOString(),s=engine.recordStatus(r,now,payload&&payload.stale_after_days||MAX_AGE_DAYS);
   // Eligibility is conservative; an invalid/future date is never proof of a current price.
   var effective=Date.parse(r&&r.effective_date),verified=Date.parse(r&&r.last_verified_at);
   if(!r||!Number.isFinite(effective)||!Number.isFinite(verified)||effective>Date.parse(now)||verified>Date.parse(now)||!/^https:\/\//.test(r.source_url||'')||r.unit!=='litre')s.available=false;
   return s;
  }
  function invalidate(){result=null;byId('fuel-fill-result').hidden=true;byId('fuel-fill-txt').disabled=byId('fuel-fill-json').disabled=true;byId('fuel-fill-status').textContent=t('none');}
  function sourceLink(node,r){node.replaceChildren();if(r&&/^https:\/\//.test(r.source_url||'')){var a=document.createElement('a');a.href=r.source_url;a.textContent=r.source_name;a.target='_blank';a.rel='noopener noreferrer';node.appendChild(a);}else node.textContent='—';}
  function render(){
   invalidate();selected=markets.find(function(m){return m.market_id===byId('fuel-market').value;})||null;record=engine.marketRecord(selected,byId('fuel-type').value);var s=status(record);reference=s.available;
   byId('fuel-result-place').textContent=selected?place(selected):t('unavailable');
   byId('fuel-result-granularity').textContent=selected?t(selected.granularity):'';
   byId('fuel-result-confidence').textContent=s.available?t(['high','medium','low'].includes(record.confidence)?record.confidence:'low'):t(s.stale?'stale':'unavailable');
   byId('fuel-result-confidence').className='fuel-confidence '+(s.available?record.confidence:'warn');
   byId('fuel-result-price').textContent=s.available?money(record.price,record.currency)+' / L':t('unavailable');
   byId('fuel-result-note').textContent=t(s.available?'reference':'withheld');
   byId('fuel-result-effective').textContent=record&&record.effective_date||'—';byId('fuel-result-verified').textContent=record&&record.last_verified_at||'—';sourceLink(byId('fuel-result-source'),record);
   byId('fuel-result-coverage').textContent=selected?t(selected.granularity):'—';
   byId('fuel-original-notes').textContent=[selected&&selected.coverage_note,record&&record.notes].filter(Boolean).join(' ');
   var other=engine.marketRecord(selected,byId('fuel-type').value==='petrol'?'diesel':'petrol');
   byId('fuel-result-comparison').textContent=s.available&&status(other).available&&other.currency===record.currency?t('comparison',{fuel:t(other.fuel_type),difference:money(other.price-record.price,record.currency)}):t('noComparison');
   byId('fuel-price').value=s.available?record.price:'';byId('fuel-currency').value=record&&record.currency||'USD';byId('fuel-price-help').textContent=t(s.available?'reference':'manual');
   event(s.available?'fuel_localized_result_shown':'fuel_unavailable_shown',{market_id:selected&&selected.market_id||'none',country_code:selected&&selected.country_code||'none',fuel_type:byId('fuel-type').value,data_granularity:selected&&selected.granularity||'none',location_used:false,result_shown:s.available,reason:s.available?'':s.stale?'stale':'missing'});
  }
  function marketOptions(preferred){var select=byId('fuel-market');select.replaceChildren();markets.filter(function(m){return m.country_code===byId('fuel-country').value;}).forEach(function(m){select.add(new Option(place(m)+' — '+t(m.granularity),m.market_id));});if(preferred)select.value=preferred;select.disabled=!select.options.length;render();}
  function coverage(){var eligible=0,count=0,body=byId('fuel-table-body');body.replaceChildren();markets.forEach(function(m){(m.fuels||[]).forEach(function(r){var s=status(r);count++;if(s.available)eligible++;var tr=document.createElement('tr');[place(m),t(m.granularity),t(r.fuel_type),t(s.available?'eligible':s.stale?'stale':'unavailable'),r.effective_date,r.source_name].forEach(function(value,i){var td=document.createElement('td');td.dataset.label=t(['market','coverage','fuel','availability','effective','source'][i]);td.textContent=value;if(i===5)sourceLink(td,r);tr.appendChild(td);});body.appendChild(tr);});});byId('fuel-data-status').textContent=t('counts',{eligible:eligible,unavailable:count-eligible});}
  function mode(){var tank=byId('fuel-fill-mode').value==='tank';byId('fuel-quantity-field').hidden=tank;byId('fuel-tank-field').hidden=!tank;byId('fuel-level-field').hidden=!tank;}
  function calculate(e){
   e.preventDefault();invalidate();var input={pricePerLitre:byId('fuel-price').value,mode:byId('fuel-fill-mode').value,unit:byId('fuel-unit').value,quantity:byId('fuel-quantity').value,tankSize:byId('fuel-tank-size').value,currentLevelPct:byId('fuel-current-level').value};
   var required=input.mode==='tank'?['pricePerLitre','tankSize','currentLevelPct']:['pricePerLitre','quantity'];var currency=byId('fuel-currency').value.toUpperCase();
   if(required.some(function(k){return input[k].trim()===''||!Number.isFinite(Number(input[k]));})||!/^[A-Z]{3}$/.test(currency)){byId('fuel-fill-status').textContent=t('invalid');return;}
   var calc=engine.calculateFillCost(input);if(!calc.ok){byId('fuel-fill-status').textContent=t('invalid');return;}
   // Recheck at calculation time: a reference may expire while the page remains open.
   if(reference&&!status(record).available){render();return;}
   result={schemaVersion:1,toolId:'fuel-tracker',locale:locale,inputs:Object.assign({},input,{currency:currency}),calculation:calc,priceBasis:reference?'market-reference':'manual',market:reference?{id:selected.market_id,countryCode:selected.country_code,granularity:selected.granularity,effectiveDate:record.effective_date,lastVerifiedAt:record.last_verified_at,sourceName:record.source_name,sourceUrl:record.source_url}:null};
   byId('fuel-fill-total').textContent=money(calc.totalCost,currency);byId('fuel-fill-volume').textContent=num(calc.inputAmount)+' '+t(calc.inputUnit)+' = '+num(calc.litres)+' L';byId('fuel-fill-result').hidden=false;byId('fuel-fill-status').textContent=t('done');byId('fuel-fill-txt').disabled=byId('fuel-fill-json').disabled=false;event('fuel_fill_cost_completed',{market_id:selected&&selected.market_id||'manual',country_code:selected&&selected.country_code||'manual',fuel_type:byId('fuel-type').value,input_unit:calc.inputUnit,fill_mode:calc.mode});
  }
  function download(format){if(!result)return;if(result.priceBasis==='market-reference'&&!status(record).available){render();return;}var text=format==='json'?JSON.stringify(result,null,2):[t('estimated')+': '+money(result.calculation.totalCost,result.inputs.currency),t('price')+': '+result.inputs.pricePerLitre+' '+result.inputs.currency,t('volume')+': '+result.calculation.litres,t('mode')+': '+t(result.inputs.mode==='tank'?'tank':'quantity'),t('quantity')+': '+result.calculation.inputAmount+' '+t(result.inputs.unit),result.inputs.mode==='tank'?t('tankSize')+': '+result.inputs.tankSize+' '+t(result.inputs.unit)+'\n'+t('level')+': '+result.inputs.currentLevelPct:'',t('basis')+': '+t(result.market?'reference':'manual'),result.market?[t('market')+': '+place(selected),t('coverage')+': '+t(result.market.granularity),t('effective')+': '+result.market.effectiveDate,t('verified')+': '+result.market.lastVerifiedAt,t('source')+': '+result.market.sourceName+' '+result.market.sourceUrl].join('\n'):'',t('policy')].filter(Boolean).join('\n');var url=URL.createObjectURL(new Blob([text],{type:format==='json'?'application/json':'text/plain;charset=utf-8'})),a=document.createElement('a');a.href=url;a.download='fuel-fill.'+format;a.click();setTimeout(function(){URL.revokeObjectURL(url);},1000);}
  byId('fuel-fill-form').addEventListener('submit',calculate);byId('fuel-fill-form').addEventListener('input',function(e){if(['fuel-price','fuel-currency'].includes(e.target.id)){reference=false;byId('fuel-price-help').textContent=t('manual');}invalidate();});byId('fuel-fill-form').addEventListener('change',function(){mode();invalidate();});
  byId('fuel-country').addEventListener('change',function(){locationRequest++;marketOptions();event('fuel_country_selected',{country_code:this.value});});byId('fuel-market').addEventListener('change',function(){locationRequest++;render();event('fuel_market_selected',{market_id:this.value});});byId('fuel-type').addEventListener('change',function(){render();event('fuel_type_selected',{fuel_type:this.value});});
  byId('fuel-fill-txt').addEventListener('click',function(){download('txt');});byId('fuel-fill-json').addEventListener('click',function(){download('json');});
  byId('fuel-use-location').addEventListener('click',function(){var request=++locationRequest;byId('fuel-location-status').textContent=t('waiting');event('fuel_location_requested',{location_used:true});if(!navigator.geolocation){byId('fuel-location-status').textContent=t('denied');event('fuel_location_unavailable',{reason:'unsupported'});return;}navigator.geolocation.getCurrentPosition(function(position){if(request!==locationRequest)return;var nearest=engine.nearestMarket(markets,position.coords.latitude,position.coords.longitude);if(!nearest||!Number.isFinite(nearest.distanceKm)){byId('fuel-location-status').textContent=t('denied');event('fuel_location_unavailable',{reason:'no_market'});return;}byId('fuel-country').value=nearest.market.country_code;marketOptions(nearest.market.market_id);byId('fuel-location-status').textContent=t('matched',{place:place(nearest.market),distance:Math.round(nearest.distanceKm)});event('fuel_location_granted',{location_used:true,market_id:nearest.market.market_id,country_code:nearest.market.country_code});},function(error){if(request!==locationRequest)return;byId('fuel-location-status').textContent=t('denied');event('fuel_location_denied',{reason:error&&error.code===1?'denied':'unavailable'});},{enableHighAccuracy:false,maximumAge:300000,timeout:10000});});
  mode();fetch('/data/fuel/markets.json',{cache:'no-store',credentials:'same-origin'}).then(function(response){if(!response.ok)throw Error('load');return response.json();}).then(function(data){if(!engine.validateDataset(data).valid)throw Error('dataset');payload=data;markets=data.markets;var select=byId('fuel-country'),countries=[];select.replaceChildren();markets.forEach(function(m){if(!countries.includes(m.country_code)){countries.push(m.country_code);select.add(new Option(country(m.country_code,m.country_name),m.country_code));}});select.disabled=false;marketOptions();coverage();}).catch(function(){byId('fuel-data-status').textContent=t('loadFailed');render();});
 });
}());
