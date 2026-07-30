const APPLIANCES=[
  {name:'LED Lights (per bulb)',watts:10,surge:1,cat:'Lighting'},
  {name:'Ceiling Fan',watts:75,surge:1.5,cat:'Cooling'},
  {name:'Standing Fan',watts:60,surge:1.5,cat:'Cooling'},
  {name:'Television (LED/LCD)',watts:100,surge:1,cat:'Electronics'},
  {name:'Satellite Decoder (DSTV/GOtv)',watts:30,surge:1,cat:'Electronics'},
  {name:'Phone Charger',watts:10,surge:1,cat:'Electronics'},
  {name:'Laptop',watts:65,surge:1,cat:'Electronics'},
  {name:'Desktop Computer + Monitor',watts:300,surge:1.2,cat:'Electronics'},
  {name:'Refrigerator (Small)',watts:150,surge:3,cat:'Kitchen'},
  {name:'Refrigerator (Large/Double Door)',watts:300,surge:3,cat:'Kitchen'},
  {name:'Chest Freezer',watts:200,surge:3,cat:'Kitchen'},
  {name:'Microwave Oven',watts:1000,surge:1,cat:'Kitchen'},
  {name:'Electric Kettle',watts:1500,surge:1,cat:'Kitchen'},
  {name:'Blender',watts:400,surge:2,cat:'Kitchen'},
  {name:'Toaster',watts:800,surge:1,cat:'Kitchen'},
  {name:'Iron (Pressing Iron)',watts:1200,surge:1,cat:'Household'},
  {name:'Washing Machine',watts:500,surge:2.5,cat:'Household'},
  {name:'Water Pump (0.5 HP)',watts:375,surge:3,cat:'Household'},
  {name:'Water Pump (1 HP)',watts:750,surge:3,cat:'Household'},
  {name:'Air Conditioner (1 HP)',watts:1000,surge:3,cat:'Cooling'},
  {name:'Air Conditioner (1.5 HP)',watts:1500,surge:3,cat:'Cooling'},
  {name:'Air Conditioner (2 HP)',watts:2000,surge:3,cat:'Cooling'},
  {name:'Water Heater (Instant)',watts:3000,surge:1,cat:'Household'},
  {name:'Security Lights (Halogen)',watts:150,surge:1,cat:'Lighting'},
  {name:'WiFi Router',watts:15,surge:1,cat:'Electronics'},
  {name:'CCTV System',watts:50,surge:1,cat:'Electronics'},
  {name:'Printer',watts:50,surge:1.5,cat:'Electronics'},
  {name:'Hair Dryer',watts:1500,surge:1,cat:'Personal'},
  {name:'Electric Cooker/Hotplate',watts:2000,surge:1,cat:'Kitchen'},
  {name:'Sound System',watts:200,surge:1.5,cat:'Electronics'}
];

let selectedAppliances=[];
let lastGeneratorSizingResult=null;

function init(){
  // Default appliances for a typical Nigerian home
  const defaults=['LED Lights (per bulb)','Ceiling Fan','Television (LED/LCD)','Satellite Decoder (DSTV/GOtv)','Refrigerator (Small)','Phone Charger','WiFi Router'];
  const defaultQtys=[6,3,1,1,1,3,1];
  defaults.forEach((name,i)=>{
    const app=APPLIANCES.find(a=>a.name===name);
    if(app)selectedAppliances.push({...app,qty:defaultQtys[i]});
  });
  renderList();

  // Populate preset dropdown
  const sel=document.getElementById('presetAppliance');
  let lastCat='';
  APPLIANCES.forEach(a=>{
    if(a.cat!==lastCat){
      const og=document.createElement('optgroup');
      og.label=a.cat;
      sel.appendChild(og);
      lastCat=a.cat;
    }
    const opt=document.createElement('option');
    opt.value=a.name;
    opt.textContent=`${a.name} (${a.watts}W)`;
    sel.lastElementChild.appendChild(opt);
  });
}

function renderList(){
  const list=document.getElementById('applianceList');
  list.innerHTML='<div class="appliance-row" style="border-bottom:2px solid #e2e8f0"><span class="app-name" style="font-size:.68rem;color:#64748b;font-weight:700">APPLIANCE</span><span class="app-watts" style="font-size:.68rem;color:#64748b;font-weight:700">WATTS</span><span style="font-size:.68rem;color:#64748b;font-weight:700;text-align:center">QTY</span><span></span></div>';
  selectedAppliances.forEach((a,i)=>{
    const row=document.createElement('div');
    row.className='appliance-row';
    row.innerHTML=`<span class="app-name">${a.name}</span><span class="app-watts">${a.watts}W</span><input aria-label="App qty" type="number" class="app-qty" value="${a.qty}" min="0" max="50" onchange="updateQty(${i},this.value)"><button type="button" class="app-remove" onclick="removeApp(${i})">&times;</button>`;
    list.appendChild(row);
  });
}

function updateQty(i,val){selectedAppliances[i].qty=parseInt(val)||0}
function removeApp(i){selectedAppliances.splice(i,1);renderList()}

function showAddForm(){document.getElementById('addForm').style.display=document.getElementById('addForm').style.display==='none'?'block':'none'}

function addPreset(){
  const name=document.getElementById('presetAppliance').value;
  if(!name)return;
  const app=APPLIANCES.find(a=>a.name===name);
  if(app){
    const existing=selectedAppliances.findIndex(a=>a.name===name);
    if(existing>=0)selectedAppliances[existing].qty++;
    else selectedAppliances.push({...app,qty:1});
    renderList();
  }
  document.getElementById('presetAppliance').value='';
}

function addCustom(){
  const name=document.getElementById('customName').value.trim();
  const watts=parseInt(document.getElementById('customWatts').value);
  if(!name||!watts){alert('Please enter appliance name and watts.');return}
  selectedAppliances.push({name,watts,surge:1.5,qty:1});
  renderList();
  document.getElementById('customName').value='';
  document.getElementById('customWatts').value='';
}

function calculate(){
  let totalRunning=0;
  let maxSurge=0;

  selectedAppliances.forEach(a=>{
    const running=a.watts*a.qty;
    totalRunning+=running;
    const surge=a.watts*(a.surge-1)*a.qty;
    if(surge>maxSurge)maxSurge=surge; // worst single surge
  });

  const totalStartup=totalRunning+maxSurge;
  const pf=0.8;
  const kvaRunning=totalRunning/(pf*1000);
  const kvaStartup=totalStartup/(pf*1000);

  // Recommend with 25% headroom
  const recommendedKVA=kvaStartup*1.25;

  // Round to standard generator sizes
  const stdSizes=[1,2.5,3.5,5,6.5,7.5,10,12.5,15,20,25,30,40,50,60,80,100,150,200,250,350,500];
  const bestSize=stdSizes.find(s=>s>=recommendedKVA)||stdSizes[stdSizes.length-1];
  lastGeneratorSizingResult={runningWatts:totalRunning,startupWatts:totalStartup,powerFactor:pf,recommendedKVA:bestSize,headroomPercent:totalRunning?((bestSize*pf*1000/totalRunning-1)*100):0,appliances:selectedAppliances.filter(a=>a.qty>0).map(a=>({name:a.name,watts:a.watts,qty:a.qty,surge:a.surge,runningWatts:a.watts*a.qty}))};

  document.getElementById('rRunning').textContent=(totalRunning/1000).toFixed(1)+' kW';
  document.getElementById('rStartup').textContent=(totalStartup/1000).toFixed(1)+' kW';
  document.getElementById('rKVA').textContent=bestSize+' KVA';
  document.getElementById('rPF').textContent=pf;

  let recMsg=`Based on your ${selectedAppliances.reduce((s,a)=>s+a.qty,0)} appliances totalling <strong>${(totalRunning/1000).toFixed(1)} kW</strong> running load, with startup surge of <strong>${(totalStartup/1000).toFixed(1)} kW</strong>, we recommend a <strong>${bestSize} KVA</strong> generator. `;
  recMsg+=`This provides ${((bestSize*pf*1000/totalRunning-1)*100).toFixed(0)}% headroom above your running load for efficiency and longevity. `;
  if(bestSize<=3.5)recMsg+='A petrol inverter generator would work well for this load.';
  else if(bestSize<=10)recMsg+='Consider a quality petrol generator (Sumec Firman, Honda) or a small diesel unit for fuel economy.';
  else recMsg+='A diesel generator is recommended for loads this size. Consider Mikano, Perkins, or FG Wilson for Nigerian use.';

  document.getElementById('recommendation').innerHTML=recMsg;
  document.getElementById('results').style.display='block';
  var workflow=document.getElementById('generatorSizingWorkflowResult');
  if(workflow)workflow.textContent='Recommended '+bestSize+' KVA for '+(totalRunning/1000).toFixed(1)+' kW running load and '+(totalStartup/1000).toFixed(1)+' kW startup load.';
  var status=document.getElementById('generatorSizingStatus');
  if(status)status.textContent='Sizing ready. Copy the load schedule or download CSV before requesting quotes.';
  document.getElementById('results').scrollIntoView({behavior:'smooth',block:'start'});
}
function generatorSizingSummary(){
  if(!lastGeneratorSizingResult){calculate();}
  var r=lastGeneratorSizingResult;
  var applianceList=r.appliances.map(function(a){return a.name+' x'+a.qty+' ('+a.runningWatts+'W running)';}).join('; ');
  return 'Generator sizing estimate: running load '+(r.runningWatts/1000).toFixed(1)+' kW, startup load '+(r.startupWatts/1000).toFixed(1)+' kW, recommended generator '+r.recommendedKVA+' KVA at power factor '+r.powerFactor+', headroom '+r.headroomPercent.toFixed(0)+'%. Appliances: '+applianceList+'. Verify surge ratings, phase, wiring, earthing, ventilation, transfer switch, and carbon-monoxide safety with a qualified technician.';
}
function copyGeneratorSizingSummary(){
  var text=generatorSizingSummary();
  if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(text).then(function(){document.getElementById('generatorSizingStatus').textContent='Load schedule copied.';});}
  else document.getElementById('generatorSizingStatus').textContent=text;
}
function downloadGeneratorSizingCsv(){
  if(!lastGeneratorSizingResult){calculate();}
  var r=lastGeneratorSizingResult;
  var rows=[['appliance','qty','watts_each','running_watts','surge_multiplier']];
  r.appliances.forEach(function(a){rows.push([a.name,a.qty,a.watts,a.runningWatts,a.surge]);});
  rows.push([]);
  rows.push(['metric','value']);
  rows.push(['running_watts',r.runningWatts]);
  rows.push(['startup_watts',r.startupWatts]);
  rows.push(['recommended_kva',r.recommendedKVA]);
  rows.push(['power_factor',r.powerFactor]);
  rows.push(['headroom_percent',r.headroomPercent.toFixed(0)]);
  var csv=rows.map(function(row){return row.map(function(cell){return '"'+String(cell||'').replace(/"/g,'""')+'"';}).join(',');}).join('\n');
  var blob=new Blob([csv],{type:'text/csv'});
  var a=document.createElement('a');
  a.href=URL.createObjectURL(blob);
  a.download='afrotools-generator-sizing-load-schedule.csv';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(a.href);
  document.getElementById('generatorSizingStatus').textContent='CSV downloaded. Confirm final sizing with a technician.';
}

document.querySelectorAll('#generatorSizingCsvBtn,.generator-sizing-csv-action').forEach(function(btn){
  btn.addEventListener('click',downloadGeneratorSizingCsv);
});

window.addEventListener('DOMContentLoaded',init);
