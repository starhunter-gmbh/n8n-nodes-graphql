import type { IDataObject, IExecuteFunctions, INodeProperties } from 'n8n-workflow';

import { showFor } from '../../helpers/displayOptions';
import { PROJECT_FIELDS } from '../../transport/fragments';
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
				type: 'string',
				default: '',
				description:
					'Project status. The API expects one of the customer-specific enum values of the job status attribute.',
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
		...compactInput({
			...additionalFields,
		}),
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
