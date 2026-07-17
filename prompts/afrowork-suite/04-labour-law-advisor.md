# Prompt 04 — AI Labour Law Advisor

## Identity

| Field | Value |
|-------|-------|
| **Name** | AI Labour Law Advisor |
| **Tagline** | "Your rights. Your country. Plain language." |
| **Path** | `/tools/labour-law-advisor/` |
| **CSS prefix** | `lla-` |
| **Accent color** | Purple `#7C3AED` / dark `#4C1D95` / pale `#F5F3FF` |
| **Engine** | `engines/labour-law-engine.js` (context builder only — AI does the work) |
| **AI advisor key** | `"labour-law-advisor"` in TOOL_CONTEXT |
| **Supabase tables** | `lla_conversations`, `lla_question_log` |
| **Netlify function** | Uses existing `/.netlify/functions/ai-advisor` |

---

## What This Is

A full conversational AI tool powered by Claude, specializing in African labour law across all 54 countries. This is not the sidebar "AI observations" that already exists on individual tools — it is a dedicated, full-screen chat interface where users ask real questions and get real, cited answers.

**The most important tool in the entire suite.** Highest traffic potential. Every African worker or employer has had a labour dispute, a question about entitlements, or a fear about what they can or cannot legally do. They have nowhere to turn that is free, fast, and Africa-specific.

**Target questions it must answer:**
- "Can my employer deduct money from my salary for breaking equipment?" → Answer + legal citation
- "I was dismissed without notice after 4 years. What am I owed?" → Calculation + legal reference
- "My employer hasn't paid me in 2 months. What are my options?" → Step-by-step guidance
- "Is my non-compete clause enforceable in Nigeria?" → Honest legal analysis
- "What is the maximum probation period in Kenya?" → Specific answer: 6 months (Employment Act 2007, S.42)

---

## Pages & Views

### Landing Page (`index.html`)

- Hero: purple gradient, dark background
- Headline: "Ask any African labour law question. Get a real answer."
- Sub: "Powered by Claude AI. 54 countries. Free. No signup required for 3 questions."
- **"Ask a Question" input** (large, prominent) — users can type right on the landing page
- Example questions carousel (auto-rotating, clickable):
  - "Can my employer cut my salary without notice?" 🇳🇬
  - "What is statutory maternity pay in Kenya?" 🇰🇪
  - "How much notice must I give when resigning in South Africa?" 🇿🇦
  - "Is my restraint of trade clause valid?" 🇬🇭
  - "My employer hasn't paid me. What can I do?" 🌍
- Countries covered: 54-flag grid
- Disclaimer: "This tool provides general legal information, not legal advice. For complex disputes, consult a qualified labour attorney."
- "How it works": Type question → AI answers with citations → Follow-up if needed
- Free vs. logged-in: 3 questions free → sign in for unlimited

### Chat Interface (`chat.html`)

Full-screen conversational interface:

**Left sidebar (desktop only):**
- Country selector — "I'm asking about [Nigeria ▾]" — pre-sets jurisdiction
- Recent questions (for logged-in users)
- Quick topics: Dismissal | Pay | Leave | Contracts | Unions | Discrimination | Pensions | Tax

**Main chat area:**
- Standard chat bubbles: user (right, purple) | AI (left, white/light purple)
- Each AI message includes:
  - The answer in plain language
  - **Citation block** (collapsible): "Source: Employment Act 2007, Section 42(1), Kenya" with link to official source where available
  - **Related tools** chip row: "Calculate your notice pay → [Overtime Calc]" or "Check your leave entitlement → [Leave Calculator]"
  - "Was this helpful?" thumbs up/down (used to improve the model)
- Follow-up suggestions: 3 clickable follow-up questions after each AI response
- "Share this answer" button → WhatsApp, copy link (answer gets a unique URL if user is logged in)

**Input area:**
- Large textarea ("Ask a follow-up...")
- Country context chip (editable inline)
- "Ask" button
- Free question counter: "2 of 3 free questions used — [Sign in for unlimited]"

**Conversation starters (empty state):**
Grid of 9 common question cards, grouped by topic:
- Dismissal & Retrenchment
- Pay & Deductions
- Leave & Maternity
- Contracts & Probation
- Workplace Rights
- Pensions & Deductions
- Discrimination & Harassment
- Starting a Business (employer perspective)
- Cross-border Employment

---

## AI System Prompt (TOOL_CONTEXT for ai-advisor.js)

```javascript
"labour-law-advisor": {
  name: "AI Labour Law Advisor",
  systemPrompt: `You are an expert African labour law advisor with comprehensive knowledge of employment law, labour regulations, and workers' rights across all 54 African countries.

CORE PRINCIPLES:
1. Always answer the specific question first — don't hedge or deflect immediately
2. Cite the exact law, section, and country in every answer (e.g., "Labour Act Cap L1, Section 7(1), Nigeria")
3. After answering, note if a lawyer should be consulted for the specific situation
4. Use plain language — avoid legal jargon unless explaining the jargon
5. Give actionable next steps, not just legal theory
6. Be honest when the law is unclear or when there's genuine ambiguity

JURISDICTIONS (know these well):
- Nigeria: Labour Act Cap L1, Employee Compensation Act 2010, Trade Union Act, NMW Act 2019, Finance Acts
- Kenya: Employment Act 2007, Labour Relations Act 2007, Work Injury Benefits Act, OSHA 2007, National Employment Authority Act
- South Africa: Basic Conditions of Employment Act 75/1997, Labour Relations Act 66/1995, Employment Equity Act 55/1998, National Minimum Wage Act 9/2018, COIDA
- Ghana: Labour Act 2003 (Act 651), National Pensions Act 2008, Workmen's Compensation Law
- Tanzania: Employment and Labour Relations Act 2004
- Ethiopia: Labour Proclamation No. 1156/2019
- Rwanda: Labour Code (Law No. 66/2018)
- Uganda: Employment Act 2006, Workers' Compensation Act
- Egypt: Labour Law No. 12/2003
- Morocco: Labour Code 2004 (Code du Travail)
- Senegal: Labour Code (Code du Travail)
- Côte d'Ivoire: Labour Code
- Cameroon: Labour Code
- And all remaining 40 African countries — apply relevant national law

COMMON QUESTION TYPES AND HOW TO HANDLE THEM:

**Dismissal & Notice:**
Give exact notice periods by years of service. Explain if dismissal was potentially unfair. Name the body to complain to (e.g., CCMA in South Africa, Industrial Court in Kenya). Explain severance pay entitlements.

**Pay Deductions:**
Be clear: most African countries allow ONLY statutory deductions (PAYE, pension, social security) without written consent. Employer-initiated deductions for breakages, shortfalls, or disciplinary reasons typically require specific written agreement AND must not reduce salary below minimum wage. Cite the specific prohibition.

**Maternity / Paternity:**
Give exact days, exact pay percentage, explain who pays (employer vs. social security vs. split). Explain what happens if employer refuses — the complaint mechanism.

**Probation:**
Maximum probation periods vary: Kenya 6 months (Employment Act S.42), South Africa no statutory max but 3-6 months common, Nigeria up to 3-6 months per company policy. Explain rights during probation (are you protected from unfair dismissal?).

**Non-Compete / Restraint of Trade:**
These are enforced differently by country. South Africa: courts assess reasonableness (area, duration, interests). Nigeria: generally enforceable if reasonable. Kenya: enforced but courts protective of employees. Be honest about the uncertainty.

**Cross-Border Employment:**
Flag the complexity. Which country's law applies? The country where work is performed generally governs. Tax treaty implications. Double social security contributions.

CALCULATION GUIDANCE:
When a user asks "what am I owed?" — don't just cite the law. Calculate it.
Example: "I was retrenched after 5 years in South Africa earning ZAR 25,000/month"
→ "Under BCEA: 1 week's remuneration per completed year = 5 weeks × (ZAR 25,000 × 12 / 52) = ZAR 28,846. Plus notice: 4 weeks = ZAR 23,076. Plus leave encashment: [ask how many days unused]. Total minimum: approximately ZAR 51,922."

DISCLAIMER (include on complex matters):
"This is general information about [country] employment law. For your specific situation, I recommend consulting with a [CCMA-registered / Industrial Court-listed / etc.] labour attorney."`,

  exampleQueries: [
    "Can my employer deduct money from my salary for breaking equipment in Nigeria?",
    "I was dismissed without notice after 4 years in Kenya. What am I owed?",
    "What is the maximum probation period in South Africa?",
    "My employer hasn't paid me in 6 weeks in Ghana. What can I do?",
    "Is a restraint of trade enforceable in Nigeria?",
    "What is statutory maternity pay in Tanzania?",
    "Can I be fired for being pregnant in South Africa?",
    "What are my rights if I am retrenched in Kenya?",
    "My employer is deducting 'breakage fees' from my salary. Is this legal?",
    "How do I file a labour complaint in Nigeria?"
  ]
}
```

---

## Calculation Integration

When users ask "what am I owed?" the AI should trigger the relevant calculator tool contextually. The engine provides a bridge:

```javascript
// engines/labour-law-engine.js
(function() {
  'use strict';

  const LabourLawEngine = {

    // Detect if a question implies a calculation need
    detectCalculationIntent(question) {
      const patterns = {
        'notice-pay': /notice|notice pay|leaving|resign|dismissal|retrenchment/i,
        'overtime': /overtime|OT|extra hours|worked late/i,
        'leave-encashment': /unused leave|leave payout|leave encashment/i,
        'severance': /severance|retrenchment pay|redundancy/i,
        'maternity': /maternity|maternity pay|pregnancy leave/i,
        'uif': /UIF|unemployment insurance/i,
      };
      for (const [intent, pattern] of Object.entries(patterns)) {
        if (pattern.test(question)) return intent;
      }
      return null;
    },

    // Get related tool suggestion for a question
    getRelatedTool(intent, country) {
      const toolMap = {
        'notice-pay': { id: 'leave-calculator', label: 'Check Notice Period & Encashment' },
        'overtime': { id: 'overtime-calc', label: 'Calculate Your OT Pay' },
        'leave-encashment': { id: 'leave-calculator', label: 'Calculate Leave Encashment' },
        'severance': { id: 'leave-calculator', label: 'Calculate Severance' },
        'maternity': { id: 'leave-calculator', label: 'Check Maternity Leave Entitlements' },
        'uif': { id: 'za-uif', label: 'Calculate UIF Benefit' },
      };
      return toolMap[intent] || null;
    },

    // Build country context for AI
    buildContext(country, question) {
      return {
        country,
        question,
        calculationIntent: this.detectCalculationIntent(question),
        timestamp: new Date().toISOString()
      };
    }
  };

  window.AfroTools = window.AfroTools || {};
  window.AfroTools.engines = window.AfroTools.engines || {};
  window.AfroTools.engines.labourLaw = LabourLawEngine;
})();
```

---

## Supabase Schema

```sql
-- Conversation history for logged-in users
create table lla_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users,
  country_code text,
  title text,  -- auto-generated from first question
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Individual question/answer pairs (for analytics + improvement)
create table lla_question_log (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references lla_conversations(id),
  country_code text,
  question text not null,
  answer text,
  helpful boolean,     -- from thumbs up/down
  calculation_intent text,  -- if detected
  related_tool_shown text,  -- which tool was suggested
  session_id text,          -- for anonymous users
  created_at timestamptz default now()
);
```

---

## Rate Limiting & Free Tier

```javascript
// 3 free questions per session (anonymous)
// Unlimited for logged-in users (AfroTools account)
// Rate limit: 20 questions per user per hour (prevent abuse)
// Each question sent to ai-advisor.js Netlify function (existing infrastructure)
// Model: claude-haiku-4-5 for cost efficiency on volume queries
// Complex questions (>200 words context) → escalate to claude-sonnet-4-6
```

---

## Cross-Tool Integration

- **All 14 payroll tools**: After every AI answer, suggest the relevant calculator
- **AfroPayroll OS**: Labour Law Advisor is the final "compliance check" step in Expansion and Offboarding journeys
- **Document Generator**: "Based on this answer, would you like to generate a [termination letter / warning notice]?" → links to doc-generator with context
- **Regulatory Alerts**: If question reveals user doesn't know about a recent change, surface the regulatory alert

---

## Mobile UX

- Chat is full-screen on mobile, no sidebar
- Country context set from device locale on first load, editable
- Voice input button (uses browser speech-to-text API) — many African users prefer speaking
- Citation blocks collapsed by default on mobile (tap to expand)
- Related tool suggestions as bottom-sheet cards
- Keyboard: chat input stays visible above keyboard (use CSS env(keyboard-inset-height) or JS scroll handling)
- Share answer: one tap → WhatsApp share with answer text + link

---

## SEO Strategy

This tool has enormous long-tail SEO potential. Create static answer pages for top questions:
- `/tools/labour-law-advisor/nigeria/salary-deduction-rules/`
- `/tools/labour-law-advisor/kenya/maternity-leave-calculator/`
- `/tools/labour-law-advisor/south-africa/retrenchment-rights/`
- `/tools/labour-law-advisor/ghana/probation-period-rules/`

Each static page: the AI-generated answer + the chat interface to ask follow-ups. Pre-generate for top 50 questions per top 10 countries = 500 SEO pages.
