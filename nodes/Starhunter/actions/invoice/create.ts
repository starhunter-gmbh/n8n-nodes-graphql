import {
	NodeOperationError,
	type IDataObject,
	type IExecuteFunctions,
	type INodeProperties,
} from 'n8n-workflow';

import { showFor } from '../../helpers/displayOptions';
import { starhunterGraphqlRequest } from '../../transport/graphql';

export const description: INodeProperties[] = [
	{
		displayName: 'Subject',
		name: 'subject',
		type: 'string',
		default: '',
		required: true,
		description: 'Subject of the invoice',
		displayOptions: showFor('invoice', 'create'),
	},
	{
		displayName: 'Customer ID',
		name: 'customerId',
		type: 'string',
		default: '',
		required: true,
		description: 'ID of the customer the invoice is issued to',
		displayOptions: showFor('invoice', 'create'),
	},
	{
		displayName: 'Positions',
		name: 'positions',
		type: 'fixedCollection',
		typeOptions: {
			multipleValues: true,
		},
		default: {},
		placeholder: 'Add Position',
		description: 'Invoice positions. At least one position is required.',
		displayOptions: showFor('invoice', 'create'),
		options: [
			{
				displayName: 'Position',
				name: 'position',
				values: [
					{
						displayName: 'Title',
						name: 'title',
						type: 'string',
						default: '',
						description: 'Description of the position',
					},
					{
						displayName: 'Quantity',
						name: 'quantity',
						type: 'number',
						default: 1,
						description: 'Quantity of the position, booked as hours',
					},
					{
						displayName: 'Price',
						name: 'price',
						type: 'number',
						default: 0,
						description: 'Unit price of the position',
					},
				],
			},
		],
	},
];

export async function execute(
	context: IExecuteFunctions,
	itemIndex: number,
	baseUrl: string,
): Promise<IDataObject> {
	const subject = context.getNodeParameter('subject', itemIndex) as string;
	const customerId = context.getNodeParameter('customerId', itemIndex) as string;
	const positionsValue = context.getNodeParameter('positions', itemIndex, {}) as IDataObject;

	const positions = ((positionsValue.position as IDataObject[]) ?? []).map((position) => ({
		title: position.title,
		quantity: Number(position.quantity),
		price: Number(position.price),
	}));

	if (!positions.length) {
		throw new NodeOperationError(context.getNode(), 'At least one invoice position is required', {
			itemIndex,
		});
	}

	const query = /* GraphQL */ `
		mutation InvoiceCreate(
			$subject: String!
			$customerId: Id!
			$positions: [InvoicePositionInput]!
		) {
			invoiceCreate(subject: $subject, customerId: $customerId, positions: $positions)
		}
	`;

	const data = await starhunterGraphqlRequest(context, baseUrl, query, {
		subject,
		customerId,
		positions,
	});

	return {
		id: data.invoiceCreate ?? null,
		subject,
		customerId,
	};
}
