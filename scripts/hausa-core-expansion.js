const fs = require('fs');
const path = require('path');

const root = process.cwd();
const site = 'https://afrotools.com';

const pages = [
  {
    kind: 'jamb',
    route: '/ha/jamb/tattalin-arziki/',
    file: 'ha/jamb/tattalin-arziki/index.html',
    source: '/jamb/economics/',
    sourceFile: 'jamb/economics/index.html',
    title: 'JAMB Tattalin arziki a Hausa',
    subject: 'Tattalin arziki',
    desc: 'Jagorar Hausa don JAMB Tattalin arziki: bukata da wadata, kasuwa, kudin kasa, kasuwanci da tattalin arzikin Najeriya.',
    topics: ['Bukatun kaya da wadata', 'Tsarin kasuwa da farashi', 'Kudi, banki da hauhawar farashi', 'Tattalin arzikin Najeriya'],
    registry: {
      id: 'jamb-economics-ha',
      name: 'JAMB Tattalin arziki a Hausa',
      desc: 'Jagorar Hausa don bukata, wadata, kasuwa, kudi da tattalin arzikin Najeriya; ajiyar tambayoyi tana Turanci.',
      priority: 75
    }
  },
  {
    kind: 'jamb',
    route: '/ha/jamb/gwamnati/',
    file: 'ha/jamb/gwamnati/index.html',
    source: '/jamb/government/',
    sourceFile: 'jamb/government/index.html',
    title: 'JAMB Gwamnati a Hausa',
    subject: 'Gwamnati',
    desc: 'Jagorar Hausa don JAMB Gwamnati: kundin tsarin mulki, tarayya, jamiyyu, zabe da tarihin siyasar Najeriya.',
    topics: ['Kundin tsarin mulki', 'Tarayya da raba iko', 'Jamiyyu da zabe', 'Tarihin siyasar Najeriya'],
    registry: {
      id: 'jamb-government-ha',
      name: 'JAMB Gwamnati a Hausa',
      desc: 'Jagorar Hausa don kundin tsarin mulki, tarayya, zabe da siyasar Najeriya; ajiyar tambayoyi tana Turanci.',
      priority: 75
    }
  },
  {
    kind: 'jamb',
    route: '/ha/jamb/kasuwanci/',
    file: 'ha/jamb/kasuwanci/index.html',
    source: '/jamb/commerce/',
    sourceFile: 'jamb/commerce/index.html',
    title: 'JAMB Kasuwanci a Hausa',
    subject: 'Kasuwanci',
    desc: 'Jagorar Hausa don JAMB Kasuwanci: ciniki, banki, inshora, sufuri, tallace-tallace da nauin kamfani.',
    topics: ['Ciniki da kasuwa', 'Banki da inshora', 'Sufuri da sadarwa', 'Kamfani da takardun kasuwanci'],
    registry: {
      id: 'jamb-commerce-ha',
      name: 'JAMB Kasuwanci a Hausa',
      desc: 'Jagorar Hausa don ciniki, banki, inshora, sufuri da kamfani; ajiyar tambayoyi tana Turanci.',
      priority: 74
    }
  },
  {
    kind: 'jamb',
    route: '/ha/jamb/adabi/',
    file: 'ha/jamb/adabi/index.html',
    source: '/jamb/literature/',
    sourceFile: 'jamb/literature/index.html',
    title: 'JAMB Adabi a Hausa',
    subject: 'Adabi',
    desc: 'Jagorar Hausa don JAMB Adabi: wakoki, labari, wasan kwaikwayo, salo, jigo da fahimtar rubutu.',
    topics: ['Jigo da salo', 'Waka da karin magana', 'Labari da halaye', 'Wasan kwaikwayo da yanayi'],
    registry: {
      id: 'jamb-literature-ha',
      name: 'JAMB Adabi a Hausa',
      desc: 'Jagorar Hausa don waka, labari, wasan kwaikwayo, jigo da salo; ajiyar tambayoyi tana Turanci.',
      priority: 74
    }
  },
  {
    kind: 'jamb',
    route: '/ha/jamb/tarihi/',
    file: 'ha/jamb/tarihi/index.html',
    source: '/jamb/history/',
    sourceFile: 'jamb/history/index.html',
    title: 'JAMB Tarihi a Hausa',
    subject: 'Tarihi',
    desc: 'Jagorar Hausa don JAMB Tarihi: alummomi, mulkin mallaka, yanci, gwamnati da manyan sauye-sauye.',
    topics: ['Tarihin Afirka', 'Mulkin mallaka da yanci', 'Tarihin Najeriya', 'Kungiyoyi da manufofi'],
    registry: {
      id: 'jamb-history-ha',
      name: 'JAMB Tarihi a Hausa',
      desc: 'Jagorar Hausa don tarihin Najeriya, Afirka, mulkin mallaka da yanci; ajiyar tambayoyi tana Turanci.',
      priority: 72
    }
  },
  {
    kind: 'jamb',
    route: '/ha/jamb/crk/',
    file: 'ha/jamb/crk/index.html',
    source: '/jamb/crk/',
    sourceFile: 'jamb/crk/index.html',
    title: 'JAMB CRK a Hausa',
    subject: 'CRK',
    desc: 'Jagorar Hausa don JAMB CRK: littafin Bible, rayuwar Yesu, annabawa, manzanni da dabiun Kirista.',
    topics: ['Tsohon Alkawari', 'Rayuwar Yesu', 'Manzanni da cocin farko', 'Dabiun Kirista'],
    registry: {
      id: 'jamb-crk-ha',
      name: 'JAMB CRK a Hausa',
      desc: 'Jagorar Hausa don CRK, littafin Bible, rayuwar Yesu da dabiun Kirista; ajiyar tambayoyi tana Turanci.',
      priority: 71
    }
  },
  {
    kind: 'tool',
    route: '/ha/kayan-aiki/gyara-pdf/',
    file: 'ha/kayan-aiki/gyara-pdf/index.html',
    source: '/tools/pdf-editor/',
    sourceFile: 'tools/pdf-editor/index.html',
    title: 'Gyara PDF a Hausa',
    eyebrow: 'Jagorar PDF',
    desc: 'Jagorar Hausa zuwa kayan aikin gyara PDF: rubutu, hoto, alama, haskakawa, zanen hannu da fitar da PDF a burauza.',
    hero: 'Fahimci aikin gyara PDF kafin ka bude cikakken kayan aikin Turanci.',
    cards: ['Kara rubutu, hoto, tambari ko zanen hannu a kan PDF.', 'Yi amfani da farar rufe rubutu idan kana son maye gurbin abin da ke shafi.', 'Fitar da sabon PDF bayan ka duba shafuka da wuraren gyara.'],
    warning: 'Cikakken allon gyara yana Turanci yanzu. Wannan shafin Hausa jagora ce domin kada a karya aikin PDF mai amfani da zane, hoto, layi da zazzagewa.',
    related: [['/ha/kayan-aiki/sanya-hannu-pdf/', 'Sa hannu a PDF'], ['/ha/kayan-aiki/wurin-aikin-pdf/', 'Wurin aikin PDF']],
    registry: {
      id: 'pdf-editor-ha',
      name: 'Gyara PDF',
      desc: 'Jagorar Hausa zuwa kayan aikin gyara PDF na Turanci: rubutu, hoto, alama, haskakawa da fitar da PDF.',
      sourceId: 'pdf-editor',
      category: 'document-pdf',
      tier: 'T1',
      priority: 85,
      imageId: 'pdf-editor'
    }
  },
  {
    kind: 'tool',
    route: '/ha/kayan-aiki/lambar-shafi-pdf/',
    file: 'ha/kayan-aiki/lambar-shafi-pdf/index.html',
    source: '/tools/pdf-page-numbers/',
    sourceFile: 'tools/pdf-page-numbers/index.html',
    title: 'Lambar shafi a PDF',
    eyebrow: 'Jagorar PDF',
    desc: 'Jagorar Hausa don kara lambobin shafi a PDF, zabar matsayi, salon rubutu, farawa da tazara kafin bude cikakken kayan aikin Turanci.',
    hero: 'Shirya yadda lambobin shafi za su bayyana a PDF.',
    cards: ['Zabi inda lambar shafi za ta bayyana: sama, kasa, hagu, dama ko tsakiya.', 'Duba farawa, tazara da shafukan da za a lissafa kafin fitarwa.', 'Ka tabbatar takardar karshe ta dace da bukatar makaranta, aiki ko ofis.'],
    warning: 'Cikakken aikin sanya lambobin shafi yana kan shafin Turanci yanzu, amma fayil yana aiki a burauza kamar sauran kayan PDF.',
    related: [['/ha/kayan-aiki/hada-da-raba-pdf/', 'Hada da raba PDF'], ['/ha/kayan-aiki/matsa-pdf/', 'Matsa PDF']],
    registry: {
      id: 'pdf-page-numbers-ha',
      name: 'Lambar Shafi a PDF',
      desc: 'Jagorar Hausa don kara lambobin shafi a PDF, zabar matsayi da salon lamba kafin bude kayan aikin Turanci.',
      sourceId: 'pdf-page-numbers',
      category: 'document-pdf',
      tier: 'T3',
      priority: 74,
      imageId: 'pdf-page-numbers'
    }
  },
  {
    kind: 'tool',
    route: '/ha/kayan-aiki/cgt-najeriya/',
    file: 'ha/kayan-aiki/cgt-najeriya/index.html',
    source: '/tools/ng-cgt/',
    sourceFile: 'tools/ng-cgt/index.html',
    title: 'CGT Najeriya a Hausa',
    eyebrow: 'Harajin Najeriya',
    desc: 'Jagorar Hausa don fahimtar CGT Najeriya, sayar da kadarori, ragin kudin saye, kudin gyara da gargadin tabbatarwa daga FIRS ko kwararre.',
    hero: 'Fahimci CGT kafin ka dogara da lissafin sayar da kadara.',
    cards: ['Ka tattara farashin saye, kudin gyara da farashin sayarwa.', 'Ka duba ko akwai kebe, ragi ko bukatar takardar shaida daga kwararre.', 'Ka yi amfani da sakamakon a matsayin kiyasi, ba shawarar haraji ta karshe ba.'],
    warning: 'Ba mu sauya adadi ko kaidar lissafin CGT ba. Tabbatar da sakamako daga FIRS, SIRS ko kwararren mai ba da shawarar haraji.',
    related: [['/ha/kayan-aiki/kalkuletan-vat/', 'Kalkuletan VAT'], ['/ha/kayan-aiki/cit-najeriya/', 'CIT Najeriya']],
    registry: {
      id: 'ng-cgt-ha',
      name: 'CGT Najeriya',
      desc: 'Jagorar Hausa don kiyasta CGT Najeriya a kan sayar da kadara; tabbatar da FIRS ko kwararren haraji.',
      sourceId: 'ng-cgt',
      category: 'financial',
      tier: 'T2',
      priority: 73,
      imageId: 'ng-cgt'
    }
  },
  {
    kind: 'tool',
    route: '/ha/kayan-aiki/kalkuletan-paystack/',
    file: 'ha/kayan-aiki/kalkuletan-paystack/index.html',
    source: '/tools/paystack-calculator/',
    sourceFile: 'tools/paystack-calculator/index.html',
    title: 'Kalkuletan Paystack a Hausa',
    eyebrow: 'Cajin biyan kudi',
    desc: 'Jagorar Hausa don kiyasta cajin Paystack, abin da zai shigo bayan cire caji, da bukatar tabbatar da jadawalin kamfanin kafin amfani.',
    hero: 'Kiyasta abin da zai shigo bayan cajin Paystack.',
    cards: ['Saka adadin da abokin ciniki zai biya ko abin da kake son karba.', 'Duba kiyasin caji da adadin da zai rage bayan cire kudin hidima.', 'Ka tabbatar da sabon jadawalin Paystack kafin saka farashi ko aika takardar kudi.'],
    warning: 'Paystack na iya sauya caji, haraji ko sharuddan biya. Wannan jagora ba sanarwar hukuma ba ce.',
    related: [['/ha/kayan-aiki/kirkiro-invoice/', 'Kirkiro takardar kudi'], ['/ha/kayan-aiki/cajin-banki/', 'Cajin banki']],
    registry: {
      id: 'paystack-calculator-ha',
      name: 'Kalkuletan Paystack',
      desc: 'Jagorar Hausa don kiyasta cajin Paystack da abin da zai shigo bayan cire caji; tabbatar da jadawalin Paystack.',
      sourceId: 'paystack-calculator',
      category: 'ecommerce',
      tier: 'T2',
      priority: 65,
      imageId: 'payment-gateway'
    }
  },
  {
    kind: 'tool',
    route: '/ha/kayan-aiki/tazarar-riba/',
    file: 'ha/kayan-aiki/tazarar-riba/index.html',
    source: '/tools/profit-margin/',
    sourceFile: 'tools/profit-margin/index.html',
    title: 'Tazarar riba a Hausa',
    eyebrow: 'Kudin kasuwanci',
    desc: 'Jagorar Hausa don lissafa tazarar riba, kudin kaya, kudin aiki, karin farashi da ribar da ta rage bayan kashe kudi.',
    hero: 'Duba ko farashin sayarwa yana barin riba mai kyau.',
    cards: ['Saka kudin kaya, kudin aiki da farashin sayarwa.', 'Kwatanta babbar riba, ribar aiki da ribar karshe inda bayanai suka isa.', 'Yi amfani da sakamako wajen tattauna farashi, rangwame ko karin kaya.'],
    warning: 'Sakamakon kiyasi ne. Kudin sufuri, dawo da kaya, bashi da asarar kaya na iya sauya ainihin riba.',
    related: [['/ha/kayan-aiki/karin-farashi/', 'Karin farashi'], ['/ha/kayan-aiki/dawo-da-jari/', 'Dawo da jari']],
    registry: {
      id: 'profit-margin-ha',
      name: 'Tazarar Riba',
      desc: 'Jagorar Hausa don lissafa tazarar riba, kudin kaya, karin farashi da ribar kasuwanci.',
      sourceId: 'profit-margin',
      category: 'ecommerce',
      tier: 'T3',
      priority: 75,
      imageId: 'profit-margin'
    }
  },
  {
    kind: 'tool',
    route: '/ha/kayan-aiki/dawo-da-jari/',
    file: 'ha/kayan-aiki/dawo-da-jari/index.html',
    source: '/tools/break-even/',
    sourceFile: 'tools/break-even/index.html',
    title: 'Dawo da jari a Hausa',
    eyebrow: 'Kudin kasuwanci',
    desc: 'Jagorar Hausa don gano yawan sayarwa da zai dawo da jari bayan kudin dindindin, kudin da ke canzawa da farashin sayarwa.',
    hero: 'San adadin sayarwa da zai rufe kudin kasuwanci.',
    cards: ['Raba kudin dindindin daga kudin da ke canzawa.', 'Saka farashin sayarwa da kudin kowane kaya ko aiki.', 'Duba ko bukatar kasuwa za ta iya kai wa adadin da zai dawo da jari.'],
    warning: 'Wannan kiyasi ba ya maye gurbin kasafin kudi ko shawarar akawu. Farashin kaya, haya da albashi na iya canzawa.',
    related: [['/ha/kayan-aiki/tazarar-riba/', 'Tazarar riba'], ['/ha/kayan-aiki/karin-farashi/', 'Karin farashi']],
    registry: {
      id: 'break-even-ha',
      name: 'Dawo da Jari',
      desc: 'Jagorar Hausa don gano adadin sayarwa da zai rufe kudin dindindin da kudin da ke canzawa.',
      sourceId: 'break-even',
      category: 'ecommerce',
      tier: 'T3',
      priority: 70,
      imageId: 'break-even'
    }
  },
  {
    kind: 'tool',
    route: '/ha/kayan-aiki/karin-farashi/',
    file: 'ha/kayan-aiki/karin-farashi/index.html',
    source: '/tools/markup-calc/',
    sourceFile: 'tools/markup-calc/index.html',
    title: 'Karin farashi a Hausa',
    eyebrow: 'Farashin sayarwa',
    desc: 'Jagorar Hausa don lissafa karin farashi daga kudin kaya, tazarar riba da farashin sayarwa ga masu kasuwa.',
    hero: 'Kafa farashi ba tare da manta kudin kaya da riba ba.',
    cards: ['Saka kudin sayen kaya ko samarwa.', 'Zabi karin farashi ko ribar da kake so.', 'Duba sabon farashin sayarwa kafin rangwame ko farashin dillali.'],
    warning: 'Ka tabbatar da farashin kasuwa, kudin sufuri da haraji kafin kayyade farashi na karshe.',
    related: [['/ha/kayan-aiki/tazarar-riba/', 'Tazarar riba'], ['/ha/kayan-aiki/dawo-da-jari/', 'Dawo da jari']],
    registry: {
      id: 'markup-calc-ha',
      name: 'Karin Farashi',
      desc: 'Jagorar Hausa don lissafa karin farashi, tazarar riba da sabon farashin sayarwa.',
      sourceId: 'markup-calc',
      category: 'ecommerce',
      tier: 'T3',
      priority: 70,
      imageId: 'markup-calc'
    }
  },
  {
    kind: 'tool',
    route: '/ha/kayan-aiki/takardar-albashi/',
    file: 'ha/kayan-aiki/takardar-albashi/index.html',
    source: '/tools/payslip-generator/',
    sourceFile: 'tools/payslip-generator/index.html',
    title: 'Takardar albashi a Hausa',
    eyebrow: 'Albashi da HR',
    desc: 'Jagorar Hausa don shirya takardar albashi, albashi na asali, alawus, cire-cire, PAYE da PDF ba tare da sauya aikin Turanci ba.',
    hero: 'Shirya bayanan albashi kafin ka gina takardar albashi.',
    cards: ['Tattara sunan maikaci, wata, albashi, alawus da cire-cire.', 'Duba PAYE, fansho, NHF ko wasu abubuwan da kamfani yake cirewa.', 'Fitar da takardar albashi daga cikakken kayan aikin Turanci idan kana bukatar PDF.'],
    warning: 'Cikakken gina takardar albashi yana Turanci yanzu. Tabbatar da lissafi da akawu, HR ko mai kula da albashi kafin raba takarda.',
    related: [['/ha/najeriya/harajin-albashi/', 'PAYE Najeriya'], ['/ha/kayan-aiki/kudin-maikaci/', 'Kudin maikaci']],
    registry: {
      id: 'payslip-generator-ha',
      name: 'Takardar Albashi',
      desc: 'Jagorar Hausa don shirya takardar albashi, alawus, cire-cire, PAYE da PDF daga kayan aikin Turanci.',
      sourceId: 'payslip-generator',
      category: 'financial',
      tier: 'T1',
      priority: 83,
      imageId: 'payslip-generator'
    }
  },
  {
    kind: 'tool',
    route: '/ha/kayan-aiki/kudin-maikaci/',
    file: 'ha/kayan-aiki/kudin-maikaci/index.html',
    source: '/tools/staff-cost/',
    sourceFile: 'tools/staff-cost/index.html',
    title: 'Kudin maikaci a Hausa',
    eyebrow: 'Albashi da HR',
    desc: 'Jagorar Hausa don kiyasta cikakken kudin daukar maikaci: albashi, PAYE, fansho, NHF, alawus da karin kudaden aiki.',
    hero: 'Kiyasta kudin daukar maikaci fiye da albashi kadai.',
    cards: ['Saka albashin wata ko shekara da alawus.', 'Yi laakari da PAYE, fansho, NHF, inshora ko kayan aiki.', 'Kwatanta jimillar kudin kamfani da abin da maikaci zai karba.'],
    warning: 'Kudin maikaci na iya bambanta bisa dokar aiki, kwangila, kamfani da jihar. Tabbatar da HR, akawu ko mai ba da shawarar haraji.',
    related: [['/ha/najeriya/harajin-albashi/', 'PAYE Najeriya'], ['/ha/kayan-aiki/takardar-albashi/', 'Takardar albashi']],
    registry: {
      id: 'staff-cost-ha',
      name: 'Kudin Maikaci',
      desc: 'Jagorar Hausa don kiyasta cikakken kudin daukar maikaci: albashi, PAYE, fansho, NHF da alawus.',
      sourceId: 'staff-cost',
      category: 'financial',
      tier: 'T2',
      priority: 76,
      imageId: 'staff-cost'
    }
  },
  {
    kind: 'tool',
    route: '/ha/kayan-aiki/gwajin-ussd/',
    file: 'ha/kayan-aiki/gwajin-ussd/index.html',
    source: '/tools/ussd-simulator/',
    sourceFile: 'tools/ussd-simulator/index.html',
    title: 'Gwajin USSD a Hausa',
    eyebrow: 'Sadarwa',
    desc: 'Jagorar Hausa don gwada tsarin USSD, matakan menu, zabin lamba da sakon kuskure kafin a turawa masu amfani.',
    hero: 'Gwada tsarin USSD kafin ka kai shi ga kwastomomi.',
    cards: ['Rubuta matakan menu da lambobin zabi cikin tsari.', 'Gwada kuskure, dawowa baya da hanyar fita daga menu.', 'Ka tabbata sakonni sun yi gajere kuma sun dace da wayoyin yau da kullum.'],
    warning: 'Wannan ba ya aika lambar USSD ta gaske zuwa kamfanin sadarwa. Cikakken gwaji da tura sabis yana bukatar mai ba da sabis ko kamfanin sadarwa.',
    related: [['/ha/kayan-aiki/lambobin-ussd/', 'Lambobin USSD'], ['/ha/sadarwa/', 'Cibiyar sadarwa']],
    registry: {
      id: 'ussd-simulator-ha',
      name: 'Gwajin USSD',
      desc: 'Jagorar Hausa don gwada tsarin USSD, menu, zabin lamba da sakon kuskure kafin tura sabis.',
      sourceId: 'ussd-simulator',
      category: 'telecom',
      tier: 'T2',
      priority: 72,
      imageId: 'ussd-simulator'
    }
  },
  {
    kind: 'tool',
    route: '/ha/kayan-aiki/waya-ko-banki/',
    file: 'ha/kayan-aiki/waya-ko-banki/index.html',
    source: '/tools/mobile-vs-bank/',
    sourceFile: 'tools/mobile-vs-bank/index.html',
    title: 'Kudin waya ko banki a Hausa',
    eyebrow: 'Biyan kudi',
    desc: 'Jagorar Hausa don kwatanta tura kudi ta waya da banki: caji, lokaci, hadari, wakili da bukatar tabbatarwa.',
    hero: 'Kwatanta tura kudi ta waya da banki kafin biya.',
    cards: ['Duba caji, iyakar kudi da lokacin da kudi zai isa.', 'Yi laakari da wakili, ATM, manhaja, matsalar hanyar sadarwa ko banki.', 'Tabbatar da sabon caji daga manhaja, banki ko wakili kafin aika kudi.'],
    warning: 'Caji da iyaka na iya sauyawa daga banki, kamfanin waya ko manhajar biya. Wannan sakamako kiyasi ne.',
    related: [['/ha/kayan-aiki/kudin-tura-kudi-ta-waya/', 'Kudin tura kudi'], ['/ha/kayan-aiki/cajin-banki/', 'Cajin banki']],
    registry: {
      id: 'mobile-vs-bank-ha',
      name: 'Waya ko Banki',
      desc: 'Jagorar Hausa don kwatanta tura kudi ta waya da banki: caji, lokaci, iyaka da bukatar tabbatarwa.',
      sourceId: 'mobile-vs-bank',
      category: 'telecom',
      tier: 'T2',
      priority: 76,
      imageId: 'mobile-vs-bank'
    }
  },
  {
    kind: 'tool',
    route: '/ha/kayan-aiki/kwatanta-aika-kudi/',
    file: 'ha/kayan-aiki/kwatanta-aika-kudi/index.html',
    source: '/tools/remittance-compare/',
    sourceFile: 'tools/remittance-compare/index.html',
    title: 'Kwatanta aika kudi a Hausa',
    eyebrow: 'Aika kudi',
    desc: 'Jagorar Hausa don kwatanta hanyoyin aika kudi tsakanin kasashe, caji, canjin kudi, lokacin isowa da bukatar tabbatarwa.',
    hero: 'Kwatanta hanyar aika kudi kafin ka biya.',
    cards: ['Kwatanta caji, farashin canji da adadin da mai karba zai samu.', 'Duba lokacin isowa, hanyar karba da takardun da ake bukata.', 'Ka tabbatar da farashi daga kamfani kafin tura kudi mai yawa.'],
    warning: 'Farashin canji da caji na iya canzawa cikin sauri. AfroTools ba ya bayar da farashin hukuma ko tabbacin isar kudi.',
    related: [['/ha/kayan-aiki/canja-kudi/', 'Canjin kudi'], ['/ha/kayan-aiki/kudin-tura-kudi-ta-waya/', 'Kudin tura kudi']],
    registry: {
      id: 'remittance-compare-ha',
      name: 'Kwatanta Aika Kudi',
      desc: 'Jagorar Hausa don kwatanta hanyoyin aika kudi, caji, canjin kudi, lokacin isowa da bukatar tabbatarwa.',
      sourceId: 'remittance-compare',
      category: 'financial',
      tier: 'T2',
      priority: 82,
      imageId: 'remittance-compare'
    }
  },
  {
    kind: 'tool',
    route: '/ha/noma/kalandar-shuka/',
    file: 'ha/noma/kalandar-shuka/index.html',
    source: '/tools/planting-calendar/',
    sourceFile: 'tools/planting-calendar/index.html',
    title: 'Kalandar shuka a Hausa',
    eyebrow: 'Noma',
    desc: 'Jagorar Hausa don kalandar shuka, lokacin damina, yankin noma, irin amfanin gona da bukatar shawarar jamiin fadakarwa.',
    hero: 'Shirya lokacin shuka bisa damina da yankin gona.',
    cards: ['Zabi yankin noma, amfanin gona da lokacin damina.', 'Duba shawarar lokacin shuka, girbi da hadarin jinkiri.', 'Tambayi jamiin fadakarwa ko manomin yankinku idan yanayi ya sauya.'],
    warning: 'Yanayi, ruwa, kasa da iri na iya bambanta sosai. Wannan jagora ba ya maye gurbin shawarar agronomy ko sanarwar hukumar noma.',
    related: [['/ha/noma/yawan-iri-najeriya/', 'Yawan iri'], ['/ha/noma/taki-najeriya/', 'Taki Najeriya']],
    registry: {
      id: 'planting-calendar-ha',
      name: 'Kalandar Shuka',
      desc: 'Jagorar Hausa don shirin lokacin shuka, damina, yankin noma da bukatar tabbatarwa daga jamiin fadakarwa.',
      sourceId: 'planting-calendar',
      category: 'agriculture',
      tier: 'T2',
      priority: 73,
      imageId: 'planting-calendar'
    }
  },
  {
    kind: 'tool',
    route: '/ha/noma/hadarin-fari/',
    file: 'ha/noma/hadarin-fari/index.html',
    source: '/tools/drought-risk/',
    sourceFile: 'tools/drought-risk/index.html',
    title: 'Hadarin fari a Hausa',
    eyebrow: 'Noma da yanayi',
    desc: 'Jagorar Hausa don fahimtar hadarin fari, rashin ruwa, jinkirin damina, amfanin gona da bukatar bayanan yanayi na hukuma.',
    hero: 'Duba alamu kafin fari ya lalata shirin gona.',
    cards: ['Kwatanta bukatar ruwa ta amfanin gona da yanayin damina.', 'Yi laakari da ban ruwa, irin da ke jure fari da raba lokacin shuka.', 'Bi sanarwar yanayi da shawarar jamiin fadakarwa kafin yanke hukunci.'],
    warning: 'Hadarin fari kiyasi ne. Yi amfani da bayanan hukumar yanayi, jamiin fadakarwa da kwarewar manoman yankinku kafin saka jari.',
    related: [['/ha/noma/ban-ruwa-najeriya/', 'Ban ruwa Najeriya'], ['/ha/noma/kalandar-shuka/', 'Kalandar shuka']],
    registry: {
      id: 'drought-risk-ha',
      name: 'Hadarin Fari',
      desc: 'Jagorar Hausa don fahimtar hadarin fari, rashin ruwa, jinkirin damina da bukatar bayanan yanayi na hukuma.',
      sourceId: 'drought-risk',
      category: 'agriculture',
      tier: 'T3',
      priority: 66,
      imageId: 'irrigation-nigeria'
    }
  }
];

function abs(p) {
  return path.join(root, p);
}

function ensureDir(file) {
  fs.mkdirSync(path.dirname(abs(file)), { recursive: true });
}

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function localImageFor(page) {
  const imageId = page.registry && page.registry.imageId ? page.registry.imageId : 'jamb-aggregate';
  for (const ext of ['webp', 'svg', 'png', 'jpg']) {
    const rel = `/assets/img/tools/${imageId}.${ext}`;
    if (fs.existsSync(abs(rel.replace(/^\//, '')))) return rel;
  }
  return '/assets/img/tools/afrotools-pro.svg';
}

function imageFor(page) {
  return `${site}${localImageFor(page)}`;
}

function css() {
  return `
  <link rel="stylesheet" href="/ha/assets/ha-lane.css">
  <link rel="stylesheet" href="/ha/assets/ha-improvements.css?v=20260710">`;
}

function head(page) {
  const image = imageFor(page);
  return `<!doctype html>
<html data-chat-bundle="/assets/js/bundles/chat.da912503.min.js" lang="ha">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="view-transition" content="same-origin">
  <title>${esc(page.title)} | AfroTools Hausa</title>
  <meta name="description" content="${esc(page.desc)}">
  <meta name="robots" content="index, follow">
  <meta name="content-language" content="ha">
  <meta name="tool-id" content="${esc(page.registry.id)}">
  <link rel="canonical" href="${site}${page.route}">
  <link rel="alternate" hreflang="en" href="${site}${page.source}">
  <link rel="alternate" hreflang="ha" href="${site}${page.route}">
  <link rel="alternate" hreflang="x-default" href="${site}${page.source}">
  <link rel="icon" type="image/svg+xml" href="/assets/img/logo-mark.svg">
  <meta property="og:title" content="${esc(page.title)} | AfroTools Hausa">
  <meta property="og:description" content="${esc(page.desc)}">
  <meta property="og:type" content="website">
  <meta property="og:url" content="${site}${page.route}">
  <meta property="og:image" content="${image}">
  <meta property="og:locale" content="ha_NG">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${esc(page.title)} | AfroTools Hausa">
  <meta name="twitter:description" content="${esc(page.desc)}">
  <meta name="twitter:image" content="${image}">
  <link rel="stylesheet" href="/assets/css/tokens.min.css?v=b6d25198">
  <link rel="stylesheet" href="/assets/css/global.min.css?v=df4e2f26">
  <script src="/assets/js/components/navbar.min.js?v=5ac46dd6" defer></script>
  <script src="/assets/js/components/footer.min.js?v=ae996767" defer></script>
  <script src="/assets/js/afro-history.js?v=6ecf1296" defer></script>
  <script src="/ha/assets/ha-surface.js?v=20260710" defer></script>
  <script type="application/ld+json">${JSON.stringify({"@context":"https://schema.org","@type":"WebPage","name":page.title,"description":page.desc,"url":site+page.route,"inLanguage":"ha","isPartOf":{"@type":"WebSite","name":"AfroTools","url":site+"/"},"image":image})}</script>
  <script type="application/ld+json">${JSON.stringify({"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":1,"name":"AfroTools Hausa","item":site+"/ha/"},{"@type":"ListItem","position":2,"name":page.route.startsWith('/ha/jamb/')?"JAMB":page.route.startsWith('/ha/noma/')?"Noma":"Kayan aiki","item":site+(page.route.startsWith('/ha/jamb/')?"/ha/jamb/":page.route.startsWith('/ha/noma/')?"/ha/noma/":"/ha/kayan-aiki/")},{"@type":"ListItem","position":3,"name":page.title,"item":site+page.route}]})}</script>
${css()}
</head>`;
}

function jambPage(page) {
  const topicCards = page.topics.map(topic => `<article class="card"><span class="tag">Darasi</span><h2>${esc(topic)}</h2><p>Ka fara da maanar kalmomi, ka rubuta gajeren bayani, sannan ka yi atisaye daga tambayoyin da ke shafin Turanci.</p></article>`).join('\n      ');
  return `${head(page)}
<body>
<a class="skip-link" href="#main">Tsallake zuwa babban abun ciki</a>
<afro-navbar active="education"></afro-navbar>
<header class="hero" style="--hero-image:url('/assets/img/tools/jamb-aggregate.webp')">
  <div class="wrap">
    <nav class="crumb" aria-label="breadcrumb"><a href="/ha/">AfroTools Hausa</a><span>/</span><a href="/ha/jamb/">JAMB</a><span>/</span><span>${esc(page.subject)}</span></nav>
    <span class="eyebrow">Jagorar JAMB</span>
    <h1>${esc(page.title)}</h1>
    <p>${esc(page.desc)} Tambayoyin shekarun da suka gabata suna nan a shafin Turanci; wannan shafin yana taimaka maka fahimtar abin da za ka karanta a Hausa.</p>
    <div class="actions">
      <a class="btn primary" href="${page.source}">Bude ajiyar tambayoyi ta Turanci</a>
      <a class="btn secondary" href="/ha/jamb/cbt/">Jagorar CBT a Hausa</a>
      <a class="btn secondary" href="/ha/kayan-aiki/kalkuletan-jamb/">Kalkuletan JAMB</a>
    </div>
  </div>
</header>
<main id="main">
  <div class="wrap layout">
    <section>
      <div class="grid">
      ${topicCards}
      </div>
      <section class="card" style="margin-top:18px">
        <span class="tag">Yadda za a yi amfani da shi</span>
        <h2>Karatu da atisaye cikin gaskiya</h2>
        <ol class="steps">
          <li>Karanta mahimman kalmomi a Hausa, sannan ka bude shafin Turanci domin tambayoyin asali.</li>
          <li>Yi CBT ko tsoffin tambayoyi da lokaci idan kana son gwada saurin amsa.</li>
          <li>Kar ka dauka an kirkiri shafukan shekarun Hausa. Ajiyar shekaru tana kan asalin shafin Turanci.</li>
        </ol>
      </section>
    </section>
    <aside>
      <section class="note warn">
        <span class="tag warn">Gaskiyar hanya</span>
        <h2>Ajiyar tambayoyi tana Turanci</h2>
        <p>Wannan shafi jagora ce ta Hausa. Ba mu canza tambayoyi, amsoshi, tarihin shekaru ko aikin CBT ba.</p>
      </section>
      <section class="note" style="margin-top:16px">
        <h2>Hanyoyi masu amfani</h2>
        <div class="links">
          <a href="/ha/jamb/past-questions/"><strong>Tsoffin tambayoyi</strong><span>Jagorar Hausa zuwa ajiyar tambayoyi.</span></a>
          <a href="/ha/jamb/tutor/"><strong>Mai taimakon JAMB</strong><span>Jagorar Hausa zuwa taimakon Turanci.</span></a>
          <a href="/ha/jamb/"><strong>Cibiyar JAMB</strong><span>Komawa hub din JAMB a Hausa.</span></a>
        </div>
      </section>
    </aside>
  </div>
</main>
<afro-footer></afro-footer>
</body>
</html>
`;
}

function toolPage(page) {
  const cards = page.cards.map(text => `<article class="card"><span class="tag">Abin lura</span><h2>${esc(text.split('.')[0])}</h2><p>${esc(text)}</p></article>`).join('\n      ');
  const related = page.related.map(([href, label]) => `<a href="${href}"><strong>${esc(label)}</strong><span>Akwai da Hausa idan hanyar tana cikin /ha/.</span></a>`).join('\n          ');
  return `${head(page)}
<body>
<a class="skip-link" href="#main">Tsallake zuwa babban abun ciki</a>
<afro-navbar active="tools"></afro-navbar>
<header class="hero" style="--hero-image:url('${esc(localImageFor(page))}')">
  <div class="wrap">
    <nav class="crumb" aria-label="breadcrumb"><a href="/ha/">AfroTools Hausa</a><span>/</span><a href="${page.route.startsWith('/ha/noma/')?'/ha/noma/':'/ha/kayan-aiki/'}">${page.route.startsWith('/ha/noma/')?'Noma':'Kayan aiki'}</a><span>/</span><span>${esc(page.title)}</span></nav>
    <span class="eyebrow">${esc(page.eyebrow)}</span>
    <h1>${esc(page.hero)}</h1>
    <p>${esc(page.desc)}</p>
    <div class="actions">
      <a class="btn primary" href="${page.source}">Bude shafin Turanci</a>
      <a class="btn secondary" href="/ha/kayan-aiki/">Koma jerin kayan aiki</a>
    </div>
  </div>
</header>
<main id="main">
  <div class="wrap layout">
    <section>
      <div class="grid">
      ${cards}
      </div>
      <section class="card" style="margin-top:18px">
        <span class="tag">Matakan aiki</span>
        <h2>Yadda za ka yi amfani da cikakken kayan aiki</h2>
        <ol class="steps">
          <li>Karanta bayanin Hausa domin ka san irin bayanan da za ka tanada.</li>
          <li>Bude shafin Turanci mai aiki idan kana bukatar lissafi, fayil ko cikakken ma'amala.</li>
          <li>Duba sakamako da kanka, sannan ka tabbatar daga kwararre, kamfani ko tushe na hukuma idan sakamakon zai shafi kudi, doka ko takarda.</li>
        </ol>
      </section>
    </section>
    <aside>
      <section class="note warn">
        <span class="tag warn">Gaskiyar hanya</span>
        <h2>Jagorar Hausa ce, aikin yana nan a asali</h2>
        <p>${esc(page.warning)}</p>
      </section>
      <section class="note" style="margin-top:16px">
        <h2>Hanyoyi masu kusa</h2>
        <div class="links">
          ${related}
          <a href="${page.source}"><strong>Shafin Turanci</strong><span>Cikakken aikin da aka kiyaye daga asali.</span></a>
        </div>
      </section>
    </aside>
  </div>
</main>
<afro-footer></afro-footer>
</body>
</html>
`;
}

function pageHtml(page) {
  return page.kind === 'jamb' ? jambPage(page) : toolPage(page);
}

function addHreflang(page) {
  const sourcePath = abs(page.sourceFile);
  if (!fs.existsSync(sourcePath)) {
    throw new Error(`Missing source file: ${page.sourceFile}`);
  }
  let html = fs.readFileSync(sourcePath, 'utf8');
  const haLine = `<link rel="alternate" hreflang="ha" href="${site}${page.route}" />`;
  if (html.includes(haLine)) return;
  if (html.includes('<link rel="alternate" hreflang="x-default"')) {
    html = html.replace(/(<link rel="alternate" hreflang="x-default"[^>]*>\s*)/, `${haLine}\n$1`);
  } else {
    html = html.replace('</head>', `${haLine}\n</head>`);
  }
  fs.writeFileSync(sourcePath, html);
}

function registryRow(page) {
  const r = page.registry;
  const category = r.category || 'education';
  const tier = r.tier || 'T2';
  const priority = r.priority || 70;
  const revenue = r.revenue || 'Discovery';
  const estTraffic = r.estTraffic || 2500;
  const estRevenue = r.estRevenue || 45;
  const source = r.sourceId ? `, sourceId: '${r.sourceId}'` : '';
  const imageId = r.imageId || 'jamb-aggregate';
  return `  { id: '${r.id}', name: '${r.name}', icon: '${page.kind === 'jamb' ? 'JAMB' : (category === 'document-pdf' ? 'PDF' : category === 'telecom' ? 'USSD' : category === 'agriculture' ? 'NOMA' : category === 'ecommerce' ? 'BIZ' : 'NG')}', desc: '${r.desc}', href: '${page.route}', category: '${category}', tier: '${tier}', status: 'live', phase: 'LIVE', countries: ['${category === 'document-pdf' || category === 'ecommerce' || r.sourceId === 'remittance-compare' ? 'ALL' : 'NG'}'], revenue: '${revenue}', estTraffic: ${estTraffic}, estRevenue: ${estRevenue}, priority: ${priority}, lang: 'ha'${source}, imageId: '${imageId}' },`;
}

function updateRegistry() {
  const registryFile = abs('assets/js/components/tool-registry.js');
  let registry = fs.readFileSync(registryFile, 'utf8');
  const rows = pages.filter(page => !registry.includes(`id: '${page.registry.id}'`)).map(registryRow);
  if (!rows.length) return 0;
  const anchor = "  { id: 'fish-farming-nigeria-ha'";
  const index = registry.indexOf(anchor);
  if (index === -1) throw new Error('Registry anchor not found');
  registry = `${registry.slice(0, index)}${rows.join('\n')}\n${registry.slice(index)}`;
  fs.writeFileSync(registryFile, registry);
  return rows.length;
}

function updateTextFile(file, replacements) {
  const full = abs(file);
  if (!fs.existsSync(full)) return 0;
  let text = fs.readFileSync(full, 'utf8');
  let changed = 0;
  for (const [from, to] of replacements) {
    if (text.includes(from) && !text.includes(to)) {
      text = text.replace(from, to);
      changed += 1;
    }
  }
  fs.writeFileSync(full, text);
  return changed;
}

function updateHubs() {
  let changes = 0;
  changes += updateTextFile('ha/kayan-aiki/index.html', [
    [`<a class="ha-card" href="/tools/payslip-generator/" data-kind="fallback" data-group="salary-tax pdf business" data-search="payslip payroll albashi pdf">
            <small>Shafi na Turanci</small><h3>Takardar albashi</h3><p>Shirya takardar albashi mai tsari don HR, ma'aikata ko bayanan albashi.</p><span class="ha-card-link">Bude kayan aiki</span>`,
     `<a class="ha-card" href="/ha/kayan-aiki/takardar-albashi/" data-kind="hausa" data-group="salary-tax pdf business" data-search="takardar albashi payslip payroll pdf">
            <small>Akwai da Hausa</small><h3>Takardar albashi</h3><p>Shirya bayanan albashi, alawus, cire-cire da PDF kafin bude cikakken kayan aikin Turanci.</p><span class="ha-card-link">Bude jagora</span>`],
    [`<a class="ha-card" href="/tools/remittance-compare/" data-kind="fallback" data-group="money" data-search="remittance transfer money diaspora">
            <small>Shafi na Turanci</small><h3>Kwatanta aika kudi</h3><p>Kwatanta hanyoyin tura kudi da kudin hidima tsakanin kasashe.</p><span class="ha-card-link">Bude kayan aiki</span>`,
     `<a class="ha-card" href="/ha/kayan-aiki/kwatanta-aika-kudi/" data-kind="hausa" data-group="money" data-search="aika kudi remittance transfer diaspora">
            <small>Akwai da Hausa</small><h3>Kwatanta aika kudi</h3><p>Kwatanta caji, canjin kudi, lokacin isowa da adadin da mai karba zai samu.</p><span class="ha-card-link">Bude jagora</span>`],
    [`<a class="ha-card" href="/tools/paystack-calculator/" data-kind="fallback" data-group="money business nigeria" data-search="paystack fees payment business nigeria">
            <small>Shafi na Turanci</small><h3>Kalkuletan Paystack</h3><p>Kiyasta kudin karbar biya da abin da zai shigo bayan cire caji.</p><span class="ha-card-link">Bude kayan aiki</span>`,
     `<a class="ha-card" href="/ha/kayan-aiki/kalkuletan-paystack/" data-kind="hausa" data-group="money business nigeria" data-search="paystack caji karbar biya kasuwanci">
            <small>Akwai da Hausa</small><h3>Kalkuletan Paystack</h3><p>Kiyasta caji da abin da zai shigo bayan cire kudin Paystack, sannan tabbatar da jadawalin kamfani.</p><span class="ha-card-link">Bude jagora</span>`],
    [`<a class="ha-card" href="/tools/profit-margin/" data-kind="fallback" data-group="business money" data-search="profit margin kasuwanci riba">
            <small>Shafi na Turanci</small><h3>Tazarar riba</h3><p>Kokoto riba, karin farashi da farashin sayarwa.</p><span class="ha-card-link">Bude kayan aiki</span>`,
     `<a class="ha-card" href="/ha/kayan-aiki/tazarar-riba/" data-kind="hausa" data-group="business money" data-search="tazarar riba kasuwanci farashi">
            <small>Akwai da Hausa</small><h3>Tazarar riba</h3><p>Kokoto kudin kaya, kudin aiki da ribar da ke ragewa bayan kashe kudi.</p><span class="ha-card-link">Bude jagora</span>`],
    [`<a class="ha-card" href="/tools/break-even/" data-kind="fallback" data-group="business money" data-search="break even kasuwanci riba cost">
            <small>Shafi na Turanci</small><h3>Dawo da jari</h3><p>Nemo yawan sayarwa da zai dawo da kudin kasuwanci.</p><span class="ha-card-link">Bude kayan aiki</span>`,
     `<a class="ha-card" href="/ha/kayan-aiki/dawo-da-jari/" data-kind="hausa" data-group="business money" data-search="dawo da jari kasuwanci riba cost">
            <small>Akwai da Hausa</small><h3>Dawo da jari</h3><p>Nemo yawan sayarwa da zai rufe kudin dindindin da kudin da ke canzawa.</p><span class="ha-card-link">Bude jagora</span>`],
    [`<a class="ha-card" href="/tools/markup-calc/" data-kind="fallback" data-group="business money" data-search="markup price kasuwanci riba">
            <small>Shafi na Turanci</small><h3>Kalkuletan karin farashi</h3><p>Kokoto karin farashi, tazarar riba da sabon farashin kaya.</p><span class="ha-card-link">Bude kayan aiki</span>`,
     `<a class="ha-card" href="/ha/kayan-aiki/karin-farashi/" data-kind="hausa" data-group="business money" data-search="karin farashi kasuwanci riba">
            <small>Akwai da Hausa</small><h3>Kalkuletan karin farashi</h3><p>Kokoto karin farashi, tazarar riba da sabon farashin sayarwa.</p><span class="ha-card-link">Bude jagora</span>`],
    [`<a class="ha-card" href="/ha/kayan-aiki/sanya-hannu-pdf/" data-kind="hausa" data-group="pdf documents" data-search="pdf sign signature sanya hannu sa hannu takardu">
            <small>Akwai da Hausa</small><h3>Sa hannu a PDF</h3><p>Sanya hannu ko alama a PDF a cikin burauza, tare da bayanin sarrafa fayil a gida.</p><span class="ha-card-link">Bude kayan aiki</span>
          </a>`,
     `<a class="ha-card" href="/ha/kayan-aiki/sanya-hannu-pdf/" data-kind="hausa" data-group="pdf documents" data-search="pdf sign signature sanya hannu sa hannu takardu">
            <small>Akwai da Hausa</small><h3>Sa hannu a PDF</h3><p>Sanya hannu ko alama a PDF a cikin burauza, tare da bayanin sarrafa fayil a gida.</p><span class="ha-card-link">Bude kayan aiki</span>
          </a>
          <a class="ha-card" href="/ha/kayan-aiki/gyara-pdf/" data-kind="hausa" data-group="pdf documents" data-search="gyara pdf editor rubutu hoto alama">
            <small>Akwai da Hausa</small><h3>Gyara PDF</h3><p>Jagorar Hausa zuwa gyaran PDF: rubutu, hoto, alama, haskakawa da fitarwa.</p><span class="ha-card-link">Bude jagora</span>
          </a>
          <a class="ha-card" href="/ha/kayan-aiki/lambar-shafi-pdf/" data-kind="hausa" data-group="pdf documents" data-search="lambar shafi pdf page numbers">
            <small>Akwai da Hausa</small><h3>Lambar shafi a PDF</h3><p>Shirya lambobin shafi, matsayi, farawa da salon rubutu kafin bude kayan aikin Turanci.</p><span class="ha-card-link">Bude jagora</span>
          </a>`]
  ]);
  changes += updateTextFile('ha/kasuwanci-da-haraji/index.html', [
    [`<a class="ha-card" href="/tools/break-even/"><small>Shafi na Turanci</small><h3>Dawo da jari</h3><p>Kiyasta yawan sayarwa da zai mayar da jari bayan kudin dindindin da kudin da ke canzawa.</p><span class="ha-card-link">Bude kayan aiki</span></a>`,
     `<a class="ha-card" href="/ha/kayan-aiki/dawo-da-jari/"><small>Akwai da Hausa</small><h3>Dawo da jari</h3><p>Kiyasta yawan sayarwa da zai mayar da jari bayan kudin dindindin da kudin da ke canzawa.</p><span class="ha-card-link">Bude jagora</span></a>
          <a class="ha-card" href="/ha/kayan-aiki/tazarar-riba/"><small>Akwai da Hausa</small><h3>Tazarar riba</h3><p>Kokoto kudin kaya, kudin aiki da ribar da ta rage bayan kashe kudi.</p><span class="ha-card-link">Bude jagora</span></a>
          <a class="ha-card" href="/ha/kayan-aiki/karin-farashi/"><small>Akwai da Hausa</small><h3>Karin farashi</h3><p>Kafa farashin sayarwa daga kudin kaya da ribar da ake so.</p><span class="ha-card-link">Bude jagora</span></a>`]
  ]);
  changes += updateTextFile('ha/takardu-da-pdf/index.html', [
    [`<a href="/ha/kayan-aiki/sanya-hannu-pdf/">Sa hannu a PDF</a>`,
     `<a href="/ha/kayan-aiki/sanya-hannu-pdf/">Sa hannu a PDF</a>
          <a href="/ha/kayan-aiki/gyara-pdf/">Gyara PDF</a>
          <a href="/ha/kayan-aiki/lambar-shafi-pdf/">Lambar shafi a PDF</a>`]
  ]);
  changes += updateTextFile('ha/noma/index.html', [
    [`<a class="ha-agri-card" href="/ha/noma/yawan-iri-najeriya/">
        <small>Akwai da Hausa</small>
        <h3>Yawan iri Najeriya</h3>
        <p>Kiyasta yawan iri, tazara, yawan tsiro da kudin iri kafin shuka.</p>
        <span class="ha-card-link">Bude</span>
      </a>`,
     `<a class="ha-agri-card" href="/ha/noma/yawan-iri-najeriya/">
        <small>Akwai da Hausa</small>
        <h3>Yawan iri Najeriya</h3>
        <p>Kiyasta yawan iri, tazara, yawan tsiro da kudin iri kafin shuka.</p>
        <span class="ha-card-link">Bude</span>
      </a>
      <a class="ha-agri-card" href="/ha/noma/kalandar-shuka/">
        <small>Akwai da Hausa</small>
        <h3>Kalandar shuka</h3>
        <p>Shirya lokacin shuka bisa damina, yankin noma da amfanin gona.</p>
        <span class="ha-card-link">Bude</span>
      </a>
      <a class="ha-agri-card" href="/ha/noma/hadarin-fari/">
        <small>Akwai da Hausa</small>
        <h3>Hadarin fari</h3>
        <p>Fahimci rashin ruwa, jinkirin damina da bukatar tabbatarwa daga bayanan yanayi.</p>
        <span class="ha-card-link">Bude</span>
      </a>`]
  ]);
  return changes;
}

function writeReports() {
  const haRouteFiles = [];
  function walk(dir) {
    for (const entry of fs.readdirSync(abs(dir), { withFileTypes: true })) {
      const rel = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(rel);
      else if (entry.name === 'index.html') haRouteFiles.push(rel.replace(/\\/g, '/'));
    }
  }
  walk('ha');
  const registry = fs.readFileSync(abs('assets/js/components/tool-registry.js'), 'utf8');
  const haRows = (registry.match(/lang: 'ha'/g) || []).length;
  const addedRoutes = pages.map(page => `- \`${page.route}\` -> \`${page.source}\``).join('\n');
  const md = `# Hausa Full Localization Coverage Pass

Snapshot date: 2026-05-18

## Current State

- Public Hausa routes after this pass: ${haRouteFiles.length}.
- Hausa registry rows after this pass: ${haRows}.
- New core Hausa guide or shell pages in this pass: ${pages.length}.
- Visible-copy policy: a route is only called Hausa when \`/ha/\` exists; complex English workflows are labeled with Hausa fallback language.

## New Core Routes Added

${addedRoutes}

## What This Pass Finishes

- The existing Hausa lane now has documented Hausa entry points for the main Nigeria-first clusters: PAYE, VAT, JAMB, PDF, telecom, business pricing, money movement, agriculture, health, language and documents.
- High-risk workflows such as PDF editing, Paystack fee checks, remittance comparison, CGT, payslip generation and USSD simulation are presented as Hausa guides or shells where the runtime remains on the English source page.
- New subject routes cover more JAMB demand without creating fake Hausa yearly archives.

## Remaining Full-Repo Gap

AfroTools still has many English registry-backed tools outside the Hausa lane. They should not be bulk-copied into \`/ha/\` without source review, route naming, registry ownership and visible-copy audit. The safe next step is category-by-category expansion, not raw page-pack generation.

## Validation Stack

\`\`\`bash
node scripts/audit-hausa-visible-copy.js
npm run build:i18n:validate
npm run validate:hreflang
npm run audit
npm run seo:report
npm run check-links
git diff --check
\`\`\`
`;
  fs.writeFileSync(abs('reports/hausa-full-localization-coverage.md'), md);
}

function updateDocs() {
  const strategyFile = abs('docs/HAUSA-LOCALIZATION-STRATEGY.md');
  if (fs.existsSync(strategyFile)) {
    let strategy = fs.readFileSync(strategyFile, 'utf8');
    strategy = strategy.replace(/Hausa routes scanned: `72`/g, 'Hausa routes scanned: `92`');
    strategy = strategy.replace(/Current public Hausa route count: `72`/g, 'Current public Hausa route count: `92`');
    strategy = strategy.replace(/Hausa registry rows: `67`/g, 'Hausa registry rows: `87`');
    strategy = strategy.replace(/Current working-tree lane has moved to `72` routes and\s+`67` registry rows after five Batch 6 shells:[^\n]+/s, 'Current working-tree lane has moved to `92` routes and `87` registry rows after Batch 6 and the core expansion pass.');
    if (!strategy.includes('## Full Coverage Completion Rule')) {
      strategy += `

## Full Coverage Completion Rule

The Hausa lane is now broad enough for internal product preview, but full AfroTools parity still requires category-by-category expansion. Do not treat the remaining English registry as automatically translated. A new Hausa route needs:

- a real source route or mature workflow,
- a natural Hausa slug,
- honest fallback wording if the runtime remains English,
- registry ownership only after the route exists,
- reciprocal hreflang when the English counterpart is clear,
- visible-copy audit passing with zero blockers.

Use \`reports/hausa-full-localization-coverage.md\` as the current completion ledger before starting the next expansion batch.
`;
    }
    fs.writeFileSync(strategyFile, strategy);
  }

  const ownershipFile = abs('reports/hausa-route-ownership-map.md');
  if (fs.existsSync(ownershipFile)) {
    let ownership = fs.readFileSync(ownershipFile, 'utf8');
    ownership = ownership.replace(/Public Hausa routes: 72/g, 'Public Hausa routes: 92');
    ownership = ownership.replace(/Hausa registry rows: 67/g, 'Hausa registry rows: 87');
    if (!ownership.includes('### Core expansion pages')) {
      ownership += `

### Core expansion pages

These Batch 7-style routes are Hausa route-visible guides or shells for mature source pages. They do not claim that complex English runtimes are fully localized:

${pages.map(page => `- \`${page.route}\` -> \`${page.source}\``).join('\n')}
`;
    }
    fs.writeFileSync(ownershipFile, ownership);
  }
}

function main() {
  for (const page of pages) {
    if (!fs.existsSync(abs(page.sourceFile))) {
      throw new Error(`Missing source for ${page.route}: ${page.sourceFile}`);
    }
    ensureDir(page.file);
    fs.writeFileSync(abs(page.file), pageHtml(page));
    addHreflang(page);
  }
  const registryRows = updateRegistry();
  const hubChanges = updateHubs();
  writeReports();
  updateDocs();
  console.log(JSON.stringify({ pages: pages.length, registryRows, hubChanges }, null, 2));
}

main();
