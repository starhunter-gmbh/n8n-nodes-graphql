import type { IDataObject, IExecuteFunctions, INodeProperties } from 'n8n-workflow';

import { fileInputProperties, resolveFileInput } from '../../helpers/fileInput';
import { CV_DATA_FIELDS } from '../../transport/fragments';
import { starhunterGraphqlRequest } from '../../transport/graphql';

export const description: INodeProperties[] = [...fileInputProperties('candidate', 'parseCv')];

export async function execute(
	context: IExecuteFunctions,
	itemIndex: number,
	baseUrl: string,
): Promise<IDataObject | null> {
	const { fileContent, fileName } = await resolveFileInput(context, itemIndex);

	const query = /* GraphQL */ `
		mutation ParseCv($fileContent: String!, $fileName: String!) {
			parseCv(fileContent: $fileContent, fileName: $fileName) {
				${CV_DATA_FIELDS}
			}
		}
	`;

	const data = await starhunterGraphqlRequest(context, baseUrl, query, { fileContent, fileName });

	return (data.parseCv as IDataObject) ?? null;
}
