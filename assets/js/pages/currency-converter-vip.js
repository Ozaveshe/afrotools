(function(){
  'use strict';

  var MAX_AGE_MS=7*24*60*60*1000;
  var NAMES={USD:'US Dollar',EUR:'Euro',GBP:'British Pound',AED:'UAE Dirham',AOA:'Angolan Kwanza',BIF:'Burundian Franc',BWP:'Botswana Pula',CDF:'Congolese Franc',CVE:'Cape Verdean Escudo',DJF:'Djiboutian Franc',DZD:'Algerian Dinar',EGP:'Egyptian Pound',ERN:'Eritrean Nakfa',ETB:'Ethiopian Birr',GHS:'Ghanaian Cedi',GMD:'Gambian Dalasi',GNF:'Guinean Franc',KES:'Kenyan Shilling',KMF:'Comorian Franc',LRD:'Liberian Dollar',LSL:'Lesotho Loti',LYD:'Libyan Dinar',MAD:'Moroccan Dirham',MGA:'Malagasy Ariary',MRU:'Mauritanian Ouguiya',MUR:'Mauritian Rupee',MWK:'Malawian Kwacha',MZN:'Mozambican Metical',NAD:'Namibian Dollar',NGN:'Nigerian Naira',RWF:'Rwandan Franc',SCR:'Seychellois Rupee',SDG:'Sudanese Pound',SLE:'Sierra Leonean Leone',SOS:'Somali Shilling',SSP:'South Sudanese Pound',STN:'São Tomé and Príncipe Dobra',SZL:'Eswatini Lilangeni',TND:'Tunisian Dinar',TZS:'Tanzanian Shilling',UGX:'Ugandan Shilling',XAF:'Central African CFA Franc',XOF:'West African CFA Franc',ZAR:'South African Rand',ZMW:'Zambian Kwacha'};
  var state={rates:null,timestamp:null,source:null,usable:false,result:null};
  function byId(id){return document.getElementById(id)}
  function mode(){var checked=document.querySelector('input[name="rateMode"]:checked');return checked?checked.value:'snapshot'}
  function finitePositive(value){var n=Number(value);return Number.isFinite(n)&&n>0?n:null}
  function rateFor(from,to){if(from===to)return 1;if(!state.rates)return null;var fromUsd=from==='USD'?1:finitePositive(state.rates[from]);var toUsd=to==='USD'?1:finitePositive(state.rates[to]);return fromUsd&&toUsd?toUsd/fromUsd:null}
  function formatNumber(value,code){return new Intl.NumberFormat('en',{style:'currency',currency:code,currencyDisplay:'code',maximumFractionDigits:value>=100?2:6}).format(value)}
  function formatRate(value){if(value>=1000)return value.toLocaleString('en',{maximumFractionDigits:4});return value.toLocaleString('en',{maximumSignificantDigits:8})}
  function sourceName(raw){return String(raw||'').toLowerCase().indexOf('fawaz')>=0?'fawazahmed currency-api via AfroTools':(String(raw||'').toLowerCase()==='frankfurter'?'Frankfurter via AfroTools':String(raw||'').toLowerCase()==='exchangerate-api'?'ExchangeRate-API via AfroTools':'AfroTools shared FX dataset')}
  function parsedTimestamp(data){var value=data&&(data.as_of||data.timestamp||data.updatedAt);var stamp=value?new Date(value):null;return stamp&&Number.isFinite(stamp.getTime())?stamp:null}
  function acceptable(data) { return !!acceptedSnapshot(data); }
  function acceptedSnapshot(data) {
    var providers = ['exchangerate-api', 'frankfurter', 'fawazahmed'];
    function observation(rate, date, source) {
      var stamp = typeof date === 'string' ? new Date(date) : null;
      if (typeof rate !== 'number' || !Number.isFinite(rate) || rate <= 0 || !stamp || !Number.isFinite(stamp.getTime()) || providers.indexOf(source) < 0) return null;
      var age = Date.now() - stamp.getTime();
      return age >= 0 && age <= MAX_AGE_MS ? { rate: rate, observed_at: stamp.toISOString(), source: source } : null;
    }
    if (!data || data.base !== 'USD' || !data.rates || typeof data.rates !== 'object' || Array.isArray(data.rates)) return null;
    var top = observation(1, data.as_of || data.timestamp, data.source);
    if (!top) return null;
    var qualified = data.qualification && typeof data.qualification === 'object';
    if (!qualified && (data.schemaVersion !== 1 || !Array.isArray(data.retained_rate_codes))) return null;
    var rates = {}, observations = { USD: top };
    Object.keys(data.rates).forEach(function (code) {
      if (!/^[A-Z]{3}$/.test(code) || code === 'USD') return;
      var rate = data.rates[code], item = null;
      if (qualified) {
        var q = data.qualification[code];
        if (!q || q.status !== 'available' || q.reason !== null || q.base?.status !== 'available' || q.target?.status !== 'available' || q.base.rate !== 1 || typeof q.target.rate !== 'number' || !Number.isFinite(q.target.rate) || Math.abs(q.target.rate - rate) > 0.0000005001) return;
        var base = observation(1, q.base.observed_at, q.base.source);
        item = observation(rate, q.target.observed_at, q.target.source);
        if (!base) return;
      } else if (data.retained_rate_codes.indexOf(code) >= 0) {
        var prior = data.rate_observations && data.rate_observations[code];
        if (prior && prior.rate === rate) item = observation(rate, prior.observed_at, prior.source);
      } else item = observation(rate, top.observed_at, top.source);
      if (item) { rates[code] = rate; observations[code] = item; }
    });
    if (!Object.keys(rates).length) return null;
    var oldest = Object.values(observations).map(function (item) { return item.observed_at; }).sort()[0];
    return { base: 'USD', rates: rates, timestamp: oldest, source: data.source, observations: observations };
  }
  function pairObservation(from, to) {
    var a = state.observations && state.observations[from], b = state.observations && state.observations[to];
    if (!a || !b) return null;
    var date = a.observed_at < b.observed_at ? a.observed_at : b.observed_at;
    if (Date.now() - new Date(date).getTime() > MAX_AGE_MS) return null;
    return { date: date, source: a.source === b.source ? sourceName(a.source) : sourceName(a.source) + ' + ' + sourceName(b.source) };
  }

  function setStatus(kind,text){var el=byId('fxStatus');el.className='fxv-status fxv-status--'+kind;el.textContent=text}
  function fillSelects(rates){var codes=['USD'].concat(Object.keys(rates||{})).filter(function(code,index,list){return /^[A-Z]{3}$/.test(code)&&finitePositive(code==='USD'?1:rates[code])&&list.indexOf(code)===index}).sort(function(a,b){var order=['USD','EUR','GBP','NGN','KES','GHS','ZAR'];var ai=order.indexOf(a),bi=order.indexOf(b);if(ai>=0||bi>=0)return(ai<0?99:ai)-(bi<0?99:bi);return a.localeCompare(b)});var markup=codes.map(function(code){return '<option value="'+code+'">'+code+' — '+(NAMES[code]||'Currency')+'</option>'}).join('');byId('fxFrom').innerHTML=markup;byId('fxTo').innerHTML=markup;var params=new URLSearchParams(location.search);var from=(params.get('from')||'USD').toUpperCase();var to=(params.get('to')||'NGN').toUpperCase();byId('fxFrom').value=codes.indexOf(from)>=0?from:'USD';byId('fxTo').value=codes.indexOf(to)>=0?to:(codes.indexOf('NGN')>=0?'NGN':codes[1]||'USD')}
  function renderSource(data){state.rates=data.rates;state.observations=data.observations;state.timestamp=parsedTimestamp(data);state.source=sourceName(data.source);state.usable=true;fillSelects(state.rates);setStatus('ready','Dated snapshot ready');byId('fxSourceLabel').textContent=state.source;byId('fxSourceDate').textContent='Rate date: '+new Intl.DateTimeFormat('en',{dateStyle:'medium',timeStyle:'short',timeZone:'UTC'}).format(state.timestamp)+' UTC';updateControls()}
  function failClosed(reason){state.rates=null;state.timestamp=null;state.source=null;state.usable=false;fillSelects({NGN:1,KES:1,GHS:1,ZAR:1,EUR:1,GBP:1});setStatus(reason==='stale'?'stale':'error',reason==='stale'?'Snapshot too old':'Rates unavailable');byId('fxSourceLabel').textContent='Snapshot conversion paused';byId('fxSourceDate').textContent=reason==='stale'?'The available dataset is more than seven days old.':'No valid dated dataset was returned.';updateControls()}
  async function load(){setStatus('loading','Checking rate date…');var sources=['/api/forex?base=USD','/data/forex/latest.json'];var sawStale=false;for(var i=0;i<sources.length;i++){try{var response=await fetch(sources[i],{cache:'no-cache',credentials:'same-origin'});if(!response.ok)continue;var data=await response.json();var accepted=acceptedSnapshot(data);if(accepted){renderSource(accepted);return}if(data&&data.rates)sawStale=true}catch(_){}}failClosed(sawStale?'stale':'error')}
  function updateManualLabel(){byId('fxManualPair').textContent='1 '+byId('fxFrom').value+' = ? '+byId('fxTo').value}
  function updateControls(){var manual=mode()==='manual';byId('fxManualGroup').hidden=!manual;byId('fxManualRate').required=manual;byId('fxConvert').disabled=!manual&&!state.usable;byId('fxConvert').textContent=manual?'Convert with my rate':'Convert with dated rate';updateManualLabel();byId('fxEmpty').textContent=manual?'Enter the exact provider rate for this pair, then convert.':(state.usable?'Enter an amount and convert with the dated snapshot.':'A usable dated snapshot is required, or choose “My provider rate”.')}
  function clearErrors(){byId('fxAmountError').textContent='';byId('fxManualError').textContent=''}
  function invalidateResult(){state.result=null;byId('fxResult').hidden=true;byId('fxEmpty').hidden=false;byId('fxActionStatus').textContent=''}
  function calculate(event){event.preventDefault();invalidateResult();clearErrors();var amount=finitePositive(byId('fxAmount').value);if(!amount){byId('fxAmountError').textContent='Enter an amount greater than zero.';byId('fxAmount').focus();return}var from=byId('fxFrom').value,to=byId('fxTo').value;var manual=mode()==='manual';var rate=manual?finitePositive(byId('fxManualRate').value):rateFor(from,to);if(manual&&!rate){byId('fxManualError').textContent='Enter a provider rate greater than zero.';byId('fxManualRate').focus();return}if(!rate){byId('fxAmountError').textContent='This pair is not available in the accepted dataset.';return}var observed=manual?null:pairObservation(from,to);if(!manual&&!observed){byId('fxAmountError').textContent='This pair is not available in the accepted dataset.';return}var converted=amount*rate;state.result={amount:amount,from:from,to:to,rate:rate,converted:converted,mode:manual?'User-entered provider rate':'Dated indicative snapshot',date:manual?'Checked by user':observed.date,source:manual?'User-provided quote':observed.source};byId('fxEmpty').hidden=true;byId('fxResult').hidden=false;byId('fxResultEquation').textContent=formatNumber(amount,from)+' converts to';byId('fxResultValue').textContent=formatNumber(converted,to);byId('fxRateUsed').textContent='1 '+from+' = '+formatRate(rate)+' '+to;byId('fxRateStatus').textContent=manual?'Your provider quote':'Dated '+new Intl.DateTimeFormat('en',{dateStyle:'medium'}).format(new Date(observed.date));byId('fxActionStatus').textContent=''}
  function summary(){var r=state.result;return r.amount+' '+r.from+' = '+r.converted.toFixed(6)+' '+r.to+'\nRate: 1 '+r.from+' = '+r.rate.toFixed(8)+' '+r.to+'\nRate basis: '+r.mode+'\nRate date: '+r.date+'\nSource: '+r.source+'\nProvider fees and spreads are not included.'}
  async function copy(){if(!state.result)return;try{await navigator.clipboard.writeText(summary());byId('fxActionStatus').textContent='Summary copied.'}catch(_){byId('fxActionStatus').textContent='Copy was blocked. Select the result text instead.'}}
  function csv(){if(!state.result)return;var r=state.result;var rows=[['amount','from','to','rate','converted','rate_basis','rate_date','source','fee_note'],[r.amount,r.from,r.to,r.rate,r.converted,r.mode,r.date,r.source,'Provider fees and spreads are not included']];var body=rows.map(function(row){return row.map(function(value){return '"'+String(value).replace(/"/g,'""')+'"'}).join(',')}).join('\r\n');var url=URL.createObjectURL(new Blob([body],{type:'text/csv;charset=utf-8'}));var link=document.createElement('a');link.href=url;link.download='afrotools-currency-conversion.csv';document.body.appendChild(link);link.click();link.remove();URL.revokeObjectURL(url);byId('fxActionStatus').textContent='CSV downloaded locally.'}
  function init(){byId('fxForm').addEventListener('submit',calculate);document.querySelectorAll('input[name="rateMode"]').forEach(function(input){input.addEventListener('change',function(){invalidateResult();updateControls()})});['fxFrom','fxTo'].forEach(function(id){byId(id).addEventListener('change',function(){invalidateResult();updateManualLabel()})});['fxAmount','fxManualRate'].forEach(function(id){byId(id).addEventListener('input',invalidateResult)});byId('fxSwap').addEventListener('click',function(){var from=byId('fxFrom').value;byId('fxFrom').value=byId('fxTo').value;byId('fxTo').value=from;invalidateResult();updateManualLabel()});byId('fxCopy').addEventListener('click',copy);byId('fxCsv').addEventListener('click',csv);fillSelects({NGN:1,KES:1,GHS:1,ZAR:1,EUR:1,GBP:1});updateControls();load()}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
