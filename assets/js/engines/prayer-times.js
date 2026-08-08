(function initPrayerTimes(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else {
    root.AfroTools = root.AfroTools || {};
    root.AfroTools.prayerTimes = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function createPrayerTimes() {
  'use strict';

  const CITIES = Object.freeze({
    Lagos: Object.freeze({ latitude: 6.5244, longitude: 3.3792, timeZone: 'Africa/Lagos' }),
    Nairobi: Object.freeze({ latitude: -1.2921, longitude: 36.8219, timeZone: 'Africa/Nairobi' }),
    Cairo: Object.freeze({ latitude: 30.0444, longitude: 31.2357, timeZone: 'Africa/Cairo' }),
    Caire: Object.freeze({ latitude: 30.0444, longitude: 31.2357, timeZone: 'Africa/Cairo' }),
    Accra: Object.freeze({ latitude: 5.6037, longitude: -0.187, timeZone: 'Africa/Accra' }),
    Johannesburg: Object.freeze({ latitude: -26.2041, longitude: 28.0473, timeZone: 'Africa/Johannesburg' }),
    Casablanca: Object.freeze({ latitude: 33.5731, longitude: -7.5898, timeZone: 'Africa/Casablanca' })
  });

  const METHODS = Object.freeze({
    MWL: Object.freeze({ fajrAngle: 18, ishaAngle: 17 }),
    Egypt: Object.freeze({ fajrAngle: 19.5, ishaAngle: 17.5 }),
    'Autorité égyptienne': Object.freeze({ fajrAngle: 19.5, ishaAngle: 17.5, method: 'Egypt' }),
    ISNA: Object.freeze({ fajrAngle: 15, ishaAngle: 15 }),
    UmmQura: Object.freeze({ fajrAngle: 18.5, ishaMinutes: 90 }),
    'Réglage local': Object.freeze({ fajrAngle: 18, ishaAngle: 17, method: 'MWL' })
  });

  const RAD = Math.PI / 180;
  const DEG = 180 / Math.PI;

  function parseDate(value) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value || ''))) return null;
    const date = new Date(`${value}T12:00:00Z`);
    return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value ? date : null;
  }

  function addDays(isoDate, days) {
    const date = parseDate(isoDate);
    if (!date) return null;
    date.setUTCDate(date.getUTCDate() + days);
    return date.toISOString().slice(0, 10);
  }

  function zoneOffsetMinutes(date, timeZone) {
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone, year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23'
    }).formatToParts(date).reduce((map, part) => {
      if (part.type !== 'literal') map[part.type] = Number(part.value);
      return map;
    }, {});
    const localAsUtc = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second);
    return Math.round((localAsUtc - date.getTime()) / 60000);
  }

  function solarTerms(date) {
    const start = Date.UTC(date.getUTCFullYear(), 0, 0);
    const day = Math.floor((date.getTime() - start) / 86400000);
    const yearDays = (date.getUTCFullYear() % 4 === 0 && (date.getUTCFullYear() % 100 !== 0 || date.getUTCFullYear() % 400 === 0)) ? 366 : 365;
    const gamma = 2 * Math.PI / yearDays * (day - 1);
    return {
      equation: 229.18 * (0.000075 + 0.001868 * Math.cos(gamma) - 0.032077 * Math.sin(gamma) - 0.014615 * Math.cos(2 * gamma) - 0.040849 * Math.sin(2 * gamma)),
      declination: 0.006918 - 0.399912 * Math.cos(gamma) + 0.070257 * Math.sin(gamma) - 0.006758 * Math.cos(2 * gamma) + 0.000907 * Math.sin(2 * gamma) - 0.002697 * Math.cos(3 * gamma) + 0.00148 * Math.sin(3 * gamma)
    };
  }

  function hourAngle(latitude, declination, altitude) {
    const lat = latitude * RAD;
    const numerator = Math.sin(altitude * RAD) - Math.sin(lat) * Math.sin(declination);
    const denominator = Math.cos(lat) * Math.cos(declination);
    const cosine = numerator / denominator;
    if (!Number.isFinite(cosine) || cosine < -1 || cosine > 1) return null;
    return Math.acos(cosine) * DEG * 4;
  }

  function formatMinutes(value) {
    if (!Number.isFinite(value)) return null;
    const rounded = Math.round(value);
    const normalized = ((rounded % 1440) + 1440) % 1440;
    return `${String(Math.floor(normalized / 60)).padStart(2, '0')}:${String(normalized % 60).padStart(2, '0')}`;
  }

  function shiftTime(value, delta) {
    if (!/^\d{2}:\d{2}$/.test(String(value || ''))) return null;
    const [hours, minutes] = value.split(':').map(Number);
    if (hours > 23 || minutes > 59) return null;
    return formatMinutes(hours * 60 + minutes + delta);
  }

  function qiblaBearing(latitude, longitude) {
    const kaabaLat = 21.4225 * RAD;
    const difference = (39.8262 - longitude) * RAD;
    const lat = latitude * RAD;
    return Math.round((Math.atan2(Math.sin(difference), Math.cos(lat) * Math.tan(kaabaLat) - Math.sin(lat) * Math.cos(difference)) * DEG + 360) % 360);
  }

  function calculateDay(input) {
    const city = CITIES[input.city];
    const methodConfig = METHODS[input.method];
    const date = parseDate(input.date);
    if (!city) return { ok: false, code: 'UNSUPPORTED_CITY' };
    if (!methodConfig) return { ok: false, code: 'UNSUPPORTED_METHOD' };
    if (!date) return { ok: false, code: 'INVALID_DATE' };
    const terms = solarTerms(date);
    const offset = zoneOffsetMinutes(date, city.timeZone);
    const noon = 720 - 4 * city.longitude - terms.equation + offset;
    const sunriseAngle = hourAngle(city.latitude, terms.declination, -0.833);
    const fajrAngle = hourAngle(city.latitude, terms.declination, -methodConfig.fajrAngle);
    const ishaAngle = methodConfig.ishaAngle ? hourAngle(city.latitude, terms.declination, -methodConfig.ishaAngle) : null;
    const shadowFactor = input.school === 'hanafi' ? 2 : 1;
    const asrAltitude = Math.atan(1 / (shadowFactor + Math.tan(Math.abs(city.latitude * RAD - terms.declination)))) * DEG;
    const asrAngle = hourAngle(city.latitude, terms.declination, asrAltitude);
    if ([sunriseAngle, fajrAngle, asrAngle].some((value) => value === null) || (methodConfig.ishaAngle && ishaAngle === null)) {
      return { ok: false, code: 'UNAVAILABLE_FOR_DATE_LOCATION' };
    }
    const maghribMinutes = noon + sunriseAngle;
    const ishaMinutes = input.ramadan && input.method === 'UmmQura' ? 120 : methodConfig.ishaMinutes;
    const values = {
      city: input.city,
      date: input.date,
      method: methodConfig.method || input.method,
      school: input.school === 'hanafi' ? 'hanafi' : 'standard',
      timeZone: city.timeZone,
      fajr: formatMinutes(noon - fajrAngle),
      sunrise: formatMinutes(noon - sunriseAngle),
      dhuhr: formatMinutes(noon),
      asr: formatMinutes(noon + asrAngle),
      maghrib: formatMinutes(maghribMinutes),
      isha: ishaMinutes ? formatMinutes(maghribMinutes + ishaMinutes) : formatMinutes(noon + ishaAngle),
      qibla: qiblaBearing(city.latitude, city.longitude),
      boundary: 'planning-estimate-check-local-mosque'
    };
    return { ok: true, values };
  }

  function calculateRamadan(input) {
    const days = Number(input.days);
    const suhoorBuffer = Number(input.suhoorBuffer);
    const iftarBuffer = Number(input.iftarBuffer);
    if (!Number.isInteger(days) || days < 1 || days > 30) return { ok: false, code: 'INVALID_DAYS' };
    if (!Number.isInteger(suhoorBuffer) || suhoorBuffer < 0 || suhoorBuffer > 120) return { ok: false, code: 'INVALID_SUHOOR_BUFFER' };
    if (!Number.isInteger(iftarBuffer) || iftarBuffer < 0 || iftarBuffer > 120) return { ok: false, code: 'INVALID_IFTAR_BUFFER' };
    const rows = [];
    for (let index = 0; index < days; index += 1) {
      const date = addDays(input.startDate, index);
      if (!date) return { ok: false, code: 'INVALID_DATE' };
      const day = calculateDay({ city: input.city, method: input.method, school: input.school, date, ramadan:true });
      if (!day.ok) return day;
      rows.push(Object.freeze({ date, suhoor: shiftTime(day.values.fajr, -suhoorBuffer), fajr: day.values.fajr, maghrib: day.values.maghrib, iftar: shiftTime(day.values.maghrib, iftarBuffer) }));
    }
    return { ok: true, values: { city: input.city, method: METHODS[input.method].method || input.method, startDate: input.startDate, days, firstSuhoor: rows[0].suhoor, firstIftar: rows[0].iftar, lastSuhoor: rows[rows.length - 1].suhoor, lastIftar: rows[rows.length - 1].iftar, rows, boundary: 'provisional-dates-check-moon-sighting-and-local-mosque' } };
  }

  return Object.freeze({ CITIES, METHODS, calculateDay, calculateRamadan, sources: Object.freeze({ solar: 'https://gml.noaa.gov/grad/solcalc/solareqns.PDF', methods: 'https://praytimes.org/docs/methods' }) });
});
