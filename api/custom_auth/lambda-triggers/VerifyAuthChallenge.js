const {customLoginSortKey} = require('../custom_auth-utils.js');

// import { CognitoUserPoolTriggerHandler } from 'aws-lambda';

// export const handler: CognitoUserPoolTriggerHandler = async event => {
//     const expectedAnswer = event.request.privateChallengeParameters!.secretLoginCode; 
//     if (event.request.challengeAnswer === expectedAnswer) {
//         event.response.answerCorrect = true;
//     } else {
//         event.response.answerCorrect = false;
//     }
//     return event;
// };

exports.handler = (event, context, callback) => {
    let userAnswer = JSON.parse(event.request.challengeAnswer);
    let password = userAnswer.password;
    let type = userAnswer.type;

    let answers = JSON.parse(event.request.privateChallengeParameters.answer);
    console.log(`[LOG] Answers: ${event.request.privateChallengeParameters.answer}`);

    let key = customLoginSortKey(password, type);
    if (answers.indexOf(key) > -1) { //Search key in answers
        event.response.answerCorrect = true;
    } else {
        event.response.answerCorrect = false;
    }
    callback(null, event);
};