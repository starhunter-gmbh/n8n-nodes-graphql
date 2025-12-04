import {
	NodeApiError,
	type IDataObject,
	type IExecuteFunctions,
	type IHttpRequestOptions,
	type INodeProperties,
} from 'n8n-workflow';

export const description: INodeProperties[] = [
	{
		displayName: 'Project ID',
		name: 'projectId',
		type: 'string',
		default: '',
		required: true,
		description: 'The ID of the project',
		displayOptions: {
			show: {
				resource: ['projectCandidate'],
				operation: ['add'],
			},
		},
	},
	{
		displayName: 'Candidate ID',
		name: 'candidateId',
		type: 'string',
		default: '',
		required: true,
		description: 'The ID of the candidate',
		displayOptions: {
			show: {
				resource: ['projectCandidate'],
				operation: ['add'],
			},
		},
	},
	{
		displayName: 'Status',
		name: 'status',
		type: 'string',
		default: '',
		description: 'Initial status for the project candidate',
		displayOptions: {
			show: {
				resource: ['projectCandidate'],
				operation: ['add'],
			},
		},
	},
];

export async function execute(
	context: IExecuteFunctions,
	itemIndex: number,
	baseUrl: string,
): Promise<IDataObject | null> {
	const projectId = context.getNodeParameter('projectId', itemIndex) as string;
	const candidateId = context.getNodeParameter('candidateId', itemIndex) as string;
	const status = context.getNodeParameter('status', itemIndex) as string;

	const query = /* GraphQL */ `
		mutation AddCandidateToProject(
			$projectId: Id!
			$candidateId: Id!
			$status: String
		) {
			addCandidateToProject(
				projectId: $projectId
				candidateId: $candidateId
				status: $status
			) {
				id
				status
				changeDate
				rejectionReason
			}
		}
	`;

	const variables: Record<string, string | undefined> = {
		projectId,
		candidateId,
		status: status || undefined,
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

	return response.data?.addCandidateToProject || null;
}
