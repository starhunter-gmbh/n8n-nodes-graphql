import type { IDataObject, IExecuteFunctions, INodeProperties } from 'n8n-workflow';

import { buildContactDataInput, contactDataProperty } from '../../helpers/contactData';
import { showFor } from '../../helpers/displayOptions';
import { CANDIDATE_FIELDS } from '../../transport/fragments';
import { compactInput, starhunterGraphqlRequest } from '../../transport/graphql';

export const description: INodeProperties[] = [
	{
		displayName: 'First Name',
		name: 'firstName',
		type: 'string',
		default: '',
		required: true,
		description: 'First name of the candidate',
		displayOptions: showFor('candidate', 'create'),
	},
	{
		displayName: 'Last Name',
		name: 'lastName',
		type: 'string',
		default: '',
		required: true,
		description: 'Last name of the candidate',
		displayOptions: showFor('candidate', 'create'),
	},
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		description: 'Optional fields of the candidate',
		displayOptions: showFor('candidate', 'create'),
		options: [
			{
				displayName: 'Academic Title',
				name: 'academicTitle',
				type: 'string',
				default: '',
				description: 'Academic title of the candidate, e.g. Dr',
			},
			{
				displayName: 'Birth Date',
				name: 'birthDate',
				type: 'string',
				default: '',
				placeholder: 'YYYY-MM-DD',
				description: 'Birth date of the candidate',
			},
			{
				displayName: 'Email',
				name: 'email',
				type: 'string',
				placeholder: 'name@email.com',
				default: '',
				description: 'Primary email address, stored with the label Work',
			},
			{
				displayName: 'Phone',
				name: 'phone',
				type: 'string',
				default: '',
				description: 'Primary phone number, stored with the label Work',
			},
			{
				displayName: 'Salutation',
				name: 'salutation',
				type: 'string',
				default: '',
				description: 'Salutation of the candidate, e.g. Frau or Herr',
			},
		],
	},
	contactDataProperty('candidate', 'create'),
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
		firstName: context.getNodeParameter('firstName', itemIndex) as string,
		lastName: context.getNodeParameter('lastName', itemIndex) as string,
		...compactInput({
			...additionalFields,
			contactData: buildContactDataInput(context, itemIndex),
		}),
	};

	const query = /* GraphQL */ `
		mutation CandidateCreate($input: CandidateCreateInput!) {
			candidateCreate(input: $input) {
				${CANDIDATE_FIELDS}
			}
		}
	`;

	const data = await starhunterGraphqlRequest(context, baseUrl, query, { input });

	return (data.candidateCreate as IDataObject) ?? null;
}
