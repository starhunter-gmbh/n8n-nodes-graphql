import type { IDataObject, IExecuteFunctions, INodeProperties } from 'n8n-workflow';

import { buildContactDataInput, contactDataProperty } from '../../helpers/contactData';
import { showFor } from '../../helpers/displayOptions';
import { PERSON_FIELDS } from '../../transport/fragments';
import { normalizeDates } from '../../helpers/dates';
import { compactInput, starhunterGraphqlRequest } from '../../transport/graphql';

export const description: INodeProperties[] = [
	{
		displayName: 'Person ID',
		name: 'personId',
		type: 'string',
		default: '',
		required: true,
		description: 'ID of the person to update',
		displayOptions: showFor('person', 'update'),
	},
	{
		displayName: 'Update Fields',
		name: 'updateFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		description: 'Fields of the person to update',
		displayOptions: showFor('person', 'update'),
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
				displayName: 'First Name',
				name: 'firstName',
				type: 'string',
				default: '',
				description: 'First name of the person',
			},
			{
				displayName: 'Last Name',
				name: 'lastName',
				type: 'string',
				default: '',
				description: 'Last name of the person',
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
	contactDataProperty('person', 'update'),
];

export async function execute(
	context: IExecuteFunctions,
	itemIndex: number,
	baseUrl: string,
): Promise<IDataObject | null> {
	const updateFields = context.getNodeParameter('updateFields', itemIndex, {}) as IDataObject;

	const input: IDataObject = {
		id: context.getNodeParameter('personId', itemIndex) as string,
		...normalizeDates(
			context,
			itemIndex,
			compactInput({
				...updateFields,
				contactData: buildContactDataInput(context, itemIndex),
			}),
			{ date: ['birthDate'] },
		),
	};

	const query = /* GraphQL */ `
		mutation PersonUpdate($input: PersonUpdateInput!) {
			personUpdate(input: $input) {
				${PERSON_FIELDS}
			}
		}
	`;

	const data = await starhunterGraphqlRequest(context, baseUrl, query, { input });

	return (data.personUpdate as IDataObject) ?? null;
}
