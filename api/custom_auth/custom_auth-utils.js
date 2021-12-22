var { queryBySortKeyIndex, queryByPartitionKeyAndSortKeyBeginsWith, batchWrite, createBatchRequest } = require("../../utils/dynamodb");
const config = require('../../config/apihub.conf.json');

var crypto = require('crypto');

const SERVERHASHSECRET = config.api.customAuth.hashsecret;
const SIZERANDOMBYTES = config.api.customAuth.randombytessize;
const PREFIX = config.api.customAuth.prefix;

const CUSTOMLOGINCONF = config.dbconfig.singleTable[process.env.STAGE];

function randomGen(size = SIZERANDOMBYTES){
  return sha256HashBase64(crypto.randomBytes(size));
}

function sha256HashBase64(str){
  return crypto.createHash('sha256').update(str).digest('base64');
}

function processKey(hash, value){
  let key;
  if (hash) {
    key = sha256HashBase64(value);
  } else {
    key = value;
  }
  return key;
}

function calcCustomLoginSortKey(password, type){
  return PREFIX+type+'#'+sha256HashBase64(password+SERVERHASHSECRET);
}

module.exports.customLoginSortKey = calcCustomLoginSortKey;

module.exports.getUserNameByCustomLogin = async function(password, type){
  let username;
  let result;

  result = await queryBySortKeyIndex(calcCustomLoginSortKey(password, type), CUSTOMLOGINCONF);
  if (result.Items[0]){
    username = result.Items[0].PartitionKey;
  }
  return username;
};

module.exports.getUserLogins = async function(username){
  let logins = [];
  let result;

  result = await queryByPartitionKeyAndSortKeyBeginsWith(username, PREFIX, CUSTOMLOGINCONF);
  console.log('[LOG] INSIDE custom_auth.utils#getUserLogins');
  console.log(`[LOG] Username: ${username}`);
  console.log(`[LOG] Results: ${JSON.stringify(result)}`);
  for (var itemIndex = 0; itemIndex < result.Items.length; itemIndex++) {
    logins.push(result.Items[itemIndex].SortKey);
  }
  console.log(`[LOG] Logins: ${logins}`);
  console.log('[LOG] END custom_auth.utils#getUserLogins');
  return logins;
};

module.exports.putCustomLogin = async function(bodydata){
  let requestList = [];
  let element;
  let putRequest;
  let customLoginKey;
  for (let index = 0; index < bodydata.length; index++) {
    element = bodydata[index];
    if (element.typ=='badgeLogin' || element.typ=='emojiLogin'){
      customLoginKey = calcCustomLoginSortKey(element.pwd, element.typ);
      putRequest = createBatchRequest("PutRequest", element.usr, customLoginKey, CUSTOMLOGINCONF);
      requestList.push(putRequest);
    }
  }
  let requestItems = {[CUSTOMLOGINCONF.tableName]: requestList};

  return batchWrite(requestItems);
};