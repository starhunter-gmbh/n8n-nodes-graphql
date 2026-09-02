import type { IDataObject, IExecuteFunctions, INodeProperties } from 'n8n-workflow';

import { buildContactDataInput, contactDataProperty } from '../../helpers/contactData';
import { showFor } from '../../helpers/displayOptions';
import { PERSON_FIELDS } from '../../transport/fragments';
import { normalizeDates } from '../../helpers/dates';
import { starhunterGraphqlRequest } from '../../transport/graphql';

export const description: INodeProperties[] = [
	{
		displayName: 'First Name',
		name: 'firstName',
		type: 'string',
		default: '',
		required: true,
		description: 'First name of the contact person',
		displayOptions: showFor('contactPerson', 'create'),
	},
	{
		displayName: 'Last Name',
		name: 'lastName',
		type: 'string',
		default: '',
		required: true,
		description: 'Last name of the contact person',
		displayOptions: showFor('contactPerson', 'create'),
	},
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		description: 'Optional fields of the contact person',
		displayOptions: showFor('contactPerson', 'create'),
		options: [
			{
				displayName: 'Academic Title',
				name: 'academicTitle',
				type: 'string',
				default: '',
				description: 'Academic title of the contact person, e.g. Dr',
			},
			{
				displayName: 'Birth Date',
				name: 'birthDate',
				type: 'string',
				default: '',
				placeholder: 'YYYY-MM-DD',
				description: 'Birth date of the contact person',
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
				description: 'Salutation of the contact person, e.g. Frau or Herr',
			},
		],
	},
	contactDataProperty('contactPerson', 'create'),
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

	const query = /* GraphQL */ `
		mutation CreateContactPerson(
			$firstName: String!
			$lastName: String!
			$salutation: String
			$academicTitle: String
			$email: String
			$phone: String
			$birthDate: Date
			$contactData: ContactDataInput
		) {
			createContactPerson(
				firstName: $firstName
				lastName: $lastName
				salutation: $salutation
				academicTitle: $academicTitle
				email: $email
				phone: $phone
				birthDate: $birthDate
				contactData: $contactData
			) {
				${PERSON_FIELDS}
			}
		}
	`;

	const variables: IDataObject = normalizeDates(
		context,
		itemIndex,
		{
			firstName: context.getNodeParameter('firstName', itemIndex) as string,
			lastName: context.getNodeParameter('lastName', itemIndex) as string,
			salutation: (additionalFields.salutation as string) || undefined,
			academicTitle: (additionalFields.academicTitle as string) || undefined,
			email: (additionalFields.email as string) || undefined,
			phone: (additionalFields.phone as string) || undefined,
			birthDate: (additionalFields.birthDate as string) || undefined,
			contactData: buildContactDataInput(context, itemIndex),
		},
		{ date: ['birthDate'] },
	);

	const data = await starhunterGraphqlRequest(context, baseUrl, query, variables);

	return (data.createContactPerson as IDataObject) ?? null;
}
