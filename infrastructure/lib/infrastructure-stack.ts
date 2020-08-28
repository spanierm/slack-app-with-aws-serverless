import * as apiGatewayV2 from '@aws-cdk/aws-apigatewayv2';
import * as dynamoDb from '@aws-cdk/aws-dynamodb';
import * as lambda from '@aws-cdk/aws-lambda';
import * as logs from '@aws-cdk/aws-logs';
import * as cdk from '@aws-cdk/core';

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

        const httpApi = new apiGatewayV2.HttpApi(this, 'HttpApi', {
            apiName: 'slack-webhook',
        });
        httpApi.addRoutes({
            path: `/${lambdaType.language}`,
            methods: [apiGatewayV2.HttpMethod.POST],
            integration: new apiGatewayV2.LambdaProxyIntegration({
                handler: webhookLambda,
            }),
        });
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
