'use strict';
process.argv.splice(2,0,'010');
require('./check-reviewed-batch.cjs');
