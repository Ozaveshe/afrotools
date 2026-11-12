'use strict';

// Synthetic provider-shaped observations; never production market data.
function snapshot(currency) {
  const now = new Date();
  const old = new Date(now.getTime() - 90 * 1000).toISOString();
  return {
    status: 'fresh',
    source: { name: 'CoinGecko', url: 'https://www.coingecko.com/' },
    currency,
    count: 3,
    requestedLimit: 100,
    fetchedAt: now.toISOString(),
    sourceUpdatedAt: old,
    latestSourceUpdatedAt: old,
    freshnessCeilingMinutes: 30,
    cache: 'miss',
    data: [
      {
        id: 'bitcoin', name: 'Bitcoin', symbol: 'btc', image: 'https://example.test/btc.png',
        current_price: currency === 'ngn' ? 150000000 : 1800000, market_cap_rank: 1,
        price_change_percentage_24h_in_currency: 1.23,
        price_change_percentage_7d_in_currency: -2.34,
        market_cap: 3000000000000, total_volume: 120000000,
        ath: 170000000, atl: 1000, circulating_supply: 19900000,
        last_updated: old, sparkline_in_7d: { price: [90, 92, 91, 97, 100] }
      },
      {
        id: 'ethereum', name: 'Ethereum', symbol: 'eth', image: 'https://example.test/eth.png',
        current_price: currency === 'ngn' ? 2500000 : 30000, market_cap_rank: 2,
        price_change_percentage_24h_in_currency: -0.55,
        price_change_percentage_7d_in_currency: 4.2,
        market_cap: 600000000000, total_volume: 50000000,
        ath: 7000000, atl: 500, circulating_supply: 120000000,
        last_updated: old, sparkline_in_7d: { price: [80, 78, 82, 84, 83] }
      },
      {
        id: 'tether', name: 'Tether', symbol: 'usdt', image: 'https://example.test/usdt.png',
        current_price: currency === 'ngn' ? 1450 : 17.5, market_cap_rank: 3,
        price_change_percentage_24h_in_currency: 0.01,
        price_change_percentage_7d_in_currency: 0.02,
        market_cap: 200000000000, total_volume: 30000000,
        ath: 1600, atl: 10, circulating_supply: 100000000000,
        last_updated: old, sparkline_in_7d: { price: [10, 10.1, 10, 10.2, 10.1] }
      }
    ]
  };
}

module.exports = { snapshot };
