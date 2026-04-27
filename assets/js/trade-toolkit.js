(function () {
  "use strict";

  var SOURCE_LIBRARY = {
    auAfcfta: {
      label: "African Union AfCFTA operations",
      href: "https://au.int/en/articles/operational-phase-african-continental-free-trade-area-launched"
    },
    auAfcftaTariffs: {
      label: "African Union tariff liberalisation",
      href: "https://au.int/es/node/42585"
    },
    wcoHs: {
      label: "WCO Harmonized System",
      href: "https://www.wcotradetools.org/en/faq"
    },
    simplyDuty: {
      label: "SimplyDuty landed-cost pattern",
      href: "https://www.simplyduty.com/import-calculator/"
    },
    wtoTfa: {
      label: "WTO Trade Facilitation Agreement",
      href: "https://www.wto.org/tradefacilitation"
    },
    iccIncoterms: {
      label: "ICC Incoterms rules",
      href: "https://iccwbo.org/business-solutions/incoterms-rules/"
    },
    iccUcp: {
      label: "ICC banking rules",
      href: "https://library.iccwbo.org/tfb/tfb-iccrules.htm?AGENT=ICC_THA"
    },
    iccDsi: {
      label: "ICC Digital Standards Initiative",
      href: "https://dsi.iccwbo.org/"
    },
    papss: {
      label: "PAPSS local-currency payments",
      href: "https://papss.com/how-it-works/"
    },
    incodocs: {
      label: "IncoDocs trade-document pattern",
      href: "https://help.incodocs.com/en/articles/2048601-how-to-create-a-proforma-invoice"
    },
    ecowasCet: {
      label: "ECOWAS Common External Tariff",
      href: "https://ecotis.ecowas.int/policy-development/common-external-tariff-cet/"
    },
    eacCet: {
      label: "EAC Common External Tariff",
      href: "https://repository.eac.int/handle/11671/24409"
    },
    sadcCustoms: {
      label: "SADC customs and origin",
      href: "https://www.sadc.int/pillars/customs"
    },
    sadcProtocol: {
      label: "SADC Protocol on Trade",
      href: "https://www.sadc.int/document/protocol-trade-1996-0"
    },
    unComtrade: {
      label: "UN Comtrade trade data",
      href: "https://unstats.un.org/unsd/trade/data/tables.asp"
    },
    worldBankLpi: {
      label: "World Bank Logistics Performance Index",
      href: "https://www.worldbank.org/en/news/press-release/2023/04/21/world-bank-releases-logistics-performance-index-2023"
    },
    fiataBl: {
      label: "FIATA digital bill of lading",
      href: "https://fiata.org/digital-bill-of-lading/"
    },
    dhlWeight: {
      label: "DHL volumetric weight",
      href: "https://dct.dhl.com/help"
    },
    fedexWeight: {
      label: "FedEx dimensional weight",
      href: "https://page.message.fedex.com/weight_calculator/"
    },
    auDataPolicy: {
      label: "AU Data Policy Framework",
      href: "https://aucapps.au.int/en/documents/20220728/au-data-policy-framework"
    },
    malabo: {
      label: "AU Malabo Convention",
      href: "https://africanlii.org/en/akn/aa-au/act/convention/2014/cyber-security-and-personal-data-protection/eng%402014-06-27"
    }
  };

  var RELATED = {
    hs: { label: "HS code lookup", href: "/tools/hs-code-lookup/" },
    afcfta: { label: "AfCFTA tracker", href: "/tools/afcfta-tracker/" },
    landed: { label: "Landed cost", href: "/tools/landed-cost/" },
    shipping: { label: "Shipping estimate", href: "/tools/shipping-estimator/" },
    fx: { label: "FX impact", href: "/tools/fx-import-impact/" },
    incoterms: { label: "Incoterms", href: "/tools/incoterms-calculator/" },
    lc: { label: "LC fees", href: "/tools/lc-calculator/" },
    docs: { label: "Export docs", href: "/tools/export-docs/" },
    coo: { label: "Certificate of origin", href: "/tools/coo-generator/" },
    demurrage: { label: "Demurrage", href: "/tools/demurrage-calculator/" },
    finance: { label: "Finance comparator", href: "/tools/trade-finance-comparator/" },
    commodity: { label: "Commodity tracker", href: "/tools/commodity-tracker/" },
    payments: { label: "B2B payments", href: "/tools/payment-comparator/" },
    ecowas: { label: "ECOWAS levy", href: "/tools/ecowas-levy/" },
    sadc: { label: "SADC origin", href: "/tools/sadc-roo/" },
    eac: { label: "EAC CET", href: "/tools/eac-cet/" },
    proforma: { label: "Proforma invoice", href: "/tools/proforma-invoice/" },
    packing: { label: "Packing list", href: "/tools/packing-list/" },
    bol: { label: "Bill of lading", href: "/tools/bol-generator/" },
    customsTime: { label: "Customs time", href: "/tools/customs-time/" },
    shipWeight: { label: "Shipping weight", href: "/tools/shipping-weight/" },
    data: { label: "Data transfer", href: "/tools/cross-border-data/" }
  };

  var CONFIGS = {
    "/tools/hs-code-lookup": {
      label: "HS Code Lookup",
      stage: "Classify",
      summary: "Use this as the first stop before duty, origin, landed-cost, or compliance work. The goal is a defensible classification path, not a guess from a supplier description.",
      useCases: [
        "You need the six-digit HS family before asking brokers for local tariff lines.",
        "A supplier description is vague and you need to compare plausible headings.",
        "You want to understand how classification changes duty, VAT, permit, or origin treatment."
      ],
      checklist: [
        "Confirm material, function, and end use before selecting a heading.",
        "Check at least two plausible headings when the product is mixed, assembled, or bundled.",
        "Ask for a broker or customs ruling when the shipment value or penalty risk is material."
      ],
      watchouts: [
        "National tariff lines often go beyond the WCO six-digit HS code.",
        "The same product can split by composition, use, power rating, or packaging.",
        "Duty without VAT, levies, and exemptions is not a landed-cost answer."
      ],
      sources: ["wcoHs", "ecowasCet", "eacCet"],
      related: ["landed", "afcfta", "ecowas"]
    },
    "/tools/afcfta-tracker": {
      label: "AfCFTA Tariff Tracker",
      stage: "Preferential access",
      summary: "Turn the tracker into an eligibility screen: tariff phase-down only helps when the route, product, and origin proof all line up.",
      useCases: [
        "You are checking if intra-African trade can use an AfCFTA preference.",
        "You need to separate MFN duty from preferential duty exposure.",
        "You want a short briefing for a buyer, broker, or exporter before quoting."
      ],
      checklist: [
        "Confirm the exporter and importer countries are active for the relevant trade lane.",
        "Check whether the product is normal, sensitive, or excluded in the tariff offer.",
        "Prepare origin evidence before promising a duty-free or reduced-duty quote."
      ],
      watchouts: [
        "A lower tariff does not remove VAT, customs fees, port costs, or permits.",
        "Preference can fail if the certificate of origin is incomplete.",
        "Rules of origin can be harder than the headline tariff rate."
      ],
      sources: ["auAfcfta", "auAfcftaTariffs", "wcoHs"],
      related: ["coo", "sadc", "ecowas"]
    },
    "/tools/landed-cost": {
      label: "Landed Cost Calculator",
      stage: "Cost model",
      summary: "Use landed cost to convert a supplier quote into a warehouse-ready margin decision, with each assumption visible enough for a broker or finance team to challenge.",
      useCases: [
        "You are deciding whether an import margin survives duty, VAT, freight, and clearing.",
        "You need to compare FOB, CFR, CIF, and DDP-style supplier quotes.",
        "You want a local-currency break-even price before paying a deposit."
      ],
      checklist: [
        "Confirm the HS code and duty rate before relying on the result.",
        "Match the Incoterm to who pays freight, insurance, and local handling.",
        "Add a buffer for FX movement, storage, inspection, and agent disbursements."
      ],
      watchouts: [
        "Port storage and demurrage can erase the margin on slow document release.",
        "Broker estimates may exclude national levies or special permits.",
        "A cheap supplier quote can lose once minimum charges and inland logistics are added."
      ],
      sources: ["wcoHs", "wtoTfa", "iccIncoterms"],
      related: ["hs", "shipping", "demurrage"]
    },
    "/tools/shipping-estimator": {
      label: "Shipping Cost Estimator",
      stage: "Freight quote",
      summary: "Use this page to build a quote request that freight forwarders can price cleanly, including the cargo profile, route, mode, and local charges.",
      useCases: [
        "You are choosing between sea, air, road, or mixed transport.",
        "You need a sanity check before accepting a forwarder quote.",
        "You want to compare corridor costs before picking a supplier or port."
      ],
      checklist: [
        "Capture cargo dimensions, weight, stackability, and hazardous status.",
        "Ask whether terminal handling, documentation, and destination charges are included.",
        "Confirm free days, transshipment points, and inland haulage separately."
      ],
      watchouts: [
        "Freight quotes can exclude destination charges that arrive later.",
        "Air freight often bills by chargeable weight, not actual weight.",
        "A nearby port is not always cheaper if congestion or inland haulage is worse."
      ],
      sources: ["wtoTfa", "dhlWeight", "fedexWeight"],
      related: ["shipWeight", "packing", "demurrage"]
    },
    "/tools/fx-import-impact": {
      label: "FX Import Cost Impact",
      stage: "Currency risk",
      summary: "Use this to price the time gap between quote, deposit, balance payment, customs valuation, and resale.",
      useCases: [
        "Your supplier invoices in USD, EUR, CNY, or GBP while you sell locally.",
        "You need to decide whether to hedge, pre-buy currency, or adjust selling price.",
        "You want to explain margin sensitivity to a partner or finance team."
      ],
      checklist: [
        "Separate deposit date, balance date, shipment date, and customs valuation date.",
        "Run best, base, and stress exchange-rate scenarios.",
        "Include bank spread, transfer fees, and any forced official-rate conversion."
      ],
      watchouts: [
        "A small FX move can compound through duty, VAT, and local markup.",
        "Parallel market assumptions can create audit or compliance risk.",
        "Supplier price validity can expire before currency is secured."
      ],
      sources: ["papss", "wtoTfa", "auAfcfta"],
      related: ["payments", "landed", "finance"]
    },
    "/tools/incoterms-calculator": {
      label: "Incoterms 2020 Calculator",
      stage: "Risk split",
      summary: "Use Incoterms to lock down who pays, who arranges, and where risk transfers. Treat the named place as part of the term, not a footnote.",
      useCases: [
        "You are comparing supplier quotes that use different trade terms.",
        "You need to know who buys insurance, books freight, and handles export clearance.",
        "You want to prevent disputes before issuing a proforma invoice or LC."
      ],
      checklist: [
        "Choose the term by transport mode and name the exact place or port.",
        "Check whether the buyer or seller controls export and import clearance.",
        "Align the term with the invoice, LC wording, insurance, and freight booking."
      ],
      watchouts: [
        "FOB is for sea and inland waterway transport, not container pickup at a factory.",
        "CIF and CIP include insurance, but not necessarily the same cover level.",
        "Incoterms do not decide title transfer, payment timing, or customs valuation alone."
      ],
      sources: ["iccIncoterms", "iccDsi", "wtoTfa"],
      related: ["proforma", "landed", "lc"]
    },
    "/tools/lc-calculator": {
      label: "LC Fee Calculator",
      stage: "Bank cost",
      summary: "Use this before opening or accepting a letter of credit so bank fees, document risk, and supplier protection are visible.",
      useCases: [
        "You need to compare sight LC, usance LC, confirmed LC, and advance payment.",
        "You are estimating bank charges before quoting the buyer.",
        "You want to identify document mismatch risk early."
      ],
      checklist: [
        "Confirm whether the credit is subject to UCP 600 and whether confirmation is required.",
        "List every required document exactly as it will appear on invoice, packing list, and transport document.",
        "Price amendment, discrepancy, SWIFT, advising, confirmation, and usance charges."
      ],
      watchouts: [
        "LC cost is often smaller than the cost of a documentary discrepancy.",
        "A cheap unconfirmed LC may still leave country or bank risk with the exporter.",
        "Usance timing changes both cost and working-capital pressure."
      ],
      sources: ["iccUcp", "iccDsi", "wtoTfa"],
      related: ["finance", "proforma", "docs"]
    },
    "/tools/export-docs": {
      label: "Export Documentation Checklist",
      stage: "Document pack",
      summary: "Use this as the control tower for invoice, packing, origin, transport, product, and destination-country paperwork.",
      useCases: [
        "You need a document list before booking freight or accepting an LC.",
        "You are shipping to a regulated destination that needs certificates or permits.",
        "You want every document to tell the same product, origin, quantity, and value story."
      ],
      checklist: [
        "Match buyer name, seller name, HS code, quantities, values, and Incoterm across documents.",
        "Confirm destination product rules, certificates, permits, and inspection needs.",
        "Prepare a document handover deadline before the cargo reaches port."
      ],
      watchouts: [
        "Small mismatches can delay customs, bank payment, or cargo release.",
        "Some documents must be issued before shipment, not after arrival.",
        "Export compliance and buyer import compliance are separate checks."
      ],
      sources: ["wtoTfa", "iccDsi", "auAfcfta"],
      related: ["proforma", "packing", "coo"]
    },
    "/tools/coo-generator": {
      label: "Certificate of Origin Generator",
      stage: "Origin proof",
      summary: "Use this to prepare the origin evidence behind a preferential claim before customs or the buyer asks for it.",
      useCases: [
        "You need to support AfCFTA, ECOWAS, EAC, SADC, or COMESA preference.",
        "You are deciding which origin criterion fits the product.",
        "You want a printable draft before taking it to the competent authority."
      ],
      checklist: [
        "Document wholly obtained, value-added, or tariff-heading-change evidence.",
        "Keep supplier invoices, bill of materials, production records, and local-cost worksheets.",
        "Confirm the issuing authority and certificate format for the trade agreement used."
      ],
      watchouts: [
        "A certificate is only as strong as the evidence behind the origin claim.",
        "Transshipment can break preference if direct transport evidence is weak.",
        "Different regional blocs use different origin criteria and forms."
      ],
      sources: ["auAfcfta", "sadcCustoms", "ecowasCet"],
      related: ["afcfta", "sadc", "docs"]
    },
    "/tools/demurrage-calculator": {
      label: "Port Demurrage Calculator",
      stage: "Delay cost",
      summary: "Use this to make delay visible before the container arrives, especially when documents, bank releases, or inspections are still pending.",
      useCases: [
        "You need to estimate what each extra day at port does to margin.",
        "A shipment is at risk because documents or payment release are late.",
        "You want to compare ports or clearing agents on practical delay exposure."
      ],
      checklist: [
        "Separate shipping-line demurrage from port storage and terminal charges.",
        "Confirm free days, weekends, holidays, and rate tiers in writing.",
        "Track document release, customs entry, inspection, duty payment, and truck booking."
      ],
      watchouts: [
        "Daily charges often jump after the first tier of free or low-rate days.",
        "A single missing original document can trigger several cost categories.",
        "Disputes are easier before the container leaves the terminal."
      ],
      sources: ["wtoTfa", "iccDsi", "fiataBl"],
      related: ["customsTime", "bol", "landed"]
    },
    "/tools/trade-finance-comparator": {
      label: "Trade Finance Cost Comparator",
      stage: "Payment structure",
      summary: "Use this to choose the cheapest payment method that still fits trust, delivery, bank, and country risk.",
      useCases: [
        "You are choosing between LC, CAD, T/T, open account, SBLC, or structured terms.",
        "A buyer wants credit but the exporter wants payment security.",
        "You need a board-ready explanation of why one finance route is worth the cost."
      ],
      checklist: [
        "Score buyer trust, supplier trust, country risk, bank risk, and cargo perishability.",
        "Map who controls documents at each payment milestone.",
        "Price bank fees, FX margin, delay cost, and working-capital cost together."
      ],
      watchouts: [
        "The cheapest method can be the most expensive if it fails.",
        "Open account shifts risk to the exporter and working capital to the seller.",
        "LCs reduce payment risk but increase document discipline requirements."
      ],
      sources: ["iccUcp", "papss", "wtoTfa"],
      related: ["lc", "payments", "docs"]
    },
    "/tools/commodity-tracker": {
      label: "Commodity Trade Tracker",
      stage: "Market scan",
      summary: "Use this to understand trade concentration and direction before choosing a market, supplier, buyer, or corridor.",
      useCases: [
        "You need to know which products dominate a country's import or export basket.",
        "You are testing whether a trade idea fits existing demand and partner flows.",
        "You want a quick risk note on partner concentration or commodity exposure."
      ],
      checklist: [
        "Check the reporting year and whether partner data is mirrored or directly reported.",
        "Compare value with quantity where possible to detect price effects.",
        "Pair commodity demand with tariff, logistics, and payment checks before action."
      ],
      watchouts: [
        "Trade data can lag and may be revised.",
        "A high-value commodity flow does not mean easy SME access.",
        "Partner concentration can create sanctions, FX, or route risk."
      ],
      sources: ["unComtrade", "wcoHs", "auAfcfta"],
      related: ["hs", "shipping", "payments"]
    },
    "/tools/payment-comparator": {
      label: "B2B Payment Fee Comparator",
      stage: "Pay and settle",
      summary: "Use this to compare visible fees, FX spread, settlement speed, availability, and compliance friction before sending a cross-border payment.",
      useCases: [
        "You are paying an African supplier or receiving payment from an African buyer.",
        "You need to compare SWIFT, PAPSS, fintech rails, card, and bank transfer options.",
        "You want to explain settlement speed and FX spread to a buyer."
      ],
      checklist: [
        "Check whether both countries, currencies, and banks are supported.",
        "Compare transfer fee, FX spread, recipient deductions, and settlement time.",
        "Confirm invoice, KYC, purpose-of-payment, and tax documentation needs."
      ],
      watchouts: [
        "A low transfer fee can hide in the FX spread.",
        "Not every corridor supports the same payment rail or transaction size.",
        "Compliance holds can matter more than advertised speed."
      ],
      sources: ["papss", "auAfcfta", "wtoTfa"],
      related: ["fx", "finance", "lc"]
    },
    "/tools/ecowas-levy": {
      label: "ECOWAS Trade Levy Calculator",
      stage: "Regional duty",
      summary: "Use this to separate ECOWAS CET bands, national supplements, and ETLS preference before pricing West Africa trade.",
      useCases: [
        "You are importing into or trading within an ECOWAS member state.",
        "You need to explain how CET, VAT, levies, and ETLS interact.",
        "You want to test whether a product may qualify for duty-free regional movement."
      ],
      checklist: [
        "Confirm the HS code and CET category before calculating duty.",
        "Check national levies, VAT, excise, and special import measures.",
        "For intra-ECOWAS trade, confirm ETLS registration and origin documentation."
      ],
      watchouts: [
        "The CET band is not the full tax bill.",
        "Sensitive products and trade-defense measures can override simple assumptions.",
        "ETLS eligibility depends on origin and paperwork, not just geography."
      ],
      sources: ["ecowasCet", "wcoHs", "wtoTfa"],
      related: ["hs", "coo", "landed"]
    },
    "/tools/sadc-roo": {
      label: "SADC Rules of Origin Checker",
      stage: "Origin test",
      summary: "Use this to test whether a product has enough SADC production, value addition, or tariff-heading change to claim preference.",
      useCases: [
        "You are shipping goods between SADC member states.",
        "You need to decide whether imported inputs break the origin claim.",
        "You want to prepare evidence before applying for a certificate of origin."
      ],
      checklist: [
        "Identify whether the rule is wholly obtained, value-added, specific process, or tariff-heading change.",
        "Calculate non-originating material content using documented costs.",
        "Keep supplier declarations and production records for customs review."
      ],
      watchouts: [
        "Cumulation helps only when input origin is documented.",
        "Product-specific rules can override a general value-added shortcut.",
        "A certificate without supporting records can fail during verification."
      ],
      sources: ["sadcCustoms", "sadcProtocol", "wcoHs"],
      related: ["coo", "afcfta", "bol"]
    },
    "/tools/eac-cet": {
      label: "EAC Common External Tariff",
      stage: "East Africa tariff",
      summary: "Use this to check the EAC tariff band before comparing national measures, exemptions, and duty remission options.",
      useCases: [
        "You are importing into Kenya, Tanzania, Uganda, Rwanda, Burundi, South Sudan, DRC, or Somalia.",
        "You need to classify a product against the EAC four-band CET structure.",
        "You want to identify sensitive items before quoting."
      ],
      checklist: [
        "Confirm the current EAC CET schedule and HS code version.",
        "Check whether the item is sensitive, exempt, remitted, or subject to a stay of application.",
        "Add VAT, railway or infrastructure levies, IDF-style fees, and local port charges separately."
      ],
      watchouts: [
        "The EAC CET is regional, but some country-level measures still differ.",
        "Sensitive items can carry much higher rates than the headline bands.",
        "Duty remission can be useful but is not automatic."
      ],
      sources: ["eacCet", "wcoHs", "wtoTfa"],
      related: ["hs", "landed", "coo"]
    },
    "/tools/proforma-invoice": {
      label: "Proforma Invoice Generator",
      stage: "Offer document",
      summary: "Use this as the commercial offer that feeds import permits, LC opening, insurance, and customs preparation.",
      useCases: [
        "You need a buyer-ready quote for international trade.",
        "A bank, importer, or permit office needs a clean proforma invoice.",
        "You want to prevent mismatch between price, Incoterm, HS code, and shipment terms."
      ],
      checklist: [
        "Include seller, buyer, HS code, origin, Incoterm, named place, validity, and payment terms.",
        "Keep currency, unit price, totals, freight, insurance, and discounts unambiguous.",
        "Match the proforma wording to later LC, invoice, packing list, and bill of lading details."
      ],
      watchouts: [
        "Vague product descriptions can create customs and LC problems later.",
        "A proforma is not usually a tax invoice, but it can still bind expectations.",
        "Changing Incoterms after LC opening can require an amendment."
      ],
      sources: ["iccIncoterms", "iccUcp", "iccDsi"],
      related: ["incoterms", "lc", "packing"]
    },
    "/tools/packing-list": {
      label: "Packing List Generator",
      stage: "Cargo detail",
      summary: "Use this to make carton, pallet, weight, marks, and measurement data consistent across shipping and customs documents.",
      useCases: [
        "You need a packing list that aligns with invoice and transport documents.",
        "You are estimating CBM, volumetric weight, or container utilisation.",
        "You want warehouse, forwarder, and customs teams to see the same cargo data."
      ],
      checklist: [
        "Record net weight, gross weight, dimensions, carton count, marks, and package type.",
        "Ensure totals match the commercial invoice and bill of lading instructions.",
        "Use consistent units and round only after checking carrier requirements."
      ],
      watchouts: [
        "Weight or carton mismatches can delay customs inspection and bank documents.",
        "Volumetric weight can make an air shipment more expensive than expected.",
        "Missing marks and numbers slow warehouse release."
      ],
      sources: ["iccDsi", "dhlWeight", "fedexWeight"],
      related: ["shipWeight", "bol", "proforma"]
    },
    "/tools/bol-generator": {
      label: "Bill of Lading Template",
      stage: "Transport document",
      summary: "Use this as a draft review aid. The official bill of lading must come from the carrier, forwarder, or authorised issuer.",
      useCases: [
        "You want to preview what details the carrier will need.",
        "You need to check consignee, notify party, vessel, marks, packages, and freight terms.",
        "You are comparing original B/L, seawaybill, order B/L, and multimodal document risks."
      ],
      checklist: [
        "Align shipper, consignee, notify party, cargo description, marks, package count, and weight.",
        "Confirm original, telex release, seawaybill, or order document treatment before shipment.",
        "Check freight prepaid or collect wording against the Incoterm and payment arrangement."
      ],
      watchouts: [
        "A draft template is not a negotiable transport document.",
        "Wrong consignee wording can block cargo release or bank payment.",
        "Switch bills and telex releases need careful fraud and title control."
      ],
      sources: ["fiataBl", "iccDsi", "iccIncoterms"],
      related: ["packing", "docs", "demurrage"]
    },
    "/tools/cross-border-data": {
      label: "Cross-Border Data Transfer Checklist",
      stage: "Digital trade compliance",
      summary: "Use this when trade operations move customer, supplier, payment, employee, or platform data across borders.",
      useCases: [
        "You are sending personal data to a foreign processor, cloud vendor, fintech, marketplace, or group company.",
        "A trade workflow includes customer identity, payment, payroll, or logistics data.",
        "You need to document a lawful transfer mechanism before launch."
      ],
      checklist: [
        "Map the exporting country, destination country, data categories, and recipient role.",
        "Choose the transfer mechanism and record why it applies.",
        "Update privacy notices, contracts, vendor due diligence, and security controls."
      ],
      watchouts: [
        "Consent alone is weak for recurring operational transfers.",
        "Data localisation rules can sit outside general data protection laws.",
        "Vendor sub-processors can create hidden onward transfers."
      ],
      sources: ["auDataPolicy", "malabo", "wtoTfa"],
      related: ["payments", "docs", "finance"]
    },
    "/tools/customs-time": {
      label: "Customs Clearance Time Estimator",
      stage: "Release planning",
      summary: "Use this to plan the critical path from ETA to release, not just the average number of days.",
      useCases: [
        "You need to schedule sales, warehouse space, or factory inputs around cargo release.",
        "A shipment has documents, inspection, duty payment, or agency dependencies.",
        "You want to compare the cost of fast clearance against demurrage risk."
      ],
      checklist: [
        "Pre-clear documents before arrival where the country and port allow it.",
        "Track manifest, entry, valuation, inspection, duty payment, release, and truck gate-out separately.",
        "Assign one owner for every missing document or approval."
      ],
      watchouts: [
        "Average clearance time hides risk-channel delays.",
        "Payment release and inspection booking can be bigger blockers than customs entry.",
        "Port storage begins even when the delay was upstream."
      ],
      sources: ["wtoTfa", "wcoHs", "iccDsi"],
      related: ["demurrage", "docs", "landed"]
    },
    "/tools/shipping-weight": {
      label: "Shipping Weight Calculator",
      stage: "Chargeable weight",
      summary: "Use this before booking air, courier, or road freight so package size does not surprise the invoice.",
      useCases: [
        "You need to compare actual weight with volumetric weight.",
        "You are redesigning packaging to reduce chargeable weight.",
        "You want to explain why a light but bulky package costs more."
      ],
      checklist: [
        "Measure the packed carton, not the product alone.",
        "Check the divisor and rounding rule for each carrier and service.",
        "Run a packaging alternative before accepting the freight quote."
      ],
      watchouts: [
        "Carriers can re-measure and adjust the invoice.",
        "Different services use different dimensional divisors.",
        "A small carton-size change can move the chargeable weight tier."
      ],
      sources: ["dhlWeight", "fedexWeight", "wtoTfa"],
      related: ["shipping", "packing", "landed"]
    }
  };

  CONFIGS["/tools/export-docs-trade"] = CONFIGS["/tools/export-docs"];

  var COMPETITOR_NOTES = {
    "/tools/hs-code-lookup": {
      benchmark: "WCO Trade Tools and national tariff portals",
      pattern: "The strongest classification tools make search auditable with alternatives, legal notes, comparison views and saved workspace notes.",
      upgrade: "Use this page as the first evidence step: record likely headings, product facts and the national tariff line that a broker still needs to confirm.",
      moves: [
        "Save the supplier description plus material, function and end use before moving to duty.",
        "Compare at least two plausible headings when a product is assembled, mixed or bundled.",
        "Carry the HS family into AfCFTA, ECOWAS, EAC, SADC and landed-cost tools through the shared context."
      ],
      sources: ["wcoHs"]
    },
    "/tools/afcfta-tracker": {
      benchmark: "AfCFTA e-tariff and rules-of-origin guidance",
      pattern: "Good preference tools separate tariff phase-down, member implementation, product basket and origin proof instead of treating AfCFTA as a blanket discount.",
      upgrade: "Use this tracker as an eligibility screen that creates a broker-ready question list before a buyer quotes preferential duty.",
      moves: [
        "Confirm both corridor countries, the tariff offer line and the product basket.",
        "Pair every preference assumption with a certificate-of-origin evidence step.",
        "Keep MFN, AfCFTA and regional-bloc options visible until customs confirms the claim."
      ],
      sources: ["auAfcfta", "auAfcftaTariffs", "wcoHs"]
    },
    "/tools/landed-cost": {
      benchmark: "SimplyDuty and global landed-cost calculators",
      pattern: "Competitor calculators focus on quick duty and tax totals, but serious operators need assumptions, Incoterm split and local charges exposed.",
      upgrade: "Use landed cost as a margin decision file, not just a tax estimate. Save HS, freight, FX, VAT, levies and demurrage assumptions together.",
      moves: [
        "Attach the Incoterm and named place before comparing supplier quotes.",
        "Run a stress case for FX movement, storage and clearing-agent disbursements.",
        "Download a PDF pack when the result is ready for a finance or broker review."
      ],
      sources: ["simplyDuty", "wcoHs", "iccIncoterms"]
    },
    "/tools/shipping-estimator": {
      benchmark: "Freight marketplace quote forms and carrier quote tools",
      pattern: "Useful freight tools ask for route, mode, dimensions, cargo readiness, local charges and free-day assumptions before a rate is trusted.",
      upgrade: "Turn the estimate into a quote-request brief a forwarder can price cleanly, including chargeable weight and destination-cost checks.",
      moves: [
        "Capture dimensions, actual weight, stackability and hazardous status.",
        "Ask whether terminal handling, documentation, destination fees and inland haulage are included.",
        "Move directly into customs-time and demurrage checks before accepting a cheap route."
      ],
      sources: ["dhlWeight", "fedexWeight", "worldBankLpi"]
    },
    "/tools/fx-import-impact": {
      benchmark: "Bank treasury sheets and payment-provider pricing pages",
      pattern: "Strong FX tools separate quote date, deposit, balance payment, customs valuation and resale date because each can use a different rate.",
      upgrade: "Use this as the currency-risk layer of the trade pack so pricing survives supplier validity windows and bank spreads.",
      moves: [
        "Run best, base and stress rates before promising a resale price.",
        "Add payment fees and FX spread from the payment comparator.",
        "Flag official-rate, market-rate and compliance assumptions separately."
      ],
      sources: ["papss", "wtoTfa"]
    },
    "/tools/incoterms-calculator": {
      benchmark: "ICC Incoterms 2020 training and comparison tools",
      pattern: "Good Incoterms tools force the named place, transport mode, risk transfer, cost split and insurance level into one decision.",
      upgrade: "Use the calculator to align the invoice, LC wording, freight booking and landed-cost model before documents are issued.",
      moves: [
        "Write the exact named place next to the selected term.",
        "Check CIF and CIP insurance expectations before accepting supplier cover.",
        "Send the selected term into proforma, LC and landed-cost steps."
      ],
      sources: ["iccIncoterms", "iccDsi"]
    },
    "/tools/lc-calculator": {
      benchmark: "ICC UCP 600 and bank LC fee schedules",
      pattern: "Bank tools price the instrument, but the expensive failure is often a document discrepancy or unpriced confirmation risk.",
      upgrade: "Use this page to combine fees, UCP wording, document list and amendment risk in one bank-facing brief.",
      moves: [
        "List every document exactly as it will appear in the proforma, packing list and transport draft.",
        "Compare confirmation, usance, amendment, discrepancy and SWIFT charges separately.",
        "Save the LC fee snapshot into the finance workflow before choosing the payment rail."
      ],
      sources: ["iccUcp", "incodocs"]
    },
    "/tools/export-docs": {
      benchmark: "IncoDocs and broker document checklists",
      pattern: "Document platforms work best when invoice, packing, origin, transport and permit data are cross-checked before cargo moves.",
      upgrade: "Use this checklist as the consistency control for the export pack, then save a PDF handoff for buyer, broker or bank.",
      moves: [
        "Check names, addresses, HS code, quantities, weights, values and Incoterms across every document.",
        "Add permit, inspection, phytosanitary or standards documents by destination.",
        "Send mismatches back to proforma, packing list or certificate-of-origin tools before shipment."
      ],
      sources: ["incodocs", "iccDsi", "wtoTfa"]
    },
    "/tools/export-docs-trade": {
      benchmark: "IncoDocs and broker document checklists",
      pattern: "Document platforms work best when invoice, packing, origin, transport and permit data are cross-checked before cargo moves.",
      upgrade: "Use this checklist as the consistency control for the export pack, then save a PDF handoff for buyer, broker or bank.",
      moves: [
        "Check names, addresses, HS code, quantities, weights, values and Incoterms across every document.",
        "Add permit, inspection, phytosanitary or standards documents by destination.",
        "Send mismatches back to proforma, packing list or certificate-of-origin tools before shipment."
      ],
      sources: ["incodocs", "iccDsi", "wtoTfa"]
    },
    "/tools/coo-generator": {
      benchmark: "AfCFTA, ECOWAS, EAC and SADC origin workflows",
      pattern: "Origin tools are useful only when they preserve the evidence trail behind wholly obtained, value-added, processing or tariff-shift claims.",
      upgrade: "Use the generator as an origin dossier builder, not a standalone form. Keep the product rule and evidence next to the draft certificate.",
      moves: [
        "Attach supplier declarations, costed bill of materials or production records when needed.",
        "Confirm the competent issuing authority and certificate format for the route.",
        "Pair the origin snapshot with the relevant regional preference tool."
      ],
      sources: ["auAfcftaTariffs", "ecowasCet", "eacCet", "sadcCustoms"]
    },
    "/tools/demurrage-calculator": {
      benchmark: "Carrier and terminal demurrage calculators",
      pattern: "The best demurrage tools separate free days, storage, detention, customs holds and document-release delays.",
      upgrade: "Use this as the operations-risk timer for the shipment, with clear blockers and escalation dates before port costs snowball.",
      moves: [
        "Record vessel ETA, free-day clock, document cutoff and payment release date.",
        "Separate carrier demurrage, port storage and inland detention assumptions.",
        "Save the risk snapshot into the dashboard when the release deadline matters."
      ],
      sources: ["worldBankLpi", "wtoTfa"]
    },
    "/tools/trade-finance-comparator": {
      benchmark: "Bank trade-finance matrices and SME finance portals",
      pattern: "Useful comparators weigh risk, working capital, supplier trust, country risk and document control, not just headline fees.",
      upgrade: "Use this to choose the finance route after Incoterms, LC cost and payment-rail assumptions are already visible.",
      moves: [
        "Score supplier trust, buyer trust, country risk and cash-cycle pressure separately.",
        "Compare LC, CAD, T/T, open account, SBLC and structured options on both cost and control.",
        "Save the decision into a trade pack before sending terms to the counterparty."
      ],
      sources: ["iccUcp", "papss"]
    },
    "/tools/commodity-tracker": {
      benchmark: "UN Comtrade, OEC-style dashboards and commodity-monitoring tools",
      pattern: "Strong trade-data tools expose reporter, partner, commodity code, trade flow and data lag so market signals are not mistaken for live prices.",
      upgrade: "Use this as the market-scan step before a quote, then carry the chosen commodity and route into HS, freight, payment and finance tools.",
      moves: [
        "Check partner concentration and import-export balance before choosing a buyer or supplier market.",
        "Record the HS family behind the commodity signal.",
        "Treat trade data as delayed evidence, then verify current price and licensing separately."
      ],
      sources: ["unComtrade", "wcoHs"]
    },
    "/tools/payment-comparator": {
      benchmark: "PAPSS, bank transfer portals and fintech payment pages",
      pattern: "Good payment tools compare fee, FX spread, corridor coverage, settlement speed, compliance and beneficiary currency together.",
      upgrade: "Use this page as the payment decision step after finance risk is clear, then store the preferred rail in the trade pack.",
      moves: [
        "Check whether the route can settle in local currency through PAPSS or needs hard-currency rails.",
        "Separate visible fee, FX spread, receiving-bank charge and compliance delay.",
        "Add data-transfer checks when customer, supplier or payment data crosses borders."
      ],
      sources: ["papss", "auDataPolicy"]
    },
    "/tools/ecowas-levy": {
      benchmark: "ECOWAS ECOTIS and national customs tariff portals",
      pattern: "Regional tariff tools need CET band, supplementary measures, VAT, waivers, ETLS eligibility and national levies visible at the same time.",
      upgrade: "Use this as the West Africa levy screen, then confirm national tariff-line treatment before quoting duty.",
      moves: [
        "Check the CET band and the national tariff line separately.",
        "Flag ETLS evidence before applying duty-free regional treatment.",
        "Add VAT, statistical fees, inspection fees and trade-defence measures to landed cost."
      ],
      sources: ["ecowasCet", "wcoHs"]
    },
    "/tools/sadc-roo": {
      benchmark: "SADC rules-of-origin manuals and customs guidance",
      pattern: "Good origin checkers show the rule type and evidence requirement, because product-specific rules control the real preference claim.",
      upgrade: "Use this as a SADC evidence planner and not a final customs ruling.",
      moves: [
        "Identify whether the rule is wholly obtained, value-added, process-specific or tariff-heading change.",
        "Prepare production records before requesting a certificate of origin.",
        "Move the result into the COO and export-docs steps for consistency."
      ],
      sources: ["sadcCustoms", "sadcProtocol"]
    },
    "/tools/eac-cet": {
      benchmark: "EAC CET documents and duty-remission notices",
      pattern: "Strong CET tools separate the base tariff band from sensitive items, stays of application, remission schemes and country measures.",
      upgrade: "Use this as the East Africa tariff screen, then verify the current gazette or customs notice before acting.",
      moves: [
        "Confirm whether the product is ordinary, sensitive, specific-duty or remission-eligible.",
        "Compare Kenya, Tanzania, Uganda, Rwanda, Burundi, DRC and Somalia assumptions where relevant.",
        "Carry the rate into landed cost with VAT, railway levy or national fees added separately."
      ],
      sources: ["eacCet", "wcoHs"]
    },
    "/tools/proforma-invoice": {
      benchmark: "IncoDocs proforma and export-document platforms",
      pattern: "Useful proforma tools capture seller, buyer, product detail, Incoterm, payment terms, lead time, bank details and signatures.",
      upgrade: "Use the proforma as the commercial anchor for LC, permits, packing, B/L and origin documents.",
      moves: [
        "Include HS code, Incoterm named place, currency, validity date and payment terms.",
        "Match product descriptions and quantities to packing and certificate-of-origin drafts.",
        "Download the trade pack PDF when the buyer or bank needs a clean pre-shipment record."
      ],
      sources: ["incodocs", "iccIncoterms"]
    },
    "/tools/packing-list": {
      benchmark: "Freight-forwarder packing templates and dimensional-weight tools",
      pattern: "Good packing tools reconcile carton count, marks, gross weight, net weight, CBM and chargeable weight before freight is booked.",
      upgrade: "Use the packing list to prevent invoice, B/L and freight-quote mismatches.",
      moves: [
        "Check carton dimensions against chargeable-weight and container-utilisation assumptions.",
        "Match marks, package count and weights to the proforma and B/L draft.",
        "Save the packing snapshot before asking a forwarder for the final rate."
      ],
      sources: ["dhlWeight", "fedexWeight", "incodocs"]
    },
    "/tools/bol-generator": {
      benchmark: "FIATA digital bill of lading and shipping-line draft workflows",
      pattern: "Modern B/L tools treat the document as a title-control and release-risk artifact, not only a printable template.",
      upgrade: "Use this generator for draft education and consistency checks, then verify final terms with the carrier or forwarder.",
      moves: [
        "Confirm shipper, consignee, notify party, release type and negotiability before issuing instructions.",
        "Match package count, weight, marks and goods description to the packing list.",
        "Treat drafts as review documents until the carrier or forwarder issues the final transport document."
      ],
      sources: ["fiataBl", "iccDsi"]
    },
    "/tools/cross-border-data": {
      benchmark: "AU Data Policy Framework and privacy transfer checklists",
      pattern: "Data tools are strongest when they connect legal basis, data type, processor, destination, safeguards and vendor access.",
      upgrade: "Use this as the digital-trade compliance step for customer, supplier, logistics and payment data moving across borders.",
      moves: [
        "List every system that touches buyer, supplier, shipment, payment or identity data.",
        "Check whether the destination country, processor contract and safeguards are documented.",
        "Save the data-transfer note into the finance and payment workflow."
      ],
      sources: ["auDataPolicy", "malabo", "papss"]
    },
    "/tools/customs-time": {
      benchmark: "World Bank LPI and customs single-window process maps",
      pattern: "Useful clearance tools show the critical path from manifest and entry to inspection, payment, release and gate-out.",
      upgrade: "Use this as a release-plan screen that identifies the next blocker before storage and demurrage costs grow.",
      moves: [
        "Separate document readiness, broker filing, inspection, duty payment, release order and truck availability.",
        "Use World Bank-style delay thinking: port and border bottlenecks often dominate total lead time.",
        "Send high-risk dates into the dashboard so the shipment stays visible."
      ],
      sources: ["worldBankLpi", "wtoTfa"]
    },
    "/tools/shipping-weight": {
      benchmark: "DHL and FedEx dimensional-weight calculators",
      pattern: "Carrier tools charge the greater of actual and dimensional weight and may remeasure packages after handover.",
      upgrade: "Use this page before freight and packing steps so carton design, chargeable weight and quote assumptions line up.",
      moves: [
        "Compare actual weight, volumetric weight and carrier divisor before quoting.",
        "Round the way the carrier rounds, then add a remeasurement buffer.",
        "Carry the chargeable weight into the shipping estimator and packing list."
      ],
      sources: ["dhlWeight", "fedexWeight"]
    }
  };

  var WORKFLOWS = [
    {
      id: "import-quote",
      label: "Import quote to landed cost",
      summary: "Move from product classification to freight, duty, release risk, demurrage and FX sensitivity before quoting the buyer.",
      steps: [
        { key: "hs", task: "Classify the product" },
        { key: "incoterms", task: "Set seller and buyer responsibilities" },
        { key: "shipWeight", task: "Check chargeable weight" },
        { key: "shipping", task: "Estimate freight and local charges" },
        { key: "landed", task: "Model duty, VAT and margin" },
        { key: "customsTime", task: "Plan clearance timing" },
        { key: "demurrage", task: "Stress-test delay cost" },
        { key: "fx", task: "Price currency movement" }
      ]
    },
    {
      id: "regional-preference",
      label: "Regional preference check",
      summary: "Screen whether an African corridor can use a preferential tariff, then prepare origin evidence before promising savings.",
      steps: [
        { key: "hs", task: "Identify the tariff line family" },
        { key: "afcfta", task: "Screen AfCFTA eligibility" },
        { keys: ["ecowas", "sadc", "eac"], task: "Pick the relevant regional rulebook" },
        { key: "coo", task: "Prepare origin evidence" },
        { key: "docs", task: "Package export documents" }
      ]
    },
    {
      id: "export-pack",
      label: "Export document pack",
      summary: "Build a consistent invoice, packing list, transport document and origin file before the cargo leaves.",
      steps: [
        { key: "proforma", task: "Draft the commercial terms" },
        { key: "packing", task: "Match carton, weight and marks" },
        { key: "bol", task: "Prepare transport document details" },
        { key: "docs", task: "Check the full document set" },
        { key: "coo", task: "Attach origin proof where needed" }
      ]
    },
    {
      id: "finance-payment",
      label: "Finance and payment route",
      summary: "Compare trade terms, bank instruments, B2B payment rails, data obligations and FX exposure as one decision.",
      steps: [
        { key: "incoterms", task: "Align risk transfer with payment term" },
        { key: "lc", task: "Price LC document risk" },
        { key: "finance", task: "Compare finance structures" },
        { key: "payments", task: "Choose the payment rail" },
        { key: "data", task: "Check cross-border data handling" },
        { key: "fx", task: "Stress-test FX exposure" }
      ]
    },
    {
      id: "market-scan",
      label: "Market scan to quote",
      summary: "Use commodity, HS, logistics and payment checks to decide whether a trade idea deserves a real quote.",
      steps: [
        { key: "commodity", task: "Scan product and partner signals" },
        { key: "hs", task: "Classify the product" },
        { key: "shipping", task: "Estimate route cost" },
        { key: "payments", task: "Check payment friction" },
        { key: "finance", task: "Compare working-capital options" }
      ]
    },
    {
      id: "operations-risk",
      label: "Operations risk run",
      summary: "Pressure-test packaging, freight, clearance, demurrage and data compliance before an operational handoff.",
      steps: [
        { key: "shipWeight", task: "Validate chargeable weight" },
        { key: "shipping", task: "Review freight assumptions" },
        { key: "customsTime", task: "Map the release path" },
        { key: "demurrage", task: "Quantify delay exposure" },
        { key: "data", task: "Confirm data transfer controls" }
      ]
    }
  ];

  var DATA_STATUS = {
    default: {
      label: "Reference-backed planning helper",
      reviewed: "2026-04-27",
      text: "This desk links the tool to official or institutional references, but final rates, permits, documents and filings still need broker, bank, carrier or authority confirmation before action.",
      sources: ["wcoHs", "wtoTfa"]
    },
    "/tools/afcfta-tracker": {
      label: "AfCFTA data guardrail",
      reviewed: "2026-04-27",
      text: "Tariff logic follows the AU public 90 percent general, 7 percent sensitive and 3 percent excluded framing. Corridor status, concession lines and rules of origin must be verified with the AfCFTA Secretariat, national customs or the official tariff book before quoting preference.",
      sources: ["auAfcfta", "auAfcftaTariffs", "wcoHs"]
    },
    "/tools/ecowas-levy": {
      label: "ECOWAS CET guardrail",
      reviewed: "2026-04-27",
      text: "The ECOWAS CET reference lane uses the official 0, 5, 10, 20 and 35 percent band structure. National supplements, VAT, waivers, ETLS eligibility and trade defence measures can change the final payable amount.",
      sources: ["ecowasCet", "wcoHs"]
    },
    "/tools/eac-cet": {
      label: "EAC CET guardrail",
      reviewed: "2026-04-27",
      text: "The EAC base CET uses the 2022 four-band structure of 0, 10, 25 and 35 percent. Sensitive items, stays of application, remission schemes, specific duties and country levies need current gazette or customs confirmation before filing.",
      sources: ["eacCet", "wcoHs"]
    },
    "/tools/sadc-roo": {
      label: "SADC origin guardrail",
      reviewed: "2026-04-27",
      text: "Use the SADC checker as a planning screen only. Wholly obtained, substantial processing and tariff-heading-change tests are product-specific, and the certificate of origin evidence file matters as much as the headline test.",
      sources: ["sadcCustoms", "sadcProtocol", "wcoHs"]
    },
    "/tools/payment-comparator": {
      label: "Payment rail guardrail",
      reviewed: "2026-04-27",
      text: "PAPSS, SWIFT, bank and fintech routes vary by live participant coverage, compliance checks, settlement currency, fees and recall rules. Confirm the exact rail with the provider before sending funds.",
      sources: ["papss", "iccDsi"]
    },
    "/tools/cross-border-data": {
      label: "Digital trade guardrail",
      reviewed: "2026-04-27",
      text: "The checklist is based on continental data-policy and cyber-law references, but national data protection, localisation and sector rules still control the final transfer mechanism.",
      sources: ["auDataPolicy", "malabo"]
    },
    "/tools/shipping-weight": {
      label: "Carrier pricing guardrail",
      reviewed: "2026-04-27",
      text: "Chargeable-weight logic follows carrier practice, but divisors, rounding, minimum charges and remeasurement rights differ by carrier, lane and service.",
      sources: ["dhlWeight", "fedexWeight"]
    },
    "/tools/bol-generator": {
      label: "Document guardrail",
      reviewed: "2026-04-27",
      text: "Treat generated bill of lading wording as a draft data checklist. Carrier, forwarder, bank and title-control requirements decide the final transport document.",
      sources: ["fiataBl", "iccDsi"]
    }
  };

  var TRADE_PACK_KEY = "afrotools:trade-pack";
  var TRADE_CONTEXT_KEY = "afrotools:trade-desk-context";
  var ACTIVE_WORKFLOW_KEY = "afrotools:trade-active-workflow";
  var TRADE_DASHBOARD_KEY = "afrotools:trade-dashboard-items";
  var TRADE_LEAD_KEY = "afrotools:trade-lead";
  var LEGACY_LEAD_EMAIL_KEY = "afrotools_lead_email";
  var EMAIL_GATE_KEY = "afrotools-email-gate";
  var JSPDF_SRC = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
  var DEFAULT_WORKFLOW_BY_PATH = {
    "/tools/proforma-invoice": "export-pack",
    "/tools/packing-list": "export-pack",
    "/tools/bol-generator": "export-pack",
    "/tools/export-docs": "export-pack",
    "/tools/export-docs-trade": "export-pack",
    "/tools/coo-generator": "regional-preference"
  };

  function normalisePath(path) {
    return (path || "")
      .replace(/\/index\.html$/i, "")
      .replace(/\.html$/i, "")
      .replace(/\/$/, "");
  }

  function createEl(tag, className, text) {
    var el = document.createElement(tag);
    if (className) el.className = className;
    if (text != null) el.textContent = text;
    return el;
  }

  function list(items, className) {
    var ul = createEl("ul", className || "trade-desk__list");
    (items || []).forEach(function (item) {
      ul.appendChild(createEl("li", "", item));
    });
    return ul;
  }

  function sourceList(keys) {
    return (keys || []).map(function (key) {
      return SOURCE_LIBRARY[key];
    }).filter(Boolean);
  }

  function relatedList(keys) {
    return (keys || []).map(function (key) {
      return RELATED[key];
    }).filter(Boolean);
  }

  function stepKeys(step) {
    return step && step.keys ? step.keys : [step && step.key].filter(Boolean);
  }

  function relatedForKey(key) {
    return RELATED[key] || null;
  }

  function pathForKey(key) {
    var item = relatedForKey(key);
    return item ? normalisePath(item.href) : "";
  }

  function stepMatchesPath(step, path) {
    return stepKeys(step).some(function (key) {
      return pathForKey(key) === path;
    });
  }

  function stepLinks(step) {
    return stepKeys(step).map(function (key) {
      return relatedForKey(key);
    }).filter(Boolean);
  }

  function stepLabel(step) {
    if (step && step.task) return step.task;
    return stepLinks(step).map(function (item) { return item.label; }).join(" / ");
  }

  function workflowsForPath(path) {
    return WORKFLOWS.filter(function (workflow) {
      return workflow.steps.some(function (step) {
        return stepMatchesPath(step, path);
      });
    });
  }

  function activeWorkflowForPath(path) {
    var options = workflowsForPath(path);
    if (!options.length) return null;
    var saved = safeRead(ACTIVE_WORKFLOW_KEY, "");
    var active = options.find(function (workflow) { return workflow.id === saved; });
    if (active) return active;
    var preferred = DEFAULT_WORKFLOW_BY_PATH[path];
    if (preferred) {
      var preferredWorkflow = options.find(function (workflow) { return workflow.id === preferred; });
      if (preferredWorkflow) return preferredWorkflow;
    }
    return options[0];
  }

  function workflowState(path) {
    var workflow = activeWorkflowForPath(path);
    if (!workflow) return null;
    var currentIndex = workflow.steps.findIndex(function (step) {
      return stepMatchesPath(step, path);
    });
    return {
      workflow: workflow,
      currentIndex: currentIndex,
      currentStep: currentIndex >= 0 ? workflow.steps[currentIndex] : null,
      previousStep: currentIndex > 0 ? workflow.steps[currentIndex - 1] : null,
      nextStep: currentIndex >= 0 && currentIndex < workflow.steps.length - 1 ? workflow.steps[currentIndex + 1] : null
    };
  }

  function firstStepHref(step) {
    var link = stepLinks(step)[0];
    return link ? link.href : "#";
  }

  function absoluteHref(href) {
    try {
      return new URL(href, window.location.origin).href;
    } catch (err) {
      return href || "";
    }
  }

  function statusForPath(path) {
    return DATA_STATUS[path] || DATA_STATUS.default;
  }

  function competitorForPath(path) {
    return COMPETITOR_NOTES[path] || null;
  }

  function safeRead(key, fallback) {
    try {
      var value = localStorage.getItem(key);
      return value == null ? fallback : value;
    } catch (err) {
      return fallback;
    }
  }

  function safeWrite(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch (err) {}
  }

  function safeReadJson(key, fallback) {
    try {
      return JSON.parse(localStorage.getItem(key) || "null") || fallback;
    } catch (err) {
      return fallback;
    }
  }

  function getFieldLabel(field) {
    if (!field) return "Field";
    var id = field.id;
    var escapedId = id && window.CSS && CSS.escape ? CSS.escape(id) : String(id || "").replace(/"/g, '\\"');
    var label = id ? document.querySelector('label[for="' + escapedId + '"]') : null;
    if (label) return label.textContent.trim();
    var parentLabel = field.closest("label");
    if (parentLabel) return parentLabel.textContent.trim();
    var fieldWrap = field.closest(".field, .f-grid, .form-grid, .form-grid-3, .card-body");
    if (fieldWrap) {
      var nearby = fieldWrap.querySelector("label, .f-label");
      if (nearby) return nearby.textContent.trim();
    }
    return field.name || field.id || field.getAttribute("aria-label") || "Field";
  }

  function collectInputs() {
    var fields = Array.prototype.slice.call(document.querySelectorAll("input, select, textarea"));
    return fields.filter(function (field) {
      if (field.type === "hidden" || field.type === "button" || field.type === "submit") return false;
      if (field.closest(".trade-desk")) return false;
      if (field.disabled) return false;
      var value = field.type === "checkbox" ? (field.checked ? "yes" : "no") : field.value;
      return value != null && String(value).trim() !== "";
    }).slice(0, 16).map(function (field) {
      var value = field.type === "checkbox" ? (field.checked ? "yes" : "no") : field.value;
      return getFieldLabel(field).replace(/\s+/g, " ") + ": " + String(value).trim();
    });
  }

  function collectTradeContext() {
    return Array.prototype.slice.call(document.querySelectorAll("[data-trade-context]")).map(function (field) {
      var label = field.getAttribute("data-label") || getFieldLabel(field);
      var value = field.value;
      return {
        label: label,
        value: value == null ? "" : String(value).trim()
      };
    }).filter(function (item) {
      return item.value !== "";
    });
  }

  function getReadinessText() {
    var el = document.querySelector("[data-trade-readiness-text]");
    return el ? el.textContent.trim() : "";
  }

  function buildBrief(config, path, note) {
    var sources = sourceList(config.sources);
    var competitor = competitorForPath(path || normalisePath(window.location.pathname));
    var inputs = collectInputs();
    var context = collectTradeContext();
    var readiness = getReadinessText();
    var state = workflowState(path || normalisePath(window.location.pathname));
    var next = state && state.nextStep ? stepLinks(state.nextStep)[0] : null;
    var lines = [
      "AfroTools trade brief",
      "Tool: " + config.label,
      "Stage: " + config.stage,
      "URL: " + window.location.href,
      "Prepared: " + new Date().toISOString().slice(0, 10),
      readiness ? "Desk readiness: " + readiness : "",
      state ? "Workflow: " + state.workflow.label : "",
      state && state.currentStep ? "Current workflow step: " + stepLabel(state.currentStep) : "",
      next ? "Next workflow step: " + stepLabel(state.nextStep) + " - " + absoluteHref(next.href) : "",
      "",
      "Purpose:",
      config.summary,
      "",
      "Shipment or deal context:"
    ].filter(function (line) {
      return line !== "";
    });

    if (context.length) {
      context.forEach(function (item) { lines.push("- " + item.label + ": " + item.value); });
    } else {
      lines.push("- No desk context entered yet.");
    }

    lines.push("",
      "Current inputs:"
    );

    if (inputs.length) {
      inputs.forEach(function (line) { lines.push("- " + line); });
    } else {
      lines.push("- No visible input values entered yet.");
    }

    lines.push("", "Checks before acting:");
    config.checklist.forEach(function (item) { lines.push("- " + item); });

    lines.push("", "Risk signals:");
    config.watchouts.forEach(function (item) { lines.push("- " + item); });

    if (competitor) {
      lines.push("", "Competitor-informed upgrade:");
      lines.push("- Benchmark: " + competitor.benchmark);
      lines.push("- Pattern: " + competitor.pattern);
      lines.push("- AfroTools improvement: " + competitor.upgrade);
      (competitor.moves || []).forEach(function (move) { lines.push("- " + move); });
    }

    if (note) {
      lines.push("", "Private deal note:", note);
    }

    lines.push("", "Reference lane:");
    sources.forEach(function (source) {
      lines.push("- " + source.label + ": " + source.href);
    });

    return lines.join("\n");
  }

  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text);
    }
    return new Promise(function (resolve, reject) {
      try {
        var textarea = document.createElement("textarea");
        textarea.value = text;
        textarea.setAttribute("readonly", "readonly");
        textarea.style.position = "fixed";
        textarea.style.left = "-9999px";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        textarea.remove();
        resolve();
      } catch (err) {
        reject(err);
      }
    });
  }

  function loadTradePack() {
    var pack = safeReadJson(TRADE_PACK_KEY, []);
    return Array.isArray(pack) ? pack.filter(Boolean) : [];
  }

  function saveTradePack(pack) {
    safeWrite(TRADE_PACK_KEY, JSON.stringify(pack.slice(0, 24)));
  }

  function checkedItems() {
    return Array.prototype.slice.call(document.querySelectorAll(".trade-desk__check")).filter(function (label) {
      var input = label.querySelector("input");
      return input && input.checked;
    }).map(function (label) {
      return label.textContent.trim().replace(/\s+/g, " ");
    });
  }

  function formatPackDate(value) {
    try {
      return new Date(value).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
    } catch (err) {
      return String(value || "").slice(0, 10);
    }
  }

  function snapshotLabel(snapshot) {
    var context = snapshot.context || [];
    var product = context.find(function (item) { return item.label === "Product or HS"; });
    var route = context.filter(function (item) {
      return item.label === "Origin" || item.label === "Destination";
    }).map(function (item) { return item.value; }).filter(Boolean).join(" to ");
    if (product && product.value && route) return product.value + " - " + route;
    if (product && product.value) return product.value;
    if (route) return route;
    return snapshot.stage || "Trade snapshot";
  }

  function buildPackSnapshot(config, path, note) {
    var state = workflowState(path);
    var status = statusForPath(path);
    var competitor = competitorForPath(path);
    return {
      id: path + ":" + Date.now(),
      tool: config.label,
      stage: config.stage,
      path: path,
      url: window.location.href,
      createdAt: new Date().toISOString(),
      workflow: state ? {
        id: state.workflow.id,
        label: state.workflow.label,
        currentStep: state.currentStep ? stepLabel(state.currentStep) : "",
        nextStep: state.nextStep ? stepLabel(state.nextStep) : ""
      } : null,
      dataStatus: status ? status.label + " reviewed " + status.reviewed : "",
      readiness: getReadinessText(),
      context: collectTradeContext(),
      inputs: collectInputs(),
      completedChecks: checkedItems(),
      competitor: competitor ? {
        benchmark: competitor.benchmark,
        upgrade: competitor.upgrade,
        moves: competitor.moves || []
      } : null,
      note: note || ""
    };
  }

  function buildPackText(pack) {
    var lines = [
      "AfroTools trade pack",
      "Snapshots: " + pack.length,
      "Prepared: " + new Date().toISOString().slice(0, 10),
      ""
    ];
    pack.slice().reverse().forEach(function (item, idx) {
      lines.push((idx + 1) + ". " + item.tool + " - " + item.stage);
      lines.push("   Saved: " + formatPackDate(item.createdAt));
      lines.push("   URL: " + item.url);
      lines.push("   Context: " + snapshotLabel(item));
      if (item.workflow && item.workflow.label) {
        lines.push("   Workflow: " + item.workflow.label);
        if (item.workflow.currentStep) lines.push("   Current step: " + item.workflow.currentStep);
        if (item.workflow.nextStep) lines.push("   Next step: " + item.workflow.nextStep);
      }
      if (item.dataStatus) lines.push("   Data status: " + item.dataStatus);
      if (item.readiness) lines.push("   Readiness: " + item.readiness);
      if (item.context && item.context.length) {
        lines.push("   Shipment context:");
        item.context.forEach(function (field) {
          lines.push("   - " + field.label + ": " + field.value);
        });
      }
      if (item.inputs && item.inputs.length) {
        lines.push("   Tool inputs:");
        item.inputs.slice(0, 10).forEach(function (input) {
          lines.push("   - " + input);
        });
      }
      if (item.completedChecks && item.completedChecks.length) {
        lines.push("   Completed checks:");
        item.completedChecks.forEach(function (check) {
          lines.push("   - " + check);
        });
      }
      if (item.competitor && item.competitor.benchmark) {
        lines.push("   Benchmark upgrade: " + item.competitor.benchmark);
        lines.push("   AfroTools improvement: " + item.competitor.upgrade);
        if (item.competitor.moves && item.competitor.moves.length) {
          item.competitor.moves.slice(0, 3).forEach(function (move) {
            lines.push("   - " + move);
          });
        }
      }
      if (item.note) lines.push("   Note: " + item.note);
      lines.push("");
    });
    return lines.join("\n");
  }

  function currentPackForAction(config, path, note) {
    var pack = loadTradePack();
    var current = buildPackSnapshot(config, path, note || "");
    var alreadyCurrent = pack.some(function (item) {
      return item && item.path === current.path && item.readiness === current.readiness && snapshotLabel(item) === snapshotLabel(current);
    });
    if (!alreadyCurrent) {
      pack = [current].concat(pack);
    }
    return pack.slice(0, 24);
  }

  function safeFilePart(value) {
    return String(value || "trade-pack")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 48) || "trade-pack";
  }

  function downloadTextFile(filename, text) {
    var blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }

  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      var existing = document.querySelector('script[src="' + src + '"]');
      if (existing) {
        if (existing.getAttribute("data-loaded") === "true") {
          resolve();
          return;
        }
        existing.addEventListener("load", resolve, { once: true });
        existing.addEventListener("error", reject, { once: true });
        return;
      }
      var script = document.createElement("script");
      script.src = src;
      script.async = true;
      script.onload = function () {
        script.setAttribute("data-loaded", "true");
        resolve();
      };
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  function ensureJsPdf() {
    if (window.jspdf && window.jspdf.jsPDF) return Promise.resolve(window.jspdf.jsPDF);
    return loadScript(JSPDF_SRC).then(function () {
      if (window.jspdf && window.jspdf.jsPDF) return window.jspdf.jsPDF;
      throw new Error("jsPDF unavailable");
    });
  }

  function addPdfLines(doc, lines, startY) {
    var y = startY || 20;
    lines.forEach(function (line) {
      var chunks = doc.splitTextToSize(String(line || " "), 180);
      chunks.forEach(function (chunk) {
        if (y > 282) {
          doc.addPage();
          y = 18;
        }
        doc.text(chunk, 15, y);
        y += 6;
      });
    });
    return y;
  }

  function downloadTradePackPdf(pack, lead) {
    var first = pack[0] || {};
    var filename = "afrotools-" + safeFilePart(snapshotLabel(first)) + "-" + new Date().toISOString().slice(0, 10);
    var text = buildPackText(pack);
    return ensureJsPdf().then(function (JsPDF) {
      var doc = new JsPDF({ unit: "mm", format: "a4" });
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.text("AfroTools Trade Pack", 15, 18);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text("Prepared " + new Date().toISOString().slice(0, 10), 15, 25);
      if (lead && lead.email) doc.text("Contact: " + lead.email, 15, 31);
      doc.setFontSize(9);
      addPdfLines(doc, text.split("\n"), lead && lead.email ? 42 : 36);
      doc.save(filename + ".pdf");
      return { type: "pdf" };
    }).catch(function () {
      downloadTextFile(filename + ".txt", text);
      return { type: "text" };
    });
  }

  function isValidEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || "").trim());
  }

  function readKnownLead() {
    var lead = safeReadJson(TRADE_LEAD_KEY, null);
    if (lead && lead.email) return lead;
    var email = safeRead(LEGACY_LEAD_EMAIL_KEY, "");
    if (email) return { email: email };
    var gate = safeReadJson(EMAIL_GATE_KEY, null);
    if (gate && gate.email) return { email: gate.email, name: gate.name || "", company: gate.company || "" };
    return null;
  }

  function rememberLead(lead) {
    if (!lead || !lead.email) return;
    safeWrite(TRADE_LEAD_KEY, JSON.stringify(lead));
    safeWrite(LEGACY_LEAD_EMAIL_KEY, lead.email);
  }

  function captureTradeLead(config, path, lead) {
    if (!lead || !lead.email || typeof fetch !== "function") return;
    var payload = {
      email: lead.email,
      company: lead.company || "",
      role: lead.role || "",
      source: "trade-pack-pdf",
      tool: config.label,
      toolSlug: path.split("/").filter(Boolean).pop() || "trade",
      pageUrl: window.location.href,
      referrerUrl: document.referrer || "",
      context: collectTradeContext()
    };
    fetch("/api/capture-lead", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    }).catch(function () {});
  }

  function signedInLead() {
    try {
      if (window.AfroAuth && window.AfroAuth.getUser) {
        var user = window.AfroAuth.getUser();
        if (user && user.email) return { email: user.email, name: user.name || "" };
      }
    } catch (err) {}
    return null;
  }

  function showLeadGate(config, path, onReady) {
    var overlay = createEl("div", "trade-gate");
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("aria-labelledby", "trade-gate-title");

    var dialog = createEl("div", "trade-gate__dialog");
    overlay.appendChild(dialog);

    var close = createEl("button", "trade-gate__close", "Close");
    close.type = "button";
    dialog.appendChild(close);

    dialog.appendChild(createEl("p", "trade-gate__eyebrow", "Trade pack PDF"));
    var title = createEl("h3", "trade-gate__title", "Send the broker-ready pack to your inbox");
    title.id = "trade-gate-title";
    dialog.appendChild(title);
    dialog.appendChild(createEl("p", "trade-gate__copy", "The core tool stays free. Add your email to unlock the PDF handoff, and we will remember it for future trade exports on this browser."));

    var form = createEl("form", "trade-gate__form");
    var emailLabel = createEl("label", "trade-gate__field");
    emailLabel.appendChild(createEl("span", "", "Work email"));
    var email = document.createElement("input");
    email.type = "email";
    email.required = true;
    email.placeholder = "you@company.com";
    emailLabel.appendChild(email);
    form.appendChild(emailLabel);

    var companyLabel = createEl("label", "trade-gate__field");
    companyLabel.appendChild(createEl("span", "", "Company or role, optional"));
    var company = document.createElement("input");
    company.type = "text";
    company.placeholder = "Importer, exporter, broker, finance team";
    companyLabel.appendChild(company);
    form.appendChild(companyLabel);

    var status = createEl("p", "trade-gate__status", "No spam. Use the pack for broker, bank or team handoff.");
    var submit = createEl("button", "trade-desk__copy", "Download PDF");
    submit.type = "submit";
    form.appendChild(submit);
    form.appendChild(status);
    dialog.appendChild(form);

    function removeGate() {
      document.removeEventListener("keydown", onKey);
      overlay.remove();
    }

    function onKey(event) {
      if (event.key === "Escape") removeGate();
    }

    close.addEventListener("click", removeGate);
    overlay.addEventListener("click", function (event) {
      if (event.target === overlay) removeGate();
    });
    document.addEventListener("keydown", onKey);
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var lead = {
        email: email.value.trim(),
        company: company.value.trim(),
        role: config.stage,
        capturedAt: new Date().toISOString(),
        source: path
      };
      if (!isValidEmail(lead.email)) {
        status.textContent = "Enter a valid email to unlock the PDF.";
        email.focus();
        return;
      }
      rememberLead(lead);
      captureTradeLead(config, path, lead);
      removeGate();
      onReady(lead);
    });

    document.body.appendChild(overlay);
    setTimeout(function () { email.focus(); }, 30);
  }

  function withTradeLeadGate(config, path, onReady) {
    var lead = signedInLead() || readKnownLead();
    if (lead && lead.email) {
      rememberLead(lead);
      captureTradeLead(config, path, lead);
      onReady(lead);
      return;
    }
    showLeadGate(config, path, onReady);
  }

  function gateExistingPrintButtons(config, path) {
    Array.prototype.slice.call(document.querySelectorAll("button, a")).forEach(function (button) {
      if (button.closest(".trade-desk")) return;
      if (button.getAttribute("data-trade-pdf-gated") === "true") return;
      var inline = button.getAttribute("onclick") || "";
      var label = (button.textContent || "").replace(/\s+/g, " ").trim();
      if (!/window\.print|print\(\)|download pdf|save as pdf|print or save pdf/i.test(inline + " " + label)) return;
      button.setAttribute("data-trade-pdf-gated", "true");
      button.removeAttribute("onclick");
      button.onclick = null;
      button.addEventListener("click", function (event) {
        event.preventDefault();
        event.stopPropagation();
        withTradeLeadGate(config, path, function () {
          window.print();
        });
      }, true);
    });
  }

  function loadDashboardItems() {
    var items = safeReadJson(TRADE_DASHBOARD_KEY, []);
    return Array.isArray(items) ? items.filter(Boolean) : [];
  }

  function saveDashboardItems(items) {
    safeWrite(TRADE_DASHBOARD_KEY, JSON.stringify(items.slice(0, 18)));
    try {
      window.dispatchEvent(new CustomEvent("afro-trade-pack-saved", { detail: { count: items.length } }));
      window.dispatchEvent(new CustomEvent("afro-workspace-change", { detail: { source: "trade-pack" } }));
    } catch (err) {}
  }

  function ensureWorkspaceSync() {
    if (window.AfroWorkspace) return Promise.resolve(window.AfroWorkspace);
    return loadScript("/assets/js/lib/workspace-sync.js").then(function () {
      return window.AfroWorkspace || null;
    }).catch(function () {
      return null;
    });
  }

  function dashboardTitleFromPack(pack) {
    var first = pack[0] || {};
    return "Trade pack: " + snapshotLabel(first);
  }

  function dashboardSummaryFromPack(pack) {
    var first = pack[0] || {};
    var workflow = first.workflow && first.workflow.label ? first.workflow.label : "Trade workflow";
    return workflow + " with " + pack.length + " snapshot" + (pack.length === 1 ? "" : "s") + ".";
  }

  function savePackToDashboard(config, path, note) {
    var pack = currentPackForAction(config, path, note || "");
    var now = new Date().toISOString();
    var item = {
      id: "trade-pack:" + Date.now(),
      type: "trade-pack",
      title: dashboardTitleFromPack(pack),
      summary: dashboardSummaryFromPack(pack),
      href: "/trade/",
      sourceHref: window.location.href,
      tool: config.label,
      workflowLabel: pack[0] && pack[0].workflow ? pack[0].workflow.label : "",
      snapshotCount: pack.length,
      createdAt: now,
      updatedAt: now,
      payload: {
        snapshots: pack,
        context: collectTradeContext(),
        sourceTool: config.label,
        sourcePath: path
      }
    };
    var items = loadDashboardItems().filter(function (saved) {
      return saved && saved.title !== item.title;
    });
    items.unshift(item);
    saveDashboardItems(items);

    return ensureWorkspaceSync().then(function (api) {
      if (!api || !api.upsert || !api.isSignedIn || !api.isSignedIn()) {
        return { local: true, synced: false, reason: "signin" };
      }
      return api.upsert({
        itemType: "trade-pack",
        itemKey: item.id,
        toolSlug: "trade",
        title: item.title,
        summary: item.summary,
        href: item.href,
        payload: item.payload,
        meta: {
          workflowLabel: item.workflowLabel,
          snapshotCount: item.snapshotCount,
          sourceHref: item.sourceHref
        }
      }).then(function () {
        return { local: true, synced: true };
      }).catch(function () {
        return { local: true, synced: false, reason: "sync" };
      });
    });
  }

  function createCompetitivePanel(config, path) {
    var note = competitorForPath(path);
    if (!note) return null;
    var panel = createEl("div", "trade-desk__competitive");
    var copy = createEl("div");
    copy.appendChild(createEl("h3", "", "Competitor-informed upgrade"));
    copy.appendChild(createEl("p", "trade-desk__competitive-label", "Benchmark: " + note.benchmark));
    copy.appendChild(createEl("p", "", note.pattern));
    copy.appendChild(createEl("p", "trade-desk__competitive-upgrade", note.upgrade));
    panel.appendChild(copy);

    var moves = createEl("ul", "trade-desk__competitive-list");
    (note.moves || []).forEach(function (move) {
      var item = createEl("li", "", move);
      moves.appendChild(item);
    });
    panel.appendChild(moves);

    var refs = createEl("div", "trade-desk__source-row trade-desk__competitive-sources");
    sourceList(note.sources || config.sources).forEach(function (source) {
      var a = createEl("a", "trade-desk__source-link", source.label);
      a.href = source.href;
      a.target = "_blank";
      a.rel = "noopener";
      refs.appendChild(a);
    });
    panel.appendChild(refs);
    return panel;
  }

  function createWorkflowPanel(path) {
    var options = workflowsForPath(path);
    if (!options.length) return null;
    var panel = createEl("div", "trade-desk__workflow");

    function render() {
      var state = workflowState(path);
      if (!state) return;
      var workflow = state.workflow;
      panel.innerHTML = "";

      var head = createEl("div", "trade-desk__workflow-head");
      var copy = createEl("div");
      copy.appendChild(createEl("h3", "", "Workflow path"));
      copy.appendChild(createEl("p", "", workflow.summary));
      head.appendChild(copy);

      if (options.length > 1) {
        var switcher = createEl("div", "trade-desk__workflow-switch");
        options.forEach(function (option) {
          var button = createEl("button", option.id === workflow.id ? "is-active" : "", option.label);
          button.type = "button";
          button.addEventListener("click", function () {
            safeWrite(ACTIVE_WORKFLOW_KEY, option.id);
            render();
          });
          switcher.appendChild(button);
        });
        head.appendChild(switcher);
      }

      panel.appendChild(head);

      var steps = createEl("ol", "trade-desk__workflow-steps");
      workflow.steps.forEach(function (step, idx) {
        var classes = "trade-desk__workflow-step";
        if (idx < state.currentIndex) classes += " is-earlier";
        if (idx === state.currentIndex) classes += " is-current";
        if (idx === state.currentIndex + 1) classes += " is-next";

        var row = createEl("li", classes);
        row.appendChild(createEl("span", "trade-desk__workflow-index", String(idx + 1)));

        var body = createEl("div", "trade-desk__workflow-body");
        var title = createEl("div", "trade-desk__workflow-title", stepLabel(step));
        body.appendChild(title);

        var links = createEl("div", "trade-desk__workflow-links");
        stepLinks(step).forEach(function (link) {
          var a = createEl("a", normalisePath(link.href) === path ? "is-current" : "", link.label);
          a.href = link.href;
          links.appendChild(a);
        });
        body.appendChild(links);

        var stateText = idx < state.currentIndex ? "Earlier in path" : (idx === state.currentIndex ? "Current tool" : (idx === state.currentIndex + 1 ? "Recommended next" : "Later"));
        body.appendChild(createEl("p", "trade-desk__workflow-state", stateText));
        row.appendChild(body);
        steps.appendChild(row);
      });
      panel.appendChild(steps);

      var actions = createEl("div", "trade-desk__workflow-actions");
      if (state.previousStep) {
        var previous = createEl("a", "trade-desk__copy trade-desk__copy--secondary", "Back: " + stepLabel(state.previousStep));
        previous.href = firstStepHref(state.previousStep);
        actions.appendChild(previous);
      }
      if (state.nextStep) {
        var next = createEl("a", "trade-desk__copy", "Continue: " + stepLabel(state.nextStep));
        next.href = firstStepHref(state.nextStep);
        actions.appendChild(next);
      } else {
        actions.appendChild(createEl("span", "trade-desk__workflow-complete", "End of this workflow. Save or copy the trade pack for handoff."));
      }
      panel.appendChild(actions);
    }

    render();
    return panel;
  }

  function createDataStatusPanel(config, path) {
    var status = statusForPath(path);
    var panel = createEl("div", "trade-desk__data-status");
    var copy = createEl("div");
    copy.appendChild(createEl("h3", "", "Data and logic status"));
    copy.appendChild(createEl("p", "trade-desk__data-label", status.label + " - source review " + status.reviewed));
    copy.appendChild(createEl("p", "", status.text));
    panel.appendChild(copy);

    var links = createEl("div", "trade-desk__source-row");
    sourceList(status.sources || config.sources).forEach(function (source) {
      var a = createEl("a", "trade-desk__source-link", source.label);
      a.href = source.href;
      a.target = "_blank";
      a.rel = "noopener";
      links.appendChild(a);
    });
    panel.appendChild(links);
    return panel;
  }

  function createTradePack(config, path, noteField) {
    var packPanel = createEl("div", "trade-desk__pack");
    var packHead = createEl("div", "trade-desk__pack-head");
    var copy = createEl("div");
    copy.appendChild(createEl("h3", "", "Trade pack"));
    copy.appendChild(createEl("p", "", "Save useful snapshots from different tools into one local shipment or deal pack."));
    packHead.appendChild(copy);

    var actions = createEl("div", "trade-desk__pack-actions");
    var saveButton = createEl("button", "trade-desk__copy", "Save snapshot");
    saveButton.type = "button";
    var copyPackButton = createEl("button", "trade-desk__copy trade-desk__copy--secondary", "Copy pack");
    copyPackButton.type = "button";
    var pdfButton = createEl("button", "trade-desk__copy trade-desk__copy--secondary", "Download PDF");
    pdfButton.type = "button";
    var dashboardButton = createEl("button", "trade-desk__copy trade-desk__copy--secondary", "Save to dashboard");
    dashboardButton.type = "button";
    actions.appendChild(saveButton);
    actions.appendChild(copyPackButton);
    actions.appendChild(pdfButton);
    actions.appendChild(dashboardButton);
    packHead.appendChild(actions);
    packPanel.appendChild(packHead);

    var status = createEl("p", "trade-desk__pack-status", "");
    var listWrap = createEl("div", "trade-desk__pack-list");
    packPanel.appendChild(status);
    packPanel.appendChild(listWrap);

    function renderPack() {
      var pack = loadTradePack();
      listWrap.innerHTML = "";
      if (!pack.length) {
        status.textContent = "No snapshots yet. Save this page after entering your route, product or quote details.";
        listWrap.appendChild(createEl("div", "trade-desk__pack-empty", "Use this for a broker brief, supplier comparison, customs follow-up or team handoff."));
        return;
      }
      status.textContent = pack.length + " saved snapshot" + (pack.length === 1 ? "" : "s") + " in this browser.";
      pack.slice(0, 6).forEach(function (item) {
        var row = createEl("article", "trade-desk__pack-item");
        var details = createEl("div", "trade-desk__pack-details");
        details.appendChild(createEl("h4", "", item.tool));
        details.appendChild(createEl("p", "", item.stage + " - " + formatPackDate(item.createdAt)));
        details.appendChild(createEl("p", "trade-desk__pack-label", snapshotLabel(item)));
        row.appendChild(details);

        var rowActions = createEl("div", "trade-desk__pack-item-actions");
        var open = createEl("a", "", "Open");
        open.href = item.url || item.path || "#";
        var remove = createEl("button", "", "Remove");
        remove.type = "button";
        remove.addEventListener("click", function () {
          saveTradePack(loadTradePack().filter(function (saved) { return saved.id !== item.id; }));
          renderPack();
        });
        rowActions.appendChild(open);
        rowActions.appendChild(remove);
        row.appendChild(rowActions);
        listWrap.appendChild(row);
      });
    }

    saveButton.addEventListener("click", function () {
      var pack = loadTradePack();
      pack.unshift(buildPackSnapshot(config, path, noteField.value.trim()));
      saveTradePack(pack);
      renderPack();
      status.textContent = "Snapshot saved to your local trade pack.";
    });

    copyPackButton.addEventListener("click", function () {
      var pack = loadTradePack();
      if (!pack.length) {
        status.textContent = "Save at least one snapshot before copying a pack.";
        return;
      }
      copyText(buildPackText(pack)).then(function () {
        status.textContent = "Trade pack copied.";
      }).catch(function () {
        status.textContent = "Copy failed. Try again after focusing the page.";
      });
    });

    pdfButton.addEventListener("click", function () {
      withTradeLeadGate(config, path, function (lead) {
        var pack = currentPackForAction(config, path, noteField.value.trim());
        status.textContent = "Preparing trade pack PDF...";
        downloadTradePackPdf(pack, lead).then(function (result) {
          status.textContent = result.type === "pdf" ? "Trade pack PDF downloaded." : "PDF library was unavailable, so a text trade pack was downloaded.";
        });
      });
    });

    dashboardButton.addEventListener("click", function () {
      status.textContent = "Saving trade pack to your dashboard...";
      savePackToDashboard(config, path, noteField.value.trim()).then(function (result) {
        if (result.synced) {
          status.textContent = "Trade pack saved locally and synced to your account workspace.";
        } else if (result.reason === "signin") {
          status.textContent = "Trade pack saved locally. Sign in to sync it across devices.";
        } else {
          status.textContent = "Trade pack saved locally. Cloud sync can be retried from the dashboard.";
        }
      });
    });

    renderPack();
    return packPanel;
  }

  function mountTradeDesk(config, path) {
    if (!config || document.querySelector(".trade-desk")) return;

    var noteKey = "afrotools:trade-desk-note:" + path;
    var checksKey = "afrotools:trade-desk-checks:" + path;
    var legacyContextKey = "afrotools:trade-desk-context:" + path;
    var checked = {};
    safeReadJson(checksKey, []).forEach(function (idx) { checked[idx] = true; });
    var context = Object.assign({}, safeReadJson(legacyContextKey, {}), safeReadJson(TRADE_CONTEXT_KEY, {}));

    var shell = createEl("section", "trade-desk-shell");
    shell.setAttribute("aria-labelledby", "trade-desk-title");

    var desk = createEl("div", "trade-desk");
    shell.appendChild(desk);

    var header = createEl("div", "trade-desk__header");
    var headCopy = createEl("div");
    headCopy.appendChild(createEl("p", "trade-desk__eyebrow", "Operator upgrade"));
    var title = createEl("h2", "trade-desk__title", "Trade Action Desk");
    title.id = "trade-desk-title";
    headCopy.appendChild(title);
    headCopy.appendChild(createEl("p", "trade-desk__summary", config.summary));
    header.appendChild(headCopy);

    var meta = createEl("div", "trade-desk__meta");
    meta.appendChild(createEl("span", "trade-desk__pill", config.label));
    meta.appendChild(createEl("span", "trade-desk__pill", config.stage));
    meta.appendChild(createEl("span", "trade-desk__pill", "Private note"));
    var readyPill = createEl("span", "trade-desk__pill trade-desk__pill--ready", "0 checks");
    header.appendChild(meta);
    meta.appendChild(readyPill);
    desk.appendChild(header);

    var readiness = createEl("div", "trade-desk__readiness");
    var readinessCopy = createEl("div");
    readinessCopy.appendChild(createEl("h3", "", "Readiness"));
    var readinessText = createEl("p", "", "0 of " + config.checklist.length + " checks complete");
    readinessText.setAttribute("data-trade-readiness-text", "true");
    readinessCopy.appendChild(readinessText);
    readiness.appendChild(readinessCopy);
    var meter = createEl("div", "trade-desk__meter");
    var meterFill = createEl("span", "trade-desk__meter-fill");
    meter.appendChild(meterFill);
    readiness.appendChild(meter);
    desk.appendChild(readiness);

    var grid = createEl("div", "trade-desk__grid");
    var usePanel = createEl("div", "trade-desk__panel");
    usePanel.appendChild(createEl("h3", "", "Use this when"));
    usePanel.appendChild(list(config.useCases));
    grid.appendChild(usePanel);

    var checkPanel = createEl("div", "trade-desk__panel");
    checkPanel.appendChild(createEl("h3", "", "Before acting"));
    var checksWrap = createEl("div", "trade-desk__checks");
    function updateReadiness() {
      var boxes = Array.prototype.slice.call(checksWrap.querySelectorAll("input"));
      var complete = boxes.filter(function (box) { return box.checked; }).length;
      var total = boxes.length || 1;
      var percent = Math.round((complete / total) * 100);
      var status = complete === 0 ? "Not started" : (complete === total ? "Ready for expert review" : "In progress");
      meterFill.style.width = percent + "%";
      readinessText.textContent = complete + " of " + boxes.length + " checks complete - " + status;
      readyPill.textContent = percent + "% ready";
    }
    config.checklist.forEach(function (item, idx) {
      var label = createEl("label", "trade-desk__check");
      var input = document.createElement("input");
      input.type = "checkbox";
      input.checked = Boolean(checked[idx]);
      input.addEventListener("change", function () {
        var selected = Array.prototype.slice.call(checksWrap.querySelectorAll("input"))
          .map(function (checkbox, checkboxIndex) { return checkbox.checked ? checkboxIndex : null; })
          .filter(function (value) { return value !== null; });
        try {
          localStorage.setItem(checksKey, JSON.stringify(selected));
        } catch (err) {}
        updateReadiness();
      });
      label.appendChild(input);
      label.appendChild(createEl("span", "", item));
      checksWrap.appendChild(label);
    });
    updateReadiness();
    checkPanel.appendChild(checksWrap);
    grid.appendChild(checkPanel);

    var riskPanel = createEl("div", "trade-desk__panel");
    riskPanel.appendChild(createEl("h3", "", "Risk signals"));
    riskPanel.appendChild(list(config.watchouts));
    grid.appendChild(riskPanel);

    var relatedPanel = createEl("div", "trade-desk__panel");
    relatedPanel.appendChild(createEl("h3", "", "Next tools"));
    var relatedWrap = createEl("div", "trade-desk__related");
    relatedList(config.related).forEach(function (item) {
      var a = createEl("a", "", item.label);
      a.href = item.href;
      relatedWrap.appendChild(a);
    });
    relatedPanel.appendChild(relatedWrap);
    grid.appendChild(relatedPanel);

    var workflowPanel = createWorkflowPanel(path);
    if (workflowPanel) desk.appendChild(workflowPanel);

    var competitivePanel = createCompetitivePanel(config, path);
    if (competitivePanel) desk.appendChild(competitivePanel);

    desk.appendChild(grid);

    var contextPanel = createEl("div", "trade-desk__context");
    contextPanel.appendChild(createEl("h3", "", "Shared shipment context"));
    var contextGrid = createEl("div", "trade-desk__context-grid");
    var contextFields = [
      { key: "mode", label: "Flow", type: "select", options: ["", "Import quote", "Regional preference", "Export document pack", "Finance and payment", "Market scan", "Operations risk", "Import", "Export", "Intra-Africa", "Trade finance", "Logistics", "Compliance"] },
      { key: "origin", label: "Origin", type: "text", placeholder: "Country, port or supplier" },
      { key: "destination", label: "Destination", type: "text", placeholder: "Country, port or buyer" },
      { key: "product", label: "Product or HS", type: "text", placeholder: "Product, chapter or HS code" },
      { key: "value", label: "Value", type: "text", placeholder: "Currency and amount" },
      { key: "deadline", label: "Deadline", type: "text", placeholder: "Quote, ETA, LC, release date" }
    ];
    function saveContext() {
      var values = {};
      Array.prototype.slice.call(contextGrid.querySelectorAll("[data-trade-context]")).forEach(function (field) {
        values[field.getAttribute("data-key")] = field.value;
      });
      safeWrite(TRADE_CONTEXT_KEY, JSON.stringify(values));
      safeWrite(legacyContextKey, JSON.stringify(values));
    }
    contextFields.forEach(function (fieldConfig) {
      var fieldWrap = createEl("label", "trade-desk__field");
      fieldWrap.appendChild(createEl("span", "", fieldConfig.label));
      var field;
      if (fieldConfig.type === "select") {
        field = document.createElement("select");
        fieldConfig.options.forEach(function (option) {
          var opt = document.createElement("option");
          opt.value = option;
          opt.textContent = option || "Choose";
          field.appendChild(opt);
        });
      } else {
        field = document.createElement("input");
        field.type = fieldConfig.type;
        field.placeholder = fieldConfig.placeholder || "";
      }
      field.value = context[fieldConfig.key] || "";
      field.setAttribute("data-trade-context", "true");
      field.setAttribute("data-key", fieldConfig.key);
      field.setAttribute("data-label", fieldConfig.label);
      field.addEventListener("input", saveContext);
      field.addEventListener("change", saveContext);
      fieldWrap.appendChild(field);
      contextGrid.appendChild(fieldWrap);
    });
    contextPanel.appendChild(contextGrid);
    desk.appendChild(contextPanel);
    desk.appendChild(createDataStatusPanel(config, path));

    var footer = createEl("div", "trade-desk__footer");
    var sourcePanel = createEl("div", "trade-desk__sources");
    sourcePanel.appendChild(createEl("h3", "", "Reference lane"));
    var sourceWrap = createEl("div", "trade-desk__source-row");
    sourceList(config.sources).forEach(function (source) {
      var a = createEl("a", "trade-desk__source-link", source.label);
      a.href = source.href;
      a.target = "_blank";
      a.rel = "noopener";
      sourceWrap.appendChild(a);
    });
    sourcePanel.appendChild(sourceWrap);
    footer.appendChild(sourcePanel);

    var briefPanel = createEl("div", "trade-desk__brief");
    briefPanel.appendChild(createEl("h3", "", "Brief and note"));
    var note = createEl("textarea", "trade-desk__note");
    note.placeholder = "Add a private shipment, buyer, supplier, or quote note. It stays in this browser.";
    note.value = safeRead(noteKey, "");
    note.addEventListener("input", function () {
      safeWrite(noteKey, note.value);
    });
    briefPanel.appendChild(note);

    var copyRow = createEl("div", "trade-desk__copy-row");
    var copyButton = createEl("button", "trade-desk__copy", "Copy trade brief");
    copyButton.type = "button";
    var pdfBriefButton = createEl("button", "trade-desk__copy trade-desk__copy--secondary", "PDF brief");
    pdfBriefButton.type = "button";
    var status = createEl("span", "trade-desk__copy-status", "Includes current page inputs.");
    copyButton.addEventListener("click", function () {
      copyText(buildBrief(config, path, note.value.trim())).then(function () {
        status.textContent = "Brief copied.";
        setTimeout(function () { status.textContent = "Includes current page inputs."; }, 2400);
      }).catch(function () {
        status.textContent = "Copy failed. Select the note and try again.";
      });
    });
    pdfBriefButton.addEventListener("click", function () {
      withTradeLeadGate(config, path, function (lead) {
        status.textContent = "Preparing PDF brief...";
        downloadTradePackPdf(currentPackForAction(config, path, note.value.trim()).slice(0, 1), lead).then(function (result) {
          status.textContent = result.type === "pdf" ? "PDF brief downloaded." : "PDF library was unavailable, so a text brief was downloaded.";
        });
      });
    });
    copyRow.appendChild(copyButton);
    copyRow.appendChild(pdfBriefButton);
    copyRow.appendChild(status);
    briefPanel.appendChild(copyRow);
    footer.appendChild(briefPanel);
    desk.appendChild(footer);
    desk.appendChild(createTradePack(config, path, note));
    gateExistingPrintButtons(config, path);

    var hero = document.querySelector(".t-hero, .hs-hero, .tool-hero, .leg-tool-hero, .cat-hero, .hero, header");
    if (hero && hero.parentNode) {
      hero.parentNode.insertBefore(shell, hero.nextSibling);
      return;
    }

    var footerNode = document.querySelector("afro-footer");
    if (footerNode && footerNode.parentNode) {
      footerNode.parentNode.insertBefore(shell, footerNode);
      return;
    }

    document.body.appendChild(shell);
  }

  function init() {
    var path = normalisePath(window.location.pathname);
    var config = CONFIGS[path];
    if (!config) return;
    mountTradeDesk(config, path);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
