'use strict';

const { queryByPartitionKey } = require("../../../utils/dynamodb");
const config = require('../../../config/apihub.conf.json');

const USERCONF = config.dbconfig.userTable[process.env.STAGE];

// POST Functions
module.exports.postUserEndpoint = async (event, context, callback) => {

  const response = {
    statusCode: 200,
    body: JSON.stringify({
      message: 'Under Construction!',
      input: event,
    }),
  };

  callback(null, response);

  // Use this code if you don't use the http event with the LAMBDA-PROXY integration
  // callback(null, { message: 'Under Construction!', event });
};

// GET Functions
module.exports.getUserEndpoint = (event, context, callback) => {
  console.log("consumeMainQueue, Passo 0");
  let schoolID = event.pathParameters.schoolID;
  console.log("consumeMainQueue, Passo 1", schoolID);

  queryByPartitionKey(schoolID, USERCONF)
    .then(function (data) {
      console.log("consumeMainQueue, Passo 2", data);
      delete data.Count;
      delete data.ScannedCount;
      let dados = JSON.stringify(data);
      console.log("consumeMainQueue, Passo 3", dados);
      const response = {
          statusCode: 200,
          body: dados,
      };
      callback(null, response);
    })
    .catch(function (err) {
      const response = {
        statusCode: 500,
        body: JSON.stringify({
        error: err,
        }),
      };
      // console.error(err); // an error occurred
      callback(null, response);
    });
  // Use this code if you don't use the http event with the LAMBDA-PROXY integration
  // callback(null, { message: 'Under Construction!', event });
};

// PUT Functions
module.exports.putUserEndpoint = async (event, context, callback) => {
  let id;
  let message = 'Under Construction!';
  if (event.pathParameters){
    id = event.pathParameters.id;
    if (id != undefined){
      message = `Under Construction! User: ${id}!`;
    }
  }

  const response = {
    statusCode: 200,
    body: JSON.stringify({
      message: message,
      input: event,
    }),
  };

  callback(null, response);

  // Use this code if you don't use the http event with the LAMBDA-PROXY integration
  // callback(null, { message: 'Under Construction!', event });
};

// DELETE Functions
module.exports.deleteUserEndpoint = async (event, context, callback) => {
  let id;
  let message = 'Under Construction!';
  if (event.pathParameters){
    id = event.pathParameters.id;
    if (id != undefined){
      message = `Under Construction! User: ${id}!`;
    }
  }

  const response = {
    statusCode: 200,
    body: JSON.stringify({
      message: message,
      input: event,
    }),
  };

  callback(null, response);

  // Use this code if you don't use the http event with the LAMBDA-PROXY integration
  // callback(null, { message: 'Under Construction!', event });
};