/* ── Brand Database ── */
var BRANDS = {
  NG: {
    emulsion: [
      {name:'Dulux Vinyl Matt',rate:12,price:3500},
      {name:'Dulux Weathershield',rate:11,price:4200},
      {name:'Berger Butterfly Emulsion',rate:10,price:2800},
      {name:'Berger Texcote',rate:8,price:3200},
      {name:'CAP Plc Emulsion',rate:10,price:2500},
      {name:'Sandtex Emulsion',rate:11,price:2600}
    ],
    weathercoat: [
      {name:'Dulux Weathershield Max',rate:10,price:4500},
      {name:'Berger Weathercoat',rate:9,price:3500},
      {name:'CAP Gloss',rate:14,price:3000},
      {name:'Sandtex Weatherguard',rate:10,price:3200}
    ],
    gloss: [
      {name:'Dulux Gloss',rate:14,price:4000},
      {name:'Berger High Gloss',rate:13,price:3200},
      {name:'CAP Gloss Enamel',rate:14,price:2800}
    ],
    textured: [
      {name:'Berger Texcote',rate:6,price:4000},
      {name:'Dulux Textured',rate:7,price:4500},
      {name:'Sandtex Textured',rate:6,price:3800}
    ]
  },
  ZA: {
    emulsion: [
      {name:'Plascon Wall & All',rate:12,price:350},
      {name:'Plascon Double Velvet',rate:11,price:420},
      {name:'Dulux Wash & Wear',rate:12,price:380},
      {name:'Prominent Paints Interior',rate:10,price:280}
    ],
    weathercoat: [
      {name:'Plascon SunCare',rate:10,price:450},
      {name:'Dulux Weatherguard',rate:11,price:480},
      {name:'Prominent Exterior',rate:9,price:340}
    ],
    gloss: [
      {name:'Plascon Velvaglo',rate:14,price:400},
      {name:'Dulux Enamel Gloss',rate:13,price:420}
    ],
    textured: [
      {name:'Plascon Micatex',rate:5,price:500},
      {name:'Dulux AcraTeX',rate:4,price:520}
    ]
  },
  KE: {
    emulsion: [
      {name:'Crown Vinyl Matt',rate:11,price:1800},
      {name:'Crown Silk Vinyl',rate:12,price:2200},
      {name:'Basco Emulsion',rate:10,price:1500},
      {name:'Sadolin Emulsion',rate:12,price:2400}
    ],
    weathercoat: [
      {name:'Crown Weathercoat',rate:10,price:2500},
      {name:'Sadolin Exterior',rate:11,price:2800},
      {name:'Basco Exterior',rate:9,price:2000}
    ],
    gloss: [
      {name:'Crown Gloss',rate:13,price:2200},
      {name:'Sadolin Gloss',rate:14,price:2600}
    ],
    textured: [
      {name:'Crown Textured',rate:6,price:2800},
      {name:'Basco Textured',rate:5,price:2200}
    ]
  },
  GH: {
    emulsion: [
      {name:'Azar Chemical Emulsion',rate:10,price:120},
      {name:'Dolphin Paints Emulsion',rate:9,price:100}
    ],
    weathercoat: [
      {name:'Azar Weathercoat',rate:9,price:150},
      {name:'Dolphin Exterior',rate:8,price:130}
    ],
    gloss: [
      {name:'Azar Gloss',rate:13,price:140},
      {name:'Dolphin Gloss',rate:12,price:120}
    ],
    textured: [
      {name:'Azar Textured',rate:5,price:160}
    ]
  },
  TZ: {
    emulsion: [
      {name:'Crown Paints EA Emulsion',rate:11,price:65000},
      {name:'Crown Silk Vinyl',rate:12,price:80000},
      {name:'Shield Emulsion',rate:10,price:55000},
      {name:'Kansai Paint Emulsion',rate:11,price:70000}
    ],
    weathercoat: [
      {name:'Crown Weathercoat',rate:10,price:90000},
      {name:'Shield Exterior',rate:9,price:75000}
    ],
    gloss: [
      {name:'Crown Gloss',rate:13,price:85000},
      {name:'Shield Gloss',rate:12,price:70000}
    ],
    textured: [
      {name:'Crown Textured',rate:6,price:95000},
      {name:'Shield Textured',rate:5,price:80000}
    ]
  },
  UG: {
    emulsion: [
      {name:'Crown Paints EA Emulsion',rate:11,price:28000},
      {name:'Crown Silk Vinyl',rate:12,price:34000},
      {name:'Sadolin Emulsion',rate:12,price:36000},
      {name:'Kansai Paint Emulsion',rate:11,price:25000}
    ],
    weathercoat: [
      {name:'Crown Weathercoat',rate:10,price:38000},
      {name:'Sadolin Exterior',rate:11,price:42000}
    ],
    gloss: [
      {name:'Crown Gloss',rate:13,price:32000},
      {name:'Sadolin Gloss',rate:14,price:38000}
    ],
    textured: [
      {name:'Crown Textured',rate:6,price:42000},
      {name:'Kansai Textured',rate:5,price:36000}
    ]
  },
  pan: {
    emulsion: [
      {name:'Kansai Paint Emulsion',rate:11,price:0},
      {name:'Generic Emulsion (10 m\u00B2/L)',rate:10,price:0},
      {name:'Premium Emulsion (12 m\u00B2/L)',rate:12,price:0}
    ],
    weathercoat: [
      {name:'Generic Exterior (9 m\u00B2/L)',rate:9,price:0},
      {name:'Premium Exterior (11 m\u00B2/L)',rate:11,price:0}
    ],
    gloss: [
      {name:'Generic Gloss (13 m\u00B2/L)',rate:13,price:0},
      {name:'Premium Gloss (14 m\u00B2/L)',rate:14,price:0}
    ],
    textured: [
      {name:'Generic Textured (6 m\u00B2/L)',rate:6,price:0}
    ]
  }
};

var CURR_SYM = {NGN:'\u20A6',ZAR:'R',KES:'KSh ',GHS:'GH\u20B5',TZS:'TSh ',UGX:'USh ',USD:'$'};
var SURFACE_FACTOR = {smooth:1,rough:0.8,new:0.6,repaint:1.15};
var rooms = [];

/* ── Init ── */
updateBrandOptions();
document.getElementById('roomShape').addEventListener('change',function(){
  document.getElementById('rectInputs').style.display = this.value==='rect'?'':'none';
  document.getElementById('lshapeInputs').style.display = this.value==='lshape'?'':'none';
  document.getElementById('customInputs').style.display = this.value==='custom'?'':'none';
});

/* ── Brand Options ── */
function updateBrandOptions(){
  var country = document.getElementById('brandCountry').value;
  var type = document.getElementById('paintType').value;
  var sel = document.getElementById('brand');
  var list = (BRANDS[country]&&BRANDS[country][type])||[];
  sel.innerHTML = list.map(function(b,i){
    return '<option value="'+i+'">'+b.name+' ('+b.rate+' m\u00B2/L)'+'</option>';
  }).join('');
  // Auto-set currency
  var currMap = {NG:'NGN',ZA:'ZAR',KE:'KES',GH:'GHS',TZ:'TZS',UG:'UGX',pan:'USD'};
  if(currMap[country]) document.getElementById('priceCurrency').value = currMap[country];
}

/* ── Room Management ── */
function getRoomData(){
  var shape = document.getElementById('roomShape').value;
  var u = document.getElementById('unit').value;
  var conv = u==='ft'?0.3048:1;
  var doorArea = parseFloat(document.getElementById('doorSize').value);
  var windowArea = parseFloat(document.getElementById('windowSize').value);
  var doors = parseInt(document.getElementById('doors').value)||0;
  var windows = parseInt(document.getElementById('windows').value)||0;
  var ceil = document.getElementById('ceiling').value==='yes';
  var wallArea=0, floorArea=0, h=0;

  if(shape==='rect'){
    var l = (parseFloat(document.getElementById('length').value)||0)*conv;
    var w = (parseFloat(document.getElementById('width').value)||0)*conv;
    h = (parseFloat(document.getElementById('height').value)||3)*conv;
    if(l<=0||w<=0) return null;
    wallArea = 2*(l+w)*h;
    floorArea = l*w;
  } else if(shape==='lshape'){
    var l1 = (parseFloat(document.getElementById('lLen1').value)||0)*conv;
    var w1 = (parseFloat(document.getElementById('lWid1').value)||0)*conv;
    h = (parseFloat(document.getElementById('lHeight').value)||3)*conv;
    var l2 = (parseFloat(document.getElementById('lLen2').value)||0)*conv;
    var w2 = (parseFloat(document.getElementById('lWid2').value)||0)*conv;
    if(l1<=0||w1<=0||l2<=0||w2<=0) return null;
    // L-shape perimeter: outer perimeter of combined shape
    var perim = 2*(l1+w1) + 2*(l2+w2) - 2*Math.min(w1,w2);
    wallArea = perim*h;
    floorArea = l1*w1 + l2*w2;
  } else {
    wallArea = (parseFloat(document.getElementById('customWallArea').value)||0);
    floorArea = (parseFloat(document.getElementById('customCeilArea').value)||0);
    if(wallArea<=0) return null;
  }

  var openings = doors*doorArea + windows*windowArea;
  var ceilingArea = ceil?floorArea:0;
  var paintable = Math.max(0,wallArea-openings)+ceilingArea;

  return {wallArea:wallArea,openings:openings,ceilingArea:ceilingArea,paintable:paintable,doors:doors,windows:windows,ceil:ceil,shape:shape};
}

function addRoom(){
  var data = getRoomData();
  if(!data){alert('Please enter valid room dimensions.');return;}
  rooms.push(data);
  renderRoomTags();
  // Clear rect inputs
  document.getElementById('length').value='';
  document.getElementById('width').value='';
}

function removeRoom(i){rooms.splice(i,1);renderRoomTags();}

function renderRoomTags(){
  document.getElementById('roomTags').innerHTML = rooms.map(function(r,i){
    return '<span class="room-tag">Room '+(i+1)+': '+r.paintable.toFixed(1)+' m\u00B2 <button type="button" onclick="removeRoom('+i+')">&times;</button></span>';
  }).join('');
}

/* ── Calculate ── */
function calculate(){
  // Add current room if fields are filled
  var current = getRoomData();
  if(current && (parseFloat(document.getElementById('length').value)>0 || document.getElementById('roomShape').value==='custom')){
    rooms.push(current);
    renderRoomTags();
    document.getElementById('length').value='';
    document.getElementById('width').value='';
  }

  if(rooms.length===0){alert('Please enter at least one room.');return;}

  var country = document.getElementById('brandCountry').value;
  var type = document.getElementById('paintType').value;
  var brandIdx = parseInt(document.getElementById('brand').value)||0;
  var brandList = (BRANDS[country]&&BRANDS[country][type])||[];
  var brand = brandList[brandIdx]||{rate:10,price:0,name:'Generic'};
  var baseCoverage = brand.rate;

  var surface = document.getElementById('surfaceType').value;
  var surfaceFactor = SURFACE_FACTOR[surface]||1;
  var effectiveCoverage = baseCoverage * surfaceFactor;

  var coats = parseInt(document.getElementById('coats').value)||2;
  var needsPrimer = surface==='new';

  var totalWall=0, totalPaintable=0;
  rooms.forEach(function(r){totalWall+=r.wallArea;totalPaintable+=r.paintable;});

  var litresRaw = (totalPaintable*coats)/effectiveCoverage;
  var litresWithWaste = litresRaw*1.10;
  var litresNeeded = Math.ceil(litresWithWaste);

  // Primer
  var primerLitres = 0;
  if(needsPrimer){
    primerLitres = Math.ceil((totalPaintable/8)*1.10);
  }

  // Display results
  document.getElementById('rArea').textContent = totalWall.toFixed(1)+' m\u00B2';
  document.getElementById('rPaintable').textContent = totalPaintable.toFixed(1)+' m\u00B2';
  document.getElementById('rLitres').textContent = litresNeeded+' litres';

  // Primer note
  if(needsPrimer){
    document.getElementById('primerNote').style.display='block';
    document.getElementById('primerQty').textContent='You need approximately '+primerLitres+' litres of primer.';
  }else{
    document.getElementById('primerNote').style.display='none';
  }

  // Tin recommendations — optimal combination
  var tinHtml = '';
  var remaining = litresNeeded;
  var tins20 = Math.floor(remaining/20);
  remaining -= tins20*20;
  var tins4 = Math.floor(remaining/4);
  remaining -= tins4*4;
  var tins1 = remaining>0?Math.ceil(remaining):0;

  // Optimize: if 5+ tins of 4L, suggest one more 20L instead
  if(tins4>=5){tins20++;tins4-=5;}

  if(tins20>0) tinHtml+='<div class="tin-row"><span>20-litre drums</span><span class="tin-qty">'+tins20+'</span></div>';
  if(tins4>0) tinHtml+='<div class="tin-row"><span>4-litre tins</span><span class="tin-qty">'+tins4+'</span></div>';
  if(tins1>0) tinHtml+='<div class="tin-row"><span>1-litre tins</span><span class="tin-qty">'+tins1+'</span></div>';
  tinHtml+='<div class="tin-row" style="font-size:.72rem;color:#94a3b8;border:none;padding-top:6px"><span>Total: '+litresNeeded+'L ('+brand.name+', '+effectiveCoverage.toFixed(1)+' m\u00B2/L effective)</span></div>';
  document.getElementById('tinRows').innerHTML = tinHtml;

  // Cost
  var pricePerL = parseFloat(document.getElementById('pricePerLitre').value) || brand.price || 0;
  if(pricePerL>0){
    var curr = document.getElementById('priceCurrency').value;
    var sym = CURR_SYM[curr]||'';
    var totalCost = litresNeeded * pricePerL;
    var primerCost = primerLitres * pricePerL * 0.7; // Primer ~70% of topcoat price
    document.getElementById('costEstimate').textContent = sym + totalCost.toLocaleString('en',{minimumFractionDigits:0,maximumFractionDigits:0});
    document.getElementById('costNote').textContent = 'Based on '+sym+pricePerL.toLocaleString('en')+'/litre for '+brand.name+(needsPrimer?'. Primer adds ~'+sym+Math.round(primerCost).toLocaleString('en'):'')+'. Labour costs not included.';
    document.getElementById('costSection').style.display='block';
  }else{
    document.getElementById('costSection').style.display='none';
  }

  // Room SVG preview
  drawRoomPreview(rooms);

  // Summary
  var sumHtml = '<strong>'+rooms.length+' room(s)</strong> | '+coats+' coat(s) | '+brand.name+' ('+effectiveCoverage.toFixed(1)+' m\u00B2/L effective) | Surface: '+surface+' | 10% wastage included';
  document.getElementById('summary').innerHTML = sumHtml;

  document.getElementById('results').style.display='block';
  document.getElementById('results').scrollIntoView({behavior:'smooth',block:'start'});
}

/* ── SVG Room Preview ── */
function drawRoomPreview(roomList){
  if(!roomList.length){document.getElementById('roomPreview').innerHTML='';return;}
  var r = roomList[0]; // Show first room
  var w=200,h=150;
  var wallColor='#BFDBFE';
  var floorColor='#EFF6FF';
  var svg = '<svg viewBox="0 0 260 180" xmlns="http://www.w3.org/2000/svg">'+
    '<rect x="30" y="20" width="'+w+'" height="'+h+'" fill="'+floorColor+'" stroke="'+wallColor+'" stroke-width="3" rx="2"/>'+
    // Left wall
    '<rect x="30" y="20" width="8" height="'+h+'" fill="'+wallColor+'"/>'+
    // Right wall
    '<rect x="'+(222)+'" y="20" width="8" height="'+h+'" fill="'+wallColor+'"/>'+
    // Top wall
    '<rect x="30" y="20" width="'+w+'" height="8" fill="'+wallColor+'"/>'+
    // Bottom wall with door gap
    '<rect x="30" y="'+(162)+'" width="70" height="8" fill="'+wallColor+'"/>'+
    '<rect x="120" y="'+(162)+'" width="110" height="8" fill="'+wallColor+'"/>'+
    // Door
    '<rect x="100" y="'+(162)+'" width="20" height="8" fill="#FDE68A" stroke="#F59E0B" stroke-width="1"/>'+
    // Window on top wall
    '<rect x="100" y="20" width="40" height="8" fill="#A5F3FC" stroke="#06B6D4" stroke-width="1"/>'+
    // Area label
    '<text x="130" y="105" text-anchor="middle" font-family="DM Sans,sans-serif" font-size="14" font-weight="700" fill="#0062CC">'+r.paintable.toFixed(0)+' m\u00B2</text>'+
    '<text x="130" y="120" text-anchor="middle" font-family="DM Sans,sans-serif" font-size="10" fill="#64748b">paintable area</text>'+
    '</svg>';
  document.getElementById('roomPreview').innerHTML = svg;
}

/* ── Reset ── */
function resetCalc(){
  rooms = [];
  document.getElementById('roomTags').innerHTML = '';
  document.getElementById('results').style.display = 'none';
  document.getElementById('length').value = '';
  document.getElementById('width').value = '';
  document.getElementById('height').value = '3';
  document.getElementById('doors').value = '1';
  document.getElementById('windows').value = '2';
  document.getElementById('pricePerLitre').value = '';
}

/* ── Print ── */
function printResults(){window.print();}

/* ── Share ── */
function shareResults(){
  var litres = document.getElementById('rLitres').textContent;
  var area = document.getElementById('rPaintable').textContent;
  var text = 'Paint needed: '+litres+' for '+area+' paintable area ('+rooms.length+' room(s)).\nCalculated with AfroTools Paint Calculator\nhttps://afrotools.com/tools/paint-calculator/';
  if(navigator.share){
    navigator.share({title:'Paint Estimate | AfroTools',text:text}).catch(function(){});
  }else{
    navigator.clipboard.writeText(text).then(function(){alert('Copied to clipboard!');});
  }
}
