const COSTS={
  ng:{cur:'₦',drillingPerM:{soft:8000,medium:12000,hard:18000},casing:3000,screen:4000,gravel:2000,
    pump:{submersible:250000,solar:500000,hand:150000,none:0},
    tank:{0:0,1000:80000,2000:120000,5000:250000,10000:450000},
    survey:80000,mobilization:100000,development:50000,plumbing:80000,waterTest:20000},
  ke:{cur:'KSh ',drillingPerM:{soft:2500,medium:4000,hard:6000},casing:1000,screen:1200,gravel:600,
    pump:{submersible:80000,solar:180000,hand:50000,none:0},
    tank:{0:0,1000:25000,2000:40000,5000:80000,10000:150000},
    survey:25000,mobilization:35000,development:15000,plumbing:25000,waterTest:5000},
  za:{cur:'R ',drillingPerM:{soft:400,medium:650,hard:1000},casing:200,screen:250,gravel:100,
    pump:{submersible:15000,solar:35000,hand:8000,none:0},
    tank:{0:0,1000:3000,2000:5000,5000:10000,10000:18000},
    survey:5000,mobilization:8000,development:3000,plumbing:5000,waterTest:2000},
  gh:{cur:'GH₵',drillingPerM:{soft:200,medium:350,hard:500},casing:80,screen:100,gravel:50,
    pump:{submersible:8000,solar:18000,hand:5000,none:0},
    tank:{0:0,1000:2000,2000:3500,5000:7000,10000:12000},
    survey:2000,mobilization:3000,development:1500,plumbing:2500,waterTest:500},
  tz:{cur:'TSh',drillingPerM:{soft:300000,medium:500000,hard:750000},casing:80000,screen:100000,gravel:40000,
    pump:{submersible:3500000,solar:8000000,hand:2000000,none:0},
    tank:{0:0,1000:1200000,2000:2000000,5000:4000000,10000:7500000},
    survey:1500000,mobilization:2500000,development:800000,plumbing:1500000,waterTest:400000},
  ug:{cur:'USh',drillingPerM:{soft:900000,medium:1500000,hard:2200000},casing:250000,screen:300000,gravel:120000,
    pump:{submersible:8000000,solar:20000000,hand:5000000,none:0},
    tank:{0:0,1000:3500000,2000:5500000,5000:11000000,10000:20000000},
    survey:4000000,mobilization:6000000,development:2000000,plumbing:3500000,waterTest:1000000}
};

function estimate(){
  const c=document.getElementById('country').value;
  const depth=+document.getElementById('depth').value;
  const geo=document.getElementById('geology').value;
  const pumpType=document.getElementById('pump').value;
  const tankSize=+document.getElementById('tank').value;
  const data=COSTS[c];
  const cur=data.cur;
  const fmt=n=>cur+Math.round(n).toLocaleString('en');

  const drilling=depth*data.drillingPerM[geo];
  const casing=depth*data.casing;
  const screen=(depth*0.3)*data.screen; // ~30% of depth is screen
  const gravel=depth*data.gravel*0.5;
  const pump=data.pump[pumpType];
  const tank=data.tank[tankSize]||0;
  const survey=data.survey;
  const mobilization=data.mobilization;
  const development=data.development;
  const plumbing=pumpType!=='none'?data.plumbing:0;
  const waterTest=data.waterTest;

  const total=drilling+casing+screen+gravel+pump+tank+survey+mobilization+development+plumbing+waterTest;

  let html='';
  html+=`<div class="result-box highlight"><div class="num">${fmt(total)}</div><div class="lbl">Total estimé Coût</div></div>`;
  html+=`<div class="result-box"><div class="num">${depth}m</div><div class="lbl">Drilling Profondeur</div></div>`;
  html+=`<div class="result-box"><div class="num">${fmt(drilling)}</div><div class="lbl">Informations et hypothèses du calcul</div></div>`;
  html+=`<div class="result-box"><div class="num">${fmt(data.drillingPerM[geo])}/m</div><div class="lbl">Coût per Metre</div></div>`;
  document.getElementById('resultGrid').innerHTML=html;

  let tbl='<tr><th>Poste</th><th>Coût</th></tr>';
  tbl+=`<tr><td>Hydrogeological Survey</td><td>${fmt(survey)}</td></tr>`;
  tbl+=`<tr><td>Mobilization / Chantier Prep</td><td>${fmt(mobilization)}</td></tr>`;
  tbl+=`<tr><td>Drilling (${depth}m x ${fmt(data.drillingPerM[geo])}/m)</td><td>${fmt(drilling)}</td></tr>`;
  tbl+=`<tr><td>Casing & Lining</td><td>${fmt(casing)}</td></tr>`;
  tbl+=`<tr><td>Screen & Filter</td><td>${fmt(screen)}</td></tr>`;
  tbl+=`<tr><td>Gravier Pack</td><td>${fmt(gravel)}</td></tr>`;
  tbl+=`<tr><td>Well Development & Test Pumping</td><td>${fmt(development)}</td></tr>`;
  if(pump>0)tbl+=`<tr><td>Pump (${pumpType})</td><td>${fmt(pump)}</td></tr>`;
  if(plumbing>0)tbl+=`<tr><td>Plomberie & Installation</td><td>${fmt(plumbing)}</td></tr>`;
  if(tank>0)tbl+=`<tr><td>Eau Réservoir (${tankSize}L)</td><td>${fmt(tank)}</td></tr>`;
  tbl+=`<tr><td>Eau qualité Test</td><td>${fmt(waterTest)}</td></tr>`;
  tbl+=`<tr class="total"><td>TOTAL Estimer</td><td>${fmt(total)}</td></tr>`;

  document.getElementById('breakdownTable').innerHTML=tbl;
  document.getElementById('resultCard').style.display='block';
  document.getElementById('resultCard').scrollIntoView({behavior:'smooth'});
}
