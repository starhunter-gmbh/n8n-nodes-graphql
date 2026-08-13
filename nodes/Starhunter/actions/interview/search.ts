import type { IDataObject, IExecuteFunctions, INodeProperties } from 'n8n-workflow';

import { showFor } from '../../helpers/displayOptions';
import { INTERVIEW_FIELDS } from '../../transport/fragments';
import { starhunterGraphqlRequest } from '../../transport/graphql';

export const description: INodeProperties[] = [
	{
		displayName: 'Candidate ID',
		name: 'candidateId',
		type: 'string',
		default: '',
		description: 'Only return interviews of this candidate (person ID)',
		displayOptions: showFor('interview', 'search'),
	},
	{
		displayName: 'Project ID',
		name: 'projectId',
		type: 'string',
		default: '',
		description:
			'Only return interviews of this project. Ignored when a candidate ID is set, the API evaluates the candidate first.',
		displayOptions: showFor('interview', 'search'),
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
		displayOptions: showFor('interview', 'search'),
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
		displayOptions: showFor('interview', 'search'),
	},
];

export async function execute(
	context: IExecuteFunctions,
	itemIndex: number,
	baseUrl: string,
): Promise<IDataObject[]> {
	const candidateId = context.getNodeParameter('candidateId', itemIndex) as string;
	const projectId = context.getNodeParameter('projectId', itemIndex) as string;
	const limit = context.getNodeParameter('limit', itemIndex) as number;
	const offset = context.getNodeParameter('offset', itemIndex) as number;

	const query = /* GraphQL */ `
		query SearchInterviews($candidateId: Id, $projectId: Id, $limit: Int, $offset: Int) {
			interviews(
				candidateId: $candidateId
				projectId: $projectId
				limit: $limit
				offset: $offset
			) {
				${INTERVIEW_FIELDS}
			}
		}
	`;

	const variables: IDataObject = {
		candidateId: candidateId || undefined,
		projectId: projectId || undefined,
		limit,
		offset,
	};

	const data = await starhunterGraphqlRequest(context, baseUrl, query, variables);

	return (data.interviews as IDataObject[]) ?? [];
}
