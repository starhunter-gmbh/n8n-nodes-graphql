import {
	NodeConnectionTypes,
	type IExecuteFunctions,
	type INodeExecutionData,
	type INodeType,
	type INodeTypeDescription,
} from 'n8n-workflow';

import * as candidate from './actions/candidate';
import * as email from './actions/email';
import * as employee from './actions/employee';
import * as person from './actions/person';
import * as projectCandidate from './actions/projectCandidate';
import * as task from './actions/task';

export class Starhunter implements INodeType {
	description: INodeTypeDescription = {
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
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		credentials: [{ name: 'starhunterApi', required: true }],
		properties: [
			// Resource selector
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

			// Person operations
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

			// Candidate operations
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

			// Employee operations
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

			// Email operations
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

			// Project Candidate operations
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

			// Task operations
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

			// Action-specific fields
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

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		const credentials = await this.getCredentials('starhunterApi');
		const baseUrl = `${credentials.baseUrl}/Api/graphql`;

		for (let i = 0; i < items.length; i++) {
			try {
				const resource = this.getNodeParameter('resource', i) as string;
				const operation = this.getNodeParameter('operation', i) as string;

				if (resource === 'candidate' && operation === 'search') {
					const result = await candidate.search.execute(this, i, baseUrl);
					for (const item of result) {
						returnData.push({
							json: item,
							pairedItem: { item: i },
						});
					}
				} else if (resource === 'email' && operation === 'log') {
					const result = await email.log.execute(this, i, baseUrl);
					returnData.push({
						json: result,
						pairedItem: { item: i },
					});
				} else if (resource === 'employee' && operation === 'getCurrent') {
					const result = await employee.getCurrent.execute(this, i, baseUrl);
					if (result) {
						returnData.push({
							json: result,
							pairedItem: { item: i },
						});
					}
				} else if (resource === 'employee' && operation === 'search') {
					const result = await employee.search.execute(this, i, baseUrl);
					for (const item of result) {
						returnData.push({
							json: item,
							pairedItem: { item: i },
						});
					}
				} else if (resource === 'person' && operation === 'getBirthdays') {
					const result = await person.getBirthdays.execute(this, i, baseUrl);
					for (const item of result) {
						returnData.push({
							json: item,
							pairedItem: { item: i },
						});
					}
				} else if (resource === 'person' && operation === 'getById') {
					const result = await person.getById.execute(this, i, baseUrl);
					if (result) {
						returnData.push({
							json: result,
							pairedItem: { item: i },
						});
					}
				} else if (resource === 'person' && operation === 'search') {
					const result = await person.search.execute(this, i, baseUrl);
					for (const item of result) {
						returnData.push({
							json: item,
							pairedItem: { item: i },
						});
					}
				} else if (resource === 'projectCandidate' && operation === 'getByStatusChangeDate') {
					const result = await projectCandidate.getByStatusChangeDate.execute(this, i, baseUrl);
					for (const item of result) {
						returnData.push({
							json: item,
							pairedItem: { item: i },
						});
					}
				} else if (resource === 'task' && operation === 'create') {
					const result = await task.create.execute(this, i, baseUrl);
					if (result) {
						returnData.push({
							json: result,
							pairedItem: { item: i },
						});
					}
				}
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({
						json: { error: (error as Error).message },
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
