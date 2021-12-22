'use strict';
const { ErrorResponse, Response, DefaultResponse } = require('../../utils/response');
const { getAccountProfileRDS, putAccountProfiles, createProfilesAccount, setProfilesAccountPasswords } = require('./backend-utils');

// POST Functions
module.exports.postAccountProfiles = async (event, context) => {
  let body;
  try{
    body = JSON.parse(event.body);
  } catch (err){
    return ErrorResponse(err);
  }
  // let profile = {
  //   id: "[sub]", // Obrigatório
  //   parent: "[sub]", // Opcional
  //   profile: {  // Obrigatório
  //     "matricula": "[matricula]",
  //     "nomecompleto": "[Nome Completo]",
  //     "nascimento": "[Data de Nascimento]",
  //     "email": "[e-mail]",
  //     "cpf": "[CPF]",
  //     "celular": "[Celular]",
  //     "genero": "[Gênero]",
  //     "papeis": ["Papel"]
  //   }
  // };

  // Create Account Using Cognito-Hub
  // let createProfilesAccountPromise;
  // createProfilesAccountPromise = createProfilesAccount(body.profiles);
  // let profilesToSave = body.profiles
  let accountCreationResults = await createProfilesAccount(body.profiles);

  let accountProfilesToSave = [];
  accountProfilesToSave.push(...accountCreationResults.created);

  // Filter UsernameExistsException
  let notCreated = accountCreationResults.notcreated;
  let filtred = notCreated.filter( profile => { return profile.code === "UsernameExistsException";});
  accountProfilesToSave.push(...filtred);
  // accountProfilesToSave.push(accountCreationResults.notcreated);

  let setProfilesAccountPasswordResults = await setProfilesAccountPasswords(accountProfilesToSave);

  let messageBody;
  if (accountProfilesToSave && Object.keys(accountProfilesToSave).length){
    let putAccountProfilesPromise;
    try{
      putAccountProfilesPromise = await putAccountProfiles(accountProfilesToSave);
    } catch (err) {
        let errorObject = {
          ...err.message,
          ...err.code,
          extra: {
            accountCreationResults
          }
        };
        return Response(err.err, errorObject);
    }
    messageBody = {
      accounts: accountCreationResults,
      passwords: setProfilesAccountPasswordResults,
      profiles: {
        message: 'Registration done!',
        ...putAccountProfilesPromise
      }
    };
  } else {
    messageBody = {
      message: "Couldn't create any account!",
      result: accountCreationResults,
    };
  }
  return Response(200, messageBody);
};

// GET Functions
module.exports.getAccountProfiles = async (event, context) => {
  let claims;
  let tokenUUID;
  if (process.env.IS_OFFLINE && event.queryStringParameters && event.queryStringParameters.offlineUsername){
    tokenUUID = event.queryStringParameters.offlineUsername;
  } else {
    claims = event.requestContext.authorizer.claims;
    // tokenUUID = claims.sub;
    tokenUUID = claims["cognito:username"];

    // if (identities instanceof Array && groups.find( group => group === 'dev')) || groups === 'dev' )
    if (claims.identities){
      let identities;
      try {
        identities = JSON.parse(claims.identities);
      } catch (err) { // Local development
        if (err instanceof SyntaxError)
          identities = claims.identities[0];
        else
          identities = claims.identities;
      }
      console.log('identities:', identities);
      // socialIdentity = claims.identities.find( x => (x.providerType === 'Facebook' || x.providerType === 'Google'));
      // if ( (groups instanceof Array && groups.find( group => group === 'dev')) || groups === 'dev' ) {
      console.log('identities.providerType:', identities.providerType);
      if (identities.providerType === 'Facebook' || identities.providerType === 'Google' )
        tokenUUID = claims.email;
    }
    console.log('Choosen username:', tokenUUID);
  }

  let profiles;
  try {
    profiles = await getAccountProfileRDS(tokenUUID);
  } catch (err) {
    return ErrorResponse(err);
  }

  if (!profiles) {
    return Response(404, {message: 'Not found'});
  }

  let bodyMessage = {
    profiles
  };
  return Response(200, bodyMessage);
};