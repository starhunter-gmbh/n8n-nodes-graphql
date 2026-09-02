import type { IDataObject, IExecuteFunctions, INodeProperties } from 'n8n-workflow';

import { showFor } from '../../helpers/displayOptions';
import { PROJECT_FIELDS } from '../../transport/fragments';
import { normalizeDates } from '../../helpers/dates';
import { compactInput, starhunterGraphqlRequest } from '../../transport/graphql';

export const description: INodeProperties[] = [
	{
		displayName: 'Project Name',
		name: 'projectName',
		type: 'string',
		default: '',
		required: true,
		description: 'Name of the project',
		displayOptions: showFor('project', 'create'),
	},
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		description: 'Optional fields of the project',
		displayOptions: showFor('project', 'create'),
		options: [
			{
				displayName: 'End Date',
				name: 'endDate',
				type: 'string',
				default: '',
				placeholder: 'YYYY-MM-DD',
				description: 'End date of the project',
			},
			{
				displayName: 'Position',
				name: 'position',
				type: 'string',
				default: '',
				description: 'Position that is being searched for',
			},
			{
				displayName: 'Start Date',
				name: 'startDate',
				type: 'string',
				default: '',
				placeholder: 'YYYY-MM-DD',
				description: 'Start date of the project',
			},
			{
				displayName: 'Status',
				name: 'status',
				type: 'options',
				typeOptions: {
					loadOptionsMethod: 'getProjectStatuses',
				},
				default: '',
				description:
					'Project status. The values are read from the connected instance, whose job status options are customer-specific. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
			},
		],
	},
];

export async function execute(
	context: IExecuteFunctions,
	itemIndex: number,
	baseUrl: string,
): Promise<IDataObject | null> {
	const additionalFields = context.getNodeParameter(
		'additionalFields',
		itemIndex,
		{},
	) as IDataObject;

	const input: IDataObject = {
		name: context.getNodeParameter('projectName', itemIndex) as string,
		...normalizeDates(
			context,
			itemIndex,
			compactInput({
				...additionalFields,
			}),
			{ date: ['endDate', 'startDate'] },
		),
	};

	const query = /* GraphQL */ `
		mutation ProjectCreate($input: ProjectCreateInput!) {
			projectCreate(input: $input) {
				${PROJECT_FIELDS}
			}
		}
	`;

	const data = await starhunterGraphqlRequest(context, baseUrl, query, { input });

	return (data.projectCreate as IDataObject) ?? null;
}
