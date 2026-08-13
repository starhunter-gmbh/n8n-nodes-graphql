import type { IDataObject, IExecuteFunctions, INodeProperties } from 'n8n-workflow';

import { showFor } from '../../helpers/displayOptions';
import { CUSTOMER_FIELDS } from '../../transport/fragments';
import { starhunterGraphqlRequest } from '../../transport/graphql';

export const description: INodeProperties[] = [
	{
		displayName: 'Company ID',
		name: 'companyId',
		type: 'string',
		default: '',
		required: true,
		description: 'ID of the company to turn into a customer',
		displayOptions: showFor('customer', 'create'),
	},
];

export async function execute(
	context: IExecuteFunctions,
	itemIndex: number,
	baseUrl: string,
): Promise<IDataObject | null> {
	const companyId = context.getNodeParameter('companyId', itemIndex) as string;

	const query = /* GraphQL */ `
		mutation CreateCustomer($companyId: Id!) {
			createCustomer(companyId: $companyId) {
				${CUSTOMER_FIELDS}
			}
		}
	`;

	const data = await starhunterGraphqlRequest(context, baseUrl, query, { companyId });

	return (data.createCustomer as IDataObject) ?? null;
}
