# French native oracle source review — 27 September 2026

The Ghana amount-to-words English page changed after the previous French native-oracle fingerprint was captured. Comparing `a2267cf1` to `55d9f782` shows one added CSS rule with two selectors in `tools/amount-words-gh/index.html`: the result label and formatted amount use the dark-theme primary color. The light-theme styles, `amountToWords` function, form fields, result structure, and shared input-engine dependency are unchanged.

The complete native-owner drift set contains only `amount-words-gh`. Its normalized English page SHA-256 is now `2daa7ed5773090d623a0299b4a93f1ead07deb72df2ac6bd8dd57b3f4ad3e070`. This recapture changes only that source fingerprint and review metadata. French oracle inputs, output comparisons, and dependency fingerprints remain unchanged.
