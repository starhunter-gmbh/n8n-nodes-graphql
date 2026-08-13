import { NodeOperationError, type IExecuteFunctions, type INodeProperties } from 'n8n-workflow';

import { showFor } from './displayOptions';

export interface FileInput {
	fileContent: string;
	fileName: string;
}

/**
 * Properties for operations that take a file: either an incoming binary
 * property or a base64 string. The GraphQL side (`uploadFile`, `parseCv`)
 * accepts a base64 payload, optionally prefixed with a data URL header.
 */
export function fileInputProperties(resource: string, operation: string): INodeProperties[] {
	return [
		{
			displayName: 'Input Data Type',
			name: 'inputDataType',
			type: 'options',
			options: [
				{
					name: 'Base64 String',
					value: 'base64',
					description: 'Take the file from a base64 encoded string',
				},
				{
					name: 'Binary File',
					value: 'binary',
					description: 'Take the file from a binary property of the incoming item',
				},
			],
			default: 'binary',
			description: 'Where to read the file content from',
			displayOptions: showFor(resource, operation),
		},
		{
			displayName: 'Input Binary Field',
			name: 'binaryPropertyName',
			type: 'string',
			default: 'data',
			required: true,
			description: 'Name of the binary property that contains the file',
			displayOptions: {
				show: {
					resource: [resource],
					operation: [operation],
					inputDataType: ['binary'],
				},
			},
		},
		{
			displayName: 'File Content',
			name: 'fileContent',
			type: 'string',
			typeOptions: {
				rows: 4,
			},
			default: '',
			required: true,
			description: 'Base64 encoded file content, with or without a data URL prefix',
			displayOptions: {
				show: {
					resource: [resource],
					operation: [operation],
					inputDataType: ['base64'],
				},
			},
		},
		{
			displayName: 'File Name',
			name: 'fileName',
			type: 'string',
			default: '',
			placeholder: 'cv.pdf',
			description:
				'File name including the extension. Required for base64 input, optional for binary input where it defaults to the binary file name.',
			displayOptions: showFor(resource, operation),
		},
	];
}

/** Resolves the configured file input into a base64 payload and a file name. */
export async function resolveFileInput(
	context: IExecuteFunctions,
	itemIndex: number,
): Promise<FileInput> {
	const inputDataType = context.getNodeParameter('inputDataType', itemIndex) as string;
	const fileNameOverride = (context.getNodeParameter('fileName', itemIndex, '') as string).trim();

	if (inputDataType === 'base64') {
		const fileContent = context.getNodeParameter('fileContent', itemIndex) as string;
		if (!fileNameOverride) {
			throw new NodeOperationError(
				context.getNode(),
				'A file name is required when the file is provided as a base64 string',
				{ itemIndex },
			);
		}
		return { fileContent, fileName: fileNameOverride };
	}

	const binaryPropertyName = context.getNodeParameter('binaryPropertyName', itemIndex) as string;
	const binaryData = context.helpers.assertBinaryData(itemIndex, binaryPropertyName);
	const buffer = await context.helpers.getBinaryDataBuffer(itemIndex, binaryPropertyName);
	const fileName = fileNameOverride || binaryData.fileName;

	if (!fileName) {
		throw new NodeOperationError(
			context.getNode(),
			`The binary property "${binaryPropertyName}" has no file name. Set the File Name parameter.`,
			{ itemIndex },
		);
	}

	return { fileContent: buffer.toString('base64'), fileName };
}
