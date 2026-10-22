#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const OUT_PATH = path.join(
  ROOT,
  "data",
  "afrokitchen",
  "recipe-expansion-batches",
  "2026-05-03-gap-fill-wave-1.json"
);

const reviewedAt = "2026-05-03";
const officialSourceStatus =
  "No direct ministry recipe page was found for every dish in this batch pass. The recipes are synthesized from multiple African culinary, cultural, dish-index, and beverage references, with local method patterns normalized for AfroKitchen.";

const SOURCE_LIBRARY = {
  africanCuisine: {
    title: "Wikipedia - African cuisine",
    url: "https://en.wikipedia.org/wiki/African_cuisine",
    supports: ["regional cuisine context", "staple patterns", "cross-country foodways"]
  },
  africanDishes: {
    title: "Wikipedia - List of African dishes",
    url: "https://en.wikipedia.org/wiki/List_of_African_dishes",
    supports: ["dish inventory", "country associations", "African recipe context"]
  },
  tasteAtlasAfrica: {
    title: "Wikipedia - List of African cuisines",
    url: "https://en.wikipedia.org/wiki/List_of_African_cuisines",
    supports: ["dish identity", "African cuisine indexing", "regional context"]
  },
  africanCuisines: {
    title: "Wikipedia - List of African cuisines",
    url: "https://en.wikipedia.org/wiki/List_of_African_cuisines",
    supports: ["country cuisine context", "regional spread", "culinary taxonomy"]
  },
  africanDrinks: {
    title: "Obaasema - Traditional African drinks",
    url: "https://obaasema.com/local-african-drinks/",
    supports: ["traditional drink context", "hibiscus", "millet", "ginger", "fermented drinks"]
  },
  hibiscusTea: {
    title: "Wikipedia - Hibiscus tea",
    url: "https://en.wikipedia.org/wiki/Hibiscus_tea",
    supports: ["hibiscus drink names", "bissap", "zobo", "sobolo", "wonjo", "karkade"]
  },
  kunu: {
    title: "Wikipedia - Kunu",
    url: "https://en.wikipedia.org/wiki/Kunu",
    supports: ["kunu drink identity", "millet and tiger nut drinks", "Northern Nigerian context"]
  },
  zobo: {
    title: "Wikipedia - Zobo drink",
    url: "https://en.wikipedia.org/wiki/Zobo_(drink)",
    supports: ["zobo drink identity", "hibiscus", "West African context"]
  }
};

const COUNTRY_SOURCE = {
  CF: ["Wikipedia - Central African Republic", "https://en.wikipedia.org/wiki/Central_African_Republic"],
  GQ: ["Wikipedia - Equatorial Guinea", "https://en.wikipedia.org/wiki/Equatorial_Guinea"],
  BI: ["Wikipedia - Burundi", "https://en.wikipedia.org/wiki/Burundi"],
  KM: ["Wikipedia - Comoros", "https://en.wikipedia.org/wiki/Comoros"],
  DJ: ["Wikipedia - Djibouti", "https://en.wikipedia.org/wiki/Djibouti"],
  ER: ["Wikipedia - Eritrea", "https://en.wikipedia.org/wiki/Eritrea"],
  MG: ["Wikipedia - Madagascar", "https://en.wikipedia.org/wiki/Madagascar"],
  MW: ["Wikipedia - Malawi", "https://en.wikipedia.org/wiki/Malawi"],
  MU: ["Wikipedia - Mauritius", "https://en.wikipedia.org/wiki/Mauritius"],
  MZ: ["Wikipedia - Mozambique", "https://en.wikipedia.org/wiki/Mozambique"],
  RW: ["Wikipedia - Rwanda", "https://en.wikipedia.org/wiki/Rwanda"],
  SC: ["Wikipedia - Seychelles", "https://en.wikipedia.org/wiki/Seychelles"],
  SS: ["Wikipedia - South Sudan", "https://en.wikipedia.org/wiki/South_Sudan"],
  TZ: ["Wikipedia - Tanzania", "https://en.wikipedia.org/wiki/Tanzania"],
  ZM: ["Wikipedia - Zambia", "https://en.wikipedia.org/wiki/Zambia"],
  SZ: ["Wikipedia - Eswatini", "https://en.wikipedia.org/wiki/Eswatini"],
  GN: ["Wikipedia - Guinea", "https://en.wikipedia.org/wiki/Guinea"],
  GW: ["Wikipedia - Guinea-Bissau", "https://en.wikipedia.org/wiki/Guinea-Bissau"],
  ST: ["Wikipedia - Sao Tome and Principe", "https://en.wikipedia.org/wiki/S%C3%A3o_Tom%C3%A9_and_Pr%C3%ADncipe"],
  TD: ["Wikipedia - Chad", "https://en.wikipedia.org/wiki/Chad"],
  SL: ["Wikipedia - Sierra Leone", "https://en.wikipedia.org/wiki/Sierra_Leone"],
  NG: ["Wikipedia - Nigeria", "https://en.wikipedia.org/wiki/Nigeria"]
};

function source(title, url, supports) {
  return { title, url, source_type: "culinary and cultural reference", supports };
}

function ingredient(groupName, amount, unit, name, prepNote, substitution) {
  return {
    group_name: groupName,
    amount,
    unit,
    name,
    ...(prepNote ? { prep_note: prepNote } : {}),
    ...(substitution ? { substitution } : {})
  };
}

function step(title, instruction, minutes, label, tip) {
  return {
    title,
    instruction,
    timer_seconds: Math.round(minutes * 60),
    timer_label: label,
    ...(tip ? { tip } : {})
  };
}

function d(slug, name, countryCode, countryName, region, category, method, core, accent, serve, tags) {
  return {
    slug,
    name,
    country_code: countryCode,
    country_name: countryName,
    region,
    category,
    method,
    core,
    accent,
    serve,
    tags
  };
}

function nutritionFor(method) {
  const map = {
    beverage: [110, 2, 24, 1, 1],
    fermented: [160, 5, 29, 3, 3],
    grill: [430, 36, 14, 25, 3],
    stew: [420, 28, 32, 20, 7],
    leaf: [360, 18, 26, 22, 9],
    rice: [520, 24, 78, 14, 6],
    bread: [280, 7, 52, 5, 3],
    porridge: [300, 9, 58, 4, 6],
    snack: [290, 8, 40, 11, 4],
    dessert: [340, 5, 56, 12, 3],
    salad: [190, 5, 18, 11, 5],
    curry: [470, 26, 34, 25, 6],
    soup: [310, 20, 24, 14, 5]
  };
  const [calories, protein_g, carbs_g, fat_g, fiber_g] = map[method] || map.stew;
  return { calories, protein_g, carbs_g, fat_g, fiber_g };
}

function timeFor(method) {
  const map = {
    beverage: [15, 20, "easy"],
    fermented: [20, 20, "medium"],
    grill: [30, 35, "medium"],
    stew: [25, 75, "medium"],
    leaf: [25, 70, "medium"],
    rice: [25, 55, "medium"],
    bread: [50, 30, "medium"],
    porridge: [15, 35, "easy"],
    snack: [25, 25, "easy"],
    dessert: [30, 45, "medium"],
    salad: [20, 12, "easy"],
    curry: [25, 55, "medium"],
    soup: [20, 45, "easy"]
  };
  const [prep_time_minutes, cook_time_minutes, difficulty] = map[method] || map.stew;
  return { prep_time_minutes, cook_time_minutes, difficulty };
}

function ingredientSet(row) {
  const core = row.core;
  const accent = row.accent;
  switch (row.method) {
    case "beverage":
      return [
        ingredient("Drink", 1, "cup", core, "rinsed or prepared"),
        ingredient("Drink", 8, "cups", "water"),
        ingredient("Spice", 2, "tbsp", "fresh ginger", "sliced"),
        ingredient("Spice", 4, "whole", "cloves or grains of spice", "optional"),
        ingredient("Sweetener", 0.5, "cup", "sugar or honey"),
        ingredient("Finish", 1, "whole", "lime or lemon", "juiced")
      ];
    case "fermented":
      return [
        ingredient("Base", 2, "cups", core),
        ingredient("Liquid", 6, "cups", "clean water"),
        ingredient("Starter", 0.5, "cup", accent || "previous batch or malted grain", "optional"),
        ingredient("Sweetener", 0.25, "cup", "sugar or honey", "optional"),
        ingredient("Finish", 0.25, "tsp", "salt", "optional")
      ];
    case "grill":
      return [
        ingredient("Main", 1.2, "kg", core, "cut for grilling"),
        ingredient("Marinade", 1, "large", "onion", "blended or grated"),
        ingredient("Marinade", 4, "cloves", "garlic", "minced"),
        ingredient("Marinade", 2, "tbsp", accent || "ginger and chili paste"),
        ingredient("Marinade", 2, "tbsp", "oil"),
        ingredient("Finish", 1, "whole", "lemon", "juiced"),
        ingredient("Seasoning", 0, "", "salt and pepper", "to taste")
      ];
    case "leaf":
      return [
        ingredient("Greens", 800, "g", core, "washed and chopped"),
        ingredient("Base", 2, "tbsp", "red palm oil or neutral oil"),
        ingredient("Base", 1, "large", "onion", "chopped"),
        ingredient("Base", 3, "medium", "tomatoes", "chopped"),
        ingredient("Protein", 250, "g", accent || "smoked fish or mushrooms", "optional"),
        ingredient("Thickener", 0.5, "cup", "ground peanuts or coconut milk"),
        ingredient("Seasoning", 0, "", "salt and chili", "to taste")
      ];
    case "rice":
      return [
        ingredient("Rice", 2, "cups", "long-grain rice", "rinsed"),
        ingredient("Base", 2, "tbsp", "oil"),
        ingredient("Base", 1, "large", "onion", "chopped"),
        ingredient("Base", 2, "tbsp", accent || "tomato paste or spice paste"),
        ingredient("Main", 600, "g", core),
        ingredient("Liquid", 4, "cups", "stock or coconut milk"),
        ingredient("Finish", 0, "", "salt and pepper", "to taste")
      ];
    case "bread":
      return [
        ingredient("Dough", 3, "cups", core),
        ingredient("Dough", 1, "tsp", "salt"),
        ingredient("Dough", 1, "tbsp", "sugar", "optional"),
        ingredient("Dough", 1.25, "cups", "warm water or coconut milk"),
        ingredient("Dough", 2, "tbsp", accent || "oil"),
        ingredient("Cooking", 1, "tbsp", "oil", "for pan or tray")
      ];
    case "porridge":
      return [
        ingredient("Base", 2, "cups", core),
        ingredient("Liquid", 6, "cups", "water"),
        ingredient("Flavor", 1, "cup", accent || "milk, melon, or mashed banana"),
        ingredient("Seasoning", 1, "tsp", "salt"),
        ingredient("Finish", 2, "tbsp", "butter, oil, or sugar", "optional")
      ];
    case "snack":
      return [
        ingredient("Base", 3, "cups", core),
        ingredient("Binder", 1, "whole", "egg or flax slurry", "optional"),
        ingredient("Flavor", 0.5, "cup", accent || "onion, herbs, or spice paste"),
        ingredient("Seasoning", 1, "tsp", "salt"),
        ingredient("Liquid", 0.5, "cup", "water"),
        ingredient("Cooking", 3, "cups", "oil", "for frying or shallow frying")
      ];
    case "dessert":
      return [
        ingredient("Base", 2, "cups", core),
        ingredient("Sweetener", 0.75, "cup", "sugar or honey"),
        ingredient("Flavor", 1, "cup", accent || "coconut milk or mashed fruit"),
        ingredient("Spice", 1, "tsp", "vanilla, cardamom, or nutmeg"),
        ingredient("Binder", 2, "whole", "eggs or ripe bananas", "as needed"),
        ingredient("Cooking", 2, "tbsp", "oil or butter")
      ];
    case "salad":
      return [
        ingredient("Main", 600, "g", core, "cooked or sliced"),
        ingredient("Fresh", 1, "large", "onion", "thinly sliced"),
        ingredient("Fresh", 2, "medium", "tomatoes", "diced"),
        ingredient("Dressing", 3, "tbsp", "oil"),
        ingredient("Dressing", 2, "tbsp", "lemon or vinegar"),
        ingredient("Flavor", 0.5, "cup", accent || "fresh herbs, chili, or coconut")
      ];
    case "curry":
      return [
        ingredient("Main", 800, "g", core),
        ingredient("Base", 2, "tbsp", "oil"),
        ingredient("Base", 1, "large", "onion", "chopped"),
        ingredient("Base", 3, "cloves", "garlic", "minced"),
        ingredient("Spices", 2, "tbsp", accent || "curry powder or masala"),
        ingredient("Liquid", 2, "cups", "coconut milk, stock, or tomato sauce"),
        ingredient("Finish", 0, "", "salt and chili", "to taste")
      ];
    case "soup":
      return [
        ingredient("Main", 700, "g", core),
        ingredient("Base", 2, "tbsp", "oil"),
        ingredient("Base", 1, "large", "onion", "chopped"),
        ingredient("Base", 2, "medium", "tomatoes", "chopped"),
        ingredient("Liquid", 5, "cups", "stock or water"),
        ingredient("Flavor", 2, "tbsp", accent || "spice paste, herbs, or peanut"),
        ingredient("Finish", 0, "", "salt and pepper", "to taste")
      ];
    default:
      return [
        ingredient("Main", 800, "g", core),
        ingredient("Base", 2, "tbsp", "oil"),
        ingredient("Base", 1, "large", "onion", "chopped"),
        ingredient("Base", 3, "medium", "tomatoes", "chopped"),
        ingredient("Flavor", 2, "tbsp", accent || "local spice paste"),
        ingredient("Liquid", 2, "cups", "stock or water"),
        ingredient("Seasoning", 0, "", "salt and pepper", "to taste")
      ];
  }
}

function stepsFor(row) {
  const core = row.core;
  const accent = row.accent || "seasoning";
  switch (row.method) {
    case "beverage":
      return [
        step("Prepare the base", `Rinse or prepare ${core}, then combine with water in a pot.`, 5, "prep"),
        step("Infuse", `Simmer with ginger and spices until the drink is deeply flavored.`, 15, "infuse"),
        step("Strain and sweeten", "Strain while warm, then sweeten and add citrus.", 6, "sweeten"),
        step("Chill", "Chill completely and serve cold over ice.", 30, "chill")
      ];
    case "fermented":
      return [
        step("Cook or mix base", `Cook or whisk ${core} with clean water into a smooth light base.`, 10, "base"),
        step("Cool safely", "Cool until just warm so the starter is not killed.", 20, "cool"),
        step("Ferment", `Stir in ${accent} and ferment loosely covered until lightly sour.`, 12, "ferment"),
        step("Serve fresh", "Sweeten or salt lightly, chill, and serve within a day.", 5, "finish")
      ];
    case "grill":
      return [
        step("Season", `Coat ${core} with onion, garlic, ${accent}, oil, lemon, salt, and pepper.`, 20, "season"),
        step("Rest", "Let the seasoning penetrate before cooking.", 20, "rest"),
        step("Grill", "Grill over medium heat, turning as needed, until browned and cooked through.", 25, "grill"),
        step("Finish", `Rest briefly and serve with ${row.serve}.`, 5, "finish")
      ];
    case "leaf":
      return [
        step("Cook greens", `Simmer ${core} until softened and safe to eat.`, 30, "greens"),
        step("Build sauce", "Cook onion, tomato, oil, and chili into a thick base.", 12, "base"),
        step("Enrich", `Add ${accent} and ground peanuts or coconut, then simmer into the greens.`, 18, "simmer"),
        step("Finish", `Season and serve with ${row.serve}.`, 5, "finish")
      ];
    case "rice":
      return [
        step("Start base", "Cook onion, oil, and the spice paste until fragrant.", 10, "base"),
        step("Add main and rice", `Add ${core}, rice, and liquid, then stir once.`, 8, "combine"),
        step("Simmer", "Cover and cook until the rice is tender and the liquid is absorbed.", 25, "simmer"),
        step("Rest", `Rest covered before serving with ${row.serve}.`, 10, "rest")
      ];
    case "bread":
      return [
        step("Mix dough", `Mix ${core}, salt, liquid, and fat into a soft dough or batter.`, 10, "mix"),
        step("Rest", "Rest until relaxed or lightly risen.", 30, "rest"),
        step("Cook", "Cook on a hot pan, griddle, steamer, or oven until set and lightly browned.", 25, "cook"),
        step("Serve", `Serve warm with ${row.serve}.`, 5, "serve")
      ];
    case "porridge":
      return [
        step("Make slurry", `Whisk ${core} with cool water to prevent lumps.`, 5, "slurry"),
        step("Simmer", "Add to boiling water and cook, stirring often, until thick.", 25, "simmer"),
        step("Enrich", `Stir in ${accent} and adjust salt or sweetness.`, 5, "enrich"),
        step("Rest", `Rest briefly and serve with ${row.serve}.`, 5, "rest")
      ];
    case "snack":
      return [
        step("Mix", `Combine ${core}, ${accent}, salt, and enough liquid to bind.`, 10, "mix"),
        step("Shape", "Shape into balls, cakes, or spoonable batter.", 10, "shape"),
        step("Cook", "Fry or shallow-fry until crisp outside and cooked inside.", 14, "fry"),
        step("Drain", `Drain and serve with ${row.serve}.`, 4, "finish")
      ];
    case "dessert":
      return [
        step("Prepare base", `Combine ${core}, sugar, and ${accent}.`, 10, "base"),
        step("Bind", "Add binder or liquid until the mixture holds together.", 8, "bind"),
        step("Cook", "Bake, steam, or fry until fragrant and set.", 30, "cook"),
        step("Serve", `Cool slightly and serve with ${row.serve}.`, 5, "serve")
      ];
    case "salad":
      return [
        step("Prepare main", `Cook, slice, or mash ${core} as needed.`, 10, "main"),
        step("Add fresh items", "Fold in onion, tomato, herbs, or chili.", 5, "fresh"),
        step("Dress", "Dress with oil, citrus or vinegar, salt, and pepper.", 3, "dress"),
        step("Rest", `Rest briefly and serve with ${row.serve}.`, 5, "rest")
      ];
    case "curry":
      return [
        step("Cook aromatics", "Cook onion, garlic, oil, and spices until fragrant.", 10, "aromatics"),
        step("Add main", `Add ${core} and coat well in the spice base.`, 8, "main"),
        step("Simmer", "Add liquid and simmer until tender and saucy.", 30, "simmer"),
        step("Finish", `Adjust salt and chili, then serve with ${row.serve}.`, 5, "finish")
      ];
    case "soup":
      return [
        step("Build base", "Cook onion, tomato, oil, and seasoning until softened.", 10, "base"),
        step("Simmer main", `Add ${core} and liquid, then simmer until tender.`, 25, "simmer"),
        step("Season", `Add ${accent} and cook until the broth tastes rounded.`, 8, "season"),
        step("Serve", `Serve hot with ${row.serve}.`, 5, "serve")
      ];
    default:
      return [
        step("Build base", "Cook onion, oil, tomato, and seasoning until aromatic.", 10, "base"),
        step("Add main", `Add ${core} and enough liquid to cook evenly.`, 8, "main"),
        step("Simmer", "Cook until tender and concentrated.", 30, "simmer"),
        step("Serve", `Adjust seasoning and serve with ${row.serve}.`, 5, "serve")
      ];
  }
}

function sourcesFor(row) {
  const sources = [];
  const country = COUNTRY_SOURCE[row.country_code];
  if (country) sources.push(source(country[0], country[1], ["country context", "local food setting"]));
  if (row.method === "beverage" || row.method === "fermented") {
    sources.push(source(SOURCE_LIBRARY.africanDrinks.title, SOURCE_LIBRARY.africanDrinks.url, SOURCE_LIBRARY.africanDrinks.supports));
    if (/hibiscus|bissap|zobo|sobolo|wonjo|dabileni/i.test(row.name + row.core)) {
      sources.push(source(SOURCE_LIBRARY.hibiscusTea.title, SOURCE_LIBRARY.hibiscusTea.url, SOURCE_LIBRARY.hibiscusTea.supports));
    }
    if (/kunu/i.test(row.name)) {
      sources.push(source(SOURCE_LIBRARY.kunu.title, SOURCE_LIBRARY.kunu.url, SOURCE_LIBRARY.kunu.supports));
    }
    if (/zobo/i.test(row.name)) {
      sources.push(source(SOURCE_LIBRARY.zobo.title, SOURCE_LIBRARY.zobo.url, SOURCE_LIBRARY.zobo.supports));
    }
  } else {
    sources.push(source(SOURCE_LIBRARY.africanDishes.title, SOURCE_LIBRARY.africanDishes.url, SOURCE_LIBRARY.africanDishes.supports));
    sources.push(source(SOURCE_LIBRARY.tasteAtlasAfrica.title, SOURCE_LIBRARY.tasteAtlasAfrica.url, SOURCE_LIBRARY.tasteAtlasAfrica.supports));
  }
  sources.push(source(SOURCE_LIBRARY.africanCuisine.title, SOURCE_LIBRARY.africanCuisine.url, SOURCE_LIBRARY.africanCuisine.supports));
  return sources;
}

function recipe(row) {
  const times = timeFor(row.method);
  const nutrition = nutritionFor(row.method);
  const isDrink = row.method === "beverage" || row.method === "fermented";
  const description =
    `${row.name} is a ${row.country_name} ${isDrink ? "drink" : row.category} built around ${row.core}, ${row.accent || "local seasoning"}, and the serving logic of ${row.serve}.`;
  const result = {
    slug: row.slug,
    name: row.name,
    description,
    country_code: row.country_code,
    country_name: row.country_name,
    region: row.region,
    ethnic_group: `${row.country_name} home cooking`,
    category: row.category,
    tags: row.tags.concat([row.country_name.toLowerCase().replace(/[^a-z]+/g, "-").replace(/^-|-$/g, "")]),
    diet_tags: isDrink ? ["vegetarian", "gluten-free", "dairy-free"] : ["dairy-free"],
    ...times,
    default_servings: isDrink ? 8 : 6,
    serving_unit: isDrink ? "cups" : "servings",
    story:
      `${row.name} fills a real AfroKitchen gap for ${row.country_name}, where everyday cooking, celebration plates, street snacks, and local drinks often rely on ingredients that do not show up in generic African recipe lists. This version keeps the method practical while preserving the dish's core identity: ${row.core}, ${row.accent || "local aromatics"}, and a table built around ${row.serve}.`,
    occasion: isDrink
      ? "Best for hot days, hosting, Ramadan or celebration drinks, and non-alcoholic refreshment."
      : "Best for family meals, regional food discovery, weekend cooking, and country-hub depth.",
    best_served_with: row.serve,
    regional_variations:
      `${row.name} changes by household and market availability. Cooks may adjust the main ingredient, heat level, liquid, or serving starch while keeping the same local flavor logic.`,
    ...nutrition,
    review_summary:
      `Added in the 100-recipe gap-fill wave after comparing live AfroKitchen representation by country. The recipe keeps the most common structure for ${row.name}: ${row.core}, ${row.accent || "local seasoning"}, timed cooking steps, and a serving path that makes sense for ${row.country_name}.`,
    recommended_changes: [
      "Taste and adjust salt, chili, and acidity at the end.",
      "Use local produce where available, and keep substitutions close to the original texture."
    ],
    official_source_status: officialSourceStatus,
    confidence: "medium-high",
    author: "AfroKitchen research desk",
    total_time_minutes: times.prep_time_minutes + times.cook_time_minutes,
    sources: sourcesFor(row),
    ingredients: ingredientSet(row).map((item, index) => ({ sort_order: (index + 1) * 10, ...item })),
    steps: stepsFor(row).map((item, index) => ({ step_number: index + 1, ...item }))
  };
  // Exact reviewed source rows; no UUID/public approval is assigned by this source batch.
  const attributed = {
  "mchemsho-tz": {
    "name": "Mchemsho — TaTEDO beef version",
    "description": "Beef, potatoes and vegetables in broth, made in two pressure-cooking stages.",
    "story": "Use a pressure cooker large enough for this batch and follow its fill, liquid and pressure-release instructions. Allow extra time for heat-up and pressure release.",
    "author": "AfroKitchen adaptation of TaTEDO Tanzania eCookbook (2020)",
    "default_servings": null,
    "serving_unit": null,
    "yield_status": "not-recorded",
    "prep_time_minutes": null,
    "cook_time_minutes": null,
    "total_time_minutes": null,
    "image_url": "/assets/img/kitchen/mchemsho-tz.webp",
    "image_alt": "AI-generated illustration of beef Mchemsho with potatoes, carrots, bell pepper, onion and broccoli in light broth.",
    "calories": null,
    "protein_g": null,
    "carbs_g": null,
    "fat_g": null,
    "fiber_g": null,
    "nutrition_basis": null,
    "source": "https://mecs.org.uk/wp-content/uploads/2020/12/Tanzania-Ecook-Book-text-web.pdf",
    "tags": [
      "beef",
      "potato",
      "vegetables",
      "tanzania"
    ],
    "diet_tags": [],
    "chef_notes": null,
    "best_served_with": null,
    "occasion": null,
    "regional_variations": null,
    "ingredients": [
      {
        "ingredient_id": null,
        "substitution": null,
        "name": "beef",
        "amount": 1,
        "unit": "kg",
        "prep_note": "Selected instead of the source chicken option; cut into pieces",
        "is_optional": false,
        "sort_order": 10,
        "group_name": null
      },
      {
        "ingredient_id": null,
        "substitution": null,
        "name": "carrot",
        "amount": 1,
        "unit": "whole",
        "prep_note": "Prepare and cut",
        "is_optional": false,
        "sort_order": 20,
        "group_name": null
      },
      {
        "ingredient_id": null,
        "substitution": null,
        "name": "bell pepper",
        "amount": 1,
        "unit": "whole",
        "prep_note": "Prepare and cut",
        "is_optional": false,
        "sort_order": 30,
        "group_name": null
      },
      {
        "ingredient_id": null,
        "substitution": null,
        "name": "onion",
        "amount": 1,
        "unit": "large",
        "prep_note": "Prepare and cut",
        "is_optional": false,
        "sort_order": 40,
        "group_name": null
      },
      {
        "ingredient_id": null,
        "substitution": null,
        "name": "potatoes",
        "amount": 5,
        "unit": "whole",
        "prep_note": "Prepare and cut",
        "is_optional": false,
        "sort_order": 50,
        "group_name": null
      },
      {
        "ingredient_id": null,
        "substitution": null,
        "name": "broccoli",
        "amount": 2,
        "unit": "heads",
        "prep_note": "Prepare and cut",
        "is_optional": false,
        "sort_order": 60,
        "group_name": null
      },
      {
        "ingredient_id": null,
        "substitution": null,
        "name": "water",
        "amount": 8,
        "unit": "cups",
        "prep_note": "Source batch amount; use a suitably sized appliance within its fill limits",
        "is_optional": false,
        "sort_order": 70,
        "group_name": null
      },
      {
        "ingredient_id": null,
        "substitution": null,
        "name": "salt",
        "amount": null,
        "unit": "to taste",
        "prep_note": "Source quantity not stated",
        "is_optional": false,
        "sort_order": 80,
        "group_name": null,
        "source_quantity_unrecorded": true
      }
    ],
    "steps": [
      {
        "tip": null,
        "image_url": null,
        "step_number": 1,
        "title": "Prepare the beef",
        "instruction": "Cut the beef into pieces. Put it in the pressure cooker with 8 cups water.",
        "timer_seconds": null,
        "timer_label": null
      },
      {
        "tip": null,
        "image_url": null,
        "step_number": 2,
        "title": "Pressure-cook the beef",
        "instruction": "Bring to pressure following your appliance instructions, then pressure-cook for 20 minutes. Meanwhile, chop the carrot, bell pepper, onion and potatoes, and cut the broccoli into florets.",
        "timer_seconds": 1200,
        "timer_label": "First pressure stage"
      },
      {
        "tip": null,
        "image_url": null,
        "step_number": 3,
        "title": "Add the vegetables",
        "instruction": "Release pressure as your appliance directs. Open only when safe, then add the vegetables and salt. Check the liquid against your cooker requirements.",
        "timer_seconds": null,
        "timer_label": null
      },
      {
        "tip": null,
        "image_url": null,
        "step_number": 4,
        "title": "Pressure-cook the vegetables",
        "instruction": "Return to pressure, then cook for 7 minutes. Release pressure as directed before opening.",
        "timer_seconds": 420,
        "timer_label": "Second pressure stage"
      },
      {
        "tip": null,
        "image_url": null,
        "step_number": 5,
        "title": "Check and serve",
        "instruction": "Check that the beef is tender and the vegetables are cooked; cook a little longer if needed. Adjust salt and serve hot with the broth.",
        "timer_seconds": null,
        "timer_label": null
      }
    ],
    "method_revision": "mchemsho-tatedo-indexed-beef-batch-20261018-v1",
    "confidence": "Source-attributed adaptation, not kitchen-tested",
    "review_summary": "Institutional batch ingredients and two pressure stages verified against the actual PDF. Action-focused method retains the source batch, unknown person yield and unknown full elapsed time.",
    "official_source_status": "TaTEDO institutional eCookbook; actual printed pages 38–39 inspected, not kitchen testing or safety certification",
    "recommended_changes": [],
    "sources": [
      {
        "url": "https://mecs.org.uk/wp-content/uploads/2020/12/Tanzania-Ecook-Book-text-web.pdf",
        "title": "TaTEDO Tanzania eCookbook (2020), printed pages 38–39",
        "accessed_at": "2026-10-22",
        "access_basis": "Actual PDF text and rendered printed pages 38–39 (PDF pages 46–47) inspected; title/copyright checked. Full PDF SHA2561661796a1803cbe146c311d990136d3adeafa9d3d48180250bf9a0f3a02a9f57; all68pages not claimed inspected.",
        "supports": [
          "Source ingredients and explicit adaptation choices",
          "Specific attributed method",
          "Known versus unrecorded timing/yield"
        ]
      }
    ]
  },
  "octopus-curry-sc": {
    "name": "Octopus curry — Ben Pierce Jones adaptation",
    "description": "An attributed Seychelles-style octopus and coconut curry, using water and omitting the source’s cilantro garnish.",
    "story": "Adapted from Ben Pierce Jones at Tastes From The Road. The source publishes estimates of 20 minutes preparation, 90 minutes cooking and four servings; it does not separately state total time. Its ingredient list describes boiled octopus while its method includes a preboil. This adaptation starts with cleaned raw octopus and includes that preboil, so do not count it twice if starting with already cooked octopus. Water is selected instead of fish stock; two optional curry leaves and one chilli select within the source ranges. The cilantro garnish is omitted. The image is an AI serving illustration, not evidence of a tested batch; AfroTools has not kitchen-tested this adaptation.",
    "author": "AfroKitchen adaptation of Ben Pierce Jones at Tastes From The Road",
    "default_servings": 4,
    "serving_unit": "servings",
    "yield_status": "recorded",
    "prep_time_minutes": 20,
    "cook_time_minutes": 90,
    "total_time_minutes": null,
    "image_url": "/assets/img/kitchen/responsive/octopus-curry-sc-1280.webp",
    "image_alt": "AI-generated serving illustration of octopus pieces in coconut curry sauce.",
    "calories": null,
    "protein_g": null,
    "carbs_g": null,
    "fat_g": null,
    "fiber_g": null,
    "nutrition_basis": null,
    "source": "https://www.tastesfromtheroad.com/recipes/octopus-curry-from-the-seychelles",
    "tags": [
      "octopus",
      "coconut",
      "seychelles"
    ],
    "diet_tags": [],
    "chef_notes": null,
    "best_served_with": null,
    "occasion": null,
    "regional_variations": null,
    "ingredients": [
      {
        "ingredient_id": null,
        "substitution": null,
        "name": "cleaned raw octopus",
        "amount": 1,
        "unit": "large",
        "prep_note": "About 2–3 lb. Raw starting point chosen because the source method includes preboiling, despite its boiled-octopus ingredient wording",
        "is_optional": false,
        "sort_order": 10,
        "group_name": null
      },
      {
        "ingredient_id": null,
        "substitution": null,
        "name": "cooking oil",
        "amount": 2,
        "unit": "tablespoons",
        "prep_note": null,
        "is_optional": false,
        "sort_order": 20,
        "group_name": null
      },
      {
        "ingredient_id": null,
        "substitution": null,
        "name": "cinnamon sticks",
        "amount": 2,
        "unit": "sticks",
        "prep_note": null,
        "is_optional": false,
        "sort_order": 30,
        "group_name": null
      },
      {
        "ingredient_id": null,
        "substitution": null,
        "name": "onion",
        "amount": 1,
        "unit": "whole",
        "prep_note": "Chopped",
        "is_optional": false,
        "sort_order": 40,
        "group_name": null
      },
      {
        "ingredient_id": null,
        "substitution": null,
        "name": "garlic",
        "amount": 3,
        "unit": "cloves",
        "prep_note": "Minced",
        "is_optional": false,
        "sort_order": 50,
        "group_name": null
      },
      {
        "ingredient_id": null,
        "substitution": null,
        "name": "ginger",
        "amount": 1,
        "unit": "inch",
        "prep_note": "Grated",
        "is_optional": false,
        "sort_order": 60,
        "group_name": null
      },
      {
        "ingredient_id": null,
        "substitution": null,
        "name": "curry leaves",
        "amount": 2,
        "unit": "leaves",
        "prep_note": "Optional; two selected from the source range of 2–3",
        "is_optional": true,
        "sort_order": 70,
        "group_name": null
      },
      {
        "ingredient_id": null,
        "substitution": null,
        "name": "curry powder",
        "amount": 2,
        "unit": "tablespoons",
        "prep_note": null,
        "is_optional": false,
        "sort_order": 80,
        "group_name": null
      },
      {
        "ingredient_id": null,
        "substitution": null,
        "name": "turmeric",
        "amount": 1,
        "unit": "teaspoon",
        "prep_note": null,
        "is_optional": false,
        "sort_order": 90,
        "group_name": null
      },
      {
        "ingredient_id": null,
        "substitution": null,
        "name": "paprika",
        "amount": 1,
        "unit": "teaspoon",
        "prep_note": "Optional source ingredient",
        "is_optional": true,
        "sort_order": 100,
        "group_name": null
      },
      {
        "ingredient_id": null,
        "substitution": null,
        "name": "chilli",
        "amount": 1,
        "unit": "whole",
        "prep_note": "One selected from the source range of 1–2",
        "is_optional": false,
        "sort_order": 110,
        "group_name": null
      },
      {
        "ingredient_id": null,
        "substitution": null,
        "name": "coconut milk",
        "amount": 1,
        "unit": "can",
        "prep_note": "13.5 oz source can",
        "is_optional": false,
        "sort_order": 120,
        "group_name": null
      },
      {
        "ingredient_id": null,
        "substitution": null,
        "name": "water",
        "amount": 0.5,
        "unit": "cup",
        "prep_note": "Water selected instead of fish stock",
        "is_optional": false,
        "sort_order": 130,
        "group_name": null
      },
      {
        "ingredient_id": null,
        "substitution": null,
        "name": "salt",
        "amount": null,
        "unit": "to taste",
        "prep_note": "Source quantity not stated",
        "is_optional": false,
        "sort_order": 140,
        "group_name": null,
        "source_quantity_unrecorded": true
      },
      {
        "ingredient_id": null,
        "substitution": null,
        "name": "black pepper",
        "amount": null,
        "unit": "to taste",
        "prep_note": "Source quantity not stated",
        "is_optional": false,
        "sort_order": 150,
        "group_name": null,
        "source_quantity_unrecorded": true
      },
      {
        "ingredient_id": null,
        "substitution": null,
        "name": "lime",
        "amount": 1,
        "unit": "whole",
        "prep_note": null,
        "is_optional": false,
        "sort_order": 160,
        "group_name": null
      }
    ],
    "steps": [
      {
        "tip": null,
        "image_url": null,
        "step_number": 1,
        "title": "Preboil the raw octopus",
        "instruction": "Start with cleaned raw octopus for this adaptation. Boil until tender; the source gives an approximate 30–40 minutes. Check tenderness from about 30 minutes and continue as needed, then cut into bite-size pieces. If using already boiled octopus, do not automatically repeat the raw preboil.",
        "timer_seconds": 1800,
        "timer_label": "Check octopus tenderness; continue as needed"
      },
      {
        "tip": null,
        "image_url": null,
        "step_number": 2,
        "title": "Cook the aromatics",
        "instruction": "Heat the oil with the cinnamon sticks. Add onion, garlic, ginger and the optional curry leaves; cook until fragrant.",
        "timer_seconds": null,
        "timer_label": null
      },
      {
        "tip": null,
        "image_url": null,
        "step_number": 3,
        "title": "Add spices",
        "instruction": "Stir in curry powder, turmeric, optional paprika and chilli, coating the aromatics.",
        "timer_seconds": null,
        "timer_label": null
      },
      {
        "tip": null,
        "image_url": null,
        "step_number": 4,
        "title": "Simmer with coconut milk",
        "instruction": "Add the octopus, coconut milk and the selected half cup of water. Simmer approximately 20–25 minutes as described by the source, checking the texture and continuing as needed.",
        "timer_seconds": 1200,
        "timer_label": "Check the curry; continue as needed"
      },
      {
        "tip": null,
        "image_url": null,
        "step_number": 5,
        "title": "Finish seasoning",
        "instruction": "Season with salt, black pepper and lime. The source calls for a further approximately 5-minute simmer after seasoning. This adaptation omits the cilantro garnish.",
        "timer_seconds": 300,
        "timer_label": "Check final seasoning and texture"
      },
      {
        "tip": null,
        "image_url": null,
        "step_number": 6,
        "title": "Serve the attributed adaptation",
        "instruction": "Serve the curry. Four servings and the 20-minute preparation/90-minute cooking figures are the author’s estimates, not guaranteed completion or a separately established total duration.",
        "timer_seconds": null,
        "timer_label": null
      }
    ],
    "method_revision": "octopus-ben-pierce-jones-water-20261018-v1",
    "confidence": "Source-attributed adaptation, not kitchen-tested",
    "review_summary": "Exact source quantities and adaptation choices; unknown total and nutrition remain unknown. Four source servings and approximate 20/90-minute author estimates; raw/preboil ambiguity, water and omitted cilantro disclosed.",
    "official_source_status": "Named culinary author’s own recipe; not official certification",
    "recommended_changes": [],
    "sources": [
      {
        "url": "https://www.tastesfromtheroad.com/recipes/octopus-curry-from-the-seychelles",
        "title": "Octopus Curry From The Seychelles — Ben Pierce Jones",
        "accessed_at": "2026-10-18",
        "access_basis": "Prior successful primary article open at 03:23 UTC",
        "supports": [
          "Source ingredients and explicit adaptation choices",
          "Specific attributed method",
          "Known versus unrecorded timing/yield"
        ]
      }
    ]
  }
};
  if (Object.prototype.hasOwnProperty.call(attributed, row.slug)) return Object.assign(result, attributed[row.slug]);
  // These source rows lack UUIDs; browser/API projection independently enforces UUID + slug.
  const pending = {
  "kunu-zaki-ng": {
    "description": "Nigerian millet-based drink. A reviewed preparation method, quantities, duration and yield are not available on this page.",
    "story": null,
    "occasion": null,
    "best_served_with": null,
    "regional_variations": null,
    "method_review_status": "pending-source-method",
    "method_review_revision": "kunu-ikivuguto-source-hold-20261018",
    "prep_time_minutes": null,
    "cook_time_minutes": null,
    "total_time_minutes": null,
    "default_servings": null,
    "serving_unit": null,
    "yield_status": "not-recorded",
    "calories": null,
    "protein_g": null,
    "carbs_g": null,
    "fat_g": null,
    "fiber_g": null,
    "ingredients": [],
    "steps": []
  },
  "ikivuguto-rw": {
    "description": "Rwandan cultured milk. A reviewed preparation method, quantities, duration and yield are not available on this page.",
    "story": null,
    "occasion": null,
    "best_served_with": null,
    "regional_variations": null,
    "method_review_status": "pending-source-method",
    "method_review_revision": "kunu-ikivuguto-source-hold-20261018",
    "prep_time_minutes": null,
    "cook_time_minutes": null,
    "total_time_minutes": null,
    "default_servings": null,
    "serving_unit": null,
    "yield_status": "not-recorded",
    "calories": null,
    "protein_g": null,
    "carbs_g": null,
    "fat_g": null,
    "fiber_g": null,
    "ingredients": [],
    "steps": []
  },
    "kisra-south-sudan-ss": {
      "story": null,
      "occasion": null,
      "best_served_with": null,
      "regional_variations": null,
      "prep_time_minutes": null,
      "cook_time_minutes": null,
      "total_time_minutes": null,
      "default_servings": null,
      "serving_unit": null,
      "calories": null,
      "protein_g": null,
      "carbs_g": null,
      "fat_g": null,
      "fiber_g": null,
      "description": "South Sudanese Kisra, a thin cereal flatbread. A reviewed preparation method, quantities, duration and meal-portion yield are not available on this page.",
      "method_review_status": "pending-source-method",
      "method_review_revision": "kisra-maheu-source-hold-20261018",
      "yield_status": "not-recorded",
      "ingredients": [],
      "steps": [],
      "diet_tags": []
    },
    "maheu-zm": {
      "story": null,
      "occasion": null,
      "best_served_with": null,
      "regional_variations": null,
      "prep_time_minutes": null,
      "cook_time_minutes": null,
      "total_time_minutes": null,
      "default_servings": null,
      "serving_unit": null,
      "calories": null,
      "protein_g": null,
      "carbs_g": null,
      "fat_g": null,
      "fiber_g": null,
      "description": "Zambian maize-meal drink. A reviewed preparation method, quantities, fermentation conditions, duration and yield are not available on this page.",
      "method_review_status": "pending-source-method",
      "method_review_revision": "kisra-maheu-source-hold-20261018",
      "yield_status": "not-recorded",
      "ingredients": [],
      "steps": [],
      "diet_tags": []
    }
  };
  if (!Object.prototype.hasOwnProperty.call(pending, row.slug)) return result;
  Object.assign(result, pending[row.slug]);
  if (row.slug === 'ikivuguto-rw') result.diet_tags = result.diet_tags.filter(tag => tag !== 'dairy-free');
  result.confidence = 'review-required';
  result.review_summary = 'Dish identity references are available; a preparation recipe has not been established for this record.';
  result.recommended_changes = [];
  result.official_source_status = 'Source-method review pending. References do not establish a complete recipe, timing, yield or nutrition.';
  return result;
}

const rows = [
  d("koko-cassava-leaves-cf", "Koko Cassava Leaves", "CF", "Central African Republic", "Central Africa", "stew", "leaf", "cassava leaves", "smoked fish and peanut", "gozo or rice", ["cassava-leaves", "greens"]),
  d("makara-banana-fritters-cf", "Makara Banana Fritters", "CF", "Central African Republic", "Central Africa", "snack", "snack", "ripe banana and flour", "nutmeg and sugar", "tea or ginger drink", ["banana", "fritters"]),
  d("palm-nut-chicken-cf", "Palm Nut Chicken", "CF", "Central African Republic", "Central Africa", "main", "stew", "chicken pieces", "palm nut cream", "rice or fufu", ["chicken", "palm-nut"]),
  d("central-african-peanut-stew-cf", "Central African Peanut Stew", "CF", "Central African Republic", "Central Africa", "stew", "stew", "beef or mushrooms", "peanut paste", "rice, gozo, or plantain", ["peanut", "stew"]),
  d("ginger-juice-cf", "Ginger Juice", "CF", "Central African Republic", "Central Africa", "beverage", "beverage", "fresh ginger", "lemon and sugar", "chilled with snacks", ["ginger", "drink"]),
  d("pescado-cacahuete-gq", "Pescado con Salsa de Cacahuete", "GQ", "Equatorial Guinea", "Central Africa", "seafood", "stew", "firm fish", "peanut sauce and tomato", "rice or plantain", ["fish", "peanut"]),
  d("malamba-gq", "Malamba", "GQ", "Equatorial Guinea", "Central Africa", "beverage", "fermented", "sugarcane juice", "wild yeast or previous batch", "fried fish or snacks", ["fermented", "sugarcane"]),
  d("bilola-gq", "Bilola", "GQ", "Equatorial Guinea", "Central Africa", "snack", "grill", "land snails or mushrooms", "garlic chili oil", "plantain or bread", ["snails", "grill"]),
  d("banana-fritters-gq", "Equatoguinean Banana Fritters", "GQ", "Equatorial Guinea", "Central Africa", "dessert", "snack", "ripe banana and flour", "cinnamon and sugar", "tea or coffee", ["banana", "fritters"]),
  d("ginger-pineapple-drink-gq", "Ginger Pineapple Drink", "GQ", "Equatorial Guinea", "Central Africa", "beverage", "beverage", "pineapple peel and ginger", "lime and sugar", "cold over ice", ["pineapple", "ginger"]),
  d("ibiharage-bi", "Ibiharage", "BI", "Burundi", "East Africa", "stew", "stew", "red beans", "tomato and onion", "ugali or rice", ["beans", "tomato"]),
  d("burundian-brochettes-bi", "Burundian Brochettes", "BI", "Burundi", "East Africa", "grill", "grill", "beef or goat cubes", "onion and pili pili", "chips, salad, or plantain", ["brochettes", "grill"]),
  d("isombe-peanut-bi", "Isombe with Peanut", "BI", "Burundi", "East Africa", "stew", "leaf", "cassava leaves", "peanut and smoked fish", "ugali or rice", ["cassava-leaves", "peanut"]),
  d("agatoke-bi", "Agatoke", "BI", "Burundi", "East Africa", "main", "stew", "green bananas", "peanut sauce and beans", "grilled meat or greens", ["green-banana", "stew"]),
  d("ikivuguto-bi", "Ikivuguto", "BI", "Burundi", "East Africa", "beverage", "fermented", "milk", "live yogurt starter", "porridge or bread", ["fermented-milk", "drink"]),
  d("langouste-vanille-km", "Langouste a la Vanille", "KM", "Comoros", "East Africa", "seafood", "curry", "lobster or prawns", "vanilla and coconut milk", "rice", ["lobster", "vanilla"]),
  d("mataba-comoros-km", "Mataba", "KM", "Comoros", "East Africa", "stew", "leaf", "cassava leaves", "coconut milk and fish", "rice or breadfruit", ["cassava-leaves", "coconut"]),
  d("mkatra-siniya-km", "Mkatra Siniya", "KM", "Comoros", "East Africa", "bread", "bread", "rice flour and wheat flour", "coconut milk", "tea or stew", ["bread", "coconut"]),
  d("pilao-comorien-km", "Pilao Comorien", "KM", "Comoros", "East Africa", "rice", "rice", "chicken or beef", "clove, cardamom, and cinnamon", "kachumbari", ["rice", "spiced"]),
  d("jus-tamarin-km", "Jus de Tamarin", "KM", "Comoros", "East Africa", "beverage", "beverage", "tamarind pulp", "ginger and sugar", "cold with snacks", ["tamarind", "drink"]),
  d("lahoh-dj", "Lahoh", "DJ", "Djibouti", "East Africa", "bread", "bread", "sorghum and wheat flour", "yeast and warm water", "stew, honey, or tea", ["flatbread", "sorghum"]),
  d("fah-fah-dj", "Fah-fah", "DJ", "Djibouti", "East Africa", "soup", "soup", "goat or lamb", "cardamom and vegetables", "lahoh or rice", ["goat", "soup"]),
  d("cambaboor-dj", "Cambaboor", "DJ", "Djibouti", "East Africa", "bread", "bread", "spiced injera batter", "nigella and turmeric", "yogurt and tea", ["flatbread", "spiced"]),
  d("shaah-cadays-dj", "Shaah Cadays", "DJ", "Djibouti", "East Africa", "beverage", "beverage", "black tea", "cardamom and cinnamon", "lahoh or sweets", ["tea", "spiced"]),
  d("shahan-ful-er", "Shahan Ful", "ER", "Eritrea", "East Africa", "breakfast", "stew", "fava beans", "tomato, chili, and cumin", "bread or injera", ["fava-beans", "breakfast"]),
  d("gaat-er", "Ga'at", "ER", "Eritrea", "East Africa", "porridge", "porridge", "barley or wheat flour", "berbere butter or yogurt", "spiced butter", ["porridge", "barley"]),
  d("taita-er", "Taita", "ER", "Eritrea", "East Africa", "bread", "bread", "teff and sorghum flour", "fermented batter", "tsebhi or shiro", ["flatbread", "fermented"]),
  d("suwa-er", "Suwa", "ER", "Eritrea", "East Africa", "beverage", "fermented", "roasted barley and gesho", "fermented grain starter", "celebration snacks", ["fermented", "barley"]),
  d("akoho-sy-voanio-mg", "Akoho sy Voanio", "MG", "Madagascar", "East Africa", "main", "curry", "chicken pieces", "coconut milk and ginger", "rice", ["chicken", "coconut"]),
  d("koba-mg", "Koba", "MG", "Madagascar", "East Africa", "dessert", "dessert", "rice flour and peanuts", "banana and honey", "coffee or tea", ["peanut", "banana"]),
  d("lasary-voatabia-mg", "Lasary Voatabia", "MG", "Madagascar", "East Africa", "salad", "salad", "tomatoes", "green onion and lime", "rice and grilled meat", ["tomato", "salad"]),
  d("vary-aminanana-mg", "Vary Amin'anana", "MG", "Madagascar", "East Africa", "rice", "rice", "rice and leafy greens", "ginger and tomato", "fried fish or eggs", ["rice", "greens"]),
  d("ranonapango-mg", "Ranonapango", "MG", "Madagascar", "East Africa", "beverage", "beverage", "toasted rice crust", "hot water", "rice meals", ["rice-water", "drink"]),
  d("kondowole-mw", "Kondowole", "MW", "Malawi", "East Africa", "starch", "porridge", "cassava flour", "hot water and salt", "fish stew or beans", ["cassava", "staple"]),
  d("nthochi-bread-mw", "Nthochi Bread", "MW", "Malawi", "East Africa", "bread", "dessert", "ripe banana and flour", "nutmeg and sugar", "tea", ["banana", "bread"]),
  d("futali-mw", "Futali", "MW", "Malawi", "East Africa", "main", "stew", "pumpkin and sweet potato", "peanut flour", "greens or beans", ["pumpkin", "peanut"]),
  d("mandasi-malawi-mw", "Malawian Mandasi", "MW", "Malawi", "East Africa", "snack", "snack", "wheat flour", "coconut milk and cardamom", "tea or thobwa", ["mandasi", "fritter"]),
  d("thobwa-mw", "Thobwa", "MW", "Malawi", "East Africa", "beverage", "fermented", "maize and millet flour", "malted grain", "chilled", ["fermented", "maize"]),
  d("mauritian-biryani-mu", "Mauritian Biryani", "MU", "Mauritius", "East Africa", "rice", "rice", "chicken or vegetables", "masala, mint, and fried onion", "achar and salad", ["biryani", "rice"]),
  d("dholl-puri-mu", "Dholl Puri", "MU", "Mauritius", "East Africa", "bread", "bread", "split pea flour and wheat flour", "turmeric and cumin", "rougaille and achar", ["flatbread", "split-pea"]),
  d("gateaux-piments-mu", "Gateaux Piments", "MU", "Mauritius", "East Africa", "snack", "snack", "split peas", "chili, cumin, and coriander", "chutney or tea", ["split-pea", "fritter"]),
  d("vindaye-poisson-mu", "Vindaye Poisson", "MU", "Mauritius", "East Africa", "seafood", "curry", "firm fish", "mustard, turmeric, and vinegar", "rice or bread", ["fish", "mustard"]),
  d("alouda-mu", "Alouda", "MU", "Mauritius", "East Africa", "beverage", "beverage", "milk and basil seeds", "rose syrup and vanilla", "ice cold", ["milk", "rose"]),
  d("matapa-mz", "Matapa", "MZ", "Mozambique", "East Africa", "stew", "leaf", "cassava leaves", "peanut, coconut, and seafood", "xima or rice", ["cassava-leaves", "coconut"]),
  d("xima-mz", "Xima", "MZ", "Mozambique", "East Africa", "starch", "porridge", "maize meal", "water and salt", "matapa or stew", ["maize", "staple"]),
  d("badjia-mz", "Badjia", "MZ", "Mozambique", "East Africa", "snack", "snack", "black-eyed pea paste", "onion and chili", "piri piri sauce", ["bean-fritter", "street-food"]),
  d("bolo-polanna-mz", "Bolo Polana", "MZ", "Mozambique", "East Africa", "dessert", "dessert", "cashew nuts and potato", "citrus and vanilla", "tea or coffee", ["cashew", "cake"]),
  d("sumo-de-caju-mz", "Sumo de Caju", "MZ", "Mozambique", "East Africa", "beverage", "beverage", "cashew fruit pulp", "lime and sugar", "cold over ice", ["cashew-fruit", "drink"]),
  d("isombe-rw", "Isombe", "RW", "Rwanda", "East Africa", "stew", "leaf", "cassava leaves", "peanut and eggplant", "ugali or rice", ["cassava-leaves", "peanut"]),
  d("ibihaza-rw", "Ibihaza", "RW", "Rwanda", "East Africa", "side", "stew", "pumpkin", "beans and peanut", "rice or ugali", ["pumpkin", "beans"]),
  d("agatogo-rw", "Agatogo", "RW", "Rwanda", "East Africa", "main", "stew", "green banana and beef", "tomato and peanut", "greens", ["green-banana", "beef"]),
  d("urwagwa-rw", "Urwagwa", "RW", "Rwanda", "East Africa", "beverage", "fermented", "ripe bananas", "sorghum flour starter", "celebration food", ["banana", "fermented"]),
  d("ikivuguto-rw", "Rwandan Ikivuguto", "RW", "Rwanda", "East Africa", "beverage", "fermented", "milk", "live culture starter", "porridge or bread", ["fermented-milk", "drink"]),
  d("ladob-sc", "Ladob", "SC", "Seychelles", "East Africa", "dessert", "dessert", "plantain or breadfruit", "coconut milk and nutmeg", "tea or grilled fish", ["plantain", "coconut"]),
  d("octopus-curry-sc", "Octopus Curry", "SC", "Seychelles", "East Africa", "seafood", "curry", "octopus", "masala and coconut milk", "rice", ["octopus", "curry"]),
  d("kat-kat-banane-sc", "Kat-Kat Banane", "SC", "Seychelles", "East Africa", "main", "stew", "green bananas and fish", "coconut milk", "rice or chutney", ["green-banana", "fish"]),
  d("satini-reken-sc", "Satini Reken", "SC", "Seychelles", "East Africa", "salad", "salad", "shark or smoked fish", "lime, chili, and onion", "rice or breadfruit", ["shark", "salad"]),
  d("citronelle-tea-sc", "Citronelle Tea", "SC", "Seychelles", "East Africa", "beverage", "beverage", "lemongrass", "ginger and honey", "breakfast or dessert", ["lemongrass", "tea"]),
  d("kisra-south-sudan-ss", "South Sudanese Kisra", "SS", "South Sudan", "East Africa", "bread", "bread", "sorghum flour", "fermented batter", "bamia or stew", ["sorghum", "flatbread"]),
  d("asida-south-sudan-ss", "South Sudanese Asida", "SS", "South Sudan", "East Africa", "starch", "porridge", "sorghum or wheat flour", "hot water and salt", "okra stew", ["porridge", "staple"]),
  d("bamia-south-sudan-ss", "Bamia", "SS", "South Sudan", "East Africa", "stew", "stew", "okra and lamb", "tomato and garlic", "kisra or rice", ["okra", "lamb"]),
  d("shorba-south-sudan-ss", "South Sudanese Shorba", "SS", "South Sudan", "East Africa", "soup", "soup", "goat or beef", "tomato and cumin", "bread or rice", ["soup", "goat"]),
  d("karkade-south-sudan-ss", "Karkade", "SS", "South Sudan", "East Africa", "beverage", "beverage", "dried hibiscus", "ginger and sugar", "cold with snacks", ["hibiscus", "drink"]),
  d("mchemsho-tz", "Mchemsho", "TZ", "Tanzania", "East Africa", "main", "stew", "beef, chicken, or fish", "green banana and vegetables", "chili and lemon", ["one-pot", "banana"]),
  d("urojo-zanzibar-tz", "Urojo", "TZ", "Tanzania", "East Africa", "soup", "soup", "potato and bhajia", "mango, tamarind, and chili", "fried snacks", ["zanzibar", "soup"]),
  d("ndizi-nyama-tz", "Ndizi na Nyama", "TZ", "Tanzania", "East Africa", "main", "stew", "green bananas and beef", "coconut milk and tomato", "greens", ["banana", "beef"]),
  d("mandazi-tanzania-tz", "Tanzanian Mandazi", "TZ", "Tanzania", "East Africa", "snack", "snack", "wheat flour", "coconut milk and cardamom", "tea or coffee", ["mandazi", "fritter"]),
  d("tangawizi-tz", "Tangawizi", "TZ", "Tanzania", "East Africa", "beverage", "beverage", "fresh ginger", "lime and sugar", "cold or sparkling", ["ginger", "drink"]),
  d("chikanda-zm", "Chikanda", "ZM", "Zambia", "East Africa", "snack", "snack", "orchid tuber flour or safe substitute", "peanut and chili", "tea or relish", ["chikanda", "peanut"]),
  d("kapenta-stew-zm", "Kapenta Stew", "ZM", "Zambia", "East Africa", "seafood", "stew", "dried kapenta fish", "tomato and onion", "nshima", ["kapenta", "fish"]),
  d("vinkubala-zm", "Vinkubala", "ZM", "Zambia", "East Africa", "main", "stew", "mopane worms", "tomato and onion", "nshima", ["mopane", "protein"]),
  d("deleele-zm", "Delele", "ZM", "Zambia", "East Africa", "side", "stew", "okra", "tomato and groundnut", "nshima", ["okra", "side"]),
  d("maheu-zm", "Zambian Maheu", "ZM", "Zambia", "East Africa", "beverage", "fermented", "maize meal", "malted grain or sugar", "chilled", ["maize", "fermented"]),
  d("sidvudvu-sz", "Sidvudvu", "SZ", "Eswatini", "Southern Africa", "side", "stew", "pumpkin", "maize meal and sugar", "stew or sour milk", ["pumpkin", "maize"]),
  d("emasi-etinkhobe-sz", "Emasi Etinkhobe", "SZ", "Eswatini", "Southern Africa", "main", "porridge", "samp or cracked maize", "sour milk", "greens or relish", ["sour-milk", "maize"]),
  d("umcombotsi-sz", "Umcombotsi", "SZ", "Eswatini", "Southern Africa", "beverage", "fermented", "maize and sorghum meal", "malt and yeast culture", "celebration food", ["fermented", "sorghum"]),
  d("roasted-mealie-sz", "Roasted Mealie", "SZ", "Eswatini", "Southern Africa", "snack", "grill", "fresh corn cobs", "salt and chili butter", "tea or grilled meat", ["corn", "grill"]),
  d("siphuphe-setindlubu-sz", "Siphuphe Setindlubu", "SZ", "Eswatini", "Southern Africa", "stew", "stew", "peanuts and beans", "onion and tomato", "pap or rice", ["peanut", "beans"]),
  d("fouti-guinea-gn", "Fouti", "GN", "Guinea", "West Africa", "porridge", "porridge", "rice or fonio", "sour milk or yogurt", "breakfast or tea", ["fonio", "porridge"]),
  d("konkoe-gn", "Konkoe", "GN", "Guinea", "West Africa", "seafood", "stew", "smoked fish", "tomato and chili", "rice", ["fish", "stew"]),
  d("ginger-juice-gn", "Guinean Ginger Juice", "GN", "Guinea", "West Africa", "beverage", "beverage", "fresh ginger", "pineapple and lime", "cold", ["ginger", "drink"]),
  d("latchiri-kossan-gn", "Latchiri Kossan", "GN", "Guinea", "West Africa", "breakfast", "porridge", "couscous or millet grains", "sour milk", "sugar or honey", ["millet", "milk"]),
  d("caldo-mancarra-gw", "Caldo de Mancarra", "GW", "Guinea-Bissau", "West Africa", "stew", "stew", "chicken or vegetables", "peanut sauce", "rice", ["peanut", "stew"]),
  d("cafriela-gw", "Cafriela", "GW", "Guinea-Bissau", "West Africa", "grill", "grill", "chicken pieces", "lime, garlic, and chili", "rice and salad", ["chicken", "grill"]),
  d("caldo-chabeu-gw", "Caldo de Chabeu", "GW", "Guinea-Bissau", "West Africa", "stew", "stew", "fish or chicken", "palm fruit sauce", "rice", ["palm-fruit", "stew"]),
  d("vinho-caju-gw", "Vinho de Caju", "GW", "Guinea-Bissau", "West Africa", "beverage", "fermented", "cashew fruit juice", "wild yeast or previous batch", "grilled fish", ["cashew", "fermented"]),
  d("blabla-st", "Blabla", "ST", "São Tomé and Príncipe", "West Africa", "seafood", "stew", "smoked or fresh fish", "tomato and palm oil", "boiled banana or breadfruit", ["fish", "stew"]),
  d("banana-assada-st", "Banana Assada", "ST", "São Tomé and Príncipe", "West Africa", "snack", "grill", "ripe or green bananas", "lime and chili", "fish or tea", ["banana", "grill"]),
  d("sonhos-banana-st", "Sonhos de Banana", "ST", "São Tomé and Príncipe", "West Africa", "dessert", "snack", "ripe banana and flour", "cinnamon sugar", "coffee or tea", ["banana", "fritter"]),
  d("ponche-coco-st", "Ponche de Coco", "ST", "São Tomé and Príncipe", "West Africa", "beverage", "beverage", "coconut milk", "lime, vanilla, and sugar", "chilled", ["coconut", "drink"]),
  d("kisser-td", "Kisser", "TD", "Chad", "Central Africa", "bread", "bread", "sorghum flour", "fermented batter", "stew or honey", ["sorghum", "flatbread"]),
  d("jarret-boeuf-td", "Jarret de Boeuf", "TD", "Chad", "Central Africa", "main", "stew", "beef shank", "tomato and garlic", "boule or rice", ["beef", "stew"]),
  d("fangasou-td", "Fangasou", "TD", "Chad", "Central Africa", "snack", "snack", "millet flour", "spice and onion", "pepper sauce", ["millet", "snack"]),
  d("jus-tamarin-td", "Chadian Tamarind Juice", "TD", "Chad", "Central Africa", "beverage", "beverage", "tamarind pulp", "ginger and sugar", "cold", ["tamarind", "drink"]),
  d("cassava-leaves-sl", "Cassava Leaves", "SL", "Sierra Leone", "West Africa", "stew", "leaf", "cassava leaves", "peanut and smoked fish", "rice", ["cassava-leaves", "stew"]),
  d("groundnut-stew-sierra-leone-sl", "Groundnut Stew", "SL", "Sierra Leone", "West Africa", "stew", "stew", "chicken or beef", "groundnut paste", "rice", ["groundnut", "stew"]),
  d("ginger-beer-sl", "Sierra Leone Ginger Beer", "SL", "Sierra Leone", "West Africa", "beverage", "beverage", "fresh ginger", "lime and sugar", "cold", ["ginger", "drink"]),
  d("oleleh-sl", "Oleleh", "SL", "Sierra Leone", "West Africa", "snack", "snack", "black-eyed pea paste", "palm oil and onion", "pepper sauce", ["beans", "steamed"]),
  d("kunu-zaki-ng", "Kunu Zaki", "NG", "Nigeria", "West Africa", "beverage", "fermented", "millet or sorghum", "ginger, cloves, and sweet potato", "cold with snacks", ["kunu", "millet"]),
  d("zobo-ng", "Zobo", "NG", "Nigeria", "West Africa", "beverage", "beverage", "dried hibiscus", "ginger, pineapple, and cloves", "cold over ice", ["zobo", "hibiscus"])
];

const recipes = rows.map(recipe);

const seen = new Set();
for (const item of recipes) {
  if (seen.has(item.slug)) throw new Error(`Duplicate slug: ${item.slug}`);
  seen.add(item.slug);
  if (['kunu-zaki-ng', 'ikivuguto-rw', 'kisra-south-sudan-ss', 'maheu-zm'].includes(item.slug)) {
    if (item.method_review_status !== 'pending-source-method' || item.method_review_revision !== (['kisra-south-sudan-ss','maheu-zm'].includes(item.slug) ? 'kisra-maheu-source-hold-20261018' : 'kunu-ikivuguto-source-hold-20261018') ||
        item.ingredients.length || item.steps.length || item.default_servings !== null || item.prep_time_minutes !== null || item.cook_time_minutes !== null || item.total_time_minutes !== null) {
      throw new Error(`${item.slug} must remain an explicit source-method hold`);
    }
    continue;
  }
  if (['mchemsho-tz','octopus-curry-sc'].includes(item.slug)) {
    const expected = {"mchemsho-tz": {"revision": "mchemsho-tatedo-indexed-beef-batch-20261018-v1", "source": "https://mecs.org.uk/wp-content/uploads/2020/12/Tanzania-Ecook-Book-text-web.pdf"}, "octopus-curry-sc": {"revision": "octopus-ben-pierce-jones-water-20261018-v1", "source": "https://www.tastesfromtheroad.com/recipes/octopus-curry-from-the-seychelles"}}[item.slug];
    if (item.method_revision !== expected.revision || item.source !== expected.source || item.sources.length !== 1 || item.sources[0].url !== expected.source || item.total_time_minutes !== null || item.diet_tags.length || item.calories !== null || item.ingredients.length < 8 || item.steps.length < 5 || Object.prototype.hasOwnProperty.call(item,'id') || Object.prototype.hasOwnProperty.call(item,'is_published') || Object.prototype.hasOwnProperty.call(item,'is_verified')) throw new Error(item.slug + ' source adaptation drift');
    continue;
  }
  if (!Array.isArray(item.sources) || item.sources.length < 2) {
    throw new Error(`${item.slug} needs at least two sources`);
  }
  if (!item.steps.some((entry) => entry.timer_seconds > 0)) {
    throw new Error(`${item.slug} needs a timer`);
  }
  if (item.ingredients.length < 5) {
    throw new Error(`${item.slug} needs at least five ingredient rows`);
  }
}

if (recipes.length !== 100) {
  throw new Error(`Expected 100 recipes, got ${recipes.length}`);
}

const batch = {
  batch_id: "2026-05-03-gap-fill-wave-1",
  reviewed_at: reviewedAt,
  notes:
    "One-hundred recipe AfroKitchen gap-fill wave focused on countries with low representation plus a traditional drinks lane. The generator uses curated dish rows, stable source references, method-specific ingredient templates, and timed cooking steps. Kunu Zaki, Ikivuguto, Kisra and Maheu are explicit pending source-method records with no preparation instructions, quantities, timing, yield or nutrition. Mchemsho and Octopus Curry use named attributed adaptations with unknown facts left unrecorded; illustrations do not certify a method.",
  recipes
};

fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
fs.writeFileSync(OUT_PATH, `${JSON.stringify(batch, null, 2)}\n`, "utf8");
console.log(`Wrote ${recipes.length} recipes to ${path.relative(ROOT, OUT_PATH)}`);
