# AfroTools Tool Quality Ranking

Generated: 2026-08-16T20:56:48.115Z

## Scope

- Registry rows scored: 3683
- Live/new expanded tool instances represented: 5397
- Unique live/new routes: 3683
- Browser smoke: not run
- Reports: `reports/tool-quality-ranking.json`, `reports/tool-quality-ranking.csv`

## Score Meaning

- A, 85-100: competitor-grade
- B, 75-84: standard-grade
- C, 65-74: usable but upgrade-needed
- D, 50-64: below industry standard
- F, 0-49: repair-first

## Distribution

| Rank | Rows | Weighted instances |
| --- | ---: | ---: |
| A | 3545 | 5205 |
| B | 90 | 144 |
| C | 6 | 6 |
| D | 0 | 0 |
| F | 42 | 42 |

Low-ranked rows below C: 42
Repair-first rows below D: 42

## Lowest Category Averages

| Category | Rows | Instances | Avg score | Low rows | P0 | Browser failures |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Education | 141 | 141 | 86.5 | 12 | 12 | 0 |
| Finance, Tax & Market Data | 508 | 508 | 91 | 2 | 2 | 0 |
| Personal Finance | 30 | 30 | 91.2 | 0 | 0 | 0 |
| Health & Wellness | 122 | 122 | 91.5 | 3 | 3 | 0 |
| VAT & Business Tax | 247 | 247 | 91.5 | 1 | 1 | 0 |
| Career & Development | 18 | 18 | 91.7 | 0 | 0 | 0 |
| Telecom & Mobile | 59 | 59 | 92.5 | 4 | 4 | 0 |
| Fintech & Banking | 84 | 84 | 92.5 | 0 | 0 | 0 |
| Sports & Entertainment | 45 | 45 | 92.5 | 0 | 0 | 0 |
| Travel & Tourism | 32 | 32 | 92.6 | 0 | 0 | 0 |
| Document & PDF | 123 | 123 | 92.9 | 9 | 9 | 0 |
| Business & ROI | 38 | 38 | 93 | 0 | 0 | 0 |
| Mining & Extractives | 18 | 18 | 93.8 | 0 | 0 | 0 |
| Language & Translation | 39 | 39 | 94 | 1 | 1 | 0 |
| Trade & Import | 68 | 68 | 94 | 0 | 0 | 0 |
| Agriculture | 508 | 1114 | 94.2 | 8 | 8 | 0 |
| Small Business & SME | 83 | 98 | 94.3 | 0 | 0 | 0 |
| Religious & Cultural | 61 | 61 | 94.3 | 0 | 0 | 0 |
| Government & Civic | 101 | 209 | 94.7 | 0 | 0 | 0 |
| Mortgage & Property | 291 | 469 | 94.8 | 2 | 2 | 0 |

## P0 Queue

| Score | Rank | Priority | Tool | Category | Benchmark | Top gaps |
| ---: | --- | --- | --- | --- | --- | --- |
| 44 | F | P0-high-value-repair | invoice-generator-yo | Document & PDF | PDF workflow utility | browser smoke not run; missing benchmark feature: download |
| 44 | F | P0-high-value-repair | vat-calculator-yo | VAT & Business Tax | VAT, invoice, ecommerce calculator | browser smoke not run; missing disclaimer/limitations; missing benchmark feature: disclaimer |
| 44 | F | P0-high-value-repair | health-yo | Health & Wellness | Health and wellness estimator | browser smoke not run |
| 44 | F | P0-high-value-repair | telecom-yo | Telecom & Mobile | General online utility | browser smoke not run |
| 44 | F | P0-high-value-repair | waec-neco-calculator-yo | Education | Education calculator or guide | browser smoke not run; stale or undated assumptions |
| 44 | F | P0-high-value-repair | genotype-checker-yo | Health & Wellness | Health and wellness estimator | browser smoke not run; stale or undated assumptions |
| 44 | F | P0-high-value-repair | receipt-generator-yo | Document & PDF | PDF workflow utility | browser smoke not run; missing benchmark feature: download |
| 44 | F | P0-high-value-repair | crop-yield-nigeria-yo | Agriculture | Agriculture and market-data tool | browser smoke not run; missing methodology/breakdown |
| 44 | F | P0-high-value-repair | jamb-aggregate-yo | Education | Education calculator or guide | browser smoke not run; stale or undated assumptions; missing disclaimer/limitations; missing benchmark feature: disclaimer |
| 44 | F | P0-high-value-repair | pdf-merge-split-yo | Document & PDF | PDF workflow utility | browser smoke not run |
| 44 | F | P0-high-value-repair | fertilizer-nigeria-yo | Agriculture | Agriculture and market-data tool | browser smoke not run; missing methodology/breakdown |
| 44 | F | P0-high-value-repair | pdf-compress-yo | Document & PDF | PDF workflow utility | browser smoke not run |
| 44 | F | P0-high-value-repair | cassava-processing-nigeria-yo | Agriculture | Agriculture and market-data tool | browser smoke not run; missing methodology/breakdown |
| 44 | F | P0-high-value-repair | hausa-translator-ha | Language & Translation | Language and translation utility | browser smoke not run |
| 44 | F | P0-high-value-repair | hospital-cost-yo | Health & Wellness | Health and wellness estimator | browser smoke not run; stale or undated assumptions; high-intent money tool lacks business CTA |
| 44 | F | P0-high-value-repair | cv-builder-ha | Document & PDF | PDF workflow utility | browser smoke not run |
| 44 | F | P0-high-value-repair | farm-budget-yo | Agriculture | Agriculture and market-data tool | browser smoke not run; missing methodology/breakdown |
| 44 | F | P0-high-value-repair | staple-basket-yo | Agriculture | Agriculture and market-data tool | browser smoke not run; missing methodology/breakdown |
| 44 | F | P0-high-value-repair | commodity-prices-yo | Agriculture | Agriculture and market-data tool | browser smoke not run; missing methodology/breakdown |
| 44 | F | P0-high-value-repair | nysc-allowance-yo | Education | Education calculator or guide | browser smoke not run; stale or undated assumptions; missing disclaimer/limitations; missing benchmark feature: disclaimer |
| 44 | F | P0-high-value-repair | bank-charges-ha | Finance, Tax & Market Data | Tax, salary, finance calculator | browser smoke not run; missing methodology/breakdown; no verification panel; high-intent money tool lacks business CTA |
| 44 | F | P0-high-value-repair | business-registration-ha | Mortgage & Property | Legal and compliance workflow | no app/script evidence; browser smoke not run |
| 44 | F | P0-high-value-repair | currency-converter-ha | Finance, Tax & Market Data | Tax, salary, finance calculator | browser smoke not run |
| 44 | F | P0-high-value-repair | fish-farming-nigeria-yo | Agriculture | Agriculture and market-data tool | browser smoke not run; missing methodology/breakdown |
| 44 | F | P0-high-value-repair | livestock-feed-nigeria-yo | Agriculture | Agriculture and market-data tool | browser smoke not run; missing methodology/breakdown |
| 44 | F | P0-high-value-repair | pdf-workspace-ha | Document & PDF | PDF workflow utility | browser smoke not run |
| 44 | F | P0-high-value-repair | school-fees-ha | Education | Education calculator or guide | browser smoke not run; stale or undated assumptions |
| 44 | F | P0-high-value-repair | telecom-data-usage-yo | Telecom & Mobile | General online utility | browser smoke not run; missing disclaimer/limitations; missing benchmark feature: disclaimer |
| 44 | F | P0-high-value-repair | whatsapp-link-yo | Telecom & Mobile | General online utility | browser smoke not run; missing disclaimer/limitations; missing benchmark feature: disclaimer |
| 44 | F | P0-high-value-repair | jamb-cbt-ha | Education | Education calculator or guide | browser smoke not run; stale or undated assumptions |
| 44 | F | P0-high-value-repair | pdf-convert-ha | Document & PDF | PDF workflow utility | browser smoke not run |
| 44 | F | P0-high-value-repair | telecom-data-plan-ha | Telecom & Mobile | General online utility | browser smoke not run |
| 44 | F | P0-high-value-repair | jamb-english-ha | Education | Education calculator or guide | browser smoke not run |
| 44 | F | P0-high-value-repair | jamb-mathematics-ha | Education | Education calculator or guide | browser smoke not run; stale or undated assumptions |
| 44 | F | P0-high-value-repair | jamb-tutor-ha | Education | Education calculator or guide | browser smoke not run; stale or undated assumptions |
| 44 | F | P0-high-value-repair | pdf-sign-ha | Document & PDF | PDF workflow utility | browser smoke not run |
| 44 | F | P0-high-value-repair | jamb-past-questions-ha | Education | Education calculator or guide | browser smoke not run |
| 44 | F | P0-high-value-repair | cac-checker-ha | Mortgage & Property | Legal and compliance workflow | browser smoke not run; missing methodology/breakdown; missing benchmark feature: methodology |
| 44 | F | P0-high-value-repair | jamb-biology-ha | Education | Education calculator or guide | browser smoke not run; stale or undated assumptions |
| 44 | F | P0-high-value-repair | jamb-chemistry-ha | Education | Education calculator or guide | browser smoke not run; stale or undated assumptions; weak meta description length |

## High-Value P1 Queue

No rows in this queue.


## Lowest 100 Individual Tools

| Score | Rank | Priority | Tool | Category | Benchmark | Top gaps |
| ---: | --- | --- | --- | --- | --- | --- |
| 44 | F | P0-high-value-repair | invoice-generator-yo | Document & PDF | PDF workflow utility | browser smoke not run; missing benchmark feature: download |
| 44 | F | P0-high-value-repair | vat-calculator-yo | VAT & Business Tax | VAT, invoice, ecommerce calculator | browser smoke not run; missing disclaimer/limitations; missing benchmark feature: disclaimer |
| 44 | F | P0-high-value-repair | health-yo | Health & Wellness | Health and wellness estimator | browser smoke not run |
| 44 | F | P0-high-value-repair | telecom-yo | Telecom & Mobile | General online utility | browser smoke not run |
| 44 | F | P0-high-value-repair | waec-neco-calculator-yo | Education | Education calculator or guide | browser smoke not run; stale or undated assumptions |
| 44 | F | P0-high-value-repair | genotype-checker-yo | Health & Wellness | Health and wellness estimator | browser smoke not run; stale or undated assumptions |
| 44 | F | P0-high-value-repair | receipt-generator-yo | Document & PDF | PDF workflow utility | browser smoke not run; missing benchmark feature: download |
| 44 | F | P0-high-value-repair | crop-yield-nigeria-yo | Agriculture | Agriculture and market-data tool | browser smoke not run; missing methodology/breakdown |
| 44 | F | P0-high-value-repair | jamb-aggregate-yo | Education | Education calculator or guide | browser smoke not run; stale or undated assumptions; missing disclaimer/limitations; missing benchmark feature: disclaimer |
| 44 | F | P0-high-value-repair | pdf-merge-split-yo | Document & PDF | PDF workflow utility | browser smoke not run |
| 44 | F | P0-high-value-repair | fertilizer-nigeria-yo | Agriculture | Agriculture and market-data tool | browser smoke not run; missing methodology/breakdown |
| 44 | F | P0-high-value-repair | pdf-compress-yo | Document & PDF | PDF workflow utility | browser smoke not run |
| 44 | F | P0-high-value-repair | cassava-processing-nigeria-yo | Agriculture | Agriculture and market-data tool | browser smoke not run; missing methodology/breakdown |
| 44 | F | P0-high-value-repair | hausa-translator-ha | Language & Translation | Language and translation utility | browser smoke not run |
| 44 | F | P0-high-value-repair | hospital-cost-yo | Health & Wellness | Health and wellness estimator | browser smoke not run; stale or undated assumptions; high-intent money tool lacks business CTA |
| 44 | F | P0-high-value-repair | cv-builder-ha | Document & PDF | PDF workflow utility | browser smoke not run |
| 44 | F | P0-high-value-repair | farm-budget-yo | Agriculture | Agriculture and market-data tool | browser smoke not run; missing methodology/breakdown |
| 44 | F | P0-high-value-repair | staple-basket-yo | Agriculture | Agriculture and market-data tool | browser smoke not run; missing methodology/breakdown |
| 44 | F | P0-high-value-repair | commodity-prices-yo | Agriculture | Agriculture and market-data tool | browser smoke not run; missing methodology/breakdown |
| 44 | F | P0-high-value-repair | nysc-allowance-yo | Education | Education calculator or guide | browser smoke not run; stale or undated assumptions; missing disclaimer/limitations; missing benchmark feature: disclaimer |
| 44 | F | P0-high-value-repair | bank-charges-ha | Finance, Tax & Market Data | Tax, salary, finance calculator | browser smoke not run; missing methodology/breakdown; no verification panel; high-intent money tool lacks business CTA |
| 44 | F | P0-high-value-repair | business-registration-ha | Mortgage & Property | Legal and compliance workflow | no app/script evidence; browser smoke not run |
| 44 | F | P0-high-value-repair | currency-converter-ha | Finance, Tax & Market Data | Tax, salary, finance calculator | browser smoke not run |
| 44 | F | P0-high-value-repair | fish-farming-nigeria-yo | Agriculture | Agriculture and market-data tool | browser smoke not run; missing methodology/breakdown |
| 44 | F | P0-high-value-repair | livestock-feed-nigeria-yo | Agriculture | Agriculture and market-data tool | browser smoke not run; missing methodology/breakdown |
| 44 | F | P0-high-value-repair | pdf-workspace-ha | Document & PDF | PDF workflow utility | browser smoke not run |
| 44 | F | P0-high-value-repair | school-fees-ha | Education | Education calculator or guide | browser smoke not run; stale or undated assumptions |
| 44 | F | P0-high-value-repair | telecom-data-usage-yo | Telecom & Mobile | General online utility | browser smoke not run; missing disclaimer/limitations; missing benchmark feature: disclaimer |
| 44 | F | P0-high-value-repair | whatsapp-link-yo | Telecom & Mobile | General online utility | browser smoke not run; missing disclaimer/limitations; missing benchmark feature: disclaimer |
| 44 | F | P0-high-value-repair | jamb-cbt-ha | Education | Education calculator or guide | browser smoke not run; stale or undated assumptions |
| 44 | F | P0-high-value-repair | pdf-convert-ha | Document & PDF | PDF workflow utility | browser smoke not run |
| 44 | F | P0-high-value-repair | telecom-data-plan-ha | Telecom & Mobile | General online utility | browser smoke not run |
| 44 | F | P0-high-value-repair | jamb-english-ha | Education | Education calculator or guide | browser smoke not run |
| 44 | F | P0-high-value-repair | jamb-mathematics-ha | Education | Education calculator or guide | browser smoke not run; stale or undated assumptions |
| 44 | F | P0-high-value-repair | jamb-tutor-ha | Education | Education calculator or guide | browser smoke not run; stale or undated assumptions |
| 44 | F | P0-high-value-repair | pdf-sign-ha | Document & PDF | PDF workflow utility | browser smoke not run |
| 44 | F | P0-high-value-repair | jamb-past-questions-ha | Education | Education calculator or guide | browser smoke not run |
| 44 | F | P0-high-value-repair | cac-checker-ha | Mortgage & Property | Legal and compliance workflow | browser smoke not run; missing methodology/breakdown; missing benchmark feature: methodology |
| 44 | F | P0-high-value-repair | jamb-biology-ha | Education | Education calculator or guide | browser smoke not run; stale or undated assumptions |
| 44 | F | P0-high-value-repair | jamb-chemistry-ha | Education | Education calculator or guide | browser smoke not run; stale or undated assumptions; weak meta description length |
| 44 | F | P0-high-value-repair | jamb-physics-ha | Education | Education calculator or guide | browser smoke not run; stale or undated assumptions |
| 44 | F | P0-high-value-repair | naira-to-words-yo | Document & PDF | PDF workflow utility | browser smoke not run |
| 73 | C | P3-monitor | etims-guide | Finance, Tax & Market Data | Tax, salary, finance calculator | thin or no visible controls; unclear primary action; weak input surface; no input path |
| 73 | C | P3-monitor | zana-thamani-ya-startup-sw | Finance, Tax & Market Data | Tax, salary, finance calculator | weak input surface; no input path; browser smoke not run; missing official/verification evidence |
| 73 | C | P3-monitor | zana-faida-ya-ufugaji-samaki-sw | VAT & Business Tax | VAT, invoice, ecommerce calculator | weak input surface; no input path; no workflow or methodology evidence; browser smoke not run |
| 73 | C | P3-monitor | idea-board | VAT & Business Tax | VAT, invoice, ecommerce calculator | thin or no visible controls; unclear primary action; weak input surface; no input path |
| 73 | C | P3-monitor | tableau-idees-fr | VAT & Business Tax | VAT, invoice, ecommerce calculator | thin or no visible controls; unclear primary action; no obvious output/result model; weak input surface |
| 74 | C | P3-monitor | zana-mshahara-wa-mwalimu-sw | Finance, Tax & Market Data | Tax, salary, finance calculator | missing shared shell evidence; no workflow or methodology evidence; browser smoke not run; missing official/verification evidence |
| 75 | B | P3-monitor | crypto-quiz-sw-parity | Finance, Tax & Market Data | Tax, salary, finance calculator | weak input surface; no input path; browser smoke not run; missing official/verification evidence |
| 75 | B | P3-monitor | job-offer-evaluator | Finance, Tax & Market Data | Tax, salary, finance calculator | weak input surface; missing shared shell evidence; no input path; browser smoke not run |
| 76 | B | P3-monitor | zana-faida-ya-usindikaji-mihogo-sw | VAT & Business Tax | VAT, invoice, ecommerce calculator | weak input surface; no input path; browser smoke not run; missing official/verification evidence |
| 76 | B | P3-monitor | zana-mjenzi-mpango-wa-biashara-sw | VAT & Business Tax | VAT, invoice, ecommerce calculator | thin or no visible controls; unclear primary action; weak input surface; no input path |
| 76 | B | P3-monitor | zana-faida-na-hasara-ya-shamba-sw | Agriculture | Agriculture and market-data tool | weak input surface; no input path; no workflow or methodology evidence; browser smoke not run |
| 76 | B | P3-monitor | zana-mnunuzi-wa-kwanza-wa-nyumba-sw | Finance, Tax & Market Data | Tax, salary, finance calculator | browser smoke not run; missing official/verification evidence; stale or undated assumptions; missing methodology/breakdown |
| 76 | B | P3-monitor | business-plan-builder | VAT & Business Tax | VAT, invoice, ecommerce calculator | thin or no visible controls; unclear primary action; weak input surface; no input path |
| 76 | B | P3-monitor | marge-beneficiaire-fr | VAT & Business Tax | VAT, invoice, ecommerce calculator | thin visible copy; no workflow or methodology evidence; browser smoke not run; missing source/reference evidence |
| 76 | B | P3-monitor | kichunguzi-ushahidi-wa-mawazo-sw | VAT & Business Tax | VAT, invoice, ecommerce calculator | thin or no visible controls; unclear primary action; weak input surface; no input path |
| 77 | B | P3-monitor | crypto-prices | Finance, Tax & Market Data | Tax, salary, finance calculator | no workflow or methodology evidence; browser smoke not run; missing official/verification evidence; missing methodology/breakdown |
| 77 | B | P3-monitor | crypto-stablecoins | Finance, Tax & Market Data | Tax, salary, finance calculator | no workflow or methodology evidence; browser smoke not run; missing official/verification evidence; missing methodology/breakdown |
| 77 | B | P3-monitor | crypto-address | Finance, Tax & Market Data | Tax, salary, finance calculator | no workflow or methodology evidence; browser smoke not run; missing official/verification evidence; missing methodology/breakdown |
| 77 | B | P3-monitor | crypto-contract | Finance, Tax & Market Data | Tax, salary, finance calculator | no workflow or methodology evidence; browser smoke not run; missing official/verification evidence; missing methodology/breakdown |
| 77 | B | P3-monitor | crypto-quiz | Finance, Tax & Market Data | Tax, salary, finance calculator | weak input surface; no input path; browser smoke not run; missing official/verification evidence |
| 77 | B | P3-monitor | crypto-contract-sw-parity | Finance, Tax & Market Data | Tax, salary, finance calculator | no workflow or methodology evidence; browser smoke not run; missing official/verification evidence; missing methodology/breakdown |
| 77 | B | P3-monitor | zana-tathmini-ya-ofa-ya-kazi-sw-wave8 | Career & Development | Career tool | weak input surface; missing shared shell evidence; thin visible copy; no input path |
| 78 | B | P3-monitor | zana-kikokotoo-mbolea-sw | Agriculture | Agriculture and market-data tool | weak input surface; no input path; no workflow or methodology evidence; browser smoke not run |
| 78 | B | P3-monitor | zana-kikokotoo-umwagiliaji-sw | Agriculture | Agriculture and market-data tool | weak input surface; no input path; no workflow or methodology evidence; browser smoke not run |
| 79 | B | P3-monitor | sars-efiling-fr-coverage-sars-efiling | Finance, Tax & Market Data | Tax, salary, finance calculator | unclear primary action; no app/script evidence; browser smoke not run; missing methodology/breakdown |
| 79 | B | P3-monitor | inventory | VAT & Business Tax | VAT, invoice, ecommerce calculator | no workflow or methodology evidence; browser smoke not run; missing official/verification evidence; missing methodology/breakdown |
| 79 | B | P3-monitor | crypto-dca-sw-parity | Finance, Tax & Market Data | Tax, salary, finance calculator | browser smoke not run; missing official/verification evidence; stale or undated assumptions; missing disclaimer/limitations |
| 79 | B | P3-monitor | crypto-exchange-sw-parity | Finance, Tax & Market Data | Tax, salary, finance calculator | no workflow or methodology evidence; browser smoke not run; missing methodology/breakdown; missing disclaimer/limitations |
| 79 | B | P3-monitor | zana-uwezo-wa-mkopo-wa-nyumba-sw | Finance, Tax & Market Data | Tax, salary, finance calculator | browser smoke not run; missing official/verification evidence; stale or undated assumptions; missing disclaimer/limitations |
| 79 | B | P3-monitor | calculateur-paye-fr | Finance, Tax & Market Data | Tax, salary, finance calculator | unclear primary action; no app/script evidence; browser smoke not run; missing official/verification evidence |
| 80 | B | P3-monitor | crypto-p2p-sw-parity | Finance, Tax & Market Data | Tax, salary, finance calculator | browser smoke not run; missing official/verification evidence; missing methodology/breakdown; missing disclaimer/limitations |
| 80 | B | P3-monitor | crypto-prices-sw-parity | Finance, Tax & Market Data | Tax, salary, finance calculator | browser smoke not run; missing official/verification evidence; missing methodology/breakdown; missing disclaimer/limitations |
| 80 | B | P3-monitor | crypto-remittance | Finance, Tax & Market Data | Tax, salary, finance calculator | browser smoke not run; missing official/verification evidence; missing methodology/breakdown; missing disclaimer/limitations |
| 80 | B | P3-monitor | crypto-scam | Finance, Tax & Market Data | Tax, salary, finance calculator | browser smoke not run; missing official/verification evidence; missing methodology/breakdown; missing disclaimer/limitations |
| 80 | B | P3-monitor | crypto-stablecoins-sw-parity | Finance, Tax & Market Data | Tax, salary, finance calculator | browser smoke not run; missing official/verification evidence; missing methodology/breakdown; missing disclaimer/limitations |
| 80 | B | P3-monitor | home-loan-eligibility | Finance, Tax & Market Data | Tax, salary, finance calculator | browser smoke not run; missing official/verification evidence; missing methodology/breakdown; missing disclaimer/limitations |
| 81 | B | P3-monitor | paye-authority-finder | Finance, Tax & Market Data | Tax, salary, finance calculator | no workflow or methodology evidence; browser smoke not run; missing methodology/breakdown; missing disclaimer/limitations |
| 81 | B | P3-monitor | zana-ada-usajili-wa-ardhi-sw | VAT & Business Tax | VAT, invoice, ecommerce calculator | thin visible copy; no workflow or methodology evidence; browser smoke not run; missing methodology/breakdown |
| 81 | B | P3-monitor | zana-usajili-wa-mpiga-kura-sw | VAT & Business Tax | VAT, invoice, ecommerce calculator | thin visible copy; no workflow or methodology evidence; browser smoke not run; missing methodology/breakdown |
| 82 | B | P3-monitor | market-stall-profit | VAT & Business Tax | VAT, invoice, ecommerce calculator | thin or no visible controls; unclear primary action; weak input surface; no input path |
| 82 | B | P3-monitor | export-docs | Agriculture | Agriculture and market-data tool | thin or no visible controls; unclear primary action; weak input surface; no input path |
| 82 | B | P3-monitor | foi-template-sw-parity | Government & Civic | Government and civic guide | thin visible copy; no workflow or methodology evidence; browser smoke not run; stale or undated assumptions |
| 82 | B | P3-monitor | gov-scholarship-sw-parity | Government & Civic | Government and civic guide | thin visible copy; no workflow or methodology evidence; browser smoke not run; stale or undated assumptions |
| 82 | B | P3-monitor | marriage-cert-sw-parity | Government & Civic | Government and civic guide | thin visible copy; no workflow or methodology evidence; browser smoke not run; stale or undated assumptions |
| 82 | B | P3-monitor | social-welfare-sw-parity | Government & Civic | Government and civic guide | thin visible copy; no workflow or methodology evidence; browser smoke not run; stale or undated assumptions |
| 82 | B | P3-monitor | zana-ukaguzi-wa-visa-sw | Government & Civic | Government and civic guide | thin visible copy; no workflow or methodology evidence; browser smoke not run; stale or undated assumptions |
| 82 | B | P3-monitor | zana-faida-ya-kibanda-sokoni-sw | VAT & Business Tax | VAT, invoice, ecommerce calculator | thin or no visible controls; unclear primary action; weak input surface; no input path |
| 82 | B | P3-monitor | profit-stand-marche-fr | VAT & Business Tax | VAT, invoice, ecommerce calculator | thin or no visible controls; unclear primary action; weak input surface; no input path |
| 82 | B | P3-monitor | budget-album-ep-fr | Personal Finance | Personal finance calculator | no app/script evidence; browser smoke not run; missing methodology/breakdown; missing disclaimer/limitations |
| 82 | B | P3-monitor | paystack-calculator-ha | VAT & Business Tax | VAT, invoice, ecommerce calculator | thin or no visible controls; unclear primary action; weak input surface; no input path |
| 82 | B | P3-monitor | zana-mwongozo-pasipoti-sw | Government & Civic | Government and civic guide | thin visible copy; no workflow or methodology evidence; browser smoke not run; stale or undated assumptions |
| 82 | B | P3-monitor | zana-vyeti-vya-kuzaliwa-na-kifo-sw | Government & Civic | Government and civic guide | thin visible copy; no workflow or methodology evidence; browser smoke not run; stale or undated assumptions |
| 82 | B | P3-monitor | side-hustle-ranker-fr-coverage-side-hustle-ranker | Personal Finance | Personal finance calculator | no app/script evidence; browser smoke not run; missing methodology/breakdown; missing disclaimer/limitations |
| 82 | B | P3-monitor | zana-fedha-za-kiislamu-sw | Finance, Tax & Market Data | Tax, salary, finance calculator | browser smoke not run; missing methodology/breakdown; missing disclaimer/limitations; no verification panel |
| 82 | B | P3-monitor | calculateur-paystack-fr | Fintech & Banking | Fintech and payments tool | thin or no visible controls; unclear primary action; weak input surface; no input path |
| 82 | B | P3-monitor | generateur-business-plan-fr | VAT & Business Tax | VAT, invoice, ecommerce calculator | thin or no visible controls; unclear primary action; weak input surface; no input path |
| 82 | B | P3-monitor | ga-tva-fr | Finance, Tax & Market Data | Tax, salary, finance calculator | thin visible copy; no workflow or methodology evidence; browser smoke not run; missing methodology/breakdown |
| 82 | B | P3-monitor | mpangaji-ada-za-paystack-sw | VAT & Business Tax | VAT, invoice, ecommerce calculator | thin or no visible controls; unclear primary action; weak input surface; no input path |
