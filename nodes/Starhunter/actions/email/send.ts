import {
	NodeApiError,
	type IDataObject,
	type IExecuteFunctions,
	type INodeProperties,
	type JsonObject,
} from 'n8n-workflow';

import { showFor } from '../../helpers/displayOptions';
import { splitList, starhunterGraphqlRequest } from '../../transport/graphql';

export const description: INodeProperties[] = [
	{
		displayName: 'Sender Type',
		name: 'senderType',
		type: 'options',
		options: [
			{
				name: 'System Mailbox',
				value: 'SYSTEM',
				description: 'Send through the configured system mailbox, admins only',
			},
			{
				name: 'User Mailbox',
				value: 'USER',
				description: 'Send through a mailbox of the authenticated employee',
			},
		],
		default: 'USER',
		description: 'Mailbox the email is sent from',
		displayOptions: showFor('email', 'send'),
	},
	{
		displayName: 'Mailbox ID',
		name: 'mailboxId',
		type: 'string',
		default: '',
		description:
			'ID of the user mailbox to send from. Leave empty to use the first selectable mailbox of the employee. Not supported for the system mailbox.',
		displayOptions: {
			show: {
				resource: ['email'],
				operation: ['send'],
				senderType: ['USER'],
			},
		},
	},
	{
		displayName: 'To Addresses',
		name: 'toAddresses',
		type: 'string',
		default: '',
		required: true,
		placeholder: 'name@email.com, second@email.com',
		description: 'Comma separated list of recipient addresses',
		displayOptions: showFor('email', 'send'),
	},
	{
		displayName: 'Subject',
		name: 'subject',
		type: 'string',
		default: '',
		required: true,
		description: 'Subject line of the email',
		displayOptions: showFor('email', 'send'),
	},
	{
		displayName: 'Body',
		name: 'body',
		type: 'string',
		typeOptions: {
			rows: 6,
		},
		default: '',
		required: true,
		description: 'Body content of the email',
		displayOptions: showFor('email', 'send'),
	},
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		description: 'Optional fields of the email',
		displayOptions: showFor('email', 'send'),
		options: [
			{
				displayName: 'BCC Addresses',
				name: 'bccAddresses',
				type: 'string',
				default: '',
				placeholder: 'name@email.com, second@email.com',
				description: 'Comma separated list of BCC addresses',
			},
			{
				displayName: 'CC Addresses',
				name: 'ccAddresses',
				type: 'string',
				default: '',
				placeholder: 'name@email.com, second@email.com',
				description: 'Comma separated list of CC addresses',
			},
			{
				displayName: 'Target ID',
				name: 'target',
				type: 'string',
				default: '',
				description:
					'ID of the entity the email is filed on, e.g. a candidate or a project. The email shows up in that record.',
			},
		],
	},
];

export async function execute(
	context: IExecuteFunctions,
	itemIndex: number,
	baseUrl: string,
): Promise<IDataObject | null> {
	const senderType = context.getNodeParameter('senderType', itemIndex) as string;
	const toAddresses = context.getNodeParameter('toAddresses', itemIndex) as string;
	const subject = context.getNodeParameter('subject', itemIndex) as string;
	const body = context.getNodeParameter('body', itemIndex) as string;
	const additionalFields = context.getNodeParameter(
		'additionalFields',
		itemIndex,
		{},
	) as IDataObject;

	const mailboxId =
		senderType === 'USER' ? (context.getNodeParameter('mailboxId', itemIndex, '') as string) : '';
	const ccAddresses = (additionalFields.ccAddresses as string) ?? '';
	const bccAddresses = (additionalFields.bccAddresses as string) ?? '';
	const target = (additionalFields.target as string) ?? '';

	const query = /* GraphQL */ `
		mutation SendEmail(
			$senderType: String
			$mailboxId: Id
			$to: [String!]!
			$cc: [String!]
			$bcc: [String!]
			$subject: String!
			$body: String!
			$target: Id
		) {
			sendEmail(
				senderType: $senderType
				mailboxId: $mailboxId
				to: $to
				cc: $cc
				bcc: $bcc
				subject: $subject
				body: $body
				target: $target
			) {
				id
				status
				queued
				mailboxId
			}
		}
	`;

	const variables: IDataObject = {
		senderType,
		mailboxId: mailboxId || undefined,
		to: splitList(toAddresses),
		cc: ccAddresses ? splitList(ccAddresses) : undefined,
		bcc: bccAddresses ? splitList(bccAddresses) : undefined,
		subject,
		body,
		target: target || undefined,
	};

	const data = await starhunterGraphqlRequest(context, baseUrl, query, variables);
	const result = (data.sendEmail as IDataObject) ?? null;

	// `queued: false` means the API accepted the request but did not hand the
	// mail to a mailbox, which must not read as a successful send.
	if (result?.queued === false) {
		throw new NodeApiError(context.getNode(), data as JsonObject, {
			message: `Starhunter did not queue the email${result.status ? `: ${String(result.status)}` : ''}`,
			description:
				'The API returned queued=false. Check the sender type, the selected mailbox and whether the authenticated user may send email.',
			itemIndex,
		});
	}

	return result;
}
