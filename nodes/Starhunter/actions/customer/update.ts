import type { IDataObject, IExecuteFunctions, INodeProperties } from 'n8n-workflow';

import { showFor } from '../../helpers/displayOptions';
import { CUSTOMER_FIELDS } from '../../transport/fragments';
import { starhunterGraphqlRequest } from '../../transport/graphql';

export const description: INodeProperties[] = [
	{
		displayName: 'Customer ID',
		name: 'customerId',
		type: 'string',
		default: '',
		required: true,
		description: 'ID of the customer to update',
		displayOptions: showFor('customer', 'update'),
	},
	{
		displayName: 'Company Name',
		name: 'companyName',
		type: 'string',
		default: '',
		description: 'New name of the company behind the customer',
		displayOptions: showFor('customer', 'update'),
	},
];

export async function execute(
	context: IExecuteFunctions,
	itemIndex: number,
	baseUrl: string,
): Promise<IDataObject | null> {
	const customerId = context.getNodeParameter('customerId', itemIndex) as string;
	const companyName = context.getNodeParameter('companyName', itemIndex) as string;

	const query = /* GraphQL */ `
		mutation UpdateCustomer($id: Id!, $companyName: String) {
			updateCustomer(id: $id, companyName: $companyName) {
				${CUSTOMER_FIELDS}
			}
		}
	`;

	const data = await starhunterGraphqlRequest(context, baseUrl, query, {
		id: customerId,
		companyName: companyName || undefined,
	});

	return (data.updateCustomer as IDataObject) ?? null;
}
