(function (global) {
  "use strict";
  var CONTENT = Object.freeze({
    fashion: { edu: ["Style tip of the week", "How to style this piece", "Trend report", "Care guide for fabric"], ent: ["OOTD reveal", "Before/after styling", "Fit check reel", "Behind the scenes"], promo: ["New collection drop", "Limited sale", "Client testimonial"], personal: ["My styling journey", "Throwback look", "Day in my life"] },
    food: { edu: ["Recipe of the week", "Nutrition fact", "Cooking technique", "Ingredient spotlight"], ent: ["Cook-along reel", "Kitchen fail", "Food review", "Market haul"], promo: ["Menu update", "Catering special", "Order now"], personal: ["Chef story", "My food journey", "Kitchen tour"] },
    finance: { edu: ["Money tip", "Investment explainer", "Budget breakdown", "Debt paydown strategy"], ent: ["Financial myth busted", "Money meme", "Rich vs broke"], promo: ["Consultation booking", "Course launch", "Coaching offer"], personal: ["My financial journey", "First income story", "Goal achieved"] },
    tech: { edu: ["Tech tip", "App recommendation", "How-to tutorial", "Digital tool review"], ent: ["Tech unboxing", "Funny tech fail", "Gadget comparison"], promo: ["Product launch", "Service offer", "Client result"], personal: ["Behind the build", "My tech setup", "Startup journey"] },
    beauty: { edu: ["Skincare routine", "Ingredient explainer", "Makeup tutorial", "Hair care tip"], ent: ["Transformation reel", "Glow-up reveal", "Product test"], promo: ["Product launch", "Bundle deal", "Client result"], personal: ["Skin story", "Confidence journey", "Day in my life"] },
    fitness: { edu: ["Workout of week", "Nutrition tip", "Recovery technique", "Form guide"], ent: ["Transformation reel", "Challenge video", "Workout fail"], promo: ["Program launch", "Coaching offer", "Success story"], personal: ["Fitness journey", "Rest day thoughts", "Goal achieved"] },
    comedy: { edu: ["Did you know (funny)", "Lifestyle tip (comic)", "Culture lesson", "Phrase of the week"], ent: ["Skit reel", "Reaction video", "Collaboration", "Trend parody"], promo: ["Merch drop", "Show tickets", "Brand deal"], personal: ["Behind the scenes", "Fan question", "Day in my life"] },
    education: { edu: ["Lesson of the week", "Study tip", "Subject explainer", "Resources list"], ent: ["Quiz", "Debate topic", "Student story"], promo: ["Course launch", "Tutoring offer", "Free resource"], personal: ["Teaching story", "Student success", "Journey update"] },
    music: { edu: ["Music theory tip", "Genre history", "Instrument spotlight", "Studio technique"], ent: ["New track preview", "Studio session", "Freestyle clip"], promo: ["Single release", "Concert dates", "Merchandise"], personal: ["Artist journey", "Inspiration story", "Day in studio"] },
    travel: { edu: ["Travel tip", "Visa guide", "Budget travel hack", "Packing guide"], ent: ["Destination reveal", "Travel mishap", "Culture experience"], promo: ["Travel deal", "Tour package", "Itinerary service"], personal: ["Travel story", "Why I travel", "Home vs abroad"] },
  });
  var TIMES = Object.freeze({ WAT: ["7:30am", "12:30pm", "8:00pm"], EAT: ["8:00am", "1:00pm", "8:30pm"], CAT: ["7:30am", "12:00pm", "8:00pm"], SAST: ["7:30am", "12:00pm", "7:30pm"], EET: ["8:00am", "2:00pm", "8:00pm"], GMT: ["8:00am", "1:00pm", "8:00pm"] });
  var MONTHS = Object.freeze(["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]);
  function generate(input) {
    var month = parseInt(input.month, 10);
    var year = parseInt(input.year, 10);
    var postDays = input.frequency === "daily" ? [0, 1, 2, 3, 4, 5, 6] : input.frequency === "3x" ? [0, 2, 4] : input.frequency === "weekly" ? [0] : [];
    var times = TIMES[input.timezone] || TIMES.WAT;
    var content = CONTENT[input.niche] || CONTENT.fashion;
    var rotation = ["edu", "ent", "ent", "promo", "ent", "edu", "personal"];
    var indexes = { edu: 0, ent: 0, promo: 0, personal: 0 };
    var counts = { edu: 0, ent: 0, promo: 0, personal: 0 };
    var posts = [], total = 0, days = new Date(year, month + 1, 0).getDate();
    for (var day = 1; day <= days; day += 1) {
      var weekday = new Date(year, month, day).getDay();
      if (postDays.indexOf(weekday) < 0) continue;
      total += 1;
      var type = rotation[total % 7];
      var topics = content[type];
      var topic = topics[indexes[type] % topics.length];
      indexes[type] += 1; counts[type] += 1;
      posts.push({ day: day, weekday: weekday, type: type, topic: topic, time: times[total % 3] });
    }
    return { niche: input.niche, platform: input.platform, frequency: input.frequency, timezone: input.timezone, month: month, monthName: MONTHS[month], year: year, daysInMonth: days, startDay: new Date(year, month, 1).getDay(), posts: posts, totalPosts: total, counts: counts };
  }
  global.AfroTools = global.AfroTools || {};
  global.AfroTools.SocialMediaCalendarEngine = Object.freeze({ generate: generate });
})(typeof window !== "undefined" ? window : globalThis);
