'use strict';
// Native teaching text. IDs, options and correct-answer positions come from the
// English bank; English assessment passages and questions are never translated.
const maths = {
  m1: ['Shule inanunua madaftari 240. Sehemu ya 3/8 ya madaftari yanatumika katika muhula wa kwanza. Yanabaki madaftari mangapi?', ['Yaliyotumika: (3/8) × 240 = 90.', 'Yaliyobaki: 240 − 90 = 150.'], 'Swali linauliza yaliyobaki, si yaliyotumika.'],
  m2: ['Bei ya begi baada ya punguzo la 10% ni ₦18,000. Bei yake kabla ya punguzo ilikuwa kiasi gani?', ['Bei iliyopunguzwa ni 90% ya bei ya awali.', 'Bei ya awali = 18,000 ÷ 0.90 = ₦20,000.'], 'Kuongeza 10% kwenye bei mpya hutumia msingi usio sahihi.'],
  m3: ['Ada na Musa wanagawana ₦12,000 kwa uwiano wa 2:3. Musa anapata kiasi gani?', ['Jumla ya sehemu ni 2 + 3 = 5.', 'Sehemu ya Musa: (3/5) × 12,000 = ₦7,200.'], 'Tumia jumla ya sehemu kama kigawanyo.'],
  m4: ['Andika 0.00072 katika umbo la kisayansi.', ['Hamisha nukta nafasi nne kulia kupata 7.2.', 'Fidia uhamisho huo: 0.00072 = 7.2 × 10⁻⁴.'], 'Namba ya mbele iwe angalau 1 lakini chini ya 10.'],
  m5: ['Tatua 3(2x − 1) = 2x + 13.', ['Fungua mabano: 6x − 3 = 2x + 13.', 'Kusanya vigeu: 4x = 16, hivyo x = 4.', 'Hakiki: 3(8 − 1) = 21 na 8 + 13 = 21.'], 'Zidisha kila sehemu ndani ya mabano kwa 3.'],
  m6: ['Ikiwa x + y = 11 na 2x − y = 7, tafuta y.', ['Jumlisha milinganyo: 3x = 18, hivyo x = 6.', 'Weka x = 6 katika x + y = 11: y = 5.'], 'Jibu linalotakiwa ni y, si x.'],
  m7: ['Tatua x² − 7x + 12 = 0.', ['Namba zenye zao 12 na jumla −7 ni −3 na −4.', 'Kwa hiyo (x − 3)(x − 4) = 0.', 'Hivyo x = 3 au x = 4.'], 'x − 3 huwa sifuri wakati x = 3, si −3.'],
  m8: ['Rahisisha (x² − 9)/(x − 3), ambapo x ≠ 3.', ['Tofauti ya miraba: x² − 9 = (x − 3)(x + 3).', 'Gawanya kwa kigezo kisicho sifuri x − 3 kupata x + 3.'], 'Futa vigezo vya kuzidisha, si vipashio vya kujumlisha. x = 3 bado hairuhusiwi.'],
  m9: ['Katika A = πr², A > 0 na r ni radius. Andika r kwa kutumia A.', ['Gawanya kwa π: r² = A/π.', 'Radius ni chanya, hivyo r = √(A/π).'], 'Mzizi wa pili unahusu sehemu yote A/π.'],
  m10: ['Mfuatano wa hesabu una neno la kwanza 5 na tofauti ya kudumu 3. Neno la kumi na mbili ni lipi?', ['Tumia aₙ = a + (n − 1)d.', 'a₁₂ = 5 + 11 × 3 = 38.'], 'Kuna tofauti kumi na moja kati ya neno la kwanza na la kumi na mbili.'],
  m11: ['Pande zinazokutana kwa pembe mraba katika pembetatu zina urefu wa 9 cm na 12 cm. Tafuta urefu wa upande mkabala na pembe mraba.', ['Kwa kanuni ya Pythagoras: c² = 9² + 12² = 225.', 'c = √225 = 15 cm.'], 'Jumlisha miraba kabla ya kupata mzizi wa pili.'],
  m12: ['Ngazi yenye urefu wa 10 m inafanya pembe ya 30° na ardhi tambarare. Inafikia ukuta ulio wima kwenye kimo gani?', ['Ngazi ndiyo upande mkabala na pembe mraba; kimo kiko mkabala na 30°.', 'Kimo = 10 sin 30° = 10 × 1/2 = 5 m.'], 'Kosaini ingetoa umbali wa mlalo kutoka ukutani.'],
  m13: ['Tafuta eneo la sekta ya duara yenye radius 7 cm na pembe 90°. Tumia π = 22/7.', ['Sekta ni 90/360 = 1/4 ya duara.', 'Eneo = (1/4) × (22/7) × 7² = 38.5 cm².'], 'Eneo hutumia πr²; urefu wa tao hutumia 2πr.'],
  m14: ['Vipimo vya ndani vya tangi la mstatili ni 80 cm, 50 cm na 40 cm. Lina ujazo wa lita ngapi? Lita 1 = 1,000 cm³.', ['Ujazo = 80 × 50 × 40 = 160,000 cm³.', 'Uwezo = 160,000 ÷ 1,000 = lita 160.'], 'Kokotoa ujazo kabla ya kubadili sentimita za ujazo kuwa lita.'],
  m15: ['Kila pembe ya ndani ya poligoni yenye pande na pembe sawa ni 150°. Ina pande ngapi?', ['Pembe ya nje = 180° − 150° = 30°.', 'Jumla ya pembe za nje ni 360°: 360/30 = pande 12.'], 'Gawanya kwa pembe ya nje, si ya ndani.'],
  m16: ['Tafuta mteremko wa mstari unaopita kwenye (2, 3) na (6, 11).', ['Mteremko ni mabadiliko ya y yakigawanywa kwa mabadiliko ya x.', '(11 − 3)/(6 − 2) = 8/4 = 2.'], 'Tumia mpangilio mmoja wa nukta katika kutoa.'],
  m17: ['Alama 2, 3 na 4 zinatokea mara 3, 2 na 5 kwa mpangilio huo. Tafuta wastani.', ['Jumla ya marudio = 3 + 2 + 5 = 10.', 'Jumla yenye uzani = 2 × 3 + 3 × 2 + 4 × 5 = 32.', 'Wastani = 32/10 = 3.2.'], 'Zidisha kila alama kwa idadi ya marudio yake.'],
  m18: ['Tafuta mediani ya 8, 3, 11, 5, 9 na 6.', ['Panga: 3, 5, 6, 8, 9, 11.', 'Kuna namba sita; wastani wa mbili za katikati ni (6 + 8)/2 = 7.'], 'Panga data kabla ya kuchagua namba za katikati.'],
  m19: ['Mfuko una mipira 3 myekundu na 2 ya buluu. Unatoa mipira miwili bila kurudisha. Uwezekano wa yote kuwa myekundu ni upi?', ['Uwezekano wa nyekundu ya kwanza ni 3/5. Kisha hubaki 2 myekundu kati ya mipira 4.', 'Uwezekano = (3/5) × (2/4) = 3/10.'], 'Bila kurudisha, jumla na idadi ya mipira myekundu hupungua.'],
  m20: ['Katika darasa la wanafunzi 40, 24 wanasoma Kifaransa, 18 Kiarabu na 8 lugha zote mbili. Wangapi hawasomi lugha yoyote kati ya hizo?', ['Angalau lugha moja: 24 + 18 − 8 = 34.', 'Hakuna lugha kati ya hizo: 40 − 34 = wanafunzi 6.'], 'Ondoa makutano mara moja ili usihesabu watu wale wale mara mbili.'],
  m21: ['Mtaji wa ₦50,000 unapata riba rahisi ya 8% kwa mwaka kwa miaka 3. Tafuta riba.', ['Riba rahisi = mtaji × kiwango × muda.', 'I = 50,000 × 0.08 × 3 = ₦12,000.'], 'Riba haijumuishi mtaji; usitumie riba inayoongezwa kwenye mtaji.'],
  m22: ['Tatua 5 − 2x > 11.', ['Toa 5: −2x > 6.', 'Gawanya kwa −2 na geuza alama ya ukosefu wa usawa: x < −3.'], 'Kugawanya kwa namba hasi hugeuza alama ya ukosefu wa usawa.'],
  m23: ['Tafuta log₁₀(0.001).', ['0.001 = 10⁻³.', 'Logarithimu ndiyo kipeo cha 10: jibu ni −3.'], 'Logarithimu ya msingi 10 ya namba chanya chini ya 1 ni hasi.'],
  m24: ['Ramani ina kipimo cha 1:50,000. Barabara iliyonyooka ina urefu wa 6 cm kwenye ramani. Urefu halisi ni kilomita ngapi?', ['Urefu halisi = 6 × 50,000 = 300,000 cm.', '100,000 cm = 1 km, hivyo urefu ni 3 km.'], 'Uwiano wa ramani unalinganisha vipimo vya aina moja.']
};
const english = {
  e1: [['Maktaba ilikuwa inafungwa saa kumi alasiri, wakati masomo yalipokuwa yanaisha.', 'Kufungua hadi saa moja jioni kunawaruhusu wanafunzi kuja baada ya masomo.'], 'Tumia tatizo la ratiba lililoelezwa katika kifungu.'],
  e2: [['Wageni wengi wanaonyesha manufaa ya huduma, lakini umeme na usimamizi bado vinahitaji mpango.', 'Rekodi zilizoombwa zinasaidia kutathmini kama huduma inaweza kuendelea.'], 'Umaarufu peke yake hautatui mahitaji ya uendeshaji.'],
  e3: [['“Dependable” humaanisha kinachoweza kutegemewa.', 'Mpango lazima uwezeshe huduma kuendelea baada ya hamasa ya mwanzo.'], 'Chagua maana inayolingana na sentensi.'],
  e4: [['Kifungu kinataja wageni tisa mwanzoni na thelathini na wawili wiki ya nne.', 'Baadhi tu walileta ndugu zao; kuongezwa kwa muda wa kudumu hakukuwa kumetangazwa.'], 'Usibadili “some” kuwa “every” wala kubuni ada.'],
  e5: [['Jaribio liliongeza ufikiaji wa maktaba na idadi ya watumiaji.', 'Hitimisho linasisitiza gharama na kujitokeza kwa wahudumu wa kujitolea.'], 'Muhtasari unahitaji mabadiliko makuu na hitimisho, bila kubuni mambo.'],
  e6: [['Klabu ilipima matumizi kabla ya kutumia bajeti.', 'Vipimo hivyo vilisaidia kubaini tabia ya kubadili.'], 'Ununuzi uliopendekezwa haukuwa hatua ya kwanza.'],
  e7: [['Klabu ilipima maji, ikabadilisha muda wa kumwagilia na kufunika udongo.', 'Bustani iliendelea vizuri kwa maji machache, ingawa tangi kubwa bado lilihitajika.'], 'Haya ni maboresho ya sehemu, si kukataa vifaa vipya vyote.'],
  e8: [['Klabu iliamua kuweka akiba badala ya kununua mara moja.', '“Little by little” maana yake kidogo kidogo; inalingana na “gradually”.'], 'Uamuzi wa kuweka akiba unaonyesha muktadha wa neno.'],
  e9: [['Kiima “Each” ni cha umoja.', 'Kwa wakati uliopo, kitenzi kinachofaa ni “has”.'], '“Candidates” iko kwenye kirai kinachoanza na “of”; si kiima kinachoamua kitenzi.'],
  e10: [['“If I had left” inaonyesha sharti la wakati uliopita ambalo halikutimia.', 'Matokeo yanayolingana ni “would have caught”.'], '“Would catch” hailingani na sharti hili la wakati uliopita.'],
  e11: [['“The proposal” inakuwa kiima cha sentensi tendwa.', 'Wakati uliopita tendwa hutumia “was approved”, ikifuatiwa na mtendaji.'], 'Hifadhi wakati na maana ya sentensi ya awali.'],
  e12: [['Muundo ni “insist on”, ukifuatiwa na nomino au umbo la -ing.', 'Kwa hiyo sentensi inahitaji “on paying”.'], 'Chagua kihusishi kinachohitajika na muundo wa kitenzi.'],
  e13: [['Wingi wa “student” ni “students”.', 'Kwa wingi wa kawaida unaoishia s, alama ya umiliki huja baada ya s: students’ books.'], '“Student’s” inamaanisha mwanafunzi mmoja.'],
  e14: [['“Scarce” humaanisha kichache au kigumu kupatikana.', '“Plentiful” humaanisha kingi; ni kinyume chake.'], '“Costly” inaweza kuhusiana na uhaba, lakini si kinyume chake.'],
  e15: [['Mpokeaji ni mkuu wa shule, na lengo ni kuomba ruhusa.', 'Utangulizi wazi na wenye heshima unafaa barua hii rasmi.'], 'Linganisha mtindo na mpokeaji na kusudi.'],
  e16: [['Ripoti inaeleza kwa uwazi kilichotokea.', 'Idadi ya washiriki, eneo lililosafishwa na kiasi kilichokusanywa ni matokeo mahsusi.'], 'Sifa zisizo wazi na matamanio ya baadaye hazielezi kazi iliyofanyika.']
};
module.exports = { maths, english };
