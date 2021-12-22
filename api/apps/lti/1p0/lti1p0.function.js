'use strict';

const config = require('../../../../config/apihub.conf.json');

const ADMGROUP = config.lti1p0.settings.adm_group;
const LTI1P0 = config.lti1p0.settings.lti_version;
const oauth = require('oauth-sign');

const HUB_CONSUMER_KEY = 'hub.educacional.com';
const HUB_SHARED_SECRET = 'secret';

/*
// LTI 1.0 OAuth 1.0a

// Configuration parameters:

oauth_consumer_key
oauth_consumer_secret

// Example of launch parameters:

var oauth = require('oauth-sign');
var params = {
    // LTI Required Parameters
    lti_message_type: 'basic-lti-launch-request',
    lti_version: 'LTI-1p0',
    resource_link_id: 'resourceLinkId',
    // OAuth 1.0a Required Parameters
    oauth_consumer_key: 'hubtool-test.educacional.com', // Identification
    oauth_nonce: btoa(timestamp),
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp: timestamp,
    oauth_version: '1.0'
};
var signature = oauth.hmacsign(method, action, params, oauth_consumer_secret);
params.oauth_signature = signature;

//// Tools Attributes
// Tool Description
Name*
Short Description*
Icon URL*

// LTI Related
Consumer key*
Shared secret*
Launch URL*

//Privacy

]

*/
const {RawResponse} = require('../../../../utils/response');

module.exports.prepareLaunchObject = function (tool, customParams = {}){
  const timestamp = Math.round(Date.now() / 1000);
  let resourceLinkId = 'LTI-usage';
  let action = tool.launch.config.launchURL;
  let method = tool.launch.config.launchMethod;

  let params = {
    // LTI Required Parameters
    lti_message_type: 'basic-lti-launch-request',
    lti_version: 'LTI-1p0',
    resource_link_id: resourceLinkId,

    ///* Process permission related attributes*/
    // user_id:'0ae836b9-7fc9-4060-006f-27b2066ac545',
    // roles: 'Instructor',
    // lis_person_name_given: 'Jane',
    // lis_person_name_family: 'Public',
    // lis_person_name_full: 'JaneQ.Public',
    // lis_person_contact_email_primary: 'user@school.edu',


    /*
    POST Parameters
    Source: https://www.eduappcenter.com/docs/basics/post_parameters

    */
    ///* Recommended parameters*/
    ///* Most Commom*/
    // user_id
    // roles
    // lis_person_name_full

    ///* Additional*/
    // lis_person_name_given
    // lis_person_name_family
    // lis_person_contact_email_primary
    // resource_link_title
    // context_id
    // context_type
    // context_title
    // context_label
    // launch_presentation_locale
    // launch_presentation_document_target
    // launch_presentation_width
    // launch_presentation_height
    // launch_presentation_return_url
    // tool_consumer_info_product_family_code
    // tool_consumer_info_version
    // tool_consumer_instance_guid
    // tool_consumer_instance_name
    // tool_consumer_instance_contact_email

    ///* Optional parameters*/
    ///* Most Commom*/
    // user_image
    // lis_outcome_service_url
    // selection_directive

    ///* Additional*/
    // resource_link_description
    // context_type
    // launch_presentation_css_url
    // tool_consumer_instance_description
    // tool_consumer_instance_url
    // custom_*

    user_id: customParams.user_id,

    // OAuth 1.0a Required Parameters
    oauth_consumer_key: HUB_CONSUMER_KEY,
    oauth_nonce: timestamp,
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp: timestamp,
    oauth_version: '1.0',
    ...tool.launch.config.custom_parameters,
    ...customParams
  };
  let signature = oauth.hmacsign(method, action, params, HUB_SHARED_SECRET);
  params.oauth_signature = signature;
  let launchObject = {
    "action": action,
    "method": method,
    "params": params
  };
  return launchObject;
};

module.exports.launchHandler = async (event, context) => {

  ///* Create Params - Official Flow */
  // verify JWT claims
  // extract user from JWT
  // get user profile
  // get tools configuration
  // check privacy for this user and this app
  // if everything is ok, populate params with tool configuration
  // set resource_link_id(?)
  // oauth1 signature
  // include signature to params
  // return params

  ///* Create Params - MVP Flow */
  // verify JWT claims
  // extract user from JWT
  // get user profile
  // get tools configuration
  // populate params with tool configuration
  // set resource_link_id(?)
  // oauth1 signature
  // include signature to params
  // return params

  /*
  // Options:
  claims.sub = UUID
  claims["cognito:username"] = UUID // No guarantee that this will always be UUID
  claims.email = email
  claims["cognito:groups"]: ["hub.adm"] //Groups
  */

  // Get Cognito Authorizer JWT Claims
  let claims = event.requestContext.authorizer.claims;
  let userGroups = claims["cognito:groups"];

  if (!userGroups.find(group => group === ADMGROUP)){
    return RawResponse(401, JSON.stringify({message:'Unauthorized'}));
  }
  /* ELSE: Do ADM Function */

  // Get Tool By ToolID
  // Read request body to get App to Launch
  let body;
  try{
    body = JSON.parse(event.body);
  } catch (err) {
    return RawResponse(422, JSON.stringify(err));
  }
  // Get Token UUID, Get Given UUID
  let tokenUUID = claims.sub;
  let givenUUID = body.profile;

  let toolID = body.tool;
  let tool; // = getToolByID(toolID);
  if (tool.launch.config.protocol === LTI1P0){
    // params
    let customParams = {
      user_id: givenUUID
    };
    // sign params
    // prepare payload
    let launchObject = module.exports.prepareLaunchObject(tool, customParams);
    return RawResponse(200, JSON.stringify(launchObject));
  }
  let responseObject = {
    message: 'LTI launch configuration not found for this request!'
  };
  return RawResponse(404, JSON.stringify(responseObject));
};