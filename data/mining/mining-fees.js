/*
 * Mining licence & permit fee dataset for AfroTools.
 *
 * WHAT THIS IS: application (one-off) and annual holding fees for reconnaissance,
 * prospecting/exploration and mining licences, used as EDITABLE, planning-grade
 * defaults in the Mining License Fee Calculator. Authorities are cited per
 * country; see data/mining/official-sources.json for the governance ledger.
 *
 * WHY A SEPARATE FILE: licence fees are set by a different instrument (fee
 * regulations / statutory instruments) than royalty rates (Mining Code / Finance
 * Act) and move on their own schedule. Keeping them out of mining-royalties.js
 * avoids one stale instrument dragging the other with it.
 *
 * FEE STRUCTURES DIFFER BY COUNTRY and this is modelled explicitly rather than
 * flattened: `annualBasis` is one of
 *   'flat'            -> annual fee is a fixed amount
 *   'perKm2'          -> annual fee is per square kilometre held
 *   'perHa'           -> annual fee is per hectare held
 *   'perCadastralUnit'-> annual fee is per cadastral unit / block held
 * A licence with no annual fee carries annual: 0 ONLY where that is an explicit,
 * sourced fact; where an amount is unknown it is omitted and the tool forces the
 * user to enter it (a missing fee is never silently costed at zero).
 *
 * `minAnnual` applies a documented statutory floor after the area calculation.
 *
 * PERISHABILITY: these are planning-grade. Zimbabwe is deliberately EXCLUDED —
 * its SI 95/2020 schedule is reported superseded by a large increase that could
 * not be verified, and a confidently-wrong fee is worse than an absent one. DRC
 * is excluded because CAMI re-sets per-carré surface rights annually and the
 * amounts could not be verified.
 *
 * Loadable as a browser <script> (window.MINING_FEES) and under Node.
 */
var MINING_FEES = {
  lastUpdated: '2026-07',
  countries: {
    NG: {
      name: 'Nigeria', flag: '🇳🇬', currency: 'NGN', symbol: '₦',
      authority: 'Mining Cadastre Office (MCO), Federal Ministry of Solid Minerals Development',
      url: 'https://www.miningcadastre.gov.ng/',
      confidence: 'high',
      licences: {
        reconnaissance: { label: 'Reconnaissance Permit', oneOff: 300000, annual: 31500, annualBasis: 'perCadastralUnit', note: 'Application ₦300,000; annual service fee ₦31,500 per cadastral unit. Official MCO schedule.' },
        exploration: { label: 'Exploration Licence', oneOff: 600000, annual: 31500, annualBasis: 'perCadastralUnit', note: 'Application ₦600,000; annual service fee ₦31,500 per cadastral unit.' },
        smallScale: { label: 'Small-Scale Mining Lease', oneOff: 300000, annual: 31500, annualBasis: 'perCadastralUnit', note: 'Application ₦300,000; annual service fee per cadastral unit.' },
        mining: { label: 'Mining Lease', oneOff: 3000000, annual: 1250000, annualBasis: 'flat', note: 'Application ₦3,000,000; annual fee ₦1,250,000. Official MCO schedule.' }
      }
    },
    GH: {
      name: 'Ghana', flag: '🇬🇭', currency: 'GHS', symbol: 'GH₵',
      authority: 'Ghana Minerals Commission (Ground Rent Regulations 2018)',
      url: 'https://www.mincom.gov.gh/mineral-rights/',
      confidence: 'medium',
      licences: {
        exploration: { label: 'Prospecting / Exploration Licence', oneOff: 75, oneOffBasis: 'perCadastralUnit', annual: 38, annualBasis: 'perCadastralUnit', note: 'GH₵75 per cadastral unit one-off; large-scale annual ground rent GH₵38 per cadastral unit. Upfront USD processing fees under L.I. 2176 could not be verified.' },
        smallScale: { label: 'Small-Scale Licence', annual: 50, annualBasis: 'perCadastralUnit', note: 'Small-scale annual ground rent GH₵50 per cadastral unit. One-off application fee not verified — enter it if it applies.' }
      }
    },
    TZ: {
      name: 'Tanzania', flag: '🇹🇿', currency: 'USD', symbol: '$',
      authority: 'Mining Commission of Tanzania (Mining Act CAP.123, First Schedule)',
      url: 'https://www.tumemadini.go.tz/pages/applicationprocedure/',
      confidence: 'medium',
      licences: {
        prospecting: { label: 'Prospecting Licence', annual: 150, annualBasis: 'perKm2', note: 'Annual rent about US$100–200/km²/yr depending on stage — US$150 used as a mid default. Confirm the current First Schedule.' },
        mining: { label: 'Mining Licence (metallic / energy / gemstone)', annual: 3000, annualBasis: 'flat', note: 'Annual rent US$3,000 (building/industrial minerals US$2,000).' },
        specialMining: { label: 'Special Mining Licence', annual: 5000, annualBasis: 'flat', note: 'Annual rent US$5,000.' }
      }
    },
    ZM: {
      name: 'Zambia', flag: '🇿🇲', currency: 'ZMW', symbol: 'K',
      authority: 'Zambia Minerals Regulation Commission (annual area charges)',
      url: 'https://www.mmmd.gov.zm/',
      confidence: 'medium',
      licences: {
        artisanal: { label: "Artisanal Mining Right", annual: 4.2, annualBasis: 'perHa', note: 'Annual area charge K4.20 per hectare. One-off application fees could not be verified.' },
        smallScale: { label: 'Small-Scale Mining Licence', annual: 8.4, annualBasis: 'perHa', note: 'Annual area charge K8.40 per hectare.' },
        mining: { label: 'Large-Scale Mining Licence', annual: 16.8, annualBasis: 'perHa', note: 'Annual area charge K16.80 per hectare.' }
      }
    },
    BW: {
      name: 'Botswana', flag: '🇧🇼', currency: 'BWP', symbol: 'P',
      authority: 'Botswana Department of Mines (Mines and Minerals Act 17 of 1999)',
      url: 'https://www.gov.bw/mining/prospecting-licence-application',
      confidence: 'medium',
      licences: {
        prospecting: { label: 'Prospecting Licence', annual: 5, annualBasis: 'perKm2', minAnnual: 1000, note: 'Annual fee BWP 5.00/km² with a statutory minimum (BWP 1,000; BWP 500 for industrial minerals). Max area 1,000 km². Mining-lease fee could not be verified.' }
      }
    },
    KE: {
      name: 'Kenya', flag: '🇰🇪', currency: 'KES', symbol: 'KSh',
      authority: 'Kenya State Department for Mining (Mining Act 2016; Regs LN 87/2017)',
      url: 'https://mining.go.ke/',
      confidence: 'medium',
      licences: {
        reconnaissance: { label: 'Reconnaissance Licence', oneOff: 20000, note: 'Application about KShs 20,000. Annual rent not separately verified — enter it if it applies.' },
        prospecting: { label: 'Prospecting Licence', oneOff: 50000, note: 'Application about KShs 50,000. Annual rent not separately verified.' },
        mining: { label: 'Large-Scale Mining Licence', oneOff: 50000, annual: 2000, annualBasis: 'perHa', minAnnual: 500000, note: 'Application about KShs 50,000; annual rent KShs 2,000/hectare with a KShs 500,000/yr minimum.' }
      }
    },
    ZA: {
      name: 'South Africa', flag: '🇿🇦', currency: 'ZAR', symbol: 'R',
      authority: 'DMRE / SAMRAD (MPRDA Regulations)',
      url: 'https://www.dmre.gov.za/',
      confidence: 'low',
      licences: {
        prospecting: { label: 'Prospecting Right', oneOff: 100, annual: 0, annualBasis: 'flat', note: 'Nominal application fee R100 under the MPRDA Regulations; no separate annual holding fee in the fee schedule (prospecting fees are payable under the royalty/lease terms). The current gazetted SAMRAD table was not re-confirmed — a post-2024 uplift may apply.' },
        mining: { label: 'Mining Right', oneOff: 1000, annual: 0, annualBasis: 'flat', note: 'Nominal application fee R1,000 under the MPRDA Regulations. Current gazetted table not re-confirmed.' }
      }
    },
    NA: {
      name: 'Namibia', flag: '🇳🇦', currency: 'NAD', symbol: 'N$',
      authority: 'Namibia Ministry of Mines and Energy (Minerals Act 33 of 1992)',
      url: 'https://www.mme.gov.na/',
      confidence: 'low',
      licences: {
        exploration: { label: 'Exclusive Prospecting Licence (EPL)', oneOff: 10000, note: 'Application fee is banded by area: about N$10,000 up to 20,000 ha, rising to about N$50,000 near 100,000 ha. Enter your band. Official MME fee PDF was unreachable — low confidence.' },
        claim: { label: 'Mining Claim', oneOff: 50, note: 'Mining claim registration about N$50. Mining Licence fee could not be verified — enter it.' }
      }
    }
  }
};

if (typeof module !== 'undefined' && module.exports) module.exports = MINING_FEES;
if (typeof window !== 'undefined') window.MINING_FEES = MINING_FEES;
