import type { IDataObject, IExecuteFunctions, INodeProperties } from 'n8n-workflow';

import { showFor } from './displayOptions';

/**
 * Node property for the `ContactDataInput` accepted by the entity-first
 * contactable mutations (candidateCreate, candidateUpdate, personCreate,
 * personUpdate, companyCreate, companyUpdate, createContactPerson, ...).
 */
export function contactDataProperty(resource: string, operation: string): INodeProperties {
	return {
		displayName: 'Contact Data',
		name: 'contactData',
		type: 'fixedCollection',
		typeOptions: {
			multipleValues: true,
		},
		default: {},
		placeholder: 'Add Contact Data',
		description: 'Structured contact data to write to the contactable',
		displayOptions: showFor(resource, operation),
		options: [
			{
				displayName: 'Email',
				name: 'emails',
				values: [
					{
						displayName: 'Address',
						name: 'address',
						type: 'string',
						default: '',
						placeholder: 'name@email.com',
						description: 'Email address to store',
					},
					{
						displayName: 'Label',
						name: 'label',
						type: 'string',
						default: 'Work',
						description: 'Label of the email address, e.g. Work or Private',
					},
				],
			},
			{
				displayName: 'Phone',
				name: 'phones',
				values: [
					{
						displayName: 'Number',
						name: 'number',
						type: 'string',
						default: '',
						description: 'Phone number to store',
					},
					{
						displayName: 'Label',
						name: 'label',
						type: 'string',
						default: 'Work',
						description: 'Label of the phone number, e.g. Work or Mobile',
					},
				],
			},
			{
				displayName: 'Postal Address',
				name: 'postalAddresses',
				values: [
					{
						displayName: 'Address',
						name: 'address',
						type: 'string',
						default: '',
						description: 'Street and house number',
					},
					{
						displayName: 'Address 2',
						name: 'address2',
						type: 'string',
						default: '',
						description: 'Additional address line',
					},
					{
						displayName: 'Postal Code',
						name: 'postalCode',
						type: 'string',
						default: '',
						description: 'Postal code of the address',
					},
					{
						displayName: 'City',
						name: 'city',
						type: 'string',
						default: '',
						description: 'City of the address',
					},
					{
						displayName: 'Full Name',
						name: 'fullName',
						type: 'string',
						default: '',
						description: 'Recipient name printed on the address',
					},
					{
						displayName: 'Label',
						name: 'label',
						type: 'string',
						default: 'Work',
						description: 'Label of the address, e.g. Work or Private',
					},
				],
			},
			{
				displayName: 'URL',
				name: 'urls',
				values: [
					{
						displayName: 'URL',
						name: 'url',
						type: 'string',
						default: '',
						description: 'URL to store',
					},
					{
						displayName: 'Label',
						name: 'label',
						type: 'string',
						default: 'Work',
						description: 'Label of the URL, e.g. Website or LinkedIn',
					},
				],
			},
		],
	};
}

/**
 * Maps the fixed collection value onto `ContactDataInput`. Returns `undefined`
 * when nothing was entered so the key is left out of the mutation input.
 */
export function buildContactDataInput(
	context: IExecuteFunctions,
	itemIndex: number,
): IDataObject | undefined {
	const value = context.getNodeParameter('contactData', itemIndex, {}) as IDataObject;
	const input: IDataObject = {};

	const emails = keepEntriesWith(value.emails, 'address');
	if (emails.length) {
		input.emails = emails;
	}

	const phones = keepEntriesWith(value.phones, 'number');
	if (phones.length) {
		input.phones = phones;
	}

	const postalAddresses = keepEntriesWith(value.postalAddresses, 'address');
	if (postalAddresses.length) {
		input.postalAddresses = postalAddresses;
	}

	const urls = keepEntriesWith(value.urls, 'url');
	if (urls.length) {
		input.urls = urls;
	}

	return Object.keys(input).length ? input : undefined;
}

/** Keeps entries whose required key holds a non-empty value, dropping empty ones. */
function keepEntriesWith(entries: unknown, requiredKey: string): IDataObject[] {
	if (!Array.isArray(entries)) {
		return [];
	}

	return (entries as IDataObject[])
		.filter((entry) => entry[requiredKey] !== undefined && entry[requiredKey] !== '')
		.map((entry) => {
			const cleaned: IDataObject = {};
			for (const [key, entryValue] of Object.entries(entry)) {
				if (entryValue !== undefined && entryValue !== null && entryValue !== '') {
					cleaned[key] = entryValue;
				}
			}
			return cleaned;
		});
}
