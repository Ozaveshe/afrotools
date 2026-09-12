'use strict';
process.argv.splice(2, 0, 'literature-003');
require('./check-batch.cjs');
