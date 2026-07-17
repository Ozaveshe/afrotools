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
  "2026-05-02-north-africa-wave-1.json"
);

const reviewedAt = "2026-05-02";
const officialSourceStatus =
  "No direct ministry recipe page was found for every dish in this batch pass. The recipes are synthesized from multiple culinary, cultural, and household-style references.";

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

function recipe(input) {
  const totalTime = input.prep_time_minutes + input.cook_time_minutes;
  return {
    region: "North Africa",
    official_source_status: officialSourceStatus,
    confidence: "high",
    serving_unit: input.serving_unit || "servings",
    total_time_minutes: totalTime,
    author: "AfroKitchen research desk",
    ...input,
    ingredients: input.ingredients.map((item, index) => ({
      sort_order: (index + 1) * 10,
      ...item
    })),
    steps: input.steps.map((item, index) => ({
      step_number: index + 1,
      ...item
    }))
  };
}

const recipes = [
  recipe({
    slug: "rechta-algeroise-dz",
    name: "Rechta Algeroise",
    description:
      "Algerian hand-cut noodles served with chicken, turnips, chickpeas, cinnamon, and a pale onion broth.",
    country_code: "DZ",
    country_name: "Algeria",
    ethnic_group: "Algerian, especially Algiers",
    category: "main",
    tags: ["noodles", "chicken", "turnips", "celebration"],
    diet_tags: ["dairy-free"],
    prep_time_minutes: 30,
    cook_time_minutes: 75,
    difficulty: "medium",
    default_servings: 6,
    story:
      "Rechta is one of Algiers' ceremonial noodle dishes, prized for its fine strands, white sauce, chickpeas, turnips, and gentle spice. It is usually cooked for family gatherings, Eid tables, weddings, and long Sunday meals.",
    occasion: "Best for Eid, family Sundays, and winter lunches.",
    best_served_with: "Extra broth, lemon, harissa, or a crisp cucumber salad.",
    regional_variations:
      "Algiers versions keep the sauce pale with onion, cinnamon, chickpeas, and turnips, while some households add courgette, potato, or meatballs.",
    calories: 520,
    protein_g: 34,
    carbs_g: 58,
    fat_g: 17,
    fiber_g: 8,
    review_summary:
      "Common sources agree on steamed rechta noodles, chicken or lamb, chickpeas, turnips, onion, cinnamon, and a white sauce. This version keeps the broth light and steams the noodles twice for texture.",
    recommended_changes: [
      "Steam the noodles before saucing so they stay separate.",
      "Keep tomato out of the broth for the classic Algiers-style white sauce."
    ],
    sources: [
      source("Amour de Cuisine - Rechta Algerian noodles", "https://www.amourdecuisine.fr/en/article-rechta-traditional-algerian-handmade-noodle-recipe-with-white-sauce.html", ["white sauce", "turnips", "chicken", "steamed noodles"]),
      source("TasteAtlas - Rechta", "https://www.tasteatlas.com/rechta", ["dish identity", "Algerian noodles", "serving context"]),
      source("Wikipedia - Rechta", "https://en.wikipedia.org/wiki/Rechta", ["Algerian noodle dish", "festive context"])
    ],
    ingredients: [
      ingredient("Sauce", 1.2, "kg", "bone-in chicken pieces"),
      ingredient("Sauce", 2, "large", "onions", "finely sliced"),
      ingredient("Sauce", 2, "tbsp", "neutral oil"),
      ingredient("Sauce", 2, "tbsp", "smen or butter"),
      ingredient("Sauce", 1.5, "cups", "cooked chickpeas"),
      ingredient("Sauce", 4, "medium", "turnips", "peeled and quartered"),
      ingredient("Sauce", 1, "tsp", "ground cinnamon"),
      ingredient("Sauce", 0.5, "tsp", "white pepper"),
      ingredient("Noodles", 700, "g", "rechta noodles"),
      ingredient("Noodles", 2, "tbsp", "oil", "for loosening the noodles"),
      ingredient("Finishing", 0, "", "salt", "to taste")
    ],
    steps: [
      step("Build the white sauce", "Brown chicken lightly in oil and smen, then add onions, cinnamon, pepper, salt, and enough water to cover.", 15, "sauce base"),
      step("Simmer the chicken", "Add chickpeas and cook until the chicken is nearly tender and the broth tastes sweet from the onions.", 35, "simmer"),
      step("Steam the noodles", "Rub noodles with a little oil and steam over the broth. Fluff, moisten with broth, and steam again.", 25, "steam noodles"),
      step("Finish with turnips", "Add turnips to the broth and simmer until tender, then serve noodles soaked with broth and topped with chicken.", 20, "finish")
    ]
  }),
  recipe({
    slug: "chorba-frik-dz",
    name: "Chorba Frik",
    description:
      "Algerian tomato, lamb, chickpea, herb, and cracked green wheat soup traditionally served to open Ramadan meals.",
    country_code: "DZ",
    country_name: "Algeria",
    ethnic_group: "Algerian",
    category: "soup",
    tags: ["ramadan", "frik", "lamb", "tomato"],
    diet_tags: ["dairy-free"],
    prep_time_minutes: 20,
    cook_time_minutes: 70,
    difficulty: "medium",
    default_servings: 6,
    story:
      "Chorba frik is the Algerian bowl many families wait for at iftar: lamb, tomato, chickpeas, cilantro, mint, and smoky cracked green wheat cooked into a soup that is hearty but still bright.",
    occasion: "Best for Ramadan iftar, cold evenings, and first-course soup service.",
    best_served_with: "Lemon wedges, bourek, dates, and mint tea.",
    regional_variations:
      "Some homes use chicken, others lamb or beef. The frik can be coarse or fine, and the herb balance shifts by region.",
    calories: 330,
    protein_g: 23,
    carbs_g: 38,
    fat_g: 10,
    fiber_g: 8,
    review_summary:
      "Sources consistently identify frik, lamb or chicken, tomato, chickpeas, celery, cilantro, mint, and warming spices as the backbone. The AfroKitchen version adds frik late enough to keep the soup from turning pasty.",
    recommended_changes: [
      "Rinse frik until the water runs mostly clear.",
      "Add herbs near the end so the soup keeps its fresh iftar aroma."
    ],
    sources: [
      source("196 Flavors - Chorba Frik", "https://www.196flavors.com/algeria-chorba-frik/", ["frik", "lamb", "Ramadan soup"]),
      source("TasteAtlas - Chorba Frik", "https://www.tasteatlas.com/chorba-frik", ["Algerian identity", "iftar context", "ingredients"]),
      source("Wikipedia - Chorba", "https://en.wikipedia.org/wiki/Chorba", ["regional soup family", "North African context"])
    ],
    ingredients: [
      ingredient("Soup", 600, "g", "lamb shoulder", "cut into small pieces"),
      ingredient("Soup", 2, "tbsp", "olive oil"),
      ingredient("Soup", 1, "large", "onion", "finely chopped"),
      ingredient("Soup", 2, "stalks", "celery", "finely chopped"),
      ingredient("Soup", 4, "medium", "tomatoes", "grated"),
      ingredient("Soup", 2, "tbsp", "tomato paste"),
      ingredient("Soup", 1, "cup", "cooked chickpeas"),
      ingredient("Grain", 0.75, "cup", "frik", "rinsed"),
      ingredient("Spices", 1, "tsp", "paprika"),
      ingredient("Spices", 0.5, "tsp", "black pepper"),
      ingredient("Herbs", 0.5, "cup", "cilantro and mint", "chopped"),
      ingredient("Finishing", 1, "whole", "lemon", "cut into wedges")
    ],
    steps: [
      step("Brown the meat", "Cook lamb, onion, and celery in oil until the meat loses its raw color and the onion softens.", 12, "brown"),
      step("Make the red broth", "Add tomatoes, tomato paste, paprika, pepper, salt, chickpeas, and water, then simmer until the lamb is tender.", 40, "simmer"),
      step("Add frik", "Stir in rinsed frik and simmer gently, stirring often so the cracked wheat does not catch.", 18, "frik cook"),
      step("Finish fresh", "Fold in cilantro and mint, rest briefly, and serve with lemon.", 5, "finish")
    ]
  }),
  recipe({
    slug: "mhadjeb-dz",
    name: "Mhadjeb",
    description:
      "Algerian semolina flatbreads folded around a spicy tomato, onion, and pepper filling.",
    country_code: "DZ",
    country_name: "Algeria",
    ethnic_group: "Algerian",
    category: "street-food",
    tags: ["flatbread", "semolina", "tomato", "street food"],
    diet_tags: ["vegetarian", "dairy-free"],
    prep_time_minutes: 45,
    cook_time_minutes: 35,
    difficulty: "medium",
    default_servings: 8,
    story:
      "Mhadjeb, also called mahdjouba, is the Algerian griddle bread that turns a few pantry ingredients into a complete hand-held meal. Thin semolina dough is stretched, filled, folded, and cooked until blistered.",
    occasion: "Best for breakfast, street food plates, school snacks, and tea-time meals.",
    best_served_with: "Harissa, mint tea, olives, or a simple cucumber tomato salad.",
    regional_variations:
      "Some cooks keep the filling strictly tomato and onion, while others add peppers, garlic, minced meat, or cheese.",
    calories: 300,
    protein_g: 8,
    carbs_g: 52,
    fat_g: 7,
    fiber_g: 5,
    review_summary:
      "Sources agree on elastic semolina dough and a cooked onion-tomato-pepper filling. This recipe uses a soft, well-rested dough so home cooks can stretch it thin without tearing.",
    recommended_changes: [
      "Rest the dough balls with oil before stretching.",
      "Cook the filling down until jammy so it does not leak."
    ],
    sources: [
      source("TasteAtlas - Mhadjeb", "https://www.tasteatlas.com/mhadjeb", ["dish identity", "Algerian flatbread", "tomato filling"]),
      source("Halal Home Cooking - Mahjouba", "https://www.halalhomecooking.com/mahjouba-algerian-tomato-onion-filled-flatbread/", ["semolina dough", "tomato onion filling", "folding method"]),
      source("Wikipedia - Mahdjouba", "https://en.wikipedia.org/wiki/Mahdjouba", ["Algerian street food", "stuffed flatbread"])
    ],
    ingredients: [
      ingredient("Dough", 3, "cups", "fine semolina"),
      ingredient("Dough", 1, "cup", "all-purpose flour"),
      ingredient("Dough", 1.5, "cups", "warm water"),
      ingredient("Dough", 1, "tsp", "salt"),
      ingredient("Dough", 0.25, "cup", "oil", "for resting and stretching"),
      ingredient("Filling", 3, "large", "onions", "thinly sliced"),
      ingredient("Filling", 4, "medium", "tomatoes", "chopped"),
      ingredient("Filling", 2, "whole", "green peppers", "diced"),
      ingredient("Filling", 2, "cloves", "garlic", "minced"),
      ingredient("Filling", 1, "tbsp", "harissa"),
      ingredient("Filling", 1, "tsp", "paprika")
    ],
    steps: [
      step("Knead the dough", "Mix semolina, flour, salt, and water into a soft dough, then knead until smooth and elastic.", 12, "knead"),
      step("Rest in oil", "Divide into balls, coat with oil, cover, and rest until the dough relaxes.", 30, "rest"),
      step("Cook the filling", "Cook onions, peppers, tomatoes, garlic, harissa, paprika, and salt until thick and almost dry.", 22, "filling"),
      step("Fill and griddle", "Stretch each dough ball thin, add filling, fold into a square, and cook on a hot griddle until spotted.", 18, "griddle")
    ]
  }),
  recipe({
    slug: "dobara-biskra-dz",
    name: "Dobara Biskra",
    description:
      "Biskra-style chickpea and fava bean stew dressed with garlic, cumin, harissa, lemon, olive oil, and cilantro.",
    country_code: "DZ",
    country_name: "Algeria",
    ethnic_group: "Biskra and eastern Algerian",
    category: "stew",
    tags: ["chickpeas", "fava beans", "harissa", "street food"],
    diet_tags: ["vegan", "gluten-free", "dairy-free"],
    prep_time_minutes: 20,
    cook_time_minutes: 90,
    difficulty: "easy",
    default_servings: 6,
    story:
      "Dobara is the fiery bean bowl associated with Biskra, where tender chickpeas and fava beans are seasoned at the end with raw garlic, cumin, lemon, chili, oil, and herbs. It is cheap, filling, and built for bread.",
    occasion: "Best for street-food lunches, winter bowls, and simple vegan meals.",
    best_served_with: "Khobz, extra harissa, preserved lemon, or chopped fresh onion.",
    regional_variations:
      "Some versions use only chickpeas, while Biskra-style bowls often mix chickpeas and fava beans with a generous cumin and chili finish.",
    calories: 380,
    protein_g: 19,
    carbs_g: 58,
    fat_g: 10,
    fiber_g: 18,
    review_summary:
      "Sources describe Dobara as an Algerian Biskra bean stew with chickpeas, fava beans, cumin, garlic, harissa, lemon, and olive oil. The recipe keeps the beans plain while cooking, then seasons boldly at the end.",
    recommended_changes: [
      "Season after the beans are soft so the skins tenderize properly.",
      "Mash a ladle of beans back into the pot for body."
    ],
    sources: [
      source("TasteAtlas - Dobara", "https://www.tasteatlas.com/dobara", ["Biskra identity", "chickpeas", "fava beans", "seasoning"]),
      source("Halal Home Cooking - Doubara Biskra", "https://www.halalhomecooking.com/doubara-biskra/", ["chickpeas", "garlic", "cumin", "harissa"]),
      source("Wikipedia - Dobara", "https://en.wikipedia.org/wiki/Dobara_(Algerian_dish)", ["Biskra origin", "chickpeas", "fava beans"])
    ],
    ingredients: [
      ingredient("Beans", 1.5, "cups", "dried chickpeas", "soaked overnight"),
      ingredient("Beans", 1, "cup", "dried fava beans", "soaked overnight"),
      ingredient("Beans", 8, "cups", "water"),
      ingredient("Dressing", 4, "cloves", "garlic", "crushed"),
      ingredient("Dressing", 2, "tbsp", "harissa"),
      ingredient("Dressing", 2, "tsp", "ground cumin"),
      ingredient("Dressing", 3, "tbsp", "olive oil"),
      ingredient("Dressing", 1, "whole", "lemon", "juiced"),
      ingredient("Dressing", 0.5, "cup", "cilantro", "chopped"),
      ingredient("Finishing", 0, "", "salt", "to taste")
    ],
    steps: [
      step("Cook the beans", "Simmer soaked chickpeas and fava beans in water until very tender.", 75, "bean simmer"),
      step("Thicken the broth", "Mash a cup of beans against the pot and stir them back in to make the stew creamy.", 5, "thicken"),
      step("Season boldly", "Stir in garlic, harissa, cumin, olive oil, lemon juice, and salt while the beans are hot.", 7, "season"),
      step("Rest and serve", "Let the stew stand briefly, then finish with cilantro and more chili if desired.", 5, "rest")
    ]
  }),
  recipe({
    slug: "tajine-zitoun-dz",
    name: "Tajine Zitoun",
    description:
      "Algerian chicken and green olive stew with carrots, onion, lemon, cinnamon, and a lightly thickened sauce.",
    country_code: "DZ",
    country_name: "Algeria",
    ethnic_group: "Algerian",
    category: "main",
    tags: ["chicken", "olives", "tajine", "lemon"],
    diet_tags: ["gluten-free", "dairy-free"],
    prep_time_minutes: 20,
    cook_time_minutes: 65,
    difficulty: "medium",
    default_servings: 6,
    story:
      "Tajine zitoun is Algeria's olive-stew showpiece: chicken simmered with onion, carrots, spices, and briny green olives until the sauce turns glossy and balanced. It is elegant enough for guests but practical enough for family lunch.",
    occasion: "Best for guest lunches, Eid tables, and weekend chicken dinners.",
    best_served_with: "Khobz, rice, couscous, or boiled potatoes.",
    regional_variations:
      "Some versions include mushrooms, meatballs, preserved lemon, or a flour and lemon liaison to finish the sauce.",
    calories: 430,
    protein_g: 38,
    carbs_g: 14,
    fat_g: 25,
    fiber_g: 4,
    review_summary:
      "Sources agree on chicken, green olives, carrots, onion, lemon, and a pale aromatic sauce. This recipe blanches the olives to soften the salt and finishes with lemon for balance.",
    recommended_changes: [
      "Blanch olives once or twice if they are very salty.",
      "Add lemon at the end so the sauce stays bright."
    ],
    sources: [
      source("Wikipedia - Tajine Zitoun", "https://en.wikipedia.org/wiki/Tajine_Zitoun", ["Algiers origin", "chicken", "green olives", "carrots"]),
      source("TasteAtlas - Tajine Zitoun", "https://www.tasteatlas.com/tajine-zitoune", ["Algerian dish identity", "olive stew", "serving context"]),
      source("Cuisine Culinaire - Algerian Chicken with Olives", "https://www.cuisineculinaire.com/tajine-de-poulet-aux-olives-algerie/", ["method", "olive blanching", "sauce"])
    ],
    ingredients: [
      ingredient("Stew", 1.2, "kg", "bone-in chicken pieces"),
      ingredient("Stew", 2, "tbsp", "olive oil"),
      ingredient("Stew", 1, "large", "onion", "grated"),
      ingredient("Stew", 3, "cloves", "garlic", "minced"),
      ingredient("Stew", 3, "medium", "carrots", "sliced"),
      ingredient("Stew", 2, "cups", "green olives", "pitted and blanched"),
      ingredient("Spices", 0.5, "tsp", "cinnamon"),
      ingredient("Spices", 0.5, "tsp", "turmeric"),
      ingredient("Finishing", 1, "whole", "lemon", "juiced"),
      ingredient("Finishing", 1, "tbsp", "cornstarch", "mixed with water")
    ],
    steps: [
      step("Brown the chicken", "Brown chicken with oil, onion, garlic, cinnamon, turmeric, salt, and pepper.", 12, "brown"),
      step("Simmer", "Add water to halfway cover, then simmer until the chicken is tender.", 35, "simmer"),
      step("Add carrots and olives", "Add carrots and blanched olives and cook until the carrots are tender and the sauce is savory.", 15, "olive cook"),
      step("Gloss the sauce", "Stir in lemon juice and a little cornstarch slurry, then simmer until lightly thickened.", 4, "finish")
    ]
  }),
  recipe({
    slug: "hawawshi-eg",
    name: "Hawawshi",
    description:
      "Egyptian baladi bread stuffed with spiced minced beef, onion, pepper, parsley, and chili, then baked until crisp.",
    country_code: "EG",
    country_name: "Egypt",
    ethnic_group: "Egyptian",
    category: "street-food",
    tags: ["beef", "bread", "street food", "spiced"],
    diet_tags: ["dairy-free"],
    prep_time_minutes: 25,
    cook_time_minutes: 25,
    difficulty: "easy",
    default_servings: 6,
    story:
      "Hawawshi is Cairo comfort in a pocket: spiced meat pressed inside bread and baked until the outside crisps and the juices season the loaf from within. Alexandrian versions may use a dough casing, while many homes use baladi or pita bread.",
    occasion: "Best for quick dinners, street-food spreads, and game-day plates.",
    best_served_with: "Pickles, tahini, tomato cucumber salad, or chili sauce.",
    regional_variations:
      "Cairo hawawshi is often stuffed into bread, while Alexandrian hawawshi can be baked in fresh dough with a hotter spice profile.",
    calories: 470,
    protein_g: 25,
    carbs_g: 42,
    fat_g: 24,
    fiber_g: 4,
    review_summary:
      "Sources agree on minced beef, onion, peppers, parsley, spices, and bread baked or griddled until crisp. The AfroKitchen version keeps the filling moist but not loose.",
    recommended_changes: [
      "Use 80 to 85 percent lean beef so the bread stays juicy.",
      "Spread the meat thin so it cooks through with the bread."
    ],
    sources: [
      source("The Mediterranean Dish - Hawawshi", "https://www.themediterraneandish.com/hawawshi-recipe/", ["meat filling", "baladi bread", "baking method"]),
      source("Amira's Pantry - Hawawshi", "https://amiraspantry.com/hawawshi/", ["Egyptian street food", "beef filling", "spices"]),
      source("TasteAtlas - Hawawshi", "https://www.tasteatlas.com/hawawshi", ["Egyptian identity", "street-food context"])
    ],
    ingredients: [
      ingredient("Filling", 700, "g", "ground beef"),
      ingredient("Filling", 1, "large", "onion", "finely grated and squeezed"),
      ingredient("Filling", 1, "large", "green pepper", "finely diced"),
      ingredient("Filling", 1, "whole", "hot pepper", "minced"),
      ingredient("Filling", 0.5, "cup", "parsley", "chopped"),
      ingredient("Filling", 2, "tsp", "baharat"),
      ingredient("Filling", 1, "tsp", "paprika"),
      ingredient("Filling", 0.5, "tsp", "cumin"),
      ingredient("Bread", 6, "rounds", "baladi bread or pita"),
      ingredient("Bread", 2, "tbsp", "oil", "for brushing")
    ],
    steps: [
      step("Mix the filling", "Combine beef, onion, peppers, parsley, spices, salt, and pepper until evenly seasoned.", 8, "mix"),
      step("Stuff the bread", "Open each bread pocket and spread a thin layer of meat all the way to the edges.", 10, "stuff"),
      step("Bake until crisp", "Brush with oil and bake on a hot tray until the bread crisps and the beef is cooked through.", 22, "bake"),
      step("Rest and slice", "Rest briefly so the juices settle, then cut into wedges and serve hot.", 5, "rest")
    ]
  }),
  recipe({
    slug: "feteer-meshaltet-eg",
    name: "Feteer Meshaltet",
    description:
      "Layered Egyptian pastry made from stretched dough, ghee, and oil, baked into flaky golden sheets.",
    country_code: "EG",
    country_name: "Egypt",
    ethnic_group: "Egyptian",
    category: "bread",
    tags: ["pastry", "ghee", "layered", "breakfast"],
    diet_tags: ["vegetarian"],
    prep_time_minutes: 60,
    cook_time_minutes: 20,
    difficulty: "hard",
    default_servings: 8,
    story:
      "Feteer meshaltet is Egypt's layered pastry of celebration and generosity. The dough is rested, stretched paper-thin with ghee, folded into layers, and baked until puffed and flaky.",
    occasion: "Best for breakfast tables, holidays, guest visits, and tea service.",
    best_served_with: "Honey, molasses, clotted cream, feta, olives, or mish.",
    regional_variations:
      "Plain feteer is served sweet or savory, while stuffed versions can include cheese, sausage, sugar, coconut, or custard.",
    calories: 410,
    protein_g: 7,
    carbs_g: 45,
    fat_g: 22,
    fiber_g: 2,
    review_summary:
      "Sources agree on a rested flour dough stretched thin with ghee and folded repeatedly. This method prioritizes rest time and warm ghee so the pastry flakes without tearing.",
    recommended_changes: [
      "Rest the dough well before stretching.",
      "Use enough ghee between layers or the pastry will bake dense."
    ],
    sources: [
      source("Amira's Pantry - Egyptian Feteer Meshaltet", "https://amiraspantry.com/egyptian-feteer-meshaltet/comment-page-4/", ["Egyptian pastry", "ghee layers", "stretching method"]),
      source("TasteAtlas - Fetir Meshaltet Recipe", "https://www.tasteatlas.com/fetir-meshaltet/recipe", ["layered pastry", "baking method", "serving"]),
      source("Wikipedia - Feteer Meshaltet", "https://en.wikipedia.org/wiki/Feteer_meshaltet", ["dish identity", "Egyptian context"])
    ],
    ingredients: [
      ingredient("Dough", 4, "cups", "all-purpose flour"),
      ingredient("Dough", 1.5, "cups", "warm water"),
      ingredient("Dough", 1, "tsp", "salt"),
      ingredient("Layering", 0.75, "cup", "ghee", "melted"),
      ingredient("Layering", 0.25, "cup", "neutral oil"),
      ingredient("Serving", 0.5, "cup", "honey or molasses"),
      ingredient("Serving", 0.5, "cup", "cream or feta", "optional")
    ],
    steps: [
      step("Make the dough", "Knead flour, salt, and warm water into a soft elastic dough.", 12, "knead"),
      step("Rest the balls", "Divide into balls, coat with oil, cover, and rest until very relaxed.", 45, "rest"),
      step("Stretch and layer", "Stretch each ball thin, brush with ghee, fold into layers, and stack into a round.", 20, "layer"),
      step("Bake hot", "Bake in a very hot oven until puffed, golden, and flaky.", 18, "bake")
    ]
  }),
  recipe({
    slug: "mahshi-eg",
    name: "Mahshi",
    description:
      "Egyptian vegetables stuffed with herbed tomato rice and simmered in a light tomato broth.",
    country_code: "EG",
    country_name: "Egypt",
    ethnic_group: "Egyptian",
    category: "main",
    tags: ["stuffed vegetables", "rice", "herbs", "tomato"],
    diet_tags: ["vegan", "gluten-free", "dairy-free"],
    prep_time_minutes: 55,
    cook_time_minutes: 55,
    difficulty: "hard",
    default_servings: 6,
    story:
      "Mahshi is the Egyptian stuffed-vegetable craft that fills tables and kitchens with herbs. Rice, tomato, dill, parsley, cilantro, onion, and spice are tucked into zucchini, peppers, eggplant, cabbage, or grape leaves.",
    occasion: "Best for Friday lunches, Ramadan tables, and family gatherings.",
    best_served_with: "Roast chicken, yogurt, salad, or soup.",
    regional_variations:
      "Vegetable choice changes by household. Some versions include minced meat, while many Egyptian home versions keep the stuffing rice-forward and herb-heavy.",
    calories: 340,
    protein_g: 8,
    carbs_g: 62,
    fat_g: 8,
    fiber_g: 8,
    review_summary:
      "Sources agree on short-grain rice, tomato, onion, herbs, and vegetables simmered until tender. The recipe par-cooks the sauce and fills vegetables loosely so the rice expands cleanly.",
    recommended_changes: [
      "Do not overfill the vegetables because rice expands.",
      "Use enough broth to steam but not drown the stuffing."
    ],
    sources: [
      source("Amira's Pantry - Rice Stuffed Veggies Mahshi", "https://amiraspantry.com/rice-stuffed-veggies-aka-mahshi/", ["stuffed vegetables", "rice herbs", "Egyptian method"]),
      source("196 Flavors - Egyptian Mahshi", "https://www.196flavors.com/egypt-mahshi/", ["vegetable stuffing", "tomato rice", "simmering"]),
      source("TasteAtlas - Mahshi", "https://www.tasteatlas.com/mahshi", ["dish identity", "regional stuffed vegetable context"])
    ],
    ingredients: [
      ingredient("Vegetables", 10, "medium", "zucchini, peppers, or eggplants", "cored"),
      ingredient("Stuffing", 2, "cups", "short-grain rice", "rinsed"),
      ingredient("Stuffing", 1, "large", "onion", "finely chopped"),
      ingredient("Stuffing", 3, "cups", "tomato sauce"),
      ingredient("Stuffing", 0.5, "cup", "dill", "chopped"),
      ingredient("Stuffing", 0.5, "cup", "parsley", "chopped"),
      ingredient("Stuffing", 0.5, "cup", "cilantro", "chopped"),
      ingredient("Stuffing", 2, "tbsp", "oil"),
      ingredient("Spices", 1, "tsp", "cumin"),
      ingredient("Spices", 1, "tsp", "dried mint"),
      ingredient("Cooking", 3, "cups", "vegetable broth")
    ],
    steps: [
      step("Make the stuffing", "Mix rice, onion, tomato sauce, herbs, oil, cumin, mint, salt, and pepper.", 12, "stuffing"),
      step("Fill the vegetables", "Stuff vegetables loosely, leaving room for the rice to expand.", 25, "fill"),
      step("Arrange and broth", "Pack vegetables upright in a pot and pour in seasoned broth to come partway up the sides.", 8, "arrange"),
      step("Simmer gently", "Cover and simmer on low heat until the vegetables are tender and the rice is cooked.", 45, "simmer")
    ]
  }),
  recipe({
    slug: "sayadeya-eg",
    name: "Sayadeya",
    description:
      "Egyptian fish and rice cooked with caramelized onions, cumin, tomato, warm spices, and seafood broth.",
    country_code: "EG",
    country_name: "Egypt",
    ethnic_group: "Egyptian coastal",
    category: "seafood",
    tags: ["fish", "rice", "coastal", "onion"],
    diet_tags: ["dairy-free"],
    prep_time_minutes: 25,
    cook_time_minutes: 55,
    difficulty: "medium",
    default_servings: 5,
    story:
      "Sayadeya is the fisherman's rice of Egypt's coastal cities, especially Alexandria and Port Said. Deeply browned onions color the rice, while fish broth and spices make it taste like the sea.",
    occasion: "Best for seafood Fridays, coastal-style dinners, and family lunch.",
    best_served_with: "Tahini sauce, salad baladi, pickles, and fried fish.",
    regional_variations:
      "Some households fry the fish separately, others nestle it into the rice. Tomato may be light or more pronounced depending on the coast.",
    calories: 510,
    protein_g: 34,
    carbs_g: 64,
    fat_g: 14,
    fiber_g: 4,
    review_summary:
      "Sources agree on fish, rice, caramelized onions, cumin, coriander, and fish stock. This version browns onions deeply before adding rice so the color and flavor hold.",
    recommended_changes: [
      "Brown the onions patiently for the signature color.",
      "Use fish bones or shrimp shells for a stronger broth if available."
    ],
    sources: [
      source("FoodMap - Sayadeya", "https://www.foodmap.in/egypt/sayadeya", ["fish rice", "caramelized onion", "Egyptian seafood"]),
      source("TasteAtlas - Sayadeya", "https://www.tasteatlas.com/sayadeya", ["regional fish method", "tomato", "spices"]),
      source("Wikipedia - Sayadieh", "https://en.wikipedia.org/wiki/Sayadieh", ["Egyptian dish identity", "coastal context"])
    ],
    ingredients: [
      ingredient("Fish", 800, "g", "white fish fillets", "cut into large pieces"),
      ingredient("Fish", 1, "whole", "lemon", "juiced"),
      ingredient("Rice", 2, "cups", "long-grain rice", "rinsed"),
      ingredient("Rice", 3, "large", "onions", "thinly sliced"),
      ingredient("Rice", 3, "tbsp", "oil"),
      ingredient("Rice", 2, "tbsp", "tomato paste"),
      ingredient("Rice", 4, "cups", "fish stock"),
      ingredient("Spices", 1.5, "tsp", "cumin"),
      ingredient("Spices", 1, "tsp", "ground coriander"),
      ingredient("Spices", 0.5, "tsp", "cinnamon"),
      ingredient("Finishing", 0.5, "cup", "parsley", "chopped")
    ],
    steps: [
      step("Season fish", "Season fish with lemon, salt, pepper, cumin, and coriander while the onions cook.", 10, "season"),
      step("Caramelize onions", "Cook onions in oil until deep brown but not burned.", 25, "onions"),
      step("Cook the rice", "Stir in tomato paste, rice, spices, and fish stock, then simmer until the rice is nearly tender.", 20, "rice"),
      step("Steam fish on top", "Place fish over the rice, cover, and steam until just cooked through.", 12, "fish steam")
    ]
  }),
  recipe({
    slug: "umm-ali-eg",
    name: "Umm Ali",
    description:
      "Egyptian baked bread pudding with pastry, milk, cream, nuts, raisins, coconut, and a golden top.",
    country_code: "EG",
    country_name: "Egypt",
    ethnic_group: "Egyptian",
    category: "dessert",
    tags: ["dessert", "milk", "pastry", "nuts"],
    diet_tags: ["vegetarian"],
    prep_time_minutes: 15,
    cook_time_minutes: 25,
    difficulty: "easy",
    default_servings: 8,
    story:
      "Umm Ali is Egypt's warm pastry pudding, a dessert that turns flaky bread or puff pastry into milk-soaked comfort with nuts, raisins, coconut, and cream browned on top.",
    occasion: "Best for Ramadan nights, winter desserts, and family celebrations.",
    best_served_with: "Mint tea, coffee, or extra warm milk.",
    regional_variations:
      "Some cooks use puff pastry, others use roaa, croissants, or baked bread. Pistachios, almonds, hazelnuts, raisins, and coconut vary by household.",
    calories: 430,
    protein_g: 9,
    carbs_g: 45,
    fat_g: 24,
    fiber_g: 3,
    review_summary:
      "Sources agree on crisp pastry soaked with sweetened milk, cream, nuts, raisins, and coconut, then baked or broiled. This version keeps the pastry toasted so the center stays soft without becoming gluey.",
    recommended_changes: [
      "Toast the pastry before soaking.",
      "Broil briefly at the end for the classic golden top."
    ],
    sources: [
      source("The Mediterranean Dish - Umm Ali", "https://www.themediterraneandish.com/umm-ali-egyptian-bread-pudding/", ["puff pastry", "milk", "nuts", "baking"]),
      source("Amira's Pantry - Omm Ali", "https://amiraspantry.com/egyptian-dessert-omm-ali-om-ali-or-alis-mom/", ["Egyptian dessert", "pastry pudding", "cream topping"]),
      source("TasteAtlas - Umm Ali", "https://www.tasteatlas.com/umm-ali", ["dish identity", "Egyptian dessert context"])
    ],
    ingredients: [
      ingredient("Base", 500, "g", "puff pastry or croissants", "baked and torn"),
      ingredient("Milk", 4, "cups", "whole milk"),
      ingredient("Milk", 0.75, "cup", "sugar"),
      ingredient("Milk", 1, "tsp", "vanilla"),
      ingredient("Mix-ins", 0.5, "cup", "raisins"),
      ingredient("Mix-ins", 0.5, "cup", "mixed nuts", "chopped"),
      ingredient("Mix-ins", 0.33, "cup", "shredded coconut"),
      ingredient("Topping", 1, "cup", "heavy cream"),
      ingredient("Topping", 2, "tbsp", "pistachios", "chopped")
    ],
    steps: [
      step("Toast the pastry", "Spread pastry pieces in a baking dish and toast until crisp and lightly golden.", 8, "toast"),
      step("Heat the milk", "Warm milk with sugar and vanilla until the sugar dissolves.", 6, "milk"),
      step("Soak and top", "Pour milk over pastry, add raisins, nuts, and coconut, then spoon cream over the top.", 5, "soak"),
      step("Bake golden", "Bake until bubbling, then broil briefly for a browned cream top.", 14, "bake")
    ]
  }),
  recipe({
    slug: "mbakbaka-ly",
    name: "Mbakbaka",
    description:
      "Libyan one-pot pasta cooked directly in a spicy tomato sauce with lamb or chicken, chickpeas, and warm spices.",
    country_code: "LY",
    country_name: "Libya",
    ethnic_group: "Libyan",
    category: "main",
    tags: ["pasta", "one-pot", "tomato", "lamb"],
    diet_tags: ["dairy-free"],
    prep_time_minutes: 20,
    cook_time_minutes: 55,
    difficulty: "easy",
    default_servings: 6,
    story:
      "Mbakbaka is one of Libya's great everyday one-pot meals. Pasta cooks in the sauce itself, absorbing tomato, chili, meat juices, spices, and chickpeas until every spoonful tastes seasoned all the way through.",
    occasion: "Best for weeknight family meals, quick guest food, and camping pots.",
    best_served_with: "Simple salad, olives, pickles, or extra chili.",
    regional_variations:
      "Some cooks use lamb, others chicken or no meat. Pasta shape, chickpeas, potatoes, and chili strength change by household.",
    calories: 570,
    protein_g: 30,
    carbs_g: 72,
    fat_g: 18,
    fiber_g: 8,
    review_summary:
      "Sources agree that pasta cooks in a tomato-based Libyan sauce rather than separately. This version keeps enough liquid for the pasta and finishes with a short rest.",
    recommended_changes: [
      "Stir often once the pasta goes in.",
      "Keep extra hot water nearby because pasta brands absorb differently."
    ],
    sources: [
      source("Libyan Food - Mbakbaka", "http://libyanfood.blogspot.com/2011/04/mbakbaka.html", ["one-pot pasta", "tomato sauce", "Libyan method"]),
      source("TasteAtlas - Mbakbaka", "https://www.tasteatlas.com/mbakbaka", ["Libyan dish identity", "pasta", "meat sauce"]),
      source("Wikipedia - Libyan cuisine", "https://en.wikipedia.org/wiki/Libyan_cuisine", ["Libyan pasta and sauce context", "spices"])
    ],
    ingredients: [
      ingredient("Sauce", 600, "g", "lamb or chicken pieces"),
      ingredient("Sauce", 2, "tbsp", "olive oil"),
      ingredient("Sauce", 1, "large", "onion", "chopped"),
      ingredient("Sauce", 3, "cloves", "garlic", "minced"),
      ingredient("Sauce", 3, "tbsp", "tomato paste"),
      ingredient("Sauce", 2, "cups", "crushed tomatoes"),
      ingredient("Sauce", 1, "cup", "cooked chickpeas"),
      ingredient("Spices", 1, "tsp", "cumin"),
      ingredient("Spices", 1, "tsp", "paprika"),
      ingredient("Spices", 0.5, "tsp", "cayenne"),
      ingredient("Pasta", 500, "g", "short pasta"),
      ingredient("Liquid", 5, "cups", "hot water or stock")
    ],
    steps: [
      step("Brown the meat", "Cook meat, onion, and garlic in oil until fragrant and lightly browned.", 12, "brown"),
      step("Build the sauce", "Add tomato paste, tomatoes, chickpeas, spices, salt, and hot water, then simmer until the meat is nearly tender.", 30, "sauce"),
      step("Cook pasta in the pot", "Add pasta and simmer, stirring often, until the pasta is tender and saucy.", 13, "pasta"),
      step("Rest before serving", "Cover off heat for a few minutes so the sauce clings to the pasta.", 5, "rest")
    ]
  }),
  recipe({
    slug: "usban-ly",
    name: "Usban",
    description:
      "Libyan stuffed sausage parcels filled with rice, lamb, herbs, liver, and spices, then simmered until tender.",
    country_code: "LY",
    country_name: "Libya",
    ethnic_group: "Libyan and Maghrebi",
    category: "main",
    tags: ["rice", "lamb", "offal", "festival"],
    diet_tags: ["dairy-free"],
    prep_time_minutes: 75,
    cook_time_minutes: 90,
    difficulty: "hard",
    default_servings: 8,
    story:
      "Usban is special-occasion cooking across Libya and parts of the Maghreb. Cleaned casings are filled with rice, herbs, lamb, liver, and spices, then simmered into rich, sliceable parcels.",
    occasion: "Best for Eid al-Adha, weddings, and large family feasts.",
    best_served_with: "Couscous, tomato sauce, salad, or soup from the cooking broth.",
    regional_variations:
      "Libyan homes may add lamb liver, heart, herbs, rice, tomato, and chili, while Tunisian and Algerian versions vary the offal mix and spice level.",
    calories: 610,
    protein_g: 36,
    carbs_g: 44,
    fat_g: 32,
    fiber_g: 4,
    review_summary:
      "Sources agree on cleaned casings stuffed with rice, herbs, meat, offal, and spices. The AfroKitchen version gives a safer home structure with careful cleaning, loose stuffing, and a long simmer.",
    recommended_changes: [
      "Stuff loosely because rice expands.",
      "Pierce lightly before simmering to prevent bursting."
    ],
    sources: [
      source("Libyan Food - Osban", "http://libyanfood.blogspot.com/2010/11/osban.html", ["Libyan method", "rice stuffing", "casings"]),
      source("TasteAtlas - Usban", "https://www.tasteatlas.com/usban", ["Maghrebi dish identity", "offal and rice", "festive context"]),
      source("Wikipedia - Usban", "https://en.wikipedia.org/wiki/Usban", ["regional context", "stuffed sausage"])
    ],
    ingredients: [
      ingredient("Casing", 1, "kg", "cleaned lamb casing or tripe pockets"),
      ingredient("Filling", 2, "cups", "short-grain rice", "rinsed"),
      ingredient("Filling", 500, "g", "lamb", "finely diced"),
      ingredient("Filling", 300, "g", "lamb liver", "finely diced"),
      ingredient("Filling", 2, "large", "onions", "chopped"),
      ingredient("Filling", 1, "cup", "parsley and cilantro", "chopped"),
      ingredient("Filling", 3, "tbsp", "tomato paste"),
      ingredient("Spices", 2, "tsp", "bzaar or mixed spice"),
      ingredient("Spices", 1, "tsp", "cumin"),
      ingredient("Spices", 1, "tsp", "chili powder"),
      ingredient("Cooking", 8, "cups", "water or light stock")
    ],
    steps: [
      step("Clean the casings", "Rinse and inspect casings or tripe pockets carefully, then drain.", 25, "clean"),
      step("Mix filling", "Combine rice, lamb, liver, onions, herbs, tomato paste, spices, salt, and pepper.", 15, "filling"),
      step("Stuff loosely", "Fill casings loosely, sew or tie closed, and prick once or twice with a needle.", 25, "stuff"),
      step("Simmer gently", "Simmer in salted water or stock until the rice and meat are cooked through.", 85, "simmer")
    ]
  }),
  recipe({
    slug: "rishta-kiskas-ly",
    name: "Rishta Kiskas",
    description:
      "Libyan hand-cut noodles steamed over chickpea, potato, and tomato stew, then tossed with sauce.",
    country_code: "LY",
    country_name: "Libya",
    ethnic_group: "Libyan",
    category: "main",
    tags: ["noodles", "stew", "chickpeas", "tomato"],
    diet_tags: ["dairy-free"],
    prep_time_minutes: 45,
    cook_time_minutes: 75,
    difficulty: "hard",
    default_servings: 6,
    story:
      "Rishta kiskas is Libya's steamed-noodle comfort dish. Thin noodles are steamed over a bubbling tomato stew so they catch the aroma before being tossed with the sauce and served with chickpeas, potato, and meat.",
    occasion: "Best for family lunches, winter meals, and weekend cooking.",
    best_served_with: "Lemon, chili paste, salad, or yogurt.",
    regional_variations:
      "Some versions use lamb or chicken, while meatless versions rely on chickpeas, potatoes, pumpkin, or seasonal vegetables.",
    calories: 540,
    protein_g: 24,
    carbs_g: 82,
    fat_g: 13,
    fiber_g: 10,
    review_summary:
      "Sources describe rishta as Libyan noodles steamed over sauce, usually with chickpeas and vegetables. This version uses store-bought fresh noodles as a practical shortcut while preserving the steaming step.",
    recommended_changes: [
      "Steam the noodles before tossing so they stay springy.",
      "Keep the stew saucy because noodles absorb a lot at the end."
    ],
    sources: [
      source("Libyan Food - Rishda", "http://libyanfood.blogspot.com/2011/01/rishda.html", ["Libyan noodles", "steaming", "tomato stew"]),
      source("TasteAtlas - Rishda", "https://www.tasteatlas.com/rishda", ["Libyan dish identity", "noodles", "stew"]),
      source("Wikipedia - Libyan cuisine", "https://en.wikipedia.org/wiki/Libyan_cuisine", ["Libyan pasta and stew context"])
    ],
    ingredients: [
      ingredient("Stew", 500, "g", "lamb or chicken pieces"),
      ingredient("Stew", 2, "tbsp", "oil"),
      ingredient("Stew", 1, "large", "onion", "chopped"),
      ingredient("Stew", 2, "tbsp", "tomato paste"),
      ingredient("Stew", 2, "cups", "crushed tomatoes"),
      ingredient("Stew", 1.5, "cups", "cooked chickpeas"),
      ingredient("Stew", 3, "medium", "potatoes", "quartered"),
      ingredient("Spices", 1, "tsp", "cumin"),
      ingredient("Spices", 1, "tsp", "paprika"),
      ingredient("Noodles", 700, "g", "fresh thin noodles"),
      ingredient("Finishing", 2, "tbsp", "olive oil")
    ],
    steps: [
      step("Start the stew", "Cook meat, onion, tomato paste, tomatoes, spices, salt, and water until the meat is nearly tender.", 40, "stew"),
      step("Add chickpeas and potatoes", "Add chickpeas and potatoes and simmer until the potatoes soften.", 20, "vegetables"),
      step("Steam noodles", "Place noodles in a steamer over the stew and steam until tender and aromatic.", 20, "steam noodles"),
      step("Toss and serve", "Toss noodles with a little sauce and oil, then top with meat, chickpeas, potatoes, and more stew.", 8, "finish")
    ]
  }),
  recipe({
    slug: "mbatten-ly",
    name: "Mbatten",
    description:
      "Libyan stuffed potato wedges filled with spiced minced meat and herbs, coated, and fried until crisp.",
    country_code: "LY",
    country_name: "Libya",
    ethnic_group: "Libyan",
    category: "snack",
    tags: ["potato", "beef", "fried", "Ramadan"],
    diet_tags: ["dairy-free"],
    prep_time_minutes: 45,
    cook_time_minutes: 35,
    difficulty: "medium",
    default_servings: 6,
    story:
      "Mbatten turns potatoes into a celebration snack: each wedge is slit, packed with spiced meat and parsley, dipped, and fried. It often appears on Libyan Ramadan and party tables.",
    occasion: "Best for Ramadan spreads, appetizers, and weekend snacks.",
    best_served_with: "Soup, salad, lemon, chili sauce, or bread.",
    regional_variations:
      "Some cooks add egg, breadcrumbs, or tomato paste to the filling, and spice levels vary from mild to very peppery.",
    calories: 420,
    protein_g: 18,
    carbs_g: 38,
    fat_g: 23,
    fiber_g: 5,
    review_summary:
      "Sources agree on potato slices or wedges stuffed with minced meat, herbs, and spices, then fried. The recipe par-cooks nothing so the potato and filling finish together in hot oil.",
    recommended_changes: [
      "Cut the potato pockets evenly so they cook at the same speed.",
      "Keep the oil medium-hot so the potato cooks before the crust darkens."
    ],
    sources: [
      source("Libyan Food - Mbatten", "http://libyanfood.blogspot.com/2010/11/mbatten.html", ["stuffed potatoes", "meat filling", "frying method"]),
      source("TasteAtlas - Mbatten", "https://www.tasteatlas.com/mbatten", ["Libyan dish identity", "potato", "stuffed meat"]),
      source("Wikipedia - Libyan cuisine", "https://en.wikipedia.org/wiki/Libyan_cuisine", ["Libyan snack context", "frying"])
    ],
    ingredients: [
      ingredient("Potatoes", 6, "large", "potatoes", "peeled and cut into slit wedges"),
      ingredient("Filling", 450, "g", "ground beef or lamb"),
      ingredient("Filling", 1, "small", "onion", "grated"),
      ingredient("Filling", 0.5, "cup", "parsley", "chopped"),
      ingredient("Filling", 2, "cloves", "garlic", "minced"),
      ingredient("Spices", 1, "tsp", "cumin"),
      ingredient("Spices", 1, "tsp", "paprika"),
      ingredient("Coating", 2, "whole", "eggs", "beaten"),
      ingredient("Coating", 1, "cup", "flour"),
      ingredient("Frying", 3, "cups", "oil")
    ],
    steps: [
      step("Prepare potatoes", "Cut potato wedges with a deep pocket, keeping each wedge attached at one end.", 15, "cut"),
      step("Mix filling", "Combine meat, onion, parsley, garlic, spices, salt, and pepper.", 8, "mix"),
      step("Stuff and coat", "Pack filling into potato pockets, dust with flour, and dip in egg.", 18, "stuff"),
      step("Fry until cooked", "Fry in batches until the potatoes are tender, the filling is cooked, and the outside is crisp.", 18, "fry")
    ]
  }),
  recipe({
    slug: "hraime-ly",
    name: "Hraime Libyan Fish",
    description:
      "Libyan Jewish-style fish simmered in a fiery tomato, garlic, caraway, cumin, paprika, and chili sauce.",
    country_code: "LY",
    country_name: "Libya",
    ethnic_group: "Libyan and Libyan Jewish",
    category: "seafood",
    tags: ["fish", "tomato", "chili", "garlic"],
    diet_tags: ["gluten-free", "dairy-free"],
    prep_time_minutes: 20,
    cook_time_minutes: 30,
    difficulty: "easy",
    default_servings: 4,
    story:
      "Hraime is a Libyan fish dish with a loud, generous sauce: tomato, garlic, paprika, cumin, caraway, lemon, and chili. The fish is simmered just until tender so the sauce stays bright and powerful.",
    occasion: "Best for Friday night dinners, seafood lunches, and quick spicy mains.",
    best_served_with: "Bread, couscous, rice, lemon, and chopped cilantro.",
    regional_variations:
      "Libyan Jewish versions often emphasize caraway and chili, while nearby North African versions may add more tomato, coriander, or preserved lemon.",
    calories: 360,
    protein_g: 42,
    carbs_g: 12,
    fat_g: 16,
    fiber_g: 4,
    review_summary:
      "Sources agree on firm fish simmered in a tomato-chili sauce with garlic, cumin, paprika, and caraway. This recipe blooms the spices first for depth.",
    recommended_changes: [
      "Use firm fish so it holds in the sauce.",
      "Simmer gently after adding fish to avoid breaking the pieces."
    ],
    sources: [
      source("Parts Unknown - Libyan Chraime", "https://explorepartsunknown.com/libya/recipe-chraime/", ["Libyan fish", "tomato chili sauce", "spices"]),
      source("Jewish Food Society - Chraime", "https://www.jewishfoodsociety.org/recipes/chraime-fish-and-peppers-stewed-in-spiced-tomato-sauce", ["fish simmering", "garlic", "caraway"]),
      source("Wikipedia - Chraime", "https://en.wikipedia.org/wiki/Chraime", ["North African Jewish fish dish", "Libyan context"])
    ],
    ingredients: [
      ingredient("Fish", 800, "g", "firm white fish", "cut into portions"),
      ingredient("Sauce", 3, "tbsp", "olive oil"),
      ingredient("Sauce", 6, "cloves", "garlic", "sliced"),
      ingredient("Sauce", 3, "tbsp", "tomato paste"),
      ingredient("Sauce", 1.5, "cups", "crushed tomatoes"),
      ingredient("Spices", 2, "tsp", "paprika"),
      ingredient("Spices", 1, "tsp", "ground cumin"),
      ingredient("Spices", 1, "tsp", "ground caraway"),
      ingredient("Spices", 0.5, "tsp", "cayenne"),
      ingredient("Finishing", 1, "whole", "lemon", "juiced"),
      ingredient("Finishing", 0.25, "cup", "cilantro", "chopped")
    ],
    steps: [
      step("Bloom spices", "Cook garlic in oil, then add tomato paste, paprika, cumin, caraway, cayenne, and salt.", 6, "spice base"),
      step("Make the sauce", "Add crushed tomatoes and water, then simmer until the sauce thickens and smells sweet.", 14, "sauce"),
      step("Simmer fish", "Nestle fish into the sauce, cover, and simmer gently until just cooked.", 10, "fish"),
      step("Finish bright", "Add lemon juice and cilantro, then rest briefly before serving.", 3, "finish")
    ]
  }),
  recipe({
    slug: "maakouda-ma",
    name: "Maakouda",
    description:
      "Moroccan potato cakes seasoned with herbs, cumin, turmeric, garlic, and egg, then fried until crisp.",
    country_code: "MA",
    country_name: "Morocco",
    ethnic_group: "Moroccan",
    category: "street-food",
    tags: ["potato", "fried", "street food", "sandwich"],
    diet_tags: ["vegetarian", "gluten-free"],
    prep_time_minutes: 25,
    cook_time_minutes: 35,
    difficulty: "easy",
    default_servings: 6,
    story:
      "Maakouda is the potato cake that appears in Moroccan homes, markets, and sandwich stalls. Mashed potato is seasoned with herbs and spices, shaped, and fried until the outside turns crisp.",
    occasion: "Best for street-food sandwiches, iftar spreads, and snack plates.",
    best_served_with: "Harissa, olives, khobz, salad, or grilled meats.",
    regional_variations:
      "Some cooks dredge in flour, others keep it gluten-free. Garlic, turmeric, cumin, parsley, cilantro, and chili vary by home.",
    calories: 260,
    protein_g: 7,
    carbs_g: 34,
    fat_g: 11,
    fiber_g: 4,
    review_summary:
      "Sources agree on mashed potato cakes with herbs, cumin, turmeric, garlic, and egg. The recipe chills the mixture briefly to help the cakes hold.",
    recommended_changes: [
      "Use floury potatoes and mash them dry.",
      "Chill before frying if the mixture feels loose."
    ],
    sources: [
      source("Africanian - Moroccan Maakouda", "https://africanian.com/travel/food-and-drink/moroccan-maakouda-potato-cakes/", ["potato cakes", "Moroccan street food", "seasoning"]),
      source("Wikipedia - Ma'quda", "https://en.wikipedia.org/wiki/Ma%27quda", ["potato fritters", "street stalls", "sandwiches"]),
      source("TasteAtlas - Maakouda", "https://www.tasteatlas.com/maakouda", ["dish identity", "Moroccan context"])
    ],
    ingredients: [
      ingredient("Potatoes", 1, "kg", "potatoes", "peeled and quartered"),
      ingredient("Mixture", 2, "whole", "eggs"),
      ingredient("Mixture", 0.5, "cup", "parsley and cilantro", "chopped"),
      ingredient("Mixture", 3, "cloves", "garlic", "minced"),
      ingredient("Spices", 1, "tsp", "cumin"),
      ingredient("Spices", 0.5, "tsp", "turmeric"),
      ingredient("Coating", 0.5, "cup", "flour or rice flour"),
      ingredient("Frying", 2, "cups", "oil")
    ],
    steps: [
      step("Cook potatoes", "Boil potatoes in salted water until tender, then drain very well.", 20, "boil"),
      step("Season and mash", "Mash potatoes with eggs, herbs, garlic, cumin, turmeric, salt, and pepper.", 8, "mash"),
      step("Shape cakes", "Shape into small patties and dust lightly with flour if needed.", 12, "shape"),
      step("Fry crisp", "Fry in hot oil until both sides are golden and crisp.", 10, "fry")
    ]
  }),
  recipe({
    slug: "chebakia-ma",
    name: "Chebakia",
    description:
      "Moroccan sesame, almond, honey, and orange blossom pastries folded into flowers and fried for Ramadan.",
    country_code: "MA",
    country_name: "Morocco",
    ethnic_group: "Moroccan",
    category: "dessert",
    tags: ["ramadan", "sesame", "honey", "pastry"],
    diet_tags: ["vegetarian"],
    prep_time_minutes: 90,
    cook_time_minutes: 45,
    difficulty: "hard",
    default_servings: 20,
    story:
      "Chebakia is Morocco's Ramadan pastry jewel. Toasted sesame, almonds, spices, orange blossom water, and honey become folded flower pastries that are fried, soaked, and sprinkled with sesame.",
    occasion: "Best for Ramadan iftar, Eid trays, and tea tables.",
    best_served_with: "Harira, mint tea, dates, or sellou.",
    regional_variations:
      "Shapes and spice blends vary, but sesame, honey, orange blossom water, cinnamon, anise, and mastic are common markers.",
    calories: 180,
    protein_g: 3,
    carbs_g: 22,
    fat_g: 9,
    fiber_g: 2,
    review_summary:
      "Sources agree on a sesame-enriched dough, flower shaping, frying, and honey soaking. This recipe keeps the batch manageable while preserving the classic flavor set.",
    recommended_changes: [
      "Toast sesame before grinding for deeper flavor.",
      "Soak pastries in warm honey so they absorb without breaking."
    ],
    sources: [
      source("Taste of Maroc - Chebakia", "https://tasteofmaroc.com/chebakia-recipe-moroccan-sesame-cookies-with-honey-mkharka/", ["sesame dough", "flower shaping", "honey soak"]),
      source("Wikipedia - Shebakia", "https://en.wikipedia.org/wiki/Shebakia", ["Moroccan Ramadan pastry", "spices", "frying"]),
      source("TasteAtlas - Chebakia", "https://www.tasteatlas.com/chebakia", ["dish identity", "Ramadan context"])
    ],
    ingredients: [
      ingredient("Dough", 4, "cups", "all-purpose flour"),
      ingredient("Dough", 1, "cup", "toasted sesame seeds", "ground"),
      ingredient("Dough", 0.5, "cup", "almonds", "ground"),
      ingredient("Dough", 1, "tsp", "cinnamon"),
      ingredient("Dough", 1, "tsp", "anise seed", "ground"),
      ingredient("Dough", 0.5, "cup", "melted butter"),
      ingredient("Dough", 0.5, "cup", "orange blossom water"),
      ingredient("Dough", 1, "whole", "egg"),
      ingredient("Frying", 4, "cups", "oil"),
      ingredient("Honey", 3, "cups", "honey", "warmed"),
      ingredient("Finish", 0.25, "cup", "sesame seeds")
    ],
    steps: [
      step("Make the dough", "Mix flour, ground sesame, almonds, spices, butter, egg, and orange blossom water into a firm dough.", 18, "dough"),
      step("Rest and roll", "Rest the dough, then roll thin and cut into rectangles for folding.", 30, "rest"),
      step("Shape flowers", "Slit and fold each rectangle into a chebakia flower shape.", 35, "shape"),
      step("Fry and honey", "Fry until deep golden, soak in warm honey, and sprinkle with sesame.", 25, "fry")
    ]
  }),
  recipe({
    slug: "sardine-kefta-tagine-ma",
    name: "Sardine Kefta Tagine",
    description:
      "Moroccan sardine meatballs simmered in tomato, chermoula, olives, lemon, and peppers.",
    country_code: "MA",
    country_name: "Morocco",
    ethnic_group: "Moroccan coastal",
    category: "seafood",
    tags: ["sardines", "tagine", "chermoula", "tomato"],
    diet_tags: ["gluten-free", "dairy-free"],
    prep_time_minutes: 35,
    cook_time_minutes: 35,
    difficulty: "medium",
    default_servings: 5,
    story:
      "Sardine kefta tagine is coastal Moroccan cooking at its smartest. Sardines are chopped with herbs and spices, shaped into small balls, and simmered in tomato chermoula sauce until tender.",
    occasion: "Best for seafood lunches, Friday meals, and bread-and-salad tables.",
    best_served_with: "Khobz, taktouka, olives, and preserved lemon.",
    regional_variations:
      "Some versions add rice to the kefta, while others keep the fish pure. Potatoes, peppers, olives, and preserved lemon can be added to the sauce.",
    calories: 390,
    protein_g: 36,
    carbs_g: 18,
    fat_g: 20,
    fiber_g: 5,
    review_summary:
      "Sources agree on sardine balls seasoned with chermoula and simmered in tomato sauce. This recipe uses a little rice flour only if the mixture needs binding.",
    recommended_changes: [
      "Chill the sardine mixture before shaping.",
      "Simmer gently so the fish balls stay intact."
    ],
    sources: [
      source("Taste of Maroc - Moroccan Sardine Balls", "https://tasteofmaroc.com/moroccan-sardine-fish-balls-in-tomato-sauce/", ["sardine kefta", "tomato sauce", "chermoula"]),
      source("TasteAtlas - Sardine Kefta", "https://www.tasteatlas.com/sardine-kefta", ["Moroccan dish identity", "sardines", "kefta"]),
      source("Morocco Tourism Info - Sardine Balls", "https://www.infostourismemaroc.com/en/moroccan-cuisine/sardine-balls", ["tagine context", "sauce", "serving"])
    ],
    ingredients: [
      ingredient("Kefta", 800, "g", "fresh sardine fillets", "skinned and chopped"),
      ingredient("Kefta", 0.5, "cup", "cilantro and parsley", "chopped"),
      ingredient("Kefta", 3, "cloves", "garlic", "minced"),
      ingredient("Kefta", 1, "tsp", "cumin"),
      ingredient("Kefta", 1, "tsp", "paprika"),
      ingredient("Kefta", 1, "tbsp", "lemon juice"),
      ingredient("Sauce", 3, "cups", "grated tomatoes"),
      ingredient("Sauce", 2, "tbsp", "olive oil"),
      ingredient("Sauce", 1, "whole", "green pepper", "sliced"),
      ingredient("Sauce", 0.5, "cup", "green olives"),
      ingredient("Sauce", 0.25, "whole", "preserved lemon", "sliced")
    ],
    steps: [
      step("Mix sardine kefta", "Combine chopped sardines, herbs, garlic, cumin, paprika, lemon, salt, and pepper.", 12, "mix"),
      step("Shape balls", "Shape into small balls and chill while the sauce starts.", 15, "shape"),
      step("Simmer tomato sauce", "Cook tomatoes, olive oil, pepper, olives, and preserved lemon until saucy.", 15, "sauce"),
      step("Cook the kefta", "Nestle sardine balls into the sauce and simmer gently until cooked through.", 15, "simmer")
    ]
  }),
  recipe({
    slug: "lamb-tagine-prunes-almonds-ma",
    name: "Lamb Tagine with Prunes and Almonds",
    description:
      "Moroccan lamb tagine with ginger, saffron, cinnamon, honeyed prunes, toasted almonds, and sesame.",
    country_code: "MA",
    country_name: "Morocco",
    ethnic_group: "Moroccan",
    category: "main",
    tags: ["lamb", "tagine", "prunes", "celebration"],
    diet_tags: ["dairy-free"],
    prep_time_minutes: 25,
    cook_time_minutes: 120,
    difficulty: "medium",
    default_servings: 6,
    story:
      "Lamb with prunes and almonds is one of Morocco's great sweet-savory celebration tagines. Slow-cooked meat, ginger, saffron, cinnamon, and onions meet glossy honeyed prunes and crunchy almonds.",
    occasion: "Best for weddings, Eid, guest lunches, and special family meals.",
    best_served_with: "Khobz, couscous, Moroccan salads, or mint tea.",
    regional_variations:
      "Some cooks use beef instead of lamb, add apricots, or garnish with boiled eggs and sesame.",
    calories: 620,
    protein_g: 39,
    carbs_g: 42,
    fat_g: 35,
    fiber_g: 6,
    review_summary:
      "Sources agree on lamb or beef braised with ginger, saffron, cinnamon, and onions, then topped with prunes cooked in honey and cinnamon plus almonds. This version separates the prune glaze for better texture.",
    recommended_changes: [
      "Cook the meat until spoon-tender before reducing the sauce.",
      "Simmer prunes separately so they stay glossy, not broken."
    ],
    sources: [
      source("MarocMama - Beef Tajine with Prunes", "https://marocmama.com/beef-tajine-with-prunes/", ["lamb or beef", "prunes", "almonds", "spices"]),
      source("My Moroccan Food - Lamb Tagine with Prunes", "https://www.mymoroccanfood.com/home/lamb-tagine-with-prunes", ["Moroccan sweet savory meat", "honeyed dried fruit", "spices"]),
      source("TasteAtlas - Tagine Mrouzia", "https://www.tasteatlas.com/mrouzia", ["Moroccan celebration tagine", "sweet savory context"])
    ],
    ingredients: [
      ingredient("Tagine", 1.2, "kg", "lamb shoulder", "cut into large pieces"),
      ingredient("Tagine", 3, "tbsp", "olive oil"),
      ingredient("Tagine", 2, "large", "onions", "sliced"),
      ingredient("Spices", 2, "tsp", "ginger"),
      ingredient("Spices", 1, "tsp", "turmeric"),
      ingredient("Spices", 0.5, "tsp", "cinnamon"),
      ingredient("Spices", 0.25, "tsp", "saffron threads", "soaked"),
      ingredient("Prunes", 350, "g", "pitted prunes"),
      ingredient("Prunes", 2, "tbsp", "honey"),
      ingredient("Prunes", 1, "tsp", "cinnamon"),
      ingredient("Garnish", 0.5, "cup", "blanched almonds", "fried or toasted"),
      ingredient("Garnish", 2, "tbsp", "sesame seeds")
    ],
    steps: [
      step("Start the tagine", "Brown lamb with oil, onions, ginger, turmeric, cinnamon, saffron, salt, and pepper.", 15, "brown"),
      step("Braise slowly", "Add water, cover, and cook gently until the lamb is very tender.", 95, "braise"),
      step("Glaze the prunes", "Simmer prunes with a ladle of sauce, honey, and cinnamon until glossy.", 15, "prunes"),
      step("Finish and garnish", "Reduce the meat sauce, then top with prunes, almonds, sesame, and a little syrup.", 8, "finish")
    ]
  }),
  recipe({
    slug: "gurasa-sd",
    name: "Gurasa",
    description:
      "Sudanese soft wheat flatbread cooked on a griddle and served with stews, mullah, or spiced meat.",
    country_code: "SD",
    country_name: "Sudan",
    ethnic_group: "Sudanese",
    category: "bread",
    tags: ["flatbread", "wheat", "griddle", "stew side"],
    diet_tags: ["vegan", "dairy-free"],
    prep_time_minutes: 45,
    cook_time_minutes: 25,
    difficulty: "medium",
    default_servings: 8,
    story:
      "Gurasa is a soft Sudanese griddle bread, thicker and more tender than many flatbreads. It is built to catch stews, sauces, and meat juices, especially mullah and shaiyah.",
    occasion: "Best for lunch platters, stew meals, and communal tables.",
    best_served_with: "Mullah ahmar, mullah rob, shaiyah, lentil stew, or peanut sauce.",
    regional_variations:
      "Some versions are plain flour and water, while others add a little yeast or oil for softness.",
    calories: 240,
    protein_g: 7,
    carbs_g: 46,
    fat_g: 3,
    fiber_g: 2,
    review_summary:
      "Sources identify gurasa as a Sudanese griddle bread eaten with mullah and stews. The AfroKitchen version uses a brief yeast rest for reliable softness.",
    recommended_changes: [
      "Keep the batter thicker than pancake batter.",
      "Cover after cooking so the breads stay soft."
    ],
    sources: [
      source("TasteAtlas - Gurasa", "https://www.tasteatlas.com/gurasa", ["Sudanese flatbread", "serving context"]),
      source("Global Table Adventure - Gorraasa", "https://globaltableadventure.com/recipe/recipe-sudanese-flatbread-gorraasa/", ["flatbread method", "griddle cooking"]),
      source("Wikipedia - Sudanese cuisine", "https://en.wikipedia.org/wiki/Sudanese_cuisine", ["Sudanese bread and stew context"])
    ],
    ingredients: [
      ingredient("Batter", 3, "cups", "all-purpose flour"),
      ingredient("Batter", 2.25, "cups", "warm water"),
      ingredient("Batter", 1, "tsp", "instant yeast"),
      ingredient("Batter", 1, "tsp", "salt"),
      ingredient("Batter", 1, "tbsp", "oil"),
      ingredient("Cooking", 1, "tbsp", "oil", "for the pan")
    ],
    steps: [
      step("Mix batter", "Whisk flour, yeast, salt, oil, and warm water into a thick smooth batter.", 8, "mix"),
      step("Rest", "Cover and let the batter stand until slightly bubbly and relaxed.", 35, "rest"),
      step("Cook on griddle", "Pour onto an oiled griddle and spread into thick rounds, cooking until set and lightly browned.", 18, "griddle"),
      step("Keep soft", "Stack under a towel so the breads steam and stay tender.", 5, "steam")
    ]
  }),
  recipe({
    slug: "mullah-ahmar-tagalia-sd",
    name: "Mullah Ahmar Tagalia",
    description:
      "Sudanese red meat stew thickened with dried okra powder and seasoned with onion, tomato, garlic, and spices.",
    country_code: "SD",
    country_name: "Sudan",
    ethnic_group: "Sudanese",
    category: "stew",
    tags: ["okra", "meat", "stew", "kisra"],
    diet_tags: ["gluten-free", "dairy-free"],
    prep_time_minutes: 20,
    cook_time_minutes: 80,
    difficulty: "medium",
    default_servings: 6,
    story:
      "Mullah ahmar tagalia is a Sudanese red stew built around meat, tomato, onion, and powdered dried okra. The okra powder thickens the sauce into the texture that makes kisra or gurasa essential.",
    occasion: "Best for family lunch, Eid leftovers, and stew-and-bread meals.",
    best_served_with: "Kisra, gurasa, rice, or asida.",
    regional_variations:
      "Dried okra powder may be called waika, and the stew can be red with tomato or pale and yogurt-based in other mullah styles.",
    calories: 410,
    protein_g: 31,
    carbs_g: 18,
    fat_g: 24,
    fiber_g: 7,
    review_summary:
      "Sources agree that mullah tagalia uses dried okra powder to thicken a Sudanese meat stew. This version adds the powder near the end to prevent scorching and stringiness.",
    recommended_changes: [
      "Whisk dried okra powder with a little cool broth before adding.",
      "Simmer gently after thickening because the stew can catch."
    ],
    sources: [
      source("TasteAtlas - Mullah", "https://www.tasteatlas.com/mullah", ["Sudanese stew identity", "okra thickening", "serving"]),
      source("Sudanow - Sudanese Cuisine", "https://sudanow-magazine.net/pageArch.php?archYear=2018&archMonth=9&Id=559", ["Sudanese food context", "mullah", "kisra"]),
      source("Wikipedia - Sudanese cuisine", "https://en.wikipedia.org/wiki/Sudanese_cuisine", ["mullah and kisra context"])
    ],
    ingredients: [
      ingredient("Stew", 800, "g", "beef or lamb", "cubed"),
      ingredient("Stew", 2, "tbsp", "oil"),
      ingredient("Stew", 2, "large", "onions", "chopped"),
      ingredient("Stew", 3, "cloves", "garlic", "minced"),
      ingredient("Stew", 3, "medium", "tomatoes", "chopped"),
      ingredient("Stew", 2, "tbsp", "tomato paste"),
      ingredient("Spices", 1, "tsp", "coriander"),
      ingredient("Spices", 1, "tsp", "cumin"),
      ingredient("Thickener", 0.5, "cup", "dried okra powder"),
      ingredient("Liquid", 5, "cups", "water or stock")
    ],
    steps: [
      step("Brown meat", "Brown meat with oil and onions until the onions soften and the meat starts to color.", 12, "brown"),
      step("Simmer red base", "Add garlic, tomatoes, tomato paste, spices, salt, and water, then simmer until meat is tender.", 55, "simmer"),
      step("Thicken with okra", "Whisk dried okra powder with cool broth and stir it into the pot.", 8, "thicken"),
      step("Finish slowly", "Simmer gently until the stew thickens and tastes rounded.", 10, "finish")
    ]
  }),
  recipe({
    slug: "shaiyah-sd",
    name: "Shaiyah",
    description:
      "Sudanese fried lamb or beef cooked with onion, garlic, tomato, cumin, coriander, and lemon.",
    country_code: "SD",
    country_name: "Sudan",
    ethnic_group: "Sudanese",
    category: "main",
    tags: ["lamb", "fried meat", "spiced", "lemon"],
    diet_tags: ["gluten-free", "dairy-free"],
    prep_time_minutes: 15,
    cook_time_minutes: 40,
    difficulty: "easy",
    default_servings: 5,
    story:
      "Shaiyah is Sudanese pan-fried meat, often made with lamb, cooked until browned and savory with onion, garlic, tomato, cumin, coriander, and lemon. It is direct, generous, and made for bread.",
    occasion: "Best for Eid meat, quick lunch platters, and shared family trays.",
    best_served_with: "Gurasa, kisra, salad, chili, or rice.",
    regional_variations:
      "Some versions are dry-fried with very little tomato, while others add tomato and a splash of water to make a light sauce.",
    calories: 480,
    protein_g: 36,
    carbs_g: 10,
    fat_g: 33,
    fiber_g: 2,
    review_summary:
      "Sources agree on Sudanese fried or sauteed meat with onion and spices. This version browns first, then steams briefly to tenderize before reducing dry.",
    recommended_changes: [
      "Use small cubes so the meat tenderizes fast.",
      "Reduce until the oil separates for the proper fried finish."
    ],
    sources: [
      source("TasteAtlas - Shaiyah", "https://www.tasteatlas.com/shaiyah", ["Sudanese fried meat", "dish identity"]),
      source("RecipeWanted - Sudanese Shaiyah", "https://recipewanted.com/recipe/sudanese-shaiyah/", ["meat", "onion", "spices", "method"]),
      source("Wikipedia - Sudanese cuisine", "https://en.wikipedia.org/wiki/Sudanese_cuisine", ["Sudanese meat dish context"])
    ],
    ingredients: [
      ingredient("Meat", 900, "g", "lamb or beef", "small cubes"),
      ingredient("Meat", 3, "tbsp", "oil"),
      ingredient("Aromatics", 2, "large", "onions", "sliced"),
      ingredient("Aromatics", 3, "cloves", "garlic", "minced"),
      ingredient("Aromatics", 2, "medium", "tomatoes", "chopped"),
      ingredient("Spices", 1.5, "tsp", "ground coriander"),
      ingredient("Spices", 1, "tsp", "cumin"),
      ingredient("Spices", 0.5, "tsp", "black pepper"),
      ingredient("Finishing", 1, "whole", "lemon", "juiced")
    ],
    steps: [
      step("Brown meat", "Fry meat in oil over medium-high heat until browned on several sides.", 12, "brown"),
      step("Cook aromatics", "Add onions and cook until golden, then stir in garlic, tomatoes, spices, and salt.", 10, "aromatics"),
      step("Tenderize", "Add a small splash of water, cover, and cook until the meat is tender.", 15, "steam"),
      step("Fry dry", "Uncover and cook until the liquid reduces and the meat fries in its oil. Finish with lemon.", 8, "finish")
    ]
  }),
  recipe({
    slug: "agashe-sd",
    name: "Agashe",
    description:
      "Sudanese skewered beef rubbed with peanut, chili, ginger, garlic, and warm spices, then grilled over high heat.",
    country_code: "SD",
    country_name: "Sudan",
    ethnic_group: "Sudanese",
    category: "street-food",
    tags: ["beef", "skewers", "peanut", "grilled"],
    diet_tags: ["gluten-free", "dairy-free"],
    prep_time_minutes: 35,
    cook_time_minutes: 12,
    difficulty: "easy",
    default_servings: 5,
    story:
      "Agashe is Sudan's peanut-spiced grilled meat, kin to the wider Sahelian suya family but with its own street-side Sudanese character. Thin beef is rubbed with peanut powder, chili, ginger, and garlic before a fast grill.",
    occasion: "Best for street-food nights, cookouts, and party skewers.",
    best_served_with: "Onion, tomato, lime, flatbread, salad, and chili powder.",
    regional_variations:
      "Some cooks use lamb or chicken, but beef skewers with peanut spice are the common street-food image.",
    calories: 390,
    protein_g: 38,
    carbs_g: 9,
    fat_g: 23,
    fiber_g: 3,
    review_summary:
      "Sources describe agashe as Sudanese spiced grilled meat with a peanut-heavy rub. This version uses thin slices and a short grill to avoid drying the meat.",
    recommended_changes: [
      "Slice the beef thin across the grain.",
      "Oil the skewers lightly so the peanut rub grills instead of burning."
    ],
    sources: [
      source("TasteAtlas - Agashe", "https://www.tasteatlas.com/agashe", ["Sudanese skewers", "peanut spice", "street food"]),
      source("I've Been Cooking - Agashe", "https://ivebeen.cooking/recipes/agashe", ["Sudanese skewer method", "peanut spice", "serving"]),
      source("Wikipedia - Sudanese cuisine", "https://en.wikipedia.org/wiki/Sudanese_cuisine", ["Sudanese cuisine context"])
    ],
    ingredients: [
      ingredient("Meat", 800, "g", "beef sirloin", "thinly sliced"),
      ingredient("Rub", 0.75, "cup", "roasted peanut powder"),
      ingredient("Rub", 1, "tbsp", "paprika"),
      ingredient("Rub", 1, "tsp", "cayenne"),
      ingredient("Rub", 1, "tsp", "ground ginger"),
      ingredient("Rub", 1, "tsp", "garlic powder"),
      ingredient("Rub", 1, "tsp", "cumin"),
      ingredient("Rub", 1, "tsp", "salt"),
      ingredient("Cooking", 2, "tbsp", "oil"),
      ingredient("Serving", 1, "large", "onion", "sliced")
    ],
    steps: [
      step("Make the rub", "Mix peanut powder, paprika, cayenne, ginger, garlic, cumin, and salt.", 5, "rub"),
      step("Coat beef", "Thread beef onto skewers and coat with oil and peanut spice.", 20, "season"),
      step("Grill hot", "Grill over high heat, turning once or twice, until browned and just cooked.", 8, "grill"),
      step("Rest and serve", "Rest briefly and serve with onion, tomato, lime, and extra spice.", 4, "rest")
    ]
  }),
  recipe({
    slug: "mloukhia-tn",
    name: "Tunisian Mloukhia",
    description:
      "Tunisian slow-cooked jute leaf stew with beef, olive oil, garlic, bay, coriander, caraway, and chili.",
    country_code: "TN",
    country_name: "Tunisia",
    ethnic_group: "Tunisian",
    category: "stew",
    tags: ["jute leaf", "beef", "slow cooked", "olive oil"],
    diet_tags: ["gluten-free", "dairy-free"],
    prep_time_minutes: 20,
    cook_time_minutes: 210,
    difficulty: "medium",
    default_servings: 6,
    story:
      "Tunisian mloukhia is a patient, glossy green-black stew made from powdered jute leaf, olive oil, garlic, spices, and beef. It cooks slowly until the oil rises and the texture turns silky.",
    occasion: "Best for weekend cooking, family gatherings, and make-ahead meals.",
    best_served_with: "Crusty bread, lemon, pickled peppers, or salad mechouia.",
    regional_variations:
      "Some homes use beef, others lamb or tripe. The stew can be very spicy or warmly aromatic depending on the spice paste.",
    calories: 520,
    protein_g: 34,
    carbs_g: 14,
    fat_g: 38,
    fiber_g: 8,
    review_summary:
      "Sources agree that Tunisian mloukhia uses powdered jute leaf, a large amount of olive oil, garlic, spices, and meat with a long slow simmer. The recipe keeps the simmer low to prevent bitterness.",
    recommended_changes: [
      "Stir the powder into oil before adding water to avoid lumps.",
      "Cook low and slow until the oil separates on top."
    ],
    sources: [
      source("196 Flavors - Mloukhia", "https://www.196flavors.com/tunisia-mloukhia/", ["Tunisian jute stew", "long cooking", "beef"]),
      source("TasteAtlas - Mloukhia", "https://www.tasteatlas.com/mloukhia", ["Tunisian dish identity", "jute leaf", "serving context"]),
      source("Wikipedia - Tunisian cuisine", "https://en.wikipedia.org/wiki/Tunisian_cuisine", ["powdered jute", "olive oil", "method"])
    ],
    ingredients: [
      ingredient("Base", 0.75, "cup", "olive oil"),
      ingredient("Base", 1, "cup", "mloukhia powder"),
      ingredient("Meat", 900, "g", "beef stew meat"),
      ingredient("Aromatics", 6, "cloves", "garlic", "crushed"),
      ingredient("Aromatics", 2, "whole", "bay leaves"),
      ingredient("Spices", 2, "tsp", "ground coriander"),
      ingredient("Spices", 1, "tsp", "caraway"),
      ingredient("Spices", 1, "tbsp", "harissa"),
      ingredient("Liquid", 8, "cups", "boiling water"),
      ingredient("Finishing", 1, "whole", "lemon", "cut into wedges")
    ],
    steps: [
      step("Bloom the powder", "Whisk mloukhia powder into warm olive oil until smooth and dark.", 8, "bloom"),
      step("Add water slowly", "Whisk in boiling water gradually until the stew is smooth.", 8, "whisk"),
      step("Simmer with meat", "Add beef, garlic, bay, spices, harissa, and salt, then simmer very gently.", 180, "slow simmer"),
      step("Finish glossy", "Cook until the meat is tender and oil rises to the surface. Serve with lemon.", 15, "finish")
    ]
  }),
  recipe({
    slug: "slata-mechouia-tn",
    name: "Slata Mechouia",
    description:
      "Tunisian grilled pepper, tomato, garlic, and chili salad finished with olive oil, tuna, eggs, olives, and capers.",
    country_code: "TN",
    country_name: "Tunisia",
    ethnic_group: "Tunisian",
    category: "salad",
    tags: ["grilled peppers", "tomato", "tuna", "salad"],
    diet_tags: ["gluten-free", "dairy-free"],
    prep_time_minutes: 20,
    cook_time_minutes: 25,
    difficulty: "easy",
    default_servings: 5,
    story:
      "Slata mechouia is Tunisia's smoky grilled salad, made by charring peppers, tomatoes, garlic, and chilies, then chopping them into a bright, olive-oil-rich spread.",
    occasion: "Best for mezze, grilled fish, couscous days, and summer lunches.",
    best_served_with: "Bread, tuna, hard-boiled eggs, olives, capers, or grilled meats.",
    regional_variations:
      "Some versions are very hot with extra chilies, while others are milder and topped heavily with tuna and eggs.",
    calories: 220,
    protein_g: 11,
    carbs_g: 12,
    fat_g: 15,
    fiber_g: 5,
    review_summary:
      "Sources agree on grilled peppers, tomatoes, garlic, and chili, chopped and dressed with olive oil, often with tuna, egg, olives, and capers. This recipe chars the vegetables hard for smoky depth.",
    recommended_changes: [
      "Peel the vegetables after steaming in a covered bowl.",
      "Chop by hand instead of pureeing for a better salad texture."
    ],
    sources: [
      source("Carthage Magazine - Tunisian Grilled Salad Mechouia", "https://carthagemagazine.com/tunisian-grilled-salad-mechouia/", ["grilled peppers", "tomatoes", "regional Maghrebi salad"]),
      source("PBS Food - Tunisian Grilled Salad Slata Mechouia", "https://www.pbs.org/food/recipes/tunisian-grilled-salad-slata-mechouia", ["Tunisian grilled salad", "method", "garnish"]),
      source("TasteAtlas - Slata Mechouia", "https://www.tasteatlas.com/slata-mechouia", ["dish identity", "Tunisian salad context"])
    ],
    ingredients: [
      ingredient("Grill", 5, "large", "green peppers"),
      ingredient("Grill", 3, "medium", "tomatoes"),
      ingredient("Grill", 2, "whole", "hot chilies"),
      ingredient("Grill", 4, "cloves", "garlic", "unpeeled"),
      ingredient("Dressing", 3, "tbsp", "olive oil"),
      ingredient("Dressing", 1, "tbsp", "lemon juice"),
      ingredient("Spices", 1, "tsp", "caraway"),
      ingredient("Garnish", 1, "can", "tuna", "drained"),
      ingredient("Garnish", 2, "whole", "eggs", "hard-boiled"),
      ingredient("Garnish", 0.25, "cup", "olives and capers")
    ],
    steps: [
      step("Char vegetables", "Grill peppers, tomatoes, chilies, and garlic until blistered and smoky.", 18, "char"),
      step("Steam and peel", "Cover vegetables in a bowl, then peel and seed them once cool enough to handle.", 10, "steam"),
      step("Chop and season", "Chop vegetables by hand and dress with olive oil, lemon, caraway, salt, and pepper.", 8, "chop"),
      step("Garnish", "Top with tuna, eggs, olives, and capers before serving.", 4, "garnish")
    ]
  }),
  recipe({
    slug: "tunisian-fricassee-tn",
    name: "Tunisian Fricassee",
    description:
      "Tunisian fried sandwich rolls filled with tuna, potato, egg, olives, harissa, and preserved lemon.",
    country_code: "TN",
    country_name: "Tunisia",
    ethnic_group: "Tunisian Jewish and Tunisian",
    category: "street-food",
    tags: ["sandwich", "fried dough", "tuna", "harissa"],
    diet_tags: ["dairy-free"],
    prep_time_minutes: 55,
    cook_time_minutes: 30,
    difficulty: "medium",
    default_servings: 10,
    story:
      "Tunisian fricassee is a little fried roll with a big personality. The warm bread is slit and filled with harissa, tuna, potato, egg, olives, and preserved lemon for a street-food bite that is rich, sharp, and spicy.",
    occasion: "Best for parties, beach food, street-food spreads, and Ramadan evenings.",
    best_served_with: "Mint tea, slata mechouia, pickles, or extra harissa.",
    regional_variations:
      "Fillings vary by household, but tuna, potato, egg, olives, harissa, and preserved lemon are the common core.",
    calories: 330,
    protein_g: 13,
    carbs_g: 39,
    fat_g: 14,
    fiber_g: 3,
    review_summary:
      "Sources agree on fried yeast rolls filled with tuna, potato, egg, harissa, olives, and preserved lemon. This version makes compact rolls that fry evenly.",
    recommended_changes: [
      "Do not overproof the dough or the rolls collapse in oil.",
      "Fill while warm so the harissa spreads easily."
    ],
    sources: [
      source("196 Flavors - Fricasse", "https://www.196flavors.com/tunisia-fricasse/", ["fried rolls", "tuna filling", "harissa"]),
      source("TasteAtlas - Fricassee", "https://www.tasteatlas.com/fricassee", ["Tunisian street-food identity", "sandwich fillings"]),
      source("Wikipedia - Tunisian cuisine", "https://en.wikipedia.org/wiki/Tunisian_cuisine", ["roll method", "fillings", "serving"])
    ],
    ingredients: [
      ingredient("Dough", 3, "cups", "all-purpose flour"),
      ingredient("Dough", 1, "tbsp", "instant yeast"),
      ingredient("Dough", 1, "tsp", "sugar"),
      ingredient("Dough", 1, "tsp", "salt"),
      ingredient("Dough", 1, "cup", "warm water"),
      ingredient("Frying", 4, "cups", "oil"),
      ingredient("Filling", 2, "cans", "tuna", "drained"),
      ingredient("Filling", 3, "medium", "potatoes", "boiled and diced"),
      ingredient("Filling", 4, "whole", "eggs", "hard-boiled and sliced"),
      ingredient("Filling", 0.5, "cup", "olives", "sliced"),
      ingredient("Filling", 0.25, "cup", "harissa"),
      ingredient("Filling", 0.25, "whole", "preserved lemon", "minced")
    ],
    steps: [
      step("Make dough", "Mix flour, yeast, sugar, salt, and warm water into a soft dough.", 10, "dough"),
      step("Rise and shape", "Let rise until puffy, then shape into small oval rolls.", 45, "rise"),
      step("Fry rolls", "Fry until golden and cooked through, then drain.", 8, "fry"),
      step("Fill", "Slit rolls and fill with harissa, tuna, potato, egg, olives, and preserved lemon.", 12, "fill")
    ]
  }),
  recipe({
    slug: "fish-couscous-tn",
    name: "Tunisian Fish Couscous",
    description:
      "Tunisian couscous steamed over spicy tomato fish broth with vegetables, chickpeas, and harissa.",
    country_code: "TN",
    country_name: "Tunisia",
    ethnic_group: "Tunisian coastal",
    category: "seafood",
    tags: ["couscous", "fish", "harissa", "tomato"],
    diet_tags: ["dairy-free"],
    prep_time_minutes: 35,
    cook_time_minutes: 70,
    difficulty: "medium",
    default_servings: 6,
    story:
      "Tunisian fish couscous, often called couscous bil hout, brings the coast to the couscousier. Spicy tomato broth, vegetables, chickpeas, and firm fish season the grains as they steam.",
    occasion: "Best for Friday couscous, coastal lunches, and family gatherings.",
    best_served_with: "Extra harissa broth, lemon, olives, and salad.",
    regional_variations:
      "Fish choice changes by coast and season. Some versions include pumpkin, potatoes, carrots, turnips, or peppers.",
    calories: 560,
    protein_g: 36,
    carbs_g: 76,
    fat_g: 13,
    fiber_g: 10,
    review_summary:
      "Sources agree on couscous steamed over a spicy tomato fish broth with vegetables and harissa. The recipe adds fish late so it stays tender.",
    recommended_changes: [
      "Steam couscous twice for fluffy grains.",
      "Add fish only after the vegetables are almost done."
    ],
    sources: [
      source("196 Flavors - Tunisian Couscous", "https://www.196flavors.com/tunisia-tunisian-couscous/", ["fish couscous", "harissa", "vegetables"]),
      source("TasteAtlas - Tunisian Fish Couscous", "https://www.tasteatlas.com/couscous-bil-hout", ["Tunisian dish identity", "coastal context"]),
      source("Cuisine Tunisienne - Couscous aux poissons", "https://www.cuisinetunisienne.tn/couscous-aux-poissons/", ["method", "fish broth", "couscous"])
    ],
    ingredients: [
      ingredient("Couscous", 3, "cups", "medium couscous"),
      ingredient("Couscous", 2, "tbsp", "olive oil"),
      ingredient("Broth", 900, "g", "firm fish steaks"),
      ingredient("Broth", 1, "large", "onion", "chopped"),
      ingredient("Broth", 3, "tbsp", "tomato paste"),
      ingredient("Broth", 2, "tbsp", "harissa"),
      ingredient("Broth", 1, "cup", "cooked chickpeas"),
      ingredient("Vegetables", 3, "medium", "carrots", "halved"),
      ingredient("Vegetables", 3, "medium", "potatoes", "quartered"),
      ingredient("Vegetables", 2, "medium", "zucchini", "halved"),
      ingredient("Spices", 1, "tsp", "cumin"),
      ingredient("Spices", 1, "tsp", "paprika")
    ],
    steps: [
      step("Start broth", "Cook onion, tomato paste, harissa, spices, chickpeas, and water into a red broth.", 18, "broth"),
      step("Steam couscous", "Rub couscous with oil and steam over the broth, then fluff and steam again.", 25, "steam"),
      step("Cook vegetables", "Add carrots and potatoes to the broth, then zucchini near the end.", 25, "vegetables"),
      step("Poach fish", "Add fish steaks and simmer gently until cooked, then serve broth and fish over couscous.", 12, "fish")
    ]
  }),
  recipe({
    slug: "makroudh-tn",
    name: "Makroudh",
    description:
      "Tunisian semolina pastries filled with date paste, fried or baked, then soaked in honey syrup.",
    country_code: "TN",
    country_name: "Tunisia",
    ethnic_group: "Tunisian, especially Kairouan",
    category: "dessert",
    tags: ["semolina", "dates", "honey", "pastry"],
    diet_tags: ["vegetarian"],
    prep_time_minutes: 65,
    cook_time_minutes: 35,
    difficulty: "hard",
    default_servings: 24,
    story:
      "Makroudh is a North African date-filled semolina pastry strongly associated with Kairouan in Tunisia. The diamond-shaped pieces are fried or baked, then dipped in fragrant honey syrup.",
    occasion: "Best for Eid, weddings, tea trays, and gift boxes.",
    best_served_with: "Mint tea, coffee, or fresh fruit.",
    regional_variations:
      "Tunisia is famous for date-filled makroudh, while Algerian and Moroccan versions may vary the filling, shape, or syrup fragrance.",
    calories: 170,
    protein_g: 2,
    carbs_g: 29,
    fat_g: 6,
    fiber_g: 3,
    review_summary:
      "Sources agree on semolina dough, date filling, diamond cuts, and honey syrup. This version rests the semolina after adding fat so it hydrates before shaping.",
    recommended_changes: [
      "Let semolina absorb the oil before adding liquid.",
      "Dip warm pastries into warm honey syrup."
    ],
    sources: [
      source("196 Flavors - Makroud", "https://www.196flavors.com/algeria-makroud/", ["Tunisian and North African makroudh", "date filling", "honey syrup"]),
      source("TasteAtlas - Makroudh", "https://www.tasteatlas.com/makroudh", ["Kairouan association", "semolina pastry"]),
      source("Wikipedia - Makroudh", "https://en.wikipedia.org/wiki/Makroudh", ["method", "dates", "semolina dough"])
    ],
    ingredients: [
      ingredient("Dough", 3, "cups", "medium semolina"),
      ingredient("Dough", 0.75, "cup", "olive oil or melted butter"),
      ingredient("Dough", 0.5, "cup", "warm water"),
      ingredient("Dough", 2, "tbsp", "orange blossom water"),
      ingredient("Filling", 500, "g", "date paste"),
      ingredient("Filling", 1, "tsp", "cinnamon"),
      ingredient("Filling", 1, "tbsp", "oil"),
      ingredient("Frying", 4, "cups", "oil"),
      ingredient("Syrup", 2, "cups", "honey"),
      ingredient("Syrup", 1, "tbsp", "orange blossom water")
    ],
    steps: [
      step("Hydrate semolina", "Rub semolina with oil or butter and rest so the grains absorb the fat.", 30, "hydrate"),
      step("Make dough and filling", "Add warm water and orange blossom water to form dough, then season date paste with cinnamon and oil.", 15, "mix"),
      step("Shape diamonds", "Enclose date paste in ropes of dough, flatten, mark, and cut into diamonds.", 25, "shape"),
      step("Fry and honey", "Fry until golden, then dip warm pastries in honey scented with orange blossom water.", 18, "fry")
    ]
  }),
  recipe({
    slug: "zrig-eh",
    name: "Zrig",
    description:
      "Sahrawi milk drink whisked with water, sugar, and sometimes camel milk for a cooling desert refreshment.",
    country_code: "EH",
    country_name: "Western Sahara",
    ethnic_group: "Sahrawi",
    category: "beverage",
    tags: ["milk", "camel milk", "desert", "drink"],
    diet_tags: ["vegetarian", "gluten-free"],
    prep_time_minutes: 10,
    cook_time_minutes: 0,
    difficulty: "easy",
    default_servings: 4,
    story:
      "Zrig is a Sahrawi desert drink built for heat, hospitality, and available milk. Camel milk or cow's milk is diluted, sweetened, and chilled or frothed into a simple refreshment.",
    occasion: "Best for hot afternoons, tea gatherings, and light refreshment.",
    best_served_with: "Dates, bread, tea, or roasted barley snacks.",
    regional_variations:
      "Some families use camel milk when available, others use cow or goat milk, and sweetness changes by household.",
    calories: 120,
    protein_g: 6,
    carbs_g: 18,
    fat_g: 3,
    fiber_g: 0,
    review_summary:
      "Sources describe zrig as a Sahrawi or Mauritanian-style milk and water drink, often associated with camel milk and desert hospitality. The AfroKitchen version gives a clean home ratio with optional chilling.",
    recommended_changes: [
      "Use cold milk and water for the best texture.",
      "Adjust sugar after dilution because milk sweetness varies."
    ],
    sources: [
      source("TasteAtlas - Zrig", "https://www.tasteatlas.com/zrig", ["drink identity", "milk", "Sahrawi and Mauritanian context"]),
      source("Morocco World News - Traditional Sahrawi Recipes", "https://www.moroccoworldnews.com/2022/04/47290/moroccan-cuisine-traditional-sahrawi-recipes-for-ramadan/", ["Sahrawi food context", "milk and tea hospitality"]),
      source("Wikipedia - Sahrawi cuisine", "https://en.wikipedia.org/wiki/Sahrawi_cuisine", ["Sahrawi cuisine context", "camel milk"])
    ],
    ingredients: [
      ingredient("Drink", 2, "cups", "camel milk or whole milk", "well chilled"),
      ingredient("Drink", 1.5, "cups", "cold water"),
      ingredient("Drink", 2, "tbsp", "sugar"),
      ingredient("Drink", 0.25, "tsp", "salt", "optional"),
      ingredient("Serving", 1, "cup", "ice", "optional")
    ],
    steps: [
      step("Mix milk and water", "Whisk cold milk with cold water until lightly frothy.", 3, "whisk"),
      step("Sweeten", "Add sugar and a tiny pinch of salt, then whisk until dissolved.", 3, "sweeten"),
      step("Chill", "Chill or pour over ice if serving immediately.", 5, "chill"),
      step("Serve fresh", "Stir again and serve cold with dates or tea snacks.", 1, "serve")
    ]
  }),
  recipe({
    slug: "boulaghmane-eh",
    name: "Boulaghmane",
    description:
      "Sahrawi roasted barley flour mixed with hot water, oil or butter, sugar, and milk into a quick desert porridge.",
    country_code: "EH",
    country_name: "Western Sahara",
    ethnic_group: "Sahrawi",
    category: "breakfast",
    tags: ["barley", "porridge", "desert", "quick meal"],
    diet_tags: ["vegetarian"],
    prep_time_minutes: 10,
    cook_time_minutes: 8,
    difficulty: "easy",
    default_servings: 4,
    story:
      "Boulaghmane is Sahrawi speed and comfort: roasted barley flour stirred with hot water, fat, sugar, and milk into a nourishing bowl. It belongs to desert kitchens where portable grains matter.",
    occasion: "Best for breakfast, travel food, quick suppers, and tea-time nourishment.",
    best_served_with: "Zrig, mint tea, dates, or extra milk.",
    regional_variations:
      "Some versions are drier like a barley crumble, while others are looser with more milk or water.",
    calories: 310,
    protein_g: 8,
    carbs_g: 52,
    fat_g: 9,
    fiber_g: 8,
    review_summary:
      "Sources connect boulaghmane to Sahrawi roasted barley flour preparations. This recipe treats it as a quick porridge with optional milk for a practical home result.",
    recommended_changes: [
      "Toast plain barley flour first if roasted flour is unavailable.",
      "Add water gradually because roasted flours absorb differently."
    ],
    sources: [
      source("TasteAtlas - Boulaghmane", "https://www.tasteatlas.com/boulaghmane", ["Sahrawi dish identity", "roasted barley", "porridge"]),
      source("Wikipedia - Boulaghmane", "https://en.wikipedia.org/wiki/Boulaghmane", ["Sahrawi pantry context", "desert food", "barley flour"]),
      source("Wikipedia - Western Saharan cuisine", "https://en.wikipedia.org/wiki/Western_Saharan_cuisine", ["Sahrawi cuisine context", "grain and milk"])
    ],
    ingredients: [
      ingredient("Porridge", 2, "cups", "roasted barley flour"),
      ingredient("Porridge", 2.5, "cups", "hot water"),
      ingredient("Porridge", 2, "tbsp", "butter or oil"),
      ingredient("Porridge", 3, "tbsp", "sugar"),
      ingredient("Porridge", 0.5, "tsp", "salt"),
      ingredient("Finishing", 1, "cup", "warm milk", "optional")
    ],
    steps: [
      step("Toast if needed", "If using plain barley flour, toast it in a dry pan until nutty and lightly darker.", 5, "toast"),
      step("Hydrate", "Stir in hot water gradually until the flour becomes a thick porridge.", 4, "hydrate"),
      step("Enrich", "Mix in butter or oil, sugar, salt, and warm milk if using.", 3, "enrich"),
      step("Serve warm", "Rest briefly so the barley swells, then serve warm.", 3, "rest")
    ]
  })
];

const seen = new Set();
for (const item of recipes) {
  if (seen.has(item.slug)) throw new Error(`Duplicate slug: ${item.slug}`);
  seen.add(item.slug);
  if (item.region !== "North Africa") throw new Error(`${item.slug} is not tagged North Africa`);
  if (!Array.isArray(item.sources) || item.sources.length < 2) {
    throw new Error(`${item.slug} needs at least two sources`);
  }
  if (!item.steps.some((entry) => entry.timer_seconds > 0)) {
    throw new Error(`${item.slug} needs a timer`);
  }
}

if (recipes.length !== 30) {
  throw new Error(`Expected 30 recipes, got ${recipes.length}`);
}

const batch = {
  batch_id: "2026-05-02-north-africa-wave-1",
  reviewed_at: reviewedAt,
  notes:
    "North Africa expansion wave covering Algerian, Egyptian, Libyan, Moroccan, Sudanese, Tunisian, and Sahrawi dishes. Recipes are synthesized from multiple culinary, cultural, and household-style references, not copied from a single source. Public pages remain source-note free; source detail lives in the backstage audit only.",
  recipes
};

fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
fs.writeFileSync(OUT_PATH, `${JSON.stringify(batch, null, 2)}\n`, "utf8");
console.log(`Wrote ${recipes.length} recipes to ${path.relative(ROOT, OUT_PATH)}`);
