# Country PAYE Page-Pack Expansion Plan - 2026-05-17

Prompt 137 is blocked because Prompt 136 did not mark the pilot safe to expand.

## Decision

No country PAYE page-pack expansion should be implemented yet.

Reason: the Ghana PAYE pilot was not created. The dry-run route planner is alias-aware, but the real writer is not yet safe for canonical Swahili routes or metadata-only preservation.

## Future Candidates After Writer Fix

| Country | Source page | Target Swahili route | Risk |
| --- | --- | --- | --- |
| Ghana | `ghana/gh-paye` | `sw/ghana/kikokotoo-kodi-mshahara/index.html` | Low after writer fix |
| Nigeria | `nigeria/ng-salary-tax` | `sw/nigeria/kikokotoo-kodi-mshahara/index.html` | Medium, source naming differs |
| Kenya | `kenya/ke-paye` | `sw/kenya/kikokotoo-kodi-mshahara/index.html` | Medium, high-value curated page |
| Tanzania | `tanzania/tz-paye` | `sw/tanzania/kikokotoo-kodi-mshahara/index.html` | Medium, high-value curated page |
| South Africa | `south-africa/za-paye` | `sw/south-africa/kikokotoo-kodi-mshahara/index.html` | Medium, mapping must be confirmed |

## Required Before Expansion

- Make the real write path use the same Swahili route-alias resolver as dry-run.
- Add metadata-only page-pack mode or an explicit body-preservation guard.
- Require targeted dry-run proof before every pack.
- Block writes to curated Swahili pages unless the diff is metadata-only and expected.
