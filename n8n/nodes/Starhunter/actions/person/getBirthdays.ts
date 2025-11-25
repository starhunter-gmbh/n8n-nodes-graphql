import {
	NodeApiError,
	type IDataObject,
	type IExecuteFunctions,
	type IHttpRequestOptions,
	type INodeProperties,
} from 'n8n-workflow';

export const description: INodeProperties[] = [
	{
		displayName: "Use Today's Date",
		name: 'useToday',
		type: 'boolean',
		default: true,
		description: "Whether to use today's date for the birthday search",
		displayOptions: {
			show: {
				resource: ['person'],
				operation: ['getBirthdays'],
			},
		},
	},
	{
		displayName: 'Date',
		name: 'date',
		type: 'string',
		default: '',
		placeholder: 'MM-DD (e.g., 11-25)',
		description: 'The date to search for birthdays (format: MM-DD)',
		displayOptions: {
			show: {
				resource: ['person'],
				operation: ['getBirthdays'],
				useToday: [false],
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
				resource: ['person'],
				operation: ['getBirthdays'],
			},
		},
	},
];

function getTodayMMDD(): string {
	const now = new Date();
	const month = String(now.getMonth() + 1).padStart(2, '0');
	const day = String(now.getDate()).padStart(2, '0');
	return `${month}-${day}`;
}

export async function execute(
	context: IExecuteFunctions,
	itemIndex: number,
	baseUrl: string,
): Promise<IDataObject[]> {
	const useToday = context.getNodeParameter('useToday', itemIndex) as boolean;
	const limit = context.getNodeParameter('limit', itemIndex) as number;

	let birthDate: string;
	if (useToday) {
		birthDate = getTodayMMDD();
	} else {
		birthDate = context.getNodeParameter('date', itemIndex) as string;
	}

	const query = /* GraphQL */ `
		query GetBirthdays($date: BirthDate, $limit: Int) {
			persons(birthDate: $date, limit: $limit) {
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
			}
		}
	`;

	const variables = { date: birthDate, limit };

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

	return response.data?.persons || [];
}
