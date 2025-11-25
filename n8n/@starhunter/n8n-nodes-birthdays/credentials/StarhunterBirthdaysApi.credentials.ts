import type {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class StarhunterBirthdaysApi implements ICredentialType {
	name = 'starhunterBirthdaysApi';

	displayName = 'Starhunter Birthdays API';

	// Link to your community node's README
	documentationUrl = 'https://github.com/org/@starhunter/-birthdays?tab=readme-ov-file#credentials';

	properties: INodeProperties[] = [
		{
			displayName: 'Access Token',
			name: 'accessToken',
			type: 'string',
			typeOptions: { password: true },
			required: true,
			default: '',
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
			baseURL: 'https://release-current.starhunter.software/Api/graphql',
			url: '/v1/user',
		},
	};
}
