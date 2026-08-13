import type { IDataObject, IExecuteFunctions, INodeProperties } from 'n8n-workflow';

import { showFor } from '../../helpers/displayOptions';
import { EMPLOYEE_FIELDS } from '../../transport/fragments';
import { starhunterGraphqlRequest } from '../../transport/graphql';

export const description: INodeProperties[] = [
	{
		displayName: 'First Name',
		name: 'firstName',
		type: 'string',
		default: '',
		required: true,
		description: 'First name of the employee',
		displayOptions: showFor('employee', 'create'),
	},
	{
		displayName: 'Last Name',
		name: 'lastName',
		type: 'string',
		default: '',
		required: true,
		description: 'Last name of the employee',
		displayOptions: showFor('employee', 'create'),
	},
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		description: 'Optional fields of the employee',
		displayOptions: showFor('employee', 'create'),
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
		mutation CreateEmployee(
			$firstName: String!
			$lastName: String!
			$email: String
			$phone: String
		) {
			createEmployee(
				firstName: $firstName
				lastName: $lastName
				email: $email
				phone: $phone
			) {
				${EMPLOYEE_FIELDS}
			}
		}
	`;

	const variables: IDataObject = {
		firstName: context.getNodeParameter('firstName', itemIndex) as string,
		lastName: context.getNodeParameter('lastName', itemIndex) as string,
		email: (additionalFields.email as string) || undefined,
		phone: (additionalFields.phone as string) || undefined,
	};

	const data = await starhunterGraphqlRequest(context, baseUrl, query, variables);

	return (data.createEmployee as IDataObject) ?? null;
}
