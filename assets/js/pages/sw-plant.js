(() => {
  'use strict';
  const get=id=>document.getElementById(id);
  const form=get('plant-form'),zone=get('plant-zone'),rain=get('plant-rain'),crop=get('plant-crop'),month=get('plant-month');
  const data=window.AfroTools?.PlantingCalendarData,engine=window.AfroTools?.PlantingCalendarEngine;
  if(!form||!data||!engine)return;
  const zones={forest:'Ukanda wa misitu yenye unyevunyevu',guinea:'Savana ya Guinea',sudan:'Savana ya Sudani',highland:'Nyanda za juu za Afrika Mashariki','coastal-ea':'Pwani ya Afrika Mashariki',southern:'Afrika ya Kusini mwa bara','north-arid':'Ukanda kame wa Afrika Kaskazini'};
  const crops={'Alfalfa / Fodder':'Luseni / malisho',Banana:'Ndizi',Barley:'Shayiri',Beans:'Maharagwe','Cabbage/Kale':'Kabichi / sukuma wiki','Cashew Nut':'Korosho',Cassava:'Muhogo',Citrus:'Matunda ya jamii ya machungwa',Cocoa:'Kakao',Coconut:'Nazi',Coffee:'Kahawa',Cotton:'Pamba',Cowpea:'Kunde','Date Palm':'Mtende',Grapes:'Zabibu',Groundnut:'Karanga',Maize:'Mahindi',Millet:'Mtama mdogo','Oil Palm':'Michikichi',Olive:'Mizeituni',Onion:'Vitunguu','Pepper/Tomato':'Pilipili / nyanya',Plantain:'Ndizi za kupika',Potato:'Viazi mviringo',Rice:'Mpunga',Sesame:'Ufuta','Shea Nut':'Karanga za mti wa shea',Sisal:'Mkonge',Sorghum:'Mtama',Soybean:'Soya',Sunflower:'Alizeti','Sweet Potato':'Viazi vitamu',Tea:'Chai',Teff:'Tefu',Tobacco:'Tumbaku',Tomato:'Nyanya',Vegetables:'Mboga',Wheat:'Ngano',Yam:'Viazi vikuu'};
  const variants={'Long Rain':'masika','Short Rain':'vuli',Early:'mapema',Late:'baadaye',Summer:'kiangazi',Masika:'masika',Vuli:'vuli',Pearl:'uwele','Dry Season':'msimu mkavu',Autumn:'vuli',Spring:'majira ya kuchipua',Irrigated:'umwagiliaji',Lowland:'nyanda za chini',Rainfed:'kilimo cha kutegemea mvua',Ethiopia:'Ethiopia',Winter:'majira ya baridi'};
  const cropName=id=>{const [name,variant]=id.replace(/\)$/,'').split(' (');return (crops[name]||name)+(variant?' ('+(variants[variant]||variant)+')':'');};
  const months=['Januari','Februari','Machi','Aprili','Mei','Juni','Julai','Agosti','Septemba','Oktoba','Novemba','Desemba'];
  const stages={plant:'Kupanda',grow:'Ukuaji',harvest:'Kuvuna',none:'Hakuna hatua iliyoonyeshwa'};
  Object.keys(data.zones).forEach(k=>zone.add(new Option(zones[k],k,k==='forest',k==='forest')));
  month.add(new Option('Mwaka mzima',''));months.forEach((m,i)=>month.add(new Option(m,String(i))));
  let current,lines,rows;
  function clear(){current=null;get('plant-result').hidden=true;get('plant-status').textContent='';}
  function draw(){
    if(!current)return;
    const list=get('plant-list');list.replaceChildren();lines=[];rows=[];
    for(const item of current.crops.filter(c=>!crop.value||crop.value===c.id)){
      const entries=item.months.filter(m=>month.value===''||m.monthIndex===Number(month.value));
      const head=document.createElement('h3');head.textContent=cropName(item.id);list.append(head);lines.push(head.textContent);
      const desc=document.createElement('ul');list.append(desc);
      for(const [stage,label] of Object.entries(stages)){
        const matching=entries.filter(x=>x.status===stage);
        if(!matching.length||(stage==='none'&&month.value===''&&matching.length<12))continue;
        const text=label+': '+matching.map(x=>months[x.monthIndex]).join(', ');
        const li=document.createElement('li');li.textContent=text;desc.append(li);lines.push(text);
      }
      entries.forEach(m=>rows.push([head.textContent,months[m.monthIndex],stages[m.status]]));
    }
  }
  function calculate(selectedCrop='',selectedMonth=''){
    current=engine.calculate({zone:zone.value,rainfall:rain.value},data);if(!current.ok){clear();return;}
    crop.replaceChildren(new Option('Mazao yote',''));current.crops.forEach(c=>crop.add(new Option(cropName(c.id),c.id)));
    crop.value=current.crops.some(c=>c.id===selectedCrop)?selectedCrop:'';month.value=/^(?:[0-9]|1[01])$/.test(selectedMonth)?selectedMonth:'';
    get('plant-note').textContent=zones[current.zone]+' · '+rain.selectedOptions[0].textContent+'. '+(current.note==='bimodal-two-seasons'?'Ukanda huu unaweza kuwa na misimu miwili. ':current.note==='forest-unimodal-warning'?'Ratiba ya misitu inaweza kutofautiana katika eneo lenye msimu mmoja. ':'')+'Miezi inatokana na ukanda uliochaguliwa. Kubadili mpangilio wa mvua hubadili maelezo pekee.';
    get('plant-result').hidden=false;get('plant-status').textContent='Kalenda iko tayari.';draw();
  }
  zone.addEventListener('change',()=>{rain.value=engine.selectCountryZone(zone.value,data).rainfall;clear();});
  rain.addEventListener('change',clear);crop.addEventListener('change',draw);month.addEventListener('change',draw);
  form.addEventListener('submit',e=>{e.preventDefault();calculate();});form.addEventListener('reset',()=>setTimeout(clear,0));
  get('plant-result').addEventListener('click',async e=>{
    const kind=e.target.dataset.file;if(!kind||!current)return;const txt=[get('plant-note').textContent,...lines].join('\n');
    if(kind==='copy'){try{await navigator.clipboard.writeText(txt);get('plant-status').textContent='Imenakiliwa.';}catch{get('plant-status').textContent='Pakua TXT au nakili maandishi.';}return;}
    if(kind==='pdf'){if(!window.jspdf){get('plant-status').textContent='PDF haipatikani. Pakua TXT.';return;}const pdf=new window.jspdf.jsPDF();let y=18;for(const line of pdf.splitTextToSize(txt,175)){if(y>275){pdf.addPage();y=18;}pdf.text(line,15,y);y+=6;}pdf.save('kalenda-ya-kupanda.pdf');return;}
    const saved={schemaVersion:1,tool:'planting-calendar',locale:'sw',source:'data/agriculture/planting-calendar-data.json',input:{zone:zone.value,rainfall:rain.value},filters:{crop:crop.value,month:month.value},result:current};
    const csv='ukanda,zao,mwezi,hatua\r\n'+rows.map(row=>[zones[zone.value],...row].map(v=>'"'+v.replaceAll('"','""')+'"').join(',')).join('\r\n');
    const content=kind==='json'?JSON.stringify(saved,null,2):kind==='csv'?csv:txt;const url=URL.createObjectURL(new Blob([content],{type:{txt:'text/plain',csv:'text/csv',json:'application/json'}[kind]}));
    const link=document.createElement('a');link.href=url;link.download='kalenda-ya-kupanda.'+kind;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  });
  get('plant-import').addEventListener('change',async e=>{
    try{clear();const file=e.target.files[0];if(!file)return;const p=JSON.parse(await file.text());if(p.tool!=='planting-calendar'||p.locale!=='sw'||!p.input||!Object.hasOwn(data.zones,p.input.zone)||!['bimodal','unimodal'].includes(p.input.rainfall))throw Error();
      zone.value=p.input.zone;rain.value=p.input.rainfall;calculate(p.filters?.crop||'',p.filters?.month??'');
    }catch{get('plant-status').textContent='Faili haina kalenda halali.';}e.target.value='';
  });
  form.querySelector('[type=submit]').disabled=false;
})();
