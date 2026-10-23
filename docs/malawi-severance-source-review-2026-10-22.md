# Malawi severance estimate: source and calculation scope

The missing `SEVERANCE_RULES.MW` entry caused the existing Malawi gratuity route's ordinary `10000.5` monthly pay / `5.5` years scenario to return `Country not found`. This was not a computed NaN. This repair supplies a **conditional severance estimate**, not a determination that every employee leaving a job is entitled to payment.

## Primary texts and source distinction

- [Employment (Amendment) Act 27 of 2010, Gazette published 30 July 2010](https://natlex.ilo.org/dyn/natlex2/natlex2/files/download/91385/MWI91385.pdf), section 2 and replacement First Schedule Part I (PDF page 5): two weeks for each completed year in the first five years, three in the next five, four thereafter. This enacted amending text replaces the original 2000 schedule. The web reader exposed the six-page text; direct local acquisition returned HTTP403, and web screenshot calls yielded no inspectable pixels. No local PDF or visual-review claim is made for it.
- [Employment (Amendment) Act 17 of 2021](https://natlex.ilo.org/dyn/natlex2/natlex2/files/download/112666/MWI112666.pdf): the primary text's indexed arrangement concerns sections 3, 4, 5, 45, 46A, 47, 47A, 50A and 51. It does not list section35 or the First Schedule. Full visual review was unavailable; this is not an exhaustive certification of all subsequent law.
- [Gondwe v Opportunity International Bank Ltd, 2021 MWHC268, 13 August 2021](https://media.malawilii.org/media/judgment/4687/source_file/gondwe-v-opportunity-international-bank-limited-2021-mwhc-268-13-august-2021.pdf), actual PDF page7, paragraphs34–36: the Court uses monthly pay ×12÷52 for weekly wages and counts five complete years for employment lasting about five and a half years. The PDF was downloaded, extracted, rendered and visually inspected.
- The [Justice Ministry's original Employment Act PDF](https://www.justice.gov.mw/sites/default/files/2021-06/Employment%20Act.pdf) and [Labour Ministry's original Act](https://labour.gov.mw/images/documents/employment-act.pdf) still reproduce the original schedule. Their current hosting dates do not supersede the enacted amendment.

## Estimate contract

The caller supplies the qualifying current monthly wage and continuous service years. `floor(years)` counts completed years. Tier widths are cumulative; later rates never reprice earlier years. Monthly wage is converted by ×12÷52. The engine retains the unrounded weekly wage, then rounds the final total to the nearest kwacha for the existing result format. This is a disclosed planning convention, **not a claim that statute prescribes final rounding**. The Gondwe judgment rounded its intermediate weekly figure; therefore its published total is not asserted as an exact oracle for this different final-rounding convention.

For the synthetic reported scenario, 5.5 years means five completed years and ten weeks. `10000.5 ×12÷52 ×10 = 23078.076923…`; displayed estimate **MWK23078**. This is derived arithmetic, not an official worked assessment.

Eligibility still depends on the amended section35: qualifying redundancy, retrenchment, economic/operational termination or unfair dismissal, with its statutory exceptions. Qualifying wages can include cash allowances and in-kind components; basic salary alone need not be the correct base. Gratuity for pension-exempt employment under section35A/PartII is a separate five-percent-per-completed-month scheme and is not calculated here. Pre-1 June2011 pension-transition entitlements and other pension dues are also outside this estimate.

## Integration and limits

The candidate changes only the HR source engine, appends one Malawi data entry and adds this evidence note plus meaningful engine regressions. Existing country entries and non-Malawi paths remain unchanged. Somalia's missing rule is explicitly unsolved. The separately owned generator/controller stale-result proposal must compose against this data, and the final generated Malawi page must identify this conditional severance basis. No current all-country legal, browser, export or production acceptance follows from numeric regression coverage.

## Dated ILO corroboration and visible page scope

On 22 October2026 the official [ILO EPLex redundancy/severance comparison](https://eplex.ilo.org/index.php/redundancy-and-severance-pay), explicitly identified2025 Malawi row, was read through the web search response. Its amended schedule distinguishes the first five completed years, next five and later years at2/3/4weeks, and identifies the older pre2011 schedule separately. This is corroborating ILO legal research, not a new enacted amendment. The exact country-detail2025 URL had two web timeouts and a directHTTP403; no successful current country-page body or complete current-law certificate is claimed. The generic unversioned page can show older numbers and must not be used as the current schedule.

The source5 generator addition is conditional on the Malawi gratuity/severance page only. It labels qualifying monthly wage and completed years, gives conditional eligibility before calculation and exposes the source and disclosed rounding convention beside the result. The full component/exclusion note is expandable. The existing gs01 invalid-input and stale-result behavior remains. No automatic eligibility or pension-exempt-gratuity claim is added. Freelancer generator changes occupy a separately reviewed Q source; an exact preferred composition and inverse preserve its frozen post. Browser and final cumulative artifact acceptance remain separate.
