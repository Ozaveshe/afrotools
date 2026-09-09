const {defineConfig}=require('@playwright/test');
module.exports=defineConfig({
  testDir:'./tests/e2e',testMatch:['operator-dashboard.spec.js','operator-dashboard-published.spec.js'],
  workers:1,timeout:60000,reporter:'list',
  use:{baseURL:'http://127.0.0.1:4189',serviceWorkers:'block'},
  webServer:{command:'node tests/support/operator-server.js',url:'http://127.0.0.1:4189/assets/img/logo-mark.svg',reuseExistingServer:false},
  projects:[{name:'chromium',use:{browserName:'chromium'}}]
});
