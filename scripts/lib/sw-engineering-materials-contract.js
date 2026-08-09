"use strict";

const APPS = Object.freeze([
  {id:"concrete-calc",slug:"mchanganyiko-wa-zege",title:"Kikokotoo cha Mchanganyiko wa Zege",enRoute:"/tools/concrete-mix/",frRoute:"/fr/tools/dosage-beton/",image:"/assets/img/tools/concrete-calc.webp",description:"Kokotoa ujazo wa zege, saruji, mchanga, kokoto na maji kwa uwiano na akiba ya upotevu."},
  {id:"tiles-calc",slug:"kikokotoo-vigae-na-sakafu",title:"Kikokotoo cha Vigae na Sakafu",enRoute:"/tools/tiles-calc/",frRoute:"/fr/tools/calculateur-carrelage/",image:"/assets/img/tools/tiles-calc.webp",description:"Kokotoa eneo la sakafu au ukuta, idadi ya vigae, grout, upotevu, boksi na gharama."},
  {id:"water-tank",slug:"ukubwa-wa-tangi-la-maji",title:"Kikokotoo cha Ukubwa wa Tangi la Maji",enRoute:"/tools/water-tank/",frRoute:"/fr/tools/dimensionnement-citerne/",image:"/assets/img/tools/water-tank.webp",description:"Kadiria matumizi ya maji, siku za akiba, tangi la kawaida na uwezo wa kuvuna maji ya mvua."},
  {id:"rebar-calc",slug:"kikokotoo-nondo",title:"Kikokotoo cha Nondo na BBS",enRoute:"/tools/rebar-calculator/",frRoute:"/fr/tools/calculateur-armature/",image:"/assets/img/tools/rebar-calc.webp",description:"Tengeneza makadirio ya uzito, urefu, idadi ya nondo za mita 12, upotevu na gharama ya chuma."},
].map((app)=>Object.freeze({...app,swRoute:`/sw/zana/${app.slug}/`,file:`sw/zana/${app.slug}/index.html`})));

module.exports={SW_ENGINEERING_MATERIALS_APPS:APPS};
