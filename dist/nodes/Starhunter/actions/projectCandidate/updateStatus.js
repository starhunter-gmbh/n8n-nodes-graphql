"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.description = void 0;
exports.execute = execute;
const n8n_workflow_1 = require("n8n-workflow");
exports.description = [
    {
        displayName: 'Presentation ID',
        name: 'presentationId',
        type: 'string',
        default: '',
        required: true,
        description: 'The ID of the presentation',
        displayOptions: {
            show: {
                resource: ['projectCandidate'],
                operation: ['updateStatus'],
            },
        },
    },
    {
        displayName: 'Status',
        name: 'status',
        type: 'string',
        default: '',
        required: true,
        description: 'The new status value',
        displayOptions: {
            show: {
                resource: ['projectCandidate'],
                operation: ['updateStatus'],
            },
        },
    },
    {
        displayName: 'Comment',
        name: 'comment',
        type: 'string',
        typeOptions: {
            rows: 4,
        },
        default: '',
        description: 'Optional comment about the status change',
        displayOptions: {
            show: {
                resource: ['projectCandidate'],
                operation: ['updateStatus'],
            },
        },
    },
];
async function execute(context, itemIndex, baseUrl) {
    var _a, _b;
    const presentationId = context.getNodeParameter('presentationId', itemIndex);
    const status = context.getNodeParameter('status', itemIndex);
    const comment = context.getNodeParameter('comment', itemIndex);
    const query = `
		mutation UpdatePresentationStatus(
			$presentationId: Id!
			$status: String!
			$comment: String
		) {
			updatePresentationStatus(
				presentationId: $presentationId
				status: $status
				comment: $comment
			) {
				id
				status
				updatedAt
			}
		}
	`;
    const variables = {
        presentationId,
        status,
        comment: comment || undefined,
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
    return ((_b = response.data) === null || _b === void 0 ? void 0 : _b.updatePresentationStatus) || null;
}
//# sourceMappingURL=updateStatus.js.map