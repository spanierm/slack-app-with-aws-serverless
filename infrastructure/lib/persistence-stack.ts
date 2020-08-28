import * as dynamoDb from '@aws-cdk/aws-dynamodb';
import * as cdk from '@aws-cdk/core';

export interface PersistenceStackProps extends cdk.StackProps {
    appName: string;
}

export class PersistenceStack extends cdk.Stack {
    readonly dynamoDbTable: dynamoDb.ITable;

    constructor(scope: cdk.Construct, id: string, props: PersistenceStackProps) {
        super(scope, id, props);

        this.dynamoDbTable = new dynamoDb.Table(this, `${props.appName}-DynamoDbTable`, {
            partitionKey: { name: 'userId', type: dynamoDb.AttributeType.STRING },
            billingMode: dynamoDb.BillingMode.PAY_PER_REQUEST,
            encryption: dynamoDb.TableEncryption.AWS_MANAGED,
            pointInTimeRecovery: true,
        });
    }
}
