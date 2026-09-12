# Government 041–044 private review handoff

Final wave: 160 original imports examined, 120 candidates and 40 held. Cumulative: 1,760 examined, 1,062 candidates, 698 held and 895 unchecked out of 2,655. Next: government-x-49-ae306874422a.

| Batch | Final candidates | Final held | Initial commit |
| --- | ---: | ---: | --- |
| 041 | 28 | 12 | d739bf28 |
| 042 | 29 | 11 | a0a2d532 |
| 043 | 31 | 9 | 84e673d6 |
| 044 | 32 | 8 | d95abe6c |

Apply the final amendment 9dad44da with these batches before intake. It corrects added question-date labels to the actual printed years: Gambari in 2002, Mozambique's Commonwealth membership in 2003, and traditional rulers' local-government role in 2005. It holds the undated-within-year ECOWAS count from the printed 2000 set because Mauritania's withdrawal changed membership during that year. Batch 042 therefore has 29 candidates, not the initial 30. All dependent prior-batch hashes were rebuilt.

Separate atomic amendment 1a88f68e corrects batch 040 record government-x-44-6bef0ec18753 from an added 1999 anchor to its printed 1998 year. Its answer A and printed source metadata are unchanged. Previous candidate fingerprint: cf0a2023c7d4a3345c45d3327eb5adb78805be6ea6b6ad18729edfa8733bcecd. Final fingerprint: 4848f6bd57044698e005b7cdb2037a52c6a67137e3cc1e6e0d10687cbaad8c30. The coordinator must update any integrated pool, ledger and verification record atomically. This worker did not mutate those shared files.

The new semantic date guard checks added years against the printed year or explicitly evidenced historical events. Four negative fixtures deliberately rehash the modified question, selection, integration allowlist and temporary integrated pool, then confirm rejection by the semantic date guard. This tests beyond ordinary hash-drift rejection. Source years themselves always remained correct in the pinned provenance; the amendments fix added question text and the ambiguous membership item.

All new records retain owner-supplied-government-210-page-compilation, SHA-256 bed3547606cb6eae48563f53699f35bf432c0dcd4e69917c1d73d5b93bd6b319. Years follow the 42 pinned, visually read source headings. Full-page extents include 93–94, 98–99, 118–119, 53–54, 103–104, 17–18, 63–64, 73–74, 138–139, 113–114 and 133–134. Secondary UN, Commonwealth, OAU, OPEC, ECOWAS, AfDB, French parliamentary and Nigerian institutional references remain separate from the exam PDF identity.

Answer checks include the Nigeria Trust Fund, Gambari's historical UN post, Lukman's OPEC tenure, OPEC founders, UN institutional powers, ECOWAS's founding and Brown Card insurance, the ICJ and ECA leadership, the French response to Biafra, Guinea's 1958 referendum and historical Commonwealth membership. Option-boundary and spelling repairs stay private; student explanations teach the subject. Holds include missing options, false blanket claims, ambiguous institutional periods, membership changing within a year, unverified historical firsts, and overlapping alternatives. They are evidence gaps rather than owner-permission requests.

Validation: the 001–036 regression passed, and the final 037–044 rerun passed normal, integrated and integrated-without-PDF modes, normal-without-PDF rejection, and source/SHA/page/year/extent/options/answer/pool negatives. The four fully rehashed wrong-date fixtures passed, as did mixed-prior guard tests, private-script syntax checks and git diff --check. The exact coordinator publication assessor accepted all 1,062 final candidates and rejected all 1,062 duplicate-option mutations. Coverage confirms exactly the first 1,760 unique Government imports without gaps. Mixed-prior helper files remain identical to the coordinator versions.

No shared source pool, public bank, review ledger, routes, browser, build, push or deployment mutations. Integration and release remain with the coordinator.
