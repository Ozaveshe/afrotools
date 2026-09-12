'use strict';
process.argv.splice(2, 0, 'literature-002');
require('./check-batch.cjs');
