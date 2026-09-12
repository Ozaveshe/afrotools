'use strict';
process.argv.splice(2,0,'025');
require('./check-reviewed-batch.cjs');
