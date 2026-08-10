"use strict";

const RELATED = [
  ["/sw/ubunifu-na-watayarishi/", "Kitovu cha ubunifu na watayarishi"],
  ["/sw/zana/media-kit-ya-mtayarishi/", "Media kit na rate card"],
  ["/sw/zana/hook-za-video/", "Hook za video"],
  ["/sw/zana/mawazo-ya-mtayarishi/", "Mpangaji wa mawazo"],
  ["/sw/zana/barua-ya-mtayarishi/", "Kijenzi cha newsletter"],
  ["/sw/zana/ukurasa-wa-mtayarishi/", "Ukurasa wa mtayarishi"],
  ["/sw/zana/mapato-ya-mtayarishi/", "Mpango wa mapato"],
  ["/sw/zana/ankara-ya-mtayarishi/", "Ankara ya mtayarishi"],
  ["/sw/zana/ratiba-ya-mtayarishi/", "Ratiba ya mtayarishi"],
  ["/sw/zana/kitengeneza-cheti/", "Kitengeneza cheti"],
  ["/sw/zana/carousel-ya-mitandao/", "Kijenzi cha carousel"],
  ["/sw/zana/kukata-video-za-mtayarishi/", "Kikata video"],
  ["/sw/zana/hashtag-za-maudhui/", "Mchanganyiko wa hashtag"],
  ["/sw/zana-zote/", "Zana zote za Kiswahili"],
];

const INTERPRETATION = {
  "creator-carousel": "Matokeo mazuri yana mfuatano unaoweza kusomeka bila caption ya nje: ahadi wazi, hoja moja kwa slaidi, ushahidi unaolingana na hoja, na hatua ya mwisho. Idadi ya slaidi si alama ya ubora; uelewa wa msomaji ndio kipimo cha mapitio.",
  "creator-clip": "Tafsiri export kama rendition mpya ya sehemu uliyochagua, si nakala ya baiti za faili asili. Muda, azimio, codec, sauti na nafasi ya maandishi lazima zikaguliwe kwenye faili iliyopakuliwa kwa sababu hakiki ya ndani haiwezi kuthibitisha kila player au jukwaa.",
  "creator-desk": "Jumla ya thamani inaeleza rekodi zilizopo kwenye kikao, si cash iliyopokelewa. Tumia status kutenganisha matarajio, quote, kazi hai, mapitio na completed; kisha linganisha kila hatua na ushahidi wa mteja kabla ya kupanga mapato.",
  "creator-hashtags": "Seti pana husaidia discovery ya jumla, seti focused huweka mada wazi, na niche/community huunganisha mazungumzo maalumu. Hizi ni nafasi za kimkakati tu; uchaguzi wa mwisho unahitaji kuangalia matokeo ya utafutaji na muktadha wa chapisho.",
  "creator-hooks": "Hook yenye nguvu si ile yenye maneno makali zaidi, bali ile inayoweka swali au ahadi ambayo video inajibu mapema. Linganisha aina sita, muda wa kusoma na sauti yako, kisha chagua toleo lenye uwazi bila kupotosha.",
  "creator-kit": "Rate card inapaswa kumwezesha mteja kuelewa huduma, sarafu, bei na kilichojumuishwa bila kubashiri. Ikiwa output haielezi haki za matumizi, marekebisho, muda au kodi, ichukulie kama mwanzo wa mazungumzo na si quote ya mwisho.",
  "creator-mail": "Hakiki inaonyesha muundo wa ujumbe, si delivery. Subject, preheader na CTA vinapaswa kufanya kazi pamoja; HTML inayofunguka hapa bado inahitaji test ya client, consent ya recipients na mipangilio ya unsubscribe kwenye huduma ya kutuma.",
  "creator-mind": "Angle nzuri ina swali linaloweza kujibiwa na njia ya kuthibitisha jibu. Panga mawazo kwa relevance, ushahidi unaopatikana na uwezo wako wa kueleza; usichague wazo kwa sababu tu kichwa kinasikika cha kuvutia.",
  "creator-money": "Operating profit ndiyo msingi wa mgawanyo, huku margin ikionyesha uwiano wake na mapato. Effective hourly ni ishara ya kupanga muda, si rate ya soko. Salio hasi au mgawanyo mkubwa unahitaji kubadili assumptions, si kuficha tofauti.",
  "creator-page": "Output bora ni ukurasa mfupi unaoeleza wewe ni nani na unapeleka watu kwenye destinations chache zinazofanya kazi. JSON ni backup ya data, TXT ni mapitio, na HTML ndiyo faili ya kuchapisha baada ya ukaguzi wa faragha na links.",
  "creator-polish": "Metrics zinaonyesha mahali pa kuangalia, si mabadiliko ya lazima. Wastani mrefu unaweza kuashiria sentensi nzito; repetition inaweza kuwa msisitizo halali. Uamuzi wa mwisho unahitaji kusoma muktadha na kulinganisha na rasimu asili.",
};

const NOT_PROOF = {
  "creator-carousel": "Haithibitishi ukweli, reach, haki za picha, fonti rasmi ya jukwaa au performance baada ya kuchapisha.",
  "creator-clip": "Haithibitishi uungaji mkono wa codec kwenye kila kifaa, usahihi wa manukuu, haki ya kutumia media au kukubalika kwa export kwenye kila jukwaa.",
  "creator-desk": "Haithibitishi mkataba, invoice, malipo, ushirikiano wa timu, cloud backup au hali halisi ya mradi nje ya data uliyoandika.",
  "creator-hashtags": "Haithibitishi trend ya sasa, search volume, banned-tag status, reach, engagement au usalama wa maana katika kila jamii.",
  "creator-hooks": "Haithibitishi retention, virality, takwimu ndani ya hook, timing halisi ya sauti yako au kufuata sera za jukwaa.",
  "creator-kit": "Haithibitishi audience metrics, bei ya soko, exchange rate, kodi, uwezo wa mteja kulipa au masharti ya mkataba.",
  "creator-mail": "Haithibitishi deliverability, inbox placement, consent, spam compliance, tracking au mwonekano sawa katika kila email client.",
  "creator-mind": "Haithibitishi trend, search demand, ukweli wa madai, chanzo, originality au kwamba wazo litafanya vizuri kwenye jukwaa.",
  "creator-money": "Haithibitishi salio la benki, mapato yaliyolipwa, gharama zinazokubalika, kiwango rasmi cha kodi au ushauri wa uwekezaji.",
  "creator-page": "Haithibitishi identity, usalama wa link, availability ya hosting, analytics, SEO ranking au faragha ya taarifa utakazochapisha.",
  "creator-polish": "Haithibitishi ukweli, plagiarism, sarufi yote, tone, muktadha wa kitamaduni, uhalali wa nukuu au nia ya mwandishi.",
};

const CONTENT = {
  "creator-carousel": {
    title: "Kutoka hoja hadi carousel inayoweza kukaguliwa",
    intro: "Zana hii hubadilisha kichwa, hadhira, hoja na mwito wa hatua kuwa mfuatano wa slaidi. Mpangilio huo ni rasimu ya uchapishaji: hukusaidia kuona kama simulizi lina mwanzo, ushahidi na hatua ya mwisho, lakini hauchagui picha wala kuthibitisha madai kwa niaba yako.",
    method: [
      "Anza kwa sentensi moja inayoeleza faida kwa msomaji. Weka kila hoja kwenye mstari wake; injini huunda slaidi ya utangulizi, slaidi za hoja, na slaidi ya mwito wa hatua bila kutuma maandishi nje ya kivinjari.",
      "Hakiki kila canvas katika mwonekano wa 1080 × 1350. Rangi ulizochagua hutumika kwa slaidi zote, kwa hiyo pima utofauti wa maandishi na usitumie rangi kama njia pekee ya kuwasilisha maana.",
      "Pakua JSON au TXT kwa mapitio ya maandishi. ZIP ina PNG moja kwa kila slaidi kwa mpangilio ule ule unaoonekana; fungua faili zote na uhakikishe majina, vipimo na mpangilio kabla ya kupakia jukwaani.",
    ],
    source: "Matokeo yanatokana tu na maandishi na rangi unazoingiza pamoja na kanuni ya mpangilio ya CreatorCarousel. Hakuna data ya trend, reach, fonti ya jukwaa au pendekezo la algoriti linalosomwa. Vipimo vya PNG vinathibitishwa na faili yenyewe; sera za jukwaa na haki za picha lazima zithibitishwe kwenye chanzo rasmi.",
    privacy: "Kichwa, hoja na jina la akaunti hubaki kwenye tab hii. Zana haitumii akaunti, analytics ya maudhui au AI. Upakuaji hutokea baada ya kubofya kitufe; ukifunga ukurasa kabla ya kupakua, rasimu haijahifadhiwa kwenye AfroTools.",
    checks: ["Soma slaidi kwa mpangilio na uondoe marudio.", "Thibitisha kila takwimu, nukuu na jina la mtu.", "Kagua utofauti wa rangi na ukubwa wa maandishi kwenye simu.", "Thibitisha ruhusa ya picha, nembo na muziki wowote utakaoongeza baadaye."],
    faq: [
      ["Je, ZIP ina nini?", "Ina PNG ya kila slaidi kwa vipimo vya 1080 × 1350 na mpangilio wa namba unaolingana na hakiki."],
      ["Je, zana huchapisha Instagram au LinkedIn?", "Hapana. Inatengeneza faili za ndani tu; wewe ndiye unapakia na kuweka maelezo ya chapisho."],
      ["Ninaweza kubadili rangi?", "Ndiyo. Chagua rangi ya nyuma na ya msisitizo, kisha hakiki utofauti kabla ya kupakua."],
      ["Je, madai yangu yanathibitishwa?", "Hapana. Zana hupanga maandishi; uthibitishaji wa ukweli na vyanzo unabaki kwako."],
    ],
  },
  "creator-clip": {
    title: "Mtiririko salama wa kuandaa klipu",
    intro: "CreatorClip ni studio ya ndani ya kukata video, kuweka manukuu na maandishi, kuchagua uwiano, vichujio, kasi ya hakiki na sauti. Video yako haipakizwi kwenye AfroTools. Uwezo halisi wa kuingiza na kutoa faili hutegemea MediaRecorder, codec na kumbukumbu ya kivinjari chako.",
    method: [
      "Chagua MP4, WebM au MOV unayomiliki. Hakiki muda wa video, weka mwanzo na mwisho kwenye timeline, kisha cheza sehemu hiyo kabla ya kuendelea. Faili kubwa inaweza kuhitaji kumbukumbu zaidi; usifunge tab wakati usindikaji unaendelea.",
      "Ongeza au hariri manukuu, chagua mtindo unaosomeka, na weka maandishi ya juu kwa muda unaotakiwa. Uwiano wa jukwaa, kijazo cha nyuma, kichujio, mwangaza, contrast na saturation huonekana kwenye hakiki; kasi ni ya hakiki isipokuwa kidhibiti kinasema vingine.",
      "Hifadhi mradi wa ndani ikiwa unahitaji kurudi kwenye mipangilio, kisha chagua ubora na uanze export. Faili ya WebM lazima ifunguke tena, iwe na muda unaosomeka na ianze na kontena halali la WebM; hakiki sauti na manukuu kwa kucheza faili iliyopakuliwa, si hakiki pekee.",
    ],
    source: "Chanzo ni video uliyochagua na mipangilio ya studio. Manukuu ya kiotomatiki, yakipatikana, hutegemea Speech Recognition ya kivinjari na yanaweza kukosea majina, lafudhi au lugha. Taarifa ya codec inatoka kwenye MediaRecorder ya kifaa; AfroTools haidai kwamba kila Safari, Firefox au simu itaunga mkono muundo ule ule.",
    privacy: "Baiti za video, manukuu na maandishi hubaki kwenye kivinjari. Hakuna upload, akaunti au API ya AI katika mtiririko huu. Mradi uliohifadhiwa ni wa kifaa hiki; futa data ya tovuti ikiwa hutaki ibaki. Usitumie video ya mtu mwingine bila ruhusa.",
    checks: ["Cheza sehemu ya mwanzo na mwisho ili kuthibitisha kata.", "Sahihisha manukuu kwa kusikiliza sauti yote.", "Kagua uwiano na nafasi ya maandishi kwenye simu.", "Fungua WebM iliyopakuliwa na uthibitishe muda, picha, sauti na codec."],
    faq: [
      ["Ukubwa wa juu wa faili ni upi?", "Kiolesura kinakubali hadi MB 500, lakini kikomo cha vitendo hutegemea kumbukumbu na uwezo wa kifaa chako."],
      ["Kwa nini WebM haifanyi kazi kwenye kivinjari changu?", "MediaRecorder na codec hutofautiana. Chrome, Edge na Brave kawaida zina uungaji mkono mpana; jaribu kifaa kingine ikiwa export haianzi."],
      ["Manukuu ni sahihi kwa asilimia mia?", "Hapana. Yahariri baada ya kutengenezwa na uthibitishe majina, namba na istilahi kwa kusikiliza sauti."],
      ["Je, video inatumwa kwa seva?", "Hapana. Uingizaji, hakiki na export hufanyika ndani ya kivinjari hiki."],
      ["Ubora hubaki sawa?", "Unachagua ubora wa export. Matokeo yanaweza kubanwa au kupunguzwa hadi azimio ulilochagua, hivyo fungua faili ya mwisho na uikague."],
    ],
  },
  "creator-desk": {
    title: "Daftari la mradi linaloeleweka",
    intro: "CreatorDesk hukusanya jina la mradi, lebo ya mteja, hatua, thamani, sarafu, tarehe na maelezo katika daftari la kikao. Ni njia ya kuona kazi zilizo matarajio, zilizotolewa bei, zinazoendelea, kwenye mapitio au zilizokamilika bila kudai kuwa mfumo wa CRM, ankara au ushirikiano wa timu.",
    method: [
      "Ongeza mradi mmoja kwa rekodi na tumia lebo ya mteja isiyo na taarifa nyeti zisizohitajika. Chagua hali inayolingana na hatua ya sasa, sarafu ya makubaliano na tarehe ya mwisho uliyoidhinisha na mteja.",
      "Pitia jedwali baada ya kila nyongeza. Jumla na idadi hujengwa kutoka rekodi zilizo kwenye kikao; thamani ni namba ya kupanga, si uthibitisho wa mkataba, malipo, kodi au salio la benki.",
      "Pakua JSON ikiwa unahitaji kurejesha muundo kamili na CSV ikiwa unahitaji spreadsheet. Fungua faili na uthibitishe safu za project, client, status, value, currency, due na notes kabla ya kufunga tab.",
    ],
    source: "Hakuna chanzo cha nje au data hai. Daftari hutumia rekodi unazoingiza na injini ya ndani ya CreatorDesk. Hali, thamani na tarehe si taarifa zilizothibitishwa na mteja; linganisha na mkataba, barua ya kazi na kumbukumbu za malipo.",
    privacy: "Rekodi zinafanya kazi katika kikao cha kivinjari na hazisawazishwi na akaunti. Usihifadhi nywila, namba kamili za utambulisho au siri ya mteja kwenye notes. Pakua nakala inayohitajika, ihifadhi kwa usalama na uifute inapokwisha matumizi.",
    checks: ["Linganisha hali ya kila mradi na mawasiliano ya mwisho.", "Thibitisha sarafu na kama thamani ina kodi au la.", "Kagua tarehe za mwisho na utegemezi wa mapitio.", "Fungua JSON na CSV kabla ya kuondoka kwenye kikao."],
    faq: [["Je, data inasawazishwa kwenye vifaa?", "Hapana. Daftari hili ni la kikao; export ndiyo nakala inayohamishika."], ["Je, linaunganisha ankara?", "Hapana. Tumia zana ya ankara kando na linganisha namba kwa mikono."], ["Ninaweza kuongeza miradi mingapi?", "Kiolesura hakijaweka kikomo maalumu, lakini utendaji hutegemea kifaa na ukubwa wa kikao."], ["Thamani ni mapato yaliyolipwa?", "Si lazima. Ni thamani uliyoandika kwa kupanga; uthibitisho wa malipo unatoka kwenye kumbukumbu zako."], ["Nifanye nini kabla ya kufunga tab?", "Pakua JSON au CSV na ufungue faili ili kuthibitisha kwamba rekodi zote zipo."]],
  },
  "creator-hashtags": {
    title: "Hashtag zenye muktadha, si ahadi ya reach",
    intro: "TagWave hutengeneza seti za hashtag za broad reach, niche na community kwa mada na jukwaa ulilochagua. Lebo hizo ni mkakati wa kuanzia unaotengenezwa na kanuni za ndani; si orodha ya trend ya sasa, kipimo cha volume, orodha ya banned tags au dhamana kwamba chapisho litaonekana zaidi.",
    method: ["Eleza chapisho kwa maneno halisi yanayoonyesha mada, eneo au jamii bila kuweka taarifa binafsi. Chagua jukwaa ili idadi inayopendekezwa ilingane na matumizi ya kawaida ya Instagram, TikTok, LinkedIn au YouTube.", "Tengeneza seti za ndani, kisha gusa hashtag ili kujenga mchanganyiko wako. Kaunta huonyesha kiwango cha jukwaa na historia ya ndani hukusaidia kurudia uchaguzi; bado unapaswa kuondoa lebo isiyolingana na hadhira yako.", "Pakua TXT kwa kubandika au JSON kwa rekodi yenye muundo. Hali ya AI ni ya hiari: mada na jukwaa haviwezi kutoka kwenye kivinjari hadi uchague AI, uone mpaka wa taarifa na utoe idhini wazi."],
    source: "Seti za ndani zinatoka kwenye injini ya TagWave na msamiati uliowekwa, si API ya mitandao ya kijamii. Alama za broad, focused na niche ni lebo za mkakati, si hesabu hai. Thibitisha uhalali, maana na matumizi ya hashtag moja kwa moja kwenye jukwaa kabla ya kuchapisha.",
    privacy: "Katika hali ya ndani, mada, mchanganyiko na historia havitumwi kwa seva. Ukichagua msaada wa AI, mada kamili na jukwaa vilivyoonyeshwa vinaweza kutumwa baada ya consent; endelea na hali ya ndani ikiwa mada ni nyeti au ya mteja.",
    checks: ["Tafuta kila hashtag kwenye jukwaa kabla ya kuitumia.", "Ondoa lebo yenye maana tofauti katika eneo lako.", "Usirudie seti ile ile kwenye kila chapisho bila sababu.", "Hifadhi JSON ikiwa unahitaji kumbukumbu ya mchanganyiko."],
    faq: [["Ninapata seti ngapi?", "Injini ya ndani huunda seti tatu za mkakati na inaruhusu mchanganyiko wako."], ["Je, hizi ni trend za leo?", "Hapana. Hakuna data hai ya trend au reach katika matokeo ya ndani."], ["AI ni lazima?", "Hapana. Jenereta ya ndani, mix, historia na exports zinafanya kazi bila AI."], ["Hashtag za community ni salama kila wakati?", "Hapana. Kagua maana, matumizi ya sasa na muktadha wa kitamaduni kwenye jukwaa."], ["Ninawezaje kuhifadhi?", "Pakua TXT au JSON. Historia ya ndani si mbadala wa backup inayohamishika."]],
  },
  "creator-hooks": {
    title: "Hook ni rasimu ya ufunguzi, si ushahidi",
    intro: "HookFactory hutumia mada na jukwaa kutengeneza aina sita za mwanzo wa video, pamoja na muda wa kusoma unaokadiriwa. Inasaidia kulinganisha swali, kauli, hadithi, takwimu, direct address na pattern interrupt; haijui retention ya hadhira yako wala kuthibitisha takwimu unazotaja.",
    method: ["Andika mada maalumu na chagua mahali video itachapishwa. Injini ya ndani huunda hook sita kwa kanuni zinazoweza kurudiwa, kwa hiyo mada ile ile na jukwaa lile lile zinapaswa kutoa msingi unaoweza kukaguliwa bila simu ya AI.", "Soma kila hook kwa sauti. Makadirio ya muda hutumia kasi ya kawaida ya maneno kwa dakika; badili urefu kulingana na namna unavyozungumza, lafudhi, pause na aina ya video. Chagua hook inayofungua ahadi ambayo video yenyewe inatimiza.", "Pakua JSON ili kuhifadhi aina na metadata au TXT kwa script. Kabla ya kurekodi, badilisha lugha ya jumla iwe sauti yako, ondoa clickbait isiyo na ushahidi na thibitisha madai kwenye chanzo cha kuaminika."],
    source: "Matokeo yanatokana na injini ya CreatorHooks na maandishi unayoingiza. Makadirio ya muda si kipimo cha video halisi, na hakuna analytics ya TikTok, Reels, Shorts au YouTube inayosomwa. Kanuni za jukwaa na urefu bora hubadilika; kagua nyaraka rasmi na data yako mwenyewe.",
    privacy: "Mada na hooks hubaki kwenye kivinjari. Hakuna AI, login au network request katika jenereta hii ya ndani. Export huanza tu unapobofya. Epuka kuweka taarifa ya siri ya kampeni, mteja au mtu kwenye mada ya jaribio.",
    checks: ["Je, hook inalingana na jibu la video?", "Je, namba na kauli kali zina chanzo kinachoweza kutajwa?", "Je, sentensi inasikika ya kawaida ikisomwa kwa sauti?", "Je, ufunguzi unaheshimu muktadha wa hadhira na sera za jukwaa?"],
    faq: [["Aina sita ni zipi?", "Matokeo huchanganya swali, kauli nzito, hadithi, takwimu, direct address na pattern interrupt kulingana na injini."], ["Muda wa kusoma ni sahihi kiasi gani?", "Ni makadirio ya kasi ya kawaida; rekodi jaribio kwa sauti yako ili kuthibitisha muda wa kweli."], ["Je, kuna teleprompter?", "Ukurasa huu huzalisha na kupakua hooks; tumia kifaa chako cha kurekodi au zana nyingine kwa teleprompter ikiwa haionekani kwenye workspace."], ["Hook zinatoka kwenye trend hai?", "Hapana. Hakuna API ya trend, retention au algoriti inayotumiwa."], ["Ninaweza kutumia kwenye video ndefu?", "Ndiyo kama rasimu, lakini ongeza muktadha na uhakikishe hook haiahidi jambo ambalo video haitoi."]],
  },
  "creator-kit": {
    title: "Rate card inayoweza kuthibitishwa",
    intro: "Media kit hii huweka jina, tagline, huduma, bei, sarafu, maelezo na mawasiliano kwenye rekodi ya ndani. Inafaa kama rasimu ya rate card ya huduma moja; si mkataba, quote iliyokubaliwa, ushahidi wa audience au hesabu ya kodi.",
    method: ["Taja huduma kwa upeo unaoweza kupimwa, chagua sarafu na bei, kisha eleza deliverables, idadi ya marekebisho, muda na haki za matumizi. Usiongeze follower count, reach au ushuhuda usioweza kuthibitisha.", "Tengeneza toleo la ndani kwanza. TXT ni rahisi kutuma kwa ujumbe na JSON huhifadhi muundo. Kagua email na WhatsApp kabla ya kushiriki kwa sababu zitakuwa kwenye faili unayopakua.", "Msaada wa AI ni wa hiari. Onyesho la payload lazima likaguliwe na checkbox ya consent ichaguliwe kabla ya network request; jenereta ya ndani inabaki njia kamili ikiwa hutaki kutuma taarifa."],
    source: "Bei, maelezo na mawasiliano hutoka kwako. AfroTools haisomi analytics, benchmark ya soko, rate ya competitor au exchange rate, kwa hiyo haiwezi kuthibitisha kwamba bei inafaa. Linganisha na gharama zako, matumizi ya kazi na makubaliano ya mteja.",
    privacy: "Njia ya ndani haitumi rate card kwa seva. Ukichagua AI, payload iliyo kwenye kisanduku ndiyo inayoweza kuondoka baada ya idhini. Ondoa simu, email au maelezo ya mteja yasiyohitajika kabla ya consent na pakua faili kwa hifadhi yako mwenyewe.",
    checks: ["Thibitisha sarafu, kodi na tarehe ya uhalali.", "Eleza haki za matumizi na idadi ya marekebisho.", "Ondoa madai ya audience yasiyo na ushahidi.", "Kagua mawasiliano kwenye TXT na JSON."],
    faq: [["Je, zana inapendekeza bei?", "Hapana. Inapanga bei uliyoingiza; hakuna benchmark au quote ya soko."], ["AI ni lazima?", "Hapana. Rate card ya ndani na exports zinafanya kazi bila AI."], ["Ni mkataba?", "Hapana. Ni rasimu ya kibiashara; masharti ya mwisho yahakikiwe na wahusika."], ["Taarifa gani hutumwa kwa AI?", "Ni payload inayoonyeshwa kabla ya consent. Usikubali hadi uisome na kuondoa taarifa nyeti."],
    ],
  },
  "creator-mail": {
    title: "Newsletter kabla ya huduma ya kutuma",
    intro: "Kijenzi hiki huunda subject, preheader, headline, body, CTA na sender kuwa hakiki ya ndani na faili ya HTML, JSON au TXT. Hakina orodha ya subscribers, delivery, tracking, spam score au ahadi ya inbox; export ni rasimu ya kuingiza kwenye huduma yako ya email.",
    method: ["Andika subject inayolingana na ujumbe na preheader inayoongeza muktadha badala ya kurudia. Panga body kwa aya fupi, weka CTA moja yenye URL halali na jina la mtumaji linalotambulika.", "Tengeneza matokeo na uangalie iframe ya hakiki. Maandishi yana-escaped kabla ya kuingia kwenye HTML ili kupunguza markup isiyotarajiwa, lakini bado unapaswa kupima link, fonti, mobile layout na dark mode katika huduma utakayotumia.", "Pakua HTML kwa template, JSON kwa backup ya muundo au TXT kwa mapitio. Ongeza anwani inayotakiwa, utaratibu wa kujiondoa na uthibitisho wa consent ndani ya huduma ya kutuma; AfroTools haifanyi hatua hizo."],
    source: "Maudhui yote yanatoka kwenye input yako na injini ya CreatorMail. Hakuna deliverability API, list verification, click tracking au kanuni ya nchi inayosomwa. Thibitisha sheria na sera zinazokuhusu kwa chanzo rasmi na mtoa huduma wa email.",
    privacy: "Rasimu inachakatwa kwenye kivinjari na haitumwi kwa AfroTools. Faili unazopakua zinaweza kuwa na jina na URL, kwa hiyo zihifadhi kwa usalama. Usiweke orodha ya email, token ya huduma au taarifa nyingine ya subscriber kwenye body.",
    checks: ["Jaribu subject na preheader kwenye simu.", "Fungua kila CTA na uhakikishe HTTPS na destination.", "Ongeza unsubscribe na anwani inayohitajika kwenye huduma ya kutuma.", "Tuma test kwa akaunti zako kabla ya campaign halisi."],
    faq: [["Je, AfroTools hutuma newsletter?", "Hapana. Zana huandaa faili tu; utumaji hufanyika kwenye huduma unayochagua."], ["Je, hufuatilia opens na clicks?", "Hapana. Hakuna tracking au analytics ya wasomaji."], ["HTML iko tayari kwa kila email client?", "Ni msingi salama, lakini lazima uipime kwenye client na huduma yako kwa sababu uungaji mkono hutofautiana."], ["Ninaweza kuhifadhi rasimu?", "Pakua JSON, TXT au HTML. AfroTools haina cloud draft kwa ukurasa huu."],
    ],
  },
  "creator-mind": {
    title: "Mawazo kumi kama ramani ya utafiti",
    intro: "CreatorMind huunda angles kumi za maudhui kwa mada, hadhira na jukwaa kwa kanuni za ndani. Matokeo yanaweza kujumuisha guide, mistakes, checklist, maswali, case study, comparison, process, myths, glossary na source research. Ni prompts za kuanza utafiti, si makala iliyothibitishwa wala trend hai.",
    method: ["Eleza mada kwa upeo maalumu na taja hadhira inayotarajiwa. Chagua jukwaa ili phrasing iwe na muktadha, kisha tengeneza mawazo. Hakuna voice cloning au model inayojifunza sauti yako katika mtiririko huu wa ndani.", "Panga mawazo kwa kile unachoweza kuthibitisha, uzoefu ulionao na faida kwa hadhira. Kwa case study, takwimu, afya, fedha au sheria, tafuta chanzo cha kwanza na uweke tarehe; usichukulie kichwa cha wazo kuwa dai lililothibitishwa.", "Pakua JSON ili kuhifadhi aina, mada na metadata, au TXT kwa orodha inayosomeka. Chagua wazo moja, tengeneza brief yenye swali, vyanzo, format na CTA, kisha fanya mapitio ya binadamu kabla ya kuchapisha."],
    source: "Injini ya CreatorMind hutumia templates zilizowekwa na input yako. Haisomi search volume, trend, analytics, social feed au data ya competitor. 'Source research' ni mwaliko wa kutafuta vyanzo; si orodha ya vyanzo vilivyokwisha kuthibitishwa.",
    privacy: "Mada, hadhira na mawazo hubaki kwenye tab. Hakuna AI request, akaunti au cloud history katika toleo hili. Ukihitaji kuhifadhi, pakua JSON au TXT; usiweke brief ya siri au taarifa ya mteja isiyohitajika.",
    checks: ["Chagua wazo lenye faida iliyo wazi kwa hadhira.", "Taja madai yanayohitaji chanzo cha kwanza.", "Kagua lugha ya kitamaduni na majina ya watu.", "Hifadhi brief na vyanzo pamoja, si kichwa pekee."],
    faq: [["Je, CreatorMind hutumia AI?", "Hapana katika workspace hii. Mawazo kumi yanatengenezwa kwa kanuni za ndani."], ["Je, mawazo ni trend za sasa?", "Hapana. Hakuna search au social trend inayosomwa."], ["Je, inahifadhi mada yangu?", "Hakuna cloud sync. Pakua export ikiwa unataka nakala inayohamishika."], ["Nifanye nini na angle ya case study?", "Tafuta ushahidi, ruhusa na chanzo; usibuni matokeo au nukuu."], ["Kwa nini matokeo yanaweza kurudiwa?", "Jenereta ni deterministic. Badili upeo wa mada au hadhira ili kupata angle tofauti kwa njia inayoweza kuelezeka."]],
  },
  "creator-money": {
    title: "Mpango wa fedha, si ushauri wa kodi",
    intro: "Mpangaji hukokotoa operating profit kutoka mapato na gharama, kisha huonyesha akiba ya kodi, malipo ya mmiliki, uwekezaji upya, salio, margin na mapato kwa saa. Kila kiwango kinatoka kwenye input yako; hakuna bank feed, exchange rate, kiwango rasmi cha kodi au mapendekezo ya uwekezaji.",
    method: ["Chagua sarafu ya kumbukumbu na ingiza mapato na gharama za mwezi kwa msingi mmoja, kwa mfano kabla au baada ya VAT, bila kuzichanganya. Weka saa za kazi ili effective hourly iwe na maana.", "Weka asilimia za akiba ya kodi, owner pay na reinvestment kama sera yako ya kupanga. Injini haitaamua kama viwango hivyo vinakubalika kisheria au kama jumla yake inafaa kwa cash flow yako.", "Tengeneza matokeo, linganisha operating profit, margin na salio, kisha pakua JSON/TXT au nakili muhtasari. Fanya reconciliation na statement, invoice na rekodi za kodi kabla ya kuchukua hatua."],
    source: "Hesabu zinatumia namba ulizoingiza na injini ya CreatorMoney. Hakuna data ya serikali, benki, soko au sarafu. Thibitisha kodi, makato, tarehe na uainishaji wa gharama kwa mamlaka rasmi au mtaalamu wa eneo lako.",
    privacy: "Kiasi na asilimia hubaki kwenye kivinjari; hakuna account sync au analytics ya namba zako. Export na copy hutokea kwa kitendo chako. Usibandike taarifa ya benki au utambulisho kwenye sehemu zisizohitaji.",
    checks: ["Linganisha mapato na invoice zilizolipwa.", "Tenganisha gharama za biashara na binafsi.", "Thibitisha kiwango cha kodi kwa nchi na aina ya biashara.", "Kagua kwamba salio halijagawiwa zaidi ya operating profit."],
    faq: [["Margin inamaanisha nini?", "Ni operating profit kama asilimia ya mapato yaliyoingizwa; si margin iliyothibitishwa na accountant."], ["Mapato kwa saa yanahesabiwaje?", "Operating profit hugawanywa kwa saa za mwezi ulizoingiza."], ["Je, kiwango cha kodi ni rasmi?", "Hapana. Ni asilimia yako ya kupanga na lazima ithibitishwe."], ["Namba zangu zinatumwa wapi?", "Hazitumwi; hesabu na exports hutokea kwenye kivinjari."],
    ],
  },
  "creator-page": {
    title: "Ukurasa unaohamishika unaodhibitiwa na wewe",
    intro: "Zana huunda faili moja ya HTML yenye jina, bio, viungo na rangi, pamoja na JSON na TXT. AfroTools haihosti, haichapishi, haifupishi URL wala kufuatilia clicks. Wewe ndiye unachagua mahali pa kuweka faili na ni taarifa zipi zionekane hadharani.",
    method: ["Andika jina na bio fupi inayoweza kuthibitishwa. Weka kila kiungo kama Jina | https://... ili parser itenganishe label na URL; tumia HTTPS na destination unayoidhibiti.", "Tengeneza hakiki na ujaribu kila link. Rangi ya msisitizo inaingia kwenye HTML, kwa hiyo kagua utofauti, focus na readability kwenye simu na dark mode ya browser kabla ya kuchapisha.", "Pakua HTML kwa hosting yako, JSON kwa backup ya muundo na TXT kwa mapitio. Fungua faili ya HTML moja kwa moja na uhakikishe hakuna email, simu, location au link binafsi ambayo hukusudia kuweka wazi."],
    source: "Maudhui na viungo hutoka kwako. Hakuna profile lookup, analytics, identity verification au hosting integration. Availability ya URL, usalama wa destination na madai ya bio lazima yathibitishwe kwenye chanzo husika.",
    privacy: "Rasimu hubaki kwenye kivinjari, lakini faili ya HTML utakayochapisha ni ya umma. Ondoa taarifa isiyohitajika, tumia email ya biashara inapofaa na kumbuka kwamba hosting provider anaweza kuweka logs zake.",
    checks: ["Fungua kila link kwenye tab mpya na uthibitishe destination.", "Kagua bio kwa madai yasiyo na ushahidi.", "Pima ukurasa kwenye 320px na keyboard.", "Hifadhi JSON kama backup kabla ya kubadilisha hosting."],
    faq: [["Je, AfroTools huhosti ukurasa?", "Hapana. Unapakua HTML na kuiweka kwenye hosting unayochagua."], ["Je, clicks zinafuatiliwa?", "Hapana. Faili ya msingi haina analytics ya AfroTools."], ["Ninaweza kuongeza viungo vingapi?", "Unaweza kuweka mistari mingi, lakini ukurasa mfupi wenye viungo muhimu huwa rahisi kutumia."], ["Kwa nini nihifadhi JSON?", "JSON huhifadhi muundo kwa backup na uhamishaji bila kutegemea HTML iliyochapishwa."],
    ],
  },
  "creator-polish": {
    title: "Mapitio yanayoeleza kila ishara",
    intro: "CreatorPolish hupima maneno, sentensi, wastani wa urefu, sentensi ndefu, nafasi mbili, punctuation na maneno yanayorudiwa. Ni ukaguzi wa kanuni unaoweza kuelezeka; hauhakiki ukweli, sarufi yote, nukuu, sauti ya kitamaduni au nia ya mwandishi.",
    method: ["Bandika rasimu isiyo na taarifa nyeti zisizohitajika na anza uchambuzi. Injini hugawanya sentensi na maneno kwa kanuni zake, kwa hiyo vifupisho, majina na punctuation isiyo ya kawaida vinaweza kuathiri counts.", "Pitia metrics na kila onyo badala ya kukubali cleaned text moja kwa moja. Sentensi ndefu inaweza kuwa sahihi; neno linalorudiwa linaweza kuwa istilahi muhimu. Rekebisha tu pale mabadiliko yanapoongeza uwazi bila kubadili maana.", "Pakua JSON kwa rekodi ya metrics na issues, au TXT kwa toleo lililosafishwa na pointi za mapitio. Linganisha export na chanzo ili kuhakikisha nukuu, namba, majina na links hazijabadilishwa vibaya."],
    source: "Uchambuzi unatoka kwenye injini ya CreatorPolish na maandishi yako pekee. Hakuna model ya lugha, dictionary hai, grammar API au fact checker. Counts ni ishara za uhariri, si alama rasmi ya ubora.",
    privacy: "Rasimu haiondoki kwenye kivinjari na haitumwi kwa AI, server au analytics. Usihifadhi taarifa binafsi kwenye test artifact; pakua tu ikiwa unahitaji na linda faili kwa kiwango sawa na rasimu asili.",
    checks: ["Thibitisha majina, namba na nukuu dhidi ya chanzo.", "Soma cleaned text kwa sauti ili kulinda maana.", "Kagua kila repetition kabla ya kuiondoa.", "Fungua JSON na TXT na linganisha na rasimu."],
    faq: [["Je, zana ni grammar checker kamili?", "Hapana. Inaripoti ishara za kimitambo na haiwezi kuelewa kila kanuni au muktadha."], ["Je, maandishi yanatumwa kwa AI?", "Hapana. Uchambuzi wote ni wa ndani na deterministic."], ["Sentensi ndefu ni kosa kila wakati?", "Hapana. Ni ishara ya kukagua; muundo na hadhira huamua kama igawanywe."], ["JSON ina nini?", "Ina metrics, issues na toleo lililosafishwa kwa ukaguzi unaoweza kurudiwa."],
    ],
  },
};

function schema(owner, cfg, canonical) {
  return [
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      inLanguage: "sw",
      mainEntity: cfg.faq.map(([name, text]) => ({
        "@type": "Question",
        name,
        acceptedAnswer: { "@type": "Answer", text },
      })),
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "AfroTools", item: "https://afrotools.com/sw/" },
        { "@type": "ListItem", position: 2, name: "Ubunifu na watayarishi", item: "https://afrotools.com/sw/ubunifu-na-watayarishi/" },
        { "@type": "ListItem", position: 3, name: cfg.title, item: `https://afrotools.com${canonical}` },
      ],
    },
  ].map((value) => `<script type="application/ld+json">${JSON.stringify(value).replace(/</g, "\\u003c")}</script>`).join("");
}

function render(owner, canonical) {
  const cfg = CONTENT[owner];
  if (!cfg) return "";
  return `<!-- SW_CREATIVE_DEPTH_START --><section class="swfa-depth" data-swfa-depth="${owner}"><div class="swfa-depth__intro"><p class="swfa-eyebrow">Mwongozo wa matumizi</p><h2>${cfg.title}</h2><p>${cfg.intro}</p></div><div class="swfa-depth__grid"><article><h2>Mbinu ya kufanya kazi</h2><ol>${cfg.method.map((text) => `<li>${text}</li>`).join("")}</ol></article><article><h2>Jinsi ya kutafsiri matokeo</h2><p>${INTERPRETATION[owner]}</p></article><article><h2>Chanzo na mpaka wa matokeo</h2><p>${cfg.source}</p><h2>Matokeo hayathibitishi nini?</h2><p>${NOT_PROOF[owner]}</p></article><article><h2>Faragha na hifadhi</h2><p>${cfg.privacy}</p></article><article><h2>Kabla ya kutumia au kuchapisha</h2><ul>${cfg.checks.map((text) => `<li>${text}</li>`).join("")}</ul></article></div><section class="swfa-depth__faq" aria-labelledby="${owner}-faq"><h2 id="${owner}-faq">Maswali yanayoulizwa mara kwa mara</h2>${cfg.faq.map(([question, answer]) => `<details><summary>${question}</summary><p>${answer}</p></details>`).join("")}</section><nav class="swfa-depth__links" aria-label="Zana nyingine za Kiswahili"><h2>Endelea na kazi yako</h2>${RELATED.map(([href, label]) => `<a href="${href}">${label}</a>`).join("")}</nav>${schema(owner, cfg, canonical)}</section><!-- SW_CREATIVE_DEPTH_END -->`;
}

function inject(html, owner, canonical) {
  const depth = render(owner, canonical);
  if (!depth) return html;
  const clean = html.replace(/\s*<!-- SW_CREATIVE_DEPTH_START -->[\s\S]*?<!-- SW_CREATIVE_DEPTH_END -->\s*/i, "");
  return /<\/main>/i.test(clean)
    ? clean.replace(/<\/main>/i, `${depth}</main>`)
    : clean.replace(/<\/body>/i, `${depth}</body>`);
}

module.exports = { CONTENT, inject, render };
