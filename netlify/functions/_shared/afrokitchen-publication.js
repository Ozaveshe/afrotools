'use strict';

const PROJECT_ORIGIN = 'https://zpclagtgczsygrgztlts.supabase.co';
const PUBLICATION_TIMEOUT_MS = 8000;

function isRecipeId(value) {
  return typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

// Service-backed public handlers must check this before accessing child data or
// storage. This check is not an atomic snapshot with a subsequent operation.
async function checkPublicRecipe(recipeId, supabaseUrl, supabaseKey) {
  if (!isRecipeId(recipeId)) return { kind: 'invalid' };
  if (supabaseUrl !== PROJECT_ORIGIN || !supabaseKey) return { kind: 'unavailable' };

  const controller = new AbortController();
  let timer;
  try {
    const operation = Promise.resolve().then(async () => {
      const response = await fetch(
        `${PROJECT_ORIGIN}/rest/v1/recipes?id=eq.${encodeURIComponent(recipeId)}&is_published=eq.true&is_verified=eq.true&select=id,is_published,is_verified&limit=1`,
        {
          headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` },
          signal: controller.signal,
          cache: 'no-store'
        }
      );
      if (!response.ok) return { kind: 'unavailable' };
      const rows = await response.json();
      if (!Array.isArray(rows) || rows.length > 1) return { kind: 'unavailable' };
      if (!rows.length) return { kind: 'not-found' };
      const recipe = rows[0];
      if (!recipe || !isRecipeId(recipe.id) || recipe.id.toLowerCase() !== recipeId.toLowerCase() ||
          recipe.is_published !== true || recipe.is_verified !== true) return { kind: 'unavailable' };
      return { kind: 'eligible' };
    });
    return await Promise.race([
      operation,
      new Promise(resolve => {
        timer = setTimeout(() => {
          controller.abort();
          resolve({ kind: 'unavailable' });
        }, PUBLICATION_TIMEOUT_MS);
      })
    ]);
  } catch {
    return { kind: 'unavailable' };
  } finally {
    clearTimeout(timer);
    controller.abort();
  }
}

module.exports = { checkPublicRecipe, isRecipeId, PUBLICATION_TIMEOUT_MS };
