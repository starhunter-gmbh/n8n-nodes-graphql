import {
	NodeApiError,
	type IDataObject,
	type IExecuteFunctions,
	type IHttpRequestOptions,
	type INodeProperties,
} from 'n8n-workflow';

export const description: INodeProperties[] = [
	{
		displayName: 'Title',
		name: 'title',
		type: 'string',
		default: '',
		required: true,
		description: 'The title of the task',
		displayOptions: {
			show: {
				resource: ['task'],
				operation: ['create'],
			},
		},
	},
	{
		displayName: 'Description',
		name: 'taskDescription',
		type: 'string',
		typeOptions: {
			rows: 4,
		},
		default: '',
		description: 'The description of the task',
		displayOptions: {
			show: {
				resource: ['task'],
				operation: ['create'],
			},
		},
	},
	{
		displayName: 'Deadline',
		name: 'deadline',
		type: 'dateTime',
		default: '',
		description: 'The deadline for the task',
		displayOptions: {
			show: {
				resource: ['task'],
				operation: ['create'],
			},
		},
	},
	{
		displayName: 'Assignee ID',
		name: 'assignee',
		type: 'string',
		default: '',
		description: 'The ID of the person to assign the task to',
		displayOptions: {
			show: {
				resource: ['task'],
				operation: ['create'],
			},
		},
	},
	{
		displayName: 'Target ID',
		name: 'target',
		type: 'string',
		default: '',
		description: 'The ID of the target entity for the task',
		displayOptions: {
			show: {
				resource: ['task'],
				operation: ['create'],
			},
		},
	},
];

export async function execute(
	context: IExecuteFunctions,
	itemIndex: number,
	baseUrl: string,
): Promise<IDataObject | null> {
	const title = context.getNodeParameter('title', itemIndex) as string;
	const taskDescription = context.getNodeParameter('taskDescription', itemIndex) as string;
	const deadline = context.getNodeParameter('deadline', itemIndex) as string;
	const assignee = context.getNodeParameter('assignee', itemIndex) as string;
	const target = context.getNodeParameter('target', itemIndex) as string;

	const query = /* GraphQL */ `
		mutation CreateTask(
			$title: String!
			$description: String
			$deadline: Date
			$assignee: Id
			$target: Id
		) {
			createTask(
				title: $title
				description: $description
				deadline: $deadline
				assignee: $assignee
				target: $target
			) {
				id
				title
				description
				deadline
				assignee
			}
		}
	`;

	const variables: Record<string, string | undefined> = {
		title,
		description: taskDescription || undefined,
		deadline: deadline || undefined,
		assignee: assignee || undefined,
		target: target || undefined,
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

	return response.data?.createTask || null;
}
