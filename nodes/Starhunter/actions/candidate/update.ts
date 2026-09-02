import type { IDataObject, IExecuteFunctions, INodeProperties } from 'n8n-workflow';

import { buildContactDataInput, contactDataProperty } from '../../helpers/contactData';
import { showFor } from '../../helpers/displayOptions';
import { CANDIDATE_FIELDS } from '../../transport/fragments';
import { compactInput, starhunterGraphqlRequest } from '../../transport/graphql';

export const description: INodeProperties[] = [
	{
		displayName: 'Candidate ID',
		name: 'candidateId',
		type: 'string',
		default: '',
		required: true,
		description: 'ID of the candidate (person ID) to update',
		displayOptions: showFor('candidate', 'update'),
	},
	{
		displayName: 'Update Fields',
		name: 'updateFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		description:
			'Curated candidate fields. Compensation, ratings and internal fields are intentionally not writable through this mutation.',
		displayOptions: showFor('candidate', 'update'),
		options: [
			{
				displayName: 'Academic Title',
				name: 'academicTitle',
				type: 'string',
				default: '',
				description: 'Academic title of the candidate, e.g. Dr',
			},
			{
				displayName: 'Availability Date',
				name: 'availabilityDate',
				type: 'string',
				default: '',
				placeholder: 'YYYY-MM-DD',
				description: 'Date the candidate becomes available',
			},
			{
				displayName: 'Available From',
				name: 'availableFrom',
				type: 'string',
				default: '',
				placeholder: 'YYYY-MM-DD',
				description: 'Start of the availability window',
			},
			{
				displayName: 'Birth Date',
				name: 'birthdate',
				type: 'string',
				default: '',
				placeholder: 'YYYY-MM-DD',
				description: 'Birth date of the candidate',
			},
			{
				displayName: 'Company Name',
				name: 'companyName',
				type: 'string',
				default: '',
				description: 'Current employer of the candidate',
			},
			{
				displayName: 'Current Location',
				name: 'currentLocation',
				type: 'string',
				default: '',
				description: 'Current location of the candidate',
			},
			{
				displayName: 'Employment Factor Max',
				name: 'employmentFactorMax',
				type: 'number',
				default: 1,
				description: 'Maximum employment factor, e.g. 1 for full time',
			},
			{
				displayName: 'Employment Factor Min',
				name: 'employmentFactorMin',
				type: 'number',
				default: 0,
				description: 'Minimum employment factor, e.g. 0.5 for half time',
			},
			{
				displayName: 'Family Status',
				name: 'familyStatus',
				type: 'string',
				default: '',
				description: 'Family status of the candidate',
			},
			{
				displayName: 'First Name',
				name: 'firstName',
				type: 'string',
				default: '',
				description: 'First name of the candidate',
			},
			{
				displayName: 'Gender',
				name: 'gender',
				type: 'string',
				default: '',
				description: 'Gender of the candidate',
			},
			{
				displayName: 'Graduation',
				name: 'graduation',
				type: 'string',
				default: '',
				description: 'Highest graduation of the candidate',
			},
			{
				displayName: 'Job Experience',
				name: 'jobExperience',
				type: 'number',
				default: 0,
				description: 'Years of job experience',
			},
			{
				displayName: 'Last Name',
				name: 'lastName',
				type: 'string',
				default: '',
				description: 'Last name of the candidate',
			},
			{
				displayName: 'LinkedIn URL',
				name: 'linkedinUrl',
				type: 'string',
				default: '',
				description: 'LinkedIn profile URL of the candidate',
			},
			{
				displayName: 'Managerial Responsibility',
				name: 'managerialResponsibility',
				type: 'number',
				default: 0,
				description: 'Number of people the candidate is responsible for',
			},
			{
				displayName: 'Middle Name',
				name: 'middleName',
				type: 'string',
				default: '',
				description: 'Middle name of the candidate',
			},
			{
				displayName: 'Notice Period',
				name: 'noticePeriod',
				type: 'string',
				default: '',
				description: 'Notice period of the candidate',
			},
			{
				displayName: 'Notice Period Unit',
				name: 'noticePeriodUnit',
				type: 'string',
				default: '',
				description: 'Unit of the notice period, e.g. months',
			},
			{
				displayName: 'Numeric Notice Period',
				name: 'numericNoticePeriod',
				type: 'number',
				default: 0,
				description: 'Notice period as a number, used for sorting and filtering',
			},
			{
				displayName: 'Opt-In',
				name: 'optin',
				type: 'boolean',
				default: false,
				description: 'Whether the candidate has given their data protection opt-in',
			},
			{
				displayName: 'Opt-In Valid Until',
				name: 'optinValidUntilDate',
				type: 'string',
				default: '',
				placeholder: 'YYYY-MM-DD',
				description: 'Date the opt-in expires',
			},
			{
				displayName: 'Profession',
				name: 'profession',
				type: 'string',
				default: '',
				description: 'Profession of the candidate',
			},
			{
				displayName: 'Salutation',
				name: 'salutation',
				type: 'string',
				default: '',
				description: 'Salutation of the candidate, e.g. Frau or Herr',
			},
			{
				displayName: 'Short Profile',
				name: 'shortProfile',
				type: 'string',
				typeOptions: {
					rows: 4,
				},
				default: '',
				description: 'Short profile text of the candidate',
			},
			{
				displayName: 'Source',
				name: 'source',
				type: 'string',
				default: '',
				description: 'Source the candidate was acquired from',
			},
			{
				displayName: 'Status',
				name: 'status',
				type: 'options',
				typeOptions: {
					loadOptionsMethod: 'getCandidateStatuses',
				},
				default: '',
				description:
					'Candidate status. The values are read from the connected instance, whose candidate status options are customer-specific. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
			},
			{
				displayName: 'Website',
				name: 'website',
				type: 'string',
				default: '',
				description: 'Website of the candidate',
			},
			{
				displayName: 'Xing URL',
				name: 'xingUrl',
				type: 'string',
				default: '',
				description: 'Xing profile URL of the candidate',
			},
		],
	},
	contactDataProperty('candidate', 'update'),
];

export async function execute(
	context: IExecuteFunctions,
	itemIndex: number,
	baseUrl: string,
): Promise<IDataObject | null> {
	const updateFields = context.getNodeParameter('updateFields', itemIndex, {}) as IDataObject;

	const input: IDataObject = {
		id: context.getNodeParameter('candidateId', itemIndex) as string,
		...compactInput({
			...updateFields,
			contactData: buildContactDataInput(context, itemIndex),
		}),
	};

	const query = /* GraphQL */ `
		mutation CandidateUpdate($input: CandidateUpdateInput!) {
			candidateUpdate(input: $input) {
				${CANDIDATE_FIELDS}
			}
		}
	`;

	const data = await starhunterGraphqlRequest(context, baseUrl, query, { input });

	return (data.candidateUpdate as IDataObject) ?? null;
}
