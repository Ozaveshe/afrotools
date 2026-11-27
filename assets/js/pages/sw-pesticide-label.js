(() => {
  'use strict';
  const cfg=window.__SW_AGRI_CONFIG__, engine=window.AfroTools?.PesticideDosageEngine;
  if(!engine)return;
  const root=document.querySelector('[data-sw-agriculture-app]'),form=root.querySelector('form'),box=root.querySelector('[data-result]'),status=root.querySelector('[data-status]'),data=root.querySelector('[data-output]');
  const el=k=>form.elements.namedItem(k);
  const sprayUnits=['L/ha','mL/ha','kg/ha','g/ha'],seedUnits=['g/kg','mL/kg'];
  let latest=null,input=null,rows=[],revision=0;
  function clear(){revision++;latest=null;input=null;rows=[];box.hidden=true;data.textContent='';status.textContent='';}
  function priceLabel(){const unit=el('unitLabel').value;document.getElementById('price-label').textContent='Bei kwa '+(['L/ha','mL/ha','mL/kg'].includes(unit)?'lita (L)':'kilo (kg)')+' ya bidhaa (hiari)';}
  function sync(){
    const seed=el('kind').value==='seed-treatment';
    for(const [id,on] of [['label-field',!seed],['label-seed',seed]]){const field=document.getElementById(id);field.hidden=!on;field.disabled=!on;}
    const unit=el('unitLabel');unit.replaceChildren(new Option('Chagua kipimo kutoka kwenye lebo',''));for(const u of seed?seedUnits:sprayUnits)unit.add(new Option(u,u));
    priceLabel();
  }
  const optional=x=>x===''||x==null?null:Number(x);
  function calculate(v){
    const seed=v.kind==='seed-treatment',unit=seed?(v.unitLabel||v.unit+'/kg'):v.unitLabel;
    if(!['spray','seed-treatment'].includes(v.kind)||!(seed?seedUnits:sprayUnits).includes(unit))throw Error('Chagua kipimo hicho hicho kilicho kwenye lebo.');
    const rate=Number(v.rate),size=Number(seed?v.seedKg:v.areaHa);
    if(!Number.isFinite(rate)||rate<=0||!Number.isFinite(size)||size<=0)throw Error('Kiwango na eneo au uzito wa mbegu lazima viwe vikubwa kuliko sifuri.');
    const norm=seed?engine.calculateSeedTreatment({rate,seedKg:size,unit:unit.split('/')[0]}):engine.normalizeRate(rate,unit);
    const total=seed?norm.totalProduct/1000:norm.ratePerHa*size,productUnit=unit.startsWith('mL')||unit.startsWith('L')?'L':'kg';
    const water=seed?null:optional(v.waterPerHa),tank=seed?null:optional(v.tankSize),price=optional(v.pricePerUnit),rei=optional(v.reentryHours),phi=optional(v.preHarvestDays);
    if([water,tank].some(n=>n!==null&&(!Number.isFinite(n)||n<=0))||[price,rei,phi].some(n=>n!==null&&(!Number.isFinite(n)||n<0)))throw Error('Kagua thamani ulizoandika na vipimo vyake.');
    if(tank!==null&&water===null)throw Error('Andika kiasi cha maji kwa hekta ili kuhesabu idadi ya matanki.');
    if(price!==null&&!/^[a-z]{3}$/i.test(v.currency||''))throw Error('Andika msimbo wa sarafu wenye herufi tatu pamoja na bei.');
    const totalWater=water===null?null:water*size;
    const result={ok:true,kind:v.kind,sourceRate:rate,sourceUnit:unit,totalProduct:total,displayUnit:productUnit,totalWater,tankSize:tank,tankLoads:tank&&totalWater?Math.ceil(totalWater/tank):null,totalCost:price===null?null:price*total,currency:price===null?null:v.currency.toUpperCase(),reentryHours:rei,preHarvestDays:phi};
    if(Object.values(result).some(n=>typeof n==='number'&&!Number.isFinite(n))||total<=0)throw Error('Hesabu ni kubwa au ndogo kuliko kiwango kinachoweza kuonyeshwa.');
    return result;
  }
  const fmt=new Intl.NumberFormat('sw',{maximumSignificantDigits:12});
  function render(v,r){
    input=v;latest=r;const n=x=>fmt.format(x);
    const labelUnit=r.sourceUnit.split('/')[0];
    const sourceTotal=Number(v.rate)*Number(r.kind==='spray'?v.areaHa:v.seedKg);
    const quantity=n(sourceTotal)+' '+labelUnit+(labelUnit===r.displayUnit?'':' ('+n(r.totalProduct)+' '+r.displayUnit+')');
    rows=[['Kiwango kutoka kwenye lebo',n(r.sourceRate)+' '+r.sourceUnit],['Kiasi cha bidhaa kwa jumla',quantity],[r.kind==='spray'?'Eneo la shamba':'Uzito wa mbegu',r.kind==='spray'?n(v.areaHa)+' ha':n(v.seedKg)+' kg']];
    if(r.totalWater!==null)rows.push(['Kiasi cha maji kwa jumla',n(r.totalWater)+' L']);
    if(r.tankLoads!==null)rows.push(['Idadi ya matanki ya ujazo wa '+n(r.tankSize)+' L',n(r.tankLoads)+' (tanki la mwisho linaweza lisijae)']);
    if(r.totalCost!==null)rows.push(['Gharama kwa bei uliyoandika',n(r.totalCost)+' '+r.currency]);
    rows.push(['Kuingia tena shambani',r.reentryHours===null?'Muda haujaingizwa. Angalia lebo.':n(r.reentryHours)+' saa (kutoka kwenye lebo)'],['Kuvuna',r.preHarvestDays===null?'Muda haujaingizwa. Angalia lebo.':n(r.preHarvestDays)+' siku (kutoka kwenye lebo)']);
    const list=document.getElementById('label-results');list.replaceChildren();
    for(const [key,value] of rows){const dt=document.createElement('dt'),dd=document.createElement('dd');dt.textContent=key;dd.textContent=value;list.append(dt,dd);}
    data.textContent=JSON.stringify(r,null,2);box.hidden=false;box.focus();status.textContent='Hesabu imekamilika kwenye kifaa hiki.';
  }
  sync();
  form.addEventListener('input',clear);
  el('kind').addEventListener('change',()=>{clear();sync();});
  el('unitLabel').addEventListener('change',()=>{clear();priceLabel();});
  form.addEventListener('submit',e=>{e.preventDefault();clear();try{const v=Object.fromEntries(new FormData(form));render(v,calculate(v));}catch(err){status.textContent=err.message;}});
  form.addEventListener('reset',()=>{clear();const ticket=revision;setTimeout(()=>{if(ticket===revision)sync();},0);});
  function report(){return {schemaVersion:1,tool:cfg.id,locale:'sw',source:cfg.source,generatedAt:new Date().toISOString(),input,result:latest,privacy:'local-only'};}
  function download(text,type,ext){const a=document.createElement('a'),url=URL.createObjectURL(new Blob([text],{type}));a.href=url;a.download='afrotools-'+cfg.id+'.'+ext;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
  root.addEventListener('click',e=>{const b=e.target.closest('[data-export]');if(!b||!latest)return;const lines=[cfg.name,...rows.map(row=>row.join(' — ')),'Thibitisha taarifa hizi kwenye lebo ya bidhaa iliyoidhinishwa.'];
    switch(b.dataset.export){case 'json':download(JSON.stringify(report(),null,2),'application/json','json');break;
      case 'csv':download(['sehemu,thamani',...rows.map(row=>row.map(x=>'"'+x.replace(/"/g,'""')+'"').join(','))].join('\r\n'),'text/csv;charset=utf-8','csv');break;
      case 'txt':download(lines.join('\n'),'text/plain;charset=utf-8','txt');break;
      case 'pdf':{if(!window.jspdf){status.textContent='Moduli ya PDF haikupatikana.';return;}const pdf=new window.jspdf.jsPDF({unit:'pt',format:'a4'});pdf.text(pdf.splitTextToSize(lines.join('\n').replace(/—/g,'-'),495),40,52);pdf.save('afrotools-'+cfg.id+'.pdf');}
    }
  });
  root.querySelector('[data-import]').addEventListener('change',async e=>{const file=e.target.files[0];if(!file)return;clear();const ticket=revision;
    try{const saved=JSON.parse(await file.text());if(ticket!==revision)return;const v=saved.input;
      if(saved.tool!==cfg.id||saved.locale!=='sw'||!v||!['spray','seed-treatment'].includes(v.kind))throw Error();
      form.reset();clear();el('kind').value=v.kind;sync();
      el('unitLabel').value=v.unitLabel||(v.unit?v.unit+'/kg':'');priceLabel();
      for(const key of ['rate','areaHa','waterPerHa','tankSize','sprayerKey','seedKg','pricePerUnit','currency','reentryHours','preHarvestDays'])el(key).value=v[key]??'';
      status.textContent='Ripoti imefunguliwa. Linganisha kiwango, vipimo na muda na lebo yako, kisha bonyeza Kokotoa. Hakuna hesabu ya zamani iliyotumika.';
    }catch{clear();status.textContent='Faili haijasomeka kama ripoti ya kikokotoo hiki.';}finally{e.target.value='';}
  });
  window.__SW_AGRI_TEST__={run:calculate,getLatest:()=>latest,report};
})();
