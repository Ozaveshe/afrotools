(function (root, factory) {
  'use strict';
  var api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else api.install(root);
}(typeof window==='object'?window:this,function(){
  'use strict';
  var crops={maize:'Mahindi',cassava:'Muhogo',rice:'Mpunga',yam:'Viazi vikuu',sorghum:'Mtama',soya:'Soya',groundnut:'Karanga',cocoa:'Kakao',custom:'Zao jingine'};
  var units={ha:'Hektari',acres:'Ekari',plots:'Viwanja (kiwanja 1 = ekari 0.5)'};
  function validate(input,data){
    if(!input||typeof input!=='object'||Array.isArray(input))throw new Error('Kagua taarifa za shamba.');
    if(!Object.hasOwn(data.crops,input.crop)||!Object.hasOwn(units,input.sizeUnit)||!Object.hasOwn(data.symbols,input.currency))throw new Error('Chagua zao, kipimo na sarafu kwenye orodha.');
    var clean={crop:input.crop,sizeUnit:input.sizeUnit,currency:input.currency};
    for(var key of ['farmSize','yieldPerHa','marketPrice','inputCosts']){
      var raw=input[key];
      if((typeof raw!=='number'&&typeof raw!=='string')||String(raw).trim()===''||!Number.isFinite(Number(raw)))throw new Error('Jaza sehemu zote kwa namba halali.');
      clean[key]=Number(raw);
      if(clean[key]<0||(key!=='inputCosts'&&clean[key]===0))throw new Error('Eneo, mavuno na bei viwe zaidi ya sifuri. Gharama zinaweza kuwa sifuri, lakini si hasi.');
    }
    return clean;
  }
  function number(value){return new Intl.NumberFormat('sw-KE',{maximumFractionDigits:3}).format(value);}
  function lines(input,result){return [
    ['Zao',crops[input.crop]],['Eneo (hektari)',number(result.sizeHa)],
    ['Mavuno yote (tani)',number(result.totalYield)],
    ['Mapato yote',input.currency+' '+number(result.grossRevenue)],
    ['Jumla ya gharama',input.currency+' '+number(input.inputCosts)],
    ['Faida / hasara',input.currency+' '+number(result.netProfit)],
    ['Faida kwa gharama (ROI)',result.roi===null?'Haijahesabiwa: gharama ni sifuri':number(result.roi)+'%']
  ];}
  function text(input,result){return ['Mavuno ya mazao',...lines(input,result).map(function(row){return row[0]+': '+row[1];}),
    'Dhana: mavuno kwa hektari '+number(input.yieldPerHa)+' tani; bei kwa tani '+input.currency+' '+number(input.marketPrice)+'.',
    'Gharama ni jumla ya shamba lote. Kubadilisha eneo hakubadilishi jumla ya gharama uliyoingiza.',
    'Makadirio ya kupanga kutoka taarifa zako; si bei ya sasa au ahadi ya mavuno. Hakuna taarifa iliyotumwa.',
    'Chanzo: data/agriculture/crop-yield-tool-data.json'].join('\n');}
  function install(win){
    var doc=win.document,host=doc.querySelector('[data-crop-yield-form]'),cfg=win.__SW_AGRI_CONFIG__,data=win.CROP_YIELD_TOOL_DATA,engine=win.AfroTools&&win.AfroTools.CropYieldToolEngine;
    if(!host||!cfg||cfg.id!=='crop-yield'||!data||!engine)return;
    var form=host.querySelector('form'),status=host.querySelector('[data-status]'),box=host.querySelector('[data-result]'),output=host.querySelector('[data-output]'),latest=null,revision=0;
    var keys=['crop','sizeUnit','currency','farmSize','yieldPerHa','marketPrice','inputCosts'];
    function field(key){return form.elements.namedItem(key);}
    function selectOptions(key,choices,label){var select=field(key);select.replaceChildren();Object.keys(choices).forEach(function(value){var option=doc.createElement('option');option.value=value;option.textContent=label(value);select.appendChild(option);});}
    selectOptions('crop',data.crops,function(key){return crops[key]||key;});
    selectOptions('sizeUnit',units,function(key){return units[key];});
    selectOptions('currency',data.symbols,function(key){return key;});
    function put(input){keys.forEach(function(key){field(key).value=input[key];});}
    function get(){var input={};keys.forEach(function(key){if(field(key).validity.badInput)throw new Error('Kagua namba ulizoingiza.');input[key]=field(key).value;});return validate(input,data);}
    function clear(message){revision++;latest=null;box.hidden=true;output.replaceChildren();status.textContent=message;}
    function calculate(input){var clean=validate(input,data),result=engine.calculate(clean,data);if(!result||!result.ok||![result.sizeHa,result.totalYield,result.grossRevenue,result.netProfit].every(Number.isFinite)||(result.roi!==null&&!Number.isFinite(result.roi)))throw new Error('Hesabu haijakamilika. Kagua au punguza thamani zako.');return{input:clean,result:result};}
    function show(calculation){latest=calculation;var dl=doc.createElement('dl');lines(latest.input,latest.result).forEach(function(row){var dt=doc.createElement('dt'),dd=doc.createElement('dd');dt.textContent=row[0];dd.textContent=row[1];dl.append(dt,dd);});output.replaceChildren(dl);box.hidden=false;status.textContent='Hesabu imekamilika ndani ya kifaa chako. Makadirio si ahadi ya mavuno.';box.focus();}
    put(validate(cfg.input,data));
    form.addEventListener('input',function(){clear('Taarifa zimebadilika. Kokotoa tena kabla ya kupakua.');});
    form.addEventListener('change',function(){clear('Taarifa zimebadilika. Kokotoa tena kabla ya kupakua.');});
    form.addEventListener('submit',function(event){event.preventDefault();clear('');try{show(calculate(get()));}catch(error){status.textContent=error.message;}});
    form.addEventListener('reset',function(){clear('Fomu imewekwa upya; kokotoa matokeo mapya.');win.setTimeout(function(){put(validate(cfg.input,data));},0);});
    function report(){return latest?{schemaVersion:1,tool:cfg.id,locale:'sw',generatedAt:new Date().toISOString(),source:cfg.source,input:latest.input,result:latest.result,privacy:'local-only'}:null;}
    function save(body,mime,extension){var url=win.URL.createObjectURL(new win.Blob([body],{type:mime})),link=doc.createElement('a');link.href=url;link.download='afrotools-crop-yield.'+extension;doc.body.appendChild(link);link.click();link.remove();win.setTimeout(function(){win.URL.revokeObjectURL(url);},5000);}
    host.addEventListener('click',function(event){var button=event.target.closest('[data-export]');if(!button)return;if(!latest){status.textContent='Kokotoa matokeo kwanza.';return;}var payload=report(),type=button.dataset.export;
      if(type==='json')save(JSON.stringify(payload,null,2),'application/json','json');
      else if(type==='txt')save(text(payload.input,payload.result),'text/plain','txt');
      else if(type==='csv')save('\uFEFF'+[['sehemu','thamani']].concat(lines(payload.input,payload.result)).map(function(row){return row.map(function(value){return '"'+String(value).replace(/"/g,'""')+'"';}).join(',');}).join('\r\n'),'text/csv','csv');
      else if(type==='pdf'){var P=win.jspdf&&win.jspdf.jsPDF;if(!P){status.textContent='Moduli ya PDF haikupatikana.';return;}var pdf=new P({unit:'pt',format:'a4'});pdf.text(pdf.splitTextToSize(text(payload.input,payload.result),490),48,48);pdf.save('afrotools-crop-yield.pdf');}
    });
    host.querySelector('[data-import]').addEventListener('change',async function(event){var file=event.target.files&&event.target.files[0];if(!file)return;clear('Ripoti inasomwa…');var token=revision;try{if(file.size>1048576)throw new Error('Chagua ripoti isiyozidi MB 1.');var payload;try{payload=JSON.parse(await file.text());}catch(error){throw new Error('Ripoti ya JSON haisomeki. Chagua faili sahihi.');}if(token!==revision)return;if(payload.schemaVersion!==1||payload.tool!=='crop-yield'||payload.locale!=='sw'||!payload.input)throw new Error('Faili si ripoti ya Mavuno ya mazao ya Kiswahili.');var calculation=calculate(payload.input);put(calculation.input);show(calculation);status.textContent='Ripoti imefunguliwa; matokeo yamekokotolewa upya kutoka taarifa zake.';}catch(error){if(token===revision)clear(error.message);}finally{event.target.value='';}});
    win.__SW_AGRI_TEST__={run:function(input){return calculate(input).result;},getLatest:function(){return latest&&latest.result;},report:report};
  }
  return{validate:validate,lines:lines,text:text,install:install};
}));
