# AfroTools Creator Suite — Build Prompts Index

## The 10 Creator Tools (Tier 0)

| #  | Tool | Prompt File | CSS Prefix | Accent Color |
|----|------|-------------|------------|--------------|
| 1  | CreatorPricing — Smart Pricing Calculator | `01-creator-pricing.md` | `cp-` | Coral `#FF6B6B` |
| 2  | CreatorInvoice — Invoice & Quote Builder | `02-creator-invoice.md` | `ci-` | Emerald `#10B981` |
| 3  | CreatorKit — Media Kit & Rate Card Builder | `03-creator-kit.md` | `ck-` | Gold `#F5A623` |
| 4  | CreatorCalendar — Content Calendar & Planner | `04-creator-calendar.md` | `cc-` | Violet `#8B5CF6` |
| 5  | CreatorMoney — Finance Tracker | `05-creator-money.md` | `cm-` | Teal `#14B8A6` |
| 6  | CreatorDesk — Client & Project CRM | `06-creator-desk.md` | `cd-` | Sky `#0EA5E9` |
| 7  | CreatorPage — Link Page & Digital Storefront | `07-creator-page.md` | `cpg-` | Rose `#F43F5E` |
| 8  | CreatorCanvas — Thumbnail & Graphics Studio | `08-creator-canvas.md` | `cv-` | Amber `#F59E0B` |
| 9  | CreatorSplit — Royalty & Collab Splitter | `09-creator-split.md` | `cs-` | Indigo `#6366F1` |
| 10 | CreatorMind — AI Creative Brief & Script Writer | `10-creator-mind.md` | `cmn-` | Fuchsia `#D946EF` |

## Shared Infrastructure
- **Creator Persona tables**: `user_personas`, `creator_profiles`
- **Creator Dashboard**: `/creator/` — unified home showing cross-tool widgets
- **Navbar category**: "Creator Suite" with coral accent `#FF6B6B`
- **Shared engine**: `engines/creator-engine.js` — persona context, cross-tool data
- **AI advisor**: Each tool gets a `TOOL_CONTEXT` entry in `ai-advisor.js`

## Design Principles
- Mobile-first (80%+ African users on phones)
- Touch targets 48px minimum
- Works on 3G — lazy load everything, skeleton screens
- Expressive, not corporate — bold type, generous spacing, personality
- Each tool has its own accent color but shares the AfroTools blue brand shell
- Dark mode via `prefers-color-scheme`
- PWA-ready with offline capability where possible
