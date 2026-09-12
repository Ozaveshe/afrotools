'use strict';
process.argv.splice(2, 0, 'literature-005');
require('./check-batch.cjs');
