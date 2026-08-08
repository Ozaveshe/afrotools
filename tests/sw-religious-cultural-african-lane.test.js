'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const ROOT = path.resolve(__dirname, '..');
const inventory = require('../reports/swahili-free-app-parity-inventory.json');
const acceptance = require('../data/audits/swahili-free-app-acceptance.json');
const religious = require('../data/localization/fr-religious-cultural-parity.json');
const prayerFixtures = require('../data/localization/prayer-times-source-fixtures.json');
const african = require('../data/localization/sw-uniquely-african-parity-manifest.json');
const uaEngine = require('../engines/src/uniquely-african-engine.js');
const remittanceEngine = require('../engines/src/remittance-quote-comparator-engine.js');
const mobileMoneyEngine = require('../assets/js/engines/mobile-money-quote-engine.js');
const rcEngine = require('../assets/js/engines/religious-cultural-parity.js');
const swBuilder = require('../scripts/build-sw-religious-cultural-parity.js');

const acceptedBefore = new Set(acceptance.entries.filter((entry) => entry.status === 'accepted').map((entry) => entry.englishId));
const assigned = inventory.rows.filter((row) => ['religious-cultural', 'african'].includes(row.categoryKey) && !acceptedBefore.has(row.englishId));
const africanLane = new Set(['naira-to-words','amount-words-ke','amount-words-gh','susu-tracker','whatsapp-link','ajo-interest','market-days','ajo-chama-calc','remittance-compare','remittance-v2','mobile-money-fees']);
const sharedAfricanLane = new Set(['naira-to-words','amount-words-ke','amount-words-gh','susu-tracker','whatsapp-link','ajo-interest','market-days','ajo-chama-calc']);

test('assigned denominator is exactly 33 with the requested category split', () => {
  assert.equal(assigned.length, 33);
  assert.equal(assigned.filter((row) => row.categoryKey === 'religious-cultural').length, 19);
  assert.equal(assigned.filter((row) => row.categoryKey === 'african').length, 14);
});

test('19 religious routes are native local workflows with shared date-aware prayer calculations', () => {
  assert.equal(swBuilder.ACCEPTED.size, 19);
  for (const id of swBuilder.ACCEPTED) {
    const route = swBuilder.ROUTES[id];
    const file = path.join(ROOT, route.replace(/^\/+|\/+$/g, ''), 'index.html');
    const html = fs.readFileSync(file, 'utf8');
    assert.match(html, /<html lang="sw"/);
    assert.match(html, /sw-religious-cultural-parity\.js/);
    assert.match(html, /religious-cultural-parity\.js/);
    assert.doesNotMatch(html, /<iframe\b|Fungua zana kamili ya Kiingereza/i);
    assert.match(html, /Hakuna ombi la AI|Hakuna maandishi yanayotumwa kwa AI/);
  }
  for (const id of ['prayer-times', 'ramadan-timetable']) assert.equal(swBuilder.ACCEPTED.has(id), true);
});

test('religious workflow oracles preserve arithmetic and conservative boundaries', () => {
  const cases = [
    ['giving',{reference:1000,rate:10,offering:50,pledge:120,periods:6,essentials:400},'total',170],
    ['lobola',{familyExpectation:1000,giftValue:200,ceremonyCost:300,buffer:10},'total',1650],
    ['giftList',{item1:'A',value1:10,item2:'B',value2:20,item3:'C',value3:30},'total',60],
    ['islamicFinance',{assetPrice:10000,deposit:2000,margin:10,termMonths:12,fees:100},'total',10900],
    ['wedding',{guests:10,foodPerGuest:100,venue:200,attire:100,services:50,buffer:10},'total',1485],
    ['funeral',{guests:10,foodPerGuest:100,mortuary:100,burial:200,transport:50,remembrance:50,buffer:10},'total',1540],
    ['asoEbi',{people:5,fabricYards:3,fabricPrice:10,tailoring:20,accessories:5,delivery:25,discount:10},'total',270]
  ];
  for (const [engine,input,key,expected] of cases) {
    const result = rcEngine.calculate(engine,input);
    assert.equal(result.ok,true,engine);
    assert.equal(result.values[key],expected,engine);
  }
  const halal = rcEngine.calculate('halalReadiness',{ingredients:'yes',suppliers:'unknown',storage:'yes',cleaning:'no',labels:'yes',authority:'Mamlaka ya eneo'});
  assert.equal(halal.values.certification,false);
  const prayer = rcEngine.calculate('prayer',{city:'Nairobi',method:'MWL',school:'standard',date:'2026-04-27'});
  assert.deepEqual({fajr:prayer.values.fajr,maghrib:prayer.values.maghrib,qibla:prayer.values.qibla},{fajr:'05:17',maghrib:'18:32',qibla:7});
  const shifted = rcEngine.calculate('prayer',{city:'Nairobi',method:'MWL',school:'standard',date:'2026-05-27'});
  assert.notEqual(shifted.values.fajr, prayer.values.fajr);
  const ramadan = rcEngine.calculate('ramadan',{city:'Lagos',method:'MWL',school:'standard',startDate:'2026-02-19',days:30,suhoorBuffer:10,iftarBuffer:0});
  assert.equal(ramadan.values.rows.length,30);
  assert.deepEqual({firstSuhoor:ramadan.values.firstSuhoor,firstIftar:ramadan.values.firstIftar,lastSuhoor:ramadan.values.lastSuhoor,lastIftar:ramadan.values.lastIftar},{firstSuhoor:'05:42',firstIftar:'18:59',lastSuhoor:'05:32',lastIftar:'18:58'});
  assert.equal(rcEngine.calculate('prayer',{city:'Nairobi',method:'MWL',date:'2026-02-30'}).ok,false);
  for (const fixture of prayerFixtures.fixtures) {
    if (fixture.input.date) {
      const result = rcEngine.calculate('prayer',fixture.input);
      for (const [key,value] of Object.entries(fixture.expected)) assert.equal(result.values[key],value,`${fixture.id}.${key}`);
    } else {
      const result = rcEngine.calculate('ramadan',fixture.input);
      for (const [key,value] of Object.entries(fixture.expected)) assert.equal(key==='rowCount'?result.values.rows.length:result.values[key],value,`${fixture.id}.${key}`);
    }
  }
});

test('eleven corrected African rows use native engines and three source-risk rows remain blocked', () => {
  assert.equal(african.rows.filter((row) => row.swahili.mode === 'shared-engine').length, 28);
  assert.equal(african.rows.filter((row) => row.swahili.mode === 'native-existing').length, 3);
  assert.equal(african.rows.filter((row) => row.swahili.mode.startsWith('native-blocked')).length, 3);
  for (const id of sharedAfricanLane) {
    const row = african.rows.find((item) => item.english.id === id);
    assert.equal(row.swahili.mode, 'shared-engine');
    const html = fs.readFileSync(path.join(ROOT,row.swahili.file),'utf8');
    assert.match(html,new RegExp(`data-sw-ua-app="${id}"`));
    assert.doesNotMatch(html,/<iframe\b|Fungua zana kamili ya Kiingereza/i);
  }
  for (const id of ['remittance-compare','remittance-v2']) {
    const row=african.rows.find((item)=>item.english.id===id);
    assert.equal(row.swahili.mode,'native-existing');
    const html=fs.readFileSync(path.join(ROOT,row.swahili.file),'utf8');
    assert.match(html,/remittance-quote-comparator-engine\.js/);
    assert.doesNotMatch(html,/Wise|WorldRemit|Remitly|Western Union|MoneyGram|\/api\/forex|ai-advisor/i);
  }
  const mobile=african.rows.find((item)=>item.english.id==='mobile-money-fees');
  assert.equal(mobile.swahili.mode,'native-existing');
  const mobileHtml=fs.readFileSync(path.join(ROOT,mobile.swahili.file),'utf8');
  assert.match(mobileHtml,/mobile-money-quote-engine\.js/);
  assert.doesNotMatch(mobileHtml,/const FEE=|M-Pesa|MTN MoMo|Airtel Money|Orange Money|Wave|OPay/);
});

test('African source-oracle calculations and invalid clearing contracts', () => {
  const cases = [
    ['naira-to-words',{amount:125040.75},'words','One Hundred and Twenty-Five Thousand Forty Naira and Seventy-Five Kobo Only'],
    ['amount-words-ke',{amount:125040.75},'words','Kenya Shillings One Hundred and Twenty-Five Thousand Forty and Cents Seventy-Five Only'],
    ['amount-words-gh',{amount:125040.75},'words','Ghana Cedis One Hundred and Twenty-Five Thousand Forty and Pesewas Seventy-Five Only'],
    ['susu-tracker',{members:6,contribution:500,collectorFee:2,reservePct:5,missedPayments:1,latePenalty:20},'netPot',2790],
    ['whatsapp-link',{countryCode:'254',phoneNumber:'0712345678',message:'Habari'},'link','https://wa.me/254712345678?text=Habari'],
    ['ajo-interest',{members:10,position:3,contribution:10000,fee:2,reservePct:5,lateMembers:1},'payout',98000],
    ['market-days',{date:'2026-01-05'},'marketDay','Orie'],
    ['ajo-chama-calc',{members:8,contribution:5000,numCycles:1,interestRate:0,reserveRate:5,penaltyRate:2},'reserveTotal',16000]
  ];
  for (const [id,input,key,expected] of cases) {
    const result = uaEngine.calculate(id,input);
    assert.equal(result.status,'ok',id);
    assert.equal(result.values[key],expected,id);
  }
  assert.equal(uaEngine.calculate('susu-tracker',{members:1,contribution:500}).status,'invalid');
  assert.equal(uaEngine.calculate('whatsapp-link',{countryCode:'254',phoneNumber:''}).status,'invalid');
  assert.equal(uaEngine.calculate('market-days',{date:'2026-02-30'}).status,'invalid');
  const remittance=remittanceEngine.calculate({asOf:'2026-08-08T12:00:00Z',quotes:[{label:'A',sendCurrency:'USD',receiveCurrency:'KES',totalDebit:500,recipientAmount:64000,statedFee:3,observedAt:'2026-08-08T10:00:00Z',expiresAt:'2026-08-08T13:00:00Z'},{label:'B',sendCurrency:'USD',receiveCurrency:'KES',totalDebit:500,recipientAmount:64500,statedFee:4,observedAt:'2026-08-08T10:05:00Z',expiresAt:''}]});
  assert.equal(remittance.hasEligibleComparison,true);
  assert.equal(remittance.groups[0].highestRecipientAmount,64500);
  assert.equal(remittance.quotes[1].highestAmongEligibleComparable,true);
  const mobileMoney=mobileMoneyEngine.calculate({asOf:'2026-08-08T12:00:00Z',quotes:[{label:'A',market:'Synthetic',currency:'KES',transactionType:'send',amount:5000,senderFee:30,recipientFee:5,observedAt:'2026-08-08T10:00:00Z'},{label:'B',market:'Synthetic',currency:'KES',transactionType:'send',amount:5000,senderFee:20,recipientFee:5,observedAt:'2026-08-08T10:05:00Z'}]});
  assert.equal(mobileMoney.hasEligibleComparison,true);
  assert.equal(mobileMoney.groups[0].lowestTotalFee,25);
  assert.equal(mobileMoney.quotes[1].lowestAmongEligibleComparable,true);
});

test('all assigned accepted routes have dedicated artwork and reciprocal metadata', () => {
  const ids = new Set([...swBuilder.ACCEPTED, ...africanLane]);
  assert.equal(ids.size,30);
  for (const id of ids) {
    const route = swBuilder.ROUTES[id] || african.rows.find((item) => item.english.id === id).swahili.route;
    const file = path.join(ROOT,route.replace(/^\/+|\/+$/g,''),'index.html');
    const html = fs.readFileSync(file,'utf8');
    assert.match(html,new RegExp(`rel="canonical" href="https://afrotools\\.com${route.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}`));
    assert.match(html,/hreflang="en"/);
    assert.match(html,/hreflang="sw"/);
    assert.match(html,/og:image[^>]+assets\/img\/tools\//);
  }
});
