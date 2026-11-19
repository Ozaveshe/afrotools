(() => {
  "use strict";
  const host = document.querySelector('[data-tool="poultry-roi-calculator"]');
  if (!host) return;
  const config = window.__SW_AGRI_CONFIG__;
  const {PoultryCosts: markets, PoultryProduction: model, PoultryROIEngine: engine} = window.AfroTools || {};
  if (!markets || !model || !engine) return;
  const form = host.querySelector("form"), fields = form.elements;
  const box = host.querySelector("[data-result]"), output = box.querySelector("[data-output]"), status = host.querySelector("[data-status]");
  const names = {broilers:"Kuku wa nyama",layers:"Kuku wa mayai",indigenous:"Kuku wa kienyeji",compare:"Ulinganisho wa aina tatu"};
  const initial = {...config.input, housingType:"simple"};
  const maxCycles = Math.floor(52 / model.broilers.cycleWeeks);
  fields.cyclesPerYear.max = maxCycles;
  let snapshot = null, rows = [], revision = 0;

  function check(input) {
    const whole = value => Number.isSafeInteger(value) && value > 0;
    if (!input || typeof input !== "object" || Array.isArray(input)) throw Error("Faili haina ingizo la ufugaji.");
    if (!["countryCode","mode","flockSize"].every(key => Object.hasOwn(input,key))) throw Error("Faili lazima iwe na nchi, aina ya kuku na idadi ya kuku.");
    const state = {...initial,...input};
    if (!Object.hasOwn(markets,state.countryCode) || !Object.hasOwn(names,state.mode)) throw Error("Chagua nchi na aina ya kuku zinazopatikana.");
    if (!whole(state.flockSize)) throw Error("Weka idadi sahihi ya kuku isiyopungua 1.");
    if (!whole(state.cyclesPerYear) || state.cyclesPerYear > maxCycles) throw Error("Weka mizunguko kati ya 1 na "+maxCycles+" kwa mwaka.");
    if (!Object.hasOwn(model.broilers.mortalityPct,state.management) || !Object.hasOwn(markets[state.countryCode].housing_per_sqm,state.housingType) || typeof state.ownHouse !== "boolean") throw Error("Kagua mfumo wa ufugaji na aina ya banda.");
    return state;
  }
  function read() {
    return check({countryCode:fields.countryCode.value,mode:fields.mode.value,flockSize:fields.flockSize.valueAsNumber,
      management:fields.management.value,cyclesPerYear:fields.cyclesPerYear.disabled ? initial.cyclesPerYear : fields.cyclesPerYear.valueAsNumber,
      ownHouse:fields.ownHouse.checked,ownEquipment:fields.ownHouse.checked,housingType:fields.housingType.value});
  }
  function visibility() {
    const commercial = fields.mode.value !== "indigenous", cycles = ["broilers","compare"].includes(fields.mode.value);
    form.querySelector("[data-commercial]").hidden = !commercial;
    form.querySelector("[data-cycles]").hidden = !cycles;
    fields.cyclesPerYear.disabled = !cycles;
    form.querySelector("[data-housing]").hidden = fields.ownHouse.checked;
  }
  function restore(input) {
    for(const key of ["countryCode","mode","flockSize","management","cyclesPerYear","housingType"]) fields[key].value = input[key];
    fields.ownHouse.checked = input.ownHouse; visibility();
  }
  function clear(message) {
    revision++; snapshot = null; rows = []; output.replaceChildren(); box.hidden = true; status.textContent = message;
  }
  function run(input) {
    const state = check(input);
    const result = engine.calculate(state,markets[state.countryCode],model);
    if (!result || result.error) throw Error("Hesabu imeshindikana. Kagua ingizo.");
    return result;
  }
  function render(input) {
    const result = run(input), currency = markets[input.countryCode].currency;
    const amount = n => new Intl.NumberFormat("sw",{maximumFractionDigits:2}).format(n);
    rows = [["Nchi",fields.countryCode.selectedOptions[0].text],["Idadi ya kuku",String(input.flockSize)],["Sarafu",currency]];
    const groups = result.mode === "compare" ? [result.broiler,result.layer,result.indigenous] : [result];
    for (const group of groups) {
      const annual = group.annual, label = names[group.mode];
      const money = value => amount(value)+" "+currency;
      const values = [["Mapato kwa mwaka",money(annual.revenue.total ?? annual.revenue)],["Gharama kwa mwaka",money(annual.costs.total ?? annual.costs)],["Faida au hasara kwa mwaka",money(annual.profit)],["Marejesho ya uwekezaji (ROI)",amount(group.metrics.roi)+"%"]];
      if (group.cyclesYear) values.push(["Mizunguko kwa mwaka",String(group.cyclesYear)]);
      const h = document.createElement("h3"); h.textContent=label; output.append(h);
      const dl = document.createElement("dl");
      for(const [key,value] of values) {
        rows.push([label+" — "+key,value]);
        const dt=document.createElement("dt"),dd=document.createElement("dd");dt.textContent=key;dd.textContent=value;dl.append(dt,dd);
      }
      output.append(dl);
    }
    snapshot={schemaVersion:1,tool:config.id,locale:"sw",generatedAt:new Date().toISOString(),source:config.source,input,result,privacy:"local-only"};
    box.hidden=false;status.textContent="Makadirio yamekokotolewa kwa data ya "+fields.countryCode.selectedOptions[0].text+" ("+currency+").";box.focus();
  }
  form.addEventListener("input",()=>{clear("Ingizo limebadilika. Kokotoa tena.");visibility();});
  form.addEventListener("reset",()=>{clear("Fomu imewekwa upya.");setTimeout(()=>restore(initial),0);});
  form.addEventListener("submit",e=>{e.preventDefault();clear("");try{render(read());}catch(error){status.textContent=error.message;}});
  function save(content,mime,extension) {
    const url=URL.createObjectURL(new Blob([content],{type:mime})),link=document.createElement("a");
    link.href=url;link.download="afrotools-"+config.id+"."+extension;link.click();setTimeout(()=>URL.revokeObjectURL(url),5000);
  }
  host.addEventListener("click",e=>{
    const button=e.target.closest("[data-export]");if(!button||!snapshot)return;
    const type=button.dataset.export;
    if(type==="json"){save(JSON.stringify(snapshot,null,2),"application/json","json");return;}
    const lines=[config.name,...rows.map(([k,v])=>k+": "+v),"Chanzo: "+config.source,"Makadirio ya kupanga; thibitisha bei za eneo lako."];
    if(type==="txt")save(lines.join("\n"),"text/plain;charset=utf-8","txt");
    if(type==="csv"){const quote=v=>'"'+v.replace(/"/g,'""')+'"';save([["Kipengele","Thamani"],...rows].map(row=>row.map(quote).join(",")).join("\r\n"),"text/csv;charset=utf-8","csv");}
    if(type==="pdf"){
      if(!window.jspdf){status.textContent="PDF haikupakia. Chagua TXT au CSV.";return;}
      const pdf=new window.jspdf.jsPDF();pdf.setFontSize(11);let y=18;
      for(const line of lines){for(const sub of pdf.splitTextToSize(line.replace(/—/g,"-"),175)){if(y>278){pdf.addPage();y=18;}pdf.text(sub,15,y);y+=6;}}
      pdf.save("afrotools-"+config.id+".pdf");
    }
  });
  host.querySelector("[data-import]").addEventListener("change",async e=>{
    const file=e.target.files[0];if(!file)return;
    clear("Inafungua faili…");const current=revision;
    try{const data=JSON.parse(await file.text());if(current!==revision)return;
      if(data.tool!==config.id||data.locale!=="sw"||!data.input)throw Error("Chagua faili ya JSON ya kikokotoo hiki.");
      const input=check(data.input);restore(input);render(input);
    }catch(error){if(current===revision)clear("Faili haijafunguliwa. "+error.message);}finally{e.target.value="";}
  });
  restore(initial);
  window.__SW_AGRI_TEST__={run,getLatest:()=>snapshot?.result??null,report:()=>snapshot};
})();
