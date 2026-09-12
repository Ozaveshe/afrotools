'use strict';
process.argv.splice(2,0,'021');
require('./check-reviewed-batch.cjs');
