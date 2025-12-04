"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.description = void 0;
exports.execute = execute;
const n8n_workflow_1 = require("n8n-workflow");
exports.description = [
    {
        displayName: 'Status',
        name: 'status',
        type: 'string',
        default: '',
        description: 'Filter by project status (e.g., "Suche")',
        displayOptions: {
            show: {
                resource: ['project'],
                operation: ['search'],
            },
        },
    },
    {
        displayName: 'Limit',
        name: 'limit',
        type: 'number',
        default: 50,
        description: 'Max number of results to return',
        typeOptions: {
            minValue: 1,
            maxValue: 1000,
        },
        displayOptions: {
            show: {
                resource: ['project'],
                operation: ['search'],
            },
        },
    },
    {
        displayName: 'Offset',
        name: 'offset',
        type: 'number',
        default: 0,
        description: 'Number of results to skip for pagination',
        typeOptions: {
            minValue: 0,
        },
        displayOptions: {
            show: {
                resource: ['project'],
                operation: ['search'],
            },
        },
    },
];
async function execute(context, itemIndex, baseUrl) {
    var _a, _b;
    const status = context.getNodeParameter('status', itemIndex);
    const limit = context.getNodeParameter('limit', itemIndex);
    const offset = context.getNodeParameter('offset', itemIndex);
    const query = `
		query SearchProjects($status: String, $limit: Int, $offset: Int) {
			projects(status: $status, limit: $limit, offset: $offset) {
				id
				name
				createdAt
				updatedAt
				status
				position
				startDate
				endDate
				candidateCount
				company
			}
		}
	`;
    const variables = {
        status: status || undefined,
        limit,
        offset,
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
    return ((_b = response.data) === null || _b === void 0 ? void 0 : _b.projects) || [];
}
//# sourceMappingURL=search.js.map