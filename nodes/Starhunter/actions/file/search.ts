import type { IDataObject, IExecuteFunctions, INodeProperties } from 'n8n-workflow';

import { showFor } from '../../helpers/displayOptions';
import { FILE_METADATA_FIELDS } from '../../transport/fragments';
import { splitList, starhunterGraphqlRequest } from '../../transport/graphql';

export const description: INodeProperties[] = [
	{
		displayName: 'Search Term',
		name: 'searchTerm',
		type: 'string',
		default: '',
		description: 'Matches the file name and the extracted file content',
		displayOptions: showFor('file', 'search'),
	},
	{
		displayName: 'Tag IDs',
		name: 'tagIds',
		type: 'string',
		default: '',
		placeholder: '5a1b2c3d4e5f6, 5f6e5d4c3b2a1',
		description:
			'Comma separated list of tag IDs. Only files linked to every requested tag are returned.',
		displayOptions: showFor('file', 'search'),
	},
	{
		displayName: 'Limit',
		name: 'limit',
		type: 'number',
		default: 50,
		description: 'Max number of results to return. The API caps this at 100 per request.',
		typeOptions: {
			minValue: 1,
			maxValue: 100,
		},
		displayOptions: showFor('file', 'search'),
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
		displayOptions: showFor('file', 'search'),
	},
];

export async function execute(
	context: IExecuteFunctions,
	itemIndex: number,
	baseUrl: string,
): Promise<IDataObject[]> {
	const searchTerm = context.getNodeParameter('searchTerm', itemIndex) as string;
	const tagIds = context.getNodeParameter('tagIds', itemIndex) as string;
	const limit = context.getNodeParameter('limit', itemIndex) as number;
	const offset = context.getNodeParameter('offset', itemIndex) as number;

	const query = /* GraphQL */ `
		query SearchFiles($search: String, $tagIds: [Id!], $limit: Int, $offset: Int) {
			files(search: $search, tagIds: $tagIds, limit: $limit, offset: $offset) {
				${FILE_METADATA_FIELDS}
			}
		}
	`;

	const variables: IDataObject = {
		search: searchTerm || undefined,
		tagIds: tagIds ? splitList(tagIds) : undefined,
		limit,
		offset,
	};

	const data = await starhunterGraphqlRequest(context, baseUrl, query, variables);

	return (data.files as IDataObject[]) ?? [];
}
