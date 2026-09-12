'use strict';
process.argv.splice(2,0,'016');
require('./check-reviewed-batch.cjs');
