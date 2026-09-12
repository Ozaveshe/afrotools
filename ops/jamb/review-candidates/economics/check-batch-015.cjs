'use strict';
process.argv.splice(2,0,'015');
require('./check-reviewed-batch.cjs');
