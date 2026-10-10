(function(){"use strict";var root=document.querySelector("[data-sw-agriculture-app]"),cfg=window.__SW_AGRI_CONFIG__;if(!root||!cfg)return;var form=root.querySelector("[data-agri-form]"),area=form.elements.scenario,status=root.querySelector("[data-status]"),box=root.querySelector("[data-result]"),output=root.querySelector("[data-output]"),latest=null,latestInputText=null,stateRevision=0;
var inputUi=cfg.id==="agric-profit"&&window.AgroProfitForm?window.AgroProfitForm.create(root,cfg):cfg.id==="soil-ph-calculator"&&window.AgroSoilPhForm?window.AgroSoilPhForm.create(root,cfg):cfg.id==="farm-budget"&&window.AgroFarmBudgetForm?window.AgroFarmBudgetForm.create(root,cfg):cfg.id==="tractor-calculator"&&window.AgroTractorForm?window.AgroTractorForm.create(root,cfg):cfg.id==="crop-rotation-planner"&&window.AgroCropRotationForm?window.AgroCropRotationForm.create(root,cfg):cfg.id==="storage-loss"&&window.AgroStorageLossForm?window.AgroStorageLossForm.create(root,cfg):cfg.id==="export-docs"&&window.AgroExportDocsForm?window.AgroExportDocsForm.create(root,cfg):cfg.id==="crop-yield"&&window.AgroCropYieldForm?window.AgroCropYieldForm.create(root,cfg):cfg.id==="fertilizer-calc"&&window.AgroFertilizerForm?window.AgroFertilizerForm.create(root,cfg):cfg.id==="planting-calendar"&&window.AgroPlantingCalendarForm?window.AgroPlantingCalendarForm.create(root,cfg):cfg.id==="harvest-date-estimator"&&window.AgroHarvestDateForm?window.AgroHarvestDateForm.create(root,cfg):cfg.id==="farm-size-converter"&&window.AgroFarmSizeForm?window.AgroFarmSizeForm.create(root,cfg):window.AgroCropInsuranceForm?window.AgroCropInsuranceForm.create(root,cfg):null;
function syncInput(){if(inputUi)area.value=JSON.stringify(inputUi.read(),null,2);}
function A(){return window.AfroTools||{};}function data(name){return A()[name];}
function finiteTree(value){if(typeof value==="number")return Number.isFinite(value);if(value&&typeof value==="object")return Object.keys(value).every(function(key){return finiteTree(value[key]);});return true;}
function numericShape(value,sample){if(typeof sample==="number")return typeof value==="number"&&Number.isFinite(value);if(Array.isArray(sample))return Array.isArray(value)&&(!sample.length||value.every(function(item){return numericShape(item,sample[0]);}));if(sample&&typeof sample==="object")return value&&typeof value==="object"&&!Array.isArray(value)&&Object.keys(sample).every(function(key){return !Object.prototype.hasOwnProperty.call(value,key)||numericShape(value[key],sample[key]);});return true;}
function validInput(input){return input&&typeof input==="object"&&!Array.isArray(input)&&finiteTree(input)&&numericShape(input,cfg.input);}
function run(input){if(inputUi&&!inputUi.validate(input))throw new Error("Kagua thamani na chaguo za fomu.");if(!validInput(input))throw new Error("Kagua ingizo: sehemu za nambari zinahitaji nambari halali zenye thamani yenye kikomo.");var a=A(),id=cfg.id;
 if(id==="planting-calendar")return a.PlantingCalendarEngine.calculate(input,data("PlantingCalendarData"));
 if(id==="fertilizer-calc")return a.FertilizerCalcEngine.calculate(input,data("FertilizerCalcData"));
 if(id==="farm-budget")return a.FarmBudgetEngine.calculate(input,{data:data("FarmBudgetData"),farmCosts:data("farmCosts")});
 if(id==="poultry-roi-calculator")return a.PoultryROIEngine.calculate(input,data("PoultryCosts")[input.countryCode],data("PoultryProduction"));
 if(id==="pesticide-dosage-calculator")return a.PesticideDosageEngine.calculate(input,window.PesticideData);
 if(id==="soil-ph-calculator")return a.SoilPhEngine.calculate(input,data("SoilPhData"));
 if(id==="farm-size-converter")return a.FarmSizeEngine.calculate(input,data("FarmSizeData"));
 if(id==="harvest-date-estimator")return a.HarvestDateEngine.calculate(input);
 if(id==="coffee-calculator")return a.CoffeeEngine.calcYield(input);
 if(id==="cocoa-tracker")return a.CocoaEngine.calculate(input);
 if(id==="storage-loss")return a.StorageLossEngine.calculate(input,window.STORAGE_DATA||window.StorageData);
 if(id==="crop-rotation-planner")return a.CropRotationEngine.calculate(input);
 if(id==="commodity-prices")return a.CommodityPriceEngine.calculate(input,window.COMMODITY_PRICES);
 if(id==="cooperative-calculator")return a.CooperativeEngine.calculate(input);
 if(id==="warehouse-receipt")return a.WarehouseReceiptEngine.calculate(input,window.WAREHOUSE_RECEIPT_DATA);
 if(id==="agric-profit")return a.AgricProfitEngine.calculate(input,window.AGRIC_PROFIT_DATA);
 if(id==="crop-yield")return a.CropYieldToolEngine.calculate(input,window.CROP_YIELD_TOOL_DATA);
 if(id==="export-docs"){var regions=data("regionLabels"),order=Object.keys(regions),dir=a.ExportDocsDirectoryEngine.buildDirectory(data("countryIndex"),regions,order);return inputUi&&inputUi.search?inputUi.search(dir,input.query):a.ExportDocsDirectoryEngine.search(dir,input.query);}
 if(id==="tractor-calculator")return a.TractorCalculatorEngine.calculate(input,window.EQUIPMENT_DATA);
 if(id==="crop-insurance")return a.CropInsuranceHubEngine.calculate(input);throw new Error("Injini haijasajiliwa.");}
function validate(result){if(!finiteTree(result)||!result||result.ok===false||result.error===true||result.error)return false;return true;}function invalidate(){stateRevision++;latest=null;latestInputText=null;box.hidden=true;output.textContent="";}function current(){if(!latest)return false;try{syncInput();}catch(error){invalidate();status.textContent=error.message;return false;}if(area.value!==latestInputText){invalidate();status.textContent="Ingizo limebadilika. Kokotoa tena kabla ya kuhamisha matokeo.";return false;}return true;}function report(){if(!current())throw new Error("Kokotoa matokeo ya ingizo la sasa kwanza.");return{schemaVersion:1,tool:cfg.id,locale:"sw",generatedAt:new Date().toISOString(),source:cfg.source,input:JSON.parse(latestInputText),result:latest,privacy:"local-only"};}
function render(result){if(inputUi){inputUi.render(result);if(["farm-budget","soil-ph-calculator","agric-profit"].includes(cfg.id))syncInput();}latest=result;latestInputText=area.value;output.textContent=JSON.stringify(result,null,2);box.hidden=false;status.textContent="Matokeo yametengenezwa ndani ya kivinjari; hakuna ingizo lililotumwa.";box.focus();}
form.addEventListener("submit",function(e){e.preventDefault();invalidate();try{syncInput();var input=JSON.parse(area.value),result=run(input);if(!validate(result))throw new Error("Injini imekataa ingizo. Kagua thamani na vitambulisho vya chaguo.");render(result);}catch(error){status.textContent=error.message||"Kagua JSON kisha ujaribu tena.";status.focus();}});
form.addEventListener("input",function(){invalidate();status.textContent="Ingizo limebadilika. Kokotoa tena kabla ya kuhamisha matokeo.";});
form.addEventListener("change",function(e){if(e.target===area){invalidate();status.textContent="Ingizo limebadilika. Kokotoa tena kabla ya kuhamisha matokeo.";}});
form.addEventListener("reset",function(){invalidate();status.textContent="Fomu imewekwa upya; hakuna matokeo ya zamani yanayoonyeshwa.";});
function save(blob,ext){var a=document.createElement("a"),url=URL.createObjectURL(blob);a.href=url;a.download="afrotools-"+cfg.id+"."+ext;document.body.appendChild(a);a.click();a.remove();setTimeout(function(){URL.revokeObjectURL(url);},5000);}
function text(){if(inputUi)return cfg.name+"\n\n"+inputUi.text(latest)+"\n\nChanzo: "+cfg.source;return cfg.name+"\n\n"+JSON.stringify(latest,null,2)+"\n\nChanzo: "+cfg.source+"\nMakadirio ya kupanga; thibitisha taarifa zinazobadilika.";}
root.addEventListener("click",function(e){var b=e.target.closest("[data-export]");if(!b)return;if(!current()){if(!status.textContent.includes("Ingizo limebadilika"))status.textContent="Kokotoa matokeo kwanza.";return;}var type=b.dataset.export,payload=report();if(type==="json")save(new Blob([JSON.stringify(payload,null,2)],{type:"application/json"}),"json");else if(type==="txt")save(new Blob([text()],{type:"text/plain"}),"txt");else if(type==="csv")save(new Blob(["sehemu,thamani\r\n"+Object.keys(latest).map(function(k){return '"'+k.replace(/"/g,'""')+'","'+JSON.stringify(latest[k]).replace(/"/g,'""')+'"';}).join("\r\n")],{type:"text/csv"}),"csv");else if(type==="pdf")return exportPdf(b);});
root.addEventListener("change",function(e){
 if(!e.target.matches("[data-import]"))return;
 var file=e.target.files&&e.target.files[0];if(!file)return;
 invalidate();var revision=stateRevision,startInput=area.value,reader=new FileReader();e.target.value="";
 function active(){return revision===stateRevision&&area.value===startInput;}
 function fail(message){if(!active())return;invalidate();status.textContent=message;}
 if(file.size>1048576){status.textContent="Faili ni kubwa mno. Chagua JSON isiyozidi MB 1.";return;}
 status.textContent="Faili inasomwa ndani ya kivinjari.";
 reader.onload=function(){if(!active())return;try{
  var p=JSON.parse(reader.result);
  if(!p||p.schemaVersion!==1||p.tool!==cfg.id||p.locale!=="sw"||!p.input||typeof p.input!=="object"||Array.isArray(p.input))throw new Error("Faili si export inayotumika ya programu hii.");
  var input=JSON.parse(JSON.stringify(p.input)),result=run(input);
  if(!validate(result))throw new Error("Injini imekataa ingizo la faili. Kagua thamani.");
  area.value=JSON.stringify(p.input,null,2);render(result);
  status.textContent="Export ya JSON imefunguliwa; matokeo yamekokotolewa upya ndani ya kivinjari.";
 }catch(error){fail("Faili haikuweza kutumika. Kagua JSON, programu, lugha na ingizo lake.");}};
 reader.onerror=function(){fail("Faili haikusomeka. Chagua faili tena.");};
 reader.onabort=function(){fail("Usomaji wa faili umeghairiwa.");};
 try{reader.readAsText(file);}catch(error){fail("Faili haikusomeka. Chagua faili tena.");}
});
var pdfModulePromise;
function loadPdfModule(){
 if(window.AgroReportPdf)return Promise.resolve(window.AgroReportPdf);
 if(!pdfModulePromise)pdfModulePromise=new Promise(function(resolve,reject){var script=document.createElement("script");script.src="/assets/js/lib/agriculture-report-pdf.js";script.onload=function(){if(window.AgroReportPdf)resolve(window.AgroReportPdf);else reject(new Error("PDF module unavailable"));};script.onerror=function(){script.remove();reject(new Error("PDF module unavailable"));};document.head.appendChild(script);}).catch(function(error){pdfModulePromise=null;throw error;});
 return pdfModulePromise;
}
async function exportPdf(button){
 if(button.disabled||!current())return;
 var revision=stateRevision,inputText=latestInputText,content=text();button.disabled=true;
 status.textContent="PDF inaandaliwa ndani ya kivinjari.";
 try{var module=await loadPdfModule(),pdf=await module.buildPdf(content);
  if(revision!==stateRevision)return;
  if(inputUi){try{syncInput();}catch(error){invalidate();status.textContent=error.message;return;}}if(area.value!==inputText){current();return;}
  pdf.save("afrotools-"+cfg.id+".pdf");status.textContent="PDF imeandaliwa kwa kupakuliwa.";
 }catch(error){if(revision===stateRevision)status.textContent=error&&error.code==="AGRI_PDF_UNSUPPORTED_CHARACTER"?"Fonti ya PDF haiauni baadhi ya alama. Tumia TXT au JSON kuhifadhi maandishi yote.":"PDF haikuweza kutengenezwa. Jaribu tena au tumia TXT au JSON.";}
 finally{button.disabled=false;}
}
window.__SW_AGRI_TEST__={run:run,getLatest:function(){return latest;},report:report};}());
