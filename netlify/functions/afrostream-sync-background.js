var ADMIN_SECRET = process.env.ADMIN_SECRET;
var syncModule = require('./afrostream-sync.js');

function isAuthorized(event) {
  if (!ADMIN_SECRET) return false;
  var auth = (event.headers && (event.headers.authorization || event.headers.Authorization)) || '';
  return auth === 'Bearer ' + ADMIN_SECRET;
}

exports.handler = async function(event) {
  if (!isAuthorized(event)) {
    throw new Error('Unauthorized background sync trigger');
  }

  await syncModule.runManualSync();
};
