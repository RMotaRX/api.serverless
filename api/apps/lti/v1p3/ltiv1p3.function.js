'use strict';
const jwt = require('jsonwebtoken');
const { getLTITool, putLTITools, getLTITools } = require('./lti-utils');

const config = require('../../../../config/apihub.conf.json');
const { prepareLaunchObject } = require('../1p0');
const crypto = require('crypto');

const { ErrorResponse, RawResponse, Response, DefaultResponse, Redirect } = require('../../../../utils/response');

const { putLaunchXLog } = require('../../../../utils/xlogs');

const LTI1P0 = config.lti1p0.settings.lti_version;

//HACK for Let's Go
//TODO Remove
const LETSGOSECRET = 'l3t$60@2019';
const LETSGOHEADER = {
  "alg": "HS256",
  "typ": "JWT"
};

function getRandomHex(size){
  return crypto.randomBytes(size).toString('hex');
}

function anonimizeName(inputName){
  var stringArray = inputName.split(' ');
  for (let index = 1; index < stringArray.length; index++) {
    stringArray[index] = stringArray[index][0].toUpperCase()+'.';
  }
  return stringArray.join(' ');
}
//End of HACK for Let's Go


// POST Functions
module.exports.registerToolEndpoint = async (event, context) => {
  let messageBody;
  let body;
  try {
    body = JSON.parse(event.body);
  } catch (err) {
    return ErrorResponse(err, 'LTI v1.3 registerToolEndpoint');
  }
  if (body.owner == "tool-dev-xyxxx" && body.secret == "09s994mlx0982*6g5s2.ssr5)98kfj(1lfcslfs-05ljz"){ //TODO Remove MOCH
    // Save Tool in DynamoDB
    let putLTIToolPromise;
    try{
      putLTIToolPromise = await putLTITools(body.owner, body.data);
    } catch (err) {
      return ErrorResponse(err, 'LTI v1.3 registerToolEndpoint');
    }
    messageBody = {
      message: 'Tools Registration done!',
      ...putLTIToolPromise
    };
    return Response(200, messageBody);
  }
  return DefaultResponse();
};

module.exports.launchToolEndpoint = async (event, context) => {
  let payload;
  let messageBody;
  if (event.httpMethod === 'POST'){
    try {
      payload = event.body;
    } catch (err) {
      return ErrorResponse(err, 'LTI v1.3 launchToolEndpoint');
    }
  } else if (event.httpMethod === 'GET') {
    try{
      payload = Buffer(event.queryStringParameters.payload, 'base64').toString();
    } catch (err){
      return ErrorResponse(err, 'LTI v1.3 getLaunchTools');
    }
  }
  //Process Default Name
  try {
    payload = JSON.parse(payload);
  } catch (err) {
    return ErrorResponse(err, 'LTI v1.3 getLaunchTools');
  }
  putLaunchXLog(payload.app, payload.email);
  if(!payload.name){
    let nameMatch;
    nameMatch = payload.email.replace(/@.*$/,"");
    payload.name = nameMatch!==payload.email ? nameMatch : "Let's Go!";
  }
  let tool;
  try{
    tool = await getLTITool(payload.app);
  } catch (err) {
    return ErrorResponse(err);
  }
  if (tool && Object.keys(tool).length){
    console.log('Launching Tool: ', tool);
    let urlRedirect;
    let url;
    let lauchPayload;
    url = tool.attributes.LetsGoLaunchURL;
    switch(tool.attributes.LetsGoLaunchType){ // Interno
      case "internal":
        // let url = 'http://oficinadolivro.educacional.com.br/proxy/?';
        let pwd = getRandomHex(5);
        // let pwd = payload.pwd.toLowerCase();
        // if (!pwd) {
        //   pwd = getRandomHex(5);
        // }
        if (payload.app == "tool.dev.xyxxx.oficina.do.livro"){
          lauchPayload = {
            "name": anonimizeName(payload.name),
            "email": payload.email,
            "url": tool.attributes.LetsGoRedirectUrl,
          };
        } else {
          lauchPayload = {
            "name": anonimizeName(payload.name),
            "email": pwd + '@hubeducacional.com',
            "url": tool.attributes.LetsGoRedirectUrl,
          };
        }
        urlRedirect = url+jwt.sign(JSON.stringify(lauchPayload), LETSGOSECRET, {header: LETSGOHEADER});
        console.log('Redirecting to: ', urlRedirect);
        console.log('Payload: ', lauchPayload);
        return Redirect(urlRedirect);
      case "goeduca":
        let goEducaQrCode = payload.pwd.replace(/(.{4})(.{2})(.{4})/, "$1-$2-$3");
        urlRedirect = [url, goEducaQrCode].join('');
        console.log('Redirecting to: ', urlRedirect);
        return Redirect(urlRedirect);
      case "tutormundi":
        let tutorMundiTokenDev = "DgicFEhRPqsFJLuTY";
        let tutorMundiToken = "fgFMArqDtkwM5Ffwp";
        let tutorMundiQrCode = payload.pwd.replace(/(.{4})(.{2})(.{4})/, "$1-$2-$3");
        urlRedirect = [url, tutorMundiToken, tutorMundiQrCode].join('/');
        console.log('Redirecting to: ', urlRedirect);
        return Redirect(urlRedirect);
      case "schoolastic":
        let schoolasticData = "{action:login,Login:paolo.ramos%40citsamazonas.org.br,Senha:727348,Manter:true}";
        urlRedirect = url;
        console.log('Redirecting to: ', urlRedirect);
        RawResponse(302, schoolasticData, {Location: urlRedirect});
        return Redirect(urlRedirect);
      case "direct":
        urlRedirect = url;
        console.log('Redirecting to: ', urlRedirect);
        return Redirect(urlRedirect);
      default:
        tool = tool.attributes;
        console.log('LTI 1.0: ', tool);
        if (tool.launch.protocol === LTI1P0){
          let customParams = {
            user_id: payload.pwd,
            lis_person_name_given: payload.name,
            lis_person_contact_email_primary: payload.email,
          };
          // Anonimize accourding to privacy
          let launchObject = prepareLaunchObject(tool, customParams);
          return Response(200, launchObject);
        }
        return Response(404, {message: 'Not found'});
    }
  }else{ // Empty
    messageBody = {
      message: "App not found!"
    };
    return Response(404, messageBody);
  }
};

// GET Functions
module.exports.getToolsEndpoint = async (event, context) => {
  let getLTIToolsPromise;
  try{
    getLTIToolsPromise = await getLTITools();
  } catch (err) {
    return ErrorResponse(err, 'LTI v1.3 getToolsEndpoint');
  }
  return Response(200, getLTIToolsPromise);
};


// PUT Functions

// DELETE Functions