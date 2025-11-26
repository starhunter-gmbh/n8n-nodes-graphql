import type { IAuthenticateGeneric, ICredentialTestRequest, ICredentialType, INodeProperties } from 'n8n-workflow';
export declare class StarhunterApi implements ICredentialType {
    name: string;
    displayName: string;
    documentationUrl: string;
    icon: "file:starhunter.svg";
    properties: INodeProperties[];
    authenticate: IAuthenticateGeneric;
    test: ICredentialTestRequest;
}
