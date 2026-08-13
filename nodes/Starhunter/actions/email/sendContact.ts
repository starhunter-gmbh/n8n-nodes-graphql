import type { IDataObject, IExecuteFunctions, INodeProperties } from 'n8n-workflow';

import { showFor } from '../../helpers/displayOptions';
import { splitList, starhunterGraphqlRequest } from '../../transport/graphql';

export const description: INodeProperties[] = [
	{
		displayName: 'Target ID',
		name: 'targetId',
		type: 'string',
		default: '',
		required: true,
		description:
			'ID of the entity the email belongs to, e.g. a candidate, a company or a project. The activity is linked to that record.',
		displayOptions: showFor('email', 'sendContact'),
	},
	{
		displayName: 'To Addresses',
		name: 'toAddresses',
		type: 'string',
		default: '',
		placeholder: 'name@email.com, second@email.com',
		description:
			'Comma separated list of recipient addresses. Leave empty to resolve the addresses from the target entity.',
		displayOptions: showFor('email', 'sendContact'),
	},
	{
		displayName: 'Subject',
		name: 'subject',
		type: 'string',
		default: '',
		required: true,
		description: 'Subject line of the email',
		displayOptions: showFor('email', 'sendContact'),
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
		displayOptions: showFor('email', 'sendContact'),
	},
];

export async function execute(
	context: IExecuteFunctions,
	itemIndex: number,
	baseUrl: string,
): Promise<IDataObject> {
	const targetId = context.getNodeParameter('targetId', itemIndex) as string;
	const toAddresses = context.getNodeParameter('toAddresses', itemIndex) as string;
	const subject = context.getNodeParameter('subject', itemIndex) as string;
	const body = context.getNodeParameter('body', itemIndex) as string;

	const query = /* GraphQL */ `
		mutation SendContactEmail($targetId: Id!, $to: [String!], $subject: String!, $body: String!) {
			sendContactEmail(targetId: $targetId, to: $to, subject: $subject, body: $body)
		}
	`;

	const variables: IDataObject = {
		targetId,
		to: toAddresses ? splitList(toAddresses) : undefined,
		subject,
		body,
	};

	const data = await starhunterGraphqlRequest(context, baseUrl, query, variables);

	return {
		success: data.sendContactEmail ?? false,
		targetId,
		subject,
	};
}
