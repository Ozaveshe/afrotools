-- AfroKitchen Seed Data — Batch 5: Central Africa
-- 7 countries × 3 recipes = 21 recipes
-- CD, CG, CM, CF, TD, GA, GQ

-- =============================================
-- DEMOCRATIC REPUBLIC OF CONGO (CD)
-- =============================================

-- 1. Moambe Chicken (DR Congo)
DO $$
DECLARE rid UUID;
BEGIN
  INSERT INTO recipes (slug, name, name_local, description, country_code, country_name, region, ethnic_group, category, tags, diet_tags, prep_time_minutes, cook_time_minutes, difficulty, default_servings, story, occasion, best_served_with, calories, protein_g, carbs_g, fat_g, fiber_g, is_verified, is_featured)
  VALUES (
    'moambe-chicken-cd', 'Moambe Chicken', 'Poulet à la Moambé', 'Tender chicken simmered in a rich, earthy palm nut sauce with tomatoes, onions, and spices. Considered the national dish of the Democratic Republic of Congo.',
    'CD', 'Democratic Republic of Congo', 'Central Africa', 'Mongo', 'stew',
    ARRAY['palm-nut', 'chicken', 'national-dish', 'comfort-food', 'congo'],
    ARRAY['gluten-free', 'dairy-free', 'nut-free'],
    25, 60, 'medium', 6,
    'Moambe chicken is the undisputed national dish of the DR Congo, rooted in the culinary heritage of the Mongo people of the Congo Basin. Palm nuts are pounded and boiled to extract the rich, orange cream that forms the heart of the sauce. Every Congolese family has their own variation, and it is the centrepiece of celebrations from weddings to Independence Day feasts.',
    'Sunday meals, celebrations, family gatherings',
    'Fufu, boiled plantains, or white rice',
    520, 38, 12, 36, 4,
    true, true
  ) RETURNING id INTO rid;

  INSERT INTO recipe_ingredients (recipe_id, sort_order, group_name, amount, unit, name, prep_note, is_optional, substitution) VALUES
  (rid, 1, NULL, 1.5, 'kg', 'chicken pieces', 'bone-in thighs and drumsticks', false, NULL),
  (rid, 2, NULL, 400, 'g', 'palm nut cream', 'canned or fresh', false, 'palm butter paste'),
  (rid, 3, NULL, 3, 'medium', 'tomatoes', 'chopped', false, NULL),
  (rid, 4, NULL, 2, 'large', 'onions', 'diced', false, NULL),
  (rid, 5, NULL, 3, 'cloves', 'garlic', 'minced', false, NULL),
  (rid, 6, NULL, 2, 'tbsp', 'tomato paste', NULL, false, NULL),
  (rid, 7, NULL, 2, 'whole', 'scotch bonnet peppers', 'left whole', true, 'habanero'),
  (rid, 8, NULL, 1, 'cup', 'water', NULL, false, NULL);

  INSERT INTO recipe_steps (recipe_id, step_number, title, instruction, timer_seconds, timer_label, tip) VALUES
  (rid, 1, 'Season the chicken', 'Season chicken pieces generously with salt and pepper. Heat oil in a large heavy-bottomed pot and brown the chicken on all sides until golden. Remove and set aside.', 600, 'Brown chicken', 'Browning adds deep flavour — do not skip this step.'),
  (rid, 2, 'Cook the aromatics', 'In the same pot, sauté onions until translucent, about 5 minutes. Add garlic and cook for 1 minute. Stir in tomato paste and cook for another minute.', 420, 'Sauté onions', NULL),
  (rid, 3, 'Add tomatoes and palm cream', 'Add chopped tomatoes and cook until they break down, about 5 minutes. Stir in the palm nut cream and water, mixing until smooth and combined.', 300, 'Cook tomatoes', 'If using canned palm cream, break up any lumps before adding.'),
  (rid, 4, 'Simmer the stew', 'Return the chicken to the pot and nestle pieces into the sauce. Add whole scotch bonnet peppers on top. Cover and simmer on low heat for 40 minutes until the chicken is cooked through and the sauce is thick and rich.', 2400, 'Simmer stew', 'Do not puncture the scotch bonnets — they add gentle heat without making the dish fiery.'),
  (rid, 5, 'Adjust and serve', 'Remove the scotch bonnet peppers. Taste and adjust salt. The sauce should be thick and coat the back of a spoon. Serve hot over fufu or boiled plantains.', NULL, NULL, 'The oil from the palm cream will float to the top — this is normal and adds richness.');
END $$;

-- 2. Saka-Saka (DR Congo)
DO $$
DECLARE rid UUID;
BEGIN
  INSERT INTO recipes (slug, name, name_local, description, country_code, country_name, region, ethnic_group, category, tags, diet_tags, prep_time_minutes, cook_time_minutes, difficulty, default_servings, story, occasion, best_served_with, calories, protein_g, carbs_g, fat_g, fiber_g, is_verified, is_featured)
  VALUES (
    'saka-saka-cd', 'Saka-Saka', 'Saka-Saka', 'Finely shredded cassava leaves slow-cooked with palm oil, onions, and dried fish until meltingly tender. A beloved Congolese staple rich in iron and flavour.',
    'CD', 'Democratic Republic of Congo', 'Central Africa', 'Luba', 'side',
    ARRAY['cassava-leaves', 'greens', 'traditional', 'staple', 'congo'],
    ARRAY['gluten-free', 'dairy-free'],
    30, 90, 'medium', 6,
    'Saka-Saka is eaten daily across the Congo, from the streets of Kinshasa to remote villages in the interior. Cassava leaves must be pounded and cooked for a long time to remove bitterness and release their nutrients. The addition of dried fish or smoked meat transforms simple greens into a deeply savoury dish that nourishes millions.',
    'Everyday meals, communal dining',
    'Fufu, boiled cassava, or rice',
    280, 18, 16, 18, 7,
    true, false
  ) RETURNING id INTO rid;

  INSERT INTO recipe_ingredients (recipe_id, sort_order, group_name, amount, unit, name, prep_note, is_optional, substitution) VALUES
  (rid, 1, NULL, 500, 'g', 'cassava leaves', 'finely shredded or frozen', false, 'spinach and kale mix'),
  (rid, 2, NULL, 100, 'g', 'dried fish', 'soaked and flaked', false, 'smoked mackerel'),
  (rid, 3, NULL, 3, 'tbsp', 'palm oil', NULL, false, NULL),
  (rid, 4, NULL, 1, 'large', 'onion', 'finely diced', false, NULL),
  (rid, 5, NULL, 2, 'cloves', 'garlic', 'minced', false, NULL),
  (rid, 6, NULL, 1, 'cube', 'stock cube', 'crumbled', true, NULL),
  (rid, 7, NULL, 1, 'whole', 'scotch bonnet pepper', 'left whole', true, NULL),
  (rid, 8, NULL, 1, 'cup', 'water', NULL, false, NULL);

  INSERT INTO recipe_steps (recipe_id, step_number, title, instruction, timer_seconds, timer_label, tip) VALUES
  (rid, 1, 'Prepare the leaves', 'If using fresh cassava leaves, wash thoroughly and pound in a mortar or blend until finely shredded. If using frozen, thaw and squeeze out excess water.', NULL, NULL, 'Frozen cassava leaves are widely available in African grocery stores and save significant prep time.'),
  (rid, 2, 'Start the greens', 'Place the cassava leaves in a large pot with water. Bring to a boil, then reduce heat and simmer for 30 minutes to begin softening the tough leaves.', 1800, 'Boil leaves', 'Cassava leaves require long cooking — do not rush this step.'),
  (rid, 3, 'Build the flavour base', 'In a separate pan, heat palm oil and sauté the onion until golden. Add garlic and cook for 1 minute. Add the dried fish and crumbled stock cube, stirring to combine.', 420, 'Sauté aromatics', NULL),
  (rid, 4, 'Combine and slow-cook', 'Add the onion-fish mixture to the cassava leaves. Drop in the whole scotch bonnet. Stir well, cover, and simmer on low heat for another 45-60 minutes, stirring occasionally, until the leaves are very tender and the sauce has thickened.', 3600, 'Slow cook', 'Add splashes of water if the pot gets dry. The final dish should be moist but not soupy.'),
  (rid, 5, 'Finish and serve', 'Remove the scotch bonnet. Taste and adjust seasoning with salt. Serve hot as a side dish alongside fufu or boiled cassava.', NULL, NULL, NULL);
END $$;

-- 3. Liboke ya Mbika (DR Congo)
DO $$
DECLARE rid UUID;
BEGIN
  INSERT INTO recipes (slug, name, name_local, description, country_code, country_name, region, ethnic_group, category, tags, diet_tags, prep_time_minutes, cook_time_minutes, difficulty, default_servings, story, occasion, best_served_with, calories, protein_g, carbs_g, fat_g, fiber_g, is_verified, is_featured)
  VALUES (
    'liboke-ya-mbika-cd', 'Liboke ya Mbika', 'Liboke ya Mbika', 'Ground pumpkin seeds steamed in banana leaves with tomatoes, onions, and spices, creating a rich and fragrant vegetarian parcel. A classic Congolese preparation.',
    'CD', 'Democratic Republic of Congo', 'Central Africa', 'Ngala', 'main',
    ARRAY['banana-leaf', 'pumpkin-seeds', 'steamed', 'traditional', 'congo'],
    ARRAY['vegetarian', 'vegan', 'gluten-free', 'dairy-free'],
    20, 45, 'medium', 4,
    'Liboke refers to any dish cooked in banana leaf parcels — a cooking technique central to Congolese cuisine. This version uses ground pumpkin seeds (mbika), which form a rich paste when steamed. The banana leaves impart a subtle grassy aroma while keeping everything moist. It is a favourite during Lent and among those who prefer plant-based meals.',
    'Everyday meals, Lent, plant-based dining',
    'Fufu or boiled plantains',
    340, 14, 18, 26, 5,
    true, false
  ) RETURNING id INTO rid;

  INSERT INTO recipe_ingredients (recipe_id, sort_order, group_name, amount, unit, name, prep_note, is_optional, substitution) VALUES
  (rid, 1, NULL, 300, 'g', 'pumpkin seeds', 'raw, shelled', false, 'egusi seeds'),
  (rid, 2, NULL, 2, 'medium', 'tomatoes', 'diced', false, NULL),
  (rid, 3, NULL, 1, 'large', 'onion', 'finely chopped', false, NULL),
  (rid, 4, NULL, 2, 'tbsp', 'palm oil', NULL, false, NULL),
  (rid, 5, NULL, 1, 'whole', 'scotch bonnet pepper', 'minced', true, 'habanero'),
  (rid, 6, NULL, 4, 'large', 'banana leaves', 'softened over flame', false, 'aluminium foil');

  INSERT INTO recipe_steps (recipe_id, step_number, title, instruction, timer_seconds, timer_label, tip) VALUES
  (rid, 1, 'Grind the seeds', 'Toast pumpkin seeds in a dry pan for 3 minutes until fragrant. Grind to a fine paste in a blender or food processor, adding a splash of water if needed.', 180, 'Toast seeds', 'Do not over-toast — the seeds should be lightly golden, not dark.'),
  (rid, 2, 'Mix the filling', 'Combine the ground pumpkin seed paste with diced tomatoes, chopped onion, palm oil, minced scotch bonnet, and salt. Mix until everything is well incorporated.', NULL, NULL, NULL),
  (rid, 3, 'Wrap in banana leaves', 'Soften banana leaves by briefly passing them over an open flame or blanching in hot water. Place a generous scoop of the mixture in the centre of each leaf and fold into a secure parcel, tying with kitchen string or strips of banana leaf.', NULL, NULL, 'Double-wrap the parcels to prevent leaking during steaming.'),
  (rid, 4, 'Steam the parcels', 'Place parcels in a steamer basket or in a pot with a small amount of water at the bottom. Cover and steam for 40-45 minutes until the filling is firm and cooked through.', 2700, 'Steam liboke', 'Check water level halfway through — do not let the pot run dry.'),
  (rid, 5, 'Serve', 'Unwrap the parcels at the table for a dramatic presentation. Serve with fufu or boiled plantains.', NULL, NULL, 'The banana leaf aroma is part of the experience — serve immediately after unwrapping.');
END $$;

-- =============================================
-- REPUBLIC OF CONGO (CG)
-- =============================================

-- 4. Poulet à la Muambé (Republic of Congo)
DO $$
DECLARE rid UUID;
BEGIN
  INSERT INTO recipes (slug, name, name_local, description, country_code, country_name, region, ethnic_group, category, tags, diet_tags, prep_time_minutes, cook_time_minutes, difficulty, default_servings, story, occasion, best_served_with, calories, protein_g, carbs_g, fat_g, fiber_g, is_verified, is_featured)
  VALUES (
    'poulet-muambe-cg', 'Poulet à la Muambé', 'Poulet à la Muambé', 'Chicken braised in a velvety palm butter sauce with garlic, okra, and chilli. The Congolese version features a lighter, more herbaceous sauce compared to its Kinshasa cousin.',
    'CG', 'Republic of Congo', 'Central Africa', 'Kongo', 'stew',
    ARRAY['palm-butter', 'chicken', 'national-dish', 'brazzaville', 'congo'],
    ARRAY['gluten-free', 'dairy-free', 'nut-free'],
    20, 55, 'medium', 6,
    'In Brazzaville, muambé is more than a dish — it is an expression of Kongo identity. Palm fruit is harvested, boiled, and pressed to extract the rich cream that defines this stew. While similar to the DR Congo version, the Brazzaville style often includes okra for body and a touch more chilli. It is served at every important occasion from births to funerals.',
    'Celebrations, family gatherings, Sunday lunch',
    'Chikwangue (cassava bread) or white rice',
    490, 36, 14, 34, 5,
    true, true
  ) RETURNING id INTO rid;

  INSERT INTO recipe_ingredients (recipe_id, sort_order, group_name, amount, unit, name, prep_note, is_optional, substitution) VALUES
  (rid, 1, NULL, 1.5, 'kg', 'chicken pieces', 'bone-in, skin on', false, NULL),
  (rid, 2, NULL, 350, 'g', 'palm butter', 'canned', false, NULL),
  (rid, 3, NULL, 200, 'g', 'okra', 'sliced', true, NULL),
  (rid, 4, NULL, 2, 'medium', 'tomatoes', 'blended', false, NULL),
  (rid, 5, NULL, 1, 'large', 'onion', 'diced', false, NULL),
  (rid, 6, NULL, 4, 'cloves', 'garlic', 'minced', false, NULL),
  (rid, 7, NULL, 2, 'whole', 'bay leaves', NULL, false, NULL),
  (rid, 8, NULL, 1, 'tsp', 'chilli flakes', NULL, true, NULL);

  INSERT INTO recipe_steps (recipe_id, step_number, title, instruction, timer_seconds, timer_label, tip) VALUES
  (rid, 1, 'Brown the chicken', 'Season chicken with salt and pepper. Heat a large pot with a little oil and brown chicken pieces on all sides until golden. Remove and set aside.', 600, 'Brown chicken', NULL),
  (rid, 2, 'Sauté the aromatics', 'In the same pot, cook the onion until soft. Add garlic and chilli flakes, stirring for 1 minute. Pour in the blended tomatoes and cook until reduced by half.', 480, 'Cook onion and tomatoes', NULL),
  (rid, 3, 'Add palm butter', 'Stir the palm butter into the tomato base until fully incorporated. Add bay leaves and 1 cup of water. Bring to a gentle simmer.', NULL, NULL, 'Palm butter can be thick — stir vigorously to avoid lumps.'),
  (rid, 4, 'Braise the chicken', 'Return the chicken pieces to the pot. Cover and cook on low heat for 35 minutes, turning the chicken halfway through.', 2100, 'Braise chicken', NULL),
  (rid, 5, 'Add okra and finish', 'Add the sliced okra and cook for another 10 minutes until tender. Remove bay leaves, taste for salt, and serve hot with chikwangue or rice.', 600, 'Cook okra', 'Okra adds natural thickness to the sauce.');
END $$;

-- 5. Saka-Saka au Poisson Fumé (Republic of Congo)
DO $$
DECLARE rid UUID;
BEGIN
  INSERT INTO recipes (slug, name, name_local, description, country_code, country_name, region, ethnic_group, category, tags, diet_tags, prep_time_minutes, cook_time_minutes, difficulty, default_servings, story, occasion, best_served_with, calories, protein_g, carbs_g, fat_g, fiber_g, is_verified, is_featured)
  VALUES (
    'saka-saka-poisson-cg', 'Saka-Saka au Poisson Fumé', 'Saka-Saka na Mbisi ya Kofumba', 'Cassava leaves slow-cooked with smoked fish, palm oil, and peanut butter, creating a deeply savoury and nutritious green stew beloved across the Republic of Congo.',
    'CG', 'Republic of Congo', 'Central Africa', 'Teke', 'side',
    ARRAY['cassava-leaves', 'smoked-fish', 'greens', 'traditional', 'brazzaville'],
    ARRAY['gluten-free', 'dairy-free', 'pescatarian'],
    25, 80, 'medium', 6,
    'The Brazzaville version of saka-saka distinguishes itself with the addition of peanut butter, which rounds out the bitterness of the cassava leaves and adds creaminess. Smoked fish from the Congo River provides a deep umami backbone. This is a dish of sustenance and community, often prepared in large batches and shared among neighbours.',
    'Daily meals, communal gatherings',
    'Fufu, chikwangue, or boiled cassava',
    310, 22, 14, 20, 8,
    true, false
  ) RETURNING id INTO rid;

  INSERT INTO recipe_ingredients (recipe_id, sort_order, group_name, amount, unit, name, prep_note, is_optional, substitution) VALUES
  (rid, 1, NULL, 500, 'g', 'cassava leaves', 'frozen and thawed, or fresh and pounded', false, 'spinach'),
  (rid, 2, NULL, 150, 'g', 'smoked fish', 'bones removed, flaked', false, 'smoked mackerel'),
  (rid, 3, NULL, 3, 'tbsp', 'palm oil', NULL, false, NULL),
  (rid, 4, NULL, 2, 'tbsp', 'peanut butter', 'smooth, natural', false, NULL),
  (rid, 5, NULL, 1, 'large', 'onion', 'diced', false, NULL),
  (rid, 6, NULL, 2, 'cloves', 'garlic', 'minced', false, NULL),
  (rid, 7, NULL, 1, 'cube', 'stock cube', 'crumbled', true, NULL);

  INSERT INTO recipe_steps (recipe_id, step_number, title, instruction, timer_seconds, timer_label, tip) VALUES
  (rid, 1, 'Cook the cassava leaves', 'Place cassava leaves in a large pot with 2 cups of water. Bring to a boil, then reduce to a simmer and cook for 30 minutes until softened.', 1800, 'Boil leaves', 'Fresh leaves need longer — up to 60 minutes. Frozen leaves are already partially cooked.'),
  (rid, 2, 'Prepare the base', 'In a separate pan, heat palm oil and sauté the onion until golden. Add garlic and cook for 1 minute. Add peanut butter and stir until melted and combined.', 420, 'Sauté base', NULL),
  (rid, 3, 'Combine everything', 'Add the onion-peanut mixture and flaked smoked fish to the cassava leaves. Crumble in the stock cube. Stir well to combine.', NULL, NULL, NULL),
  (rid, 4, 'Slow-cook', 'Cover and cook on low heat for 40-45 minutes, stirring every 10 minutes to prevent sticking. The dish is ready when the leaves are very tender and the sauce has thickened.', 2700, 'Slow cook', 'The peanut butter will thicken the sauce as it cooks — add water if too thick.'),
  (rid, 5, 'Serve', 'Taste and adjust salt. Serve hot alongside fufu or chikwangue.', NULL, NULL, NULL);
END $$;

-- 6. Mbisi ye Kalou (Republic of Congo)
DO $$
DECLARE rid UUID;
BEGIN
  INSERT INTO recipes (slug, name, name_local, description, country_code, country_name, region, ethnic_group, category, tags, diet_tags, prep_time_minutes, cook_time_minutes, difficulty, default_servings, story, occasion, best_served_with, calories, protein_g, carbs_g, fat_g, fiber_g, is_verified, is_featured)
  VALUES (
    'mbisi-ye-kalou-cg', 'Mbisi ye Kalou', 'Mbisi ye Kalou na Ndunda', 'Fresh river fish grilled over charcoal and served with a fiery pili-pili sauce. A simple but spectacular dish from the banks of the Congo River.',
    'CG', 'Republic of Congo', 'Central Africa', 'Mbochi', 'main',
    ARRAY['grilled-fish', 'pili-pili', 'river-fish', 'charcoal', 'brazzaville'],
    ARRAY['gluten-free', 'dairy-free', 'nut-free', 'pescatarian'],
    15, 25, 'easy', 4,
    'Along the Congo River, fishing is a way of life. Freshly caught tilapia or capitaine are scored, seasoned simply, and grilled over wood charcoal until the skin is crispy and the flesh flakes easily. The pili-pili sauce served alongside is the real star — a fiery blend of fresh chillies, lemon, and onion that cuts through the richness of the fish.',
    'Riverside dining, everyday meals, gatherings',
    'Boiled plantains, fried plantains, or fufu with a green salad',
    320, 42, 6, 14, 2,
    true, false
  ) RETURNING id INTO rid;

  INSERT INTO recipe_ingredients (recipe_id, sort_order, group_name, amount, unit, name, prep_note, is_optional, substitution) VALUES
  (rid, 1, 'Fish', 2, 'whole', 'tilapia', 'cleaned and scored on both sides', false, 'sea bream or red snapper'),
  (rid, 2, 'Fish', 2, 'tbsp', 'vegetable oil', NULL, false, NULL),
  (rid, 3, 'Fish', 1, 'tsp', 'salt', NULL, false, NULL),
  (rid, 4, 'Pili-pili sauce', 6, 'whole', 'bird''s eye chillies', 'finely chopped', false, 'scotch bonnet'),
  (rid, 5, 'Pili-pili sauce', 1, 'medium', 'onion', 'finely diced', false, NULL),
  (rid, 6, 'Pili-pili sauce', 2, 'whole', 'lemons', 'juiced', false, 'limes'),
  (rid, 7, 'Pili-pili sauce', 2, 'tbsp', 'vegetable oil', NULL, false, NULL);

  INSERT INTO recipe_steps (recipe_id, step_number, title, instruction, timer_seconds, timer_label, tip) VALUES
  (rid, 1, 'Prepare the fish', 'Rinse the tilapia and pat dry. Make 3-4 diagonal slashes on each side. Rub with oil and season generously with salt inside and out.', NULL, NULL, 'Scoring helps the heat penetrate evenly and lets the seasoning flavour the flesh.'),
  (rid, 2, 'Make the pili-pili sauce', 'Combine the chopped chillies, diced onion, lemon juice, oil, and a pinch of salt in a bowl. Mix well and set aside to let the flavours meld.', NULL, NULL, 'Make this at least 15 minutes ahead for the best flavour.'),
  (rid, 3, 'Grill the fish', 'Heat a charcoal grill or grill pan to high heat. Grill the fish for 8-10 minutes per side until the skin is charred and crispy and the flesh is opaque and flakes easily.', 600, 'Grill first side', 'Oil the grill grate well to prevent sticking. Do not move the fish until it releases naturally.'),
  (rid, 4, 'Flip and finish', 'Carefully flip the fish and grill the other side for another 8 minutes until cooked through.', 480, 'Grill second side', NULL),
  (rid, 5, 'Serve', 'Transfer the grilled fish to a platter and spoon the pili-pili sauce generously over the top. Serve immediately with boiled or fried plantains.', NULL, NULL, NULL);
END $$;

-- =============================================
-- CAMEROON (CM)
-- =============================================

-- 7. Ndolé (Cameroon)
DO $$
DECLARE rid UUID;
BEGIN
  INSERT INTO recipes (slug, name, name_local, description, country_code, country_name, region, ethnic_group, category, tags, diet_tags, prep_time_minutes, cook_time_minutes, difficulty, default_servings, story, occasion, best_served_with, calories, protein_g, carbs_g, fat_g, fiber_g, is_verified, is_featured)
  VALUES (
    'ndole-cm', 'Ndolé', 'Ndolé', 'Cameroon''s national dish — bitter leaves cooked down with ground peanuts, crayfish, and prawns into a rich, complex stew. Earthy, nutty, and deeply satisfying.',
    'CM', 'Cameroon', 'Central Africa', 'Douala', 'stew',
    ARRAY['bitter-leaves', 'peanut', 'prawns', 'national-dish', 'cameroon'],
    ARRAY['gluten-free', 'dairy-free'],
    40, 50, 'hard', 6,
    'Ndolé is the pride of the Douala people of coastal Cameroon and has been elevated to the status of national dish. The key ingredient — ndolé or bitter leaves — must be washed multiple times to reduce bitterness before being combined with ground peanuts and protein. The dish is labour-intensive but deeply rewarding, and no Cameroonian celebration is complete without it.',
    'Weddings, national holidays, family celebrations',
    'Boiled plantains, rice, or miondo (cassava sticks)',
    480, 32, 18, 34, 7,
    true, true
  ) RETURNING id INTO rid;

  INSERT INTO recipe_ingredients (recipe_id, sort_order, group_name, amount, unit, name, prep_note, is_optional, substitution) VALUES
  (rid, 1, NULL, 500, 'g', 'bitter leaves', 'washed and squeezed 3 times', false, 'spinach'),
  (rid, 2, NULL, 200, 'g', 'raw peanuts', 'roasted and ground', false, 'peanut butter'),
  (rid, 3, NULL, 300, 'g', 'prawns', 'peeled and deveined', false, NULL),
  (rid, 4, NULL, 50, 'g', 'dried crayfish', 'ground', false, NULL),
  (rid, 5, NULL, 1, 'large', 'onion', 'diced', false, NULL),
  (rid, 6, NULL, 3, 'cloves', 'garlic', 'minced', false, NULL),
  (rid, 7, NULL, 3, 'tbsp', 'palm oil', NULL, false, NULL),
  (rid, 8, NULL, 1, 'cube', 'stock cube', 'crumbled', true, NULL);

  INSERT INTO recipe_steps (recipe_id, step_number, title, instruction, timer_seconds, timer_label, tip) VALUES
  (rid, 1, 'Wash the bitter leaves', 'Place bitter leaves in a large bowl of water, squeeze and wash vigorously to remove bitterness. Repeat at least 3 times until the water runs relatively clear. Boil the washed leaves for 15 minutes, then drain.', 900, 'Boil leaves', 'If using spinach as a substitute, skip the washing — just wilt briefly.'),
  (rid, 2, 'Prepare the peanut paste', 'Roast raw peanuts in a dry pan until golden. Grind in a blender with a little water to form a smooth paste.', 300, 'Roast peanuts', 'Alternatively, use 200g of natural smooth peanut butter.'),
  (rid, 3, 'Cook the aromatics', 'Heat palm oil in a large pot. Sauté the onion until translucent. Add garlic and ground crayfish, cooking for 2 minutes until fragrant.', 420, 'Cook aromatics', NULL),
  (rid, 4, 'Build the stew', 'Add the peanut paste to the pot and stir continuously for 5 minutes. Add the drained bitter leaves and stock cube. Stir to combine and cook for 20 minutes on medium-low heat.', 1200, 'Cook stew base', 'Stir frequently to prevent the peanut paste from sticking to the bottom.'),
  (rid, 5, 'Add the prawns', 'Add the prawns to the stew and cook for 8-10 minutes until pink and cooked through. Taste and adjust seasoning.', 600, 'Cook prawns', NULL),
  (rid, 6, 'Serve', 'Serve hot with boiled plantains, rice, or miondo. The stew should be thick and glossy.', NULL, NULL, 'Ndolé tastes even better the next day as the flavours deepen overnight.');
END $$;

-- 8. Eru (Cameroon)
DO $$
DECLARE rid UUID;
BEGIN
  INSERT INTO recipes (slug, name, name_local, description, country_code, country_name, region, ethnic_group, category, tags, diet_tags, prep_time_minutes, cook_time_minutes, difficulty, default_servings, story, occasion, best_served_with, calories, protein_g, carbs_g, fat_g, fiber_g, is_verified, is_featured)
  VALUES (
    'eru-cm', 'Eru', 'Eru', 'A hearty stew of shredded eru leaves and waterleaf cooked with palm oil, smoked fish, and cow skin. A signature dish of the South-West Cameroon region.',
    'CM', 'Cameroon', 'Central Africa', 'Bayangi', 'stew',
    ARRAY['eru-leaves', 'waterleaf', 'smoked-fish', 'south-west', 'cameroon'],
    ARRAY['gluten-free', 'dairy-free'],
    30, 40, 'medium', 6,
    'Eru is the soul food of the anglophone South-West region of Cameroon, especially among the Bayangi people. The wild eru vine (Gnetum africanum) grows in the dense equatorial forest and its leaves are hand-shredded into thin strips. Combined with the wilting waterleaf, generous palm oil, and smoked proteins, it creates a dish that is simultaneously light and deeply flavourful.',
    'Family meals, ceremonies, Sunday lunch',
    'Garri (cassava granules soaked in water) or fufu corn',
    420, 28, 10, 32, 6,
    true, false
  ) RETURNING id INTO rid;

  INSERT INTO recipe_ingredients (recipe_id, sort_order, group_name, amount, unit, name, prep_note, is_optional, substitution) VALUES
  (rid, 1, NULL, 300, 'g', 'eru leaves', 'finely shredded', false, NULL),
  (rid, 2, NULL, 400, 'g', 'waterleaf', 'roughly chopped', false, 'spinach'),
  (rid, 3, NULL, 150, 'g', 'smoked fish', 'deboned and flaked', false, NULL),
  (rid, 4, NULL, 150, 'g', 'cow skin', 'pre-cooked and sliced', true, 'smoked turkey'),
  (rid, 5, NULL, 150, 'ml', 'palm oil', NULL, false, NULL),
  (rid, 6, NULL, 30, 'g', 'dried crayfish', 'ground', false, NULL),
  (rid, 7, NULL, 1, 'tsp', 'salt', NULL, false, NULL);

  INSERT INTO recipe_steps (recipe_id, step_number, title, instruction, timer_seconds, timer_label, tip) VALUES
  (rid, 1, 'Prepare the leaves', 'Wash the eru leaves thoroughly. If using fresh, shred into very thin strips. Wash and roughly chop the waterleaf.', NULL, NULL, 'Eru leaves should be cut as thinly as possible — this is key to the texture.'),
  (rid, 2, 'Cook the waterleaf', 'Place the waterleaf in a dry pot over medium heat. Cook, stirring occasionally, until it wilts and releases all its water, about 10 minutes. Drain off the excess liquid.', 600, 'Wilt waterleaf', 'Waterleaf releases a lot of water — draining it prevents a watery final dish.'),
  (rid, 3, 'Add palm oil and proteins', 'Add palm oil to the wilted waterleaf. Stir in the smoked fish, cow skin, and ground crayfish. Cook for 5 minutes to meld the flavours.', 300, 'Cook proteins', NULL),
  (rid, 4, 'Add eru leaves', 'Add the shredded eru leaves and stir to combine. The eru should absorb the palm oil and soften slightly. Cook on low heat for 20 minutes, stirring occasionally.', 1200, 'Cook eru', 'Do not add water — the dish should be dry and oily, not soupy.'),
  (rid, 5, 'Season and serve', 'Season with salt and stir. Serve hot with garri soaked in cold water or fufu corn.', NULL, NULL, 'Eru is traditionally eaten with the fingers, using garri as a scoop.');
END $$;

-- 9. Koki Beans (Cameroon)
DO $$
DECLARE rid UUID;
BEGIN
  INSERT INTO recipes (slug, name, name_local, description, country_code, country_name, region, ethnic_group, category, tags, diet_tags, prep_time_minutes, cook_time_minutes, difficulty, default_servings, story, occasion, best_served_with, calories, protein_g, carbs_g, fat_g, fiber_g, is_verified, is_featured)
  VALUES (
    'koki-beans-cm', 'Koki Beans', 'Koki Cornée', 'Black-eyed peas blended into a smooth paste with palm oil and spices, then wrapped in banana leaves and steamed into a savoury, custard-like cake. A Cameroonian classic.',
    'CM', 'Cameroon', 'Central Africa', 'Bamileke', 'side',
    ARRAY['black-eyed-peas', 'banana-leaf', 'steamed', 'traditional', 'cameroon'],
    ARRAY['vegetarian', 'vegan', 'gluten-free', 'dairy-free'],
    30, 60, 'medium', 8,
    'Koki is a festive dish from the grasslands of western Cameroon, traditionally prepared by the Bamileke people for celebrations and rites of passage. The black-eyed peas are soaked, peeled, and blended into a smooth batter enriched with palm oil, then steamed in banana leaf parcels. The result is a dense, flavourful cake with a beautiful orange hue from the palm oil.',
    'Festivals, celebrations, rites of passage',
    'Ripe plantains, puff-puff, or on its own as a snack',
    290, 14, 30, 14, 8,
    true, true
  ) RETURNING id INTO rid;

  INSERT INTO recipe_ingredients (recipe_id, sort_order, group_name, amount, unit, name, prep_note, is_optional, substitution) VALUES
  (rid, 1, NULL, 500, 'g', 'black-eyed peas', 'soaked overnight and peeled', false, NULL),
  (rid, 2, NULL, 100, 'ml', 'palm oil', NULL, false, NULL),
  (rid, 3, NULL, 1, 'large', 'onion', 'roughly chopped', false, NULL),
  (rid, 4, NULL, 1, 'whole', 'scotch bonnet pepper', NULL, true, NULL),
  (rid, 5, NULL, 1, 'tsp', 'salt', NULL, false, NULL),
  (rid, 6, NULL, 8, 'large', 'banana leaves', 'softened over flame', false, 'aluminium foil');

  INSERT INTO recipe_steps (recipe_id, step_number, title, instruction, timer_seconds, timer_label, tip) VALUES
  (rid, 1, 'Prepare the beans', 'Soak black-eyed peas overnight. Rub between your hands to loosen the skins, then rinse — the skins will float to the surface. Repeat until most skins are removed.', NULL, NULL, 'Peeling the beans is essential for a smooth texture. Patience here pays off.'),
  (rid, 2, 'Blend the batter', 'Blend the peeled beans with onion, scotch bonnet, and a splash of water until very smooth. Transfer to a large bowl and stir in palm oil and salt, mixing vigorously until the oil is fully incorporated.', NULL, NULL, 'The batter should be thick but pourable — add water sparingly.'),
  (rid, 3, 'Wrap in banana leaves', 'Soften banana leaves over a flame or in hot water. Place a ladleful of batter in the centre of each leaf and fold into a neat rectangular parcel, securing with string or toothpicks.', NULL, NULL, 'Make sure the parcels are sealed well to prevent water from getting in during steaming.'),
  (rid, 4, 'Steam the koki', 'Arrange parcels in a large steamer or pot with a raised platform and water at the bottom. Cover tightly and steam for 1 hour until firm and set.', 3600, 'Steam koki', 'Check water level every 20 minutes and top up if needed.'),
  (rid, 5, 'Serve', 'Unwrap the koki parcels and slice or serve whole. Enjoy warm with ripe plantains or on its own.', NULL, NULL, 'Koki can be reheated by re-steaming the next day.');
END $$;

-- =============================================
-- CENTRAL AFRICAN REPUBLIC (CF)
-- =============================================

-- 10. Gozo (Central African Republic)
DO $$
DECLARE rid UUID;
BEGIN
  INSERT INTO recipes (slug, name, name_local, description, country_code, country_name, region, ethnic_group, category, tags, diet_tags, prep_time_minutes, cook_time_minutes, difficulty, default_servings, story, occasion, best_served_with, calories, protein_g, carbs_g, fat_g, fiber_g, is_verified, is_featured)
  VALUES (
    'gozo-cf', 'Gozo', 'Gozo', 'A thick, stiff cassava flour porridge that serves as the staple base for most Central African meals. Smooth, stretchy, and perfect for scooping up stews and sauces.',
    'CF', 'Central African Republic', 'Central Africa', 'Gbaya', 'side',
    ARRAY['cassava', 'staple', 'fufu', 'traditional', 'central-african-republic'],
    ARRAY['vegetarian', 'vegan', 'gluten-free', 'dairy-free', 'nut-free'],
    5, 20, 'easy', 6,
    'Gozo is the daily bread of the Central African Republic. Made from cassava flour and water, this stiff porridge is shaped into balls and used to scoop up every sauce and stew in the country. Preparing gozo well requires strong arms and practice — the flour must be stirred vigorously and continuously to achieve the right consistency without lumps.',
    'Every meal, daily staple',
    'Any stew or sauce — especially peanut or okra-based sauces',
    220, 2, 52, 0.5, 3,
    true, true
  ) RETURNING id INTO rid;

  INSERT INTO recipe_ingredients (recipe_id, sort_order, group_name, amount, unit, name, prep_note, is_optional, substitution) VALUES
  (rid, 1, NULL, 3, 'cups', 'cassava flour', 'fine', false, NULL),
  (rid, 2, NULL, 4, 'cups', 'water', NULL, false, NULL),
  (rid, 3, NULL, 0.5, 'tsp', 'salt', NULL, true, NULL);

  INSERT INTO recipe_steps (recipe_id, step_number, title, instruction, timer_seconds, timer_label, tip) VALUES
  (rid, 1, 'Boil the water', 'Bring 4 cups of water to a rolling boil in a heavy-bottomed pot. Add salt if using.', NULL, NULL, 'Use a heavy pot — you will be stirring vigorously.'),
  (rid, 2, 'Add cassava flour gradually', 'Reduce heat to medium. Begin adding cassava flour a little at a time, stirring constantly with a strong wooden spoon. Continue adding flour and stirring.', 300, 'Add flour', 'Add flour slowly to prevent lumps from forming.'),
  (rid, 3, 'Stir vigorously', 'Once all the flour is incorporated, stir vigorously for 10-12 minutes. The mixture should pull away from the sides of the pot and form a smooth, stretchy dough.', 720, 'Stir gozo', 'This requires significant arm strength — do not stop stirring or the bottom will scorch.'),
  (rid, 4, 'Shape and serve', 'Wet your hands and shape the gozo into smooth balls. Place on a plate and serve immediately alongside your choice of stew or sauce.', NULL, NULL, 'Dip your hands in water before shaping to prevent sticking.');
END $$;

-- 11. Sauce Graine (Central African Republic)
DO $$
DECLARE rid UUID;
BEGIN
  INSERT INTO recipes (slug, name, name_local, description, country_code, country_name, region, ethnic_group, category, tags, diet_tags, prep_time_minutes, cook_time_minutes, difficulty, default_servings, story, occasion, best_served_with, calories, protein_g, carbs_g, fat_g, fiber_g, is_verified, is_featured)
  VALUES (
    'sauce-graine-cf', 'Sauce Graine', 'Sauce Graine', 'A rich palm fruit sauce simmered with smoked fish, tomatoes, and hot peppers. The quintessential accompaniment to gozo in the Central African Republic.',
    'CF', 'Central African Republic', 'Central Africa', 'Banda', 'sauce',
    ARRAY['palm-fruit', 'smoked-fish', 'sauce', 'traditional', 'central-african-republic'],
    ARRAY['gluten-free', 'dairy-free', 'nut-free', 'pescatarian'],
    15, 45, 'medium', 6,
    'Sauce graine — literally "seed sauce" — is made from the pulp of palm fruits, which are boiled and pressed to extract a thick, rich cream. In the Central African Republic, this sauce is the most common pairing with gozo. The addition of smoked fish and chilli creates layers of flavour that make this simple sauce remarkably complex.',
    'Everyday meals, family dining',
    'Gozo (cassava porridge) or rice',
    380, 20, 10, 30, 3,
    true, false
  ) RETURNING id INTO rid;

  INSERT INTO recipe_ingredients (recipe_id, sort_order, group_name, amount, unit, name, prep_note, is_optional, substitution) VALUES
  (rid, 1, NULL, 400, 'g', 'palm fruit pulp', 'canned or tinned palm cream', false, NULL),
  (rid, 2, NULL, 200, 'g', 'smoked fish', 'deboned and flaked', false, 'smoked catfish'),
  (rid, 3, NULL, 3, 'medium', 'tomatoes', 'chopped', false, NULL),
  (rid, 4, NULL, 1, 'large', 'onion', 'diced', false, NULL),
  (rid, 5, NULL, 2, 'whole', 'scotch bonnet peppers', 'left whole', true, NULL),
  (rid, 6, NULL, 1, 'cup', 'water', NULL, false, NULL);

  INSERT INTO recipe_steps (recipe_id, step_number, title, instruction, timer_seconds, timer_label, tip) VALUES
  (rid, 1, 'Prepare the palm cream', 'If using fresh palm fruits, boil for 20 minutes, then pound and strain to extract the cream. If using canned palm cream, open and stir until smooth.', NULL, NULL, 'Canned palm cream is widely available and saves significant preparation time.'),
  (rid, 2, 'Sauté the aromatics', 'Heat a tablespoon of palm oil in a pot. Cook the onion until soft and translucent, about 5 minutes. Add the chopped tomatoes and cook until they break down.', 480, 'Cook onion and tomato', NULL),
  (rid, 3, 'Add the palm cream', 'Stir in the palm cream and water. Bring to a simmer, stirring well to prevent separation.', NULL, NULL, NULL),
  (rid, 4, 'Simmer with fish', 'Add the flaked smoked fish and whole scotch bonnet peppers. Cover and simmer for 30 minutes, stirring occasionally, until the sauce is rich and thickened with orange oil floating on top.', 1800, 'Simmer sauce', 'The orange oil on top is a sign the sauce is ready.'),
  (rid, 5, 'Serve', 'Remove the scotch bonnet peppers. Taste for salt and serve hot over gozo or rice.', NULL, NULL, NULL);
END $$;

-- 12. Kanda ti Nyma (Central African Republic)
DO $$
DECLARE rid UUID;
BEGIN
  INSERT INTO recipes (slug, name, name_local, description, country_code, country_name, region, ethnic_group, category, tags, diet_tags, prep_time_minutes, cook_time_minutes, difficulty, default_servings, story, occasion, best_served_with, calories, protein_g, carbs_g, fat_g, fiber_g, is_verified, is_featured)
  VALUES (
    'kanda-ti-nyma-cf', 'Kanda ti Nyma', 'Kanda ti Nyma', 'Savoury beef meatballs simmered in a thick peanut and tomato sauce. A hearty dish from the Central African Republic that is packed with protein and flavour.',
    'CF', 'Central African Republic', 'Central Africa', 'Zande', 'main',
    ARRAY['meatballs', 'peanut-sauce', 'beef', 'traditional', 'central-african-republic'],
    ARRAY['gluten-free', 'dairy-free'],
    25, 40, 'medium', 6,
    'Kanda ti nyma — meaning "meat balls" in Sango — is a festive dish reserved for special occasions and honoured guests. The meatballs are often made with hand-minced beef and bound with ground peanuts, which give them a distinctive nutty flavour and firm texture. Simmered in a rich tomato-peanut sauce, this is comfort food at its finest in the Central African Republic.',
    'Special occasions, guest hospitality, celebrations',
    'Gozo, rice, or boiled plantains',
    460, 34, 16, 30, 5,
    true, false
  ) RETURNING id INTO rid;

  INSERT INTO recipe_ingredients (recipe_id, sort_order, group_name, amount, unit, name, prep_note, is_optional, substitution) VALUES
  (rid, 1, 'Meatballs', 500, 'g', 'beef mince', NULL, false, NULL),
  (rid, 2, 'Meatballs', 50, 'g', 'roasted peanuts', 'finely ground', false, NULL),
  (rid, 3, 'Meatballs', 1, 'small', 'onion', 'very finely diced', false, NULL),
  (rid, 4, 'Meatballs', 1, 'tsp', 'salt', NULL, false, NULL),
  (rid, 5, 'Sauce', 3, 'tbsp', 'peanut butter', 'smooth', false, NULL),
  (rid, 6, 'Sauce', 4, 'medium', 'tomatoes', 'blended', false, NULL),
  (rid, 7, 'Sauce', 1, 'large', 'onion', 'diced', false, NULL),
  (rid, 8, 'Sauce', 2, 'tbsp', 'vegetable oil', NULL, false, NULL);

  INSERT INTO recipe_steps (recipe_id, step_number, title, instruction, timer_seconds, timer_label, tip) VALUES
  (rid, 1, 'Make the meatballs', 'Combine beef mince, ground peanuts, finely diced onion, and salt in a bowl. Mix well with your hands until the mixture holds together. Shape into golf ball-sized meatballs.', NULL, NULL, 'The ground peanuts act as a binder — no egg needed.'),
  (rid, 2, 'Brown the meatballs', 'Heat oil in a large pan and brown the meatballs on all sides, about 6 minutes total. Remove and set aside.', 360, 'Brown meatballs', 'Do not overcrowd the pan — brown in batches for the best crust.'),
  (rid, 3, 'Make the sauce', 'In the same pan, sauté the diced onion until soft. Add the blended tomatoes and cook for 10 minutes until thickened. Stir in the peanut butter and 1 cup of water, mixing until smooth.', 600, 'Cook tomato sauce', NULL),
  (rid, 4, 'Simmer meatballs in sauce', 'Return the meatballs to the sauce. Cover and simmer gently for 25 minutes, turning the meatballs once halfway through.', 1500, 'Simmer meatballs', 'Keep the heat low — vigorous boiling will break the meatballs apart.'),
  (rid, 5, 'Serve', 'Taste the sauce and adjust seasoning. Serve the meatballs and sauce over gozo or rice.', NULL, NULL, NULL);
END $$;

-- =============================================
-- CHAD (TD)
-- =============================================

-- 13. Daraba (Chad)
DO $$
DECLARE rid UUID;
BEGIN
  INSERT INTO recipes (slug, name, name_local, description, country_code, country_name, region, ethnic_group, category, tags, diet_tags, prep_time_minutes, cook_time_minutes, difficulty, default_servings, story, occasion, best_served_with, calories, protein_g, carbs_g, fat_g, fiber_g, is_verified, is_featured)
  VALUES (
    'daraba-td', 'Daraba', 'Daraba', 'A thick, creamy stew of mixed greens, okra, tomatoes, and peanut butter, sometimes enriched with smoked fish. A beloved everyday dish across southern Chad.',
    'TD', 'Chad', 'Central Africa', 'Sara', 'stew',
    ARRAY['greens', 'peanut', 'okra', 'traditional', 'chad'],
    ARRAY['gluten-free', 'dairy-free', 'vegetarian'],
    20, 35, 'easy', 6,
    'Daraba is the everyday stew of southern Chad, where the Sara people have cultivated a rich agricultural tradition. The dish combines whatever leafy greens are available — spinach, sorrel, or sweet potato leaves — with okra for body and peanut butter for richness. It is simple, nourishing, and endlessly adaptable, making it the backbone of daily meals.',
    'Everyday meals, communal dining',
    'Boule (millet porridge) or rice',
    320, 16, 22, 20, 8,
    true, true
  ) RETURNING id INTO rid;

  INSERT INTO recipe_ingredients (recipe_id, sort_order, group_name, amount, unit, name, prep_note, is_optional, substitution) VALUES
  (rid, 1, NULL, 400, 'g', 'mixed greens', 'spinach and sorrel, chopped', false, 'spinach alone'),
  (rid, 2, NULL, 200, 'g', 'okra', 'sliced', false, NULL),
  (rid, 3, NULL, 3, 'tbsp', 'peanut butter', 'smooth, natural', false, NULL),
  (rid, 4, NULL, 3, 'medium', 'tomatoes', 'chopped', false, NULL),
  (rid, 5, NULL, 1, 'large', 'onion', 'diced', false, NULL),
  (rid, 6, NULL, 2, 'tbsp', 'palm oil', NULL, false, 'vegetable oil'),
  (rid, 7, NULL, 1, 'whole', 'scotch bonnet pepper', 'minced', true, NULL);

  INSERT INTO recipe_steps (recipe_id, step_number, title, instruction, timer_seconds, timer_label, tip) VALUES
  (rid, 1, 'Cook the aromatics', 'Heat palm oil in a large pot over medium heat. Sauté the diced onion until soft and golden, about 5 minutes. Add the scotch bonnet and chopped tomatoes, cooking until the tomatoes break down.', 480, 'Cook onion and tomato', NULL),
  (rid, 2, 'Add peanut butter', 'Stir the peanut butter into the pot with 2 cups of water, mixing until smooth and well combined. Bring to a gentle simmer.', NULL, NULL, 'Dissolve the peanut butter in a little warm water first to prevent clumping.'),
  (rid, 3, 'Add okra', 'Add the sliced okra to the simmering sauce and cook for 10 minutes until the okra softens and thickens the stew.', 600, 'Cook okra', NULL),
  (rid, 4, 'Add the greens', 'Add the chopped greens to the pot and stir to combine. Cover and cook for 15 minutes until the greens are wilted and tender.', 900, 'Cook greens', 'Do not overcook — the greens should be tender but still vibrant green.'),
  (rid, 5, 'Serve', 'Taste and adjust salt and pepper. Serve hot over boule or rice.', NULL, NULL, 'Daraba thickens as it cools — add a splash of water when reheating.');
END $$;

-- 14. Boule (Chad)
DO $$
DECLARE rid UUID;
BEGIN
  INSERT INTO recipes (slug, name, name_local, description, country_code, country_name, region, ethnic_group, category, tags, diet_tags, prep_time_minutes, cook_time_minutes, difficulty, default_servings, story, occasion, best_served_with, calories, protein_g, carbs_g, fat_g, fiber_g, is_verified, is_featured)
  VALUES (
    'boule-td', 'Boule', 'Boule', 'A smooth, firm millet porridge shaped into balls and served as the staple accompaniment to sauces and stews. The foundation of every Chadian meal.',
    'TD', 'Chad', 'Central Africa', 'Sara', 'side',
    ARRAY['millet', 'staple', 'porridge', 'traditional', 'chad'],
    ARRAY['vegetarian', 'vegan', 'gluten-free', 'dairy-free', 'nut-free'],
    5, 25, 'easy', 6,
    'Boule is to Chad what bread is to France. This thick millet porridge is prepared daily in virtually every household, and eating without it feels incomplete. The millet is ground into flour and cooked with water into a firm, smooth paste. It is eaten by tearing off pieces and using them to scoop up stews and sauces — a communal act that defines Chadian mealtimes.',
    'Every meal, daily staple',
    'Daraba, okra sauce, meat stews',
    240, 6, 50, 2, 4,
    true, false
  ) RETURNING id INTO rid;

  INSERT INTO recipe_ingredients (recipe_id, sort_order, group_name, amount, unit, name, prep_note, is_optional, substitution) VALUES
  (rid, 1, NULL, 3, 'cups', 'millet flour', NULL, false, 'sorghum flour'),
  (rid, 2, NULL, 5, 'cups', 'water', NULL, false, NULL),
  (rid, 3, NULL, 0.5, 'tsp', 'salt', NULL, true, NULL);

  INSERT INTO recipe_steps (recipe_id, step_number, title, instruction, timer_seconds, timer_label, tip) VALUES
  (rid, 1, 'Start the porridge', 'Bring 5 cups of water to a boil in a heavy-bottomed pot. Mix 1 cup of millet flour with 1 cup of cold water to make a slurry. Pour the slurry into the boiling water, stirring constantly.', NULL, NULL, 'The slurry prevents lumps from forming in the final porridge.'),
  (rid, 2, 'Cook the base', 'Stir the mixture continuously over medium heat for 5 minutes until it begins to thicken. Add salt if using.', 300, 'Cook base', NULL),
  (rid, 3, 'Add remaining flour', 'Gradually add the remaining 2 cups of millet flour, stirring vigorously with a wooden spoon. The mixture will become very thick and stiff.', 600, 'Add flour', 'Use a strong wooden spoon — metal spoons can bend under the pressure.'),
  (rid, 4, 'Finish cooking', 'Continue stirring for another 10 minutes over low heat until the boule pulls away from the sides of the pot and is completely smooth.', 600, 'Cook boule', 'The more you stir, the smoother the boule will be.'),
  (rid, 5, 'Shape and serve', 'Wet a bowl or your hands and shape the boule into smooth rounds. Serve on a plate alongside stews and sauces.', NULL, NULL, 'Traditionally served in a communal bowl for everyone to share.');
END $$;

-- 15. La Bouillie (Chad)
DO $$
DECLARE rid UUID;
BEGIN
  INSERT INTO recipes (slug, name, name_local, description, country_code, country_name, region, ethnic_group, category, tags, diet_tags, prep_time_minutes, cook_time_minutes, difficulty, default_servings, story, occasion, best_served_with, calories, protein_g, carbs_g, fat_g, fiber_g, is_verified, is_featured)
  VALUES (
    'la-bouillie-td', 'La Bouillie', 'La Bouillie', 'A warm, sweet millet porridge flavoured with vanilla, lemon zest, and sugar. A cherished Chadian breakfast served to children and adults alike.',
    'TD', 'Chad', 'Central Africa', 'Kanuri', 'breakfast',
    ARRAY['millet', 'porridge', 'breakfast', 'sweet', 'chad'],
    ARRAY['vegetarian', 'gluten-free', 'nut-free'],
    5, 20, 'easy', 4,
    'La Bouillie is the breakfast that fuels Chad from N''Djamena to the rural south. This thin, sweet millet porridge is the first food many Chadian children eat, and it remains a comfort throughout life. Street vendors sell it from large pots in the morning, ladling it into bowls for workers and students rushing to start their day.',
    'Breakfast, snack time',
    'Bread, beignets, or on its own',
    260, 6, 48, 5, 3,
    true, false
  ) RETURNING id INTO rid;

  INSERT INTO recipe_ingredients (recipe_id, sort_order, group_name, amount, unit, name, prep_note, is_optional, substitution) VALUES
  (rid, 1, NULL, 1, 'cup', 'millet flour', 'fine', false, 'sorghum flour'),
  (rid, 2, NULL, 4, 'cups', 'water', NULL, false, NULL),
  (rid, 3, NULL, 0.5, 'cup', 'sugar', NULL, false, 'honey'),
  (rid, 4, NULL, 1, 'cup', 'milk', NULL, false, 'coconut milk'),
  (rid, 5, NULL, 1, 'tsp', 'vanilla extract', NULL, false, NULL),
  (rid, 6, NULL, 1, 'whole', 'lemon', 'zested', true, NULL);

  INSERT INTO recipe_steps (recipe_id, step_number, title, instruction, timer_seconds, timer_label, tip) VALUES
  (rid, 1, 'Make the slurry', 'Mix the millet flour with 1 cup of cold water until smooth, ensuring there are no lumps.', NULL, NULL, NULL),
  (rid, 2, 'Cook the porridge', 'Bring the remaining 3 cups of water to a boil. Slowly pour in the millet slurry while stirring constantly. Reduce heat to medium-low and cook, stirring, for 10 minutes until thickened.', 600, 'Cook porridge', 'Constant stirring prevents lumps and scorching.'),
  (rid, 3, 'Add sweetness and flavour', 'Stir in the sugar, milk, vanilla extract, and lemon zest. Continue cooking for another 5 minutes until everything is well combined and the porridge reaches your desired consistency.', 300, 'Simmer', NULL),
  (rid, 4, 'Serve', 'Ladle into bowls and serve warm. The porridge can be made thinner or thicker by adjusting the water.', NULL, NULL, 'Add more milk for a creamier texture, or thin with water for a drinkable consistency.');
END $$;

-- =============================================
-- GABON (GA)
-- =============================================

-- 16. Nyembwe Chicken (Gabon)
DO $$
DECLARE rid UUID;
BEGIN
  INSERT INTO recipes (slug, name, name_local, description, country_code, country_name, region, ethnic_group, category, tags, diet_tags, prep_time_minutes, cook_time_minutes, difficulty, default_servings, story, occasion, best_served_with, calories, protein_g, carbs_g, fat_g, fiber_g, is_verified, is_featured)
  VALUES (
    'nyembwe-chicken-ga', 'Nyembwe Chicken', 'Poulet au Nyembwé', 'Gabon''s national dish — chicken slowly braised in a luscious palm nut sauce until the meat is falling off the bone. Rich, earthy, and deeply comforting.',
    'GA', 'Gabon', 'Central Africa', 'Fang', 'stew',
    ARRAY['palm-nut', 'chicken', 'national-dish', 'comfort-food', 'gabon'],
    ARRAY['gluten-free', 'dairy-free', 'nut-free'],
    20, 60, 'medium', 6,
    'Nyembwé refers to the thick cream extracted from palm nuts, and this dish is the crown jewel of Gabonese cooking. Among the Fang people, preparing nyembwe chicken well is a mark of culinary skill and hospitality. The sauce must achieve the perfect balance of richness without being oily, and the chicken must be tender enough to fall apart at the touch of a fork.',
    'National celebrations, family feasts, Sunday lunch',
    'Boiled plantains, rice, or cassava',
    510, 36, 10, 38, 3,
    true, true
  ) RETURNING id INTO rid;

  INSERT INTO recipe_ingredients (recipe_id, sort_order, group_name, amount, unit, name, prep_note, is_optional, substitution) VALUES
  (rid, 1, NULL, 1.5, 'kg', 'chicken pieces', 'bone-in thighs and drumsticks', false, NULL),
  (rid, 2, NULL, 400, 'g', 'palm nut cream', 'canned', false, NULL),
  (rid, 3, NULL, 2, 'large', 'onions', 'sliced', false, NULL),
  (rid, 4, NULL, 3, 'cloves', 'garlic', 'crushed', false, NULL),
  (rid, 5, NULL, 2, 'medium', 'tomatoes', 'chopped', false, NULL),
  (rid, 6, NULL, 1, 'whole', 'habanero pepper', 'left whole', true, NULL),
  (rid, 7, NULL, 2, 'tbsp', 'lemon juice', NULL, false, NULL),
  (rid, 8, NULL, 1, 'cup', 'water', NULL, false, NULL);

  INSERT INTO recipe_steps (recipe_id, step_number, title, instruction, timer_seconds, timer_label, tip) VALUES
  (rid, 1, 'Marinate the chicken', 'Season the chicken with salt, pepper, crushed garlic, and lemon juice. Let it marinate for at least 15 minutes at room temperature.', 900, 'Marinate', 'Longer marination — up to 2 hours in the fridge — yields deeper flavour.'),
  (rid, 2, 'Brown the chicken', 'Heat a little oil in a large heavy pot. Brown the chicken pieces on all sides until golden. Remove and set aside.', 600, 'Brown chicken', NULL),
  (rid, 3, 'Cook the onions and tomatoes', 'In the same pot, sauté sliced onions until softened. Add the chopped tomatoes and cook until they collapse into a paste, about 8 minutes.', 480, 'Cook onion-tomato base', NULL),
  (rid, 4, 'Add palm nut cream', 'Stir in the palm nut cream and water, mixing until smooth. Drop in the whole habanero pepper. Bring to a gentle simmer.', NULL, NULL, 'Do not break the habanero — it adds aroma without making the dish too spicy.'),
  (rid, 5, 'Braise the chicken', 'Return the chicken to the pot and nestle into the sauce. Cover and cook on low heat for 40-45 minutes until the chicken is very tender and the sauce is thick and rich.', 2700, 'Braise chicken', 'Resist the urge to stir too often — let the sauce reduce naturally.'),
  (rid, 6, 'Serve', 'Remove the habanero. Taste and adjust salt. Serve hot with boiled plantains or rice.', NULL, NULL, 'The sauce should coat the back of a spoon — if too thin, simmer uncovered for a few more minutes.');
END $$;

-- 17. Smoked Fish with Plantains (Gabon)
DO $$
DECLARE rid UUID;
BEGIN
  INSERT INTO recipes (slug, name, name_local, description, country_code, country_name, region, ethnic_group, category, tags, diet_tags, prep_time_minutes, cook_time_minutes, difficulty, default_servings, story, occasion, best_served_with, calories, protein_g, carbs_g, fat_g, fiber_g, is_verified, is_featured)
  VALUES (
    'poisson-fume-plantain-ga', 'Smoked Fish with Plantains', 'Poisson Fumé aux Bananes Plantains', 'Flaked smoked fish stewed in a savoury tomato and onion sauce, served over golden fried plantains. A simple and satisfying Gabonese classic.',
    'GA', 'Gabon', 'Central Africa', 'Myene', 'main',
    ARRAY['smoked-fish', 'plantain', 'tomato', 'everyday', 'gabon'],
    ARRAY['gluten-free', 'dairy-free', 'nut-free', 'pescatarian'],
    15, 30, 'easy', 4,
    'This dish reflects the abundant fishing culture of Gabon''s coast and river systems. Smoked fish — preserved for longer shelf life in the tropical climate — is a pantry staple. Paired with sweet, ripe plantains and a quick tomato sauce, this meal comes together effortlessly and is a weeknight favourite across Libreville and beyond.',
    'Weeknight dinner, everyday meals',
    'Steamed rice or on its own',
    410, 28, 42, 16, 5,
    true, false
  ) RETURNING id INTO rid;

  INSERT INTO recipe_ingredients (recipe_id, sort_order, group_name, amount, unit, name, prep_note, is_optional, substitution) VALUES
  (rid, 1, NULL, 300, 'g', 'smoked fish', 'deboned and flaked', false, 'smoked mackerel'),
  (rid, 2, NULL, 4, 'whole', 'ripe plantains', 'peeled and sliced diagonally', false, NULL),
  (rid, 3, NULL, 3, 'medium', 'tomatoes', 'chopped', false, NULL),
  (rid, 4, NULL, 1, 'large', 'onion', 'sliced', false, NULL),
  (rid, 5, NULL, 2, 'tbsp', 'vegetable oil', 'for frying', false, NULL),
  (rid, 6, NULL, 1, 'whole', 'scotch bonnet pepper', 'sliced', true, NULL);

  INSERT INTO recipe_steps (recipe_id, step_number, title, instruction, timer_seconds, timer_label, tip) VALUES
  (rid, 1, 'Fry the plantains', 'Heat oil in a frying pan over medium heat. Fry the plantain slices until golden brown on each side, about 3 minutes per side. Drain on paper towels and set aside.', 420, 'Fry plantains', 'Use ripe plantains — yellow with black spots — for natural sweetness.'),
  (rid, 2, 'Make the sauce', 'In the same pan, add a little more oil if needed. Sauté the sliced onion until soft. Add the chopped tomatoes and scotch bonnet, cooking for 10 minutes until the tomatoes break down into a sauce.', 600, 'Cook sauce', NULL),
  (rid, 3, 'Add the smoked fish', 'Add the flaked smoked fish to the sauce and stir gently. Cook for 5 minutes to let the fish absorb the flavours of the sauce.', 300, 'Cook fish', 'Be gentle when stirring to keep the fish in nice flakes.'),
  (rid, 4, 'Serve', 'Arrange the fried plantains on a plate and spoon the smoked fish sauce over the top. Serve immediately.', NULL, NULL, NULL);
END $$;

-- 18. Mustard Chicken (Gabon)
DO $$
DECLARE rid UUID;
BEGIN
  INSERT INTO recipes (slug, name, name_local, description, country_code, country_name, region, ethnic_group, category, tags, diet_tags, prep_time_minutes, cook_time_minutes, difficulty, default_servings, story, occasion, best_served_with, calories, protein_g, carbs_g, fat_g, fiber_g, is_verified, is_featured)
  VALUES (
    'poulet-moutarde-ga', 'Mustard Chicken', 'Poulet à la Moutarde', 'Chicken marinated in a tangy mustard and citrus blend, then roasted until golden and crispy. A Gabonese dish that reflects the country''s French culinary influence blended with local flavours.',
    'GA', 'Gabon', 'Central Africa', 'Fang', 'main',
    ARRAY['mustard', 'roast-chicken', 'french-influence', 'citrus', 'gabon'],
    ARRAY['gluten-free', 'dairy-free', 'nut-free', 'halal'],
    20, 50, 'easy', 4,
    'Gabon''s colonial history left a strong French culinary footprint, but Gabonese cooks never simply replicate — they adapt. This mustard chicken uses Dijon-style mustard combined with local citrus and chilli for a flavour profile that is uniquely Gabonese. It is a popular dish at gatherings where the ease of preparation belies its impressive taste.',
    'Gatherings, weeknight dinner',
    'Rice, fried plantains, or a fresh green salad',
    380, 34, 4, 24, 1,
    true, true
  ) RETURNING id INTO rid;

  INSERT INTO recipe_ingredients (recipe_id, sort_order, group_name, amount, unit, name, prep_note, is_optional, substitution) VALUES
  (rid, 1, NULL, 1.5, 'kg', 'chicken pieces', 'bone-in, skin on', false, NULL),
  (rid, 2, NULL, 4, 'tbsp', 'Dijon mustard', NULL, false, NULL),
  (rid, 3, NULL, 3, 'tbsp', 'lemon juice', NULL, false, 'lime juice'),
  (rid, 4, NULL, 3, 'cloves', 'garlic', 'minced', false, NULL),
  (rid, 5, NULL, 2, 'tbsp', 'vegetable oil', NULL, false, NULL),
  (rid, 6, NULL, 1, 'tsp', 'chilli flakes', NULL, true, NULL),
  (rid, 7, NULL, 1, 'large', 'onion', 'sliced into rings', false, NULL);

  INSERT INTO recipe_steps (recipe_id, step_number, title, instruction, timer_seconds, timer_label, tip) VALUES
  (rid, 1, 'Make the marinade', 'In a large bowl, mix the Dijon mustard, lemon juice, minced garlic, oil, chilli flakes, salt, and pepper until well combined.', NULL, NULL, NULL),
  (rid, 2, 'Marinate the chicken', 'Coat the chicken pieces thoroughly in the mustard marinade. Cover and refrigerate for at least 30 minutes, or ideally 2 hours.', 1800, 'Marinate', 'Overnight marination gives the best results.'),
  (rid, 3, 'Roast the chicken', 'Preheat oven to 200C (400F). Arrange the chicken pieces skin-side up in a roasting tin. Scatter the onion rings around the chicken. Roast for 45-50 minutes until the skin is golden and crispy and the juices run clear.', 2700, 'Roast chicken', 'Baste with pan juices halfway through for extra flavour and moisture.'),
  (rid, 4, 'Rest and serve', 'Remove from the oven and let rest for 5 minutes. Serve with the roasted onions and pan juices spooned over the top.', NULL, NULL, 'The pan juices make an excellent sauce — do not discard them.');
END $$;

-- =============================================
-- EQUATORIAL GUINEA (GQ)
-- =============================================

-- 19. Succotash de Guinée (Equatorial Guinea)
DO $$
DECLARE rid UUID;
BEGIN
  INSERT INTO recipes (slug, name, name_local, description, country_code, country_name, region, ethnic_group, category, tags, diet_tags, prep_time_minutes, cook_time_minutes, difficulty, default_servings, story, occasion, best_served_with, calories, protein_g, carbs_g, fat_g, fiber_g, is_verified, is_featured)
  VALUES (
    'succotash-gq', 'Succotash de Guinée', 'Succotash', 'A hearty stew of black-eyed peas, corn, and vegetables cooked in a rich tomato and palm oil base. A nutritious and colourful Equatorial Guinean staple.',
    'GQ', 'Equatorial Guinea', 'Central Africa', 'Fang', 'stew',
    ARRAY['black-eyed-peas', 'corn', 'vegetables', 'hearty', 'equatorial-guinea'],
    ARRAY['vegetarian', 'vegan', 'gluten-free', 'dairy-free'],
    20, 40, 'easy', 6,
    'This succotash reflects the agricultural roots of Equatorial Guinea, where black-eyed peas and corn are staple crops. Unlike its American namesake, the Equatorial Guinean version is enriched with palm oil and spiced with local peppers. It is a daily staple that provides complete protein from the combination of legumes and corn.',
    'Everyday meals, communal dining',
    'Fried plantains, rice, or grilled fish',
    310, 14, 42, 10, 9,
    true, true
  ) RETURNING id INTO rid;

  INSERT INTO recipe_ingredients (recipe_id, sort_order, group_name, amount, unit, name, prep_note, is_optional, substitution) VALUES
  (rid, 1, NULL, 300, 'g', 'black-eyed peas', 'soaked overnight and drained', false, NULL),
  (rid, 2, NULL, 2, 'cups', 'corn kernels', 'fresh or frozen', false, NULL),
  (rid, 3, NULL, 3, 'medium', 'tomatoes', 'chopped', false, NULL),
  (rid, 4, NULL, 1, 'large', 'onion', 'diced', false, NULL),
  (rid, 5, NULL, 2, 'tbsp', 'palm oil', NULL, false, NULL),
  (rid, 6, NULL, 2, 'cloves', 'garlic', 'minced', false, NULL),
  (rid, 7, NULL, 1, 'whole', 'scotch bonnet pepper', 'minced', true, NULL),
  (rid, 8, NULL, 2, 'cups', 'water', NULL, false, NULL);

  INSERT INTO recipe_steps (recipe_id, step_number, title, instruction, timer_seconds, timer_label, tip) VALUES
  (rid, 1, 'Cook the black-eyed peas', 'Place the soaked and drained black-eyed peas in a pot with fresh water. Bring to a boil and cook for 25 minutes until tender but not mushy. Drain and set aside.', 1500, 'Cook peas', 'Do not add salt while boiling — it toughens the skins.'),
  (rid, 2, 'Sauté the base', 'Heat palm oil in a large pot. Sauté the onion until soft and golden. Add garlic and scotch bonnet, cooking for 1 minute. Add the chopped tomatoes and cook until they break down.', 480, 'Cook base', NULL),
  (rid, 3, 'Combine and simmer', 'Add the cooked black-eyed peas, corn kernels, and 2 cups of water to the pot. Stir well and bring to a simmer. Cook for 15 minutes until the corn is tender and the flavours have melded.', 900, 'Simmer stew', NULL),
  (rid, 4, 'Season and serve', 'Season with salt and pepper to taste. The stew should be thick and hearty. Serve hot with fried plantains or rice.', NULL, NULL, 'This dish tastes even better the next day after the flavours have developed.');
END $$;

-- 20. Pepesoup (Equatorial Guinea)
DO $$
DECLARE rid UUID;
BEGIN
  INSERT INTO recipes (slug, name, name_local, description, country_code, country_name, region, ethnic_group, category, tags, diet_tags, prep_time_minutes, cook_time_minutes, difficulty, default_servings, story, occasion, best_served_with, calories, protein_g, carbs_g, fat_g, fiber_g, is_verified, is_featured)
  VALUES (
    'pepesoup-gq', 'Pepesoup', 'Pepesoup', 'A fiery, aromatic fish soup spiced with calabash nutmeg, alligator pepper, and scotch bonnet. A beloved Central African restorative served at celebrations and as a hangover cure.',
    'GQ', 'Equatorial Guinea', 'Central Africa', 'Bubi', 'soup',
    ARRAY['fish-soup', 'spicy', 'pepper-soup', 'restorative', 'equatorial-guinea'],
    ARRAY['gluten-free', 'dairy-free', 'nut-free', 'pescatarian'],
    15, 30, 'medium', 4,
    'Pepesoup is the universal comfort food of Central and West Africa, and Equatorial Guinea''s version has its own distinct character thanks to the Bubi people of Bioko Island. Fresh fish from the Gulf of Guinea is simmered in an intensely spiced broth featuring indigenous aromatics. It is served at celebrations, offered to new mothers for recovery, and consumed the morning after festivities as a restorative.',
    'Celebrations, recovery meals, cold evenings',
    'White rice or boiled yam',
    280, 32, 8, 12, 2,
    true, false
  ) RETURNING id INTO rid;

  INSERT INTO recipe_ingredients (recipe_id, sort_order, group_name, amount, unit, name, prep_note, is_optional, substitution) VALUES
  (rid, 1, NULL, 800, 'g', 'firm white fish', 'cut into large chunks', false, 'catfish or tilapia'),
  (rid, 2, NULL, 1, 'large', 'onion', 'roughly chopped', false, NULL),
  (rid, 3, NULL, 3, 'whole', 'scotch bonnet peppers', 'left whole', false, NULL),
  (rid, 4, NULL, 1, 'tsp', 'calabash nutmeg', 'ground', false, 'regular nutmeg'),
  (rid, 5, NULL, 1, 'tsp', 'alligator pepper', 'ground', false, 'black pepper and allspice'),
  (rid, 6, NULL, 3, 'cloves', 'garlic', 'crushed', false, NULL),
  (rid, 7, NULL, 1, 'thumb', 'fresh ginger', 'sliced', false, NULL),
  (rid, 8, NULL, 6, 'cups', 'water', NULL, false, NULL);

  INSERT INTO recipe_steps (recipe_id, step_number, title, instruction, timer_seconds, timer_label, tip) VALUES
  (rid, 1, 'Season the fish', 'Rub the fish chunks with salt, a squeeze of lemon juice, and half the ground spices. Let sit for 10 minutes.', 600, 'Season fish', 'This brief marination firms up the fish and prevents it from falling apart in the soup.'),
  (rid, 2, 'Build the broth', 'Bring 6 cups of water to a boil in a large pot. Add the onion, garlic, ginger, and remaining spices. Boil for 10 minutes to create a fragrant broth.', 600, 'Boil aromatics', NULL),
  (rid, 3, 'Add the fish', 'Gently lower the seasoned fish into the broth. Add the whole scotch bonnet peppers. Reduce heat to medium and cook for 15 minutes until the fish is opaque and cooked through.', 900, 'Cook fish', 'Do not stir vigorously — use a gentle swirling motion to prevent the fish from breaking.'),
  (rid, 4, 'Adjust and serve', 'Taste the broth and adjust salt and pepper. For more heat, gently press one of the scotch bonnets against the side of the pot. Ladle into bowls, ensuring each serving gets fish and broth. Serve hot.', NULL, NULL, 'The soup should be thin and brothy, not thick — it is meant to be sipped as well as eaten.');
END $$;

-- 21. Jollof Rice Equatoguineano (Equatorial Guinea)
DO $$
DECLARE rid UUID;
BEGIN
  INSERT INTO recipes (slug, name, name_local, description, country_code, country_name, region, ethnic_group, category, tags, diet_tags, prep_time_minutes, cook_time_minutes, difficulty, default_servings, story, occasion, best_served_with, calories, protein_g, carbs_g, fat_g, fiber_g, is_verified, is_featured)
  VALUES (
    'jollof-rice-gq', 'Jollof Rice Equatoguineano', 'Arroz Jollof', 'Equatorial Guinea''s take on the iconic West African rice dish — fragrant long-grain rice cooked in a smoky tomato and pepper sauce with Spanish-influenced seasonings.',
    'GQ', 'Equatorial Guinea', 'Central Africa', 'Fang', 'main',
    ARRAY['jollof', 'rice', 'tomato', 'one-pot', 'equatorial-guinea'],
    ARRAY['gluten-free', 'dairy-free', 'nut-free', 'halal'],
    20, 45, 'medium', 6,
    'As the only Spanish-speaking country in Central Africa, Equatorial Guinea has a unique culinary identity that blends Fang and Bubi traditions with Spanish and broader West African influences. Their jollof rice uses smoked paprika alongside traditional African peppers, and is often prepared with palm oil rather than vegetable oil, giving it a distinctive orange hue and richer flavour.',
    'Parties, celebrations, Sunday meals',
    'Fried plantains, grilled chicken, or a fresh salad',
    390, 8, 62, 12, 3,
    true, false
  ) RETURNING id INTO rid;

  INSERT INTO recipe_ingredients (recipe_id, sort_order, group_name, amount, unit, name, prep_note, is_optional, substitution) VALUES
  (rid, 1, NULL, 3, 'cups', 'long-grain rice', 'washed until water runs clear', false, NULL),
  (rid, 2, NULL, 6, 'medium', 'tomatoes', 'blended', false, NULL),
  (rid, 3, NULL, 2, 'large', 'onions', 'one blended, one sliced', false, NULL),
  (rid, 4, NULL, 3, 'tbsp', 'tomato paste', NULL, false, NULL),
  (rid, 5, NULL, 3, 'tbsp', 'palm oil', NULL, false, 'vegetable oil'),
  (rid, 6, NULL, 1, 'tsp', 'smoked paprika', NULL, false, NULL),
  (rid, 7, NULL, 2, 'whole', 'bay leaves', NULL, false, NULL),
  (rid, 8, NULL, 1, 'whole', 'scotch bonnet pepper', 'left whole', true, NULL);

  INSERT INTO recipe_steps (recipe_id, step_number, title, instruction, timer_seconds, timer_label, tip) VALUES
  (rid, 1, 'Prepare the tomato base', 'Blend the tomatoes and one onion until smooth. Heat palm oil in a large heavy-bottomed pot. Sauté the sliced onion until golden. Add tomato paste and cook for 2 minutes, stirring constantly.', 420, 'Cook base', NULL),
  (rid, 2, 'Cook the sauce', 'Pour in the blended tomato-onion mixture. Add smoked paprika, bay leaves, and the whole scotch bonnet. Cook on medium heat for 15 minutes, stirring occasionally, until the sauce is reduced and the oil floats on top.', 900, 'Reduce sauce', 'The sauce must be well-reduced before adding rice — this is the key to flavourful jollof.'),
  (rid, 3, 'Add rice and water', 'Add the washed rice to the sauce and stir to coat every grain. Pour in 3 cups of hot water. Season with salt and stir once. Bring to a boil.', NULL, NULL, 'Use hot water to avoid shocking the rice and slowing the cooking.'),
  (rid, 4, 'Steam the rice', 'Reduce heat to the lowest setting. Cover the pot tightly with foil and then the lid. Cook without opening for 30 minutes until the rice is tender and has absorbed all the liquid.', 1800, 'Steam rice', 'Do not lift the lid or stir during this time — the steam does the work.'),
  (rid, 5, 'Fluff and serve', 'Remove from heat. Remove the bay leaves and scotch bonnet. Fluff the rice gently with a fork. Serve hot with fried plantains and grilled chicken.', NULL, NULL, 'The slightly crispy rice at the bottom of the pot is the best part — scrape it up and serve it.');
END $$;
