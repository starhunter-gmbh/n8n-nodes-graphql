import {
	NodeApiError,
	type IDataObject,
	type IExecuteFunctions,
	type IHttpRequestOptions,
	type INodeProperties,
} from 'n8n-workflow';

export const description: INodeProperties[] = [
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

export async function execute(
	context: IExecuteFunctions,
	itemIndex: number,
	baseUrl: string,
): Promise<IDataObject> {
	const from = context.getNodeParameter('from', itemIndex) as string;
	const to = context.getNodeParameter('to', itemIndex) as string;
	const subject = context.getNodeParameter('subject', itemIndex) as string;
	const body = context.getNodeParameter('body', itemIndex) as string;

	const query = /* GraphQL */ `
		mutation LogEmail($from: String!, $to: String!, $subject: String!, $body: String!) {
			logEmail(from: $from, to: $to, subject: $subject, body: $body)
		}
	`;

	const variables = { from, to, subject, body };

	const requestOptions: IHttpRequestOptions = {
		method: 'POST',
		url: baseUrl,
		body: { query, variables },
		headers: {
			'Content-Type': 'application/json',
			Accept: 'application/json',
		},
		json: true,
	};

	const response = await context.helpers.httpRequestWithAuthentication.call(
		context,
		'starhunterApi',
		requestOptions,
	);

	if (response.errors?.length) {
		throw new NodeApiError(context.getNode(), response, {
			message: response.errors.map((e: { message: string }) => e.message).join(', '),
		});
	}

	return {
		success: response.data?.logEmail ?? false,
		from,
		to,
		subject,
	};
}
