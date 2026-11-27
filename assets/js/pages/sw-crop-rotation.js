(() => {
  'use strict';
  const cfg = window.__SW_AGRI_CONFIG__;
  const {CropRotationEngine:engine, countryIndex:countries} = window.AfroTools || {};
  if (!engine || !countries) return;
  const id = name => document.getElementById('rotation-' + name);
  const root = document.querySelector('[data-sw-agriculture-app]');
  const form = root.querySelector('form'), status = root.querySelector('[data-status]'), resultBox = root.querySelector('[data-result]');
  const names = {maize:'Mahindi',rice:'Mpunga',sorghum:'Mtama',millet:'Uwele',wheat:'Ngano',teff:'Tefu',barley:'Shayiri',fonio:'Fonio',cowpea:'Kunde',groundnut:'Karanga',soybean:'Soya',common_bean:'Maharagwe',pigeon_pea:'Mbaazi',chickpea:'Dengu aina ya chickpea',lentils:'Dengu',bambara_groundnut:'Njugu mawe',cassava:'Muhogo',yam:'Viazi vikuu',sweet_potato:'Viazi vitamu',potato:'Viazi mviringo',tomato:'Nyanya',onion:'Vitunguu',pepper:'Pilipili',cabbage:'Kabichi',cotton:'Pamba',sesame:'Ufuta',sunflower:'Alizeti',tobacco:'Tumbaku',sugar_cane:'Miwa',oil_palm:'Mchikichi',cocoa:'Kakao',coffee_arabica:'Kahawa ya Arabika',coffee_robusta:'Kahawa ya Robusta',plantain:'Ndizi za kupika',banana:'Ndizi',cashew:'Korosho'};
  const crops = engine.getAllCrops().sort((a,b)=>names[a.id].localeCompare(names[b.id],'sw'));
  const groups = engine.getCropGroups();
  const regionNames = new Intl.DisplayNames(['sw'], {type:'region'});
  id('country').add(new Option('Bila nchi maalumu',''));
  countries.map(c=>[regionNames.of(c.code),c.code]).sort((a,b)=>a[0].localeCompare(b[0],'sw')).forEach(([name,code])=>id('country').add(new Option(name,code)));
  for (const crop of crops) {
    id('previous').add(new Option(names[crop.id],crop.id));
    const label=document.createElement('label'), input=document.createElement('input');
    input.type='checkbox'; input.value=crop.id;
    label.append(input,document.createTextNode(names[crop.id])); id('pool').append(label);
  }
  const checks=Array.from(id('pool').querySelectorAll('input'));
  let latest=null, applied=null, reportLines=[], revision=0, poolOrder=[];
  function selected(){return poolOrder.filter(key=>checks.some(c=>c.value===key&&c.checked));}
  function syncPool(keys){
    poolOrder=Array.from(new Set(keys.map(key=>key==='beans'?'common_bean':key))).filter(key=>Object.hasOwn(names,key));
    for(const c of checks)c.checked=poolOrder.includes(c.value);
    showPool();
  }
  function showPool(){const keys=selected();id('selected').textContent=keys.length?'Umechagua: '+keys.map(k=>names[k]).join(', '):'Modeli itazingatia mazao yote.';}
  function setControls(v){
    id('country').value=v.countryCode||'';id('previous').value=v.prevCrop==='beans'?'common_bean':v.prevCrop;
    id('seasons').value=v.seasons;id('goal').value=v.goal||'maximize_yield';id('soil').value=v.soilCondition||'average';syncPool(v.availableCrops||[]);
  }
  function read(){return {countryCode:id('country').value,prevCrop:id('previous').value,seasons:id('seasons').valueAsNumber,goal:id('goal').value,soilCondition:id('soil').value,availableCrops:selected()};}
  function clear(){revision++;latest=null;applied=null;resultBox.hidden=true;root.querySelector('[data-output]').textContent='';status.textContent='';}
  function render(input){
    const r=engine.calculate(input);
    if(!r.success) throw Error('Kagua zao lililopita na mazao yanayopatikana.');
    latest=r;applied=input;
    const summary=r.sequence.every(s=>s.crop===s.prevCrop)?'Zao lilelile litapandwa kila msimu. Hakuna mzunguko wa mazao.':'Mazao tofauti katika mpango: '+r.summary.rotationDiversity+'. Ongezeko la mavuno linalokadiriwa na modeli: '+r.yieldBoost+'%.';
    id('summary').textContent=summary+' Alama ya afya ya udongo: '+r.soilHealth.start+' hadi '+r.soilHealth.end+' kati ya 100. Jumla ya nitrojeni inayokadiriwa kufungwa: '+r.totalNFixed+' kg/ha.';
    id('sequence').replaceChildren(); reportLines=[cfg.name,id('summary').textContent];
    for(const step of r.sequence){
      const li=document.createElement('li'), heading=document.createElement('strong'), detail=document.createElement('p');
      heading.textContent='Msimu wa '+step.season+' — '+names[step.crop];
      const lines=['Zao lililotangulia: '+names[step.prevCrop]+'.'];
      if(step.crop===step.prevCrop)lines.push('Zao limerudiwa. Ongeza zao jingine linalopatikana ili kupanga mzunguko.');
      else if(groups[step.crop].family===groups[step.prevCrop].family)lines.push('Mazao haya ni ya familia moja.');
      else lines.push('Familia ya mmea imebadilika.');
      if(step.nFixer)lines.push('Nitrojeni inayokadiriwa kufungwa: '+step.nFixed+' kg/ha.');
      if(r.warnings.some(w=>w.season===step.season)&&step.crop!==step.prevCrop)lines.push('Modeli imeonyesha tahadhari kwa kufuatisha mazao haya. Hakikisha kwa mtaalamu wa kilimo.');
      if(step.alternatives.length)lines.push('Machaguo mengine: '+step.alternatives.map(a=>names[a.id]).join(', ')+'.');
      detail.textContent=lines.join(' ');li.append(heading,detail);id('sequence').append(li);reportLines.push(heading.textContent,detail.textContent);
    }
    reportLines.push(id('limit').textContent,'Chanzo: '+cfg.source);
    root.querySelector('[data-output]').textContent=JSON.stringify(r,null,2);resultBox.hidden=false;resultBox.focus();status.textContent='Mpango umetengenezwa kwenye kifaa hiki.';
  }
  setControls(cfg.input);
  form.addEventListener('input',event=>{clear();if(checks.includes(event.target)){if(event.target.checked&&!poolOrder.includes(event.target.value))poolOrder.push(event.target.value);showPool();}});
  id('country-crops').addEventListener('click',()=>{const c=countries.find(c=>c.code===id('country').value);clear();syncPool(c?c.topCrops:[]);});
  form.addEventListener('reset',()=>{clear();setTimeout(()=>{setControls(cfg.input);status.textContent='Fomu imewekwa upya.';},0);});
  form.addEventListener('submit',e=>{e.preventDefault();clear();try{render(read());}catch(err){status.textContent=err.message;}});
  function report(){return {schemaVersion:1,tool:cfg.id,locale:'sw',generatedAt:new Date().toISOString(),source:cfg.source,input:applied,result:latest,privacy:'local-only'};}
  function save(text,type,ext){const a=document.createElement('a'),url=URL.createObjectURL(new Blob([text],{type}));a.download='afrotools-'+cfg.id+'.'+ext;a.href=url;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
  root.addEventListener('click',e=>{
    const b=e.target.closest('[data-export]');if(!b||!latest)return;
    switch(b.dataset.export){
      case 'json':save(JSON.stringify(report(),null,2),'application/json','json');break;
      case 'txt':save(reportLines.join('\n'),'text/plain;charset=utf-8','txt');break;
      case 'csv': {
        const rows=[['sehemu','thamani'],['Muhtasari',id('summary').textContent],...latest.sequence.map((s,i)=>[reportLines[2+i*2],reportLines[3+i*2]]),...Object.entries(latest).map(([key,value])=>[key,JSON.stringify(value)])];
        save(rows.map(row=>row.map(x=>'"'+x.replace(/"/g,'""')+'"').join(',')).join('\r\n').replace('"sehemu","thamani"','sehemu,thamani'),'text/csv;charset=utf-8','csv');break;
      }
      case 'pdf': {
        if(!window.jspdf){status.textContent='Moduli ya PDF haikupatikana.';return;}
        const pdf=new window.jspdf.jsPDF({unit:'pt',format:'a4'});let y=48;
        for(const line of pdf.splitTextToSize(reportLines.join('\n').replace(/—/g,'-'),490)){if(y>780){pdf.addPage();y=48;}pdf.text(line,42,y);y+=15;}pdf.save('afrotools-'+cfg.id+'.pdf');
      }
    }
  });
  root.querySelector('[data-import]').addEventListener('change',async e=>{
    const file=e.target.files[0];if(!file)return;clear();const ticket=revision;
    try{const saved=JSON.parse(await file.text());if(ticket!==revision)return;
      const v=saved.input;if(saved.tool!==cfg.id||saved.locale!=='sw'||!saved.result||!v||!Object.hasOwn(names,v.prevCrop==='beans'?'common_bean':v.prevCrop)||!Number.isSafeInteger(Number(v.seasons??4))||Number(v.seasons??4)<1)throw Error();
      setControls({...v,seasons:v.seasons??4});if(!id('goal').value||!id('soil').value)throw Error();render(read());status.textContent='Ripoti imefunguliwa na mpango umekokotolewa upya kwa modeli ya sasa.';
    }catch{clear();status.textContent='Faili haijasomeka kama mpango wa mzunguko wa mazao.';}finally{e.target.value='';}
  });
  window.__SW_AGRI_TEST__={run:input=>engine.calculate(input),getLatest:()=>latest,report};
})();
