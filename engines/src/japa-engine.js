(function installFrenchJapaFromEnglishOwner(window, document) {
  "use strict";
  var DB={
 fx:{
   // Origin currencies ? USD dividers
   NGN:1580,GHS:16.5,KES:129,ZAR:18.2,EGP:50.5,ETB:127,TZS:2680,UGX:3750,
   RWF:1380,XOF:610,XAF:610,ZWL:361,ZMW:27.5,MZN:63.5,BWP:13.6,NAD:18.4,
   AOA:930,MAD:10.1,TND:3.15,SDG:600,CDF:2800,SSP:1300,MWK:1730,DZD:135,LYD:4.84,
   GNF:8600,SLE:22.5,LRD:192,GMD:72,
   // Destination currencies ? USD multipliers
   CAD:0.72,GBP:1.27,EUR:1.08,AUD:0.65,NZD:0.59,AED:0.272,QAR:0.274,SAR:0.266,OMR:2.604,
   SEK:0.094,NOK:0.091,DKK:0.145,PLN:0.25,SGD:0.74
 },
 origins:{
  // --- WEST AFRICA ------------------------------------------------
  NG:{name:'Nigeria',cur:'NGN',sym:'?',
    cities:['Lagos','Abuja','Port Harcourt','Ibadan','Kano','Enugu','Calabar','Warri'],
    ielts:299000,pte:220000,ieltPrep:150000,med:85000,police:5000,passNew:70000,
    translate:30000,consultant:800000,shipping:2200,storage:25000,
    flights:{CA:950,US:850,UK:650,DE:600,NL:620,PT:580,FR:590,SE:640,IE:680,NO:660,FI:650,DK:630,IT:560,ES:540,PL:560,AU:1300,NZ:1400,AE:480,QA:460,SA:420,SG:700}},
  GH:{name:'Ghana',cur:'GHS',sym:'GH?',
    cities:['Accra','Kumasi','Takoradi','Tamale','Cape Coast','Sunyani'],
    ielts:1320,pte:970,ieltPrep:800,med:500,police:50,passNew:250,
    translate:200,consultant:3500,shipping:2500,storage:150,
    flights:{CA:1000,US:900,UK:700,DE:650,NL:680,PT:620,FR:640,SE:700,IE:720,NO:720,FI:720,DK:700,IT:600,ES:580,PL:600,AU:1350,NZ:1450,AE:500,QA:480,SA:440,SG:750}},
  SN:{name:'Senegal',cur:'XOF',sym:'CFA',
    cities:['Dakar','Thies','Saint-Louis','Ziguinchor','Kaolack'],
    ielts:180000,pte:110000,ieltPrep:100000,med:40000,police:2000,passNew:50000,
    translate:30000,consultant:500000,shipping:300000,storage:20000,
    flights:{CA:950,US:800,UK:600,DE:500,NL:520,PT:480,FR:380,SE:560,IE:600,NO:580,FI:580,DK:560,IT:460,ES:440,PL:480,AU:1350,NZ:1500,AE:520,QA:500,SA:460,SG:750}},
  CI:{name:'Ivory Coast',cur:'XOF',sym:'CFA',
    cities:['Abidjan','Yamoussoukro','Bouake','Daloa','San Pedro'],
    ielts:180000,pte:110000,ieltPrep:100000,med:40000,police:2500,passNew:45000,
    translate:30000,consultant:500000,shipping:300000,storage:20000,
    flights:{CA:1000,US:850,UK:600,DE:500,NL:520,PT:480,FR:360,SE:560,IE:620,NO:580,FI:580,DK:560,IT:460,ES:440,PL:480,AU:1400,NZ:1500,AE:530,QA:510,SA:470,SG:760}},
  ML:{name:'Mali',cur:'XOF',sym:'CFA',
    cities:['Bamako','Sikasso','S-gou','Mopti'],
    ielts:180000,pte:110000,ieltPrep:110000,med:35000,police:3000,passNew:40000,
    translate:25000,consultant:450000,shipping:350000,storage:18000,
    flights:{CA:1100,US:950,UK:700,DE:580,NL:600,PT:560,FR:420,SE:640,IE:720,NO:660,FI:660,DK:640,IT:520,ES:500,PL:540,AU:1500,NZ:1600,AE:560,QA:540,SA:500,SG:800}},
  TG:{name:'Togo',cur:'XOF',sym:'CFA',
    cities:['Lom-','Sokod-','Kara','Atakpam-'],
    ielts:180000,pte:110000,ieltPrep:100000,med:35000,police:2000,passNew:40000,
    translate:25000,consultant:450000,shipping:320000,storage:18000,
    flights:{CA:1050,US:900,UK:680,DE:560,NL:580,PT:540,FR:400,SE:620,IE:700,NO:640,FI:640,DK:620,IT:500,ES:480,PL:520,AU:1450,NZ:1550,AE:540,QA:520,SA:480,SG:780}},
  BJ:{name:'Benin',cur:'XOF',sym:'CFA',
    cities:['Cotonou','Porto-Novo','Parakou','Abomey'],
    ielts:180000,pte:110000,ieltPrep:100000,med:35000,police:2500,passNew:42000,
    translate:25000,consultant:450000,shipping:320000,storage:18000,
    flights:{CA:1050,US:900,UK:680,DE:560,NL:580,PT:540,FR:400,SE:620,IE:700,NO:640,FI:640,DK:620,IT:500,ES:480,PL:520,AU:1450,NZ:1550,AE:540,QA:520,SA:480,SG:780}},
  BF:{name:'Burkina Faso',cur:'XOF',sym:'CFA',
    cities:['Ouagadougou','Bobo-Dioulasso','Koudougou'],
    ielts:180000,pte:110000,ieltPrep:100000,med:35000,police:2000,passNew:40000,
    translate:25000,consultant:450000,shipping:350000,storage:18000,
    flights:{CA:1100,US:950,UK:700,DE:580,NL:600,PT:560,FR:420,SE:640,IE:720,NO:660,FI:660,DK:640,IT:520,ES:500,PL:540,AU:1500,NZ:1600,AE:560,QA:540,SA:500,SG:800}},
  NE:{name:'Niger',cur:'XOF',sym:'CFA',
    cities:['Niamey','Zinder','Maradi'],
    ielts:180000,pte:110000,ieltPrep:110000,med:35000,police:2000,passNew:38000,
    translate:22000,consultant:400000,shipping:380000,storage:16000,
    flights:{CA:1150,US:1000,UK:720,DE:600,NL:620,PT:580,FR:440,SE:660,IE:740,NO:680,FI:680,DK:660,IT:540,ES:520,PL:560,AU:1550,NZ:1650,AE:580,QA:560,SA:520,SG:820}},
  GN:{name:'Guinea',cur:'GNF',sym:'FG',
    cities:['Conakry','Kankan','Kindia'],
    ielts:2537000,pte:1550000,ieltPrep:1410000,med:507000,police:35000,passNew:592000,
    translate:352000,consultant:6340000,shipping:4650000,storage:254000,
    flights:{CA:1100,US:950,UK:700,DE:580,NL:600,PT:560,FR:420,SE:640,IE:720,NO:660,FI:660,DK:640,IT:520,ES:500,PL:540,AU:1500,NZ:1600,AE:560,QA:540,SA:500,SG:800}},
  GW:{name:'Guinea-Bissau',cur:'XOF',sym:'CFA',
    cities:['Bissau','Bafat-','Gab-'],
    ielts:180000,pte:110000,ieltPrep:100000,med:34000,police:2000,passNew:40000,
    translate:24000,consultant:420000,shipping:340000,storage:17000,
    flights:{CA:1100,US:950,UK:700,DE:580,NL:600,PT:480,FR:420,SE:640,IE:720,NO:660,FI:660,DK:640,IT:520,ES:480,PL:540,AU:1500,NZ:1600,AE:560,QA:540,SA:500,SG:800}},
  SL:{name:'Sierra Leone',cur:'SLE',sym:'Le',
    cities:['Freetown','Bo','Kenema'],
    ielts:6640,pte:4060,ieltPrep:3690,med:1330,police:92,passNew:1590,
    translate:920,consultant:16610,shipping:12180,storage:664,
    flights:{CA:1100,US:950,UK:700,DE:580,NL:600,PT:560,FR:420,SE:640,IE:720,NO:660,FI:660,DK:640,IT:520,ES:500,PL:540,AU:1500,NZ:1600,AE:560,QA:540,SA:500,SG:800}},
  LR:{name:'Liberia',cur:'LRD',sym:'L$',
    cities:['Monrovia','Gbarnga','Kakata'],
    ielts:56640,pte:34590,ieltPrep:31480,med:11330,police:770,passNew:13220,
    translate:7870,consultant:141640,shipping:103870,storage:5670,
    flights:{CA:1100,US:900,UK:700,DE:580,NL:600,PT:560,FR:420,SE:640,IE:720,NO:660,FI:660,DK:640,IT:520,ES:500,PL:540,AU:1500,NZ:1600,AE:560,QA:540,SA:500,SG:800}},
  GM:{name:'Gambia',cur:'GMD',sym:'D',
    cities:['Banjul','Serekunda','Brikama'],
    ielts:21240,pte:12970,ieltPrep:11800,med:4010,police:236,passNew:4720,
    translate:2830,consultant:49570,shipping:36590,storage:2006,
    flights:{CA:1050,US:900,UK:680,DE:560,NL:580,PT:460,FR:380,SE:620,IE:700,NO:640,FI:640,DK:620,IT:500,ES:460,PL:520,AU:1450,NZ:1550,AE:540,QA:520,SA:480,SG:780}},
  // --- EAST AFRICA -------------------------------------------------
  KE:{name:'Kenya',cur:'KES',sym:'KSh',
    cities:['Nairobi','Mombasa','Kisumu','Nakuru','Eldoret','Thika'],
    ielts:30500,pte:19500,ieltPrep:25000,med:10000,police:1000,passNew:4550,
    translate:5000,consultant:120000,shipping:320000,storage:5000,
    flights:{CA:950,US:850,UK:600,DE:550,NL:570,PT:540,FR:560,SE:600,IE:650,NO:620,FI:620,DK:600,IT:480,ES:460,PL:500,AU:1100,NZ:1300,AE:320,QA:300,SA:280,SG:480}},
  ET:{name:'Ethiopia',cur:'ETB',sym:'Br',
    cities:['Addis Ababa','Dire Dawa','Gondar','Mekelle','Hawassa'],
    ielts:36000,pte:22000,ieltPrep:20000,med:5000,police:500,passNew:3000,
    translate:4000,consultant:100000,shipping:70000,storage:5000,
    flights:{CA:1000,US:900,UK:650,DE:550,NL:570,PT:540,FR:560,SE:600,IE:700,NO:620,FI:620,DK:600,IT:480,ES:460,PL:500,AU:1100,NZ:1400,AE:300,QA:280,SA:260,SG:460}},
  TZ:{name:'Tanzania',cur:'TZS',sym:'TSh',
    cities:['Dar es Salaam','Dodoma','Arusha','Mwanza','Zanzibar'],
    ielts:790000,pte:450000,ieltPrep:500000,med:200000,police:10000,passNew:120000,
    translate:100000,consultant:2000000,shipping:1350000,storage:80000,
    flights:{CA:1000,US:900,UK:700,DE:600,NL:620,PT:580,FR:600,SE:640,IE:720,NO:660,FI:660,DK:640,IT:520,ES:500,PL:540,AU:1050,NZ:1250,AE:340,QA:320,SA:300,SG:500}},
  UG:{name:'Uganda',cur:'UGX',sym:'USh',
    cities:['Kampala','Entebbe','Jinja','Gulu','Mbarara'],
    ielts:1100000,pte:670000,ieltPrep:800000,med:300000,police:20000,passNew:250000,
    translate:150000,consultant:3000000,shipping:2000000,storage:120000,
    flights:{CA:1050,US:950,UK:700,DE:600,NL:620,PT:580,FR:600,SE:640,IE:720,NO:660,FI:660,DK:640,IT:520,ES:500,PL:540,AU:1100,NZ:1350,AE:330,QA:310,SA:290,SG:490}},
  RW:{name:'Rwanda',cur:'RWF',sym:'FRw',
    cities:['Kigali','Butare','Gisenyi','Musanze'],
    ielts:410000,pte:250000,ieltPrep:300000,med:100000,police:5000,passNew:70000,
    translate:50000,consultant:1200000,shipping:800000,storage:50000,
    flights:{CA:1100,US:1000,UK:750,DE:650,NL:670,PT:630,FR:650,SE:700,IE:750,NO:720,FI:720,DK:700,IT:560,ES:540,PL:580,AU:1200,NZ:1400,AE:350,QA:330,SA:300,SG:510}},
  SD:{name:'Sudan',cur:'SDG',sym:'SDG',
    cities:['Khartoum','Omdurman','Port Sudan','Kassala'],
    ielts:600000,pte:360000,ieltPrep:400000,med:150000,police:10000,passNew:100000,
    translate:80000,consultant:1500000,shipping:1000000,storage:60000,
    flights:{CA:1200,US:1100,UK:800,DE:700,NL:720,PT:680,FR:700,SE:760,IE:820,NO:780,FI:780,DK:760,IT:620,ES:600,PL:640,AU:1400,NZ:1600,AE:380,QA:360,SA:320,SG:540}},
  SS:{name:'South Sudan',cur:'SSP',sym:'SSP',
    cities:['Juba','Wau','Malakal'],
    ielts:975000,pte:585000,ieltPrep:650000,med:250000,police:15000,passNew:150000,
    translate:100000,consultant:2000000,shipping:1500000,storage:90000,
    flights:{CA:1300,US:1200,UK:900,DE:800,NL:820,PT:780,FR:800,SE:860,IE:920,NO:880,FI:880,DK:860,IT:720,ES:700,PL:740,AU:1500,NZ:1700,AE:420,QA:400,SA:360,SG:580}},
  // --- CENTRAL AFRICA ----------------------------------------------
  CM:{name:'Cameroon',cur:'XAF',sym:'CFA',
    cities:['Douala','Yaounde','Bamenda','Bafoussam','Garoua'],
    ielts:180000,pte:110000,ieltPrep:100000,med:35000,police:3000,passNew:55000,
    translate:25000,consultant:500000,shipping:320000,storage:20000,
    flights:{CA:1000,US:850,UK:650,DE:550,NL:570,PT:540,FR:420,SE:600,IE:680,NO:620,FI:620,DK:600,IT:500,ES:480,PL:520,AU:1400,NZ:1500,AE:540,QA:520,SA:480,SG:780}},
  CD:{name:'DR Congo',cur:'CDF',sym:'FC',
    cities:['Kinshasa','Lubumbashi','Goma','Mbuji-Mayi','Bukavu'],
    ielts:1800000,pte:1080000,ieltPrep:1200000,med:350000,police:30000,passNew:200000,
    translate:150000,consultant:3500000,shipping:2500000,storage:180000,
    flights:{CA:1200,US:1100,UK:900,DE:800,NL:820,PT:780,FR:750,SE:860,IE:920,NO:880,FI:880,DK:860,IT:720,ES:700,PL:740,AU:1600,NZ:1800,AE:580,QA:560,SA:520,SG:840}},
  CG:{name:'Rep. of Congo',cur:'XAF',sym:'CFA',
    cities:['Brazzaville','Pointe-Noire','Dolisie'],
    ielts:180000,pte:110000,ieltPrep:100000,med:36000,police:3000,passNew:50000,
    translate:28000,consultant:480000,shipping:320000,storage:20000,
    flights:{CA:1150,US:1050,UK:850,DE:750,NL:770,PT:730,FR:700,SE:810,IE:870,NO:830,FI:830,DK:810,IT:670,ES:650,PL:690,AU:1550,NZ:1750,AE:560,QA:540,SA:500,SG:820}},
  GA:{name:'Gabon',cur:'XAF',sym:'CFA',
    cities:['Libreville','Port-Gentil','Franceville'],
    ielts:180000,pte:110000,ieltPrep:100000,med:36000,police:3000,passNew:52000,
    translate:28000,consultant:480000,shipping:320000,storage:20000,
    flights:{CA:1150,US:1050,UK:850,DE:750,NL:770,PT:730,FR:700,SE:810,IE:870,NO:830,FI:830,DK:810,IT:670,ES:650,PL:690,AU:1550,NZ:1750,AE:560,QA:540,SA:500,SG:820}},
  // --- SOUTHERN AFRICA ---------------------------------------------
  ZA:{name:'South Africa',cur:'ZAR',sym:'R',
    cities:['Johannesburg','Cape Town','Durban','Pretoria','Port Elizabeth','Bloemfontein'],
    ielts:4250,pte:3200,ieltPrep:3000,med:2000,police:150,passNew:600,
    translate:500,consultant:15000,shipping:7600,storage:2000,
    flights:{CA:1100,US:950,UK:750,DE:700,NL:720,PT:680,FR:700,SE:760,IE:780,NO:780,FI:780,DK:760,IT:620,ES:600,PL:640,AU:800,NZ:950,AE:550,QA:530,SA:490,SG:700}},
  ZW:{name:'Zimbabwe',cur:'ZWL',sym:'Z$',
    cities:['Harare','Bulawayo','Mutare','Gweru','Kwekwe'],
    ielts:1500,pte:900,ieltPrep:900,med:200,police:30,passNew:120,
    translate:80,consultant:5000,shipping:4200,storage:300,
    flights:{CA:1150,US:1000,UK:780,DE:720,NL:740,PT:700,FR:720,SE:780,IE:820,NO:800,FI:800,DK:780,IT:640,ES:620,PL:660,AU:850,NZ:1000,AE:560,QA:540,SA:460,SG:720}},
  ZM:{name:'Zambia',cur:'ZMW',sym:'K',
    cities:['Lusaka','Kitwe','Ndola','Livingstone','Chipata'],
    ielts:1100,pte:660,ieltPrep:700,med:250,police:50,passNew:200,
    translate:100,consultant:6000,shipping:5500,storage:350,
    flights:{CA:1150,US:1000,UK:780,DE:720,NL:740,PT:700,FR:720,SE:780,IE:820,NO:800,FI:800,DK:780,IT:640,ES:620,PL:660,AU:900,NZ:1050,AE:560,QA:540,SA:480,SG:720}},
  MW:{name:'Malawi',cur:'MWK',sym:'MK',
    cities:['Lilongwe','Blantyre','Mzuzu','Zomba'],
    ielts:700000,pte:420000,ieltPrep:500000,med:120000,police:8000,passNew:75000,
    translate:45000,consultant:1000000,shipping:700000,storage:55000,
    flights:{CA:1200,US:1050,UK:800,DE:740,NL:760,PT:720,FR:740,SE:800,IE:840,NO:820,FI:820,DK:800,IT:660,ES:640,PL:680,AU:880,NZ:1020,AE:570,QA:550,SA:470,SG:730}},
  BW:{name:'Botswana',cur:'BWP',sym:'P',
    cities:['Gaborone','Francistown','Maun','Kasane'],
    ielts:1300,pte:780,ieltPrep:800,med:300,police:80,passNew:250,
    translate:150,consultant:4500,shipping:5000,storage:400,
    flights:{CA:1100,US:950,UK:760,DE:700,NL:720,PT:680,FR:700,SE:760,IE:800,NO:780,FI:780,DK:760,IT:620,ES:600,PL:640,AU:820,NZ:960,AE:550,QA:530,SA:450,SG:710}},
  NA:{name:'Namibia',cur:'NAD',sym:'N$',
    cities:['Windhoek','Walvis Bay','Swakopmund','Oshakati'],
    ielts:1900,pte:1140,ieltPrep:1200,med:400,police:100,passNew:350,
    translate:200,consultant:7000,shipping:5500,storage:450,
    flights:{CA:1100,US:960,UK:760,DE:700,NL:720,PT:680,FR:700,SE:760,IE:800,NO:780,FI:780,DK:760,IT:620,ES:600,PL:640,AU:820,NZ:970,AE:550,QA:530,SA:450,SG:710}},
  AO:{name:'Angola',cur:'AOA',sym:'Kz',
    cities:['Luanda','Huambo','Lobito','Benguela','Lubango'],
    ielts:580000,pte:348000,ieltPrep:380000,med:120000,police:20000,passNew:90000,
    translate:60000,consultant:1200000,shipping:900000,storage:80000,
    flights:{CA:1150,US:1000,UK:780,DE:700,NL:720,PT:580,FR:620,SE:760,IE:820,NO:780,FI:780,DK:760,IT:640,ES:580,PL:660,AU:1500,NZ:1700,AE:560,QA:540,SA:500,SG:780}},
  MZ:{name:'Mozambique',cur:'MZN',sym:'MT',
    cities:['Maputo','Beira','Nampula','Tete','Chimoio'],
    ielts:4000,pte:2400,ieltPrep:2500,med:600,police:150,passNew:500,
    translate:300,consultant:8000,shipping:5000,storage:500,
    flights:{CA:1200,US:1050,UK:820,DE:760,NL:780,PT:720,FR:740,SE:820,IE:860,NO:840,FI:840,DK:820,IT:680,ES:660,PL:700,AU:850,NZ:1000,AE:580,QA:560,SA:480,SG:730}},
  // --- NORTH AFRICA ------------------------------------------------
  EG:{name:'Egypt',cur:'EGP',sym:'E-',
    cities:['Cairo','Alexandria','Giza','Sharm El Sheikh','Luxor'],
    ielts:14300,pte:8580,ieltPrep:10000,med:4000,police:200,passNew:2000,
    translate:3000,consultant:40000,shipping:20000,storage:3000,
    flights:{CA:900,US:800,UK:500,DE:400,NL:420,PT:380,FR:360,SE:440,IE:550,NO:460,FI:460,DK:440,IT:320,ES:300,PL:320,AU:1200,NZ:1350,AE:250,QA:230,SA:200,SG:420}},
  MA:{name:'Morocco',cur:'MAD',sym:'DH',
    cities:['Casablanca','Rabat','Marrakech','Fes','Agadir','Tangier'],
    ielts:1400,pte:840,ieltPrep:900,med:600,police:100,passNew:500,
    translate:300,consultant:6000,shipping:5000,storage:400,
    flights:{CA:850,US:760,UK:450,DE:360,NL:380,PT:250,FR:200,SE:400,IE:480,NO:420,FI:420,DK:400,IT:280,ES:220,PL:300,AU:1250,NZ:1400,AE:260,QA:240,SA:220,SG:450}},
  TN:{name:'Tunisia',cur:'TND',sym:'DT',
    cities:['Tunis','Sfax','Sousse','Bizerte','Kairouan'],
    ielts:220,pte:132,ieltPrep:140,med:100,police:25,passNew:80,
    translate:60,consultant:1200,shipping:1800,storage:90,
    flights:{CA:880,US:780,UK:470,DE:380,NL:400,PT:300,FR:180,SE:420,IE:500,NO:440,FI:440,DK:420,IT:260,ES:240,PL:280,AU:1280,NZ:1420,AE:240,QA:220,SA:200,SG:440}},
  DZ:{name:'Algeria',cur:'DZD',sym:'DA',
    cities:['Algiers','Oran','Constantine','Annaba','Blida'],
    ielts:13500,pte:8100,ieltPrep:9000,med:3500,police:200,passNew:1800,
    translate:2500,consultant:35000,shipping:18000,storage:2500,
    flights:{CA:920,US:820,UK:520,DE:420,NL:440,PT:320,FR:200,SE:460,IE:540,NO:480,FI:480,DK:460,IT:300,ES:260,PL:320,AU:1260,NZ:1400,AE:270,QA:250,SA:230,SG:460}},
  LY:{name:'Libya',cur:'LYD',sym:'LD',
    cities:['Tripoli','Benghazi','Misrata','Sebha'],
    ielts:1430,pte:870,ieltPrep:870,med:340,police:25,passNew:135,
    translate:135,consultant:8070,shipping:5380,storage:400,
    flights:{CA:950,US:850,UK:560,DE:460,NL:480,PT:380,FR:280,SE:500,IE:580,NO:520,FI:520,DK:500,IT:340,ES:320,PL:360,AU:1300,NZ:1450,AE:300,QA:280,SA:240,SG:480}}
 },

 dests:{
  // --- CANADA ------------------------------------------------------
  CA:{name:'Canada',cur:'CAD',toUSD:0.72,
    cities:['Toronto','Vancouver','Calgary','Ottawa','Montreal','Edmonton','Winnipeg','Halifax'],
    cityAdj:{Toronto:1.25,Vancouver:1.3,Calgary:0.95,Ottawa:0.95,Montreal:0.9,Edmonton:0.85,Winnipeg:0.8,Halifax:0.85},
    pathways:{
      expressEntry:{name:'Express Entry (PR)',desc:'Points-based PR - Federal Skilled Worker, CEC, or Skilled Trades. No employer needed.',time:'6-12 months',best:true,
        procFee:1365,rprf:575,bio:85,spProcFee:1365,spRprf:575,childFee:260,medDest:300,
        pof:{single:14690,couple:18288,family3:22483,family4:25564},
        note:'#1 pathway for skilled Africans. CRS score ~480+ needed. ITA rounds every 2 weeks. PR = work anywhere in Canada forever.'},
      pnp:{name:'Provincial Nominee (PNP)',desc:'Province nominates you for PR. Some streams employer-driven, others points-based.',time:'6-18 months',
        procFee:1365,rprf:575,bio:85,pnpFee:300,spProcFee:1365,spRprf:575,childFee:260,medDest:300,
        pof:{single:14690,couple:18288,family3:22483,family4:25564},
        note:'Saskatchewan, Manitoba, Atlantic provinces have more accessible PNP streams. Can combine with Express Entry for a major CRS boost.'},
      studyPermit:{name:'Study Permit + PGWP',desc:'Study at a DLI. Work 20hr/week during studies. Post-Graduate Work Permit (1-3 yrs) converts to Express Entry.',time:'8-20 weeks',
        procFee:150,bio:85,gic:20635,tuitionLow:15000,tuitionHigh:40000,medDest:300,
        pof:{single:20635,couple:25635,family3:30635,family4:35635},
        note:'PGWP gives 1-3 years work rights post-graduation ? CEC ? Express Entry. Best long-game route for young professionals.'},
      workPermit:{name:'Work Permit (LMIA)',desc:'Employer-sponsored. Requires a Labour Market Impact Assessment confirming no Canadian available.',time:'4-16 weeks',
        procFee:155,owp:100,bio:85,medDest:300,
        pof:{single:5000,couple:7000,family3:9000,family4:11000},
        note:'LMIA processing adds 2-4 months. Good bridge to CEC stream of Express Entry once you build Canadian work experience.'},
      atlanticPilot:{name:'Atlantic Immigration Pilot',desc:'Employer-sponsored PR for Atlantic Canada (NS, NB, PEI, NL). Faster and lower CRS requirements.',time:'4-12 months',
        procFee:1365,rprf:575,bio:85,spProcFee:1365,spRprf:575,childFee:260,medDest:300,
        pof:{single:10000,couple:14000,family3:18000,family4:22000},
        note:'Lower competition than Toronto/Vancouver. Employer must be designated. PR on arrival - brings family directly.'}
    },
    settle:{rent:1800,food:500,transport:150,phone:50,insurance:100,misc:500}},

  // --- UNITED STATES -----------------------------------------------
  US:{name:'United States',cur:'USD',toUSD:1,
    cities:['New York','Los Angeles','Chicago','Houston','Dallas','Atlanta','Seattle','Miami','Boston'],
    cityAdj:{'New York':1.4,'Los Angeles':1.3,Chicago:0.95,Houston:0.85,Dallas:0.88,Atlanta:0.85,Seattle:1.2,Miami:1.1,Boston:1.25},
    pathways:{
      h1b:{name:'H-1B Work Visa',desc:'Employer-sponsored specialty occupation visa. Annual cap/selection process changes by year; verify current USCIS cap guidance.',time:'3-6 months',best:true,
        procFee:780,premProc:2805,antifraud:500,bio:85,medDest:400,
        pof:{single:5000,couple:8000,family3:10000,family4:12000},
        note:'Annual cap registration and selection timing can change. Premium processing may be available, but confirm current USCIS rules before budgeting.'},
      f1:{name:'F-1 Student Visa',desc:'Full-time study. 12-month OPT work after graduation + 24-month STEM OPT extension.',time:'2-4 months',
        procFee:185,sevis:350,tuitionLow:20000,tuitionHigh:55000,
        pof:{single:15000,couple:20000,family3:25000,family4:30000},
        note:'STEM OPT = 3 years post-graduation work rights. Community college ? transfer to university cuts costs significantly.'},
      dvLottery:{name:'DV Lottery (Green Card)',desc:'Diversity Visa - free to enter. ~55,000 green cards annually. Immediate permanent residency.',time:'12-18 months',
        procFee:330,immigrantFee:220,spProcFee:330,childFee:330,medDest:400,
        pof:{single:2000,couple:3500,family3:5000,family4:6500},
        note:'Nigeria, Ghana, Kenya, Ethiopia, Cameroon eligible. Apply Oct-Nov annually. Results in May. Minimum high school diploma required.'},
      eb2niw:{name:'EB-2 NIW (Self-Petition)',desc:'National Interest Waiver - no employer or job offer needed. For advanced degrees or exceptional ability.',time:'12-36 months',
        procFee:700,immigrantFee:220,bio:85,medDest:400,
        pof:{single:5000,couple:8000,family3:10000,family4:12000},
        note:'Common self-petitioned green card route for advanced-degree or exceptional-ability cases. I-140 evidence must show national interest; consult current USCIS guidance.'},
      o1:{name:'O-1 Extraordinary Ability',desc:'For individuals with extraordinary ability in science, arts, business, or athletics. No lottery.',time:'2-4 months',
        procFee:460,premProc:2805,
        pof:{single:5000,couple:8000,family3:10000,family4:12000},
        note:'No cap - available year-round. Requires documented evidence of extraordinary achievements. Strong for award-winners, published researchers, elite athletes.'}
    },
    settle:{rent:2000,food:500,transport:200,phone:50,insurance:300,misc:500}},

  // --- UNITED KINGDOM ----------------------------------------------
  UK:{name:'United Kingdom',cur:'GBP',toUSD:1.27,
    cities:['London','Manchester','Birmingham','Edinburgh','Glasgow','Leeds','Bristol','Liverpool','Cardiff'],
    cityAdj:{London:1.35,Manchester:0.85,Birmingham:0.82,Edinburgh:0.9,Glasgow:0.82,Leeds:0.8,Bristol:0.88,Liverpool:0.8,Cardiff:0.78},
    pathways:{
      skilledWorker:{name:'Skilled Worker Visa',desc:'Employer sponsors with Certificate of Sponsorship. Job must be on eligible occupation list.',time:'3-8 weeks',best:true,ihsYears:5,
        procFee:719,ihs:1035,spProcFee:719,spIhs:1035,childFee:719,childIhs:1035,
        pof:{single:1270,couple:2000,family3:3000,family4:4000},
        note:'Most common route. IHS = -1,035/yr - for a 5-year visa that is -5,175 per person upfront. Job offer required.'},
      studentVisa:{name:'Student Visa + Graduate Route',desc:'Study at UK university. 20hr/week work during term. Graduate visa gives 2 years work rights after.',time:'3-6 weeks',ihsYears:3,
        procFee:490,ihs:776,tuitionLow:12000,tuitionHigh:35000,
        pof:{single:1334,couple:2000,family3:3000,family4:4000},
        note:'Graduate visa = 2 years unrestricted work rights. Strongest pathway for recent graduates to land a Skilled Worker sponsor.'},
      globalTalent:{name:'Global Talent Visa',desc:'For leaders in science, engineering, arts, or digital technology. Endorsement by recognised body.',time:'3-8 weeks',ihsYears:5,
        procFee:716,endorsement:524,ihs:1035,spProcFee:716,spIhs:1035,childFee:716,childIhs:1035,
        pof:{single:0,couple:0,family3:0,family4:0},
        note:'No job offer needed. Endorsement from UKRI, Royal Academy, Tech Nation etc. ILR (settlement) after 3 years.'},
      yms:{name:'Youth Mobility Scheme',desc:'For 18-30 year olds from eligible countries. Work unrestricted in UK for 2 years.',time:'3-5 weeks',ihsYears:2,
        procFee:244,ihs:776,
        pof:{single:2530,couple:0,family3:0,family4:0},
        note:'Check if your country is eligible - many African countries are not, but some are. Great low-cost entry. Many convert to Skilled Worker afterwards.'},
      hpv:{name:'High Potential Individual (HPI)',desc:'For graduates of top global universities (QS top 50). 2-year visa, no job offer needed.',time:'3-6 weeks',ihsYears:2,
        procFee:715,ihs:776,spProcFee:715,spIhs:776,
        pof:{single:1270,couple:2000,family3:3000,family4:4000},
        note:'If you graduated from Uni of Cape Town, Stellenbosch, Cairo, Nairobi etc. (QS top 50), you may qualify. Spouse can work.'}
    },
    settle:{rent:1500,food:350,transport:150,phone:30,insurance:0,misc:400}},

  // --- GERMANY -----------------------------------------------------
  DE:{name:'Germany',cur:'EUR',toUSD:1.08,
    cities:['Berlin','Munich','Frankfurt','Hamburg','Cologne','Stuttgart','D-sseldorf','Leipzig'],
    cityAdj:{Berlin:0.85,Munich:1.25,Frankfurt:1.1,Hamburg:1.0,Cologne:0.9,Stuttgart:1.05,'D-sseldorf':0.95,Leipzig:0.75},
    pathways:{
      blueCard:{name:'EU Blue Card',desc:'Highly qualified workers with job offer above salary threshold (-45,300 general / -35,100 shortage occupations).',time:'1-3 months',best:true,
        procFee:100,spProcFee:100,
        pof:{single:0,couple:0,family3:0,family4:0},
        note:"PR after 21 months (33 standard). Spouse gets unrestricted work permit immediately. Fastest path to German residency."},
      chancenkarte:{name:'Opportunity Card (Chancenkarte)',desc:'Points-based system (2024 launch). Come to Germany to job-hunt with part-time work allowed.',time:'2-4 months',
        procFee:100,blocked:11904,
        pof:{single:11904,couple:15000,family3:18000,family4:21000},
        note:'Min 6 points (degree + language/experience). Part-time work (up to 20hr/week) allowed while searching. Convert to Blue Card once employed.'},
      jobSeeker:{name:'Job Seeker Visa',desc:'6-month visa to find employment. Must prove qualifications and financial self-sufficiency via blocked account.',time:'1-3 months',
        procFee:75,blocked:11904,
        pof:{single:11904,couple:15000,family3:18000,family4:21000},
        note:'Blocked account releases ~-992/month. Once employed, switch to Blue Card. Apply at German embassy in your home country.'},
      studentVisa:{name:'Student Visa',desc:'Study at German public university - mostly tuition-free. Blocked account required.',time:'4-12 weeks',
        procFee:75,blocked:11904,tuitionLow:0,tuitionHigh:3000,
        pof:{single:11904,couple:15000,family3:18000,family4:21000},
        note:'Semester fee ~-350. 20hr/week work allowed during studies. 18-month job-seeker extension after graduation to convert to Blue Card.'},
      workPermit:{name:'General Work Permit (-18a)',desc:'For qualified workers in shortage occupations without a degree threshold. Covers skilled trades.',time:'2-4 months',
        procFee:100,spProcFee:100,
        pof:{single:0,couple:0,family3:0,family4:0},
        note:'Germany has severe labour shortages - this was expanded in 2023 Skilled Immigration Act. Covers healthcare, IT, trades, engineering.'}
    },
    settle:{rent:1000,food:350,transport:100,phone:20,insurance:110,misc:300}},

  // --- NETHERLANDS -------------------------------------------------
  NL:{name:'Netherlands',cur:'EUR',toUSD:1.08,
    cities:['Amsterdam','Rotterdam','The Hague','Eindhoven','Utrecht','Groningen'],
    cityAdj:{Amsterdam:1.35,Rotterdam:1.0,'The Hague':1.1,Eindhoven:0.9,Utrecht:1.15,Groningen:0.88},
    pathways:{
      highlySkilled:{name:'Highly Skilled Migrant (Kennismigrant)',desc:'Workers meeting salary threshold (-5,688/mo under 30, -6,245/mo 30+). Employer-sponsored. 2-week IND processing.',time:'2-4 weeks',best:true,
        procFee:345,spProcFee:210,childFee:210,
        pof:{single:0,couple:0,family3:0,family4:0},
        note:"Fastest work visa in Europe. PR after 5 years. 30% Tax Ruling for highly skilled migrants = major take-home pay boost for first 5 years."},
      orientationYear:{name:'Orientation Year (Zoekjaar)',desc:'For recent graduates of top-200 universities. 1 year to job-hunt in Netherlands.',time:'2-4 weeks',
        procFee:210,
        pof:{single:3500,couple:5000,family3:0,family4:0},
        note:'Must have graduated from top-200 university within 3 years. Work unlimited hours while searching. Can convert to Highly Skilled Migrant permit on job offer.'},
      studentVisa:{name:'Student Residence Permit (MVV)',desc:'Study at Dutch university. Work 16hr/week. English-language programmes widely available.',time:'4-8 weeks',
        procFee:210,tuitionLow:8000,tuitionHigh:20000,
        pof:{single:11000,couple:0,family3:0,family4:0},
        note:'EU education quality at 40-60% of UK cost. Eindhoven = Europe\'s silicon valley. Amsterdam = major English-language tech hub.'}
    },
    settle:{rent:1400,food:400,transport:80,phone:25,insurance:130,misc:400}},

  // --- PORTUGAL ----------------------------------------------------
  PT:{name:'Portugal',cur:'EUR',toUSD:1.08,
    cities:['Lisbon','Porto','Faro','Braga','Set-bal','Coimbra'],
    cityAdj:{Lisbon:1.2,Porto:1.0,Faro:0.9,Braga:0.85,'Set-bal':0.85,Coimbra:0.88},
    pathways:{
      d3Tech:{name:'D3 Highly Qualified / Tech Visa',desc:'For IT, engineering, and highly qualified professionals. Fast-tracked by AIMA.',time:'2-4 months',best:true,
        procFee:183,spProcFee:183,childFee:92,
        pof:{single:0,couple:0,family3:0,family4:0},
        note:'Highly qualified work route; residence/citizenship timelines and labour-market fit depend on current AIMA and legal requirements. Compare city costs directly before assuming savings.'},
      d7:{name:'D7 Digital Nomad / Passive Income Visa',desc:'For remote workers or those with passive income = -760/month. Low minimum threshold.',time:'2-4 months',
        procFee:183,
        pof:{single:9120,couple:13680,family3:18240,family4:18240},
        note:'Remote-work and passive-income planning should be checked against current visa, AIMA, and tax-residency rules. Treat community popularity as qualitative, not an eligibility factor.'},
      studentVisa:{name:'Student Visa (D4)',desc:'Study at Portuguese institution. Lowest university tuition in Western Europe. Work 20hr/week.',time:'4-8 weeks',
        procFee:90,tuitionLow:1500,tuitionHigh:7000,
        pof:{single:8000,couple:0,family3:0,family4:0},
        note:'Some public programs can be lower cost than many Western European peers, but tuition, work rights, and post-study options depend on the institution and current rules.'}
    },
    settle:{rent:900,food:320,transport:45,phone:20,insurance:80,misc:300}},

  // --- FRANCE ------------------------------------------------------
  FR:{name:'France',cur:'EUR',toUSD:1.08,
    cities:['Paris','Lyon','Marseille','Bordeaux','Toulouse','Nantes','Strasbourg'],
    cityAdj:{Paris:1.4,Lyon:1.0,Marseille:0.9,Bordeaux:0.95,Toulouse:0.95,Nantes:0.9,Strasbourg:0.9},
    pathways:{
      passionTalent:{name:'Talent Passport (Passeport Talent)',desc:'Multi-year carte de s-jour for highly skilled workers, entrepreneurs, researchers. 10 categories.',time:'2-4 months',best:true,
        procFee:269,spProcFee:269,
        pof:{single:0,couple:0,family3:0,family4:0},
        note:'4-year renewable permit covering all skilled categories. Family included. PR after 5 years. Strong African communities in Paris, Lyon, Marseille.'},
      studentVisa:{name:'Student Visa (VLS-TS -tudiant)',desc:'Study at French institution. Public universities as low as -200/year. Work 20hr/week.',time:'4-8 weeks',
        procFee:99,tuitionLow:200,tuitionHigh:15000,
        pof:{single:7380,couple:0,family3:0,family4:0},
        note:'Cheapest quality higher education in Francophone world - huge advantage for Nigerian, Ghanaian, Cameroonian students who speak French. 12-month APS visa after graduation.'},
      workPermit:{name:'Work Permit (Autorisation de Travail)',desc:'Employer sponsors via DREETS. For sectors with labour shortages.',time:'2-4 months',
        procFee:269,
        pof:{single:3000,couple:5000,family3:7000,family4:9000},
        note:'IT, healthcare, construction among priority sectors. "M-tiers en tension" list fast-tracks applications in shortage occupations.'}
    },
    settle:{rent:1100,food:380,transport:75,phone:20,insurance:90,misc:350}},

  // --- SWEDEN -------------------------------------------------------
  SE:{name:'Sweden',cur:'SEK',toUSD:0.094,
    cities:['Stockholm','Gothenburg','Malmo','Uppsala','Linkoping'],
    cityAdj:{Stockholm:1.25,Gothenburg:1.0,Malmo:0.9,Uppsala:1.0,Linkoping:0.88},
    pathways:{
      workPermit:{name:'Work Permit',desc:'Employer-sponsored. Almost any occupation qualifies. No shortage list required.',time:'1-4 months',best:true,
        procFee:2000,spProcFee:2000,childFee:1000,
        pof:{single:0,couple:0,family3:0,family4:0},
        note:'If you have a job offer with union-standard salary + benefits, you get the permit. PR after 4 years. Swedish citizenship after 5.'},
      studentVisa:{name:'Student Residence Permit',desc:'Study at Swedish HEI. Many English-language programmes. No tuition for exchange/partner students.',time:'3-8 weeks',
        procFee:1500,tuitionLow:0,tuitionHigh:180000,
        pof:{single:95000,couple:0,family3:0,family4:0},
        note:'Non-EU students pay tuition only at degree level. Exceptional quality of life. Stockholm growing tech hub. Free healthcare during studies.'},
      selfEmployed:{name:'Self-Employment Permit',desc:'For entrepreneurs starting a registered business or freelancing in Sweden.',time:'2-5 months',
        procFee:2000,
        pof:{single:150000,couple:200000,family3:0,family4:0},
        note:'Must show viable business plan and ability to support yourself. Growing startup ecosystem - Sweden produces more unicorns per capita than any other country.'}
    },
    settle:{rent:12000,food:4000,transport:1000,phone:250,insurance:700,misc:3500}},

  // --- IRELAND -----------------------------------------------------
  IE:{name:'Ireland',cur:'EUR',toUSD:1.08,
    cities:['Dublin','Cork','Galway','Limerick','Waterford','Kilkenny'],
    cityAdj:{Dublin:1.2,Cork:0.9,Galway:0.85,Limerick:0.8,Waterford:0.8,Kilkenny:0.82},
    pathways:{
      criticalSkills:{name:'Critical Skills Employment Permit',desc:'For ICT, engineering, healthcare roles earning -32,000+. 2-year permit, direct PR pathway.',time:'4-8 weeks',best:true,
        procFee:1000,
        pof:{single:3000,couple:5000,family3:7000,family4:9000},
        note:'Spouse gets immediate unrestricted Stamp 1G work permit - a huge advantage. ICT and healthcare roles qualify at lower salary threshold.'},
      generalWork:{name:'General Employment Permit',desc:'For roles earning -30,000+ not on shortage list. Labour market needs test required.',time:'6-12 weeks',
        procFee:1000,
        pof:{single:2000,couple:3500,family3:5000,family4:7000},
        note:'Employer must advertise locally first. More paperwork but available for more roles. Renewable up to 5 years, then long-term residency.'},
      studentVisa:{name:'Student Visa (Stamp 2)',desc:'Study at Irish institution. 20hr/week during term. 40hr/week holidays.',time:'4-8 weeks',
        procFee:300,tuitionLow:10000,tuitionHigh:25000,
        pof:{single:10000,couple:15000,family3:20000,family4:25000},
        note:'Third Level Graduate Scheme: 12-24 months to find a job after graduation. Strong route for STEM graduates to land Critical Skills role.'},
      startupVisa:{name:'Start-up Entrepreneur Programme',desc:'For entrepreneurs with innovative business idea seeking -75,000 seed funding and Irish launch.',time:'3-6 months',
        procFee:0,
        pof:{single:75000,couple:75000,family3:75000,family4:75000},
        note:'Ireland is EU\'s second most popular startup destination. Low 12.5% corporate tax. Access to EU market. Strong Nigerian tech community in Dublin.'}
    },
    settle:{rent:1600,food:350,transport:120,phone:30,insurance:0,misc:400}},

  // --- NORWAY ------------------------------------------------------
  NO:{name:'Norway',cur:'NOK',toUSD:0.091,
    cities:['Oslo','Bergen','Trondheim','Stavanger','Troms-'],
    cityAdj:{Oslo:1.3,Bergen:1.0,Trondheim:0.95,Stavanger:1.1,'Troms-':0.9},
    pathways:{
      skilledWorker:{name:'Skilled Worker Permit',desc:'For workers with relevant qualifications and a job offer. Very straightforward process.',time:'1-3 months',best:true,
        procFee:6400,spProcFee:6400,childFee:3200,
        pof:{single:0,couple:0,family3:0,family4:0},
        note:'No separate skills shortage list - any qualified job offer qualifies. PR after 3 years. Norway has highest average wages in Europe.'},
      studentVisa:{name:'Student Residence Permit',desc:'Study at Norwegian HEI. Public universities are tuition-free for all nationalities.',time:'3-8 weeks',
        procFee:6400,tuitionLow:0,tuitionHigh:80000,
        pof:{single:130000,couple:0,family3:0,family4:0},
        note:'Public universities are FREE for all nationalities - most underrated study destination globally. Must cover living costs. Strong oil & tech sectors.'}
    },
    settle:{rent:15000,food:6000,transport:1000,phone:400,insurance:0,misc:5000}},

  // --- FINLAND -----------------------------------------------------
  FI:{name:'Finland',cur:'EUR',toUSD:1.08,
    cities:['Helsinki','Tampere','Turku','Oulu','Espoo'],
    cityAdj:{Helsinki:1.2,Tampere:0.95,Turku:0.95,Oulu:0.88,Espoo:1.15},
    pathways:{
      talentBoost:{name:'Talent Boost / Work Permit',desc:'Finland\'s fast-track for skilled workers (ICT, research, engineering). Employer-sponsored.',time:'1-2 months',best:true,
        procFee:690,spProcFee:390,childFee:200,
        pof:{single:0,couple:0,family3:0,family4:0},
        note:'Finland\'s Talent Boost programme actively recruits skilled non-EU workers. PR after 4 years. Free healthcare. Free quality education for children.'},
      studentVisa:{name:'Student Residence Permit',desc:'Study at Finnish university. No tuition for Bachelor\'s and Master\'s at public universities.',time:'4-8 weeks',
        procFee:500,tuitionLow:0,tuitionHigh:18000,
        pof:{single:6720,couple:0,family3:0,family4:0},
        note:'No tuition at public universities. Strong engineering, IT, and design programmes in English. 1-year job-seeker permit after graduation.'}
    },
    settle:{rent:1200,food:400,transport:80,phone:25,insurance:0,misc:400}},

  // --- DENMARK -----------------------------------------------------
  DK:{name:'Denmark',cur:'DKK',toUSD:0.145,
    cities:['Copenhagen','Aarhus','Odense','Aalborg'],
    cityAdj:{Copenhagen:1.25,Aarhus:1.0,Odense:0.9,Aalborg:0.88},
    pathways:{
      payLimit:{name:'Pay Limit Scheme',desc:'If your salary offer exceeds DKK 492,700/yr (~$71k) you qualify automatically - no occupation requirements.',time:'1-3 months',best:true,
        procFee:4210,spProcFee:4210,childFee:2440,
        pof:{single:0,couple:0,family3:0,family4:0},
        note:'Simplest fast-track: just meet the salary threshold and show a job offer. PR after 8 years (4 with expedited). World-class work-life balance.'},
      positiveList:{name:'Positive List (Shortage Occupations)',desc:'Your occupation must appear on Denmark\'s Positive List of shortage roles. Salary = DKK 360,000.',time:'1-3 months',
        procFee:4210,spProcFee:4210,childFee:2440,
        pof:{single:0,couple:0,family3:0,family4:0},
        note:'IT, healthcare, engineering on the list. Salary threshold lower than Pay Limit Scheme.'},
      studentVisa:{name:'Student Residence Permit',desc:'Study at Danish institution. Danish public universities are tuition-free for EU, but not for non-EU.',time:'4-8 weeks',
        procFee:1550,tuitionLow:6000,tuitionHigh:16000,
        pof:{single:5400,couple:0,family3:0,family4:0},
        note:'English-language programmes widely available. 6-month job-seeker permit after graduation.'}
    },
    settle:{rent:10000,food:3500,transport:500,phone:200,insurance:0,misc:3000}},

  // --- ITALY -------------------------------------------------------
  IT:{name:'Italy',cur:'EUR',toUSD:1.08,
    cities:['Milan','Rome','Naples','Turin','Florence','Bologna'],
    cityAdj:{Milan:1.2,Rome:1.0,Naples:0.75,Turin:0.85,Florence:0.95,Bologna:0.9},
    pathways:{
      nuovoPatto:{name:'Decreto Flussi (Work Visa)',desc:'Italy\'s annual quota-based work permit scheme. Employer must file during the decreto flussi window.',time:'6-18 months',best:true,
        procFee:130,spProcFee:130,
        pof:{single:0,couple:0,family3:0,family4:0},
        note:'Very oversubscribed - applications exhaust in minutes. Employer must register beforehand. Healthcare, care workers, and IT priority sectors.'},
      studentVisa:{name:'Student Visa (Visto per Studio)',desc:'Study at Italian institution. Relatively low tuition. Work 20hr/week.',time:'4-8 weeks',
        procFee:50,tuitionLow:1000,tuitionHigh:10000,
        pof:{single:5000,couple:0,family3:0,family4:0},
        note:'Public university tuition from ~-1,000/year at many institutions. Strong art, design, fashion, and engineering programmes.'},
      nomadVisa:{name:'Digital Nomad / Freelance Visa',desc:'Italy\'s new remote worker visa for freelancers and self-employed workers with income = -28,000/year.',time:'2-4 months',
        procFee:116,
        pof:{single:28000,couple:0,family3:0,family4:0},
        note:'1-year renewable. Low flat tax option (7%) for remote workers in Southern Italy. Strong tech communities in Milan and Rome.'}
    },
    settle:{rent:900,food:350,transport:50,phone:20,insurance:100,misc:350}},

  // --- SPAIN -------------------------------------------------------
  ES:{name:'Spain',cur:'EUR',toUSD:1.08,
    cities:['Madrid','Barcelona','Valencia','Seville','Bilbao','M-laga'],
    cityAdj:{Madrid:1.1,Barcelona:1.15,Valencia:0.9,Seville:0.85,Bilbao:1.0,'M-laga':0.95},
    pathways:{
      techVisa:{name:'Digital Nomad / Tech Visa',desc:'Spain\'s 2023 Startups Act created a visa for remote workers and highly qualified professionals.',time:'2-4 months',best:true,
        procFee:150,spProcFee:150,childFee:75,
        pof:{single:26000,couple:38000,family3:50000,family4:60000},
        note:'Beckett Tax regime: flat 24% tax for first 6 years for new Spanish tax residents. Access to EU. Strong tech communities in Madrid and Barcelona.'},
      workPermit:{name:'Work Permit (Autorizaci-n de Trabajo)',desc:'Employer-sponsored. Must be for at-risk occupation or prove no EU candidate available.',time:'3-6 months',
        procFee:100,
        pof:{single:0,couple:0,family3:0,family4:0},
        note:'EU residency permit after 5 years. Spanish citizenship after 2 years if from eligible African countries (Ibero-American rule applies partially).'},
      studentVisa:{name:'Student Visa (Visado de Estudiante)',desc:'Study at Spanish institution. English programmes growing rapidly. Work 30hr/week.',time:'4-8 weeks',
        procFee:60,tuitionLow:1000,tuitionHigh:12000,
        pof:{single:5400,couple:0,family3:0,family4:0},
        note:'Lower cost of living than UK/Germany. Strong English programmes especially in business and tech. 1-year job-seeker permit after graduation.'}
    },
    settle:{rent:900,food:320,transport:50,phone:20,insurance:80,misc:300}},

  // --- POLAND ------------------------------------------------------
  PL:{name:'Poland',cur:'PLN',toUSD:0.25,
    cities:['Warsaw','Krak-w','Wroclaw','Gdansk','Poznan','L-dz'],
    cityAdj:{Warsaw:1.0,'Krak-w':0.85,'Wroclaw':0.85,'Gdansk':0.9,'Poznan':0.88,'L-dz':0.75},
    pathways:{
      workPermit:{name:'Temporary Residence + Work Permit',desc:'Employer-sponsored. Poland is fastest-growing EU economy with massive demand for workers.',time:'1-3 months',best:true,
        procFee:440,spProcFee:440,childFee:220,
        pof:{single:0,couple:0,family3:0,family4:0},
        note:'Lowest cost of living in EU among major economies. Booming IT sector especially in Warsaw and Krak-w. PR after 5 years, EU citizenship after 10.'},
      studentVisa:{name:'Student Visa / Temporary Residence',desc:'Study at Polish university. Low tuition, growing international programs.',time:'4-8 weeks',
        procFee:340,tuitionLow:1500,tuitionHigh:7000,
        pof:{single:5000,couple:0,family3:0,family4:0},
        note:'Some of the lowest tuition in the EU - English-language programmes from ~-1,500/year. Strong IT, medicine, engineering schools. Bridge into wider EU.'}
    },
    settle:{rent:3500,food:1500,transport:200,phone:60,insurance:0,misc:1000}},

  // --- AUSTRALIA ---------------------------------------------------
  AU:{name:'Australia',cur:'AUD',toUSD:0.65,
    cities:['Sydney','Melbourne','Brisbane','Perth','Adelaide','Canberra','Gold Coast'],
    cityAdj:{Sydney:1.3,Melbourne:1.15,Brisbane:0.95,Perth:1.0,Adelaide:0.85,Canberra:1.05,'Gold Coast':0.9},
    pathways:{
      skilled189:{name:'Skilled Independent (Subclass 189)',desc:'Points-tested PR. No employer or state sponsor needed. 65 points minimum.',time:'6-12 months',best:true,
        procFee:4640,spProcFee:2320,childFee:1160,medDest:350,
        pof:{single:15000,couple:20000,family3:25000,family4:30000},
        note:'Permanent residency with no strings. Healthcare, engineering, IT in high demand. Perth and Adelaide = lower competition, faster invites.'},
      skilled190:{name:'State Nominated (Subclass 190)',desc:'State government nominates you for PR. Requires 65 points + state nomination (adds 5 bonus points).',time:'6-18 months',
        procFee:4640,spProcFee:2320,childFee:1160,medDest:350,
        pof:{single:15000,couple:20000,family3:25000,family4:30000},
        note:'South Australia, Tasmania have more accessible nomination criteria. Adding 5 points from state nomination can be the difference that gets you invited.'},
      employer482:{name:'Employer Sponsored (Subclass 482)',desc:'Temporary Skill Shortage visa. Employer sponsors for 2-4 years with PR pathway via 186.',time:'1-4 months',
        procFee:1455,spProcFee:1455,childFee:365,medDest:350,
        pof:{single:5000,couple:8000,family3:10000,family4:12000},
        note:'Fastest route if you have a job offer. Most 482 holders transition to 186 (permanent) after 2-3 years. Employer often pays fees.'},
      student500:{name:'Student Visa (Subclass 500)',desc:'Study at Australian institution. 48hr/fortnight work. Overseas Student Health Cover mandatory.',time:'4-12 weeks',
        procFee:1600,oshc:600,tuitionLow:20000,tuitionHigh:45000,medDest:350,
        pof:{single:24505,couple:30000,family3:35000,family4:40000},
        note:'Graduate visa (485) gives 2-4 years post-study work. Strong pathway to 189/190 PR. Perth and Adelaide have strong labour markets for graduates.'},
      gts:{name:'Global Talent Scheme',desc:'For highly talented individuals in priority sectors (FinTech, MedTech, Energy, Agri, Space, AI).',time:'3-6 months',
        procFee:4640,medDest:350,
        pof:{single:0,couple:0,family3:0,family4:0},
        note:'No points test, no skills assessment - just nomination by an Australian organisation confirming your talent. Permanent residency directly.'}
    },
    settle:{rent:2200,food:500,transport:180,phone:40,insurance:150,misc:500}},

  // --- NEW ZEALAND -------------------------------------------------
  NZ:{name:'New Zealand',cur:'NZD',toUSD:0.59,
    cities:['Auckland','Wellington','Christchurch','Hamilton','Dunedin'],
    cityAdj:{Auckland:1.15,Wellington:1.0,Christchurch:0.85,Hamilton:0.85,Dunedin:0.8},
    pathways:{
      skilledMigrant:{name:'Skilled Migrant Category Resident Visa',desc:'Residence pathway requiring a skilled job or job offer from an accredited employer and 6 skilled resident points.',time:'6-12 months',best:true,
        procFee:6450,medDest:300,
        pof:{single:5000,couple:8000,family3:10000,family4:12000},
        note:'EOI first, then invitation. Current rules require 6 skilled resident points; changes are announced for 24 August 2026, so verify the live INZ page before relying on this estimate.'},
      workToRes:{name:'AEWV + Work to Residence planning',desc:'AEWV lets you work for an accredited employer; Work to Residence is a later residence application after qualifying Green List work.',time:'7 weeks+',
        procFee:1540,medDest:300,
        pof:{single:4200,couple:6000,family3:8000,family4:10000},
        note:'AEWV cost is from NZD 1,540. Residence later is a separate application currently from NZD 6,450 and usually needs 24 months in a qualifying Green List Tier 2 role.'},
      studentVisa:{name:'Fee Paying Student Visa',desc:'Study full-time in NZ. Current INZ page lists work rights up to 25 hours a week depending on visa conditions.',time:'9.5 weeks',
        procFee:850,tuitionLow:16000,tuitionHigh:35000,medDest:300,
        pof:{single:20000,couple:25000,family3:30000,family4:35000},
        note:'INZ lists NZD 20,000 living funds for a year of tertiary or non-compulsory study, plus tuition and acceptable insurance. Family members apply separately.'}
    },
    settle:{rent:1400,food:400,transport:120,phone:35,insurance:0,misc:400}},

  // --- UAE ---------------------------------------------------------
  AE:{name:'UAE',cur:'AED',toUSD:0.272,
    cities:['Dubai','Abu Dhabi','Sharjah','Ajman','Ras Al Khaimah'],
    cityAdj:{Dubai:1.2,'Abu Dhabi':1.1,Sharjah:0.85,Ajman:0.75,'Ras Al Khaimah':0.8},
    pathways:{
      employmentVisa:{name:'Employment Residence Visa',desc:'Employer-sponsored work and residence route. UAE personal income tax is currently not charged on salaries.',time:'2-6 weeks',best:true,
        procFee:800,spProcFee:600,childFee:300,medDest:150,
        pof:{single:0,couple:0,family3:0,family4:0},
        note:'Employer, emirate, medical, insurance, Emirates ID, and work-bundle handling can change the final bill. Confirm the specific ICP/GDRFA and employer process before paying.'},
      goldenVisa:{name:'Golden Visa (10-year)',desc:'Self-sponsored 10-year residency for investors, entrepreneurs, exceptional talent, outstanding students.',time:'2-6 weeks',
        procFee:1200,spProcFee:1200,childFee:1200,
        pof:{single:100000,couple:100000,family3:100000,family4:100000},
        note:'ICP lists 5- to 10-year Golden Residency categories. Property/public investment thresholds commonly start from AED 2M, while specialized talent and other categories need authority approval.'},
      freelanceLicence:{name:'Freelance Permit / Free Zone',desc:'Work independently through UAE free zones (IFZA, DTEC, RAKEZ). No employer sponsorship needed.',time:'2-4 weeks',
        procFee:1500,
        pof:{single:0,couple:0,family3:0,family4:0},
        note:'Free-zone and freelance-permit packages vary by emirate and authority. Treat this as a licence/residence planning allowance, not an official single UAE fee.'},
      greenVisa:{name:'Green Visa (Self-Sponsored 5-year)',desc:'For skilled employees, freelancers, or investors meeting minimum income (AED 15,000/month).',time:'2-6 weeks',
        procFee:1100,spProcFee:800,childFee:400,
        pof:{single:0,couple:0,family3:0,family4:0},
        note:'Green Residence is self-sponsored. Skilled workers need AED 15,000/month; freelancers need a permit and either financial solvency or AED 360,000 annual freelance income over the past two years.'}
    },
    settle:{rent:2500,food:450,transport:200,phone:60,insurance:200,misc:600}},

  // --- QATAR -------------------------------------------------------
  QA:{name:'Qatar',cur:'QAR',toUSD:0.274,
    cities:['Doha','Al Wakrah','Al Khor','Lusail'],
    cityAdj:{Doha:1.0,'Al Wakrah':0.9,'Al Khor':0.85,Lusail:1.1},
    pathways:{
      employmentVisa:{name:'Employment Visa (QID)',desc:'Employer-sponsored work and residence route; sponsor submits residence documents after entry.',time:'2-6 weeks',best:true,
        procFee:0,spProcFee:0,childFee:0,medDest:100,
        pof:{single:0,couple:0,family3:0,family4:0},
        note:'MOI worker guidance says not to pay a visa fee. Family sponsorship usually needs QR 10,000 salary, or QR 7,000 with family housing, for private-sector employees.'},
      permanentResident:{name:'Permanent Residence Card',desc:'Long-residence committee route; not a normal first-move visa pathway.',time:'3-6 months',
        procFee:6000,
        pof:{single:0,couple:0,family3:0,family4:0},
        note:'MOI lists QR 3,000 non-refundable application fee and QR 3,000 after final approval. Born-abroad applicants generally need 20 years legal residence; Qatar-born applicants need 10 years.'}
    },
    settle:{rent:2200,food:420,transport:180,phone:55,insurance:0,misc:550}},

  // --- SAUDI ARABIA ------------------------------------------------
  SA:{name:'Saudi Arabia',cur:'SAR',toUSD:0.266,
    cities:['Riyadh','Jeddah','Dammam','Mecca','Medina','Khobar'],
    cityAdj:{Riyadh:1.0,Jeddah:1.05,Dammam:0.95,Mecca:0.95,Medina:0.9,Khobar:1.0},
    pathways:{
      employmentVisa:{name:'Employment Visa (Iqama)',desc:'Employer-sponsored work and residence route; employer handles recruitment, work permit, and residence fees.',time:'2-8 weeks',best:true,
        procFee:0,spProcFee:0,childFee:0,medDest:120,
        pof:{single:0,couple:0,family3:0,family4:0},
        note:'HRSd Article 40 says the employer bears recruitment, residence, work permit, renewal, employer-caused fines, profession-change, and exit/re-entry fees.'},
      premiumResident:{name:'Premium Residency (Unlimited Duration)',desc:'Self-sponsored Premium Residency product; unlimited-duration fee is SAR 800,000.',time:'1-3 months',
        procFee:800000,
        pof:{single:0,couple:0,family3:0,family4:0},
        note:'Premium Residency Center lists limited-duration and unlimited-duration products separately. Treat this as a high-net-worth route and confirm the exact PRC product before paying.'},
      talent:{name:'Special Talent Premium Residency',desc:'Premium Residency Center product for qualifying scientific, executive, research, sports, cultural, and artistic talent.',time:'1-3 months',
        procFee:4000,spProcFee:4000,childFee:4000,
        pof:{single:0,couple:0,family3:0,family4:0},
        note:'PRC official content lists SAR 4,000 for special talent-style products. Eligibility is points/product specific, so use this as planning guidance until the official portal confirms fit.'}
    },
    settle:{rent:2000,food:380,transport:150,phone:50,insurance:0,misc:500}},

  // --- OMAN --------------------------------------------------------
  OM:{name:'Oman',cur:'OMR',toUSD:2.604,
    cities:['Muscat','Salalah','Sohar','Nizwa','Sur'],
    cityAdj:{Muscat:1.0,Salalah:0.88,Sohar:0.82,Nizwa:0.78,Sur:0.8},
    pathways:{
      workVisa:{name:'Work Visa + Residence Card',desc:'Employer-requested work visa and resident card route under Oman ROP and Ministry of Labour process.',time:'2-8 weeks',best:true,
        procFee:31,medDest:35,
        pof:{single:0,couple:0,family3:0,family4:0},
        note:'Gov.om/ROP list OMR 20 for issuing a work visa and ROP lists OMR 11 for a two-year residence card. Employer sponsorship is central; confirm whether any cost is employer-paid before reimbursing anyone.'},
      familyJoining:{name:'Family Joining Visa',desc:'For a resident employee sponsor to bring a spouse and children under 21.',time:'2-8 weeks',
        procFee:30,spProcFee:30,childFee:30,medDest:35,
        pof:{single:0,couple:0,family3:0,family4:0},
        note:'ROP/Gov.om list OMR 30 for family visa issuance. ROP also lists senior-job, suitable residence, and at least OMR 600 monthly salary requirements for the sponsoring expatriate.'}
    },
    settle:{rent:220,food:115,transport:30,phone:13,insurance:25,misc:95}},

  // --- SINGAPORE ---------------------------------------------------
  SG:{name:'Singapore',cur:'SGD',toUSD:0.74,
    cities:['Singapore Central','East Region','West Region','North Region'],
    cityAdj:{'Singapore Central':1.2,'East Region':1.0,'West Region':0.95,'North Region':0.9},
    pathways:{
      ep:{name:'Employment Pass (EP)',desc:'For professionals meeting Singapore EP salary thresholds and the COMPASS framework.',time:'10 business days+',best:true,
        procFee:330,spProcFee:330,childFee:330,
        pof:{single:0,couple:0,family3:0,family4:0},
        note:'MOM lists a current EP salary floor of SGD 5,600, higher for financial services and rising with age. Application is SGD 105 plus SGD 225 issuance if approved.'},
      techPass:{name:'Tech talent / ONE Pass planning',desc:'Singapore is replacing Tech.Pass with a ONE Pass AI and Tech track from 2027; use current EP/ONE Pass rules for live eligibility.',time:'4-8 weeks',
        procFee:330,spProcFee:330,childFee:330,
        pof:{single:0,couple:0,family3:0,family4:0},
        note:'For 2026 planning, MOM points experienced tech professionals to the 5-year EP/SOL route or ONE Pass. ONE Pass requires SGD 30,000 monthly salary or outstanding achievements.'},
      studentPass:{name:'Student\'s Pass',desc:'Study at Singapore institution. Part-time work up to 16hrs/week.',time:'4-8 weeks',
        procFee:105,tuitionLow:15000,tuitionHigh:35000,
        pof:{single:24000,couple:0,family3:0,family4:0},
        note:'ICA lists a S$45 Student\'s Pass processing fee and S$60 issuance fee. Apply in the window set by your institution and verify work rights on the live ICA/MOM pages.'}
    },
    settle:{rent:2800,food:600,transport:150,phone:50,insurance:200,misc:700}}
 }
};
  var curPW = null;
  function element(id) { return document.getElementById(id); }
  function isOn(id) { var node = element(id); return !!(node && node.classList.contains("on")); }
  function flightEstimate(o,dc){
  if(o.flights&&o.flights[dc])return o.flights[dc];
  if(dc==='OM'&&o.flights){
    var gulf=[o.flights.AE,o.flights.QA,o.flights.SA].filter(function(v){return v>0;});
    if(gulf.length)return Math.round(gulf.reduce(function(a,b){return a+b;},0)/gulf.length);
  }
  return 800;
}
  function ownerCalculate(){
  var oc=document.getElementById('oCtry').value;
  var dc=document.getElementById('dCtry').value;
  var dCityName=document.getElementById('dCity').value;
  var o=DB.origins[oc],d=DB.dests[dc],pw=d.pathways[curPW];
  if(!pw){return null;}

  var spouse=isOn('tSpouse'),kids=isOn('tKids'),needIelts=isOn('tIelts');
  var prep=isOn('tPrep'),consult=isOn('tConsult'),ship=isOn('tShip'),storage=isOn('tStorage');
  var nKids=kids?Math.max(1,parseInt(document.getElementById('nKids').value)||1):0;
  var fxL=DB.fx[o.cur]||1;
  var dUSD=d.toUSD||1;
  var cAdj=d.cityAdj[dCityName]||1;
  var items=[];

  function aL(name,note,amt,cat,lo,hi){var u=amt/fxL;items.push({name:name,note:note,local:amt,usd:u,lo:u*(lo||1),hi:u*(hi||1),cat:cat});}
  function aU(name,note,amt,cat,lo,hi){items.push({name:name,note:note,local:amt*fxL,usd:amt,lo:amt*(lo||1),hi:amt*(hi||1),cat:cat});}
  function aD(name,note,amt,cat,lo,hi){var u=amt*dUSD;items.push({name:name,note:note,local:u*fxL,usd:u,lo:u*(lo||1),hi:u*(hi||1),cat:cat});}

  var pax=1+(spouse?1:0)+nKids;

  // -- PRE-DEPARTURE ----------------------------------------------
  if(needIelts){
    aL('IELTS / PTE / TOEFL Test Fee','Registration fee (first attempt)',o.ielts,'pre',1,1);
    aL('Language Test Retake Contingency','~35% of candidates need a second attempt',Math.round(o.ielts*0.35),'pre',0,1);
  }
  if(prep)aL('Language Test Prep Course','4-6 weeks coaching programme',o.ieltPrep,'pre',0.8,1.3);
  var skipWES=(dc==='DE'&&curPW==='studentVisa')||(dc==='US'&&curPW==='dvLottery');
  if(!skipWES)aU('Credential Evaluation (WES / NACES / ENIC)','Required for most skilled & study pathways',300,'pre',1,1);
  aL('Passport (new or renewal)','Government fee - allow 4-6 weeks to process',o.passNew,'pre',1,1);
  aL('Police Clearance Certificate','Certificate of good conduct - main applicant',o.police,'pre',1,1.5);
  if(spouse)aL('Spouse Police Clearance','Certificate of good conduct - spouse',o.police,'pre',1,1.5);
  aL('Medical Examination (pre-departure)','Panel physician exam required for visa applications',o.med*pax,'pre',0.9,1.2);
  aL('Document Authentication & Apostille','Notarisation + legalisation of documents for foreign use',Math.round(o.translate*0.5+o.police*2),'pre',0.7,1.6);
  aL('Certified Document Translations','Degree certificates, birth certs, marriage cert',o.translate,'pre',0.8,1.5);
  aU('Document Courier (DHL / FedEx)','For application submissions and embassy correspondence',120,'pre',0.6,1.8);
  var pofVal=(pw.pof?pw.pof[spouse?'couple':'single']:0)||0;
  aU('International Wire Transfer Fees','Sending funds abroad - ~1.5% + flat fees',Math.max(100,Math.round(pofVal*dUSD*0.015+80)),'pre',0.5,2.5);
  aU('Biometric Photo Set','Standard passport / visa photos (multiple copies)',25,'pre',0.6,1.4);
  aU('Embassy / Consulate Appointment Fee','Some countries charge appointment booking fees',50,'pre',0,1.5);

  // -- VISA & IMMIGRATION -----------------------------------------
  aD('Visa Application Fee',pw.name+' - main applicant',pw.procFee,'visa',1,1);
  if(pw.bio)aD('Biometrics Fee','Fingerprints + photograph at VAC',pw.bio,'visa',1,1);
  if(pw.rprf)aD('Right of Permanent Residence Fee','Payable on approval of PR',pw.rprf,'visa',1,1);
  if(pw.ihs){var ihsYrs=pw.ihsYears||1;aD('Immigration Health Surcharge','NHS access - -'+ihsYrs+' years at -1,035/yr',pw.ihs*ihsYrs,'visa',1,1);}
  if(pw.owp)aD('Open Work Permit','Co-applicant work authorisation',pw.owp,'visa',1,1);
  if(pw.pnpFee)aD('Provincial Nominee Application Fee','Province application fee',pw.pnpFee,'visa',1,1);
  if(pw.endorsement)aD('Professional Body Endorsement Fee','UKRI, Royal Academy, Tech Nation etc.',pw.endorsement,'visa',1,1);
  if(pw.premProc)aD('USCIS Premium Processing (I-907)','Guaranteed decision within 15 business days',pw.premProc,'visa',1,1);
  if(pw.antifraud)aD('ACWIA Training / Anti-Fraud Fee','Required employer-side USCIS fee',pw.antifraud,'visa',1,1);
  if(pw.sevis)aD('SEVIS I-901 Fee','Student & Exchange Visitor System tracking fee',pw.sevis,'visa',1,1);
  if(pw.immigrantFee)aD('USCIS Immigrant Fee','Green card production fee',pw.immigrantFee,'visa',1,1);
  if(spouse&&pw.spProcFee)aD('Spouse Visa Application Fee','Dependent / co-applicant',pw.spProcFee,'visa',1,1);
  if(spouse&&pw.spRprf)aD('Spouse RPRF','Right of Permanent Residence - spouse',pw.spRprf,'visa',1,1);
  if(spouse&&pw.spIhs){var spYrs=pw.ihsYears||1;aD('Spouse Immigration Health Surcharge','-'+spYrs+' years',pw.spIhs*spYrs,'visa',1,1);}
  if(kids&&nKids>0&&pw.childFee)aD('Children Visa Fees','-'+nKids+' child'+(nKids>1?'ren':''),pw.childFee*nKids,'visa',1,1);
  if(kids&&nKids>0&&pw.childIhs){var chYrs=pw.ihsYears||3;aD('Children Health Surcharge','-'+nKids+' - '+chYrs+' years',pw.childIhs*nKids*chYrs,'visa',1,1);}
  aU('VFS / VAC Service Fees','Visa Application Centre processing surcharge',75,'visa',0.5,1.5);

  // -- TRAVEL ----------------------------------------------------
  var flUSD=flightEstimate(o,dc);
  aU('Flights (one-way economy)','-'+pax+' passenger'+(pax>1?'s':''),flUSD*pax,'travel',0.8,1.4);
  var bags=Math.max(2,(1+(spouse?1:0))*2+nKids);
  aU('Checked Baggage Fees','-'+bags+' bags (avg $50/bag)',bags*50,'travel',0.5,1.5);
  aU('Excess Baggage or Freight','When bags exceed airline allowance',Math.round(bags*30),'travel',0,1.8);
  var s=d.settle;
  aD('Arrival Accommodation (2-3 weeks)','Hotel or Airbnb while flat-hunting - before you have a lease',Math.round(s.rent*cAdj*0.65),'travel',0.5,1.4);
  aD('Airport Transfers & First Transport','Taxi, Uber, rail - first week getting around',Math.round(s.transport*cAdj*0.5),'travel',0.4,1.5);
  aD('SIM Card & Mobile Data (arrival)','Pre-paid SIM for first few weeks',30*dUSD,'travel',0.5,1.5);

  // -- SETTLEMENT & LIVING ---------------------------------------
  var pofKey=kids?(nKids>=2?'family4':'family3'):(spouse?'couple':'single');
  var pof=(pw.pof?pw.pof[pofKey]:0)||0;
  if(pof>0)aD('Proof of Funds / Settlement Buffer','Official required funds where specified; otherwise a planning reserve that may be partially refundable',pof,'settle',1,1);
  if(pw.medDest)aD('Medical Exam at Destination','Panel physician appointed by immigration authority',pw.medDest*pax,'settle',0.9,1.2);
  var rent=Math.round(s.rent*cAdj);
  aD('First Month Rent + Security Deposit',dCityName+' market - deposit typically equals 1 month rent',rent*2,'settle',0.7,1.5);
  var aeq=1+(spouse?1:0)+nKids*0.6;
  aD('Food & Groceries (3 months)','Household of '+pax+' people',Math.round(s.food*3*aeq*cAdj),'settle',0.8,1.2);
  aD('Transport (3 months)','Public transit cards + initial setup',Math.round(s.transport*3*(1+(spouse?0.5:0))*cAdj),'settle',0.6,1.5);
  aD('Phone Plans (3 months)','-'+Math.min(pax,2)+' SIMs + broadband setup',Math.round(s.phone*3*Math.min(pax,2)+65),'settle',0.7,1.4);
  aD('Household Setup & Essentials','Bed, kitchen items, linen, cleaning, basic furniture',Math.round(900*cAdj*(1+pax*0.12)),'settle',0.5,1.8);
  aD('Contingency Fund (90 days)','Unexpected costs - always happens in the first 3 months',Math.round(s.misc*2.5*cAdj),'settle',0.4,2.0);
  if(s.insurance>0)aD('Health Insurance (3 months)','Until employer or government coverage begins',Math.round(s.insurance*3*pax),'settle',0.8,1.3);
  aU('Bank Account Opening & Initial Fees','Account setup + initial deposit requirement',Math.round(90+pax*25),'settle',0.4,2.0);
  aU("Driver's Licence Conversion",'Foreign licence ? local equivalent (-'+(1+(spouse?1:0))+')',150*(1+(spouse?1:0)),'settle',0.5,2.0);
  aD('Utilities Setup (electricity, gas, water)','Connection fees + first month in new flat',Math.round(rent*0.18),'settle',0.5,1.5);
  aD('Renter\'s or Contents Insurance','Protect belongings in new home',Math.round(rent*0.06),'settle',0.5,1.3);
  if(kids&&nKids>0)aD('School Uniforms & Registration','Public school enrolment fees + mandatory uniforms',Math.round(200*dUSD*nKids),'settle',0.5,2.0);

  // -- EDUCATION (visa-type-specific) ----------------------------
  if(pw.tuitionLow!==undefined&&pw.tuitionHigh>0){
    var avgT=Math.round((pw.tuitionLow+pw.tuitionHigh)/2);
    aD('First Year Tuition','Range: '+d.cur+' '+(pw.tuitionLow||0).toLocaleString()+' - '+(pw.tuitionHigh||0).toLocaleString(),avgT,'education',pw.tuitionLow/avgT||0.5,pw.tuitionHigh/avgT||1.5);
    aD('Student Materials & Textbooks','Books, software licences, lab fees',Math.round(600*dUSD),'education',0.5,1.6);
    aD('Student Union / Activity Fees','Mandatory campus fees',Math.round(200*dUSD),'education',0.5,1.3);
  } else if(pw.tuitionHigh===0){
    aD('Semester Administrative Fee','German / Nordic public university admin costs (-2)',350,'education',1,1.3);
  }
  if(pw.gic)aD('Guaranteed Investment Certificate (GIC)','Mandatory deposit - refunded monthly during studies',pw.gic,'education',1,1);
  if(pw.blocked)aD('Blocked Account (Sperrkonto)','Required for German visa - releases ~-934/month',pw.blocked,'education',1,1);
  if(pw.oshc)aD('Overseas Student Health Cover (OSHC)','Mandatory for Australian student visa - 1 year minimum',pw.oshc,'education',0.9,1.2);

  // -- OPTIONAL ADD-ONS ------------------------------------------
  if(consult)aL('Immigration Consultant / Lawyer','Full application guidance, document review & lodgement',o.consultant,'optional',0.7,1.5);
  if(ship)aU('International Sea Freight (household goods)','1-bedroom apartment volume - door to door',o.shipping,'optional',0.7,1.6);
  if(storage)aL('Storage Unit (6 months, origin country)','Keep belongings while settling in destination',o.storage*6,'optional',0.8,1.3);
  aD('Local Language Classes (3 months)','Beginner to intermediate - French, German, Dutch etc.',Math.round(300*dUSD),'optional',0.5,1.5);
  aD('Job Search Coaching & CV Services','Professional CV writing + LinkedIn optimisation',Math.round(200*dUSD),'optional',0.3,1.5);
  aD('Professional Licence Conversion','Local recognition of foreign professional qualifications',Math.round(400*dUSD),'optional',0,2.0);

  return {items:items,o:o,d:d,pw:pw,oc:oc,dc:dc,dCity:dCityName,pax:pax,spouse:spouse,kids:kids,nKids:nKids};
}
  function money(value) { return "$" + Math.round(value).toLocaleString(); }
  function pathway() {
    var destination = DB.dests[element("dCtry").value];
    var requested = document.querySelector("#pwGrid [data-owner-pathway].on");
    return requested && destination.pathways[requested.dataset.ownerPathway]
      ? requested.dataset.ownerPathway
      : Object.keys(destination.pathways)[0];
  }
  function renderPathways() {
    var destination = DB.dests[element("dCtry").value];
    var grid = element("pwGrid");
    var note = element("pwNote");
    var keys = Object.keys(destination.pathways);
    grid.innerHTML = keys.map(function (key, index) {
      var item = destination.pathways[key];
      return '<button type="button" class="pw' + (index === 0 ? ' on' : '') +
        '" data-owner-pathway="' + key + '"><strong>' + item.name +
        '</strong><span>' + item.time + '</span></button>';
    }).join("");
    grid.querySelectorAll("[data-owner-pathway]").forEach(function (button) {
      button.addEventListener("click", function () {
        grid.querySelectorAll("[data-owner-pathway]").forEach(function (item) { item.classList.remove("on"); });
        button.classList.add("on");
        curPW = button.dataset.ownerPathway;
        note.textContent = destination.pathways[curPW].note || destination.pathways[curPW].desc || "";
      });
    });
    curPW = keys[0];
    note.textContent = destination.pathways[curPW].note || destination.pathways[curPW].desc || "";
  }
  function render(result) {
    if (!result) return;
    var total = 0, low = 0, high = 0, local = 0;
    result.items.forEach(function (item) {
      total += item.usd; low += item.lo; high += item.hi; local += item.local;
    });
    element("totUsd").textContent = money(total) + " USD";
    element("totLocal").textContent = result.o.sym + Math.round(local).toLocaleString() + " " + result.o.cur;
    element("totSub").textContent = result.o.name + " -> " + result.d.name + " (" + result.dCity + ") - " + result.pw.name;
    element("rangeMin").textContent = "Bas: " + money(low);
    element("rangeMid").textContent = "Moyen: " + money(total);
    element("rangeMax").textContent = "Haut: " + money(high);
    var income = Number(element("monthlyIncome").value) || 0;
    var rate = Number(element("savingsRate").value) || 25;
    var saved = Number(element("alreadySaved").value) || 0;
    var monthlySavings = income * rate / 100;
    var remaining = Math.max(0, total - saved);
    var months = monthlySavings > 0 ? Math.ceil(remaining / monthlySavings) : null;
    element("totBadges").innerHTML = "<span>" + result.pw.time + "</span><span>Reste: " + money(remaining) + "</span>";
    element("totSub").dataset.uaSavingsMonths = months == null ? "" : String(months);
    var savings = element("spBar");
    savings.style.display = "block";
    savings.innerHTML = '<div class="sp-bar-title">Progression d epargne</div><div id="spTxt">' +
      money(monthlySavings) + ' / mois</div><div id="spSub">' +
      (months == null ? 'Ajoutez le revenu mensuel.' : months + ' mois restants') + '</div>';
    var results = element("results");
    results.dataset.uaMonthlySavings = String(monthlySavings);
    results.dataset.uaOwnerTotal = String(total);
    results.dataset.uaOwnerLow = String(low);
    results.dataset.uaOwnerHigh = String(high);
    element("breakdown").innerHTML = result.items.map(function (item) {
      return '<div class="line-item" data-owner-category="' + item.cat + '"><span>' +
        item.name + '</span><strong>' + money(item.usd) + '</strong></div>';
    }).join("");
    results.classList.add("on");
    window.AfroToolsFrenchJapaPayload = {
      total: total, low: low, high: high, local: local,
      monthlySavings: monthlySavings, savingsMonths: months,
      items: result.items.map(function (item) {
        return { name: item.name, category: item.cat, usd: item.usd, low: item.lo, high: item.hi, local: item.local };
      })
    };
  }
  window.updOrigin = function () {
    var origin = DB.origins[element("oCtry").value];
    element("oCity").innerHTML = origin.cities.map(function (city) { return "<option>" + city + "</option>"; }).join("");
  };
  window.updDest = function () {
    var destination = DB.dests[element("dCtry").value];
    element("dCity").innerHTML = destination.cities.map(function (city) { return "<option>" + city + "</option>"; }).join("");
    renderPathways();
  };
  window.recalcIfDone = function () {};
  window.calculate = function () {
    curPW = pathway();
    render(ownerCalculate());
  };
  document.addEventListener("DOMContentLoaded", function () {
    window.updOrigin();
    window.updDest();
  });
})(window, document);
