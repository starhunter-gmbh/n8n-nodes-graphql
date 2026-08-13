import type { IDataObject, IExecuteFunctions, INodeProperties } from 'n8n-workflow';

import { showFor } from '../../helpers/displayOptions';
import { INVOICE_FIELDS } from '../../transport/fragments';
import { starhunterGraphqlRequest } from '../../transport/graphql';

export const description: INodeProperties[] = [
	{
		displayName: 'Project ID',
		name: 'projectId',
		type: 'string',
		default: '',
		description: 'Only return invoices of this project',
		displayOptions: showFor('invoice', 'search'),
	},
	{
		displayName: 'Company ID',
		name: 'companyId',
		type: 'string',
		default: '',
		description:
			'Only return invoices of this company. Ignored when a project ID is set, the API evaluates the project first.',
		displayOptions: showFor('invoice', 'search'),
	},
	{
		displayName: 'Status',
		name: 'status',
		type: 'string',
		default: '',
		description: 'Filter by invoice status (partial match)',
		displayOptions: showFor('invoice', 'search'),
	},
	{
		displayName: 'Limit',
		name: 'limit',
		type: 'number',
		default: 50,
		description: 'Max number of results to return',
		typeOptions: {
			minValue: 1,
			maxValue: 1000,
		},
		displayOptions: showFor('invoice', 'search'),
	},
	{
		displayName: 'Offset',
		name: 'offset',
		type: 'number',
		default: 0,
		description: 'Number of results to skip for pagination',
		typeOptions: {
			minValue: 0,
		},
		displayOptions: showFor('invoice', 'search'),
	},
];

export async function execute(
	context: IExecuteFunctions,
	itemIndex: number,
	baseUrl: string,
): Promise<IDataObject[]> {
	const projectId = context.getNodeParameter('projectId', itemIndex) as string;
	const companyId = context.getNodeParameter('companyId', itemIndex) as string;
	const status = context.getNodeParameter('status', itemIndex) as string;
	const limit = context.getNodeParameter('limit', itemIndex) as number;
	const offset = context.getNodeParameter('offset', itemIndex) as number;

	const query = /* GraphQL */ `
		query SearchInvoices(
			$projectId: Id
			$companyId: Id
			$status: String
			$limit: Int
			$offset: Int
		) {
			invoices(
				projectId: $projectId
				companyId: $companyId
				status: $status
				limit: $limit
				offset: $offset
			) {
				${INVOICE_FIELDS}
			}
		}
	`;

	const variables: IDataObject = {
		projectId: projectId || undefined,
		companyId: companyId || undefined,
		status: status || undefined,
		limit,
		offset,
	};

	const data = await starhunterGraphqlRequest(context, baseUrl, query, variables);

	return (data.invoices as IDataObject[]) ?? [];
}
