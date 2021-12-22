'use strict';

var { SQS } = require('aws-sdk');
const config = require('../../config/apihub.conf.json');

// SQS Config:
let params;
let QUEUEPREFIX;
if (process.env.IS_OFFLINE){
  params = config.offline.sqs.config;
  QUEUEPREFIX = config.offline.sqs.queueprefix;
} else {
  params = config.development.sqs.config;
  // QUEUEPREFIX is undefined
}
// SQS Config: End

var queue = new SQS(params);

let queueAssuntoList = {'MainQueue':'MainQueue',
                        'LogQueue':'LogQueue',
                        'sisname.user':'Queuesisnameuser'};

var QueueList = [];

function initQueues(){
  var params = {
    QueueNamePrefix: ''
  };

  QueueList = [];

  queue.listQueues(params, function(err, data) {
    if (err){
      console.log(err, err.stack);
    }
    else{
      for (let queueIndex in data.QueueUrls){
        var queueUrl = data.QueueUrls[queueIndex];
        QueueList.push(queueUrl.substring(queueUrl.lastIndexOf('/') + 1));
      }
    }
  });
}

function getQueue(nomeAssunto){
  var filaUrl = '';
  var fila = queueAssuntoList[nomeAssunto];

  if (fila){
    filaUrl = [queue.endpoint.href, QUEUEPREFIX, fila].join('');
  };

  return filaUrl;
}

module.exports = {initQueues, getQueue, queue};
