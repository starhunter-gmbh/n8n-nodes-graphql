import { NodeConnectionTypes, type INodeType, type INodeTypeDescription } from 'n8n-workflow';
import { userDescription } from './resources/user';
import { companyDescription } from './resources/company';

export class StarhunterBirthdays implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Starhunter Birthdays',
		name: 'starhunterBirthdays',
		icon: { light: 'file:starhunterBirthdays.svg', dark: 'file:starhunterBirthdays.dark.svg' },
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Interact with the Starhunter Birthdays API',
		defaults: {
			name: 'Starhunter Birthdays',
		},
		usableAsTool: true,
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		credentials: [{ name: 'starhunterBirthdaysApi', required: true }],
		requestDefaults: {
			baseURL: 'https://release-current.starhunter.software/Api/graphql',
			headers: {
				Accept: 'application/json',
				'Content-Type': 'application/json',
			},
		},
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'User',
						value: 'user',
					},
					{
						name: 'Company',
						value: 'company',
					},
				],
				default: 'user',
			},
			...userDescription,
			...companyDescription,
		],
	};
}
