const corsHeaders = {
  "Access-Control-Allow-Origin" : "*", 
  "Access-Control-Allow-Credentials" : true
};

module.exports.ErrorResponse = function(err, identifier = ''){
  console.error(`---Error---\n---${identifier}---`);
  console.error(err);
  console.error(`---${identifier}---\n---End Error---`);
  const response = {
    statusCode: err.statusCode || 500,
    headers: {
      ...corsHeaders,
    },
    body: JSON.stringify({
      message: err.message,
    }),
  };
  return response;
};

module.exports.RawResponse = function(statusCode, rawMessageBody, customHeaders = {}){
  const response = {
    statusCode: statusCode,
    headers: {
      ...corsHeaders,
      ...customHeaders,
    },
    body: rawMessageBody,
  };
  return response;
};

module.exports.Response = function(statusCode, messageBody, customHeaders = {}){
  return module.exports.RawResponse(statusCode, JSON.stringify(messageBody), customHeaders);
};

module.exports.Redirect = function(location){
  return module.exports.Response(301, undefined, customHeaders = {Location: location});
};

module.exports.DefaultResponse = function(){
  return module.exports.Response(400, {message: "Couldn't process!"});
};