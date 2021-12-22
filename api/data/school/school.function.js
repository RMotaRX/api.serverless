'use strict';

// POST Functions
module.exports.postSchoolEndpoint = async (event, context, callback) => {

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

// PUT Functions

// DELETE Functions