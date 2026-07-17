# Prompt 17: WhatsApp Tax Calculator Bot

## Context

Read these files first:
- `netlify/functions/ai-advisor.js` (existing AI endpoint — architecture reference)
- `assets/js/engines/` (all PAYE engine files)
- `netlify/functions/api-tax.js` (existing tax API)
- `netlify/functions/api-forex.js` (forex API)
- `netlify.toml` (function configuration)

Africa's primary communication channel is WhatsApp. A WhatsApp bot that does quick tax calculations would be viral — users text their salary, get their tax breakdown. The calculation engines already exist server-side (pure functions).

## Objective

Build a WhatsApp bot endpoint that accepts natural language salary queries and returns formatted tax breakdowns. Uses WhatsApp Business API (via webhook).

### Conversation Flow

```
User: "My salary is 500000 naira"
Bot:  🇳🇬 Nigeria PAYE Breakdown
      ━━━━━━━━━━━━━━━━━━━━━
      Gross:    ₦500,000/month
      Tax:      ₦41,667/month
      Pension:  ₦40,000/month
      Net Pay:  ₦418,333/month

      Effective Rate: 8.3%

      📊 Full breakdown: afrotools.com/nigeria/ng-salary-tax?g=500000

      Try another salary or type "help" for commands.
```

### Commands

```
"500000 naira" or "500k NGN"     → Nigeria PAYE
"$3000 USD in Kenya"              → Convert + Kenya PAYE
"compare 500000 NGN in NG vs KE"  → Side-by-side comparison
"vat 15% on 10000 KES"            → VAT calculation
"forex USD to NGN"                → Current exchange rate
"help"                            → List available commands
```

### Architecture

```
WhatsApp User → WhatsApp Business API → Webhook → Netlify Function → Parse → Engine → Format → Reply
```

## Constraints

- Netlify Function: `netlify/functions/whatsapp-webhook.js`
- WhatsApp Business API requires:
  - Webhook verification (GET with challenge token)
  - Message handling (POST with message body)
  - Reply via API call to WhatsApp
- Environment variables needed: `WHATSAPP_TOKEN`, `WHATSAPP_VERIFY_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`
- PAYE engines must be importable server-side (they're currently browser IIFE scripts)
  - Create server-side wrappers: `netlify/functions/_engines/` that export the same calc functions
  - OR use the existing `api-tax.js` endpoint internally
- Natural language parsing: simple regex matching, NOT a full NLP system
  - Match patterns: `\d+[\d,]*\s*(naira|NGN|KES|ZAR|USD|GHS|...)`
  - Country detection from currency or explicit mention
- Rate limiting: max 20 messages per phone number per day (free tier bot)
- Message format: plain text with emoji (WhatsApp doesn't support rich HTML)
- Unicode currency symbols and flag emojis for visual appeal
- Response must be under 4096 characters (WhatsApp message limit)
- Track usage: log message count per phone number (anonymized — hash the number)
- Pro upsell: after 5 calculations, add footer "Unlock unlimited calculations at afrotools.com/pro"

## Implementation Steps

1. Create `netlify/functions/_engines/server-engines.js`:
   - Import/require all PAYE engine pure functions
   - Export unified interface: `calculatePAYE(countryCode, grossAnnual, options)`
   - This is a Node.js-compatible version of the browser engines
2. Create `netlify/functions/whatsapp-webhook.js`:
   - GET handler: webhook verification (return `hub.challenge` token)
   - POST handler: parse incoming message
   - Natural language parser:
     - Extract salary amount (handle: 500000, 500,000, 500k, 500K)
     - Extract currency (NGN, naira, KES, shillings, USD, etc.)
     - Map currency to country code
     - Detect command type (paye, vat, forex, compare, help)
   - Call appropriate engine/API
   - Format response as WhatsApp-friendly text
   - Reply via WhatsApp Business API `POST https://graph.facebook.com/v18.0/{phone_id}/messages`
3. Create message templates:
   - PAYE result template
   - VAT result template
   - Forex result template
   - Comparison template
   - Help message template
   - Error/unknown message template
4. Add rate limiting:
   - Use Netlify Blobs to track message count per hashed phone number
   - Key: `wa_rate:{hash(phone)}:{date}` → count
   - After 20/day: reply "Daily limit reached. Sign up at afrotools.com for unlimited access."
5. Add redirect: `/api/whatsapp /.netlify/functions/whatsapp-webhook 200`
6. Add env vars documentation for WhatsApp Business API setup
7. Create `docs/WHATSAPP-SETUP.md` with Meta Business Manager setup instructions

## Verification

- GET `/api/whatsapp?hub.mode=subscribe&hub.challenge=test123&hub.verify_token=YOUR_TOKEN` → returns `test123`
- POST `/api/whatsapp` with simulated WhatsApp message payload → returns 200
- Test message parsing: "500000 naira" → correctly parsed as NG, 500000
- Test message parsing: "$3000 in Kenya" → correctly parsed as KE, USD 3000 converted
- Test formatted response: confirm emoji, line breaks, and formatting correct
- Test rate limit: send 21 messages → 21st gets limit message
- Test "help" command → returns command list
- Test unknown message → returns helpful fallback
