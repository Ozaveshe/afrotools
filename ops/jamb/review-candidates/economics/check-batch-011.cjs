'use strict';
process.argv.splice(2,0,'011');
require('./check-reviewed-batch.cjs');
