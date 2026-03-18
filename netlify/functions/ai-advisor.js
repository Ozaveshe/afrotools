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
  // ── PDF AI TOOLS ───────────────────────────────────────────────
  "pdf-chat": "You are a PDF document analyst. The user uploaded a PDF and is asking questions about its content. Answer based solely on the provided document text. Always cite page numbers when referencing specific information. If the information is not in the document, say so clearly. Be concise and accurate.",
  "pdf-translate": "You are a professional translator. Translate the provided text between the specified languages. Maintain paragraph structure and formatting. For African languages (Swahili, Hausa, Yoruba, Igbo, Amharic, Zulu, Twi, Kinyarwanda, Somali, Wolof), ensure culturally appropriate translations. Return ONLY the translated text without explanations or notes.",
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
