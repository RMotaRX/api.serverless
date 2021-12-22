'use strict';

var {docClient} = require("./connection");

module.exports.getItemByPartitionAndSortKey = async function(partitionKey, sortKey, tableConf){
  var params = {
    TableName: tableConf.tableName,
    Key: {
			[tableConf.pkName]: partitionKey,
			[tableConf.skName]: sortKey
    },
    ConsistentRead: true, // optional (true | false)
    ReturnConsumedCapacity: 'NONE', // optional (NONE | TOTAL | INDEXES)
  };
  return docClient.get(params).promise();
};

module.exports.queryByPartitionKey = async function(partitionKey, tableConf){
  var params = {
    TableName: tableConf.tableName,
    KeyConditionExpression: '#pk = :partitionKey',
    ExpressionAttributeNames: {
      '#pk': tableConf.pkName
    },
    ExpressionAttributeValues: {
      ':partitionKey': partitionKey
    },
  };
  return docClient.query(params).promise();
};

module.exports.queryByPartitionKeyAndSortKeyBeginsWith = async function(partitionKey, sortKeyBeginsWith, tableConf){
  var params = {
    TableName: tableConf.tableName,
    KeyConditionExpression: '#pk = :partitionKey AND begins_with(#sk, :sortKeyBeginsWith)',
    ExpressionAttributeNames: {
      '#pk': tableConf.pkName,
      '#sk': tableConf.skName,
    },
    ExpressionAttributeValues: {
      ':partitionKey': partitionKey,
      ':sortKeyBeginsWith': sortKeyBeginsWith
    },
  };
  return docClient.query(params).promise();
};

module.exports.queryBySortKeyIndex = async function(sortKey, tableConf){
  var params = {
    TableName: tableConf.tableName,
    IndexName: tableConf.indexName,
    KeyConditionExpression: '#sk = :sortKey',
    ExpressionAttributeNames: {
    	'#sk': tableConf.skName,
    },
    ExpressionAttributeValues: {
    	':sortKey': `${sortKey}`
    },
  };
  return docClient.query(params).promise();
};

module.exports.queryIndexByHashKeyValue = async function(hashKeyValue, tableConf){
  var params = {
    TableName: tableConf.tableName,
    IndexName: tableConf.indexName,
    KeyConditionExpression: '#hashKeyName = :hashKeyValue',
    ExpressionAttributeNames: {
    	'#hashKeyName': tableConf.hashKeyName,
    },
    ExpressionAttributeValues: {
    	':hashKeyValue': `${hashKeyValue}`
    },
  };
  return docClient.query(params).promise();
};

module.exports.putItem = async function(partitionKey, sortKey, tableConf, baseItem = {}){
	var params = {
		TableName: tableConf.tableName,
		Item: {
			...baseItem,
			[tableConf.pkName]: partitionKey,
			[tableConf.skName]: sortKey
    },
    // ConditionExpression: `attribute_not_exists(${tableConf.pkName}) and attribute_not_exists(${tableConf.skName})`,
    ReturnConsumedCapacity: 'NONE'
	};
	return docClient.put(params).promise();
};

module.exports.updateItem = async function(partitionKey, sortKey, tableConf, baseItem = {}){
	var params = {
		TableName: tableConf.tableName,
		Item: {
			...baseItem,
			[tableConf.pkName]: partitionKey,
			[tableConf.skName]: sortKey
    },
    ReturnConsumedCapacity: 'NONE'
	};
	return docClient.put(params).promise();
};

module.exports.deleteItem = async function(partitionKey, sortKey, tableConf){
	var params = {
		TableName: tableConf.tableName,
		Key: {
			[tableConf.pkName]: partitionKey,
			[tableConf.skName]: sortKey
		},
	};
	return docClient.delete(params);
};

module.exports.batchWrite = async function( requestItems ){
	var params = {
    RequestItems: requestItems,
    ReturnConsumedCapacity: 'NONE', // optional (NONE | TOTAL | INDEXES)
    ReturnItemCollectionMetrics: 'NONE', // optional (NONE | SIZE)
	};
  return docClient.batchWrite(params).promise();
};

module.exports.createBatchRequest = function(requestType, partitionKey, sortKey, tableConf, baseItem = {}){
  let batchRequest={
      [requestType]: {
        Item: {
          ...baseItem,
          [tableConf.pkName]: partitionKey,
          [tableConf.skName]: sortKey
        }
    }
  };
  return batchRequest;
};
