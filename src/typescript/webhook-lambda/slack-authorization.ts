import * as crypto from 'crypto';

const SLACK_SIGNATURE_VERSION = 'v0';

export const isValidSignature = (
    slackAppSigningSecret: string,
    timestamp: string,
    encodedContent: string,
    signature: string
): boolean => {
    const decodedContent = Buffer.from(encodedContent, 'base64').toString();
    const expectedSignature = `${SLACK_SIGNATURE_VERSION}=${computeSha265Hash(
        slackAppSigningSecret,
        `${SLACK_SIGNATURE_VERSION}:${timestamp}:${decodedContent}`
    )}`;
    return signature === expectedSignature;
};

const computeSha265Hash = (secret: string, content: string): string => {
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(content);
    return hmac.digest('hex').toString();
};
