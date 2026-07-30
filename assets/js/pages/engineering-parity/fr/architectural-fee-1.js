// Fee rates as % of construction value by building type and country
// [min%, max%, typical%]
var AF_COUNTRY = {
  NG:{ sym:'₦', cost_per_m2_res:180000, cost_per_m2_comm:250000,
    reg:'Institut nigérian des architectes (NIA). Le barème est fixé par le Conseil d’enregistrement des architectes du Nigeria (ARCON) et des honoraires minimaux s’appliquent.',
    fees:{ residential_simple:[6,10,7.5], residential_medium:[5.5,9,7], residential_large:[5,8,6.5], commercial_small:[5,8.5,6.5], commercial_medium:[4.5,7.5,6], commercial_large:[4,7,5.5], industrial:[3.5,6,5], institutional:[5,8,6.5] }
  },
  KE:{ sym:'KES', cost_per_m2_res:75000, cost_per_m2_comm:110000,
    reg:'Architectural Association of Kenya (AAK) and Board of Registration of Architects and Quantité Surveyors (BORAQS). Scale fees Appliquer to all registered architects.',
    fees:{ residential_simple:[6,10,7.5], residential_medium:[5.5,9,7], residential_large:[5,8,6.5], commercial_small:[5,8.5,6.5], commercial_medium:[4.5,7.5,6], commercial_large:[4,7,5.5], industrial:[3.5,6,5], institutional:[5,8,6.5] }
  },
  ZA:{ sym:'ZAR', cost_per_m2_res:18000, cost_per_m2_comm:28000,
    reg:'South African Council for the Architectural Profession (SACAP). The SACAP fee guideline is in ZAR per m² and varies by project category. Only SACAP-registered professionals may charge for architectural work.',
    fees:{ residential_simple:[6.5,10.5,8], residential_medium:[6,9.5,7.5], residential_large:[5.5,9,7], commercial_small:[5.5,9,7], commercial_medium:[5,8,6.5], commercial_large:[4.5,7.5,6], industrial:[4,6.5,5.5], institutional:[5.5,9,7] }
  },
  GH:{ sym:'GHS', cost_per_m2_res:12000, cost_per_m2_comm:18000,
    reg:'Ghana Institute of Architects (GIA) and Architects Registration Board (ARB). Fee scales follow NIA equivalents.',
    fees:{ residential_simple:[6,10,7.5], residential_medium:[5.5,9,7], residential_large:[5,8,6.5], commercial_small:[5,8.5,6.5], commercial_medium:[4.5,7.5,6], commercial_large:[4,7,5.5], industrial:[3.5,6,5], institutional:[5,8,6.5] }
  },
  EG:{ sym:'EGP', cost_per_m2_res:14000, cost_per_m2_comm:20000,
    reg:'Egyptian Engineers Syndicate (EES). Fees regulated by the Ingénierie Professions Law. Minimum scale applies to licensed projects.',
    fees:{ residential_simple:[5,9,7], residential_medium:[5,8.5,6.5], residential_large:[4.5,8,6], commercial_small:[4.5,8,6], commercial_medium:[4,7,5.5], commercial_large:[3.5,6.5,5], industrial:[3,5.5,4.5], institutional:[4.5,8,6] }
  },
  ET:{ sym:'ETB', cost_per_m2_res:35000, cost_per_m2_comm:50000,
    reg:'Ethiopian Institute of Architects (EIA). Fees negotiated within government-published ranges.',
    fees:{ residential_simple:[6,10,7.5], residential_medium:[5.5,9,7], residential_large:[5,8,6.5], commercial_small:[5,8.5,6.5], commercial_medium:[4.5,7.5,6], commercial_large:[4,7,5.5], industrial:[3.5,6,5], institutional:[5,8,6.5] }
  },
  TZ:{ sym:'TZS', cost_per_m2_res:1200000, cost_per_m2_comm:1800000,
    reg:'Architects and Quantité Surveyors Registration Board (AQSRB) Tanzanie. Mandatory registration for all practicing architects.',
    fees:{ residential_simple:[6,10,7.5], residential_medium:[5.5,9,7], residential_large:[5,8,6.5], commercial_small:[5,8.5,6.5], commercial_medium:[4.5,7.5,6], commercial_large:[4,7,5.5], industrial:[3.5,6,5], institutional:[5,8,6.5] }
  },
  UG:{ sym:'UGX', cost_per_m2_res:1800000, cost_per_m2_comm:2600000,
    reg:'Ouganda Society of Architects (USA) and Engineers Registration Board (ERB).',
    fees:{ residential_simple:[6,10,7.5], residential_medium:[5.5,9,7], residential_large:[5,8,6.5], commercial_small:[5,8.5,6.5], commercial_medium:[4.5,7.5,6], commercial_large:[4,7,5.5], industrial:[3.5,6,5], institutional:[5,8,6.5] }
  },
  RW:{ sym:'RWF', cost_per_m2_res:300000, cost_per_m2_comm:450000,
    reg:'Rwanda Institute of Architects (RIA). Rwanda Development Board (RDB) oversees construction permits. EAC harmonised fee scales Appliquer.',
    fees:{ residential_simple:[6,10,7.5], residential_medium:[5.5,9,7], residential_large:[5,8,6.5], commercial_small:[5,8.5,6.5], commercial_medium:[4.5,7.5,6], commercial_large:[4,7,5.5], industrial:[3.5,6,5], institutional:[5,8,6.5] }
  },
  MA:{ sym:'MAD', cost_per_m2_res:8000, cost_per_m2_comm:12000,
    reg:"Ordre National des Architectes (ONA) Maroc. Architect signature mandatory for all Bâtiment permits. Fees set by Dahir.",
    fees:{ residential_simple:[5,9,7], residential_medium:[5,8.5,6.5], residential_large:[4.5,8,6], commercial_small:[4.5,8,6], commercial_medium:[4,7,5.5], commercial_large:[3.5,6.5,5], industrial:[3,5.5,4.5], institutional:[4.5,8,6] }
  }
};

// Stage breakdown of full fee
var STAGES = [
  { name:'Stage 1: Inception / Briefing', pct:5 },
  { name:'Stage 2: Concept Design', pct:15 },
  { name:'Stage 3: Design Development', pct:20 },
  { name:'Phase 4 : plans techniques et d’exécution', pct:25 },
  { name:'Phase 5 : plans pour autorisation réglementaire', pct:10 },
  { name:'Stage 6: Construction Documentation', pct:10 },
  { name:'Stage 7: Contract Administration / Chantier Inspection', pct:15 }
];
var SCOPE_PCTS = { full:1.0, sketch:0.20, working_drawings:0.35, approval:0.15 };
var ARCH_MULT = { sole:0.85, small_firm:1.0, large_firm:1.25 };

function fmtCur(sym,n){ return sym + Math.round(n).toLocaleString(); }

function calcArchFee(){
  var country = document.getElementById('af-country').value;
  var btype = document.getElementById('af-btype').value;
  var area = +document.getElementById('af-area').value;
  var inputVal = +document.getElementById('af-value').value;
  var scope = document.getElementById('af-scope').value;
  var archCat = document.getElementById('af-arch-cat').value;
  var cd = AF_COUNTRY[country], sym = cd.sym;
  var isComm = btype.startsWith('commercial') || btype === 'industrial' || btype === 'institutional';
  var constVal = inputVal > 0 ? inputVal : area * (isComm ? cd.cost_per_m2_comm : cd.cost_per_m2_res);
  var feeRange = cd.fees[btype];
  var feeRate = feeRange[2] * SCOPE_PCTS[scope] * ARCH_MULT[archCat] / 100;
  var totalFee = constVal * feeRate;

  document.getElementById('af-headline').textContent = 'Architectural Fee for ' + area + 'm² ' + btype.replace(/_/g,' ');
  document.getElementById('af-constr-val').textContent = fmtCur(sym, constVal);
  document.getElementById('af-rate').textContent = (feeRate * 100).toFixed(1) + '% of construction value';
  document.getElementById('af-total-fee').textContent = fmtCur(sym, totalFee);
  document.getElementById('af-per-m2').textContent = fmtCur(sym, totalFee / area) + '/m²';
  document.getElementById('af-reg-info').textContent = cd.reg;

  var stagesEl = document.getElementById('af-stages');
  if (scope === 'full') {
    stagesEl.innerHTML = STAGES.map(function(s){
      return '<div class="fee-stage"><span style="font-size:.88rem">' + s.name + '</span><div style="display:flex;align-items:center;gap:.75rem"><span class="stage-pct">' + s.pct + '%</span><span style="font-weight:600;min-width:90px;text-align:right">' + fmtCur(sym, totalFee * s.pct / 100) + '</span></div></div>';
    }).join('');
  } else {
    stagesEl.innerHTML = '<p style="color:#64748b;font-size:.9rem;padding:.5rem">Informations et hypothèses du calcul<strong>' + scope.replace(/_/g,' ') + '</strong> (' + Math.round(SCOPE_PCTS[scope]*100) + '% of full fee).</p>';
  }

  var tips = [
    'Obtenez toujours une convention d’honoraires écrite avant le début de la mission ; un accord verbal est difficilement opposable.',
    'Confirmez si les honoraires incluent les dépôts réglementaires ou si ceux-ci sont facturés séparément.',
    'Renseignez-vous sur les débours (impression, déplacements, relevés), généralement facturés en plus des honoraires.',
    'La phase 7 (inspection du chantier) est essentielle : les visites permettent de détecter tôt les erreurs coûteuses.',
    country === 'ZA' ? 'In Afrique du Sud, only SACAP-registered professionals (Pr. Arch or Pr. Tech (Arch)) may legally sign off on Bâtiment plans.' : 'Vérifiez l’inscription de l’architecte auprès de ' + (country === 'NG' ? 'ARCON' : country === 'KE' ? 'BORAQS' : country === 'GH' ? 'ARB' : 'the national registration body') + ' avant de le missionner.',
    'Pour les projets complexes, prévoyez aussi l’ingénieur structure (2 à 4 %), le métreur (1,5 à 3 %) et les ingénieurs techniques (1,5 à 3 %).'
  ];
  document.getElementById('af-tips').innerHTML = tips.map(function(t){ return '<li>' + t + '</li>'; }).join('');
  document.getElementById('af-results').classList.add('on');
  document.getElementById('af-results').scrollIntoView({ behavior:'smooth', block:'start' });
}
