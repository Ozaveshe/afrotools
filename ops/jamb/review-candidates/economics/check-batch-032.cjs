'use strict';
process.argv.splice(2,0,'032');
require('./check-reviewed-batch.cjs');
