# AfroTools 50K Prospect CSV Schema

Updated: 2026-05-15

Use this schema for every 50K prospect file and for the Mission Control local tracker import/export.

```csv
company,website,country,segment,offer,source_url,contact_name,contact_role,contact_email,contact_linkedin,status,next_follow_up,notes
```

## Field Rules

| Field | Required before sending? | Notes |
| --- | --- | --- |
| `company` | Yes | Public company or organization name only. Do not invent companies. |
| `website` | Yes | Official site or public profile for the organization. |
| `country` | Yes | Target country or market. Use `pan-Africa` only when the prospect clearly serves multiple African markets. |
| `segment` | Yes | One of the segment values below. |
| `offer` | Yes | One of the offer values below. |
| `source_url` | Yes | Public URL used to verify fit, such as a resource page, media kit, calculator gap, product page, directory listing, or official contact page. |
| `contact_name` | No | Use only when the person's name is public and relevant. Leave blank when using a role inbox or company form. |
| `contact_role` | Yes | Role or owner type, such as `founder`, `partnerships`, `marketing`, `content`, `product`, `developer relations`, or `contact form`. |
| `contact_email` | No | Use only verified public emails or role emails. Do not add scraped personal emails without verification. |
| `contact_linkedin` | No | Public company or person LinkedIn URL. Prefer company/role pages when the person is not clearly verified. |
| `status` | Yes | Default new rows to `not contacted`. |
| `next_follow_up` | Required after first contact | ISO date format: `YYYY-MM-DD`. Leave blank until first contact is sent. |
| `notes` | Yes | One sentence explaining why the prospect fits. Include route/offer angle here if needed. |

## Segment Values

- `accounting/tax firms`
- `HR/payroll providers`
- `fintech/API targets`
- `schools/edtechs`
- `media/publishers`
- `trade/employer-service targets`

## Offer Values

- `widget`
- `Widget Pro`
- `sponsored tool`
- `media sponsorship`
- `custom calculator`
- `API pilot`
- `business subscription`
- `reserve`

## Status Values

- `not contacted`
- `contacted`
- `replied`
- `demo booked`
- `proposal sent`
- `negotiating`
- `won`
- `lost`
- `paused`

## Safety Rules

- Do not invent contacts, companies, buyer interest, traffic, revenue, customer claims, or sponsor fit.
- Do not add scraped personal emails unless the email is public, verified, and clearly belongs to the person or role.
- Prefer role emails, official contact forms, company LinkedIn pages, or named public decision makers with visible relevance.
- Do not claim a company has a calculator gap unless the `source_url` proves the page, workflow, or public resource exists.
- Do not send outreach from rows with blank `company`, `website`, `country`, `segment`, `offer`, `source_url`, `contact_role`, `status`, or `notes`.
- If both `contact_email` and `contact_linkedin` are blank, the `notes` field must identify the public contact path to research before sending.
