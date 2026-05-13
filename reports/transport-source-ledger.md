# Transport Source Ledger

Generated: 2026-05-13T09:42:28.570Z

## Summary

- Tools mapped: 23
- Official sources checked: 41
- OK sources: 30
- Changed sources: 0
- Manual-review or blocked sources: 11
- Broken sources: 0

## Sources

| Status | Country | Authority | Source | HTTP | URL |
| --- | --- | --- | --- | --- | --- |
| OK | NG | Nigerian Midstream and Downstream Petroleum Regulatory Authority | NMDPRA - Leading Oil & Gas Regulatory Authority in Nigeria \| Ensuring Development through Sustainable Energy | 200 | https://nmdpra.gov.ng/ |
| OK | KE | Energy and Petroleum Regulatory Authority | Pump Prices \| Energy and Petroleum Regulatory Authority | 200 | https://www.epra.go.ke/pump-prices |
| OK | GH | National Petroleum Authority | INDICATIVE PRICES - National Petroleum Authority(NPA) | 200 | https://npa.gov.gh/indicative-prices/ |
| OK | ZA | Department of Mineral Resources and Energy | DMRE No Longer Exists | 200 | https://www.dmre.gov.za/ |
| OK | NG | Nigeria Customs Service | Nigeria Customs Service &#8211; Nigeria Customs Information Portal | 200 | https://customs.gov.ng/ |
| OK | KE | Kenya Revenue Authority | Importing & Exporting - KRA | 200 | https://www.kra.go.ke/individual/importing |
| OK | GH | Ghana Revenue Authority | Customs &#8211; GRA | 200 | https://gra.gov.gh/customs/ |
| OK | ZA | South African Revenue Service | Duties and Taxes \| South African Revenue Service | 200 | https://www.sars.gov.za/customs-and-excise/duties-and-taxes/ |
| OK | NG | Federal Road Safety Corps | FRSC | 200 | https://frsc.gov.ng/ |
| Manual review | KE | National Transport and Safety Authority | NTSA vehicle services |  | https://www.ntsa.go.ke/ |
| Manual review | ZA | eNaTIS | eNaTIS online services |  | https://online.natis.gov.za/ |
| OK | ZA | Road Traffic Management Corporation | RTMC Home | 200 | https://www.rtmc.co.za/ |
| OK | GH | Driver and Vehicle Licensing Authority | DVLA Ghana - Driver & Vehicle Licensing Authority | 200 | https://dvla.gov.gh/ |
| OK | RW | Irembo | IremboGov | 200 | https://irembo.gov.rw/ |
| OK | NG | Nigerian Ports Authority | Nigerian Ports Authority | 200 | https://nigerianports.gov.ng/ |
| OK | KE | Kenya Ports Authority | Home \| Kenya Ports Authority | 200 | https://www.kpa.co.ke/ |
| OK | GH | Ghana Ports and Harbours Authority | Ghana Ports & Harbours Authority :: Welcome | 200 | https://ghanaports.gov.gh/ |
| Manual review | ZA | Transnet National Ports Authority | Transnet National Ports Authority |  | https://www.transnetnationalportsauthority.net/ |
| OK | KE | Kenya Trade Portal | InfoTradeKenya | 200 | https://infotradekenya.go.ke/ |
| OK | RW | Rwanda Trade Portal | Rwanda Trade Portal | 200 | https://rwandatrade.rw/ |
| OK | ZA | South African National Roads Agency | Sanral: Building South Africa through better roads: SanralPages | 200 | https://www.nra.co.za/ |
| OK | KE | Kenya National Highways Authority | Home - Kenya National Highways Authority | 200 | https://kenha.co.ke/ |
| Manual review | NG | Lekki Concession Company | Lekki Concession Company |  | https://lcc.com.ng/ |
| Manual review | NG | Lagos Metropolitan Area Transport Authority | LAMATA |  | https://lamata.lagosstate.gov.ng/ |
| Manual review | GH | Ghana Highway Authority | Ghana Highway Authority |  | https://www.highways.gov.gh/ |
| OK | KE | Nairobi Expressway | The Nairobi Expressway | 200 | https://nairobiexpressway.ke/ |
| Manual review | NG | Lagos State Parking Authority | Lagos State Parking Authority |  | https://laspa.lagosstate.gov.ng/ |
| OK | KE | Nairobi City County | Home \| Nairobi City County | 200 | https://www.nairobi.go.ke/ |
| OK | ZA | City of Cape Town | City of Cape Town | 200 | https://www.capetown.gov.za/ |
| Manual review | GH | Accra Metropolitan Assembly | Accra Metropolitan Assembly |  | https://ama.gov.gh/ |
| OK | NG | Nigeria Civil Aviation Authority | Nigeria Civil Aviation Authority. NCAA | 200 | https://ncaa.gov.ng/ |
| OK | KE | Kenya Civil Aviation Authority | KCAA \| Kenya Civil Aviation Authority | 200 | https://www.kcaa.or.ke/ |
| OK | ZA | South African Civil Aviation Authority | Home - SACAA | 200 | https://www.caa.co.za/ |
| OK | GH | Ghana Civil Aviation Authority | Home - GHANA CIVIL AVIATION AUTHORITY | 200 | https://www.gcaa.com.gh/ |
| Manual | GLOBAL | Uber | Uber price estimate |  | https://www.uber.com/global/en/price-estimate/ |
| Manual | GLOBAL | Bolt | Explore Bolt services \| The all-in-one mobility app \| Bolt | 404 | https://bolt.eu/en/cities/ |
| Manual review | GLOBAL | DHL | DHL global shipping |  | https://www.dhl.com/ |
| OK | GLOBAL | FedEx | FedEx \| System Down | 200 | https://www.fedex.com/ |
| OK | ET | Ethiopian Airlines | Welcome to Ethiopian Airlines Official Website | 200 | https://www.ethiopianairlines.com/ |
| OK | KE | Kenya Airways | Kenya Airways \| The Pride of Africa | 200 | https://www.kenya-airways.com/ |
| OK | ZA | FlySafair | FlySafair | 200 | https://www.flysafair.co.za/ |

## Tool Review Queue

- vehicle-operating-cost (/tools/vehicle-operating-cost/): Manual review
- ride-fare (/tools/ride-fare/): Manual review
- truck-load (/tools/truck-load/): Manual review
- boda-income (/tools/boda-income/): Manual review
- delivery-cost (/tools/delivery-cost/): Manual review
- shipping-weight (/tools/shipping-weight/): Manual review
- vehicle-registration (/tools/vehicle-registration/): Manual review
- roadworthiness (/tools/roadworthiness/): Manual review
- last-mile-delivery (/tools/last-mile-delivery/): Manual review
- vehicle-tracker-roi (/tools/vehicle-tracker-roi/): Manual review
- parking-fee (/tools/parking-fee/): Manual review
- toll-calc (/tools/toll-calc/): Manual review
- matatu-fare (/tools/matatu-fare/): Manual review

## Manual Review Rules

- Do not update duties, tariffs, tolls, vehicle-registration steps, inspection requirements, airport fees, or fuel-price assumptions from a changed hash alone.
- When an authority portal is blocked, rate-limited, or login-gated, mark the affected tools for manual review and inspect the source in a browser.
- Prefer official government or regulator pages for legal requirements. Use direct operator pages only for operator availability, fare models, route availability, or shipping rules.
- Keep the hub count aligned across visible cards, metadata, JSON-LD `numberOfItems`, and this manifest.
- Run `npm run check-links` after changing transport hub routes, schema, or public source links.
