"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.description = void 0;
exports.execute = execute;
const n8n_workflow_1 = require("n8n-workflow");
exports.description = [
    {
        displayName: 'Project ID',
        name: 'projectId',
        type: 'string',
        default: '',
        required: true,
        description: 'The ID of the project',
        displayOptions: {
            show: {
                resource: ['projectCandidate'],
                operation: ['add'],
            },
        },
    },
    {
        displayName: 'Candidate ID',
        name: 'candidateId',
        type: 'string',
        default: '',
        required: true,
        description: 'The ID of the candidate',
        displayOptions: {
            show: {
                resource: ['projectCandidate'],
                operation: ['add'],
            },
        },
    },
    {
        displayName: 'Status',
        name: 'status',
        type: 'string',
        default: '',
        description: 'Initial status for the project candidate',
        displayOptions: {
            show: {
                resource: ['projectCandidate'],
                operation: ['add'],
            },
        },
    },
];
async function execute(context, itemIndex, baseUrl) {
    var _a, _b;
    const projectId = context.getNodeParameter('projectId', itemIndex);
    const candidateId = context.getNodeParameter('candidateId', itemIndex);
    const status = context.getNodeParameter('status', itemIndex);
    const query = `
		mutation AddCandidateToProject(
			$projectId: Id!
			$candidateId: Id!
			$status: String
		) {
			addCandidateToProject(
				projectId: $projectId
				candidateId: $candidateId
				status: $status
			) {
				id
				status
				changeDate
				rejectionReason
			}
		}
	`;
    const variables = {
        projectId,
        candidateId,
        status: status || undefined,
    };
    const requestOptions = {
        method: 'POST',
        url: baseUrl,
        body: { query, variables },
        headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
        },
        json: true,
    };
    const response = await context.helpers.httpRequestWithAuthentication.call(context, 'starhunterApi', requestOptions);
    if ((_a = response.errors) === null || _a === void 0 ? void 0 : _a.length) {
        throw new n8n_workflow_1.NodeApiError(context.getNode(), response, {
            message: response.errors.map((e) => e.message).join(', '),
        });
    }
    return ((_b = response.data) === null || _b === void 0 ? void 0 : _b.addCandidateToProject) || null;
}
//# sourceMappingURL=add.js.map