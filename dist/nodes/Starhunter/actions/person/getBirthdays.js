"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.description = void 0;
exports.execute = execute;
const n8n_workflow_1 = require("n8n-workflow");
exports.description = [
    {
        displayName: "Use Today's Date",
        name: 'useToday',
        type: 'boolean',
        default: true,
        description: "Whether to use today's date for the birthday search",
        displayOptions: {
            show: {
                resource: ['person'],
                operation: ['getBirthdays'],
            },
        },
    },
    {
        displayName: 'Date',
        name: 'date',
        type: 'string',
        default: '',
        placeholder: 'MM-DD (e.g., 11-25)',
        description: 'The date to search for birthdays (format: MM-DD)',
        displayOptions: {
            show: {
                resource: ['person'],
                operation: ['getBirthdays'],
                useToday: [false],
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
                resource: ['person'],
                operation: ['getBirthdays'],
            },
        },
    },
];
function getTodayMMDD() {
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${month}-${day}`;
}
async function execute(context, itemIndex, baseUrl) {
    var _a, _b;
    const useToday = context.getNodeParameter('useToday', itemIndex);
    const limit = context.getNodeParameter('limit', itemIndex);
    let birthDate;
    if (useToday) {
        birthDate = getTodayMMDD();
    }
    else {
        birthDate = context.getNodeParameter('date', itemIndex);
    }
    const query = `
		query GetBirthdays($date: BirthDate, $limit: Int) {
			persons(birthDate: $date, limit: $limit) {
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
			}
		}
	`;
    const variables = { date: birthDate, limit };
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
    return ((_b = response.data) === null || _b === void 0 ? void 0 : _b.persons) || [];
}
//# sourceMappingURL=getBirthdays.js.map