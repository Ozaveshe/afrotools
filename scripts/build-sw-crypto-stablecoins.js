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
