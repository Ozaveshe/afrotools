'use strict';
process.argv.splice(2,0,'012');
require('./check-reviewed-batch.cjs');
