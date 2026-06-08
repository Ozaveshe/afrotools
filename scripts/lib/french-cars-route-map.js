"use strict";

const FR_CARS_COUNTRY_SLUG_TO_EN = Object.freeze({
  "cote-divoire": "cote-divoire",
  senegal: "senegal",
  cameroun: "cameroon",
  maroc: "morocco",
  algerie: "algeria",
  tunisie: "tunisia",
  rwanda: "rwanda",
  nigeria: "nigeria",
  ghana: "ghana",
  kenya: "kenya",
  egypte: "egypt",
  ethiopie: "ethiopia",
  angola: "angola",
  "afrique-du-sud": "south-africa",
  mozambique: "mozambique",
  botswana: "botswana",
  namibie: "namibia",
  ouganda: "uganda",
  zambie: "zambia",
  tanzanie: "tanzania",
});

const EN_CARS_COUNTRY_SLUG_TO_FR = Object.freeze(
  Object.fromEntries(
    Object.entries(FR_CARS_COUNTRY_SLUG_TO_EN).map(([frSlug, enSlug]) => [enSlug, frSlug])
  )
);

function cleanSource(value) {
  return String(value || "").replace(/^\/+/, "").replace(/\/+$/, "");
}

function englishSourceForFrenchCarsParts(parts) {
  const cleanParts = parts.filter(Boolean);
  if (!cleanParts.length) return "cars";

  const [frCountry, ...rest] = cleanParts;
  const enCountry = FR_CARS_COUNTRY_SLUG_TO_EN[frCountry] || frCountry;
  return ["cars", enCountry, ...rest].join("/");
}

function frenchRouteForEnglishCarsSource(source) {
  const parts = cleanSource(source).split("/").filter(Boolean);
  if (parts[0] !== "cars") return null;
  if (parts.length === 1) return "/fr/cars";

  const frCountry = EN_CARS_COUNTRY_SLUG_TO_FR[parts[1]] || parts[1];
  return `/fr/${["cars", frCountry, ...parts.slice(2)].join("/")}`;
}

function isFrenchCarsRoute(route) {
  return /^\/fr\/cars(?:\/|$)/.test(String(route || ""));
}

module.exports = {
  EN_CARS_COUNTRY_SLUG_TO_FR,
  FR_CARS_COUNTRY_SLUG_TO_EN,
  englishSourceForFrenchCarsParts,
  frenchRouteForEnglishCarsSource,
  isFrenchCarsRoute,
};
