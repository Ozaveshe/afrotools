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
  "2026-05-02-central-southern-wave-1.json"
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
    slug: "mufete-ao",
    name: "Mufete",
    description:
      "Angolan grilled fish platter with palm-oil beans, boiled cassava, plantain, sweet potato, and onion relish.",
    country_code: "AO",
    country_name: "Angola",
    region: "Central Africa",
    ethnic_group: "Angolan coastal",
    category: "seafood",
    tags: ["fish", "beans", "plantain", "cassava"],
    diet_tags: ["gluten-free", "dairy-free"],
    prep_time_minutes: 35,
    cook_time_minutes: 65,
    difficulty: "medium",
    default_servings: 5,
    story:
      "Mufete is one of Angola's great coastal plates: grilled whole fish, palm-oil beans, boiled roots, plantain, and a sharp onion-tomato relish arranged as a generous platter rather than a single stew.",
    occasion: "Best for weekend grilling, beach-style lunches, and big family plates.",
    best_served_with: "Farofa, extra chili, lemon, and cold drinks.",
    regional_variations:
      "Luanda versions often feature grilled fish with feijao de oleo de palma, cassava, plantain, sweet potato, and onion relish, while river-fish versions use local catch.",
    calories: 610,
    protein_g: 44,
    carbs_g: 68,
    fat_g: 20,
    fiber_g: 14,
    review_summary:
      "Sources agree on grilled fish, beans cooked with palm oil, boiled cassava or plantain, and a raw or lightly dressed onion relish. The AfroKitchen version treats each component separately so the platter stays bright.",
    recommended_changes: [
      "Cook the beans until creamy before adding palm oil.",
      "Grill fish whole where possible for the classic presentation."
    ],
    sources: [
      source("Luanda Guide - Mufete", "https://luandaguide.com/mufete/", ["grilled fish", "palm-oil beans", "Angolan context"]),
      source("TravelsHelper - Mufete", "https://travelshelper.com/world-of-food/angolan-national-foods/mufete/", ["component platter", "cassava", "plantain", "method"]),
      source("Wikipedia - Angolan cuisine", "https://en.wikipedia.org/wiki/Angolan_cuisine", ["mufete identity", "Angolan cuisine context"])
    ],
    ingredients: [
      ingredient("Fish", 5, "whole", "tilapia, sea bream, or snapper", "cleaned and scored"),
      ingredient("Fish", 2, "tbsp", "oil"),
      ingredient("Fish", 1, "whole", "lemon", "juiced"),
      ingredient("Beans", 2, "cups", "cooked red beans"),
      ingredient("Beans", 0.33, "cup", "red palm oil"),
      ingredient("Beans", 1, "large", "onion", "sliced"),
      ingredient("Sides", 600, "g", "cassava", "peeled and cut"),
      ingredient("Sides", 3, "whole", "ripe plantains", "halved"),
      ingredient("Sides", 3, "medium", "sweet potatoes", "chunked"),
      ingredient("Relish", 2, "large", "tomatoes", "diced"),
      ingredient("Relish", 1, "large", "red onion", "thinly sliced"),
      ingredient("Relish", 1, "whole", "hot pepper", "minced")
    ],
    steps: [
      step("Season fish", "Rub fish with lemon, oil, salt, and pepper while the sides cook.", 10, "season"),
      step("Cook roots", "Boil cassava, plantain, and sweet potatoes separately until tender.", 25, "boil sides"),
      step("Make palm-oil beans", "Cook onion in palm oil, add beans and a splash of water, then simmer until glossy.", 20, "beans"),
      step("Grill and plate", "Grill fish until lightly charred and flaky, then serve with beans, roots, and relish.", 18, "grill")
    ]
  }),
  recipe({
    slug: "kizaka-ao",
    name: "Kizaka",
    description:
      "Angolan cassava leaf stew cooked with peanut, onion, garlic, tomato, and palm oil until silky.",
    country_code: "AO",
    country_name: "Angola",
    region: "Central Africa",
    ethnic_group: "Angolan",
    category: "stew",
    tags: ["cassava leaves", "peanut", "palm oil", "greens"],
    diet_tags: ["vegan", "gluten-free", "dairy-free"],
    prep_time_minutes: 25,
    cook_time_minutes: 95,
    difficulty: "medium",
    default_servings: 6,
    story:
      "Kizaka, also written kissaca or quizaca, is Angolan cassava leaf cooking at its most comforting. The greens are simmered long enough to soften fully, then enriched with peanut and palm oil.",
    occasion: "Best for funge lunches, vegetarian stews, and meal-prep greens.",
    best_served_with: "Funge, rice, grilled fish, or beans.",
    regional_variations:
      "Some households add dried fish or shrimp, while meatless versions rely on peanut, palm oil, garlic, and long cooking for depth.",
    calories: 360,
    protein_g: 13,
    carbs_g: 28,
    fat_g: 23,
    fiber_g: 11,
    review_summary:
      "Sources agree on cassava leaves cooked down with peanut or groundnut and aromatics. This version keeps the simmer long and uses frozen cassava leaves when fresh leaves are unavailable.",
    recommended_changes: [
      "Cook cassava leaves thoroughly before serving.",
      "Thin peanut butter with warm broth before stirring it in."
    ],
    sources: [
      source("FoodieAtlas - Kizaka", "https://foodieatlas.com/angola/kizaka/index.html", ["cassava leaves", "peanut", "method"]),
      source("Wikipedia - Angolan cuisine", "https://en.wikipedia.org/wiki/Angolan_cuisine", ["kissaca identity", "Angolan cuisine context"]),
      source("IITA - Traditional cassava foods in Africa", "https://biblio.iita.org/documents/U97BkHahnTraditionalNothomNodev.pdf-1e7d8331e2b05357840ef3979493a15e.pdf", ["cassava leaf context", "kizaka naming"])
    ],
    ingredients: [
      ingredient("Greens", 900, "g", "cassava leaves", "pounded or frozen chopped"),
      ingredient("Base", 2, "tbsp", "red palm oil"),
      ingredient("Base", 1, "large", "onion", "chopped"),
      ingredient("Base", 3, "cloves", "garlic", "minced"),
      ingredient("Base", 2, "medium", "tomatoes", "chopped"),
      ingredient("Peanut", 0.75, "cup", "peanut butter"),
      ingredient("Liquid", 4, "cups", "water or vegetable stock"),
      ingredient("Finishing", 1, "whole", "hot pepper", "optional")
    ],
    steps: [
      step("Start the greens", "Simmer cassava leaves with water until softened and darker.", 55, "greens"),
      step("Build the base", "Cook onion, garlic, tomatoes, and palm oil until the tomatoes collapse.", 15, "base"),
      step("Add peanut", "Whisk peanut butter with warm liquid and stir it into the greens.", 10, "peanut"),
      step("Slow finish", "Simmer until silky and thick, adding salt and pepper at the end.", 15, "finish")
    ]
  }),
  recipe({
    slug: "cabidela-de-galinha-ao",
    name: "Cabidela de Galinha",
    description:
      "Angolan-style chicken cabidela braised with vinegar, garlic, onion, bay, and a dark tangy sauce.",
    country_code: "AO",
    country_name: "Angola",
    region: "Central Africa",
    ethnic_group: "Angolan and Lusophone African",
    category: "main",
    tags: ["chicken", "vinegar", "braise", "special occasion"],
    diet_tags: ["gluten-free", "dairy-free"],
    prep_time_minutes: 25,
    cook_time_minutes: 70,
    difficulty: "hard",
    default_servings: 6,
    story:
      "Cabidela traveled through Portuguese-speaking kitchens and took local form in Angola. The key is a tangy dark sauce made with vinegar and poultry juices, cooked gently so the chicken stays tender.",
    occasion: "Best for special family meals and old-school Lusophone tables.",
    best_served_with: "White rice, funge, boiled cassava, or greens.",
    regional_variations:
      "Traditional cabidela uses fresh poultry blood preserved with vinegar. Home cooks who cannot source it safely can make a dark liver-vinegar gravy instead.",
    calories: 470,
    protein_g: 39,
    carbs_g: 12,
    fat_g: 30,
    fiber_g: 2,
    review_summary:
      "Sources agree on chicken, vinegar, onion, garlic, bay, and a dark acidic sauce. This version includes a safe liver-based option when fresh blood is not available from a trusted butcher.",
    recommended_changes: [
      "Only use fresh blood from a trusted butcher and keep it acidified with vinegar.",
      "Use the liver option when food safety or sourcing is uncertain."
    ],
    sources: [
      source("Wikipedia - Cabidela", "https://en.wikipedia.org/wiki/Cabidela", ["dish identity", "Angola context", "vinegar sauce"]),
      source("Roteiro Gastronomico - Cabidela de Galinha a Moda de Angola", "https://www.gastronomias.com/receitas/rec0223.htm", ["chicken method", "vinegar", "dark sauce"]),
      source("Wikipedia - Angolan cuisine", "https://en.wikipedia.org/wiki/Angolan_cuisine", ["Lusophone Angolan cuisine context"])
    ],
    ingredients: [
      ingredient("Chicken", 1.4, "kg", "chicken pieces", "bone-in"),
      ingredient("Marinade", 0.33, "cup", "red wine vinegar"),
      ingredient("Marinade", 5, "cloves", "garlic", "crushed"),
      ingredient("Braise", 2, "tbsp", "oil"),
      ingredient("Braise", 2, "large", "onions", "sliced"),
      ingredient("Braise", 2, "whole", "bay leaves"),
      ingredient("Sauce", 0.75, "cup", "fresh poultry blood or blended cooked chicken livers", "kept with vinegar"),
      ingredient("Sauce", 1, "cup", "chicken stock"),
      ingredient("Finishing", 0, "", "salt and pepper", "to taste")
    ],
    steps: [
      step("Marinate chicken", "Season chicken with vinegar, garlic, salt, and pepper while you prepare the pot.", 20, "marinate"),
      step("Brown and braise", "Brown chicken in oil, add onions and bay, then cover with stock and simmer until tender.", 45, "braise"),
      step("Temper the sauce", "Whisk blood or blended liver with a ladle of hot broth and vinegar so it does not scramble.", 5, "temper"),
      step("Finish gently", "Stir sauce into the pot and cook on very low heat until dark, glossy, and lightly thickened.", 8, "finish")
    ]
  }),
  recipe({
    slug: "achu-soup-cm",
    name: "Achu and Yellow Soup",
    description:
      "Cameroonian pounded cocoyam served with yellow palm-oil soup, kanwa, spices, meat, and fish.",
    country_code: "CM",
    country_name: "Cameroon",
    region: "Central Africa",
    ethnic_group: "Ngemba, Tikar, and Northwest Cameroon",
    category: "main",
    tags: ["cocoyam", "yellow soup", "palm oil", "Cameroon"],
    diet_tags: ["gluten-free", "dairy-free"],
    prep_time_minutes: 35,
    cook_time_minutes: 85,
    difficulty: "hard",
    default_servings: 6,
    story:
      "Achu is a ceremonial and everyday favorite from Cameroon's Northwest: soft pounded cocoyam eaten with a bright yellow soup made from palm oil, limestone water, spices, meat stock, and proteins.",
    occasion: "Best for Sunday meals, cultural gatherings, and serious comfort food.",
    best_served_with: "Boiled beef, tripe, cow skin, smoked fish, or hot pepper.",
    regional_variations:
      "Yellow soup spice blends vary by family, but palm oil, kanwa, meat stock, and pounded cocoyam stay central.",
    calories: 560,
    protein_g: 30,
    carbs_g: 62,
    fat_g: 22,
    fiber_g: 8,
    review_summary:
      "Sources agree on pounded cocoyam and a yellow palm-oil soup stabilized with kanwa and seasoned stock. This version keeps kanwa modest and relies on good stock.",
    recommended_changes: [
      "Use food-grade kanwa sparingly.",
      "Pound cocoyam hot so it turns smooth."
    ],
    sources: [
      source("African Bites - Achu Soup", "https://www.africanbites.com/achu-soupyellow-soup-achu/", ["yellow soup", "palm oil", "cocoyam"]),
      source("Precious Core - Achu and Yellow Soup", "https://www.preciouscore.com/2016/04/how-to-make-achu-and-yellow-soup.html", ["Cameroonian method", "pounded cocoyam", "soup"]),
      source("Wikipedia - Achu soup", "https://en.wikipedia.org/wiki/Achu_(soup)", ["dish identity", "Northwest Cameroon context"])
    ],
    ingredients: [
      ingredient("Achu", 2, "kg", "cocoyams", "scrubbed"),
      ingredient("Stock", 800, "g", "beef, tripe, or cow skin", "cooked until tender"),
      ingredient("Soup", 1, "cup", "red palm oil"),
      ingredient("Soup", 4, "cups", "hot meat stock"),
      ingredient("Soup", 0.5, "tsp", "food-grade kanwa", "dissolved in warm water"),
      ingredient("Soup", 2, "tbsp", "achu spice blend"),
      ingredient("Soup", 1, "whole", "hot pepper"),
      ingredient("Finishing", 0, "", "salt", "to taste")
    ],
    steps: [
      step("Boil cocoyam", "Boil whole cocoyams until tender, then peel while hot.", 45, "boil cocoyam"),
      step("Pound smooth", "Pound cocoyam into a smooth stretchy mound and keep warm.", 15, "pound"),
      step("Make yellow soup", "Whisk hot stock, palm oil, kanwa water, achu spices, pepper, and salt until emulsified.", 10, "soup"),
      step("Serve with proteins", "Arrange achu with meat and ladle yellow soup around it.", 5, "serve")
    ]
  }),
  recipe({
    slug: "mbongo-tchobi-cm",
    name: "Mbongo Tchobi",
    description:
      "Cameroonian Bassa black stew made with fish, burnt mbongo spice, tomato, onion, and aromatic peppers.",
    country_code: "CM",
    country_name: "Cameroon",
    region: "Central Africa",
    ethnic_group: "Bassa Cameroon",
    category: "seafood",
    tags: ["fish", "black stew", "mbongo spice", "Bassa"],
    diet_tags: ["gluten-free", "dairy-free"],
    prep_time_minutes: 25,
    cook_time_minutes: 35,
    difficulty: "medium",
    default_servings: 5,
    story:
      "Mbongo tchobi is Cameroon's famous ebony sauce, especially associated with the Bassa people. Toasted and charred spices give the stew its deep black color and earthy flavor.",
    occasion: "Best for fish dinners, Cameroonian Sunday meals, and food-story plates.",
    best_served_with: "Boiled plantain, cassava, rice, or miondo.",
    regional_variations:
      "Fish is classic, but some cooks prepare beef or pork versions. Spice blends are guarded family knowledge and vary by market.",
    calories: 390,
    protein_g: 38,
    carbs_g: 16,
    fat_g: 20,
    fiber_g: 4,
    review_summary:
      "Sources agree on fish in a dark mbongo spice sauce with tomato, onion, and aromatics. The AfroKitchen version uses prepared mbongo spice for home reliability.",
    recommended_changes: [
      "Use a reputable mbongo spice blend if you cannot toast the spices yourself.",
      "Simmer fish gently so it stays intact."
    ],
    sources: [
      source("Precious Core - Mbongo Tchobi", "https://www.preciouscore.com/mbongo-tchobi-cameroonian-black-stew/", ["black stew", "fish", "Cameroonian method"]),
      source("Afritibi - Mbongo Tchobi", "https://afritibi.com/mbongo-tchobi/", ["Bassa origin", "spice sauce", "method"]),
      source("Wikipedia - Bongo'o", "https://en.wikipedia.org/wiki/Bongo%27o", ["dish identity", "Bassa context"])
    ],
    ingredients: [
      ingredient("Fish", 900, "g", "firm fish steaks"),
      ingredient("Sauce", 3, "tbsp", "palm oil or peanut oil"),
      ingredient("Sauce", 1, "large", "onion", "blended"),
      ingredient("Sauce", 3, "medium", "tomatoes", "blended"),
      ingredient("Sauce", 3, "cloves", "garlic"),
      ingredient("Sauce", 1, "tbsp", "ginger"),
      ingredient("Spice", 3, "tbsp", "mbongo spice powder"),
      ingredient("Spice", 1, "whole", "hot pepper"),
      ingredient("Liquid", 1.5, "cups", "water or stock")
    ],
    steps: [
      step("Season fish", "Salt fish and let it sit while the sauce base starts.", 10, "season"),
      step("Cook sauce base", "Cook onion, tomato, garlic, ginger, and oil until thick.", 15, "base"),
      step("Add mbongo spice", "Stir in mbongo spice and stock, then simmer until the sauce darkens.", 10, "spice"),
      step("Poach fish", "Nestle fish into the sauce and cook gently until done.", 12, "fish")
    ]
  }),
  recipe({
    slug: "kwacoco-bible-cm",
    name: "Kwacoco Bible",
    description:
      "Cameroonian grated cocoyam steamed with greens, smoked fish, palm oil, and spices in leaf packets.",
    country_code: "CM",
    country_name: "Cameroon",
    region: "Central Africa",
    ethnic_group: "Bakweri and Southwest Cameroon",
    category: "main",
    tags: ["cocoyam", "leaf packet", "smoked fish", "palm oil"],
    diet_tags: ["gluten-free", "dairy-free"],
    prep_time_minutes: 45,
    cook_time_minutes: 80,
    difficulty: "hard",
    default_servings: 8,
    story:
      "Kwacoco Bible is Southwest Cameroonian leaf-packet cooking. Grated cocoyam is mixed with greens, smoked fish, palm oil, and spices, wrapped, and steamed until the packet sets into a savory cake.",
    occasion: "Best for family weekends, cultural tables, and make-ahead meals.",
    best_served_with: "Pepper sauce, plantain, or a light vegetable stew.",
    regional_variations:
      "Some versions use cocoyam leaves or spinach, while others add crayfish, smoked meat, or more pepper.",
    calories: 430,
    protein_g: 19,
    carbs_g: 52,
    fat_g: 17,
    fiber_g: 9,
    review_summary:
      "Sources agree on grated cocoyam mixed with greens and smoked fish, then wrapped and steamed. This version uses banana leaves or parchment plus foil when leaves are unavailable.",
    recommended_changes: [
      "Grate cocoyam finely so the packet sets.",
      "Wrap tightly to keep steam out of the mixture."
    ],
    sources: [
      source("Fork and Salt - Kwacoco Bible", "https://forkandsalt.com/recipes/cameroonian/kwacoco-bible", ["cocoyam", "greens", "steaming"]),
      source("Wikipedia - Kwacoco", "https://en.wikipedia.org/wiki/Kwacoco", ["dish identity", "Cameroon context"]),
      source("Cameroonian cuisine - Wikipedia", "https://en.wikipedia.org/wiki/Cameroonian_cuisine", ["regional food context"])
    ],
    ingredients: [
      ingredient("Base", 1.5, "kg", "cocoyam", "peeled and grated"),
      ingredient("Base", 2, "cups", "spinach or cocoyam leaves", "chopped"),
      ingredient("Base", 300, "g", "smoked fish", "flaked"),
      ingredient("Base", 0.5, "cup", "red palm oil"),
      ingredient("Seasoning", 2, "tbsp", "ground crayfish"),
      ingredient("Seasoning", 1, "whole", "hot pepper", "minced"),
      ingredient("Seasoning", 1, "tsp", "salt"),
      ingredient("Wrapping", 8, "large", "banana leaves", "softened")
    ],
    steps: [
      step("Prepare leaves", "Warm banana leaves to make them flexible and tear into wrappers.", 8, "leaves"),
      step("Mix batter", "Combine grated cocoyam, greens, fish, palm oil, crayfish, pepper, and salt.", 15, "mix"),
      step("Wrap packets", "Spoon mixture into leaves and fold tightly into parcels.", 20, "wrap"),
      step("Steam until set", "Steam packets until firm and cooked through.", 65, "steam")
    ]
  }),
  recipe({
    slug: "fumbwa-cd",
    name: "Fumbwa",
    description:
      "Congolese wild spinach stew cooked with peanut, tomato, onion, palm oil, and smoked or salted fish.",
    country_code: "CD",
    country_name: "Democratic Republic of Congo",
    region: "Central Africa",
    ethnic_group: "Congolese",
    category: "stew",
    tags: ["greens", "peanut", "smoked fish", "Congolese"],
    diet_tags: ["gluten-free", "dairy-free"],
    prep_time_minutes: 20,
    cook_time_minutes: 60,
    difficulty: "medium",
    default_servings: 6,
    story:
      "Fumbwa, also called koko in parts of Central Africa, is a leafy stew that shows how deep greens can become rich with peanuts, palm oil, tomato, onion, and smoked fish.",
    occasion: "Best for rice, kwanga, fufu, and everyday family lunch.",
    best_served_with: "Kwanga, rice, fufu, or boiled plantain.",
    regional_variations:
      "Some cooks use wild fumbwa leaves, others substitute spinach, cassava leaves, or eru. Smoked fish, salted fish, or meat may be added.",
    calories: 390,
    protein_g: 21,
    carbs_g: 24,
    fat_g: 25,
    fiber_g: 10,
    review_summary:
      "Sources agree on wild greens cooked with peanut or groundnut paste, tomato, onion, palm oil, and fish. This version balances peanut richness with enough simmer time for the greens.",
    recommended_changes: [
      "Soak salted fish before cooking.",
      "Add peanut paste after the greens have softened."
    ],
    sources: [
      source("FoodieAtlas - Fumbwa", "https://foodieatlas.com/congo/fumbwa/index.html", ["greens", "peanut", "method"]),
      source("Low Carb Africa - Fumbwa", "https://lowcarbafrica.com/fumbwa-congolese-spinach-stew-recipe/", ["Congolese spinach stew", "peanut", "fish"]),
      source("UNHCR Canada - Tastes From Home", "https://www.unhcr.ca/wp-content/uploads/2020/12/UNHCR-Canada-Cookbook-TastesFromHome-English3.pdf", ["DRC recipe context", "fumbwa"])
    ],
    ingredients: [
      ingredient("Greens", 800, "g", "fumbwa, spinach, or eru", "chopped"),
      ingredient("Fish", 250, "g", "smoked or salted fish", "soaked if salty"),
      ingredient("Base", 2, "tbsp", "red palm oil"),
      ingredient("Base", 1, "large", "onion", "chopped"),
      ingredient("Base", 2, "medium", "tomatoes", "chopped"),
      ingredient("Base", 2, "cloves", "garlic", "minced"),
      ingredient("Peanut", 0.75, "cup", "peanut butter"),
      ingredient("Liquid", 3, "cups", "water or stock"),
      ingredient("Finishing", 0, "", "salt and pepper", "to taste")
    ],
    steps: [
      step("Cook greens", "Simmer greens with water until they soften and lose their raw edge.", 25, "greens"),
      step("Make base", "Cook onion, garlic, tomatoes, and palm oil into a thick sauce.", 12, "base"),
      step("Add fish and peanut", "Add fish and peanut butter thinned with broth, then stir into the greens.", 10, "peanut"),
      step("Simmer rich", "Cook until thick, glossy, and fully seasoned.", 15, "finish")
    ]
  }),
  recipe({
    slug: "makayabu-cd",
    name: "Makayabu",
    description:
      "Congolese salted fish cooked with onion, tomato, pepper, garlic, and oil into a savory stew.",
    country_code: "CD",
    country_name: "Democratic Republic of Congo",
    region: "Central Africa",
    ethnic_group: "Congolese",
    category: "seafood",
    tags: ["salt fish", "tomato", "stew", "Congolese"],
    diet_tags: ["gluten-free", "dairy-free"],
    prep_time_minutes: 45,
    cook_time_minutes: 35,
    difficulty: "easy",
    default_servings: 5,
    story:
      "Makayabu is salted dried fish, and in Congolese kitchens it becomes a deeply savory stew once soaked, softened, and cooked with tomato, onion, garlic, chili, and oil.",
    occasion: "Best for quick lunches, rice plates, pondu sides, and pantry cooking.",
    best_served_with: "Fumbwa, pondu, rice, kwanga, or boiled plantain.",
    regional_variations:
      "Makayabu may be served fried, stewed, or folded into greens. Some cooks add peanut or palm oil, while others keep the tomato base sharp.",
    calories: 360,
    protein_g: 42,
    carbs_g: 10,
    fat_g: 17,
    fiber_g: 3,
    review_summary:
      "Sources agree that makayabu is salted fish used widely in Congolese cooking. This recipe soaks the fish first, then finishes it in a tomato-onion stew.",
    recommended_changes: [
      "Taste the soaked fish before salting the stew.",
      "Simmer gently so the fish flakes but does not dissolve."
    ],
    sources: [
      source("Congo Quotidien - Makayabu", "https://www.congoquotidien.com/2025/07/26/makayabu-poisson-sale-seche-recette-congolaise/", ["salt fish", "Congolese method", "tomato stew"]),
      source("FoodieAtlas - Makayabu", "https://foodieatlas.com/congo/makayabu/", ["dish identity", "Central African context"]),
      source("Global Ministries - Makayabu Peanut Butter Recipe", "https://www.globalministries.org/wp-content/uploads/nb/pages/15653/attachments/original/1602875616/Makayabu_Peanut_Butter_recipe_.pdf?1602875616=", ["salt fish use", "Congolese kitchen context"])
    ],
    ingredients: [
      ingredient("Fish", 600, "g", "salted dried fish", "soaked and rinsed"),
      ingredient("Base", 3, "tbsp", "oil"),
      ingredient("Base", 2, "large", "onions", "sliced"),
      ingredient("Base", 3, "medium", "tomatoes", "chopped"),
      ingredient("Base", 2, "cloves", "garlic", "minced"),
      ingredient("Base", 1, "whole", "hot pepper", "minced"),
      ingredient("Liquid", 1, "cup", "water"),
      ingredient("Finishing", 0.25, "cup", "parsley or scallions", "chopped")
    ],
    steps: [
      step("Soak fish", "Soak salted fish in warm water, changing water once, then rinse and cut into chunks.", 35, "soak"),
      step("Cook tomato base", "Cook onions, tomatoes, garlic, pepper, and oil until the tomatoes reduce.", 15, "base"),
      step("Simmer fish", "Add fish and a little water, then simmer gently until the sauce coats the pieces.", 15, "simmer"),
      step("Finish fresh", "Taste for salt, add herbs, and serve hot.", 3, "finish")
    ]
  }),
  recipe({
    slug: "ntaba-cd",
    name: "Ntaba",
    description:
      "Congolese grilled goat meat marinated with ginger, garlic, onion, lemon, chili, and warm spices.",
    country_code: "CD",
    country_name: "Democratic Republic of Congo",
    region: "Central Africa",
    ethnic_group: "Congolese",
    category: "grill",
    tags: ["goat", "grilled", "street food", "Congolese"],
    diet_tags: ["gluten-free", "dairy-free"],
    prep_time_minutes: 35,
    cook_time_minutes: 45,
    difficulty: "medium",
    default_servings: 5,
    story:
      "Ntaba means goat in Lingala, and grilled goat is one of the great social foods of Congolese bars and family gatherings. The meat needs a bold marinade and patient grilling.",
    occasion: "Best for cookouts, beer gardens, parties, and late lunch plates.",
    best_served_with: "Kachumbari-style onion salad, chili, plantain, rice, or cassava.",
    regional_variations:
      "Some cooks parboil goat before grilling, while others grill slowly from raw. Marinades often include ginger, garlic, onion, lemon, and chili.",
    calories: 430,
    protein_g: 45,
    carbs_g: 6,
    fat_g: 25,
    fiber_g: 1,
    review_summary:
      "Sources agree on goat as a popular Congolese grilled meat. This version uses a short simmer for tenderness before finishing over high heat.",
    recommended_changes: [
      "Use shoulder or rib cuts with some fat.",
      "Finish hot so the edges char without drying."
    ],
    sources: [
      source("Apprends-moi a cuisiner congolais - Ntaba", "https://apprendsmoiacuisinercongolais.com/2017/02/09/ntabachevre/", ["goat", "Congolese method", "seasoning"]),
      source("Fork and Salt - Ntaba", "https://forkandsalt.com/recipes/congolese/ntaba", ["grilled goat", "marinade", "method"]),
      source("The Golden Balance - Congolese Ntaba", "https://www.thegoldenbalance.com/recipes/recipe-title-mb3aa", ["roasted goat", "Congolese context"])
    ],
    ingredients: [
      ingredient("Goat", 1.2, "kg", "goat shoulder or ribs", "cut into chunks"),
      ingredient("Marinade", 1, "large", "onion", "blended"),
      ingredient("Marinade", 4, "cloves", "garlic"),
      ingredient("Marinade", 2, "tbsp", "ginger", "grated"),
      ingredient("Marinade", 1, "whole", "lemon", "juiced"),
      ingredient("Marinade", 2, "tbsp", "oil"),
      ingredient("Spices", 1, "tsp", "paprika"),
      ingredient("Spices", 1, "tsp", "cumin"),
      ingredient("Spices", 1, "whole", "hot pepper"),
      ingredient("Finishing", 0, "", "salt and pepper", "to taste")
    ],
    steps: [
      step("Marinate goat", "Coat goat with onion, garlic, ginger, lemon, oil, spices, salt, and pepper.", 30, "marinate"),
      step("Parcook", "Simmer goat with a splash of water until just tender.", 25, "parcook"),
      step("Grill", "Grill over medium-high heat, turning and basting, until charred at the edges.", 18, "grill"),
      step("Rest", "Rest briefly and serve with onion salad and chili.", 5, "rest")
    ]
  }),
  recipe({
    slug: "odika-chicken-ga",
    name: "Poulet a l'Odika",
    description:
      "Gabonese chicken simmered in odika, the roasted wild mango seed sauce sometimes called African chocolate.",
    country_code: "GA",
    country_name: "Gabon",
    region: "Central Africa",
    ethnic_group: "Gabonese",
    category: "main",
    tags: ["chicken", "odika", "wild mango", "stew"],
    diet_tags: ["gluten-free", "dairy-free"],
    prep_time_minutes: 20,
    cook_time_minutes: 65,
    difficulty: "medium",
    default_servings: 6,
    story:
      "Odika, made from roasted wild mango kernels, gives Gabonese sauces a deep brown color and nutty, slightly smoky body. Chicken cooked in odika is a quiet showstopper.",
    occasion: "Best for Sunday lunch, guest meals, and Gabonese comfort food.",
    best_served_with: "Rice, boiled plantain, cassava, or baton de manioc.",
    regional_variations:
      "Odika sauce can be cooked with chicken, fish, smoked meat, or vegetables, depending on the household and what is available.",
    calories: 470,
    protein_g: 39,
    carbs_g: 12,
    fat_g: 30,
    fiber_g: 3,
    review_summary:
      "Sources agree that odika is a Gabonese wild mango seed sauce used with meats and fish. This version dissolves grated odika slowly into the braising liquid.",
    recommended_changes: [
      "Use authentic odika if available; the flavor is hard to replace.",
      "Simmer gently so the sauce does not split."
    ],
    sources: [
      source("La Gabonaise de Cuisine - Poulet fume Odika", "https://www.la-gabonaise-de-cuisine.com/recettes-de-cuisine/poulet-fume-odika/", ["odika sauce", "chicken", "Gabonese method"]),
      source("FoodieAtlas - Odika", "https://foodieatlas.com/gabon/odika/index.html", ["odika identity", "wild mango", "method"]),
      source("Wikipedia - Gabonese cuisine", "https://en.wikipedia.org/wiki/Gabonese_cuisine", ["Gabon cuisine context"])
    ],
    ingredients: [
      ingredient("Chicken", 1.2, "kg", "chicken pieces"),
      ingredient("Base", 2, "tbsp", "oil"),
      ingredient("Base", 1, "large", "onion", "chopped"),
      ingredient("Base", 3, "cloves", "garlic", "minced"),
      ingredient("Base", 2, "medium", "tomatoes", "chopped"),
      ingredient("Sauce", 120, "g", "odika", "grated or crumbled"),
      ingredient("Liquid", 3, "cups", "water or stock"),
      ingredient("Finishing", 1, "whole", "hot pepper", "optional")
    ],
    steps: [
      step("Brown chicken", "Brown chicken pieces in oil and set them aside.", 12, "brown"),
      step("Cook aromatics", "Cook onion, garlic, and tomatoes until reduced.", 12, "base"),
      step("Melt odika", "Add stock and odika, stirring until the sauce turns smooth and brown.", 12, "odika"),
      step("Simmer chicken", "Return chicken and simmer until tender and coated in sauce.", 35, "simmer")
    ]
  }),
  recipe({
    slug: "atanga-ga",
    name: "Atanga",
    description:
      "Gabonese boiled African butterfruit served warm with salt, chili, and sometimes bread or cassava.",
    country_code: "GA",
    country_name: "Gabon",
    region: "Central Africa",
    ethnic_group: "Gabonese and Central African",
    category: "snack",
    tags: ["atanga", "butterfruit", "snack", "Gabon"],
    diet_tags: ["vegan", "gluten-free", "dairy-free"],
    prep_time_minutes: 5,
    cook_time_minutes: 12,
    difficulty: "easy",
    default_servings: 4,
    story:
      "Atanga, the African butterfruit, is a beloved Gabonese snack. Brief boiling softens the fruit into a creamy, savory bite that needs little more than salt and pepper.",
    occasion: "Best for snacks, roadside fruit bowls, and simple starters.",
    best_served_with: "Salt, chili, bread, cassava, or roasted fish.",
    regional_variations:
      "Across Central Africa the fruit may be boiled, roasted, or eaten with salt, pepper, and starchy sides.",
    calories: 220,
    protein_g: 3,
    carbs_g: 18,
    fat_g: 16,
    fiber_g: 7,
    review_summary:
      "Sources identify atanga as a common Gabonese food eaten cooked or raw. The recipe keeps the preparation minimal because the fruit itself carries the dish.",
    recommended_changes: [
      "Boil only until the flesh softens.",
      "Serve warm because the texture is best just after cooking."
    ],
    sources: [
      source("Wikipedia - Dacryodes edulis", "https://en.wikipedia.org/wiki/Dacryodes_edulis", ["African butterfruit", "Central African food use"]),
      source("Wikipedia - Gabonese cuisine", "https://en.wikipedia.org/wiki/Gabonese_cuisine", ["atanga context", "Gabon cuisine"]),
      source("TasteAtlas - Atanga", "https://www.tasteatlas.com/atanga", ["dish identity", "Gabonese snack"])
    ],
    ingredients: [
      ingredient("Fruit", 12, "whole", "atanga fruits", "rinsed"),
      ingredient("Cooking", 6, "cups", "water"),
      ingredient("Seasoning", 1, "tsp", "salt"),
      ingredient("Serving", 1, "whole", "hot pepper", "optional"),
      ingredient("Serving", 1, "loaf", "bread or cassava", "optional")
    ],
    steps: [
      step("Rinse fruit", "Wash atanga and discard any split or bruised pieces.", 3, "rinse"),
      step("Boil briefly", "Boil in salted water until the skin darkens and the flesh softens.", 10, "boil"),
      step("Drain", "Drain and let the fruit steam for a minute.", 2, "steam"),
      step("Serve warm", "Serve with salt, chili, and bread or cassava.", 1, "serve")
    ]
  }),
  recipe({
    slug: "beignets-banane-ga",
    name: "Beignets de Banane",
    description:
      "Gabonese banana fritters made with ripe banana, flour, sugar, nutmeg, and a crisp fried edge.",
    country_code: "GA",
    country_name: "Gabon",
    region: "Central Africa",
    ethnic_group: "Gabonese",
    category: "dessert",
    tags: ["banana", "fritter", "snack", "sweet"],
    diet_tags: ["vegetarian", "dairy-free"],
    prep_time_minutes: 15,
    cook_time_minutes: 20,
    difficulty: "easy",
    default_servings: 6,
    story:
      "Banana beignets are a familiar sweet snack across Gabon and Central Africa, turning soft ripe bananas into quick fritters with a tender center and crisp edge.",
    occasion: "Best for tea, breakfast treats, after-school snacks, and dessert plates.",
    best_served_with: "Tea, coffee, fruit, or a dusting of sugar.",
    regional_variations:
      "Some cooks keep the batter plain, while others add nutmeg, vanilla, or a little yeast for lift.",
    calories: 260,
    protein_g: 4,
    carbs_g: 44,
    fat_g: 8,
    fiber_g: 3,
    review_summary:
      "Sources agree on ripe banana fritters in Gabonese and wider Central African snack cooking. This version uses mashed bananas and a light flour batter.",
    recommended_changes: [
      "Use very ripe bananas for sweetness.",
      "Keep oil medium-hot so the centers cook before the outside darkens."
    ],
    sources: [
      source("Recipe Buster - Gabonese Banana Beignets", "https://recipebuster.com/recipe/how-to-make-gabonese-banana-beignets/", ["banana fritters", "Gabonese context", "method"]),
      source("Wikipedia - Gabonese cuisine", "https://en.wikipedia.org/wiki/Gabonese_cuisine", ["Gabon cuisine context", "fruit snacks"]),
      source("Emerils - Banana Beignets", "https://www.emerils.com/123418/banana-beignets", ["banana fritter technique", "frying"])
    ],
    ingredients: [
      ingredient("Batter", 4, "large", "ripe bananas", "mashed"),
      ingredient("Batter", 1.5, "cups", "all-purpose flour"),
      ingredient("Batter", 0.25, "cup", "sugar"),
      ingredient("Batter", 1, "tsp", "baking powder"),
      ingredient("Batter", 0.5, "tsp", "nutmeg"),
      ingredient("Batter", 0.5, "cup", "water"),
      ingredient("Frying", 3, "cups", "oil"),
      ingredient("Finish", 2, "tbsp", "sugar", "optional")
    ],
    steps: [
      step("Make batter", "Mash bananas and mix with flour, sugar, baking powder, nutmeg, and water.", 8, "batter"),
      step("Rest", "Let batter stand so the flour hydrates.", 8, "rest"),
      step("Fry spoonfuls", "Drop spoonfuls into hot oil and fry until brown and cooked through.", 12, "fry"),
      step("Drain and dust", "Drain on paper and dust with sugar if desired.", 2, "finish")
    ]
  }),
  recipe({
    slug: "liboke-poisson-cg",
    name: "Liboke de Poisson",
    description:
      "Congolese fish marinated with onion, lemon, chili, and oil, wrapped in banana leaves, and steamed.",
    country_code: "CG",
    country_name: "Republic of Congo",
    region: "Central Africa",
    ethnic_group: "Congolese",
    category: "seafood",
    tags: ["fish", "banana leaves", "steamed", "Congolese"],
    diet_tags: ["gluten-free", "dairy-free"],
    prep_time_minutes: 25,
    cook_time_minutes: 35,
    difficulty: "medium",
    default_servings: 4,
    story:
      "Liboke is both a dish and a technique in the Congo Basin: food is seasoned, wrapped in leaves, and cooked by trapped steam until fragrant. Fish liboke is the most iconic version.",
    occasion: "Best for fish lunches, grill days, and leaf-packet cooking.",
    best_served_with: "Kwanga, plantain, rice, or cassava.",
    regional_variations:
      "Across the Congo Basin, liboke may use fish, meat, or vegetables, with banana leaves or foil as the wrapper.",
    calories: 340,
    protein_g: 39,
    carbs_g: 8,
    fat_g: 18,
    fiber_g: 2,
    review_summary:
      "Sources agree on fish cooked in banana leaves with onion, lemon, pepper, and oil. This version allows foil over banana leaves for reliable home steaming.",
    recommended_changes: [
      "Warm banana leaves before folding so they do not split.",
      "Seal packets tightly to trap steam."
    ],
    sources: [
      source("World Food Guide - Liboke de Poisson", "https://worldfood.guide/dish/liboke-de-poisson/", ["dish identity", "Republic of Congo context"]),
      source("Wikipedia - Liboke", "https://fr.wikipedia.org/wiki/Liboke", ["Congo Basin technique", "banana leaf packets"]),
      source("Congo Quotidien - Liboke de Poisson", "https://www.congoquotidien.com/2025/07/19/liboke-poisson-recette-congolaise-feuilles-bananier/", ["fish", "banana leaves", "method"])
    ],
    ingredients: [
      ingredient("Fish", 800, "g", "firm white fish", "cut into portions"),
      ingredient("Marinade", 1, "large", "onion", "sliced"),
      ingredient("Marinade", 1, "whole", "lemon", "juiced"),
      ingredient("Marinade", 2, "tbsp", "oil"),
      ingredient("Marinade", 2, "cloves", "garlic", "minced"),
      ingredient("Marinade", 1, "whole", "hot pepper", "minced"),
      ingredient("Wrapping", 4, "large", "banana leaves", "softened"),
      ingredient("Finishing", 0, "", "salt and pepper", "to taste")
    ],
    steps: [
      step("Marinate fish", "Season fish with onion, lemon, oil, garlic, pepper, salt, and black pepper.", 15, "marinate"),
      step("Prepare leaves", "Warm banana leaves until flexible and layer them for packets.", 5, "leaves"),
      step("Wrap packets", "Divide fish and marinade into leaves and wrap tightly.", 10, "wrap"),
      step("Steam", "Steam or grill packets until the fish flakes easily.", 25, "steam")
    ]
  }),
  recipe({
    slug: "madesu-cg",
    name: "Madesu",
    description:
      "Congolese beans simmered with tomato, onion, garlic, palm oil, and chili into a rich everyday stew.",
    country_code: "CG",
    country_name: "Republic of Congo",
    region: "Central Africa",
    ethnic_group: "Congolese",
    category: "stew",
    tags: ["beans", "tomato", "palm oil", "everyday"],
    diet_tags: ["vegan", "gluten-free", "dairy-free"],
    prep_time_minutes: 20,
    cook_time_minutes: 95,
    difficulty: "easy",
    default_servings: 6,
    story:
      "Madesu means beans in Lingala, and the dish is one of the Congo Basin's practical staples: beans cooked tender, then seasoned with tomato, onion, palm oil, garlic, and pepper.",
    occasion: "Best for meal prep, rice plates, and everyday family meals.",
    best_served_with: "Rice, plantain, kwanga, or sauteed greens.",
    regional_variations:
      "Some versions add smoked fish, bouillon, or meat, while simple home versions keep the beans vegetarian and oil-rich.",
    calories: 380,
    protein_g: 17,
    carbs_g: 58,
    fat_g: 10,
    fiber_g: 15,
    review_summary:
      "Sources identify madesu as Congolese beans, usually stewed with tomato and aromatics. This version seasons after the beans are soft so the skins cook evenly.",
    recommended_changes: [
      "Soak beans overnight for a creamy texture.",
      "Salt after the beans soften."
    ],
    sources: [
      source("She Cooks It All - Madesu", "https://www.shecooksitall.com/post/madesu-congolese-stewed-beans", ["Congolese beans", "tomato", "method"]),
      source("Wikipedia - Cuisine congolaise", "https://fr.wikipedia.org/wiki/Cuisine_congolaise", ["Congolese food context", "beans"]),
      source("World Food Guide - Madesu", "https://worldfood.guide/dish/madesu/", ["dish identity", "serving context"])
    ],
    ingredients: [
      ingredient("Beans", 2, "cups", "dried red beans", "soaked overnight"),
      ingredient("Beans", 7, "cups", "water"),
      ingredient("Sauce", 2, "tbsp", "red palm oil"),
      ingredient("Sauce", 1, "large", "onion", "chopped"),
      ingredient("Sauce", 3, "medium", "tomatoes", "chopped"),
      ingredient("Sauce", 3, "cloves", "garlic", "minced"),
      ingredient("Sauce", 1, "whole", "hot pepper"),
      ingredient("Finishing", 0, "", "salt and pepper", "to taste")
    ],
    steps: [
      step("Cook beans", "Simmer soaked beans in water until tender and creamy.", 70, "beans"),
      step("Make tomato base", "Cook onion, garlic, tomatoes, palm oil, and pepper until reduced.", 15, "base"),
      step("Combine", "Add beans and some cooking liquid to the sauce.", 8, "combine"),
      step("Simmer thick", "Cook until the beans are seasoned and the sauce thickens.", 12, "finish")
    ]
  }),
  recipe({
    slug: "karkanji-td",
    name: "Karkanji",
    description:
      "Chadian hibiscus drink infused with ginger, cloves, mint, lemon, and sugar, served cold.",
    country_code: "TD",
    country_name: "Chad",
    region: "Central Africa",
    ethnic_group: "Chadian and Sahelian",
    category: "beverage",
    tags: ["hibiscus", "ginger", "drink", "Sahel"],
    diet_tags: ["vegan", "gluten-free", "dairy-free"],
    prep_time_minutes: 10,
    cook_time_minutes: 15,
    difficulty: "easy",
    default_servings: 8,
    story:
      "Karkanji is the Chadian and Sahelian hibiscus cooler that turns dried bissap petals into a deep red drink with ginger, clove, mint, citrus, and sugar.",
    occasion: "Best for hot days, Ramadan evenings, parties, and alcohol-free hosting.",
    best_served_with: "Fritters, grilled meat, rice dishes, or dates.",
    regional_variations:
      "Hibiscus drinks are made across the Sahel under names such as bissap, zobo, sobolo, and karkade, with spice and sugar levels changing by household.",
    calories: 90,
    protein_g: 0,
    carbs_g: 23,
    fat_g: 0,
    fiber_g: 0,
    review_summary:
      "Sources agree on dried hibiscus boiled or steeped with ginger and sweetened. This recipe adds cloves and mint for the Chadian-style aromatic profile.",
    recommended_changes: [
      "Do not boil too long or the drink can taste tannic.",
      "Sweeten while warm so the sugar dissolves fully."
    ],
    sources: [
      source("TasteAtlas - Karkanji", "https://www.tasteatlas.com/karkanji", ["Chadian hibiscus drink", "ginger", "serving"]),
      source("Wikipedia - Hibiscus tea", "https://en.wikipedia.org/wiki/Hibiscus_tea", ["hibiscus drink context", "regional names"]),
      source("Wikipedia - Zobo drink", "https://en.wikipedia.org/wiki/Zobo_(drink)", ["hibiscus technique", "African drink context"])
    ],
    ingredients: [
      ingredient("Drink", 1, "cup", "dried hibiscus petals"),
      ingredient("Drink", 8, "cups", "water"),
      ingredient("Spices", 2, "tbsp", "fresh ginger", "sliced"),
      ingredient("Spices", 4, "whole", "cloves"),
      ingredient("Finishing", 0.75, "cup", "sugar"),
      ingredient("Finishing", 1, "whole", "lemon", "juiced"),
      ingredient("Finishing", 0.25, "cup", "mint leaves")
    ],
    steps: [
      step("Boil infusion", "Simmer hibiscus, ginger, and cloves in water until deep red.", 12, "infuse"),
      step("Steep", "Turn off heat and steep with mint.", 8, "steep"),
      step("Strain and sweeten", "Strain, stir in sugar and lemon while warm.", 5, "sweeten"),
      step("Chill", "Chill completely and serve over ice.", 30, "chill")
    ]
  }),
  recipe({
    slug: "boerewors-za",
    name: "Boerewors",
    description:
      "South African coiled sausage seasoned with coriander, cloves, nutmeg, vinegar, and pepper, then cooked over a braai.",
    country_code: "ZA",
    country_name: "South Africa",
    region: "Southern Africa",
    ethnic_group: "South African",
    category: "grill",
    tags: ["sausage", "braai", "coriander", "South Africa"],
    diet_tags: ["gluten-free", "dairy-free"],
    prep_time_minutes: 45,
    cook_time_minutes: 20,
    difficulty: "hard",
    default_servings: 8,
    story:
      "Boerewors is a braai icon, a coiled farmer-style sausage with coarse meat, toasted coriander, warm spice, vinegar, and enough fat to stay juicy over coals.",
    occasion: "Best for braai days, boerie rolls, sports gatherings, and family cookouts.",
    best_served_with: "Pap, chakalaka, tomato relish, rolls, or potato salad.",
    regional_variations:
      "Beef-led versions are common, sometimes blended with pork or lamb. The coriander-heavy spice profile is the constant.",
    calories: 520,
    protein_g: 30,
    carbs_g: 2,
    fat_g: 44,
    fiber_g: 0,
    review_summary:
      "Sources agree on coarsely ground meat, coriander, vinegar, and warm spices. This recipe gives a patty option if sausage casings are unavailable.",
    recommended_changes: [
      "Do not prick the casing while grilling.",
      "Keep the grind coarse for authentic texture."
    ],
    sources: [
      source("The South African - Boerewors Recipe", "https://www.thesouthafrican.com/lifestyle/food/recipes/boerewors-recipe/", ["spice blend", "South African context", "method"]),
      source("Wikipedia - Boerewors", "https://en.wikipedia.org/wiki/Boerewors", ["dish identity", "meat standards", "braai context"]),
      source("FoodieAtlas - Boerewors", "https://foodieatlas.com/south-africa/boerewors/index.html", ["cooking method", "serving"])
    ],
    ingredients: [
      ingredient("Meat", 1.5, "kg", "beef", "coarsely ground"),
      ingredient("Meat", 500, "g", "pork fat or lamb fat", "coarsely ground"),
      ingredient("Spices", 2, "tbsp", "coriander seeds", "toasted and crushed"),
      ingredient("Spices", 1, "tsp", "black pepper"),
      ingredient("Spices", 0.5, "tsp", "cloves"),
      ingredient("Spices", 0.5, "tsp", "nutmeg"),
      ingredient("Seasoning", 2, "tbsp", "salt"),
      ingredient("Seasoning", 0.33, "cup", "malt vinegar"),
      ingredient("Casing", 2, "m", "sausage casing", "optional")
    ],
    steps: [
      step("Season meat", "Mix meat, fat, spices, salt, and vinegar gently until evenly seasoned.", 12, "mix"),
      step("Stuff or shape", "Stuff into casing as one loose coil, or shape into thick patties.", 25, "shape"),
      step("Rest cold", "Chill so the flavor settles and the sausage firms.", 30, "rest"),
      step("Braai gently", "Cook over medium coals, turning carefully, until juicy and cooked through.", 18, "braai")
    ]
  }),
  recipe({
    slug: "koeksisters-za",
    name: "Koeksisters",
    description:
      "South African braided doughnuts fried until crisp and dipped hot into ice-cold spiced syrup.",
    country_code: "ZA",
    country_name: "South Africa",
    region: "Southern Africa",
    ethnic_group: "Afrikaner South African",
    category: "dessert",
    tags: ["doughnut", "syrup", "braided", "sweet"],
    diet_tags: ["vegetarian"],
    prep_time_minutes: 60,
    cook_time_minutes: 35,
    difficulty: "hard",
    default_servings: 24,
    story:
      "Koeksisters are the crisp, syrup-soaked sweet that demands contrast: hot braided dough plunged into ice-cold syrup so the shell stays crunchy while the inside drinks in sweetness.",
    occasion: "Best for tea tables, bake sales, holidays, and sweet boxes.",
    best_served_with: "Rooibos tea or coffee.",
    regional_variations:
      "Afrikaner koeksisters are braided and syrupy, while Cape Malay koesisters are spiced, rounder, and rolled in coconut.",
    calories: 210,
    protein_g: 3,
    carbs_g: 36,
    fat_g: 7,
    fiber_g: 1,
    review_summary:
      "Sources agree on fried braided dough dipped into very cold syrup. This recipe chills the syrup overnight for the correct snap.",
    recommended_changes: [
      "Make syrup first and chill it hard.",
      "Dip hot fritters immediately into cold syrup."
    ],
    sources: [
      source("Wikipedia - Koeksister", "https://en.wikipedia.org/wiki/Koeksister", ["dish identity", "syrup technique"]),
      source("196 Flavors - Koeksisters", "https://www.196flavors.com/south-africa-koeksisters/", ["traditional recipe", "braiding", "syrup"]),
      source("The South African - Koeksisters", "https://www.thesouthafrican.com/lifestyle/food/recipes/traditional-koeksisters-recipe/", ["method", "frying", "serving"])
    ],
    ingredients: [
      ingredient("Syrup", 3, "cups", "sugar"),
      ingredient("Syrup", 1.5, "cups", "water"),
      ingredient("Syrup", 1, "tbsp", "lemon juice"),
      ingredient("Syrup", 1, "stick", "cinnamon"),
      ingredient("Dough", 4, "cups", "cake flour"),
      ingredient("Dough", 4, "tsp", "baking powder"),
      ingredient("Dough", 0.25, "cup", "butter"),
      ingredient("Dough", 1, "whole", "egg"),
      ingredient("Dough", 1, "cup", "milk"),
      ingredient("Frying", 4, "cups", "oil")
    ],
    steps: [
      step("Make syrup", "Boil syrup ingredients until slightly sticky, then chill until ice-cold.", 15, "syrup"),
      step("Make dough", "Rub butter into flour and baking powder, then mix with egg and milk.", 12, "dough"),
      step("Braid", "Roll, cut strips, braid, and rest briefly.", 25, "braid"),
      step("Fry and dip", "Fry until golden and immediately dip hot koeksisters into cold syrup.", 20, "fry")
    ]
  }),
  recipe({
    slug: "umngqusho-za",
    name: "Umngqusho",
    description:
      "Xhosa samp and beans simmered until tender, often finished with onion, tomato, butter, and seasoning.",
    country_code: "ZA",
    country_name: "South Africa",
    region: "Southern Africa",
    ethnic_group: "Xhosa South African",
    category: "main",
    tags: ["samp", "beans", "Xhosa", "comfort food"],
    diet_tags: ["vegetarian", "gluten-free"],
    prep_time_minutes: 20,
    cook_time_minutes: 140,
    difficulty: "easy",
    default_servings: 6,
    story:
      "Umngqusho is one of South Africa's great comfort dishes, especially in Xhosa homes: samp and sugar beans cooked slowly until creamy, filling, and ready for gravy or meat.",
    occasion: "Best for family lunch, heritage tables, and cold-weather meals.",
    best_served_with: "Umleqwa, beef stew, chakalaka, or butter and herbs.",
    regional_variations:
      "Some versions are plain and creamy, others add tomato, onion, spices, or meat stock.",
    calories: 410,
    protein_g: 18,
    carbs_g: 76,
    fat_g: 6,
    fiber_g: 16,
    review_summary:
      "Sources agree on samp and beans as the base. This version soaks both and finishes with a light onion-tomato relish for flavor without losing the traditional grain character.",
    recommended_changes: [
      "Soak overnight to shorten cooking.",
      "Do not add acidic tomato until beans are tender."
    ],
    sources: [
      source("Getaway - Umngqusho Recipe", "https://www.getaway.co.za/food/recipes-food/umngqusho-recipe/", ["samp and beans", "Xhosa context", "method"]),
      source("Wikipedia - Umngqusho", "https://en.wikipedia.org/wiki/Umngqusho", ["dish identity", "South African context"]),
      source("FoodMap - Umngqusho", "https://www.foodmap.in/south-africa/umngqusho", ["serving context", "Nelson Mandela favorite"])
    ],
    ingredients: [
      ingredient("Base", 2, "cups", "samp", "soaked overnight"),
      ingredient("Base", 1.5, "cups", "sugar beans", "soaked overnight"),
      ingredient("Base", 8, "cups", "water"),
      ingredient("Finish", 2, "tbsp", "butter or oil"),
      ingredient("Finish", 1, "large", "onion", "chopped"),
      ingredient("Finish", 2, "medium", "tomatoes", "chopped"),
      ingredient("Finish", 0, "", "salt and pepper", "to taste")
    ],
    steps: [
      step("Cook samp and beans", "Simmer soaked samp and beans in water until tender.", 110, "simmer"),
      step("Season", "Add salt once the beans are soft and continue cooking until creamy.", 15, "season"),
      step("Make relish", "Cook onion and tomatoes in butter or oil until soft.", 12, "relish"),
      step("Fold together", "Stir relish into samp and beans or serve it over the top.", 5, "finish")
    ]
  }),
  recipe({
    slug: "sosaties-za",
    name: "Sosaties",
    description:
      "Cape Malay lamb skewers marinated with curry, apricot, vinegar, onion, and bay leaves before braaiing.",
    country_code: "ZA",
    country_name: "South Africa",
    region: "Southern Africa",
    ethnic_group: "Cape Malay South African",
    category: "grill",
    tags: ["lamb", "skewers", "Cape Malay", "apricot"],
    diet_tags: ["gluten-free", "dairy-free"],
    prep_time_minutes: 35,
    cook_time_minutes: 18,
    difficulty: "medium",
    default_servings: 6,
    story:
      "Sosaties carry the sweet-sour-spiced Cape Malay signature: lamb marinated with curry, apricot, vinegar, onions, and bay, then cooked over coals.",
    occasion: "Best for braai days, holiday platters, and Cape-style entertaining.",
    best_served_with: "Yellow rice, sambals, salad, or chutney.",
    regional_variations:
      "Some versions alternate lamb with dried apricots and onions, while others use chicken or beef.",
    calories: 460,
    protein_g: 34,
    carbs_g: 18,
    fat_g: 28,
    fiber_g: 2,
    review_summary:
      "Sources agree on curry-spiced skewers with apricot sweetness and vinegar tang. This version marinates overnight for tenderness.",
    recommended_changes: [
      "Marinate at least four hours, overnight if possible.",
      "Use medium coals so the sugar does not burn."
    ],
    sources: [
      source("Wines of South Africa - Sosaties", "https://www.wosa.co.za/Multimedia/Cape-Recipes/SOSATIES/", ["Cape Malay recipe", "apricot", "braai"]),
      source("Wikipedia - Sosatie", "https://en.wikipedia.org/wiki/Sosatie", ["dish identity", "Cape Malay origin"]),
      source("Food24 - Sosaties", "https://www.food24.com/recipe/sosaties/", ["method", "marinade", "skewers"])
    ],
    ingredients: [
      ingredient("Meat", 1.2, "kg", "lamb shoulder", "cubed"),
      ingredient("Marinade", 2, "large", "onions", "sliced"),
      ingredient("Marinade", 0.5, "cup", "apricot jam"),
      ingredient("Marinade", 0.33, "cup", "vinegar"),
      ingredient("Marinade", 2, "tbsp", "curry powder"),
      ingredient("Marinade", 1, "tsp", "turmeric"),
      ingredient("Marinade", 4, "whole", "bay leaves"),
      ingredient("Skewers", 12, "whole", "dried apricots", "optional"),
      ingredient("Cooking", 2, "tbsp", "oil")
    ],
    steps: [
      step("Cook marinade", "Simmer onions, jam, vinegar, curry, turmeric, bay, salt, and pepper into a glossy marinade.", 10, "marinade"),
      step("Marinate lamb", "Cool marinade and coat lamb for several hours or overnight.", 240, "marinate"),
      step("Thread skewers", "Thread lamb with onions and apricots.", 15, "skewer"),
      step("Braai", "Grill over medium coals until browned and cooked through.", 15, "braai")
    ]
  }),
  recipe({
    slug: "potbrood-za",
    name: "Potbrood",
    description:
      "South African pot bread baked in a cast-iron pot until crusty outside and soft within.",
    country_code: "ZA",
    country_name: "South Africa",
    region: "Southern Africa",
    ethnic_group: "South African",
    category: "bread",
    tags: ["bread", "cast iron", "braai", "pot"],
    diet_tags: ["vegetarian", "dairy-free"],
    prep_time_minutes: 70,
    cook_time_minutes: 45,
    difficulty: "medium",
    default_servings: 8,
    story:
      "Potbrood is campfire and braai bread, baked in a heavy pot with coals around it until it develops a thick crust and soft pull-apart center.",
    occasion: "Best for braai sides, stews, camping, and outdoor meals.",
    best_served_with: "Butter, jam, chakalaka, potjiekos, or grilled meat.",
    regional_variations:
      "Some loaves include sweetcorn, cheese, herbs, or beer, but the core is a simple yeast bread baked in a pot.",
    calories: 250,
    protein_g: 7,
    carbs_g: 49,
    fat_g: 3,
    fiber_g: 2,
    review_summary:
      "Sources agree on yeast bread baked in a cast-iron pot. The AfroKitchen version works in an oven Dutch oven or under coals.",
    recommended_changes: [
      "Grease and flour the pot so the loaf releases.",
      "Bake with lid on first, then uncovered for crust."
    ],
    sources: [
      source("Wikipedia - Potbrood", "https://en.wikipedia.org/wiki/Potbrood", ["dish identity", "South African origin"]),
      source("Jan Braai - Potbrood", "https://braai.com/potbrood/", ["braai method", "cast iron", "bread"]),
      source("Food24 - Potbrood", "https://www.food24.com/recipe/potbrood/", ["recipe method", "baking"])
    ],
    ingredients: [
      ingredient("Dough", 4, "cups", "bread flour"),
      ingredient("Dough", 2, "tsp", "instant yeast"),
      ingredient("Dough", 1, "tbsp", "sugar"),
      ingredient("Dough", 1.5, "tsp", "salt"),
      ingredient("Dough", 1.5, "cups", "warm water"),
      ingredient("Dough", 2, "tbsp", "oil"),
      ingredient("Pot", 1, "tbsp", "oil", "for greasing")
    ],
    steps: [
      step("Mix dough", "Mix flour, yeast, sugar, salt, water, and oil into a soft dough.", 10, "mix"),
      step("Rise", "Cover and let rise until doubled.", 60, "rise"),
      step("Shape in pot", "Shape dough and place into a greased cast-iron pot.", 10, "shape"),
      step("Bake", "Bake covered until risen, then uncover until crusty and hollow-sounding.", 40, "bake")
    ]
  }),
  recipe({
    slug: "bogobe-jwa-lerotse-bw",
    name: "Bogobe Jwa Lerotse",
    description:
      "Botswana sorghum porridge cooked with lerotse melon for a lightly sweet traditional staple.",
    country_code: "BW",
    country_name: "Botswana",
    region: "Southern Africa",
    ethnic_group: "Tswana",
    category: "breakfast",
    tags: ["sorghum", "melon", "porridge", "Botswana"],
    diet_tags: ["vegan", "gluten-free", "dairy-free"],
    prep_time_minutes: 15,
    cook_time_minutes: 45,
    difficulty: "easy",
    default_servings: 6,
    story:
      "Bogobe jwa lerotse is Botswana sorghum porridge enriched with lerotse melon. It is humble, nourishing, and unmistakably local in its use of indigenous melon.",
    occasion: "Best for breakfast, harvest-season meals, and gentle side dishes.",
    best_served_with: "Seswaa, morogo, milk, or sugar.",
    regional_variations:
      "Some cooks ferment the sorghum slightly, while others keep it plain and let the melon soften the porridge.",
    calories: 260,
    protein_g: 7,
    carbs_g: 56,
    fat_g: 2,
    fiber_g: 7,
    review_summary:
      "Sources agree on sorghum bogobe cooked with lerotse melon. This version uses grated squash or mild melon as a substitution when lerotse is unavailable.",
    recommended_changes: [
      "Whisk sorghum meal into cool water first to avoid lumps.",
      "Cook slowly until the raw grain flavor disappears."
    ],
    sources: [
      source("Wikipedia - Bogobe jwa lerotse", "https://en.wikipedia.org/wiki/Bogobe_jwa_lerotse", ["dish identity", "Botswana context"]),
      source("Discover Africa - Botswana local cuisines", "https://www.discoverafrica.com/blog/local-cuisines-you-have-to-try-in-botswana/", ["lerotse melon", "traditional dish"]),
      source("Nationalgericht Rezepte - Bogobe jwa lerotse", "https://www.nationalgerichtrezepte.de/nationalgericht-botswana-bogobe-jwa-lerotse-rezept/", ["recipe method", "sorghum porridge"])
    ],
    ingredients: [
      ingredient("Porridge", 2, "cups", "sorghum meal"),
      ingredient("Porridge", 5, "cups", "water"),
      ingredient("Porridge", 2, "cups", "lerotse melon or mild squash", "grated"),
      ingredient("Porridge", 1, "tsp", "salt"),
      ingredient("Serving", 2, "tbsp", "sugar", "optional")
    ],
    steps: [
      step("Make slurry", "Whisk sorghum meal with some cool water until smooth.", 5, "slurry"),
      step("Cook melon", "Simmer grated melon with water until soft.", 12, "melon"),
      step("Add sorghum", "Whisk in sorghum slurry and cook, stirring often.", 25, "cook"),
      step("Finish", "Season with salt and serve plain or lightly sweetened.", 3, "finish")
    ]
  }),
  recipe({
    slug: "dikgobe-bw",
    name: "Dikgobe",
    description:
      "Botswana samp, beans, and peanuts cooked together into a hearty grain-and-legume dish.",
    country_code: "BW",
    country_name: "Botswana",
    region: "Southern Africa",
    ethnic_group: "Tswana",
    category: "main",
    tags: ["samp", "beans", "peanuts", "Botswana"],
    diet_tags: ["vegan", "gluten-free", "dairy-free"],
    prep_time_minutes: 20,
    cook_time_minutes: 130,
    difficulty: "easy",
    default_servings: 6,
    story:
      "Dikgobe is a Botswana staple of samp, beans, and often peanuts, cooked until filling and tender. It is practical, protein-rich, and built for sharing.",
    occasion: "Best for family meals, meal prep, and vegetarian mains.",
    best_served_with: "Morogo, seswaa, tomato relish, or sour milk.",
    regional_variations:
      "Some versions use cowpeas, sugar beans, or peanuts, and the final texture can be loose or thick.",
    calories: 430,
    protein_g: 20,
    carbs_g: 72,
    fat_g: 9,
    fiber_g: 16,
    review_summary:
      "Sources identify dikgobe as a Botswana dish based on grains and legumes. This version uses samp, beans, and peanuts for the common hearty profile.",
    recommended_changes: [
      "Soak the grains and beans overnight.",
      "Add peanuts after beans begin to soften so everything finishes together."
    ],
    sources: [
      source("Wikipedia - Dikgobe", "https://en.wikipedia.org/wiki/Dikgobe", ["dish identity", "Botswana and Southern Africa context"]),
      source("Discover Africa - Botswana local cuisines", "https://www.discoverafrica.com/blog/local-cuisines-you-have-to-try-in-botswana/", ["Botswana food context", "traditional dishes"]),
      source("Botswana cuisine - Wikipedia", "https://en.wikipedia.org/wiki/Botswana_cuisine", ["Botswana staple dishes", "serving context"])
    ],
    ingredients: [
      ingredient("Base", 2, "cups", "samp", "soaked overnight"),
      ingredient("Base", 1.5, "cups", "beans or cowpeas", "soaked overnight"),
      ingredient("Base", 0.75, "cup", "raw peanuts"),
      ingredient("Base", 8, "cups", "water"),
      ingredient("Finish", 1, "tsp", "salt"),
      ingredient("Finish", 2, "tbsp", "oil", "optional")
    ],
    steps: [
      step("Cook samp and beans", "Simmer soaked samp and beans in water until beginning to soften.", 75, "simmer"),
      step("Add peanuts", "Add peanuts and continue cooking until everything is tender.", 40, "peanuts"),
      step("Season", "Add salt and cook until thick and creamy.", 10, "season"),
      step("Rest", "Rest briefly before serving so the grains settle.", 5, "rest")
    ]
  }),
  recipe({
    slug: "phane-bw",
    name: "Phane",
    description:
      "Botswana mopane worms simmered, then fried with onion, tomato, chili, and salt until savory.",
    country_code: "BW",
    country_name: "Botswana",
    region: "Southern Africa",
    ethnic_group: "Tswana and Southern African",
    category: "main",
    tags: ["mopane worms", "protein", "Botswana", "stew"],
    diet_tags: ["gluten-free", "dairy-free"],
    prep_time_minutes: 20,
    cook_time_minutes: 30,
    difficulty: "medium",
    default_servings: 4,
    story:
      "Phane, or mopane worms, are a prized seasonal protein in Botswana and wider Southern Africa. Dried worms are rehydrated, simmered, and fried with tomato and onion.",
    occasion: "Best for traditional protein plates, rice, pap, and relish spreads.",
    best_served_with: "Pap, bogobe, rice, or morogo.",
    regional_variations:
      "Some cooks keep phane dry and crisp, while others make a tomato-onion stew.",
    calories: 310,
    protein_g: 38,
    carbs_g: 10,
    fat_g: 14,
    fiber_g: 6,
    review_summary:
      "Sources agree that mopane worms are boiled or rehydrated before frying or stewing. This version gives a tomato-onion finish for a more approachable plate.",
    recommended_changes: [
      "Rinse dried worms well before cooking.",
      "Do not overcook after frying or they can become tough."
    ],
    sources: [
      source("Botswana Youth - Mophane Stew", "https://www.botswanayouth.com/recipe-of-the-day-mophane-stew/", ["mopane worms", "tomato stew", "Botswana context"]),
      source("Fork and Salt - Mopane Worm Stew", "https://forkandsalt.com/recipes/botswana/mopane-worm-stew", ["method", "tomato onion base"]),
      source("Wikipedia - Gonimbrasia belina", "https://en.wikipedia.org/wiki/Gonimbrasia_belina", ["mopane worm food context", "Southern Africa"])
    ],
    ingredients: [
      ingredient("Protein", 2, "cups", "dried mopane worms", "rinsed"),
      ingredient("Boil", 4, "cups", "water"),
      ingredient("Sauce", 2, "tbsp", "oil"),
      ingredient("Sauce", 1, "large", "onion", "chopped"),
      ingredient("Sauce", 2, "medium", "tomatoes", "chopped"),
      ingredient("Sauce", 1, "whole", "hot pepper", "minced"),
      ingredient("Finishing", 0, "", "salt", "to taste")
    ],
    steps: [
      step("Rehydrate", "Boil rinsed mopane worms until softened.", 12, "boil"),
      step("Drain", "Drain well so they fry instead of steam.", 3, "drain"),
      step("Fry sauce", "Cook onion, tomato, chili, and oil into a relish.", 10, "sauce"),
      step("Finish phane", "Add mopane worms and fry until savory and lightly crisp at the edges.", 10, "finish")
    ]
  }),
  recipe({
    slug: "oshikundu-na",
    name: "Oshikundu",
    description:
      "Namibian fermented millet drink made with mahangu meal, malted sorghum or millet, water, and sugar.",
    country_code: "NA",
    country_name: "Namibia",
    region: "Southern Africa",
    ethnic_group: "Aawambo Namibian",
    category: "beverage",
    tags: ["millet", "fermented", "drink", "Namibia"],
    diet_tags: ["vegan", "gluten-free", "dairy-free"],
    prep_time_minutes: 15,
    cook_time_minutes: 10,
    difficulty: "medium",
    default_servings: 8,
    story:
      "Oshikundu, or ontaku, is a traditional Namibian fermented drink made from mahangu and malted grain. It is mildly sour, refreshing, and meant to be consumed young.",
    occasion: "Best for hot days, breakfast, field work, and cultural meals.",
    best_served_with: "Oshifima, grilled meat, or simple snacks.",
    regional_variations:
      "Household methods vary in fermentation time, grain ratio, and sweetness, especially in northern Namibia.",
    calories: 120,
    protein_g: 3,
    carbs_g: 26,
    fat_g: 1,
    fiber_g: 3,
    review_summary:
      "Sources agree on fermented mahangu or millet with malted sorghum or millet. This version keeps fermentation short and food-safe for home preparation.",
    recommended_changes: [
      "Use clean jars and drink within a day.",
      "Ferment at room temperature only until pleasantly sour."
    ],
    sources: [
      source("UNAM Journal - Processing methods of Oshikundu", "https://journals.unam.edu.na/index.php/JSHSS/article/view/940", ["traditional method", "Aawambo context", "fermentation"]),
      source("Wikipedia - Oshikundu", "https://en.wikipedia.org/wiki/Oshikundu", ["dish identity", "Namibian drink"]),
      source("UNAM Repository - Oshikundu processing methods", "https://repository.unam.edu.na/server/api/core/bitstreams/45f1a7d7-5089-4ca2-8e4c-af0974c9a92a/content", ["ingredients", "serving context"])
    ],
    ingredients: [
      ingredient("Base", 1, "cup", "mahangu or millet meal"),
      ingredient("Base", 6, "cups", "water"),
      ingredient("Malt", 0.5, "cup", "malted sorghum or millet flour"),
      ingredient("Malt", 0.25, "cup", "previous oshikundu or fermented grain drink", "optional starter"),
      ingredient("Finish", 0.25, "cup", "sugar", "optional")
    ],
    steps: [
      step("Cook porridge base", "Whisk mahangu meal into water and simmer into a thin porridge.", 8, "porridge"),
      step("Cool", "Cool until just warm, not hot.", 20, "cool"),
      step("Add malt", "Whisk in malted flour and sugar if using.", 5, "malt"),
      step("Ferment briefly", "Cover loosely and ferment until lightly sour, then chill.", 12, "ferment")
    ]
  }),
  recipe({
    slug: "omagungu-na",
    name: "Omagungu",
    description:
      "Namibian mopane worms cooked with tomato, onion, chili, and oil into a protein-rich relish.",
    country_code: "NA",
    country_name: "Namibia",
    region: "Southern Africa",
    ethnic_group: "Namibian",
    category: "main",
    tags: ["mopane worms", "tomato", "Namibia", "protein"],
    diet_tags: ["gluten-free", "dairy-free"],
    prep_time_minutes: 20,
    cook_time_minutes: 30,
    difficulty: "medium",
    default_servings: 4,
    story:
      "Omagungu is Namibia's mopane worm preparation, eaten as a valued traditional protein. The dried worms are cleaned, softened, and cooked with onion and tomato or fried more simply.",
    occasion: "Best for traditional plates, pap, oshifima, and relish meals.",
    best_served_with: "Oshifima, pap, rice, or cooked greens.",
    regional_variations:
      "Some cooks prefer them crisp and dry, while others add tomato and onion for a saucy relish.",
    calories: 310,
    protein_g: 38,
    carbs_g: 10,
    fat_g: 14,
    fiber_g: 6,
    review_summary:
      "Sources connect omagungu and mopane worms to Namibian food culture. This method follows the common boil-then-fry pattern.",
    recommended_changes: [
      "Rinse carefully to remove grit.",
      "Finish with enough oil and heat for a pleasant texture."
    ],
    sources: [
      source("WeFaceCook - Namibia Mopane Worms", "https://www.wefacecook.com/recipe/2647", ["Namibian mopane worm method", "cooking times"]),
      source("Wikipedia - Namibian cuisine", "https://en.wikipedia.org/wiki/Namibian_cuisine", ["Namibian food context", "traditional ingredients"]),
      source("Wikipedia - Gonimbrasia belina", "https://en.wikipedia.org/wiki/Gonimbrasia_belina", ["mopane worm food context"])
    ],
    ingredients: [
      ingredient("Protein", 2, "cups", "dried omagungu or mopane worms", "rinsed"),
      ingredient("Boil", 4, "cups", "water"),
      ingredient("Sauce", 2, "tbsp", "oil"),
      ingredient("Sauce", 1, "large", "onion", "chopped"),
      ingredient("Sauce", 2, "medium", "tomatoes", "chopped"),
      ingredient("Sauce", 1, "whole", "hot pepper", "optional"),
      ingredient("Finishing", 0, "", "salt", "to taste")
    ],
    steps: [
      step("Boil omagungu", "Boil rinsed mopane worms until softened.", 12, "boil"),
      step("Drain well", "Drain and pat dry so they fry properly.", 5, "drain"),
      step("Cook relish", "Cook onion, tomatoes, chili, and oil until jammy.", 10, "relish"),
      step("Finish", "Add omagungu and cook until coated and lightly crisp.", 8, "finish")
    ]
  }),
  recipe({
    slug: "omajowa-na",
    name: "Omajowa Mushrooms",
    description:
      "Namibian termite-hill mushrooms pan-cooked with onion, butter or oil, garlic, and herbs.",
    country_code: "NA",
    country_name: "Namibia",
    region: "Southern Africa",
    ethnic_group: "Herero and Namibian",
    category: "side",
    tags: ["mushrooms", "Namibia", "termite mound", "seasonal"],
    diet_tags: ["vegetarian", "gluten-free"],
    prep_time_minutes: 15,
    cook_time_minutes: 20,
    difficulty: "easy",
    default_servings: 4,
    story:
      "Omajowa are giant mushrooms that appear near termite mounds after rain in Namibia. Their meaty texture makes them prized, often cooked simply so the mushroom stays the star.",
    occasion: "Best for rainy-season meals, breakfast, and sides with pap or bread.",
    best_served_with: "Oshifima, toast, eggs, grilled meat, or salad.",
    regional_variations:
      "Some cooks stew them, others fry them simply with onion. Large cultivated mushrooms can stand in when omajowa are unavailable.",
    calories: 180,
    protein_g: 7,
    carbs_g: 14,
    fat_g: 11,
    fiber_g: 5,
    review_summary:
      "Sources agree that omajowa are prized Namibian termite-hill mushrooms. This recipe treats them simply with onion and fat to preserve their texture.",
    recommended_changes: [
      "Only use mushrooms that have been safely identified.",
      "Cook in a wide pan so moisture evaporates."
    ],
    sources: [
      source("Slow Food Foundation - Omajova Mushroom", "https://www.fondazioneslowfood.com/en/ark-of-taste-slow-food/omajova-mushroom/", ["Namibian mushroom identity", "seasonality"]),
      source("Travel Namibia - Nature Notes Omajova", "https://travelnam.com/nature-notes-omajova/", ["termite mound mushrooms", "Namibian context"]),
      source("Wikipedia - Termitomyces schimperi", "https://en.wikipedia.org/wiki/Termitomyces_schimperi", ["species context", "Omajowa naming"])
    ],
    ingredients: [
      ingredient("Mushrooms", 700, "g", "omajowa or large mushrooms", "cleaned and sliced"),
      ingredient("Base", 2, "tbsp", "butter or oil"),
      ingredient("Base", 1, "large", "onion", "sliced"),
      ingredient("Base", 2, "cloves", "garlic", "minced"),
      ingredient("Finishing", 2, "tbsp", "parsley", "chopped"),
      ingredient("Finishing", 0, "", "salt and pepper", "to taste")
    ],
    steps: [
      step("Clean mushrooms", "Brush mushrooms clean and slice thickly.", 8, "clean"),
      step("Cook onion", "Cook onion in butter or oil until soft.", 7, "onion"),
      step("Sear mushrooms", "Add mushrooms and cook in a wide pan until browned and tender.", 12, "mushrooms"),
      step("Finish", "Add garlic, parsley, salt, and pepper for the final minute.", 2, "finish")
    ]
  }),
  recipe({
    slug: "mazondo-zw",
    name: "Mazondo",
    description:
      "Zimbabwean ox trotters slow-cooked with onion, tomato, garlic, and spices until gelatin-rich and tender.",
    country_code: "ZW",
    country_name: "Zimbabwe",
    region: "Southern Africa",
    ethnic_group: "Zimbabwean",
    category: "stew",
    tags: ["ox trotters", "slow cooked", "sadza", "Zimbabwe"],
    diet_tags: ["gluten-free", "dairy-free"],
    prep_time_minutes: 25,
    cook_time_minutes: 180,
    difficulty: "medium",
    default_servings: 6,
    story:
      "Mazondo is Zimbabwean slow food: ox trotters cooked patiently until the collagen softens into a sticky, rich sauce that belongs with sadza.",
    occasion: "Best for weekend meals, beerhall-style plates, and cold-weather comfort.",
    best_served_with: "Sadza, muriwo, cabbage, or chili.",
    regional_variations:
      "Some cooks keep mazondo very plain with salt, while others add tomatoes, curry powder, or a richer gravy.",
    calories: 520,
    protein_g: 42,
    carbs_g: 10,
    fat_g: 34,
    fiber_g: 2,
    review_summary:
      "Sources agree on long-cooked trotters with a simple onion-tomato gravy. This recipe gives a long simmer and late tomato addition for tenderness.",
    recommended_changes: [
      "Clean trotters well before cooking.",
      "Cook until the meat and skin are fully tender."
    ],
    sources: [
      source("ZimboKitchen - Stewed Pork Trotters Mazondo", "https://www.zimbokitchen.com/stewed-pork-trotters-mazondo/", ["trotter method", "Zimbabwe context"]),
      source("I've Been Cooking - Mazondo Munch", "https://ivebeen.cooking/recipes/mazondo-munch", ["slow cooking", "tomato sauce", "traditional context"]),
      source("Cape to Kenya - Mazondo", "https://capetokenya.home.blog/wp-content/uploads/2019/07/mazondo-pdf.pdf", ["traditional method", "Zimbabwe context"])
    ],
    ingredients: [
      ingredient("Trotters", 1.5, "kg", "ox or pork trotters", "cleaned"),
      ingredient("Simmer", 8, "cups", "water"),
      ingredient("Base", 2, "tbsp", "oil"),
      ingredient("Base", 2, "large", "onions", "chopped"),
      ingredient("Base", 3, "medium", "tomatoes", "chopped"),
      ingredient("Base", 3, "cloves", "garlic", "minced"),
      ingredient("Spices", 1, "tsp", "curry powder"),
      ingredient("Finishing", 0, "", "salt and pepper", "to taste")
    ],
    steps: [
      step("Simmer trotters", "Boil trotters in water until very tender, skimming as needed.", 130, "simmer"),
      step("Cook base", "Cook onion, garlic, tomatoes, curry powder, oil, salt, and pepper into a gravy.", 15, "base"),
      step("Combine", "Add tender trotters and some cooking liquid to the gravy.", 20, "combine"),
      step("Reduce", "Simmer until glossy and sticky.", 15, "reduce")
    ]
  }),
  recipe({
    slug: "mutakura-zw",
    name: "Mutakura",
    description:
      "Zimbabwean mixed grain and legume pot with maize, cowpeas, bambara nuts, peanuts, and beans.",
    country_code: "ZW",
    country_name: "Zimbabwe",
    region: "Southern Africa",
    ethnic_group: "Zimbabwean",
    category: "main",
    tags: ["grains", "legumes", "maize", "Zimbabwe"],
    diet_tags: ["vegan", "gluten-free", "dairy-free"],
    prep_time_minutes: 20,
    cook_time_minutes: 140,
    difficulty: "easy",
    default_servings: 8,
    story:
      "Mutakura is Zimbabwe's mixed grains and legumes pot, made for nourishment and sharing. Maize, cowpeas, bambara nuts, peanuts, and beans cook together into a filling staple.",
    occasion: "Best for harvest meals, meal prep, and wholesome vegetarian mains.",
    best_served_with: "Muriwo, tomato relish, tea, or roasted meat.",
    regional_variations:
      "The mix changes by household and harvest: maize, cowpeas, peanuts, bambara nuts, nyimo, and sugar beans all appear.",
    calories: 450,
    protein_g: 22,
    carbs_g: 72,
    fat_g: 10,
    fiber_g: 18,
    review_summary:
      "Sources identify mutakura as a traditional mixed grain and legume dish. This version staggers ingredients by cooking time for even tenderness.",
    recommended_changes: [
      "Soak the harder legumes overnight.",
      "Salt only after the beans are tender."
    ],
    sources: [
      source("ZIMSOFF - Indigenous Knowledge", "https://our.seedandknowledge.org/wp-content/uploads/2022/09/ZIMSOFF-Harnessing-Zimbabwes-Indigenous-Knowledge-2020.pdf", ["mutakura context", "traditional grains"]),
      source("Wikipedia - Zimbabwean cuisine", "https://en.wikipedia.org/wiki/Zimbabwean_cuisine", ["Zimbabwe food context", "staples"]),
      source("Zimbabwe cuisine - Wikipedia", "https://en.wikipedia.org/wiki/Zimbabwean_cuisine", ["method", "mixed grains and legumes context"])
    ],
    ingredients: [
      ingredient("Base", 1, "cup", "dried maize or samp", "soaked"),
      ingredient("Base", 1, "cup", "cowpeas", "soaked"),
      ingredient("Base", 0.75, "cup", "bambara nuts or peanuts", "soaked"),
      ingredient("Base", 0.75, "cup", "sugar beans", "soaked"),
      ingredient("Cooking", 9, "cups", "water"),
      ingredient("Finishing", 1, "tsp", "salt"),
      ingredient("Finishing", 2, "tbsp", "oil", "optional")
    ],
    steps: [
      step("Start hard grains", "Simmer maize and bambara nuts in water until partly tender.", 60, "first simmer"),
      step("Add beans", "Add cowpeas and sugar beans and continue cooking.", 55, "beans"),
      step("Season", "Add salt when the legumes are soft.", 10, "season"),
      step("Rest", "Rest covered so the grains absorb remaining liquid.", 10, "rest")
    ]
  }),
  recipe({
    slug: "muriwo-unedovi-zw",
    name: "Muriwo Unedovi",
    description:
      "Zimbabwean leafy greens cooked with tomato, onion, and peanut butter into a creamy relish.",
    country_code: "ZW",
    country_name: "Zimbabwe",
    region: "Southern Africa",
    ethnic_group: "Zimbabwean",
    category: "side",
    tags: ["greens", "peanut butter", "Zimbabwe", "relish"],
    diet_tags: ["vegan", "gluten-free", "dairy-free"],
    prep_time_minutes: 15,
    cook_time_minutes: 20,
    difficulty: "easy",
    default_servings: 4,
    story:
      "Muriwo unedovi is the Zimbabwean greens dish that makes peanut butter feel essential. Leafy greens, tomato, onion, and dovi become a creamy relish for sadza.",
    occasion: "Best for sadza plates, quick lunches, and vegetable sides.",
    best_served_with: "Sadza, rice, grilled meat, beans, or mazondo.",
    regional_variations:
      "Rape greens, covo, kale, spinach, or pumpkin leaves can all be used, and peanut levels vary by family.",
    calories: 240,
    protein_g: 10,
    carbs_g: 18,
    fat_g: 15,
    fiber_g: 7,
    review_summary:
      "Sources agree on greens cooked with tomato, onion, and peanut butter. This version thins peanut butter first so it coats the greens smoothly.",
    recommended_changes: [
      "Do not overcook the greens before adding peanut.",
      "Thin peanut butter with warm water for a smooth sauce."
    ],
    sources: [
      source("ZimboKitchen - Muriwo uneDovi", "https://www.zimbokitchen.com/traditional-spinach-nedovi-in-peanut-butter/", ["greens", "peanut butter", "Zimbabwe method"]),
      source("Princess Tafadzwa - Muriwo Unedovi", "https://www.princesstafadzwa.com/recipe-muriwo-unedovi-greens-in-peanut-sauce/", ["recipe method", "Zimbabwe context"]),
      source("FoodieAtlas - Muriwo Unedovi", "https://foodieatlas.com/zimbabwe/muriwo-unedovi/index.html", ["dish identity", "serving"])
    ],
    ingredients: [
      ingredient("Greens", 600, "g", "covo, kale, or spinach", "chopped"),
      ingredient("Base", 1, "tbsp", "oil"),
      ingredient("Base", 1, "medium", "onion", "chopped"),
      ingredient("Base", 2, "medium", "tomatoes", "chopped"),
      ingredient("Peanut", 0.33, "cup", "peanut butter"),
      ingredient("Liquid", 0.5, "cup", "warm water"),
      ingredient("Finishing", 0, "", "salt", "to taste")
    ],
    steps: [
      step("Cook base", "Cook onion and tomatoes in oil until soft.", 8, "base"),
      step("Wilt greens", "Add greens and cook until just tender.", 6, "greens"),
      step("Add peanut", "Whisk peanut butter with warm water and stir into the greens.", 4, "peanut"),
      step("Finish", "Simmer until creamy and season with salt.", 3, "finish")
    ]
  }),
  recipe({
    slug: "likhobe-ls",
    name: "Likhobe",
    description:
      "Lesotho bean, sorghum, and grain stew cooked slowly into a nourishing mountain staple.",
    country_code: "LS",
    country_name: "Lesotho",
    region: "Southern Africa",
    ethnic_group: "Basotho",
    category: "main",
    tags: ["beans", "sorghum", "Lesotho", "stew"],
    diet_tags: ["vegan", "dairy-free"],
    prep_time_minutes: 20,
    cook_time_minutes: 120,
    difficulty: "easy",
    default_servings: 6,
    story:
      "Likhobe is a Basotho grain-and-bean dish, practical for mountain weather and built from ingredients that hold well: beans, sorghum, and other grains cooked until tender.",
    occasion: "Best for cold days, meal prep, and vegetarian family mains.",
    best_served_with: "Moroho, papa, stew, or sour milk.",
    regional_variations:
      "Some versions include wheat berries, sorghum, beans, or maize depending on the pantry and season.",
    calories: 430,
    protein_g: 18,
    carbs_g: 78,
    fat_g: 5,
    fiber_g: 16,
    review_summary:
      "Sources identify likhobe as a Lesotho bean and grain stew. This version uses beans, sorghum, and bulgur or wheat berries for a practical home mix.",
    recommended_changes: [
      "Soak beans and grains overnight.",
      "Cook until the beans are fully tender before salting."
    ],
    sources: [
      source("Palatable Pastime - Lesotho Likhobe", "https://palatablepastime.com/2021/06/10/lesotho-likhobe/", ["beans", "sorghum", "method"]),
      source("Wikipedia - Cuisine of Lesotho", "https://en.wikipedia.org/wiki/Cuisine_of_Lesotho", ["dish identity", "Basotho food context"]),
      source("Global Landscapes Forum - Lesotho Likhobe", "https://events.globallandscapesforum.org/wp-content/uploads/sites/2/2020/05/Recipe-lesotho-likhobe.pdf", ["recipe context", "grain and bean stew"])
    ],
    ingredients: [
      ingredient("Base", 1.5, "cups", "speckled beans", "soaked"),
      ingredient("Base", 1, "cup", "sorghum grain", "soaked"),
      ingredient("Base", 0.75, "cup", "bulgur or wheat berries"),
      ingredient("Cooking", 8, "cups", "water"),
      ingredient("Finish", 1, "tsp", "salt"),
      ingredient("Finish", 2, "tbsp", "oil", "optional")
    ],
    steps: [
      step("Start beans", "Simmer soaked beans and sorghum in water until beginning to soften.", 75, "simmer"),
      step("Add grain", "Add bulgur or wheat berries and continue cooking.", 30, "grain"),
      step("Season", "Add salt and oil once everything is tender.", 5, "season"),
      step("Rest", "Rest covered until thick and spoonable.", 10, "rest")
    ]
  })
];

const seen = new Set();
for (const item of recipes) {
  if (seen.has(item.slug)) throw new Error(`Duplicate slug: ${item.slug}`);
  seen.add(item.slug);
  if (!["Central Africa", "Southern Africa"].includes(item.region)) {
    throw new Error(`${item.slug} has unexpected region ${item.region}`);
  }
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
  batch_id: "2026-05-02-central-southern-wave-1",
  reviewed_at: reviewedAt,
  notes:
    "Central and Southern Africa expansion wave covering underrepresented Angolan, Cameroonian, Congolese, Gabonese, Chadian, South African, Botswanan, Namibian, Zimbabwean, and Basotho dishes. Recipes are synthesized from multiple culinary, cultural, and household-style references, not copied from a single source.",
  recipes
};

fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
fs.writeFileSync(OUT_PATH, `${JSON.stringify(batch, null, 2)}\n`, "utf8");
console.log(`Wrote ${recipes.length} recipes to ${path.relative(ROOT, OUT_PATH)}`);
