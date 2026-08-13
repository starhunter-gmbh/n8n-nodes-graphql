import type { IDataObject, IExecuteFunctions, INodeProperties } from 'n8n-workflow';

import { showFor } from '../../helpers/displayOptions';
import { FILE_METADATA_FIELDS } from '../../transport/fragments';
import { starhunterGraphqlRequest } from '../../transport/graphql';

export const description: INodeProperties[] = [
	{
		displayName: 'File ID',
		name: 'fileId',
		type: 'string',
		default: '',
		required: true,
		description: 'ID of the file to read the metadata of',
		displayOptions: showFor('file', 'get'),
	},
];

export async function execute(
	context: IExecuteFunctions,
	itemIndex: number,
	baseUrl: string,
): Promise<IDataObject | null> {
	const fileId = context.getNodeParameter('fileId', itemIndex) as string;

	const query = /* GraphQL */ `
		query GetFile($id: ID!) {
			file(id: $id) {
				${FILE_METADATA_FIELDS}
			}
		}
	`;

	const data = await starhunterGraphqlRequest(context, baseUrl, query, { id: fileId });

	return (data.file as IDataObject) ?? null;
}
