import { renderSavedItems } from '/assets/js/lib/save-state.js?v=6cb0bca2';

  // Render any saved AfroDraft drawings
  renderSavedItems('afrodraft', 'saved-drawings', {
    appUrl: 'app.html',
    itemNoun: 'drawing',
    emptyMessage: 'No saved drawings yet. Launch AfroDraft to create your first drawing!'
  });
