"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StarhunterApi = void 0;
class StarhunterApi {
    constructor() {
        this.name = 'starhunterApi';
        this.displayName = 'Starhunter API';
        this.documentationUrl = 'https://your-instance.starhunter.software/Api/docs';
        this.icon = 'file:starhunter.svg';
        this.properties = [
            {
                displayName: 'Base URL',
                name: 'baseUrl',
                type: 'string',
                default: 'https://your-instance.starhunter.software',
                required: true,
                placeholder: 'https://your-instance.starhunter.software',
                description: 'The base URL of your Starhunter instance',
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
        this.authenticate = {
            type: 'generic',
            properties: {
                headers: {
                    Authorization: '=Bearer {{$credentials.accessToken}}',
                },
            },
        };
        this.test = {
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
}
exports.StarhunterApi = StarhunterApi;
//# sourceMappingURL=StarhunterApi.credentials.js.map