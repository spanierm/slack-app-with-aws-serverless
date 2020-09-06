#!/usr/bin/env node
import { PersistenceStack } from '../lib/persistence-stack';
import * as cdk from '@aws-cdk/core';
import { InfrastructureStack } from '../lib/infrastructure-stack';

// TODO Set your account ID and region here.
const environment = { account: '', region: 'eu-central-1' };

const appName = 'slack-app-with-aws-serverless';

const app = new cdk.App();
const persistenceStack = new PersistenceStack(app, `${appName}-persistence`, {
    env: environment,
    appName,
});
new InfrastructureStack(app, `${appName}-infrastructure`, {
    env: environment,
    appName,
    dynamoDbTable: persistenceStack.dynamoDbTable,
});
