// netlify/functions/ai-business-plan.js
// Pro-only: generates full AI business plan sections
// Called sequentially for each of 5 sections

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

const SECTION_PROMPTS = {
  'executive-summary': (ctx) => ({
    system: `You are writing the Executive Summary section of a business plan for a ${ctx.businessType} in ${ctx.country}. The business operates in the ${ctx.industry} sector.

Business description: ${ctx.description || 'Not provided'}

Write a 400-word executive summary that covers:
1. What the business does and its value proposition
2. Target market in ${ctx.country} (be specific about demographics, location, income level)
3. Competitive advantage — why this business will win in ${ctx.country} specifically
4. Revenue model and key revenue streams
5. Growth potential and 3-year vision

Use real data about ${ctx.country}'s economy where possible. Name real market opportunities.
Be specific to ${ctx.country} — don't write generic content that could apply to any country.
Write in professional but accessible language. Use ${ctx.currency} for all monetary references.

Format: Return clean HTML paragraphs. No markdown. Use <h4> for sub-sections if needed. Do not wrap in a top-level heading — the UI already has the section title.`,
    maxTokens: 1200
  }),

  'market-analysis': (ctx) => ({
    system: `You are writing the Market Analysis section of a business plan for a ${ctx.industry} business in ${ctx.country}.

Generate:
1. **Market Size** — Estimated size of the ${ctx.industry} market in ${ctx.country}. Use real data or reasonable estimates. Always cite your reasoning.
2. **Target Customer** — Detailed customer profile: age, income, location, buying behavior. Be specific to ${ctx.country}.
3. **Market Trends** — 3-4 current trends driving growth in ${ctx.industry} in ${ctx.country} (e.g., urbanization, digital adoption, policy changes, demographic shifts).
4. **Competitive Landscape** — Name 3-5 real existing competitors in this space in ${ctx.country}. For each: company name, what they do, their approximate size, and their weakness.
5. **Market Gap** — The specific opportunity this business fills that competitors don't.

Format: Return clean HTML. Use <h4> for each sub-section. Use a <table> for competitors (columns: Company, Description, Strength, Weakness). Use ${ctx.currency} for all amounts. No markdown.`,
    maxTokens: 1500
  }),

  'financial-projections': (ctx) => ({
    system: `You are generating 3-year financial projections for a ${ctx.businessType} in ${ctx.country}'s ${ctx.industry} sector.

Startup cost estimate context: ${ctx.startupCost || 'Use reasonable estimates for this country and industry'}

Generate realistic financial projections. Monthly Revenue Projection (Year 1): Realistic ramp-up — Month 1-3 at 20-30% capacity, Month 4-6 at 50-60%, Month 7-9 at 75-85%, Month 10-12 at 90-100%. Base the full-capacity monthly revenue on realistic ${ctx.industry} benchmarks in ${ctx.country}. Monthly Operating Costs (Year 1): Rent, salaries, utilities, materials, marketing, loan payments, miscellaneous. Be specific to ${ctx.country} cost levels. Year 2: Apply 20-30% growth over Year 1. Year 3: Apply 15-25% growth over Year 2. Include breakeven analysis (which month cumulative revenue exceeds cumulative costs) and 5-6 key assumptions.

CRITICAL: Return ONLY valid JSON with this exact structure, no other text:
{"year1":{"months":[{"month":1,"revenue":0,"costs":0,"profit":0},{"month":2,"revenue":0,"costs":0,"profit":0},{"month":3,"revenue":0,"costs":0,"profit":0},{"month":4,"revenue":0,"costs":0,"profit":0},{"month":5,"revenue":0,"costs":0,"profit":0},{"month":6,"revenue":0,"costs":0,"profit":0},{"month":7,"revenue":0,"costs":0,"profit":0},{"month":8,"revenue":0,"costs":0,"profit":0},{"month":9,"revenue":0,"costs":0,"profit":0},{"month":10,"revenue":0,"costs":0,"profit":0},{"month":11,"revenue":0,"costs":0,"profit":0},{"month":12,"revenue":0,"costs":0,"profit":0}],"totalRevenue":0,"totalCosts":0,"netProfit":0},"year2":{"totalRevenue":0,"totalCosts":0,"netProfit":0},"year3":{"totalRevenue":0,"totalCosts":0,"netProfit":0},"breakevenMonth":0,"assumptions":["..."],"currency":"${ctx.currencyCode}"}

All amounts in ${ctx.currency}. Replace all zeros with realistic numbers. Return ONLY the JSON object.`,
    maxTokens: 1200
  }),

  'swot': (ctx) => ({
    system: `Generate a SWOT analysis for a ${ctx.businessType} in ${ctx.country}'s ${ctx.industry} sector.

For each quadrant, provide exactly 5 bullet points that are:
- SPECIFIC to ${ctx.country} (name real regulations, real competitors, real market conditions)
- ACTIONABLE (each point should suggest what to do about it)
- NOT generic business platitudes

CRITICAL: Return ONLY valid JSON with this exact structure, no other text:
{"strengths":["...","...","...","...","..."],"weaknesses":["...","...","...","...","..."],"opportunities":["...","...","...","...","..."],"threats":["...","...","...","...","..."]}`,
    maxTokens: 800
  }),

  'funding-strategy': (ctx) => ({
    system: `Generate a funding strategy for starting a ${ctx.businessType} in ${ctx.country}'s ${ctx.industry} sector. Total estimated startup cost: ${ctx.startupCost || 'varies by scale'} ${ctx.currency}.

Include:
1. Bank Loans — Name 2-3 real banks in ${ctx.country} that offer SME loans. Include approximate interest rates and typical requirements.
2. Microfinance — Name 1-2 microfinance institutions in ${ctx.country} relevant to this business size.
3. Angel Investors / VC — Name real angel networks or VC firms operating in ${ctx.country} that invest in ${ctx.industry} or early-stage businesses.
4. Government Programs — Name specific government SME support programs, grants, or subsidies available in ${ctx.country}. Include the administering agency.
5. DFIs & International — Relevant programs from AfDB, IFC, USAID, or other development finance institutions.
6. Alternative — Crowdfunding platforms popular in ${ctx.country}, supplier credit, revenue-based financing options.
7. Bootstrapping Plan — If starting with less capital, what's the minimum viable version of this business and how much does it cost?

Format: Return clean HTML. Use <h4> for each funding type. Name real institutions with their websites where possible. Use ${ctx.currency} for all amounts. No markdown.`,
    maxTokens: 1400
  })
};

exports.handler = async function(event) {
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
      statusCode: 500, headers,
      body: JSON.stringify({ error: "API key not configured" })
    };
  }

  let body;
  try { body = JSON.parse(event.body); }
  catch { return { statusCode: 400, headers, body: JSON.stringify({ error: "Invalid JSON" }) }; }

  const { section, country, countryCode, businessType, industry, description, hasEmployees, startupCost, currency, currencyCode } = body;

  if (!section || !SECTION_PROMPTS[section]) {
    return {
      statusCode: 400, headers,
      body: JSON.stringify({ error: "Invalid section. Must be one of: " + Object.keys(SECTION_PROMPTS).join(', ') })
    };
  }

  const ctx = {
    country: country || 'Unknown',
    countryCode: countryCode || '',
    businessType: businessType || 'business',
    industry: industry || 'general',
    description: description || '',
    hasEmployees: hasEmployees || false,
    startupCost: startupCost || '',
    currency: currency || 'USD',
    currencyCode: currencyCode || 'USD'
  };

  const promptConfig = SECTION_PROMPTS[section](ctx);

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000); // 30s for longer generations

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
        max_tokens: promptConfig.maxTokens,
        system: promptConfig.system,
        messages: [{ role: "user", content: `Generate the ${section.replace(/-/g, ' ')} section for a ${ctx.industry} ${ctx.businessType} in ${ctx.country}.` }]
      })
    });

    clearTimeout(timeout);

    if (!response.ok) {
      const errText = await response.text();
      console.error("Anthropic error:", response.status, errText);
      return {
        statusCode: 200, headers,
        body: JSON.stringify({ error: "ai_error", section, content: null })
      };
    }

    const data = await response.json();
    const content = data?.content?.[0]?.text ?? null;

    return {
      statusCode: 200, headers,
      body: JSON.stringify({ section, content, error: null })
    };

  } catch (err) {
    console.error("Function error:", err.message);
    return {
      statusCode: 200, headers,
      body: JSON.stringify({
        section,
        content: null,
        error: err.name === 'AbortError' ? 'timeout' : 'network_error'
      })
    };
  }
};
