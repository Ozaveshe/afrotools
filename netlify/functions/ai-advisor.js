// netlify/functions/ai-advisor.js
// Universal AI advisor for all AfroTools calculators
// Proxies requests to Anthropic API using server-side ANTHROPIC_API_KEY
// Rate limiting: 5 calls/day (anonymous), 15 calls/day (logged-in free), unlimited (Pro users)

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const AUTH_SECRET = process.env.AUTH_SECRET;

// In-memory rate limit store (per instance — Netlify Blobs for persistence)
let _rateStore;
async function getRateStore() {
  if (_rateStore) return _rateStore;
  try {
    const { getStore } = await import("@netlify/blobs");
    _rateStore = getStore("rate-limits");
    return _rateStore;
  } catch {
    return null; // Blobs not available, skip rate limiting
  }
}

async function checkRateLimit(event) {
  const store = await getRateStore();
  if (!store) return { allowed: true, remaining: 999 };

  const ip = (event.headers['x-forwarded-for'] || event.headers['client-ip'] || 'unknown').split(',')[0].trim();
  const today = new Date().toISOString().slice(0, 10);
  const key = `ai_rate_${ip}_${today}`;

  // Check if user is authenticated (higher limit)
  let limit = 5; // anonymous users: 5 requests/day
  let isPro = false;
  let isLoggedIn = false;
  const authHeader = event.headers.authorization || '';
  if (authHeader.startsWith('Bearer ') && AUTH_SECRET) {
    try {
      const { createHmac } = await import("crypto");
      const token = authHeader.replace('Bearer ', '');
      const [b64, sig] = token.split('.');
      const expected = createHmac('sha256', AUTH_SECRET).update(b64).digest('base64url');
      if (sig === expected) {
        const payload = JSON.parse(Buffer.from(b64, 'base64url').toString());
        if (payload.exp > Date.now()) {
          isPro = payload.tier === 'pro';
          isLoggedIn = true;
          limit = isPro ? Infinity : 15; // Pro: unlimited, logged-in free: 15/day
        }
      }
    } catch {}
  }

  let count = 0;
  try {
    const stored = await store.get(key, { type: 'text' });
    if (stored) count = parseInt(stored, 10) || 0;
  } catch {}

  if (count >= limit) {
    return { allowed: false, remaining: 0, limit, resetAt: today + 'T23:59:59Z' };
  }

  // Increment
  try { await store.set(key, String(count + 1), { metadata: { ttl: 86400 } }); } catch {}

  return { allowed: true, remaining: limit - count - 1, limit };
}

// Per-country/tool context injected into system prompt
const TOOL_CONTEXT = {
  // ── PAYE ─────────────────────────────────────────────────────────────
  "ng-paye": "Nigeria PAYE expert. FIRS 6-band tax 7–24%. CRA = higher of (NGN 200k + 20% gross) or 1% gross. NHF 2.5% (not deductible). Pension 8% employee (deductible). Tax = (gross − pension − CRA) × band rates. Personal income tax governed by PITA (amended 2025).",
  "ke-paye": "Kenya PAYE expert. KRA 5-band tax 10–35% (monthly): 10% ≤24k, 25% 24k-32.3k, 30% 32.3k-500k, 32.5% 500k-800k, 35% >800k. NSSF Tier I+II max KES 4,320/month employee. SHIF 2.75% gross (replaced NHIF Oct 2024), min KES 300. Housing Levy 1.5%. SHIF+AHL are pre-tax deductions. Personal relief KES 2,400/month. SHIF relief and AHL tax relief repealed Dec 2024.",
  "za-paye": "South Africa PAYE expert. SARS 7-band tax 2025/26: 18% on R0-R237,100 rising to 45% above R1,817,000. Primary rebate R17,235, secondary R9,444 (65+). Medical aid credits R364/month (member), R364 (first dependent), R246 each additional. UIF 1% employee max R177.12/month. No compulsory pension deduction but deductible up to 27.5% of taxable income.",
  "gh-paye": "Ghana PAYE expert. GRA 7-band PAYE: 0% ≤GHS 490/month, 5%, 10%, 17.5%, 25%, 30%, 35% on excess above GHS 50,000/month. SSNIT 5.5% employee (insurable cap GHS 61,000/yr, max GHS 3,355/yr). Tier III voluntary tax-deductible up to 16.5% basic salary.",
  "eg-paye": "Egypt PAYE expert. ETA 7-band income tax on annual income: 0% ≤EGP 40k, 10% to 55k, 15% to 70k, 20% to 200k, 22.5% to 400k, 25% to 1.2M, 27.5% above. NOSI social insurance 11% employee (insurable ceiling EGP 14,500/month). Health insurance 1% gross.",
  "tz-paye": "Tanzania PAYE expert. TRA 5-band monthly PAYE: 0% ≤TZS 270k, 8% on 270k-520k excess, TZS 20k + 20% on 520k-760k, TZS 68k + 25% on 760k-1M, TZS 128k + 30% above TZS 1M. NSSF 10% employee (deductible). Secondary employment: flat 30% no deductions.",
  "ug-paye": "Uganda PAYE expert. URA 5-band monthly PAYE: 0% ≤UGX 235k, 10% on 235k-335k excess, 20% on 335k-410k, 30% on 410k-10M, 40% above UGX 10M. NSSF 5% employee — NOT deductible from taxable income (key difference from neighbours). LST deducted July–October annually.",
  "rw-paye": "Rwanda PAYE expert. RRA 3-band monthly PAYE: 0% ≤RWF 30k, 20% on 30k-100k excess, 30% above RWF 100k. RSSB 6% employee (deductible). RSSB employer 6%. Both increase 2% annually until reaching 20% in 2030. Maternity levy 0.3% employer-only.",
  "et-paye": "Ethiopia PAYE expert. ERCA 6-band monthly PAYE: 0% ≤ETB 600, 10% to 1,650, 15% to 3,200, 20% to 5,250, 25% to 7,800, 30% to 10,900, 35% above. Pension 7% employee (deductible for civil servants). Taxable income = gross − pension.",
  "sn-paye": "Senegal PAYE expert. DGID IRPP progressive income tax. IPRES (private sector pension) 5.6% employee. CSS social security 5.6% employee. Minimum taxable income threshold 630k CFA/year.",
  "ci-paye": "Côte d'Ivoire PAYE expert. DGI IRPP progressive rates. CNPS contributions: employee pension ~6.3%. Tax calculated on net salary after social charges.",
  "cm-paye": "Cameroon PAYE expert. DGI IRPP progressive: 11 bands up to 38.5%. CNPS pension 4.2% employee. Additional community tax (centimes additionnels communaux) 10% of IRPP.",
  "ma-paye": "Morocco PAYE expert. DGI IR (income tax) progressive: 0% ≤MAD 30k/year, 10% to 50k, 20% to 60k, 30% to 80k, 34% to 180k, 38% above. CNSS 4.48% employee. AMO (health) 2.26% employee. Professional expenses deduction 20% gross (max MAD 30k).",
  "tn-paye": "Tunisia PAYE expert. DGI IRPP progressive: 0% ≤TND 5,000/year, 26% to 20k, 28% to 30k, 32% to 50k, 35% above. CNSS employee 9.18%. Additional deductions: social security, professional expenses 10%.",
  "dz-paye": "Algeria PAYE expert. DGI IRG progressive on monthly: 0% ≤15,000 DZD, 20% to 20k, 24% to 30k, 27% to 50k, 30% to 120k, 35% above. CNAS social security 9% employee. Professional expenses deduction 25%.",
  "bw-paye": "Botswana PAYE expert. BURS progressive: 0% ≤BWP 48,000/year (4,000/month), 5% to 84k, 12.5% to 120k, 18.75% to 156k, 25% above. BPOPF or employer pension scheme.",
  "na-paye": "Namibia PAYE expert. NamRA progressive: 0% ≤NAD 50,000/year, 18% to 100k, 25% to 300k, 28% to 500k, 30% to 800k, 32% to 1.5M, 37% above. SSC (Social Security) 0.9% employee max NAD 81/month.",
  "zm-paye": "Zambia PAYE expert. ZRA progressive monthly: 0% ≤ZMW 4,800, 20% on 4,801-8,000, 30% on 8,001-12,100, 37.5% above. NAPSA 5% employee max ZMW 255/month (not deductible from taxable income).",
  "zw-paye": "Zimbabwe PAYE expert. ZIMRA progressive rates on ZWL/USD income. AIDS levy 3% on income tax payable. NSSA contributions required.",
  "mu-paye": "Mauritius PAYE expert. MRA flat 15% tax rate on net income above MUR 325,000/year. NSF 3% employee. CSG (Contribution Sociale Généralisée) 1.5% for employees earning <MUR 50k/month.",
  "mg-paye": "Madagascar PAYE expert. DGI IRSA (tax on wages) progressive. CNaPS (social security) 1% employee. Professional tax deduction.",
  "mw-paye": "Malawi PAYE expert. MRA graduated tax: 0% ≤MWK 100,000/month, 15% to 400k, 25% to 800k, 30% to 1M, 35% above. MASM pension 10% employee.",
  "sz-paye": "Eswatini PAYE expert. SRA progressive: 20–33% bands. SNPF (National Provident Fund) 5% employee.",
  "ls-paye": "Lesotho PAYE expert. LRA progressive: 20% to LSL 59,136/year, 30% above. LNPF pension contributions.",

  // ── VAT ──────────────────────────────────────────────────────────────
  "ke-vat": "Kenya VAT expert. KRA standard 16%, petroleum reduced 8%, zero-rated: exports, coffee/tea. Exempt: financial services, medical, education, agricultural inputs, passenger transport. Registration threshold KES 5M/year. eTIMS mandatory for VAT-registered businesses.",
  "ng-vat": "Nigeria VAT expert. FIRS 7.5% flat rate on almost all goods/services. Zero-rated: non-oil exports, diplomatic goods. Exempt: unprocessed food, pharmaceutical products, baby products, agricultural inputs, commercial vehicles, educational materials. Registration threshold NGN 25M/year.",
  "za-vat": "South Africa VAT expert. SARS 15% standard. Zero-rated: exports, agricultural products, petrol, paraffin, bread, maize meal, milk, eggs, fruit/vegetables, legumes. Exempt: residential rentals, financial services, passenger transport. Vendor registration threshold ZAR 1M/year. Voluntary registration at ZAR 50k.",
  "gh-vat": "Ghana VAT expert. GRA: 15% VAT + 2.5% NHIL + 1% GetFund = 18.5% effective rate for standard. COVID levy 1% was removed 2024. Flat rate scheme (VAT Flat Rate Scheme — VFRS) 4% for small traders. Registration threshold GHS 200,000/year.",
  "eg-vat": "Egypt VAT expert. ETA 14% standard rate (raised from 13% in 2017). Reduced 5% on some goods. Table tax on certain services. Zero-rated: exports. Exempt: food staples, medicines, education. Registration threshold EGP 500k/year.",
  "rw-vat": "Rwanda VAT expert. RRA 18% standard. Zero-rated: exports, agricultural exports. Exempt: medical services, pharmaceuticals, education, unprocessed food. Registration threshold RWF 20M/year.",
  "ug-vat": "Uganda VAT expert. URA 18% standard. Zero-rated: exports, water supply. Exempt: unprocessed food, education, medical services, agricultural inputs, financial services. Threshold UGX 150M/year.",
  "tz-vat": "Tanzania VAT expert. TRA 18% standard. Zero-rated: exports, safari/tourism. Exempt: unprocessed food, educational services, financial services, medical. Threshold TZS 200M/year.",
  "et-vat": "Ethiopia VAT expert. ERCA 15% standard. Zero-rated: exports, international transport. Exempt: agricultural inputs, medical, education, financial services, water. Threshold ETB 1M/year.",

  // ── MEDICAL ────────────────────────────────────────────────────────
  "medical-report": "Medical lab report interpreter. You help non-medical people understand their blood test and lab results in plain, simple language. When given lab values, explain what each test measures, whether the result is normal/high/low based on standard reference ranges, what abnormal values might indicate, and what questions to ask their doctor. Be reassuring but honest. Always remind them this is educational, not a diagnosis. Use everyday language — avoid jargon. If a value is critically abnormal (e.g., very high glucose, very low hemoglobin), flag it clearly and urge them to see a doctor promptly. Cover CBC, lipid panel, liver function (ALT, AST, ALP, bilirubin), kidney function (creatinine, BUN, eGFR), thyroid (TSH, T3, T4), diabetes (glucose, HbA1c), iron studies, vitamins, cardiac markers, and urinalysis.",

  // ── JAPA ───────────────────────────────────────────────────────────
  "japa-calculator": "African relocation/migration (Japa) expert. You help people planning to relocate from African countries understand visa pathways, costs, timelines, and requirements for destinations including Canada, UK, US, Germany, Netherlands, Australia, UAE, and others. Reference specific visa fees, processing times, and proof-of-funds requirements. Be practical and specific with numbers.",
  "japa-visa-predict": "Visa success prediction expert for African migrants. Assess visa application strength based on education, work experience, English proficiency, finances, job offers, and personal factors. Give a realistic success percentage and specific recommendations to improve chances. Be honest about challenges while remaining encouraging.",

  // ── AFROPRICES ─────────────────────────────────────────────────────
  "afroprices": "You are AfroPrices AI — a shopping advisor for African consumers. You help people find the best deals on products across their country. YOUR ROLE: 1) Summarize which option offers the best VALUE (not just lowest price — consider warranty, delivery, trust) 2) Give a price range if exact prices aren't available 3) Flag if a price seems unusually low (possible fake/refurbished) 4) Recommend best time to buy if seasonal patterns exist (e.g., Black Friday, Ramadan sales) 5) Suggest alternatives if the exact product isn't available locally. RULES: Always use local currency, never USD. Be specific about WHERE to buy — name the platform or market. For physical markets, include practical tips (bargaining expected, cash only, etc.). Keep responses under 100 words. Users are on mobile. If a product has import duty implications, mention the AfroTools Import Duty Calculator. Never recommend products you haven't been asked about.",

  // ── AFROKITCHEN ───────────────────────────────────────────────────
  "afrokitchen": "You are AfroKitchen AI — an expert on African cuisine from all 54 countries. You help people cook authentic African food. YOUR CAPABILITIES: 1) INGREDIENT SUBSTITUTIONS — suggest alternatives with impact on flavor 2) DIETARY MODIFICATIONS — vegan, gluten-free, diabetic-friendly 3) SCALING ADVICE — adjust technique for large batches, not just quantities 4) TECHNIQUE HELP — troubleshoot common cooking problems 5) CULTURAL CONTEXT — origin stories, regional differences, traditional serving 6) PAIRING SUGGESTIONS — side dishes, drinks 7) TROUBLESHOOTING — fix mushy rice, watery stew, too spicy 8) STORAGE — freezing, reheating, shelf life. RULES: Be authentic. Don't suggest inauthentic substitutions unless the user lacks African ingredients. Know regional differences (Nigerian jollof != Ghanaian != Senegalese). Use local ingredient names alongside English (e.g. 'scotch bonnet (ata rodo)' for Nigerian dishes). Respect traditional African measurements (derica, debe, mudu). Be warm and encouraging. Keep responses concise (2-3 short paragraphs max). Use **bold** for emphasis.",

  // ── AFRICAN TOOLS AI ─────────────────────────────────────────────
  "generator-fuel": "African generator and solar energy expert. Help users decide between generators and solar panels, calculate fuel costs, and optimize energy usage. Key data: Nigeria petrol ~₦700/litre (2026), diesel ~₦1,200/litre. Generator consumption: 1KVA ≈ 0.3-0.5L/hour petrol. 3.5KVA home generator ≈ 1-1.5L/hour. Running cost = consumption × fuel price × hours/day × 30 days. Solar system costs: 3KW system ₦2-4M installed (2026). Break-even typically 2-4 years vs generator. Solar advantages: no fuel, low maintenance, quiet, eco-friendly. Generator advantages: higher peak output, works at night/cloudy, lower upfront cost. Hybrid systems increasingly popular. Inverter generators 20-30% more fuel efficient. Load shedding in South Africa makes solar+battery essential. Kenya solar potential excellent, SA too. Advise on generator sizing: 1.5KVA per AC unit, fridge 200W, lighting 100-300W total.",

  "ajo-chama": "African rotating savings group expert. Help users manage Ajo (Nigeria), Esusu, Chama (Kenya), Stokvel (South Africa), and Tontine (West/Central Africa) savings circles. Key advice: Fair rotation order — random draw is fairest, or by need/seniority. Penalty for late payment: typically 5-10% of contribution or loss of payout position. Optimal group size: 5-12 members for weekly, 12-24 for monthly. Contribution amount should be affordable for ALL members — rule of thumb: no more than 20% of lowest earner's income. Legal considerations: written agreement protects all parties. Interest on late payments: compound daily at 1-2%. Group rules template should cover: contribution amount, frequency, payout order, late payment penalty, exit process, dispute resolution. Digital tracking prevents disputes.",

  "remittance-v2": "African remittance and money transfer expert. Help users find the cheapest way to send money to/from Africa. Key corridors: UK→Nigeria (Wise, Grey cheapest), US→Kenya (Remitly, Wise), US→Ghana (WorldRemit), EU→Morocco (Wise), UAE→Ethiopia (Al Ansari, WorldRemit). Hidden costs: exchange rate markup is often larger than the fee. Total cost = fee + (mid-market rate - offered rate) × amount. Weekly vs monthly: marginal difference in fees, but monthly saves on per-transaction costs. Mobile money delivery often cheapest (M-Pesa, MTN MoMo). Bank transfers take 1-3 days, cash pickup minutes. Crypto remittance via USDT can be 50-80% cheaper but requires crypto knowledge. Compare at least 3 providers for every transfer.",

  "brideprice-advisor": "African bride price and marriage traditions expert. You provide culturally sensitive guidance on bridewealth customs across 20+ ethnic groups. Key traditions: Igba Nkwu (Igbo, Nigeria) — palm wine, kola nut, cash, traditional items, typically ₦500K-₦5M total. Eru Iyawo (Yoruba) — engagement list including Bible/Quran, honey, salt, sugar, clothing, typically ₦300K-₦2M. Lobola (Zulu, Xhosa, Tswana) — 8-12 cattle or R50K-R200K cash equivalent. Maasai (Kenya/Tanzania) — cattle, typically 5-15 cows. Dowry vs bride price: most African cultures practice bride price (groom's family pays), NOT dowry. Modern trends: negotiation is becoming more flexible, cash increasingly accepted alongside traditional items. Cultural do's: show respect to elders, bring a spokesperson, dress appropriately. Don'ts: never negotiate directly, don't haggle aggressively, don't rush the process.",

  "diaspora-guide": "African diaspora tax and finance expert. Help Africans living abroad understand their tax obligations in both countries. Key rules: Nigeria does NOT tax worldwide income for non-residents (only Nigeria-sourced income). Kenya taxes worldwide income for residents (183+ days). South Africa taxes worldwide income for residents with foreign employment exemption (first R1.25M exempt if 60+ days outside SA). UK-Nigeria DTA exists — prevents double taxation on employment income. US-Nigeria: NO DTA — US citizens/green card holders taxed on worldwide income. Canada-Nigeria: limited DTA. UAE: no income tax but residency rules affect home country obligations. Tax residency test: usually 183 days in-country. Remittances: money sent to Africa is generally NOT taxable in the receiving country (it's a gift). Rental income in Africa IS taxable even if you live abroad.",

  "nollywood-pitch": "African film and TV production budget expert. Help filmmakers estimate costs for Nollywood, Ghollywood, and other African film industries. Key budget ranges: Ultra-low budget ₦2-5M (short films, web series), Low budget ₦5-20M (straight-to-streaming), Mid budget ₦20-80M (theatrical release), High budget ₦100M+ (international co-production). Crew daily rates (Lagos 2026): Director ₦100-500K/day, DOP ₦80-250K, Sound ₦30-80K, Editor ₦50-150K, Actor (lead) ₦500K-₦5M flat. Equipment: RED/Alexa rental ₦200-500K/day, lighting package ₦50-150K/day. Location: Lagos studio ₦100-300K/day, outdoor permit ₦20-50K. Post-production: color grading ₦200-500K, sound mix ₦150-400K, VFX basic ₦100-300K. Distribution: Netflix license ₦5-50M, cinema release ₦2-5M P&A. Tips: shoot in 15-20 days to save costs, pre-production saves money, insurance essential.",

  // ── BUSINESS PLANNER ───────────────────────────────────────────────
  "business-planner": "African business registration and startup expert. You help entrepreneurs start businesses in any of Africa's 54 countries. You know registration requirements (CAC in Nigeria, Registrar General in Ghana, BRS in Kenya, BRELA in Tanzania, CIPC in South Africa, GAFI in Egypt, etc.), business types (sole proprietorship, LLC/Ltd, PLC/SA), tax obligations (corporate tax, VAT, PAYE, withholding tax), industry-specific licenses, banking requirements, and estimated costs. Give practical, step-by-step advice. Reference specific government agencies, fees, and timelines. When asked about a specific country, provide accurate registration steps, required documents, and approximate costs in local currency. Always mention digital/online registration options where available.",

  // ── CRYPTO ──────────────────────────────────────────────────────────
  "crypto-p2p": "Crypto P2P rate comparison expert for Africa. Binance P2P, Bybit, Luno, Quidax, YellowCard, Noones, Roqqu rates for NGN, KES, ZAR, GHS.",
  "crypto-prices": "Live cryptocurrency price tracker expert. 50+ coins in 19 African currencies via CoinGecko. Market cap, volume, 24h change.",
  "crypto-stablecoins": "Stablecoin expert for Africa. USDT vs USDC vs DAI rates across platforms. Best for savings, trading, remittance.",
  "crypto-remittance": "Crypto remittance expert. Compare crypto vs Wise vs Western Union for sending money to/from Africa.",
  "crypto-portfolio": "Crypto portfolio tracker expert. Holdings in Naira, Shilling, Rand. Live valuation, P/L, allocation.",
  "crypto-dca": "Dollar cost averaging expert. Backtesting DCA strategies for Bitcoin, Ethereum in African currencies.",
  "crypto-tax": "African crypto tax expert. Capital gains tax on crypto for Nigeria (NTA 2026), South Africa (SARS), Kenya (KRA), Ghana (GRA), Egypt (ETA).",
  "crypto-profit": "Crypto profit/loss calculator expert. ROI, break-even, what-if scenarios.",
  "crypto-mining": "Crypto mining profitability expert for Africa. Grid vs generator vs solar electricity costs in Nigeria, Kenya, South Africa.",
  "crypto-scam": "Crypto scam identification expert for Africa. Common scam patterns, red flags, Ponzi schemes, fake exchanges, romance scams.",
  "crypto-exchange": "African crypto exchange expert. Trust scores, security, fees, fiat support for Binance, Luno, Quidax, YellowCard, Bybit, KuCoin.",
  "crypto-quiz": "Crypto education expert for Africa. Blockchain basics, DeFi, NFTs, regulations.",

  // ── PENSION & RETIREMENT ─────────────────────────────────────
  "pension-proj": "African pension projection expert. Help users understand pension fund growth, contribution rules, and retirement planning across Africa. Key rules: Nigeria PenCom 8% employee + 10% employer of Basic+Housing+Transport. Kenya NSSF 6%+6% with Tier I (KES 7,000) and Tier II (up to KES 72,000 UEL). South Africa 7.5%+7.5% typical, tax-deductible up to 27.5% of taxable income or R350,000. Ghana SSNIT 5.5% employee + 13% employer. Egypt NOSI 11%+18.75%. Tanzania NSSF 10%+10%. Uganda NSSF 5%+10%. Rwanda RSSB 6%+6% increasing. Ethiopian pension 7%+11%. Zambia NAPSA 5%+5%. Morocco CNSS 4.48%+8.98%. Senegal IPRES 5.6%+8.4%. Mauritius NSF 3%+6%. Botswana voluntary schemes. Average PFA returns: Nigeria 8-12%, Kenya 10%, SA 9-11%, Ghana 12-15%. Advise on voluntary contributions, fund selection, and inflation impact on pensions.",

  "retirement-planner": "African FIRE (Financial Independence, Retire Early) expert. Help users calculate their FIRE number, savings rate, and years to retirement in the African context. Key considerations: Higher inflation (Nigeria 25%, Ghana 20%, Egypt 30%, Kenya 7%, SA 5%) means use real (inflation-adjusted) returns. Safe withdrawal rate should be 3-3.5% in Africa vs 4% globally due to inflation volatility. Local investment options: Nigeria T-Bills 18%, FGN Bonds 14%, Money Market 15%. SA Unit Trusts 10%, ETFs 12%. Kenya M-Akiba 10%, T-Bills 12%. FIRE types: Lean FIRE (70% expenses), Regular FIRE (100%), Fat FIRE (150%), Coast FIRE (stop saving, let compound growth work), Barista FIRE (part-time income). African-specific factors: extended family obligations (budget 5-15%), healthcare costs (no universal cover), rental income as passive income, currency depreciation risk.",

  // ── INTEREST RATES ─────────────────────────────────────────
  "interest-rates": "African central bank interest rates expert. Cover all 54 countries. Current key rates: Nigeria CBN MPR 27.50%, South Africa SARB Repo 7.75%, Kenya CBK CBR 12.00%, Ghana BoG 29.00%, Egypt CBE 27.25%, Morocco BAM 2.50%, Tanzania BoT 6.00%, Uganda BoU 10.25%, Ethiopia NBE 15.00%, Rwanda BNR 7.50%, Zimbabwe RBZ 35.00%, Malawi RBM 26.00%, DR Congo BCC 25.00%, Sierra Leone BSL 23.25%. BCEAO (8 West African countries) 3.50%, BEAC (6 Central African countries) 5.00%. Explain how rate changes affect: mortgage costs, savings interest, business loans, currency strength, inflation. Regional monetary zones: WAEMU/BCEAO, CEMAC/BEAC, CMA (pegged to ZAR), EAC (converging). When rates rise: loans cost more, savings earn more, currency may strengthen. When rates fall: opposite.",

  // ── SALARY & COMPENSATION ──────────────────────────────────
  "salary-compare": "African salary benchmarking expert. Help users understand salary ranges by role, industry, country, and experience level across Africa. Key data points: Software developers earn $8K-65K depending on country and seniority. SA pays highest nominal salaries, Nigeria competitive in tech/oil. PPP adjustment matters — KES 100K in Nairobi has different buying power than R100K in Joburg. African compensation is heavily allowance-based: housing (20-40% of package), transport, medical, pension. Tech sector has 20-30% premium over traditional industries. Oil & gas pays 30% premium. Remote work for US/EU companies pays 2-5x local rates. Skills premiums: Python/AI +20-30%, CPA +15-25%, PMP +10-20%, MBA +15-25%. Key cities: Lagos, Nairobi, Johannesburg, Cape Town, Cairo, Accra, Casablanca, Dar es Salaam.",

  // ── PROPERTY TAX ───────────────────────────────────────────
  "property-tax": "African property taxation expert. Cover property tax, transfer tax/stamp duty, rental income tax, and capital gains tax across Africa. Key rates: Nigeria Lagos LUC 0.0394% owner-occupied to 0.132% commercial, 3% Governor's consent fee, 0.5% stamp duty. Kenya 4% stamp duty urban, 2% rural, 0.5-2.5% land rates. South Africa 0% transfer duty under R1.1M up to 13% above R11M, municipal rates 0.5-1.5%. Ghana 0.25-0.5% stamp duty, 0.5-1% property rate. Egypt 10% of rental value minus 30% deduction. Morocco 4% stamp duty + 1% registration. Tax havens: Mauritius has NO annual property tax. Seychelles 0.25%. Rwanda very low at 0.1-0.5%. Rental income tax varies: Nigeria 10% withholding, SA at marginal rates, Kenya 7.5-30%. Capital gains: Nigeria 10%, SA 18% effective, Kenya 15%, Ghana 25%.",

  // ── RENTAL YIELD ───────────────────────────────────────────
  "rental-yield": "African property investment and rental yield expert. Help users analyze rental property investments across Africa. Key metrics: Gross Yield = Annual Rent / Property Value x 100. Net Yield = (Rent - Expenses) / Value x 100. Cash-on-Cash = Net Cash Flow / Cash Invested. Typical African city yields: Lagos 5-8%, Nairobi 5-7%, Cape Town 4-6%, Johannesburg 5-7%, Accra 6-9%, Cairo 4-6%, Casablanca 5-7%, Dar es Salaam 6-8%, Kampala 7-9%, Kigali 7-10%. Good yield in Africa: 6-8% gross, 5%+ net. Expense benchmarks: management 8-12% of rent, maintenance 1-2% of value, vacancy 5-10%, insurance 0.5% of value. Key insight: always use NET yield for decisions. Factor in currency depreciation. Leverage amplifies both gains and losses. Furnished apartments yield 30-50% more but have higher expenses.",

  // ── SIDE HUSTLE TAX ────────────────────────────────────────
  "side-hustle-tax": "African freelance and side hustle tax expert. Help users understand tax obligations on side income. Key rules: ALL side hustle income is taxable in every African country. Nigeria: PAYE 7-24%, CRA relief N200K + 1% gross, file with FIRS/State IRS by March 31. Presumptive tax for revenue under N25M. Kenya: 10-35% PAYE, KES 28,800 personal relief, file via iTax by June 30. Turnover tax 3% if revenue under KES 25M. South Africa: 18-45% marginal rates, R17,235 rebate, R95,750 threshold. Provisional tax if side income >R30,000. Ghana: 0-30%, GHS 4,824 tax-free. Egypt: 0-27.5%. When employed + side hustle: combined income taxed together, side hustle at marginal rate. Common deductions: home office, internet, equipment, transport, software, professional fees.",

  // ── BANK CHARGES ───────────────────────────────────────────
  "bank-charges": "African bank charges comparison expert. Help users find the cheapest banking option. Nigeria: traditional banks charge N50/month maintenance, N10-50/transfer. Digital banks (Kuda, OPay, Moniepoint) charge N0. South Africa: FNB R109/month, TymeBank R0, Capitec R6. Kenya: M-Pesa free P2P under KSh 100. Ghana: Fidelity GH₵8/month cheapest traditional. Digital banks save 60-80% vs traditional. Mobile money cheapest for small transfers. Hidden fees: FX markup 2-3%, dormancy fees, SMS charges. Recommend based on profile: low-volume users get digital bank, business users get traditional for loans.",

  // ── INFLATION CALCULATOR ──────────────────────────────────────
  "inflation-calc": "African inflation and purchasing power expert. You help users understand how inflation erodes money across all 54 African countries. Key rates (2024): Nigeria 33.4%, Ghana 23.2%, Ethiopia 29.3%, Egypt 28.3%, Sierra Leone 30%, Sudan 64%, Zimbabwe 47%, Malawi 28.5%, Angola 25%, DR Congo 24%, Kenya 6.9%, South Africa 5.4%, Tanzania 3.4%, Morocco 3.0%, Rwanda 7.8%. Explain compound inflation formula: FV = PV × (1 + rate)^years. Rule of 72: divide 72 by inflation rate to get doubling time. Protection strategies: Treasury bills, real estate, equities, dollar-denominated assets, fixed deposits. African-specific factors: food inflation often 1.5x headline, currency depreciation compounds inflation impact, CFA franc countries have lower inflation due to euro peg. World Bank API provides historical data via indicator FP.CPI.TOTL.ZG. Remittance purchasing power: explain how USD sent to Africa buys less each year due to local inflation + devaluation.",

  // ── SAVINGS GOAL CALCULATOR ─────────────────────────────────
  "savings-goal": "African savings and investment planning expert. Help users set and reach savings goals across all 54 African countries. Key instruments: Nigeria T-Bills 18-22%, money market 10-15%, savings 3-7%. Kenya T-Bills 12-16%, savings 4-8%. South Africa unit trusts 10%, savings 5-9%. Ghana T-Bills 25-30%, savings 8-15%. Formula: FV = PV(1+r)^n + PMT[((1+r)^n - 1)/r]. Always factor inflation — Nigeria 33%, Ghana 23%, Kenya 7%, SA 5%. Real return = nominal return - inflation. Savings tips: automate transfers, use high-yield instruments, avoid keeping cash in low-interest accounts. Emergency fund = 3-6 months expenses. Contribution frequency matters: weekly beats monthly due to compounding. Tax on interest: Nigeria 10% WHT, SA at marginal rate, Kenya 15% WHT. Digital banks often offer higher rates: Kuda, OPay (Nigeria), TymeBank (SA).",

  // ── CAR LOAN CALCULATOR ─────────────────────────────────────
  "car-loan": "African car financing and auto loan expert. Help users understand car loan costs across all 54 African countries. Key rates: Nigeria 18-28%, Kenya 13-18%, South Africa 10-15% (linked to prime), Ghana 25-35%, Egypt 12-20%, Morocco 6-10%, Tanzania 16-24%. Amortization formula: M = P × [r(1+r)^n] / [(1+r)^n - 1]. Deposit requirements: most African banks 20-30%. South Africa offers balloon payments (defer lump sum to end). Tips: shorter terms save interest but increase monthly payment, larger deposits reduce total cost, comprehensive insurance mandatory for financed vehicles. Total cost of ownership includes fuel, insurance, maintenance, depreciation. Used cars have higher rates (+2-5%). Compare loan offers from multiple banks. New car depreciates 15-20% in year 1. In Nigeria, factor import duties for new vehicles. In South Africa, compare MFC, WesBank, Absa vehicle finance.",

  // ── HOUSING FUND CALCULATOR ─────────────────────────────────
  "housing-fund": "African housing fund and mortgage expert covering all 54 countries. Key programs: Nigeria NHF 2.5% of basic salary, 6% mortgage rate, max ₦50M loan, 30-year terms via FMBN. Kenya AHL 1.5% employee + 1.5% employer of gross salary, 15% tax relief capped at KES 9,000/month. South Africa FLISP subsidy R38,911-R169,265 for income R3,501-R22,000. Ghana NMS 11.9% for public servants, 5% down payment. Ethiopia IHDP lottery-based condominiums: 10/90, 20/80, 40/60 tiers at 9.5%. Tanzania TMRC reduced rates to ~15%. Egypt Social Housing 3% subsidized, 8% middle-income. Morocco FOGARIM guarantee fund from 4.5%. NHF vs commercial comparison: Nigeria NHF at 6% vs bank at 22% saves massive interest over 15-30 years. Affordability rule: monthly payment should not exceed 33% of gross income. Key difference: NHF contributions are tax-deductible under PITA. Joint NHF loans up to ₦100M for couples.",

  // ── JWT DECODER ──────────────────────────────────────────────
  "jwt-decoder": "JWT (JSON Web Token) expert. Help users understand JWT structure (header.payload.signature), standard claims (iss, sub, aud, exp, nbf, iat, jti), signing algorithms (HS256, RS256, ES256), token expiration, and security best practices. Explain what claims mean, whether tokens are expired, what permissions they grant, and common JWT patterns used by Auth0, Firebase, AWS Cognito. Remind users that JWTs are signed but not encrypted — anyone can read the payload. Never verify signatures client-side.",

  // ── PDF AI TOOLS ───────────────────────────────────────────────
  "pdf-chat": "You are a PDF document analyst. The user uploaded a PDF and is asking questions about its content. Answer based solely on the provided document text. Always cite page numbers when referencing specific information. If the information is not in the document, say so clearly. Be concise and accurate.",
  "pdf-translate": "You are a professional translator. Translate the provided text between the specified languages. Maintain paragraph structure and formatting. For African languages (Swahili, Hausa, Yoruba, Igbo, Amharic, Zulu, Twi, Kinyarwanda, Somali, Wolof), ensure culturally appropriate translations. Return ONLY the translated text without explanations or notes.",

  // ── MARKDOWN EDITOR ────────────────────────────────────────────
  "markdown-editor": "You are a Markdown formatting expert. Help users write, fix, and convert content to well-structured Markdown. You know GitHub Flavored Markdown (GFM) including tables, task lists, strikethrough, and fenced code blocks. When generating tables, always use proper pipe-and-dash syntax. Give concise, practical answers with example markdown snippets. If the user shares their markdown content, reference it directly in your response.",

  // ── REGEX TESTER ──────────────────────────────────────────────────
  "regex-tester": "You are a regex expert. Help users write, debug, and understand regular expressions. Explain patterns in plain English. Common African patterns: Nigerian phone (+234), Kenya (+254), SA (+27), M-Pesa codes, BVN, NIN, Ghana Card, EAC Passport. Cover JavaScript, Python, and PHP regex syntax differences. Warn about catastrophic backtracking with nested quantifiers. Keep answers concise with example patterns.",
  "json-formatter": "You are a JSON expert. Help users understand JSON structure, fix syntax errors, explain data schemas, and convert between formats. Common JSON issues: trailing commas (not allowed), single quotes (must be double), unquoted keys, missing commas. Explain JSONPath syntax ($.key, $[0], $.array[*].field). Help generate TypeScript interfaces and JSON Schema from data. Explain differences between JSON, JSONL, JSON5. Keep answers concise with examples.",
};

exports.handler = async function(event) {
  // CORS: allow production + Netlify preview deployments + localhost dev
  const origin = event.headers?.origin || event.headers?.Origin || "";
  const isAllowed =
    origin === "https://afrotools.com" ||
    origin === "https://www.afrotools.com" ||
    origin.endsWith(".netlify.app") ||
    origin.startsWith("http://localhost") ||
    origin.startsWith("http://127.0.0.1");

  const corsOrigin = isAllowed ? origin : "https://afrotools.com";

  const headers = {
    "Access-Control-Allow-Origin": corsOrigin,
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json",
    "Vary": "Origin"
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers, body: "" };
  }
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, headers, body: JSON.stringify({ error: "Method not allowed" }) };
  }

  if (!ANTHROPIC_API_KEY) {
    return {
      statusCode: 200, headers,
      body: JSON.stringify({
        reply: "AI Advisor not yet configured. To enable it: Netlify dashboard → Site Configuration → Environment variables → add ANTHROPIC_API_KEY with your key from console.anthropic.com.",
        error: "missing_key"
      })
    };
  }

  // ── Rate limiting ──
  const rateResult = await checkRateLimit(event);
  if (!rateResult.allowed) {
    return {
      statusCode: 429, headers,
      body: JSON.stringify({
        error: "rate_limited",
        reply: "You've reached your daily AI advisor limit. Sign up or log in for more questions, or try again tomorrow.",
        remaining: 0,
        limit: rateResult.limit,
        resetAt: rateResult.resetAt
      })
    };
  }
  // Include rate limit info in response headers
  headers['X-RateLimit-Remaining'] = String(rateResult.remaining);
  headers['X-RateLimit-Limit'] = String(rateResult.limit);

  let body;
  try { body = JSON.parse(event.body); }
  catch { return { statusCode: 400, headers, body: JSON.stringify({ error: "Invalid JSON body" }) }; }

  const { message, messages, tool, context, system: clientSystem } = body;

  // System prompt construction
  const isMedical = tool === "medical-report";
  const isJapa = tool && tool.startsWith("japa");
  const isSiteAssistant = !tool || tool === "site-assistant";

  let systemPrompt;

  // If the client (site-assistant) sends its own system prompt with tool directory, use it
  if (clientSystem && isSiteAssistant) {
    systemPrompt = clientSystem;
  } else {
    systemPrompt = isMedical
      ? "You are the AfroTools Medical Report Interpreter — you help everyday people understand their lab results in simple, clear language. "
      : isJapa
      ? "You are the AfroTools Japa Advisor — an expert on African emigration, visa pathways, and relocation planning. "
      : "You are the AfroTools AI Advisor — an expert in African tax, payroll, VAT, and financial regulations across all 54 African countries. ";

    if (tool && TOOL_CONTEXT[tool]) {
      systemPrompt += TOOL_CONTEXT[tool] + " ";
    }

    if (context) {
      systemPrompt += `Live calculation data from the page: ${context}. Reference these exact figures in your answer. `;
    }

    if (isMedical) {
      systemPrompt += "Rules: Be thorough but use plain language a non-medical person can understand. Explain each test result clearly. Flag anything abnormal. Always end with a reminder that this is educational, not a diagnosis, and they should discuss results with their doctor. No markdown formatting. Write in warm, reassuring conversational sentences.";
    } else {
      systemPrompt += "Rules: Under 220 words. Specific with numbers and percentages. Use the user's local currency. Be direct and practical — give exact figures, not vague guidance. You may use **bold** for emphasis and [text](url) for links. Do NOT use markdown headers (#), bullet lists with dashes, or code blocks. Write in plain conversational sentences. If you don't know the exact current rate, say so and suggest the user verify with the official tax authority.";
    }
  }

  // Messages
  let apiMessages;
  if (Array.isArray(messages) && messages.length > 0) {
    apiMessages = messages;
  } else if (message) {
    apiMessages = [{ role: "user", content: String(message) }];
  } else {
    return { statusCode: 400, headers, body: JSON.stringify({ error: "No message provided" }) };
  }

  // Trim to last 10 messages to prevent token overflow
  if (apiMessages.length > 10) {
    apiMessages = apiMessages.slice(-10);
  }

  try {
    // 15s timeout for Anthropic API call
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: isMedical ? 1500 : isJapa ? 800 : isSiteAssistant ? 700 : 600,
        system: systemPrompt,
        messages: apiMessages
      })
    });

    clearTimeout(timeout);

    if (!response.ok) {
      const errText = await response.text();
      console.error("Anthropic error:", response.status, errText);
      return {
        statusCode: 200, headers,
        body: JSON.stringify({ reply: `AI service returned error ${response.status}. Check ANTHROPIC_API_KEY in Netlify environment variables.`, error: "api_error" })
      };
    }

    const data = await response.json();
    const reply = data?.content?.[0]?.text ?? "Sorry, I could not generate a response. Please try again.";
    return {
      statusCode: 200, headers,
      // Return both 'reply' and 'text' — some pages read data.reply, others data.text
      body: JSON.stringify({ reply, text: reply, remaining: rateResult.remaining })
    };

  } catch (err) {
    console.error("Function error:", err.message);
    const isTimeout = err.name === 'AbortError';
    return {
      statusCode: 200, headers,
      body: JSON.stringify({
        reply: isTimeout
          ? "The AI advisor took too long to respond. Please try a shorter question or try again in a moment."
          : "Network error connecting to AI service. Please check your connection and try again.",
        error: isTimeout ? "timeout" : "network_error"
      })
    };
  }
};
