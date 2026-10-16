// The repository runner discovers .test.js; enroll the dependency-free ESM cases.
import('./regulatory-report.test.mjs').catch(function (error) {
  console.error(error);
  process.exitCode = 1;
});
