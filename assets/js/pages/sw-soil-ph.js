(() => {
  'use strict';
  const get=id=>document.getElementById(id),form=get('soil-form'),f=form.elements;
  const source='https://extension.colostate.edu/resource/managing-sodic-soils/';
  const tests='Omba maabara ipime chumvi kwa upitishaji umeme (EC) na sodiamu (SAR au ESP). Jadili matokeo na afisa ugani kabla ya kutumia jasi au salfa.';
  let saved=null;
  function clear(){saved=null;get('soil-results').hidden=true;get('soil-status').textContent='';}
  function calculate(){
    clear();if(!form.reportValidity())return;
    const input=Object.fromEntries(new FormData(form));
    for(const k of ['ph','depth','farmHa','limeQuality','limePrice'])input[k]=Number(input[k]);
    const model=window.AfroTools?.SoilPhEngine,data=window.AfroTools?.SoilPhData;
    if(!model||!data){get('soil-status').textContent='Hesabu haijapakiwa. Pakia ukurasa tena.';return;}
    const r=model.calculate(input,data);
    if(!r.ok)return;
    const rows=[['pH iliyopimwa','',input.ph],['Zao','',f.cropKey.selectedOptions[0].text],['pH inayofaa kwa zao','',r.crop.optLow+' – '+r.crop.optHigh]];
    if(r.lime.kind==='alkaline')rows.push(['Hatua inayofuata','',tests]);
    else if(r.lime.kind==='none')rows.push(['Chokaa','','Hakihitajiki kwa pH hii na zao hili.']);
    else {rows.push(['Makisio ya chokaa','t/ha',r.lime.range.low+' – '+r.lime.range.high],['Makisio kwa eneo lote','t',r.lime.totalMid.toFixed(2)],['pH lengwa','',r.lime.targetPH],['Hatua inayofuata','','Thibitisha mahitaji ya chokaa kwa uchambuzi wa udongo kabla ya kununua.']);if(r.lime.totalCost!=null)rows.push(['Makisio ya gharama','',r.lime.totalCost.toFixed(2)]);}
    saved={tool:'soil-ph-calculator',locale:'sw',input,result:{entries:rows,source}};
    const values=get('soil-values');values.replaceChildren();
    for(const [label,unit,value] of rows){const dt=document.createElement('dt'),dd=document.createElement('dd');dt.textContent=label;dd.textContent=[value,unit].filter(String).join(' ');values.append(dt,dd);}
    get('soil-results').hidden=false;get('soil-status').textContent='Matokeo tayari.';
  }
  form.addEventListener('input',clear);form.addEventListener('reset',clear);form.addEventListener('submit',e=>{e.preventDefault();calculate();});
  get('soil-results').addEventListener('click',async e=>{
    const k=e.target.dataset.file;if(!k||!saved)return;const txt=get('soil-values').innerText+'\n'+saved.result.source;
    if(k==='copy'){try{await navigator.clipboard.writeText(txt);get('soil-status').textContent='Imenakiliwa.';}catch{get('soil-status').textContent='Pakua TXT au nakili maandishi.';}return;}
    if(k==='pdf'){if(!window.jspdf){get('soil-status').textContent='PDF haipatikani. Pakua TXT.';return;}const p=new window.jspdf.jsPDF();p.text(p.splitTextToSize(txt,175),15,20);p.save('ph-ya-udongo.pdf');return;}
    const rows=[['kipengele','kipimo','thamani'],...saved.result.entries,['Chanzo','',saved.result.source]];const csv=rows.map(r=>r.map(x=>'"'+String(x).replaceAll('"','""')+'"').join(',')).join('\r\n');
    const content=k==='json'?JSON.stringify(saved,null,2):k==='csv'?csv:txt;const url=URL.createObjectURL(new Blob([content],{type:{txt:'text/plain',csv:'text/csv',json:'application/json'}[k]}));const link=document.createElement('a');link.href=url;link.download='ph-ya-udongo.'+k;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  });
  get('soil-import').addEventListener('change',async e=>{
    try{clear();const p=JSON.parse(await e.target.files[0].text());if(p.tool!=='soil-ph-calculator'||p.locale!=='sw'||!p.input)throw Error();
      for(const k of ['ph','cropKey','texture','depth','farmHa','limeQuality','limePrice']){if(!Object.hasOwn(p.input,k))throw Error();f[k].value=p.input[k];if(!f[k].value||!f[k].checkValidity())throw Error();}calculate();
    }catch{get('soil-status').textContent='Faili haina hesabu halali ya udongo.';}e.target.value='';
  });
})();