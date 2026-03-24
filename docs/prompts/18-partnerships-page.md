# Prompt 18: Partnerships & Integration Page

## Context

Read these files first:
- `advertise/index.html` (existing advertise page)
- `pricing/index.html` (pricing page)
- `api/docs/` or similar API documentation (if exists)
- `index.html` (homepage — understand site positioning)
- `assets/css/design-system.css` (design tokens)

There's no partnerships page for B2B distribution. HR software companies, accounting firms, fintech startups, payroll providers, and African business media all have audiences that need these tools. A dedicated page makes it easy for them to integrate or white-label.

## Objective

Create a `/partnerships/` page that presents integration opportunities for businesses, with clear CTAs for each partner type.

### URL: `/partnerships/index.html`

### Partner Tiers

1. **Embed Partner** (Free)
   - Embed any calculator on their website
   - "Powered by AfroTools" badge required
   - No setup needed — just copy embed code
   - CTA: "Get Embed Code"

2. **API Partner** (Paid — API pricing tier)
   - Full API access to all calculation engines
   - No branding requirement
   - Custom rate limits
   - CTA: "View API Docs" → links to `/api/docs/`

3. **White-Label Partner** (Enterprise)
   - Custom-branded calculators
   - Remove AfroTools branding
   - Custom domain support
   - Dedicated support
   - CTA: "Contact Us" → email or form

4. **Content Partner** (Free/Revenue Share)
   - Co-branded blog content
   - Cross-promotion
   - Newsletter sponsorship
   - CTA: "Apply to Partner"

### Page Sections

1. Hero: "Partner With Africa's Financial Intelligence Platform"
2. Stats bar: "400+ tools | 54 countries | 100K+ monthly calculations"
3. Partner tier cards (4 cards as described above)
4. Use cases grid: "Who Partners With Us?"
   - HR & Payroll Companies
   - Accounting Firms
   - Fintech Startups
   - Business Media & Blogs
   - Government Tax Portals
   - Universities & Business Schools
5. Integration options (embed, API, white-label)
6. Testimonials/logos (placeholder for now)
7. Contact form for partnership inquiries
8. FAQ section

## Constraints

- Follow design system tokens and patterns
- Use Schema.org `WebPage` structured data
- Add OG tags and Twitter cards
- Contact form: use Netlify Forms with `form-name="partnerships"`
- Form fields: name, email, company, partner_type (dropdown), message
- Page must be responsive (mobile-first)
- Add to main navigation under "Business" or similar category
- Add to sitemap
- No fake testimonials or logos — use placeholders with "Your logo here" style
- Include actual stats from the platform (tool count, country count, etc.)
- Link to embed docs (Prompt 13), API docs, and advertise page

## Implementation Steps

1. Create `partnerships/index.html`:
   - Standard page structure (navbar, breadcrumb, footer)
   - All sections as described above
   - Netlify form for partnership inquiries
   - Schema.org structured data
   - OG tags and meta
2. Create `partnerships/partnerships.css` (minimal — mostly design system classes):
   - Partner tier card grid
   - Use case grid
   - Stats bar styling
   - Contact form layout
3. Add form config:
   ```html
   <form name="partnerships" method="POST" data-netlify="true" netlify-honeypot="bot-field">
     <input type="hidden" name="form-name" value="partnerships">
     <input type="hidden" name="bot-field">
     <!-- Fields... -->
   </form>
   ```
4. Add to navigation (footer, and possibly main nav under a "Business" section)
5. Add to `tool-registry.js` if appropriate (or just to sitemap)
6. Add redirects if needed
7. Run `npm run sitemap`

## Verification

- Navigate to `/partnerships/` → page renders with all sections
- Stats show accurate numbers from platform
- Each partner tier card has clear CTA
- Contact form submits to Netlify Forms → check Netlify dashboard for submission
- Page is responsive on mobile
- Schema.org structured data validates (Google Rich Results Test)
- OG tags work (share URL on Twitter/WhatsApp → preview looks correct)
- All links work: embed docs, API docs, advertise page
