import type { IDataObject, IExecuteFunctions, INodeProperties } from 'n8n-workflow';

import { showFor } from '../../helpers/displayOptions';
import { starhunterGraphqlRequest } from '../../transport/graphql';

export const description: INodeProperties[] = [
	{
		displayName: 'Contactable ID',
		name: 'contactableId',
		type: 'string',
		default: '',
		required: true,
		description: 'ID of the contactable the contact data belongs to, e.g. a person or a company',
		displayOptions: showFor('person', 'deleteContactData'),
	},
	{
		displayName: 'Contact Data Type',
		name: 'contactDataType',
		type: 'options',
		options: [
			{ name: 'AIM', value: 'aim', description: 'AIM account' },
			{ name: 'Email', value: 'email', description: 'Email address' },
			{ name: 'Fax', value: 'fax', description: 'Fax number' },
			{ name: 'ICQ', value: 'icq', description: 'ICQ account' },
			{ name: 'Phone', value: 'phone', description: 'Phone number' },
			{ name: 'Postal Address', value: 'postalAddress', description: 'Postal address' },
			{ name: 'URL', value: 'url', description: 'URL' },
			{ name: 'Yahoo', value: 'yahoo', description: 'Yahoo account' },
		],
		default: 'email',
		description: 'Type of the contact data to delete',
		displayOptions: showFor('person', 'deleteContactData'),
	},
	{
		displayName: 'Value',
		name: 'contactDataValue',
		type: 'string',
		default: '',
		required: true,
		description:
			'Value to delete. Matching is value based, so no internal contact data IDs are needed. Phone and fax numbers are matched ignoring formatting.',
		displayOptions: showFor('person', 'deleteContactData'),
	},
];

export async function execute(
	context: IExecuteFunctions,
	itemIndex: number,
	baseUrl: string,
): Promise<IDataObject> {
	const contactableId = context.getNodeParameter('contactableId', itemIndex) as string;
	const type = context.getNodeParameter('contactDataType', itemIndex) as string;
	const value = context.getNodeParameter('contactDataValue', itemIndex) as string;

	const query = /* GraphQL */ `
		mutation ContactableDeleteContactData($input: ContactableDeleteContactDataInput!) {
			contactableDeleteContactData(input: $input)
		}
	`;

	const data = await starhunterGraphqlRequest(context, baseUrl, query, {
		input: { contactableId, type, value },
	});

	return {
		success: data.contactableDeleteContactData ?? false,
		contactableId,
		type,
		value,
	};
}
