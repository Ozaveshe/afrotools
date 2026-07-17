# Payroll Tools — Build Improvement Prompts Index

## Context

These 14 tools exist today at `/tools/{id}/` and are surfaced via the `/salary-tax/payroll/` hub.
Each prompt in this folder is a comprehensive upgrade spec — taking the tool from its current basic state to a world-class, Africa-first product.

The analysis that generated these specs is in: `docs/salary-suite/` (architecture decisions) and the competitive landscape research conducted April 2026.

## The 14 Tools

| # | Tool ID | Name | Prompt File | Accent | Priority |
|---|---------|------|-------------|--------|----------|
| 1 | `minimum-wage` | Minimum Wage Checker | `01-minimum-wage.md` | Green `#059669` | P1 |
| 2 | `overtime-calc` | Overtime Calculator | `02-overtime-calc.md` | Orange `#EA580C` | P1 |
| 3 | `leave-calculator` | Leave Calculator | `03-leave-calculator.md` | Blue `#0284C7` | P1 |
| 4 | `social-security` | Social Security Calculator | `04-social-security.md` | Indigo `#4F46E5` | P1 |
| 5 | `pension-proj` | Pension Projection Calculator | `05-pension-proj.md` | Purple `#7C3AED` | P1 |
| 6 | `payslip-generator` | Payslip Generator | `06-payslip-generator.md` | Teal `#0D9488` | P1 |
| 7 | `staff-cost` | Employee Cost Calculator | `07-staff-cost.md` | Amber `#D97706` | P1 |
| 8 | `salary-compare` | African Salary Compare | `08-salary-compare.md` | Rose `#E11D48` | P1 |
| 9 | `ng-pension` | Nigeria Pension (CPS) | `09-ng-pension.md` | Green `#16A34A` | P2 |
| 10 | `ke-nssf` | Kenya NSSF Calculator | `10-ke-nssf.md` | Red `#DC2626` | P2 |
| 11 | `za-gepf` | South Africa GEPF | `11-za-gepf.md` | Blue `#1D4ED8` | P2 |
| 12 | `gh-ssnit` | Ghana SSNIT Calculator | `12-gh-ssnit.md` | Amber `#B45309` | P2 |
| 13 | `za-uif` | South Africa UIF | `13-za-uif.md` | Sky `#0369A1` | P2 |
| 14 | `job-offer-evaluator` | Job Offer Evaluator | `14-job-offer-evaluator.md` | Violet `#6D28D9` | P1 |

## Architecture Constraints (all tools)
- Plain HTML + CSS + JS — no frameworks
- IIFE engine pattern: `(function() { 'use strict'; ... })()`
- CSS custom properties from `tokens.min.css` — no hardcoded brand colors
- Supabase via `AfroAuth.getSupabase()` for auth-gated features
- AI via `/.netlify/functions/ai-advisor` — never direct Anthropic calls from client
- Mobile-first, 3G-capable, < 100KB JS per page
- `prefers-reduced-motion` respected, no looping animations
- All tools must link into AfroPayroll OS workflow (carry data via URL params + localStorage key `apo_prefill`)

## Build Priority
P1 tools (highest traffic potential + most competitive gap) should be upgraded first.
P2 tools are country-specific and can follow once P1 tools are upgraded.
