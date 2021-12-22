// import { CognitoUserPoolTriggerHandler } from 'aws-lambda';

// export const handler: CognitoUserPoolTriggerHandler = async event => {
//     if (event.request.session &&
//         event.request.session.length >= 3 &&
//         event.request.session.slice(-1)[0].challengeResult === false) {
//         // The user provided a wrong answer 3 times; fail auth
//         event.response.issueTokens = false;
//         event.response.failAuthentication = true;
//     } else if (event.request.session &&
//         event.request.session.length &&
//         event.request.session.slice(-1)[0].challengeResult === true) {
//         // The user provided the right answer; succeed auth
//         event.response.issueTokens = true;
//         event.response.failAuthentication = false;
//     } else {
//         // The user did not provide a correct answer yet; present challenge
//         event.response.issueTokens = false;
//         event.response.failAuthentication = false;
//         event.response.challengeName = 'CUSTOM_CHALLENGE';
//     }

//     return event;
// };

exports.handler = (event, context, callback) => {
    // if (event.request.session.length == 1 && event.request.session[0].challengeName == 'SRP_A') {
    //     event.response.issueTokens = false;
    //     event.response.failAuthentication = false;
    //     event.response.challengeName = 'PASSWORD_VERIFIER';
    // } else if (event.request.session.length == 2 && event.request.session[1].challengeName == 'PASSWORD_VERIFIER' && event.request.session[1].challengeResult == true) {
    //     event.response.issueTokens = false;
    //     event.response.failAuthentication = false;
    //     event.response.challengeName = 'CUSTOM_CHALLENGE';
    // } else if (event.request.session.length == 3 && event.request.session[2].challengeName == 'CUSTOM_CHALLENGE' && event.request.session[2].challengeResult == true) {
    //     event.response.issueTokens = true;
    //     event.response.failAuthentication = false;
    // } else {
    //     event.response.issueTokens = false;
    //     event.response.failAuthentication = true;
    // }
    if (!event.request.session || event.request.session.length === 0) {
        // If we don't have a session or it is empty then send a CUSTOM_CHALLENGE
        event.response.challengeName = "CUSTOM_CHALLENGE";
        event.response.failAuthentication = false;
        event.response.issueTokens = false;
    } else if (event.request.session.length === 1 && event.request.session[0].challengeResult === true) {
        // If we passed the CUSTOM_CHALLENGE then issue token
        event.response.failAuthentication = false;
        event.response.issueTokens = true;
    } else {
        // Something is wrong. Fail authentication
        event.response.failAuthentication = true;
        event.response.issueTokens = false;
    }
    // Return to Amazon Cognito
    callback(null, event);
};

// exports.handler = async (event) => {
//     if (!event.request.session || event.request.session.length === 0) {
//         // If we don't have a session or it is empty then send a CUSTOM_CHALLENGE
//         event.response.challengeName = "CUSTOM_CHALLENGE";
//         event.response.failAuthentication = false;
//         event.response.issueTokens = false;
//     } else if (event.request.session.length === 1 && event.request.session[0].challengeResult === true) {
//         // If we passed the CUSTOM_CHALLENGE then issue token
//         event.response.failAuthentication = false;
//         event.response.issueTokens = true;
//     } else {
//         // Something is wrong. Fail authentication
//         event.response.failAuthentication = true;
//         event.response.issueTokens = false;
//     }
//     return event;
// };