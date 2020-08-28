#!/usr/bin/env node
import { PersistenceStack } from '../lib/persistence-stack';
import * as cdk from '@aws-cdk/core';
import { InfrastructureStack } from '../lib/infrastructure-stack';

const environment = { account: undefined, region: 'eu-central-1' };

const appName = 'slack-app-with-aws-serverless';
const slackKeyParameterName = `/config/${appName}/slack-key`;

const app = new cdk.App();
const persistenceStack = new PersistenceStack(app, `${appName}-persistence`, {
    env: environment,
    appName,
});
new InfrastructureStack(app, `${appName}-infrastructure`, {
    env: environment,
    appName,
    dynamoDbTable: persistenceStack.dynamoDbTable,
    slackKeyParameterName,
});
