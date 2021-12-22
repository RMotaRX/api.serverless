'use strict';

const jwt = require('jsonwebtoken');
const { getTool, putTools, getTools, putAllowLists, getAllowList } = require('./apps-utils');
const { getAccountProfileRDS } = require('../backend/backend-utils');

const config = require('../../config/apihub.conf.json');
const { prepareLaunchObject } = require('./lti/1p0');

const { ErrorResponse, RawResponse, Response, DefaultResponse, Redirect } = require('../../utils/response');

const { putLaunchXLog } = require('../../utils/xlogs');

const LTI1P0 = config.lti1p0.settings.lti_version;

// POST Functions
module.exports.registerToolEndpoint = async (event, context) => {

  // /* Disable User Group Validation. May enable again in future. */
  // let validGroup = false;
  // const claims = event.requestContext.authorizer.claims;
  // if (claims && claims["cognito:groups"]) {
  //   let groups = claims["cognito:groups"];
  //   if ( (groups instanceof Array && groups.find( group => group === 'dev')) || groups === 'dev' ) {
  //     validGroup = true;
  //   }
  // }

  // // TODO: Remove or replace by a logging lib
  // if(process.env.STAGE == 'dev'){
  //   console.log('claims: ', claims);
  // }
  let validGroup = true;
  if (validGroup) {
    let messageBody;
    let body;
    try {
      body = JSON.parse(event.body);
    } catch (err) {
      return ErrorResponse(err, 'registerToolEndpoint');
    }
    if (body.owner == "hub-tools"){ //TODO Remove MOCH
      // Save Tool in DynamoDB
      let putToolPromise;
      try{
        putToolPromise = await putTools(body.owner, body.data);
      } catch (err) {
        return ErrorResponse(err, 'registerToolEndpoint');
      }
      messageBody = {
        message: 'Tools Registration done!',
        ...putToolPromise
      };
      return Response(200, messageBody);
    }
    return DefaultResponse();
  } else {
    let err = {
      statusCode: 401,
      message: 'Unauthorized!'
    };
    return ErrorResponse(err);
  }
};

module.exports.registerAllowLists = async (event, context) => {
  let messageBody;
  let body;
  try {
    body = JSON.parse(event.body);
  } catch (err) {
    return ErrorResponse(err, 'registerAllowLists');
  }
  // Save AllowList in DynamoDB
  let putAllowListsPromise;
  try{
    putAllowListsPromise = await putAllowLists(body.organizations);
  } catch (err) {
    return ErrorResponse(err, 'registerAllowLists');
  }
  messageBody = {
    message: 'Allow Lists Registration done!',
    ...putAllowListsPromise
  };
  return Response(200, messageBody);
};

module.exports.launchToolEndpoint = async (event, context) => {
  /** Authorization verification */
  if (!event.requestContext.authorizer || !event.requestContext.authorizer.claims) {
    let err = {
      statusCode: 401,
      message: 'Unauthorized!'
    };
    return ErrorResponse(err);
  }
  let claims = event.requestContext.authorizer.claims;
  let customParams = {};
  try {
    // Change for TTM Time to Market (pseudonymous user_id). // TODO Remove in future.
    // customParams.user_id = claims["cognito:username"];
    customParams.user_id = claims.sub;
  } catch (err) {
    return ErrorResponse(err);
  }

  let payload;
  let messageBody;
  if (event.httpMethod === 'POST'){
    try {
      payload = event.body;
    } catch (err) {
      return ErrorResponse(err, 'launchToolEndpoint');
    }
  } else if (event.httpMethod === 'GET') {
    try{
      payload = Buffer(event.queryStringParameters.payload, 'base64').toString();
    } catch (err){
      return ErrorResponse(err, 'getLaunchTools');
    }
  }
  //Process Default Name
  try {
    payload = JSON.parse(payload);
  } catch (err) {
    return ErrorResponse(err, 'getLaunchTools');
  }

  let tool;
  try{
    tool = await getTool(payload.app);
  } catch (err) {
    return ErrorResponse(err);
  }
  if (tool && Object.keys(tool).length){
    console.log('Launching Tool: ', tool);
    tool = tool.attributes;
    console.log('LTI 1.0: ', tool);

    if (tool.launch.protocol === LTI1P0){
      // Experience Log:
      // Log Launch (app, user_id)
      putLaunchXLog(payload.app, customParams.user_id);
      // End Experience Log

      // Setup to get account profiles
      let username = claims["cognito:username"];

      // Check identity provider
      if (claims.identities){
      let identities;
        try {
          identities = JSON.parse(claims.identities);
        } catch (err) { // Local development
          if (err instanceof SyntaxError)
            identities = claims.identities[0];
          else
            identities = claims.identities;
        }
        if (identities.providerType === 'Facebook' || identities.providerType === 'Google' )
          username = claims.email;
      }
      // End of identity provider check

      let profiles;
      try {
        profiles = await getAccountProfileRDS(username);
      } catch (err) {
        return ErrorResponse(err);
      }
      if (profiles instanceof Array && profiles.length>0) {
        // TODO: Problem here. profiles is an array, in the future,
        // in the future it will return multiples profiles.
        // The choice for the right profile will depend on profile sent from
        // front-end that will indicate the profile being launched.
        // So this choice will have to be considered in future.
        let selectedProfile = profiles[0];

        // Anonymize accourding to privacy
        let fullName = selectedProfile.nomecompleto.split(' ');
        let firstName = fullName[0];
        // let email = profiles[0].email;
        customParams.lis_person_name_given = firstName;
        customParams.lis_person_contact_email_primary = firstName.toLowerCase() + '@hub.com'; // TODO: Treat error in case of undefined firstName

        if (fullName.length>1){
          let familyName = fullName[fullName.length-1];
          customParams.lis_person_name_family = familyName[0]+'.';
        }

        // HACK to test LTI Launch // TODO: Remove
        customParams.roles = "Learner";

        if (selectedProfile.matricula)
          customParams.custom_school_user_id = selectedProfile.matricula;

        if (selectedProfile.instituicao)
          customParams.custom_school_hub_id = selectedProfile.instituicao;
        // End of HACK to test LTI Launch // TODO: Remove

      }
      let launchObject = prepareLaunchObject(tool, customParams);
      return Response(200, launchObject);
    }
    return Response(404, {message: 'Not found'});
  }else{ // Empty
    messageBody = {
      message: "App not found!"
    };
    return Response(404, messageBody);
  }
};

// GET Functions
module.exports.getToolsEndpoint = async (event, context) => {
  /** Authorization verification */
  if (!event.requestContext.authorizer || !event.requestContext.authorizer.claims) {
    let err = {
      statusCode: 401,
      message: 'Unauthorized!'
    };
    return ErrorResponse(err);
  }
  let claims = event.requestContext.authorizer.claims;
  let userName;
  try {
    userName = claims["cognito:username"];
    // if (identities instanceof Array && groups.find( group => group === 'dev')) || groups === 'dev' )
    if (claims.identities){
      let identities;
      try {
        identities = JSON.parse(claims.identities);
      } catch (err) { // Local development
        if (err instanceof SyntaxError)
          identities = claims.identities[0];
        else
          identities = claims.identities;
      }
      console.log('identities:', identities);
      // socialIdentity = claims.identities.find( x => (x.providerType === 'Facebook' || x.providerType === 'Google'));
      // if ( (groups instanceof Array && groups.find( group => group === 'dev')) || groups === 'dev' ) {
      console.log('identities.providerType:', identities.providerType);
      if (identities.providerType === 'Facebook' || identities.providerType === 'Google' )
        userName = claims.email;
    }
  } catch (err) {
    return ErrorResponse(err);
  }
  /** End Authorization */
  console.log('Choosen username:', userName);
  let getToolsPromise = getTools();
  let getProfilePromise = getAccountProfileRDS(userName);

  let profiles;
  try{
    profiles = await getProfilePromise;
  } catch (err) {
    return ErrorResponse(err, 'getToolsEndpoint');
  }

  let messageBody;
  if (profiles.length > 0){
    let organizationID = profiles[0].instituicao;
    let allowListPromise = getAllowList(organizationID);

    let organizationAllow;
    let tools;
    try{
      organizationAllow = await allowListPromise;
      tools = await getToolsPromise;
    } catch (err) {
      return ErrorResponse(err, 'getToolsEndpoint');
    }
    let newList = [];
    let toolName;
    let allow = organizationAllow.allow || [];
    // HACK allow for all list. TODO: Remove!
    const allowForAll = ['saltire.tool', 'sage'];
    allow = allow.concat(allowForAll);
    // End of HACK allow for all list. TODO: Remove!

    for (const tool of tools) {
      toolName = tool.app.replace('hub.tools.', '');
      if (allow.includes(toolName)) {
        newList.push(tool);
      }
    }

    if (process.env.STAGE === 'dev'){
      console.log('tools length:', tools.length);
      console.log('organizationAllow.allow:', organizationAllow.allow);
      console.log('newList result:', newList);
    }

  // filter tool in allowList
  // Return Filtred Tools
    return Response(200, newList);
  } else {
    messageBody = {
      message: "Not found!"
    };
    return Response(404, messageBody);
  }


};


// PUT Functions

// DELETE Functions