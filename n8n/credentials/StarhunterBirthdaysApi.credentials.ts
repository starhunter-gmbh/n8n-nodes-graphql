import type {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class StarhunterBirthdaysApi implements ICredentialType {
	name = 'starhunterBirthdaysApi';

	displayName = 'Starhunter API';

	documentationUrl = 'https://docs.starhunter.software/api';

	icon = { light: 'file:starhunterBirthdays.svg', dark: 'file:starhunterBirthdays.dark.svg' } as const;

	properties: INodeProperties[] = [
		{
			displayName: 'Base URL',
			name: 'baseUrl',
			type: 'string',
			default: 'https://release-current.starhunter.software/Api/graphql',
			required: true,
			description: 'The GraphQL endpoint URL of your Starhunter instance',
		},
		{
			displayName: 'Access Token',
			name: 'accessToken',
			type: 'string',
			typeOptions: { password: true },
			required: true,
			default: '',
			description: 'Your Starhunter API access token',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				Authorization: '=Bearer {{$credentials.accessToken}}',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			method: 'POST',
			baseURL: '={{$credentials.baseUrl}}',
			url: '',
			body: {
				query: '{ __typename }',
			},
			headers: {
				'Content-Type': 'application/json',
			},
		},
	};
}
