# Prompt 19: Salary Data Crowdsourcing (Glassdoor for Africa)

## Context

Read these files first:
- `supabase/migrations/` (find salary_benchmarks table if it exists)
- `assets/js/components/salary-benchmark-widget.js` (existing salary widget)
- `netlify/functions/aggregate-salary-benchmarks.js` (aggregation function)
- `assets/js/lib/analytics.js` (event tracking)
- `docs/PLATFORM_STANDARDS.md` (design patterns)

There's a `salary_benchmarks` table but it appears to be admin-seeded, not user-contributed. Africa has a massive salary transparency gap — there's no Glassdoor, no Levels.fyi, no reliable public salary data for most countries. AfroTools is uniquely positioned to fill this gap because users are ALREADY entering their salaries into PAYE calculators.

## Objective

Build a salary data crowdsourcing system that:
1. Asks users to anonymously contribute their salary data after PAYE calculations
2. Aggregates contributions into public salary benchmarks
3. Displays salary ranges by country, role, experience, and industry
4. Creates a data moat that competitors can't replicate

### Data Collection Flow

```
User calculates PAYE (already enters salary)
  → After result, show: "Help others! Share your salary anonymously to improve benchmarks."
  → Optional form: Job Title, Industry, Experience Level, City
  → One-click submit (salary auto-filled from calculation)
  → Data goes to salary_submissions table (fully anonymous)
```

### New Table: `salary_submissions`

```sql
CREATE TABLE salary_submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  country_code TEXT NOT NULL,
  currency TEXT NOT NULL,
  gross_salary_annual NUMERIC NOT NULL,
  job_title TEXT,                        -- free text, normalized server-side
  job_category TEXT,                     -- 'engineering' | 'finance' | 'marketing' | etc.
  industry TEXT,                         -- 'technology' | 'banking' | 'construction' | etc.
  experience_level TEXT,                 -- 'entry' | 'mid' | 'senior' | 'executive'
  city TEXT,                             -- optional
  company_size TEXT,                     -- '1-10' | '11-50' | '51-200' | '201-500' | '500+'
  employment_type TEXT,                  -- 'employed' | 'self-employed' | 'contract'
  submitted_at TIMESTAMPTZ DEFAULT now(),
  verified BOOLEAN DEFAULT false,        -- admin verification flag

  -- Anti-spam
  submission_hash TEXT UNIQUE,           -- hash of (country + salary + job_title + submitted_date) to prevent duplicate spam
  ip_hash TEXT                           -- hashed IP for rate limiting (NOT the actual IP)
);
```

### Aggregated View: `salary_benchmarks_view`

```sql
CREATE MATERIALIZED VIEW salary_benchmarks_agg AS
SELECT
  country_code,
  job_category,
  experience_level,
  industry,
  COUNT(*) as sample_size,
  PERCENTILE_CONT(0.25) WITHIN GROUP (ORDER BY gross_salary_annual) as p25,
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY gross_salary_annual) as median,
  PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY gross_salary_annual) as p75,
  MIN(gross_salary_annual) as min_salary,
  MAX(gross_salary_annual) as max_salary,
  AVG(gross_salary_annual) as avg_salary
FROM salary_submissions
WHERE verified = true OR submitted_at > now() - interval '90 days'
GROUP BY country_code, job_category, experience_level, industry
HAVING COUNT(*) >= 5;  -- minimum sample size for privacy
```

### Public Salary Explorer Page

URL: `/tools/salary-explorer/index.html`

Filters: Country, Job Category, Experience Level, Industry
Display: Salary range chart (box plot or bar chart), sample size, comparison to regional average

## Constraints

- **Privacy is paramount**: No user IDs stored. No way to trace a submission back to a user.
- Minimum sample size of 5 before showing aggregated data (prevent identification)
- Job title normalization: map free text to categories server-side (e.g., "Software Engineer" → "engineering", "React Developer" → "engineering")
- Anti-spam: hash-based dedup (same country + salary + job + date = duplicate), IP-based rate limit (max 3 submissions per IP per day)
- The submission prompt appears AFTER calculation result, as an optional callout — NOT blocking
- One-click submit: salary, country, currency auto-filled from calculation
- Follow design system for all UI
- RLS: anonymous INSERT only, SELECT restricted to service_role. Public reads go through API function.
- Materialized view refreshed by scheduled function (daily)
- Do NOT store actual IP addresses — hash with a daily salt

## Implementation Steps

1. Create migration: `supabase/migrations/0XX-salary-submissions.sql`:
   - `salary_submissions` table
   - `salary_benchmarks_agg` materialized view
   - Indexes on country_code, job_category, experience_level
   - RLS policies
2. Create `netlify/functions/api-salary-submit.js`:
   - Accept submission data
   - Normalize job title → job_category mapping
   - Hash IP for rate limiting
   - Check for duplicates via submission_hash
   - Insert into salary_submissions
3. Create `netlify/functions/api-salary-benchmarks.js`:
   - GET with filters: country_code, job_category, experience_level, industry
   - Read from materialized view
   - Cache response (6 hours TTL)
4. Create `netlify/functions/scheduled-refresh-salary-view.js`:
   - Scheduled daily at 2 AM UTC
   - `REFRESH MATERIALIZED VIEW salary_benchmarks_agg`
5. Create submission prompt component `assets/js/components/salary-contribute.js`:
   - Web component `<afro-salary-contribute>`
   - Appears after PAYE calculation result
   - Pre-fills: salary, country, currency from RESULT
   - Optional fields: Job Title (text), Industry (dropdown), Experience (dropdown), City (text), Company Size (dropdown)
   - One-click "Share Anonymously" button
   - Shows "Thank you! Your data helps X people benchmark salaries in [Country]" after submission
   - Dismissible, remembers dismissal for 30 days
6. Create `/tools/salary-explorer/index.html`:
   - Filter controls
   - Salary range visualization (Chart.js bar chart with P25/Median/P75)
   - Sample size indicator
   - Country comparison view
7. Add redirects and sitemap entries
8. Run `npm run minify`

## Verification

- Calculate PAYE on any country → salary contribution prompt appears below result
- Fill optional fields → submit → check `salary_submissions` table
- Submit same data twice → second submission blocked (duplicate hash)
- Navigate to `/tools/salary-explorer/` → select Nigeria + Engineering → salary range displayed
- Check aggregation: need 5+ submissions in same group before data shows
- Check privacy: no user_id or real IP stored in submissions table
- Rate limit: 4th submission from same IP in a day → rejected
