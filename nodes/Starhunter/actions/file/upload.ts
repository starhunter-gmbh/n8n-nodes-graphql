import type { IDataObject, IExecuteFunctions, INodeProperties } from 'n8n-workflow';

import { showFor } from '../../helpers/displayOptions';
import { fileInputProperties, resolveFileInput } from '../../helpers/fileInput';
import { FILE_UPLOAD_FIELDS } from '../../transport/fragments';
import { starhunterGraphqlRequest } from '../../transport/graphql';

export const description: INodeProperties[] = [
	{
		displayName: 'Link To',
		name: 'uploadTarget',
		type: 'options',
		options: [
			{
				name: 'Company',
				value: 'company',
				description: 'Link the uploaded file to a company',
			},
			{
				name: 'Contact Person',
				value: 'contactPerson',
				description: 'Link the uploaded file to a contact person',
			},
			{
				name: 'Customer',
				value: 'customer',
				description: 'Link the uploaded file to a customer',
			},
			{
				name: 'Nothing',
				value: 'none',
				description: 'Store the file without linking it to a record',
			},
		],
		default: 'none',
		description: 'Record the uploaded file is linked to',
		displayOptions: showFor('file', 'upload'),
	},
	{
		displayName: 'Company ID',
		name: 'companyId',
		type: 'string',
		default: '',
		required: true,
		description: 'ID of the company to link the file to',
		displayOptions: {
			show: {
				resource: ['file'],
				operation: ['upload'],
				uploadTarget: ['company'],
			},
		},
	},
	{
		displayName: 'Customer ID',
		name: 'customerId',
		type: 'string',
		default: '',
		required: true,
		description: 'ID of the customer to link the file to',
		displayOptions: {
			show: {
				resource: ['file'],
				operation: ['upload'],
				uploadTarget: ['customer'],
			},
		},
	},
	{
		displayName: 'Contact Person ID',
		name: 'contactPersonId',
		type: 'string',
		default: '',
		required: true,
		description: 'Person ID of the contact person to link the file to',
		displayOptions: {
			show: {
				resource: ['file'],
				operation: ['upload'],
				uploadTarget: ['contactPerson'],
			},
		},
	},
	...fileInputProperties('file', 'upload'),
];

const MUTATIONS: Record<string, { field: string; idArg: string; idType: string; idParam: string }> =
	{
		none: { field: 'uploadFile', idArg: '', idType: '', idParam: '' },
		company: {
			field: 'uploadCompanyFile',
			idArg: 'companyId',
			idType: 'Id!',
			idParam: 'companyId',
		},
		customer: {
			field: 'uploadCustomerFile',
			idArg: 'customerId',
			idType: 'Id!',
			idParam: 'customerId',
		},
		contactPerson: {
			field: 'uploadContactPersonFile',
			idArg: 'contactPersonId',
			idType: 'Id!',
			idParam: 'contactPersonId',
		},
	};

export async function execute(
	context: IExecuteFunctions,
	itemIndex: number,
	baseUrl: string,
): Promise<IDataObject | null> {
	const uploadTarget = context.getNodeParameter('uploadTarget', itemIndex) as string;
	const mutation = MUTATIONS[uploadTarget] ?? MUTATIONS.none;
	const { fileContent, fileName } = await resolveFileInput(context, itemIndex);

	const variables: IDataObject = { fileContent, fileName };
	const declarations = ['$fileContent: String!', '$fileName: String!'];
	const args = ['fileContent: $fileContent', 'fileName: $fileName'];

	if (mutation.idArg) {
		variables[mutation.idArg] = context.getNodeParameter(mutation.idParam, itemIndex) as string;
		declarations.unshift(`$${mutation.idArg}: ${mutation.idType}`);
		args.unshift(`${mutation.idArg}: $${mutation.idArg}`);
	}

	const query = /* GraphQL */ `
		mutation UploadFile(${declarations.join(', ')}) {
			${mutation.field}(${args.join(', ')}) {
				${FILE_UPLOAD_FIELDS}
			}
		}
	`;

	const data = await starhunterGraphqlRequest(context, baseUrl, query, variables);

	return (data[mutation.field] as IDataObject) ?? null;
}
