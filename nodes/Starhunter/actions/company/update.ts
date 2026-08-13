import type { IDataObject, IExecuteFunctions, INodeProperties } from 'n8n-workflow';

import { buildContactDataInput, contactDataProperty } from '../../helpers/contactData';
import { showFor } from '../../helpers/displayOptions';
import { COMPANY_FIELDS } from '../../transport/fragments';
import { compactInput, starhunterGraphqlRequest } from '../../transport/graphql';

export const description: INodeProperties[] = [
	{
		displayName: 'Company ID',
		name: 'companyId',
		type: 'string',
		default: '',
		required: true,
		description: 'ID of the company to update',
		displayOptions: showFor('company', 'update'),
	},
	{
		displayName: 'Update Fields',
		name: 'updateFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		description:
			'Curated company master data. Financial fields are intentionally not writable through this mutation.',
		displayOptions: showFor('company', 'update'),
		options: [
			{
				displayName: 'Company Name',
				name: 'companyName',
				type: 'string',
				default: '',
				description: 'Name of the company',
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
				displayName: 'Employees Count',
				name: 'employeesCount',
				type: 'number',
				default: 0,
				description: 'Number of employees of the company',
			},
			{
				displayName: 'Latitude',
				name: 'posLat',
				type: 'number',
				default: 0,
				description: 'Latitude of the company location',
			},
			{
				displayName: 'Legal Structure',
				name: 'legalStructure',
				type: 'string',
				default: '',
				description: 'Legal structure of the company, e.g. GmbH',
			},
			{
				displayName: 'Longitude',
				name: 'posLong',
				type: 'number',
				default: 0,
				description: 'Longitude of the company location',
			},
			{
				displayName: 'Phone',
				name: 'phone',
				type: 'string',
				default: '',
				description: 'Primary phone number, stored with the label Work',
			},
			{
				displayName: 'Source',
				name: 'source',
				type: 'string',
				default: '',
				description: 'Source the company record originates from',
			},
		],
	},
	contactDataProperty('company', 'update'),
];

export async function execute(
	context: IExecuteFunctions,
	itemIndex: number,
	baseUrl: string,
): Promise<IDataObject | null> {
	const updateFields = context.getNodeParameter('updateFields', itemIndex, {}) as IDataObject;

	const input: IDataObject = {
		id: context.getNodeParameter('companyId', itemIndex) as string,
		...compactInput({
			...updateFields,
			contactData: buildContactDataInput(context, itemIndex),
		}),
	};

	const query = /* GraphQL */ `
		mutation CompanyUpdate($input: CompanyUpdateInput!) {
			companyUpdate(input: $input) {
				${COMPANY_FIELDS}
			}
		}
	`;

	const data = await starhunterGraphqlRequest(context, baseUrl, query, { input });

	return (data.companyUpdate as IDataObject) ?? null;
}
