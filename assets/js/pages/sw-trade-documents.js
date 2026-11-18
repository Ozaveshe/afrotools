(function () {
'use strict';

// Each translation is keyed by a dataset identifier, never by an option's position.
const templates = { standard: 'Cheti cha kawaida', afcfta: 'AfCFTA', ecowas: 'ECOWAS', eac: 'EAC', sadc: 'SADC', comesa: 'COMESA' };
const labels = {
  exporter_name: 'Jina la msafirishaji', exporter_address: 'Anwani ya msafirishaji', exporter_country: 'Nchi ya msafirishaji',
  consignee_name: 'Jina la mpokeaji', consignee_address: 'Anwani ya mpokeaji', consignee_country: 'Nchi ya mpokeaji',
  transport_details: 'Njia na usafiri', country_of_origin: 'Nchi ya asili ya bidhaa', goods_description: 'Maelezo ya bidhaa',
  hs_code: 'Msimbo wa HS (tarakimu sita)', quantity: 'Kiasi na kipimo', gross_weight: 'Uzito wa jumla (kg)',
  fob_value: 'Thamani ya FOB (USD)', invoice_number: 'Namba ya ankara', invoice_date: 'Tarehe ya ankara',
  afcfta_ref_number: 'Namba ya kumbukumbu ya AfCFTA (ikiwa ipo)', origin_criteria: 'Kigezo cha asili',
  direct_consignment_declaration: 'Maelezo ya usafirishaji wa moja kwa moja', etls_approval_number: 'Namba ya idhini ya ETLS',
  declaration_place: 'Mahali pa tamko', declaration_date: 'Tarehe ya tamko', authorized_signatory: 'Jina la mwakilishi aliyeidhinishwa',
  designated_authority_stamp: 'Muhuri wa mamlaka', origin_criteria_eac: 'Kigezo cha asili cha EAC',
  origin_criteria_sadc: 'Kigezo cha asili cha SADC', origin_criteria_comesa: 'Kigezo cha asili cha COMESA'
};
const products = { agri_general:'Mazao ya kilimo', coffee_tea:'Kahawa na chai', cocoa:'Kakao na chokoleti', seafood:'Samaki na mazao ya baharini', textiles:'Nguo na mavazi', minerals:'Madini na metali', pharmaceuticals:'Dawa', manufactured:'Bidhaa za viwandani', petroleum:'Bidhaa za petroli', food_processed:'Vyakula na vinywaji vilivyosindikwa' };
const destinations = { AFRICA_AFCFTA:'Eneo la AfCFTA', EU:'Umoja wa Ulaya (EU)', US:'Marekani', CHINA:'China', ECOWAS:'Nchi za ECOWAS', EAC:'Jumuiya ya Afrika Mashariki (EAC)', SADC:'Nchi za SADC', OTHER:'Soko jingine' };
const docs = {
 commercial_invoice:'Ankara ya biashara', packing_list:'Orodha ya vifurushi', bill_of_lading:'Hati ya shehena ya baharini (B/L) au ya angani (AWB)', certificate_of_origin:'Cheti cha asili', insurance_certificate:'Cheti cha bima',
 nepc_registration:'Cheti cha usajili wa NEPC', ness_report:'Ripoti ya ukaguzi wa NESS', sgd:'Tamko la bidhaa (SGD)', ccvo:'Cheti cha thamani na asili (CCVO)', nafdac_export:'Cheti cha kuuza nje cha NAFDAC', phytosanitary:'Cheti cha afya ya mimea', son_cert:'Cheti cha bidhaa cha SON',
 kra_pin:'Cheti cha PIN ya KRA', export_license:'Leseni ya kuuza nje (ikihitajika)', kephis:'Cheti cha KEPHIS', pvoc:'Cheti cha PVoC', dvs:'Cheti cha afya cha DVS', eac_coo:'Cheti cha asili cha EAC',
 sars_registration:'Usajili wa forodha wa SARS (RCG10)', itac_permit:'Kibali cha ITAC', sadc_coo:'Cheti cha asili cha SADC', ppecb:'Cheti cha PPECB', daff_permit:'Cheti cha afya ya mimea cha DAFF',
 gepa_registration:'Usajili wa GEPA', gra_export_dec:'Tamko la kuuza nje la GRA', cocobod:'Leseni ya COCOBOD', epa_permit:'Kibali cha kuuza nje cha EPA', fda_certificate:'Cheti cha afya cha FDA', minerals_comm:'Leseni ya Tume ya Madini',
 goeic_card:'Kadi ya muuzaji nje ya GOEIC', chamber_cert:'Cheti cha chemba ya biashara', norms_cert:'Cheti cha viwango vya Misri', health_cert:'Cheti cha afya',
 moti_license:'Leseni ya kuuza nje ya wizara ya biashara', ecx_clearance:'Idhini ya ECX kwa bidhaa husika', coffee_cert:'Cheti cha mamlaka ya kahawa na chai', nbp_permit:'Kibali cha benki kuu',
 tra_registration:'Usajili wa mlipakodi wa TRA', tra_export_dec:'Tamko la kuuza nje la TRA', tfda_cert:'Cheti cha TFDA', phytosanitary_tz:'Cheti cha afya ya mimea',
 ura_registration:'Usajili wa mlipakodi wa URA', uwec_cert:'Kibali cha UWEC', phytosanitary_ug:'Cheti cha afya ya mimea cha MAAIF', unbs_cert:'Cheti cha viwango cha UNBS',
 rra_registration:'Usajili wa mlipakodi wa RRA', rdb_export_permit:'Kibali cha kuuza nje cha RDB', naeb_cert:'Cheti cha NAEB', rbs_cert:'Cheti cha viwango cha RBS',
 apex_registration:'Usajili wa APEX-CI', dde:'Tamko la kina la kuuza nje (DDE)', conseil_cafe_cacao:'Leseni ya Conseil Café-Cacao', phytosanitary_ci:'Cheti cha afya ya mimea',
 asepex_card:'Kadi ya muuzaji nje ya ASEPEX', dae:'Tamko la kuuza nje (DAE)', cert_conformite:'Cheti cha ulinganifu', phytosanitary_sn:'Cheti cha afya ya mimea',
 mincommerce_cert:'Usajili wa muuzaji nje wa MINCOMMERCE', customs_dec_cm:'Tamko la forodha la kuuza nje', cocobod_cm:'Cheti cha ONCC', phytosanitary_cm:'Cheti cha afya ya mimea',
 rc_maroc:'Usajili wa biashara (RC)', de_maroc:'Tamko la kuuza nje', onssa_cert:'Cheti cha afya cha ONSSA', ompic_cert:'Cheti cha hakimiliki ya viwanda cha OMPIC',
 cepex_registration:'Usajili wa CEPEX', customs_dec_tn:'Tamko la kuuza nje la SINDA', inorpi_cert:'Cheti cha viwango cha INNORPI', health_cert_tn:'Cheti cha afya',
 aipex_registration:'Usajili wa AIPEX', customs_dec_ao:'Tamko la forodha (DU)', banco_angola:'Idhini ya fedha za kigeni ya benki kuu', sonangol_permit:'Kibali cha Sonangol',
 zda_registration:'Usajili wa muuzaji nje wa ZDA', zra_export_dec:'Tamko la kuuza nje la ZRA', mcm_permit:'Kibali cha madini cha MCM', phytosanitary_zm:'Cheti cha afya ya mimea cha MACO',
 zimra_registration:'Usajili wa muuzaji nje wa ZIMRA', zimra_export_dec:'Tamko la kuuza nje la ZIMRA (IM/EX)', rba_permit:'Kibali cha kuuza nje cha RBA', phytosanitary_zw:'Cheti cha afya ya mimea cha PPRI',
 quality_cert:'Cheti cha ubora', cocoa_board_cert:'Cheti cha bodi ya kakao', catch_certificate:'Cheti cha uvuvi', mineral_export_permit:'Kibali cha kuuza madini nje', regulatory_cert:'Cheti cha mamlaka ya udhibiti', gmp_cert:'Cheti cha GMP', standards_cert:'Cheti cha viwango', energy_ministry_permit:'Kibali cha wizara ya nishati', food_safety_cert:'Cheti cha usalama wa chakula'
};
const requirementLabels = {
  "AfCFTA Certificate of Origin (from designated authority)": "Cheti cha asili cha AfCFTA kutoka mamlaka husika",
  "Proof of direct consignment (not routed through non-member)": "Uthibitisho wa usafirishaji wa moja kwa moja",
  "Product must meet AfCFTA Rules of Origin (WO, CTH, or 35-40% VA)": "Kagua kanuni za asili za AfCFTA kwa bidhaa husika",
  "Customs declaration with AfCFTA preference claim": "Tamko la forodha linaloomba upendeleo wa AfCFTA",
  "EUR.1 Movement Certificate or REX self-certification (for ACP/EPA countries)": "Cheti cha EUR.1 au tamko la REX kwa nchi na mikataba husika",
  "CE marking (for applicable products)": "Alama ya CE kwa bidhaa husika",
  "HACCP certification (food products)": "Cheti cha HACCP kwa chakula",
  "Phytosanitary certificate (fresh produce)": "Cheti cha afya ya mimea kwa mazao mabichi",
  "EU-approved health certificate (animal products)": "Cheti cha afya kinachokubalika EU kwa bidhaa za wanyama",
  "Registration in TRACES system (animal/plant products)": "Usajili wa TRACES kwa bidhaa za wanyama au mimea",
  "FLEGT license (timber products)": "Leseni ya FLEGT kwa mbao",
  "AGOA Certificate of Origin (for eligible countries/products)": "Cheti cha asili cha AGOA ikiwa nchi na bidhaa zinastahiki",
  "FDA Prior Notice (food, drugs, cosmetics, devices)": "Taarifa ya awali kwa FDA kwa bidhaa husika",
  "ISF 10+2 filing (security filing, 24hrs before loading)": "Taarifa ya usalama ya ISF 10+2 kabla ya kupakia",
  "USDA APHIS certificate (agricultural products)": "Cheti cha USDA APHIS kwa mazao ya kilimo",
  "FCC certification (electronics)": "Cheti cha FCC kwa vifaa vya elektroniki",
  "EPA compliance certificate (vehicles, chemicals)": "Cheti cha ulinganifu cha EPA kwa magari au kemikali",
  "China CIQ Inspection Certificate (for food/agricultural goods)": "Cheti cha ukaguzi cha CIQ kwa chakula au mazao",
  "GB standards conformity certificate": "Cheti cha ulinganifu na viwango vya GB",
  "Pre-registration with GACC (General Administration of Customs China) — food products": "Usajili wa awali wa chakula kwa GACC",
  "Certificate of Origin (preferential under APTA/bilateral agreements)": "Cheti cha asili kwa mikataba husika",
  "Chinese import label compliance": "Lebo inayokidhi masharti ya uagizaji ya China",
  "ECOWAS Certificate of Origin": "Cheti cha asili cha ECOWAS",
  "Minimum 30% local value added OR change in tariff heading": "Kagua ongezeko la thamani la ndani au badiliko la kichwa cha ushuru",
  "Product cannot be from prohibited list": "Kagua orodha ya bidhaa zilizozuiliwa",
  "ECOWAS Trade Liberalization Scheme (ETLS) approval for manufacturer": "Idhini ya ETLS kwa mtengenezaji",
  "EAC Certificate of Origin (Form C)": "Cheti cha asili cha EAC (Fomu C)",
  "CIF value of non-originating materials ≤60% of total cost, OR CTH": "Kagua thamani ya CIF ya vifaa visivyo vya asili au badiliko la kichwa cha ushuru (CTH)",
  "Issued by KRA/TRA/URA/RRA customs authority": "Thibitisha kwa mamlaka ya forodha inayotoa cheti",
  "SADC Certificate of Origin": "Cheti cha asili cha SADC",
  "Generally 35% local value added": "Kagua sharti la ongezeko la thamani la ndani",
  "Product-specific rules may apply": "Kagua kanuni mahsusi za bidhaa",
  "Issued by customs authority of exporting country": "Thibitisha kwa forodha ya nchi inayouza nje",
  "Standard Certificate of Origin (Chamber of Commerce)": "Cheti cha kawaida cha asili kutoka chemba ya biashara",
  "Bilateral trade agreement form if applicable": "Fomu ya makubaliano ya biashara ya nchi mbili ikihitajika",
  "Consular legalization may be required for some destinations": "Kagua kama uthibitisho wa ubalozi unahitajika",
  "Apostille on notarized documents if required": "Kagua kama hati zilizothibitishwa zinahitaji apostille"
};

function country(code) {
  return /^[A-Z]{2}$/.test(code) ? new Intl.DisplayNames(['sw'], {type:'region'}).of(code) : code;
}
function option(value, label, selected) {
  return '<option value="'+value+'"'+(selected ? ' selected' : '')+'>'+label+'</option>';
}
function select(name, label, choices, selected) {
  return '<label>'+label+'<select name="'+name+'" required>'+Object.entries(choices).map(([id,v]) => option(id,v,id===selected)).join('')+'</select></label>';
}
function formMarkup(app) {
  if (app.id === 'export-docs-trade') {
    const { EXPORT_DOCS } = require('../../../data/trade/export-docs-data');
    const countries = Object.fromEntries(Object.keys(EXPORT_DOCS.countries).map(code => [code,country(code)]));
    return '<p>Chagua nchi ya kuondoka, aina ya bidhaa na soko la kwenda. Hakikisha nyaraka zinazohitajika kwa bidhaa yako na mamlaka husika.</p><form data-trade-form data-trade-document>'+
      select('countryCode','Nchi ya kuuza nje',countries,'KE')+select('productCategory','Aina ya bidhaa',products,'coffee_tea')+select('destination','Soko la kwenda',destinations,'EAC');
  }
  const { COO_TEMPLATES } = require('../../../data/trade/coo-templates');
  const fields = Object.entries(labels).filter(([key]) => key !== 'designated_authority_stamp').map(([key,label]) => {
    const supported = Object.keys(templates).filter(t => COO_TEMPLATES.templates[t].fields.includes(key));
    const isCountry = key.endsWith('_country') || key === 'country_of_origin';
    const attr = isCountry ? ' maxlength="2" pattern="[a-zA-Z]{2}" placeholder="KE" autocapitalize="characters"' : key.endsWith('_date') ? ' type="date"' : key === 'hs_code' ? ' pattern="[0-9]{6}|[0-9]{4}[.][0-9]{2}" placeholder="0901.11"' : '';
    return '<label data-templates="'+supported.join(' ')+'"'+(supported.includes('afcfta')?'':' hidden')+'>'+label+(isCountry?' (msimbo wa herufi mbili)':'')+'<input name="'+key+'"'+attr+'></label>';
  }).join('');
  return '<p>Jaza taarifa zako mwenyewe. Unaweza kuacha sehemu zisizojulikana wazi. Rasimu hii haitoi cheti, muhuri wala uthibitisho wa asili.</p><form data-trade-form data-trade-document>'+
    select('templateId','Aina ya rasimu',templates,'afcfta')+fields+
    '<details><summary>Kagua vigezo vya AfCFTA (hiari)</summary><label><input type="checkbox" name="hasWhollyObtained"> Bidhaa imepatikana kabisa nchini</label><label><input type="checkbox" name="hasCTH"> Kichwa cha ushuru kimebadilika (CTH)</label><label><input type="checkbox" name="specificProcess"> Mchakato maalumu umetumika (SP)</label><label>Bei kutoka kiwandani<input type="number" step="any" min="0" name="exWorksPrice"></label><label>Gharama ya vifaa visivyo vya asili (sarafu ileile)<input type="number" step="any" min="0" name="nonOriginatingMaterialsCost"></label></details>';
}
function attach() {
  const form = document.querySelector('[data-trade-form]');
  const el = name => form.elements.namedItem(name);
  const coo = Boolean(el('templateId'));
  let legacyStamp = '';
  function sync() {
    if (!coo) return;
    for (const field of form.querySelectorAll('[data-templates]')) {
      field.hidden = !field.dataset.templates.split(' ').includes(el('templateId').value);
      field.querySelector('input').disabled = field.hidden;
    }
  }
  function readInput() {
    if (!coo) return {countryCode:el('countryCode').value, productCategory:el('productCategory').value, destination:el('destination').value};
    const templateId = el('templateId').value;
    const fields = {};
    for (const key of COO_TEMPLATES.templates[templateId].fields) {
      if (key === 'designated_authority_stamp') {
        if (legacyStamp) fields[key] = legacyStamp;
      } else {
        const value = el(key).value.trim();
        fields[key] = key.endsWith('_country') || key === 'country_of_origin' ? value.toUpperCase() : value;
      }
    }
    const originCheck = {hasWhollyObtained:el('hasWhollyObtained').checked, hasCTH:el('hasCTH').checked, processType:el('specificProcess').checked?'SP':''};
    for (const key of ['exWorksPrice','nonOriginatingMaterialsCost']) {
      if (el(key).value !== '') originCheck[key]=Number(el(key).value);
    }
    return {templateId,fields,originCheck};
  }
  function validate(input) {
    if (!input || typeof input !== 'object') throw Error('Kagua taarifa za fomu.');
    if (!coo) {
      if (!Object.hasOwn(EXPORT_DOCS.countries,input.countryCode) || !Object.hasOwn(products,input.productCategory) || !Object.hasOwn(destinations,input.destination)) throw Error('Chagua nchi, bidhaa na soko lililopo kwenye orodha.');
      return;
    }
    if (!Object.hasOwn(templates,input.templateId) || !input.fields || typeof input.fields !== 'object') throw Error('Chagua aina ya rasimu inayotambuliwa.');
    if (!COO_TEMPLATES.templates[input.templateId].fields.some(key => key !== 'designated_authority_stamp' && String(input.fields[key] || '').trim())) throw Error('Jaza angalau taarifa moja ya mzigo au msafirishaji kabla ya kutengeneza rasimu.');
    const check = input.originCheck || {};
    for (const key of ['exWorksPrice','nonOriginatingMaterialsCost']) {
      if (check[key] != null && (!Number.isFinite(Number(check[key])) || Number(check[key]) < 0)) throw Error('Ingiza kiasi kisicho hasi.');
    }
  }
  function setInput(input) {
    validate(input);
    if (!coo) { for (const key of ['countryCode','productCategory','destination']) el(key).value = input[key]; return; }
    el('templateId').value = input.templateId;
    legacyStamp = input.fields.designated_authority_stamp || '';
    for (const key of Object.keys(labels)) if (el(key)) el(key).value = input.fields[key] ?? '';
    const check = input.originCheck || {};
    for (const key of ['hasWhollyObtained','hasCTH']) el(key).checked = check[key] === true;
    el('specificProcess').checked = check.processType === 'SP';
    for (const key of ['exWorksPrice','nonOriginatingMaterialsCost']) el(key).value = check[key] ?? '';
    sync();
  }
  function rows(result) {
    if (coo) {
      const draft = result.draft;
      const rows = [['Hali','Rasimu pekee; haijatolewa wala kuthibitishwa na mamlaka.'],['Aina ya rasimu',templates[draft.templateId]]];
      for (const [key,field] of Object.entries(draft.fields)) {
        if (key === 'designated_authority_stamp') continue;
        const code = String(field.value || '').toUpperCase();
        const display = (key.endsWith('_country') || key === 'country_of_origin') && /^[A-Z]{2}$/.test(code) ? country(code)+' ('+code+')' : field.value;
        rows.push([labels[key] || field.label,display || 'Haijajazwa']);
      }
      for (const rule of result.originCriteria) rows.push(['Kigezo cha AfCFTA '+rule.criteria, (rule.percentage ? rule.percentage+'% · ' : '')+(rule.qualifies ? 'Kinalingana na taarifa ulizoingiza; thibitisha kwa mamlaka.' : 'Hakijatimizwa kwa taarifa ulizoingiza.')]);
      return rows;
    }
    const input = readInput();
    const rows = [['Matumizi','Orodha ya kupanga. Thibitisha nyaraka na mamlaka husika kabla ya kusafirisha.'],['Nchi ya kuuza nje',country(input.countryCode)],['Soko la kwenda',destinations[input.destination]],['Bidhaa',products[input.productCategory]]];
    for (const [group,records] of [['Nyaraka za kawaida',result.universal],['Nyaraka za nchi ya kuuza nje',result.countrySpecific],['Masharti ya soko la kwenda',result.destinationSpecific]]) {
      for (const record of records) rows.push([group,(docs[record.id] || requirementLabels[record.name] || record.name)+' · '+(record.mandatory===true?'ya lazima kulingana na orodha':'ikihitajika')]);
    }
    for (const id of result.productCategory?.extraDocs || []) rows.push(['Kagua kwa bidhaa hii',docs[id] || id]);
    const notes = [
      ['For intra-African trade','Kagua cheti cha asili na mamlaka ya kuuza nje kabla ya kuomba upendeleo wa ushuru.'],
      ['Check if your country','Thibitisha makubaliano ya biashara na Umoja wa Ulaya na iwapo EUR.1 au REX inatumika.'],
      ['Check AGOA','Thibitisha ustahiki wa nchi na bidhaa chini ya AGOA kwa tarehe ya kuingiza bidhaa Marekani.'],
      ['All cocoa exports','Kwa kakao ya Côte d’Ivoire, kagua leseni na Conseil Café-Cacao.'],
      ['All Ghanaian cocoa','Kwa kakao ya Ghana, thibitisha idhini na COCOBOD.'],
      ['Ethiopian coffee','Kwa kahawa ya Ethiopia, kagua ukadiriaji na uthibitishaji kupitia ECX.'],
      ['Start document preparation','Anza maandalizi mapema na uhakiki muda wa uhalali wa vyeti vya afya.']
    ];
    for (const note of result.observations || []) {
      const match = notes.find(([prefix]) => note.text.startsWith(prefix));
      rows.push(['Jambo la kuhakiki',match ? match[1] : note.text]);
    }
    return rows;
  }
  if (coo) {
    el('templateId').addEventListener('change',sync);
    form.addEventListener('reset',()=>{legacyStamp='';setTimeout(sync,0);});
    sync();
  }
  window.swTradeForm = {readInput,setInput,validate,rows};
}
if (typeof module !== 'undefined' && module.exports) module.exports = { formMarkup };
else attach();
}());
