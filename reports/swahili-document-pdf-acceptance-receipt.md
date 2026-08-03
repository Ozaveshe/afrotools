# Swahili Document/PDF acceptance receipt

- Coordinator base: `0f6990118d9ac8b9dcde446a6ede10a017b9a2db`
- Denominator: 32 routes
- Accepted: 24
- Blocked: 8
- Export routes: 23/31 with every advertised format downloaded and parsed/reopened
- Gate contract: 24/24 free-account gated; 7/7 sensitive guest exports ungated
- Reciprocal hreflang edges: 0/7; missing edges remain integration-owned and no English/French/Hausa files were edited in this lane.
- Missing artwork: none
- AI/network lanes: consent-enabled send, silent-send block, endpoint failure and offline fallback proved for PDF Chat and PDF Translate
- Responsive/a11y proof: 320px, 375px, true 200% text reflow, explicit/system light/dark, exhaustive visible text/control contrast and real keyboard focus passed for all 32 routes

## Export blockers

- `pdf-merge-split` (/sw/zana/unganisha-na-gawanya-pdf/): missing parsed/reopened pdf, zip proof.
- `pdf-redact` (/sw/zana/kuficha-taarifa-pdf/): missing parsed/reopened pdf proof.
- `pdf-header-footer` (/sw/zana/kichwa-na-kijachini-pdf/): missing parsed/reopened pdf proof.
- `pdf-to-audio` (/sw/zana/pdf-kwenda-sauti/): missing parsed/reopened txt proof.
- `pdf-bates` (/sw/zana/namba-bates-pdf/): missing parsed/reopened pdf, zip, csv proof.
- `invoice-generator` (/sw/zana/kizalishaji-ankara/): missing parsed/reopened pdf proof.
- `pdf-watermark` (/sw/zana/watermark-pdf/): missing parsed/reopened pdf, zip proof.
- `pdf-page-numbers` (/sw/zana/namba-za-kurasa-pdf/): missing parsed/reopened pdf, zip proof.

## Route status

| ID | Route | Contract | Text | Boundary | Focus | Width | Overflow | Status |
| --- | --- | --- | ---: | ---: | ---: | ---: | ---: | --- |
| pdf-workspace | /sw/zana/nafasi-pdf/ | free-account | 9.601 | 5.985 | 5.985 | 3px | 0px | accepted |
| pdf-merge-split | /sw/zana/unganisha-na-gawanya-pdf/ | free-account | 14.642 | 6.262 | 5.985 | 3px | 0px | blocked |
| pdf-form-filler | /sw/zana/kujaza-fomu-pdf/ | free-account | 14.642 | 6.262 | 5.985 | 3px | 0px | accepted |
| pdf-redact | /sw/zana/kuficha-taarifa-pdf/ | free-account | 14.642 | 6.262 | 5.985 | 3px | 0px | blocked |
| pdf-header-footer | /sw/zana/kichwa-na-kijachini-pdf/ | free-account | 14.642 | 6.262 | 5.985 | 3px | 0px | blocked |
| pdf-convert | /sw/zana/kubadilisha-format-pdf/ | free-account | 14.642 | 6.262 | 5.985 | 3px | 0px | accepted |
| pdf-reorder | /sw/zana/kupanga-kurasa-pdf/ | free-account | 14.642 | 6.262 | 5.985 | 3px | 0px | accepted |
| pdf-translate | /sw/zana/kutafsiri-pdf/ | free-account | 14.642 | 6.262 | 5.985 | 3px | 0px | accepted |
| pdf-to-audio | /sw/zana/pdf-kwenda-sauti/ | free-account | 14.642 | 6.262 | 5.985 | 3px | 0px | blocked |
| pdf-bates | /sw/zana/namba-bates-pdf/ | free-account | 14.642 | 6.262 | 5.985 | 3px | 0px | blocked |
| html-to-pdf | /sw/zana/html-kwenda-pdf/ | free-account | 14.642 | 6.262 | 5.985 | 3px | 0px | accepted |
| pdf-find-replace | /sw/zana/tafuta-na-badilisha-pdf/ | free-account | 14.642 | 6.262 | 5.985 | 3px | 0px | accepted |
| pdf-repair | /sw/zana/kurekebisha-pdf/ | free-account | 14.642 | 6.262 | 5.985 | 3px | 0px | accepted |
| pdf-workflow | /sw/zana/workflow-ya-pdf/ | free-account | 14.642 | 5.985 | 5.699 | 3px | 0px | accepted |
| cv-builder | /sw/zana/mjenzi-cv/ | sensitive-guest | 16.268 | 6.251 | 5.985 | 3px | 0px | accepted |
| invoice-generator | /sw/zana/kizalishaji-ankara/ | sensitive-guest | 15.675 | 5.985 | 5.699 | 3px | 0px | blocked |
| cover-letter | /sw/zana/barua-ombi/ | sensitive-guest | 16.268 | 6.245 | 5.985 | 3px | 0px | accepted |
| freelance-invoice | /sw/zana/ankara-ya-freelancer/ | sensitive-guest | 15.675 | 6.034 | 5.985 | 3px | 0px | accepted |
| pdf-compress | /sw/zana/kubana-pdf/ | free-account | 14.642 | 6.262 | 5.985 | 3px | 0px | accepted |
| pdf-image-convert | /sw/zana/kubadilisha-pdf-na-picha/ | free-account | 14.642 | 6.262 | 5.985 | 3px | 0px | accepted |
| pdf-watermark | /sw/zana/watermark-pdf/ | free-account | 14.642 | 6.262 | 5.985 | 3px | 0px | blocked |
| pdf-password | /sw/zana/kulinda-pdf-kwa-nenosiri/ | free-account | 14.642 | 5.985 | 5.985 | 3px | 0px | accepted |
| pdf-page-numbers | /sw/zana/namba-za-kurasa-pdf/ | free-account | 14.642 | 5.985 | 5.985 | 3px | 0px | blocked |
| pdf-sign | /sw/zana/kusaini-pdf/ | free-account | 14.642 | 6.262 | 5.985 | 3px | 0px | accepted |
| pdf-ocr | /sw/zana/ocr-pdf/ | free-account | 14.642 | 6.262 | 5.985 | 3px | 0px | accepted |
| pdf-editor | /sw/zana/hariri-pdf/ | free-account | 7.023 | 5.985 | 5.985 | 3px | 0px | accepted |
| pdf-chat | /sw/zana/chat-na-pdf/ | free-account | 14.642 | 6.262 | 5.985 | 3px | 0px | accepted |
| pdf-compare | /sw/zana/kulinganisha-pdf/ | free-account | 14.642 | 6.262 | 5.985 | 3px | 0px | accepted |
| meeting-minutes | /sw/zana/kumbukumbu-za-mkutano/ | sensitive-guest | 15.675 | 5.985 | 5.699 | 3px | 0px | accepted |
| receipt-generator | /sw/zana/kizalishaji-risiti/ | sensitive-guest | 14.642 | 5.985 | 5.699 | 3px | 0px | accepted |
| business-plan | /sw/zana/mpango-wa-biashara/ | sensitive-guest | 15.675 | 5.985 | 5.699 | 3px | 0px | accepted |
| document-pdf | /sw/hati-na-pdf/ | no-export-claim | 14.642 | 6.262 | 5.985 | 3px | 0px | accepted |
