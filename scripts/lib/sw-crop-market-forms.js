"use strict";

const forms = {
  "harvest-date-estimator": {
    note: "Chagua zao, tarehe uliyopanda na idadi ya siku za kukomaa kwa aina ya mbegu zako. Siku 120 ni mfano. Hali ya hewa na zao ni kumbukumbu za mpango wako na hazibadilishi tarehe kiotomatiki.",
    fields: '<label for="crop">Zao</label><select id="crop" required><option value="maize">Mahindi</option><option value="rice">Mpunga</option><option value="cassava">Muhogo</option><option value="tomato">Nyanya</option><option value="other">Zao jingine</option></select><label for="plantingDate">Tarehe ya kupanda</label><input type="date" id="plantingDate" required><label for="maturityDays">Siku za kukomaa tangu kupanda</label><input type="number" id="maturityDays" min="0" step="1" required><label for="weatherRisk">Hatari ya hali ya hewa (kwa kumbukumbu)</label><select id="weatherRisk" required><option value="normal">Ya kawaida</option><option value="low">Ndogo</option><option value="medium">Wastani</option><option value="high">Kubwa</option></select>'
  },
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
