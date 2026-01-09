import {
	type IWebhookFunctions,
	type INodeType,
	type INodeTypeDescription,
	type IWebhookResponseData,
	type INodeExecutionData,
	type MultiPartFormData,
	NodeOperationError,
} from 'n8n-workflow';
import * as crypto from 'crypto';
import { readFileSync } from 'fs';

export class StarhunterTrigger implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Starhunter Trigger',
		name: 'starhunterTrigger',
		icon: 'file:starhunter.svg',
		group: ['trigger'],
		version: 1,
		description: 'Receive candidate events from Starhunter via webhooks',
		defaults: {
			name: 'Starhunter Trigger',
		},
		usableAsTool: true,
		inputs: [],
		outputs: ['main'],
		credentials: [
			{
				name: 'starhunterApi',
				required: true,
			},
		],
		webhooks: [
			{
				name: 'default',
				httpMethod: 'POST',
				responseMode: 'onReceived',
				path: 'webhook',
			},
		],
		properties: [
			{
				displayName: 'Event Types',
				name: 'eventTypes',
				type: 'multiOptions',
				default: ['application'],
				required: true,
				description: 'Which event types to trigger the workflow',
				options: [
					{
						name: 'Application Events',
						value: 'application',
						description: 'Candidate applies to a project',
					},
					{
						name: 'Status Change Events',
						value: 'statusChange',
						description: 'Candidate status changes (hired, rejected, etc.)',
					},
					{
						name: 'Document Upload Events',
						value: 'documentUpload',
						description: 'Candidate uploads new documents',
					},
				],
			},
		],
	};

	async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
		const credentials = await this.getCredentials('starhunterApi');
		const webhookSecret = credentials.webhookSecret as string;

		// Validate HMAC signature
		if (webhookSecret) {
			const req = this.getRequestObject();
			const signature = req.headers['x-starhunter-signature'] as string;

			if (!signature) {
				throw new NodeOperationError(
					this.getNode(),
					'Missing webhook signature header',
				);
			}

			const payload = JSON.stringify(this.getBodyData());
			const expectedSignature = crypto
				.createHmac('sha256', webhookSecret)
				.update(payload)
				.digest('hex');

			// Use timing-safe comparison
			if (
				!crypto.timingSafeEqual(
					Buffer.from(signature),
					Buffer.from(expectedSignature),
				)
			) {
				throw new NodeOperationError(
					this.getNode(),
					'Invalid webhook signature',
				);
			}
		}

		// Get event data
		const bodyData = this.getBodyData();
		const eventType = bodyData.eventType as string;

		// Filter by configured event types
		const allowedEventTypes = this.getNodeParameter('eventTypes') as string[];

		if (!allowedEventTypes.includes(eventType)) {
			// Return success but don't trigger workflow
			return {
				webhookResponse: {
					received: true,
					timestamp: new Date().toISOString(),
					message: 'Event type not enabled',
				},
				noWebhookResponse: false,
			};
		}

		// Prepare execution data with binary support
		const executionData: INodeExecutionData = {
			json: bodyData,
			binary: {},
		};

		// Handle file attachments if present
		const req = this.getRequestObject() as MultiPartFormData.Request;

		if (req.body?.files) {
			const uploadedFiles = req.body.files;
			let fileIndex = 0;

			for (const [fieldName, fileOrFiles] of Object.entries(uploadedFiles)) {
				const files = Array.isArray(fileOrFiles) ? fileOrFiles : [fileOrFiles];

				for (const file of files) {
					const binaryPropertyName =
						files.length > 1 ? `${fieldName}${fileIndex}` : fieldName;

					// Read file content and prepare binary data
					const fileBuffer = readFileSync(file.filepath);

					executionData.binary![binaryPropertyName] =
						await this.helpers.prepareBinaryData(
							fileBuffer,
							file.originalFilename || file.newFilename,
							file.mimetype,
						);

					fileIndex++;
				}
			}
		}

		// Return with binary data
		return {
			workflowData: [[executionData]],
			webhookResponse: {
				received: true,
				timestamp: new Date().toISOString(),
				filesProcessed: Object.keys(executionData.binary || {}).length,
			},
		};
	}
}
