'use strict';
process.argv.splice(2,0,'020');
require('./check-reviewed-batch.cjs');
