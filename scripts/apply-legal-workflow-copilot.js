const path = require('path');
const { spawnSync } = require('child_process');

const script = path.join(__dirname, 'enhance-legal-section-pass.js');
const result = spawnSync(process.execPath, [script], {
  cwd: path.join(__dirname, '..'),
  stdio: 'inherit',
});

if (result.error) {
  console.error(result.error);
  process.exit(1);
}

process.exit(result.status || 0);
