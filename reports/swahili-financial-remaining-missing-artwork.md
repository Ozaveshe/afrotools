# Swahili Financial remaining artwork queue

Checkpoint: 2026-08-03
Programme base: `0f6990118d9ac8b9dcde446a6ede10a017b9a2db`

The authoritative Financial inventory contains 132 rows. At the coordinator checkpoint, 37 were accepted and 95 remained. Ninety of those 95 remaining rows have their expected bespoke WebP file. Five do not:

| English id | Swahili route | Expected artwork |
|---|---|---|
| `cbk-rates` | `/sw/zana/viwango-vya-cbk/` | `assets/img/tools/cbk-rates.webp` |
| `cnps-guide` | `/sw/zana/mwongozo-wa-cnps/` | `assets/img/tools/cnps-guide.webp` |
| `etims-guide` | `/sw/zana/etims-guide/` | `assets/img/tools/etims-guide.webp` |
| `itax-guide` | `/sw/zana/itax-guide/` | `assets/img/tools/itax-guide.webp` |
| `sars-efiling` | `/sw/zana/sars-efiling/` | `assets/img/tools/sars-efiling.webp` |

These are an artwork queue, not broken-image permission. Existing fallback behaviour must remain until each image is reviewed.
