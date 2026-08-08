"use strict";
const path=require("path");
const {defineConfig,devices}=require("@playwright/test");
const root=path.resolve(__dirname,"../../..");
module.exports=defineConfig({
  testDir:__dirname,
  testMatch:"ha-05-parity.spec.js",
  timeout:90000,
  expect:{timeout:10000},
  fullyParallel:false,
  workers:1,
  reporter:[["list"]],
  outputDir:path.join(root,"reports/hausa-workers/ha-05/playwright-artifacts"),
  use:{baseURL:"http://127.0.0.1:4173",...devices["Desktop Chrome"],serviceWorkers:"block",trace:"off",screenshot:"off",video:"off"},
  webServer:{command:"node tests/support/static-server.js",cwd:root,url:"http://127.0.0.1:4173",reuseExistingServer:true,timeout:120000}
});
