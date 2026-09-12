'use strict';
process.argv.splice(2, 0, 'literature-007');
require('./check-batch.cjs');
