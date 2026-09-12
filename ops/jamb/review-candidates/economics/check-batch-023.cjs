'use strict';
process.argv.splice(2,0,'023');
require('./check-reviewed-batch.cjs');
