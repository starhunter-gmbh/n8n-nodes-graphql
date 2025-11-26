"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.Starhunter = void 0;
const n8n_workflow_1 = require("n8n-workflow");
const candidate = __importStar(require("./actions/candidate"));
const email = __importStar(require("./actions/email"));
const employee = __importStar(require("./actions/employee"));
const person = __importStar(require("./actions/person"));
const projectCandidate = __importStar(require("./actions/projectCandidate"));
const task = __importStar(require("./actions/task"));
class Starhunter {
    constructor() {
        this.description = {
            displayName: 'Starhunter',
            name: 'starhunter',
            icon: 'file:starhunter.svg',
            group: ['transform'],
            version: 1,
            subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
            description: 'Interact with Starhunter',
            defaults: {
                name: 'Starhunter',
            },
            usableAsTool: true,
            inputs: [n8n_workflow_1.NodeConnectionTypes.Main],
            outputs: [n8n_workflow_1.NodeConnectionTypes.Main],
            credentials: [{ name: 'starhunterApi', required: true }],
            properties: [
                {
                    displayName: 'Resource',
                    name: 'resource',
                    type: 'options',
                    noDataExpression: true,
                    options: [
                        {
                            name: 'Candidate',
                            value: 'candidate',
                        },
                        {
                            name: 'Email',
                            value: 'email',
                        },
                        {
                            name: 'Employee',
                            value: 'employee',
                        },
                        {
                            name: 'Person',
                            value: 'person',
                        },
                        {
                            name: 'Project Candidate',
                            value: 'projectCandidate',
                        },
                        {
                            name: 'Task',
                            value: 'task',
                        },
                    ],
                    default: 'person',
                },
                {
                    displayName: 'Operation',
                    name: 'operation',
                    type: 'options',
                    noDataExpression: true,
                    displayOptions: {
                        show: {
                            resource: ['person'],
                        },
                    },
                    options: [
                        {
                            name: 'Get Birthdays',
                            value: 'getBirthdays',
                            action: 'Get persons with birthdays on a date',
                            description: 'Get all persons with birthdays on a specific date',
                        },
                        {
                            name: 'Get by ID',
                            value: 'getById',
                            action: 'Get a person by ID',
                            description: 'Retrieve a single person by their ID',
                        },
                        {
                            name: 'Search',
                            value: 'search',
                            action: 'Search persons',
                            description: 'Search for persons by name',
                        },
                    ],
                    default: 'getBirthdays',
                },
                {
                    displayName: 'Operation',
                    name: 'operation',
                    type: 'options',
                    noDataExpression: true,
                    displayOptions: {
                        show: {
                            resource: ['candidate'],
                        },
                    },
                    options: [
                        {
                            name: 'Search',
                            value: 'search',
                            action: 'Search candidates',
                            description: 'Search for candidates by ID, name, or birth date',
                        },
                    ],
                    default: 'search',
                },
                {
                    displayName: 'Operation',
                    name: 'operation',
                    type: 'options',
                    noDataExpression: true,
                    displayOptions: {
                        show: {
                            resource: ['employee'],
                        },
                    },
                    options: [
                        {
                            name: 'Get Current User',
                            value: 'getCurrent',
                            action: 'Get current authenticated user',
                            description: 'Get the employee record for the authenticated user',
                        },
                        {
                            name: 'Search',
                            value: 'search',
                            action: 'Search employees',
                            description: 'Search for employees by ID or name',
                        },
                    ],
                    default: 'search',
                },
                {
                    displayName: 'Operation',
                    name: 'operation',
                    type: 'options',
                    noDataExpression: true,
                    displayOptions: {
                        show: {
                            resource: ['email'],
                        },
                    },
                    options: [
                        {
                            name: 'Log Email',
                            value: 'log',
                            action: 'Log an email activity',
                            description: 'Log an email activity in Starhunter',
                        },
                    ],
                    default: 'log',
                },
                {
                    displayName: 'Operation',
                    name: 'operation',
                    type: 'options',
                    noDataExpression: true,
                    displayOptions: {
                        show: {
                            resource: ['projectCandidate'],
                        },
                    },
                    options: [
                        {
                            name: 'Get By Status Change Date',
                            value: 'getByStatusChangeDate',
                            action: 'Get candidates by status change date',
                            description: 'Get project candidates whose status changed X days ago',
                        },
                    ],
                    default: 'getByStatusChangeDate',
                },
                {
                    displayName: 'Operation',
                    name: 'operation',
                    type: 'options',
                    noDataExpression: true,
                    displayOptions: {
                        show: {
                            resource: ['task'],
                        },
                    },
                    options: [
                        {
                            name: 'Create',
                            value: 'create',
                            action: 'Create a task',
                            description: 'Create a new task in Starhunter',
                        },
                    ],
                    default: 'create',
                },
                ...candidate.search.description,
                ...email.log.description,
                ...employee.getCurrent.description,
                ...employee.search.description,
                ...person.getBirthdays.description,
                ...person.getById.description,
                ...person.search.description,
                ...projectCandidate.getByStatusChangeDate.description,
                ...task.create.description,
            ],
        };
    }
    async execute() {
        const items = this.getInputData();
        const returnData = [];
        const credentials = await this.getCredentials('starhunterApi');
        const baseUrl = `${credentials.baseUrl}/Api/graphql`;
        for (let i = 0; i < items.length; i++) {
            try {
                const resource = this.getNodeParameter('resource', i);
                const operation = this.getNodeParameter('operation', i);
                if (resource === 'candidate' && operation === 'search') {
                    const result = await candidate.search.execute(this, i, baseUrl);
                    for (const item of result) {
                        returnData.push({
                            json: item,
                            pairedItem: { item: i },
                        });
                    }
                }
                else if (resource === 'email' && operation === 'log') {
                    const result = await email.log.execute(this, i, baseUrl);
                    returnData.push({
                        json: result,
                        pairedItem: { item: i },
                    });
                }
                else if (resource === 'employee' && operation === 'getCurrent') {
                    const result = await employee.getCurrent.execute(this, i, baseUrl);
                    if (result) {
                        returnData.push({
                            json: result,
                            pairedItem: { item: i },
                        });
                    }
                }
                else if (resource === 'employee' && operation === 'search') {
                    const result = await employee.search.execute(this, i, baseUrl);
                    for (const item of result) {
                        returnData.push({
                            json: item,
                            pairedItem: { item: i },
                        });
                    }
                }
                else if (resource === 'person' && operation === 'getBirthdays') {
                    const result = await person.getBirthdays.execute(this, i, baseUrl);
                    for (const item of result) {
                        returnData.push({
                            json: item,
                            pairedItem: { item: i },
                        });
                    }
                }
                else if (resource === 'person' && operation === 'getById') {
                    const result = await person.getById.execute(this, i, baseUrl);
                    if (result) {
                        returnData.push({
                            json: result,
                            pairedItem: { item: i },
                        });
                    }
                }
                else if (resource === 'person' && operation === 'search') {
                    const result = await person.search.execute(this, i, baseUrl);
                    for (const item of result) {
                        returnData.push({
                            json: item,
                            pairedItem: { item: i },
                        });
                    }
                }
                else if (resource === 'projectCandidate' && operation === 'getByStatusChangeDate') {
                    const result = await projectCandidate.getByStatusChangeDate.execute(this, i, baseUrl);
                    for (const item of result) {
                        returnData.push({
                            json: item,
                            pairedItem: { item: i },
                        });
                    }
                }
                else if (resource === 'task' && operation === 'create') {
                    const result = await task.create.execute(this, i, baseUrl);
                    if (result) {
                        returnData.push({
                            json: result,
                            pairedItem: { item: i },
                        });
                    }
                }
            }
            catch (error) {
                if (this.continueOnFail()) {
                    returnData.push({
                        json: { error: error.message },
                        pairedItem: { item: i },
                    });
                    continue;
                }
                throw error;
            }
        }
        return [returnData];
    }
}
exports.Starhunter = Starhunter;
//# sourceMappingURL=Starhunter.node.js.map