import {
	NodeConnectionTypes,
	type IExecuteFunctions,
	type INodeExecutionData,
	type INodeType,
	type INodeTypeDescription,
} from 'n8n-workflow';

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
		description: 'Interact with Starhunter CRM',
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
				],
				default: 'getBirthdays',
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
			...person.getBirthdays.description,
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

				if (resource === 'person' && operation === 'getBirthdays') {
					const result = await person.getBirthdays.execute(this, i, baseUrl);
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
