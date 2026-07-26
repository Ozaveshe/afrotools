(function (root, factory) {
  'use strict';
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) {
    root.AfroTools = root.AfroTools || {};
    root.AfroTools.periodicTableEngine = api;
  }
})(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';

  var SYMBOLS = 'H He Li Be B C N O F Ne Na Mg Al Si P S Cl Ar K Ca Sc Ti V Cr Mn Fe Co Ni Cu Zn Ga Ge As Se Br Kr Rb Sr Y Zr Nb Mo Tc Ru Rh Pd Ag Cd In Sn Sb Te I Xe Cs Ba La Ce Pr Nd Pm Sm Eu Gd Tb Dy Ho Er Tm Yb Lu Hf Ta W Re Os Ir Pt Au Hg Tl Pb Bi Po At Rn Fr Ra Ac Th Pa U Np Pu Am Cm Bk Cf Es Fm Md No Lr Rf Db Sg Bh Hs Mt Ds Rg Cn Nh Fl Mc Lv Ts Og'.split(' ');
  var CIAAW_2024 = {
    1:'1.0080',2:'4.0026',3:'6.94',4:'9.0122',5:'10.81',6:'12.011',7:'14.007',8:'15.999',9:'18.998',10:'20.180',
    11:'22.990',12:'24.305',13:'26.982',14:'28.085',15:'30.974',16:'32.06',17:'35.45',18:'39.95',19:'39.098',20:'40.078',
    21:'44.956',22:'47.867',23:'50.942',24:'51.996',25:'54.938',26:'55.845',27:'58.933',28:'58.693',29:'63.546',30:'65.38',
    31:'69.723',32:'72.630',33:'74.922',34:'78.971',35:'79.904',36:'83.798',37:'85.468',38:'87.62',39:'88.906',40:'91.222',
    41:'92.906',42:'95.95',44:'101.07',45:'102.91',46:'106.42',47:'107.87',48:'112.41',49:'114.82',50:'118.71',
    51:'121.76',52:'127.60',53:'126.90',54:'131.29',55:'132.91',56:'137.33',57:'138.91',58:'140.12',59:'140.91',60:'144.24',
    62:'150.36',63:'151.96',64:'157.25',65:'158.93',66:'162.50',67:'164.93',68:'167.26',69:'168.93',70:'173.05',71:'174.97',
    72:'178.49',73:'180.95',74:'183.84',75:'186.21',76:'190.23',77:'192.22',78:'195.08',79:'196.97',80:'200.59',
    81:'204.38',82:'207.2',83:'208.98',90:'232.04',91:'231.04',92:'238.03'
  };
  var GAS = new Set([1,2,7,8,9,10,17,18,36,54,86]);
  var LIQUID = new Set([35,80]);
  var UNKNOWN_STATE = new Set(Array.from({ length: 15 }, function (_, index) { return index + 104; }));
  var CATEGORIES = new Set(['alkali','alkaline','transition','post','metalloid','nonmetal','halogen','noble','lanthanide','actinide']);

  function validateElements(elements) {
    var errors = [];
    if (!Array.isArray(elements) || elements.length !== 118) errors.push('Dataset must contain exactly 118 elements.');
    var numbers = new Set();
    var symbols = new Set();
    (elements || []).forEach(function (element, index) {
      if (element.z !== index + 1) errors.push('Atomic numbers must be sequential at row ' + (index + 1) + '.');
      if (SYMBOLS[index] !== element.s) errors.push('Unexpected symbol at atomic number ' + (index + 1) + '.');
      if (!element.n || typeof element.n !== 'string') errors.push('Missing element name at atomic number ' + (index + 1) + '.');
      if (!CATEGORIES.has(element.c)) errors.push('Unknown category for ' + element.s + '.');
      if (element.p < 1 || element.p > 7) errors.push('Invalid period for ' + element.s + '.');
      if (element.g < 1 || element.g > 18) errors.push('Invalid group for ' + element.s + '.');
      numbers.add(element.z);
      symbols.add(element.s);
    });
    if (numbers.size !== (elements || []).length) errors.push('Atomic numbers must be unique.');
    if (symbols.size !== (elements || []).length) errors.push('Symbols must be unique.');
    return { valid: errors.length === 0, errors: errors };
  }

  function atomicWeight(element) {
    var value = CIAAW_2024[element.z];
    return {
      value: value || 'No standard atomic weight',
      kind: value ? 'Abridged standard atomic weight' : 'No CIAAW standard atomic weight',
      sourceYear: 2024
    };
  }

  function stateAt25C(element) {
    if (UNKNOWN_STATE.has(element.z)) return 'Not established';
    if (GAS.has(element.z)) return 'Gas';
    if (LIQUID.has(element.z)) return 'Liquid';
    return 'Solid';
  }

  function filter(elements, criteria) {
    var query = String(criteria.query || '').trim().toLocaleLowerCase();
    var category = String(criteria.category || '');
    var period = Number(criteria.period || 0);
    var group = Number(criteria.group || 0);
    return elements.filter(function (element) {
      var searchable = [element.z, element.s, element.n].join(' ').toLocaleLowerCase();
      return (!query || searchable.includes(query)) &&
        (!category || element.c === category) &&
        (!period || element.p === period) &&
        (!group || element.g === group);
    });
  }

  function categoryLabel(category) {
    return {
      alkali:'Alkali metal', alkaline:'Alkaline-earth metal', transition:'Transition metal',
      post:'Post-transition metal', metalloid:'Metalloid', nonmetal:'Reactive nonmetal',
      halogen:'Halogen', noble:'Noble gas', lanthanide:'Lanthanide', actinide:'Actinide'
    }[category] || category;
  }

  function report(element) {
    var weight = atomicWeight(element);
    return [
      'Periodic table element notes — AfroTools',
      '',
      element.n + ' (' + element.s + ')',
      'Atomic number: ' + element.z,
      'Period: ' + element.p,
      'Group: ' + element.g,
      'Category: ' + categoryLabel(element.c),
      'State at 25 °C: ' + stateAt25C(element),
      weight.kind + ': ' + weight.value,
      '',
      'Weight source: CIAAW Abridged Standard Atomic Weights 2024.',
      'Names, symbols and table placement: IUPAC Periodic Table of the Elements.',
      'Check the official source before using a value in assessed or laboratory work.'
    ].join('\n');
  }

  return {
    symbols: SYMBOLS.slice(),
    weights: Object.assign({}, CIAAW_2024),
    validateElements: validateElements,
    atomicWeight: atomicWeight,
    stateAt25C: stateAt25C,
    filter: filter,
    categoryLabel: categoryLabel,
    report: report
  };
});
