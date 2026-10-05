'use strict';

const { parse, generate } = require('css-tree');

// Generate from CSS tokens instead of removing punctuation-adjacent spaces:
// selector combinators, quoted values and calculation operators carry meaning.
function minifyCss(source) {
  return generate(parse(source, { parseCustomProperty: false }));
}

module.exports = { minifyCss };
