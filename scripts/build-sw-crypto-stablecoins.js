"use strict";
const fs = require("node:fs"),
  path = require("node:path"),
  root = path.resolve(__dirname, "..");
let s = fs.readFileSync(
    path.join(root, "crypto/stablecoins/index.html"),
    "utf8",
  ),
  route = "https://afrotools.com/sw/zana/marejeo-ya-stablecoin/";
s = s
  .replace('lang="en"', 'lang="sw"')
  .replaceAll("https://afrotools.com/crypto/stablecoins/", route)
  .replace("en_US", "sw_KE")
  .replace(
    '"name": "AfroTools Stablecoin Reference Snapshot"',
    '"name": "Muhtasari wa Marejeo ya Stablecoin wa AfroTools"',
  )
  .replace('"inLanguage": "en"', '"inLanguage": "sw"');
s = s
  .replace(
    `<link rel="alternate" hreflang="en" href="${route}">`,
    '<link rel="alternate" hreflang="en" href="https://afrotools.com/crypto/stablecoins/">',
  )
  .replace(
    `<link rel="alternate" hreflang="x-default" href="${route}">`,
    '<link rel="alternate" hreflang="x-default" href="https://afrotools.com/crypto/stablecoins/">',
  );
const p = [
  [
    "USDT, USDC and DAI Reference Prices in NGN and ZAR",
    "Bei za Marejeo za USDT, USDC na DAI kwa NGN na ZAR",
  ],
  [
    "Stablecoin Reference Snapshot in NGN and ZAR",
    "Muhtasari wa Marejeo ya Stablecoin kwa NGN na ZAR",
  ],
  ["Stablecoin Reference Snapshot", "Muhtasari wa Marejeo ya Stablecoin"],
  [
    "Provider reference, clearly scoped",
    "Marejeo ya mtoa data yenye upeo wazi",
  ],
  [
    "Stablecoin prices without invented platform quotes.",
    "Bei za stablecoin bila kubuni nukuu za majukwaa.",
  ],
  [
    "Inspect recent CoinGecko reference prices for USDT, USDC and DAI in USD plus Nigerian Naira or South African Rand. Every displayed row carries its provider time. No platform premium, spread, fee or recommendation is inferred.",
    "Kagua bei mpya za marejeo za CoinGecko kwa USDT, USDC na DAI katika USD pamoja na Naira ya Nigeria au Rand ya Afrika Kusini. Kila safu ina muda wa mtoa data. Hakuna malipo ya jukwaa, spread, ada wala pendekezo linalokadiriwa.",
  ],
  ["Stablecoin reference snapshot", "Muhtasari wa marejeo ya stablecoin"],
  ["Snapshot receipt", "Risiti ya muhtasari"],
  ["Snapshot state", "Hali ya muhtasari"],
  ["Checking freshness", "Inakagua upya"],
  ["Fresh rows", "Safu mpya"],
  ["Oldest provider update", "Sasisho la zamani zaidi la mtoa data"],
  ["AfroTools fetched", "AfroTools ilipakua"],
  ["Local reference currency", "Sarafu ya marejeo ya ndani"],
  ["Nigerian Naira", "Naira ya Nigeria"],
  ["South African Rand", "Rand ya Afrika Kusini"],
  ["Refresh", "Pakia upya"],
  ["CSV receipt", "Risiti ya CSV"],
  ["JSON receipt", "Risiti ya JSON"],
  [
    "Checking CoinGecko for a fresh stablecoin reference snapshot…",
    "Inakagua CoinGecko kwa muhtasari mpya wa marejeo ya stablecoin…",
  ],
  ["Cache receipt", "Risiti ya akiba"],
  [
    "Fresh CoinGecko reference prices for USDT, USDC and DAI",
    "Bei mpya za marejeo za CoinGecko kwa USDT, USDC na DAI",
  ],
  ["Asset", "Mali"],
  ["USD reference", "Rejeo la USD"],
  ["Local reference", "Rejeo la ndani"],
  ["USD 24h change", "Mabadiliko ya USD saa 24"],
  ["USD peg distance", "Umbali kutoka USD 1"],
  ["Provider updated", "Mtoa data alisasisha"],
  [
    "Are these exchange or P2P stablecoin prices?",
    "Je, hizi ni bei za stablecoin za jukwaa au P2P?",
  ],
  ["What is USD peg distance?", "Umbali kutoka USD 1 ni nini?"],
  [
    "How fresh must a displayed row be?",
    "Safu inayoonekana lazima iwe mpya kiasi gani?",
  ],
  ["Related tools", "Zana zinazohusiana"],
];
for (const [a, b] of p) s = s.replaceAll(a, b);
s = s
  .replaceAll("What the snapshot measures", "Muhtasari huu unapima nini")
  .replaceAll("AfroTools requests three fixed CoinGecko asset IDs through a dedicated server function. Each asset must include positive USD and local reference prices plus a provider timestamp no more than 30 minutes old. A row that fails those checks is withheld. If no row survives, the table closes safely.", "AfroTools huomba vitambulisho vitatu maalumu vya mali kutoka CoinGecko kupitia huduma ya server iliyotengwa. Kila mali lazima iwe na bei chanya ya marejeo ya USD na sarafu ya ndani, pamoja na muda wa mtoa data usiozidi dakika 30. Safu isiyopita ukaguzi huo haionyeshwi. Ikiwa hakuna safu halali, jedwali hufungwa kwa usalama.")
  .replaceAll("is derived only as the percentage difference between the CoinGecko Rejeo la USD and 1 USD. It can help describe the provider snapshot, but it is not an exchange premium, platform spread, fee, savings yield or forecast.", "hukokotolewa tu kama tofauti ya asilimia kati ya rejeo la USD la CoinGecko na USD 1. Husaidia kueleza muhtasari wa mtoa data, lakini si nyongeza ya bei ya ubadilishaji, tofauti ya jukwaa, ada, faida ya akiba wala utabiri.")
  .replaceAll("Use the right evidence", "Tumia ushahidi unaofaa")
  .replaceAll("These values are indicative provider references, not executable quotes.", "Thamani hizi ni marejeo ya mtoa data, si nukuu zinazoweza kutekelezwa.")
  .replaceAll("Verify the exact platform, payment method, network, fees and withdrawal conditions before acting.", "Thibitisha jukwaa, njia ya malipo, mtandao, ada na masharti ya kutoa fedha kabla ya kuchukua hatua.")
  .replaceAll("NGN and ZAR are shown because they are the African quote currencies verified directly with this provider contract.", "NGN na ZAR zinaonyeshwa kwa sababu ndizo sarafu za Afrika zilizothibitishwa moja kwa moja katika mkataba huu wa mtoa data.")
  .replaceAll("Exports include the source, scope, quote currency and timestamps. PDF is not offered because structured CSV and JSON preserve the receipt.", "Faili zina chanzo, upeo, sarafu ya nukuu na mihuri ya muda. PDF haitolewi kwa sababu CSV na JSON zenye muundo huhifadhi risiti kwa usahihi.")
  .replaceAll("This is market information, not financial advice.", "Hii ni taarifa ya soko, si ushauri wa kifedha.")
  .replaceAll("Stablecoin reference FAQ", "Maswali kuhusu marejeo ya stablecoin")
  .replaceAll("Does the lowest peg distance identify the best stablecoin?", "Je, umbali mdogo zaidi kutoka USD 1 unaonyesha stablecoin bora?")
  .replaceAll("No. A single provider price does not assess issuer reserves, redemption access, smart-contract risk, network availability, regulation, liquidity or your platformâ€™s executable price.", "Hapana. Bei ya mtoa data mmoja haitathmini akiba ya mtoaji, uwezo wa kukomboa, hatari ya smart contract, upatikanaji wa mtandao, kanuni, ukwasi wala bei inayotekelezeka kwenye jukwaa lako.")
  .replaceAll("Why are there no platform rankings?", "Kwa nini hakuna orodha ya ubora wa majukwaa?")
  .replaceAll("This app has no current, complete platform-quote source for USDT, USDC and DAI. It therefore does not invent platform rates, trust scores, fees, processing times, spreads or recommendations.", "Programu haina chanzo cha sasa na kamili cha nukuu za majukwaa kwa USDT, USDC na DAI. Kwa hiyo haitungi viwango, alama za uaminifu, ada, muda wa uchakataji, tofauti za bei wala mapendekezo.")
  .replaceAll("What happens when the provider is unavailable?", "Nini hutokea mtoa data asipopatikana?")
  .replaceAll("No expired cache, hard-coded fallback or estimated local conversion is shown. The page reports that fresh provider data is unavailable and keeps exports disabled until a fresh snapshot loads.", "Hakuna akiba iliyoisha, thamani mbadala iliyowekwa moja kwa moja wala ubadilishaji wa ndani uliokadiriwa unaoonyeshwa. Ukurasa husema data mpya haipatikani na huzuia faili hadi muhtasari mpya upatikane.");
s = s
  .replace(
    /<script src="\/assets\/js\/analytics-bootstrap[^>]*><\/script>\s*/,
    "",
  )
  .replace(/<script src="\/assets\/js\/lazy-analytics[^>]*><\/script>/, "")
  .replace(/[ \t]+$/gm, "");
fs.mkdirSync(path.join(root, "sw/zana/marejeo-ya-stablecoin"), {
  recursive: true,
});
fs.writeFileSync(
  path.join(root, "sw/zana/marejeo-ya-stablecoin/index.html"),
  s,
);
