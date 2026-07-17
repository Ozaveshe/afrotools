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
  "2026-05-02-west-africa-wave-1.json"
);

const reviewedAt = "2026-05-02";
const officialSourceStatus =
  "No direct ministry recipe page was found for this dish in this batch pass. The recipe is synthesized from multiple culinary, cultural, and household-style references.";

function source(title, url, supports) {
  return { title, url, source_type: "culinary reference", supports };
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
    region: "West Africa",
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
    slug: "atassi-watche-bj",
    name: "Atassi Watche",
    description:
      "Beninese rice and beans cooked tender and served with a concentrated tomato dja sauce, eggs, fish, or wagasi.",
    country_code: "BJ",
    country_name: "Benin",
    ethnic_group: "Fon, Dendi, Bariba, and Beninese",
    category: "main",
    tags: ["rice", "beans", "dja sauce", "street food"],
    diet_tags: ["gluten-free", "dairy-free"],
    prep_time_minutes: 20,
    cook_time_minutes: 85,
    difficulty: "medium",
    default_servings: 6,
    story:
      "Atassi in southern Benin and Watche in the north is one of the country's everyday anchors: rice and beans cooked together, then lifted by dja, pepper, fish, egg, cheese, or meat.",
    occasion: "Best for lunch plates, market-style meals, and meal prep.",
    best_served_with: "Dja tomato sauce, fried fish, boiled eggs, wagasi cheese, or chili.",
    regional_variations:
      "Northern versions may use potash and a firmer bean texture, while southern plates often lean into oily tomato dja and fried accompaniments.",
    calories: 430,
    protein_g: 16,
    carbs_g: 70,
    fat_g: 11,
    fiber_g: 12,
    review_summary:
      "Sources agree that the core is rice and beans, commonly served with dja or friture, plus optional fish, eggs, cheese, or meat. The AfroKitchen version keeps the grain ratio balanced and gives the sauce its own simmer.",
    recommended_changes: [
      "Soak the beans so they cook before the rice breaks down.",
      "Salt after the beans soften, not at the beginning."
    ],
    sources: [
      source("Embassy Direct - Atassi or Watche Benin", "https://www.embassydirect.co.za/2020/05/27/atassi-or-watche-benin/", ["rice and beans", "dja sauce", "timing"]),
      source("Benin News - Atassi ou Watche ou Ayimolou", "https://benin-news.com/2024/12/22/cuisine-preparation-du-atassi-ou-watche-ou-ayimolou/", ["regional naming", "serving options", "rice and beans"])
    ],
    ingredients: [
      ingredient("Rice and beans", 1.5, "cups", "black-eyed peas or red beans", "soaked overnight"),
      ingredient("Rice and beans", 1.5, "cups", "long-grain rice", "rinsed"),
      ingredient("Rice and beans", 6, "cups", "water"),
      ingredient("Dja sauce", 4, "tbsp", "peanut oil"),
      ingredient("Dja sauce", 2, "large", "onions", "sliced"),
      ingredient("Dja sauce", 5, "medium", "tomatoes", "chopped"),
      ingredient("Dja sauce", 2, "tbsp", "tomato paste"),
      ingredient("Dja sauce", 1, "tbsp", "ground dried shrimp"),
      ingredient("Dja sauce", 1, "tsp", "grated ginger"),
      ingredient("Dja sauce", 2, "cloves", "garlic", "minced"),
      ingredient("Finishing", 0, "", "salt and pepper", "to taste")
    ],
    steps: [
      step("Cook the beans", "Simmer soaked beans in water until just tender but not falling apart.", 45, "bean simmer"),
      step("Add the rice", "Stir in rinsed rice and salt, then cook uncovered until the rice is tender and the beans hold their shape.", 22, "rice cook"),
      step("Build the dja", "Cook onions in oil, add tomatoes, tomato paste, dried shrimp, ginger, and garlic, then simmer into a thick red sauce.", 25, "dja sauce"),
      step("Serve market-style", "Spoon rice and beans onto plates and top with dja, fish, egg, wagasi, or chili.", 3, "plate")
    ]
  }),
  recipe({
    slug: "poisson-moyo-bj",
    name: "Poisson au Moyo",
    description:
      "Beninese grilled fish with a bright raw-style tomato, onion, lemon, herb, and chili moyo sauce.",
    country_code: "BJ",
    country_name: "Benin",
    ethnic_group: "Beninese coastal",
    category: "seafood",
    tags: ["fish", "moyo", "grilled", "tomato"],
    diet_tags: ["gluten-free", "dairy-free"],
    prep_time_minutes: 35,
    cook_time_minutes: 20,
    difficulty: "easy",
    default_servings: 4,
    story:
      "Moyo is the sauce that makes simple grilled fish feel like a full coastal plate: tomato, onion, chile, lemon, herbs, and enough salt to wake up the fish.",
    occasion: "Best for weekend grills, beach-style lunches, and quick seafood dinners.",
    best_served_with: "Atassi, ablo, akassa, fried plantain, or steamed rice.",
    regional_variations:
      "Some cooks keep moyo raw and sharp, while others briefly warm the tomato-onion mixture with oil or smoked fish.",
    calories: 360,
    protein_g: 42,
    carbs_g: 9,
    fat_g: 17,
    fiber_g: 3,
    review_summary:
      "Sources point to grilled or braised fish served with a fresh tomato-onion-chili moyo. The AfroKitchen version seasons the fish simply and keeps the sauce bright.",
    recommended_changes: [
      "Use firm fish so it does not break on the grill.",
      "Salt the sauce shortly before serving so the tomatoes stay lively."
    ],
    sources: [
      source("I've Been Cooking - Poisson Braise au Moyo", "https://ivebeen.cooking/recipes/poisson-braise-au-moyo", ["grilled fish", "moyo sauce", "tomato and onion"]),
      source("BeninInfo - Les recettes du Benin", "https://benininfo.com/les-recettes-du-benin-la-cuisine-beninoise-est-riche-variee-et-savoureuse", ["Beninese sauces", "fish context", "local staples"])
    ],
    ingredients: [
      ingredient("Fish", 4, "whole", "tilapia or snapper", "cleaned and scored"),
      ingredient("Fish", 2, "tbsp", "oil"),
      ingredient("Fish", 1, "tsp", "paprika"),
      ingredient("Fish", 1, "tsp", "salt"),
      ingredient("Fish", 0.5, "tsp", "black pepper"),
      ingredient("Moyo", 4, "medium", "tomatoes", "finely diced"),
      ingredient("Moyo", 1, "large", "red onion", "finely diced"),
      ingredient("Moyo", 2, "whole", "fresh chilies", "minced"),
      ingredient("Moyo", 2, "tbsp", "lemon juice"),
      ingredient("Moyo", 2, "tbsp", "chopped parsley or cilantro"),
      ingredient("Moyo", 1, "tbsp", "peanut oil")
    ],
    steps: [
      step("Season the fish", "Rub fish with oil, paprika, salt, and pepper, including the cuts along the sides.", 10, "season"),
      step("Make the moyo", "Mix tomatoes, onion, chilies, lemon juice, herbs, oil, and salt. Let it stand while the fish cooks.", 15, "moyo rest"),
      step("Grill the fish", "Grill or broil the fish until the skin chars lightly and the flesh flakes cleanly.", 14, "grill"),
      step("Spoon and serve", "Top the fish with moyo and serve immediately while the sauce is fresh.", 2, "finish")
    ]
  }),
  recipe({
    slug: "dakouin-bj",
    name: "Dakouin",
    description:
      "Mono-region Beninese fish, tomato, and gari dish where cassava granules thicken a deeply seasoned fish broth.",
    country_code: "BJ",
    country_name: "Benin",
    ethnic_group: "Mono coastal Beninese",
    category: "main",
    tags: ["gari", "fish", "tomato", "cassava"],
    diet_tags: ["gluten-free", "dairy-free"],
    prep_time_minutes: 20,
    cook_time_minutes: 45,
    difficulty: "medium",
    default_servings: 5,
    story:
      "Dakouin is practical coastal cooking: fresh fish becomes broth, tomatoes give body, and gari turns the pot into a spoonable cassava meal.",
    occasion: "Best for fresh-fish days, family lunch, and rainy-season comfort.",
    best_served_with: "Extra moyo, sliced onion, or a small pepper sauce.",
    regional_variations:
      "Some versions use tilapia, others use the day's catch, and the gari can be loose like couscous or thick like a soft mash.",
    calories: 390,
    protein_g: 32,
    carbs_g: 42,
    fat_g: 12,
    fiber_g: 6,
    review_summary:
      "Sources identify Dakouin as fish, tomatoes, and gari. The AfroKitchen version makes a separate seasoned broth before folding in gari so the texture stays controlled.",
    recommended_changes: [
      "Add gari gradually; it thickens fast.",
      "Keep the fish pieces large so they survive the final fold."
    ],
    sources: [
      source("Point-Afrique Benin - Dakouin", "https://www.pointbenin.com/en/cultural-pages/7s9-dakouin", ["fish broth", "gari", "Benin Mono context"]),
      source("Recettes d'Afrique - Dakouin avec sauce rouge", "https://recettesdafrique.com/recette/dakouin-avec-sauce-rouge-poisson-et-gari/", ["tomato sauce", "fish", "gari"])
    ],
    ingredients: [
      ingredient("Fish broth", 800, "g", "fresh tilapia or snapper", "cut into large pieces"),
      ingredient("Fish broth", 4, "medium", "tomatoes", "chopped"),
      ingredient("Fish broth", 1, "large", "onion", "sliced"),
      ingredient("Fish broth", 2, "cloves", "garlic", "crushed"),
      ingredient("Fish broth", 1, "whole", "hot pepper"),
      ingredient("Fish broth", 2, "tbsp", "palm oil or peanut oil"),
      ingredient("Cassava", 2, "cups", "gari", "plus more if needed"),
      ingredient("Liquid", 4, "cups", "water or fish stock"),
      ingredient("Finishing", 0, "", "salt and black pepper", "to taste")
    ],
    steps: [
      step("Start the broth", "Simmer tomatoes, onion, garlic, pepper, oil, and water until the tomatoes collapse.", 18, "broth base"),
      step("Cook the fish", "Add fish pieces and simmer gently until cooked through.", 12, "fish simmer"),
      step("Fold in gari", "Lower the heat and sprinkle in gari gradually, stirring until the broth thickens but stays moist.", 8, "gari fold", "Stop before it becomes stiff; it firms as it rests."),
      step("Rest and serve", "Cover for a few minutes, adjust salt, and serve hot with extra sauce.", 5, "rest")
    ]
  }),
  recipe({
    slug: "benga-bf",
    name: "Benga",
    description:
      "Burkinabe rice and beans plate, simple, nourishing, and usually finished with tomato-onion sauce or chili oil.",
    country_code: "BF",
    country_name: "Burkina Faso",
    ethnic_group: "Mossi and Burkinabe",
    category: "main",
    tags: ["beans", "rice", "everyday food", "mossi"],
    diet_tags: ["vegan", "gluten-free", "dairy-free"],
    prep_time_minutes: 20,
    cook_time_minutes: 75,
    difficulty: "easy",
    default_servings: 6,
    story:
      "Benga means beans in Moore and the dish carries that simplicity proudly: beans, rice, sauce, pepper, and a pot that can feed a household.",
    occasion: "Best for everyday lunch, school-night cooking, and market plates.",
    best_served_with: "Tomato sauce, chili oil, fried onions, or grilled chicken.",
    regional_variations:
      "Some households cook rice and beans together, while others serve tender beans over rice with sauce.",
    calories: 410,
    protein_g: 15,
    carbs_g: 74,
    fat_g: 8,
    fiber_g: 13,
    review_summary:
      "Sources frame benga as a central Burkinabe beans dish, commonly paired with rice and sauce. The AfroKitchen version cooks beans first, then folds in rice for a reliable texture.",
    recommended_changes: [
      "Use soaked beans for even cooking.",
      "Keep the sauce separate if serving to a crowd."
    ],
    sources: [
      source("Infos Culture du Faso - Le benga", "https://www.infosculturedufaso.net/le-benga-pilier-de-la-cuisine-burkinabe-un-plat-simple-nourrissant-et-populaire/", ["Burkinabe staple", "beans", "popular food"]),
      source("GIZ Soilicious Cookbook", "https://www.giz.de/en/downloads/giz2024-en-Soilicious-cookbook.pdf", ["Burkinabe benga context", "beans and rice", "household variation"])
    ],
    ingredients: [
      ingredient("Beans", 2, "cups", "black-eyed peas", "soaked overnight"),
      ingredient("Rice", 1.5, "cups", "long-grain rice", "rinsed"),
      ingredient("Sauce", 3, "tbsp", "oil"),
      ingredient("Sauce", 2, "large", "onions", "sliced"),
      ingredient("Sauce", 3, "medium", "tomatoes", "chopped"),
      ingredient("Sauce", 1, "tbsp", "tomato paste"),
      ingredient("Sauce", 1, "whole", "hot pepper"),
      ingredient("Liquid", 7, "cups", "water"),
      ingredient("Finishing", 0, "", "salt", "to taste")
    ],
    steps: [
      step("Cook beans", "Simmer soaked beans in water until tender.", 45, "bean simmer"),
      step("Add rice", "Add rinsed rice and enough hot water to cover. Cook until the rice is tender and liquid is absorbed.", 22, "rice cook"),
      step("Make sauce", "Cook onions in oil, add tomatoes, tomato paste, pepper, and salt, then simmer into a spoonable sauce.", 18, "tomato sauce"),
      step("Plate", "Serve rice and beans with the sauce spooned over the top.", 2, "serve")
    ]
  }),
  recipe({
    slug: "gonre-bf",
    name: "Gonre",
    description:
      "Burkinabe steamed bean cakes made from cowpea paste, peanut, leafy greens, and maize couscous.",
    country_code: "BF",
    country_name: "Burkina Faso",
    ethnic_group: "Mossi",
    category: "side",
    tags: ["beans", "steamed", "peanut", "leafy greens"],
    diet_tags: ["vegan", "gluten-free", "dairy-free"],
    prep_time_minutes: 45,
    cook_time_minutes: 45,
    difficulty: "medium",
    default_servings: 6,
    serving_unit: "cakes",
    story:
      "Gonre is a Mossi bean dish with two moods: smooth in the dry season and leaf-rich when bean leaves are available.",
    occasion: "Best for breakfast markets, snack plates, and ceremonial family cooking.",
    best_served_with: "Tomato sauce, chili oil, or a light onion relish.",
    regional_variations:
      "Leafy versions include bean leaves or greens; simpler versions are mostly cowpea paste and seasoning.",
    calories: 290,
    protein_g: 14,
    carbs_g: 36,
    fat_g: 10,
    fiber_g: 9,
    review_summary:
      "Sources agree that gonre is based on cowpeas and often steamed into cakes, sometimes enriched with greens, peanuts, maize couscous, and potash. The AfroKitchen version skips potash unless available.",
    recommended_changes: [
      "Whip the bean paste so the cakes are not heavy.",
      "Oil the steamer leaves or cups before filling."
    ],
    sources: [
      source("RestoQuebec - Gonre", "https://www.restoquebec.ca/articles/l/gonre/1733/fr/", ["Mossi dish", "bean leaves", "peanut", "steaming"]),
      source("Cuisine de Chez Nous - Gonre", "https://www.cuisinedecheznous.net/blog/2022/12/19/du-gonre/", ["bean fritter/cake context", "Burkina Faso", "market food"])
    ],
    ingredients: [
      ingredient("Bean paste", 2, "cups", "black-eyed peas", "soaked and peeled"),
      ingredient("Bean paste", 0.5, "cup", "roasted peanut powder"),
      ingredient("Bean paste", 1, "cup", "finely chopped bean leaves or spinach"),
      ingredient("Bean paste", 0.5, "cup", "fine maize couscous"),
      ingredient("Aromatics", 1, "small", "onion", "chopped"),
      ingredient("Aromatics", 2, "cloves", "garlic"),
      ingredient("Aromatics", 1, "whole", "fresh chili"),
      ingredient("Fat", 2, "tbsp", "oil"),
      ingredient("Finishing", 0, "", "salt", "to taste")
    ],
    steps: [
      step("Blend the beans", "Blend peeled beans with onion, garlic, chili, and just enough water to make a thick paste.", 8, "blend"),
      step("Season and rest", "Fold in peanut powder, greens, maize couscous, oil, and salt. Let the mixture hydrate.", 20, "rest"),
      step("Steam cakes", "Spoon into oiled cups or leaves and steam until firm through the center.", 35, "steam"),
      step("Serve warm", "Unmold and serve with tomato sauce or chili oil.", 3, "finish")
    ]
  }),
  recipe({
    slug: "zamne-bf",
    name: "Zamne",
    description:
      "Burkinabe Acacia seed dish simmered until tender, then dressed with onion, tomato, oil, and chile.",
    country_code: "BF",
    country_name: "Burkina Faso",
    ethnic_group: "Mossi and Sahelian Burkinabe",
    category: "main",
    tags: ["acacia seeds", "terroir food", "sahel", "vegetarian"],
    diet_tags: ["vegan", "gluten-free", "dairy-free"],
    prep_time_minutes: 30,
    cook_time_minutes: 120,
    difficulty: "medium",
    default_servings: 6,
    story:
      "Zamne turns a wild Sahelian seed into a celebration food: long-cooked, chewy, nutty, and often treated like a prized local ingredient.",
    occasion: "Best for special meals, ceremonies, and vegetarian sharing plates.",
    best_served_with: "Rice, couscous, grilled meat, or a tomato-onion relish.",
    regional_variations:
      "Some cooks serve zamne as a salad, some simmer it with meat, and some dress it simply with oil, onion, tomato, and pepper.",
    calories: 360,
    protein_g: 17,
    carbs_g: 48,
    fat_g: 12,
    fiber_g: 14,
    review_summary:
      "FAO and food science references confirm zamne as an Acacia macrostachya seed dish from Burkina Faso. The AfroKitchen method uses a long boil and a simple tomato-onion finish.",
    recommended_changes: [
      "Soak and rinse the seeds well.",
      "Cook until tender before adding acidic tomato."
    ],
    sources: [
      source("FAO - Zamne ou Piga", "https://www.fao.org/in-action/inpho/resources/cookbook/detail/en/c/562/", ["Burkina Faso", "zamne", "main dish"]),
      source("PMC - Physical, cooking, and nutritional properties of Zamne", "https://pmc.ncbi.nlm.nih.gov/articles/PMC7575534/", ["Acacia seed", "terroir food", "cooking properties"])
    ],
    ingredients: [
      ingredient("Seeds", 2, "cups", "zamne seeds", "soaked overnight"),
      ingredient("Seeds", 8, "cups", "water", "for boiling"),
      ingredient("Relish", 3, "tbsp", "oil"),
      ingredient("Relish", 2, "large", "onions", "sliced"),
      ingredient("Relish", 3, "medium", "tomatoes", "chopped"),
      ingredient("Relish", 1, "whole", "hot pepper", "minced"),
      ingredient("Relish", 1, "tsp", "ground soumbala", "optional"),
      ingredient("Finishing", 0, "", "salt", "to taste")
    ],
    steps: [
      step("Boil the seeds", "Rinse soaked zamne and boil in plenty of water until tender.", 90, "seed boil"),
      step("Drain and season", "Drain the seeds and salt them lightly while hot.", 5, "season"),
      step("Cook relish", "Cook onions in oil until soft, then add tomato, pepper, and soumbala until jammy.", 20, "relish"),
      step("Combine", "Fold zamne through the relish and simmer briefly so the seeds absorb the sauce.", 10, "finish")
    ]
  }),
  recipe({
    slug: "jagacida-cv",
    name: "Jagacida",
    description:
      "Cape Verdean beans and rice cooked with onion, garlic, bay, and linguiça-style sausage or kept vegetarian.",
    country_code: "CV",
    country_name: "Cape Verde",
    ethnic_group: "Cape Verdean",
    category: "main",
    tags: ["rice", "beans", "creole", "sausage"],
    diet_tags: ["gluten-free", "dairy-free"],
    prep_time_minutes: 10,
    cook_time_minutes: 30,
    difficulty: "easy",
    default_servings: 6,
    story:
      "Jagacida, often shortened to jag, is the kind of Cape Verdean rice dish that can be a side, a quick lunch, or the base for a bigger plate.",
    occasion: "Best for weeknight dinners, cookouts, and family sides.",
    best_served_with: "Grilled fish, cachupa leftovers, fried eggs, or hot sauce.",
    regional_variations:
      "Some families use kidney beans, lima beans, or peas; some add linguiça while others keep it vegetarian.",
    calories: 420,
    protein_g: 15,
    carbs_g: 66,
    fat_g: 11,
    fiber_g: 8,
    review_summary:
      "Sources agree on a Cape Verdean beans-and-rice base with onion and garlic, sometimes with sausage. The AfroKitchen version treats sausage as optional.",
    recommended_changes: [
      "Use cooked beans or canned beans so the rice timing stays predictable.",
      "Let the rice steam off heat before fluffing."
    ],
    sources: [
      source("Oldways - Jagacida Cape Verdean Beans Rice", "https://oldwayspt.org/recipe/jagacida-cape-verdean-beans-rice/", ["beans and rice", "Cape Verdean cuisine", "onion and garlic"]),
      source("URI Community Nutrition - Jagacida", "https://web.uri.edu/community-nutrition/jagacida/", ["rice", "beans", "Cape Verdean community recipe"])
    ],
    ingredients: [
      ingredient("Base", 2, "cups", "long-grain rice", "rinsed"),
      ingredient("Base", 2, "cups", "cooked kidney beans or lima beans", "drained"),
      ingredient("Base", 1, "cup", "linguica or smoked sausage", "sliced", "omit for vegetarian"),
      ingredient("Aromatics", 1, "large", "onion", "chopped"),
      ingredient("Aromatics", 3, "cloves", "garlic", "minced"),
      ingredient("Seasoning", 2, "whole", "bay leaves"),
      ingredient("Fat", 2, "tbsp", "olive oil"),
      ingredient("Liquid", 3, "cups", "water or light stock"),
      ingredient("Finishing", 0, "", "salt and pepper", "to taste")
    ],
    steps: [
      step("Brown aromatics", "Cook onion, garlic, and sausage in oil until fragrant and lightly browned.", 8, "aromatics"),
      step("Coat the rice", "Stir in rice, beans, bay leaves, salt, and pepper so the grains are glossy.", 3, "coat"),
      step("Simmer", "Add water or stock, cover, and cook until rice is tender.", 18, "rice simmer"),
      step("Steam and fluff", "Rest off heat, covered, then fluff gently and serve.", 7, "steam")
    ]
  }),
  recipe({
    slug: "xerem-cv",
    name: "Xerem",
    description:
      "Cape Verdean cracked-corn porridge or stew, cooked savory with bay, butter, beans, greens, and smoked meat or fish.",
    country_code: "CV",
    country_name: "Cape Verde",
    ethnic_group: "Cape Verdean",
    category: "main",
    tags: ["corn", "porridge", "savory", "creole"],
    diet_tags: ["gluten-free"],
    prep_time_minutes: 15,
    cook_time_minutes: 80,
    difficulty: "medium",
    default_servings: 6,
    story:
      "Xerem shows Cape Verde's corn table from another angle: not cachupa, but a thick cracked-corn dish that can be simple or feast-day rich.",
    occasion: "Best for cool evenings, family pots, and rustic one-bowl meals.",
    best_served_with: "Braised greens, fish stew, beans, or hot sauce.",
    regional_variations:
      "Some versions are plain and buttery, while feast versions include pork, beans, squash, cabbage, or greens.",
    calories: 470,
    protein_g: 18,
    carbs_g: 64,
    fat_g: 16,
    fiber_g: 9,
    review_summary:
      "Cape Verdean sources identify xerem as a corn dish, often savory and served with soup or enriched as a stew. The AfroKitchen version builds a complete savory pot.",
    recommended_changes: [
      "Stir often because cracked corn catches on the bottom.",
      "Add extra hot water as needed for a soft porridge texture."
    ],
    sources: [
      source("ExcitedFood - Xerem de Festa", "https://excitedfood.com/recipes/xerem-de-festa", ["Cape Verde", "corn", "salted pork"]),
      source("Travel Food Atlas - Cape Verde Food", "https://travelfoodatlas.com/cape-verde-food", ["xerem", "Cape Verdean corn dish", "traditional context"])
    ],
    ingredients: [
      ingredient("Corn", 2, "cups", "cracked corn or coarse cornmeal"),
      ingredient("Protein", 250, "g", "smoked sausage or salted pork", "diced", "smoked fish for seafood version"),
      ingredient("Beans and greens", 1.5, "cups", "cooked beans"),
      ingredient("Beans and greens", 2, "cups", "shredded kale or cabbage"),
      ingredient("Aromatics", 1, "large", "onion", "chopped"),
      ingredient("Aromatics", 2, "cloves", "garlic", "minced"),
      ingredient("Seasoning", 2, "whole", "bay leaves"),
      ingredient("Fat", 2, "tbsp", "butter or olive oil"),
      ingredient("Liquid", 7, "cups", "water or light stock"),
      ingredient("Finishing", 0, "", "salt and black pepper", "to taste")
    ],
    steps: [
      step("Start the pot", "Cook onion, garlic, and smoked meat in butter or oil until aromatic.", 8, "base"),
      step("Simmer corn", "Add cracked corn, bay leaves, and stock. Simmer, stirring often, until the corn softens.", 45, "corn simmer"),
      step("Add beans and greens", "Stir in beans and greens and continue cooking until the pot is thick and cohesive.", 20, "finish simmer"),
      step("Rest", "Season, rest covered, and serve warm.", 5, "rest")
    ]
  }),
  recipe({
    slug: "buzio-caboverdiano-cv",
    name: "Buzio Caboverdiano",
    description:
      "Cape Verdean sea snail or conch stew slow-cooked with onion, garlic, tomato, pepper, bay, potatoes, and herbs.",
    country_code: "CV",
    country_name: "Cape Verde",
    ethnic_group: "Cape Verdean coastal",
    category: "seafood",
    tags: ["conch", "seafood", "stew", "island food"],
    diet_tags: ["gluten-free", "dairy-free"],
    prep_time_minutes: 30,
    cook_time_minutes: 95,
    difficulty: "medium",
    default_servings: 5,
    story:
      "Buzio brings Cape Verde's coastline to the pot: a slow seafood stew where tough conch turns tender and the sauce gathers tomato, bay, and island herbs.",
    occasion: "Best for seafood weekends, coastal menus, and celebration lunches.",
    best_served_with: "Rice, boiled root vegetables, bread, or xerem.",
    regional_variations:
      "Depending on the island, cooks may use conch, whelk, mixed shellfish, potatoes, carrots, wine, or soy sauce.",
    calories: 360,
    protein_g: 34,
    carbs_g: 28,
    fat_g: 12,
    fiber_g: 5,
    review_summary:
      "Cape Verdean recipe sources agree that buzio is a slow-cooked shellfish stew. The AfroKitchen version tenderizes conch first, then finishes it in tomato and aromatics.",
    recommended_changes: [
      "Tenderize conch before stewing.",
      "Keep the final simmer gentle so shellfish stays pleasant."
    ],
    sources: [
      source("Balai CV - Guisado de Buzios", "https://www.balai.cv/balai-style/guisado-de-buzios/", ["Cape Verde", "buzio stew", "shellfish"]),
      source("Traditional Cape Verde Sea Cookbook", "https://www.ulpgc.es/sites/default/files/ArchivosULPGC/aulasculturales/recetario_cocina_marinera_tradicional_cabo_verde.pdf", ["buzio", "pressure cooking", "seafood tradition"])
    ],
    ingredients: [
      ingredient("Seafood", 900, "g", "cleaned conch or whelk", "pounded and cut up"),
      ingredient("Vegetables", 2, "medium", "potatoes", "cubed"),
      ingredient("Vegetables", 2, "medium", "carrots", "cubed"),
      ingredient("Sauce", 1, "large", "onion", "chopped"),
      ingredient("Sauce", 4, "cloves", "garlic", "minced"),
      ingredient("Sauce", 3, "medium", "tomatoes", "chopped"),
      ingredient("Sauce", 1, "small", "green bell pepper", "diced"),
      ingredient("Seasoning", 2, "whole", "bay leaves"),
      ingredient("Fat", 3, "tbsp", "olive oil"),
      ingredient("Liquid", 3, "cups", "fish stock or water"),
      ingredient("Finishing", 2, "tbsp", "parsley or cilantro", "chopped")
    ],
    steps: [
      step("Tenderize shellfish", "Simmer or pressure-cook conch in salted water until it begins to soften.", 55, "tenderize"),
      step("Build sauce", "Cook onion, garlic, tomato, pepper, and bay in oil until the tomato breaks down.", 15, "sauce"),
      step("Stew", "Add conch, potatoes, carrots, and stock. Simmer until vegetables and shellfish are tender.", 30, "stew"),
      step("Finish herbs", "Adjust salt, add herbs, and rest briefly before serving.", 5, "finish")
    ]
  }),
  recipe({
    slug: "plasas-gm",
    name: "Plasas",
    description:
      "Gambian leafy stew with spinach or cassava leaves, peanut, palm oil, smoked fish, and chili.",
    country_code: "GM",
    country_name: "Gambia",
    ethnic_group: "Gambian",
    category: "stew",
    tags: ["leafy greens", "peanut", "smoked fish", "stew"],
    diet_tags: ["gluten-free", "dairy-free"],
    prep_time_minutes: 20,
    cook_time_minutes: 75,
    difficulty: "medium",
    default_servings: 6,
    story:
      "Plasas is Gambian leaf stew comfort: greens cooked down with peanut richness, smoked fish depth, and enough pepper to wake up rice or fufu.",
    occasion: "Best for rice plates, family lunch, and greens-heavy dinners.",
    best_served_with: "White rice, fufu, boiled cassava, or plantain.",
    regional_variations:
      "Cassava leaves, spinach, bitter leaves, fish, chicken, beef, or vegetarian peanut versions all appear across households.",
    calories: 420,
    protein_g: 24,
    carbs_g: 19,
    fat_g: 28,
    fiber_g: 8,
    review_summary:
      "Gambian references describe plasas as a leafy stew, often spinach or cassava leaves. The AfroKitchen version uses smoked fish and peanut for a common household profile.",
    recommended_changes: [
      "Cook cassava leaves thoroughly if using them.",
      "Add peanut paste after greens soften so it does not scorch."
    ],
    sources: [
      source("Access Gambia - Plasas", "https://www.accessgambia.com/information/plasas-dish.html", ["Gambian plasas", "spinach stew", "long simmer"]),
      source("My Gambia - Gambian vegetables", "https://www.my-gambia.com/mymagazine/must-try-vegetables-available-in-the-gambia/", ["cassava leaves", "plasas context", "Gambian meals"])
    ],
    ingredients: [
      ingredient("Greens", 700, "g", "spinach or cassava leaves", "finely chopped"),
      ingredient("Protein", 250, "g", "smoked fish", "flaked and deboned"),
      ingredient("Sauce", 0.5, "cup", "peanut butter or ground peanuts"),
      ingredient("Sauce", 0.25, "cup", "palm oil"),
      ingredient("Aromatics", 1, "large", "onion", "chopped"),
      ingredient("Aromatics", 3, "cloves", "garlic", "minced"),
      ingredient("Aromatics", 1, "whole", "scotch bonnet", "left whole or minced"),
      ingredient("Liquid", 3, "cups", "water or light stock"),
      ingredient("Finishing", 0, "", "salt and black pepper", "to taste")
    ],
    steps: [
      step("Soften aromatics", "Cook onion, garlic, and pepper in palm oil until fragrant.", 8, "base"),
      step("Cook the greens", "Add greens and stock, then simmer until tender and reduced.", 35, "greens"),
      step("Add peanut and fish", "Stir in peanut butter and smoked fish. Simmer until thick and rich.", 25, "stew"),
      step("Serve", "Adjust seasoning and serve hot over rice or with fufu.", 3, "finish")
    ]
  }),
  recipe({
    slug: "chicken-yassa-gm",
    name: "Gambian Chicken Yassa",
    description:
      "Gambian chicken marinated in mustard, vinegar or lemon, onion, garlic, pepper, then fried and simmered with onion sauce.",
    country_code: "GM",
    country_name: "Gambia",
    ethnic_group: "Senegambian and Gambian",
    category: "main",
    tags: ["chicken", "onion", "mustard", "rice"],
    diet_tags: ["gluten-free", "dairy-free"],
    prep_time_minutes: 45,
    cook_time_minutes: 50,
    difficulty: "medium",
    default_servings: 6,
    story:
      "Yassa belongs to the Senegambian table, and in The Gambia it is a trusted chicken-and-rice plate built on sharp onions, mustard, and a good fry before the simmer.",
    occasion: "Best for Sunday rice, gatherings, and onion lovers.",
    best_served_with: "White rice, cucumber salad, or fried plantain.",
    regional_variations:
      "Some cooks use vinegar, some use lemon, some add carrots or green pepper, and fish yassa is also common.",
    calories: 520,
    protein_g: 38,
    carbs_g: 18,
    fat_g: 33,
    fiber_g: 4,
    review_summary:
      "Gambian sources agree on chicken, onions, mustard, vinegar or lemon, garlic, pepper, frying, and a rice service. The AfroKitchen version gives the onion enough time to soften.",
    recommended_changes: [
      "Marinate at least 30 minutes, longer if possible.",
      "Brown the chicken before simmering for better depth."
    ],
    sources: [
      source("My Gambia - Traditional Dish Recipe Yassa", "https://www.my-gambia.com/mymagazine/recipe-yassa/", ["Gambian yassa", "chicken", "mustard", "onions"]),
      source("Access Gambia - Chicken Yassa", "https://accessgambia.com/information/chicken-yassa.html", ["Gambia style", "marinade", "rice service"])
    ],
    ingredients: [
      ingredient("Chicken", 1.5, "kg", "chicken pieces", "skin removed if preferred"),
      ingredient("Marinade", 5, "large", "onions", "sliced"),
      ingredient("Marinade", 4, "tbsp", "mustard"),
      ingredient("Marinade", 0.25, "cup", "lemon juice or vinegar"),
      ingredient("Marinade", 4, "cloves", "garlic", "minced"),
      ingredient("Marinade", 1, "tbsp", "fresh ginger", "grated"),
      ingredient("Marinade", 1, "whole", "scotch bonnet", "minced or left whole"),
      ingredient("Cooking", 0.25, "cup", "oil"),
      ingredient("Cooking", 1, "cup", "water or chicken stock"),
      ingredient("Finishing", 0, "", "salt and black pepper", "to taste")
    ],
    steps: [
      step("Marinate chicken", "Mix chicken with onions, mustard, lemon or vinegar, garlic, ginger, pepper, salt, and black pepper.", 30, "marinate"),
      step("Brown chicken", "Lift chicken from the onions and fry until golden on both sides.", 12, "brown"),
      step("Cook onion sauce", "Cook the marinated onions in the same pot until soft and lightly caramelized.", 18, "onions"),
      step("Simmer together", "Return chicken to the pot with stock and simmer until tender and coated in onion sauce.", 25, "simmer")
    ]
  }),
  recipe({
    slug: "nyambeh-nyebeh-gm",
    name: "Nyambeh Nyebeh",
    description:
      "Gambian cassava and beans served with a spicy onion-pepper stew, often eaten for breakfast or dinner.",
    country_code: "GM",
    country_name: "Gambia",
    ethnic_group: "Gambian",
    category: "main",
    tags: ["cassava", "beans", "street food", "comfort food"],
    diet_tags: ["vegan", "gluten-free", "dairy-free"],
    prep_time_minutes: 25,
    cook_time_minutes: 65,
    difficulty: "medium",
    default_servings: 5,
    story:
      "Nyambeh means cassava and nyebeh means beans, and that tells the truth of the plate: humble roots and legumes made generous with stew.",
    occasion: "Best for breakfast plates, dinner bowls, and street-food style meals.",
    best_served_with: "Fried fish, onion gravy, pepper sauce, or roasted sweet potato.",
    regional_variations:
      "Some cooks boil cassava and beans separately, some add sweet potato or plantain, and some finish the stew with fish.",
    calories: 500,
    protein_g: 16,
    carbs_g: 86,
    fat_g: 12,
    fiber_g: 15,
    review_summary:
      "Gambian sources agree on cassava, beans, and a separate vegetable stew or gravy. The AfroKitchen version keeps the root and bean textures separate until plating.",
    recommended_changes: [
      "Cook cassava and beans separately so neither turns mushy.",
      "Keep the onion stew bold because the base is mild."
    ],
    sources: [
      source("My Gambia - Nyambeh Nyebeh", "https://www.my-gambia.com/mymagazine/traditional-dish-recipe-nyambeh-nyebeh/", ["cassava", "beans", "stew", "timing"]),
      source("Creative Phebe - Nyambeh Nyebeh", "https://www.creativephebe.com/the-blog/nyambeh-nyebeh", ["cassava and beans meaning", "comfort dish", "gravy"])
    ],
    ingredients: [
      ingredient("Roots", 900, "g", "cassava", "peeled and cut up"),
      ingredient("Beans", 1.5, "cups", "black-eyed peas", "soaked"),
      ingredient("Stew", 0.25, "cup", "oil"),
      ingredient("Stew", 2, "large", "onions", "sliced"),
      ingredient("Stew", 2, "tbsp", "tomato paste"),
      ingredient("Stew", 2, "medium", "tomatoes", "chopped"),
      ingredient("Stew", 1, "whole", "green pepper", "diced"),
      ingredient("Stew", 2, "cloves", "garlic", "minced"),
      ingredient("Stew", 1, "whole", "hot pepper"),
      ingredient("Finishing", 0, "", "salt and black pepper", "to taste")
    ],
    steps: [
      step("Boil beans", "Simmer soaked beans until tender, then drain and season lightly.", 40, "beans"),
      step("Boil cassava", "Boil cassava in salted water until tender but still holding shape.", 25, "cassava"),
      step("Make stew", "Cook onions, garlic, tomato paste, tomatoes, green pepper, and hot pepper into a thick sauce.", 20, "stew"),
      step("Plate", "Serve cassava and beans with the spicy stew spooned generously over the top.", 3, "serve")
    ]
  }),
  recipe({
    slug: "tuo-zaafi-gh",
    name: "Tuo Zaafi with Ayoyo Soup",
    description:
      "Northern Ghanaian maize swallow served with slippery ayoyo soup and a tomato-pepper stew.",
    country_code: "GH",
    country_name: "Ghana",
    ethnic_group: "Northern Ghanaian",
    category: "main",
    tags: ["maize", "ayoyo", "swallow", "northern ghana"],
    diet_tags: ["gluten-free", "dairy-free"],
    prep_time_minutes: 25,
    cook_time_minutes: 60,
    difficulty: "medium",
    default_servings: 6,
    story:
      "Tuo Zaafi is northern Ghana on a plate: smooth maize dough, ayoyo's draw, and a stew that carries meat, pepper, and dawadawa depth.",
    occasion: "Best for lunch, northern Ghanaian family meals, and soup-and-swallow nights.",
    best_served_with: "Ayoyo soup, tomato stew, goat, beef, or fish.",
    regional_variations:
      "Some cooks use maize flour only, some add cassava flour, and ayoyo may be cooked with dawadawa, okra, or local potash.",
    calories: 520,
    protein_g: 22,
    carbs_g: 78,
    fat_g: 14,
    fiber_g: 9,
    review_summary:
      "Sources identify Tuo Zaafi as a maize swallow paired with ayoyo soup and stew. The AfroKitchen version pairs a smooth maize base with jute leaf soup and a simple meat stew.",
    recommended_changes: [
      "Whisk flour into cool water first to prevent lumps.",
      "Beat the dough firmly until smooth and elastic."
    ],
    sources: [
      source("Pulse Ghana - Tuo Zaafi and Ayoyo Soup", "https://www.pulse.com.gh/story/pulse-food-how-to-prepare-tuo-zaafi-and-ayoyo-soup-2024072318585616323", ["Tuo Zaafi", "ayoyo soup", "Ghana"]),
      source("AfriFoodLinks - Tuo Zaafi with Ayoyo", "https://afrifoodlinks.org/wp-content/uploads/2024/07/Tuo-Zaafi-with-Ayoyo.pdf", ["ayoyo", "goat stew", "pressure cooker method"])
    ],
    ingredients: [
      ingredient("Tuo", 2, "cups", "maize flour"),
      ingredient("Tuo", 0.5, "cup", "cassava flour"),
      ingredient("Tuo", 5, "cups", "water"),
      ingredient("Ayoyo", 4, "cups", "ayoyo or jute leaves", "chopped"),
      ingredient("Ayoyo", 1, "tsp", "ground dawadawa"),
      ingredient("Ayoyo", 1, "whole", "hot pepper"),
      ingredient("Stew", 500, "g", "goat or beef", "cut up"),
      ingredient("Stew", 3, "medium", "tomatoes", "blended"),
      ingredient("Stew", 1, "large", "onion", "sliced"),
      ingredient("Stew", 3, "tbsp", "oil"),
      ingredient("Finishing", 0, "", "salt", "to taste")
    ],
    steps: [
      step("Cook stew", "Simmer meat with onion, tomato, pepper, oil, and salt until tender and saucy.", 35, "stew"),
      step("Cook ayoyo", "Simmer ayoyo with dawadawa, pepper, and a little water until slippery and bright green.", 12, "ayoyo"),
      step("Make tuo", "Whisk maize flour into water, cook to a porridge, then beat in cassava flour until smooth and stretchy.", 18, "tuo"),
      step("Serve", "Shape Tuo Zaafi into mounds and serve with ayoyo soup and stew.", 3, "plate")
    ]
  }),
  recipe({
    slug: "omo-tuo-gh",
    name: "Omo Tuo",
    description:
      "Ghanaian rice balls cooked very soft, beaten smooth, and served with groundnut soup or palm nut soup.",
    country_code: "GH",
    country_name: "Ghana",
    ethnic_group: "Ghanaian and Hausa-influenced",
    category: "side",
    tags: ["rice", "swallow", "groundnut soup", "sunday food"],
    diet_tags: ["vegan", "gluten-free", "dairy-free"],
    prep_time_minutes: 5,
    cook_time_minutes: 40,
    difficulty: "easy",
    default_servings: 6,
    serving_unit: "rice balls",
    story:
      "Omo Tuo is simple in ingredients but serious in texture: soft rice beaten until smooth enough to roll into balls that drink soup properly.",
    occasion: "Best for Sunday groundnut soup, palm nut soup, and family lunch.",
    best_served_with: "Nkate nkwan, palm nut soup, chicken, goat, or fish.",
    regional_variations:
      "Some cooks use broken rice, some use long-grain rice cooked with extra water, and ball size changes by household.",
    calories: 250,
    protein_g: 5,
    carbs_g: 56,
    fat_g: 1,
    fiber_g: 1,
    review_summary:
      "Sources agree that Omo Tuo is rice cooked with extra water, mashed, and shaped into balls, usually paired with groundnut or palm nut soup.",
    recommended_changes: [
      "Use short-grain, broken, or starchy rice for easy shaping.",
      "Wet hands or a bowl before shaping the rice balls."
    ],
    sources: [
      source("196 Flavors - Omo Tuo", "https://www.196flavors.com/ghana-omo-tuo/", ["rice balls", "Ghana", "groundnut soup pairing"]),
      source("Ghanaian Recipes - Omo Tuo", "https://www.ghanaianrecipes.com/rice-balls-omo-tuo/", ["rice balls", "groundnut soup", "method"])
    ],
    ingredients: [
      ingredient("Rice", 3, "cups", "short-grain or broken rice", "rinsed"),
      ingredient("Rice", 7, "cups", "water"),
      ingredient("Finishing", 0, "", "salt", "optional, to taste")
    ],
    steps: [
      step("Cook rice soft", "Boil rice with extra water until very soft and slightly overcooked.", 25, "soft rice"),
      step("Beat rice", "Lower the heat and beat the rice firmly with a wooden spoon until sticky and smooth.", 10, "beat"),
      step("Shape", "Use wet hands or a wet bowl to shape the rice into smooth balls.", 5, "shape"),
      step("Serve with soup", "Serve hot with groundnut soup or palm nut soup.", 1, "serve")
    ]
  }),
  recipe({
    slug: "ga-kenkey-fried-fish-gh",
    name: "Ga Kenkey with Fried Fish",
    description:
      "Ga-style fermented corn dumplings served with fried fish, pepper sauce, and fresh tomato-onion relish.",
    country_code: "GH",
    country_name: "Ghana",
    ethnic_group: "Ga",
    category: "main",
    tags: ["kenkey", "corn", "fermented", "fried fish"],
    diet_tags: ["gluten-free", "dairy-free"],
    prep_time_minutes: 45,
    cook_time_minutes: 90,
    difficulty: "hard",
    default_servings: 6,
    story:
      "Ga kenkey is Accra street-food royalty: fermented corn dough, steamed tight, then eaten with fish, pepper, and fresh relish.",
    occasion: "Best for weekend street-food plates, fish lunches, and coastal Ghana menus.",
    best_served_with: "Fried fish, shito, fresh pepper sauce, tomato, onion, and avocado.",
    regional_variations:
      "Ga kenkey is usually salted and wrapped, while Fante kenkey is often less salty and wrapped differently.",
    calories: 540,
    protein_g: 30,
    carbs_g: 74,
    fat_g: 15,
    fiber_g: 8,
    review_summary:
      "Sources describe kenkey as fermented corn dough, often served with fried fish and pepper. The AfroKitchen version assumes prepared fermented dough for safety and practicality.",
    recommended_changes: [
      "Use trusted fermented corn dough if making it at home.",
      "Steam until the center is fully firm."
    ],
    sources: [
      source("196 Flavors - Kenkey", "https://www.196flavors.com/ghana-kenkey/", ["fermented corn", "Ga kenkey", "fried fish pairing"]),
      source("Pulse Ghana - Ga Kenkey with Sauce and Fried Fish", "https://www.pulse.com.gh/lifestyle/food-travel/diy-recipes-how-to-make-ga-kenkey-with-sauce-and-fried-fish/yl4zjh9", ["fried fish", "pepper sauce", "street food"])
    ],
    ingredients: [
      ingredient("Kenkey", 1.2, "kg", "fermented corn dough"),
      ingredient("Kenkey", 1, "tsp", "salt"),
      ingredient("Kenkey", 1, "cup", "water", "plus more for steaming"),
      ingredient("Fish", 6, "whole", "small tilapia or mackerel", "cleaned"),
      ingredient("Fish", 1, "tsp", "salt"),
      ingredient("Fish", 0.5, "cup", "oil", "for frying"),
      ingredient("Relish", 3, "medium", "tomatoes", "diced"),
      ingredient("Relish", 1, "large", "onion", "diced"),
      ingredient("Relish", 2, "whole", "fresh chilies", "crushed")
    ],
    steps: [
      step("Cook a dough starter", "Cook one-third of the corn dough with water into a thick porridge, then mix it back into the raw dough with salt.", 15, "starter"),
      step("Wrap and steam", "Shape dough portions, wrap in corn husks or foil, and steam until firm.", 70, "steam"),
      step("Fry fish", "Season fish with salt and fry until crisp outside and cooked through.", 12, "fish"),
      step("Serve", "Serve kenkey warm with fried fish, pepper sauce, tomato, and onion.", 3, "plate")
    ]
  }),
  recipe({
    slug: "fufu-light-soup-gh",
    name: "Fufu with Light Soup",
    description:
      "Ghanaian cassava-plantain fufu served with peppery tomato-based light soup and goat, chicken, or fish.",
    country_code: "GH",
    country_name: "Ghana",
    ethnic_group: "Akan and Ghanaian",
    category: "soup",
    tags: ["fufu", "light soup", "goat", "ghanaian"],
    diet_tags: ["gluten-free", "dairy-free"],
    prep_time_minutes: 35,
    cook_time_minutes: 80,
    difficulty: "hard",
    default_servings: 6,
    story:
      "Fufu and light soup is a Ghanaian classic built on contrast: elastic swallow, thin peppery soup, and deeply simmered meat or fish.",
    occasion: "Best for Sunday lunch, celebratory family meals, and cold-weather soup days.",
    best_served_with: "Goat light soup, chicken light soup, or fish light soup.",
    regional_variations:
      "Fufu may use cassava with plantain, yam, or cocoyam, and light soup can be goat, chicken, fish, or mixed meat.",
    calories: 610,
    protein_g: 34,
    carbs_g: 82,
    fat_g: 18,
    fiber_g: 8,
    review_summary:
      "Sources agree on fufu as a pounded cassava/plantain swallow and light soup as a peppery tomato-based broth. The AfroKitchen version keeps the soup light, not stew-thick.",
    recommended_changes: [
      "Do not over-reduce light soup.",
      "Use ripe-but-firm plantain for balanced fufu texture."
    ],
    sources: [
      source("My Planet Food - Fufu with Light Soup", "https://myplanetfood.com/ghana/fufu-with-light-soup-recipe/", ["fufu", "light soup", "Ghana"]),
      source("StoresGo - Ghanaian Fufu", "https://storesgo.com/recipes/ghanaian-fufu", ["fufu method", "light soup pairing", "Ghanaian recipe"])
    ],
    ingredients: [
      ingredient("Fufu", 700, "g", "cassava", "peeled and cubed"),
      ingredient("Fufu", 4, "medium", "green plantains", "peeled and sliced"),
      ingredient("Soup", 800, "g", "goat or chicken pieces"),
      ingredient("Soup", 5, "medium", "tomatoes"),
      ingredient("Soup", 1, "large", "onion"),
      ingredient("Soup", 2, "whole", "scotch bonnet peppers"),
      ingredient("Soup", 2, "tbsp", "ginger", "grated"),
      ingredient("Soup", 3, "cloves", "garlic"),
      ingredient("Soup", 6, "cups", "water or stock"),
      ingredient("Finishing", 0, "", "salt", "to taste")
    ],
    steps: [
      step("Simmer meat", "Cook meat with onion, ginger, garlic, salt, and water until it begins to soften.", 35, "meat simmer"),
      step("Blend soup base", "Simmer tomatoes and peppers in the pot, lift them out, blend with onion, then return to the soup.", 15, "blend base"),
      step("Finish light soup", "Continue simmering until meat is tender and the broth is peppery but still light.", 25, "soup finish"),
      step("Make fufu", "Boil cassava and plantain until tender, then pound or process into a smooth elastic mound.", 30, "fufu")
    ]
  }),
  recipe({
    slug: "foutou-sauce-graine-ci",
    name: "Foutou Sauce Graine",
    description:
      "Ivorian pounded plantain or yam foutou served with rich palm nut sauce, smoked meat, fish, and chile.",
    country_code: "CI",
    country_name: "Ivory Coast",
    ethnic_group: "Ivorian",
    category: "soup",
    tags: ["foutou", "palm nut", "sauce graine", "smoked fish"],
    diet_tags: ["gluten-free", "dairy-free"],
    prep_time_minutes: 35,
    cook_time_minutes: 100,
    difficulty: "hard",
    default_servings: 6,
    story:
      "Foutou sauce graine is one of the plates that makes an Ivorian table feel complete: elastic pounded starch and a red palm sauce with smoke, chile, and depth.",
    occasion: "Best for Sunday lunch, maquis-style meals, and special family cooking.",
    best_served_with: "Foutou banane, foutou igname, placali, or rice.",
    regional_variations:
      "The sauce may include smoked beef, agouti, fish, crab, adjovan, or green chilies depending on place and budget.",
    calories: 720,
    protein_g: 36,
    carbs_g: 82,
    fat_g: 30,
    fiber_g: 11,
    review_summary:
      "Ivorian sources agree on palm nut juice, smoked protein, tomato, onion, chile, and foutou pairing. The AfroKitchen version uses canned palm base as an accessible option.",
    recommended_changes: [
      "Use real palm nut base when possible.",
      "Simmer uncovered until the sauce thickens and oil beads rise."
    ],
    sources: [
      source("Cuisine de Chez Nous - Foutou Sauce Graine", "https://www.cuisinedecheznous.net/story/foutou-sauce-graine/", ["palm nut sauce", "smoked meat", "Ivorian method"]),
      source("Afritourisme - Sauce Graine", "https://www.afritourisme.com/sauceg.html", ["Cote d'Ivoire", "palm nuts", "foutou pairing"])
    ],
    ingredients: [
      ingredient("Foutou", 4, "large", "ripe plantains", "peeled"),
      ingredient("Foutou", 800, "g", "yam or cassava", "peeled and cubed"),
      ingredient("Sauce", 2, "liters", "palm nut juice or diluted palm cream"),
      ingredient("Sauce", 700, "g", "smoked beef or smoked turkey"),
      ingredient("Sauce", 2, "whole", "smoked fish", "cleaned"),
      ingredient("Sauce", 2, "medium", "tomatoes"),
      ingredient("Sauce", 1, "large", "onion"),
      ingredient("Sauce", 2, "whole", "hot peppers"),
      ingredient("Seasoning", 1, "small", "piece", "adjovan or fermented fish", "optional"),
      ingredient("Finishing", 0, "", "salt", "to taste")
    ],
    steps: [
      step("Cook protein", "Simmer smoked meat with onion, tomato, pepper, and a little water until tender.", 45, "protein"),
      step("Add palm base", "Add palm nut juice and smoked fish, then simmer uncovered until the sauce thickens.", 45, "sauce"),
      step("Make foutou", "Boil plantain and yam until tender, then pound together into a smooth elastic dough.", 30, "foutou"),
      step("Serve", "Serve foutou with hot sauce graine and extra pepper on the side.", 3, "plate")
    ]
  }),
  recipe({
    slug: "garba-ci",
    name: "Garba",
    description:
      "Abidjan street-food plate of attieke, fried tuna, raw onion-tomato-pepper relish, oil, and seasoning.",
    country_code: "CI",
    country_name: "Ivory Coast",
    ethnic_group: "Abidjan Ivorian",
    category: "street food",
    tags: ["attieke", "tuna", "street food", "abidjan"],
    diet_tags: ["dairy-free"],
    prep_time_minutes: 15,
    cook_time_minutes: 20,
    difficulty: "easy",
    default_servings: 4,
    story:
      "Garba is Abidjan speed, attitude, and satisfaction: sour cassava couscous, fried tuna, fresh pepper, onion, and that unmistakable street-food oil gloss.",
    occasion: "Best for street-food nights, fast lunches, and game-day plates.",
    best_served_with: "Extra chili, sliced onion, and chilled bissap.",
    regional_variations:
      "Some vendors dust tuna with flour, some keep it plain, and the attieke may be heavily oiled and seasoned or kept lighter.",
    calories: 640,
    protein_g: 38,
    carbs_g: 62,
    fat_g: 28,
    fiber_g: 5,
    review_summary:
      "Sources agree on attieke with fried tuna plus onion, tomato, pepper, oil, and seasoning. The AfroKitchen version uses a light flour dusting for crisp tuna.",
    recommended_changes: [
      "Steam attieke instead of microwaving if possible.",
      "Use firm tuna steaks and do not overcook them."
    ],
    sources: [
      source("Bellafricana - The Garba", "https://bellafricana.com/?p=13090", ["Abidjan street food", "attieke", "fried tuna"]),
      source("Africa Cuisine - Garba Ivorian Fried Tuna", "https://africa-cuisine.com/recipe/garba-ivorian-fried-tuna-with-attieke/", ["fried tuna", "attieke", "relish"]),
      source("In Cote d'Ivoire - Garba", "https://www.incotedivoire.net/culture/Garba/show/Garba", ["local context", "Garba", "Abidjan"])
    ],
    ingredients: [
      ingredient("Base", 600, "g", "attieke", "loosened"),
      ingredient("Fish", 600, "g", "fresh tuna steaks"),
      ingredient("Fish", 0.5, "cup", "flour", "for dusting"),
      ingredient("Fish", 0.75, "cup", "oil", "for frying"),
      ingredient("Relish", 2, "large", "onions", "diced"),
      ingredient("Relish", 3, "medium", "tomatoes", "diced"),
      ingredient("Relish", 2, "whole", "fresh chilies", "minced"),
      ingredient("Seasoning", 1, "tsp", "bouillon powder", "optional"),
      ingredient("Finishing", 0, "", "salt and pepper", "to taste")
    ],
    steps: [
      step("Steam attieke", "Sprinkle attieke with water and steam until fluffy, then toss with a little oil and salt.", 8, "attieke"),
      step("Season tuna", "Salt tuna, dust lightly with flour, and shake off excess.", 3, "season"),
      step("Fry tuna", "Fry tuna until golden outside and just cooked through.", 8, "fry tuna"),
      step("Assemble", "Serve attieke with tuna, onion, tomato, chili, oil, and seasoning.", 3, "assemble")
    ]
  }),
  recipe({
    slug: "placali-sauce-kope-ci",
    name: "Placali Sauce Kope",
    description:
      "Ivorian fermented cassava placali served with slippery okra sauce, crab, smoked fish, meat, and chile.",
    country_code: "CI",
    country_name: "Ivory Coast",
    ethnic_group: "Ivorian",
    category: "soup",
    tags: ["placali", "okra", "sauce kope", "cassava"],
    diet_tags: ["gluten-free", "dairy-free"],
    prep_time_minutes: 30,
    cook_time_minutes: 75,
    difficulty: "hard",
    default_servings: 6,
    story:
      "Placali and sauce kope is texture food at its finest: sour-soft cassava paste meeting okra's draw and the deep savor of crab, smoked fish, and meat.",
    occasion: "Best for weekend Ivorian tables and serious soup-and-swallow plates.",
    best_served_with: "Extra chili, smoked fish, crab, or kplo if available.",
    regional_variations:
      "Sauce kope may include crab, snails, beef feet, smoked fish, or only fish; placali can be bought ready-made or cooked from fermented cassava dough.",
    calories: 690,
    protein_g: 32,
    carbs_g: 86,
    fat_g: 24,
    fiber_g: 13,
    review_summary:
      "Ivorian sources confirm placali as fermented cassava paste and sauce kope as an okra-based sauce often served with seafood and meat. The AfroKitchen version uses grated okra for reliable draw.",
    recommended_changes: [
      "Stir placali constantly while it thickens.",
      "Add okra late and avoid over-whisking after the draw forms."
    ],
    sources: [
      source("Cuisine de Chez Nous - Placali a la sauce kope", "https://www.cuisinedecheznous.net/blog/2023/01/07/un-delicieux-placali-a-la-sauce-kope-%F0%9F%98%8B/", ["placali", "sauce kope", "Ivorian dish"]),
      source("Cordon Bleu CI - Kope sauce gombos rapes", "https://cordonbleu.ci/kope-sauce-gombos-rapes/", ["okra sauce", "placali pairing", "Ivorian method"]),
      source("Guide des Aliments - Placali", "https://guidedesaliments.com/guide/placali/", ["fermented cassava", "placali texture", "sauce pairings"])
    ],
    ingredients: [
      ingredient("Placali", 900, "g", "fermented cassava dough"),
      ingredient("Placali", 3, "cups", "water", "plus more as needed"),
      ingredient("Sauce", 500, "g", "okra", "grated or finely chopped"),
      ingredient("Sauce", 500, "g", "beef, smoked fish, or crab", "mixed protein"),
      ingredient("Sauce", 1, "large", "onion", "chopped"),
      ingredient("Sauce", 2, "medium", "tomatoes", "chopped"),
      ingredient("Sauce", 2, "whole", "hot peppers"),
      ingredient("Sauce", 2, "tbsp", "palm oil"),
      ingredient("Liquid", 5, "cups", "water or stock"),
      ingredient("Finishing", 0, "", "salt", "to taste")
    ],
    steps: [
      step("Cook proteins", "Simmer meat or seafood with onion, tomato, pepper, and stock until tender.", 40, "protein"),
      step("Add okra", "Stir in grated okra and palm oil, then simmer until the sauce becomes glossy and lightly stretchy.", 15, "okra"),
      step("Cook placali", "Whisk cassava dough with water over medium heat, stirring constantly until translucent and elastic.", 18, "placali"),
      step("Serve hot", "Shape placali and serve with sauce kope spooned around it.", 3, "plate")
    ]
  }),
  recipe({
    slug: "dumboy-lr",
    name: "Dumboy",
    description:
      "Liberian fresh cassava swallow boiled, pounded smooth, and served with pepper soup, palm butter, or palava sauce.",
    country_code: "LR",
    country_name: "Liberia",
    ethnic_group: "Liberian",
    category: "side",
    tags: ["cassava", "swallow", "liberian", "pounded"],
    diet_tags: ["vegan", "gluten-free", "dairy-free"],
    prep_time_minutes: 20,
    cook_time_minutes: 40,
    difficulty: "medium",
    default_servings: 6,
    serving_unit: "mounds",
    story:
      "Dumboy is Liberia's fresh cassava answer to swallow: boiled, pounded, glossy, and ready for any serious soup.",
    occasion: "Best for pepper soup, palm butter soup, and weekend Liberian meals.",
    best_served_with: "Pepper soup, palm butter soup, palava sauce, or okra stew.",
    regional_variations:
      "Some households pound by hand, others use modern processors, and texture ranges from soft to very elastic.",
    calories: 330,
    protein_g: 3,
    carbs_g: 78,
    fat_g: 1,
    fiber_g: 5,
    review_summary:
      "Liberian references agree that dumboy uses fresh boiled cassava, unlike fermented cassava fufu. The AfroKitchen version focuses on a smooth pounded finish.",
    recommended_changes: [
      "Remove cassava fibers before pounding.",
      "Serve immediately while soft and elastic."
    ],
    sources: [
      source("I've Been Cooking - Dumboy", "https://ivebeen.cooking/recipes/dumboy", ["fresh cassava", "pounded", "Liberia"]),
      source("Glorious Food Glossary - Dumboy", "https://www.glorious-food-glossary.com/cms/glossary/37-glossary-d/14552-dumboy.html", ["boiled cassava", "palm butter pairing", "Liberian staple"])
    ],
    ingredients: [
      ingredient("Base", 1.2, "kg", "fresh cassava", "peeled and cut up"),
      ingredient("Base", 6, "cups", "water", "for boiling"),
      ingredient("Finishing", 1, "tbsp", "palm oil", "optional for serving"),
      ingredient("Finishing", 0, "", "salt", "optional")
    ],
    steps: [
      step("Boil cassava", "Boil cassava in water until fully tender.", 25, "boil"),
      step("Remove fibers", "Drain, remove woody centers, and keep cassava warm.", 5, "trim"),
      step("Pound smooth", "Pound or process hot cassava until smooth, elastic, and cohesive.", 10, "pound"),
      step("Shape and serve", "Shape into mounds and serve with soup or palm oil.", 2, "shape")
    ]
  }),
  recipe({
    slug: "palava-sauce-lr",
    name: "Liberian Palava Sauce",
    description:
      "Liberian leafy stew of greens, okra, chicken, peanut, tomato, and pepper, served with rice or dumboy.",
    country_code: "LR",
    country_name: "Liberia",
    ethnic_group: "Liberian",
    category: "stew",
    tags: ["greens", "palava sauce", "chicken", "peanut"],
    diet_tags: ["gluten-free", "dairy-free"],
    prep_time_minutes: 20,
    cook_time_minutes: 55,
    difficulty: "medium",
    default_servings: 6,
    story:
      "Liberian palava sauce is a leafy stew that knows how to be both practical and lush: greens, okra, pepper, chicken, and peanut body.",
    occasion: "Best for rice plates, dumboy meals, and family stews.",
    best_served_with: "White rice, dumboy, fufu, or boiled plantain.",
    regional_variations:
      "Greens can be spinach, collards, cassava leaves, or jute; protein can be chicken, smoked fish, beef, or none.",
    calories: 470,
    protein_g: 35,
    carbs_g: 18,
    fat_g: 30,
    fiber_g: 8,
    review_summary:
      "Sources describe Liberian palava as a green stew with chicken and often peanut or okra. The AfroKitchen version keeps peanut moderate and lets greens lead.",
    recommended_changes: [
      "Simmer greens until tender but not dull.",
      "Whisk peanut butter with broth before adding."
    ],
    sources: [
      source("196 Flavors - Chicken Palava", "https://www.196flavors.com/liberia-chicken-palava/", ["Liberian chicken palava", "greens", "okra"]),
      source("URI Community Nutrition - Chicken Palava", "https://web.uri.edu/community-nutrition/wp-content/uploads/sites/1241/Chicken-Palava.pdf", ["peanut butter", "spinach", "chicken"])
    ],
    ingredients: [
      ingredient("Protein", 900, "g", "chicken pieces"),
      ingredient("Greens", 600, "g", "spinach or collard greens", "chopped"),
      ingredient("Greens", 1, "cup", "okra", "sliced"),
      ingredient("Sauce", 0.33, "cup", "peanut butter"),
      ingredient("Sauce", 2, "medium", "tomatoes", "chopped"),
      ingredient("Sauce", 1, "large", "onion", "chopped"),
      ingredient("Sauce", 3, "cloves", "garlic", "minced"),
      ingredient("Sauce", 1, "tbsp", "ginger", "grated"),
      ingredient("Fat", 3, "tbsp", "palm oil or vegetable oil"),
      ingredient("Liquid", 3, "cups", "chicken stock")
    ],
    steps: [
      step("Brown chicken", "Season and brown chicken in oil, then remove briefly.", 10, "brown"),
      step("Build sauce", "Cook onion, garlic, ginger, and tomatoes until softened.", 10, "base"),
      step("Simmer stew", "Return chicken with stock and simmer until nearly tender.", 25, "simmer"),
      step("Finish greens", "Add greens, okra, and loosened peanut butter. Simmer until thick and seasoned.", 15, "greens")
    ]
  }),
  recipe({
    slug: "gb-soup-lr",
    name: "GB Soup",
    description:
      "Liberian pepper soup for dumboy, usually built with meat or fish, okra, bitter balls, onion, tomato, and hot pepper.",
    country_code: "LR",
    country_name: "Liberia",
    ethnic_group: "Liberian",
    category: "soup",
    tags: ["pepper soup", "dumboy", "okra", "liberian"],
    diet_tags: ["gluten-free", "dairy-free"],
    prep_time_minutes: 20,
    cook_time_minutes: 70,
    difficulty: "medium",
    default_servings: 6,
    story:
      "GB soup is the partner that makes dumboy sing: peppery broth, meat or fish, okra body, and a clean heat that cuts through cassava.",
    occasion: "Best for dumboy meals, rainy days, and pepper soup cravings.",
    best_served_with: "Dumboy, fufu, boiled cassava, or rice.",
    regional_variations:
      "Goat, chicken, beef, smoked fish, shrimp, okra, and bitter balls can all appear depending on household and county.",
    calories: 390,
    protein_g: 34,
    carbs_g: 16,
    fat_g: 22,
    fiber_g: 5,
    review_summary:
      "Liberian sources connect dumboy with hot pepper soup made with meat, fish, okra, onion, tomato, and bitter balls. The AfroKitchen version keeps the broth clear and pepper-forward.",
    recommended_changes: [
      "Do not thicken it like stew; this should stay brothy.",
      "Cook okra near the end for body without losing freshness."
    ],
    sources: [
      source("Glorious Food Glossary - Dumboy", "https://www.glorious-food-glossary.com/cms/glossary/37-glossary-d/14552-dumboy.html", ["pepper soup pairing", "okra", "bitter balls"]),
      source("Liberian Cuisine - Wikipedia", "https://en.wikipedia.org/wiki/Liberian_cuisine", ["pepper soup", "Liberian soups", "rice and cassava staples"])
    ],
    ingredients: [
      ingredient("Protein", 900, "g", "goat, beef, chicken, or fish", "cut up"),
      ingredient("Broth", 1, "large", "onion", "quartered"),
      ingredient("Broth", 2, "medium", "tomatoes", "quartered"),
      ingredient("Broth", 2, "whole", "hot peppers"),
      ingredient("Broth", 2, "cloves", "garlic"),
      ingredient("Broth", 1, "tsp", "fresh ginger", "grated"),
      ingredient("Vegetables", 2, "cups", "okra", "halved"),
      ingredient("Vegetables", 6, "small", "bitter balls or eggplants", "optional"),
      ingredient("Liquid", 7, "cups", "water or stock"),
      ingredient("Finishing", 0, "", "salt and black pepper", "to taste")
    ],
    steps: [
      step("Start broth", "Simmer protein with onion, tomato, pepper, garlic, ginger, salt, and water.", 40, "broth"),
      step("Skim and soften", "Skim the broth and continue cooking until the protein is tender.", 15, "tender"),
      step("Add vegetables", "Add okra and bitter balls or eggplant and simmer until just tender.", 12, "vegetables"),
      step("Serve brothy", "Adjust pepper and salt, then serve with dumboy.", 3, "finish")
    ]
  }),
  recipe({
    slug: "djabadji-ml",
    name: "Djabadji",
    description:
      "Malian onion-rich red sauce with meat, tomato, garlic, and chile, served over rice or with toh.",
    country_code: "ML",
    country_name: "Mali",
    ethnic_group: "Malian",
    category: "stew",
    tags: ["onion sauce", "mali", "rice", "meat"],
    diet_tags: ["gluten-free", "dairy-free"],
    prep_time_minutes: 20,
    cook_time_minutes: 70,
    difficulty: "medium",
    default_servings: 6,
    story:
      "Djabadji, also called nandji in some references, is the kind of Malian sauce where onions do the heavy lifting and tomato gives the pot its red body.",
    occasion: "Best for rice bowls, family lunch, and sauce rotation.",
    best_served_with: "White rice, fonio, toh, or boiled plantain.",
    regional_variations:
      "Some versions use beef, some chicken, and some add vegetables like carrot, cabbage, or eggplant.",
    calories: 500,
    protein_g: 34,
    carbs_g: 24,
    fat_g: 30,
    fiber_g: 5,
    review_summary:
      "Available Malian recipe sources describe Djabadji or Nandji as a red onion sauce with meat. The AfroKitchen version favors slow onion cooking and moderate tomato.",
    recommended_changes: [
      "Cook onions down patiently before adding much liquid.",
      "Serve with plain rice so the sauce remains the focus."
    ],
    sources: [
      source("Saveurs de Oumy - Nandji Djabadji", "https://saveursdeoumy.com/recette-du-nandjidjabadji/", ["Malian sauce", "onion", "tomato"]),
      source("Malian Cuisine - Wikipedia", "https://en.wikipedia.org/wiki/Malian_cuisine", ["Malian sauces", "rice", "staples"])
    ],
    ingredients: [
      ingredient("Protein", 800, "g", "beef or chicken", "cut up"),
      ingredient("Sauce", 5, "large", "onions", "sliced"),
      ingredient("Sauce", 3, "medium", "tomatoes", "blended"),
      ingredient("Sauce", 2, "tbsp", "tomato paste"),
      ingredient("Sauce", 4, "cloves", "garlic", "minced"),
      ingredient("Sauce", 1, "whole", "hot pepper"),
      ingredient("Fat", 0.25, "cup", "oil"),
      ingredient("Liquid", 3, "cups", "water or stock"),
      ingredient("Finishing", 0, "", "salt and black pepper", "to taste")
    ],
    steps: [
      step("Brown protein", "Season and brown the meat or chicken in oil.", 10, "brown"),
      step("Cook onions", "Add onions and cook until soft, sweet, and reduced.", 20, "onions"),
      step("Simmer sauce", "Add tomatoes, tomato paste, garlic, pepper, and stock. Simmer until protein is tender.", 35, "simmer"),
      step("Finish", "Adjust salt and serve over rice or with toh.", 3, "finish")
    ]
  }),
  recipe({
    slug: "djouka-fonio-ml",
    name: "Djouka de Fonio",
    description:
      "Malian steamed fonio mixed with roasted peanut powder, okra, onion, and a peppery vegetable garnish.",
    country_code: "ML",
    country_name: "Mali",
    ethnic_group: "Malian and Sahelian",
    category: "main",
    tags: ["fonio", "peanut", "okra", "sahel"],
    diet_tags: ["vegan", "gluten-free", "dairy-free"],
    prep_time_minutes: 30,
    cook_time_minutes: 70,
    difficulty: "medium",
    default_servings: 6,
    story:
      "Djouka is fonio with substance: steamed grains, peanut richness, okra, and a garnish that turns an ancient grain into a full meal.",
    occasion: "Best for family lunches, fasting tables, and grain-forward menus.",
    best_served_with: "Eggplant-onion garnish, tomato sauce, grilled fish, or roasted vegetables.",
    regional_variations:
      "Mali and Burkina Faso both claim versions; some use potash, some add gombo, and some serve it with a separate sauce.",
    calories: 450,
    protein_g: 18,
    carbs_g: 58,
    fat_g: 18,
    fiber_g: 10,
    review_summary:
      "Sources agree on fonio mixed with peanut, often okra and a vegetable garnish. The AfroKitchen version steams in stages for fluffy grains.",
    recommended_changes: [
      "Wash fonio carefully to remove grit.",
      "Steam rather than boil for a couscous-like texture."
    ],
    sources: [
      source("Fonio Guide - Djouka de Fonio", "https://www.fonio.guide/djouka-de-fonio-la-recette-traditionnelle-malienne-a-larachide-et-au-gombo/", ["Malian Djouka", "fonio", "peanut", "okra"]),
      source("Le360 Afrique - Mali Djouka", "https://afrique.le360.ma/culture/mali-darachides-et-de-fonio-le-djouka-se-mange-a-toutes-les-sauces_SMQWIX7LR5HFZG4PLXWTIULGPU/", ["Mali", "fonio", "peanut culture"])
    ],
    ingredients: [
      ingredient("Fonio", 2, "cups", "fonio", "washed well"),
      ingredient("Fonio", 1, "cup", "roasted peanut powder"),
      ingredient("Fonio", 1, "cup", "okra", "thinly sliced"),
      ingredient("Garnish", 2, "medium", "eggplants", "diced"),
      ingredient("Garnish", 3, "large", "onions", "sliced"),
      ingredient("Garnish", 2, "whole", "fresh chilies"),
      ingredient("Fat", 0.25, "cup", "oil"),
      ingredient("Liquid", 3, "cups", "water", "for steaming"),
      ingredient("Finishing", 0, "", "salt", "to taste")
    ],
    steps: [
      step("Steam fonio", "Moisten fonio lightly and steam until the grains begin to soften.", 20, "first steam"),
      step("Add peanut and okra", "Work in peanut powder, okra, and salt, then steam again until fluffy.", 25, "second steam"),
      step("Cook garnish", "Fry onions, eggplant, and chilies in oil until soft and savory.", 18, "garnish"),
      step("Combine", "Fold garnish through the fonio or spoon it over the top.", 5, "finish")
    ]
  }),
  recipe({
    slug: "maru-we-llham-mr",
    name: "Maru We Llham",
    description:
      "Mauritanian meat, rice, and vegetable pot scented with mustard, onion, bay, pepper, and broth.",
    country_code: "MR",
    country_name: "Mauritania",
    ethnic_group: "Mauritanian",
    category: "main",
    tags: ["rice", "meat", "mustard", "one pot"],
    diet_tags: ["gluten-free", "dairy-free"],
    prep_time_minutes: 25,
    cook_time_minutes: 75,
    difficulty: "medium",
    default_servings: 6,
    story:
      "Maru we llham sits between Sahel rice pot and desert hospitality: meat, rice, vegetables, mustard sharpness, and a broth that feeds the whole tray.",
    occasion: "Best for shared platters, family lunch, and one-pot rice meals.",
    best_served_with: "Green salad, chili sauce, or Mauritanian mint tea after the meal.",
    regional_variations:
      "Chicken, lamb, goat, or beef may be used; vegetables can include cassava, cabbage, carrot, or eggplant.",
    calories: 620,
    protein_g: 36,
    carbs_g: 78,
    fat_g: 18,
    fiber_g: 6,
    review_summary:
      "Mauritanian references list Maru we llham as meat with rice and vegetables, and recipe sources include mustard sauce. The AfroKitchen version uses lamb or chicken with rice cooked in the broth.",
    recommended_changes: [
      "Brown meat before adding vegetables.",
      "Use enough broth for the rice but avoid stirring once it starts steaming."
    ],
    sources: [
      source("Culinary Adventures with Cam - Maru We Llham", "https://culinary-adventures-with-cam.blogspot.com/2013/05/maru-we-llham-mauritania.html", ["Mauritania", "meat rice vegetables", "mustard sauce"]),
      source("Food Fare - Maru We Llham", "https://deborahotoole.com/FoodFare/maruwe.htm", ["chicken", "mustard", "Mauritanian recipe"]),
      source("Mauritanian Cuisine - Wikipedia", "https://en.wikipedia.org/wiki/Mauritanian_cuisine", ["Maru we-llham", "rice and vegetables", "traditional dishes"])
    ],
    ingredients: [
      ingredient("Protein", 900, "g", "lamb, goat, or chicken", "cut up"),
      ingredient("Rice", 2, "cups", "long-grain rice", "rinsed"),
      ingredient("Vegetables", 2, "carrots", "sliced"),
      ingredient("Vegetables", 2, "cups", "cabbage", "shredded"),
      ingredient("Vegetables", 1, "medium", "eggplant", "cubed"),
      ingredient("Sauce", 1, "large", "onion", "chopped"),
      ingredient("Sauce", 3, "cloves", "garlic", "minced"),
      ingredient("Sauce", 2, "tbsp", "mustard"),
      ingredient("Seasoning", 2, "whole", "bay leaves"),
      ingredient("Liquid", 5, "cups", "stock or water"),
      ingredient("Fat", 3, "tbsp", "oil or butter")
    ],
    steps: [
      step("Brown meat", "Brown meat with onion and garlic in oil or butter.", 12, "brown"),
      step("Braise", "Add mustard, bay, vegetables, salt, pepper, and stock. Simmer until meat is nearly tender.", 35, "braise"),
      step("Cook rice", "Stir in rice, cover, and cook on low until grains absorb the broth.", 22, "rice"),
      step("Rest", "Rest covered, then fluff gently and serve from a shared platter.", 8, "rest")
    ]
  }),
  recipe({
    slug: "dounguouri-soko-ne",
    name: "Dounguouri Soko",
    description:
      "Nigerien white bean and lamb stew cooked with onion, tomato, pepper, garlic, and a slow savory sauce.",
    country_code: "NE",
    country_name: "Niger",
    ethnic_group: "Nigerien",
    category: "stew",
    tags: ["beans", "lamb", "tomato", "nigerien"],
    diet_tags: ["gluten-free", "dairy-free"],
    prep_time_minutes: 20,
    cook_time_minutes: 130,
    difficulty: "medium",
    default_servings: 6,
    story:
      "Dounguouri Soko is Niger's bean stew comfort, built like a Sahelian cousin to cassoulet: white beans, lamb, tomato, pepper, and time.",
    occasion: "Best for cool evenings, bean lovers, and hearty family stews.",
    best_served_with: "Rice, millet, flatbread, or a spoon of mayonnaise as some references note.",
    regional_variations:
      "Some versions use natron to soften beans; others skip it and simply soak beans overnight.",
    calories: 560,
    protein_g: 39,
    carbs_g: 48,
    fat_g: 23,
    fiber_g: 14,
    review_summary:
      "Sources agree on white beans, lamb, onion, peppers, tomato, and long cooking. The AfroKitchen version keeps natron optional and relies on soaking.",
    recommended_changes: [
      "Soak beans overnight.",
      "Keep tomato out until beans have softened."
    ],
    sources: [
      source("196 Flavors - Dounguouri Soko", "https://www.196flavors.com/niger-dounguouri-soko/", ["Niger", "white beans", "lamb", "tomato"]),
      source("World Cook Project - Niger", "https://worldcookproject.com/2016/08/22/niger/", ["dounguouri soko", "beans", "traditional context"])
    ],
    ingredients: [
      ingredient("Beans", 2, "cups", "white beans", "soaked overnight"),
      ingredient("Protein", 900, "g", "lamb", "cut into chunks"),
      ingredient("Sauce", 4, "large", "onions", "chopped"),
      ingredient("Sauce", 2, "green bell peppers", "blended"),
      ingredient("Sauce", 2, "red bell peppers", "blended"),
      ingredient("Sauce", 5, "medium", "tomatoes", "chopped"),
      ingredient("Sauce", 3, "cloves", "garlic", "minced"),
      ingredient("Sauce", 2, "tbsp", "tomato paste"),
      ingredient("Fat", 0.33, "cup", "peanut oil"),
      ingredient("Liquid", 5, "cups", "water or stock")
    ],
    steps: [
      step("Cook beans", "Simmer soaked beans in fresh water until just tender.", 50, "beans"),
      step("Brown lamb", "Brown lamb in oil, then add onions and peppers and cook until softened.", 15, "lamb base"),
      step("Simmer stew", "Add tomatoes, tomato paste, garlic, cooked beans, and stock. Simmer until lamb and beans are tender.", 55, "stew"),
      step("Reduce", "Simmer uncovered to thicken, then adjust salt and pepper.", 10, "reduce")
    ]
  }),
  recipe({
    slug: "kopto-ne",
    name: "Kopto",
    description:
      "Nigerien moringa leaf salad-sauce mixed with peanut paste, soumbala, onion, chile, and sometimes gari.",
    country_code: "NE",
    country_name: "Niger",
    ethnic_group: "Zarma and Nigerien",
    category: "side",
    tags: ["moringa", "peanut", "soumbala", "leaf sauce"],
    diet_tags: ["vegan", "gluten-free", "dairy-free"],
    prep_time_minutes: 20,
    cook_time_minutes: 10,
    difficulty: "easy",
    default_servings: 4,
    story:
      "Kopto means leaf in Zarma, and this Nigerien dish lets moringa stay green and direct, dressed with peanut, soumbala, onion, and pepper.",
    occasion: "Best for light lunches, side plates, and moringa season.",
    best_served_with: "Dambou, rice, millet, gari, grilled fish, or beans.",
    regional_variations:
      "Moringa is classic, but cabbage, spinach, or white bissap leaves may stand in when moringa is not available.",
    calories: 210,
    protein_g: 10,
    carbs_g: 17,
    fat_g: 13,
    fiber_g: 7,
    review_summary:
      "Nigerien sources describe kopto as moringa leaves mixed with peanut paste, soumbala, chile, onion, and optional gari. The AfroKitchen version keeps cooking brief.",
    recommended_changes: [
      "Drain leaves well so the peanut dressing stays creamy.",
      "Use soumbala lightly because it is powerful."
    ],
    sources: [
      source("Cooking Hali - Kopto", "https://www.cookinghali.com/recettes/cuisine-nig%C3%A9rienne/kopto/", ["moringa", "peanut paste", "soumbala", "gari"]),
      source("Le Sahel - Mets traditionnels du Niger", "https://www.lesahel.org/gastronomie-ingredients-et-methode-de-preparation-de-certains-mets-traditionnels-du-niger/", ["kopto", "moringa leaves", "Nigerien cuisine"])
    ],
    ingredients: [
      ingredient("Leaves", 300, "g", "moringa leaves", "blanched and drained"),
      ingredient("Dressing", 2, "tbsp", "peanut paste"),
      ingredient("Dressing", 0.5, "tsp", "ground soumbala"),
      ingredient("Dressing", 1, "small", "onion", "finely sliced"),
      ingredient("Dressing", 1, "whole", "green chili", "minced"),
      ingredient("Dressing", 0.25, "cup", "water", "as needed"),
      ingredient("Finishing", 0.25, "cup", "gari", "optional"),
      ingredient("Finishing", 0, "", "salt", "to taste")
    ],
    steps: [
      step("Blanch leaves", "Blanch moringa leaves briefly, then drain and squeeze out excess water.", 5, "blanch"),
      step("Make dressing", "Mix peanut paste, soumbala, chili, onion, salt, and a splash of water into a creamy dressing.", 5, "dressing"),
      step("Combine", "Fold leaves into the dressing until evenly coated.", 3, "mix"),
      step("Serve", "Top with tomato, pepper, or gari if desired and serve cool or room temperature.", 2, "serve")
    ]
  }),
  recipe({
    slug: "binch-akara-sl",
    name: "Binch Akara",
    description:
      "Sierra Leonean black-eyed bean fritters, whipped light and fried until crisp, often sold with onion gravy or bread.",
    country_code: "SL",
    country_name: "Sierra Leone",
    ethnic_group: "Sierra Leonean Krio and West African",
    category: "snack",
    tags: ["beans", "fritters", "street food", "breakfast"],
    diet_tags: ["vegan", "gluten-free", "dairy-free"],
    prep_time_minutes: 45,
    cook_time_minutes: 20,
    difficulty: "medium",
    default_servings: 6,
    serving_unit: "fritters",
    story:
      "Binch akara is Sierra Leone's bean fritter language: peeled black-eyed peas, onion, pepper, air beaten into the batter, and a hot-oil finish.",
    occasion: "Best for breakfast, snacks, street-food boards, and party trays.",
    best_served_with: "Onion gravy, bread rolls, pepper sauce, or pap.",
    regional_variations:
      "Akara names travel across West Africa; Sierra Leonean vendors often serve binch akara as a street snack with onion gravy.",
    calories: 260,
    protein_g: 12,
    carbs_g: 32,
    fat_g: 10,
    fiber_g: 8,
    review_summary:
      "Sources agree on black-eyed bean fritters and note Sierra Leonean street service. The AfroKitchen method emphasizes peeling and whipping for a lighter crumb.",
    recommended_changes: [
      "Peel beans well for a smooth batter.",
      "Whip batter before frying so fritters puff."
    ],
    sources: [
      source("Samsung Food - Binch Akara", "https://app.samsungfood.com/recipes/107f513bccb64a640d6a18e360f5833ce34", ["Sierra Leone", "black-eyed beans", "street snack"]),
      source("Curious Cuisiniere - Akara Bean Fritters", "https://www.curiouscuisiniere.com/akara-bean-fritters/", ["West African akara", "black-eyed peas", "Sierra Leone naming"])
    ],
    ingredients: [
      ingredient("Batter", 2, "cups", "black-eyed peas", "soaked and peeled"),
      ingredient("Batter", 1, "small", "onion", "chopped"),
      ingredient("Batter", 1, "whole", "hot pepper"),
      ingredient("Batter", 0.5, "tsp", "cayenne pepper"),
      ingredient("Batter", 0.5, "tsp", "salt"),
      ingredient("Batter", 0.25, "cup", "water", "only as needed"),
      ingredient("Frying", 3, "cups", "oil", "for deep frying")
    ],
    steps: [
      step("Peel beans", "Soak beans, rub off skins, and rinse until mostly clean.", 25, "peel"),
      step("Blend batter", "Blend beans with onion, pepper, and minimal water into a thick paste.", 5, "blend"),
      step("Whip and season", "Whip batter with salt and cayenne until lighter and slightly airy.", 8, "whip"),
      step("Fry", "Drop spoonfuls into hot oil and fry until golden and crisp.", 12, "fry")
    ]
  }),
  recipe({
    slug: "ablo-tg",
    name: "Ablo",
    description:
      "Togolese steamed rice-and-corn cakes, lightly sweet, soft, and served with stew, grilled fish, or pepper sauce.",
    country_code: "TG",
    country_name: "Togo",
    ethnic_group: "Togolese and Beninese",
    category: "side",
    tags: ["steamed cake", "rice flour", "corn", "street food"],
    diet_tags: ["vegan", "gluten-free", "dairy-free"],
    prep_time_minutes: 70,
    cook_time_minutes: 20,
    difficulty: "medium",
    default_servings: 8,
    serving_unit: "cakes",
    story:
      "Ablo is soft, white, and gently sweet, the steamed cake that makes pepper sauce, fish, or tomato stew feel complete.",
    occasion: "Best for parties, snacks, breakfast, and stew sides.",
    best_served_with: "Tomato stew, grilled fish, chicken, pepper sauce, or beans.",
    regional_variations:
      "Togo, Benin, Ghana, and Ivory Coast all have related ablo or abolo styles using rice flour, corn flour, starch, yeast, and sugar.",
    calories: 210,
    protein_g: 4,
    carbs_g: 46,
    fat_g: 1,
    fiber_g: 2,
    review_summary:
      "Sources agree on steamed rice/corn cakes with yeast and a mild sweetness. The AfroKitchen version ferments briefly for a practical home method.",
    recommended_changes: [
      "Let the batter rise until visibly bubbly.",
      "Do not overfill molds because the cakes expand."
    ],
    sources: [
      source("African Food Network - Rice Cakes Ablo", "https://afrifoodnetwork.com/recipes/rice-recipes/rice-cakes-ablo/", ["Togolese ablo", "rice and corn", "steaming"]),
      source("NKOSI - Abolo/Ablo Recipe", "https://www.nkosiagro.com/en/blogs/culture-africaine/recette-des-abolo-ablo", ["rice flour", "corn flour", "yeast", "steaming"])
    ],
    ingredients: [
      ingredient("Batter", 2, "cups", "rice flour"),
      ingredient("Batter", 0.5, "cup", "corn flour"),
      ingredient("Batter", 0.5, "cup", "cornstarch"),
      ingredient("Batter", 0.33, "cup", "sugar"),
      ingredient("Batter", 2, "tsp", "instant yeast"),
      ingredient("Batter", 0.5, "tsp", "salt"),
      ingredient("Liquid", 2.25, "cups", "warm water"),
      ingredient("Molds", 1, "tbsp", "oil", "for greasing")
    ],
    steps: [
      step("Mix batter", "Whisk flours, starch, sugar, yeast, salt, and warm water into a smooth pourable batter.", 8, "mix"),
      step("Ferment", "Cover and let the batter rise until bubbly and slightly expanded.", 60, "rise"),
      step("Steam", "Pour into greased molds and steam until set and springy.", 18, "steam"),
      step("Rest and serve", "Cool briefly before unmolding and serving with stew or pepper sauce.", 5, "rest")
    ]
  }),
  recipe({
    slug: "djenkoume-tg",
    name: "Djenkoume",
    description:
      "Togolese tomato cornmeal dough cooked with onion, garlic, ginger, palm oil, and broth, often served with grilled chicken.",
    country_code: "TG",
    country_name: "Togo",
    ethnic_group: "Togolese",
    category: "side",
    tags: ["cornmeal", "tomato", "palm oil", "togolese"],
    diet_tags: ["gluten-free", "dairy-free"],
    prep_time_minutes: 15,
    cook_time_minutes: 35,
    difficulty: "medium",
    default_servings: 6,
    story:
      "Djenkoume is tomato-seasoned cornmeal with backbone: toasted maize, onion, garlic, ginger, palm oil, and the patience to stir until it turns glossy.",
    occasion: "Best for grilled chicken, fried fish, and Togolese party plates.",
    best_served_with: "Togolese grilled chicken, fried fish, tomato sauce, or chili.",
    regional_variations:
      "Related to Beninese amiwo, some versions use chicken broth, dried shrimp, coconut milk, or a separate tomato sauce.",
    calories: 330,
    protein_g: 7,
    carbs_g: 58,
    fat_g: 9,
    fiber_g: 5,
    review_summary:
      "Sources agree that Djenkoume is a Togolese tomato cornmeal staple. The AfroKitchen version toasts the cornmeal lightly and uses palm oil for color and flavor.",
    recommended_changes: [
      "Pour cornmeal slowly while stirring to avoid lumps.",
      "Keep the heat medium-low once the dough thickens."
    ],
    sources: [
      source("International Cuisine - Togo Djenkoume", "https://www.internationalcuisine.com/togo-djenkoume-tomato-cornmeal-recipe/", ["Togolese staple", "cornmeal", "tomato", "palm oil"]),
      source("Global Table Adventure - Djenkoume", "https://globaltableadventure.com/recipe/recipe-tomato-cornmeal-cakes-djenkoume/", ["tomato cornmeal", "Togo", "method"]),
      source("Togolese Cuisine - Wikipedia", "https://en.wikipedia.org/wiki/Togolese_cuisine", ["Djenkoume", "maize dough", "Togo"])
    ],
    ingredients: [
      ingredient("Cornmeal", 2, "cups", "fine cornmeal"),
      ingredient("Sauce", 2, "tbsp", "red palm oil"),
      ingredient("Sauce", 1, "large", "onion", "finely chopped"),
      ingredient("Sauce", 3, "cloves", "garlic", "minced"),
      ingredient("Sauce", 1, "tbsp", "fresh ginger", "grated"),
      ingredient("Sauce", 3, "medium", "tomatoes", "blended"),
      ingredient("Sauce", 2, "tbsp", "tomato paste"),
      ingredient("Liquid", 4, "cups", "chicken or vegetable broth"),
      ingredient("Finishing", 0, "", "salt and pepper", "to taste")
    ],
    steps: [
      step("Toast cornmeal", "Toast cornmeal in a dry pot, stirring, until it smells nutty but does not burn.", 6, "toast"),
      step("Cook tomato base", "In another pot, cook onion, garlic, ginger, tomatoes, tomato paste, and palm oil into a red sauce.", 12, "tomato base"),
      step("Stir dough", "Add broth, then stream in cornmeal while stirring constantly until thick and smooth.", 15, "stir"),
      step("Shape", "Cook until the dough pulls from the pot, then shape and serve hot.", 5, "finish")
    ]
  })
];

const seen = new Set();
for (const item of recipes) {
  if (seen.has(item.slug)) throw new Error(`Duplicate slug: ${item.slug}`);
  seen.add(item.slug);
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
  batch_id: "2026-05-02-west-africa-wave-1",
  reviewed_at: reviewedAt,
  notes:
    "West Africa expansion wave covering underrepresented Beninese, Burkinabe, Cape Verdean, Gambian, Ghanaian, Ivorian, Liberian, Malian, Mauritanian, Nigerien, Sierra Leonean, and Togolese dishes. Recipes are synthesized from multiple culinary, cultural, and household-style references, not copied from a single source.",
  recipes
};

fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
fs.writeFileSync(OUT_PATH, `${JSON.stringify(batch, null, 2)}\n`, "utf8");
console.log(`Wrote ${recipes.length} recipes to ${path.relative(ROOT, OUT_PATH)}`);
