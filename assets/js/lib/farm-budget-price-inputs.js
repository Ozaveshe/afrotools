(function(root){'use strict';
  root.AfroTools=root.AfroTools||{};
  function mount(config){
    var fr=config.locale==='fr',country=document.getElementById(config.countryId),rows=document.getElementById(config.rowsId),data=root.AfroTools.FarmBudgetData,costs=root.AfroTools.farmCosts;
    var section=document.createElement('div'),caption=document.createElement('p');section.className='field';caption.setAttribute('role','status');section.appendChild(caption);rows.insertAdjacentElement('afterend',section);
    var names=fr?{seedPricePerKg:'Prix des semences par kg',marketPricePerTonne:'Prix de vente par tonne',fertilizerPricePerKg:'Prix des engrais par kg'}:{seedPricePerKg:'Seed price per kg',marketPricePerTonne:'Selling price per tonne',fertilizerPricePerKg:'Fertilizer price per kg'};
    function field(host,key){var wrap=document.createElement('div'),label=document.createElement('label'),text=document.createElement('span'),input=document.createElement('input');wrap.className='field';input.type='number';input.min=key==='marketPricePerTonne'?'0.000001':'0';input.step='any';input.inputMode='decimal';input.dataset.budgetPrice=key;label.append(text,input);wrap.appendChild(label);host.appendChild(wrap);return input;}
    var fertilizer=field(section,'fertilizerPricePerKg');
    function currency(){return costs[country.value]?costs[country.value].currency:'';}
    function priceField(row,key){return row.querySelector('[data-budget-price="'+key+'"]');}
    function available(table,crop){var t=table[country.value];return t&&Object.prototype.hasOwnProperty.call(t,crop)&&Number.isFinite(t[crop]);}
    function label(input,required){var text=input.parentNode.querySelector('span');text.textContent=names[input.dataset.budgetPrice]+(currency()?' ('+currency()+')':'')+(required?(fr?' — requis':' — required'):(fr?' — facultatif':' — optional'));input.setAttribute('aria-required',String(required));}
    function sync(){
      Array.from(rows.querySelectorAll('.crop-row')).forEach(function(row){var crop=row.querySelector(config.cropSelector).value,box=row.querySelector('[data-budget-quote-row]');if(!box){box=document.createElement('div');box.dataset.budgetQuoteRow='';box.style.gridColumn='1 / -1';box.className='grid';row.appendChild(box);field(box,'seedPricePerKg');field(box,'marketPricePerTonne');}
        var seed=priceField(row,'seedPricePerKg'),market=priceField(row,'marketPricePerTonne'),planting=!!data.plantingMaterialCostPerHa[crop];seed.parentNode.parentNode.hidden=planting;seed.disabled=planting;if(planting)seed.value='';label(seed,!planting&&!available(data.seedPricePerKg,crop));label(market,!available(data.marketPricePerTonne,crop));
      });
      label(fertilizer,!Object.prototype.hasOwnProperty.call(data.fertilizerPricePerKg,country.value));
      caption.textContent=fr?'Saisissez vos prix locaux dans la devise affichée. Les champs requis remplacent les références manquantes. Un champ facultatif vide utilise une hypothèse statique du pays, à vérifier. Aucun taux de change n’est appliqué. Les prix saisis sont vos hypothèses, pas des données vérifiées.':'Enter local prices in the displayed currency. Required fields replace missing references. A blank optional field uses a static country assumption that needs checking. No currency conversion is applied. Entered prices are your assumptions, not verified market data.';
    }
    function number(input){return input.value.trim()===''?undefined:Number(input.value);}
    country.addEventListener('change',function(){rows.querySelectorAll('[data-budget-price]').forEach(function(i){i.value='';});fertilizer.value='';var rent=document.getElementById(config.rentId);if(rent)rent.value='';sync();});
    rows.addEventListener('change',function(e){if(e.target.matches(config.cropSelector)){e.target.closest('.crop-row').querySelectorAll('[data-budget-price]').forEach(function(i){i.value='';});sync();}});
    var form=rows.closest('form');if(form)form.addEventListener('reset',function(){setTimeout(sync,0);});
    new MutationObserver(sync).observe(rows,{childList:true});sync();
    return {sync:sync,enrich:function(input){sync();var list=rows.querySelectorAll('.crop-row');input.crops=input.crops.map(function(c,index){var row=list[index];['seedPricePerKg','marketPricePerTonne'].forEach(function(k){var field=priceField(row,k),n=field.disabled?undefined:number(field);if(n!==undefined)c[k]=n;});return c;});var value=number(fertilizer);if(value!==undefined)input.fertilizerPricePerKg=value;input.priceCurrency=currency();return input;},message:function(result){if(result.status==='needs-local-prices'){var parts=result.missingPrices.map(function(m){return (m.cropIndex===undefined?'':(fr?'Culture ':'Crop ')+(m.cropIndex+1)+': ')+names[m.field];});var first=result.missingPrices[0],field=first.cropIndex===undefined?fertilizer:priceField(rows.querySelectorAll('.crop-row')[first.cropIndex],first.field);field.focus();return (fr?'Prix locaux requis en ':'Local prices required in ')+result.currency+': '+parts.join('; ')+'.';}return fr?'Vérifiez chaque surface et les valeurs numériques. Le prix de vente doit être supérieur à zéro; les coûts peuvent être nuls. Pour un prêt, indiquez un taux annuel positif ou nul et une durée positive.':'Check every crop area and numeric value. Selling prices must be positive; costs may be zero. For a loan, enter a non-negative annual rate and a positive term.';}};
  }
  root.AfroTools.FarmBudgetPriceInputs={mount:mount};
})(window);
