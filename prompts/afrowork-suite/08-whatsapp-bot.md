# Prompt 08 — WhatsApp Bot: Zero-Friction Payroll Access

## Identity

| Field | Value |
|-------|-------|
| **Name** | AfroTools WhatsApp Bot |
| **Tagline** | "Payroll calculations. On WhatsApp. Free." |
| **Path** | `/afrowork/whatsapp/` (info page) |
| **CSS prefix** | `wb-` |
| **Accent color** | WhatsApp Green `#25D366` / dark `#128C7E` / pale `#F0FDF4` |
| **Engine** | `engines/whatsapp-bot-engine.js` (command parser) |
| **Netlify function** | `netlify/functions/afrowork-whatsapp.js` (webhook handler) |
| **Supabase tables** | `wb_conversations`, `wb_usage_log` |
| **External requirement** | Meta WhatsApp Business API approval (longest lead time in the suite) |

---

## Why WhatsApp

This is non-negotiable for Africa:
- **WhatsApp penetration**: 97%+ of Nigerian smartphone users, 90%+ in Kenya, South Africa, Ghana
- **The working class uses WhatsApp, not websites**: a security guard, a factory worker, a domestic worker checking their overtime rate will never visit afrotools.com — but they will WhatsApp a number
- **Zero friction**: no app download, no browser, no account. Just a message.
- **Viral by nature**: WhatsApp messages forward. If a worker gets a useful payroll answer, they forward it to their 10 coworkers. Each of those becomes a user.

**This is the distribution flywheel** that gets AfroTools into the hands of the 500 million African workers who will never find us via Google.

---

## Commands (Full List)

The bot understands natural language but also structured commands for fast results:

### PAYE / Net Pay
```
PAYE Nigeria 450000
PAYE NG 450000 NGN
paye kenya 120000
"how much is net pay for 300k in ghana"
```
→ Returns: gross, PAYE deduction, pension, social security, net pay, effective rate

### Minimum Wage
```
MINWAGE Nigeria
minimum wage kenya
min wage south africa domestic worker
```
→ Returns: current minimum wage (monthly, daily, hourly), effective date, penalty for non-compliance

### Overtime
```
OT Nigeria 200000 8 hours weekday
overtime kenya 120000 4 hours public holiday
```
→ Returns: OT rate, multiplier, OT pay, total pay

### Leave Entitlements
```
LEAVE Ghana
leave entitlement south africa
maternity leave kenya
```
→ Returns: annual leave, sick leave, maternity days + pay %, paternity days

### Social Security / Pension
```
PENSION Nigeria 300000
ssnit ghana 5000
nssf kenya 150000
```
→ Returns: employee + employer contributions, total, breakdown by scheme

### Compliance Deadlines
```
DEADLINE Nigeria
deadlines kenya april
paye deadline ghana
```
→ Returns: upcoming statutory deadlines for the month

### Salary Benchmark
```
SALARY software engineer lagos
salary nurse nairobi
what does a data analyst earn in south africa
```
→ Returns: median salary, p25-p75 range, top industry, links to full AfroSalary DB

### Labour Law Question
```
LAW can my employer deduct money for broken equipment nigeria
can i be fired without notice after 5 years kenya
notice period south africa
```
→ Routes to Claude AI for a full answer with legal citation

### Help
```
HELP
menu
what can you do
```
→ Returns: full command list

---

## Conversation Flow Design

### First message from new user:
```
Bot: 👋 Welcome to AfroTools — Africa's #1 payroll calculator.

I can help with:
📊 PAYE & net pay calculations
💰 Minimum wage checks
⏰ Overtime calculations
🌴 Leave entitlements
🏦 Pension & social security
📅 Tax filing deadlines
⚖️ Labour law questions

Try: *PAYE Nigeria 300000*
Or ask me anything about your payslip, rights, or salary!

🌍 I cover all 54 African countries.
```

### PAYE query flow:
```
User: PAYE Nigeria 450000

Bot: 🇳🇬 *Nigeria PAYE Calculation*
Monthly Gross: ₦450,000

*Earnings:*
Basic: ₦450,000

*Deductions:*
PAYE: ₦38,250
Pension (8%): ₦36,000
NHF (2.5%): ₦11,250
Total deductions: ₦85,500

*Net Pay: ₦364,500*
Effective tax rate: 8.5%

📋 Law: Personal Income Tax Act 2023
🔗 Full calculation: afrotools.com/nigeria/ng-salary-tax/

_Type HELP for more commands_
```

### Labour law question flow:
```
User: can my employer deduct money from my salary for breaking equipment in Nigeria

Bot: ⚖️ *Nigeria — Salary Deduction Rules*

Under the Labour Act Cap L1, an employer *cannot* deduct money from your salary for accidental equipment damage without:
1. A written deduction agreement signed BEFORE the incident
2. The deduction must not reduce your salary below minimum wage

If no agreement was signed: the deduction is *illegal*.

*What you can do:*
→ Write to your employer citing Labour Act s.7
→ File a complaint at your State Ministry of Labour
→ Contact the National Industrial Court (NIC)

🔗 More: afrotools.com/tools/labour-law-advisor/

_Ask another question or type HELP_
```

### Ambiguous query:
```
User: I need help with my salary

Bot: I can help! What do you need?

1️⃣ Calculate net pay after tax
2️⃣ Check if my salary is above minimum wage
3️⃣ Calculate overtime pay
4️⃣ Check what I'm owed if I'm leaving my job
5️⃣ Ask a labour law question

Reply with a number, or ask your question directly.
```

---

## Netlify Function (Webhook Handler)

```javascript
// netlify/functions/afrowork-whatsapp.js
// Handles incoming WhatsApp messages via Meta Cloud API webhook

exports.handler = async (event) => {
  // 1. Verify webhook signature (Meta security check)
  // 2. Parse incoming message from event.body
  // 3. Extract: from (phone number), message text, message type
  // 4. Detect command type:
  //    - Structured: PAYE, MINWAGE, OT, LEAVE, PENSION, DEADLINE, SALARY, LAW, HELP
  //    - Natural language: route to intent detection
  // 5. Execute calculation (call same engine functions as web tools)
  // 6. Format response as WhatsApp message (bold = *text*, italic = _text_)
  // 7. Send response via WhatsApp Cloud API
  // 8. Log conversation to wb_usage_log

  const body = JSON.parse(event.body);
  const message = body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
  if (!message) return { statusCode: 200 }; // ignore non-message webhooks

  const from = message.from;  // phone number
  const text = message.text?.body?.trim();

  const intent = detectIntent(text);
  const response = await handleIntent(intent, text);
  await sendWhatsAppMessage(from, response);
  await logUsage(from, text, intent.type);

  return { statusCode: 200 };
};
```

---

## Intent Detection Engine

```javascript
// engines/whatsapp-bot-engine.js
(function() {
  'use strict';

  const WhatsAppBotEngine = {

    INTENT_PATTERNS: [
      { type: 'paye', patterns: [/^paye\s/i, /net\s*pay/i, /take\s*home/i, /tax\s+on\s+salary/i, /income\s*tax/i] },
      { type: 'minwage', patterns: [/^min\s*wage/i, /minimum\s*wage/i, /^minwage/i] },
      { type: 'overtime', patterns: [/^ot\s/i, /^overtime/i, /extra\s*hours/i, /worked\s+\d+\s+hours/i] },
      { type: 'leave', patterns: [/^leave/i, /maternity/i, /paternity/i, /annual\s*leave/i, /sick\s*leave/i] },
      { type: 'pension', patterns: [/^pension/i, /^nssf/i, /^ssnit/i, /^gepf/i, /social\s*security/i, /^uif/i] },
      { type: 'deadline', patterns: [/^deadline/i, /when\s+is\s+paye\s+due/i, /filing\s+deadline/i] },
      { type: 'salary', patterns: [/^salary\s/i, /what\s+does\s+.+\s+earn/i, /market\s+rate/i, /how\s+much\s+should/i] },
      { type: 'law', patterns: [/^law\s/i, /is\s+it\s+legal/i, /can\s+my\s+employer/i, /my\s+rights/i, /fired\s+without/i, /deduct\s+from\s+salary/i] },
      { type: 'help', patterns: [/^help$/i, /^menu$/i, /^hi$/i, /^hello$/i, /what\s+can\s+you/i] },
    ],

    // Parse country from message text
    parseCountry(text) {
      const countries = {
        'nigeria': 'NG', 'nigerian': 'NG', 'ng': 'NG',
        'kenya': 'KE', 'kenyan': 'KE', 'ke': 'KE',
        'south africa': 'ZA', 'sa': 'ZA', 'za': 'ZA',
        'ghana': 'GH', 'ghanaian': 'GH', 'gh': 'GH',
        'tanzania': 'TZ', 'tz': 'TZ',
        'uganda': 'UG', 'ug': 'UG',
        'ethiopia': 'ET', 'et': 'ET',
        'egypt': 'EG', 'eg': 'EG',
        'morocco': 'MA', 'ma': 'MA',
        'senegal': 'SN', 'sn': 'SN',
        // ... all 54 countries
      };
      const lower = text.toLowerCase();
      for (const [name, code] of Object.entries(countries)) {
        if (lower.includes(name)) return code;
      }
      return null;
    },

    // Parse salary amount from message
    parseSalary(text) {
      // Matches: 450000, 450,000, 450k, 4.5m, NGN 450000
      const match = text.match(/(\d[\d,]*\.?\d*)\s*(k|m)?/i);
      if (!match) return null;
      let amount = parseFloat(match[1].replace(/,/g, ''));
      if (match[2]?.toLowerCase() === 'k') amount *= 1000;
      if (match[2]?.toLowerCase() === 'm') amount *= 1000000;
      return amount;
    },

    detectIntent(text) {
      for (const { type, patterns } of this.INTENT_PATTERNS) {
        if (patterns.some(p => p.test(text))) {
          return {
            type,
            country: this.parseCountry(text),
            salary: this.parseSalary(text)
          };
        }
      }
      // Default: route to AI for natural language
      return { type: 'natural-language', country: this.parseCountry(text) };
    },

    // Format number as currency for WhatsApp
    formatCurrency(amount, currency) {
      const symbols = { NGN: '₦', KES: 'KES ', ZAR: 'R', GHS: 'GH₵' };
      return (symbols[currency] || currency + ' ') + new Intl.NumberFormat().format(Math.round(amount));
    }
  };

  window.AfroTools = window.AfroTools || {};
  window.AfroTools.engines = window.AfroTools.engines || {};
  window.AfroTools.engines.whatsappBot = WhatsAppBotEngine;
})();
```

---

## Info Page (`/afrowork/whatsapp/`)

A landing page explaining the WhatsApp bot:

- **Hero**: WhatsApp green accent, phone mockup showing conversation
- **"Start chatting"** CTA → `https://wa.me/{BUSINESS_NUMBER}?text=HELP` (opens WhatsApp directly)
- **Examples**: 3-4 WhatsApp conversation screenshots showing PAYE, overtime, labour law
- **Command list**: Full table of commands with examples
- **Countries**: 54-flag grid
- **Privacy**: "We don't store your phone number beyond your conversation. No spam."
- **QR code**: Scan to open WhatsApp immediately (for sharing in physical spaces)
- **For employers**: "Save the number and share with your team" → bulk adoption mechanic

---

## Supabase Schema

```sql
create table wb_conversations (
  id uuid primary key default gen_random_uuid(),
  phone_hash text not null,    -- hashed phone number (privacy)
  country_code text,           -- most recently mentioned country
  first_message_at timestamptz default now(),
  last_message_at timestamptz default now(),
  message_count integer default 0
);

create table wb_usage_log (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references wb_conversations(id),
  intent_type text,            -- 'paye' | 'minwage' | 'overtime' | 'law' | etc.
  country_code text,
  success boolean,
  response_time_ms integer,
  created_at timestamptz default now()
);
```

---

## WhatsApp Business API Setup (Pre-Requisites)

This is why WhatsApp Bot is built last in the suite:

1. **Meta Business Account**: verify AfroTools business on Meta
2. **WhatsApp Business API access**: apply at developers.facebook.com — approval takes 2–8 weeks
3. **Business phone number**: dedicated number for AfroTools bot (cannot be an existing WhatsApp number)
4. **Message template approval**: outbound templates (alerts) require Meta pre-approval per template
5. **Hosting**: webhook must be HTTPS — Netlify functions handle this automatically
6. **Pricing**: Meta charges per conversation (free for user-initiated for 24hr window; template messages have per-message fee)

---

## Viral Mechanics

- Every response ends with a short link to the full tool on afrotools.com → drives web traffic
- "Share this with a colleague" suggestion after PAYE calculation → WhatsApp forward
- Employers encouraged to save the number and share with all employees → team-level adoption
- QR code on the `/afrowork/whatsapp/` page → shareable in offices, WhatsApp groups, printed materials
- "AfroTools WhatsApp Bot" becomes a shareable link in HR WhatsApp groups (there are thousands of these groups with hundreds of members in Nigeria, Kenya, South Africa)

---

## Cross-Tool Integration

- All calculation results include a link to the full tool for detailed breakdown
- Labour law questions routed through the same Claude-powered Labour Law Advisor backend
- Regulatory alerts can be sent proactively via WhatsApp to subscribed users (outbound template messages, requires Meta template approval per message type)
- AfroSalary Database salary benchmarks accessible via SALARY command
- Compliance Calendar accessible via DEADLINE command

---

## Languages (Future)

Initial launch: English.
Future iterations:
- Swahili: PAYE Kenya 120000 in Swahili command set
- French: for Francophone Africa — same commands in French
- Hausa: Nigeria northern market

The bot should detect language from the message and respond in kind (Claude handles multilingual naturally).
