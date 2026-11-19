"use strict";

module.exports = function renderPoultryForm(html) {
  const select = (key, label, choices) => `<label for="${key}">${label}</label><select id="${key}" name="${key}">${Object.entries(choices).map(([key, text]) => `<option value="${key}">${text}</option>`).join("")}</select>`;
  const country = select("countryCode", "Nchi ya ufugaji", {KE:"Kenya",TZ:"Tanzania",UG:"Uganda",RW:"Rwanda",ET:"Ethiopia",NG:"Nigeria",GH:"Ghana",ZA:"Afrika Kusini",EG:"Misri",CI:"Côte d’Ivoire",CM:"Kamerun",SN:"Senegali",MA:"Moroko",TN:"Tunisia",AO:"Angola"});
  const mode = select("mode", "Aina ya kuku", {broilers:"Kuku wa nyama",layers:"Kuku wa mayai",indigenous:"Kuku wa kienyeji",compare:"Linganisha aina zote tatu"});
  const management = select("management", "Mfumo wa ufugaji", {smallholder:"Shamba dogo",backyard:"Ufugaji wa nyumbani",semi_commercial:"Nusu biashara",commercial:"Biashara"});
  const housing = select("housingType", "Aina ya banda jipya", {simple:"Banda la kawaida",semi_commercial:"Banda la nusu biashara",commercial:"Banda la biashara"});
  const fields = `${country}${mode}<label for="flockSize">Idadi ya kuku mwanzoni</label><input id="flockSize" name="flockSize" type="number" min="1" step="1" required value="100">
  <div data-commercial>${management}<label><input type="checkbox" name="ownHouse" checked> Nina banda na vifaa tayari</label><div data-housing hidden>${housing}</div></div>
  <div data-cycles><label for="cyclesPerYear">Mizunguko ya kuku wa nyama kwa mwaka</label><input id="cyclesPerYear" name="cyclesPerYear" type="number" min="1" step="1" required value="4"></div>`;
  const open = '<label class="swa-file">Fungua JSON<input type="file" accept="application/json,.json" data-import></label>';
  return html.replace("</head>", '<style>.swa-card form select,.swa-card form input[type=number]{width:100%;min-height:44px;padding:.55rem;font:inherit;color:inherit;background:inherit;border:1px solid #94a3b8;border-radius:6px}</style></head>').replace(/<p>Sehemu hapa chini ni rekodi wazi[\s\S]*?<\/p>/, "<p>Chagua nchi, aina ya kuku na ukubwa wa kundi. Bei za mfano zinatokana na data ya nchi uliyochagua.</p>")
    .replace(/<label for="scenario">[\s\S]*?<\/textarea>/, fields)
    .replace(open,"").replace("</form>", "</form>"+open)
    .replace("<h2>Matokeo ya injini</h2><pre data-output></pre>", "<h2>Makadirio ya ufugaji</h2><div data-output></div>")
    .replace(/\/assets\/js\/pages\/sw-agriculture-assigned-parity\.js(?:\?v=[^"]*)?/, "/assets/js/pages/sw-poultry-form.js");
};
