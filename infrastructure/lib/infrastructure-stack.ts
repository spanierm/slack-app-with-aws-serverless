import * as dynamoDb from '@aws-cdk/aws-dynamodb';
import * as lambda from '@aws-cdk/aws-lambda';
import * as logs from '@aws-cdk/aws-logs';
import * as cdk from '@aws-cdk/core';
import * as apiGateway from '@aws-cdk/aws-apigateway';

interface InfrastructureStackProps extends cdk.StackProps {
    appName: string;
    dynamoDbTable: dynamoDb.ITable;
    slackKeyParameterName: string;
}

export class InfrastructureStack extends cdk.Stack {
    constructor(scope: cdk.Construct, id: string, props: InfrastructureStackProps) {
        super(scope, id, props);

        const lambdaType: LambdaType = typeScriptLambda;
        const webhookLambdaName = 'webhook-lambda';

        const webhookLambda = new lambda.Function(this, 'WebhookLambda', {
            runtime: lambdaType.runtime,
            description: `(${lambdaType.language}) Webhook called by the Slack slash command`,
            code: lambda.Code.fromAsset(`${lambdaType.localLocation}/${webhookLambdaName}`),
            handler: 'lambda.handler',
            functionName: `${props.appName}-${webhookLambdaName}-${lambdaType.language}`,
            logRetention: logs.RetentionDays.ONE_WEEK,
            environment: {
                TABLE_NAME: props.dynamoDbTable.tableName,
            },
        });
        props.dynamoDbTable.grantReadWriteData(webhookLambda);

        const restApi = new apiGateway.LambdaRestApi(this, 'RestApi', {
            proxy: false,
            restApiName: 'slack-webhook',
            handler: webhookLambda,
        });
        restApi.root
            .addResource(lambdaType.language.toLowerCase())
            .addMethod('POST', new apiGateway.LambdaIntegration(webhookLambda));
    }
}

interface LambdaType {
    language: string;
    runtime: lambda.Runtime;
    localLocation: string;
}

const typeScriptLambda: LambdaType = {
    language: 'TypeScript',
    runtime: lambda.Runtime.NODEJS_12_X,
    localLocation: '../src/typescript',
};
