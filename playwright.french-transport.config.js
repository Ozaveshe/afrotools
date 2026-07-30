const base = require('./playwright.config');

const port = Number(process.env.FR_TRANSPORT_PORT || 45173);
const baseURL = `http://127.0.0.1:${port}`;

module.exports = {
  ...base,
  workers: 1,
  use: {
    ...base.use,
    baseURL
  },
  webServer: undefined
};
