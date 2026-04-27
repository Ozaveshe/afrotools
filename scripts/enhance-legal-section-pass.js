const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const REVIEW_DATE = '28 April 2026';
const COMPETITOR_REVIEW_DATE = '28 April 2026';

const sourceBank = {
  cac: ['Corporate Affairs Commission', 'https://www.cac.gov.ng/business-names/'],
  cama: ['Companies and Allied Matters Act 2020', 'https://www.cac.gov.ng/wp-content/uploads/2020/12/CAMA-NOTE-BOOK-FULL-VERSION.pdf'],
  brs: ['Kenya Business Registration Service', 'https://brs.go.ke/companies-registry/'],
  brsPortal: ['BRS eCitizen portal', 'https://brsv2.ecitizen.go.ke/'],
  cipc: ['CIPC company records and returns', 'https://www.cipc.co.za/?page_id=15683'],
  cipcReturns: ['CIPC annual returns filing', 'https://annualreturns.cipc.co.za/Default.aspx'],
  rdb: ['Rwanda business registration', 'https://org.rdb.rw/business-registration/'],
  aripo: ['ARIPO trademarks', 'https://www.aripo.org/ip-services/trademarks'],
  oapi: ['OAPI trademarks', 'https://oapi.int/en/protect-the-pi/brand/'],
  wipoMadrid: ['WIPO Madrid System', 'https://www.wipo.int/madrid/en/members/index.html'],
  ndpc: ['Nigeria Data Protection Commission', 'https://www.ndpc.gov.ng/ndp-act-2023/'],
  ndpcHome: ['NDPC services', 'https://www.ndpc.gov.ng/'],
  odpcBreach: ['Kenya ODPC breach reporting', 'https://www.odpc.go.ke/report-a-data-breach/'],
  odpcFaq: ['Kenya ODPC FAQs', 'https://www.odpc.go.ke/faqs/'],
  inforeg: ['South Africa Information Regulator', 'https://inforegulator.org.za/'],
  popiaAct: ['POPIA Act text', 'https://www.justice.gov.za/legislation/acts/2013-004.pdf'],
  dpia: ['DPIA guidance', 'https://www.dataprotection.ie/en/dpc-guidance/guide-data-protection-impact-assessments'],
  sarsEstate: ['SARS estate duty', 'https://www.sars.gov.za/types-of-tax/estate-duty/'],
  sarsTaxes: ['SARS other taxes', 'https://www.sars.gov.za/tax-rates/other-taxes/'],
  zaMaintenance: ['South Africa maintenance courts', 'https://www.justice.gov.za/vg/mnt.html'],
  nlas: ['Kenya National Legal Aid Service', 'https://www.nlas.go.ke/legal-aid'],
  nlasFaq: ['NLAS legal aid FAQs', 'https://www.nlas.go.ke/faqs'],
  tinJtb: ['Nigeria TIN service', 'https://tin.jtb.gov.ng/'],
  kra: ['KRA iTax', 'https://itax.kra.go.ke/'],
  sars: ['SARS', 'https://www.sars.gov.za/'],
  brsFees: ['BRS company registry fee schedule', 'https://brs.go.ke/fee-schedule-companies-registry/'],
  cipcFees: ['CIPC company forms and fees', 'https://www.cipc.co.za/?page_id=3804'],
  natlex: ['ILO NATLEX labour-law database', 'https://natlex.ilo.org/?p_lang=en'],
  labourZa: ['South Africa employment law', 'https://www.labour.gov.za/amended-basic-conditions-of-employment-act'],
  kenyaEmployment: ['Kenya Employment Act 2007', 'https://www.labour.go.ke/sites/default/files/law/The_Employment_Act_2007.pdf'],
  iloWages: ['ILOSTAT wages and working time', 'https://ilostat.ilo.org/methods/concepts-and-definitions/description-wages-and-working-time-statistics/'],
  govZaDeeds: ['South Africa deeds registry information', 'https://www.gov.za/services/services-residents/place-live/get-deeds-registry-information'],
  ghanaLands: ['Ghana Lands Commission title registration', 'https://www.lc.gov.gh/services/registration-title/'],
  ardhisasa: ['Kenya Ardhisasa land portal', 'https://ardhisasa.lands.go.ke/'],
  fmbnNhf: ['Federal Mortgage Bank of Nigeria NHF', 'https://www.fmbn.gov.ng/National%20Housing%20Fund/nhf.php'],
  fmbnProducts: ['FMBN products and services', 'https://www.fmbn.gov.ng/Products%20%26%20Services/products.php'],
  ghanaNhf: ['Ghana National Mortgage Scheme', 'https://nhf.gov.gh/national-mortgage-scheme-nms'],
  govZaVisa: ['South African Government visa information', 'https://www.gov.za/services/temporary-residence/visa'],
  nisVisa: ['Nigeria Immigration Service visas', 'https://immigration.gov.ng/nigerian-visa/'],
  gisVisa: ['Ghana Immigration Service visas', 'https://gis.gov.gh/visas/'],
  kenyaEvisa: ['Kenya electronic visa information', 'https://ebusiness.go.ke/about-evisa.html'],
};

const competitorMatrix = {
  company: {
    label: 'LegalZoom, Firstbase, Stripe Atlas and registry portals',
    patterns: [
      'Guided formation flows collect facts once, then reuse them for filings, annual reminders, tax setup and registered-agent style tasks.',
      'The strongest products turn one filing into an operating calendar with renewal dates, evidence storage and next-step prompts.',
      'They make official portal verification visible so users can tell a government fee from an agent or bundled service fee.',
    ],
  },
  privacy: {
    label: 'Termly, OneTrust and enterprise consent platforms',
    patterns: [
      'Mature privacy tools scan or map real processing activity, then connect policies, cookie choices, DSARs, consent logs and regulator evidence.',
      'They preserve an audit trail instead of leaving users with a static policy that drifts away from the product.',
      'They route high-risk processing into DPIA, breach and processor-contract workflows before launch or vendor onboarding.',
    ],
  },
  documents: {
    label: 'Rocket Lawyer, Wonder.Legal, LawDepot, PandaDoc and Docusign CLM',
    patterns: [
      'Document tools use guided questionnaires, clause libraries, approval notes, e-signing or print-ready exports rather than plain text templates only.',
      'Contract lifecycle tools keep a single source of truth for parties, evidence, risk flags, approval status and renewal or action dates.',
      'Good template products make lawyer review moments explicit when the facts are risky or jurisdiction-specific.',
    ],
  },
  employment: {
    label: 'Deel, Oyster and global HR compliance platforms',
    patterns: [
      'Employment compliance platforms start with worker classification and country-specific minimums before generating contracts or HR records.',
      'They manage contracts, invoices, leave, payroll inputs and compliance reminders in one dashboard.',
      'The best flows keep misclassification and statutory-minimum risks visible instead of burying them in generic template language.',
    ],
  },
  property: {
    label: 'Rentometer, AirDNA, Zillow Rental Manager and BuildZoom',
    patterns: [
      'Property tools improve trust by showing comparable evidence, market assumptions, inspection or permit data and a dated report trail.',
      'Rental platforms connect screening, lease, payments, deposit evidence and renewal steps instead of stopping at a calculator result.',
      'Investment tools separate gross numbers from operating cost, vacancy, tax, permit and title risk so the user can defend the decision.',
    ],
  },
  travel: {
    label: 'iVisa, Atlys, Sherpa and official immigration portals',
    patterns: [
      'Visa tools win when they combine document checklists, official-source verification, status tracking and downloadable application records.',
      'The better services distinguish government fees from service charges and warn users about fake portals or unsupported travel purposes.',
      'Enterprise travel tools reuse documents across trips and surface action-required states instead of leaving users with a static fee estimate.',
    ],
  },
  personal: {
    label: 'Legal-aid portals, Rocket Lawyer and LawDepot personal-law flows',
    patterns: [
      'Personal-law tools work best when they gather facts, documents, urgency and eligibility before pointing people to a court, lawyer or aid office.',
      'They provide a portable case note or printable pack because users often move between family, court, registry and advice channels.',
      'They make escalation triggers prominent for contested facts, safety concerns, court deadlines or vulnerable parties.',
    ],
  },
};

const profiles = {
  'business-registration': {
    coverage: '16 core markets',
    title: 'Registration filing map',
    intro: 'This app is strongest when it turns a broad incorporation idea into a filing sequence: name search, entity choice, registry filing, tax setup, employer registrations, and local permits.',
    decisions: ['Whether a business name is enough or a limited company is safer', 'Which registry owns the filing and which portal to verify before paying anyone', 'Which post-registration obligations begin immediately after incorporation'],
    checklist: ['Run the official name search first, then save the reservation receipt or reference number', 'Collect beneficial owner, director, address, tax and sector licence evidence before filing', 'After approval, open the post-registration checklist and schedule tax, payroll, pension and local permit tasks'],
    redFlags: ['Agents who promise instant approval without a registry reference', 'Using a residential or virtual address where a local permit requires a physical inspection', 'Stopping after incorporation and missing tax, pension, labour or municipal registrations'],
    sources: ['cac', 'brs', 'cipc', 'rdb'],
    related: [['Company Type Selector', '/tools/company-type-selector/'], ['TIN Guide', '/tools/tin-guide/'], ['Annual Returns', '/tools/annual-returns/']],
  },
  'company-type-selector': {
    coverage: '16 core markets',
    title: 'Entity structure triage',
    intro: 'The decision is not only cost. The better structure depends on liability exposure, shareholders, fundraising, public benefit status, tax registration, banking, and whether local law expects a regulated form.',
    decisions: ['Whether the business needs separate legal personality before signing contracts', 'Whether founders need shares, partnership interests, guarantees, or a non-profit structure', 'Whether the structure will support future bank, tender, grant, or investor diligence'],
    checklist: ['List every founder, funder, director and beneficial owner before choosing the structure', 'Compare filing cost against annual return, accounting and tax maintenance cost', 'Choose the structure that survives your next 18 months, not the cheapest one this week'],
    redFlags: ['Choosing a sole trader structure while taking customer deposits, credit, or staff risk', 'Using a non-profit form for a business that will distribute profits', 'Adding nominee shareholders without written beneficial ownership records'],
    sources: ['cama', 'brs', 'cipc', 'rdb'],
    related: [['Business Registration', '/tools/business-registration/'], ['Shareholder Agreement', '/tools/shareholder-agreement/'], ['Partnership Agreement', '/tools/partnership-agreement/']],
  },
  'business-license': {
    coverage: '16 core markets plus industry filters',
    title: 'Permit and licence gap check',
    intro: 'Many African businesses are incorporated correctly but operate illegally because sector and local permits were missed. This app should be used as the second compliance layer after registration.',
    decisions: ['Which licence sits at national, state, county, municipal, or sector-regulator level', 'Which activities trigger food, health, education, construction, finance, transport, or data permits', 'Whether the business can open first or must wait for inspection and approval'],
    checklist: ['Start with the exact activity, not the broad industry label', 'Check the municipal or county permit even when the company registry is fully online', 'Keep proof of inspection, licence renewal, and responsible officer approval in one compliance folder'],
    redFlags: ['A licence described as optional by an agent but required by a sector regulator', 'Trading from a new branch without updating the permit location', 'Advertising regulated services before licence approval'],
    sources: ['brsPortal', 'brs', 'cac', 'cipc'],
    related: [['Business Registration', '/tools/business-registration/'], ['Compliance Calendar', '/tools/compliance-calendar/'], ['Annual Returns', '/tools/annual-returns/']],
  },
  'tin-guide': {
    coverage: '54-country directory',
    title: 'Tax identity setup',
    intro: 'A tax ID is the connector between registration, banking, invoices, payroll, tenders, tax filing, and cross-border payments. Treat it as an operating credential, not a one-time number.',
    decisions: ['Which authority issues the tax ID for individuals, companies, or non-residents', 'Which documents prove identity, address, company status, and representative authority', 'Whether VAT, PAYE, pension, social security, or withholding tax registration is also needed'],
    checklist: ['Match the business name and registration number exactly across registry and tax accounts', 'Add authorised officers and accountant access only through official portals', 'Save the tax ID certificate and portal login recovery details before leaving the filing session'],
    redFlags: ['Tax IDs created with an agent phone number or email you do not control', 'Mismatched spelling between registry certificate, bank account and tax record', 'Assuming a tax ID alone covers VAT, PAYE, pension or sector taxes'],
    sources: ['tinJtb', 'kra', 'sars'],
    related: [['Business Registration', '/tools/business-registration/'], ['VAT Calculator', '/tools/vat-calculator/'], ['Invoice Generator', '/tools/invoice-generator/']],
  },
  'annual-returns': {
    coverage: '16 core markets',
    title: 'Annual compliance calendar',
    intro: 'Annual returns are not tax returns. They keep the company alive at the registry and often now carry beneficial ownership, accounting, and officer-data consequences.',
    decisions: ['When the filing window opens for the entity type', 'Which documents are due with the annual return, including accounts or beneficial ownership declarations', 'Whether late filing can lead to penalties, blocked certificates, or deregistration'],
    checklist: ['Record the anniversary or AGM-based deadline at incorporation', 'Keep financial statements, director changes, share transfers, and beneficial ownership records updated before filing', 'Save the return confirmation and certificate as proof for banks, tenders, and investors'],
    redFlags: ['Confusing company annual returns with income tax returns', 'Missing beneficial ownership updates attached to the annual return', 'Ignoring registry reminders because the company is dormant'],
    sources: ['cipcReturns', 'cipc', 'cac', 'brs'],
    related: [['Business Registration', '/tools/business-registration/'], ['TIN Guide', '/tools/tin-guide/'], ['Board Resolution', '/tools/board-resolution/']],
  },
  'trademark-registration': {
    coverage: '16 core markets plus ARIPO/OAPI routes',
    title: 'Brand protection route check',
    intro: 'Trademark strategy in Africa is route-specific. A national filing, ARIPO designation, OAPI filing, or Madrid extension can produce very different coverage and objection risk.',
    decisions: ['Whether national, ARIPO, OAPI or Madrid filing gives the cleanest coverage', 'Which Nice classes match the actual goods and services', 'Whether the mark is distinctive enough before spending filing fees'],
    checklist: ['Search identical and confusingly similar marks before filing', 'Map every country where you sell, manufacture, franchise, license or raise investment', 'Keep first-use evidence, logo files, class descriptions and applicant details together'],
    redFlags: ['Registering only the logo when the word mark is the asset customers remember', 'Selecting too many Nice classes without actual use or intent', 'Assuming ARIPO and OAPI cover the same countries'],
    sources: ['aripo', 'oapi', 'wipoMadrid'],
    related: [['IP Protection', '/tools/ip-protection/'], ['Business Name Generator', '/tools/business-name-gen/'], ['Shareholder Agreement', '/tools/shareholder-agreement/']],
  },
  'ip-protection': {
    coverage: 'Africa-wide guide',
    title: 'IP asset protection plan',
    intro: 'The useful output is an IP register: what you own, what must be filed, who created it, who assigned it, where it is used, and which proof would survive investor or court review.',
    decisions: ['Which assets are trademarks, copyright, designs, patents, trade secrets, or domain names', 'Which assets need formal filing and which need assignment or confidentiality controls', 'Whether regional filing through ARIPO, OAPI or Madrid beats country-by-country filing'],
    checklist: ['Create an IP register with owner, creator, creation date, filing route and renewal date', 'Get written assignments from freelancers, employees, agencies and co-founders', 'Protect trade secrets with access controls, NDAs and limited distribution'],
    redFlags: ['Paying for a logo without copyright assignment', 'Launching in several countries before checking trademark availability', 'Putting secret formulas, customer lists or source files in public investor decks'],
    sources: ['aripo', 'oapi', 'wipoMadrid'],
    related: [['Trademark Registration', '/tools/trademark-registration/'], ['NDA Generator', '/tools/nda-generator/'], ['Contract Generator', '/tools/contract-generator/']],
  },
  'nda-generator': {
    coverage: 'Template generator',
    title: 'Confidentiality deal guardrails',
    intro: 'An NDA should narrow what is confidential, who can see it, what the recipient may do with it, how long duties last, and which court or process can enforce it.',
    decisions: ['Whether the exchange is mutual or one-way', 'Which confidential material needs special treatment, such as source code, formulas, customer lists or financials', 'Whether mediation, courts, arbitration or injunctive relief is the practical enforcement path'],
    checklist: ['Name the exact legal parties and include registration numbers where available', 'Describe the purpose narrowly so confidential material cannot be reused later', 'Add return or destruction duties for pitch decks, samples, files and backups'],
    redFlags: ['Using a generic NDA after confidential material has already been shared', 'Listing every conversation as confidential without clear exclusions', 'Choosing a governing law where neither party has assets, operations or realistic enforcement options'],
    sources: ['brs', 'cac', 'cipc'],
    related: [['IP Protection', '/tools/ip-protection/'], ['DPA Generator', '/tools/dpa-generator/'], ['Freelance Contract', '/tools/freelance-contract/']],
  },
  'partnership-agreement': {
    coverage: 'Template generator',
    title: 'Founder and partner alignment',
    intro: 'A partnership agreement must settle money, authority, work, exits, records, and dispute process before revenue arrives. The painful gaps usually appear after one partner contributes more cash or labour.',
    decisions: ['Whether this is a legal partnership, company, joint venture, or informal collaboration', 'How profit, losses, drawings and reinvestment decisions are approved', 'What happens when a partner leaves, dies, breaches duties, or stops contributing'],
    checklist: ['Write capital contributions, non-cash contributions and ownership shares separately', 'Add decision thresholds for spending, debt, hiring, bank mandates and contracts', 'Create an exit valuation method before anyone wants to exit'],
    redFlags: ['Equal profit splits with unequal duties and no performance expectations', 'No written bank-signing rules', 'No clause covering death, incapacity or partner deadlock'],
    sources: ['cama', 'brs', 'cipc'],
    related: [['Company Type Selector', '/tools/company-type-selector/'], ['Shareholder Agreement', '/tools/shareholder-agreement/'], ['Board Resolution', '/tools/board-resolution/']],
  },
  'shareholder-agreement': {
    coverage: 'Template generator',
    title: 'Founder equity controls',
    intro: 'The core job is not to repeat the constitution. It is to control founder exits, share transfers, reserved decisions, information rights, vesting, deadlock and investor-readiness.',
    decisions: ['Which decisions need unanimous, supermajority or board approval', 'Whether founder shares should vest or be repurchased after early exit', 'Which transfers are allowed, restricted, or forced during a sale'],
    checklist: ['Align the shareholder agreement with the company constitution and registry filings', 'Add drag-along, tag-along, pre-emption and leaver clauses before fundraising', 'Keep cap table, vesting schedule and beneficial ownership records current'],
    redFlags: ['Deadlock clauses that only say parties will discuss the issue', 'Investors receiving rights that ordinary shareholders cannot see', 'Share transfers that happen privately but are never updated at the registry'],
    sources: ['cama', 'brs', 'cipc'],
    related: [['Board Resolution', '/tools/board-resolution/'], ['Company Type Selector', '/tools/company-type-selector/'], ['Startup Valuation', '/tools/startup-valuation/']],
  },
  'board-resolution': {
    coverage: 'Template generator',
    title: 'Board authority evidence',
    intro: 'A board resolution is proof that the company acted through the right people. Banks, registries, counterparties and investors usually care about wording, quorum, signatories and supporting documents.',
    decisions: ['Whether the decision belongs to directors, shareholders, members or trustees', 'Which signatories are authorised and what limits apply', 'Whether the resolution must be filed, notarised, stamped or attached to a portal transaction'],
    checklist: ['Confirm quorum and notice requirements before drafting', 'State the exact transaction, account, asset, appointment, contract or filing being approved', 'Attach identity documents, company certificate and minutes where the receiving institution requires them'],
    redFlags: ['Using a resolution where a shareholder approval is required', 'Authorising signatories without expiry, transaction cap or two-signature control', 'Backdating board approval after a bank or registry rejection'],
    sources: ['cipc', 'brs', 'cac'],
    related: [['Annual Returns', '/tools/annual-returns/'], ['Shareholder Agreement', '/tools/shareholder-agreement/'], ['Business Registration', '/tools/business-registration/']],
  },
  'winding-up': {
    coverage: '16 core markets',
    title: 'Closure and deregistration path',
    intro: 'Closing a company is a compliance project. The safer path separates solvent closure, creditor-driven liquidation, tax clearance, employee obligations, asset distribution and registry deregistration.',
    decisions: ['Whether the company is solvent enough for voluntary closure', 'Which creditors, employees, tax authorities and registry offices must be notified', 'Which records must be retained after deregistration'],
    checklist: ['Reconcile tax, payroll, pension and supplier balances before promising a clean closure', 'Pass the correct board or shareholder resolutions and keep minutes', 'Cancel licences, bank mandates, subscriptions and statutory registrations after final filings'],
    redFlags: ['Deregistering while debts, employees or active contracts remain', 'Distributing assets before tax and creditor claims are resolved', 'Losing accounting records needed for later audits or director liability questions'],
    sources: ['brs', 'cipc', 'cac'],
    related: [['Annual Returns', '/tools/annual-returns/'], ['Court Fees', '/tools/court-fees/'], ['Board Resolution', '/tools/board-resolution/']],
  },
  'foreign-company-reg': {
    coverage: '16 core markets',
    title: 'Market entry structure check',
    intro: 'Foreign registration choices affect tax, local liability, bank access, tender eligibility, exchange controls, labour obligations and whether revenue can be invoiced locally.',
    decisions: ['Whether branch, subsidiary, representative office, local partnership or distributor model is the right entry route', 'Whether local directors, resident agents, registered addresses or foreign ownership approvals are required', 'Which filings are needed before hiring, invoicing or opening a local bank account'],
    checklist: ['Map planned activities against local permanent establishment and licensing risk', 'Check beneficial ownership and resident-agent rules before incorporating', 'Keep parent company constitutional documents, board approvals and notarised translations ready'],
    redFlags: ['Selling locally through a representative office that is not allowed to trade', 'Hiring staff before employer registration', 'Ignoring exchange-control, tax residence or withholding-tax consequences'],
    sources: ['brs', 'cipc', 'rdb', 'cac'],
    related: [['Business License', '/tools/business-license/'], ['TIN Guide', '/tools/tin-guide/'], ['Transfer Pricing', '/tools/transfer-pricing/']],
  },
  'ndpa-checker': {
    coverage: 'Nigeria',
    title: 'NDPA control audit',
    intro: 'The checker is most useful when the score becomes a remediation list: lawful basis, privacy notice, data-subject rights, processor contracts, breach response, DPIA, registration and audit evidence.',
    decisions: ['Whether the business is likely to be a data controller or processor of major importance', 'Which controls must be documented before a regulator, partner, or enterprise customer asks', 'Which gaps create immediate breach, audit, or cross-border-transfer risk'],
    checklist: ['Keep a register of processing activities before answering the checklist', 'Attach evidence for each yes answer, such as policy, log, contract or training record', 'Prioritise breach response, processor contracts and privacy notice fixes first'],
    redFlags: ['Marking yes because a policy exists but staff cannot execute it', 'Using consent as the lawful basis for every processing activity', 'Sending data abroad without a transfer basis and processor contract'],
    sources: ['ndpc', 'ndpcHome'],
    related: [['Privacy Policy Generator', '/tools/privacy-policy-gen/'], ['DPA Generator', '/tools/dpa-generator/'], ['DPIA Tool', '/tools/dpia-tool/']],
  },
  'popia-checker': {
    coverage: 'South Africa',
    title: 'POPIA readiness review',
    intro: 'POPIA work should follow the eight conditions for lawful processing and turn each gap into an owner, document, system control, and review date.',
    decisions: ['Whether personal information processing is lawful, specific and minimal', 'Whether data-subject participation and breach notification processes are documented', 'Whether cross-border transfers, operators and special personal information have controls'],
    checklist: ['Map personal information by purpose, source, recipient and retention period', 'Review operator agreements and security safeguards before vendor onboarding', 'Prepare breach notification evidence for the Information Regulator and affected persons'],
    redFlags: ['Copying a GDPR-only policy without POPIA terminology and operator clauses', 'Collecting ID, health or children data without enhanced controls', 'Treating direct marketing consent as a once-off checkbox'],
    sources: ['inforeg', 'popiaAct'],
    related: [['Cookie Consent', '/tools/cookie-consent/'], ['DPA Generator', '/tools/dpa-generator/'], ['Cross-Border Data', '/tools/cross-border-data/']],
  },
  'kenya-dpa': {
    coverage: 'Kenya',
    title: 'Kenya DPA evidence review',
    intro: 'Kenya compliance needs more than a privacy notice. Registration, breach reporting, DPIA triggers, processor contracts and data-subject responses all need practical evidence.',
    decisions: ['Whether the organisation must register as a controller or processor', 'Whether the processing creates DPIA or breach-notification duties', 'Which complaints, access requests and erasure requests need an internal workflow'],
    checklist: ['Check ODPC registration status before tender, enterprise sales or app launch', 'Prepare breach facts, affected categories, mitigation and attachments before notification', 'Use the privacy policy, DPA and DPIA tools together for high-risk processing'],
    redFlags: ['Assuming small size removes all ODPC obligations', 'Reporting a breach without mitigation steps or affected-person communication plan', 'Processing biometric, children or health data without a DPIA review'],
    sources: ['odpcFaq', 'odpcBreach'],
    related: [['Privacy Policy Generator', '/tools/privacy-policy-gen/'], ['Breach Notification', '/tools/breach-notification/'], ['DPIA Tool', '/tools/dpia-tool/']],
  },
  'gdpr-vs-africa': {
    coverage: 'Comparator',
    title: 'Cross-law privacy comparison',
    intro: 'Use the comparator to spot where a GDPR control is enough, where African law adds a local filing or regulator step, and where the wording must change for local terminology.',
    decisions: ['Which GDPR principles map cleanly onto NDPA, POPIA, Kenya DPA and other African laws', 'Which countries require registration, declaration, DPO, DPIA or local regulator contact', 'Which transfer safeguards apply when EU, UK, US or African vendors are involved'],
    checklist: ['Start with one processing activity and compare obligations across its affected countries', 'Separate controller duties from processor duties before drafting agreements', 'Create a local-law annex for countries with special registration or breach rules'],
    redFlags: ['Treating GDPR compliance as automatic compliance everywhere in Africa', 'Forgetting local regulator registration even where principles match', 'Missing language, contact, complaint and representative requirements in privacy notices'],
    sources: ['dpia', 'ndpc', 'inforeg', 'odpcFaq'],
    related: [['Cross-Border Data', '/tools/cross-border-data/'], ['DPA Generator', '/tools/dpa-generator/'], ['Privacy Policy Generator', '/tools/privacy-policy-gen/']],
  },
  'privacy-policy-gen': {
    coverage: '16 core privacy regimes',
    title: 'Privacy notice builder',
    intro: 'A useful privacy policy tells people what you collect, why, who receives it, how long it stays, which rights they have, and how to complain. It should match the real product, not the company wish list.',
    decisions: ['Which lawful bases apply to each purpose of processing', 'Which rights, regulator contacts and complaint routes belong in the notice', 'Whether cookies, analytics, children, payments, cross-border vendors or sensitive data need extra clauses'],
    checklist: ['List every data category collected by your product before generating the policy', 'Replace generic vendor wording with actual processors and countries', 'Review the policy whenever a new payment provider, analytics tool, AI feature or marketing flow goes live'],
    redFlags: ['Promising not to share data while using analytics, email, cloud or payment processors', 'Leaving retention periods vague for financial, employment or health data', 'Publishing a policy that has no contact route for data-subject requests'],
    sources: ['ndpcHome', 'odpcFaq', 'inforeg'],
    related: [['Cookie Consent', '/tools/cookie-consent/'], ['DPA Generator', '/tools/dpa-generator/'], ['DPIA Tool', '/tools/dpia-tool/']],
  },
  'cookie-consent': {
    coverage: 'Banner generator',
    title: 'Consent design and code check',
    intro: 'A banner is compliant only when the site behaviour matches the choice. Non-essential analytics, advertising and tracking cookies should wait for consent where consent is required.',
    decisions: ['Which cookies are strictly necessary, analytics, advertising, preferences or security', 'Whether opt-in, opt-out or notice-only is appropriate for the target jurisdictions', 'How users can withdraw or change consent later'],
    checklist: ['Audit actual cookies in the browser before publishing the banner', 'Block non-essential tags until the saved preference allows them', 'Keep a visible preference link in the footer or account area'],
    redFlags: ['A banner that says “accept” but loads tracking before any choice', 'No reject button where opt-in consent is required', 'Using dark patterns that make refusal harder than acceptance'],
    sources: ['ndpc', 'inforeg', 'dpia'],
    related: [['Privacy Policy Generator', '/tools/privacy-policy-gen/'], ['DPA Generator', '/tools/dpa-generator/'], ['NDPA Checker', '/tools/ndpa-checker/']],
  },
  'breach-notification': {
    coverage: '16 core privacy regimes',
    title: 'Incident notice readiness',
    intro: 'Breach notifications are judged by clarity and speed. The useful output is a regulator-ready account of what happened, whose data was affected, what risk exists, what you did, and what people should do now.',
    decisions: ['Whether the incident is a reportable personal data breach', 'Which regulator, data subjects, police, partner, or customer must be notified', 'Whether 72-hour reporting, confidentiality, attachments, or follow-up notices apply'],
    checklist: ['Record discovery time, containment time and decision time separately', 'Describe affected data categories and groups without speculation', 'Add immediate, medium-term and long-term remediation steps'],
    redFlags: ['Waiting for perfect forensic certainty before making a time-sensitive notification', 'Notifying customers before containment messaging is ready', 'Blaming a vendor without checking processor contract duties'],
    sources: ['odpcBreach', 'ndpcHome', 'inforeg'],
    related: [['DPIA Tool', '/tools/dpia-tool/'], ['DPA Generator', '/tools/dpa-generator/'], ['Cross-Border Data', '/tools/cross-border-data/']],
  },
  'dpa-generator': {
    coverage: 'Template generator',
    title: 'Controller-processor contract pack',
    intro: 'A data processing agreement should translate privacy law into operational duties: instructions, sub-processors, security, breach notice, audits, deletion, transfer controls and assistance with data-subject rights.',
    decisions: ['Whether each party is controller, processor, joint controller, or independent controller', 'Which processing instructions, data categories and retention periods belong in the schedule', 'Which sub-processor, cross-border and breach timelines are acceptable'],
    checklist: ['Attach a processing schedule rather than hiding details in general wording', 'Match breach-notice timing to the strictest relevant jurisdiction', 'Require deletion or return of data when the service ends'],
    redFlags: ['Calling every vendor a processor when some decide purposes independently', 'No sub-processor approval or onward-transfer clause', 'No audit, security or deletion evidence requirement'],
    sources: ['ndpc', 'odpcFaq', 'popiaAct'],
    related: [['Privacy Policy Generator', '/tools/privacy-policy-gen/'], ['Breach Notification', '/tools/breach-notification/'], ['Cross-Border Data', '/tools/cross-border-data/']],
  },
  'cross-border-data': {
    coverage: '16 core privacy regimes',
    title: 'Transfer risk map',
    intro: 'Cross-border transfers need a country, recipient, purpose, safeguard and fallback plan. The safest output is a transfer register with evidence for every destination.',
    decisions: ['Whether the transfer goes to an adequate, comparable, approved or restricted destination', 'Whether standard clauses, consent, contract necessity, regulator approval or another safeguard is needed', 'Whether onward transfers by cloud, payroll, CRM, AI or analytics vendors create hidden exposure'],
    checklist: ['Map hosting, support, analytics, email, backup and AI vendors by country', 'Attach the DPA, transfer clause and security summary to each transfer entry', 'Review transfers when vendors add sub-processors or move hosting regions'],
    redFlags: ['Assuming “cloud” means the data stays local', 'Using consent for employee or essential-service transfers where consent is not freely given', 'Ignoring regulator approval or notification rules for high-risk transfers'],
    sources: ['ndpc', 'odpcFaq', 'popiaAct', 'dpia'],
    related: [['DPA Generator', '/tools/dpa-generator/'], ['DPIA Tool', '/tools/dpia-tool/'], ['GDPR vs Africa', '/tools/gdpr-vs-africa/']],
  },
  'dpia-tool': {
    coverage: 'Assessment wizard',
    title: 'High-risk processing review',
    intro: 'A DPIA should be completed before launch, not after an incident. It documents necessity, proportionality, risks to people, safeguards and the decision to proceed or redesign.',
    decisions: ['Whether the processing is likely to create high risk for individuals', 'Which risks affect rights, freedoms, safety, discrimination, financial harm or confidentiality', 'Which safeguards reduce residual risk enough to proceed'],
    checklist: ['Describe the processing flow in plain language before scoring risk', 'Include vulnerable groups, children, biometrics, health, credit, location and automated decisions as trigger checks', 'Assign every mitigation to an owner and review date'],
    redFlags: ['Scoring risk low because the business wants to launch quickly', 'No consultation with product, security, legal or affected user representatives', 'No documented decision where high residual risk remains'],
    sources: ['dpia', 'odpcBreach', 'ndpc'],
    related: [['Privacy Policy Generator', '/tools/privacy-policy-gen/'], ['Cross-Border Data', '/tools/cross-border-data/'], ['Breach Notification', '/tools/breach-notification/']],
  },
  'will-generator': {
    coverage: '16 core markets',
    title: 'Estate planning checklist',
    intro: 'A will is useful only when it matches local execution rules, family law, religious or customary rules, property records, guardianship needs and the practical work an executor must do.',
    decisions: ['Which assets pass through the will and which pass by nomination, joint ownership, trust or customary rule', 'Who should act as executor, guardian and backup decision maker', 'Whether spouse, children, dependants or forced-heirship rules limit gifts'],
    checklist: ['List assets by title holder, account number, location and beneficiary nomination', 'Choose witnesses who are not beneficiaries where local law requires it', 'Store the signed original where the executor can find it quickly'],
    redFlags: ['Using the same will after marriage, divorce, birth, migration or property purchase', 'Leaving minors major assets without guardianship and trustee instructions', 'Signing without the required witnesses or with a beneficiary as witness'],
    sources: ['sarsEstate', 'zaMaintenance', 'nlasFaq'],
    related: [['Inheritance Tax', '/tools/inheritance-tax/'], ['Power of Attorney', '/tools/power-of-attorney/'], ['Affidavit Generator', '/tools/affidavit-generator/']],
  },
  'power-of-attorney': {
    coverage: '16 core markets',
    title: 'Authority delegation review',
    intro: 'A power of attorney is a powerful authority document. It should be narrow enough to prevent abuse and formal enough to be accepted by banks, registries, courts or land offices.',
    decisions: ['Whether the power should be general, special, property, banking, litigation, health or time-limited', 'Whether notarisation, commissioner of oaths, witnesses, consular legalisation or registration is required', 'Whether incapacity, revocation and death rules make the power unsuitable'],
    checklist: ['State the exact acts the attorney may perform and any transaction caps', 'Add start date, expiry date and revocation process', 'Check acceptance requirements with the bank, land registry or institution before signing'],
    redFlags: ['Granting a broad general power for a single land or bank transaction', 'No independent witness or notarisation where the receiving office expects it', 'No written revocation after trust breaks down'],
    sources: ['brs', 'cipc', 'cac'],
    related: [['Will Generator', '/tools/will-generator/'], ['Statutory Declaration', '/tools/statutory-declaration/'], ['Land Title Check', '/tools/land-title-check/']],
  },
  'divorce-settlement': {
    coverage: '16 core markets',
    title: 'Settlement scenario stress test',
    intro: 'A calculator can only estimate. Real outcomes depend on matrimonial property regime, contributions, children, need, disclosure, court discretion and whether parties can document the asset base.',
    decisions: ['Which assets are marital, separate, inherited, jointly owned or business-owned', 'How child needs, housing, debt, income disparity and contributions affect negotiation range', 'Whether mediation, court filing or urgent protection orders are needed'],
    checklist: ['Prepare asset, debt, bank, property, pension and business records before relying on a split estimate', 'Separate child support and spousal support from asset division', 'Model settlement options before proposing terms to the other party'],
    redFlags: ['Hiding assets or transferring property during separation', 'Ignoring pension, business interests, loans and informal family contributions', 'Accepting a verbal settlement with no enforceable court or written agreement'],
    sources: ['zaMaintenance', 'nlas', 'sarsEstate'],
    related: [['Child Support', '/tools/child-support/'], ['Court Fees', '/tools/court-fees/'], ['Legal Aid', '/tools/legal-aid/']],
  },
  'child-support': {
    coverage: '16 core markets',
    title: 'Maintenance affordability and needs review',
    intro: 'Child support is about the child’s actual needs and both parents’ means. The app is most useful when it produces a negotiation range plus an evidence list for court or mediation.',
    decisions: ['What monthly needs should be included: food, housing, school, medical, transport, childcare and special needs', 'How custody or contact arrangements affect direct and cash contributions', 'Whether the matter needs court enforcement, variation or reciprocal enforcement across borders'],
    checklist: ['Collect proof of income and expenses for both parents where possible', 'List direct payments separately from cash maintenance', 'Update the calculation when school fees, medical needs or income changes materially'],
    redFlags: ['Linking maintenance to access or visitation disputes', 'Ignoring health insurance, school transport and arrears', 'Agreeing to a private payment plan with no evidence trail'],
    sources: ['zaMaintenance', 'nlasFaq'],
    related: [['Divorce Settlement', '/tools/divorce-settlement/'], ['Legal Aid', '/tools/legal-aid/'], ['Court Fees', '/tools/court-fees/']],
  },
  'inheritance-tax': {
    coverage: '16 core markets',
    title: 'Estate duty and probate cost review',
    intro: 'Most African countries have no classic inheritance tax, but probate fees, estate duty, capital gains, transfer duties, executor fees and property paperwork can still change what heirs receive.',
    decisions: ['Whether the country has estate duty, transfer duty, probate fees or no direct inheritance tax', 'Which deductions, spouse exemptions and thresholds apply before tax', 'Whether inherited property later creates capital gains or registration duty'],
    checklist: ['Separate gross estate, debts, funeral expenses, spouse bequests and executor fees', 'Confirm South African estate duty thresholds before relying on a zero-tax assumption', 'Keep property title, will, death certificate and tax clearance records ready for probate'],
    redFlags: ['Assuming “no inheritance tax” means no probate, executor or transfer cost', 'Ignoring spouse and public benefit deductions where they apply', 'Using the wrong country because the deceased owned assets across borders'],
    sources: ['sarsEstate', 'sarsTaxes'],
    related: [['Will Generator', '/tools/will-generator/'], ['Property CGT', '/tools/property-cgt/'], ['Court Fees', '/tools/court-fees/']],
  },
  'bail-calculator': {
    coverage: '16 core markets',
    title: 'Bail condition preparation',
    intro: 'Bail is discretionary. The important output is not a promised amount, but a preparation pack showing community ties, sureties, address, employment, health, dependants and low flight risk.',
    decisions: ['Which offence category and court level shape the likely bail range', 'Which sureties, documents and conditions may be required', 'Whether urgent legal aid or private counsel is needed before the first appearance'],
    checklist: ['Prepare ID, proof of address, employment, family ties and surety information', 'List medical, dependant or work reasons for reasonable bail conditions', 'Record every condition clearly once bail is granted'],
    redFlags: ['Treating the calculated range as a guarantee', 'Using a surety who cannot prove income or address', 'Breaching travel, reporting, contact or evidence-preservation conditions'],
    sources: ['nlas', 'zaMaintenance'],
    related: [['Legal Aid', '/tools/legal-aid/'], ['Court Fees', '/tools/court-fees/'], ['Affidavit Generator', '/tools/affidavit-generator/']],
  },
  'court-fees': {
    coverage: '16 core markets',
    title: 'Filing cost and route estimate',
    intro: 'Court fees are only part of litigation cost. Service, execution, copies, lawyer fees, mediation, expert evidence and appeal costs can matter more than the initial filing amount.',
    decisions: ['Which court level fits the claim value and subject matter', 'Which fee items are filing, service, hearing, appeal, certificate or execution costs', 'Whether legal aid, fee waiver, mediation or tribunal route is available'],
    checklist: ['Confirm court jurisdiction before estimating fees', 'Budget for service, copies, transport and enforcement costs', 'Prepare evidence bundles before paying a filing fee'],
    redFlags: ['Filing in the wrong court because the claim amount was estimated poorly', 'Ignoring limitation periods while comparing costs', 'Paying filing fees before checking settlement or legal aid options'],
    sources: ['nlas', 'nlasFaq', 'zaMaintenance'],
    related: [['Legal Aid', '/tools/legal-aid/'], ['Bail Calculator', '/tools/bail-calculator/'], ['Affidavit Generator', '/tools/affidavit-generator/']],
  },
  'legal-aid': {
    coverage: '16 core markets',
    title: 'Eligibility and application pack',
    intro: 'Legal aid is usually means-tested and matter-tested. The best use of this app is to prepare a complete application package before visiting an office or submitting online.',
    decisions: ['Whether income, assets, residence, citizenship or vulnerability status may qualify', 'Whether the matter type is covered, excluded, urgent or public-interest related', 'Which documents prove means, identity, residence and case facts'],
    checklist: ['Bring income proof, bank statements, IDs, summons, charge sheets or case documents', 'State the legal problem clearly and separate urgent deadlines from background facts', 'Ask about review or appeal rights if aid is refused'],
    redFlags: ['Waiting until the hearing date to apply', 'Applying without court documents or proof of income', 'Assuming legal aid covers every civil debt, tax, defamation or business dispute'],
    sources: ['nlas', 'nlasFaq'],
    related: [['Court Fees', '/tools/court-fees/'], ['Child Support', '/tools/child-support/'], ['Bail Calculator', '/tools/bail-calculator/']],
  },
  'statutory-declaration': {
    coverage: '16 core markets',
    title: 'Administrative declaration checklist',
    intro: 'A statutory declaration is for formal facts outside court: lost documents, name changes, address confirmation, age declarations and administrative corrections. The receiving office controls the format.',
    decisions: ['Whether the matter needs a statutory declaration, affidavit, police report, newspaper publication or court order', 'Who must witness, commission or notarise the declaration', 'Which supporting documents must be attached'],
    checklist: ['Ask the receiving office for required wording before signing', 'Use precise facts, dates, document numbers and addresses', 'Bring original ID and attachments to the commissioner or notary'],
    redFlags: ['Using a statutory declaration for contested facts that need court evidence', 'Signing before filling all blanks', 'Declaring facts you cannot personally verify'],
    sources: ['brs', 'cac', 'nlasFaq'],
    related: [['Affidavit Generator', '/tools/affidavit-generator/'], ['Power of Attorney', '/tools/power-of-attorney/'], ['National ID Guide', '/tools/national-id-guide/']],
  },
  'affidavit-generator': {
    coverage: '16 core markets',
    title: 'Sworn evidence drafting check',
    intro: 'An affidavit is sworn evidence. It should be factual, numbered, within personal knowledge, signed properly and matched to the court, registry or institution that will receive it.',
    decisions: ['Whether the statement belongs in an affidavit or a statutory declaration', 'Which facts are personal knowledge and which need exhibits', 'Who can commission the oath in the relevant jurisdiction'],
    checklist: ['Number paragraphs and keep one fact per paragraph', 'Label attachments clearly and refer to them consistently', 'Do not sign until you are physically before the authorised commissioner, notary or magistrate where required'],
    redFlags: ['Including rumours, arguments or legal conclusions as facts', 'Changing pages after commissioning', 'Using an affidavit where the receiving institution requested a different sworn form'],
    sources: ['nlasFaq', 'brs', 'cac'],
    related: [['Statutory Declaration', '/tools/statutory-declaration/'], ['Court Fees', '/tools/court-fees/'], ['Bail Calculator', '/tools/bail-calculator/']],
  },
};

const extraLegalProfiles = {
  'cac-cost': {
    coverage: 'Nigeria',
    title: 'CAC fee and filing reality check',
    intro: 'This app should help a founder separate official CAC filing costs from agent bundles, name reservation, post-incorporation tax setup, and optional services that are often sold as mandatory.',
    decisions: ['Whether the user needs a business name, limited company, trustee or company limited by guarantee route', 'Which official CAC fee applies before adding agent, stamp, tax or document-prep costs', 'Which post-registration obligations will cost money after the certificate is issued'],
    checklist: ['Check the CAC service page or portal before paying a third party', 'Keep name reservation, filing receipt, certificate, status report and MEMART together', 'Budget for TIN, bank account, tax filings, beneficial ownership and sector permits after registration'],
    redFlags: ['A quote that hides the CAC filing fee inside a vague package', 'Agent contact details controlling the CAC account or recovery email', 'Assuming CAC registration also covers FIRS, state tax, pension, NSITF or local permits'],
    sources: ['cac', 'cama'],
    related: [['CAC Business Name Checker', '/tools/cac-checker/'], ['Business Registration', '/tools/business-registration/'], ['TIN Guide', '/tools/tin-guide/']],
    hubGroup: 'Business, Government And Compliance',
    icon: '&#x1f1f3;&#x1f1ec;',
    name: 'Nigeria CAC Registration Cost',
    badge: 'Nigeria',
    cardDesc: 'Separate CAC filing fees from agent bundles, post-registration tax setup and permit costs.',
  },
  'cipc-cost': {
    coverage: 'South Africa',
    title: 'CIPC fee and name-reservation check',
    intro: 'Use this app before paying for a South African company setup so the user can see the CIPC fee, name reservation choice, document route and the recurring annual-return obligation.',
    decisions: ['Whether to reserve a name or register under an enterprise number first', 'Which CIPC filing path is needed for a private company, non-profit, external company or amendment', 'How CIPC fees differ from SARS, bank, B-BBEE, labour and domain setup costs'],
    checklist: ['Verify the current CIPC fee schedule before paying an agent', 'Keep CoR documents, director details and CIPC customer code in a controlled account', 'Add annual returns and beneficial ownership filing to the first-year compliance calendar'],
    redFlags: ['Quotes that imply SARS, UIF, COIDA or tax clearance are included when they are separate steps', 'Name reservation paid with no follow-up registration plan', 'Company access credentials kept only by the agent'],
    sources: ['cipcFees', 'cipc', 'cipcReturns'],
    related: [['Annual Returns', '/tools/annual-returns/'], ['Company Type Selector', '/tools/company-type-selector/'], ['TIN Guide', '/tools/tin-guide/']],
    hubGroup: 'Business, Government And Compliance',
    icon: '&#x1f1ff;&#x1f1e6;',
    name: 'SA CIPC Registration Cost',
    badge: 'South Africa',
    cardDesc: 'Check CIPC fees, name reservation choices and first-year company maintenance costs.',
  },
  'data-compliance': {
    coverage: 'Nigeria, South Africa and Kenya',
    title: 'Privacy compliance command check',
    intro: 'This older compliance checker should function as a fast triage layer across NDPA, POPIA and Kenya DPA before users move into the deeper country-specific tools.',
    decisions: ['Which law is the main risk driver for the product, customer base or data location', 'Whether the organisation needs registration, a DPO, a DPIA, breach process or processor contracts', 'Which gaps belong in policies, vendor contracts, technical controls or staff training'],
    checklist: ['Map personal data categories, purposes, vendors, countries and retention periods first', 'Use the country-specific checker for the highest-risk country after scoring', 'Attach evidence for each control instead of treating yes/no answers as proof'],
    redFlags: ['Treating POPIA, NDPA and Kenya DPA as identical because the checklist score is high', 'No breach decision tree or regulator contact route', 'No processor contract even though payment, cloud, CRM or analytics vendors handle personal data'],
    sources: ['ndpc', 'inforeg', 'odpcFaq'],
    related: [['NDPA Checker', '/tools/ndpa-checker/'], ['POPIA Checker', '/tools/popia-checker/'], ['Kenya DPA Checker', '/tools/kenya-dpa/']],
    hubGroup: 'Business, Government And Compliance',
    icon: '&#x1f6e1;&#xfe0f;',
    name: 'POPIA/NDPR Compliance Checker',
    badge: 'Privacy',
    cardDesc: 'Triage NDPA, POPIA and Kenya DPA gaps before using the deeper country tools.',
  },
  'contract-generator': {
    coverage: 'Contract templates',
    title: 'Template selection and clause-risk check',
    intro: 'The contract generator is most useful when it helps users choose the right template, tighten commercial terms, and avoid signing a document that does not match the transaction.',
    decisions: ['Whether the deal needs tenancy, employment, NDA, freelance, loan or a custom lawyer-drafted agreement', 'Which clauses must be country-specific, such as notice, tax, dispute forum, termination and data protection', 'Whether signatures, witnesses, stamping or board authority are needed before use'],
    checklist: ['Identify parties by legal name, registration number and address', 'Write payment, delivery, termination and dispute steps in operational language', 'Check whether the agreement touches employment, land, data, lending or regulated services before signing'],
    redFlags: ['Using a short generic contract for regulated work or property rights', 'No authority evidence for a company signatory', 'Dispute clause points to a country where neither party has assets or operations'],
    sources: ['brs', 'cac', 'cipc'],
    related: [['NDA Generator', '/tools/nda-generator/'], ['Employment Contract Builder', '/tools/employment-contract/'], ['Tenancy Agreement', '/tools/tenancy-agreement/']],
    hubGroup: 'Business, Government And Compliance',
    icon: '&#x1f4dc;',
    name: 'Contract Generator',
    badge: 'Templates',
    cardDesc: 'Pick the right legal template and check the clauses that usually break in practice.',
  },
  'visa-cost': {
    coverage: 'Travel visa checker',
    title: 'Visa-fee and official-portal sanity check',
    intro: 'Visa costs change quickly and fake portals are common. This app should route users toward official immigration pages, embassy instructions and the exact purpose-of-travel category before they pay.',
    decisions: ['Whether the destination requires no visa, ETA, eVisa, visa on arrival, embassy visa or residence permit', 'Which fee belongs to the official portal versus agency, biometric, courier or service charges', 'Which passport type, travel purpose and stay length changes the answer'],
    checklist: ['Open the destination government or embassy page before paying', 'Confirm passport validity, yellow-fever or vaccination rules, transit rules and return-ticket requirements', 'Save the payment receipt, application reference and approval document offline'],
    redFlags: ['A search-ad portal charging more than the government fee without saying it is an agent', 'Assuming visa-free entry applies to work, study, paid speaking or long stays', 'Booking non-refundable travel before the visa or ETA is approved'],
    sources: ['kenyaEvisa', 'nisVisa', 'govZaVisa', 'gisVisa'],
    related: [['Visa Checker', '/tools/visa-checker/'], ['Passport Checklist', '/tools/passport-checklist/'], ['Travel Vaccination Cost', '/tools/travel-vaccination-cost/']],
    hubGroup: 'Business, Government And Compliance',
    icon: '&#x2708;&#xfe0f;',
    name: 'African Visa Cost Checker',
    badge: 'Travel',
    cardDesc: 'Compare visa categories, fees and official portal checks before paying.',
  },
  'cac-checker': {
    coverage: 'Nigeria',
    title: 'Business-name availability workflow',
    intro: 'A business-name checker should do more than tell users to search. It should help them prepare alternatives, avoid prohibited words, and connect name availability to CAC filing and trademark risk.',
    decisions: ['Whether the name is registrable as a business name, company name or trademark', 'Whether regulated words need prior approval or sector evidence', 'Whether a similar domain, social handle or trademark creates brand conflict'],
    checklist: ['Prepare at least three name options before the CAC search', 'Check spelling, restricted words, existing company names and trademark conflicts', 'Move quickly from availability to reservation because name status can change'],
    redFlags: ['Using a name because the domain is free while CAC or trademark search fails', 'Restricted words such as bank, insurance, university or government without approval', 'Letting an agent reserve a name under an account you cannot access'],
    sources: ['cac', 'cama'],
    related: [['CAC Registration Cost', '/tools/cac-cost/'], ['Trademark Registration', '/tools/trademark-registration/'], ['Business Registration', '/tools/business-registration/']],
    hubGroup: 'Business, Government And Compliance',
    icon: '&#x1f50d;',
    name: 'CAC / Business Name Checker',
    badge: 'Nigeria',
    cardDesc: 'Prepare CAC-ready name options and catch restricted-word or trademark conflicts early.',
  },
  'ip-rights-africa': {
    coverage: 'Africa-wide guide',
    title: 'IP route and ownership check',
    intro: 'This guide should help users decide whether the asset needs a trademark, copyright record, design, patent, trade-secret process or a regional filing route through ARIPO or OAPI.',
    decisions: ['Which IP right actually protects the asset', 'Whether ownership is clean between founder, employee, contractor, agency and company', 'Which filing route covers the target markets with the least duplication'],
    checklist: ['Create an IP register before paying filing fees', 'Get assignments from designers, developers, writers and co-founders', 'Compare national, ARIPO, OAPI and Madrid routes for the exact countries needed'],
    redFlags: ['Only registering a logo when the word mark is the main brand asset', 'No written transfer from the person who created the work', 'Sharing trade secrets with no NDA, access limits or evidence trail'],
    sources: ['aripo', 'oapi', 'wipoMadrid'],
    related: [['Trademark Registration', '/tools/trademark-registration/'], ['IP Protection Guide', '/tools/ip-protection/'], ['NDA Generator', '/tools/nda-generator/']],
    hubGroup: 'Business, Government And Compliance',
    icon: '&#x2122;&#xfe0f;',
    name: 'African IP Rights Guide',
    badge: 'IP',
    cardDesc: 'Choose the right IP right, owner record and regional route before filing.',
  },
  'leave-days': {
    coverage: 'Labour-law reference',
    title: 'Statutory leave entitlement check',
    intro: 'Leave rules vary by country, worker type, sector and collective agreement. The app should turn annual, sick, maternity, paternity, family and public-holiday rules into an HR policy check.',
    decisions: ['Which law or collective agreement sets the minimum leave entitlement', 'Whether leave accrues by days worked, months worked, service year or calendar year', 'Which leave types must be paid, unpaid, documented or approved by medical evidence'],
    checklist: ['Check the statutory floor, then compare the employment contract and company policy', 'Separate annual leave, sick leave, maternity, paternity, family responsibility and public holidays', 'Keep leave records, approvals and carried-forward balances audit-ready'],
    redFlags: ['Paying out statutory leave while the law requires time off except on termination', 'Applying senior staff policy to casual, fixed-term or domestic workers without checking the statute', 'No written leave ledger when an employee resigns or disputes pay'],
    sources: ['natlex', 'labourZa', 'kenyaEmployment'],
    related: [['Employment Contract Builder', '/tools/employment-contract/'], ['Minimum Wage Checker', '/tools/minimum-wage/'], ['Working Days Calculator', '/tools/working-days/']],
    hubGroup: 'Labour, Tenancy And Contracts',
    icon: '&#x1f4c5;',
    name: 'Statutory Leave Days Calculator',
    badge: 'Labour',
    cardDesc: 'Check annual, sick, maternity and family leave floors before writing HR policy.',
  },
  'minimum-wage': {
    coverage: '54-country wage reference',
    title: 'Minimum-wage and sector-floor check',
    intro: 'Minimum wage is a legal floor, not a hiring budget. The useful output flags national, sector, region and occupation differences before payroll or employment contracts are issued.',
    decisions: ['Whether the worker falls under a national, sector, regional or collective-agreement rate', 'Whether housing, transport, food, commission or in-kind benefits can count toward the wage floor', 'How wage changes affect overtime, pension, social security and dismissal exposure'],
    checklist: ['Verify the country and sector source before using a rate in payroll', 'Document work hours, overtime basis and pay period alongside the wage', 'Review wage floors whenever the government gazettes a change or the worker changes role'],
    redFlags: ['Using one national wage for sectors with separate orders', 'Treating allowances as wage without checking the law', 'Forgetting overtime, leave pay and social security when the base wage changes'],
    sources: ['iloWages', 'natlex', 'labourZa'],
    related: [['Employment Contract Builder', '/tools/employment-contract/'], ['Overtime Calculator', '/tools/overtime-calc/'], ['Staff Cost Calculator', '/tools/staff-cost/']],
    hubGroup: 'Labour, Tenancy And Contracts',
    icon: '&#x1f4b0;',
    name: 'Minimum Wage Reference',
    badge: '54-country',
    cardDesc: 'Verify national, sector and regional wage floors before setting payroll.',
  },
  'employment-contract': {
    coverage: 'Employment template',
    title: 'Employment terms risk check',
    intro: 'An employment contract must align job scope, pay, benefits, leave, probation, IP, confidentiality, termination and local labour-law minimums. The template should not override statutory rights.',
    decisions: ['Whether the worker is employee, contractor, intern, consultant or fixed-term staff', 'Which statutory leave, notice, social security, pension and wage rules must be reflected', 'Which confidentiality, IP, equipment and non-solicit clauses are proportionate'],
    checklist: ['Confirm worker classification before drafting', 'Put salary, pay period, hours, location, probation and reporting line in plain terms', 'Check statutory leave, notice and minimum wage before signing'],
    redFlags: ['Calling someone a contractor while controlling hours, tools and exclusivity like an employee', 'No IP assignment for technical, creative or product roles', 'Termination clause below statutory minimum notice or severance'],
    sources: ['natlex', 'labourZa', 'kenyaEmployment'],
    related: [['Leave Days Calculator', '/tools/leave-days/'], ['Minimum Wage Checker', '/tools/minimum-wage/'], ['Staff Cost Calculator', '/tools/staff-cost/']],
    hubGroup: 'Labour, Tenancy And Contracts',
    icon: '&#x1f4dd;',
    name: 'Employment Contract Builder',
    badge: 'Labour',
    cardDesc: 'Draft terms that respect wage, leave, notice, IP and worker-classification rules.',
  },
  'tenancy-agreement': {
    coverage: 'Tenancy template',
    title: 'Residential lease clause check',
    intro: 'A tenancy agreement becomes useful when it matches local rent-in-advance customs, deposit rules, notice periods, repairs, access rights, service charges and dispute forum.',
    decisions: ['Whether the contract is residential, commercial, short-let, sublease or licence', 'Which rent, deposit, service charge and agent-fee rules apply locally', 'Which notice, repair, inspection and default steps are enforceable'],
    checklist: ['Identify the property, landlord, tenant and permitted occupants precisely', 'Attach inventory, condition photos, meter readings and payment schedule', 'Write notice, renewal, rent review and dispute steps before money changes hands'],
    redFlags: ['Rent paid before title, authority or landlord identity is verified', 'Deposit handling unclear or mixed with rent advance', 'No inventory or handover evidence for furnished property'],
    sources: ['govZaDeeds', 'ghanaLands', 'ardhisasa'],
    related: [['Tenancy Deposit Calculator', '/tools/tenancy-deposit/'], ['Tenant Screening', '/tools/tenant-screening/'], ['Rental Agreement Generator', '/tools/rental-agreement/']],
    hubGroup: 'Labour, Tenancy And Contracts',
    icon: '&#x1f3e0;',
    name: 'Tenancy Agreement Generator',
    badge: 'Lease',
    cardDesc: 'Build residential lease terms around deposits, notices, repairs and handover proof.',
  },
  'tenancy-deposit': {
    coverage: 'Rent deposit reference',
    title: 'Deposit and rent-advance risk check',
    intro: 'Deposit rules collide with local rent-in-advance customs, agent fees, caution deposits and informal receipts. This app should help tenants and landlords separate each money bucket.',
    decisions: ['Which amounts are rent, refundable deposit, agent fee, service charge or utility float', 'Whether local law caps deposit, rent advance or notice periods', 'Which evidence is needed to recover a deposit later'],
    checklist: ['Label every payment in the receipt and agreement', 'Take condition photos, meter readings and inventory before handover', 'State refund timing, deductions, inspection process and dispute route'],
    redFlags: ['One lump-sum payment with no breakdown', 'No signed inventory for furnished or high-value property', 'Deposit refund depends only on landlord discretion'],
    sources: ['govZaDeeds', 'ghanaLands', 'ardhisasa'],
    related: [['Tenancy Agreement', '/tools/tenancy-agreement/'], ['Rent Affordability', '/tools/rent-affordability/'], ['Tenant Screening', '/tools/tenant-screening/']],
    hubGroup: 'Labour, Tenancy And Contracts',
    icon: '&#x1f4b5;',
    name: 'Tenancy Deposit Calculator',
    badge: 'Lease',
    cardDesc: 'Separate deposits, rent advance, agent fees and refund evidence before move-in.',
  },
  'rental-agreement': {
    coverage: 'Rental template',
    title: 'Rental contract operational checklist',
    intro: 'This generator should help users convert a rental deal into enforceable operating rules: rent due date, occupants, repairs, service charge, access, defaults, renewal and handover.',
    decisions: ['Whether the arrangement is a lease, short-let, room rental, commercial tenancy or licence', 'Which payment schedule and notice rules fit the jurisdiction', 'How repairs, utilities, service charge and shared facilities will be managed'],
    checklist: ['Verify landlord authority and property title before paying', 'Attach receipts, ID copies, condition schedule and house rules', 'Put renewal, rent review and exit inspection dates in the contract'],
    redFlags: ['Agent signs but cannot prove landlord authority', 'Service charges excluded from the agreement but demanded later', 'No default steps before lockout, eviction or deposit deductions'],
    sources: ['govZaDeeds', 'ghanaLands', 'ardhisasa'],
    related: [['Tenancy Agreement', '/tools/tenancy-agreement/'], ['Tenancy Deposit', '/tools/tenancy-deposit/'], ['Rent Affordability', '/tools/rent-affordability/']],
    hubGroup: 'Labour, Tenancy And Contracts',
    icon: '&#x1f4c4;',
    name: 'Rental Agreement Generator',
    badge: 'Lease',
    cardDesc: 'Generate rental terms with payments, repairs, access, renewal and exit evidence.',
  },
  'land-title-check': {
    coverage: 'Property due diligence',
    title: 'Title-verification evidence pack',
    intro: 'Land title due diligence must confirm seller authority, registry status, encumbrances, planning status, survey consistency, occupation and community or customary claims before payment.',
    decisions: ['Which registry or land portal owns the official search', 'Whether the seller has registered title, power to sell and clean consents', 'Which encumbrances, mortgages, caveats, zoning or acquisition risks remain'],
    checklist: ['Run an official registry search and compare names, parcel ID, size and location', 'Verify survey plan, physical boundaries, zoning and road setbacks', 'Use an escrow or staged payment structure until title transfer evidence is available'],
    redFlags: ['Seller only shows photocopies or screenshots', 'Survey size differs from registry or physical inspection', 'Community, family, stool, chief or occupier claims appear after deposit'],
    sources: ['govZaDeeds', 'ghanaLands', 'ardhisasa'],
    related: [['Survey Cost Estimator', '/tools/survey-cost/'], ['Property Transfer Cost', '/tools/property-transfer-cost/'], ['Building Permit Checklist', '/tools/building-permit/']],
    hubGroup: 'Property Due Diligence',
    icon: '&#x1f4cb;',
    name: 'Land Title Verification Checklist',
    badge: 'Property',
    cardDesc: 'Build a title, survey, seller-authority and encumbrance evidence pack.',
  },
  'building-permit': {
    coverage: 'Building permit checklist',
    title: 'Permit-before-build control list',
    intro: 'Building permit risk is a timing problem. The app should help owners know which drawings, professionals, inspections, zoning approvals and neighbour or estate consents are needed before construction starts.',
    decisions: ['Which authority handles planning, building control, fire, environment and road-access approvals', 'Which registered professionals must stamp drawings', 'Which work can start only after approval, inspection or permit display'],
    checklist: ['Confirm zoning, title and survey before paying for full design', 'Collect architectural, structural, MEP and site plans required by the local authority', 'Track approval number, inspection stages and permit expiry on the project plan'],
    redFlags: ['Contractor starts foundation before permit approval', 'Drawings not signed by required licensed professionals', 'Plot use or setbacks conflict with zoning or estate rules'],
    sources: ['govZaDeeds', 'ghanaLands', 'ardhisasa'],
    related: [['Construction Budget', '/tools/construction-budget/'], ['Survey Cost', '/tools/survey-cost/'], ['Building Materials', '/tools/building-materials/']],
    hubGroup: 'Property Due Diligence',
    icon: '&#x1f3d7;&#xfe0f;',
    name: 'Building Permit Checklist',
    badge: 'Property',
    cardDesc: 'Check zoning, drawings, professional stamps and inspection gates before building.',
  },
  'survey-cost': {
    coverage: 'Survey cost estimator',
    title: 'Survey scope and title-fit check',
    intro: 'A survey quote is only useful when it matches the legal job: beaconing, subdivision, deed plan, mutation, topographic survey, title processing or construction setting-out.',
    decisions: ['Which survey type is needed for purchase, permit, title registration or construction', 'Whether the professional must be licensed by the local surveyor body', 'Which deliverables prove boundaries, area, coordinates and title compatibility'],
    checklist: ['Match survey purpose to title and permit requirements before accepting a quote', 'Ask for deliverables, turnaround time, authority fees and registry submission status', 'Compare survey plan measurements with physical boundaries and land search records'],
    redFlags: ['Surveyor cannot show licence or registration number', 'Price excludes registry, beaconing or transport fees that are essential', 'Coordinates, area or neighbouring parcel details conflict with the title search'],
    sources: ['govZaDeeds', 'ghanaLands', 'ardhisasa'],
    related: [['Land Title Check', '/tools/land-title-check/'], ['Building Permit', '/tools/building-permit/'], ['Plot Size Converter', '/tools/plot-converter/']],
    hubGroup: 'Property Due Diligence',
    icon: '&#x1f4d0;',
    name: 'Land Survey Cost Estimator',
    badge: 'Property',
    cardDesc: 'Match survey quotes to title, permit, boundary and registry deliverables.',
  },
  'property-valuation': {
    coverage: 'Property estimate',
    title: 'Valuation evidence sanity check',
    intro: 'A valuation estimate needs comparable sales, rental yield, title quality, location, condition, services and distress risk. The app should make users question the number, not worship it.',
    decisions: ['Which comparable properties are truly similar by location, title, size and condition', 'Whether the value is for purchase, sale, collateral, insurance, probate or tax', 'How title defects, service-charge arrears, access roads or unfinished permits affect price'],
    checklist: ['Collect three to five recent comparable sales or rental asks', 'Adjust for title, road access, services, floor level, tenure and renovation needs', 'Use a registered valuer for lending, court, tax or estate matters'],
    redFlags: ['Valuation based only on asking prices from listings', 'No adjustment for title risk or unpaid service charges', 'Seller refuses independent inspection or valuer access'],
    sources: ['govZaDeeds', 'ghanaLands', 'ardhisasa'],
    related: [['Rental Yield Calculator', '/tools/rental-yield/'], ['Land Title Check', '/tools/land-title-check/'], ['Property Tax Calculator', '/tools/property-tax/']],
    hubGroup: 'Property Due Diligence',
    icon: '&#x1f3d8;&#xfe0f;',
    name: 'Property Valuation Estimator',
    badge: 'Property',
    cardDesc: 'Pressure-test property value with comparables, title quality and condition risk.',
  },
  'plot-converter': {
    coverage: 'Land measurement converter',
    title: 'Land-size language translator',
    intro: 'Plot sizes are legal and commercial shorthand. The converter should help users translate plots, acres, hectares, square metres, feddan, morgen and local units without confusing physical land with title area.',
    decisions: ['Which unit is used in the title, survey plan, agent advert and local market', 'Whether the advertised plot is standard, half plot, irregular or net-of-setback area', 'Whether conversions affect price per square metre, density or building coverage'],
    checklist: ['Convert all sizes to square metres before comparing prices', 'Compare title area, survey area and physical boundary area', 'Check setbacks, road reserves and easements before assuming buildable area'],
    redFlags: ['Agent says standard plot without dimensions', 'Advertised size differs from survey plan', 'Price comparison ignores unusable setbacks, drainage or access roads'],
    sources: ['govZaDeeds', 'ghanaLands', 'ardhisasa'],
    related: [['Survey Cost', '/tools/survey-cost/'], ['Land Title Check', '/tools/land-title-check/'], ['Property Valuation', '/tools/property-valuation/']],
    hubGroup: 'Property Due Diligence',
    icon: '&#x1f4cf;',
    name: 'Plot Size Converter',
    badge: 'Land',
    cardDesc: 'Convert plot units and catch title, survey and market-size mismatches.',
  },
  'diaspora-property': {
    coverage: 'Diaspora investment model',
    title: 'Remote-buyer control plan',
    intro: 'Diaspora property purchases carry foreign-exchange, agent, title, construction, family, tax and monitoring risks. The app should turn a remote idea into staged verification and release controls.',
    decisions: ['Whether the buyer is purchasing, building, renovating or funding a relative-managed project', 'Which controls stop title, FX, construction and agent-risk leakage', 'Whether rental yield, mortgage scheme or future exit justifies the cash transfer'],
    checklist: ['Use independent title, survey and valuation checks before deposit', 'Stage funds against evidence, not promises or photos alone', 'Track FX rate, transfer fees, tax, service charges and maintenance in one model'],
    redFlags: ['Family or agent refuses independent lawyer or valuer involvement', 'Payments go to personal accounts without receipts or milestones', 'No power of attorney or authority document for the local representative'],
    sources: ['govZaDeeds', 'ghanaLands', 'ardhisasa', 'fmbnNhf'],
    related: [['Land Title Check', '/tools/land-title-check/'], ['Rental Yield Calculator', '/tools/rental-yield/'], ['Power of Attorney', '/tools/power-of-attorney/']],
    hubGroup: 'Property Due Diligence',
    icon: '&#x1f30d;',
    name: 'Diaspora Property Investment Calculator',
    badge: 'Diaspora',
    cardDesc: 'Model FX, title, agent, build and rental risks before sending money home.',
  },
  'property-tax': {
    coverage: 'Property tax model',
    title: 'Property tax exposure map',
    intro: 'Property taxes are not just annual rates. Buyers and owners may face transfer duty, stamp duty, land-use charge, rental income tax, withholding tax, CGT and municipal service fees.',
    decisions: ['Which taxes apply on acquisition, ownership, rental and sale', 'Whether the base is market value, annual rental value, sale price, gain or assessed rateable value', 'Which owner type changes the tax result, such as individual, company, trust or non-resident'],
    checklist: ['Separate buyer costs, annual owner costs, rental taxes and sale taxes', 'Check municipality, state and national taxes because more than one layer may apply', 'Keep valuation, receipts and rental records for future dispute or sale'],
    redFlags: ['Only budgeting for purchase price and legal fees', 'No allowance for municipal arrears or service charges', 'Selling property without checking CGT, withholding or clearance requirements'],
    sources: ['sarsTaxes', 'govZaDeeds', 'ghanaLands'],
    related: [['Stamp Duty Calculator', '/tools/stamp-duty/'], ['Property CGT Calculator', '/tools/property-cgt/'], ['Rental Yield Calculator', '/tools/rental-yield/']],
    hubGroup: 'Property Finance And Returns',
    icon: '&#x1f3e0;',
    name: 'African Property Tax Calculator',
    badge: 'Tax',
    cardDesc: 'Map acquisition, annual, rental and sale taxes before buying or selling.',
  },
  'stamp-duty': {
    coverage: 'Transfer tax calculator',
    title: 'Stamp-duty and transfer-cost split',
    intro: 'Stamp duty sits inside a wider closing-cost stack: registration fees, transfer duty, legal fees, valuation fees, mortgage fees, consent fees and VAT-like charges.',
    decisions: ['Which transaction triggers stamp duty, transfer duty, registration duty or land transfer tax', 'Whether the base is consideration, market value, mortgage amount or lease rent', 'Which exemptions, first-buyer rules or connected-party transfers change the amount'],
    checklist: ['Identify buyer, seller, property type and transaction type before calculating', 'Separate government tax from professional and registry fees', 'Ask who must pay each item under the contract and local practice'],
    redFlags: ['Using sale price where the authority assesses higher market value', 'Ignoring lease stamping or mortgage stamping', 'No tax clearance or consent step before transfer'],
    sources: ['sarsTaxes', 'govZaDeeds', 'ghanaLands'],
    related: [['Property Tax Calculator', '/tools/property-tax/'], ['Property Transfer Cost', '/tools/property-transfer-cost/'], ['Property CGT Calculator', '/tools/property-cgt/']],
    hubGroup: 'Property Finance And Returns',
    icon: '&#x1f3f7;&#xfe0f;',
    name: 'Stamp Duty Calculator',
    badge: 'Tax',
    cardDesc: 'Separate stamp duty, transfer duty, registry fees and professional fees.',
  },
  'property-cgt': {
    coverage: 'Property CGT model',
    title: 'Sale-tax and gain check',
    intro: 'Property sale tax can be based on gain, gross sale price, withholding, non-resident rules or exemptions. The app should force users to preserve purchase and improvement evidence.',
    decisions: ['Whether the country taxes gains, transfer value, rental recapture or non-resident disposals', 'Which costs can increase base cost or reduce gain', 'Whether principal residence, rollover, inflation, holding period or company-owner rules apply'],
    checklist: ['Collect purchase agreement, transfer costs, valuation, improvement invoices and sale costs', 'Check whether tax clearance or withholding is required before registration', 'Model personal, company and non-resident ownership separately'],
    redFlags: ['No proof of original purchase price or improvement costs', 'Assuming owner-occupied property is exempt in every country', 'Distributing sale proceeds before tax clearance or withholding is resolved'],
    sources: ['sarsTaxes', 'govZaDeeds', 'ghanaLands'],
    related: [['Property Tax Calculator', '/tools/property-tax/'], ['Stamp Duty Calculator', '/tools/stamp-duty/'], ['Rental Yield Calculator', '/tools/rental-yield/']],
    hubGroup: 'Property Finance And Returns',
    icon: '&#x1f4b8;',
    name: 'Property Capital Gains Tax',
    badge: 'Tax',
    cardDesc: 'Estimate property sale tax while preserving base-cost and improvement evidence.',
  },
  'rental-yield': {
    coverage: 'Investment return model',
    title: 'Yield after legal and operating costs',
    intro: 'Rental yield is only useful after vacancies, service charges, tax, repairs, management fees, agent commissions, insurance, furnishing and title risk are included.',
    decisions: ['Whether the property is long-let, short-let, commercial, student, serviced apartment or mixed use', 'Which costs are paid monthly, annually, at acquisition or at exit', 'Whether title, occupancy, rent-control or building-compliance risks change the expected return'],
    checklist: ['Calculate gross yield, net yield and cash-on-cash return separately', 'Include vacancy, service charge, tax, insurance, repairs and management fees', 'Compare rental income against sale-tax and exit costs, not just monthly cash flow'],
    redFlags: ['Agent advertises gross yield only', 'No allowance for vacancy, default or eviction time', 'Short-let assumptions ignore licensing, platform fees and seasonality'],
    sources: ['govZaDeeds', 'ghanaLands', 'ardhisasa'],
    related: [['Short-Let Calculator', '/tools/short-let-calc/'], ['Property Management Fees', '/tools/property-mgmt-fees/'], ['Service Charge Calculator', '/tools/service-charge/']],
    hubGroup: 'Property Finance And Returns',
    icon: '&#x1f4c8;',
    name: 'Rental Yield Calculator',
    badge: 'ROI',
    cardDesc: 'Move beyond gross yield into tax, vacancy, fees, repairs and exit costs.',
  },
  'rent-affordability': {
    coverage: 'Tenant affordability model',
    title: 'Move-in cost and income-stress check',
    intro: 'Rent affordability in African cities is often about cash timing, not just monthly rent. Advance rent, deposits, agency fees, service charge, utilities and transport must fit the household.',
    decisions: ['How many months of rent are paid upfront', 'Which deposits, service charges, utilities, agent fees and moving costs are due before entry', 'Whether income volatility or currency risk affects the safe rent ceiling'],
    checklist: ['Calculate move-in cash separately from monthly affordability', 'Stress-test rent against income loss, transport and school-fee months', 'Keep receipts and agreement payment schedule aligned'],
    redFlags: ['Rent looks affordable monthly but consumes all savings upfront', 'Service charge and generator diesel excluded from the rent conversation', 'Payment made before title, landlord authority or unit condition is verified'],
    sources: ['govZaDeeds', 'ghanaLands', 'ardhisasa'],
    related: [['Tenancy Deposit', '/tools/tenancy-deposit/'], ['Tenancy Agreement', '/tools/tenancy-agreement/'], ['Budget Planner', '/tools/budget-planner/']],
    hubGroup: 'Property Finance And Returns',
    icon: '&#x1f3e1;',
    name: 'Rent Affordability Calculator',
    badge: 'Tenant',
    cardDesc: 'Calculate move-in cash, monthly stress and hidden housing costs together.',
  },
  'tenant-screening': {
    coverage: 'Landlord screening checklist',
    title: 'Tenant-risk and fairness check',
    intro: 'Tenant screening should protect the landlord without collecting excessive personal data or creating discriminatory practices. The output should be evidence-based and privacy-aware.',
    decisions: ['Which identity, income, employment, guarantor and reference checks are proportionate', 'Whether credit, police or employer checks are lawful and consented to', 'Which red flags need more evidence rather than automatic rejection'],
    checklist: ['Ask only for documents needed for the rental decision', 'Record consent, verification result and retention period for personal data', 'Use the same screening steps for comparable applicants to reduce discrimination risk'],
    redFlags: ['Collecting ID, payslips and bank statements with no retention or security plan', 'Accepting screenshots that cannot be verified', 'Rejecting applicants based on protected characteristics or informal bias'],
    sources: ['inforeg', 'ndpcHome', 'odpcFaq'],
    related: [['POPIA Checker', '/tools/popia-checker/'], ['Privacy Policy Generator', '/tools/privacy-policy-gen/'], ['Rental Agreement', '/tools/rental-agreement/']],
    hubGroup: 'Property Finance And Returns',
    icon: '&#x1f50e;',
    name: 'Tenant Screening Checklist',
    badge: 'Landlord',
    cardDesc: 'Screen tenants with proportionate evidence and privacy-aware records.',
  },
  'rent-intelligence': {
    coverage: 'Contributor rent data',
    title: 'Rent-market evidence check',
    intro: 'Rent intelligence is useful only when listing data is moderated, dated, neighbourhood-specific and separated from actual signed rents. The page should make freshness and source quality obvious.',
    decisions: ['Whether a number is asking rent, achieved rent, renewal rent or service-charge-inclusive rent', 'Which neighbourhood, property type and furnishing level make the comparison fair', 'Whether the data is fresh enough for negotiation or underwriting'],
    checklist: ['Compare at least three recent records from the same neighbourhood and property type', 'Separate rent, service charge, utilities and agency fees', 'Use the evidence to negotiate, not as a guaranteed market value'],
    redFlags: ['One viral listing treated as the market', 'No date, location precision or property condition attached to a rent record', 'Service charge and generator costs hidden outside the rent figure'],
    sources: ['govZaDeeds', 'ghanaLands', 'ardhisasa'],
    related: [['Rent Affordability', '/tools/rent-affordability/'], ['Rental Yield', '/tools/rental-yield/'], ['Lease Risk Check', '/tools/lease-risk-check/']],
    hubGroup: 'Property Finance And Returns',
    icon: '&#x1f4ca;',
    name: 'Rent Intelligence',
    badge: 'Market',
    cardDesc: 'Use moderated, dated rent evidence for negotiation and underwriting.',
  },
  'lease-risk-check': {
    coverage: 'Nigeria-first lease risk',
    title: 'Lease scam and authority screen',
    intro: 'A lease-risk checker should focus on authority, payment path, document consistency, property access, title evidence and pressure tactics before a tenant transfers money.',
    decisions: ['Whether the person collecting money has authority from the owner', 'Whether lease, ID, bank account, title and inspection evidence agree', 'Which risk signals require lawyer, landlord or registry verification before payment'],
    checklist: ['Inspect the property and confirm keys, access and occupancy status', 'Verify landlord, agent authority and payment account name', 'Use staged payment or escrow when title, identity or possession evidence is weak'],
    redFlags: ['Urgent payment demand before inspection or document review', 'Agent bank account does not match landlord or firm name', 'Multiple tenants shown the same unit with no signed handover process'],
    sources: ['govZaDeeds', 'ghanaLands', 'ardhisasa'],
    related: [['Tenancy Agreement', '/tools/tenancy-agreement/'], ['Tenant Screening', '/tools/tenant-screening/'], ['Land Title Check', '/tools/land-title-check/']],
    hubGroup: 'Property Finance And Returns',
    icon: '&#x1f6a8;',
    name: 'Lease Risk Check',
    badge: 'Nigeria',
    cardDesc: 'Screen lease authority, payment path and document consistency before deposit.',
  },
  'property-mgmt-fees': {
    coverage: 'Management fee model',
    title: 'Letting and management fee audit',
    intro: 'Management fees are often split across letting fee, renewal fee, rent collection, maintenance mark-up, vacancy cost and VAT. The app should turn a headline percentage into annual cost.',
    decisions: ['Which fee is one-off, recurring, renewal-based or maintenance-linked', 'Whether VAT, withholding, service charge handling or owner statements are included', 'Whether incentives push the manager toward vacancy, high repairs or short leases'],
    checklist: ['Convert all fees to an annual owner cost', 'Check authority to approve repairs, collect rent and deduct expenses', 'Require monthly statements, invoice copies and arrears process in the mandate'],
    redFlags: ['Low management fee offset by high maintenance mark-up', 'No cap on repairs the manager can approve', 'No separate client account or rent-remittance deadline'],
    sources: ['govZaDeeds', 'ghanaLands', 'ardhisasa'],
    related: [['Rental Yield', '/tools/rental-yield/'], ['Agent Commission', '/tools/agent-commission/'], ['Service Charge', '/tools/service-charge/']],
    hubGroup: 'Property Finance And Returns',
    icon: '&#x1f3e2;',
    name: 'Property Management Fee Calculator',
    badge: 'Landlord',
    cardDesc: 'Convert letting, renewal, VAT and management charges into annual owner cost.',
  },
  'building-materials': {
    coverage: 'Construction cost model',
    title: 'Materials price and procurement risk check',
    intro: 'Material estimates must include grade, wastage, transport, theft, price volatility, supplier reliability and the difference between structural and finishing materials.',
    decisions: ['Which materials are structural, finishing, services or provisional items', 'Whether prices include delivery, loading, offloading and wastage', 'Which items need engineer, architect or quantity-surveyor confirmation before purchase'],
    checklist: ['Lock specification and quantities before comparing supplier prices', 'Add wastage, transport, storage and theft controls to the budget', 'Keep delivery notes, batch numbers and receipts for quality disputes'],
    redFlags: ['Cheapest cement, steel or blocks with no grade verification', 'Buying bulk before drawings and BOQ are final', 'No site storage plan for high-theft materials'],
    sources: ['govZaDeeds', 'ghanaLands', 'ardhisasa'],
    related: [['Construction Budget', '/tools/construction-budget/'], ['BOQ Generator', '/tools/boq-generator/'], ['Building Permit', '/tools/building-permit/']],
    hubGroup: 'Property Finance And Returns',
    icon: '&#x1f9f1;',
    name: 'Building Material Cost Estimator',
    badge: 'Build',
    cardDesc: 'Estimate materials with specification, wastage, transport and quality controls.',
  },
  'construction-budget': {
    coverage: 'Construction budget planner',
    title: 'Build-budget phase control',
    intro: 'A house budget should be phased by approvals, site works, structure, roofing, services, finishes, external works, contingency and professional fees, not just cost per square metre.',
    decisions: ['Whether the estimate is concept, permit, tender, contract or site-control level', 'Which professionals, approvals and inspections must be budgeted before construction', 'How contingency, inflation and variation orders are controlled'],
    checklist: ['Separate land, approvals, professional fees, structure, finishes and external works', 'Hold contingency outside contractor control', 'Tie payments to inspected milestones, not calendar promises'],
    redFlags: ['Budget excludes approvals, professional fees, utilities or external works', 'No written variation process', 'Contractor controls both measurement and payment approval'],
    sources: ['govZaDeeds', 'ghanaLands', 'ardhisasa'],
    related: [['Building Materials', '/tools/building-materials/'], ['Building Permit', '/tools/building-permit/'], ['Development Feasibility', '/tools/dev-feasibility/']],
    hubGroup: 'Property Finance And Returns',
    icon: '&#x1f3d7;&#xfe0f;',
    name: 'House Construction Budget Planner',
    badge: 'Build',
    cardDesc: 'Phase construction cost by approvals, structure, finishes, fees and contingency.',
  },
  'dev-feasibility': {
    coverage: 'Development feasibility model',
    title: 'Development go/no-go discipline',
    intro: 'Feasibility should decide whether to buy, build, pause or renegotiate. It must connect land cost, approvals, finance, build cost, sales velocity, taxes and downside scenarios.',
    decisions: ['Whether the project works under base, delay and cost-overrun cases', 'Which approvals or title issues could block finance or sales', 'Whether margin survives VAT, CGT, transfer costs, agent fees and interest'],
    checklist: ['Model gross development value, total development cost, finance cost and contingency separately', 'Stress-test delays, lower selling prices and slower absorption', 'Confirm title, zoning, density and permits before land acquisition'],
    redFlags: ['Profit depends on perfect sales pace and no cost overruns', 'Land is bought before zoning or title risk is cleared', 'Finance interest ignored during approval or sales delay'],
    sources: ['govZaDeeds', 'ghanaLands', 'ardhisasa'],
    related: [['Construction Budget', '/tools/construction-budget/'], ['Property Valuation', '/tools/property-valuation/'], ['Off-Plan vs Ready', '/tools/offplan-vs-ready/']],
    hubGroup: 'Property Finance And Returns',
    icon: '&#x1f4ca;',
    name: 'Property Development Feasibility',
    badge: 'ROI',
    cardDesc: 'Stress-test land, approvals, build cost, finance, tax and sales velocity.',
  },
  'service-charge': {
    coverage: 'Service charge model',
    title: 'Estate and body-corporate cost check',
    intro: 'Service charge can make a property unaffordable even when rent or mortgage works. The app should identify security, generator, water, lifts, waste, insurance, sinking fund and arrears exposure.',
    decisions: ['Which costs are fixed, variable, metered, reserve-fund or one-off special levy', 'Whether the owner, tenant or association pays each line', 'Whether arrears or weak management make services unreliable'],
    checklist: ['Ask for the latest budget, audited accounts and arrears statement', 'Separate routine service charge from sinking fund and special levies', 'Check generator, water, security and waste costs against actual service quality'],
    redFlags: ['Low advertised rent but high uncapped service charge', 'No audited accounts or owner association minutes', 'Large arrears that may become a special levy after purchase'],
    sources: ['govZaDeeds', 'ghanaLands', 'ardhisasa'],
    related: [['Rent Affordability', '/tools/rent-affordability/'], ['Rental Yield', '/tools/rental-yield/'], ['Property Management Fees', '/tools/property-mgmt-fees/']],
    hubGroup: 'Property Finance And Returns',
    icon: '&#x1f6e0;&#xfe0f;',
    name: 'Property Service Charge Calculator',
    badge: 'Property',
    cardDesc: 'Estimate estate, strata and body-corporate costs before signing or buying.',
  },
  'short-let-calc': {
    coverage: 'Short-let return model',
    title: 'Short-let return and licensing check',
    intro: 'Short-let income needs occupancy, platform fees, cleaning, furnishing, utilities, management, tax, damage, seasonality and local permission checks before it beats long-let rent.',
    decisions: ['Whether short-let use is allowed by lease, estate rules, municipality or building body', 'Which nightly rate and occupancy are realistic by season', 'How cleaning, utilities, furnishing, platform fees and management affect net return'],
    checklist: ['Compare short-let, long-let and vacant-month scenarios', 'Check building, estate and local rules before listing', 'Budget furnishing replacement, cleaning supervision, utilities and platform commissions'],
    redFlags: ['Return model assumes high occupancy all year', 'No permission from landlord, body corporate or estate manager', 'Tax and platform fees ignored because income is paid digitally'],
    sources: ['govZaDeeds', 'ghanaLands', 'ardhisasa'],
    related: [['Rental Yield', '/tools/rental-yield/'], ['Service Charge', '/tools/service-charge/'], ['Property Management Fees', '/tools/property-mgmt-fees/']],
    hubGroup: 'Property Finance And Returns',
    icon: '&#x1f6cf;&#xfe0f;',
    name: 'Short-Let Income Calculator',
    badge: 'Short-let',
    cardDesc: 'Compare Airbnb-style income against occupancy, fees, tax and permission risk.',
  },
  'agent-commission': {
    coverage: 'Agent fee calculator',
    title: 'Commission and mandate check',
    intro: 'Agent fees should be tied to mandate, service, timing, tax and who pays. Buyers, sellers, landlords and tenants need to know when commission is earned and whether double billing is possible.',
    decisions: ['Whether the agent represents seller, buyer, landlord, tenant or both sides', 'Which fee is commission, viewing fee, legal fee, agreement fee or renewal fee', 'When commission becomes due and what happens if the deal collapses'],
    checklist: ['Get the mandate or authority letter before paying', 'Write who pays commission, when it is earned and whether VAT applies', 'Compare fee against local custom, property value and actual service delivered'],
    redFlags: ['Agent collects from both sides without disclosure', 'Viewing or inspection fee demanded with no authority evidence', 'Commission due even if title, finance or landlord approval fails'],
    sources: ['govZaDeeds', 'ghanaLands', 'ardhisasa'],
    related: [['Property Management Fees', '/tools/property-mgmt-fees/'], ['Rental Agreement', '/tools/rental-agreement/'], ['Land Title Check', '/tools/land-title-check/']],
    hubGroup: 'Property Finance And Returns',
    icon: '&#x1f91d;',
    name: 'Real Estate Agent Commission',
    badge: 'Property',
    cardDesc: 'Check who pays commission, when it is earned and whether authority exists.',
  },
  'offplan-vs-ready': {
    coverage: 'Property purchase comparator',
    title: 'Delivery-risk and opportunity-cost check',
    intro: 'Off-plan discounts only matter if construction, title, developer, financing and delivery risk are priced. Ready property has less delivery risk but may have hidden defects or weaker upside.',
    decisions: ['Whether the discount compensates for delay, developer default and lost rental income', 'Which approvals, escrow controls and title structure protect the buyer', 'Whether ready-property inspection, valuation and service-charge risk are cleaner'],
    checklist: ['Compare total cost, expected completion date, rental income foregone and financing cost', 'Review developer track record, permits, title, escrow and refund clauses', 'Inspect ready property for defects, arrears and occupancy status'],
    redFlags: ['Off-plan payments made with no escrow or construction milestone evidence', 'Developer has no completed comparable project', 'Ready property has service-charge arrears, defects or title gaps'],
    sources: ['govZaDeeds', 'ghanaLands', 'ardhisasa'],
    related: [['Development Feasibility', '/tools/dev-feasibility/'], ['Property Valuation', '/tools/property-valuation/'], ['Rental Yield', '/tools/rental-yield/']],
    hubGroup: 'Property Finance And Returns',
    icon: '&#x1f3d7;&#xfe0f;',
    name: 'Off-Plan vs Ready Comparator',
    badge: 'Buyer',
    cardDesc: 'Price delivery risk, lost rent, defects and title safety before choosing.',
  },
  'ng-nhf': {
    coverage: 'Housing fund programmes',
    title: 'Housing-fund eligibility and cash-flow check',
    intro: 'Housing funds can reduce financing cost, but eligibility, contribution history, property value caps, approved lenders and processing time decide whether the scheme fits the buyer.',
    decisions: ['Whether the buyer meets contribution, income, property and lender criteria', 'How much equity, mortgage repayment and statutory deduction are required', 'Whether the programme timeline fits the purchase or construction plan'],
    checklist: ['Verify eligibility and contribution history with the official scheme or lender', 'Compare subsidised loan result against market mortgage and cash purchase options', 'Keep employer, contribution, property and lender documents ready before application'],
    redFlags: ['Assuming every contributor automatically gets a loan', 'Property price or location falls outside programme rules', 'Seller deadline is shorter than the fund approval timeline'],
    sources: ['fmbnNhf', 'fmbnProducts', 'ghanaNhf'],
    related: [['Mortgage Calculator', '/mortgage/'], ['Rent vs Buy', '/tools/rent-vs-buy/'], ['Diaspora Property', '/tools/diaspora-property/']],
    hubGroup: 'Property Finance And Returns',
    icon: '&#x1f3e6;',
    name: 'Africa Housing Fund Calculator',
    badge: 'Housing',
    cardDesc: 'Check housing-fund eligibility, equity, deductions, caps and lender timing.',
  },
};

const allProfiles = { ...profiles, ...extraLegalProfiles };
const TOTAL_LEGAL_APPS = Object.keys(allProfiles).length;

function htmlEscape(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function jsonForScript(value) {
  return JSON.stringify(value)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}

function list(items) {
  return items.map((item) => `<li>${htmlEscape(item)}</li>`).join('');
}

function links(items) {
  return items.map(([label, href]) => `<a href="${htmlEscape(href)}">${htmlEscape(label)}</a>`).join('');
}

function sources(keys) {
  return keys.map((key) => {
    const src = sourceBank[key];
    if (!src) throw new Error(`Unknown source key: ${key}`);
    return `<a href="${htmlEscape(src[1])}" target="_blank" rel="noopener">${htmlEscape(src[0])}</a>`;
  }).join('');
}

function sourceText(keys) {
  return keys.map((key) => {
    const src = sourceBank[key];
    if (!src) throw new Error(`Unknown source key: ${key}`);
    return `- ${src[0]}: ${src[1]}`;
  }).join('\n');
}

function competitorKey(slug, profile) {
  const text = `${slug} ${profile.hubGroup || ''} ${profile.title}`.toLowerCase();
  if (/(tenancy|rental|rent|tenant|lease)/.test(slug)) return 'property';
  if (/(privacy|data|cookie|consent|breach|dpa|dpia|popia|ndpa|gdpr|transfer)/.test(text)) return 'privacy';
  if (/(employment|worker|contractor|minimum wage|leave|overtime|staff|labour|labor)/.test(text)) return 'employment';
  if (/(visa|passport|travel|vaccination|immigration)/.test(text)) return 'travel';
  if (/(property|tenancy|rental|rent|tenant|lease|land|title|building|survey|valuation|short-let|housing|mortgage|construction|agent|deposit|service charge|plot)/.test(text)) return 'property';
  if (/(nda|agreement|contract|resolution|shareholder|partnership|template|clause)/.test(text)) return 'documents';
  if (/(will|estate|inheritance|divorce|child|bail|court|legal aid|affidavit|statutory|power of attorney|maintenance)/.test(text)) return 'personal';
  return 'company';
}

function competitorInsight(slug, profile) {
  return competitorMatrix[competitorKey(slug, profile)] || competitorMatrix.documents;
}

function competitorImplementation(slug, profile) {
  const nextTool = profile.related && profile.related[0] ? profile.related[0][0] : 'the next linked tool';
  return [
    `This page now asks for matter, country or regime, date, status, evidence and risk flags before the user exports a note.`,
    `The app-specific checklist is not generic: it starts with "${profile.checklist[0]}".`,
    `Saved workflows can be resumed from the dashboard and handed off to ${nextTool} when the matter naturally continues.`,
    `The PDF/export moment is a value-after-result gate, so users can still use the tool first and only share email when saving the report.`,
  ];
}

function buildWorkflowConfig(slug, profile) {
  const competitor = competitorInsight(slug, profile);
  return {
    slug,
    title: profile.name ? profile.name.replace(/&#x?[0-9a-f]+;|&[a-z]+;/gi, '').trim() || titleCase(slug) : titleCase(slug),
    workflowTitle: profile.title,
    coverage: profile.coverage,
    decision: profile.decisions[0],
    evidence: profile.checklist,
    redFlags: profile.redFlags,
    related: (profile.related || []).slice(0, 4).map(([label, href]) => ({ label, href })),
    competitor: {
      group: competitorKey(slug, profile),
      label: competitor.label,
      patterns: competitor.patterns,
      implemented: competitorImplementation(slug, profile),
    },
  };
}

function buildUpgrade(profile) {
  return [
    '<!-- LEGAL-DEEP-IMPROVEMENT:START -->',
    '<section class="leg-upgrade" aria-labelledby="legal-upgrade-heading">',
    `  <div class="leg-upgrade-kicker">Reviewed ${htmlEscape(REVIEW_DATE)} · ${htmlEscape(profile.coverage)}</div>`,
    `  <h2 id="legal-upgrade-heading">${htmlEscape(profile.title)}</h2>`,
    `  <p>${htmlEscape(profile.intro)}</p>`,
    '  <div class="leg-upgrade-grid">',
    '    <div class="leg-upgrade-block">',
    '      <h3>Decisions this clarifies</h3>',
    `      <ul>${list(profile.decisions)}</ul>`,
    '    </div>',
    '    <div class="leg-upgrade-block">',
    '      <h3>Before you rely on it</h3>',
    `      <ul>${list(profile.checklist)}</ul>`,
    '    </div>',
    '    <div class="leg-upgrade-block warning">',
    '      <h3>Red flags</h3>',
    `      <ul>${list(profile.redFlags)}</ul>`,
    '    </div>',
    '  </div>',
    '  <div class="leg-source-row">',
    '    <div>',
    '      <span>Primary checks</span>',
    `      <div class="leg-source-links">${sources(profile.sources)}</div>`,
    '    </div>',
    '    <div>',
    '      <span>Next best tools</span>',
    `      <div class="leg-source-links internal">${links(profile.related)}</div>`,
    '    </div>',
    '  </div>',
    '</section>',
    '<!-- LEGAL-DEEP-IMPROVEMENT:END -->',
    '',
  ].join('\n');
}

function buildCompetitorUpgrade(slug, profile) {
  const insight = competitorInsight(slug, profile);
  const implemented = competitorImplementation(slug, profile);
  return [
    '<!-- LEGAL-COMPETITOR-CHECK:START -->',
    '<section class="leg-competitor" aria-labelledby="legal-competitor-heading">',
    `  <div class="leg-action-kicker">Competitor check - ${htmlEscape(COMPETITOR_REVIEW_DATE)}</div>`,
    '  <div class="leg-competitor-head">',
    `    <h2 id="legal-competitor-heading">What stronger tools teach this app</h2>`,
    `    <p>Benchmarked against ${htmlEscape(insight.label)}. The goal is not to copy them; it is to bring the useful workflow pattern into an Africa-first tool with official-source caution and local evidence capture.</p>`,
    '  </div>',
    '  <div class="leg-competitor-grid">',
    '    <div>',
    '      <h3>Observed feature pattern</h3>',
    `      <ul>${list(insight.patterns)}</ul>`,
    '    </div>',
    '    <div>',
    '      <h3>Implemented on this app</h3>',
    `      <ul>${list(implemented)}</ul>`,
    '    </div>',
    '    <div>',
    '      <h3>Best next move</h3>',
    `      <ul>${list([
      profile.decisions[0],
      profile.checklist[0],
      profile.redFlags[0],
    ])}</ul>`,
    '    </div>',
    '  </div>',
    '</section>',
    '<!-- LEGAL-COMPETITOR-CHECK:END -->',
    '',
  ].join('\n');
}

function buildWorkflowCopilot(slug, profile) {
  const config = buildWorkflowConfig(slug, profile);
  const related = config.related.length
    ? config.related.map((item) => `<a href="${htmlEscape(item.href)}">${htmlEscape(item.label)}</a>`).join('')
    : '<a href="/legal/">Back to legal hub</a>';
  return [
    '<!-- LEGAL-WORKFLOW-COPILOT:START -->',
    '<section class="leg-workflow-copilot" aria-labelledby="legal-workflow-heading">',
    `  <script type="application/json" class="leg-workflow-data">${jsonForScript(config)}</script>`,
    '  <div class="leg-workflow-head">',
    '    <span class="leg-action-kicker">Case workspace</span>',
    '    <h2 id="legal-workflow-heading">Build, save and export this legal workflow</h2>',
    `    <p>This workspace turns the ${htmlEscape(profile.title.toLowerCase())} result into a reusable matter note, dashboard item and gated PDF checklist. Use the app first, then save the evidence trail.</p>`,
    '  </div>',
    '  <div class="leg-workflow-grid">',
    '    <label class="leg-field"><span class="leg-f-label">Matter or project</span><input class="leg-f-input" data-workflow-field="matter" type="text" placeholder="e.g. Supplier DPA review"></label>',
    '    <label class="leg-field"><span class="leg-f-label">Country or regime</span><input class="leg-f-input" data-workflow-field="country" type="text" placeholder="e.g. Kenya, NDPA, Lagos"></label>',
    '    <label class="leg-field"><span class="leg-f-label">Target date</span><input class="leg-f-input" data-workflow-field="date" type="date"></label>',
    '    <label class="leg-field"><span class="leg-f-label">Status</span><select class="leg-f-select" data-workflow-field="status"><option>Checking evidence</option><option>Ready to verify</option><option>Waiting on official source</option><option>Escalate before action</option></select></label>',
    '  </div>',
    '  <div class="leg-workflow-columns">',
    '    <div>',
    '      <h3 class="leg-mini-heading">Evidence checked</h3>',
    '      <div class="leg-workflow-checklist" data-workflow-evidence-list></div>',
    '    </div>',
    '    <div>',
    '      <h3 class="leg-mini-heading">Risk flags</h3>',
    '      <div class="leg-workflow-checklist warning" data-workflow-risk-list></div>',
    '    </div>',
    '  </div>',
    '  <label class="leg-field full"><span class="leg-f-label">Private notes</span><textarea class="leg-f-textarea" data-workflow-field="note" placeholder="Add facts, missing documents, portal references, lawyer comments, or next actions."></textarea></label>',
    '  <div class="leg-workflow-summary" data-workflow-summary></div>',
    '  <div class="leg-workflow-actions">',
    '    <button type="button" class="leg-copy-btn" data-workflow-build>Build handoff note</button>',
    '    <button type="button" class="leg-secondary-btn" data-workflow-save>Save to dashboard</button>',
    '    <button type="button" class="leg-secondary-btn" data-workflow-load>Load saved</button>',
    '    <a class="leg-secondary-btn" href="/dashboard/">Open dashboard</a>',
    '  </div>',
    '  <textarea class="leg-output leg-workflow-output" data-workflow-output readonly></textarea>',
    '  <form class="leg-pdf-gate" data-workflow-gate novalidate>',
    '    <div>',
    '      <span class="leg-action-kicker">PDF gate</span>',
    '      <h3>Email the checklist and unlock print/PDF</h3>',
    '      <p>The core tool stays free. The deeper PDF pack captures email only when the user wants a portable report, checklist and dashboard reminder.</p>',
    '    </div>',
    '    <label class="leg-field"><span class="leg-f-label">Email</span><input class="leg-f-input" data-workflow-field="email" data-workflow-email type="email" autocomplete="email" placeholder="you@example.com"></label>',
    '    <label class="leg-workflow-optin"><input type="checkbox" data-workflow-optin checked><span>Send me occasional AfroTools legal checklist updates.</span></label>',
    '    <div class="leg-workflow-actions compact">',
    '      <button type="submit" class="leg-copy-btn" data-workflow-pdf-gate>Email checklist + unlock PDF</button>',
    '      <button type="button" class="leg-secondary-btn" data-workflow-print>Print or save PDF</button>',
    '      <button type="button" class="leg-secondary-btn" data-workflow-copy>Copy handoff note</button>',
    '    </div>',
    '    <div class="leg-gate-status" data-workflow-gate-status></div>',
    '  </form>',
    '  <div class="leg-workflow-next">',
    '    <span>Continue workflow</span>',
    `    <div>${related}</div>`,
    '  </div>',
    '</section>',
    '<!-- LEGAL-WORKFLOW-COPILOT:END -->',
    '',
  ].join('\n');
}

function buildActionCopy(slug, profile) {
  return [
    `${profile.title} action pack`,
    `Tool: ${slug}`,
    `Coverage: ${profile.coverage}`,
    '',
    'Result to save:',
    `- Country or regime selected, parties involved, dates, amounts, and the generated output from the app.`,
    `- The reason this output was prepared: ${profile.decisions[0]}.`,
    '',
    'Evidence to attach:',
    ...profile.checklist.map((item) => `- ${item}`),
    '',
    'Escalate before filing or signing if:',
    ...profile.redFlags.map((item) => `- ${item}`),
    '',
    'Primary checks:',
    sourceText(profile.sources),
    '',
    `Reviewed by AfroTools workflow on ${REVIEW_DATE}. Informational only, not legal advice.`,
  ].join('\n');
}

function buildActionPack(slug, profile) {
  return [
    '<!-- LEGAL-ACTION-PACK:START -->',
    '<section class="leg-action-pack" aria-labelledby="legal-action-pack-heading">',
    '  <div class="leg-action-head">',
    '    <span class="leg-action-kicker">Review pack</span>',
    `    <h2 id="legal-action-pack-heading">Save the ${htmlEscape(profile.title.toLowerCase())} trail</h2>`,
    '    <p>Before filing, signing, publishing, or sending anything, keep a short record that links the app result to evidence and official-source checks.</p>',
    '  </div>',
    '  <div class="leg-action-grid">',
    '    <div>',
    '      <h3>Capture</h3>',
    `      <p>Save the country or regime, parties, dates, amounts, selected options, and final output. Add why this matters: ${htmlEscape(profile.decisions[0])}.</p>`,
    '    </div>',
    '    <div>',
    '      <h3>Attach</h3>',
    `      <p>${htmlEscape(profile.checklist[0])}. Also keep the strongest supporting document, receipt, portal reference, ID, contract, policy, or court file beside the generated result.</p>`,
    '    </div>',
    '    <div>',
    '      <h3>Escalate</h3>',
    `      <p>If you see this risk, pause and get qualified help: ${htmlEscape(profile.redFlags[0])}.</p>`,
    '    </div>',
    '  </div>',
    '  <label class="leg-action-copy-label">Copyable review note</label>',
    `  <textarea class="leg-action-copy-text" readonly>${htmlEscape(buildActionCopy(slug, profile))}</textarea>`,
    '  <div class="leg-action-copy-row">',
    '    <button type="button" class="leg-action-copy-btn" data-legal-copy-action>Copy review pack</button>',
    '    <span>Paste this into your matter file, compliance folder, board pack, or lawyer handoff.</span>',
    '  </div>',
    '</section>',
    '<!-- LEGAL-ACTION-PACK:END -->',
    '',
  ].join('\n');
}

function upsertMarkedSection(html, section, start, end, fallbackMarkers) {
  let base = html;
  const startIdx = html.indexOf(start);
  if (startIdx !== -1) {
    const endIdx = html.indexOf(end, startIdx);
    if (endIdx === -1) throw new Error(`Found ${start} without ${end}`);
    let after = html.slice(endIdx + end.length);
    if (after.startsWith('\r\n')) after = after.slice(2);
    else if (after.startsWith('\n')) after = after.slice(1);
    base = html.slice(0, startIdx) + after;
  }

  const marker = fallbackMarkers
    .map((m) => ({ m, idx: m.toLowerCase() === '</body>' ? base.toLowerCase().lastIndexOf('</body>') : base.indexOf(m) }))
    .filter((x) => x.idx !== -1)
    .sort((a, b) => a.idx - b.idx)[0];
  if (!marker) throw new Error('No insertion marker found');
  return base.slice(0, marker.idx) + section + base.slice(marker.idx);
}

function upsertSection(html, section) {
  return upsertMarkedSection(
    html,
    section,
    '<!-- LEGAL-DEEP-IMPROVEMENT:START -->',
    '<!-- LEGAL-DEEP-IMPROVEMENT:END -->',
    ['<section class="leg-seo"', '<div class="leg-seo"', '<div class="leg-faq"', '<afro-related-tools', '<afro-newsletter-cta', '<afro-footer', '</main>', '</body>']
  );
}

function upsertActionPack(html, section) {
  return upsertMarkedSection(
    html,
    section,
    '<!-- LEGAL-ACTION-PACK:START -->',
    '<!-- LEGAL-ACTION-PACK:END -->',
    ['<section class="leg-seo"', '<div class="leg-seo"', '<div class="leg-faq"', '<afro-related-tools', '<afro-newsletter-cta', '<afro-footer', '</main>', '</body>']
  );
}

function upsertCompetitorCheck(html, section) {
  return upsertMarkedSection(
    html,
    section,
    '<!-- LEGAL-COMPETITOR-CHECK:START -->',
    '<!-- LEGAL-COMPETITOR-CHECK:END -->',
    ['<!-- LEGAL-ACTION-PACK:START -->', '<!-- LEGAL-DEEP-IMPROVEMENT:START -->', '<section class="leg-seo"', '<div class="leg-seo"', '<afro-related-tools', '<afro-footer', '</main>', '</body>']
  );
}

function upsertWorkflowCopilot(html, section) {
  return upsertMarkedSection(
    html,
    section,
    '<!-- LEGAL-WORKFLOW-COPILOT:START -->',
    '<!-- LEGAL-WORKFLOW-COPILOT:END -->',
    ['<!-- LEGAL-DEEP-IMPROVEMENT:START -->', '<section class="leg-seo"', '<div class="leg-seo"', '<afro-related-tools', '<afro-footer', '</main>', '</body>']
  );
}

function ensureEnhancementCss(html) {
  const href = '/assets/css/legal-enhancements.css';
  if (html.includes(href)) return html;
  const legalCss = /<link rel="stylesheet" href="\/assets\/css\/legal\.css[^"]*">/;
  if (legalCss.test(html)) {
    return html.replace(legalCss, (match) => `${match}\n<link rel="stylesheet" href="${href}">`);
  }
  return html.replace('</head>', `<link rel="stylesheet" href="${href}">\n</head>`);
}

function ensureActionCopyScript(html) {
  if (html.includes('id="legal-action-copy-script"')) return html;
  const script = [
    '<script id="legal-action-copy-script">',
    '(function(){',
    "  document.addEventListener('click', function(event) {",
    "    var button = event.target.closest('[data-legal-copy-action]');",
    '    if (!button) return;',
    "    var section = button.closest('.leg-action-pack');",
    "    var area = section && section.querySelector('.leg-action-copy-text');",
    '    if (!area) return;',
    '    var original = button.textContent;',
    '    var done = function(){ button.textContent = "Copied"; setTimeout(function(){ button.textContent = original; }, 1800); };',
    '    var fallback = function(){ area.focus(); area.select(); try { document.execCommand("copy"); done(); } catch (err) { button.textContent = "Select text manually"; } };',
    '    if (navigator.clipboard && navigator.clipboard.writeText) { navigator.clipboard.writeText(area.value).then(done).catch(fallback); } else { fallback(); }',
    '  });',
    '}());',
    '</script>',
  ].join('\n');
  const closingBody = html.toLowerCase().lastIndexOf('</body>');
  if (closingBody !== -1) return html.slice(0, closingBody) + `${script}\n` + html.slice(closingBody);
  return `${html}\n${script}\n`;
}

function ensureWorkflowScript(html) {
  const src = '/assets/js/legal-workflow-copilot.js';
  if (html.includes(src)) return html;
  const tag = `<script src="${src}" defer></script>`;
  const closingBody = html.toLowerCase().lastIndexOf('</body>');
  if (closingBody !== -1) return html.slice(0, closingBody) + `${tag}\n` + html.slice(closingBody);
  return `${html}\n${tag}\n`;
}

function repairCopyScriptInsidePrintWindow(html) {
  const injectedStart = `+'</pre><script id="legal-action-copy-script">`;
  const start = html.indexOf(injectedStart);
  if (start === -1) return html;

  const afterPre = start + `+'</pre>`.length;
  const lfEnd = '</script>\n</body></html>';
  const crlfEnd = '</script>\r\n</body></html>';
  let end = html.indexOf(lfEnd, afterPre);
  let marker = lfEnd;
  if (end === -1) {
    end = html.indexOf(crlfEnd, afterPre);
    marker = crlfEnd;
  }
  if (end === -1) return html;

  return html.slice(0, afterPre) + '</body></html>' + html.slice(end + marker.length);
}

function repairGeneratedPrintHtmlLeaks(html) {
  let next = html.replace(/\n<meta property="article:modified_time" content="2026-03-28">\r?\n/g, (match, offset) => {
    const before = html.slice(0, offset);
    return before.lastIndexOf('<script') > before.lastIndexOf('</script>') ? '\n' : match;
  });

  next = next
    .replace('Africa has many overlapping legal systems, registries, regulators, and court processes. These tools help businesses and individuals navigate registration, compliance, contracts, data privacy, and personal legal matters while showing where coverage is a full directory and where it is a deeper 16-market calculator.', 'Africa has many overlapping legal systems, registries, regulators, and court processes. These apps now help users move from answer to action: capture evidence, save a workflow, export a PDF checklist and continue into the next legal tool.')
    .replace(/Africa has many overlapping legal systems, registries, regulators, and court processes\.[^<]*?deeper 16-market calculator\./, 'Africa has many overlapping legal systems, registries, regulators, and court processes. These apps now help users move from answer to action: capture evidence, save a workflow, export a PDF checklist and continue into the next legal tool.');

  next = next
    .replace(/\+\s*'\r?\n<script>[\s\S]*?<\/body><\/html>'\);/, "+ '</body></html>');")
    .replace(/\+\s*'\r?\n<script>[\s\S]*?<\/body><\/html>';/, "+\n    '</body></html>';")
    .replace(/(<p style="margin-top:24px[^']*<\/p>)\r?\n<script>[\s\S]*?<\/body><\/html>';/, "$1</body></html>';");

  return next;
}

function replaceCoverageClaims(html, profile) {
  if (!profile.coverage.startsWith('16')) return html;
  return html
    .replace(/54 African Countries/g, '16 Core African Markets')
    .replace(/54 African countries/g, '16 core African markets')
    .replace(/54 countries/g, '16 core markets')
    .replace(/54 Countries/g, '16 Core Markets')
    .replace(/all 54 African countries/g, '16 core African markets')
    .replace(/for every African country/g, 'for the supported African markets')
    .replace(/any African country/g, 'the supported African markets');
}

function updateTool(slug, profile) {
  const file = path.join(ROOT, 'tools', slug, 'index.html');
  if (!fs.existsSync(file)) throw new Error(`Missing tool page: ${file}`);
  const current = fs.readFileSync(file, 'utf8');
  let next = ensureEnhancementCss(replaceCoverageClaims(current, profile));
  next = repairCopyScriptInsidePrintWindow(next);
  next = repairGeneratedPrintHtmlLeaks(next);
  next = upsertWorkflowCopilot(next, buildWorkflowCopilot(slug, profile));
  next = upsertSection(next, buildUpgrade(profile));
  next = upsertCompetitorCheck(next, buildCompetitorUpgrade(slug, profile));
  next = upsertActionPack(next, buildActionPack(slug, profile));
  next = ensureWorkflowScript(next);
  next = ensureActionCopyScript(next);
  if (next !== current) fs.writeFileSync(file, next);
  return next !== current;
}

const hubIntake = [
  '<!-- LEGAL-HUB-UPGRADE:START -->',
  '<section class="leg-intake" aria-labelledby="legal-intake-heading">',
  '  <div class="leg-intake-copy">',
  '    <span class="leg-intake-kicker">Legal workspace homepage</span>',
  '    <h2 id="legal-intake-heading">Start with the job, then save the trail</h2>',
  '    <p>Each legal app now has a case workspace: app-specific evidence checks, risk flags, a dashboard save, a copyable handoff note and an email-gated PDF export. Start with the closest workflow below, then continue through the linked next apps.</p>',
  '    <div class="leg-intake-actions">',
  '      <a href="/dashboard/">Resume saved legal workflows</a>',
  '      <a href="#registry-legal-tools">Browse all 69 apps</a>',
  '    </div>',
  '  </div>',
  '  <div class="leg-intake-grid">',
  '    <a href="#business-legal"><strong>Company setup and compliance</strong><span>Registration -> entity type -> TIN -> licences -> annual returns -> closure.</span></a>',
  '    <a href="#data-privacy"><strong>Privacy evidence pack</strong><span>Policy -> cookies -> DPA -> DPIA -> breach -> cross-border transfers.</span></a>',
  '    <a href="#personal-legal"><strong>Personal legal matter</strong><span>Will, POA, child support, inheritance, bail, court fees, legal aid and sworn forms.</span></a>',
  '    <a href="#registry-legal-tools"><strong>Property and tenancy</strong><span>Title -> valuation -> yield -> lease -> screening -> deposit -> service charge.</span></a>',
  '    <a href="#registry-legal-tools"><strong>Labour and contractor risk</strong><span>Worker type -> contract -> leave -> minimum wage -> staff-cost and overtime tools.</span></a>',
  '    <a href="#registry-legal-tools"><strong>Travel and visa record</strong><span>Visa cost, official portal check, document checklist, status reference and trip evidence.</span></a>',
  '  </div>',
  '</section>',
  '<!-- LEGAL-HUB-UPGRADE:END -->',
  '',
].join('\n');

const legalJourneyMap = [
  {
    title: 'Register and operate a company',
    start: '/tools/business-registration/',
    steps: ['Registration', 'Entity type', 'TIN', 'Licences', 'Annual returns'],
    save: 'Save registry references, tax setup, permit gaps and annual-deadline status into the dashboard.',
    gate: 'PDF pack: filing sequence, missing evidence and post-registration compliance checklist.',
  },
  {
    title: 'Launch a privacy-ready product',
    start: '/tools/privacy-policy-gen/',
    steps: ['Policy', 'Cookie consent', 'DPA', 'DPIA', 'Breach plan'],
    save: 'Save regulator, processing purpose, processor evidence and incident-readiness status.',
    gate: 'PDF pack: privacy evidence map, processor checklist and escalation triggers.',
  },
  {
    title: 'Prepare a contract or board file',
    start: '/tools/contract-generator/',
    steps: ['Contract', 'NDA', 'Resolution', 'Shareholder terms', 'Handoff note'],
    save: 'Save parties, approval status, signing authority, renewal dates and unresolved clauses.',
    gate: 'PDF pack: review note, evidence checklist and lawyer or counterparty handoff.',
  },
  {
    title: 'Screen property and tenancy risk',
    start: '/tools/land-title-check/',
    steps: ['Title', 'Valuation', 'Lease', 'Tenant screen', 'Deposit trail'],
    save: 'Save title checks, comparables, lease terms, tenant evidence and deposit handling status.',
    gate: 'PDF pack: rental decision note, due-diligence checklist and red-flag summary.',
  },
  {
    title: 'Classify labour and contractor exposure',
    start: '/tools/employment-contract/',
    steps: ['Worker type', 'Contract', 'Minimum wage', 'Leave', 'Staff cost'],
    save: 'Save role facts, statutory minimums, contract status, pay assumptions and escalation flags.',
    gate: 'PDF pack: worker classification note, contract evidence and compliance reminder.',
  },
  {
    title: 'Build a travel or visa record',
    start: '/tools/visa-cost/',
    steps: ['Visa cost', 'Official portal', 'Documents', 'Insurance', 'Trip evidence'],
    save: 'Save destination, purpose, fee source, portal references, document gaps and travel date.',
    gate: 'PDF pack: trip checklist, official-source note and application evidence list.',
  },
].map((flow) => [
  '    <article class="leg-journey-card">',
  `      <a class="leg-journey-title" href="${flow.start}">${htmlEscape(flow.title)}</a>`,
  `      <div class="leg-journey-steps">${flow.steps.map((step) => `<span>${htmlEscape(step)}</span>`).join('')}</div>`,
  `      <p>${htmlEscape(flow.save)}</p>`,
  `      <p class="leg-journey-gate">${htmlEscape(flow.gate)}</p>`,
  '    </article>',
].join('\n')).join('\n');

const hubJourneyMap = [
  '<!-- LEGAL-JOURNEY-MAP:START -->',
  '<section class="leg-journey-map" aria-labelledby="legal-journey-heading">',
  '  <div class="leg-journey-head">',
  '    <span class="leg-intake-kicker">Connected legal workflows</span>',
  '    <h2 id="legal-journey-heading">Move across apps without losing the matter file</h2>',
  '    <p>Competitor review showed the strongest legal products keep users inside a workflow: questionnaire, evidence, status, export, reminders and the next related action. This map turns the legal hub into that kind of workspace while keeping AfroTools free at the first result.</p>',
  '  </div>',
  '  <div class="leg-journey-grid">',
  legalJourneyMap,
  '  </div>',
  '</section>',
  '<!-- LEGAL-JOURNEY-MAP:END -->',
  '',
].join('\n');

function upsertHubIntake(html) {
  const start = '<!-- LEGAL-HUB-UPGRADE:START -->';
  const end = '<!-- LEGAL-HUB-UPGRADE:END -->';
  const startIdx = html.indexOf(start);
  if (startIdx !== -1) {
    const endIdx = html.indexOf(end, startIdx);
    return html.slice(0, startIdx) + hubIntake + html.slice(endIdx + end.length + 1);
  }
  const marker = '<main class="leg-main">';
  const idx = html.indexOf(marker);
  if (idx === -1) throw new Error('Cannot find legal hub main marker');
  return html.slice(0, idx + marker.length) + '\n\n' + hubIntake + html.slice(idx + marker.length);
}

function upsertHubJourneyMap(html) {
  return upsertMarkedSection(
    html,
    hubJourneyMap,
    '<!-- LEGAL-JOURNEY-MAP:START -->',
    '<!-- LEGAL-JOURNEY-MAP:END -->',
    ['<!-- SECTION 1: Business Legal -->', '<div id="business-legal"']
  );
}

function buildRegistryLegalHubSection() {
  const groups = new Map();
  for (const [slug, profile] of Object.entries(extraLegalProfiles)) {
    const group = profile.hubGroup || 'More Legal Apps';
    if (!groups.has(group)) groups.set(group, []);
    groups.get(group).push([slug, profile]);
  }

  const blocks = [
    '<!-- LEGAL-REGISTRY-APPS:START -->',
    '<section class="leg-registry" aria-labelledby="registry-legal-tools">',
    '  <div id="registry-legal-tools" class="leg-section-header" style="margin-top:3rem">',
    '    <div class="leg-section-title">&#x1f5c2;&#xfe0f; Registry-Tagged <em>Legal Apps</em></div>',
    `    <div class="leg-section-desc">${Object.keys(extraLegalProfiles).length} additional legal apps were tagged in the tool registry but were not discoverable from this hub. They are now grouped by job so users do not have to know the internal registry.</div>`,
    '  </div>',
  ];

  for (const [group, entries] of groups) {
    blocks.push(`  <h3 class="leg-subgroup-title">${escapeHtml(group)}</h3>`);
    blocks.push('  <div class="leg-tools leg-tools-compact">');
    for (const [slug, profile] of entries) {
      blocks.push(`    <a href="/tools/${slug}/" class="leg-tool-card">`);
      blocks.push(`      <div class="leg-tc-icon">${profile.icon || '&#x2696;&#xfe0f;'}</div>`);
      blocks.push(`      <div class="leg-tc-name">${escapeHtml(profile.name || titleCase(slug))}</div>`);
      blocks.push(`      <div class="leg-tc-desc">${escapeHtml(profile.cardDesc || profile.intro)}</div>`);
      blocks.push(`      <div class="leg-tc-foot"><span class="leg-tc-badge new">${escapeHtml(profile.badge || profile.coverage)}</span><span>Deepened</span></div>`);
      blocks.push('    </a>');
    }
    blocks.push('  </div>');
  }

  blocks.push('</section>');
  blocks.push('<!-- LEGAL-REGISTRY-APPS:END -->');
  blocks.push('');
  return blocks.join('\n');
}

function upsertRegistryLegalHubSection(html) {
  return upsertMarkedSection(
    html,
    buildRegistryLegalHubSection(),
    '<!-- LEGAL-REGISTRY-APPS:START -->',
    '<!-- LEGAL-REGISTRY-APPS:END -->',
    ['<!-- Why section -->', '<section class="leg-faq"', '<section class="leg-seo"', '</main>']
  );
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function titleCase(slug) {
  return slug.split('-').map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(' ');
}

function updateLanding() {
  const file = path.join(ROOT, 'legal', 'index.html');
  const current = fs.readFileSync(file, 'utf8');
  let next = current
    .replace(/Legal & Compliance Apps for Africa - \d+ Tools \| AfroTools/, `Legal & Compliance Apps for Africa - ${TOTAL_LEGAL_APPS} Apps | AfroTools`)
    .replace(/Legal & Compliance Apps for Africa - \d+ Apps \| AfroTools/, `Legal & Compliance Apps for Africa - ${TOTAL_LEGAL_APPS} Apps | AfroTools`)
    .replace(/<meta property="og:description" content="\d+ legal apps for Africa\.[^"]*">/, `<meta property="og:description" content="${TOTAL_LEGAL_APPS} legal apps for Africa with dashboard-saved workflows, official-source checks, app-specific evidence packs and email-gated PDF checklists.">`)
    .replace(/"description":"\d+ legal and compliance apps for Africa[^"]*"/, `"description":"${TOTAL_LEGAL_APPS} legal and compliance apps for Africa with dashboard-saved workflows, official-source checks, evidence packs and PDF checklists."`)
    .replace(/"numberOfItems":\d+/, `"numberOfItems":${TOTAL_LEGAL_APPS}`)
    .replace(/<div class="leg-stat-val">\d+<\/div><div class="leg-stat-label">Legal Tools<\/div>/, `<div class="leg-stat-val">${TOTAL_LEGAL_APPS}</div><div class="leg-stat-label">Legal Apps</div>`)
    .replace(/<div class="leg-stat-val">\d+<\/div><div class="leg-stat-label">Legal Apps<\/div>/, `<div class="leg-stat-val">${TOTAL_LEGAL_APPS}</div><div class="leg-stat-label">Legal Apps</div>`)
    .replace(/<div class="leg-stat-val">\d+<\/div><div class="leg-stat-label">Sub-categories<\/div>/, '<div class="leg-stat-val">7</div><div class="leg-stat-label">Workflow Groups</div>')
    .replace(/<div class="leg-stat-val">\d+<\/div><div class="leg-stat-label">Workflow Groups<\/div>/, '<div class="leg-stat-val">7</div><div class="leg-stat-label">Workflow Groups</div>')
    .replace('Legal & Compliance Tools for Africa â€” 33 Tools, 54 Countries | AfroTools', 'Legal & Compliance Apps for Africa - 33 Tools | AfroTools')
    .replace('Legal & Compliance Tools for Africa — 33 Tools, 54 Countries | AfroTools', 'Legal & Compliance Apps for Africa - 33 Tools | AfroTools')
    .replace('Free legal and compliance tools for Africa. Business registration, NDA generator, privacy policy, compliance checkers, wills, child support, court fees â€” across 54 African countries.', 'Free legal and compliance apps for Africa. Business registration, contracts, privacy, wills, court fees and legal aid with honest country coverage by tool.')
    .replace(/<meta name="description" content="Free legal and compliance tools for Africa\.[^"]*">/, '<meta name="description" content="Free legal and compliance apps for Africa. Business registration, contracts, privacy, wills, court fees and legal aid with honest country coverage by tool.">')
    .replace(/<meta property="og:title" content="Legal & Compliance Tools for Africa[^"]*">/, '<meta property="og:title" content="Legal & Compliance Apps for Africa - AfroTools">')
    .replace(/<meta name="description" content="[^"]*">/, '<meta name="description" content="Free legal apps for Africa: company, privacy, contracts, property, labour and personal-law workflows with dashboard saves and PDF checklists.">')
    .replace('33 free legal tools for Africa. Business registration checklists, document generators, compliance checkers, and personal legal calculators for 54 countries.', '33 legal apps for Africa. Company, privacy and personal legal workflows with 54-country directories where available and 16-market deep calculators where supported.')
    .replace('33 free legal and compliance tools for Africa â€” business registration, contracts, privacy, personal legal, and more.', '33 legal and compliance apps for Africa with explicit country coverage, official-source checks, and practical next steps.')
    .replace(/"description":"33 free legal and compliance tools for Africa[^"]*"/, '"description":"33 legal and compliance apps for Africa with explicit country coverage, official-source checks, and practical next steps."')
    .replace('Africa has over 100 distinct legal systems across 54 countries â€” yet access to legal tools remains painfully limited. These free tools help businesses and individuals navigate registration, compliance, contracts, data privacy, and personal legal matters.', 'Africa has many overlapping legal systems, registries, regulators, and court processes. These tools help businesses and individuals navigate registration, compliance, contracts, data privacy, and personal legal matters while showing where coverage is a full directory and where it is a deeper 16-market calculator.')
    .replace(/Africa has over 100 distinct legal systems across 54 countries[^<]*personal legal matters\./, 'Africa has many overlapping legal systems, registries, regulators, and court processes. These tools help businesses and individuals navigate registration, compliance, contracts, data privacy, and personal legal matters while showing where coverage is a full directory and where it is a deeper 16-market calculator.')
    .replace('&#x1f30d; 54 Countries', '&#x1f30d; Coverage labelled per tool')
    .replace('&#x2696;&#xfe0f; 33 Tools', `&#x2696;&#xfe0f; ${TOTAL_LEGAL_APPS} Apps`)
    .replace('<div class="leg-stat-val">54</div><div class="leg-stat-label">Countries Covered</div>', '<div class="leg-stat-val">16+</div><div class="leg-stat-label">Deep Jurisdictions</div>')
    .replace('<div class="leg-stat-val">100%</div><div class="leg-stat-label">Free to Use</div>', '<div class="leg-stat-val">54</div><div class="leg-stat-label">Directory Reach Where Available</div>')
    .replace('Company formation, registration, IP, contracts, and dissolution â€” for all 54 African countries', 'Company formation, registration, IP, contracts, and dissolution with coverage labelled by tool')
    .replace(/Company formation, registration, IP, contracts, and dissolution[^<]*for all 54 African countries/, 'Company formation, registration, IP, contracts, and dissolution with coverage labelled by tool')
    .replace('Real data on registration authorities, compliance requirements, and legal processes for every African country â€” not generic global templates.', 'Clear coverage labels, practical checklists, and official-source shortcuts so you can separate Africa-wide directories from deeper country calculators.');
  next = next
    .replace('Africa has many overlapping legal systems, registries, regulators, and court processes. These tools help businesses and individuals navigate registration, compliance, contracts, data privacy, and personal legal matters while showing where coverage is a full directory and where it is a deeper 16-market calculator.', 'Africa has many overlapping legal systems, registries, regulators, and court processes. These apps now help users move from answer to action: capture evidence, save a workflow, export a PDF checklist and continue into the next legal tool.')
    .replace(/Africa has many overlapping legal systems, registries, regulators, and court processes\.[^<]*?deeper 16-market calculator\./, 'Africa has many overlapping legal systems, registries, regulators, and court processes. These apps now help users move from answer to action: capture evidence, save a workflow, export a PDF checklist and continue into the next legal tool.');

  next = next
    .replace(/Step-by-step registration guide for 54 countries\./g, 'Step-by-step registration guide for the 16 core legal markets.')
    .replace(/Register a foreign company \(branch office, subsidiary, or representative office\) in any African country\./g, 'Register a foreign company, branch office, subsidiary, or representative office in a supported African market.')
    .replace(/Real data on registration authorities, compliance requirements, and legal processes for every African country[^<]*generic global templates\./g, 'Clear coverage labels, practical checklists, and official-source shortcuts so you can separate Africa-wide directories from deeper country calculators.')
    .replace(/As of 2024, at least 36 of 54 African countries have enacted data protection legislation or have laws in progress\.[^<]*/, 'Many African countries now have data protection legislation, active regulators, or draft frameworks. Start with the regulator-linked tools for Nigeria NDPA, South Africa POPIA, Kenya DPA, Ghana Act 843, Rwanda Law 058/2021, Morocco Law 09-08, and the cross-border comparator for multi-country processing.')
    .replace(/36 of 54 African countries now have data protection laws, with more being enacted every year/g, 'Data protection laws and regulators are expanding across Africa, so privacy tools now link to primary regulator checks where available');

  next = ensureEnhancementCss(next)
    .replace('<!-- SECTION 1: Business Legal -->\n  <div class="leg-section-header">', '<!-- SECTION 1: Business Legal -->\n  <div id="business-legal" class="leg-section-header">')
    .replace('<!-- SECTION 2: Data Privacy -->\n  <div class="leg-section-header" style="margin-top:3rem">', '<!-- SECTION 2: Data Privacy -->\n  <div id="data-privacy" class="leg-section-header" style="margin-top:3rem">')
    .replace('<!-- SECTION 3: Personal Legal -->\n  <div class="leg-section-header" style="margin-top:3rem">', '<!-- SECTION 3: Personal Legal -->\n  <div id="personal-legal" class="leg-section-header" style="margin-top:3rem">');

  next = upsertHubIntake(next);
  next = upsertHubJourneyMap(next);
  next = upsertRegistryLegalHubSection(next);

  const coverageByHref = {
    '/tools/business-registration/': '16 Core Markets',
    '/tools/company-type-selector/': '16 Core Markets',
    '/tools/business-license/': '16 Core Markets',
    '/tools/tin-guide/': '54-Country Directory',
    '/tools/annual-returns/': '16 Core Markets',
    '/tools/trademark-registration/': '16 Core Markets',
    '/tools/winding-up/': '16 Core Markets',
    '/tools/foreign-company-reg/': '16 Core Markets',
    '/tools/privacy-policy-gen/': '16 Privacy Regimes',
    '/tools/breach-notification/': '16 Privacy Regimes',
    '/tools/will-generator/': '16 Core Markets',
    '/tools/power-of-attorney/': '16 Core Markets',
    '/tools/child-support/': '16 Core Markets',
    '/tools/inheritance-tax/': '16 Core Markets',
    '/tools/court-fees/': '16 Core Markets',
    '/tools/statutory-declaration/': '16 Core Markets',
    '/tools/affidavit-generator/': '16 Core Markets',
  };

  for (const [href, label] of Object.entries(coverageByHref)) {
    const cardRegex = new RegExp(`(<a href="${href.replace(/\//g, '\\/')}" class="leg-tool-card">[\\s\\S]*?<div class="leg-tc-foot"><span class="leg-tc-badge new">)([^<]+)(<\\/span>)`);
    next = next.replace(cardRegex, `$1${label}$3`);
  }

  next = next
    .replace('Business Registration Checklist Step-by-step registration guide for 54 countries.', 'Business Registration Checklist Step-by-step registration guide for the 16 core legal markets.')
    .replace('Company Type Selector Answer 5 quick questions â†’ get the right structure', 'Company Type Selector Answer 5 quick questions to get the right structure')
    .replace('Annual Returns Filing Reminder Never miss a filing deadline. Country-specific deadlines', 'Annual Returns Filing Reminder Track filing deadlines, penalties')
    .replace('Generate a country-specific privacy policy in minutes.', 'Generate a privacy policy for the supported privacy regimes in minutes.')
    .replace('Country-specific timelines (72-hour rule) and required content.', 'Regulator-ready timelines, incident facts, and required content.')
    .replace('Generate a legally sound will template for your country.', 'Generate a will planning template for supported African jurisdictions.')
    .replace('Generate general or special power of attorney documents.', 'Generate general or special power of attorney templates.')
    .replace('Estimate monthly child support payments based on both parents', 'Estimate child maintenance ranges based on both parents')
    .replace('Calculate estate duty or inheritance tax by country.', 'Estimate estate duty, probate and inheritance-tax exposure by country.')
    .replace('Estimate court filing fees and service fees by claim amount, court level, and country.', 'Estimate filing, service and court-route costs by claim amount, court level, and country.');

  if (next !== current) fs.writeFileSync(file, next);
  return next !== current;
}

let changed = 0;
if (updateLanding()) changed += 1;

for (const [slug, profile] of Object.entries(allProfiles)) {
  if (updateTool(slug, profile)) changed += 1;
}

console.log(`Enhanced legal hub and tools. Files changed: ${changed}`);
