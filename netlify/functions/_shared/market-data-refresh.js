const pdfParse = require('pdf-parse');
const {
  cleanText,
  normalizeNumber
} = require('./market-data');
const {
  createRun,
  finishRun,
  markSourceFailure,
  markSourceSuccess,
  insertImportedRecords,
  listActiveSources
} = require('./market-data-ingest');

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Safari/537.36 AfroTools/1.0 (+https://afrotools.com)';
const WISE_RECEIVE_CURRENCY = {
  NG: 'NGN',
  GH: 'GHS',
  KE: 'KES',
  ZA: 'ZAR',
  EG: 'EGP',
  RW: 'RWF',
  TZ: 'TZS',
  ZM: 'ZMW',
  MA: 'MAD'
};

function decodeHtmlEntities(value) {
  return String(value || '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&#0?39;/g, "'")
    .replace(/&#8211;|&#x2013;/gi, '-')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>');
}

function cleanHtmlText(html) {
  return decodeHtmlEntities(
    String(html || '')
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
  );
}

async function fetchText(url) {
  const response = await fetch(url, {
    headers: {
      'user-agent': USER_AGENT,
      'accept-language': 'en-US,en;q=0.9',
      accept: 'text/html,application/xhtml+xml,application/pdf;q=0.9,*/*;q=0.8'
    }
  });
  if (!response.ok) {
    throw new Error('HTTP ' + response.status + ' from ' + url);
  }
  return await response.text();
}

async function fetchPdfText(url) {
  const response = await fetch(url, {
    headers: {
      'user-agent': USER_AGENT,
      'accept-language': 'en-US,en;q=0.9',
      accept: 'application/pdf,*/*'
    }
  });
  if (!response.ok) {
    throw new Error('HTTP ' + response.status + ' from ' + url);
  }
  const buffer = Buffer.from(await response.arrayBuffer());
  const parsed = await pdfParse(buffer);
  return String(parsed.text || '').replace(/\s+/g, ' ').trim();
}

function getDestinationCode(source) {
  const scopes = Array.isArray(source?.country_scope) ? source.country_scope.filter(Boolean) : [];
  const withoutUs = scopes.filter(function (code) { return String(code).toUpperCase() !== 'US'; });
  return cleanText(withoutUs[withoutUs.length - 1] || scopes[0]) || null;
}

function buildWiseQuoteRecords(source, text) {
  const destination = getDestinationCode(source);
  if (!destination) {
    throw new Error('Wise source is missing destination country scope');
  }

  const amountMatch = text.match(/The cheapest way to send\s+([\d,]+)\s+USD/i) ||
    text.match(/Sending\s+([\d,]+)\s+USD\s+Transfer cost/i);
  const sendAmount = normalizeNumber((amountMatch?.[1] || '').replace(/,/g, '')) || null;
  if (!sendAmount) {
    throw new Error('Could not parse Wise send amount for ' + source.source_key);
  }

  const cheapestMatch = text.match(/The cheapest way to send[\s\S]{0,160}?costs\s+(\d+(?:\.\d{1,2})?)\s+USD/i);
  const directDebitMatch = text.match(/Direct debit\s+(\d+(?:\.\d{1,2})?)\s+USD/i) ||
    text.match(/Sending\s+[\d,]+\s+USD\s+direct debit transfer cost\s+(\d+(?:\.\d{1,2})?)\s+USD/i);

  if (!cheapestMatch || !directDebitMatch) {
    throw new Error('Could not parse Wise fee rows for ' + source.source_key);
  }

  const deliveryTextMatch = text.match(/Arrives\s+(Today - in seconds|in seconds|in \d+\s+hours?|by [A-Za-z]+(?:,\s+[A-Za-z]+\s+\d+)?)/i);
  const deliveryText = cleanText(deliveryTextMatch?.[1]);
  const now = new Date().toISOString();

  return [
    {
      country_code: destination,
      city: 'Online',
      send_country: 'US',
      receive_country: destination,
      send_currency: 'USD',
      receive_currency: WISE_RECEIVE_CURRENCY[destination] || null,
      send_amount: sendAmount,
      fee_amount: Number(cheapestMatch[1]),
      provider_name: 'Wise',
      payout_method: 'Local bank account',
      funding_method: 'Wise account',
      source_type: 'official_notice',
      source_url: source.base_url,
      observed_at: now,
      payload: {
        evidence: cheapestMatch[0],
        delivery_text: cleanText(text.match(/usually arrives in seconds/i)?.[0]) || null
      }
    },
    {
      country_code: destination,
      city: 'Online',
      send_country: 'US',
      receive_country: destination,
      send_currency: 'USD',
      receive_currency: WISE_RECEIVE_CURRENCY[destination] || null,
      send_amount: sendAmount,
      fee_amount: Number(directDebitMatch[1]),
      provider_name: 'Wise',
      payout_method: 'Local bank account',
      funding_method: 'Direct debit',
      source_type: 'official_notice',
      source_url: source.base_url,
      observed_at: now,
      payload: {
        evidence: directDebitMatch[0],
        delivery_text: deliveryText
      }
    }
  ];
}

async function collectWiseQuotes(source) {
  const text = cleanHtmlText(await fetchText(source.base_url));
  return buildWiseQuoteRecords(source, text);
}

async function collectMtnGhanaFees(source) {
  const text = cleanHtmlText(await fetchText(source.base_url));
  const lower = text.toLowerCase();
  const zeroBills = lower.includes('pay your utility bills with no extra fees');
  const zeroMonthly = lower.includes('no monthly fees to worry about');
  if (!zeroBills || !zeroMonthly) {
    throw new Error('Could not verify MTN Ghana MoMo fee text');
  }

  const observedAt = new Date().toISOString();
  return [
    {
      country_code: 'GH',
      city: 'National',
      provider_name: 'MTN MoMo',
      fee_type: 'Bill Payment',
      amount_band: 'All amounts',
      fee_amount: 0,
      transaction_channel: 'App',
      source_type: 'official_notice',
      source_url: source.base_url,
      observed_at: observedAt,
      customer_segment: 'Personal wallet',
      payload: {
        evidence: 'Pay your utility bills with no extra fees.'
      }
    },
    {
      country_code: 'GH',
      city: 'National',
      provider_name: 'MTN MoMo',
      fee_type: 'Monthly Maintenance',
      amount_band: 'All accounts',
      fee_amount: 0,
      transaction_channel: 'Wallet',
      source_type: 'official_notice',
      source_url: source.base_url,
      observed_at: observedAt,
      customer_segment: 'Personal wallet',
      payload: {
        evidence: 'No monthly fees to worry about.'
      }
    }
  ];
}

async function collectSafaricomPaybillFees(source) {
  const text = await fetchPdfText(source.base_url);
  const targetRow = /101\s+500\s+5\s+0\s+5\s+5\s+0\s+5\s+0\s+5\s+5/i.test(text);
  if (!targetRow) {
    throw new Error('Could not locate Safaricom paybill tariff row');
  }

  const observedAt = new Date().toISOString();
  return [
    {
      country_code: 'KE',
      city: 'National',
      provider_name: 'M-PESA Paybill',
      fee_type: 'Customer charge',
      amount_band: 'KES 101-500',
      fee_amount: 0,
      transaction_channel: 'Wallet',
      source_type: 'official_notice',
      source_url: source.base_url,
      observed_at: observedAt,
      customer_segment: 'Payer',
      payload: {
        evidence: 'Customer Bouquet Tariff row 101-500 shows customer charge 0.'
      }
    },
    {
      country_code: 'KE',
      city: 'National',
      provider_name: 'M-PESA Paybill',
      fee_type: 'Business charge',
      amount_band: 'KES 101-500',
      fee_amount: 5,
      transaction_channel: 'Wallet',
      source_type: 'official_notice',
      source_url: source.base_url,
      observed_at: observedAt,
      customer_segment: 'Merchant',
      payload: {
        evidence: 'Customer Bouquet Tariff row 101-500 shows business charge 5.'
      }
    }
  ];
}

async function collectSafaricomBuyGoodsFees(source) {
  const text = await fetchPdfText(source.base_url);
  const hasCustomerFree = /There are no customer charges for payments made to the M-PESA Business Till except for payments made at fuel stations\./i.test(text);
  const hasMerchantFee = /maximum of 0\.55%\s+and not more than KShs\.200 per transaction/i.test(text);
  if (!hasCustomerFree || !hasMerchantFee) {
    throw new Error('Could not verify Safaricom Buy Goods tariff text');
  }

  const observedAt = new Date().toISOString();
  return [
    {
      country_code: 'KE',
      city: 'National',
      provider_name: 'M-PESA Business Till',
      fee_type: 'Customer payment fee',
      amount_band: 'All amounts',
      fee_amount: 0,
      transaction_channel: 'Till',
      source_type: 'official_notice',
      source_url: source.base_url,
      observed_at: observedAt,
      customer_segment: 'Payer',
      payload: {
        evidence: 'There are no customer charges for payments made to the M-PESA Business Till except for payments made at fuel stations.'
      }
    },
    {
      country_code: 'KE',
      city: 'National',
      provider_name: 'M-PESA Business Till',
      fee_type: 'Merchant collection fee',
      amount_band: 'Above KES 200',
      fee_percentage: 0.55,
      transaction_channel: 'Till',
      source_type: 'official_notice',
      source_url: source.base_url,
      observed_at: observedAt,
      customer_segment: 'Merchant',
      payload: {
        evidence: 'Your till will be charged a maximum of 0.55% and not more than KShs.200 per transaction.'
      }
    }
  ];
}

async function collectUgMtnMomopay(source) {
  const text = cleanHtmlText(await fetchText(source.base_url));
  const hasIndividual = /1%\s+of the value of the payment\s+for the Individual Merchant/i.test(text);
  const hasBusiness = /2%\s+for the Business Merchant/i.test(text);
  if (!hasIndividual || !hasBusiness) {
    throw new Error('Could not verify MTN Uganda MoMoPay merchant fee text');
  }

  const observedAt = new Date().toISOString();
  return [
    {
      country_code: 'UG',
      city: 'National',
      provider_name: 'MTN MoMo',
      fee_type: 'Merchant receive fee',
      amount_band: 'All received payments',
      fee_percentage: 1,
      transaction_channel: 'MoMoPay',
      source_type: 'official_notice',
      source_url: source.base_url,
      observed_at: observedAt,
      customer_segment: 'Individual merchant',
      payload: {
        evidence: 'Individual Merchant charge is 1% of the received payment value.'
      }
    },
    {
      country_code: 'UG',
      city: 'National',
      provider_name: 'MTN MoMo',
      fee_type: 'Merchant receive fee',
      amount_band: 'All received payments',
      fee_percentage: 2,
      transaction_channel: 'MoMoPay',
      source_type: 'official_notice',
      source_url: source.base_url,
      observed_at: observedAt,
      customer_segment: 'Business merchant',
      payload: {
        evidence: 'Business Merchant charge is 2% of the received payment value.'
      }
    }
  ];
}

async function collectUgMtnCampaignFees(source) {
  const text = cleanHtmlText(await fetchText(source.base_url));
  const matcher = text.match(/zero transaction fees on all payments below UGX 5,000/i);
  if (!matcher) {
    throw new Error('Could not verify MTN Uganda free-payment notice');
  }

  return [{
    country_code: 'UG',
    city: 'National',
    provider_name: 'MTN MoMo',
    fee_type: 'Customer payment fee',
    amount_band: 'UGX 1-5,000',
    fee_amount: 0,
    transaction_channel: 'MoMoPay',
    source_type: 'official_notice',
    source_url: source.base_url,
    observed_at: new Date().toISOString(),
    customer_segment: 'Payer',
    payload: {
      evidence: matcher[0]
    }
  }];
}

async function collectUgMtnInternationalFees(source) {
  const text = cleanHtmlText(await fetchText(source.base_url));
  const freeReceive = text.match(/Receiving money from abroad is FREE OF CHARGE\./i);
  const sendTier = text.match(/501\s+1,000\s+100/i);
  if (!freeReceive || !sendTier) {
    throw new Error('Could not verify MTN Uganda international remittance fee text');
  }

  const observedAt = new Date().toISOString();
  return [
    {
      country_code: 'UG',
      city: 'National',
      provider_name: 'MTN MoMo',
      fee_type: 'International remittance receive fee',
      amount_band: 'All incoming transfers',
      fee_amount: 0,
      transaction_channel: 'International remittance',
      source_type: 'official_notice',
      source_url: source.base_url,
      observed_at: observedAt,
      customer_segment: 'Receiver',
      payload: {
        evidence: freeReceive[0]
      }
    },
    {
      country_code: 'UG',
      city: 'National',
      provider_name: 'MTN MoMo',
      fee_type: 'International remittance send fee',
      amount_band: 'UGX 501-1,000',
      fee_amount: 100,
      transaction_channel: 'International remittance',
      source_type: 'official_notice',
      source_url: source.base_url,
      observed_at: observedAt,
      customer_segment: 'Sender',
      payload: {
        evidence: '501 1,000 100'
      }
    }
  ];
}

async function collectUgMtnMerchantWallet(source) {
  const text = cleanHtmlText(await fetchText(source.base_url));
  const normalizedText = text.replace(/\u2013/g, '-').replace(/\u00e2\u20ac\u201c/g, '-');
  const tiers = [
    { amount_band: 'UGX 1-2,500', fee_amount: 25, pattern: /1-\s*2,500\s+25/i },
    { amount_band: 'UGX 2,501-5,000', fee_amount: 50, pattern: /2,501\s*[–-]\s*5,000\s+50/i },
    { amount_band: 'UGX 5,001-10,000', fee_amount: 100, pattern: /5,001\s*[–-]\s*10,000\s+100/i }
  ];
  if (!tiers.every(function (tier) { return tier.pattern.test(normalizedText); })) {
    throw new Error('Could not verify MTN Uganda merchant payer tiers');
  }

  const observedAt = new Date().toISOString();
  return tiers.map(function (tier) {
    return {
      country_code: 'UG',
      city: 'National',
      provider_name: 'MTN MoMo',
      fee_type: 'Customer payment fee',
      amount_band: tier.amount_band,
      fee_amount: tier.fee_amount,
      transaction_channel: 'Merchant wallet',
      source_type: 'official_notice',
      source_url: source.base_url,
      observed_at: observedAt,
      customer_segment: 'Payer',
      payload: {
        evidence: tier.amount_band + ' = ' + tier.fee_amount
      }
    };
  });
}

function getCollector(source) {
  const key = cleanText(source?.source_key);
  if (!key) return null;
  if (key.startsWith('wise-') && source.dataset === 'remittance_quote') return collectWiseQuotes;

  const collectors = {
    'gh-mtn-momo-tariffs': collectMtnGhanaFees,
    'ke-safaricom-mpesa-terms': collectSafaricomPaybillFees,
    'ke-safaricom-buy-goods-guide': collectSafaricomBuyGoodsFees,
    'ug-mtn-momopay-faq': collectUgMtnMomopay,
    'ug-mtn-momo-campaign-payments-2026': collectUgMtnCampaignFees,
    'ug-mtn-international-remittances': collectUgMtnInternationalFees,
    'ug-mtn-merchant-wallet': collectUgMtnMerchantWallet
  };
  return collectors[key] || null;
}

async function refreshOneSource(source, options) {
  const collector = getCollector(source);
  if (!collector) {
    return { source_key: source.source_key, status: 'unsupported' };
  }

  const run = await createRun(source.id, source.dataset, {
    trigger: options?.trigger || 'scheduled-refresh-market-data',
    collector: source.source_key,
    publish: options?.publish !== false,
    base_url: source.base_url || null
  });

  try {
    const records = await collector(source);
    if (!Array.isArray(records) || !records.length) {
      throw new Error('Collector returned no records');
    }

    const result = await insertImportedRecords(source.dataset, source, records, {
      publish: options?.publish !== false
    });

    await markSourceSuccess(source.id);
    await finishRun(run?.id, {
      status: result.skipped.length ? 'partial' : 'success',
      records_seen: records.length,
      records_inserted: result.inserted,
      records_published: result.published,
      error_summary: result.skipped.length ? 'Skipped ' + result.skipped.length + ' invalid records' : null
    });

    return {
      source_key: source.source_key,
      status: result.skipped.length ? 'partial' : 'success',
      records_seen: records.length,
      records_inserted: result.inserted,
      records_published: result.published,
      skipped: result.skipped
    };
  } catch (error) {
    await markSourceFailure(source.id);
    await finishRun(run?.id, {
      status: 'failed',
      records_seen: 0,
      records_inserted: 0,
      records_published: 0,
      error_summary: error.message
    });
    return {
      source_key: source.source_key,
      status: 'failed',
      error: error.message
    };
  }
}

async function refreshActiveMarketData(options) {
  const sources = await listActiveSources({
    dataset: options?.dataset,
    sourceKey: options?.sourceKey
  });
  const results = [];

  for (const source of sources) {
    results.push(await refreshOneSource(source, options));
  }

  const summary = results.reduce(function (acc, item) {
    acc.total += 1;
    if (item.status === 'success') acc.success += 1;
    else if (item.status === 'partial') acc.partial += 1;
    else if (item.status === 'unsupported') acc.unsupported += 1;
    else acc.failed += 1;
    return acc;
  }, { total: 0, success: 0, partial: 0, failed: 0, unsupported: 0 });

  return {
    ok: summary.failed === 0,
    summary,
    results
  };
}

module.exports = {
  refreshActiveMarketData,
  getCollector
};
