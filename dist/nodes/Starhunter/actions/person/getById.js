"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.description = void 0;
exports.execute = execute;
const n8n_workflow_1 = require("n8n-workflow");
exports.description = [
    {
        displayName: 'Person ID',
        name: 'personId',
        type: 'string',
        default: '',
        required: true,
        description: 'The ID of the person to retrieve',
        displayOptions: {
            show: {
                resource: ['person'],
                operation: ['getById'],
            },
        },
    },
];
async function execute(context, itemIndex, baseUrl) {
    var _a, _b;
    const personId = context.getNodeParameter('personId', itemIndex);
    const query = `
		query GetPerson($id: Id!) {
			person(id: $id) {
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
    const variables = { id: personId };
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
    return ((_b = response.data) === null || _b === void 0 ? void 0 : _b.person) || null;
}
//# sourceMappingURL=getById.js.map