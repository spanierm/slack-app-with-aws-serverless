import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { isValidSignature } from './slack-authorization';
import { SSM } from 'aws-sdk';

const appName = 'slack-app-with-aws-serverless';

const UNAUTHORIZED_RESPONSE: APIGatewayProxyResult = {
    statusCode: 401,
    body: '',
};

const FORBIDDEN_RESPONSE: APIGatewayProxyResult = {
    statusCode: 403,
    body: '',
};

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const slackSigningSecret = await getSsmParameter('slack-signing-secret');
    const timestamp = getHeaderCaseInsensitively(event.headers, 'X-Slack-Request-Timestamp');
    const signature = getHeaderCaseInsensitively(event.headers, 'X-Slack-Signature');
    const content = event.body;
    // TODO What if the request is not bae64-encoded, see https://docs.aws.amazon.com/apigateway/latest/developerguide/api-gateway-payload-encodings-workflow.html for REST APIs bu what about HTTP APIs?
    // const isBase65Encoded = event.isBase64Encoded
    if (!timestamp || !signature || !content) {
        return UNAUTHORIZED_RESPONSE;
    }
    if (!isValidSignature(slackSigningSecret, timestamp, content, signature)) {
        return FORBIDDEN_RESPONSE;
    }
    return {
        statusCode: 200,
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(event, null, 2),
    };
};

const ssm = new SSM();

const getSsmParameter = async (name: string): Promise<string> => {
    let parameterName = `/config/${appName}/${name}`;
    const response = await ssm
        .getParameter({
            Name: parameterName,
            WithDecryption: true,
        })
        .promise();
    if (!response.Parameter) {
        throw new Error(
            `There is no parameter with name ${parameterName}. Please add the parameter manually to the AWS Systems Manager Parameter Store.`
        );
    }
    return response.Parameter?.Value!;
};

const getHeaderCaseInsensitively = (headers: { [name: string]: string }, headerName: string): string | undefined => {
    const matchingHeaderName = Object.keys(headers).find((header) => header.toLowerCase() === headerName.toLowerCase());
    if (matchingHeaderName) {
        return headers[matchingHeaderName];
    } else {
        return undefined;
    }
};
