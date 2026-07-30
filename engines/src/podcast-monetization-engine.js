(function (global) {
  "use strict";
  var FX = Object.freeze({ NG: 1660, KE: 130, ZA: 18.5, GH: 15.5, EG: 48 });
  var SYMBOLS = Object.freeze({ NG: "₦", KE: "KES ", ZA: "R", GH: "GHS ", EG: "EGP " });
  var CPM = Object.freeze({ africa: { pre: 3, mid: 5, post: 2 }, mixed: { pre: 7, mid: 10, post: 5 }, diaspora: { pre: 15, mid: 20, post: 10 } });
  var NICHE = Object.freeze({ business: 1.5, entertainment: 1, news: 1.2, education: 1.3, sports: 1.1, culture: 0.9, tech: 1.4 });
  function calculate(input) {
    var downloads = parseInt(input.downloads, 10) || 5000;
    var episodes = parseInt(input.episodes, 10) || 4;
    var patrons = parseInt(input.patrons, 10) || 0;
    var patronFee = parseFloat(input.patronFee) || 5;
    var downloadsPerEpisode = downloads / episodes;
    var cpm = CPM[input.audience];
    var nicheMultiplier = NICHE[input.niche] || 1;
    function ad(slot) { return downloadsPerEpisode > 1000 ? downloadsPerEpisode / 1000 * cpm[slot] * episodes * nicheMultiplier : 0; }
    var preRoll = ad("pre"), midRoll = ad("mid"), postRoll = ad("post");
    var sponsorship = downloadsPerEpisode >= 1000 ? downloadsPerEpisode / 1000 * 150 * nicheMultiplier : 0;
    var support = patrons * patronFee;
    var merchandise = downloads >= 5000 ? downloads * 0.001 * 15 : 0;
    var streams = [
      { name: "Pre-Roll Ads", monthly: preRoll }, { name: "Mid-Roll Ads", monthly: midRoll },
      { name: "Post-Roll Ads", monthly: postRoll }, { name: "Direct Sponsorships", monthly: sponsorship },
      { name: "Patreon / Listeners", monthly: support }, { name: "Merchandise", monthly: merchandise },
    ];
    var total = streams.reduce(function (sum, stream) { return sum + stream.monthly; }, 0);
    return {
      country: input.country, symbol: SYMBOLS[input.country], rate: FX[input.country],
      downloads: downloads, episodes: episodes, patrons: patrons,
      downloadsPerEpisode: downloadsPerEpisode, adTotal: preRoll + midRoll + postRoll,
      sponsorship: sponsorship, support: support, total: total, streams: streams,
      thresholds: [
        { name: "Programmatic Ads", threshold: 1000 }, { name: "Direct Sponsorships", threshold: 5000 },
        { name: "Premium Sponsors", threshold: 10000 }, { name: "Brand Deals (major)", threshold: 50000 },
      ],
    };
  }
  global.AfroTools = global.AfroTools || {};
  global.AfroTools.PodcastMonetizationEngine = Object.freeze({ calculate: calculate });
})(typeof window !== "undefined" ? window : globalThis);
