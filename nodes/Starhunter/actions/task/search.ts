import type { IDataObject, IExecuteFunctions, INodeProperties } from 'n8n-workflow';

import { showFor } from '../../helpers/displayOptions';
import { TASK_FIELDS } from '../../transport/fragments';
import { starhunterGraphqlRequest } from '../../transport/graphql';

export const description: INodeProperties[] = [
	{
		displayName: 'Target ID',
		name: 'targetId',
		type: 'string',
		default: '',
		description: 'Only return tasks filed on this entity, e.g. a project or a candidate',
		displayOptions: showFor('task', 'search'),
	},
	{
		displayName: 'Assignee ID',
		name: 'assigneeId',
		type: 'string',
		default: '',
		description:
			'Only return tasks assigned to this employee. Ignored when a target ID is set, the API evaluates the target first.',
		displayOptions: showFor('task', 'search'),
	},
	{
		displayName: 'Status',
		name: 'status',
		type: 'string',
		default: '',
		description: 'Filter by task status (partial match)',
		displayOptions: showFor('task', 'search'),
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
		displayOptions: showFor('task', 'search'),
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
		displayOptions: showFor('task', 'search'),
	},
];

export async function execute(
	context: IExecuteFunctions,
	itemIndex: number,
	baseUrl: string,
): Promise<IDataObject[]> {
	const targetId = context.getNodeParameter('targetId', itemIndex) as string;
	const assigneeId = context.getNodeParameter('assigneeId', itemIndex) as string;
	const status = context.getNodeParameter('status', itemIndex) as string;
	const limit = context.getNodeParameter('limit', itemIndex) as number;
	const offset = context.getNodeParameter('offset', itemIndex) as number;

	const query = /* GraphQL */ `
		query SearchTasks(
			$targetId: Id
			$assigneeId: Id
			$status: String
			$limit: Int
			$offset: Int
		) {
			tasks(
				targetId: $targetId
				assigneeId: $assigneeId
				status: $status
				limit: $limit
				offset: $offset
			) {
				${TASK_FIELDS}
			}
		}
	`;

	const variables: IDataObject = {
		targetId: targetId || undefined,
		assigneeId: assigneeId || undefined,
		status: status || undefined,
		limit,
		offset,
	};

	const data = await starhunterGraphqlRequest(context, baseUrl, query, variables);

	return (data.tasks as IDataObject[]) ?? [];
}
