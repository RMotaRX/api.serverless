'use-strict';

const { getItemByPartitionAndSortKey, queryIndexByHashKeyValue, putItem, batchWrite, createBatchRequest } = require('../../utils/dynamodb');
const { createUser, setUserPassword } = require('../../utils/cognito');
const { QueryProfileByUserId } = require('../sync/sync.function');

const uuidv4 = require('uuid/v4');

const config = require('../../config/apihub.conf.json');

const SORTKEY = config.api.backend.profiles.sortkey;
const OWNER_PREFIX = config.api.backend.profiles.owner;

const PROFILECONF = config.dbconfig.singleTable[process.env.STAGE];
const OWNER_CONF = config.dbconfig.singleTableDataGSI[process.env.STAGE];

module.exports.getAccountProfile = async function(userID){
  let result = await getItemByPartitionAndSortKey(userID, SORTKEY, PROFILECONF);
  let item = result.Item;
  let profiles = [];
  if (item && item.Attributes){
    item.Attributes.id = item.PartitionKey;
    // May anonymize
    profiles.push(item.Attributes);
  }
  // Query By Parent (GSI)
  // profiles.push(children)
  return profiles;
};

function proccessRDSRawProfile(rawProfile){
  console.log('processRDSRawProfile rawProfile:', rawProfile);

  // The next assignment is not safe on purpose:
  //  "let rawItem = rawProfile[0];"
  // For now, query always returns an Item,
  // so if query doesn't return anything
  // it means there is something wrong with Database Connection
  let rawItem = rawProfile[0];

  if (!rawItem.existeConta){
    return undefined;
  }
  let item = {};
  item.id = rawItem.cod_uuid;
  item.nomecompleto = rawItem.nom_usuario;
  item.email = rawItem.email_usuario;
  item.matricula = rawItem.cod_perfil;
  item.nomeinstituicao = rawItem.nom_instituicao;
  item.instituicao = rawItem.cod_instituicao_hub;
  return item;
}

module.exports.getAccountProfileRDS = async function(userID){
  let rawResult = await QueryProfileByUserId(userID);
  let item = proccessRDSRawProfile(rawResult);
  let profiles = [];
  if (item){
    profiles.push(item);
  }
  // Query By Parent (GSI)
  // profiles.push(children)
  return profiles;
};

module.exports.getOwnedProfiles = async function(userID){
  let getProfileAccountResult = getItemByPartitionAndSortKey(userID, SORTKEY, PROFILECONF);
  let queryOwned = queryIndexByHashKeyValue(OWNER_PREFIX+userID,OWNER_CONF);
  getProfileAccountResult = await getProfileAccountResult;
  let profiles = [];
  let item = getProfileAccountResult.Item;
  if (item && item.Attributes){
    item.Attributes.id = item.PartitionKey;
    // May anonymize
    profiles.push(item.Attributes);
  }
  queryOwned = await queryOwned;
  let items = queryOwned.Items;
  for (const item of items) {
    item.Attributes.id = item.PartitionKey;
    // May anonymize
    profiles.push(item.Attributes);
  }
  // Query By Parent (GSI)
  // profiles.push(children)
  return profiles;
};

module.exports.putAccountProfile = async function(profile){
  let baseItem = {};
  baseItem.Attributes = profile.attributes;
  if (profile.owner)
      baseItem.Data = PARENT_PREFIX + profile.owner;
  return putItem(profile.id, SORTKEY, PROFILECONF, baseItem);
};

module.exports.putAccountProfiles = async function(profiles){
  let requestList = [];
  let putRequest;
  let baseItem = {};
  for (const profile of profiles) {
    if (profile.owner)
      baseItem.Data = OWNER_PREFIX + profile.owner;

    baseItem.Attributes = profile.attributes;

    putRequest = createBatchRequest("PutRequest", profile.id, SORTKEY, PROFILECONF, baseItem);
    requestList.push(putRequest);
  }
  let requestItems = {[PROFILECONF.tableName]: requestList};

  return batchWrite(requestItems);
};

module.exports.createProfilesAccount = async function(profiles){
  let results = {};
  results.created = [];
  results.notcreated = [];
  let username;
  let email;
  let cognitoUser;
  for (const profile of profiles) {
    // Check type: profile or native
    if (profile.type === "native"){
      email = profile.attributes.email;
      if (!email){
        profile.message = 'Missing e-mail attribute for native account!';
        profile.code = 'MissingRequiredAttribute';
        results.notcreated.push(profile);
        continue;
      }
      email = email.toLowerCase();
    }else{
      email = null;
    }
    if (profile.id) {
      username = profile.id;
      // console.log('Profile Id: ', username);
    } else {
      username = uuidv4();
      // console.log('Generated Profile Id: ', username);
    }
    try {
      cognitoUser = await createUser(username, email);
    } catch (err) {
      profile.message = err.message;
      profile.code = err.code;
      results.notcreated.push(profile);
      continue;
    }

    profile.cognitoUser = {
      'sub': cognitoUser.User.Attributes.find(item => item.Name === 'sub').Value,
      'Email': email,
      'Username': cognitoUser.User.Username,
      'Enabled': cognitoUser.User.Enabled,
      'UserStatus': cognitoUser.User.UserStatus
    };
    profile.id = profile.cognitoUser.Username;
    results.created.push(profile);
  }
  return results;
};

module.exports.setProfilesAccountPasswords = async function(profiles){
  let results = {};
  results.set = [];
  results.fail = [];
  let username;
  let password;
  for (const profile of profiles) {
    password = profile.password;
    if (password){
      username = profile.id;
      try {
        await setUserPassword(username, password, permanent = true);
      } catch (err) {
        profile.message = err.message;
        profile.code = err.code;
        results.fail.push(profile);
        continue;
      }
      results.set.push(profile);
    } else {
      profile.message = 'No password informed to set!';
      profile.code = 'UndefinedPassword';
      results.fail.push(profile);
    }
  }
  return results;
};