import { renderSavedItems } from '/assets/js/lib/save-state.js?v=7cbfa474';
function discloseSavedBoqWorkspace() {
  const target = document.getElementById('saved-boqs');
  if (!target) return;
  target.querySelectorAll('.saved-card-open').forEach(link => {
    link.textContent = 'Ouvrir ce devis (éditeur en anglais)';
    link.setAttribute('hreflang', 'en');
    link.setAttribute('aria-label', 'Ouvrir ce devis dans l’éditeur de devis (en anglais)');
  });
}
renderSavedItems('boq-builder', 'saved-boqs', {
  appUrl: '/tools/boq-builder/app',
  itemNoun: 'BOQ',
  onDelete() { queueMicrotask(discloseSavedBoqWorkspace); }
});
discloseSavedBoqWorkspace();
