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
		displayOptions: showFor('project', 'addContactPerson'),
	},
	{
		displayName: 'Person ID',
		name: 'personId',
		type: 'string',
		default: '',
		required: true,
		description: 'ID of the contact person to link to the project',
		displayOptions: showFor('project', 'addContactPerson'),
	},
];

export async function execute(
	context: IExecuteFunctions,
	itemIndex: number,
	baseUrl: string,
): Promise<IDataObject | null> {
	const projectId = context.getNodeParameter('projectId', itemIndex) as string;
	const personId = context.getNodeParameter('personId', itemIndex) as string;

	const query = /* GraphQL */ `
		mutation AddProjectContactPerson($projectId: Id!, $personId: Id!) {
			addProjectContactPerson(projectId: $projectId, personId: $personId) {
				${PROJECT_FIELDS}
			}
		}
	`;

	const data = await starhunterGraphqlRequest(context, baseUrl, query, { projectId, personId });

	return (data.addProjectContactPerson as IDataObject) ?? null;
}
