import type { IDataObject, IExecuteFunctions, INodeProperties } from 'n8n-workflow';

import { buildContactDataInput, contactDataProperty } from '../../helpers/contactData';
import { showFor } from '../../helpers/displayOptions';
import { COMPANY_FIELDS } from '../../transport/fragments';
import { compactInput, starhunterGraphqlRequest } from '../../transport/graphql';

export const description: INodeProperties[] = [
	{
		displayName: 'Company Name',
		name: 'companyName',
		type: 'string',
		default: '',
		required: true,
		description: 'Name of the company',
		displayOptions: showFor('company', 'create'),
	},
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		description: 'Optional fields of the company',
		displayOptions: showFor('company', 'create'),
		options: [
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
		],
	},
	contactDataProperty('company', 'create'),
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
		name: context.getNodeParameter('companyName', itemIndex) as string,
		...compactInput({
			...additionalFields,
			contactData: buildContactDataInput(context, itemIndex),
		}),
	};

	const query = /* GraphQL */ `
		mutation CompanyCreate($input: CompanyCreateInput!) {
			companyCreate(input: $input) {
				${COMPANY_FIELDS}
			}
		}
	`;

	const data = await starhunterGraphqlRequest(context, baseUrl, query, { input });

	return (data.companyCreate as IDataObject) ?? null;
}
