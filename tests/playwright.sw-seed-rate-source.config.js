const path = require('node:path');
const base = require('./playwright.sw-seed-rate.config');

module.exports = {
  ...base,
  reporter: [
    ['list'],
    ['json', { outputFile: path.resolve(__dirname, '../reports/sw-agriculture-browser-raw/seed-rate-source-playwright.json') }],
  ],
};
