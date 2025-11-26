import type {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class StarhunterApi implements ICredentialType {
	name = 'starhunterApi';

	displayName = 'Starhunter API';

	documentationUrl = 'https://docs.starhunter.software/api';

	icon = 'file:starhunter.svg' as const;

	properties: INodeProperties[] = [
		{
			displayName: 'Base URL',
			name: 'baseUrl',
			type: 'string',
			default: 'https://release-current.starhunter.software',
			required: true,
			placeholder: 'https://your-instance.starhunter.software',
			description: 'The base URL of your Starhunter instance (without /Api/graphql)',
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
			url: '/Api/graphql',
			body: {
				query: '{ __typename }',
			},
			headers: {
				'Content-Type': 'application/json',
			},
		},
	};
}
