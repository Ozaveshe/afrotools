var AfroAtlas = (function() {
  'use strict';

  var RESOURCE_TYPES = {
    oil:{emoji:'🛢️',label:'Crude Oil',color:'#1a1a2e'},
    gas:{emoji:'🔥',label:'Natural Gas',color:'#e94560'},
    gold:{emoji:'🥇',label:'Gold',color:'#F5A623'},
    diamond:{emoji:'💎',label:'Diamonds',color:'#60A5FA'},
    copper:{emoji:'🔶',label:'Copper',color:'#B45309'},
    cobalt:{emoji:'⚡',label:'Cobalt',color:'#3B82F6'},
    iron:{emoji:'⛏️',label:'Iron Ore',color:'#78716C'},
    uranium:{emoji:'☢️',label:'Uranium',color:'#84CC16'},
    platinum:{emoji:'✨',label:'Platinum',color:'#E5E7EB'},
    bauxite:{emoji:'🟠',label:'Bauxite',color:'#EA580C'},
    phosphate:{emoji:'🧪',label:'Phosphates',color:'#14B8A6'},
    coal:{emoji:'⬛',label:'Coal',color:'#343a40'},
    chromium:{emoji:'🔗',label:'Chromium',color:'#495057'},
    manganese:{emoji:'🔧',label:'Manganese',color:'#6d6875'},
    lithium:{emoji:'🔋',label:'Lithium',color:'#80ed99'},
    coltan:{emoji:'📱',label:'Coltan/Tantalum',color:'#5e60ce'},
    timber:{emoji:'🪵',label:'Timber',color:'#166534'},
    fish:{emoji:'🐟',label:'Fisheries',color:'#0077b6'},
    farm:{emoji:'🌾',label:'Arable Land',color:'#588157'},
    cocoa:{emoji:'🍫',label:'Cocoa',color:'#92400E'},
    coffee:{emoji:'☕',label:'Coffee',color:'#78350F'},
    mineral:{emoji:'⛏️',label:'Other Minerals',color:'#8d99ae'}
  };

  var REGIONS = {
    west:{name:'West Africa',codes:['NG','GH','SN','CI','CM','ML','BF','GN','NE','TG','BJ','SL','LR','GM','GW','CV','MR']},
    east:{name:'East Africa',codes:['KE','TZ','ET','UG','RW','MZ','MG','ZM','ZW','MW','SO','BI','DJ','ER','SS']},
    south:{name:'Southern Africa',codes:['ZA','BW','NA','LS','SZ','AO']},
    central:{name:'Central Africa',codes:['CD','CG','GA','CF','TD','GQ','ST']},
    north:{name:'North Africa',codes:['EG','MA','DZ','TN','LY','SD']},
    island:{name:'Island Nations',codes:['MU','SC','KM']}
  };

  var COUNTRIES = {
    // ========== WEST AFRICA (17) ==========
    NG: {
      name:'Nigeria', slug:'nigeria', flag:'🇳🇬', region:'west', capital:'Abuja',
      population:223800000, popGrowth:2.4,
      gdp:363e9, gdpPpp:1270e9, gdpPC:1621, gdpPCppp:5675, gdpGrowth:3.3,
      gdpHist:{1990:30.8e9,2000:46.4e9,2010:369.1e9,2015:486.8e9,2020:432.3e9,2024:363e9},
      currency:{code:'NGN',name:'Nigerian Naira',sym:'₦'},
      resources:[
        {type:'oil',rank:1,prod:'1.25M bpd',share:25,global:11,note:'Africa\'s largest oil producer'},
        {type:'gas',rank:1,prod:'49.3 bcm/yr',share:35,global:9,note:'Largest gas reserves in Africa'},
        {type:'farm',rank:3,prod:'34M hectares',share:12,global:14,note:'65% of land is arable'},
        {type:'iron',rank:3,prod:'3M tonnes/yr',share:8,global:null,note:'Kogi and Enugu states'},
        {type:'cocoa',rank:4,prod:'350K tonnes/yr',share:9,global:4,note:'Was once world\'s largest cocoa producer'}
      ],
      exports:[{p:'Crude Petroleum',v:42e9,s:72},{p:'Petroleum Gas',v:6.5e9,s:11},{p:'Cocoa Beans',v:800e6,s:1.4},{p:'Rubber',v:400e6,s:0.7},{p:'Sesame Seeds',v:350e6,s:0.6}],
      imports:[{p:'Refined Petroleum',v:13e9,s:22},{p:'Wheat',v:3.2e9,s:5.5},{p:'Cars',v:2.8e9,s:4.8},{p:'Medicines',v:2.1e9,s:3.6},{p:'Plastics',v:1.8e9,s:3.1}],
      totalExports:58e9, totalImports:58.5e9,
      hdi:0.535, hdiRank:163, gini:35.1, inflation:28.9, unemployment:33.3,
      debtGdp:38.8, fdi:3.1e9, electricity:62, internet:55, lifeExp:52.7, literacy:62,
      rrs:78,
      tagline:'The Oil Giant That Could Feed a Continent',
      paradox:'Nigeria earns $42B/year from oil yet 40% lives below the poverty line. With 84M hectares of arable land, it imports $3.2B in wheat annually.',
      tools:[{n:'Nigeria PAYE Calculator',p:'/nigeria/ng-salary-tax'},{n:'Nigeria VAT Calculator',p:'/tools/vat-calculator/vat-calc'}]
    },
    GH: {
      name:'Ghana', slug:'ghana', flag:'🇬🇭', region:'west', capital:'Accra',
      population:33500000, popGrowth:2.1,
      gdp:76e9, gdpPpp:236e9, gdpPC:2268, gdpPCppp:7043, gdpGrowth:2.9,
      gdpHist:{1990:5.9e9,2000:4.98e9,2010:32.2e9,2015:49.2e9,2020:68.5e9,2024:76e9},
      currency:{code:'GHS',name:'Ghanaian Cedi',sym:'₵'},
      resources:[
        {type:'gold',rank:1,prod:'130 tonnes/yr',share:27,global:6,note:'Africa\'s largest gold producer since 2019'},
        {type:'oil',rank:5,prod:'148K bpd',share:3,global:38,note:'Jubilee field discovered 2007'},
        {type:'cocoa',rank:2,prod:'800K tonnes/yr',share:15,global:2,note:'World\'s second-largest cocoa producer'},
        {type:'bauxite',rank:3,prod:'1.2M tonnes/yr',share:3,global:11,note:'Awaso and Nyinahin deposits'},
        {type:'manganese',rank:3,prod:'2.2M tonnes/yr',share:5,global:5,note:'Nsuta mine'}
      ],
      exports:[{p:'Gold',v:8.5e9,s:38},{p:'Crude Petroleum',v:5.2e9,s:23},{p:'Cocoa Beans',v:3.8e9,s:17},{p:'Cocoa Paste',v:800e6,s:3.6},{p:'Manganese Ore',v:600e6,s:2.7}],
      imports:[{p:'Refined Petroleum',v:2.8e9,s:15},{p:'Cars',v:1.1e9,s:5.9},{p:'Rice',v:900e6,s:4.8},{p:'Medicines',v:600e6,s:3.2},{p:'Cement',v:500e6,s:2.7}],
      totalExports:22.4e9, totalImports:18.6e9,
      hdi:0.602, hdiRank:142, gini:43.5, inflation:23.2, unemployment:14.7,
      debtGdp:88.1, fdi:2.6e9, electricity:85, internet:68, lifeExp:63.8, literacy:79,
      rrs:72,
      tagline:'Gold Coast Reborn as Africa\'s Democratic Model',
      paradox:'Africa\'s top gold producer and 2nd-largest cocoa exporter, yet debt-to-GDP exceeds 88%.',
      tools:[{n:'Ghana PAYE Calculator',p:'/ghana/gh-paye'}]
    },
    CI: {
      name:'Côte d\'Ivoire', slug:'cote-divoire', flag:'🇨🇮', region:'west', capital:'Yamoussoukro',
      population:28600000, popGrowth:2.5,
      gdp:78e9, gdpPpp:199e9, gdpPC:2728, gdpPCppp:6960, gdpGrowth:6.5,
      gdpHist:{1990:10.8e9,2000:10.4e9,2010:24.9e9,2015:36.4e9,2020:61.3e9,2024:78e9},
      currency:{code:'XOF',name:'West African CFA Franc',sym:'CFA'},
      resources:[
        {type:'cocoa',rank:1,prod:'2.2M tonnes/yr',share:40,global:1,note:'World\'s largest cocoa producer — 40% of global supply'},
        {type:'gold',rank:5,prod:'48 tonnes/yr',share:10,global:16,note:'Rapidly expanding gold sector'},
        {type:'oil',rank:7,prod:'30K bpd',share:0.6,global:null,note:'Modest offshore production'},
        {type:'farm',rank:2,prod:'Cashew: 1M tonnes/yr',share:45,global:1,note:'World\'s top cashew producer'}
      ],
      exports:[{p:'Cocoa Beans',v:5.8e9,s:30},{p:'Gold',v:3.2e9,s:16},{p:'Refined Petroleum',v:2.5e9,s:13},{p:'Rubber',v:1.8e9,s:9.2},{p:'Cashew Nuts',v:1.2e9,s:6.1}],
      imports:[{p:'Crude Petroleum',v:3.5e9,s:16},{p:'Rice',v:1.4e9,s:6.4},{p:'Medicines',v:800e6,s:3.7},{p:'Fish',v:700e6,s:3.2},{p:'Wheat',v:600e6,s:2.8}],
      totalExports:19.5e9, totalImports:21.8e9,
      hdi:0.534, hdiRank:164, gini:37.2, inflation:4.4, unemployment:3.4,
      debtGdp:56.8, fdi:1.6e9, electricity:70, internet:45, lifeExp:58.6, literacy:47,
      rrs:68,
      tagline:'The Chocolate Empire That Sweetens the World',
      paradox:'Produces 40% of the world\'s cocoa yet captures less than 6% of the $130B chocolate market.',
      tools:[{n:'Côte d\'Ivoire PAYE',p:'/cote-divoire/ci-paye'}]
    },
    SN: {
      name:'Senegal', slug:'senegal', flag:'🇸🇳', region:'west', capital:'Dakar',
      population:17900000, popGrowth:2.7,
      gdp:31.1e9, gdpPpp:77.4e9, gdpPC:1738, gdpPCppp:4328, gdpGrowth:8.8,
      gdpHist:{1990:5.7e9,2000:4.7e9,2010:12.9e9,2015:18.6e9,2020:24.4e9,2024:31.1e9},
      currency:{code:'XOF',name:'West African CFA Franc',sym:'CFA'},
      resources:[
        {type:'phosphate',rank:3,prod:'2.8M tonnes/yr',share:8,global:11,note:'Thiès region'},
        {type:'gas',rank:5,prod:'Greater Tortue Ahmeyim',share:0,global:null,note:'Massive offshore gas, first production 2024'},
        {type:'fish',rank:2,prod:'500K tonnes/yr',share:12,global:25,note:'Major fishing industry'},
        {type:'gold',rank:7,prod:'18 tonnes/yr',share:3.7,global:null,note:'Sabodala mine'}
      ],
      exports:[{p:'Gold',v:3.8e9,s:28},{p:'Phosphoric Acid',v:1.2e9,s:8.9},{p:'Fish',v:1.1e9,s:8.1},{p:'Refined Petroleum',v:900e6,s:6.7},{p:'Cement',v:500e6,s:3.7}],
      imports:[{p:'Refined Petroleum',v:3.2e9,s:18},{p:'Rice',v:900e6,s:5.1},{p:'Wheat',v:500e6,s:2.8},{p:'Medicines',v:450e6,s:2.6},{p:'Cars',v:400e6,s:2.3}],
      totalExports:13.5e9, totalImports:17.6e9,
      hdi:0.511, hdiRank:170, gini:40.3, inflation:3.7, unemployment:22.0,
      debtGdp:76.4, fdi:2.7e9, electricity:67, internet:58, lifeExp:68.2, literacy:52,
      rrs:58,
      tagline:'West Africa\'s Newest Oil & Gas Frontier',
      paradox:'Poised to become a major hydrocarbons producer yet currently imports 90% of its energy.',
      tools:[{n:'Senegal PAYE Calculator',p:'/senegal/sn-paye'}]
    },
    CM: {
      name:'Cameroon', slug:'cameroon', flag:'🇨🇲', region:'west', capital:'Yaoundé',
      population:28600000, popGrowth:2.6,
      gdp:44.3e9, gdpPpp:115e9, gdpPC:1548, gdpPCppp:4020, gdpGrowth:3.8,
      gdpHist:{1990:11.2e9,2000:9.3e9,2010:23.6e9,2015:32.1e9,2020:40.8e9,2024:44.3e9},
      currency:{code:'XAF',name:'Central African CFA Franc',sym:'FCFA'},
      resources:[
        {type:'oil',rank:6,prod:'53K bpd',share:1.1,global:44,note:'Declining mature fields'},
        {type:'timber',rank:2,prod:'2.3M m³/yr',share:15,global:null,note:'Second-largest tropical forest in Africa'},
        {type:'bauxite',rank:2,prod:'1.5M tonnes/yr',share:4,global:12,note:'Minim-Martap deposits'},
        {type:'cocoa',rank:3,prod:'280K tonnes/yr',share:5,global:5,note:'5th-largest cocoa producer globally'}
      ],
      exports:[{p:'Crude Petroleum',v:3.2e9,s:31},{p:'Cocoa Beans',v:1.1e9,s:10.7},{p:'Sawn Wood',v:900e6,s:8.7},{p:'Bananas',v:400e6,s:3.9},{p:'Aluminum',v:350e6,s:3.4}],
      imports:[{p:'Refined Petroleum',v:1.8e9,s:14},{p:'Rice',v:700e6,s:5.4},{p:'Medicines',v:500e6,s:3.9},{p:'Wheat',v:450e6,s:3.5},{p:'Machinery',v:400e6,s:3.1}],
      totalExports:10.3e9, totalImports:12.9e9,
      hdi:0.576, hdiRank:151, gini:46.6, inflation:7.4, unemployment:6.1,
      debtGdp:46.3, fdi:900e6, electricity:65, internet:36, lifeExp:59.3, literacy:77,
      rrs:62,
      tagline:'Africa in Miniature — From Sahel to Sea',
      paradox:'Holds the continent\'s 2nd-largest tropical forest yet refining capacity is near zero.',
      tools:[{n:'Cameroon PAYE Calculator',p:'/cameroon/cm-paye'}]
    },
    ML: {
      name:'Mali', slug:'mali', flag:'🇲🇱', region:'west', capital:'Bamako',
      population:22600000, popGrowth:3.0,
      gdp:20.5e9, gdpPpp:56.2e9, gdpPC:907, gdpPCppp:2487, gdpGrowth:4.5,
      gdpHist:{1990:2.4e9,2000:2.6e9,2010:10.6e9,2015:13.1e9,2020:17.5e9,2024:20.5e9},
      currency:{code:'XOF',name:'West African CFA Franc',sym:'CFA'},
      resources:[
        {type:'gold',rank:3,prod:'66 tonnes/yr',share:13.6,global:14,note:'Third-largest gold producer in Africa'},
        {type:'farm',rank:6,prod:'Cotton/rice/millet',share:3,global:null,note:'Agriculture employs 80%'}
      ],
      exports:[{p:'Gold',v:4.8e9,s:80},{p:'Raw Cotton',v:600e6,s:10},{p:'Live Animals',v:120e6,s:2},{p:'Sesame Seeds',v:80e6,s:1.3}],
      imports:[{p:'Refined Petroleum',v:1.2e9,s:17},{p:'Medicines',v:400e6,s:5.7},{p:'Cement',v:300e6,s:4.3},{p:'Rice',v:280e6,s:4}],
      totalExports:6e9, totalImports:7e9,
      hdi:0.410, hdiRank:188, gini:33.0, inflation:2.8, unemployment:7.5,
      debtGdp:52.0, fdi:600e6, electricity:50, internet:33, lifeExp:59.3, literacy:31,
      rrs:52,
      tagline:'The Golden Landlocked Giant of the Sahel',
      paradox:'Africa\'s 3rd-largest gold producer at $4.8B/yr yet literacy is just 31%.',
      tools:[{n:'Mali PAYE Calculator',p:'/mali/ml-paye'}]
    },
    BF: {
      name:'Burkina Faso', slug:'burkina-faso', flag:'🇧🇫', region:'west', capital:'Ouagadougou',
      population:22700000, popGrowth:2.5,
      gdp:19.4e9, gdpPpp:55.1e9, gdpPC:855, gdpPCppp:2427, gdpGrowth:5.0,
      gdpHist:{1990:3.1e9,2000:2.6e9,2010:10.1e9,2015:12.0e9,2020:17.9e9,2024:19.4e9},
      currency:{code:'XOF',name:'West African CFA Franc',sym:'CFA'},
      resources:[
        {type:'gold',rank:4,prod:'57 tonnes/yr',share:11.7,global:16,note:'Fastest-growing gold sector in Africa'},
        {type:'farm',rank:7,prod:'Cotton/shea nuts',share:5,global:2,note:'World\'s 2nd-largest shea nut producer'}
      ],
      exports:[{p:'Gold',v:5.6e9,s:75},{p:'Raw Cotton',v:900e6,s:12},{p:'Zinc Ore',v:300e6,s:4}],
      imports:[{p:'Refined Petroleum',v:1.3e9,s:16},{p:'Medicines',v:400e6,s:4.9},{p:'Rice',v:350e6,s:4.3}],
      totalExports:7.5e9, totalImports:8.1e9,
      hdi:0.438, hdiRank:185, gini:35.3, inflation:1.4, unemployment:5.3,
      debtGdp:55.8, fdi:100e6, electricity:22, internet:21, lifeExp:59.2, literacy:41,
      rrs:55,
      tagline:'Cotton Fields and Gold Mines in the Heart of the Sahel',
      paradox:'Africa\'s largest cotton and 4th-largest gold producer, yet only 22% have electricity.',
      tools:[{n:'Burkina Faso PAYE',p:'/burkina-faso/bf-paye'}]
    },
    GN: {
      name:'Guinea', slug:'guinea', flag:'🇬🇳', region:'west', capital:'Conakry',
      population:14200000, popGrowth:2.8,
      gdp:21.5e9, gdpPpp:47.8e9, gdpPC:1514, gdpPCppp:3366, gdpGrowth:5.6,
      gdpHist:{1990:2.7e9,2000:3.0e9,2010:6.8e9,2015:8.8e9,2020:15.7e9,2024:21.5e9},
      currency:{code:'GNF',name:'Guinean Franc',sym:'FG'},
      resources:[
        {type:'bauxite',rank:1,prod:'100M tonnes/yr',share:70,global:1,note:'World\'s largest bauxite reserves and #1 exporter'},
        {type:'iron',rank:2,prod:'Simandou — 2B+ tonnes reserves',share:0,global:null,note:'World\'s largest untapped iron ore deposit'},
        {type:'gold',rank:6,prod:'25 tonnes/yr',share:5.1,global:null,note:'Growing mining sector'},
        {type:'diamond',rank:5,prod:'300K carats/yr',share:0.6,global:null,note:'Alluvial deposits'}
      ],
      exports:[{p:'Bauxite',v:5.5e9,s:61},{p:'Gold',v:2.4e9,s:27},{p:'Aluminum Ore',v:500e6,s:5.6},{p:'Fish',v:200e6,s:2.2}],
      imports:[{p:'Refined Petroleum',v:1.5e9,s:19},{p:'Rice',v:800e6,s:10},{p:'Medicines',v:350e6,s:4.4},{p:'Machinery',v:300e6,s:3.8}],
      totalExports:9e9, totalImports:7.9e9,
      hdi:0.465, hdiRank:182, gini:29.6, inflation:8.2, unemployment:6.2,
      debtGdp:37.6, fdi:400e6, electricity:44, internet:35, lifeExp:58.9, literacy:32,
      rrs:74,
      tagline:'The Bauxite Behemoth Sitting on Iron Gold',
      paradox:'Holds a third of the world\'s bauxite and the richest untapped iron deposit (Simandou), yet 44% electricity access.',
      tools:[{n:'Guinea PAYE Calculator',p:'/guinea/gn-paye'}]
    },
    NE: {
      name:'Niger', slug:'niger', flag:'🇳🇪', region:'west', capital:'Niamey',
      population:26200000, popGrowth:3.7,
      gdp:16.6e9, gdpPpp:43.6e9, gdpPC:634, gdpPCppp:1664, gdpGrowth:6.0,
      gdpHist:{1990:2.5e9,2000:1.8e9,2010:5.7e9,2015:7.6e9,2020:13.7e9,2024:16.6e9},
      currency:{code:'XOF',name:'West African CFA Franc',sym:'CFA'},
      resources:[
        {type:'uranium',rank:1,prod:'2020 tonnes/yr',share:60,global:5,note:'Africa\'s largest uranium producer — fuels French nuclear plants'},
        {type:'oil',rank:8,prod:'20K bpd',share:0.4,global:null,note:'Agadem block'},
        {type:'gold',rank:8,prod:'15 tonnes/yr',share:3.1,global:null,note:'Artisanal and Samira Hill mine'}
      ],
      exports:[{p:'Uranium',v:600e6,s:25},{p:'Gold',v:500e6,s:21},{p:'Crude Petroleum',v:400e6,s:17},{p:'Onions',v:150e6,s:6.3}],
      imports:[{p:'Refined Petroleum',v:600e6,s:14},{p:'Rice',v:300e6,s:7},{p:'Machinery',v:280e6,s:6.5},{p:'Medicines',v:250e6,s:5.8}],
      totalExports:2.4e9, totalImports:4.3e9,
      hdi:0.394, hdiRank:189, gini:32.9, inflation:3.7, unemployment:0.5,
      debtGdp:50.2, fdi:600e6, electricity:19, internet:17, lifeExp:62.0, literacy:35,
      rrs:48,
      tagline:'The Uranium Heartbeat of Europe\'s Nuclear Grid',
      paradox:'Produces the uranium powering France\'s reactors, yet only 19% of Nigeriens have electricity.',
      tools:[{n:'Niger PAYE Calculator',p:'/niger/ne-paye'}]
    },
    TG: {
      name:'Togo', slug:'togo', flag:'🇹🇬', region:'west', capital:'Lomé',
      population:8850000, popGrowth:2.3,
      gdp:9.1e9, gdpPpp:23.2e9, gdpPC:1028, gdpPCppp:2621, gdpGrowth:5.3,
      gdpHist:{1990:1.6e9,2000:1.3e9,2010:3.4e9,2015:4.7e9,2020:7.6e9,2024:9.1e9},
      currency:{code:'XOF',name:'West African CFA Franc',sym:'CFA'},
      resources:[
        {type:'phosphate',rank:2,prod:'1.5M tonnes/yr',share:4,global:15,note:'Once the world\'s 5th-largest phosphate producer'}
      ],
      exports:[{p:'Refined Petroleum',v:1.2e9,s:24},{p:'Phosphate Rock',v:400e6,s:8},{p:'Cement',v:350e6,s:7},{p:'Cotton',v:200e6,s:4}],
      imports:[{p:'Refined Petroleum',v:1.4e9,s:18},{p:'Rice',v:350e6,s:4.5},{p:'Cars',v:300e6,s:3.9}],
      totalExports:5e9, totalImports:7.7e9,
      hdi:0.539, hdiRank:162, gini:42.4, inflation:3.5, unemployment:3.9,
      debtGdp:67.5, fdi:300e6, electricity:55, internet:35, lifeExp:61.6, literacy:64,
      rrs:35,
      tagline:'West Africa\'s Phosphate Port and Transit Hub',
      paradox:'Port of Lomé is the only deepwater port in West Africa, yet 45% live below the poverty line.',
      tools:[{n:'Togo PAYE Calculator',p:'/togo/tg-paye'}]
    },
    BJ: {
      name:'Benin', slug:'benin', flag:'🇧🇯', region:'west', capital:'Porto-Novo',
      population:13400000, popGrowth:2.6,
      gdp:19.6e9, gdpPpp:54.3e9, gdpPC:1463, gdpPCppp:4052, gdpGrowth:6.0,
      gdpHist:{1990:1.8e9,2000:2.4e9,2010:6.6e9,2015:9.3e9,2020:15.7e9,2024:19.6e9},
      currency:{code:'XOF',name:'West African CFA Franc',sym:'CFA'},
      resources:[
        {type:'farm',rank:null,prod:'Cotton/cashew',share:3,global:null,note:'Cotton is 80% of export revenue'}
      ],
      exports:[{p:'Raw Cotton',v:1.5e9,s:33},{p:'Cashew Nuts',v:700e6,s:15},{p:'Gold',v:350e6,s:7.7}],
      imports:[{p:'Rice',v:800e6,s:10},{p:'Refined Petroleum',v:700e6,s:8.9},{p:'Cars',v:500e6,s:6.4}],
      totalExports:4.5e9, totalImports:7.9e9,
      hdi:0.504, hdiRank:173, gini:37.8, inflation:2.8, unemployment:1.5,
      debtGdp:54.3, fdi:300e6, electricity:42, internet:34, lifeExp:60.0, literacy:42,
      rrs:28,
      tagline:'Cotton Kingdom and Gateway to the Sahel',
      paradox:'Economy depends on cotton for 80% of exports, extremely vulnerable to commodity shocks.',
      tools:[{n:'Benin PAYE Calculator',p:'/benin/bj-paye'}]
    },
    SL: {
      name:'Sierra Leone', slug:'sierra-leone', flag:'🇸🇱', region:'west', capital:'Freetown',
      population:8600000, popGrowth:2.1,
      gdp:4.2e9, gdpPpp:16.2e9, gdpPC:488, gdpPCppp:1884, gdpGrowth:3.5,
      gdpHist:{1990:0.65e9,2000:0.64e9,2010:2.6e9,2015:4.2e9,2020:4.1e9,2024:4.2e9},
      currency:{code:'SLL',name:'Sierra Leonean Leone',sym:'Le'},
      resources:[
        {type:'diamond',rank:4,prod:'600K carats/yr',share:1.2,global:10,note:'Famous for gem diamonds'},
        {type:'iron',rank:5,prod:'4M tonnes/yr',share:1,global:null,note:'Tonkolili mine'},
        {type:'bauxite',rank:4,prod:'1.3M tonnes/yr',share:0.8,global:13,note:'Sierra Minerals'}
      ],
      exports:[{p:'Iron Ore',v:800e6,s:37},{p:'Diamonds',v:300e6,s:14},{p:'Titanium Ore',v:250e6,s:12},{p:'Bauxite',v:200e6,s:9.3}],
      imports:[{p:'Refined Petroleum',v:500e6,s:16},{p:'Rice',v:400e6,s:13},{p:'Medicines',v:200e6,s:6.5}],
      totalExports:2.15e9, totalImports:3.1e9,
      hdi:0.477, hdiRank:181, gini:35.7, inflation:44.0, unemployment:4.6,
      debtGdp:70.1, fdi:200e6, electricity:26, internet:24, lifeExp:55.9, literacy:43,
      rrs:45,
      tagline:'Blood Diamonds to Peace — A Nation Rebuilding',
      paradox:'Diamonds fueled Africa\'s bloodiest civil war. Two decades later, mineral wealth barely reaches citizens.',
      tools:[{n:'Sierra Leone PAYE',p:'/sierra-leone/sl-paye'}]
    },
    LR: {
      name:'Liberia', slug:'liberia', flag:'🇱🇷', region:'west', capital:'Monrovia',
      population:5300000, popGrowth:2.4,
      gdp:4.0e9, gdpPpp:9.3e9, gdpPC:755, gdpPCppp:1755, gdpGrowth:4.8,
      gdpHist:{1990:0.38e9,2000:0.53e9,2010:1.6e9,2015:3.2e9,2020:3.0e9,2024:4.0e9},
      currency:{code:'LRD',name:'Liberian Dollar',sym:'L$'},
      resources:[
        {type:'iron',rank:4,prod:'5M tonnes/yr',share:1.5,global:null,note:'ArcelorMittal Yekepa mine'},
        {type:'timber',rank:3,prod:'1M m³/yr',share:7,global:null,note:'43% forest cover'}
      ],
      exports:[{p:'Iron Ore',v:600e6,s:36},{p:'Gold',v:400e6,s:24},{p:'Rubber',v:200e6,s:12}],
      imports:[{p:'Refined Petroleum',v:400e6,s:17},{p:'Rice',v:300e6,s:13},{p:'Cement',v:150e6,s:6.4}],
      totalExports:1.65e9, totalImports:2.35e9,
      hdi:0.487, hdiRank:178, gini:35.3, inflation:9.2, unemployment:3.6,
      debtGdp:49.5, fdi:300e6, electricity:28, internet:30, lifeExp:60.7, literacy:48,
      rrs:40,
      tagline:'Africa\'s Oldest Republic, Rebuilding From Ruin',
      paradox:'World\'s largest shipping registry by tonnage, yet own infrastructure is among Africa\'s least developed.',
      tools:[{n:'Liberia PAYE Calculator',p:'/liberia/lr-paye'}]
    },
    GM: {
      name:'Gambia', slug:'gambia', flag:'🇬🇲', region:'west', capital:'Banjul',
      population:2640000, popGrowth:2.9,
      gdp:2.3e9, gdpPpp:7.4e9, gdpPC:871, gdpPCppp:2803, gdpGrowth:5.3,
      gdpHist:{1990:0.30e9,2000:0.42e9,2010:0.95e9,2015:1.4e9,2020:1.8e9,2024:2.3e9},
      currency:{code:'GMD',name:'Gambian Dalasi',sym:'D'},
      resources:[
        {type:'fish',rank:5,prod:'60K tonnes/yr',share:1.4,global:null,note:'Shrimp and cuttlefish exports'},
        {type:'farm',rank:null,prod:'Groundnuts: 200K tonnes/yr',share:3,global:null,note:'Primary cash crop'}
      ],
      exports:[{p:'Groundnuts',v:100e6,s:20},{p:'Fish',v:80e6,s:16},{p:'Cashew Nuts',v:50e6,s:10}],
      imports:[{p:'Refined Petroleum',v:200e6,s:16},{p:'Rice',v:120e6,s:9.6},{p:'Sugar',v:80e6,s:6.4}],
      totalExports:500e6, totalImports:1.25e9,
      hdi:0.500, hdiRank:174, gini:35.9, inflation:17.0, unemployment:11.2,
      debtGdp:83.0, fdi:80e6, electricity:62, internet:40, lifeExp:62.6, literacy:51,
      rrs:18,
      tagline:'The Smiling Coast Where the River Runs Deep',
      paradox:'Africa\'s smallest mainland country receives 500K tourists/yr — 20% of GDP from tourism.',
      tools:[{n:'Gambia PAYE Calculator',p:'/gambia/gm-paye'}]
    },
    GW: {
      name:'Guinea-Bissau', slug:'guinea-bissau', flag:'🇬🇼', region:'west', capital:'Bissau',
      population:2100000, popGrowth:2.4,
      gdp:1.9e9, gdpPpp:5.1e9, gdpPC:905, gdpPCppp:2429, gdpGrowth:4.5,
      gdpHist:{1990:0.24e9,2000:0.34e9,2010:0.85e9,2015:1.2e9,2020:1.5e9,2024:1.9e9},
      currency:{code:'XOF',name:'West African CFA Franc',sym:'CFA'},
      resources:[
        {type:'farm',rank:null,prod:'Cashew: 200K tonnes/yr',share:10,global:5,note:'Cashew nuts = 90% of export earnings'}
      ],
      exports:[{p:'Cashew Nuts',v:250e6,s:76},{p:'Fish',v:40e6,s:12}],
      imports:[{p:'Refined Petroleum',v:120e6,s:16},{p:'Rice',v:100e6,s:13}],
      totalExports:330e6, totalImports:750e6,
      hdi:0.483, hdiRank:179, gini:34.8, inflation:6.0, unemployment:6.8,
      debtGdp:78.5, fdi:20e6, electricity:35, internet:22, lifeExp:59.4, literacy:46,
      rrs:22,
      tagline:'The Cashew Capital Trapped by Instability',
      paradox:'90% of export income from raw cashew nuts, yet processes less than 5% domestically.',
      tools:[{n:'Guinea-Bissau PAYE',p:'/guinea-bissau/gw-paye'}]
    },
    CV: {
      name:'Cape Verde', slug:'cape-verde', flag:'🇨🇻', region:'west', capital:'Praia',
      population:598000, popGrowth:1.0,
      gdp:2.5e9, gdpPpp:5.1e9, gdpPC:4181, gdpPCppp:8528, gdpGrowth:5.1,
      gdpHist:{1990:0.34e9,2000:0.54e9,2010:1.7e9,2015:1.7e9,2020:1.7e9,2024:2.5e9},
      currency:{code:'CVE',name:'Cape Verdean Escudo',sym:'$'},
      resources:[
        {type:'fish',rank:4,prod:'30K tonnes/yr',share:0.7,global:null,note:'Tuna and lobster'}
      ],
      exports:[{p:'Canned Fish',v:120e6,s:40},{p:'Fish Fillets',v:60e6,s:20},{p:'Clothing',v:30e6,s:10}],
      imports:[{p:'Refined Petroleum',v:200e6,s:14},{p:'Food Products',v:180e6,s:13},{p:'Machinery',v:100e6,s:7.1}],
      totalExports:300e6, totalImports:1.4e9,
      hdi:0.662, hdiRank:128, gini:42.4, inflation:3.2, unemployment:12.4,
      debtGdp:125.0, fdi:100e6, electricity:95, internet:70, lifeExp:74.1, literacy:87,
      rrs:12,
      tagline:'The Atlantic Islands That Defied Geography',
      paradox:'No natural resources and imports 80% of food, yet achieved middle-income status through tourism and good governance.',
      tools:[{n:'Cape Verde PAYE',p:'/cape-verde/cv-paye'}]
    },
    MR: {
      name:'Mauritania', slug:'mauritania', flag:'🇲🇷', region:'west', capital:'Nouakchott',
      population:4900000, popGrowth:2.7,
      gdp:10.4e9, gdpPpp:31.6e9, gdpPC:2122, gdpPCppp:6449, gdpGrowth:4.8,
      gdpHist:{1990:1.0e9,2000:1.1e9,2010:4.8e9,2015:5.1e9,2020:8.1e9,2024:10.4e9},
      currency:{code:'MRU',name:'Mauritanian Ouguiya',sym:'UM'},
      resources:[
        {type:'iron',rank:1,prod:'13M tonnes/yr',share:10,global:15,note:'SNIM Zouérat mines'},
        {type:'gold',rank:5,prod:'30 tonnes/yr',share:6.2,global:null,note:'Tasiast mine'},
        {type:'fish',rank:1,prod:'900K tonnes/yr',share:20,global:20,note:'Richest fishing grounds — Atlantic upwelling zone'},
        {type:'copper',rank:4,prod:'35K tonnes/yr',share:2,global:null,note:'Guelb Moghrein mine'}
      ],
      exports:[{p:'Iron Ore',v:2.2e9,s:33},{p:'Gold',v:1.8e9,s:27},{p:'Fish',v:1.5e9,s:23},{p:'Copper',v:400e6,s:6}],
      imports:[{p:'Refined Petroleum',v:1.1e9,s:17},{p:'Wheat',v:400e6,s:6.2},{p:'Machinery',v:350e6,s:5.4}],
      totalExports:6.6e9, totalImports:6.5e9,
      hdi:0.540, hdiRank:161, gini:32.6, inflation:5.0, unemployment:11.3,
      debtGdp:48.7, fdi:1.2e9, electricity:47, internet:40, lifeExp:64.4, literacy:53,
      rrs:60,
      tagline:'Where the Sahara Meets the Atlantic\'s Richest Waters',
      paradox:'Atlantic coast is among the world\'s most productive fishing zones, yet foreign fleets capture most of the catch.',
      tools:[{n:'Mauritania PAYE',p:'/mauritania/mr-paye'}]
    },

    // ========== EAST AFRICA (15) ==========
    KE: {
      name:'Kenya', slug:'kenya', flag:'🇰🇪', region:'east', capital:'Nairobi',
      population:55100000, popGrowth:1.7,
      gdp:113e9, gdpPpp:315e9, gdpPC:2050, gdpPCppp:5720, gdpGrowth:5.6,
      gdpHist:{1990:8.6e9,2000:12.7e9,2010:40e9,2015:63.8e9,2020:100.7e9,2024:113e9},
      currency:{code:'KES',name:'Kenyan Shilling',sym:'KSh'},
      resources:[
        {type:'farm',rank:3,prod:'Tea, flowers, coffee',share:26,global:1,note:'World\'s largest tea exporter'},
        {type:'coffee',rank:5,prod:'50K tonnes/yr',share:4,global:null,note:'Premium Arabica from highlands'},
        {type:'fish',rank:6,prod:'148K tonnes/yr',share:3,global:null,note:'Lake Victoria & Indian Ocean'}
      ],
      exports:[{p:'Tea',v:1.5e9,s:19},{p:'Cut Flowers',v:1.1e9,s:14},{p:'Coffee',v:300e6,s:4},{p:'Vegetables',v:400e6,s:5},{p:'Petroleum Products',v:600e6,s:8}],
      imports:[{p:'Petroleum',v:4.5e9,s:22},{p:'Machinery',v:2.8e9,s:14},{p:'Iron & Steel',v:1.5e9,s:7},{p:'Vehicles',v:1.2e9,s:6},{p:'Cereals',v:900e6,s:4}],
      totalExports:7.8e9, totalImports:20.5e9,
      hdi:0.575, hdiRank:152, gini:40.8, inflation:6.9, unemployment:5.7,
      debtGdp:68.5, fdi:1.3e9, electricity:75, internet:40, lifeExp:61.4, literacy:81.5,
      rrs:42,
      tagline:'East Africa\'s Innovation and Financial Hub',
      paradox:'M-Pesa revolutionized mobile money yet 36% live below the poverty line.',
      tools:[{n:'Kenya PAYE Calculator',p:'/kenya/ke-paye'}]
    },
    TZ: {
      name:'Tanzania', slug:'tanzania', flag:'🇹🇿', region:'east', capital:'Dodoma',
      population:65500000, popGrowth:2.9,
      gdp:79e9, gdpPpp:218e9, gdpPC:1200, gdpPCppp:3330, gdpGrowth:5.1,
      gdpHist:{1990:4.3e9,2000:10.2e9,2010:31.4e9,2015:47.4e9,2020:62.4e9,2024:79e9},
      currency:{code:'TZS',name:'Tanzanian Shilling',sym:'TSh'},
      resources:[
        {type:'gold',rank:4,prod:'50 tonnes/yr',share:10,global:null,note:'Geita, Bulyanhulu mines'},
        {type:'gas',rank:5,prod:'57 TCF reserves',share:0,global:null,note:'Deep-sea discoveries'},
        {type:'diamond',rank:3,prod:'Tanzanite unique',share:0,global:null,note:'Only source of tanzanite on Earth'},
        {type:'farm',rank:4,prod:'Cashews, tobacco, coffee',share:24,global:null,note:'Agriculture employs 65%'}
      ],
      exports:[{p:'Gold',v:2.9e9,s:30},{p:'Tobacco',v:500e6,s:5},{p:'Cashew Nuts',v:400e6,s:4},{p:'Coffee',v:300e6,s:3},{p:'Precious Stones',v:600e6,s:6}],
      imports:[{p:'Petroleum',v:2.8e9,s:18},{p:'Machinery',v:1.9e9,s:12},{p:'Iron & Steel',v:1.2e9,s:8},{p:'Vehicles',v:1.4e9,s:9}],
      totalExports:9.7e9, totalImports:15.5e9,
      hdi:0.549, hdiRank:160, gini:40.5, inflation:4.4, unemployment:2.6,
      debtGdp:42.3, fdi:1.1e9, electricity:42, internet:32, lifeExp:66.2, literacy:77.9,
      rrs:55,
      tagline:'Gold, Gas and Safari Giant of East Africa',
      paradox:'Hosts Kilimanjaro and unique tanzanite yet remains one of the least developed nations.',
      tools:[{n:'Tanzania PAYE',p:'/tanzania/tz-paye'}]
    },
    ET: {
      name:'Ethiopia', slug:'ethiopia', flag:'🇪🇹', region:'east', capital:'Addis Ababa',
      population:126500000, popGrowth:2.5,
      gdp:156e9, gdpPpp:393e9, gdpPC:1230, gdpPCppp:3110, gdpGrowth:6.1,
      gdpHist:{1990:7.3e9,2000:8.2e9,2010:29.9e9,2015:64.6e9,2020:107.6e9,2024:156e9},
      currency:{code:'ETB',name:'Ethiopian Birr',sym:'Br'},
      resources:[
        {type:'coffee',rank:1,prod:'500K tonnes/yr',share:30,global:5,note:'Birthplace of Arabica coffee'},
        {type:'gold',rank:6,prod:'12 tonnes/yr',share:12,global:null,note:'Expanding mining sector'},
        {type:'farm',rank:2,prod:'Flowers, oilseeds, pulses',share:35,global:2,note:'Agriculture employs 70%'}
      ],
      exports:[{p:'Coffee',v:1.4e9,s:30},{p:'Oilseeds',v:600e6,s:13},{p:'Cut Flowers',v:550e6,s:12},{p:'Khat',v:400e6,s:9},{p:'Gold',v:350e6,s:7}],
      imports:[{p:'Petroleum',v:3.5e9,s:19},{p:'Machinery',v:3.2e9,s:17},{p:'Vehicles',v:2.1e9,s:11},{p:'Iron & Steel',v:1.5e9,s:8}],
      totalExports:4.7e9, totalImports:18.5e9,
      hdi:0.498, hdiRank:175, gini:35.0, inflation:28.7, unemployment:3.5,
      debtGdp:37.8, fdi:3.3e9, electricity:54, internet:25, lifeExp:65.0, literacy:51.8,
      rrs:38,
      tagline:'Africa\'s Second-Most Populous Nation and Coffee Birthplace',
      paradox:'One of Africa\'s fastest-growing economies yet massive trade deficit and only 52% literacy.',
      tools:[{n:'Ethiopia PAYE Calculator',p:'/ethiopia/et-paye'}]
    },
    UG: {
      name:'Uganda', slug:'uganda', flag:'🇺🇬', region:'east', capital:'Kampala',
      population:48600000, popGrowth:3.0,
      gdp:50e9, gdpPpp:130e9, gdpPC:1030, gdpPCppp:2670, gdpGrowth:5.3,
      gdpHist:{1990:4.3e9,2000:6.2e9,2010:20.2e9,2015:30.5e9,2020:37.4e9,2024:50e9},
      currency:{code:'UGX',name:'Ugandan Shilling',sym:'USh'},
      resources:[
        {type:'oil',rank:7,prod:'6.5B barrels reserves',share:0,global:null,note:'Lake Albert basin, production expected 2025'},
        {type:'coffee',rank:2,prod:'380K tonnes/yr',share:20,global:null,note:'Major Robusta producer'},
        {type:'gold',rank:5,prod:'Trade hub',share:40,global:null,note:'Significant gold re-export trade'}
      ],
      exports:[{p:'Gold',v:2.5e9,s:40},{p:'Coffee',v:900e6,s:14},{p:'Fish Products',v:200e6,s:3},{p:'Tea',v:100e6,s:2}],
      imports:[{p:'Petroleum',v:1.8e9,s:18},{p:'Machinery',v:1.2e9,s:12},{p:'Vehicles',v:900e6,s:9},{p:'Iron & Steel',v:800e6,s:8}],
      totalExports:6.3e9, totalImports:10.2e9,
      hdi:0.525, hdiRank:166, gini:42.7, inflation:5.4, unemployment:2.8,
      debtGdp:48.4, fdi:1.5e9, electricity:47, internet:26, lifeExp:62.7, literacy:76.5,
      rrs:48,
      tagline:'Pearl of Africa with Untapped Oil Wealth',
      paradox:'Sitting on 6.5B barrels of oil yet remains one of the world\'s poorest countries.',
      tools:[{n:'Uganda PAYE Calculator',p:'/uganda/ug-paye'}]
    },
    RW: {
      name:'Rwanda', slug:'rwanda', flag:'🇷🇼', region:'east', capital:'Kigali',
      population:14100000, popGrowth:2.3,
      gdp:14e9, gdpPpp:38e9, gdpPC:990, gdpPCppp:2690, gdpGrowth:8.2,
      gdpHist:{1990:2.5e9,2000:1.7e9,2010:5.8e9,2015:8.3e9,2020:10.3e9,2024:14e9},
      currency:{code:'RWF',name:'Rwandan Franc',sym:'FRw'},
      resources:[
        {type:'coltan',rank:2,prod:'700 tonnes/yr',share:10,global:2,note:'Critical for electronics'},
        {type:'mineral',rank:4,prod:'Tin, tungsten (3Ts)',share:25,global:null,note:'Conflict-free certified'},
        {type:'coffee',rank:6,prod:'22K tonnes/yr',share:15,global:null,note:'Award-winning Arabica'}
      ],
      exports:[{p:'Gold',v:450e6,s:23},{p:'Tin Ore',v:200e6,s:10},{p:'Coffee',v:180e6,s:9},{p:'Tea',v:120e6,s:6},{p:'Coltan',v:100e6,s:5}],
      imports:[{p:'Petroleum',v:500e6,s:14},{p:'Machinery',v:400e6,s:11},{p:'Iron & Steel',v:300e6,s:8},{p:'Vehicles',v:350e6,s:10}],
      totalExports:1.9e9, totalImports:3.6e9,
      hdi:0.534, hdiRank:165, gini:43.7, inflation:11.2, unemployment:15.6,
      debtGdp:66.2, fdi:400e6, electricity:49, internet:33, lifeExp:66.1, literacy:73.2,
      rrs:35,
      tagline:'Africa\'s Cleanest City and Digital Governance Leader',
      paradox:'Transformed from genocide to Africa\'s fastest reformer yet 50% still in subsistence farming.',
      tools:[{n:'Rwanda PAYE Calculator',p:'/rwanda/rw-paye'}]
    },
    MZ: {
      name:'Mozambique', slug:'mozambique', flag:'🇲🇿', region:'east', capital:'Maputo',
      population:33900000, popGrowth:2.7,
      gdp:19e9, gdpPpp:48e9, gdpPC:560, gdpPCppp:1420, gdpGrowth:4.2,
      gdpHist:{1990:2.5e9,2000:4.3e9,2010:10.2e9,2015:14.8e9,2020:14e9,2024:19e9},
      currency:{code:'MZN',name:'Mozambican Metical',sym:'MT'},
      resources:[
        {type:'gas',rank:2,prod:'127+ TCF reserves',share:0,global:3,note:'Rovuma Basin LNG mega-projects'},
        {type:'coal',rank:2,prod:'8M tonnes/yr',share:20,global:null,note:'Tete Province coking coal'},
        {type:'mineral',rank:5,prod:'Rubies, graphite, titanium',share:0,global:null,note:'World-class ruby deposits at Montepuez'}
      ],
      exports:[{p:'Coal',v:1.3e9,s:22},{p:'Aluminium',v:1.1e9,s:19},{p:'Natural Gas',v:500e6,s:9},{p:'Prawns',v:250e6,s:4}],
      imports:[{p:'Petroleum',v:1.5e9,s:17},{p:'Machinery',v:1.2e9,s:13},{p:'Vehicles',v:800e6,s:9}],
      totalExports:5.8e9, totalImports:9e9,
      hdi:0.461, hdiRank:183, gini:54.0, inflation:7.1, unemployment:3.5,
      debtGdp:100.2, fdi:5.1e9, electricity:35, internet:17, lifeExp:59.3, literacy:63.4,
      rrs:58,
      tagline:'Africa\'s Next LNG Superpower',
      paradox:'Holds 127+ TCF of gas worth hundreds of billions yet 74% live on under $2/day.',
      tools:[{n:'Mozambique PAYE',p:'/mozambique/mz-paye'}]
    },
    MG: {
      name:'Madagascar', slug:'madagascar', flag:'🇲🇬', region:'east', capital:'Antananarivo',
      population:30300000, popGrowth:2.4,
      gdp:16e9, gdpPpp:53e9, gdpPC:530, gdpPCppp:1750, gdpGrowth:4.0,
      gdpHist:{1990:3.1e9,2000:3.9e9,2010:8.7e9,2015:10.2e9,2020:13.1e9,2024:16e9},
      currency:{code:'MGA',name:'Malagasy Ariary',sym:'Ar'},
      resources:[
        {type:'mineral',rank:3,prod:'Nickel, cobalt, ilmenite',share:35,global:null,note:'Ambatovy — world\'s largest nickel laterite mines'},
        {type:'farm',rank:2,prod:'Vanilla (80%+ global)',share:80,global:1,note:'Dominates global vanilla market'},
        {type:'cobalt',rank:3,prod:'3500 tonnes/yr',share:5,global:null,note:'Nickel mining by-product'}
      ],
      exports:[{p:'Vanilla',v:600e6,s:18},{p:'Nickel & Cobalt',v:800e6,s:24},{p:'Cloves',v:250e6,s:8},{p:'Clothing',v:500e6,s:15}],
      imports:[{p:'Petroleum',v:1.1e9,s:18},{p:'Rice',v:400e6,s:7},{p:'Machinery',v:600e6,s:10}],
      totalExports:3.3e9, totalImports:5.9e9,
      hdi:0.487, hdiRank:177, gini:42.6, inflation:9.9, unemployment:1.8,
      debtGdp:53.4, fdi:400e6, electricity:34, internet:22, lifeExp:64.5, literacy:76.7,
      rrs:52,
      tagline:'Island of Vanilla and Unique Biodiversity',
      paradox:'Supplies 80%+ of world\'s vanilla yet is among the poorest countries.',
      tools:[{n:'Madagascar PAYE',p:'/madagascar/mg-paye'}]
    },
    ZM: {
      name:'Zambia', slug:'zambia', flag:'🇿🇲', region:'east', capital:'Lusaka',
      population:20600000, popGrowth:2.8,
      gdp:29e9, gdpPpp:75e9, gdpPC:1410, gdpPCppp:3640, gdpGrowth:4.3,
      gdpHist:{1990:3.3e9,2000:3.6e9,2010:20.3e9,2015:21.2e9,2020:18.1e9,2024:29e9},
      currency:{code:'ZMW',name:'Zambian Kwacha',sym:'ZK'},
      resources:[
        {type:'copper',rank:2,prod:'830K tonnes/yr',share:70,global:7,note:'Copperbelt Province'},
        {type:'cobalt',rank:2,prod:'5000 tonnes/yr',share:5,global:4,note:'Major cobalt by-product'}
      ],
      exports:[{p:'Copper',v:8.5e9,s:70},{p:'Cobalt',v:400e6,s:3},{p:'Gold',v:300e6,s:2}],
      imports:[{p:'Machinery',v:1.5e9,s:16},{p:'Petroleum',v:1.3e9,s:14},{p:'Vehicles',v:800e6,s:9}],
      totalExports:12.2e9, totalImports:9.3e9,
      hdi:0.565, hdiRank:154, gini:57.1, inflation:10.3, unemployment:5.3,
      debtGdp:77.8, fdi:1.6e9, electricity:47, internet:27, lifeExp:61.2, literacy:86.7,
      rrs:62,
      tagline:'Africa\'s Copper Heartland',
      paradox:'World\'s #7 copper producer earning billions yet 54% live in poverty.',
      tools:[{n:'Zambia PAYE Calculator',p:'/zambia/zm-paye'}]
    },
    ZW: {
      name:'Zimbabwe', slug:'zimbabwe', flag:'🇿🇼', region:'east', capital:'Harare',
      population:16300000, popGrowth:1.5,
      gdp:24e9, gdpPpp:42e9, gdpPC:1470, gdpPCppp:2580, gdpGrowth:3.5,
      gdpHist:{1990:8.8e9,2000:6.7e9,2010:12e9,2015:19.8e9,2020:18.4e9,2024:24e9},
      currency:{code:'ZWL',name:'Zimbabwe Gold (ZiG)',sym:'ZiG'},
      resources:[
        {type:'platinum',rank:2,prod:'15 tonnes/yr',share:12,global:2,note:'Great Dyke deposits'},
        {type:'diamond',rank:5,prod:'3.5M carats/yr',share:4,global:null,note:'Marange fields'},
        {type:'gold',rank:3,prod:'35 tonnes/yr',share:25,global:null,note:'Historically major producer'},
        {type:'chromium',rank:2,prod:'1.3M tonnes ore/yr',share:10,global:3,note:'Great Dyke chromite'},
        {type:'lithium',rank:1,prod:'Bikita & Arcadia',share:0,global:null,note:'Africa\'s top lithium deposit'}
      ],
      exports:[{p:'Gold',v:2.5e9,s:26},{p:'Tobacco',v:900e6,s:9},{p:'Platinum',v:1.2e9,s:12},{p:'Diamonds',v:400e6,s:4},{p:'Ferrochrome',v:500e6,s:5}],
      imports:[{p:'Petroleum',v:1.5e9,s:15},{p:'Machinery',v:1.2e9,s:12},{p:'Chemicals',v:800e6,s:8}],
      totalExports:9.7e9, totalImports:10.1e9,
      hdi:0.550, hdiRank:159, gini:44.3, inflation:47.6, unemployment:16.5,
      debtGdp:97.1, fdi:350e6, electricity:53, internet:35, lifeExp:59.3, literacy:89.7,
      rrs:68,
      tagline:'Mineral-Rich Land of Platinum, Lithium and the Great Dyke',
      paradox:'Holds Africa\'s largest lithium reserves and #2 platinum yet hyperinflation devastates living standards.',
      tools:[{n:'Zimbabwe PAYE',p:'/zimbabwe/zw-paye'}]
    },
    MW: {
      name:'Malawi', slug:'malawi', flag:'🇲🇼', region:'east', capital:'Lilongwe',
      population:20900000, popGrowth:2.6,
      gdp:13e9, gdpPpp:35e9, gdpPC:620, gdpPCppp:1670, gdpGrowth:2.0,
      gdpHist:{1990:1.9e9,2000:1.7e9,2010:5.4e9,2015:6.4e9,2020:12.1e9,2024:13e9},
      currency:{code:'MWK',name:'Malawian Kwacha',sym:'MK'},
      resources:[
        {type:'uranium',rank:3,prod:'Kayelekera (suspended)',share:0,global:null,note:'Kayelekera uranium deposit'},
        {type:'farm',rank:8,prod:'Tobacco, tea, sugar',share:30,global:1,note:'#1 Africa burley tobacco'}
      ],
      exports:[{p:'Tobacco',v:700e6,s:50},{p:'Tea',v:110e6,s:8},{p:'Sugar',v:100e6,s:7}],
      imports:[{p:'Petroleum',v:500e6,s:17},{p:'Fertilizers',v:300e6,s:10},{p:'Machinery',v:350e6,s:12}],
      totalExports:1.4e9, totalImports:3e9,
      hdi:0.508, hdiRank:172, gini:38.5, inflation:28.6, unemployment:5.7,
      debtGdp:65.4, fdi:100e6, electricity:15, internet:13, lifeExp:62.9, literacy:62.1,
      rrs:22,
      tagline:'Warm Heart of Africa Built on Tobacco and Tea',
      paradox:'Tobacco = 50% of exports yet contributes to deforestation and health crises.',
      tools:[{n:'Malawi PAYE Calculator',p:'/malawi/mw-paye'}]
    },
    SO: {
      name:'Somalia', slug:'somalia', flag:'🇸🇴', region:'east', capital:'Mogadishu',
      population:18100000, popGrowth:2.9,
      gdp:8.1e9, gdpPpp:24e9, gdpPC:450, gdpPCppp:1330, gdpGrowth:3.7,
      gdpHist:{1990:1.5e9,2000:1.1e9,2010:4.6e9,2015:6.2e9,2020:7e9,2024:8.1e9},
      currency:{code:'SOS',name:'Somali Shilling',sym:'SSh'},
      resources:[
        {type:'fish',rank:2,prod:'3025 km coastline',share:0,global:null,note:'One of Africa\'s longest coastlines'},
        {type:'farm',rank:10,prod:'Livestock, bananas',share:65,global:1,note:'Largest camel herding economy'}
      ],
      exports:[{p:'Livestock',v:600e6,s:40},{p:'Bananas',v:80e6,s:5},{p:'Charcoal',v:100e6,s:7}],
      imports:[{p:'Cereals',v:500e6,s:13},{p:'Sugar',v:400e6,s:10},{p:'Petroleum',v:600e6,s:15}],
      totalExports:1.5e9, totalImports:3.9e9,
      hdi:0.380, hdiRank:192, gini:36.8, inflation:6.1, unemployment:19.8,
      debtGdp:38.2, fdi:470e6, electricity:18, internet:12, lifeExp:55.4, literacy:40.0,
      rrs:25,
      tagline:'Pastoralist Nation with the World\'s Largest Camel Economy',
      paradox:'Strategic Horn of Africa with 3000+ km coastline yet decades of conflict block development.',
      tools:[{n:'Somalia PAYE',p:'/somalia/so-paye'}]
    },
    BI: {
      name:'Burundi', slug:'burundi', flag:'🇧🇮', region:'east', capital:'Gitega',
      population:13200000, popGrowth:2.7,
      gdp:3.6e9, gdpPpp:11e9, gdpPC:270, gdpPCppp:830, gdpGrowth:3.3,
      gdpHist:{1990:1.1e9,2000:0.7e9,2010:2e9,2015:2.8e9,2020:2.8e9,2024:3.6e9},
      currency:{code:'BIF',name:'Burundian Franc',sym:'FBu'},
      resources:[
        {type:'coltan',rank:4,prod:'Small-scale',share:0,global:null,note:'Artisanal coltan mining'},
        {type:'coffee',rank:4,prod:'15K tonnes/yr',share:60,global:null,note:'Coffee is economic lifeblood'}
      ],
      exports:[{p:'Coffee',v:80e6,s:53},{p:'Tea',v:30e6,s:20},{p:'Gold',v:15e6,s:10}],
      imports:[{p:'Petroleum',v:200e6,s:20},{p:'Machinery',v:150e6,s:15},{p:'Vehicles',v:120e6,s:12}],
      totalExports:150e6, totalImports:1e9,
      hdi:0.426, hdiRank:187, gini:38.6, inflation:26.9, unemployment:1.4,
      debtGdp:66.3, fdi:10e6, electricity:12, internet:8, lifeExp:61.6, literacy:68.4,
      rrs:18,
      tagline:'Coffee-Dependent Heart of the Great Lakes',
      paradox:'Premium Arabica brings $5/cup abroad yet farmers earn under $1/day.',
      tools:[{n:'Burundi PAYE Calculator',p:'/burundi/bi-paye'}]
    },
    DJ: {
      name:'Djibouti', slug:'djibouti', flag:'🇩🇯', region:'east', capital:'Djibouti',
      population:1100000, popGrowth:1.4,
      gdp:4e9, gdpPpp:7e9, gdpPC:3640, gdpPCppp:6370, gdpGrowth:6.0,
      gdpHist:{1990:0.5e9,2000:0.6e9,2010:1.1e9,2015:2e9,2020:3.3e9,2024:4e9},
      currency:{code:'DJF',name:'Djiboutian Franc',sym:'Fdj'},
      resources:[
        {type:'mineral',rank:12,prod:'Salt, geothermal',share:0,global:null,note:'Lac Assal salt deposits'}
      ],
      exports:[{p:'Re-exports',v:200e6,s:45},{p:'Hides & Skins',v:25e6,s:6}],
      imports:[{p:'Food & Beverages',v:500e6,s:22},{p:'Petroleum',v:400e6,s:17}],
      totalExports:440e6, totalImports:2.3e9,
      hdi:0.509, hdiRank:171, gini:41.6, inflation:3.5, unemployment:26.3,
      debtGdp:68.3, fdi:200e6, electricity:65, internet:59, lifeExp:62.3, literacy:70.0,
      rrs:12,
      tagline:'Strategic Red Sea Gateway Hosting Foreign Military Bases',
      paradox:'Hosts US, China, France and Japan military bases yet 21% live in extreme poverty.',
      tools:[{n:'Djibouti PAYE',p:'/djibouti/dj-paye'}]
    },
    ER: {
      name:'Eritrea', slug:'eritrea', flag:'🇪🇷', region:'east', capital:'Asmara',
      population:3700000, popGrowth:1.2,
      gdp:2.6e9, gdpPpp:7.5e9, gdpPC:700, gdpPCppp:2030, gdpGrowth:2.9,
      gdpHist:{1990:0.5e9,2000:0.6e9,2010:2.1e9,2015:2.6e9,2020:2.1e9,2024:2.6e9},
      currency:{code:'ERN',name:'Eritrean Nakfa',sym:'Nfk'},
      resources:[
        {type:'gold',rank:8,prod:'Bisha mine 5+ tonnes/yr',share:30,global:null,note:'Bisha gold-copper-zinc mines'},
        {type:'copper',rank:6,prod:'Bisha mine',share:25,global:null,note:'Copper-zinc at Bisha'}
      ],
      exports:[{p:'Gold',v:300e6,s:35},{p:'Zinc & Copper',v:200e6,s:24},{p:'Livestock',v:50e6,s:6}],
      imports:[{p:'Machinery',v:250e6,s:18},{p:'Petroleum',v:200e6,s:14},{p:'Food & Cereals',v:300e6,s:21}],
      totalExports:850e6, totalImports:1.4e9,
      hdi:0.492, hdiRank:176, gini:null, inflation:5.0, unemployment:6.5,
      debtGdp:165.1, fdi:50e6, electricity:52, internet:8, lifeExp:66.3, literacy:76.6,
      rrs:32,
      tagline:'Red Sea Mining Frontier with Potash Potential',
      paradox:'Major gold and copper mines yet isolation keeps development frozen.',
      tools:[{n:'Eritrea PAYE',p:'/eritrea/er-paye'}]
    },
    SS: {
      name:'South Sudan', slug:'south-sudan', flag:'🇸🇸', region:'east', capital:'Juba',
      population:11400000, popGrowth:1.2,
      gdp:5.3e9, gdpPpp:19e9, gdpPC:470, gdpPCppp:1670, gdpGrowth:-0.6,
      gdpHist:{1990:0,2000:0,2010:0,2015:9.8e9,2020:3.6e9,2024:5.3e9},
      currency:{code:'SSP',name:'South Sudanese Pound',sym:'SSP'},
      resources:[
        {type:'oil',rank:3,prod:'150K bpd',share:3,global:null,note:'Third-largest oil reserves in Sub-Saharan Africa'}
      ],
      exports:[{p:'Crude Oil',v:4.2e9,s:91},{p:'Gold',v:100e6,s:2}],
      imports:[{p:'Food & Cereals',v:800e6,s:25},{p:'Petroleum Products',v:600e6,s:19}],
      totalExports:4.6e9, totalImports:3.2e9,
      hdi:0.381, hdiRank:191, gini:44.1, inflation:13.2, unemployment:12.7,
      debtGdp:52.6, fdi:200e6, electricity:8, internet:8, lifeExp:55.0, literacy:34.5,
      rrs:45,
      tagline:'World\'s Newest Nation Built on Oil',
      paradox:'Oil is 90%+ of revenue yet civil conflict has displaced 4 million people.',
      tools:[{n:'South Sudan PAYE',p:'/south-sudan/ss-paye'}]
    },

    // ========== SOUTHERN AFRICA (6) ==========
    ZA: {
      name:'South Africa', slug:'south-africa', flag:'🇿🇦', region:'south', capital:'Pretoria',
      population:60400000, popGrowth:0.8,
      gdp:373e9, gdpPpp:953e9, gdpPC:6170, gdpPCppp:15780, gdpGrowth:0.6,
      gdpHist:{1990:112e9,2000:132e9,2010:375e9,2015:317e9,2020:301e9,2024:373e9},
      currency:{code:'ZAR',name:'South African Rand',sym:'R'},
      resources:[
        {type:'gold',rank:1,prod:'100 tonnes/yr',share:28,global:6,note:'Witwatersrand Basin, deepest mines globally'},
        {type:'platinum',rank:1,prod:'130 tonnes/yr',share:72,global:70,note:'Bushveld Complex holds 80% of world reserves'},
        {type:'chromium',rank:1,prod:'18M tonnes/yr',share:70,global:44,note:'Largest chromite reserves globally'},
        {type:'manganese',rank:1,prod:'7.2M tonnes/yr',share:55,global:36,note:'Kalahari Manganese Field'},
        {type:'coal',rank:1,prod:'248M tonnes/yr',share:48,global:3,note:'Mpumalanga coalfields'},
        {type:'diamond',rank:4,prod:'7.2M carats/yr',share:8,global:5,note:'Kimberley, Cullinan heritage mines'},
        {type:'iron',rank:2,prod:'61M tonnes/yr',share:15,global:2,note:'Sishen & Kumba mines'}
      ],
      exports:[{p:'Platinum Group Metals',v:22.1e9,s:20.5},{p:'Gold',v:11.8e9,s:10.9},{p:'Iron Ore',v:10.2e9,s:9.4},{p:'Coal',v:9.8e9,s:9.1},{p:'Motor Vehicles',v:8.9e9,s:8.2}],
      imports:[{p:'Refined Petroleum',v:12.6e9,s:11.8},{p:'Crude Petroleum',v:9.3e9,s:8.7},{p:'Motor Vehicles',v:7.1e9,s:6.6},{p:'Machinery',v:6.8e9,s:6.4}],
      totalExports:108e9, totalImports:107e9,
      hdi:0.713, hdiRank:109, gini:63.0, inflation:4.4, unemployment:32.9,
      debtGdp:73.0, fdi:9.1e9, electricity:86, internet:72, lifeExp:62.3, literacy:95,
      rrs:92,
      tagline:'Africa\'s Most Industrialized Economy and Mineral Superpower',
      paradox:'Holds 70% of global platinum yet 32.9% unemployment — the most unequal country by Gini.',
      tools:[{n:'South Africa PAYE',p:'/south-africa/za-paye'}]
    },
    BW: {
      name:'Botswana', slug:'botswana', flag:'🇧🇼', region:'south', capital:'Gaborone',
      population:2630000, popGrowth:1.5,
      gdp:19.4e9, gdpPpp:47.2e9, gdpPC:7380, gdpPCppp:17950, gdpGrowth:3.2,
      gdpHist:{1990:3.8e9,2000:5.6e9,2010:13.7e9,2015:13.2e9,2020:15.1e9,2024:19.4e9},
      currency:{code:'BWP',name:'Botswana Pula',sym:'P'},
      resources:[
        {type:'diamond',rank:1,prod:'25M carats/yr',share:28,global:17,note:'Jwaneng — richest diamond mine by value globally'}
      ],
      exports:[{p:'Diamonds',v:6.5e9,s:82},{p:'Copper-Nickel',v:400e6,s:5},{p:'Beef',v:200e6,s:2.5}],
      imports:[{p:'Refined Petroleum',v:1.1e9,s:14},{p:'Machinery',v:800e6,s:10},{p:'Motor Vehicles',v:700e6,s:8.8}],
      totalExports:7.9e9, totalImports:7.9e9,
      hdi:0.693, hdiRank:117, gini:53.3, inflation:3.2, unemployment:26.0,
      debtGdp:22.0, fdi:300e6, electricity:72, internet:76, lifeExp:61.1, literacy:88,
      rrs:72,
      tagline:'Diamond-Fueled Success Story and Africa\'s Governance Exemplar',
      paradox:'Transformed from one of the poorest nations to upper-middle income via diamonds, yet HIV prevalence remains among world\'s highest.',
      tools:[{n:'Botswana PAYE',p:'/botswana/bw-paye'}]
    },
    NA: {
      name:'Namibia', slug:'namibia', flag:'🇳🇦', region:'south', capital:'Windhoek',
      population:2600000, popGrowth:1.8,
      gdp:12.4e9, gdpPpp:28.7e9, gdpPC:4770, gdpPCppp:11040, gdpGrowth:3.0,
      gdpHist:{1990:2.4e9,2000:3.9e9,2010:11.3e9,2015:11.7e9,2020:10.6e9,2024:12.4e9},
      currency:{code:'NAD',name:'Namibian Dollar',sym:'N$'},
      resources:[
        {type:'uranium',rank:1,prod:'5600 tonnes/yr',share:55,global:11,note:'Rössing & Husab — two of world\'s largest uranium mines'},
        {type:'diamond',rank:3,prod:'2.1M carats/yr',share:2.4,global:1.5,note:'Marine diamonds off Skeleton Coast'}
      ],
      exports:[{p:'Diamonds',v:1.3e9,s:15},{p:'Uranium',v:1.1e9,s:12.7},{p:'Fish & Seafood',v:900e6,s:10.4},{p:'Zinc',v:600e6,s:6.9},{p:'Gold',v:500e6,s:5.8}],
      imports:[{p:'Refined Petroleum',v:1.2e9,s:14},{p:'Motor Vehicles',v:700e6,s:8.1},{p:'Machinery',v:600e6,s:6.9}],
      totalExports:8.7e9, totalImports:8.6e9,
      hdi:0.610, hdiRank:139, gini:59.1, inflation:4.8, unemployment:33.4,
      debtGdp:68.0, fdi:1.1e9, electricity:55, internet:53, lifeExp:59.3, literacy:92,
      rrs:68,
      tagline:'Uranium Giant with Transformative Offshore Oil Frontier',
      paradox:'Africa\'s top uranium producer yet second-most unequal nation on Earth by Gini.',
      tools:[{n:'Namibia PAYE',p:'/namibia/na-paye'}]
    },
    LS: {
      name:'Lesotho', slug:'lesotho', flag:'🇱🇸', region:'south', capital:'Maseru',
      population:2330000, popGrowth:0.7,
      gdp:2.5e9, gdpPpp:6.5e9, gdpPC:1070, gdpPCppp:2790, gdpGrowth:2.2,
      gdpHist:{1990:0.8e9,2000:0.9e9,2010:2.2e9,2015:2.3e9,2020:2.1e9,2024:2.5e9},
      currency:{code:'LSL',name:'Lesotho Loti',sym:'L'},
      resources:[
        {type:'diamond',rank:6,prod:'0.4M carats/yr',share:0.5,global:null,note:'Letšeng — highest dollar-per-carat mine in the world'}
      ],
      exports:[{p:'Diamonds',v:400e6,s:37},{p:'Textiles & Apparel',v:300e6,s:28},{p:'Water Royalties',v:80e6,s:7.4}],
      imports:[{p:'Food Products',v:400e6,s:22},{p:'Refined Petroleum',v:200e6,s:11},{p:'Machinery',v:150e6,s:8.3}],
      totalExports:1.08e9, totalImports:1.8e9,
      hdi:0.514, hdiRank:168, gini:44.9, inflation:6.0, unemployment:24.6,
      debtGdp:55.0, fdi:30e6, electricity:47, internet:34, lifeExp:50.7, literacy:79,
      rrs:28,
      tagline:'Mountain Kingdom with the World\'s Highest-Value Diamond Mine',
      paradox:'Sells water to Africa\'s richest economy yet remains one of the continent\'s poorest.',
      tools:[{n:'Lesotho PAYE',p:'/lesotho/ls-paye'}]
    },
    SZ: {
      name:'Eswatini', slug:'eswatini', flag:'🇸🇿', region:'south', capital:'Mbabane',
      population:1200000, popGrowth:0.8,
      gdp:4.9e9, gdpPpp:12.6e9, gdpPC:4080, gdpPCppp:10500, gdpGrowth:3.5,
      gdpHist:{1990:1.2e9,2000:1.5e9,2010:4.0e9,2015:4.1e9,2020:3.9e9,2024:4.9e9},
      currency:{code:'SZL',name:'Swazi Lilangeni',sym:'E'},
      resources:[
        {type:'coal',rank:null,prod:'150K tonnes/yr',share:0,global:null,note:'Maloma Colliery anthracite'},
        {type:'timber',rank:null,prod:'Commercial plantations',share:0,global:null,note:'Pine/eucalyptus for pulp'}
      ],
      exports:[{p:'Sugar',v:450e6,s:21},{p:'Soft Drink Concentrates',v:420e6,s:20},{p:'Textiles & Apparel',v:250e6,s:12},{p:'Wood Pulp',v:180e6,s:8.5}],
      imports:[{p:'Motor Vehicles',v:320e6,s:13},{p:'Refined Petroleum',v:280e6,s:11},{p:'Machinery',v:220e6,s:8.9}],
      totalExports:2.12e9, totalImports:2.47e9,
      hdi:0.597, hdiRank:143, gini:54.6, inflation:4.8, unemployment:33.3,
      debtGdp:42.0, fdi:80e6, electricity:78, internet:47, lifeExp:57.1, literacy:88,
      rrs:22,
      tagline:'Africa\'s Last Absolute Monarchy Powered by Sugar and Coca-Cola',
      paradox:'Coca-Cola concentrate plant generates 20% of exports while a third faces food insecurity.',
      tools:[{n:'Eswatini PAYE',p:'/eswatini/sz-paye'}]
    },
    AO: {
      name:'Angola', slug:'angola', flag:'🇦🇴', region:'south', capital:'Luanda',
      population:36700000, popGrowth:3.2,
      gdp:92.1e9, gdpPpp:224e9, gdpPC:2510, gdpPCppp:6100, gdpGrowth:2.8,
      gdpHist:{1990:10.3e9,2000:9.1e9,2010:83.8e9,2015:102e9,2020:53.6e9,2024:92.1e9},
      currency:{code:'AOA',name:'Angolan Kwanza',sym:'Kz'},
      resources:[
        {type:'oil',rank:2,prod:'1.1M bpd',share:10,global:null,note:'Deepwater pre-salt blocks'},
        {type:'diamond',rank:2,prod:'9.7M carats/yr',share:11,global:7,note:'Catoca mine — 4th largest kimberlite globally'},
        {type:'gas',rank:3,prod:'8 bcm/yr',share:4,global:null,note:'Angola LNG plant'},
        {type:'iron',rank:3,prod:'5M tonnes/yr',share:1.2,global:null,note:'Cassinga deposits'}
      ],
      exports:[{p:'Crude Petroleum',v:33.5e9,s:92},{p:'Diamonds',v:1.8e9,s:5},{p:'Natural Gas',v:500e6,s:1.4}],
      imports:[{p:'Refined Petroleum',v:3.8e9,s:18},{p:'Food Products',v:2.6e9,s:12.3},{p:'Machinery',v:2.2e9,s:10.4}],
      totalExports:36.4e9, totalImports:21.1e9,
      hdi:0.586, hdiRank:148, gini:51.3, inflation:13.8, unemployment:30.0,
      debtGdp:84.9, fdi:3.6e9, electricity:46, internet:36, lifeExp:62.0, literacy:72,
      rrs:80,
      tagline:'Sub-Saharan Africa\'s Second-Largest Oil Producer',
      paradox:'Africa\'s #2 oil exporter yet imports 94% of its food.',
      tools:[{n:'Angola PAYE',p:'/angola/ao-paye'}]
    },

    // ========== CENTRAL AFRICA (7) ==========
    CD: {
      name:'DR Congo', slug:'dr-congo', flag:'🇨🇩', region:'central', capital:'Kinshasa',
      population:102300000, popGrowth:3.2,
      gdp:66.4e9, gdpPpp:154e9, gdpPC:649, gdpPCppp:1510, gdpGrowth:6.2,
      gdpHist:{1990:9.3e9,2000:4.3e9,2010:21.6e9,2015:37.9e9,2020:48.7e9,2024:66.4e9},
      currency:{code:'CDF',name:'Congolese Franc',sym:'FC'},
      resources:[
        {type:'cobalt',rank:1,prod:'170K tonnes/yr',share:95,global:73,note:'Katanga — irreplaceable for EV batteries'},
        {type:'copper',rank:1,prod:'2.8M tonnes/yr',share:52,global:12,note:'Kamoa-Kakula, Tenke Fungurume'},
        {type:'coltan',rank:1,prod:'700 tonnes/yr',share:60,global:40,note:'Eastern DRC, conflict mineral concerns'},
        {type:'diamond',rank:2,prod:'12M carats/yr',share:14,global:8,note:'Kasai provinces'},
        {type:'gold',rank:3,prod:'30 tonnes/yr',share:5,global:null,note:'Ituri, Kivu artisanal'}
      ],
      exports:[{p:'Copper',v:19.2e9,s:55},{p:'Cobalt',v:10.5e9,s:30},{p:'Crude Petroleum',v:1.4e9,s:4},{p:'Diamonds',v:800e6,s:2.3}],
      imports:[{p:'Refined Petroleum',v:2.8e9,s:16},{p:'Machinery',v:2.1e9,s:12},{p:'Food Products',v:1.9e9,s:11}],
      totalExports:34.8e9, totalImports:17.5e9,
      hdi:0.479, hdiRank:179, gini:42.1, inflation:19.9, unemployment:4.3,
      debtGdp:21.0, fdi:4.2e9, electricity:21, internet:27, lifeExp:60.7, literacy:77,
      rrs:97,
      tagline:'The Geological Scandal — Mineral Colossus Powering the Energy Transition',
      paradox:'Supplies 73% of global cobalt for EVs and smartphones yet 62% live on under $2.15/day.',
      tools:[{n:'DR Congo PAYE',p:'/dr-congo/cd-paye'}]
    },
    CG: {
      name:'Republic of Congo', slug:'congo', flag:'🇨🇬', region:'central', capital:'Brazzaville',
      population:6100000, popGrowth:2.4,
      gdp:15.3e9, gdpPpp:29.8e9, gdpPC:2510, gdpPCppp:4890, gdpGrowth:2.5,
      gdpHist:{1990:2.8e9,2000:3.2e9,2010:12.0e9,2015:8.6e9,2020:10.1e9,2024:15.3e9},
      currency:{code:'XAF',name:'Central African CFA Franc',sym:'FCFA'},
      resources:[
        {type:'oil',rank:4,prod:'260K bpd',share:2.5,global:null,note:'Offshore Pointe-Noire fields'},
        {type:'timber',rank:2,prod:'2.5M m³/yr',share:12,global:null,note:'Northern rainforest'}
      ],
      exports:[{p:'Crude Petroleum',v:7.8e9,s:82},{p:'Timber',v:500e6,s:5.3},{p:'Refined Petroleum',v:300e6,s:3.2}],
      imports:[{p:'Refined Petroleum',v:900e6,s:16},{p:'Food Products',v:600e6,s:10.6},{p:'Machinery',v:500e6,s:8.8}],
      totalExports:9.5e9, totalImports:5.7e9,
      hdi:0.571, hdiRank:150, gini:48.9, inflation:3.5, unemployment:22.1,
      debtGdp:95.0, fdi:3.5e9, electricity:50, internet:33, lifeExp:64.0, literacy:81,
      rrs:58,
      tagline:'Oil-Rich Congo Basin Nation',
      paradox:'One of Africa\'s most oil-dependent economies at 82% export concentration.',
      tools:[{n:'Congo PAYE',p:'/congo/cg-paye'}]
    },
    GA: {
      name:'Gabon', slug:'gabon', flag:'🇬🇦', region:'central', capital:'Libreville',
      population:2400000, popGrowth:2.4,
      gdp:21.1e9, gdpPpp:40.2e9, gdpPC:8790, gdpPCppp:16750, gdpGrowth:2.3,
      gdpHist:{1990:5.9e9,2000:5.1e9,2010:14.4e9,2015:14.3e9,2020:15.3e9,2024:21.1e9},
      currency:{code:'XAF',name:'Central African CFA Franc',sym:'FCFA'},
      resources:[
        {type:'manganese',rank:2,prod:'8.5M tonnes/yr',share:30,global:21,note:'Moanda — world\'s largest manganese deposit'},
        {type:'oil',rank:5,prod:'200K bpd',share:1.9,global:null,note:'Mature fields declining'},
        {type:'timber',rank:1,prod:'3.5M m³/yr',share:17,global:null,note:'88% forest cover, okoumé specialty'}
      ],
      exports:[{p:'Crude Petroleum',v:6.2e9,s:56},{p:'Manganese',v:2.8e9,s:25},{p:'Timber',v:800e6,s:7.2}],
      imports:[{p:'Machinery',v:1.2e9,s:17},{p:'Refined Petroleum',v:600e6,s:8.6},{p:'Food Products',v:500e6,s:7.1}],
      totalExports:11.1e9, totalImports:7.0e9,
      hdi:0.706, hdiRank:112, gini:38.0, inflation:2.3, unemployment:20.4,
      debtGdp:56.0, fdi:1.5e9, electricity:92, internet:72, lifeExp:66.5, literacy:85,
      rrs:74,
      tagline:'Central Africa\'s Wealthiest Per Capita Nation',
      paradox:'Highest GDP per capita in Central Africa with 88% forest cover, yet 33% live in poverty.',
      tools:[{n:'Gabon PAYE',p:'/gabon/ga-paye'}]
    },
    CF: {
      name:'Central African Republic', slug:'car', flag:'🇨🇫', region:'central', capital:'Bangui',
      population:5550000, popGrowth:1.8,
      gdp:2.6e9, gdpPpp:5.6e9, gdpPC:468, gdpPCppp:1010, gdpGrowth:1.0,
      gdpHist:{1990:1.5e9,2000:1.0e9,2010:2.0e9,2015:1.7e9,2020:2.3e9,2024:2.6e9},
      currency:{code:'XAF',name:'Central African CFA Franc',sym:'FCFA'},
      resources:[
        {type:'diamond',rank:5,prod:'300K carats/yr',share:0.3,global:null,note:'Alluvial deposits'},
        {type:'gold',rank:null,prod:'2 tonnes/yr',share:0,global:null,note:'Artisanal, largely informal'},
        {type:'timber',rank:null,prod:'800K m³/yr',share:4,global:null,note:'Southwestern rainforests'}
      ],
      exports:[{p:'Timber',v:100e6,s:38},{p:'Diamonds',v:50e6,s:19},{p:'Cotton',v:30e6,s:11}],
      imports:[{p:'Food Products',v:120e6,s:22},{p:'Refined Petroleum',v:80e6,s:14.5}],
      totalExports:264e6, totalImports:550e6,
      hdi:0.387, hdiRank:191, gini:56.2, inflation:3.2, unemployment:6.0,
      debtGdp:48.0, fdi:30e6, electricity:15, internet:11, lifeExp:53.1, literacy:37,
      rrs:35,
      tagline:'Mineral-Rich Yet Conflict-Trapped Heart of Africa',
      paradox:'Sits on diamonds, uranium, and gold but ranks second-lowest on HDI globally.',
      tools:[{n:'CAR PAYE',p:'/car/cf-paye'}]
    },
    TD: {
      name:'Chad', slug:'chad', flag:'🇹🇩', region:'central', capital:'N\'Djamena',
      population:18300000, popGrowth:3.1,
      gdp:12.6e9, gdpPpp:30.3e9, gdpPC:688, gdpPCppp:1660, gdpGrowth:3.0,
      gdpHist:{1990:1.7e9,2000:1.4e9,2010:10.7e9,2015:10.1e9,2020:10.1e9,2024:12.6e9},
      currency:{code:'XAF',name:'Central African CFA Franc',sym:'FCFA'},
      resources:[
        {type:'oil',rank:6,prod:'120K bpd',share:1.2,global:null,note:'Doba Basin, Chad-Cameroon pipeline'},
        {type:'gold',rank:null,prod:'3 tonnes/yr',share:0,global:null,note:'Artisanal mining'}
      ],
      exports:[{p:'Crude Petroleum',v:3.5e9,s:83},{p:'Gold',v:200e6,s:4.8},{p:'Cotton',v:120e6,s:2.9}],
      imports:[{p:'Refined Petroleum',v:500e6,s:14},{p:'Machinery',v:400e6,s:11.1},{p:'Food Products',v:300e6,s:8.3}],
      totalExports:4.2e9, totalImports:3.6e9,
      hdi:0.394, hdiRank:190, gini:37.5, inflation:7.0, unemployment:2.1,
      debtGdp:42.0, fdi:600e6, electricity:11, internet:16, lifeExp:52.5, literacy:26,
      rrs:42,
      tagline:'Sahel Oil Producer and Africa\'s Strategic Military Crossroads',
      paradox:'Oil since 2003 has barely moved human development — literacy at 26% is among the lowest globally.',
      tools:[{n:'Chad PAYE',p:'/chad/td-paye'}]
    },
    GQ: {
      name:'Equatorial Guinea', slug:'equatorial-guinea', flag:'🇬🇶', region:'central', capital:'Malabo',
      population:1740000, popGrowth:3.2,
      gdp:12.3e9, gdpPpp:25.4e9, gdpPC:7070, gdpPCppp:14600, gdpGrowth:-5.2,
      gdpHist:{1990:0.13e9,2000:1.3e9,2010:15.6e9,2015:12.2e9,2020:10.0e9,2024:12.3e9},
      currency:{code:'XAF',name:'Central African CFA Franc',sym:'FCFA'},
      resources:[
        {type:'oil',rank:3,prod:'90K bpd',share:0.9,global:null,note:'Zafiro, Ceiba — declining'},
        {type:'gas',rank:2,prod:'6.2 bcm/yr',share:3,global:null,note:'EG LNG terminal'}
      ],
      exports:[{p:'Crude Petroleum',v:4.5e9,s:55},{p:'Natural Gas & LNG',v:2.0e9,s:24},{p:'Methanol',v:900e6,s:11}],
      imports:[{p:'Machinery',v:1.1e9,s:21},{p:'Motor Vehicles',v:500e6,s:9.6},{p:'Food Products',v:400e6,s:7.7}],
      totalExports:8.2e9, totalImports:5.2e9,
      hdi:0.596, hdiRank:144, gini:null, inflation:2.3, unemployment:8.6,
      debtGdp:32.0, fdi:1.4e9, electricity:67, internet:54, lifeExp:60.6, literacy:95,
      rrs:55,
      tagline:'Petro-State Facing Production Cliff',
      paradox:'Was once wealthiest African per capita yet most citizens never benefited — no diversification plan.',
      tools:[{n:'Equatorial Guinea PAYE',p:'/eq-guinea/gq-paye'}]
    },
    ST: {
      name:'São Tomé & Príncipe', slug:'sao-tome', flag:'🇸🇹', region:'central', capital:'São Tomé',
      population:230000, popGrowth:1.7,
      gdp:640e6, gdpPpp:1.4e9, gdpPC:2780, gdpPCppp:6090, gdpGrowth:1.8,
      gdpHist:{1990:60e6,2000:70e6,2010:220e6,2015:340e6,2020:470e6,2024:640e6},
      currency:{code:'STN',name:'São Tomé Dobra',sym:'Db'},
      resources:[
        {type:'cocoa',rank:null,prod:'3.5K tonnes/yr',share:0,global:null,note:'Organic fine-flavour cocoa'},
        {type:'fish',rank:null,prod:'4K tonnes/yr',share:0,global:null,note:'Tuna-rich EEZ'}
      ],
      exports:[{p:'Cocoa',v:18e6,s:67},{p:'Copra & Palm Oil',v:3e6,s:11},{p:'Fish',v:2e6,s:7.4}],
      imports:[{p:'Food Products',v:60e6,s:28},{p:'Refined Petroleum',v:30e6,s:14},{p:'Machinery',v:20e6,s:9.3}],
      totalExports:27e6, totalImports:215e6,
      hdi:0.618, hdiRank:136, gini:40.7, inflation:20.0, unemployment:14.0,
      debtGdp:68.0, fdi:40e6, electricity:75, internet:36, lifeExp:67.8, literacy:93,
      rrs:10,
      tagline:'Africa\'s Second-Smallest Nation Betting on Cocoa and Ecotourism',
      paradox:'Exports premium organic cocoa to European chocolatiers while importing 28% of needs as food.',
      tools:[]
    },

    // ========== NORTH AFRICA (6) ==========
    EG: {
      name:'Egypt', slug:'egypt', flag:'🇪🇬', region:'north', capital:'Cairo',
      population:105700000, popGrowth:1.6,
      gdp:395e9, gdpPpp:1.81e12, gdpPC:3740, gdpPCppp:17130, gdpGrowth:3.8,
      gdpHist:{1990:43.1e9,2000:99.8e9,2010:219e9,2015:332e9,2020:365e9,2024:395e9},
      currency:{code:'EGP',name:'Egyptian Pound',sym:'E£'},
      resources:[
        {type:'gas',rank:1,prod:'67 bcm/yr',share:28,global:null,note:'Zohr — largest Mediterranean gas discovery'},
        {type:'oil',rank:4,prod:'550K bpd',share:5.3,global:null,note:'Gulf of Suez, Western Desert'},
        {type:'phosphate',rank:1,prod:'5.5M tonnes/yr',share:35,global:2,note:'Red Sea coast, Nile Valley'},
        {type:'gold',rank:2,prod:'15 tonnes/yr',share:3,global:null,note:'Sukari mine'}
      ],
      exports:[{p:'Petroleum & Gas',v:13.5e9,s:29},{p:'Fertilizers',v:3.2e9,s:6.9},{p:'Textiles',v:2.8e9,s:6},{p:'Plastics',v:2.1e9,s:4.5},{p:'Fruit & Vegetables',v:1.9e9,s:4.1}],
      imports:[{p:'Refined Petroleum',v:7.8e9,s:10},{p:'Wheat',v:4.2e9,s:5.4},{p:'Machinery',v:3.9e9,s:5},{p:'Iron & Steel',v:3.5e9,s:4.5},{p:'Motor Vehicles',v:3.1e9,s:4}],
      totalExports:46.5e9, totalImports:78.0e9,
      hdi:0.728, hdiRank:105, gini:31.5, inflation:33.9, unemployment:7.1,
      debtGdp:92.7, fdi:9.8e9, electricity:100, internet:72, lifeExp:70.2, literacy:73,
      rrs:75,
      tagline:'Africa\'s Largest Economy by Population with Suez Canal Leverage',
      paradox:'Controls 12% of global trade via the Suez yet runs a $31B trade deficit and imports more wheat than any nation.',
      tools:[{n:'Egypt PAYE Calculator',p:'/egypt/eg-paye'}]
    },
    MA: {
      name:'Morocco', slug:'morocco', flag:'🇲🇦', region:'north', capital:'Rabat',
      population:37800000, popGrowth:1.0,
      gdp:141e9, gdpPpp:363e9, gdpPC:3730, gdpPCppp:9600, gdpGrowth:3.0,
      gdpHist:{1990:30.4e9,2000:37.0e9,2010:93.2e9,2015:101e9,2020:114e9,2024:141e9},
      currency:{code:'MAD',name:'Moroccan Dirham',sym:'MAD'},
      resources:[
        {type:'phosphate',rank:1,prod:'40M tonnes/yr',share:60,global:18,note:'OCP Group — 72% of global phosphate reserves'},
        {type:'cobalt',rank:2,prod:'2.3K tonnes/yr',share:2.3,global:null,note:'Bou Azzer — only primary cobalt mine globally'},
        {type:'fish',rank:1,prod:'1.5M tonnes/yr',share:28,global:null,note:'Largest in Africa, sardine superpower'}
      ],
      exports:[{p:'Phosphates & Fertilizers',v:9.8e9,s:19},{p:'Motor Vehicles',v:8.5e9,s:16.5},{p:'Textiles',v:5.2e9,s:10.1},{p:'Electronics',v:4.8e9,s:9.3},{p:'Fish & Seafood',v:3.1e9,s:6}],
      imports:[{p:'Refined Petroleum',v:8.5e9,s:12},{p:'Crude Petroleum',v:4.2e9,s:5.9},{p:'Wheat',v:2.8e9,s:3.9},{p:'Machinery',v:3.6e9,s:5.1}],
      totalExports:51.6e9, totalImports:71.1e9,
      hdi:0.698, hdiRank:116, gini:39.5, inflation:1.3, unemployment:13.0,
      debtGdp:69.5, fdi:2.1e9, electricity:100, internet:88, lifeExp:74.0, literacy:75,
      rrs:82,
      tagline:'Phosphate Kingdom and Africa\'s Industrial Diversification Champion',
      paradox:'Holds 72% of global phosphate reserves — the world depends on Morocco to eat — yet imports most of its energy.',
      tools:[{n:'Morocco PAYE',p:'/morocco/ma-paye'}]
    },
    DZ: {
      name:'Algeria', slug:'algeria', flag:'🇩🇿', region:'north', capital:'Algiers',
      population:46300000, popGrowth:1.5,
      gdp:240e9, gdpPpp:632e9, gdpPC:5180, gdpPCppp:13650, gdpGrowth:3.8,
      gdpHist:{1990:62.0e9,2000:54.7e9,2010:161e9,2015:166e9,2020:145e9,2024:240e9},
      currency:{code:'DZD',name:'Algerian Dinar',sym:'DA'},
      resources:[
        {type:'gas',rank:2,prod:'100 bcm/yr',share:42,global:2,note:'Hassi R\'Mel — Africa\'s largest gas field'},
        {type:'oil',rank:3,prod:'970K bpd',share:9.3,global:null,note:'Hassi Messaoud, OPEC member'},
        {type:'iron',rank:1,prod:'3.5M tonnes/yr',share:9,global:null,note:'Gara Djebilet — massive untapped deposit'},
        {type:'phosphate',rank:2,prod:'1.8M tonnes/yr',share:12,global:null,note:'Djebel Onk deposits'}
      ],
      exports:[{p:'Crude Petroleum',v:20.5e9,s:44},{p:'Natural Gas & LNG',v:17.8e9,s:38},{p:'Refined Petroleum',v:3.1e9,s:6.7},{p:'Ammonia & Fertilizers',v:1.8e9,s:3.9}],
      imports:[{p:'Machinery',v:6.5e9,s:14},{p:'Motor Vehicles',v:3.8e9,s:8.2},{p:'Iron & Steel',v:3.2e9,s:6.9},{p:'Food Products',v:3.0e9,s:6.5}],
      totalExports:46.4e9, totalImports:46.3e9,
      hdi:0.745, hdiRank:91, gini:27.6, inflation:7.7, unemployment:11.7,
      debtGdp:47.7, fdi:1.1e9, electricity:100, internet:71, lifeExp:76.4, literacy:81,
      rrs:78,
      tagline:'Africa\'s Largest Country and OPEC Gas Giant',
      paradox:'97% of exports from hydrocarbons yet sits on untapped iron at Gara Djebilet.',
      tools:[{n:'Algeria PAYE',p:'/algeria/dz-paye'}]
    },
    TN: {
      name:'Tunisia', slug:'tunisia', flag:'🇹🇳', region:'north', capital:'Tunis',
      population:12500000, popGrowth:0.8,
      gdp:46.3e9, gdpPpp:145e9, gdpPC:3700, gdpPCppp:11600, gdpGrowth:1.6,
      gdpHist:{1990:12.3e9,2000:21.5e9,2010:44.1e9,2015:41.0e9,2020:39.2e9,2024:46.3e9},
      currency:{code:'TND',name:'Tunisian Dinar',sym:'DT'},
      resources:[
        {type:'phosphate',rank:3,prod:'3.8M tonnes/yr',share:24,global:null,note:'Gafsa basin — mining since 1897'},
        {type:'farm',rank:null,prod:'Olive oil: 240K tonnes/yr',share:65,global:7,note:'Second-largest olive oil exporter globally'}
      ],
      exports:[{p:'Electrical Equipment',v:5.8e9,s:28},{p:'Textiles',v:3.6e9,s:17},{p:'Olive Oil',v:1.6e9,s:7.7},{p:'Phosphates',v:1.4e9,s:6.7}],
      imports:[{p:'Refined Petroleum',v:3.2e9,s:12.8},{p:'Machinery',v:2.8e9,s:11.2},{p:'Iron & Steel',v:1.6e9,s:6.4},{p:'Wheat',v:1.3e9,s:5.2}],
      totalExports:20.7e9, totalImports:25.0e9,
      hdi:0.732, hdiRank:101, gini:32.8, inflation:7.1, unemployment:15.8,
      debtGdp:80.2, fdi:700e6, electricity:100, internet:79, lifeExp:76.7, literacy:82,
      rrs:45,
      tagline:'Arab Spring Birthplace with Phosphates and Olive Oil',
      paradox:'Most educated workforce in North Africa yet 15.8% unemployment — a talent export machine.',
      tools:[{n:'Tunisia PAYE',p:'/tunisia/tn-paye'}]
    },
    LY: {
      name:'Libya', slug:'libya', flag:'🇱🇾', region:'north', capital:'Tripoli',
      population:7000000, popGrowth:1.2,
      gdp:44.4e9, gdpPpp:81.4e9, gdpPC:6340, gdpPCppp:11630, gdpGrowth:8.0,
      gdpHist:{1990:28.8e9,2000:33.9e9,2010:74.8e9,2015:29.2e9,2020:25.4e9,2024:44.4e9},
      currency:{code:'LYD',name:'Libyan Dinar',sym:'LD'},
      resources:[
        {type:'oil',rank:1,prod:'1.2M bpd',share:11.5,global:null,note:'Africa\'s largest proven reserves at 48.4B bbl'},
        {type:'gas',rank:3,prod:'12.4 bcm/yr',share:5.2,global:null,note:'Pipeline to Italy'}
      ],
      exports:[{p:'Crude Petroleum',v:25.8e9,s:93},{p:'Natural Gas',v:1.0e9,s:3.6}],
      imports:[{p:'Refined Petroleum',v:3.5e9,s:21},{p:'Food Products',v:2.8e9,s:17},{p:'Machinery',v:1.8e9,s:10.8}],
      totalExports:27.7e9, totalImports:16.7e9,
      hdi:0.718, hdiRank:104, gini:null, inflation:2.1, unemployment:19.6,
      debtGdp:null, fdi:null, electricity:70, internet:84, lifeExp:72.0, literacy:91,
      rrs:70,
      tagline:'Africa\'s Largest Oil Reserve Holder',
      paradox:'More proven oil than any African nation yet output swings between 0 and 1.2M bpd by faction control.',
      tools:[{n:'Libya PAYE',p:'/libya/ly-paye'}]
    },
    SD: {
      name:'Sudan', slug:'sudan', flag:'🇸🇩', region:'north', capital:'Khartoum',
      population:48100000, popGrowth:2.5,
      gdp:26.0e9, gdpPpp:176e9, gdpPC:540, gdpPCppp:3660, gdpGrowth:-12.0,
      gdpHist:{1990:12.4e9,2000:12.3e9,2010:65.6e9,2015:81.6e9,2020:34.3e9,2024:26.0e9},
      currency:{code:'SDG',name:'Sudanese Pound',sym:'SDG'},
      resources:[
        {type:'gold',rank:2,prod:'80 tonnes/yr',share:14,global:null,note:'Africa\'s #2 gold producer'},
        {type:'farm',rank:null,prod:'Gum arabic: 88K tonnes/yr',share:60,global:60,note:'Global monopoly — in every can of Coca-Cola'}
      ],
      exports:[{p:'Gold',v:2.8e9,s:65},{p:'Livestock',v:500e6,s:11.6},{p:'Sesame Seeds',v:300e6,s:7},{p:'Gum Arabic',v:150e6,s:3.5}],
      imports:[{p:'Wheat & Food',v:1.2e9,s:19},{p:'Refined Petroleum',v:800e6,s:12.7},{p:'Machinery',v:600e6,s:9.5}],
      totalExports:4.3e9, totalImports:6.3e9,
      hdi:0.508, hdiRank:170, gini:34.2, inflation:171.0, unemployment:11.4,
      debtGdp:183.9, fdi:100e6, electricity:54, internet:30, lifeExp:65.3, literacy:61,
      rrs:55,
      tagline:'Gold Rush Nation Supplying 60% of the World\'s Gum Arabic',
      paradox:'Produces 60% of gum arabic (in every Coca-Cola) and is #2 gold producer, yet civil war has collapsed GDP.',
      tools:[{n:'Sudan PAYE',p:'/sudan/sd-paye'}]
    },

    // ========== ISLAND NATIONS (3) ==========
    MU: {
      name:'Mauritius', slug:'mauritius', flag:'🇲🇺', region:'island', capital:'Port Louis',
      population:1270000, popGrowth:0.1,
      gdp:14.8e9, gdpPpp:33.4e9, gdpPC:11650, gdpPCppp:26300, gdpGrowth:4.9,
      gdpHist:{1990:2.7e9,2000:4.6e9,2010:10.0e9,2015:11.7e9,2020:10.9e9,2024:14.8e9},
      currency:{code:'MUR',name:'Mauritian Rupee',sym:'Rs'},
      resources:[
        {type:'fish',rank:1,prod:'2.3M km² EEZ',share:0,global:null,note:'Indian Ocean tuna hub'}
      ],
      exports:[{p:'Textiles & Apparel',v:1.1e9,s:25},{p:'Fish & Seafood',v:500e6,s:11.4},{p:'Sugar & Rum',v:300e6,s:6.8}],
      imports:[{p:'Refined Petroleum',v:1.3e9,s:16},{p:'Fish (processing)',v:500e6,s:6.2},{p:'Machinery',v:400e6,s:4.9}],
      totalExports:4.4e9, totalImports:8.1e9,
      hdi:0.796, hdiRank:72, gini:36.8, inflation:7.0, unemployment:6.1,
      debtGdp:80.4, fdi:500e6, electricity:100, internet:68, lifeExp:74.1, literacy:92,
      rrs:18,
      tagline:'Africa\'s Highest HDI Island — The Singapore of the Indian Ocean',
      paradox:'Zero natural resources at independence, now highest HDI in Africa through services and governance.',
      tools:[{n:'Mauritius PAYE',p:'/mauritius/mu-paye'}]
    },
    SC: {
      name:'Seychelles', slug:'seychelles', flag:'🇸🇨', region:'island', capital:'Victoria',
      population:107000, popGrowth:0.6,
      gdp:2.2e9, gdpPpp:4.0e9, gdpPC:20560, gdpPCppp:37380, gdpGrowth:4.2,
      gdpHist:{1990:0.37e9,2000:0.61e9,2010:0.97e9,2015:1.4e9,2020:1.2e9,2024:2.2e9},
      currency:{code:'SCR',name:'Seychellois Rupee',sym:'Rs'},
      resources:[
        {type:'fish',rank:2,prod:'1.4M km² EEZ',share:0,global:null,note:'Port Victoria — largest tuna canning port in Indian Ocean'}
      ],
      exports:[{p:'Canned Tuna',v:420e6,s:70},{p:'Fresh Fish',v:80e6,s:13}],
      imports:[{p:'Refined Petroleum',v:350e6,s:20},{p:'Food Products',v:200e6,s:11.4}],
      totalExports:600e6, totalImports:1.75e9,
      hdi:0.785, hdiRank:76, gini:32.1, inflation:1.0, unemployment:3.0,
      debtGdp:63.0, fdi:250e6, electricity:100, internet:79, lifeExp:73.4, literacy:96,
      rrs:12,
      tagline:'Africa\'s Richest Per Capita — 115 Islands of Tuna and Tourism',
      paradox:'Highest GDP per capita in Africa yet 70% of exports = canned tuna.',
      tools:[{n:'Seychelles PAYE',p:'/seychelles/sc-paye'}]
    },
    KM: {
      name:'Comoros', slug:'comoros', flag:'🇰🇲', region:'island', capital:'Moroni',
      population:850000, popGrowth:2.2,
      gdp:1.3e9, gdpPpp:3.0e9, gdpPC:1530, gdpPCppp:3530, gdpGrowth:3.0,
      gdpHist:{1990:260e6,2000:200e6,2010:560e6,2015:590e6,2020:1.1e9,2024:1.3e9},
      currency:{code:'KMF',name:'Comorian Franc',sym:'CF'},
      resources:[
        {type:'farm',rank:null,prod:'Ylang-ylang: 80% global',share:80,global:80,note:'World\'s dominant producer — base note in Chanel No. 5'},
        {type:'farm',rank:null,prod:'Vanilla',share:0,global:null,note:'High-quality bourbon vanilla'}
      ],
      exports:[{p:'Cloves',v:32e6,s:45},{p:'Ylang-Ylang',v:15e6,s:21},{p:'Vanilla',v:12e6,s:17}],
      imports:[{p:'Rice',v:65e6,s:19},{p:'Refined Petroleum',v:50e6,s:14.5},{p:'Meat & Poultry',v:30e6,s:8.7}],
      totalExports:71e6, totalImports:345e6,
      hdi:0.596, hdiRank:142, gini:45.3, inflation:1.0, unemployment:8.5,
      debtGdp:31.0, fdi:10e6, electricity:84, internet:21, lifeExp:64.3, literacy:59,
      rrs:14,
      tagline:'Volcanic Perfume Islands Producing 80% of the World\'s Ylang-Ylang',
      paradox:'Produces the base note of the world\'s most expensive perfumes yet GDP per capita is just $1,530.',
      tools:[{n:'Comoros PAYE',p:'/comoros/km-paye'}]
    }
  };

  // ========== WORLD REFERENCE COUNTRIES (20) ==========
  var WORLD_REF = {
    US: {
      name:'United States', slug:'united-states', flag:'🇺🇸', region:'ref', capital:'Washington D.C.',
      population:335000000, popGrowth:0.5,
      gdp:27.36e12, gdpPpp:27.36e12, gdpPC:81630, gdpPCppp:81630, gdpGrowth:2.5,
      gdpHist:{1990:5.96e12,2000:10.25e12,2010:14.99e12,2015:18.24e12,2020:21.06e12,2024:27.36e12},
      currency:{code:'USD',name:'US Dollar',sym:'$'},
      resources:[{type:'oil',rank:null,prod:'13M bpd',share:0,global:1,note:'World\'s largest oil producer'}],
      exports:[{p:'Refined Petroleum',v:120e9,s:7}],
      imports:[{p:'Crude Petroleum',v:150e9,s:5}],
      totalExports:1.8e12, totalImports:3.1e12,
      hdi:0.921, hdiRank:20, gini:39.8, inflation:3.4, unemployment:3.7,
      debtGdp:123.0, fdi:285e9, electricity:100, internet:92, lifeExp:77.5, literacy:99,
      rrs:85, tagline:'World\'s largest economy', paradox:null, tools:[], isRef:true
    },
    CN: {
      name:'China', slug:'china', flag:'🇨🇳', region:'ref', capital:'Beijing',
      population:1412000000, popGrowth:0.0,
      gdp:17.79e12, gdpPpp:35.29e12, gdpPC:12600, gdpPCppp:24990, gdpGrowth:5.2,
      gdpHist:{1990:0.39e12,2000:1.21e12,2010:6.09e12,2015:11.06e12,2020:14.72e12,2024:17.79e12},
      currency:{code:'CNY',name:'Chinese Yuan',sym:'¥'},
      resources:[{type:'coal',rank:null,prod:'4.7B tonnes/yr',share:0,global:1,note:'World\'s largest coal producer'}],
      exports:[{p:'Electronics',v:800e9,s:15}],
      imports:[{p:'Crude Petroleum',v:300e9,s:10}],
      totalExports:3.5e12, totalImports:2.6e12,
      hdi:0.788, hdiRank:75, gini:38.2, inflation:0.2, unemployment:5.1,
      debtGdp:83.6, fdi:163e9, electricity:100, internet:73, lifeExp:78.2, literacy:97,
      rrs:70, tagline:'World\'s manufacturing superpower', paradox:null, tools:[], isRef:true
    },
    IN: {
      name:'India', slug:'india', flag:'🇮🇳', region:'ref', capital:'New Delhi',
      population:1429000000, popGrowth:0.8,
      gdp:3.57e12, gdpPpp:14.59e12, gdpPC:2500, gdpPCppp:10210, gdpGrowth:7.8,
      gdpHist:{1990:0.32e12,2000:0.47e12,2010:1.68e12,2015:2.10e12,2020:2.67e12,2024:3.57e12},
      currency:{code:'INR',name:'Indian Rupee',sym:'₹'},
      resources:[{type:'coal',rank:null,prod:'900M tonnes/yr',share:0,global:2,note:'Second-largest coal producer'}],
      exports:[{p:'Refined Petroleum',v:60e9,s:14}],
      imports:[{p:'Crude Petroleum',v:150e9,s:20}],
      totalExports:430e9, totalImports:714e9,
      hdi:0.644, hdiRank:134, gini:35.7, inflation:5.4, unemployment:3.1,
      debtGdp:83.2, fdi:49e9, electricity:99, internet:52, lifeExp:67.2, literacy:74,
      rrs:55, tagline:'World\'s most populous nation', paradox:null, tools:[], isRef:true
    },
    NO: {
      name:'Norway', slug:'norway', flag:'🇳🇴', region:'ref', capital:'Oslo',
      population:5500000, popGrowth:0.6,
      gdp:485e9, gdpPpp:429e9, gdpPC:88230, gdpPCppp:78020, gdpGrowth:0.5,
      gdpHist:{1990:117e9,2000:171e9,2010:428e9,2015:386e9,2020:362e9,2024:485e9},
      currency:{code:'NOK',name:'Norwegian Krone',sym:'kr'},
      resources:[{type:'oil',rank:null,prod:'1.9M bpd',share:0,global:14,note:'North Sea oil, $1.7T sovereign wealth fund'}],
      exports:[{p:'Crude Petroleum',v:60e9,s:35}],
      imports:[{p:'Motor Vehicles',v:10e9,s:8}],
      totalExports:172e9, totalImports:120e9,
      hdi:0.961, hdiRank:1, gini:27.7, inflation:5.5, unemployment:3.6,
      debtGdp:44.3, fdi:12e9, electricity:100, internet:98, lifeExp:83.3, literacy:99,
      rrs:65, tagline:'Oil nation with world\'s largest sovereign wealth fund', paradox:null, tools:[], isRef:true
    },
    SA: {
      name:'Saudi Arabia', slug:'saudi-arabia', flag:'🇸🇦', region:'ref', capital:'Riyadh',
      population:36900000, popGrowth:1.6,
      gdp:1.07e12, gdpPpp:2.11e12, gdpPC:29000, gdpPCppp:57200, gdpGrowth:0.8,
      gdpHist:{1990:117e9,2000:189e9,2010:528e9,2015:655e9,2020:700e9,2024:1.07e12},
      currency:{code:'SAR',name:'Saudi Riyal',sym:'﷼'},
      resources:[{type:'oil',rank:null,prod:'10.5M bpd',share:0,global:2,note:'OPEC leader, Vision 2030 diversification'}],
      exports:[{p:'Crude Petroleum',v:200e9,s:65}],
      imports:[{p:'Motor Vehicles',v:20e9,s:8}],
      totalExports:310e9, totalImports:250e9,
      hdi:0.875, hdiRank:35, gini:null, inflation:2.3, unemployment:5.6,
      debtGdp:26.2, fdi:10e9, electricity:100, internet:99, lifeExp:77.6, literacy:97,
      rrs:75, tagline:'OPEC\'s de facto leader', paradox:null, tools:[], isRef:true
    },
    AU: {
      name:'Australia', slug:'australia', flag:'🇦🇺', region:'ref', capital:'Canberra',
      population:26500000, popGrowth:1.3,
      gdp:1.72e12, gdpPpp:1.69e12, gdpPC:64920, gdpPCppp:63780, gdpGrowth:2.0,
      gdpHist:{1990:310e9,2000:400e9,2010:1.25e12,2015:1.35e12,2020:1.36e12,2024:1.72e12},
      currency:{code:'AUD',name:'Australian Dollar',sym:'A$'},
      resources:[{type:'iron',rank:null,prod:'900M tonnes/yr',share:0,global:1,note:'World\'s largest iron ore exporter'}],
      exports:[{p:'Iron Ore',v:100e9,s:25}],
      imports:[{p:'Refined Petroleum',v:20e9,s:5}],
      totalExports:400e9, totalImports:380e9,
      hdi:0.946, hdiRank:4, gini:34.3, inflation:5.6, unemployment:3.7,
      debtGdp:52.7, fdi:30e9, electricity:100, internet:96, lifeExp:83.3, literacy:99,
      rrs:85, tagline:'Mining superpower', paradox:null, tools:[], isRef:true
    },
    BR: {
      name:'Brazil', slug:'brazil', flag:'🇧🇷', region:'ref', capital:'Brasília',
      population:216000000, popGrowth:0.5,
      gdp:2.13e12, gdpPpp:4.05e12, gdpPC:9870, gdpPCppp:18760, gdpGrowth:2.9,
      gdpHist:{1990:462e9,2000:655e9,2010:2.21e12,2015:1.80e12,2020:1.45e12,2024:2.13e12},
      currency:{code:'BRL',name:'Brazilian Real',sym:'R$'},
      resources:[{type:'oil',rank:null,prod:'3.4M bpd',share:0,global:7,note:'Pre-salt deepwater'}],
      exports:[{p:'Iron Ore',v:30e9,s:10}],
      imports:[{p:'Refined Petroleum',v:15e9,s:5}],
      totalExports:340e9, totalImports:300e9,
      hdi:0.760, hdiRank:87, gini:48.9, inflation:4.6, unemployment:7.8,
      debtGdp:74.4, fdi:66e9, electricity:99, internet:81, lifeExp:76.0, literacy:93,
      rrs:78, tagline:'Latin America\'s largest economy', paradox:null, tools:[], isRef:true
    },
    RU: {
      name:'Russia', slug:'russia', flag:'🇷🇺', region:'ref', capital:'Moscow',
      population:144000000, popGrowth:-0.2,
      gdp:2.02e12, gdpPpp:5.51e12, gdpPC:14030, gdpPCppp:38290, gdpGrowth:3.6,
      gdpHist:{1990:517e9,2000:260e9,2010:1.52e12,2015:1.36e12,2020:1.48e12,2024:2.02e12},
      currency:{code:'RUB',name:'Russian Ruble',sym:'₽'},
      resources:[{type:'gas',rank:null,prod:'701 bcm/yr',share:0,global:2,note:'World\'s 2nd-largest gas producer'}],
      exports:[{p:'Crude Petroleum',v:120e9,s:25}],
      imports:[{p:'Machinery',v:40e9,s:10}],
      totalExports:470e9, totalImports:400e9,
      hdi:0.821, hdiRank:56, gini:36.0, inflation:7.4, unemployment:3.2,
      debtGdp:18.9, fdi:25e9, electricity:100, internet:88, lifeExp:73.4, literacy:99,
      rrs:90, tagline:'Energy superpower', paradox:null, tools:[], isRef:true
    },
    DE: {
      name:'Germany', slug:'germany', flag:'🇩🇪', region:'ref', capital:'Berlin',
      population:83200000, popGrowth:0.1,
      gdp:4.46e12, gdpPpp:5.68e12, gdpPC:53570, gdpPCppp:68200, gdpGrowth:-0.3,
      gdpHist:{1990:1.59e12,2000:1.95e12,2010:3.42e12,2015:3.36e12,2020:3.89e12,2024:4.46e12},
      currency:{code:'EUR',name:'Euro',sym:'€'},
      resources:[],
      exports:[{p:'Motor Vehicles',v:250e9,s:15}],
      imports:[{p:'Crude Petroleum',v:40e9,s:3}],
      totalExports:1.7e12, totalImports:1.5e12,
      hdi:0.942, hdiRank:7, gini:31.7, inflation:2.2, unemployment:3.0,
      debtGdp:63.7, fdi:36e9, electricity:100, internet:93, lifeExp:80.6, literacy:99,
      rrs:15, tagline:'Europe\'s industrial engine', paradox:null, tools:[], isRef:true
    },
    GB: {
      name:'United Kingdom', slug:'united-kingdom', flag:'🇬🇧', region:'ref', capital:'London',
      population:67700000, popGrowth:0.4,
      gdp:3.34e12, gdpPpp:3.87e12, gdpPC:49350, gdpPCppp:57170, gdpGrowth:0.1,
      gdpHist:{1990:1.09e12,2000:1.66e12,2010:2.48e12,2015:2.93e12,2020:2.76e12,2024:3.34e12},
      currency:{code:'GBP',name:'Pound Sterling',sym:'£'},
      resources:[{type:'oil',rank:null,prod:'700K bpd',share:0,global:21,note:'North Sea, declining'}],
      exports:[{p:'Financial Services',v:80e9,s:10}],
      imports:[{p:'Motor Vehicles',v:60e9,s:5}],
      totalExports:870e9, totalImports:950e9,
      hdi:0.929, hdiRank:15, gini:35.1, inflation:3.9, unemployment:4.0,
      debtGdp:100.0, fdi:60e9, electricity:100, internet:96, lifeExp:80.7, literacy:99,
      rrs:30, tagline:'Financial capital of Europe', paradox:null, tools:[], isRef:true
    },
    JP: {
      name:'Japan', slug:'japan', flag:'🇯🇵', region:'ref', capital:'Tokyo',
      population:124000000, popGrowth:-0.5,
      gdp:4.29e12, gdpPpp:6.49e12, gdpPC:34600, gdpPCppp:52350, gdpGrowth:1.9,
      gdpHist:{1990:3.13e12,2000:4.89e12,2010:5.76e12,2015:4.39e12,2020:5.04e12,2024:4.29e12},
      currency:{code:'JPY',name:'Japanese Yen',sym:'¥'},
      resources:[],
      exports:[{p:'Motor Vehicles',v:120e9,s:15}],
      imports:[{p:'Crude Petroleum',v:70e9,s:8}],
      totalExports:800e9, totalImports:900e9,
      hdi:0.920, hdiRank:22, gini:32.9, inflation:3.2, unemployment:2.6,
      debtGdp:261.3, fdi:12e9, electricity:100, internet:93, lifeExp:84.8, literacy:99,
      rrs:10, tagline:'Tech innovator with minimal resources', paradox:null, tools:[], isRef:true
    },
    KR: {
      name:'South Korea', slug:'south-korea', flag:'🇰🇷', region:'ref', capital:'Seoul',
      population:51700000, popGrowth:0.0,
      gdp:1.71e12, gdpPpp:2.92e12, gdpPC:33080, gdpPCppp:56470, gdpGrowth:1.4,
      gdpHist:{1990:279e9,2000:562e9,2010:1.09e12,2015:1.38e12,2020:1.64e12,2024:1.71e12},
      currency:{code:'KRW',name:'South Korean Won',sym:'₩'},
      resources:[],
      exports:[{p:'Semiconductors',v:120e9,s:18}],
      imports:[{p:'Crude Petroleum',v:60e9,s:10}],
      totalExports:680e9, totalImports:640e9,
      hdi:0.929, hdiRank:17, gini:31.4, inflation:3.6, unemployment:2.7,
      debtGdp:54.3, fdi:18e9, electricity:100, internet:97, lifeExp:83.7, literacy:99,
      rrs:10, tagline:'From war ruins to tech powerhouse', paradox:null, tools:[], isRef:true
    },
    SG: {
      name:'Singapore', slug:'singapore', flag:'🇸🇬', region:'ref', capital:'Singapore',
      population:5900000, popGrowth:0.8,
      gdp:497e9, gdpPpp:690e9, gdpPC:84250, gdpPCppp:116930, gdpGrowth:1.1,
      gdpHist:{1990:36.8e9,2000:96e9,2010:236e9,2015:307e9,2020:345e9,2024:497e9},
      currency:{code:'SGD',name:'Singapore Dollar',sym:'S$'},
      resources:[],
      exports:[{p:'Electronics',v:150e9,s:20}],
      imports:[{p:'Electronics',v:120e9,s:15}],
      totalExports:730e9, totalImports:670e9,
      hdi:0.939, hdiRank:9, gini:37.9, inflation:4.8, unemployment:2.1,
      debtGdp:168.0, fdi:141e9, electricity:100, internet:96, lifeExp:83.9, literacy:97,
      rrs:5, tagline:'Tiny island, global financial hub', paradox:null, tools:[], isRef:true
    },
    AE: {
      name:'UAE', slug:'uae', flag:'🇦🇪', region:'ref', capital:'Abu Dhabi',
      population:9400000, popGrowth:0.6,
      gdp:509e9, gdpPpp:820e9, gdpPC:54150, gdpPCppp:87230, gdpGrowth:3.4,
      gdpHist:{1990:50.7e9,2000:104e9,2010:289e9,2015:358e9,2020:349e9,2024:509e9},
      currency:{code:'AED',name:'UAE Dirham',sym:'د.إ'},
      resources:[{type:'oil',rank:null,prod:'3.2M bpd',share:0,global:7,note:'Abu Dhabi reserves'}],
      exports:[{p:'Crude Petroleum',v:70e9,s:25}],
      imports:[{p:'Machinery',v:30e9,s:8}],
      totalExports:280e9, totalImports:380e9,
      hdi:0.911, hdiRank:26, gini:26.0, inflation:2.3, unemployment:2.9,
      debtGdp:30.0, fdi:23e9, electricity:100, internet:99, lifeExp:78.7, literacy:98,
      rrs:60, tagline:'Oil wealth diversified into tourism and finance', paradox:null, tools:[], isRef:true
    },
    CA: {
      name:'Canada', slug:'canada', flag:'🇨🇦', region:'ref', capital:'Ottawa',
      population:40500000, popGrowth:1.8,
      gdp:2.14e12, gdpPpp:2.38e12, gdpPC:52880, gdpPCppp:58770, gdpGrowth:1.1,
      gdpHist:{1990:593e9,2000:744e9,2010:1.61e12,2015:1.56e12,2020:1.64e12,2024:2.14e12},
      currency:{code:'CAD',name:'Canadian Dollar',sym:'C$'},
      resources:[{type:'oil',rank:null,prod:'5.6M bpd',share:0,global:4,note:'Oil sands'}],
      exports:[{p:'Crude Petroleum',v:100e9,s:18}],
      imports:[{p:'Motor Vehicles',v:40e9,s:8}],
      totalExports:560e9, totalImports:530e9,
      hdi:0.935, hdiRank:11, gini:33.3, inflation:3.9, unemployment:5.4,
      debtGdp:107.5, fdi:40e9, electricity:100, internet:97, lifeExp:82.7, literacy:99,
      rrs:80, tagline:'Resource-rich northern giant', paradox:null, tools:[], isRef:true
    },
    MY: {
      name:'Malaysia', slug:'malaysia', flag:'🇲🇾', region:'ref', capital:'Kuala Lumpur',
      population:34300000, popGrowth:1.1,
      gdp:399e9, gdpPpp:1.17e12, gdpPC:11630, gdpPCppp:34100, gdpGrowth:3.7,
      gdpHist:{1990:44.0e9,2000:93.8e9,2010:255e9,2015:296e9,2020:337e9,2024:399e9},
      currency:{code:'MYR',name:'Malaysian Ringgit',sym:'RM'},
      resources:[{type:'oil',rank:null,prod:'570K bpd',share:0,global:25,note:'Petronas'}],
      exports:[{p:'Electronics',v:80e9,s:20}],
      imports:[{p:'Electronics',v:60e9,s:15}],
      totalExports:340e9, totalImports:300e9,
      hdi:0.803, hdiRank:63, gini:41.2, inflation:2.5, unemployment:3.3,
      debtGdp:65.6, fdi:18e9, electricity:100, internet:96, lifeExp:76.1, literacy:95,
      rrs:50, tagline:'Tiger economy that diversified from tin and rubber', paradox:null, tools:[], isRef:true
    },
    TH: {
      name:'Thailand', slug:'thailand', flag:'🇹🇭', region:'ref', capital:'Bangkok',
      population:72000000, popGrowth:0.1,
      gdp:515e9, gdpPpp:1.56e12, gdpPC:7150, gdpPCppp:21670, gdpGrowth:1.9,
      gdpHist:{1990:85.6e9,2000:126e9,2010:341e9,2015:401e9,2020:500e9,2024:515e9},
      currency:{code:'THB',name:'Thai Baht',sym:'฿'},
      resources:[{type:'farm',rank:null,prod:'Rice: 20M tonnes/yr',share:0,global:2,note:'World\'s 2nd-largest rice exporter'}],
      exports:[{p:'Electronics',v:40e9,s:12}],
      imports:[{p:'Crude Petroleum',v:30e9,s:8}],
      totalExports:300e9, totalImports:290e9,
      hdi:0.800, hdiRank:66, gini:34.9, inflation:1.2, unemployment:1.0,
      debtGdp:61.7, fdi:10e9, electricity:100, internet:85, lifeExp:79.3, literacy:94,
      rrs:30, tagline:'Southeast Asian manufacturing hub', paradox:null, tools:[], isRef:true
    },
    ID: {
      name:'Indonesia', slug:'indonesia', flag:'🇮🇩', region:'ref', capital:'Jakarta',
      population:277000000, popGrowth:0.8,
      gdp:1.37e12, gdpPpp:4.40e12, gdpPC:4950, gdpPCppp:15880, gdpGrowth:5.1,
      gdpHist:{1990:114e9,2000:165e9,2010:755e9,2015:861e9,2020:1.06e12,2024:1.37e12},
      currency:{code:'IDR',name:'Indonesian Rupiah',sym:'Rp'},
      resources:[{type:'coal',rank:null,prod:'775M tonnes/yr',share:0,global:3,note:'Major coal exporter'}],
      exports:[{p:'Palm Oil',v:25e9,s:10}],
      imports:[{p:'Refined Petroleum',v:20e9,s:5}],
      totalExports:260e9, totalImports:240e9,
      hdi:0.713, hdiRank:112, gini:37.9, inflation:3.7, unemployment:5.3,
      debtGdp:39.0, fdi:21e9, electricity:97, internet:66, lifeExp:67.6, literacy:96,
      rrs:65, tagline:'World\'s largest archipelago and nickel superpower', paradox:null, tools:[], isRef:true
    },
    MX: {
      name:'Mexico', slug:'mexico', flag:'🇲🇽', region:'ref', capital:'Mexico City',
      population:130000000, popGrowth:0.6,
      gdp:1.79e12, gdpPpp:3.05e12, gdpPC:13770, gdpPCppp:23470, gdpGrowth:3.2,
      gdpHist:{1990:263e9,2000:684e9,2010:1.05e12,2015:1.17e12,2020:1.08e12,2024:1.79e12},
      currency:{code:'MXN',name:'Mexican Peso',sym:'$'},
      resources:[{type:'oil',rank:null,prod:'1.6M bpd',share:0,global:12,note:'Pemex, declining fields'}],
      exports:[{p:'Motor Vehicles',v:80e9,s:12}],
      imports:[{p:'Refined Petroleum',v:30e9,s:5}],
      totalExports:580e9, totalImports:590e9,
      hdi:0.781, hdiRank:74, gini:45.4, inflation:4.7, unemployment:2.8,
      debtGdp:55.5, fdi:36e9, electricity:99, internet:76, lifeExp:75.0, literacy:95,
      rrs:50, tagline:'NAFTA manufacturing powerhouse', paradox:null, tools:[], isRef:true
    },
    CL: {
      name:'Chile', slug:'chile', flag:'🇨🇱', region:'ref', capital:'Santiago',
      population:19500000, popGrowth:0.5,
      gdp:335e9, gdpPpp:588e9, gdpPC:17180, gdpPCppp:30150, gdpGrowth:2.0,
      gdpHist:{1990:33.1e9,2000:79.3e9,2010:218e9,2015:243e9,2020:253e9,2024:335e9},
      currency:{code:'CLP',name:'Chilean Peso',sym:'$'},
      resources:[{type:'copper',rank:null,prod:'5.3M tonnes/yr',share:0,global:1,note:'World\'s largest copper producer — Escondida mine'}],
      exports:[{p:'Copper',v:50e9,s:50}],
      imports:[{p:'Crude Petroleum',v:10e9,s:8}],
      totalExports:100e9, totalImports:95e9,
      hdi:0.860, hdiRank:42, gini:44.9, inflation:7.6, unemployment:8.5,
      debtGdp:38.0, fdi:21e9, electricity:100, internet:90, lifeExp:80.2, literacy:97,
      rrs:60, tagline:'Copper giant and Latin America\'s freest economy', paradox:null, tools:[], isRef:true
    }
  };

  // ========== PURE FUNCTIONS ==========

  function getCountry(codeOrSlug) {
    if (!codeOrSlug) return null;
    var upper = codeOrSlug.toUpperCase();
    if (COUNTRIES[upper]) return COUNTRIES[upper];
    var slug = codeOrSlug.toLowerCase();
    var keys = Object.keys(COUNTRIES);
    for (var i = 0; i < keys.length; i++) {
      if (COUNTRIES[keys[i]].slug === slug) return COUNTRIES[keys[i]];
    }
    return null;
  }

  function getAllCountries() {
    return Object.values(COUNTRIES);
  }

  function getWorldRef(code) {
    if (!code) return null;
    var upper = code.toUpperCase();
    if (WORLD_REF[upper]) return WORLD_REF[upper];
    var slug = code.toLowerCase();
    var keys = Object.keys(WORLD_REF);
    for (var i = 0; i < keys.length; i++) {
      if (WORLD_REF[keys[i]].slug === slug) return WORLD_REF[keys[i]];
    }
    return null;
  }

  function _getNestedValue(obj, field) {
    var parts = field.split('.');
    var val = obj;
    for (var i = 0; i < parts.length; i++) {
      if (val == null) return null;
      val = val[parts[i]];
    }
    return val;
  }

  function rankCountries(field, limit) {
    var all = getAllCountries();
    var valid = all.filter(function(c) {
      var v = _getNestedValue(c, field);
      return typeof v === 'number' && !isNaN(v);
    });
    valid.sort(function(a, b) {
      return (_getNestedValue(b, field) || 0) - (_getNestedValue(a, field) || 0);
    });
    if (limit && limit > 0) valid = valid.slice(0, limit);
    return valid.map(function(c, i) {
      return { rank: i + 1, code: _findCode(c), country: c, value: _getNestedValue(c, field) };
    });
  }

  function _findCode(country) {
    var keys = Object.keys(COUNTRIES);
    for (var i = 0; i < keys.length; i++) {
      if (COUNTRIES[keys[i]] === country) return keys[i];
    }
    return null;
  }

  function countriesByResource(type) {
    if (!type) return [];
    var typeLower = type.toLowerCase();
    var results = [];
    var keys = Object.keys(COUNTRIES);
    for (var i = 0; i < keys.length; i++) {
      var c = COUNTRIES[keys[i]];
      if (!c.resources) continue;
      for (var j = 0; j < c.resources.length; j++) {
        if (c.resources[j].type === typeLower) {
          results.push({ code: keys[i], country: c, resource: c.resources[j] });
          break;
        }
      }
    }
    results.sort(function(a, b) {
      var ra = a.resource.rank != null ? a.resource.rank : 999;
      var rb = b.resource.rank != null ? b.resource.rank : 999;
      return ra - rb;
    });
    return results;
  }

  function compareCountries(a, b) {
    var c1 = getCountry(a) || getWorldRef(a);
    var c2 = getCountry(b) || getWorldRef(b);
    if (!c1 || !c2) return null;

    var fields = ['gdp','gdpPC','gdpPCppp','population','hdi','gini','inflation',
      'unemployment','debtGdp','electricity','internet','lifeExp','literacy','rrs',
      'totalExports','totalImports'];
    var metrics = {};
    for (var i = 0; i < fields.length; i++) {
      var f = fields[i];
      var v1 = c1[f];
      var v2 = c2[f];
      if (typeof v1 === 'number' && typeof v2 === 'number' && v2 !== 0) {
        metrics[f] = { a: v1, b: v2, ratio: +(v1 / v2).toFixed(2) };
      }
    }
    return { c1: c1, c2: c2, metrics: metrics };
  }

  function generateInsights(a, b) {
    var comp = compareCountries(a, b);
    if (!comp) return ['Unable to compare: one or both countries not found.'];
    var c1 = comp.c1, c2 = comp.c2, m = comp.metrics;
    var insights = [];

    if (m.gdp) {
      var bigger = m.gdp.a > m.gdp.b ? c1.name : c2.name;
      var ratio = m.gdp.a > m.gdp.b ? m.gdp.ratio : +(m.gdp.b / m.gdp.a).toFixed(1);
      insights.push(bigger + '\'s economy is ' + ratio + 'x larger by nominal GDP.');
    }
    if (m.gdpPC) {
      var richer = m.gdpPC.a > m.gdpPC.b ? c1.name : c2.name;
      var poorer = m.gdpPC.a > m.gdpPC.b ? c2.name : c1.name;
      var diff = Math.abs(m.gdpPC.a - m.gdpPC.b);
      insights.push(richer + ' earns $' + diff.toLocaleString() + ' more per capita than ' + poorer + '.');
    }
    if (m.hdi) {
      var higher = m.hdi.a > m.hdi.b ? c1.name : c2.name;
      insights.push(higher + ' ranks higher on the Human Development Index (' +
        Math.max(m.hdi.a, m.hdi.b).toFixed(3) + ' vs ' + Math.min(m.hdi.a, m.hdi.b).toFixed(3) + ').');
    }
    if (m.population) {
      var pop1 = (c1.population / 1e6).toFixed(1);
      var pop2 = (c2.population / 1e6).toFixed(1);
      insights.push(c1.name + ' has ' + pop1 + 'M people vs ' + c2.name + '\'s ' + pop2 + 'M.');
    }
    if (m.electricity) {
      insights.push('Electricity access: ' + c1.name + ' ' + c1.electricity + '% vs ' +
        c2.name + ' ' + c2.electricity + '%.');
    }
    if (m.lifeExp) {
      insights.push('Life expectancy: ' + c1.name + ' ' + c1.lifeExp + ' years vs ' +
        c2.name + ' ' + c2.lifeExp + ' years.');
    }
    if (m.unemployment) {
      insights.push('Unemployment: ' + c1.name + ' ' + c1.unemployment + '% vs ' +
        c2.name + ' ' + c2.unemployment + '%.');
    }

    return insights.slice(0, 7);
  }

  function calculateResourceScore(code) {
    var c = getCountry(code);
    if (!c || !c.resources || c.resources.length === 0) return 0;

    var diversity = Math.min(c.resources.length / 5, 1) * 30;
    var shareScore = 0;
    var globalScore = 0;
    for (var i = 0; i < c.resources.length; i++) {
      var r = c.resources[i];
      if (typeof r.share === 'number') shareScore += Math.min(r.share, 50);
      if (typeof r.global === 'number' && r.global > 0) globalScore += Math.max(0, 20 - r.global);
    }
    shareScore = Math.min(shareScore / c.resources.length * 1.5, 40);
    globalScore = Math.min(globalScore / c.resources.length * 2, 30);

    return Math.round(Math.min(diversity + shareScore + globalScore, 100));
  }

  function getParadoxes() {
    var all = getAllCountries();
    return all
      .filter(function(c) { return c.paradox != null; })
      .sort(function(a, b) { return (b.rrs || 0) - (a.rrs || 0); })
      .map(function(c) {
        return { name: c.name, flag: c.flag, rrs: c.rrs, paradox: c.paradox, tagline: c.tagline };
      });
  }

  function getGdpTimeline(code) {
    var c = getCountry(code) || getWorldRef(code);
    if (!c || !c.gdpHist) return null;
    return c.gdpHist;
  }

  function searchCountries(query) {
    if (!query) return [];
    var q = query.toLowerCase();
    var all = getAllCountries();
    return all.filter(function(c) {
      if (c.name.toLowerCase().indexOf(q) !== -1) return true;
      if (c.slug.toLowerCase().indexOf(q) !== -1) return true;
      if (c.capital.toLowerCase().indexOf(q) !== -1) return true;
      if (c.resources) {
        for (var i = 0; i < c.resources.length; i++) {
          var r = c.resources[i];
          if (r.type.toLowerCase().indexOf(q) !== -1) return true;
          if (r.note && r.note.toLowerCase().indexOf(q) !== -1) return true;
          var rt = RESOURCE_TYPES[r.type];
          if (rt && rt.label.toLowerCase().indexOf(q) !== -1) return true;
        }
      }
      if (c.tagline && c.tagline.toLowerCase().indexOf(q) !== -1) return true;
      return false;
    });
  }

  function getAggregateStats() {
    var all = getAllCountries();
    var totalGDP = 0, totalPop = 0, hdiSum = 0, hdiCount = 0;
    var totalExports = 0, totalImports = 0;
    for (var i = 0; i < all.length; i++) {
      var c = all[i];
      if (typeof c.gdp === 'number') totalGDP += c.gdp;
      if (typeof c.population === 'number') totalPop += c.population;
      if (typeof c.hdi === 'number') { hdiSum += c.hdi; hdiCount++; }
      if (typeof c.totalExports === 'number') totalExports += c.totalExports;
      if (typeof c.totalImports === 'number') totalImports += c.totalImports;
    }
    return {
      totalCountries: all.length,
      totalGDP: totalGDP,
      totalPopulation: totalPop,
      avgHDI: hdiCount > 0 ? +(hdiSum / hdiCount).toFixed(3) : 0,
      totalExports: totalExports,
      totalImports: totalImports,
      regions: Object.keys(REGIONS).length,
      resourceTypes: Object.keys(RESOURCE_TYPES).length
    };
  }

  function getRegions() {
    return REGIONS;
  }

  function getResourceTypes() {
    return RESOURCE_TYPES;
  }

  // ========== PUBLIC API ==========
  return {
    getCountry: getCountry,
    getAllCountries: getAllCountries,
    getWorldRef: getWorldRef,
    rankCountries: rankCountries,
    countriesByResource: countriesByResource,
    compareCountries: compareCountries,
    generateInsights: generateInsights,
    calculateResourceScore: calculateResourceScore,
    getParadoxes: getParadoxes,
    getGdpTimeline: getGdpTimeline,
    searchCountries: searchCountries,
    getAggregateStats: getAggregateStats,
    getRegions: getRegions,
    getResourceTypes: getResourceTypes,
    COUNTRIES: COUNTRIES,
    WORLD_REF: WORLD_REF,
    RESOURCE_TYPES: RESOURCE_TYPES,
    REGIONS: REGIONS
  };
})();
