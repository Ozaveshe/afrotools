'use strict';
process.argv.splice(2, 0, 'literature-004');
require('./check-batch.cjs');
