(function fertilizerCalcController(root) {
  'use strict';
  var engine = root.AfroTools && root.AfroTools.FertilizerCalcEngine;
  var data = root.AfroTools && root.AfroTools.FertilizerCalcData;
  function id(value) { return document.getElementById(value); }
  function statusNode() {
    var node = id('fertilizerStatus');
    if (!node) { node = document.createElement('p'); node.id = 'fertilizerStatus'; node.setAttribute('role','status'); node.setAttribute('aria-live','polite'); node.tabIndex = -1; id('results').before(node); }
    return node;
  }
  function invalidate(message) { root.FERTILIZER_CALC_LAST_RESULT = null; id('results').style.display = 'none'; statusNode().textContent = message || ''; }
  function quantity(value) { return Number(value).toLocaleString('en', {maximumFractionDigits:2}); }
  function renderProductPlans(result) {
    var host = id('costCards'); host.replaceChildren();
    function el(tag,text) { var node=document.createElement(tag); node.textContent=text; return node; }
    var names={npk15:'NPK 15-15-15',urea:'Urea 46-0-0',dap:'DAP 18-46-0',mop:'MOP 0-0-60'};
    Object.keys(result.productPlans).forEach(function(key){
      var plan=result.productPlans[key],section=el('section','');section.className='result-card';section.dataset.productPlan=plan.id;
      section.appendChild(el('h3',key==='compound'?'Option A: NPK plus urea':'Option B: DAP, MOP and urea'));
      section.appendChild(el('p','Alternative calculation only. Do not combine the two options. Product grades use N, P2O5 and K2O.'));
      plan.products.forEach(function(product){
        section.appendChild(el('h4',names[product.id]));
        section.appendChild(el('p','Calculated quantity: '+quantity(product.applicationKg)+' kg. Buy '+product.purchaseBags+' bags of 50 kg; unused remainder: '+quantity(product.remainingKg)+' kg.'));
        section.appendChild(el('p','Bag cost: '+(product.purchaseCost===null?'Unavailable':result.input.currency+' '+quantity(product.purchaseCost))));
      });
      section.appendChild(el('p','Calculated nutrient supply (kg): N '+quantity(plan.applicationSupply.n)+'; P2O5 '+quantity(plan.applicationSupply.p)+'; K2O '+quantity(plan.applicationSupply.k)+'.'));
      section.appendChild(el('p','Above the scenario target (kg): N '+quantity(plan.excess.n)+'; P2O5 '+quantity(plan.excess.p)+'; K2O '+quantity(plan.excess.k)+'. A product with a different nutrient ratio may be needed.'));
      section.appendChild(el('p','Purchase total: '+(plan.purchaseCost===null?'Unavailable — one or more product prices are missing.':result.input.currency+' '+quantity(plan.purchaseCost))));
      if(plan.priceProvenance)section.appendChild(el('p','User-entered price source: '+plan.priceProvenance.source+'; date: '+plan.priceProvenance.observedOn+'. Not independently verified.'));
      else section.appendChild(el('p','Undated example prices; these are not current supplier quotes.'));
      host.appendChild(section);
    });
    id('costNote').textContent='The calculated quantities are mathematical scenarios, not field application advice. Whole bags are purchase quantities; do not apply the unused remainder automatically. Crop targets and soil assumptions require local soil-test and agronomic review. Check actual product grades and supplier prices.';
  }
  var quoteFields = {}, quoteEnabled;
  function installQuoteFields() {
    var fieldset=document.createElement('fieldset'),legend=document.createElement('legend');legend.textContent='Optional supplier prices';fieldset.appendChild(legend);
    var toggleLabel=document.createElement('label');quoteEnabled=document.createElement('input');quoteEnabled.type='checkbox';quoteEnabled.id='useSupplierQuote';toggleLabel.htmlFor=quoteEnabled.id;toggleLabel.append(quoteEnabled,document.createTextNode(' Use my supplier quote instead of undated example prices'));fieldset.appendChild(toggleLabel);
    var hint=document.createElement('p');hint.id='quoteCurrencyNote';fieldset.appendChild(hint);
    var grid=document.createElement('div');grid.className='form-grid';fieldset.appendChild(grid);
    [['urea','Urea price per 50 kg bag','number'],['npk15','NPK 15-15-15 price per 50 kg bag','number'],['dap','DAP price per 50 kg bag','number'],['mop','MOP price per 50 kg bag','number'],['source','Supplier or price source','text'],['observedOn','Quote date','date']].forEach(function(spec){
      var wrapper=document.createElement('div');wrapper.className='form-group';var label=document.createElement('label');label.textContent=spec[1];var input=document.createElement('input');input.id='quote-'+spec[0];input.type=spec[2];label.htmlFor=input.id;input.disabled=true;input.setAttribute('aria-describedby',hint.id);if(spec[2]==='number'){input.min='0';input.step='any';input.inputMode='decimal';}if(spec[0]==='source')input.maxLength=300;quoteFields[spec[0]]=input;wrapper.append(label,input);grid.appendChild(wrapper);
      input.addEventListener('input',function(){invalidate('Quote changed. Calculate again.');});
    });
    function describe(){hint.textContent='Enter prices in '+id('currency').value+'. Leave unavailable product prices blank; totals needing those prices stay unavailable. A source and date are required when using your quote. Prices stay in this browser and are not independently verified.';}
    quoteEnabled.addEventListener('change',function(){Object.keys(quoteFields).forEach(function(key){quoteFields[key].disabled=!quoteEnabled.checked;});invalidate('Price mode changed. Calculate again.');});
    id('currency').addEventListener('change',function(){Object.keys(quoteFields).forEach(function(key){quoteFields[key].value='';});describe();invalidate('Currency changed. Enter a quote in the new currency or switch off supplier prices.');});
    var button=id('area').closest('.card').querySelector('button[onclick="calculate()"]');button.parentElement.before(fieldset);describe();
  }
  function enteredQuote() {
    var prices={};['urea','npk15','dap','mop'].forEach(function(key){var input=quoteFields[key];if(input.value.trim())prices[key]=Number(input.value);});
    return {currency:id('currency').value,prices:prices,source:quoteFields.source.value,observedOn:quoteFields.observedOn.value};
  }
  function calculate() {
    invalidate();
    var input = {
      cropId: id('crop').value,
      area: id('area').value,
      soil: id('soil').value,
      target: id('yieldTarget').value,
      currency: id('currency').value
    };
    if(quoteEnabled.checked)input.priceQuote=enteredQuote();
    var result=engine.calculate(input,data);
    if (!result.ok) { statusNode().textContent = result.status==='invalid-price-quote'?'Enter at least one nonnegative bag price, a source and a valid quote date.':'Check the crop, soil, yield target, currency and a positive finite field size.'; statusNode().focus(); return result; }
    var p = result.perHectare;
    var t = result.totals;
    var b = result.bags;
    var c = result.cost;
    id('summaryCards').innerHTML =
      '<div class="result-card highlight"><div class="result-label">Nitrogen (N)</div><div class="result-value">' + t.n + '<span class="result-unit"> kg</span></div></div>' +
      '<div class="result-card highlight"><div class="result-label">Phosphorus (P2O5)</div><div class="result-value">' + t.p + '<span class="result-unit"> kg</span></div></div>' +
      '<div class="result-card highlight"><div class="result-label">Potassium (K2O)</div><div class="result-value">' + t.k + '<span class="result-unit"> kg</span></div></div>' +
      '<div class="result-card"><div class="result-label">Per Hectare</div><div class="result-value">' + p.n + ':' + p.p + ':' + p.k + '<span class="result-unit"> N:P:K kg/ha</span></div></div>';
    id('npkVisual').innerHTML =
      '<div class="npk-bar"><div class="npk-n" style="width:' + (p.n / (p.n + p.p + p.k) * 100).toFixed(1) + '%"></div><div class="npk-p" style="width:' + (p.p / (p.n + p.p + p.k) * 100).toFixed(1) + '%"></div><div class="npk-k" style="width:' + (p.k / (p.n + p.p + p.k) * 100).toFixed(1) + '%"></div></div>' +
      '<div class="npk-legend"><span class="ln">N ' + result.ratioPercent.n + '%</span><span class="lp">P ' + result.ratioPercent.p + '%</span><span class="lk">K ' + result.ratioPercent.k + '%</span></div>';
    var schedule = '<thead><tr><th>Timing</th><th>Application</th></tr></thead><tbody>';
    result.schedule.forEach(function scheduleRow(value, index) {
      schedule += '<tr><td style="font-weight:600">Stage ' + (index + 1) + '</td><td>' + value + '</td></tr>';
    });
    id('scheduleTable').innerHTML = schedule + '</tbody>';
    renderProductPlans(result);
    var cattle = result.organicEquivalent.cattleTonnes;
    var poultry = result.organicEquivalent.poultryTonnes;
    id('organicEquiv').innerHTML = '<strong>&#x1F33F; Organic Equivalent:</strong> To supply equivalent NPK using well-decomposed <strong>cattle manure</strong> (~0.5% N, 0.25% P, 0.5% K), apply approximately <strong>' + cattle + '&#x2013;' + (cattle + 2) + ' tonnes for the selected area</strong>. Using <strong>poultry manure</strong> (~3% N, 2% P, 1.5% K): roughly <strong>' + poultry + '&#x2013;' + (poultry + 1) + ' tonnes for the selected area</strong>. Compost: 8&#x2013;12 t/ha depending on quality. Best practice: combine 50% organic + 50% inorganic on depleted soils for improved soil structure and cost savings.';
    if (result.microTip) {
      id('microTips').innerHTML = '<strong>&#x1F52C; Micronutrient Tips:</strong> ' + result.microTip;
      id('microTips').style.display = 'block';
    } else id('microTips').style.display = 'none';
    id('yieldCards').innerHTML =
      '<div class="result-card highlight"><div class="result-label">Estimated Total Yield</div><div class="result-value">' + result.yieldEstimate.toFixed(1) + '<span class="result-unit"> ' + result.crop.unit.replace('/ha', '') + '</span></div></div>' +
      '<div class="result-card"><div class="result-label">Yield Target</div><div class="result-value">' + result.input.target.charAt(0).toUpperCase() + result.input.target.slice(1) + '</div></div>' +
      '<div class="result-card"><div class="result-label">Total Area</div><div class="result-value">' + result.input.area + '<span class="result-unit"> hectares</span></div></div>';
    id('results').style.display = 'block';
    id('results').scrollIntoView({ behavior: 'smooth' });
    root.FERTILIZER_CALC_LAST_RESULT = result;
    statusNode().textContent = 'Calculation complete. Review both alternative product plans and their limitations.';
    return result;
  }
  ['crop','area','soil','yieldTarget','currency'].forEach(function(key){ id(key).addEventListener('input',function(){invalidate('Inputs changed. Calculate again.');}); id(key).addEventListener('change',function(){invalidate('Inputs changed. Calculate again.');}); });
  installQuoteFields();
  root.calculate = calculate;
  root.AfroTools.FertilizerCalcController = { calculate: calculate };
})(typeof window !== 'undefined' ? window : globalThis);
