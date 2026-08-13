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
		displayOptions: showFor('project', 'addTeamMember'),
	},
	{
		displayName: 'Employee ID',
		name: 'employeeId',
		type: 'string',
		default: '',
		required: true,
		description: 'Person ID of the employee to add to the project team',
		displayOptions: showFor('project', 'addTeamMember'),
	},
	{
		displayName: 'Role',
		name: 'role',
		type: 'string',
		default: '',
		required: true,
		description: 'Role of the team member in the project, e.g. Berater or Researcher',
		displayOptions: showFor('project', 'addTeamMember'),
	},
];

export async function execute(
	context: IExecuteFunctions,
	itemIndex: number,
	baseUrl: string,
): Promise<IDataObject | null> {
	const projectId = context.getNodeParameter('projectId', itemIndex) as string;
	const employeeId = context.getNodeParameter('employeeId', itemIndex) as string;
	const role = context.getNodeParameter('role', itemIndex) as string;

	const query = /* GraphQL */ `
		mutation AddProjectTeamMember($projectId: Id!, $employeeId: Id!, $role: String!) {
			addProjectTeamMember(projectId: $projectId, employeeId: $employeeId, role: $role) {
				${PROJECT_FIELDS}
			}
		}
	`;

	const data = await starhunterGraphqlRequest(context, baseUrl, query, {
		projectId,
		employeeId,
		role,
	});

	return (data.addProjectTeamMember as IDataObject) ?? null;
}
