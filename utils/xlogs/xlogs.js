const { putItem } = require("../dynamodb");

const config = require("../../config/apihub.conf.json");

const SINGLETABLE = config.dbconfig.singleTable[process.env.STAGE];

const LAUNCH = "LAUNCH";
const QRCODELOGIN = "QRCODELOGIN";

module.exports.rawPutXLog = function (partitionKey, sortKey, baseItem = {}) {
  putItem(partitionKey, sortKey, SINGLETABLE, baseItem)
    .catch(function (err) {
      console.error('Error: rawPutXLog');
      console.error(err);
      console.error('End Error: rawPutXLog');
    });
};

module.exports.putLaunchXLog = function (app, username) {
  let timeNow = (new Date()).getTime();
  let sortKey = app + '#'+ username + '#' + timeNow;
  let baseItem = {
    created_at: timeNow
  };
  module.exports.rawPutXLog(LAUNCH, sortKey, baseItem);
};

module.exports.putQRCodeLoginXLog = function (username) {
  let timeNow = (new Date()).getTime();
  let sortKey = username + '#' + timeNow;
  let baseItem = {
    created_at: timeNow
  };
  module.exports.rawPutXLog(QRCODELOGIN, sortKey, baseItem);
};