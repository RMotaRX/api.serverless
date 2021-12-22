const AWS = require('aws-sdk');
const config = require('../../config/apihub.conf.json');

// DynamoDB Config:
let paramsDynamoDB;
let paramsDocumentClient;
if (process.env.IS_OFFLINE){
  paramsDynamoDB = config.offline.dynamoDB.config;
  paramsDocumentClient = config.offline.dynamoDB.docClientConfig;
} else {
  paramsDynamoDB = config.development.dynamoDB.config;
  paramsDocumentClient = config.development.dynamoDB.docClientConfig;
}
// DynamoDB Config: End

var dynamodb = new AWS.DynamoDB(paramsDynamoDB);
var docClient = new AWS.DynamoDB.DocumentClient(paramsDocumentClient);

module.exports = {dynamodb, docClient};