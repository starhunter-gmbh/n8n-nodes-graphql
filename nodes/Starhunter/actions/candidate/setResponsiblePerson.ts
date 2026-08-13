import type { IDataObject, IExecuteFunctions, INodeProperties } from 'n8n-workflow';

import { showFor } from '../../helpers/displayOptions';
import { CANDIDATE_FIELDS } from '../../transport/fragments';
import { starhunterGraphqlRequest } from '../../transport/graphql';

export const description: INodeProperties[] = [
	{
		displayName: 'Candidate ID',
		name: 'candidateId',
		type: 'string',
		default: '',
		required: true,
		description: 'ID of the candidate (person ID)',
		displayOptions: showFor('candidate', 'setResponsiblePerson'),
	},
	{
		displayName: 'Employee ID',
		name: 'employeeId',
		type: 'string',
		default: '',
		required: true,
		description: 'Person ID of the employee to make responsible for the candidate',
		displayOptions: showFor('candidate', 'setResponsiblePerson'),
	},
];

export async function execute(
	context: IExecuteFunctions,
	itemIndex: number,
	baseUrl: string,
): Promise<IDataObject | null> {
	const candidateId = context.getNodeParameter('candidateId', itemIndex) as string;
	const employeeId = context.getNodeParameter('employeeId', itemIndex) as string;

	const query = /* GraphQL */ `
		mutation SetResponsiblePerson($candidateId: Id!, $employeeId: Id!) {
			setResponsiblePerson(candidateId: $candidateId, employeeId: $employeeId) {
				${CANDIDATE_FIELDS}
			}
		}
	`;

	const data = await starhunterGraphqlRequest(context, baseUrl, query, {
		candidateId,
		employeeId,
	});

	return (data.setResponsiblePerson as IDataObject) ?? null;
}
