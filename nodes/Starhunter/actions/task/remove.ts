import type { IDataObject, IExecuteFunctions, INodeProperties } from 'n8n-workflow';

import { showFor } from '../../helpers/displayOptions';
import { starhunterGraphqlRequest } from '../../transport/graphql';

export const description: INodeProperties[] = [
	{
		displayName: 'Task ID',
		name: 'taskId',
		type: 'string',
		default: '',
		required: true,
		description: 'ID of the task to delete',
		displayOptions: showFor('task', 'delete'),
	},
];

export async function execute(
	context: IExecuteFunctions,
	itemIndex: number,
	baseUrl: string,
): Promise<IDataObject> {
	const taskId = context.getNodeParameter('taskId', itemIndex) as string;

	const query = /* GraphQL */ `
		mutation TaskDelete($input: TaskDeleteInput!) {
			taskDelete(input: $input)
		}
	`;

	const data = await starhunterGraphqlRequest(context, baseUrl, query, {
		input: { id: taskId },
	});

	return {
		success: data.taskDelete ?? false,
		id: taskId,
	};
}
