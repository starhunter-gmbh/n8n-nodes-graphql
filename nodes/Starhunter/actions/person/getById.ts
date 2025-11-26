import {
	NodeApiError,
	type IDataObject,
	type IExecuteFunctions,
	type IHttpRequestOptions,
	type INodeProperties,
} from 'n8n-workflow';

export const description: INodeProperties[] = [
	{
		displayName: 'Person ID',
		name: 'personId',
		type: 'string',
		default: '',
		required: true,
		description: 'The ID of the person to retrieve',
		displayOptions: {
			show: {
				resource: ['person'],
				operation: ['getById'],
			},
		},
	},
];

export async function execute(
	context: IExecuteFunctions,
	itemIndex: number,
	baseUrl: string,
): Promise<IDataObject | null> {
	const personId = context.getNodeParameter('personId', itemIndex) as string;

	const query = /* GraphQL */ `
		query GetPerson($id: Id!) {
			person(id: $id) {
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

	const variables = { id: personId };

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

	return response.data?.person || null;
}
