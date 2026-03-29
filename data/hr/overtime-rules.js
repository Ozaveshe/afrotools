// /data/hr/overtime-rules.js
// Overtime rules for African countries
// Source: National labour laws, ILO (2024-2026)

var OVERTIME_RULES = {
  NG: {
    name: "Nigeria", currency: "NGN", symbol: "\u20A6", flag: "\uD83C\uDDF3\uD83C\uDDEC",
    standardHours: { daily: 8, weekly: 40, law: "Labour Act Cap L1 LFN 2004" },
    overtimeRate: { weekday: 1.5, weekend: 2.0, publicHoliday: 2.0, night: 1.5 },
    maxOvertime: { weekly: 12, notes: "Not strictly codified but industry standard" },
    calculation: "Overtime pay = (monthly salary / 173.33 hours) x OT rate x OT hours",
    restDay: { entitlement: "1 day per week (minimum)", penalty: 2.0 },
    nightWork: { definition: "10pm to 6am", premium: 1.5 },
    exemptions: ["Managerial/supervisory staff", "Workers with irregular hours by nature of employment"],
    notes: "OT is voluntary \u2014 employer cannot compel overtime."
  },
  KE: {
    name: "Kenya", currency: "KES", symbol: "KES", flag: "\uD83C\uDDF0\uD83C\uDDEA",
    standardHours: { daily: 8, weekly: 45, law: "Employment Act 2007, S.27" },
    overtimeRate: { weekday: 1.5, weekend: 2.0, publicHoliday: 2.0, night: 1.5 },
    maxOvertime: { daily: 4, notes: "No more than 4 hours OT per day" },
    calculation: "OT rate = basic hourly rate x multiplier. Hourly rate = monthly / (45 x 4.33)",
    restDay: { entitlement: "1 day per week", penalty: 2.0 },
    nightWork: { definition: "6:30pm to 6:30am", premium: 1.5 }
  },
  ZA: {
    name: "South Africa", currency: "ZAR", symbol: "R", flag: "\uD83C\uDDFF\uD83C\uDDE6",
    standardHours: { daily: 9, weekly: 45, law: "Basic Conditions of Employment Act (BCEA) S.9-10" },
    overtimeRate: { weekday: 1.5, sunday: 2.0, publicHoliday: 2.0 },
    maxOvertime: { weekly: 10, daily: 3, notes: "Max 10 hours OT per week. Max 3 hours per day." },
    calculation: "OT = (monthly salary / 195 hours) x OT rate x OT hours. For 5-day workers: monthly / 173.33",
    restDay: { entitlement: "Sunday or agreed day off", penalty: 2.0, notes: "Employee who normally works Sunday: 1.5x. Who doesn't normally work Sunday: 2x" },
    nightWork: { definition: "6pm to 6am", premium: "No statutory premium but transport/allowance often required" },
    exemptions: ["Employees earning above BCEA threshold (R254,371.67/year in 2025)", "Senior management"],
    timeOff: "Employee may agree to take paid time off instead of OT pay \u2014 90 minutes off for every hour of OT"
  },
  GH: {
    name: "Ghana", currency: "GHS", symbol: "GHS", flag: "\uD83C\uDDEC\uD83C\uDDED",
    standardHours: { daily: 8, weekly: 40, law: "Labour Act 651 of 2003, S.33-37" },
    overtimeRate: { weekday: 1.5, weekend: 2.0, publicHoliday: 2.5 },
    maxOvertime: { daily: 4, weekly: null, notes: "No weekly cap specified but must be voluntary" },
    calculation: "Basic hourly rate = monthly / 173.33. OT = hourly x multiplier x hours"
  },
  EG: {
    name: "Egypt", currency: "EGP", symbol: "EGP", flag: "\uD83C\uDDEA\uD83C\uDDEC",
    standardHours: { daily: 8, weekly: 48, law: "Labour Law 12 of 2003" },
    overtimeRate: { daytime: 1.35, nighttime: 1.70, restDay: 2.0, publicHoliday: 2.0 },
    notes: "Egypt uses 35% premium for day OT and 70% for night OT \u2014 unusual compared to other countries."
  },
  TZ: {
    name: "Tanzania", currency: "TZS", symbol: "TZS", flag: "\uD83C\uDDF9\uD83C\uDDFF",
    standardHours: { daily: 9, weekly: 45, law: "Employment and Labour Relations Act 2004" },
    overtimeRate: { weekday: 1.5, restDay: 2.0, publicHoliday: 2.0 },
    maxOvertime: { daily: 3, monthly: 50 }
  },
  UG: {
    name: "Uganda", currency: "UGX", symbol: "UGX", flag: "\uD83C\uDDFA\uD83C\uDDEC",
    standardHours: { daily: 8, weekly: 48, law: "Employment Act 2006" },
    overtimeRate: { weekday: 1.5, restDay: 2.0, publicHoliday: 2.0 },
    maxOvertime: { daily: 2 }
  },
  RW: {
    name: "Rwanda", currency: "RWF", symbol: "RWF", flag: "\uD83C\uDDF7\uD83C\uDDFC",
    standardHours: { daily: 8, weekly: 40, law: "Law No. 66/2018 Regulating Labour" },
    overtimeRate: { weekday: 1.5, nightAndRestDay: 2.0 },
    maxOvertime: { weekly: 10 }
  },
  CI: {
    name: "C\u00F4te d'Ivoire", currency: "XOF", symbol: "FCFA", flag: "\uD83C\uDDE8\uD83C\uDDEE",
    standardHours: { daily: 8, weekly: 40, law: "Code du Travail" },
    overtimeRate: { first8hrs: 1.15, next8hrs: 1.50, nightWeekday: 1.50, nightWeekend: 2.0, sundayDay: 1.75, sundayNight: 2.0 },
    notes: "Francophone countries use tiered OT: first 8 extra hours at 15%, next 8 at 50%. Night and Sunday premiums stack."
  },
  SN: {
    name: "Senegal", currency: "XOF", symbol: "FCFA", flag: "\uD83C\uDDF8\uD83C\uDDF3",
    standardHours: { daily: 8, weekly: 40, law: "Code du Travail" },
    overtimeRate: { first8hrs: 1.15, next8hrs: 1.40, beyond16hrs: 1.60, night: 2.0, sundayOrHoliday: 1.60 }
  },
  CM: {
    name: "Cameroon", currency: "XAF", symbol: "FCFA", flag: "\uD83C\uDDE8\uD83C\uDDF2",
    standardHours: { daily: 8, weekly: 40, law: "Code du Travail 1992" },
    overtimeRate: { first8hrs: 1.20, next8hrs: 1.40, beyond16hrs: 1.60, night: 1.50, sundayOrHoliday: 1.40 }
  },
  MA: {
    name: "Morocco", currency: "MAD", symbol: "MAD", flag: "\uD83C\uDDF2\uD83C\uDDE6",
    standardHours: { daily: 8, weekly: 44, law: "Code du Travail 2004" },
    overtimeRate: { day: 1.25, night: 1.50, restDayDay: 1.50, restDayNight: 2.0 }
  },
  TN: {
    name: "Tunisia", currency: "TND", symbol: "TND", flag: "\uD83C\uDDF9\uD83C\uDDF3",
    standardHours: { weekly: 48, law: "Code du Travail" },
    overtimeRate: { first: 1.25, restDay: 1.50 }
  },
  AO: { name: "Angola", currency: "AOA", symbol: "Kz", flag: "\uD83C\uDDE6\uD83C\uDDF4", standardHours: { weekly: 44 }, overtimeRate: { weekday: 1.5, restDay: 2.0 } },
  ZM: { name: "Zambia", currency: "ZMW", symbol: "ZMW", flag: "\uD83C\uDDFF\uD83C\uDDF2", standardHours: { weekly: 48 }, overtimeRate: { weekday: 1.5, restDay: 2.0 } },
  ZW: { name: "Zimbabwe", currency: "ZWG", symbol: "ZWG", flag: "\uD83C\uDDFF\uD83C\uDDFC", standardHours: { weekly: 44 }, overtimeRate: { weekday: 1.5, restDay: 2.0 } },
  MU: { name: "Mauritius", currency: "MUR", symbol: "MUR", flag: "\uD83C\uDDF2\uD83C\uDDFA", standardHours: { weekly: 40 }, overtimeRate: { weekday: 1.5, restDay: 2.0 } },
  BW: { name: "Botswana", currency: "BWP", symbol: "BWP", flag: "\uD83C\uDDE7\uD83C\uDDFC", standardHours: { weekly: 48 }, overtimeRate: { weekday: 1.5, restDay: 2.0 } },
  NA: { name: "Namibia", currency: "NAD", symbol: "N$", flag: "\uD83C\uDDF3\uD83C\uDDE6", standardHours: { weekly: 45 }, overtimeRate: { weekday: 1.5, sundayPublicHoliday: 2.0 } },
  DZ: { name: "Algeria", currency: "DZD", symbol: "DZD", flag: "\uD83C\uDDE9\uD83C\uDDFF", standardHours: { weekly: 40 }, overtimeRate: { weekday: 1.5, restDay: 2.0 } },
  LY: { name: "Libya", currency: "LYD", symbol: "LYD", flag: "\uD83C\uDDF1\uD83C\uDDFE", standardHours: { weekly: 48 }, overtimeRate: { weekday: 1.5 } },
  SD: { name: "Sudan", currency: "SDG", symbol: "SDG", flag: "\uD83C\uDDF8\uD83C\uDDE9", standardHours: { weekly: 40 }, overtimeRate: { weekday: 1.5 } },
  ET: { name: "Ethiopia", currency: "ETB", symbol: "ETB", flag: "\uD83C\uDDEA\uD83C\uDDF9", standardHours: { daily: 8, weekly: 48 }, overtimeRate: { weekday: 1.25, night: 1.5, restDay: 2.0, publicHoliday: 2.5 } },
  MW: { name: "Malawi", currency: "MWK", symbol: "MWK", flag: "\uD83C\uDDF2\uD83C\uDDFC", standardHours: { weekly: 48 }, overtimeRate: { weekday: 1.5, restDay: 2.0 } },
  MZ: { name: "Mozambique", currency: "MZN", symbol: "MZN", flag: "\uD83C\uDDF2\uD83C\uDDFF", standardHours: { weekly: 44 }, overtimeRate: { weekday: 1.5, restDay: 2.0 } },
  MG: { name: "Madagascar", currency: "MGA", symbol: "MGA", flag: "\uD83C\uDDF2\uD83C\uDDEC", standardHours: { weekly: 40 }, overtimeRate: { weekday: 1.30, night: 1.50, restDay: 1.40 } },
  BJ: { name: "Benin", currency: "XOF", symbol: "FCFA", flag: "\uD83C\uDDE7\uD83C\uDDEF", standardHours: { weekly: 40 }, overtimeRate: { first8hrs: 1.12, next8hrs: 1.35, night: 1.50 } },
  BF: { name: "Burkina Faso", currency: "XOF", symbol: "FCFA", flag: "\uD83C\uDDE7\uD83C\uDDEB", standardHours: { weekly: 40 }, overtimeRate: { first8hrs: 1.15, next8hrs: 1.50, night: 1.65 } },
  ML: { name: "Mali", currency: "XOF", symbol: "FCFA", flag: "\uD83C\uDDF2\uD83C\uDDF1", standardHours: { weekly: 40 }, overtimeRate: { first8hrs: 1.10, beyond: 1.35, night: 1.50 } },
  NE: { name: "Niger", currency: "XOF", symbol: "FCFA", flag: "\uD83C\uDDF3\uD83C\uDDEA", standardHours: { weekly: 40 }, overtimeRate: { weekday: 1.35, night: 1.50, restDay: 1.60 } },
  TG: { name: "Togo", currency: "XOF", symbol: "FCFA", flag: "\uD83C\uDDF9\uD83C\uDDEC", standardHours: { weekly: 40 }, overtimeRate: { first8hrs: 1.20, beyond: 1.40, night: 1.65 } },
  GN: { name: "Guinea", currency: "GNF", symbol: "GNF", flag: "\uD83C\uDDEC\uD83C\uDDF3", standardHours: { weekly: 40 }, overtimeRate: { weekday: 1.5, restDay: 2.0 } },
  CD: { name: "DR Congo", currency: "CDF", symbol: "CDF", flag: "\uD83C\uDDE8\uD83C\uDDE9", standardHours: { weekly: 45 }, overtimeRate: { weekday: 1.30, beyond: 1.60, night: 2.0 } },
  GA: { name: "Gabon", currency: "XAF", symbol: "FCFA", flag: "\uD83C\uDDEC\uD83C\uDDE6", standardHours: { weekly: 40 }, overtimeRate: { first8hrs: 1.25, beyond: 1.50, night: 1.50 } }
};

var OT_OBSERVATIONS = {
  NG: "In Nigeria, overtime is voluntary \u2014 employers cannot compel it. Standard rate is 1.5x for weekdays, 2x for weekends and public holidays.",
  KE: "Kenya limits overtime to 4 hours per day. Standard weekly hours are 45, among the highest in East Africa.",
  ZA: "South Africa's BCEA exempts employees earning above R254,371.67/year from overtime protections. Employees can take 90 minutes time-off-in-lieu per OT hour.",
  GH: "Ghana offers one of Africa's highest public holiday OT rates at 2.5x. Standard overtime is 1.5x on weekdays.",
  EG: "Egypt uses an unusual system: 35% premium for daytime OT, 70% for nighttime. This is different from the multiplier system used by most African countries.",
  CI: "Francophone countries like C\u00F4te d'Ivoire use tiered overtime: first 8 extra hours at +15%, next 8 at +50%. Sunday and night premiums stack on top.",
  TZ: "Tanzania caps overtime at 50 hours per month. Standard hours are 45/week with sector-based minimum wages affecting OT calculations."
};
