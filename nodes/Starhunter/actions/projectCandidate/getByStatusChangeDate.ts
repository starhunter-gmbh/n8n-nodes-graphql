import {
	NodeApiError,
	type IDataObject,
	type IExecuteFunctions,
	type IHttpRequestOptions,
	type INodeProperties,
} from 'n8n-workflow';

export const description: INodeProperties[] = [
	{
		displayName: 'Status',
		name: 'status',
		type: 'string',
		default: '',
		required: true,
		placeholder: 'e.g., Ident',
		description: 'The candidate status to filter by',
		displayOptions: {
			show: {
				resource: ['projectCandidate'],
				operation: ['getByStatusChangeDate'],
			},
		},
	},
	{
		displayName: 'Days Ago',
		name: 'daysAgo',
		type: 'number',
		default: 7,
		required: true,
		description: 'Number of days ago the status change should have occurred',
		typeOptions: {
			minValue: 0,
		},
		displayOptions: {
			show: {
				resource: ['projectCandidate'],
				operation: ['getByStatusChangeDate'],
			},
		},
	},
];

function getDateXDaysAgo(days: number): string {
	const date = new Date();
	date.setDate(date.getDate() - days);
	return date.toISOString().substring(0, 10);
}

export async function execute(
	context: IExecuteFunctions,
	itemIndex: number,
	baseUrl: string,
): Promise<IDataObject[]> {
	const status = context.getNodeParameter('status', itemIndex) as string;
	const daysAgo = context.getNodeParameter('daysAgo', itemIndex) as number;

	const targetDate = getDateXDaysAgo(daysAgo);

	const query = /* GraphQL */ `
		query getStatuses($status: String) {
			projectCandidates(status: $status) {
				status
				rejectionReason
				changeDate
				person {
					id
					firstName
					secondName
					name
					email
				}
			}
		}
	`;

	const variables = { status };

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

	const candidates: IDataObject[] = response.data?.projectCandidates || [];

	// Filter candidates whose changeDate matches the target date
	return candidates.filter((candidate) => {
		const changeDate = candidate.changeDate as string | undefined;
		if (!changeDate) return false;
		return new Date(changeDate).toISOString().substring(0, 10) === targetDate;
	}).map(candidate => ({...candidate, daysAgo}));
}
