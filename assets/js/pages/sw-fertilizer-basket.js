(() => {
  'use strict';
  const get=id=>document.getElementById(id),form=get('soil-form'),f=form.elements;
  const source='Makisio kwa bei za mfano za mifuko ya kilo 50. Hakikisha bei na mahitaji ya shamba lako.';
  let saved=null;
  function clear(){saved=null;get('soil-results').hidden=true;get('soil-status').textContent='';}
  function calculate(){
    clear();if(!form.reportValidity())return;
    const input=Object.fromEntries(new FormData(form));
    input.area=Number(input.area);
    const model=window.AfroTools?.FertilizerCalcEngine,data=window.AfroTools?.FertilizerCalcData;
    if(!model||!data){get('soil-status').textContent='Hesabu haijapakiwa. Pakia ukurasa tena.';return;}
    const r=model.calculate(input,data);if(!r.ok)return;
    const rows=[['Zao','',f.cropId.selectedOptions[0].text],['Eneo','ha',input.area],['Mahitaji ya N, P₂O₅, K₂O kwa eneo lote','kg',[r.totals.n,r.totals.p,r.totals.k].join(', ')],
      ['NPK 15-15-15 ya kutumia','kg',r.basket.npkKg.toFixed(1)],['Urea ya kutumia','kg',r.basket.ureaKg.toFixed(1)],
      ['Mifuko ya NPK ya kununua','× 50 kg',r.bags.npk15],['Mifuko ya urea ya kununua','× 50 kg',r.bags.urea],
      ['Bei ya mfuko wa NPK',input.currency,data.costs[input.currency].npk15],['Bei ya mfuko wa urea',input.currency,data.costs[input.currency].urea],
      ['Makisio ya ununuzi wa NPK na urea',input.currency,r.cost.total],['P₂O₅ ambayo haijajumuishwa','kg',r.basket.remainingP2O5],['K₂O ambayo haijajumuishwa','kg',r.basket.remainingK2O],
      ['Matumizi','','Hifadhi mbolea iliyobaki kwenye mifuko. Nunua kulingana na bei ya muuzaji na ushauri wa kilimo.']];
    saved={tool:'fertilizer-calc',locale:'sw',input,result:{entries:rows,source}};
    const values=get('soil-values');values.replaceChildren();
    for(const [label,unit,value] of rows){const dt=document.createElement('dt'),dd=document.createElement('dd');dt.textContent=label;dd.textContent=[value,unit].filter(String).join(' ');values.append(dt,dd);}
    get('soil-results').hidden=false;get('soil-status').textContent='Matokeo tayari.';
  }
  form.addEventListener('input',clear);form.addEventListener('reset',clear);form.addEventListener('submit',e=>{e.preventDefault();calculate();});
  get('soil-results').addEventListener('click',async e=>{
    const k=e.target.dataset.file;if(!k||!saved)return;const txt=get('soil-values').innerText+'\n'+saved.result.source;
    if(k==='copy'){try{await navigator.clipboard.writeText(txt);get('soil-status').textContent='Imenakiliwa.';}catch{get('soil-status').textContent='Pakua TXT au nakili maandishi.';}return;}
    if(k==='pdf'){if(!window.jspdf){get('soil-status').textContent='PDF haipatikani. Pakua TXT.';return;}const p=new window.jspdf.jsPDF();p.text(p.splitTextToSize(txt,175),15,20);p.save('mpango-wa-mbolea.pdf');return;}
    const rows=[['kipengele','kipimo','thamani'],...saved.result.entries,['Chanzo','',saved.result.source]];const csv=rows.map(r=>r.map(x=>'"'+String(x).replaceAll('"','""')+'"').join(',')).join('\r\n');
    const content=k==='json'?JSON.stringify(saved,null,2):k==='csv'?csv:txt;const url=URL.createObjectURL(new Blob([content],{type:{txt:'text/plain',csv:'text/csv',json:'application/json'}[k]}));const link=document.createElement('a');link.href=url;link.download='mpango-wa-mbolea.'+k;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  });
  get('soil-import').addEventListener('change',async e=>{
    try{clear();const p=JSON.parse(await e.target.files[0].text());if(p.tool!=='fertilizer-calc'||p.locale!=='sw'||!p.input)throw Error();
      for(const k of ['cropId','area','soil','target','currency']){if(!Object.hasOwn(p.input,k))throw Error();f[k].value=p.input[k];if(!f[k].value||!f[k].checkValidity())throw Error();}calculate();
    }catch{get('soil-status').textContent='Faili haina hesabu halali ya mbolea.';}e.target.value='';
  });
})();