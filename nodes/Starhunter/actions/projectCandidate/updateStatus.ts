import {
	NodeApiError,
	type IDataObject,
	type IExecuteFunctions,
	type IHttpRequestOptions,
	type INodeProperties,
} from 'n8n-workflow';

export const description: INodeProperties[] = [
	{
		displayName: 'Presentation ID',
		name: 'presentationId',
		type: 'string',
		default: '',
		required: true,
		description: 'The ID of the presentation',
		displayOptions: {
			show: {
				resource: ['projectCandidate'],
				operation: ['updateStatus'],
			},
		},
	},
	{
		displayName: 'Status',
		name: 'status',
		type: 'string',
		default: '',
		required: true,
		description: 'The new status value',
		displayOptions: {
			show: {
				resource: ['projectCandidate'],
				operation: ['updateStatus'],
			},
		},
	},
	{
		displayName: 'Comment',
		name: 'comment',
		type: 'string',
		typeOptions: {
			rows: 4,
		},
		default: '',
		description: 'Optional comment about the status change',
		displayOptions: {
			show: {
				resource: ['projectCandidate'],
				operation: ['updateStatus'],
			},
		},
	},
];

export async function execute(
	context: IExecuteFunctions,
	itemIndex: number,
	baseUrl: string,
): Promise<IDataObject | null> {
	const presentationId = context.getNodeParameter('presentationId', itemIndex) as string;
	const status = context.getNodeParameter('status', itemIndex) as string;
	const comment = context.getNodeParameter('comment', itemIndex) as string;

	const query = /* GraphQL */ `
		mutation UpdatePresentationStatus(
			$presentationId: Id!
			$status: String!
			$comment: String
		) {
			updatePresentationStatus(
				presentationId: $presentationId
				status: $status
				comment: $comment
			) {
				id
				status
				updatedAt
			}
		}
	`;

	const variables: Record<string, string | undefined> = {
		presentationId,
		status,
		comment: comment || undefined,
	};

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

	return response.data?.updatePresentationStatus || null;
}
