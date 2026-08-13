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
import * as project from './actions/project';
import * as projectCandidate from './actions/projectCandidate';
import * as task from './actions/task';
import { executeOperation, operationDescriptions } from './actions/router';

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
						name: 'Company',
						value: 'company',
					},
					{
						name: 'Contact Person',
						value: 'contactPerson',
					},
					{
						name: 'Customer',
						value: 'customer',
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
						name: 'File',
						value: 'file',
					},
					{
						name: 'Interview',
						value: 'interview',
					},
					{
						name: 'Invoice',
						value: 'invoice',
					},
					{
						name: 'Person',
						value: 'person',
					},
					{
						name: 'Presentation',
						value: 'presentation',
					},
					{
						name: 'Project',
						value: 'project',
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
						name: 'Create',
						value: 'create',
						action: 'Create a person',
						description: 'Create a new person with optional contact data',
					},
					{
						name: 'Delete Contact Data',
						value: 'deleteContactData',
						action: 'Delete contact data of a contactable',
						description: 'Delete a contact data value by its value, no internal IDs needed',
					},
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
					{
						name: 'Update',
						value: 'update',
						action: 'Update a person',
						description: 'Update the master data of an existing person',
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
						name: 'Create',
						value: 'create',
						action: 'Create a candidate',
						description: 'Create a new candidate including the linked person',
					},
					{
						name: 'Parse CV',
						value: 'parseCv',
						action: 'Parse a CV',
						description: 'Extract candidate data from a CV file without storing it',
					},
					{
						name: 'Search',
						value: 'search',
						action: 'Search candidates',
						description: 'Search for candidates by ID, name, or birth date',
					},
					{
						name: 'Set Responsible Person',
						value: 'setResponsiblePerson',
						action: 'Set the responsible person of a candidate',
						description: 'Assign an employee as responsible for a candidate',
					},
					{
						name: 'Update',
						value: 'update',
						action: 'Update a candidate',
						description: 'Update curated fields of an existing candidate',
					},
				],
				default: 'search',
			},

			// Company operations
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['company'],
					},
				},
				options: [
					{
						name: 'Create',
						value: 'create',
						action: 'Create a company',
						description: 'Create a new company with optional contact data',
					},
					{
						name: 'Update',
						value: 'update',
						action: 'Update a company',
						description: 'Update curated master data of an existing company',
					},
				],
				default: 'create',
			},

			// Contact Person operations
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['contactPerson'],
					},
				},
				options: [
					{
						name: 'Create',
						value: 'create',
						action: 'Create a contact person',
						description: 'Create a person tagged as a contact person',
					},
					{
						name: 'Create Contactable',
						value: 'createContactable',
						action: 'Create a contactable person',
						description: 'Create a person without assigning the contact person tag',
					},
				],
				default: 'create',
			},

			// Customer operations
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['customer'],
					},
				},
				options: [
					{
						name: 'Create',
						value: 'create',
						action: 'Create a customer',
						description: 'Turn an existing company into a customer',
					},
					{
						name: 'Update',
						value: 'update',
						action: 'Update a customer',
						description: 'Update the company name behind an existing customer',
					},
				],
				default: 'create',
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
						name: 'Create',
						value: 'create',
						action: 'Create an employee',
						description: 'Create a new employee including the linked person',
					},
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
					{
						name: 'Send Contact Email',
						value: 'sendContact',
						action: 'Send a contact email',
						description:
							'Send an email to the contacts of a record and file the activity on that record',
					},
					{
						name: 'Send Email',
						value: 'send',
						action: 'Send an email',
						description: 'Send an email through a user or system mailbox',
					},
				],
				default: 'log',
			},

			// File operations
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['file'],
					},
				},
				options: [
					{
						name: 'Get',
						value: 'get',
						action: 'Get file metadata',
						description: 'Get the metadata of a single file by ID',
					},
					{
						name: 'Search',
						value: 'search',
						action: 'Search files',
						description: 'Search files by name, extracted content and tags',
					},
					{
						name: 'Upload',
						value: 'upload',
						action: 'Upload a file',
						description: 'Upload a file and optionally link it to a record',
					},
				],
				default: 'search',
			},

			// Interview operations
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['interview'],
					},
				},
				options: [
					{
						name: 'Create',
						value: 'create',
						action: 'Create an interview',
						description: 'Create an interview for a candidate in a project',
					},
					{
						name: 'Search',
						value: 'search',
						action: 'Search interviews',
						description: 'Search interviews by candidate or project',
					},
				],
				default: 'create',
			},

			// Invoice operations
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['invoice'],
					},
				},
				options: [
					{
						name: 'Create',
						value: 'create',
						action: 'Create an invoice',
						description:
							'Create an invoice draft with positions. Requires the Finance.Accounting module.',
					},
					{
						name: 'Search',
						value: 'search',
						action: 'Search invoices',
						description: 'Search invoices by project, company or status',
					},
				],
				default: 'search',
			},

			// Presentation operations
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['presentation'],
					},
				},
				options: [
					{
						name: 'Set Status',
						value: 'setStatus',
						action: 'Set the status of a presentation',
						description: 'Set the presentation status and write a status history entry',
					},
				],
				default: 'setStatus',
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
						name: 'Add to Project',
						value: 'add',
						action: 'Add candidate to project',
						description: 'Add a candidate to a project with optional status',
					},
					{
						name: 'Get By Status Change Date',
						value: 'getByStatusChangeDate',
						action: 'Get candidates by status change date',
						description: 'Get project candidates whose status changed X days ago',
					},
					{
						name: 'Update Status',
						value: 'updateStatus',
						action: 'Update presentation status',
						description: 'Update the status of a presentation with optional comment',
					},
				],
				default: 'add',
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
					{
						name: 'Delete',
						value: 'delete',
						action: 'Delete a task',
						description: 'Delete an existing task',
					},
					{
						name: 'Search',
						value: 'search',
						action: 'Search tasks',
						description: 'Search tasks by target, assignee or status',
					},
					{
						name: 'Update',
						value: 'update',
						action: 'Update a task',
						description: 'Update an existing task, e.g. to mark it as done',
					},
				],
				default: 'create',
			},

			// Project operations
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['project'],
					},
				},
				options: [
					{
						name: 'Add Contact Person',
						value: 'addContactPerson',
						action: 'Add a contact person to a project',
						description: 'Link a contact person to an existing project',
					},
					{
						name: 'Add Team Member',
						value: 'addTeamMember',
						action: 'Add a team member to a project',
						description: 'Link an employee to a project with a role',
					},
					{
						name: 'Create',
						value: 'create',
						action: 'Create a project',
						description: 'Create a new project',
					},
					{
						name: 'Search',
						value: 'search',
						action: 'Search projects',
						description: 'Search for projects by status',
					},
					{
						name: 'Set Company',
						value: 'setCompany',
						action: 'Set the company of a project',
						description: 'Link the client company to an existing project',
					},
					{
						name: 'Set Portal Settings',
						value: 'setPortalSettings',
						action: 'Set the portal settings of a project',
						description: 'Control the job portal publication of a project',
					},
					{
						name: 'Update',
						value: 'update',
						action: 'Update a project',
						description: 'Update curated fields of an existing project',
					},
				],
				default: 'search',
			},

			// Action-specific fields
			...candidate.search.description,
			...email.log.description,
			...employee.getCurrent.description,
			...employee.search.description,
			...person.getBirthdays.description,
			...person.getById.description,
			...person.search.description,
			...project.search.description,
			...projectCandidate.add.description,
			...projectCandidate.getByStatusChangeDate.description,
			...projectCandidate.updateStatus.description,
			...task.create.description,
			...operationDescriptions,
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
				} else if (resource === 'project' && operation === 'search') {
					const result = await project.search.execute(this, i, baseUrl);
					for (const item of result) {
						returnData.push({
							json: item,
							pairedItem: { item: i },
						});
					}
				} else if (resource === 'projectCandidate' && operation === 'add') {
					const result = await projectCandidate.add.execute(this, i, baseUrl);
					if (result) {
						returnData.push({
							json: result,
							pairedItem: { item: i },
						});
					}
				} else if (resource === 'projectCandidate' && operation === 'updateStatus') {
					const result = await projectCandidate.updateStatus.execute(this, i, baseUrl);
					if (result) {
						returnData.push({
							json: result,
							pairedItem: { item: i },
						});
					}
				} else {
					const result = await executeOperation(this, i, baseUrl, resource, operation);
					for (const item of result ?? []) {
						returnData.push({
							json: item,
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
