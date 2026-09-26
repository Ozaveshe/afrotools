# WAEC 2022 Mathematics Paper 2 Question 1(a) review — 2026-09-26

## Source boundary

- [WAEC's official WASSCE school-candidate Paper 2 examiner page](https://www.waeconline.org.ng/e-Learning/Mathematics/maths235mq1.html) identifies the 2022 paper and Question 1, but its HTML omits the mathematical expressions in part (a). It is not by itself sufficient to reconstruct the question.
- Page 2 of a [user-uploaded scan of the original examination booklet](https://www.scribd.com/document/919631528/Nija-wassce2#page=2) was visually inspected. It shows the consecutive terms **7 − 2x, 9, 5x + 17**, the condition **r > 0**, and the request to find the values of **x**. A [separate Myschool transcription](https://myschool.ng/classroom/mathematics/65854?exam_type=waec&exam_year=2022&page=10) agrees on those givens. The scan is rights-reserved, so AfroTools links to it and publishes only an independently worded brief and explanation. No source scan image is hosted or represented as an official answer key.
- The source scan was checked by visual rendering only; no remote scan-byte hash is asserted. The SHA-256 in the selected-component source entry covers the *AfroTools adapted brief*, not the scan. Its `sha256: null` explicitly records the lack of a scan-byte fingerprint.

## Independent answer check

For consecutive geometric-progression terms, the square of the middle term equals the product of its neighbours:

`9² = (7 − 2x)(5x + 17) = 119 + x − 10x²`.

Thus `10x² − x − 38 = (x − 2)(10x + 19) = 0`, giving **x = 2** or **x = −19/10**. Both satisfy the positive-ratio condition:

| x | Three terms | Common ratio |
| --- | --- | --- |
| 2 | 3, 9, 27 | 3 |
| −19/10 | 54/5, 9, 15/2 | 5/6 |

The publisher transcription's worked answer drops the minus sign on the second root despite displaying the correct factorization. This is an internal answer-check finding and is deliberately not shown to students. The student guide gives both checked roots with a short explanation and checklist. Existing part (b) remains separate; together the two adapted guides cover both numbered parts of Question 1, not the full paper.
