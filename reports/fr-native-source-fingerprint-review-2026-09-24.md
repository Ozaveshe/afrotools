# French native oracle source review — 24 September 2026

The pending release changes three English page fingerprints used by the French native-oracle fixture. The affected source files were compared against `origin/main` before renewing the fixture hashes. The behavioral oracle inputs, expected outputs, source owners, and dependency fingerprints remain unchanged.

| Owner | Reviewed change | Behavioral effect |
| --- | --- | --- |
| `tools/naira-to-words/index.html` | Adds whole-naira examples and clarifies that decimal input handles kobo. SEO metadata and FAQ wording are regenerated from the reviewed priority-page source. | The converter function and test inputs remain unchanged. |
| `tools/amount-words-gh/index.html` | Adds Ghana cedi examples, a USD-to-GHS related link, and an FAQ distinguishing amount wording from currency conversion. The build synchronizes visible FAQ and schema. | The converter function and test inputs remain unchanged. |
| `tools/market-days/index.html` | Replaces a hard-coded April 2026 market-day answer with a neutral loading state and a `noscript` explanation. | The existing client calculation supplies the current answer after load; the oracle engine and inputs remain unchanged. |

The new hashes represent the normalized built English pages after `npm run build:deploy`. The locale oracle test must pass before release. These fixture updates do not assert a new translation or recalculation result.
