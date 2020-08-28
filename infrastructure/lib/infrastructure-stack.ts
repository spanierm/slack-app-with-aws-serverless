import * as dynamoDb from '@aws-cdk/aws-dynamodb';
import * as lambda from '@aws-cdk/aws-lambda';
import * as logs from '@aws-cdk/aws-logs';
import * as cdk from '@aws-cdk/core';
import * as apiGateway from '@aws-cdk/aws-apigateway';
import { AuthorizationType } from '@aws-cdk/aws-apigateway';

interface InfrastructureStackProps extends cdk.StackProps {
    appName: string;
    dynamoDbTable: dynamoDb.ITable;
    slackKeyParameterName: string;
}

export class InfrastructureStack extends cdk.Stack {
    constructor(scope: cdk.Construct, id: string, props: InfrastructureStackProps) {
        super(scope, id, props);

        const webhookLambdaName = 'webhook-lambda';
        const webhookLambda = new lambda.Function(this, 'WebhookLambda', {
            runtime: lambda.Runtime.NODEJS_12_X,
            description: 'Webhook called by the Slack slash command',
            code: lambda.Code.fromAsset(`../src/${webhookLambdaName}`),
            handler: 'lambda.handler',
            functionName: `${props.appName}-${webhookLambdaName}`,
            logRetention: logs.RetentionDays.ONE_WEEK,
            environment: {
                TABLE_NAME: props.dynamoDbTable.tableName,
            },
        });
        props.dynamoDbTable.grantReadWriteData(webhookLambda);

        const authorizerLambdaName = 'authorizer-lambda';
        const authorizerLambda = new lambda.Function(this, 'AuthorizerLambda', {
            runtime: lambda.Runtime.NODEJS_12_X,
            description: 'Authorizer for Slack slash command',
            code: lambda.Code.fromAsset(`../src/${authorizerLambdaName}`),
            handler: 'lambda.handler',
            functionName: `${props.appName}-${authorizerLambdaName}`,
            logRetention: logs.RetentionDays.ONE_WEEK,
            environment: {
                TABLE_NAME: props.dynamoDbTable.tableName,
            },
        });

        // const authorizer = new apiGateway.RequestAuthorizer(this, 'Authorizer', {
        //     handler: authorizerLambda,
        //     identitySources: [
        //         apiGateway.IdentitySource.header('X-Slack-Signature'),
        //         apiGateway.IdentitySource.header('X-Slack-Request-Timestamp'),
        //     ],
        // });

        new apiGateway.LambdaRestApi(this, 'RestApi', {
            restApiName: 'slack-webhook',
            handler: webhookLambda,
            // defaultMethodOptions: {
            //     authorizationType: AuthorizationType.CUSTOM,
            //     authorizer,
            // },
        });
    }
}
