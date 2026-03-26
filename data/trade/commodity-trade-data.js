var CommodityTradeData = (function () {
  'use strict';

  var COUNTRIES = {
    NG: {
      name: 'Nigeria', flag: '🇳🇬', region: 'West Africa',
      topExports: [
        { commodity: 'Crude Petroleum', hsChapter: '27', value: 40200, unit: 'M USD', year: 2024, share: 78.5, category: 'energy' },
        { commodity: 'LNG', hsChapter: '27', value: 5800, unit: 'M USD', year: 2024, share: 11.3, category: 'energy' },
        { commodity: 'Cocoa Beans', hsChapter: '18', value: 820, unit: 'M USD', year: 2024, share: 1.6, category: 'agri' },
        { commodity: 'Sesame Seeds', hsChapter: '12', value: 550, unit: 'M USD', year: 2024, share: 1.1, category: 'agri' },
        { commodity: 'Cashew Nuts', hsChapter: '08', value: 380, unit: 'M USD', year: 2024, share: 0.7, category: 'agri' },
        { commodity: 'Rubber', hsChapter: '40', value: 280, unit: 'M USD', year: 2024, share: 0.5, category: 'agri' },
        { commodity: 'Fertilizers', hsChapter: '31', value: 250, unit: 'M USD', year: 2024, share: 0.5, category: 'chemicals' }
      ],
      topImports: [
        { commodity: 'Refined Petroleum', hsChapter: '27', value: 12500, unit: 'M USD', year: 2024, share: 25.1, category: 'energy' },
        { commodity: 'Vehicles', hsChapter: '87', value: 3800, unit: 'M USD', year: 2024, share: 7.6, category: 'manufacturing' },
        { commodity: 'Cereals (Wheat)', hsChapter: '10', value: 3200, unit: 'M USD', year: 2024, share: 6.4, category: 'agri' },
        { commodity: 'Machinery', hsChapter: '84', value: 3100, unit: 'M USD', year: 2024, share: 6.2, category: 'manufacturing' },
        { commodity: 'Electrical Equipment', hsChapter: '85', value: 2800, unit: 'M USD', year: 2024, share: 5.6, category: 'manufacturing' },
        { commodity: 'Plastics', hsChapter: '39', value: 2200, unit: 'M USD', year: 2024, share: 4.4, category: 'chemicals' },
        { commodity: 'Iron & Steel', hsChapter: '72', value: 2000, unit: 'M USD', year: 2024, share: 4.0, category: 'metals' },
        { commodity: 'Pharmaceutical Products', hsChapter: '30', value: 1500, unit: 'M USD', year: 2024, share: 3.0, category: 'chemicals' },
        { commodity: 'Sugar', hsChapter: '17', value: 1200, unit: 'M USD', year: 2024, share: 2.4, category: 'agri' },
        { commodity: 'Fish (Frozen)', hsChapter: '03', value: 900, unit: 'M USD', year: 2024, share: 1.8, category: 'agri' }
      ],
      tradeBalance: -15200,
      topPartners: { exports: ['India', 'Spain', 'Netherlands', 'USA', 'France'], imports: ['China', 'India', 'USA', 'Netherlands', 'Belgium'] },
      totalExports: 51280, totalImports: 49800
    },
    KE: {
      name: 'Kenya', flag: '🇰🇪', region: 'East Africa',
      topExports: [
        { commodity: 'Tea', hsChapter: '09', value: 1450, unit: 'M USD', year: 2024, share: 22.5, category: 'agri' },
        { commodity: 'Cut Flowers', hsChapter: '06', value: 850, unit: 'M USD', year: 2024, share: 13.2, category: 'agri' },
        { commodity: 'Coffee', hsChapter: '09', value: 280, unit: 'M USD', year: 2024, share: 4.3, category: 'agri' },
        { commodity: 'Vegetables', hsChapter: '07', value: 260, unit: 'M USD', year: 2024, share: 4.0, category: 'agri' },
        { commodity: 'Titanium Ores', hsChapter: '26', value: 240, unit: 'M USD', year: 2024, share: 3.7, category: 'metals' },
        { commodity: 'Apparel', hsChapter: '61', value: 180, unit: 'M USD', year: 2024, share: 2.8, category: 'manufacturing' }
      ],
      topImports: [
        { commodity: 'Refined Petroleum', hsChapter: '27', value: 4200, unit: 'M USD', year: 2024, share: 20.5, category: 'energy' },
        { commodity: 'Machinery', hsChapter: '84', value: 2100, unit: 'M USD', year: 2024, share: 10.3, category: 'manufacturing' },
        { commodity: 'Vehicles', hsChapter: '87', value: 1500, unit: 'M USD', year: 2024, share: 7.3, category: 'manufacturing' },
        { commodity: 'Iron & Steel', hsChapter: '72', value: 1200, unit: 'M USD', year: 2024, share: 5.9, category: 'metals' },
        { commodity: 'Electrical Equipment', hsChapter: '85', value: 1100, unit: 'M USD', year: 2024, share: 5.4, category: 'manufacturing' },
        { commodity: 'Pharmaceutical Products', hsChapter: '30', value: 700, unit: 'M USD', year: 2024, share: 3.4, category: 'chemicals' },
        { commodity: 'Palm Oil', hsChapter: '15', value: 650, unit: 'M USD', year: 2024, share: 3.2, category: 'agri' }
      ],
      tradeBalance: -14200,
      topPartners: { exports: ['Uganda', 'Pakistan', 'USA', 'UK', 'Tanzania'], imports: ['China', 'India', 'UAE', 'Saudi Arabia', 'Japan'] },
      totalExports: 6450, totalImports: 20450
    },
    ZA: {
      name: 'South Africa', flag: '🇿🇦', region: 'Southern Africa',
      topExports: [
        { commodity: 'Gold', hsChapter: '71', value: 12500, unit: 'M USD', year: 2024, share: 11.8, category: 'metals' },
        { commodity: 'Platinum Group Metals', hsChapter: '71', value: 11200, unit: 'M USD', year: 2024, share: 10.6, category: 'metals' },
        { commodity: 'Iron Ore', hsChapter: '26', value: 8500, unit: 'M USD', year: 2024, share: 8.0, category: 'metals' },
        { commodity: 'Coal', hsChapter: '27', value: 7200, unit: 'M USD', year: 2024, share: 6.8, category: 'energy' },
        { commodity: 'Vehicles', hsChapter: '87', value: 6800, unit: 'M USD', year: 2024, share: 6.4, category: 'manufacturing' },
        { commodity: 'Machinery', hsChapter: '84', value: 4500, unit: 'M USD', year: 2024, share: 4.3, category: 'manufacturing' },
        { commodity: 'Citrus Fruits', hsChapter: '08', value: 2100, unit: 'M USD', year: 2024, share: 2.0, category: 'agri' },
        { commodity: 'Wine', hsChapter: '22', value: 800, unit: 'M USD', year: 2024, share: 0.8, category: 'agri' }
      ],
      topImports: [
        { commodity: 'Crude Petroleum', hsChapter: '27', value: 15000, unit: 'M USD', year: 2024, share: 15.2, category: 'energy' },
        { commodity: 'Vehicles', hsChapter: '87', value: 7500, unit: 'M USD', year: 2024, share: 7.6, category: 'manufacturing' },
        { commodity: 'Machinery', hsChapter: '84', value: 7000, unit: 'M USD', year: 2024, share: 7.1, category: 'manufacturing' },
        { commodity: 'Electrical Equipment', hsChapter: '85', value: 6500, unit: 'M USD', year: 2024, share: 6.6, category: 'manufacturing' },
        { commodity: 'Pharmaceutical Products', hsChapter: '30', value: 3200, unit: 'M USD', year: 2024, share: 3.2, category: 'chemicals' }
      ],
      tradeBalance: 7500,
      topPartners: { exports: ['China', 'USA', 'Germany', 'Japan', 'UK'], imports: ['China', 'Germany', 'USA', 'India', 'Saudi Arabia'] },
      totalExports: 105800, totalImports: 98300
    },
    GH: {
      name: 'Ghana', flag: '🇬🇭', region: 'West Africa',
      topExports: [
        { commodity: 'Gold', hsChapter: '71', value: 7800, unit: 'M USD', year: 2024, share: 42.0, category: 'metals' },
        { commodity: 'Crude Petroleum', hsChapter: '27', value: 3200, unit: 'M USD', year: 2024, share: 17.2, category: 'energy' },
        { commodity: 'Cocoa Beans', hsChapter: '18', value: 2800, unit: 'M USD', year: 2024, share: 15.1, category: 'agri' },
        { commodity: 'Cocoa Products', hsChapter: '18', value: 850, unit: 'M USD', year: 2024, share: 4.6, category: 'agri' },
        { commodity: 'Manganese Ore', hsChapter: '26', value: 450, unit: 'M USD', year: 2024, share: 2.4, category: 'metals' }
      ],
      topImports: [
        { commodity: 'Refined Petroleum', hsChapter: '27', value: 3100, unit: 'M USD', year: 2024, share: 18.0, category: 'energy' },
        { commodity: 'Vehicles', hsChapter: '87', value: 1200, unit: 'M USD', year: 2024, share: 7.0, category: 'manufacturing' },
        { commodity: 'Machinery', hsChapter: '84', value: 1100, unit: 'M USD', year: 2024, share: 6.4, category: 'manufacturing' },
        { commodity: 'Iron & Steel', hsChapter: '72', value: 900, unit: 'M USD', year: 2024, share: 5.2, category: 'metals' },
        { commodity: 'Plastics', hsChapter: '39', value: 700, unit: 'M USD', year: 2024, share: 4.1, category: 'chemicals' }
      ],
      tradeBalance: 5500,
      topPartners: { exports: ['Switzerland', 'India', 'China', 'UAE', 'South Africa'], imports: ['China', 'USA', 'India', 'Netherlands', 'France'] },
      totalExports: 18600, totalImports: 13100
    },
    EG: {
      name: 'Egypt', flag: '🇪🇬', region: 'North Africa',
      topExports: [
        { commodity: 'Petroleum Products', hsChapter: '27', value: 8500, unit: 'M USD', year: 2024, share: 22.5, category: 'energy' },
        { commodity: 'LNG', hsChapter: '27', value: 4200, unit: 'M USD', year: 2024, share: 11.1, category: 'energy' },
        { commodity: 'Fertilizers', hsChapter: '31', value: 2800, unit: 'M USD', year: 2024, share: 7.4, category: 'chemicals' },
        { commodity: 'Oranges & Citrus', hsChapter: '08', value: 1200, unit: 'M USD', year: 2024, share: 3.2, category: 'agri' },
        { commodity: 'Textiles & Garments', hsChapter: '61', value: 1100, unit: 'M USD', year: 2024, share: 2.9, category: 'manufacturing' }
      ],
      topImports: [
        { commodity: 'Wheat', hsChapter: '10', value: 4500, unit: 'M USD', year: 2024, share: 9.5, category: 'agri' },
        { commodity: 'Crude Petroleum', hsChapter: '27', value: 3800, unit: 'M USD', year: 2024, share: 8.0, category: 'energy' },
        { commodity: 'Machinery', hsChapter: '84', value: 3200, unit: 'M USD', year: 2024, share: 6.7, category: 'manufacturing' },
        { commodity: 'Electrical Equipment', hsChapter: '85', value: 2900, unit: 'M USD', year: 2024, share: 6.1, category: 'manufacturing' },
        { commodity: 'Iron & Steel', hsChapter: '72', value: 2400, unit: 'M USD', year: 2024, share: 5.0, category: 'metals' }
      ],
      tradeBalance: -23000,
      topPartners: { exports: ['Italy', 'Turkey', 'Spain', 'India', 'USA'], imports: ['China', 'Russia', 'Saudi Arabia', 'USA', 'Germany'] },
      totalExports: 37800, totalImports: 60800
    },
    ET: {
      name: 'Ethiopia', flag: '🇪🇹', region: 'East Africa',
      topExports: [
        { commodity: 'Coffee', hsChapter: '09', value: 1250, unit: 'M USD', year: 2024, share: 28.5, category: 'agri' },
        { commodity: 'Gold', hsChapter: '71', value: 580, unit: 'M USD', year: 2024, share: 13.2, category: 'metals' },
        { commodity: 'Oil Seeds (Sesame)', hsChapter: '12', value: 450, unit: 'M USD', year: 2024, share: 10.3, category: 'agri' },
        { commodity: 'Chat/Khat', hsChapter: '12', value: 380, unit: 'M USD', year: 2024, share: 8.7, category: 'agri' },
        { commodity: 'Cut Flowers', hsChapter: '06', value: 320, unit: 'M USD', year: 2024, share: 7.3, category: 'agri' }
      ],
      topImports: [
        { commodity: 'Machinery', hsChapter: '84', value: 2100, unit: 'M USD', year: 2024, share: 15.0, category: 'manufacturing' },
        { commodity: 'Vehicles', hsChapter: '87', value: 1500, unit: 'M USD', year: 2024, share: 10.7, category: 'manufacturing' },
        { commodity: 'Refined Petroleum', hsChapter: '27', value: 1800, unit: 'M USD', year: 2024, share: 12.9, category: 'energy' },
        { commodity: 'Electrical Equipment', hsChapter: '85', value: 900, unit: 'M USD', year: 2024, share: 6.4, category: 'manufacturing' },
        { commodity: 'Pharmaceutical Products', hsChapter: '30', value: 500, unit: 'M USD', year: 2024, share: 3.6, category: 'chemicals' }
      ],
      tradeBalance: -9900,
      topPartners: { exports: ['USA', 'Germany', 'Saudi Arabia', 'Japan', 'Belgium'], imports: ['China', 'India', 'USA', 'UAE', 'Turkey'] },
      totalExports: 4380, totalImports: 14000
    },
    TZ: {
      name: 'Tanzania', flag: '🇹🇿', region: 'East Africa',
      topExports: [
        { commodity: 'Gold', hsChapter: '71', value: 2800, unit: 'M USD', year: 2024, share: 35.0, category: 'metals' },
        { commodity: 'Tobacco', hsChapter: '24', value: 450, unit: 'M USD', year: 2024, share: 5.6, category: 'agri' },
        { commodity: 'Cashew Nuts', hsChapter: '08', value: 380, unit: 'M USD', year: 2024, share: 4.8, category: 'agri' },
        { commodity: 'Coffee', hsChapter: '09', value: 250, unit: 'M USD', year: 2024, share: 3.1, category: 'agri' },
        { commodity: 'Tea', hsChapter: '09', value: 180, unit: 'M USD', year: 2024, share: 2.3, category: 'agri' }
      ],
      topImports: [
        { commodity: 'Refined Petroleum', hsChapter: '27', value: 2800, unit: 'M USD', year: 2024, share: 20.0, category: 'energy' },
        { commodity: 'Machinery', hsChapter: '84', value: 1400, unit: 'M USD', year: 2024, share: 10.0, category: 'manufacturing' },
        { commodity: 'Vehicles', hsChapter: '87', value: 1000, unit: 'M USD', year: 2024, share: 7.1, category: 'manufacturing' },
        { commodity: 'Iron & Steel', hsChapter: '72', value: 800, unit: 'M USD', year: 2024, share: 5.7, category: 'metals' },
        { commodity: 'Electrical Equipment', hsChapter: '85', value: 700, unit: 'M USD', year: 2024, share: 5.0, category: 'manufacturing' }
      ],
      tradeBalance: -6020,
      topPartners: { exports: ['India', 'Switzerland', 'China', 'Belgium', 'Kenya'], imports: ['China', 'India', 'UAE', 'Saudi Arabia', 'South Africa'] },
      totalExports: 8000, totalImports: 14020
    },
    CI: {
      name: 'Côte d\'Ivoire', flag: '🇨🇮', region: 'West Africa',
      topExports: [
        { commodity: 'Cocoa Beans', hsChapter: '18', value: 5200, unit: 'M USD', year: 2024, share: 35.0, category: 'agri' },
        { commodity: 'Cocoa Paste/Butter', hsChapter: '18', value: 2100, unit: 'M USD', year: 2024, share: 14.2, category: 'agri' },
        { commodity: 'Rubber', hsChapter: '40', value: 1200, unit: 'M USD', year: 2024, share: 8.1, category: 'agri' },
        { commodity: 'Petroleum Products', hsChapter: '27', value: 900, unit: 'M USD', year: 2024, share: 6.1, category: 'energy' },
        { commodity: 'Cashew Nuts', hsChapter: '08', value: 850, unit: 'M USD', year: 2024, share: 5.7, category: 'agri' }
      ],
      topImports: [
        { commodity: 'Crude Petroleum', hsChapter: '27', value: 2200, unit: 'M USD', year: 2024, share: 16.0, category: 'energy' },
        { commodity: 'Machinery', hsChapter: '84', value: 1200, unit: 'M USD', year: 2024, share: 8.7, category: 'manufacturing' },
        { commodity: 'Vehicles', hsChapter: '87', value: 900, unit: 'M USD', year: 2024, share: 6.5, category: 'manufacturing' },
        { commodity: 'Rice', hsChapter: '10', value: 800, unit: 'M USD', year: 2024, share: 5.8, category: 'agri' },
        { commodity: 'Pharmaceutical Products', hsChapter: '30', value: 600, unit: 'M USD', year: 2024, share: 4.4, category: 'chemicals' }
      ],
      tradeBalance: 3350,
      topPartners: { exports: ['Netherlands', 'USA', 'Belgium', 'Malaysia', 'France'], imports: ['China', 'Nigeria', 'France', 'India', 'USA'] },
      totalExports: 14820, totalImports: 13750
    }
  };

  var COMMODITY_PRICES = {
    crude_oil:        { name: 'Crude Oil (Brent)', unit: 'barrel', currency: 'USD', source: 'ICE Brent', refPrice: 82 },
    gold:             { name: 'Gold', unit: 'troy oz', currency: 'USD', source: 'London Fix', refPrice: 2340 },
    cocoa:            { name: 'Cocoa', unit: 'tonne', currency: 'USD', source: 'ICE New York', refPrice: 9200 },
    coffee_arabica:   { name: 'Coffee (Arabica)', unit: 'lb', currency: 'USD', source: 'ICE New York', refPrice: 2.10 },
    coffee_robusta:   { name: 'Coffee (Robusta)', unit: 'tonne', currency: 'USD', source: 'ICE London', refPrice: 4800 },
    tea:              { name: 'Tea (CTC)', unit: 'kg', currency: 'USD', source: 'Mombasa Auction', refPrice: 2.80 },
    cotton:           { name: 'Cotton', unit: 'lb', currency: 'USD', source: 'ICE New York', refPrice: 0.85 },
    copper:           { name: 'Copper', unit: 'tonne', currency: 'USD', source: 'LME London', refPrice: 9800 },
    platinum:         { name: 'Platinum', unit: 'troy oz', currency: 'USD', source: 'London Fix', refPrice: 980 },
    cashew:           { name: 'Cashew (W320)', unit: 'tonne', currency: 'USD', source: 'Global market', refPrice: 3500 },
    sesame:           { name: 'Sesame Seeds', unit: 'tonne', currency: 'USD', source: 'Global market', refPrice: 1400 }
  };

  var CATEGORIES = [
    { id: 'all', label: 'All Categories' },
    { id: 'agri', label: 'Agriculture & Food' },
    { id: 'energy', label: 'Energy & Fuels' },
    { id: 'metals', label: 'Metals & Mining' },
    { id: 'manufacturing', label: 'Manufactured Goods' },
    { id: 'chemicals', label: 'Chemicals & Pharma' }
  ];

  return {
    countries: COUNTRIES,
    commodityPrices: COMMODITY_PRICES,
    categories: CATEGORIES,
    getCountry: function (code) { return COUNTRIES[code] || null; },
    getAllCountries: function () {
      return Object.keys(COUNTRIES).map(function (code) {
        return { code: code, name: COUNTRIES[code].name, flag: COUNTRIES[code].flag, region: COUNTRIES[code].region };
      });
    },
    getCommoditiesForCountry: function (code, type, category) {
      var c = COUNTRIES[code];
      if (!c) return [];
      var list = type === 'imports' ? c.topImports : c.topExports;
      if (category && category !== 'all') {
        list = list.filter(function (i) { return i.category === category; });
      }
      return list;
    },
    getCommodityByName: function (commodityName) {
      var result = [];
      Object.keys(COUNTRIES).forEach(function (code) {
        var c = COUNTRIES[code];
        ['topExports', 'topImports'].forEach(function (type) {
          (c[type] || []).forEach(function (item) {
            if (item.commodity.toLowerCase().includes(commodityName.toLowerCase())) {
              result.push({ countryCode: code, countryName: c.name, flag: c.flag, type: type === 'topExports' ? 'export' : 'import', item: item });
            }
          });
        });
      });
      return result;
    }
  };
})();
