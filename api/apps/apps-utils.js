var { getItemByPartitionAndSortKey, createBatchRequest, queryByPartitionKeyAndSortKeyBeginsWith, batchWrite } = require("../../utils/dynamodb");
const uuidv4 = require('uuid/v4');
const config = require('../../config/apihub.conf.json');

const PREFIX = config.api.apps.settings.prefix;
const PARTITION = config.api.apps.settings.partition;

const TOOLCONF = config.dbconfig.singleTable[process.env.STAGE];

function processTool(tool){
  let newTool = {
    "app": tool.client_id,
    //"did": tool.deployment_id,
    "att": {
      //"ena": tool.attributes.enable,
      "nam": tool.attributes.name,
      "des": tool.attributes.description,
      "ico": tool.attributes.icon,
      "lcs": {
        "use": tool.attributes.licenses.used,
        "tot": tool.attributes.licenses.total,
      },
      "int": tool.attributes.integrated,
      "typ": tool.attributes.type,
      "pfl": tool.attributes.profiles,
    }
  };
  return newTool;
}

function strPreProcess(str){
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Z0-9]/ig, " ")
    .trim()
    .replace(/ /g, '.')
    .toLowerCase();
}

function prepareToolList(items){
  let tools = [];
  let tool;
  for (var itemIndex = 0; itemIndex < items.length; itemIndex++) {
    if (items[itemIndex].tool.attributes.enable){
      tool = processTool(items[itemIndex].tool);
      tools.push(tool);
    }
  }
  return tools;
}


module.exports.putAllowLists = async function(organizations){
  let requestList = [];
  let element;
  let putRequest;
  let baseItem;
  for (let index = 0; index < organizations.length; index++) {
    element = organizations[index];
    baseItem = {
      Allow: element.allow
    };
    putRequest = createBatchRequest("PutRequest", element.id, 'ORGANIZATION', TOOLCONF, baseItem);
    requestList.push(putRequest);
  }
  let requestItems = {[TOOLCONF.tableName]: requestList};
  return batchWrite(requestItems);
};

// PartitionKey: owner
// SortKey: TOOL#client_id
module.exports.putTools = async function(owner, bodydata){
  /*
  let partitionKey = PARTITION;
  let sortKey = PREFIX + clientId;
  let baseItem = {
    'tool': {
      'client_id': clientId,
      'deployment_id': deploymentId,
      'attributes': body,
    }
  };
  let putPromise = putItem(partitionKey, sortKey, TOOLCONF, baseItem);
  return putPromise;
  */
  let requestList = [];
  let element;
  let putRequest;
  let baseItem;
  for (let index = 0; index < bodydata.length; index++) {
    element = bodydata[index];
    if(element.id){
      clientId = strPreProcess(owner) + '.' + element.id;
    } else {
      clientId = strPreProcess(owner + '-' + element.name);
    }
    deploymentId = uuidv4();
    baseItem = {
      'tool': {
        'client_id': clientId,
        'deployment_id': deploymentId,
        'attributes': element,
      }
    };
    putRequest = createBatchRequest("PutRequest", PARTITION, PREFIX+clientId, TOOLCONF, baseItem);
    requestList.push(putRequest);
  }
  let requestItems = {[TOOLCONF.tableName]: requestList};
  return batchWrite(requestItems);

};

module.exports.getTools = async function(){
  let partitionKey = PARTITION;
  let sortKeyBeginsWith = PREFIX;
  let result = await queryByPartitionKeyAndSortKeyBeginsWith(partitionKey, sortKeyBeginsWith, TOOLCONF);
  let tools = prepareToolList(result.Items);
  return tools;
};

module.exports.getTool = async function(clientId){
  let sortKey = PREFIX + clientId;
  let result = await getItemByPartitionAndSortKey(PARTITION, sortKey, TOOLCONF);
  let item = result.Item;
  if (item){
    return item.tool;
  }else{
    return result;
  }
};

module.exports.getAllowList = async function(organizationID){
  let result = await getItemByPartitionAndSortKey(organizationID, 'ORGANIZATION', TOOLCONF);
  let item = result.Item;
  if(process.env.STAGE === 'dev'){
    console.log('organizationID:', organizationID);
    console.log('getAllowList result:', result);
  }
  if (item){
    let organizationAllow = {
      id: organizationID,
      allow: item.Allow
    };
    return organizationAllow;
  }else{
    return result;
  }
};