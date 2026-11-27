(() => {
  'use strict';
  const get = id => document.getElementById(id);
  const form = get('farm-area');
  if (!form || !window.AfroTools || !AfroTools.FarmSizeEngine || !AfroTools.FarmSizeData) return;
  const data = AfroTools.FarmSizeData;
  const labels = {hectare:'Hektari (ha)',acre:'Ekari',sqm:'Mita za mraba (m²)',sqkm:'Kilomita za mraba (km²)',sqft:'Futi za mraba (ft²)',are:'Ari',
    plot_ng_standard:'Ploti ya mfano, Nigeria (648 m²)',plot_ng_450:'Ploti ya mfano, Nigeria (450 m²)',plot_ng_460:'Ploti ya mfano, Nigeria (460 m²)',plot_ng_930:'Ploti ya mfano, Nigeria (930 m²)',
    feddan:'Feddan',kirat:'Kirat (Misri)',sahm:'Sahm (Misri)',qasaba:'Qasaba ya mraba',morgen:'Morgen',timad:'Timad',tseri:'Tseri',gasha:'Gasha',kert:'Kert',
    arpent:'Arpent',perche_sq:'Perche ya mraba',rope_gh:'Rope (Ghana)',polo_gh:'Polo (Ghana)',corde_sn:'Corde (Senegal)',
    football_pitch:'Uwanja wa mpira wa miguu',tennis_court:'Uwanja wa tenisi',basketball_court:'Uwanja wa mpira wa kikapu'};
  const amount=get('land-amount'), from=get('land-from'), to=get('land-to'), panel=get('land-result'), status=get('land-status');
  const fmt = new Intl.NumberFormat('sw',{maximumSignificantDigits:10});
  let report;
  const optionLabel = key => labels[key] || data.units[key].name;
  for (const key of Object.keys(data.units)) {
    from.add(new Option(optionLabel(key),key,key==='hectare',key==='hectare'));
    to.add(new Option(optionLabel(key),key,key==='acre',key==='acre'));
  }
  function clear() { report=null;panel.hidden=true;status.textContent=''; }
  function convert() {
    clear();
    if (!amount.value.trim() || !form.reportValidity()) return;
    const input={amount:amount.valueAsNumber,fromKey:from.value,toKey:to.value};
    const result=AfroTools.FarmSizeEngine.calculate(input,data);
    if (!result.ok || !Number.isFinite(result.result) || !Number.isFinite(result.squareMetres)) {
      status.textContent='Angalia ukubwa wa eneo na vipimo ulivyochagua.';return;
    }
    get('land-value').textContent=fmt.format(input.amount)+' '+optionLabel(from.value)+' = '+fmt.format(result.result)+' '+optionLabel(to.value);
    get('land-factor').textContent='Kwa hesabu hii: 1 '+optionLabel(from.value)+' = '+fmt.format(result.fromUnit.sqm)+' m²; 1 '+optionLabel(to.value)+' = '+fmt.format(result.toUnit.sqm)+' m².';
    get('land-note').textContent='Eneo lote: '+fmt.format(result.squareMetres)+' m².';
    panel.hidden=false;status.textContent='Hesabu imekamilika.';
    report={schemaVersion:1,tool:'farm-size-converter',locale:'sw',input,result,source:'data/agriculture/farm-size-data.json',generatedAt:new Date().toISOString(),privacy:'local-only'};
  }
  form.addEventListener('submit',e=>{e.preventDefault();convert();});
  form.addEventListener('input',clear);
  form.addEventListener('change',clear);
  form.addEventListener('reset',()=>setTimeout(clear,0));
  get('land-swap').addEventListener('click',()=>{const value=from.value;from.value=to.value;to.value=value;convert();});
  get('land-import').addEventListener('change',async e=>{
    clear();
    try {
      const file=e.target.files[0];if(!file)return;
      const saved=JSON.parse(await file.text()),input=saved.input;
      if(saved.tool!=='farm-size-converter'||saved.locale!=='sw'||!input||!Object.hasOwn(data.units,input.fromKey)||!Object.hasOwn(data.units,input.toKey)||typeof input.amount!=='number'||!Number.isFinite(input.amount)||input.amount<0)throw Error();
      amount.value=input.amount;from.value=input.fromKey;to.value=input.toKey;convert();
    } catch {status.textContent='Faili hii haina ingizo halali la kigeuzi cha shamba.';}
    e.target.value='';
  });
  panel.addEventListener('click',async e=>{
    const type=e.target.dataset.file;if(!type||!report)return;
    const text=['Kigeuzi cha ukubwa wa shamba',get('land-value').textContent,get('land-factor').textContent,get('land-note').textContent].join('\n');
    if(type==='copy'){try{await navigator.clipboard.writeText(text);status.textContent='Matokeo yamenakiliwa.';}catch{status.textContent='Nakili maandishi ya matokeo au pakua TXT.';}return;}
    if(type==='pdf'){if(!window.jspdf){status.textContent='PDF haipatikani. Unaweza kupakua TXT.';return;}const pdf=new window.jspdf.jsPDF();pdf.text(pdf.splitTextToSize(text,175),15,20);pdf.save('eneo-la-shamba.pdf');return;}
    const csv='kiasi,kipimo_cha_awali,matokeo,kipimo_cha_matokeo,eneo_m2\r\n'+[report.input.amount,report.input.fromKey,report.result.result,report.input.toKey,report.result.squareMetres].join(',');
    const content=type==='json'?JSON.stringify(report,null,2):type==='csv'?csv:text;
    const url=URL.createObjectURL(new Blob([content],{type:{json:'application/json',txt:'text/plain',csv:'text/csv'}[type]}));
    const a=document.createElement('a');a.href=url;a.download='eneo-la-shamba.'+type;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  });
  form.querySelector('[type=submit]').disabled=false;
})();
