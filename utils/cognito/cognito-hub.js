'use strict';

let AWS = require("aws-sdk");
const config = require('../../config/apihub.conf.json');

const cognitoIdentitySPConfig = config.cognitoIdentityServiceProvider[process.env.STAGE];

let paramsCognitoIdentitySP = cognitoIdentitySPConfig.config;
const cognitoIdentitySP = new AWS.CognitoIdentityServiceProvider(paramsCognitoIdentitySP);


// Test User Pool ID: User for offline Tests
const TEST_USERPOOL_ID = 'us-east-2_UiDsEc9tY';  // username-test
// const TEST_USERPOOL_ID = 'us-east-2_nbuGHzVSN',  // username-test-02

let userPoolId;
if (process.env.IS_OFFLINE){
  userPoolId = TEST_USERPOOL_ID;
} else {
  userPoolId = cognitoIdentitySPConfig.userPoolId;
}

module.exports.userExist = async function(username){
  let params = {
    UserPoolId: userPoolId,
    Username: username
  };

  let promiseGetUser;
  try {
    promiseGetUser = await cognitoIdentitySP.adminGetUser(params).promise();
  } catch (err) {
    if  (err.code === 'UserNotFoundException') {
      return false;
    } else {
      throw err;
    }
  }
  return promiseGetUser;
};

module.exports.createUser = async function(username, email=undefined){
  let params = {
    UserPoolId: userPoolId,
    Username: username,
    UserAttributes: []
  };
  if(email){
    params.ForceAliasCreation = false;
    let emailAttribute = {"Name": "email","Value": email};
    params.UserAttributes.push(emailAttribute);
    // Auto Verify Email.
    // Same as PreSignUp Trigger event.response.autoVerifyEmail = true;
    // May remove in future.
    let autoVerifyEmail = {"Name": "email_verified","Value": "true"};
    params.UserAttributes.push(autoVerifyEmail);
  }

  return cognitoIdentitySP.adminCreateUser(params).promise();
};

module.exports.setUserPassword = async function(username, password, permanent = false){
  let params = {
    UserPoolId: userPoolId,
    Username: username,
    Password: password,
    Permanent: permanent
  };

  return cognitoIdentitySP.adminSetUserPassword(params).promise();
};