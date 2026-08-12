'use strict';

const SWAHILI_CATEGORIES = [
  ['financial','Fedha, mshahara na kodi','/sw/mshahara-na-kodi/','FI','Mshahara halisi, PAYE, michango, akiba, mikopo, fedha za kigeni na mipango ya kaya.'],
  ['hr-payroll','Malipo na rasilimali watu','/sw/zana-zote/?category=hr-payroll','HR','Gharama ya mwajiri, likizo, muda wa ziada, malipo ya mwisho na uendeshaji wa payroll.'],
  ['document-pdf','Hati na PDF','/sw/hati-na-pdf/','PDF','Unda, unganisha, punguza, badilisha, saini na panga hati ndani ya kivinjari.'],
  ['image-design','Picha na ubunifu','/sw/picha-na-design/','PIC','Badilisha ukubwa na muundo wa picha, panga rangi, tengeneza michoro na pakua matokeo.'],
  ['developer','Zana za wasanidi programu','/sw/zana-za-developer/','DEV','JSON, API, code, maandishi, encoding, hashing na zana za kiufundi zisizotuma data kimya kimya.'],
  ['education','Elimu na masomo','/sw/elimu/','EL','Alama, mitihani, GPA, bajeti ya shule, ufadhili na maandalizi ya mwanafunzi.'],
  ['health','Afya na ustawi','/sw/afya/','AF','Zana za maandalizi na ufuatiliaji zenye mipaka ya usalama na ushauri wa mtaalamu unaoonekana.'],
  ['insurance','Bima','/sw/bima/','BI','Panga nukuu, michango, madai, vifuniko na maswali ya kumuuliza mtoa huduma wa bima.'],
  ['fintech','Fintech na benki','/sw/fintech/','FT','Mobile money, malipo, ada za benki, mikopo ya kidijitali na ulinganisho wa huduma za fedha.'],
  ['agriculture','Kilimo na mifugo','/sw/kilimo/','KI','Mavuno, pembejeo, umwagiliaji, mifugo, gharama za shamba na njia za kufikia soko.'],
  ['ecommerce','Biashara na uzingatiaji','/sw/biashara-na-uzingatiaji/','BIZ','VAT, zuio, usajili, ankara, biashara mtandaoni na wajibu wa biashara kwa nchi.'],
  ['legal','Nyumba, ardhi na sheria','/sw/nyumba-na-ardhi/','ARD','Makazi, mikopo ya nyumba, uhamisho wa mali, mikataba, ardhi na maandalizi ya kisheria.'],
  ['data-productivity','Data na tija','/sw/data-na-tija/','DATA','Uchambuzi, upangaji, usimamizi wa muda, jedwali, ROI na maamuzi ya biashara yanayoweza kuhakikiwa.'],
  ['language','Lugha na tafsiri','/sw/lugha-na-tafsiri/','LG','Tafsiri, transliteration, maandishi, maneno ya kitaalamu na zana za lugha za Afrika.'],
  ['african','Zana za kipekee za Afrika','/sw/zana-zote/?category=african','AFR','Mahitaji ya ndani, mila, sarafu na mifumo ya Afrika isiyowakilishwa vizuri na zana za kimataifa.'],
  ['trade','Biashara ya nje','/sw/biashara-ya-nje/','TRA','Forodha, import na export, gharama ya kuingiza bidhaa, asili na biashara ya kikanda.'],
  ['telecom','Mawasiliano na mtandao','/sw/mawasiliano-na-mtandao/','TEL','Data ya simu, airtime, vifaa, mtandao, USSD na maandalizi ya huduma za mawasiliano.'],
  ['energy','Nishati na huduma','/sw/nishati-na-huduma/','ENE','Umeme, sola, mafuta, mita, jenereta, betri na gharama za matumizi ya nishati.'],
  ['engineering','Ujenzi na uhandisi','/sw/ujenzi-na-uhandisi/','ENG','Vipimo, vifaa, BOQ, miundo, mipango, gharama na zana za eneo la ujenzi.'],
  ['creative','Ubunifu na watayarishi','/sw/ubunifu-na-watayarishi/','CRE','Maudhui, media, bei, ratiba, chapa, picha, sauti na studio za watayarishi.'],
  ['security','Usalama na ulinzi','/sw/zana-zote/?category=security','SAL','Faragha, ushahidi, kuzuia udanganyifu, nywila na maandalizi ya hatari bila hukumu ya uongo.'],
  ['government','Serikali na nyaraka','/sw/serikali-na-nyaraka/','SER','Vitambulisho, kodi za serikali, uchaguzi, leseni, miongozo ya portal na orodha za ukaguzi.'],
  ['small-business','Biashara ndogo','/sw/biashara-ndogo/','SME','Bei, margin, stock, gharama, ankara, cash flow na shughuli za kila siku za biashara ndogo.'],
  ['transport','Usafiri na magari','/sw/usafiri-na-magari/','GAR','Magari, mafuta, safari, delivery, uagizaji, matengenezo na gharama za usafirishaji.'],
  ['travel-tourism','Usafiri na utalii','/sw/usafiri-utalii/','UTA','Bajeti, visa, afya ya safari, ratiba, mizigo na maandalizi ya utalii ndani ya Afrika.'],
  ['personal-finance','Fedha binafsi','/sw/zana-zote/?category=personal-finance','FB','Bajeti, deni, akiba, malengo, gharama za kaya na maamuzi ya fedha ya muda mrefu.'],
  ['diaspora','Diaspora','/sw/zana-zote/?category=diaspora','DIA','Kutuma fedha, uhamaji, kodi, mali na miradi inayovuka mipaka kwa Waafrika wa diaspora.'],
  ['career','Kazi na ajira','/sw/kazi-na-ajira/','AJ','CV, barua za kazi, mahojiano, LinkedIn, mshahara na mipango ya maendeleo ya taaluma.'],
  ['religious-cultural','Dini na utamaduni','/sw/dini-na-utamaduni/','DU','Bajeti, kalenda na maandalizi yanayoheshimu dini, mila na mamlaka ya jamii mbalimbali.'],
  ['climate','Hali ya hewa na mazingira','/sw/hali-ya-hewa-na-mazingira/','HAL','Maji, carbon, hali ya hewa, taka, hatari na mipango ya uendelevu.'],
  ['sports','Michezo na burudani','/sw/michezo/','MIC','Utendaji, timu, matukio, mazoezi na zana za kupanga shughuli za michezo.'],
  ['mining','Madini na uchimbaji','/sw/zana-zote/?category=mining','MAD','Leseni, uzalishaji, royalties, gharama na uchumi wa shughuli za uchimbaji.']
].map(([key,title,href,icon,description])=>({key,title,href,icon,description}));

module.exports = { SWAHILI_CATEGORIES };
