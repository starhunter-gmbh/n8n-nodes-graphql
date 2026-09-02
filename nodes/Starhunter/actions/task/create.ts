import type { IDataObject, IExecuteFunctions, INodeProperties } from 'n8n-workflow';

import { TASK_FIELDS } from '../../transport/fragments';
import { normalizeDates } from '../../helpers/dates';
import { compactInput, starhunterGraphqlRequest } from '../../transport/graphql';

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
	const input: IDataObject = {
		title: context.getNodeParameter('title', itemIndex) as string,
		...normalizeDates(
			context,
			itemIndex,
			compactInput({
				description: context.getNodeParameter('taskDescription', itemIndex) as string,
				deadline: context.getNodeParameter('deadline', itemIndex) as string,
				assignee: context.getNodeParameter('assignee', itemIndex) as string,
				target: context.getNodeParameter('target', itemIndex) as string,
			}),
			{ date: ['deadline'] },
		),
	};

	const query = /* GraphQL */ `
		mutation TaskCreate($input: TaskCreateInput!) {
			taskCreate(input: $input) {
				${TASK_FIELDS}
			}
		}
	`;

	const data = await starhunterGraphqlRequest(context, baseUrl, query, { input });

	return (data.taskCreate as IDataObject) ?? null;
}
