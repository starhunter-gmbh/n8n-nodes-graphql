"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.description = void 0;
exports.execute = execute;
const n8n_workflow_1 = require("n8n-workflow");
exports.description = [
    {
        displayName: 'From',
        name: 'from',
        type: 'string',
        default: '',
        required: true,
        placeholder: 'sender@example.com',
        description: 'Email address of the sender',
        displayOptions: {
            show: {
                resource: ['email'],
                operation: ['log'],
            },
        },
    },
    {
        displayName: 'To',
        name: 'to',
        type: 'string',
        default: '',
        required: true,
        placeholder: 'recipient@example.com',
        description: 'Email address of the recipient',
        displayOptions: {
            show: {
                resource: ['email'],
                operation: ['log'],
            },
        },
    },
    {
        displayName: 'Subject',
        name: 'subject',
        type: 'string',
        default: '',
        required: true,
        description: 'Subject line of the email',
        displayOptions: {
            show: {
                resource: ['email'],
                operation: ['log'],
            },
        },
    },
    {
        displayName: 'Body',
        name: 'body',
        type: 'string',
        typeOptions: {
            rows: 6,
        },
        default: '',
        required: true,
        description: 'Body content of the email',
        displayOptions: {
            show: {
                resource: ['email'],
                operation: ['log'],
            },
        },
    },
];
async function execute(context, itemIndex, baseUrl) {
    var _a, _b, _c;
    const from = context.getNodeParameter('from', itemIndex);
    const to = context.getNodeParameter('to', itemIndex);
    const subject = context.getNodeParameter('subject', itemIndex);
    const body = context.getNodeParameter('body', itemIndex);
    const query = `
		mutation LogEmail($from: String!, $to: String!, $subject: String!, $body: String!) {
			logEmail(from: $from, to: $to, subject: $subject, body: $body)
		}
	`;
    const variables = { from, to, subject, body };
    const requestOptions = {
        method: 'POST',
        url: baseUrl,
        body: { query, variables },
        headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
        },
        json: true,
    };
    const response = await context.helpers.httpRequestWithAuthentication.call(context, 'starhunterApi', requestOptions);
    if ((_a = response.errors) === null || _a === void 0 ? void 0 : _a.length) {
        throw new n8n_workflow_1.NodeApiError(context.getNode(), response, {
            message: response.errors.map((e) => e.message).join(', '),
        });
    }
    return {
        success: (_c = (_b = response.data) === null || _b === void 0 ? void 0 : _b.logEmail) !== null && _c !== void 0 ? _c : false,
        from,
        to,
        subject,
    };
}
//# sourceMappingURL=log.js.map