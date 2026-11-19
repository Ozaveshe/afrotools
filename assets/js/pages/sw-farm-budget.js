(() => {
  'use strict';
  const root = document.querySelector('[data-tool="farm-budget"]');
  const api = window.AfroTools, cfg = window.__SW_AGRI_CONFIG__;
  if (!root || !cfg || !api?.FarmBudgetEngine || !api.FarmBudgetData || !api.farmCosts) return;
  const form = root.querySelector('form'), list = form.querySelector('[data-crops]');
  const controls = Object.fromEntries([...form.querySelectorAll('[data-key]')].map(c => [c.dataset.key,c]));
  const box = root.querySelector('[data-result]'), output = box.querySelector('[data-output]');
  const status = root.querySelector('[data-status]');
  const num = new Intl.NumberFormat('sw-KE',{maximumFractionDigits:2});
  const names = new Intl.DisplayNames(['sw'],{type:'region'});
  const countries = Object.keys(api.farmCosts).sort((a,b)=>names.of(a).localeCompare(names.of(b),'sw'));
  controls.countryCode.replaceChildren(...countries.map(code => new Option(names.of(code)+' ('+api.farmCosts[code].currency+')',code,code==='KE',code==='KE')));
  let result = null, lines = [];
  const rows = () => [...list.children];
  const run = input => api.FarmBudgetEngine.calculate(input,{data:api.FarmBudgetData,farmCosts:api.farmCosts});
  function sync() {
    const rented = controls.landMode.value === 'rent', loan = controls.financeMode.value === 'loan';
    form.querySelector('[data-rent]').hidden = !rented;
    controls.rentOverride.disabled = !rented;
    form.querySelector('[data-loan]').hidden = !loan;
    controls.loanTerm.disabled = controls.loanRate.disabled = !loan;
    const country = controls.countryCode.value;
    form.querySelector('[data-reference]').textContent = 'Sarafu: '+api.farmCosts[country].currency+'. '+
      (api.FarmBudgetData.marketPricePerTonne[country] ? 'Bei na gharama ni za mfano.' : 'Bei za mauzo zinatumia mfano wa jumla kwa sababu jedwali la bei la nchi hii halipo.');
    rows().forEach((row,i) => {
      row.querySelector('[data-number]').textContent = i+1;
      row.querySelector('[data-remove]').disabled = rows().length === 1;
    });
  }
  function makeRow(crop='maize',area=1) {
    const row = form.querySelector('[data-row]').content.firstElementChild.cloneNode(true);
    row.querySelector('select').value = crop;
    row.querySelector('input').value = area;
    return row;
  }
  function read() {
    const input = {crops:rows().map(row=>({crop:row.querySelector('select').value,area:row.querySelector('input').valueAsNumber}))};
    for (const [key,c] of Object.entries(controls)) {
      if (!c.disabled && c.value!=='') input[key] = (c.type==='number'||key==='startMonth') ? Number(c.value) : c.value;
    }
    return input;
  }
  function clear() {
    result=null;
    box.hidden=true;
    output.replaceChildren();
    status.textContent='Kokotoa bajeti baada ya kubadili taarifa.';
  }
  function calculate() {
    const input=read(), r=run(input);
    if (!r.ok || ![r.totalBudget,r.profit,...r.cashflow.map(m=>m.value)].every(Number.isFinite)) {
      clear();status.textContent='Kagua maeneo na gharama ulizoingiza.';return;
    }
    result=r;
    const n=v=>num.format(v), money=v=>n(v)+' '+r.currency.code;
    const months=[...controls.startMonth.options].map(o=>o.text);
    const costs={seed:'Mbegu na vipando',fertilizer:'Mbolea',chemicals:'Dawa za kilimo',labor:'Kazi',mechanization:'Utayarishaji kwa mashine au wanyama',land:'Ardhi',transport:'Usafiri'};
    lines=[
      ['Kipindi cha bajeti',months[r.cashflow[0].monthIndex]+' – '+months[r.cashflow[5].monthIndex]],
      ['Eneo la jumla',n(r.totals.area)+' ha'],['Bajeti ya msimu',money(r.totalBudget)],['Mapato ya mauzo',money(r.totals.revenue)],
      [r.profit<0?'Hasara inayokadiriwa':'Faida inayokadiriwa',money(Math.abs(r.profit))],
      ['Faida kama asilimia ya bajeti',n(r.roi)+'%'], ...Object.entries(costs).map(([key,label])=>[label,money(r.totals[key])]),
      ['Akiba ya dharura (10%)',money(r.contingency)],['Riba ya mkopo',money(r.loanInterest)],
      ...r.cropLines.map((crop,i)=>[rows()[i].querySelector('select').selectedOptions[0].text+' ('+n(crop.area)+' ha)',n(crop.yieldTonnes)+' t · Mapato '+money(crop.revenue)]),
      ...r.cashflow.map(m=>['Matumizi ya '+months[m.monthIndex],money(m.value)])
    ];
    output.replaceChildren();
    for(const [label,value] of lines) {
      const dt=document.createElement('dt'),dd=document.createElement('dd');
      dt.textContent=label;dd.textContent=value;output.append(dt,dd);
    }
    box.hidden=false;status.textContent='Bajeti imekokotolewa.';box.focus();
  }
  form.addEventListener('submit',e=>{e.preventDefault();calculate();});
  form.addEventListener('input',()=>{clear();sync();});
  form.addEventListener('invalid',e=>{status.textContent='Kagua sehemu hii: '+e.target.labels[0].textContent.trim()+'. Ingiza thamani iliyo ndani ya kiwango kinachokubalika.';},true);
  form.addEventListener('reset',()=>setTimeout(()=>{list.replaceChildren(makeRow());clear();sync();},0));
  form.addEventListener('click',e=>{
    if(e.target.closest('[data-add]')) {
      const row=makeRow();list.append(row);clear();sync();row.querySelector('select').focus();
    }
    if(e.target.closest('[data-remove]') && rows().length>1) {
      const row=e.target.closest('[data-crop]'),next=row.nextElementSibling||row.previousElementSibling;
      row.remove();clear();sync();next.querySelector('select').focus();
    }
  });
  function report() {
    return {schemaVersion:1,tool:cfg.id,locale:'sw',generatedAt:new Date().toISOString(),source:cfg.source,input:read(),result,privacy:'local-only'};
  }
  root.querySelector('[data-import]').addEventListener('change', async e=>{
    if(!e.target.files[0]) return;
    try {
      const p=JSON.parse(await e.target.files[0].text()), v=p.input;
      if(p.tool!==cfg.id||p.locale!=='sw'||!p.result||!Array.isArray(v?.crops)||!v.crops.length) throw Error();
      const newRows=v.crops.map(c=>{
        if (!c || typeof c.crop !== "string" || !Number.isFinite(Number(c.area)) || Number(c.area) <= 0) throw Error();
        const row=makeRow(c.crop,c.area);
        if(!row.querySelector('select').value || !row.querySelector('input').validity.valid || !Number.isFinite(Number(c.area))) throw Error();
        return row;
      });
      const values={};
      for(const [key,c] of Object.entries(controls)) {
        const test=c.cloneNode(true);
        test.disabled=false;
        test.value=v[key]??cfg.input[key]??'';
        if((c.tagName==='SELECT'&&!test.value)||!test.validity.valid||(v[key]!=null&&test.value==='')) throw Error();
        values[key]=test.value;
      }
      list.replaceChildren(...newRows);
      for(const [k,val] of Object.entries(values)) controls[k].value=val;
      sync();calculate();
      if(result)status.textContent='JSON imefunguliwa na bajeti imekokotolewa tena.';
    }catch{status.textContent='Faili halina bajeti halali ya shamba.';}
    e.target.value='';
  });
  function download(mime,content,ext) {
    const url=URL.createObjectURL(new Blob([content],{type:mime})),a=document.createElement('a');
    a.href=url;a.download='afrotools-farm-budget.'+ext;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),5000);
  }
  root.addEventListener('click',e=>{
    const type=e.target.closest('[data-export]')?.dataset.export;
    if(!type||!result)return;
    const text=[cfg.name,...lines.map(([key,val])=>key+': '+val)].join('\n');
    if(type==='json')download('application/json',JSON.stringify(report(),null,2),type);
    if(type==='txt')download('text/plain',text,type);
    if(type==='csv')download('text/csv',[['Kipimo','Thamani'],...lines].map(row=>row.map(v=>'"'+v.replaceAll('"','""')+'"').join(',')).join('\r\n'),type);
    if(type==='pdf') {
      if(!window.jspdf?.jsPDF){status.textContent='Moduli ya PDF haikupatikana.';return;}
      const pdf=new window.jspdf.jsPDF({unit:'pt',format:'a4'}),wrapped=pdf.splitTextToSize(text,500);
      for(let i=0;i<wrapped.length;i+=36){if(i)pdf.addPage();pdf.text(wrapped.slice(i,i+36),48,58);}
      pdf.save('afrotools-farm-budget.pdf');
    }
  });
  sync();
  window.__SW_AGRI_TEST__={run,getLatest:()=>result,report};
})();
