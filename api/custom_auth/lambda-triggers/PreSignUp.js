'user-strict';

const { putAccountProfile } = require('../../backend/backend-utils');

// HACK for Alvaro and Marcio tests. Remove!
const socialLoginMochObject= {
    "daniel.breves@gmail.com": {
        "matricula": "COD12710875",
        "instituicao": "69c7c52c-69ea-4464-8893-aed8a4423169"
    },
    "ealefpereira@gmail.com": {
        "matricula": "COD12548384",
        "instituicao": "ae6a1374-f444-11e9-b1fd-0666bf47f7c2"
    }
};

exports.handler = async (event, context) => {

    // autoConfirmUser and autoVerifyEmail user created by aplications for test purpose
    // Don't use in production
    // event.response.autoConfirmUser = true;
    // if (event.request.userAttributes.hasOwnProperty("email")) {
    //     event.response.autoVerifyEmail = true;
    // }

    // Console Event and Context in dev STAGE (Used for debug)
    if (process.env.STAGE === 'dev') {
        console.log('event:', event);
        console.log('context:', context);
    }


    if (event.triggerSource === 'PreSignUp_ExternalProvider'){
        // Create profile
        // event.request.userAttributes
        let userAttributes = event.request.userAttributes;
        let profile = {
            id: event.userName,
            attributes: {
                nomecompleto: userAttributes.name,
                email: userAttributes.email,
                papeis: ['ExternalProviderLogin'],
                picture: userAttributes.picture,
                ...socialLoginMochObject[userAttributes.email] // HACK for Alvaro and Marcio tests. Remove!
            }
        };

        try {
            await putAccountProfile(profile);
        } catch (error) {
            console.error('User Profile from ExternalProfile account not created!');
            console.error(error);
        }

    }
    /**
    "attributes": {
        "email": "freeman@blackmesa.com",
        "nomecompleto": "Gordon Freeman",
        "genero": "m",
        "papeis": [
            "Scientist"
        ]
    },
     */

    // Comments related to example implementation.
    // This example validates e-mail domain.
    // Set the user pool autoConfirmUser flag after validating the email domain
    // // Split the email address so we can compare domains
    // var address = event.request.userAttributes.email.split("@");

    // // This example uses a custom attribute "custom:domain"
    // if (event.request.userAttributes.hasOwnProperty("custom:domain")) {
    //     if ( event.request.userAttributes['custom:domain'] === address[1]) {
    //         event.response.autoConfirmUser = true;
    //     }
    // }

    // Return to Amazon Cognito
    return event;
};