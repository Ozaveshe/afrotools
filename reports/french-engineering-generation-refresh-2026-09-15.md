# French engineering source composition refresh

Base: 2beaf4d0. Fetched origin/main: 3c35b8fdab0ba04c13800387cdb661d72012c8ef.

## Source repair
- Compose existing French navigation, visible-language and localized category-standard helpers in the engineering owner. Preserve canonical AfroDraft app links.
- Regenerate ten affected routes; retired generic summary rails follow the English cleanup in a30d6c2d, not a new calculator removal. Native calculator control attributes (input/select/textarea/button, option values and handlers) were compared with the before snapshot across all 26 owners: no differences outside those rails.
- Shared URL translation protection is separate commit f430d484; machine input value protection comes from coordinator c8c97634.

## Verification
- Full engineering generator --check: zero changes across 26 owners.
- Browser flow checks passed for first 15 owners, then four owners after BOQ and last five after architectural fee, covering every regenerated calculator. Ten changed routes fit 320px with scrollWidth=320.
- Current EN and FR BOQ fixture independently produces materials 8,383,610, labour 3,353,444, total 12,910,759 NGN; updated obsolete test oracle and added direct cross-locale totals regression (passed).
- Full 26-flow acceptance is NOT claimed: BOQ has existing English result item labels (e.g. Roofing screws), and architectural fee now requires entered assumptions and still declares data-locale=en on French route. These remain separate parity work.
- Developer historical manifest remains unchanged; source hashes cannot be re-certified wholesale.

No deployment, acceptance-ledger refresh, rate changes or new financial defaults.
