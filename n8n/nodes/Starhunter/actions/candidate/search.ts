import {
	NodeApiError,
	type IDataObject,
	type IExecuteFunctions,
	type IHttpRequestOptions,
	type INodeProperties,
} from 'n8n-workflow';

export const description: INodeProperties[] = [
	{
		displayName: 'Candidate ID',
		name: 'candidateId',
		type: 'string',
		default: '',
		description: 'Search by specific candidate ID',
		displayOptions: {
			show: {
				resource: ['candidate'],
				operation: ['search'],
			},
		},
	},
	{
		displayName: 'Name',
		name: 'name',
		type: 'string',
		default: '',
		description: 'Search by candidate name (partial match)',
		displayOptions: {
			show: {
				resource: ['candidate'],
				operation: ['search'],
			},
		},
	},
	{
		displayName: 'Birth Date',
		name: 'birthDate',
		type: 'string',
		default: '',
		placeholder: 'MM-DD (e.g., 11-25)',
		description: 'Filter by birth date (format: MM-DD)',
		displayOptions: {
			show: {
				resource: ['candidate'],
				operation: ['search'],
			},
		},
	},
	{
		displayName: 'Limit',
		name: 'limit',
		type: 'number',
		default: 50,
		description: 'Max number of results to return',
		typeOptions: {
			minValue: 1,
			maxValue: 1000,
		},
		displayOptions: {
			show: {
				resource: ['candidate'],
				operation: ['search'],
			},
		},
	},
	{
		displayName: 'Offset',
		name: 'offset',
		type: 'number',
		default: 0,
		description: 'Number of results to skip for pagination',
		typeOptions: {
			minValue: 0,
		},
		displayOptions: {
			show: {
				resource: ['candidate'],
				operation: ['search'],
			},
		},
	},
];

export async function execute(
	context: IExecuteFunctions,
	itemIndex: number,
	baseUrl: string,
): Promise<IDataObject[]> {
	const candidateId = context.getNodeParameter('candidateId', itemIndex) as string;
	const name = context.getNodeParameter('name', itemIndex) as string;
	const birthDate = context.getNodeParameter('birthDate', itemIndex) as string;
	const limit = context.getNodeParameter('limit', itemIndex) as number;
	const offset = context.getNodeParameter('offset', itemIndex) as number;

	const query = /* GraphQL */ `
		query SearchCandidates($candidateId: Id, $birthDate: BirthDate, $name: String, $limit: Int, $offset: Int) {
			candidate(candidateId: $candidateId, birthDate: $birthDate, name: $name, limit: $limit, offset: $offset) {
				id
				name
				firstName
				secondName
				middleName
				academicTitle
				salutation
				email
				birthDate
				phone
				functions
				address
				createdAt
				updatedAt
				contactHistory {
					title
					type
					date
				}
			}
		}
	`;

	const variables = {
		candidateId: candidateId || undefined,
		name: name || undefined,
		birthDate: birthDate || undefined,
		limit,
		offset,
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

	return response.data?.candidate || [];
}
