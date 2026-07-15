# Sickle Cell Genotype Advisor — Audit

**Tool:** Sickle Cell Genotype Compatibility Checker
**Live:** https://afrotools.com/tools/sickle-cell/
**File:** `tools/sickle-cell/index.html`
**Class:** HEALTH-CRITICAL

## What it does
Predicts the probability of each child genotype for any pairing of two parent
haemoglobin genotypes (AA, AS, SS, AC, SC, CC). Renders a compatibility badge
(Compatible / Caution / High Risk), a 2x2 Punnett square, per-genotype outcome
cards with percentages, and contextual advice. Sidebar gives African prevalence
context and testing guidance.

## Genotype-correctness verification (HEALTH-CRITICAL)
I rebuilt every pairing's Punnett square in a Node script (each parent contributes
one of two alleles at random -> four equally likely offspring, 25% each; grouped
by canonical genotype) and compared against the tool's hard-coded `GENOTYPE_DATA`.

**Result: all 21 stored pairings are genetically CORRECT.** Proportions match the
Punnett squares exactly, including:
- AA+AS -> 50 AA / 50 AS; AA+SS -> 100 AS; AA+SC -> 50 AS / 50 AC
- AS+AS -> 25 AA / 50 AS / 25 SS; AS+SS -> 50 AS / 50 SS
- AS+AC -> 25 AA / 25 AS / 25 AC / 25 SC; AS+SC -> 25 AS / 25 SS / 25 AC / 25 SC
- AS+CC -> 50 AC / 50 SC; SS+AC -> 50 AS / 50 SC; SS+SC -> 50 SS / 50 SC
- AC+AC -> 25 AA / 50 AC / 25 CC; AC+SC -> 25 AS / 25 AC / 25 SC / 25 CC
- SC+SC -> 25 SS / 50 SC / 25 CC; SC+CC -> 50 SC / 50 CC; and all 100%-single cases
The compatibility severity buckets are also clinically reasonable (any SS/SC/CC
offspring risk flagged danger; carrier-only outcomes caution/safe).

## Bug found (HEALTH-CRITICAL, live) — FIXED
The dynamically drawn Punnett GRID used a plain `.sort()` on the two alleles.
Because `'C' < 'S'` alphabetically, the S+C cell rendered as **"CS"** instead of
the conventional **"SC"**. Worse, `cellClass()` only tested `g==='SC'` for the red
"affected" style, so the mislabelled "CS" cell fell through to the GREEN "safe"
class — i.e. a child with **SC disease was displayed in a reassuring green cell**
in the visual grid (the numeric outcome cards were unaffected and always correct).
Fixed by sorting alleles in canonical haemoglobin order (A, S, C).

## Real analogues & gaps
Analogues: NHS/CDC genotype inheritance charts, Nigerian pre-marital genotype
counselling material, `/tools/genotype-checker/` (sibling tool on-site).
Gaps: no beta-thalassaemia (AE/E, HbD, HbO-Arab) variants; CC grid cell is styled
amber "carrier" though CC is a mild disease (numeric card labels it correctly);
no persistent share/print of the result plan.

## SEO / UX / trust
- Title, meta description (in range), unique H1, canonical, hreflang present.
- FAQ was visible but had NO FAQPage schema — added (mirrors the 4 visible Q&As).
- No prominent "not medical advice" disclaimer near the result — added.
- No methodology/breakdown of the Punnett logic — added.
- a11y: parent2 `<label>` was not associated with its select — added `for`.
- Red theme is semantic (health/risk), not a brand-accent violation — left as-is.

## Fixes applied 2026-07-14
1. **Punnett grid allele-ordering bug (health-critical):** added `ALLELE_ORDER`
   + `sortGenotype()` and replaced the inline `.sort()` so grid cells read AS/AC/SC
   (never SA/CA/CS) and SC/SS cells receive the correct "affected" (red) class.
2. **Medical disclaimer:** added a prominent red "Educational only — NOT medical
   advice — confirm genotype and consult a doctor & genetic counsellor" note inside
   the results card, near the outcome.
3. **Methodology:** added a "How this is calculated (Punnett method)" expandable
   block explaining the allele-cross logic and per-pregnancy independence.
4. **FAQPage JSON-LD:** added, mirroring the 4 visible FAQ entries verbatim.
5. **a11y:** associated Partner 2 label with its select (`for="parent2"`), clarified
   its aria-label.
6. **Verification:** all 4 ld+json blocks parse (node); all 21 pairings confirmed
   correct via Node Punnett table.

Deferred: beta-thalassaemia / HbD / HbE variants; CC grid-cell color nuance — not
edited (out of surgical scope; no shared files touched).
