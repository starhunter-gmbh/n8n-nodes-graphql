"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.description = void 0;
exports.execute = execute;
const n8n_workflow_1 = require("n8n-workflow");
exports.description = [
    {
        displayName: 'Candidate ID',
        name: 'candidateId',
        type: 'string',
        default: '',
        description: 'Search by specific candidate ID',
        displayOptions: {
            show: {
                resource: ['candidate'],
                operation: ['search'],
            },
        },
    },
    {
        displayName: 'Name',
        name: 'name',
        type: 'string',
        default: '',
        description: 'Search by candidate name (partial match)',
        displayOptions: {
            show: {
                resource: ['candidate'],
                operation: ['search'],
            },
        },
    },
    {
        displayName: 'Birth Date',
        name: 'birthDate',
        type: 'string',
        default: '',
        placeholder: 'MM-DD (e.g., 11-25)',
        description: 'Filter by birth date (format: MM-DD)',
        displayOptions: {
            show: {
                resource: ['candidate'],
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
                resource: ['candidate'],
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
                resource: ['candidate'],
                operation: ['search'],
            },
        },
    },
];
async function execute(context, itemIndex, baseUrl) {
    var _a, _b;
    const candidateId = context.getNodeParameter('candidateId', itemIndex);
    const name = context.getNodeParameter('name', itemIndex);
    const birthDate = context.getNodeParameter('birthDate', itemIndex);
    const limit = context.getNodeParameter('limit', itemIndex);
    const offset = context.getNodeParameter('offset', itemIndex);
    const query = `
		query SearchCandidates($candidateId: Id, $birthDate: BirthDate, $name: String, $limit: Int, $offset: Int) {
			candidate(candidateId: $candidateId, birthDate: $birthDate, name: $name, limit: $limit, offset: $offset) {
				id
				name
				firstName
				secondName
				middleName
				academicTitle
				salutation
				email
				birthDate
				phone
				functions
				address
				createdAt
				updatedAt
				contactHistory {
					title
					type
					date
				}
			}
		}
	`;
    const variables = {
        candidateId: candidateId || undefined,
        name: name || undefined,
        birthDate: birthDate || undefined,
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
    return ((_b = response.data) === null || _b === void 0 ? void 0 : _b.candidate) || [];
}
//# sourceMappingURL=search.js.map