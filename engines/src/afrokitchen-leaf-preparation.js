'use strict';

// FSANZ identifies cassava leaves as a source of cyanogenic glycosides.
// https://www.foodstandards.gov.au/consumer/prevention-of-foodborne-illness/cassava
const readyLeaves = 'commercially prepared cassava leaves labelled fully cooked and ready to eat';
const safety = 'Use only commercially prepared cassava leaves labelled fully cooked and ready to eat. Follow the package instructions for storage and reheating. Raw cassava leaves contain compounds that can release cyanide. Frozen or pounded leaves may still be raw.';
const alternativeGreens = {
  'plasas-gm': 'spinach',
  'sauce-feuille-gn': 'sweet potato leaves',
  'nshima-ifisashi': 'rape leaves, pumpkin leaves or spinach'
};

function prepareCassavaLeafRecipe(recipe) {
  const leafPattern = /cassava (?:leaves|leaf)/i;
  if (!recipe || !recipe.ingredients?.some(item => leafPattern.test(item.name))) return recipe;
  const alternative = alternativeGreens[recipe.slug];
  const ingredients = recipe.ingredients.map(item => leafPattern.test(item.name)
    ? {...item, name: alternative || readyLeaves, prep_note: alternative ? 'washed and chopped' : null, substitution: null}
    : item);
  if (alternative) return {...recipe, ingredients};
  const steps = (recipe.steps || []).map((step, index) => {
    let instruction = step.instruction || '';
    const rawLeafStep = /^(?:If using fresh cassava|Pound or blend fresh cassava|Simmer (?:pounded )?cassava leaves|Put pounded cassava leaves)/i.test(instruction);
    if (rawLeafStep) {
      instruction = recipe.slug === 'matapa'
        ? 'Combine the fully cooked leaves, garlic, optional chile and water in a pot. Warm gently.'
        : 'Put the fully cooked leaves in a pot with a little water or stock and warm gently.';
    }
    if (index === 0 && !instruction.startsWith(safety)) instruction = safety + ' ' + instruction;
    return {...step, instruction, ...(rawLeafStep ? {title: 'Warm fully cooked leaves', tip: null, timer_seconds: null, timer_label: null} : {})};
  });
  return {...recipe, ingredients, steps};
}

module.exports = {prepareCassavaLeafRecipe};
