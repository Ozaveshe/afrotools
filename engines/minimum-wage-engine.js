// engines/minimum-wage-engine.js
// AfroTools Minimum Wage Engine — All 54 African Countries
// IIFE — exposes window.AfroTools.MinWageEngine
(function () {
  'use strict';

  // Approximate exchange rates: local currency per 1 USD (April 2026)
  var USD_RATES = {
    DZ:135, AO:870,  BJ:620,  BW:13.9, BF:620,  BI:2870, CV:100,  CM:620,
    CF:620, TD:620,  KM:450,  CG:620,  CD:2800, CI:620,  DJ:178,  EG:50,
    GQ:620, ER:15,   SZ:18.6, ET:134,  GA:620,  GM:67,   GH:15,   GN:8600,
    GW:620, KE:130,  LS:18.6, LR:150,  LY:4.85, MG:4800, MW:1650, ML:620,
    MR:37.5,MU:45,   MA:10,   MZ:63.5, NA:18.6, NE:620,  NG:1650, RW:1370,
    ST:23.8,SN:620,  SC:13.7, SL:21.4, SO:571,  ZA:18,   SS:2700, SD:2800,
    TZ:2570,TG:620,  TN:3.16, UG:3700, ZM:26.5, ZW:1
  };

  // Full 54-country minimum wage data
  var MW_DATA = {
    NG: {
      name:'Nigeria', flag:'🇳🇬', currency:'NGN', symbol:'₦',
      monthly:70000, basis:'monthly',
      effectiveDate:'April 2024', law:'National Minimum Wage (Amendment) Act 2024',
      sectors:[
        {name:'Federal / Large Employers (25+ employees)', rate:'₦70,000', period:'month'},
        {name:'Private Sector (<25 employees)',            rate:'₦50,000', period:'month'},
        {name:'Domestic Workers',                          rate:'₦50,000', period:'month'}
      ],
      history:[
        {year:'2024', nominal:70000,  amount:'₦70,000'},
        {year:'2019', nominal:30000,  amount:'₦30,000'},
        {year:'2011', nominal:18000,  amount:'₦18,000'},
        {year:'2000', nominal:5500,   amount:'₦5,500'}
      ],
      livingWage:150000, livingWageFamily:280000, livingWageSource:'WageIndicator 2025',
      notes:'The ₦70,000 minimum was signed in April 2024 after tripartite negotiations. States must implement within 6 months. Rivers State set ₦85,000. Small businesses (<25 employees) floor is ₦50,000. NSIWC oversees enforcement.',
      observation:'Nigeria raised its minimum wage from ₦30,000 to ₦70,000 in 2024 — a 133% increase. However, with annual CPI inflation exceeding 30%, purchasing power has eroded sharply. In 2019 terms, ₦70,000 is worth about ₦20,000 — below the ₦30,000 then in force. The living wage for a Lagos family of 4 is estimated at ₦280,000 — 4× the legal minimum.'
    },
    KE: {
      name:'Kenya', flag:'🇰🇪', currency:'KES', symbol:'KES ',
      monthly:16114, basis:'monthly',
      effectiveDate:'May 2023', law:'Labour Institutions Act (Revised 2022)',
      sectors:[
        {name:'General — Nairobi / Mombasa', rate:'KES 16,114', period:'month'},
        {name:'General — Other Areas',       rate:'KES 13,572', period:'month'},
        {name:'Agriculture (Unskilled)',      rate:'KES 8,163',  period:'month'},
        {name:'Security Guards',              rate:'KES 13,572', period:'month'}
      ],
      history:[
        {year:'2023', nominal:16114, amount:'KES 16,114'},
        {year:'2022', nominal:15120, amount:'KES 15,120'},
        {year:'2018', nominal:13572, amount:'KES 13,572'},
        {year:'2015', nominal:12926, amount:'KES 12,926'}
      ],
      livingWage:35000, livingWageFamily:68000, livingWageSource:'WageIndicator 2025',
      notes:'Kenya has a tiered minimum wage system by location and skill. Nairobi and Mombasa pay 19% more than other areas. Agriculture workers earn roughly half the urban minimum. The Minister for Labour reviews every 2 years via gazette notices.',
      observation:'Kenya uses a location-tiered system — urban workers earn significantly more than rural counterparts. Agriculture workers earn roughly half the city minimum. The gap between KES 16,114 urban minimum and the estimated KES 35,000 living wage is large, especially in Nairobi where housing costs are high. Labour courts are active in wage disputes.'
    },
    ZA: {
      name:'South Africa', flag:'🇿🇦', currency:'ZAR', symbol:'R',
      monthly:5765, basis:'hourly', hourlyRate:27.58,
      effectiveDate:'March 2025', law:'National Minimum Wage Act (2018), Annual Review',
      sectors:[
        {name:'National Minimum Wage (General)', rate:'R27.58', period:'hour'},
        {name:'Farm Workers',                     rate:'R27.58', period:'hour'},
        {name:'Domestic Workers',                 rate:'R27.58', period:'hour'},
        {name:'Expanded Public Works (EPWP)',      rate:'R15.16', period:'hour'}
      ],
      history:[
        {year:'2025', nominal:5765,  amount:'R27.58/hr'},
        {year:'2024', nominal:5311,  amount:'R25.42/hr'},
        {year:'2023', nominal:4848,  amount:'R23.19/hr'},
        {year:'2022', nominal:4528,  amount:'R21.69/hr'},
        {year:'2019', nominal:4180,  amount:'R20.00/hr'}
      ],
      livingWage:9500, livingWageFamily:18000, livingWageSource:'PACSA 2025',
      notes:'South Africa unified its minimum wage under the NMW Act in 2019. Farm and domestic workers now receive the same rate. The EPWP (public works relief programme) has a lower rate. The NMW Commission reviews annually based on CPI, productivity, and employer capacity.',
      observation:'South Africa has one of Africa\'s most structured minimum wage frameworks, with annual CPI-linked reviews. Farm and domestic workers (previously excluded) joined the NMW in 2019 — a major equality milestone. Non-compliance carries penalties up to 3× the underpayment. The R27.58/hr general rate equals about R5,765/month based on 26 working days.'
    },
    GH: {
      name:'Ghana', flag:'🇬🇭', currency:'GHS', symbol:'GHS ',
      monthly:544.50, basis:'daily', dailyRate:18.15,
      effectiveDate:'January 2025', law:'National Daily Minimum Wage Declaration',
      sectors:[
        {name:'National Daily Minimum', rate:'GHS 18.15', period:'day'},
        {name:'Formal Sector',           rate:'GHS 18.15', period:'day'}
      ],
      history:[
        {year:'2025', nominal:544.50, amount:'GHS 18.15/day'},
        {year:'2024', nominal:446.40, amount:'GHS 14.88/day'},
        {year:'2023', nominal:446.40, amount:'GHS 14.88/day'},
        {year:'2022', nominal:405.90, amount:'GHS 13.53/day'}
      ],
      livingWage:2000, livingWageFamily:4200, livingWageSource:'WageIndicator 2025',
      notes:'Ghana sets a national daily minimum wage reviewed annually by the National Tripartite Committee. The 2025 increase of 22% reflects high inflation. Most formal sector workers earn above the minimum. Enforcement is weaker in the informal sector (~80% of employment).',
      observation:'Ghana uses a daily rate system with annual tripartite review. The 22% increase for 2025 was inflation-driven. The informal sector employs ~80% of workers, limiting the law\'s practical reach. At roughly $36/month, it is one of the lower rates in West Africa despite relatively strong institutions.'
    },
    EG: {
      name:'Egypt', flag:'🇪🇬', currency:'EGP', symbol:'EGP ',
      monthly:6000, basis:'monthly',
      effectiveDate:'May 2024', law:'National Wages Council Decision',
      sectors:[
        {name:'Public Sector',  rate:'EGP 6,000', period:'month'},
        {name:'Private Sector', rate:'EGP 6,000', period:'month'}
      ],
      history:[
        {year:'2024', nominal:6000, amount:'EGP 6,000'},
        {year:'2023', nominal:3500, amount:'EGP 3,500'},
        {year:'2022', nominal:2700, amount:'EGP 2,700'},
        {year:'2021', nominal:2400, amount:'EGP 2,400'}
      ],
      livingWage:10000, livingWageFamily:19000, livingWageSource:'WageIndicator 2025',
      notes:'Egypt raised its minimum wage to EGP 6,000 in 2024, a 71% increase driven by pound devaluation and inflation. The National Wages Council includes government, employer, and worker representatives. Public sector compliance is high; private sector is improving.',
      observation:'Egypt has aggressively raised its minimum wage to counter pound devaluation — from EGP 2,400 (2021) to EGP 6,000 (2024), a 150% increase. Despite this, real purchasing power has declined due to inflation exceeding 30%. At about $120/month at the official rate, it is mid-range for North Africa.'
    },
    ET: {
      name:'Ethiopia', flag:'🇪🇹', currency:'ETB', symbol:'ETB ',
      monthly:0, basis:'none',
      effectiveDate:'N/A', law:'No national minimum wage legislation (private sector)',
      sectors:[
        {name:'Government Employees', rate:'ETB 765', period:'month'},
        {name:'Private Sector',       rate:'Not set', period:'—'}
      ],
      history:[],
      livingWage:0, livingWageFamily:0, livingWageSource:'',
      notes:'Ethiopia has no national minimum wage for the private sector — one of only a few African countries without one. Government employees have a de facto floor of ~ETB 765/month. A minimum wage bill has been under discussion since 2019.',
      observation:'Ethiopia is one of the few African countries with no statutory minimum wage for the private sector. This has attracted manufacturing FDI (garment/textile industrial parks) but drawn criticism from labour rights groups. A minimum wage bill has been in discussion since 2019 with no passage.'
    },
    TZ: {
      name:'Tanzania', flag:'🇹🇿', currency:'TZS', symbol:'TZS ',
      monthly:300000, basis:'monthly',
      effectiveDate:'July 2024', law:'Wage Order under the Employment and Labour Relations Act',
      sectors:[
        {name:'Agriculture',       rate:'TZS 200,000', period:'month'},
        {name:'Manufacturing',     rate:'TZS 300,000', period:'month'},
        {name:'Service & Commerce',rate:'TZS 300,000', period:'month'},
        {name:'Mining',            rate:'TZS 450,000', period:'month'},
        {name:'Telecommunications',rate:'TZS 430,000', period:'month'}
      ],
      history:[
        {year:'2024', nominal:300000, amount:'TZS 300,000'},
        {year:'2013', nominal:150000, amount:'TZS 150,000'}
      ],
      livingWage:500000, livingWageFamily:950000, livingWageSource:'WageIndicator 2025',
      notes:'Tanzania went 11 years without a minimum wage revision (2013–2024). The 2024 revision doubled most sector rates. Mining and telecoms have the highest floors. A sector-based wage board system covers 12 industries.',
      observation:'Tanzania went 11 years (2013–2024) without a minimum wage revision — one of the longest gaps in Africa. The 2024 revision doubled most rates. Mining workers earn 2–3× the agricultural minimum. The sector board system provides granularity but is complex to administer and enforce.'
    },
    UG: {
      name:'Uganda', flag:'🇺🇬', currency:'UGX', symbol:'UGX ',
      monthly:6000, basis:'monthly',
      effectiveDate:'1984 (unchanged)', law:'Minimum Wages Advisory Board Act (1957)',
      sectors:[], history:[{year:'1984', nominal:6000, amount:'UGX 6,000'}],
      livingWage:0, livingWageFamily:0, livingWageSource:'',
      notes:'Uganda has not revised its minimum wage since 1984. UGX 6,000 is worth less than $2 at current rates. A Minimum Wages Bill has been under debate since 2015.',
      observation:'Uganda has the most outdated minimum wage in Africa — UGX 6,000/month unchanged since 1984 (less than $2). It is functionally non-existent. Market wages in Kampala are 50–100× higher, but vulnerable workers (domestic, agricultural) have no statutory floor. A new Minimum Wages Bill has stalled in Parliament since 2015.'
    },
    RW: {
      name:'Rwanda', flag:'🇷🇼', currency:'RWF', symbol:'RWF ',
      monthly:0, basis:'none',
      effectiveDate:'N/A', law:'No comprehensive national minimum wage',
      sectors:[
        {name:'Tea Sector',     rate:'RWF 1,500', period:'day'},
        {name:'Other Sectors',  rate:'Not set',   period:'—'}
      ],
      history:[],
      livingWage:0, livingWageFamily:0, livingWageSource:'',
      notes:'Rwanda has no comprehensive national minimum wage. Ministerial orders cover certain sectors (tea). The government favours market-based wage determination and skills development over minimum wage regulation.',
      observation:'Rwanda takes a market-driven approach — no comprehensive minimum wage law. Only certain sectors (tea) have gazetted floors. The government argues minimum wages could harm employment in a developing economy, while labour advocates push for worker protection. Rapid economic growth has raised average wages, but inequality persists.'
    },
    CI: {
      name:"Côte d'Ivoire", flag:'🇨🇮', currency:'XOF', symbol:'FCFA ',
      monthly:75000, basis:'monthly',
      effectiveDate:'January 2023', law:'Salaire Minimum Interprofessionnel Garanti (SMIG)',
      sectors:[
        {name:'SMIG (General)',      rate:'FCFA 75,000', period:'month'},
        {name:'SMAG (Agriculture)',  rate:'FCFA 36,607', period:'month'}
      ],
      history:[
        {year:'2023', nominal:75000, amount:'FCFA 75,000'},
        {year:'2013', nominal:60000, amount:'FCFA 60,000'}
      ],
      livingWage:150000, livingWageFamily:290000, livingWageSource:'WageIndicator 2025',
      notes:"Côte d'Ivoire uses SMIG (interprofessional) and SMAG (agricultural) rates. The CFA franc peg to the euro provides relative wage stability in forex terms.",
      observation:"Côte d'Ivoire raised its SMIG from FCFA 60,000 to FCFA 75,000 in 2023 after a decade without change. The agricultural minimum (SMAG) remains much lower, affecting cocoa and coffee workers who are the backbone of the economy. The CFA franc euro peg provides stability in USD terms."
    },
    SN: {
      name:'Senegal', flag:'🇸🇳', currency:'XOF', symbol:'FCFA ',
      monthly:65014, basis:'hourly', hourlyRate:370.54,
      effectiveDate:'June 2024', law:'Salaire Minimum Interprofessionnel Garanti (SMIG)',
      sectors:[
        {name:'SMIG (General)',  rate:'FCFA 370.54', period:'hour'},
        {name:'Agriculture',     rate:'FCFA 297.43', period:'hour'}
      ],
      history:[
        {year:'2024', nominal:65014, amount:'FCFA 370.54/hr'},
        {year:'2018', nominal:53248, amount:'FCFA 302.89/hr'}
      ],
      livingWage:130000, livingWageFamily:250000, livingWageSource:'WageIndicator 2025',
      notes:'Senegal sets an hourly SMIG reviewed periodically. Agricultural workers have a lower rate. Enforcement is stronger in Dakar than in rural areas.',
      observation:'Senegal raised its SMIG by about 22% in 2024. The powerful trade unions (CNTS and CSA) negotiate regular increases. The CFA franc peg provides stability. Enforcement is concentrated in Dakar; rural compliance is much weaker.'
    },
    CM: {
      name:'Cameroon', flag:'🇨🇲', currency:'XAF', symbol:'FCFA ',
      monthly:41875, basis:'monthly',
      effectiveDate:'July 2023', law:'Salaire Minimum Interprofessionnel Garanti (SMIG)',
      sectors:[{name:'SMIG (General)', rate:'FCFA 41,875', period:'month'}],
      history:[
        {year:'2023', nominal:41875, amount:'FCFA 41,875'},
        {year:'2014', nominal:36270, amount:'FCFA 36,270'}
      ],
      livingWage:90000, livingWageFamily:170000, livingWageSource:'WageIndicator 2025',
      notes:'Cameroon raised its SMIG by about 15% in 2023 after nearly a decade. The CFA franc peg provides stability. Enforcement differs between Francophone and Anglophone regions.',
      observation:'Cameroon raised its SMIG by about 15% in 2023 after 9 years. At about $68/month, it is one of the lower rates in the CFA zone. The bilingual country has uneven enforcement across its Francophone and Anglophone regions.'
    },
    MA: {
      name:'Morocco', flag:'🇲🇦', currency:'MAD', symbol:'MAD ',
      monthly:3111, basis:'hourly', hourlyRate:17.12,
      effectiveDate:'September 2024', law:'Code du Travail — SMIG/SMAG Review',
      sectors:[
        {name:'SMIG (Non-Agricultural)', rate:'MAD 17.12',   period:'hour'},
        {name:'SMAG (Agriculture)',       rate:'MAD 99.47',   period:'day'}
      ],
      history:[
        {year:'2024', nominal:3111, amount:'MAD 17.12/hr'},
        {year:'2023', nominal:2965, amount:'MAD 16.29/hr'},
        {year:'2022', nominal:2830, amount:'MAD 15.55/hr'}
      ],
      livingWage:5000, livingWageFamily:9500, livingWageSource:'WageIndicator 2025',
      notes:'Morocco reviews SMIG and SMAG annually as part of social dialogue. 5% annual increases since 2022 reflect the government\'s commitment to social peace.',
      observation:'Morocco has a well-structured dual minimum wage — SMIG for industry/services and SMAG for agriculture. Regular 5% annual increases reflect strong tripartite social dialogue. Enforcement is relatively strong for North Africa. The 2024 social dialogue agreement commits to continued increases through 2026.'
    },
    TN: {
      name:'Tunisia', flag:'🇹🇳', currency:'TND', symbol:'TND ',
      monthly:480, basis:'monthly',
      effectiveDate:'May 2024', law:'Salaire Minimum Interprofessionnel Garanti (SMIG)',
      sectors:[
        {name:'SMIG (48hr regime)',   rate:'TND 480',       period:'month'},
        {name:'SMIG (40hr regime)',   rate:'TND 416',       period:'month'},
        {name:'SMAG (Agriculture)',   rate:'TND 18.872',    period:'day'}
      ],
      history:[
        {year:'2024', nominal:480, amount:'TND 480'},
        {year:'2023', nominal:450, amount:'TND 450'},
        {year:'2022', nominal:420, amount:'TND 420'}
      ],
      livingWage:900, livingWageFamily:1700, livingWageSource:'WageIndicator 2025',
      notes:'Tunisia has two SMIG regimes (48hr and 40hr work weeks) plus a separate SMAG. Rates are reviewed annually by the Ministry of Social Affairs with UGTT (union) and UTICA (employers).',
      observation:'Tunisia maintains a complex system with different rates for 48hr vs 40hr work regimes. The UGTT trade union is one of Africa\'s most powerful and negotiates regular increases. Political instability since 2021 has not disrupted wage negotiations — a sign of strong institutional capacity.'
    },
    AO: {
      name:'Angola', flag:'🇦🇴', currency:'AOA', symbol:'AOA ',
      monthly:32181, basis:'monthly',
      effectiveDate:'July 2023', law:'Presidential Decree on National Minimum Wage',
      sectors:[
        {name:'Commerce / Industry', rate:'AOA 32,181', period:'month'},
        {name:'Agriculture',          rate:'AOA 21,454', period:'month'},
        {name:'Transport',            rate:'AOA 26,818', period:'month'}
      ],
      history:[
        {year:'2023', nominal:32181, amount:'AOA 32,181'},
        {year:'2019', nominal:21454, amount:'AOA 21,454'}
      ],
      livingWage:60000, livingWageFamily:110000, livingWageSource:'WageIndicator 2025',
      notes:'Angola has a sector-based minimum wage system. Commerce and industry have the highest floor. Agriculture has the lowest. Rapid kwanza depreciation has eroded real purchasing power.',
      observation:'Angola uses sector-specific minimum wages, with commerce/industry the highest. The kwanza has depreciated sharply, meaning dollar-equivalent wages have dropped even as nominal values rose. Oil sector workers earn many multiples of the minimum.'
    },
    ZM: {
      name:'Zambia', flag:'🇿🇲', currency:'ZMW', symbol:'ZMW ',
      monthly:1698, basis:'monthly',
      effectiveDate:'April 2024', law:'Minimum Wages and Conditions of Employment Act',
      sectors:[
        {name:'Shop Workers',    rate:'ZMW 1,698', period:'month'},
        {name:'General Workers', rate:'ZMW 1,698', period:'month'},
        {name:'Domestic Workers',rate:'ZMW 1,132', period:'month'}
      ],
      history:[
        {year:'2024', nominal:1698, amount:'ZMW 1,698'},
        {year:'2019', nominal:1132, amount:'ZMW 1,132'}
      ],
      livingWage:3200, livingWageFamily:6000, livingWageSource:'WageIndicator 2025',
      notes:'Zambia raised minimum wages by 50% in 2024. Domestic workers have a lower rate. Enforcement is concentrated in urban areas — Lusaka and the Copperbelt.',
      observation:'Zambia raised minimum wages by 50% in 2024 — one of the largest single increases in recent African history. Domestic workers still receive a lower rate. The Ministry of Labour and Social Security is improving enforcement capacity in urban centres.'
    },
    ZW: {
      name:'Zimbabwe', flag:'🇿🇼', currency:'USD', symbol:'US$',
      monthly:250, basis:'monthly',
      effectiveDate:'October 2024', law:'National Employment Council Agreements',
      sectors:[
        {name:'General (USD)',   rate:'US$250', period:'month'},
        {name:'Agriculture',     rate:'US$175', period:'month'},
        {name:'Domestic Workers',rate:'US$100', period:'month'}
      ],
      history:[
        {year:'2024', nominal:250, amount:'US$250'},
        {year:'2023', nominal:200, amount:'US$200'}
      ],
      livingWage:450, livingWageFamily:850, livingWageSource:'WageIndicator 2025',
      notes:'Zimbabwe prices minimum wages in USD due to chronic local currency instability. Zimbabwe Gold (ZiG) equivalents are specified but USD remains the practical standard.',
      observation:'Zimbabwe prices its minimum wage in USD due to chronic local currency instability. The shift to ZiG (Zimbabwe Gold) currency adds complexity. In practice, many workers prefer USD payment. Compliance varies significantly between formal and informal sectors.'
    },
    MU: {
      name:'Mauritius', flag:'🇲🇺', currency:'MUR', symbol:'MUR ',
      monthly:15000, basis:'monthly',
      effectiveDate:'January 2024', law:'National Minimum Wage Regulations',
      sectors:[
        {name:'National Minimum',       rate:'MUR 15,000', period:'month'},
        {name:'Export Processing Zone', rate:'MUR 15,000', period:'month'}
      ],
      history:[
        {year:'2024', nominal:15000, amount:'MUR 15,000'},
        {year:'2023', nominal:11575, amount:'MUR 11,575'},
        {year:'2020', nominal:9000,  amount:'MUR 9,000'}
      ],
      livingWage:22000, livingWageFamily:42000, livingWageSource:'WageIndicator 2025',
      notes:'Mauritius introduced its national minimum wage in 2018. The 2024 increase of nearly 30% was significant. Sector-specific Remuneration Orders may set higher floors for certain industries.',
      observation:'Mauritius has one of the most progressive minimum wage systems in Africa. The NMW was introduced in 2018 and increased regularly. At about $330/month, it is among the highest in Sub-Saharan Africa. Strong enforcement through labour inspectors.'
    },
    BW: {
      name:'Botswana', flag:'🇧🇼', currency:'BWP', symbol:'BWP ',
      monthly:1500, basis:'hourly', hourlyRate:8.65,
      effectiveDate:'March 2024', law:'Employment Act — Minimum Wages Order',
      sectors:[
        {name:'General',       rate:'BWP 8.65', period:'hour'},
        {name:'Manufacturing', rate:'BWP 8.65', period:'hour'}
      ],
      history:[
        {year:'2024', nominal:1500, amount:'BWP 8.65/hr'},
        {year:'2022', nominal:1272, amount:'BWP 7.34/hr'}
      ],
      livingWage:3000, livingWageFamily:5500, livingWageSource:'WageIndicator 2025',
      notes:'Botswana sets hourly minimum wages reviewed every 2 years. The stable pula and relatively strong economy mean the minimum wage has reasonable purchasing power.',
      observation:'Botswana has relatively strong labour protections for the region. The minimum wage is reviewed biennially and has been keeping pace with inflation. Diamond revenues fund social services that supplement wage income. At about $108/month, it is mid-range for Southern Africa.'
    },
    NA: {
      name:'Namibia', flag:'🇳🇦', currency:'NAD', symbol:'NAD ',
      monthly:7000, basis:'monthly',
      effectiveDate:'April 2024', law:'Minimum Wage Order under the Labour Act',
      sectors:[
        {name:'General',         rate:'NAD 7,000', period:'month'},
        {name:'Farm Workers',    rate:'NAD 5,600', period:'month'},
        {name:'Domestic Workers',rate:'NAD 4,900', period:'month'}
      ],
      history:[
        {year:'2024', nominal:7000, amount:'NAD 7,000'},
        {year:'2022', nominal:5200, amount:'NAD 5,200'}
      ],
      livingWage:13000, livingWageFamily:25000, livingWageSource:'WageIndicator 2025',
      notes:'Namibia has sector-specific minimum wages. Farm and domestic workers have lower rates. The Labour Advisory Council advises the Minister of Labour. NAD is pegged 1:1 to the South African rand.',
      observation:'Namibia raised minimum wages significantly in 2024. Farm and domestic worker rates remain lower — a point of ongoing labour union advocacy. The NAD/ZAR 1:1 peg means South African inflation dynamics directly affect Namibian purchasing power.'
    },
    MW: {
      name:'Malawi', flag:'🇲🇼', currency:'MWK', symbol:'MWK ',
      monthly:50000, basis:'monthly',
      effectiveDate:'July 2024', law:'Employment Act — Minimum Wage Order',
      sectors:[{name:'General', rate:'MWK 50,000', period:'month'}],
      history:[
        {year:'2024', nominal:50000, amount:'MWK 50,000'},
        {year:'2022', nominal:35000, amount:'MWK 35,000'}
      ],
      livingWage:90000, livingWageFamily:170000, livingWageSource:'WageIndicator 2025',
      notes:'Malawi has a national minimum wage applicable across all sectors. The kwacha has depreciated significantly, reducing the USD value. The Ministry of Labour reviews periodically.',
      observation:'Malawi raised its minimum wage to MWK 50,000 in 2024, but kwacha depreciation means the USD equivalent is very low (about $30/month). Enforcement is limited, especially in agriculture and the informal sector.'
    },
    MZ: {
      name:'Mozambique', flag:'🇲🇿', currency:'MZN', symbol:'MZN ',
      monthly:6030, basis:'monthly',
      effectiveDate:'April 2024', law:'Minimum Wage by Sector — Annual Gazette',
      sectors:[
        {name:'Agriculture',        rate:'MZN 5,150',  period:'month'},
        {name:'Manufacturing',      rate:'MZN 6,030',  period:'month'},
        {name:'Services',           rate:'MZN 6,030',  period:'month'},
        {name:'Mining',             rate:'MZN 14,218', period:'month'},
        {name:'Financial Services', rate:'MZN 15,285', period:'month'}
      ],
      history:[
        {year:'2024', nominal:6030, amount:'MZN 6,030'},
        {year:'2023', nominal:5565, amount:'MZN 5,565'}
      ],
      livingWage:12000, livingWageFamily:22000, livingWageSource:'WageIndicator 2025',
      notes:'Mozambique uses a detailed sector-based system with rates gazetted annually after tripartite negotiations. Mining and financial services have the highest minimums.',
      observation:'Mozambique has one of the most granular sector-based systems in Africa — mining and financial services workers earn 2–3× the agricultural minimum. The annual tripartite review is well-structured. At about $95/month for manufacturing, it is mid-range for East Africa.'
    },
    MG: {
      name:'Madagascar', flag:'🇲🇬', currency:'MGA', symbol:'MGA ',
      monthly:250000, basis:'monthly',
      effectiveDate:'January 2024', law:'Decree on Minimum Wage (SMIG/SMAG)',
      sectors:[
        {name:'SMIG (Non-Agricultural)', rate:'MGA 250,000', period:'month'},
        {name:'SMAG (Agriculture)',       rate:'MGA 200,000', period:'month'}
      ],
      history:[
        {year:'2024', nominal:250000, amount:'MGA 250,000'},
        {year:'2019', nominal:200000, amount:'MGA 200,000'}
      ],
      livingWage:450000, livingWageFamily:850000, livingWageSource:'WageIndicator 2025',
      notes:"Madagascar uses SMIG/SMAG like francophone African countries. Ariary depreciation means very low purchasing power in international terms.",
      observation:'Madagascar has one of the lowest minimum wages in the world in USD terms (about $52/month). The SMIG/SMAG distinction follows the French-influenced system. Despite periodic increases, real wages have stagnated due to currency depreciation.'
    },
    LS: {
      name:'Lesotho', flag:'🇱🇸', currency:'LSL', symbol:'LSL ',
      monthly:2400, basis:'monthly',
      effectiveDate:'April 2024', law:'Labour Code Order — Minimum Wage',
      sectors:[
        {name:'Garment / Textile', rate:'LSL 2,400', period:'month'},
        {name:'General',           rate:'LSL 1,800', period:'month'}
      ],
      history:[
        {year:'2024', nominal:2400, amount:'LSL 2,400'},
        {year:'2022', nominal:2100, amount:'LSL 2,100'}
      ],
      livingWage:4500, livingWageFamily:8500, livingWageSource:'WageIndicator 2025',
      notes:"Lesotho's minimum wage is heavily influenced by its garment manufacturing sector. The loti is pegged 1:1 to the South African rand.",
      observation:"Lesotho's minimum wage system is shaped by its garment industry, the country's largest private employer. The garment sector rate is higher to attract and retain workers. The LSL/ZAR peg means South African inflation directly affects purchasing power."
    },
    SZ: {
      name:'Eswatini', flag:'🇸🇿', currency:'SZL', symbol:'SZL ',
      monthly:2200, basis:'monthly',
      effectiveDate:'July 2024', law:'Employment Act — Wages Order',
      sectors:[
        {name:'Manufacturing',   rate:'SZL 2,200', period:'month'},
        {name:'Domestic Workers',rate:'SZL 1,050', period:'month'}
      ],
      history:[
        {year:'2024', nominal:2200, amount:'SZL 2,200'},
        {year:'2022', nominal:1800, amount:'SZL 1,800'}
      ],
      livingWage:4200, livingWageFamily:7800, livingWageSource:'WageIndicator 2025',
      notes:'Eswatini has sector-specific minimum wages. Domestic workers receive the lowest rate. The lilangeni is pegged 1:1 to the South African rand.',
      observation:"Eswatini's minimum wage is relatively low for the SACU region. Labour activism has pushed for higher rates, but the monarchy-led government has been cautious. The SZL/ZAR peg means South African wage dynamics influence expectations."
    },
    BJ: {
      name:'Benin', flag:'🇧🇯', currency:'XOF', symbol:'FCFA ',
      monthly:52000, basis:'monthly',
      effectiveDate:'January 2024', law:'Salaire Minimum Interprofessionnel Garanti (SMIG)',
      sectors:[{name:'SMIG', rate:'FCFA 52,000', period:'month'}],
      history:[
        {year:'2024', nominal:52000, amount:'FCFA 52,000'},
        {year:'2014', nominal:40000, amount:'FCFA 40,000'}
      ],
      livingWage:100000, livingWageFamily:190000, livingWageSource:'WageIndicator 2025',
      notes:'Benin raised its SMIG after a decade in 2024. Enforcement is limited in the informal sector, which accounts for the majority of employment.',
      observation:'Benin raised its SMIG from FCFA 40,000 to FCFA 52,000 in 2024 — the first increase in a decade. The CFA franc peg provides stability. Most workers are in the informal sector where the SMIG has little practical effect.'
    },
    BF: {
      name:'Burkina Faso', flag:'🇧🇫', currency:'XOF', symbol:'FCFA ',
      monthly:45000, basis:'monthly',
      effectiveDate:'January 2024', law:'SMIG (Salaire Minimum Interprofessionnel Garanti)',
      sectors:[{name:'SMIG', rate:'FCFA 45,000', period:'month'}],
      history:[
        {year:'2024', nominal:45000, amount:'FCFA 45,000'},
        {year:'2006', nominal:30684, amount:'FCFA 30,684'}
      ],
      livingWage:90000, livingWageFamily:170000, livingWageSource:'WageIndicator 2025',
      notes:'Burkina Faso raised its SMIG after an 18-year gap. Political instability has delayed labour reforms. Gold mining workers typically earn well above the minimum.',
      observation:'Burkina Faso went 18 years without a minimum wage increase (2006–2024). The military government raised it in 2024. At about $73/month, it is one of the lower rates in the CFA zone. Gold mining is the main formal sector paying above minimum.'
    },
    ML: {
      name:'Mali', flag:'🇲🇱', currency:'XOF', symbol:'FCFA ',
      monthly:40000, basis:'monthly',
      effectiveDate:'January 2023', law:'SMIG — Inter-professional Guaranteed Minimum Wage',
      sectors:[{name:'SMIG', rate:'FCFA 40,000', period:'month'}],
      history:[
        {year:'2023', nominal:40000, amount:'FCFA 40,000'},
        {year:'2015', nominal:28460, amount:'FCFA 28,460'}
      ],
      livingWage:80000, livingWageFamily:150000, livingWageSource:'WageIndicator 2025',
      notes:"Mali's minimum wage is one of the lower rates in the CFA zone. Political instability has hampered labour policy reform. Gold mining is the main formal sector employer.",
      observation:'Mali has a low SMIG even by CFA zone standards. Multiple coups since 2020 have disrupted governance, but the transitional government managed a SMIG increase in 2023. Gold mining dominates formal employment at rates far above the minimum.'
    },
    NE: {
      name:'Niger', flag:'🇳🇪', currency:'XOF', symbol:'FCFA ',
      monthly:30047, basis:'monthly',
      effectiveDate:'January 2012 (unchanged)', law:'SMIG',
      sectors:[{name:'SMIG', rate:'FCFA 30,047', period:'month'}],
      history:[{year:'2012', nominal:30047, amount:'FCFA 30,047'}],
      livingWage:65000, livingWageFamily:120000, livingWageSource:'WageIndicator 2025',
      notes:'Niger has not revised its SMIG since 2012. Political instability following the 2023 coup has stalled reforms. About 80% of the population works in agriculture.',
      observation:'Niger has one of the lowest minimum wages in Africa and has not revised it since 2012. The 2023 military coup and ECOWAS sanctions have further delayed labour reforms. The SMIG is functionally irrelevant for most workers, who are in subsistence agriculture.'
    },
    TG: {
      name:'Togo', flag:'🇹🇬', currency:'XOF', symbol:'FCFA ',
      monthly:52500, basis:'monthly',
      effectiveDate:'January 2024', law:'SMIG',
      sectors:[{name:'SMIG', rate:'FCFA 52,500', period:'month'}],
      history:[
        {year:'2024', nominal:52500, amount:'FCFA 52,500'},
        {year:'2012', nominal:35000, amount:'FCFA 35,000'}
      ],
      livingWage:100000, livingWageFamily:190000, livingWageSource:'WageIndicator 2025',
      notes:'Togo raised its SMIG significantly in 2024 after 12 years. The phosphate mining sector pays well above minimum wage.',
      observation:'Togo raised its SMIG by 50% in 2024 after 12 years without change. At about $85/month, it is now mid-range for the CFA zone. Enforcement remains a challenge in the large informal sector.'
    },
    GN: {
      name:'Guinea', flag:'🇬🇳', currency:'GNF', symbol:'GNF ',
      monthly:550000, basis:'monthly',
      effectiveDate:'January 2024', law:'SMIG',
      sectors:[{name:'SMIG', rate:'GNF 550,000', period:'month'}],
      history:[
        {year:'2024', nominal:550000, amount:'GNF 550,000'},
        {year:'2019', nominal:440000, amount:'GNF 440,000'}
      ],
      livingWage:1100000, livingWageFamily:2100000, livingWageSource:'WageIndicator 2025',
      notes:'Guinea uses the GNF franc (separate from CFA). The mining sector (bauxite, gold) dominates formal employment and pays well above the minimum wage.',
      observation:"Guinea's minimum wage is set at GNF 550,000, about $64/month. The bauxite mining sector — which dominates the formal economy — pays far above this. The military junta that took power in 2021 has maintained the SMIG framework."
    },
    SL: {
      name:'Sierra Leone', flag:'🇸🇱', currency:'SLE', symbol:'SLE ',
      monthly:600, basis:'monthly',
      effectiveDate:'January 2023', law:'Minimum Wage Act',
      sectors:[{name:'General', rate:'SLE 600', period:'month'}],
      history:[
        {year:'2023', nominal:600, amount:'SLE 600'},
        {year:'2015', nominal:500, amount:'SLE 500'}
      ],
      livingWage:1300, livingWageFamily:2400, livingWageSource:'WageIndicator 2025',
      notes:'Sierra Leone redenominated its currency (old Leones to new Leones at 1000:1) in 2022. The minimum wage is SLE 600 in new Leones (about $28/month).',
      observation:'Sierra Leone has a low minimum wage. The 2022 currency redenomination adds confusion — SLE 600 new Leones equals 600,000 old Leones. Real enforcement is very limited outside Freetown. Iron ore mining pays above minimum.'
    },
    LR: {
      name:'Liberia', flag:'🇱🇷', currency:'LRD', symbol:'LRD ',
      monthly:6000, basis:'monthly',
      effectiveDate:'2016 (unchanged)', law:'Decent Work Act',
      sectors:[{name:'General', rate:'LRD 6,000 or US$40', period:'month'}],
      history:[{year:'2016', nominal:6000, amount:'US$40 / LRD 6,000'}],
      livingWage:12000, livingWageFamily:22000, livingWageSource:'WageIndicator 2025',
      notes:"Liberia's minimum wage was set in 2016 at US$40/month (or LRD equivalent). It has not been revised. Many formal sector contracts are denominated in USD.",
      observation:"Liberia's minimum wage of US$40/month was set in 2016 and not revised since. The dual currency system (USD and LRD) complicates enforcement. Rubber, palm oil, and mining are the main formal employers."
    },
    GM: {
      name:'Gambia', flag:'🇬🇲', currency:'GMD', symbol:'GMD ',
      monthly:3500, basis:'daily', dailyRate:150,
      effectiveDate:'January 2024', law:'Labour Act — Minimum Wage Order',
      sectors:[{name:'General', rate:'GMD 150', period:'day'}],
      history:[
        {year:'2024', nominal:3500, amount:'GMD 150/day'},
        {year:'2015', nominal:1250, amount:'GMD 50/day'}
      ],
      livingWage:7000, livingWageFamily:13000, livingWageSource:'WageIndicator 2025',
      notes:'Gambia tripled its daily minimum wage in 2024. The dalasi has been relatively stable. Tourism and groundnut exports are major economic drivers.',
      observation:'Gambia tripled its minimum wage from GMD 50 to GMD 150/day in 2024 — a significant catch-up after nearly a decade. At about $2/day (~$52/month), it remains one of the lower rates in West Africa.'
    },
    GW: {
      name:'Guinea-Bissau', flag:'🇬🇼', currency:'XOF', symbol:'FCFA ',
      monthly:28000, basis:'monthly',
      effectiveDate:'2015 (unchanged)', law:'SMIG',
      sectors:[{name:'SMIG', rate:'FCFA 28,000', period:'month'}],
      history:[{year:'2015', nominal:28000, amount:'FCFA 28,000'}],
      livingWage:60000, livingWageFamily:110000, livingWageSource:'WageIndicator 2025',
      notes:'Guinea-Bissau has one of the lowest minimum wages in the CFA zone and has not revised it since 2015. Cashew nut production dominates the economy.',
      observation:'Guinea-Bissau has the lowest SMIG in the CFA zone at FCFA 28,000 (about $45/month), unchanged since 2015. Political instability has prevented reforms. The cashew sector employs most of the formal workforce.'
    },
    CV: {
      name:'Cabo Verde', flag:'🇨🇻', currency:'CVE', symbol:'CVE ',
      monthly:14000, basis:'monthly',
      effectiveDate:'January 2024', law:'National Minimum Wage Decree',
      sectors:[{name:'General', rate:'CVE 14,000', period:'month'}],
      history:[
        {year:'2024', nominal:14000, amount:'CVE 14,000'},
        {year:'2020', nominal:13000, amount:'CVE 13,000'}
      ],
      livingWage:26000, livingWageFamily:49000, livingWageSource:'WageIndicator 2025',
      notes:"Cabo Verde's escudo is pegged to the euro. Tourism is the main economic sector and typically pays above minimum wage.",
      observation:'Cabo Verde benefits from a euro-pegged currency that provides stability. The tourism-driven economy means many workers earn above the minimum. At about $140/month, it is mid-range for Africa.'
    },
    MR: {
      name:'Mauritania', flag:'🇲🇷', currency:'MRU', symbol:'MRU ',
      monthly:6000, basis:'monthly',
      effectiveDate:'January 2023', law:'SMIG — Inter-professional Guaranteed Minimum Wage',
      sectors:[{name:'SMIG', rate:'MRU 6,000', period:'month'}],
      history:[
        {year:'2023', nominal:6000, amount:'MRU 6,000'},
        {year:'2011', nominal:3000, amount:'MRU 3,000'}
      ],
      livingWage:11000, livingWageFamily:21000, livingWageSource:'WageIndicator 2025',
      notes:'Mauritania doubled its SMIG in 2023 after 12 years. Iron ore and fishing are major economic sectors. The ouguiya was redenominated in 2018 (new MRU = 10 old MRO).',
      observation:'Mauritania doubled its SMIG in 2023 after 12 years without change. At about $160/month, it is mid-range for West Africa. Iron ore mining dominates the formal economy and pays far above the minimum.'
    },
    DJ: {
      name:'Djibouti', flag:'🇩🇯', currency:'DJF', symbol:'DJF ',
      monthly:35000, basis:'monthly',
      effectiveDate:'2012 (unchanged)', law:'Labour Code — Minimum Wage Decree',
      sectors:[{name:'General', rate:'DJF 35,000', period:'month'}],
      history:[{year:'2012', nominal:35000, amount:'DJF 35,000'}],
      livingWage:60000, livingWageFamily:115000, livingWageSource:'WageIndicator 2025',
      notes:"Djibouti's minimum wage has not been revised since 2012. The DJF is pegged to the USD at a fixed rate (~178 DJF/USD), making this about $197/month.",
      observation:'Djibouti has not revised its minimum wage since 2012. The DJF/USD peg means the rate is about $197/month — relatively high for East Africa. Foreign military base and port employment drives wages well above the minimum for many workers.'
    },
    KM: {
      name:'Comoros', flag:'🇰🇲', currency:'KMF', symbol:'KMF ',
      monthly:55000, basis:'monthly',
      effectiveDate:'2013 (unchanged)', law:'SMIG',
      sectors:[{name:'SMIG', rate:'KMF 55,000', period:'month'}],
      history:[{year:'2013', nominal:55000, amount:'KMF 55,000'}],
      livingWage:100000, livingWageFamily:190000, livingWageSource:'WageIndicator 2025',
      notes:'Comoros has not revised its SMIG since 2013. The Comorian franc is pegged to the euro. Vanilla, cloves, and ylang-ylang exports are the main economic activities.',
      observation:'Comoros has not updated its minimum wage since 2013. At about $122/month (euro-pegged rate), it is mid-range for East Africa. The small island economy has limited formal employment.'
    },
    SC: {
      name:'Seychelles', flag:'🇸🇨', currency:'SCR', symbol:'SCR ',
      monthly:8500, basis:'monthly',
      effectiveDate:'January 2024', law:'Employment Act — Minimum Wage Order',
      sectors:[{name:'General', rate:'SCR 8,500', period:'month'}],
      history:[
        {year:'2024', nominal:8500, amount:'SCR 8,500'},
        {year:'2022', nominal:7300, amount:'SCR 7,300'}
      ],
      livingWage:14000, livingWageFamily:26000, livingWageSource:'WageIndicator 2025',
      notes:'Seychelles has one of the highest minimum wages in Africa relative to cost of living. The tourism-driven economy supports higher wages.',
      observation:'Seychelles has the highest per-capita income in Africa and its minimum wage reflects this. At about $620/month, it is the highest minimum wage on the continent. Tourism dominates the economy and drives above-minimum wages for most formal workers.'
    },
    SO: {
      name:'Somalia', flag:'🇸🇴', currency:'SOS', symbol:'SOS ',
      monthly:0, basis:'none',
      effectiveDate:'N/A', law:'No effective minimum wage legislation',
      sectors:[], history:[],
      livingWage:0, livingWageFamily:0, livingWageSource:'',
      notes:'Somalia does not have an enforced national minimum wage. Decades of conflict and state fragmentation have prevented labour law implementation.',
      observation:'Somalia effectively has no minimum wage due to decades of conflict and state fragmentation. Employment in Mogadishu and international organisations follows informal wage norms, but there is no statutory floor.'
    },
    SD: {
      name:'Sudan', flag:'🇸🇩', currency:'SDG', symbol:'SDG ',
      monthly:21000, basis:'monthly',
      effectiveDate:'January 2024', law:'Labour Act — Minimum Wage Order',
      sectors:[{name:'General', rate:'SDG 21,000', period:'month'}],
      history:[
        {year:'2024', nominal:21000, amount:'SDG 21,000'},
        {year:'2021', nominal:3000,  amount:'SDG 3,000'}
      ],
      livingWage:50000, livingWageFamily:95000, livingWageSource:'WageIndicator 2025',
      notes:'Sudan has raised its minimum wage significantly in nominal terms due to hyperinflation and currency collapse. The civil war since April 2023 has devastated the formal economy.',
      observation:'Sudan raised its minimum wage from SDG 3,000 to SDG 21,000 (600% increase) due to hyperinflation. The ongoing civil war has devastated the formal economy and wage enforcement is effectively non-existent in conflict zones.'
    },
    SS: {
      name:'South Sudan', flag:'🇸🇸', currency:'SSP', symbol:'SSP ',
      monthly:0, basis:'none',
      effectiveDate:'N/A', law:'Labour Act 2017 (minimum wage provision not implemented)',
      sectors:[], history:[],
      livingWage:0, livingWageFamily:0, livingWageSource:'',
      notes:"South Sudan's 2017 Labour Act provides for a minimum wage, but no rate has been set. The country has been in economic crisis since the 2013 civil war.",
      observation:'South Sudan has not set a minimum wage despite the 2017 Labour Act provision. The oil-dependent economy and ongoing instability mean formal employment is very limited. NGO and UN agency jobs are among the highest-paying positions.'
    },
    LY: {
      name:'Libya', flag:'🇱🇾', currency:'LYD', symbol:'LYD ',
      monthly:450, basis:'monthly',
      effectiveDate:'2014 (unchanged)', law:'Labour Law — Public Sector Salary Scale',
      sectors:[
        {name:'Public Sector',  rate:'LYD 450', period:'month'},
        {name:'Private Sector', rate:'LYD 450', period:'month'}
      ],
      history:[{year:'2014', nominal:450, amount:'LYD 450'}],
      livingWage:850, livingWageFamily:1600, livingWageSource:'WageIndicator 2025',
      notes:'Libya has not revised its minimum wage since 2014. Political division (rival governments) complicates labour policy. Oil revenues fund public sector salaries.',
      observation:'Libya has not updated its minimum wage since 2014, before the country fractured into rival governments. Oil revenues fund public sector salaries, but the private sector is largely unregulated. The LYD 450 rate is about $93/month at controlled exchange rates.'
    },
    DZ: {
      name:'Algeria', flag:'🇩🇿', currency:'DZD', symbol:'DZD ',
      monthly:20000, basis:'monthly',
      effectiveDate:'June 2020', law:'SNMG (Salaire National Minimum Garanti)',
      sectors:[{name:'SNMG', rate:'DZD 20,000', period:'month'}],
      history:[
        {year:'2020', nominal:20000, amount:'DZD 20,000'},
        {year:'2012', nominal:18000, amount:'DZD 18,000'}
      ],
      livingWage:38000, livingWageFamily:72000, livingWageSource:'WageIndicator 2025',
      notes:'Algeria uses the SNMG (national guaranteed minimum salary). The rate was last increased in 2020. The dinar has depreciated, reducing purchasing power.',
      observation:'Algeria raised its SNMG from DZD 18,000 to DZD 20,000 in 2020. At about $148/month at the official rate, it is mid-range for North Africa. The oil/gas sector pays well above the minimum. Informal markets offer lower exchange rates.'
    },
    TD: {
      name:'Chad', flag:'🇹🇩', currency:'XAF', symbol:'FCFA ',
      monthly:59995, basis:'monthly',
      effectiveDate:'January 2019', law:'SMIG',
      sectors:[{name:'SMIG', rate:'FCFA 59,995', period:'month'}],
      history:[{year:'2019', nominal:59995, amount:'FCFA 59,995'}],
      livingWage:110000, livingWageFamily:210000, livingWageSource:'WageIndicator 2025',
      notes:'Chad has a SMIG in the CFA zone. Oil sector employment pays well above minimum. The country faces ongoing security challenges that limit economic development.',
      observation:"Chad's SMIG of FCFA 59,995 (about $97/month) has been unchanged since 2019. Oil dominates the formal economy and pays far above minimum. Security challenges and political transition have delayed labour reforms."
    },
    CF: {
      name:'Central African Republic', flag:'🇨🇫', currency:'XAF', symbol:'FCFA ',
      monthly:35000, basis:'monthly',
      effectiveDate:'2008 (unchanged)', law:'SMIG',
      sectors:[{name:'SMIG', rate:'FCFA 35,000', period:'month'}],
      history:[{year:'2008', nominal:35000, amount:'FCFA 35,000'}],
      livingWage:70000, livingWageFamily:130000, livingWageSource:'WageIndicator 2025',
      notes:'CAR has not revised its SMIG since 2008 — the longest gap in the CFA zone. Ongoing conflict and extreme poverty limit formal employment and wage enforcement.',
      observation:'CAR has the most outdated SMIG in the CFA zone, unchanged since 2008. At about $57/month, it is one of the lowest in Africa. Ongoing armed conflict means wage enforcement is virtually impossible outside Bangui.'
    },
    CG: {
      name:'Congo-Brazzaville', flag:'🇨🇬', currency:'XAF', symbol:'FCFA ',
      monthly:90000, basis:'monthly',
      effectiveDate:'October 2023', law:'SMIG',
      sectors:[{name:'SMIG', rate:'FCFA 90,000', period:'month'}],
      history:[
        {year:'2023', nominal:90000, amount:'FCFA 90,000'},
        {year:'2009', nominal:50400, amount:'FCFA 50,400'}
      ],
      livingWage:170000, livingWageFamily:320000, livingWageSource:'WageIndicator 2025',
      notes:'Congo-Brazzaville raised its SMIG significantly in 2023 after 14 years. Oil sector employment pays well above minimum. The formal private sector is small.',
      observation:'Congo-Brazzaville raised its SMIG by 78% in 2023 after 14 years. At FCFA 90,000 (about $146/month), it now has one of the higher minimums in the CFA zone. Oil revenues support the economy.'
    },
    CD: {
      name:'DR Congo', flag:'🇨🇩', currency:'CDF', symbol:'CDF ',
      monthly:7075, basis:'daily', dailyRate:283,
      effectiveDate:'January 2018 (unchanged)', law:'Labour Code — Minimum Wage Decree',
      sectors:[{name:'General', rate:'CDF 7,075 (or US$3.50)', period:'day'}],
      history:[{year:'2018', nominal:7075, amount:'US$3.50/day'}],
      livingWage:20000, livingWageFamily:38000, livingWageSource:'WageIndicator 2025',
      notes:"DRC sets its minimum wage in both CDF and USD equivalents. At US$3.50/day it is one of the lowest in Africa. Mining sector (cobalt, copper) pays far above minimum.",
      observation:'DRC has a very low minimum wage of US$3.50/day, unchanged since 2018. The cobalt and copper mining sector is the main formal employer and pays far above this. Most of the population works in subsistence agriculture.'
    },
    GA: {
      name:'Gabon', flag:'🇬🇦', currency:'XAF', symbol:'FCFA ',
      monthly:150000, basis:'monthly',
      effectiveDate:'September 2023', law:'SMIG',
      sectors:[{name:'SMIG', rate:'FCFA 150,000', period:'month'}],
      history:[
        {year:'2023', nominal:150000, amount:'FCFA 150,000'},
        {year:'2010', nominal:80000,  amount:'FCFA 80,000'}
      ],
      livingWage:280000, livingWageFamily:530000, livingWageSource:'WageIndicator 2025',
      notes:'Gabon has the highest SMIG in the CFA zone, reflecting its oil wealth and higher cost of living. The 2023 increase followed the military coup.',
      observation:'Gabon has the highest minimum wage in the CFA zone at FCFA 150,000 (about $243/month), reflecting its oil-driven economy. The military government that took power in 2023 raised the SMIG as a popular measure.'
    },
    GQ: {
      name:'Equatorial Guinea', flag:'🇬🇶', currency:'XAF', symbol:'FCFA ',
      monthly:129035, basis:'monthly',
      effectiveDate:'2020 (unchanged)', law:'Minimum Wage Decree',
      sectors:[{name:'General', rate:'FCFA 129,035', period:'month'}],
      history:[{year:'2020', nominal:129035, amount:'FCFA 129,035'}],
      livingWage:240000, livingWageFamily:455000, livingWageSource:'WageIndicator 2025',
      notes:'Equatorial Guinea has a relatively high minimum wage due to oil revenues. However, wealth distribution is extremely unequal.',
      observation:'Equatorial Guinea has the second-highest minimum wage in the CFA zone at FCFA 129,035 (about $209/month), driven by oil wealth. However, the country has extreme inequality, and most benefits of oil revenue accrue to a small elite.'
    },
    ST: {
      name:'São Tomé and Príncipe', flag:'🇸🇹', currency:'STN', symbol:'STN ',
      monthly:2500, basis:'monthly',
      effectiveDate:'January 2024', law:'Minimum Wage Decree',
      sectors:[{name:'General', rate:'STN 2,500', period:'month'}],
      history:[
        {year:'2024', nominal:2500, amount:'STN 2,500'},
        {year:'2022', nominal:2000, amount:'STN 2,000'}
      ],
      livingWage:4700, livingWageFamily:8900, livingWageSource:'WageIndicator 2025',
      notes:"São Tomé has a small economy based on cocoa and tourism. The dobra was redenominated in 2018 and is pegged to the euro.",
      observation:'São Tomé and Príncipe has a minimum wage of STN 2,500 (about $105/month). The euro-pegged dobra provides stability. Tourism and cocoa are the main economic activities.'
    },
    BI: {
      name:'Burundi', flag:'🇧🇮', currency:'BIF', symbol:'BIF ',
      monthly:13200, basis:'daily', dailyRate:440,
      effectiveDate:'2010 (unchanged)', law:'Labour Code — Minimum Wage Decree',
      sectors:[{name:'General', rate:'BIF 440', period:'day'}],
      history:[{year:'2010', nominal:13200, amount:'BIF 440/day'}],
      livingWage:28000, livingWageFamily:53000, livingWageSource:'WageIndicator 2025',
      notes:'Burundi has not revised its minimum wage since 2010. At about BIF 440/day, it is one of the lowest in Africa. The country has faced political instability and economic crisis.',
      observation:'Burundi has not updated its minimum wage since 2010. At BIF 440/day (less than $0.20 at market rates), it is one of the lowest minimum wages in the world. Subsistence agriculture employs the vast majority.'
    },
    ER: {
      name:'Eritrea', flag:'🇪🇷', currency:'ERN', symbol:'ERN ',
      monthly:800, basis:'monthly',
      effectiveDate:'2003 (unchanged)', law:'Labour Proclamation',
      sectors:[{name:'General', rate:'ERN 800', period:'month'}],
      history:[{year:'2003', nominal:800, amount:'ERN 800'}],
      livingWage:2000, livingWageFamily:3800, livingWageSource:'WageIndicator 2025',
      notes:'Eritrea has not revised its minimum wage since 2003. The mandatory national service programme pays well below this rate. Private sector employment is very limited.',
      observation:'Eritrea has the most outdated minimum wage on the continent — unchanged since 2003. The mandatory national service programme (often indefinite) pays well below even this rate. Private sector employment is very limited.'
    }
  };

  // Nigeria state-level minimum wage rates (36 states + FCT)
  var NG_STATE_RATES = [
    { code:'FCT', name:'FCT (Abuja)',        rate:70000, effectiveDate:'April 2024' },
    { code:'RV',  name:'Rivers State',       rate:85000, effectiveDate:'October 2024', note:'Governor mandated higher floor' },
    { code:'AB',  name:'Abia State',         rate:70000, effectiveDate:'April 2024' },
    { code:'AD',  name:'Adamawa State',      rate:70000, effectiveDate:'April 2024' },
    { code:'AK',  name:'Akwa Ibom State',    rate:70000, effectiveDate:'April 2024' },
    { code:'AN',  name:'Anambra State',      rate:70000, effectiveDate:'April 2024' },
    { code:'BA',  name:'Bauchi State',       rate:70000, effectiveDate:'April 2024' },
    { code:'BY',  name:'Bayelsa State',      rate:70000, effectiveDate:'April 2024' },
    { code:'BE',  name:'Benue State',        rate:70000, effectiveDate:'April 2024' },
    { code:'BO',  name:'Borno State',        rate:70000, effectiveDate:'April 2024' },
    { code:'CR',  name:'Cross River State',  rate:70000, effectiveDate:'April 2024' },
    { code:'DE',  name:'Delta State',        rate:70000, effectiveDate:'April 2024' },
    { code:'EB',  name:'Ebonyi State',       rate:70000, effectiveDate:'April 2024' },
    { code:'ED',  name:'Edo State',          rate:70000, effectiveDate:'April 2024' },
    { code:'EK',  name:'Ekiti State',        rate:70000, effectiveDate:'April 2024' },
    { code:'EN',  name:'Enugu State',        rate:70000, effectiveDate:'April 2024' },
    { code:'GO',  name:'Gombe State',        rate:70000, effectiveDate:'April 2024' },
    { code:'IM',  name:'Imo State',          rate:70000, effectiveDate:'April 2024' },
    { code:'JI',  name:'Jigawa State',       rate:70000, effectiveDate:'April 2024' },
    { code:'KD',  name:'Kaduna State',       rate:70000, effectiveDate:'April 2024' },
    { code:'KN',  name:'Kano State',         rate:70000, effectiveDate:'April 2024' },
    { code:'KB',  name:'Kebbi State',        rate:70000, effectiveDate:'April 2024' },
    { code:'KO',  name:'Kogi State',         rate:70000, effectiveDate:'April 2024' },
    { code:'KW',  name:'Kwara State',        rate:70000, effectiveDate:'April 2024' },
    { code:'LA',  name:'Lagos State',        rate:70000, effectiveDate:'July 2024' },
    { code:'NAS', name:'Nasarawa State',     rate:70000, effectiveDate:'April 2024' },
    { code:'NI',  name:'Niger State',        rate:70000, effectiveDate:'April 2024' },
    { code:'OG',  name:'Ogun State',         rate:70000, effectiveDate:'April 2024' },
    { code:'ON',  name:'Ondo State',         rate:70000, effectiveDate:'April 2024' },
    { code:'OS',  name:'Osun State',         rate:70000, effectiveDate:'April 2024' },
    { code:'OY',  name:'Oyo State',          rate:70000, effectiveDate:'April 2024' },
    { code:'PL',  name:'Plateau State',      rate:70000, effectiveDate:'April 2024' },
    { code:'SO',  name:'Sokoto State',       rate:70000, effectiveDate:'April 2024' },
    { code:'TA',  name:'Taraba State',       rate:70000, effectiveDate:'April 2024' },
    { code:'YO',  name:'Yobe State',         rate:70000, effectiveDate:'April 2024' },
    { code:'ZA',  name:'Zamfara State',      rate:70000, effectiveDate:'April 2024' }
  ];

  // South Africa sub-sector rates for dropdown
  var ZA_SECTOR_RATES = [
    { code:'general',  name:'National Minimum (General)',                rate:27.58, basis:'hourly', effectiveDate:'March 2025' },
    { code:'farm',     name:'Farm Workers',                              rate:27.58, basis:'hourly', effectiveDate:'March 2025' },
    { code:'domestic', name:'Domestic Workers',                          rate:27.58, basis:'hourly', effectiveDate:'March 2025' },
    { code:'epwp',     name:'EPWP (Expanded Public Works Programme)',    rate:15.16, basis:'hourly', effectiveDate:'March 2025', note:'Government relief workers — lower rate' }
  ];

  // Inflation erosion data: nominal wage + CPI index per year
  // baseYear CPI = 100; real = nominal / (cpi / 100) → expressed in baseYear money
  var INFLATION_DATA = {
    NG: {
      baseYear: 2019, currency: '₦',
      points: [
        { year:2019, nominal:30000, cpi:100  },
        { year:2020, nominal:30000, cpi:115  },
        { year:2021, nominal:30000, cpi:133  },
        { year:2022, nominal:30000, cpi:171  },
        { year:2023, nominal:30000, cpi:243  },
        { year:2024, nominal:70000, cpi:355  },
        { year:2025, nominal:70000, cpi:432  }
      ]
    },
    KE: {
      baseYear: 2019, currency: 'KES ',
      points: [
        { year:2019, nominal:12926, cpi:100 },
        { year:2020, nominal:12926, cpi:104 },
        { year:2021, nominal:13572, cpi:110 },
        { year:2022, nominal:13572, cpi:122 },
        { year:2023, nominal:16114, cpi:134 },
        { year:2024, nominal:16114, cpi:143 },
        { year:2025, nominal:16114, cpi:151 }
      ]
    },
    ZA: {
      baseYear: 2019, currency: 'R',
      points: [
        { year:2019, nominal:3520, cpi:100 },
        { year:2020, nominal:3653, cpi:103 },
        { year:2021, nominal:3817, cpi:107 },
        { year:2022, nominal:3817, cpi:115 },
        { year:2023, nominal:4081, cpi:124 },
        { year:2024, nominal:4474, cpi:132 },
        { year:2025, nominal:4854, cpi:140 }
      ]
    },
    GH: {
      baseYear: 2020, currency: 'GHS ',
      points: [
        { year:2020, nominal:307, cpi:100 },
        { year:2021, nominal:326, cpi:110 },
        { year:2022, nominal:352, cpi:137 },
        { year:2023, nominal:387, cpi:185 },
        { year:2024, nominal:387, cpi:212 },
        { year:2025, nominal:472, cpi:237 }
      ]
    },
    EG: {
      baseYear: 2021, currency: 'EGP ',
      points: [
        { year:2021, nominal:2400, cpi:100 },
        { year:2022, nominal:2700, cpi:114 },
        { year:2023, nominal:3500, cpi:147 },
        { year:2024, nominal:6000, cpi:226 },
        { year:2025, nominal:6000, cpi:268 }
      ]
    },
    TZ: {
      baseYear: 2013, currency: 'TZS ',
      points: [
        { year:2013, nominal:150000, cpi:100 },
        { year:2016, nominal:150000, cpi:121 },
        { year:2019, nominal:150000, cpi:137 },
        { year:2022, nominal:150000, cpi:155 },
        { year:2024, nominal:300000, cpi:171 }
      ]
    },
    MA: {
      baseYear: 2020, currency: 'MAD ',
      points: [
        { year:2020, nominal:2490, cpi:100 },
        { year:2021, nominal:2610, cpi:101 },
        { year:2022, nominal:2737, cpi:108 },
        { year:2023, nominal:2867, cpi:114 },
        { year:2024, nominal:3015, cpi:120 }
      ]
    }
  };

  // ── Helpers ──────────────────────────────────────────────────────────────

  function normalize(d) {
    var monthly = d.monthly || 0;
    var daily, hourly;
    if (d.basis === 'monthly') {
      daily  = monthly / 22;
      hourly = daily / 8;
    } else if (d.basis === 'daily') {
      daily  = d.dailyRate || (monthly / 22);
      if (!monthly) monthly = daily * 22;
      hourly = daily / 8;
    } else if (d.basis === 'hourly') {
      hourly  = d.hourlyRate || 0;
      daily   = hourly * 8;
      monthly = d.monthly || (daily * 22);
    } else {
      monthly = 0; daily = 0; hourly = 0;
    }
    return { monthly: monthly, daily: daily, hourly: hourly };
  }

  function fmt(n, sym) {
    if (n === undefined || n === null || isNaN(n) || n === 0) return 'Not set';
    var s = sym || '';
    if (n >= 1000000) return s + (n / 1000000).toFixed(2) + 'M';
    if (n >= 10000)   return s + Math.round(n).toLocaleString('en');
    if (n >= 1000)    return s + Math.round(n).toLocaleString('en');
    return s + n.toFixed(2);
  }

  function toUSD(monthly, code) {
    if (!monthly) return 0;
    var rate = USD_RATES[code] || 1;
    return Math.round(monthly / rate);
  }

  // ── Engine API ────────────────────────────────────────────────────────────

  var Engine = {

    getCountry: function (code) {
      var d = MW_DATA[code];
      if (!d) return null;
      var r = normalize(d);
      return {
        code: code,
        name: d.name, flag: d.flag, currency: d.currency, symbol: d.symbol,
        monthly: r.monthly, daily: r.daily, hourly: r.hourly,
        basis: d.basis, effectiveDate: d.effectiveDate, law: d.law,
        sectors: d.sectors || [], history: d.history || [],
        livingWage: d.livingWage || 0,
        livingWageFamily: d.livingWageFamily || 0,
        livingWageSource: d.livingWageSource || '',
        notes: d.notes || '', observation: d.observation || '',
        usdMonthly: toUSD(r.monthly, code)
      };
    },

    getAllCountries: function (sortBy) {
      var keys = Object.keys(MW_DATA);
      var arr = [];
      for (var i = 0; i < keys.length; i++) {
        var c = this.getCountry(keys[i]);
        if (c) arr.push(c);
      }
      var by = sortBy || 'usd';
      arr.sort(function (a, b) {
        if (by === 'usd')   return b.usdMonthly - a.usdMonthly;
        if (by === 'local') return b.monthly - a.monthly;
        if (by === 'name')  return a.name.localeCompare(b.name);
        if (by === 'date')  return a.effectiveDate.localeCompare(b.effectiveDate);
        return b.usdMonthly - a.usdMonthly;
      });
      return arr;
    },

    checkCompliance: function (code, salary) {
      var d = this.getCountry(code);
      if (!d) return { error: 'Country not found' };
      if (!d.monthly) return { noMinWage: true, country: d.name, flag: d.flag };
      var diff = salary - d.monthly;
      return {
        compliant:    diff >= 0,
        salary:       salary,
        minimum:      d.monthly,
        diff:         Math.abs(Math.round(diff)),
        diffPct:      Math.round(Math.abs(diff / d.monthly) * 100),
        symbol:       d.symbol,
        currency:     d.currency,
        country:      d.name,
        flag:         d.flag,
        law:          d.law,
        effectiveDate: d.effectiveDate
      };
    },

    getStateRates: function (code) {
      if (code === 'NG') return NG_STATE_RATES;
      if (code === 'ZA') return ZA_SECTOR_RATES;
      return null;
    },

    getInflationData: function (code) {
      return INFLATION_DATA[code] || null;
    },

    exportCSV: function () {
      var header = ['Country', 'Currency', 'Monthly (Local)', 'Monthly (USD Approx)', 'Effective Date', 'Law'];
      var rows = [header];
      var all = this.getAllCountries('name');
      for (var i = 0; i < all.length; i++) {
        var c = all[i];
        rows.push([
          c.name,
          c.currency,
          c.monthly ? Math.round(c.monthly) : 'Not set',
          c.usdMonthly || 'N/A',
          c.effectiveDate,
          c.law
        ]);
      }
      return rows.map(function (r) {
        return r.map(function (v) {
          var s = String(v);
          return (s.indexOf(',') >= 0 || s.indexOf('"') >= 0)
            ? '"' + s.replace(/"/g, '""') + '"' : s;
        }).join(',');
      }).join('\r\n');
    },

    fmt:   fmt,
    toUSD: toUSD
  };

  window.AfroTools = window.AfroTools || {};
  window.AfroTools.MinWageEngine = Engine;

}());
