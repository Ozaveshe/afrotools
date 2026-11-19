'use strict';

const labels = {
  en: ['OLA Energy office in Asmara', 'Call the office to ask which station to contact. Before planning, confirm diesel availability, purchase requirements and the price per litre with the station.', 'Office switchboard', 'Enter my confirmed price'],
  fr: ['Bureau d’OLA Energy à Asmara', 'Appelez le bureau pour savoir quelle station contacter. Avant de calculer votre budget, vérifiez auprès de la station la disponibilité du gazole, les conditions d’achat et le prix au litre.', 'Standard du bureau', 'Saisir le prix que j’ai confirmé'],
  sw: ['Ofisi ya OLA Energy mjini Asmara', 'Piga simu ofisini uulize ni kituo gani cha mafuta cha kuwasiliana nacho. Kabla ya kupanga gharama, thibitisha na kituo kama dizeli inapatikana, masharti ya ununuzi na bei kwa lita.', 'Simu kuu ya ofisi', 'Weka bei niliyothibitisha'],
};

module.exports = function eritreaDieselContact(locale, interactive) {
  const [office, instructions, switchboard, enter] = labels[locale];
  const manual = interactive ? `<button type="button" class="fuel-button" id="fuel-enter-confirmed-price">${enter}</button>` : '';
  return `<aside aria-label="${office}"${interactive ? ' id="fuel-er-diesel-contact" hidden' : ''}><p><a href="https://www.olaenergy.com/eritrea">${office}</a></p><p>${instructions}</p><p><a href="tel:+2911126673">${switchboard} +291 1 126673</a></p>${manual}</aside>`;
};
