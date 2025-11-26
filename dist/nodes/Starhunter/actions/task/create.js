"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.description = void 0;
exports.execute = execute;
const n8n_workflow_1 = require("n8n-workflow");
exports.description = [
    {
        displayName: 'Title',
        name: 'title',
        type: 'string',
        default: '',
        required: true,
        description: 'The title of the task',
        displayOptions: {
            show: {
                resource: ['task'],
                operation: ['create'],
            },
        },
    },
    {
        displayName: 'Description',
        name: 'taskDescription',
        type: 'string',
        typeOptions: {
            rows: 4,
        },
        default: '',
        description: 'The description of the task',
        displayOptions: {
            show: {
                resource: ['task'],
                operation: ['create'],
            },
        },
    },
    {
        displayName: 'Deadline',
        name: 'deadline',
        type: 'dateTime',
        default: '',
        description: 'The deadline for the task',
        displayOptions: {
            show: {
                resource: ['task'],
                operation: ['create'],
            },
        },
    },
    {
        displayName: 'Assignee ID',
        name: 'assignee',
        type: 'string',
        default: '',
        description: 'The ID of the person to assign the task to',
        displayOptions: {
            show: {
                resource: ['task'],
                operation: ['create'],
            },
        },
    },
    {
        displayName: 'Target ID',
        name: 'target',
        type: 'string',
        default: '',
        description: 'The ID of the target entity for the task',
        displayOptions: {
            show: {
                resource: ['task'],
                operation: ['create'],
            },
        },
    },
];
async function execute(context, itemIndex, baseUrl) {
    var _a, _b;
    const title = context.getNodeParameter('title', itemIndex);
    const taskDescription = context.getNodeParameter('taskDescription', itemIndex);
    const deadline = context.getNodeParameter('deadline', itemIndex);
    const assignee = context.getNodeParameter('assignee', itemIndex);
    const target = context.getNodeParameter('target', itemIndex);
    const query = `
		mutation CreateTask(
			$title: String!
			$description: String
			$deadline: Date
			$assignee: Id
			$target: Id
		) {
			createTask(
				title: $title
				description: $description
				deadline: $deadline
				assignee: $assignee
				target: $target
			) {
				id
				title
				description
				deadline
				assignee
			}
		}
	`;
    const variables = {
        title,
        description: taskDescription || undefined,
        deadline: deadline || undefined,
        assignee: assignee || undefined,
        target: target || undefined,
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
    return ((_b = response.data) === null || _b === void 0 ? void 0 : _b.createTask) || null;
}
//# sourceMappingURL=create.js.map