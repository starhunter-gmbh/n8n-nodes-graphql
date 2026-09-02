import type { IDataObject, IExecuteFunctions, INodeProperties } from 'n8n-workflow';

import { showFor } from '../../helpers/displayOptions';
import { TASK_FIELDS } from '../../transport/fragments';
import { normalizeDates } from '../../helpers/dates';
import { compactInput, starhunterGraphqlRequest } from '../../transport/graphql';

export const description: INodeProperties[] = [
	{
		displayName: 'Task ID',
		name: 'taskId',
		type: 'string',
		default: '',
		required: true,
		description: 'ID of the task to update',
		displayOptions: showFor('task', 'update'),
	},
	{
		displayName: 'Update Fields',
		name: 'updateFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		description: 'Fields of the task to update',
		displayOptions: showFor('task', 'update'),
		options: [
			{
				displayName: 'Deadline',
				name: 'deadline',
				type: 'dateTime',
				default: '',
				description: 'Deadline of the task',
			},
			{
				displayName: 'Description',
				name: 'description',
				type: 'string',
				typeOptions: {
					rows: 4,
				},
				default: '',
				description: 'Description of the task',
			},
			{
				displayName: 'Done',
				name: 'done',
				type: 'boolean',
				default: false,
				description: 'Whether the task is completed',
			},
			{
				displayName: 'Title',
				name: 'title',
				type: 'string',
				default: '',
				description: 'Title of the task',
			},
		],
	},
];

export async function execute(
	context: IExecuteFunctions,
	itemIndex: number,
	baseUrl: string,
): Promise<IDataObject | null> {
	const updateFields = context.getNodeParameter('updateFields', itemIndex, {}) as IDataObject;

	const input: IDataObject = {
		id: context.getNodeParameter('taskId', itemIndex) as string,
		...normalizeDates(
			context,
			itemIndex,
			compactInput({
				...updateFields,
			}),
			{ date: ['deadline'] },
		),
	};

	const query = /* GraphQL */ `
		mutation TaskUpdate($input: TaskUpdateInput!) {
			taskUpdate(input: $input) {
				${TASK_FIELDS}
			}
		}
	`;

	const data = await starhunterGraphqlRequest(context, baseUrl, query, { input });

	return (data.taskUpdate as IDataObject) ?? null;
}
