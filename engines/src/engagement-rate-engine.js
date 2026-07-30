(function (global) {
  "use strict";
  var BENCHMARKS = Object.freeze({
    tiktok: { low: 2, average: 5, good: 9, excellent: 15, platform: "TikTok" },
    instagram: { low: 1, average: 3, good: 6, excellent: 10, platform: "Instagram" },
    twitter: { low: 0.5, average: 1.5, good: 3, excellent: 5, platform: "Twitter/X" },
    linkedin: { low: 1, average: 3, good: 5, excellent: 8, platform: "LinkedIn" },
    facebook: { low: 0.5, average: 1, good: 2.5, excellent: 4, platform: "Facebook" },
  });
  var TIPS = Object.freeze({
    tiktok: ["Post at peak WAT hours: 7am, 1pm, 8pm", "Use trending sounds within 48hrs of them going viral", "Keep videos under 30 seconds for max completion rate", "Reply to every comment in the first hour", "Use 3–5 niche hashtags + 2 trending hashtags"],
    instagram: ["Post Reels 3–4x per week — algorithm heavily favours video", "Carousel posts get 3x more reach than single images", "Story polls and question stickers boost engagement signals", "Post at 7:30am, 12:30pm, or 8pm WAT for peak reach", "Use 8–12 relevant hashtags (avoid generic ones with 500M+ posts)"],
    twitter: ["Tweet threads consistently outperform single tweets", "Reply to trending conversations in your niche within 30 mins", "Use polls to drive easy engagement from passive followers", "Post 2–4 times daily for algorithm visibility", "Images and videos get 3x more engagement than text-only tweets"],
    linkedin: ["Write long-form text posts (500–1,500 chars) — LinkedIn rewards depth", "Post between 8–10am on Tuesday–Thursday for B2B audience", "Comment meaningfully on 10 posts before publishing your own", "Use only 3–5 hashtags — LinkedIn penalises hashtag spam", "Document your journey — personal stories outperform promotional content"],
    facebook: ["Facebook Groups outperform Pages 5x for organic reach", "Video content (especially Facebook Live) gets largest organic reach", "Ask questions to trigger comments — Facebook rewards comment threads", "Post at 7:30am, 1pm, or 8pm local time", "Avoid external links in post body — add links in first comment"],
  });
  function calculate(input) {
    var followers = parseInt(input.followers, 10) || 25000;
    var likes = parseInt(input.likes, 10) || 0;
    var comments = parseInt(input.comments, 10) || 0;
    var shares = parseInt(input.shares, 10) || 0;
    var saves = parseInt(input.saves, 10) || 0;
    var interactions = likes + comments + shares + saves;
    var rate = followers > 0 ? interactions / followers * 100 : 0;
    var benchmark = BENCHMARKS[input.platform];
    var grade = rate >= benchmark.excellent ? ["A+", "er-excellent", "Excellent"] :
      rate >= benchmark.good ? ["A", "er-good", "Good"] :
        rate >= benchmark.average ? ["B", "er-average", "Average"] :
          ["C", "er-low", "Below Average"];
    return {
      platform: input.platform, followers: followers, likes: likes, comments: comments,
      shares: shares, saves: saves, interactions: interactions, rate: rate, benchmark: benchmark,
      grade: grade[0], gradeClass: grade[1], gradeLabel: grade[2],
      tips: TIPS[input.platform] || TIPS.instagram,
      benchmarkLevels: [
        { label: "Low", value: benchmark.low }, { label: "Average", value: benchmark.average },
        { label: "Good", value: benchmark.good }, { label: "Excellent", value: benchmark.excellent },
      ],
      monetizationStreams: [
        { name: "Nano/Micro Brand Deals", threshold: benchmark.average },
        { name: "Affiliate Marketing", threshold: benchmark.good },
        { name: "Platform Monetization", threshold: benchmark.good },
        { name: "Premium Content / Patreon", threshold: benchmark.excellent },
      ],
    };
  }
  global.AfroTools = global.AfroTools || {};
  global.AfroTools.EngagementRateEngine = Object.freeze({ calculate: calculate });
})(typeof window !== "undefined" ? window : globalThis);
