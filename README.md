# API Hub Educacional Serverless

Hub Educacional API serverless implementation for Amazon Lambda.

## Summary
* [Environment Setup](#environment-setup)
    * [Setup AWS Credentials](#set-up-amazon-credentials)
* [Local Development](#local-development)
    * [Run Project Locally using Serverless Offline Plugin](#run-project-locally-using-serverless-offline-plugin)
    * [Debug](#debug)
    * [Testing](#testing)
* [Deploy Project to Amazon Lambda](#deploy-project-to-amazon-lambda)

## Environment Setup

1. **Install [Serverless Framework](https://github.com/serverless/serverless) via npm:**
```
npm install -g serverless
```
2. **Install dependencies:**
```
npm install
```
3. **Install Local DynamoDB:**
```
serverless dynamodb install
```

4. **Setup Credentials:**

Credentials are required to deploy in AWS. We found that `aws-sdk` **also require** credentials to be set, although `aws-sdk` doesn't require the access key and secret key to be valid, so you can set anything if you are using only offline.

Use the following command to setup credentials or refer to [Setup AWS Credentials](#set-up-amazon-credentials) for more details and alternatives. _Note:_ If you have an user setup in AWS, please, replace the Xs and Ys with your access key and secret key provided:

```
serverless config credentials --provider aws --key XXXXXXXXXXX --secret YYYYYYYYYYYYYYYYYYYYYYYYY
```

After credential setup you will be able to run serverless offline and if your credentials are valid, you will be able do deploy to AWS. Check [Local Development](#local-development) and [Deploy Project to Amazon Lambda](#deploy-project-to-amazon-lambda).

5. **(Optional - Local testing and development) Download elasticmq-server:**

**This item is optional.** Although for local development and testing we recommend installing ElasticMQ as it is used by API Sync. Without ElasticMQ running, some API Sync tests may fail.


For local tests and development we use [ElasticMQ](https://github.com/softwaremill/elasticmq) to emulate [Amazon Simple Queue Service (SQS)](https://aws.amazon.com/pt/sqs/) used in API Sync.

Go to [ElasticMQ GitHub](https://github.com/softwaremill/elasticmq) and download the `.jar` (standalone) server and put it in `dev-utils/elasticmq` directory as `dev-utils/elasticmq/elasticmq-server.jar`.

See [Local Development](#local-development).

*Note:* The `package.json` file is set to run `elasticmq-server.jar`. You need to rename the `elasticmq-server-<version>.jar` file.

### **Set-up Amazon Credentials:**

As stated before, credentials are required to deploy in AWS and to use `aws-sdk` locally. [Here](https://github.com/serverless/serverless/blob/master/docs/providers/aws/guide/credentials.md#amazon-web-services) is a detailed guide for Amazon Web Services Credentials setup. Below, we summarize the main alternatives to set credentials.

#### Setup Credentials

1. Set with environment variables:

Windows:
```
set AWS_ACCESS_KEY_ID=<your-key-here>
set AWS_SECRET_ACCESS_KEY=<your-secret-key-here>
```

2. Setup with [aws-cli](http://docs.aws.amazon.com/cli/latest/userguide/installing.html):

```
$ aws configure
AWS Access Key ID [None]: <your-key-here>
AWS Secret Access Key [None]: <your-secret-key-here>
Default region name [None]: us-west-2
Default output format [None]: ENTER
```

Or,

3. Setup with [serverless config credentials](https://serverless.com/framework/docs/providers/aws/guide/credentials#setup-with-serverless-config-credentials-command) command:

```
serverless config credentials --provider aws --key <access_key> --secret <secret_key>
```

When setting credentials with `aws-cli` or `serverless config credentials` your credentials will be saved to the following file: `%USERPROFILE%\.aws\credentials`.

It is recommended to check [this guide](https://github.com/serverless/serverless/blob/master/docs/providers/aws/guide/credentials.md#amazon-web-services) for more cases and configurations.

#### (DevOps) Create User

1. **Create IAM User** in Amazon Console.
2. Attach **_AdministratorAccess_** Policy for this user. (Note: This is NOT ideal for production deployment).
3. Copy the **API Key** & **Secret** to a temporary place.
4. Use keys to setup Credentials

## Local Development

### Run Project Locally using [Serverless Offline Plugin](https://github.com/dherault/serverless-offline)

1. **Run Serverless Offline:**
```
npm run start
```
or
```
serverless offline -s dev
```

2. **(for API Sync) Start ElasticMQ :**
```
npm run elasticmq
```

3. **Send commands to local serveless API:**
```
http://localhost:3000/
```

**IMPORTANT:** We are setting `private: true` to routes for simple API Key authentication method, so only identified clients/apps can make requests to our API. Serverless offline emulates this by generating a random API Key and printing it debug execution. To make a valid request you need to set `x-api-key: generatedToken` in request headers. You can also run serverless offline with `--apiKey <CUSTOM_TOKEN>` to set a custon token. Check [Serverless-offline/Token-authorizers](https://www.npmjs.com/package/serverless-offline#token-authorizers) documentation for more information.

### Debug

1. **Run Serverless Offline:**

Debug is integrated with _[Visual Studio Code](https://code.visualstudio.com/docs/editor/debugging)_. To debug execute the following command:

Windows:
```
npm run debug-win
```

### Testing

We set an test environment with [Mocha](https://mochajs.org/). Use:

```
npm run test
```
or (in project's root directory)
```
mocha
```

## Deploy Project to Amazon Lambda

Before deploy make sure you have your **AWS Credentials** setup. See [Environment Setup](#environment-setup).


### Deploy 

Whole project:
```
serverless deploy
```

Specific function:
```
serverless deploy function --function <function-name>
```
