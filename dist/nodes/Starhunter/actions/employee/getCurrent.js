"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.description = void 0;
exports.execute = execute;
const n8n_workflow_1 = require("n8n-workflow");
exports.description = [];
async function execute(context, itemIndex, baseUrl) {
    var _a, _b;
    const query = `
		query GetCurrentUser {
			user {
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
    const requestOptions = {
        method: 'POST',
        url: baseUrl,
        body: { query },
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
    return ((_b = response.data) === null || _b === void 0 ? void 0 : _b.user) || null;
}
//# sourceMappingURL=getCurrent.js.map