(function localizeLogoMaker() {
  'use strict';
  if (document.documentElement.lang !== 'sw') return;
  var originalAlert = window.alert;
  var messages = {
    'No logo to download. Please create a logo first.': 'Hakuna logo ya kupakua. Tengeneza logo kwanza.',
    'Failed to download SVG. Please try again.': 'SVG haikuweza kupakuliwa. Jaribu tena.',
    'Canvas is not supported in your browser.': 'Kivinjari hiki hakitumii canvas.',
    'Failed to render PNG. Please try again.': 'PNG haikuweza kutengenezwa. Jaribu tena.',
    'Failed to render the logo as PNG. Please try again.': 'Logo haikuweza kutengenezwa kama PNG. Jaribu tena.',
    'Failed to download PNG. Please try again.': 'PNG haikuweza kupakuliwa. Jaribu tena.'
  };
  window.alert = function (message) { return originalAlert.call(window, messages[message] || message); };
}());
