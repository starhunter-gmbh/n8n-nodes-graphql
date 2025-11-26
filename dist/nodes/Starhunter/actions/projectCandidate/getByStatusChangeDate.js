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
        required: true,
        placeholder: 'e.g., Ident',
        description: 'The candidate status to filter by',
        displayOptions: {
            show: {
                resource: ['projectCandidate'],
                operation: ['getByStatusChangeDate'],
            },
        },
    },
    {
        displayName: 'Days Ago',
        name: 'daysAgo',
        type: 'number',
        default: 7,
        required: true,
        description: 'Number of days ago the status change should have occurred',
        typeOptions: {
            minValue: 0,
        },
        displayOptions: {
            show: {
                resource: ['projectCandidate'],
                operation: ['getByStatusChangeDate'],
            },
        },
    },
];
function getDateXDaysAgo(days) {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date.toISOString().substring(0, 10);
}
async function execute(context, itemIndex, baseUrl) {
    var _a, _b;
    const status = context.getNodeParameter('status', itemIndex);
    const daysAgo = context.getNodeParameter('daysAgo', itemIndex);
    const targetDate = getDateXDaysAgo(daysAgo);
    const query = `
		query getStatuses($status: String) {
			projectCandidates(status: $status) {
				status
				rejectionReason
				changeDate
				person {
					name
					email
				}
			}
		}
	`;
    const variables = { status };
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
    const candidates = ((_b = response.data) === null || _b === void 0 ? void 0 : _b.projectCandidates) || [];
    return candidates.filter((candidate) => {
        const changeDate = candidate.changeDate;
        if (!changeDate)
            return false;
        return new Date(changeDate).toISOString().substring(0, 10) === targetDate;
    });
}
//# sourceMappingURL=getByStatusChangeDate.js.map