import type { IDataObject, IExecuteFunctions, INodeProperties } from 'n8n-workflow';

import { showFor } from '../../helpers/displayOptions';
import { PROJECT_FIELDS } from '../../transport/fragments';
import { normalizeDates } from '../../helpers/dates';
import { starhunterGraphqlRequest } from '../../transport/graphql';

export const description: INodeProperties[] = [
	{
		displayName: 'Project ID',
		name: 'projectId',
		type: 'string',
		default: '',
		required: true,
		description: 'ID of the project',
		displayOptions: showFor('project', 'setPortalSettings'),
	},
	{
		displayName: 'Show in Portal',
		name: 'showInPortal',
		type: 'boolean',
		default: false,
		description: 'Whether the project is published on the job portal',
		displayOptions: showFor('project', 'setPortalSettings'),
	},
	{
		displayName: 'Publishing Date',
		name: 'publishingDate',
		type: 'string',
		default: '',
		placeholder: 'YYYY-MM-DD',
		description: 'Date the project is published on the job portal',
		displayOptions: showFor('project', 'setPortalSettings'),
	},
];

export async function execute(
	context: IExecuteFunctions,
	itemIndex: number,
	baseUrl: string,
): Promise<IDataObject | null> {
	const projectId = context.getNodeParameter('projectId', itemIndex) as string;
	const showInPortal = context.getNodeParameter('showInPortal', itemIndex) as boolean;
	const publishingDate = context.getNodeParameter('publishingDate', itemIndex) as string;

	const query = /* GraphQL */ `
		mutation SetProjectPortalSettings(
			$projectId: Id!
			$showInPortal: Boolean
			$publishingDate: Date
		) {
			setProjectPortalSettings(
				projectId: $projectId
				showInPortal: $showInPortal
				publishingDate: $publishingDate
			) {
				${PROJECT_FIELDS}
			}
		}
	`;

	const variables = normalizeDates(
		context,
		itemIndex,
		{
			projectId,
			showInPortal,
			publishingDate: publishingDate || undefined,
		},
		{ date: ['publishingDate'] },
	);

	const data = await starhunterGraphqlRequest(context, baseUrl, query, variables);

	return (data.setProjectPortalSettings as IDataObject) ?? null;
}
