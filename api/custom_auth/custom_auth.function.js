'use strict';

const {getUserNameByCustomLogin , putCustomLogin} = require('./custom_auth-utils');

const { ErrorResponse, Response, DefaultResponse } = require('../../utils/response');

const { putQRCodeLoginXLog } = require('../../utils/xlogs');

// POST Functions
module.exports.postEndpoint = async (event, context) => {
  let body;
  try{
    body = JSON.parse(event.body);
  } catch (err){
    return ErrorResponse(err);
  }
  let type = body.type;
  let password = body.password;
  console.log(`[LOG] Type: ${type}`);
  console.log(`[LOG] Password: ${password}`);
  if(password && (type=='badgeLogin' || type=='emojiLogin')){
    let username;
    try{
      username = await getUserNameByCustomLogin(password, type);
      console.log(`[LOG] Username Retrieved: ${JSON.stringify(username)}`);
      if (username && Object.keys(username).length){  // Object.keys(username).length -> Check if not empty
        putQRCodeLoginXLog(username);
        return Response(200, {username: username});
      }
    } catch (err) {
      return ErrorResponse(err);
    }
  }
  let bodyMessage = {
      message: 'Could not process the request!',
      request_body: body
  };
  return Response(422, bodyMessage);
};

module.exports.registrationEndpoint = async (event, context) => {
  let messageBody;
  let body;
  try {
    body = JSON.parse(event.body);
  } catch (err) {
    return ErrorResponse(err, 'CustomAuthRegistrationEndpoint');
  }
  if (body.owner == "tool-dev-xyxxx" && body.secret == "09s994mlx0982*6g5s2.ssr5)98kfj(1lfcslfs-05ljz"){ //TODO Remove MOCH
    // Save Custom Login in DynamoDB
    let putCustomLoginPromise;
    try{
      putCustomLoginPromise = await putCustomLogin(body.data);
    } catch (err) {
      return ErrorResponse(err, 'CustomAuthRegistrationEndpoint');
    }
    messageBody = {
      message: 'Registration done!',
      ...putCustomLoginPromise
    };
    return Response(200, messageBody);
  }
  return DefaultResponse();
};