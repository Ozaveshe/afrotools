# Swahili Mortgage & Property tenant-planning clean-respin receipt

- Rejected candidate reference: `4627224c64867b363762005cf063e77204132fd5`
- Accepted repair reference: `cb049541b10c678d163e8a627af722bd81cf9015`
- Exact clean-respin parent: `8354e321ff34caf60a33a3393cd0dcddfb00c023`

- Category owners: **66**
- Central acceptance before this bounded lane: **11**
- Unaccepted before this lane: **55**
- Selected: **2**
- Locally accepted: **2**
- Blocked: **0**
- Effective accepted after this scoped receipt: **13**
- Remaining unaccepted after this scoped receipt: **53**

| English owner | Swahili native owner | Engine | App status | Localized AI map |
|---|---|---|---|---|
| `/tools/tenancy-deposit/` | `/sw/zana/amana-ya-upangaji/` | `mortgage-property-english-owner` | accepted | pending-coordinator-integration-generated-map-out-of-scope |
| `/tools/rent-affordability/` | `/sw/zana/uwezo-wa-kulipa-pango/` | `property-assumption` | accepted | pending-coordinator-integration-generated-map-out-of-scope |

## Evidence boundary

- Copy, TXT and JSON were parsed/reopened. PDF was reopened by `pdf-parse` and every rendered text coordinate was checked against the page bounds; print was intercepted and verified.
- English-owned blank/default state, all four tenancy country presets, invalid/stale clearing, both 320px and 375px layouts, 200% reflow, keyboard labels/focus, console, privacy and no-network behavior passed.
- Computed contrast passed in explicit light, explicit dark, system-light and system-dark modes: text is at least 4.5:1, control/component boundaries are at least 3:1 and visible focus indicators are at least 3:1. Exact measured minima are retained per route and variant in the JSON receipt.
- Rent affordability preserves the English DOM constraints exactly, including income `min=0.01`, ratio `max=100`, and every `min`/`max`/`step`/`required` boundary; zero income and ratios above 100 fail closed and clear stale exports.
- The Lagos source is bound to Nigeria/Lagos only. Kenya, South Africa and Ghana are visibly marked as planning defaults in the source panel, result and exports.
- The independently inaccessible UN-Habitat PDF is no longer advertised as verified: the route marks it unavailable, records the 403 check and requires manual verification.
- Registry row-hash tests prove the 11 coordinator rows remain byte-identical; only `tenancy-deposit` and `rent-affordability` are added.
- Registry ownership, hub linkage, canonical/OG/artwork and reciprocal English/French hreflang passed.
- The canonical AI catalog covers both English owners. The generated Swahili AI route map is intentionally unchanged and awaits coordinator acceptance/integration.
- The central acceptance ledger, generated AI route map, master ledger, sitemap, other-locale visible UI/runtime, shared engines and deploy state were not changed.
- This receipt is regenerated from the coordinator tree; it does not carry either predecessor commit as history.
