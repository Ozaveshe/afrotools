"use strict";

const forms = {
  "commodity-prices": {
    note: "Chagua zao na soko ili kupanga kwa kutumia bei ya kumbukumbu. Uliza bei ya leo kwa mnunuzi au sokoni.",
    fields: '<label for="commodityKey">Zao</label><select id="commodityKey" required></select><label for="countryCode">Nchi na soko</label><select id="countryCode" required></select><label for="volumeTonnes">Kiasi cha kuuza (tani)</label><input id="volumeTonnes" type="number" min="0" step="any" value="1" required>'
  },
  "crop-insurance": {
    note: "Thamani na asilimia za mwanzo ni mfano. Ingiza masharti ya mtoa bima ili kukadiria gharama yako.",
    fields: '<label for="currency">Sarafu (msimbo wa herufi tatu)</label><input id="currency" value="KES" maxlength="3" pattern="[A-Za-z]{3}" required><label for="farmValue">Thamani inayowekewa bima</label><input id="farmValue" type="number" min="0" step="any" value="500000" required><label for="premiumRate">Kiwango cha ada ya bima (%)</label><input id="premiumRate" type="number" min="0" max="100" step="any" value="5" required><label for="excess">Sehemu unayobeba mwenyewe (% ya thamani iliyowekewa bima)</label><input id="excess" type="number" min="0" max="100" step="any" value="10" required>'
  }
};

module.exports = function renderCropMarketForm(app, html) {
  const form = forms[app.id];
  if (!form) return html;
  const upload = '<label class="swa-file">Fungua JSON<input type="file" accept="application/json,.json" data-import></label>';
  return html.replace(/<p>Sehemu hapa chini[^<]+<\/p>/, '<p>' + form.note + '</p>')
    .replace(/<label for="scenario">[\s\S]*?<\/textarea>/, form.fields)
    .replace('<pre data-output></pre>', '<dl data-output></dl>')
    .replace(upload, '').replace('</form>', '</form>' + upload)
    .replace('/assets/js/pages/sw-agriculture-assigned-parity.js', '/assets/js/pages/sw-crop-market-forms.js');
};
