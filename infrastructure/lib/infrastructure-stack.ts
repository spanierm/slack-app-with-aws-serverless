import * as apiGatewayV2 from '@aws-cdk/aws-apigatewayv2';
import * as dynamoDb from '@aws-cdk/aws-dynamodb';
import * as iam from '@aws-cdk/aws-iam';
import * as lambda from '@aws-cdk/aws-lambda';
import * as logs from '@aws-cdk/aws-logs';
import * as cdk from '@aws-cdk/core';
import { Duration } from '@aws-cdk/core';

interface InfrastructureStackProps extends cdk.StackProps {
    appName: string;
    dynamoDbTable: dynamoDb.ITable;
}

export class InfrastructureStack extends cdk.Stack {
    constructor(scope: cdk.Construct, id: string, props: InfrastructureStackProps) {
        super(scope, id, props);

        if (!props.env?.region) {
            throw new Error("No region explicitly provided. Define the region in the 'env' property of the stack.");
        }
        if (!props.env?.account) {
            throw new Error(
                "No account ID explicitly provided. Define the account ID in the 'env' property of the stack."
            );
        }

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
            timeout: Duration.seconds(10),
        });
        props.dynamoDbTable.grantReadWriteData(webhookLambda);
        webhookLambda.addToRolePolicy(
            new iam.PolicyStatement({
                actions: ['ssm:GetParameter'],
                resources: [
                    `arn:aws:ssm:${props.env?.region}:${props.env?.account}:parameter/config/${props.appName}/*`,
                ],
            })
        );

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
