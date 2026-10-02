/* Older query links open the published recipe canvas when the catalog knows it. */
(function (window) {
  'use strict';
  var routes = window.AfroKitchenStaticRoutes;
  var params = new URLSearchParams(window.location.search);
  var slug = params.get('slug') || params.get('id');
  if (!routes || !slug || !routes.hasRecipe(slug)) return;
  var target = new URL(routes.recipe(slug), window.location.origin);
  if (target.origin !== window.location.origin || !target.pathname.startsWith('/tools/afrokitchen/recipes/')) return;
  // Only preserve the known public serving hint and fragment, not arbitrary query data.
  var servings = params.get('plan_servings');
  if (servings && /^[1-9]\d?$/.test(servings) && Number(servings) <= 30) target.searchParams.set('plan_servings', servings);
  target.hash = window.location.hash;
  window.location.replace(target.href);
})(window);
