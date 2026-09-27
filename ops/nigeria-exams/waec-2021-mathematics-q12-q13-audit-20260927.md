# WAEC 2021 Mathematics Paper 2 Q12–Q13 source audit — 2026-09-27

## Source and publication boundary

- Official WAEC WASSCE school-candidate Paper 2 [Question 12](https://www.waeconline.org.ng/e-Learning/Mathematics/maths233mq12.html) and [Question 13](https://www.waeconline.org.ng/e-Learning/Mathematics/maths233mq13.html) were opened in a browser. Each page's prompt PNG and examiner-worked PNG rendered and was visually inspected at native resolution. The four asset URLs and SHA-256 values are pinned in `selected-waec-components.json`.
- The two public guides are independently worded learning companions covering both parts of each selected question. Their circle schematics are original SVG constructed in the browser and have text alternatives. The official images, prompt wording and examiner solution artwork are not copied into the repository or public page. WAEC's site is a source, not a republication licence or an endorsement.
- Question 4 remains held because its official images did not render in the previous 2026-09-27 review. This batch does not establish a complete paper, official marking scheme, or permission to publish the paper.

## Image-fidelity and independent-solution check

| Source | Details checked at native resolution | Independently derived answer and public-guide treatment |
| --- | --- | --- |
| Q12 prompt image, 37,763 bytes, SHA-256 `c2d42b7bc028a8100c9d0c81120b1de750389a4bbb8fbf0c89a06ae87f19f790` | Cyclic order P–Q–R–S; equal chords PQ and QS; ∠SPR = 26°; triangle PQS angle ratio 2:3:3. Part (a) requests ∠PQR, ∠RPQ and ∠PRQ. Part (b) gives P = (7, 3), Q = (5, x), PQ = √29 and asks for real x. | Equal chord angles at P and S are 67.5°, leaving 45° at Q. Same-chord ∠SQR = 26°, so ∠PQR = 71°; ∠RPQ = 41.5°; ∠PRQ = 67.5°. Distance gives 4 + (x − 3)² = 29, hence x = −2 or 8. Both branches verify. The original diagram preserves point order, chords and labelled angle without reproducing WAEC artwork. |
| Q12 examiner image, 30,252 bytes, SHA-256 `415dd4014ef65d80b69a9b7cf674d5cb07c5f831859b91a0217d69688b7331cc` | The examiner method confirms the three angles and both coordinate roots. | Public steps were reconstructed from the given geometry and distance equation; no examiner image or wording is hosted. |
| Q13 prompt image, 38,412 bytes, SHA-256 `e932a041688d6610e552c4c7952b5fd0149e6c69703c7cf8c79157b4840e8d44` | $1,000 deposit on a child's **first** birthday at 4% compounded annually; balance requested when the child is **four** years old. The diagram has centre O on diameter AD, AB = BC and ∠ADC = 50°, requesting ∠BAD. | There are three annual periods: 1000 × 1.04³ = 1124.864, rounded to $1,124.86. Drawing AC gives ∠ACD = 90°, ∠CAD = 40°; cyclic ∠ABC = 130° and isosceles ∠BAC = 25°, so ∠BAD = 65°. The new SVG uses a separately constructed circle and point positions, not traced source artwork. |
| Q13 examiner image, 33,347 bytes, SHA-256 `7594eb59c60d0a9370381fb6015167cf8df1769a7383580c40bc320d79e9cf42` | The examiner works through the third annual compounding period and derives 65° by the diameter, cyclic and equal-chord properties. | The guide labels the three-year interval explicitly to avoid treating age four as four elapsed years. It rounds only the final balance. |

The French and Swahili variants preserve all givens, the requested quantities and the same numerical results. In each locale, the worked solution starts hidden until the learner opens it. Source hashes describe the observed images only; they do not prove rights or future availability.

## Release boundary

This commit contains authored bank data, locale source, source records and focused tests only. The release integrator must regenerate localized banks/pages and other build-owned outputs, validate the combined branch, and verify the deployed route before calling these guides live.
