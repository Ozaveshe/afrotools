(function initialiseAgriculturalLoanEvidence(root) {
  'use strict';

  var app = root.AfroTools = root.AfroTools || {};
  var CHECKED_DATE = '2026-08-02';

  function record(officialUrl, sourceTitle, effectiveDate, extra) {
    return Object.assign({
      officialUrl: officialUrl,
      sourceTitle: sourceTitle,
      checkedDate: CHECKED_DATE,
      effectiveDate: effectiveDate || CHECKED_DATE,
      evidenceStatus: 'planning-estimate',
      programMode: 'loan-estimate'
    }, extra || {});
  }

  var RECORDS = {
    'NG:boa': record('https://boanig.com/', 'Bank of Agriculture Nigeria', CHECKED_DATE),
    'NG:abp': record('https://www.cbn.gov.ng/DFD/agriculture/ABP.html', 'Central Bank of Nigeria - Anchor Borrowers Programme', '2021-10-13', {
      maxAmount: null,
      maxAmountLabel: 'No fixed maximum; based on validated land size and approved economics of production',
      notes: 'The official CBN programme page states that loan size is determined by validated land size and the approved economics of production; it does not set a fixed maximum.'
    }),
    'NG:agsmeis': record('https://www.cbn.gov.ng/DFD/msmes/agsmeis.html', 'Central Bank of Nigeria - AGSMEIS', '2017-02-09', {
      eligibility: { training_required: true },
      notes: 'Entrepreneurship-development training is a mandatory application condition. Confirm the current participating institution and terms with CBN or the appointed lender.'
    }),
    'NG:commercial_banks': record('https://www.cbn.gov.ng/Supervision/Inst-DM.html', 'Central Bank of Nigeria - licensed deposit money banks', CHECKED_DATE, {
      evidenceStatus: 'regulated-directory', programMode: 'directory-only'
    }),
    'NG:microfinance': record('https://www.cbn.gov.ng/Supervision/Inst-MF.html', 'Central Bank of Nigeria - licensed microfinance banks', CHECKED_DATE, {
      evidenceStatus: 'regulated-directory', programMode: 'directory-only'
    }),
    'NG:agritech': record('https://sec.gov.ng/', 'Securities and Exchange Commission Nigeria', CHECKED_DATE, {
      evidenceStatus: 'provider-verification-required', programMode: 'directory-only'
    }),

    'KE:afc': record('https://agrifinance.org/', 'Agricultural Finance Corporation Kenya', CHECKED_DATE),
    'KE:youth_agri_ke': record('https://agrifinance.org/', 'Agricultural Finance Corporation Kenya', CHECKED_DATE, {
      evidenceStatus: 'provider-verification-required', programMode: 'directory-only'
    }),
    'KE:saccos_ke': record('https://www.sasra.go.ke/sacco-supervision/', 'SACCO Societies Regulatory Authority Kenya', CHECKED_DATE, {
      evidenceStatus: 'regulated-directory', programMode: 'directory-only'
    }),
    'KE:equity_ke': record('https://equitygroupholdings.com/ke/borrow/agriculture-loans/', 'Equity Bank Kenya - agriculture loans', CHECKED_DATE),
    'KE:one_acre': record('https://oneacrefund.org/about-us', 'One Acre Fund - farmer services', CHECKED_DATE, {
      evidenceStatus: 'in-kind-input-service', programMode: 'input-credit'
    }),
    'KE:ke_microfinance': record('https://www.centralbank.go.ke/bank-supervision/supervision/microfinance-institutions/', 'Central Bank of Kenya - microfinance institutions', CHECKED_DATE, {
      evidenceStatus: 'regulated-directory', programMode: 'directory-only'
    }),

    'ZA:land_bank': record('https://landbank.co.za/Products-and-Services/Pages/default.aspx', 'Land Bank South Africa - products and services', CHECKED_DATE),
    'ZA:casp': record('https://www.gov.za/issues/govt-programmes-economic-opportunities/land-agriculture', 'South African Government - agricultural support programmes', CHECKED_DATE, {
      name: 'CASP / DALRRD agricultural support', type: 'Government Support Programme', typeBadge: 'Gov Grant',
      interestRate_pct: null, minAmount: null, maxAmount: null, tenor_months: { min: 0, max: 0 },
      evidenceStatus: 'grant-and-support', programMode: 'support-only',
      notes: 'CASP provides public agricultural support such as infrastructure, training, technical assistance and input support. It is not a direct loan product.'
    }),
    'ZA:absa_agri': record('https://www.absa.co.za/business/sector-solutions/agribusiness/', 'Absa South Africa - agribusiness', CHECKED_DATE),
    'ZA:standard_bank_za': record('https://www.standardbank.co.za/', 'Standard Bank South Africa', CHECKED_DATE),
    'ZA:nedbank_agri': record('https://www.nedbank.co.za/', 'Nedbank South Africa', CHECKED_DATE),

    'GH:girsal': record('https://www.girsal.com/', 'Ghana Incentive-Based Risk-Sharing System for Agricultural Lending', CHECKED_DATE, {
      evidenceStatus: 'credit-guarantee', programMode: 'referral-only'
    }),
    'GH:adf_gh': record('https://mofa.gov.gh/site/', 'Ghana Ministry of Food and Agriculture', CHECKED_DATE, {
      evidenceStatus: 'provider-verification-required', programMode: 'directory-only'
    }),
    'GH:pfj': record('https://mofa.gov.gh/site/index.php/107-pfj-2-0/472-planting-for-food-and-jobs-phase-2-pfj-2-0', 'Ghana Ministry of Food and Agriculture - PFJ 2.0', '2023-08-28', {
      name: 'Planting for Food and Jobs Phase II input-credit channel', type: 'Government Input-Credit Programme', typeBadge: 'Gov Scheme',
      interestRate_pct: null, minAmount: null, maxAmount: null,
      evidenceStatus: 'input-credit-through-aggregators', programMode: 'input-credit',
      notes: 'PFJ 2.0 uses an input-credit system linked to aggregators and structured markets. It is not a zero-interest cash loan or a continuation of the former direct input-subsidy description.'
    }),
    'GH:rural_banks_gh': record('https://www.bog.gov.gh/supervision-regulation/registered-institutions/rural-community-banks/', 'Bank of Ghana - rural and community banks', CHECKED_DATE, {
      evidenceStatus: 'regulated-directory', programMode: 'directory-only'
    }),
    'GH:ecobank_gh': record('https://www.ecobank.com/gh/personal-banking/loans', 'Ecobank Ghana - loans', CHECKED_DATE, {
      evidenceStatus: 'provider-planning-estimate'
    }),

    'EG:pbdac': record('https://www.abe.com.eg/', 'Agricultural Bank of Egypt', CHECKED_DATE, {
      name: 'Agricultural Bank of Egypt',
      notes: 'The institution is the Agricultural Bank of Egypt. Product eligibility, rate, amount and tenor must be confirmed directly with the bank.'
    }),
    'EG:nbe_eg': record('https://www.nbe.com.eg/NBE/E/#/EN/ProductCategory?inParams=%7B%22CategoryID%22%3A%22SmallMediumEnterprises%22%7D', 'National Bank of Egypt - SME finance', CHECKED_DATE),
    'EG:banque_misr': record('https://www.banquemisr.com/en/Home/SMEs', 'Banque Misr - SME finance', CHECKED_DATE),
    'EG:social_fund_eg': record('https://www.msmeda.org.eg/', 'Micro, Small and Medium Enterprise Development Agency (MSMEDA)', CHECKED_DATE, {
      name: 'MSMEDA financing and support channels', type: 'Government Enterprise Development Agency', typeBadge: 'Gov Fund',
      evidenceStatus: 'finance-and-support-directory', programMode: 'referral-only',
      notes: 'The former Social Fund for Development record is now represented by MSMEDA. MSMEDA provides and channels financial and non-financial support; current products and partner terms must be confirmed with the agency.'
    }),

    'ET:cbe_et': record('https://combanketh.et/', 'Commercial Bank of Ethiopia', CHECKED_DATE),
    'ET:dbe_et': record('https://dbe.com.et/', 'Development Bank of Ethiopia', CHECKED_DATE),
    'ET:coop_bank_et': record('https://coopbankoromia.com.et/', 'Cooperative Bank of Oromia', CHECKED_DATE),
    'ET:mfi_et': record('https://nbe.gov.et/financial-institutions/microfinance-institutions/', 'National Bank of Ethiopia - microfinance institutions', CHECKED_DATE, {
      evidenceStatus: 'regulated-directory', programMode: 'directory-only'
    }),
    'ET:sharia_et': record('https://nbe.gov.et/financial-institutions/banks/', 'National Bank of Ethiopia - licensed banks', CHECKED_DATE, {
      evidenceStatus: 'regulated-directory', programMode: 'directory-only'
    }),

    'TZ:tadb': record('https://www.tadb.co.tz/', 'Tanzania Agricultural Development Bank', CHECKED_DATE),
    'TZ:crdb_kilimo': record('https://crdbbank.co.tz/', 'CRDB Bank Tanzania', CHECKED_DATE),
    'TZ:nmb_tz': record('https://www.nmbbank.co.tz/business-banking/agribusiness', 'NMB Bank Tanzania - agribusiness', CHECKED_DATE),
    'TZ:saccos_tz': record('https://www.ushirika.go.tz/', 'Tanzania Cooperative Development Commission', CHECKED_DATE, {
      evidenceStatus: 'regulated-directory', programMode: 'directory-only'
    }),
    'TZ:mfi_tz': record('https://www.bot.go.tz/BankSupervision/Institutions', 'Bank of Tanzania - supervised institutions', CHECKED_DATE, {
      evidenceStatus: 'regulated-directory', programMode: 'directory-only'
    }),

    'UG:udb': record('https://www.udbl.co.ug/sectors/agriculture/', 'Uganda Development Bank - agriculture', CHECKED_DATE),
    'UG:dfcu_ug': record('https://www.dfcugroup.com/business-banking/agribusiness/', 'dfcu Bank Uganda - agribusiness', CHECKED_DATE),
    'UG:centenary_ug': record('https://www.centenarybank.co.ug/index.php/product/agricultural-loans', 'Centenary Bank Uganda - agricultural loans', CHECKED_DATE),
    'UG:saccos_ug': record('https://umra.go.ug/licensed-institutions/', 'Uganda Microfinance Regulatory Authority - licensed institutions', CHECKED_DATE, {
      evidenceStatus: 'regulated-directory', programMode: 'directory-only'
    }),
    'UG:mfi_ug': record('https://umra.go.ug/licensed-institutions/', 'Uganda Microfinance Regulatory Authority - licensed institutions', CHECKED_DATE, {
      evidenceStatus: 'regulated-directory', programMode: 'directory-only'
    }),

    'RW:brd': record('https://www.brd.rw/brd/agriculture-financing/', 'Development Bank of Rwanda - agriculture financing', CHECKED_DATE),
    'RW:bk_agri': record('https://bk.rw/business/loans/', 'Bank of Kigali - business loans', CHECKED_DATE),
    'RW:umurenge_sacco': record('https://www.bnr.rw/financial-stability/microfinance-institutions/', 'National Bank of Rwanda - microfinance institutions and SACCOs', CHECKED_DATE, {
      evidenceStatus: 'regulated-directory', programMode: 'directory-only'
    }),
    'RW:minagri_rw': record('https://www.minagri.gov.rw/updates/news-details/government-launches-a-subsidized-agriculture-insurance-scheme', 'Rwanda MINAGRI - National Agriculture Insurance Scheme launch', '2019-04-23', {
      name: 'National Agriculture Insurance Scheme (NAIS)', type: 'Government Agricultural Insurance', typeBadge: 'Gov Scheme',
      interestRate_pct: null, minAmount: null, maxAmount: null, tenor_months: { min: 0, max: 0 },
      evidenceStatus: 'insurance', programMode: 'insurance',
      notes: 'NAIS is an agricultural insurance scheme launched in April 2019. It is not an e-Soko input-credit loan and does not generate a loan repayment estimate.'
    }),

    'CI:bni_ci': record('https://www.bni.ci/', 'Banque Nationale d’Investissement Côte d’Ivoire', CHECKED_DATE),
    'CI:boad_ci': record('https://www.boad.org/fr/nos-financements/', 'West African Development Bank - financing', CHECKED_DATE, {
      evidenceStatus: 'wholesale-development-finance', programMode: 'referral-only'
    }),
    'CI:fafci': record('https://www.gouv.ci/uploads/publications/177684332531.pdf', 'Government of Côte d’Ivoire - FAFCI', '2012-12-13', {
      name: 'FAFCI women’s microcredit support', type: 'Government Women’s Microcredit Fund', typeBadge: 'Gov Fund',
      evidenceStatus: 'women-microcredit', programMode: 'referral-only',
      notes: 'FAFCI is the Fonds d’Appui aux Femmes de Côte d’Ivoire, a women’s microcredit and economic-empowerment programme launched in 2012. It is not an agricultural loan-guarantee fund.'
    }),
    'CI:coopec_ci': record('https://www.bceao.int/fr/content/paysage-bancaire-et-financier', 'BCEAO - regulated banking and financial landscape', CHECKED_DATE, {
      evidenceStatus: 'regulated-directory', programMode: 'directory-only'
    }),
    'CI:advans_ci': record('https://www.advanscotedivoire.com/', 'Advans Côte d’Ivoire', CHECKED_DATE),

    'CM:bdeac_cm': record('https://www.bdeac.org/jcms/ess_5050/fr/financements', 'Central African States Development Bank - financing', CHECKED_DATE, {
      evidenceStatus: 'wholesale-development-finance', programMode: 'referral-only'
    }),
    'CM:afriland_cm': record('https://www.afrilandfirstbank.com/', 'Afriland First Bank Cameroon', CHECKED_DATE),
    'CM:camccul': record('https://camccul.cm/services/', 'Cameroon Cooperative Credit Union League', CHECKED_DATE, {
      evidenceStatus: 'cooperative-directory', programMode: 'directory-only'
    }),
    'CM:mc2_cm': record('https://www.afrilandfirstbank.com/retail/mc2/', 'Afriland First Bank - MC2 network', CHECKED_DATE, {
      evidenceStatus: 'community-finance-directory', programMode: 'directory-only'
    }),

    'SN:cncas': record('https://www.labanqueagricole.sn/', 'La Banque Agricole Sénégal', CHECKED_DATE, {
      name: 'La Banque Agricole Sénégal (formerly CNCAS)'
    }),
    'SN:boad_sn': record('https://www.boad.org/fr/nos-financements/', 'West African Development Bank - financing', CHECKED_DATE, {
      evidenceStatus: 'wholesale-development-finance', programMode: 'referral-only'
    }),
    'SN:der_fj': record('https://der.sn/', 'DER/FJ Senegal', CHECKED_DATE),
    'SN:pamecas_sn': record('https://www.bceao.int/fr/reglementations/reglementation-des-systemes-financiers-decentralises?field_hashtags_target_id=51', 'BCEAO - decentralized financial systems regulation', CHECKED_DATE, {
      evidenceStatus: 'regulated-directory', programMode: 'directory-only'
    }),

    'MA:cam_ma': record('https://www.creditagricole.ma/', 'Crédit Agricole du Maroc', CHECKED_DATE),
    'MA:fda_ma': record('https://www.agriculture.gov.ma/fr/aides-financieres', 'Morocco Ministry of Agriculture - financial aid', CHECKED_DATE, {
      evidenceStatus: 'investment-subsidy', programMode: 'support-only'
    }),
    'MA:cih_ma': record('https://www.cihbank.ma/', 'CIH Bank Morocco', CHECKED_DATE),
    'MA:al_amana': record('https://www.alamana.org.ma/', 'Al Amana Microfinance Morocco', CHECKED_DATE),

    'TN:bna_tn': record('https://www.bna.tn/', 'Banque Nationale Agricole Tunisia', CHECKED_DATE),
    'TN:apia_tn': record('https://www.apia.com.tn/procedures-de-promotion-de-projets-et-d-octroi.html', 'APIA Tunisia - investment promotion and incentives', CHECKED_DATE, {
      name: 'APIA agricultural investment incentives', type: 'Government Investment-Promotion Agency', typeBadge: 'Gov Scheme',
      interestRate_pct: null, minAmount: null, maxAmount: null, tenor_months: { min: 0, max: 0 },
      evidenceStatus: 'investment-incentive', programMode: 'support-only',
      notes: 'APIA promotes private agricultural investment and administers eligible financial and tax incentives. A financing agreement may be required, but APIA is not the lender and does not itself issue a 2% loan.'
    }),
    'TN:stb_tn': record('https://www.stb.com.tn/fr/entreprises/financement/', 'Société Tunisienne de Banque - business finance', CHECKED_DATE),
    'TN:enda_tn': record('https://www.endatamweel.tn/', 'Enda Tamweel Tunisia', CHECKED_DATE),

    'AO:bda_ao': record('https://www.bda.ao/', 'Banco de Desenvolvimento de Angola', CHECKED_DATE),
    'AO:prodesi_ao': record('https://governo.gov.ao/programa/prodesi', 'Government of Angola - PRODESI', '2018-07-20'),
    'AO:bic_ao': record('https://www.bna.ao/Conteudos/Artigos/detalhe_artigo.aspx?idc=176&idsc=163&idl=1', 'Banco Nacional de Angola - supervised financial institutions', CHECKED_DATE, {
      evidenceStatus: 'regulated-directory', programMode: 'directory-only'
    }),
    'AO:angofin_ao': record('https://www.bna.ao/Conteudos/Artigos/detalhe_artigo.aspx?idc=176&idsc=163&idl=1', 'Banco Nacional de Angola - supervised financial institutions', CHECKED_DATE, {
      evidenceStatus: 'regulated-directory', programMode: 'directory-only'
    })
  };

  function mergeEligibility(program, override) {
    if (!override) return program.eligibility;
    return Object.assign({}, program.eligibility || {}, override);
  }

  function apply(data) {
    if (!data) throw new Error('Agricultural loan data must load before its evidence registry.');
    var seen = {};
    var count = 0;
    Object.keys(data).forEach(function (countryCode) {
      (data[countryCode].programs || []).forEach(function (program) {
        var key = countryCode + ':' + program.id;
        var evidence = RECORDS[key];
        if (!evidence) throw new Error('Missing official evidence for agricultural loan record ' + key + '.');
        var override = Object.assign({}, evidence);
        if (override.eligibility) override.eligibility = mergeEligibility(program, override.eligibility);
        Object.assign(program, override);
        seen[key] = true;
        count += 1;
      });
    });
    Object.keys(RECORDS).forEach(function (key) {
      if (!seen[key]) throw new Error('Agricultural loan evidence has no matching program record: ' + key + '.');
    });
    if (count !== 70 || Object.keys(RECORDS).length !== 70) {
      throw new Error('Agricultural loan evidence must cover exactly 70 records; found ' + count + '.');
    }
    return data;
  }

  app.AgriLoansEvidence = Object.freeze({
    checkedDate: CHECKED_DATE,
    records: RECORDS,
    apply: apply
  });
  if (app.AgriLoansData) apply(app.AgriLoansData);
})(window);
