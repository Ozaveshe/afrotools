(function(){"use strict";var root=document.querySelector("[data-sw-agriculture-app]"),cfg=window.__SW_AGRI_CONFIG__;if(!root||!cfg)return;var form=root.querySelector("[data-agri-form]"),area=form.elements.scenario,status=root.querySelector("[data-status]"),box=root.querySelector("[data-result]"),output=root.querySelector("[data-output]"),latest=null;
function A(){return window.AfroTools||{};}function data(name){return A()[name];}
function run(input){var a=A(),id=cfg.id;
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
 if(id==="export-docs"){var regions=data("regionLabels"),order=Object.keys(regions),dir=a.ExportDocsDirectoryEngine.buildDirectory(data("countryIndex"),regions,order);return a.ExportDocsDirectoryEngine.search(dir,input.query);}
 if(id==="tractor-calculator")return a.TractorCalculatorEngine.calculate(input,window.EQUIPMENT_DATA);
 if(id==="crop-insurance")return a.CropInsuranceHubEngine.calculate(input);throw new Error("Injini haijasajiliwa.");}
function validate(result){if(!result||result.ok===false||result.error===true||result.error)return false;return true;}function report(){return{schemaVersion:1,tool:cfg.id,locale:"sw",generatedAt:new Date().toISOString(),source:cfg.source,input:JSON.parse(area.value),result:latest,privacy:"local-only"};}
function render(result){latest=result;output.textContent=JSON.stringify(result,null,2);box.hidden=false;status.textContent="Matokeo yametengenezwa ndani ya kivinjari; hakuna ingizo lililotumwa.";box.focus();}
form.addEventListener("submit",function(e){e.preventDefault();latest=null;box.hidden=true;output.textContent="";try{var input=JSON.parse(area.value),result=run(input);if(!validate(result))throw new Error("Injini imekataa ingizo. Kagua thamani na vitambulisho vya chaguo.");render(result);}catch(error){status.textContent=error.message||"Kagua JSON kisha ujaribu tena.";status.focus();}});
form.addEventListener("reset",function(){setTimeout(function(){latest=null;box.hidden=true;output.textContent="";status.textContent="Fomu imewekwa upya; hakuna matokeo ya zamani yanayoonyeshwa.";},0);});
function save(blob,ext){var a=document.createElement("a"),url=URL.createObjectURL(blob);a.href=url;a.download="afrotools-"+cfg.id+"."+ext;document.body.appendChild(a);a.click();a.remove();setTimeout(function(){URL.revokeObjectURL(url);},5000);}
function text(){return cfg.name+"\n\n"+JSON.stringify(latest,null,2)+"\n\nChanzo: "+cfg.source+"\nMakadirio ya kupanga; thibitisha taarifa zinazobadilika.";}
root.addEventListener("click",function(e){var b=e.target.closest("[data-export]");if(!b)return;if(!latest){status.textContent="Kokotoa matokeo kwanza.";return;}var type=b.dataset.export,payload=report();if(type==="json")save(new Blob([JSON.stringify(payload,null,2)],{type:"application/json"}),"json");else if(type==="txt")save(new Blob([text()],{type:"text/plain"}),"txt");else if(type==="csv")save(new Blob(["sehemu,thamani\r\n"+Object.keys(latest).map(function(k){return '"'+k.replace(/"/g,'""')+'","'+JSON.stringify(latest[k]).replace(/"/g,'""')+'"';}).join("\r\n")],{type:"text/csv"}),"csv");else{var P=window.jspdf&&window.jspdf.jsPDF;if(!P){status.textContent="Moduli ya PDF haikupatikana.";return;}var pdf=new P({unit:"pt",format:"a4"});pdf.text(pdf.splitTextToSize(text().normalize("NFD").replace(/[\u0300-\u036f]/g,""),500),48,58);pdf.save("afrotools-"+cfg.id+".pdf");}});
root.addEventListener("change",function(e){if(!e.target.matches("[data-import]"))return;var file=e.target.files&&e.target.files[0],reader=new FileReader();reader.onload=function(){try{var p=JSON.parse(reader.result);if(p.tool!==cfg.id||p.locale!=="sw"||!p.input||!p.result)throw new Error("Faili si export ya programu hii.");area.value=JSON.stringify(p.input,null,2);render(p.result);status.textContent="Export ya JSON imefunguliwa na kusomwa tena ndani ya kivinjari.";}catch(error){latest=null;box.hidden=true;status.textContent=error.message;}};reader.readAsText(file);});
window.__SW_AGRI_TEST__={run:run,getLatest:function(){return latest;},report:report};}());
