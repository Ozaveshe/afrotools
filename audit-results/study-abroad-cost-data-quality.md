# Study Abroad Cost Data Quality Audit

Generated: 2026-05-20T04:21:50.635Z

## Overall verdict

**Not ready.**

The tool is useful as a planning engine, but the current data layer is not yet safe to present as fully source-backed 2026 cost truth. Official visa-fee and proof-of-funds fields exist for the five hero destinations, but UK living/proof values are stale, Germany proof-of-funds needs mission/portal verification, tuition ranges are not institution-backed, regional data is unsourced, and FX rates have no source/date.

## Summary counts

| Metric | Count |
| --- | ---: |
| Destinations audited | 100 |
| Cost fields audited | 875 |
| Official government fields | 12 |
| Official education fields | 2 |
| Verified institution fields | 0 |
| Market estimate fields | 754 |
| Unknown or unverified fields | 107 |

## Critical blockers

1. **UK proof-of-funds values are stale.** Replace UK livingOfficial min/max and source with GOV.UK before presenting these as official.
2. **Expanded destination regional values have no source URLs or last-checked dates.** Keep visible estimate labels and add source methodology before advertising as reliable country data.
3. **Static FX table has no provider, timestamp, or refresh policy.** Show FX date/source or keep CurrencyDisplay in estimate mode for all USD/local conversions.
4. **Tuition ranges are not tied to official education or university sources.** Label as typical ranges and prioritize official Study in country portals or named university tuition pages.
5. **Germany blocked-account amount is not verified from the competent mission/portal in app data.** Do not label Germany proof-of-funds as official government exact value until a mission/portal source is attached.

## Source reliability

| Source | Link | Reliability | Use in audit |
| --- | --- | --- | --- |
| GOV.UK Student visa money | [source](https://www.gov.uk/student-visa/money) | high | Official government source supports current UK visa fee and financial requirement values. |
| GOV.UK financial evidence guidance | [source](https://www.gov.uk/guidance/financial-evidence-for-student-and-child-student-route-applicants) | high | Official government source supports UK dependant funds and evidence rules. |
| IRCC/Canada.ca proof of financial support | [source](https://www.canada.ca/en/immigration-refugees-citizenship/services/study-canada/study-permit/get-documents/financial-support.html) | high | Official government source supports Canada living threshold and family amounts outside Quebec. |
| IRCC fee list | [source](https://www.ircc.canada.ca/english/information/fees/fees.asp) | high | Official government source supports study permit and biometrics fees. |
| Study Australia visa process | [source](https://www.studyaustralia.gov.au/en/plan-your-move/visa-application-process) | high | Official government education/visa surface supports AUD 29,710 financial capacity and warning that real living costs vary. |
| Study Australia VAC increase | [source](https://www.studyaustralia.gov.au/en/tools-and-resources/news/student-visa-application-charge-increase) | high | Official source supports AUD 2,000 primary student visa charge from 1 July 2025. |
| U.S. Department of State student visa page | [source](https://travel.state.gov/content/travel/en/us-visas/study/student-visa.html) | high | Official source supports USD 185 MRV/application fee. |
| U.S. ICE SEVIS I-901 | [source](https://www.ice.gov/sevis/i901) | high | Official source supports USD 350 F/M I-901 fee. |
| EducationUSA finance guide | [source](https://educationusa.state.gov/your-5-steps-us-study/finance-your-studies) | medium | Official education source supports strategy warning that costs vary by institution/location, not a single exact value. |
| German Federal Foreign Office blocked account page | [source](https://www.auswaertiges-amt.de/en/visa-service/visabestimmungen-node/sperrkonto-seite) | medium | Official government source confirms proof logic but delegates exact amount to mission/portal. |
| DAAD cost guide | [source](https://www.daad.de/en/study-and-research-in-germany/plan-your-studies/costs-of-education-and-living/) | medium | Official education source supports EUR 992/month as planning guidance, but not a mission-specific exact visa source. |
| Regional AfroTools estimates | missing | low | No source URL, source title, or last-checked date in app data. |

## Destination summary

| Destination | Currency | Status | Fields | Government | Education | Estimates | Unknown |
| --- | --- | --- | ---: | ---: | ---: | ---: | ---: |
| United Kingdom | GBP | not_ready | 24 | 3 | 0 | 17 | 4 |
| Canada | CAD | not_ready | 23 | 3 | 0 | 18 | 2 |
| Australia | AUD | not_ready | 22 | 2 | 0 | 18 | 2 |
| United States | USD | not_ready | 23 | 2 | 1 | 18 | 2 |
| Germany | EUR | not_ready | 23 | 2 | 1 | 18 | 2 |
| South Africa | ZAR | ready_with_warnings | 8 | 0 | 0 | 7 | 1 |
| Egypt | EGP | ready_with_warnings | 8 | 0 | 0 | 7 | 1 |
| Morocco | MAD | ready_with_warnings | 8 | 0 | 0 | 7 | 1 |
| Ghana | GHS | ready_with_warnings | 8 | 0 | 0 | 7 | 1 |
| Kenya | KES | ready_with_warnings | 8 | 0 | 0 | 7 | 1 |
| Rwanda | RWF | ready_with_warnings | 8 | 0 | 0 | 7 | 1 |
| Mauritius | MUR | ready_with_warnings | 8 | 0 | 0 | 7 | 1 |
| Tunisia | TND | ready_with_warnings | 8 | 0 | 0 | 7 | 1 |
| Botswana | BWP | ready_with_warnings | 8 | 0 | 0 | 7 | 1 |
| Namibia | NAD | ready_with_warnings | 8 | 0 | 0 | 7 | 1 |
| Senegal | XOF | ready_with_warnings | 8 | 0 | 0 | 7 | 1 |
| Nigeria | NGN | ready_with_warnings | 8 | 0 | 0 | 7 | 1 |
| Uganda | UGX | ready_with_warnings | 8 | 0 | 0 | 7 | 1 |
| Tanzania | TZS | ready_with_warnings | 8 | 0 | 0 | 7 | 1 |
| Ethiopia | ETB | ready_with_warnings | 8 | 0 | 0 | 7 | 1 |
| Zambia | ZMW | ready_with_warnings | 8 | 0 | 0 | 7 | 1 |
| Algeria | DZD | ready_with_warnings | 8 | 0 | 0 | 7 | 1 |
| Cameroon | XAF | ready_with_warnings | 8 | 0 | 0 | 7 | 1 |
| Cote d Ivoire | XOF | ready_with_warnings | 8 | 0 | 0 | 7 | 1 |
| Malawi | MWK | ready_with_warnings | 8 | 0 | 0 | 7 | 1 |
| France | EUR | ready_with_warnings | 8 | 0 | 0 | 7 | 1 |
| Ireland | EUR | ready_with_warnings | 8 | 0 | 0 | 7 | 1 |
| Netherlands | EUR | ready_with_warnings | 8 | 0 | 0 | 7 | 1 |
| Sweden | SEK | ready_with_warnings | 8 | 0 | 0 | 7 | 1 |
| Finland | EUR | ready_with_warnings | 8 | 0 | 0 | 7 | 1 |
| Norway | NOK | ready_with_warnings | 8 | 0 | 0 | 7 | 1 |
| Denmark | DKK | ready_with_warnings | 8 | 0 | 0 | 7 | 1 |
| Italy | EUR | ready_with_warnings | 8 | 0 | 0 | 7 | 1 |
| Spain | EUR | ready_with_warnings | 8 | 0 | 0 | 7 | 1 |
| Portugal | EUR | ready_with_warnings | 8 | 0 | 0 | 7 | 1 |
| Poland | PLN | ready_with_warnings | 8 | 0 | 0 | 7 | 1 |
| Hungary | HUF | ready_with_warnings | 8 | 0 | 0 | 7 | 1 |
| Czech Republic | CZK | ready_with_warnings | 8 | 0 | 0 | 7 | 1 |
| Austria | EUR | ready_with_warnings | 8 | 0 | 0 | 7 | 1 |
| Belgium | EUR | ready_with_warnings | 8 | 0 | 0 | 7 | 1 |
| Switzerland | CHF | ready_with_warnings | 8 | 0 | 0 | 7 | 1 |
| Estonia | EUR | ready_with_warnings | 8 | 0 | 0 | 7 | 1 |
| Lithuania | EUR | ready_with_warnings | 8 | 0 | 0 | 7 | 1 |
| Latvia | EUR | ready_with_warnings | 8 | 0 | 0 | 7 | 1 |
| Greece | EUR | ready_with_warnings | 8 | 0 | 0 | 7 | 1 |
| Romania | RON | ready_with_warnings | 8 | 0 | 0 | 7 | 1 |
| Slovenia | EUR | ready_with_warnings | 8 | 0 | 0 | 7 | 1 |
| Slovakia | EUR | ready_with_warnings | 8 | 0 | 0 | 7 | 1 |
| Croatia | EUR | ready_with_warnings | 8 | 0 | 0 | 7 | 1 |
| Cyprus | EUR | ready_with_warnings | 8 | 0 | 0 | 7 | 1 |
| Malta | EUR | ready_with_warnings | 8 | 0 | 0 | 7 | 1 |
| Luxembourg | EUR | ready_with_warnings | 8 | 0 | 0 | 7 | 1 |
| Iceland | ISK | ready_with_warnings | 8 | 0 | 0 | 7 | 1 |
| Mexico | MXN | ready_with_warnings | 8 | 0 | 0 | 7 | 1 |
| China | CNY | ready_with_warnings | 8 | 0 | 0 | 7 | 1 |
| Japan | JPY | ready_with_warnings | 8 | 0 | 0 | 7 | 1 |
| South Korea | KRW | ready_with_warnings | 8 | 0 | 0 | 7 | 1 |
| Malaysia | MYR | ready_with_warnings | 8 | 0 | 0 | 7 | 1 |
| Singapore | SGD | ready_with_warnings | 8 | 0 | 0 | 7 | 1 |
| India | INR | ready_with_warnings | 8 | 0 | 0 | 7 | 1 |
| Thailand | THB | ready_with_warnings | 8 | 0 | 0 | 7 | 1 |
| Indonesia | IDR | ready_with_warnings | 8 | 0 | 0 | 7 | 1 |
| Philippines | PHP | ready_with_warnings | 8 | 0 | 0 | 7 | 1 |
| Vietnam | VND | ready_with_warnings | 8 | 0 | 0 | 7 | 1 |
| Taiwan | TWD | ready_with_warnings | 8 | 0 | 0 | 7 | 1 |
| Hong Kong | HKD | ready_with_warnings | 8 | 0 | 0 | 7 | 1 |
| Pakistan | PKR | ready_with_warnings | 8 | 0 | 0 | 7 | 1 |
| Sri Lanka | LKR | ready_with_warnings | 8 | 0 | 0 | 7 | 1 |
| Kazakhstan | KZT | ready_with_warnings | 8 | 0 | 0 | 7 | 1 |
| Uzbekistan | UZS | ready_with_warnings | 8 | 0 | 0 | 7 | 1 |
| Nepal | NPR | ready_with_warnings | 8 | 0 | 0 | 7 | 1 |
| Bangladesh | BDT | ready_with_warnings | 8 | 0 | 0 | 7 | 1 |
| Brunei | BND | ready_with_warnings | 8 | 0 | 0 | 7 | 1 |
| Macau | HKD | ready_with_warnings | 8 | 0 | 0 | 7 | 1 |
| United Arab Emirates | AED | ready_with_warnings | 8 | 0 | 0 | 7 | 1 |
| Qatar | QAR | ready_with_warnings | 8 | 0 | 0 | 7 | 1 |
| Saudi Arabia | SAR | ready_with_warnings | 8 | 0 | 0 | 7 | 1 |
| Oman | OMR | ready_with_warnings | 8 | 0 | 0 | 7 | 1 |
| Jordan | JOD | ready_with_warnings | 8 | 0 | 0 | 7 | 1 |
| Israel | ILS | ready_with_warnings | 8 | 0 | 0 | 7 | 1 |
| Turkey | TRY | ready_with_warnings | 8 | 0 | 0 | 7 | 1 |
| Bahrain | BHD | ready_with_warnings | 8 | 0 | 0 | 7 | 1 |
| Kuwait | KWD | ready_with_warnings | 8 | 0 | 0 | 7 | 1 |
| Lebanon | LBP | ready_with_warnings | 8 | 0 | 0 | 7 | 1 |
| New Zealand | NZD | ready_with_warnings | 8 | 0 | 0 | 7 | 1 |
| Fiji | FJD | ready_with_warnings | 8 | 0 | 0 | 7 | 1 |
| Papua New Guinea | PGK | ready_with_warnings | 8 | 0 | 0 | 7 | 1 |
| Samoa | WST | ready_with_warnings | 8 | 0 | 0 | 7 | 1 |
| Brazil | BRL | ready_with_warnings | 8 | 0 | 0 | 7 | 1 |
| Argentina | ARS | ready_with_warnings | 8 | 0 | 0 | 7 | 1 |
| Chile | CLP | ready_with_warnings | 8 | 0 | 0 | 7 | 1 |
| Colombia | COP | ready_with_warnings | 8 | 0 | 0 | 7 | 1 |
| Costa Rica | CRC | ready_with_warnings | 8 | 0 | 0 | 7 | 1 |
| Peru | PEN | ready_with_warnings | 8 | 0 | 0 | 7 | 1 |
| Uruguay | UYU | ready_with_warnings | 8 | 0 | 0 | 7 | 1 |
| Panama | PAB | ready_with_warnings | 8 | 0 | 0 | 7 | 1 |
| Ecuador | USD | ready_with_warnings | 8 | 0 | 0 | 7 | 1 |
| Dominican Republic | DOP | ready_with_warnings | 8 | 0 | 0 | 7 | 1 |
| Jamaica | JMD | ready_with_warnings | 8 | 0 | 0 | 7 | 1 |
| Barbados | BBD | ready_with_warnings | 8 | 0 | 0 | 7 | 1 |

## Hero destination field audit

| Destination | Cost field | Current value used | Source type | Source | Exact value supported | Current for 2026 | Confidence | Display label | Recommended action |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| United Kingdom | tuition_bachelors_engineering | 18000-34000 | ESTIMATE_MARKET | missing | no | no | low | Typical tuition range, verify with the university | add official education or university source before presenting as factual |
| United Kingdom | tuition_bachelors_business | 18000-32000 | ESTIMATE_MARKET | missing | no | no | low | Typical tuition range, verify with the university | add official education or university source before presenting as factual |
| United Kingdom | tuition_bachelors_health | 26000-48000 | ESTIMATE_MARKET | missing | no | no | low | Typical tuition range, verify with the university | add official education or university source before presenting as factual |
| United Kingdom | tuition_bachelors_social | 16000-29000 | ESTIMATE_MARKET | missing | no | no | low | Typical tuition range, verify with the university | add official education or university source before presenting as factual |
| United Kingdom | tuition_bachelors_law | 18000-32000 | ESTIMATE_MARKET | missing | no | no | low | Typical tuition range, verify with the university | add official education or university source before presenting as factual |
| United Kingdom | tuition_masters_engineering | 20000-35000 | ESTIMATE_MARKET | missing | no | no | low | Typical tuition range, verify with the university | add official education or university source before presenting as factual |
| United Kingdom | tuition_masters_business | 22000-38000 | ESTIMATE_MARKET | missing | no | no | low | Typical tuition range, verify with the university | add official education or university source before presenting as factual |
| United Kingdom | tuition_masters_health | 24000-42000 | ESTIMATE_MARKET | missing | no | no | low | Typical tuition range, verify with the university | add official education or university source before presenting as factual |
| United Kingdom | tuition_masters_social | 18000-30000 | ESTIMATE_MARKET | missing | no | no | low | Typical tuition range, verify with the university | add official education or university source before presenting as factual |
| United Kingdom | tuition_masters_law | 20000-36000 | ESTIMATE_MARKET | missing | no | no | low | Typical tuition range, verify with the university | add official education or university source before presenting as factual |
| United Kingdom | tuition_phd_engineering | 18000-27000 | ESTIMATE_MARKET | missing | no | no | low | Typical tuition range, verify with the university | add official education or university source before presenting as factual |
| United Kingdom | tuition_phd_business | 17000-24000 | ESTIMATE_MARKET | missing | no | no | low | Typical tuition range, verify with the university | add official education or university source before presenting as factual |
| United Kingdom | tuition_phd_health | 20000-30000 | ESTIMATE_MARKET | missing | no | no | low | Typical tuition range, verify with the university | add official education or university source before presenting as factual |
| United Kingdom | tuition_phd_social | 16000-22000 | ESTIMATE_MARKET | missing | no | no | low | Typical tuition range, verify with the university | add official education or university source before presenting as factual |
| United Kingdom | tuition_phd_law | 17000-24000 | ESTIMATE_MARKET | missing | no | no | low | Typical tuition range, verify with the university | add official education or university source before presenting as factual |
| United Kingdom | living_range_market_reference | 13500-19000 | ESTIMATE_MARKET | missing | no | no | low | Estimated annual living range, not official | keep only with estimate label and add market/source methodology |
| United Kingdom | setup_travel_arrival_cost | 1500 | ESTIMATE_MARKET | missing | no | no | low | Estimated flight and arrival setup cost | keep only as estimate; add origin/city/date methodology or ticket quote timestamp |
| United Kingdom | dependents_multiplier | spouse:1.35; children:1.55; spouse_and_children:1.8 | UNKNOWN_OR_UNVERIFIED | missing | no | no | low | Dependents adjustment needs verification | replace country-specific dependent costs where official values exist; otherwise show as estimate |
| United Kingdom | static_fx_GBP_to_usd | 1.27 | UNKNOWN_OR_UNVERIFIED | missing | no | no | unknown | FX estimate, rate date/source missing | add FX provider/date or mark all local/USD conversions as estimate |
| United Kingdom | living_requirement_outside_london_current_app | 10224 | UNKNOWN_OR_UNVERIFIED | [UKCISA maintenance requirements news](https://www.ukcisa.org.uk/news/increase-to-maintenance-requirements-for-students-from-2025/) | no | no | low | Needs verification: UK proof-of-funds value is stale | replace with GOV.UK GBP 1,171/month outside London for up to 9 months |
| United Kingdom | living_requirement_london_current_app | 13347 | UNKNOWN_OR_UNVERIFIED | [UKCISA maintenance requirements news](https://www.ukcisa.org.uk/news/increase-to-maintenance-requirements-for-students-from-2025/) | no | no | low | Needs verification: UK London proof-of-funds value is stale | replace with GOV.UK GBP 1,529/month in London for up to 9 months |
| United Kingdom | student_visa_application_fee | 558 | OFFICIAL_GOVERNMENT | [GOV.UK Student visa application steps and fee](https://www.gov.uk/student-visa/money) | yes | yes | high | Official UK student visa fee | keep |
| United Kingdom | immigration_health_surcharge_annual | 776 | OFFICIAL_GOVERNMENT | [GOV.UK Pay for UK healthcare as part of your immigration application](https://www.gov.uk/healthcare-immigration-application/how-much-pay) | yes | yes | high | Official UK student IHS annual rate | keep but add source URL to app data |
| United Kingdom | uk_dependant_living_requirement_missing | not modeled | OFFICIAL_GOVERNMENT | [GOV.UK Financial evidence for Student and Child Student visa applicants](https://www.gov.uk/guidance/financial-evidence-for-student-and-child-student-route-applicants) | no | yes | medium | Official UK dependant funds exist but are not modeled exactly | add country-specific dependant requirement or mark dependent risk approximate |
| Canada | tuition_bachelors_engineering | 26000-46000 | ESTIMATE_MARKET | missing | no | no | low | Typical tuition range, verify with the university | add official education or university source before presenting as factual |
| Canada | tuition_bachelors_business | 23000-43000 | ESTIMATE_MARKET | missing | no | no | low | Typical tuition range, verify with the university | add official education or university source before presenting as factual |
| Canada | tuition_bachelors_health | 26000-52000 | ESTIMATE_MARKET | missing | no | no | low | Typical tuition range, verify with the university | add official education or university source before presenting as factual |
| Canada | tuition_bachelors_social | 19000-34000 | ESTIMATE_MARKET | missing | no | no | low | Typical tuition range, verify with the university | add official education or university source before presenting as factual |
| Canada | tuition_bachelors_law | 24000-42000 | ESTIMATE_MARKET | missing | no | no | low | Typical tuition range, verify with the university | add official education or university source before presenting as factual |
| Canada | tuition_masters_engineering | 21000-38000 | ESTIMATE_MARKET | missing | no | no | low | Typical tuition range, verify with the university | add official education or university source before presenting as factual |
| Canada | tuition_masters_business | 24000-44000 | ESTIMATE_MARKET | missing | no | no | low | Typical tuition range, verify with the university | add official education or university source before presenting as factual |
| Canada | tuition_masters_health | 22000-40000 | ESTIMATE_MARKET | missing | no | no | low | Typical tuition range, verify with the university | add official education or university source before presenting as factual |
| Canada | tuition_masters_social | 18000-32000 | ESTIMATE_MARKET | missing | no | no | low | Typical tuition range, verify with the university | add official education or university source before presenting as factual |
| Canada | tuition_masters_law | 22000-38000 | ESTIMATE_MARKET | missing | no | no | low | Typical tuition range, verify with the university | add official education or university source before presenting as factual |
| Canada | tuition_phd_engineering | 9000-22000 | ESTIMATE_MARKET | missing | no | no | low | Typical tuition range, verify with the university | add official education or university source before presenting as factual |
| Canada | tuition_phd_business | 11000-25000 | ESTIMATE_MARKET | missing | no | no | low | Typical tuition range, verify with the university | add official education or university source before presenting as factual |
| Canada | tuition_phd_health | 12000-24000 | ESTIMATE_MARKET | missing | no | no | low | Typical tuition range, verify with the university | add official education or university source before presenting as factual |
| Canada | tuition_phd_social | 8000-20000 | ESTIMATE_MARKET | missing | no | no | low | Typical tuition range, verify with the university | add official education or university source before presenting as factual |
| Canada | tuition_phd_law | 10000-22000 | ESTIMATE_MARKET | missing | no | no | low | Typical tuition range, verify with the university | add official education or university source before presenting as factual |
| Canada | living_range_market_reference | 22895-30000 | ESTIMATE_MARKET | missing | no | no | low | Estimated annual living range, not official | keep only with estimate label and add market/source methodology |
| Canada | setup_travel_arrival_cost | 2200 | ESTIMATE_MARKET | missing | no | no | low | Estimated flight and arrival setup cost | keep only as estimate; add origin/city/date methodology or ticket quote timestamp |
| Canada | dependents_multiplier | spouse:1.35; children:1.55; spouse_and_children:1.8 | UNKNOWN_OR_UNVERIFIED | missing | no | no | low | Dependents adjustment needs verification | replace country-specific dependent costs where official values exist; otherwise show as estimate |
| Canada | static_fx_CAD_to_usd | 0.73 | UNKNOWN_OR_UNVERIFIED | missing | no | no | unknown | FX estimate, rate date/source missing | add FX provider/date or mark all local/USD conversions as estimate |
| Canada | proof_of_funds_living_outside_quebec | 22895 | OFFICIAL_GOVERNMENT | [Canada.ca Proof of financial support for study permit](https://www.canada.ca/en/immigration-refugees-citizenship/services/study-canada/study-permit/get-documents/financial-support.html) | yes | yes | high | Official Canada living expense threshold outside Quebec | keep, but clarify excludes tuition and transportation |
| Canada | study_permit_fee | 150 | OFFICIAL_GOVERNMENT | [IRCC Citizenship and immigration application fees](https://www.ircc.canada.ca/english/information/fees/fees.asp) | yes | yes | high | Official Canada study permit fee | keep |
| Canada | biometrics_fee | 85 | OFFICIAL_GOVERNMENT | [IRCC Citizenship and immigration application fees](https://www.ircc.canada.ca/english/information/fees/fees.asp) | yes | yes | high | Official Canada biometrics fee | keep |
| Canada | annual_insurance_reference | 1100 | ESTIMATE_MARKET | missing | no | no | low | Estimated health insurance cost | keep only as estimate and add province/institution source strategy |
| Australia | tuition_bachelors_engineering | 30000-50000 | ESTIMATE_MARKET | missing | no | no | low | Typical tuition range, verify with the university | add official education or university source before presenting as factual |
| Australia | tuition_bachelors_business | 28000-48000 | ESTIMATE_MARKET | missing | no | no | low | Typical tuition range, verify with the university | add official education or university source before presenting as factual |
| Australia | tuition_bachelors_health | 38000-65000 | ESTIMATE_MARKET | missing | no | no | low | Typical tuition range, verify with the university | add official education or university source before presenting as factual |
| Australia | tuition_bachelors_social | 22000-36000 | ESTIMATE_MARKET | missing | no | no | low | Typical tuition range, verify with the university | add official education or university source before presenting as factual |
| Australia | tuition_bachelors_law | 30000-50000 | ESTIMATE_MARKET | missing | no | no | low | Typical tuition range, verify with the university | add official education or university source before presenting as factual |
| Australia | tuition_masters_engineering | 28000-46000 | ESTIMATE_MARKET | missing | no | no | low | Typical tuition range, verify with the university | add official education or university source before presenting as factual |
| Australia | tuition_masters_business | 28000-50000 | ESTIMATE_MARKET | missing | no | no | low | Typical tuition range, verify with the university | add official education or university source before presenting as factual |
| Australia | tuition_masters_health | 35000-56000 | ESTIMATE_MARKET | missing | no | no | low | Typical tuition range, verify with the university | add official education or university source before presenting as factual |
| Australia | tuition_masters_social | 22000-38000 | ESTIMATE_MARKET | missing | no | no | low | Typical tuition range, verify with the university | add official education or university source before presenting as factual |
| Australia | tuition_masters_law | 28000-47000 | ESTIMATE_MARKET | missing | no | no | low | Typical tuition range, verify with the university | add official education or university source before presenting as factual |
| Australia | tuition_phd_engineering | 18000-36000 | ESTIMATE_MARKET | missing | no | no | low | Typical tuition range, verify with the university | add official education or university source before presenting as factual |
| Australia | tuition_phd_business | 18000-34000 | ESTIMATE_MARKET | missing | no | no | low | Typical tuition range, verify with the university | add official education or university source before presenting as factual |
| Australia | tuition_phd_health | 22000-42000 | ESTIMATE_MARKET | missing | no | no | low | Typical tuition range, verify with the university | add official education or university source before presenting as factual |
| Australia | tuition_phd_social | 16000-28000 | ESTIMATE_MARKET | missing | no | no | low | Typical tuition range, verify with the university | add official education or university source before presenting as factual |
| Australia | tuition_phd_law | 18000-32000 | ESTIMATE_MARKET | missing | no | no | low | Typical tuition range, verify with the university | add official education or university source before presenting as factual |
| Australia | living_range_market_reference | 29710-36000 | ESTIMATE_MARKET | missing | no | no | low | Estimated annual living range, not official | keep only with estimate label and add market/source methodology |
| Australia | setup_travel_arrival_cost | 2500 | ESTIMATE_MARKET | missing | no | no | low | Estimated flight and arrival setup cost | keep only as estimate; add origin/city/date methodology or ticket quote timestamp |
| Australia | dependents_multiplier | spouse:1.35; children:1.55; spouse_and_children:1.8 | UNKNOWN_OR_UNVERIFIED | missing | no | no | low | Dependents adjustment needs verification | replace country-specific dependent costs where official values exist; otherwise show as estimate |
| Australia | static_fx_AUD_to_usd | 0.66 | UNKNOWN_OR_UNVERIFIED | missing | no | no | unknown | FX estimate, rate date/source missing | add FX provider/date or mark all local/USD conversions as estimate |
| Australia | student_visa_financial_capacity | 29710 | OFFICIAL_GOVERNMENT | [Study Australia How to apply for your visa](https://www.studyaustralia.gov.au/en/plan-your-move/visa-application-process) | yes | yes | high | Official Australia student visa financial capacity requirement | keep, but warn actual living costs may be higher |
| Australia | student_visa_application_charge | 2000 | OFFICIAL_GOVERNMENT | [Study Australia Student Visa Application Charge increase](https://www.studyaustralia.gov.au/en/tools-and-resources/news/student-visa-application-charge-increase) | yes | yes | high | Official Australia student visa application charge | keep |
| Australia | oshc_annual_reference | 950 | ESTIMATE_MARKET | missing | no | no | low | Estimated OSHC premium | keep only as estimate; add provider quote/source strategy |
| United States | tuition_bachelors_engineering | 28000-60000 | ESTIMATE_MARKET | missing | no | no | low | Typical tuition range, verify with the university | add official education or university source before presenting as factual |
| United States | tuition_bachelors_business | 26000-58000 | ESTIMATE_MARKET | missing | no | no | low | Typical tuition range, verify with the university | add official education or university source before presenting as factual |
| United States | tuition_bachelors_health | 32000-65000 | ESTIMATE_MARKET | missing | no | no | low | Typical tuition range, verify with the university | add official education or university source before presenting as factual |
| United States | tuition_bachelors_social | 22000-52000 | ESTIMATE_MARKET | missing | no | no | low | Typical tuition range, verify with the university | add official education or university source before presenting as factual |
| United States | tuition_bachelors_law | 28000-60000 | ESTIMATE_MARKET | missing | no | no | low | Typical tuition range, verify with the university | add official education or university source before presenting as factual |
| United States | tuition_masters_engineering | 25000-52000 | ESTIMATE_MARKET | missing | no | no | low | Typical tuition range, verify with the university | add official education or university source before presenting as factual |
| United States | tuition_masters_business | 30000-65000 | ESTIMATE_MARKET | missing | no | no | low | Typical tuition range, verify with the university | add official education or university source before presenting as factual |
| United States | tuition_masters_health | 32000-60000 | ESTIMATE_MARKET | missing | no | no | low | Typical tuition range, verify with the university | add official education or university source before presenting as factual |
| United States | tuition_masters_social | 22000-48000 | ESTIMATE_MARKET | missing | no | no | low | Typical tuition range, verify with the university | add official education or university source before presenting as factual |
| United States | tuition_masters_law | 28000-60000 | ESTIMATE_MARKET | missing | no | no | low | Typical tuition range, verify with the university | add official education or university source before presenting as factual |
| United States | tuition_phd_engineering | 0-20000 | ESTIMATE_MARKET | missing | no | no | low | Typical tuition range, verify with the university | add official education or university source before presenting as factual |
| United States | tuition_phd_business | 8000-26000 | ESTIMATE_MARKET | missing | no | no | low | Typical tuition range, verify with the university | add official education or university source before presenting as factual |
| United States | tuition_phd_health | 12000-28000 | ESTIMATE_MARKET | missing | no | no | low | Typical tuition range, verify with the university | add official education or university source before presenting as factual |
| United States | tuition_phd_social | 0-18000 | ESTIMATE_MARKET | missing | no | no | low | Typical tuition range, verify with the university | add official education or university source before presenting as factual |
| United States | tuition_phd_law | 10000-22000 | ESTIMATE_MARKET | missing | no | no | low | Typical tuition range, verify with the university | add official education or university source before presenting as factual |
| United States | living_range_market_reference | 18000-28000 | ESTIMATE_MARKET | missing | no | no | low | Estimated annual living range, not official | keep only with estimate label and add market/source methodology |
| United States | setup_travel_arrival_cost | 2500 | ESTIMATE_MARKET | missing | no | no | low | Estimated flight and arrival setup cost | keep only as estimate; add origin/city/date methodology or ticket quote timestamp |
| United States | dependents_multiplier | spouse:1.35; children:1.55; spouse_and_children:1.8 | UNKNOWN_OR_UNVERIFIED | missing | no | no | low | Dependents adjustment needs verification | replace country-specific dependent costs where official values exist; otherwise show as estimate |
| United States | static_fx_USD_to_usd | 1 | UNKNOWN_OR_UNVERIFIED | missing | no | no | unknown | FX estimate, rate date/source missing | add FX provider/date or mark all local/USD conversions as estimate |
| United States | student_visa_mrv_fee | 185 | OFFICIAL_GOVERNMENT | [U.S. Department of State Student Visa](https://travel.state.gov/content/travel/en/us-visas/study/student-visa.html) | yes | yes | high | Official U.S. student visa application fee | keep |
| United States | sevis_i901_fee | 350 | OFFICIAL_GOVERNMENT | [U.S. ICE I-901 SEVIS Fee](https://www.ice.gov/sevis/i901) | yes | yes | high | Official SEVIS I-901 fee | keep |
| United States | institution_specific_i20_cost_strategy | not modeled | OFFICIAL_EDUCATION | [EducationUSA Finance Your U.S. Studies](https://educationusa.state.gov/your-5-steps-us-study/finance-your-studies) | no | yes | medium | Institution-specific I-20/COA required | add warning that U.S. tuition and living proof vary by school and Form I-20 |
| United States | annual_insurance_reference | 2400 | ESTIMATE_MARKET | missing | no | no | low | Estimated student insurance cost | keep only as estimate and add university insurance source strategy |
| Germany | tuition_bachelors_engineering | 0-3500 | ESTIMATE_MARKET | missing | no | no | low | Typical tuition range, verify with the university | add official education or university source before presenting as factual |
| Germany | tuition_bachelors_business | 0-6000 | ESTIMATE_MARKET | missing | no | no | low | Typical tuition range, verify with the university | add official education or university source before presenting as factual |
| Germany | tuition_bachelors_health | 0-3000 | ESTIMATE_MARKET | missing | no | no | low | Typical tuition range, verify with the university | add official education or university source before presenting as factual |
| Germany | tuition_bachelors_social | 0-3500 | ESTIMATE_MARKET | missing | no | no | low | Typical tuition range, verify with the university | add official education or university source before presenting as factual |
| Germany | tuition_bachelors_law | 0-4000 | ESTIMATE_MARKET | missing | no | no | low | Typical tuition range, verify with the university | add official education or university source before presenting as factual |
| Germany | tuition_masters_engineering | 0-4500 | ESTIMATE_MARKET | missing | no | no | low | Typical tuition range, verify with the university | add official education or university source before presenting as factual |
| Germany | tuition_masters_business | 0-8000 | ESTIMATE_MARKET | missing | no | no | low | Typical tuition range, verify with the university | add official education or university source before presenting as factual |
| Germany | tuition_masters_health | 0-4000 | ESTIMATE_MARKET | missing | no | no | low | Typical tuition range, verify with the university | add official education or university source before presenting as factual |
| Germany | tuition_masters_social | 0-4500 | ESTIMATE_MARKET | missing | no | no | low | Typical tuition range, verify with the university | add official education or university source before presenting as factual |
| Germany | tuition_masters_law | 0-5000 | ESTIMATE_MARKET | missing | no | no | low | Typical tuition range, verify with the university | add official education or university source before presenting as factual |
| Germany | tuition_phd_engineering | 0-1500 | ESTIMATE_MARKET | missing | no | no | low | Typical tuition range, verify with the university | add official education or university source before presenting as factual |
| Germany | tuition_phd_business | 0-1500 | ESTIMATE_MARKET | missing | no | no | low | Typical tuition range, verify with the university | add official education or university source before presenting as factual |
| Germany | tuition_phd_health | 0-1500 | ESTIMATE_MARKET | missing | no | no | low | Typical tuition range, verify with the university | add official education or university source before presenting as factual |
| Germany | tuition_phd_social | 0-1500 | ESTIMATE_MARKET | missing | no | no | low | Typical tuition range, verify with the university | add official education or university source before presenting as factual |
| Germany | tuition_phd_law | 0-1500 | ESTIMATE_MARKET | missing | no | no | low | Typical tuition range, verify with the university | add official education or university source before presenting as factual |
| Germany | living_range_market_reference | 11904-14500 | ESTIMATE_MARKET | missing | no | no | low | Estimated annual living range, not official | keep only with estimate label and add market/source methodology |
| Germany | setup_travel_arrival_cost | 1800 | ESTIMATE_MARKET | missing | no | no | low | Estimated flight and arrival setup cost | keep only as estimate; add origin/city/date methodology or ticket quote timestamp |
| Germany | dependents_multiplier | spouse:1.35; children:1.55; spouse_and_children:1.8 | UNKNOWN_OR_UNVERIFIED | missing | no | no | low | Dependents adjustment needs verification | replace country-specific dependent costs where official values exist; otherwise show as estimate |
| Germany | static_fx_EUR_to_usd | 1.08 | UNKNOWN_OR_UNVERIFIED | missing | no | no | unknown | FX estimate, rate date/source missing | add FX provider/date or mark all local/USD conversions as estimate |
| Germany | blocked_account_reference_current_app | 11904 | OFFICIAL_EDUCATION | [DAAD Costs of education and living](https://www.daad.de/en/study-and-research-in-germany/plan-your-studies/costs-of-education-and-living/) | yes | yes | medium | DAAD proof-of-funds planning reference | relabel as official education reference and add mission/Consular Services Portal verification before calling it official government |
| Germany | blocked_account_mission_verification_needed | not modeled | OFFICIAL_GOVERNMENT | [German Federal Foreign Office blocked account for students](https://www.auswaertiges-amt.de/en/visa-service/visabestimmungen-node/sperrkonto-seite) | no | yes | medium | Germany proof-of-funds value needs official mission verification | add mission/portal source field for exact blocked-account amount by applicant country |
| Germany | national_visa_fee | 75 | OFFICIAL_GOVERNMENT | [German Federal Foreign Office Visas for Germany](https://www.auswaertiges-amt.de/en/visa-service/215870-215870) | yes | yes | high | Official Germany national visa fee | keep and replace German-language URL with English Federal Foreign Office URL where possible |
| Germany | annual_health_insurance_reference | 1740 | ESTIMATE_MARKET | missing | no | no | low | Estimated German student health insurance cost | keep only as estimate and add public/private insurer source strategy |

## Expanded destination estimate audit

The expanded selector uses regional profiles for non-hero countries. These rows are valuable for discovery, but they must stay visibly labeled as estimates until destination-specific source URLs and last-checked dates exist.

| Destination | Region | Currency | City/tier | Fields audited | Low/unknown confidence fields | Fields |
| --- | --- | --- | --- | ---: | ---: | --- |
| South Africa | Africa | ZAR | Africa regional profile | 8 | 1 | regional_tuition_bachelors, regional_tuition_masters, regional_tuition_phd, regional_living, regional_insurance, regional_visa_government_estimate, regional_setup_travel_arrival_estimate, static_fx_ZAR_to_usd |
| Egypt | Africa | EGP | Africa regional profile | 8 | 1 | regional_tuition_bachelors, regional_tuition_masters, regional_tuition_phd, regional_living, regional_insurance, regional_visa_government_estimate, regional_setup_travel_arrival_estimate, static_fx_EGP_to_usd |
| Morocco | Africa | MAD | Africa regional profile | 8 | 1 | regional_tuition_bachelors, regional_tuition_masters, regional_tuition_phd, regional_living, regional_insurance, regional_visa_government_estimate, regional_setup_travel_arrival_estimate, static_fx_MAD_to_usd |
| Ghana | Africa | GHS | Africa regional profile | 8 | 1 | regional_tuition_bachelors, regional_tuition_masters, regional_tuition_phd, regional_living, regional_insurance, regional_visa_government_estimate, regional_setup_travel_arrival_estimate, static_fx_GHS_to_usd |
| Kenya | Africa | KES | Africa regional profile | 8 | 1 | regional_tuition_bachelors, regional_tuition_masters, regional_tuition_phd, regional_living, regional_insurance, regional_visa_government_estimate, regional_setup_travel_arrival_estimate, static_fx_KES_to_usd |
| Rwanda | Africa | RWF | Africa regional profile | 8 | 1 | regional_tuition_bachelors, regional_tuition_masters, regional_tuition_phd, regional_living, regional_insurance, regional_visa_government_estimate, regional_setup_travel_arrival_estimate, static_fx_RWF_to_usd |
| Mauritius | Africa | MUR | Africa regional profile | 8 | 1 | regional_tuition_bachelors, regional_tuition_masters, regional_tuition_phd, regional_living, regional_insurance, regional_visa_government_estimate, regional_setup_travel_arrival_estimate, static_fx_MUR_to_usd |
| Tunisia | Africa | TND | Africa regional profile | 8 | 1 | regional_tuition_bachelors, regional_tuition_masters, regional_tuition_phd, regional_living, regional_insurance, regional_visa_government_estimate, regional_setup_travel_arrival_estimate, static_fx_TND_to_usd |
| Botswana | Africa | BWP | Africa regional profile | 8 | 1 | regional_tuition_bachelors, regional_tuition_masters, regional_tuition_phd, regional_living, regional_insurance, regional_visa_government_estimate, regional_setup_travel_arrival_estimate, static_fx_BWP_to_usd |
| Namibia | Africa | NAD | Africa regional profile | 8 | 1 | regional_tuition_bachelors, regional_tuition_masters, regional_tuition_phd, regional_living, regional_insurance, regional_visa_government_estimate, regional_setup_travel_arrival_estimate, static_fx_NAD_to_usd |
| Senegal | Africa | XOF | Africa regional profile | 8 | 1 | regional_tuition_bachelors, regional_tuition_masters, regional_tuition_phd, regional_living, regional_insurance, regional_visa_government_estimate, regional_setup_travel_arrival_estimate, static_fx_XOF_to_usd |
| Nigeria | Africa | NGN | Africa regional profile | 8 | 1 | regional_tuition_bachelors, regional_tuition_masters, regional_tuition_phd, regional_living, regional_insurance, regional_visa_government_estimate, regional_setup_travel_arrival_estimate, static_fx_NGN_to_usd |
| Uganda | Africa | UGX | Africa regional profile | 8 | 1 | regional_tuition_bachelors, regional_tuition_masters, regional_tuition_phd, regional_living, regional_insurance, regional_visa_government_estimate, regional_setup_travel_arrival_estimate, static_fx_UGX_to_usd |
| Tanzania | Africa | TZS | Africa regional profile | 8 | 1 | regional_tuition_bachelors, regional_tuition_masters, regional_tuition_phd, regional_living, regional_insurance, regional_visa_government_estimate, regional_setup_travel_arrival_estimate, static_fx_TZS_to_usd |
| Ethiopia | Africa | ETB | Africa regional profile | 8 | 1 | regional_tuition_bachelors, regional_tuition_masters, regional_tuition_phd, regional_living, regional_insurance, regional_visa_government_estimate, regional_setup_travel_arrival_estimate, static_fx_ETB_to_usd |
| Zambia | Africa | ZMW | Africa regional profile | 8 | 1 | regional_tuition_bachelors, regional_tuition_masters, regional_tuition_phd, regional_living, regional_insurance, regional_visa_government_estimate, regional_setup_travel_arrival_estimate, static_fx_ZMW_to_usd |
| Algeria | Africa | DZD | Africa regional profile | 8 | 1 | regional_tuition_bachelors, regional_tuition_masters, regional_tuition_phd, regional_living, regional_insurance, regional_visa_government_estimate, regional_setup_travel_arrival_estimate, static_fx_DZD_to_usd |
| Cameroon | Africa | XAF | Africa regional profile | 8 | 1 | regional_tuition_bachelors, regional_tuition_masters, regional_tuition_phd, regional_living, regional_insurance, regional_visa_government_estimate, regional_setup_travel_arrival_estimate, static_fx_XAF_to_usd |
| Cote d Ivoire | Africa | XOF | Africa regional profile | 8 | 1 | regional_tuition_bachelors, regional_tuition_masters, regional_tuition_phd, regional_living, regional_insurance, regional_visa_government_estimate, regional_setup_travel_arrival_estimate, static_fx_XOF_to_usd |
| Malawi | Africa | MWK | Africa regional profile | 8 | 1 | regional_tuition_bachelors, regional_tuition_masters, regional_tuition_phd, regional_living, regional_insurance, regional_visa_government_estimate, regional_setup_travel_arrival_estimate, static_fx_MWK_to_usd |
| France | Europe | EUR | Europe regional profile | 8 | 1 | regional_tuition_bachelors, regional_tuition_masters, regional_tuition_phd, regional_living, regional_insurance, regional_visa_government_estimate, regional_setup_travel_arrival_estimate, static_fx_EUR_to_usd |
| Ireland | Europe | EUR | Europe regional profile | 8 | 1 | regional_tuition_bachelors, regional_tuition_masters, regional_tuition_phd, regional_living, regional_insurance, regional_visa_government_estimate, regional_setup_travel_arrival_estimate, static_fx_EUR_to_usd |
| Netherlands | Europe | EUR | Europe regional profile | 8 | 1 | regional_tuition_bachelors, regional_tuition_masters, regional_tuition_phd, regional_living, regional_insurance, regional_visa_government_estimate, regional_setup_travel_arrival_estimate, static_fx_EUR_to_usd |
| Sweden | Europe | SEK | Europe regional profile | 8 | 1 | regional_tuition_bachelors, regional_tuition_masters, regional_tuition_phd, regional_living, regional_insurance, regional_visa_government_estimate, regional_setup_travel_arrival_estimate, static_fx_SEK_to_usd |
| Finland | Europe | EUR | Europe regional profile | 8 | 1 | regional_tuition_bachelors, regional_tuition_masters, regional_tuition_phd, regional_living, regional_insurance, regional_visa_government_estimate, regional_setup_travel_arrival_estimate, static_fx_EUR_to_usd |
| Norway | Europe | NOK | Europe regional profile | 8 | 1 | regional_tuition_bachelors, regional_tuition_masters, regional_tuition_phd, regional_living, regional_insurance, regional_visa_government_estimate, regional_setup_travel_arrival_estimate, static_fx_NOK_to_usd |
| Denmark | Europe | DKK | Europe regional profile | 8 | 1 | regional_tuition_bachelors, regional_tuition_masters, regional_tuition_phd, regional_living, regional_insurance, regional_visa_government_estimate, regional_setup_travel_arrival_estimate, static_fx_DKK_to_usd |
| Italy | Europe | EUR | Europe regional profile | 8 | 1 | regional_tuition_bachelors, regional_tuition_masters, regional_tuition_phd, regional_living, regional_insurance, regional_visa_government_estimate, regional_setup_travel_arrival_estimate, static_fx_EUR_to_usd |
| Spain | Europe | EUR | Europe regional profile | 8 | 1 | regional_tuition_bachelors, regional_tuition_masters, regional_tuition_phd, regional_living, regional_insurance, regional_visa_government_estimate, regional_setup_travel_arrival_estimate, static_fx_EUR_to_usd |
| Portugal | Europe | EUR | Europe regional profile | 8 | 1 | regional_tuition_bachelors, regional_tuition_masters, regional_tuition_phd, regional_living, regional_insurance, regional_visa_government_estimate, regional_setup_travel_arrival_estimate, static_fx_EUR_to_usd |
| Poland | Europe | PLN | Europe regional profile | 8 | 1 | regional_tuition_bachelors, regional_tuition_masters, regional_tuition_phd, regional_living, regional_insurance, regional_visa_government_estimate, regional_setup_travel_arrival_estimate, static_fx_PLN_to_usd |
| Hungary | Europe | HUF | Europe regional profile | 8 | 1 | regional_tuition_bachelors, regional_tuition_masters, regional_tuition_phd, regional_living, regional_insurance, regional_visa_government_estimate, regional_setup_travel_arrival_estimate, static_fx_HUF_to_usd |
| Czech Republic | Europe | CZK | Europe regional profile | 8 | 1 | regional_tuition_bachelors, regional_tuition_masters, regional_tuition_phd, regional_living, regional_insurance, regional_visa_government_estimate, regional_setup_travel_arrival_estimate, static_fx_CZK_to_usd |
| Austria | Europe | EUR | Europe regional profile | 8 | 1 | regional_tuition_bachelors, regional_tuition_masters, regional_tuition_phd, regional_living, regional_insurance, regional_visa_government_estimate, regional_setup_travel_arrival_estimate, static_fx_EUR_to_usd |
| Belgium | Europe | EUR | Europe regional profile | 8 | 1 | regional_tuition_bachelors, regional_tuition_masters, regional_tuition_phd, regional_living, regional_insurance, regional_visa_government_estimate, regional_setup_travel_arrival_estimate, static_fx_EUR_to_usd |
| Switzerland | Europe | CHF | Europe regional profile | 8 | 1 | regional_tuition_bachelors, regional_tuition_masters, regional_tuition_phd, regional_living, regional_insurance, regional_visa_government_estimate, regional_setup_travel_arrival_estimate, static_fx_CHF_to_usd |
| Estonia | Europe | EUR | Europe regional profile | 8 | 1 | regional_tuition_bachelors, regional_tuition_masters, regional_tuition_phd, regional_living, regional_insurance, regional_visa_government_estimate, regional_setup_travel_arrival_estimate, static_fx_EUR_to_usd |
| Lithuania | Europe | EUR | Europe regional profile | 8 | 1 | regional_tuition_bachelors, regional_tuition_masters, regional_tuition_phd, regional_living, regional_insurance, regional_visa_government_estimate, regional_setup_travel_arrival_estimate, static_fx_EUR_to_usd |
| Latvia | Europe | EUR | Europe regional profile | 8 | 1 | regional_tuition_bachelors, regional_tuition_masters, regional_tuition_phd, regional_living, regional_insurance, regional_visa_government_estimate, regional_setup_travel_arrival_estimate, static_fx_EUR_to_usd |
| Greece | Europe | EUR | Europe regional profile | 8 | 1 | regional_tuition_bachelors, regional_tuition_masters, regional_tuition_phd, regional_living, regional_insurance, regional_visa_government_estimate, regional_setup_travel_arrival_estimate, static_fx_EUR_to_usd |
| Romania | Europe | RON | Europe regional profile | 8 | 1 | regional_tuition_bachelors, regional_tuition_masters, regional_tuition_phd, regional_living, regional_insurance, regional_visa_government_estimate, regional_setup_travel_arrival_estimate, static_fx_RON_to_usd |
| Slovenia | Europe | EUR | Europe regional profile | 8 | 1 | regional_tuition_bachelors, regional_tuition_masters, regional_tuition_phd, regional_living, regional_insurance, regional_visa_government_estimate, regional_setup_travel_arrival_estimate, static_fx_EUR_to_usd |
| Slovakia | Europe | EUR | Europe regional profile | 8 | 1 | regional_tuition_bachelors, regional_tuition_masters, regional_tuition_phd, regional_living, regional_insurance, regional_visa_government_estimate, regional_setup_travel_arrival_estimate, static_fx_EUR_to_usd |
| Croatia | Europe | EUR | Europe regional profile | 8 | 1 | regional_tuition_bachelors, regional_tuition_masters, regional_tuition_phd, regional_living, regional_insurance, regional_visa_government_estimate, regional_setup_travel_arrival_estimate, static_fx_EUR_to_usd |
| Cyprus | Europe | EUR | Europe regional profile | 8 | 1 | regional_tuition_bachelors, regional_tuition_masters, regional_tuition_phd, regional_living, regional_insurance, regional_visa_government_estimate, regional_setup_travel_arrival_estimate, static_fx_EUR_to_usd |
| Malta | Europe | EUR | Europe regional profile | 8 | 1 | regional_tuition_bachelors, regional_tuition_masters, regional_tuition_phd, regional_living, regional_insurance, regional_visa_government_estimate, regional_setup_travel_arrival_estimate, static_fx_EUR_to_usd |
| Luxembourg | Europe | EUR | Europe regional profile | 8 | 1 | regional_tuition_bachelors, regional_tuition_masters, regional_tuition_phd, regional_living, regional_insurance, regional_visa_government_estimate, regional_setup_travel_arrival_estimate, static_fx_EUR_to_usd |
| Iceland | Europe | ISK | Europe regional profile | 8 | 1 | regional_tuition_bachelors, regional_tuition_masters, regional_tuition_phd, regional_living, regional_insurance, regional_visa_government_estimate, regional_setup_travel_arrival_estimate, static_fx_ISK_to_usd |
| Mexico | North America | MXN | North America regional profile | 8 | 1 | regional_tuition_bachelors, regional_tuition_masters, regional_tuition_phd, regional_living, regional_insurance, regional_visa_government_estimate, regional_setup_travel_arrival_estimate, static_fx_MXN_to_usd |
| China | Asia | CNY | Asia regional profile | 8 | 1 | regional_tuition_bachelors, regional_tuition_masters, regional_tuition_phd, regional_living, regional_insurance, regional_visa_government_estimate, regional_setup_travel_arrival_estimate, static_fx_CNY_to_usd |
| Japan | Asia | JPY | Asia regional profile | 8 | 1 | regional_tuition_bachelors, regional_tuition_masters, regional_tuition_phd, regional_living, regional_insurance, regional_visa_government_estimate, regional_setup_travel_arrival_estimate, static_fx_JPY_to_usd |
| South Korea | Asia | KRW | Asia regional profile | 8 | 1 | regional_tuition_bachelors, regional_tuition_masters, regional_tuition_phd, regional_living, regional_insurance, regional_visa_government_estimate, regional_setup_travel_arrival_estimate, static_fx_KRW_to_usd |
| Malaysia | Asia | MYR | Asia regional profile | 8 | 1 | regional_tuition_bachelors, regional_tuition_masters, regional_tuition_phd, regional_living, regional_insurance, regional_visa_government_estimate, regional_setup_travel_arrival_estimate, static_fx_MYR_to_usd |
| Singapore | Asia | SGD | Asia regional profile | 8 | 1 | regional_tuition_bachelors, regional_tuition_masters, regional_tuition_phd, regional_living, regional_insurance, regional_visa_government_estimate, regional_setup_travel_arrival_estimate, static_fx_SGD_to_usd |
| India | Asia | INR | Asia regional profile | 8 | 1 | regional_tuition_bachelors, regional_tuition_masters, regional_tuition_phd, regional_living, regional_insurance, regional_visa_government_estimate, regional_setup_travel_arrival_estimate, static_fx_INR_to_usd |
| Thailand | Asia | THB | Asia regional profile | 8 | 1 | regional_tuition_bachelors, regional_tuition_masters, regional_tuition_phd, regional_living, regional_insurance, regional_visa_government_estimate, regional_setup_travel_arrival_estimate, static_fx_THB_to_usd |
| Indonesia | Asia | IDR | Asia regional profile | 8 | 1 | regional_tuition_bachelors, regional_tuition_masters, regional_tuition_phd, regional_living, regional_insurance, regional_visa_government_estimate, regional_setup_travel_arrival_estimate, static_fx_IDR_to_usd |
| Philippines | Asia | PHP | Asia regional profile | 8 | 1 | regional_tuition_bachelors, regional_tuition_masters, regional_tuition_phd, regional_living, regional_insurance, regional_visa_government_estimate, regional_setup_travel_arrival_estimate, static_fx_PHP_to_usd |
| Vietnam | Asia | VND | Asia regional profile | 8 | 1 | regional_tuition_bachelors, regional_tuition_masters, regional_tuition_phd, regional_living, regional_insurance, regional_visa_government_estimate, regional_setup_travel_arrival_estimate, static_fx_VND_to_usd |
| Taiwan | Asia | TWD | Asia regional profile | 8 | 1 | regional_tuition_bachelors, regional_tuition_masters, regional_tuition_phd, regional_living, regional_insurance, regional_visa_government_estimate, regional_setup_travel_arrival_estimate, static_fx_TWD_to_usd |
| Hong Kong | Asia | HKD | Asia regional profile | 8 | 1 | regional_tuition_bachelors, regional_tuition_masters, regional_tuition_phd, regional_living, regional_insurance, regional_visa_government_estimate, regional_setup_travel_arrival_estimate, static_fx_HKD_to_usd |
| Pakistan | Asia | PKR | Asia regional profile | 8 | 1 | regional_tuition_bachelors, regional_tuition_masters, regional_tuition_phd, regional_living, regional_insurance, regional_visa_government_estimate, regional_setup_travel_arrival_estimate, static_fx_PKR_to_usd |
| Sri Lanka | Asia | LKR | Asia regional profile | 8 | 1 | regional_tuition_bachelors, regional_tuition_masters, regional_tuition_phd, regional_living, regional_insurance, regional_visa_government_estimate, regional_setup_travel_arrival_estimate, static_fx_LKR_to_usd |
| Kazakhstan | Asia | KZT | Asia regional profile | 8 | 1 | regional_tuition_bachelors, regional_tuition_masters, regional_tuition_phd, regional_living, regional_insurance, regional_visa_government_estimate, regional_setup_travel_arrival_estimate, static_fx_KZT_to_usd |
| Uzbekistan | Asia | UZS | Asia regional profile | 8 | 1 | regional_tuition_bachelors, regional_tuition_masters, regional_tuition_phd, regional_living, regional_insurance, regional_visa_government_estimate, regional_setup_travel_arrival_estimate, static_fx_UZS_to_usd |
| Nepal | Asia | NPR | Asia regional profile | 8 | 1 | regional_tuition_bachelors, regional_tuition_masters, regional_tuition_phd, regional_living, regional_insurance, regional_visa_government_estimate, regional_setup_travel_arrival_estimate, static_fx_NPR_to_usd |
| Bangladesh | Asia | BDT | Asia regional profile | 8 | 1 | regional_tuition_bachelors, regional_tuition_masters, regional_tuition_phd, regional_living, regional_insurance, regional_visa_government_estimate, regional_setup_travel_arrival_estimate, static_fx_BDT_to_usd |
| Brunei | Asia | BND | Asia regional profile | 8 | 1 | regional_tuition_bachelors, regional_tuition_masters, regional_tuition_phd, regional_living, regional_insurance, regional_visa_government_estimate, regional_setup_travel_arrival_estimate, static_fx_BND_to_usd |
| Macau | Asia | HKD | Asia regional profile | 8 | 1 | regional_tuition_bachelors, regional_tuition_masters, regional_tuition_phd, regional_living, regional_insurance, regional_visa_government_estimate, regional_setup_travel_arrival_estimate, static_fx_HKD_to_usd |
| United Arab Emirates | Middle East | AED | Middle East regional profile | 8 | 8 | regional_tuition_bachelors, regional_tuition_masters, regional_tuition_phd, regional_living, regional_insurance, regional_visa_government_estimate, regional_setup_travel_arrival_estimate, static_fx_AED_to_usd |
| Qatar | Middle East | QAR | Middle East regional profile | 8 | 8 | regional_tuition_bachelors, regional_tuition_masters, regional_tuition_phd, regional_living, regional_insurance, regional_visa_government_estimate, regional_setup_travel_arrival_estimate, static_fx_QAR_to_usd |
| Saudi Arabia | Middle East | SAR | Middle East regional profile | 8 | 8 | regional_tuition_bachelors, regional_tuition_masters, regional_tuition_phd, regional_living, regional_insurance, regional_visa_government_estimate, regional_setup_travel_arrival_estimate, static_fx_SAR_to_usd |
| Oman | Middle East | OMR | Middle East regional profile | 8 | 8 | regional_tuition_bachelors, regional_tuition_masters, regional_tuition_phd, regional_living, regional_insurance, regional_visa_government_estimate, regional_setup_travel_arrival_estimate, static_fx_OMR_to_usd |
| Jordan | Middle East | JOD | Middle East regional profile | 8 | 8 | regional_tuition_bachelors, regional_tuition_masters, regional_tuition_phd, regional_living, regional_insurance, regional_visa_government_estimate, regional_setup_travel_arrival_estimate, static_fx_JOD_to_usd |
| Israel | Middle East | ILS | Middle East regional profile | 8 | 8 | regional_tuition_bachelors, regional_tuition_masters, regional_tuition_phd, regional_living, regional_insurance, regional_visa_government_estimate, regional_setup_travel_arrival_estimate, static_fx_ILS_to_usd |
| Turkey | Middle East | TRY | Middle East regional profile | 8 | 8 | regional_tuition_bachelors, regional_tuition_masters, regional_tuition_phd, regional_living, regional_insurance, regional_visa_government_estimate, regional_setup_travel_arrival_estimate, static_fx_TRY_to_usd |
| Bahrain | Middle East | BHD | Middle East regional profile | 8 | 8 | regional_tuition_bachelors, regional_tuition_masters, regional_tuition_phd, regional_living, regional_insurance, regional_visa_government_estimate, regional_setup_travel_arrival_estimate, static_fx_BHD_to_usd |
| Kuwait | Middle East | KWD | Middle East regional profile | 8 | 8 | regional_tuition_bachelors, regional_tuition_masters, regional_tuition_phd, regional_living, regional_insurance, regional_visa_government_estimate, regional_setup_travel_arrival_estimate, static_fx_KWD_to_usd |
| Lebanon | Middle East | LBP | Middle East regional profile | 8 | 8 | regional_tuition_bachelors, regional_tuition_masters, regional_tuition_phd, regional_living, regional_insurance, regional_visa_government_estimate, regional_setup_travel_arrival_estimate, static_fx_LBP_to_usd |
| New Zealand | Oceania | NZD | Oceania regional profile | 8 | 1 | regional_tuition_bachelors, regional_tuition_masters, regional_tuition_phd, regional_living, regional_insurance, regional_visa_government_estimate, regional_setup_travel_arrival_estimate, static_fx_NZD_to_usd |
| Fiji | Oceania | FJD | Oceania regional profile | 8 | 1 | regional_tuition_bachelors, regional_tuition_masters, regional_tuition_phd, regional_living, regional_insurance, regional_visa_government_estimate, regional_setup_travel_arrival_estimate, static_fx_FJD_to_usd |
| Papua New Guinea | Oceania | PGK | Oceania regional profile | 8 | 1 | regional_tuition_bachelors, regional_tuition_masters, regional_tuition_phd, regional_living, regional_insurance, regional_visa_government_estimate, regional_setup_travel_arrival_estimate, static_fx_PGK_to_usd |
| Samoa | Oceania | WST | Oceania regional profile | 8 | 1 | regional_tuition_bachelors, regional_tuition_masters, regional_tuition_phd, regional_living, regional_insurance, regional_visa_government_estimate, regional_setup_travel_arrival_estimate, static_fx_WST_to_usd |
| Brazil | Latin America | BRL | Latin America regional profile | 8 | 8 | regional_tuition_bachelors, regional_tuition_masters, regional_tuition_phd, regional_living, regional_insurance, regional_visa_government_estimate, regional_setup_travel_arrival_estimate, static_fx_BRL_to_usd |
| Argentina | Latin America | ARS | Latin America regional profile | 8 | 8 | regional_tuition_bachelors, regional_tuition_masters, regional_tuition_phd, regional_living, regional_insurance, regional_visa_government_estimate, regional_setup_travel_arrival_estimate, static_fx_ARS_to_usd |
| Chile | Latin America | CLP | Latin America regional profile | 8 | 8 | regional_tuition_bachelors, regional_tuition_masters, regional_tuition_phd, regional_living, regional_insurance, regional_visa_government_estimate, regional_setup_travel_arrival_estimate, static_fx_CLP_to_usd |
| Colombia | Latin America | COP | Latin America regional profile | 8 | 8 | regional_tuition_bachelors, regional_tuition_masters, regional_tuition_phd, regional_living, regional_insurance, regional_visa_government_estimate, regional_setup_travel_arrival_estimate, static_fx_COP_to_usd |
| Costa Rica | Latin America | CRC | Latin America regional profile | 8 | 8 | regional_tuition_bachelors, regional_tuition_masters, regional_tuition_phd, regional_living, regional_insurance, regional_visa_government_estimate, regional_setup_travel_arrival_estimate, static_fx_CRC_to_usd |
| Peru | Latin America | PEN | Latin America regional profile | 8 | 8 | regional_tuition_bachelors, regional_tuition_masters, regional_tuition_phd, regional_living, regional_insurance, regional_visa_government_estimate, regional_setup_travel_arrival_estimate, static_fx_PEN_to_usd |
| Uruguay | Latin America | UYU | Latin America regional profile | 8 | 8 | regional_tuition_bachelors, regional_tuition_masters, regional_tuition_phd, regional_living, regional_insurance, regional_visa_government_estimate, regional_setup_travel_arrival_estimate, static_fx_UYU_to_usd |
| Panama | Latin America | PAB | Latin America regional profile | 8 | 8 | regional_tuition_bachelors, regional_tuition_masters, regional_tuition_phd, regional_living, regional_insurance, regional_visa_government_estimate, regional_setup_travel_arrival_estimate, static_fx_PAB_to_usd |
| Ecuador | Latin America | USD | Latin America regional profile | 8 | 8 | regional_tuition_bachelors, regional_tuition_masters, regional_tuition_phd, regional_living, regional_insurance, regional_visa_government_estimate, regional_setup_travel_arrival_estimate, static_fx_USD_to_usd |
| Dominican Republic | Latin America | DOP | Latin America regional profile | 8 | 8 | regional_tuition_bachelors, regional_tuition_masters, regional_tuition_phd, regional_living, regional_insurance, regional_visa_government_estimate, regional_setup_travel_arrival_estimate, static_fx_DOP_to_usd |
| Jamaica | Latin America | JMD | Latin America regional profile | 8 | 8 | regional_tuition_bachelors, regional_tuition_masters, regional_tuition_phd, regional_living, regional_insurance, regional_visa_government_estimate, regional_setup_travel_arrival_estimate, static_fx_JMD_to_usd |
| Barbados | Latin America | BBD | Latin America regional profile | 8 | 8 | regional_tuition_bachelors, regional_tuition_masters, regional_tuition_phd, regional_living, regional_insurance, regional_visa_government_estimate, regional_setup_travel_arrival_estimate, static_fx_BBD_to_usd |

## Hero destination findings

### United Kingdom

- Current app values for UK living support use GBP 1,136/month outside London and GBP 1,483/month London from UKCISA guidance. Current GOV.UK values are GBP 1,171/month outside London and GBP 1,529/month London, each for up to 9 months.
- Student visa fee GBP 558 and IHS GBP 776/year are source-backed by GOV.UK.
- Dependant funds are not modeled exactly; GOV.UK has country-specific dependant amounts.
- Tuition ranges remain typical estimates and must point users to CAS/university pricing.

### Canada

- CAD 22,895 outside Quebec is source-backed for one applicant from 1 September 2025.
- Canada.ca explicitly says this amount excludes tuition and transportation costs. Risk/upfront copy must not imply the proof floor alone covers the first-year plan.
- Study permit CAD 150 and biometrics CAD 85 are source-backed by IRCC.
- Quebec needs an explicit exception note and separate source path.

### Australia

- AUD 29,710 financial capacity and AUD 2,000 primary student visa charge are source-backed.
- Study Australia warns actual living costs vary and may be higher than the visa minimum.
- OSHC and tuition remain estimates unless tied to provider/course sources.

### USA

- USD 185 student visa fee and USD 350 SEVIS I-901 fee are source-backed.
- Tuition, living, and proof strategy must remain institution-specific because Form I-20/COA varies by school.
- EducationUSA supports the warning that cost varies by institution and location; it does not support a single official national tuition number.

### Germany

- EUR 11,904 / EUR 992 per month is supported by DAAD as official education planning guidance, but the Federal Foreign Office page says applicants should verify the blocked-account amount with the competent mission or Consular Services Portal.
- EUR 75 national visa fee is source-backed by the Federal Foreign Office.
- Health insurance, semester contribution, and tuition by state/institution need explicit estimate or university/source labels.

## UI/source-label validation

Verdict: **partial**

- The shared LastUpdatedSourceInfo component can display last checked, source link, confidence, and status.
- CurrencyDisplay already marks values as estimates when called with estimate:true, but does not expose FX source/date.
- Study Abroad assumption cards include one source link per destination, not per cost field.
- No structured sourceType/sourceUrl/confidence model exists for every Study Abroad cost category yet.

Required safe labels:

- Official visa requirement
- Official education source
- University source
- Estimated market cost
- Needs verification
- Last checked date
- Source link
- Confidence level

## Risk engine validation

Verdict: **ready_with_warnings**

- Risk considers budget vs upfront and first-year cost, funding source, scholarship reliance, duration, dependents, and destination confidence.
- Risk depends on low-confidence regional estimates for non-hero destinations and should display: "Risk estimate is approximate because some costs need verification."
- UK risk currently inherits stale GOV.UK financial requirement values through the hero model.
- Canada upfront/risk copy should clarify that CAD 22,895 excludes tuition and transportation, so tuition must remain part of first-year affordability pressure.
- Dependents are modeled with generic multipliers rather than country-specific official dependent requirements.

If any low-confidence or regional estimate contributes to a result, the UI should show: **Risk estimate is approximate because some costs need verification.**

## Safe display logic

- Government visa, proof-of-funds, IHS, biometrics, SEVIS, and blocked-account values should display as official only when their exact value is tied to an official government URL and a last-checked date.
- Tuition ranges should display as **Typical tuition range, verify with the university** unless tied to an official education portal or named university page.
- Flights, arrival setup, rent, groceries, local transport, insurance estimates, and regional averages should display as **Estimated market cost, not official**.
- FX conversions should display as estimates unless the rate source and FX date are shown.
- Germany blocked-account copy should say **Proof-of-funds value needs official mission verification** until the exact mission/portal source is stored.
- If an official source says actual living costs may be higher than the visa minimum, the result should repeat that warning near the risk display.

## Recommended next actions

1. Update UK livingOfficial min/max and source to GOV.UK.
2. Add structured source metadata per cost row: sourceType, sourceUrl, sourceTitle, sourceDate, lastChecked, confidence, supportsExactValue.
3. Add FX provider/date or keep all USD/local conversions in estimate mode with visible FX caveat.
4. Add country-specific dependant rules for UK, Canada, Australia, and any country where official dependant requirements exist.
5. Split official visa/proof values from market living estimates in the result model.
6. Start enrichment with the five hero destinations before claiming source-backed data for the expanded 100-country selector.

## Commands and evidence

- Read current implementation: tools/study-abroad-cost/index.html, tools/study-abroad-cost/study-abroad-cost.js, tools/study-abroad-cost/study-abroad-backbone.js, tools/study-abroad-cost/study-abroad-upgrade.css, assets/js/components/product-backbone.js, tools/scholarship-finder/scholarship-finder-upgrade.js.
- Verified current official source pages on 2026-05-20.
- Machine-readable details are in audit-results/study-abroad-cost-data-quality.json.
- Generated audit artifacts with node scripts/generate-study-abroad-cost-data-quality-audit.js.
- Validation passed: node --check scripts/generate-study-abroad-cost-data-quality-audit.js.
- Validation passed: node --check tools/study-abroad-cost/study-abroad-cost.js.
- Validation passed: node --check tools/study-abroad-cost/study-abroad-backbone.js.
- Validation passed: node --check assets/js/components/product-backbone.js.
- Validation passed: npm test.
- Validation passed: npm run build.
