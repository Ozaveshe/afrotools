'use strict';
process.argv.splice(2,0,'022');
require('./check-reviewed-batch.cjs');
