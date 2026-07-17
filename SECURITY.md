# Security Policy

AfroTools takes the security of our users' data seriously. This document explains
how to report a vulnerability and what you can expect from us.

## Reporting a vulnerability

If you believe you have found a security vulnerability in AfroTools, please report
it privately. **Do not** open a public GitHub issue, post it on social media, or
disclose it publicly before we have had a chance to investigate and remediate.

- **Email:** security@afrotools.com
- **Contact form:** https://afrotools.com/contact/
- **Machine-readable contact:** https://afrotools.com/.well-known/security.txt

Please include:

- A description of the vulnerability and its potential impact.
- Clear, reproducible steps (proof-of-concept, affected URL/endpoint, request/response).
- Any relevant logs, screenshots, or payloads.
- How you would like to be credited (optional).

## Our commitment

- We aim to **acknowledge** your report within **3 business days**.
- We aim to provide an **initial assessment** within **10 business days**.
- We will keep you informed as we work toward a fix and let you know when it ships.
- We will credit reporters who wish to be acknowledged, once a fix is deployed.

## Scope

**In scope**

- `afrotools.com` and its subdomains, including the static site and the
  `/.netlify/functions/*` (`/api/*`) serverless endpoints.
- Authentication, account, payment, lead-capture, and data-request flows.
- Client-side data handling (storage of personal data, consent, CSP bypasses).

**Out of scope**

- Third-party services we integrate with (Supabase, Netlify, Paystack, Stripe,
  Resend, Anthropic, Google/Microsoft analytics). Report those to the respective
  vendor; tell us if the issue is caused by our configuration.
- Findings that require a compromised device, physical access, or social
  engineering of AfroTools staff or users.
- Reports from automated scanners without a demonstrated, exploitable impact.
- Denial-of-service, volumetric, or rate-limit-exhaustion testing. **Please do not
  run these against production.**
- Missing security headers or best-practice suggestions with no concrete impact
  (welcome as informational notes, but not treated as vulnerabilities).

## Safe harbour

We will not pursue or support legal action against researchers who:

- Act in good faith and follow this policy.
- Avoid privacy violations, data destruction, and service degradation.
- Only interact with accounts they own or have explicit permission to test.
- Give us reasonable time to remediate before any public disclosure.

## Handling of personal data

If your testing incidentally exposes personal data belonging to others, stop,
do not store or share it, and tell us immediately at security@afrotools.com.

For how AfroTools collects, stores, and lets users control their own data, see:

- Privacy Policy — https://afrotools.com/privacy/
- Cookie Policy — https://afrotools.com/cookies/
- Self-service data requests — https://afrotools.com/privacy/data-request/
- Internal data-handling map — `docs/data-handling.md`

_Last updated: July 2026._
