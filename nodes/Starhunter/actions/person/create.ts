import type { IDataObject, IExecuteFunctions, INodeProperties } from 'n8n-workflow';

import { buildContactDataInput, contactDataProperty } from '../../helpers/contactData';
import { showFor } from '../../helpers/displayOptions';
import { PERSON_FIELDS } from '../../transport/fragments';
import { normalizeDates } from '../../helpers/dates';
import { compactInput, starhunterGraphqlRequest } from '../../transport/graphql';

export const description: INodeProperties[] = [
	{
		displayName: 'First Name',
		name: 'firstName',
		type: 'string',
		default: '',
		required: true,
		description: 'First name of the person',
		displayOptions: showFor('person', 'create'),
	},
	{
		displayName: 'Last Name',
		name: 'lastName',
		type: 'string',
		default: '',
		required: true,
		description: 'Last name of the person',
		displayOptions: showFor('person', 'create'),
	},
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		description: 'Optional fields of the person',
		displayOptions: showFor('person', 'create'),
		options: [
			{
				displayName: 'Academic Title',
				name: 'academicTitle',
				type: 'string',
				default: '',
				description: 'Academic title of the person, e.g. Dr',
			},
			{
				displayName: 'Birth Date',
				name: 'birthDate',
				type: 'string',
				default: '',
				placeholder: 'YYYY-MM-DD',
				description: 'Birth date of the person',
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
				displayName: 'Middle Name',
				name: 'middleName',
				type: 'string',
				default: '',
				description: 'Middle name of the person',
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
				description: 'Salutation of the person, e.g. Frau or Herr',
			},
		],
	},
	contactDataProperty('person', 'create'),
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
		...normalizeDates(
			context,
			itemIndex,
			compactInput({
				...additionalFields,
				contactData: buildContactDataInput(context, itemIndex),
			}),
			{ date: ['birthDate'] },
		),
	};

	const query = /* GraphQL */ `
		mutation PersonCreate($input: PersonCreateInput!) {
			personCreate(input: $input) {
				${PERSON_FIELDS}
			}
		}
	`;

	const data = await starhunterGraphqlRequest(context, baseUrl, query, { input });

	return (data.personCreate as IDataObject) ?? null;
}
