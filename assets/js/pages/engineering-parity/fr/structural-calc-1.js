var MATERIAL_COSTS={
  NGN:{concrete:85000,rebar:950,symbol:'\u20a6',name:'Nigeria'},
  KES:{concrete:15000,rebar:180,symbol:'KSh',name:'Kenya'},
  GHS:{concrete:1400,rebar:18,symbol:'GH\u20b5',name:'Ghana'},
  ZAR:{concrete:3000,rebar:22,symbol:'R',name:'Afrique du Sud'},
  TZS:{concrete:300000,rebar:4000,symbol:'TSh',name:'Tanzanie'},
  UGX:{concrete:380000,rebar:5200,symbol:'USh',name:'Ouganda'},
  ETB:{concrete:7000,rebar:90,symbol:'Br',name:'Éthiopie'},
  USD:{concrete:120,rebar:0.90,symbol:'$',name:'USD'}
};
function matCost(concreteM3,rebarKg,note){
  var cur=document.getElementById('sc-currency').value;
  var c=MATERIAL_COSTS[cur];
  var concCost=concreteM3*c.concrete;
  var rebarCost=rebarKg*c.rebar;
  var total=concCost+rebarCost;
  var fmt=function(n){return c.symbol+Math.round(n).toLocaleString();};
  return '<div class="cost-box"><strong>💰 Estimatif Matériau Coût — '+c.name+'</strong><br>'
    +'Béton ('+concreteM3.toFixed(2)+' m\u00b3): '+fmt(concCost)+'<br>'
    +'Rebar (~'+Math.round(rebarKg)+' kg): '+fmt(rebarCost)+'<br>'
    +'<strong>Total: '+fmt(total)+'</strong>'+(note?'<br><em>'+note+'</em>':'')+'<br>'
    +'<span style="font-size:.78rem;color:#92400e">Sélectionnez une option.</span></div>';
}

function switchTab(tab, trigger){
  document.querySelectorAll('.calc-section').forEach(s=>s.classList.remove('active'));
  document.querySelectorAll('.tab').forEach(t=>t.classList.remove('active'));
  document.getElementById('sec-'+tab).classList.add('active');
  (trigger || document.querySelector('.tab')).classList.add('active');
}

function calcBeam(){
  const L=parseFloat(document.getElementById('b-span').value);
  const w=parseFloat(document.getElementById('b-udl').value);
  const fcu=parseFloat(document.getElementById('b-fcu').value);
  const fy=parseFloat(document.getElementById('b-fy').value);
  const b=parseFloat(document.getElementById('b-width').value);
  const cover=parseFloat(document.getElementById('b-cover').value);

  // Ultimate moment (simply supported, UDL)
  const M=w*L*L/8; // kNm
  const V=w*L/2; // kN (max shear)

  // Effective depth estimation: span/12 for simply supported
  const dMin=Math.ceil(L*1000/12);
  const hMin=dMin+cover+10+8; // cover + bar radius + link
  const h=Math.ceil(hMin/25)*25; // round up to 25mm
  const d=h-cover-8-10; // effective depth

  // K factor
  const K=M*1e6/(fcu*b*d*d);
  const Klim=0.156;
  const compression=K>Klim;
  const Kuse=Math.min(K,Klim);

  // Lever arm
  const z=Math.min(d*(0.5+Math.sqrt(0.25-Kuse/0.9)),0.95*d);

  // Steel area required
  const As=M*1e6/(0.87*fy*z);

  // Select bars
  const bars=[{d:12,a:113},{d:16,a:201},{d:20,a:314},{d:25,a:491},{d:32,a:804}];
  let barChoice='';
  for(const bar of bars){
    const n=Math.ceil(As/bar.a);
    if(n<=6){barChoice=`${n}Y${bar.d} (${(n*bar.a).toFixed(0)} mm2)`;break;}
  }
  if(!barChoice) barChoice='Requires larger section';

  // Min steel
  const AsMin=0.13*b*h/100;

  document.getElementById('beam-summary').innerHTML=`
    <div class="result-card highlight"><div class="result-label">Dimensions de la poutre</div><div class="result-value">${b} x ${h}<span class="result-unit"> mm</span></div></div>
    <div class="result-card"><div class="result-label">Ultimate Moment</div><div class="result-value">${M.toFixed(1)}<span class="result-unit"> kNm</span></div></div>
    <div class="result-card"><div class="result-label">Max Shear</div><div class="result-value">${V.toFixed(1)}<span class="result-unit"> kN</span></div></div>
    <div class="result-card highlight"><div class="result-label">Main Acier</div><div class="result-value">${As.toFixed(0)}<span class="result-unit"> mm2</span></div></div>
  `;

  document.getElementById('beam-table').innerHTML=`
    <thead><tr><th>Parameter</th><th>Value</th></tr></thead>
    <tbody>
    <tr><td>Effective Profondeur (d)</td><td>${d} mm</td></tr>
    <tr><td>K factor</td><td>${K.toFixed(4)} ${compression?'> 0.156 (COMPRESSION Acier nécessaires)':''}</td></tr>
    <tr><td>Lever arm (z)</td><td>${z.toFixed(1)} mm</td></tr>
    <tr><td>Section d’acier requise</td><td>${As.toFixed(0)} mm2</td></tr>
    <tr><td>Min As (0.13%bh)</td><td>${AsMin.toFixed(0)} mm2</td></tr>
    <tr><td>Armatures proposées (nappe inférieure)</td><td>${barChoice}</td></tr>
    <tr><td>Links</td><td>R8 @ ${Math.min(Math.floor(0.75*d),300)} mm c/c</td></tr>
    </tbody>`;
  document.getElementById('beam-results').style.display='block';
  var beamConc=(b/1000)*(h/1000)*L;
  var beamRebar=As*1e-6*L*7850*1.3;
  document.getElementById('beam-cost').innerHTML=matCost(beamConc,beamRebar,'Par élément de poutre (section × portée)');
}

function calcColumn(){
  const N=parseFloat(document.getElementById('c-load').value);
  const fcu=parseFloat(document.getElementById('c-fcu').value);
  const fy=parseFloat(document.getElementById('c-fy').value);
  const shape=document.getElementById('c-shape').value;
  const pSteel=parseFloat(document.getElementById('c-steel').value)/100;

  // BS 8110: N = 0.4*fcu*Ac + 0.8*fy*Asc (short braced, axial)
  // Ac = Ag - Asc, Asc = p*Ag
  // N = 0.4*fcu*(Ag - p*Ag) + 0.8*fy*p*Ag
  // N = Ag*(0.4*fcu*(1-p) + 0.8*fy*p)
  const Ag=N*1000/(0.4*fcu*(1-pSteel)+0.8*fy*pSteel);

  let dim,dimLabel;
  if(shape==='square'){
    dim=Math.ceil(Math.sqrt(Ag)/25)*25;
    dimLabel=dim+'x'+dim+' mm';
  } else {
    dim=Math.ceil(2*Math.sqrt(Ag/Math.PI)/25)*25;
    dimLabel=dim+' mm diameter';
  }

  const actualAg=shape==='square'?dim*dim:Math.PI*dim*dim/4;
  const Asc=Math.round(pSteel*actualAg);

  const bars=[{d:12,a:113},{d:16,a:201},{d:20,a:314},{d:25,a:491},{d:32,a:804}];
  let barChoice='';
  for(const bar of bars){
    const n=Math.ceil(Asc/bar.a);
    if(n>=4&&n<=8){barChoice=`${n}Y${bar.d} (${(n*bar.a).toFixed(0)} mm2)`;break;}
  }
  if(!barChoice){
    for(const bar of bars){
      const n=Math.ceil(Asc/bar.a);
      if(n>=4){barChoice=`${n}Y${bar.d} (${(n*bar.a).toFixed(0)} mm2)`;break;}
    }
  }

  document.getElementById('col-summary').innerHTML=`
    <div class="result-card highlight"><div class="result-label">Column Diamètre</div><div class="result-value">${dimLabel}</div></div>
    <div class="result-card"><div class="result-label">Req. Gross Surface</div><div class="result-value">${Math.round(Ag).toLocaleString()}<span class="result-unit"> mm2</span></div></div>
    <div class="result-card"><div class="result-label">Acier Surface</div><div class="result-value">${Asc.toLocaleString()}<span class="result-unit"> mm2</span></div></div>
    <div class="result-card highlight"><div class="result-label">Bars</div><div class="result-value" style="font-size:1rem">${barChoice}</div></div>
  `;

  document.getElementById('col-table').innerHTML=`
    <thead><tr><th>Parameter</th><th>Value</th></tr></thead>
    <tbody>
    <tr><td>Charger</td><td>${N} kN</td></tr>
    <tr><td>Béton grade</td><td>C${fcu}</td></tr>
    <tr><td>Acier percentage</td><td>${(pSteel*100).toFixed(1)}%</td></tr>
    <tr><td>Actual Ag</td><td>${Math.round(actualAg).toLocaleString()} mm2</td></tr>
    <tr><td>Links</td><td>R8 @ ${Math.min(Math.floor(12*16),300)} mm c/c</td></tr>
    <tr><td>Capacity check</td><td>${(0.4*fcu*(actualAg-Asc)/1000+0.8*fy*Asc/1000).toFixed(0)} kN ${(0.4*fcu*(actualAg-Asc)/1000+0.8*fy*Asc/1000)>=N?'> '+N+' OK':'< '+N+' INCREASE Diamètre'}</td></tr>
    </tbody>`;
  document.getElementById('col-results').style.display='block';
  var colH=3.0;
  var colConc=(actualAg/1e6)*colH;
  var colRebar=Asc*1e-6*colH*7850*1.15;
  document.getElementById('col-cost').innerHTML=matCost(colConc,colRebar,'Calcul fondé sur 3 m storey Hauteur. Adjust for actual Hauteur.');
}

function calcSlab(){
  const L=parseFloat(document.getElementById('s-span').value);
  const qk=parseFloat(document.getElementById('s-live').value);
  const fcu=parseFloat(document.getElementById('s-fcu').value);
  const finish=parseFloat(document.getElementById('s-finish').value);

  // Min thickness: span/20 for simply supported, span/26 for continuous
  const hMin=Math.ceil(L*1000/26/25)*25;
  const h=Math.max(hMin,125);
  const cover=20;
  const d=h-cover-6; // 12mm bar, half

  // Self weight
  const sw=h/1000*24; // kN/m2
  const gk=sw+finish;

  // Ultimate load per m width
  const n=1.4*gk+1.6*qk;
  const M=n*L*L/8; // kNm per m width

  // Steel calculation (per m width, b=1000)
  const K=M*1e6/(fcu*1000*d*d);
  const z=Math.min(d*(0.5+Math.sqrt(0.25-K/0.9)),0.95*d);
  const As=M*1e6/(0.87*460*z);
  const AsMin=0.13*1000*h/100;
  const AsDesign=Math.max(As,AsMin);

  // Bar spacing
  const bars=[{d:10,a:78.5},{d:12,a:113},{d:16,a:201}];
  let barChoice='';
  for(const bar of bars){
    const spacing=Math.floor(bar.a*1000/AsDesign/25)*25;
    if(spacing>=100&&spacing<=300){barChoice=`Y${bar.d} @ ${spacing} mm c/c (${Math.round(bar.a*1000/spacing)} mm2/m)`;break;}
  }
  if(!barChoice) barChoice='Y12 @ 150 mm c/c';

  document.getElementById('slab-summary').innerHTML=`
    <div class="result-card highlight"><div class="result-label">Slab Thickness</div><div class="result-value">${h}<span class="result-unit"> mm</span></div></div>
    <div class="result-card"><div class="result-label">Charger</div><div class="result-value">${n.toFixed(1)}<span class="result-unit"> kN/m2</span></div></div>
    <div class="result-card"><div class="result-label">Moment</div><div class="result-value">${M.toFixed(1)}<span class="result-unit"> kNm/m</span></div></div>
    <div class="result-card highlight"><div class="result-label">Main Acier</div><div class="result-value" style="font-size:1rem">${barChoice}</div></div>
  `;

  document.getElementById('slab-table').innerHTML=`
    <thead><tr><th>Parameter</th><th>Value</th></tr></thead>
    <tbody>
    <tr><td>Self weight</td><td>${sw.toFixed(1)} kN/m2</td></tr>
    <tr><td>Total dead load (gk)</td><td>${gk.toFixed(1)} kN/m2</td></tr>
    <tr><td>Live load (qk)</td><td>${qk} kN/m2</td></tr>
    <tr><td>Effective Profondeur</td><td>${d} mm</td></tr>
    <tr><td>Section d’acier requise</td><td>${Math.round(AsDesign)} mm2/m</td></tr>
    <tr><td>Min As (0.13%)</td><td>${Math.round(AsMin)} mm2/m</td></tr>
    <tr><td>Distribution Acier</td><td>Y10 @ 300 mm c/c (min)</td></tr>
    </tbody>`;
  document.getElementById('slab-results').style.display='block';
  var slabConcPerM2=h/1000;
  var slabRebarPerM2=AsDesign*1e-6*7850*1.5;
  document.getElementById('slab-cost').innerHTML=matCost(slabConcPerM2,slabRebarPerM2,'Coût per m² of slab — multiply by total Plancher Surface');
}

function calcFooting(){
  const N=parseFloat(document.getElementById('f-load').value);
  const sbc=parseFloat(document.getElementById('f-sbc').value);
  const fcu=parseFloat(document.getElementById('f-fcu').value);
  const colSize=parseFloat(document.getElementById('f-colsize').value);

  // Service load area
  const swFactor=1.1; // 10% for self weight
  const areaReq=N*swFactor/sbc;
  const side=Math.ceil(Math.sqrt(areaReq)*1000/50)*50; // mm, round to 50mm
  const sideM=side/1000;
  const actualArea=sideM*sideM;

  // Soil pressure (ultimate)
  const Nu=1.4*N; // factored (conservative)
  const qu=Nu/actualArea;

  // Punching shear check
  const d=Math.max(150,Math.ceil((side-colSize)/4/25)*25); // approx effective depth
  const h=d+50+12; // cover + bar

  // Bending moment at face of column
  const cantilever=(side-colSize)/2/1000;
  const M=qu*sideM*cantilever*cantilever/2;

  // Steel area
  const As=M*1e6/(0.87*460*0.95*d);
  const AsMin=0.13*1000*h/100;
  const AsDesign=Math.max(As,AsMin);

  const bars=[{d:12,a:113},{d:16,a:201},{d:20,a:314}];
  let barChoice='';
  for(const bar of bars){
    const spacing=Math.floor(bar.a*1000/AsDesign/25)*25;
    if(spacing>=100&&spacing<=300){barChoice=`Y${bar.d} @ ${spacing} mm c/c both ways`;break;}
  }
  if(!barChoice) barChoice='Y16 @ 150 mm c/c both ways';

  document.getElementById('foot-summary').innerHTML=`
    <div class="result-card highlight"><div class="result-label">Footing Diamètre</div><div class="result-value">${side}x${side}<span class="result-unit"> mm</span></div></div>
    <div class="result-card"><div class="result-label">Profondeur</div><div class="result-value">${Math.ceil(h/25)*25}<span class="result-unit"> mm</span></div></div>
    <div class="result-card"><div class="result-label">Soil Pressure</div><div class="result-value">${(N*swFactor/actualArea).toFixed(0)}<span class="result-unit"> kN/m2</span></div></div>
    <div class="result-card highlight"><div class="result-label">Reinforcement</div><div class="result-value" style="font-size:.9rem">${barChoice}</div></div>
  `;

  document.getElementById('foot-table').innerHTML=`
    <thead><tr><th>Parameter</th><th>Value</th></tr></thead>
    <tbody>
    <tr><td>Charger</td><td>${N} kN</td></tr>
    <tr><td>Bearing capacity</td><td>${sbc} kN/m2</td></tr>
    <tr><td>Required Surface</td><td>${areaReq.toFixed(2)} m2</td></tr>
    <tr><td>Provided Surface</td><td>${actualArea.toFixed(2)} m2</td></tr>
    <tr><td>Cantilever Longueur</td><td>${(cantilever*1000).toFixed(0)} mm</td></tr>
    <tr><td>Béton volume</td><td>${(actualArea*Math.ceil(h/25)*25/1000).toFixed(2)} m3</td></tr>
    </tbody>`;
  document.getElementById('foot-results').style.display='block';
  var footDepth=Math.ceil(h/25)*25/1000;
  var footConc=actualArea*footDepth;
  var footRebar=AsDesign*1e-6*sideM*7850*2*1.1;
  document.getElementById('foot-cost').innerHTML=matCost(footConc,footRebar,'Per footing pad');
}
