var B2BPaymentsData = (function () {
  'use strict';

  var PROVIDERS = [
    {
      id: 'swift',
      name: 'SWIFT Wire Transfer',
      shortName: 'SWIFT',
      type: 'traditional',
      typeLabel: 'Traditional Bank',
      logo: '🏦',
      feeStructure: {
        flatFee: { min: 25, max: 50 },
        fxMargin: { min: 1.5, max: 4.0 },
        intermediaryFees: { min: 15, max: 30 }
      },
      speed: { min: 2, max: 5, unit: 'business days' },
      maxAmount: 'Unlimited',
      supportedCurrencies: 'All major currencies',
      africaCoverage: 'All 54 African countries',
      bestFor: 'Large payments (>$10,000), formal trade transactions, documentary trade',
      proscons: {
        pros: ['Universal acceptance', 'No payment limits', 'Legally robust', 'All currencies'],
        cons: ['Slow (2-5 days)', 'Expensive for small payments', 'Unpredictable intermediary fees', 'Not optimised for Africa-to-Africa']
      },
      notes: 'Intermediary bank fees ($15-$30) often deducted from the transfer, so recipient may receive less than expected.',
      requiresAccount: true,
      color: '#5856D6'
    },
    {
      id: 'papss',
      name: 'PAPSS',
      shortName: 'PAPSS',
      fullName: 'Pan-African Payment & Settlement System',
      type: 'africa_specific',
      typeLabel: 'Pan-African System',
      logo: '🌍',
      feeStructure: {
        flatFee: { min: 2, max: 5 },
        fxMargin: { min: 0.5, max: 1.5 }
      },
      speed: { min: 0, max: 1, unit: 'hours to 1 business day' },
      supportedCurrencies: '42 African currencies',
      africaCoverage: '12 central banks connected (2026) — growing',
      bestFor: 'Intra-African B2B payments in local currencies, AfCFTA trade',
      proscons: {
        pros: ['Lowest fees for intra-Africa', 'Local currency settlement', 'Real-time for supported pairs', 'AfCFTA aligned'],
        cons: ['Limited to participating central banks', 'Not all 54 countries yet', 'Requires bank enrollment', 'Still rolling out']
      },
      notes: 'Developed by Afreximbank. Avoids USD conversion for Africa-to-Africa payments — major cost saver. Backed by African Union.',
      requiresAccount: true,
      color: '#007AFF'
    },
    {
      id: 'flutterwave',
      name: 'Flutterwave',
      shortName: 'Flutterwave',
      type: 'fintech',
      typeLabel: 'African Fintech',
      logo: '🦋',
      feeStructure: {
        percentFee: { domestic: 1.4, international: 3.8 },
        fxMargin: { min: 0.5, max: 2.0 }
      },
      speed: { min: 0, max: 2, unit: 'business days' },
      maxAmount: '$100,000 per transaction (higher with KYC)',
      supportedCurrencies: '150+ currencies',
      africaCoverage: '34 African countries',
      bestFor: 'E-commerce, marketplace settlements, contractor payments, SME exports',
      proscons: {
        pros: ['Large Africa network', 'API-first integration', 'Multi-currency', 'Virtual accounts'],
        cons: ['Fees add up for large volumes', 'KYC requirements', 'Customer support varies']
      },
      notes: 'Strong in Nigeria, Kenya, Ghana, South Africa, Tanzania. Popular for digital businesses and aggregated payments.',
      requiresAccount: true,
      color: '#FF6B35'
    },
    {
      id: 'paystack',
      name: 'Paystack',
      shortName: 'Paystack',
      type: 'fintech',
      typeLabel: 'Stripe Africa',
      logo: '💳',
      feeStructure: {
        percentFee: { domestic: 1.5, international: 3.9 },
        flatCap: 'NGN 2,000 cap on local transactions'
      },
      speed: { min: 1, max: 1, unit: 'business day (T+1 settlement)' },
      supportedCurrencies: 'NGN, GHS, ZAR, KES',
      africaCoverage: 'Nigeria, Ghana, South Africa, Kenya',
      bestFor: 'Nigerian businesses accepting online payments, card payments, invoice collection',
      proscons: {
        pros: ['Excellent developer experience', 'Stripe reliability', 'Fast settlement', 'Great dashboard'],
        cons: ['Limited to 4 countries', 'Capped currencies only', 'Not for non-digital businesses']
      },
      notes: 'Acquired by Stripe. Best developer experience in Africa for accepting payments. NGN 2,000 cap makes local transactions very affordable.',
      requiresAccount: true,
      color: '#3D9970'
    },
    {
      id: 'wise_business',
      name: 'Wise Business',
      shortName: 'Wise',
      type: 'fintech',
      typeLabel: 'Global Fintech',
      logo: '🌐',
      feeStructure: {
        percentFee: { min: 0.4, max: 1.5 },
        fxMargin: 0
      },
      speed: { min: 0, max: 2, unit: 'business days' },
      maxAmount: '$1,000,000 (with KYC)',
      supportedCurrencies: '50+ currencies',
      africaCoverage: 'Send to most African countries; receive in NG, KE, GH, ZA, TZ, UG',
      bestFor: 'Paying international suppliers, receiving foreign payments, transparent FX rates',
      proscons: {
        pros: ['Mid-market FX rate (no margin)', 'Very transparent pricing', 'Multi-currency account', 'Batch payments'],
        cons: ['Receive countries limited', 'May be blocked in some African banks', 'Limited local payment methods']
      },
      notes: 'Uses real mid-market exchange rate with zero FX margin — often 3-4x cheaper than traditional banks for international payments.',
      requiresAccount: true,
      color: '#9FE870'
    },
    {
      id: 'dlocal',
      name: 'dLocal',
      shortName: 'dLocal',
      type: 'fintech',
      typeLabel: 'Emerging Markets',
      logo: '🔗',
      feeStructure: {
        percentFee: { min: 2.5, max: 4.5 }
      },
      speed: { min: 1, max: 3, unit: 'business days' },
      supportedCurrencies: '40+ emerging market currencies',
      africaCoverage: 'NG, KE, ZA, GH, EG, MA, TZ, CI, SN, CM',
      bestFor: 'International companies paying African suppliers/contractors, mass disbursements',
      proscons: {
        pros: ['Local payment methods', 'Regulatory compliance', 'Mass payouts', 'Global to Africa focus'],
        cons: ['Higher fees', 'Enterprise focus', 'Not for individual businesses']
      },
      notes: 'Specialises in connecting global companies to African payment ecosystems. Strong compliance layer for multinational use.',
      requiresAccount: true,
      color: '#0066FF'
    },
    {
      id: 'chipper_biz',
      name: 'Chipper Cash Business',
      shortName: 'Chipper',
      type: 'fintech',
      typeLabel: 'Pan-African App',
      logo: '🐦',
      feeStructure: {
        percentFee: { min: 0, max: 1.0 }
      },
      speed: { min: 0, max: 0, unit: 'Instant' },
      maxAmount: '$5,000 (standard), higher with KYB',
      supportedCurrencies: '7 African currencies (GHS, NGN, KES, UGX, TZS, RWF, ZAR)',
      africaCoverage: 'NG, GH, KE, UG, TZ, RW, ZA',
      bestFor: 'Small B2B payments within Africa, freelancer payments, airtime top-ups',
      proscons: {
        pros: ['Zero fees on many transactions', 'Instant settlement', 'Mobile-first', 'Simple UX'],
        cons: ['Low transaction limits', 'Limited to 7 countries', 'Less enterprise features']
      },
      notes: 'Excellent for micro B2B and gig economy payments across East/West Africa. Not suitable for large trade settlements.',
      requiresAccount: true,
      color: '#3F7AFF'
    },
    {
      id: 'thunes',
      name: 'Thunes',
      shortName: 'Thunes',
      type: 'fintech',
      typeLabel: 'B2B Network',
      logo: '📱',
      feeStructure: {
        percentFee: { min: 0.5, max: 2.0 }
      },
      speed: { min: 0, max: 1, unit: 'hours (mobile money)' },
      supportedCurrencies: '80+ currencies',
      africaCoverage: '30+ African countries via mobile money networks',
      bestFor: 'Bulk disbursements, mobile money payments, payroll across Africa',
      proscons: {
        pros: ['Mobile money integration', 'Bulk payouts', 'Wide Africa coverage', 'B2B network'],
        cons: ['Fees vary widely by corridor', 'Primarily for disbursements not collections']
      },
      notes: 'Powers many fintech back-ends. Connects to M-Pesa, MTN MoMo, Airtel Money and other mobile money networks across Africa.',
      requiresAccount: true,
      color: '#6C47FF'
    }
  ];

  var CORRIDOR_FEES = {
    'NG-KE': { swift: 4.2, papss: 1.0, flutterwave: 4.3, wise_business: 1.2, chipper_biz: 1.0 },
    'NG-GH': { swift: 4.0, papss: 1.0, flutterwave: 4.3, paystack: 3.9, chipper_biz: 0.5 },
    'KE-TZ': { swift: 3.8, papss: 0.8, flutterwave: 3.8, wise_business: 1.0, chipper_biz: 0.0 },
    'ZA-NG': { swift: 4.5, papss: 1.2, flutterwave: 4.3, wise_business: 1.5, dlocal: 3.5 },
    'NG-CN': { swift: 4.5, flutterwave: 4.3, wise_business: 1.1 },
    'KE-IN': { swift: 3.8, wise_business: 0.8, flutterwave: 3.8 }
  };

  return {
    providers: PROVIDERS,
    corridorFees: CORRIDOR_FEES,
    getById: function (id) {
      return PROVIDERS.find(function (p) { return p.id === id; }) || null;
    },
    calculateFee: function (providerId, amount) {
      var p = PROVIDERS.find(function (p) { return p.id === providerId; });
      if (!p) return null;
      var fee = 0;
      var fs = p.feeStructure;
      if (fs.flatFee) fee += (fs.flatFee.min + fs.flatFee.max) / 2;
      if (fs.percentFee) {
        if (fs.percentFee.international) fee += amount * (fs.percentFee.international / 100);
        else if (fs.percentFee.min !== undefined) fee += amount * ((fs.percentFee.min + fs.percentFee.max) / 2 / 100);
        else if (typeof fs.percentFee === 'number') fee += amount * (fs.percentFee / 100);
      }
      if (fs.fxMargin && fs.fxMargin !== 0) {
        var margin = typeof fs.fxMargin === 'number' ? fs.fxMargin : (fs.fxMargin.min + fs.fxMargin.max) / 2;
        fee += amount * (margin / 100);
      }
      if (fs.intermediaryFees) fee += (fs.intermediaryFees.min + fs.intermediaryFees.max) / 2;
      return { providerId: providerId, amount: amount, estimatedFee: Math.round(fee * 100) / 100, totalCost: Math.round((amount + fee) * 100) / 100, feePct: Math.round((fee / amount) * 10000) / 100 };
    }
  };
})();
