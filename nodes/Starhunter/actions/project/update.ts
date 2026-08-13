import type { IDataObject, IExecuteFunctions, INodeProperties } from 'n8n-workflow';

import { showFor } from '../../helpers/displayOptions';
import { PROJECT_FIELDS } from '../../transport/fragments';
import { compactInput, starhunterGraphqlRequest } from '../../transport/graphql';

export const description: INodeProperties[] = [
	{
		displayName: 'Project ID',
		name: 'projectId',
		type: 'string',
		default: '',
		required: true,
		description: 'ID of the project to update',
		displayOptions: showFor('project', 'update'),
	},
	{
		displayName: 'Update Fields',
		name: 'updateFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		description:
			'Curated project fields. Billing and controlling fields are intentionally not writable through this mutation.',
		displayOptions: showFor('project', 'update'),
		options: [
			{
				displayName: 'Candidate Benefits',
				name: 'candidateBenefits',
				type: 'string',
				typeOptions: {
					rows: 3,
				},
				default: '',
				description: 'Benefits offered to the candidate',
			},
			{
				displayName: 'Candidates Type',
				name: 'candidatesType',
				type: 'string',
				default: '',
				description: 'Type of candidates searched for',
			},
			{
				displayName: 'Closing Date',
				name: 'closingDate',
				type: 'string',
				default: '',
				placeholder: 'YYYY-MM-DD',
				description: 'Closing date of the job posting',
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
				displayName: 'Employment Type',
				name: 'employmentType',
				type: 'string',
				default: '',
				description: 'Employment type of the position',
			},
			{
				displayName: 'End Date',
				name: 'endDate',
				type: 'string',
				default: '',
				placeholder: 'YYYY-MM-DD',
				description: 'End date of the project',
			},
			{
				displayName: 'Home Office',
				name: 'homeoffice',
				type: 'string',
				default: '',
				description: 'Home office arrangement of the position',
			},
			{
				displayName: 'Job Description',
				name: 'jobDescription',
				type: 'string',
				typeOptions: {
					rows: 4,
				},
				default: '',
				description: 'Job description of the position',
			},
			{
				displayName: 'Job Introduction',
				name: 'jobIntroduction',
				type: 'string',
				typeOptions: {
					rows: 4,
				},
				default: '',
				description: 'Introduction text of the job posting',
			},
			{
				displayName: 'Key Words',
				name: 'keyWords',
				type: 'string',
				default: '',
				description: 'Key words of the project',
			},
			{
				displayName: 'Leadership Experience',
				name: 'leadershipExperience',
				type: 'number',
				default: 0,
				description: 'Required years of leadership experience',
			},
			{
				displayName: 'Level',
				name: 'level',
				type: 'string',
				default: '',
				description: 'Seniority level of the position',
			},
			{
				displayName: 'Limited Employment',
				name: 'limitedEmployment',
				type: 'boolean',
				default: false,
				description: 'Whether the employment is limited in time',
			},
			{
				displayName: 'Limited Employment Until',
				name: 'limitedEmploymentUntil',
				type: 'string',
				default: '',
				placeholder: 'YYYY-MM-DD',
				description: 'End date of the limited employment',
			},
			{
				displayName: 'Location',
				name: 'location',
				type: 'string',
				default: '',
				description: 'Location of the position',
			},
			{
				displayName: 'Location Postal Code',
				name: 'locationPostalCode',
				type: 'string',
				default: '',
				description: 'Postal code of the position location',
			},
			{
				displayName: 'Position',
				name: 'position',
				type: 'string',
				default: '',
				description: 'Position that is being searched for',
			},
			{
				displayName: 'Search Type',
				name: 'searchType',
				type: 'string',
				default: '',
				description: 'Search type of the mandate',
			},
			{
				displayName: 'Source',
				name: 'source',
				type: 'string',
				default: '',
				description: 'Source the project originates from',
			},
			{
				displayName: 'Start Date',
				name: 'startDate',
				type: 'string',
				default: '',
				placeholder: 'YYYY-MM-DD',
				description: 'Start date of the project',
			},
			{
				displayName: 'Start Date From',
				name: 'startDateFrom',
				type: 'string',
				default: '',
				placeholder: 'YYYY-MM-DD',
				description: 'Earliest possible start date',
			},
			{
				displayName: 'Start Date To',
				name: 'startDateTo',
				type: 'string',
				default: '',
				placeholder: 'YYYY-MM-DD',
				description: 'Latest possible start date',
			},
			{
				displayName: 'Status',
				name: 'status',
				type: 'string',
				default: '',
				description:
					'Project status. The API expects one of the customer-specific enum values of the job status attribute.',
			},
			{
				displayName: 'Visibility',
				name: 'visibility',
				type: 'string',
				default: '',
				description: 'Visibility of the project',
			},
		],
	},
];

export async function execute(
	context: IExecuteFunctions,
	itemIndex: number,
	baseUrl: string,
): Promise<IDataObject | null> {
	const updateFields = context.getNodeParameter('updateFields', itemIndex, {}) as IDataObject;

	const input: IDataObject = {
		id: context.getNodeParameter('projectId', itemIndex) as string,
		...compactInput({
			...updateFields,
		}),
	};

	const query = /* GraphQL */ `
		mutation ProjectUpdate($input: ProjectUpdateInput!) {
			projectUpdate(input: $input) {
				${PROJECT_FIELDS}
			}
		}
	`;

	const data = await starhunterGraphqlRequest(context, baseUrl, query, { input });

	return (data.projectUpdate as IDataObject) ?? null;
}
