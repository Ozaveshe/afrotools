'use strict';

const countries = { KE:'Kenya (KES)', TZ:'Tanzania (TZS)', UG:'Uganda (UGX)', NG:'Nigeria (NGN)', GH:'Ghana (GHS)', ZA:'Afrika Kusini (ZAR)', ET:'Ethiopia (ETB)', EG:'Misri (EGP)' };
const crops = { maize:'Mahindi', rice:'Mpunga', cassava:'Muhogo', yam:'Viazi vikuu', sorghum:'Mtama', cowpea:'Kunde', groundnut:'Karanga', soybean:'Soya', cocoa:'Kakao', tomato:'Nyanya', pepper:'Pilipili', onion:'Vitunguu', potato:'Viazi mviringo', plantain:'Ndizi za kupika', cotton:'Pamba', coffee:'Kahawa' };
const methods = { rainfed:'Kilimo cha kutegemea mvua', traditional:'Kilimo cha jadi', improved:'Kilimo kilichoboreshwa', commercial:'Kilimo cha kibiashara' };
const costs = { landPrep:'Maandalizi ya ardhi', seeds:'Mbegu', fertilizer:'Mbolea', chemicals:'Dawa za kilimo', labour:'Kazi', irrigation:'Umwagiliaji', transport:'Usafiri', other:'Gharama nyingine' };

function fields(input) {
  function select(key, label, choices) {
    return `<label for="fp-${key}">${label}</label><select id="fp-${key}" data-key="${key}">${Object.entries(choices).map(([k,v]) => `<option value="${k}"${k === input[key] ? ' selected' : ''}>${v}</option>`).join('')}</select>`;
  }
  function number(key, label, value, min=0, max='', step='any') {
    return `<label for="fp-${key}">${label}</label><input id="fp-${key}" data-key="${key}" type="number" inputmode="decimal" required min="${min}" ${max ? 'max="'+max+'"' : ''} step="${step}" value="${value}">`;
  }
  return [
    select('country','Nchi na sarafu',countries), select('crop','Zao',crops), select('method','Njia ya kilimo',methods),
    number('area','Eneo linalolimwa (hekta)',input.area,0.000001), number('seasons','Idadi ya misimu',input.seasons,1,'','1'),
    number('yieldPerHa','Mavuno kabla ya upotevu (kg kwa hekta kwa msimu)',input.yieldPerHa),
    number('postHarvestLossPct','Upotevu baada ya mavuno (%)',input.postHarvestLossPct,0,100),
    number('pricePerKg','Bei ya kuuza kilo moja',input.pricePerKg),
    '<fieldset><legend>Gharama kwa hekta moja kwa msimu</legend>',
    ...Object.entries(costs).map(([key,label]) => number(key,label,input.costs[key])), '</fieldset>'
  ].join('\n');
}
module.exports = { fields };
