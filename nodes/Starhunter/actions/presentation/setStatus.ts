import type { IDataObject, IExecuteFunctions, INodeProperties } from 'n8n-workflow';

import { showFor } from '../../helpers/displayOptions';
import { compactInput, starhunterGraphqlRequest } from '../../transport/graphql';

export const description: INodeProperties[] = [
	{
		displayName: 'Presentation ID',
		name: 'presentationId',
		type: 'string',
		default: '',
		required: true,
		description: 'ID of the presentation to update',
		displayOptions: showFor('presentation', 'setStatus'),
	},
	{
		displayName: 'Status',
		name: 'status',
		type: 'options',
		typeOptions: {
			loadOptionsMethod: 'getPresentationStatuses',
		},
		default: '',
		required: true,
		description:
			'New status. The values are read from the connected instance, whose presentation status options are customer-specific. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
		displayOptions: showFor('presentation', 'setStatus'),
	},
	{
		displayName: 'Comment',
		name: 'comment',
		type: 'string',
		typeOptions: {
			rows: 3,
		},
		default: '',
		description: 'Comment written to the status history entry',
		displayOptions: showFor('presentation', 'setStatus'),
	},
];

export async function execute(
	context: IExecuteFunctions,
	itemIndex: number,
	baseUrl: string,
): Promise<IDataObject | null> {
	const input: IDataObject = {
		presentationId: context.getNodeParameter('presentationId', itemIndex) as string,
		status: context.getNodeParameter('status', itemIndex) as string,
		...compactInput({
			comment: context.getNodeParameter('comment', itemIndex) as string,
		}),
	};

	const query = /* GraphQL */ `
		mutation PresentationSetStatus($input: PresentationSetStatusInput!) {
			presentationSetStatus(input: $input) {
				presentationId
				status
				changedAt
			}
		}
	`;

	const data = await starhunterGraphqlRequest(context, baseUrl, query, { input });

	return (data.presentationSetStatus as IDataObject) ?? null;
}
