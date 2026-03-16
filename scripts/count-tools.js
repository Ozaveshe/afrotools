const fs = require('fs');
const path = require('path');
eval(fs.readFileSync(path.join(__dirname, '..', 'assets/js/components/tool-registry.js'), 'utf8'));
const live = AFRO_TOOLS.filter(t => t.status === 'live' || t.status === 'new');
const pending = AFRO_TOOLS.filter(t => t.status !== 'live' && t.status !== 'new');
console.log('Total:', AFRO_TOOLS.length, 'Live:', live.length, 'Pending:', pending.length);
