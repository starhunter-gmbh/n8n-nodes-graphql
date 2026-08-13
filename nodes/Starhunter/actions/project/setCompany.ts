import type { IDataObject, IExecuteFunctions, INodeProperties } from 'n8n-workflow';

import { showFor } from '../../helpers/displayOptions';
import { PROJECT_FIELDS } from '../../transport/fragments';
import { starhunterGraphqlRequest } from '../../transport/graphql';

export const description: INodeProperties[] = [
	{
		displayName: 'Project ID',
		name: 'projectId',
		type: 'string',
		default: '',
		required: true,
		description: 'ID of the project',
		displayOptions: showFor('project', 'setCompany'),
	},
	{
		displayName: 'Company ID',
		name: 'companyId',
		type: 'string',
		default: '',
		required: true,
		description: 'ID of the company to link as the client of the project',
		displayOptions: showFor('project', 'setCompany'),
	},
];

export async function execute(
	context: IExecuteFunctions,
	itemIndex: number,
	baseUrl: string,
): Promise<IDataObject | null> {
	const projectId = context.getNodeParameter('projectId', itemIndex) as string;
	const companyId = context.getNodeParameter('companyId', itemIndex) as string;

	const query = /* GraphQL */ `
		mutation SetProjectCompany($projectId: Id!, $companyId: Id!) {
			setProjectCompany(projectId: $projectId, companyId: $companyId) {
				${PROJECT_FIELDS}
			}
		}
	`;

	const data = await starhunterGraphqlRequest(context, baseUrl, query, { projectId, companyId });

	return (data.setProjectCompany as IDataObject) ?? null;
}
