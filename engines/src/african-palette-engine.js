(function (global) {
  "use strict";
var PALETTES={
  kente:{name:'Kente',emoji:'🟨',desc:'Bold geometric colors of Ghanaian Kente cloth',colors:[
    {name:'Gold',hex:'#FFC107',role:'primary'},{name:'Crimson',hex:'#C0392B',role:'secondary'},
    {name:'Forest',hex:'#27AE60',role:'accent'},{name:'Royal Blue',hex:'#2980B9',role:'dark'},
    {name:'Ivory',hex:'#FFF8E1',role:'background'}
  ]},
  ankara:{name:'Ankara',emoji:'🦜',desc:'Vibrant wax print fabric inspired palette',colors:[
    {name:'Tangerine',hex:'#FF6B35',role:'primary'},{name:'Teal',hex:'#007C77',role:'secondary'},
    {name:'Mustard',hex:'#FFB30F',role:'accent'},{name:'Plum',hex:'#5C2751',role:'dark'},
    {name:'Cream',hex:'#FFF5E6',role:'background'}
  ]},
  savanna:{name:'Savanna',emoji:'🌾',desc:'Warm earth tones of the African savanna',colors:[
    {name:'Amber',hex:'#D4860A',role:'primary'},{name:'Sienna',hex:'#A0522D',role:'secondary'},
    {name:'Sage',hex:'#8FAD62',role:'accent'},{name:'Charcoal',hex:'#2C2C2C',role:'dark'},
    {name:'Sand',hex:'#F5E6C8',role:'background'}
  ]},
  desert:{name:'Desert',emoji:'🌵',desc:'Sahara and Kalahari desert tones',colors:[
    {name:'Terracotta',hex:'#C1440E',role:'primary'},{name:'Burnt Orange',hex:'#E05C17',role:'secondary'},
    {name:'Ocher',hex:'#CC8B3B',role:'accent'},{name:'Deep Brown',hex:'#3D1C02',role:'dark'},
    {name:'Dune',hex:'#F8EFD4',role:'background'}
  ]},
  ocean:{name:'Ocean',emoji:'🌊',desc:'Indian Ocean and Atlantic coastal blues',colors:[
    {name:'Cobalt',hex:'#0047AB',role:'primary'},{name:'Aqua',hex:'#00B4D8',role:'secondary'},
    {name:'Coral',hex:'#FF6B6B',role:'accent'},{name:'Deep Sea',hex:'#03045E',role:'dark'},
    {name:'Sea Foam',hex:'#E8F8FF',role:'background'}
  ]},
  'night-market':{name:'Night Market',emoji:'🌙',desc:'Night bazaar and souk ambience',colors:[
    {name:'Saffron',hex:'#F4A261',role:'primary'},{name:'Crimson',hex:'#E63946',role:'secondary'},
    {name:'Turquoise',hex:'#2EC4B6',role:'accent'},{name:'Midnight',hex:'#0D1117',role:'dark'},
    {name:'Warm White',hex:'#FFF9F0',role:'background'}
  ]},
  ubuntu:{name:'Ubuntu',emoji:'🤝',desc:'Community, humanity, togetherness',colors:[
    {name:'Ubuntu Green',hex:'#77216F',role:'primary'},{name:'Warm Orange',hex:'#E95420',role:'secondary'},
    {name:'Amber',hex:'#EFB73E',role:'accent'},{name:'Dark',hex:'#2C001E',role:'dark'},
    {name:'Light',hex:'#FBF0F5',role:'background'}
  ]},
  afrobeats:{name:'Afrobeats',emoji:'🎵',desc:'Energetic, vibrant Afrobeats music scene',colors:[
    {name:'Hot Pink',hex:'#FF1493',role:'primary'},{name:'Electric Yellow',hex:'#FFE600',role:'secondary'},
    {name:'Neon Green',hex:'#39FF14',role:'accent'},{name:'Deep Purple',hex:'#120024',role:'dark'},
    {name:'Off White',hex:'#FFFFF0',role:'background'}
  ]},
  nollywood:{name:'Nollywood',emoji:'🎬',desc:'Bold, dramatic Nigerian cinema aesthetic',colors:[
    {name:'Emerald',hex:'#008751',role:'primary'},{name:'Gold',hex:'#FFD700',role:'secondary'},
    {name:'Royal Purple',hex:'#6A0DAD',role:'accent'},{name:'Ebony',hex:'#0A0A0A',role:'dark'},
    {name:'Pearl',hex:'#F8F5F0',role:'background'}
  ]},
  'modern-african':{name:'Modern African',emoji:'🏙️',desc:'Contemporary African tech and business',colors:[
    {name:'AfroBlue',hex:'#0062CC',role:'primary'},{name:'Success',hex:'#10B981',role:'secondary'},
    {name:'Amber',hex:'#F59E0B',role:'accent'},{name:'Dark',hex:'#0A1628',role:'dark'},
    {name:'Light',hex:'#F8FAFD',role:'background'}
  ]},
};

function hexToRgb(hex){
  var r=parseInt(hex.slice(1,3),16),g=parseInt(hex.slice(3,5),16),b=parseInt(hex.slice(5,7),16);
  return{r:r,g:g,b:b};
}
function luminance(hex){
  var rgb=hexToRgb(hex);
  var sRGB=[rgb.r,rgb.g,rgb.b].map(function(v){v/=255;return v<=0.03928?v/12.92:Math.pow((v+0.055)/1.055,2.4);});
  return 0.2126*sRGB[0]+0.7152*sRGB[1]+0.0722*sRGB[2];
}
function contrastRatio(hex1,hex2){
  var l1=luminance(hex1),l2=luminance(hex2);
  return(Math.max(l1,l2)+0.05)/(Math.min(l1,l2)+0.05);
}
function isDark(hex){return luminance(hex)<0.3;}


  function getPalette(id) { return PALETTES[id] || null; }
  global.AfroTools = global.AfroTools || {};
  global.AfroTools.AfricanPaletteEngine = Object.freeze({
    palettes: PALETTES,
    getPalette: getPalette,
    hexToRgb: hexToRgb,
    luminance: luminance,
    contrastRatio: contrastRatio,
    isDark: isDark
  });
})(typeof window !== "undefined" ? window : globalThis);
