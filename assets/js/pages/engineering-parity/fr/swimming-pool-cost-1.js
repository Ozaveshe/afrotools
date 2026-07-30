var SP_RATES = {
  NG:{ sym:'₦', concrete_m3:120000, fibreglass_m3:95000, liner_m3:55000,
    plaster_m2:8000, tile_m2:22000, pebble_m2:30000,
    pump_filter:280000, chem_monthly:25000, maint_annual:400000,
    extra_heating:350000, extra_lighting:180000, extra_cover:120000, extra_fence:200000, extra_jacuzzi:850000
  },
  KE:{ sym:'KES', concrete_m3:55000, fibreglass_m3:42000, liner_m3:25000,
    plaster_m2:3500, tile_m2:9500, pebble_m2:13000,
    pump_filter:120000, chem_monthly:10000, maint_annual:180000,
    extra_heating:150000, extra_lighting:75000, extra_cover:50000, extra_fence:85000, extra_jacuzzi:380000
  },
  ZA:{ sym:'ZAR', concrete_m3:18000, fibreglass_m3:14000, liner_m3:8000,
    plaster_m2:1200, tile_m2:3200, pebble_m2:4500,
    pump_filter:40000, chem_monthly:3500, maint_annual:60000,
    extra_heating:55000, extra_lighting:25000, extra_cover:18000, extra_fence:28000, extra_jacuzzi:130000
  },
  GH:{ sym:'GHS', concrete_m3:14000, fibreglass_m3:11000, liner_m3:6500,
    plaster_m2:950, tile_m2:2600, pebble_m2:3500,
    pump_filter:32000, chem_monthly:2800, maint_annual:48000,
    extra_heating:44000, extra_lighting:20000, extra_cover:14000, extra_fence:22000, extra_jacuzzi:100000
  },
  EG:{ sym:'EGP', concrete_m3:15000, fibreglass_m3:12000, liner_m3:7000,
    plaster_m2:1000, tile_m2:2800, pebble_m2:3800,
    pump_filter:35000, chem_monthly:3000, maint_annual:52000,
    extra_heating:48000, extra_lighting:22000, extra_cover:16000, extra_fence:24000, extra_jacuzzi:110000
  },
  MA:{ sym:'MAD', concrete_m3:8000, fibreglass_m3:6200, liner_m3:3600,
    plaster_m2:520, tile_m2:1400, pebble_m2:1950,
    pump_filter:18000, chem_monthly:1500, maint_annual:27000,
    extra_heating:25000, extra_lighting:11000, extra_cover:8000, extra_fence:12000, extra_jacuzzi:58000
  }
};

function calcPool(){
  var country = document.getElementById('sp-country').value;
  var L = +document.getElementById('sp-length').value;
  var W = +document.getElementById('sp-width').value;
  var D = +document.getElementById('sp-depth').value;
  var ptype = document.getElementById('sp-type').value;
  var finish = document.getElementById('sp-finish').value;
  var use = document.getElementById('sp-use').value;
  var extrasEl = document.getElementById('sp-extras');
  var extras = [];
  for (var i=0; i<extrasEl.options.length; i++) if (extrasEl.options[i].selected) extras.push(extrasEl.options[i].value);
  var r = SP_RATES[country], sym = r.sym;

  var surfaceArea = L * W;
  var volume = L * W * D;
  var wallArea = 2 * (L + W) * D;
  var totalFinishArea = surfaceArea + wallArea;

  var constructCost = volume * r[ptype + '_m3'];
  var finishCost = totalFinishArea * r[finish + '_m2'];
  var equipCost = r.pump_filter * (use === 'commercial' ? 2 : 1);
  var extrasCost = extras.reduce(function(sum, e){ return sum + r['extra_' + e]; }, 0);
  var useFactor = use === 'commercial' ? 1.3 : 1.0;
  var totalBuild = (constructCost + finishCost + equipCost) * useFactor + extrasCost;
  var annualMaint = r.maint_annual * (use === 'commercial' ? 2.5 : 1);

  document.getElementById('sp-headline').textContent = L + 'm × ' + W + 'm Pool — ' + D + 'm Deep';
  document.getElementById('sp-sub').textContent = surfaceArea.toFixed(0) + 'm² surface, ' + (volume * 1000).toFixed(0) + ' litres';
  document.getElementById('sp-construct').textContent = sym + Math.round(constructCost * useFactor).toLocaleString();
  document.getElementById('sp-finish-cost').textContent = sym + Math.round(finishCost * useFactor).toLocaleString();
  document.getElementById('sp-equip').textContent = sym + Math.round(equipCost + extrasCost).toLocaleString();
  document.getElementById('sp-total').textContent = sym + Math.round(totalBuild).toLocaleString();
  document.getElementById('sp-volume').textContent = (volume * 1000).toFixed(0) + ' litres';
  document.getElementById('sp-maint').textContent = sym + Math.round(annualMaint).toLocaleString() + '/yr';
  document.getElementById('sp-chem').textContent = sym + Math.round(r.chem_monthly).toLocaleString() + '/mo';
  document.getElementById('sp-per-m2').textContent = sym + Math.round(totalBuild / surfaceArea).toLocaleString() + '/m²';

  var notes = [
    'Une piscine en béton exige quatre à huit semaines ; une coque en fibre de verre peut être posée en une à deux semaines.',
    finish === 'tile' ? 'Full tile finish is the most durable but requires skilled tilers and periodic re-grouting.' : finish === 'pebble' ? 'Pebble finish is long-lasting and slip-resistant — popular for tropical climates.' : 'L’enduit doit être refait tous les huit à douze ans.',
    'L’eau de la piscine doit être traitée au chlore ou par électrolyse au sel. Maintenez le pH entre 7,2 et 7,6.',
    'Budget ' + sym + Math.round(r.chem_monthly * 12).toLocaleString() + '/year for chemicals alone.',
    'En Afrique tropicale, l’évaporation peut atteindre 30 à 50 mm par semaine ; une couverture la réduit de 90 %.',
    'Faites appel à un pisciniste agréé et, en Afrique du Sud, demandez son enregistrement NHBRC.'
  ];
  document.getElementById('sp-notes').innerHTML = notes.map(function(n){ return '<li>' + n + '</li>'; }).join('');
  document.getElementById('sp-results').classList.add('on');
  document.getElementById('sp-results').scrollIntoView({ behavior:'smooth', block:'start' });
}
