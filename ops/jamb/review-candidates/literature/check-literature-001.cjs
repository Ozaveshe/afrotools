'use strict';
process.argv.splice(2, 0, 'literature-001');
require('./check-batch.cjs');
