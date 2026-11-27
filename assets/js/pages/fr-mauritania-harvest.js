(() => {
  'use strict';
  const form = document.getElementById('harvest');
  const error = document.getElementById('error');
  const result = document.getElementById('result');
  const crop = document.getElementById('crop');
  const region = document.getElementById('region');
  const {countryData, cropGrowthData, CountryHarvestDateEngine} = window.AfroTools || {};
  if (!countryData || !cropGrowthData || !CountryHarvestDateEngine) {
    error.textContent = 'Les données de calcul sont indisponibles. Rechargez la page.';
    return;
  }
  const crops = {millet:'Mil perlé', sorghum:'Sorgho', rice:'Riz', cowpea:'Niébé', maize:'Maïs'};
  const regions = {
    mr_rv:'Vallée du fleuve Sénégal (Rosso, Kaédi)',
    mr_sl:'Zone sahélienne (Aïoun, Néma, Kiffa)',
    mr_sa:'Nord saharien (Nouakchott, Atar, Tidjikja)'
  };
  for (const row of countryData.crops) {
    if (crops[row.id] && cropGrowthData[row.id]) crop.add(new Option(crops[row.id], row.id));
  }
  for (const row of countryData.regions) {
    if (regions[row.id]) region.add(new Option(regions[row.id], row.id));
  }
  form.querySelector('button').disabled = !crop.length || !region.length;
  form.addEventListener('input', () => { result.hidden = true; error.textContent = ''; });
  const format = new Intl.DateTimeFormat('fr-MR', {day:'numeric', month:'long', year:'numeric'});
  form.addEventListener('submit', event => {
    event.preventDefault();
    const [year, month, day] = document.getElementById('planting').value.split('-').map(Number);
    const plantingDate = new Date(year, month - 1, day, 12);
    const estimate = CountryHarvestDateEngine.calculate({
      cropId:crop.value, regionId:region.value, variety:document.getElementById('variety').value,
      irrigation:document.getElementById('irrigation').value, plantingDate
    }, countryData, cropGrowthData);
    if (estimate.error) {
      result.hidden = true;
      error.textContent = 'Vérifiez la culture, la zone et la date de semis.';
      return;
    }
    document.getElementById('summary').textContent = crops[crop.value] + ' — ' + regions[region.value] + '. Récolte estimée le ' + format.format(estimate.harvestDate) + '.';
    document.getElementById('window').textContent = 'Fenêtre de récolte du ' + format.format(estimate.harvestWindowStart) + ' au ' + format.format(estimate.harvestWindowEnd) + '.';
    document.getElementById('detail').textContent = 'Durée de référence : ' + estimate.baseDays + ' jours. Durée ajustée : ' + estimate.adjustedDays + ' jours après le semis du ' + format.format(plantingDate) + '. Température moyenne utilisée : ' + estimate.avgTempC + ' °C.';
    result.hidden = false;
    document.getElementById('result-title').focus();
  });
})();
