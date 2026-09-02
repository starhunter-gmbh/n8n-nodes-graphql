import type { IDataObject, IExecuteFunctions, INodeProperties } from 'n8n-workflow';

import { showFor } from '../../helpers/displayOptions';
import { INTERVIEW_FIELDS } from '../../transport/fragments';
import { normalizeDates } from '../../helpers/dates';
import { compactInput, starhunterGraphqlRequest } from '../../transport/graphql';

export const description: INodeProperties[] = [
	{
		displayName: 'Candidate ID',
		name: 'candidateId',
		type: 'string',
		default: '',
		required: true,
		description: 'ID of the candidate (person ID) the interview belongs to',
		displayOptions: showFor('interview', 'create'),
	},
	{
		displayName: 'Project ID',
		name: 'projectId',
		type: 'string',
		default: '',
		required: true,
		description: 'ID of the project the interview belongs to',
		displayOptions: showFor('interview', 'create'),
	},
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		description: 'Optional fields of the interview',
		displayOptions: showFor('interview', 'create'),
		options: [
			{
				displayName: 'Consultant ID',
				name: 'consultantId',
				type: 'string',
				default: '',
				description: 'Employee or person ID of the consultant conducting the interview',
			},
			{
				displayName: 'Date',
				name: 'date',
				type: 'dateTime',
				default: '',
				description: 'Date and time of the interview',
			},
			{
				displayName: 'Notes',
				name: 'notes',
				type: 'string',
				typeOptions: {
					rows: 4,
				},
				default: '',
				description: 'Interview notes',
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
		candidateId: context.getNodeParameter('candidateId', itemIndex) as string,
		projectId: context.getNodeParameter('projectId', itemIndex) as string,
		...normalizeDates(
			context,
			itemIndex,
			compactInput({
				...additionalFields,
			}),
			{ dateTime: ['date'] },
		),
	};

	const query = /* GraphQL */ `
		mutation InterviewCreate($input: InterviewCreateInput!) {
			interviewCreate(input: $input) {
				${INTERVIEW_FIELDS}
			}
		}
	`;

	const data = await starhunterGraphqlRequest(context, baseUrl, query, { input });

	return (data.interviewCreate as IDataObject) ?? null;
}
