/* Hausa presentation for the maintained minimum-wage engine and comparison controller. */
(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const engine = window.AfroTools && window.AfroTools.MinWageEngine;
  if (!$('ha-wage-reference')) return;
  function unavailable(message) {
    $('dependency-status').hidden=false; $('dependency-status').textContent=message;
    document.querySelectorAll('main input,main select,main button').forEach(node=>{node.disabled=true;});
  }
  if (!engine) { unavailable('An kasa loda kundin albashi. Sake loda shafin kafin yin kwatanci.'); return; }
  window.AfroTools.MinimumWageLocale = {
    copy: {
      invalid:'Shigar da albashin wata mai inganci, sifiri ko sama.',
      missing:'Babu adadin da za a kwatanta a wannan rikodin. Duba doka da fannin aiki; rashin rikodi ba ya tabbatar da cewa babu mafi ƙarancin albashi a doka.',
      above:'Albashin ya kai adadin kwatanci da aka zaɓa', below:'Albashin bai kai adadin kwatanci da aka zaɓa ba',
      national:'Rikodin adadin ƙasa', salary:'Albashin wata', reference:'Adadin kwatanci na wata', difference:'Bambanci',
      assumptions:'Juyawar kwatanci tana amfani da awa 8 a rana da kwanaki 22 a wata idan adadin na awa ko rana ne. Wannan ba tabbatar da bin doka ba ne; duba ainihin awanni, fanni, wuri da ranar fara aiki.',
      monthly:'Duba lokacin da sharuddan da suka dace. Wannan ba tabbatar da bin doka ba ne; tantance fanni, wuri da ranar fara aiki.',
      changed:'An canza bayanai. Sake dubawa don sabon kwatanci.', effective:'Ranar fara aiki da aka rubuta',
      ngSources:'Duba waɗanda dokar Najeriya ta shafa da tushe', ngCoverage:' Ga aikin da dokar ta shafa kawai. '
    },
    labels: {
      recorded:'Adadin wata da aka rubuta', derived:'Makadirar wata don kwatanci', basis:'Lokacin adadi', none:'Ba a rubuta ba', monthly:'wata', daily:'rana', hourly:'awa',
      limits:'Wannan rikodin kundi ne. Ranar fara aiki ba ranar tantance tushe ba ce. Ba a tabbatar da cewa adadin har yanzu yana aiki ko ya shafi kowa a nan ba; duba tushen hukuma.',
      fx:'Adadin USD ya dogara da canjin kuɗi marar kwanan wata a kundin; ba farashin yanzu ba ne.',
      recordViews:'Jadawalin ƙasashe yana nuna adadin wata da aka rubuta a kundin. Katin da kwatancin albashi suna amfani da kwanaki 22 a wata da awa 8 a rana ga adadin rana ko awa. Adadin na iya bambanta.',
      precision:'Ana zagaye kwatanci zuwa lambobi biyu bayan ɗigo; wannan ba tabbatar da bin doka ba ne.',
      headers:['Ƙasa','Lambar ƙasa','Nau’in kuɗi','Adadin wata da aka rubuta','Makadirar wata don kwatanci','Lokacin adadi','Adadi bisa lokacin','Hasashen juyawa','USD da aka rubuta (kimanin)','Ranar fara aiki da aka rubuta','Dokar da aka rubuta','Iyakokin tushe','Iyakokin USD'],
      unset:'Babu rikodi', exact:'Adadin wata da aka rubuta; babu juyawa', derivedRule:'Kwanaki 22 a wata; awa 8 a rana ga adadin awa'
    }
  };
  const ng = engine.getCountry('NG');
  const records = window.MINIMUM_WAGES || {};
  // A declared receipt dependency is required; never silently expose the superseded Nigeria date or rates.
  if (!ng || ng.effectiveDate !== '2024-07-29' || records.NG?.nationalMinimum?.effectiveDate !== '2024-07-29') {
    unavailable('Ba a loda gyaran tushen Najeriya da ake buƙata ba. Ba za a nuna kwatanci daga tsohon rikodin ba tukuna.');
    return;
  }
  const names = new Intl.DisplayNames(['ha'], {type:'region'});
  const countryNames = {"DZ": "Aljeriya", "AO": "Angola", "BJ": "Benin", "BW": "Botswana", "BF": "Burkina Faso", "BI": "Burundi", "CM": "Kamaru", "CV": "Cabo Verde", "CF": "Jamhuriyar Afirka ta Tsakiya", "TD": "Chadi", "KM": "Komoros", "CG": "Jamhuriyar Kongo", "CD": "Jamhuriyar Dimokuraɗiyyar Kongo", "CI": "Côte d’Ivoire", "DJ": "Jibuti", "EG": "Masar", "GQ": "Gini ta Ikwato", "ER": "Eritiriya", "SZ": "Eswatini", "ET": "Habasha", "GA": "Gabon", "GM": "Gambiya", "GH": "Gana", "GN": "Gini", "GW": "Gini-Bissau", "KE": "Kenya", "LS": "Lesoto", "LR": "Liberiya", "LY": "Libiya", "MG": "Madagaskar", "MW": "Malawi", "ML": "Mali", "MR": "Muritaniya", "MU": "Morishas", "MA": "Maroko", "MZ": "Mozambik", "NA": "Namibiya", "NE": "Nijar", "NG": "Najeriya", "RW": "Ruwanda", "ST": "São Tomé da Príncipe", "SN": "Senegal", "SC": "Seychelles", "SL": "Saliyo", "SO": "Somaliya", "ZA": "Afirka ta Kudu", "SS": "Sudan ta Kudu", "SD": "Sudan", "TZ": "Tanzaniya", "TG": "Togo", "TN": "Tunisiya", "UG": "Uganda", "ZM": "Zambiya", "ZW": "Zimbabwe"};
  window.AfroTools.MinimumWageLocale.countryNames = countryNames;
  const name = country => countryNames[country.code] || names.of(country.code) || country.name;
  const number = value => new Intl.NumberFormat('ha', {maximumFractionDigits:2}).format(value);
  const periods = {monthly:'a wata',daily:'a rana',hourly:'a awa'};
  const categories = {general:'Adadin ƙasa na gama gari',farm:'Ma’aikatan gona',domestic:'Ma’aikatan gida',epwp:'Shirin ayyukan jama’a na EPWP'};
  window.AfroTools.MinimumWageLocale.categoryNames = categories;
  const countries = engine.getAllCountries('name').sort((a,b)=>name(a).localeCompare(name(b),'ha'));
  function option(select,value,label) { const node=document.createElement('option');node.value=value;node.textContent=label;select.append(node); }
  for (const country of countries) for (const id of ['country','compare-country','vf-country']) option($(id),country.code,name(country));
  $('country').value='NG';
  function sourceStatus(country) {
    if (country.code === 'NG') return 'Ranar fara aiki da waɗanda dokar ta shafa suna da tushe a takardun da ke ƙasa. Duba ko dokar ta shafi aikin; babu adadin ƙasa na NGN 50,000 ga ƙananan masu aiki ko ma’aikatan gida a wannan rikodin.';
    if (country.code === 'ZA' || country.code === 'GH') return 'An haɗa tushen hukuma da ke cikin kundin a ƙasa. Ranar fara aiki da ranar dubawar da aka rubuta sun bambanta. Duba takamaiman fanni da sharuddan da suka dace.';
    return 'Rikodin kundin da ba a sake tantance halinsa na yanzu a wannan shafin ba. Tantance adadin, fanni da ranar fara aiki daga hukumar da ta dace kafin yanke shawara.';
  }
  function sources(country) {
    const box=$('official-sources');box.replaceChildren();
    const record=records[country.code] || {};
    if (!['NG','ZA','GH'].includes(country.code)) return;
    const entries=record.sourceLinks || record.sources || [];
    for (const entry of entries) {
      const a=document.createElement('a');a.href=entry.url;a.textContent=entry.label || entry.title;a.target='_blank';a.rel='noopener';
      const item=document.createElement('li');item.append(a);box.append(item);
    }
    if (record.lastVerified) { const item=document.createElement('li');item.textContent='Ranar dubawar da kundin ya rubuta: '+record.lastVerified+'. Wannan ba sabon tabbacin halin yau ba ne.';box.append(item); }
  }
  function selection() {
    const country=engine.getCountry($('country').value);
    if (!country) return {country:null};
    const category=(engine.getStateRates(country.code) || []).find(row=>row.code===$('state-select').value);
    return {country,category,basis:category?.basis || country.basis,amount:category?category.rate:country.basis==='hourly'?country.hourly:country.basis==='daily'?country.daily:country.monthly};
  }
  window.renderCountry = function () {
    const {country,category,basis,amount}=selection();
    if (!country) { $('r-heading').textContent='Zaɓi ƙasa'; return; }
    $('r-heading').textContent=name(country)+' — '+(category?categories[category.code] || category.name:'Rikodin adadin ƙasa');
    $('r-rate').textContent=amount>0?number(amount)+' '+country.currency+' '+(periods[basis] || basis):'Ba a rubuta adadi a kundin ba';
    $('r-monthly').textContent=country.monthly>0?number(country.monthly)+' '+country.currency:'Babu rikodi';
    $('r-details').replaceChildren();
    for (const [label,value] of [['Ƙasa',name(country)],['Nau’in kuɗi',country.currency],['Ranar fara aiki da aka rubuta',category?.effectiveDate || country.effectiveDate],['Sunan doka (harshen tushe)',country.law]]) {
      const p=document.createElement('p'),strong=document.createElement('strong');strong.textContent=label+': ';p.append(strong,document.createTextNode(value || 'Ba a rubuta ba'));$('r-details').append(p);
    }
    $('source-context').textContent=sourceStatus(country);sources(country);
    $('ng-wage-sources').hidden=country.code!=='NG';
    const other=engine.getCountry($('compare-country').value);
    $('country-comparison').textContent=other?name(country)+': '+(country.monthly>0?number(country.monthly)+' '+country.currency:'Babu rikodi')+'; '+name(other)+': '+(other.monthly>0?number(other.monthly)+' '+other.currency:'Babu rikodi')+'. Adadin wata na kundi ne. Nau’in kuɗi da lokacin adadi na iya bambanta; wannan ba kwatancin ƙarfin saye ba ne.':'Zaɓi ƙasa ta biyu don kallon rikodin ƙasashen biyu. Ba a canza nau’in kuɗi ko tsara matsayin ƙarfin saye ba.';
  };
  window.onStateChange = function () { window.renderCountry(); };
  function countryChanged() {
    $('state-select').replaceChildren();option($('state-select'),'','Rikodin adadin ƙasa');
    for (const row of engine.getStateRates($('country').value) || []) option($('state-select'),row.code,categories[row.code] || row.name);
    $('state-select').disabled=$('state-select').options.length<2;
    window.renderCountry();
  }
  function table() {
    const query=$('country-search').value.trim().toLocaleLowerCase('ha');
    const body=$('country-rows');body.replaceChildren();let count=0;
    for (const country of countries) {
      if (!(name(country)+' '+country.name+' '+country.code+' '+country.currency).toLocaleLowerCase('ha').includes(query)) continue;
      const row=document.createElement('tr');
      for (const value of [name(country),country.code,country.currency,country.monthly>0?number(country.monthly):'Babu rikodi',periods[country.basis] || country.basis,country.effectiveDate || 'Ba a rubuta ba']) {const td=document.createElement('td');td.textContent=value;row.append(td);}
      body.append(row);count++;
    }
    $('country-count').textContent='Rikodi '+count+' cikin '+countries.length+'. Rashin rikodi ba hujjar rashin mafi ƙarancin albashi a doka ba ne.';
  }
  $('country').addEventListener('change',countryChanged);
  $('state-select').addEventListener('change',()=>window.onStateChange());
  $('compare-country').addEventListener('change',()=>window.renderCountry());
  $('country-search').addEventListener('input',table);
  // The shared controller installs its wrappers after this file, before DOMContentLoaded.
  document.addEventListener('DOMContentLoaded',()=>{countryChanged();table();});
})();
