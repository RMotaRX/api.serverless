var { getItemByPartitionAndSortKey, createBatchRequest, queryByPartitionKeyAndSortKeyBeginsWith, batchWrite } = require("../../../../utils/dynamodb");
const uuidv4 = require('uuid/v4');
const config = require('../../../../config/apihub.conf.json');

const PREFIX = config.ltiv1p3.platform.settings.prefix;
const PARTITION = config.ltiv1p3.platform.settings.partition;

const LTITOOLCONF = config.dbconfig.singleTable[process.env.STAGE];

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
      "typ": tool.attributes.type,
      //"url": tool.attributes.LetsGoLaunchURL,
      "pfl": tool.attributes.LetsGoProfiles,
      //"lnt": tool.attributes.LetsGoLaunchType,
      //"red": tool.attributes.LetsGoRedirectUrl,
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

// PartitionKey: owner
// SortKey: LTITOOL#v1.3#client_id
module.exports.putLTITools = async function(owner, bodydata){
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
  let putPromise = putItem(partitionKey, sortKey, LTITOOLCONF, baseItem);
  return putPromise;
  */
  let requestList = [];
  let element;
  let putRequest;
  let baseItem;
  for (let index = 0; index < bodydata.length; index++) {
    element = bodydata[index];
    clientId = strPreProcess(owner + '-' + element.name);
    deploymentId = uuidv4();
    baseItem = {
      'tool': {
        'client_id': clientId,
        'deployment_id': deploymentId,
        'attributes': element,
      }
    };
    putRequest = createBatchRequest("PutRequest", PARTITION, PREFIX+clientId, LTITOOLCONF, baseItem);
    requestList.push(putRequest);
  }
  let requestItems = {[LTITOOLCONF.tableName]: requestList};
  return batchWrite(requestItems);

};

module.exports.getLTITools = async function(){
  let partitionKey = PARTITION;
  let sortKeyBeginsWith = PREFIX;
  let result = await queryByPartitionKeyAndSortKeyBeginsWith(partitionKey, sortKeyBeginsWith, LTITOOLCONF);
  let tools = prepareToolList(result.Items);
  return tools;
};

module.exports.getLTITool = async function(clientId){
  let sortKey = PREFIX + clientId;
  let result = await getItemByPartitionAndSortKey(PARTITION, sortKey, LTITOOLCONF);
  let item = result.Item;
  if (item){
    return item.tool;
  }else{
    return result;
  }
};