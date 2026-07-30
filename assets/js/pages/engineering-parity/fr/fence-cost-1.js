// Cost per linear metre by fence type (materials only)
var FC_RATES = {
  NG:{ sym:'₦',
    block_render:{mat:18000,lab:8000}, block_plain:{mat:13000,lab:6000},
    chain_link:{mat:5500,lab:2000}, barbed_wire:{mat:1800,lab:800},
    electric:{mat:9000,lab:4000}, wooden_palisade:{mat:4500,lab:2000},
    metal_palisade:{mat:12000,lab:5000},
    gate_manual_single:120000, gate_manual_double:200000, gate_sliding:650000, gate_boom:450000,
    topping_barbed:900, topping_razor:2500
  },
  KE:{ sym:'KES',
    block_render:{mat:7500,lab:3000}, block_plain:{mat:5500,lab:2200},
    chain_link:{mat:2200,lab:800}, barbed_wire:{mat:700,lab:300},
    electric:{mat:3500,lab:1500}, wooden_palisade:{mat:1800,lab:800},
    metal_palisade:{mat:5000,lab:2000},
    gate_manual_single:50000, gate_manual_double:85000, gate_sliding:280000, gate_boom:200000,
    topping_barbed:350, topping_razor:1000
  },
  ZA:{ sym:'ZAR',
    block_render:{mat:2200,lab:900}, block_plain:{mat:1600,lab:700},
    chain_link:{mat:650,lab:250}, barbed_wire:{mat:200,lab:90},
    electric:{mat:1100,lab:450}, wooden_palisade:{mat:550,lab:230},
    metal_palisade:{mat:1500,lab:600},
    gate_manual_single:15000, gate_manual_double:25000, gate_sliding:80000, gate_boom:55000,
    topping_barbed:100, topping_razor:280
  },
  GH:{ sym:'GHS',
    block_render:{mat:1800,lab:700}, block_plain:{mat:1300,lab:500},
    chain_link:{mat:500,lab:200}, barbed_wire:{mat:160,lab:70},
    electric:{mat:900,lab:350}, wooden_palisade:{mat:450,lab:180},
    metal_palisade:{mat:1200,lab:480},
    gate_manual_single:12000, gate_manual_double:20000, gate_sliding:65000, gate_boom:45000,
    topping_barbed:80, topping_razor:220
  },
  EG:{ sym:'EGP',
    block_render:{mat:2000,lab:800}, block_plain:{mat:1400,lab:550},
    chain_link:{mat:600,lab:220}, barbed_wire:{mat:180,lab:75},
    electric:{mat:950,lab:380}, wooden_palisade:{mat:480,lab:190},
    metal_palisade:{mat:1300,lab:520},
    gate_manual_single:13000, gate_manual_double:22000, gate_sliding:70000, gate_boom:48000,
    topping_barbed:90, topping_razor:240
  },
  ET:{ sym:'ETB',
    block_render:{mat:5000,lab:2000}, block_plain:{mat:3500,lab:1400},
    chain_link:{mat:1500,lab:550}, barbed_wire:{mat:450,lab:180},
    electric:{mat:2400,lab:950}, wooden_palisade:{mat:1200,lab:480},
    metal_palisade:{mat:3200,lab:1280},
    gate_manual_single:32000, gate_manual_double:55000, gate_sliding:175000, gate_boom:120000,
    topping_barbed:220, topping_razor:600
  },
  TZ:{ sym:'TZS',
    block_render:{mat:180000,lab:72000}, block_plain:{mat:130000,lab:52000},
    chain_link:{mat:55000,lab:20000}, barbed_wire:{mat:17000,lab:7000},
    electric:{mat:90000,lab:36000}, wooden_palisade:{mat:45000,lab:18000},
    metal_palisade:{mat:120000,lab:48000},
    gate_manual_single:1200000, gate_manual_double:2000000, gate_sliding:6500000, gate_boom:4500000,
    topping_barbed:8500, topping_razor:23000
  },
  UG:{ sym:'UGX',
    block_render:{mat:240000,lab:96000}, block_plain:{mat:170000,lab:68000},
    chain_link:{mat:72000,lab:26000}, barbed_wire:{mat:22000,lab:9000},
    electric:{mat:115000,lab:46000}, wooden_palisade:{mat:58000,lab:23000},
    metal_palisade:{mat:155000,lab:62000},
    gate_manual_single:1600000, gate_manual_double:2700000, gate_sliding:8500000, gate_boom:6000000,
    topping_barbed:11000, topping_razor:30000
  },
  RW:{ sym:'RWF',
    block_render:{mat:40000,lab:16000}, block_plain:{mat:28000,lab:11000},
    chain_link:{mat:12000,lab:4500}, barbed_wire:{mat:3800,lab:1500},
    electric:{mat:19000,lab:7600}, wooden_palisade:{mat:9600,lab:3800},
    metal_palisade:{mat:26000,lab:10400},
    gate_manual_single:260000, gate_manual_double:450000, gate_sliding:1400000, gate_boom:1000000,
    topping_barbed:1900, topping_razor:5200
  },
  MA:{ sym:'MAD',
    block_render:{mat:1000,lab:400}, block_plain:{mat:700,lab:280},
    chain_link:{mat:300,lab:110}, barbed_wire:{mat:90,lab:38},
    electric:{mat:480,lab:190}, wooden_palisade:{mat:240,lab:96},
    metal_palisade:{mat:640,lab:256},
    gate_manual_single:6500, gate_manual_double:11000, gate_sliding:35000, gate_boom:24000,
    topping_barbed:45, topping_razor:120
  }
};

function fmtCur(sym,n){ return sym + Math.round(n).toLocaleString(); }

function calcFence(){
  var country = document.getElementById('fc-country').value;
  var length = +document.getElementById('fc-length').value;
  var height = +document.getElementById('fc-height').value;
  var ftype = document.getElementById('fc-type').value;
  var gates = +document.getElementById('fc-gates').value;
  var gateType = document.getElementById('fc-gate-type').value;
  var topping = document.getElementById('fc-topping').value;
  var r = FC_RATES[country], sym = r.sym;

  // Height factor (base is 1.8m)
  var heightFactor = height / 1.8;
  var rates = r[ftype];
  var matCost = rates.mat * length * heightFactor;
  var labCost = rates.lab * length * heightFactor;
  var gateCost = gates * r['gate_' + gateType];
  var toppingCost = topping !== 'none' ? r['topping_' + topping] * length : 0;
  var grandTotal = matCost + labCost + gateCost + toppingCost;

  document.getElementById('fc-headline').textContent = length + 'm ' + ftype.replace(/_/g,' ') + ' — ' + height + 'm high';
  document.getElementById('fc-mat').textContent = fmtCur(sym, matCost);
  document.getElementById('fc-lab').textContent = fmtCur(sym, labCost);
  document.getElementById('fc-gate-total').textContent = gates > 0 ? fmtCur(sym, gateCost) : 'Non gates';
  document.getElementById('fc-grand').textContent = fmtCur(sym, grandTotal);
  document.getElementById('fc-per-m').textContent = fmtCur(sym, grandTotal / length) + '/m';
  var workDays = Math.ceil(length / 10);
  document.getElementById('fc-duration').textContent = workDays + ' jours (estimation)';

  var items = [
    { label:'Fence Matériaux (' + length + 'm × ' + height + 'm)', val: matCost },
    { label:'Main-d’œuvre', val: labCost },
  ];
  if (topping !== 'none') items.push({ label: (topping === 'razor' ? 'Razor' : 'Barbed') + ' wire topping (' + length + 'm)', val: toppingCost });
  if (gates > 0) items.push({ label: gates + '× ' + gateType.replace(/_/g,' ') + ' gate(s)', val: gateCost });
  items.push({ label:'TOTAL', val: grandTotal, total: true });

  document.getElementById('fc-breakdown').innerHTML = items.map(function(i){
    return '<div class="cost-row' + (i.total ? ' total-row' : '') + '"><span>' + i.label + '</span><span>' + fmtCur(sym, i.val) + '</span></div>';
  }).join('');

  var tips = [
    ftype.includes('block') ? 'Les murs en blocs de plus de 1,8 m nécessitent une épaisseur de 225 mm. Utilisez des blocs creux pour réduire le coût.' : '',
    ftype === 'electric' ? 'Electric fence requires energiser, earth stakes, and insulated posts. Professional installation Puissance recommandée : for safety.' : '',
    ftype === 'chain_link' ? 'Use galvanised chain link (not painted) pour les longueurs supérieures life. Bury bottom 150mm in Béton.' : '',
    'Ajoutez 10 % pour les irrégularités du terrain, les angles et les pertes.',
    'La fondation doit descendre au moins 600 mm sous le niveau du sol pour tous les types de clôture.',
    'Demandez au moins trois devis ; les coûts de clôture peuvent varier de 30 à 50 % selon les entreprises.'
  ].filter(Boolean);
  document.getElementById('fc-tips').innerHTML = tips.map(function(t){ return '<li>' + t + '</li>'; }).join('');
  document.getElementById('fc-results').classList.add('on');
  document.getElementById('fc-results').scrollIntoView({ behavior:'smooth', block:'start' });
}
