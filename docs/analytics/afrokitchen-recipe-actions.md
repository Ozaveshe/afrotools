# AfroKitchen recipe actions

On a published static recipe, `afrokitchen_recipe_saved` counts a successful visitor action that adds a recipe to this browser's cookbook. `afrokitchen_recipe_cooked` counts a successful action that adds the visitor's own cooked mark. A later deliberate addition after removal counts again. These counts describe actions, not distinct people, total recipes held in cookbooks or independently confirmed meals.

The shared analytics helper requires accepted analytics consent. Each event carries the public recipe's country code and category. The local cookbook, cooked timestamp, recipe identifier, ingredient selections and serving counts are excluded from the event parameters. The existing site analytics boundary manages standard page context.

Opening or reloading the page, receiving a storage event, removing a recipe or cooked mark, changing consent, and a failed local write generate neither product event. Existing local entries made before consent are not backfilled.
