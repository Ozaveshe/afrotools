'use strict';
process.argv.splice(2,0,'005');
require('./check-reviewed-batch.cjs');
